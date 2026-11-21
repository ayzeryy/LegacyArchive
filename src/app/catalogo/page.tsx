import { BotonCroma } from "@/components/BotonCroma";
import { ChipEstado, fechaHora } from "@/components/ui";
import { ETIQUETA_BASE } from "@/domain/catalogo";
import { cromaConfigurado, extracciones } from "@/server/croma";
import { catalogo } from "@/server/repo";

export const dynamic = "force-dynamic";

export default async function PaginaCatalogo() {
  const conCroma = cromaConfigurado();
  const ext = (await extracciones());
  return (
    <div className="space-y-8">
      <header className="max-w-3xl">
        <h1 className="text-3xl font-bold">Catálogo público de requisitos</h1>
        <p className="mt-2 text-tinta-suave">Versión <strong>{catalogo.version}</strong>, revisada el {catalogo.revisado_en}. {catalogo.metodo}</p>
        <p className="mt-2 text-sm"><strong>Alcance:</strong> {catalogo.alcance}</p>
      </header>

      <section className="tarjeta p-5" aria-labelledby="t-croma">
        <h2 id="t-croma" className="text-lg font-bold">Croma: extracción candidata desde páginas oficiales</h2>
        <p className="mt-1 text-sm">Flujo: página oficial → extracción candidata con Croma → <strong>revisión humana</strong> → nueva versión del catálogo → comparación determinista con el expediente. Croma no decide faltantes ni autentica documentos.</p>
        <p className={`mt-2 rounded-lg px-3 py-2 text-sm ${conCroma ? "bg-ok-fondo text-ok" : "bg-aviso-fondo text-aviso"}`}>
          {conCroma ? "CROMA_API_KEY configurada en el servidor. Cada extracción se guarda con su fecha y el identificador de la solicitud." : "Croma no está configurado: falta CROMA_API_KEY en .env.local. La demo usa el catálogo curado manualmente."}
        </p>
        {ext.length > 0 && (
          <ul className="mt-4 space-y-3">
            {ext.map((e) => (
              <li key={e.id} className="rounded-lg border border-linea p-3 text-sm">
                <p className="font-medium">{e.ok ? "Extracción candidata (requiere revisión humana)" : "Extracción fallida"} · {fechaHora(e.solicitadoEn)}{e.requestId ? ` · solicitud ${e.requestId}` : ""}</p>
                <p className="break-all text-xs text-tinta-suave">{e.url}</p>
                {e.error && <p className="mt-1 text-alerta">{e.error}</p>}
                {e.resultado && (
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {e.resultado.requisitos.map((r, i) => <li key={i}><span className="rounded bg-papel px-1 text-xs">{r.tipo}</span> «{r.texto_original}»{r.condicion ? ` · condición: ${r.condicion}` : ""}{r.vigencia ? ` · vigencia: ${r.vigencia}` : ""}</li>)}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {catalogo.tramites.map((t) => (
        <section key={t.id} className="space-y-3" aria-labelledby={`t-${t.id}`}>
          <h2 id={`t-${t.id}`} className="text-xl font-bold">{t.nombre} <span className="text-base font-normal text-tinta-suave">· {t.institucion}</span></h2>
          <div className="tarjeta p-4">
            <h3 className="font-semibold">Fuentes oficiales revisadas</h3>
            <ul className="mt-2 space-y-3">
              {t.fuentes.map((f) => (
                <li key={f.url} className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <span><a className="underline" href={f.url} target="_blank" rel="noreferrer">{f.titulo}</a> · revisado {f.revisado_en}{f.nota ? ` · ${f.nota}` : ""}</span>
                  <BotonCroma tramiteId={t.id} url={f.url} habilitado={conCroma} />
                </li>
              ))}
            </ul>
          </div>
          <ul className="divide-y divide-linea rounded-xl border border-linea bg-superficie">
            {t.requisitos.map((r) => (
              <li key={r.id} className="flex flex-wrap items-start justify-between gap-2 p-3 text-sm">
                <div className="min-w-0">
                  <p className="font-medium">{r.titulo}</p>
                  <p className="text-tinta-suave">«{r.descripcion_original}»{r.condicion ? ` · Aplica ${r.condicion.texto}.` : ""}</p>
                </div>
                <span className="rounded-full bg-papel px-2 py-1 text-xs">{ETIQUETA_BASE[r.base]}</span>
              </li>
            ))}
          </ul>
          <p className="text-sm text-tinta-suave"><strong>No modelado:</strong> {t.no_modelado.join("; ")}.</p>
        </section>
      ))}
      <p className="text-xs text-tinta-suave">El estado <ChipEstado estado="verificado_fuente_oficial" /> está reservado para verificaciones reales con evidencia; esta demo no lo asigna.</p>
    </div>
  );
}
