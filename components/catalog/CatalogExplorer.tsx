"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeftRight, Check, Plus, Search, SearchX, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { BUDGET_MAX, PROFILE_OPTIONS, eur, toEquipment } from "@/components/advisor/setup";
import { BRAND_BUTTON_SIZES, Card, Eyebrow, brandButtonBase, cx } from "@/components/advisor/ui";
import { MonitorImage } from "@/components/monitor/MonitorImage";
import { PriceStatusBadge } from "@/components/monitor/ProductParts";
import { monitors } from "@/data/monitors";
import {
  DEFAULT_FILTERS,
  PANEL_OPTIONS,
  PRICE_BOUNDS,
  REFRESH_OPTIONS,
  RESOLUTION_OPTIONS,
  SORT_OPTIONS,
  USBC_OPTIONS,
  activeFilterCount,
  applyFilters,
  facetCounts,
  type CatalogFilters,
  type SortKey,
} from "@/lib/catalog";
import { getPpi, getPriceStatus, scoreMonitor, type ScoredMonitor } from "@/lib/engine/calculator";
import { compareHref, monitorHref } from "@/lib/routes";
import { useSetup } from "@/lib/setup-store";
import type { Monitor, Profile } from "@/types/monitor";

const MAX_COMPARE = 2;
const EASE = [0.22, 1, 0.36, 1] as const;

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function CatalogExplorer({
  initialFilters = DEFAULT_FILTERS,
  initialProfile = null,
}: {
  initialFilters?: CatalogFilters;
  initialProfile?: Profile | null;
}) {
  const setup = useSetup();
  const [filters, setFilters] = useState<CatalogFilters>(initialFilters);
  const [sort, setSort] = useState<SortKey>("score");
  const [profileOverride, setProfileOverride] = useState<Profile | null>(initialProfile);
  const [compare, setCompare] = useState<string[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);

  const update = (patch: Partial<CatalogFilters>) => setFilters((f) => ({ ...f, ...patch }));

  // Puntuación para el perfil del usuario (o el elegido aquí). Sin setup, el presupuesto no excluye nada.
  const profile: Profile = profileOverride ?? setup.profile ?? "oficina";
  const budget = setup.completed ? setup.budget : BUDGET_MAX;
  const equipment = useMemo(() => toEquipment(setup), [setup]);
  const scores = useMemo(
    () => new Map(monitors.map((m) => [m.id, scoreMonitor(m, profile, budget, equipment)])),
    [profile, budget, equipment],
  );

  const results = useMemo(() => {
    const list = applyFilters(filters);
    const byPrice = (a: Monitor, b: Monitor) => a.precio_eur - b.precio_eur;
    return [...list].sort((a, b) =>
      sort === "price-asc"
        ? byPrice(a, b)
        : sort === "price-desc"
          ? -byPrice(a, b)
          : scores.get(b.id)!.score - scores.get(a.id)!.score || byPrice(a, b),
    );
  }, [filters, sort, scores]);

  const counts = useMemo(() => facetCounts(filters), [filters]);
  const activeCount = activeFilterCount(filters);
  const resetFilters = () => setFilters((f) => ({ ...DEFAULT_FILTERS, query: f.query }));

  const toggleCompare = (id: string) =>
    setCompare((c) => (c.includes(id) ? c.filter((x) => x !== id) : c.length < MAX_COMPARE ? [...c, id] : c));

  const panel = <FiltersPanel filters={filters} counts={counts} onChange={update} />;

  return (
    <main className={cx("mx-auto w-full max-w-6xl px-4 pt-8 sm:px-6 sm:pt-12", compare.length ? "pb-44 sm:pb-32" : "pb-20")}>
      <div className="px-1">
        <Eyebrow>Catálogo</Eyebrow>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Todos los monitores, analizados</h1>
        <p className="mt-2 max-w-2xl text-zinc-500">
          {monitors.length} modelos con datos de fabricante, puntuados por el mismo motor que el asesor.
        </p>
      </div>

      {/* Búsqueda */}
      <div className="relative mt-8">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-brand" />
        <input
          type="search"
          value={filters.query}
          onChange={(e) => update({ query: e.target.value })}
          placeholder="Busca por marca, modelo, resolución, «oled», «usb-c»…"
          aria-label="Buscar en el catálogo"
          className="h-14 w-full rounded-2xl border border-hairline bg-white pl-12 pr-12 text-[15px] text-ink shadow-elevated outline-none transition placeholder:text-zinc-500 focus:border-brand focus:ring-4 focus:ring-brand-glow [&::-webkit-search-cancel-button]:hidden"
        />
        {filters.query && (
          <button
            onClick={() => update({ query: "" })}
            aria-label="Borrar búsqueda"
            className="absolute right-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-zinc-500 transition hover:bg-canvas hover:text-ink"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* Filtros laterales (escritorio) */}
        <aside className="hidden lg:block">
          <Card className="sticky top-[calc(var(--header-h)+1.5rem)] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink">Filtros</h2>
              {activeCount > 0 && (
                <button onClick={resetFilters} className="text-xs font-medium text-brand-strong hover:underline">
                  Limpiar ({activeCount})
                </button>
              )}
            </div>
            {panel}
          </Card>
        </aside>

        <section aria-label="Resultados" className="min-w-0">
          {/* Barra de herramientas */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSheetOpen(true)}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-hairline bg-white px-4 text-sm font-medium shadow-elevated lg:hidden"
            >
              <SlidersHorizontal className="size-4" /> Filtros
              {activeCount > 0 && (
                <span className="grid size-5 place-items-center rounded-full bg-brand-strong font-mono text-[11px] text-white">
                  {activeCount}
                </span>
              )}
            </button>
            <p className="mr-auto px-1 text-sm text-zinc-500" aria-live="polite">
              <span className="font-mono font-medium text-ink">{results.length}</span> de {monitors.length} monitores
            </p>
            <label className="sr-only" htmlFor="catalog-sort">
              Ordenar
            </label>
            <select
              id="catalog-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="h-10 max-w-full cursor-pointer rounded-full border border-hairline bg-white px-4 text-sm font-medium text-ink shadow-elevated outline-none transition focus:border-brand focus:ring-4 focus:ring-brand-glow"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Perfil para la puntuación */}
          <div className="mt-3 flex flex-wrap items-center gap-2 px-1 text-xs text-zinc-500">
            <span>Puntuación para</span>
            <div className="flex rounded-full bg-black/[0.035] p-0.5" role="radiogroup" aria-label="Perfil de puntuación">
              {PROFILE_OPTIONS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  role="radio"
                  aria-checked={profile === id}
                  onClick={() => setProfileOverride(id)}
                  className={cx(
                    "inline-flex items-center gap-1 rounded-full px-3 py-1 font-medium transition",
                    profile === id ? "bg-white text-ink shadow-elevated" : "hover:text-ink",
                  )}
                >
                  <Icon className={cx("size-3.5", profile === id && "text-brand")} /> {label}
                </button>
              ))}
            </div>
            {setup.completed && <span className="font-mono">· presupuesto {eur(setup.budget)}</span>}
          </div>

          <ActiveChips filters={filters} onChange={update} onReset={resetFilters} />

          {/* Cuadrícula */}
          {results.length === 0 ? (
            <Card className="mt-6 p-10 text-center">
              <SearchX className="mx-auto size-8 text-zinc-300" />
              <p className="mt-3 font-semibold text-ink">Ningún monitor cumple estos filtros</p>
              <button
                onClick={() => setFilters(DEFAULT_FILTERS)}
                className="mt-3 text-sm font-medium text-brand-strong hover:underline"
              >
                Quitar búsqueda y filtros
              </button>
            </Card>
          ) : (
            <motion.ul layout className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <AnimatePresence mode="popLayout" initial={false}>
                {results.map((m, i) => (
                  <motion.li
                    key={m.id}
                    layout
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.25, ease: EASE }}
                  >
                    <CatalogCard
                      monitor={m}
                      aboveFold={i < 3}
                      scored={scores.get(m.id)!}
                      profileLabel={PROFILE_OPTIONS.find((p) => p.id === profile)!.label}
                      inCompare={compare.includes(m.id)}
                      compareFull={compare.length >= MAX_COMPARE}
                      onToggleCompare={() => toggleCompare(m.id)}
                    />
                  </motion.li>
                ))}
              </AnimatePresence>
            </motion.ul>
          )}
        </section>
      </div>

      <CompareTray ids={compare} onRemove={(id) => setCompare((c) => c.filter((x) => x !== id))} />
      <FiltersSheet open={sheetOpen} onClose={() => setSheetOpen(false)} resultCount={results.length} onReset={resetFilters} activeCount={activeCount}>
        {panel}
      </FiltersSheet>
    </main>
  );
}

// ───────────────────────────── Panel de filtros ─────────────────────────────

function FiltersPanel({
  filters,
  counts,
  onChange,
}: {
  filters: CatalogFilters;
  counts: ReturnType<typeof facetCounts>;
  onChange: (patch: Partial<CatalogFilters>) => void;
}) {
  const span = PRICE_BOUNDS.max - PRICE_BOUNDS.min;
  const pct = (v: number) => ((v - PRICE_BOUNDS.min) / span) * 100;

  return (
    <div className="space-y-6">
      <FilterGroup label="Precio" aside={`${eur(filters.priceMin)} – ${eur(filters.priceMax)}`}>
        <PriceSlider
          label="Desde"
          value={filters.priceMin}
          fill={pct(filters.priceMin)}
          onChange={(v) => onChange({ priceMin: Math.min(v, filters.priceMax) })}
        />
        <PriceSlider
          label="Hasta"
          value={filters.priceMax}
          fill={pct(filters.priceMax)}
          onChange={(v) => onChange({ priceMax: Math.max(v, filters.priceMin) })}
        />
      </FilterGroup>

      <FilterGroup label="Resolución">
        <div className="grid grid-cols-4 gap-2">
          {RESOLUTION_OPTIONS.map((r) => (
            <Chip
              key={r}
              selected={filters.resolutions.includes(r)}
              count={counts.resolutions[r] ?? 0}
              onClick={() => onChange({ resolutions: toggle(filters.resolutions, r) })}
            >
              {r}
            </Chip>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup label="Tasa de refresco">
        <div className="grid grid-cols-3 gap-2">
          {REFRESH_OPTIONS.map((r) => (
            <Chip
              key={r.id}
              selected={filters.refresh.includes(r.id)}
              count={counts.refresh[r.id] ?? 0}
              onClick={() => onChange({ refresh: toggle(filters.refresh, r.id) })}
            >
              {r.label}
            </Chip>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup label="Panel">
        <div className="grid grid-cols-3 gap-2">
          {PANEL_OPTIONS.map((p) => (
            <Chip
              key={p}
              selected={filters.panels.includes(p)}
              count={counts.panels[p] ?? 0}
              onClick={() => onChange({ panels: toggle(filters.panels, p) })}
            >
              {p}
            </Chip>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup label="USB-C con carga (PD)">
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="USB-C con carga">
          {USBC_OPTIONS.map((o) => (
            <Chip
              key={o.id}
              role="radio"
              selected={filters.usbc === o.id}
              count={counts.usbc[o.id]}
              onClick={() => onChange({ usbc: o.id })}
            >
              {o.label}
            </Chip>
          ))}
        </div>
      </FilterGroup>
    </div>
  );
}

function FilterGroup({ label, aside, children }: { label: string; aside?: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-2 flex w-full items-baseline justify-between gap-2 text-xs font-medium text-zinc-500">
        {label}
        {aside && <span className="font-mono text-[11px] text-ink">{aside}</span>}
      </legend>
      {children}
    </fieldset>
  );
}

function Chip({
  selected,
  count,
  onClick,
  role,
  children,
}: {
  selected: boolean;
  count: number;
  onClick: () => void;
  role?: "radio";
  children: ReactNode;
}) {
  const disabled = count === 0 && !selected;
  return (
    <button
      type="button"
      role={role}
      aria-pressed={role ? undefined : selected}
      aria-checked={role ? selected : undefined}
      disabled={disabled}
      onClick={onClick}
      className={cx(
        "flex flex-col items-center rounded-xl border px-1 py-2 text-xs font-medium transition",
        selected
          ? "border-brand bg-brand-glow text-brand-strong shadow-glow-sm"
          : "border-hairline bg-white text-ink hover:border-brand-border",
        disabled && "cursor-not-allowed opacity-40 hover:border-hairline",
      )}
    >
      <span className="whitespace-nowrap">{children}</span>
      <span className={cx("font-mono text-[10px]", selected ? "text-brand" : "text-zinc-500")}>{count}</span>
    </button>
  );
}

function PriceSlider({ label, value, fill, onChange }: { label: string; value: number; fill: number; onChange: (v: number) => void }) {
  return (
    <label className="flex items-center gap-3 py-1">
      <span className="w-10 text-[11px] text-zinc-500">{label}</span>
      <input
        type="range"
        min={PRICE_BOUNDS.min}
        max={PRICE_BOUNDS.max}
        step={50}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={`Precio ${label.toLowerCase()}`}
        className="range-brand min-w-0 flex-1"
        style={{ "--fill": `${fill}%` } as CSSProperties}
      />
    </label>
  );
}

/** Filtros activos como chips quitables, encima de la cuadrícula. */
function ActiveChips({
  filters,
  onChange,
  onReset,
}: {
  filters: CatalogFilters;
  onChange: (patch: Partial<CatalogFilters>) => void;
  onReset: () => void;
}) {
  const chips: { key: string; label: string; remove: () => void }[] = [
    ...(filters.priceMin > PRICE_BOUNDS.min || filters.priceMax < PRICE_BOUNDS.max
      ? [
          {
            key: "price",
            label: `${eur(filters.priceMin)} – ${eur(filters.priceMax)}`,
            remove: () => onChange({ priceMin: PRICE_BOUNDS.min, priceMax: PRICE_BOUNDS.max }),
          },
        ]
      : []),
    ...filters.resolutions.map((r) => ({ key: `r-${r}`, label: r, remove: () => onChange({ resolutions: filters.resolutions.filter((x) => x !== r) }) })),
    ...filters.refresh.map((r) => ({
      key: `h-${r}`,
      label: REFRESH_OPTIONS.find((o) => o.id === r)!.label,
      remove: () => onChange({ refresh: filters.refresh.filter((x) => x !== r) }),
    })),
    ...filters.panels.map((p) => ({ key: `p-${p}`, label: p, remove: () => onChange({ panels: filters.panels.filter((x) => x !== p) }) })),
    ...(filters.usbc !== "any"
      ? [{ key: "usbc", label: `USB-C ${USBC_OPTIONS.find((o) => o.id === filters.usbc)!.label.toLowerCase()}`, remove: () => onChange({ usbc: "any" }) }]
      : []),
  ];
  if (chips.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 px-1">
      {chips.map((c) => (
        <button
          key={c.key}
          onClick={c.remove}
          className="inline-flex items-center gap-1 rounded-full bg-brand-glow py-1 pl-3 pr-2 font-mono text-[11px] text-brand-strong ring-1 ring-inset ring-brand-border transition hover:bg-brand-strong hover:text-white"
          aria-label={`Quitar filtro ${c.label}`}
        >
          {c.label} <X className="size-3" />
        </button>
      ))}
      <button onClick={onReset} className="ml-1 text-xs font-medium text-zinc-500 hover:text-brand-strong">
        Limpiar filtros
      </button>
    </div>
  );
}

// ───────────────────────────── Tarjeta de producto ─────────────────────────────

function CatalogCard({
  monitor: m,
  aboveFold,
  scored,
  profileLabel,
  inCompare,
  compareFull,
  onToggleCompare,
}: {
  monitor: Monitor;
  /** Primeras tarjetas del listado: su imagen se pide con prioridad alta. */
  aboveFold: boolean;
  scored: ScoredMonitor;
  profileLabel: string;
  inCompare: boolean;
  compareFull: boolean;
  onToggleCompare: () => void;
}) {
  const status = getPriceStatus(m);
  const discarded = scored.verdict === "descartado";
  const specs: [string, string][] = [
    ["Pantalla", `${m.pulgadas.toLocaleString("es-ES")}" ${m.relacion_aspecto}`],
    ["Resolución", `${m.resolucion.ancho}×${m.resolucion.alto}`],
    ["Refresco", `${m.hz} Hz`],
    ["Panel", m.panel],
    ["Densidad", `${Math.round(getPpi(m))} ppi`],
    ["USB-C", m.usbC_PD_watts ? `${m.usbC_PD_watts} W` : m.usbC ? "Sin carga" : "—"],
  ];

  return (
    <Card
      className={cx(
        "flex h-full flex-col overflow-hidden transition duration-300 ease-out-soft hover:-translate-y-0.5 hover:shadow-float",
        inCompare && "ring-2 ring-brand",
      )}
    >
      <Link href={monitorHref(m.id)} tabIndex={-1} aria-hidden className="block h-40 bg-gradient-to-b from-white to-canvas px-3 pt-2 sm:h-auto">
        <MonitorImage
          monitor={m}
          priority={aboveFold ? "high" : undefined}
          sizes="(min-width: 1280px) 280px, (min-width: 1024px) 340px, (min-width: 640px) 50vw, 100vw"
          className="h-full sm:h-auto sm:aspect-[3/2]"
        />
      </Link>

      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-zinc-500">{m.marca}</p>
            <h3 className="truncate font-semibold tracking-tight text-ink">
              <Link href={monitorHref(m.id)} className="hover:text-brand-strong">
                {m.modelo}
              </Link>
            </h3>
          </div>
          <span
            title={scored.verdictReason}
            className={cx(
              "shrink-0 rounded-xl px-2 py-1 text-center font-mono leading-tight ring-1 ring-inset",
              discarded
                ? "bg-canvas text-zinc-500 ring-hairline"
                : scored.score >= 70
                  ? "bg-brand-glow text-brand-strong ring-brand-border"
                  : "bg-amber-50 text-amber-800 ring-amber-600/20",
            )}
          >
            <span className="block text-base font-semibold">{scored.score}</span>
            <span className="block text-[9px] uppercase tracking-wider">{profileLabel}</span>
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="text-xl font-semibold tabular-nums text-ink">{eur(m.precio_eur)}</span>
          <PriceStatusBadge status={status} />
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 rounded-xl bg-canvas/70 p-3">
          {specs.map(([k, v]) => (
            <div key={k} className="min-w-0">
              <dt className="text-[10px] text-zinc-500">{k}</dt>
              <dd className="truncate font-mono text-xs font-medium text-ink">{v}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-auto flex gap-2 pt-6">
          <Link href={monitorHref(m.id)} className={cx(brandButtonBase, BRAND_BUTTON_SIZES.sm, "flex-1 whitespace-nowrap")}>
            Ver análisis
          </Link>
          <button
            type="button"
            onClick={onToggleCompare}
            disabled={!inCompare && compareFull}
            aria-pressed={inCompare}
            title={!inCompare && compareFull ? "Ya tienes 2 monitores para comparar" : undefined}
            className={cx(
              "inline-flex items-center justify-center gap-1 rounded-full px-3 py-2 text-xs font-medium ring-1 ring-inset transition",
              inCompare
                ? "bg-brand-glow text-brand-strong ring-brand"
                : "bg-white text-ink ring-hairline hover:ring-brand-border",
              "disabled:cursor-not-allowed disabled:opacity-40",
            )}
          >
            {inCompare ? <Check className="size-3.5" /> : <Plus className="size-3.5" />}
            {inCompare ? "Añadido" : "Comparar"}
          </button>
        </div>
      </div>
    </Card>
  );
}

// ───────────────────────────── Bandeja de comparación ─────────────────────────────

function CompareTray({ ids, onRemove }: { ids: string[]; onRemove: (id: string) => void }) {
  const selected = ids.map((id) => monitors.find((m) => m.id === id)!);
  const ready = selected.length === MAX_COMPARE;

  return (
    <AnimatePresence>
      {selected.length > 0 && (
        <motion.div
          role="region"
          aria-label="Monitores para comparar"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.3, ease: EASE }}
          className="fixed inset-x-3 bottom-3 z-40 mx-auto max-w-2xl rounded-3xl border border-hairline bg-white/90 p-2 shadow-float backdrop-blur-xl sm:bottom-6"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="grid min-w-0 flex-1 grid-cols-2 gap-2">
              {[0, 1].map((i) => {
                const m = selected[i];
                return m ? (
                  <span key={m.id} className="flex min-w-0 items-center gap-2 rounded-2xl bg-brand-glow py-2 pl-3 pr-2 ring-1 ring-inset ring-brand-border">
                    <span className="font-mono text-[11px] font-semibold text-brand">{i === 0 ? "A" : "B"}</span>
                    <span className="min-w-0 flex-1 truncate text-xs font-medium text-ink">{m.modelo}</span>
                    <button
                      onClick={() => onRemove(m.id)}
                      aria-label={`Quitar ${m.modelo}`}
                      className="grid size-6 shrink-0 place-items-center rounded-full text-zinc-500 transition hover:bg-white hover:text-ink"
                    >
                      <X className="size-3.5" />
                    </button>
                  </span>
                ) : (
                  <span key="empty" className="flex items-center rounded-2xl border border-dashed border-black/10 px-3 py-2 text-xs text-zinc-500">
                    Elige otro monitor
                  </span>
                );
              })}
            </div>
            {ready ? (
              <Link href={compareHref(selected[0].id, selected[1].id)} className={cx(brandButtonBase, "px-5 py-2.5 text-sm")}>
                <ArrowLeftRight className="size-4" /> Comparar
              </Link>
            ) : (
              <span className="inline-flex items-center justify-center rounded-full bg-canvas px-5 py-2.5 text-sm font-medium text-zinc-500">
                Elige 2 para comparar
              </span>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ───────────────────────────── Hoja de filtros (móvil) ─────────────────────────────

function FiltersSheet({
  open,
  onClose,
  resultCount,
  activeCount,
  onReset,
  children,
}: {
  open: boolean;
  onClose: () => void;
  resultCount: number;
  activeCount: number;
  onReset: () => void;
  children: ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <motion.div
            className="absolute inset-0 bg-ink/25 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Filtros"
            className="absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col rounded-t-3xl bg-white shadow-float"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 40 }}
          >
            <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
              <h2 className="font-semibold text-ink">Filtros</h2>
              <div className="flex items-center gap-3">
                {activeCount > 0 && (
                  <button onClick={onReset} className="text-xs font-medium text-brand-strong">
                    Limpiar ({activeCount})
                  </button>
                )}
                <button onClick={onClose} aria-label="Cerrar filtros" className="grid size-9 place-items-center rounded-full hover:bg-canvas">
                  <X className="size-4" />
                </button>
              </div>
            </div>
            <div className="overflow-y-auto px-5 py-6">{children}</div>
            <div className="border-t border-hairline p-4">
              <button onClick={onClose} className={cx(brandButtonBase, "w-full px-5 py-3 text-sm")}>
                Ver {resultCount} {resultCount === 1 ? "monitor" : "monitores"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
