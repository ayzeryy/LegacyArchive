import { readFileSync } from "node:fs";
import path from "node:path";

const PERMITIDOS: Record<string, string> = {
  "sistema_antiguo_contribuyentes.csv": "text/csv; charset=windows-1252",
  "exportacion_gestor_2025.json": "application/json",
  "importacion_invalida.csv": "text/csv",
  "dpi_MUESTRA.pdf": "application/pdf",
  "patente_empresa_MUESTRA.pdf": "application/pdf",
  "constancia_rtu_MUESTRA.pdf": "application/pdf",
};

export async function GET(_req: Request, { params }: { params: Promise<{ nombre: string }> }) {
  const { nombre } = await params;
  const tipo = PERMITIDOS[nombre];
  if (!tipo) return new Response("No encontrado", { status: 404 });
  const ruta = nombre.endsWith(".pdf") ? path.join(process.cwd(), "muestras", "documentos", nombre) : path.join(process.cwd(), "muestras", nombre);
  return new Response(readFileSync(ruta), { headers: { "Content-Type": tipo, "Content-Disposition": `attachment; filename="${nombre}"` } });
}
