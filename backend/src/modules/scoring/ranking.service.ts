import type { IngestedReport } from '../normalization/report.types.js';
import type { ReportScores } from './scoring.types.js';
import { credibilityService } from './credibility.service.js';
import { severityService } from './severity.service.js';

/** TODO: rank reports for municipal triage dashboard */
export class RankingService {
  scoreReport(report: IngestedReport): ReportScores {
    return {
      credibility: credibilityService.score(report),
      severity: severityService.score(report),
      urgency: severityService.score(report),
      relevance: 0.5,
    };
  }
}

export const rankingService = new RankingService();
