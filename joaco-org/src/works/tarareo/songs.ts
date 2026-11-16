/* ============================================================
   TARAREO · Canciones conocidas (dominio público)
   Partituras de referencia para los ejemplos y para el banco de
   pruebas: melodía + acompañamiento, en negras (beats).
   ============================================================ */
import type { Key, TimeSig } from "./music";

export type Part = { midi: number; start: number; dur: number; string?: number };
export type Song = {
  id: string; title: string; who: string; bpm: number; ts: TimeSig; key: Key;
  instrument: "piano" | "guitarra"; melody: Part[]; acc: Part[];
};

/** Secuencia [nota, duración en negras]; 0 = silencio. */
function seq(list: [number, number][], start = 0, string?: number): Part[] {
  const out: Part[] = [];
  let t = start;
  for (const [m, d] of list) { if (m > 0) out.push({ midi: m, start: t, dur: d, string }); t += d; }
  return out;
}

// ---------- Para Elisa (Beethoven, WoO 59) — compás 3/8, la menor ----------
function furElise(): Song {
  const s = 0.25; // semicorchea en negras
  const mel: Part[] = [], acc: Part[] = [];
  const RH: [number, number, number][] = [ // [midi, posición en semicorcheas, duración]
    [76, 0, 1], [75, 1, 1],
    [76, 2, 1], [75, 3, 1], [76, 4, 1], [71, 5, 1], [74, 6, 1], [72, 7, 1],
    [69, 8, 2], [60, 11, 1], [64, 12, 1], [69, 13, 1],
    [71, 14, 2], [64, 17, 1], [68, 18, 1], [71, 19, 1],
    [72, 20, 2], [64, 23, 1], [76, 24, 1], [75, 25, 1],
    [76, 26, 1], [75, 27, 1], [76, 28, 1], [71, 29, 1], [74, 30, 1], [72, 31, 1],
    [69, 32, 2], [60, 35, 1], [64, 36, 1], [69, 37, 1],
    [71, 38, 2], [64, 41, 1], [72, 42, 1], [71, 43, 1],
    [69, 44, 2],
  ];
  const LH: [number, number][] = [[45, 8], [52, 9], [57, 10], [40, 14], [52, 15], [56, 16], [45, 20], [52, 21], [57, 22], [45, 32], [52, 33], [57, 34], [40, 38], [52, 39], [56, 40], [45, 44], [52, 45], [57, 46]];
  // Primera vuelta + anacrusa de la repetición; la segunda vuelta empieza en la semicorchea 50
  for (const rep of [0, 48]) {
    RH.forEach(([m, p, d], i) => {
      if (rep && i < 2) return;
      mel.push({ midi: m, start: (p + rep) * s, dur: (rep && i === RH.length - 1 ? 6 : d) * s });
    });
    if (!rep) { mel.push({ midi: 76, start: 48 * s, dur: s }); mel.push({ midi: 75, start: 49 * s, dur: s }); }
    LH.forEach(([m, p], i) => acc.push({ midi: m, start: (p + rep) * s, dur: (3 - (i % 3)) * s }));
  }
  return { id: "elisa", title: "Para Elisa", who: "Beethoven (piano, dos manos)", bpm: 84, ts: { num: 3, den: 8 }, key: { tonic: 9, mode: "minor" }, instrument: "piano", melody: mel.sort((a, b) => a.start - b.start), acc };
}

// ---------- Romance anónimo — 3/4 en tresillos, mi menor ----------
function romance(): Song {
  const melBars = [
    [71, 71, 71], [71, 69, 67], [67, 66, 64], [64, 67, 71], [76, 76, 76], [76, 74, 72], [72, 71, 69], [69, 71, 72],
    [71, 72, 71], [75, 72, 71], [71, 69, 67], [67, 66, 64], [66, 66, 66], [66, 67, 66], [64, 64, 64], [64, 0, 0],
  ];
  // [cuerda 2, cuerda 3, bajo]
  const chord: [number, number, number][] = [
    [59, 55, 40], [59, 55, 40], [59, 55, 40], [59, 55, 40], [59, 55, 40], [59, 55, 40], [60, 57, 45], [60, 57, 45],
    [59, 57, 47], [59, 57, 47], [59, 55, 40], [59, 55, 40], [59, 57, 47], [59, 57, 47], [59, 55, 40], [59, 55, 40],
  ];
  const mel: Part[] = [], acc: Part[] = [];
  melBars.forEach((bar, b) => {
    const [s2, s3, bass] = chord[b];
    acc.push({ midi: bass, start: b * 3, dur: 3, string: bass < 45 ? 0 : 1 });
    bar.forEach((m, j) => {
      const t = b * 3 + j;
      if (b === 15 && j > 0) return;
      if (m) mel.push({ midi: m, start: t, dur: b === 15 ? 3 : 1, string: 5 });
      if (b === 15 && j === 0) return;
      acc.push({ midi: s2, start: t + 1 / 3, dur: 2 / 3, string: 4 });
      acc.push({ midi: s3, start: t + 2 / 3, dur: 2 / 3, string: 3 });
    });
  });
  return { id: "romance", title: "Romance anónimo", who: "Anónimo (guitarra, con arpegio)", bpm: 66, ts: { num: 3, den: 4 }, key: { tonic: 4, mode: "minor" }, instrument: "guitarra", melody: mel, acc };
}

const C4 = 60;
export const SONGS: Song[] = [
  furElise(),
  romance(),
  {
    id: "oda", title: "Oda a la alegría", who: "Beethoven", bpm: 108, ts: { num: 4, den: 4 }, key: { tonic: 2, mode: "major" }, instrument: "piano", acc: [],
    melody: seq([[66, 1], [66, 1], [67, 1], [69, 1], [69, 1], [67, 1], [66, 1], [64, 1], [62, 1], [62, 1], [64, 1], [66, 1], [66, 1.5], [64, 0.5], [64, 2],
      [66, 1], [66, 1], [67, 1], [69, 1], [69, 1], [67, 1], [66, 1], [64, 1], [62, 1], [62, 1], [64, 1], [66, 1], [64, 1.5], [62, 0.5], [62, 2]]),
  },
  {
    id: "martinillo", title: "Martinillo", who: "Popular francesa", bpm: 96, ts: { num: 4, den: 4 }, key: { tonic: 5, mode: "major" }, instrument: "piano", acc: [],
    melody: seq([[65, 1], [67, 1], [69, 1], [65, 1], [65, 1], [67, 1], [69, 1], [65, 1], [69, 1], [70, 1], [72, 2], [69, 1], [70, 1], [72, 2],
      [72, 0.5], [74, 0.5], [72, 0.5], [70, 0.5], [69, 1], [65, 1], [72, 0.5], [74, 0.5], [72, 0.5], [70, 0.5], [69, 1], [65, 1], [65, 1], [60, 1], [65, 2], [65, 1], [60, 1], [65, 2]]),
  },
  {
    id: "cumple", title: "Cumpleaños feliz", who: "Hermanas Hill", bpm: 100, ts: { num: 3, den: 4 }, key: { tonic: 7, mode: "major" }, instrument: "piano", acc: [],
    melody: seq([[62, 0.75], [62, 0.25], [64, 1], [62, 1], [67, 1], [66, 2], [62, 0.75], [62, 0.25], [64, 1], [62, 1], [69, 1], [67, 2],
      [62, 0.75], [62, 0.25], [74, 1], [71, 1], [67, 1], [66, 1], [64, 1], [72, 0.75], [72, 0.25], [71, 1], [67, 1], [69, 1], [67, 3]], 2),
  },
  {
    id: "estrellita", title: "Estrellita", who: "Popular (Twinkle twinkle)", bpm: 100, ts: { num: 4, den: 4 }, key: { tonic: 0, mode: "major" }, instrument: "piano", acc: [],
    melody: seq([[C4, 1], [C4, 1], [67, 1], [67, 1], [69, 1], [69, 1], [67, 2], [65, 1], [65, 1], [64, 1], [64, 1], [62, 1], [62, 1], [C4, 2],
      [67, 1], [67, 1], [65, 1], [65, 1], [64, 1], [64, 1], [62, 2], [67, 1], [67, 1], [65, 1], [65, 1], [64, 1], [64, 1], [62, 2],
      [C4, 1], [C4, 1], [67, 1], [67, 1], [69, 1], [69, 1], [67, 2], [65, 1], [65, 1], [64, 1], [64, 1], [62, 1], [62, 1], [C4, 2]]),
  },
  {
    id: "nochedepaz", title: "Noche de paz", who: "Gruber, 1818", bpm: 120, ts: { num: 6, den: 8 }, key: { tonic: 0, mode: "major" }, instrument: "piano", acc: [],
    melody: seq([[67, 0.75], [69, 0.25], [67, 0.5], [64, 1.5], [67, 0.75], [69, 0.25], [67, 0.5], [64, 1.5], [74, 1], [74, 0.5], [71, 1.5], [72, 1], [72, 0.5], [67, 1.5],
      [69, 1], [69, 0.5], [72, 0.75], [71, 0.25], [69, 0.5], [67, 0.75], [69, 0.25], [67, 0.5], [64, 1.5], [69, 1], [69, 0.5], [72, 0.75], [71, 0.25], [69, 0.5],
      [67, 0.75], [69, 0.25], [67, 0.5], [64, 1.5], [74, 1], [74, 0.5], [77, 0.75], [74, 0.25], [71, 0.5], [72, 1.5], [76, 1.5], [72, 0.75], [67, 0.25], [64, 0.5], [67, 0.75], [65, 0.25], [62, 0.5], [C4, 3]]),
  },
  {
    id: "greensleeves", title: "Greensleeves", who: "Tradicional inglesa", bpm: 120, ts: { num: 6, den: 8 }, key: { tonic: 9, mode: "minor" }, instrument: "guitarra", acc: [],
    melody: seq([[69, 0.5], [72, 1], [74, 0.5], [76, 0.75], [77, 0.25], [76, 0.5], [74, 1], [71, 0.5], [67, 0.75], [69, 0.25], [71, 0.5], [72, 1], [69, 0.5], [69, 0.75], [68, 0.25], [69, 0.5],
      [71, 1], [68, 0.5], [64, 1], [69, 0.5], [72, 1], [74, 0.5], [76, 0.75], [77, 0.25], [76, 0.5], [74, 1], [71, 0.5], [67, 0.75], [69, 0.25], [71, 0.5],
      [72, 0.75], [71, 0.25], [69, 0.5], [68, 0.75], [66, 0.25], [68, 0.5], [69, 1.5], [69, 1.5]], 2.5),
  },
];

/** Notas de la melodía en segundos (verdad de referencia). */
export function melodyTimes(song: Song, bpm = song.bpm): { start: number; end: number; midi: number }[] {
  const b = 60 / bpm;
  return song.melody.map((n) => ({ start: n.start * b, end: (n.start + n.dur) * b, midi: n.midi }));
}
