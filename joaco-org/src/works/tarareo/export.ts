/* ============================================================
   TARAREO · Exportar
   MIDI (melodía + acordes), MusicXML (MuseScore, Sibelius,
   Finale, Dorico…) y texto.
   ============================================================ */
import { buildMeasures, VALUE_TYPE } from "./layout";
import {
  barLen, chordSymbol, keyFifths, keyName, pianoVoicing, spell, spelledName, tsLabel,
  type ChordEvent, type Key, type Naming, type QNote, type TimeSig,
} from "./music";

const STEP = ["C", "D", "E", "F", "G", "A", "B"];
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function toMusicXML(o: { title: string; notes: QNote[]; key: Key; ts: TimeSig; bpm: number; total: number; chords: ChordEvent[]; bass: boolean }): string {
  const measures = buildMeasures(o.notes, o.ts, o.total);
  const kind = { maj: "major", min: "minor", dim: "diminished", "7": "dominant" } as const;
  const chordAt = new Map(o.chords.map((c) => [c.start, c]));
  const out: string[] = [];
  out.push(`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0">
  <work><work-title>${esc(o.title)}</work-title></work>
  <identification><encoding><software>Tarareo · joaco.org</software></encoding></identification>
  <part-list><score-part id="P1"><part-name>Melodía</part-name></score-part></part-list>
  <part id="P1">`);
  measures.forEach((m, mi) => {
    out.push(`    <measure number="${mi + 1}">`);
    if (mi === 0) {
      out.push(`      <attributes><divisions>4</divisions><key><fifths>${keyFifths(o.key)}</fifths><mode>${o.key.mode}</mode></key>` +
        `<time><beats>${o.ts.num}</beats><beat-type>${o.ts.den}</beat-type></time>` +
        `<clef><sign>${o.bass ? "F" : "G"}</sign><line>${o.bass ? 4 : 2}</line></clef></attributes>`);
      out.push(`      <direction placement="above"><direction-type><metronome><beat-unit>quarter</beat-unit><per-minute>${o.bpm}</per-minute></metronome></direction-type><sound tempo="${o.bpm}"/></direction>`);
    }
    for (const e of m.events) {
      // acordes que empiezan dentro de este evento
      for (const c of o.chords) {
        if (c.start >= e.pos && c.start < e.pos + e.val && chordAt.has(c.start)) {
          const s = spell(60 + c.chord.root, o.key);
          const off = c.start - e.pos;
          out.push(`      <harmony><root><root-step>${STEP[s.letter]}</root-step>${s.alter ? `<root-alter>${s.alter}</root-alter>` : ""}</root><kind>${kind[c.chord.q]}</kind>${off ? `<offset>${off}</offset>` : ""}</harmony>`);
          chordAt.delete(c.start);
        }
      }
      if (e.kind === "rest") {
        const t = VALUE_TYPE[e.val];
        out.push(e.fullBar
          ? `      <note><rest measure="yes"/><duration>${e.val}</duration><voice>1</voice></note>`
          : `      <note><rest/><duration>${e.val}</duration><voice>1</voice><type>${t.type}</type>${t.dot ? "<dot/>" : ""}</note>`);
        continue;
      }
      const n = o.notes[e.noteIdx];
      const s = spell(n.midi, o.key);
      const t = VALUE_TYPE[e.val];
      const ties = (e.tieEnd ? `<tie type="stop"/>` : "") + (e.tieStart ? `<tie type="start"/>` : "");
      const tied = (e.tieEnd ? `<tied type="stop"/>` : "") + (e.tieStart ? `<tied type="start"/>` : "");
      out.push(`      <note><pitch><step>${STEP[s.letter]}</step>${s.alter ? `<alter>${s.alter}</alter>` : ""}<octave>${s.octave}</octave></pitch>` +
        `<duration>${e.val}</duration>${ties}<voice>1</voice><type>${t.type}</type>${t.dot ? "<dot/>" : ""}${tied ? `<notations>${tied}</notations>` : ""}</note>`);
    }
    if (mi === measures.length - 1) out.push(`      <barline location="right"><bar-style>light-heavy</bar-style></barline>`);
    out.push(`    </measure>`);
  });
  out.push(`  </part>\n</score-partwise>\n`);
  return out.join("\n");
}

// ---------- MIDI ----------
function vlq(n: number): number[] {
  const bytes = [n & 0x7f];
  while ((n >>= 7)) bytes.unshift((n & 0x7f) | 0x80);
  return bytes;
}
function track(events: { t: number; d: number[] }[]): number[] {
  events.sort((a, b) => a.t - b.t || (a.d[0] & 0xf0) - (b.d[0] & 0xf0));
  const body: number[] = [];
  let last = 0;
  for (const e of events) { body.push(...vlq(e.t - last), ...e.d); last = e.t; }
  body.push(0, 0xff, 0x2f, 0);
  const len = body.length;
  return [0x4d, 0x54, 0x72, 0x6b, (len >>> 24) & 255, (len >>> 16) & 255, (len >>> 8) & 255, len & 255, ...body];
}
// Texto MIDI en ASCII: muchos programas leen estos campos como Latin-1 y estropean las tildes
const ascii = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/♯/g, "#").replace(/♭/g, "b").replace(/[^\x20-\x7e]/g, "");
const text = (type: number, s: string) => { const b = Array.from(ascii(s), (ch) => ch.charCodeAt(0)); return [0xff, type, ...vlq(b.length), ...b]; };

export function toMIDI(o: { title: string; notes: QNote[]; key: Key; ts: TimeSig; bpm: number; chords: ChordEvent[]; withChords: boolean }): Uint8Array<ArrayBuffer> {
  const TPQ = 480, T16 = TPQ / 4;
  const mpq = Math.round(60000000 / o.bpm);
  const fifths = keyFifths(o.key);
  const meta = track([
    { t: 0, d: text(0x03, o.title) },
    { t: 0, d: [0xff, 0x51, 3, (mpq >> 16) & 255, (mpq >> 8) & 255, mpq & 255] },
    { t: 0, d: [0xff, 0x58, 4, o.ts.num, Math.log2(o.ts.den), 24, 8] },
    { t: 0, d: [0xff, 0x59, 2, fifths & 255, o.key.mode === "minor" ? 1 : 0] },
  ]);
  const mel: { t: number; d: number[] }[] = [{ t: 0, d: text(0x03, "Melodía") }, { t: 0, d: [0xc0, 0] }];
  o.notes.forEach((n) => {
    const v = Math.max(40, Math.min(120, Math.round(60 + n.vel * 50)));
    mel.push({ t: n.start * T16, d: [0x90, n.midi & 127, v] });
    mel.push({ t: (n.start + n.dur) * T16 - 4, d: [0x80, n.midi & 127, 0] });
  });
  const tracks = [meta, track(mel)];
  if (o.withChords && o.chords.length) {
    const ch: { t: number; d: number[] }[] = [{ t: 0, d: text(0x03, "Acordes") }, { t: 0, d: [0xc1, 24] }];
    o.chords.forEach((c) => {
      ch.push({ t: c.start * T16, d: text(0x01, chordSymbol(c.chord, o.key, "en")) });
      pianoVoicing(c.chord).forEach((m) => {
        ch.push({ t: c.start * T16, d: [0x91, m, 62] });
        ch.push({ t: (c.start + c.dur) * T16 - 4, d: [0x81, m, 0] });
      });
    });
    tracks.push(track(ch));
  }
  const head = [0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 1, 0, tracks.length, (TPQ >> 8) & 255, TPQ & 255];
  return new Uint8Array([...head, ...tracks.flat()]);
}

export function toText(o: { title: string; notes: QNote[]; key: Key; ts: TimeSig; bpm: number; chords: ChordEvent[]; naming: Naming; total: number }): string {
  const L = barLen(o.ts);
  const bars: string[] = [];
  for (let b = 0; b * L < o.total; b++) {
    const ns = o.notes.filter((n) => n.start >= b * L && n.start < (b + 1) * L).map((n) => spelledName(spell(n.midi, o.key), o.naming));
    const cs = o.chords.filter((c) => c.start >= b * L && c.start < (b + 1) * L).map((c) => chordSymbol(c.chord, o.key, o.naming === "es" ? "en" : "en"));
    bars.push(`${String(b + 1).padStart(2, " ")} | ${cs.length ? "[" + cs.join(" ") + "] " : ""}${ns.join(" ") || "—"}`);
  }
  return `${o.title}\nTonalidad: ${keyName(o.key, o.naming)} · Compás ${tsLabel(o.ts)} · ♩ = ${o.bpm}\n\n${bars.join("\n")}\n\nHecho con Tarareo · joaco.org\n`;
}

export function download(name: string, data: BlobPart, mime: string) {
  const url = URL.createObjectURL(new Blob([data], { type: mime }));
  const a = document.createElement("a");
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
