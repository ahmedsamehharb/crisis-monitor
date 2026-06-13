import type { DataSourceId } from '../../shared/types/index.js';
import type { IngestedReport } from '../normalization/report.types.js';
import type { LocationQuality } from './scoring.types.js';

const SOURCE_BASE_TRUST: Record<DataSourceId, number> = {
  dwd: 0.95,
  pegelonline: 0.9,
  firms: 0.85,
  bluesky: 0.1,
  mastodon: 0.1,
  hvz: 0.85,
  police: 0.9,
  news: 0.75,
};

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

function locationQuality(report: IngestedReport): LocationQuality {
  const loc = report.location;
  if (loc?.lat !== undefined && loc?.lon !== undefined) return 'coordinates';
  if (loc?.municipality || loc?.district) return 'municipality';
  return 'none';
}

function freshnessModifier(createdAt: string, now = Date.now()): number {
  const ageMs = now - new Date(createdAt).getTime();
  if (Number.isNaN(ageMs) || ageMs < 0) return 0;

  const hours = ageMs / (1000 * 60 * 60);
  if (hours < 1) return 0.05;
  if (hours < 6) return 0.02;
  if (hours > 24) return -0.1;
  return 0;
}

function locationModifier(quality: LocationQuality): number {
  switch (quality) {
    case 'coordinates':
      return 0.05;
    case 'municipality':
      return 0.03;
    case 'none':
      return -0.1;
  }
}

export class CredibilityService {
  score(report: IngestedReport): number {
    const base = SOURCE_BASE_TRUST[report.source] ?? 0.5;
    const locMod = locationModifier(locationQuality(report));
    const freshMod = freshnessModifier(report.createdAt);

    return clamp(base + locMod + freshMod);
  }
}

export const credibilityService = new CredibilityService();
