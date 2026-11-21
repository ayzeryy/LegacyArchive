import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cerrarDb, getDb } from "@/server/db";
import { DatabaseSync } from "node:sqlite";
import { mkdtempSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

beforeEach(() => {
  vi.stubEnv("VERCEL", "");
  vi.stubEnv("TURSO_DATABASE_URL", "");
  vi.stubEnv("TURSO_AUTH_TOKEN", "");
  vi.stubEnv("LEGACYARCHIVE_DB_PATH", ":memory:");
});
afterEach(() => { cerrarDb(); vi.unstubAllEnvs(); });

describe("persistencia serverless", () => {
  it("rechaza SQLite local en Vercel en vez de perder los datos en /tmp", () => {
    vi.stubEnv("VERCEL", "1");
    expect(() => getDb()).toThrow(/TURSO_DATABASE_URL/);
  });
  it("rechaza una URL remota sin token y no recurre al archivo local", () => {
    vi.stubEnv("TURSO_DATABASE_URL", "libsql://demo.turso.io");
    expect(() => getDb()).toThrow(/TURSO_AUTH_TOKEN/);
  });
  it("un lote fallido no deja escrituras parciales", async () => {
    const db = getDb();
    await db.exec("CREATE TABLE prueba_atomica (id TEXT PRIMARY KEY, valor BLOB)");
    await expect(db.batch([
      { sql: "INSERT INTO prueba_atomica VALUES (?, ?)", args: ["duplicado", new Uint8Array([1, 2])] },
      { sql: "INSERT INTO prueba_atomica VALUES (?, ?)", args: ["duplicado", new Uint8Array([3, 4])] },
    ])).rejects.toThrow();
    expect(await db.prepare("SELECT * FROM prueba_atomica").all()).toHaveLength(0);
  });
  it("conserva bytes de documentos en una consulta asíncrona", async () => {
    const db = getDb();
    await db.exec("CREATE TABLE prueba_blob (contenido BLOB)");
    await db.prepare("INSERT INTO prueba_blob VALUES (?)").run(new Uint8Array([0, 127, 128, 255]));
    const fila = await db.prepare("SELECT contenido FROM prueba_blob").get();
    expect(new Uint8Array(fila!.contenido as ArrayBuffer)).toEqual(new Uint8Array([0, 127, 128, 255]));
  });
  it("hace cumplir las referencias entre fuentes y expedientes", async () => {
    await expect(getDb().prepare("INSERT INTO fuentes (id, expediente_id, nombre_archivo, tipo, importado_en) VALUES (?, ?, ?, ?, ?)")
      .run("huérfana", "no-existe", "muestra.csv", "csv_heredado", "2026-11-21")).rejects.toThrow();
  });
  it("abre un archivo creado con el driver anterior sin perder sus bytes", async () => {
    const archivo = path.join(mkdtempSync(path.join(os.tmpdir(), "lazo-anterior-")), "expediente.db");
    const anterior = new DatabaseSync(archivo);
    anterior.exec("CREATE TABLE documento_anterior (contenido BLOB)");
    anterior.prepare("INSERT INTO documento_anterior VALUES (?)").run(new Uint8Array([5, 128, 255]));
    anterior.close();
    vi.stubEnv("LEGACYARCHIVE_DB_PATH", archivo);
    const fila = await getDb().prepare("SELECT contenido FROM documento_anterior").get();
    expect(new Uint8Array(fila!.contenido as ArrayBuffer)).toEqual(new Uint8Array([5, 128, 255]));
  });
  it("dos importaciones concurrentes del mismo archivo guardan una sola fuente", async () => {
    const { importarArchivo, fuentesImportadas } = await import("@/server/repo");
    const bytes = new Uint8Array(readFileSync(path.join(process.cwd(), "muestras/sistema_antiguo_contribuyentes.csv")));
    const resultados = await Promise.allSettled([importarArchivo("muestra.csv", bytes), importarArchivo("muestra.csv", bytes)]);
    expect(resultados.filter(r => r.status === "fulfilled")).toHaveLength(1);
    const rechazo = resultados.find(r => r.status === "rejected") as PromiseRejectedResult;
    expect(rechazo.reason.estado).toBe(409);
    expect(await fuentesImportadas()).toHaveLength(1);
  });
});
