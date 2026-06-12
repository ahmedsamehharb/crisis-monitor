import type { IngestedReport } from './report.types.js';

/**
 * Lightweight runtime validation for ingested reports.
 * TODO: replace with Zod when classification module adds richer schemas.
 */
export function validateReport(report: IngestedReport): string[] {
  const errors: string[] = [];

  if (!report.source) errors.push('source is required');
  if (!report.sourceId) errors.push('sourceId is required');
  if (!report.rawText?.trim()) errors.push('rawText is required');
  if (!report.createdAt) errors.push('createdAt is required');

  return errors;
}
