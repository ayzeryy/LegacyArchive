import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { mkdtempSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const muestra = (n: string) => new Uint8Array(readFileSync(path.join(__dirname, "..", "muestras", n)));

beforeAll(() => {
  vi.stubEnv("VERCEL", "");
  vi.stubEnv("TURSO_DATABASE_URL", "");
  vi.stubEnv("TURSO_AUTH_TOKEN", "");
  process.env.LEGACYARCHIVE_DB_PATH = path.join(mkdtempSync(path.join(os.tmpdir(), "la-")), "prueba.db");
});

afterAll(() => vi.unstubAllEnvs());

describe("recorrido sobre SQLite", async () => {
  const repo = await import("@/server/repo");
  const db = await import("@/server/db");
  const { construirExportacion } = await import("@/domain/exportar");

  it("importa, resuelve un conflicto, reutiliza en IGSS y conserva todo al reabrir", async () => {
    const rm = (await repo.abrirProceso("rm-comerciante-empresa", "persona_individual", { inscrita_comerciante: "no", copropiedad: "no" }));
    const r1 = (await repo.importarArchivo("sistema_antiguo_contribuyentes.csv", muestra("sistema_antiguo_contribuyentes.csv"), rm.id));
    expect(r1.vinculados).toBe(1);
    expect(r1.noVinculados.length).toBe(2);
    const r2 = (await repo.importarArchivo("exportacion_gestor_2025.json", muestra("exportacion_gestor_2025.json"), rm.id));
    expect(r2.vinculados).toBe(1);
    expect(r2.noVinculados[0].decision).toBe("bloqueado");
    await expect(async () => (await repo.importarArchivo("exportacion_gestor_2025.json", muestra("exportacion_gestor_2025.json")))).rejects.toThrow(/ya se importó/);

    let ev = (await repo.evaluar("rm-comerciante-empresa"))!.evaluacion;
    const dir = ev.requisitos.find((r) => r.requisito.id === "rm-direccion-empresa")!;
    expect(dir.estado).toBe("en_conflicto");
    expect(dir.opciones.length).toBe(2);
    const nueva = dir.opciones.find((o) => o.valor.startsWith("7a."))!;
    await expect(async () => (await repo.confirmarDato(rm.id, "empresa.direccion_comercial", nueva.clave, ""))).rejects.toThrow(/motivo/);
    await repo.confirmarDato(rm.id, "empresa.direccion_comercial", nueva.clave, "El negocio se trasladó en 2024");

    // Confirma todos los disponibles y completa los faltantes.
    for (const r of (await repo.evaluar("rm-comerciante-empresa"))!.evaluacion.requisitos) {
      if (r.requisito.tipo === "dato" && r.estado === "disponible") await repo.confirmarDato(rm.id, r.requisito.concepto, r.elegida!.clave, "");
    }
    await repo.capturarDato(rm.id, "persona.estado_civil", "Soltera/o", "");
    await repo.capturarDato(rm.id, "empresa.fecha_inicio", "Al inscribirse", "");
    await repo.capturarDato(rm.id, "empresa.empleados_a_contratar", "2", "");
    await repo.aportarDocumento({ procesoId: rm.id, tipo: "dpi", nombreArchivo: "dpi_MUESTRA.pdf", bytes: new Uint8Array([1, 2]), fechaEmision: null, declaraSintetico: true });
    const dpi = (await repo.documentos())[0];
    await repo.confirmarDocumento(rm.id, dpi.id, "");

    ev = (await repo.evaluar("rm-comerciante-empresa"))!.evaluacion;
    const faltantes = ev.requisitos.filter((r) => r.aplica !== false && r.estado !== "confirmado_usuario").map((r) => r.requisito.id);
    expect(faltantes.sort()).toEqual(["rm-pago-comerciante", "rm-pago-empresa"]);
    expect(ev.resumen.estadoExpediente).toBe("borrador_incompleto");

    // Documentos obtenidos después (sintéticos) y segundo trámite.
    await repo.aportarDocumento({ procesoId: null, tipo: "patente_empresa", nombreArchivo: "patente_MUESTRA.pdf", bytes: new Uint8Array([3]), fechaEmision: null, declaraSintetico: true });
    await repo.aportarDocumento({ procesoId: null, tipo: "constancia_rtu", nombreArchivo: "rtu_MUESTRA.pdf", bytes: new Uint8Array([4]), fechaEmision: null, declaraSintetico: true });
    const igss = (await repo.abrirProceso("igss-inscripcion-patronal", "persona_individual", { copropiedad: "no" }));
    let ig = (await repo.evaluar("igss-inscripcion-patronal"))!.evaluacion;
    expect(ig.resumen.compatiblesSinAutorizar).toBeGreaterThan(0);
    await repo.autorizarReutilizacion(igss.id);
    ig = (await repo.evaluar("igss-inscripcion-patronal"))!.evaluacion;
    const dirIgss = ig.requisitos.find((r) => r.requisito.id === "igss-direccion-empresa")!;
    expect(dirIgss.estado).toBe("confirmado_usuario");
    expect(dirIgss.elegida!.valor).toMatch(/^7a\./);
    expect(ig.requisitos.find((r) => r.requisito.id === "igss-rtu")!.estado).toBe("por_confirmar");
    expect(ig.requisitos.find((r) => r.requisito.id === "igss-mandato")!.aplica).toBe(false);
    expect(ig.requisitos.find((r) => r.requisito.id === "igss-trabajadores")!.estado).toBe("faltante");

    // Reabrir: cerrar la conexión y volver a leer.
    db.cerrarDb();
    const tras = (await repo.evaluar("igss-inscripcion-patronal"))!;
    expect(tras.proceso.autorizado).toBe(true);
    expect(tras.evaluacion.requisitos.find((r) => r.requisito.id === "igss-direccion-empresa")!.confirmacion!.motivo).toBe("El negocio se trasladó en 2024");

    // Completar y exportar.
    await repo.capturarDato(igss.id, "empresa.trabajadores_a_inscribir", "2", "");
    for (const d of (await repo.documentos())) await repo.confirmarDocumento(igss.id, d.id, d.tipo === "constancia_rtu" ? "Declaro que la constancia está ratificada" : "");
    const pendIgss = (await repo.evaluar("igss-inscripcion-patronal"))!.evaluacion.requisitos.filter((r) => r.aplica !== false && r.estado !== "confirmado_usuario").map((r) => `${r.requisito.id}:${r.estado}`);
    expect(pendIgss).toEqual(["igss-cui:disponible"]);
    await repo.confirmarDato(igss.id, "persona.cui", (await repo.evaluar("igss-inscripcion-patronal"))!.evaluacion.requisitos.find((r) => r.requisito.id === "igss-cui")!.elegida!.clave, "");
    const final = (await repo.evaluar("igss-inscripcion-patronal"))!;
    expect(final.evaluacion.resumen.estadoExpediente).toBe("preparado_revision");
    expect(final.evaluacion.resumen.reutilizados).toBeGreaterThanOrEqual(8);
    expect(final.evaluacion.resumen.capturados).toBe(1);
    const exp = construirExportacion({ catalogo: repo.catalogo, tramite: final.tramite, procesoId: final.proceso.id, evaluacion: final.evaluacion, confirmaciones: (await repo.confirmaciones()), generadoEn: "x" });
    expect(exp.estado).toBe("Preparado para revisión según el catálogo de la demo");
    const rmExp = (await repo.evaluar("rm-comerciante-empresa"))!;
    expect(construirExportacion({ catalogo: repo.catalogo, tramite: rmExp.tramite, procesoId: rmExp.proceso.id, evaluacion: rmExp.evaluacion, confirmaciones: [], generadoEn: "x" }).estado).toBe("Borrador incompleto");
  });

  it("rechaza una importación inválida sin guardar nada", async () => {
    const antes = (await repo.valores()).length;
    await expect(async () => (await repo.importarArchivo("importacion_invalida.csv", muestra("importacion_invalida.csv")))).rejects.toThrow(/columnas/);
    expect((await repo.valores()).length).toBe(antes);
  });
});
