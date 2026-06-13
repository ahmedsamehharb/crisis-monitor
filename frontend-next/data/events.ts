import type { Event } from "@/lib/types";

/**
 * Mock-Daten für das Verifikations-Cockpit.
 * Austauschbar gegen eine echte API: gleiche Struktur wie lib/types.ts.
 * Koordinaten: Raum Schwäbisch Gmünd (Ostalbkreis).
 */

/** Fester Bezugszeitpunkt der Mock-Lage für relative Zeitangaben */
export const MOCK_NOW = "2026-06-12T09:30:00";

export const INITIAL_EVENTS: Event[] = [
  {
    id: "ev-1",
    titel: "Seniorenheim Haus Remsblick – Teilevakuierung",
    eventType: "Hochwasser",
    ort: "Schwäbisch Gmünd, Remstal",
    lat: 48.7978,
    lon: 9.7631,
    wann: "2024-07-12T08:22:00",
    urgency: 4,
    confidence: 0.91,
    verifiziert: true,
    zusammenfassung:
      "Das Erdgeschoss des Seniorenheims Haus Remsblick ist durch Rückstau aus der Rems überflutet. Die Feuerwehr Schwäbisch Gmünd ist mit vier Fahrzeugen vor Ort; 18 mobile Bewohner wurden in das Obergeschoss verlegt, 6 bettlägerige Bewohner warten auf Hochbetttransport. PEGELONLINE meldet Meldestufe 3 an der Messstelle Remseck; die DWD-Warnung vor ergiebigem Dauerregen für den Ostalbkreis ist weiterhin aktiv. Drei unabhängige Quellentypen stimmen zeitlich und räumlich überein.",
    einschaetzung: "Hochwasser, bestätigt – Personenrisiko",
    warum: "Feuerwehr bestätigt Lage · Pegel Meldestufe 3 · DWD Warnstufe 3 · 4 Augenzeugen",
    urteil: {
      glaubwuerdig: [
        { label: "Amtliche Bestätigung (Feuerwehr Gmünd)", status: "erfuellt" },
        { label: "PEGELONLINE Meldestufe 3 aktiv", status: "erfuellt" },
        { label: "DWD Dauerregenwarnung Stufe 3", status: "erfuellt" },
        { label: "Mehrere unabhängige Augenzeugen", status: "erfuellt" },
        { label: "Foto aus Einrichtung vorhanden", status: "erfuellt" },
      ],
      wo: "Remstalstraße 14, Schwäbisch Gmünd",
      woHinweis: "24 Bewohner vor Ort, 6 bettlägerig",
      nochAktiv: true,
      was: "EG überflutet, Teilevakuierung läuft, Hochbetttransport angefordert",
    },
    status: "neu",
    belege: {
      social: {
        zusammenfassung:
          "8 Beiträge aus Mastodon und BlueSky berichten seit 08:22 Uhr übereinstimmend von stehendem Wasser im Erdgeschoss des Seniorenheims. Ein Angehöriger postet ein Foto aus dem Innenhof. Pflegepersonal bestätigt die Evakuierung im Live-Update. Zwei Beiträge liefern nur Kontext ohne eigene Beobachtung vor Ort.",
        posts: [
          {
            id: "p1-1",
            plattform: "Mastodon",
            autor: "@remstal_info@mastodon.social",
            text: "⚠️ Haus Remsblick in Schwäbisch Gmünd: Erdgeschoss steht unter Wasser, Feuerwehr vor Ort. Remstalstraße ist gesperrt.",
            zeit: "2026-06-12T08:27:00",
            plausibilitaet: 0.88,
            bild: "https://picsum.photos/seed/vera-seniorenheim/520/300",
            url: "https://mastodon.social/@remstal_info",
            lat: 48.7981,
            lon: 9.7635,
          },
          {
            id: "p1-2",
            plattform: "BlueSky",
            autor: "@familie_bauer_gd",
            text: "Meine Mutter wohnt im Haus Remsblick – gerade Anruf vom Personal: alle mobilen Bewohner wurden ins Obergeschoss gebracht, ihr geht's gut. Aber das Wasser steigt noch.",
            zeit: "2026-06-12T08:34:00",
            plausibilitaet: 0.9,
            url: "https://bsky.app/profile/familie-bauer-gd",
          },
          {
            id: "p1-3",
            plattform: "Mastodon",
            autor: "@gmuend_live@social.bund.de",
            text: "Aktuelle Lage Remstal: Feuerwehr Gmünd pumpt Erdgeschoss Seniorenheim aus. Vier Löschfahrzeuge + THW-Anforderung für Hochbetttransport läuft.",
            zeit: "2026-06-12T08:41:00",
            plausibilitaet: 0.92,
            lat: 48.7977,
            lon: 9.7628,
          },
          {
            id: "p1-4",
            plattform: "BlueSky",
            autor: "@pflege_gd_real",
            text: "Wir sind gerade mitten in der Evakuierung. 18 Bewohner oben, 6 brauchen Hochbetttransport. Bitte keine Sensationsfotos – danke.",
            zeit: "2026-06-12T08:45:00",
            plausibilitaet: 0.87,
          },
          {
            id: "p1-5",
            plattform: "BlueSky",
            autor: "@rems_pegel_watch",
            text: "Pegel Rems Gmünd gerade 341 cm – Meldestufe 3. So hoch war es zuletzt im Juni 2024.",
            zeit: "2026-06-12T08:29:00",
            plausibilitaet: 0.82,
          },
          {
            id: "p1-6",
            plattform: "Mastodon",
            autor: "@ostalb_hilft@mastodon.social",
            text: "Wer im Remstal helfen kann (Fahrzeug, Unterkunft): DRK Ortsverein GD koordiniert unter Tel. 07171-xxx.",
            zeit: "2026-06-12T08:50:00",
            plausibilitaet: 0.7,
          },
          {
            id: "p1-7",
            plattform: "BlueSky",
            autor: "@wetterradar_bw",
            text: "Stundensummen über dem Ostalbkreis aktuell: 18 mm/h. Scheitel-Abfluss Rems in ~90 Min. erwartet.",
            zeit: "2026-06-12T08:38:00",
            plausibilitaet: 0.78,
          },
          {
            id: "p1-8",
            plattform: "BlueSky",
            autor: "@neugierig_gd",
            text: "Ist das das Heim neben dem Remspark? War da gestern noch spazieren …",
            zeit: "2026-06-12T08:53:00",
            plausibilitaet: 0.25,
          },
        ],
      },
      wetter: [
        {
          quelle: "DWD",
          text: "Amtliche UNWETTERWARNUNG vor ergiebigem Dauerregen (Warnstufe 3 von 4) für den Ostalbkreis: 50–70 l/m² in 12 Stunden. Gültig bis 12.06.2026 22:00 Uhr.",
          zeit: "2026-06-12T05:45:00",
          plausibilitaet: 0.97,
        },
        {
          quelle: "PEGELONLINE",
          text: "Wasserstand: 341 cm (+29 cm seit 07:00 Uhr). Meldestufe 3 (330 cm) überschritten. Tendenz: weiter steigend. Voraussichtlicher Scheitel gegen 09:45 Uhr.",
          zeit: "2026-06-12T08:30:00",
          plausibilitaet: 0.95,
          lat: 48.7995,
          lon: 9.7648,
        },
      ],
      amtlich: [
        {
          quelle: "Feuerwehr",
          text: "Einsatz Nr. 2026-1421 – Remstalstraße 14: Wassereintritt EG Seniorenheim Haus Remsblick. 4 Fahrzeuge vor Ort, Hochdruckpumpe im Einsatz. THW-Zug Gmünd angefordert für Krankentransport bettlägeriger Bewohner.",
          zeit: "2026-06-12T08:31:00",
          plausibilitaet: 0.97,
          lat: 48.7978,
          lon: 9.763,
        },
      ],
    },
  },
  {
    id: "ev-2",
    titel: "Baum auf Fahrbahn Kullaroo Rd",
    eventType: "Sturm",
    ort: "Mutlangen, Kullaroo Rd",
    lat: 48.8164,
    lon: 9.8221,
    wann: "2026-06-12T09:04:00",
    urgency: 3,
    confidence: 0.7,
    verifiziert: true,
    zusammenfassung:
      "Die Polizei bestätigt eine durch einen umgestürzten Baum blockierte Fahrbahn auf der Kullaroo Rd. Zwei unabhängige Augenzeugenberichte decken sich mit der amtlichen Meldung. Es gibt keinen Hinweis auf Verletzte.",
    einschaetzung: "Sturmschaden, real",
    warum: "2 unabhängige Augenzeugen · Polizei bestätigt · passt zur Sturmlage",
    urteil: {
      glaubwuerdig: [
        { label: "2 unabhängige Augenzeugen", status: "erfuellt" },
        { label: "Amtliche Bestätigung (Polizei)", status: "erfuellt" },
        { label: "Passt zur Wetterlage", status: "erfuellt" },
      ],
      wo: "Kullaroo Rd, Höhe Sportplatz",
      woHinweis: "Pendlerstrecke",
      nochAktiv: true,
      was: "Fahrbahn vollständig blockiert, keine Verletzten gemeldet",
    },
    status: "neu",
    belege: {
      social: {
        zusammenfassung:
          "Zwei Augenzeugen melden unabhängig voneinander einen umgestürzten Baum auf der Kullaroo Rd, ein dritter Beitrag liefert Sturm-Kontext ohne eigene Beobachtung vor Ort.",
        posts: [
          {
            id: "p2-1",
            plattform: "BlueSky",
            autor: "@gd_traffic",
            text: "Achtung, ein großer Baum liegt quer über der Kullaroo Rd, da kommt aktuell niemand durch.",
            zeit: "2026-06-12T09:04:00",
            plausibilitaet: 0.75,
            lat: 48.8166,
            lon: 9.8224,
          },
          {
            id: "p2-2",
            plattform: "Reddit",
            autor: "u/morgenpendler",
            text: "Musste gerade umdrehen, Baum auf der Straße auf Höhe des Sportplatzes.",
            zeit: "2026-06-12T09:08:00",
            plausibilitaet: 0.7,
            lat: 48.816,
            lon: 9.8215,
          },
          {
            id: "p2-3",
            plattform: "BlueSky",
            autor: "@sturmjaeger_bw",
            text: "Böen bis 90 km/h gemessen, da kommt heute noch mehr runter.",
            zeit: "2026-06-12T09:10:00",
            plausibilitaet: 0.5,
          },
        ],
      },
      amtlich: [
        {
          quelle: "Polizei",
          text: "Kullaroo Rd: Fahrbahn durch umgestürzten Baum vollständig blockiert, Streife vor Ort, Räumung ist angefordert.",
          zeit: "2026-06-12T09:12:00",
          plausibilitaet: 0.9,
          lat: 48.8163,
          lon: 9.8219,
        },
      ],
    },
  },
  {
    id: "ev-3",
    titel: "Angeblicher Einsturz Remsbrücke",
    eventType: "Hochwasser",
    ort: "Schwäbisch Gmünd, Remsbrücke Zollhaus",
    lat: 48.7889,
    lon: 9.7625,
    wann: "2026-06-12T09:12:00",
    urgency: 3,
    confidence: 0.25,
    zusammenfassung:
      "Eine sich schnell verbreitende Behauptung über einen Brückeneinsturz widerspricht der amtlichen Datenlage. Weder Pegel noch Brückensensorik noch amtliche Stellen stützen die Meldung, das kursierende Bild stammt aus dem Jahr 2021.",
    einschaetzung: "Verdacht auf Falschmeldung",
    warum: "widerspricht Pegeldaten · Bild aus 2021 (Rückwärtssuche) · Quelle unverifiziert",
    verdacht: {
      behauptung:
        "Die Remsbrücke am Zollhaus ist eingestürzt, den Stadtteil sofort meiden!",
      datenlage:
        "Pegel Rems unter Meldestufe an der Messstelle Zollhaus. Kein Brückenereignis gemeldet, Sensorik unauffällig.",
      gruende: [
        "Widerspricht Pegeldaten (unter Meldestufe)",
        "Bild aus 2021 (Rückwärtssuche)",
        "Quelle unverifiziert, Account 3 Tage alt",
      ],
      kernwiderspruch: "widerspricht Pegeldaten",
      shares: 3200,
      sharesDelta: 800,
      deltaMin: 10,
      plattformen: ["X", "WhatsApp", "Facebook"],
      betroffene: "~6.000 Einwohner im Umkreis",
    },
    urteil: {
      glaubwuerdig: [],
      wo: "Remsbrücke Zollhaus",
      woHinweis: "~6.000 Einwohner im Umkreis",
      was: "Falsche Warnung, Stadtteil zu meiden",
    },
    status: "neu",
    belege: {
      social: {
        zusammenfassung:
          "Ein einzelner Beitrag in Frageform verbreitet ein unbelegtes Gerücht über einen Brückeneinsturz. Keine Augenzeugen, kein Bildmaterial, keine Bestätigung durch weitere Quellen.",
        posts: [
          {
            id: "p3-1",
            plattform: "Reddit",
            autor: "u/besorgt_gd",
            text: "Hat jemand was davon gehört, dass die Remsbrücke am Zollhaus eingestürzt sein soll?? Mein Schwager meint, er hätte ein Video gesehen.",
            zeit: "2026-06-12T09:20:00",
            plausibilitaet: 0.2,
          },
        ],
      },
    },
  },
  {
    id: "ev-4",
    titel: "Kellerbrand Bahnhofstraße",
    eventType: "Brand",
    ort: "Schwäbisch Gmünd, Bahnhofsviertel",
    lat: 48.7993,
    lon: 9.7975,
    wann: "2026-06-12T09:13:00",
    urgency: 3,
    confidence: 0.6,
    zusammenfassung:
      "Vier Beiträge melden übereinstimmend Rauchentwicklung und Brandgeruch in der Bahnhofstraße, ein Foto zeigt Rauch aus einem Kellerschacht. Eine amtliche Bestätigung steht noch aus, die Feuerwehr ist nach Beobachtungen alarmiert. Mittlere Konfidenz, Lage weiter beobachten.",
    einschaetzung: "Brand, wahrscheinlich",
    warum: "4 übereinstimmende Beiträge mit Foto · amtliche Bestätigung steht aus",
    urteil: {
      glaubwuerdig: [
        { label: "4 übereinstimmende Beiträge", status: "erfuellt" },
        { label: "Foto vorhanden", status: "erfuellt" },
        { label: "Amtliche Bestätigung", status: "offen" },
      ],
      wo: "Bahnhofstraße, Höhe Nr. 23",
      woHinweis: "dichtes Wohnquartier",
      nochAktiv: true,
      was: "Rauch aus Kellerschacht, Brandgeruch bis zum Marktplatz",
      fehlt: "amtliche Einsatzbestätigung",
    },
    status: "neu",
    belege: {
      social: {
        zusammenfassung:
          "Vier Beiträge aus einem Umkreis von rund 100 Metern melden Rauch und Brandgeruch in der Bahnhofstraße, ein Beitrag enthält ein Foto. Eine anfahrende Feuerwehr wurde beobachtet, eine amtliche Einsatzmeldung liegt noch nicht vor.",
        posts: [
          {
            id: "p4-1",
            plattform: "BlueSky",
            autor: "@nachtschicht_gd",
            text: "Aus einem Kellerschacht in der Bahnhofstraße kommt Rauch, ungefähr auf Höhe der Nummer 23.",
            zeit: "2026-06-12T09:15:00",
            plausibilitaet: 0.7,
            bild: "https://picsum.photos/seed/codewehr-rauch/520/300",
            lat: 48.7995,
            lon: 9.7978,
          },
          {
            id: "p4-2",
            plattform: "BlueSky",
            autor: "@bahnhofsviertel",
            text: "Es riecht hier extrem verbrannt, irgendwo muss was brennen.",
            zeit: "2026-06-12T09:13:00",
            plausibilitaet: 0.5,
            lat: 48.799,
            lon: 9.7969,
          },
          {
            id: "p4-3",
            plattform: "Reddit",
            autor: "u/gd_central",
            text: "Feuerwehr fährt gerade mit Blaulicht in Richtung Bahnhofstraße.",
            zeit: "2026-06-12T09:18:00",
            plausibilitaet: 0.6,
            lat: 48.7997,
            lon: 9.7983,
          },
          {
            id: "p4-4",
            plattform: "BlueSky",
            autor: "@smokey_gd",
            text: "Der Brandgeruch zieht bis zum Marktplatz, das ist kein kleines Feuer.",
            zeit: "2026-06-12T09:21:00",
            plausibilitaet: 0.45,
            lat: 48.7989,
            lon: 9.7972,
          },
        ],
      },
    },
  },
];
