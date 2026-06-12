import { config } from '../../../../app/config/index.js';
import { logger } from '../../../../shared/logger/logger.js';
import { BW_BOUNDS, type FirmsHotspot } from './fires.types.js';

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }
  fields.push(current.trim());
  return fields;
}

function num(value: string | undefined): number | undefined {
  if (value === undefined || value === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function isInBoundingBox(lat: number, lon: number): boolean {
  return (
    lat >= BW_BOUNDS.minLat &&
    lat <= BW_BOUNDS.maxLat &&
    lon >= BW_BOUNDS.minLon &&
    lon <= BW_BOUNDS.maxLon
  );
}

function rowToHotspot(headers: string[], values: string[]): FirmsHotspot | null {
  const raw: Record<string, string> = {};
  headers.forEach((h, i) => {
    raw[h] = values[i] ?? '';
  });

  const latitude = num(raw.latitude);
  const longitude = num(raw.longitude);
  if (latitude === undefined || longitude === undefined) return null;
  if (!isInBoundingBox(latitude, longitude)) return null;

  const brightness =
    num(raw.bright_ti4) ??
    num(raw.bright_ti5) ??
    num(raw.brightness) ??
    num(raw.bright_ti31) ??
    0;

  const confidence = raw.confidence ?? '';
  if (confidence === '') return null;

  return {
    latitude,
    longitude,
    confidence,
    brightness,
    acq_date: raw.acq_date ?? '',
    acq_time: raw.acq_time ?? '',
    satellite: raw.satellite,
    instrument: raw.instrument,
    frp: num(raw.frp),
    daynight: raw.daynight,
    scan: num(raw.scan),
    track: num(raw.track),
    version: raw.version,
    raw,
  };
}

function parseFirmsCsv(csv: string): FirmsHotspot[] {
  const lines = csv
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const hotspots: FirmsHotspot[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = rowToHotspot(headers, parseCsvLine(lines[i]));
    if (row) hotspots.push(row);
  }

  return hotspots;
}

/**
 * Fetch NASA FIRMS area CSV for Baden-Württemberg bounding box.
 * API: https://firms.modaps.eosdis.nasa.gov/api/area/csv/{MAP_KEY}/{SOURCE}/{west,south,east,north}/{days}
 */
export async function fetchFirmsHotspots(): Promise<FirmsHotspot[]> {
  const { mapKey, apiBase, source, dayRange, bbox } = config.firms;

  if (!mapKey) {
    logger.warn('NASA FIRMS', 'FIRMS_MAP_KEY not set — skipping fetch');
    return [];
  }

  const bboxStr = `${bbox.west},${bbox.south},${bbox.east},${bbox.north}`;
  const url = `${apiBase.replace(/\/$/, '')}/area/csv/${mapKey}/${source}/${bboxStr}/${dayRange}`;

  const response = await fetch(url, {
    headers: {
      Accept: 'text/csv',
      'User-Agent': 'CrisisMonitor/1.0 (crisis-monitoring; BW wildfire)',
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `FIRMS API error ${response.status}: ${body.slice(0, 200)}`
    );
  }

  const csv = await response.text();
  if (!csv.trim() || csv.toLowerCase().includes('invalid')) {
    logger.warn('NASA FIRMS', 'Empty or invalid CSV response');
    return [];
  }

  return parseFirmsCsv(csv);
}

export { isInBoundingBox };
