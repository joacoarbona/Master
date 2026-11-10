import React, { useEffect, useMemo, useRef, useState } from "react";

/* ============================================================
   NUBES DE PALABRAS
   Pega un texto, elige plantilla, toca una palabra para ver sus
   frases, etiqueta frases (las etiquetas cuentan en la nube) y
   guarda varios textos en este navegador.
   ============================================================ */

// ---------- Tipos ----------
type Doc = { id: string; title: string; text: string; tags: Record<string, string[]>; updated: number };
type Settings = { template: string; palette: string; maxWords: number; minLen: number; stop: boolean; tagWeight: number; exclude: string };
type WordStat = { key: string; label: string; count: number; tagHits: number; weight: number; sentences: number[]; fromTagOnly: boolean };
type Placed = { w: WordStat; x: number; y: number; size: number; rot: number; color: string; r?: number; bw: number; bh: number };

// ---------- Palabras vacías (no cuentan) ----------
const STOP_ES = "a al algo algunas algunos ante antes aquel aquella aquellas aquellos aqui aquí asi así aun aún aunque bien cada casi como cómo con contra cual cuál cuales cuando cuándo cuanto de del desde donde dónde dos durante e el él ella ellas ellos en entre era eran eres es esa esas ese eso esos esta está están estaba estaban estado estar estas este esto estos estoy fue fueron ha había habían han has hasta hay he hemos la las le les lo los mas más me mi mí mis mientras muy nada ni no nos nosotros nuestra nuestras nuestro nuestros o os otra otras otro otros para pero poco por porque que qué quien quién quienes se sea sean según ser será si sí sido siempre sin sino sobre solo sólo somos son soy su sus tal también tan tanto te tenemos tener tengo ti tiene tienen toda todas todo todos tras tu tú tus un una unas uno unos usted ustedes va vamos van ver vez vosotros voy y ya yo".split(" ");
const STOP_EN = "a about above after again all also am an and any are as at be because been before being below between both but by can could did do does doing down during each few for from further had has have having he her here hers him his how i if in into is it its just me more most my no nor not now of off on once only or other our ours out over own same she should so some such than that the their theirs them then there these they this those through to too under until up very was we were what when where which while who whom why will with would you your yours".split(" ");
const STOP = new Set([...STOP_ES, ...STOP_EN]);

// ---------- Plantillas y paletas ----------
const TEMPLATES = [
  { id: "clasica", name: "Clásica", hint: "Espiral, todo en horizontal", layout: "spiral", font: "'Sora', system-ui, sans-serif", weight: 600, vertical: 0, upper: false },
  { id: "editorial", name: "Editorial", hint: "Serif, una de cada cuatro en vertical", layout: "spiral", font: "'Fraunces', Georgia, serif", weight: 650, vertical: 0.25, upper: false },
  { id: "pop", name: "Pop", hint: "Mayúsculas redondeadas, mezcla de giros", layout: "spiral", font: "'Fredoka', 'Baloo 2', system-ui, sans-serif", weight: 700, vertical: 0.4, upper: true },
  { id: "burbujas", name: "Burbujas", hint: "Un círculo por palabra", layout: "bubbles", font: "'Sora', system-ui, sans-serif", weight: 600, vertical: 0, upper: false },
  { id: "ranking", name: "Ranking", hint: "Barras ordenadas de más a menos", layout: "bars", font: "'Sora', system-ui, sans-serif", weight: 600, vertical: 0, upper: false },
  { id: "parrafo", name: "Párrafo", hint: "En orden alfabético, como un texto", layout: "flow", font: "'Fraunces', Georgia, serif", weight: 600, vertical: 0, upper: false },
] as const;
const PALETTES: Record<string, { name: string; colors: string[] }> = {
  tinta: { name: "Tinta", colors: ["#1f2a44", "#3b5b92", "#7a1f3d", "#0f766e", "#b45309"] },
  oceano: { name: "Océano", colors: ["#0b3954", "#087e8b", "#1d6fa5", "#3a8f6b", "#5b5ea6"] },
  atardecer: { name: "Atardecer", colors: ["#9d174d", "#c2410c", "#b45309", "#7c2d12", "#6d28d9"] },
  bosque: { name: "Bosque", colors: ["#14532d", "#3f6212", "#166534", "#854d0e", "#115e59"] },
  mono: { name: "Mono", colors: ["#111827", "#374151", "#4b5563", "#1f2937", "#6b7280"] },
};
const DEFAULT_SETTINGS: Settings = { template: "clasica", palette: "tinta", maxWords: 80, minLen: 3, stop: true, tagWeight: 3, exclude: "" };

const SAMPLE = `La estrategia funciona cuando el equipo entiende el valor que entrega. Sin valor visible, el proyecto pierde apoyo. El equipo necesita prioridades claras y un plan realista. Un plan realista se revisa cada semana con datos, no con opiniones. Los datos muestran dónde está el riesgo y dónde está el valor. Cuando el riesgo sube, el equipo ajusta el plan y comunica el cambio. Comunicar pronto genera confianza. La confianza permite decidir rápido y mantener el valor a la vista.`;

// ---------- Utilidades ----------
const uid = () => "d" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const WORD_RE = /[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu;
function splitSentences(text: string): string[] {
  return text.split(/(?<=[.!?…])\s+|\n+/).map(s => s.trim()).filter(Boolean);
}
function seeded(seed: number) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function hashStr(s: string) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

// Cuenta palabras y etiquetas. Peso = apariciones + (frases etiquetadas × peso de etiqueta).
export function analyze(text: string, tags: Record<string, string[]>, st: Settings): { sentences: string[]; words: WordStat[]; total: number } {
  const sentences = splitSentences(text);
  const excluded = new Set(st.exclude.toLowerCase().split(/[,\s]+/).filter(Boolean));
  const map = new Map<string, WordStat>();
  const get = (key: string, label: string) => { let w = map.get(key); if (!w) { w = { key, label, count: 0, tagHits: 0, weight: 0, sentences: [], fromTagOnly: false }; map.set(key, w); } return w; };
  let total = 0;
  sentences.forEach((s, i) => {
    for (const m of s.matchAll(WORD_RE)) {
      const k = m[0].toLowerCase(); total++;
      if (k.length < st.minLen || /^\d+$/.test(k) || excluded.has(k) || (st.stop && STOP.has(k))) continue;
      const w = get(k, k); w.count++; if (w.sentences[w.sentences.length - 1] !== i) w.sentences.push(i);
    }
    for (const t of (tags[s] || [])) {
      const k = t.trim().toLowerCase(); if (!k) continue;
      const w = get(k, k); w.tagHits++; if (!w.sentences.includes(i)) w.sentences.push(i);
    }
  });
  const words = [...map.values()];
  words.forEach(w => { w.weight = w.count + w.tagHits * st.tagWeight; w.fromTagOnly = w.count === 0; w.sentences.sort((a, b) => a - b); });
  words.sort((a, b) => b.weight - a.weight || a.key.localeCompare(b.key));
  return { sentences, words: words.slice(0, st.maxWords), total };
}

// ---------- Colocación ----------
let _ctx: CanvasRenderingContext2D | null = null;
function measure(text: string, size: number, font: string, weight: number) {
  if (typeof document === "undefined") return text.length * size * 0.56;
  if (!_ctx) _ctx = document.createElement("canvas").getContext("2d");
  if (!_ctx) return text.length * size * 0.56;
  _ctx.font = `${weight} ${size}px ${font}`;
  return _ctx.measureText(text).width;
}
const W = 900, H = 580;
function sizeFor(w: WordStat, min: number, max: number, lo: number, hi: number) {
  if (max === min) return (lo + hi) / 2;
  return lo + (hi - lo) * Math.sqrt((w.weight - min) / (max - min));
}
function layoutSpiral(words: WordStat[], tpl: any, colors: string[], seed: number): { placed: Placed[]; skipped: number } {
  const rnd = seeded(seed); const placed: Placed[] = []; const boxes: number[][] = []; let skipped = 0;
  if (!words.length) return { placed, skipped };
  const max = words[0].weight, min = words[words.length - 1].weight;
  const hi = words.length > 60 ? 76 : words.length > 25 ? 88 : 100;
  for (const w of words) {
    let size = sizeFor(w, min, max, 15, hi); const label = tpl.upper ? w.label.toUpperCase() : w.label;
    let done = false;
    for (let attempt = 0; attempt < 3 && !done; attempt++) {
      const rot = (placed.length > 0 && rnd() < tpl.vertical) ? -90 : 0;
      const tw = measure(label, size, tpl.font, tpl.weight) + 8, th = size * 0.86 + 6;
      const bw = rot ? th : tw, bh = rot ? tw : th;
      const dir = rnd() < 0.5 ? 1 : -1, phase = rnd() * Math.PI * 2;
      for (let t = 0; t < 2400; t++) {
        const ang = phase + dir * t * 0.21, rad = 1.5 * t * 0.21;
        const x = W / 2 + rad * Math.cos(ang) * 1.45, y = H / 2 + rad * Math.sin(ang);
        const b = [x - bw / 2, y - bh / 2, x + bw / 2, y + bh / 2];
        if (b[0] < 4 || b[1] < 4 || b[2] > W - 4 || b[3] > H - 4) { if (rad > W) break; continue; }
        let hit = false; for (const o of boxes) { if (b[0] < o[2] && b[2] > o[0] && b[1] < o[3] && b[3] > o[1]) { hit = true; break; } }
        if (!hit) { boxes.push(b); placed.push({ w, x, y, size, rot, color: colors[Math.floor(rnd() * colors.length)], bw, bh }); done = true; break; }
      }
      size *= 0.82;
    }
    if (!done) skipped++;
  }
  return { placed, skipped };
}
function layoutBubbles(words: WordStat[], tpl: any, colors: string[], seed: number): { placed: Placed[]; skipped: number } {
  const rnd = seeded(seed); const placed: Placed[] = []; let skipped = 0;
  if (!words.length) return { placed, skipped };
  const max = words[0].weight, min = words[words.length - 1].weight;
  const list = words.slice(0, 45); skipped = words.length - list.length;
  const hiR = list.length > 30 ? 62 : list.length > 15 ? 78 : 96;
  for (const w of list) {
    const r = sizeFor(w, min, max, 22, hiR); let done = false; const phase = rnd() * 6.28;
    for (let t = 0; t < 3000; t++) {
      const ang = phase + t * 0.2, rad = 1.3 * t * 0.2;
      const x = W / 2 + rad * Math.cos(ang) * 1.4, y = H / 2 + rad * Math.sin(ang);
      if (x - r < 3 || y - r < 3 || x + r > W - 3 || y + r > H - 3) { if (rad > W) break; continue; }
      let hit = false; for (const o of placed) { const dx = o.x - x, dy = o.y - y, rr = (o.r || 0) + r + 3; if (dx * dx + dy * dy < rr * rr) { hit = true; break; } }
      if (!hit) {
        const base = measure(w.label, 20, tpl.font, tpl.weight); const size = Math.max(9, Math.min(r * 0.62, (r * 1.72) / base * 20));
        placed.push({ w, x, y, r, size, rot: 0, color: colors[placed.length % colors.length], bw: r * 2, bh: r * 2 }); done = true; break;
      }
    }
    if (!done) skipped++;
  }
  return { placed, skipped };
}

// Encuadre: recorta el lienzo a lo que ocupan las palabras (manteniendo la proporción) para que la nube llene el marco.
function fitViewBox(placed: Placed[]): string {
  if (!placed.length) return `0 0 ${W} ${H}`;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of placed) { x0 = Math.min(x0, p.x - p.bw / 2); x1 = Math.max(x1, p.x + p.bw / 2); y0 = Math.min(y0, p.y - p.bh / 2); y1 = Math.max(y1, p.y + p.bh / 2); }
  const pad = 14; x0 -= pad; y0 -= pad; x1 += pad; y1 += pad;
  let w = x1 - x0, h = y1 - y0; const ar = W / H;
  if (w / h > ar) { const nh = w / ar; y0 -= (nh - h) / 2; h = nh; } else { const nw = h * ar; x0 -= (nw - w) / 2; w = nw; }
  return `${x0.toFixed(1)} ${y0.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`;
}

// ---------- Persistencia (este navegador) ----------
const KEY = "nubes:v1";
async function loadAll(): Promise<{ docs: Doc[]; current: string | null; settings: Settings } | null> {
  try { const r = await (window as any).storage?.get(KEY); if (r) return JSON.parse(r.value); } catch { /* sin almacenamiento */ }
  try { const v = localStorage.getItem(KEY); if (v) return JSON.parse(v); } catch { /* sin almacenamiento */ }
  return null;
}
async function saveAll(data: unknown) {
  const v = JSON.stringify(data);
  try { if ((window as any).storage) { await (window as any).storage.set(KEY, v); return; } } catch { /* cae a localStorage */ }
  try { localStorage.setItem(KEY, v); } catch { /* lleno o bloqueado */ }
}

const CSS = `
.nb{min-height:100vh;background:#f6f4ee;color:#1c2333;font-family:'Sora',system-ui,sans-serif;padding:18px max(14px,env(safe-area-inset-right)) 70px max(14px,env(safe-area-inset-left))}
.nb *{box-sizing:border-box}
.nb-wrap{max-width:1180px;margin:0 auto}
.nb h1{font-family:'Fraunces',Georgia,serif;font-weight:650;font-size:30px;margin:0;letter-spacing:-.01em}
.nb h1 em{color:#7a1f3d;font-style:italic}
.nb .lead{color:#55607a;font-size:14.5px;line-height:1.5;margin:6px 0 14px;max-width:70ch}
.nb-tabs{display:flex;gap:6px;overflow-x:auto;padding-bottom:4px;margin-bottom:12px}
.nb-tab{flex:0 0 auto;border:1px solid #d9d3c3;background:#fff;color:#3b4560;border-radius:999px;padding:8px 14px;font:600 13.5px 'Sora',sans-serif;cursor:pointer}
.nb-tab[aria-selected=true]{background:#1f2a44;border-color:#1f2a44;color:#fff}
.nb-card{background:#fff;border:1px solid #e3ddcd;border-radius:14px;padding:14px}
.nb-grid{display:grid;gap:14px}
@media(min-width:960px){.nb-grid.two{grid-template-columns:minmax(0,1.75fr) minmax(300px,1fr)}}
.nb label{display:block;font-size:12px;font-weight:600;color:#55607a;margin-bottom:4px;text-transform:uppercase;letter-spacing:.04em}
.nb textarea,.nb input[type=text],.nb select{width:100%;font:400 15px 'Sora',sans-serif;border:1px solid #cfc8b6;border-radius:10px;padding:10px 12px;background:#fff;color:#1c2333}
.nb textarea{min-height:230px;line-height:1.5;resize:vertical}
.nb textarea:focus,.nb input:focus,.nb select:focus,.nb button:focus-visible{outline:2px solid #3b5b92;outline-offset:1px}
.nb-btn{border:1px solid #1f2a44;background:#1f2a44;color:#fff;border-radius:10px;padding:9px 14px;font:600 14px 'Sora',sans-serif;cursor:pointer}
.nb-btn.ghost{background:#fff;color:#1f2a44;border-color:#cfc8b6}
.nb-btn.danger{background:#fff;color:#9f1239;border-color:#e7b9c4}
.nb-btn:disabled{opacity:.45;cursor:default}
.nb-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.nb-tpl{display:grid;grid-template-columns:repeat(auto-fill,minmax(132px,1fr));gap:8px}
.nb-tpl button{text-align:left;border:1px solid #d9d3c3;background:#fff;border-radius:10px;padding:8px 10px;cursor:pointer;font-family:inherit;color:#1c2333}
.nb-tpl button[aria-pressed=true]{border-color:#1f2a44;box-shadow:inset 0 0 0 1px #1f2a44;background:#f3f1ea}
.nb-tpl b{display:block;font-size:14px}.nb-tpl span{font-size:11.5px;color:#6b7590;line-height:1.3;display:block}
.nb-tpl .nb-sw{display:inline-flex;gap:2px;vertical-align:middle;margin-right:7px}.nb-sw i{width:11px;height:11px;border-radius:2px;display:block}
.nb-stage{position:relative;border:1px solid #e3ddcd;border-radius:14px;background:#fffdf8;overflow:hidden}
.nb-stage svg{display:block;width:100%;height:auto}
.nb-stage text,.nb-stage circle{cursor:pointer}
.nb-legend{font-size:12.5px;color:#55607a;line-height:1.5;margin-top:8px}
.nb-chip{display:inline-flex;align-items:center;gap:4px;background:#eef1f7;color:#1f2a44;border:1px dashed #7b8ab0;border-radius:999px;padding:2px 9px;font-size:12.5px;font-weight:600}
.nb-chip button{border:0;background:none;color:#7a1f3d;cursor:pointer;font-size:14px;line-height:1;padding:0 0 0 2px}
.nb-sent{border-top:1px solid #eee8da;padding:10px 0}.nb-sent:first-child{border-top:0}
.nb-sent p{margin:0 0 6px;font-size:14.5px;line-height:1.5}
.nb-sent mark{background:#fde68a;color:inherit;border-radius:3px;padding:0 2px}
.nb-add{display:flex;gap:6px;margin-top:6px}.nb-add input{padding:6px 10px!important;font-size:13.5px!important}
.nb-bars{display:grid;gap:5px}.nb-bar{display:grid;grid-template-columns:minmax(80px,170px) 1fr 44px;gap:8px;align-items:center;font-size:13.5px;cursor:pointer;border:0;background:none;text-align:left;padding:2px 4px;border-radius:6px;font-family:inherit;color:inherit}
.nb-bar:hover,.nb-bar[aria-pressed=true]{background:#f3f1ea}.nb-bar i{display:block;height:14px;border-radius:4px}
.nb-flow{padding:18px;line-height:1.25;text-align:justify}.nb-flow button{border:0;background:none;cursor:pointer;padding:0 5px;font-family:inherit}
.nb-tip{position:absolute;left:10px;right:10px;bottom:10px;background:rgba(28,35,51,.94);color:#fff;border-radius:10px;padding:9px 12px;font-size:13px;line-height:1.4;pointer-events:none}
.nb-tip b{color:#fde68a}
.nb-doc{display:flex;justify-content:space-between;gap:10px;align-items:center;border-top:1px solid #eee8da;padding:10px 0}.nb-doc:first-child{border-top:0}
.nb-doc small{color:#6b7590}
.nb-guide h3{font-family:'Fraunces',Georgia,serif;font-size:18px;margin:14px 0 4px}.nb-guide p,.nb-guide li{font-size:14.5px;line-height:1.55;color:#33405c}.nb-guide dt{font-weight:700;margin-top:8px}.nb-guide dd{margin:0;color:#33405c;font-size:14.5px;line-height:1.5}
.nb-note{font-size:12.5px;color:#6b7590;margin-top:8px}
`;

// ---------- Frase con la palabra resaltada ----------
function Highlighted({ text, word }: { text: string; word: string | null }) {
  if (!word) return <>{text}</>;
  const out: React.ReactNode[] = []; let last = 0;
  for (const m of text.matchAll(WORD_RE)) {
    if (m[0].toLowerCase() === word) { out.push(text.slice(last, m.index)); out.push(<mark key={m.index}>{m[0]}</mark>); last = (m.index || 0) + m[0].length; }
  }
  out.push(text.slice(last));
  return <>{out}</>;
}

function SentenceItem({ text, word, tags, onAdd, onRemove }: { text: string; word: string | null; tags: string[]; onAdd: (t: string) => void; onRemove: (t: string) => void }) {
  const [v, setV] = useState("");
  const add = () => { const t = v.trim(); if (t) { onAdd(t); setV(""); } };
  return (
    <div className="nb-sent">
      <p><Highlighted text={text} word={word} /></p>
      <div className="nb-row">
        {tags.map(t => <span key={t} className="nb-chip">#{t}<button aria-label={`Quitar etiqueta ${t}`} onClick={() => onRemove(t)}>×</button></span>)}
      </div>
      <form className="nb-add" onSubmit={(e) => { e.preventDefault(); add(); }}>
        <input type="text" value={v} onChange={(e) => setV(e.target.value)} placeholder="Añadir etiqueta a esta frase" aria-label="Nueva etiqueta" />
        <button className="nb-btn ghost" type="submit" disabled={!v.trim()}>Añadir</button>
      </form>
    </div>
  );
}

export default function WordClouds() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Doc>({ id: uid(), title: "Texto sin título", text: "", tags: {}, updated: Date.now() });
  const [st, setSt] = useState<Settings>(DEFAULT_SETTINGS);
  const [tab, setTab] = useState<"texto" | "nube" | "frases" | "guardados" | "guia">("texto");
  const [sel, setSel] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [seed, setSeed] = useState(7);
  const [loaded, setLoaded] = useState(false);
  const [fontTick, setFontTick] = useState(0);
  const [msg, setMsg] = useState("");
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => { (async () => {
    const d = await loadAll();
    if (d) { setDocs(d.docs || []); setSt({ ...DEFAULT_SETTINGS, ...(d.settings || {}) }); const cur = (d.docs || []).find(x => x.id === d.current); if (cur) { setDraft(cur); setCurrentId(cur.id); setTab("nube"); } }
    setLoaded(true);
    try { (document as any).fonts?.ready?.then(() => setFontTick(t => t + 1)); } catch { /* sin API de fuentes */ }
  })(); }, []);
  useEffect(() => { if (loaded) saveAll({ docs, current: currentId, settings: st }); }, [docs, currentId, st, loaded]);
  useEffect(() => { if (!msg) return; const t = setTimeout(() => setMsg(""), 2600); return () => clearTimeout(t); }, [msg]);

  const an = useMemo(() => analyze(draft.text, draft.tags, st), [draft.text, draft.tags, st]);
  const tpl = TEMPLATES.find(t => t.id === st.template) || TEMPLATES[0];
  const colors = (PALETTES[st.palette] || PALETTES.tinta).colors;
  const lay = useMemo(() => {
    const s = seed + hashStr(st.template);
    if (tpl.layout === "spiral") return layoutSpiral(an.words, tpl, colors, s);
    if (tpl.layout === "bubbles") return layoutBubbles(an.words, tpl, colors, s);
    return { placed: [] as Placed[], skipped: 0 };
  }, [an.words, tpl, colors, seed, fontTick, st.template]);

  const dirty = useMemo(() => { const saved = docs.find(d => d.id === draft.id); return !saved || saved.text !== draft.text || saved.title !== draft.title || JSON.stringify(saved.tags) !== JSON.stringify(draft.tags); }, [docs, draft]);
  const selWord = sel ? an.words.find(w => w.key === sel) || null : null;
  const hovWord = hover ? an.words.find(w => w.key === hover) || null : null;
  const tagCount = Object.values(draft.tags).reduce((n, a) => n + a.length, 0);

  const upd = (p: Partial<Doc>) => setDraft(d => ({ ...d, ...p, updated: Date.now() }));
  const addTag = (sentence: string, t: string) => setDraft(d => { const cur = d.tags[sentence] || []; const k = t.trim().toLowerCase(); if (!k || cur.includes(k)) return d; return { ...d, tags: { ...d.tags, [sentence]: [...cur, k] }, updated: Date.now() }; });
  const removeTag = (sentence: string, t: string) => setDraft(d => { const next = (d.tags[sentence] || []).filter(x => x !== t); const tags = { ...d.tags }; if (next.length) tags[sentence] = next; else delete tags[sentence]; return { ...d, tags, updated: Date.now() }; });
  const save = () => { const doc = { ...draft, title: draft.title.trim() || "Texto sin título", updated: Date.now() }; setDocs(ds => ds.some(d => d.id === doc.id) ? ds.map(d => d.id === doc.id ? doc : d) : [doc, ...ds]); setDraft(doc); setCurrentId(doc.id); setMsg("Guardado en este navegador."); };
  const open = (d: Doc) => { setDraft(d); setCurrentId(d.id); setSel(null); setTab("nube"); };
  const fresh = () => { setDraft({ id: uid(), title: "Texto sin título", text: "", tags: {}, updated: Date.now() }); setCurrentId(null); setSel(null); setTab("texto"); };
  const del = (id: string) => { if (!window.confirm("¿Borrar este texto guardado? No se puede deshacer.")) return; setDocs(ds => ds.filter(d => d.id !== id)); if (draft.id === id) fresh(); };
  const dup = (d: Doc) => { const c = { ...d, id: uid(), title: d.title + " (copia)", updated: Date.now() }; setDocs(ds => [c, ...ds]); };
  const pick = (k: string) => { setSel(k); if (typeof window !== "undefined" && window.innerWidth < 960) setTimeout(() => document.getElementById("nb-panel")?.scrollIntoView({ behavior: "smooth", block: "start" }), 60); };

  const download = (name: string, blob: Blob) => { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1500); };
  const fileBase = (draft.title || "nube").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "") || "nube";
  const exportSvg = () => { if (!svgRef.current) return; const s = new XMLSerializer().serializeToString(svgRef.current); download(fileBase + ".svg", new Blob([s], { type: "image/svg+xml" })); };
  const exportPng = () => { if (!svgRef.current) return; const s = new XMLSerializer().serializeToString(svgRef.current); const img = new Image(); img.onload = () => { const c = document.createElement("canvas"); c.width = W * 2; c.height = H * 2; const x = c.getContext("2d"); if (!x) return; x.fillStyle = "#fffdf8"; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height); c.toBlob(b => b && download(fileBase + ".png", b), "image/png"); }; img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(s); };
  const exportJson = () => download("nubes-de-palabras.json", new Blob([JSON.stringify({ docs, settings: st }, null, 2)], { type: "application/json" }));
  const importJson = (f: File | undefined) => { if (!f) return; f.text().then(t => { try { const d = JSON.parse(t); const incoming: Doc[] = (d.docs || []).filter((x: any) => x && typeof x.text === "string").map((x: any) => ({ id: x.id || uid(), title: String(x.title || "Importado"), text: x.text, tags: x.tags || {}, updated: x.updated || Date.now() })); setDocs(ds => { const ids = new Set(ds.map(x => x.id)); return [...incoming.map(x => ids.has(x.id) ? { ...x, id: uid() } : x), ...ds]; }); setMsg(`${incoming.length} texto(s) importado(s).`); } catch { setMsg("Ese fichero no es una copia válida."); } }); };

  const max = an.words[0]?.weight || 1;
  const svgLabel = `Nube de palabras de «${draft.title}» con ${an.words.length} palabras`;
  const wordProps = (w: WordStat) => ({ onClick: () => pick(w.key), onMouseEnter: () => setHover(w.key), onMouseLeave: () => setHover(null), role: "button", tabIndex: 0, onKeyDown: (e: React.KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(w.key); } }, "aria-label": `${w.label}: ${w.count} apariciones${w.tagHits ? `, ${w.tagHits} etiquetas` : ""}` });

  const cloud = (
    <div>
      <div className="nb-stage">
        {!an.words.length && <div style={{ padding: 40, textAlign: "center", color: "#6b7590" }}>Aún no hay palabras. Pega un texto en la pestaña «Texto».</div>}
        {an.words.length > 0 && (tpl.layout === "spiral" || tpl.layout === "bubbles") && (
          <svg ref={svgRef} viewBox={fitViewBox(lay.placed)} width={W} height={H} xmlns="http://www.w3.org/2000/svg" role="img" aria-label={svgLabel}>
            <rect x={-W} y={-H} width={W * 3} height={H * 3} fill="#fffdf8" />
            {tpl.layout === "bubbles" && lay.placed.map(p => (
              <g key={p.w.key} {...wordProps(p.w)} opacity={sel && sel !== p.w.key ? 0.4 : 1}>
                <circle cx={p.x} cy={p.y} r={p.r} fill={p.color} stroke={p.w.tagHits ? "#1c2333" : "none"} strokeWidth={2} strokeDasharray={p.w.tagHits ? "5 4" : undefined} />
                <text x={p.x} y={p.y} fontSize={p.size} fontFamily={tpl.font} fontWeight={tpl.weight} fill="#fff" textAnchor="middle" dominantBaseline="central">{p.w.label}</text>
              </g>
            ))}
            {tpl.layout === "spiral" && lay.placed.map(p => (
              <text key={p.w.key} {...wordProps(p.w)} x={p.x} y={p.y} fontSize={p.size} fontFamily={tpl.font} fontWeight={tpl.weight} fill={p.color} textAnchor="middle" dominantBaseline="central"
                transform={p.rot ? `rotate(${p.rot} ${p.x} ${p.y})` : undefined} opacity={sel && sel !== p.w.key ? 0.3 : 1}
                textDecoration={p.w.tagHits ? "underline dotted" : undefined}>{tpl.upper ? p.w.label.toUpperCase() : p.w.label}</text>
            ))}
          </svg>
        )}
        {an.words.length > 0 && tpl.layout === "bars" && (
          <div className="nb-bars" style={{ padding: 14 }}>
            {an.words.slice(0, 40).map((w, i) => (
              <button key={w.key} className="nb-bar" aria-pressed={sel === w.key} onClick={() => pick(w.key)} onMouseEnter={() => setHover(w.key)} onMouseLeave={() => setHover(null)}>
                <span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textDecoration: w.tagHits ? "underline dotted" : "none" }}>{w.label}</span>
                <span style={{ display: "flex" }}><i style={{ width: `${(w.count / max) * 100}%`, background: colors[i % colors.length] }} />{w.tagHits > 0 && <i style={{ width: `${(w.tagHits * st.tagWeight / max) * 100}%`, background: `repeating-linear-gradient(45deg, ${colors[i % colors.length]}, ${colors[i % colors.length]} 3px, #fff 3px, #fff 6px)`, border: `1px solid ${colors[i % colors.length]}` }} />}</span>
                <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{w.weight}</span>
              </button>
            ))}
          </div>
        )}
        {an.words.length > 0 && tpl.layout === "flow" && (
          <div className="nb-flow" style={{ fontFamily: tpl.font }}>
            {[...an.words].sort((a, b) => a.key.localeCompare(b.key)).map((w, i) => (
              <button key={w.key} onClick={() => pick(w.key)} onMouseEnter={() => setHover(w.key)} onMouseLeave={() => setHover(null)}
                style={{ fontSize: 13 + 40 * Math.sqrt(w.weight / max), fontWeight: tpl.weight, color: colors[i % colors.length], opacity: sel && sel !== w.key ? 0.35 : 1, textDecoration: w.tagHits ? "underline dotted" : "none" }}>{w.label}</button>
            ))}
          </div>
        )}
        {hovWord && !selWord && (
          <div className="nb-tip"><b>{hovWord.label}</b> · {hovWord.count} aparición(es){hovWord.tagHits ? ` + ${hovWord.tagHits} etiqueta(s)` : ""} · «{(an.sentences[hovWord.sentences[0]] || "").slice(0, 150)}{(an.sentences[hovWord.sentences[0]] || "").length > 150 ? "…" : ""}»{hovWord.sentences.length > 1 ? ` · y ${hovWord.sentences.length - 1} frase(s) más — pulsa para verlas` : ""}</div>
        )}
      </div>
      <p className="nb-legend">
        <b>Cómo leerlo:</b> el tamaño de cada palabra es su peso = apariciones en el texto + etiquetas × {st.tagWeight}. El color solo distingue palabras, no significa nada. El <u style={{ textDecorationStyle: "dotted" }}>subrayado punteado</u>{tpl.layout === "bubbles" ? " o el borde discontinuo" : ""}{tpl.layout === "bars" ? " y el tramo rayado de la barra" : ""} indica que parte del peso viene de etiquetas. Pasa el cursor para ver una frase; pulsa para verlas todas.
        {lay.skipped > 0 && <> No cabían {lay.skipped} palabra(s) en esta plantilla: baja «Máx. palabras» o prueba Ranking.</>}
      </p>
    </div>
  );

  const panel = (
    <div className="nb-card" id="nb-panel">
      {selWord ? (<>
        <div className="nb-row" style={{ justifyContent: "space-between" }}>
          <h2 style={{ margin: 0, fontFamily: "'Fraunces',Georgia,serif", fontSize: 22 }}>{selWord.label}</h2>
          <button className="nb-btn ghost" onClick={() => setSel(null)}>Cerrar</button>
        </div>
        <p className="nb-note" style={{ marginTop: 4 }}>{selWord.count} aparición(es) en el texto{selWord.tagHits ? ` + ${selWord.tagHits} etiqueta(s) × ${st.tagWeight}` : ""} = peso {selWord.weight} · en {selWord.sentences.length} frase(s)</p>
        {selWord.sentences.map(i => <SentenceItem key={i} text={an.sentences[i]} word={selWord.key} tags={draft.tags[an.sentences[i]] || []} onAdd={(t) => addTag(an.sentences[i], t)} onRemove={(t) => removeTag(an.sentences[i], t)} />)}
        <div className="nb-row" style={{ marginTop: 8 }}>
          <button className="nb-btn ghost" onClick={() => { setSt(s => ({ ...s, exclude: (s.exclude ? s.exclude + ", " : "") + selWord.key })); setSel(null); }}>Excluir «{selWord.label}» de la nube</button>
        </div>
      </>) : (<>
        <h2 style={{ margin: 0, fontFamily: "'Fraunces',Georgia,serif", fontSize: 20 }}>Frases</h2>
        <p className="nb-note" style={{ marginTop: 4 }}>Pulsa una palabra de la nube y aquí aparecerán las frases donde está, con la palabra resaltada. Desde cada frase puedes añadirle etiquetas.</p>
        <p className="nb-note">{an.sentences.length} frases · {an.total} palabras · {an.words.length} en la nube · {tagCount} etiqueta(s)</p>
      </>)}
    </div>
  );

  const controls = (
    <div className="nb-card" style={{ display: "grid", gap: 12 }}>
      <div>
        <label>Plantilla</label>
        <div className="nb-tpl">{TEMPLATES.map(t => <button key={t.id} aria-pressed={st.template === t.id} onClick={() => setSt(s => ({ ...s, template: t.id }))}><b style={{ fontFamily: t.font }}>{t.name}</b><span>{t.hint}</span></button>)}</div>
      </div>
      <div>
        <label>Paleta de color</label>
        <div className="nb-tpl">{Object.entries(PALETTES).map(([k, p]) => <button key={k} aria-pressed={st.palette === k} onClick={() => setSt(s => ({ ...s, palette: k }))}><b><span className="nb-sw">{p.colors.map(c => <i key={c} style={{ background: c }} />)}</span>{p.name}</b></button>)}</div>
      </div>
      <div className="nb-grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))" }}>
        <div><label htmlFor="nb-max">Máx. palabras: {st.maxWords}</label><input id="nb-max" type="range" min={10} max={150} step={5} value={st.maxWords} onChange={(e) => setSt(s => ({ ...s, maxWords: +e.target.value }))} style={{ width: "100%" }} /></div>
        <div><label htmlFor="nb-min">Longitud mínima: {st.minLen} letras</label><input id="nb-min" type="range" min={1} max={8} value={st.minLen} onChange={(e) => setSt(s => ({ ...s, minLen: +e.target.value }))} style={{ width: "100%" }} /></div>
        <div><label htmlFor="nb-tw">Peso de cada etiqueta: {st.tagWeight}</label><input id="nb-tw" type="range" min={1} max={10} value={st.tagWeight} onChange={(e) => setSt(s => ({ ...s, tagWeight: +e.target.value }))} style={{ width: "100%" }} /></div>
      </div>
      <div className="nb-row">
        <label style={{ display: "flex", alignItems: "center", gap: 8, margin: 0, textTransform: "none", letterSpacing: 0, fontSize: 14, fontWeight: 500, color: "#1c2333" }}><input type="checkbox" checked={st.stop} onChange={(e) => setSt(s => ({ ...s, stop: e.target.checked }))} />Ignorar palabras vacías (el, de, que, the, and…)</label>
      </div>
      <div><label htmlFor="nb-ex">Palabras excluidas (separadas por comas)</label><input id="nb-ex" type="text" value={st.exclude} onChange={(e) => setSt(s => ({ ...s, exclude: e.target.value }))} placeholder="ej. proyecto, cosa" /></div>
      <div className="nb-row">
        {(tpl.layout === "spiral" || tpl.layout === "bubbles") && <><button className="nb-btn ghost" onClick={() => setSeed(s => s + 1)}>Recolocar</button><button className="nb-btn ghost" onClick={exportPng}>Descargar PNG</button><button className="nb-btn ghost" onClick={exportSvg}>Descargar SVG</button></>}
      </div>
    </div>
  );

  return (
    <div className="nb">
      <style>{CSS}</style>
      <div className="nb-wrap">
        <h1>Nubes de <em>palabras</em></h1>
        <p className="lead">Pega un texto y mira qué palabras pesan más. Pulsa una palabra para leer las frases donde aparece, etiqueta frases con las ideas que quieras destacar y guarda tus textos para volver a ellos.</p>
        <div className="nb-tabs" role="tablist">
          {([["texto", "1 · Texto"], ["nube", "2 · Nube"], ["frases", `3 · Frases y etiquetas${tagCount ? ` (${tagCount})` : ""}`], ["guardados", `Guardados (${docs.length})`], ["guia", "Guía"]] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className="nb-tab" onClick={() => setTab(k)}>{l}</button>)}
        </div>
        <div className="nb-row" style={{ marginBottom: 12 }}>
          <input type="text" value={draft.title} onChange={(e) => upd({ title: e.target.value })} aria-label="Título del texto" style={{ flex: "1 1 220px", fontWeight: 600 }} />
          <button className="nb-btn" onClick={save} disabled={!draft.text.trim() || !dirty}>{dirty ? "Guardar" : "Guardado"}</button>
          <button className="nb-btn ghost" onClick={fresh}>Nuevo</button>
          {msg && <span role="status" style={{ fontSize: 13, color: "#0f766e", fontWeight: 600 }}>{msg}</span>}
        </div>

        {tab === "texto" && (
          <div className="nb-card">
            <label htmlFor="nb-text">Tu texto</label>
            <textarea id="nb-text" value={draft.text} onChange={(e) => upd({ text: e.target.value })} placeholder="Pega aquí el texto: un informe, unas notas, respuestas de una encuesta…" />
            <div className="nb-row" style={{ marginTop: 10 }}>
              <button className="nb-btn" disabled={!draft.text.trim()} onClick={() => setTab("nube")}>Ver la nube →</button>
              <button className="nb-btn ghost" onClick={() => upd({ text: SAMPLE, title: draft.title === "Texto sin título" ? "Ejemplo" : draft.title })}>Cargar un ejemplo</button>
              <span className="nb-note" style={{ margin: 0 }}>{an.sentences.length} frases · {an.total} palabras</span>
            </div>
            <p className="nb-note">Una frase termina en punto, interrogación, exclamación o salto de línea. Si editas una frase que tenía etiquetas, esas etiquetas se sueltan (van unidas al texto exacto de la frase).</p>
          </div>
        )}

        {tab === "nube" && (
          <div className="nb-grid two">
            <div style={{ display: "grid", gap: 14 }}>{cloud}{controls}</div>
            {panel}
          </div>
        )}

        {tab === "frases" && (
          <div className="nb-card">
            <p className="nb-note" style={{ marginTop: 0 }}>Cada etiqueta que añadas a una frase cuenta en la nube como {st.tagWeight} aparición(es) de esa palabra o expresión. Sirve para destacar ideas que el texto no nombra literalmente (por ejemplo «riesgo» en una frase que habla de retrasos).</p>
            {!an.sentences.length && <p className="nb-note">Aún no hay frases.</p>}
            {an.sentences.map((s, i) => <SentenceItem key={i + s.slice(0, 12)} text={s} word={null} tags={draft.tags[s] || []} onAdd={(t) => addTag(s, t)} onRemove={(t) => removeTag(s, t)} />)}
          </div>
        )}

        {tab === "guardados" && (
          <div className="nb-card">
            {!docs.length && <p className="nb-note" style={{ marginTop: 0 }}>Todavía no has guardado ningún texto. Pulsa «Guardar» arriba.</p>}
            {docs.map(d => (
              <div key={d.id} className="nb-doc">
                <div><b>{d.title}</b>{d.id === draft.id ? " · abierto" : ""}<br /><small>{new Date(d.updated).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })} · {splitSentences(d.text).length} frases · {Object.values(d.tags).reduce((n, a) => n + a.length, 0)} etiquetas</small></div>
                <div className="nb-row"><button className="nb-btn ghost" onClick={() => open(d)}>Abrir</button><button className="nb-btn ghost" onClick={() => dup(d)}>Duplicar</button><button className="nb-btn danger" onClick={() => del(d.id)}>Borrar</button></div>
              </div>
            ))}
            <div className="nb-row" style={{ marginTop: 12 }}>
              <button className="nb-btn ghost" onClick={exportJson} disabled={!docs.length}>Exportar copia (.json)</button>
              <label className="nb-btn ghost" style={{ margin: 0, textTransform: "none", letterSpacing: 0, fontSize: 14, color: "#1f2a44" }}>Importar copia<input type="file" accept="application/json,.json" style={{ display: "none" }} onChange={(e) => { importJson(e.target.files?.[0]); e.target.value = ""; }} /></label>
            </div>
            <p className="nb-note">Los textos se guardan solo en este navegador y en este dispositivo: no se suben a ningún servidor. Para llevarlos a otro dispositivo, exporta la copia e impórtala allí.</p>
          </div>
        )}

        {tab === "guia" && (
          <div className="nb-card nb-guide">
            <h3 style={{ marginTop: 0 }}>Cómo se usa</h3>
            <ol>
              <li><b>Texto.</b> Pega el texto y ponle título.</li>
              <li><b>Nube.</b> Elige plantilla y paleta. Pasa el cursor sobre una palabra para ver una frase; púlsala para ver todas las frases donde aparece.</li>
              <li><b>Etiquetas.</b> En cualquier frase, escribe una etiqueta y pulsa Añadir. La etiqueta entra en la nube.</li>
              <li><b>Guardar.</b> Pulsa Guardar. En «Guardados» puedes abrir, duplicar, borrar y exportar.</li>
            </ol>
            <h3>Las plantillas</h3>
            <ul>
              <li><b>Clásica, Editorial y Pop</b>: nube en espiral; cambian la tipografía y cuántas palabras van en vertical.</li>
              <li><b>Burbujas</b>: un círculo por palabra; el área crece con el peso. Muestra como mucho 45.</li>
              <li><b>Ranking</b>: barras ordenadas; la mejor para comparar con precisión. Tramo liso = apariciones, tramo rayado = etiquetas.</li>
              <li><b>Párrafo</b>: palabras en orden alfabético, para buscar una concreta.</li>
            </ul>
            <h3>Glosario</h3>
            <dl>
              <dt>Aparición</dt><dd>Cada vez que la palabra sale escrita en el texto. No distingue mayúsculas; sí distingue singular de plural.</dd>
              <dt>Etiqueta</dt><dd>Palabra o expresión que tú asignas a una frase. Puede no estar en el texto.</dd>
              <dt>Peso</dt><dd>Apariciones + etiquetas × «peso de cada etiqueta». Es lo que decide el tamaño.</dd>
              <dt>Palabras vacías</dt><dd>Artículos, preposiciones y similares en español e inglés (el, de, que, the, and…). Se ignoran si la casilla está marcada.</dd>
              <dt>Recolocar</dt><dd>Vuelve a repartir las palabras por el lienzo; los tamaños no cambian.</dd>
            </dl>
            <h3>Límites</h3>
            <p>La nube resume frecuencia, no importancia: una palabra grande solo es una palabra repetida. Las etiquetas son tu criterio, y al subir su peso la nube refleja más tu lectura que el texto. El PNG descargado puede usar una tipografía distinta de la de pantalla; el SVG conserva la referencia a la fuente.</p>
          </div>
        )}
      </div>
    </div>
  );
}
