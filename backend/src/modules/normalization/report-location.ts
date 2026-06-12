import type { IngestedReport, ReportLocation } from './report.types.js';

const BW_STATE = 'Baden-Württemberg';

function num(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return undefined;
}

function str(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const t = value.trim();
  return t.length > 0 ? t : undefined;
}

/** Read lat/lon from report.location or legacy metadata fields. */
export function readCoordinates(report: IngestedReport): {
  lat?: number;
  lon?: number;
} {
  const meta = report.metadata;
  const metaLoc = meta.location as { lat?: number; lon?: number } | undefined;

  return {
    lat:
      report.location?.lat ??
      num(meta.latitude) ??
      num(meta.lat) ??
      num(metaLoc?.lat),
    lon:
      report.location?.lon ??
      num(meta.longitude) ??
      num(meta.lon) ??
      num(metaLoc?.lon),
  };
}

export function hasCoordinates(location: ReportLocation | undefined): boolean {
  return (
    location?.lat !== undefined &&
    location?.lon !== undefined &&
    Number.isFinite(location.lat) &&
    Number.isFinite(location.lon)
  );
}

export function mergeReportLocation(
  report: IngestedReport,
  location: ReportLocation
): IngestedReport {
  return {
    ...report,
    location: {
      ...report.location,
      ...location,
    },
  };
}

/** Build location from explicit sensor coordinates (pegel, FIRMS, DWD when lat/lon present). */
export function locationFromCoordinates(
  lat: number,
  lon: number,
  fields?: Omit<ReportLocation, 'lat' | 'lon'>
): ReportLocation {
  return {
    lat,
    lon,
    state: fields?.state ?? BW_STATE,
    municipality: fields?.municipality,
    district: fields?.district,
  };
}

/** Build location from geocoding / Nominatim result label + optional extraction. */
export function locationFromGeocode(
  lat: number,
  lon: number,
  label: string,
  extracted?: { city?: string; district?: string; state?: string }
): ReportLocation {
  return {
    lat,
    lon,
    municipality: extracted?.city ?? label.split(',')[0]?.trim(),
    district: extracted?.district,
    state: extracted?.state ?? BW_STATE,
  };
}

/** Region-only location (no coordinates) — e.g. DWD district warning before geocoding. */
export function locationFromRegion(fields: {
  municipality?: string;
  district?: string;
  state?: string;
}): ReportLocation {
  return {
    state: fields.state ?? BW_STATE,
    municipality: fields.municipality,
    district: fields.district,
  };
}
