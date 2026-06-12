import type { IngestedReport } from '../../../normalization/report.types.js';
import {
  FLOOD_CHARACTERISTIC_SHORTNAMES,
  type PegelAlert,
  type PegelCharacteristicValue,
  type PegelStation,
} from './pegel.types.js';

export function pegelStationUrl(station: PegelStation): string {
  return `https://www.pegelonline.wsv.de/vmg/stations/${station.number}`;
}

function waterTimeseries(station: PegelStation) {
  return station.timeseries?.find((ts) => ts.shortname === 'W');
}

function floodThresholds(
  values: PegelCharacteristicValue[] = []
): PegelCharacteristicValue[] {
  return FLOOD_CHARACTERISTIC_SHORTNAMES.flatMap((name) =>
    values.filter((v) => v.shortname === name)
  ).sort((a, b) => a.value - b.value);
}

/**
 * Evaluate a station for flood-relevant water levels.
 * Returns null when no alert condition is met.
 */
export function evaluatePegelStation(
  station: PegelStation,
  warningRatio = 0.9
): PegelAlert | null {
  const series = waterTimeseries(station);
  const measurement = series?.currentMeasurement;

  if (!measurement || measurement.value == null) return null;

  const level = measurement.value;
  const thresholds = floodThresholds(series?.characteristicValues);

  if (
    measurement.stateNswHsw === 'high' ||
    measurement.stateMnwMhw === 'high'
  ) {
    return {
      severity: 'critical',
      reason: 'Pegel meldet erhöhten Wasserstand (NSW/HSW)',
      station,
      waterLevelCm: level,
      measuredAt: measurement.timestamp,
    };
  }

  const exceeded = thresholds.filter((t) => level >= t.value);
  if (exceeded.length > 0) {
    const highest = exceeded[exceeded.length - 1];
    return {
      severity: 'critical',
      reason: `Wasserstand überschreitet ${highest.longname} (${highest.shortname})`,
      station,
      waterLevelCm: level,
      thresholdCm: highest.value,
      thresholdLabel: highest.shortname,
      measuredAt: measurement.timestamp,
    };
  }

  const nextThreshold = thresholds.find(
    (t) => level < t.value && level >= t.value * warningRatio
  );
  if (nextThreshold) {
    return {
      severity: 'warning',
      reason: `Wasserstand nähert sich ${nextThreshold.longname} (${nextThreshold.shortname})`,
      station,
      waterLevelCm: level,
      thresholdCm: nextThreshold.value,
      thresholdLabel: nextThreshold.shortname,
      measuredAt: measurement.timestamp,
    };
  }

  return null;
}

export function mapPegelAlert(alert: PegelAlert): IngestedReport {
  const { station } = alert;
  const water = station.water.longname;

  const text = [
    `${alert.reason}.`,
    `Gewässer: ${water}, Station: ${station.longname}.`,
    `Aktueller Wasserstand: ${alert.waterLevelCm} cm`,
    alert.thresholdCm != null
      ? `(Schwelle ${alert.thresholdLabel}: ${alert.thresholdCm} cm).`
      : '.',
  ].join(' ');

  const keywords =
    alert.severity === 'critical'
      ? ['Überschwemmung', 'Hochwasser']
      : ['Überschwemmung'];

  return {
    id: `pegelonline:${station.uuid}:${alert.thresholdLabel ?? 'state'}:${alert.waterLevelCm}`,
    source: 'pegelonline',
    sourceId: station.uuid,
    rawText: text,
    url: pegelStationUrl(station),
    author: station.agency || 'PEGELONLINE',
    createdAt: alert.measuredAt,
    ingestedAt: new Date().toISOString(),
    keywords,
    eventType: 'flood',
    mediaUrls: [],
    metadata: {
      severity: alert.severity,
      water: water,
      stationName: station.longname,
      waterLevelCm: alert.waterLevelCm,
      thresholdCm: alert.thresholdCm,
      thresholdLabel: alert.thresholdLabel,
      latitude: station.latitude,
      longitude: station.longitude,
      km: station.km,
    },
  };
}
