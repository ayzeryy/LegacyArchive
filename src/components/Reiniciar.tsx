"use client";
import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { useAccion } from "./accion";
import { MensajeError } from "./ui";

export function Reiniciar() {
  const { ejecutar, error, ocupado } = useAccion();
  const [seguro, setSeguro] = useState(false);
  return (
    <div>
      {seguro ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm">¿Borrar todo el expediente sintético y empezar de nuevo?</span>
          <button className="boton boton-primario boton-chico bg-alerta" disabled={ocupado} onClick={async () => { await ejecutar("/api/reiniciar"); setSeguro(false); }}>Sí, reiniciar</button>
          <button className="boton boton-secundario boton-chico" onClick={() => setSeguro(false)}>Cancelar</button>
        </div>
      ) : (
        <button className="boton boton-secundario boton-chico" onClick={() => setSeguro(true)}><RotateCcw aria-hidden className="size-4" /> Reiniciar la demo</button>
      )}
      <MensajeError error={error} />
    </div>
  );
}
