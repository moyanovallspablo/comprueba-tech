import type { CurrentEquipment, Monitor, Profile } from "@/types/monitor";
import type { Adjustment, Criterion } from "./calculator";

/**
 * Traduce especificaciones + reglas aplicadas a lenguaje humano:
 * - interpretation: lo que ganas (checks verdes)
 * - sacrifices: lo que cedes (alertas)
 * Cada punto se ordena por la importancia de su criterio en el perfil.
 */

interface Point {
  text: string;
  criterion: Criterion;
  strength: number; // 0–1, relevancia del hecho por sí mismo
  topic?: string; // para no repetir algo que ya explica una regla
}

// Reglas del calculador → tema que ya explican (evita duplicar con los hechos).
const RULE_TOPICS: Record<string, string> = {
  mac_sin_pd: "usbc",
  mac_pd_insuficiente: "usbc",
  mac_escalado: "ppi",
  gaming_hz_bajos: "hz",
  gaming_sin_vrr: "vrr",
  gaming_gpu: "gpu",
  oficina_oled: "oled",
  oficina_sin_altura: "altura",
  mesa_justa: "fondo",
  mejora_marginal: "mejora",
};

const RULE_CRITERION: Record<string, Criterion> = {
  mac_sin_pd: "conectividad",
  mac_pd_insuficiente: "conectividad",
  mac_escalado: "imagen",
  gaming_hz_bajos: "fluidez",
  gaming_sin_vrr: "fluidez",
  gaming_gpu: "fluidez",
  oficina_oled: "imagen",
  oficina_sin_altura: "ergonomia",
  mesa_justa: "ergonomia",
  mejora_marginal: "valor",
};

const fmt = (n: number) => n.toLocaleString("es-ES");

function rank(points: Point[], weights: Record<Criterion, number>, max: number): string[] {
  return points
    .map((p, i) => ({ ...p, i, w: p.strength * (weights[p.criterion] + 0.1) }))
    .sort((a, b) => b.w - a.w || a.i - b.i)
    .slice(0, max)
    .map((p) => p.text);
}

export function explain(
  m: Monitor,
  ctx: {
    profile: Profile;
    budget: number;
    eq: CurrentEquipment;
    ppi: number;
    weights: Record<Criterion, number>;
    adjustments: Adjustment[];
  },
): { interpretation: string[]; sacrifices: string[] } {
  const { profile, budget, eq, ppi, weights, adjustments } = ctx;
  const oled = m.panel === "QD-OLED";
  const e = m.ergonomia;

  // ── Lo que ganas ──
  const pros: Point[] = [];
  if (ppi >= 200) {
    pros.push({
      criterion: "imagen",
      strength: 1,
      text:
        profile === "mac"
          ? `Retina de verdad (${ppi} ppi): macOS a 2× nativo, sin escalado ni texto borroso.`
          : `Nitidez extrema (${ppi} ppi): texto de imprenta.`,
    });
  } else if (ppi >= 150) {
    pros.push({ criterion: "imagen", strength: 0.7, text: `Alta densidad (${ppi} ppi): texto muy nítido.` });
  }
  if (oled) pros.push({ criterion: "imagen", strength: 0.9, text: "QD-OLED: negros puros y contraste infinito." });
  if (m.panel === "IPS Black")
    pros.push({ criterion: "imagen", strength: 0.6, text: "IPS Black: el doble de contraste que un IPS convencional." });
  if (m.cobertura_dci_p3 >= 95)
    pros.push({
      criterion: "imagen",
      strength: 0.6,
      text: `${m.cobertura_dci_p3}% DCI-P3${m.calibrado_fabrica ? " y calibrado de fábrica" : ""}: color fiel para foto y vídeo.`,
    });
  if (m.hz >= 144)
    pros.push({
      criterion: "fluidez",
      strength: m.hz >= 200 ? 1 : 0.8,
      text: `${m.hz} Hz${m.tiempo_respuesta_ms <= 0.1 ? ` y ${fmt(m.tiempo_respuesta_ms)} ms de respuesta` : ""}: movimiento limpio en juegos y scroll.`,
    });
  else if (m.hz >= 100)
    pros.push({ criterion: "fluidez", strength: 0.5, text: `${m.hz} Hz: scroll y ventanas más suaves que a 60 Hz.` });
  if (m.usbC_PD_watts >= 65)
    pros.push({
      criterion: "conectividad",
      strength: eq.dispositivo === "portatil" ? 1 : 0.4,
      text: `Un solo cable USB-C: imagen, datos y ${m.usbC_PD_watts} W de carga.`,
    });
  if (m.thunderbolt) pros.push({ criterion: "conectividad", strength: 0.7, text: "Thunderbolt: un hub completo detrás del monitor." });
  if (m.ethernet) pros.push({ criterion: "conectividad", strength: 0.5, text: "Red por cable (RJ45) integrada." });
  if (m.kvm) pros.push({ criterion: "conectividad", strength: 0.5, text: "KVM: un teclado y ratón para dos ordenadores." });
  if (m.webcam && m.altavoces)
    pros.push({ criterion: "conectividad", strength: 0.5, text: "Cámara y altavoces integrados: cero accesorios." });
  if (m.tipo_soporte === "brazo-abrazadera")
    pros.push({ criterion: "ergonomia", strength: 1, text: "Brazo articulado con abrazadera: libera la mesa entera." });
  else if (e.altura_mm >= 110 && e.giro && e.pivote)
    pros.push({ criterion: "ergonomia", strength: 0.9, text: "Ergonomía completa: altura, giro y pivote vertical." });
  if (m.relacion_aspecto !== "16:9")
    pros.push({
      criterion: profile === "gaming" ? "fluidez" : "imagen",
      strength: 0.6,
      text: `Formato ${m.relacion_aspecto}: inmersión total y sitio para varias ventanas.`,
    });
  if (m.precio_eur <= m.precio_minimo_historico_eur * 1.05)
    pros.push({ criterion: "valor", strength: 1, text: "Está en su precio mínimo histórico (o casi)." });
  if (m.precio_eur <= budget * 0.7)
    pros.push({ criterion: "valor", strength: 0.8, text: `Te sobran ${fmt(budget - m.precio_eur)} € de tu presupuesto.` });
  if (m.meses_mercado >= 6 && m.meses_mercado <= 30)
    pros.push({ criterion: "madurez", strength: 0.5, text: "Modelo maduro: firmware pulido y sin sobreprecio de lanzamiento." });

  // ── Lo que cedes ──
  const covered = new Set(adjustments.filter((a) => a.delta < 0).map((a) => RULE_TOPICS[a.rule]));
  const cons: Point[] = adjustments
    .filter((a) => a.delta < 0)
    .map((a) => ({
      text: a.reason,
      criterion: RULE_CRITERION[a.rule] ?? "valor",
      strength: Math.min(1, 0.5 + Math.abs(a.delta) / 20),
    }));
  const con = (p: Point) => {
    if (!p.topic || !covered.has(p.topic)) cons.push(p);
  };

  if (m.precio_eur > budget)
    con({ criterion: "valor", strength: 1, text: `Supera tu presupuesto en ${fmt(m.precio_eur - budget)} €.` });
  if (m.hz <= 75 && profile !== "gaming")
    con({ criterion: "fluidez", strength: 0.6, topic: "hz", text: `${m.hz} Hz: perfecto para trabajar, flojo para jugar.` });
  if (!m.usbC)
    con({ criterion: "conectividad", strength: 0.7, topic: "usbc", text: "Sin USB-C: conexión por HDMI o DisplayPort." });
  else if (m.usbC_PD_watts < 60)
    con({
      criterion: "conectividad",
      strength: 0.7,
      topic: "usbc",
      text: `USB-C con solo ${m.usbC_PD_watts} W: no carga un portátil exigente.`,
    });
  if (e.altura_mm === 0 && m.tipo_soporte === "peana")
    con({ criterion: "ergonomia", strength: 0.8, topic: "altura", text: "Peana sin ajuste de altura." });
  if (!m.vesa && m.tipo_soporte === "peana")
    con({ criterion: "ergonomia", strength: 0.5, text: "Sin anclaje VESA: no admite brazo de monitor." });
  if (oled && profile !== "oficina")
    con({
      criterion: "imagen",
      strength: 0.5,
      topic: "oled",
      text: `Brillo SDR modesto (${m.brillo_nits} nits) y conviene ocultar barras fijas para evitar retención.`,
    });
  if (profile === "gaming" && (m.panel === "IPS" || m.panel === "Fast IPS"))
    con({ criterion: "imagen", strength: 0.5, text: "Contraste IPS (~1000:1): negros grisáceos a oscuras." });
  if (m.ancho_cm > 80)
    con({ criterion: "ergonomia", strength: 0.7, text: `Ocupa ${fmt(m.ancho_cm)} cm de ancho: necesitas una mesa grande.` });
  if (m.peana_profundidad_cm > 28)
    con({
      criterion: "ergonomia",
      strength: 0.5,
      topic: "fondo",
      text: `Peana profunda: ocupa ${fmt(m.peana_profundidad_cm)} cm de fondo.`,
    });
  if (ppi < 100)
    con({ criterion: "imagen", strength: 0.6, topic: "ppi", text: `Densidad baja (${ppi} ppi): el píxel se nota a corta distancia.` });
  if (m.meses_mercado > 48)
    con({
      criterion: "madurez",
      strength: 0.6,
      text: `Lleva ${Math.floor(m.meses_mercado / 12)} años a la venta: puede llegar un sucesor.`,
    });
  if (m.hdr === "DisplayHDR 400" || m.hdr === "HDR10")
    con({ criterion: "imagen", strength: 0.35, text: `${m.hdr} es testimonial: no esperes un HDR de verdad.` });
  if (m.precio_eur <= budget && m.precio_eur > m.precio_minimo_historico_eur * 1.1)
    con({
      criterion: "valor",
      strength: 0.45,
      text: `Ha estado a ${fmt(m.precio_minimo_historico_eur)} €: si no tienes prisa, puede volver a bajar.`,
    });
  if (!m.altavoces) con({ criterion: "conectividad", strength: 0.25, text: "Sin altavoces integrados." });

  return { interpretation: rank(pros, weights, 4), sacrifices: rank(cons, weights, 3) };
}
