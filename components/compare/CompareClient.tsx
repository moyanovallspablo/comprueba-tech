"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { motion } from "motion/react";
import { ArrowLeftRight, Scale, Trophy } from "lucide-react";
import { ScoreRing } from "@/components/advisor/ScoreRing";
import { PROFILE_OPTIONS, eur, toEquipment } from "@/components/advisor/setup";
import { Card, Eyebrow, VerdictBadge, cx } from "@/components/advisor/ui";
import { getMonitor } from "@/data/monitors";
import { getProfileWeights, scoreMonitor, type Criterion, type ScoredMonitor } from "@/lib/engine/calculator";
import { compareHref } from "@/lib/routes";
import { useSetup } from "@/lib/setup-store";
import type { Profile } from "@/types/monitor";
import { MonitorCombobox } from "./MonitorCombobox";

// ───────────────────────────── Selector de modelos ─────────────────────────────

export function CompareSelector({ a, b }: { a: string; b: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const go = (nextA: string, nextB: string) => {
    // Elegir en un lado el modelo que ya está en el otro equivale a intercambiarlos.
    if (nextA === nextB) [nextA, nextB] = [b, a];
    startTransition(() => router.push(compareHref(nextA, nextB), { scroll: false }));
  };

  return (
    <Card className={cx("flex flex-col gap-3 p-3 transition-opacity sm:flex-row sm:items-center", pending && "opacity-60")}>
      <MonitorCombobox value={a} onChange={(v) => go(v, b)} label="Monitor A" badge="A" />
      <SwapButton onClick={() => go(b, a)} />
      <MonitorCombobox value={b} onChange={(v) => go(a, v)} label="Monitor B" badge="B" />
    </Card>
  );
}

export function SwapButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="grid size-10 shrink-0 place-items-center self-center rounded-full border border-hairline bg-white text-zinc-500 transition duration-300 hover:rotate-180 hover:border-brand-border hover:text-brand-strong"
      aria-label="Intercambiar monitores"
    >
      <ArrowLeftRight className="size-4" />
    </button>
  );
}

// ───────────────────────────── Veredicto del algoritmo ─────────────────────────────

const PROFILES: Profile[] = ["mac", "gaming", "oficina"];

const CRITERION_LABELS: Record<Criterion, string> = {
  imagen: "imagen",
  fluidez: "fluidez",
  conectividad: "conectividad",
  ergonomia: "ergonomía",
  valor: "relación calidad-precio",
  madurez: "madurez",
};

export function AlgorithmVerdict({ a, b }: { a: string; b: string }) {
  const ma = getMonitor(a)!;
  const mb = getMonitor(b)!;
  const setup = useSetup();
  const [override, setOverride] = useState<Profile | null>(null);

  const budget = setup.completed ? setup.budget : Math.max(ma.precio_eur, mb.precio_eur);
  const equipment = useMemo(() => toEquipment(setup), [setup]);

  // Sin perfil en Mi Setup, el perfil donde mejor nota saca la pareja.
  const bestProfile = useMemo(() => {
    const best = PROFILES.map((p) =>
      Math.max(scoreMonitor(ma, p, budget, equipment).score, scoreMonitor(mb, p, budget, equipment).score),
    );
    return PROFILES[best.indexOf(Math.max(...best))];
  }, [ma, mb, budget, equipment]);

  const profile = override ?? setup.profile ?? bestProfile;
  const sa = scoreMonitor(ma, profile, budget, equipment);
  const sb = scoreMonitor(mb, profile, budget, equipment);
  const weights = getProfileWeights(profile, budget);

  const { winner, loser, summary, reasons } = decide(sa, sb, weights);
  const profileLabel = PROFILE_OPTIONS.find((p) => p.id === profile)!.label;

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline p-6 sm:px-8">
        <div>
          <Eyebrow className="flex items-center gap-2">
            <Scale className="size-3.5" /> Veredicto contextual
          </Eyebrow>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-ink">¿Cuál elegiría el algoritmo para tu perfil?</h2>
        </div>
        <div className="flex rounded-full bg-canvas p-1" role="radiogroup" aria-label="Perfil">
          {PROFILE_OPTIONS.map(({ id, label, icon: Icon }) => {
            const active = profile === id;
            return (
              <button
                key={id}
                role="radio"
                aria-checked={active}
                onClick={() => setOverride(id)}
                className={cx(
                  "relative flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  active ? "text-ink" : "text-zinc-500 hover:text-ink",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="compare-profile-pill"
                    className="absolute inset-0 rounded-full bg-white shadow-elevated"
                    transition={{ type: "spring", stiffness: 500, damping: 38 }}
                  />
                )}
                <Icon className="relative size-3.5 shrink-0 max-xs:hidden" />
                <span className="relative">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2">
        {[sa, sb].map((s, i) => {
          const isWinner = winner === s;
          return (
            <div
              key={s.monitor.id}
              className={cx(
                "flex items-center gap-4 p-6 sm:px-8",
                i === 1 && "border-t border-hairline sm:border-l sm:border-t-0",
                isWinner && "bg-emerald-50/50",
              )}
            >
              <ScoreRing score={s.score} />
              <div className="min-w-0">
                <p className="flex min-w-0 items-center gap-2 font-semibold text-ink">
                  {isWinner && <Trophy className="size-4 shrink-0 text-brand" />}
                  <span className="truncate">
                    {s.monitor.marca} {s.monitor.modelo}
                  </span>
                </p>
                <div className="mt-2">
                  <VerdictBadge verdict={s.verdict} label={s.verdictLabel} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-hairline bg-canvas/60 p-6 sm:px-8">
        <p className="text-sm font-medium text-ink">{summary}</p>
        {reasons.length > 0 && (
          <ul className="mt-3 space-y-2">
            {reasons.map((r) => (
              <li key={r} className="font-mono text-xs text-zinc-500">
                {r}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-xs text-zinc-500">
          Perfil {profileLabel.toLowerCase()} · presupuesto {eur(budget)}
          {setup.completed ? " (de Mi Setup)" : " (el precio del más caro: configura Mi Setup para afinar)"}
          {loser && loser.verdict === "descartado" ? ` · ${loser.monitor.modelo}: ${loser.verdictReason}` : ""}
        </p>
      </div>
    </Card>
  );
}

function decide(sa: ScoredMonitor, sb: ScoredMonitor, weights: Record<Criterion, number>) {
  const viableA = sa.verdict !== "descartado";
  const viableB = sb.verdict !== "descartado";
  const name = (s: ScoredMonitor) => `${s.monitor.marca} ${s.monitor.modelo}`;

  if (!viableA && !viableB) {
    return { winner: null, loser: null, summary: "Ninguno de los dos encaja con este perfil.", reasons: [] as string[] };
  }

  // Un descartado nunca gana, aunque su nota sea mayor.
  const winner = viableA !== viableB ? (viableA ? sa : sb) : sa.score >= sb.score ? sa : sb;
  const loser = winner === sa ? sb : sa;
  const margin = winner.score - loser.score;

  const reasons = (Object.keys(weights) as Criterion[])
    .map((c) => ({ c, impact: (winner.subscores[c] - loser.subscores[c]) * weights[c] }))
    .filter((d) => d.impact >= 1)
    .sort((x, y) => y.impact - x.impact)
    .slice(0, 3)
    .map(
      ({ c }) =>
        `+ ${CRITERION_LABELS[c]}: ${winner.subscores[c]} frente a ${loser.subscores[c]} (peso ${Math.round(weights[c] * 100)}%)`,
    );

  let summary: string;
  if (viableA !== viableB) {
    summary = `Elegiría el ${name(winner)}: el ${name(loser)} queda descartado para este uso.`;
  } else if (margin < 3) {
    const cheaper = winner.monitor.precio_eur <= loser.monitor.precio_eur ? winner : loser;
    const diff = Math.abs(winner.monitor.precio_eur - loser.monitor.precio_eur);
    summary = `Empate técnico (${winner.score} a ${loser.score}). Desempata el precio: el ${name(cheaper)} cuesta ${eur(diff)} menos.`;
  } else {
    summary = `Elegiría el ${name(winner)}, por ${winner.score} a ${loser.score}.`;
  }

  return { winner, loser, summary, reasons };
}
