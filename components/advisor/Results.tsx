"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowDown,
  ArrowLeftRight,
  ArrowRight,
  FileText,
  Info,
  ArrowUp,
  CircleCheck,
  Clock,
  Gamepad2,
  Briefcase,
  PencilLine,
  ShieldCheck,
  TrendingDown,
  Trophy,
  TriangleAlert,
  SearchX,
} from "lucide-react";
import type { Alternative, Confidence, Recommendation, ScoredMonitor } from "@/lib/engine/calculator";
import { compareHref } from "@/lib/routes";
import type { Profile } from "@/types/monitor";
import { BudgetSlider } from "./BudgetSlider";
import { ScoreRing } from "./ScoreRing";
import { CURRENT_MONITORS, GPU_OPTIONS, PROFILE_OPTIONS, eur, type Setup } from "./setup";
import { BrandPill, Card, Eyebrow, GlowFrame, VerdictBadge, cx } from "./ui";

const EASE = [0.22, 1, 0.36, 1] as const;

interface ResultsProps {
  setup: Setup;
  onChange: (patch: Partial<Setup>) => void;
  onEditEquipment: () => void;
  rec: Recommendation;
  alternatives: [Alternative, Alternative];
}

export function Results({ setup, onChange, onEditEquipment, rec, alternatives }: ResultsProps) {
  const reduce = useReducedMotion();
  const winner = rec.winner;

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: reduce ? 0 : 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay, ease: EASE },
  });

  return (
    <div className="space-y-6">
      <motion.div {...fadeUp(0)}>
        <SearchBar setup={setup} onChange={onChange} onEditEquipment={onEditEquipment} />
      </motion.div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={winner?.monitor.id ?? "none"}
          initial={{ opacity: 0, y: reduce ? 0 : 12, scale: reduce ? 1 : 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: reduce ? 0 : -8, scale: reduce ? 1 : 0.99 }}
          transition={{ duration: 0.35, ease: EASE }}
          className="space-y-6"
        >
          {winner && rec.confidence ? (
            <>
              <ConfidenceVerdict winner={winner} confidence={rec.confidence} />
              <WinnerCard item={winner} />
            </>
          ) : (
            <EmptyState />
          )}
        </motion.div>
      </AnimatePresence>

      {rec.worthWaiting && (
        <motion.div {...fadeUp(0.1)}>
          <Card className="flex items-start gap-3 p-6 text-sm">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-700">
              <Clock className="size-4.5" />
            </span>
            <div>
              <p className="font-medium text-ink">
                Si puedes esperar: {rec.worthWaiting.monitor.marca} {rec.worthWaiting.monitor.modelo}
                <span className="ml-2 font-mono text-zinc-500">{rec.worthWaiting.score}/100</span>
              </p>
              <p className="mt-0.5 text-zinc-500">{rec.worthWaiting.verdictReason}</p>
            </div>
          </Card>
        </motion.div>
      )}

      {winner && (
        <motion.section {...fadeUp(0.15)} className="pt-4">
          <Eyebrow className="mb-3 px-1">Alternativas para comparar</Eyebrow>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {alternatives.map((alt) => (
              <AlternativeCard key={alt.kind} alt={alt} winner={winner} />
            ))}
          </div>
        </motion.section>
      )}
    </div>
  );
}

// ───────────────────────────── Barra de búsqueda en vivo ─────────────────────────────

function SearchBar({
  setup,
  onChange,
  onEditEquipment,
}: {
  setup: Setup;
  onChange: (patch: Partial<Setup>) => void;
  onEditEquipment: () => void;
}) {
  const monitor = CURRENT_MONITORS.find((m) => m.id === setup.monitorActualId);
  const gpu = GPU_OPTIONS.find((g) => g.id === setup.gpu);
  return (
    <Card className="p-4 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
        <div className="flex rounded-full bg-canvas p-1" role="radiogroup" aria-label="Perfil">
          {PROFILE_OPTIONS.map(({ id, label, icon: Icon }) => {
            const active = setup.profile === id;
            return (
              <button
                key={id}
                role="radio"
                aria-checked={active}
                onClick={() => onChange({ profile: id as Profile })}
                className={cx(
                  "relative flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                  active ? "text-ink" : "text-zinc-500 hover:text-ink",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="profile-pill"
                    className="absolute inset-0 rounded-full bg-white shadow-elevated"
                    transition={{ type: "spring", stiffness: 500, damping: 38 }}
                  />
                )}
                <Icon className={cx("relative size-4 shrink-0 transition-colors max-xs:hidden", active && "text-brand")} />
                <span className="relative">{label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-1 items-center gap-4">
          <span className="w-24 shrink-0 font-mono text-lg font-semibold tabular-nums text-ink">{eur(setup.budget)}</span>
          <BudgetSlider value={setup.budget} onChange={(budget) => onChange({ budget })} />
        </div>

        <button
          onClick={onEditEquipment}
          className="group flex items-center gap-2 rounded-full px-1 text-left text-xs text-zinc-500 transition hover:text-ink lg:max-w-56"
        >
          <span className="truncate font-mono">
            {setup.dispositivo === "portatil" ? "Portátil" : "Sobremesa"} · GPU {gpu?.label.toLowerCase()}
            {monitor?.value ? ` · ${monitor.label}` : ""}
          </span>
          <PencilLine className="size-3.5 shrink-0 opacity-60 transition group-hover:opacity-100" />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {setup.gpuAutoAdjusted && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="overflow-hidden"
          >
            <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-hairline pt-3 text-xs text-zinc-500">
              <Info className="size-3.5 shrink-0" />
              Para jugar asumimos una gráfica de gama media (RTX 4060).
              <button onClick={onEditEquipment} className="font-medium text-ink underline-offset-2 hover:underline">
                Cambiar
              </button>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

// ───────────────────────────── Veredicto de confianza ─────────────────────────────

const CONFIDENCE_COLOR = {
  alta: "bg-gradient-to-r from-brand to-brand-accent",
  media: "bg-amber-500",
  baja: "bg-rose-500",
} as const;

function ConfidenceVerdict({ winner, confidence }: { winner: ScoredMonitor; confidence: Confidence }) {
  return (
    <Card className="grid gap-6 p-6 sm:grid-cols-[1fr_auto] sm:items-center sm:p-8">
      <div>
        <BrandPill>
          <ShieldCheck className="size-3.5" /> Veredicto de confianza
        </BrandPill>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <VerdictBadge verdict={winner.verdict} label={winner.verdictLabel} size="lg" />
          <span className="text-lg font-semibold tracking-tight text-ink">{confidence.label}</span>
        </div>
        <p className="mt-2 max-w-xl text-sm text-zinc-500">{confidence.reason}</p>
      </div>
      <div className="sm:w-56">
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-zinc-500">Seguridad del veredicto</span>
          <span className="font-mono text-2xl font-semibold tabular-nums text-ink">{confidence.value}%</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/[0.06]">
          <motion.div
            className={cx("h-full rounded-full", CONFIDENCE_COLOR[confidence.level])}
            initial={{ width: 0 }}
            animate={{ width: `${confidence.value}%` }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
          />
        </div>
      </div>
    </Card>
  );
}

// ───────────────────────────── Tarjeta ganadora ─────────────────────────────

function specs(item: ScoredMonitor): { label: string; value: string }[] {
  const m = item.monitor;
  return [
    { label: "Pantalla", value: `${m.pulgadas.toLocaleString("es-ES")}" ${m.relacion_aspecto}` },
    { label: "Resolución", value: `${m.resolucion.ancho}×${m.resolucion.alto}` },
    { label: "Densidad", value: `${item.ppi} ppi` },
    { label: "Refresco", value: `${m.hz} Hz` },
    { label: "Panel", value: m.panel },
    { label: "Respuesta", value: `${m.tiempo_respuesta_ms.toLocaleString("es-ES")} ms` },
    { label: "Color", value: `${m.cobertura_dci_p3}% P3` },
    { label: "USB-C", value: m.usbC ? (m.usbC_PD_watts ? `${m.usbC_PD_watts} W PD` : "Sin carga") : "—" },
  ];
}

function WinnerCard({ item }: { item: ScoredMonitor }) {
  const m = item.monitor;
  const reduce = useReducedMotion();
  const list = (delay: number) => ({
    hidden: {},
    show: { transition: { staggerChildren: 0.06, delayChildren: delay } },
  });
  const row = { hidden: { opacity: 0, x: reduce ? 0 : -6 }, show: { opacity: 1, x: 0, transition: { duration: 0.3, ease: EASE } } };

  return (
    <GlowFrame>
      <div className="grid overflow-hidden rounded-[calc(1.5rem-1px)] bg-white lg:grid-cols-[1.05fr_1fr]">
        {/* Identidad, precio y datos */}
        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <BrandPill className="px-3 py-0.5">
                  <Trophy className="size-3" /> Nº 1 para ti
                </BrandPill>
                <Eyebrow>{m.marca}</Eyebrow>
              </div>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{m.modelo}</h2>
            </div>
            <ScoreRing score={item.score} />
          </div>

          <div className="mt-6 flex flex-wrap items-end gap-x-4 gap-y-1">
            <span className="text-4xl font-semibold tracking-tight tabular-nums text-ink">{eur(m.precio_eur)}</span>
            <span className="pb-1 text-sm text-zinc-500">
              mín. histórico <span className="font-mono">{eur(m.precio_minimo_historico_eur)}</span>
            </span>
          </div>
          {item.targetPrice !== undefined && (
            <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
              Precio objetivo: <span className="font-mono">≤ {eur(item.targetPrice)}</span>
            </p>
          )}

          <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-4">
            {specs(item).map((s) => (
              <div key={s.label} className="bg-white px-3 py-3">
                <dt className="text-[11px] text-zinc-500">{s.label}</dt>
                <dd className="mt-0.5 truncate font-mono text-sm font-medium text-ink">{s.value}</dd>
              </div>
            ))}
          </dl>

          <Link
            href={`/monitor/${m.id}`}
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-ink underline-offset-4 hover:underline"
          >
            Ver ficha completa <ArrowRight className="size-4" />
          </Link>
        </div>

        {/* Interpretación y sacrificio */}
        <div className="border-t border-hairline bg-canvas/60 p-6 sm:p-8 lg:border-l lg:border-t-0">
          <h3 className="text-sm font-semibold text-ink">La Interpretación</h3>
          <motion.ul variants={list(0.15)} initial="hidden" animate="show" className="mt-3 space-y-3">
            {item.interpretation.map((t) => (
              <motion.li key={t} variants={row} className="flex gap-3 text-sm text-zinc-700">
                <CircleCheck className="mt-0.5 size-4 shrink-0 text-brand" />
                {t}
              </motion.li>
            ))}
          </motion.ul>

          <h3 className="mt-8 text-sm font-semibold text-ink">El Sacrificio</h3>
          <motion.ul variants={list(0.4)} initial="hidden" animate="show" className="mt-3 space-y-3">
            {item.sacrifices.length === 0 && (
              <li className="text-sm text-zinc-500">Nada relevante para tu uso.</li>
            )}
            {item.sacrifices.map((t) => (
              <motion.li key={t} variants={row} className="flex gap-3 text-sm text-zinc-700">
                <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-500" />
                {t}
              </motion.li>
            ))}
          </motion.ul>
        </div>
      </div>
    </GlowFrame>
  );
}

// ───────────────────────────── Alternativas ─────────────────────────────

const ALT_ICONS = { cheaper: TrendingDown, gaming: Gamepad2, work: Briefcase } as const;

interface Diff {
  label: string;
  from: string;
  to: string;
  better: boolean | null; // null = neutro
}

function diffs(alt: ScoredMonitor, base: ScoredMonitor, kind: Alternative["kind"]): Diff[] {
  const a = alt.monitor;
  const b = base.monitor;
  const pd = (w: number) => (w ? `${w} W` : "—");
  const all: Record<string, Diff | null> = {
    hz: a.hz !== b.hz ? { label: "Refresco", from: `${b.hz} Hz`, to: `${a.hz} Hz`, better: a.hz > b.hz } : null,
    ppi: Math.abs(alt.ppi - base.ppi) > 5 ? { label: "Densidad", from: `${base.ppi} ppi`, to: `${alt.ppi} ppi`, better: alt.ppi > base.ppi } : null,
    pd:
      a.usbC_PD_watts !== b.usbC_PD_watts
        ? { label: "Carga USB-C", from: pd(b.usbC_PD_watts), to: pd(a.usbC_PD_watts), better: a.usbC_PD_watts > b.usbC_PD_watts }
        : null,
    panel: a.panel !== b.panel ? { label: "Panel", from: b.panel, to: a.panel, better: null } : null,
    size:
      a.pulgadas !== b.pulgadas
        ? { label: "Tamaño", from: `${b.pulgadas.toLocaleString("es-ES")}"`, to: `${a.pulgadas.toLocaleString("es-ES")}"`, better: null }
        : null,
  };
  const order = kind === "gaming" ? ["hz", "panel", "ppi", "size", "pd"] : ["ppi", "pd", "hz", "panel", "size"];
  return order.map((k) => all[k]).filter((d): d is Diff => d !== null).slice(0, 3);
}

function AlternativeCard({ alt, winner }: { alt: Alternative; winner: ScoredMonitor }) {
  const Icon = ALT_ICONS[alt.kind];
  const item = alt.item;
  const priceDelta = item ? item.monitor.precio_eur - winner.monitor.precio_eur : 0;
  const scoreContext = alt.kind === "gaming" ? "nota gaming" : alt.kind === "work" ? "nota oficina" : "nota";

  return (
    <Card className="flex flex-col p-6 transition duration-300 ease-out-soft hover:-translate-y-0.5 hover:shadow-float">
      <div className="flex items-center gap-3">
        <span className="grid size-8 place-items-center rounded-lg bg-canvas text-ink">
          <Icon className="size-4" />
        </span>
        <h3 className="text-sm font-semibold text-ink">{alt.title}</h3>
      </div>

      {!item ? (
        <p className="mt-4 text-sm text-zinc-500">{alt.emptyReason}</p>
      ) : (
        <>
          <div className="mt-6 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-zinc-500">{item.monitor.marca}</p>
              <p className="truncate text-lg font-semibold tracking-tight text-ink">{item.monitor.modelo}</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-lg font-semibold tabular-nums text-ink">{eur(item.monitor.precio_eur)}</p>
              {priceDelta !== 0 && (
                <p
                  className={cx(
                    "font-mono text-xs tabular-nums",
                    priceDelta < 0 ? "text-brand" : "text-zinc-500",
                  )}
                >
                  {priceDelta < 0 ? "−" : "+"}
                  {eur(Math.abs(priceDelta))}
                </p>
              )}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <VerdictBadge verdict={item.verdict} label={item.verdictLabel} />
            <span className="font-mono text-xs text-zinc-500">
              {scoreContext} {item.score}/100
            </span>
          </div>

          <dl className="mt-6 divide-y divide-hairline rounded-2xl border border-hairline">
            {diffs(item, winner, alt.kind).map((d) => (
              <div key={d.label} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                <dt className="text-zinc-500">{d.label}</dt>
                <dd className="flex items-center gap-2 font-mono text-xs">
                  <span className="text-zinc-500">{d.from}</span>
                  <ArrowRight className="size-3 text-zinc-300" />
                  <span
                    className={cx(
                      "inline-flex items-center gap-0.5 font-medium",
                      d.better === true && "text-brand",
                      d.better === false && "text-rose-600",
                      d.better === null && "text-ink",
                    )}
                  >
                    {d.to}
                    {d.better === true && <ArrowUp className="size-3" />}
                    {d.better === false && <ArrowDown className="size-3" />}
                  </span>
                </dd>
              </div>
            ))}
          </dl>

          <ul className="mt-4 space-y-2 text-sm text-zinc-600">
            {item.interpretation[0] && (
              <li className="flex gap-2">
                <CircleCheck className="mt-0.5 size-4 shrink-0 text-brand" />
                {item.interpretation[0]}
              </li>
            )}
            {item.sacrifices[0] && (
              <li className="flex gap-2">
                <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-500" />
                {item.sacrifices[0]}
              </li>
            )}
          </ul>

          <div className="mt-auto flex flex-wrap gap-2 pt-6">
            <Link
              href={`/monitor/${item.monitor.id}`}
              className="inline-flex items-center gap-2 rounded-full border border-hairline px-4 py-2 text-xs font-medium text-ink transition hover:border-black/15 hover:bg-canvas"
            >
              <FileText className="size-3.5" /> Ver ficha completa
            </Link>
            <Link
              href={compareHref(winner.monitor.id, item.monitor.id)}
              className="inline-flex items-center gap-2 rounded-full bg-brand-glow px-4 py-2 text-xs font-medium text-brand-strong ring-1 ring-inset ring-brand-border transition hover:bg-brand-strong hover:text-white hover:shadow-glow-sm"
            >
              <ArrowLeftRight className="size-3.5" /> Comparar frente a frente
            </Link>
          </div>
        </>
      )}
    </Card>
  );
}

function EmptyState() {
  return (
    <Card className="p-10 text-center">
      <SearchX className="mx-auto size-8 text-zinc-300" />
      <p className="mt-3 font-semibold text-ink">Ningún monitor supera nuestros filtros</p>
      <p className="mt-1 text-sm text-zinc-500">Prueba a subir el presupuesto o a cambiar de perfil en la barra de arriba.</p>
    </Card>
  );
}
