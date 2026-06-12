import type { GeoLocation } from './location.types.js';

/** TODO: extract place names / BW municipalities from report text (NER, regex) */
export function extractLocations(_text: string): string[] {
  return [];
}

export function toGeoLocation(_place: string): GeoLocation | null {
  return null;
}
