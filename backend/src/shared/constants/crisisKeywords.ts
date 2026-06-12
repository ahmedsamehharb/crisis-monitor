export const CRISIS_KEYWORDS = [
  'Feuerwehr',
  'Überschwemmung',
  'Unfall',
  'Stromausfall',
] as const;

export type CrisisKeyword = (typeof CRISIS_KEYWORDS)[number];
