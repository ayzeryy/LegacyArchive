/**
 * Conceptos del modelo común. Cada valor importado o capturado se guarda
 * bajo uno de estos conceptos; nunca se mezclan entre sí (por ejemplo,
 * dirección fiscal y dirección comercial son conceptos distintos).
 */
export const CONCEPTOS = {
  "persona.cui": { etiqueta: "CUI del DPI", grupo: "Identificación", ayuda: "Código Único de Identificación (13 dígitos). No es el NIT." },
  "persona.nit": { etiqueta: "NIT", grupo: "Identificación", ayuda: "Número de Identificación Tributaria. No es el CUI." },
  "persona.nombres": { etiqueta: "Nombres", grupo: "Persona" },
  "persona.apellidos": { etiqueta: "Apellidos", grupo: "Persona" },
  "persona.nombre_completo": { etiqueta: "Nombre completo (sin separar)", grupo: "Persona", ayuda: "No se separa automáticamente en nombres y apellidos." },
  "persona.nacionalidad": { etiqueta: "Nacionalidad", grupo: "Persona" },
  "persona.estado_civil": { etiqueta: "Estado civil", grupo: "Persona", opciones: ["Soltera/o", "Casada/o"] },
  "persona.profesion": { etiqueta: "Profesión u oficio", grupo: "Persona" },
  "persona.departamento_domicilio": { etiqueta: "Departamento de domicilio", grupo: "Persona", ayuda: "No se deduce de la dirección: requiere un catálogo geográfico explícito." },
  "persona.telefono": { etiqueta: "Teléfono", grupo: "Contacto" },
  "persona.correo": { etiqueta: "Correo electrónico", grupo: "Contacto" },
  "persona.inscrita_comerciante": { etiqueta: "¿Ya está inscrita como comerciante individual?", grupo: "Situación", opciones: ["si", "no"] },
  "direccion.fiscal": { etiqueta: "Dirección fiscal", grupo: "Direcciones", ayuda: "La registrada ante SAT. No completa la dirección comercial." },
  "direccion.residencia": { etiqueta: "Dirección de residencia", grupo: "Direcciones" },
  "empresa.nombre_comercial": { etiqueta: "Nombre comercial", grupo: "Empresa" },
  "empresa.direccion_comercial": { etiqueta: "Dirección de la empresa", grupo: "Direcciones", ayuda: "Donde opera el negocio. Distinta de la fiscal y de la residencia." },
  "empresa.objeto": { etiqueta: "Objeto o actividad", grupo: "Empresa" },
  "empresa.fecha_inicio": { etiqueta: "Fecha de inicio de actividades", grupo: "Empresa", formato: "fecha_o_al_inscribirse" },
  "empresa.empleados_a_contratar": { etiqueta: "Número de empleados a contratar", grupo: "Empresa", formato: "entero" },
  "empresa.copropiedad": { etiqueta: "¿La empresa tiene copropietarios?", grupo: "Situación", opciones: ["si", "no"] },
  "empresa.trabajadores_a_inscribir": { etiqueta: "Cantidad de trabajadores a inscribir", grupo: "Empresa", formato: "entero" },
} as const satisfies Record<string, { etiqueta: string; grupo: string; ayuda?: string; opciones?: readonly string[]; formato?: string }>;

export type Concepto = keyof typeof CONCEPTOS;

export const esConcepto = (c: string): c is Concepto => c in CONCEPTOS;

export function etiquetaConcepto(c: string): string {
  return esConcepto(c) ? CONCEPTOS[c].etiqueta : c;
}

export const TIPOS_DOCUMENTO = {
  dpi: "Copia del DPI de la propietaria",
  constancia_rtu: "Constancia del RTU (SAT)",
  patente_empresa: "Patente de Comercio de Empresa",
  comprobante_pago_empresa: "Comprobante de pago: inscripción de empresa (código 18)",
  comprobante_pago_comerciante: "Comprobante de pago: inscripción de comerciante (código 13)",
  mandato: "Mandato o carta poder",
  certificacion: "Certificación",
} as const;

export type TipoDocumento = keyof typeof TIPOS_DOCUMENTO;
export const esTipoDocumento = (t: string): t is TipoDocumento => t in TIPOS_DOCUMENTO;
