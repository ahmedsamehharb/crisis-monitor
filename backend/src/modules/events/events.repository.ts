import { isDatabaseEnabled, prisma } from '../../shared/database/prisma.js';
import type { IngestedReport } from '../normalization/report.types.js';

/** Persists reports when DATABASE_URL is configured; otherwise in-memory fallback */
export class EventsRepository {
  private memory: IngestedReport[] = [];

  async save(report: IngestedReport): Promise<void> {
    this.memory.unshift(report);
    if (this.memory.length > 500) this.memory.pop();

    if (!isDatabaseEnabled() || !prisma) return;

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
      },
      update: {
        rawText: report.rawText,
        keywords: report.keywords,
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
      metadata: {},
    }));
    } catch {
      return this.memory.slice(0, limit);
    }
  }
}

export const eventsRepository = new EventsRepository();
