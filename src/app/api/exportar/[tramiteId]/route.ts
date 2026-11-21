import { construirExportacion } from "@/domain/exportar";
import { catalogo, confirmaciones, evaluar, registrarExportacion } from "@/server/repo";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ tramiteId: string }> }) {
  const { tramiteId } = await params;
  const ev = evaluar(tramiteId);
  if (!ev) return new Response("Abre primero este trámite.", { status: 404 });
  const contenido = construirExportacion({
    catalogo, tramite: ev.tramite, procesoId: ev.proceso.id, evaluacion: ev.evaluacion,
    confirmaciones: confirmaciones(), generadoEn: new Date().toISOString(),
  });
  registrarExportacion(ev.proceso.id, contenido.estado, contenido);
  const fecha = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(contenido, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="expediente-${tramiteId}-${fecha}.json"`,
    },
  });
}
