import { getMonitor } from "@/data/monitors";
import type { Profile } from "@/types/monitor";

/** Precio actual del catálogo, para que las preguntas no se queden desfasadas al refrescar precios. */
const price = (id: string) => getMonitor(id)?.precio_eur ?? 0;

/**
 * Comparativas destacadas (enlazadas desde el hub /comparar y el buscador). Cada una lleva el perfil
 * para el que se precalcula su veredicto rápido y la pregunta que responde.
 */
export interface PopularComparison {
  a: string;
  b: string;
  question: string;
  profile: Profile;
}

export const POPULAR_COMPARISONS: PopularComparison[] = [
  { a: "dell-u2724de", b: "lg-27gr83q", question: "¿Trabajar con un cable o jugar a 240 Hz?", profile: "oficina" },
  { a: "apple-studio-display", b: "dell-u2724de", question: "¿Merece la pena el 5K para un Mac?", profile: "mac" },
  { a: "alienware-aw3423dwf", b: "samsung-g9-oled", question: "Ultrawide OLED: ¿34\" o 49\"?", profile: "gaming" },
  { a: "lg-27gr83q", b: "aoc-24g2spu", question: "Gaming económico: ¿1440p o 1080p?", profile: "gaming" },
  { a: "apple-studio-display", b: "apple-studio-display-regulable", question: `¿Pagar ${price("apple-studio-display-regulable") - price("apple-studio-display")} € más por el soporte regulable?`, profile: "mac" },
  { a: "asus-pa278cv", b: "dell-u2724de", question: `USB-C para portátil: ¿${price("asus-pa278cv")} € o ${price("dell-u2724de")} €?`, profile: "oficina" },
  { a: "lg-32un880", b: "gigabyte-m28u", question: "4K para productividad: ¿brazo o 144 Hz?", profile: "oficina" },
  { a: "msi-pro-mp241x", b: "aoc-24g2spu", question: "Oficina por menos de 200 €", profile: "oficina" },
];
