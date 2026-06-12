export interface PegelWater {
  shortname: string;
  longname: string;
}

export interface PegelCharacteristicValue {
  shortname: string;
  longname: string;
  unit: string;
  value: number;
  validFrom?: string;
}

export interface PegelCurrentMeasurement {
  timestamp: string;
  value: number;
  stateMnwMhw: 'normal' | 'high' | 'low' | 'unknown';
  stateNswHsw: 'normal' | 'high' | 'low' | 'unknown';
}

export interface PegelTimeseries {
  shortname: string;
  longname: string;
  unit: string;
  currentMeasurement?: PegelCurrentMeasurement;
  characteristicValues?: PegelCharacteristicValue[];
}

export interface PegelStation {
  uuid: string;
  number: string;
  shortname: string;
  longname: string;
  km?: number;
  agency?: string;
  longitude: number;
  latitude: number;
  water: PegelWater;
  timeseries?: PegelTimeseries[];
}

export type PegelAlertSeverity = 'warning' | 'critical';

export interface PegelAlert {
  severity: PegelAlertSeverity;
  reason: string;
  station: PegelStation;
  waterLevelCm: number;
  thresholdCm?: number;
  thresholdLabel?: string;
  measuredAt: string;
}

/** Flood-relevant characteristic marks (Meldestufen, Hochwasser). */
export const FLOOD_CHARACTERISTIC_SHORTNAMES = [
  'M_III',
  'M_II',
  'M_I',
  'HSW',
  'HSW2',
  'HThw',
  'HW',
  'HHW',
  'OBW',
  'ZS_I',
] as const;
