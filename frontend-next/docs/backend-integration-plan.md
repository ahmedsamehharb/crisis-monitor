# Backend-Anbindung: Codewehr-Frontend an crisis-monitor

Stand 2026-06-12. Ergebnis eines read-only Scans von
`https://github.com/ahmedsamehharb/crisis-monitor.git`. Dieses Dokument ist der
Handoff für die neue Session, in der die Anbindung Schritt für Schritt gebaut
wird. Am crisis-monitor wurde nichts geändert, nur gelesen.

## Ausgangslage

**Unser Frontend (dieses Repo, `codewehr/`)**
- Next.js 15 App Router, TypeScript, Tailwind v4, MapLibre, lucide-react.
- Datenmodell `lib/types.ts`: ein `Event` ist ein **synthetisiertes Cluster**
  mit `titel`, `zusammenfassung`, Belegen gruppiert in `social / wetter / amtlich`,
  `urteil` (Wo/Wann/Was, Glaubwürdigkeits-Checkliste), `confidence` (0..1),
  `urgency` (1..5), `verifiziert`, optional `verdacht` (Fake-Verdacht).
- Aktuell gespeist aus `data/events.ts` (Mock), kein Fetch.

**crisis-monitor (fremdes Repo)**
- Monorepo: `backend/` (Express + TypeScript, Prisma optional, Modul-Architektur,
  Ingestion-Adapter für Mastodon, Bluesky, DWD, Pegelonline, FIRMS, HVZ, Police,
  News) und `frontend/` (Vite + React **JSX**, kein TypeScript, kein Next).
- API heute:
  | Endpoint | Inhalt |
  |---|---|
  | `GET /api/health` | Service-Health |
  | `GET /api/sources` | aktive Ingestion-Adapter |
  | `GET /api/events` | `{ count, reports: EventListItem[] }` |
- `EventListItem` = `IngestedReport` plus `credibilityScore?`, `severityScore?`.
  Ein Report ist ein **einzelnes Roh-Signal**, kein Cluster:
  `id, source, sourceId, rawText, url, author, createdAt, ingestedAt, keywords,
  eventType, mediaUrls, metadata, location {lat,lon,municipality,district,state},
  trust (0..1), severity (0..1)`.
- Scoring: `trust`/`credibility` und `severity` sind beide auf 0..1 geclampt.
  `SOURCE_BASE_TRUST`: dwd .95, pegelonline .9, police .9, firms .85, hvz .85,
  news .75, bluesky/mastodon .5.
- Zusammenfassung existiert nur **global** (`SituationSummary`: headline,
  narrative, recommendations, affectedAreas), nicht pro Cluster.

## Kernlücke (warum nicht plug and play)

1. **Cluster vs. Roh-Report.** Unser Frontend erwartet synthetisierte Events mit
   gruppierten Belegen. Das Backend liefert flache Einzel-Reports. Die
   Correlation- und Merger-Module sind **Stubs** (`event-merger.merge()` gibt
   `null`, `correlation.findRelated()` nur Text-Ähnlichkeit > 0.5). Es gibt heute
   also **kein** Clustering in Events.
2. **Modellform.** Es fehlen pro Cluster: `titel`, `zusammenfassung`, `urteil`
   (Wo/Wann/Was, Checkliste), `verifiziert`, `verdacht`. `confidence`/`urgency`
   müssen aus `trust`/`severity` abgeleitet werden.
3. **Tech-Stack.** crisis-monitor `frontend/` ist Vite/JSX, unseres ist Next/TS.
   "Frontend hinzufügen" ist eine echte Architektur-Entscheidung (siehe unten).

## Daten-Mapping (Backend → unser Event)

| Unser Feld | Quelle im Backend | Regel |
|---|---|---|
| `confidence` (0..1) | `credibilityScore`/`trust` | direkt; bei Cluster: Aggregat (z.B. max oder gewichtet) |
| `verifiziert` | `source` der Reports | true, wenn mind. ein Report aus amtlicher Quelle (dwd, pegelonline, hvz, police, firms) mit hohem trust. Deckt sich mit unserer Entscheidung "amtlich bestätigt" |
| `urgency` (1..5) | `severityScore`/`severity` (0..1) | `Math.max(1, Math.ceil(severity * 5))` |
| `eventType` | `eventType` (en) | Map: flood/flood_risk→Hochwasser, heavy_rain→Starkregen, fire/wildfire→Brand, traffic_accident→Verkehrsunfall, infrastructure_failure→Infrastrukturausfall, storm/thunderstorm→Sturm, snow_ice/heatwave/fog_event/unknown→Sonstiges |
| `belege.social` | reports mit source bluesky, mastodon | Synthese + Einzelposts |
| `belege.wetter` | reports mit source dwd, pegelonline, hvz | |
| `belege.amtlich` | reports mit source police, news, firms | |
| `ort` | `location.municipality`/`district` | |
| `lat`/`lon` | `location.lat`/`lon` | Cluster-Zentroid |
| `wann` | frühestes/letztes `createdAt` im Cluster | |
| `titel`, `zusammenfassung`, `urteil` | nicht vorhanden | muss erzeugt werden (Backend-Synthese, idealerweise per LLM-Summary pro Cluster) |
| `verdacht` (Fake) | nicht vorhanden | Backend hat kein Fake-Konzept. V1: weglassen, später nachrüsten |

## Phasen-Plan (non-breaking, Schritt für Schritt)

**Phase 0 · Entscheidung Frontend-Strategie.** Erster Schritt der neuen Session.
Siehe offene Entscheidungen. Bestimmt alles Weitere.

**Phase 1 · Frontend liest echte Reports (nur unser Repo, additiv).**
- Neu: `lib/api.ts` mit `fetchEvents()` gegen `GET /api/events` und
  `mapReportToEvent()` als reine Funktion (Mapping-Tabelle oben). Naives
  Client-Clustering nur als Übergang (gleicher Ort + ähnlicher eventType + Zeit).
- Env `NEXT_PUBLIC_API_BASE`. `data/events.ts` bleibt **Fallback**, wenn API nicht
  erreichbar. Nichts am Backend, nichts am crisis-monitor.

**Phase 2 · Clustering ins Backend (crisis-monitor, additiv).**
- Stubs füllen: `correlation` + `event-merger` clustern Reports nach Zeit, Ort,
  Ähnlichkeit. Neuer Endpoint `GET /api/clusters` (oder `/api/situations`),
  der bestehenden `/api/events` **unberührt** lässt.
- Pro Cluster: aggregierte `confidence`/`urgency`, Beleg-Gruppen, `verifiziert`.

**Phase 3 · Synthese ins Backend.** `titel`, `zusammenfassung`, `urteil` pro
Cluster (LLM-Summary-Service ist vorhanden). Frontend konsumiert dann direkt
Cluster, Client-Clustering aus Phase 1 entfällt.

**Phase 4 · Hosting im Monorepo.** Erst wenn 1 bis 3 stehen: unser Next-Frontend
als `frontend/` einsetzen oder als `frontend-next/` daneben, je nach Phase-0-Wahl.

## Offene Entscheidungen (zu Beginn der neuen Session klären)

1. **Frontend-Strategie:** (a) deren Vite/JSX-Frontend durch unser Next-Frontend
   ersetzen, (b) unsere Komponenten nach Vite/React portieren, (c) Next-Frontend
   eigenständig lassen und nur per API koppeln. Empfehlung: erst koppeln (Phase 1
   gegen laufendes Backend), Hosting-Frage später.
2. **Clustering-Ort:** Backend (empfohlen, gehört dorthin) vs. vorübergehend
   Frontend. Empfehlung Backend ab Phase 2.
3. **verifiziert-Regel** exakt festzurren (welche Quellen, welcher trust-Schwelle).
4. **Fake-Verdacht:** im Backend nicht vorhanden. V1 ohne, später als eigenes
   Signal/Heuristik nachrüsten.

## Setup-Notizen für die neue Session

- crisis-monitor: `npm run install:all`, `cp backend/.env.example backend/.env`
  (MASTODON_ACCESS_TOKEN nötig), `npm run dev:backend`. Optional Postgres via
  `cd backend && docker compose up -d`.
- Read-only Scan-Clone lag unter `/tmp/crisis-monitor-scan` (nicht committet,
  kann gelöscht werden). Für echte Arbeit frisch klonen.
- Bekannte Frontend-Stolperfallen unverändert gültig: siehe `CLAUDE.md` und
  `components/MapView.tsx` (MapLibre-Container braucht h-full/w-full +
  ResizeObserver; Karten-Section braucht `isolate`).
