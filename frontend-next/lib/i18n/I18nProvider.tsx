"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { EventType, Urgency } from "@/lib/types";
import type { KonfidenzStufe, TrendRichtung } from "@/lib/ui";
import { de, type Messages } from "./messages/de";
import { en } from "./messages/en";
import {
  fmtAgo,
  fmtTime,
  plural,
  translateConfidence,
  translateEventType,
  translateUrgency,
} from "./messages/de";

export type Locale = "de" | "en";

const STORAGE_KEY = "codewehr-locale";

const MESSAGES: Record<Locale, Messages> = { de, en };

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  fmtTime: (iso: string) => string;
  fmtAgo: (min: number) => string;
  plural: (key: "sourceTypes" | "showPosts" | "unread", count: number) => string;
  confidenceLabel: (stufe: KonfidenzStufe | "verifiziert") => string;
  urgencyLabel: (u: Urgency) => string;
  eventTypeLabel: (type: EventType) => string;
  trendLabel: (dir: TrendRichtung) => string;
  holdHintLabel: (key: "threshold" | "surge") => string;
  numberLocale: string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function getNested(obj: Record<string, unknown>, path: string): string {
  const val = path.split(".").reduce<unknown>((o, k) => {
    if (o && typeof o === "object" && k in (o as object)) {
      return (o as Record<string, unknown>)[k];
    }
    return undefined;
  }, obj);
  return typeof val === "string" ? val : path;
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return Object.entries(params).reduce(
    (s, [k, v]) => s.replace(new RegExp(`\\{${k}\\}`, "g"), String(v)),
    template
  );
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("de");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "de" || stored === "en") setLocaleState(stored);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = MESSAGES[locale].meta.title;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const messages = MESSAGES[locale];

  const value = useMemo<I18nContextValue>(() => {
    const t = (key: string, params?: Record<string, string | number>) =>
      interpolate(getNested(messages as unknown as Record<string, unknown>, key), params);

    return {
      locale,
      setLocale,
      t,
      fmtTime: (iso: string) => fmtTime(messages, iso),
      fmtAgo: (min: number) => fmtAgo(messages, min),
      plural: (key, count) => plural(messages, key, count),
      confidenceLabel: (stufe) => translateConfidence(messages, stufe),
      urgencyLabel: (u) => translateUrgency(messages, u),
      eventTypeLabel: (type) => translateEventType(messages, type),
      trendLabel: (dir) => messages.trend[dir],
      holdHintLabel: (key) => messages.holdHint[key],
      numberLocale: locale === "de" ? "de-DE" : "en-US",
    };
  }, [locale, messages, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
