"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  Eye,
  LayoutDashboard,
  Map,
  Settings,
  Shield,
} from "lucide-react";
import { useEvents } from "@/components/providers/EventsProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import type { TranslationKey } from "@/lib/i18n";

const NAV: {
  href: string;
  icon: typeof LayoutDashboard;
  labelKey: TranslationKey;
  match: (path: string) => boolean;
}[] = [
  {
    href: "/dashboard",
    icon: LayoutDashboard,
    labelKey: "nav.dashboard",
    match: (p) => p === "/dashboard",
  },
  {
    href: "/events/active",
    icon: AlertTriangle,
    labelKey: "nav.activeCrises",
    match: (p) => p.startsWith("/events/active"),
  },
  {
    href: "/events/pending",
    icon: Eye,
    labelKey: "nav.pending",
    match: (p) => p.startsWith("/events/pending"),
  },
  {
    href: "/map",
    icon: Map,
    labelKey: "nav.mapView",
    match: (p) => p.startsWith("/map"),
  },
  {
    href: "/settings",
    icon: Settings,
    labelKey: "nav.settings",
    match: (p) => p.startsWith("/settings"),
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { t } = useLocale();
  const { quelle } = useEvents();

  const live = quelle === "backend" || quelle === "hybrid";

  return (
    <aside className="flex w-[240px] shrink-0 flex-col border-r border-line bg-panel">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="grid h-9 w-9 place-items-center rounded-lg border border-line bg-card">
          <Shield className="h-4 w-4 text-ink" strokeWidth={1.8} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold tracking-tight text-ink">
            {t("app.name")}
          </p>
          <p className="truncate text-[10px] font-medium tracking-[0.12em] text-mute">
            {t("app.subtitle")}
          </p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-3" aria-label="Main navigation">
        {NAV.map(({ href, icon: Icon, labelKey, match }) => {
          const isActive = match(pathname);

          return (
            <Link
              key={labelKey}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors ${
                isActive
                  ? "bg-sidebar-active text-ink"
                  : "text-mute hover:bg-hover hover:text-ink"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
              {t(labelKey)}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-line px-5 py-4">
        <p className="text-[10px] font-semibold tracking-[0.14em] text-dim">
          {t("dashboard.opsCenter")}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full bg-success ${live ? "live-dot" : ""}`}
            aria-hidden
          />
          <span className="text-xs font-medium text-mute">{t("dashboard.liveFeed")}</span>
        </div>
      </div>
    </aside>
  );
}
