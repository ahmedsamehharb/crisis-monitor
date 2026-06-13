"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import dynamic from "next/dynamic";
import EventDetail from "@/components/EventDetail";
import QueueColumn from "@/components/QueueColumn";
import Topbar from "@/components/Topbar";
import { INITIAL_EVENTS, MOCK_NOW } from "@/data/events";
import { fetchEvents } from "@/lib/api";
import { mergeBaselineWithBackend } from "@/lib/merge-events";
import {
  applyDecisions,
  loadDecisions,
  mergeLocalStatus,
  rememberDecision,
  saveDecision,
} from "@/lib/event-decisions";
import type { Event as CwEvent, EventStatus } from "@/lib/types";
import {
  clearUnreadFor,
  computeUnreadMap,
  markEventSeen,
  seedSeenCounts,
  type SeenSignalCounts,
  type UnreadMap,
} from "@/lib/unread";
import { sortQueue } from "@/lib/ui";

type DatenQuelle = "lädt" | "mock" | "hybrid";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
const POLL_MS = DEMO_MODE ? 5_000 : 30_000;

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-panel text-sm text-mute">
      Karte wird geladen ...
    </div>
  ),
});

/** Bewertungsstatus aus React-State + sessionStorage auf Backend-Updates legen. */
function mergeIncomingEvents(prev: CwEvent[], incoming: CwEvent[]): CwEvent[] {
  const fromState = mergeLocalStatus(prev, incoming);
  return applyDecisions(fromState, loadDecisions());
}

export default function Home() {
  const [events, setEvents] = useState<CwEvent[]>(INITIAL_EVENTS);
  const [selectedId, setSelectedId] = useState<string>(
    () => sortQueue(INITIAL_EVENTS.filter((e) => e.status === "neu"), "urgency")[0]?.id ?? ""
  );
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [mapMode, setMapMode] = useState<"event" | "alle">("alle");
  const [gemeinde, setGemeinde] = useState<string>("alle");
  const [sortBy, setSortBy] = useState<"urgency" | "confidence">("urgency");
  const [detailOpen, setDetailOpen] = useState(true);
  const [nowIso, setNowIso] = useState<string>(MOCK_NOW);
  const [quelle, setQuelle] = useState<DatenQuelle>("lädt");
  const [unreadByEventId, setUnreadByEventId] = useState<UnreadMap>({});
  const hadBackendRef = useRef(false);
  const seenSignalsRef = useRef<SeenSignalCounts>({});
  const { t } = useI18n();
  const baselineSeededRef = useRef(false);
  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;

  useEffect(() => {
    const stored = loadDecisions();
    for (const e of INITIAL_EVENTS) {
      if (e.status !== "neu" && !stored[e.id]) {
        saveDecision(e.id, {
          status: e.status,
          notiz: e.notiz,
          bewertetUm: e.bewertetUm,
        });
      }
    }
  }, []);

  const markSeen = useCallback((event: CwEvent | undefined) => {
    if (!event) return;
    seenSignalsRef.current = markEventSeen(seenSignalsRef.current, event);
    setUnreadByEventId((prev) => clearUnreadFor(prev, event.id));
  }, []);

  const loadFromBackend = useCallback(async (signal: AbortSignal, isInitial: boolean) => {
    try {
      const backendEvents = await fetchEvents(signal);
      if (signal.aborted) return;

      hadBackendRef.current = true;
      const combined = mergeBaselineWithBackend(INITIAL_EVENTS, backendEvents);

      setEvents((prev) => {
        const merged = mergeIncomingEvents(prev, combined);

        if (!baselineSeededRef.current) {
          seenSignalsRef.current = seedSeenCounts(merged);
          baselineSeededRef.current = true;
          setUnreadByEventId({});
        } else {
          const viewingId = selectedIdRef.current;
          const viewing = merged.find((e) => e.id === viewingId);
          if (viewing) {
            seenSignalsRef.current = markEventSeen(seenSignalsRef.current, viewing);
          }
          setUnreadByEventId(computeUnreadMap(merged, seenSignalsRef.current, viewingId));
        }

        return merged;
      });

      setNowIso(
        backendEvents.length > 0 ? new Date().toISOString() : MOCK_NOW
      );
      setQuelle(backendEvents.length > 0 ? "hybrid" : "mock");

      if (isInitial) {
        setSelectedId(
          (cur) =>
            cur && combined.some((e) => e.id === cur)
              ? cur
              : sortQueue(combined.filter((e) => e.status === "neu"), "urgency")[0]?.id ?? ""
        );
      }

      if (backendEvents.length > 0) {
        console.info(
          `[codewehr] ${backendEvents.length} Live-Event(s) mit ${INITIAL_EVENTS.length} Demo-Baseline zusammengeführt.`
        );
      } else {
        console.info("[codewehr] Backend erreichbar, 0 Live-Events. Demo-Baseline aktiv.");
      }
    } catch (err) {
      if (signal.aborted) return;
      if (!hadBackendRef.current) {
        console.warn(`[codewehr] Backend nicht erreichbar (${String(err)}). Mock-Fallback aktiv.`);
        setQuelle("mock");
      }
    }
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    void loadFromBackend(ctrl.signal, true);

    const poll = setInterval(() => {
      void loadFromBackend(ctrl.signal, false);
    }, POLL_MS);

    return () => {
      ctrl.abort();
      clearInterval(poll);
    };
  }, [loadFromBackend]);

  const gemeinden = useMemo(
    () => [...new Set(events.map((e) => e.ort.split(",")[0].trim()))],
    [events]
  );

  const inGemeinde = useCallback(
    (e: CwEvent) => gemeinde === "alle" || e.ort.split(",")[0].trim() === gemeinde,
    [gemeinde]
  );

  const eingang = useMemo(
    () =>
      sortQueue(
        events.filter((e) => e.status === "neu").filter(inGemeinde),
        sortBy,
        unreadByEventId
      ),
    [events, inGemeinde, sortBy, unreadByEventId]
  );

  const onHold = useMemo(
    () =>
      sortQueue(
        events.filter((e) => e.status === "hold").filter(inGemeinde),
        sortBy,
        unreadByEventId
      ),
    [events, inGemeinde, sortBy, unreadByEventId]
  );

  const mapEvents = useMemo(() => events.filter(inGemeinde), [events, inGemeinde]);

  const archive = useMemo(
    () => events.filter((e) => e.status === "bestaetigt" || e.status === "abgelehnt"),
    [events]
  );

  const selected = events.find((e) => e.id === selectedId);

  const selectEvent = useCallback(
    (id: string) => {
      setSelectedId(id);
      setDetailOpen(true);
      const ev = events.find((e) => e.id === id);
      markSeen(ev);
    },
    [events, markSeen]
  );

  /** Geoeffnetes Event: neue Signale gelten sofort als gelesen. */
  useEffect(() => {
    const ev = events.find((e) => e.id === selectedId);
    if (!ev) return;
    seenSignalsRef.current = markEventSeen(seenSignalsRef.current, ev);
    setUnreadByEventId((prev) => clearUnreadFor(prev, ev.id));
  }, [selectedId, events]);

  const decide = useCallback(
    (id: string, status: EventStatus, notiz: string) => {
      setEvents((prev) =>
        prev.map((e) => {
          if (e.id !== id) return e;
          const updated: CwEvent = {
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
          };
          rememberDecision(updated);
          return updated;
        })
      );
      if (status === "bestaetigt" || status === "abgelehnt") {
        const next = [...eingang, ...onHold].find((e) => e.id !== id);
        if (next) setSelectedId(next.id);
      }
    },
    [eingang, onHold]
  );

  const reopen = useCallback((id: string) => {
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e;
        const updated = { ...e, status: "neu" as const, bewertetUm: undefined };
        rememberDecision(updated);
        return updated;
      })
    );
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable) return;
      if (e.key === "Escape" && detailOpen) {
        e.preventDefault();
        setDetailOpen(false);
        return;
      }
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      e.preventDefault();
      const liste = [...eingang, ...onHold];
      const idx = liste.findIndex((q) => q.id === selectedId);
      const next =
        e.key === "ArrowDown"
          ? liste[Math.min(idx + 1, liste.length - 1)]
          : liste[Math.max(idx - 1, 0)];
      if (next) selectEvent(next.id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [detailOpen, eingang, onHold, selectedId, selectEvent]);

  return (
    <main className="flex h-dvh flex-col">
      <Topbar
        gemeinden={gemeinden}
        gemeinde={gemeinde}
        onGemeinde={setGemeinde}
        zaehler={{ offen: eingang.length, hold: onHold.length, bewertet: archive.length }}
      />
      <div className="relative grid min-h-0 flex-1 grid-cols-[320px_1fr]">
        <div className="relative z-20 min-h-0 shadow-[4px_0_12px_rgba(0,0,0,0.35)]">
          <QueueColumn
            eingang={eingang}
            onHold={onHold}
            archive={archive}
            nowIso={nowIso}
            selectedId={selectedId}
            hoveredId={hoveredId}
            unreadByEventId={unreadByEventId}
            sortBy={sortBy}
            onSortBy={setSortBy}
            onSelect={selectEvent}
            onHover={setHoveredId}
          />
          <button
            type="button"
            onClick={() => setDetailOpen((open) => !open)}
            disabled={!selected}
            aria-expanded={detailOpen}
            aria-controls="cw-detail-drawer"
            aria-label={detailOpen ? t("drawer.collapse") : t("drawer.expand")}
            className="absolute -right-3 top-1/2 z-30 grid h-10 w-6 -translate-y-1/2 place-items-center rounded-r-md border border-line border-l-0 bg-panel text-mute shadow-md transition-colors hover:bg-card hover:text-ink disabled:pointer-events-none disabled:opacity-35"
          >
            {detailOpen ? (
              <ChevronLeft className="h-4 w-4" aria-hidden />
            ) : (
              <ChevronRight className="h-4 w-4" aria-hidden />
            )}
          </button>
        </div>

        <div className="min-h-0 min-w-0">
          <MapView
            events={mapEvents}
            active={selected}
            hoveredId={hoveredId}
            unreadByEventId={unreadByEventId}
            mode={mapMode}
            onMode={setMapMode}
            onSelect={selectEvent}
            onHover={setHoveredId}
            onOpenDetail={() => setDetailOpen(true)}
          />
        </div>

        <div
          id="cw-detail-drawer"
          role="complementary"
          aria-label={t("drawer.aria")}
          aria-hidden={!detailOpen}
          className={`cw-detail-drawer absolute inset-y-0 z-10 flex w-[min(540px,45%)] flex-col border-r border-line bg-bg ${
            detailOpen ? "is-open" : "is-closed"
          }`}
          style={{ left: 320 }}
        >
          <EventDetail
            key={selected?.id ?? "leer"}
            event={selected}
            isArchived={
              !!selected && (selected.status === "bestaetigt" || selected.status === "abgelehnt")
            }
            nowIso={nowIso}
            onDecide={decide}
            onReopen={reopen}
            onClose={() => setDetailOpen(false)}
          />
        </div>
      </div>
      <div
        className="pointer-events-none absolute bottom-2 left-2 z-40 flex items-center gap-1.5 rounded-md border border-line bg-card/90 px-2 py-1 text-[10.5px] text-mute backdrop-blur"
        aria-live="polite"
      >
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{
            backgroundColor:
              quelle === "hybrid" ? "#3FB36B" : quelle === "mock" ? "#9C9C9C" : "#6d8db5",
          }}
          aria-hidden
        />
        {quelle === "lädt"
          ? t("source.loading")
          : quelle === "hybrid"
            ? t("source.hybrid")
            : t("source.mock")}
      </div>
    </main>
  );
}
