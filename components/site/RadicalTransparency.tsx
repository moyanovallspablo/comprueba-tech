import { Calculator, ShieldCheck, Tag } from "lucide-react";
import { cx } from "@/components/advisor/ui";

export const TRANSPARENCY_TEXT =
  "Si compras a través de nuestros enlaces, podemos recibir una comisión de afiliado. Esto jamás influye en las matemáticas del veredicto ni aumenta el precio que pagas.";

/** Versión compacta para el pie de página. */
export function TransparencyNote({ className }: { className?: string }) {
  return (
    <p className={cx("flex items-start gap-2 text-left text-xs leading-relaxed text-zinc-500", className)}>
      <ShieldCheck className="mt-px size-4 shrink-0 text-brand" />
      <span>
        <strong className="font-semibold text-ink">Transparencia Radical.</strong> {TRANSPARENCY_TEXT}
      </span>
    </p>
  );
}

/** Bloque destacado para la ficha de producto (ancla #transparencia). */
export function TransparencyCard({ className }: { className?: string }) {
  return (
    <section
      id="transparencia"
      className={cx(
        "scroll-mt-[calc(var(--header-h)+1rem)] rounded-3xl bg-white p-6 shadow-elevated ring-1 ring-inset ring-brand-border sm:p-8",
        "bg-[radial-gradient(70%_120%_at_0%_0%,var(--brand-glow),transparent_70%)]",
        className,
      )}
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-strong text-white shadow-glow-sm">
          <ShieldCheck className="size-5" />
        </span>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-strong">Transparencia Radical</p>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-zinc-700">{TRANSPARENCY_TEXT}</p>
          <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-zinc-500">
            <li className="flex items-center gap-2">
              <Calculator className="size-3.5 text-brand" />
              El motor de veredictos no recibe ningún dato de afiliación
            </li>
            <li className="flex items-center gap-2">
              <Tag className="size-3.5 text-brand" />
              Pagas el mismo precio que sin nuestro enlace
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
