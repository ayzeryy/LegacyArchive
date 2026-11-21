import { z } from "zod";
import { CONCEPTOS, TIPOS_DOCUMENTO } from "./conceptos";

/**
 * Catálogo público: requisitos, condiciones, fuentes y versiones.
 * No contiene datos de ninguna persona.
 */

const Concepto = z.enum(Object.keys(CONCEPTOS) as [keyof typeof CONCEPTOS, ...(keyof typeof CONCEPTOS)[]]);
const TipoDoc = z.enum(Object.keys(TIPOS_DOCUMENTO) as [keyof typeof TIPOS_DOCUMENTO, ...(keyof typeof TIPOS_DOCUMENTO)[]]);

export const Vigencia = z.discriminatedUnion("tipo", [
  z.object({ tipo: z.literal("sin_regla_publicada") }),
  z.object({ tipo: z.literal("dias_maximos"), dias: z.number().int().positive(), fuente_url: z.string().url() }),
  z.object({ tipo: z.literal("condicion_sin_plazo"), texto: z.string() }),
]);

export const Base = z.enum(["requisito_oficial", "formulario_oficial", "supuesto_demo"]);

const RequisitoBase = z.object({
  id: z.string(),
  titulo: z.string(),
  /** Texto tal como aparece en la fuente, o descripción del campo del formulario. */
  descripcion_original: z.string(),
  porque: z.string(),
  donde_obtener: z.string(),
  base: Base,
  fuente_url: z.string().url(),
  fuente_titulo: z.string(),
  vigencia: Vigencia,
  condicion: z.object({ concepto: Concepto, igual: z.string(), texto: z.string() }).nullable(),
  relacionados: z.array(Concepto).optional(),
});

export const Requisito = z.discriminatedUnion("tipo", [
  RequisitoBase.extend({ tipo: z.literal("dato"), concepto: Concepto }),
  RequisitoBase.extend({ tipo: z.literal("documento"), documento: TipoDoc }),
]);

export const Tramite = z.object({
  id: z.string(),
  institucion: z.string(),
  nombre: z.string(),
  nombre_corto: z.string(),
  canal_oficial_url: z.string().url(),
  tipos_solicitante: z.array(z.string()),
  aplica_si: z.object({ concepto: Concepto, minimo: z.number(), texto: z.string(), fuente_url: z.string().url() }).optional(),
  pasos_oficiales: z.array(z.object({ texto: z.string(), fuente_url: z.string().url() })),
  no_modelado: z.array(z.string()),
  fuentes: z.array(z.object({ titulo: z.string(), url: z.string().url(), revisado_en: z.string(), nota: z.string().optional() })),
  requisitos: z.array(Requisito),
});

export const Catalogo = z.object({
  version: z.string(),
  revisado_en: z.string(),
  metodo: z.string(),
  alcance: z.string(),
  croma: z.object({ estado: z.enum(["pendiente", "probado"]), nota: z.string() }),
  tramites: z.array(Tramite),
});

export type Requisito = z.infer<typeof Requisito>;
export type Tramite = z.infer<typeof Tramite>;
export type Catalogo = z.infer<typeof Catalogo>;
export type Vigencia = z.infer<typeof Vigencia>;

export const ETIQUETA_BASE: Record<z.infer<typeof Base>, string> = {
  requisito_oficial: "Requisito publicado",
  formulario_oficial: "Campo del formulario oficial",
  supuesto_demo: "Supuesto de la demo",
};
