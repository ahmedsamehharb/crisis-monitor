import type { CrisisEventType } from '../../shared/types/index.js';
import type { ReportLocation, ScoredReport } from '../normalization/report.types.js';
import type { LocationPrecision } from './location-similarity.js';

export type CrisisEventStatus = 'open' | 'monitoring' | 'resolved';

/** Aggregated crisis event used for clustering and API responses */
export interface CrisisEventAggregate {
  id: string;
  title: string;
  eventType: CrisisEventType;
  status: CrisisEventStatus;
  latitude?: number;
  longitude?: number;
  locationLabel?: string;
  summary?: string;
  firstDetectedAt: string;
  lastUpdatedAt: string;
  credibilityScore: number;
  severityScore: number;
  sourceCount: number;
  reportIds: string[];
  /** Derived fields for similarity (not always persisted) */
  precision?: LocationPrecision;
  location?: ReportLocation;
}

/** Lightweight view of an event for similarity scoring */
export interface CrisisEventSnapshot {
  id: string;
  eventType: CrisisEventType;
  latitude?: number;
  longitude?: number;
  locationLabel?: string;
  lastUpdatedAt: string;
  precision?: LocationPrecision;
  location?: ReportLocation;
}

export interface SimilarityBreakdown {
  total: number;
  geo: number;
  time: number;
  type: number;
  text: number;
  passesHardGates: boolean;
}

export interface ClusterDecision {
  action: 'merged' | 'created' | 'skipped';
  eventId: string | null;
  similarity?: number;
  breakdown?: SimilarityBreakdown;
}

export interface CrisisEventDetail {
  event: CrisisEventAggregate;
  signals: ScoredReport[];
  sourceBreakdown: { source: string; count: number }[];
}
