import { CRISIS_KEYWORDS } from '../constants/crisisKeywords.js';

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

export function filterText(text: string) {
  const normalized = (text || '').trim();
  const keywords = findMatchingKeywords(normalized);
  return { matches: keywords.length > 0, keywords, text: normalized };
}
