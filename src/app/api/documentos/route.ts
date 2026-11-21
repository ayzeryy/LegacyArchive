import { responder } from "@/server/api";
import { aportarDocumento, ErrorDemo } from "@/server/repo";

export async function POST(req: Request) {
  return responder(async () => {
    const f = await req.formData();
    const archivo = f.get("archivo");
    if (!(archivo instanceof File)) throw new ErrorDemo("Elige el archivo del documento.");
    const s = (k: string) => (typeof f.get(k) === "string" ? String(f.get(k)) : "");
    aportarDocumento({
      procesoId: s("procesoId") || null,
      tipo: s("tipo"),
      nombreArchivo: archivo.name,
      bytes: new Uint8Array(await archivo.arrayBuffer()),
      fechaEmision: s("fechaEmision") || null,
      declaraSintetico: s("sintetico") === "si",
      nota: s("nota") || undefined,
    });
  });
}
