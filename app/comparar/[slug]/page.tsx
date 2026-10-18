import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { SpatialDeltaPanel } from "@/components/3d/SpatialDeltaPanel";
import { eur } from "@/components/advisor/setup";
import { Card, Eyebrow } from "@/components/advisor/ui";
import { AlgorithmVerdict, CompareSelector } from "@/components/compare/CompareClient";
import { CompareTable, countAdvantages } from "@/components/compare/CompareTable";
import { MonitorImage } from "@/components/monitor/MonitorImage";
import { BuyButton, PriceStatusBadge, SectionTitle } from "@/components/monitor/ProductParts";
import { JsonLd } from "@/components/seo/JsonLd";
import { getMonitor, monitors } from "@/data/monitors";
import { getPriceStatus } from "@/lib/engine/calculator";
import { SPATIAL_ANCHOR, compareHref, monitorHref, parseCompareSlug } from "@/lib/routes";
import {
  SEO_YEAR,
  canonicalCompareHref,
  compareDescription,
  compareFaq,
  compareTitle,
  faqJsonLd,
  fullName,
} from "@/lib/seo";
import type { Monitor } from "@/types/monitor";

/**
 * Todas las parejas del catálogo en los dos órdenes: cualquier enlace interno o del selector sirve HTML
 * estático. El canonical agrupa "a-vs-b" y "b-vs-a" en una sola URL indexable.
 */
export function generateStaticParams() {
  return monitors.flatMap((a) =>
    monitors.filter((b) => b.id !== a.id).map((b) => ({ slug: compareHref(a.id, b.id).replace("/comparar/", "") })),
  );
}

function resolvePair(slug: string): [Monitor, Monitor] | null {
  const parsed = parseCompareSlug(slug);
  if (!parsed) return null;
  const a = getMonitor(parsed[0]);
  const b = getMonitor(parsed[1]);
  return a && b ? [a, b] : null;
}

export async function generateMetadata({ params }: PageProps<"/comparar/[slug]">): Promise<Metadata> {
  const pair = resolvePair((await params).slug);
  if (!pair) return {};
  const [a, b] = pair;
  const title = compareTitle(a, b);
  const description = compareDescription(a, b);
  const canonical = canonicalCompareHref(a.id, b.id);
  return {
    // Sin la plantilla "· comprueba.tech": el título ya roza el límite que muestra Google.
    title: { absolute: title },
    description,
    alternates: { canonical },
    openGraph: { type: "website", siteName: "comprueba.tech", locale: "es_ES", url: canonical, title, description },
  };
}

// Shell síncrono para navegación instantánea; los params se resuelven dentro de <Suspense>.
export default function ComparePage({ params }: PageProps<"/comparar/[slug]">) {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-20 pt-8 sm:px-6 sm:pt-10">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-zinc-500 transition hover:text-ink">
        <ArrowLeft className="size-4" /> Volver a mi recomendación
      </Link>
      <Suspense fallback={<CompareSkeleton />}>
        <CompareContent params={params} />
      </Suspense>
    </main>
  );
}

function CompareSkeleton() {
  return (
    <div className="mt-6 animate-pulse space-y-6" aria-hidden>
      <div className="h-10 w-2/3 rounded-xl bg-black/[0.05]" />
      <Card className="h-16" />
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="h-80" />
        <Card className="h-80" />
      </div>
    </div>
  );
}

async function CompareContent({ params }: { params: PageProps<"/comparar/[slug]">["params"] }) {
  const pair = resolvePair((await params).slug);
  if (!pair) notFound();
  const [a, b] = pair;
  const advantages = countAdvantages(a, b);
  const faq = compareFaq(a, b);

  return (
    <>
      <JsonLd data={faqJsonLd(faq)} />

      <div className="mb-6 mt-6 px-1">
        <Eyebrow>Frente a frente</Eyebrow>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          {fullName(a)} <span className="text-zinc-500">vs</span> {fullName(b)}
          <span className="sr-only">: </span>
          <span className="mt-2 block text-base font-normal tracking-normal text-zinc-500 sm:text-lg">
            Comparativa y veredicto ({SEO_YEAR})
          </span>
        </h1>
      </div>

      <CompareSelector a={a.id} b={b.id} />

      {/* ── Los dos contendientes, ilustrados a la misma escala ── */}
      <section className="mt-6 grid gap-6 md:grid-cols-2">
        {[a, b].map((m, i) => (
          <Contender key={m.id} monitor={m} advantages={i === 0 ? advantages.a : advantages.b} />
        ))}
      </section>

      <section id={SPATIAL_ANCHOR} className="mt-6 scroll-mt-[calc(var(--header-h)+1rem)]">
        <SpatialDeltaPanel variant="compare" aId={a.id} bId={b.id} />
      </section>

      <section className="mt-6">
        <AlgorithmVerdict a={a.id} b={b.id} />
      </section>

      <section className="mt-14">
        <SectionTitle
          eyebrow="Especificaciones"
          title="Comparativa completa"
          description="En verde, la ventaja de cada uno en cada dato. Las filas sin color son informativas o empatan."
        />
        <CompareTable a={a} b={b} />
      </section>

      {/* Visible a propósito: Google solo acepta FAQPage si las respuestas están en la página. */}
      <section className="mt-14">
        <SectionTitle eyebrow="Preguntas frecuentes" title="Diferencias clave" />
        <Card className="divide-y divide-hairline">
          {faq.map((f) => (
            <div key={f.question} className="p-6">
              <h3 className="font-semibold text-ink">{f.question}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">{f.answer}</p>
            </div>
          ))}
        </Card>
      </section>
    </>
  );
}

function Contender({ monitor: m, advantages }: { monitor: Monitor; advantages: number }) {
  const status = getPriceStatus(m);
  return (
    <Card className="flex flex-col p-6">
      <div className="rounded-2xl bg-gradient-to-b from-white to-canvas px-2 pt-2">
        <MonitorImage monitor={m} priority="high" sizes="(min-width: 768px) 440px, 100vw" className="aspect-[3/2] w-full" />
      </div>
      <div className="mt-6 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-zinc-500">{m.marca}</p>
          <p className="truncate text-lg font-semibold tracking-tight text-ink">{m.modelo}</p>
        </div>
        <p className="shrink-0 text-xl font-semibold tabular-nums text-ink">{eur(m.precio_eur)}</p>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <PriceStatusBadge status={status} />
        <span className="rounded-full bg-emerald-50 px-3 py-1 font-mono text-xs text-emerald-700">
          {advantages} ventajas
        </span>
      </div>
      <div className="mt-auto flex flex-wrap items-center gap-3 pt-6">
        <BuyButton monitor={m} size="sm" />
        <Link href={monitorHref(m.id)} className="inline-flex items-center gap-1 text-xs font-medium text-ink hover:underline">
          Ver ficha completa <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </Card>
  );
}
