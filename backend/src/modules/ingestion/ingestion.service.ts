import { config } from '../../app/config/index.js';
import { logCrisisMatch, logger } from '../../shared/logger/logger.js';
import { normalizerService } from '../normalization/normalizer.service.js';
import type { IngestedReport } from '../normalization/report.types.js';
import type { IngestionAdapter } from './adapters/adapter.types.js';
import { MastodonAdapter } from './adapters/mastodon/mastodon.adapter.js';
import { BlueskyAdapter } from './adapters/bluesky/bluesky.adapter.js';
import { eventsService } from '../events/events.service.js';

export class IngestionService {
  private adapters: IngestionAdapter[] = [];
  private running = false;

  register(adapter: IngestionAdapter): void {
    this.adapters.push(adapter);
  }

  registerDefaults(): void {
    if (config.mastodon.enabled) {
      this.register(new MastodonAdapter());
    }
    if (config.bluesky.enabled) {
      this.register(new BlueskyAdapter());
    }
    // Stub adapters — enable via config when implemented:
    // this.register(new DwdAdapter());
  }

  start(): void {
    if (this.running) return;
    this.running = true;

    logger.info('Ingestion', `Starting ${this.adapters.length} adapter(s)`);

    for (const adapter of this.adapters) {
      adapter.start((report) => this.handleReport(report));
    }
  }

  stop(): void {
    for (const adapter of this.adapters) {
      adapter.stop();
    }
    this.running = false;
    logger.info('Ingestion', 'Stopped all adapters');
  }

  private handleReport(raw: IngestedReport): void {
    const report = normalizerService.normalize(raw);
    if (!report) return;

    logCrisisMatch({
      source: report.source,
      keywords: report.keywords,
      author: report.author,
      text: report.rawText,
      url: report.url,
      createdAt: report.createdAt,
    });

    void eventsService.persistReport(report);
  }

  listSources(): { id: string; label: string }[] {
    return this.adapters.map((a) => ({ id: a.id, label: a.label }));
  }
}

export const ingestionService = new IngestionService();
