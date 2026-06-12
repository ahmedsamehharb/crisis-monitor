"use client";

import Link from "next/link";
import { ArrowLeft, Filter, MapPin, Shield } from "lucide-react";
import MultiSelectFilter from "@/components/MultiSelectFilter";
import { BW_REGIONS, REGION_RADIUS_KM } from "@/lib/geo";
import { useFilterSettings } from "@/lib/settings";
import type { EventType } from "@/lib/types";

const EVENT_TYPES: EventType[] = [
  "Hochwasser",
  "Starkregen",
  "Brand",
  "Verkehrsunfall",
  "Infrastrukturausfall",
  "Sturm",
  "Sonstiges",
];

export default function SettingsPage() {
  const [filters, setFilters] = useFilterSettings();

  const regionOptions = BW_REGIONS.map((r) => ({ value: r.name, label: r.name }));
  const typeOptions = EVENT_TYPES.map((t) => ({ value: t, label: t }));

  return (
    <main className="flex min-h-dvh flex-col">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-panel px-4">
        <Link
          href="/"
          aria-label="Zurück zum Cockpit"
          className="grid h-8 w-8 place-items-center rounded-md border border-line text-mute hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <Shield className="h-4 w-4 text-mute" aria-hidden />
        <span className="text-sm font-semibold tracking-wide">Codewehr</span>
        <span className="text-[11px] font-medium text-dim">Einstellungen</span>
      </header>

      <div className="mx-auto w-full max-w-xl flex-1 px-4 py-8">
        <h1 className="text-lg font-semibold">Filter</h1>
        <p className="mt-1 text-sm text-mute">
          Diese Filter wirken auf die Eingangsliste, On Hold und die Karte im Cockpit. Mehrere
          Gegenden und Ereignistypen können kombiniert werden.
        </p>

        <section className="mt-6 rounded-lg border border-line bg-panel p-4">
          <label className="text-xs font-semibold text-mute">Gegend</label>
          <div className="mt-2">
            <MultiSelectFilter
              label="Gegend hinzufügen"
              icon={MapPin}
              values={filters.regions}
              options={regionOptions}
              onChange={(regions) => setFilters({ ...filters, regions })}
            />
          </div>
          <p className="mt-2 text-xs text-dim">
            {filters.regions.length === 0
              ? "Zeigt Ereignisse aus ganz Baden-Württemberg."
              : `Zeigt Ereignisse im Umkreis von ${REGION_RADIUS_KM} km um ${filters.regions.join(", ")}, abgeglichen anhand der Geolokation jeder Meldung.`}
          </p>
        </section>

        <section className="mt-4 rounded-lg border border-line bg-panel p-4">
          <label className="text-xs font-semibold text-mute">Ereignistyp</label>
          <div className="mt-2">
            <MultiSelectFilter
              label="Ereignistyp hinzufügen"
              icon={Filter}
              values={filters.eventTypes}
              options={typeOptions}
              onChange={(eventTypes) =>
                setFilters({ ...filters, eventTypes: eventTypes as EventType[] })
              }
            />
          </div>
          <p className="mt-2 text-xs text-dim">
            {filters.eventTypes.length === 0
              ? "Zeigt alle Ereignistypen."
              : `Zeigt nur Ereignisse vom Typ ${filters.eventTypes.map((t) => `„${t}“`).join(", ")}.`}
          </p>
        </section>
      </div>
    </main>
  );
}
