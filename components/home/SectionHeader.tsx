import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Eyebrow } from "@/components/advisor/ui";

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
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 id={id} className="mt-2 text-xl font-semibold tracking-tight text-ink sm:text-2xl">
          {title}
        </h2>
        {description && <p className="mt-1 max-w-xl text-sm text-zinc-500">{description}</p>}
      </div>
      {action && (
        <Link
          href={action.href}
          className="group inline-flex shrink-0 items-center gap-1 text-sm font-medium text-ink transition hover:text-brand-strong"
        >
          {action.label}
          <ArrowRight className="size-4 transition group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0" />
        </Link>
      )}
    </div>
  );
}

/** Tarjeta enlazable: elevación al pasar el ratón, sin desplazamiento con movimiento reducido. */
export const liftOnHover =
  "transition duration-300 ease-out-soft hover:-translate-y-0.5 hover:shadow-float motion-reduce:transition-none motion-reduce:hover:translate-y-0";

/** Enlace que cubre toda la tarjeta (la tarjeta debe ser `relative`), con foco visible en el contorno. */
export const coverLink =
  "after:absolute after:inset-0 after:rounded-3xl after:content-[''] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-brand focus-visible:after:ring-offset-2";
