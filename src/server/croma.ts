import "server-only";
import { randomUUID } from "node:crypto";
import { getDb } from "./db";

/**
 * Integración con Croma (https://docs.usecroma.com): solo desde el servidor.
 * Usa POST /global/generate/json/v1 para proponer requisitos candidatos a
 * partir de una página oficial pública. El resultado es una EXTRACCIÓN
 * CANDIDATA: requiere revisión humana y nunca modifica el catálogo publicado.
 */

const ESQUEMA = {
  type: "object",
  required: ["requisitos"],
  properties: {
    requisitos: {
      type: "array",
      items: {
        type: "object",
        required: ["texto_original", "tipo"],
        properties: {
          texto_original: { type: "string", description: "Texto literal del requisito tal como aparece en la página" },
          tipo: { type: "string", enum: ["documento", "dato", "pago", "formulario", "otro"] },
          aplica_a: { type: "string", description: "A quién aplica (persona individual, jurídica, comerciante...), solo si la página lo dice" },
          condicion: { type: "string", description: "Condición de aplicación si la página la indica" },
          vigencia: { type: "string", description: "Regla de vigencia o plazo solo si la página la indica explícitamente" },
        },
      },
    },
    fecha_o_version_visible: { type: "string", description: "Fecha o versión mostrada en la página; vacío si no hay" },
  },
} as const;

const INSTRUCCIONES =
  "Extrae literalmente los requisitos publicados en esta página oficial de Guatemala para una persona individual (comerciante). " +
  "No inventes requisitos, plazos ni vigencias: si algo no aparece en la página, omítelo o déjalo vacío. Copia el texto original sin parafrasear.";

export function cromaConfigurado(): boolean {
  return Boolean(process.env.CROMA_API_KEY && process.env.CROMA_API_KEY.trim());
}

function asegurarTabla() {
  getDb().exec(`CREATE TABLE IF NOT EXISTS croma_extracciones (
    id TEXT PRIMARY KEY, tramite_id TEXT NOT NULL, url TEXT NOT NULL, solicitado_en TEXT NOT NULL,
    ok INTEGER NOT NULL, resultado_json TEXT, error TEXT, request_id TEXT
  )`);
}

export interface ExtraccionCroma {
  id: string; tramiteId: string; url: string; solicitadoEn: string; ok: boolean;
  resultado: { requisitos: { texto_original: string; tipo: string; aplica_a?: string; condicion?: string; vigencia?: string }[]; fecha_o_version_visible?: string } | null;
  error: string | null; requestId: string | null;
}

export function extracciones(): ExtraccionCroma[] {
  asegurarTabla();
  return (getDb().prepare("SELECT * FROM croma_extracciones ORDER BY solicitado_en DESC").all() as Record<string, unknown>[]).map((f) => ({
    id: String(f.id), tramiteId: String(f.tramite_id), url: String(f.url), solicitadoEn: String(f.solicitado_en), ok: Number(f.ok) === 1,
    resultado: f.resultado_json ? JSON.parse(String(f.resultado_json)) : null, error: (f.error as string | null) ?? null, requestId: (f.request_id as string | null) ?? null,
  }));
}

export async function extraerConCroma(tramiteId: string, url: string): Promise<ExtraccionCroma> {
  asegurarTabla();
  const id = randomUUID();
  const solicitadoEn = new Date().toISOString();
  const guardar = (ok: boolean, resultado: unknown, error: string | null, requestId: string | null) => {
    getDb().prepare("INSERT INTO croma_extracciones (id, tramite_id, url, solicitado_en, ok, resultado_json, error, request_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .run(id, tramiteId, url, solicitadoEn, ok ? 1 : 0, resultado ? JSON.stringify(resultado) : null, error, requestId);
    return extracciones().find((x) => x.id === id)!;
  };
  if (!cromaConfigurado()) return guardar(false, null, "CROMA_API_KEY no está configurada en el servidor (.env.local).", null);
  const base = process.env.CROMA_BASE_URL || "https://api.croma.run";
  try {
    const res = await fetch(`${base}/global/generate/json/v1`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.CROMA_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ url, instructions: INSTRUCCIONES, json_schema: ESQUEMA, effort: "standard" }),
      signal: AbortSignal.timeout(90_000),
    });
    const requestId = res.headers.get("x-request-id");
    const cuerpo = (await res.json().catch(() => null)) as { data?: { result?: unknown }; result?: unknown; error?: { code?: string; message?: string } } | null;
    // La API en vivo envuelve la respuesta en data; se conserva el formato directo documentado.
    const resultado = cuerpo?.data?.result ?? cuerpo?.result;
    if (!res.ok || !resultado) {
      return guardar(false, null, `Croma respondió ${res.status}${cuerpo?.error ? `: ${cuerpo.error.code ?? ""} ${cuerpo.error.message ?? ""}` : ""}`.trim(), requestId);
    }
    return guardar(true, resultado, null, requestId);
  } catch (e) {
    return guardar(false, null, `No se pudo contactar a Croma: ${(e as Error).message}`, null);
  }
}
