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

Das Frontend liest echte Reports von `GET /api/events` des Backends in diesem Repo (`backend/`). Die Anbindung ist additiv: ist das Backend nicht erreichbar oder liefert es (noch) keine Reports, bleibt der Mock-Fallback aktiv.

1. Backend starten (eigenes Terminal, aus der Repo-Wurzel):

   ```bash
   npm install --prefix backend
   cp backend/.env.example backend/.env   # PORT=3001 ist Default
   npm run dev:backend
   ```

   Prüfen: `curl http://localhost:3001/api/events` liefert `{ "count": N, "reports": [...] }`.

2. Frontend konfigurieren: Basis-URL des Backends setzen.

   ```bash
   cp .env.example .env.local
   # NEXT_PUBLIC_API_BASE zeigt per Default auf http://localhost:3001
   ```

3. `npm run dev` im `frontend-next/`. Unten links zeigt ein Indikator die aktive Datenquelle (echte Backend-Daten vs. Mock-Fallback).

### Port-Hinweis

Next dev läuft auf 3000, das Backend auf 3001, also keine Kollision. Belegt etwas Port 3000, mit `npm run dev -- -p 3001` ausweichen (dann `NEXT_PUBLIC_API_BASE` entsprechend anpassen, falls das Backend verschoben wird).

## Wie die Anbindung funktioniert (Phase 1)

Das Backend liefert heute flache **Einzel-Reports** (`IngestedReport`), kein Clustering. Das Cockpit erwartet synthetisierte **Events** mit gruppierten Belegen. Den Übergang macht der Adapter `lib/api.ts`:

- `fetchEvents()`: holt `GET {NEXT_PUBLIC_API_BASE}/api/events`, robust gegen Netz- und Formfehler.
- `mapReportToEvent()`: reine Funktion, ein Report → ein Event.
- `clusterReports()`: naives Client-Clustering nach Ort, Ereignistyp und Zeitfenster, Belege gruppiert in `social` / `wetter` / `amtlich`.

Wichtige Mapping-Regeln stehen als benannte Konstanten oben in `lib/api.ts`:

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
