"use client";
import { useState } from "react";
import { Check, FileText, Lightbulb, Upload } from "lucide-react";
import type { EvaluacionRequisito } from "@/domain/motor";
import { CONCEPTOS, esConcepto, etiquetaConcepto, TIPOS_DOCUMENTO } from "@/domain/conceptos";
import { ETIQUETA_BASE } from "@/domain/catalogo";
import { useAccion } from "./accion";
import { ChipEstado, fechaCorta, MensajeError } from "./ui";

export interface Sugerencia { concepto: string; valor: string; origen: string }

export function FilaPendiente({ r, procesoId, sugerencias }: { r: EvaluacionRequisito; procesoId: string; sugerencias: Sugerencia[] }) {
  const { ejecutar, error, ocupado } = useAccion();
  const [valor, setValor] = useState("");
  const [fecha, setFecha] = useState("");
  const [sintetico, setSintetico] = useState(true);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [declara, setDeclara] = useState(false);
  const req = r.requisito;
  const estado = r.aplica === false ? "no_aplica" : r.estado;

  return (
    <li className="tarjeta p-4 sm:p-5" id={`req-${req.id}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold">{req.titulo}</h3>
          <p className="text-xs text-tinta-suave">{ETIQUETA_BASE[req.base]} · <a className="underline" href={req.fuente_url} target="_blank" rel="noreferrer">{req.fuente_titulo}</a></p>
        </div>
        <ChipEstado estado={estado} />
      </div>
      <blockquote className="mt-3 border-l-2 border-linea pl-3 text-sm italic text-tinta-suave">«{req.descripcion_original}»</blockquote>
      <dl className="mt-3 grid gap-1 text-sm sm:grid-cols-[9rem_1fr]">
        <dt className="font-medium">Por qué se pide</dt><dd>{req.porque}</dd>
        <dt className="font-medium">Dónde se obtiene</dt><dd>{req.donde_obtener}</dd>
        {req.condicion && (<><dt className="font-medium">Condición</dt><dd>Aplica {req.condicion.texto}.</dd></>)}
      </dl>
      {r.aplica !== false && <p className="mt-2 text-sm">{r.explicacion}</p>}
      {req.tipo === "dato" && r.elegida && (
        <p className="mt-2 rounded-lg bg-papel px-3 py-2"><span className="text-xs text-tinta-suave">Escribiste: </span><strong>{r.elegida.valor}</strong>{r.confirmacion && <span className="block text-xs text-ok">Guardado el {fechaCorta(r.confirmacion.fecha)} · «{r.confirmacion.motivo}»</span>}</p>
      )}

      {r.aplica !== false && req.tipo === "dato" && r.estado === "faltante" && (
        <form className="mt-3 grid gap-2" onSubmit={async (e) => { e.preventDefault(); if (await ejecutar("/api/capturar", { procesoId, concepto: req.concepto, valor, motivo: "" })) setValor(""); }}>
          <label className="text-sm font-medium" htmlFor={`v-${req.id}`}>{etiquetaConcepto(req.concepto)}</label>
          {esConcepto(req.concepto) && "opciones" in CONCEPTOS[req.concepto] ? (
            <select id={`v-${req.id}`} className="campo sm:max-w-xs" value={valor} onChange={(e) => setValor(e.target.value)}>
              <option value="">Elige…</option>
              {(CONCEPTOS[req.concepto] as { opciones: readonly string[] }).opciones.map((o) => <option key={o} value={o}>{o === "si" ? "Sí" : o === "no" ? "No" : o}</option>)}
            </select>
          ) : (
            <input id={`v-${req.id}`} className="campo sm:max-w-md" value={valor} onChange={(e) => setValor(e.target.value)}
              inputMode={/empleados|trabajadores/.test(req.concepto) ? "numeric" : undefined}
              placeholder={req.concepto === "empresa.fecha_inicio" ? "aaaa-mm-dd o «Al inscribirse»" : undefined} />
          )}
          {sugerencias.map((s) => (
            <p key={s.concepto} className="flex flex-wrap items-center gap-2 rounded-lg bg-info-fondo px-3 py-2 text-sm text-info">
              <Lightbulb aria-hidden className="size-4" />
              Dato relacionado, no equivalente: {etiquetaConcepto(s.concepto)} = <strong>{s.valor}</strong> ({s.origen}).
              <button type="button" className="underline" onClick={() => setValor(s.valor)}>Usar como punto de partida</button>
            </p>
          ))}
          <button className="boton boton-primario boton-chico justify-self-start" disabled={ocupado || !valor.trim()}>Guardar dato</button>
        </form>
      )}

      {r.aplica !== false && req.tipo === "documento" && (
        <div className="mt-3">
          {r.documento ? (
            <div className="flex flex-wrap items-center gap-3 rounded-lg bg-papel px-3 py-2 text-sm">
              <FileText aria-hidden className="size-4" />
              <a className="font-medium underline" href={`/api/documentos/${r.documento.id}`} target="_blank" rel="noreferrer">{r.documento.nombreArchivo}</a>
              <span className="text-tinta-suave">Sintético · aportado {fechaCorta(r.documento.aportadoEn)} · emisión {fechaCorta(r.documento.fechaEmision)}</span>
            </div>
          ) : (
            <form className="grid gap-2 rounded-lg bg-papel p-3" onSubmit={async (e) => {
              e.preventDefault();
              if (!archivo) return;
              const f = new FormData();
              f.set("archivo", archivo); f.set("tipo", req.documento); f.set("procesoId", procesoId); f.set("fechaEmision", fecha); f.set("sintetico", sintetico ? "si" : "no");
              await ejecutar("/api/documentos", f);
            }}>
              <label className="text-sm font-medium" htmlFor={`f-${req.id}`}>Archivo: {TIPOS_DOCUMENTO[req.documento]}</label>
              <input id={`f-${req.id}`} type="file" accept=".pdf,.png,.jpg,.jpeg" className="text-sm" onChange={(e) => setArchivo(e.target.files?.[0] ?? null)} />
              <label className="text-sm font-medium" htmlFor={`fe-${req.id}`}>Fecha de emisión (opcional; si no la sabes, déjala vacía)</label>
              <input id={`fe-${req.id}`} type="date" className="campo sm:max-w-xs" value={fecha} onChange={(e) => setFecha(e.target.value)} />
              <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1 accent-marca" checked={sintetico} onChange={(e) => setSintetico(e.target.checked)} /> Declaro que es un documento sintético de demostración.</label>
              <button className="boton boton-primario boton-chico justify-self-start" disabled={ocupado || !archivo}><Upload aria-hidden className="size-4" /> Aportar documento</button>
            </form>
          )}
          {r.documento && r.estado !== "confirmado_usuario" && r.estado !== "vencido" && (
            <div className="mt-3 grid gap-2">
              {req.vigencia.tipo === "condicion_sin_plazo" && (
                <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1 accent-marca" checked={declara} onChange={(e) => setDeclara(e.target.checked)} />
                  Declaro que cumple la condición «{req.vigencia.texto}». Entiendo que Lazô no lo verifica.</label>
              )}
              <button className="boton boton-primario boton-chico justify-self-start" disabled={ocupado || (req.vigencia.tipo === "condicion_sin_plazo" && !declara)}
                onClick={() => ejecutar("/api/documentos/confirmar", { procesoId, documentoId: r.documento!.id, motivo: req.vigencia.tipo === "condicion_sin_plazo" ? `La persona declara: ${req.vigencia.texto}` : "" })}>
                <Check aria-hidden className="size-4" /> Confirmar documento
              </button>
            </div>
          )}
          {r.confirmacion && <p className="mt-2 text-xs text-ok">Confirmado el {fechaCorta(r.confirmacion.fecha)} · «{r.confirmacion.motivo}»</p>}
        </div>
      )}
      <MensajeError error={error} />
    </li>
  );
}
