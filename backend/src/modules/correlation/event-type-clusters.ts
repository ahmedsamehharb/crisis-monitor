import type { CrisisEventType } from '../../shared/types/index.js';
import { clusteringConfig } from './clustering.config.js';

/** Compatible event types that may belong to the same crisis event */
export const EVENT_TYPE_CLUSTERS: CrisisEventType[][] = [
  ['fire', 'wildfire'],
  ['flood', 'flood_risk'],
  ['storm', 'thunderstorm', 'heavy_rain'],
  ['traffic_accident'],
  ['infrastructure_failure'],
  ['snow_ice'],
  ['heatwave'],
  ['fog_event'],
];

const clusterIndex = new Map<CrisisEventType, number>();

for (let i = 0; i < EVENT_TYPE_CLUSTERS.length; i++) {
  for (const type of EVENT_TYPE_CLUSTERS[i]) {
    clusterIndex.set(type, i);
  }
}

export function areEventTypesCompatible(
  a: CrisisEventType,
  b: CrisisEventType
): boolean {
  if (a === b) return true;
  if (a === 'unknown' || b === 'unknown') return true;

  const ia = clusterIndex.get(a);
  const ib = clusterIndex.get(b);
  if (ia === undefined || ib === undefined) return false;
  return ia === ib;
}

export function typeSimilarityScore(
  a: CrisisEventType,
  b: CrisisEventType
): number {
  if (a === b) return 1;
  if (areEventTypesCompatible(a, b)) return 0.8;
  return 0;
}

export function maxWindowHoursForType(eventType: CrisisEventType): number {
  const windows = clusteringConfig.maxWindowHours;
  const value = windows[eventType as keyof typeof windows];
  if (typeof value === 'number' && value > 0) return value;
  return windows.default;
}

/** Official/sensor types win over social when rolling up event type */
const EVENT_TYPE_PRIORITY: CrisisEventType[] = [
  'flood',
  'flood_risk',
  'wildfire',
  'fire',
  'storm',
  'thunderstorm',
  'heavy_rain',
  'traffic_accident',
  'infrastructure_failure',
  'snow_ice',
  'heatwave',
  'fog_event',
  'unknown',
];

export function pickDominantEventType(types: CrisisEventType[]): CrisisEventType {
  let best: CrisisEventType = 'unknown';
  let bestRank = EVENT_TYPE_PRIORITY.length;

  for (const t of types) {
    const rank = EVENT_TYPE_PRIORITY.indexOf(t);
    const r = rank === -1 ? EVENT_TYPE_PRIORITY.length : rank;
    if (r < bestRank) {
      bestRank = r;
      best = t;
    }
  }

  return best;
}
