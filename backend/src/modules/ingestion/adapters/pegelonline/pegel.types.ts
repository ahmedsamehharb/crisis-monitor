/** TODO: Pegelonline water level station types */
export interface PegelStationReading {
  stationId: string;
  waterLevelCm: number;
  timestamp: string;
  riverName: string;
}
