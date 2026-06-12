import { config } from '../../app/config/index.js';
import { logger } from '../../shared/logger/logger.js';
import type { IngestionAdapter, ReportHandler } from '../ingestion/adapters/adapter.types.js';
import { fetchNinaWarnings } from './nina.client.js';
import { mapNinaToReport } from './nina.mapper.js';

/**
 * Polls NINA (Warnapp) warnings for crisis monitoring.
 * Emits crisis signals for correlation and scoring.
 */
export class NinaAdapter implements IngestionAdapter {
  readonly id = 'nina' as const;
  readonly label = 'NINA (Warnapp)';

  private onReport: ReportHandler | null = null;
  private seenSourceIds = new Set<string>();
  private initialized = false;
  private timer: ReturnType<typeof setInterval> | null = null;

  start(onReport: ReportHandler): void {
    this.onReport = onReport;

    logger.info(
      this.label,
      `Polling every ${config.nina.pollIntervalMs / 1000}s`
    );

    void this.poll();
    this.timer = setInterval(() => void this.poll(), config.nina.pollIntervalMs);
  }

  private async poll(): Promise<void> {
    try {
      const warnings = await fetchNinaWarnings();

      if (!warnings) {
        if (!this.initialized) {
          this.initialized = true;
          logger.info(this.label, 'Baseline set (no warnings). Watching for new warnings…');
        }
        return;
      }

      // TEMP TESTING: no BW filter — ingest all of Germany.
      let emitted = 0;

      for (const warning of warnings) {
        if (this.seenSourceIds.has(warning.id)) continue;
        this.seenSourceIds.add(warning.id);

        // TEMP TESTING: emit baseline warnings on the first run too.
        const report = mapNinaToReport(warning);
        this.onReport?.(report);
        emitted++;
      }

      if (!this.initialized) {
        this.initialized = true;
        logger.info(
          this.label,
          `Baseline emitted (${emitted} warnings, all of Germany). Watching for new warnings…`
        );
        return;
      }

      if (emitted > 0) {
        logger.info(this.label, `Emitted ${emitted} new warning(s)`);
      }
    } catch (err) {
      logger.error(this.label, 'Poll failed', err);
    }
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    logger.info(this.label, 'Stopped');
  }
}
