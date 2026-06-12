export interface GeoLocation {
  latitude: number;
  longitude: number;
  label: string;
  confidence: number;
  source: 'extracted' | 'geocoded' | 'manual';
}
