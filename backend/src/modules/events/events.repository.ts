import { isDatabaseEnabled, prisma } from '../../shared/database/prisma.js';
import type { IngestedReport } from '../normalization/report.types.js';

/** Persists reports when DATABASE_URL is configured; otherwise in-memory fallback */
export class EventsRepository {
  private memory: IngestedReport[] = [];

  async save(report: IngestedReport): Promise<void> {
    this.memory.unshift(report);
    if (this.memory.length > 500) this.memory.pop();

    if (!isDatabaseEnabled() || !prisma) return;

    const latitude =
      report.location?.lat ?? num(report.metadata.latitude);
    const longitude =
      report.location?.lon ?? num(report.metadata.longitude);
    const locationLabel =
      report.location?.municipality ??
      report.location?.district ??
      str(report.metadata.locationLabel);

    try {
      await prisma.report.upsert({
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
    } catch {
      // DB optional during hackathon — in-memory store remains authoritative
    }
  }

  async findRecent(limit = 50): Promise<IngestedReport[]> {
    if (!isDatabaseEnabled() || !prisma) {
      return this.memory.slice(0, limit);
    }

    try {
      const rows = await prisma.report.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return rows.map((row) => ({
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
        trust: row.credibilityScore ?? undefined,
        severity: row.severityScore ?? undefined,
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
        },
      }));
    } catch {
      return this.memory.slice(0, limit);
    }
  }
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
