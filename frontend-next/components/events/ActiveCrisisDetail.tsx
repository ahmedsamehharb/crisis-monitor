"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Check,
  Eye,
  RefreshCw,
  TriangleAlert,
  X,
} from "lucide-react";
import type { Event as CwEvent, EventStatus } from "@/lib/types";
import {
  confidencePercent,
  displayStatus,
  formatAgo,
  formatDetected,
  reportCount,
  severityColor,
  severityLabel,
  shortEventId,
  sourcesInvolved,
  statusColor,
} from "@/lib/event-display";
import { minutenSeit } from "@/lib/ui";

interface Props {
  event: CwEvent;
  nowIso: string;
  locale: string;
  onDecide: (id: string, status: EventStatus, notiz: string) => void;
  onBack: () => void;
}

function ActionButton({
  label,
  tone,
  onClick,
  icon,
  disabled = false,
}: {
  label: string;
  tone: "success" | "danger" | "neutral";
  onClick: () => void;
  icon: React.ReactNode;
  disabled?: boolean;
}) {
  const colors = {
    success: { c: "#3fb36b", bg: "#3fb36b14" },
    danger: { c: "#ff4d4d", bg: "#ff4d4d14" },
    neutral: { c: "#8a8a8a", bg: "transparent" },
  };
  const { c, bg } = colors[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-3 text-xs font-semibold tracking-wide transition-colors disabled:cursor-not-allowed disabled:opacity-40"
      style={{
        color: c,
        borderColor: `${c}66`,
        backgroundColor: bg,
      }}
    >
      {icon}
      {label}
    </button>
  );
}

export default function ActiveCrisisDetail({
  event,
  nowIso,
  locale,
  onDecide,
  onBack,
}: Props) {
  const [notiz, setNotiz] = useState("");
  const sev = severityLabel(event.urgency);
  const sevColor = severityColor(sev);
  const status = displayStatus(event);
  const statusColorVal = statusColor(status);
  const conf = confidencePercent(event);
  const updatedMin = minutenSeit(nowIso, event.lastUpdatedAt ?? event.wann);
  const involved = sourcesInvolved(event);

  const tags = [
    event.eventType.toUpperCase(),
    event.verifiziert ? "VERIFIED" : "UNVERIFIED",
    event.ort.split(",")[0]?.trim().toUpperCase() ?? "UNKNOWN",
  ].filter(Boolean);

  const timeline = [
    {
      label: "Event detected",
      detail: formatDetected(event.wann, locale),
      ago: formatAgo(minutenSeit(nowIso, event.wann), locale),
    },
    {
      label: "Last signal update",
      detail: formatDetected(event.lastUpdatedAt ?? event.wann, locale),
      ago: formatAgo(updatedMin, locale),
    },
  ];

  const decide = (status: EventStatus) => onDecide(event.id, status, notiz);

  return (
    <div className="flex h-full min-h-0 bg-bg">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="border-b border-line px-6 py-4">
          <button
            type="button"
            onClick={onBack}
            className="mb-4 inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-mute transition-colors hover:text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            BACK
          </button>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              <span
                className="inline-flex items-center gap-1.5 rounded border px-2.5 py-1 text-[10px] font-semibold tracking-wide"
                style={{ color: sevColor, borderColor: `${sevColor}66`, backgroundColor: `${sevColor}14` }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: sevColor }} />
                {sev}
              </span>
              <span
                className="inline-flex rounded border px-2.5 py-1 text-[10px] font-semibold tracking-wide"
                style={{ color: statusColorVal, borderColor: `${statusColorVal}88` }}
              >
                {status === "PENDING" ? "PENDING VERIFICATION" : status}
              </span>
            </div>
            <span className="text-[11px] font-medium tracking-wide text-dim">
              ID — {shortEventId(event.id)}
            </span>
          </div>

          <h1 className="mt-4 text-2xl font-semibold leading-tight tracking-tight text-ink">
            {event.titel}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-mute">
            {event.zusammenfassung}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-6 border-t border-line pt-5 sm:grid-cols-4">
            {[
              { label: "CONFIDENCE", value: `${conf}%` },
              { label: "REPORTS", value: String(reportCount(event)) },
              { label: "FIRST DETECTED", value: formatDetected(event.wann, locale) },
              { label: "LAST UPDATED", value: formatAgo(updatedMin, locale) },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[10px] font-semibold tracking-[0.1em] text-dim">{label}</p>
                <p className="mt-1 text-sm font-semibold tabular-nums text-ink">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-5">
            <p className="mb-2 text-[10px] font-semibold tracking-[0.1em] text-dim">TAGS</p>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded border border-line px-2.5 py-1 text-[10px] font-semibold tracking-wide text-mute"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-5">
          <div className="dashboard-widget p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[11px] font-semibold tracking-[0.1em] text-mute">
                AI SITUATION BRIEFING
              </h2>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-wide text-dim transition-colors hover:text-mute"
                aria-label="Regenerate briefing"
              >
                <RefreshCw className="h-3 w-3" />
                REGENERATE
              </button>
            </div>
            <div className="prose prose-invert max-w-none text-sm leading-relaxed text-soft">
              <p className="font-semibold text-ink"># CRISIS INTELLIGENCE BRIEFING</p>
              <p className="mt-3 font-semibold text-ink">## SITUATION</p>
              <p className="mt-2 text-mute">{event.zusammenfassung}</p>
              {event.einschaetzung ? (
                <>
                  <p className="mt-4 font-semibold text-ink">## ASSESSMENT</p>
                  <p className="mt-2 text-mute">
                    {event.einschaetzung}
                    {event.warum ? ` — ${event.warum}` : ""}
                  </p>
                </>
              ) : null}
              {event.urteil?.was ? (
                <>
                  <p className="mt-4 font-semibold text-ink">## THREAT</p>
                  <p className="mt-2 text-mute">{event.urteil.was}</p>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <aside className="flex w-[280px] shrink-0 flex-col gap-4 overflow-y-auto border-l border-line bg-panel p-4">
        <section>
          <h3 className="mb-3 text-[10px] font-semibold tracking-[0.12em] text-dim">ACTIONS</h3>
          <div className="space-y-2">
            <ActionButton
              label="MARK VERIFIED"
              tone="success"
              icon={<Check className="h-4 w-4" />}
              onClick={() => decide("bestaetigt")}
            />
            <ActionButton
              label="ESCALATE"
              tone="danger"
              icon={<TriangleAlert className="h-4 w-4" />}
              onClick={() => decide("bestaetigt")}
            />
            <ActionButton
              label="PLACE ON HOLD"
              tone="neutral"
              icon={<Eye className="h-4 w-4" />}
              onClick={() => decide("hold")}
              disabled={event.status === "hold"}
            />
            <ActionButton
              label="CLOSE EVENT"
              tone="neutral"
              icon={<X className="h-4 w-4" />}
              onClick={() => decide("abgelehnt")}
            />
          </div>
          <textarea
            value={notiz}
            onChange={(e) => setNotiz(e.target.value)}
            rows={2}
            placeholder="Decision note (logged)…"
            className="mt-3 w-full resize-none rounded-lg border border-line bg-card px-3 py-2 text-xs text-ink placeholder:text-dim focus:border-accent/50 focus:outline-none"
          />
        </section>

        <section>
          <h3 className="mb-3 text-[10px] font-semibold tracking-[0.12em] text-dim">
            SOURCES INVOLVED
          </h3>
          <ul className="space-y-2">
            {involved.length === 0 ? (
              <li className="text-xs text-dim">No source breakdown available.</li>
            ) : (
              involved.map((s) => (
                <li
                  key={`${s.category}-${s.name}`}
                  className="flex items-center justify-between rounded-lg border border-line bg-card px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-ink">{s.name}</p>
                    <p className="text-[10px] text-dim">{s.category}</p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-ink">{s.count}</span>
                </li>
              ))
            )}
          </ul>
        </section>

        <section>
          <h3 className="mb-3 text-[10px] font-semibold tracking-[0.12em] text-dim">TIMELINE</h3>
          <ul className="space-y-3">
            {timeline.map((item) => (
              <li key={item.label} className="border-l-2 border-line pl-3">
                <p className="text-[10px] font-semibold tracking-wide text-dim">{item.label}</p>
                <p className="mt-0.5 text-xs text-ink">{item.detail}</p>
                <p className="text-[10px] text-mute">{item.ago}</p>
              </li>
            ))}
          </ul>
        </section>
      </aside>
    </div>
  );
}
