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
├── frontend/                # React (Vite) dashboard
└── package.json
```

**Collaboration:** see [backend/docs/MODULES.md](backend/docs/MODULES.md) for module ownership and how to add sources.

## Quick start

```bash
npm run install:all
cp backend/.env.example backend/.env
# Add MASTODON_ACCESS_TOKEN to backend/.env
npm run dev:backend
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
| `GET /api/events` | Recent crisis reports (memory or DB) |

## Working today

- Mastodon + Bluesky keyword ingestion → terminal + `/api/events`
- Modular stubs for DWD, Pegelonline, HVZ, police, news, geocoding, scoring, summarization

## Keywords

Edit `backend/src/shared/constants/crisisKeywords.ts`.
