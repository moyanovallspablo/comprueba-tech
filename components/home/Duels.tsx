import Link from "next/link";
import { eur } from "@/components/advisor/setup";
import { cx } from "@/components/advisor/ui";
import { MonitorImage } from "@/components/monitor/MonitorImage";
import { getMonitor } from "@/data/monitors";
import { POPULAR_COMPARISONS } from "@/data/popular-comparisons";
import { duelEdges } from "@/lib/duel";
import { compareHref } from "@/lib/routes";
import { fullName } from "@/lib/seo";
import type { Monitor } from "@/types/monitor";
import { SectionHeader, liftOnHover, tile } from "./SectionHeader";

const DUELS_ON_HOME = 6;

/** Comparativas populares estilo «versus»: cara a cara, insignia VS y lo que gana cada uno de un vistazo. */
export function Duels() {
  const duels = POPULAR_COMPARISONS.slice(0, DUELS_ON_HOME).map((c) => ({
    ...c,
    ma: getMonitor(c.a)!,
    mb: getMonitor(c.b)!,
  }));

  return (
    <section className="mt-20 sm:mt-24" aria-labelledby="duelos">
      <SectionHeader
        id="duelos"
        eyebrow="Duelos directos"
        title="Frente a frente, sin rodeos"
        description="Las comparativas más buscadas. En verde, lo que gana cada uno."
        action={{ href: "/comparar", label: "Todas las comparativas" }}
      />
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {duels.map((d) => (
          <li key={`${d.a}-${d.b}`}>
            <DuelCard a={d.ma} b={d.mb} question={d.question} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function DuelCard({ a, b, question }: { a: Monitor; b: Monitor; question: string }) {
  return (
    <div className={cx(tile, "group relative flex h-full flex-col border-zinc-200 bg-white p-4 sm:p-6", liftOnHover)}>
      <div className="relative grid grid-cols-2 gap-2">
        {[a, b].map((m) => (
          <div key={m.id} className="rounded-2xl bg-zinc-100/70 p-3">
            <MonitorImage
              monitor={m}
              sizes="(min-width: 1024px) 160px, (min-width: 640px) 25vw, 45vw"
              className="aspect-[4/3] w-full"
            />
          </div>
        ))}
        {/* Menta brillante con texto ink: ≥ 7,74:1 en todo el degradado (blanco sobre menta no llegaría a 3:1) */}
        <span
          aria-hidden
          className="absolute left-1/2 top-1/2 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-gradient-to-br from-teal-300 via-emerald-400 to-emerald-500 font-mono text-xs font-semibold tracking-wider text-ink shadow-glow ring-4 ring-white transition duration-300 ease-out-soft group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        >
          VS
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <Side monitor={a} edges={duelEdges(a, b)} />
        <Side monitor={b} edges={duelEdges(b, a)} align="end" />
      </div>

      <div className="mt-auto pt-4">
        <p className="border-t border-zinc-200 pt-4 text-xs text-zinc-600">{question}</p>
      </div>

      <Link
        href={compareHref(a.id, b.id)}
        aria-label={`Ver comparativa: ${fullName(a)} vs ${fullName(b)}`}
        className="absolute inset-0 rounded-3xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
      />
    </div>
  );
}

function Side({ monitor: m, edges, align = "start" }: { monitor: Monitor; edges: string[]; align?: "start" | "end" }) {
  const end = align === "end";
  return (
    <div className={cx("min-w-0", end && "text-right")}>
      <p className="text-xs text-zinc-600">{m.marca}</p>
      <p className="line-clamp-2 text-sm font-semibold tracking-tight text-ink">{m.modelo}</p>
      <p className="mt-1 font-mono text-xs tabular-nums text-zinc-600">{eur(m.precio_eur)}</p>
      <ul className={cx("mt-3 flex flex-wrap gap-1", end && "justify-end")} aria-label={`Ventajas del ${m.modelo}`}>
        {edges.length > 0 ? (
          edges.map((e) => (
            <li
              key={e}
              className="whitespace-nowrap rounded-full bg-emerald-50 px-2 py-0.5 font-mono text-xs font-medium tabular-nums text-emerald-800 ring-1 ring-inset ring-emerald-600/15"
            >
              {e}
            </li>
          ))
        ) : (
          <li className="py-0.5 text-xs text-zinc-600">Sin ventaja clave</li>
        )}
      </ul>
    </div>
  );
}
