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
        className="group flex h-14 w-full items-center gap-3 rounded-full border border-zinc-200 bg-white pl-5 pr-2 text-left shadow-md shadow-emerald-950/5 transition duration-200 ease-out-soft hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-950/10 focus-visible:border-emerald-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 motion-reduce:transition-none"
      >
        <Search className="size-5 shrink-0 text-emerald-600" aria-hidden />
        <span className="min-w-0 flex-1 truncate text-[15px] text-zinc-600">
          Busca un modelo, «oled», «4k» o «dell vs lg»…
        </span>
        {/* Menta con texto ink (7,74:1 → 10,22:1 en hover): blanco sobre emerald-600/500 no llega ni a AA */}
        <span className="hidden shrink-0 rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-ink transition duration-200 ease-out-soft group-hover:bg-emerald-400 group-hover:shadow-glow motion-reduce:transition-none sm:inline-flex">
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
