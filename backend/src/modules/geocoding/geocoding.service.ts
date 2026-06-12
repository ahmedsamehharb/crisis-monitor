import type { IngestedReport } from '../normalization/report.types.js';
import type { GeoLocation } from './location.types.js';
import { extractLocations } from './location.extractor.js';

/** TODO: geocode extracted locations (Nominatim, BKG, etc.) — focus on Baden-Württemberg */
export class GeocodingService {
  async geocodeReport(report: IngestedReport): Promise<GeoLocation | null> {
    const places = extractLocations(report.rawText);
    if (places.length === 0) return null;
    return null;
  }
}

export const geocodingService = new GeocodingService();
