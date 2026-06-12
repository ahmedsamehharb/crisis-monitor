# Design-Konzept: Codewehr Verifikations-Cockpit

## Leitidee

Ein Entscheidungs-Fließband für eine Person: links der Vorrat (Warteschlange), in der Mitte der Fall (Beleg-Dossier mit Entscheidung), rechts der Raum (Karte). Die Blickrichtung folgt dem Arbeitsfluss: sichten, prüfen, verorten, entscheiden.

## Layout-Raster

- Topbar 64px: Wortmarke links, Suche und Filter-Pills mittig, Nutzer und Glocke rechts
- Drei-Spalten-Grid `320px / 5fr / 6fr` mit 12px Gutter, jede Spalte ein eigenständiges Panel mit interner Scroll-Zone
- Entscheidungsleiste klebt unten im Detail-Panel (immer erreichbar, kein Scrollen nötig)
- Unter 1280px kollabiert die Detail-Spalte zu einem Overlay über der Karte (Karte bleibt Kontext, Close-Button)

## Farbsystem: zwei strikt getrennte Sprachen

- Flächen: `#12121A` Bühne, `#1B1B27` Panel, `#232333` Card, `#2C2C3A` Rahmen, `#F2F3F7` Text, `#9AA0B4` Meta
- Interaktions-Akzent `#4C8DFF` (kühl): nur aktive Zustände, CTAs, Confidence. Niemals für Gefahr.
- Severity-Rampe (warm, 1 grün bis 5 rot: `#3FB36B`, `#9DCB5A`, `#E7B53C`, `#E8843C`, `#E5484D`): nur Urgency-Badges, Pin-Füllungen, Icon-Kreise
- Lesart: warm = Lage, blau = Werkzeug

## Komponenten-Inventar

`Topbar` | `QueueColumn` mit `EventTile` und `ArchiveList` | `EventDetail` mit `DetailHeader`, `EvidenceSocial` (Synthese-Karte plus aufklappbarer `PostList`), `EvidenceWeather`, `EvidenceOfficial`, `DecisionBar` | `MapView` mit `EventPin`, `MapPopover`, `MapModeToggle`, Zoom-Buttons | geteilt: `Chip`, `Pill`, `UrgencyBadge`, `ConfidenceBar`

## Interaktionsprinzipien

1. **Trust-Spine:** Jede Aussage trägt Quelle, Zeit und Plausibilität als Chip. Die KI synthetisiert sichtbar ("aus N Beiträgen"), entscheidet aber nie. Der Hinweis steht direkt an der Entscheidungsleiste.
2. **Verknüpfte Markierung:** Hover auf Kachel hebt den Pin, Hover auf Pin die Kachel.
3. **Ein Fall, ein Fokus:** Entscheidung unten, danach Auto-Advance zum nächsten Event. Bewertetes wandert ins aufklappbare Archiv und bleibt revidierbar, Hold bleibt markiert in der Queue.
4. **Kartenmodi:** "Alle Lagen" für den Überblick (aktives Event hervorgehoben, Bewertetes gedimmt), "Nur dieses Event" zeigt die verorteten Einzelsignale als Cluster mit Realness-Hinweis: räumliche Konsistenz als Plausibilitätsargument, Einzelsignale werden explizit als unbestätigt ausgewiesen.
5. **Tastatur und Kontrast:** Pfeiltasten navigieren die Queue, alles fokussierbar mit sichtbarem Fokusring, Text auf Flächen mit hohem Kontrast.

## Typografie und Form

Inter, fette Headlines, kleine gedämpfte Meta-Zeilen. Radien: Panels 20px, Cards 16px, Pills voll rund. Chips auf `rgba(255,255,255,0.06)`. Weiche, niedrig-kontrastige Schatten nur für schwebende Elemente (Popover, Dropdown).
