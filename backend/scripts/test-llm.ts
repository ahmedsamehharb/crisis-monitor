import 'dotenv/config';
import { config } from '../src/app/config/index.js';
import { chatCompletion } from '../src/modules/geocoding/llm.client.js';
import { extractLocationsFromText } from '../src/modules/geocoding/location.extractor.js';

async function main() {
  const keySet = Boolean(config.geocoding.llmApiKey);
  console.log('GEOCODING_LLM_API_KEY set:', keySet);
  console.log('GEOCODING_LLM_BASE_URL:', config.geocoding.llmBaseUrl);
  console.log('GEOCODING_LLM_MODEL:', config.geocoding.llmModel);

  if (!keySet) {
    console.log('\nLLM skipped — add GEOCODING_LLM_API_KEY to backend/.env');
    process.exit(1);
  }

  console.log('\n--- Direct LLM ping ---');
  const reply = await chatCompletion([
    { role: 'user', content: 'Reply with exactly: OK' },
  ]);
  console.log('Response:', reply.slice(0, 100));

  // Obscure village — unlikely to match static city list
  const text =
    'Feuerwehreinsatz im Ortsteil Möckmühl, Wohnhausbrand in der Hauptstraße';
  console.log('\n--- Location extraction (LLM + heuristics) ---');
  console.log('Text:', text);
  const locations = await extractLocationsFromText(text);
  console.log('Extracted:', JSON.stringify(locations, null, 2));
}

main().catch((err) => {
  console.error('FAILED:', err instanceof Error ? err.message : err);
  process.exit(1);
});
