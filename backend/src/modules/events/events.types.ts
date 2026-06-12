import type { IngestedReport } from '../normalization/report.types.js';

export interface EventListItem extends IngestedReport {
  credibilityScore?: number;
  severityScore?: number;
}
