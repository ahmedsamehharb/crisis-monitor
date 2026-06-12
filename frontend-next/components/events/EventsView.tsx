"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import ActiveCrisesTable from "@/components/events/ActiveCrisesTable";
import ActiveCrisisDetail from "@/components/events/ActiveCrisisDetail";
import QueueColumn from "@/components/QueueColumn";
import EventsToolbar from "@/components/layout/EventsToolbar";
import { useLocale } from "@/components/providers/LocaleProvider";
import { useEvents } from "@/components/providers/EventsProvider";
import type { Event as CwEvent, EventStatus } from "@/lib/types";
import { sortQueue } from "@/lib/ui";

export type EventsViewMode = "active" | "pending";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-panel text-sm text-mute">
      …
    </div>
  ),
});

function initialSelectedId(events: CwEvent[], mode: EventsViewMode): string {
  if (mode === "active") return "";
  const filter = (e: CwEvent) => e.status === "hold";
  return sortQueue(events.filter(filter), "urgency")[0]?.id ?? "";
}

interface Props {
  mode: EventsViewMode;
}

export default function EventsView({ mode }: Props) {
  const {
    events,
    nowIso,
    unreadByEventId,
    markSeen,
    decide: decideBase,
    setViewingId,
  } = useEvents();
  const { t, locale } = useLocale();

  const [selectedId, setSelectedId] = useState<string>(() => initialSelectedId(events, mode));
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [mapMode, setMapMode] = useState<"event" | "alle">("alle");
  const [gemeinde, setGemeinde] = useState<string>("alle");
  const [region, setRegion] = useState<string>("alle");
  const [sortBy, setSortBy] = useState<"urgency" | "confidence">("urgency");
  const [detailOpen, setDetailOpen] = useState(false);

  const gemeinden = useMemo(
    () => [...new Set(events.map((e) => e.ort.split(",")[0].trim()))],
    [events]
  );

  const inGemeinde = useCallback(
    (e: CwEvent) => gemeinde === "alle" || e.ort.split(",")[0].trim() === gemeinde,
    [gemeinde]
  );

  const inRegion = useCallback(
    (e: CwEvent) => {
      if (region === "alle") return true;
      const parts = e.ort.split(",").map((p) => p.trim());
      const match = parts.length >= 2 ? parts[1].toUpperCase() : parts[0]?.toUpperCase();
      return match === region;
    },
    [region]
  );

  const activeQueue = useMemo(
    () =>
      sortQueue(
        events.filter((e) => e.status === "neu").filter(inGemeinde).filter(inRegion),
        sortBy,
        unreadByEventId
      ),
    [events, inGemeinde, inRegion, sortBy, unreadByEventId]
  );

  const pendingQueue = useMemo(
    () =>
      sortQueue(
        events.filter((e) => e.status === "hold").filter(inGemeinde),
        sortBy,
        unreadByEventId
      ),
    [events, inGemeinde, sortBy, unreadByEventId]
  );

  const queue = mode === "active" ? activeQueue : pendingQueue;
  const mapEvents = useMemo(() => queue, [queue]);

  const archive = useMemo(
    () => events.filter((e) => e.status === "bestaetigt" || e.status === "abgelehnt"),
    [events]
  );

  const selected = events.find((e) => e.id === selectedId);

  useEffect(() => {
    if (mode !== "pending") return;
    if (selected && queue.some((e) => e.id === selected.id)) return;
    const next = queue[0];
    setSelectedId(next?.id ?? "");
  }, [queue, selected, mode]);

  const selectEvent = useCallback(
    (id: string) => {
      setSelectedId(id);
      setDetailOpen(true);
      setMapMode("alle");
      const ev = events.find((e) => e.id === id);
      markSeen(ev);
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
    if (!ev) return;
    markSeen(ev);
  }, [selectedId, events, markSeen, detailOpen]);

  const decide = useCallback(
    (id: string, status: EventStatus, notiz: string) => {
      decideBase(id, status, notiz);
      if (status === "bestaetigt" || status === "abgelehnt") {
        closeDetail();
        const next = queue.find((e) => e.id !== id);
        if (next && mode === "pending") setSelectedId(next.id);
      } else if (status === "hold" && mode === "active") {
        closeDetail();
      } else if (status === "neu" && mode === "pending") {
        const next = queue.filter((e) => e.id !== id)[0];
        setSelectedId(next?.id ?? "");
      }
    },
    [decideBase, queue, mode, closeDetail]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
        return;
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      e.preventDefault();
      const idx = queue.findIndex((q) => q.id === selectedId);
      const next =
        e.key === "ArrowDown"
          ? queue[Math.min(idx + 1, queue.length - 1)]
          : queue[Math.max(idx - 1, 0)];
      if (next) selectEvent(next.id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [queue, selectedId, selectEvent]);

  const mapActive = detailOpen && selected ? selected : undefined;

  return (
    <div className="flex h-full flex-col">
      {mode === "pending" && (
        <EventsToolbar
          gemeinden={gemeinden}
          gemeinde={gemeinde}
          onGemeinde={setGemeinde}
          zaehler={{
            active: activeQueue.length,
            pending: pendingQueue.length,
            bewertet: archive.length,
          }}
        />
      )}

      <div className="relative grid min-h-0 flex-1 grid-cols-1 xl:grid-cols-[1fr_minmax(380px,520px)]">
        <div className="min-h-0 min-w-0 overflow-hidden border-r border-line">
          {mode === "active" ? (
            detailOpen && selected ? (
              <ActiveCrisisDetail
                event={selected}
                nowIso={nowIso}
                locale={locale}
                onDecide={decide}
                onBack={closeDetail}
              />
            ) : (
              <ActiveCrisesTable
                events={activeQueue}
                nowIso={nowIso}
                locale={locale}
                selectedId={selectedId}
                hoveredId={hoveredId}
                unreadByEventId={unreadByEventId}
                region={region}
                onRegion={setRegion}
                onSelect={selectEvent}
                onHover={setHoveredId}
              />
            )
          ) : detailOpen && selected ? (
            <ActiveCrisisDetail
              event={selected}
              nowIso={nowIso}
              locale={locale}
              onDecide={decide}
              onBack={closeDetail}
            />
          ) : (
            <QueueColumn
              pending={queue}
              pendingLabel={t("nav.pending")}
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
          )}
        </div>

        <div className="min-h-0 min-w-0">
          <MapView
            events={mapEvents}
            active={mapActive}
            hoveredId={hoveredId}
            unreadByEventId={unreadByEventId}
            mode={mapMode}
            onMode={setMapMode}
            onSelect={selectEvent}
            onHover={setHoveredId}
            onOpenDetail={() => setDetailOpen(true)}
          />
        </div>
      </div>
    </div>
  );
}
