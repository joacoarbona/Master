/* ============================================================
   TARAREO · Análisis completo: voz o instrumento
   - Voz (tarareo, canto, silbido): una sola línea → YIN + segmentación.
   - Instrumento (piano, guitarra…): puede haber varias notas a la vez.
     1. Ataques: «spectral flux» (cuánto crece el espectro de un instante a otro).
     2. Notas nuevas en cada ataque: diferencia entre el espectro de después y el
        de antes, y suma de armónicos para cada nota candidata; se toma la mejor,
        se «explican» sus armónicos y se busca la siguiente (hasta 5).
     3. Melodía: la voz más aguda. Si hay acompañamiento (notas que suenan a la
        vez), se separan registros con 2 grupos (k-medias) y un hueco entre ellos.
   ============================================================ */
import { analyzeTrack, circularOffset, decimate, DEFAULT_SEG, midiToHz, normalize, segmentNotes, type RawNote, type SegmentOptions, type Track } from "./pitch";
import { magSpectrum } from "./fft";

export type Source = "auto" | "voz" | "instrumento";
export type InstOptions = { sensitivity: number; separate: "auto" | "si" | "no"; clarity?: number };
export const DEFAULT_INST: InstOptions = { sensitivity: 0.5, separate: "auto" };

export type AttackNote = { t: number; midi: number; midiF: number; sal: number; end: number; harmonic: boolean };
export type InstAnalysis = {
  notes: RawNote[]; offset: number; hop: number; contour: Float32Array; all: AttackNote[]; onsets: number[];
  polyIndex: number; decay: number; duration: number;
  /** Ataques del bajo (s): ayudan a colocar las barras de compás. */
  bass: number[];
  debug?: { t: number; split: number; sounding: string; attacked: string }[];
};
export type Analysis = {
  mode: "voz" | "instrumento"; notes: RawNote[]; offset: number;
  contour: { hop: number; midi: Float32Array }; track?: Track; inst?: InstAnalysis;
  why: string;
};

const N_A = 1024;   // STFT para ataques y seguimiento
const N_B = 4096;   // FFT (con ceros) para la altura en cada ataque

export async function analyzeInstrument(x0: Float32Array, sr0: number, opt: InstOptions = DEFAULT_INST, onProgress?: (p: number) => void): Promise<InstAnalysis> {
  const { y, sr: srD } = decimate(x0, sr0);
  const x = normalize(y);
  const sr = srD;
  const hop = Math.round(sr * 0.01);
  const nFr = Math.max(1, Math.floor((x.length - N_A) / hop) + 1);
  const binA = sr / N_A;
  const kLo = Math.max(1, Math.floor(50 / binA)), kHi = Math.min(N_A / 2, Math.floor(6000 / binA));
  // ---- 1. Espectrograma y función de ataques ----
  const mags: Float32Array[] = new Array(nFr);
  const re = new Float64Array(N_A), im = new Float64Array(N_A);
  const t0 = performance.now();
  for (let f = 0; f < nFr; f++) {
    mags[f] = magSpectrum(x, f * hop, N_A, N_A, re, im);
    if (f % 300 === 299 && performance.now() - t0 > 30) { onProgress?.(0.5 * f / nFr); await new Promise((r) => setTimeout(r, 0)); }
  }
  const L = (v: number) => Math.log(1 + 1000 * v);
  const odf = new Float32Array(nFr);
  for (let f = 1; f < nFr; f++) {
    const a = mags[f], b = mags[f - 1];
    let s = 0;
    for (let k = kLo; k < kHi; k++) {
      const prev = Math.max(b[k - 1], b[k], b[k + 1]); // filtro de máximo: ignora vibrato
      const d = L(a[k]) - L(prev);
      if (d > 0) s += d;
    }
    odf[f] = s;
  }
  const sorted = Array.from(odf).sort((p, q) => p - q);
  const ref = sorted[Math.floor(sorted.length * 0.995)] || 1;
  for (let f = 0; f < nFr; f++) odf[f] /= ref;
  const delta = 0.07 * (1.7 - opt.sensitivity * 1.4);
  const onsetFrames: number[] = [];
  for (let f = 2; f < nFr - 2; f++) {
    let isMax = true;
    for (let k = Math.max(0, f - 3); k <= Math.min(nFr - 1, f + 3); k++) if (odf[k] > odf[f]) { isMax = false; break; }
    if (!isMax) continue;
    let m = 0, c = 0;
    for (let k = Math.max(0, f - 12); k <= Math.min(nFr - 1, f + 6); k++) { m += odf[k]; c++; }
    m /= c;
    if (odf[f] < m + delta || odf[f] < 0.06) continue;
    if (onsetFrames.length && f - onsetFrames[onsetFrames.length - 1] < 4) {
      if (odf[f] > odf[onsetFrames[onsetFrames.length - 1]]) onsetFrames[onsetFrames.length - 1] = f;
      continue;
    }
    onsetFrames.push(f);
  }
  // El pico de flujo llega cuando el ataque está hacia el centro de la ventana
  const frameTime = (f: number) => (f * hop + N_A / 2) / sr;
  const onsets = onsetFrames.map((f) => frameTime(f) - 0.012);

  // ---- 2. Qué suena después de cada ataque y qué es nuevo ----
  const binB = sr / N_B;
  const reB = new Float64Array(N_B), imB = new Float64Array(N_B);
  const QT = Math.pow(2, 1 / 24);
  const peakVal = (arr: Float32Array, f: number) => {
    const lo = Math.max(1, Math.floor(f / QT / binB)), hi = Math.min(arr.length - 1, Math.ceil((f * QT) / binB));
    let m = 0;
    for (let k = lo; k <= hi; k++) if (arr[k] > m) m = arr[k];
    return m;
  };
  /** ¿Hay un pico de verdad (máximo local, no la falda de una nota vecina) cerca de f? */
  const isPeak = (arr: Float32Array, f: number) => {
    const lo = Math.max(2, Math.floor(f / QT / binB)), hi = Math.min(arr.length - 3, Math.ceil((f * QT) / binB));
    let kb = lo;
    for (let k = lo; k <= hi; k++) if (arr[k] > arr[kb]) kb = k;
    return arr[kb] > 0 && arr[kb] >= arr[kb - 1] && arr[kb] >= arr[kb + 1] && arr[kb] > arr[kb - 2] && arr[kb] > arr[kb + 2];
  };
  const P_LO = 36, P_HI = 100;
  type Est = AttackNote & { newness: number; amp: number };
  const perOnset: Est[][] = [];     // notas nuevas (atacadas) en cada ataque
  const sounding: Est[][] = [];     // todo lo que suena justo después
  const firstSal: number[] = [];
  for (let i = 0; i < onsets.length; i++) {
    const so = Math.round(onsets[i] * sr);
    const next = i + 1 < onsets.length ? Math.round(onsets[i + 1] * sr) : x.length;
    const W = Math.max(Math.round(0.03 * sr), Math.min(Math.round(0.1 * sr), next - so - Math.round(0.02 * sr)));
    const lobe = (2.2 * sr) / W; // medio ancho del lóbulo principal de Hann (Hz)
    const A = magSpectrum(x, so + Math.round(0.012 * sr), W, N_B, reB, imB);
    const Bf = magSpectrum(x, so - Math.round(0.006 * sr) - W, W, N_B, reB, imB);
    const R = A.slice();
    const found: Est[] = [];
    let S1 = 0;
    for (let iter = 0; iter < 6; iter++) {
      let best = -1, bestS = 0;
      for (let p = P_LO; p <= P_HI; p++) {
        const f = midiToHz(p);
        const H = Math.min(10, Math.floor((sr * 0.45) / f));
        if (H < 1) continue;
        let sum = 0, mx = 0;
        const a1 = peakVal(R, f);
        for (let h = 1; h <= H; h++) { const v = peakVal(R, h * f); sum += v / Math.pow(h, 0.7); if (v > mx) mx = v; }
        if (a1 < 0.15 * mx) continue; // sin fundamental: probablemente un armónico
        if (sum > bestS && isPeak(R, f)) { bestS = sum; best = p; }
      }
      if (best < 0) break;
      if (iter === 0) S1 = bestS;
      else if (bestS < 0.15 * S1) break;
      const f0 = midiToHz(best);
      const H = Math.floor((sr * 0.45) / f0); // se explican todos sus armónicos, no solo los 10 primeros
      const obs: number[] = [0];
      for (let h = 1; h <= H + 1; h++) obs.push(peakVal(R, h * f0));
      // ¿Es armónico (2.º…16.º) de una nota ya encontrada y más fuerte?
      const harmonic = found.some((n) => {
        const r = 12 * Math.log2(f0 / midiToHz(n.midi));
        if (r < 11.5) return false;
        const h = Math.round(Math.pow(2, r / 12));
        // solo si además es débil frente a la fundamental de esa nota (si queda mucha energía tras
        // restar sus armónicos esperados, es una nota real: la melodía en el 8.º armónico del bajo)
        return h >= 2 && h <= 16 && Math.abs(r - 12 * Math.log2(h)) < 0.45 && bestS < 0.6 * n.sal && obs[1] < 0.5 * n.amp;
      });
      // ¿Es nueva? Parte de su energía (8 primeros armónicos) que no estaba antes.
      // Una cuerda que se vuelve a pulsar cambia poco en los graves y mucho en los agudos.
      let num = 0, dn = 0;
      for (let h = 1; h <= Math.min(8, H); h++) { const a = peakVal(A, h * f0), b = peakVal(Bf, h * f0); num += Math.max(0, a - b); dn += a; }
      // y además su fundamental tiene que crecer (si no, lo «nuevo» son armónicos compartidos con otra nota)
      const fa = peakVal(A, f0), fb = peakVal(Bf, f0);
      const fundGrow = fa ? (fa - fb) / fa : 0;
      const newness = (dn ? num / dn : 0) * (fundGrow < 0.2 ? 0.4 : 1);
      // Altura fina: pico interpolado
      let kb = Math.round(f0 / binB);
      for (let k = Math.max(1, Math.floor(f0 / QT / binB)); k <= Math.ceil((f0 * QT) / binB) && k < A.length - 1; k++) if (A[k] > A[kb]) kb = k;
      let fr = kb;
      const y1 = A[kb - 1], y2 = A[kb], y3 = A[kb + 1], den = y1 - 2 * y2 + y3;
      if (den < 0) fr = kb + (0.5 * (y1 - y3)) / den;
      const midiF = 69 + 12 * Math.log2((fr * binB) / 440);
      found.push({ t: onsets[i], midi: best, midiF: Math.abs(midiF - best) < 0.6 ? midiF : best, sal: bestS, end: onsets[i] + 0.3, harmonic, newness, amp: obs[1] });
      // Se quita la nota del residuo con «suavidad espectral»: en un armónico compartido
      // solo se resta lo que corresponde a la envolvente, el resto queda para la otra nota.
      for (let h = 1; h <= H; h++) {
        const env = h === 1 ? obs[1] : h === H ? obs[h - 1] : (obs[h - 1] + obs[h + 1]) / 2;
        const est = h === 1 ? Infinity : Math.min(obs[h], env * 1.15);
        // centrado en el pico real (afinación distinta de 440, inarmonicidad del piano)
        let fh = h * f0;
        {
          const lo0 = Math.max(1, Math.floor(fh / QT / binB)), hi0 = Math.min(R.length - 2, Math.ceil((fh * QT) / binB));
          let kp = lo0;
          for (let k = lo0; k <= hi0; k++) if (R[k] > R[kp]) kp = k;
          if (R[kp] > 0) fh = kp * binB;
        }
        const wdt = Math.max(fh * (QT - 1), lobe);
        const lo = Math.max(1, Math.floor((fh - wdt) / binB)), hi = Math.min(R.length - 1, Math.ceil((fh + wdt) / binB));
        for (let k = lo; k <= hi; k++) {
          // la falda del lóbulo baja con la distancia: se resta proporcionalmente
          const w = Math.max(0, 1 - Math.abs(k * binB - fh) / (wdt * 1.05));
          R[k] = Math.max(0, R[k] - (est === Infinity ? R[k] : est * Math.max(w, Math.abs(k * binB - fh) < fh * (QT - 1) ? 1 : 0)));
        }
      }
    }
    const real = found.filter((n) => !n.harmonic);
    let attacked = real.filter((n) => n.newness >= 0.35);
    if (!attacked.length && real.length) {
      const b = real.reduce((a, q) => (q.newness > a.newness ? q : a));
      if (b.newness >= 0.15) attacked = [b];
    }
    if (attacked.length) firstSal.push(Math.max(...attacked.map((n) => n.sal)));
    perOnset.push(attacked);
    sounding.push(real);
    if (i % 40 === 39) { onProgress?.(0.5 + 0.4 * i / onsets.length); await new Promise((r) => setTimeout(r, 0)); }
  }
  // Ataques demasiado débiles (ruido) fuera
  const fs = [...firstSal].sort((a, b) => a - b);
  const salRef = fs[Math.floor(fs.length * 0.9)] || 1;
  perOnset.forEach((arr, i) => { perOnset[i] = arr.filter((n) => n.sal >= 0.08 * salRef); });

  // ---- 3. Cuánto dura cada nota (seguimiento de su fundamental) ----
  const energyAt = (f: number, midi: number) => {
    const m = mags[f], fr = midiToHz(midi);
    const k = Math.round(fr / binA), k2 = Math.round((2 * fr) / binA);
    let e = 0;
    for (let q = Math.max(1, k - 1); q <= Math.min(m.length - 1, k + 1); q++) e = Math.max(e, m[q]);
    let e2 = 0;
    for (let q = Math.max(1, k2 - 1); q <= Math.min(m.length - 1, k2 + 1); q++) e2 = Math.max(e2, m[q]);
    return e + 0.5 * e2;
  };
  const frameOf = (t: number) => Math.max(0, Math.min(nFr - 1, Math.round((t * sr - N_A / 2) / hop)));
  const decays: number[] = [];
  const all: AttackNote[] = [];
  perOnset.forEach((arr, i) => {
    arr.forEach((n, ni) => {
      const f0 = frameOf(n.t);
      let pk = 0, pf = f0;
      for (let f = f0; f <= Math.min(nFr - 1, f0 + 8); f++) { const e = energyAt(f, n.midi); if (e > pk) { pk = e; pf = f; } }
      let nextSame = Infinity;
      for (let j = i + 1; j < perOnset.length; j++) if (perOnset[j].some((q) => q.midi === n.midi)) { nextSame = onsets[j]; break; }
      let end = Math.min(nextSame, n.t + 4);
      for (let f = pf + 1; f < nFr; f++) {
        const t = frameTime(f);
        if (t >= end) break;
        if (energyAt(f, n.midi) < 0.12 * pk) { end = t; break; }
      }
      n.end = Math.max(n.t + 0.05, end);
      if (ni === 0 && (onsets[i + 1] === undefined || onsets[i + 1] - n.t > 0.3)) {
        decays.push(pk ? energyAt(frameOf(n.t + 0.25), n.midi) / pk : 1);
      }
      all.push(n);
    });
  });
  const decay = decays.length ? [...decays].sort((a, b) => a - b)[decays.length >> 1] : 1;

  // ---- 4. ¿Hay acompañamiento? (dos o más notas claras sonando a la vez) ----
  let polyCount = 0, withNotes = 0;
  sounding.forEach((arr) => {
    if (!arr.length) return;
    withNotes++;
    const top = Math.max(...arr.map((n) => n.sal));
    if (arr.filter((n) => n.sal >= 0.3 * top).length >= 2) polyCount++;
  });
  const polyIndex = withNotes ? polyCount / withNotes : 0;
  // Con una sola línea (piano sin acompañamiento) la nota anterior aún suena al atacar la siguiente;
  // la claridad del tono (YIN) distingue eso de un acompañamiento de verdad.
  const separate = opt.separate === "si" || (opt.separate === "auto" && polyIndex >= 0.4 && ((opt.clarity ?? 0) < 0.85 || polyIndex >= 0.8));

  // Frontera de registros alrededor de un instante (notas atacadas en ±2,5 s):
  //  a) k-medias con 2 grupos (mano izquierda / mano derecha);
  //  b) apartando antes el bajo (pocas notas muy graves): si entonces la mayoría queda
  //     por debajo, es una melodía escasa sobre un arpegio denso (guitarra clásica) y vale b.
  const kSplit = (ps: number[]): { split: number; lowFrac: number } | null => {
    if (ps.length < 4) return null;
    let c1 = Math.min(...ps), c2 = Math.max(...ps);
    for (let it = 0; it < 12; it++) {
      let s1 = 0, n1 = 0, s2 = 0, n2 = 0;
      for (const p of ps) { if (Math.abs(p - c1) <= Math.abs(p - c2)) { s1 += p; n1++; } else { s2 += p; n2++; } }
      if (!n1 || !n2) return null;
      c1 = s1 / n1; c2 = s2 / n2;
    }
    const lowFrac = ps.filter((p) => Math.abs(p - c1) <= Math.abs(p - c2)).length / ps.length;
    if (c2 - c1 < 6 || lowFrac < 0.12 || lowFrac > 0.88) return null;
    const b = (c1 + c2) / 2;
    const uniq = Array.from(new Set(ps)).sort((a, b2) => a - b2);
    let bestGap = 0, split = b;
    for (let i = 0; i + 1 < uniq.length; i++) {
      const mid = (uniq[i] + uniq[i + 1]) / 2, gap = uniq[i + 1] - uniq[i];
      if (Math.abs(mid - b) <= 4 && gap > bestGap) { bestGap = gap; split = mid; }
    }
    return { split, lowFrac };
  };
  const splitAt = (t: number): number => {
    const ps = all.filter((n) => Math.abs(n.t - t) <= 2.5).map((n) => n.midi);
    const a = kSplit(ps);
    const uniq = Array.from(new Set(ps)).sort((x2, y2) => x2 - y2);
    for (let i = 0; i + 1 < uniq.length; i++) {
      if (uniq[i + 1] - uniq[i] < 7) continue;
      const below = ps.filter((p) => p <= uniq[i]).length;
      if (below / ps.length >= 0.35) break;
      const rest = ps.filter((p) => p > uniq[i]);
      const b = kSplit(rest);
      if (b && b.lowFrac >= 0.5) return b.split;
      // Si la melodía va grave y se acerca al relleno, k-medias los mezcla: se busca entonces un
      // hueco claro (≥ 4 semitonos) que deje debajo al menos el 60 % de las notas.
      const ur = Array.from(new Set(rest)).sort((x2, y2) => x2 - y2);
      let gBest = 0, gSplit = NaN;
      for (let j = 0; j + 1 < ur.length; j++) {
        const gap = ur[j + 1] - ur[j];
        const lf = rest.filter((p) => p <= ur[j]).length / rest.length;
        if (gap >= 4 && lf >= 0.6 && lf <= 0.9 && gap >= gBest) { gBest = gap; gSplit = (ur[j] + ur[j + 1]) / 2; }
      }
      if (Number.isFinite(gSplit)) return gSplit;
      break;
    }
    return a ? a.split : -Infinity;
  };

  // ---- 5. Melodía: la voz más aguda de cada ataque ----
  type M = { t: number; midiF: number; midi: number; sal: number; end: number };
  const mel: M[] = [];
  const debug: NonNullable<InstAnalysis["debug"]> = [];
  perOnset.forEach((cands, i) => {
    if (!cands.length) return;
    let pool: Est[] = cands;
    if (separate) {
      const sp = splitAt(cands[0].t);
      debug.push({ t: cands[0].t, split: sp, sounding: sounding[i].map((n) => `${n.midi}:${n.sal.toFixed(3)}`).join(" "), attacked: cands.map((n) => `${n.midi}:${n.sal.toFixed(3)}`).join(" ") });
      const top = Math.max(...sounding[i].map((n) => n.sal), 1e-9);
      pool = cands.filter((n) => {
        if (n.midi >= sp) return true;
        // Por debajo de la frontera es acompañamiento si sigue sonando una nota aguda
        // (atacada antes y aún con energía) o si suena claramente a la vez.
        // (la melodía «sigue activa»: hubo una nota aguda hace menos de 1 s, aunque ya se apague)
        const ringing = all.some((u) => u.midi >= sp && u.midi > n.midi && u.t < n.t - 0.02 && (u.end > n.t + 0.03 || n.t - u.t < 1.0));
        const together = sounding[i].some((q) => q !== n && q.midi >= sp && q.midi > n.midi && q.sal >= 0.25 * top);
        // Excepción: nota justo bajo la frontera que sube hacia la melodía (arpegio de la mano derecha)
        const nxt = perOnset.slice(i + 1).find((arr) => arr.length);
        const nextTop = nxt && nxt[0].t - n.t < 0.6 ? Math.max(...nxt.map((q) => q.midi)) : -Infinity;
        const climbs = sp - n.midi <= 4 && nextTop >= sp && nextTop - n.midi <= 7 && nextTop > n.midi;
        return climbs || (!ringing && !together);
      });
    }
    if (!pool.length) return;
    const loud = Math.max(...pool.map((n) => n.sal));
    pool = pool.filter((n) => n.sal >= 0.2 * loud);
    const top = pool.reduce((a, b) => (b.midi > a.midi ? b : a));
    const last = mel[mel.length - 1];
    if (last && top.t - last.t < 0.04) { if (top.sal > last.sal) mel[mel.length - 1] = { ...top }; return; }
    mel.push({ t: top.t, midiF: top.midiF, midi: top.midi, sal: top.sal, end: top.end });
  });
  // Con acompañamiento, una nota suelta muy por debajo de sus vecinas es el bajo colado (se perdió el ataque de la melodía)
  if (separate) {
    for (let i = mel.length - 2; i >= 1; i--) {
      if (mel[i].midi < Math.min(mel[i - 1].midi, mel[i + 1].midi) - 12) mel.splice(i, 1);
    }
  }
  const offset = circularOffset(mel.map((m) => m.midiF), mel.map(() => 1));
  const salMax = Math.max(1e-9, ...mel.map((m) => m.sal));
  // En piano y guitarra la nota se apaga sola: en la partitura dura hasta la siguiente de la melodía,
  // salvo que haya un hueco largo de verdad (más de 2,5 veces lo habitual).
  const iois = mel.slice(1).map((m, i) => m.t - mel[i].t).sort((a, b) => a - b);
  const medIoi = iois.length ? iois[iois.length >> 1] : 0.5;
  const notes: RawNote[] = mel.map((m, i) => {
    const nx = mel[i + 1];
    let end = nx ? nx.t : Math.max(m.end, m.t + medIoi);
    if (nx && nx.t - m.t > Math.max(1.2, 2.5 * medIoi) && m.end < nx.t - 0.12) end = m.end; // silencio de verdad
    const corr = m.midiF - offset;
    const mi = Math.round(corr);
    return { start: m.t, end, midiF: m.midiF, midi: mi, cents: Math.round((corr - mi) * 100), conf: 1, vel: Math.min(1, m.sal / salMax), split: "start" };
  });
  const contour = new Float32Array(nFr).fill(NaN);
  notes.forEach((n) => { for (let f = frameOf(n.start); f <= frameOf(n.end) && f < nFr; f++) contour[f] = n.midiF; });
  onProgress?.(1);
  // Bajo: notas atacadas muy por debajo de la melodía (al menos una octava) y graves
  const melMed = notes.length ? [...notes.map((n) => n.midi)].sort((a, b) => a - b)[notes.length >> 1] : 60;
  const bass = separate ? all.filter((n) => n.midi <= Math.min(52, melMed - 12)).map((n) => n.t) : [];
  return { notes, offset, hop: hop / sr, contour, all, onsets, polyIndex, decay, duration: x.length / sr, bass, debug };
}

/** Claridad del tono (YIN) en los instantes con volumen: alta en una voz, baja si hay varias notas. */
export function clarity(tr: Track): number {
  const r = Array.from(tr.rms).sort((a, b) => a - b);
  const ref = r[Math.floor(r.length * 0.97)] || 0;
  const cs: number[] = [];
  for (let i = 0; i < tr.rms.length; i++) if (tr.rms[i] >= 0.25 * ref) cs.push(tr.conf[i]);
  cs.sort((a, b) => a - b);
  return cs.length ? cs[cs.length >> 1] : 0;
}

export type Both = { voz: Analysis; instrumento: Analysis; chosen: "voz" | "instrumento"; why: string; features: { decay: number; poly: number; clarity: number } };

/** Analiza como voz y como instrumento y elige (o respeta lo que diga el usuario). */
export async function analyzeBoth(pcm: Float32Array, sr: number, o: { source?: Source; seg?: SegmentOptions; inst?: InstOptions; onProgress?: (p: number) => void } = {}): Promise<Both> {
  const prog = o.onProgress;
  const tr = await analyzeTrack(pcm, sr, prog ? (p) => prog(p * 0.35) : undefined);
  const sg = segmentNotes(tr, o.seg ?? DEFAULT_SEG);
  const cl = clarity(tr);
  const inst = await analyzeInstrument(pcm, sr, { ...(o.inst ?? DEFAULT_INST), clarity: cl }, prog ? (p) => prog(0.35 + p * 0.65) : undefined);
  const voz: Analysis = { mode: "voz", notes: sg.notes, offset: sg.offset, contour: { hop: tr.hop, midi: sg.midi }, track: tr, inst, why: "" };
  const ins: Analysis = { mode: "instrumento", notes: inst.notes, offset: inst.offset, contour: { hop: inst.hop, midi: inst.contour }, track: tr, inst, why: "" };
  // Voz: notas sostenidas y un solo tono claro. Piano y guitarra: cada nota se apaga sola tras el
  // ataque; con pedal o acompañamiento, varias notas a la vez y un tono menos «limpio».
  let chosen: "voz" | "instrumento", why: string;
  if (o.source === "voz" || o.source === "instrumento") { chosen = o.source; why = "elegido a mano"; }
  else if (inst.decay < 0.75) { chosen = "instrumento"; why = "las notas tienen ataque y se apagan solas, como en un piano o una guitarra"; }
  else if (inst.polyIndex >= 0.6 && cl < 0.85) { chosen = "instrumento"; why = "suenan varias notas a la vez (melodía con acompañamiento)"; }
  else { chosen = "voz"; why = "suena una sola línea sostenida, como una voz o un silbido"; }
  voz.why = chosen === "voz" ? why : ""; ins.why = chosen === "instrumento" ? why : "";
  return { voz, instrumento: ins, chosen, why, features: { decay: inst.decay, poly: inst.polyIndex, clarity: cl } };
}

/** Atajo: devuelve solo el análisis elegido. */
export async function analyzeAuto(pcm: Float32Array, sr: number, o: { source?: Source; seg?: SegmentOptions; inst?: InstOptions; onProgress?: (p: number) => void } = {}): Promise<Analysis & { features?: Both["features"] }> {
  const b = await analyzeBoth(pcm, sr, o);
  return { ...b[b.chosen], why: b.why, features: b.features };
}
