import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function DashboardWidget({
  title,
  children,
  className = "",
  headerRight,
}: {
  title: string;
  children: ReactNode;
  className?: string;
  headerRight?: ReactNode;
}) {
  return (
    <section className={`dashboard-widget flex flex-col ${className}`}>
      <header className="flex items-center justify-between gap-3 px-5 pt-4">
        <h2 className="text-[11px] font-semibold tracking-[0.1em] text-mute">{title}</h2>
        {headerRight}
      </header>
      <div className="min-h-0 flex-1 px-4 pb-4 pt-3">{children}</div>
    </section>
  );
}

export function KpiCard({
  label,
  value,
  displayValue,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  displayValue?: string;
  icon: LucideIcon;
  accent?: string;
}) {
  return (
    <article className="dashboard-widget flex flex-col px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-medium leading-snug text-mute">{label}</p>
        <Icon className="h-4 w-4 shrink-0 text-dim" strokeWidth={1.75} aria-hidden />
      </div>
      <p
        className="mt-3 text-[32px] font-semibold leading-none tabular-nums tracking-tight"
        style={accent ? { color: accent } : { color: "var(--color-ink)" }}
      >
        {displayValue ?? value}
      </p>
    </article>
  );
}
