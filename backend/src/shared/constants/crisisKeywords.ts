import type { CrisisEventType } from '../types/index.js';

/** Search keyword → crisis event type for Mastodon / Bluesky ingestion */
export const CRISIS_KEYWORD_CONFIG = [
  { keyword: 'Feuerwehr', eventType: 'wildfire' as const },
  { keyword: 'Überschwemmung', eventType: 'flood' as const },
  { keyword: 'Unfall', eventType: 'traffic_accident' as const },
  { keyword: 'Sturm', eventType: 'storm' as const },
] as const;

export const CRISIS_KEYWORDS = CRISIS_KEYWORD_CONFIG.map((entry) => entry.keyword);

export type CrisisKeyword = (typeof CRISIS_KEYWORDS)[number];

const KEYWORD_EVENT_TYPE = new Map<string, CrisisEventType>(
  CRISIS_KEYWORD_CONFIG.map((entry) => [
    entry.keyword.toLowerCase(),
    entry.eventType,
  ])
);

/** When multiple keywords match, prefer this order (most specific incident first). */
const EVENT_TYPE_PRIORITY: CrisisEventType[] = [
  'flood',
  'wildfire',
  'storm',
  'traffic_accident',
];

export function eventTypeForKeyword(keyword: string): CrisisEventType | undefined {
  return KEYWORD_EVENT_TYPE.get(keyword.toLowerCase());
}

export function inferEventTypeFromKeywords(
  matchedKeywords: readonly string[]
): CrisisEventType {
  if (matchedKeywords.length === 0) return 'unknown';

  const types = new Set(
    matchedKeywords
      .map((kw) => eventTypeForKeyword(kw))
      .filter((t): t is CrisisEventType => t !== undefined)
  );

  for (const priority of EVENT_TYPE_PRIORITY) {
    if (types.has(priority)) return priority;
  }

  return 'unknown';
}
