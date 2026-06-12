/** Raw NASA FIRMS hotspot record (VIIRS / MODIS CSV row). */
export interface FirmsHotspot {
  latitude: number;
  longitude: number;
  confidence: string | number;
  brightness: number;
  acq_date: string;
  acq_time: string;
  satellite?: string;
  instrument?: string;
  frp?: number;
  daynight?: string;
  scan?: number;
  track?: number;
  version?: string;
  /** Unparsed CSV columns for audit */
  raw: Record<string, string>;
}

export interface FirmsClusterContext {
  clusterSize: number;
}

export const BW_BOUNDS = {
  minLat: 47.4,
  maxLat: 49.8,
  minLon: 7.5,
  maxLon: 10.6,
} as const;
