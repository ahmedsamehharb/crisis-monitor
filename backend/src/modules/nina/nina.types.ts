export interface RawEventData {
  id: string;
  version: number;
  startDate: string;
  severity: string;
  urgency: string;
  type: string;
  i18nTitle: {
    de: string;
    en: string;
  };
  i18nDescription?: {
    de: string;
    en: string;
  };
  areaDesc?: string;
  location?: {
    lat: number;
    lon: number;
  };
  sourceName: string;
  sourceUrl: string;
  description: string;
  headline?: string;
  lat?: number | null;
  lon?: number | null;
  trustLevel?: number;
}

export interface NinaApiResponse {
  id: string;
  version: number;
  startDate: string;
  severity: string;
  urgency: string;
  type: string;
  i18nTitle: {
    de: string;
  };
  i18nDescription: {
    de: string;
  };
  areaDesc: string;
  location: {
    lat: number;
  };
}