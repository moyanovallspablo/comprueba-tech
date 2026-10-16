import { monitors as catalog } from "@/data/monitors";
import { matchesQuery } from "@/lib/search";
import type { Monitor } from "@/types/monitor";

/** Facetas del catálogo: cada monitor cae en exactamente una opción de cada faceta. */

export const RESOLUTION_OPTIONS = ["1080p", "1440p", "4K", "5K"] as const;
export type ResolutionClass = (typeof RESOLUTION_OPTIONS)[number];

export const REFRESH_OPTIONS = [
  { id: "60", label: "60 Hz" },
  { id: "120", label: "120 Hz" },
  { id: "144", label: "144 Hz+" },
] as const;
export type RefreshClass = (typeof REFRESH_OPTIONS)[number]["id"];

export const PANEL_OPTIONS = ["IPS", "OLED", "VA"] as const;
export type PanelClass = (typeof PANEL_OPTIONS)[number];

export const USBC_OPTIONS = [
  { id: "any", label: "Indiferente" },
  { id: "pd", label: "Con carga" },
  { id: "pd65", label: "≥ 65 W" },
] as const;
export type UsbcFilter = (typeof USBC_OPTIONS)[number]["id"];

export const resolutionClass = (m: Monitor): ResolutionClass => {
  const h = m.resolucion.alto;
  return h >= 2880 ? "5K" : h >= 2160 ? "4K" : h >= 1440 ? "1440p" : "1080p";
};

/** 60 Hz agrupa hasta 75 Hz; 120 Hz va de 100 a 143 Hz. */
export const refreshClass = (m: Monitor): RefreshClass => (m.hz >= 144 ? "144" : m.hz >= 100 ? "120" : "60");

export const panelClass = (m: Monitor): PanelClass =>
  m.panel === "QD-OLED" ? "OLED" : m.panel === "VA" ? "VA" : "IPS";

const usbcMatches = (m: Monitor, f: UsbcFilter) =>
  f === "any" ? true : f === "pd" ? m.usbC_PD_watts > 0 : m.usbC_PD_watts >= 65;

const prices = catalog.map((m) => m.precio_eur);
export const PRICE_BOUNDS = {
  min: Math.floor(Math.min(...prices) / 50) * 50,
  max: Math.ceil(Math.max(...prices) / 100) * 100,
};

export interface CatalogFilters {
  query: string;
  priceMin: number;
  priceMax: number;
  resolutions: ResolutionClass[];
  refresh: RefreshClass[];
  panels: PanelClass[];
  usbc: UsbcFilter;
}

export const DEFAULT_FILTERS: CatalogFilters = {
  query: "",
  priceMin: PRICE_BOUNDS.min,
  priceMax: PRICE_BOUNDS.max,
  resolutions: [],
  refresh: [],
  panels: [],
  usbc: "any",
};

type Facet = "price" | "resolutions" | "refresh" | "panels" | "usbc" | "query";

function passes(m: Monitor, f: CatalogFilters, skip?: Facet): boolean {
  return (
    (skip === "query" || !f.query || matchesQuery(m, f.query)) &&
    (skip === "price" || (m.precio_eur >= f.priceMin && m.precio_eur <= f.priceMax)) &&
    (skip === "resolutions" || f.resolutions.length === 0 || f.resolutions.includes(resolutionClass(m))) &&
    (skip === "refresh" || f.refresh.length === 0 || f.refresh.includes(refreshClass(m))) &&
    (skip === "panels" || f.panels.length === 0 || f.panels.includes(panelClass(m))) &&
    (skip === "usbc" || usbcMatches(m, f.usbc))
  );
}

export function applyFilters(f: CatalogFilters, list: Monitor[] = catalog): Monitor[] {
  return list.filter((m) => passes(m, f));
}

/**
 * Recuento por opción teniendo en cuenta el resto de filtros (no el de la propia faceta):
 * así cada chip dice cuántos resultados daría si lo activas.
 */
export function facetCounts(f: CatalogFilters, list: Monitor[] = catalog) {
  const count = <T extends string>(facet: Facet, classify: (m: Monitor) => T) => {
    const out: Partial<Record<T, number>> = {};
    for (const m of list) {
      if (!passes(m, f, facet)) continue;
      const k = classify(m);
      out[k] = (out[k] ?? 0) + 1;
    }
    return out;
  };
  const base = list.filter((m) => passes(m, f, "usbc"));
  return {
    resolutions: count("resolutions", resolutionClass),
    refresh: count("refresh", refreshClass),
    panels: count("panels", panelClass),
    usbc: {
      any: base.length,
      pd: base.filter((m) => usbcMatches(m, "pd")).length,
      pd65: base.filter((m) => usbcMatches(m, "pd65")).length,
    } satisfies Record<UsbcFilter, number>,
  };
}

/** Número de filtros activos (para el badge del botón "Filtros" en móvil). */
export function activeFilterCount(f: CatalogFilters): number {
  return (
    (f.priceMin > PRICE_BOUNDS.min || f.priceMax < PRICE_BOUNDS.max ? 1 : 0) +
    f.resolutions.length +
    f.refresh.length +
    f.panels.length +
    (f.usbc !== "any" ? 1 : 0)
  );
}

export type SortKey = "score" | "price-asc" | "price-desc";

export const SORT_OPTIONS: { id: SortKey; label: string }[] = [
  { id: "score", label: "Mejor puntuación para tu perfil" },
  { id: "price-asc", label: "Precio: menor a mayor" },
  { id: "price-desc", label: "Precio: mayor a menor" },
];
