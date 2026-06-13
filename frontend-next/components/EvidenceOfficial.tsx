"use client";

import { Landmark } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { AmtlichesSignal } from "@/lib/types";
import { konfidenzStufe } from "@/lib/ui";
import { Chip, EmptyEvidence } from "./ui";

export default function EvidenceOfficial({ signale }: { signale?: AmtlichesSignal[] }) {
  const { t, fmtTime, confidenceLabel } = useI18n();
  if (!signale || signale.length === 0) {
    return (
      <EmptyEvidence label={t("evidence.officialTitle")} text={t("evidence.officialEmpty")} />
    );
  }
  return (
    <article className="rounded-lg border border-line bg-panel p-3">
      <header className="flex items-center gap-2">
        <Landmark className="h-4 w-4 text-mute" aria-hidden />
        <h3 className="text-xs font-bold">{t("evidence.officialTitle")}</h3>
        <span className="text-[11px] text-dim">
          {signale.length}{" "}
          {signale.length === 1 ? t("evidence.signal") : t("evidence.signals")}
        </span>
      </header>
      <ul className="mt-1 divide-y divide-line/60">
        {signale.map((s, i) => (
          <li key={i} className="space-y-1 py-2.5">
            <div className="flex items-center gap-2">
              <Chip className="text-ink">{s.quelle}</Chip>
              <span className="text-[11px] text-mute">{fmtTime(s.zeit)}</span>
              <span className="ml-auto text-[11px] text-soft">
                {t("evidence.plausibility")} {confidenceLabel(konfidenzStufe(s.plausibilitaet))}
              </span>
            </div>
            <p className="text-[12.5px] leading-relaxed text-ink/85">{s.text}</p>
          </li>
        ))}
      </ul>
    </article>
  );
}
