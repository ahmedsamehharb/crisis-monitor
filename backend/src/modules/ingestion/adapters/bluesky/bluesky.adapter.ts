import { config } from '../../../../app/config/index.js';
import { logger } from '../../../../shared/logger/logger.js';
import { CRISIS_KEYWORDS } from '../../../../shared/constants/crisisKeywords.js';
import type { IngestionAdapter, ReportHandler } from '../adapter.types.js';
import type { BlueskySearchResponse } from './bluesky.types.js';
import { mapBlueskyPost } from './bluesky.mapper.js';

/**
 * Polls Bluesky search API for crisis keywords.
 * TODO: add Jetstream WebSocket adapter for lower-latency ingestion.
 */
export class BlueskyAdapter implements IngestionAdapter {
  readonly id = 'bluesky' as const;
  readonly label = 'Bluesky Search';

  private onReport: ReportHandler | null = null;
  private seenUris = new Set<string>();
  private initialized = false;
  private timer: ReturnType<typeof setInterval> | null = null;

  start(onReport: ReportHandler): void {
    this.onReport = onReport;

    logger.info(
      this.label,
      `Polling every ${config.bluesky.pollIntervalMs / 1000}s: ${CRISIS_KEYWORDS.join(', ')}`
    );

    void this.poll();
    this.timer = setInterval(() => void this.poll(), config.bluesky.pollIntervalMs);
  }

  private async poll(): Promise<void> {
    for (const keyword of CRISIS_KEYWORDS) {
      await this.pollKeyword(keyword);
    }

    if (!this.initialized) {
      this.initialized = true;
      logger.info(
        this.label,
        `Baseline set (${this.seenUris.size} posts). Watching for new matches…`
      );
    }
  }

  private async pollKeyword(keyword: string): Promise<void> {
    const url = new URL(`${config.bluesky.apiBase}/xrpc/app.bsky.feed.searchPosts`);
    url.searchParams.set('q', keyword);
    url.searchParams.set('limit', '25');

    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'CrisisMonitor/1.0' },
      });

      if (!response.ok) {
        logger.error(this.label, `Search failed for "${keyword}": ${response.status}`);
        return;
      }

      const data = (await response.json()) as BlueskySearchResponse;

      for (const post of data.posts || []) {
        if (this.seenUris.has(post.uri)) continue;
        this.seenUris.add(post.uri);
        if (!this.initialized) continue;

        const report = mapBlueskyPost(post);
        if (report) this.onReport?.(report);
      }
    } catch (err) {
      logger.error(this.label, `Poll error for "${keyword}"`, err);
    }
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    logger.info(this.label, 'Stopped');
  }
}
