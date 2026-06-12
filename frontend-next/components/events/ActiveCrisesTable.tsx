"use client";

import { ArrowUpRight } from "lucide-react";
import type { Event as CwEvent } from "@/lib/types";
import {
  confidencePercent,
  displayStatus,
  eventTags,
  formatAgo,
  reportCount,
  severityColor,
  severityLabel,
  sourceChips,
  statusColor,
  extractRegions,
} from "@/lib/event-display";
import { minutenSeit } from "@/lib/ui";
import { UnreadDot } from "@/components/ui";

interface Props {
  events: CwEvent[];
  nowIso: string;
  locale: string;
  selectedId: string;
  hoveredId: string | null;
  unreadByEventId: Record<string, number>;
  region: string;
  onRegion: (r: string) => void;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}

const COLS =
  "grid grid-cols-[minmax(200px,2fr)_100px_minmax(120px,1.2fr)_90px_72px_minmax(100px,1fr)_100px_100px_32px]";

function SeverityBadge({ urgency }: { urgency: CwEvent["urgency"] }) {
  const label = severityLabel(urgency);
  const color = severityColor(label);
  return (
    <span
      className="inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-semibold tracking-wide"
      style={{ color, borderColor: `${color}66`, backgroundColor: `${color}14` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function StatusBadge({ ev }: { ev: CwEvent }) {
  const status = displayStatus(ev);
  const color = statusColor(status);
  return (
    <span
      className="inline-flex rounded border px-2 py-0.5 text-[10px] font-semibold tracking-wide"
      style={{ color, borderColor: `${color}88` }}
    >
      {status}
    </span>
  );
}

export default function ActiveCrisesTable({
  events,
  nowIso,
  locale,
  selectedId,
  hoveredId,
  unreadByEventId,
  region,
  onRegion,
  onSelect,
  onHover,
}: Props) {
  const regions = extractRegions(events);

  return (
    <div className="flex h-full flex-col bg-bg">
      <div className="border-b border-line px-5 py-4">
        <p className="mb-2 text-[10px] font-semibold tracking-[0.12em] text-dim">REGION</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onRegion("alle")}
            className={`rounded border px-3 py-1 text-[11px] font-semibold tracking-wide transition-colors ${
              region === "alle"
                ? "border-accent/50 bg-accent/12 text-accent"
                : "border-line text-mute hover:border-line hover:text-ink"
            }`}
          >
            ALL
          </button>
          {regions.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => onRegion(r)}
              className={`rounded border px-3 py-1 text-[11px] font-semibold tracking-wide transition-colors ${
                region === r
                  ? "border-accent/50 bg-accent/12 text-accent"
                  : "border-line text-mute hover:text-ink"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className={`${COLS} shrink-0 gap-3 border-b border-line px-5 py-3 text-[10px] font-semibold tracking-[0.1em] text-dim`}>
        <span>EVENT</span>
        <span>SEVERITY</span>
        <span>LOCATION</span>
        <span>CONFIDENCE</span>
        <span>REPORTS</span>
        <span>SOURCES</span>
        <span>LAST UPDATE</span>
        <span>STATUS</span>
        <span />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {events.length === 0 ? (
          <p className="px-5 py-8 text-sm text-mute">No active crises in this region.</p>
        ) : (
          events.map((ev) => {
            const active = ev.id === selectedId;
            const hovered = ev.id === hoveredId;
            const unread = unreadByEventId[ev.id] ?? 0;
            const conf = confidencePercent(ev);
            const chips = sourceChips(ev);
            const extraSources = sourceChips(ev, 99).length - chips.length;
            const updatedMin = minutenSeit(nowIso, ev.lastUpdatedAt ?? ev.wann);
            const locationParts = ev.ort.split(",").map((p) => p.trim());

            return (
              <button
                key={ev.id}
                type="button"
                onClick={() => onSelect(ev.id)}
                onMouseEnter={() => onHover(ev.id)}
                onMouseLeave={() => onHover(null)}
                className={`${COLS} w-full gap-3 border-b border-line/60 px-5 py-4 text-left transition-colors ${
                  active ? "bg-card" : hovered ? "bg-card/50" : "hover:bg-card/30"
                }`}
              >
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="block truncate text-sm font-semibold text-ink">{ev.titel}</span>
                    {unread > 0 ? <UnreadDot count={unread} /> : null}
                  </span>
                  <span className="mt-1 flex flex-wrap gap-x-1 text-[11px] text-dim">
                    {eventTags(ev).map((tag, i) => (
                      <span key={tag}>
                        {i > 0 ? " · " : ""}
                        {tag}
                      </span>
                    ))}
                  </span>
                </span>

                <span className="self-center">
                  <SeverityBadge urgency={ev.urgency} />
                </span>

                <span className="min-w-0 self-center text-xs leading-snug text-mute">
                  <span className="block text-ink">{locationParts[0]}</span>
                  {locationParts[1] ? (
                    <span className="block text-[11px] text-dim">{locationParts.slice(1).join(", ")}</span>
                  ) : null}
                </span>

                <span className="self-center">
                  <span className="text-xs font-semibold tabular-nums text-ink">{conf}%</span>
                  <span className="mt-1 block h-1 w-full overflow-hidden rounded-full bg-line">
                    <span
                      className="block h-full rounded-full bg-accent"
                      style={{ width: `${conf}%` }}
                    />
                  </span>
                </span>

                <span className="self-center text-sm font-semibold tabular-nums text-ink">
                  {reportCount(ev)}
                </span>

                <span className="flex flex-wrap gap-1 self-center">
                  {chips.map((c) => (
                    <span
                      key={c.label}
                      className="rounded border border-line bg-card px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-mute"
                    >
                      {c.label}
                    </span>
                  ))}
                  {extraSources > 0 ? (
                    <span className="rounded border border-line bg-card px-1.5 py-0.5 text-[9px] font-semibold text-mute">
                      +{extraSources}
                    </span>
                  ) : null}
                </span>

                <span className="self-center text-xs text-mute">
                  {formatAgo(updatedMin, locale)}
                </span>

                <span className="self-center">
                  <StatusBadge ev={ev} />
                </span>

                <span className="self-center text-mute">
                  <ArrowUpRight className="h-4 w-4" strokeWidth={1.75} />
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
