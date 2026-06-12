import { config } from '../../../../app/config/index.js';
import { logger } from '../../../../shared/logger/logger.js';
import { CRISIS_KEYWORDS } from '../../../../shared/constants/crisisKeywords.js';
import type { IngestionAdapter, ReportHandler } from '../adapter.types.js';
import type { MastodonSearchResponse } from './mastodon.types.js';
import { mapMastodonStatus } from './mastodon.mapper.js';

/**
 * Polls Mastodon keyword search (reliable on mastodon.social).
 * TODO: add stream/timeline modes via mastodon.stream.ts when needed.
 */
export class MastodonAdapter implements IngestionAdapter {
  readonly id = 'mastodon' as const;
  readonly label = 'Mastodon Search';

  private onReport: ReportHandler | null = null;
  private seenIds = new Set<string>();
  private initialized = false;
  private timer: ReturnType<typeof setInterval> | null = null;

  start(onReport: ReportHandler): void {
    this.onReport = onReport;

    if (!config.mastodon.accessToken) {
      logger.warn(this.label, 'MASTODON_ACCESS_TOKEN is not set — adapter disabled');
      return;
    }

    logger.info(
      this.label,
      `Polling every ${config.mastodon.pollIntervalMs / 1000}s: ${CRISIS_KEYWORDS.join(', ')}`
    );

    void this.poll();
    this.timer = setInterval(() => void this.poll(), config.mastodon.pollIntervalMs);
  }

  private async poll(): Promise<void> {
    for (const keyword of CRISIS_KEYWORDS) {
      await this.pollKeyword(keyword);
    }

    if (!this.initialized) {
      this.initialized = true;
      logger.info(
        this.label,
        `Baseline set (${this.seenIds.size} posts). Watching for new matches…`
      );
    }
  }

  private async pollKeyword(keyword: string): Promise<void> {
    const url = new URL(`https://${config.mastodon.instance}/api/v2/search`);
    url.searchParams.set('q', keyword);
    url.searchParams.set('type', 'statuses');
    url.searchParams.set('resolve', 'false');
    url.searchParams.set('limit', '20');

    try {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${config.mastodon.accessToken}` },
      });

      if (!response.ok) {
        logger.error(this.label, `Search failed for "${keyword}": ${response.status}`);
        return;
      }

      const data = (await response.json()) as MastodonSearchResponse;

      for (const status of data.statuses || []) {
        if (this.seenIds.has(status.id)) continue;
        this.seenIds.add(status.id);
        if (!this.initialized) continue;

        const report = mapMastodonStatus(status);
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
