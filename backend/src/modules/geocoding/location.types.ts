export type LocationType =
  | 'address'
  | 'city'
  | 'district'
  | 'state'
  | 'river'
  | 'landmark'
  | 'highway'
  | 'region'
  | 'unknown';

/** Structured place mention extracted from post text (LLM or rules). */
export interface ExtractedLocation {
  street?: string;
  houseNumber?: string;
  city?: string;
  district?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  river?: string;
  landmark?: string;
  highway?: string;
  rawMention: string;
  confidence: number;
  locationType: LocationType;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  label: string;
  confidence: number;
  source: 'extracted' | 'geocoded' | 'sensor' | 'manual';
  locationType: LocationType;
  extracted?: ExtractedLocation;
}
