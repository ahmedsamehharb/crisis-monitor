import type { CrisisEventType, DataSourceId } from '../../shared/types/index.js';

export interface ReportLocation {
  lat?: number;
  lon?: number;
  municipality?: string;
  district?: string;
  state?: string;
}

export interface IngestedReport {
  id: string;
  source: DataSourceId;
  sourceId: string;
  rawText: string;
  url: string;
  author: string;
  createdAt: string;
  ingestedAt: string;
  keywords: string[];
  eventType: CrisisEventType;
  mediaUrls: string[];
  metadata: Record<string, unknown>;
  location?: ReportLocation;
  trust?: number;
  severity?: number;
}

/** Report after enrichment and scoring (ready for clustering). */
export interface ScoredReport extends IngestedReport {
  location: ReportLocation;
  trust: number;
  severity: number;
}

export interface ReportFilterResult {
  matches: boolean;
  keywords: string[];
  text: string;
}
