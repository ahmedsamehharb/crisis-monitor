import { correlationService } from '../correlation/correlation.service.js';
import type { CrisisEventDetail } from '../correlation/correlation.types.js';
import type { ScoredReport } from '../normalization/report.types.js';
import { crisisEventRepository } from './crisis-events.repository.js';
import { eventsRepository } from './events.repository.js';

export class EventsService {
  async persistAndCluster(report: ScoredReport): Promise<{
    reportId: string;
    crisisEventId: string | null;
  }> {
    const reportId = await eventsRepository.save(report);
    const decision = await correlationService.assignToEvent(report, reportId);
    return { reportId, crisisEventId: decision.eventId };
  }

  async listEvents(limit = 50) {
    return crisisEventRepository.listRecent(limit);
  }

  async getEventDetail(id: string): Promise<CrisisEventDetail | null> {
    const event = await crisisEventRepository.findById(id);
    if (!event) return null;

    const signals = await crisisEventRepository.getMemberReports(id);
    const sourceMap = new Map<string, number>();
    for (const s of signals) {
      sourceMap.set(s.source, (sourceMap.get(s.source) ?? 0) + 1);
    }

    return {
      event,
      signals,
      sourceBreakdown: [...sourceMap.entries()].map(([source, count]) => ({
        source,
        count,
      })),
    };
  }

  async listRecentReports(limit = 50) {
    return eventsRepository.findRecent(limit);
  }
}

export const eventsService = new EventsService();
