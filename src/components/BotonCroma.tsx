"use client";
import { Wand2 } from "lucide-react";
import { useAccion } from "./accion";
import { MensajeError } from "./ui";

export function BotonCroma({ tramiteId, url, habilitado }: { tramiteId: string; url: string; habilitado: boolean }) {
  const { ejecutar, error, ocupado } = useAccion();
  return (
    <div>
      <button className="boton boton-secundario boton-chico" disabled={!habilitado || ocupado} onClick={() => ejecutar("/api/croma", { tramiteId, url })}>
        <Wand2 aria-hidden className="size-4" /> {ocupado ? "Consultando Croma… (puede tardar)" : "Extraer candidatos con Croma"}
      </button>
      <MensajeError error={error} />
    </div>
  );
}
