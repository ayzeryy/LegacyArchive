export type TipoFuente = "csv_heredado" | "json_exportacion" | "captura_usuario" | "respuesta_inicial";

export const ETIQUETA_FUENTE: Record<TipoFuente, string> = {
  csv_heredado: "Sistema antiguo (CSV)",
  json_exportacion: "Exportación del gestor (JSON)",
  captura_usuario: "Escrito por la persona",
  respuesta_inicial: "Respuesta al iniciar el trámite",
};

export interface ValorGuardado {
  id: string;
  concepto: string;
  /** Valor normalizado (por ejemplo, CUI sin espacios). */
  valor: string;
  /** Valor exactamente como venía en la fuente. */
  valorOriginal: string;
  campoOrigen: string;
  /** Fecha conocida del dato en la fuente. null = desconocida (no se inventa). */
  fechaDato: string | null;
  importadoEn: string;
  fuente: { id: string; nombre: string; tipo: TipoFuente };
  /** Proceso en el que se escribió el valor, si se capturó a mano. */
  procesoId: string | null;
}

export interface DocumentoGuardado {
  id: string;
  tipo: string;
  nombreArchivo: string;
  /** Fecha de emisión declarada. null = desconocida. */
  fechaEmision: string | null;
  aportadoEn: string;
  procesoId: string | null;
  sintetico: true;
  sha256: string;
  tamano: number;
  nota?: string | null;
}

export type AccionConfirmacion = "confirmar" | "resolver_conflicto" | "corregir" | "capturar" | "confirmar_documento" | "autorizar_reutilizacion";

export interface Confirmacion {
  id: string;
  /** Concepto (p. ej. "empresa.direccion_comercial") o "documento:<tipo>". */
  objetivo: string;
  /** Clave de la opción elegida (o id del documento). */
  valorClave: string;
  /** Claves que la persona tenía a la vista al decidir. */
  considerados: string[];
  accion: AccionConfirmacion;
  motivo: string;
  autor: string;
  fecha: string;
  procesoId: string | null;
  tramiteId: string | null;
}

export type Estado =
  | "disponible"
  | "confirmado_usuario"
  | "en_conflicto"
  | "faltante"
  | "vencido"
  | "por_confirmar"
  | "verificado_fuente_oficial";

export const ETIQUETA_ESTADO: Record<Estado, string> = {
  disponible: "Disponible",
  confirmado_usuario: "Confirmado por la persona",
  en_conflicto: "En conflicto",
  faltante: "Faltante",
  vencido: "Vencido",
  por_confirmar: "Por confirmar",
  verificado_fuente_oficial: "Verificado en fuente oficial",
};

export const EXPLICACION_ESTADO: Record<Estado, string> = {
  disponible: "Está en el expediente; falta que lo revises.",
  confirmado_usuario: "Lo revisaste. No implica validación de ninguna institución.",
  en_conflicto: "Hay valores incompatibles. Elige cuál usar y explica por qué.",
  faltante: "No hay dato ni documento que cubra el requisito.",
  vencido: "Incumple una regla de vigencia documentada.",
  por_confirmar: "No hay evidencia suficiente para decidir.",
  verificado_fuente_oficial: "Solo con una verificación real y su evidencia. No se usa en esta demo.",
};
