"use client";

import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "motion/react";
import { Box, Layers, Move3d, Ruler, X, Columns2 } from "lucide-react";
import { Component, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { CURRENT_MONITORS } from "@/components/advisor/setup";
import { Card, Eyebrow, brandButtonBase, cx } from "@/components/advisor/ui";
import { getMonitor } from "@/data/monitors";
import {
  DESK_LIMITS,
  fitOnDesk,
  formatDeltaCm,
  physicalFromMonitor,
  physicalGeneric,
  sanitizeDesk,
  spatialDelta,
  type Desk,
  type PhysicalMonitor,
} from "@/lib/physical";
import { scrollBehavior } from "@/lib/motion";
import { SPATIAL_ANCHOR } from "@/lib/routes";
import { updateSetup, useSetup } from "@/lib/setup-store";
import type { SpatialLayout } from "./SpatialDeltaCanvas";

// three + R3F solo se descargan cuando el usuario abre el visor (chunk aparte, sin SSR).
const SpatialDeltaCanvas = dynamic(() => import("./SpatialDeltaCanvas"), {
  ssr: false,
  loading: () => <CanvasLoading />,
});

type PanelProps =
  | { variant: "product"; monitorId: string }
  | { variant: "compare"; aId: string; bId: string };

const EASE = [0.22, 1, 0.36, 1] as const;

let webglCache: boolean | null = null;
function hasWebGL(): boolean {
  if (webglCache !== null) return webglCache;
  try {
    const canvas = document.createElement("canvas");
    webglCache = !!(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    webglCache = false;
  }
  return webglCache;
}

const subscribeHash = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};

function useHash(): string {
  return useSyncExternalStore(subscribeHash, () => window.location.hash, () => "");
}

export function SpatialDeltaPanel(props: PanelProps) {
  const setup = useSetup();
  const [userOpen, setUserOpen] = useState<boolean | null>(null); // null = sin decisión del usuario
  const [layout, setLayout] = useState<SpatialLayout>("overlay");
  const [triedWithoutWebGL, setTriedWithoutWebGL] = useState(false);

  // Si la URL trae #espacio-3d y el usuario no ha abierto/cerrado a mano, el visor arranca abierto.
  const wantsFromHash = useHash() === `#${SPATIAL_ANCHOR}` && userOpen === null;
  const open = userOpen ?? (wantsFromHash && hasWebGL());
  const unsupported = triedWithoutWebGL || (wantsFromHash && !hasWebGL());
  const setOpen = setUserOpen;

  // El ancla llega antes que el contenido en streaming, así que el navegador no puede desplazarse solo:
  // al abrirse desde #espacio-3d, el panel se pone a la vista.
  useEffect(() => {
    if (wantsFromHash) document.getElementById(SPATIAL_ANCHOR)?.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
  }, [wantsFromHash]);

  const desk: Desk = sanitizeDesk(setup.mesaAncho || undefined, setup.mesaFondo || undefined);

  // A: monitor A de la comparativa o, en la ficha, el monitor actual del usuario. B: el nuevo.
  const refId = props.variant === "compare" ? props.aId : null;
  const newId = props.variant === "compare" ? props.bId : props.monitorId;
  const { a, b } = useMemo(() => {
    const current = CURRENT_MONITORS.find((m) => m.id === setup.monitorActualId);
    const reference = refId
      ? physicalFromMonitor(getMonitor(refId)!)
      : current?.value
        ? physicalGeneric(current.value.pulgadas, `Tu monitor actual (${current.label})`)
        : null;
    return { a: reference, b: physicalFromMonitor(getMonitor(newId)!) };
  }, [refId, newId, setup.monitorActualId]);

  const launch = () => {
    if (!hasWebGL()) {
      setTriedWithoutWebGL(true);
      return;
    }
    setOpen(true);
  };

  const title = props.variant === "product" ? "¿Cómo quedará en tu mesa?" : "Comparativa de espacio en 3D";

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 sm:px-8">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-brand-accent to-brand-strong text-white shadow-glow-sm">
            <Move3d className="size-5" />
          </span>
          <div>
            <Eyebrow>Spatial Delta · 3D</Eyebrow>
            <h2 className="mt-0.5 text-lg font-semibold tracking-tight text-ink">{title}</h2>
          </div>
        </div>
        {open ? (
          <button
            onClick={() => setOpen(false)}
            className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm text-zinc-500 transition hover:bg-black/[0.04] hover:text-ink"
          >
            <X className="size-4" /> Cerrar visor
          </button>
        ) : (
          <button
            onClick={launch}
            className={cx(brandButtonBase, "px-4 py-2.5 text-sm")}
          >
            <Box className="size-4" />
            {props.variant === "product" ? "Ver en mi mesa en 3D" : "Ver comparativa de espacio en 3D"}
          </button>
        )}
      </div>

      {!open && (
        <p className="-mt-2 px-6 pb-6 text-sm text-zinc-500 sm:px-8">
          {unsupported
            ? "Tu navegador no tiene WebGL activado, así que no podemos mostrar la escena 3D. El resumen de medidas de abajo sigue siendo exacto."
            : a
              ? `Escritorio virtual de ${desk.anchoCm}×${desk.fondoCm} cm con ${shortLabel(a)} y ${shortLabel(b)} a escala real.`
              : `Escritorio virtual de ${desk.anchoCm}×${desk.fondoCm} cm con el monitor a escala real.`}
        </p>
      )}

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="px-3 sm:px-4">
              <div
                className="relative h-96 overflow-hidden rounded-2xl bg-gradient-to-b from-white to-canvas ring-1 ring-hairline sm:h-120"
                role="img"
                aria-label={sceneDescription(a, b, desk)}
              >
                <SceneErrorBoundary>
                  <SpatialDeltaCanvas a={a} b={b} desk={desk} layout={layout} />
                </SceneErrorBoundary>
                <Legend a={a} b={b} />
                <p className="pointer-events-none absolute bottom-3 right-4 hidden text-[11px] text-zinc-500 sm:block">
                  Arrastra para rotar · rueda o pellizco para zoom
                </p>
              </div>
            </div>

            <div className="grid gap-6 p-6 sm:px-8 lg:grid-cols-[1fr_1.3fr]">
              <Controls
                desk={desk}
                hasReference={a !== null}
                layout={layout}
                onLayout={setLayout}
                showCurrentPicker={props.variant === "product"}
                currentId={setup.monitorActualId}
              />
              <DeltaSummary a={a} b={b} desk={desk} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!open && <div className="border-t border-hairline px-6 py-6 sm:px-8"><DeltaSummary a={a} b={b} desk={desk} compact /></div>}
    </Card>
  );
}

// ───────────────────────────── Controles ─────────────────────────────

function Controls({
  desk,
  hasReference,
  layout,
  onLayout,
  showCurrentPicker,
  currentId,
}: {
  desk: Desk;
  hasReference: boolean;
  layout: SpatialLayout;
  onLayout: (l: SpatialLayout) => void;
  showCurrentPicker: boolean;
  currentId: string;
}) {
  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 flex items-center gap-2 text-xs font-medium text-zinc-500">
          <Ruler className="size-3.5" /> Tu mesa
        </p>
        <DeskSlider
          label="Ancho"
          value={desk.anchoCm}
          range={DESK_LIMITS.ancho}
          onChange={(v) => updateSetup({ mesaAncho: String(v) })}
        />
        <DeskSlider
          label="Fondo"
          value={desk.fondoCm}
          range={DESK_LIMITS.fondo}
          onChange={(v) => updateSetup({ mesaFondo: String(v) })}
        />
        <p className="mt-2 text-[11px] text-zinc-500">Se guarda en Mi Setup y el motor lo tiene en cuenta.</p>
      </div>

      {showCurrentPicker && (
        <div>
          <p className="mb-2 text-xs font-medium text-zinc-500">Compáralo con tu monitor actual</p>
          <div className="flex flex-wrap gap-2">
            {CURRENT_MONITORS.map((m) => (
              <button
                key={m.id}
                onClick={() => updateSetup({ monitorActualId: m.id })}
                aria-pressed={currentId === m.id}
                className={cx(
                  "rounded-full px-3 py-1.5 font-mono text-[11px] ring-1 transition",
                  currentId === m.id
                    ? "bg-brand-glow text-brand-strong ring-brand"
                    : "bg-white text-zinc-600 ring-hairline hover:ring-black/15",
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {hasReference && (
        <div>
          <p className="mb-2 text-xs font-medium text-zinc-500">Vista</p>
          <div className="inline-flex rounded-full bg-canvas p-1">
            {(
              [
                { id: "overlay", label: "Superpuestos", icon: Layers },
                { id: "side", label: "Lado a lado", icon: Columns2 },
              ] as const
            ).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => onLayout(id)}
                aria-pressed={layout === id}
                className={cx(
                  "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition",
                  layout === id ? "bg-white text-ink shadow-elevated" : "text-zinc-500 hover:text-ink",
                )}
              >
                <Icon className="size-3.5" /> {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DeskSlider({
  label,
  value,
  range,
  onChange,
}: {
  label: string;
  value: number;
  range: readonly [number, number];
  onChange: (v: number) => void;
}) {
  const fill = ((value - range[0]) / (range[1] - range[0])) * 100;
  return (
    <label className="flex items-center gap-3 py-1.5">
      <span className="w-12 text-xs text-zinc-500">{label}</span>
      <input
        type="range"
        min={range[0]}
        max={range[1]}
        step={5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="range-brand flex-1"
        style={{ "--fill": `${fill}%` } as React.CSSProperties}
      />
      <span className="w-14 text-right font-mono text-xs text-ink">{value} cm</span>
    </label>
  );
}

// ───────────────────────────── Resumen numérico ─────────────────────────────

function DeltaSummary({
  a,
  b,
  desk,
  compact,
}: {
  a: PhysicalMonitor | null;
  b: PhysicalMonitor;
  desk: Desk;
  compact?: boolean;
}) {
  const fitA = a ? fitOnDesk(a, desk) : null;
  const fitB = fitOnDesk(b, desk);
  const d = a ? spatialDelta(a, b) : null;

  const rows: { label: string; a?: string; b: string; delta?: string; bad?: boolean }[] = [
    { label: "Ancho", a: a ? cm(a.anchoCm) : undefined, b: cm(b.anchoCm), delta: d ? formatDeltaCm(d.anchoCm) : undefined, bad: !fitB.cabeAncho },
    { label: "Alto ≈", a: a ? cm(a.altoCm) : undefined, b: cm(b.altoCm), delta: d ? formatDeltaCm(d.altoCm) : undefined },
    {
      label: "Fondo peana",
      a: a ? cm(a.fondoPeanaCm) : undefined,
      b: b.soporte === "brazo-abrazadera" ? "brazo" : cm(b.fondoPeanaCm),
      delta: d ? formatDeltaCm(d.fondoCm) : undefined,
    },
    {
      label: "Libre delante",
      a: fitA ? cm(fitA.libreDelanteCm) : undefined,
      b: cm(fitB.libreDelanteCm),
      delta: d ? formatDeltaCm(-d.fondoCm) : undefined,
      bad: !fitB.cabeFondo,
    },
  ];

  if (compact) {
    return (
      <dl className="flex flex-wrap gap-x-6 gap-y-2">
        {rows.map((r) => (
          <div key={r.label} className="flex items-baseline gap-2">
            <dt className="text-xs text-zinc-500">{r.label}</dt>
            <dd className={cx("font-mono text-sm font-medium", r.bad ? "text-rose-600" : "text-ink")}>
              {r.b}
              {r.delta && r.delta !== "igual" && <span className="ml-2 text-xs text-zinc-500">({r.delta})</span>}
            </dd>
          </div>
        ))}
      </dl>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-2xl border border-hairline">
        <table className="w-full text-sm">
          <thead className="bg-canvas/70 text-left text-[11px] text-zinc-500">
            <tr>
              <th className="px-3 py-2 font-medium">Mesa {desk.anchoCm}×{desk.fondoCm} cm</th>
              {a && <th className="px-3 py-2 font-medium">{shortLabel(a)}</th>}
              <th className="px-3 py-2 font-medium text-brand-strong">{shortLabel(b)}</th>
              {a && <th className="px-3 py-2 font-medium">Δ</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline font-mono">
            {rows.map((r) => (
              <tr key={r.label}>
                <td className="px-3 py-2.5 font-sans text-zinc-500">{r.label}</td>
                {a && <td className="px-3 py-2.5 text-zinc-600">{r.a}</td>}
                <td className={cx("px-3 py-2.5 font-medium", r.bad ? "text-rose-600" : "text-brand-strong")}>{r.b}</td>
                {a && <td className="whitespace-nowrap px-3 py-2.5 text-ink">{r.delta}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[11px] text-zinc-500">
        Ancho y fondo, datos de fabricante. Alto estimado desde la diagonal, en la posición más baja.
        {a?.generico ? " Tu monitor actual se modela como uno genérico de su tamaño." : ""}
        {d ? ` Superficie de pantalla: ${d.areaPanelPct >= 0 ? "+" : "−"}${Math.abs(Math.round(d.areaPanelPct))}%.` : ""}
      </p>
    </div>
  );
}

// ───────────────────────────── Auxiliares ─────────────────────────────

function Legend({ a, b }: { a: PhysicalMonitor | null; b: PhysicalMonitor }) {
  return (
    <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-2 text-[11px]">
      {a && (
        <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-zinc-600 ring-1 ring-black/5 backdrop-blur">
          <span className="size-2 rounded-sm bg-zinc-600" /> {shortLabel(a)}
        </span>
      )}
      <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-brand-strong ring-1 ring-brand-border backdrop-blur">
        <span className="size-2 rounded-sm border border-brand bg-brand-accent/30 shadow-[0_0_6px_var(--brand-border-glow)]" /> {shortLabel(b)}
      </span>
    </div>
  );
}

function CanvasLoading() {
  return (
    <div className="grid h-full place-items-center">
      <div className="flex flex-col items-center gap-2 text-xs text-zinc-500">
        <span className="size-6 animate-spin rounded-full border-2 border-black/10 border-t-ink" />
        Preparando la escena 3D…
      </div>
    </div>
  );
}

class SceneErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) {
      return (
        <div className="grid h-full place-items-center p-6 text-center text-sm text-zinc-500">
          No hemos podido iniciar la escena 3D en este dispositivo. Las medidas de abajo siguen siendo exactas.
        </div>
      );
    }
    return this.props.children;
  }
}

const cm = (v: number) => `${Math.round(v)} cm`;

function shortLabel(p: PhysicalMonitor) {
  return p.generico ? p.label.replace("Tu monitor actual ", "Actual ") : p.label.replace(/^(\S+)\s/, "");
}

function sceneDescription(a: PhysicalMonitor | null, b: PhysicalMonitor, desk: Desk) {
  const base = `Escena 3D de una mesa de ${desk.anchoCm} por ${desk.fondoCm} centímetros con ${b.label}, de ${Math.round(b.anchoCm)} centímetros de ancho`;
  if (!a) return `${base}.`;
  const d = spatialDelta(a, b);
  return `${base}, junto a ${a.label}. Diferencia de ancho ${formatDeltaCm(d.anchoCm)}, de fondo de peana ${formatDeltaCm(d.fondoCm)}.`;
}
