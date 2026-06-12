import type { IngestedReport } from '../normalization/report.types.js';

/** TODO: classify event type + severity from text/media (LLM or rules) */
export class SeverityService {
  score(_report: IngestedReport): number {
    return 0.5;
  }
}

export const severityService = new SeverityService();
