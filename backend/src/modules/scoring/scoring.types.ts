import type { ScoredReport } from '../normalization/report.types.js';

export interface ReportScores {
  credibility: number;
  severity: number;
  urgency: number;
  relevance: number;
}

export type { ScoredReport };

export type LocationQuality = 'coordinates' | 'municipality' | 'none';
