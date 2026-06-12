import { config } from '../../app/config/index.js';
import { logger } from '../../shared/logger/logger.js';

export interface NominatimResult {
  lat: number;
  lon: number;
  displayName: string;
}

const geocodeCache = new Map<string, NominatimResult | null>();
let lastRequestAt = 0;

/** Baden-Württemberg approximate bounding box */
const BW_BOUNDS = {
  minLat: 47.4,
  maxLat: 49.85,
  minLon: 7.4,
  maxLon: 10.6,
};

function inBw(lat: number, lon: number): boolean {
  return (
    lat >= BW_BOUNDS.minLat &&
    lat <= BW_BOUNDS.maxLat &&
    lon >= BW_BOUNDS.minLon &&
    lon <= BW_BOUNDS.maxLon
  );
}

async function rateLimit(): Promise<void> {
  const minIntervalMs = 1100;
  const elapsed = Date.now() - lastRequestAt;
  if (elapsed < minIntervalMs) {
    await new Promise((r) => setTimeout(r, minIntervalMs - elapsed));
  }
  lastRequestAt = Date.now();
}

export async function geocodeQuery(query: string): Promise<NominatimResult | null> {
  const cacheKey = query.toLowerCase();
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey) ?? null;
  }

  await rateLimit();

  const url = new URL(`${config.geocoding.nominatimBaseUrl}/search`);
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');
  url.searchParams.set('countrycodes', 'de');

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'CrisisMonitor/1.0 (hackathon; crisis-monitoring)',
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      logger.warn('Nominatim', `Search failed: ${response.status}`, query);
      geocodeCache.set(cacheKey, null);
      return null;
    }

    const results = (await response.json()) as {
      lat: string;
      lon: string;
      display_name: string;
    }[];

    const hit = results[0];
    if (!hit) {
      geocodeCache.set(cacheKey, null);
      return null;
    }

    const lat = Number(hit.lat);
    const lon = Number(hit.lon);

    if (config.geocoding.bwOnly && !inBw(lat, lon)) {
      logger.debug('Nominatim', 'Result outside BW, skipped', { query, lat, lon });
      geocodeCache.set(cacheKey, null);
      return null;
    }

    const result: NominatimResult = {
      lat,
      lon,
      displayName: hit.display_name,
    };
    geocodeCache.set(cacheKey, result);
    return result;
  } catch (err) {
    logger.error('Nominatim', 'Request failed', err);
    geocodeCache.set(cacheKey, null);
    return null;
  }
}
