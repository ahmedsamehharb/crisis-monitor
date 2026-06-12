import { BW_CITIES } from '../geocoding/bw-cities.js';
import type { IngestedReport, ReportLocation } from '../normalization/report.types.js';

const KREIS_REGEX = /\bKreis\s+([A-Za-zÄÖÜäöüß .-]+)/i;
const STADTKREIS_REGEX = /\bStadtkreis\s+([A-Za-zÄÖÜäöüß .-]+)/i;

function num(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return undefined;
}

function str(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const t = value.trim();
  return t.length > 0 ? t : undefined;
}

function normalizeStateName(state: string | undefined): string | undefined {
  if (!state) return undefined;
  const n = state.trim().toLowerCase();
  if (n === 'bw' || n.includes('baden')) return 'Baden-Württemberg';
  return state.trim();
}

function extractDistrict(text: string): string | undefined {
  const kreis = text.match(KREIS_REGEX);
  if (kreis) return `Kreis ${kreis[1].trim()}`;

  const stadtkreis = text.match(STADTKREIS_REGEX);
  if (stadtkreis) return `Stadtkreis ${stadtkreis[1].trim()}`;

  if (/kreis\s+/i.test(text) && text.length < 120) return text.trim();
  return undefined;
}

function extractMunicipality(text: string): string | undefined {
  for (const city of BW_CITIES) {
    const re = new RegExp(`\\b${city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (re.test(text)) return city;
  }

  const stationMatch = text.match(/Station:\s*([^,.]+)/i);
  if (stationMatch) return stationMatch[1].trim();

  return undefined;
}

function parseStationDistrict(stationName: string | undefined): string | undefined {
  if (!stationName) return undefined;
  return extractDistrict(stationName) ?? stationName;
}

export class ReportEnrichmentService {
  enrich(report: IngestedReport): IngestedReport {
    const location = this.buildLocation(report);
    return {
      ...report,
      location,
      metadata: {
        ...report.metadata,
        enrichedLocation: location,
      },
    };
  }

  private buildLocation(report: IngestedReport): ReportLocation {
    const meta = report.metadata;
    const metaLoc = meta.location as Record<string, unknown> | undefined;
    const extracted = meta.extractedLocation as { city?: string; district?: string; state?: string } | undefined;

    const lat =
      report.location?.lat ??
      num(meta.latitude) ??
      num(meta.lat) ??
      num(metaLoc?.lat);
    const lon =
      report.location?.lon ??
      num(meta.longitude) ??
      num(meta.lon) ??
      num(metaLoc?.lon);

    const areaDesc = str(meta.areaDesc);
    const regionName = str(metaLoc?.region) ?? str(meta.stationName) ?? str(meta.locationLabel);
    const combinedText = [areaDesc, regionName, report.rawText].filter(Boolean).join(' ');

    const municipality =
      report.location?.municipality ??
      str(extracted?.city) ??
      extractMunicipality(combinedText) ??
      (regionName && !regionName.toLowerCase().includes('kreis') ? regionName : undefined);

    const district =
      report.location?.district ??
      str(extracted?.district) ??
      extractDistrict(areaDesc ?? '') ??
      extractDistrict(regionName ?? '') ??
      parseStationDistrict(str(meta.stationName));

    const state =
      normalizeStateName(
        report.location?.state ??
          str(extracted?.state) ??
          str(metaLoc?.state) ??
          (str(metaLoc?.stateShort) === 'BW' ? 'Baden-Württemberg' : undefined)
      ) ??
      (combinedText.toLowerCase().includes('baden-württemberg') ||
      combinedText.toLowerCase().includes('baden-wuerttemberg')
        ? 'Baden-Württemberg'
        : undefined);

    return {
      lat,
      lon,
      municipality,
      district,
      state,
    };
  }
}

export const reportEnrichmentService = new ReportEnrichmentService();
