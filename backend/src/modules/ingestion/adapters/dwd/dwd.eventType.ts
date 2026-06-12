import type { CrisisEventType } from '../../../../shared/types/index.js';

/**
 * Maps DWD warning event codes (German/English) to internal crisis event types.
 * Used for correlation with social reports and scoring.
 */
export function mapDwdEventToCrisisType(event: string): CrisisEventType {
  const normalized = event.trim().toUpperCase();

  if (
    normalized.includes('GEWITTER') ||
    normalized.includes('THUNDERSTORM')
  ) {
    return 'thunderstorm';
  }

  if (
    normalized.includes('STURMBÖEN') ||
    normalized.includes('STURMBOEN') ||
    normalized.includes('WINDBÖEN') ||
    normalized.includes('WINDBOEN') ||
    normalized.includes('STARKWIND') ||
    normalized.includes('STURM') ||
    normalized.includes('STORM') ||
    normalized.includes('STRONG WIND') ||
    normalized.includes('BÖEN') ||
    normalized.includes('BOEN')
  ) {
    return 'storm';
  }

  if (
    normalized.includes('DAUERREGEN') ||
    normalized.includes('STARKREGEN') ||
    normalized.includes('HEAVY RAIN') ||
    normalized.includes('CONTINUOUS RAIN') ||
    normalized.includes('NIEDERSCHLAG')
  ) {
    return 'heavy_rain';
  }

  if (
    normalized.includes('HOCHWASSER') ||
    normalized.includes('ÜBERSCHWEMM') ||
    normalized.includes('UEBERSCHWEMM') ||
    normalized.includes('FLOOD') ||
    normalized.includes('HIGH WATER')
  ) {
    return 'flood_risk';
  }

  if (
    normalized.includes('SCHNEE') ||
    normalized.includes('SNOW') ||
    normalized.includes('FROST') ||
    normalized.includes('GLÄTTE') ||
    normalized.includes('GLATTE') ||
    normalized.includes('EIS') ||
    normalized.includes('ICE')
  ) {
    return 'snow_ice';
  }

  if (normalized.includes('HITZE') || normalized.includes('HEAT')) {
    return 'heatwave';
  }

  if (normalized.includes('NEBEL') || normalized.includes('FOG')) {
    return 'fog_event';
  }

  return 'unknown';
}

/** Normalize DWD level (1–4) to 0–1 for scoring. */
export function normalizeDwdSeverity(level: number): number {
  if (!Number.isFinite(level) || level <= 0) return 0.25;
  return Math.min(1, Math.max(0, level / 4));
}
