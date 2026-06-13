"use client";

import { useEffect, useState } from "react";
import { Bell, ChevronDown, MapPin, Shield } from "lucide-react";
import { useI18n, type Locale } from "@/lib/i18n/I18nProvider";

interface Props {
  gemeinden: string[];
  gemeinde: string;
  onGemeinde: (v: string) => void;
  zaehler: { offen: number; hold: number; bewertet: number };
}

function Zahl({ n, label }: { n: number; label: string }) {
  return (
    <span className="text-mute">
      <span className="font-semibold text-ink">{n}</span> {label}
    </span>
  );
}

function LangButton({
  code,
  active,
  onClick,
}: {
  code: Locale;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide transition-colors ${
        active ? "bg-accent/20 text-accent" : "text-mute hover:text-ink"
      }`}
    >
      {code}
    </button>
  );
}

export default function Topbar({ gemeinden, gemeinde, onGemeinde, zaehler }: Props) {
  const { locale, setLocale, t, numberLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const [uhrzeit, setUhrzeit] = useState<string | null>(null);
  const optionen = ["alle", ...gemeinden];

  useEffect(() => {
    const tick = () =>
      setUhrzeit(
        new Date().toLocaleTimeString(numberLocale, {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [numberLocale]);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-line bg-panel px-4">
      <div className="flex shrink-0 items-center gap-2.5">
        <Shield className="h-4 w-4 text-mute" aria-hidden />
        <span className="text-sm font-semibold tracking-wide">VERA</span>
        <span className="hidden text-[11px] font-medium text-dim md:inline">{t("topbar.subtitle")}</span>
      </div>

      <div className="flex items-center gap-4 lg:gap-5">
        <span className="hidden text-sm font-semibold sm:inline" aria-label={t("topbar.time")}>
          {uhrzeit ?? "--:--:--"}
        </span>

        <div
          className="flex items-center gap-0.5 rounded-md border border-line bg-bg p-0.5"
          role="group"
          aria-label={t("locale.label")}
        >
          <LangButton code="de" active={locale === "de"} onClick={() => setLocale("de")} />
          <LangButton code="en" active={locale === "en"} onClick={() => setLocale("en")} />
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-label={t("topbar.locationChoose")}
            className={`flex h-8 items-center gap-1.5 rounded-md border bg-bg px-2.5 text-xs font-medium ${
              gemeinde !== "alle" ? "border-accent/50 text-accent" : "border-line text-ink"
            }`}
          >
            <MapPin className="h-3.5 w-3.5 text-mute" aria-hidden />
            {gemeinde === "alle" ? t("topbar.allMunicipalities") : gemeinde}
            <ChevronDown className="h-3.5 w-3.5 text-mute" aria-hidden />
          </button>
          {open && (
            <>
              <button
                type="button"
                aria-label={t("topbar.locationClose")}
                className="fixed inset-0 z-40 cursor-default"
                onClick={() => setOpen(false)}
                tabIndex={-1}
              />
              <ul
                role="listbox"
                aria-label={t("topbar.locationList")}
                className="absolute left-0 top-10 z-50 w-52 overflow-hidden rounded-lg border border-line bg-card p-1 shadow-xl shadow-black/40"
              >
                {optionen.map((g) => (
                  <li key={g}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={gemeinde === g}
                      onClick={() => {
                        onGemeinde(g);
                        setOpen(false);
                      }}
                      className={`w-full rounded-md px-2.5 py-1.5 text-left text-xs ${
                        gemeinde === g ? "bg-accent/15 text-accent" : "text-ink hover:bg-white/[0.06]"
                      }`}
                    >
                      {g === "alle" ? t("topbar.allMunicipalities") : g}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <p className="hidden items-center gap-2 text-xs lg:flex" aria-label={t("topbar.counters")}>
          <Zahl n={zaehler.offen} label={t("topbar.open")} />
          <span className="text-line">·</span>
          <Zahl n={zaehler.hold} label={t("topbar.onHold")} />
          <span className="text-line">·</span>
          <Zahl n={zaehler.bewertet} label={t("topbar.rated")} />
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          aria-label={t("topbar.notifications")}
          className="relative grid h-8 w-8 place-items-center rounded-md border border-line text-mute hover:text-ink"
        >
          <Bell className="h-4 w-4" />
          <span
            className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#E7B53C]"
            aria-hidden
          />
        </button>
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-full border border-line bg-card text-[11px] font-semibold text-mute">
            SL
          </span>
          <div className="hidden lg:block">
            <p className="text-xs font-semibold leading-tight">S. Lindner</p>
            <p className="text-[10px] text-mute">{t("topbar.role")}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
