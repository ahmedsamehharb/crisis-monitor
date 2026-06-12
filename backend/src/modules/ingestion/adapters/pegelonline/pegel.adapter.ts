import type { IngestionAdapter, ReportHandler } from '../adapter.types.js';
import { logger } from '../../../../shared/logger/logger.js';

/** TODO: poll Pegelonline API for BW river levels */
export class PegelonlineAdapter implements IngestionAdapter {
  readonly id = 'pegelonline' as const;
  readonly label = 'Pegelonline';

  start(_onReport: ReportHandler): void {
    logger.info(this.label, 'Stub adapter — implement in modules/ingestion/adapters/pegelonline/');
  }

  stop(): void {
    logger.info(this.label, 'Stopped');
  }
}
