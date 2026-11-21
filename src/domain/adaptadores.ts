import { z } from "zod";
import type { Concepto } from "./conceptos";
import { fechaHeredada, fechaISO, limpiarEspacios, normalizarCUI, normalizarNIT } from "./normalizar";

/**
 * Adaptadores de solo lectura. Transforman cada fuente al modelo común
 * y conservan el valor original, el campo de origen y la fecha conocida.
 * Nunca modifican el archivo de origen.
 */

export interface ValorExtraido {
  concepto: Concepto;
  valor: string;
  valorOriginal: string;
  campoOrigen: string;
  fechaDato: string | null;
}

export interface RegistroNormalizado {
  indice: number;
  /** Referencia de expediente compartida entre sistemas (NO_EXP / case_ref). */
  refExpediente: string | null;
  /** Solo para mostrar. Nunca se usa para vincular. */
  nombreReferencia: string;
  cui: string | null;
  nit: string | null;
  valores: ValorExtraido[];
}

export type FormatoFuente = "csv_heredado" | "dbf_heredado" | "json_exportacion";

export type ResultadoLectura =
  | { ok: true; formato: FormatoFuente; registros: RegistroNormalizado[]; errores: { fila: number; mensaje: string }[]; totalFilas: number }
  | { ok: false; error: string };

export function leerFuente(nombreArchivo: string, bytes: Uint8Array): ResultadoLectura {
  const ext = nombreArchivo.toLowerCase().split(".").pop();
  if (ext === "csv") return leerCsvHeredado(decodificar(bytes));
  if (ext === "json") return leerJsonExportacion(decodificar(bytes));
  if (ext === "dbf") return leerDbfHeredado(bytes);
  if (ext === "mdb" || ext === "accdb") {
    return { ok: false, error: "Los archivos de Access (.mdb) todavía no se leen en esta demo. Exporta la tabla a DBF o CSV." };
  }
  return { ok: false, error: `Formato no admitido (.${ext ?? "?"}). Usa el CSV o el DBF del sistema antiguo, o el JSON de exportación.` };
}

/** UTF-8 si es válido; si no, Windows-1252 (habitual en sistemas antiguos). */
function decodificar(bytes: Uint8Array): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes).replace(/^﻿/, "");
  } catch {
    return new TextDecoder("windows-1252").decode(bytes);
  }
}

// ---------- CSV heredado ----------

const COLUMNAS_OBLIGATORIAS = ["NO_EXP", "DPI_NO", "NIT_CONT", "NOM1", "APE1", "DIR_FISC", "DIR_NEG", "FEC_ACT", "MUESTRA"] as const;

function dividirLinea(linea: string, sep: string): string[] {
  const out: string[] = [];
  let actual = "";
  let comillas = false;
  for (let i = 0; i < linea.length; i++) {
    const c = linea[i];
    if (c === '"') {
      if (comillas && linea[i + 1] === '"') {
        actual += '"';
        i++;
      } else comillas = !comillas;
    } else if (c === sep && !comillas) {
      out.push(actual);
      actual = "";
    } else actual += c;
  }
  out.push(actual);
  return out.map((x) => x.trim());
}

function leerCsvHeredado(texto: string): ResultadoLectura {
  const lineas = texto.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lineas.length < 2) return { ok: false, error: "El CSV no tiene filas de datos." };
  const sep = lineas[0].includes(";") ? ";" : ",";
  const cab = dividirLinea(lineas[0], sep).map((c) => c.toUpperCase());
  const faltan = COLUMNAS_OBLIGATORIAS.filter((c) => !cab.includes(c));
  if (faltan.length) {
    return { ok: false, error: `El CSV no tiene la estructura del sistema antiguo. Faltan las columnas: ${faltan.join(", ")}.` };
  }
  return mapearTablaHeredada(cab, lineas.slice(1).map((l) => dividirLinea(l, sep)), "csv_heredado", 2);
}

/**
 * Lleva una tabla del sistema antiguo (CSV o DBF, mismas columnas) al modelo común.
 * `primeraFila` es el número que se muestra al usuario para la primera fila de datos.
 */
function mapearTablaHeredada(cab: string[], filas: string[][], formato: "csv_heredado" | "dbf_heredado", primeraFila: number): ResultadoLectura {
  const registros: RegistroNormalizado[] = [];
  const errores: { fila: number; mensaje: string }[] = [];

  filas.forEach((celdas, i) => {
    const fila = i + primeraFila;
    const get = (c: string) => limpiarEspacios(celdas[cab.indexOf(c)] ?? "");
    if (get("MUESTRA").toUpperCase() !== "SINTETICO") {
      errores.push({ fila, mensaje: "La fila no está marcada como sintética (MUESTRA=SINTETICO). Esta demo solo admite datos sintéticos." });
      return;
    }
    const cuiOrig = get("DPI_NO");
    const cui = normalizarCUI(cuiOrig);
    if (!cui) {
      errores.push({ fila, mensaje: `CUI inválido en DPI_NO («${cuiOrig}»): debe tener 13 dígitos.` });
      return;
    }
    const nitOrig = get("NIT_CONT");
    const nit = nitOrig ? normalizarNIT(nitOrig) : null;
    if (nitOrig && !nit) {
      errores.push({ fila, mensaje: `NIT con formato inválido en NIT_CONT («${nitOrig}»).` });
      return;
    }
    const fechaDato = fechaHeredada(get("FEC_ACT"));
    const valores: ValorExtraido[] = [];
    const add = (concepto: Concepto, valor: string | null, original: string, campo: string) => {
      if (valor && valor.trim()) valores.push({ concepto, valor, valorOriginal: original, campoOrigen: campo, fechaDato });
    };
    add("persona.cui", cui, cuiOrig, "DPI_NO");
    add("persona.nit", nit, nitOrig, "NIT_CONT");
    const nombres = [get("NOM1"), get("NOM2")].filter(Boolean).join(" ");
    const apellidos = [get("APE1"), get("APE2")].filter(Boolean).join(" ");
    add("persona.nombres", nombres, [get("NOM1"), get("NOM2")].join(" | "), "NOM1+NOM2");
    add("persona.apellidos", apellidos, [get("APE1"), get("APE2")].join(" | "), "APE1+APE2");
    for (const [col, concepto] of [
      ["NACION", "persona.nacionalidad"],
      ["PROFESION", "persona.profesion"],
      ["DIR_FISC", "direccion.fiscal"],
      ["DIR_NEG", "empresa.direccion_comercial"],
      ["TEL", "persona.telefono"],
      ["NOM_COM", "empresa.nombre_comercial"],
      ["ACT_ECO", "empresa.objeto"],
    ] as const) {
      if (cab.includes(col)) add(concepto, get(col), get(col), col);
    }
    registros.push({ indice: i, refExpediente: get("NO_EXP") || null, nombreReferencia: `${nombres} ${apellidos}`.trim(), cui, nit, valores });
  });

  return { ok: true, formato, registros, errores, totalFilas: filas.length };
}

// ---------- DBF heredado (dBASE III / FoxPro) ----------

/**
 * Lector mínimo de DBF, solo lectura: cabecera de 32 bytes, descriptores de campo
 * de 32 bytes hasta 0x0D y registros de longitud fija. El texto se decodifica como
 * Windows-1252. Los registros marcados como borrados («*») se ignoran.
 */
export function leerTablaDbf(bytes: Uint8Array): { campos: string[]; filas: string[][]; borrados: number } {
  if (bytes.length < 33) throw new Error("El archivo es demasiado corto para ser un DBF.");
  const vista = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const total = vista.getUint32(4, true);
  const largoCabecera = vista.getUint16(8, true);
  const largoRegistro = vista.getUint16(10, true);
  if (largoCabecera < 33 || largoRegistro < 2 || largoCabecera > bytes.length) throw new Error("La cabecera del DBF no es válida.");
  const texto = new TextDecoder("windows-1252");
  const campos: { nombre: string; largo: number }[] = [];
  for (let o = 32; o + 32 <= largoCabecera && bytes[o] !== 0x0d; o += 32) {
    const crudo = bytes.subarray(o, o + 11);
    const fin = crudo.indexOf(0);
    campos.push({ nombre: texto.decode(fin >= 0 ? crudo.subarray(0, fin) : crudo).trim().toUpperCase(), largo: bytes[o + 16] });
  }
  if (campos.length === 0) throw new Error("El DBF no declara campos.");
  const filas: string[][] = [];
  let borrados = 0;
  for (let r = 0; r < total; r++) {
    const inicio = largoCabecera + r * largoRegistro;
    if (inicio + largoRegistro > bytes.length) break;
    if (bytes[inicio] === 0x2a) {
      borrados++;
      continue;
    }
    let o = inicio + 1;
    filas.push(campos.map((c) => {
      const v = texto.decode(bytes.subarray(o, o + c.largo)).replace(/\0/g, "").trim();
      o += c.largo;
      return v;
    }));
  }
  return { campos: campos.map((c) => c.nombre), filas, borrados };
}

function leerDbfHeredado(bytes: Uint8Array): ResultadoLectura {
  let tabla: ReturnType<typeof leerTablaDbf>;
  try {
    tabla = leerTablaDbf(bytes);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  if (tabla.filas.length === 0) return { ok: false, error: "El DBF no tiene registros activos." };
  const faltan = COLUMNAS_OBLIGATORIAS.filter((c) => !tabla.campos.includes(c));
  if (faltan.length) {
    return { ok: false, error: `El DBF no tiene la estructura del sistema antiguo. Faltan los campos: ${faltan.join(", ")}.` };
  }
  return mapearTablaHeredada(tabla.campos, tabla.filas, "dbf_heredado", 1);
}

// ---------- JSON de exportación ----------

const texto = z.string().trim().optional();

const RegistroExportacion = z
  .object({
    case_ref: texto,
    document_type: texto,
    document_number: texto,
    tax_id: texto,
    given_names: texto,
    family_names: texto,
    full_name: texto,
    nationality: texto,
    department: texto,
    fiscal_address: texto,
    business_address: texto,
    home_address: texto,
    phone: texto,
    email: texto,
    trade_name: texto,
    updated_at: texto,
  })
  .passthrough();

const Exportacion = z.object({
  export_version: z.string(),
  synthetic: z.literal(true, { errorMap: () => ({ message: "El archivo debe declarar \"synthetic\": true. Esta demo solo admite datos sintéticos." }) }),
  exported_at: z.string().optional(),
  records: z.array(z.unknown()).min(1, "La exportación no contiene registros."),
});

function leerJsonExportacion(textoJson: string): ResultadoLectura {
  let crudo: unknown;
  try {
    crudo = JSON.parse(textoJson);
  } catch (e) {
    return { ok: false, error: `El archivo no es JSON válido: ${(e as Error).message}` };
  }
  const exp = Exportacion.safeParse(crudo);
  if (!exp.success) {
    return { ok: false, error: `La exportación no tiene la estructura esperada: ${exp.error.issues.map((i) => `${i.path.join(".") || "raíz"}: ${i.message}`).join("; ")}` };
  }
  const registros: RegistroNormalizado[] = [];
  const errores: { fila: number; mensaje: string }[] = [];

  exp.data.records.forEach((r, i) => {
    const fila = i + 1;
    const p = RegistroExportacion.safeParse(r);
    if (!p.success) {
      errores.push({ fila, mensaje: "Registro con campos de tipo inesperado." });
      return;
    }
    const d = p.data;
    const campo = (k: string) => `records[${i}].${k}`;
    const cui = d.document_number ? normalizarCUI(d.document_number) : null;
    if (d.document_number && !cui) {
      errores.push({ fila, mensaje: `CUI inválido en document_number («${d.document_number}»).` });
      return;
    }
    if (d.document_type && d.document_type.toUpperCase() !== "DPI") {
      errores.push({ fila, mensaje: `Tipo de documento «${d.document_type}» no modelado en la demo (solo DPI).` });
      return;
    }
    const nit = d.tax_id ? normalizarNIT(d.tax_id) : null;
    if (d.tax_id && !nit) {
      errores.push({ fila, mensaje: `NIT con formato inválido en tax_id («${d.tax_id}»).` });
      return;
    }
    const fechaDato = fechaISO(d.updated_at);
    const valores: ValorExtraido[] = [];
    const add = (concepto: Concepto, valor: string | null | undefined, original: string | undefined, k: string) => {
      if (valor && valor.trim()) valores.push({ concepto, valor: limpiarEspacios(valor), valorOriginal: original ?? valor, campoOrigen: campo(k), fechaDato });
    };
    add("persona.cui", cui, d.document_number, "document_number");
    add("persona.nit", nit, d.tax_id, "tax_id");
    add("persona.nombres", d.given_names, d.given_names, "given_names");
    add("persona.apellidos", d.family_names, d.family_names, "family_names");
    // Un nombre completo sin componentes no se separa automáticamente.
    if (!d.given_names && !d.family_names) add("persona.nombre_completo", d.full_name, d.full_name, "full_name");
    add("persona.nacionalidad", d.nationality, d.nationality, "nationality");
    add("persona.departamento_domicilio", d.department, d.department, "department");
    add("direccion.fiscal", d.fiscal_address, d.fiscal_address, "fiscal_address");
    add("empresa.direccion_comercial", d.business_address, d.business_address, "business_address");
    add("direccion.residencia", d.home_address, d.home_address, "home_address");
    add("persona.telefono", d.phone, d.phone, "phone");
    add("persona.correo", d.email, d.email, "email");
    add("empresa.nombre_comercial", d.trade_name, d.trade_name, "trade_name");
    const nombre = [d.given_names, d.family_names].filter(Boolean).join(" ") || d.full_name || "(sin nombre)";
    registros.push({ indice: i, refExpediente: d.case_ref ?? null, nombreReferencia: nombre, cui, nit, valores });
  });

  return { ok: true, formato: "json_exportacion", registros, errores, totalFilas: exp.data.records.length };
}
