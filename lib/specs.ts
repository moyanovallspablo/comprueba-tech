import { getPpi } from "@/lib/engine/calculator";
import type { AdaptiveSync, HdrLevel, Monitor } from "@/types/monitor";

/**
 * Especificaciones clasificadas, compartidas por la ficha de producto y el comparador.
 * `score` devuelve un número comparable (mayor = mejor tras aplicar `better`); sin `score` la fila es informativa.
 */

export interface SpecRow {
  key: string;
  label: string;
  format: (m: Monitor) => string;
  score?: (m: Monitor) => number;
  better?: "higher" | "lower";
}

export interface SpecGroup {
  id: string;
  label: string;
  rows: SpecRow[];
}

const yesNo = (v: boolean) => (v ? "Sí" : "No");
const num = (n: number) => n.toLocaleString("es-ES");
const eur = (n: number) => `${num(n)} €`;

const HDR_RANK: Record<HdrLevel, number> = {
  Ninguno: 0,
  HDR10: 1,
  "DisplayHDR 400": 2,
  "DisplayHDR True Black 400": 3,
};

const VRR_RANK: Record<AdaptiveSync, number> = {
  Ninguno: 0,
  FreeSync: 1,
  "FreeSync Premium": 2,
  "G-Sync Compatible": 2,
  "FreeSync Premium Pro": 3,
};

const bool = (key: string, label: string, get: (m: Monitor) => boolean): SpecRow => ({
  key,
  label,
  format: (m) => yesNo(get(m)),
  score: (m) => (get(m) ? 1 : 0),
  better: "higher",
});

export const SPEC_GROUPS: SpecGroup[] = [
  {
    id: "precio",
    label: "Precio",
    rows: [
      { key: "precio", label: "Precio actual", format: (m) => eur(m.precio_eur), score: (m) => m.precio_eur, better: "lower" },
      {
        key: "minimo",
        label: "Mínimo histórico",
        format: (m) => eur(m.precio_minimo_historico_eur),
        score: (m) => m.precio_minimo_historico_eur,
        better: "lower",
      },
      { key: "lanzamiento", label: "Precio de lanzamiento", format: (m) => eur(m.precio_lanzamiento_eur) },
      { key: "meses", label: "En el mercado", format: (m) => `${m.meses_mercado} meses` },
    ],
  },
  {
    id: "pantalla",
    label: "Pantalla",
    rows: [
      { key: "pulgadas", label: "Tamaño", format: (m) => `${num(m.pulgadas)}"` },
      {
        key: "resolucion",
        label: "Resolución",
        format: (m) => `${m.resolucion.ancho}×${m.resolucion.alto}`,
        score: (m) => m.resolucion.ancho * m.resolucion.alto,
        better: "higher",
      },
      { key: "ppi", label: "Densidad", format: (m) => `${Math.round(getPpi(m))} ppi`, score: (m) => Math.round(getPpi(m)), better: "higher" },
      { key: "formato", label: "Formato", format: (m) => m.relacion_aspecto },
      { key: "curvatura", label: "Curvatura", format: (m) => (m.curvatura ? `${m.curvatura}R` : "Plano") },
      { key: "panel", label: "Panel", format: (m) => m.panel },
      { key: "brillo", label: "Brillo SDR", format: (m) => `${m.brillo_nits} nits`, score: (m) => m.brillo_nits, better: "higher" },
      { key: "hdr", label: "HDR", format: (m) => m.hdr, score: (m) => HDR_RANK[m.hdr], better: "higher" },
      { key: "srgb", label: "Cobertura sRGB", format: (m) => `${m.cobertura_srgb}%`, score: (m) => m.cobertura_srgb, better: "higher" },
      { key: "p3", label: "Cobertura DCI-P3", format: (m) => `${m.cobertura_dci_p3}%`, score: (m) => m.cobertura_dci_p3, better: "higher" },
      bool("calibrado", "Calibrado de fábrica", (m) => m.calibrado_fabrica),
    ],
  },
  {
    id: "fluidez",
    label: "Fluidez",
    rows: [
      { key: "hz", label: "Frecuencia", format: (m) => `${m.hz} Hz`, score: (m) => m.hz, better: "higher" },
      {
        key: "respuesta",
        label: "Tiempo de respuesta",
        format: (m) => `${num(m.tiempo_respuesta_ms)} ms`,
        score: (m) => m.tiempo_respuesta_ms,
        better: "lower",
      },
      { key: "vrr", label: "Sincronización adaptativa", format: (m) => m.adaptive_sync, score: (m) => VRR_RANK[m.adaptive_sync], better: "higher" },
    ],
  },
  {
    id: "conectividad",
    label: "Conectividad",
    rows: [
      bool("usbc", "USB-C con vídeo", (m) => m.usbC),
      {
        key: "pd",
        label: "Carga USB-C",
        format: (m) => (m.usbC_PD_watts ? `${m.usbC_PD_watts} W` : "—"),
        score: (m) => m.usbC_PD_watts,
        better: "higher",
      },
      bool("tb", "Thunderbolt", (m) => m.thunderbolt),
      bool("kvm", "KVM", (m) => m.kvm),
      { key: "hub", label: "Puertos USB (hub)", format: (m) => String(m.hub_usb_puertos), score: (m) => m.hub_usb_puertos, better: "higher" },
      bool("ethernet", "Ethernet (RJ45)", (m) => m.ethernet),
      bool("daisy", "Daisy chain", (m) => m.daisy_chain),
      bool("altavoces", "Altavoces", (m) => m.altavoces),
      bool("webcam", "Cámara", (m) => m.webcam),
    ],
  },
  {
    id: "ergonomia",
    label: "Ergonomía y espacio",
    rows: [
      {
        key: "altura",
        label: "Ajuste en altura",
        format: (m) => (m.ergonomia.altura_mm ? `${m.ergonomia.altura_mm} mm` : "No"),
        score: (m) => m.ergonomia.altura_mm,
        better: "higher",
      },
      bool("inclinacion", "Inclinación", (m) => m.ergonomia.inclinacion),
      bool("giro", "Giro (swivel)", (m) => m.ergonomia.giro),
      bool("pivote", "Pivote vertical", (m) => m.ergonomia.pivote),
      bool("vesa", "Anclaje VESA", (m) => m.vesa || m.tipo_soporte === "brazo-abrazadera"),
      { key: "soporte", label: "Soporte", format: (m) => (m.tipo_soporte === "peana" ? "Peana" : "Brazo con abrazadera") },
      {
        key: "fondo",
        label: "Fondo ocupado",
        format: (m) => (m.tipo_soporte === "brazo-abrazadera" ? "Canto de mesa" : `${num(m.peana_profundidad_cm)} cm`),
        score: (m) => m.peana_profundidad_cm,
        better: "lower",
      },
      { key: "ancho", label: "Ancho", format: (m) => `${num(m.ancho_cm)} cm` },
    ],
  },
  {
    id: "otros",
    label: "Consumo y garantía",
    rows: [
      { key: "consumo", label: "Consumo típico", format: (m) => `${m.consumo_tipico_w} W`, score: (m) => m.consumo_tipico_w, better: "lower" },
      { key: "garantia", label: "Garantía", format: (m) => `${m.garantia_anios} años`, score: (m) => m.garantia_anios, better: "higher" },
    ],
  },
];

/** Quién gana una fila: "a", "b", o null si empatan o la fila es informativa. */
export function rowWinner(row: SpecRow, a: Monitor, b: Monitor): "a" | "b" | null {
  if (!row.score || !row.better) return null;
  const sa = row.score(a);
  const sb = row.score(b);
  if (sa === sb) return null;
  const aBetter = row.better === "higher" ? sa > sb : sa < sb;
  return aBetter ? "a" : "b";
}
