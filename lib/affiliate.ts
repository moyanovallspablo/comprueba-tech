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
