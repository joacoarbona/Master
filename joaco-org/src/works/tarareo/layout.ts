/* ============================================================
   TARAREO · Compases y figuras
   Convierte las notas cuantizadas en compases con figuras
   (negra, corchea…), ligaduras y silencios. Lo usan la partitura
   y la exportación MusicXML.
   ============================================================ */
import { barLen, beatLen, splitValues, type QNote, type TimeSig } from "./music";

export type Ev = {
  kind: "note" | "rest";
  pos: number;        // posición absoluta (semicorcheas)
  inBar: number;      // posición dentro del compás
  val: number;        // figura (16 redonda … 1 semicorchea)
  noteIdx: number;    // índice de la nota (−1 en silencios)
  first: boolean;     // primer trozo de la nota (lleva nombre y alteración)
  tieStart: boolean;  // ligada a la siguiente
  tieEnd: boolean;    // viene ligada de la anterior
  fullBar?: boolean;  // silencio de compás entero
};
export type Measure = { index: number; start: number; len: number; events: Ev[] };

/** Recorta solapamientos y ordena. */
export function cleanNotes(notes: QNote[]): QNote[] {
  const s = [...notes].sort((a, b) => a.start - b.start);
  return s.map((n, i) => {
    const nx = s[i + 1];
    return nx && n.start + n.dur > nx.start ? { ...n, dur: Math.max(1, nx.start - n.start) } : n;
  });
}

export function buildMeasures(notes: QNote[], ts: TimeSig, total: number): Measure[] {
  const L = barLen(ts), beat = beatLen(ts);
  // Línea de tiempo: tramos de nota o de silencio
  const spans: { a: number; b: number; idx: number }[] = [];
  let cur = 0;
  notes.forEach((n, i) => {
    if (n.start > cur) spans.push({ a: cur, b: n.start, idx: -1 });
    spans.push({ a: n.start, b: n.start + n.dur, idx: i });
    cur = n.start + n.dur;
  });
  if (cur < total) spans.push({ a: cur, b: total, idx: -1 });
  const measures: Measure[] = [];
  for (let m = 0; m * L < total; m++) measures.push({ index: m, start: m * L, len: L, events: [] });
  for (const sp of spans) {
    let a = sp.a;
    let first = true;
    while (a < sp.b) {
      const m = Math.floor(a / L);
      const barEnd = (m + 1) * L;
      const b = Math.min(sp.b, barEnd);
      const meas = measures[m];
      if (!meas) break;
      if (sp.idx < 0 && a === meas.start && b === barEnd) {
        meas.events.push({ kind: "rest", pos: a, inBar: 0, val: L, noteIdx: -1, first: true, tieStart: false, tieEnd: false, fullBar: true });
      } else {
        const vals = splitValues(b - a, a - meas.start, beat);
        let p = a;
        vals.forEach((v) => {
          const isLastPiece = p + v >= sp.b;
          meas.events.push({
            kind: sp.idx < 0 ? "rest" : "note", pos: p, inBar: p - meas.start, val: v, noteIdx: sp.idx,
            first: sp.idx >= 0 && first, tieStart: sp.idx >= 0 && !isLastPiece, tieEnd: sp.idx >= 0 && !first,
          });
          first = false; p += v;
        });
      }
      a = b;
    }
  }
  return measures;
}

/** Grupos de corcheas/semicorcheas que van unidas con barra (dentro de un mismo pulso). */
export function beamGroups(m: Measure, ts: TimeSig): Ev[][] {
  const beat = beatLen(ts);
  const groups: Ev[][] = [];
  let g: Ev[] = [];
  let gBeat = -1;
  const flush = () => { if (g.length >= 2) groups.push(g); g = []; };
  for (const e of m.events) {
    const b = Math.floor(e.inBar / beat);
    if (e.kind === "note" && e.val < 4) {
      if (b !== gBeat) { flush(); gBeat = b; }
      g.push(e);
    } else { flush(); gBeat = -1; }
  }
  flush();
  return groups;
}

export const VALUE_TYPE: Record<number, { type: string; dot: boolean }> = {
  16: { type: "whole", dot: false }, 12: { type: "half", dot: true }, 8: { type: "half", dot: false }, 6: { type: "quarter", dot: true },
  4: { type: "quarter", dot: false }, 3: { type: "eighth", dot: true }, 2: { type: "eighth", dot: false }, 1: { type: "16th", dot: false },
};
