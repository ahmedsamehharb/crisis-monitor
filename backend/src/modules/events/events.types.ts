import type { CrisisEventAggregate, CrisisEventDetail } from '../correlation/correlation.types.js';
import type { IngestedReport } from '../normalization/report.types.js';

export type { CrisisEventAggregate, CrisisEventDetail };

export interface EventListResponse {
  count: number;
  events: CrisisEventAggregate[];
}

export interface ReportListResponse {
  count: number;
  reports: IngestedReport[];
}
