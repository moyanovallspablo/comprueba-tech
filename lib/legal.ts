/**
 * Datos del titular y de las páginas legales, obligatorios por la LSSI-CE (art. 10) y el RGPD (art. 13).
 * Un valor que empiece por "[" es un hueco sin rellenar y se muestra resaltado en las páginas.
 */
export const LEGAL = {
  siteName: "comprueba.tech",
  domain: "comprueba.tech",
  owner: "Pablo Moyano Valls",
  taxId: "08371978R",
  address: "06600 Cabeza del Buey, Badajoz, España",
  email: "moyanovallspablo@gmail.com",
  /** Solo si el titular es una sociedad; si es persona física, déjalo en null. */
  registry: null as string | null,
  hosting: {
    name: "Vercel Inc.",
    address: "440 N Barranca Ave #4133, Covina, CA 91723, EE. UU.",
    web: "https://vercel.com",
  },
  /** Fecha de la última revisión de los textos legales (YYYY-MM-DD). */
  updated: "2026-10-18",
} as const;

export const isPending = (value: string) => value.startsWith("[");

/** Declaración obligatoria del Programa de Afiliados de Amazon (Acuerdo Operativo, amazon.es). */
export const AMAZON_DISCLOSURE =
  "Como Afiliado de Amazon, obtengo ingresos por las compras adscritas que cumplen los requisitos aplicables.";

/** Declaración de afiliación de PcComponentes, junto a la de Amazon en el pie y en las pautas editoriales. */
export const PCCOMPONENTES_DISCLOSURE =
  "También participamos en el programa de afiliados de PcComponentes: las compras en pccomponentes.com desde nuestros enlaces pueden generarnos una comisión.";

export interface FooterLink {
  href: string;
  label: string;
}

export const PROJECT_LINKS: FooterLink[] = [
  { href: "/sobre-nosotros", label: "Sobre nosotros" },
  { href: "/pautas-editoriales", label: "Pautas editoriales" },
];

export const LEGAL_LINKS: FooterLink[] = [
  { href: "/aviso-legal", label: "Aviso Legal y Marca" },
  { href: "/privacidad", label: "Política de Privacidad" },
  { href: "/terminos", label: "Términos de uso" },
  { href: "/cookies", label: "Política de Cookies" },
];

export function formatLegalDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  // Fecha fija en UTC: el prerender estático y el cliente producen el mismo texto.
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
