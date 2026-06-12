"use client";

import { useState } from "react";
import {
  ArrowUpDown,
  BellRing,
  Check,
  ChevronDown,
  TriangleAlert,
  X,
} from "lucide-react";
import type { Event as CwEvent } from "@/lib/types";
import {
  SEV,
  TYPE_ICON,
  fmtVor,
  holdHinweis,
  minutenSeit,
  quellenStat,
  trendRichtung,
} from "@/lib/ui";
import { KonfidenzText, TrendPfeil, UnreadDot } from "./ui";

const DANGER = "#E5484D";
const WARNING = "#E7B53C";
const SUCCESS = "#3FB36B";

type Bereich = "eingang" | "hold" | "archiv";

interface RowProps {
  ev: CwEvent;
  bereich: Bereich;
  nowIso: string;
  active: boolean;
  hovered: boolean;
  unreadCount: number;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}

/**
 * Eine Zeilen-Anatomie für alle Bereiche: 3px-Severity-Kante links, Typ-Icon,
 * Titel, Subzeile, rechts genau ein Wert. Fake-Verdacht und On-Hold-Highlight
 * unterscheiden sich nur über Statuszeile und Kantenfarbe, nicht über die Form.
 */
function EventRow({
  ev,
  bereich,
  nowIso,
  active,
  hovered,
  unreadCount,
  onSelect,
  onHover,
}: RowProps) {
  const Icon = ev.verdacht ? TriangleAlert : TYPE_ICON[ev.eventType];
  const hinweis = bereich === "hold" ? holdHinweis(ev) : null;
  const kante = ev.verdacht ? DANGER : hinweis ? WARNING : SEV[ev.urgency];
  const stat = quellenStat(ev);

  let subzeile: string;
  if (bereich === "archiv") {
    subzeile = `${ev.bewertetUm ?? "--:--"} Uhr · ${
      ev.status === "bestaetigt" ? "an Stab weitergegeben" : "verworfen"
    }`;
  } else if (ev.verdacht) {
    subzeile = `${ev.verdacht.kernwiderspruch} · ${ev.verdacht.shares.toLocaleString("de-DE")} Shares`;
  } else if (bereich === "hold") {
    subzeile = `${stat.gesamt} Quellen · ${stat.typen} ${stat.typen === 1 ? "Typ" : "Typen"} · ${fmtVor(
      ev.hold?.seitMin ?? minutenSeit(nowIso, ev.wann)
    )}`;
  } else {
    subzeile = `${ev.ort.split(",")[0].trim()} · ${fmtVor(minutenSeit(nowIso, ev.wann))}`;
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(ev.id)}
      onMouseEnter={() => onHover(ev.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(ev.id)}
      onBlur={() => onHover(null)}
      aria-current={active ? "true" : undefined}
      className={`relative block w-full border-b border-line/50 py-2.5 pl-4 pr-3.5 text-left transition-colors ${
        active ? "bg-card" : hovered ? "bg-card/60" : "hover:bg-card/60"
      } ${bereich === "archiv" ? "opacity-60 hover:opacity-100" : ""}`}
    >
      <span className="absolute inset-y-0 left-0 w-[3px]" style={{ backgroundColor: kante }} aria-hidden />
      {active && <span className="absolute inset-y-0 left-[3px] w-[2px] bg-accent" aria-hidden />}

      {(ev.verdacht || hinweis) && (
        <span
          className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide"
          style={{ color: ev.verdacht ? DANGER : WARNING }}
        >
          {ev.verdacht ? (
            <TriangleAlert className="h-3 w-3" aria-hidden />
          ) : (
            <BellRing className="h-3 w-3" aria-hidden />
          )}
          {ev.verdacht ? "Verdacht auf Falschmeldung" : hinweis}
        </span>
      )}

      <span className="flex items-center gap-2.5">
        <Icon
          className="h-4 w-4 shrink-0"
          style={{ color: ev.verdacht ? DANGER : "#9C9C9C" }}
          aria-hidden
          strokeWidth={2}
        />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="block min-w-0 flex-1 truncate text-[13px] font-medium leading-tight text-ink">
              {ev.titel}
            </span>
            {unreadCount > 0 && bereich !== "archiv" ? (
              <UnreadDot count={unreadCount} />
            ) : null}
          </span>
          <span className="mt-0.5 block truncate text-[11px] text-mute">{subzeile}</span>
        </span>
        <span className="flex shrink-0 items-center gap-1">
          {bereich === "archiv" ? (
            ev.status === "bestaetigt" ? (
              <Check className="h-3.5 w-3.5" style={{ color: SUCCESS }} aria-label="An Stab weitergegeben" strokeWidth={2.4} />
            ) : (
              <X className="h-3.5 w-3.5" style={{ color: "#9C9C9C" }} aria-label="Verworfen" strokeWidth={2.4} />
            )
          ) : ev.verdacht ? (
            <>
              <TrendPfeil richtung="steigend" danger />
              <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: DANGER }}>
                viral
              </span>
            </>
          ) : bereich === "hold" ? (
            <>
              <TrendPfeil richtung={trendRichtung(ev)} />
              <KonfidenzText value={ev.confidence} verified={ev.verifiziert} />
            </>
          ) : (
            <KonfidenzText value={ev.confidence} verified={ev.verifiziert} />
          )}
        </span>
      </span>
    </button>
  );
}

function SectionHeader({
  label,
  count,
  children,
}: {
  label: string;
  count: number;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-4 pb-2 pt-4">
      <span className="flex items-baseline gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-mute">{label}</span>
        <span className="text-[11px] font-semibold text-ink">{count}</span>
      </span>
      {children}
    </div>
  );
}

interface Props {
  eingang: CwEvent[];
  onHold: CwEvent[];
  archive: CwEvent[];
  nowIso: string;
  selectedId: string;
  hoveredId: string | null;
  unreadByEventId: Record<string, number>;
  sortBy: "urgency" | "confidence";
  onSortBy: (v: "urgency" | "confidence") => void;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}

export default function QueueColumn({
  eingang,
  onHold,
  archive,
  nowIso,
  selectedId,
  hoveredId,
  unreadByEventId,
  sortBy,
  onSortBy,
  onSelect,
  onHover,
}: Props) {
  const [archOpen, setArchOpen] = useState(false);

  const rowProps = (ev: CwEvent, bereich: Bereich) => ({
    ev,
    bereich,
    nowIso,
    active: ev.id === selectedId,
    hovered: ev.id === hoveredId && ev.id !== selectedId,
    unreadCount: unreadByEventId[ev.id] ?? 0,
    onSelect,
    onHover,
  });

  return (
    <aside
      aria-label="Meldungslisten"
      className="flex h-full min-h-0 flex-col overflow-y-auto border-r border-line bg-panel"
    >
      <SectionHeader label="Eingang" count={eingang.length}>
        <button
          type="button"
          onClick={() => onSortBy(sortBy === "urgency" ? "confidence" : "urgency")}
          className="flex items-center gap-1 text-[11px] text-mute hover:text-ink"
          aria-label={`Sortierung wechseln, aktuell nach ${
            sortBy === "urgency" ? "Dringlichkeit" : "Konfidenz"
          }`}
        >
          {sortBy === "urgency" ? "Nach Dringlichkeit" : "Nach Konfidenz"}
          <ArrowUpDown className="h-3 w-3" aria-hidden />
        </button>
      </SectionHeader>
      <div>
        {eingang.map((ev) => (
          <EventRow key={ev.id} {...rowProps(ev, "eingang")} />
        ))}
        {eingang.length === 0 && (
          <p className="px-4 py-4 text-xs text-dim">Keine offenen Meldungen im Eingang.</p>
        )}
      </div>

      <SectionHeader label="On Hold" count={onHold.length} />
      <div>
        {onHold.map((ev) => (
          <EventRow key={ev.id} {...rowProps(ev, "hold")} />
        ))}
        {onHold.length === 0 && (
          <p className="px-4 py-4 text-xs text-dim">Keine Meldungen on hold.</p>
        )}
      </div>

      <button
        type="button"
        onClick={() => setArchOpen((o) => !o)}
        aria-expanded={archOpen}
        className="flex w-full items-center justify-between px-4 pb-2 pt-4 text-left"
      >
        <span className="flex items-baseline gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-mute">
            Bereits bewertet
          </span>
          <span className="text-[11px] font-semibold text-ink">{archive.length}</span>
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-mute transition-transform ${archOpen ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {archOpen && (
        <div className="pb-3">
          {archive.map((ev) => (
            <EventRow key={ev.id} {...rowProps(ev, "archiv")} />
          ))}
          {archive.length === 0 && (
            <p className="px-4 py-2 text-xs text-dim">Noch keine Bewertungen.</p>
          )}
        </div>
      )}
    </aside>
  );
}
