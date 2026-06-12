import { config } from '../../../../app/config/index.js';
import { logger } from '../../../../shared/logger/logger.js';
import type { IngestionAdapter, ReportHandler } from '../adapter.types.js';
import type { PegelStation } from './pegel.types.js';
import { evaluatePegelStation, mapPegelAlert } from './pegel.mapper.js';

/**
 * Polls PEGELONLINE for water levels on BW-relevant rivers.
 * Alerts when levels approach or exceed flood marks (Meldestufen / Hochwasser).
 */
export class PegelonlineAdapter implements IngestionAdapter {
  readonly id = 'pegelonline' as const;
  readonly label = 'PEGELONLINE';

  private onReport: ReportHandler | null = null;
  private seenAlertKeys = new Set<string>();
  private initialized = false;
  private timer: ReturnType<typeof setInterval> | null = null;

  start(onReport: ReportHandler): void {
    this.onReport = onReport;

    const waters = config.pegelonline.waters.join(', ');
    logger.info(
      this.label,
      `Polling every ${config.pegelonline.pollIntervalMs / 1000}s — Gewässer: ${waters}`
    );

    void this.poll();
    this.timer = setInterval(
      () => void this.poll(),
      config.pegelonline.pollIntervalMs
    );
  }

  private async poll(): Promise<void> {
    try {
      const stations = await this.fetchStations();
      let alertCount = 0;

      for (const station of stations) {
        const alert = evaluatePegelStation(
          station,
          config.pegelonline.warningRatio
        );
        if (!alert) continue;

        alertCount++;
        const report = mapPegelAlert(alert);
        const dedupeKey = `${station.uuid}:${alert.severity}:${alert.thresholdLabel ?? 'state'}:${Math.floor(alert.waterLevelCm / 10)}`;

        if (this.seenAlertKeys.has(dedupeKey)) continue;
        this.seenAlertKeys.add(dedupeKey);

        if (!this.initialized) continue;

        this.onReport?.(report);
      }

      if (!this.initialized) {
        this.initialized = true;
        logger.info(
          this.label,
          `Baseline set (${stations.length} stations, ${alertCount} active alerts tracked). Watching for changes…`
        );
      }
    } catch (err) {
      logger.error(this.label, 'Poll failed', err);
    }
  }

  private async fetchStations(): Promise<PegelStation[]> {
    const url = new URL(
      `${config.pegelonline.apiBase}/stations.json`
    );
    url.searchParams.set('waters', config.pegelonline.waters.join(','));
    url.searchParams.set('includeTimeseries', 'true');
    url.searchParams.set('includeCurrentMeasurement', 'true');
    url.searchParams.set('includeCharacteristicValues', 'true');

    const response = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'CrisisMonitor/1.0' },
    });

    if (!response.ok) {
      throw new Error(`PEGELONLINE API error: ${response.status}`);
    }

    const data = (await response.json()) as PegelStation[];
    return Array.isArray(data) ? data : [];
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    logger.info(this.label, 'Stopped');
  }
}
