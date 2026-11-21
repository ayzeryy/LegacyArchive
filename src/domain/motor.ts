import type { Requisito, Tramite } from "./catalogo";
import { etiquetaConcepto } from "./conceptos";
import { claveComparacion } from "./normalizar";
import type { Confirmacion, DocumentoGuardado, Estado, ValorGuardado } from "./tipos";

/**
 * Motor determinista: compara el catálogo con el expediente.
 * Un dato se propone si existe, está autorizado para este proceso,
 * cumple la vigencia publicada (si la hay) y corresponde exactamente
 * al concepto solicitado. Ninguna regla usa semejanza de nombres.
 */

export interface EntradaMotor {
  tramite: Tramite;
  procesoId: string;
  valores: ValorGuardado[];
  documentos: DocumentoGuardado[];
  confirmaciones: Confirmacion[];
  /** La persona autorizó reutilizar su expediente en este proceso. */
  autorizado: boolean;
  hoy: Date;
}

export interface Opcion {
  clave: string;
  valor: string;
  procedencias: ValorGuardado[];
}

export interface EvaluacionRequisito {
  requisito: Requisito;
  aplica: true | false | "por_determinar";
  estado: Estado;
  explicacion: string;
  opciones: Opcion[];
  elegida?: Opcion;
  documento?: DocumentoGuardado;
  confirmacion?: Confirmacion;
  reutilizado: boolean;
  capturadoAqui: boolean;
}

export interface ResumenProceso {
  aplicables: number;
  preparados: number;
  porEstado: Record<Estado, number>;
  estadoExpediente: "borrador_incompleto" | "preparado_revision";
  reutilizados: number;
  capturados: number;
  compatiblesSinAutorizar: number;
  tramiteAplica: { aplica: boolean | null; texto: string } | null;
}

export interface EvaluacionProceso {
  requisitos: EvaluacionRequisito[];
  resumen: ResumenProceso;
}

export const ESTADOS_PREPARADOS: Estado[] = ["confirmado_usuario", "verificado_fuente_oficial"];

export function agruparOpciones(concepto: string, valores: ValorGuardado[]): Opcion[] {
  const grupos = new Map<string, ValorGuardado[]>();
  for (const v of valores.filter((x) => x.concepto === concepto)) {
    const k = claveComparacion(concepto, v.valor);
    grupos.set(k, [...(grupos.get(k) ?? []), v]);
  }
  return [...grupos.entries()].map(([clave, procedencias]) => {
    const ordenadas = [...procedencias].sort((a, b) => {
      const fa = a.fechaDato ?? "";
      const fb = b.fechaDato ?? "";
      if (fa !== fb) return fb.localeCompare(fa);
      return riqueza(b.valor) - riqueza(a.valor);
    });
    return { clave, valor: ordenadas[0].valor, procedencias: ordenadas };
  });
}

/** Prefiere la forma con minúsculas y acentos cuando dos valores son equivalentes. */
function riqueza(s: string): number {
  return (/[a-záéíóúñ]/.test(s) ? 2 : 0) + (/[áéíóúñÁÉÍÓÚÑ]/.test(s) ? 1 : 0);
}

function ultimaConfirmacion(confs: Confirmacion[], objetivo: string): Confirmacion | undefined {
  return confs
    .filter((c) => c.objetivo === objetivo && c.accion !== "autorizar_reutilizacion")
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .at(-1);
}

function esDeEsteProceso(v: { procesoId: string | null }, procesoId: string) {
  return v.procesoId === procesoId;
}

function resolverConcepto(concepto: string, valores: ValorGuardado[], confs: Confirmacion[]): Opcion | null {
  const ops = agruparOpciones(concepto, valores);
  const c = ultimaConfirmacion(confs, concepto);
  if (c) {
    const el = ops.find((o) => o.clave === c.valorClave);
    if (el && ops.every((o) => c.considerados.includes(o.clave))) return el;
  }
  return ops.length === 1 ? ops[0] : null;
}

export function evaluarProceso(e: EntradaMotor): EvaluacionProceso {
  const visibles = e.autorizado ? e.valores : e.valores.filter((v) => esDeEsteProceso(v, e.procesoId));
  const docsVisibles = e.autorizado ? e.documentos : e.documentos.filter((d) => esDeEsteProceso(d, e.procesoId));
  let compatiblesSinAutorizar = 0;

  const requisitos = e.tramite.requisitos.map((r): EvaluacionRequisito => {
    let aplica: EvaluacionRequisito["aplica"] = true;
    if (r.condicion) {
      const v = resolverConcepto(r.condicion.concepto, visibles, e.confirmaciones);
      aplica = v ? v.clave === claveComparacion(r.condicion.concepto, r.condicion.igual) : "por_determinar";
    }

    if (r.tipo === "dato") {
      const opciones = agruparOpciones(r.concepto, visibles);
      if (!e.autorizado && opciones.length === 0 && e.valores.some((v) => v.concepto === r.concepto)) compatiblesSinAutorizar++;
      const conf = ultimaConfirmacion(e.confirmaciones, r.concepto);
      let estado: Estado;
      let elegida: Opcion | undefined;
      let explicacion: string;
      const confVigente = conf && opciones.some((o) => o.clave === conf.valorClave) && opciones.every((o) => conf.considerados.includes(o.clave));
      if (opciones.length === 0) {
        estado = "faltante";
        explicacion = `No hay ningún valor para «${etiquetaConcepto(r.concepto)}» en el expediente.`;
      } else if (confVigente) {
        estado = "confirmado_usuario";
        elegida = opciones.find((o) => o.clave === conf!.valorClave);
        explicacion = "Lo revisaste. No implica validación institucional.";
      } else if (opciones.length > 1) {
        estado = "en_conflicto";
        explicacion = `Hay ${opciones.length} valores incompatibles de fuentes distintas. Elige cuál usar; ambos se conservan.`;
      } else {
        estado = "disponible";
        elegida = opciones[0];
        explicacion = "Encontrado en el expediente. Revísalo antes de confirmarlo.";
      }
      if (aplica === "por_determinar") {
        estado = "por_confirmar";
        explicacion = `Depende de una condición aún desconocida: ${r.condicion!.texto}.`;
      }
      const capturadoAqui = !!elegida?.procedencias.some((p) => esDeEsteProceso(p, e.procesoId));
      return {
        requisito: r, aplica, estado, explicacion, opciones, elegida, confirmacion: confVigente ? conf : undefined,
        capturadoAqui,
        reutilizado: !!elegida && !capturadoAqui,
      };
    }

    // Documento
    const docs = docsVisibles.filter((d) => d.tipo === r.documento).sort((a, b) => a.aportadoEn.localeCompare(b.aportadoEn));
    const doc = docs.at(-1);
    if (!e.autorizado && !doc && e.documentos.some((d) => d.tipo === r.documento)) compatiblesSinAutorizar++;
    const conf = ultimaConfirmacion(e.confirmaciones, `documento:${r.documento}`);
    const confVigente = !!doc && conf?.valorClave === doc.id;
    let estado: Estado;
    let explicacion: string;
    if (!doc) {
      estado = "faltante";
      explicacion = "No se ha aportado este documento.";
    } else if (r.vigencia.tipo === "dias_maximos") {
      if (!doc.fechaEmision) {
        estado = "por_confirmar";
        explicacion = `La fuente exige un máximo de ${r.vigencia.dias} días y no se conoce la fecha de emisión.`;
      } else {
        const dias = (e.hoy.getTime() - new Date(`${doc.fechaEmision}T00:00:00Z`).getTime()) / 86_400_000;
        if (dias > r.vigencia.dias) {
          estado = "vencido";
          explicacion = `Emitido hace ${Math.floor(dias)} días; la regla publicada admite ${r.vigencia.dias}.`;
        } else {
          estado = confVigente ? "confirmado_usuario" : "disponible";
          explicacion = confVigente ? "Lo revisaste. No implica validación institucional." : "Cumple la regla de vigencia publicada. Revísalo.";
        }
      }
    } else if (confVigente) {
      estado = "confirmado_usuario";
      explicacion = "Lo revisaste. No implica validación institucional.";
    } else if (r.vigencia.tipo === "condicion_sin_plazo") {
      estado = "por_confirmar";
      explicacion = `La fuente pide: «${r.vigencia.texto}», sin plazo publicado. Solo tú puedes declararlo; Lazô no lo verifica.`;
    } else {
      estado = "disponible";
      explicacion = "Documento aportado. Revisa que sea el correcto.";
    }
    if (aplica === "por_determinar") {
      estado = "por_confirmar";
      explicacion = `Depende de una condición aún desconocida: ${r.condicion!.texto}.`;
    }
    const capturadoAqui = !!doc && esDeEsteProceso(doc, e.procesoId);
    return {
      requisito: r, aplica, estado, explicacion, opciones: [], documento: doc, confirmacion: confVigente ? conf : undefined,
      capturadoAqui, reutilizado: !!doc && !capturadoAqui,
    };
  });

  const aplicables = requisitos.filter((r) => r.aplica !== false);
  const porEstado = Object.fromEntries(
    (["disponible", "confirmado_usuario", "en_conflicto", "faltante", "vencido", "por_confirmar", "verificado_fuente_oficial"] as Estado[]).map((s) => [s, 0]),
  ) as Record<Estado, number>;
  aplicables.forEach((r) => porEstado[r.estado]++);
  const preparados = aplicables.filter((r) => ESTADOS_PREPARADOS.includes(r.estado)).length;

  let tramiteAplica: ResumenProceso["tramiteAplica"] = null;
  if (e.tramite.aplica_si) {
    const a = e.tramite.aplica_si;
    const v = resolverConcepto(a.concepto, visibles, e.confirmaciones);
    const n = v ? Number(v.valor) : NaN;
    tramiteAplica = { aplica: Number.isFinite(n) ? n >= a.minimo : null, texto: a.texto };
  }

  return {
    requisitos,
    resumen: {
      aplicables: aplicables.length,
      preparados,
      porEstado,
      estadoExpediente: aplicables.length > 0 && preparados === aplicables.length ? "preparado_revision" : "borrador_incompleto",
      reutilizados: aplicables.filter((r) => r.reutilizado && ESTADOS_PREPARADOS.includes(r.estado)).length,
      capturados: aplicables.filter((r) => r.capturadoAqui).length,
      compatiblesSinAutorizar,
      tramiteAplica,
    },
  };
}
