import { contenidoDocumento } from "@/server/repo";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = (await contenidoDocumento(id));
  if (!d) return new Response("Documento no encontrado", { status: 404 });
  return new Response(Buffer.from(d.bytes), {
    headers: { "Content-Type": d.nombre.endsWith(".pdf") ? "application/pdf" : "application/octet-stream", "Content-Disposition": `inline; filename="${encodeURIComponent(d.nombre)}"` },
  });
}
