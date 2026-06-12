import type { CrisisEventType } from '../../shared/types/index.js';
import type { ScoredReport } from '../normalization/report.types.js';
import { clusteringConfig } from './clustering.config.js';
import type { CrisisEventSnapshot, SimilarityBreakdown } from './correlation.types.js';
import {
  areEventTypesCompatible,
  maxWindowHoursForType,
  typeSimilarityScore,
} from './event-type-clusters.js';
import {
  computeGeoScore,
  getMunicipality,
  passesLocationGate,
} from './location-similarity.js';

function hoursApart(a: string, b: string): number {
  return Math.abs(new Date(a).getTime() - new Date(b).getTime()) / 3_600_000;
}

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^\p{L}\p{N}]+/u)
      .map((t) => t.trim())
      .filter((t) => t.length > 2)
  );
}

/** Jaccard similarity on keywords + municipality tokens */
export function textSimilarity(
  report: ScoredReport,
  eventLabel: string | undefined,
  memberKeywords: string[] = []
): number {
  const a = new Set<string>([
    ...report.keywords.map((k) => k.toLowerCase()),
    ...tokenize(report.rawText),
  ]);

  const muni = getMunicipality(report);
  if (muni) a.add(muni);

  const b = new Set<string>([
    ...memberKeywords.map((k) => k.toLowerCase()),
    ...tokenize(eventLabel ?? ''),
  ]);

  if (a.size === 0 || b.size === 0) return 0;

  let intersection = 0;
  for (const t of a) {
    if (b.has(t)) intersection++;
  }

  const union = a.size + b.size - intersection;
  return union > 0 ? intersection / union : 0;
}

export function computeTimeScore(
  report: ScoredReport,
  event: CrisisEventSnapshot
): number {
  const maxWindow = maxWindowHoursForType(report.eventType);
  const apart = hoursApart(report.createdAt, event.lastUpdatedAt);
  if (apart > maxWindow) return 0;
  return Math.max(0, 1 - apart / maxWindow);
}

function passesHardGates(
  report: ScoredReport,
  event: CrisisEventSnapshot
): boolean {
  const reportType = report.eventType;
  const eventType = event.eventType;

  if (reportType !== 'unknown' && eventType !== 'unknown') {
    if (!areEventTypesCompatible(reportType, eventType)) return false;
  }

  const maxWindow = Math.max(
    maxWindowHoursForType(reportType),
    maxWindowHoursForType(eventType)
  );
  if (hoursApart(report.createdAt, event.lastUpdatedAt) > maxWindow) {
    return false;
  }

  if (!passesLocationGate(report, event)) return false;

  return true;
}

export function computeSimilarity(
  report: ScoredReport,
  event: CrisisEventSnapshot,
  memberKeywords: string[] = []
): SimilarityBreakdown {
  const gates = passesHardGates(report, event);
  if (!gates) {
    return { total: 0, geo: 0, time: 0, type: 0, text: 0, passesHardGates: false };
  }

  const geo = computeGeoScore(report, event);
  const time = computeTimeScore(report, event);
  const type = typeSimilarityScore(report.eventType, event.eventType);
  const text = textSimilarity(report, event.locationLabel, memberKeywords);

  const cfg = clusteringConfig;
  const total = Math.min(
    1,
    Math.max(
      0,
      cfg.weightGeo * geo +
        cfg.weightTime * time +
        cfg.weightType * type +
        cfg.weightText * text
    )
  );

  return { total, geo, time, type, text, passesHardGates: true };
}

export function eventTypeForClustering(type: CrisisEventType): CrisisEventType {
  return type;
}
