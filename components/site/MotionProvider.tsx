"use client";

import { MotionConfig, MotionGlobalConfig } from "motion/react";
import type { ReactNode } from "react";
import { REDUCED_MOTION_QUERY } from "@/lib/motion";

// Con "Reducir movimiento" activo, toda animación de Motion (también height, width, filter o
// strokeDashoffset, que MotionConfig no cubre) salta a su estado final. Se fija al evaluar el módulo,
// antes del primer render en cliente, para que tampoco se animen las entradas iniciales.
if (typeof window !== "undefined") {
  const mq = window.matchMedia(REDUCED_MOTION_QUERY);
  const sync = () => {
    MotionGlobalConfig.instantAnimations = mq.matches;
  };
  sync();
  mq.addEventListener("change", sync);
}

/** Raíz de Motion para toda la app: respeta prefers-reduced-motion (transforms y layout incluidos). */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
