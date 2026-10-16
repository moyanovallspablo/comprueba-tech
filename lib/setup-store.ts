"use client";

import { useSyncExternalStore } from "react";
import { applySetupPatch, INITIAL_SETUP, type Setup } from "@/components/advisor/setup";
import type { GpuTier, Profile } from "@/types/monitor";

/**
 * Setup del usuario compartido entre páginas (landing, ficha, comparador y panel "Mi Setup").
 * Se persiste en localStorage como comodidad; si no está disponible, vive solo en memoria.
 * El servidor siempre renderiza INITIAL_SETUP y el cliente se sincroniza tras hidratar.
 */

const STORAGE_KEY = "comprueba.setup.v1";
const PROFILES: Profile[] = ["mac", "gaming", "oficina"];
const GPUS: GpuTier[] = ["integrada", "media", "alta"];

let current: Setup | null = null;
const listeners = new Set<() => void>();

function sanitize(raw: unknown): Setup {
  if (!raw || typeof raw !== "object") return INITIAL_SETUP;
  const r = raw as Partial<Record<keyof Setup, unknown>>;
  return {
    profile: PROFILES.includes(r.profile as Profile) ? (r.profile as Profile) : null,
    budget: typeof r.budget === "number" && r.budget > 0 ? r.budget : INITIAL_SETUP.budget,
    dispositivo: r.dispositivo === "sobremesa" ? "sobremesa" : "portatil",
    gpu: GPUS.includes(r.gpu as GpuTier) ? (r.gpu as GpuTier) : INITIAL_SETUP.gpu,
    monitorActualId: typeof r.monitorActualId === "string" ? r.monitorActualId : INITIAL_SETUP.monitorActualId,
    mesaFondo: typeof r.mesaFondo === "string" ? r.mesaFondo : "",
    mesaAncho: typeof r.mesaAncho === "string" ? r.mesaAncho : "",
    completed: r.completed === true && PROFILES.includes(r.profile as Profile),
    gpuAutoAdjusted: r.gpuAutoAdjusted === true,
  };
}

function load(): Setup {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? sanitize(JSON.parse(raw)) : INITIAL_SETUP;
  } catch {
    return INITIAL_SETUP;
  }
}

function persist(s: Setup) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // Modo privado o almacenamiento bloqueado: seguimos en memoria.
  }
}

function emit() {
  listeners.forEach((l) => l());
}

function getSnapshot(): Setup {
  if (current === null) current = load();
  return current;
}

function getServerSnapshot(): Setup {
  return INITIAL_SETUP;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return;
    current = load();
    emit();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function updateSetup(patch: Partial<Setup>) {
  current = applySetupPatch(getSnapshot(), patch);
  persist(current);
  emit();
}

export function resetSetup() {
  current = INITIAL_SETUP;
  persist(current);
  emit();
}

export function useSetup(): Setup {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
