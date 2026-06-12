import { config } from '../../../../app/config/index.js';
import { logger } from '../../../../shared/logger/logger.js';
import type { IngestionAdapter, ReportHandler } from '../adapter.types.js';
import { fetchFirmsHotspots } from './fires.client.js';
import {
  firmsHotspotSourceId,
  mapFirmsHotspotToReport,
} from './fires.mapper.js';
import type { FirmsHotspot } from './fires.types.js';

const DEDUPE_WINDOW_MS = 60 * 60 * 1000;

function gridKey(lat: number, lon: number, cellDeg = 0.02): string {
  const latCell = Math.round(lat / cellDeg) * cellDeg;
  const lonCell = Math.round(lon / cellDeg) * cellDeg;
  return `${latCell.toFixed(2)}:${lonCell.toFixed(2)}`;
}

function clusterSizes(hotspots: FirmsHotspot[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const h of hotspots) {
    const key = gridKey(h.latitude, h.longitude);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function dedupeKey(hotspot: FirmsHotspot): string {
  const lat = hotspot.latitude.toFixed(2);
  const lon = hotspot.longitude.toFixed(2);
  const timeBucket = Math.floor(
    new Date(`${hotspot.acq_date}T00:00:00Z`).getTime() / DEDUPE_WINDOW_MS
  );
  return `${lat}:${lon}:${hotspot.acq_date}:${hotspot.acq_time}:${timeBucket}`;
}

/**
 * Polls NASA FIRMS for thermal fire anomalies in Baden-Württemberg.
 */
export class FirmsAdapter implements IngestionAdapter {
  readonly id = 'firms' as const;
  readonly label = 'NASA FIRMS';

  private onReport: ReportHandler | null = null;
  private seenKeys = new Set<string>();
  private initialized = false;
  private timer: ReturnType<typeof setInterval> | null = null;

  start(onReport: ReportHandler): void {
    this.onReport = onReport;

    logger.info(
      this.label,
      `Polling every ${config.firms.pollIntervalMs / 1000}s — BW bounding box, source: ${config.firms.source}`
    );

    void this.poll();
    this.timer = setInterval(
      () => void this.poll(),
      config.firms.pollIntervalMs
    );
  }

  private async poll(): Promise<void> {
    try {
      const hotspots = await fetchFirmsHotspots();
      const clusters = clusterSizes(hotspots);
      let newCount = 0;

      for (const hotspot of hotspots) {
        const key = dedupeKey(hotspot);
        if (this.seenKeys.has(key)) continue;

        this.seenKeys.add(key);
        newCount++;

        if (!this.initialized) continue;

        const clusterSize =
          clusters.get(gridKey(hotspot.latitude, hotspot.longitude)) ?? 1;
        const report = mapFirmsHotspotToReport(hotspot, { clusterSize });
        this.onReport?.(report);
      }

      if (!this.initialized) {
        this.initialized = true;
        logger.info(
          this.label,
          `Baseline set (${hotspots.length} hotspots in BW, ${this.seenKeys.size} dedupe keys). Watching for new detections…`
        );
        return;
      }

      if (newCount > 0) {
        logger.info(this.label, `${newCount} new hotspot(s) ingested`);
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
