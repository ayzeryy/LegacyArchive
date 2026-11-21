import { z } from "zod";
import { responder } from "@/server/api";
import { confirmarDocumento } from "@/server/repo";

export async function POST(req: Request) {
  return responder(async () => {
    const e = z.object({ procesoId: z.string(), documentoId: z.string(), motivo: z.string().max(500).default("") }).parse(await req.json());
    await confirmarDocumento(e.procesoId, e.documentoId, e.motivo);
  });
}
