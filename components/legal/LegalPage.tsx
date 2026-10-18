import type { ReactNode } from "react";
import { Card, Eyebrow, cx } from "@/components/advisor/ui";
import { formatLegalDate, isPending, LEGAL } from "@/lib/legal";

/**
 * Plantilla de las páginas de proyecto y legales: cabecera, fecha de revisión y secciones numeradas en una
 * columna de lectura cómoda (~70 caracteres por línea).
 */
export function LegalPage({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-20 pt-8 sm:px-6 sm:pt-12">
      <header className="px-1">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">{title}</h1>
        <div className="mt-4 max-w-2xl text-[15px] leading-relaxed text-zinc-500">{intro}</div>
        <p className="mt-4 font-mono text-xs text-zinc-500">
          Última revisión: <time dateTime={LEGAL.updated}>{formatLegalDate(LEGAL.updated)}</time>
        </p>
      </header>
      <Card className="mt-8 divide-y divide-hairline px-6 sm:px-8">{children}</Card>
    </main>
  );
}

const PROSE = cx(
  "text-[15px] leading-relaxed text-zinc-700",
  "[&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_ol]:mt-3 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5",
  "[&_strong]:font-semibold [&_strong]:text-ink [&_code]:font-mono [&_code]:text-[13px]",
  "[&_a]:font-medium [&_a]:text-brand-strong [&_a]:underline [&_a]:decoration-brand-border [&_a]:underline-offset-2 [&_a:hover]:decoration-brand-strong",
);

export function LegalSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-t`} className="scroll-mt-[calc(var(--header-h)+1rem)] py-8">
      <h2 id={`${id}-t`} className="text-lg font-semibold tracking-tight text-ink sm:text-xl">
        {title}
      </h2>
      <div className={PROSE}>{children}</div>
    </section>
  );
}

/** Dato del titular: si aún es un marcador "[…]" se resalta en ámbar (advertencia) para no publicarlo así. */
export function OwnerData({ value }: { value: string }) {
  if (!isPending(value)) return <>{value}</>;
  return (
    <mark className="rounded-md bg-amber-50 px-1 text-amber-800 ring-1 ring-inset ring-amber-600/20">{value}</mark>
  );
}

/** Tabla de datos clave/valor (titularidad, almacenamiento…), con scroll horizontal si no cabe. */
export function DataTable({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="mt-4 overflow-x-auto rounded-2xl border border-hairline">
      <table className="w-full min-w-[32rem] text-left text-sm">
        <thead className="bg-canvas/60 text-xs text-zinc-500">
          <tr>
            {head.map((h) => (
              <th key={h} scope="col" className="px-4 py-3 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-hairline align-top">
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j} className={cx("px-4 py-3", j === 0 ? "font-medium text-ink" : "text-zinc-700")}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
