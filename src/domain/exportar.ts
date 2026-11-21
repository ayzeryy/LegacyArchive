import type { Catalogo, Tramite } from "./catalogo";
import { ETIQUETA_BASE } from "./catalogo";
import { etiquetaConcepto, TIPOS_DOCUMENTO } from "./conceptos";
import type { EvaluacionProceso } from "./motor";
import { ETIQUETA_ESTADO, ETIQUETA_FUENTE, type Confirmacion } from "./tipos";

export const ESTADO_SALIDA = {
  borrador_incompleto: "Borrador incompleto",
  preparado_revision: "Preparado para revisión según el catálogo de la demo",
} as const;

export function construirExportacion(args: {
  catalogo: Pick<Catalogo, "version" | "revisado_en" | "alcance" | "metodo">;
  tramite: Tramite;
  procesoId: string;
  evaluacion: EvaluacionProceso;
  confirmaciones: Confirmacion[];
  generadoEn: string;
}) {
  const { evaluacion: ev, tramite: t } = args;
  return {
    formato: "legacyarchive.expediente/v1",
    aviso: "DATOS SINTÉTICOS DE DEMOSTRACIÓN. Este archivo no es una inscripción presentada ni aprobada. Ninguna institución verificó su contenido.",
    estado: ESTADO_SALIDA[ev.resumen.estadoExpediente],
    generado_en: args.generadoEn,
    tramite: { id: t.id, nombre: t.nombre, institucion: t.institucion, canal_oficial: t.canal_oficial_url, pasos_oficiales: t.pasos_oficiales.map((p) => p.texto) },
    catalogo: { version: args.catalogo.version, revisado_en: args.catalogo.revisado_en, alcance: args.catalogo.alcance, metodo: args.catalogo.metodo },
    verificacion_institucional: "No realizada. «Confirmado por la persona» no equivale a validación gubernamental.",
    aplicabilidad_del_tramite: ev.resumen.tramiteAplica,
    resumen: {
      requisitos_aplicables_modelados: ev.resumen.aplicables,
      preparados: ev.resumen.preparados,
      pendientes: ev.resumen.aplicables - ev.resumen.preparados,
      por_estado: Object.fromEntries(Object.entries(ev.resumen.porEstado).map(([k, v]) => [ETIQUETA_ESTADO[k as keyof typeof ETIQUETA_ESTADO], v])),
      reutilizados: ev.resumen.reutilizados,
      escritos_en_este_tramite: ev.resumen.capturados,
    },
    requisitos: ev.requisitos.map((r) => ({
      id: r.requisito.id,
      titulo: r.requisito.titulo,
      tipo: r.requisito.tipo,
      concepto: r.requisito.tipo === "dato" ? r.requisito.concepto : undefined,
      concepto_etiqueta: r.requisito.tipo === "dato" ? etiquetaConcepto(r.requisito.concepto) : TIPOS_DOCUMENTO[r.requisito.documento],
      aplica: r.aplica,
      estado: r.aplica === false ? "No aplica" : ETIQUETA_ESTADO[r.estado],
      explicacion: r.explicacion,
      base: ETIQUETA_BASE[r.requisito.base],
      fuente: r.requisito.fuente_url,
      valor: r.elegida?.valor ?? null,
      reutilizado: r.reutilizado,
      opciones: r.opciones.map((o) => ({
        valor: o.valor,
        elegida: r.elegida?.clave === o.clave && r.estado === "confirmado_usuario",
        procedencia: o.procedencias.map((p) => ({
          fuente: p.fuente.nombre,
          tipo_fuente: ETIQUETA_FUENTE[p.fuente.tipo],
          campo_origen: p.campoOrigen,
          valor_original: p.valorOriginal,
          fecha_conocida_del_dato: p.fechaDato ?? "desconocida",
          importado_en: p.importadoEn,
        })),
      })),
      documento: r.documento
        ? { archivo: r.documento.nombreArchivo, sha256: r.documento.sha256, sintetico: true, fecha_emision: r.documento.fechaEmision ?? "desconocida", aportado_en: r.documento.aportadoEn, nota: r.documento.nota ?? null }
        : null,
      confirmacion: r.confirmacion ? { fecha: r.confirmacion.fecha, motivo: r.confirmacion.motivo, autor: r.confirmacion.autor, accion: r.confirmacion.accion } : null,
    })),
    historial_confirmaciones: args.confirmaciones.map((c) => ({ fecha: c.fecha, objetivo: c.objetivo, accion: c.accion, motivo: c.motivo, autor: c.autor, tramite: c.tramiteId })),
  };
}
