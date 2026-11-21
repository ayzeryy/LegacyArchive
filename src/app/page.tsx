import Link from "next/link";
import { Building2, ShieldPlus, ArrowRightLeft } from "lucide-react";
import { IniciarTramite } from "@/components/IniciarTramite";
import { BarraAvance } from "@/components/ui";
import { ESTADO_SALIDA } from "@/domain/exportar";
import { catalogo, evaluar, fuentesImportadas, procesoPorTramite } from "@/server/repo";

export const dynamic = "force-dynamic";

const ICONOS: Record<string, typeof Building2> = { "rm-comerciante-empresa": Building2, "igss-inscripcion-patronal": ShieldPlus };

export default function Inicio() {
  const fuentes = fuentesImportadas();
  return (
    <div className="space-y-10">
      <section className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-marca">Expediente de María López · comerciante ficticia</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Prepara tus trámites sin volver a escribir lo que ya existe</h1>
        <p className="mt-3 text-lg text-tinta-suave">
          LegacyArchive lee tus datos de sistemas incompatibles, conserva de dónde salió cada valor y te pide solo lo que falta o lo que hay que confirmar.
          El resultado es un expediente descargable para continuar por el canal oficial.
        </p>
      </section>

      <section aria-labelledby="titulo-tramites">
        <h2 id="titulo-tramites" className="text-xl font-bold">1. Elige el trámite</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {catalogo.tramites.map((t, i) => {
            const p = procesoPorTramite(t.id);
            const ev = p ? evaluar(t.id) : null;
            const Icono = ICONOS[t.id] ?? Building2;
            return (
              <article key={t.id} className="tarjeta flex flex-col gap-5 p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-marca-clara text-marca"><Icono aria-hidden className="size-6" /></span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-tinta-suave">Paso {i + 1} · {t.institucion}</p>
                    <h3 className="text-lg font-bold leading-snug">{t.nombre}</h3>
                  </div>
                </div>
                {ev ? (
                  <div className="space-y-2">
                    <BarraAvance preparados={ev.evaluacion.resumen.preparados} aplicables={ev.evaluacion.resumen.aplicables} />
                    <p className="text-sm"><span className="font-semibold">Estado:</span> {ESTADO_SALIDA[ev.evaluacion.resumen.estadoExpediente]}</p>
                  </div>
                ) : (
                  <p className="text-sm text-tinta-suave">
                    {t.id === "igss-inscripcion-patronal"
                      ? "Aplica a patronos que ocupen uno o más trabajadores. Reutiliza lo que ya preparaste para el Registro Mercantil."
                      : "Primer expediente: importa tus fuentes, resuelve diferencias y descubre qué falta."}
                  </p>
                )}
                <div className="mt-auto">
                  <IniciarTramite tramiteId={t.id} preguntaInscrita={t.id === "rm-comerciante-empresa"} abierto={!!p} />
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="tarjeta flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <ArrowRightLeft aria-hidden className="mt-0.5 size-5 text-marca" />
          <p className="text-sm">
            <strong>{fuentes.length} fuentes importadas</strong> en tu expediente. Los archivos originales no se modifican; cada corrección queda registrada aquí con fecha y motivo.
          </p>
        </div>
        <Link href="/expediente" className="boton boton-secundario boton-chico">Ver mi expediente</Link>
      </section>
    </div>
  );
}
