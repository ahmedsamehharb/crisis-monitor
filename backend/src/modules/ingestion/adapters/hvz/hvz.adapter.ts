import type { IngestionAdapter, ReportHandler } from '../adapter.types.js';
import { logger } from '../../../../shared/logger/logger.js';

/** TODO: ingest Verkehrslage / HVZ (Hochwasser?) traffic or flood data for BW */
export class HvzAdapter implements IngestionAdapter {
  readonly id = 'hvz' as const;
  readonly label = 'HVZ';

  start(_onReport: ReportHandler): void {
    logger.info(this.label, 'Stub adapter — implement in modules/ingestion/adapters/hvz/');
  }

  stop(): void {
    logger.info(this.label, 'Stopped');
  }
}
