/** Preferencia del sistema "Reducir movimiento" (solo en cliente; en servidor siempre false). */
export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/** Para scrollTo / scrollIntoView: desplazamiento suave solo si el usuario no pide reducir movimiento. */
export function scrollBehavior(): ScrollBehavior {
  return prefersReducedMotion() ? "auto" : "smooth";
}
