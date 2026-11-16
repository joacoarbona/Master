import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { DEFAULT_SEG, livePitch, hzToMidi, segmentNotes, toMono, type RawNote, type SegmentOptions, type Track } from "./tarareo/pitch";
import { analyzeBoth, analyzeInstrument, DEFAULT_INST, type Both, type InstOptions, type Source as SoundSource } from "./tarareo/analyze";
import { SONGS } from "./tarareo/songs";
import { renderSong, type RenderMode } from "./tarareo/render";
import {
  barLen, beatLen, chordLongName, chordNotes, chordSymbol, detectKeys, durationName, guitarShape, harmonize, keyFifths, keyName,
  keySignatureText, nid, pianoFingering, pianoVoicing, plainName, quantize, scoreLength, shapeMidis, spell, spelledName,
  suggestCapo, tabFor, TIME_SIGS, transposeKey, transposeNotes, tsLabel,
  type ChordEvent, type Key, type KeyGuess, type Naming, type QNote, type TimeSig,
} from "./tarareo/music";
import { cleanNotes } from "./tarareo/layout";
import Notation from "./tarareo/Notation";
import { ChordDiagram, Fretboard, MiniRoll, PianoKeys, PitchChart, type Contour } from "./tarareo/Instruments";
import { blockChord, click, getCtx, isChromeIOS, isFirefoxIOS, isIOS, newBus, newRecContext, pcmToBuffer, playNote, releaseAudio, setSession, strum, unlockAudio, type Instrument } from "./tarareo/audio";
import { download, toMIDI, toMusicXML, toText } from "./tarareo/export";

/* ============================================================
   TARAREO — de la voz a la partitura
   Graba (o sube) un tarareo; la app detecta las notas, el ritmo,
   la tonalidad y los acordes, y lo enseña como partitura, teclas
   de piano con digitación y guitarra (acordes, cejilla, tablatura).
   Todo se calcula en el navegador.
   ============================================================ */

// ---------- Tipos y almacenamiento ----------
type Source = "voz" | "archivo" | "ejemplo";
type Saved = {
  id: string; name: string; created: number; updated: number; source: Source;
  raw: RawNote[]; offset: number; contour: { hop: number; midi: (number | null)[] };
  notes: QNote[]; bpm: number; ts: TimeSig; key: Key; edited: boolean;
  mode?: "voz" | "instrumento"; why?: string; accents?: number[];
};
type Session = Saved & { pcm?: Float32Array; sr?: number; track?: Track; fullContour?: Contour; both?: Both; others?: { start: number; end: number; midi: number }[] };

// Ejemplos: partituras conocidas interpretadas por el sintetizador (voz, silbido, piano, guitarra)
const EXAMPLE_LIST: { id: string; song: string; mode: RenderMode; label: string; kind: string }[] = [
  { id: "oda", song: "oda", mode: "hum", label: "Oda a la alegría", kind: "tarareo" },
  { id: "cumple", song: "cumple", mode: "hum", label: "Cumpleaños feliz", kind: "tarareo" },
  { id: "noche", song: "nochedepaz", mode: "whistle", label: "Noche de paz", kind: "silbido" },
  { id: "elisa", song: "elisa", mode: "piano", label: "Para Elisa", kind: "piano, dos manos" },
  { id: "romance", song: "romance", mode: "guitar", label: "Romance anónimo", kind: "guitarra con arpegio" },
];
type Prefs = {
  naming: Naming; showNames: boolean; showChords: boolean; showTab: boolean; perBar: 1 | 2; layout: "linea" | "pagina";
  instrument: Instrument; accomp: "ninguno" | "guitarra" | "piano"; metro: boolean; speed: number; loop: boolean;
  useCapo: boolean; clef: "auto" | "treble" | "bass"; countIn: boolean; countBpm: number; pianoLabels: "c" | "used" | "all";
  source: SoundSource;
};
const DEFAULT_PREFS: Prefs = {
  naming: "es", showNames: true, showChords: true, showTab: false, perBar: 1, layout: "pagina",
  instrument: "piano", accomp: "ninguno", metro: false, speed: 1, loop: false,
  useCapo: true, clef: "auto", countIn: false, countBpm: 90, pianoLabels: "used", source: "auto",
};
const LS_HIST = "tarareo:historial:v1", LS_PREFS = "tarareo:prefs:v1";
function loadJSON<T>(k: string, fb: T): T {
  try { const v = localStorage.getItem(k); return v ? { ...(fb as object), ...JSON.parse(v) } as T : fb; } catch { return fb; }
}
function loadHist(): Saved[] {
  try { const v = localStorage.getItem(LS_HIST); const a = v ? JSON.parse(v) : []; return Array.isArray(a) ? a : []; } catch { return []; }
}
function saveHist(h: Saved[]) {
  try { localStorage.setItem(LS_HIST, JSON.stringify(h.slice(0, 60))); } catch { /* lleno o bloqueado */ }
}
const MAX_REC = 90;

type Tab = "partitura" | "piano" | "guitarra" | "detalle" | "historico";
type Live = { midi: number | null; cents: number; level: number; elapsed: number; count: number | null };

const fmtDate = (t: number) => new Date(t).toLocaleString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

// ---------- Componente ----------
export default function Tarareo() {
  const [prefs, setPrefs] = useState<Prefs>(() => loadJSON(LS_PREFS, DEFAULT_PREFS));
  const P = <K extends keyof Prefs>(k: K, v: Prefs[K]) => setPrefs((p) => ({ ...p, [k]: v }));
  useEffect(() => { try { localStorage.setItem(LS_PREFS, JSON.stringify(prefs)); } catch { /* */ } }, [prefs]);

  const [hist, setHist] = useState<Saved[]>(loadHist);
  const [cur, setCur] = useState<Session | null>(null);
  const [phase, setPhase] = useState<"idle" | "recording" | "analyzing">("idle");
  const [progress, setProgress] = useState(0);
  const [msg, setMsg] = useState<{ kind: "error" | "info"; text: ReactNode } | null>(null);
  const [tab, setTab] = useState<Tab>("partitura");
  const [help, setHelp] = useState<null | "intro" | "guia" | "leer" | "como" | "glosario">(null);
  const [selId, setSelId] = useState<string | null>(null);
  const [undo, setUndo] = useState<QNote[][]>([]);
  const [transpose, setTranspose] = useState(0);
  const [seg, setSeg] = useState<SegmentOptions>(DEFAULT_SEG);
  const [instOpt, setInstOpt] = useState<InstOptions>(DEFAULT_INST);
  const [live, setLive] = useState<Live>({ midi: null, cents: 0, level: 0, elapsed: 0, count: null });
  const [play, setPlay] = useState<{ on: boolean; mode: "score" | "original"; idx: number; chord: number; strum: number; t: number | null }>({ on: false, mode: "score", idx: -1, chord: -1, strum: -1, t: null });
  const [exportOpen, setExportOpen] = useState(false);
  const [wipe, setWipe] = useState<string | null>(null);
  const [width, setWidth] = useState(800);
  const [printing, setPrinting] = useState(false);
  const [more, setMore] = useState(false);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const scoreScroll = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const importRef = useRef<HTMLInputElement | null>(null);

  // Ancho disponible para la partitura en modo página
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(Math.min(1100, el.clientWidth - 34)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Primera visita: abre la introducción
  useEffect(() => { if (!loadHist().length) setHelp("intro"); }, []);

  // ---------- Derivados ----------
  const base = useMemo(() => (cur ? cleanNotes(cur.notes) : []), [cur]);
  const notes = useMemo(() => transposeNotes(base, transpose), [base, transpose]);
  const key = useMemo(() => (cur ? transposeKey(cur.key, transpose) : { tonic: 0, mode: "major" as const }), [cur, transpose]);
  const ts = cur?.ts ?? TIME_SIGS[0];
  const bpm = cur?.bpm ?? 100;
  const total = useMemo(() => scoreLength(notes, ts), [notes, ts]);
  const chords = useMemo(() => (notes.length ? harmonize(notes, key, ts, prefs.perBar, total) : []), [notes, key, ts, prefs.perBar, total]);
  const fingering = useMemo(() => pianoFingering(notes.map((n) => n.midi)), [notes]);
  const capoInfo = useMemo(() => suggestCapo(chords.map((c) => c.chord)), [chords]);
  const capo = prefs.useCapo ? capoInfo.capo : 0;
  const tab6 = useMemo(() => tabFor(notes.map((n) => n.midi), capo), [notes, capo]);
  const keyGuesses: KeyGuess[] = useMemo(() => detectKeys(base), [base]);
  const clef: "treble" | "bass" = useMemo(() => {
    if (prefs.clef !== "auto") return prefs.clef;
    const ms = notes.map((n) => n.midi).sort((a, b) => a - b);
    return ms.length && ms[ms.length >> 1] < 59 ? "bass" : "treble"; // mediana por debajo de Si3: voz grave
  }, [notes, prefs.clef]);
  const selIdx = useMemo(() => notes.findIndex((n) => n.id === selId), [notes, selId]);
  const range = useMemo(() => {
    if (!notes.length) return { lo: 60, hi: 72 };
    const ms = notes.map((n) => n.midi);
    return { lo: Math.min(...ms), hi: Math.max(...ms) };
  }, [notes]);
  const uniqueChords = useMemo(() => {
    const m = new Map<string, ChordEvent["chord"]>();
    chords.forEach((c) => { const k = `${c.chord.root}${c.chord.q}`; if (!m.has(k)) m.set(k, c.chord); });
    return Array.from(m.values());
  }, [chords]);
  const contour: Contour | null = useMemo(() => {
    if (!cur) return null;
    if (cur.fullContour) return cur.fullContour;
    return { hop: cur.contour.hop, midi: cur.contour.midi.map((v) => (v == null ? NaN : v)) };
  }, [cur]);

  // ---------- Guardado ----------
  const persist = useCallback((s: Session) => {
    const { pcm: _p, sr: _s, track: _t, fullContour: _f, both: _b, others: _o, ...rest } = s;
    void _p; void _s; void _t; void _f; void _b; void _o;
    setHist((h) => {
      const next = [rest, ...h.filter((x) => x.id !== s.id)];
      saveHist(next);
      return next;
    });
  }, []);
  const curRef = useRef<Session | null>(null);
  curRef.current = cur;
  const updateCur = useCallback((fn: (s: Session) => Session) => {
    const c = curRef.current;
    if (!c) return;
    const n = { ...fn(c), updated: Date.now() };
    curRef.current = n;
    setCur(n);
    persist(n);
  }, [persist]);

  // ---------- Análisis ----------
  /** Convierte un análisis (voz o instrumento) en la sesión de trabajo. */
  const fromAnalysis = (b: Both, mode: "voz" | "instrumento", base: Partial<Session>, bpmHint?: number): Session | null => {
    const a = b[mode];
    if (a.notes.length < 2) return null;
    const accents = mode === "instrumento" ? a.inst?.bass ?? [] : [];
    const q = quantize(a.notes, { bpm: bpmHint, accents });
    const k = detectKeys(q.notes)[0];
    const small: (number | null)[] = [];
    for (let i = 0; i < a.contour.midi.length; i += 2) small.push(Number.isFinite(a.contour.midi[i]) ? Math.round(a.contour.midi[i] * 100) / 100 : null);
    // Las demás notas (acompañamiento) para dibujarlas en gris en la curva
    const others = mode === "instrumento" && a.inst
      ? a.inst.all.filter((n) => !n.harmonic && !a.notes.some((m) => Math.abs(m.start - n.t) < 0.03 && Math.abs(m.midiF - n.midiF) < 0.5)).map((n) => ({ start: n.t, end: n.end, midi: Math.round(n.midiF - a.offset) }))
      : [];
    const now = Date.now();
    return {
      id: base.id ?? "m" + now.toString(36), name: base.name ?? "Melodía", created: base.created ?? now, updated: now, source: base.source ?? "voz",
      raw: a.notes, offset: a.offset, contour: { hop: a.contour.hop * 2, midi: small },
      notes: q.notes, bpm: q.bpm, ts: q.ts, key: { tonic: k.tonic, mode: k.mode }, edited: false,
      mode, why: b.chosen === mode ? b.why : "elegido a mano", accents,
      pcm: base.pcm, sr: base.sr, track: b.voz.track, fullContour: { hop: a.contour.hop, midi: a.contour.midi }, both: b, others,
    };
  };

  const analyzePcm = useCallback(async (pcm: Float32Array, sr: number, source: Source, name: string, bpmHint?: number, forced?: SoundSource) => {
    stopAll();
    setPhase("analyzing"); setProgress(0); setMsg(null);
    try {
      const b = await analyzeBoth(pcm, sr, { source: forced ?? prefs.source, seg, inst: instOpt, onProgress: setProgress });
      let s = fromAnalysis(b, b.chosen, { name, source, pcm, sr }, bpmHint);
      if (!s) {
        const other = b.chosen === "voz" ? "instrumento" : "voz";
        s = fromAnalysis(b, other, { name, source, pcm, sr }, bpmHint);
      }
      if (!s) {
        setMsg({ kind: "error", text: "No he encontrado una melodía clara. Prueba más cerca del micrófono, con algo más de volumen y sin música de fondo; si tarareas, separa cada nota con «ta» o «na»." });
        setPhase("idle");
        return;
      }
      setCur(s); persist(s); setTranspose(0); setSelId(null); setUndo([]);
      setTab("partitura"); setPhase("idle");
      setTimeout(() => document.getElementById("tr-results")?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
    } catch (e) {
      setMsg({ kind: "error", text: "Algo ha fallado al analizar el audio: " + String((e as Error)?.message ?? e) });
      setPhase("idle");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seg, instOpt, prefs.source, persist]);

  /** Cambia entre leerlo como voz o como instrumento (sin volver a analizar). */
  const switchMode = (m: "voz" | "instrumento") => {
    if (!cur?.both || cur.mode === m) return;
    const s = fromAnalysis(cur.both, m, cur);
    if (!s) { setMsg({ kind: "error", text: m === "voz" ? "Leído como voz no sale ninguna melodía clara." : "Leído como instrumento no sale ninguna melodía clara." }); return; }
    stopAll();
    setUndo([]); setSelId(null);
    setCur(s); persist(s);
  };

  // Re-analiza con otros ajustes de detección (solo con la grabación en memoria)
  const reSegment = (opts: SegmentOptions) => {
    setSeg(opts);
    if (!cur?.track || cur.mode === "instrumento") return;
    const sg = segmentNotes(cur.track, opts);
    if (sg.notes.length < 2) { setMsg({ kind: "error", text: "Con esos ajustes no queda ninguna nota: suaviza la sensibilidad." }); return; }
    const q = quantize(sg.notes, { bpm: cur.bpm, ts: cur.ts });
    updateCur((c) => ({ ...c, raw: sg.notes, offset: sg.offset, notes: q.notes, edited: false, fullContour: { hop: c.track!.hop, midi: sg.midi } }));
    setSelId(null); setUndo([]);
  };
  const reInstrument = async (opts: InstOptions) => {
    setInstOpt(opts);
    if (!cur?.pcm || !cur.sr || !cur.both) return;
    setPhase("analyzing"); setProgress(0);
    const inst = await analyzeInstrument(cur.pcm, cur.sr, { ...opts, clarity: cur.both.features.clarity }, setProgress);
    setPhase("idle");
    const both: Both = { ...cur.both, instrumento: { ...cur.both.instrumento, notes: inst.notes, offset: inst.offset, contour: { hop: inst.hop, midi: inst.contour }, inst } };
    const s = fromAnalysis(both, "instrumento", cur, cur.bpm);
    if (!s) { setMsg({ kind: "error", text: "Con esos ajustes no queda ninguna nota." }); return; }
    setCur(s); persist(s); setSelId(null); setUndo([]);
  };
  const requantize = (o: { bpm?: number; ts?: TimeSig }) => {
    if (!cur) return;
    const q = quantize(cur.raw, { bpm: o.bpm ?? cur.bpm, ts: o.ts ?? cur.ts, accents: cur.accents });
    if (cur.edited) setMsg({ kind: "info", text: "He vuelto a colocar las notas con el nuevo tempo o compás; las correcciones a mano se han descartado (puedes deshacer)." });
    setUndo((u) => [...u.slice(-49), cur.notes]);
    updateCur((c) => ({ ...c, notes: q.notes, bpm: o.bpm ?? c.bpm, ts: o.ts ?? c.ts, edited: false }));
    setSelId(null);
  };
  const autoMeter = () => {
    if (!cur) return;
    const q = quantize(cur.raw, { accents: cur.accents });
    updateCur((c) => ({ ...c, notes: q.notes, bpm: q.bpm, ts: q.ts, edited: false }));
  };

  // ---------- Grabación ----------
  const recRef = useRef<{ ctx: AudioContext; stream: MediaStream; nodes: AudioNode[]; chunks: Float32Array[]; sr: number; raf: number; t0: number; trail: { t: number; m: number }[]; timer?: number; stopped?: boolean; bpm?: number } | null>(null);

  const drawTrail = () => {
    const r = recRef.current, cv = canvasRef.current;
    if (!r || !cv) return;
    const g = cv.getContext("2d");
    if (!g) return;
    const W = cv.width = cv.clientWidth * (window.devicePixelRatio || 1), H = cv.height = cv.clientHeight * (window.devicePixelRatio || 1);
    const dpr = window.devicePixelRatio || 1;
    g.clearRect(0, 0, W, H);
    const now = (performance.now() - r.t0) / 1000;
    const win = 6;
    const pts = r.trail.filter((p) => p.t > now - win);
    const ms = pts.map((p) => p.m).filter(Number.isFinite);
    const center = ms.length ? ms.slice(-30).sort((a, b) => a - b)[Math.floor(Math.min(30, ms.length) / 2)] : 64;
    const lo = Math.round(center) - 9, hi = Math.round(center) + 9;
    const yOf = (m: number) => H - ((m - lo) / (hi - lo)) * H;
    g.font = `${10 * dpr}px Sora, sans-serif`;
    for (let m = lo; m <= hi; m++) {
      const blackKey = [1, 3, 6, 8, 10].includes(((m % 12) + 12) % 12);
      g.fillStyle = blackKey ? "rgba(0,0,0,.035)" : "rgba(0,0,0,0)";
      g.fillRect(0, yOf(m + 0.5), W, yOf(m - 0.5) - yOf(m + 0.5));
      if (!blackKey) { g.fillStyle = "#94a3b8"; g.fillText(plainName(m, prefs.naming), 4 * dpr, yOf(m) + 3.5 * dpr); }
    }
    g.strokeStyle = "#1d4ed8"; g.lineWidth = 2.4 * dpr; g.lineJoin = "round";
    g.beginPath();
    let pen = false;
    for (const p of pts) {
      const x = W - ((now - p.t) / win) * W;
      if (!Number.isFinite(p.m)) { pen = false; continue; }
      const y = yOf(p.m);
      if (!pen) { g.moveTo(x, y); pen = true; } else g.lineTo(x, y);
    }
    g.stroke();
  };

  const startRec = async () => {
    setMsg(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setMsg({ kind: "error", text: "Este navegador no deja usar el micrófono aquí. Abre joaco.org en Safari o Chrome actualizados (con https), o sube un audio grabado con la app de notas de voz." });
      return;
    }
    stopAll();
    // Todo dentro del mismo toque: sesión de grabación, contexto propio y petición del micrófono
    setSession("play-and-record");
    const c = newRecContext();
    const ask = navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 1 } });
    c.resume().catch(() => { /* */ });
    let stream: MediaStream;
    try {
      stream = await ask;
      if (c.state !== "running") await c.resume();
    } catch (e) {
      const name = (e as DOMException)?.name;
      c.close().catch(() => { /* */ });
      setSession("playback");
      setMsg({ kind: "error", text: name === "NotAllowedError" || name === "SecurityError" || (isIOS && name !== "NotReadableError") ? <MicHelp /> : <>No he podido abrir el micrófono ({name || String(e)}). ¿Lo está usando otra app, como una llamada o una nota de voz? Ciérrala y vuelve a probar.</> });
      return;
    }
    const src = c.createMediaStreamSource(stream);
    const an = c.createAnalyser(); an.fftSize = 2048;
    const proc = c.createScriptProcessor(4096, 1, 1);
    const mute = c.createGain(); mute.gain.value = 0;
    src.connect(an); src.connect(proc); proc.connect(mute); mute.connect(c.destination);
    const r: NonNullable<typeof recRef.current> = { ctx: c, stream, nodes: [src, an, proc, mute], chunks: [], sr: c.sampleRate, raf: 0, t0: performance.now(), trail: [], bpm: undefined };
    recRef.current = r;
    let capturing = !prefs.countIn;
    proc.onaudioprocess = (e) => { if (capturing) r.chunks.push(new Float32Array(e.inputBuffer.getChannelData(0))); };
    setPhase("recording");
    // Claqueta
    if (prefs.countIn) {
      const beats = ts.num === 6 ? 6 : ts.num;
      const spb = 60 / prefs.countBpm * (ts.den === 8 ? 0.5 : 1);
      const t0 = c.currentTime + 0.15;
      for (let i = 0; i < beats; i++) click(t0 + i * spb, c.destination, i === 0, c);
      r.bpm = prefs.countBpm;
      const startAt = performance.now() + (0.15 + beats * spb - 0.08) * 1000;
      const tick = () => {
        const left = Math.ceil((startAt - performance.now()) / 1000 / spb);
        if (performance.now() >= startAt) { capturing = true; r.t0 = performance.now(); setLive((l) => ({ ...l, count: null })); return; }
        setLive((l) => ({ ...l, count: Math.max(1, beats - left + 1) }));
        r.timer = window.setTimeout(tick, 40);
      };
      tick();
    } else r.t0 = performance.now();
    const buf = new Float32Array(an.fftSize);
    let lastUi = 0;
    const loop = () => {
      if (!recRef.current || r.stopped) return;
      an.getFloatTimeDomainData(buf);
      const lp = livePitch(buf, c.sampleRate);
      const t = (performance.now() - r.t0) / 1000;
      const m = lp.f0 > 0 && lp.conf > 0.6 ? hzToMidi(lp.f0) : NaN;
      if (capturing) r.trail.push({ t, m });
      if (performance.now() - lastUi > 70) {
        lastUi = performance.now();
        setLive((l) => ({ ...l, midi: Number.isFinite(m) ? Math.round(m) : null, cents: Number.isFinite(m) ? Math.round((m - Math.round(m)) * 100) : 0, level: Math.min(1, lp.rms * 6), elapsed: capturing ? t : 0 }));
        drawTrail();
      }
      if (capturing && t > MAX_REC) { stopRec(); return; }
      r.raf = requestAnimationFrame(loop);
    };
    r.raf = requestAnimationFrame(loop);
  };

  const stopRec = () => {
    const r = recRef.current;
    if (!r || r.stopped) return;
    r.stopped = true;
    cancelAnimationFrame(r.raf);
    if (r.timer) clearTimeout(r.timer);
    r.nodes.forEach((n) => { try { n.disconnect(); } catch { /* */ } });
    (r.nodes[2] as ScriptProcessorNode).onaudioprocess = null;
    r.stream.getTracks().forEach((t) => t.stop());
    r.ctx.close().catch(() => { /* */ });
    setSession("playback");
    recRef.current = null;
    const len = r.chunks.reduce((s, c) => s + c.length, 0);
    setLive({ midi: null, cents: 0, level: 0, elapsed: 0, count: null });
    if (len < r.sr * 0.8) { setPhase("idle"); setMsg({ kind: "error", text: "La grabación es demasiado corta. Mantén pulsado un poco más: tararea al menos dos o tres notas." }); return; }
    const pcm = new Float32Array(len);
    let o = 0;
    r.chunks.forEach((c) => { pcm.set(c, o); o += c.length; });
    const name = "Tarareo · " + fmtDate(Date.now());
    analyzePcm(pcm, r.sr, "voz", name, r.bpm);
  };
  useEffect(() => () => { const r = recRef.current; if (r) { r.stopped = true; r.stream.getTracks().forEach((t) => t.stop()); r.ctx.close().catch(() => { /* */ }); } }, []);

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    setMsg(null);
    try {
      const c = getCtx();
      const ab = await f.arrayBuffer();
      const buf = await new Promise<AudioBuffer>((res, rej) => c.decodeAudioData(ab, res, rej));
      let pcm = toMono(buf);
      if (buf.duration > 120) { pcm = pcm.slice(0, Math.floor(120 * buf.sampleRate)); setMsg({ kind: "info", text: "El audio dura más de 2 minutos: analizo solo los primeros 120 segundos." }); }
      analyzePcm(pcm, buf.sampleRate, "archivo", f.name.replace(/\.[^.]+$/, ""));
    } catch {
      setMsg({ kind: "error", text: "No he podido leer ese archivo de audio. Prueba con .m4a, .mp3 o .wav (las notas de voz del iPhone valen)." });
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const tryExample = (id: string) => {
    const ex = EXAMPLE_LIST.find((e) => e.id === id)!;
    const song = SONGS.find((x) => x.id === ex.song)!;
    const r = renderSong(song, ex.mode, { seed: 7, withAcc: true, pedal: ex.mode === "piano" });
    analyzePcm(r.pcm, r.sr, "ejemplo", `${ex.label} (${ex.kind})`, undefined, "auto");
  };

  // ---------- Reproducción ----------
  const pb = useRef<{ stop: () => void; raf: number; t0: number; sec16: number; endQ: number; strums: number[]; mode: "score" | "original"; src?: AudioBufferSourceNode } | null>(null);
  const stopAll = () => {
    const p = pb.current;
    if (p) { p.stop(); cancelAnimationFrame(p.raf); try { p.src?.stop(); } catch { /* */ } pb.current = null; releaseAudio(); }
    setPlay({ on: false, mode: "score", idx: -1, chord: -1, strum: -1, t: null });
  };
  useEffect(() => () => stopAll(), []);

  const startScore = async (fromQ = 0) => {
    if (!notes.length) return;
    stopAll();
    const sec16 = 60 / (bpm * prefs.speed) / 4;
    unlockAudio((total - fromQ) * sec16 + 1);
    const c = getCtx();
    try { await c.resume(); } catch { /* */ }
    if (c.state !== "running") { setMsg({ kind: "error", text: <SoundHelp /> }); return; }
    const { bus, stop } = newBus();
    const t0 = c.currentTime + 0.15 - fromQ * sec16;
    notes.forEach((n) => {
      if (n.start + n.dur <= fromQ) return;
      const st = Math.max(n.start, fromQ);
      playNote(prefs.instrument, n.midi, (n.start + n.dur - st) * sec16 * 0.97, t0 + st * sec16, bus);
    });
    const strums: number[] = [];
    const beat = beatLen(ts);
    if (prefs.accomp !== "ninguno") {
      chords.forEach((ch) => {
        for (let q = ch.start; q < ch.start + ch.dur; q += beat) {
          if (q < fromQ) continue;
          const first = q === ch.start;
          const when = t0 + q * sec16;
          if (prefs.accomp === "guitarra") {
            const sh = guitarShape(ch.chord.root - capo, ch.chord.q);
            const ms = shapeMidis(sh, capo);
            strum(ms, when, beat * sec16 * (first ? 1.6 : 1), bus, first || ((q - ch.start) / beat) % 2 === 0, first ? 0.9 : 0.55);
            strums.push(q);
          } else blockChord(pianoVoicing(ch.chord), when, beat * sec16 * 0.95, bus, first ? 0.9 : 0.5);
        }
      });
    }
    if (prefs.metro) for (let q = Math.ceil(fromQ / beat) * beat; q < total; q += beat) click(t0 + q * sec16, bus, q % barLen(ts) === 0);
    const p = { stop, raf: 0, t0, sec16, endQ: total, strums, mode: "score" as const };
    pb.current = p;
    let last = { idx: -2, chord: -2, strum: -2 };
    const loop = () => {
      if (pb.current !== p) return;
      const q = (c.currentTime - t0) / sec16;
      if (q >= p.endQ) {
        if (prefs.loop) { startScore(0); return; }
        stopAll(); return;
      }
      const idx = notes.findIndex((n) => q >= n.start && q < n.start + n.dur);
      const chord = chords.findIndex((ch) => q >= ch.start && q < ch.start + ch.dur);
      let sIdx = -1;
      for (let i = strums.length - 1; i >= 0; i--) if (q >= strums[i]) { const dt = (q - strums[i]) * sec16; if (dt < 0.33) sIdx = Math.floor(dt / 0.055); break; }
      if (sIdx > 5) sIdx = -1;
      if (idx !== last.idx || chord !== last.chord || sIdx !== last.strum) {
        last = { idx, chord, strum: sIdx };
        setPlay({ on: true, mode: "score", idx, chord, strum: sIdx, t: null });
      }
      p.raf = requestAnimationFrame(loop);
    };
    setPlay({ on: true, mode: "score", idx: -1, chord: -1, strum: -1, t: null });
    p.raf = requestAnimationFrame(loop);
  };

  const startOriginal = async () => {
    if (!cur?.pcm || !cur.sr) return;
    stopAll();
    unlockAudio(cur.pcm.length / cur.sr + 1);
    const c = getCtx();
    try { await c.resume(); } catch { /* */ }
    const { bus, stop } = newBus();
    const src = c.createBufferSource();
    src.buffer = pcmToBuffer(cur.pcm, cur.sr);
    src.connect(bus);
    const t0 = c.currentTime + 0.05;
    src.start(t0);
    const p = { stop, raf: 0, t0, sec16: 0, endQ: 0, strums: [], mode: "original" as const, src };
    pb.current = p;
    const dur = cur.pcm.length / cur.sr;
    let lastIdx = -2, lastT = 0;
    const loop = () => {
      if (pb.current !== p) return;
      const t = c.currentTime - t0;
      if (t >= dur) { stopAll(); return; }
      const ri = cur.raw.findIndex((r) => t >= r.start && t < r.end);
      const idx = ri >= 0 ? notes.findIndex((n) => n.raw === ri) : -1;
      if (idx !== lastIdx || Math.abs(t - lastT) > 0.04) {
        lastIdx = idx; lastT = t;
        setPlay({ on: true, mode: "original", idx, chord: -1, strum: -1, t });
      }
      p.raf = requestAnimationFrame(loop);
    };
    p.raf = requestAnimationFrame(loop);
  };

  // ---------- Edición ----------
  const edit = (fn: (ns: QNote[]) => QNote[]) => {
    if (!cur) return;
    stopAll();
    const next = cleanNotes(fn(cleanNotes(cur.notes)));
    setUndo((u) => [...u.slice(-49), cur.notes]);
    updateCur((c) => ({ ...c, notes: next, edited: true }));
  };
  const selBase = selId ? base.findIndex((n) => n.id === selId) : -1;
  const editSel = (op: "up" | "down" | "oct+" | "oct-" | "longer" | "shorter" | "del" | "merge" | "split") => {
    if (selBase < 0) return;
    edit((ns) => {
      const a = [...ns], n = { ...a[selBase] }, nx = a[selBase + 1];
      switch (op) {
        case "up": n.midi++; break;
        case "down": n.midi--; break;
        case "oct+": n.midi += 12; break;
        case "oct-": n.midi -= 12; break;
        case "longer": n.dur = Math.min(n.dur + 1, nx ? nx.start - n.start : n.dur + 1); break;
        case "shorter": n.dur = Math.max(1, n.dur - 1); break;
        case "del": a.splice(selBase, 1); setSelId(a[selBase]?.id ?? a[selBase - 1]?.id ?? null); return a;
        case "merge": if (nx) { n.dur = nx.start + nx.dur - n.start; a.splice(selBase + 1, 1); } break;
        case "split": if (n.dur >= 2) { const h = Math.floor(n.dur / 2); a.splice(selBase + 1, 0, { ...n, id: nid(), start: n.start + h, dur: n.dur - h }); n.dur = h; } break;
      }
      a[selBase] = n;
      if (op === "up" || op === "down" || op === "oct+" || op === "oct-") playNote(prefs.instrument, n.midi + transpose, 0.45);
      return a;
    });
  };
  const doUndo = () => {
    if (!undo.length) return;
    const prev = undo[undo.length - 1];
    setUndo((u) => u.slice(0, -1));
    updateCur((c) => ({ ...c, notes: prev }));
  };
  const onSelect = (i: number) => {
    const n = notes[i];
    if (!n) return;
    setSelId((s) => (s === n.id ? null : n.id));
    if (!play.on) playNote(prefs.instrument, n.midi, Math.min(0.8, n.dur * 60 / bpm / 4));
  };

  // Teclado: atajos
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest("input,textarea,select")) return;
      if (e.code === "Space" && cur) { e.preventDefault(); play.on ? stopAll() : startScore(); }
      if (selBase >= 0) {
        if (e.key === "ArrowUp") { e.preventDefault(); editSel(e.shiftKey ? "oct+" : "up"); }
        if (e.key === "ArrowDown") { e.preventDefault(); editSel(e.shiftKey ? "oct-" : "down"); }
        if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); editSel("del"); }
        if (e.key === "ArrowRight") { e.preventDefault(); const n = base[selBase + 1]; if (n) setSelId(n.id); }
        if (e.key === "ArrowLeft") { e.preventDefault(); const n = base[selBase - 1]; if (n) setSelId(n.id); }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "z") { e.preventDefault(); doUndo(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  // ---------- Exportar ----------
  const fileBase = (cur?.name ?? "tarareo").replace(/[^\p{L}\p{N} _-]+/gu, "").trim().replace(/\s+/g, "-").slice(0, 60) || "tarareo";
  const exportMidi = () => cur && download(`${fileBase}.mid`, toMIDI({ title: cur.name, notes, key, ts, bpm, chords, withChords: true }), "audio/midi");
  const exportXml = () => cur && download(`${fileBase}.musicxml`, toMusicXML({ title: cur.name, notes, key, ts, bpm, total, chords, bass: clef === "bass" }), "application/vnd.recordare.musicxml+xml");
  const exportTxt = async () => {
    if (!cur) return;
    const t = toText({ title: cur.name, notes, key, ts, bpm, chords, naming: prefs.naming, total });
    try { await navigator.clipboard.writeText(t); setMsg({ kind: "info", text: "Copiado: notas por compás y acordes, listo para pegar." }); }
    catch { download(`${fileBase}.txt`, t, "text/plain;charset=utf-8"); }
  };
  const doPrint = () => { setPrinting(true); setTimeout(() => { window.print(); setPrinting(false); }, 120); };
  const exportAll = () => download(`tarareo-historial-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ app: "joaco.org/tarareo", version: 1, items: hist }, null, 2), "application/json");
  const importAll = async (f: File | undefined) => {
    if (!f) return;
    try {
      const j = JSON.parse(await f.text());
      const items: Saved[] = Array.isArray(j) ? j : j.items;
      if (!Array.isArray(items)) throw new Error("formato");
      const ok = items.filter((x) => x && x.id && Array.isArray(x.notes));
      setHist((h) => { const ids = new Set(h.map((x) => x.id)); const next = [...ok.filter((x) => !ids.has(x.id)), ...h].sort((a, b) => b.updated - a.updated); saveHist(next); return next; });
      setMsg({ kind: "info", text: `Importadas ${ok.length} melodías.` });
    } catch { setMsg({ kind: "error", text: "Ese archivo no es una copia del histórico de Tarareo." }); }
    if (importRef.current) importRef.current.value = "";
  };
  const openSaved = (s: Saved) => {
    stopAll();
    setCur({ ...s }); setTranspose(0); setSelId(null); setUndo([]); setTab("partitura");
    setTimeout(() => document.getElementById("tr-results")?.scrollIntoView({ behavior: "smooth" }), 60);
  };

  // ---------- Piezas de interfaz ----------
  const NAME = (m: number) => spelledName(spell(m, key), prefs.naming);
  const activeNote = play.idx >= 0 ? notes[play.idx] : selIdx >= 0 ? notes[selIdx] : null;
  const activeChordEv = play.chord >= 0 ? chords[play.chord] : null;
  const scoreW = prefs.layout === "pagina" || printing ? (printing ? 700 : width) : 0;

  const notation = (opts: { fingering?: boolean; tab?: boolean }) => (
    <div className={"tr-score" + (scoreW ? " is-page" : "")} ref={scoreScroll}>
      <Notation
        notes={notes} keySig={key} ts={ts} total={total} chords={chords} naming={prefs.naming} clef={clef}
        showNames={prefs.showNames} showChords={prefs.showChords}
        fingering={opts.fingering ? fingering : null} tab={opts.tab ? tab6.pos : null}
        active={play.idx} activeChord={play.chord} selected={selIdx} onSelect={onSelect} wrap={scoreW} scrollRef={scoreScroll}
      />
    </div>
  );

  const editor = selIdx >= 0 && (
    <div className="tr-editor">
      <div className="tr-editor-h">
        <b>Nota {selIdx + 1}: {NAME(notes[selIdx].midi)}</b>
        <span>{durationName(notes[selIdx].dur)} · compás {Math.floor(notes[selIdx].start / barLen(ts)) + 1}, tiempo {Math.floor((notes[selIdx].start % barLen(ts)) / beatLen(ts)) + 1}</span>
        <button className="tr-x" onClick={() => setSelId(null)} aria-label="Cerrar">×</button>
      </div>
      <div className="tr-editor-b">
        <button onClick={() => editSel("up")}>▲ semitono</button>
        <button onClick={() => editSel("down")}>▼ semitono</button>
        <button onClick={() => editSel("oct+")}>+ octava</button>
        <button onClick={() => editSel("oct-")}>− octava</button>
        <button onClick={() => editSel("longer")}>⟷ más larga</button>
        <button onClick={() => editSel("shorter")}>⟵ más corta</button>
        <button onClick={() => editSel("split")}>✂︎ partir en dos</button>
        <button onClick={() => editSel("merge")}>⨝ unir con la siguiente</button>
        <button onClick={() => editSel("del")} className="danger">Borrar</button>
        <button onClick={() => startScore(notes[selIdx].start)}>▶ Tocar desde aquí</button>
        <button onClick={doUndo} disabled={!undo.length}>↶ Deshacer</button>
      </div>
      <p className="tr-hint">Atajos con teclado: ↑ ↓ semitono (con ⇧ octava), ← → nota anterior/siguiente, Supr borrar, ⌘Z deshacer, espacio tocar.</p>
    </div>
  );

  const legendScore = (extra?: ReactNode) => (
    <div className="tr-legend">
      <span><i className="sw sw-green" />Nota que suena</span>
      <span><i className="sw sw-amber" />Nota seleccionada (para corregir)</span>
      {prefs.showChords && <span><b className="tr-blue">G7</b> Acorde (cifrado americano)</span>}
      <span><small className="tr-gray">5</small> Número de compás</span>
      {extra}
    </div>
  );

  // ---------- Render ----------
  return (
    <div className={"tr-root" + (printing ? " is-printing" : "")} ref={rootRef}>
      <style>{CSS}</style>

      <header className="tr-head">
        <div>
          <h1>Tarareo</h1>
          <p>Del tarareo a la partitura · piano y guitarra</p>
        </div>
        <div className="tr-head-actions">
          <button className="tr-btn ghost" onClick={() => setHelp("guia")}>Guía</button>
          <button className="tr-btn ghost" onClick={() => setHelp("glosario")}>Glosario</button>
          <button className="tr-btn ghost" onClick={() => setTab("historico")}>Histórico {hist.length ? `(${hist.length})` : ""}</button>
        </div>
      </header>

      {/* ---------- Captura ---------- */}
      <section className={"tr-card tr-capture" + (phase === "recording" ? " is-rec" : "")}>
        {phase !== "recording" ? (
          <>
            <h2>{cur ? "Otra melodía" : "Tararea una melodía, nota por nota"}</h2>
            <div className="tr-capture-row">
              <button className="tr-rec" onClick={startRec} disabled={phase === "analyzing"} aria-label="Grabar">
                <span className="tr-rec-dot" />
                <span>Grabar</span>
              </button>
              <div className="tr-capture-alt">
                <button className="tr-btn" onClick={() => fileRef.current?.click()} disabled={phase === "analyzing"}>Subir audio</button>
                <input ref={fileRef} type="file" accept="audio/*,video/*,.m4a,.mp3,.wav,.aac,.ogg,.webm,.caf" hidden onChange={(e) => onFile(e.target.files?.[0])} />
                <div className="tr-examples">
                  <span>Probar un ejemplo:</span>
                  {EXAMPLE_LIST.map((ex) => <button key={ex.id} className="tr-chip" onClick={() => tryExample(ex.id)} disabled={phase === "analyzing"} title={SONGS.find((x) => x.id === ex.song)?.who}>{ex.label} <small>· {ex.kind}</small></button>)}
                </div>
                <div className="tr-source">
                  <span>Qué suena:</span>
                  <div className="tr-seg">
                    {([["auto", "Lo decide la app"], ["voz", "Voz o silbido"], ["instrumento", "Instrumento"]] as [SoundSource, string][]).map(([v, l]) => (
                      <button key={v} className={prefs.source === v ? "on" : ""} onClick={() => P("source", v)}>{l}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="tr-capture-opts">
              <label className="tr-check"><input type="checkbox" checked={prefs.countIn} onChange={(e) => P("countIn", e.target.checked)} /> Claqueta antes de grabar</label>
              {prefs.countIn && (
                <label className="tr-inline">a <input type="number" min={40} max={200} value={prefs.countBpm} onChange={(e) => P("countBpm", Math.max(40, Math.min(200, Number(e.target.value) || 90)))} /> negras por minuto
                  <small> (fija el tempo: el ritmo sale más exacto)</small></label>
              )}
            </div>
            {isIOS && isChromeIOS && <p className="tr-tip"><b>Chrome en iPhone:</b> el permiso del micrófono se da en Ajustes del iPhone › Chrome › Micrófono (no hay candado en la barra). <button className="tr-link" onClick={() => setMsg({ kind: "info", text: <MicHelp /> })}>Ver pasos</button></p>}
            <p className="tr-tip">Consejo: una sola voz, sin música de fondo, el móvil a un palmo de la boca. Di «ta» o «na» en cada nota: así se separan bien las notas repetidas. Máximo {MAX_REC} s.</p>
            {phase === "analyzing" && (
              <div className="tr-progress"><div style={{ width: `${Math.round(progress * 100)}%` }} /><span>Escuchando las notas… {Math.round(progress * 100)} %</span></div>
            )}
          </>
        ) : (
          <div className="tr-live">
            <div className="tr-live-top">
              <div className="tr-live-note">
                {live.count != null ? <><b className="tr-count">{live.count}</b><small>prepárate…</small></>
                  : live.midi != null ? <><b>{plainName(live.midi, prefs.naming)}</b><small className={Math.abs(live.cents) < 15 ? "ok" : ""}>{live.cents > 0 ? "+" : ""}{live.cents} cents</small></>
                  : <><b className="dim">—</b><small>escuchando…</small></>}
              </div>
              <div className="tr-live-meta">
                <div className="tr-level"><div style={{ width: `${Math.round(live.level * 100)}%` }} /></div>
                <span className="tr-mono">{live.elapsed.toFixed(1)} s / {MAX_REC} s</span>
              </div>
              <button className="tr-stop" onClick={stopRec}>■ Parar y analizar</button>
            </div>
            <canvas ref={canvasRef} className="tr-trail" />
            <div className="tr-legend small"><span><i className="sw sw-blue" />Tu voz en directo (últimos 6 s)</span><span>Filas = notas; las grises son las teclas negras</span><span>«cents»: cuánto te desvías de la nota exacta (±50)</span></div>
          </div>
        )}
        {msg && <div className={"tr-msg " + msg.kind}>{msg.text}<button className="tr-x" onClick={() => setMsg(null)} aria-label="Cerrar">×</button></div>}
      </section>

      {/* ---------- Resultados ---------- */}
      {cur && tab !== "historico" && (
        <section id="tr-results" className="tr-results">
          <div className="tr-card tr-summary">
            <div className="tr-title-row">
              <input className="tr-title" value={cur.name} onChange={(e) => updateCur((c) => ({ ...c, name: e.target.value }))} aria-label="Nombre de la melodía" />
              <div className="tr-export">
                <button className="tr-btn" onClick={() => setExportOpen((v) => !v)}>Exportar ▾</button>
                {exportOpen && (
                  <div className="tr-menu" onClick={() => setExportOpen(false)}>
                    <button onClick={exportMidi}>MIDI (.mid) <small>GarageBand, Logic, cualquier DAW</small></button>
                    <button onClick={exportXml}>MusicXML <small>MuseScore, Sibelius, Finale, Dorico</small></button>
                    <button onClick={exportTxt}>Copiar como texto <small>notas por compás + acordes</small></button>
                    <button onClick={doPrint}>Imprimir / PDF <small>partitura en hoja</small></button>
                  </div>
                )}
              </div>
            </div>
            <p className="tr-print-meta">{keyName(key, prefs.naming)} · compás {tsLabel(ts)} · ♩ = {bpm}{capo ? ` · cejilla en el ${capo}` : ""}</p>
            <div className="tr-facts">
              <Fact wide label="Fuente" hint="Cómo se ha leído el audio: como voz (una sola línea sostenida: tarareo, canto, silbido) o como instrumento (piano, guitarra: notas con ataque, a veces varias a la vez; se saca la melodía más aguda).">
                {cur.both ? (
                  <div className="tr-seg">
                    <button className={cur.mode !== "instrumento" ? "on" : ""} onClick={() => switchMode("voz")}>Voz o silbido</button>
                    <button className={cur.mode === "instrumento" ? "on" : ""} onClick={() => switchMode("instrumento")}>Instrumento</button>
                  </div>
                ) : <b>{cur.mode === "instrumento" ? "Instrumento" : "Voz o silbido"}</b>}
                <small>{cur.why ? (cur.why === "elegido a mano" ? "elegido a mano" : `Elegido porque ${cur.why}.`) : ""}{cur.mode === "instrumento" && cur.both?.instrumento.inst ? ` ${cur.both.instrumento.inst.polyIndex >= 0.4 ? "Con acompañamiento: melodía separada por registros." : "Una sola línea."}` : ""}</small>
              </Fact>
              <Fact wide label="Tonalidad" hint="La «casa» de la melodía: la nota en la que descansa y si suena mayor (alegre) o menor (melancólica).">
                <select value={`${cur.key.tonic}-${cur.key.mode}`} onChange={(e) => { const [t, m] = e.target.value.split("-"); updateCur((c) => ({ ...c, key: { tonic: Number(t), mode: m as Key["mode"] } })); }}>
                  {keyGuesses.map((k) => <option key={`${k.tonic}-${k.mode}`} value={`${k.tonic}-${k.mode}`}>{keyName(transposeKey(k, transpose), prefs.naming)} · encaje {Math.min(100, Math.max(0, Math.round(k.score * 100)))} %</option>)}
                </select>
                <small>{keySignatureText(key)}{transpose ? ` · transportada ${transpose > 0 ? "+" : ""}${transpose}` : ""}</small>
              </Fact>
              <Fact wide label="Tempo" hint="Velocidad: negras por minuto. Si sale la mitad o el doble de lo que cantabas, usa ÷2 o ×2.">
                <div className="tr-stepper">
                  <button onClick={() => requantize({ bpm: Math.max(30, Math.round(bpm / 2)) })}>÷2</button>
                  <button onClick={() => requantize({ bpm: Math.max(30, bpm - 2) })}>−</button>
                  <b className="tr-mono">♩ {bpm}</b>
                  <button onClick={() => requantize({ bpm: Math.min(260, bpm + 2) })}>+</button>
                  <button onClick={() => requantize({ bpm: Math.min(260, bpm * 2) })}>×2</button>
                </div>
              </Fact>
              <Fact wide label="Compás" hint="Cuántos pulsos hay en cada compás: 4/4 (la mayoría de canciones), 3/4 (vals), 2/4 (marcha), 6/8 (balanceo).">
                <div className="tr-seg">
                  {TIME_SIGS.map((t) => <button key={tsLabel(t)} className={tsLabel(t) === tsLabel(ts) ? "on" : ""} onClick={() => requantize({ ts: t })}>{tsLabel(t)}</button>)}
                  <button onClick={autoMeter} title="Volver a detectar tempo y compás">auto</button>
                </div>
              </Fact>
              <Fact label="Afinación" hint="Cuánto tarareabas, de media, por encima o por debajo de las notas exactas del piano. Se compensa antes de poner las notas.">
                <b className="tr-mono">{Math.round(cur.offset * 100) > 0 ? "+" : ""}{Math.round(cur.offset * 100)} cents</b>
                <small>{Math.abs(cur.offset) < 0.12 ? "muy afinado" : Math.abs(cur.offset) < 0.3 ? "ligeramente desplazado" : "bastante desplazado (compensado)"}</small>
              </Fact>
              <Fact label="Notas" hint="Número de notas detectadas y la más grave y más aguda (tu tesitura en esta melodía).">
                <b className="tr-mono">{notes.length}</b>
                <small>{NAME(range.lo)} – {NAME(range.hi)}</small>
              </Fact>
              <Fact wide label="Transportar" hint="Sube o baja toda la melodía (y los acordes) en semitonos, para cantarla o tocarla más cómodo.">
                <div className="tr-stepper">
                  <button onClick={() => setTranspose((t) => t - 12)}>−8ª</button>
                  <button onClick={() => setTranspose((t) => t - 1)}>−</button>
                  <b className="tr-mono">{transpose > 0 ? "+" : ""}{transpose}</b>
                  <button onClick={() => setTranspose((t) => t + 1)}>+</button>
                  <button onClick={() => setTranspose((t) => t + 12)}>+8ª</button>
                </div>
              </Fact>
            </div>
          </div>

          {/* Pestañas */}
          <nav className="tr-tabs" role="tablist">
            {([["partitura", "Partitura"], ["piano", "Piano"], ["guitarra", "Guitarra"], ["detalle", "Detalle"], ["historico", "Histórico"]] as [Tab, string][]).map(([id, label]) => (
              <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? "on" : ""} onClick={() => setTab(id)}>{label}</button>
            ))}
          </nav>

          {tab === "partitura" && (
            <div className="tr-card">
              <div className="tr-view-opts">
                <div className="tr-seg">
                  <button className={prefs.layout === "pagina" ? "on" : ""} onClick={() => P("layout", "pagina")}>En líneas</button>
                  <button className={prefs.layout === "linea" ? "on" : ""} onClick={() => P("layout", "linea")}>Una línea</button>
                </div>
                <div className="tr-seg">
                  <button className={prefs.naming === "es" ? "on" : ""} onClick={() => P("naming", "es")}>Do Re Mi</button>
                  <button className={prefs.naming === "en" ? "on" : ""} onClick={() => P("naming", "en")}>C D E</button>
                </div>
                <label className="tr-check"><input type="checkbox" checked={prefs.showNames} onChange={(e) => P("showNames", e.target.checked)} /> Nombres</label>
                <label className="tr-check"><input type="checkbox" checked={prefs.showChords} onChange={(e) => P("showChords", e.target.checked)} /> Acordes</label>
                <label className="tr-check"><input type="checkbox" checked={prefs.showTab} onChange={(e) => P("showTab", e.target.checked)} /> Tablatura</label>
                <label className="tr-inline">Clave <select value={prefs.clef} onChange={(e) => P("clef", e.target.value as Prefs["clef"])}><option value="auto">automática</option><option value="treble">de sol</option><option value="bass">de fa</option></select></label>
              </div>
              {notation({ tab: prefs.showTab })}
              {editor}
              {legendScore()}
              <HowTo title="Cómo leer la partitura">
                <ul>
                  <li><b>Pentagrama:</b> cinco líneas; cuanto más arriba está una nota, más aguda suena. Debajo de cada nota tienes su nombre ({prefs.naming === "es" ? "Do4 = do central del piano" : "C4 = middle C"}).</li>
                  <li><b>Clave</b> {clef === "treble" ? "de sol (𝄞)" : "de fa (𝄢), porque tu voz es grave"}; <b>armadura</b> ({keySignatureText(key)}): las alteraciones del principio valen para toda la pieza.</li>
                  <li><b>Compás {tsLabel(ts)}:</b> {ts.num} {ts.den === 4 ? "negras" : "corcheas"} por compás; las barras verticales separan compases.</li>
                  <li><b>Figuras</b> (duración): redonda (cabeza hueca, sin plica) = 4 pulsos; blanca (hueca con plica) = 2; negra (rellena) = 1; corchea (con una barra o corchete) = ½; semicorchea (dos) = ¼. El <b>puntillo</b> suma la mitad. Una <b>ligadura</b> (arco) une dos notas en una sola más larga.</li>
                  <li><b>Acordes</b> en azul encima: cifrado americano (C = Do, D = Re, E = Mi, F = Fa, G = Sol, A = La, B = Si; «m» menor, «7» séptima).</li>
                  <li>Toca una nota para oírla y corregirla. Con «Una línea» la partitura se desplaza sola mientras suena.</li>
                </ul>
              </HowTo>
            </div>
          )}

          {tab === "piano" && (
            <div className="tr-card">
              <div className="tr-view-opts">
                <label className="tr-inline">Nombres en teclas <select value={prefs.pianoLabels} onChange={(e) => P("pianoLabels", e.target.value as Prefs["pianoLabels"])}><option value="used">las de la melodía</option><option value="c">solo los Do</option><option value="all">todas</option></select></label>
                <div className="tr-seg">
                  <button className={prefs.naming === "es" ? "on" : ""} onClick={() => P("naming", "es")}>Do Re Mi</button>
                  <button className={prefs.naming === "en" ? "on" : ""} onClick={() => P("naming", "en")}>C D E</button>
                </div>
              </div>
              <div className="tr-keys-wrap">
                <PianoKeys low={Math.min(range.lo, 48)} high={Math.max(range.hi, 72)} used={new Map(notes.reduce((m, n) => m.set(n.midi, (m.get(n.midi) ?? 0) + 1), new Map<number, number>()))}
                  active={play.idx >= 0 ? notes[play.idx]?.midi ?? null : selIdx >= 0 ? notes[selIdx].midi : null}
                  activeFinger={play.idx >= 0 ? fingering[play.idx] : selIdx >= 0 ? fingering[selIdx] : null}
                  chord={activeChordEv ? pianoVoicing(activeChordEv.chord) : []} naming={prefs.naming} labels={prefs.pianoLabels}
                  onKey={(m) => playNote("piano", m, 0.7)} />
              </div>
              <div className="tr-now">
                {activeNote ? <>Ahora: <b>{NAME(activeNote.midi)}</b> con el dedo <b>{fingering[notes.indexOf(activeNote)]}</b> ({FINGER[fingering[notes.indexOf(activeNote)]]})</> : "Pulsa Tocar o toca una nota de la partitura para ver qué tecla y qué dedo."}
                {activeChordEv && <> · mano izquierda: <b className="tr-blue">{chordSymbol(activeChordEv.chord, key, "en")}</b> ({chordNotes(activeChordEv.chord, key, prefs.naming).join("–")})</>}
              </div>
              <div className="tr-legend">
                <span><i className="sw sw-green" />Tecla que suena (número = dedo)</span>
                <span><i className="sw sw-gold" />Teclas de la melodía (más intensas = más usadas)</span>
                <span><i className="sw sw-lblue" />Acorde de la mano izquierda</span>
                <span>Toca una tecla para oírla</span>
              </div>
              {notation({ fingering: true })}
              {editor}
              {legendScore(<span><b className="tr-brown">3</b> Dedo sugerido (mano derecha)</span>)}
              <h3>Acordes para la mano izquierda</h3>
              <div className="tr-pchords">
                {uniqueChords.map((c) => {
                  const on = !!activeChordEv && activeChordEv.chord.root === c.root && activeChordEv.chord.q === c.q;
                  return (
                    <div key={`${c.root}${c.q}`} className={"tr-pchord" + (on ? " is-on" : "")}>
                      <b>{chordSymbol(c, key, "en")}</b> <span>{chordLongName(c, key)} · {c.roman}</span>
                      <PianoKeys low={48} high={59 + (c.root + 7 > 11 ? 12 : 0)} used={new Map()} active={null} chord={pianoVoicing(c)} naming={prefs.naming} labels="c" height={70} onKey={(m) => playNote("piano", m, 0.7)} />
                      <small>{chordNotes(c, key, prefs.naming).join(" – ")}</small>
                    </div>
                  );
                })}
              </div>
              <HowTo title="Cómo leer la vista de piano">
                <ul>
                  <li><b>Dedos</b> (mano derecha): 1 pulgar, 2 índice, 3 corazón, 4 anular, 5 meñique. El número sale encima de cada nota y sobre la tecla mientras suena.</li>
                  <li>La digitación evita estiramientos incómodos: el pulgar pasa por debajo para subir y los dedos cruzan por encima para bajar, como en las escalas.</li>
                  <li><b>Mano izquierda:</b> acordes básicos (fundamental, tercera y quinta) en la zona del Do3; tócalos al empezar cada compás.</li>
                  <li>El teclado empieza siempre en un Do; el Do central es {prefs.naming === "es" ? "Do4" : "C4"}.</li>
                </ul>
              </HowTo>
            </div>
          )}

          {tab === "guitarra" && (
            <div className="tr-card">
              {capoInfo.capo > 0 && (
                <div className={"tr-capo" + (prefs.useCapo ? " on" : "")}>
                  <div>
                    <b>Cejilla en el traste {capoInfo.capo}</b>: {prefs.useCapo ? "estás viendo las formas fáciles" : "los acordes salen más fáciles"} — {uniqueChords.map((c) => chordSymbol({ root: c.root - capoInfo.capo, q: c.q }, transposeKey(key, -capoInfo.capo), "en")).join(", ")} en vez de {uniqueChords.map((c) => chordSymbol(c, key, "en")).join(", ")}.
                  </div>
                  <label className="tr-check"><input type="checkbox" checked={prefs.useCapo} onChange={(e) => P("useCapo", e.target.checked)} /> Usar cejilla</label>
                </div>
              )}
              <h3>Acordes {capo ? `(con cejilla en el ${capo}; los nombres son las formas)` : ""}</h3>
              <div className="tr-prog">
                {chords.map((c, i) => (
                  <span key={i} className={"tr-prog-c" + (i === play.chord ? " on" : "")} style={{ flexGrow: c.dur }}>
                    <small>c.{Math.floor(c.start / barLen(ts)) + 1}</small>
                    <b>{chordSymbol({ root: c.chord.root - capo, q: c.chord.q }, transposeKey(key, -capo), "en")}</b>
                    <i>{c.chord.roman}</i>
                  </span>
                ))}
              </div>
              <div className="tr-chords">
                {uniqueChords.map((c) => {
                  const sh = guitarShape(c.root - capo, c.q);
                  const on = !!activeChordEv && activeChordEv.chord.root === c.root && activeChordEv.chord.q === c.q;
                  const shapeName = chordSymbol({ root: c.root - capo, q: c.q }, transposeKey(key, -capo), "en");
                  return (
                    <button key={`${c.root}${c.q}`} className={"tr-chord-card" + (on ? " is-on" : "")} onClick={() => { unlockAudio(2); const c2 = getCtx(); const { bus } = newBus(); strum(shapeMidis(sh, capo), c2.currentTime + 0.05, 1.6, bus); }}>
                      <ChordDiagram shape={sh} title={shapeName} sub={capo ? `suena ${chordSymbol(c, key, "en")}` : chordLongName(c, key)} active={on} strum={on ? play.strum : -1} naming={prefs.naming} capo={capo} />
                      <small>{sh.kind === "open" ? "Postura abierta" : sh.kind === "barre" ? "Con barra (cejilla con el índice)" : "Postura móvil"}</small>
                    </button>
                  );
                })}
              </div>
              <div className="tr-legend">
                <span><b>●</b> Dedo pisando (1 índice … 4 meñique)</span>
                <span><b>○</b> Cuerda al aire</span>
                <span><b>×</b> Cuerda que no se toca</span>
                <span><b>▬</b> Barra: el índice pisa varias cuerdas</span>
                <span><b className="tr-mono">3</b> a la izquierda: traste de partida</span>
                <span><i className="sw sw-green" />Acorde que suena; la cuerda verde va de grave a aguda en el rasgueo</span>
              </div>
              <h3>Melodía en el mástil</h3>
              <div className="tr-fret-wrap"><Fretboard positions={tab6.pos} active={play.idx >= 0 ? play.idx : selIdx} capo={capo} naming={prefs.naming} activeMidi={activeNote ? activeNote.midi + tab6.shift : null} /></div>
              <div className="tr-legend">
                <span><i className="sw sw-green" />Nota que suena</span>
                <span><i className="sw sw-gold" />Posiciones que usa la melodía</span>
                <span>Arriba la 1ª cuerda (Mi agudo), abajo la 6ª (Mi grave)</span>
                {tab6.shift !== 0 && <span>Tocada {Math.abs(tab6.shift / 12)} octava{Math.abs(tab6.shift) > 12 ? "s" : ""} {tab6.shift > 0 ? "más aguda" : "más grave"} para que quepa en el mástil</span>}
              </div>
              {notation({ tab: true })}
              {editor}
              <HowTo title="Cómo leer la vista de guitarra">
                <ul>
                  <li><b>Diagramas:</b> el mástil en vertical, como si miraras la guitarra de frente; las líneas verticales son las cuerdas (6ª grave a la izquierda) y las horizontales, los trastes.</li>
                  <li><b>Tablatura (TAB):</b> seis líneas = seis cuerdas (la de arriba es la 1ª, Mi agudo). El número es el traste que pisas; 0 = al aire. Va alineada con la partitura, así que el ritmo lo lees arriba.</li>
                  <li><b>Cejilla (capo):</b> una pinza que acorta todas las cuerdas a la vez. Con ella puedes tocar formas abiertas y fáciles en tonalidades difíciles; los trastes de la tablatura se cuentan desde la cejilla.</li>
                  <li><b>Grados</b> (I, IV, V7…): la función del acorde en la tonalidad; V→I es la cadencia que «cierra».</li>
                  <li>Toca un diagrama para oír el acorde rasgueado.</li>
                </ul>
              </HowTo>
            </div>
          )}

          {tab === "detalle" && (
            <div className="tr-card">
              <h3>Curva de tono</h3>
              {contour && (
                <div className="tr-chart-wrap">
                  <PitchChart contour={contour} notes={cur.raw.map((r) => ({ start: r.start, end: r.end, midi: r.midi + transpose }))} offset={cur.offset - transpose} naming={prefs.naming}
                    others={(cur.others ?? []).map((o) => ({ ...o, midi: o.midi + transpose }))} flat={cur.mode === "instrumento"}
                    playhead={play.mode === "original" ? play.t : null} selected={selIdx >= 0 && notes[selIdx].raw != null ? notes[selIdx].raw! : -1}
                    onSelect={(ri) => { const i = notes.findIndex((n) => n.raw === ri); if (i >= 0) onSelect(i); }} />
                </div>
              )}
              <div className="tr-legend">
                <span><i className="sw sw-line" />{cur.mode === "instrumento" ? "Altura medida en cada ataque" : "Tu voz: tono medido cada 10 ms"}</span>
                <span><i className="sw sw-green" />Nota de la melodía (rectángulo: inicio, final y altura)</span>
                {cur.mode === "instrumento" && (cur.others?.length ?? 0) > 0 && <span><i className="sw sw-gray" />Acompañamiento (otras notas que suenan)</span>}
                <span><i className="sw sw-red" />Posición al escuchar tu grabación</span>
                <span>Eje vertical: notas (filas grises = teclas negras); horizontal: segundos</span>
              </div>
              <HowTo title="Cómo leer la curva">
                {cur.mode === "instrumento" && <p>Leído como <b>instrumento</b>: cada ataque se analiza por separado (qué notas aparecen nuevas en el espectro) y la melodía es la voz más aguda. Las notas grises son el acompañamiento que se ha apartado (bajo, arpegio, mano izquierda).</p>}
                <p>La línea azul es lo que {cur.mode === "instrumento" ? "sonó" : "cantaste"}, ya desplazada {Math.round(cur.offset * 100)} cents para compensar la afinación media. Si la línea se queda dentro del rectángulo, la nota está bien detectada. Las ondulaciones son vibrato; las rampas al empezar, el «deslizamiento» natural de la voz. Si dos notas iguales salen unidas, usa «partir en dos»; si una nota sale partida, «unir con la siguiente».</p>
              </HowTo>
              {cur.pcm && <button className="tr-btn" onClick={() => (play.on && play.mode === "original" ? stopAll() : startOriginal())}>{play.on && play.mode === "original" ? "■ Parar" : "▶ Escuchar mi grabación"}</button>}

              <h3>Notas, una a una</h3>
              <div className="tr-table-wrap">
                <table className="tr-table">
                  <thead><tr><th>#</th><th>Nota</th><th>Figura</th><th>Compás · tiempo</th><th>Inicio</th><th title="Desviación respecto a la nota exacta, después de compensar tu afinación media">Desafine</th><th>Dedo</th><th>Cuerda · traste</th></tr></thead>
                  <tbody>
                    {notes.map((n, i) => {
                      const r = n.raw != null ? cur.raw[n.raw] : null;
                      const t = tab6.pos[i];
                      return (
                        <tr key={n.id} className={(i === play.idx ? "on " : "") + (i === selIdx ? "sel" : "")} onClick={() => onSelect(i)}>
                          <td>{i + 1}</td>
                          <td><b>{NAME(n.midi)}</b></td>
                          <td>{durationName(n.dur)}</td>
                          <td className="tr-mono">{Math.floor(n.start / barLen(ts)) + 1} · {((n.start % barLen(ts)) / beatLen(ts) + 1).toFixed(n.start % beatLen(ts) ? 2 : 0)}</td>
                          <td className="tr-mono">{r ? r.start.toFixed(2) + " s" : "—"}</td>
                          <td className="tr-mono">{r && r.midi + 0 === (n.midi - transpose) ? `${r.cents > 0 ? "+" : ""}${r.cents}` : "editada"}</td>
                          <td>{fingering[i]}</td>
                          <td>{t ? `${6 - t.string}ª · ${t.fret}` : "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <h3>Ajustes de detección</h3>
              {cur.mode === "instrumento" && cur.pcm ? (
                <div className="tr-sliders">
                  <Slider label="Sensibilidad de ataques" value={instOpt.sensitivity} min={0} max={1} step={0.05} unit="" hint="Más alta: detecta ataques suaves (notas ligadas, rasgueo flojo). Más baja: ignora ruidos y rebotes." onChange={(v) => reInstrument({ ...instOpt, sensitivity: v })} />
                  <label className="tr-slider">
                    <span>Separar melodía y acompañamiento</span>
                    <div className="tr-seg">
                      {([["auto", "Automático"], ["si", "Sí"], ["no", "No"]] as [InstOptions["separate"], string][]).map(([v, l]) => (
                        <button key={v} className={instOpt.separate === v ? "on" : ""} onClick={(e) => { e.preventDefault(); reInstrument({ ...instOpt, separate: v }); }}>{l}</button>
                      ))}
                    </div>
                    <small>«Sí» aparta las notas graves que suenan bajo una nota aguda (mano izquierda, bajo, arpegio). «No» toma siempre la nota más aguda de cada ataque.</small>
                  </label>
                  <button className="tr-btn ghost" onClick={() => reInstrument(DEFAULT_INST)}>Restablecer</button>
                </div>
              ) : cur.track ? (
                <div className="tr-sliders">
                  <Slider label="Nota más corta" value={seg.minNoteMs} min={40} max={160} step={10} unit=" ms" hint="Sube si aparecen notas fantasma muy cortas; baja si se pierden notas rápidas." onChange={(v) => reSegment({ ...seg, minNoteMs: v })} />
                  <Slider label="Cambio de nota" value={seg.splitSemitones} min={0.4} max={1} step={0.05} unit=" st" hint="Cuánto tiene que moverse la voz (en semitonos) para contar como nota nueva. Sube si el vibrato crea notas de más." onChange={(v) => reSegment({ ...seg, splitSemitones: v })} />
                  <Slider label="Separar repetidas" value={seg.dipRatio} min={0.3} max={0.85} step={0.05} unit="" hint="Qué caída de volumen separa dos notas iguales. Sube si se juntan notas repetidas; baja si se parten notas largas." onChange={(v) => reSegment({ ...seg, dipRatio: v })} />
                  <Slider label="Claridad mínima" value={seg.minConf} min={0.3} max={0.85} step={0.05} unit="" hint="Cuánto tiene que «sonar a nota» un instante para usarlo. Sube con ruido de fondo." onChange={(v) => reSegment({ ...seg, minConf: v })} />
                  <button className="tr-btn ghost" onClick={() => reSegment(DEFAULT_SEG)}>Restablecer</button>
                </div>
              ) : <p className="tr-hint">La grabación original no se guarda en el histórico (solo las notas), así que para cambiar la detección hay que volver a grabar o subir el audio.</p>}
            </div>
          )}
        </section>
      )}

      {tab === "historico" && (
        <section className="tr-card tr-hist" id="tr-results">
          <div className="tr-hist-h">
            <h2>Histórico</h2>
            {cur && <button className="tr-btn ghost" onClick={() => setTab("partitura")}>← Volver a «{cur.name}»</button>}
          </div>
          <p className="tr-hint">Cada melodía que analizas se guarda sola en este navegador (hasta 60). No se sube a ningún sitio: para pasarlas a otro dispositivo, exporta la copia e impórtala allí.</p>
          <div className="tr-row">
            <button className="tr-btn" onClick={exportAll} disabled={!hist.length}>Exportar copia (.json)</button>
            <button className="tr-btn" onClick={() => importRef.current?.click()}>Importar copia</button>
            <input ref={importRef} type="file" accept="application/json,.json" hidden onChange={(e) => importAll(e.target.files?.[0])} />
          </div>
          {!hist.length && <p className="tr-empty">Aún no hay nada. Graba algo o prueba un ejemplo.</p>}
          <div className="tr-hist-list">
            {hist.map((h) => (
              <div key={h.id} className={"tr-hist-item" + (cur?.id === h.id ? " is-cur" : "")}>
                <MiniRoll notes={h.notes} />
                <div className="tr-hist-txt">
                  <input value={h.name} onChange={(e) => {
                    const name = e.target.value;
                    setHist((all) => { const next = all.map((x) => (x.id === h.id ? { ...x, name } : x)); saveHist(next); return next; });
                    if (cur?.id === h.id) setCur((c) => (c ? { ...c, name } : c));
                  }} aria-label="Nombre" />
                  <small>{fmtDate(h.created)} · {keyName(h.key, prefs.naming)} · {tsLabel(h.ts)} · ♩{h.bpm} · {h.notes.length} notas{h.edited ? " · editada" : ""} · {h.source === "voz" ? "grabada" : h.source === "archivo" ? "audio subido" : "ejemplo"}</small>
                </div>
                <div className="tr-hist-act">
                  <button className="tr-btn" onClick={() => openSaved(h)}>Abrir</button>
                  {wipe === h.id
                    ? <button className="tr-btn danger" onClick={() => { setHist((all) => { const next = all.filter((x) => x.id !== h.id); saveHist(next); return next; }); setWipe(null); }}>¿Seguro?</button>
                    : <button className="tr-btn ghost" onClick={() => setWipe(h.id)}>Borrar</button>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ---------- Barra de reproducción ---------- */}
      {cur && notes.length > 0 && tab !== "historico" && (
        <div className={"tr-transport" + (more ? " is-more" : "")}>
          <button className={"tr-play" + (play.on && play.mode === "score" ? " on" : "")} onClick={() => (play.on ? stopAll() : startScore())}>
            {play.on ? "■ Parar" : "▶ Tocar"}
          </button>
          <label className="tr-inline"><span className="tr-hide-m">Instrumento</span>
            <select value={prefs.instrument} onChange={(e) => P("instrument", e.target.value as Instrument)}><option value="piano">Piano</option><option value="guitarra">Guitarra</option><option value="flauta">Flauta</option></select>
          </label>
          <label className="tr-inline tr-x-more">Acordes
            <select value={prefs.accomp} onChange={(e) => P("accomp", e.target.value as Prefs["accomp"])}><option value="ninguno">sin acompañar</option><option value="guitarra">rasgueo de guitarra</option><option value="piano">piano</option></select>
          </label>
          <label className="tr-inline tr-x-more">Acordes por compás
            <select value={prefs.perBar} onChange={(e) => P("perBar", Number(e.target.value) as 1 | 2)}><option value={1}>1</option><option value={2}>2</option></select>
          </label>
          <label className="tr-inline tr-x-more">Velocidad
            <input type="range" min={0.5} max={1.5} step={0.05} value={prefs.speed} onChange={(e) => P("speed", Number(e.target.value))} />
            <span className="tr-mono">{Math.round(prefs.speed * 100)} %</span>
          </label>
          <label className="tr-check tr-x-more"><input type="checkbox" checked={prefs.metro} onChange={(e) => P("metro", e.target.checked)} /> Metrónomo</label>
          <label className="tr-check tr-x-more"><input type="checkbox" checked={prefs.loop} onChange={(e) => P("loop", e.target.checked)} /> Bucle</label>
          <button className="tr-btn ghost tr-more-btn" onClick={() => setMore((v) => !v)} aria-expanded={more}>{more ? "Menos" : "Más…"}</button>
          {cur.pcm && <button className="tr-btn ghost" onClick={() => (play.on && play.mode === "original" ? stopAll() : startOriginal())}>{play.on && play.mode === "original" ? "■ Mi voz" : "▶ Mi voz"}</button>}
          {play.on && play.mode === "score" && activeNote && <span className="tr-now-pill"><b>{NAME(activeNote.midi)}</b>{activeChordEv ? <> · <b className="tr-blue">{chordSymbol(activeChordEv.chord, key, "en")}</b></> : null}</span>}
        </div>
      )}

      <footer className="tr-foot">Tarareo · todo se calcula en tu dispositivo; la grabación no sale de aquí · <button className="tr-link" onClick={() => setHelp("como")}>Cómo funciona</button></footer>

      {/* ---------- Ayuda ---------- */}
      {help && (
        <div className="tr-help" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) setHelp(null); }}>
          <div className="tr-help-box">
            <div className="tr-help-tabs">
              {([["intro", "Introducción"], ["guia", "Guía de uso"], ["leer", "Cómo leer"], ["como", "Cómo funciona"], ["glosario", "Glosario"]] as [NonNullable<typeof help>, string][]).map(([id, l]) => (
                <button key={id} className={help === id ? "on" : ""} onClick={() => setHelp(id)}>{l}</button>
              ))}
              <button className="tr-x" onClick={() => setHelp(null)} aria-label="Cerrar">×</button>
            </div>
            <div className="tr-help-body">{HELP[help]}</div>
            {help === "intro" && <div className="tr-row"><button className="tr-btn primary" onClick={() => setHelp(null)}>Empezar</button><button className="tr-btn" onClick={() => { setHelp(null); tryExample("oda"); }}>Ver un ejemplo</button></div>}
          </div>
        </div>
      )}
    </div>
  );
}

/** Pasos para dar permiso al micrófono según el navegador. */
function MicHelp() {
  if (isIOS && isChromeIOS) return (
    <div className="tr-steps-box">
      <b>Chrome no tiene permiso para usar el micrófono.</b> En iPhone, Chrome no muestra candado: el permiso está en dos sitios.
      <ol>
        <li><b>Ajustes del iPhone</b> (la app con la rueda) › baja hasta <b>Chrome</b> › activa <b>Micrófono</b>.</li>
        <li>Si alguna vez dijiste «No permitir» a joaco.org: en Chrome, <b>⋯</b> (abajo a la derecha) › <b>Configuración</b> › <b>Configuración de sitios</b> (o «Configuración de contenido») › <b>Micrófono</b>, y quita joaco.org de los bloqueados.</li>
        <li>Cierra Chrome del todo (desliza hacia arriba en el selector de apps), vuelve a abrir joaco.org y pulsa <b>Grabar</b>. Cuando pregunte, elige <b>Permitir</b>.</li>
      </ol>
      Si sigue sin dejarte: ábrelo en <b>Safari</b>, o graba con <b>Notas de voz</b> y usa «Subir audio».
    </div>
  );
  if (isIOS && isFirefoxIOS) return (
    <div className="tr-steps-box"><b>Firefox no tiene permiso para el micrófono.</b> Ajustes del iPhone › Firefox › activa Micrófono; luego recarga y elige «Permitir». También puedes usar Safari o «Subir audio».</div>
  );
  if (isIOS) return (
    <div className="tr-steps-box">
      <b>Safari no tiene permiso para usar el micrófono.</b>
      <ol>
        <li>Toca <b>«aA»</b> (o el icono de la izquierda) en la barra de direcciones › <b>Ajustes del sitio web</b> › <b>Micrófono</b> › <b>Permitir</b> (o «Preguntar»).</li>
        <li>Si no aparece: Ajustes del iPhone › <b>Apps</b> › <b>Safari</b> › <b>Micrófono</b> › Preguntar o Permitir.</li>
        <li>Recarga la página y pulsa <b>Grabar</b>.</li>
      </ol>
    </div>
  );
  return (
    <div className="tr-steps-box">
      <b>El navegador no tiene permiso para usar el micrófono.</b> Pulsa el icono a la izquierda de la dirección (candado o ajustes) › Micrófono › Permitir, y recarga.
      En Android, además: Ajustes › Apps › Chrome › Permisos › Micrófono.
    </div>
  );
}
function SoundHelp() {
  return (
    <div className="tr-steps-box">
      <b>El navegador no ha dejado sonar el audio.</b> Toca otra vez «Tocar». Si sigue sin oírse: sube el volumen con los botones laterales (no el del timbre) y comprueba que no hay unos auriculares Bluetooth conectados.
    </div>
  );
}

function HowTo({ title, children }: { title: string; children: ReactNode }) {
  return <details className="tr-howto"><summary>{title}</summary><div>{children}</div></details>;
}

const FINGER: Record<number, string> = { 1: "pulgar", 2: "índice", 3: "corazón", 4: "anular", 5: "meñique" };

function Fact({ label, hint, children, wide }: { label: string; hint: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={"tr-fact" + (wide ? " wide" : "")}>
      <span className="tr-fact-l" title={hint}>{label} <i aria-hidden>ⓘ</i></span>
      <div className="tr-fact-v">{children}</div>
      <p className="tr-fact-h">{hint}</p>
    </div>
  );
}
function Slider({ label, value, min, max, step, unit, hint, onChange }: { label: string; value: number; min: number; max: number; step: number; unit: string; hint: string; onChange: (v: number) => void }) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  return (
    <label className="tr-slider">
      <span>{label} <b className="tr-mono">{v}{unit}</b></span>
      <input type="range" min={min} max={max} step={step} value={v} onChange={(e) => setV(Number(e.target.value))} onPointerUp={() => onChange(v)} onKeyUp={() => onChange(v)} onTouchEnd={() => onChange(v)} />
      <small>{hint}</small>
    </label>
  );
}

// ---------- Textos de ayuda ----------
const GLOSARIO: [string, string][] = [
  ["Nota", "Un sonido con una altura concreta. En español: Do, Re, Mi, Fa, Sol, La, Si; en inglés: C, D, E, F, G, A, B."],
  ["Octava", "La distancia entre una nota y la siguiente con el mismo nombre (Do4 → Do5). El número indica en qué octava está."],
  ["Do central (Do4)", "El Do del centro del piano (C4). En algunos conservatorios españoles se le llama Do3: es la misma tecla."],
  ["Semitono", "La distancia más pequeña del piano: de una tecla a la de al lado, sea blanca o negra."],
  ["Cent", "Una centésima de semitono. Sirve para medir lo afinado que estás: ±50 cents es el máximo antes de pasar a la nota vecina."],
  ["Afinación", "Lo cerca que está tu voz de las notas exactas. Si vas siempre un poco alto o bajo, la app lo compensa."],
  ["Alteraciones", "♯ sostenido (medio tono más alto), ♭ bemol (medio tono más bajo), ♮ becuadro (anula la alteración)."],
  ["Tonalidad", "La nota en la que «descansa» una melodía y su modo: mayor (suena luminoso) o menor (más melancólico)."],
  ["Armadura", "Las alteraciones al principio de cada línea: valen para todas las notas con ese nombre."],
  ["Compás", "La agrupación de pulsos: 4/4 = cuatro negras por compás; 3/4 = tres (vals); 6/8 = dos grupos de tres corcheas."],
  ["Pulso / tiempo", "El latido regular de la música, el que marcarías con el pie."],
  ["Tempo (♩ = 90)", "Velocidad en negras por minuto (BPM). 60 es un pulso por segundo."],
  ["Anacrusa", "Notas que van antes del primer tiempo fuerte, como el «Cum-ple» de «Cumpleaños feliz»."],
  ["Figuras", "Duración de la nota: redonda 4 pulsos, blanca 2, negra 1, corchea ½, semicorchea ¼."],
  ["Puntillo", "Punto detrás de la nota: le suma la mitad de su duración (negra con puntillo = 1½)."],
  ["Ligadura", "Arco que une dos notas iguales en una sola más larga, a menudo a través de la barra de compás."],
  ["Silencio", "Un tiempo sin sonido; tiene una figura para cada duración."],
  ["Clave de sol / de fa", "El signo del principio que fija qué nota es cada línea. Sol para voces y notas agudas; fa para voces graves."],
  ["Líneas adicionales", "Rayitas cortas para notas que se salen del pentagrama por arriba o por abajo."],
  ["Acorde", "Tres o más notas que suenan a la vez. Mayor (Do-Mi-Sol), menor (La-Do-Mi), séptima (Sol-Si-Re-Fa)."],
  ["Cifrado americano", "Nombres cortos de acordes: C = Do, Am = La menor, G7 = Sol séptima, F♯m = Fa sostenido menor."],
  ["Grados (I, IV, V7)", "El papel del acorde dentro de la tonalidad: I es el de reposo, V (o V7) el de tensión que pide volver a I."],
  ["Cadencia", "Final de frase. V → I es la más rotunda; IV → I suena a «amén»."],
  ["Digitación", "Qué dedo usar en cada nota. Piano: 1 pulgar … 5 meñique. Guitarra (mano izquierda): 1 índice … 4 meñique."],
  ["Traste", "Las barras metálicas del mástil. Pisar en el traste 3 = subir 3 semitonos la cuerda."],
  ["Cuerdas", "En guitarra se numeran de aguda a grave: 1ª Mi agudo, 2ª Si, 3ª Sol, 4ª Re, 5ª La, 6ª Mi grave."],
  ["Tablatura (TAB)", "Escritura para guitarra: seis líneas que son las cuerdas y números que indican el traste."],
  ["Cejilla (capo)", "Pinza que se pone en un traste y sube todas las cuerdas a la vez, para usar posturas fáciles en otras tonalidades."],
  ["Barra (barré)", "Pisar varias cuerdas con el dedo índice estirado. Acordes como Fa o Si menor la necesitan."],
  ["Transportar", "Subir o bajar toda la melodía el mismo número de semitonos: suena igual, pero más agudo o más grave."],
  ["MIDI", "Formato que guarda notas (no sonido). Se abre en GarageBand, Logic, Ableton, MuseScore…"],
  ["MusicXML", "Formato de partitura: MuseScore, Sibelius, Finale o Dorico lo abren con figuras, acordes y armadura."],
  ["YIN", "El método que estima el tono: mide cuánto se parece la onda a sí misma desplazada y busca el periodo que repite."],
  ["Ataque", "El instante en que empieza una nota: el golpe del martillo en el piano o la pulsación de la cuerda."],
  ["Armónicos", "Las frecuencias múltiplas (×2, ×3, ×4…) que acompañan a cada nota y le dan su timbre. Una nota grave tiene armónicos que caen sobre notas agudas: por eso hay que «restarlos» para no confundirlos."],
  ["Acompañamiento", "Las notas que sostienen la melodía: bajo, acordes, arpegios o la mano izquierda del piano."],
  ["Polifonía", "Varias notas sonando a la vez. La voz es monofónica (una nota); el piano y la guitarra, polifónicos."],
];

const HELP: Record<"intro" | "guia" | "leer" | "como" | "glosario", ReactNode> = {
  intro: (
    <div>
      <h2>Tarareo</h2>
      <p className="tr-lead">Tararea, canta, silba o toca una melodía (piano, guitarra…) y la conviertes en partitura, con las teclas del piano (y qué dedo usar) y los acordes y la tablatura de guitarra.</p>
      <ol className="tr-steps">
        <li><b>Graba</b> o sube un audio: tu voz, un silbido o un instrumento (también con acompañamiento: saca la melodía).</li>
        <li><b>Revisa</b> tonalidad, tempo y compás; corrige notas tocándolas.</li>
        <li><b>Toca</b>: la nota que suena se ilumina en verde en la partitura, el teclado y el mástil.</li>
        <li><b>Exporta</b> a MIDI o MusicXML, imprime, o vuelve a ella desde el histórico.</li>
      </ol>
      <p className="tr-hint">Todo se calcula en tu dispositivo: la grabación no se envía a ningún servidor. El histórico se guarda en este navegador.</p>
    </div>
  ),
  guia: (
    <div>
      <h2>Guía de uso</h2>
      <ol className="tr-steps">
        <li><b>Grabar.</b> Pulsa el botón rojo y permite el micrófono. Mientras tarareas ves la nota que estás cantando y lo afinado que vas. Pulsa «Parar y analizar».</li>
        <li><b>Cómo tararear.</b> Di «ta», «na» o «lo» en cada nota, sin arrastrar de una a otra. Las notas repetidas necesitan un pequeño corte para separarse. Mejor sin música de fondo y con el móvil a un palmo.</li>
        <li><b>Claqueta</b> (opcional). Antes de grabar suenan los pulsos de un compás al tempo que elijas; si sigues ese pulso, el ritmo sale mucho más exacto.</li>
        <li><b>Subir audio.</b> Vale una nota de voz del iPhone (.m4a), .mp3 o .wav. Un piano o una guitarra solos funcionan bien, también con acompañamiento (mano izquierda, arpegios); una canción completa con banda y voz, no.</li>
        <li><b>Qué suena.</b> La app decide sola si es una voz o un instrumento (lo ves en «Fuente» y puedes cambiarlo sin volver a grabar). Si lo sabes de antemano, elígelo antes de grabar.</li>
        <li><b>Resumen.</b> Arriba ves tonalidad, tempo, compás, afinación y tesitura. Puedes cambiarlos: tempo ÷2 o ×2 si sale a la mitad o al doble, otro compás, otra tonalidad de la lista (ordenada por encaje).</li>
        <li><b>Corregir.</b> Toca una nota en la partitura (o en la tabla de Detalle): súbela o bájala, alárgala, bórrala, pártela en dos o únela con la siguiente. «Deshacer» recupera el paso anterior.</li>
        <li><b>Escuchar.</b> «Tocar» suena con piano, guitarra o flauta; puedes añadir los acordes (rasgueo o piano), metrónomo, bucle y bajar la velocidad para practicar. «Mi voz» reproduce tu grabación.</li>
        <li><b>Piano.</b> Teclado con la nota y el dedo, partitura con la digitación y los acordes para la mano izquierda.</li>
        <li><b>Guitarra.</b> Diagramas de los acordes, cejilla recomendada si simplifica las posturas, progresión por compases, melodía en el mástil y tablatura.</li>
        <li><b>Detalle.</b> Curva de tu voz frente a las notas asignadas, tabla nota a nota y ajustes de detección para afinar el resultado.</li>
        <li><b>Exportar.</b> MIDI, MusicXML, texto o imprimir (en «Imprimir», elige «Guardar como PDF» para tener el PDF).</li>
      </ol>
      <h3>En iPhone</h3>
      <ul>
        <li><b>Micrófono en Chrome:</b> Ajustes del iPhone › Chrome › Micrófono activado; luego, en joaco.org, «Permitir» cuando pregunte. Chrome en iPhone no tiene candado en la barra de direcciones.</li>
        <li><b>Micrófono en Safari:</b> «aA» en la barra › Ajustes del sitio web › Micrófono › Permitir.</li>
        <li><b>Sonido:</b> la app suena aunque el móvil esté en modo silencio; el volumen es el de multimedia (botones laterales). Si no oyes nada, vuelve a tocar «Tocar» y revisa que no haya auriculares Bluetooth conectados.</li>
      </ul>
    </div>
  ),
  leer: (
    <div>
      <h2>Cómo leer cada vista</h2>
      <h3>Partitura</h3>
      <p>Cuanto más arriba, más aguda. La forma de la nota indica cuánto dura (redonda 4 pulsos, blanca 2, negra 1, corchea ½). Encima, en azul, los acordes; debajo, el nombre de cada nota; con «Tablatura», los trastes de guitarra alineados.</p>
      <h3>Piano</h3>
      <p>En verde la tecla que suena con el número del dedo (1 pulgar … 5 meñique). En dorado las teclas que usa la melodía; en azul el acorde de la mano izquierda.</p>
      <h3>Guitarra</h3>
      <p>Diagramas con el mástil en vertical: puntos = dedos (1 índice … 4 meñique), ○ al aire, × no suena, barra = índice estirado. La tablatura tiene arriba la 1ª cuerda (Mi agudo); los números son trastes.</p>
      <h3>Curva de tono</h3>
      <p>La línea azul es tu voz y los rectángulos verdes las notas asignadas. Si la línea se sale de su rectángulo, esa nota puede estar mal: corrígela.</p>
      <h3>Escenarios: qué cambia cuando tocas los ajustes</h3>
      <ul>
        <li><b>Tempo ÷2 / ×2:</b> mismas notas, otras figuras (las negras pasan a corcheas o a blancas). Elige la versión que se lee más fácil.</li>
        <li><b>Compás:</b> cambia dónde caen las barras y qué notas son tiempo fuerte; también cambian los acordes, porque se eligen por compás.</li>
        <li><b>Tonalidad:</b> no mueve ninguna nota; cambia cómo se escriben (♯ o ♭) y qué acordes se proponen.</li>
        <li><b>Transportar:</b> mueve todas las notas y acordes a la vez; sirve para adaptarlo a tu voz o buscar acordes más fáciles.</li>
        <li><b>Cejilla:</b> no cambia lo que suena, solo las posturas que pisas.</li>
        <li><b>Acordes por compás (1 o 2):</b> con 2, la armonía cambia más a menudo y sigue la melodía más de cerca.</li>
      </ul>
    </div>
  ),
  como: (
    <div>
      <h2>Cómo funciona</h2>
      <ol className="tr-steps">
        <li><b>¿Voz o instrumento?</b> Se analiza de las dos maneras. Si las notas se apagan solas tras el ataque (piano, guitarra) o suenan varias a la vez con un tono poco «limpio», se lee como instrumento; si son sostenidas y de un solo tono, como voz.</li>
        <li><b>Voz: tono.</b> El audio se baja a 16 kHz y, cada 10 ms, el algoritmo YIN estima la frecuencia fundamental: compara la onda consigo misma desplazada y busca el desplazamiento que más se repite.</li>
        <li><b>Limpieza.</b> Se descartan los instantes sin tono claro o con poco volumen, se corrigen saltos de octava y se suaviza con una mediana.</li>
        <li><b>Notas.</b> Una nota nueva empieza cuando la voz se estabiliza en otro semitono durante al menos 30 ms, o cuando el volumen cae claramente (notas repetidas). Las notas de menos de 70 ms se descartan o se unen a la vecina.</li>
        <li><b>Instrumento: ataques.</b> Se buscan los instantes en que el espectro crece de golpe («spectral flux»). En cada uno se compara el espectro de justo después con el de justo antes, y por suma de armónicos se identifican las notas que suenan; las que crecen son las nuevas. Cada nota encontrada se «resta» (solo la parte que le toca de cada armónico, para no borrar otra nota que lo comparta) y se busca la siguiente.</li>
        <li><b>Instrumento: melodía.</b> Si hay acompañamiento, se separan registros (agrupando las notas en grave y agudo, y apartando el bajo) y las notas graves que suenan bajo una nota aguda se toman por acompañamiento. La melodía es la nota más aguda de cada ataque. Los golpes del bajo ayudan a colocar las barras de compás.</li>
        <li><b>Afinación.</b> Se calcula tu desvío medio respecto a las notas del piano (media circular en cents) y se compensa antes de redondear cada nota.</li>
        <li><b>Ritmo.</b> Se prueban tempos de 40 a 200 y se elige el que mejor encaja los intervalos entre notas en una rejilla de semicorcheas (favoreciendo negras y corcheas); luego se corrige la deriva. Para el compás se comparan 4/4, 3/4, 6/8 y 3/8 según dónde caen las notas largas (y el bajo, si lo hay), y se busca si hay anacrusa.</li>
        <li><b>Tonalidad.</b> Perfiles de Krumhansl–Kessler: cuánto suena cada nota, comparado con el perfil típico de las 24 tonalidades.</li>
        <li><b>Acordes.</b> En cada compás (o medio) se puntúan los acordes de la tonalidad según cuántas notas de la melodía contienen, y el algoritmo de Viterbi elige la secuencia más natural (cadencias V→I, IV→V, ii→V…).</li>
        <li><b>Piano.</b> Digitación con un modelo de distancias cómodas entre pares de dedos (Parncutt) y programación dinámica.</li>
        <li><b>Guitarra.</b> Cada nota puede tocarse en varias cuerdas: se elige la combinación que minimiza los saltos de mano. La cejilla se recomienda si cambia acordes con barra por posturas abiertas.</li>
      </ol>
      <h3>Cómo se ha comprobado</h3>
      <p>Con un banco de canciones conocidas de dominio público (Para Elisa con las dos manos y pedal, Romance anónimo con su arpegio, Oda a la alegría, Martinillo, Cumpleaños feliz, Estrellita, Noche de paz y Greensleeves) interpretadas como tarareo, silbido, piano y guitarra, con eco, ruido, desafinación y tempos distintos. Se acierta de media el 99 % de las notas de la melodía; con acompañamiento, entre el 90 y el 99 %.</p>
      <h3>Límites</h3>
      <p>Una canción completa con banda, voces y batería sale mal: separar eso necesita modelos entrenados. Con mucho eco o pedal, alguna nota del acompañamiento puede colarse en la melodía. En melodías de notas todas iguales el compás (3/4 o 4/4) puede salir cambiado, y entre 3/8 y 6/8, o entre corcheas y semicorcheas, la elección es de escritura: cámbialo con un toque.</p>
      <h3>Privacidad</h3>
      <p>Todo ocurre en el navegador: ni el audio ni las notas salen del dispositivo. El histórico guarda solo las notas, no la grabación.</p>
    </div>
  ),
  glosario: (
    <div>
      <h2>Glosario</h2>
      <dl className="tr-gloss">{GLOSARIO.map(([t, d]) => <div key={t}><dt>{t}</dt><dd>{d}</dd></div>)}</dl>
    </div>
  ),
};

// ---------- Estilos (tema claro) ----------
const CSS = `
.tr-root{--bg:#f6f0e6;--card:#fffdf8;--ink:#1d2433;--ink2:#334155;--muted:#64748b;--line:#e6dccb;--brand:#1f4e79;--brand2:#2b6cb0;--green:#16a34a;--amber:#d97706;--red:#dc2626;--blue:#1d4ed8;
  min-height:100vh;background:var(--bg);color:var(--ink);font-family:'Sora',system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.45;
  padding:14px 14px 120px;max-width:1140px;margin:0 auto;box-sizing:border-box}
.tr-root *{box-sizing:border-box}
.tr-root ol{list-style:decimal}
.tr-root ul{list-style:disc}
.tr-root h1,.tr-root h2,.tr-root h3{font-family:'Fraunces',Georgia,serif;font-weight:650;letter-spacing:-.01em;margin:0}
.tr-root h2{font-size:21px}
.tr-root h3{font-size:17px;margin:18px 0 8px}
.tr-mono{font-family:'IBM Plex Mono',ui-monospace,monospace}
.tr-head{display:flex;justify-content:space-between;align-items:flex-end;gap:10px;flex-wrap:wrap;margin:4px 2px 12px}
.tr-head h1{font-size:34px;line-height:1;color:var(--brand)}
.tr-head p{margin:4px 0 0;color:var(--muted);font-size:14px}
.tr-head-actions{display:flex;gap:6px;flex-wrap:wrap}
.tr-card{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:16px;margin-bottom:12px;box-shadow:0 1px 2px rgba(29,36,51,.04)}
.tr-btn{border:1px solid #cdbfa8;background:#fff;color:var(--ink);border-radius:10px;padding:8px 12px;font:inherit;font-size:14px;cursor:pointer}
.tr-btn:hover{border-color:var(--brand)}
.tr-btn:disabled{opacity:.5;cursor:default}
.tr-btn.ghost{background:transparent}
.tr-btn.primary{background:var(--brand);color:#fff;border-color:var(--brand)}
.tr-btn.danger,.tr-editor .danger{background:#fee2e2;border-color:#fca5a5;color:#991b1b}
.tr-chip{border:1px solid #cdbfa8;background:#fbf6ec;border-radius:999px;padding:6px 11px;font:inherit;font-size:13px;cursor:pointer;color:var(--ink)}
.tr-chip:hover{background:#f3e9d6}
.tr-row{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}
.tr-x{border:0;background:transparent;font-size:22px;line-height:1;cursor:pointer;color:var(--muted);padding:0 4px}
.tr-link{border:0;background:none;color:var(--brand2);text-decoration:underline;cursor:pointer;font:inherit;padding:0}
.tr-hint{color:var(--muted);font-size:13px;margin:6px 0}
.tr-tip{color:var(--muted);font-size:13px;margin:12px 0 0}
.tr-blue{color:var(--blue)} .tr-brown{color:#7c2d12} .tr-gray{color:#8a8f9c}
/* captura */
.tr-capture h2{margin-bottom:12px}
.tr-capture-row{display:flex;gap:16px;align-items:center;flex-wrap:wrap}
.tr-rec{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;width:112px;height:112px;border-radius:999px;border:0;cursor:pointer;
  background:radial-gradient(circle at 35% 30%,#ef4444,#b91c1c);color:#fff;font:inherit;font-weight:600;box-shadow:0 6px 18px rgba(220,38,38,.35),inset 0 -4px 0 rgba(0,0,0,.15)}
.tr-rec:disabled{opacity:.5}
.tr-rec-dot{width:22px;height:22px;border-radius:999px;background:#fff}
.tr-capture-alt{display:flex;flex-direction:column;gap:10px;flex:1;min-width:220px}
.tr-examples{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
.tr-examples span{font-size:13px;color:var(--muted)}
.tr-capture-opts{display:flex;gap:14px;flex-wrap:wrap;align-items:center;margin-top:12px;font-size:14px}
.tr-capture-opts small{color:var(--muted)}
.tr-check{display:inline-flex;gap:6px;align-items:center;cursor:pointer;font-size:14px;white-space:nowrap}
.tr-inline{display:inline-flex;gap:6px;align-items:center;font-size:14px;flex-wrap:wrap}
.tr-inline input[type=number]{width:62px}
.tr-root select,.tr-root input[type=number]{font:inherit;font-size:14px;border:1px solid #cdbfa8;border-radius:8px;padding:5px 7px;background:#fff;color:var(--ink)}
.tr-progress{position:relative;margin-top:14px;height:28px;border-radius:8px;background:#efe6d6;overflow:hidden}
.tr-progress div{position:absolute;inset:0 auto 0 0;background:linear-gradient(90deg,#93c5fd,#60a5fa);transition:width .2s}
.tr-progress span{position:relative;display:block;text-align:center;line-height:28px;font-size:13px}
.tr-capture.is-rec{border-color:#fca5a5;box-shadow:0 0 0 3px rgba(220,38,38,.12)}
.tr-live-top{display:flex;gap:14px;align-items:center;flex-wrap:wrap}
.tr-live-note{display:flex;flex-direction:column;min-width:120px}
.tr-live-note b{font-family:'Fraunces',Georgia,serif;font-size:44px;line-height:1;color:var(--brand)}
.tr-live-note b.dim{color:#cbd5e1}
.tr-live-note b.tr-count{color:var(--red)}
.tr-live-note small{color:var(--muted);font-family:'IBM Plex Mono',monospace}
.tr-live-note small.ok{color:var(--green)}
.tr-live-meta{flex:1;min-width:140px;display:flex;flex-direction:column;gap:6px;font-size:13px;color:var(--muted)}
.tr-level{height:10px;border-radius:99px;background:#efe6d6;overflow:hidden}
.tr-level div{height:100%;background:linear-gradient(90deg,#22c55e,#eab308 75%,#ef4444);transition:width .07s}
.tr-stop{border:0;background:var(--red);color:#fff;border-radius:12px;padding:12px 16px;font:inherit;font-weight:600;cursor:pointer}
.tr-trail{width:100%;height:170px;margin-top:12px;border-radius:12px;background:#fffdf8;border:1px solid var(--line);display:block}
.tr-msg{position:relative;margin-top:12px;padding:10px 34px 10px 12px;border-radius:10px;font-size:14px}
.tr-msg.error{background:#fef2f2;border:1px solid #fecaca;color:#7f1d1d}
.tr-msg.info{background:#eff6ff;border:1px solid #bfdbfe;color:#1e3a8a}
.tr-msg .tr-x{position:absolute;right:6px;top:6px}
.tr-steps-box ol{margin:6px 0;padding-left:20px}
.tr-steps-box li{margin:4px 0}
/* resumen */
.tr-title-row{display:flex;gap:10px;align-items:center;justify-content:space-between;margin-bottom:12px}
.tr-title{flex:1;min-width:0;font-family:'Fraunces',Georgia,serif;font-size:22px;font-weight:650;border:1px solid transparent;border-radius:8px;background:transparent;padding:3px 6px;color:var(--ink)}
.tr-title:hover,.tr-title:focus{border-color:var(--line);background:#fff;outline:none}
.tr-export{position:relative}
.tr-menu{position:absolute;right:0;top:calc(100% + 6px);z-index:20;background:#fff;border:1px solid var(--line);border-radius:12px;box-shadow:0 10px 28px rgba(0,0,0,.12);padding:6px;min-width:250px}
.tr-menu button{display:block;width:100%;text-align:left;border:0;background:none;padding:9px 10px;border-radius:8px;font:inherit;font-size:14px;cursor:pointer;color:var(--ink)}
.tr-menu button:hover{background:#f6f0e6}
.tr-menu small{display:block;color:var(--muted);font-size:12px}
.tr-print-meta{display:none}
.tr-facts{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(215px,100%),1fr));gap:10px}
.tr-fact{min-width:0}
.tr-fact{border:1px solid var(--line);border-radius:12px;padding:9px 11px;background:#fffaf1}
.tr-fact-l{font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);cursor:help}
.tr-fact-l i{font-style:normal;opacity:.6}
.tr-fact-v{display:flex;flex-direction:column;gap:3px;margin-top:4px}
.tr-fact-v b{font-size:18px}
.tr-fact-v small{color:var(--muted);font-size:12px}
.tr-fact-v select{max-width:100%}
.tr-fact-h{font-size:11.5px;color:var(--muted);margin:6px 0 0;line-height:1.35}
.tr-stepper{display:flex;align-items:center;gap:4px}
.tr-stepper button,.tr-seg button{border:1px solid #cdbfa8;background:#fff;border-radius:8px;padding:5px 8px;font:inherit;font-size:13px;cursor:pointer;color:var(--ink);min-width:32px}
.tr-stepper b{min-width:56px;text-align:center}
.tr-seg{display:inline-flex;gap:0;flex-wrap:wrap}
.tr-seg button{border-radius:0;margin-left:-1px}
.tr-seg button:first-child{border-radius:8px 0 0 8px;margin-left:0}
.tr-seg button:last-child{border-radius:0 8px 8px 0}
.tr-seg button.on{background:var(--brand);color:#fff;border-color:var(--brand);position:relative}
/* pestañas */
.tr-tabs{display:flex;gap:6px;overflow-x:auto;margin:4px 0 10px;padding-bottom:2px;scrollbar-width:none}
.tr-tabs button{flex:none;border:1px solid var(--line);background:#fffaf1;border-radius:999px;padding:8px 15px;font:inherit;font-size:14px;cursor:pointer;color:var(--ink2)}
.tr-tabs button.on{background:var(--ink);color:#fff;border-color:var(--ink)}
.tr-view-opts{display:flex;gap:10px 14px;flex-wrap:wrap;align-items:center;margin-bottom:10px}
/* partitura */
.tr-score{overflow-x:auto;overflow-y:hidden;border:1px solid var(--line);border-radius:12px;background:#fffdf8;padding:6px 0;-webkit-overflow-scrolling:touch}
.tr-score.is-page{overflow-x:hidden;overflow-y:auto;max-height:70vh}
.tr-systems{display:flex;flex-direction:column;gap:4px}
.tr-score-svg{display:block;flex:none}
.tr-score:not(.is-page) .tr-systems{width:max-content}
.tr-glyph{font-family:'Noto Music','Bravura Text','Segoe UI Symbol','Apple Symbols',serif}
.tr-ts{font-family:'Fraunces',Georgia,serif}
.tr-chordsym{font-family:'Sora',system-ui,sans-serif}
.tr-name{font-family:'Sora',system-ui,sans-serif}
.tr-legend{display:flex;flex-wrap:wrap;gap:6px 16px;margin:10px 2px;font-size:12.5px;color:var(--ink2)}
.tr-legend.small{font-size:12px;color:var(--muted)}
.tr-legend span{display:inline-flex;align-items:center;gap:6px}
.sw{display:inline-block;width:14px;height:14px;border-radius:4px;border:1px solid rgba(0,0,0,.15)}
.sw-green{background:#16a34a}.sw-amber{background:transparent;border:2px dashed #d97706}.sw-gold{background:rgba(251,191,36,.55)}.sw-lblue{background:#bfdbfe}.sw-blue{background:#1d4ed8;height:4px;border:0}
.sw-line{background:#1d4ed8;height:3px;border:0;width:18px}.sw-gray{background:rgba(100,116,139,.3);border:1px solid rgba(100,116,139,.6)}
.tr-source{display:flex;gap:8px;align-items:center;flex-wrap:wrap;font-size:13px;color:var(--muted)}
.tr-chip small{color:var(--muted);font-size:11px}.sw-red{background:#dc2626;width:3px;height:14px;border:0}
.tr-howto{margin-top:10px;border:1px solid var(--line);border-radius:12px;background:#fffaf1}
.tr-howto summary{cursor:pointer;padding:10px 12px;font-weight:600;font-size:14px}
.tr-howto>div{padding:0 14px 10px;font-size:14px}
.tr-howto ul{margin:0;padding-left:18px}
.tr-howto li{margin:4px 0}
.tr-editor{margin-top:10px;border:1px dashed var(--amber);background:#fffbeb;border-radius:12px;padding:10px 12px}
.tr-editor-h{display:flex;gap:10px;align-items:baseline;flex-wrap:wrap}
.tr-editor-h span{color:var(--muted);font-size:13px}
.tr-editor-h .tr-x{margin-left:auto}
.tr-editor-b{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}
.tr-editor-b button{border:1px solid #e5c79a;background:#fff;border-radius:9px;padding:7px 10px;font:inherit;font-size:13px;cursor:pointer;color:var(--ink)}
.tr-editor-b button:disabled{opacity:.45}
/* piano */
.tr-keys-wrap,.tr-fret-wrap,.tr-chart-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch;padding-bottom:4px}
.tr-piano{display:block}
.tr-now{margin:10px 2px;font-size:14px;min-height:22px}
.tr-pchords{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px}
.tr-pchord{border:1px solid var(--line);border-radius:12px;padding:10px;background:#fffaf1;display:flex;flex-direction:column;gap:6px}
.tr-pchord.is-on{border-color:var(--blue);box-shadow:0 0 0 2px rgba(29,78,216,.18)}
.tr-pchord b{font-size:18px;color:var(--blue)}
.tr-pchord span,.tr-pchord small{font-size:12.5px;color:var(--muted)}
/* guitarra */
.tr-capo{display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap;border:1px solid #bfdbfe;background:#eff6ff;border-radius:12px;padding:10px 12px;font-size:14px}
.tr-prog{display:flex;gap:4px;overflow-x:auto;padding-bottom:4px}
.tr-prog-c{min-width:58px;flex-basis:0;display:flex;flex-direction:column;align-items:flex-start;border:1px solid var(--line);border-radius:10px;padding:6px 8px;background:#fffaf1}
.tr-prog-c small{font-size:10.5px;color:var(--muted)}
.tr-prog-c b{font-size:17px;color:var(--blue)}
.tr-prog-c i{font-style:normal;font-size:11px;color:var(--muted);font-family:'Fraunces',serif}
.tr-prog-c.on{background:#dcfce7;border-color:var(--green)}
.tr-prog-c.on b{color:#15803d}
.tr-chords{display:flex;gap:10px;flex-wrap:wrap;margin-top:12px}
.tr-chord-card{display:flex;flex-direction:column;align-items:center;gap:2px;border:1px solid var(--line);background:#fffaf1;border-radius:14px;padding:8px 8px 6px;cursor:pointer;font:inherit;color:var(--ink)}
.tr-chord-card small{font-size:11px;color:var(--muted)}
.tr-chord-card.is-on{border-color:var(--green);box-shadow:0 0 0 3px rgba(22,163,74,.18);background:#f0fdf4}
.tr-fret{display:block}
/* detalle */
.tr-chart{display:block}
.tr-chart-wrap{border:1px solid var(--line);border-radius:12px;background:#fffdf8}
.tr-table-wrap{overflow-x:auto;border:1px solid var(--line);border-radius:12px;max-height:420px;overflow-y:auto}
.tr-table{border-collapse:collapse;width:100%;font-size:13px;background:#fff}
.tr-table th{position:sticky;top:0;background:#f6f0e6;text-align:left;padding:7px 9px;font-weight:600;white-space:nowrap;font-size:12px;color:var(--ink2)}
.tr-table td{padding:6px 9px;border-top:1px solid #f0e8da;white-space:nowrap;cursor:pointer}
.tr-table tr.on td{background:#dcfce7}
.tr-table tr.sel td{background:#fef3c7}
.tr-sliders{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px;align-items:start}
.tr-slider{display:flex;flex-direction:column;gap:4px;font-size:14px;border:1px solid var(--line);border-radius:12px;padding:10px;background:#fffaf1}
.tr-slider small{color:var(--muted);font-size:12px}
.tr-slider input{width:100%}
/* histórico */
.tr-hist-h{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap}
.tr-hist-list{display:flex;flex-direction:column;gap:8px;margin-top:8px}
.tr-hist-item{display:flex;gap:12px;align-items:center;border:1px solid var(--line);border-radius:12px;padding:8px 10px;background:#fffaf1;flex-wrap:wrap}
.tr-hist-item.is-cur{border-color:var(--brand)}
.tr-hist-txt{flex:1;min-width:180px;display:flex;flex-direction:column}
.tr-hist-txt input{font:inherit;font-weight:600;border:1px solid transparent;background:transparent;border-radius:6px;padding:2px 4px;color:var(--ink)}
.tr-hist-txt input:focus{border-color:var(--line);background:#fff;outline:none}
.tr-hist-txt small{color:var(--muted);font-size:12px;padding-left:4px}
.tr-hist-act{display:flex;gap:6px}
.tr-empty{color:var(--muted);text-align:center;padding:20px}
/* transporte */
.tr-transport{position:fixed;left:0;right:0;bottom:0;z-index:50;display:flex;gap:8px 14px;align-items:center;flex-wrap:wrap;
  padding:10px 14px calc(10px + env(safe-area-inset-bottom,0px)) 56px;background:rgba(255,253,248,.96);backdrop-filter:blur(8px);border-top:1px solid var(--line);box-shadow:0 -4px 18px rgba(0,0,0,.06);font-size:13px}
.tr-transport .tr-inline,.tr-transport .tr-check{font-size:13px}
.tr-transport select{font-size:13px;padding:4px 6px}
.tr-transport input[type=range]{width:90px}
.tr-play{border:0;background:var(--green);color:#fff;border-radius:999px;padding:10px 20px;font:inherit;font-weight:700;font-size:15px;cursor:pointer;box-shadow:0 3px 10px rgba(22,163,74,.3)}
.tr-play.on{background:var(--ink)}
.tr-more-btn{display:none;padding:6px 10px}
@media (max-width:640px){.tr-hide-m{display:none}}
@media (max-width:640px){.tr-more-btn{display:inline-block}}
.tr-now-pill{background:#dcfce7;border-radius:999px;padding:4px 10px;color:#14532d}
.tr-foot{text-align:center;color:var(--muted);font-size:12px;margin:18px 0 8px}
/* ayuda */
.tr-help{position:fixed;inset:0;z-index:200;background:rgba(29,36,51,.35);display:flex;align-items:flex-start;justify-content:center;padding:4vh 10px;overflow:auto}
.tr-help-box{background:var(--card);border-radius:18px;max-width:760px;width:100%;padding:14px 18px 18px;box-shadow:0 20px 60px rgba(0,0,0,.25)}
.tr-help-tabs{display:flex;gap:6px;flex-wrap:wrap;align-items:center;border-bottom:1px solid var(--line);padding-bottom:10px;margin-bottom:12px}
.tr-help-tabs button:not(.tr-x){border:1px solid var(--line);background:#fffaf1;border-radius:999px;padding:6px 12px;font:inherit;font-size:13px;cursor:pointer;color:var(--ink2)}
.tr-help-tabs button.on{background:var(--ink);color:#fff}
.tr-help-tabs .tr-x{margin-left:auto}
.tr-help-body{font-size:14.5px}
.tr-help-body h2{margin-bottom:8px}
.tr-help-body h3{font-size:16px;margin:14px 0 4px}
.tr-help-body p{margin:6px 0}
.tr-lead{font-size:16px}
.tr-steps{padding-left:20px}
.tr-steps li{margin:6px 0}
.tr-gloss{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:8px;margin:0}
.tr-gloss div{border:1px solid var(--line);border-radius:10px;padding:8px 10px;background:#fffaf1}
.tr-gloss dt{font-weight:700}
.tr-gloss dd{margin:2px 0 0;font-size:13px;color:var(--ink2)}
@media (max-width:640px){
  .tr-root{padding:10px 10px 150px}
  .tr-head h1{font-size:28px}
  .tr-rec{width:96px;height:96px}
  .tr-card{padding:12px;border-radius:14px}
  .tr-facts{grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:8px}
  .tr-fact.wide{grid-column:span 2}
  .tr-root{overflow-x:hidden}
  .tr-fact-h{display:none}
  .tr-transport{gap:6px 10px;padding-left:52px}
  .tr-transport:not(.is-more) .tr-x-more{display:none}
  .tr-transport{gap:6px 6px}
  .tr-play{padding:9px 14px;font-size:14px}
  .tr-transport select{max-width:96px}
  .tr-transport .tr-btn{padding:6px 9px;font-size:13px}
  .tr-transport .tr-inline{gap:4px}
}
@media print{
  body{background:#fff}
  nav,.tr-head-actions,.tr-capture,.tr-tabs,.tr-transport,.tr-foot,.tr-view-opts,.tr-editor,.tr-howto,.tr-legend,.tr-summary .tr-facts,.tr-export,.tr-help{display:none!important}
  .tr-root{padding:0;background:#fff}
  .tr-print-meta{display:block;margin:0 0 8px;font-size:13px;color:#334155}
  .tr-card{border:0;box-shadow:none;padding:0}
  .tr-score{border:0;max-height:none!important;overflow:visible!important}
  .tr-keys-wrap,.tr-fret-wrap,.tr-chords,.tr-pchords,.tr-prog,.tr-chart-wrap,.tr-table-wrap,.tr-sliders,.tr-card h3,.tr-now,.tr-capo{display:none!important}
}
`;
