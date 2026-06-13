import type { Event as CwEvent, EventStatus } from "./types";

const STORAGE_KEY = "codewehr-event-decisions";

export interface EventDecision {
  status: EventStatus;
  notiz?: string;
  bewertetUm?: string;
}

function isTerminalStatus(status: EventStatus): boolean {
  return status === "bestaetigt" || status === "abgelehnt";
}

export function loadDecisions(): Record<string, EventDecision> {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, EventDecision>;
  } catch {
    return {};
  }
}

export function saveDecision(id: string, decision: EventDecision): void {
  if (typeof window === "undefined") return;
  const all = loadDecisions();
  all[id] = decision;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function clearDecision(id: string): void {
  if (typeof window === "undefined") return;
  const all = loadDecisions();
  if (!all[id]) return;
  delete all[id];
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

/** Bewertungen auf frische Backend-Daten legen — Signale aktualisieren, Status bleibt. */
export function applyDecisions(
  events: CwEvent[],
  decisions: Record<string, EventDecision>
): CwEvent[] {
  return events.map((e) => {
    const d = decisions[e.id];
    if (!d) return e;
    return {
      ...e,
      status: d.status,
      notiz: d.notiz ?? e.notiz,
      bewertetUm: d.bewertetUm ?? e.bewertetUm,
    };
  });
}

/** React-State mit eingehenden Daten zusammenführen; terminal/hold-Status nie zurücksetzen. */
export function mergeLocalStatus(prev: CwEvent[], incoming: CwEvent[]): CwEvent[] {
  const byId = new Map(prev.map((e) => [e.id, e]));
  return incoming.map((e) => {
    const kept = byId.get(e.id);
    if (!kept || kept.status === "neu") return e;
    return {
      ...e,
      status: kept.status,
      notiz: kept.notiz ?? e.notiz,
      bewertetUm: kept.bewertetUm ?? e.bewertetUm,
      hold: kept.status === "hold" ? (kept.hold ?? e.hold) : e.hold,
    };
  });
}

export function rememberDecision(event: CwEvent): void {
  if (event.status === "neu") {
    clearDecision(event.id);
    return;
  }
  saveDecision(event.id, {
    status: event.status,
    notiz: event.notiz,
    bewertetUm: event.bewertetUm,
  });
}

export function isRatedEvent(event: CwEvent): boolean {
  return isTerminalStatus(event.status);
}
