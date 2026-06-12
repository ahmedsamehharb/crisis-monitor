import type { ExtractedLocation } from './location.types.js';

const DEFAULT_STATE = 'Baden-Württemberg';
const DEFAULT_COUNTRY = 'Germany';

/**
 * Build a Nominatim search query from structured extraction (most specific first).
 */
export function buildGeocodeQuery(location: ExtractedLocation): string | null {
  const parts: string[] = [];

  if (location.street) {
    const street = location.houseNumber
      ? `${location.street} ${location.houseNumber}`
      : location.street;
    parts.push(street);
  }

  if (location.landmark && !location.street) {
    parts.push(location.landmark);
  }

  if (location.highway) {
    parts.push(location.highway);
  }

  if (location.district) parts.push(location.district);
  if (location.city) parts.push(location.city);
  if (location.river && !location.city && !location.street) {
    parts.push(location.river);
  }

  const state = location.state || DEFAULT_STATE;
  const country = location.country === 'Deutschland' ? DEFAULT_COUNTRY : location.country || DEFAULT_COUNTRY;

  if (parts.length === 0) {
    if (location.state && location.locationType === 'state') {
      return `${location.state}, ${country}`;
    }
    if (location.river) {
      return `${location.river}, ${state}, ${country}`;
    }
    return null;
  }

  parts.push(state, country);
  return parts.join(', ');
}
