import { Cable, ExternalLink, Move, Power, SlidersVertical, type LucideIcon } from "lucide-react";
import { BRAND_BUTTON_SIZES, Card, brandButtonBase, cx } from "@/components/advisor/ui";
import { getBuyUrl } from "@/lib/affiliate";
import type { PriceStatus } from "@/lib/engine/calculator";
import { SPEC_GROUPS } from "@/lib/specs";
import type { DailyFriction, FrictionLevel, Monitor } from "@/types/monitor";

// ───────────────────────────── Estado de precio ─────────────────────────────

export function PriceStatusBadge({ status }: { status: PriceStatus }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset",
        status.status === "buen_precio"
          ? "bg-emerald-50 text-emerald-700 ring-emerald-600/15"
          : "bg-rose-50 text-rose-700 ring-rose-600/15",
      )}
    >
      {status.label}
    </span>
  );
}

// ───────────────────────────── Botón de compra ─────────────────────────────

export function BuyButton({
  monitor,
  size = "lg",
  className,
}: {
  monitor: Monitor;
  size?: keyof typeof BRAND_BUTTON_SIZES;
  className?: string;
}) {
  return (
    <a
      href={getBuyUrl(monitor)}
      target="_blank"
      rel="sponsored nofollow noopener noreferrer"
      aria-label={`Cómpralo hoy en Amazon: ${monitor.marca} ${monitor.modelo} (se abre en una pestaña nueva)`}
      className={cx(brandButtonBase, BRAND_BUTTON_SIZES[size], className)}
    >
      Cómpralo hoy <span className="font-normal text-white/75">· Amazon</span>
      <ExternalLink className="size-4" />
    </a>
  );
}

// ───────────────────────────── Fricción diaria ─────────────────────────────

const FRICTION_ITEMS: { key: keyof DailyFriction; label: string; icon: LucideIcon }[] = [
  { key: "peana", label: "Peana", icon: Move },
  { key: "puertos", label: "Puertos", icon: Cable },
  { key: "osd", label: "Menú OSD", icon: SlidersVertical },
  { key: "despertar", label: "Despertar", icon: Power },
];

const FRICTION_STYLE: Record<FrictionLevel, { label: string; className: string; dot: string }> = {
  baja: { label: "Sin fricción", className: "text-emerald-700", dot: "bg-emerald-500" },
  media: { label: "Algo de fricción", className: "text-amber-700", dot: "bg-amber-500" },
  alta: { label: "Fricción alta", className: "text-rose-700", dot: "bg-rose-500" },
};

export function DailyFrictionGrid({ friction }: { friction: DailyFriction }) {
  return (
    <div className="grid gap-px overflow-hidden rounded-3xl border border-hairline bg-hairline shadow-elevated sm:grid-cols-2">
      {FRICTION_ITEMS.map(({ key, label, icon: Icon }) => {
        const note = friction[key];
        const style = FRICTION_STYLE[note.nivel];
        return (
          <div key={key} className="bg-white p-6 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-3 text-sm font-semibold text-ink">
                <span className="grid size-8 place-items-center rounded-lg bg-canvas">
                  <Icon className="size-4" />
                </span>
                {label}
              </span>
              <span className={cx("flex items-center gap-2 text-xs font-medium", style.className)}>
                <span className={cx("size-1.5 rounded-full", style.dot)} />
                {style.label}
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600">{note.nota}</p>
          </div>
        );
      })}
    </div>
  );
}

// ───────────────────────────── Especificaciones ─────────────────────────────

export function SpecTable({ monitor }: { monitor: Monitor }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {SPEC_GROUPS.map((group) => (
        <Card key={group.id} className="p-6 sm:p-6">
          <h3 className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">{group.label}</h3>
          <dl className="mt-3 divide-y divide-hairline">
            {group.rows.map((row) => (
              <div key={row.key} className="flex items-baseline justify-between gap-4 py-2.5 text-sm">
                <dt className="shrink-0 text-zinc-500">{row.label}</dt>
                <dd className="min-w-0 text-right font-mono font-medium text-ink">{row.format(monitor)}</dd>
              </div>
            ))}
          </dl>
        </Card>
      ))}
    </div>
  );
}

export function SectionTitle({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <div className="mb-6 px-1">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">{eyebrow}</p>
      <h2 className="mt-2 text-xl font-semibold tracking-tight text-ink sm:text-2xl">{title}</h2>
      {description && <p className="mt-1 text-sm text-zinc-500">{description}</p>}
    </div>
  );
}
