"use client";

import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeftRight, CornerDownLeft, Monitor as MonitorIcon, Search, type LucideIcon } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { eur } from "@/components/advisor/setup";
import { cx } from "@/components/advisor/ui";
import { getMonitor, monitors } from "@/data/monitors";
import { POPULAR_COMPARISONS } from "@/data/popular-comparisons";
import { compareHref, monitorHref } from "@/lib/routes";
import { normalize, parseVersusQuery, searchMonitors } from "@/lib/search";
import type { Monitor } from "@/types/monitor";
import { NAV_ITEMS } from "./nav";

type Group = "Comparativas" | "Monitores" | "Páginas";

interface PaletteItem {
  id: string;
  group: Group;
  label: string;
  hint?: string;
  href: string;
  icon: LucideIcon;
}

const shortName = (m: Monitor) => `${m.marca} ${m.modelo}`;
const specHint = (m: Monitor) =>
  `${m.pulgadas}" · ${m.resolucion.ancho}×${m.resolucion.alto} · ${m.hz} Hz · ${m.panel} · ${eur(m.precio_eur)}`;

function monitorItem(m: Monitor): PaletteItem {
  return { id: `m-${m.id}`, group: "Monitores", label: shortName(m), hint: specHint(m), href: monitorHref(m.id), icon: MonitorIcon };
}

function comparisonItem(a: Monitor, b: Monitor, hint?: string): PaletteItem {
  return {
    id: `c-${a.id}-${b.id}`,
    group: "Comparativas",
    label: `${a.modelo} vs ${b.modelo}`,
    hint: hint ?? `${a.marca} · ${b.marca}`,
    href: compareHref(a.id, b.id),
    icon: ArrowLeftRight,
  };
}

const popularItems = POPULAR_COMPARISONS.map((c) => comparisonItem(getMonitor(c.a)!, getMonitor(c.b)!, c.question));

/** Resultados agrupados. Sin texto: sugerencias; con "A vs B": esa comparativa primero. */
function buildItems(query: string): PaletteItem[] {
  const q = normalize(query);
  const pages = NAV_ITEMS.map((n) => ({
    item: { id: `p-${n.href}`, group: "Páginas", label: n.label, hint: n.description, href: n.href, icon: n.icon } as PaletteItem,
    text: normalize(`${n.label} ${n.keywords}`),
  }));

  if (!q) return [...monitors.slice(0, 6).map(monitorItem), ...popularItems.slice(0, 4), ...pages.map((p) => p.item)];

  const tokens = q.split(/\s+/);
  const versus = parseVersusQuery(query);
  const comparisons = popularItems.filter((c) => tokens.every((t) => normalize(`${c.label} ${c.hint}`).includes(t)));
  if (versus) comparisons.unshift(comparisonItem(versus[0], versus[1], "Comparar frente a frente"));

  const found = searchMonitors(query).slice(0, 8).map(monitorItem);
  const matchingPages = pages.filter((p) => tokens.every((t) => p.text.includes(t))).map((p) => p.item);

  const uniqueComparisons = comparisons.filter((c, i) => comparisons.findIndex((x) => x.href === c.href) === i).slice(0, 5);
  return versus
    ? [...uniqueComparisons, ...found, ...matchingPages]
    : [...found, ...uniqueComparisons, ...matchingPages];
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  return <AnimatePresence>{open && <PaletteDialog onClose={onClose} />}</AnimatePresence>;
}

function PaletteDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const listId = useId();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const items = useMemo(() => buildItems(query), [query]);
  const current = Math.min(active, Math.max(0, items.length - 1));

  // Bloquea el scroll de la página mientras el buscador está abierto.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const go = (item: PaletteItem | undefined) => {
    if (!item) return;
    onClose();
    router.push(item.href);
  };

  const move = (next: number) => {
    if (items.length === 0) return;
    const i = (next + items.length) % items.length;
    setActive(i);
    optionRefs.current[i]?.scrollIntoView({ block: "nearest" });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        move(current + 1);
        break;
      case "ArrowUp":
        move(current - 1);
        break;
      case "Enter":
        go(items[current]);
        break;
      case "Escape":
        onClose();
        break;
      default:
        return;
    }
    e.preventDefault();
  };

  // Agrupa conservando el orden de relevancia
  const groups: { name: Group; entries: { item: PaletteItem; index: number }[] }[] = [];
  items.forEach((item, index) => {
    const g = groups.find((x) => x.name === item.group) ?? groups[groups.push({ name: item.group, entries: [] }) - 1];
    g.entries.push({ item, index });
  });

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[8dvh] sm:pt-[12dvh]">
      <motion.div
        className="absolute inset-0 bg-ink/25 backdrop-blur-[3px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Buscar monitores y comparativas"
        className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-hairline bg-white shadow-float"
        initial={{ opacity: 0, y: -12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.98 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-center gap-3 border-b border-hairline px-5">
          <Search className="size-4.5 shrink-0 text-brand" />
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            placeholder='Buscar monitor… prueba "oled", "4k" o "dell vs lg"'
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={items[current] ? `${listId}-${current}` : undefined}
            aria-autocomplete="list"
            className="h-14 min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-zinc-500"
          />
          <kbd className="hidden rounded-md border border-hairline px-2 py-0.5 font-mono text-[10px] text-zinc-500 sm:block">Esc</kbd>
        </div>

        <div id={listId} role="listbox" aria-label="Resultados" className="max-h-[min(60dvh,28rem)] overflow-y-auto p-2">
          {items.length === 0 && (
            <p className="px-3 py-10 text-center text-sm text-zinc-500">
              Nada coincide con «{query}». Prueba con la marca, «1440p», «oled» o «usb-c».
            </p>
          )}
          {groups.map((g) => (
            <div key={g.name} role="group" aria-label={g.name} className="pb-1">
              <p className="px-3 pb-1 pt-3 text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">{g.name}</p>
              {g.entries.map(({ item, index }) => {
                const Icon = item.icon;
                const selected = index === current;
                return (
                  <button
                    key={item.id}
                    id={`${listId}-${index}`}
                    ref={(el) => {
                      optionRefs.current[index] = el;
                    }}
                    role="option"
                    aria-selected={selected}
                    tabIndex={-1}
                    onMouseMove={() => index !== current && setActive(index)}
                    onClick={() => go(item)}
                    className={cx(
                      "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors",
                      selected ? "bg-brand-glow" : "hover:bg-canvas",
                    )}
                  >
                    <span
                      className={cx(
                        "grid size-9 shrink-0 place-items-center rounded-xl transition-colors",
                        selected ? "bg-white text-brand shadow-sm" : "bg-canvas text-zinc-500",
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">{item.label}</span>
                      {item.hint && (
                        <span
                          className={cx(
                            "block truncate text-xs",
                            // Sobre el fondo brand-glow de la fila activa, zinc-500 baja a 4,33:1; zinc-600 da 6,92:1.
                            selected ? "text-zinc-600" : "text-zinc-500",
                            item.group === "Monitores" && "font-mono text-[11px]",
                          )}
                        >
                          {item.hint}
                        </span>
                      )}
                    </span>
                    {selected && <CornerDownLeft className="size-4 shrink-0 text-brand" aria-hidden />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="hidden items-center gap-4 border-t border-hairline bg-canvas/60 px-5 py-2.5 text-[11px] text-zinc-500 sm:flex">
          <span>
            <kbd className="font-mono">↑↓</kbd> navegar
          </span>
          <span>
            <kbd className="font-mono">↵</kbd> abrir
          </span>
          <span>
            <kbd className="font-mono">Esc</kbd> cerrar
          </span>
          <span className="ml-auto">
            Escribe <span className="font-mono text-zinc-500">A vs B</span> para comparar
          </span>
        </div>
      </motion.div>
    </div>
  );
}
