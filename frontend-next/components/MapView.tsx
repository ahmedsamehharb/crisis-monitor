"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Minus, Plus } from "lucide-react";
import type { Event as CwEvent, EventType } from "@/lib/types";
import { SEV, URGENCY_LABEL, konfidenzStufe, signalPoints } from "@/lib/ui";
import { Chip } from "./ui";

const VERDACHT_ICON =
  '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>';

const MAP_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

/** Lucide-Pfade als rohe SVG-Strings, da Marker imperatives DOM sind */
const ICON_SVG: Record<EventType, string> = {
  Hochwasser:
    '<path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>',
  Starkregen:
    '<path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M16 14v6"/><path d="M8 14v6"/><path d="M12 16v6"/>',
  Brand:
    '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  Verkehrsunfall:
    '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',
  Infrastrukturausfall:
    '<path d="M6.3 20.3a2.4 2.4 0 0 0 3.4 0L12 18l-6-6-2.3 2.3a2.4 2.4 0 0 0 0 3.4Z"/><path d="m2 22 3-3"/><path d="M7.5 13.5 10 11"/><path d="M10.5 16.5 13 14"/><path d="m18 3-4 4h6l-4 4"/>',
  Sturm:
    '<path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/><path d="M9.6 4.6A2 2 0 1 1 11 8H2"/><path d="M12.6 19.4A2 2 0 1 0 14 16H2"/>',
  Sonstiges:
    '<circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>',
};

type MarkerEntry = {
  id: string;
  marker: maplibregl.Marker;
  el: HTMLElement;
  root?: HTMLElement;
  isEvent: boolean;
};

interface Props {
  events: CwEvent[];
  active?: CwEvent;
  hoveredId: string | null;
  mode: "event" | "alle";
  onMode: (m: "event" | "alle") => void;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  onOpenDetail: () => void;
}

export default function MapView({
  events,
  active,
  hoveredId,
  mode,
  onMode,
  onSelect,
  onHover,
  onOpenDetail,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<MarkerEntry[]>([]);
  const [mapInst, setMapInst] = useState<maplibregl.Map | null>(null);
  const [popoverId, setPopoverId] = useState<string | null>(null);
  const [popPos, setPopPos] = useState<{ x: number; y: number } | null>(null);

  const cbRef = useRef({ onSelect, onHover });
  cbRef.current = { onSelect, onHover };

  useEffect(() => {
    if (!containerRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [9.797, 48.801],
      zoom: 12.2,
    });
    map.on("click", () => setPopoverId(null));
    // Containergröße kann sich nach dem Init ändern (Grid-Layout, Overlay, Resize)
    const ro = new ResizeObserver(() => map.resize());
    ro.observe(containerRef.current);
    setMapInst(map);
    return () => {
      ro.disconnect();
      map.remove();
      setMapInst(null);
    };
  }, []);

  // Marker auf- und abbauen, abhängig von Modus, Events und aktivem Event
  useEffect(() => {
    if (!mapInst) return;
    markersRef.current.forEach((m) => m.marker.remove());
    markersRef.current = [];

    if (mode === "event" && active) {
      signalPoints(active).forEach((p, i) => {
        // Wrapper-Root: MapLibre setzt transform auf das Marker-Element,
        // die Punktform (z. B. Raute) braucht ihr eigenes transform
        const root = document.createElement("div");
        const el = document.createElement("div");
        el.className = `cw-dot cw-dot-${p.kind}`;
        el.title = p.label;
        root.appendChild(el);
        const marker = new maplibregl.Marker({ element: root, anchor: "center" })
          .setLngLat([p.lon, p.lat])
          .addTo(mapInst);
        markersRef.current.push({ id: `sig-${i}`, marker, el, isEvent: false });
      });
    }

    const pins = mode === "event" && active ? [active] : events;
    pins.forEach((ev) => {
      const root = document.createElement("div");
      const el = document.createElement("button");
      el.type = "button";
      el.className = "cw-pin";
      if (ev.status === "bestaetigt" || ev.status === "abgelehnt") el.classList.add("is-dim");
      if (ev.verdacht) el.classList.add("is-verdacht");
      el.style.setProperty("--pin", ev.verdacht ? "#E5484D" : SEV[ev.urgency]);
      el.setAttribute("aria-label", ev.verdacht ? `Verdacht auf Falschmeldung: ${ev.titel}` : ev.titel);
      el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${
        ev.verdacht ? VERDACHT_ICON : ICON_SVG[ev.eventType]
      }</svg>`;
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        cbRef.current.onSelect(ev.id);
        setPopoverId(ev.id);
      });
      el.addEventListener("mouseenter", () => cbRef.current.onHover(ev.id));
      el.addEventListener("mouseleave", () => cbRef.current.onHover(null));
      root.appendChild(el);
      const marker = new maplibregl.Marker({ element: root, anchor: "center" })
        .setLngLat([ev.lon, ev.lat])
        .addTo(mapInst);
      markersRef.current.push({ id: ev.id, marker, el, root, isEvent: true });
    });
  }, [mapInst, events, mode, active]);

  // Verknüpfte Markierung: aktiv und Hover auf den Pins spiegeln
  useEffect(() => {
    markersRef.current.forEach((m) => {
      if (!m.isEvent) return;
      const isActive = active?.id === m.id;
      const isHover = hoveredId === m.id && !isActive;
      m.el.classList.toggle("is-active", isActive);
      m.el.classList.toggle("is-hover", isHover);
      if (m.root) m.root.style.zIndex = isActive ? "30" : isHover ? "20" : "10";
    });
  }, [hoveredId, active, mode, events, mapInst]);

  // Kamera folgt dem aktiven Event
  useEffect(() => {
    if (!mapInst || !active) return;
    if (mode === "event") {
      const pts: [number, number][] = [
        ...signalPoints(active).map((p) => [p.lon, p.lat] as [number, number]),
        [active.lon, active.lat],
      ];
      const bounds = pts.reduce(
        (b, p) => b.extend(p),
        new maplibregl.LngLatBounds(pts[0], pts[0])
      );
      mapInst.fitBounds(bounds, { padding: 90, maxZoom: 15.5, duration: 700 });
    } else {
      mapInst.flyTo({
        center: [active.lon, active.lat],
        zoom: Math.max(mapInst.getZoom(), 12.2),
        duration: 700,
      });
    }
  }, [mapInst, active?.id, mode]);

  // Popover schließen, wenn die Auswahl woanders (z. B. Queue) wechselt
  useEffect(() => {
    if (popoverId && popoverId !== active?.id) setPopoverId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id]);

  // Popover-Position an die Karte koppeln
  useEffect(() => {
    if (!mapInst || !popoverId) {
      setPopPos(null);
      return;
    }
    const ev = events.find((e) => e.id === popoverId);
    if (!ev) {
      setPopPos(null);
      return;
    }
    const update = () => {
      const pt = mapInst.project([ev.lon, ev.lat]);
      setPopPos({ x: pt.x, y: pt.y });
    };
    update();
    mapInst.on("move", update);
    return () => {
      mapInst.off("move", update);
    };
  }, [mapInst, popoverId, events]);

  const popEvent = popoverId ? events.find((e) => e.id === popoverId) : undefined;

  const sigCounts = useMemo(() => {
    if (!active) return { social: 0, wetter: 0, amtlich: 0, total: 0 };
    const pts = signalPoints(active);
    return {
      social: pts.filter((p) => p.kind === "social").length,
      wetter: pts.filter((p) => p.kind === "wetter").length,
      amtlich: pts.filter((p) => p.kind === "amtlich").length,
      total: pts.length,
    };
  }, [active]);

  const modeBtn = (isActive: boolean) =>
    `rounded-[5px] px-3 py-1.5 text-[11.5px] font-medium transition-colors disabled:opacity-40 ${
      isActive ? "bg-card text-ink" : "text-soft hover:text-ink"
    }`;

  return (
    <section
      aria-label="Lagekarte"
      className="relative isolate h-full min-h-0 overflow-hidden bg-panel"
    >
      {/* h-full/w-full statt nur inset-0: MapLibres Stylesheet setzt position:relative auf den Container */}
      <div ref={containerRef} className="absolute inset-0 h-full w-full" />

      <div className="absolute left-3 top-3 z-20 flex rounded-md border border-line bg-bg/90 p-[3px] backdrop-blur">
        <button
          type="button"
          onClick={() => onMode("event")}
          disabled={!active}
          aria-pressed={mode === "event"}
          className={modeBtn(mode === "event")}
        >
          Nur dieses Event
        </button>
        <button
          type="button"
          onClick={() => onMode("alle")}
          aria-pressed={mode === "alle"}
          className={modeBtn(mode === "alle")}
        >
          Alle Lagen
        </button>
      </div>

      <div className="absolute right-3 top-3 z-20 flex flex-col gap-2">
        <button
          type="button"
          aria-label="Hineinzoomen"
          onClick={() => mapInst?.zoomIn()}
          className="grid h-9 w-9 place-items-center rounded-full border border-line bg-panel/90 text-ink backdrop-blur hover:bg-card"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Herauszoomen"
          onClick={() => mapInst?.zoomOut()}
          className="grid h-9 w-9 place-items-center rounded-full border border-line bg-panel/90 text-ink backdrop-blur hover:bg-card"
        >
          <Minus className="h-4 w-4" />
        </button>
      </div>

      {mode === "event" && active && (
        <div className="absolute bottom-3 left-3 z-20 max-w-[280px] rounded-lg border border-line bg-bg/90 p-3 backdrop-blur">
          <p className="text-xs font-bold">
            {sigCounts.total >= 2
              ? `Signalbild räumlich konsistent · ${sigCounts.total} Signale`
              : "Einzelsignal · keine räumliche Bestätigung"}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {sigCounts.social > 0 && (
              <Chip>
                <span className="h-2 w-2 rounded-full bg-[#9C9C9C]" aria-hidden /> Social{" "}
                {sigCounts.social}
              </Chip>
            )}
            {sigCounts.wetter > 0 && (
              <Chip>
                <span className="h-2 w-2 rounded-[1px] bg-[#6D8DB5]" aria-hidden /> Wetter{" "}
                {sigCounts.wetter}
              </Chip>
            )}
            {sigCounts.amtlich > 0 && (
              <Chip>
                <span className="h-2 w-2 rotate-45 rounded-[1px] bg-[#3FB36B]" aria-hidden /> Amtlich{" "}
                {sigCounts.amtlich}
              </Chip>
            )}
          </div>
        </div>
      )}

      {popEvent && popPos && (
        <div
          className="absolute z-30"
          style={{
            left: popPos.x,
            top: popPos.y,
            transform: "translate(-50%, calc(-100% - 16px))",
          }}
        >
          <div className="w-60 rounded-lg border border-line bg-panel/95 p-3 shadow-2xl shadow-black/50 backdrop-blur">
            <p className="text-sm font-bold leading-snug">{popEvent.titel}</p>
            <p className="mt-0.5 text-[11px] text-mute">{popEvent.ort}</p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Chip>
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: SEV[popEvent.urgency] }}
                  aria-hidden
                />
                Stufe {popEvent.urgency} · {URGENCY_LABEL[popEvent.urgency]}
              </Chip>
              <Chip>Konfidenz {konfidenzStufe(popEvent.confidence)}</Chip>
            </div>
            <button
              type="button"
              onClick={() => {
                onOpenDetail();
                setPopoverId(null);
              }}
              className="mt-3 w-full rounded-md border border-accent/50 bg-accent/10 py-1.5 text-xs font-semibold text-accent transition-colors hover:bg-accent/20"
            >
              Im Detail öffnen
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
