"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Settings, Shield } from "lucide-react";

interface Props {
  zaehler: { offen: number; hold: number; bewertet: number };
}

function Zahl({ n, label }: { n: number; label: string }) {
  return (
    <span className="text-mute">
      <span className="font-semibold text-ink">{n}</span> {label}
    </span>
  );
}

export default function Topbar({ zaehler }: Props) {
  const [uhrzeit, setUhrzeit] = useState<string | null>(null);

  // Uhr erst nach dem Mount ticken lassen (Hydration)
  useEffect(() => {
    const tick = () =>
      setUhrzeit(
        new Date().toLocaleTimeString("de-DE", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-line bg-panel px-4">
      <div className="flex shrink-0 items-center gap-2.5">
        <Shield className="h-4 w-4 text-mute" aria-hidden />
        <span className="text-sm font-semibold tracking-wide">Codewehr</span>
        <span className="hidden text-[11px] font-medium text-dim md:inline">
          Verifikations-Cockpit
        </span>
      </div>

      <div className="flex items-center gap-4 lg:gap-5">
        <span className="hidden text-sm font-semibold sm:inline" aria-label="Uhrzeit">
          {uhrzeit ?? "--:--:--"}
        </span>

        <p className="hidden items-center gap-2 text-xs lg:flex" aria-label="Lagezähler">
          <Zahl n={zaehler.offen} label="offen" />
          <span className="text-line">·</span>
          <Zahl n={zaehler.hold} label="on hold" />
          <span className="text-line">·</span>
          <Zahl n={zaehler.bewertet} label="bewertet" />
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <Link
          href="/settings"
          aria-label="Einstellungen"
          className="grid h-8 w-8 place-items-center rounded-md border border-line text-mute hover:text-ink"
        >
          <Settings className="h-4 w-4" />
        </Link>
        <button
          type="button"
          aria-label="Benachrichtigungen"
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
            <p className="text-[10px] text-mute">Rolle S2</p>
          </div>
        </div>
      </div>
    </header>
  );
}
