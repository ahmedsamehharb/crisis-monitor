"use client";

import { RotateCcw } from "lucide-react";
import {
  DEFAULT_MAP_FILTERS,
  type MapFilterState,
} from "@/lib/map-filters";
import type { SeverityLabel } from "@/lib/event-display";
import { useLocale } from "@/components/providers/LocaleProvider";
import type { EventStatus, EventType } from "@/lib/types";

interface Props {
  filters: MapFilterState;
  cities: string[];
  severities: SeverityLabel[];
  eventTypes: EventType[];
  statuses: EventStatus[];
  resultCount: number;
  totalCount: number;
  onChange: (filters: MapFilterState) => void;
}

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-semibold tracking-[0.1em] text-dim">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full rounded-lg border border-line bg-card px-2.5 text-xs text-ink focus:border-accent/50 focus:outline-none"
      >
        {children}
      </select>
    </label>
  );
}

const SEVERITY_I18N: Record<SeverityLabel, "map.severityCritical" | "map.severityHigh" | "map.severityMedium" | "map.severityLow"> = {
  CRITICAL: "map.severityCritical",
  HIGH: "map.severityHigh",
  MEDIUM: "map.severityMedium",
  LOW: "map.severityLow",
};

const STATUS_I18N: Partial<Record<EventStatus, "map.statusNew" | "map.statusHold" | "map.statusVerified">> = {
  neu: "map.statusNew",
  hold: "map.statusHold",
  bestaetigt: "map.statusVerified",
};

export default function MapFiltersPanel({
  filters,
  cities,
  severities,
  eventTypes,
  statuses,
  resultCount,
  totalCount,
  onChange,
}: Props) {
  const { t } = useLocale();

  const patch = (partial: Partial<MapFilterState>) => onChange({ ...filters, ...partial });

  return (
    <div className="flex h-full flex-col bg-bg">
      <div className="border-b border-line px-5 py-4">
        <h1 className="text-lg font-semibold tracking-tight text-ink">{t("map.title")}</h1>
        <p className="mt-0.5 text-sm text-mute">{t("map.subtitle")}</p>
        <p className="mt-3 text-xs text-mute">
          <span className="font-semibold tabular-nums text-ink">{resultCount}</span>
          {" / "}
          <span className="tabular-nums">{totalCount}</span> {t("map.eventsShown")}
        </p>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
        <SelectField
          label={t("map.filterCity")}
          value={filters.city}
          onChange={(city) => patch({ city })}
        >
          <option value="alle">{t("map.allCities")}</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </SelectField>

        <SelectField
          label={t("map.filterSeverity")}
          value={filters.severity}
          onChange={(severity) => patch({ severity })}
        >
          <option value="alle">{t("map.allSeverities")}</option>
          {severities.map((s) => (
            <option key={s} value={s}>
              {t(SEVERITY_I18N[s])}
            </option>
          ))}
        </SelectField>

        <SelectField
          label={t("map.filterType")}
          value={filters.eventType}
          onChange={(eventType) => patch({ eventType })}
        >
          <option value="alle">{t("map.allTypes")}</option>
          {eventTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </SelectField>

        <SelectField
          label={t("map.filterStatus")}
          value={filters.status}
          onChange={(status) => patch({ status })}
        >
          <option value="alle">{t("map.allStatuses")}</option>
          {statuses.map((status) => {
            const key = STATUS_I18N[status];
            return (
              <option key={status} value={status}>
                {key ? t(key) : status}
              </option>
            );
          })}
        </SelectField>

        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-line bg-card px-3 py-2.5">
          <input
            type="checkbox"
            checked={filters.verifiedOnly}
            onChange={(e) => patch({ verifiedOnly: e.target.checked })}
            className="h-4 w-4 rounded border-line accent-accent"
          />
          <span className="text-xs font-medium text-ink">{t("map.verifiedOnly")}</span>
        </label>
      </div>

      <div className="border-t border-line p-4">
        <button
          type="button"
          onClick={() => onChange(DEFAULT_MAP_FILTERS)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-line px-3 py-2 text-xs font-semibold text-mute transition-colors hover:bg-hover hover:text-ink"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {t("map.resetFilters")}
        </button>
      </div>
    </div>
  );
}
