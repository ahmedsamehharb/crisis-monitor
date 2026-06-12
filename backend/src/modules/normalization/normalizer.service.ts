import { logger } from '../../shared/logger/logger.js';
import type { IngestedReport } from './report.types.js';
import { validateReport } from './report.schema.js';

/**
 * Normalizes and validates ingested reports before downstream processing.
 * TODO: wire geocoding, classification, and scoring modules here.
 */
export class NormalizerService {
  normalize(report: IngestedReport): IngestedReport | null {
    const errors = validateReport(report);

    if (errors.length > 0) {
      logger.warn('Normalizer', 'Invalid report dropped', { errors, report });
      return null;
    }

    return {
      ...report,
      rawText: report.rawText.trim(),
      ingestedAt: report.ingestedAt || new Date().toISOString(),
    };
  }
}

export const normalizerService = new NormalizerService();
