import { afterAll, beforeAll, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { cerrarDb, getDb } from "@/server/db";

// Opt-in: escribe únicamente en una tabla sintética con nombre único y la elimina.
const habilitado = process.env.PROBAR_TURSO === "1";
const tabla = `prueba_persistencia_${randomUUID().replaceAll("-", "")}`;
beforeAll(() => {
  if (habilitado && (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN))
    throw new Error("Configura TURSO_DATABASE_URL y TURSO_AUTH_TOKEN antes de la prueba remota.");
});
afterAll(async () => {
  if (habilitado) {
    try { await getDb().exec(`DROP TABLE IF EXISTS ${tabla}`); }
    finally { cerrarDb(); }
  }
});
it.skipIf(!habilitado)("persiste texto y binarios en Turso tras cerrar y abrir el cliente", async () => {
  await getDb().exec(`CREATE TABLE ${tabla} (id TEXT PRIMARY KEY, contenido BLOB)`);
  await getDb().prepare(`INSERT INTO ${tabla} VALUES (?, ?)`).run("MUESTRA-SINTETICA", new Uint8Array([0, 1, 128, 255]));
  cerrarDb();
  const fila = await getDb().prepare(`SELECT * FROM ${tabla} WHERE id = ?`).get("MUESTRA-SINTETICA");
  expect(fila?.id).toBe("MUESTRA-SINTETICA");
  expect(new Uint8Array(fila!.contenido as ArrayBuffer)).toEqual(new Uint8Array([0, 1, 128, 255]));
}, 30000);
