import type { DataSourceId } from '../../shared/types/index.js';
import type { ReportLocation } from '../normalization/report.types.js';
import { readCoordinates } from '../normalization/report-location.js';
import type { ScoredReport } from '../normalization/report.types.js';
import { clusteringConfig } from './clustering.config.js';
import type { CrisisEventSnapshot } from './correlation.types.js';

export type LocationPrecision = 'street' | 'city' | 'district' | 'sensor' | 'unknown';

const SENSOR_SOURCES = new Set<DataSourceId>(['firms', 'pegelonline', 'dwd']);

const STREET_PATTERN =
  /\b(str\.|straße|strasse|weg|platz|allee|gasse|ring|damm|ufer)\b/i;

export function normalizePlace(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const t = value.trim().toLowerCase();
  if (!t) return undefined;
  return t
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getMunicipality(report: ScoredReport): string | undefined {
  return normalizePlace(
    report.location.municipality ??
      str(report.metadata.locationLabel)?.split(',')[0]
  );
}

export function getDistrict(report: ScoredReport): string | undefined {
  return normalizePlace(report.location.district);
}

export function getEventMunicipality(event: CrisisEventSnapshot): string | undefined {
  return normalizePlace(
    event.locationLabel?.split(',')[0] ?? event.location?.municipality
  );
}

export function getLocationPrecision(report: ScoredReport): LocationPrecision {
  if (SENSOR_SOURCES.has(report.source)) return 'sensor';

  const locationType = str(report.metadata.locationType);
  if (locationType === 'address' || locationType === 'highway' || locationType === 'landmark') {
    return 'street';
  }

  const label = str(report.metadata.locationLabel) ?? report.location.municipality ?? '';
  if (STREET_PATTERN.test(label) || str(report.metadata.street)) {
    return 'street';
  }

  if (report.location.district && !report.location.municipality) {
    return 'district';
  }

  if (report.location.municipality || locationType === 'city') {
    return 'city';
  }

  if (report.location.district) return 'district';

  return 'unknown';
}

function radiusForPrecision(precision: LocationPrecision): number {
  const r = clusteringConfig.radiusKm;
  switch (precision) {
    case 'street':
      return r.street;
    case 'city':
      return r.city;
    case 'sensor':
      return r.sensor;
    case 'district':
      return r.district;
    default:
      return r.default;
  }
}

export function passesLocationGate(
  report: ScoredReport,
  event: CrisisEventSnapshot
): boolean {
  const reportMuni = getMunicipality(report);
  const eventMuni = getEventMunicipality(event);
  if (reportMuni && eventMuni && reportMuni === eventMuni) return true;

  const reportDistrict = getDistrict(report);
  const eventDistrict = normalizePlace(event.location?.district);
  if (reportDistrict && eventDistrict && reportDistrict === eventDistrict) return true;

  const rc = readCoordinates(report);
  const elat = event.latitude ?? event.location?.lat;
  const elon = event.longitude ?? event.location?.lon;

  if (
    rc.lat !== undefined &&
    rc.lon !== undefined &&
    elat !== undefined &&
    elon !== undefined
  ) {
    const precision = getLocationPrecision(report);
    const radius = Math.max(
      radiusForPrecision(precision),
      radiusForPrecision('unknown')
    );
    const dist = haversineKm(rc.lat, rc.lon, elat, elon);
    if (dist <= radius) return true;
  }

  return false;
}

export function computeGeoScore(
  report: ScoredReport,
  event: CrisisEventSnapshot
): number {
  const reportMuni = getMunicipality(report);
  const eventMuni = getEventMunicipality(event);

  if (reportMuni && eventMuni && reportMuni === eventMuni) {
    const reportPrecision = getLocationPrecision(report);
    const hasStreet = reportPrecision === 'street';
    const eventLabel = event.locationLabel ?? '';
    const eventHasStreet =
      STREET_PATTERN.test(eventLabel) || event.precision === 'street';

    if (hasStreet && !eventHasStreet) {
      return clusteringConfig.parentChildGeoScore;
    }
    if (!hasStreet && eventHasStreet) {
      return clusteringConfig.parentChildGeoScore;
    }
    return clusteringConfig.municipalityMatchScore;
  }

  const rc = readCoordinates(report);
  const elat = event.latitude ?? event.location?.lat;
  const elon = event.longitude ?? event.location?.lon;

  if (
    rc.lat === undefined ||
    rc.lon === undefined ||
    elat === undefined ||
    elon === undefined
  ) {
    const reportDistrict = getDistrict(report);
    const eventDistrict = normalizePlace(event.location?.district);
    if (reportDistrict && eventDistrict && reportDistrict === eventDistrict) {
      return 0.75;
    }
    return 0;
  }

  const dist = haversineKm(rc.lat, rc.lon, elat, elon);
  const reportRadius = radiusForPrecision(getLocationPrecision(report));
  const eventRadius = radiusForPrecision(event.precision ?? 'unknown');
  const maxRadius = Math.max(reportRadius, eventRadius);

  return Math.max(0, 1 - dist / maxRadius);
}

function str(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const t = value.trim();
  return t.length > 0 ? t : undefined;
}
