import { z } from "zod";
import { responder } from "@/server/api";
import { autorizarReutilizacion } from "@/server/repo";

export async function POST(req: Request) {
  return responder(async () => {
    const { procesoId } = z.object({ procesoId: z.string() }).parse(await req.json());
    autorizarReutilizacion(procesoId);
  });
}
