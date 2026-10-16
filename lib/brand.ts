/**
 * Paleta de marca para contextos que no leen variables CSS (three.js / WebGL, SVG generados).
 * Espejo de los tokens `--brand-*` de app/globals.css: si cambias uno, cambia el otro.
 */
export const BRAND = {
  primary: "#059669", // --brand-primary
  primaryStrong: "#047857", // --brand-primary-strong (relleno con texto blanco, AA)
  primaryDeep: "#065F46", // --brand-primary-deep (hover de rellenos con texto blanco, AA)
  accent: "#10B981", // --brand-accent
  glow: "rgba(16, 185, 129, 0.12)", // --brand-glow
  borderGlow: "rgba(16, 185, 129, 0.3)", // --brand-border-glow
} as const;
