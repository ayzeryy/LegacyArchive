import { z } from "zod";
import { responder } from "@/server/api";
import { abrirProceso } from "@/server/repo";

const Entrada = z.object({
  tramiteId: z.string(),
  tipoSolicitante: z.string(),
  inscrita_comerciante: z.enum(["si", "no"]).optional(),
  copropiedad: z.enum(["si", "no"]).optional(),
});

export async function POST(req: Request) {
  return responder(async () => {
    const e = Entrada.parse(await req.json());
    return { proceso: (await abrirProceso(e.tramiteId, e.tipoSolicitante, e)) };
  });
}
