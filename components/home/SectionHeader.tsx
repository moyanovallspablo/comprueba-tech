import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cx } from "@/components/advisor/ui";

/*
 * Primitivas de la portada. Todo el texto cumple WCAG 2.2 AAA (7:1; 4,5:1 en texto grande), por eso aquí el
 * texto secundario es zinc-600 en lugar del zinc-500 (AA) del resto del sitio. Ratios en DESIGN.md §2.5.
 */

/** Eyebrow AAA: zinc-600 da ≥ 7,2:1 sobre canvas y sobre los tintes pastel de las tarjetas. */
export const homeEyebrow = "text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-600";

/** Base de tarjeta sin color de borde ni fondo (sin tailwind-merge, `Card` + otro borde chocarían). */
export const tile = "rounded-3xl border shadow-elevated";

/** CTA AAA: blanco sobre emerald-800 (7,68:1) y emerald-900 en hover (9,72:1). */
export const aaaButton = cx(
  "inline-flex items-center justify-center gap-2 rounded-full bg-emerald-800 font-medium text-white shadow-glow-sm",
  "transition duration-200 ease-out-soft hover:bg-emerald-900 hover:shadow-glow active:scale-[0.98] motion-reduce:transition-none",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700",
);

/** Etiquetas tintadas AAA: verde 900 sobre 100 (8,57:1) y ámbar 900 sobre 100 (8,15:1). */
export const tagEmerald = "bg-emerald-100 text-emerald-900 ring-1 ring-inset ring-emerald-600/20";
export const tagAmber = "bg-amber-100 text-amber-900 ring-1 ring-inset ring-amber-600/25";

/** Tarjeta enlazable: elevación al pasar el ratón, sin desplazamiento con movimiento reducido. */
export const liftOnHover =
  "transition duration-300 ease-out-soft hover:-translate-y-0.5 hover:shadow-float motion-reduce:transition-none motion-reduce:hover:translate-y-0";

/** Enlace que cubre toda la tarjeta (la tarjeta debe ser `relative`), con foco visible en el contorno. */
export const coverLink =
  "after:absolute after:inset-0 after:rounded-3xl after:content-[''] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-emerald-700 focus-visible:after:ring-offset-2";

/** Cabecera de sección de la portada: eyebrow + H2 y, opcionalmente, un enlace a la sección completa. */
export function SectionHeader({
  id,
  eyebrow,
  title,
  description,
  action,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 px-1 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className={homeEyebrow}>{eyebrow}</p>
        <h2 id={id} className="mt-2 text-xl font-semibold tracking-tight text-ink sm:text-2xl">
          {title}
        </h2>
        {description && <p className="mt-1 max-w-xl text-sm text-zinc-600">{description}</p>}
      </div>
      {action && (
        <Link
          href={action.href}
          className="group inline-flex shrink-0 items-center gap-1 text-sm font-medium text-ink transition hover:text-emerald-800 motion-reduce:transition-none"
        >
          {action.label}
          <ArrowRight className="size-4 transition group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0" />
        </Link>
      )}
    </div>
  );
}
