import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { leerFuente } from "@/domain/adaptadores";
import { decidirVinculacion } from "@/domain/vinculacion";

const muestra = (n: string) => new Uint8Array(readFileSync(path.join(__dirname, "..", "muestras", n)));

describe("vinculación de registros al expediente", () => {
  it("vincula solo el registro con la misma referencia de expediente", () => {
    const r = leerFuente("a.csv", muestra("sistema_antiguo_contribuyentes.csv"));
    if (!r.ok) throw new Error(r.error);
    const d = decidirVinculacion({ ref: "LA-DEMO-001", cuis: [], nits: [] }, r.registros);
    expect(d.filter((x) => x.decision === "vinculado").length).toBe(1);
  });

  it("no vincula a una persona de nombre parecido con otro CUI y lo explica", () => {
    const r = leerFuente("a.csv", muestra("sistema_antiguo_contribuyentes.csv"));
    if (!r.ok) throw new Error(r.error);
    const d = decidirVinculacion({ ref: "LA-DEMO-001", cuis: [], nits: [] }, r.registros);
    const isabel = d.find((x) => x.registro.refExpediente === "LA-DEMO-002")!;
    expect(isabel.decision).toBe("no_vinculado");
    expect(isabel.motivo).toMatch(/nombre/i);
  });

  it("bloquea un registro con la misma referencia y nombre idéntico pero CUI distinto", () => {
    const r = leerFuente("b.json", muestra("exportacion_gestor_2025.json"));
    if (!r.ok) throw new Error(r.error);
    const d = decidirVinculacion({ ref: "LA-DEMO-001", cuis: ["3021456780108"], nits: ["8451273-6"] }, r.registros);
    expect(d[0].decision).toBe("vinculado");
    expect(d[1].decision).toBe("bloqueado");
    expect(d[1].motivo).toMatch(/CUI/);
  });

  it("si el expediente aún no tiene CUI y llegan dos CUI distintos con la misma referencia, bloquea ambos", () => {
    const r = leerFuente("b.json", muestra("exportacion_gestor_2025.json"));
    if (!r.ok) throw new Error(r.error);
    const d = decidirVinculacion({ ref: "LA-DEMO-001", cuis: [], nits: [] }, r.registros);
    expect(d.every((x) => x.decision === "bloqueado")).toBe(true);
  });
});
