import { filterText, stripHtml } from '../../../../shared/utils/keywordFilter.js';
import type { IngestedReport } from '../../../normalization/report.types.js';
import type { MastodonStatus } from './mastodon.types.js';

export function mapMastodonStatus(status: MastodonStatus): IngestedReport | null {
  const target = status.reblog || status;
  const text = stripHtml(target.content || '');
  const filter = filterText(text);

  if (!filter.matches) return null;

  return {
    id: `mastodon:${target.id}`,
    source: 'mastodon',
    sourceId: target.id,
    rawText: filter.text,
    url: target.url || '',
    author: target.account?.display_name || target.account?.username || 'unknown',
    createdAt: target.created_at || new Date().toISOString(),
    ingestedAt: new Date().toISOString(),
    keywords: filter.keywords,
    eventType: 'unknown',
    mediaUrls: [],
    metadata: { instance: 'mastodon' },
  };
}
