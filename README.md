# Crisis Monitor (Code the State Hackathon)

Automated crisis monitoring for Baden-Württemberg — replacing manual VOST internet monitoring with real-time ingestion, classification, and situational awareness.

## Repository layout

```
├── backend/                 # TypeScript Express API + ingestion pipeline
│   ├── src/
│   │   ├── app/             # Express bootstrap, config
│   │   ├── modules/         # Feature modules (ingestion, geocoding, scoring, …)
│   │   └── shared/          # Logger, constants, utils, database
│   ├── prisma/              # Postgres schema (optional)
│   ├── docs/                # Architecture + module ownership
│   └── tests/
├── frontend/                # React (Vite) dashboard (legacy)
├── frontend-next/           # Next.js verification cockpit (recommended UI)
└── package.json
```

**Collaboration:** see [backend/docs/MODULES.md](backend/docs/MODULES.md) for module ownership and how to add sources.

## Quick start

```bash
npm run install:all
cp backend/.env.example backend/.env
# Add MASTODON_ACCESS_TOKEN to backend/.env
npm run dev:backend
npm run dev:frontend-next   # http://localhost:3000 — needs backend on :3001
```

Optional database:

```bash
cd backend && docker compose up -d
# Set DATABASE_URL in backend/.env, then:
npm run db:generate --prefix backend
npm run db:migrate --prefix backend
```

## API

| Endpoint | Description |
|----------|-------------|
| `GET /api/health` | Service health |
| `GET /api/sources` | Active ingestion adapters |
| `GET /api/events` | Clustered crisis events |
| `GET /api/events/:id` | Event detail with all signals |
| `GET /api/reports` | Flat ingested reports (debug) |

## Working today

- Multi-source ingestion (Mastodon, Bluesky, DWD, Pegel, FIRMS) → geocoding → scoring → **hybrid clustering**
- `frontend-next` verification cockpit maps clustered events to the UI (see `frontend-next/README.md`)
- Clustering tunables: `backend/docs/CLUSTERING.md`

## Keywords

Edit `backend/src/shared/constants/crisisKeywords.ts`.
