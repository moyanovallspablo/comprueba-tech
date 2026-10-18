import { ArrowLeftRight, LayoutGrid, Sparkles, type LucideIcon } from "lucide-react";
import { ADVISOR_HREF } from "@/lib/routes";

export interface NavItem {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  keywords: string;
  isActive: (pathname: string) => boolean;
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: ADVISOR_HREF,
    label: "Asesor",
    description: "Recomendación personalizada en tres preguntas",
    icon: Sparkles,
    keywords: "recomendacion asistente asesor wizard",
    isActive: (p) => p === ADVISOR_HREF,
  },
  {
    href: "/monitores",
    label: "Catálogo",
    description: "Todos los monitores, con filtros",
    icon: LayoutGrid,
    keywords: "catalogo monitores todos filtros",
    // Las fichas (/monitor/[id]) cuelgan del catálogo
    isActive: (p) => p.startsWith("/monitores") || p.startsWith("/monitor/"),
  },
  {
    href: "/comparar",
    label: "Comparativas",
    description: "Frente a frente, con veredicto y vista 3D",
    icon: ArrowLeftRight,
    keywords: "comparar comparativas versus frente a frente",
    isActive: (p) => p.startsWith("/comparar"),
  },
];
