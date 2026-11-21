import { describe, expect, it } from "vitest";
import { evaluarProceso, type EntradaMotor } from "@/domain/motor";
import type { Requisito, Tramite } from "@/domain/catalogo";
import type { Confirmacion, DocumentoGuardado, ValorGuardado } from "@/domain/tipos";

const base = { base: "requisito_oficial" as const, fuente_url: "https://example.invalid", fuente_titulo: "Fuente", descripcion_original: "x", porque: "x", donde_obtener: "x" };

function req(p: Partial<Requisito> & Pick<Requisito, "id" | "tipo">): Requisito {
  return { titulo: p.id, vigencia: { tipo: "sin_regla_publicada" }, condicion: null, ...base, ...p } as Requisito;
}

function tramite(requisitos: Requisito[]): Tramite {
  return {
    id: "t1",
    institucion: "Inst",
    nombre: "Trámite",
    nombre_corto: "T",
    canal_oficial_url: "https://example.invalid",
    tipos_solicitante: ["persona_individual"],
    pasos_oficiales: [],
    no_modelado: [],
    fuentes: [],
    requisitos,
  };
}

let n = 0;
function valor(concepto: string, v: string, extra: Partial<ValorGuardado> = {}): ValorGuardado {
  n++;
  return {
    id: `v${n}`,
    concepto,
    valor: v,
    valorOriginal: v,
    campoOrigen: "CAMPO",
    fechaDato: null,
    importadoEn: "2026-11-21T10:00:00Z",
    fuente: { id: "f1", nombre: "a.csv", tipo: "csv_heredado" },
    procesoId: null,
    ...extra,
  } as ValorGuardado;
}

function entrada(t: Tramite, e: Partial<EntradaMotor> = {}): EntradaMotor {
  return { tramite: t, procesoId: "p1", valores: [], documentos: [], confirmaciones: [], autorizado: true, hoy: new Date("2026-11-21T12:00:00Z"), ...e };
}

const reqComercial = req({ id: "dir-com", tipo: "dato", concepto: "empresa.direccion_comercial" });

describe("motor de requisitos", () => {
  it("una dirección fiscal no completa la dirección comercial", () => {
    const ev = evaluarProceso(entrada(tramite([reqComercial]), { valores: [valor("direccion.fiscal", "12 Calle 5-40 Zona 1")] }));
    expect(ev.requisitos[0].estado).toBe("faltante");
  });

  it("valores equivalentes de dos fuentes forman una sola opción con ambas procedencias", () => {
    const ev = evaluarProceso(
      entrada(tramite([req({ id: "nc", tipo: "dato", concepto: "empresa.nombre_comercial" })]), {
        valores: [
          valor("empresa.nombre_comercial", "TEJIDOS IXCHEL"),
          valor("empresa.nombre_comercial", "Tejidos Ixchel", { fechaDato: "2025-08-14", fuente: { id: "f2", nombre: "b.json", tipo: "json_exportacion" } }),
        ],
      }),
    );
    const r = ev.requisitos[0];
    expect(r.estado).toBe("disponible");
    expect(r.opciones.length).toBe(1);
    expect(r.opciones[0].procedencias.length).toBe(2);
    expect(r.opciones[0].valor).toBe("Tejidos Ixchel");
  });

  it("dos direcciones comerciales incompatibles generan conflicto y conservan ambos orígenes", () => {
    const a = valor("empresa.direccion_comercial", "4A. CALLE 3-21 ZONA 1");
    const b = valor("empresa.direccion_comercial", "7a. Avenida 5-10, Zona 2", { fuente: { id: "f2", nombre: "b.json", tipo: "json_exportacion" } });
    const ev = evaluarProceso(entrada(tramite([reqComercial]), { valores: [a, b] }));
    expect(ev.requisitos[0].estado).toBe("en_conflicto");
    expect(ev.requisitos[0].opciones.map((o) => o.procedencias[0].fuente.nombre).sort()).toEqual(["a.csv", "b.json"]);
  });

  it("resolver el conflicto confirma el valor elegido y sigue mostrando ambos", () => {
    const a = valor("empresa.direccion_comercial", "4A. CALLE 3-21 ZONA 1");
    const b = valor("empresa.direccion_comercial", "7a. Avenida 5-10, Zona 2");
    const sinResolver = evaluarProceso(entrada(tramite([reqComercial]), { valores: [a, b] }));
    const [o1, o2] = sinResolver.requisitos[0].opciones;
    const conf: Confirmacion = {
      id: "c1", objetivo: "empresa.direccion_comercial", valorClave: o2.clave, considerados: [o1.clave, o2.clave],
      accion: "resolver_conflicto", motivo: "Me trasladé en 2024", autor: "María (demo)", fecha: "2026-11-21T11:00:00Z", procesoId: "p1", tramiteId: "t1",
    };
    const ev = evaluarProceso(entrada(tramite([reqComercial]), { valores: [a, b], confirmaciones: [conf] }));
    expect(ev.requisitos[0].estado).toBe("confirmado_usuario");
    expect(ev.requisitos[0].elegida!.clave).toBe(o2.clave);
    expect(ev.requisitos[0].opciones.length).toBe(2);
  });

  it("un valor nuevo y distinto después de resolver reabre el conflicto", () => {
    const a = valor("empresa.direccion_comercial", "4A. CALLE 3-21 ZONA 1");
    const b = valor("empresa.direccion_comercial", "7a. Avenida 5-10, Zona 2");
    const ev0 = evaluarProceso(entrada(tramite([reqComercial]), { valores: [a, b] }));
    const claves = ev0.requisitos[0].opciones.map((o) => o.clave);
    const conf: Confirmacion = {
      id: "c1", objetivo: "empresa.direccion_comercial", valorClave: claves[1], considerados: claves,
      accion: "resolver_conflicto", motivo: "x", autor: "m", fecha: "2026-11-21T11:00:00Z", procesoId: "p1", tramiteId: "t1",
    };
    const c = valor("empresa.direccion_comercial", "Mercado Municipal local 22");
    const ev = evaluarProceso(entrada(tramite([reqComercial]), { valores: [a, b, c], confirmaciones: [conf] }));
    expect(ev.requisitos[0].estado).toBe("en_conflicto");
  });

  it("un documento ausente aparece como faltante", () => {
    const ev = evaluarProceso(entrada(tramite([req({ id: "dpi", tipo: "documento", documento: "dpi" })])));
    expect(ev.requisitos[0].estado).toBe("faltante");
  });

  const doc = (tipo: string, extra: Partial<DocumentoGuardado> = {}): DocumentoGuardado => ({
    id: `d-${tipo}`, tipo, nombreArchivo: `${tipo}.pdf`, fechaEmision: null, aportadoEn: "2026-11-21T10:00:00Z", procesoId: null, sintetico: true, sha256: "x", tamano: 1, ...extra,
  }) as DocumentoGuardado;

  it("un documento con condición sin plazo publicado queda por confirmar hasta que la persona lo confirme", () => {
    const r = req({ id: "rtu", tipo: "documento", documento: "constancia_rtu", vigencia: { tipo: "condicion_sin_plazo", texto: "Constancia ratificada" } });
    const ev = evaluarProceso(entrada(tramite([r]), { documentos: [doc("constancia_rtu")] }));
    expect(ev.requisitos[0].estado).toBe("por_confirmar");
    const conf: Confirmacion = {
      id: "c", objetivo: "documento:constancia_rtu", valorClave: "d-constancia_rtu", considerados: ["d-constancia_rtu"],
      accion: "confirmar_documento", motivo: "Declaro que está ratificada", autor: "m", fecha: "2026-11-21T11:00:00Z", procesoId: "p1", tramiteId: "t1",
    };
    const ev2 = evaluarProceso(entrada(tramite([r]), { documentos: [doc("constancia_rtu")], confirmaciones: [conf] }));
    expect(ev2.requisitos[0].estado).toBe("confirmado_usuario");
  });

  it("aplica una regla de vigencia documentada: vencido si supera el plazo, por confirmar si no hay fecha", () => {
    const r = req({ id: "cert", tipo: "documento", documento: "certificacion", vigencia: { tipo: "dias_maximos", dias: 90, fuente_url: "https://example.invalid" } });
    const viejo = evaluarProceso(entrada(tramite([r]), { documentos: [doc("certificacion", { fechaEmision: "2026-01-01" })] }));
    expect(viejo.requisitos[0].estado).toBe("vencido");
    const sinFecha = evaluarProceso(entrada(tramite([r]), { documentos: [doc("certificacion")] }));
    expect(sinFecha.requisitos[0].estado).toBe("por_confirmar");
  });

  it("un requisito condicionado no aplica si la condición no se cumple y queda por confirmar si se desconoce", () => {
    const mandato = req({ id: "mandato", tipo: "documento", documento: "mandato", condicion: { concepto: "empresa.copropiedad", igual: "si", texto: "Solo si hay copropietarios" } });
    const desconocido = evaluarProceso(entrada(tramite([mandato])));
    expect(desconocido.requisitos[0].aplica).toBe("por_determinar");
    expect(desconocido.requisitos[0].estado).toBe("por_confirmar");
    const no = evaluarProceso(entrada(tramite([mandato]), { valores: [valor("empresa.copropiedad", "no")] }));
    expect(no.requisitos[0].aplica).toBe(false);
    expect(no.resumen.aplicables).toBe(0);
  });

  it("sin autorización no propone datos de otras fuentes, pero informa cuántos son compatibles", () => {
    const t = tramite([reqComercial]);
    const v = [valor("empresa.direccion_comercial", "7a. Avenida 5-10")];
    const sin = evaluarProceso(entrada(t, { valores: v, autorizado: false }));
    expect(sin.requisitos[0].estado).toBe("faltante");
    expect(sin.resumen.compatiblesSinAutorizar).toBe(1);
    const con = evaluarProceso(entrada(t, { valores: v, autorizado: true }));
    expect(con.requisitos[0].estado).toBe("disponible");
  });

  it("una confirmación hecha en otro proceso se reutiliza y cuenta como reutilizada", () => {
    const v = valor("empresa.direccion_comercial", "7a. Avenida 5-10");
    const ev0 = evaluarProceso(entrada(tramite([reqComercial]), { valores: [v] }));
    const clave = ev0.requisitos[0].opciones[0].clave;
    const conf: Confirmacion = {
      id: "c", objetivo: "empresa.direccion_comercial", valorClave: clave, considerados: [clave], accion: "confirmar",
      motivo: "Revisado", autor: "m", fecha: "2026-11-21T11:00:00Z", procesoId: "p-rm", tramiteId: "rm",
    };
    const ev = evaluarProceso(entrada(tramite([reqComercial]), { procesoId: "p-igss", valores: [v], confirmaciones: [conf] }));
    expect(ev.requisitos[0].estado).toBe("confirmado_usuario");
    expect(ev.requisitos[0].reutilizado).toBe(true);
    expect(ev.resumen.reutilizados).toBe(1);
    expect(ev.resumen.capturados).toBe(0);
  });

  it("un dato escrito en este proceso cuenta como capturado y no como reutilizado", () => {
    const v = valor("empresa.direccion_comercial", "7a. Avenida 5-10", { procesoId: "p1", fuente: { id: "cap", nombre: "Captura", tipo: "captura_usuario" } });
    const ev0 = evaluarProceso(entrada(tramite([reqComercial]), { valores: [v] }));
    const clave = ev0.requisitos[0].opciones[0].clave;
    const conf: Confirmacion = { id: "c", objetivo: "empresa.direccion_comercial", valorClave: clave, considerados: [clave], accion: "capturar", motivo: "Dato faltante", autor: "m", fecha: "2026-11-21T11:00:00Z", procesoId: "p1", tramiteId: "t1" };
    const ev = evaluarProceso(entrada(tramite([reqComercial]), { valores: [v], confirmaciones: [conf] }));
    expect(ev.resumen.capturados).toBe(1);
    expect(ev.resumen.reutilizados).toBe(0);
  });

  it("el expediente está preparado para revisión solo si todos los requisitos aplicables están confirmados", () => {
    const v = valor("empresa.direccion_comercial", "7a. Avenida 5-10");
    const t = tramite([reqComercial, req({ id: "dpi", tipo: "documento", documento: "dpi" })]);
    const ev0 = evaluarProceso(entrada(t, { valores: [v] }));
    expect(ev0.resumen.estadoExpediente).toBe("borrador_incompleto");
    const clave = ev0.requisitos[0].opciones[0].clave;
    const confs: Confirmacion[] = [
      { id: "c1", objetivo: "empresa.direccion_comercial", valorClave: clave, considerados: [clave], accion: "confirmar", motivo: "ok", autor: "m", fecha: "2026-11-21T11:00:00Z", procesoId: "p1", tramiteId: "t1" },
      { id: "c2", objetivo: "documento:dpi", valorClave: "d-dpi", considerados: ["d-dpi"], accion: "confirmar_documento", motivo: "ok", autor: "m", fecha: "2026-11-21T11:00:00Z", procesoId: "p1", tramiteId: "t1" },
    ];
    const ev = evaluarProceso(entrada(t, { valores: [v], documentos: [doc("dpi")], confirmaciones: confs }));
    expect(ev.resumen.preparados).toBe(2);
    expect(ev.resumen.estadoExpediente).toBe("preparado_revision");
  });
});
