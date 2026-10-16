"use client";

import Image from "next/image";
import { Monitor as MonitorIcon } from "lucide-react";
import { useState } from "react";
import { cx } from "@/components/advisor/ui";
import type { Monitor } from "@/types/monitor";
import { MonitorIllustration } from "./MonitorIllustration";

type Status = "loading" | "loaded" | "error";

/**
 * Fotografía de producto con respaldo. Mientras carga se ve un marco degradado con un icono sutil; si la imagen
 * falla (o aún no existe en /public/monitors) se dibuja la ilustración a escala real.
 *
 * `priority`: "preload" para la única imagen LCP de la página; "high" cuando hay varias candidatas en el primer
 * pantallazo (Next 16 desaconseja `preload` en ese caso y `priority` está deprecado).
 */
export function MonitorImage({
  monitor: m,
  sizes,
  priority,
  caption,
  className,
}: {
  monitor: Monitor;
  sizes: string;
  priority?: "preload" | "high";
  /** Pie bajo la imagen; si se muestra la ilustración se antepone «Ilustración a escala real». */
  caption?: string;
  className?: string;
}) {
  // El estado va ligado a la URL para reiniciarse si el mismo componente pasa a otro monitor.
  const [state, setState] = useState<{ src: string; status: Status }>({ src: m.imageUrl, status: "loading" });
  const status = state.src === m.imageUrl ? state.status : "loading";
  const set = (next: Status) =>
    // Un error tiene prioridad: next/image puede disparar onLoad antes que onError si la imagen falló antes de hidratar.
    setState((s) => ({ src: m.imageUrl, status: s.src === m.imageUrl && s.status === "error" ? "error" : next }));

  return (
    <>
      <div className={cx("relative", className)}>
        {status === "error" ? (
          <MonitorIllustration monitor={m} className="absolute inset-0 size-full" />
        ) : (
          <>
            {status === "loading" && (
              <div
                aria-hidden
                className="absolute inset-[8%] grid place-items-center rounded-2xl bg-gradient-to-br from-white via-canvas to-zinc-200/60 ring-1 ring-inset ring-hairline motion-safe:animate-pulse"
              >
                <MonitorIcon className="size-8 text-zinc-300" strokeWidth={1.25} />
              </div>
            )}
            <Image
              src={m.imageUrl}
              alt={`${m.marca} ${m.modelo}`}
              fill
              sizes={sizes}
              preload={priority === "preload"}
              fetchPriority={priority === "high" ? "high" : undefined}
              loading={priority === "high" ? "eager" : undefined}
              onLoad={(e) => set(e.currentTarget.naturalWidth > 0 ? "loaded" : "error")}
              onError={() => set("error")}
              className={cx(
                "object-contain transition-opacity duration-500 ease-out-soft",
                status === "loaded" ? "opacity-100" : "opacity-0",
              )}
            />
          </>
        )}
      </div>
      {caption && (
        <p className="mt-2 text-center font-mono text-[11px] text-zinc-500">
          {status === "error" ? `Ilustración a escala real · ${caption}` : caption}
        </p>
      )}
    </>
  );
}
