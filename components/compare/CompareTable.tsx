import { Check } from "lucide-react";
import { Card, cx } from "@/components/advisor/ui";
import { SPEC_GROUPS, rowWinner } from "@/lib/specs";
import type { Monitor } from "@/types/monitor";

/** Recuento de filas en las que gana cada monitor (solo filas comparables). */
export function countAdvantages(a: Monitor, b: Monitor) {
  let wa = 0;
  let wb = 0;
  for (const group of SPEC_GROUPS) {
    for (const row of group.rows) {
      const w = rowWinner(row, a, b);
      if (w === "a") wa++;
      if (w === "b") wb++;
    }
  }
  return { a: wa, b: wb };
}

export function CompareTable({ a, b }: { a: Monitor; b: Monitor }) {
  return (
    <Card className="overflow-clip">
      {/* Cabecera fija con los nombres, para no perderse al hacer scroll */}
      <div className="sticky top-[var(--header-h)] z-10 grid grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,1fr)] gap-2 border-b border-hairline bg-white/90 px-4 py-3 backdrop-blur sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)] sm:px-6">
        <span />
        {[a, b].map((m) => (
          <span key={m.id} className="truncate text-xs font-semibold text-ink sm:text-sm">
            {m.marca} {m.modelo}
          </span>
        ))}
      </div>

      {SPEC_GROUPS.map((group) => (
        <div key={group.id}>
          <h3 className="bg-canvas/70 px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500 sm:px-6">
            {group.label}
          </h3>
          <dl className="divide-y divide-hairline">
            {group.rows.map((row) => {
              const winner = rowWinner(row, a, b);
              return (
                <div
                  key={row.key}
                  className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,1fr)] items-center gap-2 px-4 py-2 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)] sm:px-6"
                >
                  <dt className="text-xs text-zinc-500 sm:text-sm">{row.label}</dt>
                  <Cell value={row.format(a)} wins={winner === "a"} />
                  <Cell value={row.format(b)} wins={winner === "b"} />
                </div>
              );
            })}
          </dl>
        </div>
      ))}
    </Card>
  );
}

function Cell({ value, wins }: { value: string; wins: boolean }) {
  return (
    <dd
      className={cx(
        "flex min-w-0 items-center gap-2 rounded-lg px-2 py-1.5 font-mono text-xs sm:text-sm",
        wins ? "bg-emerald-50 font-semibold text-emerald-700" : "text-ink",
      )}
    >
      <span className="min-w-0 break-words">{value}</span>
      {wins && <Check className="size-3.5 shrink-0" strokeWidth={3} aria-label="Ventaja" />}
    </dd>
  );
}
