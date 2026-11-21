import { z } from "zod";
import { responder } from "@/server/api";
import { extraerConCroma } from "@/server/croma";
import { ErrorDemo, tramite } from "@/server/repo";

export const maxDuration = 120;

export async function POST(req: Request) {
  return responder(async () => {
    const { tramiteId, url } = z.object({ tramiteId: z.string(), url: z.string().url() }).parse(await req.json());
    const t = tramite(tramiteId);
    // Solo se permiten URL oficiales que ya están en el catálogo como fuentes.
    if (!t || !t.fuentes.some((f) => f.url === url)) throw new ErrorDemo("Solo se pueden extraer las fuentes oficiales del catálogo.");
    return { extraccion: await extraerConCroma(tramiteId, url) };
  });
}
