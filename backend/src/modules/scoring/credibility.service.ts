import type { IngestedReport } from '../normalization/report.types.js';

/** TODO: score source trust, media verification, account age */
export class CredibilityService {
  score(_report: IngestedReport): number {
    return 0.5;
  }
}

export const credibilityService = new CredibilityService();
