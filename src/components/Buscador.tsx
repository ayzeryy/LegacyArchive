"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Search, X } from "lucide-react";
import { quitarAcentos } from "@/domain/normalizar";

export interface OpcionTramite {
  id: string;
  nombre: string;
  institucion: string;
  resumen: string;
  palabras: string[];
  estado: string | null;
}

const normal = (s: string) => quitarAcentos(s).toLowerCase();

export function Buscador({ tramites }: { tramites: OpcionTramite[] }) {
  const [q, setQ] = useState("");
  const resultados = useMemo(() => {
    const t = normal(q.trim());
    if (!t) return tramites;
    return tramites.filter((x) => normal([x.nombre, x.institucion, x.resumen, ...x.palabras].join(" ")).includes(t) || t.split(" ").every((w) => normal([x.nombre, x.institucion, ...x.palabras].join(" ")).includes(w)));
  }, [q, tramites]);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <label htmlFor="buscar-tramite" className="sr-only">Busca tu trámite</label>
      <div className="flex items-center gap-3 rounded-2xl bg-white px-4 shadow-[0_1px_3px_rgba(0,0,0,.08)] ring-1 ring-black/5 transition-shadow duration-200 focus-within:ring-2 focus-within:ring-marca focus-within:shadow-[0_4px_20px_rgba(0,122,255,.15)]">
        <Search aria-hidden className="size-5 shrink-0 text-tinta-suave" />
        <input
          id="buscar-tramite"
          type="search"
          autoComplete="off"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ej.: abrir mi negocio, patente, IGSS…"
          className="h-14 w-full bg-transparent text-lg outline-none placeholder:text-tinta-suave/70 [&::-webkit-search-cancel-button]:hidden"
        />
        {q && (
          <button type="button" onClick={() => setQ("")} className="grid size-8 place-items-center rounded-full bg-linea text-tinta-suave" aria-label="Borrar búsqueda">
            <X aria-hidden className="size-4" />
          </button>
        )}
      </div>

      <p className="mt-6 mb-2 px-4 text-sm font-medium uppercase tracking-wide text-tinta-suave" aria-live="polite">
        {q.trim() ? `${resultados.length} resultado${resultados.length === 1 ? "" : "s"}` : "Trámites disponibles"}
      </p>
      {resultados.length > 0 ? (
        <ul className="overflow-hidden rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,.06)]">
          {resultados.map((t, i) => (
            <li key={t.id} className={i > 0 ? "border-t border-linea ml-4" : ""}>
              <Link href={`/tramite/${t.id}/inicio`} className={`fila-tramite flex min-h-16 items-center gap-3 py-3 pr-4 ${i > 0 ? "" : "pl-4"} transition-colors duration-150 active:bg-papel`}>
                <span className="min-w-0 flex-1">
                  <span className="block text-[17px] font-semibold leading-snug">{t.nombre}</span>
                  <span className="block text-[15px] text-tinta-suave">{t.institucion}</span>
                  {t.estado && <span className="mt-1 inline-block rounded-full bg-marca-clara px-2 py-0.5 text-xs font-semibold text-marca">{t.estado}</span>}
                </span>
                <ChevronRight aria-hidden className="chevron size-5 shrink-0 text-tinta-suave/60" />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-2xl bg-white p-5 text-center">
          <p className="font-semibold">No encontramos ese trámite</p>
          <p className="mt-1 text-[15px] text-tinta-suave">Esta demo incluye la inscripción en el Registro Mercantil y la inscripción patronal del IGSS. Prueba con «negocio» o «IGSS».</p>
        </div>
      )}
    </div>
  );
}
