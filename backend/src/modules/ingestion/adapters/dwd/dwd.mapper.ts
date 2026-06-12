import type { IngestedReport } from '../../../normalization/report.types.js';
import {
  mapDwdEventToCrisisType,
  normalizeDwdSeverity,
} from './dwd.eventType.js';
import type { DwdWarning } from './dwd.types.js';

const DWD_TRUST = 0.95;
const DWD_AUTHOR = 'Deutscher Wetterdienst';

export function mapDwdWarningToReport(warning: DwdWarning): IngestedReport {
  const rawText = [
    warning.headline,
    warning.areaDesc,
    warning.description,
    warning.instruction,
  ]
    .filter(Boolean)
    .join('\n\n');

  const eventType = mapDwdEventToCrisisType(warning.event);
  const keywords = buildKeywords(warning);

  return {
    id: `dwd:${warning.sourceId}`,
    source: 'dwd',
    sourceId: warning.sourceId,
    rawText,
    url: warning.sourceUrl,
    author: DWD_AUTHOR,
    createdAt: warning.onset,
    ingestedAt: new Date().toISOString(),
    keywords,
    eventType,
    mediaUrls: [],
    metadata: {
      severity: normalizeDwdSeverity(warning.severityLevel),
      trust: DWD_TRUST,
      expires: warning.expires,
      areaDesc: warning.areaDesc,
      location: warning.location,
      dwdEvent: warning.event,
      severityLevel: warning.severityLevel,
      instruction: warning.instruction,
      identifier: warning.identifier,
    },
  };
}

/** @deprecated Use mapDwdWarningToReport */
export function mapDwdWarning(warning: DwdWarning): IngestedReport {
  return mapDwdWarningToReport(warning);
}

function buildKeywords(warning: DwdWarning): string[] {
  const tokens = new Set<string>();
  tokens.add(warning.event);

  for (const part of warning.event.split(/[\s_/]+/)) {
    if (part.length > 2) tokens.add(part);
  }

  if (warning.location.stateShort) {
    tokens.add(warning.location.stateShort);
  }

  return [...tokens];
}
