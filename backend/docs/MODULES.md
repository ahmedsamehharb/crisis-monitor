# Module Guide (Collaboration)

Pick a module folder, implement the TODOs, export a service, and wire it in `ingestion.service.ts` or `normalizer.service.ts` as appropriate.

| Module | Path | Status | Owner | Task |
|--------|------|--------|-------|------|
| **Ingestion – Mastodon** | `modules/ingestion/adapters/mastodon/` | ✅ Working | — | Keyword search polling |
| **Ingestion – Bluesky** | `modules/ingestion/adapters/bluesky/` | ✅ Working | — | Keyword search polling |
| **Ingestion – DWD** | `modules/ingestion/adapters/dwd/` | 🔲 Stub | _assign_ | Weather warnings CAP/API |
| **Ingestion – Pegel** | `modules/ingestion/adapters/pegelonline/` | 🔲 Stub | _assign_ | River levels BW |
| **Ingestion – HVZ** | `modules/ingestion/adapters/hvz/` | 🔲 Stub | _assign_ | Traffic / flood portals |
| **Ingestion – Police** | `modules/ingestion/adapters/police/` | 🔲 Stub | _assign_ | Press release RSS |
| **Ingestion – News** | `modules/ingestion/adapters/news/` | 🔲 Stub | _assign_ | Local news RSS |
| **Normalization** | `modules/normalization/` | 🟡 Partial | _assign_ | Zod schemas, event type rules |
| **Geocoding** | `modules/geocoding/` | 🔲 Stub | _assign_ | NER + geocode BW locations |
| **Correlation** | `modules/correlation/` | 🔲 Stub | _assign_ | Dedup + merge events |
| **Scoring** | `modules/scoring/` | 🔲 Stub | _assign_ | Credibility, severity, triage |
| **Summarization** | `modules/summarization/` | 🔲 Stub | _assign_ | LLM situational overview |
| **Events API** | `modules/events/` | 🟡 Partial | _assign_ | Dashboard feed, filters |
| **Frontend** | `../../frontend/` | 🟡 Shell | _assign_ | Map + report list UI |

## Adding a new ingestion source

1. Create `modules/ingestion/adapters/<name>/` with:
   - `<name>.types.ts` — API response types
   - `<name>.mapper.ts` — map to `IngestedReport`
   - `<name>.adapter.ts` — implement `IngestionAdapter`
2. Register in `ingestion.service.ts` → `registerDefaults()`
3. Add env flags if needed in `app/config/index.ts`

## Adapter contract

```typescript
interface IngestionAdapter {
  readonly id: DataSourceId;
  readonly label: string;
  start(onReport: (report: IngestedReport) => void): void | Promise<void>;
  stop(): void;
}
```

## Keywords

Edit `shared/constants/crisisKeywords.ts` — used by all social adapters.
