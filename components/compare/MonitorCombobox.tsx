"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { eur } from "@/components/advisor/setup";
import { cx } from "@/components/advisor/ui";
import { getMonitor } from "@/data/monitors";
import { searchMonitors } from "@/lib/search";

/**
 * Desplegable con buscador para elegir un monitor del catálogo.
 * Patrón combobox: el botón abre un panel con un campo de búsqueda (role=combobox) y una lista (role=listbox).
 */
export function MonitorCombobox({
  value,
  onChange,
  label,
  badge,
}: {
  value: string;
  onChange: (id: string) => void;
  label: string;
  badge?: string; // "A" / "B"
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLLIElement | null)[]>([]);
  const listId = useId();
  const selected = getMonitor(value);
  const results = useMemo(() => searchMonitors(query), [query]);
  const current = Math.min(active, Math.max(0, results.length - 1));

  // Cierra al pulsar fuera
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  const openPanel = () => {
    setQuery("");
    setActive(Math.max(0, searchMonitors("").findIndex((m) => m.id === value)));
    setOpen(true);
  };

  const choose = (id: string | undefined) => {
    if (!id) return;
    onChange(id);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const move = (next: number) => {
    if (results.length === 0) return;
    const i = (next + results.length) % results.length;
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
        choose(results[current]?.id);
        break;
      case "Escape":
        setOpen(false);
        triggerRef.current?.focus();
        break;
      default:
        return;
    }
    e.preventDefault();
  };

  return (
    <div ref={rootRef} className="relative min-w-0 flex-1">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (open ? setOpen(false) : openPanel())}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${label}: ${selected ? `${selected.marca} ${selected.modelo}` : "sin elegir"}`}
        className={cx(
          "flex w-full items-center gap-3 rounded-2xl border bg-canvas px-4 py-3 text-left transition",
          open ? "border-brand bg-white ring-4 ring-brand-glow" : "border-hairline hover:border-brand-border",
        )}
      >
        {badge && (
          <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-white font-mono text-xs font-semibold text-brand shadow-sm ring-1 ring-brand-border">
            {badge}
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] text-zinc-500">{label}</span>
          <span className="block truncate text-sm font-semibold text-ink">
            {selected ? `${selected.marca} ${selected.modelo}` : "Elige un monitor"}
          </span>
        </span>
        {selected && <span className="hidden font-mono text-xs text-zinc-500 sm:block">{eur(selected.precio_eur)}</span>}
        <ChevronsUpDown className="size-4 shrink-0 text-zinc-500" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-x-0 top-full z-40 mt-2 overflow-hidden rounded-2xl border border-hairline bg-white shadow-float"
          >
            <div className="flex items-center gap-2 border-b border-hairline px-4">
              <Search className="size-4 shrink-0 text-brand" />
              <input
                autoFocus
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                onKeyDown={onKeyDown}
                placeholder="Marca, modelo, 4K, OLED…"
                role="combobox"
                aria-expanded="true"
                aria-controls={listId}
                aria-activedescendant={results[current] ? `${listId}-${current}` : undefined}
                aria-autocomplete="list"
                aria-label={`Buscar ${label.toLowerCase()}`}
                className="h-11 min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-zinc-500"
              />
            </div>
            <ul id={listId} role="listbox" aria-label={label} className="max-h-72 overflow-y-auto p-2">
              {results.length === 0 && <li className="px-3 py-6 text-center text-sm text-zinc-500">Sin resultados</li>}
              {results.map((m, i) => {
                const isActive = i === current;
                const isSelected = m.id === value;
                return (
                  <li
                    key={m.id}
                    id={`${listId}-${i}`}
                    ref={(el) => {
                      optionRefs.current[i] = el;
                    }}
                    role="option"
                    aria-selected={isSelected}
                    onMouseMove={() => i !== current && setActive(i)}
                    onClick={() => choose(m.id)}
                    className={cx(
                      "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2",
                      isActive ? "bg-brand-glow" : "hover:bg-canvas",
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">
                        {m.marca} {m.modelo}
                      </span>
                      <span className={cx("block truncate font-mono text-[11px]", isActive ? "text-zinc-600" : "text-zinc-500")}>
                        {m.pulgadas}&quot; · {m.resolucion.ancho}×{m.resolucion.alto} · {m.hz} Hz · {eur(m.precio_eur)}
                      </span>
                    </span>
                    {isSelected && <Check className="size-4 shrink-0 text-brand" />}
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
