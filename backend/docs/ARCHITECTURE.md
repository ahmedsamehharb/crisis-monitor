# Architecture

Crisis monitoring backend for automating VOST-style internet monitoring in Baden-Württemberg.

## Pipeline

```
┌─────────────┐    ┌──────────────┐    ┌────────────┐    ┌───────────┐
│  Ingestion  │───▶│ Normalization│───▶│ Geocoding  │───▶│  Scoring  │
│  adapters   │    │   + schema   │    │ (stub)     │    │  (stub)   │
└─────────────┘    └──────────────┘    └────────────┘    └───────────┘
       │                  │                                      │
       │                  ▼                                      ▼
       │           ┌──────────────┐                        ┌─────────────┐
       └──────────▶│    Events    │◀──────────────────────│ Correlation │
                   │  API + store │                       │   (stub)    │
                   └──────────────┘                        └─────────────┘
                            │
                            ▼
                   ┌──────────────┐
                   │ Summarization│  → municipal situational overview (stub)
                   └──────────────┘
```

## Implemented

- **Mastodon** + **Bluesky** search ingestion
- **Normalization** to `IngestedReport`
- **Events** in-memory store + optional Postgres (Prisma)
- **REST API**: `/api/health`, `/api/events`, `/api/sources`

## Module ownership

See [MODULES.md](./MODULES.md) for per-folder responsibilities and collaboration guide.

## Data model

Canonical type: `modules/normalization/report.types.ts` → `IngestedReport`

Each adapter maps source-specific payloads via `*.mapper.ts` and implements `IngestionAdapter`.
