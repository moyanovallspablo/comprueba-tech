/**
 * Nitidez, PPI y escalado: cálculos puros del Simulador de PPI (/simulador-ppi) y del resumen de cada ficha.
 * Sin dependencias del motor de recomendación, que reutiliza `calcPpi`.
 */

export interface DisplayInput {
  ancho: number; // píxeles
  alto: number; // píxeles
  pulgadas: number; // diagonal
}

const CM_PER_INCH = 2.54;

// ───────────────────────────── PPI y tamaño físico ─────────────────────────────

/** Píxeles por pulgada: diagonal en píxeles entre diagonal en pulgadas. */
export function calcPpi(ancho: number, alto: number, pulgadas: number): number {
  return Math.sqrt(ancho ** 2 + alto ** 2) / pulgadas;
}

/** Ancho y alto del área visible en cm (panel plano; en curvos es la cuerda). */
export function physicalSizeCm({ ancho, alto, pulgadas }: DisplayInput) {
  const diagPx = Math.hypot(ancho, alto);
  return {
    anchoCm: (pulgadas * CM_PER_INCH * ancho) / diagPx,
    altoCm: (pulgadas * CM_PER_INCH * alto) / diagPx,
  };
}

// ───────────────────────────── Categoría de nitidez ─────────────────────────────

export type SharpnessTierId = "estandar" | "alta" | "muy-alta" | "retina";

export interface SharpnessTier {
  id: SharpnessTierId;
  label: string;
  /** PPI mínimo (incluido) de la categoría. */
  min: number;
  description: string;
}

export const SHARPNESS_TIERS: SharpnessTier[] = [
  { id: "estandar", label: "Estándar", min: 0, description: "El píxel se distingue a distancia de escritorio." },
  { id: "alta", label: "Alta nitidez", min: 100, description: "Texto limpio a la distancia habitual." },
  { id: "muy-alta", label: "Muy alta nitidez", min: 160, description: "Casi imposible distinguir el píxel." },
  {
    id: "retina",
    label: "Retina nativo / Ultranítido",
    min: 200,
    description: "Densidad de imprenta: bordes de texto perfectamente suaves.",
  },
];

export function sharpnessTier(ppi: number): SharpnessTier {
  return SHARPNESS_TIERS.findLast((t) => ppi >= t.min) ?? SHARPNESS_TIERS[0];
}

// ───────────────────────────── Distancia de visión ─────────────────────────────

/** Agudeza visual 20/20: el ojo separa detalles de 1 minuto de arco. 60 píxeles por grado es el umbral "Retina". */
const ARCMIN_RAD = Math.PI / (180 * 60);
export const RETINA_PPD = 60;

/** Distancia (cm) a partir de la cual un píxel ocupa menos de 1′ de arco: el ojo deja de distinguirlo. */
export function retinaDistanceCm(ppi: number): number {
  return CM_PER_INCH / (ppi * Math.tan(ARCMIN_RAD));
}

/** Píxeles por grado de campo visual a una distancia dada: la medida real de nitidez percibida. */
export function pixelsPerDegree(ppi: number, distanciaCm: number): number {
  return 2 * (distanciaCm / CM_PER_INCH) * ppi * Math.tan(Math.PI / 360);
}

/**
 * Campo de visión horizontal cómodo (grados) según la proporción: un panoramico se diseña para envolver
 * más campo visual que uno 16:9, así que no exige alejarse tanto.
 */
function comfortableFov(ancho: number, alto: number): [wide: number, narrow: number] {
  const ratio = ancho / alto;
  if (ratio >= 3) return [95, 75]; // 32:9
  if (ratio >= 2.2) return [75, 55]; // 21:9
  return [60, 40]; // 16:9 y 16:10
}

export const DISTANCE_MIN_CM = 40;
export const DISTANCE_MAX_CM = 130;

/** Rango de distancia recomendado: el monitor ocupa entre el campo de visión amplio y el estrecho. */
export function recommendedDistanceCm(d: DisplayInput) {
  const { anchoCm } = physicalSizeCm(d);
  const [wide, narrow] = comfortableFov(d.ancho, d.alto);
  const at = (fov: number) => anchoCm / 2 / Math.tan((fov * Math.PI) / 360);
  const clamp = (cm: number) => Math.round(Math.min(DISTANCE_MAX_CM, Math.max(DISTANCE_MIN_CM, cm)));
  const min = clamp(at(wide));
  const max = clamp(at(narrow));
  return { min, max, ideal: Math.round((min + max) / 2) };
}

// ───────────────────────────── Puntuación de nitidez ─────────────────────────────

function interpolate(x: number, points: [number, number][]): number {
  if (x <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i++) {
    const [x1, y1] = points[i];
    if (x <= x1) {
      const [x0, y0] = points[i - 1];
      return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
    }
  }
  return points[points.length - 1][1];
}

/**
 * Nota de 1 a 10 a partir de los píxeles por grado a la distancia de uso: combina densidad y distancia,
 * que es lo que decide si el ojo ve el píxel. 60 ppg (umbral Retina) ronda el 7,5.
 */
export function sharpnessScore(ppi: number, distanciaCm: number): number {
  const ppd = pixelsPerDegree(ppi, distanciaCm);
  const score = interpolate(ppd, [
    [25, 1],
    [35, 3.5],
    [45, 5.5],
    [60, 7.5],
    [75, 8.8],
    [95, 9.6],
    [110, 10],
  ]);
  return Math.round(score * 10) / 10;
}

// ───────────────────────────── Sistemas operativos ─────────────────────────────

export type Fit = "optimo" | "correcto" | "problematico";

export interface Size2D {
  ancho: number;
  alto: number;
}

export interface MacosFit {
  zone: "pixel-visible" | "nativo-1x" | "escalado-fraccional" | "retina-2x";
  fit: Fit;
  label: string;
  /** Resolución de interfaz ("Se ve como") recomendada. */
  looksLike: Size2D;
  /** Búfer que dibuja macOS antes de reducir a la resolución nativa (solo en escalado fraccional). */
  renderAt?: Size2D;
  summary: string;
}

/** Densidades de referencia de Apple: ~110 ppi a 1× (Thunderbolt Display) y ~218 ppi a 2× (Studio Display). */
export const MAC_IDEAL_1X_PPI = 110;
export const MAC_IDEAL_2X_PPI = 218;
/** Entre ambas, macOS no puede escalar con un factor entero sin que la interfaz quede enorme o diminuta. */
export const MAC_FRACTIONAL_ZONE: [min: number, max: number] = [120, 180];
const MAC_PIXEL_VISIBLE_PPI = 95;
/** Factores "Se ve como" que ofrece macOS en escalado fraccional, de más grande a más espacio. */
const MAC_SCALE_STEPS = [2, 1.75, 1.5, 1.25];

const size = (ancho: number, alto: number): Size2D => ({ ancho: Math.round(ancho), alto: Math.round(alto) });
const fmtSize = (s: Size2D) => `${s.ancho}×${s.alto}`;

export function macosFit({ ancho, alto }: Size2D, ppi: number): MacosFit {
  const [fracMin, fracMax] = MAC_FRACTIONAL_ZONE;

  if (ppi >= fracMax) {
    const looksLike = size(ancho / 2, alto / 2);
    return {
      zone: "retina-2x",
      fit: "optimo",
      label: "Retina 2×",
      looksLike,
      summary:
        ppi >= 200
          ? `Escalado entero 2×: se ve como ${fmtSize(looksLike)} con nitidez Retina, igual que un Studio Display.`
          : `Escalado entero 2× a ${fmtSize(looksLike)}: nitidez Retina con la interfaz algo más grande que en un 5K.`,
    };
  }

  if (ppi >= fracMin) {
    const target = ppi / MAC_IDEAL_1X_PPI;
    const scale = MAC_SCALE_STEPS.reduce((best, s) => (Math.abs(s - target) < Math.abs(best - target) ? s : best));
    const looksLike = size(ancho / scale, alto / scale);
    const renderAt = size(looksLike.ancho * 2, looksLike.alto * 2);
    return {
      zone: "escalado-fraccional",
      fit: "problematico",
      label: "Escalado no entero",
      looksLike,
      renderAt,
      summary:
        `Para una interfaz de tamaño normal (${fmtSize(looksLike)}) macOS dibuja a ${fmtSize(renderAt)} y reduce a ` +
        `${ancho}×${alto}: texto algo más blando y más carga de GPU. A 2× exacto todo se vería enorme.`,
    };
  }

  const looksLike = size(ancho, alto);
  if (ppi >= MAC_PIXEL_VISIBLE_PPI) {
    return {
      zone: "nativo-1x",
      fit: "correcto",
      label: "Nativo 1×",
      looksLike,
      summary: `Interfaz a tamaño natural sin escalar (zona de ~${MAC_IDEAL_1X_PPI} ppi), pero sin la finura Retina: macOS ya no suaviza el texto por subpíxel.`,
    };
  }
  return {
    zone: "pixel-visible",
    fit: "problematico",
    label: "Píxel visible",
    looksLike,
    summary: "Densidad baja para macOS: sin suavizado por subpíxel, el texto se ve dentado y la interfaz grande.",
  };
}

export interface WindowsFit {
  fit: Fit;
  /** Escalado recomendado (1 = 100 %). */
  scale: number;
  label: string;
  looksLike: Size2D;
  summary: string;
}

/** Densidad lógica cómoda en Windows a distancia de escritorio (96 ppi es el 100 % de referencia). */
const WINDOWS_TARGET_PPI = 108;

export function windowsFit({ ancho, alto }: Size2D, ppi: number): WindowsFit {
  const scale = Math.min(3, Math.max(1, Math.round((ppi / WINDOWS_TARGET_PPI) * 4) / 4));
  const looksLike = size(ancho / scale, alto / scale);
  const pct = `${Math.round(scale * 100)} %`;

  if (scale === 1) {
    return ppi < 100
      ? {
          fit: "correcto",
          scale,
          label: "100 % · píxel visible",
          looksLike,
          summary: "Sin escalado. ClearType disimula los bordes, pero de cerca se nota la rejilla de píxeles.",
        }
      : {
          fit: "optimo",
          scale,
          label: "100 % · nativo",
          looksLike,
          summary: "Sin escalado: cada píxel de la interfaz es un píxel del panel, con ClearType afinando el texto.",
        };
  }
  return {
    fit: "optimo",
    scale,
    label: `${pct} recomendado`,
    looksLike,
    summary:
      `Windows escala de forma fraccional sin perder nitidez: a ${pct} tendrás un espacio como ${fmtSize(looksLike)}. ` +
      "Alguna aplicación antigua puede verse algo borrosa.",
  };
}

// ───────────────────────────── Análisis completo ─────────────────────────────

export interface DisplayAnalysis {
  ppi: number;
  tier: SharpnessTier;
  anchoCm: number;
  altoCm: number;
  distance: { min: number; max: number; ideal: number };
  retinaDistanceCm: number;
  /** Distancia usada para la nota (la indicada o la ideal recomendada). */
  distanciaCm: number;
  ppd: number;
  score: number;
  macos: MacosFit;
  windows: WindowsFit;
}

export function analyzeDisplay(d: DisplayInput, distanciaCm?: number): DisplayAnalysis {
  const ppi = calcPpi(d.ancho, d.alto, d.pulgadas);
  const distance = recommendedDistanceCm(d);
  const dist = distanciaCm ?? distance.ideal;
  return {
    ppi,
    tier: sharpnessTier(ppi),
    ...physicalSizeCm(d),
    distance,
    retinaDistanceCm: Math.round(retinaDistanceCm(ppi)),
    distanciaCm: dist,
    ppd: pixelsPerDegree(ppi, dist),
    score: sharpnessScore(ppi, dist),
    macos: macosFit(d, ppi),
    windows: windowsFit(d, ppi),
  };
}

// ───────────────────────────── Presets del simulador ─────────────────────────────

export const SIZE_PRESETS = [24, 27, 28, 32, 34, 38, 49];

export interface ResolutionPreset {
  id: string;
  label: string;
  name: string;
  ancho: number;
  alto: number;
}

export const RESOLUTION_PRESETS: ResolutionPreset[] = [
  { id: "1080p", label: "1080p", name: "Full HD", ancho: 1920, alto: 1080 },
  { id: "1440p", label: "1440p", name: "QHD", ancho: 2560, alto: 1440 },
  { id: "4k", label: "4K", name: "UHD", ancho: 3840, alto: 2160 },
  { id: "5k", label: "5K", name: "Retina 5K", ancho: 5120, alto: 2880 },
  { id: "uw-1080", label: "UW 1080p", name: "UltraWide FHD", ancho: 2560, alto: 1080 },
  { id: "uw-1440", label: "UW 1440p", name: "UltraWide QHD", ancho: 3440, alto: 1440 },
  { id: "5k2k", label: "5K2K", name: "UltraWide 5K", ancho: 5120, alto: 2160 },
  { id: "dqhd", label: "Dual QHD", name: "Super UltraWide", ancho: 5120, alto: 1440 },
];

export const FIT_LABELS: Record<Fit, string> = {
  optimo: "Óptimo",
  correcto: "Correcto",
  problematico: "Problemático",
};
