/* ============================================================
   TARAREO · Teoría musical
   Ritmo (tempo, compás, anacrusa), tonalidad, nombres de notas,
   armonización con acordes, formas de guitarra, cejilla,
   digitación de piano y tablatura.
   ============================================================ */
import type { RawNote } from "./pitch";

export type Mode = "major" | "minor";
export type Key = { tonic: number; mode: Mode };
export type TimeSig = { num: number; den: number };
export type QNote = { id: string; midi: number; start: number; dur: number; vel: number; raw?: number };
export type Quality = "maj" | "min" | "dim" | "7";
export type Chord = { root: number; q: Quality; roman: string };
export type ChordEvent = { start: number; dur: number; chord: Chord };

export const TIME_SIGS: TimeSig[] = [{ num: 4, den: 4 }, { num: 3, den: 4 }, { num: 2, den: 4 }, { num: 6, den: 8 }, { num: 3, den: 8 }];
export const barLen = (ts: TimeSig) => ts.num * (16 / ts.den);           // en semicorcheas
export const beatLen = (ts: TimeSig) => (ts.den === 8 && ts.num % 3 === 0 ? 6 : 16 / ts.den);
export const tsLabel = (ts: TimeSig) => `${ts.num}/${ts.den}`;

let idSeq = 0;
export const nid = () => "n" + (++idSeq).toString(36) + Math.random().toString(36).slice(2, 5);

// ---------- Nombres ----------
const LETTERS = ["C", "D", "E", "F", "G", "A", "B"];
const LETTERS_ES = ["Do", "Re", "Mi", "Fa", "Sol", "La", "Si"];
const LETTER_PC = [0, 2, 4, 5, 7, 9, 11];
export type Spelled = { letter: number; alter: number; octave: number };
export type Naming = "es" | "en";

export function accSymbol(alter: number): string {
  return alter === 0 ? "" : alter === 1 ? "♯" : alter === -1 ? "♭" : alter === 2 ? "𝄪" : alter === -2 ? "𝄫" : "";
}
export function letterName(letter: number, alter: number, naming: Naming): string {
  return (naming === "es" ? LETTERS_ES[letter] : LETTERS[letter]) + accSymbol(alter);
}
export function spelledName(s: Spelled, naming: Naming, withOctave = true): string {
  return letterName(s.letter, s.alter, naming) + (withOctave ? String(s.octave) : "");
}

// Armadura (quintas) y nombre de la tónica
const MAJOR_FIFTHS: Record<number, number> = { 0: 0, 7: 1, 2: 2, 9: 3, 4: 4, 11: 5, 6: 6, 1: -5, 8: -4, 3: -3, 10: -2, 5: -1 };
const MINOR_FIFTHS: Record<number, number> = { 9: 0, 4: 1, 11: 2, 6: 3, 1: 4, 8: 5, 3: -6, 2: -1, 7: -2, 0: -3, 5: -4, 10: -5 };
export const keyFifths = (k: Key) => (k.mode === "major" ? MAJOR_FIFTHS : MINOR_FIFTHS)[((k.tonic % 12) + 12) % 12];
// Letra de la tónica a partir de las quintas
function tonicLetter(k: Key): { letter: number; alter: number } {
  const f = keyFifths(k);
  // Tónica mayor de la armadura: C + f quintas
  const majLetter = ((f * 4) % 7 + 7) % 7;
  const majPc = ((f * 7) % 12 + 12) % 12;
  const majAlter = norm(majPc - LETTER_PC[majLetter]);
  if (k.mode === "major") return { letter: majLetter, alter: majAlter };
  const minLetter = (majLetter + 5) % 7; // sexto grado
  const minPc = (majPc + 9) % 12;
  return { letter: minLetter, alter: norm(minPc - LETTER_PC[minLetter]) };
}
function norm(d: number): number { let x = ((d % 12) + 12) % 12; if (x > 6) x -= 12; return x; }

const MAJOR_STEPS = [0, 2, 4, 5, 7, 9, 11];
const MINOR_STEPS = [0, 2, 3, 5, 7, 8, 10];
// Grado y alteración para las notas cromáticas (relativas a la tónica)
const CHROM_MAJOR: Record<number, [number, number]> = { 1: [0, 1], 3: [2, -1], 6: [3, 1], 8: [5, -1], 10: [6, -1] };
const CHROM_MINOR: Record<number, [number, number]> = { 1: [1, -1], 4: [2, 1], 6: [3, 1], 9: [5, 1], 11: [6, 1] };

export function spell(midi: number, key: Key): Spelled {
  const t = tonicLetter(key);
  const tonicPc = ((key.tonic % 12) + 12) % 12;
  const steps = key.mode === "major" ? MAJOR_STEPS : MINOR_STEPS;
  const r = (((midi - tonicPc) % 12) + 12) % 12;
  let deg = steps.indexOf(r), extra = 0;
  if (deg < 0) { const c = (key.mode === "major" ? CHROM_MAJOR : CHROM_MINOR)[r]; deg = c[0]; extra = c[1]; }
  const letter = (t.letter + deg) % 7;
  const pc = (tonicPc + steps[deg] + extra + 12) % 12;
  const alter = norm(pc - LETTER_PC[letter]);
  const octave = Math.round((midi - LETTER_PC[letter] - alter) / 12) - 1;
  return { letter, alter, octave };
}
export function keyName(k: Key, naming: Naming): string {
  const t = tonicLetter(k);
  const n = letterName(t.letter, t.alter, naming);
  if (naming === "en") return `${n} ${k.mode === "major" ? "major" : "minor"}`;
  return `${n} ${k.mode === "major" ? "mayor" : "menor"}`;
}
export function keySignatureText(k: Key): string {
  const f = keyFifths(k);
  if (f === 0) return "sin alteraciones";
  return `${Math.abs(f)} ${f > 0 ? (Math.abs(f) === 1 ? "sostenido" : "sostenidos") : Math.abs(f) === 1 ? "bemol" : "bemoles"}`;
}
/** Nombre sencillo para un número MIDI (sin tonalidad: sostenidos). */
export function plainName(midi: number, naming: Naming, withOctave = true): string {
  return spelledName(spell(midi, { tonic: 0, mode: "major" }), naming, withOctave);
}

// ---------- Tonalidad (Krumhansl–Kessler) ----------
const KK_MAJOR = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const KK_MINOR = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
function pearson(a: number[], b: number[]): number {
  const n = a.length, ma = a.reduce((s, v) => s + v, 0) / n, mb = b.reduce((s, v) => s + v, 0) / n;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) { num += (a[i] - ma) * (b[i] - mb); da += (a[i] - ma) ** 2; db += (b[i] - mb) ** 2; }
  return da && db ? num / Math.sqrt(da * db) : 0;
}
export type KeyGuess = Key & { score: number };
export function detectKeys(notes: { midi: number; dur: number }[]): KeyGuess[] {
  const h = new Array(12).fill(0);
  notes.forEach((n, i) => {
    const w = n.dur * (i === notes.length - 1 ? 2 : 1) * (i === 0 ? 1.3 : 1);
    h[((n.midi % 12) + 12) % 12] += w;
  });
  const out: KeyGuess[] = [];
  for (let t = 0; t < 12; t++) {
    const rot = (p: number[]) => p.map((_, i) => p[(i - t + 12) % 12]);
    out.push({ tonic: t, mode: "major", score: pearson(h, rot(KK_MAJOR)) });
    out.push({ tonic: t, mode: "minor", score: pearson(h, rot(KK_MINOR)) - 0.02 });
  }
  // Pequeño empujón: si la última nota es la tónica
  const last = notes[notes.length - 1];
  if (last) out.forEach((k) => { if (((last.midi - k.tonic) % 12 + 12) % 12 === 0) k.score += 0.06; });
  return out.sort((a, b) => b.score - a.score);
}

// ---------- Ritmo ----------
// Lo bien que «suena» cada distancia entre notas, en semicorcheas: negras y corcheas muy probables,
// semicorcheas bastante, valores con puntillo menos (si todo sale con puntillo, el tempo está mal).
const IOI_GOOD: Record<number, number> = { 1: 0.7, 2: 0.9, 3: 0.35, 4: 1, 6: 0.45, 8: 0.85, 12: 0.4, 16: 0.5 };
export function estimateTempo(onsets: number[]): { bpm: number; fit: number } {
  const iois: number[] = [];
  for (let i = 1; i < onsets.length; i++) { const d = onsets[i] - onsets[i - 1]; if (d > 0.06 && d < 2.5) iois.push(d); }
  if (iois.length < 2) return { bpm: 100, fit: 0 };
  let best = 100, bestS = -Infinity;
  for (let bpm = 40; bpm <= 200; bpm += 0.5) {
    const u = 60 / bpm / 4;
    let s = 0;
    for (const d of iois) {
      const r = d / u, n = Math.max(1, Math.round(r));
      // tolerancia absoluta (~45 ms): no premia rejillas gruesas por ser más permisivas
      s += (IOI_GOOD[n] ?? 0.3) * Math.exp(-(((d - n * u) / 0.045) ** 2));
    }
    s = (s / iois.length) * Math.exp(-0.5 * (Math.log2(bpm / 100) / 1.0) ** 2);
    if (s > bestS) { bestS = s; best = bpm; }
  }
  return { bpm: best, fit: bestS };
}

function gridPositions(onsets: number[], bpm: number): { q: number[]; bpm: number } {
  let u = 60 / bpm / 4;
  const t0 = onsets[0] ?? 0;
  let q = onsets.map((t) => Math.round((t - t0) / u));
  // Refina el pulso con mínimos cuadrados (corrige deriva) y recuantiza
  if (onsets.length >= 4) {
    let sxy = 0, sxx = 0;
    q.forEach((qi, i) => { sxy += qi * (onsets[i] - t0); sxx += qi * qi; });
    if (sxx > 0) {
      const u2 = sxy / sxx;
      if (u2 > u * 0.85 && u2 < u * 1.15) { u = u2; q = onsets.map((t) => Math.round((t - t0) / u)); }
    }
  }
  for (let i = 1; i < q.length; i++) if (q[i] <= q[i - 1]) q[i] = q[i - 1] + 1;
  return { q, bpm: 60 / (u * 4) };
}

function metricWeight(pos: number, ts: TimeSig): number {
  const L = barLen(ts), p = ((pos % L) + L) % L;
  if (p === 0) return 1;
  if (ts.den === 8) {
    // compases de corcheas: 6/8 = dos pulsos de negra con puntillo; 3/8 = un pulso
    if (ts.num === 6 && p === 6) return 0.6;
    if (p % 2 === 0) return 0.3;
    return 0.05;
  }
  const beat = beatLen(ts);
  if (ts.num === 4 && ts.den === 4 && p === 8) return 0.6;
  if (p % beat === 0) return 0.45;
  if (p % 2 === 0) return 0.2;
  return 0.05;
}

export type Quantized = { notes: QNote[]; bpm: number; ts: TimeSig; pickup: number; tempoFit: number };

/** accents: instantes (s) con peso extra para el compás, p. ej. los golpes del bajo. */
export function quantize(raw: RawNote[], opts: { bpm?: number; ts?: TimeSig | null; accents?: number[] } = {}): Quantized {
  if (!raw.length) return { notes: [], bpm: opts.bpm ?? 100, ts: opts.ts ?? TIME_SIGS[0], pickup: 0, tempoFit: 0 };
  const onsets = raw.map((r) => r.start);
  const est = opts.bpm ? { bpm: opts.bpm, fit: 1 } : estimateTempo(onsets);
  const g = gridPositions(onsets, est.bpm);
  const bpm = opts.bpm ?? Math.round(g.bpm);
  const u = 60 / g.bpm / 4, t0 = onsets[0];
  const q = g.q;
  // Duraciones (legato si el hueco es menor que una corchea)
  const durs = raw.map((r, i) => {
    if (i + 1 < raw.length) {
      const endQ = Math.max(q[i] + 1, Math.round((r.end - t0) / u));
      const nx = q[i + 1];
      const e = Math.min(endQ, nx);
      return nx - e < 2 ? nx - q[i] : e - q[i];
    }
    // la última nota se suele cortar antes: se alarga un poco
    return Math.max(1, Math.round(((r.end - r.start) / u) * 1.15));
  });
  // Compás: el que hace destacar más una fase concreta (puntuación z). Anacrusa: fase con más peso en los tiempos fuertes.
  const evenOnly = q.every((x) => x % 2 === 0);
  // Golpes del bajo en la misma rejilla (pesan como una nota larga)
  const acc = (opts.accents ?? []).map((t) => Math.round((t - t0) / u)).filter((x) => x >= -2);
  const total = (durs.reduce((s, d) => s + d, 0) || 1) + acc.length * 4;
  const phaseScores = (ts: TimeSig) => {
    const L = barLen(ts), out: { s: number; v: number }[] = [];
    for (let s = 0; s < L; s++) {
      if (s % 2 && evenOnly) continue; // desplazamientos de semicorchea solo si hacen falta
      let sc = 0;
      q.forEach((qi, i) => {
        const pos = qi + s;
        sc += Math.min(durs[i], 8) * metricWeight(pos, ts);
        const inBar = ((pos % L) + L) % L;
        if (inBar + durs[i] > L && durs[i] >= 4) sc -= 0.15 * durs[i]; // nota larga que cruza la barra
      });
      for (const a of acc) sc += 4 * metricWeight(a + s, ts);
      out.push({ s, v: sc / total });
    }
    return out;
  };
  const cands = opts.ts ? [opts.ts] : [TIME_SIGS[0], TIME_SIGS[1], TIME_SIGS[3], TIME_SIGS[4]];
  const TS_PRIOR: Record<string, number> = { "4/4": 1, "3/4": 0.98, "6/8": 0.97, "3/8": 0.88, "2/4": 0.95 };
  let bestTs = cands[0], bestZ = -Infinity;
  const byTs = new Map<TimeSig, { s: number; v: number }[]>();
  for (const ts of cands) {
    const ps = phaseScores(ts);
    byTs.set(ts, ps);
    const mean = ps.reduce((a, p) => a + p.v, 0) / ps.length;
    // Contraste: cuánto destaca la mejor colocación de las barras frente a una cualquiera
    // Un compás de menos de medio segundo es raro: se penaliza (Noche de paz → 6/8, no 3/8)
    const barSec = (barLen(ts) * 60) / g.bpm / 4;
    // Sin bajo que marque cada compás, 3/8 y 6/8 se confunden: se prefiere 6/8, que es lo habitual
    const shortBar = tsLabel(ts) === "3/8" && !acc.length ? 0.7 : 1;
    const z = (Math.max(...ps.map((p) => p.v)) - mean) * (TS_PRIOR[tsLabel(ts)] ?? 1) * Math.min(1, barSec / 0.5) * shortBar;
    if (z > bestZ) { bestZ = z; bestTs = ts; }
  }
  // Fase: sin anacrusa salvo que la haya clara (corta: como mucho un pulso)
  const L = barLen(bestTs), beat = beatLen(bestTs);
  let bestShift = 0, bestV = -Infinity;
  for (const p of byTs.get(bestTs)!) {
    const pickLen = p.s ? L - p.s : 0;
    const pickNotes = q.map((x, i) => (x + p.s < L ? durs[i] : 0)).filter(Boolean);
    const shortPick = pickLen <= beat && pickNotes.every((d) => d <= beat);
    const v = p.v - (p.s === 0 ? 0 : shortPick ? 0.02 : 0.12) - (p.s % 2 ? 0.05 : 0);
    if (v > bestV) { bestV = v; bestShift = p.s; }
  }
  // La última nota llega, como mucho, hasta el final del pulso o del compás si le falta poco
  const lastI = durs.length - 1;
  if (lastI >= 0) {
    const endPos = q[lastI] + bestShift + durs[lastI];
    const toBar = (L - (endPos % L)) % L, toBeat = (beat - (endPos % beat)) % beat;
    if (toBar && toBar <= Math.max(2, Math.round(durs[lastI] * 0.3))) durs[lastI] += toBar;
    else if (toBeat && toBeat <= 2) durs[lastI] += toBeat;
  }
  const notes: QNote[] = raw.map((r, i) => ({ id: nid(), midi: r.midi, start: q[i] + bestShift, dur: durs[i], vel: r.vel, raw: i }));
  return { notes, bpm, ts: bestTs, pickup: bestShift, tempoFit: est.fit };
}

export function scoreLength(notes: QNote[], ts: TimeSig): number {
  const L = barLen(ts);
  const end = notes.reduce((m, n) => Math.max(m, n.start + n.dur), 0);
  return Math.max(L, Math.ceil(end / L) * L);
}

// ---------- Duraciones representables ----------
export const VALUES = [16, 12, 8, 6, 4, 3, 2, 1];
export const VALUE_NAME: Record<number, string> = {
  16: "redonda", 12: "blanca con puntillo", 8: "blanca", 6: "negra con puntillo", 4: "negra", 3: "corchea con puntillo", 2: "corchea", 1: "semicorchea",
};
export function durationName(d: number): string {
  if (VALUE_NAME[d]) return VALUE_NAME[d];
  return splitValues(d, 0, 16).map((v) => VALUE_NAME[v]).join(" + ");
}
/** Descompone una duración en figuras, respetando el pulso cuando la nota empieza a contratiempo. */
export function splitValues(len: number, startInBar: number, beat: number): number[] {
  const out: number[] = [];
  let pos = startInBar, rest = len;
  while (rest > 0) {
    // Si estamos a contratiempo, llega primero hasta el siguiente pulso
    const toBeat = pos % beat ? beat - (pos % beat) : Infinity;
    let v = VALUES.find((x) => x <= rest && (toBeat === Infinity || x <= toBeat)) ?? 1;
    // Una figura que empieza en el pulso y no cabe en la mitad del compás se queda como está
    if (toBeat !== Infinity && VALUES.includes(rest) && rest <= toBeat) v = rest;
    out.push(v); pos += v; rest -= v;
  }
  return out;
}

// ---------- Acordes ----------
export const QUALITY_INTERVALS: Record<Quality, number[]> = { maj: [0, 4, 7], min: [0, 3, 7], dim: [0, 3, 6], "7": [0, 4, 7, 10] };
type Cand = { r: number; q: Quality; roman: string; prior: number };
const CANDS: Record<Mode, Cand[]> = {
  major: [
    { r: 0, q: "maj", roman: "I", prior: 0.15 }, { r: 2, q: "min", roman: "ii", prior: 0 }, { r: 4, q: "min", roman: "iii", prior: -0.1 },
    { r: 5, q: "maj", roman: "IV", prior: 0.08 }, { r: 7, q: "maj", roman: "V", prior: 0.1 }, { r: 7, q: "7", roman: "V7", prior: 0.02 },
    { r: 9, q: "min", roman: "vi", prior: 0.03 }, { r: 11, q: "dim", roman: "vii°", prior: -0.3 },
  ],
  minor: [
    { r: 0, q: "min", roman: "i", prior: 0.15 }, { r: 5, q: "min", roman: "iv", prior: 0.06 }, { r: 7, q: "maj", roman: "V", prior: 0.08 },
    { r: 7, q: "7", roman: "V7", prior: 0.02 }, { r: 3, q: "maj", roman: "III", prior: 0.02 }, { r: 8, q: "maj", roman: "VI", prior: 0.03 },
    { r: 10, q: "maj", roman: "VII", prior: 0.02 }, { r: 7, q: "min", roman: "v", prior: -0.1 }, { r: 2, q: "dim", roman: "ii°", prior: -0.3 },
  ],
};
const TRANS: Record<string, Record<string, number>> = {
  I: { IV: 0.08, V: 0.08, vi: 0.08, ii: 0.05, V7: 0.06 }, i: { iv: 0.08, V: 0.08, VI: 0.08, V7: 0.06, VII: 0.05, III: 0.04 },
  V: { I: 0.4, i: 0.4, vi: 0.1, VI: 0.1, IV: -0.15, iv: -0.15, V7: 0.1 }, V7: { I: 0.45, i: 0.45, vi: 0.1, VI: 0.1, IV: -0.2, iv: -0.2 },
  IV: { V: 0.25, V7: 0.25, I: 0.15, ii: 0.05 }, iv: { V: 0.25, V7: 0.25, i: 0.15 },
  ii: { V: 0.3, V7: 0.35 }, "ii°": { V: 0.3, V7: 0.35 },
  vi: { ii: 0.15, IV: 0.15, V: 0.05 }, VI: { iv: 0.15, V: 0.12, "ii°": 0.1, VII: 0.1 },
  iii: { vi: 0.15, IV: 0.1 }, III: { VI: 0.12, iv: 0.12, VII: 0.08 }, VII: { III: 0.12, i: 0.1 }, v: { i: 0.1, VI: 0.1 },
};

export function harmonize(notes: QNote[], key: Key, ts: TimeSig, perBar: 1 | 2, total: number): ChordEvent[] {
  const L = barLen(ts);
  const segLen = perBar === 2 && L % 2 === 0 && L >= 8 ? L / 2 : L;
  const nSeg = Math.max(1, Math.ceil(total / segLen));
  const cands = CANDS[key.mode];
  const scores: number[][] = [];
  const hasNotes: boolean[] = [];
  for (let s = 0; s < nSeg; s++) {
    const a = s * segLen, b = a + segLen;
    let wsum = 0;
    const row = cands.map(() => 0);
    for (const n of notes) {
      const ov = Math.min(b, n.start + n.dur) - Math.max(a, n.start);
      if (ov <= 0) continue;
      const startsHere = n.start >= a;
      let w = ov * (startsHere ? 1 : 0.8);
      if (startsHere) w *= n.start === a ? 1.6 : n.start % beatLen(ts) === 0 ? 1.15 : 0.85;
      const short = n.dur <= 2 && n.start % 2 === 1;
      wsum += w;
      cands.forEach((c, ci) => {
        const iv = (((n.midi - key.tonic - c.r) % 12) + 24) % 12;
        const ints = QUALITY_INTERVALS[c.q];
        if (ints.includes(iv)) row[ci] += w * (iv === 0 ? 1.1 : iv === 10 ? 1.05 : 1);
        else row[ci] -= w * (short ? 0.25 : 0.6);
      });
    }
    hasNotes.push(wsum > 0);
    scores.push(row.map((v, ci) => (wsum ? v / wsum : 0) + cands[ci].prior * (wsum ? 1 : 0.2)));
  }
  // Viterbi
  const N = cands.length;
  const dp: number[][] = [], bp: number[][] = [];
  for (let s = 0; s < nSeg; s++) {
    dp.push(new Array(N).fill(-Infinity)); bp.push(new Array(N).fill(0));
    for (let j = 0; j < N; j++) {
      let local = scores[s][j];
      if (s === 0) local += cands[j].roman === "I" || cands[j].roman === "i" ? 0.2 : 0;
      if (s === nSeg - 1) local += cands[j].roman === "I" || cands[j].roman === "i" ? 0.45 : 0;
      if (s === 0) { dp[s][j] = local; continue; }
      for (let k = 0; k < N; k++) {
        const same = k === j ? (hasNotes[s] ? 0.04 : 0.6) : 0;
        const t = (TRANS[cands[k].roman]?.[cands[j].roman] ?? 0) + same;
        const v = dp[s - 1][k] + t + local;
        if (v > dp[s][j]) { dp[s][j] = v; bp[s][j] = k; }
      }
    }
  }
  let j = 0;
  for (let k = 1; k < N; k++) if (dp[nSeg - 1][k] > dp[nSeg - 1][j]) j = k;
  const path: number[] = new Array(nSeg);
  for (let s = nSeg - 1; s >= 0; s--) { path[s] = j; j = bp[s][j]; }
  // Agrupa segmentos iguales seguidos dentro del mismo compás
  const evs: ChordEvent[] = [];
  path.forEach((ci, s) => {
    const c = cands[ci];
    const chord: Chord = { root: (key.tonic + c.r) % 12, q: c.q, roman: c.roman };
    const last = evs[evs.length - 1];
    const start = s * segLen;
    if (last && last.chord.roman === chord.roman && Math.floor(last.start / L) === Math.floor(start / L)) last.dur += segLen;
    else evs.push({ start, dur: segLen, chord });
  });
  return evs;
}

export function chordSymbol(c: { root: number; q: Quality }, key: Key, naming: Naming): string {
  const s = spell(60 + c.root, key);
  const root = letterName(s.letter, s.alter, naming);
  const suf = naming === "es" ? { maj: "", min: "m", dim: "dim", "7": "7" }[c.q] : { maj: "", min: "m", dim: "dim", "7": "7" }[c.q];
  return root + suf;
}
export function chordLongName(c: { root: number; q: Quality }, key: Key): string {
  const s = spell(60 + c.root, key);
  const root = letterName(s.letter, s.alter, "es");
  return root + " " + { maj: "mayor", min: "menor", dim: "disminuido", "7": "séptima (dominante)" }[c.q];
}
export function chordNotes(c: { root: number; q: Quality }, key: Key, naming: Naming): string[] {
  return QUALITY_INTERVALS[c.q].map((iv) => { const s = spell(60 + c.root + iv, key); return letterName(s.letter, s.alter, naming); });
}
/** Acorde para la mano izquierda del piano (fundamental en la octava 3). */
export function pianoVoicing(c: { root: number; q: Quality }): number[] {
  const base = 48 + c.root;
  return QUALITY_INTERVALS[c.q].map((iv) => base + iv);
}

// ---------- Guitarra ----------
export const GUITAR_OPEN = [40, 45, 50, 55, 59, 64]; // cuerda 6 (Mi grave) → cuerda 1 (Mi agudo)
export const STRING_NAMES_ES = ["Mi", "La", "Re", "Sol", "Si", "Mi"];
export const STRING_NAMES_EN = ["E", "A", "D", "G", "B", "e"];
export type Shape = { frets: number[]; fingers: number[]; barre?: { fret: number; from: number; to: number }; name: string; kind: "open" | "barre" | "movable" };

const OPEN_SHAPES: Record<string, { frets: number[]; fingers: number[] }> = {
  "0maj": { frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0] },
  "07": { frets: [-1, 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0] },
  "2maj": { frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2] },
  "27": { frets: [-1, -1, 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3] },
  "2min": { frets: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1] },
  "4maj": { frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0] },
  "47": { frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0] },
  "4min": { frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0] },
  "7maj": { frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3] },
  "77": { frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1] },
  "9maj": { frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0] },
  "97": { frets: [-1, 0, 2, 0, 2, 0], fingers: [0, 0, 2, 0, 3, 0] },
  "9min": { frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0] },
  "117": { frets: [-1, 2, 1, 2, 0, 2], fingers: [0, 2, 1, 3, 0, 4] },
};
export function guitarShape(root: number, q: Quality): Shape {
  const pc = ((root % 12) + 12) % 12;
  const open = OPEN_SHAPES[`${pc}${q}`];
  if (open) return { ...open, name: "", kind: "open" };
  if (q === "dim") {
    const r = (pc - 9 + 12) % 12;
    return { frets: [-1, r, r + 1, r + 2, r + 1, -1], fingers: r ? [0, 1, 2, 4, 3, 0] : [0, 0, 1, 3, 2, 0], name: "", kind: "movable" };
  }
  const e = (pc - 4 + 12) % 12 || 12, a = (pc - 9 + 12) % 12 || 12;
  const useE = e <= a;
  const r = useE ? e : a;
  if (useE) {
    const frets = q === "maj" ? [r, r + 2, r + 2, r + 1, r, r] : q === "min" ? [r, r + 2, r + 2, r, r, r] : [r, r + 2, r, r + 1, r, r];
    const fingers = q === "maj" ? [1, 3, 4, 2, 1, 1] : q === "min" ? [1, 3, 4, 1, 1, 1] : [1, 3, 1, 2, 1, 1];
    return { frets, fingers, barre: { fret: r, from: 0, to: 5 }, name: "", kind: "barre" };
  }
  const frets = q === "maj" ? [-1, r, r + 2, r + 2, r + 2, r] : q === "min" ? [-1, r, r + 2, r + 2, r + 1, r] : [-1, r, r + 2, r, r + 2, r];
  const fingers = q === "maj" ? [0, 1, 2, 3, 4, 1] : q === "min" ? [0, 1, 3, 4, 2, 1] : [0, 1, 3, 1, 4, 1];
  return { frets, fingers, barre: { fret: r, from: 1, to: 5 }, name: "", kind: "barre" };
}
export const shapeDifficulty = (s: Shape) => (s.kind === "open" ? 1 : s.kind === "movable" ? 2 : 3);
/** Cejilla: traste que hace los acordes más fáciles (formas abiertas). */
export function suggestCapo(chords: { root: number; q: Quality }[]): { capo: number; cost: number; base: number } {
  const uniq = Array.from(new Map(chords.map((c) => [`${c.root}${c.q}`, c])).values());
  const cost = (capo: number) => uniq.reduce((s, c) => s + shapeDifficulty(guitarShape(c.root - capo, c.q)), 0);
  const base = cost(0);
  let best = 0, bestC = base;
  for (let c = 1; c <= 7; c++) { const v = cost(c) + c * 0.15; if (v < bestC - 0.9) { best = c; bestC = v; } }
  return { capo: best, cost: bestC, base };
}
/** Notas reales (MIDI) de una forma de acorde, de grave a agudo. */
export function shapeMidis(s: Shape, capo = 0): number[] {
  return s.frets.map((f, i) => (f < 0 ? -1 : GUITAR_OPEN[i] + f + capo)).filter((m) => m >= 0);
}

// ---------- Tablatura (melodía) ----------
export type TabPos = { string: number; fret: number }; // string 0 = 6ª (Mi grave) … 5 = 1ª (Mi agudo)
export function tabFor(midis: number[], capo = 0, maxFret = 15): { pos: (TabPos | null)[]; shift: number } {
  if (!midis.length) return { pos: [], shift: 0 };
  let best: { pos: (TabPos | null)[]; shift: number; cost: number } | null = null;
  for (const shift of [0, -12, 12, -24, 24]) {
    const ms = midis.map((m) => m + shift);
    const opts = ms.map((m) => {
      const o: TabPos[] = [];
      GUITAR_OPEN.forEach((op, s) => { const f = m - op - capo; if (f >= 0 && f <= maxFret) o.push({ string: s, fret: f }); });
      return o;
    });
    const missing = opts.filter((o) => !o.length).length;
    // DP
    const prevCost: number[][] = [];
    const back: number[][] = [];
    let prevPos: TabPos[] = [];
    for (let i = 0; i < opts.length; i++) {
      const o = opts[i];
      const row: number[] = [], brow: number[] = [];
      if (!o.length) { prevCost.push(i ? [Math.min(...(prevCost[i - 1].length ? prevCost[i - 1] : [0]))] : [0]); back.push([0]); prevPos = []; continue; }
      o.forEach((p) => {
        const local = p.fret * 0.07 + (p.fret === 0 ? -0.1 : 0) + (p.string <= 1 ? 0.15 : 0);
        if (!i || !prevPos.length) { row.push(local + (i ? prevCost[i - 1][0] : 0)); brow.push(0); return; }
        let bc = Infinity, bk = 0;
        prevPos.forEach((q, k) => {
          let move = 0;
          if (p.fret > 0 && q.fret > 0) move = Math.max(0, Math.abs(p.fret - q.fret) - 3) * 1.2;
          else if (p.fret > 0 && q.fret === 0) move = Math.max(0, p.fret - 4) * 0.3;
          move += Math.abs(p.string - q.string) > 1 ? 0.25 * (Math.abs(p.string - q.string) - 1) : 0;
          const c = prevCost[i - 1][k] + move + local;
          if (c < bc) { bc = c; bk = k; }
        });
        row.push(bc); brow.push(bk);
      });
      prevCost.push(row); back.push(brow); prevPos = o;
    }
    const last = prevCost[prevCost.length - 1];
    let k = last.indexOf(Math.min(...last));
    const pos: (TabPos | null)[] = new Array(opts.length).fill(null);
    for (let i = opts.length - 1; i >= 0; i--) {
      if (opts[i].length) { pos[i] = opts[i][k]; k = back[i][k]; } else k = 0;
    }
    const cost = Math.min(...last) + missing * 50 + Math.abs(shift) * 0.01;
    if (!best || cost < best.cost) best = { pos, shift, cost };
  }
  return { pos: best!.pos, shift: best!.shift };
}

// ---------- Digitación de piano (mano derecha) ----------
// [MinPrac, MinComf, MinRel, MaxRel, MaxComf, MaxPrac] en semitonos (modelo de Parncutt, simplificado)
const SPAN: Record<string, number[]> = {
  "12": [-5, -3, 1, 5, 8, 10], "13": [-4, -2, 3, 7, 10, 12], "14": [-3, -1, 5, 9, 12, 14], "15": [-1, 1, 7, 10, 13, 15],
  "23": [1, 1, 1, 2, 3, 5], "24": [1, 1, 3, 4, 5, 7], "25": [2, 2, 5, 6, 8, 10], "34": [1, 1, 1, 2, 2, 4], "35": [1, 1, 3, 4, 5, 7], "45": [1, 1, 1, 2, 3, 5],
};
const isBlack = (m: number) => [1, 3, 6, 8, 10].includes(((m % 12) + 12) % 12);
export { isBlack };
function pairCost(p1: number, f1: number, p2: number, f2: number): number {
  const d = p2 - p1;
  if (f1 === f2) return d === 0 ? 0.3 : 8;
  const lo = Math.min(f1, f2), hi = Math.max(f1, f2);
  const sp = SPAN[`${lo}${hi}`];
  const iv = f1 < f2 ? d : -d; // distancia del dedo bajo al dedo alto
  let c = 0;
  if (iv > sp[4]) c += 2 * (iv - sp[4]); else if (iv < sp[1]) c += 2 * (sp[1] - iv);
  if (iv > sp[3]) c += iv - sp[3]; else if (iv < sp[2]) c += sp[2] - iv;
  if (iv > sp[5] || iv < sp[0]) c += 10;
  // Pasar el pulgar o cruzar por encima
  if (iv < 0) c += lo === 1 ? 1 : 4;
  if (isBlack(p2) && f2 === 1) c += 1;
  if (isBlack(p2) && f2 === 5) c += 0.5;
  if ((f1 === 3 && f2 === 4) || (f1 === 4 && f2 === 3)) c += 0.5;
  return c;
}
export function pianoFingering(midis: number[]): number[] {
  if (!midis.length) return [];
  const n = midis.length;
  const cost: number[][] = [[0, 0.3, 0.2, 0.6, 0.5].map((v, f) => v + (isBlack(midis[0]) && f === 0 ? 1 : 0))];
  const back: number[][] = [[0, 0, 0, 0, 0]];
  for (let i = 1; i < n; i++) {
    const row: number[] = [], b: number[] = [];
    for (let f = 1; f <= 5; f++) {
      let bc = Infinity, bk = 0;
      for (let g = 1; g <= 5; g++) {
        const c = cost[i - 1][g - 1] + pairCost(midis[i - 1], g, midis[i], f);
        if (c < bc) { bc = c; bk = g - 1; }
      }
      row.push(bc); b.push(bk);
    }
    cost.push(row); back.push(b);
  }
  let k = cost[n - 1].indexOf(Math.min(...cost[n - 1]));
  const out = new Array(n);
  for (let i = n - 1; i >= 0; i--) { out[i] = k + 1; k = back[i][k]; }
  return out;
}

// ---------- Utilidades de tiempo ----------
export const q2s = (q: number, bpm: number) => (q * 60) / bpm / 4;
export function transposeNotes(notes: QNote[], semis: number): QNote[] {
  return notes.map((n) => ({ ...n, midi: n.midi + semis }));
}
export function transposeKey(k: Key, semis: number): Key { return { ...k, tonic: (((k.tonic + semis) % 12) + 12) % 12 }; }
