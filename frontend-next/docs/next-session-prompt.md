# Start-Prompt für die Implementierungs-Session (Opus 4.8)

Kopiere den Block unten als erste Nachricht der neuen Session und hänge das
Claude-Design-Handoff an.

---

Projekt: Codewehr Verifikations-Cockpit unter
/Users/lukecaporelli/Desktop/mindpalace/codewehr
(Next.js 15 App Router, TypeScript, Tailwind v4, MapLibre GL, lucide-react,
Mock-Daten in data/events.ts, kein Backend).

AUFGABE: Ich poste dir gleich ein Claude-Design-Handoff (HTML-Mock des
Redesigns "Crisis Response Operations Dashboard"). Du setzt es in die
bestehende App um und ich will live mittunen.

SCHRITT 1, SOFORT: Starte den Dev-Server (npm run dev im codewehr-Ordner,
Port 3000), damit ich jede Änderung direkt im Browser sehe. WICHTIG: Niemals
npm run build laufen lassen, während der Dev-Server läuft, das zerschießt
dessen .next-Cache und die Seite verliert ihr CSS (schon passiert; Fix war:
Server stoppen, .next löschen, neu starten).

SCHRITT 2, BEVOR DU CODE SCHREIBST: Erkunde das bestehende Projekt und fasse
kurz zusammen, was du gefunden hast (Design-Tokens, Karten-/Listen-Komponenten,
Icon-Library, Meldungs-Datenmodell) und wie du dich einfügst. Relevante Dateien:
- app/globals.css: Tokens als Tailwind-v4-@theme (bg/panel/card/line/ink/mute/
  accent) plus .cw-pin/.cw-dot Karten-Styles
- lib/types.ts (Event-Datenmodell), lib/ui.ts (Severity-Rampe SEV,
  TYPE_ICON, URGENCY_LABEL, confidenceColor, sortQueue, signalPoints)
- components/: Topbar, QueueColumn (EventTile, ArchiveList), EventDetail
  (DecisionBar, EvidenceSocial/Weather/Official), MapView, ui.tsx (Chip, Pill,
  UrgencyBadge, ConfidenceBar, UrgencyMeter)
- app/page.tsx: State (events, selectedId, hoveredId, mapMode, gemeinde,
  sortBy, detailOpen), Drei-Spalten-Grid
- docs/redesign-prompt.md: die vollständige Spezifikation des Redesigns
  (Token-Vertrag, Anti-Dopplungs-Regeln, Bereiche A bis F inkl. On-Hold,
  Fake-News-Verdacht und Entscheidungsansicht). Das Design-Handoff wurde aus
  genau diesem Prompt erzeugt; bei Widersprüchen gilt das Handoff fürs
  Visuelle, die Spec für Logik und Prinzipien.

UMSETZUNGSREGELN:
- Das Handoff pixelgetreu nachbauen, aber in der bestehenden
  Komponentenstruktur: bestehende Komponenten erweitern statt neue Forks.
  Datenmodell in lib/types.ts erweitern, kein zweites Modell.
- Nur vorhandene bzw. im Handoff definierte Tokens, keine erfundenen Werte.
  Nur lucide-react als Icon-Library.
- Alle UI-Texte Deutsch. Keine Gedankenstriche (em/en-dashes) in Texten,
  Punkt/Komma/Mittepunkt nutzen.
- Logik von Darstellung trennen (reine Funktionen in lib/), Schwellen als
  benannte Konstanten, Aktionen als Callbacks.
- Accessibility: Status nie über Farbe allein (Icon + Text), Tastatur-
  Bedienbarkeit, aria-Labels.
- Nach jedem größeren Schritt im Browser verifizieren (Screenshot), bevor du
  weitermachst.

BEKANNTE STOLPERFALLEN (beide schon einmal gefixt, nicht regressen):
- MapLibres CSS überschreibt position:absolute des Karten-Containers mit
  position:relative; der Container braucht explizit h-full w-full plus
  ResizeObserver (ist so in components/MapView.tsx gelöst).
- Die Karten-Section braucht isolate, sonst stechen Marker-z-Indizes durch
  Overlays.

Hier das Design-Handoff:
[HANDOFF HIER EINFÜGEN]
