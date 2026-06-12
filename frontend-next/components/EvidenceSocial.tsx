"use client";

import { useState } from "react";
import { ChevronDown, ExternalLink, MessagesSquare } from "lucide-react";
import type { SocialSynthese } from "@/lib/types";
import { fmtZeit, konfidenzStufe } from "@/lib/ui";
import { Chip, EmptyEvidence } from "./ui";

export default function EvidenceSocial({ synthese }: { synthese?: SocialSynthese }) {
  const [open, setOpen] = useState(false);
  if (!synthese) {
    return <EmptyEvidence label="Social Media" text="Keine Social-Media-Signale vorhanden." />;
  }
  const n = synthese.posts.length;
  const avg = synthese.posts.reduce((s, p) => s + p.plausibilitaet, 0) / Math.max(n, 1);

  return (
    <article className="rounded-lg border border-line bg-panel p-3">
      <header className="flex flex-wrap items-center gap-2">
        <MessagesSquare className="h-4 w-4 text-mute" aria-hidden />
        <h3 className="text-xs font-bold">Social Media</h3>
        <span className="text-[11px] text-dim">
          {n} {n === 1 ? "Beitrag" : "Beiträge"}
        </span>
        <span className="ml-auto text-[11px] text-soft">
          Plausibilität {konfidenzStufe(avg)}
        </span>
      </header>
      <p className="mt-2 text-[12.5px] leading-relaxed text-ink/85">{synthese.zusammenfassung}</p>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="mt-2.5 flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
      >
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
        {open ? "Einzelposts ausblenden" : `${n} ${n === 1 ? "Einzelpost" : "Einzelposts"} anzeigen`}
      </button>
      {open && (
        <ul className="mt-2 divide-y divide-line/60 border-t border-line/60">
          {synthese.posts.map((p) => (
            <li key={p.id} className="space-y-1.5 py-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <Chip>{p.plattform}</Chip>
                <span className="text-xs font-semibold">{p.autor}</span>
                <span className="text-[11px] text-mute">{fmtZeit(p.zeit)}</span>
                <span className="ml-auto text-[11px] text-soft">
                  Plausibilität {konfidenzStufe(p.plausibilitaet)}
                </span>
              </div>
              <p className="text-[12.5px] leading-relaxed text-ink/85">{p.text}</p>
              {p.bild && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.bild}
                  alt={`Bild aus Beitrag von ${p.autor} (Platzhalter)`}
                  className="mt-1 max-h-44 w-full rounded-lg border border-line object-cover"
                  loading="lazy"
                />
              )}
              {p.url && (
                <a
                  href={p.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-accent hover:underline"
                >
                  <ExternalLink className="h-3 w-3" /> Beitrag öffnen
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
