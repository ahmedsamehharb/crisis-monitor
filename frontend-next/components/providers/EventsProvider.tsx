"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { MOCK_NOW } from "@/data/events";
import { fetchEvents } from "@/lib/api";
import { mergeBackendWithSeed, SEED_EVENTS } from "@/lib/events-merge";
import type { Event as CwEvent, EventStatus } from "@/lib/types";
import {
  clearUnreadFor,
  computeUnreadMap,
  markEventSeen,
  seedSeenCounts,
  type SeenSignalCounts,
  type UnreadMap,
} from "@/lib/unread";

export type DatenQuelle = "lädt" | "backend" | "mock" | "hybrid";

interface EventsContextValue {
  events: CwEvent[];
  setEvents: React.Dispatch<React.SetStateAction<CwEvent[]>>;
  nowIso: string;
  quelle: DatenQuelle;
  unreadByEventId: UnreadMap;
  markSeen: (event: CwEvent | undefined) => void;
  decide: (id: string, status: EventStatus, notiz: string) => void;
  reopen: (id: string) => void;
  setViewingId: (id: string | null) => void;
}

const EventsContext = createContext<EventsContextValue | null>(null);

const POLL_MS = 30_000;

function mergeLocalStatus(prev: CwEvent[], incoming: CwEvent[]): CwEvent[] {
  const byId = new Map(
    prev.map((e) => [e.id, { status: e.status, notiz: e.notiz, bewertetUm: e.bewertetUm }])
  );
  return incoming.map((e) => {
    const kept = byId.get(e.id);
    if (kept && kept.status !== "neu") {
      return { ...e, status: kept.status, notiz: kept.notiz, bewertetUm: kept.bewertetUm };
    }
    return e;
  });
}

export function EventsProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<CwEvent[]>(SEED_EVENTS);
  const [nowIso, setNowIso] = useState<string>(MOCK_NOW);
  const [quelle, setQuelle] = useState<DatenQuelle>("lädt");
  const [unreadByEventId, setUnreadByEventId] = useState<UnreadMap>({});
  const hadBackendRef = useRef(false);
  const seenSignalsRef = useRef<SeenSignalCounts>({});
  const baselineSeededRef = useRef(false);
  const viewingIdRef = useRef<string | null>(null);

  const markSeen = useCallback((event: CwEvent | undefined) => {
    if (!event) return;
    seenSignalsRef.current = markEventSeen(seenSignalsRef.current, event);
    setUnreadByEventId((prev) => clearUnreadFor(prev, event.id));
  }, []);

  const setViewingId = useCallback((id: string | null) => {
    viewingIdRef.current = id;
  }, []);

  const loadFromBackend = useCallback(async (signal: AbortSignal) => {
    try {
      const echte = await fetchEvents(signal);
      if (signal.aborted) return;

      if (echte.length === 0) {
        if (!hadBackendRef.current) {
          setQuelle("mock");
        }
        return;
      }

      hadBackendRef.current = true;
      setEvents((prev) => {
        const merged = mergeLocalStatus(prev, mergeBackendWithSeed(echte));

        if (!baselineSeededRef.current) {
          seenSignalsRef.current = seedSeenCounts(merged);
          baselineSeededRef.current = true;
          setUnreadByEventId({});
        } else {
          const viewingId = viewingIdRef.current;
          const viewing = viewingId ? merged.find((e) => e.id === viewingId) : undefined;
          if (viewing) {
            seenSignalsRef.current = markEventSeen(seenSignalsRef.current, viewing);
          }
          setUnreadByEventId(computeUnreadMap(merged, seenSignalsRef.current, viewingId));
        }

        return merged;
      });
      setNowIso(new Date().toISOString());
      setQuelle("hybrid");
    } catch {
      if (signal.aborted) return;
      if (!hadBackendRef.current) setQuelle("mock");
    }
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    void loadFromBackend(ctrl.signal);
    const poll = setInterval(() => void loadFromBackend(ctrl.signal), POLL_MS);
    return () => {
      ctrl.abort();
      clearInterval(poll);
    };
  }, [loadFromBackend]);

  const decide = useCallback(
    (id: string, status: EventStatus, notiz: string) => {
      setEvents((prev) =>
        prev.map((e) =>
          e.id === id
            ? {
                ...e,
                status,
                notiz: notiz.trim() === "" ? e.notiz : notiz.trim(),
                bewertetUm:
                  status === "bestaetigt" || status === "abgelehnt"
                    ? new Date().toLocaleTimeString("de-DE", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : e.bewertetUm,
              }
            : e
        )
      );
    },
    []
  );

  const reopen = useCallback((id: string) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: "neu", bewertetUm: undefined } : e))
    );
  }, []);

  const value: EventsContextValue = {
    events,
    setEvents,
    nowIso,
    quelle,
    unreadByEventId,
    markSeen,
    decide,
    reopen,
    setViewingId,
  };

  return <EventsContext.Provider value={value}>{children}</EventsContext.Provider>;
}

export function useEvents() {
  const ctx = useContext(EventsContext);
  if (!ctx) throw new Error("useEvents must be used within EventsProvider");
  return ctx;
}