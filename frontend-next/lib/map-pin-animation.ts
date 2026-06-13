/** Globaler Ticker — animiert Glow + Ripple per Größe/Opacity (Chrome + MapLibre-sicher). */

const DURATION_MS = 2000;
const RIPPLE_MIN_SCALE = 0.55;
const RIPPLE_MAX_SCALE = 2.9;
const GLOW_MIN_SCALE = 0.88;
const GLOW_MAX_SCALE = 1.55;

type Ripple = { el: HTMLElement; phaseMs: number };
type Glow = { el: HTMLElement; phaseMs: number };
type Beat = { el: HTMLElement };

const ripples = new Set<Ripple>();
const glows = new Set<Glow>();
const beats = new Set<Beat>();
let rafId = 0;
let startedAt = 0;

const STOP_KEY = Symbol("cwPinAnimStop");

function easeOut(t: number): number {
  return 1 - (1 - t) ** 2.2;
}

function tick(now: number) {
  if (!startedAt) startedAt = now;
  const elapsed = now - startedAt;

  for (const g of [...glows]) {
    if (!g.el.isConnected) {
      glows.delete(g);
      continue;
    }
    const t = ((elapsed + g.phaseMs) % DURATION_MS) / DURATION_MS;
    const wave = 0.5 - 0.5 * Math.cos(t * Math.PI * 2);
    const scale = GLOW_MIN_SCALE + wave * (GLOW_MAX_SCALE - GLOW_MIN_SCALE);
    const opacity = 0.45 + wave * 0.55;
    const base = 52;
    const size = base * scale;
    const offset = -size / 2;
    g.el.style.width = `${size}px`;
    g.el.style.height = `${size}px`;
    g.el.style.marginLeft = `${offset}px`;
    g.el.style.marginTop = `${offset}px`;
    g.el.style.opacity = String(opacity);
  }

  for (const r of [...ripples]) {
    if (!r.el.isConnected) {
      ripples.delete(r);
      continue;
    }
    const t = ((elapsed + r.phaseMs) % DURATION_MS) / DURATION_MS;
    const eased = easeOut(t);
    const scale = RIPPLE_MIN_SCALE + eased * (RIPPLE_MAX_SCALE - RIPPLE_MIN_SCALE);
    const opacity = Math.max(0, 0.92 * (1 - t));
    const base = 25;
    const size = base * scale;
    const offset = -size / 2;
    r.el.style.width = `${size}px`;
    r.el.style.height = `${size}px`;
    r.el.style.marginLeft = `${offset}px`;
    r.el.style.marginTop = `${offset}px`;
    r.el.style.opacity = String(opacity);
  }

  for (const b of [...beats]) {
    if (!b.el.isConnected) {
      beats.delete(b);
      continue;
    }
    if (b.el.classList.contains("is-active") || b.el.classList.contains("is-hover")) {
      b.el.style.transform = "";
      continue;
    }
    const t = (elapsed % DURATION_MS) / DURATION_MS;
    const beat = 1 - 0.11 * Math.sin(t * Math.PI * 2);
    b.el.style.transform = `scale(${beat})`;
  }

  if (ripples.size > 0 || glows.size > 0 || beats.size > 0) {
    rafId = requestAnimationFrame(tick);
  } else {
    rafId = 0;
    startedAt = 0;
  }
}

function ensureLoop() {
  if (!rafId) rafId = requestAnimationFrame(tick);
}

function registerRipple(el: HTMLElement, phaseMs = 0): () => void {
  const entry: Ripple = { el, phaseMs };
  ripples.add(entry);
  ensureLoop();
  return () => {
    ripples.delete(entry);
  };
}

function registerGlow(el: HTMLElement, phaseMs = 0): () => void {
  const entry: Glow = { el, phaseMs };
  glows.add(entry);
  ensureLoop();
  return () => {
    glows.delete(entry);
  };
}

function registerBeat(el: HTMLElement): () => void {
  const entry: Beat = { el };
  beats.add(entry);
  ensureLoop();
  return () => {
    beats.delete(entry);
  };
}

export function startPinAnimations(
  glow: HTMLElement,
  pulses: HTMLElement[],
  pinBtn: HTMLElement
): () => void {
  const host = pinBtn as HTMLElement & { [STOP_KEY]?: () => void };
  host[STOP_KEY]?.();

  const stops: (() => void)[] = [];
  stops.push(registerGlow(glow, 0));
  pulses.forEach((el, i) => {
    stops.push(registerRipple(el, i * (DURATION_MS / 2)));
  });
  stops.push(registerBeat(pinBtn));

  const stop = () => {
    for (const s of stops) s();
    delete host[STOP_KEY];
  };
  host[STOP_KEY] = stop;
  return stop;
}
