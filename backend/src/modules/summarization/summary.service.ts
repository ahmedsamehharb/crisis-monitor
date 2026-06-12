import type { IngestedReport } from '../normalization/report.types.js';
import type { SituationSummary } from './summary.types.js';

/** TODO: generate structured situational overview for crisis teams (LLM) */
export class SummaryService {
  async summarize(_reports: IngestedReport[]): Promise<SituationSummary | null> {
    return null;
  }
}

export const summaryService = new SummaryService();
