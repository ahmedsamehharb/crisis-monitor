/**
 * Adapter: crisis-monitor Backend → unser Event-Modell.
 *
 * Phase 2: GET /api/events liefert serverseitig geclusterte CrisisEvents.
 * GET /api/events/:id liefert alle Roh-Signale (signals[]) zur Verifikation.
 * Legacy-Fallback: flache Reports unter GET /api/reports + Client-Clustering.
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

/* ── Backend-Schnittstelle ───────────────────────────────────────────────── */

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
  trust?: number;
  severity?: number;
  credibilityScore?: number;
  severityScore?: number;
}

/** Geclustertes Ereignis aus GET /api/events */
export interface BackendCrisisEvent {
  id: string;
  title: string;
  eventType: BackendEventType;
  status: "open" | "monitoring" | "resolved";
  latitude?: number;
  longitude?: number;
  locationLabel?: string;
  summary?: string;
  firstDetectedAt: string;
  lastUpdatedAt: string;
  credibilityScore: number;
  severityScore: number;
  sourceCount: number;
  reportIds: string[];
}

export interface BackendEventsListResponse {
  count: number;
  events: BackendCrisisEvent[];
}

export interface BackendEventDetailResponse {
  event: BackendCrisisEvent;
  signals: BackendReport[];
  sourceBreakdown: { source: string; count: number }[];
}

export interface BackendReportsResponse {
  count: number;
  reports: BackendReport[];
}

/* ── Konfiguration ───────────────────────────────────────────────────────── */

export const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3001"
).replace(/\/+$/, "");

export const VERIFIZIERT_TRUST_SCHWELLE = 0.85;

export const AMTLICHE_VERIFIZIERER: readonly BackendSource[] = [
  "dwd",
  "pegelonline",
  "hvz",
  "police",
  "firms",
];

export const DEFAULT_CONFIDENCE = 0.5;
export const CLUSTER_ZEITFENSTER_MIN = 90;
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

/* ── Helfer ───────────────────────────────────────────────────────────────── */

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function numMeta(report: BackendReport, key: string): number | undefined {
  const v = report.metadata?.[key];
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

export function reportTrust(report: BackendReport): number {
  const raw =
    report.credibilityScore ?? report.trust ?? numMeta(report, "trust") ?? DEFAULT_CONFIDENCE;
  return clamp01(raw);
}

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

function eventTypeDeFromBackend(type: BackendEventType): EventType {
  return EVENT_TYPE_MAP[type] ?? "Sonstiges";
}

function eventTypeDe(report: BackendReport): EventType {
  return eventTypeDeFromBackend(report.eventType);
}

function ortFromCluster(cluster: BackendCrisisEvent): string {
  const label = cluster.locationLabel?.trim();
  if (label) return label.split(",")[0].trim();
  return "Ort unbekannt";
}

function titelFromCluster(cluster: BackendCrisisEvent): string {
  const typeDe = eventTypeDeFromBackend(cluster.eventType);
  const ort = ortFromCluster(cluster);
  if (ort === "Ort unbekannt") return typeDe;
  return `${typeDe} bei ${ort}`;
}

/* ── Beleg-Mapper ─────────────────────────────────────────────────────────── */

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

function centroid(reports: BackendReport[]): { lat: number; lon: number } {
  const pts = reports
    .map((r) => ({ lat: reportLat(r), lon: reportLon(r) }))
    .filter((p): p is { lat: number; lon: number } => p.lat != null && p.lon != null);
  if (pts.length === 0) return { ...BW_CENTER };
  return {
    lat: pts.reduce((s, p) => s + p.lat, 0) / pts.length,
    lon: pts.reduce((s, p) => s + p.lon, 0) / pts.length,
  };
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

function severityToUrgency(severity: number): Urgency {
  return Math.max(1, Math.ceil(clamp01(severity) * 5)) as Urgency;
}

/** Roh-Signale → ein UI-Event (Belege, Urteil, Karte). */
function buildEventFromSignals(
  reports: BackendReport[],
  id: string,
  rollup?: Partial<BackendCrisisEvent>
): CwEvent {
  const sorted = [...reports].sort(
    (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)
  );
  const first = sorted[0];

  const typen = sorted.map(eventTypeDe);
  const typeDe =
    (rollup?.eventType ? eventTypeDeFromBackend(rollup.eventType) : undefined) ??
    typen.find((t) => t !== "Sonstiges") ??
    typen[0] ??
    "Sonstiges";

  const ort =
    rollup?.locationLabel?.split(",")[0]?.trim() ??
    sorted.map(reportOrt).find((o) => o !== "Ort unbekannt") ??
    "Ort unbekannt";

  const belege = buildBelege(sorted);
  const confidence = rollup?.credibilityScore ?? Math.max(...sorted.map(reportTrust), 0);
  const severity = rollup?.severityScore ?? Math.max(...sorted.map(reportSeverity), 0);
  const urgency = severityToUrgency(severity);
  const verifiziert = istVerifiziert(sorted);
  const { lat, lon } =
    rollup?.latitude != null && rollup?.longitude != null
      ? { lat: rollup.latitude, lon: rollup.longitude }
      : centroid(sorted);
  const n = sorted.length;
  const typenZahl = quellentypZahl(belege);

  const titel = titelFromCluster({
    id,
    title: rollup?.title ?? "",
    eventType: rollup?.eventType ?? sorted[0]?.eventType ?? "unknown",
    status: "open",
    locationLabel: rollup?.locationLabel ?? ort,
    firstDetectedAt: first?.createdAt ?? new Date().toISOString(),
    lastUpdatedAt: first?.createdAt ?? new Date().toISOString(),
    credibilityScore: confidence,
    severityScore: severity,
    sourceCount: rollup?.sourceCount ?? new Set(sorted.map((r) => r.source)).size,
    reportIds: sorted.map((r) => r.id),
  });

  const zusammenfassung =
    rollup?.summary ??
    `${n} Signal${n === 1 ? "" : "e"} aus ${typenZahl} Quellentyp${typenZahl === 1 ? "" : "en"}` +
      ` zu ${typeDe} im Raum ${ort}.` +
      (verifiziert ? " Mindestens eine amtliche Quelle bestaetigt." : " Noch keine amtliche Bestaetigung.");

  return {
    id,
    titel,
    eventType: typeDe,
    ort,
    lat,
    lon,
    wann: rollup?.firstDetectedAt ?? first?.createdAt ?? new Date().toISOString(),
    urgency,
    confidence: clamp01(confidence),
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

/** Server-Cluster + optionale Signale → UI-Event. */
export function mapCrisisEventToEvent(
  cluster: BackendCrisisEvent,
  signals: BackendReport[] = []
): CwEvent {
  if (signals.length > 0) {
    return buildEventFromSignals(signals, cluster.id, cluster);
  }

  const typeDe = eventTypeDeFromBackend(cluster.eventType);
  const ort = ortFromCluster(cluster);

  return {
    id: cluster.id,
    titel: titelFromCluster(cluster),
    eventType: typeDe,
    ort,
    lat: cluster.latitude ?? BW_CENTER.lat,
    lon: cluster.longitude ?? BW_CENTER.lon,
    wann: cluster.firstDetectedAt,
    urgency: severityToUrgency(cluster.severityScore),
    confidence: clamp01(cluster.credibilityScore),
    verifiziert: cluster.credibilityScore >= VERIFIZIERT_TRUST_SCHWELLE,
    zusammenfassung:
      cluster.summary ??
      `${cluster.reportIds.length} Signal(e) aus ${cluster.sourceCount} Quelle(n).`,
    einschaetzung: typeDe,
    warum: `${cluster.reportIds.length} Signale, ${cluster.sourceCount} Quellen`,
    urteil: {
      glaubwuerdig: [
        {
          label: `${cluster.sourceCount} Quelle(n)`,
          status: cluster.sourceCount >= 2 ? "erfuellt" : "offen",
        },
        { label: "Amtliche Bestaetigung", status: "offen" },
      ],
      wo: ort,
      nochAktiv: true,
      was: typeDe,
    },
    belege: {},
    status: "neu",
  };
}

export function mapReportToEvent(report: BackendReport): CwEvent {
  return buildEventFromSignals([report], `cm-${report.id}`);
}

/** Legacy: Client-Clustering fuer flache /api/reports-Liste. */
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
  for (const [, liste] of gruppen) {
    const fruehest = [...liste].sort(
      (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)
    )[0];
    events.push(buildEventFromSignals(liste, `cm-cluster-${fruehest.id}`));
  }
  return events;
}

/* ── Netzwerk ─────────────────────────────────────────────────────────────── */

async function fetchEventDetailRaw(
  id: string,
  signal?: AbortSignal
): Promise<BackendEventDetailResponse | null> {
  const res = await fetch(`${API_BASE}/api/events/${encodeURIComponent(id)}`, {
    signal,
    cache: "no-store",
  });
  if (!res.ok) return null;
  return (await res.json()) as BackendEventDetailResponse;
}

/** Einzelnes geclustertes Ereignis inkl. aller Signale. */
export async function fetchEventDetail(
  id: string,
  signal?: AbortSignal
): Promise<CwEvent | null> {
  const detail = await fetchEventDetailRaw(id, signal);
  if (!detail?.event) return null;
  return mapCrisisEventToEvent(detail.event, detail.signals ?? []);
}

/**
 * Laedt geclusterte CrisisEvents vom Backend (Phase 2).
 * Pro Event werden Signale nachgeladen, damit Belege in der Detailansicht stehen.
 */
export async function fetchEvents(signal?: AbortSignal): Promise<CwEvent[]> {
  const res = await fetch(`${API_BASE}/api/events?limit=50`, {
    signal,
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Backend antwortete mit ${res.status}`);
  }

  const data = (await res.json()) as Partial<
    BackendEventsListResponse & BackendReportsResponse
  >;

  if (data && Array.isArray(data.events)) {
    const clusters = data.events;
    if (clusters.length === 0) return [];

    const details = await Promise.all(
      clusters.map((c) => fetchEventDetailRaw(c.id, signal))
    );

    return clusters.map((cluster, i) => {
      const detail = details[i];
      return mapCrisisEventToEvent(cluster, detail?.signals ?? []);
    });
  }

  if (data && Array.isArray(data.reports)) {
    return clusterReports(data.reports);
  }

  const reportsRes = await fetch(`${API_BASE}/api/reports?limit=50`, {
    signal,
    cache: "no-store",
  });
  if (reportsRes.ok) {
    const reportsData = (await reportsRes.json()) as Partial<BackendReportsResponse>;
    if (Array.isArray(reportsData.reports)) {
      return clusterReports(reportsData.reports);
    }
  }

  throw new Error("Unerwartete Antwortform von /api/events");
}

/** Optional: Quellen-Adapter des Backends */
export async function fetchSources(signal?: AbortSignal): Promise<{ id: string; label: string }[]> {
  const res = await fetch(`${API_BASE}/api/sources`, { signal, cache: "no-store" });
  if (!res.ok) return [];
  const data = (await res.json()) as { sources?: { id: string; label: string }[] };
  return data.sources ?? [];
}

/** Health-Check */
export async function fetchHealth(signal?: AbortSignal): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/health`, { signal, cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}
