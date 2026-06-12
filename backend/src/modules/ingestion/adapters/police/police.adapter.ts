import type { IngestionAdapter, ReportHandler } from '../adapter.types.js';
import { logger } from '../../../../shared/logger/logger.js';

/** TODO: ingest public police press releases / RSS for BW Länder */
export class PoliceAdapter implements IngestionAdapter {
  readonly id = 'police' as const;
  readonly label = 'Police Press';

  start(_onReport: ReportHandler): void {
    logger.info(this.label, 'Stub adapter — implement in modules/ingestion/adapters/police/');
  }

  stop(): void {
    logger.info(this.label, 'Stopped');
  }
}
