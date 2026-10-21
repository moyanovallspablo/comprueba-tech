import Link from "next/link";
import { BrandMark, Wordmark } from "@/components/site/BrandMark";
import { TransparencyNote } from "@/components/site/RadicalTransparency";
import { DATA_SNAPSHOT } from "@/data/monitors";
import { AMAZON_DISCLOSURE, LEGAL, PCCOMPONENTES_DISCLOSURE, LEGAL_LINKS, PROJECT_LINKS, type FooterLink } from "@/lib/legal";
import { NAV_ITEMS } from "./nav";

const SNAPSHOT_LABEL = new Date(`${DATA_SNAPSHOT}-01T00:00:00Z`).toLocaleDateString("es-ES", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function Footer() {
  return (
    <footer className="border-t border-hairline bg-white/60">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-12 sm:px-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <BrandMark size={22} />
            <Wordmark className="text-sm font-semibold tracking-tight" />
          </div>
          <nav aria-label="Secciones">
            <ul className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-zinc-500">
              {NAV_ITEMS.map((n) => (
                <li key={n.href}>
                  <Link href={n.href} className="transition hover:text-brand-strong">
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <TransparencyNote className="max-w-md" />
        </div>

        <FooterColumn title="Proyecto" links={PROJECT_LINKS} />
        <FooterColumn title="Legal" links={LEGAL_LINKS} />
      </div>

      <div className="border-t border-hairline">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-zinc-500 sm:px-6 md:flex-row md:items-center md:justify-between md:gap-6">
          <div className="space-y-1 text-zinc-600">
            <p>{AMAZON_DISCLOSURE}</p>
            <p>{PCCOMPONENTES_DISCLOSURE}</p>
          </div>
          <p className="shrink-0">
            © {LEGAL.updated.slice(0, 4)} {LEGAL.siteName} · Precios orientativos en España · Datos de {SNAPSHOT_LABEL}
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
  const id = `footer-${title.toLowerCase()}`;
  return (
    <nav aria-labelledby={id}>
      <p id={id} className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">
        {title}
      </p>
      <ul className="mt-4 space-y-3 text-sm">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-zinc-700 transition hover:text-brand-strong">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
