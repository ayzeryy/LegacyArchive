import { DocumentosPosteriores } from "@/components/DocumentosPosteriores";
import { Reiniciar } from "@/components/Reiniciar";
import { Procedencia } from "@/components/Procedencia";
import { fechaCorta, fechaHora } from "@/components/ui";
import { CONCEPTOS, etiquetaConcepto, TIPOS_DOCUMENTO, esTipoDocumento, type Concepto } from "@/domain/conceptos";
import { agruparOpciones } from "@/domain/motor";
import { catalogo, confirmaciones, documentos, valores } from "@/server/repo";

export const dynamic = "force-dynamic";

const ACCION: Record<string, string> = { confirmar: "Confirmó", resolver_conflicto: "Resolvió una diferencia", corregir: "Corrigió", capturar: "Escribió", confirmar_documento: "Confirmó un documento", autorizar_reutilizacion: "Autorizó reutilizar el expediente" };

export default async function Expediente() {
  const [vals, docs, confs] = await Promise.all([valores(), documentos(), confirmaciones()]);
  const conceptos = (Object.keys(CONCEPTOS) as Concepto[]).filter((c) => vals.some((v) => v.concepto === c));
  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Mi expediente</h1>
          <p className="text-tinta-suave">Datos privados de María (sintéticos), separados del catálogo público. Guardados para reutilizarlos en tus trámites.</p>
        </div>
        <Reiniciar />
      </header>

      <section aria-labelledby="t-datos">
        <h2 id="t-datos" className="text-xl font-bold">Datos en el modelo común ({vals.length} valores)</h2>
        {conceptos.length === 0 ? <p className="mt-2 text-sm text-tinta-suave">Aún no hay datos. Empieza un trámite e importa tus fuentes.</p> : (
          <ul className="mt-3 grid gap-3 md:grid-cols-2">
            {conceptos.map((c) => {
              const ops = agruparOpciones(c, vals);
              return (
                <li key={c} className="tarjeta p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-tinta-suave">{CONCEPTOS[c].grupo} · <span className="font-mono normal-case">{c}</span></p>
                  <h3 className="font-semibold">{etiquetaConcepto(c)}</h3>
                  {ops.map((o) => <div key={o.clave} className="mt-2"><p className="break-words">{o.valor}</p><Procedencia opcion={o} /></div>)}
                  {ops.length > 1 && <p className="mt-2 text-xs text-alerta">{ops.length} valores distintos conservados.</p>}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section id="documentos" aria-labelledby="t-docs" className="scroll-mt-6">
        <h2 id="t-docs" className="text-xl font-bold">Documentos ({docs.length})</h2>
        {docs.length > 0 && (
          <ul className="mt-3 space-y-2">
            {docs.map((d) => (
              <li key={d.id} className="tarjeta flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
                <span><strong>{esTipoDocumento(d.tipo) ? TIPOS_DOCUMENTO[d.tipo] : d.tipo}</strong> · <a className="underline" href={`/api/documentos/${d.id}`} target="_blank" rel="noreferrer">{d.nombreArchivo}</a></span>
                <span className="text-tinta-suave">Sintético · aportado {fechaCorta(d.aportadoEn)} · emisión {fechaCorta(d.fechaEmision)}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4"><DocumentosPosteriores /></div>
      </section>

      <section aria-labelledby="t-hist">
        <h2 id="t-hist" className="text-xl font-bold">Historial de confirmaciones y correcciones</h2>
        {confs.length === 0 ? <p className="mt-2 text-sm text-tinta-suave">Sin registros todavía.</p> : (
          <ol className="mt-3 space-y-1 text-sm">
            {confs.map((c) => (
              <li key={c.id} className="flex flex-wrap gap-x-2 border-b border-linea/60 py-1.5">
                <span className="text-tinta-suave">{fechaHora(c.fecha)}</span>
                <span className="font-medium">{ACCION[c.accion] ?? c.accion}</span>
                <span>{c.objetivo.startsWith("documento:") ? TIPOS_DOCUMENTO[c.objetivo.slice(10) as keyof typeof TIPOS_DOCUMENTO] : c.objetivo === "autorizacion" ? "" : etiquetaConcepto(c.objetivo)}</span>
                <span className="text-tinta-suave">· {catalogo.tramites.find((t) => t.id === c.tramiteId)?.nombre_corto} · «{c.motivo}»</span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
