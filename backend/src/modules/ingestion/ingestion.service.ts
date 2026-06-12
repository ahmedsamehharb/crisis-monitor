import { config } from '../../app/config/index.js';
import { logCrisisMatch, logger } from '../../shared/logger/logger.js';
import { normalizerService } from '../normalization/normalizer.service.js';
import type { IngestedReport } from '../normalization/report.types.js';
import type { IngestionAdapter } from './adapters/adapter.types.js';
import { MastodonAdapter } from './adapters/mastodon/mastodon.adapter.js';
import { BlueskyAdapter } from './adapters/bluesky/bluesky.adapter.js';
import { PegelonlineAdapter } from './adapters/pegelonline/pegel.adapter.js';
import { DwdAdapter } from './adapters/dwd/dwd.adapter.js';
import { FirmsAdapter } from './adapters/fires/fires.adapter.js';
import { eventsService } from '../events/events.service.js';
import { geocodingService } from '../geocoding/geocoding.service.js';

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
    const report = normalizerService.normalize(raw);
    if (!report) return;

    const enriched = await geocodingService.enrichReport(report);

    const lat = enriched.metadata.latitude as number | undefined;
    const lon = enriched.metadata.longitude as number | undefined;
    const locationLabel = enriched.metadata.locationLabel as string | undefined;

    logCrisisMatch({
      source: formatSourceLabel(enriched.source),
      keywords: enriched.keywords,
      author: enriched.author,
      text: enriched.rawText,
      url: enriched.url,
      createdAt: enriched.createdAt,
      location:
        lat !== undefined && lon !== undefined
          ? { label: locationLabel, latitude: lat, longitude: lon }
          : undefined,
    });

    void eventsService.persistReport(enriched);
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
