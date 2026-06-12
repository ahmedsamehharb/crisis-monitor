import type { CrisisEventType } from '../../../../shared/types/index.js';

/** FIRMS thermal anomalies are always classified as wildfire signals. */
export function mapFirmsEventType(): CrisisEventType {
  return 'wildfire';
}
