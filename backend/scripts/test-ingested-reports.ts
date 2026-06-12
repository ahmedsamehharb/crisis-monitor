/**
 * Demo each data source: sample signal → mapper → normalize → geocode → score.
 * Shows terminal-style crisis log + full IngestedReport JSON.
 *
 * Usage: npx tsx scripts/test-ingested-reports.ts
 */
import 'dotenv/config';
import { mapBlueskyPost } from '../src/modules/ingestion/adapters/bluesky/bluesky.mapper.js';
import { mapDwdWarningToReport } from '../src/modules/ingestion/adapters/dwd/dwd.mapper.js';
import type { DwdWarning } from '../src/modules/ingestion/adapters/dwd/dwd.types.js';
import { mapFirmsHotspotToReport } from '../src/modules/ingestion/adapters/fires/fires.mapper.js';
import type { FirmsHotspot } from '../src/modules/ingestion/adapters/fires/fires.types.js';
import { mapMastodonStatus } from '../src/modules/ingestion/adapters/mastodon/mastodon.mapper.js';
import type { MastodonStatus } from '../src/modules/ingestion/adapters/mastodon/mastodon.types.js';
import { mapPegelAlert } from '../src/modules/ingestion/adapters/pegelonline/pegel.mapper.js';
import type { PegelAlert } from '../src/modules/ingestion/adapters/pegelonline/pegel.types.js';
import { geocodingService } from '../src/modules/geocoding/geocoding.service.js';
import { normalizerService } from '../src/modules/normalization/normalizer.service.js';
import type { IngestedReport, ScoredReport } from '../src/modules/normalization/report.types.js';
import { reportScoringService } from '../src/modules/scoring/report-scoring.service.js';
import { logCrisisMatch } from '../src/shared/logger/logger.js';

const DIVIDER = '═'.repeat(72);

interface SourceDemo {
  label: string;
  build: () => IngestedReport | null;
}

const samples: SourceDemo[] = [
  {
    label: 'PEGELONLINE',
    build: () => mapPegelAlert(samplePegelAlert()),
  },
  {
    label: 'NASA FIRMS',
    build: () => mapFirmsHotspotToReport(sampleFirmsHotspot(), { clusterSize: 1 }),
  },
  {
    label: 'DWD (with coordinates)',
    build: () => mapDwdWarningToReport(sampleDwdWarning(true)),
  },
  {
    label: 'DWD (district only — geocoding adds coords)',
    build: () => mapDwdWarningToReport(sampleDwdWarning(false)),
  },
  {
    label: 'Mastodon',
    build: () => mapMastodonStatus(sampleMastodonStatus()),
  },
  {
    label: 'Bluesky',
    build: () => mapBlueskyPost(sampleBlueskyPost()),
  },
];

function samplePegelAlert(): PegelAlert {
  return {
    severity: 'critical',
    reason: 'Wasserstand überschreitet Hochwasser (HW)',
    measuredAt: new Date().toISOString(),
    waterLevelCm: 420,
    thresholdCm: 400,
    thresholdLabel: 'HW',
    station: {
      uuid: 'demo-pegel-neckar',
      number: '023001',
      shortname: 'Mannheim',
      longname: 'Mannheim',
      latitude: 49.4875,
      longitude: 8.466,
      agency: 'PEGELONLINE',
      water: { shortname: 'NECKAR', longname: 'Neckar' },
    },
  };
}

function sampleFirmsHotspot(): FirmsHotspot {
  return {
    latitude: 48.4919,
    longitude: 9.2114,
    confidence: 'h',
    brightness: 320,
    acq_date: new Date().toISOString().slice(0, 10),
    acq_time: '1430',
    satellite: 'N20',
    frp: 12.5,
    raw: { latitude: '48.4919', longitude: '9.2114', confidence: 'h' },
  };
}

function sampleDwdWarning(withCoords: boolean): DwdWarning {
  return {
    sourceId: 'demo-dwd-1',
    identifier: 'demo-dwd-identifier',
    headline: 'Amtliche WARNUNG vor STURMBÖEN',
    description: 'Es treten Sturmböen mit Geschwindigkeiten um 70 km/h auf.',
    event: 'STURMBÖEN',
    onset: new Date().toISOString(),
    areaDesc: 'Kreis Reutlingen',
    location: {
      region: 'Reutlingen',
      state: 'Baden-Württemberg',
      stateShort: 'BW',
      country: 'DE',
      lat: withCoords ? 48.4919 : undefined,
      lon: withCoords ? 9.2114 : undefined,
    },
    severityLevel: 2,
    sourceUrl: 'https://www.dwd.de',
  };
}

function sampleMastodonStatus(): MastodonStatus {
  return {
    id: 'demo-mastodon-1',
    content:
      '<p>Großbrand in <span class="hashtag">#Stuttgart</span> — Feuerwehr im Einsatz an der Königstraße</p>',
    created_at: new Date().toISOString(),
    url: 'https://mastodon.social/@demo/123',
    account: { username: 'bw_alert', display_name: 'BW Einsatz' },
  };
}

function sampleBlueskyPost() {
  return {
    uri: 'at://did:plc:demo/app.bsky.feed.post/demo1',
    author: { handle: 'einsatz.bsky.social', displayName: 'Einsatz BW' },
    record: {
      text: 'Überschwemmung in Karlsruhe — Neckar tritt über die Ufer',
      createdAt: new Date().toISOString(),
    },
  };
}

function terminalLabel(source: string): string {
  const labels: Record<string, string> = {
    pegelonline: 'PEGELONLINE',
    firms: 'NASA FIRMS',
    dwd: 'DWD',
    mastodon: 'Mastodon',
    bluesky: 'Bluesky',
  };
  return labels[source] ?? source;
}

function printTerminalView(report: IngestedReport | ScoredReport): void {
  const loc = report.location;
  logCrisisMatch({
    source: terminalLabel(report.source),
    keywords: report.keywords,
    author: report.author,
    text: report.rawText,
    url: report.url,
    createdAt: report.createdAt,
    location:
      loc?.lat !== undefined && loc?.lon !== undefined
        ? {
            label: loc.municipality ?? loc.district,
            latitude: loc.lat,
            longitude: loc.lon,
          }
        : undefined,
  });
}

function serializeReport(report: IngestedReport | ScoredReport): unknown {
  const copy = JSON.parse(JSON.stringify(report)) as Record<string, unknown>;
  const meta = copy.metadata as Record<string, unknown> | undefined;
  if (meta?.raw && typeof meta.raw === 'object') {
    meta.raw = { ...meta.raw as object, _truncated: 'FIRMS CSV row (demo)' };
  }
  return copy;
}

async function runPipeline(
  label: string,
  raw: IngestedReport
): Promise<void> {
  console.log(`\n${DIVIDER}`);
  console.log(`SOURCE: ${label}`);
  console.log(DIVIDER);

  console.log('\n[1] Raw mapper output (IngestedReport from adapter)');
  console.log(JSON.stringify(serializeReport(raw), null, 2));

  const normalized = normalizerService.normalize(raw);
  if (!normalized) {
    console.log('\n✗ Normalizer dropped report');
    return;
  }

  const geocoded = await geocodingService.enrichReport(normalized);
  console.log('\n[2] After geocoding');
  console.log(
    JSON.stringify(
      {
        location: geocoded.location,
        metadata: {
          latitude: geocoded.metadata.latitude,
          longitude: geocoded.metadata.longitude,
          locationLabel: geocoded.metadata.locationLabel,
          geocodeQuery: geocoded.metadata.geocodeQuery,
        },
      },
      null,
      2
    )
  );

  const scored = reportScoringService.process(geocoded);
  if (!scored) {
    console.log('\n[3] Scoring: DISCARDED (outside BW or filter)');
    console.log('\n--- Terminal view (geocoded, not persisted) ---');
    printTerminalView(geocoded);
    return;
  }

  console.log('\n[3] Final ScoredReport (persisted shape)');
  console.log(JSON.stringify(serializeReport(scored), null, 2));

  console.log('--- Terminal view (as backend logs it) ---');
  printTerminalView(scored);
}

async function main() {
  console.log('Crisis Monitor — IngestedReport pipeline demo');
  console.log(`GEOCODING_ENABLED: ${process.env.GEOCODING_ENABLED ?? '(default true)'}`);
  console.log(`GEOCODING_LLM_API_KEY set: ${Boolean(process.env.GEOCODING_LLM_API_KEY)}`);

  for (const demo of samples) {
    const raw = demo.build();
    if (!raw) {
      console.log(`\n${DIVIDER}\nSOURCE: ${demo.label}\n✗ Mapper returned null\n`);
      continue;
    }
    await runPipeline(demo.label, raw);
  }

  console.log(`\n${DIVIDER}`);
  console.log('Done — 6 sample signals processed');
  console.log(DIVIDER);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
