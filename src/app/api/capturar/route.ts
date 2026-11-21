import { z } from "zod";
import { responder } from "@/server/api";
import { capturarDato } from "@/server/repo";

const Entrada = z.object({ procesoId: z.string(), concepto: z.string(), valor: z.string().max(300), motivo: z.string().max(500).default("") });

export async function POST(req: Request) {
  return responder(async () => {
    const e = Entrada.parse(await req.json());
    capturarDato(e.procesoId, e.concepto, e.valor, e.motivo);
  });
}
