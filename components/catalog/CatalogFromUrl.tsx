"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { catalogStateFromParams } from "@/lib/catalog";
import { CatalogExplorer } from "./CatalogExplorer";

/** Catálogo con los filtros de la URL (?perfil=…&res=…&max=…). La `key` lo reinicia si cambian los parámetros. */
export function CatalogFromUrl() {
  const sp = useSearchParams();
  const qs = sp.toString();
  const state = useMemo(() => catalogStateFromParams(new URLSearchParams(qs)), [qs]);
  return <CatalogExplorer key={qs} initialFilters={state.filters} initialProfile={state.profile} />;
}
