import { cx } from "@/components/advisor/ui";
import { FIT_LABELS, type Fit } from "@/lib/ppi";

/** Piezas visuales compartidas por el simulador (cliente) y el resumen de la ficha (servidor). */

export const fmt = (n: number, digits = 0) => n.toLocaleString("es-ES", { maximumFractionDigits: digits });

const FIT_STYLES: Record<Fit, string> = {
  optimo: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  correcto: "bg-amber-50 text-amber-800 ring-amber-600/20",
  problematico: "bg-rose-50 text-rose-700 ring-rose-600/15",
};

export function FitBadge({ fit, label, className }: { fit: Fit; label?: string; className?: string }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset",
        FIT_STYLES[fit],
        className,
      )}
    >
      {label ?? FIT_LABELS[fit]}
    </span>
  );
}

export const scoreFit = (score: number): Fit => (score >= 7.5 ? "optimo" : score >= 5 ? "correcto" : "problematico");

const SEGMENT_COLORS: Record<Fit, string> = {
  optimo: "bg-emerald-500",
  correcto: "bg-amber-500",
  problematico: "bg-rose-500",
};

/** Barra de 10 segmentos para la nota de nitidez; el último segmento se rellena en proporción. */
export function ScoreMeter({ score, className }: { score: number; className?: string }) {
  const color = SEGMENT_COLORS[scoreFit(score)];
  return (
    <div className={cx("flex gap-1", className)} aria-hidden>
      {Array.from({ length: 10 }, (_, i) => {
        const fill = Math.min(1, Math.max(0, score - i));
        return (
          <span key={i} className="relative h-2 flex-1 overflow-hidden rounded-full bg-black/[0.06]">
            <span
              className={cx("absolute inset-y-0 left-0 rounded-full transition-[width] duration-500 ease-out-soft", color)}
              style={{ width: `${fill * 100}%` }}
            />
          </span>
        );
      })}
    </div>
  );
}
