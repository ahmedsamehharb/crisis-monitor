import { isDatabaseEnabled, prisma } from '../../shared/database/prisma.js';
import type { CrisisEventType } from '../../shared/types/index.js';
import { maxWindowHoursForType } from '../correlation/event-type-clusters.js';
import type { CrisisEventAggregate } from '../correlation/correlation.types.js';
import type { ScoredReport } from '../normalization/report.types.js';
import { eventsRepository } from './events.repository.js';

export class CrisisEventRepository {
  private memoryEvents = new Map<string, CrisisEventAggregate>();
  private memoryReportToEvent = new Map<string, string>();

  async saveEvent(event: CrisisEventAggregate): Promise<void> {
    this.memoryEvents.set(event.id, event);

    if (!isDatabaseEnabled() || !prisma) return;

    try {
      await prisma.crisisEvent.upsert({
        where: { id: event.id },
        create: {
          id: event.id,
          title: event.title,
          eventType: event.eventType,
          status: event.status,
          latitude: event.latitude,
          longitude: event.longitude,
          locationLabel: event.locationLabel,
          summary: event.summary,
          credibilityScore: event.credibilityScore,
          severityScore: event.severityScore,
          sourceCount: event.sourceCount,
          firstDetectedAt: new Date(event.firstDetectedAt),
          lastUpdatedAt: new Date(event.lastUpdatedAt),
          reportIds: event.reportIds,
        },
        update: {
          title: event.title,
          eventType: event.eventType,
          status: event.status,
          latitude: event.latitude,
          longitude: event.longitude,
          locationLabel: event.locationLabel,
          summary: event.summary,
          credibilityScore: event.credibilityScore,
          severityScore: event.severityScore,
          sourceCount: event.sourceCount,
          firstDetectedAt: new Date(event.firstDetectedAt),
          lastUpdatedAt: new Date(event.lastUpdatedAt),
          reportIds: event.reportIds,
        },
      });
    } catch {
      // in-memory remains authoritative when DB unavailable
    }
  }

  async linkReport(reportId: string, eventId: string): Promise<void> {
    this.memoryReportToEvent.set(reportId, eventId);

    const event = this.memoryEvents.get(eventId);
    if (event && !event.reportIds.includes(reportId)) {
      event.reportIds.push(reportId);
    }

    if (!isDatabaseEnabled() || !prisma) return;

    try {
      await prisma.report.update({
        where: { id: reportId },
        data: { crisisEventId: eventId },
      });
    } catch {
      // optional DB
    }
  }

  async findById(id: string): Promise<CrisisEventAggregate | null> {
    const mem = this.memoryEvents.get(id);
    if (mem) return mem;

    if (!isDatabaseEnabled() || !prisma) return null;

    try {
      const row = await prisma.crisisEvent.findUnique({ where: { id } });
      if (!row) return null;
      return rowToAggregate(row);
    } catch {
      return null;
    }
  }

  async findOpenCandidates(
    report: ScoredReport,
    limit: number
  ): Promise<CrisisEventAggregate[]> {
    const maxWindow = maxWindowHoursForType(report.eventType);
    const cutoff = new Date(
      new Date(report.createdAt).getTime() - maxWindow * 3_600_000
    );

    const fromMemory = [...this.memoryEvents.values()]
      .filter((e) => e.status === 'open')
      .filter((e) => new Date(e.lastUpdatedAt) >= cutoff)
      .slice(0, limit);

    if (!isDatabaseEnabled() || !prisma) {
      return fromMemory;
    }

    try {
      const rows = await prisma.crisisEvent.findMany({
        where: {
          status: 'open',
          lastUpdatedAt: { gte: cutoff },
        },
        orderBy: { lastUpdatedAt: 'desc' },
        take: limit,
      });

      const fromDb = rows.map(rowToAggregate);
      const merged = new Map<string, CrisisEventAggregate>();
      for (const e of [...fromMemory, ...fromDb]) {
        merged.set(e.id, e);
      }
      return [...merged.values()];
    } catch {
      return fromMemory;
    }
  }

  async listRecent(limit = 50): Promise<CrisisEventAggregate[]> {
    const mem = [...this.memoryEvents.values()]
      .sort(
        (a, b) =>
          new Date(b.lastUpdatedAt).getTime() - new Date(a.lastUpdatedAt).getTime()
      )
      .slice(0, limit);

    if (!isDatabaseEnabled() || !prisma) return mem;

    try {
      const rows = await prisma.crisisEvent.findMany({
        orderBy: { lastUpdatedAt: 'desc' },
        take: limit,
      });
      const fromDb = rows.map(rowToAggregate);
      const merged = new Map<string, CrisisEventAggregate>();
      for (const e of [...mem, ...fromDb]) {
        merged.set(e.id, e);
      }
      return [...merged.values()]
        .sort(
          (a, b) =>
            new Date(b.lastUpdatedAt).getTime() -
            new Date(a.lastUpdatedAt).getTime()
        )
        .slice(0, limit);
    } catch {
      return mem;
    }
  }

  async getMemberReports(eventId: string): Promise<ScoredReport[]> {
    const event = await this.findById(eventId);
    if (!event) return [];

    const reports: ScoredReport[] = [];
    for (const reportId of event.reportIds) {
      const r = await eventsRepository.findById(reportId);
      if (r) reports.push(r as ScoredReport);
    }
    return reports.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
}

function rowToAggregate(row: {
  id: string;
  title: string;
  eventType: string;
  status: string;
  latitude: number | null;
  longitude: number | null;
  locationLabel: string | null;
  summary: string | null;
  credibilityScore: number | null;
  severityScore: number | null;
  sourceCount: number;
  firstDetectedAt: Date;
  lastUpdatedAt: Date;
  reportIds: string[];
}): CrisisEventAggregate {
  return {
    id: row.id,
    title: row.title,
    eventType: row.eventType as CrisisEventType,
    status: row.status as CrisisEventAggregate['status'],
    latitude: row.latitude ?? undefined,
    longitude: row.longitude ?? undefined,
    locationLabel: row.locationLabel ?? undefined,
    summary: row.summary ?? undefined,
    firstDetectedAt: row.firstDetectedAt.toISOString(),
    lastUpdatedAt: row.lastUpdatedAt.toISOString(),
    credibilityScore: row.credibilityScore ?? 0,
    severityScore: row.severityScore ?? 0,
    sourceCount: row.sourceCount,
    reportIds: row.reportIds,
  };
}

export const crisisEventRepository = new CrisisEventRepository();
