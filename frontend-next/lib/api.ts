/**
 * Adapter: crisis-monitor Backend (GET /api/events) -> unser Event-Modell.
 *
 * Trennung: dieses Modul kapselt Netzwerk und Mapping-Logik. Darstellung bleibt
 * in den Komponenten. Schwellen und Quellen-Gruppen stehen als benannte
 * Konstanten oben, damit die Regeln an einer Stelle sichtbar sind.
 *
 * Phase 1 des Backend-Plans (docs/backend-integration-plan.md): das Backend
 * liefert flache Einzel-Reports, kein Clustering. Wir mappen V1 erst ein Report
 * = ein Event und bilden dann naive Cluster nach Ort, Ereignistyp und
 * Zeitfenster. Titel, Zusammenfassung und Urteil entstehen nur minimal aus
 * vorhandenen Feldern. Die richtige Synthese (inkl. Fake-Verdacht) gehoert
 * spaeter ins Backend.
 */

import type {
  AmtlichesSignal,
  Event as CwEvent,
  EventType,
  SocialPost,
  SocialSynthese,
  Urgency,
  UrteilsDaten,
  WetterSignal,
} from "./types";

/* ── Backend-Schnittstelle (Form aus crisis-monitor report.types.ts) ──────── */

export type BackendSource =
  | "mastodon"
  | "bluesky"
  | "dwd"
  | "pegelonline"
  | "firms"
  | "hvz"
  | "police"
  | "news";

export type BackendEventType =
  | "flood"
  | "fire"
  | "wildfire"
  | "traffic_accident"
  | "infrastructure_failure"
  | "thunderstorm"
  | "storm"
  | "heavy_rain"
  | "flood_risk"
  | "snow_ice"
  | "heatwave"
  | "fog_event"
  | "unknown";

export interface BackendLocation {
  lat?: number;
  lon?: number;
  municipality?: string;
  district?: string;
  state?: string;
}

/** Ein einzelnes Roh-Signal aus /api/events (IngestedReport plus Scores). */
export interface BackendReport {
  id: string;
  source: BackendSource;
  sourceId: string;
  rawText: string;
  url: string;
  author: string;
  createdAt: string;
  ingestedAt: string;
  keywords: string[];
  eventType: BackendEventType;
  mediaUrls: string[];
  metadata: Record<string, unknown>;
  location?: BackendLocation;
  /** In-Memory-Modus liefert trust/severity, DB-Modus credibilityScore/severityScore */
  trust?: number;
  severity?: number;
  credibilityScore?: number;
  severityScore?: number;
}

export interface BackendEventsResponse {
  count: number;
  reports: BackendReport[];
}

/* ── Konfiguration und Schwellen (benannte Konstanten, keine Magie im Code) ── */

/** Basis-URL des Backends. Default deckt den lokalen dev-Port 3001 ab. */
export const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3001"
).replace(/\/+$/, "");

/** Ab diesem trust gilt eine amtliche Quelle als "verifiziert" (amtlich bestaetigt). */
export const VERIFIZIERT_TRUST_SCHWELLE = 0.85;

/** Quellen, deren amtliche Bestaetigung den Status "verifiziert" tragen kann. */
export const AMTLICHE_VERIFIZIERER: readonly BackendSource[] = [
  "dwd",
  "pegelonline",
  "hvz",
  "police",
  "firms",
];

/** Fallback-Konfidenz, wenn weder Score noch Basistrust bekannt ist (neutral). */
export const DEFAULT_CONFIDENCE = 0.5;

/** Zeitfenster fuer das naive Client-Clustering (gleicher Ort plus gleicher Typ). */
export const CLUSTER_ZEITFENSTER_MIN = 90;

/** Fallback-Mittelpunkt (Baden-Wuerttemberg), nur wenn ein Report keine Koordinaten hat. */
export const BW_CENTER = { lat: 48.6616, lon: 9.3501 };

/* ── Mapping-Tabellen ─────────────────────────────────────────────────────── */

const EVENT_TYPE_MAP: Record<BackendEventType, EventType> = {
  flood: "Hochwasser",
  flood_risk: "Hochwasser",
  heavy_rain: "Starkregen",
  fire: "Brand",
  wildfire: "Brand",
  traffic_accident: "Verkehrsunfall",
  infrastructure_failure: "Infrastrukturausfall",
  storm: "Sturm",
  thunderstorm: "Sturm",
  snow_ice: "Sonstiges",
  heatwave: "Sonstiges",
  fog_event: "Sonstiges",
  unknown: "Sonstiges",
};

type BelegGruppe = "social" | "wetter" | "amtlich";

/** Belege-Gruppe je Quelle (social / wetter / amtlich) gemaess Plan-Tabelle. */
const BELEG_GRUPPE: Record<BackendSource, BelegGruppe> = {
  bluesky: "social",
  mastodon: "social",
  dwd: "wetter",
  pegelonline: "wetter",
  hvz: "wetter",
  police: "amtlich",
  news: "amtlich",
  firms: "amtlich",
};

const SOCIAL_PLATTFORM: Partial<Record<BackendSource, SocialPost["plattform"]>> = {
  bluesky: "BlueSky",
  mastodon: "Mastodon",
};

const WETTER_QUELLE: Partial<Record<BackendSource, WetterSignal["quelle"]>> = {
  dwd: "DWD",
  pegelonline: "PEGELONLINE",
  hvz: "HVZ",
};

const AMTLICH_QUELLE: Partial<Record<BackendSource, AmtlichesSignal["quelle"]>> = {
  police: "Polizei",
  news: "Nachrichten",
  firms: "NASA FIRMS",
};

/* ── kleine reine Helfer ──────────────────────────────────────────────────── */

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function numMeta(report: BackendReport, key: string): number | undefined {
  const v = report.metadata?.[key];
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

/** Konfidenz eines Reports: credibilityScore vor trust vor Metadaten vor Default. */
export function reportTrust(report: BackendReport): number {
  const raw =
    report.credibilityScore ?? report.trust ?? numMeta(report, "trust") ?? DEFAULT_CONFIDENCE;
  return clamp01(raw);
}

/** Severity eines Reports (0..1), Default 0 wenn nichts bekannt ist. */
export function reportSeverity(report: BackendReport): number {
  const raw = report.severityScore ?? report.severity ?? numMeta(report, "severity") ?? 0;
  return clamp01(raw);
}

function reportLat(report: BackendReport): number | undefined {
  return report.location?.lat ?? numMeta(report, "latitude");
}

function reportLon(report: BackendReport): number | undefined {
  return report.location?.lon ?? numMeta(report, "longitude");
}

function reportOrt(report: BackendReport): string {
  const loc = report.location;
  return (
    loc?.municipality?.trim() ||
    loc?.district?.trim() ||
    loc?.state?.trim() ||
    "Ort unbekannt"
  );
}

function eventTypeDe(report: BackendReport): EventType {
  return EVENT_TYPE_MAP[report.eventType] ?? "Sonstiges";
}

/* ── Beleg-Mapper (Report -> unsere Beleg-Strukturen) ─────────────────────── */

function toSocialPost(report: BackendReport): SocialPost {
  return {
    id: report.id,
    plattform: SOCIAL_PLATTFORM[report.source] ?? "BlueSky",
    autor: report.author?.trim() || "Unbekannt",
    text: report.rawText,
    zeit: report.createdAt,
    url: report.url || undefined,
    bild: report.mediaUrls?.[0],
    plausibilitaet: reportTrust(report),
    lat: reportLat(report),
    lon: reportLon(report),
  };
}

function toWetterSignal(report: BackendReport): WetterSignal {
  return {
    quelle: WETTER_QUELLE[report.source] ?? "DWD",
    text: report.rawText,
    zeit: report.createdAt,
    plausibilitaet: reportTrust(report),
    lat: reportLat(report),
    lon: reportLon(report),
  };
}

function toAmtlichesSignal(report: BackendReport): AmtlichesSignal {
  return {
    quelle: AMTLICH_QUELLE[report.source] ?? "Polizei",
    text: report.rawText,
    zeit: report.createdAt,
    plausibilitaet: reportTrust(report),
    lat: reportLat(report),
    lon: reportLon(report),
  };
}

function socialSynthese(posts: SocialPost[]): SocialSynthese {
  const plattformen = [...new Set(posts.map((p) => p.plattform))].join(", ");
  const n = posts.length;
  return {
    // V1: faktische Sammelzeile, keine erfundene Synthese. Echte Verdichtung
    // (KI-Summary) kommt spaeter aus dem Backend.
    zusammenfassung: `${n} Social-Media-Beitrag${n === 1 ? "" : "e"} (${plattformen}). Wortlaut siehe Einzelposts.`,
    posts,
  };
}

function buildBelege(reports: BackendReport[]): CwEvent["belege"] {
  const social: SocialPost[] = [];
  const wetter: WetterSignal[] = [];
  const amtlich: AmtlichesSignal[] = [];

  for (const r of reports) {
    const gruppe = BELEG_GRUPPE[r.source] ?? "amtlich";
    if (gruppe === "social") social.push(toSocialPost(r));
    else if (gruppe === "wetter") wetter.push(toWetterSignal(r));
    else amtlich.push(toAmtlichesSignal(r));
  }

  return {
    social: social.length ? socialSynthese(social) : undefined,
    wetter: wetter.length ? wetter : undefined,
    amtlich: amtlich.length ? amtlich : undefined,
  };
}

/* ── Aggregation ueber ein Cluster ────────────────────────────────────────── */

function centroid(reports: BackendReport[]): { lat: number; lon: number } {
  const pts = reports
    .map((r) => ({ lat: reportLat(r), lon: reportLon(r) }))
    .filter((p): p is { lat: number; lon: number } => p.lat != null && p.lon != null);
  if (pts.length === 0) return { ...BW_CENTER };
  const lat = pts.reduce((s, p) => s + p.lat, 0) / pts.length;
  const lon = pts.reduce((s, p) => s + p.lon, 0) / pts.length;
  return { lat, lon };
}

function istVerifiziert(reports: BackendReport[]): boolean {
  return reports.some(
    (r) => AMTLICHE_VERIFIZIERER.includes(r.source) && reportTrust(r) >= VERIFIZIERT_TRUST_SCHWELLE
  );
}

function quellentypZahl(belege: CwEvent["belege"]): number {
  return [belege.social, belege.wetter, belege.amtlich].filter(Boolean).length;
}

function buildUrteil(
  reports: BackendReport[],
  ort: string,
  typeDe: EventType,
  verifiziert: boolean,
  belege: CwEvent["belege"]
): UrteilsDaten {
  const typen = quellentypZahl(belege);
  return {
    glaubwuerdig: [
      {
        label: `${typen} unabhaengige Quellentyp${typen === 1 ? "" : "en"}`,
        status: typen >= 2 ? "erfuellt" : "offen",
      },
      {
        label: "Amtliche Bestaetigung",
        status: verifiziert ? "erfuellt" : "offen",
      },
    ],
    wo: ort,
    nochAktiv: true,
    was: typeDe,
  };
}

/** Reine Synthese-Funktion: eine Gruppe von Reports -> ein Event. */
function buildEvent(reports: BackendReport[], idHint: string): CwEvent {
  const sorted = [...reports].sort(
    (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)
  );
  const first = sorted[0];

  // Ereignistyp: dominanter de-Typ im Cluster, ungleich Sonstiges bevorzugt.
  const typen = sorted.map(eventTypeDe);
  const typeDe =
    typen.find((t) => t !== "Sonstiges") ?? typen[0] ?? "Sonstiges";

  // Ort: erster Report mit echtem Label, sonst Fallback.
  const ort =
    sorted.map(reportOrt).find((o) => o !== "Ort unbekannt") ?? "Ort unbekannt";

  const belege = buildBelege(sorted);
  const confidence = Math.max(...sorted.map(reportTrust));
  const severity = Math.max(...sorted.map(reportSeverity));
  const urgency = Math.max(1, Math.ceil(severity * 5)) as Urgency;
  const verifiziert = istVerifiziert(sorted);
  const { lat, lon } = centroid(sorted);
  const n = sorted.length;
  const typenZahl = quellentypZahl(belege);

  const titel = ort === "Ort unbekannt" ? `${typeDe} (Ort unbekannt)` : `${typeDe} bei ${ort}`;

  const zusammenfassung =
    `${n} Roh-Signal${n === 1 ? "" : "e"} aus ${typenZahl} Quellentyp${typenZahl === 1 ? "" : "en"}` +
    ` zu ${typeDe} im Raum ${ort}.` +
    (verifiziert ? " Mindestens eine amtliche Quelle bestaetigt." : " Noch keine amtliche Bestaetigung.");

  return {
    id: idHint,
    titel,
    eventType: typeDe,
    ort,
    lat,
    lon,
    wann: first.createdAt,
    urgency,
    confidence,
    verifiziert,
    zusammenfassung,
    einschaetzung: typeDe,
    warum:
      `${n} Signal${n === 1 ? "" : "e"}, ${typenZahl} Quellentyp${typenZahl === 1 ? "" : "en"}` +
      (verifiziert ? ", amtlich bestaetigt" : ""),
    urteil: buildUrteil(sorted, ort, typeDe, verifiziert, belege),
    belege,
    status: "neu",
  };
}

/* ── Oeffentliche reine Funktionen ────────────────────────────────────────── */

/** V1: ein Report -> ein Event. Beweist die Pipe ohne Clustering. */
export function mapReportToEvent(report: BackendReport): CwEvent {
  return buildEvent([report], `cm-${report.id}`);
}

/**
 * Naives Client-Clustering als Uebergang (Phase 1). Gruppiert Reports nach
 * Ort plus Ereignistyp plus Zeitfenster. Das richtige Clustering gehoert ins
 * Backend (Phase 2) und loest diese Funktion dann ab.
 */
export function clusterReports(reports: BackendReport[]): CwEvent[] {
  const fensterMs = CLUSTER_ZEITFENSTER_MIN * 60_000;
  const gruppen = new Map<string, BackendReport[]>();

  for (const r of reports) {
    const ort = reportOrt(r);
    const typ = eventTypeDe(r);
    const t = Date.parse(r.createdAt);
    const bucket = Number.isFinite(t) ? Math.floor(t / fensterMs) : 0;
    const key = `${ort}|${typ}|${bucket}`;
    const liste = gruppen.get(key);
    if (liste) liste.push(r);
    else gruppen.set(key, [r]);
  }

  const events: CwEvent[] = [];
  for (const [key, liste] of gruppen) {
    const fruehest = [...liste].sort(
      (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)
    )[0];
    events.push(buildEvent(liste, `cm-cluster-${fruehest.id}`));
  }
  return events;
}

/* ── Netzwerk ─────────────────────────────────────────────────────────────── */

/**
 * Laedt echte Reports von GET {API_BASE}/api/events und mappt sie auf unser
 * Event-Modell (mit naivem Clustering). Wirft bei Netzwerk- oder Formfehlern,
 * damit die aufrufende Seite auf die Mock-Daten zuruecksetzen kann.
 */
export async function fetchEvents(signal?: AbortSignal): Promise<CwEvent[]> {
  const res = await fetch(`${API_BASE}/api/events`, { signal, cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Backend antwortete mit ${res.status}`);
  }
  const data = (await res.json()) as Partial<BackendEventsResponse>;
  if (!data || !Array.isArray(data.reports)) {
    throw new Error("Unerwartete Antwortform von /api/events");
  }
  return clusterReports(data.reports);
}
