"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import ActiveCrisisDetail from "@/components/events/ActiveCrisisDetail";
import MapFiltersPanel from "@/components/map/MapFiltersPanel";
import { useLocale } from "@/components/providers/LocaleProvider";
import { useEvents } from "@/components/providers/EventsProvider";
import type { EventStatus } from "@/lib/types";
import {
  applyMapFilters,
  DEFAULT_MAP_FILTERS,
  extractCitiesForFilter,
  extractEventTypesForFilter,
  extractSeverityOptions,
  extractStatusesForFilter,
  mapEligibleEvents,
  sanitizeMapFilters,
  type MapFilterState,
} from "@/lib/map-filters";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-panel text-sm text-mute">
      …
    </div>
  ),
});

export default function MapExplorer() {
  const { events, nowIso, unreadByEventId, markSeen, decide: decideBase, setViewingId } =
    useEvents();
  const { locale } = useLocale();

  const [filters, setFilters] = useState<MapFilterState>(DEFAULT_MAP_FILTERS);
  const [selectedId, setSelectedId] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [mapMode, setMapMode] = useState<"event" | "alle">("alle");

  const eligible = useMemo(() => mapEligibleEvents(events), [events]);

  const cities = useMemo(
    () => extractCitiesForFilter(eligible, filters),
    [eligible, filters]
  );
  const severities = useMemo(
    () => extractSeverityOptions(eligible, filters),
    [eligible, filters]
  );
  const eventTypes = useMemo(
    () => extractEventTypesForFilter(eligible, filters),
    [eligible, filters]
  );
  const statuses = useMemo(
    () => extractStatusesForFilter(eligible, filters),
    [eligible, filters]
  );

  const filtered = useMemo(
    () => applyMapFilters(eligible, filters),
    [eligible, filters]
  );

  useEffect(() => {
    setFilters((prev) => {
      const next = sanitizeMapFilters(prev, eligible);
      if (
        next.city === prev.city &&
        next.severity === prev.severity &&
        next.eventType === prev.eventType &&
        next.status === prev.status &&
        next.verifiedOnly === prev.verifiedOnly
      ) {
        return prev;
      }
      return next;
    });
  }, [eligible]);

  const selected = events.find((e) => e.id === selectedId);

  const selectEvent = useCallback(
    (id: string) => {
      setSelectedId(id);
      setDetailOpen(true);
      setMapMode("alle");
      markSeen(events.find((e) => e.id === id));
    },
    [events, markSeen]
  );

  const closeDetail = useCallback(() => {
    setDetailOpen(false);
    setSelectedId("");
  }, []);

  useEffect(() => {
    setViewingId(detailOpen ? selectedId || null : null);
    return () => setViewingId(null);
  }, [selectedId, detailOpen, setViewingId]);

  useEffect(() => {
    if (!detailOpen) return;
    const ev = events.find((e) => e.id === selectedId);
    if (ev) markSeen(ev);
  }, [selectedId, events, markSeen, detailOpen]);

  const decide = useCallback(
    (id: string, status: EventStatus, notiz: string) => {
      decideBase(id, status, notiz);
      if (status === "bestaetigt" || status === "abgelehnt" || status === "hold") {
        closeDetail();
      }
    },
    [decideBase, closeDetail]
  );

  const mapActive = detailOpen && selected ? selected : undefined;

  const gridClass = detailOpen
    ? "xl:grid-cols-[1fr_minmax(380px,520px)]"
    : "xl:grid-cols-[300px_1fr]";

  return (
    <div className={`grid h-full min-h-0 grid-cols-1 ${gridClass}`}>
      <div className="min-h-0 overflow-hidden border-r border-line">
        {detailOpen && selected ? (
          <ActiveCrisisDetail
            event={selected}
            nowIso={nowIso}
            locale={locale}
            onDecide={decide}
            onBack={closeDetail}
          />
        ) : (
          <MapFiltersPanel
            filters={filters}
            cities={cities}
            severities={severities}
            eventTypes={eventTypes}
            statuses={statuses}
            resultCount={filtered.length}
            totalCount={eligible.length}
            onChange={setFilters}
          />
        )}
      </div>

      <div className="min-h-0 min-w-0">
        <MapView
          events={filtered}
          active={mapActive}
          hoveredId={hoveredId}
          unreadByEventId={unreadByEventId}
          mode={mapMode}
          onMode={setMapMode}
          onSelect={selectEvent}
          onHover={setHoveredId}
          onOpenDetail={() => setDetailOpen(true)}
          overviewFit={!detailOpen}
        />
      </div>
    </div>
  );
}
