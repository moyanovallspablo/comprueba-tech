import type { CSSProperties } from "react";
import { BUDGET_MAX, BUDGET_MIN } from "./setup";
import { cx } from "./ui";

export function BudgetSlider({
  value,
  onChange,
  className,
}: {
  value: number;
  onChange: (v: number) => void;
  className?: string;
}) {
  const fill = ((Math.min(value, BUDGET_MAX) - BUDGET_MIN) / (BUDGET_MAX - BUDGET_MIN)) * 100;
  return (
    <input
      type="range"
      min={BUDGET_MIN}
      max={BUDGET_MAX}
      step={10}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      aria-label="Presupuesto"
      className={cx("range-brand w-full", className)}
      style={{ "--fill": `${fill}%` } as CSSProperties}
    />
  );
}
