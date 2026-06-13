import type { CrisisEventType, DataSourceId } from '../../shared/types/index.js';
import { readCoordinates } from '../normalization/report-location.js';
import type { ScoredReport } from '../normalization/report.types.js';
import { clusteringConfig } from './clustering.config.js';
import type { CrisisEventAggregate } from './correlation.types.js';
import { pickDominantEventType } from './event-type-clusters.js';
import {
  getLocationPrecision,
  getMunicipality,
  type LocationPrecision,
} from './location-similarity.js';

const OFFICIAL_SOURCES = new Set<DataSourceId>(['dwd', 'pegelonline']);
const SENSOR_SOURCES = new Set<DataSourceId>(['firms', 'pegelonline', 'dwd']);

const EVENT_TYPE_LABELS: Partial<Record<CrisisEventType, string>> = {
  fire: 'Fire',
  wildfire: 'Wildfire',
  flood: 'Flood',
  flood_risk: 'Flood risk',
  storm: 'Storm',
  thunderstorm: 'Thunderstorm',
  heavy_rain: 'Heavy rain',
  traffic_accident: 'Traffic accident',
  infrastructure_failure: 'Infrastructure',
  snow_ice: 'Snow / ice',
  heatwave: 'Heatwave',
  fog_event: 'Fog',
  unknown: 'Crisis',
};

const PRECISION_RANK: Record<LocationPrecision, number> = {
  street: 0,
  sensor: 1,
  city: 2,
  district: 3,
  unknown: 4,
};

function uniqueSources(reports: ScoredReport[]): DataSourceId[] {
  return [...new Set(reports.map((r) => r.source))];
}

function sourceCategories(sources: DataSourceId[]): number {
  let cats = 0;
  if (sources.some((s) => OFFICIAL_SOURCES.has(s))) cats++;
  if (sources.some((s) => SENSOR_SOURCES.has(s))) cats++;
  if (sources.some((s) => !OFFICIAL_SOURCES.has(s) && !SENSOR_SOURCES.has(s))) cats++;
  return cats;
}

function pickBestLocation(reports: ScoredReport[]): {
  lat?: number;
  lon?: number;
  label?: string;
  precision: LocationPrecision;
} {
  let best: ScoredReport | undefined;
  let bestRank = PRECISION_RANK.unknown;

  for (const r of reports) {
    const p = getLocationPrecision(r);
    const rank = PRECISION_RANK[p];
    const coords = readCoordinates(r);
    if (rank < bestRank && coords.lat !== undefined && coords.lon !== undefined) {
      bestRank = rank;
      best = r;
    }
  }

  if (best) {
    const coords = readCoordinates(best);
    return {
      lat: coords.lat,
      lon: coords.lon,
      label:
        (best.metadata.locationLabel as string | undefined) ??
        best.location.municipality ??
        best.location.district,
      precision: getLocationPrecision(best),
    };
  }

  const withLabel = reports.find(
    (r) => r.location.municipality || r.metadata.locationLabel
  );
  if (withLabel) {
    return {
      label:
        (withLabel.metadata.locationLabel as string | undefined) ??
        withLabel.location.municipality ??
        withLabel.location.district,
      precision: getLocationPrecision(withLabel),
    };
  }

  return { precision: 'unknown' };
}

function buildTitle(
  eventType: CrisisEventType,
  locationLabel: string | undefined
): string {
  const typeLabel = EVENT_TYPE_LABELS[eventType] ?? 'Crisis';
  if (locationLabel) return `${typeLabel} — ${locationLabel}`;
  return typeLabel;
}

function buildSummary(reports: ScoredReport[]): string {
  const sources = uniqueSources(reports);
  return `${reports.length} signal(s) from ${sources.length} source(s): ${sources.join(', ')}`;
}

/** Event credibility: avg signal trust + multi-category + corroboration from signal count */
function computeCredibilityScore(
  reports: ScoredReport[],
  sources: DataSourceId[]
): number {
  const avgTrust =
    reports.reduce((sum, r) => sum + (r.trust ?? 0), 0) / reports.length;
  const categoryBoost =
    (sourceCategories(sources) - 1) * clusteringConfig.trustBoostPerSourceCategory;
  const signalBoost =
    Math.max(0, reports.length - 1) * clusteringConfig.trustBoostPerSignal;

  return Math.min(1, avgTrust + Math.max(0, categoryBoost) + signalBoost);
}

/** Recompute event rollups from all member reports */
export class EventMergerService {
  createFromReport(report: ScoredReport, eventId: string): CrisisEventAggregate {
    return this.mergeReports(eventId, [report], 'open');
  }

  mergeReports(
    eventId: string,
    reports: ScoredReport[],
    status: CrisisEventAggregate['status'] = 'open'
  ): CrisisEventAggregate {
    const sorted = [...reports].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const eventType = pickDominantEventType(sorted.map((r) => r.eventType));
    const loc = pickBestLocation(sorted);
    const sources = uniqueSources(sorted);

    const maxSeverity = Math.max(...sorted.map((r) => r.severity ?? 0));
    const credibilityScore = computeCredibilityScore(sorted, sources);

    const firstDetectedAt = sorted[0]?.createdAt ?? new Date().toISOString();
    const lastUpdatedAt =
      sorted[sorted.length - 1]?.createdAt ?? new Date().toISOString();

    const locationLabel = loc.label ?? getMunicipality(sorted[0]) ?? undefined;

    return {
      id: eventId,
      title: buildTitle(eventType, locationLabel),
      eventType,
      status,
      latitude: loc.lat,
      longitude: loc.lon,
      locationLabel,
      summary: buildSummary(sorted),
      firstDetectedAt,
      lastUpdatedAt,
      credibilityScore,
      severityScore: maxSeverity,
      sourceCount: sources.length,
      reportIds: sorted.map((r) => r.id),
      precision: loc.precision,
      location: sorted[0]?.location,
    };
  }

  toSnapshot(event: CrisisEventAggregate) {
    return {
      id: event.id,
      eventType: event.eventType,
      latitude: event.latitude,
      longitude: event.longitude,
      locationLabel: event.locationLabel,
      lastUpdatedAt: event.lastUpdatedAt,
      precision: event.precision,
      location: event.location,
    };
  }
}

export const eventMergerService = new EventMergerService();
