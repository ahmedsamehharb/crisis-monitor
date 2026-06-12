export interface Region {
  name: string;
  lat: number;
  lon: number;
}

/** Radius um eine gewählte Gegend, innerhalb dessen Ereignisse angezeigt werden. */
export const REGION_RADIUS_KM = 20;

/** Größere Städte/Gemeinden in Baden-Württemberg mit Koordinaten für die Umkreis-Filterung. */
export const BW_REGIONS: Region[] = [
  { name: "Stuttgart", lat: 48.7758, lon: 9.1829 },
  { name: "Karlsruhe", lat: 49.0069, lon: 8.4037 },
  { name: "Mannheim", lat: 49.4875, lon: 8.466 },
  { name: "Freiburg", lat: 47.999, lon: 7.8421 },
  { name: "Heidelberg", lat: 49.3988, lon: 8.6724 },
  { name: "Heilbronn", lat: 49.1427, lon: 9.2109 },
  { name: "Ulm", lat: 48.4011, lon: 9.9876 },
  { name: "Pforzheim", lat: 48.8922, lon: 8.6946 },
  { name: "Reutlingen", lat: 48.4914, lon: 9.2043 },
  { name: "Tübingen", lat: 48.5216, lon: 9.0576 },
  { name: "Esslingen", lat: 48.7394, lon: 9.3108 },
  { name: "Ludwigsburg", lat: 48.8975, lon: 9.1916 },
  { name: "Konstanz", lat: 47.6603, lon: 9.1758 },
  { name: "Villingen-Schwenningen", lat: 48.0622, lon: 8.4594 },
  { name: "Friedrichshafen", lat: 47.6549, lon: 9.4744 },
  { name: "Offenburg", lat: 48.4707, lon: 7.9409 },
  { name: "Aalen", lat: 48.8365, lon: 10.0932 },
  { name: "Sigmaringen", lat: 48.0879, lon: 9.2186 },
  { name: "Schwäbisch Hall", lat: 49.1102, lon: 9.7384 },
  { name: "Lörrach", lat: 47.6151, lon: 7.6608 },
];

/** Distanz zwischen zwei Koordinaten in km (Haversine). */
export function haversineKm(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number }
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
