"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useSearchParams } from "next/navigation";
import { Apple, Monitor as MonitorIcon, RotateCcw, Ruler } from "lucide-react";
import { Card, Eyebrow, OptionButton, cx } from "@/components/advisor/ui";
import { getMonitor, monitors } from "@/data/monitors";
import {
  DISTANCE_MAX_CM,
  DISTANCE_MIN_CM,
  MAC_IDEAL_1X_PPI,
  RESOLUTION_PRESETS,
  RETINA_PPD,
  SIZE_PRESETS,
  analyzeDisplay,
  calcPpi,
  type DisplayInput,
  type MacosFit,
  type WindowsFit,
} from "@/lib/ppi";
import { FitBadge, ScoreMeter, fmt } from "./SharpnessParts";

const DEFAULT_DISPLAY: DisplayInput = { pulgadas: 27, ancho: 2560, alto: 1440 };

/** Referencias para la lupa comparativa: de la densidad de oficina típica al Retina 5K. */
const REFERENCES = [
  { id: "24-1080", label: '24" 1080p', d: { pulgadas: 24, ancho: 1920, alto: 1080 } },
  { id: "27-1440", label: '27" 1440p', d: { pulgadas: 27, ancho: 2560, alto: 1440 } },
  { id: "27-4k", label: '27" 4K', d: { pulgadas: 27, ancho: 3840, alto: 2160 } },
  { id: "27-5k", label: '27" 5K', d: { pulgadas: 27, ancho: 5120, alto: 2880 } },
] as const;

type ReferenceId = (typeof REFERENCES)[number]["id"];

const inputFromMonitor = (id: string | null): DisplayInput | null => {
  const m = id ? getMonitor(id) : undefined;
  return m ? { pulgadas: m.pulgadas, ...m.resolucion } : null;
};

// ───────────────────────────── Entrada desde la URL ─────────────────────────────

/** Simulador con el monitor de `?monitor=<id>`. La `key` lo reinicia si cambia el parámetro. */
export function PpiCalculatorFromUrl() {
  const id = useSearchParams().get("monitor");
  const known = id && getMonitor(id) ? id : null;
  return <PpiCalculator key={known ?? "default"} initialMonitorId={known} />;
}

// ───────────────────────────── Simulador ─────────────────────────────

export function PpiCalculator({ initialMonitorId = null }: { initialMonitorId?: string | null }) {
  const [display, setDisplay] = useState<DisplayInput>(() => inputFromMonitor(initialMonitorId) ?? DEFAULT_DISPLAY);
  const [monitorId, setMonitorId] = useState<string>(initialMonitorId ?? "");
  /** null = distancia recomendada para el tamaño elegido. */
  const [distance, setDistance] = useState<number | null>(null);

  const a = useMemo(() => analyzeDisplay(display, distance ?? undefined), [display, distance]);
  const ppi = Math.round(a.ppi);

  const update = (patch: Partial<DisplayInput>) => {
    setDisplay((d) => ({ ...d, ...patch }));
    setMonitorId("");
  };

  const pickMonitor = (id: string) => {
    setMonitorId(id);
    const d = inputFromMonitor(id);
    if (d) setDisplay(d);
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-6 lg:grid-cols-[1fr_1.05fr]">
        {/* ── Controles ── */}
        <Card className="space-y-8 p-6 sm:p-8">
          <fieldset>
            <legend className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">
              Tamaño · <span className="font-mono normal-case tracking-normal text-ink">{fmt(display.pulgadas, 1)}&quot;</span>
            </legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {SIZE_PRESETS.map((s) => (
                <OptionButton
                  key={s}
                  selected={display.pulgadas === s}
                  onClick={() => update({ pulgadas: s })}
                  className="min-w-14 px-3 py-2 text-center font-mono text-sm font-medium"
                >
                  {s}&quot;
                </OptionButton>
              ))}
              <label className="flex items-center gap-2 rounded-2xl border border-hairline bg-white px-3 py-2 text-sm text-zinc-500 focus-within:border-brand-border">
                Otro
                {/* Se aplica al salir o con Intro: mientras se escribe, "3" camino de "32" no es un tamaño válido. */}
                <input
                  key={display.pulgadas}
                  type="number"
                  min={10}
                  max={65}
                  step={0.1}
                  defaultValue={display.pulgadas}
                  onBlur={(e) => {
                    const v = Number(e.target.value);
                    if (v >= 10 && v <= 65 && v !== display.pulgadas) update({ pulgadas: v });
                    else e.target.value = String(display.pulgadas);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                  aria-label="Diagonal en pulgadas"
                  className="w-14 bg-transparent font-mono text-ink outline-none"
                />
              </label>
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">
              Resolución ·{" "}
              <span className="font-mono normal-case tracking-normal text-ink">
                {display.ancho}×{display.alto}
              </span>
            </legend>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
              {RESOLUTION_PRESETS.map((r) => (
                <OptionButton
                  key={r.id}
                  selected={display.ancho === r.ancho && display.alto === r.alto}
                  onClick={() => update({ ancho: r.ancho, alto: r.alto })}
                  className="px-3 py-2.5"
                >
                  <span className="block text-sm font-semibold text-ink">{r.label}</span>
                  <span className="block truncate text-[11px] text-zinc-500">{r.name}</span>
                </OptionButton>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor="ppi-monitor" className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">
              O carga un monitor del catálogo
            </label>
            <select
              id="ppi-monitor"
              value={monitorId}
              onChange={(e) => pickMonitor(e.target.value)}
              className="mt-3 w-full rounded-2xl border border-hairline bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-border"
            >
              <option value="">Configuración personalizada</option>
              {monitors.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.marca} {m.modelo} · {fmt(m.pulgadas, 1)}&quot; {m.resolucion.ancho}×{m.resolucion.alto}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-baseline justify-between gap-3">
              <label htmlFor="ppi-distance" className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">
                Distancia a la pantalla
              </label>
              <span className="font-mono text-sm font-semibold tabular-nums text-ink">{a.distanciaCm} cm</span>
            </div>
            <input
              id="ppi-distance"
              type="range"
              min={DISTANCE_MIN_CM}
              max={DISTANCE_MAX_CM}
              step={1}
              value={a.distanciaCm}
              onChange={(e) => setDistance(Number(e.target.value))}
              className="range-brand mt-4 w-full"
              style={
                {
                  "--fill": `${((a.distanciaCm - DISTANCE_MIN_CM) / (DISTANCE_MAX_CM - DISTANCE_MIN_CM)) * 100}%`,
                } as CSSProperties
              }
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500">
              <span>
                Recomendada: {a.distance.min}–{a.distance.max} cm
              </span>
              {distance !== null && (
                <button
                  type="button"
                  onClick={() => setDistance(null)}
                  className="inline-flex items-center gap-1 font-medium text-brand-strong hover:underline"
                >
                  <RotateCcw className="size-3" /> Usar la recomendada
                </button>
              )}
            </div>
          </div>
        </Card>

        {/* ── Resultado ── */}
        <Card className="flex flex-col p-6 sm:p-8" aria-live="polite">
          <Eyebrow>Densidad de píxeles</Eyebrow>
          <div className="mt-3 flex flex-wrap items-end gap-x-3 gap-y-2">
            <span className="text-6xl font-semibold tracking-tight tabular-nums text-ink">{ppi}</span>
            <span className="pb-2 font-mono text-sm text-zinc-500">ppi</span>
            <span className="mb-2.5 ml-auto rounded-full bg-brand-glow px-3 py-1 text-xs font-semibold text-brand-strong ring-1 ring-inset ring-brand-border">
              {a.tier.label}
            </span>
          </div>
          <p className="mt-2 text-sm text-zinc-500">{a.tier.description}</p>

          <div className="mt-8 rounded-2xl bg-canvas p-5">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-medium text-ink">Nitidez percibida</p>
              <p className="font-mono tabular-nums">
                <span className="text-2xl font-semibold text-ink">{fmt(a.score, 1)}</span>
                <span className="text-sm text-zinc-500"> / 10</span>
              </p>
            </div>
            <ScoreMeter score={a.score} className="mt-3" />
            <p className="mt-3 text-xs leading-relaxed text-zinc-500">
              {fmt(a.ppd)} píxeles por grado a {a.distanciaCm} cm.{" "}
              {a.ppd >= RETINA_PPD
                ? "A esta distancia el ojo ya no distingue el píxel."
                : `El píxel deja de distinguirse a partir de ${a.retinaDistanceCm} cm.`}
            </p>
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <Stat label="Superficie visible" value={`${fmt(a.anchoCm, 1)} × ${fmt(a.altoCm, 1)} cm`} />
            <Stat label="Distancia recomendada" value={`${a.distance.min}–${a.distance.max} cm`} />
            <Stat label="Retina a partir de" value={`${a.retinaDistanceCm} cm`} />
            <Stat label="Píxeles totales" value={`${fmt((display.ancho * display.alto) / 1e6, 1)} MP`} />
          </dl>
        </Card>
      </section>

      {/* ── Sistemas operativos ── */}
      <section className="grid gap-6 md:grid-cols-2" aria-label="Recomendación por sistema operativo">
        <OsCard icon={MonitorIcon} os="Windows" result={a.windows} />
        <OsCard icon={Apple} os="macOS" result={a.macos} />
      </section>

      <DensityPreview ppi={a.ppi} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-zinc-500">{label}</dt>
      <dd className="mt-0.5 font-mono font-medium tabular-nums text-ink">{value}</dd>
    </div>
  );
}

function OsCard({
  icon: Icon,
  os,
  result,
}: {
  icon: typeof MonitorIcon;
  os: string;
  result: WindowsFit | MacosFit;
}) {
  const renderAt = "renderAt" in result ? result.renderAt : undefined;
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-3 text-sm font-semibold text-ink">
          <span className="grid size-8 place-items-center rounded-lg bg-canvas">
            <Icon className="size-4" />
          </span>
          {os}
        </span>
        <FitBadge fit={result.fit} />
      </div>
      <p className="mt-4 text-lg font-semibold tracking-tight text-ink">{result.label}</p>
      <p className="mt-1 font-mono text-xs text-zinc-500">
        Se ve como {result.looksLike.ancho}×{result.looksLike.alto}
        {renderAt && ` · dibuja a ${renderAt.ancho}×${renderAt.alto}`}
      </p>
      <p className="mt-3 text-sm leading-relaxed text-zinc-600">{result.summary}</p>
    </Card>
  );
}

// ───────────────────────────── Lupa de densidad ─────────────────────────────

function DensityPreview({ ppi }: { ppi: number }) {
  const [refId, setRefId] = useState<ReferenceId>("27-5k");
  const ref = REFERENCES.find((r) => r.id === refId) ?? REFERENCES[3];
  const refPpi = calcPpi(ref.d.ancho, ref.d.alto, ref.d.pulgadas);

  return (
    <Card className="p-6 sm:p-8">
      <div className="flex flex-col gap-4">
        <div>
          <Eyebrow>Vista previa</Eyebrow>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-ink">El mismo texto, a la misma escala física</h2>
          <p className="mt-1 max-w-xl text-sm text-zinc-500">
            Ampliamos un trozo de pantalla del mismo tamaño real en ambos monitores: con menos ppi, la letra se dibuja con
            menos píxeles y los bordes se vuelven escalones.
          </p>
        </div>
        <div className="flex flex-wrap gap-1 self-start rounded-3xl bg-black/[0.035] p-1" role="radiogroup" aria-label="Comparar con">
          {REFERENCES.map((r) => (
            <button
              key={r.id}
              type="button"
              role="radio"
              aria-checked={r.id === refId}
              onClick={() => setRefId(r.id)}
              className={cx(
                "rounded-full px-3 py-1.5 font-mono text-xs font-medium transition",
                r.id === refId ? "bg-white text-ink shadow-elevated ring-1 ring-brand-border" : "text-zinc-500 hover:text-ink",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Loupe ppi={ppi} title="Tu configuración" />
        <Loupe ppi={refPpi} title={`Referencia · ${ref.label}`} />
      </div>
      <p className="mt-4 flex items-center gap-2 text-xs text-zinc-500">
        <Ruler className="size-3.5 shrink-0 text-brand" />
        Cada recuadro equivale a {fmt(PATCH.w / MAC_IDEAL_1X_PPI, 2)} × {fmt(PATCH.h / MAC_IDEAL_1X_PPI, 2)} pulgadas de
        pantalla real, con la interfaz escalada al mismo tamaño en ambos.
      </p>
    </Card>
  );
}

/** Trozo de pantalla simulado, en puntos de interfaz (1 pt = 1 píxel a ~110 ppi, el tamaño de referencia). */
const PATCH = { w: 80, h: 40 };

function Loupe({ ppi, title }: { ppi: number; title: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    const paint = () => !cancelled && drawPatch(canvas, ppi);
    paint();
    // La fuente de la web puede llegar después del primer pintado.
    document.fonts?.ready.then(paint);
    return () => {
      cancelled = true;
    };
  }, [ppi]);

  return (
    <figure>
      <div className="overflow-hidden rounded-2xl border border-hairline bg-white">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`Texto e interfaz ampliados tal como se dibujan a ${Math.round(ppi)} ppi`}
          className="block aspect-[2/1] w-full [image-rendering:pixelated]"
        />
      </div>
      <figcaption className="mt-2 flex items-baseline justify-between gap-3 px-1 text-xs">
        <span className="font-medium text-ink">{title}</span>
        <span className="font-mono tabular-nums text-zinc-500">{Math.round(ppi)} ppi</span>
      </figcaption>
    </figure>
  );
}

/** Dibuja la escena a la resolución real de un panel de `ppi`; el CSS la amplía sin suavizar. */
function drawPatch(canvas: HTMLCanvasElement, ppi: number) {
  const s = ppi / MAC_IDEAL_1X_PPI;
  canvas.width = Math.max(1, Math.round(PATCH.w * s));
  canvas.height = Math.max(1, Math.round(PATCH.h * s));
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(canvas.width / PATCH.w, 0, 0, canvas.height / PATCH.h, 0, 0);
  const family = getComputedStyle(canvas).fontFamily || "system-ui, sans-serif";

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, PATCH.w, PATCH.h);

  // Barra de ventana
  ctx.fillStyle = "#f4f4f5";
  ctx.fillRect(0, 0, PATCH.w, 7);
  ["#ff5f57", "#febc2e", "#28c840"].forEach((color, i) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(4 + i * 4.5, 3.5, 1.4, 0, Math.PI * 2);
    ctx.fill();
  });

  // Texto
  ctx.fillStyle = "#0b0b0f";
  ctx.textBaseline = "alphabetic";
  ctx.font = `600 11px ${family}`;
  ctx.fillText("Aa Rg 1Il", 3, 20);
  ctx.fillStyle = "#52525b";
  ctx.font = `400 5px ${family}`;
  ctx.fillText("Interfaz a 5 pt", 3, 27);

  // Botón
  ctx.fillStyle = "#047857";
  ctx.beginPath();
  ctx.roundRect(3, 30.5, 22, 6.5, 3.25);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = `600 4px ${family}`;
  ctx.fillText("Comprar", 6.6, 35);

  // Curva y diagonal: donde más se ve el escalonado
  ctx.strokeStyle = "#0b0b0f";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.arc(66, 22, 8, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(52, 37);
  ctx.lineTo(78, 10);
  ctx.stroke();
}
