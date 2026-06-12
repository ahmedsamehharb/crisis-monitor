import type { CrisisEventType, DataSourceId } from '../../shared/types/index.js';

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
}

export interface ReportFilterResult {
  matches: boolean;
  keywords: string[];
  text: string;
}
