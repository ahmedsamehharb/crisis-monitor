import type { IngestedReport } from '../../../normalization/report.types.js';
import type { DwdWarning } from './dwd.types.js';

/** TODO: map DWD CAP/warning payloads to IngestedReport */
export function mapDwdWarning(_warning: DwdWarning): IngestedReport | null {
  return null;
}
