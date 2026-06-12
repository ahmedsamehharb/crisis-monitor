"use client";

import type { ReactNode } from "react";
import { EventsProvider } from "./EventsProvider";
import { LocaleProvider } from "./LocaleProvider";
import { ThemeProvider } from "./ThemeProvider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <LocaleProvider>
        <EventsProvider>{children}</EventsProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}
