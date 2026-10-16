"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { getAlternatives, getRecommendation } from "@/lib/engine/calculator";
import { scrollBehavior } from "@/lib/motion";
import { updateSetup, useSetup } from "@/lib/setup-store";
import { Results } from "./Results";
import { toEquipment } from "./setup";
import { Eyebrow } from "./ui";
import { WIZARD_STEPS, Wizard } from "./Wizard";

const EASE = [0.22, 1, 0.36, 1] as const;

export function Advisor() {
  const setup = useSetup();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [editing, setEditing] = useState(false);

  // Sin perfil (primera visita o "Empezar de cero") el wizard siempre arranca en el paso 1.
  const currentStep = setup.profile ? step : 0;
  const showWizard = !setup.completed || editing;

  const goToStep = (target: number) => {
    setDirection(target >= currentStep ? 1 : -1);
    setStep(Math.max(0, Math.min(WIZARD_STEPS.length - 1, target)));
    setEditing(true);
  };

  const complete = () => {
    updateSetup({ completed: true });
    setEditing(false);
    window.scrollTo({ top: 0, behavior: scrollBehavior() });
  };

  // Recalcula en tiempo real con cada cambio del setup (también desde "Mi Setup")
  const equipment = useMemo(() => toEquipment(setup), [setup]);
  const rec = useMemo(
    () => (setup.profile ? getRecommendation(setup.profile, setup.budget, equipment) : null),
    [setup.profile, setup.budget, equipment],
  );
  const alternatives = useMemo(() => (rec ? getAlternatives(rec, equipment) : null), [rec, equipment]);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-20 pt-8 sm:px-6 sm:pt-14">
      <AnimatePresence mode="wait" initial={false}>
        {showWizard || !rec || !alternatives ? (
          <motion.div
            key="wizard"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            <Hero />
            <Wizard
              setup={setup}
              onChange={updateSetup}
              step={currentStep}
              direction={direction}
              onStep={goToStep}
              onComplete={complete}
            />
          </motion.div>
        ) : (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            <div className="mb-8 px-1">
              <Eyebrow>Tu recomendación</Eyebrow>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">El monitor que compraríamos nosotros</h1>
            </div>
            <Results
              setup={setup}
              onChange={updateSetup}
              onEditEquipment={() => goToStep(2)}
              rec={rec}
              alternatives={alternatives}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function Hero() {
  return (
    <div className="mx-auto mb-10 max-w-2xl px-1 text-center">
      <Eyebrow>Asesor de monitores</Eyebrow>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
        Qué monitor comprar.
        <br />
        <span className="text-zinc-500">Y por qué.</span>
      </h1>
      <p className="mx-auto mt-4 max-w-md text-zinc-500">
        Tres preguntas. Analizamos cada monitor con datos reales y te damos un veredicto honesto, con sus sacrificios.
      </p>
    </div>
  );
}
