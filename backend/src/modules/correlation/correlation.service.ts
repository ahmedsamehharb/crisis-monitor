import { randomUUID } from 'node:crypto';
import { logger } from '../../shared/logger/logger.js';
import { crisisEventRepository } from '../events/crisis-events.repository.js';
import type { ScoredReport } from '../normalization/report.types.js';
import { clusteringConfig } from './clustering.config.js';
import type { ClusterDecision, CrisisEventSnapshot } from './correlation.types.js';
import { eventMergerService } from './event-merger.service.js';
import { computeSimilarity } from './similarity.service.js';

export class CorrelationService {
  async assignToEvent(
    report: ScoredReport,
    reportDbId: string
  ): Promise<ClusterDecision> {
    const reportWithId: ScoredReport = { ...report, id: reportDbId };

    const candidates = await crisisEventRepository.findOpenCandidates(
      reportWithId,
      clusteringConfig.maxCandidates
    );

    const scored = candidates
      .map((event) => {
        const snapshot: CrisisEventSnapshot = eventMergerService.toSnapshot(event);
        const breakdown = computeSimilarity(reportWithId, snapshot);
        return { event, breakdown };
      })
      .filter((s) => s.breakdown.passesHardGates)
      .sort((a, b) => b.breakdown.total - a.breakdown.total);

    const best = scored[0];

    if (!best) {
      const eventId = await this.createNewEvent(reportWithId);
      return { action: 'created', eventId, similarity: 0 };
    }

    const score = best.breakdown.total;
    const shouldMerge = score >= clusteringConfig.mergeThreshold;

    if (shouldMerge) {
      const eventId = await this.mergeIntoEvent(best.event.id, reportWithId);
      logger.info('Correlation', 'Merged report into event', {
        reportId: reportDbId,
        eventId,
        similarity: score.toFixed(3),
      });
      return {
        action: 'merged',
        eventId,
        similarity: score,
        breakdown: best.breakdown,
      };
    }

    const eventId = await this.createNewEvent(reportWithId);
    logger.info('Correlation', 'Created new event', {
      reportId: reportDbId,
      eventId,
      bestCandidateScore: score.toFixed(3),
    });
    return {
      action: 'created',
      eventId,
      similarity: score,
      breakdown: best.breakdown,
    };
  }

  private async createNewEvent(report: ScoredReport): Promise<string> {
    const eventId = randomUUID();
    const aggregate = eventMergerService.createFromReport(report, eventId);
    await crisisEventRepository.saveEvent(aggregate);
    await crisisEventRepository.linkReport(report.id, eventId);
    return eventId;
  }

  private async mergeIntoEvent(
    eventId: string,
    report: ScoredReport
  ): Promise<string> {
    const members = await crisisEventRepository.getMemberReports(eventId);
    const allReports = [...members.filter((m) => m.id !== report.id), report];
    const merged = eventMergerService.mergeReports(eventId, allReports, 'open');
    await crisisEventRepository.saveEvent(merged);
    await crisisEventRepository.linkReport(report.id, eventId);
    return eventId;
  }
}

export const correlationService = new CorrelationService();
