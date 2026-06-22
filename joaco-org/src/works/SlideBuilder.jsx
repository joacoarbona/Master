import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";

/* ============================================================================
   DCOS Slide Builder
   Turns a deck JSON (as emitted by the DCOS Studio in Snowflake) — or pasted
   HTML — into a navigable, AstraZeneca-branded slide deck. Present with the
   keyboard, export a self-contained HTML, or download the JSON.

   Deck JSON schema (the contract shared with the Snowflake Studio):
     { deck, brand, date, accent, slides: [ {type, ...} ] }
     slide types: title | stats | bullets | table | twocol | close
   ========================================================================== */

const C = {
  mul: "#830051", mulDk: "#4D0030", mulLt: "#F6E9F1", gold: "#F0AB00", goldLt: "#FDF3DC",
  graph: "#3F4444", graphDk: "#2B3333", ink: "#1C2222", mid: "#6B6B6B", faint: "#9AA3A0",
  line: "#D9D6D2", soft: "#F6F4F2", navy: "#003865", navyLt: "#E7EEF4", lime: "#5E7A00",
  limeLt: "#EFF4D6", gld: "#8A6200", red: "#B3261E", redLt: "#F8E9E8", white: "#FFFFFF",
};
const HEAD = "Arial, 'Helvetica Neue', sans-serif";
const BODY = "Calibri, 'Segoe UI', system-ui, sans-serif";
const MONO = "'Courier New', ui-monospace, monospace";
const RC = { G: ["#E8F2E9", "#2E7D32"], A: ["#FBF0DC", "#C77800"], R: ["#F8E9E8", "#B3261E"] };
const SC = {
  "on track": ["#E8F2E9", "#2E7D32"], "at risk": ["#FBF0DC", "#C77800"],
  "realised": ["#E7EEF4", "#003865"], "written off": ["#F8E9E8", "#B3261E"],
};

const SAMPLE = {
  deck: "Portfolio Review", brand: "AstraZeneca · OBU DSAI", date: "2026-06-16", accent: C.mul,
  slides: [
    { type: "title", kicker: "AstraZeneca · OBU DSAI · DCOS", title: "Portfolio Review", title2: "2026-06-16", subtitle: "3 projects · attention on 2 · assembled from live data" },
    { type: "stats", kicker: "Snapshot", title: "Where the portfolio stands", cards: [{ big: "3", label: "active projects" }, { big: "1", label: "RAG reds" }, { big: "4", label: "RAG ambers" }, { big: "2", label: "benefits at risk" }] },
    { type: "table", kicker: "Run & Govern", title: "RAG board — every project", columns: ["Project", "Tier", "Phase", "Sc", "Sch", "Bud", "Rsk", "Adp", "PM"], rag_cols: [3, 4, 5, 6, 7], rows: [["Insight Assistant", "B", "Deliver", "G", "A", "G", "A", "G", "M. Serra"], ["Field Excellence", "C", "Embed", "G", "G", "A", "G", "A", "A. Ribeiro"], ["KOL Atlas", "B", "Mobilise", "A", "R", "G", "A", "G", "M. Serra"]] },
    { type: "twocol", kicker: "Decisions & value", title: "Decided, and what we're chasing", left_title: "Decisions", left: ["Sunset legacy banners 30 days before switch-off", "Co-design new analyst role with the union"], right_title: "Benefits", right: ["Same-day answer rate (at risk)", "Analyst hours saved (on track)"] },
    { type: "bullets", kicker: "Headline", title: "What the Director should know", items: ["Adoption 68% vs 80% target — leading indicator improving", "Vendor slip risk on KOL Atlas; mitigation owned and dated", "Value review opens next cycle with owned benefits"] },
    { type: "close", title: "Tailor to risk · make value visible", subtitle: "P80 communicated upward, P50 managed to · this pack supports the systems of record, never replaces them." },
  ],
};

const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/* ---------- one slide, as React (1280×720 canvas) ---------- */
function Slide({ s }) {
  const t = s.type;
  const chrome = (
    <>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 10, background: C.mul }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 10, background: C.mul }} />
      <div style={{ position: "absolute", top: 26, left: 72, fontFamily: BODY, fontWeight: 800, color: C.mul, fontSize: 15 }}>AstraZeneca</div>
      {s.kicker && <div style={{ position: "absolute", top: 28, right: 72, fontFamily: MONO, fontSize: 11, letterSpacing: ".18em", color: C.faint, textTransform: "uppercase" }}>{s.kicker}</div>}
    </>
  );
  const base = { position: "absolute", inset: 0, width: 1280, height: 720, background: "#fff", padding: "64px 72px", fontFamily: BODY, overflow: "hidden" };

  if (t === "title") {
    return (<div style={base}>{chrome}
      <h1 style={{ fontFamily: HEAD, fontSize: 44, lineHeight: 1.08, marginTop: 60, fontWeight: 800 }}>
        <span style={{ color: C.graph }}>{s.title} </span><span style={{ color: C.mul }}>{s.title2}</span>
      </h1>
      <div style={{ width: 54, height: 5, background: C.gold, margin: "16px 0 6px" }} />
      <div style={{ fontSize: 20, color: C.mid, marginTop: 16, maxWidth: 1000 }}>{s.subtitle}</div>
    </div>);
  }
  if (t === "close") {
    return (<div style={{ ...base, background: C.graph }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 10, background: C.mul }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 10, background: C.mul }} />
      <div style={{ position: "absolute", top: 120, left: 72, fontFamily: MONO, color: C.gold, fontSize: 13, letterSpacing: ".2em" }}>DCOS · THE OPERATING SYSTEM</div>
      <h1 style={{ position: "absolute", top: 175, left: 72, right: 72, color: "#fff", fontFamily: HEAD, fontSize: 48, fontWeight: 800, lineHeight: 1.1 }}>{s.title}</h1>
      <div style={{ position: "absolute", top: 370, left: 72, right: 72, color: "#D7DCDA", fontSize: 19, lineHeight: 1.35 }}>{s.subtitle}</div>
    </div>);
  }
  if (t === "stats") {
    return (<div style={base}>{chrome}
      <H2 title={s.title} />
      <div style={{ display: "flex", gap: 18, marginTop: 54, flexWrap: "wrap" }}>
        {(s.cards || []).map((c, i) => (
          <div key={i} style={{ flex: 1, minWidth: 200, background: C.soft, borderRadius: 14, padding: "30px 28px" }}>
            <div style={{ fontFamily: HEAD, fontSize: 58, fontWeight: 800, color: C.navy, lineHeight: 1 }}>{c.big}</div>
            <div style={{ fontSize: 15, color: C.graph, fontWeight: 700, marginTop: 12 }}>{c.label}</div>
          </div>
        ))}
      </div>
    </div>);
  }
  if (t === "bullets") {
    return (<div style={base}>{chrome}
      <H2 title={s.title} />
      <ul style={{ marginTop: 48, listStyle: "none", padding: 0 }}>
        {(s.items || []).map((x, i) => (
          <li key={i} style={{ fontSize: 22, color: C.ink, marginBottom: 20, paddingLeft: 30, position: "relative", lineHeight: 1.3 }}>
            <span style={{ position: "absolute", left: 0, top: 10, width: 13, height: 13, borderRadius: "50%", background: C.lime }} />{x}
          </li>
        ))}
      </ul>
    </div>);
  }
  if (t === "twocol") {
    const col = (title, items, dot) => (
      <div style={{ flex: 1, background: C.soft, borderRadius: 14, padding: "26px 28px" }}>
        <div style={{ fontFamily: HEAD, fontSize: 18, color: C.mul, marginBottom: 16, letterSpacing: ".04em", fontWeight: 700 }}>{title}</div>
        {(items || []).map((x, i) => (
          <div key={i} style={{ fontSize: 17, color: C.ink, marginBottom: 13, paddingLeft: 22, position: "relative", lineHeight: 1.3 }}>
            <span style={{ position: "absolute", left: 0, top: 8, width: 9, height: 9, borderRadius: "50%", background: dot }} />{x}
          </div>
        ))}
      </div>
    );
    return (<div style={base}>{chrome}<H2 title={s.title} />
      <div style={{ display: "flex", gap: 28, marginTop: 46 }}>{col(s.left_title, s.left, C.navy)}{col(s.right_title, s.right, C.lime)}</div>
    </div>);
  }
  if (t === "table") {
    const ragCols = new Set(s.rag_cols || []);
    const statusCol = s.status_col != null ? s.status_col : -1;
    return (<div style={base}>{chrome}<H2 title={s.title} />
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 46, fontSize: 16 }}>
        <thead><tr>{(s.columns || []).map((c, i) => (
          <th key={i} style={{ textAlign: "left", fontFamily: MONO, fontSize: 11, letterSpacing: ".06em", textTransform: "uppercase", color: C.faint, padding: "8px 10px", borderBottom: `2px solid ${C.line}` }}>{c}</th>
        ))}</tr></thead>
        <tbody>{(s.rows || []).map((row, ri) => (
          <tr key={ri} style={{ background: ri % 2 ? "#FBFAF9" : "transparent" }}>
            {row.map((cell, ci) => {
              const cv = String(cell);
              const tag = (bg, fg, txt) => <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 20, fontWeight: 700, fontSize: 13, background: bg, color: fg }}>{txt}</span>;
              let inner = cv;
              if (ragCols.has(ci) && RC[cv]) inner = tag(RC[cv][0], RC[cv][1], cv);
              else if (ci === statusCol && SC[cv]) inner = tag(SC[cv][0], SC[cv][1], cv);
              return <td key={ci} style={{ padding: "9px 10px", borderBottom: `1px solid ${C.soft}`, color: C.ink }}>{inner}</td>;
            })}
          </tr>
        ))}</tbody>
      </table>
    </div>);
  }
  return (<div style={base}>{chrome}<H2 title={s.title || "Slide"} /></div>);
}
const H2 = ({ title }) => <h2 style={{ fontFamily: HEAD, fontSize: 30, color: C.graph, marginTop: 42, fontWeight: 800 }}>{title}</h2>;

/* ---------- export: self-contained HTML (mirrors the Python renderer) ---------- */
function buildHtml(deck) {
  const slideHtml = (s) => {
    const chrome = `<div class="bar t"></div><div class="bar b"></div><div class="wm">AstraZeneca</div>${s.kicker ? `<div class="kick">${esc(s.kicker)}</div>` : ""}`;
    if (s.type === "title") return `<section class="slide">${chrome}<h1><span class="a">${esc(s.title)}</span> <span class="m">${esc(s.title2)}</span></h1><div class="dash"></div><div class="sub">${esc(s.subtitle)}</div></section>`;
    if (s.type === "close") return `<section class="slide close"><div class="bar t"></div><div class="bar b"></div><div class="ck">DCOS · THE OPERATING SYSTEM</div><h1>${esc(s.title)}</h1><div class="sub">${esc(s.subtitle)}</div></section>`;
    if (s.type === "stats") return `<section class="slide">${chrome}<h2>${esc(s.title)}</h2><div class="cards">${(s.cards || []).map(c => `<div class="card"><div class="big">${esc(c.big)}</div><div class="lab">${esc(c.label)}</div></div>`).join("")}</div></section>`;
    if (s.type === "bullets") return `<section class="slide">${chrome}<h2>${esc(s.title)}</h2><ul>${(s.items || []).map(x => `<li>${esc(x)}</li>`).join("")}</ul></section>`;
    if (s.type === "twocol") { const c = (t, it) => `<div class="col"><h3>${esc(t)}</h3>${(it || []).map(x => `<div class="it">${esc(x)}</div>`).join("")}</div>`; return `<section class="slide">${chrome}<h2>${esc(s.title)}</h2><div class="cols">${c(s.left_title, s.left)}${c(s.right_title, s.right)}</div></section>`; }
    if (s.type === "table") {
      const ragCols = new Set(s.rag_cols || []); const statusCol = s.status_col != null ? s.status_col : -1;
      const head = (s.columns || []).map(c => `<th>${esc(c)}</th>`).join("");
      const body = (s.rows || []).map(row => `<tr>${row.map((cell, ci) => {
        const cv = String(cell);
        if (ragCols.has(ci) && RC[cv]) return `<td><span class="tag" style="background:${RC[cv][0]};color:${RC[cv][1]}">${cv}</span></td>`;
        if (ci === statusCol && SC[cv]) return `<td><span class="tag" style="background:${SC[cv][0]};color:${SC[cv][1]}">${esc(cv)}</span></td>`;
        return `<td>${esc(cv)}</td>`;
      }).join("")}</tr>`).join("");
      return `<section class="slide">${chrome}<h2>${esc(s.title)}</h2><table><tr>${head}</tr>${body}</table></section>`;
    }
    return `<section class="slide">${chrome}<h2>${esc(s.title || "")}</h2></section>`;
  };
  const css = `:root{--mul:#830051;--gold:#F0AB00;--graph:#3F4444;--ink:#1C2222;--mid:#6B6B6B;--faint:#9AA3A0;--line:#D9D6D2;--soft:#F6F4F2;--navy:#003865;--lime:#5E7A00}*{box-sizing:border-box;margin:0;padding:0}body{background:#2B3333;font-family:Calibri,'Segoe UI',Arial,sans-serif;color:var(--ink);overflow:hidden}#stage{position:fixed;top:50%;left:50%;width:1280px;height:720px;transform-origin:center;background:#fff}.slide{position:absolute;inset:0;width:1280px;height:720px;background:#fff;display:none;padding:64px 72px}.slide.on{display:block}.bar{position:absolute;left:0;right:0;height:10px;background:var(--mul)}.bar.t{top:0}.bar.b{bottom:0}.wm{position:absolute;top:26px;left:72px;font-weight:800;color:var(--mul);font-size:15px}.kick{position:absolute;top:28px;right:72px;font-family:'Courier New',monospace;font-size:11px;letter-spacing:.18em;color:var(--faint);text-transform:uppercase}h1{font-family:Arial;font-size:44px;line-height:1.08;margin-top:60px;font-weight:800}h1 .a{color:var(--graph)}h1 .m{color:var(--mul)}.dash{width:54px;height:5px;background:var(--gold);margin:16px 0 6px}.sub{font-size:20px;color:var(--mid);margin-top:16px;max-width:1000px}h2{font-family:Arial;font-size:30px;color:var(--graph);margin-top:42px;font-weight:800}.cards{display:flex;gap:18px;margin-top:54px;flex-wrap:wrap}.card{flex:1;min-width:200px;background:var(--soft);border-radius:14px;padding:30px 28px}.card .big{font-family:Arial;font-size:58px;font-weight:800;color:var(--navy);line-height:1}.card .lab{font-size:15px;color:var(--graph);font-weight:700;margin-top:12px}ul{margin-top:48px;list-style:none}li{font-size:22px;color:var(--ink);margin-bottom:20px;padding-left:30px;position:relative;line-height:1.3}li:before{content:"";position:absolute;left:0;top:10px;width:13px;height:13px;border-radius:50%;background:var(--lime)}table{width:100%;border-collapse:collapse;margin-top:46px;font-size:16px}th{text-align:left;font-family:'Courier New',monospace;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--faint);padding:8px 10px;border-bottom:2px solid var(--line)}td{padding:9px 10px;border-bottom:1px solid var(--soft);color:var(--ink)}tr:nth-child(even) td{background:#FBFAF9}.tag{display:inline-block;padding:2px 10px;border-radius:20px;font-weight:700;font-size:13px}.cols{display:flex;gap:28px;margin-top:46px}.col{flex:1;background:var(--soft);border-radius:14px;padding:26px 28px}.col h3{font-family:Arial;font-size:18px;color:var(--mul);margin-bottom:16px;font-weight:700}.col .it{font-size:17px;color:var(--ink);margin-bottom:13px;padding-left:22px;position:relative;line-height:1.3}.col .it:before{content:"";position:absolute;left:0;top:8px;width:9px;height:9px;border-radius:50%;background:var(--mul)}.close{background:var(--graph)}.close .ck{position:absolute;top:120px;left:72px;font-family:'Courier New',monospace;color:var(--gold);font-size:13px;letter-spacing:.2em}.close h1{color:#fff;font-size:48px;margin-top:0;position:absolute;top:175px;left:72px;right:72px}.close .sub{color:#D7DCDA;position:absolute;top:370px;left:72px;right:72px;font-size:19px}#nav{position:fixed;bottom:18px;left:50%;transform:translateX(-50%);display:flex;gap:10px;align-items:center;background:rgba(0,0,0,.4);padding:8px 14px;border-radius:30px;z-index:10}#nav button{background:none;border:1px solid #888;color:#eee;border-radius:20px;padding:5px 13px;cursor:pointer;font-size:13px}#nav span{color:#ccc;font-family:'Courier New',monospace;font-size:12px}@media print{body{background:#fff;overflow:visible}#nav{display:none}#stage{position:static;transform:none!important;width:100%;height:auto}.slide{display:block!important;position:relative;width:100%;height:100vh;page-break-after:always;inset:auto}@page{size:landscape;margin:0}}`;
  const js = `var sl=[].slice.call(document.querySelectorAll('.slide')),i=0,n=sl.length;function show(k){i=Math.max(0,Math.min(n-1,k));sl.forEach(function(s,j){s.classList.toggle('on',j===i)});var c=document.getElementById('cnt');if(c)c.textContent=(i+1)+' / '+n;}function fit(){var s=document.getElementById('stage'),sc=Math.min(innerWidth/1280,innerHeight/720)*0.96;s.style.transform='translate(-50%,-50%) scale('+sc+')';}addEventListener('resize',fit);addEventListener('keydown',function(e){if(e.key==='ArrowRight'||e.key===' ')show(i+1);else if(e.key==='ArrowLeft')show(i-1);else if(e.key==='f'){document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen();}});document.getElementById('stage').addEventListener('click',function(){show(i+1)});fit();show(0);`;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(deck.deck || "Deck")}</title><style>${css}</style></head><body><div id="stage">${(deck.slides || []).map(slideHtml).join("")}</div><div id="nav"><button onclick="show(i-1)">‹</button><span id="cnt"></span><button onclick="show(i+1)">›</button><button onclick="window.print()">Print / PDF</button></div><script>${js}</script></body></html>`;
}

function download(name, text, mime) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ============================ APP ============================ */
export default function DCOSSlideBuilder() {
  const [deck, setDeck] = useState(SAMPLE);
  const [raw, setRaw] = useState(JSON.stringify(SAMPLE, null, 2));
  const [err, setErr] = useState("");
  const [idx, setIdx] = useState(0);
  const [panel, setPanel] = useState(true);      // left input panel open
  const [editing, setEditing] = useState(false); // JSON editor vs presenter
  const [htmlPreview, setHtmlPreview] = useState(null);
  const stageWrap = useRef(null);
  const [scale, setScale] = useState(1);

  const slides = deck?.slides || [];
  const clamp = useCallback((k) => Math.max(0, Math.min((slides.length || 1) - 1, k)), [slides.length]);

  // fit the 1280×720 stage to its container
  useEffect(() => {
    const fit = () => {
      const el = stageWrap.current; if (!el) return;
      const w = el.clientWidth, h = el.clientHeight;
      setScale(Math.min(w / 1280, h / 720) * 0.96);
    };
    fit(); window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [panel, htmlPreview]);

  // keyboard navigation
  useEffect(() => {
    const onKey = (e) => {
      if (editing || htmlPreview) return;
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); setIdx((i) => clamp(i + 1)); }
      else if (e.key === "ArrowLeft") setIdx((i) => clamp(i - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editing, htmlPreview, clamp]);

  const tryParse = (text) => {
    const s = text.trim();
    if (s.startsWith("<")) { setHtmlPreview(s); setErr(""); return; }
    try {
      const j = JSON.parse(s);
      if (!j.slides || !Array.isArray(j.slides)) throw new Error("JSON has no 'slides' array.");
      setDeck(j); setIdx(0); setErr(""); setHtmlPreview(null);
    } catch (e) { setErr(String(e.message || e)); }
  };

  const onFile = (file) => {
    const r = new FileReader();
    r.onload = () => { setRaw(typeof r.result === "string" ? r.result : ""); tryParse(String(r.result || "")); };
    r.readAsText(file);
  };

  const btn = (label, onClick, kind) => {
    const styles = {
      primary: { background: C.mul, color: "#fff", border: "none" },
      ghost: { background: "transparent", color: "#C9D2CF", border: "1px solid #4A5757" },
      light: { background: "#fff", color: C.mul, border: `1px solid ${C.line}` },
    }[kind || "light"];
    return <button onClick={onClick} style={{ ...styles, borderRadius: 8, padding: "8px 14px", fontFamily: HEAD, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{label}</button>;
  };

  const goFull = () => { const el = stageWrap.current; if (el && el.requestFullscreen) el.requestFullscreen(); };

  return (
    <div style={{ fontFamily: BODY, background: C.graphDk, minHeight: "100vh", color: C.ink, display: "flex", flexDirection: "column" }}>
      <style>{`*{box-sizing:border-box} button:focus-visible{outline:2px solid ${C.gold};outline-offset:2px} ::placeholder{color:${C.faint}}`}</style>

      {/* App bar */}
      <div style={{ height: 5, background: C.mul }} />
      <div style={{ background: C.graph, color: "#fff", padding: "12px 20px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".18em", color: C.gold }}>ASTRAZENECA · OBU DSAI · DCOS</div>
          <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 19 }}>Slide <span style={{ color: C.gold }}>Builder</span> <span style={{ color: "#9FB0AC", fontWeight: 600, fontSize: 13 }}>· JSON → deck</span></div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
          {btn(panel ? "Hide input" : "Show input", () => setPanel((p) => !p), "ghost")}
          {btn(editing ? "Present" : "Edit JSON", () => setEditing((e) => !e), "ghost")}
          {btn("Download HTML", () => download(`${(deck.deck || "deck").replace(/\s+/g, "_")}.html`, buildHtml(deck), "text/html"), "ghost")}
          {btn("Download JSON", () => download(`${(deck.deck || "deck").replace(/\s+/g, "_")}.json`, JSON.stringify(deck, null, 2), "application/json"), "ghost")}
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* Left: input / editor */}
        {panel && (
          <div style={{ width: 360, background: "#21282b", borderRight: "1px solid #3a4446", padding: 16, display: "flex", flexDirection: "column", gap: 10, overflow: "auto" }}>
            <div style={{ fontFamily: HEAD, fontWeight: 800, color: "#fff", fontSize: 14 }}>Load a deck</div>
            <div style={{ fontSize: 12, color: "#9FB0AC", lineHeight: 1.4 }}>Paste the JSON exported by the DCOS Studio in Snowflake, or drop a <b style={{ color: "#fff" }}>.json</b> / <b style={{ color: "#fff" }}>.html</b> file. The deck renders with the AstraZeneca master.</div>
            <div style={{ display: "flex", gap: 8 }}>
              <label style={{ background: C.mul, color: "#fff", borderRadius: 8, padding: "8px 12px", fontFamily: HEAD, fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>
                Upload file
                <input type="file" accept=".json,.html,.htm,application/json,text/html" style={{ display: "none" }}
                  onChange={(e) => { const f = e.target.files && e.target.files[0]; if (f) onFile(f); }} />
              </label>
              {btn("Load sample", () => { setRaw(JSON.stringify(SAMPLE, null, 2)); setDeck(SAMPLE); setIdx(0); setErr(""); setHtmlPreview(null); }, "ghost")}
            </div>
            <textarea value={raw} onChange={(e) => setRaw(e.target.value)} spellCheck={false}
              placeholder="Paste deck JSON here…"
              style={{ flex: 1, minHeight: 220, background: "#1b2123", color: "#D7DCDA", border: "1px solid #3a4446", borderRadius: 8, padding: 10, fontFamily: MONO, fontSize: 11.5, lineHeight: 1.45, resize: "vertical" }} />
            {btn("Render this", () => tryParse(raw), "primary")}
            {err && <div style={{ background: "#3a2224", color: "#FFC9C9", borderRadius: 8, padding: "8px 10px", fontSize: 12, fontFamily: MONO }}>{err}</div>}
            {htmlPreview && <div style={{ fontSize: 11.5, color: C.gold }}>Showing pasted HTML in preview. Switch to JSON to use the slide renderer.</div>}
          </div>
        )}

        {/* Right: presenter */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {editing ? (
            <div style={{ padding: 20, flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ color: "#9FB0AC", fontSize: 12.5 }}>Edit the deck JSON live, then press <b style={{ color: "#fff" }}>Render this</b> in the left panel. Slide types: <span style={{ fontFamily: MONO, color: C.gold }}>title · stats · bullets · table · twocol · close</span>.</div>
              <textarea value={raw} onChange={(e) => setRaw(e.target.value)} spellCheck={false}
                style={{ flex: 1, background: "#1b2123", color: "#D7DCDA", border: "1px solid #3a4446", borderRadius: 10, padding: 14, fontFamily: MONO, fontSize: 12.5, lineHeight: 1.5 }} />
              <div>{btn("Render this", () => { tryParse(raw); setEditing(false); }, "primary")}</div>
            </div>
          ) : htmlPreview ? (
            <iframe title="html-preview" srcDoc={htmlPreview} style={{ flex: 1, border: "none", background: "#fff" }} />
          ) : (
            <>
              {/* stage */}
              <div ref={stageWrap} style={{ flex: 1, position: "relative", overflow: "hidden", display: "grid", placeItems: "center", background: C.graphDk }}>
                {slides.length === 0 ? (
                  <div style={{ color: "#9FB0AC" }}>No slides — load a deck on the left.</div>
                ) : (
                  <div style={{ width: 1280, height: 720, transform: `scale(${scale})`, transformOrigin: "center", boxShadow: "0 12px 40px rgba(0,0,0,.45)", position: "relative", flex: "none" }}>
                    <Slide s={slides[clamp(idx)]} />
                  </div>
                )}
              </div>
              {/* controls */}
              <div style={{ background: "#21282b", borderTop: "1px solid #3a4446", padding: "8px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                {btn("‹ Prev", () => setIdx((i) => clamp(i - 1)), "ghost")}
                <span style={{ color: "#C9D2CF", fontFamily: MONO, fontSize: 12.5 }}>{slides.length ? clamp(idx) + 1 : 0} / {slides.length}</span>
                {btn("Next ›", () => setIdx((i) => clamp(i + 1)), "ghost")}
                <span style={{ color: "#6B7676", fontSize: 11.5, marginLeft: 6 }}>← → to navigate</span>
                <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                  {btn("Fullscreen", goFull, "ghost")}
                  {btn("Print / PDF", () => { const w = window.open("", "_blank"); if (w) { w.document.write(buildHtml(deck)); w.document.close(); setTimeout(() => w.print(), 400); } }, "light")}
                </div>
              </div>
              {/* filmstrip */}
              {slides.length > 0 && (
                <div style={{ background: "#1b2123", borderTop: "1px solid #3a4446", padding: "10px 12px", display: "flex", gap: 8, overflowX: "auto" }}>
                  {slides.map((s, i) => (
                    <button key={i} onClick={() => setIdx(i)} title={s.title || s.type}
                      style={{ flex: "none", width: 128, height: 72, borderRadius: 6, border: i === clamp(idx) ? `2px solid ${C.gold}` : "1px solid #3a4446", background: "#fff", overflow: "hidden", cursor: "pointer", padding: 0, position: "relative" }}>
                      <div style={{ width: 1280, height: 720, transform: "scale(0.1)", transformOrigin: "top left", pointerEvents: "none" }}>
                        <Slide s={s} />
                      </div>
                      <span style={{ position: "absolute", bottom: 2, right: 4, fontFamily: MONO, fontSize: 9, color: C.faint, background: "rgba(255,255,255,.8)", borderRadius: 3, padding: "0 3px" }}>{i + 1}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
