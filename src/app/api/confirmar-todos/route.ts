import { z } from "zod";
import { responder } from "@/server/api";
import { confirmarDato, ErrorDemo, evaluar, procesos } from "@/server/repo";

export async function POST(req: Request) {
  return responder(async () => {
    const { procesoId } = z.object({ procesoId: z.string() }).parse(await req.json());
    const p = (await procesos()).find((x) => x.id === procesoId);
    if (!p) throw new ErrorDemo("Proceso no encontrado.", 404);
    const ev = (await evaluar(p.tramiteId))!;
    let n = 0;
    for (const r of ev.evaluacion.requisitos) {
      if (r.aplica !== false && r.requisito.tipo === "dato" && r.estado === "disponible" && r.elegida) {
        await confirmarDato(procesoId, r.requisito.concepto, r.elegida.clave, "Revisado por la persona (confirmación en bloque de datos sin conflicto).");
        n++;
      }
    }
    return { confirmados: n };
  });
}
