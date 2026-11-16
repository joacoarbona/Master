// Banco de pruebas de Tarareo: 20 canciones conocidas × (tarareo, silbido, canto con desafines, piano/guitarra).
// Uso: npm run tarareo:bench  ·  filtrar: npm run tarareo:bench -- elisa  ·  variantes: SEEDS=1,2 TEMPO=1.2 REV=0.35 NOISE=0.01 DET=-30
import { analyzeTrack, segmentNotes, type RawNote } from "../src/works/tarareo/pitch";
import { quantize, detectKeys, keyName, tsLabel } from "../src/works/tarareo/music";
import { SONGS } from "../src/works/tarareo/songs";
import { renderSong, type RenderMode } from "../src/works/tarareo/render";
// @ts-ignore
import * as P from "../src/works/tarareo/analyze";

type T = { start: number; end: number; midi: number };
export function score(det: { start: number; midi: number }[], truth: T[], tol = 0.07) {
  const used = new Set<number>(); let m = 0, mOn = 0, pitchOk = 0;
  for (const t of truth) {
    let bi = -1, bd = Infinity;
    det.forEach((d, i) => { if (used.has(i)) return; const dd = Math.abs(d.start - t.start); if (dd <= tol && dd < bd) { bd = dd; bi = i; } });
    if (bi >= 0) { used.add(bi); mOn++; if (det[bi].midi === t.midi) { pitchOk++; } }
  }
  // F con tono: emparejamiento que exige tono
  const used2 = new Set<number>();
  for (const t of truth) {
    const i = det.findIndex((d, k) => !used2.has(k) && Math.abs(d.start - t.start) <= tol && d.midi === t.midi);
    if (i >= 0) { used2.add(i); m++; }
  }
  const p = det.length ? m / det.length : 0, r = truth.length ? m / truth.length : 0;
  return { f: p + r ? (2 * p * r) / (p + r) : 0, p, r, onF: (2 * mOn) / (det.length + truth.length || 1), pitchAcc: mOn ? pitchOk / mOn : 0 };
}

const cases: { song: string; mode: RenderMode; acc?: boolean; pedal?: boolean }[] = [];
for (const s of SONGS) {
  cases.push({ song: s.id, mode: "hum" }, { song: s.id, mode: "whistle" }, { song: s.id, mode: "sing" });
  cases.push({ song: s.id, mode: s.instrument === "guitarra" ? "guitar" : "piano", acc: false });
  if (s.acc.length) cases.push({ song: s.id, mode: s.instrument === "guitarra" ? "guitar" : "piano", acc: true, pedal: s.instrument === "piano" });
}
const only = process.argv[2];
(async () => {
  const rows: string[] = [];
  let sumF = 0, n = 0;
  for (const c of cases) {
    if (only && !`${c.song}-${c.mode}${c.acc ? "+acc" : ""}`.includes(only)) continue;
    const song = SONGS.find((s) => s.id === c.song)!;
    for (const seed of (process.env.SEEDS || "3").split(",").map(Number)) {
      const r = renderSong(song, c.mode, { seed, withAcc: c.acc, pedal: process.env.NOPEDAL ? false : c.pedal, tempoMul: Number(process.env.TEMPO || 1), reverb: Number(process.env.REV || 0.12), noise: Number(process.env.NOISE || 0.003), detuneCents: process.env.DET ? Number(process.env.DET) : undefined });
      let notes: RawNote[]; let mode = "voz";
      let extra = ""; if ((P as any).analyzeAuto) { const res = await (P as any).analyzeAuto(r.pcm, r.sr, { source: process.env.SRC || "auto" }); notes = res.notes; mode = res.mode; (globalThis as any).__bass = res.mode === "instrumento" ? res.inst?.bass : []; if (res.features) extra = ` poly=${res.features.poly.toFixed(2)} dec=${res.features.decay.toFixed(2)} cl=${res.features.clarity.toFixed(2)} wb=${res.features.wobble.toFixed(3)}`; }
      else { const tr = await analyzeTrack(r.pcm, r.sr); notes = segmentNotes(tr).notes; }
      // «sing»: cada cantante va en su tono → se busca la transposición que mejor encaja
      let T = 0, sc = score(notes, r.truth);
      if (c.mode === "sing") for (let tt = -16; tt <= 16; tt++) { const s2 = score(notes, r.truth.map((x) => ({ ...x, midi: x.midi + tt }))); if (s2.f > sc.f) { sc = s2; T = tt; } }
      const q = quantize(notes, { accents: (globalThis as any).__bass }); (globalThis as any).__ts = (globalThis as any).__ts || {}; 
      const k = q.notes.length ? detectKeys(q.notes)[0] : { tonic: 0, mode: "major" as const };
      const keyOk = (((k.tonic - T) % 12) + 12) % 12 === song.key.tonic && k.mode === song.key.mode;
      const ratio = q.bpm / song.bpm;
      sumF += sc.f; n++;
      rows.push(`${(c.song + "-" + c.mode + (c.acc ? "+acc" : "")).padEnd(26)} ${mode.padEnd(11)} F=${sc.f.toFixed(2)} P=${sc.p.toFixed(2)} R=${sc.r.toFixed(2)} onF=${sc.onF.toFixed(2)} pAcc=${sc.pitchAcc.toFixed(2)} n=${notes.length}/${r.truth.length}  key ${keyOk ? "ok" : "✗ " + keyName(k, "es")}  ts ${tsLabel(q.ts)}${tsLabel(q.ts) === tsLabel(song.ts) ? "" : "(≠" + tsLabel(song.ts) + ")"}  bpm×${ratio.toFixed(2)}${extra}`);
    }
  }
  console.log(rows.join("\n"));
  console.log(`MEDIA F = ${(sumF / n).toFixed(3)} sobre ${n} casos`);
})();
