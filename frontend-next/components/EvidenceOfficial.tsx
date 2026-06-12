import { Landmark } from "lucide-react";
import type { AmtlichesSignal } from "@/lib/types";
import { fmtZeit, konfidenzStufe } from "@/lib/ui";
import { Chip, EmptyEvidence } from "./ui";

export default function EvidenceOfficial({ signale }: { signale?: AmtlichesSignal[] }) {
  if (!signale || signale.length === 0) {
    return (
      <EmptyEvidence
        label="Amtliche Quellen"
        text="Keine amtliche Bestätigung · Lage offen."
      />
    );
  }
  return (
    <article className="rounded-lg border border-line bg-panel p-3">
      <header className="flex items-center gap-2">
        <Landmark className="h-4 w-4 text-mute" aria-hidden />
        <h3 className="text-xs font-bold">Amtliche Quellen</h3>
        <span className="text-[11px] text-dim">
          {signale.length} {signale.length === 1 ? "Signal" : "Signale"}
        </span>
      </header>
      <ul className="mt-1 divide-y divide-line/60">
        {signale.map((s, i) => (
          <li key={i} className="space-y-1 py-2.5">
            <div className="flex items-center gap-2">
              <Chip className="text-ink">{s.quelle}</Chip>
              <span className="text-[11px] text-mute">{fmtZeit(s.zeit)}</span>
              <span className="ml-auto text-[11px] text-soft">
                Plausibilität {konfidenzStufe(s.plausibilitaet)}
              </span>
            </div>
            <p className="text-[12.5px] leading-relaxed text-ink/85">{s.text}</p>
          </li>
        ))}
      </ul>
    </article>
  );
}
