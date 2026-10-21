import { ArrowLeftRight, LayoutGrid, ScanEye, Sparkles, type LucideIcon } from "lucide-react";
import { ADVISOR_HREF, PPI_SIMULATOR_HREF } from "@/lib/routes";

export interface NavItem {
  href: string;
  label: string;
  /** Etiqueta corta para la navegación estrecha (móvil y tablet); si falta se usa `label`. */
  shortLabel?: string;
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
  {
    href: PPI_SIMULATOR_HREF,
    label: "Simulador PPI",
    shortLabel: "PPI",
    description: "Nitidez, PPI y escalado en Windows y macOS",
    icon: ScanEye,
    keywords: "ppi nitidez densidad pixeles escalado retina mac windows simulador distancia",
    isActive: (p) => p.startsWith(PPI_SIMULATOR_HREF),
  },
];
