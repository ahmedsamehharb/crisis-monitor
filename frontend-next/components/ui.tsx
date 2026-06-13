"use client";

import type { ReactNode } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { Urgency } from "@/lib/types";
import {
  SEV,
  confidenceBarColor,
  confidencePercent,
  type TrendRichtung,
} from "@/lib/ui";

export function UnreadDot({
  count = 1,
  className = "",
}: {
  count?: number;
  className?: string;
}) {
  const { plural } = useI18n();
  if (count <= 0) return null;
  const showCount = count > 1;
  const label = plural("unread", count);
  return (
    <span
      className={`cw-unread-dot shrink-0 ${showCount ? "cw-unread-dot-count" : ""} ${className}`}
      aria-label={label}
      title={label}
    >
      {showCount ? (
        <span className="text-[9px] font-bold leading-none text-[#161616]">
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </span>
  );
}

export function Chip({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border border-line bg-card px-2 py-0.5 text-[11px] font-medium text-mute ${className}`}
    >
      {children}
    </span>
  );
}

export function Pill({
  active = false,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors ${
        active
          ? "border-accent/50 bg-accent/15 text-accent"
          : "border-line bg-transparent text-mute hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function KonfidenzBar({
  value,
  verified = false,
  size = "compact",
}: {
  value: number;
  verified?: boolean;
  size?: "compact" | "full";
}) {
  const { t } = useI18n();
  const pct = confidencePercent(value);
  const fill = confidenceBarColor(value);

  if (size === "compact") {
    return (
      <span
        className="inline-flex w-[54px] flex-col items-end gap-0.5"
        aria-label={t("confidence.aria", { level: `${pct}%` })}
      >
        <span className="flex items-center gap-0.5 text-[11px] font-bold tabular-nums leading-none text-ink">
          {verified && <ShieldCheck className="h-3 w-3 shrink-0 text-[#3FB36B]" aria-hidden strokeWidth={2.4} />}
          {pct}%
        </span>
        <span className="h-1 w-full overflow-hidden rounded-full bg-line/90" aria-hidden>
          <span
            className="block h-full rounded-full transition-[width] duration-300"
            style={{ width: `${pct}%`, backgroundColor: fill }}
          />
        </span>
      </span>
    );
  }

  return (
    <div
      className="flex min-w-[76px] flex-col gap-1"
      aria-label={t("confidence.aria", { level: `${pct}%` })}
    >
      <span className="text-[9.5px] font-semibold uppercase tracking-wider text-dim">
        {t("confidence.prefix")}
      </span>
      <span className="flex items-center gap-1 text-[15px] font-bold tabular-nums leading-none text-ink">
        {verified && <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[#3FB36B]" aria-hidden strokeWidth={2.4} />}
        {pct}%
      </span>
      <span className="h-1.5 w-full min-w-[76px] overflow-hidden rounded-full bg-line/90" aria-hidden>
        <span
          className="block h-full rounded-full transition-[width] duration-300"
          style={{ width: `${pct}%`, backgroundColor: fill }}
        />
      </span>
    </div>
  );
}

export function KonfidenzPill({
  value,
  verified = false,
}: {
  value: number;
  verified?: boolean;
}) {
  return <KonfidenzBar value={value} verified={verified} size="full" />;
}

export function KonfidenzText({ value, verified = false }: { value: number; verified?: boolean }) {
  return <KonfidenzBar value={value} verified={verified} size="compact" />;
}

export function TrendPfeil({ richtung, danger = false }: { richtung: TrendRichtung; danger?: boolean }) {
  const { t, trendLabel } = useI18n();
  const Icon =
    richtung === "steigend" ? ArrowUpRight : richtung === "fallend" ? ArrowDownRight : ArrowRight;
  const color = danger ? "#E5484D" : richtung === "steigend" ? "#3FB36B" : "#9C9C9C";
  return (
    <Icon
      className="h-3.5 w-3.5 shrink-0"
      style={{ color }}
      strokeWidth={2.4}
      aria-label={t("trend.aria", { dir: trendLabel(richtung) })}
    />
  );
}

export function UrgencyMeter({ u }: { u: Urgency }) {
  const { t, urgencyLabel } = useI18n();
  const label = urgencyLabel(u);
  return (
    <div>
      <div
        className="flex gap-[3px]"
        role="meter"
        aria-valuemin={1}
        aria-valuemax={5}
        aria-valuenow={u}
        aria-label={t("urgency.meter", { level: u })}
      >
        {([1, 2, 3, 4, 5] as Urgency[]).map((i) => (
          <div
            key={i}
            className="h-1.5 flex-1 rounded-[2px]"
            style={{ backgroundColor: i <= u ? SEV[i] : "rgba(255,255,255,0.08)" }}
          />
        ))}
      </div>
      <p className="mt-1.5 text-[11.5px] font-semibold" style={{ color: SEV[u] }}>
        {t("urgency.level", { level: u, label })}
      </p>
    </div>
  );
}

export function EmptyEvidence({ label, text }: { label: string; text: string }) {
  return (
    <article className="rounded-lg border border-dashed border-line p-3">
      <h3 className="text-xs font-bold text-mute">{label}</h3>
      <p className="mt-1 text-xs text-dim">{text}</p>
    </article>
  );
}
