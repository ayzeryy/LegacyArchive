import { Database } from "lucide-react";
import type { Opcion } from "@/domain/motor";
import { ETIQUETA_FUENTE } from "@/domain/tipos";
import { fechaCorta } from "./ui";

export function Procedencia({ opcion }: { opcion: Opcion }) {
  return (
    <details className="group mt-1 text-sm">
      <summary className="inline-flex min-h-8 cursor-pointer list-none items-center gap-1.5 rounded text-tinta-suave hover:text-tinta">
        <Database aria-hidden className="size-3.5" />
        <span className="underline decoration-dotted underline-offset-2">
          {opcion.procedencias.length === 1 ? `De ${opcion.procedencias[0].fuente.nombre}` : `Coincide en ${opcion.procedencias.length} fuentes`}
        </span>
      </summary>
      <ul className="mt-2 space-y-2">
        {opcion.procedencias.map((p) => (
          <li key={p.id} className="rounded-lg bg-papel px-3 py-2">
            <p className="font-medium">{p.fuente.nombre} <span className="font-normal text-tinta-suave">· {ETIQUETA_FUENTE[p.fuente.tipo]}</span></p>
            <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs text-tinta-suave">
              <dt>Campo de origen</dt><dd className="font-mono text-tinta">{p.campoOrigen}</dd>
              <dt>Valor original</dt><dd className="break-words font-mono text-tinta">{p.valorOriginal}</dd>
              <dt>Fecha del dato</dt><dd>{fechaCorta(p.fechaDato)}</dd>
              <dt>Importado</dt><dd>{fechaCorta(p.importadoEn)}</dd>
            </dl>
          </li>
        ))}
      </ul>
    </details>
  );
}
