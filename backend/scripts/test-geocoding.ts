import 'dotenv/config';
import { geocodingService } from '../src/modules/geocoding/geocoding.service.js';
import { extractLocationsFromText } from '../src/modules/geocoding/location.extractor.js';

const SAMPLES = [
  'Großbrand in Reutlingen, Feuerwehr im Einsatz an der Wilhelmstraße',
  'Einsatz in Heilbronn Südstraße, mehrere Feuerwehrfahrzeuge vor Ort',
  'Unfall auf der A6 bei Heilbronn',
];

async function main() {
  for (const rawText of SAMPLES) {
    console.log('\n===', rawText, '===');
    const extracted = await extractLocationsFromText(rawText);
    console.log('Extracted:', JSON.stringify(extracted, null, 2));

    const report = await geocodingService.enrichReport({
      id: 'test:1',
      source: 'mastodon',
      sourceId: '1',
      rawText,
      url: '',
      author: 'test',
      createdAt: new Date().toISOString(),
      ingestedAt: new Date().toISOString(),
      keywords: ['Feuerwehr'],
      eventType: 'fire',
      mediaUrls: [],
      metadata: {},
    });

    console.log(
      'Result:',
      JSON.stringify(
        {
          lat: report.metadata.latitude,
          lon: report.metadata.longitude,
          label: report.metadata.locationLabel,
          query: report.metadata.geocodeQuery,
        },
        null,
        2
      )
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
