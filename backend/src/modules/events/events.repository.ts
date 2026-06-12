import { isDatabaseEnabled, prisma } from '../../shared/database/prisma.js';
import type { IngestedReport, ScoredReport } from '../normalization/report.types.js';

/** Persists reports when DATABASE_URL is configured; otherwise in-memory fallback */
export class EventsRepository {
  private memory = new Map<string, IngestedReport>();

  async save(report: IngestedReport): Promise<string> {
    const memoryKey = `${report.source}:${report.sourceId}`;
    const stored = { ...report, id: report.id || memoryKey };
    this.memory.set(memoryKey, stored);

    if (!isDatabaseEnabled() || !prisma) return stored.id;

    const latitude =
      report.location?.lat ?? num(report.metadata.latitude);
    const longitude =
      report.location?.lon ?? num(report.metadata.longitude);
    const locationLabel =
      report.location?.municipality ??
      report.location?.district ??
      str(report.metadata.locationLabel);

    try {
      const row = await prisma.report.upsert({
        where: {
          source_sourceId: { source: report.source, sourceId: report.sourceId },
        },
        create: {
          source: report.source,
          sourceId: report.sourceId,
          rawText: report.rawText,
          url: report.url,
          author: report.author,
          createdAt: new Date(report.createdAt),
          keywords: report.keywords,
          eventType: report.eventType,
          latitude,
          longitude,
          locationLabel,
          credibilityScore: report.trust,
          severityScore: report.severity,
        },
        update: {
          rawText: report.rawText,
          keywords: report.keywords,
          latitude,
          longitude,
          locationLabel,
          credibilityScore: report.trust,
          severityScore: report.severity,
        },
      });
      const withId = { ...stored, id: row.id };
      this.memory.set(row.id, withId);
      this.memory.set(memoryKey, withId);
      return row.id;
    } catch {
      return stored.id;
    }
  }

  async findById(id: string): Promise<IngestedReport | null> {
    for (const r of this.memory.values()) {
      if (r.id === id) return r;
    }

    if (!isDatabaseEnabled() || !prisma) return null;

    try {
      const row = await prisma.report.findUnique({ where: { id } });
      if (!row) return null;
      return rowToReport(row);
    } catch {
      return null;
    }
  }

  async findRecent(limit = 50): Promise<IngestedReport[]> {
    const seen = new Set<string>();
    const mem = [...this.memory.values()]
      .filter((r) => {
        if (seen.has(r.id)) return false;
        seen.add(r.id);
        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, limit);

    if (!isDatabaseEnabled() || !prisma) return mem;

    try {
      const rows = await prisma.report.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return rows.map(rowToReport);
    } catch {
      return mem;
    }
  }
}

function rowToReport(row: {
  id: string;
  source: string;
  sourceId: string;
  rawText: string;
  url: string | null;
  author: string | null;
  createdAt: Date;
  ingestedAt: Date;
  keywords: string[];
  eventType: string | null;
  latitude: number | null;
  longitude: number | null;
  locationLabel: string | null;
  credibilityScore: number | null;
  severityScore: number | null;
  crisisEventId: string | null;
}): ScoredReport {
  return {
    id: row.id,
    source: row.source as IngestedReport['source'],
    sourceId: row.sourceId,
    rawText: row.rawText,
    url: row.url || '',
    author: row.author || '',
    createdAt: row.createdAt.toISOString(),
    ingestedAt: row.ingestedAt.toISOString(),
    keywords: row.keywords,
    eventType: (row.eventType as IngestedReport['eventType']) || 'unknown',
    mediaUrls: [],
    trust: row.credibilityScore ?? 0,
    severity: row.severityScore ?? 0,
    location: {
      lat: row.latitude ?? undefined,
      lon: row.longitude ?? undefined,
      municipality: row.locationLabel ?? undefined,
    },
    metadata: {
      latitude: row.latitude ?? undefined,
      longitude: row.longitude ?? undefined,
      locationLabel: row.locationLabel ?? undefined,
      trust: row.credibilityScore ?? undefined,
      severity: row.severityScore ?? undefined,
      crisisEventId: row.crisisEventId ?? undefined,
    },
  };
}

export const eventsRepository = new EventsRepository();

function num(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return undefined;
}

function str(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const t = value.trim();
  return t.length > 0 ? t : undefined;
}
