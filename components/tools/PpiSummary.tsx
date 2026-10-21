import Link from "next/link";
import { ArrowRight, ScanEye } from "lucide-react";
import { Card, cx } from "@/components/advisor/ui";
import { analyzeDisplay } from "@/lib/ppi";
import { ppiSimulatorHref } from "@/lib/routes";
import type { Monitor } from "@/types/monitor";
import { FitBadge, ScoreMeter, fmt } from "./SharpnessParts";

/** Resumen de nitidez para la ficha: mismos cálculos que el simulador, a la distancia recomendada. */
export function PpiSummary({ monitor: m, className }: { monitor: Monitor; className?: string }) {
  const a = analyzeDisplay({ pulgadas: m.pulgadas, ...m.resolucion });

  return (
    <Card className={cx("p-6 sm:p-6", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">
          <ScanEye className="size-4 text-brand" />
          Nitidez y escalado
        </h3>
        <Link
          href={ppiSimulatorHref(m.id)}
          className="inline-flex items-center gap-1 text-xs font-medium text-brand-strong hover:underline"
        >
          Abrir en el simulador <ArrowRight className="size-3.5" />
        </Link>
      </div>

      <div className="mt-4 grid gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <div>
          <p className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold tracking-tight tabular-nums text-ink">{Math.round(a.ppi)}</span>
            <span className="font-mono text-xs text-zinc-500">ppi · {a.tier.label}</span>
          </p>
          <p className="mt-3 flex items-baseline justify-between gap-3 text-sm">
            <span className="text-zinc-500">Nitidez a {a.distanciaCm} cm</span>
            <span className="font-mono font-semibold tabular-nums text-ink">{fmt(a.score, 1)} / 10</span>
          </p>
          <ScoreMeter score={a.score} className="mt-2" />
        </div>

        <dl className="divide-y divide-hairline text-sm">
          <div className="flex items-center justify-between gap-4 py-2">
            <dt className="shrink-0 text-zinc-500">macOS</dt>
            <dd className="flex min-w-0 flex-wrap items-center justify-end gap-2 text-right font-medium text-ink">
              {a.macos.label}
              <FitBadge fit={a.macos.fit} />
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4 py-2">
            <dt className="shrink-0 text-zinc-500">Windows</dt>
            <dd className="flex min-w-0 flex-wrap items-center justify-end gap-2 text-right font-medium text-ink">
              {a.windows.label}
              <FitBadge fit={a.windows.fit} />
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 py-2">
            <dt className="shrink-0 text-zinc-500">Distancia ideal</dt>
            <dd className="text-right font-mono font-medium text-ink">
              {a.distance.min}–{a.distance.max} cm
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 py-2">
            <dt className="shrink-0 text-zinc-500">Píxel invisible desde</dt>
            <dd className="text-right font-mono font-medium text-ink">{a.retinaDistanceCm} cm</dd>
          </div>
        </dl>
      </div>
    </Card>
  );
}
