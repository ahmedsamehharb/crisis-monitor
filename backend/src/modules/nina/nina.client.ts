import { RawEventData } from './nina.types.js';

/**
 * Extracts the 2-letter state code from the NINA alert ID.
 * The ID format is: mow.DE-NW-K-SE031-20260612-31-000
 * The 2-letter state code is in the 3rd segment (index 2)
 * Example: "mow.DE-NW-K-SE031-20260612-31-000" -> "DE"
 * 
 * @param event - The NINA alert event
 * @returns The 2-letter state code (e.g., "DE", "NW", "BY", etc.), or null if not found
 */
function extractStateCode(event: RawEventData): string | null {
  const id = event.id || '';
  const parts = id.split('-');
  // The 3rd segment (index 2) is the state code
  if (parts.length >= 3) {
    const stateCode = parts[2]; // Get the 2-letter state code
    if (stateCode && stateCode.length === 2) {
      return stateCode;
    }
  }
  return null;
}

/**
 * Checks if a NINA alert is for Baden-Württemberg (BW)
 * Uses the 2-letter state code from the NINA ID
 * 
 * @param event - The NINA alert event
 * @returns true if the alert is for Baden-Württemberg, false otherwise
 */
export function isBadenWuerttembergWarning(event: RawEventData): boolean {
  const id = event.id || '';
  
  // Check if the ID contains "BW" or "Baden-Württemberg"
  if (id.toLowerCase().includes('bw') || 
      event.areaDesc?.toLowerCase().includes('baden-württemberg') || 
      event.areaDesc?.toLowerCase().includes('bw')) {
    return true;
  }
  
  // Check if headline or description contains BW cities
  const text = `${event.description || ''} ${event.headline || ''}`.toLowerCase();
  const bwCities = ['stuttgart', 'karlsruhe', 'freiburg', 'heidelberg', 
                   'mannheim', 'ulm', 'konstanz', 'bodensee', 
                   'singen', 'tuttlingen', 'ravensburg',
                   ' Neckar', 'Rhine', 'Main', 'Enz', 'Mur', 'Iller'];
  
  for (const city of bwCities) {
    if (text.includes(city.toLowerCase()) || text.includes(city.toLowerCase().replace(' ', '')) || 
        id.toLowerCase().includes('bw') || id.toLowerCase().includes('baden-württemberg')) {
      return true;
    }
  }
  
  return false;
}

export async function fetchNinaWarnings(): Promise<RawEventData[] | null> {
  try {
    const response = await fetch('https://warnung.bund.de/api31/mowas/mapData.json');
    const data = await response.json();

    if (!data || !Array.isArray(data)) {
      console.warn('NINA: No warnings data available');
      return null;
    }

    const mappedEvents: RawEventData[] = (data as any[]).map((warning: any) => {
      return {
        id: warning.id || warning.identifier || 'unknown',
        version: warning.version || 0,
        startDate: warning.startDate || new Date().toISOString(),
        severity: warning.severity || 'Unknown',
        urgency: warning.urgency || 'Unknown',
        type: warning.type || 'Alert',
        i18nTitle: warning.i18nTitle || { de: 'Unknown', en: 'Unknown' },
        i18nDescription: warning.i18nDescription || { de: 'No description available', en: 'No description available' },
        areaDesc: warning.areaDesc || 'Germany',
        location: warning.location || { lat: null, lon: null },
        sourceName: 'NINA (BKKatWWarn)',
        sourceUrl: 'https://warnung.bund.de',
        description: warning.i18nTitle?.de || 'No description available',
        headline: warning.i18nTitle?.de || 'No headline available',
        lat: warning.location?.lat || null,
        lon: warning.location?.lon || null,
        trustLevel: 1.0,
      };
    });

    return mappedEvents.length > 0 ? mappedEvents : null;
  } catch (error) {
    console.warn('NINA: Error fetching warnings:', error);
    return null;
  }
}