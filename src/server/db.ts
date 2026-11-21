import "server-only";
import { createClient, type Client, type InStatement, type InValue } from "@libsql/client";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

/** Un cliente por instancia; los datos remotos viven en Turso, nunca en /tmp. */
let cliente: Client | null = null;
let db: ReturnType<typeof crearAdaptador> | null = null;

export function rutaDb(): string {
  return process.env.LEGACYARCHIVE_DB_PATH || path.join(process.cwd(), "data", "legacyarchive.db");
}

export function getDb() {
  if (db) return db;
  const urlRemota = process.env.TURSO_DATABASE_URL?.trim();
  const authToken = process.env.TURSO_AUTH_TOKEN?.trim();
  if (process.env.VERCEL && !urlRemota) {
    throw new Error("Configura TURSO_DATABASE_URL y TURSO_AUTH_TOKEN en Vercel. SQLite local no ofrece persistencia serverless.");
  }
  if (urlRemota && (!/^(libsql|https):\/\//.test(urlRemota) || !authToken)) {
    throw new Error("La conexión remota requiere TURSO_DATABASE_URL (libsql:// o https://) y TURSO_AUTH_TOKEN.");
  }
  if (authToken && !urlRemota) throw new Error("Falta TURSO_DATABASE_URL para el TURSO_AUTH_TOKEN configurado.");
  let url = urlRemota;
  if (!url) {
    const ruta = rutaDb();
    if (ruta !== ":memory:") mkdirSync(path.dirname(path.resolve(ruta)), { recursive: true });
    url = ruta === ":memory:" ? ":memory:" : pathToFileURL(path.resolve(ruta)).href;
  }
  cliente = createClient({ url, authToken: urlRemota ? authToken : undefined, timeout: 5000 });
  db = crearAdaptador(cliente);
  return db;
}

function crearAdaptador(client: Client) {
  let inicializacion: Promise<unknown> | undefined;
  const listo = () => {
    // DDL idempotente y atómico. Un error transitorio permite reintentar la inicialización.
    inicializacion ??= client.batch(ESQUEMA.split(";").map(s => s.trim()).filter(Boolean), "write")
      .catch(error => { inicializacion = undefined; throw error; });
    return inicializacion;
  };
  return {
    prepare(sql: string) {
      const ejecutar = async (args: InValue[]) => { await listo(); return client.execute({ sql, args }); };
      return {
        async all(...args: InValue[]): Promise<Record<string, unknown>[]> { return (await ejecutar(args)).rows; },
        async get(...args: InValue[]): Promise<Record<string, unknown> | undefined> { return (await ejecutar(args)).rows[0]; },
        async run(...args: InValue[]) { return ejecutar(args); },
      };
    },
    async exec(sql: string) { await listo(); await client.executeMultiple(sql); },
    async batch(sentencias: InStatement[]) { await listo(); return client.batch(sentencias, "write"); },
  };
}

/** Cierra el cliente para simular otra instancia o reiniciar las pruebas. */
export function cerrarDb() {
  cliente?.close();
  cliente = null;
  db = null;
}

const ESQUEMA = `
    CREATE TABLE IF NOT EXISTS croma_extracciones (
      id TEXT PRIMARY KEY, tramite_id TEXT NOT NULL, url TEXT NOT NULL, solicitado_en TEXT NOT NULL,
      ok INTEGER NOT NULL, resultado_json TEXT, error TEXT, request_id TEXT
    );
    CREATE TABLE IF NOT EXISTS expedientes (
      id TEXT PRIMARY KEY, ref TEXT NOT NULL, creado_en TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS fuentes (
      id TEXT PRIMARY KEY, expediente_id TEXT NOT NULL REFERENCES expedientes(id),
      nombre_archivo TEXT NOT NULL, tipo TEXT NOT NULL, sha256 TEXT, importado_en TEXT NOT NULL,
      total_filas INTEGER, vinculados INTEGER, errores_json TEXT
    );
    CREATE UNIQUE INDEX IF NOT EXISTS fuentes_expediente_sha_unico ON fuentes (expediente_id, sha256);
    CREATE TABLE IF NOT EXISTS registros_no_vinculados (
      id TEXT PRIMARY KEY, fuente_id TEXT NOT NULL REFERENCES fuentes(id),
      ref TEXT, nombre TEXT, decision TEXT NOT NULL, motivo TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS procesos (
      id TEXT PRIMARY KEY, expediente_id TEXT NOT NULL REFERENCES expedientes(id),
      tramite_id TEXT NOT NULL, tipo_solicitante TEXT NOT NULL, abierto_en TEXT NOT NULL,
      autorizado INTEGER NOT NULL DEFAULT 0, autorizado_en TEXT,
      UNIQUE (expediente_id, tramite_id)
    );
    CREATE TABLE IF NOT EXISTS valores (
      id TEXT PRIMARY KEY, expediente_id TEXT NOT NULL REFERENCES expedientes(id),
      concepto TEXT NOT NULL, valor TEXT NOT NULL, valor_original TEXT NOT NULL, campo_origen TEXT NOT NULL,
      fecha_dato TEXT, importado_en TEXT NOT NULL, fuente_id TEXT NOT NULL REFERENCES fuentes(id), proceso_id TEXT
    );
    CREATE TABLE IF NOT EXISTS documentos (
      id TEXT PRIMARY KEY, expediente_id TEXT NOT NULL REFERENCES expedientes(id),
      tipo TEXT NOT NULL, nombre_archivo TEXT NOT NULL, fecha_emision TEXT, aportado_en TEXT NOT NULL,
      proceso_id TEXT, sha256 TEXT NOT NULL, tamano INTEGER NOT NULL, contenido BLOB NOT NULL, nota TEXT
    );
    CREATE TABLE IF NOT EXISTS confirmaciones (
      id TEXT PRIMARY KEY, expediente_id TEXT NOT NULL REFERENCES expedientes(id),
      objetivo TEXT NOT NULL, valor_clave TEXT NOT NULL, considerados_json TEXT NOT NULL,
      accion TEXT NOT NULL, motivo TEXT NOT NULL, autor TEXT NOT NULL, fecha TEXT NOT NULL,
      proceso_id TEXT, tramite_id TEXT
    );
    CREATE TABLE IF NOT EXISTS exportaciones (
      id TEXT PRIMARY KEY, proceso_id TEXT NOT NULL REFERENCES procesos(id),
      estado TEXT NOT NULL, generado_en TEXT NOT NULL, contenido_json TEXT NOT NULL
    );
  `;
