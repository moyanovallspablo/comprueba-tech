import { Briefcase, Gamepad2, Laptop, type LucideIcon } from "lucide-react";
import type { CurrentEquipment, GpuTier, Profile } from "@/types/monitor";

export interface Setup {
  profile: Profile | null;
  budget: number;
  dispositivo: CurrentEquipment["dispositivo"];
  gpu: GpuTier;
  monitorActualId: string;
  mesaFondo: string; // cm, vacío = sin límite
  mesaAncho: string; // cm, vacío = sin límite
  completed: boolean; // el usuario ha terminado el wizard al menos una vez
  gpuAutoAdjusted: boolean; // la GPU se subió sola al pasar a gaming (se avisa en la UI)
}

export const INITIAL_SETUP: Setup = {
  profile: null,
  budget: 500,
  dispositivo: "portatil",
  gpu: "integrada",
  monitorActualId: "none",
  mesaFondo: "",
  mesaAncho: "",
  completed: false,
  gpuAutoAdjusted: false,
};

/** GPU que asumimos al pasar a gaming con gráfica integrada (una RTX 4060 o equivalente). */
export const GAMING_DEFAULT_GPU: GpuTier = "media";

/**
 * Única puerta de entrada para cambiar el setup. Centraliza las reglas entre campos:
 * - Pasar a 'gaming' con GPU integrada la sube a gama media: con una integrada casi ningún monitor
 *   gaming tendría sentido y el motor daría falsas penalizaciones de 'Confianza baja'.
 * - Si el usuario elige GPU a mano, se respeta y desaparece el aviso.
 */
export function applySetupPatch(prev: Setup, patch: Partial<Setup>): Setup {
  const next = { ...prev, ...patch };
  if (patch.gpu !== undefined) {
    next.gpuAutoAdjusted = false;
  } else if (patch.profile === "gaming" && prev.profile !== "gaming" && next.gpu === "integrada") {
    next.gpu = GAMING_DEFAULT_GPU;
    next.gpuAutoAdjusted = true;
  } else if (patch.profile !== undefined && patch.profile !== "gaming") {
    next.gpuAutoAdjusted = false;
  }
  return next;
}

export const PROFILE_OPTIONS: { id: Profile; label: string; description: string; icon: LucideIcon }[] = [
  { id: "mac", label: "Mac", description: "MacBook, Mac mini o Studio. Nitidez Retina y un solo cable.", icon: Laptop },
  { id: "gaming", label: "Gaming", description: "Fluidez, respuesta y que tu gráfica lo pueda mover.", icon: Gamepad2 },
  { id: "oficina", label: "Oficina", description: "Jornadas largas: ergonomía, conectividad y buen precio.", icon: Briefcase },
];

export const BUDGET_MIN = 100;
export const BUDGET_MAX = 2500;

export const BUDGET_PRESETS = [
  { label: "Ajustado", value: 200 },
  { label: "Equilibrado", value: 400 },
  { label: "Avanzado", value: 700 },
  { label: "Premium", value: 1200 },
  { label: "Sin límites", value: 2500 },
];

export const GPU_OPTIONS: { id: GpuTier; label: string; hint: string }[] = [
  { id: "integrada", label: "Integrada", hint: "Apple M, Intel Iris" },
  { id: "media", label: "Media", hint: "RTX 4060 · RX 7600" },
  { id: "alta", label: "Alta", hint: "RTX 4080 o superior" },
];

export const CURRENT_MONITORS: { id: string; label: string; value?: CurrentEquipment["monitor_actual"] }[] = [
  { id: "none", label: "Ninguno" },
  { id: "24-1080-60", label: '24" 1080p 60 Hz', value: { pulgadas: 24, resolucion_alto: 1080, hz: 60 } },
  { id: "24-1080-144", label: '24" 1080p 144 Hz', value: { pulgadas: 24, resolucion_alto: 1080, hz: 144 } },
  { id: "27-1440-60", label: '27" 1440p 60 Hz', value: { pulgadas: 27, resolucion_alto: 1440, hz: 60 } },
  { id: "27-1440-165", label: '27" 1440p 165 Hz', value: { pulgadas: 27, resolucion_alto: 1440, hz: 165 } },
  { id: "27-2160-60", label: '27" 4K 60 Hz', value: { pulgadas: 27, resolucion_alto: 2160, hz: 60 } },
];

export function toEquipment(s: Setup): CurrentEquipment {
  return {
    dispositivo: s.dispositivo,
    gpu: s.gpu,
    profundidad_mesa_cm: Number(s.mesaFondo) || undefined,
    ancho_mesa_cm: Number(s.mesaAncho) || undefined,
    monitor_actual: CURRENT_MONITORS.find((m) => m.id === s.monitorActualId)?.value,
  };
}

export const eur = (n: number) => `${n.toLocaleString("es-ES")} €`;
