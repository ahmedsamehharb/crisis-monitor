/** TODO: DWD (Deutscher Wetterdienst) warning API response types */
export interface DwdWarning {
  headline: string;
  description: string;
  onset: string;
  expires?: string;
  areaDesc: string;
}
