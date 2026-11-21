"use client";
import { Printer } from "lucide-react";
export function BotonImprimir() {
  return <button className="boton boton-primario" onClick={() => window.print()}><Printer aria-hidden className="size-4" /> Imprimir o guardar como PDF</button>;
}
