"use client";

import { useState } from "react";
import { Plus, X, type LucideIcon } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface Props {
  label: string;
  icon: LucideIcon;
  values: string[];
  options: Option[];
  onChange: (values: string[]) => void;
}

/** Mehrfachauswahl im Stil der Topbar-Dropdowns: Optionen einzeln hinzufügen und per × wieder entfernen. Leere Auswahl bedeutet "Alle". */
export default function MultiSelectFilter({ label, icon: Icon, values, options, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const available = options.filter((o) => !values.includes(o.value));

  const add = (v: string) => {
    onChange([...values, v]);
    setOpen(false);
  };

  const remove = (v: string) => onChange(values.filter((x) => x !== v));

  return (
    <div>
      <div className="relative">
        <button
          type="button"
          onClick={() => available.length > 0 && setOpen((o) => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={label}
          disabled={available.length === 0}
          className={`flex h-9 w-full items-center gap-2 rounded-md border bg-bg px-3 text-sm font-medium ${
            values.length > 0 ? "border-accent/50 text-accent" : "border-line text-ink"
          } ${available.length === 0 ? "cursor-default opacity-50" : ""}`}
        >
          <Icon className="h-4 w-4 text-mute" aria-hidden />
          <span className="flex-1 text-left">
            {values.length === 0 ? "Alle" : `${values.length} ausgewählt`}
          </span>
          <Plus className="h-4 w-4 text-mute" aria-hidden />
        </button>
        {open && (
          <>
            <button
              type="button"
              aria-label="Auswahl schließen"
              className="fixed inset-0 z-40 cursor-default"
              onClick={() => setOpen(false)}
              tabIndex={-1}
            />
            <ul
              role="listbox"
              aria-label={label}
              className="absolute left-0 top-11 z-50 max-h-72 w-full overflow-y-auto rounded-lg border border-line bg-card p-1 shadow-xl shadow-black/40"
            >
              {available.map((o) => (
                <li key={o.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={false}
                    onClick={() => add(o.value)}
                    className="w-full rounded-md px-2.5 py-1.5 text-left text-sm text-ink hover:bg-white/[0.06]"
                  >
                    {o.label}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {values.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {values.map((v) => {
            const opt = options.find((o) => o.value === v);
            return (
              <li
                key={v}
                className="flex items-center gap-1.5 rounded-full border border-accent/50 bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent"
              >
                {opt?.label ?? v}
                <button
                  type="button"
                  aria-label={`${opt?.label ?? v} entfernen`}
                  onClick={() => remove(v)}
                  className="text-accent/70 hover:text-accent"
                >
                  <X className="h-3 w-3" aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
