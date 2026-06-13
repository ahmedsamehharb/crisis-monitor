import type { EventType, Urgency } from "@/lib/types";
import type { AnzeigeStufe, KonfidenzStufe, TrendRichtung } from "@/lib/ui";

export const de = {
  meta: {
    title: "Codewehr | Verifikations-Cockpit",
    description:
      "Lagebild und Verifikation in einem: Die KI sammelt, synthetisiert und belegt, der Mensch entscheidet.",
  },
  locale: {
    label: "Sprache wählen",
    de: "Deutsch",
    en: "English",
  },
  topbar: {
    subtitle: "Verifikations-Cockpit",
    time: "Uhrzeit",
    locationChoose: "Standort wählen",
    locationClose: "Auswahl schließen",
    locationList: "Gemeinde wählen",
    allMunicipalities: "Alle Gemeinden",
    counters: "Lagezähler",
    open: "offen",
    onHold: "on hold",
    rated: "bewertet",
    notifications: "Benachrichtigungen",
    role: "Rolle S2",
  },
  queue: {
    aria: "Meldungslisten",
    inbox: "Eingang",
    onHold: "On Hold",
    archive: "Bereits bewertet",
    emptyInbox: "Keine offenen Meldungen im Eingang.",
    emptyHold: "Keine Meldungen on hold.",
    emptyArchive: "Noch keine Bewertungen.",
    sortByUrgency: "Nach Dringlichkeit",
    sortByConfidence: "Nach Konfidenz",
    sortSwitch: "Sortierung wechseln, aktuell nach {mode}",
    fakeAlert: "Verdacht auf Falschmeldung",
    forwarded: "an Stab weitergegeben",
    discarded: "verworfen",
    forwardedAria: "An Stab weitergegeben",
    discardedAria: "Verworfen",
    viral: "viral",
    sources: "{count} Quellen",
    typeOne: "Typ",
    typeOther: "Typen",
    shares: "{count} Shares",
  },
  drawer: {
    collapse: "Entscheidungsansicht einklappen",
    expand: "Entscheidungsansicht ausklappen",
    aria: "Entscheidungsansicht",
  },
  detail: {
    empty: "Kein Fall geöffnet. Wähle eine Meldung aus der Liste.",
    aria: "Entscheidungsansicht",
    close: "Detail schließen",
    fakeAlert: "Verdacht auf Falschmeldung",
    disinformation: "Desinformation",
    reviewedBy: "wird geprüft von:",
    you: "du",
    newSince: "Neu seit zuletzt:",
    aiAssessment: "KI-Einschätzung",
    suspicion: "Verdacht",
    trend: "Trend",
    trendIn: "in {min} Min",
    why: "Warum:",
    zoneAssessment: "Beurteilung",
    zoneEvidence: "Belege",
    claimCirculating: "Behauptung im Umlauf",
    officialData: "Offizielle Datenlage",
    axisAgainst: "Was spricht dagegen?",
    axisMissing: "Fehlt noch zur Eskalation",
    axisCredible: "Glaubwürdig?",
    axisUrgent: "Dringend?",
    suspicionReason: "Verdachtsgrund",
    fulfilled: "Erfüllt",
    open: "Offen",
    openSuffix: " · offen",
    noCheckpoints: "Keine Prüfpunkte vorhanden.",
    where: "Wo",
    when: "Wann",
    what: "Was",
    circulatingSince: "seit {min} Min im Umlauf",
    stillActive: "noch aktiv",
    noNewSignals: "keine neuen Signale",
    spread: "Verbreitung",
    shares: "Shares",
    sharesDelta: "+{delta} in {min} Min",
    sourcesByType: "Quellen nach Typ",
    sourceSocial: "Social",
    sourceWeather: "Wetter und Pegel",
    sourceOfficial: "Amtlich",
    originalEvidence: "Originalbeleg",
    toSource: "Zur Quelle",
    evidenceDetail: "Belege im Detail",
    signal: "Signal",
    signals: "Signale",
    escalateMissing: "Für eine Eskalation fehlt noch: {item}.",
    escalateHoldHint: "On hold holt den Fall automatisch zurück, sobald Neues eintrifft.",
    actionCorrect: "Richtigstellung anstoßen",
    actionObserve: "Weiter beobachten",
    actionNoFake: "Kein Fake · entwarnen",
    actionForward: "An Stab weitergeben",
    actionOnHold: "On hold",
    actionDiscard: "Verwerfen",
    notePlaceholder: "Notiz zur Entscheidung (wird protokolliert) ...",
    noteLabel: "Notiz zur Entscheidung",
    aiDisclaimer: "Die KI belegt. Die Entscheidung trifft der Mensch und wird protokolliert.",
    resultCorrect: "Richtigstellung angestoßen",
    resultNoFake: "Entwarnt, kein Fake",
    resultForward: "An Stab weitergegeben",
    resultDiscard: "Verworfen",
    note: "Notiz",
    logged: "protokolliert",
    reopen: "Erneut bewerten",
  },
  map: {
    aria: "Lagekarte",
    thisEvent: "Nur dieses Event",
    allEvents: "Alle Lagen",
    zoomIn: "Hineinzoomen",
    zoomOut: "Herauszoomen",
    spatialConsistent: "Signalbild räumlich konsistent · {count} Signale",
    singleSignal: "Einzelsignal · keine räumliche Bestätigung",
    social: "Social",
    weather: "Wetter",
    official: "Amtlich",
    level: "Stufe {level} · {label}",
    openDetail: "Im Detail öffnen",
  },
  evidence: {
    socialTitle: "Social Media",
    socialEmpty: "Keine Social-Media-Signale vorhanden.",
    post: "Beitrag",
    posts: "Beiträge",
    plausibility: "Plausibilität",
    hidePosts: "Einzelposts ausblenden",
    showPostsOne: "{count} Einzelpost anzeigen",
    showPostsOther: "{count} Einzelposts anzeigen",
    imageAlt: "Bild aus Beitrag von {author} (Platzhalter)",
    openPost: "Beitrag öffnen",
    weatherTitle: "Wetter und Pegel",
    weatherEmpty: "Keine Wetter- oder Pegel-Signale vorhanden.",
    officialTitle: "Amtliche Quellen",
    officialEmpty: "Keine amtliche Bestätigung · Lage offen.",
    signal: "Signal",
    signals: "Signale",
  },
  source: {
    loading: "Datenquelle wird geladen ...",
    backend: "Echte Backend-Events (geclustert)",
    hybrid: "Demo-Lage + Live-Events vom Backend",
    mock: "Demo-Lage (Backend nicht erreichbar oder noch keine Live-Events)",
  },
  confidence: {
    prefix: "Konfidenz",
    niedrig: "niedrig",
    mittel: "mittel",
    hoch: "hoch",
    verifiziert: "Verifiziert",
    aria: "Konfidenz {level}",
  },
  urgency: {
    1: "Gering",
    2: "Mäßig",
    3: "Erhöht",
    4: "Kritisch",
    5: "Akut",
    meter: "Dringlichkeit {level} von 5",
    level: "Stufe {level} von 5 · {label}",
  } satisfies Record<Urgency | "meter" | "level", string>,
  trend: {
    steigend: "steigend",
    fallend: "fallend",
    stabil: "stabil",
    aria: "Trend {dir}",
  } satisfies Record<TrendRichtung | "aria", string>,
  holdHint: {
    threshold: "Schwelle erreicht",
    surge: "Starker Anstieg",
  },
  unread: {
    one: "{count} neues Signal",
    other: "{count} neue Signale",
  },
  eventType: {
    Hochwasser: "Hochwasser",
    Starkregen: "Starkregen",
    Brand: "Brand",
    Verkehrsunfall: "Verkehrsunfall",
    Infrastrukturausfall: "Infrastrukturausfall",
    Sturm: "Sturm",
    Sonstiges: "Sonstiges",
  } satisfies Record<EventType, string>,
  time: {
    oClock: " Uhr",
    agoMin: "vor {min} Min",
    agoHourMin: "vor {h} Std {min} Min",
  },
};

export type Messages = typeof de;

export function translateConfidence(m: Messages, stufe: KonfidenzStufe | "verifiziert"): string {
  return m.confidence[stufe as AnzeigeStufe];
}

export function translateUrgency(m: Messages, u: Urgency): string {
  return m.urgency[u];
}

export function translateEventType(m: Messages, type: EventType): string {
  return m.eventType[type];
}

export function fmtTime(m: Messages, iso: string): string {
  return `${iso.slice(11, 16)}${m.time.oClock}`;
}

export function fmtAgo(m: Messages, min: number): string {
  if (min >= 60) {
    const h = Math.floor(min / 60);
    return m.time.agoHourMin.replace("{h}", String(h)).replace("{min}", String(min % 60));
  }
  return m.time.agoMin.replace("{min}", String(min));
}

export function plural(m: Messages, key: "sourceTypes" | "showPosts" | "unread", count: number): string {
  if (key === "unread") {
    const tpl = count === 1 ? m.unread.one : m.unread.other;
    return tpl.replace("{count}", String(count));
  }
  if (key === "sourceTypes") {
    return `${count} ${count === 1 ? m.queue.typeOne : m.queue.typeOther}`;
  }
  const tpl = count === 1 ? m.evidence.showPostsOne : m.evidence.showPostsOther;
  return tpl.replace("{count}", String(count));
}
