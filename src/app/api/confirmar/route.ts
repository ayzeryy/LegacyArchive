import { z } from "zod";
import { responder } from "@/server/api";
import { confirmarDato } from "@/server/repo";

const Entrada = z.object({ procesoId: z.string(), concepto: z.string(), valorClave: z.string(), motivo: z.string().max(500).default("") });

export async function POST(req: Request) {
  return responder(async () => {
    const e = Entrada.parse(await req.json());
    confirmarDato(e.procesoId, e.concepto, e.valorClave, e.motivo);
  });
}
