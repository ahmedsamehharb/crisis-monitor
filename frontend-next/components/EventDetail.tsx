"use client";

import { useState, type ReactNode } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  ExternalLink,
  Eye,
  Info,
  Megaphone,
  RotateCcw,
  ShieldCheck,
  TriangleAlert,
  X,
} from "lucide-react";
import type { Event as CwEvent, EventStatus } from "@/lib/types";
import {
  SEV,
  TYPE_ICON,
  fmtVor,
  konfidenzStufe,
  minutenSeit,
  quellenStat,
} from "@/lib/ui";
import EvidenceOfficial from "./EvidenceOfficial";
import EvidenceSocial from "./EvidenceSocial";
import EvidenceWeather from "./EvidenceWeather";
import { KonfidenzPill, UrgencyMeter } from "./ui";

const SUCCESS = "#3FB36B";
const WARNING = "#E7B53C";
const DANGER = "#E5484D";

interface Props {
  event?: CwEvent;
  isArchived: boolean;
  nowIso: string;
  onDecide: (id: string, status: EventStatus, notiz: string) => void;
  onReopen: (id: string) => void;
  onClose: () => void;
}

/** Kleines Uppercase-Label über einem Wert (Wo/Wann/Was-Raster) */
function Feld({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-0.5 text-[9.5px] font-semibold uppercase tracking-wider text-dim">
        {label}
      </div>
      <div className="text-xs leading-snug text-ink">{children}</div>
    </div>
  );
}

/** Zonen-Trenner: gliedert die Ansicht von Überblick über Beurteilung zu Belegen */
function ZoneLabel({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 pt-1">
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-dim">
        {children}
      </span>
      <span className="h-px flex-1 bg-line" aria-hidden />
    </div>
  );
}

function AchsenBox({ titel, icon, children }: { titel: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-line bg-panel p-3.5">
      <div className="mb-2.5 flex items-center gap-2 text-[12.5px] font-bold text-ink">
        {icon}
        {titel}
      </div>
      {children}
    </div>
  );
}

/** Drei gleichwertige Aktionen: gleiche Größe und Bauart, Unterscheidung nur über Farbe + Icon */
function AktionButton({
  tone,
  onClick,
  icon,
  children,
}: {
  tone: "success" | "neutral" | "danger";
  onClick: () => void;
  icon: ReactNode;
  children: ReactNode;
}) {
  const c = tone === "success" ? SUCCESS : tone === "danger" ? DANGER : null;
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2 py-2.5 text-xs font-semibold transition-colors hover:brightness-125"
      style={
        c
          ? { color: c, borderColor: `${c}80`, backgroundColor: `${c}14` }
          : { color: "#CACACA", borderColor: "#383838", backgroundColor: "#1F1F1F" }
      }
    >
      {icon}
      {children}
    </button>
  );
}

function DecisionBar({
  event,
  isArchived,
  onDecide,
  onReopen,
}: {
  event: CwEvent;
  isArchived: boolean;
  onDecide: Props["onDecide"];
  onReopen: Props["onReopen"];
}) {
  const [notiz, setNotiz] = useState("");

  if (isArchived) {
    const positiv = event.status === "bestaetigt";
    const ergebnis = event.verdacht
      ? positiv
        ? "Richtigstellung angestoßen"
        : "Entwarnt, kein Fake"
      : positiv
        ? "An Stab weitergegeben"
        : "Verworfen";
    const c = positiv === !event.verdacht ? SUCCESS : positiv ? DANGER : "#9C9C9C";
    return (
      <div className="space-y-3 border-t border-line bg-panel p-4">
        <div
          className="flex items-center gap-3 rounded-lg border px-3.5 py-3"
          style={{ borderColor: `${c}66`, backgroundColor: `${c}14` }}
        >
          {positiv ? (
            <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: c }} aria-hidden />
          ) : (
            <X className="h-5 w-5 shrink-0" style={{ color: c }} aria-hidden />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink">{ergebnis}</p>
            <p className="text-[11.5px] text-mute">
              {event.bewertetUm ? `${event.bewertetUm} Uhr · ` : ""}S. Lindner (S2) · protokolliert
            </p>
          </div>
          <KonfidenzPill value={event.confidence} verified={event.verifiziert} />
        </div>
        {event.notiz && (
          <div className="rounded-lg border border-line px-3.5 py-2.5">
            <div className="mb-1 text-[9.5px] font-semibold uppercase tracking-wider text-dim">
              Notiz
            </div>
            <p className="text-xs leading-relaxed text-ink">{event.notiz}</p>
          </div>
        )}
        <button
          type="button"
          onClick={() => onReopen(event.id)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-accent/50 bg-accent/10 py-2.5 text-xs font-semibold text-accent transition-colors hover:bg-accent/20"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Erneut bewerten
        </button>
      </div>
    );
  }

  const fake = !!event.verdacht;
  const holdLabel = event.status === "hold" ? "Weiter beobachten" : "On hold";

  return (
    <div className="space-y-3 border-t border-line bg-panel p-4">
      {!fake && event.urteil?.fehlt && (
        <div className="flex items-start gap-2.5 rounded-lg border border-accent/30 bg-accent/[0.07] px-3 py-2.5">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />
          <p className="text-xs leading-relaxed text-soft">
            <span className="font-semibold text-ink">
              Für eine Eskalation fehlt noch: {event.urteil.fehlt}.
            </span>{" "}
            On hold holt den Fall automatisch zurück, sobald Neues eintrifft.
          </p>
        </div>
      )}
      <div className="flex gap-2">
        {fake ? (
          <>
            <AktionButton
              tone="danger"
              onClick={() => onDecide(event.id, "bestaetigt", notiz)}
              icon={<Megaphone className="h-3.5 w-3.5" aria-hidden />}
            >
              Richtigstellung anstoßen
            </AktionButton>
            <AktionButton
              tone="neutral"
              onClick={() => onDecide(event.id, "hold", notiz)}
              icon={<Eye className="h-3.5 w-3.5" aria-hidden />}
            >
              Weiter beobachten
            </AktionButton>
            <AktionButton
              tone="success"
              onClick={() => onDecide(event.id, "abgelehnt", notiz)}
              icon={<Check className="h-3.5 w-3.5" aria-hidden />}
            >
              Kein Fake · entwarnen
            </AktionButton>
          </>
        ) : (
          <>
            <AktionButton
              tone="success"
              onClick={() => onDecide(event.id, "bestaetigt", notiz)}
              icon={<ArrowRight className="h-3.5 w-3.5" aria-hidden />}
            >
              An Stab weitergeben
            </AktionButton>
            <AktionButton
              tone="neutral"
              onClick={() => onDecide(event.id, "hold", notiz)}
              icon={<Eye className="h-3.5 w-3.5" aria-hidden />}
            >
              {holdLabel}
            </AktionButton>
            <AktionButton
              tone="danger"
              onClick={() => onDecide(event.id, "abgelehnt", notiz)}
              icon={<X className="h-3.5 w-3.5" aria-hidden />}
            >
              Verwerfen
            </AktionButton>
          </>
        )}
      </div>
      <textarea
        value={notiz}
        onChange={(e) => setNotiz(e.target.value)}
        rows={2}
        placeholder="Notiz zur Entscheidung (wird protokolliert) ..."
        aria-label="Notiz zur Entscheidung"
        className="w-full resize-none rounded-lg border border-line bg-card px-3 py-2 text-xs text-ink placeholder:text-dim focus:border-accent/60 focus:outline-none"
      />
      <p className="flex items-center gap-1.5 text-[10.5px] text-dim">
        <ShieldCheck className="h-3 w-3 shrink-0" aria-hidden />
        Die KI belegt. Die Entscheidung trifft der Mensch und wird protokolliert.
      </p>
    </div>
  );
}

export default function EventDetail({
  event,
  isArchived,
  nowIso,
  onDecide,
  onReopen,
  onClose,
}: Props) {
  const [belegeOpen, setBelegeOpen] = useState(false);

  if (!event) {
    return (
      <section className="flex h-full items-center justify-center border-r border-line bg-bg p-6 text-center text-sm text-mute">
        Kein Fall geöffnet. Wähle eine Meldung aus der Liste.
      </section>
    );
  }

  const fake = !!event.verdacht;
  const Icon = fake ? TriangleAlert : TYPE_ICON[event.eventType];
  const sev = SEV[event.urgency];
  const stat = quellenStat(event);
  const erstPost = event.belege.social?.posts[0];
  const vorMin = fmtVor(minutenSeit(nowIso, event.wann));
  const trendVorher = event.hold ? konfidenzStufe(event.hold.konfidenzVorher) : null;
  const trendJetzt = konfidenzStufe(event.confidence);

  return (
    <section
      aria-label="Entscheidungsansicht"
      className="flex h-full min-h-0 flex-col overflow-hidden border-r border-line bg-bg"
    >
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-5">
        {/* Delta-Banner: nur On-Hold-Fälle mit Neuigkeiten */}
        {event.status === "hold" && event.hold?.neuSeitZuletzt && (
          <div className="flex items-start gap-2.5 rounded-lg border border-accent/30 bg-accent/[0.08] px-3 py-2.5">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />
            <p className="text-xs leading-relaxed">
              <span className="font-semibold text-ink">Neu seit zuletzt: </span>
              <span className="text-mute">{event.hold.neuSeitZuletzt.join(" · ")}</span>
            </p>
          </div>
        )}

        {/* Zone 1 · Überblick: worum geht es */}
        <div className="flex items-start gap-3">
          <span
            className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border"
            style={
              fake
                ? { borderColor: `${DANGER}66`, backgroundColor: `${DANGER}1a` }
                : { borderColor: "#383838", backgroundColor: "#1F1F1F" }
            }
            aria-hidden
          >
            <Icon className="h-5 w-5" style={{ color: fake ? DANGER : sev }} strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            {fake && (
              <p
                className="mb-0.5 text-[10.5px] font-bold uppercase tracking-wider"
                style={{ color: DANGER }}
              >
                Verdacht auf Falschmeldung
              </p>
            )}
            <div className="flex items-start gap-2">
              <h1 className="min-w-0 flex-1 text-[19px] font-bold leading-tight tracking-tight">
                {event.titel}
              </h1>
              <button
                type="button"
                onClick={onClose}
                aria-label="Detail schließen"
                className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-line text-mute hover:text-ink xl:hidden"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-mute">
              <span>{fake ? "Desinformation" : event.eventType}</span>
              <span className="text-line">·</span>
              <span>{event.ort}</span>
              <span className="text-line">·</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" aria-hidden /> {vorMin}
              </span>
              <span className="text-line">·</span>
              <span>
                wird geprüft von: <span className="font-medium text-ink">du</span>
              </span>
            </p>
          </div>
        </div>

        {/* KI-Einschätzung: Aussage + Konfidenz-Stufe + Warum, keine Prozentwerte */}
        <div className="rounded-lg border border-line bg-panel p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-dim">
                KI-Einschätzung
              </span>
              <span className="text-sm font-semibold text-ink">
                {event.einschaetzung ?? event.eventType}
              </span>
            </div>
            {fake ? (
              // Bei Verdachtsfällen zählt die Stärke des Verdachts, nicht die Echtheits-Konfidenz
              <span
                className="inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11.5px] font-semibold"
                style={{ color: DANGER, borderColor: `${DANGER}66`, backgroundColor: `${DANGER}1f` }}
              >
                <TriangleAlert className="h-3 w-3" aria-hidden strokeWidth={2.6} />
                Verdacht {konfidenzStufe(1 - event.confidence)}
              </span>
            ) : (
              <KonfidenzPill value={event.confidence} verified={event.verifiziert} />
            )}
          </div>
          {event.hold && trendVorher !== trendJetzt && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-mute">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-dim">
                Trend
              </span>
              {trendVorher}
              <ArrowRight className="h-3 w-3" aria-hidden />
              <span className="font-semibold" style={{ color: SUCCESS }}>
                {trendJetzt}
              </span>
              <span className="text-dim">in {event.hold.seitMin} Min</span>
            </p>
          )}
          {event.warum && (
            <p className="mt-2 flex gap-2 text-xs leading-relaxed text-mute">
              <span className="shrink-0 text-dim">Warum:</span>
              <span>{event.warum}</span>
            </p>
          )}
        </div>

        <ZoneLabel>Beurteilung</ZoneLabel>

        {/* Fake: Behauptung gegen Datenlage, direkt unter der Einschätzung */}
        {fake && event.verdacht && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div
              className="rounded-lg border p-3"
              style={{ borderColor: `${DANGER}52`, backgroundColor: `${DANGER}12` }}
            >
              <p
                className="mb-1.5 text-[9.5px] font-semibold uppercase tracking-wider"
                style={{ color: DANGER }}
              >
                Behauptung im Umlauf
              </p>
              <p className="text-[12.5px] italic leading-relaxed text-ink">
                „{event.verdacht.behauptung}"
              </p>
            </div>
            <div
              className="rounded-lg border p-3"
              style={{ borderColor: `${SUCCESS}52`, backgroundColor: `${SUCCESS}12` }}
            >
              <p
                className="mb-1.5 text-[9.5px] font-semibold uppercase tracking-wider"
                style={{ color: SUCCESS }}
              >
                Offizielle Datenlage
              </p>
              <p className="text-[12.5px] leading-relaxed text-ink">{event.verdacht.datenlage}</p>
            </div>
          </div>
        )}

        {/* Zone 2 · Zwei getrennte Urteilsachsen */}
        <div className="grid gap-3 sm:grid-cols-2">
          <AchsenBox
            titel={
              fake
                ? "Was spricht dagegen?"
                : event.status === "hold"
                  ? "Fehlt noch zur Eskalation"
                  : "Glaubwürdig?"
            }
            icon={
              fake ? (
                <X className="h-3.5 w-3.5" style={{ color: DANGER }} aria-hidden />
              ) : (
                <ShieldCheck className="h-3.5 w-3.5 text-mute" aria-hidden />
              )
            }
          >
            <ul className="space-y-2">
              {fake && event.verdacht
                ? event.verdacht.gruende.map((g) => (
                    <li key={g} className="flex items-start gap-2 text-xs leading-snug text-ink">
                      <X
                        className="mt-0.5 h-3.5 w-3.5 shrink-0"
                        style={{ color: DANGER }}
                        aria-label="Verdachtsgrund"
                        strokeWidth={2.4}
                      />
                      {g}
                    </li>
                  ))
                : (event.urteil?.glaubwuerdig ?? []).map((p) => (
                    <li key={p.label} className="flex items-start gap-2 text-xs leading-snug">
                      {p.status === "erfuellt" ? (
                        <Check
                          className="mt-0.5 h-3.5 w-3.5 shrink-0"
                          style={{ color: SUCCESS }}
                          aria-label="Erfüllt"
                          strokeWidth={2.4}
                        />
                      ) : (
                        <Clock
                          className="mt-0.5 h-3.5 w-3.5 shrink-0"
                          style={{ color: WARNING }}
                          aria-label="Offen"
                          strokeWidth={2.2}
                        />
                      )}
                      <span className={p.status === "erfuellt" ? "text-ink" : "text-mute"}>
                        {p.label}
                        {p.status === "offen" && <span style={{ color: WARNING }}> · offen</span>}
                      </span>
                    </li>
                  ))}
              {!fake && (event.urteil?.glaubwuerdig ?? []).length === 0 && (
                <li className="text-xs text-dim">Keine Prüfpunkte vorhanden.</li>
              )}
            </ul>
          </AchsenBox>

          <AchsenBox
            titel="Dringend?"
            icon={<TriangleAlert className="h-3.5 w-3.5 text-mute" aria-hidden />}
          >
            <div className="mb-3">
              <UrgencyMeter u={event.urgency} />
            </div>
            <div className="space-y-2.5">
              <Feld label="Wo">
                {event.urteil?.wo ?? event.ort}
                {event.urteil?.woHinweis && (
                  <span style={{ color: SEV[4] }}> · {event.urteil.woHinweis}</span>
                )}
              </Feld>
              <Feld label="Wann">
                {fake ? `seit ${minutenSeit(nowIso, event.wann)} Min im Umlauf` : vorMin}
                {!fake && event.urteil?.nochAktiv != null && (
                  <span style={{ color: event.urteil.nochAktiv ? SUCCESS : "#9C9C9C" }}>
                    {" "}
                    · {event.urteil.nochAktiv ? "noch aktiv" : "keine neuen Signale"}
                  </span>
                )}
              </Feld>
              <Feld label="Was">{event.urteil?.was ?? event.zusammenfassung}</Feld>
            </div>
          </AchsenBox>
        </div>

        {/* Fake: Verbreitung */}
        {fake && event.verdacht && (
          <div className="rounded-lg border border-line p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-dim">
                Verbreitung
              </span>
              <span className="flex items-baseline gap-2">
                <span className="text-base font-bold text-ink">
                  {event.verdacht.shares.toLocaleString("de-DE")}
                </span>
                <span className="text-[11.5px] text-mute">Shares</span>
                <span className="text-xs font-semibold" style={{ color: DANGER }}>
                  +{event.verdacht.sharesDelta.toLocaleString("de-DE")} in {event.verdacht.deltaMin}{" "}
                  Min
                </span>
              </span>
            </div>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {event.verdacht.plattformen.map((p) => (
                <span
                  key={p}
                  className="rounded-md border border-line bg-card px-2 py-0.5 text-[11px] text-soft"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* On Hold: Quellen nach Typ */}
        {event.status === "hold" && (
          <div className="rounded-lg border border-line p-3.5">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-dim">
              Quellen nach Typ
            </p>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  ["Social", stat.social],
                  ["Wetter und Pegel", stat.wetter],
                  ["Amtlich", stat.amtlich],
                ] as const
              ).map(([label, n]) =>
                n > 0 ? (
                  <span
                    key={label}
                    className="rounded-md border border-line bg-card px-2 py-1 text-[11.5px] text-ink"
                  >
                    {label} <span className="text-mute">{n}</span>
                  </span>
                ) : (
                  <span
                    key={label}
                    className="rounded-md border border-dashed border-line px-2 py-1 text-[11.5px] text-dim"
                  >
                    {label} 0
                  </span>
                )
              )}
            </div>
          </div>
        )}

        <ZoneLabel>Belege</ZoneLabel>

        {/* Originalbeleg: Wortlaut + Quelle */}
        {erstPost && (
          <div className="rounded-lg border border-line p-3.5">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-dim">
                Originalbeleg
              </span>
              {erstPost.url && (
                <a
                  href={erstPost.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-accent hover:underline"
                >
                  Zur Quelle <ExternalLink className="h-3 w-3" aria-hidden />
                </a>
              )}
            </div>
            <p className="text-[12.5px] italic leading-relaxed text-ink">
              „{erstPost.text}" <span className="not-italic text-dim">({erstPost.autor})</span>
            </p>
          </div>
        )}

        {/* Belege im Detail: das Spezifischste, ganz unten und aufklappbar */}
        <div className="overflow-hidden rounded-lg border border-line">
          <button
            type="button"
            onClick={() => setBelegeOpen((o) => !o)}
            aria-expanded={belegeOpen}
            className="flex w-full items-center justify-between px-3.5 py-3 text-left"
          >
            <span className="text-xs font-semibold text-ink">
              Belege im Detail{" "}
              <span className="font-normal text-dim">
                · {stat.gesamt} {stat.gesamt === 1 ? "Signal" : "Signale"}
              </span>
            </span>
            <ChevronDown
              className={`h-3.5 w-3.5 text-mute transition-transform ${belegeOpen ? "rotate-180" : ""}`}
              aria-hidden
            />
          </button>
          {belegeOpen && (
            <div className="space-y-2.5 px-3.5 pb-3.5">
              <p className="text-xs leading-relaxed text-mute">{event.zusammenfassung}</p>
              <EvidenceSocial synthese={event.belege.social} />
              <EvidenceWeather signale={event.belege.wetter} />
              <EvidenceOfficial signale={event.belege.amtlich} />
            </div>
          )}
        </div>
      </div>
      <DecisionBar event={event} isArchived={isArchived} onDecide={onDecide} onReopen={onReopen} />
    </section>
  );
}
