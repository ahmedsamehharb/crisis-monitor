import type { IngestionAdapter, ReportHandler } from '../adapter.types.js';
import { logger } from '../../../../shared/logger/logger.js';

/** TODO: poll DWD open data / CAP warnings for Baden-Württemberg */
export class DwdAdapter implements IngestionAdapter {
  readonly id = 'dwd' as const;
  readonly label = 'DWD Weather Warnings';

  start(_onReport: ReportHandler): void {
    logger.info(this.label, 'Stub adapter — implement in modules/ingestion/adapters/dwd/');
  }

  stop(): void {
    logger.info(this.label, 'Stopped');
  }
}
