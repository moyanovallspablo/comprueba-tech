import type { Metadata } from "next";
import Link from "next/link";
import { PROFILE_OPTIONS, eur } from "@/components/advisor/setup";
import { DataTable, LegalPage, LegalSection, OwnerData } from "@/components/legal/LegalPage";
import { DATA_SNAPSHOT } from "@/data/monitors";
import {
  BUDGET_TOLERANCE,
  HIGH_BUDGET,
  PROFILE_WEIGHTS,
  SCORE_MIN,
  SCORE_RECOMMENDED,
  VERDICT_LABELS,
  type Criterion,
} from "@/lib/engine/calculator";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Pautas editoriales",
  description:
    "Metodología de comprueba.tech: criterios y pesos del motor de puntuación, reglas de veredicto, independencia editorial y cómo funcionan los enlaces de afiliación.",
};

const CRITERIA: { id: Criterion; label: string; measures: string }[] = [
  { id: "imagen", label: "Imagen", measures: "Densidad de píxeles, tipo de panel y contraste, cobertura de color, HDR real y calibración." },
  { id: "fluidez", label: "Fluidez", measures: "Frecuencia de refresco, tiempo de respuesta, sincronización adaptativa y si tu gráfica puede aprovecharla." },
  { id: "conectividad", label: "Conectividad", measures: "USB-C con carga, Thunderbolt, KVM, hub USB, Ethernet y encadenado." },
  { id: "ergonomia", label: "Ergonomía", measures: "Ajuste en altura, giro, pivote, VESA y fondo que ocupa en tu mesa." },
  { id: "valor", label: "Calidad-precio", measures: "Precio actual frente a lo que ofrece y frente a su histórico." },
  { id: "madurez", label: "Madurez", measures: "Tiempo en el mercado: firmware asentado, problemas conocidos y precio estabilizado." },
];

const pct = (w: number) => `${Math.round(w * 100)} %`;

export default function EditorialPage() {
  return (
    <LegalPage
      eyebrow="Proyecto"
      title="Pautas editoriales"
      intro={
        <p>
          Cómo decidimos qué recomendar, qué datos usamos y cómo nos financiamos. Si algo de lo que publicamos no cumple
          estas pautas, queremos saberlo.
        </p>
      }
    >
      <LegalSection id="datos" title="1. De dónde salen los datos">
        <ul>
          <li>
            <strong>Especificaciones:</strong> fichas oficiales de cada fabricante. Cuando una cifra se declara de forma
            optimista (por ejemplo, tiempos de respuesta «GtG» del fabricante), la usamos como referencia y el motor no
            le da más peso del que merece.
          </li>
          <li>
            <strong>Precios:</strong> orientativos del mercado español con fecha de corte {DATA_SNAPSHOT}, junto con el
            mínimo histórico y el precio de lanzamiento. No son precios en tiempo real: el que vale es el de la tienda en
            el momento de comprar.
          </li>
          <li>
            <strong>Fricción diaria:</strong> valoraciones editoriales sobre la peana, el acceso a los puertos, el menú
            OSD y la vuelta del reposo. Son la única parte subjetiva del análisis y se muestran separadas de la
            puntuación, señaladas como tales.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="criterios" title="2. Criterios y pesos del motor">
        <p>
          Cada monitor recibe una nota de 0 a 100 en seis criterios. La nota final es su media ponderada según el uso
          que elijas, más ajustes explícitos (por ejemplo, un bonus por densidad Retina en Mac o una penalización si no
          cabe en tu mesa). Estos son los pesos que aplica el motor:
        </p>
        <DataTable
          head={["Criterio", ...PROFILE_OPTIONS.map((p) => p.label), "Qué mide"]}
          rows={CRITERIA.map((c) => [
            c.label,
            ...PROFILE_OPTIONS.map((p) => <span key={p.id} className="font-mono tabular-nums">{pct(PROFILE_WEIGHTS[p.id][c.id])}</span>),
            c.measures,
          ])}
        />
        <p>
          Con presupuestos por encima de {eur(HIGH_BUDGET)}, parte del peso de calidad-precio pasa a imagen y
          ergonomía: a ese nivel, quien compra prioriza construcción y calidad sobre ahorro.
        </p>
      </LegalSection>

      <LegalSection id="veredictos" title="3. Cómo se decide el veredicto">
        <ul>
          <li>
            <strong>{VERDICT_LABELS.recomendado}:</strong> nota de {SCORE_RECOMMENDED}/100 o más y precio dentro de tu
            presupuesto.
          </li>
          <li>
            <strong>{VERDICT_LABELS.con_oferta}:</strong> encaja, pero se pasa de presupuesto (hasta un{" "}
            {Math.round((BUDGET_TOLERANCE - 1) * 100)} % por encima) o su nota es justa para lo que cuesta. Te indicamos
            el precio al que pasaría a ser buena compra y si alguna vez ha estado a ese precio.
          </li>
          <li>
            <strong>{VERDICT_LABELS.descartado}:</strong> nota inferior a {SCORE_MIN}/100, más de un{" "}
            {Math.round((BUDGET_TOLERANCE - 1) * 100)} % por encima del presupuesto, no cabe en tu mesa, no mejora tu
            monitor actual o no cumple un mínimo del perfil (por ejemplo, menos de 100 Hz para gaming). Siempre
            explicamos el motivo.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="independencia" title="4. Independencia editorial">
        <ul>
          <li>Ninguna marca ni tienda puede pagar por aparecer, por subir posiciones o por cambiar un veredicto.</li>
          <li>
            El motor de puntuación no recibe ningún dato sobre comisiones: un monitor sin enlace de afiliación compite en
            igualdad de condiciones.
          </li>
          <li>
            Los cambios en criterios o pesos se aplican a todo el catálogo a la vez y se reflejan en esta página, nunca a
            un modelo concreto.
          </li>
          <li>
            Si un fabricante nos cede un producto, lo indicaremos en su ficha. La cesión no implica ninguna condición
            sobre el resultado.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="afiliacion" title="5. Cómo funcionan los enlaces de afiliación">
        <p>
          Los botones «Cómpralo hoy» llevan a Amazon con un identificador de afiliado de comprueba.tech. Si compras
          tras pulsarlo, Amazon nos paga una pequeña comisión sobre la venta. Así funciona, paso a paso:
        </p>
        <ol>
          <li>Al pulsar el botón, Amazon registra en su propio sitio que llegaste desde nuestro enlace.</li>
          <li>
            <strong>Pagas exactamente el mismo precio</strong> que si entraras directamente: la comisión sale del margen
            de Amazon, no de tu bolsillo.
          </li>
          <li>
            No recibimos tus datos personales ni sabemos quién compra: Amazon solo nos facilita informes de ventas
            agregados.
          </li>
          <li>
            Los enlaces de afiliación están marcados técnicamente como patrocinados (<code>rel=&quot;sponsored&quot;</code>)
            y, en cada ficha, señalados como tales.
          </li>
        </ol>
        <p>
          Como Afiliado de Amazon, obtengo ingresos por las compras adscritas que cumplen los requisitos aplicables.
        </p>
      </LegalSection>

      <LegalSection id="correcciones" title="6. Errores y correcciones">
        <p>
          Si detectas un dato erróneo o desactualizado, escríbenos a <OwnerData value={LEGAL.email} />. Corregimos los
          errores en cuanto los verificamos y, si un cambio altera un veredicto publicado, lo recalcula el propio motor
          para todo el catálogo. Más detalles sobre el uso del sitio en los <Link href="/terminos">términos de uso</Link>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
