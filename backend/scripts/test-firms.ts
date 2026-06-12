import 'dotenv/config';
import { config } from '../src/app/config/index.js';
import { fetchFirmsHotspots } from '../src/modules/ingestion/adapters/fires/fires.client.js';

async function main() {
  const { mapKey, source, dayRange, bbox } = config.firms;

  if (!mapKey) {
    console.error('FIRMS_MAP_KEY is not set in backend/.env');
    process.exit(1);
  }

  const bboxStr = `${bbox.west},${bbox.south},${bbox.east},${bbox.north}`;
  console.log('Query:', { source, dayRange, bbox: bboxStr });

  const rows = await fetchFirmsHotspots();
  console.log('BW hotspots:', rows.length);

  if (rows.length === 0) {
    console.log(
      'OK — API responded; no thermal anomalies in Baden-Württemberg for the last',
      dayRange,
      dayRange === 1 ? 'day' : 'days',
    );
    console.log(
      'Visual check: https://firms.modaps.eosdis.nasa.gov/map/#d:1;@9.2,48.8,8z'
    );
    return;
  }

  console.log('Samples (up to 3):');
  for (const row of rows.slice(0, 3)) {
    console.log({
      lat: row.latitude,
      lon: row.longitude,
      confidence: row.confidence,
      brightness: row.brightness,
      date: row.acq_date,
      time: row.acq_time,
    });
  }
}

main().catch((err) => {
  console.error('FAILED:', err instanceof Error ? err.message : err);
  process.exit(1);
});
