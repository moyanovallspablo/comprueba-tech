import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { cx } from "@/components/advisor/ui";
import { TRANSPARENCY_TEXT } from "@/components/site/RadicalTransparency";
import { monitors } from "@/data/monitors";
import { SPEC_GROUPS } from "@/lib/specs";
import { aaaButton, tagEmerald, tile } from "./SectionHeader";

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
      {/* Resplandor solo en la esquina del titular: el texto secundario queda sobre blanco (zinc-600, 7,73:1) */}
      <div
        className={cx(
          tile,
          "border-emerald-200/70 bg-white bg-[radial-gradient(40%_50%_at_0%_0%,var(--brand-glow),transparent_70%)] p-6 sm:p-12",
        )}
      >
        <span
          className={cx(
            "inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
            tagEmerald,
          )}
        >
          <ShieldCheck className="size-3.5" aria-hidden /> Transparencia radical
        </span>
        <h2 id="transparencia-home" className="mt-4 max-w-xl text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Datos que no se pueden comprar.
        </h2>

        <ul className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
          {METRICS.map((m) => (
            <li key={m.label} className="border-t border-zinc-200 pt-6">
              <p className="text-5xl font-semibold tracking-tight tabular-nums text-ink sm:text-6xl">
                {m.value}
                {/* Texto grande (≥ 48 px): emerald-700 da 5,48:1, por encima del 4,5:1 de AAA */}
                {m.unit && <span className="text-emerald-700">{m.unit}</span>}
              </p>
              <p className="mt-3 text-[15px] font-medium text-ink">{m.label}</p>
              <p className="mt-1 text-sm text-zinc-600">{m.detail}</p>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex flex-col gap-6 border-t border-zinc-200 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl text-xs leading-relaxed text-zinc-600">{TRANSPARENCY_TEXT}</p>
          <Link href="/pautas-editoriales" className={cx(aaaButton, "h-12 shrink-0 px-6 text-[15px]")}>
            Ver pautas editoriales <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
