import { config } from '../../app/config/index.js';
import { logger } from '../../shared/logger/logger.js';
import type { IngestedReport } from '../normalization/report.types.js';
import { buildGeocodeQuery } from './geocode-query.js';
import {
  extractLocationsFromText,
  pickBestLocation,
} from './location.extractor.js';
import type { GeoLocation } from './location.types.js';
import { geocodeQuery } from './nominatim.client.js';

const SOCIAL_SOURCES = new Set(['mastodon', 'bluesky']);

function num(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

function sensorLocationFromMetadata(
  report: IngestedReport
): GeoLocation | null {
  const meta = report.metadata;

  const lat =
    num(meta.latitude) ??
    num(meta.lat) ??
    num((meta.location as { lat?: number })?.lat);
  const lon =
    num(meta.longitude) ??
    num(meta.lon) ??
    num((meta.location as { lon?: number })?.lon);

  if (lat === undefined || lon === undefined) return null;

  const label =
    str(meta.stationName) ||
    str(meta.areaDesc) ||
    str((meta.location as { region?: string })?.region) ||
    `${lat.toFixed(4)}, ${lon.toFixed(4)}`;

  return {
    latitude: lat,
    longitude: lon,
    label,
    confidence: num(meta.trust) ?? 0.95,
    source: 'sensor',
    locationType:
      report.source === 'pegelonline'
        ? 'river'
        : report.source === 'firms'
          ? 'landmark'
          : 'region',
  };
}

function str(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const t = value.trim();
  return t.length > 0 ? t : undefined;
}

function attachGeoToReport(
  report: IngestedReport,
  geo: GeoLocation
): IngestedReport {
  return {
    ...report,
    metadata: {
      ...report.metadata,
      latitude: geo.latitude,
      longitude: geo.longitude,
      locationLabel: geo.label,
      locationConfidence: geo.confidence,
      locationSource: geo.source,
      locationType: geo.locationType,
      extractedLocation: geo.extracted,
    },
  };
}

export class GeocodingService {
  async enrichReport(report: IngestedReport): Promise<IngestedReport> {
    if (!config.geocoding.enabled) return report;

    const sensor = sensorLocationFromMetadata(report);
    if (sensor) {
      return attachGeoToReport(report, sensor);
    }

    if (config.geocoding.socialOnly && !SOCIAL_SOURCES.has(report.source)) {
      const areaDesc = str(report.metadata.areaDesc);
      if (areaDesc && report.source === 'dwd') {
        return this.geocodeAreaDesc(report, areaDesc);
      }
      return report;
    }

    if (!SOCIAL_SOURCES.has(report.source)) {
      return report;
    }

    const extracted = await extractLocationsFromText(report.rawText);
    const best = pickBestLocation(extracted);

    if (!best) {
      logger.debug('Geocoding', 'No location extracted', {
        source: report.source,
        id: report.id,
      });
      return {
        ...report,
        metadata: {
          ...report.metadata,
          extractedLocations: extracted,
        },
      };
    }

    const query = buildGeocodeQuery(best);
    if (!query) {
      return {
        ...report,
        metadata: {
          ...report.metadata,
          extractedLocations: extracted,
          extractedLocation: best,
        },
      };
    }

    let hit = await geocodeQuery(query);

    // Street-level miss: retry with city-only fallback
    if (!hit && best.street && best.city) {
      const cityQuery = buildGeocodeQuery({
        ...best,
        street: undefined,
        houseNumber: undefined,
        locationType: 'city',
      });
      if (cityQuery && cityQuery !== query) {
        hit = await geocodeQuery(cityQuery);
      }
    }

    if (!hit) {
      logger.debug('Geocoding', 'Nominatim miss', { query, reportId: report.id });
      return {
        ...report,
        metadata: {
          ...report.metadata,
          extractedLocations: extracted,
          extractedLocation: best,
          geocodeQuery: query,
        },
      };
    }

    const geo: GeoLocation = {
      latitude: hit.lat,
      longitude: hit.lon,
      label: hit.displayName,
      confidence: Math.min(0.95, best.confidence + 0.1),
      source: 'geocoded',
      locationType: best.locationType,
      extracted: best,
    };

    logger.info('Geocoding', `Resolved: ${geo.label}`, {
      source: report.source,
      query,
      lat: geo.latitude,
      lon: geo.longitude,
    });

    const enriched = attachGeoToReport(report, geo);
    return {
      ...enriched,
      metadata: {
        ...enriched.metadata,
        extractedLocations: extracted,
        geocodeQuery: query,
      },
    };
  }

  private async geocodeAreaDesc(
    report: IngestedReport,
    areaDesc: string
  ): Promise<IngestedReport> {
    const query = `${areaDesc}, Baden-Württemberg, Germany`;
    const hit = await geocodeQuery(query);
    if (!hit) return report;

    const geo: GeoLocation = {
      latitude: hit.lat,
      longitude: hit.lon,
      label: hit.displayName,
      confidence: 0.7,
      source: 'geocoded',
      locationType: 'region',
    };

    return attachGeoToReport(report, geo);
  }
}

export const geocodingService = new GeocodingService();
