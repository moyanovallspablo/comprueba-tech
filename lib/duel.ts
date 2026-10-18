import { getPpi } from "@/lib/engine/calculator";
import type { Monitor } from "@/types/monitor";

/**
 * Diferenciadores de un vistazo para las tarjetas de duelo: lo que gana cada lado, en orden de peso para la
 * decisión de compra. Solo diferencias que se notan (umbrales mínimos), con signo tipográfico (U+2212).
 */

type Edge = (self: Monitor, other: Monitor) => string | null;

const num = (n: number) => n.toLocaleString("es-ES");

const EDGES: Edge[] = [
  (s, o) => (o.precio_eur - s.precio_eur >= 10 ? `−${num(o.precio_eur - s.precio_eur)} €` : null),
  (s, o) => (s.hz - o.hz >= 20 ? `+${s.hz - o.hz} Hz` : null),
  (s, o) => {
    const d = Math.round(getPpi(s) - getPpi(o));
    return d >= 15 ? `+${d} ppi` : null;
  },
  (s, o) => (s.panel === "QD-OLED" && o.panel !== "QD-OLED" ? "OLED" : null),
  (s, o) => (s.usbC_PD_watts - o.usbC_PD_watts >= 15 ? `USB-C ${s.usbC_PD_watts} W` : null),
  (s, o) => (s.pulgadas - o.pulgadas >= 2 ? `+${num(Math.round((s.pulgadas - o.pulgadas) * 10) / 10)}"` : null),
  (s, o) => {
    const d = s.ergonomia.altura_mm - o.ergonomia.altura_mm;
    return d >= 50 ? `Altura +${Math.round(d / 10)} cm` : null;
  },
];

export function duelEdges(self: Monitor, other: Monitor, max = 2): string[] {
  return EDGES.map((edge) => edge(self, other))
    .filter((e): e is string => e !== null)
    .slice(0, max);
}
