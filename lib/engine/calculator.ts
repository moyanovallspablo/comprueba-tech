import { monitors as defaultCatalog } from "@/data/monitors";
import type { CurrentEquipment, Monitor, PanelType, Profile } from "@/types/monitor";
import { calcPpi } from "@/lib/ppi";
import { explain } from "./explain";

// ───────────────────────────── Tipos de salida ─────────────────────────────

export type Criterion =
  | "imagen"
  | "fluidez"
  | "conectividad"
  | "ergonomia"
  | "valor" // relación calidad-precio
  | "madurez";

export type Verdict = "recomendado" | "con_oferta" | "descartado";

export interface Adjustment {
  rule: string;
  delta: number; // puntos sumados/restados a la nota final
  reason: string;
}

export interface ScoredMonitor {
  monitor: Monitor;
  ppi: number;
  subscores: Record<Criterion, number>;
  baseScore: number; // media ponderada antes de ajustes
  score: number; // nota final 0–100
  adjustments: Adjustment[];
  exclusions: string[];
  highlights: string[];
  interpretation: string[]; // lo que ganas, en lenguaje humano
  sacrifices: string[]; // lo que cedes, en lenguaje humano
  verdict: Verdict;
  verdictLabel: string;
  verdictReason: string;
  targetPrice?: number; // precio al que pasaría a ser compra recomendable
}

export type ConfidenceLevel = "alta" | "media" | "baja";

export interface Confidence {
  level: ConfidenceLevel;
  value: number; // 0–100
  label: string;
  reason: string;
}

export interface Recommendation {
  profile: Profile;
  budget: number;
  winner: ScoredMonitor | null;
  /** Opción 🟡 con mejor nota que el ganador: merece la pena esperar a que baje. */
  worthWaiting: ScoredMonitor | null;
  confidence: Confidence | null;
  ranking: ScoredMonitor[];
  weights: Record<Criterion, number>;
  highBudget: boolean;
}

// ───────────────────────────── Configuración ─────────────────────────────

export const PROFILE_WEIGHTS: Record<Profile, Record<Criterion, number>> = {
  mac: { imagen: 0.3, conectividad: 0.3, ergonomia: 0.15, valor: 0.1, madurez: 0.1, fluidez: 0.05 },
  gaming: { fluidez: 0.4, imagen: 0.25, valor: 0.15, madurez: 0.1, ergonomia: 0.05, conectividad: 0.05 },
  oficina: { ergonomia: 0.25, conectividad: 0.25, valor: 0.25, imagen: 0.15, madurez: 0.1, fluidez: 0 },
};

export const VERDICT_LABELS: Record<Verdict, string> = {
  recomendado: "🟢 Recomendado",
  con_oferta: "🟡 Con oferta",
  descartado: "🔴 Descartado",
};

/** Por encima de este presupuesto el precio deja de ser lo prioritario. */
export const HIGH_BUDGET = 1200;
/** Fracción del peso de 'valor' que se recoloca con presupuesto alto, y hacia dónde va. */
const HIGH_BUDGET_VALUE_SHIFT = 0.6;
const HIGH_BUDGET_TO_IMAGEN = 0.6;
const HIGH_BUDGET_TO_ERGONOMIA = 0.4;

/** Bonus multiplicativo para Retina/5K (≈218 ppi) en Mac: macOS renderiza a 2× sin escalado fraccional. */
const MAC_RETINA_PPI = 200;
const MAC_RETINA_BONUS = 0.15;
/** Por encima de este presupuesto, en Mac, el 5K tiene prioridad absoluta en la nota de imagen. */
export const MAC_5K_PRIORITY_BUDGET = 1500;
const MAC_NON_5K_IMAGE_CAP = 90;

/** Buen precio: hasta un 10% sobre el mínimo histórico, o en el primer cuarto del rango mínimo → lanzamiento. */
const GOOD_PRICE_MARGIN = 1.1;
const GOOD_PRICE_RANGE_POSITION = 0.25;

export const BUDGET_TOLERANCE = 1.25; // por encima de presupuesto × 1.25 se descarta
export const SCORE_RECOMMENDED = 70;
export const SCORE_MIN = 50;
const MIN_FREE_DESK_CM = 35; // fondo libre mínimo para teclado + distancia de visión
const COMFORT_FREE_DESK_CM = 45;

// ───────────────────────────── Utilidades ─────────────────────────────

const clamp = (v: number, min = 0, max = 100) => Math.min(max, Math.max(min, v));

/** Interpolación lineal sobre una tabla de puntos [x, y] ordenada por x. */
function curve(x: number, points: [number, number][]): number {
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

export function getPpi(m: Monitor): number {
  return calcPpi(m.resolucion.ancho, m.resolucion.alto, m.pulgadas);
}

/**
 * Pesos del perfil ajustados al presupuesto. Con presupuesto alto (> HIGH_BUDGET) la relación
 * calidad-precio pierde peso en favor de imagen y construcción/ergonomía. Los pesos siempre suman 1.
 */
export function getProfileWeights(profile: Profile, budget: number): Record<Criterion, number> {
  const w = { ...PROFILE_WEIGHTS[profile] };
  if (budget > HIGH_BUDGET) {
    const freed = w.valor * HIGH_BUDGET_VALUE_SHIFT;
    w.valor -= freed;
    w.imagen += freed * HIGH_BUDGET_TO_IMAGEN;
    w.ergonomia += freed * HIGH_BUDGET_TO_ERGONOMIA;
  }
  return w;
}

const isOled = (panel: PanelType) => panel === "QD-OLED";

const PANEL_CONTRAST: Record<PanelType, number> = {
  "QD-OLED": 100,
  "IPS Black": 80,
  VA: 75,
  "Fast IPS": 65,
  IPS: 62,
};

// ───────────────────────────── Sub-notas (0–100) ─────────────────────────────

function scoreImagen(m: Monitor, ppi: number, profile: Profile, budget: number): number {
  // Mac con presupuesto alto: el 5K (≈218 ppi) es la referencia absoluta de imagen. Nota máxima para él y
  // techo por debajo para cualquier 1440p/4K, aunque sea OLED, para que nunca lo iguale.
  if (profile === "mac" && budget > MAC_5K_PRIORITY_BUDGET) {
    return ppi >= MAC_RETINA_PPI ? 100 : Math.min(MAC_NON_5K_IMAGE_CAP, scoreImagenBase(m, ppi));
  }
  return scoreImagenBase(m, ppi);
}

function scoreImagenBase(m: Monitor, ppi: number): number {
  const density = curve(ppi, [[80, 30], [92, 45], [110, 68], [140, 85], [163, 93], [218, 100]]);
  const color = clamp(((m.cobertura_dci_p3 - 70) / 30) * 85 + (m.calibrado_fabrica ? 15 : 0));
  const contrast = PANEL_CONTRAST[m.panel];
  const hdr =
    m.hdr === "DisplayHDR True Black 400" ? 100
    : m.hdr === "DisplayHDR 400" ? 55
    : m.hdr === "HDR10" ? 30
    : clamp((m.brillo_nits - 250) / 4); // sin HDR, el brillo SDR alto (Studio Display) aún cuenta
  return 0.45 * density + 0.25 * color + 0.2 * contrast + 0.1 * hdr;
}

function scoreFluidez(m: Monitor): number {
  const hz = curve(m.hz, [[60, 15], [75, 28], [120, 60], [144, 70], [165, 78], [240, 100]]);
  const resp = curve(m.tiempo_respuesta_ms, [[0.03, 100], [0.1, 98], [1, 90], [2, 84], [4, 70], [5, 62], [8, 40], [14, 18]]);
  const vrr = m.adaptive_sync === "Ninguno" ? 0 : m.adaptive_sync === "FreeSync" ? 70 : 100;
  return 0.6 * hz + 0.3 * resp + 0.1 * vrr;
}

function scoreConectividad(m: Monitor): number {
  const pd = curve(m.usbC_PD_watts, [[0, 0], [15, 20], [60, 70], [65, 80], [90, 95], [96, 100]]);
  return (
    0.4 * pd +
    (m.usbC ? 15 : 0) +
    (m.thunderbolt ? 10 : 0) +
    (m.kvm ? 10 : 0) +
    (Math.min(m.hub_usb_puertos, 4) / 4) * 15 +
    (m.ethernet ? 10 : 0)
  );
}

function scoreErgonomia(m: Monitor): number {
  const e = m.ergonomia;
  const height = clamp((e.altura_mm / 130) * 35, 0, 35);
  const footprint =
    m.tipo_soporte === "brazo-abrazadera" ? 15
    : m.peana_profundidad_cm <= 20 ? 15
    : m.peana_profundidad_cm <= 25 ? 10
    : m.peana_profundidad_cm <= 32 ? 5
    : 0;
  return (
    height +
    (e.pivote ? 10 : 0) +
    (e.giro ? 15 : 0) +
    (e.inclinacion ? 10 : 0) +
    (m.vesa || m.tipo_soporte === "brazo-abrazadera" ? 15 : 0) +
    footprint
  );
}

function scoreValor(m: Monitor, budget: number): number {
  const ratio = m.precio_eur / budget;
  const base = ratio <= 1 ? 70 + 30 * (1 - ratio) : 70 - (ratio - 1) * 280;
  const nearLow = m.precio_eur <= m.precio_minimo_historico_eur * 1.05 ? 10 : 0;
  return clamp(base + nearLow);
}

function scoreMadurez(meses: number): number {
  // < 3 meses: sobreprecio de lanzamiento y firmware verde. 6–30: punto dulce. > 48: tecnología superada.
  return curve(meses, [[0, 55], [3, 75], [6, 100], [30, 100], [48, 80], [60, 60], [84, 40]]);
}

// ───────────────────────────── Reglas de perfil / equipo ─────────────────────────────

interface RuleResult {
  adjustments: Adjustment[];
  exclusions: string[];
}

function applyRules(
  m: Monitor,
  ppi: number,
  profile: Profile,
  budget: number,
  eq: CurrentEquipment,
): RuleResult {
  const adjustments: Adjustment[] = [];
  const exclusions: string[] = [];
  const add = (rule: string, delta: number, reason: string) => adjustments.push({ rule, delta, reason });

  // Presupuesto
  if (m.precio_eur > budget * BUDGET_TOLERANCE) {
    exclusions.push(
      `Cuesta ${m.precio_eur} €, más de un ${Math.round((BUDGET_TOLERANCE - 1) * 100)}% por encima del presupuesto (${budget} €).`,
    );
  }

  // Espacio en la mesa
  if (eq.ancho_mesa_cm && m.ancho_cm > eq.ancho_mesa_cm) {
    exclusions.push(`Mide ${m.ancho_cm} cm de ancho y tu mesa ${eq.ancho_mesa_cm} cm.`);
  }
  if (eq.profundidad_mesa_cm) {
    const free = eq.profundidad_mesa_cm - m.peana_profundidad_cm;
    if (free < MIN_FREE_DESK_CM) {
      exclusions.push(
        `Ocupa ${m.peana_profundidad_cm} cm de fondo: te quedarían ${free.toFixed(0)} cm libres (mínimo ${MIN_FREE_DESK_CM}).`,
      );
    } else if (free < COMFORT_FREE_DESK_CM) {
      add("mesa_justa", -8, `Solo quedarían ${free.toFixed(0)} cm de fondo libre para teclado y distancia de visión.`);
    }
  }

  // Monitor actual: ¿supone una mejora real?
  if (eq.monitor_actual) {
    const a = eq.monitor_actual;
    const betterRes = m.resolucion.alto > a.resolucion_alto;
    const betterHz = m.hz >= a.hz * 1.5; // 60→90+, 144→216+
    const bigger = m.pulgadas >= a.pulgadas + 3;
    const ultrawideUpgrade = m.relacion_aspecto !== "16:9";
    const improvements = [betterRes, betterHz, bigger, ultrawideUpgrade].filter(Boolean).length;
    if (improvements === 0) {
      exclusions.push("No mejora resolución, frecuencia ni tamaño respecto a tu monitor actual.");
    } else if (improvements === 1 && !betterRes) {
      add("mejora_marginal", -6, "Mejora poco respecto a tu monitor actual.");
    }
  }

  switch (profile) {
    case "mac": {
      if (eq.dispositivo === "portatil") {
        if (m.usbC_PD_watts === 0) {
          add("mac_sin_pd", -20, "Sin carga por USB-C: necesitarás el cargador del MacBook y varios cables.");
        } else if (m.usbC_PD_watts < 65) {
          add(
            "mac_pd_insuficiente",
            -12,
            `Solo ${m.usbC_PD_watts} W por USB-C: un MacBook Pro se descargará bajo carga (mínimo recomendado 65 W).`,
          );
        }
      }
      if (ppi >= 120 && ppi <= 160) {
        add(
          "mac_escalado",
          -8,
          `${ppi.toFixed(0)} ppi cae en la zona incómoda de macOS: obliga a escalado fraccional (texto menos nítido y más carga de GPU).`,
        );
      }
      if (m.usbC && m.thunderbolt) add("mac_thunderbolt", 4, "Thunderbolt: un solo cable para imagen, carga y periféricos.");
      break;
    }
    case "gaming": {
      if (m.hz < 100) {
        exclusions.push(`${m.hz} Hz es insuficiente para gaming (mínimo 100 Hz).`);
      } else if (m.hz < 144) {
        add("gaming_hz_bajos", -10, `${m.hz} Hz se queda corto para juego competitivo (144 Hz o más).`);
      }
      if (m.adaptive_sync === "Ninguno") add("gaming_sin_vrr", -8, "Sin FreeSync/G-Sync: tearing o input lag con V-Sync.");

      const pixelRate = m.resolucion.ancho * m.resolucion.alto * m.hz;
      const gpuLimit =
        eq.gpu === "integrada" ? 1920 * 1080 * 165 * 1.1
        : eq.gpu === "media" ? 2560 * 1440 * 170
        : Infinity;
      if (pixelRate > gpuLimit) {
        const penalty = Math.min(15, Math.max(2, Math.round((pixelRate / gpuLimit - 1) * 10)));
        add(
          "gaming_gpu",
          -penalty,
          `Tu GPU (${eq.gpu}) no podrá aprovechar ${m.resolucion.ancho}×${m.resolucion.alto} a ${m.hz} Hz.`,
        );
      }
      if (isOled(m.panel)) add("gaming_oled", 4, "OLED: respuesta casi instantánea y negros perfectos.");
      break;
    }
    case "oficina": {
      if (isOled(m.panel)) {
        add("oficina_oled", -10, "OLED con interfaz estática muchas horas (barras, Excel): riesgo de quemado.");
      }
      if (m.ergonomia.altura_mm === 0) add("oficina_sin_altura", -8, "Sin ajuste en altura: mala postura en jornadas largas.");
      if (eq.dispositivo === "portatil" && m.usbC_PD_watts >= 60) {
        add("oficina_un_cable", 5, `USB-C con ${m.usbC_PD_watts} W: conectas el portátil con un solo cable.`);
      }
      if (m.kvm) add("oficina_kvm", 3, "KVM: comparte teclado y ratón entre dos equipos.");
      break;
    }
  }

  return { adjustments, exclusions };
}

/** Bonus de compatibilidad: se calcula sobre la nota ya ajustada, por eso va aparte de applyRules. */
function compatibilityBonus(profile: Profile, ppi: number, scoreSoFar: number): Adjustment | null {
  if (profile === "mac" && ppi >= MAC_RETINA_PPI) {
    return {
      rule: "mac_retina_5k",
      delta: Math.round(scoreSoFar * MAC_RETINA_BONUS),
      reason: `Pantalla 5K (${Math.round(ppi)} ppi): macOS renderiza a 2× nativo, sin escalado fraccional (+${Math.round(
        MAC_RETINA_BONUS * 100,
      )}%).`,
    };
  }
  return null;
}

// ───────────────────────────── Puntos fuertes ─────────────────────────────

const CRITERION_LABELS: Record<Criterion, string> = {
  imagen: "calidad de imagen",
  fluidez: "fluidez",
  conectividad: "conectividad",
  ergonomia: "ergonomía",
  valor: "relación calidad-precio",
  madurez: "madurez en el mercado",
};

function buildHighlights(sub: Record<Criterion, number>, weights: Record<Criterion, number>): string[] {
  // Criterios que más aportan a la nota en este perfil
  return (Object.keys(sub) as Criterion[])
    .filter((c) => weights[c] > 0 && sub[c] >= 70)
    .sort((a, b) => sub[b] * weights[b] - sub[a] * weights[a])
    .slice(0, 3)
    .map((c) => `Destaca en ${CRITERION_LABELS[c]} (${Math.round(sub[c])}/100)`);
}

// ───────────────────────────── Veredicto ─────────────────────────────

function decideVerdict(
  m: Monitor,
  score: number,
  exclusions: string[],
  budget: number,
): Pick<ScoredMonitor, "verdict" | "verdictReason" | "targetPrice"> {
  if (exclusions.length > 0) {
    return { verdict: "descartado", verdictReason: exclusions[0] };
  }
  if (score < SCORE_MIN) {
    return { verdict: "descartado", verdictReason: `Nota ${score}/100: no encaja con este perfil.` };
  }
  if (m.precio_eur <= budget && score >= SCORE_RECOMMENDED) {
    return { verdict: "recomendado", verdictReason: `Nota ${score}/100 dentro de presupuesto.` };
  }

  // 🟡 Con oferta: o se pasa de presupuesto (dentro de tolerancia) o la nota es justa para su precio.
  const target = Math.floor(
    m.precio_eur > budget ? budget : Math.min(budget, m.precio_eur * (score / SCORE_RECOMMENDED)),
  );
  const realistic = m.precio_minimo_historico_eur <= target;
  const why =
    m.precio_eur > budget
      ? `Se pasa ${m.precio_eur - budget} € del presupuesto.`
      : `Nota ${score}/100: solo compensa por debajo de su precio actual.`;
  return {
    verdict: "con_oferta",
    targetPrice: target,
    verdictReason: `${why} Cómpralo a ≤ ${target} €${
      realistic ? ` (ha estado a ${m.precio_minimo_historico_eur} €, es realista).` : " (nunca ha bajado tanto)."
    }`,
  };
}

function getConfidence(winner: ScoredMonitor | null, ranking: ScoredMonitor[]): Confidence | null {
  if (!winner) return null;
  const runnerUp = ranking.find((s) => s !== winner && s.verdict !== "descartado");
  const margin = runnerUp ? winner.score - runnerUp.score : 20;
  const penalties = winner.adjustments.filter((a) => a.delta < 0).length;
  const value = Math.round(
    clamp(
      winner.score * 0.8 + Math.min(Math.max(margin, 0), 20) * 0.75 - penalties * 3 - (winner.verdict === "con_oferta" ? 12 : 0),
      5,
      98,
    ),
  );
  const level: ConfidenceLevel = value >= 80 ? "alta" : value >= 60 ? "media" : "baja";

  let reason: string;
  if (winner.verdict === "con_oferta") {
    reason = `Es la mejor opción disponible, pero solo merece la pena a ≤ ${winner.targetPrice} €.`;
  } else if (!runnerUp) {
    reason = "Es el único monitor que cumple todos tus requisitos.";
  } else if (margin < 4) {
    reason = `Empate técnico con el ${runnerUp.monitor.marca} ${runnerUp.monitor.modelo}: ambos son buena compra.`;
  } else {
    reason = `Saca ${margin} puntos a la siguiente opción${penalties === 0 ? " y no tiene penalizaciones para tu uso" : ""}.`;
  }

  return { level, value, label: `Confianza ${level}`, reason };
}

// ───────────────────────────── API pública ─────────────────────────────

export function scoreMonitor(
  m: Monitor,
  profile: Profile,
  budget: number,
  eq: CurrentEquipment,
): ScoredMonitor {
  const weights = getProfileWeights(profile, budget);
  const ppi = getPpi(m);

  const subscores: Record<Criterion, number> = {
    imagen: scoreImagen(m, ppi, profile, budget),
    fluidez: scoreFluidez(m),
    conectividad: scoreConectividad(m),
    ergonomia: scoreErgonomia(m),
    valor: scoreValor(m, budget),
    madurez: scoreMadurez(m.meses_mercado),
  };
  for (const k of Object.keys(subscores) as Criterion[]) subscores[k] = Math.round(clamp(subscores[k]));

  const baseScore = (Object.keys(weights) as Criterion[]).reduce((acc, c) => acc + subscores[c] * weights[c], 0);
  const { adjustments, exclusions } = applyRules(m, ppi, profile, budget, eq);
  const sumDeltas = () => adjustments.reduce((acc, a) => acc + a.delta, 0);

  const bonus = compatibilityBonus(profile, ppi, baseScore + sumDeltas());
  if (bonus) adjustments.push(bonus);

  const score = Math.round(clamp(baseScore + sumDeltas()));
  const verdict = decideVerdict(m, score, exclusions, budget);
  const roundedPpi = Math.round(ppi);

  return {
    monitor: m,
    ppi: roundedPpi,
    subscores,
    baseScore: Math.round(baseScore),
    score,
    adjustments,
    exclusions,
    highlights: buildHighlights(subscores, weights),
    ...explain(m, { profile, budget, eq, ppi: roundedPpi, weights, adjustments }),
    ...verdict,
    verdictLabel: VERDICT_LABELS[verdict.verdict],
  };
}

const VERDICT_RANK: Record<Verdict, number> = { recomendado: 0, con_oferta: 1, descartado: 2 };

export function getRecommendation(
  profile: Profile,
  budget: number,
  currentEquipment: CurrentEquipment,
  catalog: Monitor[] = defaultCatalog,
): Recommendation {
  const ranking = catalog
    .map((m) => scoreMonitor(m, profile, budget, currentEquipment))
    .sort(
      (a, b) =>
        VERDICT_RANK[a.verdict] - VERDICT_RANK[b.verdict] ||
        b.score - a.score ||
        a.monitor.precio_eur - b.monitor.precio_eur,
    );

  const winner = ranking[0]?.verdict !== "descartado" ? ranking[0] : null;
  const worthWaiting =
    ranking
      .filter((s) => s.verdict === "con_oferta" && s !== winner && s.score >= (winner?.score ?? 0) + 5)
      .sort((a, b) => b.score - a.score)[0] ?? null;

  return {
    profile,
    budget,
    winner,
    worthWaiting,
    confidence: getConfidence(winner, ranking),
    ranking,
    weights: getProfileWeights(profile, budget),
    highBudget: budget > HIGH_BUDGET,
  };
}

// ───────────────────────────── Estado de precio ─────────────────────────────

export interface PriceStatus {
  status: "buen_precio" | "sobreprecio";
  label: string;
  detail: string;
}

export function getPriceStatus(m: Monitor): PriceStatus {
  const over = m.precio_eur - m.precio_minimo_historico_eur;
  const range = m.precio_lanzamiento_eur - m.precio_minimo_historico_eur;
  const positionInRange = range > 0 ? over / range : 1; // 0 = mínimo histórico, 1 = precio de lanzamiento

  if (m.precio_eur <= m.precio_minimo_historico_eur * GOOD_PRICE_MARGIN) {
    return {
      status: "buen_precio",
      label: "🟢 Buen precio",
      detail: over <= 0 ? "Está en su mínimo histórico." : `Solo ${over} € por encima de su mínimo histórico.`,
    };
  }
  if (positionInRange <= GOOD_PRICE_RANGE_POSITION) {
    return {
      status: "buen_precio",
      label: "🟢 Buen precio",
      detail: `Mucho más cerca de su mínimo (${m.precio_minimo_historico_eur} €) que de su lanzamiento (${m.precio_lanzamiento_eur} €).`,
    };
  }
  return {
    status: "sobreprecio",
    label: "🔴 Sobreprecio",
    detail: `${over} € por encima de su mínimo histórico (${m.precio_minimo_historico_eur} €). Si puedes, espera.`,
  };
}

// ───────────────────────────── Alternativas ─────────────────────────────

export interface Alternative {
  kind: "cheaper" | "gaming" | "work";
  title: string;
  item: ScoredMonitor | null;
  emptyReason: string;
}

/**
 * Dos alternativas para comparar con el ganador:
 * - 'Si quieres gastar menos': la mejor opción viable claramente más barata, en el mismo perfil.
 * - 'Si prefieres jugar': el ganador del perfil gaming (o 'Si también trabajas' si ya era gaming).
 */
export function getAlternatives(
  rec: Recommendation,
  currentEquipment: CurrentEquipment,
  catalog: Monitor[] = defaultCatalog,
): [Alternative, Alternative] {
  const winner = rec.winner;
  const viable = (s: ScoredMonitor) => s.verdict !== "descartado" && s.monitor.id !== winner?.monitor.id;

  const maxCheaper = winner ? winner.monitor.precio_eur - Math.max(50, winner.monitor.precio_eur * 0.15) : -1;
  const cheaper =
    rec.ranking.filter((s) => viable(s) && s.monitor.precio_eur <= maxCheaper).sort((a, b) => b.score - a.score)[0] ??
    null;

  const otherProfile: Profile = rec.profile === "gaming" ? "oficina" : "gaming";
  const other = getRecommendation(otherProfile, rec.budget, currentEquipment, catalog).ranking.find(viable) ?? null;

  return [
    {
      kind: "cheaper",
      title: "Si quieres gastar menos",
      item: cheaper,
      emptyReason: "Ya es la opción más económica que podemos recomendarte con garantías.",
    },
    {
      kind: rec.profile === "gaming" ? "work" : "gaming",
      title: rec.profile === "gaming" ? "Si también trabajas" : "Si prefieres jugar",
      item: other,
      emptyReason:
        rec.profile === "gaming"
          ? "Ningún otro monitor de este presupuesto encaja mejor para trabajar."
          : "Con este presupuesto no hay un monitor gaming que merezca la pena.",
    },
  ];
}
