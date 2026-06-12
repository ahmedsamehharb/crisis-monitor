import type { IngestedReport } from '../normalization/report.types.js';

/** TODO: merge related reports into a single CrisisEvent */
export class EventMergerService {
  merge(_reports: IngestedReport[]): string | null {
    return null;
  }
}

export const eventMergerService = new EventMergerService();
