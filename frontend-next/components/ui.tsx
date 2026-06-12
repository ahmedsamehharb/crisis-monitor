import type { ReactNode } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Check,
  Minus,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import type { Urgency } from "@/lib/types";
import {
  SEV,
  STUFE_FARBE,
  URGENCY_LABEL,
  konfidenzStufe,
  type AnzeigeStufe,
  type TrendRichtung,
} from "@/lib/ui";

export function Chip({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border border-line bg-card px-2 py-0.5 text-[11px] font-medium text-mute ${className}`}
    >
      {children}
    </span>
  );
}

export function Pill({
  active = false,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors ${
        active
          ? "border-accent/50 bg-accent/15 text-accent"
          : "border-line bg-transparent text-mute hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

const STUFE_ICON: Record<AnzeigeStufe, typeof Check> = {
  niedrig: TriangleAlert,
  mittel: Minus,
  hoch: Check,
  verifiziert: ShieldCheck,
};

/**
 * Konfidenz als Stufen-Pill, Icon + Text statt Prozentwert. "verifiziert" ist
 * ein eigener Status über dem Score: solides Badge, Label "Verifiziert" ohne
 * Konfidenz-Präfix, damit es nicht als bloßer Höchst-Score gelesen wird.
 */
export function KonfidenzPill({
  value,
  verified = false,
  prefix = "Konfidenz",
}: {
  value: number;
  verified?: boolean;
  prefix?: string;
}) {
  const stufe: AnzeigeStufe = verified ? "verifiziert" : konfidenzStufe(value);
  const c = STUFE_FARBE[stufe];
  const Icon = STUFE_ICON[stufe];
  if (stufe === "verifiziert") {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11.5px] font-semibold"
        style={{ color: "#141414", backgroundColor: c }}
      >
        <Icon className="h-3 w-3" aria-hidden strokeWidth={2.6} />
        Verifiziert
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11.5px] font-semibold"
      style={{ color: c, borderColor: `${c}66`, backgroundColor: `${c}1f` }}
    >
      <Icon className="h-3 w-3" aria-hidden strokeWidth={2.6} />
      {prefix} {stufe}
    </span>
  );
}

/** Konfidenz-Stufe als kompakter Text für Listenzeilen (vier-stufig) */
export function KonfidenzText({ value, verified = false }: { value: number; verified?: boolean }) {
  const stufe: AnzeigeStufe = verified ? "verifiziert" : konfidenzStufe(value);
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-semibold"
      style={{ color: STUFE_FARBE[stufe] }}
      aria-label={`Konfidenz ${stufe}`}
    >
      {verified && <ShieldCheck className="h-3 w-3" aria-hidden strokeWidth={2.4} />}
      {stufe}
    </span>
  );
}

/** Trend-Pfeil für On-Hold-Zeilen: Richtung als Form, Farbe nur bei steigend */
export function TrendPfeil({ richtung, danger = false }: { richtung: TrendRichtung; danger?: boolean }) {
  const Icon =
    richtung === "steigend" ? ArrowUpRight : richtung === "fallend" ? ArrowDownRight : ArrowRight;
  const color = danger ? "#E5484D" : richtung === "steigend" ? "#3FB36B" : "#9C9C9C";
  return (
    <Icon
      className="h-3.5 w-3.5 shrink-0"
      style={{ color }}
      strokeWidth={2.4}
      aria-label={`Trend ${richtung}`}
    />
  );
}

/** Urgency als Segment-Meter: Magnitude ohne Lesen erfassbar, Stufen-Label darunter */
export function UrgencyMeter({ u }: { u: Urgency }) {
  return (
    <div>
      <div
        className="flex gap-[3px]"
        role="meter"
        aria-valuemin={1}
        aria-valuemax={5}
        aria-valuenow={u}
        aria-label={`Dringlichkeit ${u} von 5`}
      >
        {([1, 2, 3, 4, 5] as Urgency[]).map((i) => (
          <div
            key={i}
            className="h-1.5 flex-1 rounded-[2px]"
            style={{ backgroundColor: i <= u ? SEV[i] : "rgba(255,255,255,0.08)" }}
          />
        ))}
      </div>
      <p className="mt-1.5 text-[11.5px] font-semibold" style={{ color: SEV[u] }}>
        Stufe {u} von 5 · {URGENCY_LABEL[u]}
      </p>
    </div>
  );
}

export function EmptyEvidence({ label, text }: { label: string; text: string }) {
  return (
    <article className="rounded-lg border border-dashed border-line p-3">
      <h3 className="text-xs font-bold text-mute">{label}</h3>
      <p className="mt-1 text-xs text-dim">{text}</p>
    </article>
  );
}
