import type { Metadata } from "next";
import Link from "next/link";
import { Briefcase, Gamepad2, Laptop, Wallet, type LucideIcon } from "lucide-react";
import { Duels } from "@/components/home/Duels";
import { HeroSearch } from "@/components/home/HeroSearch";
import { HeroStage } from "@/components/home/HeroStage";
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
    <HeroStage>
      <h1 className="text-5xl font-semibold tracking-tight text-ink sm:text-6xl lg:text-7xl">
        Encuentra el monitor <span className="text-gradient-brand-deep">exacto.</span>
      </h1>
      {/* zinc-700: en el peor caso (esferas + foco del cursor) da 7,36:1; zinc-600 bajaría a 5,45:1 */}
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
    </HeroStage>
  );
}
