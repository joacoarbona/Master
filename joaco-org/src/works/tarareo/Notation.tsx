/* ============================================================
   TARAREO · Partitura en SVG
   Pentagrama con clave, armadura, compás, figuras, barras de
   corcheas, ligaduras, silencios, cifrado de acordes, nombres
   de nota, digitación de piano y tablatura de guitarra alineada.
   ============================================================ */
import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { beamGroups, buildMeasures, cleanNotes, type Ev } from "./layout";
import { chordSymbol, keyFifths, spell, spelledName, type ChordEvent, type Key, type Naming, type QNote, type TabPos, type TimeSig } from "./music";

export type NotationProps = {
  notes: QNote[]; keySig: Key; ts: TimeSig; total: number; chords: ChordEvent[]; naming: Naming;
  clef: "treble" | "bass"; showNames: boolean; showChords: boolean;
  fingering?: number[] | null; tab?: (TabPos | null)[] | null;
  active: number; activeChord: number; selected: number; onSelect?: (i: number) => void;
  wrap: number; // ancho para partir en líneas; 0 = una sola línea desplazable
  scrollRef?: React.RefObject<HTMLDivElement | null>;
};

const S = 10; // distancia entre líneas
const INK = "#1d2433", SOFT = "#8a8f9c", GREEN = "#15803d", GREEN_BG = "rgba(22,163,74,.13)", AMBER = "#d97706", BLUE = "#1d4ed8";
const SHARP_ORDER = [3, 0, 4, 1, 5, 2, 6], FLAT_ORDER = [6, 2, 5, 1, 4, 0, 3];
const SHARP_DI_TREBLE = [38, 35, 39, 36, 33, 37, 34], FLAT_DI_TREBLE = [34, 37, 33, 36, 32, 35, 31];

function keyAlter(fifths: number, letter: number): number {
  if (fifths > 0 && SHARP_ORDER.slice(0, fifths).includes(letter)) return 1;
  if (fifths < 0 && FLAT_ORDER.slice(0, -fifths).includes(letter)) return -1;
  return 0;
}
const ACC_GLYPH: Record<number, string> = { 1: "♯", [-1]: "♭", 0: "♮", 2: "𝄪", [-2]: "♭♭" };

type Placed = Ev & { x: number; w: number; y: number; di: number; acc: number | null; up: boolean; sys: number; inBeam: boolean };

export default function Notation(p: NotationProps) {
  const notes = useMemo(() => cleanNotes(p.notes), [p.notes]);
  const fifths = keyFifths(p.keySig);
  const ref = p.clef === "treble" ? 30 : 18;        // diatónico de la línea inferior (Mi4 / Sol2)
  const middle = ref + 4;
  const measures = useMemo(() => buildMeasures(notes, p.ts, p.total), [notes, p.ts, p.total]);
  const spelled = useMemo(() => notes.map((n) => spell(n.midi, p.keySig)), [notes, p.keySig]);

  // ---------- Medidas horizontales ----------
  const layout = useMemo(() => {
    const evW = (e: Ev, acc: boolean) => (e.fullBar ? 54 : 16 + 15 * Math.sqrt(e.val) + (acc ? 9 : 0) + (e.kind === "rest" ? -4 : 0));
    // Alteraciones accidentales por compás
    const accOf = new Map<Ev, number | null>();
    measures.forEach((m) => {
      const state = new Map<string, number>();
      m.events.forEach((e) => {
        if (e.kind !== "note") return;
        const s = spelled[e.noteIdx];
        const k = `${s.letter}${s.octave}`;
        const cur = state.has(k) ? state.get(k)! : keyAlter(fifths, s.letter);
        if (e.first && s.alter !== cur) { accOf.set(e, s.alter); state.set(k, s.alter); }
        else accOf.set(e, null);
      });
    });
    const mW = measures.map((m) => 12 + m.events.reduce((s, e) => s + evW(e, accOf.get(e) != null), 0) + 4);
    const keyW = Math.abs(fifths) * 9 + (fifths ? 6 : 0);
    const head = (first: boolean) => 10 + 30 + keyW + (first ? 26 : 4);
    // Sistemas (líneas)
    const systems: { measures: number[]; x0: number; scale: number; width: number }[] = [];
    let cur: number[] = [], used = 0;
    measures.forEach((_, i) => {
      const h = head(systems.length === 0);
      if (p.wrap > 0 && cur.length && h + used + mW[i] > p.wrap - 6) {
        systems.push({ measures: cur, x0: h, scale: 1, width: 0 }); cur = []; used = 0;
      }
      cur.push(i); used += mW[i];
    });
    if (cur.length) systems.push({ measures: cur, x0: head(systems.length === 0), scale: 1, width: 0 });
    systems.forEach((s, si) => {
      const sum = s.measures.reduce((a, i) => a + mW[i], 0);
      if (p.wrap > 0) {
        const avail = p.wrap - 6 - s.x0;
        const f = avail / sum;
        s.scale = si < systems.length - 1 || f < 1.35 ? f : 1;
        s.width = p.wrap;
      } else s.width = s.x0 + sum + 16;
    });
    // Posiciones
    const placed: Placed[] = [];
    const measX: { sys: number; x: number; w: number }[] = [];
    systems.forEach((s, si) => {
      let x = s.x0;
      s.measures.forEach((mi) => {
        const m = measures[mi];
        const w = mW[mi] * s.scale;
        measX[mi] = { sys: si, x, w };
        let ex = x + 12 * s.scale;
        m.events.forEach((e) => {
          const acc = accOf.get(e) ?? null;
          const ew = evW(e, acc != null) * s.scale;
          const sp = e.kind === "note" ? spelled[e.noteIdx] : null;
          const di = sp ? sp.octave * 7 + sp.letter : middle;
          placed.push({ ...e, x: ex + (acc != null ? 9 : 0) + 7, w: ew, y: 0, di, acc, up: di < middle, sys: si, inBeam: false });
          ex += ew;
        });
        x += w;
      });
    });
    return { systems, placed, measX };
  }, [measures, spelled, fifths, middle, p.wrap]);

  // Barras de corcheas: dirección común por grupo
  const beams = useMemo(() => {
    const out: Placed[][] = [];
    measures.forEach((m) => {
      beamGroups(m, p.ts).forEach((g) => {
        const pl = g.map((e) => layout.placed.find((q) => q.pos === e.pos && q.noteIdx === e.noteIdx && q.val === e.val)!).filter(Boolean);
        if (pl.length < 2 || pl.some((q) => q.sys !== pl[0].sys)) return;
        const avg = pl.reduce((s, q) => s + q.di, 0) / pl.length;
        pl.forEach((q) => { q.up = avg < middle; q.inBeam = true; });
        out.push(pl);
      });
    });
    return out;
  }, [measures, layout, p.ts, middle]);

  // ---------- Medidas verticales ----------
  const yRel = (di: number) => 40 - (di - ref) * (S / 2);
  const vert = useMemo(() => {
    let minRel = -4, maxRel = 44;
    layout.placed.forEach((e) => {
      if (e.kind !== "note") return;
      const y = yRel(e.di);
      minRel = Math.min(minRel, y - 6 - (e.up && e.val < 16 ? 34 : 0));
      maxRel = Math.max(maxRel, y + 6 + (!e.up && e.val < 16 ? 34 : 0));
    });
    const fing = p.fingering ? 14 : 0;
    const staffTop = (p.showChords ? 26 : 8) + fing + Math.max(10, -minRel);
    const namesY = staffTop + Math.max(56, maxRel + 14);
    const tabTop = namesY + (p.showNames ? 14 : -4);
    const height = p.tab ? tabTop + 5 * 9 + 18 : namesY + (p.showNames ? 8 : 0);
    return { staffTop, namesY, tabTop, height };
  }, [layout, p.fingering, p.showChords, p.showNames, p.tab, ref]);

  // Auto-desplazamiento hacia la nota activa
  const svgRef = useRef<SVGSVGElement | null>(null);
  useEffect(() => {
    const cont = p.scrollRef?.current;
    if (!cont || p.active < 0) return;
    const el = svgRef.current?.parentElement?.querySelector(`[data-n="${p.active}"]`) as SVGGElement | null;
    if (!el) return;
    const r = el.getBoundingClientRect(), c = cont.getBoundingClientRect();
    if (p.wrap > 0) {
      if (r.top < c.top + 10 || r.bottom > c.bottom - 10) cont.scrollTo({ top: cont.scrollTop + r.top - c.top - 40, behavior: "smooth" });
    } else if (r.left < c.left + c.width * 0.15 || r.right > c.right - c.width * 0.3) {
      cont.scrollTo({ left: cont.scrollLeft + r.left - c.left - c.width * 0.35, behavior: "smooth" });
    }
  }, [p.active, p.wrap, p.scrollRef]);

  const { staffTop, namesY, tabTop, height } = vert;

  return (
    <div className="tr-systems">
      {layout.systems.map((sys, si) => {
        const evs = layout.placed.filter((e) => e.sys === si);
        const yOf = (di: number) => staffTop + yRel(di);
        const items: ReactNode[] = [];
        // Pentagrama
        for (let l = 0; l < 5; l++) items.push(<line key={`l${l}`} x1={4} x2={sys.width - 6} y1={staffTop + l * S} y2={staffTop + l * S} stroke={INK} strokeWidth={0.9} />);
        items.push(<line key="lb" x1={4} x2={4} y1={staffTop} y2={staffTop + 40} stroke={INK} strokeWidth={1.2} />);
        // Clave
        items.push(p.clef === "treble" ? <TrebleClef key="clef" x={22} gy={staffTop + 30} /> : <BassClef key="clef" x={22} fy={staffTop + 10} />);
        // Armadura
        const kd = fifths > 0 ? SHARP_DI_TREBLE : FLAT_DI_TREBLE;
        for (let k = 0; k < Math.abs(fifths); k++) {
          const di = kd[k] - (p.clef === "bass" ? 14 : 0);
          items.push(<text key={`k${k}`} x={44 + k * 9} y={yOf(di)} fontSize={19} textAnchor="middle" dominantBaseline="central" fill={INK} className="tr-glyph">{fifths > 0 ? "♯" : "♭"}</text>);
        }
        // Compás (solo en la primera línea)
        if (si === 0) {
          const tx = 44 + Math.abs(fifths) * 9 + (fifths ? 6 : 0) + 8;
          items.push(<text key="tsn" x={tx} y={staffTop + 10} fontSize={23} fontWeight={800} textAnchor="middle" dominantBaseline="central" fill={INK} className="tr-ts">{p.ts.num}</text>);
          items.push(<text key="tsd" x={tx} y={staffTop + 30} fontSize={23} fontWeight={800} textAnchor="middle" dominantBaseline="central" fill={INK} className="tr-ts">{p.ts.den}</text>);
        }
        // Barras de compás y números
        sys.measures.forEach((mi, k) => {
          const mx = layout.measX[mi];
          const xEnd = mx.x + mx.w;
          const last = mi === measures.length - 1;
          items.push(<text key={`mn${mi}`} x={mx.x + 2} y={staffTop - 5} fontSize={9} fill={SOFT}>{mi + 1}</text>);
          if (last) {
            items.push(<line key={`b${mi}a`} x1={xEnd - 6} x2={xEnd - 6} y1={staffTop} y2={staffTop + 40} stroke={INK} strokeWidth={1} />);
            items.push(<rect key={`b${mi}b`} x={xEnd - 3.5} y={staffTop} width={3.5} height={40} fill={INK} />);
          } else items.push(<line key={`b${mi}`} x1={xEnd} x2={xEnd} y1={staffTop} y2={staffTop + 40} stroke={INK} strokeWidth={1} />);
          if (p.tab) items.push(<line key={`tb${mi}`} x1={last ? xEnd - 1 : xEnd} x2={last ? xEnd - 1 : xEnd} y1={tabTop} y2={tabTop + 45} stroke={SOFT} strokeWidth={last ? 3 : 1} />);
          void k;
        });
        // Acordes
        if (p.showChords) {
          p.chords.forEach((c, ci) => {
            const ev = evs.find((e) => c.start >= e.pos && c.start < e.pos + e.val);
            if (!ev) return;
            const x = ev.x - 7 + ((c.start - ev.pos) / ev.val) * ev.w;
            const label = chordSymbol(c.chord, p.keySig, "en");
            const on = ci === p.activeChord;
            items.push(
              <g key={`c${ci}`}>
                {on && <rect x={x - 4} y={2} width={label.length * 9 + 8} height={20} rx={5} fill="rgba(29,78,216,.12)" />}
                <text x={x} y={17} fontSize={15} fontWeight={700} fill={BLUE} className="tr-chordsym">{label}</text>
              </g>,
            );
          });
        }
        // Tablatura
        if (p.tab) {
          for (let l = 0; l < 6; l++) items.push(<line key={`t${l}`} x1={4} x2={sys.width - 6} y1={tabTop + l * 9} y2={tabTop + l * 9} stroke={SOFT} strokeWidth={0.8} />);
          ["T", "A", "B"].forEach((ch, k) => items.push(<text key={`tab${k}`} x={22} y={tabTop + 12 + k * 12} fontSize={12} fontWeight={800} textAnchor="middle" fill={INK} className="tr-ts">{ch}</text>));
        }
        // Eventos
        evs.forEach((e, k) => {
          const isActive = e.noteIdx >= 0 && e.noteIdx === p.active;
          const isSel = e.noteIdx >= 0 && e.noteIdx === p.selected;
          if (e.kind === "rest") {
            items.push(<g key={`r${k}`}>{restGlyph(e.fullBar ? 16 : e.val, e.fullBar ? layout.measX[Math.floor(e.pos / (e.val || 1))]?.x + layout.measX[Math.floor(e.pos / (e.val || 1))]?.w / 2 || e.x : e.x, staffTop)}</g>);
            return;
          }
          const y = yOf(e.di);
          const color = isActive ? GREEN : INK;
          const hollow = e.val >= 8;
          const g: ReactNode[] = [];
          if (isActive) g.push(<rect key="hl" x={e.x - 12} y={staffTop - 8} width={24} height={56} rx={6} fill={GREEN_BG} />);
          if (isSel) g.push(<rect key="sl" x={e.x - 13} y={Math.min(staffTop - 10, y - 12)} width={26} height={Math.max(60, y - staffTop + 24)} rx={7} fill="none" stroke={AMBER} strokeWidth={2} strokeDasharray="4 3" />);
          // Líneas adicionales
          const off = e.di - ref;
          if (off < -1) for (let o = -2; o >= off; o -= 2) g.push(<line key={`lg${o}`} x1={e.x - 10} x2={e.x + 10} y1={yOf(ref + o)} y2={yOf(ref + o)} stroke={INK} strokeWidth={1} />);
          if (off > 9) for (let o = 10; o <= off; o += 2) g.push(<line key={`lg${o}`} x1={e.x - 10} x2={e.x + 10} y1={yOf(ref + o)} y2={yOf(ref + o)} stroke={INK} strokeWidth={1} />);
          // Alteración
          if (e.acc != null) g.push(<text key="acc" x={e.x - 15} y={y} fontSize={17} textAnchor="middle" dominantBaseline="central" fill={color} className="tr-glyph">{ACC_GLYPH[e.acc]}</text>);
          // Cabeza
          g.push(<ellipse key="head" cx={e.x} cy={y} rx={6.2} ry={4.4} transform={`rotate(-20 ${e.x} ${y})`} fill={hollow ? "#fff" : color} stroke={color} strokeWidth={hollow ? 1.8 : 1} />);
          // Puntillo
          if ([12, 6, 3].includes(e.val)) g.push(<circle key="dot" cx={e.x + 11} cy={off % 2 === 0 ? y - 2.5 : y} r={1.7} fill={color} />);
          // Plica y corchete
          if (e.val < 16 && !e.inBeam) {
            const sx = e.up ? e.x + 5.6 : e.x - 5.6, sy2 = e.up ? y - 34 : y + 34;
            g.push(<line key="stem" x1={sx} x2={sx} y1={y} y2={sy2} stroke={color} strokeWidth={1.3} />);
            const flags = e.val <= 1 ? 2 : e.val <= 3 ? 1 : 0;
            for (let f = 0; f < flags; f++) g.push(<path key={`f${f}`} d={flagPath(sx, sy2 + (e.up ? f * 8 : -f * 8), e.up)} fill={color} />);
          }
          // Digitación
          if (p.fingering && e.first && p.fingering[e.noteIdx]) {
            const fy = Math.min(staffTop - 9, (e.up ? y - 40 : y - 12));
            g.push(<text key="fg" x={e.x} y={fy} fontSize={11} fontWeight={700} textAnchor="middle" fill={isActive ? GREEN : "#7c2d12"} className="tr-mono">{p.fingering[e.noteIdx]}</text>);
          }
          // Nombre
          if (p.showNames && e.first) {
            g.push(<text key="nm" x={e.x} y={namesY} fontSize={10.5} textAnchor="middle" fontWeight={isActive ? 800 : 500} fill={isActive ? GREEN : "#475569"} className="tr-name">{spelledName(spelled[e.noteIdx], p.naming)}</text>);
          }
          // Traste en la tablatura
          if (p.tab && e.first) {
            const t = p.tab[e.noteIdx];
            if (t) {
              const ty = tabTop + (5 - t.string) * 9;
              const label = String(t.fret);
              g.push(<rect key="tbg" x={e.x - 4 - (label.length - 1) * 3.5} y={ty - 6} width={8 + (label.length - 1) * 7} height={12} fill="#fffdf8" />);
              g.push(<text key="tf" x={e.x} y={ty} fontSize={11} fontWeight={700} textAnchor="middle" dominantBaseline="central" fill={isActive ? GREEN : INK} className="tr-mono">{label}</text>);
            } else g.push(<text key="tf" x={e.x} y={tabTop + 22} fontSize={10} textAnchor="middle" fill={SOFT}>·</text>);
          }
          // Ligadura
          if (e.tieStart) {
            const nx = layout.placed.find((q) => q.noteIdx === e.noteIdx && q.pos === e.pos + e.val);
            const x2 = nx && nx.sys === si ? nx.x - 6 : sys.width - 8;
            const dir = e.up ? 1 : -1, ty = y + dir * 7;
            g.push(<path key="tie" d={`M${e.x + 6},${ty} Q${(e.x + x2) / 2},${ty + dir * 8} ${x2},${ty}`} fill="none" stroke={color} strokeWidth={1.4} />);
          }
          // Zona táctil
          g.push(<rect key="hit" x={e.x - 12} y={staffTop - 22} width={24} height={86} fill="transparent" style={{ cursor: p.onSelect ? "pointer" : "default" }} />);
          items.push(<g key={`n${k}`} data-n={e.first ? e.noteIdx : undefined} onClick={() => p.onSelect?.(e.noteIdx)}>{g}</g>);
        });
        // Barras de corcheas
        beams.filter((b) => b[0].sys === si).forEach((b, bi) => {
          const up = b[0].up;
          const xs = b.map((q) => (up ? q.x + 5.6 : q.x - 5.6));
          const ys = b.map((q) => yOf(q.di));
          let y1 = up ? ys[0] - 32 : ys[0] + 32, y2 = up ? ys[ys.length - 1] - 32 : ys[ys.length - 1] + 32;
          const slope = Math.max(-8, Math.min(8, y2 - y1));
          const lineAt = (x: number) => y1 + (slope * (x - xs[0])) / Math.max(1, xs[xs.length - 1] - xs[0]);
          // asegura plicas de al menos 26 px
          let shift = 0;
          b.forEach((_, i) => {
            const need = up ? (ys[i] - 26) - lineAt(xs[i]) : lineAt(xs[i]) - (ys[i] + 26);
            if (need < 0) shift = up ? Math.min(shift, need) : Math.max(shift, -need);
          });
          y1 += shift; y2 = y1 + slope;
          const at = (x: number) => y1 + (slope * (x - xs[0])) / Math.max(1, xs[xs.length - 1] - xs[0]);
          const anyActive = b.some((q) => q.noteIdx === p.active);
          const col = anyActive ? GREEN : INK;
          const parts: ReactNode[] = [];
          b.forEach((q, i) => parts.push(<line key={`s${i}`} x1={xs[i]} x2={xs[i]} y1={ys[i]} y2={at(xs[i])} stroke={q.noteIdx === p.active ? GREEN : INK} strokeWidth={1.3} />));
          const th = 4.4, dy = up ? 0 : -th;
          parts.push(<polygon key="pb" points={`${xs[0]},${at(xs[0]) + dy} ${xs[xs.length - 1]},${at(xs[xs.length - 1]) + dy} ${xs[xs.length - 1]},${at(xs[xs.length - 1]) + dy + th} ${xs[0]},${at(xs[0]) + dy + th}`} fill={col} />);
          // segunda barra (semicorcheas)
          const off2 = up ? 7 : -7;
          b.forEach((q, i) => {
            if (q.val !== 1) return;
            const prev16 = i > 0 && b[i - 1].val === 1, next16 = i + 1 < b.length && b[i + 1].val === 1;
            if (prev16) return; // ya dibujada desde la anterior
            let xa = xs[i], xb = xs[i];
            if (next16) { let j = i; while (j + 1 < b.length && b[j + 1].val === 1) j++; xb = xs[j]; }
            else if (i + 1 < b.length) xb = xs[i] + 9; else xa = xs[i] - 9;
            parts.push(<polygon key={`sb${i}`} points={`${xa},${at(xa) + dy + off2} ${xb},${at(xb) + dy + off2} ${xb},${at(xb) + dy + off2 + th} ${xa},${at(xa) + dy + off2 + th}`} fill={col} />);
          });
          items.push(<g key={`beam${bi}`}>{parts}</g>);
        });
        return (
          <svg key={si} ref={si === 0 ? svgRef : undefined} width={sys.width} height={height} viewBox={`0 0 ${sys.width} ${height}`} className="tr-score-svg" role="img" aria-label={`Partitura, línea ${si + 1}`}>
            <rect x={0} y={0} width={sys.width} height={height} fill="#fffdf8" />
            {items}
          </svg>
        );
      })}
    </div>
  );
}

function flagPath(x: number, y: number, up: boolean): string {
  const d = up ? 1 : -1;
  return `M${x},${y} C${x + 1},${y + 7 * d} ${x + 10},${y + 10 * d} ${x + 8},${y + 21 * d} C${x + 7.5},${y + 14 * d} ${x + 4},${y + 11 * d} ${x},${y + 9 * d} Z`;
}

function restGlyph(val: number, x: number, top: number): ReactNode {
  const c = INK;
  if (val >= 16) return <rect x={x - 6} y={top + 10} width={12} height={5} fill={c} />;
  if (val >= 8) return <g><rect x={x - 6} y={top + 15} width={12} height={5} fill={c} />{val === 12 && <circle cx={x + 10} cy={top + 17} r={1.7} fill={c} />}</g>;
  if (val >= 4) return (
    <g>
      <path d={`M${x - 3},${top + 6} L${x + 3},${top + 14} L${x - 2},${top + 20} L${x + 3},${top + 27} C${x - 3},${top + 24} ${x - 5},${top + 29} ${x},${top + 33}`} fill="none" stroke={c} strokeWidth={2.3} strokeLinejoin="round" strokeLinecap="round" />
      {val === 6 && <circle cx={x + 9} cy={top + 17} r={1.7} fill={c} />}
    </g>
  );
  if (val >= 2) return (
    <g>
      <circle cx={x - 3} cy={top + 15} r={2.4} fill={c} />
      <path d={`M${x - 3},${top + 16} Q${x + 1},${top + 18} ${x + 4},${top + 13} L${x - 1},${top + 30}`} fill="none" stroke={c} strokeWidth={1.6} />
      {val === 3 && <circle cx={x + 9} cy={top + 17} r={1.7} fill={c} />}
    </g>
  );
  return (
    <g>
      <circle cx={x - 2} cy={top + 15} r={2.3} fill={c} />
      <circle cx={x - 4} cy={top + 22} r={2.3} fill={c} />
      <path d={`M${x - 2},${top + 16} Q${x + 2},${top + 17} ${x + 5},${top + 12} L${x - 1},${top + 34} M${x - 4},${top + 23} Q${x},${top + 24} ${x + 3},${top + 19}`} fill="none" stroke={c} strokeWidth={1.5} />
    </g>
  );
}

/** Clave de sol dibujada a mano; gy = línea de Sol (segunda desde abajo). */
function TrebleClef({ x, gy }: { x: number; gy: number }) {
  const d = `M ${x + 2} ${gy + 3}
    C ${x - 6} ${gy + 3} ${x - 7} ${gy - 8} ${x + 1} ${gy - 9}
    C ${x + 9} ${gy - 10} ${x + 11} ${gy + 1} ${x + 5} ${gy + 6}
    C ${x - 1} ${gy + 10} ${x - 11} ${gy + 8} ${x - 11} ${gy - 1}
    C ${x - 11} ${gy - 11} ${x - 1} ${gy - 18} ${x + 4} ${gy - 25}
    C ${x + 9} ${gy - 32} ${x + 8} ${gy - 43} ${x + 3} ${gy - 42}
    C ${x - 2} ${gy - 41} ${x - 2} ${gy - 31} ${x - 1} ${gy - 22}
    L ${x + 4} ${gy + 22}
    C ${x + 5} ${gy + 29} ${x - 3} ${gy + 31} ${x - 5} ${gy + 26}`;
  return (
    <g>
      <path d={d} fill="none" stroke={INK} strokeWidth={2.3} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={x - 3.2} cy={gy + 25.5} r={2.8} fill={INK} />
    </g>
  );
}
/** Clave de fa; fy = línea de Fa (segunda desde arriba). */
function BassClef({ x, fy }: { x: number; fy: number }) {
  return (
    <g>
      <circle cx={x - 5} cy={fy} r={3.4} fill={INK} />
      <path d={`M ${x - 8} ${fy - 1} C ${x - 8} ${fy - 11} ${x + 9} ${fy - 13} ${x + 10} ${fy - 1} C ${x + 11} ${fy + 12} ${x} ${fy + 22} ${x - 10} ${fy + 27}`} fill="none" stroke={INK} strokeWidth={2.6} strokeLinecap="round" />
      <circle cx={x + 15} cy={fy - 5} r={1.8} fill={INK} />
      <circle cx={x + 15} cy={fy + 5} r={1.8} fill={INK} />
    </g>
  );
}
