"use client";

import { useEffect, useRef, type MouseEvent, type ReactNode } from "react";
import { prefersReducedMotion } from "@/lib/motion";

const HOVER_QUERY = "(hover: hover) and (pointer: fine)";

/**
 * Escenario del hero: aura de marca de fondo y un foco que sigue al cursor. El contenido (titular, buscador,
 * píldoras) llega como `children` desde el servidor, así que la portada sigue siendo estática.
 *
 * El foco no re-renderiza React: cada movimiento escribe dos variables CSS (--spot-x/--spot-y, desplazamiento en
 * px respecto a su punto de reposo) en un único requestAnimationFrame, y la transición CSS del transform lo suaviza.
 */
export function HeroStage({ children }: { children: ReactNode }) {
  const spot = useRef<HTMLDivElement>(null);
  const frame = useRef(0);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const place = (dx: number, dy: number, active: boolean) => {
    const el = spot.current;
    if (!el) return;
    el.style.setProperty("--spot-x", `${dx}px`);
    el.style.setProperty("--spot-y", `${dy}px`);
    el.dataset.active = String(active);
  };

  const onMouseMove = (e: MouseEvent<HTMLElement>) => {
    // En táctil un toque emite un mousemove sintético y el foco se quedaría clavado donde se tocó.
    if (prefersReducedMotion() || !window.matchMedia(HOVER_QUERY).matches) return;
    const rect = e.currentTarget.getBoundingClientRect();
    // Reposo del foco: centro horizontal, 40 % de la altura (detrás del titular).
    const dx = e.clientX - rect.left - rect.width / 2;
    const dy = e.clientY - rect.top - rect.height * 0.4;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => place(dx, dy, true));
  };

  const onMouseLeave = () => {
    cancelAnimationFrame(frame.current);
    place(0, 0, false);
  };

  return (
    <section
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className="relative isolate -mt-12 pt-12 sm:-mt-20 sm:pt-20"
    >
      <div aria-hidden className="pointer-events-none absolute -inset-x-24 -bottom-16 top-0 -z-10">
        <div className="bg-dot-grid absolute inset-0" />
        <div className="absolute left-0 top-8 size-80 rounded-full bg-gradient-to-br from-emerald-400/25 via-teal-300/20 to-transparent blur-3xl motion-safe:animate-aura sm:left-24 sm:size-112" />
        <div className="absolute bottom-0 right-0 size-80 rounded-full bg-gradient-to-tl from-emerald-400/25 via-teal-300/20 to-transparent blur-3xl motion-safe:animate-aura motion-safe:[animation-delay:-9s] sm:right-24 sm:size-112" />
        {/* Foco del cursor. Sin seguimiento con movimiento reducido (oculto) ni en pantallas táctiles (no hay hover). */}
        <div
          ref={spot}
          data-active="false"
          style={{ transform: "translate3d(calc(-50% + var(--spot-x, 0px)), calc(-50% + var(--spot-y, 0px)), 0)" }}
          className="absolute left-1/2 top-[40%] size-112 rounded-full bg-emerald-400/20 opacity-50 blur-[100px] transition-[transform,opacity] duration-700 ease-out-soft data-[active=true]:opacity-100 motion-reduce:hidden"
        />
      </div>
      <div className="relative mx-auto max-w-3xl px-1 text-center">{children}</div>
    </section>
  );
}
