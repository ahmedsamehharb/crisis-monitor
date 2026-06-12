import { config } from '../../../../app/config/index.js';
import { logger } from '../../../../shared/logger/logger.js';
import type { IngestionAdapter, ReportHandler } from '../adapter.types.js';
import {
  fetchCapDiffWarnings,
  fetchJsonWarnings,
  filterDwdWarnings,
} from './dwd.client.js';
import { mapDwdWarningToReport } from './dwd.mapper.js';

/**
 * Polls DWD official weather warnings (CAP Open Data + JSON fallback).
 * Emits high-trust crisis confirmation signals for correlation and scoring.
 */
export class DwdAdapter implements IngestionAdapter {
  readonly id = 'dwd' as const;
  readonly label = 'DWD Weather Warnings';

  private onReport: ReportHandler | null = null;
  private seenSourceIds = new Set<string>();
  private seenCapFiles = new Set<string>();
  private initialized = false;
  private timer: ReturnType<typeof setInterval> | null = null;

  start(onReport: ReportHandler): void {
    this.onReport = onReport;

    const scope = config.dwd.bwOnly ? 'Baden-Württemberg' : 'Germany';
    logger.info(
      this.label,
      `Polling every ${config.dwd.pollIntervalMs / 1000}s — source: ${config.dwd.source}, scope: ${scope}`
    );

    void this.poll();
    this.timer = setInterval(() => void this.poll(), config.dwd.pollIntervalMs);
  }

  private async poll(): Promise<void> {
    try {
      const warnings = await this.fetchWarnings();
      const active = filterDwdWarnings(warnings, { bwOnly: config.dwd.bwOnly });
      let emitted = 0;

      for (const warning of active) {
        if (this.seenSourceIds.has(warning.sourceId)) continue;
        this.seenSourceIds.add(warning.sourceId);

        if (!this.initialized) continue;

        const report = mapDwdWarningToReport(warning);
        this.onReport?.(report);
        emitted++;
      }

      if (!this.initialized) {
        this.initialized = true;
        logger.info(
          this.label,
          `Baseline set (${active.length} active warnings, ${this.seenSourceIds.size} IDs). Watching for new warnings…`
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

  private async fetchWarnings() {
    const mode = config.dwd.source;

    if (mode === 'json') {
      return fetchJsonWarnings();
    }

    if (mode === 'cap') {
      const { warnings, newFiles } = await fetchCapDiffWarnings(this.seenCapFiles);
      for (const file of newFiles) {
        this.seenCapFiles.add(file);
      }
      return warnings;
    }

    // auto: poll JSON each cycle; also check CAP diff for incremental updates
    const [jsonWarnings, capResult] = await Promise.all([
      fetchJsonWarnings().catch((err) => {
        logger.warn(this.label, 'JSON fetch failed in auto mode', err);
        return [];
      }),
      fetchCapDiffWarnings(this.seenCapFiles).catch((err) => {
        logger.warn(this.label, 'CAP diff fetch failed in auto mode', err);
        return { warnings: [], newFiles: [] as string[] };
      }),
    ]);

    for (const file of capResult.newFiles) {
      this.seenCapFiles.add(file);
    }

    const merged = new Map<string, (typeof jsonWarnings)[number]>();
    for (const w of [...jsonWarnings, ...capResult.warnings]) {
      merged.set(w.sourceId, w);
    }
    return [...merged.values()];
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    logger.info(this.label, 'Stopped');
  }
}
