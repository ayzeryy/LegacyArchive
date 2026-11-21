import { describe, expect, it } from "vitest";
import cat from "../catalog/catalogo.json";
import { Catalogo } from "@/domain/catalogo";

describe("catálogo versionado", () => {
  it("cumple el esquema y cada requisito tiene fuente y fecha de revisión", () => {
    const c = Catalogo.parse(cat);
    expect(c.revisado_en).toBe("2026-11-21");
    for (const t of c.tramites) {
      expect(t.fuentes.length).toBeGreaterThan(0);
      for (const r of t.requisitos) expect(r.fuente_url).toMatch(/^https:\/\//);
    }
  });
  it("no inventa reglas de vigencia: ninguna regla por días", () => {
    const c = Catalogo.parse(cat);
    const dias = c.tramites.flatMap((t) => t.requisitos).filter((r) => r.vigencia.tipo === "dias_maximos");
    expect(dias.length).toBe(0);
  });
});
