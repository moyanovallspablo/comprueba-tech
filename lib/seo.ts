import { DATA_SNAPSHOT, monitors } from "@/data/monitors";
import { getPpi } from "@/lib/engine/calculator";
import { LEGAL } from "@/lib/legal";
import { compareHref, monitorHref } from "@/lib/routes";
import type { Monitor, PanelType } from "@/types/monitor";

/** URL de producción: base de canonical, Open Graph y datos estructurados (también en local y en previews). */
export const SITE_URL = `https://${LEGAL.domain}`;

export const absoluteUrl = (path: string) => new URL(path, SITE_URL).toString();

export const fullName = (m: Monitor) => `${m.marca} ${m.modelo}`;

/** Año y mes de los precios del catálogo: fechan títulos y respuestas sin depender del reloj del build. */
const [SNAPSHOT_YEAR, SNAPSHOT_MONTH] = DATA_SNAPSHOT.split("-").map(Number);
export const SEO_YEAR = String(SNAPSHOT_YEAR);
const SNAPSHOT_LABEL = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric", timeZone: "UTC" }).format(
  new Date(Date.UTC(SNAPSHOT_YEAR, SNAPSHOT_MONTH - 1)),
);

const num = (n: number) => n.toLocaleString("es-ES");
const eur = (n: number) => `${num(n)} €`;

/* ── Comparativas ── */

const CATALOG_INDEX = new Map(monitors.map((m, i) => [m.id, i]));

/**
 * "a-vs-b" y "b-vs-a" muestran lo mismo: el canonical de ambas es el orden del catálogo, para que Google
 * indexe una sola URL por pareja.
 */
export function canonicalCompareHref(a: string, b: string): string {
  return (CATALOG_INDEX.get(a) ?? 0) <= (CATALOG_INDEX.get(b) ?? 0) ? compareHref(a, b) : compareHref(b, a);
}

/** Una URL canónica por pareja (orden del catálogo): lo que se declara en el sitemap. */
export function canonicalCompareHrefs(): string[] {
  return monitors.flatMap((a, i) => monitors.slice(i + 1).map((b) => compareHref(a.id, b.id)));
}

export const compareTitle =(a: Monitor, b: Monitor) =>
  `${fullName(a)} vs ${fullName(b)}: Comparativa y Veredicto (${SEO_YEAR})`;

export function compareDescription(a: Monitor, b: Monitor): string {
  return (
    `${fullName(a)} (${eur(a.precio_eur)}, ${a.hz} Hz, ${a.panel}) frente a ${fullName(b)} ` +
    `(${eur(b.precio_eur)}, ${b.hz} Hz, ${b.panel}): diferencias clave, ventajas de cada uno y cuál te conviene según tu uso.`
  );
}

export interface FaqItem {
  question: string;
  answer: string;
}

const PANEL_NOTES: Record<PanelType, string> = {
  IPS: "colores fieles y buenos ángulos de visión",
  "IPS Black": "un IPS con el doble de contraste que uno convencional, negros más profundos",
  "Fast IPS": "un IPS de respuesta rápida pensado para juegos",
  VA: "más contraste que un IPS a cambio de peores ángulos y algo de estela en escenas oscuras",
  "QD-OLED": "negros perfectos y respuesta casi instantánea, con cierto riesgo de quemado a largo plazo",
};

const syncLabel = (m: Monitor) => (m.adaptive_sync === "Ninguno" ? "sin sincronización adaptativa" : m.adaptive_sync);

function priceFaq(a: Monitor, b: Monitor): FaqItem {
  const [cheap, pricey] = a.precio_eur <= b.precio_eur ? [a, b] : [b, a];
  const diff = pricey.precio_eur - cheap.precio_eur;
  const answer =
    diff === 0
      ? `Cuestan lo mismo: ${eur(a.precio_eur)} cada uno.`
      : `El ${cheap.modelo} cuesta ${eur(cheap.precio_eur)} y el ${pricey.modelo}, ${eur(pricey.precio_eur)}: ` +
        `${eur(diff)} menos (un ${Math.round((diff / pricey.precio_eur) * 100)} % más barato).`;
  return {
    question: `¿Cuál es más barato, el ${a.modelo} o el ${b.modelo}?`,
    answer: `${answer} Precios orientativos en Amazon.es revisados en ${SNAPSHOT_LABEL}.`,
  };
}

function refreshFaq(a: Monitor, b: Monitor): FaqItem {
  const [fast, slow] = a.hz >= b.hz ? [a, b] : [b, a];
  const lead =
    a.hz === b.hz
      ? `Los dos funcionan a ${a.hz} Hz, así que en fluidez empatan.`
      : `El ${fast.modelo} llega a ${fast.hz} Hz frente a los ${slow.hz} Hz del ${slow.modelo}.`;
  const context =
    slow.hz >= 144
      ? "Ambos superan los 144 Hz: los dos sirven para jugar con fluidez y la diferencia solo se aprecia en juego competitivo."
      : fast.hz >= 144
        ? "Por encima de 144 Hz se nota en juegos rápidos; para ofimática y vídeo, 60–75 Hz son suficientes."
        : "Ninguno llega a 144 Hz: son monitores para trabajo y contenido, no para juego competitivo.";
  const sync =
    a.adaptive_sync === b.adaptive_sync
      ? ""
      : ` Sincronización adaptativa: ${a.modelo}, ${syncLabel(a)}; ${b.modelo}, ${syncLabel(b)}.`;
  return {
    question: `¿Qué monitor tiene mayor tasa de refresco, el ${a.modelo} o el ${b.modelo}?`,
    answer: `${lead} ${context}${sync}`,
  };
}

function panelFaq(a: Monitor, b: Monitor): FaqItem {
  const panels =
    a.panel === b.panel
      ? `Los dos usan panel ${a.panel}: ${PANEL_NOTES[a.panel]}.`
      : `El ${a.modelo} usa un panel ${a.panel} (${PANEL_NOTES[a.panel]}) y el ${b.modelo}, un ${b.panel} (${PANEL_NOTES[b.panel]}).`;
  const screen = (m: Monitor) =>
    `${num(m.pulgadas)}" a ${m.resolucion.ancho}×${m.resolucion.alto} (${Math.round(getPpi(m))} ppi)`;
  const sizes =
    screen(a) === screen(b)
      ? `Comparten tamaño y nitidez: ${screen(a)}.`
      : `En tamaño y nitidez: ${screen(a)} frente a ${screen(b)}.`;
  return {
    question: `¿Qué diferencia hay entre el panel del ${a.modelo} y el del ${b.modelo}?`,
    answer: `${panels} ${sizes}`,
  };
}

/** Preguntas frecuentes de una comparativa: se muestran en la página y alimentan el JSON-LD FAQPage. */
export function compareFaq(a: Monitor, b: Monitor): FaqItem[] {
  return [priceFaq(a, b), refreshFaq(a, b), panelFaq(a, b)];
}

export function faqJsonLd(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

/* ── Fichas de monitor ── */

export function monitorDescription(m: Monitor): string {
  return `Ficha, fricción diaria, ventajas y sacrificios del ${fullName(m)} (${num(m.pulgadas)}", ${m.hz} Hz, ${m.panel}).`;
}

export function productJsonLd(m: Monitor) {
  const url = absoluteUrl(monitorHref(m.id));
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: fullName(m),
    brand: { "@type": "Brand", name: m.marca },
    model: m.modelo,
    category: "Monitores",
    description: monitorDescription(m),
    // Sin foto real no se declara imagen: la ilustración a escala se dibuja en el cliente.
    ...(m.imageUrl && { image: absoluteUrl(m.imageUrl) }),
    url,
    offers: {
      "@type": "Offer",
      url,
      price: m.precio_eur,
      priceCurrency: "EUR",
      availability: `https://schema.org/${m.disponible === false ? "OutOfStock" : "InStock"}`,
      itemCondition: "https://schema.org/NewCondition",
    },
  };
}

/* ── Herramientas ── */

export const PPI_SIMULATOR_TITLE = "Simulador de PPI y nitidez de monitores";
export const PPI_SIMULATOR_DESCRIPTION =
  "Calcula los PPI de cualquier monitor, su nota de nitidez a tu distancia y el escalado ideal en Windows y macOS (Retina 2× o fraccional), con vista previa del texto.";

export function webApplicationJsonLd({ path, name, description }: { path: string; name: string; description: string }) {
  const url = absoluteUrl(path);
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": `${url}#app`,
    name,
    description,
    url,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Cualquiera (navegador web)",
    browserRequirements: "Requiere JavaScript y Canvas",
    inLanguage: "es-ES",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: 0, priceCurrency: "EUR" },
    publisher: { "@type": "Organization", name: LEGAL.siteName, url: SITE_URL },
  };
}
