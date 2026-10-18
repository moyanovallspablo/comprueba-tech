import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogExplorer } from "@/components/catalog/CatalogExplorer";
import { CatalogFromUrl } from "@/components/catalog/CatalogFromUrl";

export const metadata: Metadata = {
  title: "Catálogo de monitores",
  description:
    "Todos los monitores analizados: filtra por precio, resolución, refresco, panel y carga USB-C, y ordénalos por la puntuación para tu uso.",
  alternates: { canonical: "/monitores" },
};

/**
 * Los filtros de la URL solo existen en el navegador: el HTML estático lleva el catálogo completo (fallback,
 * indexable) y al hidratar se aplica lo que pida la URL.
 */
export default function CatalogPage() {
  return (
    <Suspense fallback={<CatalogExplorer />}>
      <CatalogFromUrl />
    </Suspense>
  );
}
