"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Info, RotateCcw, X } from "lucide-react";
import { useEffect } from "react";
import { BudgetSlider } from "@/components/advisor/BudgetSlider";
import {
  CURRENT_MONITORS,
  GPU_OPTIONS,
  PROFILE_OPTIONS,
  eur,
  type Setup,
} from "@/components/advisor/setup";
import { Eyebrow, OptionButton, brandButtonBase, cx } from "@/components/advisor/ui";
import { resetSetup, updateSetup } from "@/lib/setup-store";

/** Panel lateral "Mi Setup": edita el setup global desde cualquier página. */
export function SetupDrawer({ open, onClose, setup }: { open: boolean; onClose: () => void; setup: Setup }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-ink/20 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Mi Setup"
            className="fixed inset-y-2 right-2 z-50 flex w-[calc(100%-1rem)] max-w-sm flex-col overflow-hidden rounded-3xl border border-hairline bg-white shadow-float"
            initial={{ x: "105%" }}
            animate={{ x: 0 }}
            exit={{ x: "105%" }}
            transition={{ type: "spring", stiffness: 380, damping: 40 }}
          >
            <div className="flex items-center justify-between p-6 pb-4">
              <div>
                <Eyebrow>Mi Setup</Eyebrow>
                <p className="mt-1 text-lg font-semibold tracking-tight">
                  {setup.completed ? "Tu configuración" : "Configura tu setup"}
                </p>
              </div>
              <button
                onClick={onClose}
                className="grid size-9 place-items-center rounded-full text-zinc-500 transition hover:bg-black/[0.04] hover:text-ink"
                aria-label="Cerrar"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto px-6 pb-6">
              <Section label="Uso">
                <div className="grid grid-cols-3 gap-2">
                  {PROFILE_OPTIONS.map(({ id, label, icon: Icon }) => (
                    <OptionButton
                      key={id}
                      selected={setup.profile === id}
                      onClick={() => updateSetup({ profile: id })}
                      className="flex flex-col items-center gap-2 px-2 py-3 text-sm font-medium"
                    >
                      <Icon className="size-4.5" strokeWidth={1.75} />
                      {label}
                    </OptionButton>
                  ))}
                </div>
              </Section>

              <Section label="Presupuesto" aside={<span className="font-mono text-sm text-ink">{eur(setup.budget)}</span>}>
                <BudgetSlider value={setup.budget} onChange={(budget) => updateSetup({ budget })} />
              </Section>

              <Section label="Lo conectas a">
                <Segmented
                  value={setup.dispositivo}
                  onChange={(dispositivo) => updateSetup({ dispositivo })}
                  options={[
                    { value: "portatil", label: "Portátil" },
                    { value: "sobremesa", label: "Sobremesa" },
                  ]}
                />
              </Section>

              <Section label="Gráfica">
                <Segmented
                  value={setup.gpu}
                  onChange={(gpu) => updateSetup({ gpu })}
                  options={GPU_OPTIONS.map((g) => ({ value: g.id, label: g.label }))}
                />
                <AnimatePresence initial={false}>
                  {setup.gpuAutoAdjusted && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-start gap-2 overflow-hidden pt-2 text-xs text-zinc-500"
                    >
                      <Info className="mt-px size-3.5 shrink-0" />
                      Para jugar asumimos una gráfica de gama media (RTX 4060). Cámbiala si no es tu caso.
                    </motion.p>
                  )}
                </AnimatePresence>
              </Section>

              <Section label="Monitor actual">
                <select
                  value={setup.monitorActualId}
                  onChange={(e) => updateSetup({ monitorActualId: e.target.value })}
                  className="w-full rounded-xl border border-hairline bg-canvas px-3 py-2 font-mono text-sm text-ink outline-none focus:border-black/20"
                >
                  {CURRENT_MONITORS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </Section>

              <Section label="Mesa (ancho × fondo)">
                <div className="flex items-center gap-2">
                  <CmInput value={setup.mesaAncho} onChange={(mesaAncho) => updateSetup({ mesaAncho })} label="Ancho de mesa" />
                  <span className="text-zinc-300">×</span>
                  <CmInput value={setup.mesaFondo} onChange={(mesaFondo) => updateSetup({ mesaFondo })} label="Fondo de mesa" />
                </div>
              </Section>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-hairline bg-canvas/60 p-6">
              <button
                onClick={resetSetup}
                className="inline-flex items-center gap-2 text-sm text-zinc-500 transition hover:text-ink"
              >
                <RotateCcw className="size-3.5" /> Empezar de cero
              </button>
              {setup.profile && (
                <Link
                  href="/"
                  onClick={() => {
                    updateSetup({ completed: true });
                    onClose();
                  }}
                  className={cx(brandButtonBase, "px-4 py-2 text-sm")}
                >
                  Ver recomendación <ArrowRight className="size-4" />
                </Link>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function CmInput({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <div className="relative min-w-0 flex-1">
      <input
        type="number"
        min={30}
        max={300}
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Libre"
        aria-label={label}
        className="w-full rounded-xl border border-hairline bg-canvas py-2 pl-3 pr-9 font-mono text-sm text-ink outline-none focus:border-black/20"
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs text-zinc-500">cm</span>
    </div>
  );
}

function Section({ label, aside, children }: { label: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-xs font-medium text-zinc-500">{label}</span>
        {aside}
      </div>
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
    <div className="flex rounded-full bg-canvas p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={cx(
            "flex-1 rounded-full px-3 py-1.5 text-sm font-medium transition",
            value === o.value ? "bg-white text-ink shadow-elevated" : "text-zinc-500 hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
