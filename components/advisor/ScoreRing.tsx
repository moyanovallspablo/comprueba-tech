"use client";

import { motion } from "motion/react";
import { cx } from "./ui";

export function ScoreRing({ score, size = 64 }: { score: number; size?: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const color = score >= 70 ? "stroke-emerald-500" : score >= 50 ? "stroke-amber-500" : "stroke-rose-500";
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} aria-label={`Nota ${score} sobre 100`}>
      <svg viewBox="0 0 64 64" className="size-full -rotate-90">
        <circle cx="32" cy="32" r={r} className="fill-none stroke-black/[0.06]" strokeWidth="5" />
        <motion.circle
          cx="32"
          cy="32"
          r={r}
          className={cx("fill-none", color)}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - score / 100) }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center font-mono text-lg font-semibold tabular-nums text-ink">
        {score}
      </span>
    </div>
  );
}
