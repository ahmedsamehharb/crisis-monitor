import type { Event as CwEvent, EventType } from "./types";
import {
  severityLabel,
  type SeverityLabel,
} from "./event-display";

export interface MapFilterState {
  city: string;
  /** "alle" oder exakte Severity-Stufe (CRITICAL | HIGH | MEDIUM | LOW) */
  severity: string;
  eventType: string;
  status: string;
  verifiedOnly: boolean;
}

export const DEFAULT_MAP_FILTERS: MapFilterState = {
  city: "alle",
  severity: "alle",
  eventType: "alle",
  status: "alle",
  verifiedOnly: false,
};

export const SEVERITY_FILTER_OPTIONS: SeverityLabel[] = [
  "CRITICAL",
  "HIGH",
  "MEDIUM",
  "LOW",
];

/** Events visible on the map explorer (excludes dismissed). */
export function mapEligibleEvents(events: CwEvent[]): CwEvent[] {
  return events.filter((e) => e.status !== "abgelehnt");
}

export function eventCity(ev: CwEvent): string {
  return ev.ort.split(",")[0]?.trim() ?? "";
}

export function extractCities(events: CwEvent[]): string[] {
  const cities = new Set<string>();
  for (const ev of events) {
    const city = eventCity(ev);
    if (city) cities.add(city);
  }
  return [...cities].sort((a, b) => a.localeCompare(b));
}

/** Städte, in denen nach den übrigen Filtern noch mindestens ein Ereignis liegt. */
export function extractCitiesForFilter(
  events: CwEvent[],
  filters: MapFilterState
): string[] {
  const pool = applyMapFilters(events, { ...filters, city: "alle" });
  return extractCities(pool);
}

/** Severity-Stufen, die in den Daten (nach anderen Filtern) vorkommen. */
export function extractSeverityOptions(
  events: CwEvent[],
  filters: MapFilterState
): SeverityLabel[] {
  const pool = applyMapFilters(events, { ...filters, severity: "alle" });
  const present = new Set<SeverityLabel>();
  for (const ev of pool) present.add(severityLabel(ev.urgency));
  return SEVERITY_FILTER_OPTIONS.filter((s) => present.has(s));
}

/** Ereignistypen, die in den Daten (nach anderen Filtern) vorkommen. */
export function extractEventTypesForFilter(
  events: CwEvent[],
  filters: MapFilterState
): EventType[] {
  const pool = applyMapFilters(events, { ...filters, eventType: "alle" });
  const types = new Set<EventType>();
  for (const ev of pool) types.add(ev.eventType);
  return [...types].sort((a, b) => a.localeCompare(b));
}

type EventStatus = CwEvent["status"];

/** Status-Werte, die in den Daten (nach anderen Filtern) vorkommen. */
export function extractStatusesForFilter(
  events: CwEvent[],
  filters: MapFilterState
): EventStatus[] {
  const pool = applyMapFilters(events, { ...filters, status: "alle" });
  const statuses = new Set<EventStatus>();
  for (const ev of pool) statuses.add(ev.status);
  return [...statuses];
}

export function applyMapFilters(events: CwEvent[], filters: MapFilterState): CwEvent[] {
  return events.filter((ev) => {
    if (filters.city !== "alle" && eventCity(ev) !== filters.city) return false;

    if (
      filters.severity !== "alle" &&
      severityLabel(ev.urgency) !== filters.severity
    ) {
      return false;
    }

    if (filters.eventType !== "alle" && ev.eventType !== filters.eventType) return false;
    if (filters.status !== "alle" && ev.status !== filters.status) return false;
    if (filters.verifiedOnly && !ev.verifiziert) return false;
    return true;
  });
}

export function countActiveFilters(filters: MapFilterState): number {
  let n = 0;
  if (filters.city !== "alle") n++;
  if (filters.severity !== "alle") n++;
  if (filters.eventType !== "alle") n++;
  if (filters.status !== "alle") n++;
  if (filters.verifiedOnly) n++;
  return n;
}

/** Setzt Filterwerte zurück, wenn sie nach Datenänderung nicht mehr gültig sind. */
export function sanitizeMapFilters(
  filters: MapFilterState,
  events: CwEvent[]
): MapFilterState {
  const cities = extractCitiesForFilter(events, filters);
  const severities = extractSeverityOptions(events, filters);
  const types = extractEventTypesForFilter(events, filters);
  const statuses = extractStatusesForFilter(events, filters);

  return {
    ...filters,
    city: filters.city !== "alle" && !cities.includes(filters.city) ? "alle" : filters.city,
    severity:
      filters.severity !== "alle" && !severities.includes(filters.severity as SeverityLabel)
        ? "alle"
        : filters.severity,
    eventType:
      filters.eventType !== "alle" && !types.includes(filters.eventType as EventType)
        ? "alle"
        : filters.eventType,
    status:
      filters.status !== "alle" && !statuses.includes(filters.status as EventStatus)
        ? "alle"
        : filters.status,
  };
}
