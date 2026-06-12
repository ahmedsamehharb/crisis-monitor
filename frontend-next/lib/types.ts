export type Urgency = 1 | 2 | 3 | 4 | 5;

export type EventStatus = "neu" | "hold" | "bestaetigt" | "abgelehnt";

export type EventType =
  | "Hochwasser"
  | "Starkregen"
  | "Brand"
  | "Verkehrsunfall"
  | "Infrastrukturausfall"
  | "Sturm"
  | "Sonstiges";

export interface SocialPost {
  id: string;
  plattform: "BlueSky" | "Reddit" | "Mastodon";
  autor: string;
  text: string;
  zeit: string;
  url?: string;
  bild?: string;
  plausibilitaet: number;
  /** Optionale Verortung des Signals für den Karten-Modus "Nur dieses Event" */
  lat?: number;
  lon?: number;
}

/** Synthese aus N Posts, im UI ausklappbar */
export interface SocialSynthese {
  zusammenfassung: string;
  posts: SocialPost[];
}

export interface WetterSignal {
  quelle: "DWD" | "PEGELONLINE" | "HVZ";
  text: string;
  zeit: string;
  plausibilitaet: number;
  lat?: number;
  lon?: number;
}

export interface AmtlichesSignal {
  quelle: "Polizei" | "Feuerwehr" | "Landratsamt" | "MobiData BW" | "Nachrichten" | "NASA FIRMS";
  text: string;
  zeit: string;
  plausibilitaet: number;
  lat?: number;
  lon?: number;
}

/** Ein Punkt der Glaubwürdigkeits-Checkliste in der Entscheidungsansicht */
export interface CheckPunkt {
  label: string;
  status: "erfuellt" | "offen";
}

/** Urteilsdaten für die zwei Achsen (Glaubwürdig? / Dringend?) */
export interface UrteilsDaten {
  glaubwuerdig: CheckPunkt[];
  /** Straßengenauer Ort für das Wo/Wann/Was-Raster */
  wo: string;
  /** Was den Ort brisant macht (Wohngebiet, Pflegeheim im Umkreis) */
  woHinweis?: string;
  /** Läuft die Lage noch */
  nochAktiv?: boolean;
  /** Die konkrete Gefahr */
  was: string;
  /** Fehlendes Stück für eine Eskalation (speist den Was-fehlt-Hinweis) */
  fehlt?: string;
}

/** Zusatzdaten für On-Hold-Fälle (KI reichert laufend an) */
export interface HoldDaten {
  /** Konfidenz bei der letzten Sichtung */
  konfidenzVorher: number;
  /** Minuten seit der letzten Sichtung */
  seitMin: number;
  /** Delta-Punkte für das Banner "Neu seit zuletzt" */
  neuSeitZuletzt?: string[];
}

/** Markiert einen Fall als Verdacht auf Falschmeldung (eigener Zeilen-Typ) */
export interface FakeVerdacht {
  /** Wortlaut der Behauptung im Umlauf */
  behauptung: string;
  /** Offizielle Datenlage als Gegentext */
  datenlage: string;
  /** Verdachtsgründe (Achse "Was spricht dagegen?") */
  gruende: string[];
  /** Kernwiderspruch für die Listen-Subzeile */
  kernwiderspruch: string;
  shares: number;
  sharesDelta: number;
  deltaMin: number;
  plattformen: string[];
  /** Betroffene im Umkreis, z. B. "~9.000 Einwohner im Umkreis" */
  betroffene?: string;
}

export interface Event {
  id: string;
  titel: string;
  eventType: EventType;
  ort: string;
  lat: number;
  lon: number;
  wann: string;
  urgency: Urgency;
  /** KI-Konfidenz 0..1, ergibt die Stufe niedrig/mittel/hoch */
  confidence: number;
  /**
   * Eigener Status ÜBER der KI-Konfidenz: amtlich oder menschlich bestätigt.
   * Hebt die angezeigte Stufe auf "verifiziert" an, unabhängig vom Score.
   */
  verifiziert?: boolean;
  zusammenfassung: string;
  /** Kurze KI-Aussage für den Kopf der Entscheidungsansicht, z. B. "Hochwasser, real" */
  einschaetzung?: string;
  /** Begründung der Einschätzung in einer Zeile */
  warum?: string;
  urteil?: UrteilsDaten;
  hold?: HoldDaten;
  verdacht?: FakeVerdacht;
  belege: {
    social?: SocialSynthese;
    wetter?: WetterSignal[];
    amtlich?: AmtlichesSignal[];
  };
  status: EventStatus;
  /** Notiz des Verifizierers zur Entscheidung */
  notiz?: string;
  /** Uhrzeit der Bewertung (HH:MM), gesetzt bei bestaetigt/abgelehnt */
  bewertetUm?: string;
}
