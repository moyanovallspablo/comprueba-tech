import type { MetadataRoute } from "next";
import { DATA_SNAPSHOT, monitors } from "@/data/monitors";
import { LEGAL } from "@/lib/legal";
import { ADVISOR_HREF, monitorHref } from "@/lib/routes";
import { SITE_URL, canonicalCompareHrefs } from "@/lib/seo";

const baseUrl = SITE_URL;

const LEGAL_PATHS = ["/aviso-legal", "/privacidad", "/terminos", "/cookies", "/sobre-nosotros", "/pautas-editoriales"];

/**
 * Se genera en el build. Catálogo y comparativas se fechan con el snapshot de precios (`DATA_SNAPSHOT`, YYYY-MM,
 * formato W3C válido para <lastmod>); las páginas legales, con su última revisión. Solo URLs canónicas: las
 * comparativas "b-vs-a" quedan fuera.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const catalog = (path: string, priority: number): MetadataRoute.Sitemap[number] => ({
    url: `${baseUrl}${path}`,
    lastModified: DATA_SNAPSHOT,
    changeFrequency: "weekly",
    priority,
  });

  return [
    catalog("/", 1),
    catalog(ADVISOR_HREF, 0.8),
    catalog("/monitores", 0.8),
    catalog("/comparar", 0.8),
    ...monitors.map((m) => catalog(monitorHref(m.id), 0.9)),
    ...canonicalCompareHrefs().map((href) => catalog(href, 0.9)),
    ...LEGAL_PATHS.map((path) => ({
      url: `${baseUrl}${path}`,
      lastModified: LEGAL.updated,
      changeFrequency: "monthly" as const,
      priority: 0.3,
    })),
  ];
}
