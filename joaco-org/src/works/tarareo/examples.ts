/* ============================================================
   TARAREO · Ejemplos
   Melodías de dominio público convertidas en un «tarareo»
   sintético (voz con armónicos, vibrato, desafine y pequeños
   errores de tiempo) que pasa por el mismo análisis que tu voz.
   ============================================================ */
import { midiToHz } from "./pitch";

export type Example = { id: string; title: string; who: string; bpm: number; notes: [number, number][] };

// [nota MIDI, duración en negras]; 0 = silencio
export const EXAMPLES: Example[] = [
  {
    id: "oda", title: "Oda a la alegría", who: "Beethoven, 9ª sinfonía", bpm: 108,
    notes: [
      [66, 1], [66, 1], [67, 1], [69, 1], [69, 1], [67, 1], [66, 1], [64, 1], [62, 1], [62, 1], [64, 1], [66, 1], [66, 1.5], [64, 0.5], [64, 2],
      [66, 1], [66, 1], [67, 1], [69, 1], [69, 1], [67, 1], [66, 1], [64, 1], [62, 1], [62, 1], [64, 1], [66, 1], [64, 1.5], [62, 0.5], [62, 2],
    ],
  },
  {
    id: "martinillo", title: "Martinillo", who: "Canción popular francesa (Frère Jacques)", bpm: 96,
    notes: [
      [65, 1], [67, 1], [69, 1], [65, 1], [65, 1], [67, 1], [69, 1], [65, 1],
      [69, 1], [70, 1], [72, 2], [69, 1], [70, 1], [72, 2],
      [72, 0.5], [74, 0.5], [72, 0.5], [70, 0.5], [69, 1], [65, 1], [72, 0.5], [74, 0.5], [72, 0.5], [70, 0.5], [69, 1], [65, 1],
      [65, 1], [60, 1], [65, 2], [65, 1], [60, 1], [65, 2],
    ],
  },
  {
    id: "cumple", title: "Cumpleaños feliz", who: "Hermanas Hill (dominio público)", bpm: 100,
    notes: [
      [62, 0.75], [62, 0.25], [64, 1], [62, 1], [67, 1], [66, 2],
      [62, 0.75], [62, 0.25], [64, 1], [62, 1], [69, 1], [67, 2],
      [62, 0.75], [62, 0.25], [74, 1], [71, 1], [67, 1], [66, 1], [64, 1],
      [72, 0.75], [72, 0.25], [71, 1], [67, 1], [69, 1], [67, 3],
    ],
  },
];

/** Genera el tarareo. Semilla fija para que el ejemplo sea siempre igual. */
export function synthHum(ex: Example, sr = 16000, opts: { detuneCents?: number; seed?: number; octave?: number } = {}): Float32Array {
  let seed = opts.seed ?? 7;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const beat = 60 / ex.bpm;
  const total = ex.notes.reduce((s, n) => s + n[1], 0) * beat + 1.2;
  const out = new Float32Array(Math.ceil(total * sr));
  const globalOff = (opts.detuneCents ?? 28) / 100;
  const oct = (opts.octave ?? 0) * 12;
  let t = 0.35;
  let phase = 0;
  for (const [m, d] of ex.notes) {
    const dur = d * beat;
    const jitter = (rnd() - 0.5) * 0.04;
    const start = t + jitter;
    const len = dur * (d <= 0.5 ? 0.8 : 0.86);
    if (m > 0) {
      const target = m + oct + globalOff + (rnd() - 0.5) * 0.25;
      const a = Math.floor(start * sr), b = Math.min(out.length, Math.floor((start + len) * sr));
      const amp = 0.25 + rnd() * 0.08;
      for (let i = a; i < b; i++) {
        const lt = (i - a) / sr;
        // entrada desde abajo (portamento corto), luego vibrato
        const scoop = lt < 0.06 ? -0.45 * (1 - lt / 0.06) : 0;
        const vib = lt > 0.18 ? 0.18 * Math.sin(2 * Math.PI * 5.4 * lt) : 0;
        const f = midiToHz(target + scoop + vib);
        phase += (2 * Math.PI * f) / sr;
        let env = Math.min(1, lt / 0.03) * Math.min(1, (len - lt) / 0.045);
        env = Math.max(0, env);
        let s = 0;
        for (let h = 1; h <= 6; h++) s += Math.sin(phase * h) / Math.pow(h, 1.25);
        out[i] += s * env * amp;
      }
    }
    t += dur;
  }
  for (let i = 0; i < out.length; i++) out[i] += (rnd() - 0.5) * 0.004;
  return out;
}
