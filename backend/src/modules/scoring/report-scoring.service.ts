import { logger } from '../../shared/logger/logger.js';
import { reportEnrichmentService } from '../enrichment/report-enrichment.service.js';
import { regionFilterService } from '../geocoding/region-filter.service.js';
import type { IngestedReport, ScoredReport } from '../normalization/report.types.js';
import { credibilityService } from './credibility.service.js';
import { severityService } from './severity.service.js';

export class ReportScoringService {
  /**
   * BW filter → enrichment → trust → severity.
   * Returns null when the report is outside Baden-Württemberg.
   */
  process(report: IngestedReport): ScoredReport | null {
    if (!regionFilterService.isInBadenWuerttemberg(report)) {
      logger.debug('ReportScoring', 'Discarded (outside BW)', {
        source: report.source,
        id: report.id,
      });
      return null;
    }

    const enriched = reportEnrichmentService.enrich(report);
    const trust = credibilityService.score(enriched);
    const severity = severityService.score(enriched);

    return {
      ...enriched,
      location: enriched.location ?? {},
      trust,
      severity,
      metadata: {
        ...enriched.metadata,
        trust,
        severity,
      },
    };
  }
}

export const reportScoringService = new ReportScoringService();
