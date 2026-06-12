import { config } from '../../app/config/index.js';
import { logCrisisMatch, logger } from '../../shared/logger/logger.js';
import { geocodingService } from '../geocoding/geocoding.service.js';
import { normalizerService } from '../normalization/normalizer.service.js';
import type { IngestedReport } from '../normalization/report.types.js';
import { reportScoringService } from '../scoring/report-scoring.service.js';
import type { IngestionAdapter } from './adapters/adapter.types.js';
import { MastodonAdapter } from './adapters/mastodon/mastodon.adapter.js';
import { BlueskyAdapter } from './adapters/bluesky/bluesky.adapter.js';
import { PegelonlineAdapter } from './adapters/pegelonline/pegel.adapter.js';
import { DwdAdapter } from './adapters/dwd/dwd.adapter.js';
import { FirmsAdapter } from './adapters/fires/fires.adapter.js';
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
    if (config.pegelonline.enabled) {
      this.register(new PegelonlineAdapter());
    }
    if (config.dwd.enabled) {
      this.register(new DwdAdapter());
    }
    if (config.firms.enabled) {
      this.register(new FirmsAdapter());
    }
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
    void this.processReport(raw);
  }

  private async processReport(raw: IngestedReport): Promise<void> {
    const normalized = normalizerService.normalize(raw);
    if (!normalized) return;

    const geocoded = await geocodingService.enrichReport(normalized);
    const scored = reportScoringService.process(geocoded);
    if (!scored) return;

    logCrisisMatch({
      source: formatSourceLabel(scored.source),
      keywords: scored.keywords,
      author: scored.author,
      text: scored.rawText,
      url: scored.url,
      createdAt: scored.createdAt,
      location:
        scored.location.lat !== undefined && scored.location.lon !== undefined
          ? {
              label:
                scored.location.municipality ??
                scored.location.district ??
                (scored.metadata.locationLabel as string | undefined),
              latitude: scored.location.lat,
              longitude: scored.location.lon,
            }
          : undefined,
    });

    void eventsService.persistAndCluster(scored);
  }

  listSources(): { id: string; label: string }[] {
    return this.adapters.map((a) => ({ id: a.id, label: a.label }));
  }
}

export const ingestionService = new IngestionService();

function formatSourceLabel(source: string): string {
  const labels: Record<string, string> = {
    mastodon: 'Mastodon',
    bluesky: 'Bluesky',
    pegelonline: 'PEGELONLINE',
    dwd: 'DWD',
    firms: 'NASA FIRMS',
  };
  return labels[source] ?? source;
}
