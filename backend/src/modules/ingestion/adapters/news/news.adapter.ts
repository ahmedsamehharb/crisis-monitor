import type { IngestionAdapter, ReportHandler } from '../adapter.types.js';
import { logger } from '../../../../shared/logger/logger.js';

/** TODO: ingest local news portals (SWR, Stuttgarter Zeitung, etc.) via RSS/scrape */
export class NewsAdapter implements IngestionAdapter {
  readonly id = 'news' as const;
  readonly label = 'Local News';

  start(_onReport: ReportHandler): void {
    logger.info(this.label, 'Stub adapter — implement in modules/ingestion/adapters/news/');
  }

  stop(): void {
    logger.info(this.label, 'Stopped');
  }
}
