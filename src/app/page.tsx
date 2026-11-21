import Link from "next/link";
import { Buscador, type OpcionTramite } from "@/components/Buscador";
import { ESTADO_SALIDA } from "@/domain/exportar";
import { catalogo, evaluar, procesoPorTramite } from "@/server/repo";

export const dynamic = "force-dynamic";

const PALABRAS: Record<string, { resumen: string; palabras: string[] }> = {
  "rm-comerciante-empresa": {
    resumen: "Inscribe tu negocio y obtén la patente de comercio.",
    palabras: ["registro mercantil", "empresa", "negocio", "comercio", "comerciante", "patente", "abrir", "inscribir", "tienda"],
  },
  "igss-inscripcion-patronal": {
    resumen: "Inscríbete como patrono cuando tienes trabajadores.",
    palabras: ["igss", "seguro social", "patrono", "patronal", "trabajadores", "empleados", "afiliación"],
  },
};

export default async function Inicio() {
  const tramites: OpcionTramite[] = (await Promise.all(catalogo.tramites.map(async (t) => {
    const ev = (await procesoPorTramite(t.id)) ? (await evaluar(t.id)) : null;
    return {
      id: t.id,
      nombre: t.nombre,
      institucion: t.institucion,
      resumen: PALABRAS[t.id]?.resumen ?? "",
      palabras: PALABRAS[t.id]?.palabras ?? [],
      estado: ev ? `En curso · ${ev.evaluacion.resumen.preparados} de ${ev.evaluacion.resumen.aplicables} listos · ${ESTADO_SALIDA[ev.evaluacion.resumen.estadoExpediente]}` : null,
    };
  })));
  return (
    <div className="resplandor flex min-h-[60dvh] flex-col items-center pt-4 sm:pt-12">
      <h1 className="entrada texto-degradado text-center text-[34px] font-bold leading-tight tracking-tight sm:text-5xl">¿Qué trámite deseas hacer hoy?</h1>
      <p style={{ ["--retraso" as string]: "80ms" }} className="entrada mt-3 max-w-xl text-center text-lg text-tinta-suave">Escribe lo que necesitas. Te pedimos solo lo que falta.</p>
      <div style={{ ["--retraso" as string]: "160ms" }} className="entrada mt-8 w-full">
        <Buscador tramites={tramites} />
      </div>
      <p className="mt-10 text-center text-sm text-tinta-suave">
        Persona de la demo: María López (ficticia). <Link href="/expediente" className="text-marca">Ver mi expediente</Link>
      </p>
    </div>
  );
}
