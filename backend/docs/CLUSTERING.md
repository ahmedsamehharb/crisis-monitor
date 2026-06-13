# Hybrid Event Clustering

This document describes how ingested **signals** (`ScoredReport`) are grouped into **crisis events** (`CrisisEvent`), which parameters you can tune, and how a frontend should consume the API.

---

## What the system does

```
Ingest → Normalize → Geocode → Score → Cluster → Persist
```

Each incoming signal is compared against **open** crisis events using a hybrid similarity score:

1. **Hard gates** (must all pass): compatible event type, within time window, plausible location
2. **Soft score** (0–1): weighted blend of geo, time, type, and text overlap
3. **Decision threshold**: merge if similarity ≥ 0.7, otherwise create a separate event

### End result for operators

| Before | After |
|--------|-------|
| Flat list of reports from many sources | Grouped **events** with aggregated title, location, trust, severity |
| Hard to verify if social post matches official warning | One event page shows **all signals** side by side |

Example: FIRMS hotspot on Südstraße, Heilbronn + Bluesky post “Feuer in Heilbronn” → **one event**, two signals.

---

## API (frontend integration)

Base URL: `http://localhost:3001` (or your deployed backend).

CORS is enabled (`cors()` in Express). Call from any frontend origin during development.

### List clustered events (dashboard)

```
GET /api/events?limit=50
```

**Response:**

```json
{
  "count": 2,
  "events": [
    {
      "id": "uuid",
      "title": "Wildfire — Heilbronn, Südstraße",
      "eventType": "wildfire",
      "status": "open",
      "latitude": 49.137,
      "longitude": 9.213,
      "locationLabel": "Heilbronn, Südstraße",
      "summary": "2 signal(s) from 2 source(s): firms, bluesky",
      "firstDetectedAt": "2026-06-12T10:00:00.000Z",
      "lastUpdatedAt": "2026-06-12T10:15:00.000Z",
      "credibilityScore": 0.72,
      "severityScore": 0.85,
      "sourceCount": 2,
      "reportIds": ["clx...", "clx..."]
    }
  ]
}
```

### Event detail with all signals (verification view)

```
GET /api/events/:id
```

**Response:**

```json
{
  "event": { "...same fields as list item..." },
  "signals": [
    {
      "id": "clx...",
      "source": "firms",
      "rawText": "...",
      "url": "",
      "author": "",
      "createdAt": "...",
      "eventType": "wildfire",
      "trust": 0.9,
      "severity": 0.85,
      "location": { "lat": 49.137, "lon": 9.213, "municipality": "Heilbronn" },
      "keywords": ["Feuerwehr"],
      "metadata": { "locationLabel": "..." }
    },
    {
      "id": "clx...",
      "source": "bluesky",
      "rawText": "Feuer in Heilbronn!",
      "trust": 0.4,
      "severity": 0.8,
      "location": { "lat": 49.142, "lon": 9.219, "municipality": "Heilbronn" }
    }
  ],
  "sourceBreakdown": [
    { "source": "firms", "count": 1 },
    { "source": "bluesky", "count": 1 }
  ]
}
```

**Frontend usage:**

- **Map view**: use `event.latitude` / `event.longitude` for pin; draw signal markers from each `signals[].location`
- **Verification panel**: render `signals` sorted by `createdAt`; show `trust`, `severity`, `source`, `rawText`, `url`
- **Trust badge**: use `event.credibilityScore`; boost visually when `sourceCount > 1` and `sourceBreakdown` has mixed categories (official + social)
- **Polling**: `GET /api/events?limit=20` every 15–30s, or add WebSockets later

### Flat reports (debug)

```
GET /api/reports?limit=50
```

Returns unclustered recent reports. Prefer `/api/events` for the main UI.

### Health check

```
GET /api/health
```

---

## Similarity formula

```
similarity = W_GEO * geoScore + W_TIME * timeScore + W_TYPE * typeScore + W_TEXT * textScore
```

| Component | Range | Meaning |
|-----------|-------|---------|
| `geoScore` | 0–1 | Municipality match, street-vs-city parent rule, or distance-based |
| `timeScore` | 0–1 | `max(0, 1 - hoursApart / maxWindowHours)` |
| `typeScore` | 0–1 | 1.0 same type, 0.8 compatible cluster, 0 otherwise |
| `textScore` | 0–1 | Jaccard on keywords + tokens + municipality |

Hard gates return `similarity = 0` if any gate fails.

---

## Decision threshold

| Condition | Action |
|-----------|--------|
| `similarity ≥ CLUSTER_MERGE_THRESHOLD` (default **0.7**) | Merge into best matching open event |
| `similarity < CLUSTER_MERGE_THRESHOLD` | Create a separate new event |

---

## Tunable parameters

All values can be set in `.env`. Defaults are in `src/modules/correlation/clustering.config.ts`.

### Decision threshold

| Variable | Default | Description |
|----------|---------|-------------|
| `CLUSTER_MERGE_THRESHOLD` | `0.7` | Merge when similarity ≥ this; below this → new separate event |

### Similarity weights (should sum to ~1.0)

| Variable | Default | Description |
|----------|---------|-------------|
| `CLUSTER_WEIGHT_GEO` | `0.35` | Weight for location component |
| `CLUSTER_WEIGHT_TIME` | `0.30` | Weight for time component |
| `CLUSTER_WEIGHT_TYPE` | `0.25` | Weight for event type component |
| `CLUSTER_WEIGHT_TEXT` | `0.10` | Weight for keyword/text overlap |

### Time windows (hours)

Signals farther apart than the window cannot cluster.

| Variable | Default | Event types |
|----------|---------|-------------|
| `CLUSTER_WINDOW_FIRE_HOURS` | `12` | `fire` |
| `CLUSTER_WINDOW_WILDFIRE_HOURS` | `12` | `wildfire` |
| `CLUSTER_WINDOW_FLOOD_HOURS` | `48` | `flood` |
| `CLUSTER_WINDOW_FLOOD_RISK_HOURS` | `48` | `flood_risk` |
| `CLUSTER_WINDOW_STORM_HOURS` | `24` | `storm` |
| `CLUSTER_WINDOW_THUNDERSTORM_HOURS` | `24` | `thunderstorm` |
| `CLUSTER_WINDOW_HEAVY_RAIN_HOURS` | `24` | `heavy_rain` |
| `CLUSTER_WINDOW_TRAFFIC_HOURS` | `6` | `traffic_accident` |
| `CLUSTER_WINDOW_DEFAULT_HOURS` | `12` | all other types |

### Location radii (km)

Used when matching by distance (Haversine). Municipality match bypasses strict distance.

| Variable | Default | Precision tier |
|----------|---------|----------------|
| `CLUSTER_RADIUS_STREET_KM` | `5` | Street / address / highway |
| `CLUSTER_RADIUS_CITY_KM` | `20` | City-only geocode |
| `CLUSTER_RADIUS_SENSOR_KM` | `10` | FIRMS, Pegel, DWD |
| `CLUSTER_RADIUS_DISTRICT_KM` | `30` | District-only |
| `CLUSTER_RADIUS_DEFAULT_KM` | `15` | Unknown precision |

### Geo scoring

| Variable | Default | Description |
|----------|---------|-------------|
| `CLUSTER_MUNICIPALITY_MATCH_SCORE` | `0.9` | Geo score when cities match |
| `CLUSTER_PARENT_CHILD_GEO_SCORE` | `0.9` | Street-level + city-only, same municipality |

### Trust rollup

Event `credibilityScore` (0–1) is recomputed whenever signals merge:

```
credibilityScore = min(1,
  average(signal trust)
  + (sourceCategories − 1) × CLUSTER_TRUST_BOOST_PER_CATEGORY
  + (signalCount − 1) × CLUSTER_TRUST_BOOST_PER_SIGNAL
)
```

More merged signals raise confidence even when individual posts have low base trust (e.g. social).

| Variable | Default | Description |
|----------|---------|-------------|
| `CLUSTER_TRUST_BOOST_PER_CATEGORY` | `0.08` | Added trust per extra source category (official / sensor / social) |
| `CLUSTER_TRUST_BOOST_PER_SIGNAL` | `0.05` | Added trust per additional merged signal on the same event |

### Performance

| Variable | Default | Description |
|----------|---------|-------------|
| `CLUSTER_MAX_CANDIDATES` | `50` | Max open events compared per incoming signal |

### Code-level (not env)

Edit `src/modules/correlation/event-type-clusters.ts` to change **compatible type groups**:

```ts
['fire', 'wildfire']
['flood', 'flood_risk']
['storm', 'thunderstorm', 'heavy_rain']
```

---

## Event type compatibility

| Cluster | Types |
|---------|-------|
| Fire | `fire`, `wildfire` |
| Flood | `flood`, `flood_risk` |
| Storm | `storm`, `thunderstorm`, `heavy_rain` |
| Traffic | `traffic_accident` only |

`unknown` can match any type during hard gates; use higher merge threshold (`CLUSTER_UNKNOWN_TYPED_THRESHOLD` = 0.85) for unknown→typed merges in future tuning.

---

## Database

With `DATABASE_URL` set:

```bash
npm run db:migrate   # apply schema (Report.crisisEventId, CrisisEvent fields)
npm run db:generate
```

Without DB: clustering works in **in-memory** mode (lost on restart).

### Schema

- `Report.crisisEventId` → FK to `CrisisEvent`
- `CrisisEvent.reportIds[]` — denormalized list for quick reads
- Rollup fields: `title`, `credibilityScore`, `severityScore`, `sourceCount`, `firstDetectedAt`, `lastUpdatedAt`

---

## Module map

| File | Role |
|------|------|
| `correlation/clustering.config.ts` | Env-backed tunables |
| `correlation/event-type-clusters.ts` | Type compatibility + time windows |
| `correlation/location-similarity.ts` | Haversine, municipality, precision tiers |
| `correlation/similarity.service.ts` | Full similarity computation |
| `correlation/event-merger.service.ts` | Event title, location, trust rollups |
| `correlation/correlation.service.ts` | Merge / create decisions |
| `events/crisis-events.repository.ts` | CrisisEvent persistence |
| `ingestion/ingestion.service.ts` | Calls `persistAndCluster()` after scoring |

---

## Tuning tips

| Problem | Try |
|---------|-----|
| Too many duplicate events (under-merging) | Lower `CLUSTER_MERGE_THRESHOLD` to `0.65`; increase `CLUSTER_RADIUS_CITY_KM` |
| Unrelated events merged (over-merging) | Raise `CLUSTER_MERGE_THRESHOLD` to `0.75`; lower city radius; shorten time windows |
| Social + sensor not linking | Ensure geocoding sets `location.municipality`; check `CLUSTER_MUNICIPALITY_MATCH_SCORE` |
| Two fires same city merged wrongly | Shorten `CLUSTER_WINDOW_FIRE_HOURS`; raise merge threshold |

---

## Example frontend fetch (React)

```ts
const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export async function fetchEvents() {
  const res = await fetch(`${API}/api/events?limit=30`);
  return res.json();
}

export async function fetchEventDetail(id: string) {
  const res = await fetch(`${API}/api/events/${id}`);
  if (!res.ok) throw new Error('Event not found');
  return res.json();
}
```

Set `VITE_API_URL` in your frontend `.env` to the backend URL in production.
