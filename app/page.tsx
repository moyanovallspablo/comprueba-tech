import type { Metadata } from "next";
import Link from "next/link";
import { Briefcase, Gamepad2, Laptop, Wallet, type LucideIcon } from "lucide-react";
import { Duels } from "@/components/home/Duels";
import { HeroSearch } from "@/components/home/HeroSearch";
import { Highlights } from "@/components/home/Highlights";
import { TransparencyBanner } from "@/components/home/TransparencyBanner";
import { DEFAULT_FILTERS, QUICK_PRESETS, applyFilters, catalogHref } from "@/lib/catalog";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const PRESET_ICONS: Record<string, LucideIcon> = {
  mac: Laptop,
  gaming: Gamepad2,
  "oficina-4k": Briefcase,
  presupuesto: Wallet,
};

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-12 sm:px-6 sm:pt-20">
      <Hero />
      <Highlights />
      <Duels />
      <TransparencyBanner />
    </main>
  );
}

function Hero() {
  return (
    <section className="relative isolate mx-auto max-w-3xl px-1 text-center">
      <HeroAura />

      <h1 className="text-5xl font-semibold tracking-tight text-ink sm:text-6xl lg:text-7xl">
        Encuentra el monitor <span className="text-gradient-brand-deep">exacto.</span>
      </h1>
      {/* zinc-700: sobre el punto más intenso del aura, zinc-600 bajaría a 6,4:1 */}
      <p className="mx-auto mt-6 max-w-xl text-[15px] leading-relaxed text-zinc-700 sm:text-lg">
        Sin patrocinios. Evaluado con datos de especificaciones reales calculados por algoritmo.
      </p>

      <div className="mx-auto mt-10 max-w-2xl">
        <HeroSearch />
      </div>

      <ul aria-label="Accesos rápidos al catálogo" className="mt-6 flex flex-wrap justify-center gap-2">
        {QUICK_PRESETS.map((p) => {
          const Icon = PRESET_ICONS[p.id];
          const count = applyFilters({ ...DEFAULT_FILTERS, ...p.filters }).length;
          return (
            <li key={p.id}>
              <Link
                href={catalogHref(p)}
                className="inline-flex h-8 items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 text-sm font-medium text-ink shadow-sm shadow-emerald-950/5 transition hover:border-emerald-300 hover:text-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 motion-reduce:transition-none"
              >
                {Icon && <Icon className="size-3.5 text-emerald-600" aria-hidden />}
                {p.label}
                <span className="font-mono text-xs font-normal tabular-nums text-zinc-600">
                  {count}
                  <span className="sr-only"> monitores</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Aura de marca detrás del titular y el buscador: malla de puntos y dos esferas difuminadas que derivan despacio. */
function HeroAura() {
  return (
    <div aria-hidden className="pointer-events-none absolute -inset-x-24 -bottom-16 -top-24 -z-10">
      <div className="bg-dot-grid absolute inset-0" />
      <div className="absolute left-0 top-0 size-80 rounded-full bg-emerald-400/15 blur-3xl motion-safe:animate-aura sm:left-8 sm:size-112" />
      <div className="absolute bottom-0 right-0 size-80 rounded-full bg-teal-300/10 blur-3xl motion-safe:animate-aura motion-safe:[animation-delay:-9s] sm:right-8 sm:size-112" />
    </div>
  );
}
