import { matchCrisisText } from '../src/shared/utils/keywordFilter.js';
import { CRISIS_KEYWORDS } from '../src/shared/constants/crisisKeywords.js';

console.log('Keywords:', CRISIS_KEYWORDS.join(', '));

const cases: [string, string][] = [
  ['Feuerwehr im Einsatz in Stuttgart', 'wildfire'],
  ['Überschwemmung in Karlsruhe', 'flood'],
  ['Schwerer Unfall auf der A8', 'traffic_accident'],
  ['Sturm warnung für morgen', 'storm'],
];

let failed = 0;
for (const [text, expected] of cases) {
  const result = matchCrisisText(text);
  if (result.eventType !== expected) {
    failed++;
    console.error('FAIL:', { text, expected, got: result.eventType });
  } else {
    console.log('OK:', text, '→', result.eventType);
  }
}

if (failed > 0) process.exit(1);
