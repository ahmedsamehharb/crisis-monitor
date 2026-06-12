import type { CrisisEventType } from '../types/index.js';
import {
  CRISIS_KEYWORDS,
  inferEventTypeFromKeywords,
} from '../constants/crisisKeywords.js';

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function findMatchingKeywords(
  text: string,
  keywords: readonly string[] = CRISIS_KEYWORDS
): string[] {
  const normalized = text.toLowerCase();
  return keywords.filter((keyword) =>
    normalized.includes(keyword.toLowerCase())
  );
}

export interface CrisisTextMatch {
  matches: boolean;
  keywords: string[];
  text: string;
  eventType: CrisisEventType;
}

export function matchCrisisText(text: string): CrisisTextMatch {
  const normalized = (text || '').trim();
  const keywords = findMatchingKeywords(normalized);
  const eventType = inferEventTypeFromKeywords(keywords);

  return {
    matches: keywords.length > 0,
    keywords,
    text: normalized,
    eventType,
  };
}

/** @deprecated Use matchCrisisText */
export function filterText(text: string) {
  const result = matchCrisisText(text);
  return {
    matches: result.matches,
    keywords: result.keywords,
    text: result.text,
  };
}
