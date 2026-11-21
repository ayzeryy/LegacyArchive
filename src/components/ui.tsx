import { AlertTriangle, CheckCircle2, CircleDashed, CircleHelp, Clock, FileX2, ShieldCheck, CircleDot } from "lucide-react";
import type { Estado } from "@/domain/tipos";
import { ETIQUETA_ESTADO } from "@/domain/tipos";

const ESTILO: Record<Estado | "no_aplica", { clase: string; Icono: typeof CheckCircle2; etiqueta: string }> = {
  disponible: { clase: "bg-info-fondo text-info", Icono: CircleDot, etiqueta: ETIQUETA_ESTADO.disponible },
  confirmado_usuario: { clase: "bg-ok-fondo text-ok", Icono: CheckCircle2, etiqueta: ETIQUETA_ESTADO.confirmado_usuario },
  en_conflicto: { clase: "bg-alerta-fondo text-alerta", Icono: AlertTriangle, etiqueta: ETIQUETA_ESTADO.en_conflicto },
  faltante: { clase: "bg-aviso-fondo text-aviso", Icono: FileX2, etiqueta: ETIQUETA_ESTADO.faltante },
  vencido: { clase: "bg-alerta-fondo text-alerta", Icono: Clock, etiqueta: ETIQUETA_ESTADO.vencido },
  por_confirmar: { clase: "bg-aviso-fondo text-aviso", Icono: CircleHelp, etiqueta: ETIQUETA_ESTADO.por_confirmar },
  verificado_fuente_oficial: { clase: "bg-ok-fondo text-ok", Icono: ShieldCheck, etiqueta: ETIQUETA_ESTADO.verificado_fuente_oficial },
  no_aplica: { clase: "bg-papel text-tinta-suave", Icono: CircleDashed, etiqueta: "No aplica" },
};

export function ChipEstado({ estado }: { estado: Estado | "no_aplica" }) {
  const { clase, Icono, etiqueta } = ESTILO[estado];
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${clase}`}>
      <Icono aria-hidden className="size-3.5" />
      {etiqueta}
    </span>
  );
}

export function BarraAvance({ preparados, aplicables }: { preparados: number; aplicables: number }) {
  const pct = aplicables ? Math.round((preparados / aplicables) * 100) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-semibold">{preparados} de {aplicables} requisitos modelados preparados</span>
        <span className="text-tinta-suave">{pct}%</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-linea/70" role="progressbar" aria-valuemin={0} aria-valuemax={aplicables} aria-valuenow={preparados} aria-label="Avance del expediente">
        <div className="h-2 rounded-full bg-marca transition-[width] duration-300" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1.5 text-xs text-tinta-suave">Se calcula sobre los requisitos aplicables del catálogo de la demo. No es una probabilidad de aprobación.</p>
    </div>
  );
}

export function fechaCorta(iso: string | null | undefined): string {
  if (!iso) return "desconocida";
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  return d.toLocaleDateString("es-GT", { day: "numeric", month: "short", year: "numeric" });
}

export function fechaHora(iso: string): string {
  return new Date(iso).toLocaleString("es-GT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function MensajeError({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <p role="alert" className="aparecer mt-2 flex items-start gap-2 rounded-lg bg-alerta-fondo px-3 py-2 text-sm text-alerta">
      <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" />
      {error}
    </p>
  );
}
