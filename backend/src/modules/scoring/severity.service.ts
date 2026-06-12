import type { CrisisEventType, DataSourceId } from '../../shared/types/index.js';
import type { IngestedReport } from '../normalization/report.types.js';

const EVENT_BASE_SEVERITY: Partial<Record<CrisisEventType, number>> = {
  wildfire: 0.8,
  flood: 0.9,
  flood_risk: 0.9,
  heavy_rain: 0.85,
  storm: 0.7,
  thunderstorm: 0.65,
  heatwave: 0.6,
  snow_ice: 0.5,
  fire: 0.75,
  fog_event: 0.45,
  traffic_accident: 0.55,
  infrastructure_failure: 0.6,
  unknown: 0.4,
};

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

function num(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return undefined;
}

function baseSeverity(eventType: CrisisEventType): number {
  return EVENT_BASE_SEVERITY[eventType] ?? 0.4;
}

function dwdAdjustment(report: IngestedReport): number {
  const level = num(report.metadata.severityLevel);
  if (level === undefined) {
    const normalized = num(report.metadata.severity);
    if (normalized !== undefined) return normalized * 0.15;
    return 0;
  }
  return (level / 4) * 0.2;
}

function pegelAdjustment(report: IngestedReport): number {
  const severity = report.metadata.severity;
  if (severity === 'critical') return 0.25;

  const level = num(report.metadata.waterLevelCm);
  const threshold = num(report.metadata.thresholdCm);
  if (level !== undefined && threshold !== undefined && threshold > 0) {
    const ratio = level / threshold;
    if (ratio >= 1) return 0.25;
    if (ratio >= 0.9) return 0.12;
  }

  if (severity === 'warning') return 0.1;
  return 0;
}

function firmsAdjustment(report: IngestedReport): number {
  const percent = num(report.metadata.confidencePercent);
  if (percent !== undefined) {
    if (percent > 80) return 0.15;
    if (percent >= 50) return 0.08;
    return 0;
  }

  const confidence = num(report.metadata.confidence);
  if (confidence !== undefined && confidence >= 0.8) return 0.12;
  return 0;
}

function sourceAdjustment(report: IngestedReport): number {
  const source: DataSourceId = report.source;

  switch (source) {
    case 'dwd':
      return dwdAdjustment(report);
    case 'pegelonline':
      return pegelAdjustment(report);
    case 'firms':
      return firmsAdjustment(report);
    case 'bluesky':
    case 'mastodon':
      return 0;
    default:
      return 0;
  }
}

export class SeverityService {
  score(report: IngestedReport): number {
    const base = baseSeverity(report.eventType);
    const adjustment = sourceAdjustment(report);
    return clamp(base + adjustment);
  }
}

export const severityService = new SeverityService();
