/**
 * Optional scheduler for batch / cron-based ingestion jobs.
 * Social adapters use internal intervals; use this for DWD, Pegel, news RSS, etc.
 *
 * TODO: integrate node-cron or bullmq for scheduled pulls.
 */
export class IngestionScheduler {
  start(): void {
    // placeholder
  }

  stop(): void {
    // placeholder
  }
}

export const ingestionScheduler = new IngestionScheduler();
