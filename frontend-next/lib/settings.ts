import { useCallback, useEffect, useState } from "react";
import type { EventType } from "./types";

export interface FilterSettings {
  /** Namen aus BW_REGIONS. Leer = alle Gegenden. */
  regions: string[];
  /** Leer = alle Ereignistypen. */
  eventTypes: EventType[];
}

export const DEFAULT_FILTERS: FilterSettings = {
  regions: [],
  eventTypes: [],
};

const STORAGE_KEY = "codewehr.filters";
const EVENT_NAME = "codewehr:filters";

function loadFilters(): FilterSettings {
  if (typeof window === "undefined") return DEFAULT_FILTERS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_FILTERS;
    const parsed = JSON.parse(raw);
    return {
      regions: Array.isArray(parsed.regions) ? parsed.regions : DEFAULT_FILTERS.regions,
      eventTypes: Array.isArray(parsed.eventTypes) ? parsed.eventTypes : DEFAULT_FILTERS.eventTypes,
    };
  } catch {
    return DEFAULT_FILTERS;
  }
}

function saveFilters(filters: FilterSettings): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: filters }));
}

/**
 * Liest die Filtereinstellungen (Gegenden, Ereignistypen) aus localStorage und
 * hält sie über Tabs/Seiten synchron, damit die Einstellungs-Unterseite und
 * das Cockpit dieselben Werte sehen.
 */
export function useFilterSettings(): [FilterSettings, (f: FilterSettings) => void] {
  const [filters, setFiltersState] = useState<FilterSettings>(DEFAULT_FILTERS);

  useEffect(() => {
    setFiltersState(loadFilters());

    const onCustom = (e: Event) => {
      if (e instanceof CustomEvent) setFiltersState(e.detail as FilterSettings);
    };
    const onStorage = () => setFiltersState(loadFilters());

    window.addEventListener(EVENT_NAME, onCustom);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(EVENT_NAME, onCustom);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const setFilters = useCallback((f: FilterSettings) => {
    setFiltersState(f);
    saveFilters(f);
  }, []);

  return [filters, setFilters];
}
