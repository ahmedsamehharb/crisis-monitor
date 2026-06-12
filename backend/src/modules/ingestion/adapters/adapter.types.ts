import type { IngestedReport } from '../../normalization/report.types.js';
import type { DataSourceId } from '../../../shared/types/index.js';

export type ReportHandler = (report: IngestedReport) => void;

export interface IngestionAdapter {
  readonly id: DataSourceId;
  readonly label: string;
  start(onReport: ReportHandler): void | Promise<void>;
  stop(): void;
}
