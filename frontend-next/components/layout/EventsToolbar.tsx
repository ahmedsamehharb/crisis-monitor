"use client";

import { useState } from "react";
import { ChevronDown, MapPin } from "lucide-react";
import { useLocale } from "@/components/providers/LocaleProvider";

interface Props {
  gemeinden: string[];
  gemeinde: string;
  onGemeinde: (v: string) => void;
  zaehler: { active: number; pending: number; bewertet: number };
}

function Zahl({ n, label }: { n: number; label: string }) {
  return (
    <span className="text-mute">
      <span className="font-semibold text-ink">{n}</span> {label}
    </span>
  );
}

export default function EventsToolbar({ gemeinden, gemeinde, onGemeinde, zaehler }: Props) {
  const [open, setOpen] = useState(false);
  const { t } = useLocale();
  const optionen = ["alle", ...gemeinden];

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line bg-panel px-5 py-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">{t("events.title")}</h1>
        <p className="mt-0.5 text-sm text-mute">{t("events.subtitle")}</p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-label="Location filter"
            className={`flex h-9 items-center gap-1.5 rounded-lg border bg-card px-3 text-xs font-medium ${
              gemeinde !== "alle" ? "border-accent/50 text-accent" : "border-line text-ink"
            }`}
          >
            <MapPin className="h-3.5 w-3.5 text-mute" aria-hidden />
            {gemeinde === "alle" ? t("events.allMunicipalities") : gemeinde}
            <ChevronDown className="h-3.5 w-3.5 text-mute" aria-hidden />
          </button>
          {open && (
            <>
              <button
                type="button"
                aria-label="Close"
                className="fixed inset-0 z-40 cursor-default"
                onClick={() => setOpen(false)}
                tabIndex={-1}
              />
              <ul
                role="listbox"
                className="absolute right-0 top-11 z-50 w-52 overflow-hidden rounded-lg border border-line bg-panel p-1 shadow-xl"
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
                        gemeinde === g
                          ? "bg-accent/12 text-accent"
                          : "text-ink hover:bg-hover"
                      }`}
                    >
                      {g === "alle" ? t("events.allMunicipalities") : g}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <p className="flex items-center gap-2 text-xs" aria-label="Counters">
          <Zahl n={zaehler.active} label={t("events.activeCount")} />
          <span className="text-line">·</span>
          <Zahl n={zaehler.pending} label={t("events.pendingCount")} />
          <span className="text-line">·</span>
          <Zahl n={zaehler.bewertet} label={t("events.reviewed")} />
        </p>
      </div>
    </div>
  );
}
