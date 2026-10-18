"use client";

import { Search } from "lucide-react";
import { useRef, useState } from "react";
import { CommandPalette } from "@/components/layout/CommandPalette";

/**
 * Buscador protagonista de la portada. Es un disparador del buscador global (mismos resultados, teclado y
 * accesibilidad): al pulsarlo, o al empezar a escribir sobre él, se abre con lo tecleado.
 */
export function HeroSearch() {
  const [open, setOpen] = useState(false);
  const [initialQuery, setInitialQuery] = useState("");
  const trigger = useRef<HTMLButtonElement>(null);

  const openWith = (query: string) => {
    setInitialQuery(query);
    setOpen(true);
  };

  return (
    <>
      <button
        ref={trigger}
        type="button"
        onClick={() => openWith("")}
        onKeyDown={(e) => {
          // Una tecla imprimible abre el buscador con ese carácter ya escrito.
          if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey && e.key !== " ") {
            e.preventDefault();
            e.stopPropagation(); // "/" no debe abrir además el buscador de la cabecera (escucha en window)
            openWith(e.key);
          }
        }}
        aria-haspopup="dialog"
        aria-label="Buscar monitor por marca, modelo o característica"
        className="group flex h-14 w-full items-center gap-3 rounded-full border border-hairline bg-white pl-5 pr-2 text-left shadow-float transition duration-200 ease-out-soft hover:border-brand-border hover:shadow-glow focus-visible:border-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-glow motion-reduce:transition-none"
      >
        <Search className="size-5 shrink-0 text-brand" aria-hidden />
        <span className="min-w-0 flex-1 truncate text-[15px] text-zinc-500">
          Busca un modelo, «oled», «4k» o «dell vs lg»…
        </span>
        <span className="hidden shrink-0 rounded-full bg-brand-strong px-4 py-2 text-sm font-medium text-white shadow-glow-sm transition group-hover:bg-brand-deep sm:inline-flex">
          Buscar
        </span>
      </button>
      <CommandPalette
        open={open}
        initialQuery={initialQuery}
        onClose={() => {
          setOpen(false);
          trigger.current?.focus();
        }}
      />
    </>
  );
}
