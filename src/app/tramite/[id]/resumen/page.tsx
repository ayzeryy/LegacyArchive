import { notFound } from "next/navigation";
import { BotonImprimir } from "@/components/BotonImprimir";
import { ESTADO_SALIDA } from "@/domain/exportar";
import { ETIQUETA_BASE } from "@/domain/catalogo";
import { ETIQUETA_ESTADO, ETIQUETA_FUENTE } from "@/domain/tipos";
import { catalogo, evaluar } from "@/server/repo";
import { fechaCorta } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function Resumen({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = evaluar(id);
  if (!d) notFound();
  const { tramite: t, evaluacion: ev } = d;
  return (
    <article className="mx-auto max-w-3xl space-y-6 bg-white p-6 sm:p-10 print:p-0">
      <div className="no-imprimir flex justify-end"><BotonImprimir /></div>
      <header className="border-b border-linea pb-4">
        <p className="text-xs font-bold uppercase tracking-widest text-alerta">Datos sintéticos · no es una inscripción presentada ni aprobada</p>
        <h1 className="mt-2 text-2xl font-bold">{t.nombre}</h1>
        <p className="text-sm text-tinta-suave">{t.institucion} · Expediente LA-DEMO-001 · Generado {fechaCorta(new Date().toISOString())}</p>
        <p className="mt-3 text-xl font-bold">{ESTADO_SALIDA[ev.resumen.estadoExpediente]}</p>
        <p className="text-sm">{ev.resumen.preparados} de {ev.resumen.aplicables} requisitos aplicables modelados confirmados por la persona · {ev.resumen.reutilizados} reutilizados · {ev.resumen.capturados} escritos en este trámite.</p>
        <p className="mt-1 text-xs text-tinta-suave">Verificación institucional: no realizada. Catálogo {catalogo.version} (revisado {catalogo.revisado_en}).</p>
      </header>
      <table className="w-full text-left text-sm">
        <thead><tr className="border-b border-linea"><th className="py-2 pr-3">Requisito</th><th className="py-2 pr-3">Valor o documento</th><th className="py-2 pr-3">Origen</th><th className="py-2">Estado</th></tr></thead>
        <tbody>
          {ev.requisitos.map((r) => (
            <tr key={r.requisito.id} className="border-b border-linea/60 align-top">
              <td className="py-2 pr-3"><span className="font-medium">{r.requisito.titulo}</span><br /><span className="text-xs text-tinta-suave">{ETIQUETA_BASE[r.requisito.base]}</span></td>
              <td className="py-2 pr-3 break-words">{r.elegida?.valor ?? r.documento?.nombreArchivo ?? "—"}</td>
              <td className="py-2 pr-3 text-xs">{r.elegida ? r.elegida.procedencias.map((p) => `${p.fuente.nombre} (${p.campoOrigen}, dato: ${fechaCorta(p.fechaDato)})`).join("; ") : r.documento ? "Documento sintético aportado por la persona" : ""}
                {r.opciones.length > 1 && <span className="block text-tinta-suave">Valores descartados conservados: {r.opciones.filter((o) => o.clave !== r.elegida?.clave).map((o) => `${o.valor} (${ETIQUETA_FUENTE[o.procedencias[0].fuente.tipo]})`).join("; ")}</span>}
                {r.confirmacion && <span className="block text-ok">Motivo: {r.confirmacion.motivo}</span>}</td>
              <td className="py-2 font-semibold">{r.aplica === false ? "No aplica" : ETIQUETA_ESTADO[r.estado]}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <section>
        <h2 className="font-bold">Siguiente paso oficial</h2>
        <ol className="mt-1 list-decimal pl-5 text-sm">{t.pasos_oficiales.map((p) => <li key={p.texto}>{p.texto}</li>)}</ol>
        <p className="mt-1 text-sm">Canal oficial: {t.canal_oficial_url}</p>
      </section>
      <footer className="text-xs text-tinta-suave">«Confirmado por la persona» indica que la persona revisó el valor; no equivale a validación gubernamental. Alcance: {catalogo.alcance}</footer>
    </article>
  );
}
