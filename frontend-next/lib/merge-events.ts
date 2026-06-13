import type { Event as CwEvent } from "./types";

/** Mock-Events aus `data/events.ts` (z. B. ev-1, ev-2). */
export function isMockEventId(id: string): boolean {
  return id.startsWith("ev-");
}

/**
 * Demo-Baseline (Mock) mit Live-Backend-Events zusammenführen.
 * Backend gewinnt bei gleicher ID; neue Live-Events werden angehängt.
 */
export function mergeBaselineWithBackend(baseline: CwEvent[], backend: CwEvent[]): CwEvent[] {
  if (backend.length === 0) return baseline;

  const backendById = new Map(backend.map((e) => [e.id, e]));
  const merged: CwEvent[] = [];

  for (const mock of baseline) {
    merged.push(backendById.get(mock.id) ?? mock);
    backendById.delete(mock.id);
  }

  for (const live of backendById.values()) {
    merged.push(live);
  }

  return merged;
}
