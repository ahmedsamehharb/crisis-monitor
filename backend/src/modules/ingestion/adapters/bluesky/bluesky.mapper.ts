import { filterText } from '../../../../shared/utils/keywordFilter.js';
import type { IngestedReport } from '../../../normalization/report.types.js';
import type { BlueskyPost } from './bluesky.types.js';

export function blueskyPostUrl(post: BlueskyPost): string {
  const rkey = post.uri.split('/').pop();
  return `https://bsky.app/profile/${post.author.handle}/post/${rkey}`;
}

export function mapBlueskyPost(post: BlueskyPost): IngestedReport | null {
  const filter = filterText(post.record?.text || '');
  if (!filter.matches) return null;

  return {
    id: `bluesky:${post.uri}`,
    source: 'bluesky',
    sourceId: post.uri,
    rawText: filter.text,
    url: blueskyPostUrl(post),
    author: post.author.displayName || post.author.handle,
    createdAt: post.record?.createdAt || new Date().toISOString(),
    ingestedAt: new Date().toISOString(),
    keywords: filter.keywords,
    eventType: 'unknown',
    mediaUrls: [],
    metadata: { handle: post.author.handle },
  };
}
