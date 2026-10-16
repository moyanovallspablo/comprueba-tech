import { useId } from "react";
import { BRAND } from "@/lib/brand";

/**
 * Isotipo de comprueba.tech: un check estilizado cuyo trazo final se alarga como una aguja de medición,
 * con un punto de foco menta en el extremo (el mismo que marca las cotas del visor 3D).
 */
export function BrandMark({ size = 28, className }: { size?: number; className?: string }) {
  const id = useId(); // el isotipo aparece varias veces por página (cabecera y pie)
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden>
      <defs>
        <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={BRAND.accent} />
          <stop offset="100%" stopColor={BRAND.primaryStrong} />
        </linearGradient>
        <radialGradient id={`${id}-sheen`} cx="0.25" cy="0.15" r="0.9">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="60%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${id}-fill)`} />
      <rect width="32" height="32" rx="9" fill={`url(#${id}-sheen)`} />
      <path d="M8.5 16.5 L13.5 21.5 L24 9.5" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="24" cy="9.5" r="2.4" fill="#ecfdf5" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={className}>
      comprueba<span className="text-brand">.tech</span>
    </span>
  );
}
