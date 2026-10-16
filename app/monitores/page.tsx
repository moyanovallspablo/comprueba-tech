import type { Metadata } from "next";
import { CatalogExplorer } from "@/components/catalog/CatalogExplorer";

export const metadata: Metadata = {
  title: "Catálogo de monitores",
  description:
    "Todos los monitores analizados: filtra por precio, resolución, refresco, panel y carga USB-C, y ordénalos por la puntuación para tu uso.",
};

export default function CatalogPage() {
  return <CatalogExplorer />;
}
