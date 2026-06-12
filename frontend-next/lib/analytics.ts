import type { Event as CwEvent } from "./types";

export interface VostKpis {
  activeVerified: number;
  pending: number;
  onHold: number;
  newReports24h: number;
  critical: number;
  avgVerificationMin: number;
}

export interface SeverityTrendDay {
  label: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface SourceCount {
  key: string;
  label: string;
  count: number;
}

export interface SeveritySlice {
  key: "critical" | "high" | "medium" | "low" | "info";
  count: number;
  color: string;
}

export interface ActivityItem {
  id: string;
  type: "status" | "new";
  minutesAgo: number;
  title: string;
  detail: string;
  accent?: "danger" | "warning" | "default";
}

const SOCIAL_KEYS: Record<string, string> = {
  Mastodon: "mastodon",
  BlueSky: "bluesky",
  Reddit: "reddit",
};

const WETTER_KEYS: Record<string, string> = {
  DWD: "dwd",
  PEGELONLINE: "pegelonline",
  HVZ: "hvz",
};

const AMTLICH_KEYS: Record<string, string> = {
  Polizei: "police",
  Feuerwehr: "feuerwehr",
  Landratsamt: "landratsamt",
  "MobiData BW": "mobidata",
  Nachrichten: "news",
  "NASA FIRMS": "firms",
};

function countSignals(ev: CwEvent): number {
  const social = ev.belege.social?.posts.length ?? 0;
  const wetter = ev.belege.wetter?.length ?? 0;
  const amtlich = ev.belege.amtlich?.length ?? 0;
  const total = social + wetter + amtlich;
  if (total > 0) return total;
  return ev.signalCount ?? 1;
}

function eventTime(ev: CwEvent): number {
  const raw = ev.lastUpdatedAt ?? ev.wann;
  const t = Date.parse(raw);
  return Number.isFinite(t) ? t : 0;
}

export function computeVostKpis(events: CwEvent[], nowMs: number = Date.now()): VostKpis {
  const dayMs = 24 * 60 * 60 * 1000;
  const reviewed = events.filter(
    (e) => e.status === "bestaetigt" || e.status === "abgelehnt"
  );

  let avgMin = 0;
  if (reviewed.length > 0) {
    const total = reviewed.reduce((sum, e) => {
      const t = Date.parse(e.wann);
      return sum + (Number.isFinite(t) ? Math.max(0, Math.round((nowMs - t) / 60000)) : 0);
    }, 0);
    avgMin = Math.round(total / reviewed.length);
  }

  const newReports24h = events
    .filter((e) => {
      const t = Date.parse(e.wann);
      return Number.isFinite(t) && nowMs - t <= dayMs;
    })
    .reduce((sum, e) => sum + countSignals(e), 0);

  return {
    activeVerified: events.filter(
      (e) => e.verifiziert && e.status !== "abgelehnt"
    ).length,
    pending: events.filter((e) => e.status === "neu").length,
    onHold: events.filter((e) => e.status === "hold").length,
    newReports24h,
    critical: events.filter((e) => e.urgency >= 4).length,
    avgVerificationMin: avgMin,
  };
}

export function computeSeverityTrend(
  events: CwEvent[],
  nowMs: number = Date.now(),
  days = 14
): SeverityTrendDay[] {
  const dayMs = 24 * 60 * 60 * 1000;
  const buckets: SeverityTrendDay[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const end = nowMs - i * dayMs;
    const start = end - dayMs;
    const date = new Date(end);
    const label = date.toLocaleDateString("en-GB", { month: "short", day: "numeric" });

    const inDay = events.filter((e) => {
      const t = Date.parse(e.wann);
      return Number.isFinite(t) && t >= start && t < end;
    });

    buckets.push({
      label,
      critical: inDay.filter((e) => e.urgency === 5).length,
      high: inDay.filter((e) => e.urgency === 4).length,
      medium: inDay.filter((e) => e.urgency === 3).length,
      low: inDay.filter((e) => e.urgency <= 2).length,
    });
  }

  return buckets;
}

export function computeSourceBreakdown(events: CwEvent[]): SourceCount[] {
  const counts = new Map<string, number>();

  const add = (key: string, n = 1) => {
    counts.set(key, (counts.get(key) ?? 0) + n);
  };

  for (const ev of events) {
    ev.belege.social?.posts.forEach((p) => add(SOCIAL_KEYS[p.plattform] ?? "other"));
    ev.belege.wetter?.forEach((s) => add(WETTER_KEYS[s.quelle] ?? "other"));
    ev.belege.amtlich?.forEach((s) => add(AMTLICH_KEYS[s.quelle] ?? "other"));
    if (!ev.belege.social && !ev.belege.wetter && !ev.belege.amtlich && ev.signalCount) {
      add("other", ev.signalCount);
    }
  }

  return [...counts.entries()]
    .map(([key, count]) => ({ key, label: key, count }))
    .sort((a, b) => b.count - a.count);
}

/** Known ingestion adapters (fallback when /api/sources is unavailable). */
export const FALLBACK_DATA_SOURCES: { id: string; label: string }[] = [
  { id: "mastodon", label: "Mastodon" },
  { id: "bluesky", label: "Bluesky" },
  { id: "dwd", label: "DWD" },
  { id: "pegelonline", label: "PEGELONLINE" },
  { id: "firms", label: "NASA FIRMS" },
  { id: "hvz", label: "HVZ" },
  { id: "police", label: "Polizei" },
  { id: "news", label: "News" },
];

export interface SourceChartPoint {
  id: string;
  name: string;
  count: number;
}

/** One bar per configured retrieval source; zero when no signals yet. */
export function buildSourceChartSeries(
  events: CwEvent[],
  configuredSources: { id: string; label: string }[]
): SourceChartPoint[] {
  const breakdown = computeSourceBreakdown(events);
  const countById = new Map<string, number>();
  for (const item of breakdown) {
    countById.set(item.key, (countById.get(item.key) ?? 0) + item.count);
  }

  const sources = configuredSources.length > 0 ? configuredSources : FALLBACK_DATA_SOURCES;

  return sources.map((s) => ({
    id: s.id,
    name: s.label,
    count: countById.get(s.id) ?? 0,
  }));
}

export function computeSeverityDistribution(events: CwEvent[]): SeveritySlice[] {
  const critical = events.filter((e) => e.urgency === 5).length;
  const high = events.filter((e) => e.urgency === 4).length;
  const medium = events.filter((e) => e.urgency === 3).length;
  const low = events.filter((e) => e.urgency <= 2 && e.eventType !== "Sonstiges").length;
  const info = events.filter((e) => e.eventType === "Sonstiges").length;

  return [
    { key: "critical", count: critical, color: "#ff4d4d" },
    { key: "high", count: high, color: "#ff944d" },
    { key: "medium", count: medium, color: "#ffc14d" },
    { key: "low", count: low, color: "#4d94ff" },
    { key: "info", count: info, color: "#6b6b6b" },
  ];
}

function statusDetail(ev: CwEvent): string {
  if (ev.status === "hold") return "Set status to on_hold";
  if (ev.status === "bestaetigt") return "Verified event";
  if (ev.status === "abgelehnt") return "Dismissed event";
  if (ev.verifiziert) return "Escalated to BBK";
  return "Pending verification";
}

function activityAccent(ev: CwEvent): ActivityItem["accent"] {
  if (ev.urgency >= 5 || ev.verdacht) return "danger";
  if (ev.urgency >= 4) return "warning";
  return "default";
}

export function computeRecentActivity(
  events: CwEvent[],
  nowMs: number = Date.now(),
  limit = 6
): ActivityItem[] {
  const sorted = [...events].sort((a, b) => eventTime(b) - eventTime(a));

  return sorted.slice(0, limit).map((ev) => {
    const t = eventTime(ev);
    const minutesAgo = Number.isFinite(t)
      ? Math.max(0, Math.round((nowMs - t) / 60000))
      : 0;
    const isNew = ev.status === "neu" && minutesAgo < 60;

    return {
      id: ev.id,
      type: isNew ? "new" : "status",
      minutesAgo,
      title: ev.titel,
      detail: statusDetail(ev),
      accent: activityAccent(ev),
    };
  });
}

/** Header status counts */
export function computeHeaderStatus(events: CwEvent[]) {
  return {
    active: events.filter((e) => e.status === "bestaetigt" || e.verifiziert).length,
    pending: events.filter((e) => e.status === "neu").length,
  };
}
