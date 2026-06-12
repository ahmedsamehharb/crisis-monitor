# Redesign: Codewehr Verifikations-Cockpit (Crisis Response Operations Dashboard)

## Aufgabe
Gestalte das komplette UI des "Codewehr Verifikations-Cockpit" neu, inklusive drei
neuer bzw. überarbeiteter Bereiche: On-Hold-Bereich, Fake-News-Verdacht und
Entscheidungsansicht. Die App existiert bereits funktional (Next.js, drei Spalten),
wirkt aber unruhig: zu viele Pills, zu viel Farbe ohne Bedeutung, Kennzahlen
doppelt. Ziel ist ein ruhiges, near-monochromes Einsatz-Werkzeug für
Entscheidungen unter Zeitdruck. Alle UI-Texte Deutsch. Nur Dark Mode.
Desktop-first ab 1440px.

## Produktkontext
Ein Dashboard für virtuelles Krisen-Monitoring (VOST-Modell): Eine Person (Rolle
S2 im Führungsstab) sichtet KI-gefundene Krisenmeldungen aus Social Media, News
und offiziellen Quellen und beurteilt pro Fall: an den Stab weitergeben,
verwerfen, oder on hold (auf weitere Evidenz warten).
WICHTIGSTE PRINZIPIEN:
- Die KI eskaliert NIEMALS selbst und bestätigt NIEMALS selbst. Sie sammelt,
  synthetisiert, belegt und hebt höchstens visuell hervor.
- Die KI empfiehlt KEINE Aktion und hebt keinen Button hervor. Kein "KI schlägt
  vor: eskalieren", kein vorausgewählter Button (Automatismus-Bias vermeiden).
- Bei Falschmeldungen immer "Verdacht auf Falschmeldung", nie "Falschmeldung".
- Jede Aussage trägt Quelle, Zeit und Plausibilität. Das Urteil trifft sichtbar
  der Mensch.

## Token-Vertrag (ersetzt Code-Inspektion, bindend)
Verwende AUSSCHLIESSLICH diese Tokens. Erfinde keine neuen Farben, Größen,
Abstände oder Radien:
- Flächen: Canvas #12121A · Panel #1B1B27 · Card #232333 · Linie #2C2C3A
- Text: primär #F2F3F7 (nur höchste Priorität rein weiß) · sekundär #9AA0B4
- Semantik: success #3FB36B · warning #E7B53C · danger #E5484D · accent #4C8DFF
  (accent nur für Interaktion/Info-Hinweise, nie für Status oder Gefahr)
- Severity-Rampe 1 bis 5: #3FB36B, #9DCB5A, #E7B53C, #E8843C, #E5484D,
  NUR an Severity-Kante, Karten-Pins und Segment-Meter
- Typo: Inter, tabular figures für ALLE Zahlen, Zeiten, Prozente, IDs
- Radien: max 8px · Borders normal 0.5 bis 1px in #2C2C3A
- Icons: ein Set, Lucide-Stil (Outline, einheitliche Strichstärke), keine zweite Library
Status nie über Farbe allein: immer Farbe PLUS Icon, Form oder Label
(Farbfehlsichtigkeit). Light Mode existiert nicht.

## Anti-Dopplungs-Regeln (bindend)
Jede Kennzahl erscheint pro Ansicht genau EINMAL:
- Konfidenz in der Entscheidungsansicht: genau einmal, als STUFEN-Pill
  (hoch/mittel/niedrig) in der KI-Einschätzung, optional mit angehängtem Wert
  ("Konfidenz hoch · 85 %"). Nie eine nackte Prozentzahl als Hauptsignal
  (Schein-Präzision), kein zusätzlicher Konfidenz-Balken.
- Dringlichkeit in der Entscheidungsansicht: genau einmal, als Segment-Meter
  (5 Segmente + "Stufe 4 von 5 · Kritisch") im Kopf der Achse "Dringend?".
- Listen-Zeile: Severity nur als 3px-Kante links plus Typ-Icon, rechts genau
  EIN Wert (Konfidenz-% bzw. Trend bzw. Viralität). Ort/Zeit einmal pro Ansicht.
- Hold-Status genau eine Markierung. Icons nur funktional, kein Deko-Schmuck.
Aufklapp-Logik im Drei-Spalten-Cockpit: Listen zeigen IMMER nur den
zusammengeklappten Zeilen-Zustand; das Öffnen eines Falls öffnet die
Entscheidungsansicht in der Mitte. Nie beides zugleich.

## Layout
Drei Spalten: links Listen (~340px), Mitte Entscheidungsansicht, rechts Karte
(größte Fläche). Linke Spalte: 1. "Eingang (N)", 2. "On Hold (N)",
3. "Bereits bewertet (M)" (einklappbar). Persistente Statusleiste oben.

## Bereich A: Statusleiste
Links Wortmarke "Codewehr" klein und ruhig. Mitte: Uhrzeit (tabular),
Standort-Wahl als einziges Filter-Element (Dropdown: Alle Gemeinden /
Schwäbisch Gmünd / Mutlangen / Remseck), Zähler "4 offen · 3 on hold ·
2 bewertet". Rechts Alarmglocke und Nutzer "S. Lindner · S2".
Keine Suche, keine weiteren Filter.

## Bereich B: Eingang (Warteschlange)
Dichte Zeilen statt Karten: 3px Severity-Kante links, Typ-Icon klein grau,
Titel einzeilig, darunter "Ort · Zeit", rechts Konfidenz-Prozent (tabular).
Aktive Zeile eine Stufe heller plus Akzent-Kante. Sortierung als Text-Toggle.

## Bereich C: Entscheidungsansicht (EINE Komponente für alle Fall-Typen)
Öffnet sich, wenn ein Fall aus Eingang ODER On Hold geöffnet wird. Kein reines
Anzeige-Element, sondern ein Urteilswerkzeug. Leitfrage: "Reicht das, was ich
sehe, für eine Entscheidung, und wenn nicht, was fehlt?" Drei Zonen von oben
nach unten, dem Urteilsfluss folgend:

Zone 1 · Überblick (worum geht es):
- Ereignis-Icon (Typ), Titel groß fett, Ereignistyp.
- Teamstatus: "wird geprüft von: du" / Name (Öffnen markiert den Fall für
  andere als in Bearbeitung, verteiltes Team, keine Doppelarbeit).
- KI-Einschätzung als eigene Zeile, prominent aber nicht dominierend:
  Aussage ("Hochwasser, real") + Konfidenz-STUFE als Pill in semantischer
  Farbe (hoch = success, mittel = warning, niedrig = danger), optional mit
  Wert: "Konfidenz hoch · 85 %". Darunter das WARUM in einer Zeile (Signale,
  auf denen die Einschätzung beruht), damit die Person nachvollziehbar
  widersprechen kann.
- Originalbeleg: Wortlaut des Posts + Link zur Quelle.

Zone 2 · Zwei getrennte Urteilsachsen nebeneinander (responsive Grid, brechen
auf schmalen Screens untereinander). Zentrale Designentscheidung:
Glaubwürdigkeit und Dringlichkeit sind zwei verschiedene Fragen mit
verschiedenen Signalen, nicht vermischen.
- Achse A "Glaubwürdig?" (stimmt das überhaupt?): Signale als kurze Liste mit
  Status-Icon je Zeile: erfüllt = Häkchen (success), offen = Uhr (warning).
  Beispiele: Anzahl unabhängiger Quellen, Übereinstimmung mit offiziellen
  Daten (Pegel/Wetter), Widerspruchsfreiheit, offene Bestätigungen.
- Achse B "Dringend?" (muss der Stab das jetzt wissen?): Kopfzeile =
  Urgency-Segment-Meter. Darunter FESTES Schema mit kleinen Uppercase-Labels:
  Wo: Ort + was ihn brisant macht (Wohngebiet, Pflegeheim/Klinik im Umkreis).
  Wann: wann gemeldet + ob noch aktiv (Frische).
  Was: die konkrete Gefahr ("Person eingeschlossen, Wasser hüfthoch").
  Dieses Wo/Wann/Was-Raster gilt konsistent für ALLE Fall-Typen, damit die
  Person es einmal lernt und jeden Fall gleich schnell liest.
- Darunter, aufklappbar: Belege im Detail in drei Gruppen (Social-Synthese
  mit Einzelposts, Wetter/Pegel, Amtlich). Pro Signal: Quelle als neutraler
  Label-Chip, Zeit tabular, "Plausibilität 72 %" als Text. Leere Gruppe:
  gestrichelte Zeile "Keine amtliche Bestätigung · Lage offen".

Zone 3 · Entscheidung:
- "Was fehlt"-Hinweis (info-getönt, accent dezent) ÜBER den Buttons, wenn die
  Glaubwürdigkeit unvollständig ist: nennt das fehlende Stück und macht
  On hold als ehrliche Option sichtbar ("Für eine Eskalation fehlt noch:
  visuelle Bestätigung. On hold holt den Fall automatisch zurück, sobald sie
  eintrifft."). Lenkt sanft, entscheidet NICHT vor.
- DREI GLEICHWERTIGE Aktionen, kein Highlight, kein vorausgewählter Button,
  gleiche Größe und Bauart, Unterscheidung nur über semantische Farbe + Icon:
  "An Stab weitergeben" (success) · "On hold" bzw. bei On-Hold-Fällen
  "Weiter beobachten" (neutral) · "Verwerfen" (danger).
  Weitergeben trägt den relevanten Kontext mit (z.B. Pflegeheim, eingeschlossene
  Person), damit der Stab nicht nachfragen muss.
- Notizfeld + Trust-Satz: "Die KI belegt. Die Entscheidung trifft der Mensch
  und wird protokolliert."
AUSNAHME-REGEL: Die Entscheidungsansicht ist die einzige View OHNE eine
hervorgehobene Primäraktion, bewusst gegen Automatismus-Bias. Überall sonst
gilt: eine klare Primäraktion pro View.

Fall-Typ-Anpassung (gleiche Komponente, der Fall-Typ bestimmt Labels und
Hauptaktion, keine zweite Komponente):
- Normaler Fall: wie oben.
- On-Hold-Fall: zusätzlich über den Achsen ein Delta-Banner (info-getönt,
  nur wenn es Neues gibt): "Neu seit zuletzt: 3 Quellen · Pegel bestätigt",
  plus Box "Quellen nach Typ" (ein Pill pro Typ mit Anzahl: social, news,
  pegel, wetter, verkehr). Kopf zeigt Trend: "60 → 85 % in 12 Min".
  Achse A doppelt als "Fehlt noch zur Eskalation"-Checkliste.
- Fake-Verdacht: Zone 2 beginnt mit den zwei Kontrast-Boxen nebeneinander:
  "Behauptung im Umlauf" (danger-getönt, Wortlaut) gegen "Offizielle
  Datenlage" (success-getönt). Achse A heißt "Was spricht dagegen?" und
  listet die Verdachtsgründe (widerspricht HVZ-Pegel, Bild aus 2021 per
  Rückwärtssuche, Quelle unverifiziert). Achse B: Wo = betroffene Region +
  Einwohner im Umkreis, Wann = seit wann im Umlauf, Was = welche
  Falschbehauptung. Zusätzlich Verbreitung: "3.200 Shares · +800 in 10 Min"
  (tabular, Tausendertrennung) + Plattform-Pills (X, WhatsApp, Facebook).
  Hauptaktion heißt "Richtigstellung anstoßen" (danger; meldet an Stab UND
  Pressestelle), dritte Aktion "Kein Fake · entwarnen" (die KI kann sich
  irren, der Mensch nimmt zurück).

## Bereich D: Karte
Dunkle Karte (MapLibre, Carto Dark Matter). Pins rund, Severity-Farbe,
Typ-Icon, aktiver Pin größer mit Ring, bewertete gedimmt. Segmented control
"Nur dieses Event / Alle Lagen". Event-Modus: verortete Einzelsignale als
kleine Punkte, je Quellart Farbe UND Form (Social: Kreis, Wetter: Quadrat,
Amtlich: Raute), plus Panel "Signalbild räumlich konsistent · 6 Signale" bzw.
Warnung "Einzelsignal · keine räumliche Bestätigung". Pin-Popover: Titel, Ort,
Werte, ein Button "Im Detail öffnen". Runde Zoom-Buttons.

## Bereich E: On-Hold-Liste (linke Spalte)
Meldungen, die noch nicht entscheidungsreif sind. Die KI reichert sie laufend
an, der Konfidenz-Score verändert sich. Zeilen-Zustand ("Triage im
Vorbeigehen", eine Zeile):
- Typ-Icon, Titel
- Subtext: "{quellenGesamt} Quellen · {typenAnzahl} Typen · vor {x} Min gesehen"
- rechts Trend-Indikator: Pfeil + Konfidenz-% (tabular): steigend = Pfeil
  hoch-rechts in success, fallend/stabil = Pfeil in Sekundärgrau
- Chevron als Affordanz; Auswahl öffnet die Entscheidungsansicht (On-Hold-Variante).
Highlight-Logik (KEIN Auto-Eskalieren): hervorgehoben, wenn Konfidenz >= 90
ODER Anstieg >= 20 Punkte in <= 15 Min. Hervorgehobene Zeilen: 2px-Rahmen in
warning, Glocken-Icon + Grund ("Schwelle erreicht" / "starker Anstieg"),
nach oben sortiert. Nur Hervorhebung, die KI löst keine Aktion aus.

## Bereich F: Fake-News-Verdacht in den Listen
Muss beim Scannen SOFORT erkennbar sein, eigener Zeilen-Typ, kein Seiten-Badge:
- Warn-/Alarm-Icon statt Ereignis-Icon
- 2px-Rahmen in danger (klar anders als die ruhigen normalen Borders)
- kleine Status-Headline ÜBER dem Titel: "VERDACHT AUF FALSCHMELDUNG"
  (danger, klein, zuerst lesbar)
- Titel als Behauptung: "Angeblicher Dammbruch Neckar"
- Subtext: Kernwiderspruch + Verbreitung: "widerspricht HVZ-Pegel ·
  3.200 Shares, stark steigend"
- rechts statt Konfidenz ein Viralitäts-Indikator (Trendpfeil + Label), denn
  bei Fake-News ist Verbreitung das relevante Maß, nicht Echtheits-Konfidenz.
Hebt sich ab, ohne die Liste zu sprengen: über danger und Form, kein Fremdstil.

## Lautstärke-Regel
Genau ZWEI Stellen dürfen lauter werden: On-Hold-Highlight (warning-Rahmen)
und Fake-Verdacht (danger-Rahmen). Alles andere bleibt neutral und ruhig.
Beide tragen Icon + Text, nie Farbe allein.

## Beispieldaten für die Mocks
Eingang: "Grundschule Lindenweg überflutet" (Hochwasser, 4/5, 88 %, Schwäbisch
Gmünd, 10 Posts mit 1 Foto, DWD + Pegel, Feuerwehr) · "Baum auf Fahrbahn
Kullaroo Rd" (Sturm, 3/5, 70 %, Mutlangen) · "Kellerbrand Bahnhofstraße"
(Brand, 3/5, 60 %, amtlich offen).
On Hold: "Brand Backnang" (60 %, fallend, ruhig) · "Überflutung Remseck"
(60 → 85 % in 12 Min, steigend, Quellen: social 4, news 2, pegel 1) ·
"Stromausfall Ludwigsburg" (Anstieg auf 92 %, HERVORGEHOBEN, "starker Anstieg") ·
dazwischen der Fake-Verdacht "Angeblicher Dammbruch Neckar bei Remseck".
Entscheidungsansicht normaler Fall ("Überflutung Remseck"): KI-Einschätzung
"Hochwasser, real" · Konfidenz hoch · 85 % · Begründung "3 unabhängige
Quellentypen, deckt sich mit HVZ-Pegel, kein Widerspruch". Glaubwürdig:
3 unabhängige Quellen erfüllt, Pegel erfüllt, visuelle Bestätigung offen.
Dringend: Wo "Neckarstraße, Wohngebiet, Pflegeheim 300 m" · Wann "vor 6 Min,
noch aktiv" · Was "Person eingeschlossen, Wasser hüfthoch". Was fehlt:
"visuelle Bestätigung". Teamstatus "wird geprüft von: du".
Entscheidungsansicht Fake-Fall ("Angeblicher Dammbruch"): Behauptung "Damm
gebrochen, höher gelegene Gebiete aufsuchen" gegen Datenlage "HVZ-Pegel
fallend, unter Meldestufe" · Gründe: widerspricht Pegel, Bild aus 2021,
unverifizierte Quelle · 3.200 Shares, +800 in 10 Min · X, WhatsApp, Facebook ·
Remseck, ~9.000 Einwohner im Umkreis · Link zum Originalpost.

## DESIGN STYLE: Crisis Response Operations Dashboard (bindend)
PURPOSE: Dashboard für Einsatzkräfte unter Zeitdruck. Design dient schnellem
Lesen und Entscheiden, nicht der Ästhetik. Jede visuelle Entscheidung muss
kognitive Last reduzieren. Keine Dekoration.
CORE PRINCIPLE: Farbe ist Signal, nie Stimmung. Near-monochrom als Default.
Farbe nur mit Bedeutung: Severity, Status, geforderte Aktion. Trägt eine
Farbe keine Information, entfernen.
THEME: Dunkle Basis, Panels ein bis zwei Stufen heller als der Canvas, Tiefe
über Fläche statt Rahmen überall. Reines Weiß nur für höchstpriorisierten Text.
TYPOGRAPHY: Eine Grotesk (Inter). Tabular figures für alle Werte. Starke
Hierarchie: große fette Werte, kleine Uppercase-Labels, Sekundärtext mit
echtem Kontrast, kein Grau-auf-Grau.
LAYOUT: Dichte erlaubt, aber striktes Grid mit konsistenten Spacing-Tokens.
Kritischstes oben links bzw. am größten. Persistente Statusleiste.
COMPONENTS: Status immer Punkt/Balken PLUS Label. Eine klare Primäraktion pro
View (einzige Ausnahme: die drei gleichwertigen Buttons der
Entscheidungsansicht, siehe Bereich C). Feed-Zeilen mit Zeitstempel und
führendem Severity-Marker.
AVOID: Keine Gradients, kein Glassmorphism, kein Glow, keine
Rounded-Everything-Weichheit (max 8px), keine illustrativen Icons, keine
animierten Flourishes, keine dekorative Farbe. Rahmen nur, wo sie beim
Scannen helfen. Ruhig, flach, lesbar, schnell.

## Deliverable
Fünf Desktop-Screens als HTML-Mock (1440px, Dark):
1. Hauptansicht: drei Spalten, Entscheidungsansicht mit normalem Fall
   "Überflutung Remseck" (alle drei Zonen, "Was fehlt"-Hinweis sichtbar),
   Karte "Alle Lagen".
2. On-Hold-Liste: alle Zeilen-Zustände (ruhig fallend, steigend,
   hervorgehoben mit warning-Rahmen) plus Fake-Verdacht-Zeile im Kontrast.
3. Entscheidungsansicht On-Hold-Fall: Delta-Banner, Quellen-nach-Typ,
   Trend "60 → 85 % in 12 Min", Aktionen mit "Weiter beobachten".
4. Entscheidungsansicht Fake-Verdacht: Kontrast-Boxen, Verdachtsgründe,
   Verbreitung, "Richtigstellung anstoßen".
5. Archiv-Zustand: bewerteter Fall, Ergebnis + Notiz + "Erneut bewerten".
