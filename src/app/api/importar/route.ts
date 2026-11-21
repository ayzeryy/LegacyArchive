import { responder } from "@/server/api";
import { ErrorDemo, importarArchivo } from "@/server/repo";

export async function POST(req: Request) {
  return responder(async () => {
    const form = await req.formData();
    const archivo = form.get("archivo");
    const procesoId = form.get("procesoId");
    if (!(archivo instanceof File)) throw new ErrorDemo("Elige un archivo para importar.");
    if (archivo.size > 2_000_000) throw new ErrorDemo("El archivo supera 2 MB.");
    const r = importarArchivo(archivo.name, new Uint8Array(await archivo.arrayBuffer()), typeof procesoId === "string" && procesoId ? procesoId : undefined);
    return { resultado: r };
  });
}
