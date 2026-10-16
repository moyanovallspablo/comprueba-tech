import type { ComponentProps, ReactNode } from "react";
import type { Verdict } from "@/lib/engine/calculator";

export function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

/** Contenedor blanco elevado con borde ultra-sutil. */
export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cx("rounded-3xl border border-hairline bg-white shadow-elevated", className)}
      {...props}
    />
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cx("text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500", className)}>{children}</p>
  );
}

const VERDICT_STYLES: Record<Verdict, string> = {
  recomendado: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  con_oferta: "bg-amber-50 text-amber-800 ring-amber-600/20",
  descartado: "bg-rose-50 text-rose-700 ring-rose-600/15",
};

export function VerdictBadge({ verdict, label, size = "sm" }: { verdict: Verdict; label: string; size?: "sm" | "lg" }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full font-medium ring-1 ring-inset",
        size === "lg" ? "px-4 py-1.5 text-sm" : "px-3 py-0.5 text-xs",
        VERDICT_STYLES[verdict],
      )}
    >
      {label}
    </span>
  );
}

/**
 * Botón de acción principal de marca, reutilizable en <a> y <Link>. La base no fija tamaño
 * (no usamos tailwind-merge, así que padding y tipografía van aparte para no chocar).
 */
export const brandButtonBase = cx(
  "inline-flex items-center justify-center gap-2 rounded-full bg-brand-strong font-medium text-white",
  "shadow-glow-sm transition duration-200 ease-out-soft hover:bg-brand-deep hover:shadow-glow active:scale-[0.98]",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
);

export const BRAND_BUTTON_SIZES = {
  sm: "px-4 py-2 text-xs",
  md: "px-5 py-2.5 text-sm",
  lg: "px-5 py-3 text-sm",
} as const;

export const brandButtonClass = cx(brandButtonBase, BRAND_BUTTON_SIZES.md);

export function PrimaryButton({ className, ...props }: ComponentProps<"button">) {
  return (
    <button
      className={cx(
        brandButtonClass,
        "disabled:pointer-events-none disabled:opacity-30 disabled:shadow-none",
        className,
      )}
      {...props}
    />
  );
}

/** Marco de marca: borde con degradado esmeralda→menta y resplandor ambiental detrás. */
export function GlowFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx("relative isolate", className)}>
      <div aria-hidden className="bg-ambient-glow absolute -inset-8 -z-10 rounded-[3rem] blur-2xl" />
      <div className="border-gradient-brand rounded-3xl shadow-glow">{children}</div>
    </div>
  );
}

/** Pastilla de marca para etiquetas destacadas (p. ej. "Veredicto de confianza"). */
export function BrandPill({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-2 rounded-full bg-brand-glow px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-strong ring-1 ring-inset ring-brand-border",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function GhostButton({ className, ...props }: ComponentProps<"button">) {
  return (
    <button
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-zinc-500",
        "transition duration-200 ease-out-soft hover:bg-black/[0.04] hover:text-ink",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
        className,
      )}
      {...props}
    />
  );
}

/** Botón-opción seleccionable (chips y tarjetas del wizard). */
export function OptionButton({
  selected,
  className,
  ...props
}: ComponentProps<"button"> & { selected: boolean }) {
  return (
    <button
      aria-pressed={selected}
      className={cx(
        "rounded-2xl border text-left transition duration-200 ease-out-soft",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
        selected
          ? "border-brand bg-brand-glow text-ink shadow-glow"
          : "border-hairline bg-white hover:-translate-y-0.5 hover:border-brand-border hover:shadow-elevated",
        className,
      )}
      {...props}
    />
  );
}
