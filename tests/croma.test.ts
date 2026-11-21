import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cerrarDb } from "@/server/db";
import { extraerConCroma, extracciones } from "@/server/croma";

beforeEach(() => {
  vi.stubEnv("VERCEL", "");
  vi.stubEnv("TURSO_DATABASE_URL", "");
  vi.stubEnv("TURSO_AUTH_TOKEN", "");
  vi.stubEnv("LEGACYARCHIVE_DB_PATH", ":memory:");
  vi.stubEnv("CROMA_API_KEY", "clave-de-prueba");
});
afterEach(() => {
  cerrarDb();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("respuesta de Croma y persistencia", () => {
  const resultado = { requisitos: [{ texto_original: "Copia del DPI", tipo: "documento", condicion: null, vigencia: null }], fecha_o_version_visible: null };
  it.each([
    ["formato observado en vivo", { data: { result: resultado } }],
    ["formato directo documentado", { result: resultado }],
  ])("guarda los candidatos y request ID: %s", async (_nombre, cuerpo) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(cuerpo, { headers: { "x-request-id": "req-prueba" } })));
    const extraccion = await extraerConCroma("rm-comerciante-empresa", "https://example.org/fuente");
    expect(extraccion.ok).toBe(true);
    expect(extraccion.resultado).toEqual(resultado);
    expect(extraccion.requestId).toBe("req-prueba");
    cerrarDb();
  });
  it("conserva código de error y request ID sin candidatos", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ error: { code: "rate_limit_exceeded", message: "Cuota agotada" } }, { status: 429, headers: { "x-request-id": "req-error" } })));
    const extraccion = await extraerConCroma("rm-comerciante-empresa", "https://example.org/fuente");
    expect(extraccion.ok).toBe(false);
    expect(extraccion.error).toContain("rate_limit_exceeded");
    expect((await extracciones())[0].requestId).toBe("req-error");
  });
});
