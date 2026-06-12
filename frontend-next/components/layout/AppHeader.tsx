"use client";

import { useMemo } from "react";
import { Globe, Search, Sun, Moon, User } from "lucide-react";
import { useEvents } from "@/components/providers/EventsProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import { computeHeaderStatus } from "@/lib/analytics";

function StatusPill({
  dot,
  label,
  value,
}: {
  dot: string;
  label: string;
  value?: number;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-mute">
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: dot }} aria-hidden />
      {label}
      {value != null ? ` ${value}` : ""}
    </span>
  );
}

export default function AppHeader() {
  const { locale, setLocale, t } = useLocale();
  const { theme, toggleTheme } = useTheme();
  const { events } = useEvents();

  const status = useMemo(() => computeHeaderStatus(events), [events]);

  return (
    <header className="flex h-[60px] shrink-0 items-center gap-6 border-b border-line bg-panel px-5">
      <div className="relative min-w-0 flex-1 max-w-xl">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dim"
          aria-hidden
        />
        <input
          type="search"
          placeholder={t("header.search")}
          className="h-10 w-full rounded-lg border border-line bg-card pl-10 pr-4 text-sm text-ink placeholder:text-dim focus:border-accent/40 focus:outline-none"
          aria-label={t("header.search")}
        />
      </div>

      <div className="hidden items-center gap-5 lg:flex">
        <StatusPill dot="#ff4d4d" label={t("header.active")} value={status.active} />
        <StatusPill dot="#ff944d" label={t("header.pending")} value={status.pending} />
        <StatusPill dot="#3fb36b" label={t("header.operational")} />
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          onClick={() => setLocale(locale === "en" ? "de" : "en")}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-mute transition-colors hover:bg-hover hover:text-ink"
          aria-label={t("header.language")}
        >
          <Globe className="h-4 w-4" strokeWidth={1.75} />
          {locale.toUpperCase()}
        </button>

        <button
          type="button"
          onClick={toggleTheme}
          className="grid h-9 w-9 place-items-center rounded-lg text-mute transition-colors hover:bg-hover hover:text-ink"
          aria-label={t("header.theme")}
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" strokeWidth={1.75} />
          ) : (
            <Moon className="h-4 w-4" strokeWidth={1.75} />
          )}
        </button>

        <div className="flex items-center gap-2.5 border-l border-line pl-3">
          <span className="grid h-9 w-9 place-items-center rounded-full border border-line bg-card">
            <User className="h-4 w-4 text-mute" strokeWidth={1.75} />
          </span>
          <div className="hidden md:block">
            <p className="text-xs font-semibold leading-tight">{t("header.userName")}</p>
            <p className="text-[10px] font-medium tracking-wide text-mute">{t("header.userRole")}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
