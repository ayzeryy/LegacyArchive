/** Utilidades de normalización. Ninguna inventa información. */

export function quitarAcentos(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function limpiarEspacios(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/** CUI: 13 dígitos. Se aceptan espacios o guiones de presentación. */
export function normalizarCUI(s: string): string | null {
  const d = s.replace(/[\s-]/g, "");
  return /^\d{13}$/.test(d) ? d : null;
}

/** NIT: dígitos, guion opcional y dígito verificador (0-9 o K). Solo se valida el formato. */
export function normalizarNIT(s: string): string | null {
  const t = s.replace(/\s/g, "").toUpperCase();
  const m = /^(\d{1,12})-?([0-9K])$/.exec(t);
  return m ? `${m[1]}-${m[2]}` : null;
}

/** Fecha heredada dd/mm/aaaa → aaaa-mm-dd. Devuelve null si no es una fecha válida. */
export function fechaHeredada(s: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s.trim());
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  const d = new Date(`${yyyy}-${mm}-${dd}T00:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.getUTCDate() !== Number(dd)) return null;
  return `${yyyy}-${mm}-${dd}`;
}

export function fechaISO(s: string | undefined | null): string | null {
  if (!s) return null;
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(s);
  return m ? m[1] : null;
}

/**
 * Clave de comparación: dos valores con la misma clave se consideran
 * el mismo dato escrito de otra forma (mayúsculas, acentos, puntuación).
 */
export function claveComparacion(concepto: string, valor: string): string {
  if (concepto === "persona.cui") return normalizarCUI(valor) ?? valor;
  if (concepto === "persona.nit") return normalizarNIT(valor) ?? valor;
  if (concepto === "persona.telefono") {
    const d = valor.replace(/\D/g, "");
    return d.length === 11 && d.startsWith("502") ? d.slice(3) : d;
  }
  let t = quitarAcentos(valor).toLowerCase();
  t = t.replace(/(\d)\s*(a|o)\.?(?=\s)/g, "$1$2"); // "4a." → "4a"
  t = t.replace(/[.,;:]/g, " ");
  return limpiarEspacios(t);
}

export function nombreParecido(a: string, b: string): boolean {
  const k = (s: string) => limpiarEspacios(quitarAcentos(s).toLowerCase());
  const ta = k(a).split(" ");
  const tb = k(b).split(" ");
  const comunes = ta.filter((x) => tb.includes(x)).length;
  return comunes >= Math.min(2, ta.length, tb.length);
}
