import { monitors as catalog } from "@/data/monitors";
import type { Monitor } from "@/types/monitor";

/**
 * Búsqueda de texto sobre el catálogo: insensible a mayúsculas y tildes, y todas las palabras deben
 * aparecer (AND). Indexa marca, modelo y sinónimos técnicos ("qhd", "4k", "oled", "144hz", "usb-c"…).
 */

export function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

const RESOLUTION_SYNONYMS: Record<number, string> = {
  1080: "1080p full hd fhd",
  1440: "1440p qhd 2k wqhd",
  2160: "2160p 4k uhd",
  2880: "5k retina",
};

function buildHaystack(m: Monitor): string {
  const r = m.resolucion;
  const parts = [
    m.id,
    m.marca,
    m.modelo,
    m.panel,
    m.panel === "QD-OLED" ? "oled" : "",
    `${m.pulgadas}" ${m.pulgadas} pulgadas`,
    `${r.ancho}x${r.alto} ${r.ancho}×${r.alto}`,
    RESOLUTION_SYNONYMS[r.alto] ?? "",
    m.relacion_aspecto === "21:9" ? "ultrawide 21:9" : m.relacion_aspecto === "32:9" ? "super ultrawide 32:9" : "16:9",
    m.curvatura ? "curvo curved" : "plano",
    `${m.hz}hz ${m.hz} hz`,
    m.hz >= 144 ? "144hz 144 hz" : "", // quien busca "144hz" quiere "144 Hz o más"
    m.usbC ? `usb-c usbc ${m.usbC_PD_watts}w` : "",
    m.thunderbolt ? "thunderbolt" : "",
    m.kvm ? "kvm" : "",
  ];
  return normalize(parts.join(" "));
}

const haystacks = new Map<string, string>();
function haystackOf(m: Monitor) {
  let h = haystacks.get(m.id);
  if (!h) haystacks.set(m.id, (h = buildHaystack(m)));
  return h;
}

export function matchesQuery(m: Monitor, query: string): boolean {
  const tokens = normalize(query).split(/\s+/).filter(Boolean);
  const h = haystackOf(m);
  return tokens.every((t) => h.includes(t));
}

/** Monitores que contienen todas las palabras, priorizando coincidencias en marca y modelo. */
export function searchMonitors(query: string, list: Monitor[] = catalog): Monitor[] {
  const tokens = normalize(query).split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return list;
  return list
    .filter((m) => matchesQuery(m, query))
    .map((m) => {
      const name = normalize(`${m.marca} ${m.modelo}`);
      const score = tokens.reduce(
        (acc, t) => acc + (name.startsWith(t) || name.includes(` ${t}`) ? 3 : name.includes(t) ? 2 : 1),
        0,
      );
      return { m, score };
    })
    .sort((a, b) => b.score - a.score || a.m.precio_eur - b.m.precio_eur)
    .map((x) => x.m);
}

/**
 * "dell vs lg 27" → los dos monitores que mejor encajan con cada lado. Devuelve null si no hay
 * separador "vs" o alguno de los lados no encuentra monitor.
 */
export function parseVersusQuery(query: string): [Monitor, Monitor] | null {
  const sides = normalize(query).split(/\s+(?:vs\.?|versus|contra)\s+/);
  if (sides.length !== 2 || !sides[0] || !sides[1]) return null;
  const a = searchMonitors(sides[0])[0];
  const b = searchMonitors(sides[1]).find((m) => m.id !== a?.id);
  return a && b ? [a, b] : null;
}
