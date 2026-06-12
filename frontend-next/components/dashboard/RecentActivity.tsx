"use client";

import type { ActivityItem } from "@/lib/analytics";
import { useLocale } from "@/components/providers/LocaleProvider";
import { DashboardWidget } from "./Panel";

function fmtAgo(min: number): string {
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const h = Math.floor(min / 60);
  return `${h} hr ago`;
}

const ACCENT: Record<NonNullable<ActivityItem["accent"]>, string> = {
  danger: "var(--color-danger)",
  warning: "var(--color-warning)",
  default: "var(--color-ink)",
};

interface Props {
  items: ActivityItem[];
}

export default function RecentActivity({ items }: Props) {
  const { t } = useLocale();

  return (
    <DashboardWidget
      title={t("dashboard.recentActivity")}
      className="min-h-[320px]"
      headerRight={
        <span className="h-2 w-2 rounded-full bg-success live-dot" aria-hidden />
      }
    >
      {items.length === 0 ? (
        <p className="flex h-[260px] items-center justify-center text-sm text-mute">
          {t("dashboard.noData")}
        </p>
      ) : (
        <ul className="flex max-h-[280px] flex-col gap-4 overflow-y-auto pr-1">
          {items.map((item) => (
            <li key={item.id} className="border-b border-line/60 pb-4 last:border-0 last:pb-0">
              <p className="text-[10px] font-semibold tracking-[0.08em] text-dim">
                {item.type === "new" ? t("dashboard.newEvent") : t("dashboard.statusChange")}{" "}
                <span className="font-normal">{fmtAgo(item.minutesAgo)}</span>
              </p>
              <p
                className="mt-1 text-sm font-semibold leading-snug"
                style={{ color: ACCENT[item.accent ?? "default"] }}
              >
                {item.title}
              </p>
              <p className="mt-0.5 text-xs text-mute">{item.detail}</p>
            </li>
          ))}
        </ul>
      )}
    </DashboardWidget>
  );
}
