import { matchCrisisText } from '../../../../shared/utils/keywordFilter.js';
import type { IngestedReport } from '../../../normalization/report.types.js';
import type { BlueskyPost } from './bluesky.types.js';

export function blueskyPostUrl(post: BlueskyPost): string {
  const rkey = post.uri.split('/').pop();
  return `https://bsky.app/profile/${post.author.handle}/post/${rkey}`;
}

export function mapBlueskyPost(post: BlueskyPost): IngestedReport | null {
  const match = matchCrisisText(post.record?.text || '');
  if (!match.matches) return null;

  return {
    id: `bluesky:${post.uri}`,
    source: 'bluesky',
    sourceId: post.uri,
    rawText: match.text,
    url: blueskyPostUrl(post),
    author: post.author.displayName || post.author.handle,
    createdAt: post.record?.createdAt || new Date().toISOString(),
    ingestedAt: new Date().toISOString(),
    keywords: match.keywords,
    eventType: match.eventType,
    mediaUrls: [],
    metadata: { handle: post.author.handle },
  };
}
