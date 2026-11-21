import { readFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { responder } from "@/server/api";
import { fuentesImportadas, importarArchivo } from "@/server/repo";

const ARCHIVOS = ["sistema_antiguo_contribuyentes.csv", "exportacion_gestor_2025.json"];

export async function POST(req: Request) {
  return responder(async () => {
    const { procesoId } = z.object({ procesoId: z.string() }).parse(await req.json());
    const ya = new Set(fuentesImportadas().map((f) => f.nombreArchivo));
    const resultados = [];
    for (const nombre of ARCHIVOS) {
      if (ya.has(nombre)) continue;
      const bytes = new Uint8Array(readFileSync(path.join(process.cwd(), "muestras", nombre)));
      resultados.push({ nombre, ...importarArchivo(nombre, bytes, procesoId) });
    }
    return { resultados };
  });
}
