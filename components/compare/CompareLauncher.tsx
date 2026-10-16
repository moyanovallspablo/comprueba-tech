"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Box, ArrowRight } from "lucide-react";
import { useState } from "react";
import { eur } from "@/components/advisor/setup";
import { GlowFrame, brandButtonBase, cx } from "@/components/advisor/ui";
import { MonitorIllustration } from "@/components/monitor/MonitorIllustration";
import { getMonitor } from "@/data/monitors";
import { getPpi } from "@/lib/engine/calculator";
import { formatDeltaCm } from "@/lib/physical";
import { compare3dHref, compareHref } from "@/lib/routes";
import { SwapButton } from "./CompareClient";
import { MonitorCombobox } from "./MonitorCombobox";

/** Selector frente a frente del hub /comparar, con vista previa a escala y diferencias rápidas. */
export function CompareLauncher({ initialA, initialB }: { initialA: string; initialB: string }) {
  const router = useRouter();
  const [a, setA] = useState(initialA);
  const [b, setB] = useState(initialB);

  // Elegir en un lado el que ya está en el otro equivale a intercambiarlos.
  const pickA = (id: string) => {
    if (id === b) setB(a);
    setA(id);
  };
  const pickB = (id: string) => {
    if (id === a) setA(b);
    setB(id);
  };

  const ma = getMonitor(a)!;
  const mb = getMonitor(b)!;
  const deltas: { label: string; value: string }[] = [
    { label: "Precio", value: signedEur(mb.precio_eur - ma.precio_eur) },
    { label: "Ancho", value: formatDeltaCm(mb.ancho_cm - ma.ancho_cm) },
    { label: "Refresco", value: signed(mb.hz - ma.hz, "Hz") },
    { label: "Densidad", value: signed(Math.round(getPpi(mb)) - Math.round(getPpi(ma)), "ppi") },
  ];

  return (
    <GlowFrame>
      <div className="rounded-[calc(1.5rem-1px)] bg-white p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <MonitorCombobox value={a} onChange={pickA} label="Monitor A" badge="A" />
          <SwapButton
            onClick={() => {
              setA(b);
              setB(a);
            }}
          />
          <MonitorCombobox value={b} onChange={pickB} label="Monitor B" badge="B" />
        </div>

        {/* Vista previa a la misma escala */}
        <div className="mt-6 grid grid-cols-2 gap-3 rounded-2xl bg-gradient-to-b from-white to-canvas p-3 ring-1 ring-inset ring-hairline sm:gap-6 sm:p-6">
          {[ma, mb].map((m, i) => (
            <figure key={m.id} className="min-w-0">
              <MonitorIllustration monitor={m} className="w-full" />
              <figcaption className="mt-1 text-center">
                <span className="mr-1 font-mono text-[11px] font-semibold text-brand">{i === 0 ? "A" : "B"}</span>
                <span className="text-xs font-medium text-ink">{m.modelo}</span>
                <span className="block font-mono text-[11px] text-zinc-500">{eur(m.precio_eur)}</span>
              </figcaption>
            </figure>
          ))}
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {deltas.map((d) => (
            <div key={d.label} className="rounded-xl bg-canvas/70 px-3 py-2">
              <dt className="text-[10px] text-zinc-500">B frente a A · {d.label}</dt>
              <dd className="font-mono text-sm font-medium text-ink">{d.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => router.push(compare3dHref(a, b))}
            className={cx(brandButtonBase, "h-12 w-full px-6 text-[15px] sm:w-auto")}
          >
            <Box className="size-5" /> Lanzar comparativa 3D
          </button>
          <Link
            href={compareHref(a, b)}
            className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-medium text-ink transition hover:text-brand-strong"
          >
            Ver comparativa completa <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </GlowFrame>
  );
}

function signed(v: number, unit: string) {
  return v === 0 ? "igual" : `${v > 0 ? "+" : "−"}${Math.abs(v)} ${unit}`;
}

function signedEur(v: number) {
  return v === 0 ? "igual" : `${v > 0 ? "+" : "−"}${eur(Math.abs(v))}`;
}
