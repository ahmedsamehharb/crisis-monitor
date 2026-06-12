/** Raw DWD event code as returned by CAP or JSON APIs (e.g. STURMBÖEN, DAUERREGEN). */
export type DwdEventTypeRaw = string;

export interface DwdWarningLocation {
  region?: string;
  state?: string;
  stateShort?: string;
  country: 'DE';
  lat?: number;
  lon?: number;
}

export interface DwdWarning {
  sourceId: string;
  identifier: string;
  headline: string;
  description: string;
  event: DwdEventTypeRaw;
  instruction?: string;
  onset: string;
  expires?: string;
  areaDesc: string;
  location: DwdWarningLocation;
  /** DWD warning level 1 (minor) – 4 (extreme). */
  severityLevel: number;
  sourceUrl: string;
}

/** Shape of a single warning inside warnings.json */
export interface DwdJsonWarningEntry {
  state?: string;
  stateShort?: string;
  type?: number;
  level?: number;
  start?: number;
  end?: number | null;
  regionName?: string;
  description?: string;
  event?: string;
  headline?: string;
  instruction?: string;
  altitudeStart?: number | null;
  altitudeEnd?: number | null;
}

export interface DwdJsonWarningsPayload {
  time?: number;
  warnings?: Record<string, DwdJsonWarningEntry[]>;
}

export interface DwdCapInfoBlock {
  event?: string;
  headline?: string;
  description?: string;
  instruction?: string;
  onset?: string;
  expires?: string;
  severity?: string;
  area?: DwdCapAreaBlock | DwdCapAreaBlock[];
  parameter?: DwdCapParameterBlock | DwdCapParameterBlock[];
}

export interface DwdCapAreaBlock {
  areaDesc?: string;
  polygon?: string;
  geocode?: { valueName?: string; value?: string } | { valueName?: string; value?: string }[];
}

export interface DwdCapParameterBlock {
  valueName?: string;
  value?: string;
}

export interface DwdCapAlertDocument {
  identifier?: string;
  info?: DwdCapInfoBlock | DwdCapInfoBlock[];
}
