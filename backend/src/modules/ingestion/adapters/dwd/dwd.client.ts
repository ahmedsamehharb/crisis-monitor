import { XMLParser } from 'fast-xml-parser';
import { config } from '../../../../app/config/index.js';
import { logger } from '../../../../shared/logger/logger.js';
import type {
  DwdCapAlertDocument,
  DwdCapInfoBlock,
  DwdCapParameterBlock,
  DwdJsonWarningEntry,
  DwdJsonWarningsPayload,
  DwdWarning,
} from './dwd.types.js';

const USER_AGENT = 'CrisisMonitor/1.0 (+https://github.com/crisis-monitor)';

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  removeNSPrefix: true,
  trimValues: true,
});

export async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: '*/*' },
  });

  if (!response.ok) {
    throw new Error(`DWD fetch failed (${response.status}): ${url}`);
  }

  return response.text();
}

export async function fetchJson<T>(url: string): Promise<T> {
  const text = await fetchText(url);
  return parseDwdJsonPayload<T>(text);
}

export async function fetchXml(url: string): Promise<DwdCapAlertDocument> {
  const text = await fetchText(url);
  const parsed = xmlParser.parse(text);
  const alert = parsed?.alert ?? parsed?.Alert;
  if (!alert) {
    throw new Error(`Invalid CAP document (no <alert>): ${url}`);
  }
  return alert as DwdCapAlertDocument;
}

/** Strip JSONP wrapper: warnWetter.loadWarnings({...}); */
export function parseDwdJsonPayload<T>(text: string): T {
  const trimmed = text.trim();
  const match = trimmed.match(/loadWarnings\s*\(\s*(\{[\s\S]*\})\s*\)\s*;?\s*$/);
  const jsonText = match ? match[1] : trimmed;
  return JSON.parse(jsonText) as T;
}

function asArray<T>(value: T | T[] | undefined): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function toIsoTimestamp(value: string | number | undefined): string | undefined {
  if (value == null) return undefined;
  const date = typeof value === 'number' ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

function parseCapSeverity(info: DwdCapInfoBlock): number {
  const raw = info.severity?.toUpperCase() ?? '';
  if (raw.includes('EXTREME')) return 4;
  if (raw.includes('SEVERE')) return 3;
  if (raw.includes('MODERATE')) return 2;
  if (raw.includes('MINOR')) return 1;
  return 2;
}

function readWarnCellId(parameters: DwdCapParameterBlock[]): string | undefined {
  for (const param of parameters) {
    if (param.valueName?.toUpperCase() === 'WARNCELLID' && param.value) {
      return param.value;
    }
  }
  return undefined;
}

function mapCapInfoToWarnings(
  alert: DwdCapAlertDocument,
  capUrl: string
): DwdWarning[] {
  const infos = asArray(alert.info);
  const results: DwdWarning[] = [];

  for (const info of infos) {
    const areas = asArray(info.area);
    const areaDesc =
      areas.map((a) => a.areaDesc).filter(Boolean).join('; ') || 'Deutschland';
    const parameters = asArray(info.parameter);
    const warnCellId = readWarnCellId(parameters);
    const onset = toIsoTimestamp(info.onset);
    if (!onset || !info.event || !info.headline) continue;

    const identifier =
      warnCellId && info.event
        ? `${warnCellId}:${info.event}:${onset}`
        : `${alert.identifier ?? capUrl}:${info.event}:${onset}`;

    results.push({
      sourceId: identifier,
      identifier,
      headline: info.headline,
      description: info.description ?? '',
      event: info.event,
      instruction: info.instruction,
      onset,
      expires: toIsoTimestamp(info.expires),
      areaDesc,
      location: {
        region: areaDesc,
        country: 'DE',
      },
      severityLevel: parseCapSeverity(info),
      sourceUrl: capUrl,
    });
  }

  return results;
}

function mapJsonEntryToWarning(
  cellId: string,
  entry: DwdJsonWarningEntry,
  sourceUrl: string
): DwdWarning | null {
  const onset = toIsoTimestamp(entry.start);
  if (!onset || !entry.event || !entry.headline) return null;

  const type = entry.type ?? 1;
  const sourceId = `${cellId}:${type}:${entry.start}:${entry.event}`;

  return {
    sourceId,
    identifier: sourceId,
    headline: entry.headline,
    description: entry.description ?? '',
    event: entry.event,
    instruction: entry.instruction,
    onset,
    expires: toIsoTimestamp(entry.end ?? undefined),
    areaDesc: entry.regionName ?? entry.state ?? 'Deutschland',
    location: {
      region: entry.regionName,
      state: entry.state,
      stateShort: entry.stateShort,
      country: 'DE',
    },
    severityLevel: entry.level ?? 2,
    sourceUrl,
  };
}

export function isActiveDwdWarning(warning: DwdWarning, now = Date.now()): boolean {
  const startMs = new Date(warning.onset).getTime();
  if (Number.isNaN(startMs) || startMs > now) return false;
  if (!warning.expires) return true;
  const endMs = new Date(warning.expires).getTime();
  return !Number.isNaN(endMs) && now <= endMs;
}

export function isBadenWuerttembergWarning(warning: DwdWarning): boolean {
  if (warning.location.stateShort === 'BW') return true;
  if (warning.location.state?.includes('Baden-Württemberg')) return true;
  return false;
}

export function filterDwdWarnings(
  warnings: DwdWarning[],
  options: { bwOnly: boolean; now?: number }
): DwdWarning[] {
  const now = options.now ?? Date.now();
  return warnings.filter((w) => {
    if (!isActiveDwdWarning(w, now)) return false;
    if (options.bwOnly && !isBadenWuerttembergWarning(w)) return false;
    return true;
  });
}

export async function fetchJsonWarnings(): Promise<DwdWarning[]> {
  const url = config.dwd.jsonUrl;
  const payload = await fetchJson<DwdJsonWarningsPayload>(url);
  const warnings: DwdWarning[] = [];

  for (const [cellId, entries] of Object.entries(payload.warnings ?? {})) {
    for (const entry of entries) {
      const mapped = mapJsonEntryToWarning(cellId, entry, url);
      if (mapped) warnings.push(mapped);
    }
  }

  return warnings;
}

export function parseCapDirectoryFilenames(html: string): string[] {
  const matches = html.matchAll(/href="(Z_CAP[^"]+\.xml)"/gi);
  return [...matches].map((m) => m[1]);
}

export async function fetchCapDiffFilenames(): Promise<string[]> {
  const html = await fetchText(config.dwd.capDiffUrl);
  return parseCapDirectoryFilenames(html);
}

export async function fetchCapWarningsFromFiles(
  filenames: string[]
): Promise<DwdWarning[]> {
  const warnings: DwdWarning[] = [];
  const baseUrl = config.dwd.capDiffUrl.endsWith('/')
    ? config.dwd.capDiffUrl
    : `${config.dwd.capDiffUrl}/`;

  for (const filename of filenames) {
    if (filename.length < 30) continue;

    const capUrl = `${baseUrl}${filename}`;
    try {
      const text = await fetchText(capUrl);
      if (text.length < 100) continue;

      const alert = xmlParser.parse(text)?.alert as DwdCapAlertDocument | undefined;
      if (!alert) continue;

      warnings.push(...mapCapInfoToWarnings(alert, capUrl));
    } catch (err) {
      logger.warn('DWD CAP', `Skipping ${filename}`, err);
    }
  }

  return warnings;
}

export async function fetchCapDiffWarnings(
  seenFiles: Set<string>
): Promise<{ warnings: DwdWarning[]; newFiles: string[] }> {
  const allFiles = await fetchCapDiffFilenames();
  const newFiles = allFiles.filter((f) => !seenFiles.has(f));

  if (newFiles.length === 0) {
    return { warnings: [], newFiles: [] };
  }

  const recentFiles = newFiles.slice(-20);
  const warnings = await fetchCapWarningsFromFiles(recentFiles);
  return { warnings, newFiles: recentFiles };
}

export async function fetchDwdWarnings(): Promise<DwdWarning[]> {
  const mode = config.dwd.source;

  if (mode === 'json') {
    return fetchJsonWarnings();
  }

  if (mode === 'cap') {
    const { warnings } = await fetchCapDiffWarnings(new Set());
    return warnings;
  }

  // auto: JSON primary, CAP fallback if JSON empty
  try {
    const jsonWarnings = await fetchJsonWarnings();
    if (jsonWarnings.length > 0) {
      return jsonWarnings;
    }
  } catch (err) {
    logger.warn('DWD', 'JSON warnings fetch failed, trying CAP', err);
  }

  const { warnings } = await fetchCapDiffWarnings(new Set());
  return warnings;
}
