import type { Event as CwEvent } from "@/lib/types";
import { DEMO_VISUALIZATION_EVENTS } from "@/data/demo-events";
import { INITIAL_EVENTS } from "@/data/events";

/** Alle Seed-/Demo-Ereignisse (Mock + Visualisierungs-Demos). */
export const SEED_EVENTS: CwEvent[] = [...INITIAL_EVENTS, ...DEMO_VISUALIZATION_EVENTS];

/**
 * Backend-Events mit Demo-Daten zusammenführen.
 * Backend-IDs haben Vorrang; Demo-Events bleiben für Visualisierung erhalten.
 */
export function mergeBackendWithSeed(backend: CwEvent[], seed: CwEvent[] = SEED_EVENTS): CwEvent[] {
  const byId = new Map<string, CwEvent>();
  for (const e of seed) byId.set(e.id, e);
  for (const e of backend) byId.set(e.id, e);
  return [...byId.values()];
}

export function countSeedOnly(merged: CwEvent[], backend: CwEvent[]): number {
  const backendIds = new Set(backend.map((e) => e.id));
  return merged.filter((e) => !backendIds.has(e.id)).length;
}
