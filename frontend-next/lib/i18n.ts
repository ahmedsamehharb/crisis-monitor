export type Locale = "de" | "en";

export type TranslationKey =
  | "app.name"
  | "app.subtitle"
  | "nav.dashboard"
  | "nav.activeCrises"
  | "nav.pending"
  | "nav.onHold"
  | "nav.mapView"
  | "nav.settings"
  | "nav.events"
  | "header.search"
  | "header.active"
  | "header.pending"
  | "header.operational"
  | "header.userName"
  | "header.userRole"
  | "header.language"
  | "header.theme"
  | "dashboard.breadcrumb"
  | "dashboard.title"
  | "dashboard.subtitle"
  | "dashboard.kpi.activeVerified"
  | "dashboard.kpi.pending"
  | "dashboard.kpi.onHold"
  | "dashboard.kpi.newReports"
  | "dashboard.kpi.critical"
  | "dashboard.kpi.avgTime"
  | "dashboard.trendTitle"
  | "dashboard.recentActivity"
  | "dashboard.sourcesTitle"
  | "dashboard.severityTitle"
  | "dashboard.severity.critical"
  | "dashboard.severity.high"
  | "dashboard.severity.medium"
  | "dashboard.severity.low"
  | "dashboard.severity.info"
  | "dashboard.noData"
  | "dashboard.statusChange"
  | "dashboard.newEvent"
  | "dashboard.opsCenter"
  | "dashboard.liveFeed"
  | "events.title"
  | "events.subtitle"
  | "events.allMunicipalities"
  | "events.open"
  | "events.activeCount"
  | "events.pendingCount"
  | "events.hold"
  | "events.reviewed"
  | "dataSource.loading"
  | "dataSource.backend"
  | "dataSource.mock"
  | "dataSource.hybrid"
  | "map.title"
  | "map.subtitle"
  | "map.eventsShown"
  | "map.filterCity"
  | "map.filterSeverity"
  | "map.filterType"
  | "map.filterStatus"
  | "map.allCities"
  | "map.allSeverities"
  | "map.allTypes"
  | "map.allStatuses"
  | "map.severityCritical"
  | "map.severityHigh"
  | "map.severityMedium"
  | "map.severityLow"
  | "map.verifiedOnly"
  | "map.resetFilters"
  | "map.statusNew"
  | "map.statusHold"
  | "map.statusVerified"
  | "settings.title"
  | "settings.subtitle"
  | "settings.profile"
  | "settings.profileName"
  | "settings.profileRole"
  | "settings.profileEmail"
  | "settings.language"
  | "settings.languageHint"
  | "settings.theme"
  | "settings.themeHint"
  | "settings.themeDark"
  | "settings.themeLight";

const de: Record<TranslationKey, string> = {
  "app.name": "VOST Germany",
  "app.subtitle": "CRISIS INTELLIGENCE",
  "nav.dashboard": "Dashboard",
  "nav.activeCrises": "Active Crises",
  "nav.pending": "Pending Verification",
  "nav.onHold": "On Hold",
  "nav.mapView": "Kartenansicht",
  "nav.settings": "Einstellungen",
  "nav.events": "Ereignisse",
  "header.search": "Ereignisse, Orte, Meldungen suchen …",
  "header.active": "AKTIV",
  "header.pending": "AUSSTEHEND",
  "header.operational": "ALLE SYSTEME OPERATIV",
  "header.userName": "Vir",
  "header.userRole": "SR. ANALYST",
  "header.language": "Sprache",
  "header.theme": "Darstellung",
  "dashboard.breadcrumb": "VOST",
  "dashboard.title": "Operational Overview",
  "dashboard.subtitle": "Echtzeit-Lagebild über Deutschland",
  "dashboard.kpi.activeVerified": "Aktive verifizierte Krisen",
  "dashboard.kpi.pending": "Ausstehende Prüfungen",
  "dashboard.kpi.onHold": "On-Hold-Fälle",
  "dashboard.kpi.newReports": "Neue Meldungen (24h)",
  "dashboard.kpi.critical": "Kritische Vorfälle",
  "dashboard.kpi.avgTime": "Ø Verifikationszeit",
  "dashboard.trendTitle": "VORFALLTREND — 14 TAGE",
  "dashboard.recentActivity": "LETZTE AKTIVITÄT",
  "dashboard.sourcesTitle": "MELDUNGEN NACH QUELLE",
  "dashboard.severityTitle": "SCHWEREGRAD-VERTEILUNG",
  "dashboard.severity.critical": "KRITISCH",
  "dashboard.severity.high": "HOCH",
  "dashboard.severity.medium": "MITTEL",
  "dashboard.severity.low": "NIEDRIG",
  "dashboard.severity.info": "INFO",
  "dashboard.noData": "Keine Daten verfügbar",
  "dashboard.statusChange": "STATUSÄNDERUNG",
  "dashboard.newEvent": "NEUES EREIGNIS",
  "dashboard.opsCenter": "OPS CENTER",
  "dashboard.liveFeed": "LIVE FEED",
  "events.title": "Verifikations-Cockpit",
  "events.subtitle": "Ereignisse sichten, belegen und entscheiden",
  "events.allMunicipalities": "Alle Gemeinden",
  "events.open": "offen",
  "events.activeCount": "aktiv",
  "events.pendingCount": "ausstehend",
  "events.hold": "on hold",
  "events.reviewed": "bewertet",
  "dataSource.loading": "Datenquelle wird geladen …",
  "dataSource.backend": "Live Backend",
  "dataSource.mock": "Mock-Daten",
  "dataSource.hybrid": "Live + Demo-Daten",
  "map.title": "Kartenansicht",
  "map.subtitle": "Krisenereignisse filtern und auf der Karte erkunden",
  "map.eventsShown": "Ereignisse auf der Karte",
  "map.filterCity": "STADT",
  "map.filterSeverity": "SCHWEREGRAD",
  "map.filterType": "EREIGNISTYP",
  "map.filterStatus": "STATUS",
  "map.allCities": "Alle Städte",
  "map.allSeverities": "Alle Schweregrade",
  "map.allTypes": "Alle Typen",
  "map.allStatuses": "Alle Status",
  "map.severityCritical": "Kritisch (CRITICAL)",
  "map.severityHigh": "Hoch (HIGH)",
  "map.severityMedium": "Mittel (MEDIUM)",
  "map.severityLow": "Niedrig (LOW)",
  "map.verifiedOnly": "Nur verifizierte Ereignisse",
  "map.resetFilters": "Filter zurücksetzen",
  "map.statusNew": "Neu / Aktiv",
  "map.statusHold": "On Hold",
  "map.statusVerified": "Verifiziert",
  "settings.title": "Einstellungen",
  "settings.subtitle": "Profil und Darstellung",
  "settings.profile": "PROFIL",
  "settings.profileName": "Vir",
  "settings.profileRole": "SR. ANALYST",
  "settings.profileEmail": "vir@vost-germany.de",
  "settings.language": "Sprache",
  "settings.languageHint": "Oberflächensprache der Anwendung",
  "settings.theme": "Darstellung",
  "settings.themeHint": "Helles oder dunkles Farbschema",
  "settings.themeDark": "Dunkel",
  "settings.themeLight": "Hell",
};

const en: Record<TranslationKey, string> = {
  "app.name": "VOST Germany",
  "app.subtitle": "CRISIS INTELLIGENCE",
  "nav.dashboard": "Dashboard",
  "nav.activeCrises": "Active Crises",
  "nav.pending": "Pending Verification",
  "nav.onHold": "On Hold",
  "nav.mapView": "Map View",
  "nav.settings": "Settings",
  "nav.events": "Events",
  "header.search": "Search events, locations, reports...",
  "header.active": "ACTIVE",
  "header.pending": "PENDING",
  "header.operational": "ALL SYSTEMS OPERATIONAL",
  "header.userName": "Vir",
  "header.userRole": "SR. ANALYST",
  "header.language": "Language",
  "header.theme": "Appearance",
  "dashboard.breadcrumb": "VOST",
  "dashboard.title": "Operational Overview",
  "dashboard.subtitle": "Real-time situational awareness across Germany",
  "dashboard.kpi.activeVerified": "Active Verified Crises",
  "dashboard.kpi.pending": "Pending Investigations",
  "dashboard.kpi.onHold": "On-Hold Cases",
  "dashboard.kpi.newReports": "New Incoming Reports (24h)",
  "dashboard.kpi.critical": "Critical Incidents",
  "dashboard.kpi.avgTime": "Avg Verification Time",
  "dashboard.trendTitle": "INCIDENT TRENDS — 14 DAYS",
  "dashboard.recentActivity": "RECENT ACTIVITY",
  "dashboard.sourcesTitle": "REPORTS BY SOURCE",
  "dashboard.severityTitle": "SEVERITY DISTRIBUTION",
  "dashboard.severity.critical": "CRITICAL",
  "dashboard.severity.high": "HIGH",
  "dashboard.severity.medium": "MEDIUM",
  "dashboard.severity.low": "LOW",
  "dashboard.severity.info": "INFO",
  "dashboard.noData": "No data available",
  "dashboard.statusChange": "STATUS CHANGE",
  "dashboard.newEvent": "NEW EVENT",
  "dashboard.opsCenter": "OPS CENTER",
  "dashboard.liveFeed": "LIVE FEED",
  "events.title": "Verification Cockpit",
  "events.subtitle": "Review events, verify evidence, and decide",
  "events.allMunicipalities": "All municipalities",
  "events.open": "open",
  "events.activeCount": "active",
  "events.pendingCount": "pending",
  "events.hold": "on hold",
  "events.reviewed": "reviewed",
  "dataSource.loading": "Loading data source …",
  "dataSource.backend": "Live backend",
  "dataSource.mock": "Mock data",
  "dataSource.hybrid": "Live + demo data",
  "map.title": "Map View",
  "map.subtitle": "Filter crisis events and explore them on the map",
  "map.eventsShown": "events on map",
  "map.filterCity": "CITY",
  "map.filterSeverity": "SEVERITY",
  "map.filterType": "EVENT TYPE",
  "map.filterStatus": "STATUS",
  "map.allCities": "All cities",
  "map.allSeverities": "All severities",
  "map.allTypes": "All types",
  "map.allStatuses": "All statuses",
  "map.severityCritical": "Critical (CRITICAL)",
  "map.severityHigh": "High (HIGH)",
  "map.severityMedium": "Medium (MEDIUM)",
  "map.severityLow": "Low (LOW)",
  "map.verifiedOnly": "Verified events only",
  "map.resetFilters": "Reset filters",
  "map.statusNew": "New / Active",
  "map.statusHold": "On Hold",
  "map.statusVerified": "Verified",
  "settings.title": "Settings",
  "settings.subtitle": "Profile and appearance",
  "settings.profile": "PROFILE",
  "settings.profileName": "Vir",
  "settings.profileRole": "SR. ANALYST",
  "settings.profileEmail": "vir@vost-germany.de",
  "settings.language": "Language",
  "settings.languageHint": "Application display language",
  "settings.theme": "Appearance",
  "settings.themeHint": "Light or dark color scheme",
  "settings.themeDark": "Dark",
  "settings.themeLight": "Light",
};

const dictionaries: Record<Locale, Record<TranslationKey, string>> = { de, en };

export function translate(locale: Locale, key: TranslationKey): string {
  return dictionaries[locale][key] ?? key;
}

/** Chart display labels for source bar chart */
export const SOURCE_CHART_LABELS: Record<string, string> = {
  dwd: "DWD",
  bluesky: "X",
  mastodon: "Public",
  reddit: "Public",
  news: "News",
  police: "Gov",
  pegelonline: "Monitor",
  hvz: "Monitor",
  firms: "Monitor",
  feuerwehr: "Gov",
  landratsamt: "Gov",
  mobidata: "Gov",
  other: "Monitor",
};

export function sourceChartLabel(key: string): string {
  return SOURCE_CHART_LABELS[key.toLowerCase()] ?? key;
}
