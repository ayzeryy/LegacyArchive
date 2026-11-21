"use client";
import { useState } from "react";
import { Upload } from "lucide-react";
import { TIPOS_DOCUMENTO } from "@/domain/conceptos";
import { useAccion } from "./accion";
import { MensajeError } from "./ui";

export function DocumentosPosteriores() {
  const { ejecutar, error, ocupado } = useAccion();
  const [tipo, setTipo] = useState("patente_empresa");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [fecha, setFecha] = useState("");
  const [previo, setPrevio] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  return (
    <form className="tarjeta grid gap-3 p-5" onSubmit={async (e) => {
      e.preventDefault();
      if (!archivo) return;
      const f = new FormData();
      f.set("archivo", archivo); f.set("tipo", tipo); f.set("fechaEmision", fecha); f.set("sintetico", "si");
      f.set("nota", "Representa un documento obtenido previamente por la persona. Lazô no lo emitió ni lo verificó.");
      if (await ejecutar("/api/documentos", f)) { setOk(`${TIPOS_DOCUMENTO[tipo as keyof typeof TIPOS_DOCUMENTO]} agregado al expediente.`); setArchivo(null); (e.target as HTMLFormElement).reset(); setPrevio(false); }
    }}>
      <p className="rounded-lg bg-aviso-fondo px-3 py-2 text-sm text-aviso">Estos archivos representan documentos que la persona <strong>obtuvo previamente</strong> por los canales oficiales. Lazô no los emitió y no verifica su autenticidad.</p>
      <label className="text-sm font-medium" htmlFor="tipo-doc">Tipo de documento</label>
      <select id="tipo-doc" className="campo sm:max-w-sm" value={tipo} onChange={(e) => setTipo(e.target.value)}>
        {(["patente_empresa", "constancia_rtu", "dpi"] as const).map((t) => <option key={t} value={t}>{TIPOS_DOCUMENTO[t]}</option>)}
      </select>
      <label className="text-sm font-medium" htmlFor="arch-doc">Archivo</label>
      <input id="arch-doc" type="file" accept=".pdf,.png,.jpg,.jpeg" className="text-sm" onChange={(e) => setArchivo(e.target.files?.[0] ?? null)} />
      <label className="text-sm font-medium" htmlFor="fecha-doc">Fecha de emisión (opcional)</label>
      <input id="fecha-doc" type="date" className="campo sm:max-w-xs" value={fecha} onChange={(e) => setFecha(e.target.value)} />
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1 accent-marca" checked={previo} onChange={(e) => setPrevio(e.target.checked)} /> Confirmo que es un documento sintético que representa uno obtenido previamente.</label>
      <button className="boton boton-primario justify-self-start" disabled={!archivo || !previo || ocupado}><Upload aria-hidden className="size-4" /> Agregar al expediente</button>
      <p className="text-xs text-tinta-suave">Muestras: <a className="underline" href="/api/muestras/patente_empresa_MUESTRA.pdf">patente</a> · <a className="underline" href="/api/muestras/constancia_rtu_MUESTRA.pdf">constancia RTU</a> · <a className="underline" href="/api/muestras/dpi_MUESTRA.pdf">DPI</a></p>
      <div aria-live="polite">{ok && <p className="text-sm text-ok">{ok}</p>}</div>
      <MensajeError error={error} />
    </form>
  );
}
