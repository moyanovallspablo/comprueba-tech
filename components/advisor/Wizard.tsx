"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, Laptop, PcCase, Ruler, Sparkles } from "lucide-react";
import { useState } from "react";
import { HIGH_BUDGET } from "@/lib/engine/calculator";
import { BudgetSlider } from "./BudgetSlider";
import {
  BUDGET_PRESETS,
  CURRENT_MONITORS,
  GPU_OPTIONS,
  PROFILE_OPTIONS,
  eur,
  type Setup,
} from "./setup";
import { Card, Eyebrow, GhostButton, OptionButton, PrimaryButton, cx } from "./ui";

export const WIZARD_STEPS = ["¿Para qué lo quieres?", "¿Cuánto quieres gastar?", "¿Qué equipo usas actualmente?"];

interface WizardProps {
  setup: Setup;
  onChange: (patch: Partial<Setup>) => void;
  step: number;
  direction: number;
  onStep: (step: number) => void;
  onComplete: () => void;
}

export function Wizard({ setup, onChange, step, direction, onStep, onComplete }: WizardProps) {
  const reduce = useReducedMotion();
  const offset = reduce ? 0 : 40;
  const canContinue = step !== 0 || setup.profile !== null;

  const next = () => (step < WIZARD_STEPS.length - 1 ? onStep(step + 1) : onComplete());

  return (
    <Card className="mx-auto w-full max-w-2xl overflow-hidden">
      {/* Progreso */}
      <div className="flex items-center justify-between gap-4 px-6 pt-6 sm:px-8 sm:pt-8">
        <Eyebrow>
          Paso <span className="text-brand">{step + 1}</span> de {WIZARD_STEPS.length}
        </Eyebrow>
        <div className="flex gap-2" aria-hidden>
          {WIZARD_STEPS.map((_, i) => (
            <span key={i} className="relative h-1 w-10 overflow-hidden rounded-full bg-black/[0.06]">
              <motion.span
                className="absolute inset-0 origin-left rounded-full bg-gradient-to-r from-brand to-brand-accent"
                initial={false}
                animate={{ scaleX: i <= step ? 1 : 0 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              />
            </span>
          ))}
        </div>
      </div>

      {/* Pregunta */}
      <div className="relative min-h-106 px-6 py-6 sm:px-8">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={step}
            custom={direction}
            initial={{ opacity: 0, x: direction * offset, filter: "blur(4px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: direction * -offset, filter: "blur(4px)" }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{WIZARD_STEPS[step]}</h2>
            <div className="mt-6">
              {step === 0 && (
                <StepProfile
                  setup={setup}
                  onSelect={(profile) => {
                    // Mac → Apple Silicon (integrada). Al elegir gaming, applySetupPatch sube la integrada a gama media.
                    onChange(profile === "mac" ? { profile, gpu: "integrada" } : { profile });
                    // Deja ver la selección un instante antes de avanzar
                    setTimeout(() => onStep(1), 220);
                  }}
                />
              )}
              {step === 1 && <StepBudget setup={setup} onChange={onChange} />}
              {step === 2 && <StepEquipment setup={setup} onChange={onChange} />}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navegación */}
      <div className="flex items-center justify-between border-t border-hairline bg-canvas/50 px-6 py-4 sm:px-8">
        <GhostButton onClick={() => onStep(step - 1)} className={cx(step === 0 && "invisible")}>
          <ArrowLeft className="size-4" /> <span className="max-sm:sr-only">Atrás</span>
        </GhostButton>
        <PrimaryButton onClick={next} disabled={!canContinue}>
          {step === WIZARD_STEPS.length - 1 ? (
            <>
              Ver mi recomendación <Sparkles className="size-4" />
            </>
          ) : (
            <>
              Continuar <ArrowRight className="size-4" />
            </>
          )}
        </PrimaryButton>
      </div>
    </Card>
  );
}

// ───────────────────────────── Paso 1 ─────────────────────────────

function StepProfile({ setup, onSelect }: { setup: Setup; onSelect: (p: NonNullable<Setup["profile"]>) => void }) {
  return (
    <div className="grid gap-3">
      {PROFILE_OPTIONS.map(({ id, label, description, icon: Icon }) => {
        const selected = setup.profile === id;
        return (
          <OptionButton key={id} selected={selected} onClick={() => onSelect(id)} className="flex items-center gap-4 p-4">
            <span
              className={cx(
                "grid size-12 shrink-0 place-items-center rounded-xl transition",
                selected ? "bg-white text-brand shadow-sm" : "bg-canvas",
              )}
            >
              <Icon className="size-6" strokeWidth={1.75} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{label}</span>
              <span className={cx("block text-sm", selected ? "text-zinc-600" : "text-zinc-500")}>{description}</span>
            </span>
            <span
              className={cx(
                "grid size-6 shrink-0 place-items-center rounded-full border transition",
                selected ? "border-brand bg-brand text-white" : "border-black/10",
              )}
            >
              {selected && <Check className="size-3.5" strokeWidth={3} />}
            </span>
          </OptionButton>
        );
      })}
    </div>
  );
}

// ───────────────────────────── Paso 2 ─────────────────────────────

function StepBudget({ setup, onChange }: { setup: Setup; onChange: (patch: Partial<Setup>) => void }) {
  const high = setup.budget > HIGH_BUDGET;
  return (
    <div>
      <div className="flex items-baseline gap-2">
        <motion.span
          key={setup.budget}
          initial={{ opacity: 0.4, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="font-mono text-5xl font-semibold tracking-tight text-ink tabular-nums sm:text-6xl"
        >
          {setup.budget.toLocaleString("es-ES")}
        </motion.span>
        <span className="font-mono text-2xl text-zinc-500">€</span>
      </div>
      <p className="mt-1 text-sm text-zinc-500">Precio máximo que estarías dispuesto a pagar.</p>

      <BudgetSlider value={setup.budget} onChange={(budget) => onChange({ budget })} className="mt-8" />

      <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {BUDGET_PRESETS.map((p) => (
          <OptionButton
            key={p.value}
            selected={setup.budget === p.value}
            onClick={() => onChange({ budget: p.value })}
            className="px-3 py-2.5"
          >
            <span className="block text-xs opacity-60">{p.label}</span>
            <span className="block font-mono text-sm font-medium tabular-nums">{eur(p.value)}</span>
          </OptionButton>
        ))}
      </div>

      <AnimatePresence initial={false}>
        {high && (
          <motion.p
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 20 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-start gap-2 overflow-hidden rounded-xl bg-brand-glow px-4 py-3 text-sm text-zinc-700 ring-1 ring-inset ring-brand-border"
          >
            <Sparkles className="mt-0.5 size-4 shrink-0 text-brand" />
            Con más de {eur(HIGH_BUDGET)} priorizamos imagen y construcción por encima del precio.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// ───────────────────────────── Paso 3 ─────────────────────────────

function StepEquipment({ setup, onChange }: { setup: Setup; onChange: (patch: Partial<Setup>) => void }) {
  const [showDesk, setShowDesk] = useState(setup.mesaFondo !== "");
  const isMac = setup.profile === "mac";

  return (
    <div className="space-y-6">
      <Question label="Lo conectarás a…">
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              { id: "portatil", label: "Portátil", hint: isMac ? "MacBook Air / Pro" : "Ultrabook, portátil", icon: Laptop },
              { id: "sobremesa", label: "Sobremesa", hint: isMac ? "Mac mini / Studio" : "Torre, mini PC", icon: PcCase },
            ] as const
          ).map(({ id, label, hint, icon: Icon }) => (
            <OptionButton
              key={id}
              selected={setup.dispositivo === id}
              onClick={() => onChange({ dispositivo: id })}
              className="flex flex-col items-start gap-2 p-3 sm:flex-row sm:items-center sm:gap-3"
            >
              <Icon className="size-5 shrink-0" strokeWidth={1.75} />
              <span className="min-w-0">
                <span className="block text-sm font-medium">{label}</span>
                <span className="block text-xs opacity-60">{hint}</span>
              </span>
            </OptionButton>
          ))}
        </div>
      </Question>

      <Question label="Tu gráfica" hint={isMac ? "Los Mac con Apple Silicon usan gráfica integrada" : "Solo influye si vas a jugar"}>
        {/* En móvil, una fila por opción: tres columnas de ~75 px cortaban "Integrada". */}
        <div className="grid gap-2 sm:grid-cols-3">
          {GPU_OPTIONS.map((g) => (
            <OptionButton
              key={g.id}
              selected={setup.gpu === g.id}
              onClick={() => onChange({ gpu: g.id })}
              className="flex items-baseline justify-between gap-3 p-3 sm:block"
            >
              <span className="block text-sm font-medium">{g.label}</span>
              <span className="block min-w-0 truncate font-mono text-[11px] opacity-60">{g.hint}</span>
            </OptionButton>
          ))}
        </div>
      </Question>

      <Question label="Monitor que tienes ahora">
        <div className="flex flex-wrap gap-2">
          {CURRENT_MONITORS.map((m) => (
            <OptionButton
              key={m.id}
              selected={setup.monitorActualId === m.id}
              onClick={() => onChange({ monitorActualId: m.id })}
              className="rounded-full px-3 py-1.5 font-mono text-xs"
            >
              {m.label}
            </OptionButton>
          ))}
        </div>
      </Question>

      <div>
        <button
          onClick={() => setShowDesk((s) => !s)}
          className="inline-flex items-center gap-2 text-sm text-zinc-500 transition hover:text-ink"
        >
          <Ruler className="size-4" /> {showDesk ? "Ocultar medidas de mesa" : "Añadir medidas de mesa (opcional)"}
        </button>
        <AnimatePresence initial={false}>
          {showDesk && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <label className="mt-3 flex items-center gap-3 text-sm text-zinc-600">
                Fondo de la mesa
                <span className="relative">
                  <input
                    type="number"
                    min={30}
                    max={150}
                    inputMode="numeric"
                    value={setup.mesaFondo}
                    onChange={(e) => onChange({ mesaFondo: e.target.value })}
                    placeholder="70"
                    className="w-24 rounded-xl border border-hairline bg-canvas py-2 pl-3 pr-9 font-mono text-sm text-ink outline-none transition focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand-glow"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs text-zinc-500">
                    cm
                  </span>
                </span>
              </label>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Question({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="text-sm font-medium text-ink">{label}</span>
        {hint && <span className="text-xs text-zinc-500">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
