import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { leerFuente } from "@/domain/adaptadores";

const muestra = (nombre: string) =>
  new Uint8Array(readFileSync(path.join(__dirname, "..", "muestras", nombre)));

describe("adaptador CSV heredado", () => {
  const r = leerFuente("sistema_antiguo_contribuyentes.csv", muestra("sistema_antiguo_contribuyentes.csv"));

  it("lee el CSV en Windows-1252 con separador ;", () => {
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.formato).toBe("csv_heredado");
    expect(r.registros.length).toBe(3);
  });

  it("mapea DPI_NO a persona.cui y NIT_CONT a persona.nit sin mezclarlos", () => {
    if (!r.ok) throw new Error("no ok");
    const maria = r.registros[0];
    const cui = maria.valores.find((v) => v.concepto === "persona.cui")!;
    const nit = maria.valores.find((v) => v.concepto === "persona.nit")!;
    expect(cui.valor).toBe("3021456780108");
    expect(cui.valorOriginal).toBe("3021 45678 0108");
    expect(cui.campoOrigen).toBe("DPI_NO");
    expect(nit.valor).toBe("8451273-6");
    expect(nit.campoOrigen).toBe("NIT_CONT");
  });

  it("separa dirección fiscal y comercial y conserva la fecha conocida del dato", () => {
    if (!r.ok) throw new Error("no ok");
    const maria = r.registros[0];
    const fiscal = maria.valores.find((v) => v.concepto === "direccion.fiscal")!;
    const comercial = maria.valores.find((v) => v.concepto === "empresa.direccion_comercial")!;
    expect(fiscal.campoOrigen).toBe("DIR_FISC");
    expect(comercial.campoOrigen).toBe("DIR_NEG");
    expect(fiscal.fechaDato).toBe("2019-03-15");
  });

  it("une NOM1+NOM2 en nombres y APE1+APE2 en apellidos, con acentos del archivo original", () => {
    if (!r.ok) throw new Error("no ok");
    const nombres = r.registros[0].valores.find((v) => v.concepto === "persona.nombres")!;
    expect(nombres.valor).toBe("MARIA IXCHEL");
    expect(nombres.campoOrigen).toBe("NOM1+NOM2");
  });

  it("rechaza un CSV sin las columnas obligatorias", () => {
    const res = leerFuente("importacion_invalida.csv", muestra("importacion_invalida.csv"));
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error).toMatch(/columnas/i);
  });

  it("informa la fila con CUI inválido sin descartar las demás", () => {
    const csv =
      "NO_EXP;DPI_NO;NIT_CONT;NOM1;NOM2;APE1;APE2;DIR_FISC;DIR_NEG;TEL;NOM_COM;ACT_ECO;FEC_ACT;MUESTRA\n" +
      "LA-X;123;1-1;ANA;;PAZ;;A;B;;;;01/01/2020;SINTETICO\n" +
      "LA-X;3021456780108;1-1;ANA;;PAZ;;A;B;;;;01/01/2020;SINTETICO\n";
    const res = leerFuente("x.csv", new TextEncoder().encode(csv));
    if (!res.ok) throw new Error(res.error);
    expect(res.registros.length).toBe(1);
    expect(res.errores[0].fila).toBe(2);
    expect(res.errores[0].mensaje).toMatch(/CUI/);
  });

  it("rechaza archivos que no estén marcados como sintéticos", () => {
    const csv =
      "NO_EXP;DPI_NO;NIT_CONT;NOM1;NOM2;APE1;APE2;DIR_FISC;DIR_NEG;TEL;NOM_COM;ACT_ECO;FEC_ACT;MUESTRA\n" +
      "LA-X;3021456780108;1-1;ANA;;PAZ;;A;B;;;;01/01/2020;\n";
    const res = leerFuente("x.csv", new TextEncoder().encode(csv));
    if (!res.ok) throw new Error(res.error);
    expect(res.registros.length).toBe(0);
    expect(res.errores[0].mensaje).toMatch(/sintétic/i);
  });
});

describe("adaptador JSON de exportación", () => {
  const r = leerFuente("exportacion_gestor_2025.json", muestra("exportacion_gestor_2025.json"));

  it("lee la exportación y mapea document_number, tax_id y direcciones", () => {
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.formato).toBe("json_exportacion");
    const maria = r.registros[0];
    expect(maria.cui).toBe("3021456780108");
    expect(maria.valores.find((v) => v.concepto === "persona.cui")!.campoOrigen).toBe("records[0].document_number");
    expect(maria.valores.find((v) => v.concepto === "direccion.residencia")!.campoOrigen).toBe("records[0].home_address");
    expect(maria.valores.find((v) => v.concepto === "persona.nombres")!.valor).toBe("María Ixchel");
  });

  it("no separa un nombre completo sin componentes", () => {
    const json = JSON.stringify({
      export_version: "2.3",
      synthetic: true,
      records: [{ case_ref: "LA-X", document_number: "3021456780108", full_name: "Ana Lucía Paz Ruiz", updated_at: "2025-01-01" }],
    });
    const res = leerFuente("x.json", new TextEncoder().encode(json));
    if (!res.ok) throw new Error(res.error);
    const conceptos = res.registros[0].valores.map((v) => v.concepto);
    expect(conceptos).toContain("persona.nombre_completo");
    expect(conceptos).not.toContain("persona.nombres");
    expect(conceptos).not.toContain("persona.apellidos");
  });

  it("rechaza JSON mal formado con un mensaje comprensible", () => {
    const res = leerFuente("x.json", new TextEncoder().encode("{ records: ["));
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error).toMatch(/JSON/);
  });

  it("rechaza formatos no admitidos", () => {
    const res = leerFuente("x.xlsx", new Uint8Array([1, 2, 3]));
    expect(res.ok).toBe(false);
  });
});

describe("adaptador DBF heredado", () => {
  const r = leerFuente("padron_antiguo_2012.dbf", muestra("padron_antiguo_2012.dbf"));

  it("lee la tabla dBASE, ignora el registro borrado y decodifica Windows-1252", () => {
    if (!r.ok) throw new Error(r.error);
    expect(r.formato).toBe("dbf_heredado");
    expect(r.totalFilas).toBe(2);
    expect(r.errores).toEqual([]);
    const maria = r.registros[0];
    expect(maria.refExpediente).toBe("LA-DEMO-001");
    expect(maria.cui).toBe("3021456780108");
    expect(maria.nit).toBe("8451273-6");
    const objeto = maria.valores.find((v) => v.concepto === "empresa.objeto");
    expect(objeto?.valor).toBe("VENTA AL POR MENOR DE TEXTILES TÍPICOS");
    expect(objeto?.campoOrigen).toBe("ACT_ECO");
    expect(maria.valores.find((v) => v.concepto === "persona.telefono")?.fechaDato).toBe("2012-05-08");
    expect(maria.valores.some((v) => v.valor === "REGISTRO BORRADO")).toBe(false);
  });

  it("CUI y NIT siguen separados y no se completan entre sí", () => {
    if (!r.ok) throw new Error(r.error);
    const m = r.registros[0];
    expect(m.valores.find((v) => v.concepto === "persona.cui")?.campoOrigen).toBe("DPI_NO");
    expect(m.valores.find((v) => v.concepto === "persona.nit")?.campoOrigen).toBe("NIT_CONT");
  });

  it("rechaza un DBF dañado con un mensaje claro", () => {
    const res = leerFuente("roto.dbf", new Uint8Array([3, 0, 0, 0, 5]));
    expect(res.ok).toBe(false);
  });

  it("explica que MDB aún no se lee", () => {
    const res = leerFuente("datos.mdb", new Uint8Array([0]));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/Access/);
  });
});
