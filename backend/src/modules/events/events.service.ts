import type { IngestedReport } from '../normalization/report.types.js';
import { eventsRepository } from './events.repository.js';

export class EventsService {
  async persistReport(report: IngestedReport): Promise<void> {
    await eventsRepository.save(report);
  }

  async listRecent(limit = 50): Promise<IngestedReport[]> {
    return eventsRepository.findRecent(limit);
  }
}

export const eventsService = new EventsService();
