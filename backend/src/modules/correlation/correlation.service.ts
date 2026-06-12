import type { IngestedReport } from '../normalization/report.types.js';
import { textSimilarity } from './similarity.service.js';

/** TODO: correlate reports across sources by time, location, and similarity */
export class CorrelationService {
  findRelated(report: IngestedReport, candidates: IngestedReport[]): IngestedReport[] {
    return candidates.filter(
      (c) => c.id !== report.id && textSimilarity(c.rawText, report.rawText) > 0.5
    );
  }
}

export const correlationService = new CorrelationService();
