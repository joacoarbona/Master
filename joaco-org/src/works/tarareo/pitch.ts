/* ============================================================
   TARAREO · Motor de análisis de audio
   - Mezcla a mono y baja a ~16 kHz
   - Detección de tono fotograma a fotograma (YIN, cada 10 ms)
   - Segmentación en notas con histéresis + caídas de volumen
   - Corrección de afinación global (si tarareas «entre teclas»)
   Todo corre en el navegador; nada sale del dispositivo.
   ============================================================ */

export type Track = {
  sr: number;            // frecuencia de muestreo usada en el análisis
  hop: number;           // segundos entre fotogramas
  f0: Float32Array;      // Hz (0 = sin tono)
  conf: Float32Array;    // 0..1 claridad del tono (1 - aperiodicidad YIN)
  rms: Float32Array;     // volumen del fotograma
  duration: number;      // segundos
};

export type RawNote = {
  start: number;         // s
  end: number;           // s
  midiF: number;         // tono medio con decimales (sin corregir)
  midi: number;          // nota entera tras corregir la afinación
  cents: number;         // desviación respecto a la nota entera (tras corregir), −50..50
  conf: number;          // confianza media
  vel: number;           // 0..1 intensidad relativa
  split: "start" | "dip" | "pitch"; // por qué empieza aquí
};

export type SegmentOptions = {
  minNoteMs: number;     // duración mínima de nota
  splitSemitones: number;// cuánto tiene que moverse el tono para cambiar de nota
  dipRatio: number;      // caída de volumen (0..1) que separa notas repetidas
  minConf: number;       // claridad mínima para aceptar un fotograma
};

export const DEFAULT_SEG: SegmentOptions = { minNoteMs: 70, splitSemitones: 0.6, dipRatio: 0.55, minConf: 0.55 };

export const midiToHz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
export const hzToMidi = (f: number) => 69 + 12 * Math.log2(f / 440);

// ---------- Utilidades de señal ----------
export function toMono(buf: AudioBuffer): Float32Array {
  if (buf.numberOfChannels === 1) return buf.getChannelData(0).slice();
  const n = buf.length, out = new Float32Array(n);
  for (let c = 0; c < buf.numberOfChannels; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < n; i++) out[i] += d[i];
  }
  const k = 1 / buf.numberOfChannels;
  for (let i = 0; i < n; i++) out[i] *= k;
  return out;
}

/** Diezma con un FIR paso-bajo (sinc enventanado). Devuelve ~16 kHz. */
export function decimate(x: Float32Array, sr: number, target = 16000): { y: Float32Array; sr: number } {
  const k = Math.max(1, Math.round(sr / target));
  if (k === 1) return { y: x, sr };
  const taps = 63, half = (taps - 1) / 2, fc = 0.45 / k;
  const h = new Float32Array(taps);
  let sum = 0;
  for (let i = 0; i < taps; i++) {
    const n = i - half;
    const sinc = n === 0 ? 2 * fc : Math.sin(2 * Math.PI * fc * n) / (Math.PI * n);
    const w = 0.42 - 0.5 * Math.cos((2 * Math.PI * i) / (taps - 1)) + 0.08 * Math.cos((4 * Math.PI * i) / (taps - 1));
    h[i] = sinc * w; sum += h[i];
  }
  for (let i = 0; i < taps; i++) h[i] /= sum;
  const m = Math.floor(x.length / k), y = new Float32Array(m);
  for (let j = 0; j < m; j++) {
    const c = j * k;
    let acc = 0;
    for (let i = 0; i < taps; i++) {
      const idx = c + i - half;
      if (idx >= 0 && idx < x.length) acc += x[idx] * h[i];
    }
    y[j] = acc;
  }
  return { y, sr: sr / k };
}

/** Quita la componente continua y normaliza el pico a ~0.9. */
export function normalize(x: Float32Array): Float32Array {
  let mean = 0;
  for (let i = 0; i < x.length; i++) mean += x[i];
  mean /= Math.max(1, x.length);
  let peak = 1e-9;
  for (let i = 0; i < x.length; i++) peak = Math.max(peak, Math.abs(x[i] - mean));
  const g = 0.9 / peak, y = new Float32Array(x.length);
  for (let i = 0; i < x.length; i++) y[i] = (x[i] - mean) * g;
  return y;
}

// ---------- YIN ----------
const F_MIN = 60, F_MAX = 2200; // hasta el silbido agudo
const YIN_THRESHOLD = 0.12;

/** Estima el tono de un fragmento (empezando en `off`). Devuelve f0 = 0 si no hay tono claro. */
export function yinFrame(x: Float32Array, off: number, W: number, sr: number, d: Float32Array): { f0: number; conf: number } {
  const tauMin = Math.max(2, Math.floor(sr / F_MAX));
  const tauMax = Math.min(d.length - 1, Math.floor(sr / F_MIN));
  if (off + W + tauMax >= x.length) return { f0: 0, conf: 0 };
  // Diferencia cuadrática
  d[0] = 0;
  for (let tau = 1; tau <= tauMax; tau++) {
    let s = 0;
    const o2 = off + tau;
    for (let j = 0; j < W; j++) { const v = x[off + j] - x[o2 + j]; s += v * v; }
    d[tau] = s;
  }
  // Diferencia media acumulada normalizada (CMNDF)
  let run = 0;
  d[0] = 1;
  for (let tau = 1; tau <= tauMax; tau++) {
    run += d[tau];
    d[tau] = run > 0 ? (d[tau] * tau) / run : 1;
  }
  // Primer mínimo bajo el umbral
  let tau = -1;
  for (let t = tauMin; t <= tauMax; t++) {
    if (d[t] < YIN_THRESHOLD) {
      while (t + 1 <= tauMax && d[t + 1] < d[t]) t++;
      tau = t; break;
    }
  }
  if (tau < 0) {
    // sin cruce: mínimo global (baja confianza)
    let best = tauMin;
    for (let t = tauMin + 1; t <= tauMax; t++) if (d[t] < d[best]) best = t;
    tau = best;
  }
  const conf = Math.max(0, Math.min(1, 1 - d[tau]));
  // Interpolación parabólica
  let better = tau;
  if (tau > 1 && tau < tauMax) {
    const a = d[tau - 1], b = d[tau], c = d[tau + 1];
    const den = a + c - 2 * b;
    if (Math.abs(den) > 1e-12) better = tau + (a - c) / (2 * den);
  }
  return { f0: sr / better, conf };
}

/** Tono en tiempo real a partir del buffer del analizador (cualquier frecuencia de muestreo). */
export function livePitch(buf: Float32Array, sr: number): { f0: number; conf: number; rms: number } {
  // Promedia en bloques de k para bajar a ~16 kHz (filtro paso-bajo sencillo)
  const k = Math.max(1, Math.round(sr / 16000));
  const n = Math.floor(buf.length / k), x = new Float32Array(n);
  let rms = 0;
  for (let i = 0; i < n; i++) {
    let s = 0;
    for (let j = 0; j < k; j++) s += buf[i * k + j];
    x[i] = s / k; rms += x[i] * x[i];
  }
  rms = Math.sqrt(rms / Math.max(1, n));
  const s2 = sr / k;
  const tauMax = Math.floor(s2 / F_MIN);
  const W = Math.min(Math.round(0.024 * s2), n - tauMax - 1);
  if (W < 64 || rms < 0.004) return { f0: 0, conf: 0, rms };
  const d = new Float32Array(tauMax + 2);
  const r = yinFrame(x, 0, W, s2, d);
  return { ...r, rms };
}

/** Pista de tono completa: cada 10 ms. Asíncrona para no bloquear la pantalla. */
export async function analyzeTrack(x0: Float32Array, sr0: number, onProgress?: (p: number) => void): Promise<Track> {
  const { y: xd, sr } = decimate(x0, sr0);
  const x = normalize(xd);
  const hop = Math.round(sr * 0.01);
  const W = Math.round(sr * 0.024);
  const tauMax = Math.floor(sr / F_MIN);
  const frames = Math.max(0, Math.floor((x.length - W - tauMax - 1) / hop));
  const f0 = new Float32Array(frames), conf = new Float32Array(frames), rms = new Float32Array(frames);
  const d = new Float32Array(tauMax + 2);
  const t0 = performance.now();
  for (let i = 0; i < frames; i++) {
    const off = i * hop;
    // volumen centrado en la ventana de análisis
    let e = 0;
    for (let j = 0; j < W; j++) { const v = x[off + j]; e += v * v; }
    rms[i] = Math.sqrt(e / W);
    if (rms[i] < 0.003) { f0[i] = 0; conf[i] = 0; }
    else {
      const r = yinFrame(x, off, W, sr, d);
      f0[i] = r.f0; conf[i] = r.conf;
    }
    if (i % 200 === 199 && performance.now() - t0 > 30) {
      onProgress?.(i / frames);
      await new Promise((res) => setTimeout(res, 0));
    }
  }
  onProgress?.(1);
  return { sr, hop: hop / sr, f0, conf, rms, duration: x.length / sr };
}

// ---------- Estadística ----------
function percentile(arr: ArrayLike<number>, p: number): number {
  const a = Array.from(arr).filter((v) => Number.isFinite(v)).sort((u, v) => u - v);
  if (!a.length) return 0;
  return a[Math.min(a.length - 1, Math.max(0, Math.floor(p * (a.length - 1))))];
}
function median(a: number[]): number {
  if (!a.length) return NaN;
  const s = [...a].sort((u, v) => u - v), m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
/** Media circular de la parte decimal (en semitonos, −0.5..0.5), ponderada. */
export function circularOffset(values: number[], weights: number[]): number {
  let c = 0, s = 0;
  values.forEach((v, i) => {
    const ang = 2 * Math.PI * (v - Math.round(v));
    c += Math.cos(ang) * weights[i]; s += Math.sin(ang) * weights[i];
  });
  if (Math.abs(c) + Math.abs(s) < 1e-9) return 0;
  return Math.atan2(s, c) / (2 * Math.PI);
}

/** Tono por fotograma en semitonos MIDI (NaN = sin tono), ya limpio de saltos de octava. */
export function voicedMidi(tr: Track, opt: SegmentOptions = DEFAULT_SEG): { midi: Float32Array; gate: number } {
  const n = tr.f0.length;
  const floor = percentile(tr.rms, 0.1), peak = percentile(tr.rms, 0.97);
  const gate = Math.max(floor * 2.5, peak * 0.08, 0.004);
  const m = new Float32Array(n).fill(NaN);
  for (let i = 0; i < n; i++) {
    if (tr.f0[i] > 0 && tr.conf[i] >= opt.minConf && tr.rms[i] >= gate) m[i] = hzToMidi(tr.f0[i]);
  }
  // Corrige errores de octava frente a la mediana local
  const fixed = new Float32Array(m);
  for (let i = 0; i < n; i++) {
    if (!Number.isFinite(m[i])) continue;
    const win: number[] = [];
    for (let j = Math.max(0, i - 5); j <= Math.min(n - 1, i + 5); j++) if (Number.isFinite(m[j])) win.push(m[j]);
    const med = median(win);
    const diff = m[i] - med;
    if (Math.abs(Math.abs(diff) - 12) < 1.5) fixed[i] = m[i] - 12 * Math.sign(diff);
  }
  // Mediana de 5 para suavizar
  const out = new Float32Array(n).fill(NaN);
  for (let i = 0; i < n; i++) {
    if (!Number.isFinite(fixed[i])) continue;
    const win: number[] = [];
    for (let j = Math.max(0, i - 2); j <= Math.min(n - 1, i + 2); j++) if (Number.isFinite(fixed[j])) win.push(fixed[j]);
    out[i] = median(win);
  }
  // Quita islas de menos de 40 ms
  let i = 0;
  while (i < n) {
    if (!Number.isFinite(out[i])) { i++; continue; }
    let j = i;
    while (j < n && Number.isFinite(out[j])) j++;
    if (j - i < 4) for (let k = i; k < j; k++) out[k] = NaN;
    i = j;
  }
  // Rellena huecos de ≤ 30 ms entre tonos parecidos
  i = 0;
  while (i < n) {
    if (Number.isFinite(out[i])) { i++; continue; }
    let j = i;
    while (j < n && !Number.isFinite(out[j])) j++;
    if (i > 0 && j < n && j - i <= 3 && Math.abs(out[i - 1] - out[j]) < 0.8) {
      for (let k = i; k < j; k++) out[k] = out[i - 1] + ((out[j] - out[i - 1]) * (k - i + 1)) / (j - i + 1);
    }
    i = j;
  }
  return { midi: out, gate };
}

/** Separa la pista en notas. */
export function segmentNotes(tr: Track, opt: SegmentOptions = DEFAULT_SEG): { notes: RawNote[]; offset: number; midi: Float32Array } {
  const { midi } = voicedMidi(tr, opt);
  const n = midi.length, hop = tr.hop;
  // Volumen suavizado
  const sm = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let s = 0, c = 0;
    for (let j = Math.max(0, i - 1); j <= Math.min(n - 1, i + 1); j++) { s += tr.rms[j]; c++; }
    sm[i] = s / c;
  }
  const peakAll = percentile(tr.rms, 0.97) || 1;

  // Afinación aproximada (para cuantizar con histéresis)
  const vals: number[] = [], ws: number[] = [];
  for (let i = 0; i < n; i++) if (Number.isFinite(midi[i])) { vals.push(midi[i]); ws.push(tr.rms[i]); }
  const off0 = circularOffset(vals, ws);

  type Seg = { a: number; b: number; split: RawNote["split"] };
  const segs: Seg[] = [];
  let i = 0;
  const minFrames = Math.max(3, Math.round(opt.minNoteMs / 1000 / hop));
  const confirm = 3;
  const look = Math.round(0.15 / hop);
  while (i < n) {
    if (!Number.isFinite(midi[i])) { i++; continue; }
    let j = i;
    while (j < n && Number.isFinite(midi[j])) j++;
    // Región con tono [i, j): partir por caídas de volumen
    const cuts: { at: number; kind: RawNote["split"] }[] = [{ at: i, kind: "start" }];
    for (let k = i + 2; k < j - 2; k++) {
      if (!(sm[k] <= sm[k - 1] && sm[k] <= sm[k + 1])) continue;
      let lmax = 0, rmax = 0;
      for (let q = Math.max(i, k - look); q < k; q++) lmax = Math.max(lmax, sm[q]);
      for (let q = k + 1; q <= Math.min(j - 1, k + look); q++) rmax = Math.max(rmax, sm[q]);
      const ref = Math.min(lmax, rmax);
      if (ref > peakAll * 0.12 && sm[k] < ref * opt.dipRatio && k - cuts[cuts.length - 1].at >= minFrames && j - k >= minFrames) {
        cuts.push({ at: k, kind: "dip" });
      }
    }
    // Partir por cambios de tono (histéresis sobre la nota redondeada)
    const pieces: { at: number; kind: RawNote["split"] }[] = [];
    cuts.forEach((c, ci) => {
      const end = ci + 1 < cuts.length ? cuts[ci + 1].at : j;
      pieces.push(c);
      let cur = Math.round(midi[c.at] - off0);
      // usa la mediana de los primeros fotogramas para fijar la nota inicial
      const first: number[] = [];
      for (let q = c.at; q < Math.min(end, c.at + 6); q++) first.push(midi[q] - off0);
      cur = Math.round(median(first));
      let cand = -1, candNote = 0, run = 0;
      for (let q = c.at + 1; q < end; q++) {
        const v = midi[q] - off0;
        const near = Math.round(v);
        if (Math.abs(v - cur) > opt.splitSemitones && Math.abs(v - near) < 0.45 && near !== cur) {
          if (cand >= 0 && near === candNote) run++;
          else { cand = q; candNote = near; run = 1; }
          if (run >= confirm) {
            pieces.push({ at: cand, kind: "pitch" });
            cur = candNote; cand = -1; run = 0;
          }
        } else if (Math.abs(v - cur) <= opt.splitSemitones) { cand = -1; run = 0; }
      }
    });
    pieces.sort((u, v) => u.at - v.at);
    pieces.forEach((p, pi) => segs.push({ a: p.at, b: pi + 1 < pieces.length ? pieces[pi + 1].at : j, split: p.kind }));
    i = j;
  }

  // Une o descarta trozos demasiado cortos
  const medOf = (s: Seg) => {
    const len = s.b - s.a;
    const a = s.a + Math.floor(len * 0.2), b = Math.max(a + 1, s.b - Math.floor(len * 0.2));
    const v: number[] = [];
    for (let q = a; q < b; q++) if (Number.isFinite(midi[q])) v.push(midi[q]);
    return median(v);
  };
  let changed = true;
  while (changed) {
    changed = false;
    for (let k = 0; k < segs.length; k++) {
      const s = segs[k];
      if (s.b - s.a >= minFrames) continue;
      const prev = k > 0 && segs[k - 1].b === s.a ? segs[k - 1] : null;
      const next = k + 1 < segs.length && segs[k + 1].a === s.b ? segs[k + 1] : null;
      const m = medOf(s);
      const dp = prev ? Math.abs(medOf(prev) - m) : Infinity, dn = next ? Math.abs(medOf(next) - m) : Infinity;
      if (s.split === "pitch" && prev && (dp <= dn || !next)) { prev.b = s.b; segs.splice(k, 1); }
      else if (next && next.split === "pitch") { next.a = s.a; next.split = s.split; segs.splice(k, 1); }
      else if (prev && dp <= dn) { prev.b = s.b; segs.splice(k, 1); }
      else if (next) { next.a = s.a; next.split = s.split; segs.splice(k, 1); }
      else segs.splice(k, 1);
      changed = true; break;
    }
  }

  // Notas con tono medio
  const pre = segs.map((s) => {
    const m = medOf(s);
    let c = 0, cn = 0, pk = 0;
    for (let q = s.a; q < s.b; q++) { c += tr.conf[q]; cn++; pk = Math.max(pk, tr.rms[q]); }
    return { s, m, conf: c / Math.max(1, cn), pk };
  }).filter((p) => Number.isFinite(p.m));

  // Afinación fina a partir de las notas
  const offset = circularOffset(pre.map((p) => p.m), pre.map((p) => (p.s.b - p.s.a)));
  const notes: RawNote[] = [];
  for (const p of pre) {
    const corr = p.m - offset;
    const mi = Math.round(corr);
    const note: RawNote = {
      start: p.s.a * hop, end: p.s.b * hop, midiF: p.m, midi: mi, cents: Math.round((corr - mi) * 100),
      conf: p.conf, vel: Math.min(1, p.pk / peakAll), split: p.s.split,
    };
    const last = notes[notes.length - 1];
    // Une notas iguales contiguas que solo se separaron por el tono
    if (last && note.split === "pitch" && last.midi === note.midi && note.start - last.end < 0.02) {
      last.end = note.end; continue;
    }
    notes.push(note);
  }
  return { notes, offset, midi };
}
