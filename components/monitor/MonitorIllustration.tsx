import type { Monitor } from "@/types/monitor";

/**
 * Ilustración frontal a escala real (8 px por pulgada): dos monitores dibujados con este componente
 * se pueden comparar en tamaño. Se usa mientras no haya fotografía de producto (`monitor.imagen`).
 */

const PX_PER_INCH = 8;
const VIEW_W = 420;
const VIEW_H = 280;
const DESK_Y = 262;

export function MonitorIllustration({ monitor: m, className }: { monitor: Monitor; className?: string }) {
  const ratio = m.resolucion.ancho / m.resolucion.alto;
  const widthIn = (m.pulgadas * ratio) / Math.sqrt(ratio ** 2 + 1);
  const W = widthIn * PX_PER_INCH;
  const H = (widthIn / ratio) * PX_PER_INCH;
  const cx = VIEW_W / 2;
  const x0 = cx - W / 2;
  const x1 = cx + W / 2;

  const isArm = m.tipo_soporte === "brazo-abrazadera";
  const neck = isArm ? 54 : 40;
  const baseH = isArm ? 0 : 6;
  const bottom = DESK_Y - baseH - neck;
  const top = bottom - H;
  const bow = m.curvatura ? Math.min(10, 12000 / m.curvatura / 1.2) : 0; // 1800R → ~5.5 px de curvatura visual
  const oled = m.panel === "QD-OLED";
  const id = `mon-${m.id}`;
  const inset = 3;

  const screenPath = (dx: number) =>
    `M ${x0 + dx} ${top + dx} Q ${cx} ${top + dx + bow} ${x1 - dx} ${top + dx} ` +
    `L ${x1 - dx} ${bottom - dx} Q ${cx} ${bottom - dx + bow} ${x0 + dx} ${bottom - dx} Z`;

  const baseW = Math.max(70, Math.min(150, W * 0.38));

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className={className}
      role="img"
      aria-label={`Ilustración a escala del ${m.marca} ${m.modelo}, ${m.pulgadas} pulgadas`}
    >
      <defs>
        <linearGradient id={`${id}-screen`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={oled ? "#05060a" : "#1f2937"} />
          <stop offset="55%" stopColor={oled ? "#0f1426" : "#334155"} />
          <stop offset="100%" stopColor={oled ? "#1b2550" : "#64748b"} />
        </linearGradient>
        <linearGradient id={`${id}-sheen`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fff" stopOpacity="0" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0.09" />
        </linearGradient>
        <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d4d4d8" />
          <stop offset="100%" stopColor="#a1a1aa" />
        </linearGradient>
      </defs>

      {/* Mesa */}
      <line x1="16" x2={VIEW_W - 16} y1={DESK_Y} y2={DESK_Y} stroke="#0f0f19" strokeOpacity="0.08" strokeWidth="2" />
      <ellipse cx={cx} cy={DESK_Y + 2} rx={Math.min(W * 0.55, 190)} ry="5" fill="#0f0f19" opacity="0.06" />

      {/* Soporte */}
      {isArm ? (
        <g fill={`url(#${id}-metal)`}>
          <rect x={cx - 5} y={bottom - 6} width="10" height={neck + 6} rx="5" />
          <circle cx={cx} cy={bottom + neck * 0.45} r="7" />
          <rect x={cx - 14} y={DESK_Y - 2} width="28" height="12" rx="3" />
        </g>
      ) : (
        <g fill={`url(#${id}-metal)`}>
          <rect x={cx - 9} y={bottom - 4} width="18" height={neck + 6} rx="4" />
          <rect x={cx - baseW / 2} y={DESK_Y - baseH} width={baseW} height={baseH} rx="3" />
        </g>
      )}

      {/* Marco y panel */}
      <path d={screenPath(0)} fill="#18181b" />
      <path d={screenPath(inset)} fill={`url(#${id}-screen)`} />
      <path
        d={`M ${cx + W * 0.05} ${top + inset} L ${x1 - inset} ${top + inset} L ${x1 - inset} ${bottom - inset} L ${cx + W * 0.28} ${bottom - inset} Z`}
        fill={`url(#${id}-sheen)`}
      />
    </svg>
  );
}
