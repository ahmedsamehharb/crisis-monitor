import type { Event as CwEvent, Urgency } from "./types";

export type SeverityLabel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type DisplayStatus = "ESCALATED" | "VERIFIED" | "PENDING" | "ON HOLD";

const SEVERITY_MAP: Record<Urgency, SeverityLabel> = {
  5: "CRITICAL",
  4: "HIGH",
  3: "MEDIUM",
  2: "LOW",
  1: "LOW",
};

const SEVERITY_COLOR: Record<SeverityLabel, string> = {
  CRITICAL: "#ff4d4d",
  HIGH: "#ff944d",
  MEDIUM: "#ffc14d",
  LOW: "#4d94ff",
};

const STATUS_COLOR: Record<DisplayStatus, string> = {
  ESCALATED: "#ff4d4d",
  VERIFIED: "#3fb36b",
  PENDING: "#ff944d",
  "ON HOLD": "#4d94ff",
};

export function severityLabel(urgency: Urgency): SeverityLabel {
  return SEVERITY_MAP[urgency];
}

export function severityColor(label: SeverityLabel): string {
  return SEVERITY_COLOR[label];
}

export function displayStatus(ev: CwEvent): DisplayStatus {
  if (ev.verifiziert) return "VERIFIED";
  if (ev.status === "hold") return "ON HOLD";
  if (ev.urgency >= 4) return "ESCALATED";
  return "PENDING";
}

export function statusColor(status: DisplayStatus): string {
  return STATUS_COLOR[status];
}

/** Tags under event title from type + location + assessment */
export function eventTags(ev: CwEvent): string[] {
  const tags = new Set<string>();
  tags.add(ev.eventType.toLowerCase());
  const city = ev.ort.split(",")[0]?.trim().toLowerCase();
  if (city) tags.add(city);
  if (ev.einschaetzung) {
    ev.einschaetzung
      .toLowerCase()
      .split(/[,\s·]+/)
      .filter((w) => w.length > 2)
      .slice(0, 2)
      .forEach((w) => tags.add(w));
  }
  return [...tags].slice(0, 4);
}

export interface SourceChip {
  label: string;
  count?: number;
}

export function sourceChips(ev: CwEvent, max = 4): SourceChip[] {
  const chips: SourceChip[] = [];

  ev.belege.social?.posts.forEach((p) => {
    const label =
      p.plattform === "BlueSky" ? "X" : p.plattform === "Mastodon" ? "PUBLIC" : "SOCIAL";
    const existing = chips.find((c) => c.label === label);
    if (existing) existing.count = (existing.count ?? 1) + 1;
    else chips.push({ label, count: 1 });
  });

  ev.belege.wetter?.forEach((s) => {
    const label = s.quelle === "DWD" ? "DWD" : "MONITOR";
    const existing = chips.find((c) => c.label === label);
    if (existing) existing.count = (existing.count ?? 1) + 1;
    else chips.push({ label, count: 1 });
  });

  ev.belege.amtlich?.forEach((s) => {
    const label =
      s.quelle === "Nachrichten" ? "NEWS" : s.quelle === "Polizei" || s.quelle === "Feuerwehr" ? "GOV" : "GOV";
    const existing = chips.find((c) => c.label === label);
    if (existing) existing.count = (existing.count ?? 1) + 1;
    else chips.push({ label, count: 1 });
  });

  if (chips.length === 0 && ev.signalCount) {
    chips.push({ label: "REPORTS", count: ev.signalCount });
  }

  return chips.slice(0, max);
}

export function reportCount(ev: CwEvent): number {
  const social = ev.belege.social?.posts.length ?? 0;
  const wetter = ev.belege.wetter?.length ?? 0;
  const amtlich = ev.belege.amtlich?.length ?? 0;
  const total = social + wetter + amtlich;
  return total > 0 ? total : (ev.signalCount ?? 0);
}

export function confidencePercent(ev: CwEvent): number {
  return Math.round(ev.confidence * 100);
}

export function shortEventId(id: string): string {
  const clean = id.replace(/^cm-/, "").replace(/^ev-/, "");
  return clean.slice(-8).toUpperCase();
}

export function formatDetected(iso: string, locale: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(locale === "de" ? "de-DE" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatAgo(minutes: number, locale: string): string {
  if (minutes < 1) return locale === "de" ? "gerade eben" : "just now";
  if (minutes < 60) return locale === "de" ? `vor ${minutes} Min` : `${minutes} min ago`;
  const h = Math.floor(minutes / 60);
  return locale === "de" ? `vor ${h} Std` : `${h} hr ago`;
}

/** Region chips from event locations (city / district part of ort) */
export function extractRegions(events: CwEvent[]): string[] {
  const regions = new Set<string>();
  for (const ev of events) {
    const parts = ev.ort.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) regions.add(parts[1].toUpperCase());
    else if (parts[0]) regions.add(parts[0].toUpperCase());
  }
  return [...regions].sort();
}

export interface SourceInvolved {
  name: string;
  category: string;
  count: number;
}

export function sourcesInvolved(ev: CwEvent): SourceInvolved[] {
  const list: SourceInvolved[] = [];

  const socialByPlatform = new Map<string, number>();
  ev.belege.social?.posts.forEach((p) => {
    const key = p.plattform === "BlueSky" ? "X / Twitter" : p.plattform;
    socialByPlatform.set(key, (socialByPlatform.get(key) ?? 0) + 1);
  });
  socialByPlatform.forEach((count, name) => {
    list.push({ name, category: `SOCIAL — ${name.toUpperCase().replace(/ \/ TWITTER/, "")}`, count });
  });

  ev.belege.wetter?.forEach((s) => {
    list.push({ name: s.quelle, category: "SENSOR", count: 1 });
  });

  ev.belege.amtlich?.forEach((s) => {
    list.push({
      name: s.quelle,
      category: s.quelle === "Nachrichten" ? "NEWS" : "OFFICIAL",
      count: 1,
    });
  });

  return list;
}
