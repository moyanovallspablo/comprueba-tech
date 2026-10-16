"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Edges, Grid, Line, OrbitControls, RoundedBox } from "@react-three/drei";
import { useMemo, useRef, useState, type ReactNode } from "react";
import { MathUtils, Vector3, type Group } from "three";
import { useReducedMotion } from "motion/react";
import { BRAND } from "@/lib/brand";
import {
  curveSagittaCm,
  fitOnDesk,
  formatDeltaCm,
  spatialDelta,
  type Desk,
  type PhysicalMonitor,
} from "@/lib/physical";

/**
 * Escena "Spatial Delta": escritorio a escala real con dos volúmenes tipo CAD.
 * - A (referencia: tu monitor actual o el monitor A) → volumen sólido grafito, mate.
 * - B (el nuevo / monitor B) → holograma esmeralda translúcido con aristas.
 * Unidades: 1 unidad = 1 metro; los datos llegan en cm.
 *
 * Este módulo es el único que importa three/R3F: se carga con next/dynamic (sin SSR) solo al abrir el visor.
 */

export type SpatialLayout = "overlay" | "side";

export interface SpatialDeltaCanvasProps {
  a: PhysicalMonitor | null;
  b: PhysicalMonitor;
  desk: Desk;
  layout: SpatialLayout;
}

const CM = 0.01;
const SIDE_GAP_CM = 8;
const BACK_MARGIN_CM = 1;

const COLORS = {
  desk: "#f4f4f5",
  solid: "#3f3f46",
  solidEdge: "#71717a",
  metal: "#a1a1aa",
  screen: "#0b0d12",
  holo: BRAND.accent, // volumen holográfico del monitor nuevo
  holoEdge: BRAND.primary, // aristas del holograma
  measure: BRAND.accent, // cotas y puntos de foco (Menta Eléctrico)
  ref: "#52525b",
  warn: "#e11d48",
} as const;

type Variant = "solid" | "holo";
type Vec3 = [number, number, number];

export default function SpatialDeltaCanvas({ a, b, desk, layout }: SpatialDeltaCanvasProps) {
  const reduce = useReducedMotion() ?? false;
  const W = desk.anchoCm * CM;
  const D = desk.fondoCm * CM;
  const backZ = -D / 2 + BACK_MARGIN_CM * CM;

  // Lado a lado: la pareja (A + hueco + B) queda centrada en la mesa.
  const side = layout === "side" && a !== null;
  const pairCm = side ? a!.anchoCm + SIDE_GAP_CM + b.anchoCm : 0;
  const xA = side ? (-pairCm / 2 + a!.anchoCm / 2) * CM : 0;
  const xB = side ? (pairCm / 2 - b.anchoCm / 2) * CM : 0;

  const ann = computeAnnotations({ a, b, desk, backZ, xA, xB, side });
  const labelEls = useRef<Record<string, HTMLSpanElement | null>>({});
  const getLabelElement = (key: string) => labelEls.current[key] ?? null;

  // Cámara inicial según el tamaño de la mesa al montar; después manda OrbitControls.
  const [camera] = useState(() => ({
    position: [0, 0.45 + W * 0.28, D / 2 + 0.35 + W * 0.62] as Vec3,
    fov: 38,
  }));

  return (
    <div className="relative size-full">
      <Canvas frameloop="demand" dpr={[1, 2]} camera={camera} gl={{ antialias: true, powerPreference: "low-power", alpha: true }}>
        <hemisphereLight args={["#ffffff", "#d4d4d8", 1.15]} />
        <directionalLight position={[1.2, 2.4, 1.8]} intensity={1.5} />
        <directionalLight position={[-1.5, 1.2, -1]} intensity={0.35} />

        <DeskSlab W={W} D={D} />

        {a && (
          <AnimatedGroup x={xA} instant={reduce}>
            <MonitorVolume p={a} backZ={backZ} deskD={D} variant="solid" />
          </AnimatedGroup>
        )}
        <AnimatedGroup x={xB} instant={reduce}>
          <MonitorVolume p={b} backZ={backZ} deskD={D} variant="holo" />
        </AnimatedGroup>

        <AnnotationGeometry ann={ann} />
        <LabelProjector labels={ann.labels} getElement={getLabelElement} />

        <ContactShadows position={[0, 0.0012, 0]} scale={[W, D]} opacity={0.35} blur={2.4} far={0.6} resolution={512} />
        <OrbitControls
          makeDefault
          enableDamping={!reduce}
          target={[0, 0.22, -D / 5]}
          minDistance={0.35}
          maxDistance={4}
          maxPolarAngle={Math.PI / 2 - 0.08}
          enablePan={false}
        />
      </Canvas>

      {/* Etiquetas: DOM normal sobre el canvas, posicionadas por LabelProjector sin re-renderizar React */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {ann.labels.map((l) => (
          <span
            key={l.key}
            ref={(el) => {
              labelEls.current[l.key] = el;
            }}
            className={`absolute left-0 top-0 whitespace-nowrap rounded-full px-2 py-1 font-mono text-[11px] font-medium opacity-0 shadow-sm ${LABEL_STYLES[l.tone]}`}
          >
            {l.text}
          </span>
        ))}
      </div>
    </div>
  );
}

// ───────────────────────────── Escritorio ─────────────────────────────

function DeskSlab({ W, D }: { W: number; D: number }) {
  return (
    <group>
      <RoundedBox args={[W, 0.03, D]} radius={0.008} smoothness={4} position={[0, -0.015, 0]}>
        <meshStandardMaterial color={COLORS.desk} roughness={0.85} />
      </RoundedBox>
      <Grid
        position={[0, 0.0006, 0]}
        args={[W - 0.01, D - 0.01]}
        cellSize={0.05}
        cellThickness={0.6}
        cellColor="#e4e4e7"
        sectionSize={0.25}
        sectionThickness={0.9}
        sectionColor="#d4d4d8"
        fadeDistance={6}
      />
    </group>
  );
}

/**
 * Desliza suavemente entre posiciones al cambiar de modo (y pide frames solo mientras se mueve).
 * Con `instant` (movimiento reducido) salta directamente a la posición final.
 */
function AnimatedGroup({ x, instant, children }: { x: number; instant: boolean; children: ReactNode }) {
  const ref = useRef<Group>(null);
  useFrame((state, delta) => {
    const g = ref.current;
    if (!g) return;
    g.position.x = instant ? x : MathUtils.damp(g.position.x, x, 9, delta);
    if (Math.abs(g.position.x - x) > 1e-4) state.invalidate();
  });
  return (
    <group ref={ref} position={[x, 0, 0]}>
      {children}
    </group>
  );
}

// ───────────────────────────── Volumen del monitor ─────────────────────────────

function ChassisMaterial({ variant }: { variant: Variant }) {
  return variant === "solid" ? (
    <meshStandardMaterial color={COLORS.solid} roughness={0.55} metalness={0.15} />
  ) : (
    <meshPhysicalMaterial color={COLORS.holo} transparent opacity={0.2} roughness={0.15} clearcoat={1} depthWrite={false} />
  );
}

function MetalMaterial({ variant }: { variant: Variant }) {
  return variant === "solid" ? (
    <meshStandardMaterial color={COLORS.metal} roughness={0.35} metalness={0.6} />
  ) : (
    <meshPhysicalMaterial color={COLORS.holo} transparent opacity={0.14} depthWrite={false} />
  );
}

function ScreenMaterial({ variant }: { variant: Variant }) {
  return variant === "solid" ? (
    <meshStandardMaterial color={COLORS.screen} roughness={0.25} metalness={0.1} />
  ) : (
    <meshBasicMaterial color={COLORS.holo} transparent opacity={0.08} depthWrite={false} />
  );
}

function VolumeEdges({ variant }: { variant: Variant }) {
  return <Edges threshold={20} color={variant === "solid" ? COLORS.solidEdge : COLORS.holoEdge} />;
}

function MonitorVolume({ p, backZ, deskD, variant }: { p: PhysicalMonitor; backZ: number; deskD: number; variant: Variant }) {
  const w = p.anchoCm * CM;
  const h = p.altoCm * CM;
  const t = p.grosorCm * CM;
  const elev = p.elevacionCm * CM;
  const isArm = p.soporte === "brazo-abrazadera";
  const clampZ = -deskD / 2 + 0.03;
  const panelBackZ = isArm ? -deskD / 2 + 0.1 : backZ + 0.012;
  const panelZ = panelBackZ + t / 2;
  const panelY = elev + h / 2;

  return (
    <group>
      {/* Soporte */}
      {isArm ? (
        <group>
          <mesh position={[0, -0.005, clampZ]}>
            <boxGeometry args={[0.07, 0.05, 0.06]} />
            <MetalMaterial variant={variant} />
          </mesh>
          <mesh position={[0, panelY / 2, clampZ]}>
            <cylinderGeometry args={[0.014, 0.014, panelY, 16]} />
            <MetalMaterial variant={variant} />
          </mesh>
          <mesh position={[0, panelY, (clampZ + panelBackZ) / 2]}>
            <boxGeometry args={[0.03, 0.025, panelBackZ - clampZ]} />
            <MetalMaterial variant={variant} />
          </mesh>
        </group>
      ) : (
        <group>
          <RoundedBox
            args={[p.baseAnchoCm * CM, 0.012, p.fondoPeanaCm * CM]}
            radius={0.005}
            smoothness={3}
            position={[0, 0.006, backZ + (p.fondoPeanaCm * CM) / 2]}
          >
            <MetalMaterial variant={variant} />
            <VolumeEdges variant={variant} />
          </RoundedBox>
          <mesh position={[0, (panelY + 0.012) / 2, backZ + 0.006]}>
            <boxGeometry args={[0.05, panelY - 0.012, 0.012]} />
            <MetalMaterial variant={variant} />
          </mesh>
        </group>
      )}

      {/* Panel */}
      {p.curvaturaMm ? (
        <CurvedPanel p={p} centerZ={panelZ} y={panelY} variant={variant} />
      ) : (
        <group position={[0, panelY, panelZ]}>
          <RoundedBox args={[w, h, t]} radius={Math.min(0.008, t / 2.5)} smoothness={4}>
            <ChassisMaterial variant={variant} />
            <VolumeEdges variant={variant} />
          </RoundedBox>
          <mesh position={[0, 0.006, t / 2 + 0.0006]}>
            <planeGeometry args={[p.panelAnchoCm * CM, p.panelAltoCm * CM]} />
            <ScreenMaterial variant={variant} />
          </mesh>
        </group>
      )}
    </group>
  );
}

/** Panel curvo como arco de segmentos planos (estética low-poly CAD). Los extremos se adelantan hacia el usuario. */
function CurvedPanel({ p, centerZ, y, variant }: { p: PhysicalMonitor; centerZ: number; y: number; variant: Variant }) {
  const segments = 14;
  const R = (p.curvaturaMm ?? 1800) / 1000;
  const theta = (p.anchoCm * CM) / R; // ángulo total del arco
  const segW = 2 * R * Math.sin(theta / (2 * segments)) * 1.004;
  const h = p.altoCm * CM;
  const t = p.grosorCm * CM;
  const screenRatio = p.panelAnchoCm / p.anchoCm;

  return (
    <group position={[0, y, centerZ]}>
      {Array.from({ length: segments }, (_, i) => {
        const a = -theta / 2 + ((i + 0.5) * theta) / segments;
        return (
          <group key={i} position={[R * Math.sin(a), 0, R * (1 - Math.cos(a))]} rotation={[0, -a, 0]}>
            <mesh>
              <boxGeometry args={[segW, h, t]} />
              <ChassisMaterial variant={variant} />
              <VolumeEdges variant={variant} />
            </mesh>
            <mesh position={[0, 0.006, t / 2 + 0.0006]}>
              <planeGeometry args={[segW * screenRatio, p.panelAltoCm * CM]} />
              <ScreenMaterial variant={variant} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// ───────────────────────────── Cotas y delta espacial ─────────────────────────────

type Tone = "holo" | "ref" | "warn";

const LABEL_STYLES: Record<Tone, string> = {
  holo: "bg-brand-strong text-white shadow-glow-sm",
  ref: "bg-white text-zinc-700 ring-1 ring-black/10",
  warn: "bg-rose-600 text-white",
};

interface LabelSpec {
  key: string;
  visible: boolean;
  position: Vec3;
  tone: Tone;
  text: string;
}

interface Annotations {
  labels: LabelSpec[];
  widthLines: { from: Vec3; to: Vec3; color: string; focus: boolean }[];
  depthLines: { points: [Vec3, Vec3]; color: string; width: number; focus: boolean }[];
  freeZone: { position: Vec3; size: [number, number]; ok: boolean } | null;
}

const topOf = (p: PhysicalMonitor) => (p.elevacionCm + p.altoCm) * CM;

/** Fondo real ocupado incluyendo la flecha del panel curvo. */
const occupiedDepthCm = (p: PhysicalMonitor) => Math.max(p.fondoPeanaCm, p.grosorCm + curveSagittaCm(p) + BACK_MARGIN_CM);

/** Geometría de cotas y textos, calculada una vez y compartida por la escena y la capa de etiquetas. */
function computeAnnotations({
  a,
  b,
  desk,
  backZ,
  xA,
  xB,
  side,
}: {
  a: PhysicalMonitor | null;
  b: PhysicalMonitor;
  desk: Desk;
  backZ: number;
  xA: number;
  xB: number;
  side: boolean;
}): Annotations {
  const D = desk.fondoCm * CM;
  const fitB = fitOnDesk(b, desk);
  const delta = a ? spatialDelta(a, b) : null;
  const overlay = a !== null && !side;
  const wB = b.anchoCm * CM;
  const wA = a ? a.anchoCm * CM : 0;
  const yTop = Math.max(topOf(b), a ? topOf(a) : 0) + 0.06;
  const noFit = fitB.cabeAncho ? "" : " · no cabe";
  const toneB: Tone = fitB.cabeAncho ? "holo" : "warn";

  // Zona libre delante del nuevo monitor (teclado y distancia de visión)
  const freeStartZ = backZ + occupiedDepthCm(b) * CM;
  const freeDepth = Math.max(0, D / 2 - freeStartZ);
  // Recortada a los bordes de la mesa (lado a lado, el monitor B puede sobresalir).
  const halfDesk = (desk.anchoCm * CM) / 2 - 0.01;
  const zoneW = side ? wB : Math.max(wB, wA) * 0.9;
  const zoneX = side ? xB : 0;
  const freeLeft = Math.max(zoneX - zoneW / 2, -halfDesk);
  const freeRight = Math.min(zoneX + zoneW / 2, halfDesk);
  const freeX = (freeLeft + freeRight) / 2;
  const freeW = Math.max(0, freeRight - freeLeft);

  // Cota de fondo de peana: sobre la mesa, a la derecha de los volúmenes
  const depthX = Math.max(xB + wB / 2, a ? xA + wA / 2 : -Infinity) + 0.06;
  const depthZB = Math.max(backZ + b.fondoPeanaCm * CM, backZ + 0.002);

  // Las cotas del monitor nuevo van en menta y con puntos de foco; las de referencia, en gris.
  const widthLines: Annotations["widthLines"] = overlay
    ? [
        { from: [-wA / 2, yTop - 0.035, backZ], to: [wA / 2, yTop - 0.035, backZ], color: COLORS.ref, focus: false },
        { from: [-wB / 2, yTop, backZ], to: [wB / 2, yTop, backZ], color: COLORS.measure, focus: true },
      ]
    : [
        ...(a
          ? [{ from: [xA - wA / 2, topOf(a) + 0.04, backZ] as Vec3, to: [xA + wA / 2, topOf(a) + 0.04, backZ] as Vec3, color: COLORS.ref, focus: false }]
          : []),
        { from: [xB - wB / 2, topOf(b) + 0.04, backZ], to: [xB + wB / 2, topOf(b) + 0.04, backZ], color: COLORS.measure, focus: true },
      ];

  const depthLines: Annotations["depthLines"] = [
    ...(overlay && a
      ? [{ points: [[depthX + 0.025, 0.003, backZ], [depthX + 0.025, 0.003, backZ + a.fondoPeanaCm * CM]] as [Vec3, Vec3], color: COLORS.ref, width: 2, focus: false }]
      : []),
    { points: [[depthX, 0.003, backZ], [depthX, 0.003, depthZB]], color: COLORS.measure, width: 2.4, focus: true },
  ];

  // Siempre los mismos cinco huecos (ocultos o visibles) para que la capa DOM sea estable.
  const labels: LabelSpec[] = [
    {
      key: "widthA",
      visible: !!a && side,
      position: a ? [xA, topOf(a) + 0.08, backZ] : [0, 0, 0],
      tone: "ref",
      text: a ? `${Math.round(a.anchoCm)} cm` : "",
    },
    {
      key: "widthB",
      visible: !overlay,
      position: [xB, topOf(b) + 0.08, backZ],
      tone: toneB,
      text: `${Math.round(b.anchoCm)} cm${delta ? ` · ${formatDeltaCm(delta.anchoCm)}` : ""}${noFit}`,
    },
    {
      key: "widthDelta",
      visible: overlay,
      position: [0, yTop + 0.045, backZ],
      tone: toneB,
      text: `Ancho ${delta ? formatDeltaCm(delta.anchoCm) : ""}${noFit}`,
    },
    {
      key: "depth",
      visible: true,
      position: [depthX + 0.02, 0.03, Math.max(depthZB, backZ + 0.04)],
      tone: "holo",
      text:
        b.soporte === "brazo-abrazadera"
          ? "Peana 0 cm (brazo)"
          : `Peana ${Math.round(b.fondoPeanaCm)} cm${delta && overlay ? ` · ${formatDeltaCm(delta.fondoCm)}` : ""}`,
    },
    {
      key: "free",
      visible: true,
      position: [freeX, 0.02, Math.min(D / 2 - 0.06, freeStartZ + freeDepth / 2)],
      tone: fitB.cabeFondo ? "holo" : "warn",
      text: fitB.libreDelanteCm >= 0 ? `${Math.round(fitB.libreDelanteCm)} cm libres delante` : "No cabe en el fondo",
    },
  ];

  return {
    labels,
    widthLines,
    depthLines,
    freeZone:
      freeDepth > 0.01 && freeW > 0.01
        ? { position: [freeX, 0.0015, freeStartZ + freeDepth / 2], size: [freeW, freeDepth], ok: fitB.cabeFondo }
        : null,
  };
}

/** Punto de foco menta: núcleo sólido con halo translúcido, marca los extremos de una cota. */
function FocusPoint({ position }: { position: Vec3 }) {
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.0055, 16, 12]} />
        <meshBasicMaterial color={COLORS.measure} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.014, 20, 14]} />
        <meshBasicMaterial color={COLORS.measure} transparent opacity={0.22} depthWrite={false} />
      </mesh>
    </group>
  );
}

/** Cota horizontal con topes (y puntos de foco si es la del monitor nuevo). */
function Dimension({ from, to, color, focus }: { from: Vec3; to: Vec3; color: string; focus: boolean }) {
  const tick = 0.015;
  return (
    <group>
      <Line points={[from, to]} color={color} lineWidth={focus ? 2 : 1.6} />
      <Line points={[[from[0], from[1] - tick, from[2]], [from[0], from[1] + tick, from[2]]]} color={color} lineWidth={1.6} />
      <Line points={[[to[0], to[1] - tick, to[2]], [to[0], to[1] + tick, to[2]]]} color={color} lineWidth={1.6} />
      {focus && (
        <>
          <FocusPoint position={from} />
          <FocusPoint position={to} />
        </>
      )}
    </group>
  );
}

function AnnotationGeometry({ ann }: { ann: Annotations }) {
  return (
    <group>
      {ann.widthLines.map((l, i) => (
        <Dimension key={`w${i}`} from={l.from} to={l.to} color={l.color} focus={l.focus} />
      ))}
      {ann.depthLines.map((l, i) => (
        <group key={`d${i}`}>
          <Line points={l.points} color={l.color} lineWidth={l.width} />
          {l.focus && (
            <>
              <FocusPoint position={l.points[0]} />
              <FocusPoint position={l.points[1]} />
            </>
          )}
        </group>
      ))}
      {ann.freeZone && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={ann.freeZone.position}>
          <planeGeometry args={ann.freeZone.size} />
          <meshBasicMaterial color={ann.freeZone.ok ? COLORS.holo : COLORS.warn} transparent opacity={0.07} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}

/**
 * Proyecta cada etiqueta a coordenadas de pantalla en cada frame renderizado y mueve su <span> por estilo.
 * Sustituye a <Html> de drei, que crea una raíz de React por etiqueta y la desmonta de forma síncrona
 * (avisos y errores de removeChild con React 19).
 */
function LabelProjector({ labels, getElement }: { labels: LabelSpec[]; getElement: (key: string) => HTMLSpanElement | null }) {
  const v = useMemo(() => new Vector3(), []);
  useFrame(({ camera, size }) => {
    for (const l of labels) {
      const el = getElement(l.key);
      if (!el) continue;
      v.set(...l.position).project(camera);
      const x = ((v.x + 1) / 2) * size.width;
      const y = ((1 - v.y) / 2) * size.height;
      el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      el.style.opacity = l.visible && v.z < 1 ? "1" : "0";
    }
  });
  return null;
}
