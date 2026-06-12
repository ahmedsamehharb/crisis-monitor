import type { IngestedReport } from '../../../normalization/report.types.js';
import type { PegelStationReading } from './pegel.types.js';

/** TODO: map flood-relevant pegel readings to IngestedReport */
export function mapPegelReading(_reading: PegelStationReading): IngestedReport | null {
  return null;
}
