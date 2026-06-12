"use client";

import { Globe, Moon, Sun } from "lucide-react";
import { useLocale } from "@/components/providers/LocaleProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import type { Locale } from "@/lib/i18n";
import type { Theme } from "@/components/providers/ThemeProvider";

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-line px-5 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink">{label}</p>
        {description ? <p className="mt-0.5 text-xs text-mute">{description}</p> : null}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string; icon?: React.ReactNode }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-line bg-card p-0.5">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              active
                ? "bg-sidebar-active text-ink"
                : "text-mute hover:text-ink"
            }`}
            aria-pressed={active}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export default function SettingsPage() {
  const { locale, setLocale, t } = useLocale();
  const { theme, setTheme } = useTheme();

  return (
    <div className="h-full overflow-y-auto bg-bg">
      <div className="mx-auto max-w-2xl px-6 py-8">
        <header className="mb-8">
          <h1 className="text-xl font-semibold tracking-tight text-ink">{t("settings.title")}</h1>
          <p className="mt-1 text-sm text-mute">{t("settings.subtitle")}</p>
        </header>

        <section className="overflow-hidden rounded-xl border border-line bg-panel">
          <div className="border-b border-line px-5 py-5">
            <p className="text-[10px] font-semibold tracking-[0.12em] text-dim">
              {t("settings.profile")}
            </p>
            <div className="mt-4 flex items-center gap-4">
              <span className="grid h-14 w-14 place-items-center rounded-full border border-line bg-card text-lg font-semibold text-ink">
                V
              </span>
              <div className="min-w-0">
                <p className="text-base font-semibold text-ink">{t("settings.profileName")}</p>
                <p className="text-xs font-medium tracking-wide text-mute">
                  {t("settings.profileRole")}
                </p>
                <p className="mt-1 text-xs text-dim">{t("settings.profileEmail")}</p>
              </div>
            </div>
          </div>

          <SettingRow label={t("settings.language")} description={t("settings.languageHint")}>
            <SegmentedControl<Locale>
              value={locale}
              onChange={setLocale}
              options={[
                { value: "de", label: "DE", icon: <Globe className="h-3.5 w-3.5" /> },
                { value: "en", label: "EN", icon: <Globe className="h-3.5 w-3.5" /> },
              ]}
            />
          </SettingRow>

          <SettingRow label={t("settings.theme")} description={t("settings.themeHint")}>
            <SegmentedControl<Theme>
              value={theme}
              onChange={setTheme}
              options={[
                {
                  value: "dark",
                  label: t("settings.themeDark"),
                  icon: <Moon className="h-3.5 w-3.5" />,
                },
                {
                  value: "light",
                  label: t("settings.themeLight"),
                  icon: <Sun className="h-3.5 w-3.5" />,
                },
              ]}
            />
          </SettingRow>
        </section>
      </div>
    </div>
  );
}
