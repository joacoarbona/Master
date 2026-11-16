/* ============================================================
   TARAREO · Sonido
   Piano y guitarra sintetizados (Karplus–Strong), rasgueo de
   acordes, metrónomo y reproducción de la grabación original.
   ============================================================ */
import { midiToHz } from "./pitch";

const AC = (): typeof AudioContext => window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
let ctx: AudioContext | null = null;
/** Contexto de reproducción (distinto del de grabación). */
export function getCtx(): AudioContext {
  if (!ctx || ctx.state === "closed") ctx = new (AC())();
  return ctx;
}
/** Contexto propio para grabar: se cierra al terminar para que el iPhone no deje el sonido en el auricular. */
export function newRecContext(): AudioContext { return new (AC())(); }

// ---------- iPhone / iPad ----------
export const isIOS = typeof navigator !== "undefined" &&
  (/iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
export const isChromeIOS = typeof navigator !== "undefined" && /CriOS/.test(navigator.userAgent);
export const isFirefoxIOS = typeof navigator !== "undefined" && /FxiOS/.test(navigator.userAgent);

/** Tipo de sesión de audio (iOS 17+): «playback» hace que suene aunque el móvil esté en silencio. */
export function setSession(type: "playback" | "play-and-record" | "auto") {
  try {
    const n = navigator as Navigator & { audioSession?: { type: string } };
    if (n.audioSession && n.audioSession.type !== type) n.audioSession.type = type;
  } catch { /* sin soporte */ }
}

let keep: HTMLAudioElement | null = null;
let keepUntil = 0, keepTimer = 0;
function silentWavUrl(): string {
  const sr = 22050, n = Math.round(sr * 0.3), buf = new ArrayBuffer(44 + n * 2), v = new DataView(buf);
  const w = (o: number, str: string) => { for (let i = 0; i < str.length; i++) v.setUint8(o + i, str.charCodeAt(i)); };
  w(0, "RIFF"); v.setUint32(4, 36 + n * 2, true); w(8, "WAVE"); w(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true);
  v.setUint16(22, 1, true); v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  w(36, "data"); v.setUint32(40, n * 2, true);
  return URL.createObjectURL(new Blob([buf], { type: "audio/wav" }));
}
/**
 * Llamar al principio de cada gesto que suena (tocar, pulsar una tecla…).
 * En iPhone el audio web va por el canal del timbre y el modo silencio lo apaga;
 * un <audio> silencioso en bucle lo pasa al canal multimedia mientras dure el sonido.
 */
export function unlockAudio(holdSec = 1.5) {
  setSession("playback");
  const c = getCtx();
  if (c.state !== "running") c.resume().catch(() => { /* se reintenta en el siguiente gesto */ });
  if (!isIOS) return;
  try {
    if (!keep) {
      keep = new Audio(silentWavUrl());
      keep.loop = true;
      keep.setAttribute("playsinline", "");
      keep.preload = "auto";
    }
    if (keep.paused) keep.play().catch(() => { /* el siguiente gesto lo vuelve a intentar */ });
    keepUntil = Math.max(keepUntil, performance.now() + (holdSec + 1.5) * 1000);
    clearTimeout(keepTimer);
    const tick = () => { if (performance.now() >= keepUntil) keep?.pause(); else keepTimer = window.setTimeout(tick, 500); };
    keepTimer = window.setTimeout(tick, 500);
  } catch { /* */ }
}
/** Suelta el canal multimedia (al parar). */
export function releaseAudio() { keepUntil = performance.now() + 800; }

export type Instrument = "piano" | "guitarra" | "flauta";

const ksCache = new Map<string, AudioBuffer>();
/** Cuerda pulsada (Karplus–Strong). */
function pluck(c: AudioContext, midi: number, bright = 0.5): AudioBuffer {
  const key = `${midi}|${bright}|${c.sampleRate}`;
  const hit = ksCache.get(key);
  if (hit) return hit;
  const sr = c.sampleRate, len = Math.floor(sr * 2.2);
  const buf = c.createBuffer(1, len, sr), d = buf.getChannelData(0);
  const f = midiToHz(midi), N = Math.max(2, Math.round(sr / f));
  const line = new Float32Array(N);
  let seed = midi * 9973 + 1;
  for (let i = 0; i < N; i++) { seed = (seed * 1103515245 + 12345) & 0x7fffffff; line[i] = (seed / 0x7fffffff) * 2 - 1; }
  // suaviza el ruido inicial (pulsación con la yema)
  for (let k = 0; k < 2; k++) for (let i = 1; i < N; i++) line[i] = line[i] * bright + line[i - 1] * (1 - bright);
  const decay = 0.996 - Math.max(0, midi - 60) * 0.0004;
  let p = 0;
  for (let i = 0; i < len; i++) {
    const a = line[p], b = line[(p + 1) % N];
    const v = 0.5 * (a + b) * decay;
    d[i] = a; line[p] = v; p = (p + 1) % N;
  }
  // normaliza
  let pk = 1e-6; for (let i = 0; i < Math.min(len, 4000); i++) pk = Math.max(pk, Math.abs(d[i]));
  for (let i = 0; i < len; i++) d[i] /= pk;
  ksCache.set(key, buf);
  return buf;
}

function pianoNote(c: AudioContext, out: AudioNode, midi: number, t: number, dur: number, vel: number) {
  const f = midiToHz(midi);
  const g = c.createGain();
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.setValueAtTime(Math.min(12000, f * 9), t);
  lp.frequency.exponentialRampToValueAtTime(Math.max(400, f * 2.5), t + 0.6);
  const peak = 0.22 * (0.55 + 0.45 * vel);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.006);
  const end = t + Math.max(0.12, dur);
  g.gain.setTargetAtTime(peak * 0.2, t + 0.006, 0.45); // caída natural
  g.gain.setTargetAtTime(0.0001, end, 0.09);           // al soltar la tecla
  lp.connect(g); g.connect(out);
  const parts: [OscillatorType, number, number][] = [["triangle", 1, 1], ["sine", 2, 0.35], ["sine", 3, 0.12], ["sine", 4.01, 0.05]];
  for (const [type, mul, amp] of parts) {
    const o = c.createOscillator(), og = c.createGain();
    o.type = type; o.frequency.value = f * mul; og.gain.value = amp;
    o.connect(og); og.connect(lp);
    o.start(t); o.stop(end + 0.6);
  }
}

function fluteNote(c: AudioContext, out: AudioNode, midi: number, t: number, dur: number, vel: number) {
  const o = c.createOscillator(), g = c.createGain(), vib = c.createOscillator(), vg = c.createGain();
  o.type = "sine"; o.frequency.value = midiToHz(midi);
  vib.frequency.value = 5; vg.gain.value = midiToHz(midi) * 0.006;
  vib.connect(vg); vg.connect(o.frequency);
  const peak = 0.2 * (0.6 + 0.4 * vel), end = t + Math.max(0.1, dur * 0.95);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.05);
  g.gain.setValueAtTime(peak, end - 0.04);
  g.gain.exponentialRampToValueAtTime(0.0001, end + 0.05);
  o.connect(g); g.connect(out);
  o.start(t); vib.start(t); o.stop(end + 0.1); vib.stop(end + 0.1);
}

function guitarNote(c: AudioContext, out: AudioNode, midi: number, t: number, dur: number, vel: number, gainMul = 1) {
  const src = c.createBufferSource(), g = c.createGain();
  src.buffer = pluck(c, midi, 0.55);
  const peak = 0.32 * (0.5 + 0.5 * vel) * gainMul;
  g.gain.setValueAtTime(peak, t);
  g.gain.setTargetAtTime(0.0001, t + Math.max(0.15, dur), 0.08);
  src.connect(g); g.connect(out);
  src.start(t); src.stop(t + Math.max(0.15, dur) + 0.6);
}

export function playNote(inst: Instrument, midi: number, dur = 0.6, when?: number, out?: AudioNode) {
  if (when == null) unlockAudio(dur + 0.5); // nota suelta: viene de un toque
  const c = getCtx();
  const t = when ?? c.currentTime + 0.02;
  const dest = out ?? c.destination;
  if (inst === "piano") pianoNote(c, dest, midi, t, dur, 0.8);
  else if (inst === "guitarra") guitarNote(c, dest, midi, t, dur, 0.8);
  else fluteNote(c, dest, midi, t, dur, 0.8);
}

export function strum(midis: number[], when: number, dur: number, out: AudioNode, down = true, vol = 1) {
  const c = getCtx();
  const order = down ? midis : [...midis].reverse();
  order.forEach((m, i) => guitarNote(c, out, m, when + i * 0.018, dur, 0.6, 0.55 * vol));
}
export function blockChord(midis: number[], when: number, dur: number, out: AudioNode, vol = 1) {
  const c = getCtx();
  midis.forEach((m) => pianoNote(c, out, m, when, dur, 0.35 * vol));
}

export function click(when: number, out: AudioNode, accent: boolean, on?: AudioContext) {
  const c = on ?? getCtx();
  const o = c.createOscillator(), g = c.createGain();
  o.type = "square"; o.frequency.value = accent ? 1800 : 1200;
  g.gain.setValueAtTime(accent ? 0.12 : 0.07, when);
  g.gain.exponentialRampToValueAtTime(0.0001, when + 0.04);
  o.connect(g); g.connect(out);
  o.start(when); o.stop(when + 0.05);
}

/** Nodo maestro de una reproducción: al pararlo se silencia todo lo programado. */
export function newBus(): { bus: GainNode; stop: () => void } {
  const c = getCtx();
  const bus = c.createGain();
  bus.gain.value = 1;
  const comp = c.createDynamicsCompressor();
  comp.threshold.value = -14; comp.ratio.value = 4;
  bus.connect(comp); comp.connect(c.destination);
  return {
    bus,
    stop: () => {
      const t = c.currentTime;
      bus.gain.cancelScheduledValues(t);
      bus.gain.setValueAtTime(bus.gain.value, t);
      bus.gain.linearRampToValueAtTime(0, t + 0.05);
      setTimeout(() => { try { bus.disconnect(); comp.disconnect(); } catch { /* ya desconectado */ } }, 120);
    },
  };
}

export function pcmToBuffer(pcm: Float32Array, sr: number): AudioBuffer {
  const c = getCtx();
  const b = c.createBuffer(1, pcm.length, sr);
  b.getChannelData(0).set(pcm);
  return b;
}
