import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from '../../app/config/index.js';
import { logger } from '../../shared/logger/logger.js';
import { BW_CITIES, BW_CITY_REGEX } from './bw-cities.js';
import { chatCompletion } from './llm.client.js';
import type { ExtractedLocation, LocationType } from './location.types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROMPT_TEMPLATE = readFileSync(
  join(__dirname, 'prompts', 'extract-location.txt'),
  'utf-8'
);

const extractionCache = new Map<string, ExtractedLocation[]>();

const LOCATION_TYPES = new Set<LocationType>([
  'address',
  'city',
  'district',
  'state',
  'river',
  'landmark',
  'highway',
  'region',
  'unknown',
]);

const BW_STATE = 'Baden-Württemberg';
const BW_COUNTRY = 'Deutschland';

const CITY_ALT = BW_CITIES.map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');

/** German street names ending in Straße, Weg, Platz, etc. */
const STREET_SUFFIX =
  '(?:straße|str\\.?|weg|platz|allee|gasse|ring|damm|ufer|brücke|chaussee)';
const STREET_NAME = `[A-ZÄÖÜ][\\wäöüß-]*${STREET_SUFFIX}`;

const IN_KNOWN_CITY_PATTERN = new RegExp(
  `\\b(?:in|bei|nahe|um|Richtung|Raum)\\s+(${CITY_ALT})(?!\\s+${STREET_NAME})\\b`,
  'gi'
);

/** "in Heilbronn Südstraße", "bei Stuttgart Königstraße" */
const IN_CITY_STREET_PATTERN = new RegExp(
  `\\b(?:in|bei|nahe)\\s+(${CITY_ALT})\\s+(${STREET_NAME})\\b`,
  'gi'
);

/** "Heilbronn Südstraße" without preposition */
const CITY_STREET_PATTERN = new RegExp(
  `\\b(${CITY_ALT})\\s+(${STREET_NAME})\\b`,
  'gi'
);

/** "Südstraße in Heilbronn" */
const STREET_IN_CITY_PATTERN = new RegExp(
  `\\b(${STREET_NAME})\\s+in\\s+(${CITY_ALT})\\b`,
  'gi'
);

/** "an der Wilhelmstraße", "in der Südstraße" */
const PREPOSITION_STREET_PATTERN = new RegExp(
  `\\b(?:an|in|auf)\\s+(?:der|die|dem|am|im)?\\s*(${STREET_NAME})\\b`,
  'gi'
);

const HASHTAG_PATTERN = /#([A-Za-zÄÖÜäöüß][\wäöüß-]{1,30})/g;
const HIGHWAY_PATTERN = /\b([AB]\s?\d{1,3})\b/gi;
const RIVER_PATTERN =
  /\b(Neckar|Rhein|Donau|Main|Kocher|Enz|Murg|Kinzig|Iller|Tauber|Schwarzwald|Bodensee)\b/gi;

function addressLocation(
  city: string,
  street: string,
  rawMention: string,
  confidence = 0.9
): ExtractedLocation {
  return {
    city,
    street,
    rawMention,
    confidence,
    locationType: 'address',
    state: BW_STATE,
    country: BW_COUNTRY,
  };
}

function normalizeLocationType(value: unknown): LocationType {
  if (typeof value === 'string' && LOCATION_TYPES.has(value as LocationType)) {
    return value as LocationType;
  }
  return 'unknown';
}

function clampConfidence(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(n)) return 0.5;
  return Math.min(1, Math.max(0, n));
}

function parseLlmJson(content: string): ExtractedLocation[] {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonText = fenced ? fenced[1].trim() : trimmed;

  const start = jsonText.indexOf('[');
  const end = jsonText.lastIndexOf(']');
  if (start === -1 || end === -1) return [];

  const parsed = JSON.parse(jsonText.slice(start, end + 1)) as unknown;
  if (!Array.isArray(parsed)) return [];

  return parsed
    .filter((item): item is Record<string, unknown> => item !== null && typeof item === 'object')
    .map((item) => normalizeExtracted({
      street: str(item.street),
      houseNumber: str(item.houseNumber),
      city: str(item.city),
      district: str(item.district),
      state: str(item.state),
      country: str(item.country),
      postalCode: str(item.postalCode),
      river: str(item.river),
      landmark: str(item.landmark),
      highway: str(item.highway),
      rawMention: str(item.rawMention) || str(item.city) || str(item.street) || str(item.landmark) || 'unknown',
      confidence: clampConfidence(item.confidence),
      locationType: normalizeLocationType(item.locationType),
    }))
    .filter((loc) => loc.rawMention !== 'unknown' || loc.city || loc.street || loc.river);
}

function str(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const t = value.trim();
  return t.length > 0 ? t : undefined;
}

/** Infer address type when street + city are both present. */
function normalizeExtracted(loc: ExtractedLocation): ExtractedLocation {
  if (loc.street && loc.city && loc.locationType === 'city') {
    return { ...loc, locationType: 'address' };
  }
  if (loc.street && !loc.city && loc.locationType === 'unknown') {
    return { ...loc, locationType: 'address' };
  }
  return loc;
}

function dedupe(locations: ExtractedLocation[]): ExtractedLocation[] {
  const seen = new Set<string>();
  const out: ExtractedLocation[] = [];

  for (const loc of locations.sort((a, b) => specificityScore(b) - specificityScore(a))) {
    const key = [
      loc.city,
      loc.street,
      loc.houseNumber,
      loc.river,
      loc.landmark,
      loc.highway,
    ]
      .filter(Boolean)
      .join('|')
      .toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(loc);
  }

  return out;
}

function specificityScore(loc: ExtractedLocation): number {
  const typePriority: Record<LocationType, number> = {
    address: 5,
    landmark: 4,
    city: 3,
    highway: 2,
    river: 2,
    district: 2,
    region: 1,
    state: 1,
    unknown: 0,
  };
  let score = typePriority[loc.locationType] + loc.confidence;
  if (loc.street && loc.city) score += 2;
  else if (loc.street) score += 0.5;
  return score;
}

/**
 * Merge street-only and city-only fragments from the same text into full addresses.
 */
export function consolidateLocations(
  locations: ExtractedLocation[],
  text: string
): ExtractedLocation[] {
  const merged = locations.map(normalizeExtracted);
  const lower = text.toLowerCase();

  const streets = merged.filter((l) => l.street && !l.city);
  const cities = merged.filter((l) => l.city && !l.street);

  for (const streetLoc of streets) {
    const street = streetLoc.street!;
    const cityHit = cities.find((c) => lower.includes(c.city!.toLowerCase()));
    if (cityHit) {
      merged.push(
        addressLocation(
          cityHit.city!,
          street,
          `${cityHit.city} ${street}`,
          Math.max(streetLoc.confidence, cityHit.confidence) + 0.05
        )
      );
    }
  }

  return dedupe(merged);
}

/** Rule-based extraction: streets first, then cities, highways, rivers. */
export function extractLocationsHeuristic(text: string): ExtractedLocation[] {
  const locations: ExtractedLocation[] = [];
  const usedCities = new Set<string>();

  const addAddress = (city: string, street: string, rawMention: string) => {
    usedCities.add(city.toLowerCase());
    locations.push(addressLocation(city, street, rawMention));
  };

  for (const match of text.matchAll(IN_CITY_STREET_PATTERN)) {
    addAddress(match[1], match[2], match[0]);
  }

  for (const match of text.matchAll(CITY_STREET_PATTERN)) {
    addAddress(match[1], match[2], match[0]);
  }

  for (const match of text.matchAll(STREET_IN_CITY_PATTERN)) {
    addAddress(match[2], match[1], match[0]);
  }

  for (const match of text.matchAll(PREPOSITION_STREET_PATTERN)) {
    locations.push({
      street: match[1],
      rawMention: match[0],
      confidence: 0.82,
      locationType: 'address',
      state: BW_STATE,
      country: BW_COUNTRY,
    });
  }

  for (const match of text.matchAll(HASHTAG_PATTERN)) {
    const name = match[1];
    if (name.length < 3) continue;
    locations.push({
      city: name,
      rawMention: `#${name}`,
      confidence: 0.75,
      locationType: 'city',
      state: BW_STATE,
      country: BW_COUNTRY,
    });
  }

  for (const match of text.matchAll(IN_KNOWN_CITY_PATTERN)) {
    const city = match[1];
    if (usedCities.has(city.toLowerCase())) continue;
    locations.push({
      city,
      rawMention: match[0],
      confidence: 0.8,
      locationType: 'city',
      state: BW_STATE,
      country: BW_COUNTRY,
    });
  }

  for (const match of text.matchAll(BW_CITY_REGEX)) {
    const city = match[1];
    if (usedCities.has(city.toLowerCase())) continue;
    locations.push({
      city,
      rawMention: city,
      confidence: 0.85,
      locationType: 'city',
      state: BW_STATE,
      country: BW_COUNTRY,
    });
  }

  for (const match of text.matchAll(HIGHWAY_PATTERN)) {
    const highway = match[1].replace(/\s/g, '').toUpperCase();
    locations.push({
      highway,
      rawMention: match[0],
      confidence: 0.65,
      locationType: 'highway',
      state: BW_STATE,
      country: BW_COUNTRY,
    });
  }

  for (const match of text.matchAll(RIVER_PATTERN)) {
    locations.push({
      river: match[0],
      rawMention: match[0],
      confidence: 0.7,
      locationType: 'river',
      state: BW_STATE,
      country: BW_COUNTRY,
    });
  }

  return consolidateLocations(locations, text);
}

export async function extractLocationsFromText(text: string): Promise<ExtractedLocation[]> {
  const normalized = text.trim();
  if (!normalized) return [];

  if (extractionCache.has(normalized)) {
    return extractionCache.get(normalized)!;
  }

  const heuristic = extractLocationsHeuristic(normalized);

  if (!config.geocoding.llmApiKey) {
    const result = consolidateLocations(heuristic, normalized);
    extractionCache.set(normalized, result);
    return result;
  }

  try {
    const userPrompt = PROMPT_TEMPLATE.replace('{{TEXT}}', normalized.slice(0, 2000));
    const content = await chatCompletion([
      {
        role: 'system',
        content:
          'Du bist ein präziser Geokodierungs-Assistent für deutsche Krisenmeldungen. Antworte nur mit JSON.',
      },
      { role: 'user', content: userPrompt },
    ]);

    const llmLocations = parseLlmJson(content).map(normalizeExtracted);
    const merged = consolidateLocations(dedupe([...llmLocations, ...heuristic]), normalized);
    extractionCache.set(normalized, merged);
    return merged;
  } catch (err) {
    logger.warn('LocationExtractor', 'LLM extraction failed, using heuristics', err);
    const result = consolidateLocations(heuristic, normalized);
    extractionCache.set(normalized, result);
    return result;
  }
}

export function pickBestLocation(locations: ExtractedLocation[]): ExtractedLocation | null {
  const eligible = locations.filter(
    (loc) => loc.confidence >= config.geocoding.minConfidence
  );
  if (eligible.length === 0) return null;

  return [...eligible].sort(
    (a, b) => specificityScore(b) - specificityScore(a)
  )[0];
}
