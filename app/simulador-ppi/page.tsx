import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Card, Eyebrow } from "@/components/advisor/ui";
import { JsonLd } from "@/components/seo/JsonLd";
import { PpiCalculator, PpiCalculatorFromUrl } from "@/components/tools/PpiCalculator";
import {
  MAC_FRACTIONAL_ZONE,
  MAC_IDEAL_1X_PPI,
  MAC_IDEAL_2X_PPI,
  RETINA_PPD,
  SHARPNESS_TIERS,
} from "@/lib/ppi";
import { ADVISOR_HREF, PPI_SIMULATOR_HREF } from "@/lib/routes";
import { PPI_SIMULATOR_DESCRIPTION, PPI_SIMULATOR_TITLE, webApplicationJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: PPI_SIMULATOR_TITLE,
  description: PPI_SIMULATOR_DESCRIPTION,
  keywords: ["calculadora PPI", "densidad de píxeles", "nitidez monitor", "escalado macOS", "Retina", "distancia monitor"],
  alternates: { canonical: PPI_SIMULATOR_HREF },
  openGraph: { title: PPI_SIMULATOR_TITLE, description: PPI_SIMULATOR_DESCRIPTION, url: PPI_SIMULATOR_HREF, type: "website" },
};

const [fracMin, fracMax] = MAC_FRACTIONAL_ZONE;

/**
 * El HTML estático lleva el simulador con un 27" 1440p (fallback indexable); al hidratar se aplica `?monitor=`
 * si viene en la URL.
 */
export default function PpiSimulatorPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-20 pt-8 sm:px-6 sm:pt-12">
      <JsonLd
        data={webApplicationJsonLd({
          path: PPI_SIMULATOR_HREF,
          name: PPI_SIMULATOR_TITLE,
          description: PPI_SIMULATOR_DESCRIPTION,
        })}
      />

      <div className="mx-auto mb-8 max-w-2xl px-1 text-center">
        <Eyebrow>Herramienta</Eyebrow>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          Simulador de nitidez.
          <br />
          <span className="text-gradient-brand">PPI y escalado.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-zinc-500">
          Elige tamaño y resolución: te decimos cuánto se nota el píxel a tu distancia y qué escalado usar en Windows y
          macOS antes de comprar.
        </p>
      </div>

      <Suspense fallback={<PpiCalculator />}>
        <PpiCalculatorFromUrl />
      </Suspense>

      {/* Metodología visible: explica las cifras del simulador y da contexto indexable. */}
      <section className="mt-14 grid gap-6 md:grid-cols-2" aria-labelledby="metodologia">
        <h2 id="metodologia" className="sr-only">
          Cómo lo calculamos
        </h2>
        <Card className="p-6">
          <h3 className="font-semibold text-ink">Densidad (PPI)</h3>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">
            Diagonal en píxeles entre diagonal en pulgadas:{" "}
            <code className="rounded bg-canvas px-1.5 py-0.5 font-mono text-xs text-ink">√(ancho² + alto²) ÷ pulgadas</code>.
          </p>
          <ul className="mt-3 divide-y divide-hairline text-sm">
            {SHARPNESS_TIERS.map((t, i) => {
              const next = SHARPNESS_TIERS[i + 1];
              return (
                <li key={t.id} className="flex items-baseline justify-between gap-4 py-2">
                  <span className="font-medium text-ink">{t.label}</span>
                  <span className="shrink-0 font-mono text-xs text-zinc-500">
                    {next ? (t.min ? `${t.min}–${next.min} ppi` : `< ${next.min} ppi`) : `≥ ${t.min} ppi`}
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-ink">Nitidez percibida (1–10)</h3>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">
            Lo que decide si ves el píxel no son los ppi a secas, sino cuántos píxeles caben en cada grado de tu campo
            visual. Con vista normal el ojo separa detalles de un minuto de arco: a partir de {RETINA_PPD} píxeles por
            grado el píxel deja de distinguirse. La nota sale de esa cifra a tu distancia; la distancia recomendada es
            la que hace que la pantalla ocupe un campo visual cómodo según su tamaño y formato.
          </p>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-ink">macOS: escalado entero o fraccional</h3>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">
            macOS se diseña para dos densidades: ~{MAC_IDEAL_1X_PPI} ppi a tamaño natural (1×) y ~{MAC_IDEAL_2X_PPI} ppi
            en Retina (2×). Entre {fracMin} y {fracMax} ppi, como un 27&quot; 4K, a 2× la interfaz queda enorme y para
            un tamaño normal hay que usar un escalado no entero: el Mac dibuja a una resolución mayor y la reduce, con
            texto algo más blando y más trabajo para la gráfica.
          </p>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-ink">Windows: escalado fraccional sin drama</h3>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">
            Windows escala a 125 %, 150 % o 175 % redibujando la interfaz a la densidad real, con ClearType afinando
            el texto. Por eso un 4K de 27&quot; a 150 % se ve perfecto en Windows y no tanto en un Mac. Si dudas qué
            monitor encaja con tu equipo, el <Link href={ADVISOR_HREF} className="font-medium text-brand-strong hover:underline">asesor</Link>{" "}
            lo tiene en cuenta en su veredicto.
          </p>
        </Card>
      </section>
    </main>
  );
}
