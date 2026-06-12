import type { IngestedReport } from '../normalization/report.types.js';
import type { ReportScores } from './scoring.types.js';
import { credibilityService } from './credibility.service.js';
import { severityService } from './severity.service.js';

/** Rank reports for municipal triage dashboard */
export class RankingService {
  scoreReport(report: IngestedReport): ReportScores {
    const credibility =
      report.trust ?? credibilityService.score(report);
    const severity =
      report.severity ?? severityService.score(report);

    return {
      credibility,
      severity,
      urgency: severity,
      relevance: credibility * 0.4 + severity * 0.6,
    };
  }
}

export const rankingService = new RankingService();
