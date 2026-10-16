"use client";

import { useMemo, useState } from "react";
import {
  Briefcase,
  ChevronDown,
  CircleCheck,
  Clock,
  Cpu,
  Gamepad2,
  Laptop,
  Minus,
  MonitorSmartphone,
  Plus,
  Ruler,
  Trophy,
  TriangleAlert,
  XCircle,
} from "lucide-react";
import {
  getRecommendation,
  type Criterion,
  type ScoredMonitor,
  type Verdict,
} from "@/lib/engine/calculator";
import type { CurrentEquipment, GpuTier, Profile } from "@/types/monitor";

// ───────────────────────────── Constantes UI ─────────────────────────────

const PROFILES: { id: Profile; label: string; icon: typeof Laptop }[] = [
  { id: "mac", label: "Mac", icon: Laptop },
  { id: "gaming", label: "Gaming", icon: Gamepad2 },
  { id: "oficina", label: "Oficina", icon: Briefcase },
];

const BUDGET_PRESETS = [150, 300, 500, 800, 1200, 2000];

const CURRENT_MONITORS: { id: string; label: string; value?: CurrentEquipment["monitor_actual"] }[] = [
  { id: "none", label: "Ninguno / portátil solo" },
  { id: "24-1080-60", label: '24" 1080p 60 Hz', value: { pulgadas: 24, resolucion_alto: 1080, hz: 60 } },
  { id: "24-1080-144", label: '24" 1080p 144 Hz', value: { pulgadas: 24, resolucion_alto: 1080, hz: 144 } },
  { id: "27-1440-60", label: '27" 1440p 60 Hz', value: { pulgadas: 27, resolucion_alto: 1440, hz: 60 } },
  { id: "27-1440-165", label: '27" 1440p 165 Hz', value: { pulgadas: 27, resolucion_alto: 1440, hz: 165 } },
  { id: "27-2160-60", label: '27" 4K 60 Hz', value: { pulgadas: 27, resolucion_alto: 2160, hz: 60 } },
];

const CRITERIA_LABELS: Record<Criterion, string> = {
  imagen: "Imagen",
  fluidez: "Fluidez",
  conectividad: "Conectividad",
  ergonomia: "Ergonomía",
  valor: "Valor",
  madurez: "Madurez",
};

const VERDICT_STYLES: Record<Verdict, string> = {
  recomendado: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-900",
  con_oferta: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-900",
  descartado: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:ring-rose-900",
};

const eur = (n: number) => `${n.toLocaleString("es-ES")} €`;

// ───────────────────────────── Página ─────────────────────────────

export default function EngineTestPage() {
  const [profile, setProfile] = useState<Profile>("mac");
  const [budget, setBudget] = useState(600);
  const [dispositivo, setDispositivo] = useState<CurrentEquipment["dispositivo"]>("portatil");
  const [gpu, setGpu] = useState<GpuTier>("integrada");
  const [mesaFondo, setMesaFondo] = useState("");
  const [mesaAncho, setMesaAncho] = useState("");
  const [monitorActual, setMonitorActual] = useState("none");

  const equipment = useMemo<CurrentEquipment>(
    () => ({
      dispositivo,
      gpu,
      profundidad_mesa_cm: Number(mesaFondo) || undefined,
      ancho_mesa_cm: Number(mesaAncho) || undefined,
      monitor_actual: CURRENT_MONITORS.find((m) => m.id === monitorActual)?.value,
    }),
    [dispositivo, gpu, mesaFondo, mesaAncho, monitorActual],
  );

  const result = useMemo(
    () => getRecommendation(profile, budget, equipment),
    [profile, budget, equipment],
  );

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-8">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Herramienta interna</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Motor de decisión · Monitores</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Ajusta el perfil y el presupuesto: el algoritmo recalcula en tiempo real sobre {result.ranking.length} monitores.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* ── Controles ── */}
        <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <Panel title="Perfil">
            <div className="grid grid-cols-3 gap-2">
              {PROFILES.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setProfile(id)}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3 text-sm font-medium transition ${
                    profile === id
                      ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                      : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
                  }`}
                >
                  <Icon className="size-5" />
                  {label}
                </button>
              ))}
            </div>
          </Panel>

          <Panel title="Presupuesto">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-semibold tabular-nums">{eur(budget)}</span>
              <input
                type="number"
                min={50}
                max={3000}
                step={10}
                value={budget}
                onChange={(e) => setBudget(Math.max(50, Number(e.target.value) || 0))}
                className="w-24 rounded-md border border-zinc-200 bg-transparent px-2 py-1 text-right text-sm tabular-nums dark:border-zinc-800"
                aria-label="Presupuesto en euros"
              />
            </div>
            <input
              type="range"
              min={80}
              max={2000}
              step={10}
              value={Math.min(budget, 2000)}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="mt-3 w-full accent-zinc-900 dark:accent-zinc-100"
            />
            <div className="mt-3 flex flex-wrap gap-1.5">
              {BUDGET_PRESETS.map((b) => (
                <button
                  key={b}
                  onClick={() => setBudget(b)}
                  className={`rounded-full px-2.5 py-1 text-xs tabular-nums ring-1 transition ${
                    budget === b
                      ? "bg-zinc-900 text-white ring-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:ring-zinc-100"
                      : "ring-zinc-200 hover:ring-zinc-400 dark:ring-zinc-800"
                  }`}
                >
                  {eur(b)}
                </button>
              ))}
            </div>
          </Panel>

          <Panel title="Equipo actual">
            <div className="space-y-4 text-sm">
              <Field label="Dispositivo" icon={Laptop}>
                <Segmented
                  value={dispositivo}
                  onChange={setDispositivo}
                  options={[
                    { value: "portatil", label: "Portátil" },
                    { value: "sobremesa", label: "Sobremesa" },
                  ]}
                />
              </Field>
              <Field label="GPU" icon={Cpu}>
                <Segmented
                  value={gpu}
                  onChange={setGpu}
                  options={[
                    { value: "integrada", label: "Integrada" },
                    { value: "media", label: "Media" },
                    { value: "alta", label: "Alta" },
                  ]}
                />
              </Field>
              <Field label="Mesa (fondo × ancho, cm)" icon={Ruler}>
                <div className="flex items-center gap-2">
                  <NumberInput value={mesaFondo} onChange={setMesaFondo} placeholder="Fondo" />
                  <span className="text-zinc-500 dark:text-zinc-400">×</span>
                  <NumberInput value={mesaAncho} onChange={setMesaAncho} placeholder="Ancho" />
                </div>
              </Field>
              <Field label="Monitor actual" icon={MonitorSmartphone}>
                <select
                  value={monitorActual}
                  onChange={(e) => setMonitorActual(e.target.value)}
                  className="w-full rounded-md border border-zinc-200 bg-transparent px-2 py-1.5 dark:border-zinc-800"
                >
                  {CURRENT_MONITORS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </Panel>

          <Panel title={`Ponderaciones · ${PROFILES.find((p) => p.id === profile)?.label}`}>
            <ul className="space-y-1.5 text-sm">
              {(Object.entries(result.weights) as [Criterion, number][])
                .sort((a, b) => b[1] - a[1])
                .map(([c, w]) => (
                  <li key={c} className="flex items-center gap-2">
                    <span className="w-24 text-zinc-500">{CRITERIA_LABELS[c]}</span>
                    <div className="h-1.5 flex-1 rounded-full bg-zinc-100 dark:bg-zinc-800">
                      <div className="h-full rounded-full bg-zinc-400" style={{ width: `${w * 250}%` }} />
                    </div>
                    <span className="w-9 text-right tabular-nums text-zinc-500">{Math.round(w * 100)}%</span>
                  </li>
                ))}
            </ul>
          </Panel>
        </aside>

        {/* ── Resultados ── */}
        <section className="min-w-0 space-y-6">
          {result.winner ? (
            <WinnerCard item={result.winner} />
          ) : (
            <div className="rounded-xl border border-dashed border-rose-300 p-8 text-center dark:border-rose-900">
              <XCircle className="mx-auto size-8 text-rose-500" />
              <p className="mt-2 font-medium">Ningún monitor supera los filtros</p>
              <p className="text-sm text-zinc-500">Sube el presupuesto o revisa las restricciones del equipo.</p>
            </div>
          )}

          {result.worthWaiting && (
            <div className="flex gap-3 rounded-xl bg-amber-50 p-4 text-sm ring-1 ring-amber-200 dark:bg-amber-950/50 dark:ring-amber-900">
              <Clock className="mt-0.5 size-5 shrink-0 text-amber-600" />
              <div>
                <p className="font-medium text-amber-900 dark:text-amber-200">
                  Merece la pena esperar: {result.worthWaiting.monitor.marca} {result.worthWaiting.monitor.modelo} (
                  {result.worthWaiting.score}/100)
                </p>
                <p className="text-amber-800/80 dark:text-amber-300/80">{result.worthWaiting.verdictReason}</p>
              </div>
            </div>
          )}

          <div>
            <h2 className="mb-3 text-sm font-medium text-zinc-500">Ranking completo</h2>
            <ul className="divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
              {result.ranking.map((item, i) => (
                <RankingRow key={item.monitor.id} item={item} position={i + 1} />
              ))}
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}

// ───────────────────────────── Componentes ─────────────────────────────

function WinnerCard({ item }: { item: ScoredMonitor }) {
  const m = item.monitor;
  return (
    <article className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
            <Trophy className="size-4" /> El algoritmo elige
          </div>
          <h2 className="mt-1 text-xl font-semibold">
            {m.marca} {m.modelo}
          </h2>
          <p className="mt-0.5 text-sm text-zinc-500">
            {specLine(item)} · <span className="font-medium text-zinc-900 dark:text-zinc-100">{eur(m.precio_eur)}</span>
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <VerdictBadge verdict={item.verdict} label={item.verdictLabel} />
            <span className="text-sm text-zinc-500">{item.verdictReason}</span>
          </div>
        </div>
        <ScoreDial score={item.score} base={item.baseScore} />
      </div>

      {item.highlights.length > 0 && (
        <ul className="mt-5 space-y-1.5 text-sm">
          {item.highlights.map((h) => (
            <li key={h} className="flex items-center gap-2">
              <CircleCheck className="size-4 text-brand" /> {h}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5 border-t border-zinc-100 pt-5 dark:border-zinc-800">
        <Breakdown item={item} />
      </div>
    </article>
  );
}

function RankingRow({ item, position }: { item: ScoredMonitor; position: number }) {
  const [open, setOpen] = useState(false);
  const m = item.monitor;
  const discarded = item.verdict === "descartado";
  return (
    <li>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-zinc-50 dark:hover:bg-zinc-900"
      >
        <span className="w-5 text-sm tabular-nums text-zinc-500 dark:text-zinc-400">{position}</span>
        <span className={`w-10 text-right text-lg font-semibold tabular-nums ${discarded ? "text-zinc-500 dark:text-zinc-400" : ""}`}>
          {item.score}
        </span>
        <div className="min-w-0 flex-1">
          <p className={`truncate font-medium ${discarded ? "text-zinc-500 dark:text-zinc-400" : ""}`}>
            {m.marca} {m.modelo}
          </p>
          <p className="truncate text-xs text-zinc-500">{item.verdictReason}</p>
        </div>
        <span className="hidden text-sm tabular-nums text-zinc-500 sm:block">{eur(m.precio_eur)}</span>
        <VerdictBadge verdict={item.verdict} label={item.verdictLabel} compact />
        <ChevronDown className={`size-4 shrink-0 text-zinc-500 dark:text-zinc-400 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="bg-zinc-50/60 px-4 pb-5 pt-2 dark:bg-zinc-900/40 sm:pl-[4.75rem]">
          <p className="mb-4 text-sm text-zinc-500">
            {specLine(item)} · {eur(m.precio_eur)} (mín. histórico {eur(m.precio_minimo_historico_eur)})
          </p>
          <Breakdown item={item} />
        </div>
      )}
    </li>
  );
}

function Breakdown({ item }: { item: ScoredMonitor }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">Sub-notas</h3>
        <ul className="space-y-1.5 text-sm">
          {(Object.entries(item.subscores) as [Criterion, number][]).map(([c, v]) => (
            <li key={c} className="flex items-center gap-2">
              <span className="w-24 text-zinc-500">{CRITERIA_LABELS[c]}</span>
              <div className="h-1.5 flex-1 rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div
                  className={`h-full rounded-full ${v >= 70 ? "bg-emerald-500" : v >= 50 ? "bg-amber-500" : "bg-rose-500"}`}
                  style={{ width: `${v}%` }}
                />
              </div>
              <span className="w-8 text-right tabular-nums">{v}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
          Reglas aplicadas · base {item.baseScore} → {item.score}
        </h3>
        {item.exclusions.length === 0 && item.adjustments.length === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Ninguna regla de perfil afecta a este monitor.</p>
        )}
        <ul className="space-y-2 text-sm">
          {item.exclusions.map((e) => (
            <li key={e} className="flex gap-2 text-rose-700 dark:text-rose-400">
              <XCircle className="mt-0.5 size-4 shrink-0" /> {e}
            </li>
          ))}
          {item.adjustments.map((a) => (
            <li key={a.rule} className="flex gap-2">
              <span
                className={`mt-0.5 inline-flex h-5 min-w-9 items-center justify-center gap-0.5 rounded px-1 text-xs font-medium tabular-nums ${
                  a.delta > 0
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                    : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                }`}
              >
                {a.delta > 0 ? <Plus className="size-3" /> : <Minus className="size-3" />}
                {Math.abs(a.delta)}
              </span>
              <span>{a.reason}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ScoreDial({ score, base }: { score: number; base: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const color = score >= 70 ? "text-emerald-500" : score >= 50 ? "text-amber-500" : "text-rose-500";
  return (
    <div className="relative size-24 shrink-0">
      <svg viewBox="0 0 80 80" className="size-full -rotate-90">
        <circle cx="40" cy="40" r={r} className="fill-none stroke-zinc-100 dark:stroke-zinc-800" strokeWidth="7" />
        <circle
          cx="40"
          cy="40"
          r={r}
          className={`fill-none stroke-current transition-all duration-500 ${color}`}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - score / 100)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-semibold tabular-nums">{score}</span>
        <span className="text-[10px] text-zinc-500">base {base}</span>
      </div>
    </div>
  );
}

function VerdictBadge({ verdict, label, compact }: { verdict: Verdict; label: string; compact?: boolean }) {
  const Icon = verdict === "recomendado" ? CircleCheck : verdict === "con_oferta" ? TriangleAlert : XCircle;
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${VERDICT_STYLES[verdict]}`}
      title={label}
    >
      {compact ? <Icon className="size-3.5" /> : label}
    </span>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, icon: Icon, children }: { label: string; icon: typeof Laptop; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-xs text-zinc-500">
        <Icon className="size-3.5" /> {label}
      </label>
      {children}
    </div>
  );
}

function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="flex rounded-md bg-zinc-100 p-0.5 dark:bg-zinc-900">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded px-2 py-1 text-xs font-medium transition ${
            value === o.value ? "bg-white shadow-sm dark:bg-zinc-700" : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function NumberInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <input
      type="number"
      min={0}
      inputMode="numeric"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full min-w-0 rounded-md border border-zinc-200 bg-transparent px-2 py-1.5 tabular-nums dark:border-zinc-800"
    />
  );
}

function specLine({ monitor: m, ppi }: ScoredMonitor) {
  return `${m.pulgadas}" ${m.resolucion.ancho}×${m.resolucion.alto} · ${m.hz} Hz · ${m.panel} · ${ppi} ppi · USB-C ${
    m.usbC_PD_watts ? `${m.usbC_PD_watts} W` : "—"
  }`;
}
