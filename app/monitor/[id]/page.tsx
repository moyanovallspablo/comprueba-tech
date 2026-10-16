import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { TransparencyCard } from "@/components/site/RadicalTransparency";
import { SpatialDeltaPanel } from "@/components/3d/SpatialDeltaPanel";
import { eur } from "@/components/advisor/setup";
import { Card } from "@/components/advisor/ui";
import { MonitorIllustration } from "@/components/monitor/MonitorIllustration";
import {
  BuyButton,
  DailyFrictionGrid,
  PriceStatusBadge,
  SectionTitle,
  SpecTable,
} from "@/components/monitor/ProductParts";
import {
  InterpretationAndSacrifice,
  ProfileInsightsProvider,
  ProfileVerdict,
  RecommendedAlternatives,
} from "@/components/monitor/ProfileInsights";
import { getMonitor, monitors } from "@/data/monitors";
import { getPpi, getPriceStatus } from "@/lib/engine/calculator";

export function generateStaticParams() {
  return monitors.map((m) => ({ id: m.id }));
}

export async function generateMetadata({ params }: PageProps<"/monitor/[id]">): Promise<Metadata> {
  const m = getMonitor((await params).id);
  if (!m) return {};
  return {
    title: `${m.marca} ${m.modelo}`,
    description: `Ficha, fricción diaria, ventajas y sacrificios del ${m.marca} ${m.modelo} (${m.pulgadas}", ${m.hz} Hz, ${m.panel}).`,
  };
}

// La página es un shell síncrono (navegación instantánea); los params se leen dentro de <Suspense>.
export default function MonitorPage({ params }: PageProps<"/monitor/[id]">) {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-20 pt-8 sm:px-6 sm:pt-10">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-zinc-500 transition hover:text-ink">
        <ArrowLeft className="size-4" /> Volver a mi recomendación
      </Link>
      <Suspense fallback={<MonitorSkeleton />}>
        <MonitorContent params={params} />
      </Suspense>
    </main>
  );
}

function MonitorSkeleton() {
  return (
    <div className="mt-6 grid animate-pulse gap-6 lg:grid-cols-[1.15fr_1fr]" aria-hidden>
      <Card className="h-80" />
      <Card className="h-80" />
    </div>
  );
}

async function MonitorContent({ params }: { params: PageProps<"/monitor/[id]">["params"] }) {
  const { id } = await params;
  const m = getMonitor(id);
  if (!m) notFound();

  const priceStatus = getPriceStatus(m);
  const ppi = Math.round(getPpi(m));

  return (
    <>
      {/* ── Cabecera: imagen + precio ── */}
      <section className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        <Card className="flex flex-col justify-end bg-gradient-to-b from-white to-canvas p-6">
          {m.imagen ? (
            // eslint-disable-next-line @next/next/no-img-element -- imágenes de catálogo locales, sin optimizar todavía
            <img src={m.imagen} alt={`${m.marca} ${m.modelo}`} className="mx-auto max-h-72 object-contain" />
          ) : (
            <MonitorIllustration monitor={m} className="w-full" />
          )}
          <p className="mt-2 text-center font-mono text-[11px] text-zinc-500">
            Ilustración a escala real · {m.pulgadas.toLocaleString("es-ES")}&quot; · {m.ancho_cm.toLocaleString("es-ES")} cm de ancho
          </p>
        </Card>

        <Card className="flex flex-col p-6 sm:p-8">
          <div>
            <PriceStatusBadge status={priceStatus} />
          </div>
          <p className="mt-6 text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">{m.marca}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">{m.modelo}</h1>
          <p className="mt-3 font-mono text-sm text-zinc-500">
            {m.pulgadas.toLocaleString("es-ES")}&quot; · {m.resolucion.ancho}×{m.resolucion.alto} · {ppi} ppi · {m.hz} Hz ·{" "}
            {m.panel}
          </p>

          <div className="mt-8 flex flex-wrap items-end gap-x-4 gap-y-1">
            <span className="text-4xl font-semibold tracking-tight tabular-nums text-ink">{eur(m.precio_eur)}</span>
            <span className="pb-1 font-mono text-xs text-zinc-500">
              mín. {eur(m.precio_minimo_historico_eur)} · lanzamiento {eur(m.precio_lanzamiento_eur)}
            </span>
          </div>
          <p className="mt-2 text-sm text-zinc-500">{priceStatus.detail}</p>

          <div className="mt-auto pt-8">
            <BuyButton monitor={m} className="w-full sm:w-auto" />
            <a
              href="#transparencia"
              className="mt-2 inline-flex items-center gap-2 text-[11px] text-zinc-500 transition hover:text-brand-strong"
            >
              <ShieldCheck className="size-3.5 text-brand" />
              Enlace de afiliado · Transparencia Radical
            </a>
          </div>
        </Card>
      </section>

      <ProfileInsightsProvider monitorId={m.id}>
        <section className="mt-6">
          <ProfileVerdict />
        </section>

        <section className="mt-14">
          <SectionTitle
            eyebrow="Fricción diaria"
            title="Cómo es convivir con él"
            description="Lo que no sale en la ficha técnica: peana, puertos, menús y vuelta del reposo."
          />
          <DailyFrictionGrid friction={m.friccion_diaria} />
        </section>

        <section className="mt-6">
          <SpatialDeltaPanel variant="product" monitorId={m.id} />
        </section>

        <section className="mt-14">
          <SectionTitle eyebrow="Análisis" title="Lo que ganas y lo que cedes" />
          <InterpretationAndSacrifice />
        </section>

        <section className="mt-14">
          <SectionTitle eyebrow="Especificaciones" title="Ficha técnica completa" />
          <SpecTable monitor={m} />
          {m.notas && <p className="mt-4 px-1 text-sm text-zinc-500">{m.notas}</p>}
        </section>

        <section className="mt-14">
          <SectionTitle
            eyebrow="Alternativas"
            title="Monitores alternativos recomendados"
            description="Los mejor valorados por el algoritmo para el mismo uso."
          />
          <RecommendedAlternatives />
        </section>
      </ProfileInsightsProvider>

      <TransparencyCard className="mt-14" />

      <Card className="mt-6 flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center sm:p-8">
        <div>
          <p className="font-semibold text-ink">
            {m.marca} {m.modelo}
          </p>
          <p className="text-sm text-zinc-500">
            {eur(m.precio_eur)} · {priceStatus.label}
          </p>
        </div>
        <BuyButton monitor={m} />
      </Card>
    </>
  );
}
