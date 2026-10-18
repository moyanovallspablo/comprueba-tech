import type { Metadata } from "next";
import { Advisor } from "@/components/advisor/Advisor";
import { ADVISOR_HREF } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Asesor de monitores",
  description:
    "Tres preguntas sobre tu uso, presupuesto y equipo: el algoritmo puntúa cada monitor y te da un veredicto honesto, con sus sacrificios.",
  alternates: { canonical: ADVISOR_HREF },
};

export default function AdvisorPage() {
  return <Advisor />;
}
