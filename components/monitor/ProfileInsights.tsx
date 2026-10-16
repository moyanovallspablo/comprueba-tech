"use client";

import Link from "next/link";
import { createContext, use, useMemo, useState, type ReactNode } from "react";
import { ArrowLeftRight, ArrowRight, CircleCheck, TriangleAlert } from "lucide-react";
import { motion } from "motion/react";
import { ScoreRing } from "@/components/advisor/ScoreRing";
import { PROFILE_OPTIONS, eur, toEquipment } from "@/components/advisor/setup";
import { Card, Eyebrow, VerdictBadge, cx } from "@/components/advisor/ui";
import { getMonitor } from "@/data/monitors";
import { getRecommendation, scoreMonitor, type Recommendation, type ScoredMonitor } from "@/lib/engine/calculator";
import { compareHref, monitorHref } from "@/lib/routes";
import { useSetup } from "@/lib/setup-store";
import type { CurrentEquipment, Monitor, Profile } from "@/types/monitor";

// ───────────────────────────── Contexto de perfil ─────────────────────────────

/**
 * Perfil con el que se analiza la ficha:
 * 1. el que el usuario elija en las pestañas de esta página (no toca su setup global),
 * 2. si no, el de su setup ("Mi Setup"),
 * 3. si no lo tiene, el perfil en el que mejor puntúa este monitor.
 * Sin setup completado, el presupuesto es el propio precio del monitor (contexto neutro).
 */

interface Insights {
  monitor: Monitor;
  profile: Profile;
  setProfile: (p: Profile) => void;
  fromSetup: boolean;
  budget: number;
  equipment: CurrentEquipment;
  rec: Recommendation;
  scored: ScoredMonitor;
}

const InsightsContext = createContext<Insights | null>(null);

function useInsights(): Insights {
  const ctx = use(InsightsContext);
  if (!ctx) throw new Error("useInsights debe usarse dentro de <ProfileInsightsProvider>");
  return ctx;
}

export function ProfileInsightsProvider({ monitorId, children }: { monitorId: string; children: ReactNode }) {
  const monitor = getMonitor(monitorId)!;
  const setup = useSetup();
  const [override, setOverride] = useState<Profile | null>(null);

  const budget = setup.completed ? setup.budget : monitor.precio_eur;
  const equipment = useMemo(() => toEquipment(setup), [setup]);

  const bestProfile = useMemo(() => {
    const scores = PROFILES.map((p) => scoreMonitor(monitor, p, budget, equipment).score);
    return PROFILES[scores.indexOf(Math.max(...scores))];
  }, [budget, equipment, monitor]);

  const profile = override ?? setup.profile ?? bestProfile;
  const rec = useMemo(() => getRecommendation(profile, budget, equipment), [profile, budget, equipment]);
  const scored = rec.ranking.find((s) => s.monitor.id === monitor.id)!;

  const value: Insights = {
    monitor,
    profile,
    setProfile: setOverride,
    fromSetup: override === null && setup.profile !== null,
    budget,
    equipment,
    rec,
    scored,
  };
  return <InsightsContext value={value}>{children}</InsightsContext>;
}

const PROFILES: Profile[] = ["mac", "gaming", "oficina"];

// ───────────────────────────── Veredicto para tu perfil ─────────────────────────────

export function ProfileVerdict() {
  const { profile, setProfile, scored, rec, fromSetup, budget } = useInsights();
  const position = rec.ranking.indexOf(scored) + 1;
  const setup = useSetup();

  return (
    <Card className="p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Eyebrow>Veredicto para tu uso</Eyebrow>
        <ProfileTabs value={profile} onChange={setProfile} />
      </div>
      <div className="mt-6 flex items-center gap-6">
        <ScoreRing score={scored.score} />
        <div className="min-w-0">
          <VerdictBadge verdict={scored.verdict} label={scored.verdictLabel} size="lg" />
          <p className="mt-2 text-sm text-zinc-500">{scored.verdictReason}</p>
          <p className="mt-1 font-mono text-xs text-zinc-500">
            #{position} de {rec.ranking.length} para {PROFILE_OPTIONS.find((p) => p.id === profile)?.label.toLowerCase()}
            {setup.completed ? ` · presupuesto ${eur(budget)}` : ""}
            {fromSetup ? " · según Mi Setup" : ""}
          </p>
        </div>
      </div>
    </Card>
  );
}

function ProfileTabs({ value, onChange }: { value: Profile; onChange: (p: Profile) => void }) {
  return (
    <div className="flex rounded-full bg-canvas p-1" role="radiogroup" aria-label="Analizar para">
      {PROFILE_OPTIONS.map(({ id, label, icon: Icon }) => {
        const active = value === id;
        return (
          <button
            key={id}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(id)}
            className={cx(
              "relative flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              active ? "text-ink" : "text-zinc-500 hover:text-ink",
            )}
          >
            {active && (
              <motion.span
                layoutId="insights-profile-pill"
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
  );
}

// ───────────────────────────── Interpretación y sacrificio ─────────────────────────────

export function InterpretationAndSacrifice() {
  const { scored } = useInsights();
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="p-6 sm:p-8">
        <h2 className="text-sm font-semibold text-ink">La Interpretación</h2>
        <ul className="mt-4 space-y-3">
          {scored.interpretation.map((t) => (
            <li key={t} className="flex gap-3 text-sm text-zinc-700">
              <CircleCheck className="mt-0.5 size-4 shrink-0 text-brand" />
              {t}
            </li>
          ))}
        </ul>
      </Card>
      <Card className="p-6 sm:p-8">
        <h2 className="text-sm font-semibold text-ink">El Sacrificio</h2>
        <ul className="mt-4 space-y-3">
          {scored.sacrifices.length === 0 && <li className="text-sm text-zinc-500">Nada relevante para este uso.</li>}
          {scored.sacrifices.map((t) => (
            <li key={t} className="flex gap-3 text-sm text-zinc-700">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-500" />
              {t}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

// ───────────────────────────── Alternativas recomendadas ─────────────────────────────

export function RecommendedAlternatives() {
  const { monitor, rec } = useInsights();

  // Solo opciones que el algoritmo recomendaría: rellenar con descartados contradiría el veredicto.
  const picks = useMemo(
    () => rec.ranking.filter((s) => s.monitor.id !== monitor.id && s.verdict !== "descartado").slice(0, 3),
    [rec, monitor],
  );

  if (picks.length === 0) {
    return (
      <Card className="p-6 text-sm text-zinc-500">
        Para este uso y presupuesto no hay otro monitor que el algoritmo recomiende. Prueba con otro perfil arriba.
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {picks.map((s) => {
        const delta = s.monitor.precio_eur - monitor.precio_eur;
        return (
          <Card key={s.monitor.id} className="flex flex-col p-6 transition duration-300 ease-out-soft hover:-translate-y-0.5 hover:shadow-float">
            <p className="text-xs text-zinc-500">{s.monitor.marca}</p>
            <p className="truncate font-semibold tracking-tight text-ink">{s.monitor.modelo}</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-mono text-sm font-semibold text-ink">{eur(s.monitor.precio_eur)}</span>
              {delta !== 0 && (
                <span className={cx("font-mono text-xs", delta < 0 ? "text-brand" : "text-zinc-500")}>
                  {delta < 0 ? "−" : "+"}
                  {eur(Math.abs(delta))}
                </span>
              )}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <VerdictBadge verdict={s.verdict} label={s.verdictLabel} />
              <span className="font-mono text-xs text-zinc-500">{s.score}/100</span>
            </div>
            {s.interpretation[0] && (
              <p className="mt-3 flex gap-2 text-sm text-zinc-600">
                <CircleCheck className="mt-0.5 size-4 shrink-0 text-brand" />
                {s.interpretation[0]}
              </p>
            )}
            <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-4 text-xs font-medium">
              <Link href={monitorHref(s.monitor.id)} className="inline-flex items-center gap-1 text-ink hover:underline">
                Ver ficha <ArrowRight className="size-3.5" />
              </Link>
              <Link
                href={compareHref(monitor.id, s.monitor.id)}
                className="inline-flex items-center gap-1 text-zinc-500 hover:text-ink hover:underline"
              >
                <ArrowLeftRight className="size-3.5" /> Comparar
              </Link>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
