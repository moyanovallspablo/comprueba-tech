import type { Monitor } from "@/types/monitor";

/**
 * Tag de afiliado de Amazon desde NEXT_PUBLIC_AMAZON_TAG (p. ej. "comprueba-21").
 * Next lo incrusta al compilar: cambiarlo exige volver a hacer build. Si falta o no tiene un formato
 * válido, los enlaces siguen funcionando pero sin comisión.
 */
const AMAZON_TAG = sanitizeTag(process.env.NEXT_PUBLIC_AMAZON_TAG);

function sanitizeTag(raw: string | undefined): string | null {
  const tag = raw?.trim();
  return tag && /^[A-Za-z0-9-]{1,64}$/.test(tag) ? tag : null;
}

export function getBuyUrl(m: Monitor): string {
  if (m.afiliado_url) return m.afiliado_url;
  const params = new URLSearchParams({ k: `${m.marca} ${m.modelo}` });
  if (AMAZON_TAG) params.set("tag", AMAZON_TAG);
  return `https://www.amazon.es/s?${params}`;
}
