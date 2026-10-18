import Link from "next/link";
import { ArrowLeftRight, ArrowRight, Box, Check, Sparkles, Star, TrendingDown } from "lucide-react";
import { BUDGET_MAX, eur } from "@/components/advisor/setup";
import { ScoreRing } from "@/components/advisor/ScoreRing";
import { BrandPill, Card, VerdictBadge, brandButtonBase, cx } from "@/components/advisor/ui";
import { MonitorImage } from "@/components/monitor/MonitorImage";
import { monitors } from "@/data/monitors";
import { POPULAR_COMPARISONS } from "@/data/popular-comparisons";
import { getRecommendation } from "@/lib/engine/calculator";
import { ADVISOR_HREF, compare3dHref, monitorHref } from "@/lib/routes";
import type { CurrentEquipment, Monitor } from "@/types/monitor";
import { SectionHeader, coverLink, liftOnHover } from "./SectionHeader";

/**
 * Bento de destacados, calculado en el build con el mismo motor que el asesor (página estática):
 * recomendación estrella para Mac, monitores en su mínimo histórico y accesos a las herramientas.
 */
export function Highlights() {
  return (
    <section className="mt-20 sm:mt-24" aria-labelledby="destacados">
      <SectionHeader
        id="destacados"
        eyebrow="Destacados"
        title="Lo que dice el algoritmo hoy"
        description="Veredictos recalculados con cada actualización de precios del catálogo."
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StarPick />
        <HistoricLows />
        <ToolCard
          icon={ArrowLeftRight}
          title="Comparador frente a frente"
          description="Dos monitores, dato a dato, con el veredicto para tu uso."
          href="/comparar"
          cta="Comparar"
          extra={{ href: compare3dHref(POPULAR_COMPARISONS[0].a, POPULAR_COMPARISONS[0].b), label: "En 3D a escala", icon: Box }}
        />
        <ToolCard
          icon={Sparkles}
          title="Asesor en 3 preguntas"
          description="Uso, presupuesto y equipo: el monitor que compraríamos nosotros."
          href={ADVISOR_HREF}
          cta="Empezar"
        />
      </div>
    </section>
  );
}

/* ── a) Recomendación estrella ── */

/** Supuesto de la tarjeta: Mac portátil (gráfica integrada) y presupuesto sin límite. */
const STAR_EQUIPMENT: CurrentEquipment = { dispositivo: "portatil", gpu: "integrada" };

function StarPick() {
  const rec = getRecommendation("mac", BUDGET_MAX, STAR_EQUIPMENT);
  const pick = rec.winner ?? rec.ranking[0];
  const m = pick.monitor;

  return (
    <Card className="relative flex flex-col p-6 sm:p-8 md:col-span-2 lg:row-span-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <BrandPill>
          <Star className="size-3.5" aria-hidden /> Recomendación estrella
        </BrandPill>
        <span className="text-xs font-medium text-zinc-500">Mejor para Mac</span>
      </div>

      <div className="mt-6 rounded-2xl bg-zinc-100/70 px-6 pt-6">
        <MonitorImage monitor={m} sizes="(min-width: 1024px) 480px, (min-width: 768px) 640px, 90vw" className="aspect-[16/10] w-full" />
      </div>

      <div className="mt-6 flex items-start gap-4">
        <ScoreRing score={pick.score} />
        <div className="min-w-0 flex-1">
          <p className="text-xs text-zinc-500">{m.marca}</p>
          <h3 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{m.modelo}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <VerdictBadge verdict={pick.verdict} label={pick.verdictLabel} />
            <span className="font-mono text-sm tabular-nums text-ink">{eur(m.precio_eur)}</span>
          </div>
        </div>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-zinc-600">{pick.verdictReason}</p>
      <ul className="mt-4 space-y-2">
        {pick.interpretation.slice(0, 2).map((t) => (
          <li key={t} className="flex items-start gap-2 text-sm text-zinc-700">
            <Check className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
            {t}
          </li>
        ))}
      </ul>

      <div className="mt-auto flex flex-wrap items-center gap-x-6 gap-y-4 pt-8">
        <Link href={monitorHref(m.id)} className={cx(brandButtonBase, "h-12 px-6 text-[15px]")}>
          Ver veredicto completo <ArrowRight className="size-4" />
        </Link>
        <Link href={ADVISOR_HREF} className="text-sm font-medium text-ink transition hover:text-brand-strong">
          Calcular para mi setup
        </Link>
      </div>
      <p className="mt-4 text-xs text-zinc-500">
        Supuesto: Mac portátil con gráfica integrada y presupuesto sin límite. Con tu setup el veredicto puede cambiar.
      </p>
    </Card>
  );
}

/* ── b) Mínimo histórico ── */

const overMinimum = (m: Monitor) => m.precio_eur - m.precio_minimo_historico_eur;
const launchDiscount = (m: Monitor) => (m.precio_lanzamiento_eur - m.precio_eur) / m.precio_lanzamiento_eur;

function HistoricLows() {
  const deals = [...monitors]
    .sort((a, b) => overMinimum(a) - overMinimum(b) || launchDiscount(b) - launchDiscount(a))
    .slice(0, 3);

  return (
    <Card className="flex flex-col p-6 md:col-span-2">
      <div className="flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
          <TrendingDown className="size-4" aria-hidden />
        </span>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">Mínimo histórico</p>
          <h3 className="text-lg font-semibold tracking-tight text-ink">En su mejor precio ahora</h3>
        </div>
      </div>
      <ul className="-mx-3 mt-4 divide-y divide-hairline">
        {deals.map((m) => {
          const over = overMinimum(m);
          return (
            <li key={m.id}>
              <Link
                href={monitorHref(m.id)}
                className="flex items-center gap-4 rounded-2xl px-3 py-3 transition-colors hover:bg-canvas focus-visible:outline-2 focus-visible:outline-brand"
              >
                <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-zinc-100/70 p-1">
                  <MonitorImage monitor={m} sizes="48px" className="size-full" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink">
                    {m.marca} {m.modelo}
                  </span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500">
                    {over <= 0 ? (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/15">
                        Mínimo histórico
                      </span>
                    ) : (
                      <span>{over} € sobre su mínimo</span>
                    )}
                    <span className="font-mono tabular-nums">−{Math.round(launchDiscount(m) * 100)} % vs lanzamiento</span>
                  </span>
                </span>
                <span className="shrink-0 font-mono text-sm font-medium tabular-nums text-ink">{eur(m.precio_eur)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

/* ── c) Herramientas rápidas ── */

function ToolCard({
  icon: Icon,
  title,
  description,
  href,
  cta,
  extra,
}: {
  icon: typeof Box;
  title: string;
  description: string;
  href: string;
  cta: string;
  extra?: { href: string; label: string; icon: typeof Box };
}) {
  return (
    <Card className={cx("group relative flex flex-col p-6", liftOnHover)}>
      <span className="grid size-11 place-items-center rounded-2xl bg-brand-glow text-brand ring-1 ring-inset ring-brand-border">
        <Icon className="size-5" aria-hidden />
      </span>
      <h3 className="mt-6 text-lg font-semibold tracking-tight text-ink">
        <Link href={href} className={coverLink}>
          {title}
        </Link>
      </h3>
      <p className="mt-2 text-sm text-zinc-500">{description}</p>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-6 text-xs font-medium">
        <span className="inline-flex items-center gap-1 text-ink group-hover:text-brand-strong">
          {cta}
          <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0" />
        </span>
        {extra && (
          // z-10: queda por encima del enlace que cubre la tarjeta
          <Link
            href={extra.href}
            className="relative z-10 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-zinc-500 ring-1 ring-inset ring-hairline transition hover:text-brand-strong hover:ring-brand-border"
          >
            <extra.icon className="size-3.5" aria-hidden /> {extra.label}
          </Link>
        )}
      </div>
    </Card>
  );
}
