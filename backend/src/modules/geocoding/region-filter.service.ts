import { BW_CITIES } from './bw-cities.js';
import type { IngestedReport, ReportLocation } from '../normalization/report.types.js';

/** Approximate bounding box for Baden-Württemberg. */
const BW_BBOX = {
  minLat: 47.53,
  maxLat: 49.79,
  minLon: 7.51,
  maxLon: 10.5,
};

const BW_STATE_NAMES = [
  'baden-württemberg',
  'baden-wuerttemberg',
  'baden württemberg',
  'baden wuerttemberg',
  'bw',
];

const OTHER_GERMAN_STATES = [
  'bayern',
  'bavaria',
  'hessen',
  'rheinland-pfalz',
  'nordrhein-westfalen',
  'nrw',
  'saarland',
  'schleswig-holstein',
  'niedersachsen',
  'sachsen',
  'thüringen',
  'brandenburg',
  'mecklenburg',
  'berlin',
  'hamburg',
  'bremen',
];

const BW_CITY_SET = new Set(BW_CITIES.map((c) => c.toLowerCase()));

function num(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return undefined;
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function isBwStateName(value: string | undefined): boolean {
  if (!value) return false;
  const n = normalizeText(value);
  return BW_STATE_NAMES.some((name) => n === name || n.includes('baden-württemberg') || n.includes('baden-wuerttemberg'));
}

function isInBwBbox(lat: number, lon: number): boolean {
  return (
    lat >= BW_BBOX.minLat &&
    lat <= BW_BBOX.maxLat &&
    lon >= BW_BBOX.minLon &&
    lon <= BW_BBOX.maxLon
  );
}

function isBwCity(name: string | undefined): boolean {
  if (!name) return false;
  return BW_CITY_SET.has(name.trim().toLowerCase());
}

function mentionsOtherGermanState(text: string): boolean {
  const n = normalizeText(text);
  return OTHER_GERMAN_STATES.some((state) => n.includes(state));
}

function resolveLocation(report: IngestedReport): ReportLocation {
  const meta = report.metadata;
  const metaLoc = meta.location as ReportLocation | { lat?: number; lon?: number; region?: string; state?: string; stateShort?: string } | undefined;

  const lat =
    report.location?.lat ??
    num(meta.latitude) ??
    num(meta.lat) ??
    num(metaLoc?.lat);
  const lon =
    report.location?.lon ??
    num(meta.longitude) ??
    num(meta.lon) ??
    num((metaLoc as { lon?: number })?.lon);

  return {
    lat,
    lon,
    municipality: report.location?.municipality,
    district: report.location?.district,
    state:
      report.location?.state ??
      (metaLoc as { state?: string })?.state ??
      str(meta.state),
  };
}

function str(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const t = value.trim();
  return t.length > 0 ? t : undefined;
}

function locationFromMetadata(report: IngestedReport): {
  stateShort?: string;
  region?: string;
  areaDesc?: string;
} {
  const meta = report.metadata;
  const metaLoc = meta.location as Record<string, unknown> | undefined;

  return {
    stateShort: str(metaLoc?.stateShort),
    region: str(metaLoc?.region) ?? str(meta.stationName),
    areaDesc: str(meta.areaDesc) ?? str(meta.locationLabel),
  };
}

export class RegionFilterService {
  isInBadenWuerttemberg(report: IngestedReport): boolean {
    const loc = resolveLocation(report);
    const meta = locationFromMetadata(report);

    if (isBwStateName(loc.state)) return true;
    if (meta.stateShort?.toUpperCase() === 'BW') return true;

    if (loc.lat !== undefined && loc.lon !== undefined) {
      return isInBwBbox(loc.lat, loc.lon);
    }

    if (isBwCity(loc.municipality)) return true;

    const districtText = loc.district ?? meta.region ?? meta.areaDesc ?? '';
    if (districtText) {
      if (mentionsOtherGermanState(districtText) && !isBwStateName(districtText)) {
        return false;
      }
      if (
        normalizeText(districtText).includes('baden-württemberg') ||
        normalizeText(districtText).includes('baden-wuerttemberg')
      ) {
        return true;
      }
      if (/kreis\s+/i.test(districtText) && !mentionsOtherGermanState(districtText)) {
        for (const city of BW_CITIES) {
          if (districtText.toLowerCase().includes(city.toLowerCase())) return true;
        }
      }
    }

    for (const city of BW_CITIES) {
      const re = new RegExp(`\\b${city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (re.test(report.rawText)) return true;
    }

    if (report.source === 'pegelonline' || report.source === 'firms') {
      return loc.lat === undefined || loc.lon === undefined || isInBwBbox(loc.lat, loc.lon);
    }

    if (report.source === 'dwd') {
      return meta.stateShort === 'BW' || isBwStateName(loc.state) || isBwStateName(districtText);
    }

    const extracted = report.metadata.extractedLocation as { city?: string; state?: string } | undefined;
    if (extracted?.state && isBwStateName(extracted.state)) return true;
    if (isBwCity(extracted?.city)) return true;

    return false;
  }
}

export const regionFilterService = new RegionFilterService();
