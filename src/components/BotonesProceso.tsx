"use client";
import { CheckCheck, KeyRound } from "lucide-react";
import { useAccion } from "./accion";
import { MensajeError } from "./ui";

export function ConfirmarTodos({ procesoId, cuantos }: { procesoId: string; cuantos: number }) {
  const { ejecutar, error, ocupado } = useAccion();
  if (!cuantos) return null;
  return (
    <div>
      <button className="boton boton-secundario" disabled={ocupado} onClick={() => ejecutar("/api/confirmar-todos", { procesoId })}>
        <CheckCheck aria-hidden className="size-4" /> Confirmar los {cuantos} datos sin conflicto
      </button>
      <MensajeError error={error} />
    </div>
  );
}

export function Autorizar({ procesoId, requisitos, tramite }: { procesoId: string; requisitos: number; tramite: string }) {
  const { ejecutar, error, ocupado } = useAccion();
  return (
    <section className="aparecer rounded-2xl border-2 border-marca bg-marca-clara p-5 sm:p-6" aria-labelledby="titulo-reutilizar">
      <div className="flex items-start gap-3">
        <KeyRound aria-hidden className="mt-1 size-6 shrink-0 text-marca" />
        <div>
          <h2 id="titulo-reutilizar" className="text-xl font-bold">Tu expediente ya tiene información compatible</h2>
          <p className="mt-1">
            Encontramos información para <strong>{requisitos} requisito{requisitos === 1 ? "" : "s"}</strong> de {tramite}, entre datos y documentos que corresponden exactamente a lo que se pide. No tendrás que escribirlos otra vez.
          </p>
          <p className="mt-1 text-sm text-tinta-suave">Solo se usan si lo autorizas para este trámite. Las direcciones, el CUI y el NIT se proponen únicamente para el concepto que les corresponde.</p>
          <button className="boton boton-primario mt-4" disabled={ocupado} onClick={() => ejecutar("/api/autorizar", { procesoId })}>
            Usar mi información en este trámite
          </button>
          <MensajeError error={error} />
        </div>
      </div>
    </section>
  );
}
