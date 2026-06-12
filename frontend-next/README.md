# Codewehr, Verifikations-Cockpit (frontend-next)

Dunkles Dashboard für den Katastrophenschutz: Eine Person (Rolle S2 im Führungsstab) sichtet eingehende Ereignisse aus dem Internet-Monitoring und entscheidet pro Ereignis, ob es an den kommunalen Krisenstab geht. Leitprinzip: Die KI sammelt, synthetisiert und belegt, der Mensch entscheidet.

Dieses Verzeichnis ist ein **eigenständiges Next.js-Frontend** (Next 15, App Router, TypeScript, Tailwind v4, MapLibre). Es steht **neben** dem bestehenden `frontend/` (Vite/JSX) und ersetzt es nicht. Beide Ordner und das `backend/` bleiben unangetastet.

## Starten

```bash
npm install
npm run dev
```

Danach http://localhost:3000 öffnen.

Ohne erreichbares Backend läuft das Cockpit mit Mock-Daten aus `data/events.ts` weiter (Fallback). Die Karte nutzt MapLibre GL mit dem freien Carto-Dark-Matter-Style (Internetverbindung erforderlich).

## Kopplung an das crisis-monitor Backend

Das Frontend konsumiert die **serverseitig geclusterten CrisisEvents** aus `backend/`:

| Endpoint | Inhalt |
|---|---|
| `GET /api/events` | Liste geclusteter Ereignisse |
| `GET /api/events/:id` | Ein Ereignis + alle Signale (`signals[]`) zur Verifikation |
| `GET /api/reports` | Flache Roh-Reports (Legacy-Fallback) |

Ist das Backend nicht erreichbar oder liefert es 0 Events, bleibt der Mock-Fallback aus `data/events.ts` aktiv.

1. Backend starten (aus der Repo-Wurzel):

   ```bash
   npm run install:all
   cp backend/.env.example backend/.env
   npm run dev:backend
   ```

   Prüfen: `curl http://localhost:3001/api/events` liefert `{ "count": N, "events": [...] }`.

2. Frontend konfigurieren:

   ```bash
   cd frontend-next
   cp .env.example .env.local
   npm run dev
   ```

   Oder aus der Wurzel: `npm run dev:frontend-next`

3. Unten links zeigt ein Indikator die aktive Datenquelle. Events werden alle 30 Sekunden neu geladen; Bewertungen (bestätigt/abgelehnt) bleiben lokal erhalten.

### Port-Hinweis

Next dev: **3000**, Backend: **3001** — keine Kollision.

## Wie die Anbindung funktioniert (Phase 2)

`lib/api.ts` mappt Backend-Cluster auf das UI-Modell (`lib/types.ts`):

- `fetchEvents()`: `GET /api/events`, lädt pro Event `GET /api/events/:id` für Belege (Social / Wetter / Amtlich).
- `mapCrisisEventToEvent()`: Cluster-Rollups (`credibilityScore`, `severityScore`, `locationLabel`) + Signale → ein Cockpit-Event.
- Legacy-Fallback: flache `GET /api/reports` + Client-Clustering, falls die alte API-Form noch antwortet.

Wichtige Mapping-Regeln stehen als benannte Konstanten in `lib/api.ts`:

| Unser Feld | Quelle im Backend | Regel |
|---|---|---|
| `confidence` | `credibilityScore` bzw. `trust` | im Cluster: Maximum |
| `verifiziert` | `source` + `trust` | amtliche Quelle (dwd, pegelonline, hvz, police, firms) mit `trust ≥ 0.85` |
| `urgency` | `severity` | `max(1, ceil(severity · 5))` |
| `eventType` | `eventType` (en) | flood→Hochwasser, heavy_rain→Starkregen, fire/wildfire→Brand, traffic_accident→Verkehrsunfall, infrastructure_failure→Infrastrukturausfall, storm/thunderstorm→Sturm, sonst Sonstiges |

`titel`, `zusammenfassung` und `urteil` entstehen in dieser Phase **minimal** aus vorhandenen Feldern. Die richtige Synthese (inkl. KI-Zusammenfassung und Fake-Verdacht) gehört später ins Backend, dann entfällt das Client-Clustering. Der vollständige Phasenplan steht in `docs/backend-integration-plan.md`. Eine Beispiel-Antwort der API liegt unter `docs/backend-samples/`.

## Struktur

- `lib/api.ts`: Backend-Adapter (Netzwerk + reines Mapping + Clustering)
- `data/events.ts`: Mock-Daten als Fallback, gleiche Form wie `lib/types.ts`
- `lib/`: Datenmodell, Severity-Rampe, Icon-Mapping, Sortier- und Signal-Helfer
- `components/`: Topbar, QueueColumn, EventDetail (EvidenceSocial/Weather/Official, DecisionBar), MapView, gemeinsame UI

## Bedienung

- Kachel oder Karten-Pin wählt das Ereignis, Hover verknüpft Kachel und Pin
- Pfeiltasten navigieren die Warteschlange, alle Bedienelemente sind fokussierbar
- Entscheidung unten im Detail: an Krisenstab weitergeben, verwerfen, on hold, plus Notiz
- Bewertete Ereignisse wandern in "Bereits bewertet" und bleiben revidierbar

Das Design-Konzept liegt in `docs/DESIGN.md`.
