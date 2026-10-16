import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Box, Trophy } from "lucide-react";
import { PROFILE_OPTIONS, eur } from "@/components/advisor/setup";
import { Card, Eyebrow } from "@/components/advisor/ui";
import { CompareLauncher } from "@/components/compare/CompareLauncher";
import { getMonitor } from "@/data/monitors";
import { POPULAR_COMPARISONS, type PopularComparison } from "@/data/popular-comparisons";
import { scoreMonitor } from "@/lib/engine/calculator";
import { compare3dHref, compareHref } from "@/lib/routes";
import type { CurrentEquipment } from "@/types/monitor";

export const metadata: Metadata = {
  title: "Comparativas de monitores",
  description:
    "Compara dos monitores frente a frente: especificaciones, ventajas de cada uno, veredicto para tu uso y espacio en tu mesa en 3D.",
};

/**
 * Veredicto rápido precalculado en el build (página estática): perfil de la comparativa, equipo típico
 * de ese perfil y presupuesto igual al precio del más caro. La comparativa completa usa el setup real.
 */
function quickVerdict(c: PopularComparison) {
  const a = getMonitor(c.a)!;
  const b = getMonitor(c.b)!;
  const budget = Math.max(a.precio_eur, b.precio_eur);
  const eq: CurrentEquipment = {
    dispositivo: c.profile === "mac" ? "portatil" : "sobremesa",
    gpu: c.profile === "gaming" ? "media" : "integrada",
  };
  const sa = scoreMonitor(a, c.profile, budget, eq);
  const sb = scoreMonitor(b, c.profile, budget, eq);
  const viableA = sa.verdict !== "descartado";
  const viableB = sb.verdict !== "descartado";
  const winner = viableA !== viableB ? (viableA ? sa : sb) : sa.score >= sb.score ? sa : sb;
  const loser = winner === sa ? sb : sa;
  return { a, b, winner, loser, tie: viableA === viableB && Math.abs(sa.score - sb.score) < 3 };
}

export default function CompareHubPage() {
  const featured = POPULAR_COMPARISONS[0];
  const cards = POPULAR_COMPARISONS.map((c) => ({ c, v: quickVerdict(c) }));

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-20 pt-8 sm:px-6 sm:pt-12">
      <div className="mx-auto mb-8 max-w-2xl px-1 text-center">
        <Eyebrow>Comparativas</Eyebrow>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          Frente a frente.
          <br />
          <span className="text-gradient-brand">Sin trampas.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-md text-zinc-500">
          Elige dos monitores: te decimos cuál gana para tu uso, en qué cede cada uno y cómo quedan en tu mesa.
        </p>
      </div>

      <CompareLauncher initialA={featured.a} initialB={featured.b} />

      <section className="mt-16" aria-labelledby="populares">
        <div className="mb-6 px-1">
          <Eyebrow>Más buscadas</Eyebrow>
          <h2 id="populares" className="mt-2 text-xl font-semibold tracking-tight text-ink sm:text-2xl">
            Comparativas más buscadas
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Veredicto rápido precalculado para el perfil indicado. Al abrirlas se recalcula con tu setup.
          </p>
        </div>

        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {cards.map(({ c, v }) => {
            const profile = PROFILE_OPTIONS.find((p) => p.id === c.profile)!;
            return (
              <li key={`${c.a}-${c.b}`}>
                <Card className="group relative flex h-full flex-col p-6 transition duration-300 ease-out-soft hover:-translate-y-0.5 hover:shadow-float sm:p-6">
                  <p className="text-sm font-semibold text-ink">{c.question}</p>
                  <h3 className="mt-3 text-[15px] leading-snug text-zinc-700">
                    {/* El enlace cubre toda la tarjeta (after:inset-0) sin anidar enlaces */}
                    <Link
                      href={compareHref(c.a, c.b)}
                      className="after:absolute after:inset-0 after:rounded-3xl after:content-[''] focus-visible:outline-none"
                    >
                      <span className="font-medium text-ink">{v.a.marca} {v.a.modelo}</span>
                      <span className="mx-2 text-zinc-500">vs</span>
                      <span className="font-medium text-ink">{v.b.marca} {v.b.modelo}</span>
                    </Link>
                  </h3>
                  <p className="mt-1 font-mono text-xs text-zinc-500">
                    {eur(v.a.precio_eur)} · {eur(v.b.precio_eur)}
                  </p>

                  <p className="mt-4 flex items-start gap-2 rounded-xl bg-brand-glow px-3 py-2.5 text-xs text-zinc-700 ring-1 ring-inset ring-brand-border">
                    <Trophy className="mt-px size-3.5 shrink-0 text-brand" />
                    <span>
                      Para {profile.label.toLowerCase()}:{" "}
                      {v.tie ? (
                        <>empate técnico ({v.winner.score} a {v.loser.score})</>
                      ) : (
                        <>
                          gana el <strong className="font-semibold text-ink">{v.winner.monitor.modelo}</strong> (
                          <span className="font-mono">{v.winner.score}</span> a <span className="font-mono">{v.loser.score}</span>)
                        </>
                      )}
                    </span>
                  </p>

                  <div className="relative z-10 mt-auto flex items-center justify-between gap-3 pt-6 text-xs font-medium">
                    <span className="inline-flex items-center gap-1 text-ink group-hover:text-brand-strong">
                      Ver comparativa <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" />
                    </span>
                    <Link
                      href={compare3dHref(c.a, c.b)}
                      className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-zinc-500 ring-1 ring-inset ring-hairline transition hover:text-brand-strong hover:ring-brand-border"
                    >
                      <Box className="size-3.5" /> En 3D
                    </Link>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      </section>

      <Card className="mt-12 flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center sm:p-8">
        <div>
          <p className="font-semibold text-ink">¿No sabes por dónde empezar?</p>
          <p className="text-sm text-zinc-500">Explora el catálogo con filtros y añade dos monitores a la comparativa.</p>
        </div>
        <Link
          href="/monitores"
          className="inline-flex items-center gap-2 rounded-full bg-brand-glow px-4 py-2.5 text-sm font-medium text-brand-strong ring-1 ring-inset ring-brand-border transition hover:bg-brand-strong hover:text-white"
        >
          Ir al catálogo <ArrowRight className="size-4" />
        </Link>
      </Card>
    </main>
  );
}
