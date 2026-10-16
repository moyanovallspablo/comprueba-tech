import type { Monitor } from "@/types/monitor";

/**
 * Modelo físico simplificado de un monitor sobre la mesa, en centímetros.
 * - Ancho total y fondo de peana salen del catálogo (datos de fabricante).
 * - El panel activo se calcula exacto a partir de diagonal y resolución.
 * - Alto del chasis y altura de la peana son estimaciones (marcadas con `estimado`).
 */
export interface PhysicalMonitor {
  id: string;
  label: string;
  anchoCm: number; // ancho total del chasis
  altoCm: number; // alto del chasis (sin peana)
  panelAnchoCm: number; // área activa
  panelAltoCm: number;
  grosorCm: number;
  fondoPeanaCm: number; // fondo que ocupa sobre la mesa (0 con brazo)
  baseAnchoCm: number;
  elevacionCm: number; // del tablero al borde inferior del chasis, en la posición más baja
  curvaturaMm: number | null;
  soporte: "peana" | "brazo-abrazadera";
  generico: boolean; // dimensiones de un monitor genérico (el actual del usuario)
}

export interface Desk {
  anchoCm: number;
  fondoCm: number;
}

export const DEFAULT_DESK: Desk = { anchoCm: 140, fondoCm: 70 };
export const DESK_LIMITS = { ancho: [80, 240], fondo: [45, 120] } as const;

const CHIN_CM = 1.2; // marco inferior extra respecto a los laterales

function panelSize(pulgadas: number, ratio: number) {
  const ancho = (pulgadas * 2.54 * ratio) / Math.sqrt(ratio ** 2 + 1);
  return { ancho, alto: ancho / ratio };
}

export function physicalFromMonitor(m: Monitor): PhysicalMonitor {
  const ratio = m.resolucion.ancho / m.resolucion.alto;
  const panel = panelSize(m.pulgadas, ratio);
  const bezel = Math.max(0.5, (m.ancho_cm - panel.ancho) / 2);
  const isArm = m.tipo_soporte === "brazo-abrazadera";
  return {
    id: m.id,
    label: `${m.marca} ${m.modelo}`,
    anchoCm: m.ancho_cm,
    altoCm: panel.alto + bezel * 2 + CHIN_CM,
    panelAnchoCm: panel.ancho,
    panelAltoCm: panel.alto,
    grosorCm: m.panel === "QD-OLED" && !m.curvatura ? 3.5 : 5,
    fondoPeanaCm: isArm ? 0 : m.peana_profundidad_cm,
    baseAnchoCm: clamp(m.ancho_cm * 0.38, 20, 45),
    elevacionCm: isArm ? 14 : 9,
    curvaturaMm: m.curvatura,
    soporte: m.tipo_soporte,
    generico: false,
  };
}

/** Monitor genérico 16:9 para representar el monitor actual del usuario (solo sabemos pulgadas). */
export function physicalGeneric(pulgadas: number, label: string): PhysicalMonitor {
  const panel = panelSize(pulgadas, 16 / 9);
  const bezel = 1;
  return {
    id: `generico-${pulgadas}`,
    label,
    anchoCm: panel.ancho + bezel * 2,
    altoCm: panel.alto + bezel * 2 + CHIN_CM,
    panelAnchoCm: panel.ancho,
    panelAltoCm: panel.alto,
    grosorCm: 5,
    fondoPeanaCm: 20,
    baseAnchoCm: 24,
    elevacionCm: 9,
    curvaturaMm: null,
    soporte: "peana",
    generico: true,
  };
}

/** Profundidad real del panel curvo (flecha del arco): los extremos se adelantan hacia el usuario. */
export function curveSagittaCm(p: PhysicalMonitor): number {
  if (!p.curvaturaMm) return 0;
  const r = p.curvaturaMm / 10;
  const half = p.anchoCm / 2;
  return r - Math.sqrt(Math.max(0, r ** 2 - half ** 2));
}

export interface Fit {
  libreDelanteCm: number; // fondo de mesa que queda libre delante de la peana
  cabeAncho: boolean;
  cabeFondo: boolean; // deja al menos MIN_FREE_CM para teclado y distancia de visión
}

export const MIN_FREE_CM = 35; // mismo umbral que el motor de recomendación

export function fitOnDesk(p: PhysicalMonitor, desk: Desk): Fit {
  const libre = desk.fondoCm - p.fondoPeanaCm;
  return { libreDelanteCm: libre, cabeAncho: p.anchoCm <= desk.anchoCm, cabeFondo: libre >= MIN_FREE_CM };
}

export interface SpatialDelta {
  anchoCm: number; // B − A (positivo: B ocupa más)
  altoCm: number;
  fondoCm: number;
  areaPanelPct: number; // superficie de pantalla de B respecto a A, en %
}

export function spatialDelta(a: PhysicalMonitor, b: PhysicalMonitor): SpatialDelta {
  return {
    anchoCm: b.anchoCm - a.anchoCm,
    altoCm: b.altoCm - a.altoCm,
    fondoCm: b.fondoPeanaCm - a.fondoPeanaCm,
    areaPanelPct: ((b.panelAnchoCm * b.panelAltoCm) / (a.panelAnchoCm * a.panelAltoCm) - 1) * 100,
  };
}

export function sanitizeDesk(anchoCm: unknown, fondoCm: unknown): Desk {
  const n = (v: unknown, fallback: number) => {
    const x = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
    return Number.isFinite(x) && x > 0 ? x : fallback;
  };
  return {
    anchoCm: clamp(n(anchoCm, DEFAULT_DESK.anchoCm), DESK_LIMITS.ancho[0], DESK_LIMITS.ancho[1]),
    fondoCm: clamp(n(fondoCm, DEFAULT_DESK.fondoCm), DESK_LIMITS.fondo[0], DESK_LIMITS.fondo[1]),
  };
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

/** "+21 cm" / "−4 cm" / "igual" con signo tipográfico real. */
export function formatDeltaCm(v: number): string {
  const r = Math.round(v * 10) / 10;
  if (Math.abs(r) < 0.5) return "igual";
  return `${r > 0 ? "+" : "−"}${Math.abs(r).toLocaleString("es-ES", { maximumFractionDigits: 1 })} cm`;
}
