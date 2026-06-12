"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import EventDetail from "@/components/EventDetail";
import QueueColumn from "@/components/QueueColumn";
import Topbar from "@/components/Topbar";
import { INITIAL_EVENTS, MOCK_NOW } from "@/data/events";
import { fetchEvents } from "@/lib/api";
import { BW_REGIONS, REGION_RADIUS_KM, haversineKm } from "@/lib/geo";
import { useFilterSettings } from "@/lib/settings";
import type { Event as CwEvent, EventStatus } from "@/lib/types";
import { sortQueue } from "@/lib/ui";

type DatenQuelle = "lädt" | "backend" | "mock";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-panel text-sm text-mute">
      Karte wird geladen ...
    </div>
  ),
});

export default function Home() {
  const [events, setEvents] = useState<CwEvent[]>(INITIAL_EVENTS);
  const [selectedId, setSelectedId] = useState<string>(
    () => sortQueue(INITIAL_EVENTS.filter((e) => e.status === "neu"), "urgency")[0]?.id ?? ""
  );
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [mapMode, setMapMode] = useState<"event" | "alle">("alle");
  const [sortBy, setSortBy] = useState<"urgency" | "confidence">("urgency");
  const [detailOpen, setDetailOpen] = useState(false);
  // Bezugszeitpunkt: Mock nutzt den festen MOCK_NOW, echte Daten die reale Uhrzeit
  const [nowIso, setNowIso] = useState<string>(MOCK_NOW);
  const [quelle, setQuelle] = useState<DatenQuelle>("lädt");

  // Phase 1: echte Reports vom Backend laden. data/events.ts bleibt Fallback,
  // wenn die API nicht erreichbar ist oder (noch) keine Reports liefert.
  useEffect(() => {
    const ctrl = new AbortController();
    fetchEvents(ctrl.signal)
      .then((echte) => {
        if (echte.length === 0) {
          console.info("[codewehr] Backend erreichbar, 0 Reports. Mock-Fallback bleibt aktiv.");
          setQuelle("mock");
          return;
        }
        console.info(`[codewehr] Backend erreichbar, ${echte.length} Event(s) geladen.`);
        setEvents(echte);
        setNowIso(new Date().toISOString());
        setQuelle("backend");
        setSelectedId(
          sortQueue(echte.filter((e) => e.status === "neu"), "urgency")[0]?.id ?? ""
        );
      })
      .catch((err) => {
        if (ctrl.signal.aborted) return;
        console.warn(`[codewehr] Backend nicht erreichbar (${String(err)}). Mock-Fallback aktiv.`);
        setQuelle("mock");
      });
    return () => ctrl.abort();
  }, []);

  // Filter aus der Einstellungs-Unterseite: mehrere Gegenden (Geolokation +
  // Umkreis) und mehrere Ereignistypen, jeweils ODER-verknüpft.
  const [filters] = useFilterSettings();

  const regionCenters = useMemo(
    () => filters.regions.flatMap((name) => BW_REGIONS.filter((r) => r.name === name)),
    [filters.regions]
  );

  const matchesFilters = useCallback(
    (e: CwEvent) => {
      if (filters.eventTypes.length > 0 && !filters.eventTypes.includes(e.eventType)) return false;
      if (
        regionCenters.length > 0 &&
        !regionCenters.some((c) => haversineKm(c, { lat: e.lat, lon: e.lon }) <= REGION_RADIUS_KM)
      ) {
        return false;
      }
      return true;
    },
    [filters.eventTypes, regionCenters]
  );

  const eingang = useMemo(
    () => sortQueue(events.filter((e) => e.status === "neu").filter(matchesFilters), sortBy),
    [events, matchesFilters, sortBy]
  );

  const onHold = useMemo(
    () => sortQueue(events.filter((e) => e.status === "hold").filter(matchesFilters), sortBy),
    [events, matchesFilters, sortBy]
  );

  const mapEvents = useMemo(() => events.filter(matchesFilters), [events, matchesFilters]);

  const archive = useMemo(
    () => events.filter((e) => e.status === "bestaetigt" || e.status === "abgelehnt"),
    [events]
  );

  const selected = events.find((e) => e.id === selectedId);

  const selectEvent = useCallback((id: string) => {
    setSelectedId(id);
    setDetailOpen(true);
  }, []);

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
      if (status === "bestaetigt" || status === "abgelehnt") {
        const next = [...eingang, ...onHold].find((e) => e.id !== id);
        if (next) setSelectedId(next.id);
      }
    },
    [eingang, onHold]
  );

  const reopen = useCallback((id: string) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: "neu", bewertetUm: undefined } : e))
    );
  }, []);

  // Tastatur: Pfeiltasten navigieren Eingang und On Hold als eine Liste
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable) return;
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      e.preventDefault();
      const liste = [...eingang, ...onHold];
      const idx = liste.findIndex((q) => q.id === selectedId);
      const next =
        e.key === "ArrowDown"
          ? liste[Math.min(idx + 1, liste.length - 1)]
          : liste[Math.max(idx - 1, 0)];
      if (next) setSelectedId(next.id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [eingang, onHold, selectedId]);

  return (
    <main className="flex h-dvh flex-col">
      <Topbar
        zaehler={{ offen: eingang.length, hold: onHold.length, bewertet: archive.length }}
      />
      <div className="relative grid min-h-0 flex-1 grid-cols-[320px_1fr] xl:grid-cols-[320px_minmax(540px,1fr)_minmax(380px,520px)]">
        <QueueColumn
          eingang={eingang}
          onHold={onHold}
          archive={archive}
          nowIso={nowIso}
          selectedId={selectedId}
          hoveredId={hoveredId}
          sortBy={sortBy}
          onSortBy={setSortBy}
          onSelect={selectEvent}
          onHover={setHoveredId}
        />
        {/* Unter xl liegt das Detail als Overlay über der Karte */}
        <div
          className={`min-h-0 min-w-0 ${
            detailOpen
              ? "absolute inset-y-0 left-0 right-0 z-30 fade-in md:left-[320px] xl:static xl:z-auto"
              : "hidden xl:block"
          }`}
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
        <div className="min-h-0 min-w-0">
          <MapView
            events={mapEvents}
            active={selected}
            hoveredId={hoveredId}
            mode={mapMode}
            onMode={setMapMode}
            onSelect={selectEvent}
            onHover={setHoveredId}
            onOpenDetail={() => setDetailOpen(true)}
          />
        </div>
      </div>
      {/* Datenquelle: ehrlich kennzeichnen, ob echte Backend-Reports oder Mock-Fallback */}
      <div
        className="pointer-events-none absolute bottom-2 left-2 z-40 flex items-center gap-1.5 rounded-md border border-line bg-card/90 px-2 py-1 text-[10.5px] text-mute backdrop-blur"
        aria-live="polite"
      >
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: quelle === "backend" ? "#3FB36B" : "#9C9C9C" }}
          aria-hidden
        />
        {quelle === "lädt"
          ? "Datenquelle wird geladen ..."
          : quelle === "backend"
            ? "Echte Backend-Daten"
            : "Mock-Daten (Backend nicht erreichbar oder leer)"}
      </div>
    </main>
  );
}
