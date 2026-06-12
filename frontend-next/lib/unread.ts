import type { Event as CwEvent } from "./types";
import { countSignals } from "./ui";

export type UnreadMap = Record<string, number>;

/** Letzte bekannte Signalanzahl pro Event (nach Sichtung des Verifizierers). */
export type SeenSignalCounts = Record<string, number>;

export function seedSeenCounts(events: CwEvent[]): SeenSignalCounts {
  const seen: SeenSignalCounts = {};
  for (const e of events) {
    seen[e.id] = countSignals(e);
  }
  return seen;
}

/**
 * Vergleicht eingehende Events mit dem zuletzt gesehenen Stand.
 * Liefert pro Event die Anzahl neuer Signale (0 = nichts Ungelesenes).
 */
export function computeUnreadMap(
  events: CwEvent[],
  seen: SeenSignalCounts,
  viewingEventId: string | null
): UnreadMap {
  const unread: UnreadMap = {};

  for (const e of events) {
    const current = countSignals(e);
    const known = seen[e.id];

    if (viewingEventId === e.id) {
      continue;
    }

    if (known === undefined) {
      unread[e.id] = current;
      continue;
    }

    if (current > known) {
      unread[e.id] = current - known;
    }
  }

  return unread;
}

export function markEventSeen(
  seen: SeenSignalCounts,
  event: CwEvent | undefined
): SeenSignalCounts {
  if (!event) return seen;
  return { ...seen, [event.id]: countSignals(event) };
}

export function clearUnreadFor(
  unread: UnreadMap,
  eventId: string
): UnreadMap {
  if (!unread[eventId]) return unread;
  const next = { ...unread };
  delete next[eventId];
  return next;
}

export function totalUnread(unread: UnreadMap): number {
  return Object.values(unread).reduce((s, n) => s + n, 0);
}
