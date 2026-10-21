import type { Monitor } from "@/types/monitor";

/**
 * Tag de afiliado de Amazon desde NEXT_PUBLIC_AMAZON_TAG. Next lo incrusta al compilar: cambiarlo exige volver
 * a hacer build. Si falta o no tiene un formato válido (p. ej. en local sin .env.local) se usa el de respaldo.
 */
const FALLBACK_AMAZON_TAG = "comprueba-21";
const AMAZON_TAG = sanitizeTag(process.env.NEXT_PUBLIC_AMAZON_TAG) ?? FALLBACK_AMAZON_TAG;

const AMAZON_ORIGIN = "https://www.amazon.es";

function sanitizeTag(raw: string | undefined): string | null {
  const tag = raw?.trim();
  return tag && /^[A-Za-z0-9-]{1,64}$/.test(tag) ? tag : null;
}

function isAmazonHost(hostname: string): boolean {
  return /(^|\.)amazon\.[a-z.]+$/.test(hostname) || hostname === "amzn.to";
}

/** Añade (o sustituye) el tag de afiliado en cualquier URL de Amazon; las de otras tiendas no se tocan. */
export function withAffiliateTag(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }
  if (!isAmazonHost(parsed.hostname)) return url;
  parsed.searchParams.set("tag", AMAZON_TAG);
  return parsed.toString();
}

/** Enlace de compra: override manual, ficha por ASIN o, en su defecto, búsqueda en amazon.es. Siempre con tag. */
export function getBuyUrl(m: Monitor): string {
  if (m.afiliado_url) return withAffiliateTag(m.afiliado_url);
  if (m.asin) return withAffiliateTag(`${AMAZON_ORIGIN}/dp/${m.asin}`);
  return withAffiliateTag(`${AMAZON_ORIGIN}/s?${new URLSearchParams({ k: `${m.marca} ${m.modelo}` })}`);
}

/**
 * Tag de afiliado de PcComponentes desde NEXT_PUBLIC_PCCOMPONENTES_TAG (también se incrusta al compilar).
 * Mientras no haya alta definitiva en el programa se usa el tag de desarrollo "demo".
 */
const FALLBACK_PCCOMPONENTES_TAG = "demo";
const PCCOMPONENTES_TAG = sanitizeTag(process.env.NEXT_PUBLIC_PCCOMPONENTES_TAG) ?? FALLBACK_PCCOMPONENTES_TAG;
/** Parámetro de la URL que lleva el tag; ajústalo si el programa de afiliados exige otro nombre. */
const PCCOMPONENTES_TAG_PARAM = "ref";

function isPcComponentesHost(hostname: string): boolean {
  return /(^|\.)pccomponentes\.com$/.test(hostname);
}

/** Añade (o sustituye) el tag de PcComponentes en URLs de pccomponentes.com; las de otras tiendas no se tocan. */
export function buildPcComponentesUrl(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }
  if (!isPcComponentesHost(parsed.hostname)) return url;
  parsed.searchParams.set(PCCOMPONENTES_TAG_PARAM, PCCOMPONENTES_TAG);
  return parsed.toString();
}

// ───────────────────────────── Ofertas multitienda ─────────────────────────────

export type Store = "amazon" | "pccomponentes";

export interface StoreOffer {
  store: Store;
  label: string;
  price: number;
  url: string;
}

/** Ofertas disponibles ordenadas de más barata a más cara. Amazon siempre está (precio_eur es su precio). */
export function getOffers(m: Monitor): StoreOffer[] {
  const offers: StoreOffer[] = [{ store: "amazon", label: "Amazon", price: m.precio_eur, url: getBuyUrl(m) }];
  if (m.pccomponentesUrl && m.pccomponentesPrecio != null) {
    offers.push({
      store: "pccomponentes",
      label: "PcComponentes",
      price: m.pccomponentesPrecio,
      url: buildPcComponentesUrl(m.pccomponentesUrl),
    });
  }
  return offers.sort((a, b) => a.price - b.price);
}

/** La oferta más barata, o null si hay empate (o una sola tienda): sin ganador claro no se destaca ninguna. */
export function getBestOffer(offers: StoreOffer[]): StoreOffer | null {
  if (offers.length < 2) return null;
  const [first, second] = offers;
  return first.price < second.price ? first : null;
}
