/* ============================================================
   TARAREO · Teclado, mástil, diagramas de acordes y curva de tono
   ============================================================ */
import { useEffect, useRef, type ReactNode } from "react";
import { GUITAR_OPEN, STRING_NAMES_EN, STRING_NAMES_ES, isBlack, plainName, type Naming, type Shape, type TabPos } from "./music";

const INK = "#1d2433", SOFT = "#94a3b8", GREEN = "#16a34a", BLUE = "#2563eb", AMBER = "#d97706";

// ---------- Teclado de piano ----------
export function PianoKeys(p: {
  low: number; high: number; used: Map<number, number>; active: number | null; activeFinger?: number | null;
  chord: number[]; naming: Naming; labels: "c" | "used" | "all"; onKey?: (m: number) => void; height?: number;
}) {
  const lo = p.low - (((p.low % 12) + 12) % 12);          // empieza en Do
  const hi = p.high + (11 - (((p.high % 12) + 12) % 12)); // termina en Si
  const whites: number[] = [], blacks: number[] = [];
  for (let m = lo; m <= hi; m++) (isBlack(m) ? blacks : whites).push(m);
  const ww = 26, wh = p.height ?? 118, bw = 16, bh = Math.round(wh * 0.6);
  const width = whites.length * ww + 2;
  const xOfWhite = new Map(whites.map((m, i) => [m, 1 + i * ww]));
  const maxUse = Math.max(1, ...Array.from(p.used.values()));
  const fill = (m: number, black: boolean) => {
    if (m === p.active) return GREEN;
    if (p.chord.includes(m)) return black ? "#1e40af" : "#bfdbfe";
    const u = p.used.get(m);
    if (u) return black ? `rgba(180,83,9,${0.55 + 0.45 * (u / maxUse)})` : `rgba(251,191,36,${0.18 + 0.42 * (u / maxUse)})`;
    return black ? "#1f2937" : "#ffffff";
  };
  const label = (m: number) => p.labels === "all" || (p.labels === "c" && m % 12 === 0) || (p.labels === "used" && (p.used.has(m) || m === p.active || m % 12 === 0));
  const keys: ReactNode[] = [];
  whites.forEach((m) => {
    const x = xOfWhite.get(m)!;
    keys.push(
      <g key={m} onClick={() => p.onKey?.(m)} style={{ cursor: "pointer" }}>
        <rect x={x} y={1} width={ww - 1} height={wh} rx={3} fill={fill(m, false)} stroke="#9ca3af" />
        {label(m) && <text x={x + ww / 2 - 0.5} y={wh - 8} fontSize={9.5} textAnchor="middle" fill={m === p.active ? "#fff" : "#475569"} fontWeight={m % 12 === 0 ? 700 : 500}>{plainName(m, p.naming)}</text>}
        {m === p.active && p.activeFinger ? <text x={x + ww / 2 - 0.5} y={wh - 26} fontSize={14} textAnchor="middle" fill="#fff" fontWeight={800}>{p.activeFinger}</text> : null}
      </g>,
    );
  });
  blacks.forEach((m) => {
    const x = xOfWhite.get(m - 1)! + ww - bw / 2 - 0.5;
    keys.push(
      <g key={m} onClick={() => p.onKey?.(m)} style={{ cursor: "pointer" }}>
        <rect x={x} y={1} width={bw} height={bh} rx={2} fill={fill(m, true)} stroke="#111827" />
        {m === p.active && p.activeFinger ? <text x={x + bw / 2} y={bh - 8} fontSize={12} textAnchor="middle" fill="#fff" fontWeight={800}>{p.activeFinger}</text> : null}
      </g>,
    );
  });
  return <svg width={width} height={wh + 3} viewBox={`0 0 ${width} ${wh + 3}`} className="tr-piano" role="img" aria-label="Teclado de piano">{keys}</svg>;
}

// ---------- Mástil de guitarra (melodía) ----------
export function Fretboard(p: { positions: (TabPos | null)[]; active: number; capo: number; naming: Naming; activeMidi: number | null }) {
  const used = p.positions.filter(Boolean) as TabPos[];
  const maxF = Math.max(5, ...used.map((u) => u.fret + p.capo)) + 1;
  const frets = Math.min(15, Math.max(7, maxF));
  const fw = 34, sh = 17, left = 50, top = 18;
  const width = left + frets * fw + 10, height = top + 5 * sh + 26;
  const names = p.naming === "es" ? STRING_NAMES_ES : STRING_NAMES_EN;
  const yOf = (s: number) => top + (5 - s) * sh; // cuerda 1 (aguda) arriba
  const xOf = (f: number) => (f === 0 ? left - 12 : left + (f - 0.5) * fw);
  const count = new Map<string, number>();
  used.forEach((u) => count.set(`${u.string}:${u.fret}`, (count.get(`${u.string}:${u.fret}`) ?? 0) + 1));
  const act = p.positions[p.active] ?? null;
  const el: ReactNode[] = [];
  el.push(<rect key="wood" x={left} y={top - 6} width={frets * fw} height={5 * sh + 12} fill="#f3e3c3" rx={3} />);
  [3, 5, 7, 9, 15].forEach((f) => f <= frets && el.push(<circle key={`in${f}`} cx={left + (f - 0.5) * fw} cy={top + 2.5 * sh} r={4.5} fill="#d6c2a0" />));
  if (frets >= 12) { el.push(<circle key="in12a" cx={left + 11.5 * fw} cy={top + 1.5 * sh} r={4.5} fill="#d6c2a0" />); el.push(<circle key="in12b" cx={left + 11.5 * fw} cy={top + 3.5 * sh} r={4.5} fill="#d6c2a0" />); }
  for (let f = 0; f <= frets; f++) {
    el.push(<line key={`f${f}`} x1={left + f * fw} x2={left + f * fw} y1={top - 6} y2={top + 5 * sh + 6} stroke={f === 0 ? INK : "#a8a29e"} strokeWidth={f === 0 ? 4 : 1.5} />);
    if (f > 0) el.push(<text key={`fn${f}`} x={left + (f - 0.5) * fw} y={height - 4} fontSize={10} textAnchor="middle" fill={SOFT}>{f}</text>);
  }
  for (let s = 0; s < 6; s++) {
    el.push(<line key={`s${s}`} x1={left} x2={left + frets * fw} y1={yOf(s)} y2={yOf(s)} stroke="#57534e" strokeWidth={0.7 + (5 - s) * 0.3} />);
    el.push(<text key={`sn${s}`} x={4} y={yOf(s)} fontSize={10} dominantBaseline="central" fill="#475569" fontWeight={600}>{names[s]}</text>);
  }
  if (p.capo > 0) el.push(<rect key="capo" x={left + (p.capo - 0.5) * fw - 5} y={top - 9} width={10} height={5 * sh + 18} rx={4} fill="#334155" opacity={0.85} />);
  count.forEach((n, k) => {
    const [s, f] = k.split(":").map(Number);
    const rf = f + p.capo;
    el.push(<circle key={`u${k}`} cx={f === 0 && !p.capo ? xOf(0) : xOf(rf)} cy={yOf(s)} r={7.5} fill={f === 0 && !p.capo ? "#fff" : "rgba(217,119,6,.28)"} stroke={AMBER} strokeWidth={1.2} />);
  });
  if (act) {
    const rf = act.fret + p.capo;
    const x = act.fret === 0 && !p.capo ? xOf(0) : xOf(rf);
    el.push(<circle key="act" cx={x} cy={yOf(act.string)} r={10} fill={GREEN} />);
    el.push(<text key="actt" x={x} y={yOf(act.string)} fontSize={9} fontWeight={800} textAnchor="middle" dominantBaseline="central" fill="#fff">{p.activeMidi != null ? plainName(p.activeMidi, p.naming, false) : ""}</text>);
  }
  return <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="tr-fret" role="img" aria-label="Mástil de guitarra">{el}</svg>;
}

// ---------- Diagrama de acorde ----------
export function ChordDiagram(p: { shape: Shape; title: string; sub?: string; active?: boolean; strum?: number; size?: number; naming: Naming; capo: number }) {
  const sz = p.size ?? 1;
  const sw = 16 * sz, fh = 19 * sz, left = 22 * sz, top = (p.sub ? 52 : 40) * sz;
  const played = p.shape.frets.filter((f) => f > 0);
  const maxF = Math.max(0, ...played), minF = played.length ? Math.min(...played) : 1;
  const base = maxF <= 4 ? 1 : minF;
  const rows = 4;
  const width = left + 5 * sw + 18 * sz, height = top + rows * fh + 24 * sz;
  const xOf = (s: number) => left + s * sw;
  const yOf = (f: number) => top + (f - base + 0.5) * fh;
  const el: ReactNode[] = [];
  el.push(<text key="t" x={width / 2} y={15 * sz} fontSize={16 * sz} fontWeight={800} textAnchor="middle" fill={p.active ? GREEN : INK}>{p.title}</text>);
  if (p.sub) el.push(<text key="st" x={width / 2} y={28 * sz} fontSize={9.5 * sz} textAnchor="middle" fill="#64748b">{p.sub}</text>);
  for (let r = 0; r <= rows; r++) el.push(<line key={`r${r}`} x1={left} x2={left + 5 * sw} y1={top + r * fh} y2={top + r * fh} stroke={INK} strokeWidth={r === 0 && base === 1 ? 4 : 1} />);
  for (let s = 0; s < 6; s++) {
    const hot = p.strum === s;
    el.push(<line key={`s${s}`} x1={xOf(s)} x2={xOf(s)} y1={top} y2={top + rows * fh} stroke={hot ? GREEN : INK} strokeWidth={hot ? 3 : 1} />);
  }
  if (base > 1) el.push(<text key="base" x={left - 6 * sz} y={yOf(base)} fontSize={10 * sz} textAnchor="end" dominantBaseline="central" fill={INK} fontWeight={700}>{base}</text>);
  if (p.shape.barre) {
    const b = p.shape.barre;
    el.push(<rect key="barre" x={xOf(b.from) - 6 * sz} y={yOf(b.fret) - 6 * sz} width={xOf(b.to) - xOf(b.from) + 12 * sz} height={12 * sz} rx={6 * sz} fill={p.active ? GREEN : INK} />);
  }
  p.shape.frets.forEach((f, s) => {
    const yTop = top - 9 * sz;
    if (f < 0) el.push(<text key={`x${s}`} x={xOf(s)} y={yTop} fontSize={11 * sz} textAnchor="middle" dominantBaseline="central" fill="#64748b">×</text>);
    else if (f === 0) el.push(<circle key={`o${s}`} cx={xOf(s)} cy={yTop} r={4 * sz} fill="none" stroke={p.strum === s ? GREEN : INK} strokeWidth={1.3} />);
    else if (!(p.shape.barre && f === p.shape.barre.fret && s >= p.shape.barre.from && s <= p.shape.barre.to && p.shape.fingers[s] === 1)) {
      el.push(<circle key={`d${s}`} cx={xOf(s)} cy={yOf(f)} r={6.5 * sz} fill={p.strum === s ? GREEN : p.active ? "#15803d" : INK} />);
      if (p.shape.fingers[s]) el.push(<text key={`n${s}`} x={xOf(s)} y={yOf(f)} fontSize={9 * sz} fontWeight={700} textAnchor="middle" dominantBaseline="central" fill="#fff">{p.shape.fingers[s]}</text>);
    }
  });
  // Notas de cada cuerda (abajo)
  p.shape.frets.forEach((f, s) => {
    if (f < 0) return;
    el.push(<text key={`nn${s}`} x={xOf(s)} y={top + rows * fh + 13 * sz} fontSize={7.5 * sz} textAnchor="middle" fill="#64748b">{plainName(GUITAR_OPEN[s] + f + p.capo, p.naming, false)}</text>);
  });
  return <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={"tr-chord" + (p.active ? " is-on" : "")} role="img" aria-label={`Acorde ${p.title}`}>{el}</svg>;
}

// ---------- Curva de tono ----------
export type Contour = { hop: number; midi: ArrayLike<number> };
export function PitchChart(p: {
  contour: Contour; notes: { start: number; end: number; midi: number }[]; offset: number; naming: Naming;
  playhead: number | null; selected: number; onSelect?: (i: number) => void; pxPerSec?: number;
}) {
  const pps = p.pxPerSec ?? 90;
  const vals: number[] = [];
  for (let i = 0; i < p.contour.midi.length; i++) { const v = p.contour.midi[i]; if (Number.isFinite(v)) vals.push(v - p.offset); }
  p.notes.forEach((n) => vals.push(n.midi));
  const lo = Math.floor(Math.min(...vals, 60)) - 2, hi = Math.ceil(Math.max(...vals, 62)) + 2;
  const rows = hi - lo, rh = Math.max(9, Math.min(16, 260 / rows));
  const dur = p.contour.midi.length * p.contour.hop;
  const left = 42, top = 8;
  const width = left + Math.max(300, dur * pps) + 12, height = top + rows * rh + 24;
  const yOf = (m: number) => top + (hi - m) * rh;
  const el: ReactNode[] = [];
  for (let m = lo; m <= hi; m++) {
    const black = isBlack(m);
    if (m < hi) el.push(<rect key={`row${m}`} x={left} y={yOf(m) - rh / 2} width={width - left - 12} height={rh} fill={black ? "#f1ece2" : "#fffdf8"} />);
    if (!black) el.push(<text key={`lab${m}`} x={left - 6} y={yOf(m)} fontSize={9} textAnchor="end" dominantBaseline="central" fill={m % 12 === 0 ? INK : "#64748b"} fontWeight={m % 12 === 0 ? 700 : 400}>{plainName(m, p.naming)}</text>);
    if (m % 12 === 0) el.push(<line key={`c${m}`} x1={left} x2={width - 12} y1={yOf(m) + rh / 2} y2={yOf(m) + rh / 2} stroke="#cbd5e1" />);
  }
  for (let s = 0; s <= dur; s++) {
    el.push(<line key={`t${s}`} x1={left + s * pps} x2={left + s * pps} y1={top} y2={top + rows * rh} stroke="#e7dccb" />);
    el.push(<text key={`tl${s}`} x={left + s * pps} y={height - 6} fontSize={9} textAnchor="middle" fill="#64748b">{s}s</text>);
  }
  p.notes.forEach((n, i) => {
    el.push(
      <rect key={`n${i}`} x={left + n.start * pps} y={yOf(n.midi) - rh / 2 + 1} width={Math.max(3, (n.end - n.start) * pps)} height={rh - 2} rx={3}
        fill={i === p.selected ? "rgba(217,119,6,.35)" : "rgba(22,163,74,.22)"} stroke={i === p.selected ? AMBER : GREEN} strokeWidth={1.2}
        onClick={() => p.onSelect?.(i)} style={{ cursor: "pointer" }} />,
    );
  });
  // Curva como polilíneas (se corta en los silencios)
  const segs: string[] = [];
  let cur: string[] = [];
  for (let i = 0; i < p.contour.midi.length; i++) {
    const v = p.contour.midi[i];
    if (!Number.isFinite(v)) { if (cur.length > 1) segs.push(cur.join(" ")); cur = []; continue; }
    const m = v - p.offset;
    if (m < lo || m > hi) continue;
    cur.push(`${(left + i * p.contour.hop * pps).toFixed(1)},${yOf(m).toFixed(1)}`);
  }
  if (cur.length > 1) segs.push(cur.join(" "));
  segs.forEach((s, i) => el.push(<polyline key={`p${i}`} points={s} fill="none" stroke={BLUE} strokeWidth={1.6} strokeLinejoin="round" />));
  if (p.playhead != null) el.push(<line key="ph" x1={left + p.playhead * pps} x2={left + p.playhead * pps} y1={top} y2={top + rows * rh} stroke="#dc2626" strokeWidth={2} />);
  const ref = useRef<SVGSVGElement | null>(null);
  useEffect(() => {
    if (p.playhead == null) return;
    const cont = ref.current?.parentElement;
    if (!cont) return;
    const x = left + p.playhead * pps;
    if (x < cont.scrollLeft + 40 || x > cont.scrollLeft + cont.clientWidth - 60) cont.scrollTo({ left: x - cont.clientWidth * 0.3 });
  }, [p.playhead, pps]);
  return <svg ref={ref} width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="tr-chart" role="img" aria-label="Curva de tono">{el}</svg>;
}

// ---------- Mini rollo para el histórico ----------
export function MiniRoll({ notes }: { notes: { start: number; dur: number; midi: number }[] }) {
  if (!notes.length) return <svg width={120} height={36} />;
  const lo = Math.min(...notes.map((n) => n.midi)), hi = Math.max(...notes.map((n) => n.midi));
  const end = Math.max(...notes.map((n) => n.start + n.dur));
  const W = 120, H = 36, r = Math.max(1, hi - lo);
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="tr-mini" aria-hidden>
      <rect width={W} height={H} rx={6} fill="#f6efe2" />
      {notes.map((n, i) => <rect key={i} x={4 + (n.start / end) * (W - 8)} y={4 + ((hi - n.midi) / r) * (H - 11)} width={Math.max(2, (n.dur / end) * (W - 8) - 1)} height={3} rx={1.5} fill="#1f4e79" />)}
    </svg>
  );
}
