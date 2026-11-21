"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useAccion } from "./accion";
import { MensajeError } from "./ui";

export function IniciarTramite({ tramiteId, preguntaInscrita, abierto }: { tramiteId: string; preguntaInscrita: boolean; abierto: boolean }) {
  const router = useRouter();
  const { ejecutar, error, ocupado } = useAccion();
  const [inscrita, setInscrita] = useState<"si" | "no">("no");
  const [copropiedad, setCopropiedad] = useState<"si" | "no">("no");

  if (abierto) {
    return (
      <a href={`/tramite/${tramiteId}`} className="boton boton-primario w-full sm:w-auto">
        Continuar expediente <ArrowRight aria-hidden className="size-4" />
      </a>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const r = await ejecutar("/api/procesos", { tramiteId, tipoSolicitante: "persona_individual", copropiedad, ...(preguntaInscrita ? { inscrita_comerciante: inscrita } : {}) });
        if (r) router.push(`/tramite/${tramiteId}`);
      }}
    >
      <fieldset>
        <legend className="text-sm font-semibold">Tipo de solicitante</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <label className="flex items-start gap-2 rounded-lg border border-marca bg-marca-clara p-3 text-sm">
            <input type="radio" name={`tipo-${tramiteId}`} defaultChecked className="mt-1 accent-marca" />
            <span><strong>Persona individual</strong><br />Comerciante, propietaria única</span>
          </label>
          <label className="flex items-start gap-2 rounded-lg border border-linea p-3 text-sm text-tinta-suave">
            <input type="radio" name={`tipo-${tramiteId}`} disabled className="mt-1" />
            <span><strong>Sociedad</strong><br />Fuera del alcance de la demo</span>
          </label>
        </div>
      </fieldset>
      {preguntaInscrita && (
        <Pregunta nombre={`inscrita-${tramiteId}`} texto="¿Ya estás inscrita como comerciante individual?" valor={inscrita} onChange={setInscrita} ayuda="Define si aplica el pago de comerciante (código 13)." />
      )}
      <Pregunta nombre={`copro-${tramiteId}`} texto="¿La empresa tiene copropietarios?" valor={copropiedad} onChange={setCopropiedad} ayuda={copropiedad === "si" ? "La demo no modela copropiedad completa; se pedirán documentos adicionales." : "Responde con lo que sabes hoy; puedes corregirlo después."} />
      <button className="boton boton-primario w-full sm:w-auto" disabled={ocupado}>
        {ocupado ? "Abriendo…" : "Empezar este trámite"} <ArrowRight aria-hidden className="size-4" />
      </button>
      <MensajeError error={error} />
    </form>
  );
}

function Pregunta({ nombre, texto, valor, onChange, ayuda }: { nombre: string; texto: string; valor: "si" | "no"; onChange: (v: "si" | "no") => void; ayuda: string }) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold">{texto}</legend>
      <div className="mt-2 flex gap-2">
        {(["no", "si"] as const).map((v) => (
          <label key={v} className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-4 text-sm ${valor === v ? "border-marca bg-marca-clara font-semibold" : "border-linea bg-white"}`}>
            <input type="radio" name={nombre} checked={valor === v} onChange={() => onChange(v)} className="accent-marca" />
            {v === "si" ? "Sí" : "No"}
          </label>
        ))}
      </div>
      <p className="mt-1 text-xs text-tinta-suave">{ayuda}</p>
    </fieldset>
  );
}
