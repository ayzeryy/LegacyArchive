"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileSpreadsheet, FileJson, Sparkles, Upload, Link2Off, ShieldAlert } from "lucide-react";
import type { FuenteImportada } from "@/server/repo";
import { ETIQUETA_FUENTE } from "@/domain/tipos";
import { useAccion } from "./accion";
import { fechaHora, MensajeError } from "./ui";

export function PanelFuentes({ procesoId, fuentes }: { procesoId: string; fuentes: FuenteImportada[] }) {
  const { ejecutar, error, ocupado } = useAccion();
  const router = useRouter();
  // Mantiene a la persona en este paso para que vea el resultado de la importación.
  const quedarse = () => router.replace("?paso=fuentes", { scroll: false });
  const [aviso, setAviso] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  async function subir(files: FileList | null) {
    if (!files?.length) return;
    setAviso(null);
    for (const file of Array.from(files)) {
      const f = new FormData();
      f.set("archivo", file);
      f.set("procesoId", procesoId);
      const r = await ejecutar("/api/importar", f);
      if (r) {
        quedarse();
        const res = r.resultado as { valoresGuardados: number; vinculados: number; errores: unknown[] };
        setAviso(`«${file.name}»: ${res.valoresGuardados} valores guardados de ${res.vinculados} registro(s) vinculado(s)${res.errores.length ? `, ${res.errores.length} fila(s) con error` : ""}.`);
      }
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="space-y-5">
      <div className="tarjeta p-5">
        <h2 className="text-lg font-bold">Importa tus fuentes</h2>
        <p className="mt-1 text-sm text-tinta-suave">Admite el CSV o el DBF (dBASE/FoxPro) del sistema antiguo, en Windows-1252, y el JSON del gestor actual. Los archivos de Access (.mdb) todavía no se leen. Solo se leen: los archivos originales no se modifican.</p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button className="boton boton-primario" disabled={ocupado} onClick={async () => { setAviso(null); const r = await ejecutar("/api/importar-demo", { procesoId }); if (r) { quedarse(); setAviso("Caso de demostración cargado: 2 archivos sintéticos."); } }}>
            <Sparkles aria-hidden className="size-4" /> {ocupado ? "Importando…" : "Cargar caso de demostración"}
          </button>
          <label className="boton boton-secundario cursor-pointer">
            <Upload aria-hidden className="size-4" /> Elegir archivos
            <input ref={input} type="file" accept=".csv,.dbf,.json,.mdb" multiple className="sr-only" onChange={(e) => subir(e.target.files)} />
          </label>
        </div>
        <p className="mt-3 text-xs text-tinta-suave">
          Archivos de muestra: <a className="underline" href="/api/muestras/sistema_antiguo_contribuyentes.csv">CSV heredado</a> · <a className="underline" href="/api/muestras/padron_antiguo_2012.dbf">DBF heredado</a> · <a className="underline" href="/api/muestras/exportacion_gestor_2025.json">JSON del gestor</a> · <a className="underline" href="/api/muestras/importacion_invalida.csv">CSV inválido (para probar errores)</a>
        </p>
        <div aria-live="polite">{aviso && <p className="aparecer mt-3 rounded-lg bg-ok-fondo px-3 py-2 text-sm text-ok">{aviso}</p>}</div>
        <MensajeError error={error} />
      </div>

      {fuentes.length > 0 && (
        <ul className="space-y-3">
          {fuentes.map((f) => (
            <li key={f.id} className="tarjeta p-4">
              <div className="flex flex-wrap items-center gap-2">
                {f.tipo === "csv_heredado" || f.tipo === "dbf_heredado" ? <FileSpreadsheet aria-hidden className="size-5 text-marca" /> : <FileJson aria-hidden className="size-5 text-marca" />}
                <span className="font-semibold">{f.nombreArchivo}</span>
                <span className="text-sm text-tinta-suave">· {ETIQUETA_FUENTE[f.tipo]} · {fechaHora(f.importadoEn)}</span>
              </div>
              <p className="mt-1 text-sm">{f.totalFilas} registro(s) leídos, {f.vinculados} vinculado(s) a tu expediente.</p>
              {f.errores.map((e) => <p key={e.fila} className="mt-1 text-sm text-alerta">Fila {e.fila}: {e.mensaje}</p>)}
              {f.noVinculados.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {f.noVinculados.map((n, i) => (
                    <li key={i} className={`flex items-start gap-2 rounded-lg px-3 py-2 text-sm ${n.decision === "bloqueado" ? "bg-alerta-fondo text-alerta" : "bg-papel text-tinta-suave"}`}>
                      {n.decision === "bloqueado" ? <ShieldAlert aria-hidden className="mt-0.5 size-4 shrink-0" /> : <Link2Off aria-hidden className="mt-0.5 size-4 shrink-0" />}
                      <span><strong>{n.nombre}</strong>: {n.motivo}</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
