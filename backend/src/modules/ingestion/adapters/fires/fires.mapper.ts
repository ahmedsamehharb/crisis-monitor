import { locationFromCoordinates } from '../../../normalization/report-location.js';
import type { IngestedReport } from '../../../normalization/report.types.js';
import { mapFirmsEventType } from './fires.eventType.js';
import type { FirmsClusterContext, FirmsHotspot } from './fires.types.js';

const FIRMS_TRUST = 0.85;
const FIRMS_AUTHOR = 'NASA FIRMS';
const BW_REGION = 'Baden-Württemberg';

export function firmsConfidencePercent(confidence: string | number): number {
  if (typeof confidence === 'number') return confidence;
  const n = Number(confidence);
  if (!Number.isNaN(n)) return n;
  const c = String(confidence).toLowerCase();
  if (c === 'h' || c === 'high') return 90;
  if (c === 'n' || c === 'nominal') return 65;
  if (c === 'l' || c === 'low') return 35;
  return 50;
}

/** Map FIRMS confidence (0–100) to normalized severity bucket (0–1). */
export function firmsSeverityScore(percent: number): number {
  if (percent > 80) return 0.9;
  if (percent >= 50) return 0.7;
  return 0.5;
}

function acqToIso(date: string, time: string): string {
  const t = time.padStart(4, '0');
  const hours = t.slice(0, 2);
  const minutes = t.slice(2, 4);
  const iso = `${date}T${hours}:${minutes}:00Z`;
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function firmsMapUrl(lat: number, lon: number): string {
  return `https://firms.modaps.eosdis.nasa.gov/map/#d:1;@${lon},${lat},12z`;
}

function confidenceLabel(percent: number): string {
  if (percent > 80) return 'high';
  if (percent >= 50) return 'medium';
  return 'low';
}

export function firmsHotspotSourceId(hotspot: FirmsHotspot): string {
  return [
    hotspot.latitude.toFixed(4),
    hotspot.longitude.toFixed(4),
    hotspot.acq_date,
    hotspot.acq_time,
    hotspot.satellite ?? 'unknown',
  ].join(':');
}

export function mapFirmsHotspotToReport(
  hotspot: FirmsHotspot,
  context: FirmsClusterContext = { clusterSize: 1 }
): IngestedReport {
  const confidencePercent = firmsConfidencePercent(hotspot.confidence);
  let confidence = firmsSeverityScore(confidencePercent);

  if (context.clusterSize >= 3) {
    confidence = Math.min(0.95, confidence + 0.1);
  } else if (context.clusterSize === 2) {
    confidence = Math.min(0.95, confidence + 0.05);
  }

  const createdAt = acqToIso(hotspot.acq_date, hotspot.acq_time);
  const sourceId = firmsHotspotSourceId(hotspot);
  const label = confidenceLabel(confidencePercent);

  const rawText = [
    `NASA FIRMS thermal anomaly (wildfire signal) in ${BW_REGION}.`,
    `Coordinates: ${hotspot.latitude.toFixed(4)}, ${hotspot.longitude.toFixed(4)}.`,
    `Detection confidence: ${label} (${hotspot.confidence}).`,
    `Brightness: ${hotspot.brightness} K.`,
    hotspot.satellite ? `Satellite: ${hotspot.satellite}.` : '',
    hotspot.frp != null ? `FRP: ${hotspot.frp} MW.` : '',
    context.clusterSize > 1
      ? `Cluster: ${context.clusterSize} detections in vicinity.`
      : '',
  ]
    .filter(Boolean)
    .join(' ');

  return {
    id: `firms:${sourceId}`,
    source: 'firms',
    sourceId,
    rawText,
    url: firmsMapUrl(hotspot.latitude, hotspot.longitude),
    author: FIRMS_AUTHOR,
    createdAt,
    ingestedAt: new Date().toISOString(),
    keywords: ['Waldbrand', 'Feuer', 'FIRMS'],
    eventType: mapFirmsEventType(),
    mediaUrls: [],
    trust: FIRMS_TRUST,
    location: locationFromCoordinates(hotspot.latitude, hotspot.longitude),
    metadata: {
      confidence,
      confidencePercent,
      brightness: hotspot.brightness,
      trust: FIRMS_TRUST,
      latitude: hotspot.latitude,
      longitude: hotspot.longitude,
      location: {
        lat: hotspot.latitude,
        lon: hotspot.longitude,
        region: BW_REGION,
      },
      acq_date: hotspot.acq_date,
      acq_time: hotspot.acq_time,
      satellite: hotspot.satellite,
      instrument: hotspot.instrument,
      frp: hotspot.frp,
      daynight: hotspot.daynight,
      clusterSize: context.clusterSize,
      firmsConfidence: hotspot.confidence,
      raw: hotspot.raw,
    },
  };
}
