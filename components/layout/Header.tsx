"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { cx } from "@/components/advisor/ui";
import { BrandMark, Wordmark } from "@/components/site/BrandMark";
import { useSetup } from "@/lib/setup-store";
import { CommandPalette } from "./CommandPalette";
import { NAV_ITEMS } from "./nav";
import { SetupDrawer } from "./SetupDrawer";

const noopSubscribe = () => () => {};

/** "⌘K" en Apple, "Ctrl K" en el resto. En servidor siempre "Ctrl K" (sin desajuste de hidratación). */
function useShortcutLabel() {
  return useSyncExternalStore(
    noopSubscribe,
    () => (/Mac|iPhone|iPad/.test(navigator.userAgent) ? "⌘K" : "Ctrl K"),
    () => "Ctrl K",
  );
}

function isEditable(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  return !!el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));
}

export function Header() {
  const pathname = usePathname();
  const setup = useSetup();
  const shortcut = useShortcutLabel();
  const [setupOpen, setSetupOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const lastTrigger = useRef<HTMLElement | null>(null);

  const openSearch = () => {
    lastTrigger.current = document.activeElement as HTMLElement | null;
    setSearchOpen(true);
  };
  const closeSearch = () => {
    setSearchOpen(false);
    lastTrigger.current?.focus(); // devuelve el foco a quien abrió el buscador
  };

  // Atajos globales: ⌘K / Ctrl+K abren o cierran; "/" abre si no se está escribiendo.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        lastTrigger.current = document.activeElement as HTMLElement | null;
        setSearchOpen((o) => !o);
      } else if (e.key === "/" && !isEditable(e.target)) {
        e.preventDefault();
        lastTrigger.current = document.activeElement as HTMLElement | null;
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-hairline bg-canvas/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Link href="/" className="group flex shrink-0 items-center gap-3 rounded-lg" aria-label="comprueba.tech, inicio">
            <span className="relative">
              <span
                aria-hidden
                className="absolute inset-0 rounded-[9px] bg-brand-accent opacity-40 blur-md transition-opacity duration-300 group-hover:opacity-70"
              />
              <BrandMark size={28} className="relative transition-transform duration-300 ease-out-soft group-hover:-rotate-6" />
            </span>
            <Wordmark className="text-[15px] font-semibold tracking-tight" />
          </Link>

          {/* Navegación (escritorio) */}
          <nav aria-label="Principal" className="mx-auto hidden md:block">
            <ul className="flex items-center gap-0.5 rounded-full bg-black/[0.035] p-1">
              {NAV_ITEMS.map(({ href, label, shortLabel, icon: Icon, isActive }) => {
                const active = isActive(pathname);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={cx(
                        "relative flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                        active ? "text-ink" : "text-zinc-500 hover:text-ink",
                      )}
                    >
                      {active && (
                        <motion.span
                          layoutId="nav-pill"
                          className="absolute inset-0 rounded-full bg-white shadow-elevated ring-1 ring-brand-border"
                          transition={{ type: "spring", stiffness: 500, damping: 40 }}
                        />
                      )}
                      <Icon className={cx("relative size-4", active && "text-brand")} />
                      {shortLabel ? (
                        <>
                          <span className="relative lg:hidden">{shortLabel}</span>
                          <span className="relative hidden lg:inline">{label}</span>
                        </>
                      ) : (
                        <span className="relative">{label}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <button
              onClick={openSearch}
              aria-label="Buscar monitor"
              aria-keyshortcuts="Control+K Meta+K /"
              className="group flex size-10 items-center justify-center gap-2 rounded-full border border-hairline bg-white text-sm text-zinc-500 shadow-elevated transition hover:border-brand-border hover:text-ink lg:w-60 lg:justify-start lg:px-4"
            >
              <Search className="size-4 shrink-0 transition-colors group-hover:text-brand-strong" />
              <span className="hidden flex-1 text-left lg:block">Buscar monitor…</span>
              <kbd className="hidden rounded-md border border-hairline bg-canvas px-2 py-0.5 font-mono text-[10px] text-zinc-500 lg:block">
                {shortcut}
              </kbd>
            </button>
            <button
              onClick={() => setSetupOpen(true)}
              className="relative inline-flex h-10 items-center gap-2 rounded-full border border-hairline bg-white px-3 text-sm font-medium shadow-elevated transition hover:border-brand-border sm:px-4"
            >
              <SlidersHorizontal className="size-4 shrink-0" />
              <span className="max-xs:sr-only">Mi Setup</span>
              {setup.completed && (
                <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-brand-accent shadow-[0_0_0_3px_var(--brand-glow)]" />
              )}
            </button>
          </div>
        </div>

        {/* Navegación (móvil): segunda fila con una pestaña por sección */}
        <nav aria-label="Principal" className="border-t border-hairline md:hidden">
          <ul className="grid h-12 grid-cols-4">
            {NAV_ITEMS.map(({ href, label, shortLabel, icon: Icon, isActive }) => {
              const active = isActive(pathname);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cx(
                      "relative flex h-full items-center justify-center gap-1.5 text-[13px] font-medium transition-colors max-xs:text-xs",
                      active ? "text-ink" : "text-zinc-500",
                    )}
                  >
                    <Icon className={cx("size-4 shrink-0 max-sm:hidden", active && "text-brand")} />
                    {shortLabel ?? label}
                    {active && (
                      <motion.span
                        layoutId="nav-underline"
                        className="absolute inset-x-4 -bottom-px h-0.5 rounded-full bg-gradient-to-r from-brand to-brand-accent"
                        transition={{ type: "spring", stiffness: 500, damping: 40 }}
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>

      <SetupDrawer open={setupOpen} onClose={() => setSetupOpen(false)} setup={setup} />
      <CommandPalette open={searchOpen} onClose={closeSearch} />
    </>
  );
}
