"use client";
import { useState } from "react";
import { Check, PencilLine } from "lucide-react";
import type { EvaluacionRequisito } from "@/domain/motor";
import { CONCEPTOS, esConcepto } from "@/domain/conceptos";
import { ETIQUETA_BASE } from "@/domain/catalogo";
import { useAccion } from "./accion";
import { ChipEstado, fechaCorta, MensajeError } from "./ui";
import { Procedencia } from "./Procedencia";

export function FilaDato({ r, procesoId }: { r: EvaluacionRequisito; procesoId: string }) {
  const { ejecutar, error, ocupado } = useAccion();
  const [elegida, setElegida] = useState<string | null>(null);
  const [motivo, setMotivo] = useState("");
  const [corrigiendo, setCorrigiendo] = useState(false);
  const [nuevo, setNuevo] = useState("");
  if (r.requisito.tipo !== "dato") return null;
  const concepto = r.requisito.concepto;
  const def = esConcepto(concepto) ? CONCEPTOS[concepto] : null;
  const conflicto = r.estado === "en_conflicto";

  return (
    <li className={`tarjeta p-4 sm:p-5 ${conflicto ? "border-alerta/40 ring-1 ring-alerta/20" : ""}`} id={`req-${r.requisito.id}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold">{r.requisito.titulo}</h3>
          <p className="text-xs text-tinta-suave">{ETIQUETA_BASE[r.requisito.base]} · <a className="underline" href={r.requisito.fuente_url} target="_blank" rel="noreferrer">{r.requisito.fuente_titulo}</a></p>
        </div>
        <ChipEstado estado={r.estado} />
      </div>

      {conflicto ? (
        <fieldset className="mt-3">
          <legend className="text-sm">{r.explicacion}</legend>
          <div className="mt-3 space-y-2">
            {r.opciones.map((o) => (
              <label key={o.clave} className={`block cursor-pointer rounded-lg border p-3 ${elegida === o.clave ? "border-marca bg-marca-clara" : "border-linea"}`}>
                <span className="flex items-start gap-2">
                  <input type="radio" name={`op-${r.requisito.id}`} className="mt-1 accent-marca" checked={elegida === o.clave} onChange={() => setElegida(o.clave)} />
                  <span>
                    <span className="font-medium">{o.valor}</span>
                    <span className="block text-xs text-tinta-suave">Fecha del dato: {fechaCorta(o.procedencias[0].fechaDato)}</span>
                  </span>
                </span>
                <Procedencia opcion={o} />
              </label>
            ))}
          </div>
          <label className="mt-3 block text-sm font-medium" htmlFor={`mot-${r.requisito.id}`}>Motivo de tu elección (obligatorio)</label>
          <input id={`mot-${r.requisito.id}`} className="campo mt-1" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ej.: el negocio se trasladó en 2024" />
          <p className="mt-1 text-xs text-tinta-suave">El otro valor no se borra: queda en el expediente con su origen.</p>
          <button className="boton boton-primario mt-3" disabled={!elegida || motivo.trim().length < 3 || ocupado}
            onClick={() => ejecutar("/api/confirmar", { procesoId, concepto, valorClave: elegida, motivo })}>
            Resolver diferencia
          </button>
        </fieldset>
      ) : (
        <div className="mt-2">
          <p className="break-words text-lg">{r.elegida?.valor}</p>
          {r.elegida && <Procedencia opcion={r.elegida} />}
          {r.opciones.length > 1 && r.estado === "confirmado_usuario" && (
            <p className="mt-1 text-xs text-tinta-suave">Elegiste este valor entre {r.opciones.length}. Los demás se conservan.</p>
          )}
          {r.confirmacion && (
            <p className="mt-2 text-xs text-ok">
              {r.confirmacion.accion === "resolver_conflicto" ? "Diferencia resuelta" : "Confirmado"} el {fechaCorta(r.confirmacion.fecha)}
              {r.reutilizado && r.confirmacion.procesoId !== procesoId ? " en otro trámite" : ""} · «{r.confirmacion.motivo}»
            </p>
          )}
          {r.estado === "por_confirmar" && <p className="mt-2 text-sm text-aviso">{r.explicacion}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            {r.estado === "disponible" && r.elegida && (
              <button className="boton boton-primario boton-chico" disabled={ocupado} onClick={() => ejecutar("/api/confirmar", { procesoId, concepto, valorClave: r.elegida!.clave, motivo: "" })}>
                <Check aria-hidden className="size-4" /> Confirmar
              </button>
            )}
            <button className="boton boton-secundario boton-chico" onClick={() => { setCorrigiendo((v) => !v); setNuevo(r.elegida?.valor ?? ""); }} aria-expanded={corrigiendo}>
              <PencilLine aria-hidden className="size-4" /> Corregir
            </button>
          </div>
          {corrigiendo && (
            <form className="aparecer mt-3 grid gap-2 rounded-lg bg-papel p-3" onSubmit={async (e) => { e.preventDefault(); if (await ejecutar("/api/capturar", { procesoId, concepto, valor: nuevo, motivo })) setCorrigiendo(false); }}>
              <label className="text-sm font-medium" htmlFor={`nv-${r.requisito.id}`}>Valor correcto</label>
              {def && "opciones" in def ? (
                <select id={`nv-${r.requisito.id}`} className="campo" value={nuevo} onChange={(e) => setNuevo(e.target.value)}>
                  {def.opciones.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input id={`nv-${r.requisito.id}`} className="campo" value={nuevo} onChange={(e) => setNuevo(e.target.value)} />
              )}
              <label className="text-sm font-medium" htmlFor={`cm-${r.requisito.id}`}>Motivo de la corrección</label>
              <input id={`cm-${r.requisito.id}`} className="campo" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ej.: el número cambió" />
              <button className="boton boton-primario boton-chico justify-self-start" disabled={ocupado || !nuevo.trim() || motivo.trim().length < 3}>Guardar corrección</button>
            </form>
          )}
        </div>
      )}
      <MensajeError error={error} />
    </li>
  );
}
