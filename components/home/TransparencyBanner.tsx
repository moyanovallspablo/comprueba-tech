import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { BrandPill, brandButtonBase, cx } from "@/components/advisor/ui";
import { TRANSPARENCY_TEXT } from "@/components/site/RadicalTransparency";
import { monitors } from "@/data/monitors";
import { SPEC_GROUPS } from "@/lib/specs";

const SPEC_COUNT = SPEC_GROUPS.reduce((n, g) => n + g.rows.length, 0);

const METRICS = [
  {
    value: String(monitors.length),
    unit: "",
    label: "monitores auditados parámetro a parámetro",
    detail: `${SPEC_COUNT} datos de fabricante por modelo, más su fricción en el uso diario.`,
  },
  {
    value: "0",
    unit: " %",
    label: "análisis patrocinados",
    detail: "Ninguna marca paga por aparecer en el catálogo ni por su puntuación.",
  },
  {
    value: "100",
    unit: " %",
    label: "algoritmo objetivo e independiente",
    detail: "Reglas públicas y deterministas: mismos datos, mismo veredicto.",
  },
];

/** Bloque previo al pie: métricas de transparencia y enlace a la metodología. */
export function TransparencyBanner() {
  return (
    <section className="mt-20 sm:mt-24" aria-labelledby="transparencia-home">
      <div className="rounded-3xl bg-white bg-[radial-gradient(60%_90%_at_0%_0%,var(--brand-glow),transparent_70%)] p-6 shadow-elevated ring-1 ring-inset ring-brand-border sm:p-12">
        <BrandPill>
          <ShieldCheck className="size-3.5" aria-hidden /> Transparencia radical
        </BrandPill>
        <h2 id="transparencia-home" className="mt-4 max-w-xl text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Datos que no se pueden comprar.
        </h2>

        <ul className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
          {METRICS.map((m) => (
            <li key={m.label} className="border-t border-hairline pt-6">
              <p className="text-5xl font-semibold tracking-tight tabular-nums text-ink sm:text-6xl">
                {m.value}
                {m.unit && <span className="text-brand">{m.unit}</span>}
              </p>
              <p className="mt-3 text-[15px] font-medium text-ink">{m.label}</p>
              <p className="mt-1 text-sm text-zinc-500">{m.detail}</p>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex flex-col gap-6 border-t border-hairline pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl text-xs leading-relaxed text-zinc-500">{TRANSPARENCY_TEXT}</p>
          <Link href="/pautas-editoriales" className={cx(brandButtonBase, "h-12 shrink-0 px-6 text-[15px]")}>
            Ver pautas editoriales <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
