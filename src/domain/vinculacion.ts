import type { RegistroNormalizado } from "./adaptadores";
import { nombreParecido } from "./normalizar";

/**
 * Regla: un registro se vincula al expediente solo por la referencia de
 * expediente compartida y con identificadores exactos compatibles.
 * Un nombre igual o parecido nunca basta.
 */

export interface ContextoExpediente {
  ref: string;
  cuis: string[];
  nits: string[];
  nombreReferencia?: string;
}

export type Decision = "vinculado" | "no_vinculado" | "bloqueado";

export interface DecisionVinculacion {
  registro: RegistroNormalizado;
  decision: Decision;
  motivo: string;
}

export function decidirVinculacion(exp: ContextoExpediente, registros: RegistroNormalizado[]): DecisionVinculacion[] {
  const mismos = registros.filter((r) => r.refExpediente === exp.ref);
  const cuisLote = new Set(mismos.map((r) => r.cui).filter(Boolean) as string[]);
  const nitsLote = new Set(mismos.map((r) => r.nit).filter(Boolean) as string[]);
  const nombreExp = exp.nombreReferencia ?? mismos[0]?.nombreReferencia ?? "";

  return registros.map((r) => {
    if (r.refExpediente !== exp.ref) {
      const parecido = nombreExp && nombreParecido(nombreExp, r.nombreReferencia);
      return {
        registro: r,
        decision: "no_vinculado",
        motivo: parecido
          ? `Pertenece a otro expediente (${r.refExpediente ?? "sin referencia"}). El nombre se parece, pero no se vincula por semejanza de nombre.`
          : `Pertenece a otro expediente (${r.refExpediente ?? "sin referencia"}).`,
      };
    }
    if (r.cui && exp.cuis.length && !exp.cuis.includes(r.cui)) {
      return { registro: r, decision: "bloqueado", motivo: `Misma referencia de expediente, pero el CUI ${r.cui} no coincide con el del expediente. No se vincula automáticamente aunque el nombre sea igual.` };
    }
    if (r.nit && exp.nits.length && !exp.nits.includes(r.nit)) {
      return { registro: r, decision: "bloqueado", motivo: `Misma referencia de expediente, pero el NIT ${r.nit} no coincide con el del expediente.` };
    }
    if (!exp.cuis.length && cuisLote.size > 1) {
      return { registro: r, decision: "bloqueado", motivo: `La fuente trae ${cuisLote.size} CUI distintos para la misma referencia de expediente. No se puede decidir cuál corresponde.` };
    }
    if (!exp.nits.length && nitsLote.size > 1) {
      return { registro: r, decision: "bloqueado", motivo: `La fuente trae ${nitsLote.size} NIT distintos para la misma referencia de expediente.` };
    }
    return { registro: r, decision: "vinculado", motivo: "Misma referencia de expediente e identificadores compatibles." };
  });
}
