import type { RawEventData } from './nina.types.js';
import type { IngestedReport } from '../normalization/report.types.js';

export function mapNinaToReport(event: RawEventData): IngestedReport {
  return {
    id: `nina:${event.id}:${event.startDate}`,
    source: 'nina',
    sourceId: event.id || 'unknown',
    rawText: `${event.i18nTitle?.de || event.headline || ''} ${event.description || ''}`,
    url: event.sourceUrl,
    author: 'BKKatWWarn',
    createdAt: event.startDate,
    ingestedAt: new Date().toISOString(),
    keywords: ['infrastructure', 'warning'],
    eventType: 'infrastructure_failure',
    mediaUrls: [],
    metadata: {
      category: 'infrastructure',
      trustLevel: 1.0,
      headline: event.i18nTitle?.de,
      description: event.i18nDescription?.de,
      severity: event.severity,
      urgency: event.urgency,
      type: event.type,
      areaDesc: event.areaDesc,
      lat: event.location?.lat,
      lon: event.location?.lon,
    },
  };
}