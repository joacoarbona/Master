/* ============================================================
   TARAREO · Interpretaciones sintéticas
   Convierte una partitura en audio «realista» para los ejemplos
   y para el banco de pruebas: tarareo, silbido, piano (con mano
   izquierda y pedal) y guitarra (cuerdas que se apagan entre sí).
   Incluye imprecisiones humanas: tiempo, afinación, volumen.
   ============================================================ */
import { midiToHz } from "./pitch";
import type { Part, Song } from "./songs";

export type RenderMode = "hum" | "whistle" | "piano" | "guitar";
export type RenderOpts = {
  sr?: number; seed?: number; tempoMul?: number; detuneCents?: number; withAcc?: boolean;
  pedal?: boolean; noise?: number; reverb?: number; jitterMs?: number; octave?: number;
};
export type Rendered = { pcm: Float32Array; sr: number; truth: { start: number; end: number; midi: number }[] };

function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

export function renderSong(song: Song, mode: RenderMode, o: RenderOpts = {}): Rendered {
  const sr = o.sr ?? 16000;
  const rnd = rng(o.seed ?? 3);
  const bpm = song.bpm * (o.tempoMul ?? 1);
  const beat = 60 / bpm;
  const jit = (o.jitterMs ?? (mode === "hum" || mode === "whistle" ? 22 : 12)) / 1000;
  const lead = 0.4;
  const oct = (o.octave ?? 0) * 12 + (mode === "whistle" ? 12 : 0);
  const melody = song.melody;
  const acc = o.withAcc ?? true ? song.acc : [];
  const last = Math.max(...melody.map((n) => n.start + n.dur), ...acc.map((n) => n.start + n.dur));
  const total = lead + last * beat + 1.6;
  const out = new Float32Array(Math.ceil(total * sr));
  const time = (b: number) => lead + b * beat + (rnd() - 0.5) * 2 * jit;
  const det = (o.detuneCents ?? (mode === "hum" ? 25 : mode === "whistle" ? -15 : 0)) / 100;
  const truth: Rendered["truth"] = [];

  const melTimes = melody.map((n) => ({ n, t: time(n.start) }));
  melTimes.forEach(({ n, t }, i) => {
    const nx = melTimes[i + 1];
    const end = t + n.dur * beat;
    truth.push({ start: t, end: Math.min(end, nx ? nx.t : end), midi: n.midi + oct });
  });

  if (mode === "hum" || mode === "whistle") voice(out, sr, melTimes.map(({ n, t }) => ({ midi: n.midi + oct, t, dur: n.dur * beat })), mode, det, rnd);
  else if (mode === "piano") {
    const all = [...melTimes.map(({ n, t }) => ({ midi: n.midi + oct, t, dur: n.dur * beat, vel: 0.75 + rnd() * 0.15 })),
      ...acc.map((n) => ({ midi: n.midi + oct, t: time(n.start), dur: n.dur * beat, vel: 0.45 + rnd() * 0.12 }))];
    for (const nt of all) piano(out, sr, nt.midi, nt.t, o.pedal ? Math.max(nt.dur, 1.2) : nt.dur, nt.vel, det, rnd);
  } else {
    // Guitarra: cada cuerda suena hasta que vuelve a pulsarse
    const all = [...melTimes.map(({ n, t }) => ({ ...n, midi: n.midi + oct, t, vel: 0.8 + rnd() * 0.15, string: n.string ?? 5 })),
      ...acc.map((n: Part) => ({ ...n, midi: n.midi + oct, t: time(n.start), vel: 0.5 + rnd() * 0.12, string: n.string ?? 2 }))].sort((a, b) => a.t - b.t);
    all.forEach((nt, i) => {
      const nextSame = all.slice(i + 1).find((q) => q.string === nt.string);
      const stop = nextSame ? nextSame.t : nt.t + 3.5;
      guitar(out, sr, nt.midi, nt.t, Math.min(stop - nt.t, 3.5), nt.vel, det, rnd);
    });
  }
  if (o.reverb ?? 0.12) reverb(out, sr, o.reverb ?? 0.12);
  const nz = o.noise ?? 0.003;
  for (let i = 0; i < out.length; i++) out[i] += (rnd() - 0.5) * 2 * nz;
  let pk = 1e-9; for (let i = 0; i < out.length; i++) pk = Math.max(pk, Math.abs(out[i]));
  for (let i = 0; i < out.length; i++) out[i] *= 0.8 / pk;
  return { pcm: out, sr, truth };
}

// ---------- Voz: tarareo o silbido ----------
function voice(out: Float32Array, sr: number, notes: { midi: number; t: number; dur: number }[], mode: "hum" | "whistle", det: number, rnd: () => number) {
  let phase = 0;
  notes.forEach((n, i) => {
    const prev = notes[i - 1];
    const len = n.dur * (n.dur < 0.25 ? 0.78 : 0.86);
    const target = n.midi + det + (rnd() - 0.5) * (mode === "hum" ? 0.24 : 0.14);
    const a = Math.max(0, Math.floor(n.t * sr)), b = Math.min(out.length, Math.floor((n.t + len) * sr));
    const amp = (0.25 + rnd() * 0.08) * (mode === "whistle" ? 0.9 : 1);
    const legatoFrom = prev && n.t - (prev.t + prev.dur * 0.86) < 0.06 ? prev.midi + det : null;
    for (let i2 = a; i2 < b; i2++) {
      const lt = (i2 - a) / sr;
      let pitch = target;
      if (mode === "hum" && lt < 0.06) pitch -= 0.45 * (1 - lt / 0.06);
      if (mode === "whistle" && legatoFrom != null && lt < 0.04) pitch = legatoFrom + (target - legatoFrom) * (lt / 0.04);
      if (lt > 0.18) pitch += (mode === "hum" ? 0.18 : 0.08) * Math.sin(2 * Math.PI * 5.4 * lt);
      const f = midiToHz(pitch);
      phase += (2 * Math.PI * f) / sr;
      const env = Math.max(0, Math.min(1, lt / 0.03) * Math.min(1, (len - lt) / 0.045));
      let s = 0;
      if (mode === "hum") for (let h = 1; h <= 6; h++) s += Math.sin(phase * h) / Math.pow(h, 1.25);
      else s = Math.sin(phase) + 0.04 * Math.sin(2 * phase);
      // aire (soplido / consonante)
      const breath = (rnd() - 0.5) * (mode === "whistle" ? 0.05 : 0.03) * (lt < 0.02 ? 3 : 1);
      out[i2] += (s + breath) * env * amp;
    }
  });
}

// ---------- Piano (aditivo, inarmónico, dos caídas, martillo) ----------
function piano(out: Float32Array, sr: number, midi: number, t: number, dur: number, vel: number, det: number, rnd: () => number) {
  const f0 = midiToHz(midi + det);
  const B = 0.00025 * Math.pow(f0 / 261.6, 0.5);
  const tau0 = 2.4 * Math.pow(261.6 / f0, 0.55);
  const rel = 0.07;
  const len = dur + rel * 5;
  const a = Math.max(0, Math.floor(t * sr)), b = Math.min(out.length, Math.floor((t + len) * sr));
  const parts: { w: number; amp: number; tau: number; ph: number }[] = [];
  for (let k = 1; k <= 14; k++) {
    const fk = k * f0 * Math.sqrt(1 + B * k * k);
    if (fk > sr * 0.45) break;
    parts.push({ w: (2 * Math.PI * fk) / sr, amp: (1 / Math.pow(k, 1.05)) * Math.exp(-(k - 1) * (0.22 - 0.12 * vel)), tau: tau0 / (1 + 0.35 * (k - 1)), ph: rnd() * 6.28 });
  }
  const g = 0.22 * vel;
  for (let i = a; i < b; i++) {
    const lt = (i - a) / sr;
    const att = Math.min(1, lt / 0.002);
    const relEnv = lt > dur ? Math.exp(-(lt - dur) / rel) : 1;
    let s = 0;
    for (const p of parts) s += p.amp * (0.65 * Math.exp(-lt / (0.12 * p.tau)) + 0.35 * Math.exp(-lt / p.tau)) * Math.sin(p.ph + p.w * (i - a));
    if (lt < 0.006) s += (rnd() - 0.5) * 0.25 * (1 - lt / 0.006);
    out[i] += s * g * att * relEnv;
  }
}

// ---------- Guitarra (Karplus–Strong) ----------
function guitar(out: Float32Array, sr: number, midi: number, t: number, len: number, vel: number, det: number, rnd: () => number) {
  const f = midiToHz(midi + det);
  // Periodo total = línea N + 0,5 (filtro promedio) + d (paso-todo fraccional)
  const P = sr / f;
  let N = Math.floor(P - 0.5), d = P - 0.5 - N;
  if (d < 0.15) { N -= 1; d += 1; }
  const C = (1 - d) / (1 + d);
  // Forma inicial de una cuerda pulsada (triángulo con el vértice cerca del puente) + algo de ruido
  const line = new Float32Array(N);
  const beta = 0.16 + rnd() * 0.06;
  let mean = 0;
  for (let i = 0; i < N; i++) {
    const u = i / N;
    line[i] = (u < beta ? u / beta : (1 - u) / (1 - beta)) + (rnd() - 0.5) * 0.12;
    mean += line[i];
  }
  mean /= N;
  for (let i = 0; i < N; i++) line[i] -= mean;
  for (let i = 1; i < N; i++) line[i] = 0.7 * line[i] + 0.3 * line[i - 1];
  let pk = 1e-6; for (let i = 0; i < N; i++) pk = Math.max(pk, Math.abs(line[i]));
  const decay = 0.997 - Math.max(0, midi - 64) * 0.0003;
  const a = Math.max(0, Math.floor(t * sr)), b = Math.min(out.length, Math.floor((t + len + 0.03) * sr));
  const g = (0.3 * vel) / pk;
  let p = 0, lastX = 0, apX = 0, apY = 0;
  for (let i = a; i < b; i++) {
    const lt = (i - a) / sr;
    const x = line[p];
    const lp = 0.5 * (x + lastX) * decay; lastX = x;
    const ap = C * lp + apX - C * apY; apX = lp; apY = ap;
    line[p] = ap; p = (p + 1) % N;
    const damp = lt > len ? Math.exp(-(lt - len) / 0.008) : 1;
    out[i] += x * g * damp;
  }
}

// ---------- Sala ----------
function reverb(x: Float32Array, sr: number, mix: number) {
  const combs = [0.0297, 0.0371, 0.0411, 0.0437].map((d) => ({ buf: new Float32Array(Math.round(d * sr)), i: 0, fb: 0.72 }));
  const aps = [0.005, 0.0017].map((d) => ({ buf: new Float32Array(Math.round(d * sr)), i: 0, g: 0.7 }));
  for (let n = 0; n < x.length; n++) {
    const inp = x[n];
    let s = 0;
    for (const c of combs) { const y = c.buf[c.i]; c.buf[c.i] = inp + y * c.fb; c.i = (c.i + 1) % c.buf.length; s += y; }
    s *= 0.25;
    for (const ap of aps) { const y = ap.buf[ap.i]; const v = s + y * ap.g; ap.buf[ap.i] = v; ap.i = (ap.i + 1) % ap.buf.length; s = y - ap.g * v; }
    x[n] = inp + s * mix;
  }
}
