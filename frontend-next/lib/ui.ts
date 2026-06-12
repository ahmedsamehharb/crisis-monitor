import {
  Car,
  CircleAlert,
  CloudRain,
  Flame,
  PlugZap,
  Waves,
  Wind,
  type LucideIcon,
} from "lucide-react";
import type { Event as CwEvent, EventType, Urgency } from "./types";

/** Severity-Rampe: ausschließlich für Severity-Kante, Karten-Pins und Segment-Meter */
export const SEV: Record<Urgency, string> = {
  1: "#3FB36B",
  2: "#9DCB5A",
  3: "#E7B53C",
  4: "#E8843C",
  5: "#E5484D",
};

export const TYPE_ICON: Record<EventType, LucideIcon> = {
  Hochwasser: Waves,
  Starkregen: CloudRain,
  Brand: Flame,
  Verkehrsunfall: Car,
  Infrastrukturausfall: PlugZap,
  Sturm: Wind,
  Sonstiges: CircleAlert,
};

export const URGENCY_LABEL: Record<Urgency, string> = {
  1: "Gering",
  2: "Mäßig",
  3: "Erhöht",
  4: "Kritisch",
  5: "Akut",
};

/* ── Konfidenz als Stufe (keine Prozentwerte im UI, Schein-Präzision vermeiden) ── */

export type KonfidenzStufe = "niedrig" | "mittel" | "hoch";

/** Anzeige-Skala: KI-Stufen plus der separate Status "verifiziert" */
export type AnzeigeStufe = KonfidenzStufe | "verifiziert";

export const KONFIDENZ_HOCH = 0.7;
export const KONFIDENZ_MITTEL = 0.4;

export function konfidenzStufe(v: number): KonfidenzStufe {
  return v >= KONFIDENZ_HOCH ? "hoch" : v >= KONFIDENZ_MITTEL ? "mittel" : "niedrig";
}

/** Vier-stufige Anzeige: verifiziert sticht den Score, sonst gilt die KI-Stufe */
export function anzeigeStufe(ev: { confidence: number; verifiziert?: boolean }): AnzeigeStufe {
  return ev.verifiziert ? "verifiziert" : konfidenzStufe(ev.confidence);
}

export const STUFE_FARBE: Record<AnzeigeStufe, string> = {
  niedrig: "#E5484D",
  mittel: "#E7B53C",
  hoch: "#3FB36B",
  verifiziert: "#3FB36B",
};

export function konfidenzFarbe(v: number): string {
  return STUFE_FARBE[konfidenzStufe(v)];
}

/* ── On-Hold: Trend und Highlight (nur Hervorhebung, die KI löst keine Aktion aus) ── */

/** Hervorheben ab dieser Konfidenz ... */
export const HOLD_SCHWELLE = 0.9;
/** ... oder ab diesem Anstieg ... */
export const HOLD_ANSTIEG = 0.2;
/** ... innerhalb dieses Zeitfensters in Minuten */
export const HOLD_ANSTIEG_FENSTER_MIN = 15;

export type TrendRichtung = "steigend" | "fallend" | "stabil";

export function trendRichtung(ev: CwEvent): TrendRichtung {
  if (!ev.hold) return "stabil";
  const delta = ev.confidence - ev.hold.konfidenzVorher;
  if (delta > 0.02) return "steigend";
  if (delta < -0.02) return "fallend";
  return "stabil";
}

/** Grund der Hervorhebung einer On-Hold-Zeile, oder null wenn ruhig */
export function holdHinweis(ev: CwEvent): string | null {
  if (!ev.hold) return null;
  if (ev.confidence >= HOLD_SCHWELLE) return "Schwelle erreicht";
  const anstieg = ev.confidence - ev.hold.konfidenzVorher;
  if (anstieg >= HOLD_ANSTIEG && ev.hold.seitMin <= HOLD_ANSTIEG_FENSTER_MIN) {
    return "Starker Anstieg";
  }
  return null;
}

/* ── Quellen-Statistik (für Subzeilen und "Quellen nach Typ") ── */

export interface QuellenStat {
  social: number;
  wetter: number;
  amtlich: number;
  gesamt: number;
  typen: number;
}

export function quellenStat(ev: CwEvent): QuellenStat {
  const social = ev.belege.social?.posts.length ?? 0;
  const wetter = ev.belege.wetter?.length ?? 0;
  const amtlich = ev.belege.amtlich?.length ?? 0;
  return {
    social,
    wetter,
    amtlich,
    gesamt: social + wetter + amtlich,
    typen: [social, wetter, amtlich].filter((n) => n > 0).length,
  };
}

/* ── Zeit-Formatierung ── */

export function fmtZeit(iso: string): string {
  return `${iso.slice(11, 16)} Uhr`;
}

/** Minuten zwischen zwei ISO-Zeitpunkten (now - dann), nie negativ */
export function minutenSeit(nowIso: string, iso: string): number {
  const diff = Date.parse(nowIso) - Date.parse(iso);
  return Math.max(0, Math.round(diff / 60000));
}

export function fmtVor(min: number): string {
  if (min >= 60) {
    const h = Math.floor(min / 60);
    return `vor ${h} Std ${min % 60} Min`;
  }
  return `vor ${min} Min`;
}

function activityMs(ev: CwEvent): number {
  const raw = ev.lastUpdatedAt ?? ev.wann;
  const t = Date.parse(raw);
  return Number.isFinite(t) ? t : 0;
}

/**
 * Warteschlange sortieren: Events mit neuen Signalen (unread) zuerst,
 * darunter nach Dringlichkeit oder Konfidenz.
 */
export function sortQueue(
  list: CwEvent[],
  by: "urgency" | "confidence",
  unreadByEventId: Record<string, number> = {}
): CwEvent[] {
  return [...list].sort((a, b) => {
    const unreadA = unreadByEventId[a.id] ?? 0;
    const unreadB = unreadByEventId[b.id] ?? 0;

    if (unreadA > 0 && unreadB === 0) return -1;
    if (unreadB > 0 && unreadA === 0) return 1;

    if (unreadA > 0 && unreadB > 0) {
      if (unreadB !== unreadA) return unreadB - unreadA;
      const timeDiff = activityMs(b) - activityMs(a);
      if (timeDiff !== 0) return timeDiff;
    }

    return by === "urgency"
      ? b.urgency - a.urgency || b.confidence - a.confidence
      : b.confidence - a.confidence || b.urgency - a.urgency;
  });
}

export type SignalKind = "social" | "wetter" | "amtlich";

export interface SignalPoint {
  lat: number;
  lon: number;
  kind: SignalKind;
  label: string;
}

/** Alle verorteten Einzelsignale eines Events, für den Cluster-Modus der Karte */
export function signalPoints(ev: CwEvent): SignalPoint[] {
  const pts: SignalPoint[] = [];
  ev.belege.social?.posts.forEach((p) => {
    if (p.lat != null && p.lon != null) {
      pts.push({ lat: p.lat, lon: p.lon, kind: "social", label: `${p.plattform}: ${p.autor}` });
    }
  });
  ev.belege.wetter?.forEach((s) => {
    if (s.lat != null && s.lon != null) {
      pts.push({ lat: s.lat, lon: s.lon, kind: "wetter", label: s.quelle });
    }
  });
  ev.belege.amtlich?.forEach((s) => {
    if (s.lat != null && s.lon != null) {
      pts.push({ lat: s.lat, lon: s.lon, kind: "amtlich", label: s.quelle });
    }
  });
  return pts;
}

/** Anzahl Roh-Signale eines Events (API-Feld oder Belege summiert). */
export function countSignals(ev: CwEvent): number {
  if (ev.signalCount != null && ev.signalCount > 0) return ev.signalCount;
  const social = ev.belege.social?.posts.length ?? 0;
  const wetter = ev.belege.wetter?.length ?? 0;
  const amtlich = ev.belege.amtlich?.length ?? 0;
  const total = social + wetter + amtlich;
  return total > 0 ? total : 1;
}
