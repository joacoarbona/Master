import React, { useState, useEffect, useRef, useMemo } from "react";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell, Label, LineChart, Line } from "recharts";
import Papa from "papaparse";

/* ============================================================
   DCOS NAVIGATOR — Delivery Intelligence Cockpit
   AstraZeneca OBU DSAI · Delivery & Change Office
   Persistent working tool: Portfolio · Health Scan · Priority Lab ·
   Delivery Canvas · Playbook patterns.
   ============================================================ */

const C = {
  mul: "#830051", mulDk: "#5C0039", mulLt: "#F6E9F1",
  gold: "#F0AB00", goldLt: "#FDF3DC",
  navy: "#003865", navyLt: "#E7EEF4",
  lime: "#8A9900", limeLt: "#EFF4D6",
  graph: "#2B3333", ink: "#1C2222", mid: "#5B6770", faint: "#8A949B",
  bg: "#FAF8F6", line: "#E6E1DC", soft: "#F2EFEB",
  green: "#2E7D32", amber: "#C77800", red: "#B3261E",
};
const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700;800&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');`;
const DISP = "'Archivo', sans-serif", BODY = "'Inter', sans-serif", MONO = "'IBM Plex Mono', monospace";

/* ---- i18n (UI chrome; generated documents stay in corporate English) ---- */
const I18N = {
  en: { portfolio: "Portfolio", week: "This Week", workspace: "Workspace", data: "Project Data", studio: "PPT Studio", health: "Health Scan", priority: "Priority Lab", canvas: "Delivery Canvas", review: "Review Pack", govyear: "Governance Year", timeline: "Timeline", advisor: "Advisor", resources: "Resources", subtitle: "delivery intelligence cockpit", persists: "data persists across sessions", saving: "saving\u2026", saved: "saved \u2713", saveerr: "save failed \u2014 retrying on next change", export: "Export JSON", import: "Import", langnote: "" },
  es: { portfolio: "Portafolio", week: "Esta Semana", workspace: "Espacio de Trabajo", data: "Datos del Proyecto", studio: "Estudio PPT", health: "Diagn\u00f3stico", priority: "Lab de Prioridades", canvas: "Canvas de Entrega", review: "Pack de Revisi\u00f3n", govyear: "A\u00f1o de Gobierno", timeline: "L\u00ednea de Tiempo", advisor: "Asesor IA", resources: "Recursos", subtitle: "cockpit de inteligencia de delivery", persists: "los datos persisten entre sesiones", saving: "guardando\u2026", saved: "guardado \u2713", saveerr: "fallo al guardar \u2014 reintenta en el pr\u00f3ximo cambio", export: "Exportar JSON", import: "Importar", langnote: "Los documentos generados mantienen el ingl\u00e9s corporativo (est\u00e1ndar de entregables)." },
};

const TIERS = { A: "Full Agile", B: "Hybrid", C: "Waterfall", D: "Light Touch" };
const PHASES = ["Frame", "Mobilise", "Deliver", "Embed", "Realise"];
const RAG_DIMS = ["Scope", "Schedule", "Budget", "Risk", "Adoption"];
const RAG_CYCLE = { G: "A", A: "R", R: "G" };
const RAG_COLOR = { G: C.green, A: C.amber, R: C.red };

const HEALTH_LENSES = [
  { name: "Delivery", color: C.navy, dims: [
    { id: "plan", label: "Plan confidence", low: "milestones slipping silently", card: "estimates" },
    { id: "flow", label: "Flow health", low: "work ages in blocked / review", card: "dependency" },
    { id: "raid", label: "RAID hygiene", low: "stale risks, undated mitigations", card: "vendor" },
  ]},
  { name: "Governance", color: C.mul, dims: [
    { id: "decisions", label: "Decision velocity", low: "choices wait weeks for a forum", card: "bottleneck" },
    { id: "honesty", label: "Reporting honesty", low: "green outside, red inside", card: "watermelon" },
    { id: "sponsor", label: "Sponsor engagement", low: "sponsor absent or rubber-stamping", card: "sponsor" },
  ]},
  { name: "Product & value", color: "#8A6200", dims: [
    { id: "backlog", label: "Backlog quality", low: "solutions without problems", card: "backlog" },
    { id: "value", label: "Value instrumentation", low: "no telemetry behind hypotheses", card: "backlog" },
  ]},
  { name: "Change & people", color: C.lime, dims: [
    { id: "stake", label: "Stakeholder energy", low: "key voices going quiet", card: "blocker" },
    { id: "adoption", label: "Adoption signal", low: "activation fine, retention soft", card: "adoption" },
    { id: "capacity", label: "Team capacity", low: "quiet overload, slipping quality", card: "overload" },
    { id: "morale", label: "Capability & morale", low: "energy low, learning stalled", card: "overload" },
  ]},
];
const ALL_DIMS = HEALTH_LENSES.flatMap(l => l.dims);

const PLAYBOOK = [
  { id: "vendor", cat: "Delivery", title: "The vendor is slipping", smell: "A critical-path milestone moves twice; the vendor PM keeps saying 'next sprint'; your team starts building around the gap informally.",
    diagnosis: "Slippage is rarely the date — it's capacity or priority on their side. Treat it as a dependency risk with options, not a calendar dispute.",
    moves: ["Re-write the RAID row in cause→event→impact form and quantify the slip in weeks and €.", "Cost three options before the next SteerCo: re-sequence, descope, extend — never arrive with the problem alone.", "Ask for the vendor's own resourcing view in writing; a vague answer is itself the data.", "Escalate commercially at the right altitude: Sr. Director to their account exec, not PM to PM louder."],
    refs: "T03 RAID · T05 slide 6 · RACI: escalate a red risk" },
  { id: "sponsor", cat: "Governance", title: "The sponsor has gone quiet", smell: "SteerCos get delegated downward; decisions wait; the sponsor's name is on the charter but not in the room.",
    diagnosis: "Sponsors disengage when the project stops feeling decision-rich or career-relevant. Re-engage through their stakes, not through more reporting.",
    moves: ["Book 20 minutes 1:1 — bring exactly one decision only they can make, framed in their outcomes.", "Cut their reading load: the T04 headline should be repeatable by them verbatim in their own forums.", "Hand them a visible sender role from the comms plan — leaders re-engage when they're on stage.", "If absence persists past two cycles, raise it at Portfolio Review: an unsponsored project is a portfolio risk, not a PM failing."],
    refs: "T04 headline · T11 senders · Portfolio Review" },
  { id: "scopecreep", cat: "Governance", title: "Scope creeps in through small asks", smell: "No single big change — a stream of 'tiny' additions from stakeholders who 'just need one thing'; velocity falls while the plan stays nominally fixed.",
    diagnosis: "Each ask is rational; the aggregate is unfunded scope. The fix is a visible exchange rate, not heroic absorption.",
    moves: ["Route every ask, however small, through the backlog with a T15 stub — admission has a cost everyone can see.", "Publish the trade: 'yes to X means Y moves out of this increment' — make exchange explicit at refinement.", "Batch small asks into a monthly scope review with the sponsor instead of deciding under hallway pressure.", "Track absorbed-unfunded work as a metric; surface it in T04 when it passes 10% of capacity."],
    refs: "T15 one-pagers · T08 decisions · WSJF in Priority Lab" },
  { id: "watermelon", cat: "Governance", title: "Watermelon reporting", smell: "Status has been green for months; the corridor says otherwise; the first amber arrives two weeks before a gate.",
    diagnosis: "People report what's safe, not what's true. Honesty is a system property: it follows from what leadership rewards in the room.",
    moves: ["Re-anchor amber as 'needs attention', publicly — thank the first honest amber in front of the team.", "Make RAG mechanical where possible: milestone confidence and blocked-aging come from systems, not sentiment.", "Run a pre-mortem: 'it's three months on and we failed — why?' surfaces what status never will.", "Audit one project's RAG vs raw data quarterly at the CoP — calibration, not blame."],
    refs: "T04 quality bar · Coach clinic · Health Scan: honesty" },
  { id: "zombie", cat: "Ways of working", title: "Zombie ceremonies", smell: "A recurring meeting whose minutes read 'updates shared'; attendance decays; nobody can say what it decides.",
    diagnosis: "Ceremonies survive on calendar inertia. The test is structural: name the input template and the output decision, or stop.",
    moves: ["Apply the two-question test in the meeting itself; if it fails, cancel for one month and observe what breaks (usually nothing).", "Merge update-content into async: the T04 exists precisely so meetings don't carry status.", "Re-found surviving ceremonies with an owner, an input artefact and a decision right.", "Report hours returned to the team — make the win visible."],
    refs: "Tier ceremony stacks · anti-pattern watchlist" },
  { id: "adoption", cat: "Change", title: "Adoption is lukewarm after launch", smell: "Activation looks fine; weekly retention sags; champions go quiet; 'training complete' but usage shallow.",
    diagnosis: "Lukewarm is a behaviour-design problem, not a comms volume problem. Find the moment the new way loses to the old way.",
    moves: ["Shadow five real users within a week — watch where they revert and what the old path still does better.", "Fix the top friction in product (T15 fast-follow) before adding any reinforcement comms.", "Activate line managers as senders with one specific behavioural ask, not 'please encourage usage'.", "Set the one-week SLA: every soft signal on T12 gets a named action before the next status."],
    refs: "T12 panels · T11 senders · hypercare rule" },
  { id: "blocker", cat: "Change", title: "A high-power stakeholder is blocking", smell: "One senior voice reframes every forum; decisions get relitigated; teams start routing around them.",
    diagnosis: "Blockers usually protect something real — status, risk exposure, a past decision. Find the interest behind the position before counter-arguing the position.",
    moves: ["Map them honestly in T09 (candid notes stay in the core team) — what do they stand to lose?", "Engage 1:1 through the most credible peer, not in the forum where they perform opposition.", "Give them a shaping role with boundaries: review rights on the part they care about.", "If genuinely irreconcilable, get an explicit T08 decision from the sponsor — ambiguity is the blocker's habitat."],
    refs: "T09 stance plan · T08 reversibility · sponsor RACI" },
  { id: "backlog", cat: "Product", title: "The backlog is solutions, not problems", smell: "Epics named after features nobody can trace to a user pain; acceptance criteria are build-specs; demos get polite nods.",
    diagnosis: "The backlog has decoupled from the value model. Re-anchor every epic to a problem, a user and a falsifiable hypothesis.",
    moves: ["Freeze admissions until each epic has a T15 one-pager: user, problem evidence, hypothesis with magnitude and date.", "Run one discovery session (T16) per quarter with real users in the room — the canvas forces problem language.", "Retire failed hypotheses out loud at the value review; relabelled failures poison the model.", "Score with WSJF in the open so prioritisation arguments attack inputs, not people."],
    refs: "T15 · T16 · Priority Lab" },
  { id: "estimates", cat: "Delivery", title: "Estimates are always wrong", smell: "Every increment lands at 60–70%; dates set by working backwards from promises; the team has stopped believing the plan.",
    diagnosis: "Estimation isn't failing — commitment is. Forecast from observed throughput, and put uncertainty in the date language.",
    moves: ["Switch to range forecasts from actual velocity/cycle data ('80% confident by w/c 14 Jul'), not point dates.", "Re-anchor reference stories quarterly; estimate relative size, never hours.", "Cut batch size: smaller stories make throughput statistics meaningful within two sprints.", "Publish forecast vs actual openly — calibration improves what blame never does."],
    refs: "T07 estimation convention · T06 confidence column" },
  { id: "overload", cat: "People", title: "Quiet overload in the team", smell: "Velocity nominally stable but review quality slips; people stop raising risks; PTO unused; the retro goes silent.",
    diagnosis: "Silence is the symptom that matters. Overload hides in WIP, invisible work and the fear that honesty reads as weakness.",
    moves: ["Count WIP per person this week — including the invisible 'small favours' lane; cap it visibly.", "Cancel one ceremony and one report for a month; give the hours back explicitly.", "Have the 1:1s with the two quietest people first — the loud ones self-report.", "Re-plan the next increment at 80% capacity on purpose, and say why to stakeholders."],
    refs: "Health Scan: capacity · retro T14 temperature trend" },
  { id: "bottleneck", cat: "Governance", title: "Every decision waits for one person", smell: "A queue of 'pending sponsor' items; Type-2 reversible choices waiting weeks; the team idles or guesses.",
    diagnosis: "Decision rights are undefined, so everything defaults upward. Classify by reversibility and push Type-2 down explicitly.",
    moves: ["Tag the queue: Type 1 (one-way door) vs Type 2 (reversible). Most queues are 80% Type 2.", "Agree delegation in writing with the sponsor: 'PM/PO decide Type 2 within these boundaries, logged in T08 same day'.", "Give Type 1 items a decision date and a default-if-silent — queues evaporate when silence has a cost.", "Review decision lead time monthly; it's a portfolio health metric, not a personality issue."],
    refs: "T08 reversibility class · RACI · Health Scan: decisions" },
  { id: "dependency", cat: "Delivery", title: "Cross-team dependency deadlock", smell: "Two teams each waiting on the other; both boards show 'blocked — external'; SteerCos hear it as weather, not as a decision.",
    diagnosis: "Dependencies deadlock when neither side owns the interface. Someone must own the seam, with a date.",
    moves: ["Name a single interface owner across both teams — one person, both standups, one shared milestone.", "Make the dependency a first-class plan row with a counterpart owner and RAID reference on both sides.", "Decouple where possible: stub, mock or contract-first so neither team idles on the other.", "If priorities genuinely conflict, that's a Portfolio Review decision — escalate the conflict, not the frustration."],
    refs: "T06 dependencies · Portfolio Review RACI" },
];

const CANVAS_BOXES = [
  { id: "problem", title: "Problem", hint: "Whose pain, in their words. Two sentences." },
  { id: "users", title: "Users & stakeholders", hint: "Who changes, who decides, who can block." },
  { id: "outcome", title: "Outcome & measures", hint: "Baseline → target by date. Maps to T13." },
  { id: "hypothesis", title: "Value hypothesis", hint: "We believe… visible in [indicator] by [date]." },
  { id: "solution", title: "Solution & scope edges", hint: "What we build — and the out-of-scope people will assume." },
  { id: "risks", title: "Risks & dependencies", hint: "Top 3, cause→event→impact. Seed the RAID." },
  { id: "change", title: "Change & adoption", hint: "Severity of behaviour change; senders; readiness gate." },
  { id: "team", title: "Team & cadence", hint: "Roles, tier, ceremony heartbeat." },
  { id: "first30", title: "First 30 days", hint: "Mobilisation moves + the day-30 configuration retro." },
];

const STORE_KEY = "dcos-navigator-v1";
const uid = () => Math.random().toString(36).slice(2, 9);
const seedProjects = () => ([
  { id: uid(), name: "Insight Assistant", code: "OBU-114", tier: "B", phase: "Deliver", value: 7, effort: 5,
    rag: { Scope: "G", Schedule: "A", Budget: "G", Risk: "A", Adoption: "A" },
    wsjf: { bv: 8, tc: 6, rr: 5, size: 5 },
    health: { plan: 3, flow: 3, raid: 4, decisions: 3, honesty: 4, sponsor: 4, backlog: 4, value: 3, stake: 3, adoption: 2, capacity: 3, morale: 4 },
    canvas: { problem: "Field managers wait ~5 days for performance answers that should be self-serve.", hypothesis: "We believe a GenAI assistant over the insights layer lifts same-day answers to 80% within 6 weeks of release." } },
  { id: uid(), name: "Field Excellence Rollout", code: "OBU-097", tier: "C", phase: "Embed", value: 8, effort: 8,
    rag: { Scope: "G", Schedule: "G", Budget: "A", Risk: "G", Adoption: "R" },
    wsjf: { bv: 9, tc: 7, rr: 4, size: 8 },
    health: { plan: 4, flow: 4, raid: 4, decisions: 4, honesty: 3, sponsor: 5, backlog: 3, value: 3, stake: 4, adoption: 2, capacity: 3, morale: 3 },
    canvas: {} },
  { id: uid(), name: "Dashboard Sunset", code: "OBU-121", tier: "D", phase: "Deliver", value: 3, effort: 2,
    rag: { Scope: "G", Schedule: "G", Budget: "G", Risk: "G", Adoption: "G" },
    wsjf: { bv: 4, tc: 3, rr: 2, size: 2 },
    health: { plan: 5, flow: 4, raid: 4, decisions: 4, honesty: 4, sponsor: 3, backlog: 4, value: 4, stake: 4, adoption: 4, capacity: 4, morale: 4 },
    canvas: {} },
]);

/* ---------- shared atoms ---------- */
const Chip = ({ children, bg = C.soft, color = C.mid, style }) => (
  <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".08em", textTransform: "uppercase", padding: "3px 9px", borderRadius: 99, background: bg, color, whiteSpace: "nowrap", ...style }}>{children}</span>
);
const SectionLabel = ({ children, color = C.mul }) => (
  <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".15em", textTransform: "uppercase", color, marginBottom: 8 }}>{children}</div>
);
const Card = ({ children, style, onClick }) => (
  <div onClick={onClick} style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 12, padding: 18, ...style }}>{children}</div>
);

function healthScore(h) {
  const vals = ALL_DIMS.map(d => h?.[d.id]).filter(v => typeof v === "number");
  if (!vals.length) return null;
  return Math.round((vals.reduce((a, b) => a + b, 0) / (vals.length * 5)) * 100);
}
const wsjfScore = w => w && w.size ? ((w.bv + w.tc + w.rr) / w.size) : 0;
const today = () => new Date().toISOString().slice(0, 10);
const mkEv = (type, title, detail = "") => ({ date: today(), ts: Date.now(), type, title, detail });
const evPush = (p, ev) => [...(p.events || []), ev].slice(-200);

function exportJson(projects) {
  try {
    const blob = new Blob([JSON.stringify({ exported: today(), app: "dcos-navigator", projects }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `dcos-navigator-${today()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  } catch (e) { console.error("export failed", e); }
}
function importJson(file, setProjects, setSel) {
  if (!file) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const data = JSON.parse(r.result);
      if (Array.isArray(data.projects) && data.projects.length) {
        setProjects(data.projects);
        setSel(data.projects[0].id);
      } else alert("That file doesn't contain a Navigator portfolio.");
    } catch { alert("Couldn't read that file — expected a Navigator JSON export."); }
  };
  r.readAsText(file);
}

export default function App() {
  const [tab, setTab] = useState("portfolio");
  const [projects, setProjects] = useState(null);
  const [sel, setSel] = useState(null);
  const [saveState, setSaveState] = useState("idle");
  const [lang, setLang] = useState("en");
  const [confirmAct, setConfirmAct] = useState(null);
  const T = k => (I18N[lang] && I18N[lang][k]) || I18N.en[k] || k;
  const saveTimer = useRef(null);
  const loaded = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get(STORE_KEY);
        const data = r ? JSON.parse(r.value) : null;
        if (data?.projects?.length) { setProjects(data.projects); setSel(data.projects[0].id); if (data.lang) setLang(data.lang); }
        else { const s = seedProjects(); setProjects(s); setSel(s[0].id); }
      } catch { const s = seedProjects(); setProjects(s); setSel(s[0].id); }
      loaded.current = true;
    })();
  }, []);

  useEffect(() => {
    if (!loaded.current || !projects) return;
    setSaveState("saving");
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try { await window.storage.set(STORE_KEY, JSON.stringify({ projects, lang })); setSaveState("saved"); }
      catch { setSaveState("error"); }
      setTimeout(() => setSaveState("idle"), 1600);
    }, 700);
    return () => clearTimeout(saveTimer.current);
  }, [projects, lang]);

  const update = (id, patch) => setProjects(ps => ps.map(p => p.id === id ? { ...p, ...patch } : p));
  const project = projects?.find(p => p.id === sel) || null;

  const TABS = ["portfolio", "week", "advisor", "workspace", "data", "studio", "health", "priority", "canvas", "review", "govyear", "timeline", "resources"].map(id => [id, T(id)]);

  if (!projects) return (
    <div style={{ fontFamily: BODY, background: C.bg, minHeight: "100vh", display: "grid", placeItems: "center", color: C.mid }}>
      <style>{FONTS}</style>Loading your portfolio…
    </div>
  );

  return (
    <div style={{ fontFamily: BODY, background: C.bg, minHeight: "100vh", color: C.ink }}>
      <style>{FONTS}{`
        *{box-sizing:border-box} input,textarea,select,button{font-family:inherit}
        input[type=range]{accent-color:${C.mul}}
        ::placeholder{color:${C.faint}}
        .ragdot{cursor:pointer;transition:transform .1s} .ragdot:hover{transform:scale(1.25)}
        .tabbtn:focus-visible,button:focus-visible{outline:2px solid ${C.gold};outline-offset:2px}
        textarea{resize:vertical}
        @media(prefers-reduced-motion:reduce){*{transition:none!important}}
      `}</style>

      {/* App bar — AZ brand frame */}
      <div style={{ height: 5, background: C.mul }} />
      <div style={{ background: C.graph, color: "#fff", padding: "13px 22px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".18em", color: C.gold }}>ASTRAZENECA · OBU DSAI · DCOS</div>
          <div style={{ fontFamily: DISP, fontWeight: 800, fontSize: 21, lineHeight: 1.15 }}>Navi<span style={{ color: C.gold }}>gator</span> <span style={{ color: "#9FB0AC", fontWeight: 600, fontSize: 13 }}>· {T("subtitle")}</span></div>
          <div style={{ width: 44, height: 3, background: C.gold, marginTop: 4, borderRadius: 2 }} />
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <button onClick={() => {
            if (confirmAct !== "demo") { setConfirmAct("demo"); setTimeout(() => setConfirmAct(c => c === "demo" ? null : c), 3000); return; }
            const s2 = seedProjects(); setProjects(s2); setSel(s2[0].id); setConfirmAct(null);
          }} style={{ border: "1px solid #4A5757", background: confirmAct === "demo" ? C.gold : "transparent", color: confirmAct === "demo" ? C.ink : "#C9D2CF", borderRadius: 8, padding: "6px 12px", fontSize: 11.5, cursor: "pointer", fontFamily: DISP, fontWeight: 600 }}>{confirmAct === "demo" ? "Replace all with demo?" : "⟳ Demo data"}</button>
          <button onClick={() => {
            if (confirmAct !== "clear") { setConfirmAct("clear"); setTimeout(() => setConfirmAct(c => c === "clear" ? null : c), 3000); return; }
            setProjects([]); setSel(null); setConfirmAct(null);
          }} style={{ border: "1px solid #4A5757", background: confirmAct === "clear" ? "#B3261E" : "transparent", color: confirmAct === "clear" ? "#fff" : "#C9D2CF", borderRadius: 8, padding: "6px 12px", fontSize: 11.5, cursor: "pointer", fontFamily: DISP, fontWeight: 600 }}>{confirmAct === "clear" ? "Delete everything?" : "Clear"}</button>
          <button onClick={() => setLang(l => l === "en" ? "es" : "en")} title={I18N[lang].langnote || "Switch UI language"} style={{ border: `1px solid ${C.gold}`, background: "transparent", color: C.gold, borderRadius: 8, padding: "6px 12px", fontSize: 11.5, cursor: "pointer", fontFamily: DISP, fontWeight: 700 }}>{lang === "en" ? "ES" : "EN"}</button>
          <button onClick={() => exportJson(projects)} style={{ border: "1px solid #4A5757", background: "transparent", color: "#C9D2CF", borderRadius: 8, padding: "6px 12px", fontSize: 11.5, cursor: "pointer", fontFamily: DISP, fontWeight: 600 }}>{T("export")}</button>
          <label style={{ border: "1px solid #4A5757", color: "#C9D2CF", borderRadius: 8, padding: "6px 12px", fontSize: 11.5, cursor: "pointer", fontFamily: DISP, fontWeight: 600 }}>
            {T("import")}
            <input type="file" accept="application/json" style={{ display: "none" }}
              onChange={e => importJson(e.target.files?.[0], setProjects, setSel)} />
          </label>
          <span style={{ fontFamily: MONO, fontSize: 10.5, color: saveState === "error" ? "#FF9B9B" : "#9FB0AC" }}>
            {saveState === "saving" ? T("saving") : saveState === "saved" ? T("saved") : saveState === "error" ? T("saveerr") : T("persists")}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: "#fff", borderBottom: `1px solid ${C.line}`, padding: "0 22px", display: "flex", gap: 4, overflowX: "auto" }}>
        {TABS.map(([id, label]) => (
          <button key={id} className="tabbtn" onClick={() => setTab(id)} style={{
            border: "none", background: "transparent", padding: "13px 14px", cursor: "pointer",
            fontFamily: DISP, fontWeight: 700, fontSize: 13.5,
            color: tab === id ? C.mul : C.mid, borderBottom: `3px solid ${tab === id ? C.gold : "transparent"}`, whiteSpace: "nowrap",
          }}>{label}</button>
        ))}
      </div>

      {lang === "es" && <div style={{ maxWidth: 1180, margin: "0 auto", padding: "10px 22px 0", fontSize: 11, color: C.faint }}>{I18N.es.langnote}</div>}
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "22px 22px 60px" }}>
        {tab === "portfolio" && <Portfolio projects={projects} setProjects={setProjects} update={update} setSel={setSel} setTab={setTab} />}
        {tab === "week" && <WeekView projects={projects} />}
        {tab === "workspace" && <Workspace projects={projects} project={project} setSel={setSel} update={update} />}
        {tab === "data" && <ProjectData projects={projects} project={project} setSel={setSel} update={update} />}
        {tab === "studio" && <PptStudio projects={projects} project={project} setSel={setSel} update={update} />}
        {tab === "health" && <HealthScan projects={projects} project={project} setSel={setSel} update={update} setTab={setTab} />}
        {tab === "priority" && <PriorityLab projects={projects} update={update} />}
        {tab === "canvas" && <Canvas projects={projects} project={project} setSel={setSel} update={update} />}
        {tab === "review" && <ReviewPack projects={projects} update={update} />}
        {tab === "govyear" && <GovernanceYear />}
        {tab === "timeline" && <TimelineHub projects={projects} />}
        {tab === "advisor" && <Advisor projects={projects} project={project} setSel={setSel} />}
        {tab === "resources" && <Resources />}
      </div>
    </div>
  );
}

/* ================= PORTFOLIO ================= */
function Portfolio({ projects, setProjects, update, setSel, setTab }) {
  const [name, setName] = useState("");
  const [tier, setTier] = useState("B");
  const [wiz, setWiz] = useState(false);
  const [flow, setFlow] = useState(false);
  useEffect(() => { (async () => { try { await window.storage.get("dcos-nav-flow-dismissed"); } catch { setFlow(true); } })(); }, []);
  const dismissFlow = async () => { setFlow(false); try { await window.storage.set("dcos-nav-flow-dismissed", "1"); } catch {} };
  const counts = useMemo(() => {
    const c = { G: 0, A: 0, R: 0 };
    projects.forEach(p => RAG_DIMS.forEach(d => c[p.rag?.[d] || "G"]++));
    return c;
  }, [projects]);

  const addProject = () => {
    if (!name.trim()) return;
    const p = { id: uid(), name: name.trim(), code: "OBU-" + Math.floor(100 + Math.random() * 900), tier, phase: "Frame", value: 5, effort: 5,
      rag: Object.fromEntries(RAG_DIMS.map(d => [d, "G"])), wsjf: { bv: 5, tc: 5, rr: 5, size: 5 }, health: {}, canvas: {} };
    setProjects(ps => [...ps, p]); setName("");
  };
  const removeProject = (id) => setProjects(ps => ps.filter(p => p.id !== id));

  const bubble = projects.map(p => ({ x: p.effort, y: p.value, z: 120, name: p.name, h: healthScore(p.health) }));

  return (
    <div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "stretch", marginBottom: 18 }}>
        {[["Projects", projects.length, C.ink], ["Green signals", counts.G, C.green], ["Amber", counts.A, C.amber], ["Red", counts.R, C.red]].map(([l, v, col]) => (
          <Card key={l} style={{ flex: "1 1 120px", padding: "14px 18px" }}>
            <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase", color: C.faint }}>{l}</div>
            <div style={{ fontFamily: DISP, fontWeight: 800, fontSize: 30, color: col }}>{v}</div>
          </Card>
        ))}
        <Card style={{ flex: "2 1 280px", padding: "14px 18px", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <input value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && addProject()} placeholder="New project name"
            style={{ flex: "1 1 140px", border: `1px solid ${C.line}`, borderRadius: 8, padding: "9px 12px", fontSize: 13.5 }} />
          <select value={tier} onChange={e => setTier(e.target.value)} style={{ border: `1px solid ${C.line}`, borderRadius: 8, padding: "9px 10px", fontSize: 13 }}>
            {Object.entries(TIERS).map(([k, v]) => <option key={k} value={k}>Tier {k} · {v}</option>)}
          </select>
          <button onClick={addProject} style={{ background: C.mul, color: "#fff", border: "none", borderRadius: 8, padding: "10px 16px", fontFamily: DISP, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Quick add</button>
          <button onClick={() => setWiz(true)} style={{ background: C.gold, color: C.ink, border: "none", borderRadius: 8, padding: "10px 16px", fontFamily: DISP, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>✦ New project wizard</button>
        </Card>
      </div>
      {wiz && <Wizard onClose={() => setWiz(false)} onCreate={p => { setProjects(ps => [...ps, p]); setSel(p.id); setWiz(false); }} />}
      {flow && (
        <Card style={{ marginBottom: 16, borderLeft: `4px solid ${C.gold}`, background: C.goldLt, position: "relative" }}>
          <button onClick={dismissFlow} style={{ position: "absolute", top: 10, right: 12, border: "none", background: "transparent", color: C.faint, fontSize: 16, cursor: "pointer" }}>×</button>
          <SectionLabel color={"#8A6200"}>How the cockpit flows — 60 seconds</SectionLabel>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", fontSize: 12 }}>
            {[["✦ Wizard", null, "type + 6 questions → tier, hypothesis, seeded board & gates"], ["Workspace", "workspace", "board · plan/Gantt · pages"], ["Project Data", "data", "headline, risks, decisions, benefits"], ["PPT Studio", "studio", "AZ-branded T01 / T04 / T05 + exports to JIRA · Smartsheet · Confluence"], ["Health monthly", "health", "radar + snapshot"], ["Review Pack", "review", "Sr. Director pre-pack + day-30 retro radar"]].map(([l, t2, d], i, arr) => (
              <React.Fragment key={l}>
                <button onClick={() => t2 ? setTab(t2) : setWiz(true)} title={d} style={{ border: `1px solid #EBD49A`, background: "#fff", color: "#8A6200", borderRadius: 99, padding: "6px 13px", fontFamily: DISP, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>{l}</button>
                {i < arr.length - 1 && <span style={{ color: "#C9A24A", fontWeight: 700 }}>→</span>}
              </React.Fragment>
            ))}
          </div>
        </Card>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 14 }}>
        {projects.map(p => {
          const h = healthScore(p.health);
          return (
            <Card key={p.id} style={{ position: "relative" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontFamily: MONO, fontSize: 10.5, color: C.mul }}>{p.code}</span>
                <span style={{ fontFamily: DISP, fontWeight: 700, fontSize: 16 }}>{p.name}</span>
                <button onClick={() => removeProject(p.id)} title="Remove project" style={{ marginLeft: "auto", border: "none", background: "transparent", color: C.faint, cursor: "pointer", fontSize: 14 }}>×</button>
              </div>
              <div style={{ display: "flex", gap: 6, margin: "8px 0 12px", flexWrap: "wrap" }}>
                <Chip bg={C.mulLt} color={C.mul}>Tier {p.tier}</Chip>
                <select value={p.phase} onChange={e => update(p.id, { phase: e.target.value })}
                  style={{ fontFamily: MONO, fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em", border: `1px solid ${C.line}`, borderRadius: 99, padding: "2px 8px", background: "#fff", color: C.navy, cursor: "pointer" }}>
                  {PHASES.map(ph => <option key={ph}>{ph}</option>)}
                </select>
                {h !== null && <Chip bg={h >= 75 ? C.limeLt : h >= 55 ? C.goldLt : "#F8E9E8"} color={h >= 75 ? C.lime : h >= 55 ? "#8A6200" : C.red}>health {h}</Chip>}
                {(p.snapshots?.length || 0) >= 2 && <Spark data={p.snapshots.map(s2 => s2.score)} />}
              </div>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                {RAG_DIMS.map(d => (
                  <div key={d} style={{ textAlign: "center" }}>
                    <div className="ragdot" role="button" tabIndex={0} aria-label={`${d}: ${p.rag?.[d] || "G"} — click to cycle`}
                      onClick={() => { const cur = p.rag?.[d] || "G", nx = RAG_CYCLE[cur]; update(p.id, { rag: { ...p.rag, [d]: nx }, events: evPush(p, mkEv("status", `RAG ${d}: ${cur} → ${nx}`, "Changed on the Portfolio board")) }); }}
                      onKeyDown={e => { if (e.key !== "Enter") return; const cur = p.rag?.[d] || "G", nx = RAG_CYCLE[cur]; update(p.id, { rag: { ...p.rag, [d]: nx }, events: evPush(p, mkEv("status", `RAG ${d}: ${cur} → ${nx}`, "Changed on the Portfolio board")) }); }}
                      style={{ width: 16, height: 16, borderRadius: "50%", background: RAG_COLOR[p.rag?.[d] || "G"], margin: "0 auto 3px", boxShadow: "inset 0 0 0 2px rgba(255,255,255,.4)" }} />
                    <div style={{ fontFamily: MONO, fontSize: 8.5, color: C.faint, textTransform: "uppercase", letterSpacing: ".04em" }}>{d}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <button onClick={() => { setSel(p.id); setTab("health"); }} style={{ flex: 1, border: `1px solid ${C.line}`, background: "#fff", borderRadius: 8, padding: "7px 0", fontSize: 12, color: C.mul, fontWeight: 600, cursor: "pointer" }}>Run health scan</button>
                <button onClick={() => { setSel(p.id); setTab("canvas"); }} style={{ flex: 1, border: `1px solid ${C.line}`, background: "#fff", borderRadius: 8, padding: "7px 0", fontSize: 12, color: C.navy, fontWeight: 600, cursor: "pointer" }}>Open canvas</button>
              </div>
            </Card>
          );
        })}
      </div>

      <Card style={{ marginTop: 18 }}>
        <SectionLabel>Value vs effort — click a project card above to manage it; drag values in Priority Lab</SectionLabel>
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer>
            <ScatterChart margin={{ top: 12, right: 20, bottom: 18, left: 4 }}>
              <CartesianGrid stroke={C.soft} />
              <XAxis type="number" dataKey="x" domain={[0, 10]} tick={{ fontSize: 11, fill: C.faint }} tickCount={6}>
                <Label value="Effort →" position="insideBottomRight" offset={-8} style={{ fontSize: 11, fill: C.faint }} />
              </XAxis>
              <YAxis type="number" dataKey="y" domain={[0, 10]} tick={{ fontSize: 11, fill: C.faint }} tickCount={6}>
                <Label value="Value →" angle={-90} position="insideLeft" style={{ fontSize: 11, fill: C.faint }} />
              </YAxis>
              <ZAxis dataKey="z" range={[140, 141]} />
              <ReferenceLine x={5} stroke={C.line} strokeDasharray="4 4" />
              <ReferenceLine y={5} stroke={C.line} strokeDasharray="4 4" />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} formatter={(v, n) => v} content={({ payload }) => payload?.length ? (
                <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 8, padding: "8px 12px", fontSize: 12 }}>
                  <b style={{ fontFamily: DISP }}>{payload[0].payload.name}</b><br />value {payload[0].payload.y} · effort {payload[0].payload.x}{payload[0].payload.h !== null ? <> · health {payload[0].payload.h}</> : null}
                </div>) : null} />
              <Scatter data={bubble}>
                {bubble.map((b, i) => <Cell key={i} fill={b.h === null ? C.faint : b.h >= 75 ? C.lime : b.h >= 55 ? C.gold : C.red} fillOpacity={0.85} />)}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <div style={{ fontSize: 11.5, color: C.faint }}>Top-left quadrant (high value, low effort) is where the next quarter lives. Bubble colour = health-scan score.</div>
      </Card>
    </div>
  );
}

/* ================= HEALTH SCAN ================= */
function HealthScan({ projects, project, setSel, update, setTab }) {
  if (!project) return <Card>Add a project in Portfolio first.</Card>;
  const h = project.health || {};
  const setDim = (id, v) => update(project.id, { health: { ...h, [id]: v } });
  const score = healthScore(h);
  const snaps = project.snapshots || [];
  const prevSnap = [...snaps].reverse().find(s2 => s2.date !== today()) || (snaps.length > 1 ? snaps[snaps.length - 2] : null);
  const radarData = ALL_DIMS.map(d => ({ dim: d.label, v: h[d.id] ?? 0, prevV: prevSnap?.dims?.[d.id] ?? null, full: 5 }));
  const weak = ALL_DIMS.filter(d => (h[d.id] ?? 0) > 0 && h[d.id] <= 2);

  return (
    <div>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <ProjectPicker projects={projects} project={project} setSel={setSel} />
        {score !== null && (
          <Chip bg={score >= 75 ? C.limeLt : score >= 55 ? C.goldLt : "#F8E9E8"} color={score >= 75 ? C.lime : score >= 55 ? "#8A6200" : C.red} style={{ fontSize: 12, padding: "6px 14px" }}>
            overall {score} / 100
          </Chip>
        )}
        {score !== null && (
          <button onClick={() => {
            const snaps2 = (project.snapshots || []).filter(s => s.date !== today());
            update(project.id, { snapshots: [...snaps2, { date: today(), score, dims: { ...h } }], events: evPush(project, mkEv("artefact", `Health snapshot saved — ${score}/100`, "Monthly scan; trend feeds the Portfolio sparkline and the Review Pack")) });
          }} style={{ border: `1px solid ${C.mul}`, background: "#fff", color: C.mul, borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700, fontFamily: DISP, cursor: "pointer" }}>
            Save snapshot ({today()})
          </button>
        )}
        <div style={{ fontSize: 12, color: C.faint }}>Score honestly — 1 is "actively hurting us", 5 is "a strength we'd show others". Run monthly; the trend matters more than the number.</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(300px,1.1fr) minmax(280px,1fr)", gap: 16 }}>
        <div>
          {HEALTH_LENSES.map(lens => (
            <Card key={lens.name} style={{ marginBottom: 14 }}>
              <SectionLabel color={lens.color}>{lens.name}</SectionLabel>
              {lens.dims.map(d => (
                <div key={d.id} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontFamily: DISP, fontWeight: 600, fontSize: 13 }}>{d.label}</span>
                    <span style={{ fontFamily: MONO, fontSize: 12, color: (h[d.id] ?? 0) <= 2 && h[d.id] ? C.red : C.mid }}>{h[d.id] ?? "—"}</span>
                  </div>
                  <input type="range" min={1} max={5} step={1} value={h[d.id] ?? 3} onChange={e => setDim(d.id, +e.target.value)} style={{ width: "100%" }} aria-label={d.label} />
                  <div style={{ fontSize: 10.5, color: C.faint, marginTop: -2 }}>low looks like: {d.low}</div>
                </div>
              ))}
            </Card>
          ))}
        </div>
        <div>
          <Card style={{ marginBottom: 14 }}>
            <SectionLabel color={C.navy}>The shape of the project</SectionLabel>
            <div style={{ width: "100%", height: 330 }}>
              <ResponsiveContainer>
                <RadarChart data={radarData} outerRadius="72%">
                  <PolarGrid stroke={C.line} />
                  <PolarAngleAxis dataKey="dim" tick={{ fontSize: 9.5, fill: C.mid }} />
                  <PolarRadiusAxis domain={[0, 5]} tickCount={6} tick={false} axisLine={false} />
                  {prevSnap && <Radar dataKey="prevV" stroke={C.faint} fill="none" strokeDasharray="4 4" />}
                  <Radar dataKey="v" stroke={C.mul} fill={C.mul} fillOpacity={0.28} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ fontSize: 11.5, color: C.faint }}>A healthy project is round. Spikes are strengths to protect; dents are this month's work.{prevSnap ? ` Dashed ghost = snapshot of ${prevSnap.date}.` : ""}</div>
          </Card>
          <Card>
            <SectionLabel>Prescriptions — weakest dimensions first</SectionLabel>
            {weak.length === 0 && <div style={{ fontSize: 13, color: C.mid }}>No dimension at 1–2. Either this project is genuinely healthy, or the scan was kind — check the trend next month, and the honesty dimension first.</div>}
            {weak.map(d => {
              const card = PLAYBOOK.find(c => c.id === d.card);
              return (
                <div key={d.id} style={{ borderLeft: `3px solid ${C.gold}`, background: C.goldLt, borderRadius: "0 8px 8px 0", padding: "10px 14px", marginBottom: 10 }}>
                  <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 13 }}>{d.label} is at {h[d.id]}</div>
                  <div style={{ fontSize: 12, color: C.mid, margin: "2px 0 6px" }}>{d.low}.</div>
                  {card && <button onClick={() => { RES_INIT.sub = "playbook"; setTab("resources"); }} style={{ border: "none", background: "transparent", color: C.mul, fontWeight: 600, fontSize: 12, cursor: "pointer", padding: 0 }}>
                    → Playbook: “{card.title}”
                  </button>}
                </div>
              );
            })}
          </Card>
          {(project.snapshots?.length || 0) > 0 && (
            <Card style={{ marginTop: 14 }}>
              <SectionLabel color={C.lime}>Trend — saved snapshots</SectionLabel>
              <div style={{ width: "100%", height: 160 }}>
                <ResponsiveContainer>
                  <LineChart data={project.snapshots} margin={{ top: 8, right: 12, bottom: 4, left: -18 }}>
                    <CartesianGrid stroke={C.soft} vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 9.5, fill: C.faint }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 9.5, fill: C.faint }} tickCount={5} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${C.line}` }} />
                    <Line type="monotone" dataKey="score" stroke={C.mul} strokeWidth={2.5} dot={{ r: 3, fill: C.mul }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div style={{ fontSize: 11, color: C.faint }}>Snapshot monthly, ideally right after the retro. {project.snapshots.length} saved — the slope is the conversation.</div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function ProjectPicker({ projects, project, setSel }) {
  return (
    <select value={project.id} onChange={e => setSel(e.target.value)}
      style={{ fontFamily: DISP, fontWeight: 700, fontSize: 15, border: `1px solid ${C.line}`, borderRadius: 8, padding: "8px 12px", background: "#fff", color: C.ink, cursor: "pointer" }}>
      {projects.map(p => <option key={p.id} value={p.id}>{p.code} · {p.name}</option>)}
    </select>
  );
}

/* ================= PRIORITY LAB ================= */
function PriorityLab({ projects, update }) {
  const ranked = [...projects].sort((a, b) => wsjfScore(b.wsjf) - wsjfScore(a.wsjf));
  const SIZES = [1, 2, 3, 5, 8, 13];
  const Slider = ({ p, k, label }) => (
    <div style={{ flex: "1 1 110px", minWidth: 100 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5 }}>
        <span style={{ fontFamily: MONO, textTransform: "uppercase", letterSpacing: ".06em", color: C.faint }}>{label}</span>
        <span style={{ fontFamily: MONO, color: C.navy }}>{p.wsjf[k]}</span>
      </div>
      <input type="range" min={1} max={10} value={p.wsjf[k]} aria-label={`${p.name} ${label}`}
        onChange={e => update(p.id, { wsjf: { ...p.wsjf, [k]: +e.target.value } })} style={{ width: "100%" }} />
    </div>
  );

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <SectionLabel>WSJF — weighted shortest job first</SectionLabel>
        <p style={{ fontSize: 13, color: C.mid, margin: 0 }}>
          Cost of delay (business value + time criticality + risk reduction, each 1–10) divided by job size (Fibonacci). Score in the open at refinement or the monthly portfolio session — the point is that prioritisation arguments attack the <i>inputs</i>, not each other. Also sets the Value/Effort bubbles on the Portfolio tab.
        </p>
      </Card>
      {ranked.map((p, i) => (
        <Card key={p.id} style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ fontFamily: DISP, fontWeight: 800, fontSize: 24, color: i === 0 ? C.mul : C.faint, minWidth: 34 }}>#{i + 1}</div>
            <div style={{ minWidth: 180, flex: "1 1 180px" }}>
              <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 15 }}>{p.name}</div>
              <div style={{ fontFamily: MONO, fontSize: 10.5, color: C.faint }}>{p.code} · Tier {p.tier} · {p.phase}</div>
            </div>
            <Slider p={p} k="bv" label="Biz value" />
            <Slider p={p} k="tc" label="Time crit." />
            <Slider p={p} k="rr" label="Risk red." />
            <div style={{ flex: "0 0 110px" }}>
              <div style={{ fontFamily: MONO, fontSize: 10.5, textTransform: "uppercase", letterSpacing: ".06em", color: C.faint, marginBottom: 3 }}>Job size</div>
              <select value={p.wsjf.size} onChange={e => update(p.id, { wsjf: { ...p.wsjf, size: +e.target.value } })}
                style={{ width: "100%", border: `1px solid ${C.line}`, borderRadius: 8, padding: "7px 8px", fontSize: 13 }}>
                {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ textAlign: "right", minWidth: 86 }}>
              <div style={{ fontFamily: MONO, fontSize: 9.5, textTransform: "uppercase", letterSpacing: ".1em", color: C.faint }}>WSJF</div>
              <div style={{ fontFamily: DISP, fontWeight: 800, fontSize: 26, color: C.mul }}>{wsjfScore(p.wsjf).toFixed(1)}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: C.faint }}>Portfolio bubble:</span>
            <label style={{ fontSize: 11, color: C.mid, display: "flex", gap: 6, alignItems: "center" }}>value
              <input type="range" min={1} max={10} value={p.value} onChange={e => update(p.id, { value: +e.target.value })} style={{ width: 110 }} aria-label={`${p.name} value`} />
              <span className="mono" style={{ fontFamily: MONO }}>{p.value}</span></label>
            <label style={{ fontSize: 11, color: C.mid, display: "flex", gap: 6, alignItems: "center" }}>effort
              <input type="range" min={1} max={10} value={p.effort} onChange={e => update(p.id, { effort: +e.target.value })} style={{ width: 110 }} aria-label={`${p.name} effort`} />
              <span style={{ fontFamily: MONO }}>{p.effort}</span></label>
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ================= DELIVERY CANVAS ================= */
function Canvas({ projects, project, setSel, update }) {
  if (!project) return <Card>Add a project in Portfolio first.</Card>;
  const cv = project.canvas || {};
  const setBox = (id, v) => update(project.id, { canvas: { ...cv, [id]: v } });
  const filled = CANVAS_BOXES.filter(b => (cv[b.id] || "").trim()).length;

  return (
    <div>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
        <ProjectPicker projects={projects} project={project} setSel={setSel} />
        <Chip bg={C.navyLt} color={C.navy} style={{ fontSize: 11, padding: "5px 12px" }}>{filled}/9 boxes</Chip>
        <div style={{ fontSize: 12, color: C.faint }}>The one-page brain of the project. Draft it in the kickoff, pressure-test it at the day-30 retro, keep it honest at every gate. Everything here should trace to a DCOS artefact.</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 12 }}>
        {CANVAS_BOXES.map((b, i) => (
          <Card key={b.id} style={{ padding: 14, display: "flex", flexDirection: "column", borderTop: `3px solid ${[C.mul, C.mul, C.lime, C.lime, C.navy, C.navy, "#B07A00", C.graph, C.gold][i]}` }}>
            <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 13.5, marginBottom: 2 }}>{b.title}</div>
            <div style={{ fontSize: 10.5, color: C.faint, marginBottom: 8 }}>{b.hint}</div>
            <textarea value={cv[b.id] || ""} onChange={e => setBox(b.id, e.target.value)} rows={4} placeholder="Write here — it saves as you type"
              style={{ border: `1px solid ${C.soft}`, background: "#FBFAF8", borderRadius: 8, padding: "8px 10px", fontSize: 12.5, lineHeight: 1.5, color: C.ink, flex: 1 }} />
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ================= PLAYBOOK ================= */
function Playbook() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [open, setOpen] = useState(null);
  const cats = ["All", ...Array.from(new Set(PLAYBOOK.map(c => c.cat)))];
  const list = PLAYBOOK.filter(c =>
    (cat === "All" || c.cat === cat) &&
    (q.trim() === "" || (c.title + c.smell + c.diagnosis + c.moves.join(" ")).toLowerCase().includes(q.toLowerCase()))
  );
  return (
    <div>
      <Card style={{ marginBottom: 16, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search a situation — e.g. vendor, sponsor, adoption…"
          style={{ flex: "1 1 240px", border: `1px solid ${C.line}`, borderRadius: 8, padding: "10px 13px", fontSize: 13.5 }} />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {cats.map(c => (
            <button key={c} onClick={() => setCat(c)} style={{
              border: `1px solid ${cat === c ? C.mul : C.line}`, background: cat === c ? C.mul : "#fff", color: cat === c ? "#fff" : C.mid,
              borderRadius: 99, padding: "6px 13px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>{c}</button>
          ))}
        </div>
      </Card>
      <div style={{ fontSize: 12, color: C.faint, marginBottom: 12 }}>
        Pattern cards: real situations, the diagnosis underneath, and the moves that work. Maintained by the Framework Council — propose new patterns from your retros.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(330px,1fr))", gap: 14 }}>
        {list.map(c => {
          const isOpen = open === c.id;
          return (
            <Card key={c.id} style={{ cursor: "pointer" }} onClick={() => setOpen(isOpen ? null : c.id)}>
              <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                <Chip bg={C.navyLt} color={C.navy}>{c.cat}</Chip>
                <span style={{ marginLeft: "auto", color: C.faint, fontSize: 13 }}>{isOpen ? "−" : "+"}</span>
              </div>
              <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 16, margin: "8px 0 4px" }}>{c.title}</div>
              <div style={{ fontSize: 12.5, color: C.mid, fontStyle: "italic" }}>{c.smell}</div>
              {isOpen && (
                <div onClick={e => e.stopPropagation()} style={{ marginTop: 12 }}>
                  <div style={{ borderLeft: `3px solid ${C.mul}`, background: C.mulLt, borderRadius: "0 8px 8px 0", padding: "9px 13px", fontSize: 12.5, marginBottom: 10 }}>
                    <b style={{ fontFamily: DISP }}>Diagnosis. </b>{c.diagnosis}
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase", color: C.navy, marginBottom: 6 }}>The moves</div>
                  <ol style={{ margin: "0 0 10px 18px", fontSize: 12.5, color: C.ink }}>
                    {c.moves.map((m, i) => <li key={i} style={{ marginBottom: 5 }}>{m}</li>)}
                  </ol>
                  <div style={{ fontFamily: MONO, fontSize: 10.5, color: C.faint }}>DCOS refs: {c.refs}</div>
                </div>
              )}
            </Card>
          );
        })}
        {list.length === 0 && <Card style={{ gridColumn: "1/-1", color: C.mid }}>No pattern matches “{q}”. If the situation is real and recurring, that's a candidate card — bring it to the Framework Council.</Card>}
      </div>
    </div>
  );
}

/* ================= REVIEW PACK ================= */
function ReviewPack({ projects, update }) {
  const [copied, setCopied] = useState(false);
  const ranked = [...projects].sort((a, b) => wsjfScore(b.wsjf) - wsjfScore(a.wsjf));
  const attention = projects.map(p => {
    const reds = RAG_DIMS.filter(d => p.rag?.[d] === "R");
    const ambers = RAG_DIMS.filter(d => p.rag?.[d] === "A");
    const h = healthScore(p.health);
    const weak = ALL_DIMS.filter(d => (p.health?.[d.id] ?? 0) > 0 && p.health[d.id] <= 2).map(d => d.label);
    const flags = [];
    if (reds.length) flags.push(`RED on ${reds.join(", ")}`);
    if (h !== null && h < 55) flags.push(`health ${h}/100`);
    if (weak.length) flags.push(`weak: ${weak.join(", ")}`);
    if (!reds.length && ambers.length >= 3) flags.push(`${ambers.length} ambers`);
    return { p, h, flags };
  }).filter(x => x.flags.length);

  const daysSince = d => Math.floor((Date.now() - new Date(d + "T00:00:00").getTime()) / 86400000);
  const retros = projects.filter(p => p.hypothesis?.text && !p.hypothesis.retroDone)
    .map(p => ({ p, days: daysSince(p.hypothesis.date) }))
    .filter(x => x.days >= 25)
    .sort((a, b) => b.days - a.days);

  const md = () => {
    let m = `# Portfolio Review pre-pack — ${today()}\n\n## Snapshot\n${projects.length} projects · attention needed on ${attention.length}\n\n## Needs attention\n`;
    attention.forEach(({ p, flags }) => { m += `- **${p.name}** (${p.code}, Tier ${p.tier}, ${p.phase}): ${flags.join(" · ")}\n`; });
    if (!attention.length) m += "- none flagged this cycle\n";
    m += `\n## Priority order (WSJF)\n`;
    ranked.forEach((p, i) => { m += `${i + 1}. ${p.name} — ${wsjfScore(p.wsjf).toFixed(1)} (value ${p.value}, effort ${p.effort})\n`; });
    if (retros.length) {
      m += `\n## Day-30 configuration retros due\n`;
      retros.forEach(({ p, days }) => { m += `- **${p.name}**: hypothesis from ${p.hypothesis.date} (${days} days old, Tier ${p.tier}) — retro pending\n`; });
    }
    m += `\n_Generated by DCOS Navigator. Numbers trace to the Health Scan and Priority Lab; this pack supports, never replaces, the systems of record._\n`;
    return m;
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(md()); setCopied(true); setTimeout(() => setCopied(false), 1800); }
    catch { /* clipboard unavailable in some sandboxes */ }
  };

  return (
    <div>
      <Card style={{ marginBottom: 16, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontFamily: DISP, fontWeight: 800, fontSize: 18 }}>Portfolio Review pre-pack</div>
          <div style={{ fontSize: 12.5, color: C.mid }}>The Senior Director's five-minute read: who needs attention, why, and the priority order. Assembled from your scans and scores.</div>
        </div>
        <button onClick={copy} style={{ marginLeft: "auto", background: C.mul, color: "#fff", border: "none", borderRadius: 8, padding: "10px 16px", fontFamily: DISP, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          {copied ? "Copied ✓" : "Copy as Markdown"}
        </button>
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 14 }}>
        <Card>
          <SectionLabel color={C.red}>Needs attention ({attention.length})</SectionLabel>
          {attention.length === 0 && <div style={{ fontSize: 13, color: C.mid }}>Nothing flagged. Either a good month — or the scans are overdue.</div>}
          {attention.map(({ p, flags }) => (
            <div key={p.id} style={{ borderLeft: `3px solid ${C.red}`, background: "#F8E9E8", borderRadius: "0 8px 8px 0", padding: "10px 14px", marginBottom: 10 }}>
              <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 13.5 }}>{p.name} <span style={{ fontFamily: MONO, fontSize: 10, color: C.faint }}>{p.code} · Tier {p.tier} · {p.phase}</span></div>
              <div style={{ fontSize: 12, color: C.mid }}>{flags.join("  ·  ")}</div>
            </div>
          ))}
        </Card>
        <Card>
          <SectionLabel color={C.navy}>Priority order — WSJF</SectionLabel>
          {ranked.map((p, i) => (
            <div key={p.id} style={{ display: "flex", gap: 10, alignItems: "baseline", padding: "7px 0", borderBottom: `1px dashed ${C.soft}` }}>
              <span style={{ fontFamily: DISP, fontWeight: 800, color: i === 0 ? C.mul : C.faint, minWidth: 26 }}>#{i + 1}</span>
              <span style={{ fontFamily: DISP, fontWeight: 600, fontSize: 13.5 }}>{p.name}</span>
              <span style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 12, color: C.mul }}>{wsjfScore(p.wsjf).toFixed(1)}</span>
            </div>
          ))}
        </Card>
        <Card style={{ gridColumn: "1/-1", borderTop: `3px solid ${C.gold}` }}>
          <SectionLabel color={"#8A6200"}>Day-30 configuration retros — the hypothesis discipline</SectionLabel>
          {retros.length === 0 && <div style={{ fontSize: 13, color: C.mid }}>No hypotheses past their checkpoint. Projects created through the wizard appear here automatically ~30 days after G1 framing.</div>}
          {retros.map(({ p, days }) => (
            <div key={p.id} style={{ borderLeft: `3px solid ${C.gold}`, background: C.goldLt, borderRadius: "0 8px 8px 0", padding: "11px 14px", marginBottom: 10 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "baseline", flexWrap: "wrap" }}>
                <span style={{ fontFamily: DISP, fontWeight: 700, fontSize: 13.5 }}>{p.name}</span>
                <Chip bg={days > 40 ? "#F8E9E8" : "#fff"} color={days > 40 ? C.red : "#8A6200"}>{days} days since hypothesis</Chip>
                <button onClick={() => update(p.id, { hypothesis: { ...p.hypothesis, retroDone: today() }, events: evPush(p, mkEv("decision", "Day-30 configuration retro completed", "Hypothesis reviewed against pivot triggers; outcome logged in T08")) })} style={{ marginLeft: "auto", border: `1px solid #8A6200`, background: "#fff", color: "#8A6200", borderRadius: 8, padding: "5px 12px", fontSize: 11.5, fontWeight: 700, fontFamily: DISP, cursor: "pointer" }}>Mark retro done ✓</button>
              </div>
              <div style={{ fontSize: 11.5, fontStyle: "italic", color: C.mid, marginTop: 5 }}>{p.hypothesis.text.slice(0, 220)}…</div>
              <div style={{ fontSize: 10.5, color: C.faint, marginTop: 4 }}>Retro script: re-read the hypothesis · evidence per pivot trigger · friction round · keep / adjust / change tier → T08.</div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

/* ================= GOVERNANCE YEAR ================= */
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const LENSES = ["Strategy", "Delivery", "Direction", "Risk"];
const AUDIENCES = ["Senior Director", "Sponsor", "PM", "PO", "Change Lead", "D&C Director"];
const Q = [3, 6, 9, 12], ALLM = [1,2,3,4,5,6,7,8,9,10,11,12];
const GOV_ROWS = [
  { band: "Decide — forums", name: "Portfolio Review", owner: "Senior Director chairs", months: ALLM, cadence: "Monthly",
    lenses: ["Strategy", "Direction", "Risk"], aud: ["Senior Director", "D&C Director"],
    inputs: "Tiered status roll-up · value tracker (T13) · escalations", decisions: "Funding & prioritisation · cross-programme conflicts · gates G0 and G4" },
  { band: "Decide — forums", name: "Steering Committee (per project)", owner: "Sponsor chairs · PM assembles (T05)", months: ALLM, cadence: "Monthly / per gate",
    lenses: ["Direction", "Delivery"], aud: ["Sponsor", "PM", "PO", "Change Lead"],
    inputs: "T04 status · plan vs baseline · T13 extract · T12 adoption · decision log", decisions: "Gates G1–G3 · scope changes · escalated risks (options + recommendation)" },
  { band: "Decide — forums", name: "Gate boards", owner: "Sponsor + D&C Director QA", months: [2, 5, 8, 11], cadence: "Event-driven (typical pattern shown)",
    lenses: ["Direction"], aud: ["Sponsor", "PM", "D&C Director"],
    inputs: "Gate entry/exit criteria pack per tier", decisions: "Pass / conditional pass / hold — recorded in T08" },
  { band: "Decide — forums", name: "Change Control Board (Tier C)", owner: "PM runs · Sponsor decides", months: ALLM, cadence: "Biweekly or on demand",
    lenses: ["Delivery", "Risk"], aud: ["Sponsor", "PM"],
    inputs: "Change requests with impact vs baseline", decisions: "Approve / reject / defer scope & baseline changes" },
  { band: "Decide — forums", name: "Framework Council", owner: "D&C Director chairs", months: Q, cadence: "Quarterly, 90'",
    lenses: ["Strategy"], aud: ["D&C Director", "PM", "PO", "Change Lead", "Senior Director"],
    inputs: "Retro lessons · pivot statistics · anti-pattern sightings · trend radar · agent estate review", decisions: "Versioned framework updates · one experiment per quarter · template/agent intake" },
  { band: "Decide — forums", name: "Annual planning & budget", owner: "Senior Director", months: [10, 11], cadence: "Oct–Nov",
    lenses: ["Strategy"], aud: ["Senior Director", "Sponsor"],
    inputs: "Value realised vs hypotheses · pipeline of business cases (T02)", decisions: "Next-year envelope · portfolio shape" },
  { band: "Report — artefact cadences", name: "Status report (T04)", owner: "PM — assembled, never authored", months: ALLM, cadence: "Weekly–monthly by tier",
    lenses: ["Delivery"], aud: ["Sponsor", "PM", "Senior Director"],
    inputs: "Smartsheet plan & RAID · JIRA flow · T12 adoption", decisions: "Decisions-needed box feeds the SteerCo agenda" },
  { band: "Report — artefact cadences", name: "RAID review (T03)", owner: "PM", months: ALLM, cadence: "Weekly",
    lenses: ["Risk"], aud: ["PM"],
    inputs: "Live RAID sheet · RAID-miner digest (AG-02)", decisions: "Mitigation owners & dates · escalation flags" },
  { band: "Report — artefact cadences", name: "Value review (T13)", owner: "Business benefit owners · PM curates", months: ALLM, cadence: "Monthly → quarterly post-G4",
    lenses: ["Strategy", "Risk"], aud: ["Sponsor", "Senior Director"],
    inputs: "Leading indicators from telemetry · benefit status", decisions: "Steer / write off honestly / link change-stream actions" },
  { band: "Report — artefact cadences", name: "Adoption dashboard (T12)", owner: "Change Lead", months: ALLM, cadence: "Daily in Embed → monthly",
    lenses: ["Delivery", "Risk"], aud: ["Change Lead", "Sponsor"],
    inputs: "Usage, proficiency, sentiment vs per-group targets", decisions: "One-week SLA: soft signal → named change action" },
  { band: "Refresh — framework rhythm", name: "PM Community of Practice", owner: "D&C Director", months: ALLM, cadence: "Monthly clinic",
    lenses: ["Direction"], aud: ["PM", "PO", "Change Lead", "D&C Director"],
    inputs: "Anti-pattern sightings · lesson of the month", decisions: "Candidate playbook patterns → Council intake" },
  { band: "Refresh — framework rhythm", name: "Certification panels & training refresh", owner: "Coaches + D&C Director", months: Q, cadence: "Quarterly",
    lenses: ["Direction"], aud: ["PM", "D&C Director"],
    inputs: "Practitioner checklists · quiz pass-rate stats", decisions: "Certifications granted · content rewrites" },
  { band: "Refresh — framework rhythm", name: "Framework version release", owner: "D&C Director", months: [1], cadence: "Major in Jan · minors per Council",
    lenses: ["Strategy"], aud: ["D&C Director", "PM"],
    inputs: "Council outputs of the year", decisions: "vMAJOR ships with training refresh; projects migrate at next gate" },
  { band: "Refresh — framework rhythm", name: "Day-30 configuration retros", owner: "Coach facilitates", months: ALLM, cadence: "Event-driven, ~30 days after G1",
    lenses: ["Delivery"], aud: ["PM", "PO", "Change Lead"],
    inputs: "Tier hypothesis + pivot-trigger evidence", decisions: "Keep / adjust / change tier — logged in T08" },
];

function GovernanceYear() {
  const [lens, setLens] = useState("All");
  const [aud, setAud] = useState("All");
  const [open, setOpen] = useState(null);
  const match = r => (lens === "All" || r.lenses.includes(lens)) && (aud === "All" || r.aud.includes(aud));
  const bands = Array.from(new Set(GOV_ROWS.map(r => r.band)));
  const ChipBtn = ({ v, cur, set }) => (
    <button onClick={() => set(v)} style={{ border: `1px solid ${cur === v ? C.mul : C.line}`, background: cur === v ? C.mul : "#fff", color: cur === v ? "#fff" : C.mid, borderRadius: 99, padding: "5px 12px", fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}>{v}</button>
  );
  return (
    <div>
      <Card style={{ marginBottom: 14 }}>
        <div style={{ fontFamily: DISP, fontWeight: 800, fontSize: 18 }}>The governance year on one page</div>
        <div style={{ fontSize: 12.5, color: C.mid, marginBottom: 12 }}>Every forum, report and refresh rhythm in DCOS, across the calendar. Filter by lens or by who sits in the room; click a row for inputs and the decisions it takes. ● monthly/quarterly occurrence · the cadence column tells the within-month rhythm.</div>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontFamily: MONO, fontSize: 10, textTransform: "uppercase", letterSpacing: ".1em", color: C.faint }}>Lens</span>
          {["All", ...LENSES].map(v => <ChipBtn key={v} v={v} cur={lens} set={setLens} />)}
          <span style={{ fontFamily: MONO, fontSize: 10, textTransform: "uppercase", letterSpacing: ".1em", color: C.faint, marginLeft: 8 }}>Audience</span>
          {["All", ...AUDIENCES].map(v => <ChipBtn key={v} v={v} cur={aud} set={setAud} />)}
        </div>
      </Card>
      {bands.map(band => (
        <div key={band} style={{ marginBottom: 18 }}>
          <SectionLabel color={band.startsWith("Decide") ? C.mul : band.startsWith("Report") ? C.navy : C.lime}>{band}</SectionLabel>
          <Card style={{ padding: 0, overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 880 }}>
              <thead><tr>
                <th style={{ textAlign: "left", padding: "9px 14px", fontFamily: DISP, fontSize: 11, color: "#fff", background: C.graph, position: "sticky", left: 0 }}>Forum / artefact</th>
                {MONTHS.map(m => <th key={m} style={{ padding: "9px 4px", fontFamily: MONO, fontSize: 9.5, color: "#C9D2CF", background: C.graph, fontWeight: 500 }}>{m}</th>)}
                <th style={{ textAlign: "left", padding: "9px 12px", fontFamily: DISP, fontSize: 11, color: "#fff", background: C.graph }}>Cadence</th>
              </tr></thead>
              <tbody>
                {GOV_ROWS.filter(r => r.band === band).map(r => {
                  const on = match(r), isOpen = open === r.name;
                  return (
                    <React.Fragment key={r.name}>
                      <tr onClick={() => setOpen(isOpen ? null : r.name)} style={{ opacity: on ? 1 : 0.22, cursor: "pointer", background: isOpen ? C.mulLt : "transparent", transition: "opacity .2s" }}>
                        <td style={{ padding: "9px 14px", fontFamily: DISP, fontWeight: 600, fontSize: 12.5, borderTop: `1px solid ${C.soft}`, whiteSpace: "nowrap" }}>{r.name} <span style={{ color: C.faint, fontWeight: 400, fontSize: 11 }}>{isOpen ? "▾" : "▸"}</span></td>
                        {ALLM.map(m => (
                          <td key={m} style={{ textAlign: "center", borderTop: `1px solid ${C.soft}` }}>
                            {r.months.includes(m) && <span style={{ display: "inline-block", width: 9, height: 9, borderRadius: "50%", background: band.startsWith("Decide") ? C.mul : band.startsWith("Report") ? C.navy : C.lime }} />}
                          </td>
                        ))}
                        <td style={{ padding: "9px 12px", fontSize: 11, color: C.mid, borderTop: `1px solid ${C.soft}`, whiteSpace: "nowrap" }}>{r.cadence}</td>
                      </tr>
                      {isOpen && (
                        <tr><td colSpan={14} style={{ background: "#FBFAF8", padding: "12px 16px", borderTop: `1px solid ${C.soft}` }}>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14, fontSize: 12 }}>
                            <div><b style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: ".1em", color: C.faint }}>OWNER</b><br />{r.owner}</div>
                            <div><b style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: ".1em", color: C.faint }}>CONSUMES</b><br />{r.inputs}</div>
                            <div><b style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: ".1em", color: C.faint }}>DECIDES</b><br />{r.decisions}</div>
                            <div><b style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: ".1em", color: C.faint }}>IN THE ROOM</b><br />{r.aud.join(" · ")}<br /><b style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: ".1em", color: C.faint }}>LENS</b> {r.lenses.join(" · ")}</div>
                          </div>
                        </td></tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </div>
      ))}
    </div>
  );
}

/* ================= DEMO TIMELINE ================= */
const EV_TYPES = {
  gate: { label: "Gate", color: "#F0AB00", text: "#1C2222" },
  forum: { label: "Forum", color: "#830051", text: "#fff" },
  status: { label: "Status", color: "#003865", text: "#fff" },
  decision: { label: "Decision", color: "#2B3333", text: "#fff" },
  risk: { label: "Risk", color: "#B3261E", text: "#fff" },
  artefact: { label: "Artefact", color: "#8A9900", text: "#fff" },
  discussion: { label: "Discussion", color: "#8A949B", text: "#fff" },
};
const LINK_KINDS = { confluence: "Confluence", smartsheet: "Smartsheet", jira: "JIRA", ppt: "PPT (T05)", teams: "Teams thread", bi: "Power BI" };
const ev = (date, type, title, detail, links = [], state = null, discussion = null) => ({ date, type, title, detail, links, state, discussion });

const DEMO_PROJECTS = [
  { id: "helios", name: "Helios — AI Insights Platform", code: "OBU-114", tier: "B", note: "Mid-flight Tier B: the full hybrid rhythm with a live escalation.",
    events: [
      ev("2026-01-12", "artefact", "Discovery canvas run (T16)", "Framing: 'How might field managers self-serve performance questions?' 14 clusters → 3 epics seeded; board archived after the 48-hour rule.", [["confluence", "Discovery summary page"], ["jira", "3 epics with T15 stubs"]], { phase: "Frame", rag: "G" }),
      ev("2026-01-26", "gate", "G1 — charter signed, Tier B confirmed", "Configuration hypothesis: Tier B, biweekly status, monthly SteerCo. Pivot triggers registered.", [["confluence", "Charter T01 (signed)"], ["confluence", "Tier hypothesis"]], { phase: "Mobilise", rag: "G" }),
      ev("2026-02-09", "artefact", "Board stood up to T07 standard", "Five states, T15 link validation on epics, dashboards wired into the BI pack.", [["jira", "Board HEL"], ["bi", "Flow dashboard"]]),
      ev("2026-02-23", "forum", "SteerCo #1", "Eight slides, two decisions: data-source priority and pilot market = Iberia.", [["ppt", "SteerCo deck Feb"], ["confluence", "T08 entries D-01, D-02"]], { phase: "Deliver", rag: "G" }),
      ev("2026-03-02", "artefact", "Day-30 configuration retro (T14)", "Hypothesis held: no pivot triggers fired. One experiment: async refinement notes.", [["confluence", "Retro outcomes"]]),
      ev("2026-03-16", "status", "Status — first amber on Schedule", "Vendor API slipped one week; mitigation dated; confidence on M3 down to 70%.", [["smartsheet", "Plan & RAID rows"]], { phase: "Deliver", rag: "A" }),
      ev("2026-03-30", "risk", "R-014 escalated — vendor key-person risk", "Cause→event→impact quantified at 3–4 weeks; three options costed for SteerCo.", [["smartsheet", "RAID R-014"], ["teams", "Vendor escalation thread"]], null, "PM → Sponsor: 'Bringing options A/B/C on Thursday — recommendation is re-sequence; descope loses the Q3 value hypothesis.'"),
      ev("2026-04-06", "forum", "SteerCo #2 — escalation decided", "Option A (re-sequence) approved; baseline change logged; sponsor to call vendor exec.", [["ppt", "SteerCo deck Apr"], ["confluence", "T08 D-05 (Type 1)"]], { phase: "Deliver", rag: "A" }),
      ev("2026-04-20", "decision", "D-06 — saved-views feature prioritised by WSJF", "Refinement re-ranked the backlog in the open; instrumentation plan attached.", [["jira", "Epic HEL-23 + T15"]]),
      ev("2026-05-11", "status", "Status — back to green, adoption instrumentation live", "Re-sequenced plan holding; telemetry events deployed for the pilot.", [["smartsheet", "Plan v2 baseline"], ["bi", "T12 panels (pre-launch)"]], { phase: "Deliver", rag: "G" }),
      ev("2026-06-01", "forum", "SteerCo #3 — G2 gate combined", "Build exit criteria met; readiness checklist opened with the Change Lead.", [["ppt", "Gate pack"], ["confluence", "T10 impact assessment"]], { phase: "Deliver", rag: "G" }),
    ] },
  { id: "orion", name: "Orion — CRM Field Rollout", code: "OBU-097", tier: "C", note: "Late-stage Tier C in Embed: where adoption discipline earns its keep.",
    events: [
      ev("2026-01-19", "gate", "G3 — readiness gate passed (wave 1)", "Training 96%, access 100%, champions covering all districts; Change Lead signed.", [["confluence", "Readiness checklist"], ["bi", "T12 readiness panel"]], { phase: "Embed", rag: "G" }),
      ev("2026-02-02", "artefact", "Go-live wave 1 — hypercare opens", "Daily T12 review stood up; one-week SLA on soft signals active.", [["bi", "Adoption dashboard"], ["teams", "Hypercare channel"]], { phase: "Embed", rag: "G" }),
      ev("2026-02-16", "risk", "Retention soft in two districts", "Activation 92% but week-2 retention 41% vs 60% target in District N & E.", [["bi", "T12 usage panel"]], { phase: "Embed", rag: "A" }, "Change Lead: 'Shadowed five reps — the old export still beats the new view for one workflow. This is product friction, not comms.'"),
      ev("2026-02-20", "decision", "D-11 — fast-follow fix over comms push", "Friction fixed in product (saved filter); line managers briefed with one behavioural ask.", [["jira", "ORN-88 fast-follow"], ["confluence", "T08 D-11"]]),
      ev("2026-03-09", "status", "Status — retention recovering", "District N at 57% and climbing; sentiment pulse 3.9/5.", [["bi", "T12 trend"]], { phase: "Embed", rag: "G" }),
      ev("2026-03-23", "forum", "SteerCo — wave 2 approved", "Wave 2 markets approved with the same readiness bar; budget amber on travel costs.", [["ppt", "SteerCo deck Mar"], ["confluence", "T08 D-12"]], { phase: "Embed", rag: "A" }),
      ev("2026-04-27", "gate", "G3.2 — wave 2 readiness passed", "Lessons from wave 1 baked into training; champion model scaled.", [["confluence", "Wave 2 checklist"]], { phase: "Embed", rag: "G" }),
      ev("2026-05-18", "artefact", "Value review — first benefit realising", "Call-prep time down 23% vs 30% target; leading indicator on track for Q3.", [["smartsheet", "T13 rows"], ["bi", "Value dashboard"]]),
      ev("2026-06-05", "discussion", "Closure planning opens", "T17 pack drafted; benefit owners confirmed for post-G4 tracking.", [["confluence", "T17 draft"]], { phase: "Embed", rag: "G" }),
    ] },
  { id: "lyra", name: "Lyra — BI Migration", code: "OBU-121", tier: "D", note: "Early Tier D: proof that light touch still means the universal four.",
    events: [
      ev("2026-04-13", "artefact", "Charter short-form drafted", "Twelve legacy dashboards → standard stack; success measure: zero orphaned KPIs.", [["confluence", "Charter T01 (short form)"]], { phase: "Frame", rag: "G" }),
      ev("2026-04-27", "gate", "G1 — Tier D confirmed", "Profile score 2/12; biweekly check-ins, monthly one-pager. Lean RAID opened with 4 rows.", [["confluence", "Tier hypothesis"], ["smartsheet", "Lean RAID"]], { phase: "Mobilise", rag: "G" }),
      ev("2026-05-11", "status", "First monthly one-pager", "3 of 12 dashboards migrated; one dependency on the data team flagged with counterpart owner.", [["smartsheet", "Plan (lean)"]], { phase: "Deliver", rag: "G" }),
      ev("2026-05-25", "decision", "D-02 — deprecation dates published", "Old dashboards get sunset banners 30 days before switch-off; logged Type 2 same day.", [["confluence", "T08 D-02"]]),
      ev("2026-06-08", "status", "One-pager — on track", "7 of 12 migrated; usage of new stack already at 80% of old baseline.", [["bi", "Usage check"]], { phase: "Deliver", rag: "G" }),
    ] },
];

function TimelineDemo() {
  const [pid, setPid] = useState("helios");
  const [typ, setTyp] = useState("All");
  const [asOf, setAsOf] = useState("2026-06-30");
  const [selEv, setSelEv] = useState(null);
  const proj = DEMO_PROJECTS.find(p => p.id === pid);
  const visible = proj.events.filter(e => e.date <= asOf && (typ === "All" || e.type === typ));
  const lastState = [...proj.events].filter(e => e.date <= asOf && e.state).pop()?.state;
  const months = Array.from(new Set(visible.map(e => e.date.slice(0, 7))));
  const fmt = m => MONTHS[+m.slice(5, 7) - 1] + " " + m.slice(0, 4);

  return (
    <div>
      <Card style={{ marginBottom: 14 }}>
        <div style={{ fontFamily: DISP, fontWeight: 800, fontSize: 18 }}>How it actually runs — three demo projects, fully navigable</div>
        <div style={{ fontSize: 12.5, color: C.mid }}>Every gate, status, decision, risk and conversation on one timeline, each connected to its artefact. Drag the as-of date to read the project retrospectively — exactly the audit-and-handover experience the framework is designed to produce. (Demo data; in the corporate deployment these links resolve to the real Confluence / Smartsheet / JIRA objects via the connectors in the Agent Blueprint.)</div>
      </Card>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        {DEMO_PROJECTS.map(p => (
          <button key={p.id} onClick={() => { setPid(p.id); setSelEv(null); }} style={{ border: `1px solid ${pid === p.id ? C.mul : C.line}`, background: pid === p.id ? C.mul : "#fff", color: pid === p.id ? "#fff" : C.ink, borderRadius: 10, padding: "9px 14px", cursor: "pointer", textAlign: "left" }}>
            <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 13 }}>{p.name}</div>
            <div style={{ fontFamily: MONO, fontSize: 9.5, opacity: .75 }}>{p.code} · Tier {p.tier}</div>
          </button>
        ))}
      </div>
      <Card style={{ marginBottom: 14, display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["All", ...Object.keys(EV_TYPES)].map(t => (
            <button key={t} onClick={() => setTyp(t)} style={{ border: `1px solid ${typ === t ? C.mul : C.line}`, background: typ === t ? C.mul : "#fff", color: typ === t ? "#fff" : C.mid, borderRadius: 99, padding: "5px 11px", fontSize: 11, fontWeight: 600, cursor: "pointer", textTransform: "capitalize" }}>{t === "All" ? "All" : EV_TYPES[t].label}</button>
          ))}
        </div>
        <label style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center", fontSize: 12, color: C.mid }}>
          Rewind to
          <input type="range" min={0} max={180} value={Math.round((new Date(asOf) - new Date("2026-01-01")) / 86400000)}
            onChange={e => setAsOf(new Date(new Date("2026-01-01").getTime() + +e.target.value * 86400000).toISOString().slice(0, 10))} style={{ width: 180 }} aria-label="As-of date" />
          <span style={{ fontFamily: MONO, fontSize: 11.5, color: C.mul, minWidth: 84 }}>{asOf}</span>
        </label>
        {lastState && <Chip bg={C.navyLt} color={C.navy} style={{ fontSize: 11, padding: "5px 12px" }}>state at that date: {lastState.phase} · {lastState.rag === "G" ? "green" : lastState.rag === "A" ? "amber" : "red"}</Chip>}
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(300px,1.15fr) minmax(270px,0.85fr)", gap: 16, alignItems: "start" }}>
        <div>
          {months.map(m => (
            <div key={m}>
              <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: ".12em", textTransform: "uppercase", color: C.faint, margin: "14px 0 8px" }}>{fmt(m)}</div>
              {visible.filter(e => e.date.startsWith(m)).map((e, i) => {
                const t = EV_TYPES[e.type], isSel = selEv === e;
                return (
                  <div key={i} onClick={() => setSelEv(isSel ? null : e)} style={{ display: "flex", gap: 12, cursor: "pointer", padding: "9px 12px", borderRadius: 10, background: isSel ? C.mulLt : "#fff", border: `1px solid ${isSel ? "#E3BBD3" : C.line}`, marginBottom: 8, alignItems: "flex-start" }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, color: C.faint, minWidth: 38, paddingTop: 3 }}>{e.date.slice(8)} {MONTHS[+e.date.slice(5, 7) - 1]}</span>
                    <span style={{ background: t.color, color: t.text, fontFamily: MONO, fontSize: 9, letterSpacing: ".06em", textTransform: "uppercase", borderRadius: 99, padding: "3px 8px", whiteSpace: "nowrap", marginTop: 1 }}>{t.label}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 13 }}>{e.title}</div>
                      {!isSel && <div style={{ fontSize: 11.5, color: C.faint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 420 }}>{e.detail}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          {visible.length === 0 && <Card style={{ color: C.mid }}>Nothing on the timeline before {asOf} with that filter. Move the rewind forward.</Card>}
        </div>
        <div style={{ position: "sticky", top: 14 }}>
          {selEv ? (
            <Card>
              <Chip bg={EV_TYPES[selEv.type].color} color={EV_TYPES[selEv.type].text}>{EV_TYPES[selEv.type].label}</Chip>
              <div style={{ fontFamily: DISP, fontWeight: 800, fontSize: 17, margin: "8px 0 2px" }}>{selEv.title}</div>
              <div style={{ fontFamily: MONO, fontSize: 10.5, color: C.faint, marginBottom: 10 }}>{selEv.date} · {proj.name}</div>
              <p style={{ fontSize: 13, color: C.ink, marginBottom: 12 }}>{selEv.detail}</p>
              {selEv.discussion && (
                <div style={{ borderLeft: `3px solid ${C.faint}`, background: "#F4F3F1", borderRadius: "0 8px 8px 0", padding: "9px 12px", fontSize: 12, fontStyle: "italic", color: C.mid, marginBottom: 12 }}>{selEv.discussion}</div>
              )}
              <SectionLabel color={C.navy}>Connected — one click to the system of record</SectionLabel>
              {selEv.links.map(([kind, label], i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", padding: "7px 10px", border: `1px solid ${C.soft}`, borderRadius: 8, marginBottom: 6, fontSize: 12.5 }}>
                  <Chip bg={C.navyLt} color={C.navy} style={{ fontSize: 8.5 }}>{LINK_KINDS[kind]}</Chip>
                  <span>{label}</span>
                  <span style={{ marginLeft: "auto", color: C.faint, fontFamily: MONO, fontSize: 10 }}>demo →</span>
                </div>
              ))}
            </Card>
          ) : (
            <Card style={{ color: C.mid, fontSize: 13 }}>
              <b style={{ fontFamily: DISP, color: C.ink }}>{proj.note}</b><br /><br />
              Click any event to open it: detail, the conversation around it, and the documents it connects to. This panel is what an auditor, a new PM, or the Senior Director sees when they ask “what happened and where's the evidence?”
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================= LIBRARY ================= */
const LIB_KEY = "dcos-navigator-links";
const LIB_ITEMS = [
  { id: "playbook", name: "DCOS Playbook", kind: "HTML app", desc: "The operating system: framework, integration map, tailoring engine, tiers, roles, refresh model." },
  { id: "templates", name: "Template Pack", kind: "HTML doc", desc: "All 17 artefacts field-by-field with quality bars and worked examples." },
  { id: "academy", name: "DCOS Academy — Training Guide", kind: "HTML app", desc: "Three certification levels, quiz bank, case library, SteerCo simulation, 90-day runway." },
  { id: "execdeck", name: "Executive Deck", kind: "PPTX", desc: "14-slide launch briefing for the team and leadership." },
  { id: "govmaster", name: "Governance Master", kind: "PPTX", desc: "Locked layouts: T04 status one-pager · T05 SteerCo (8 slides) · T17 closure pack." },
  { id: "workmaster", name: "Working Master", kind: "PPTX", desc: "Locked layouts: T01 charter · T06 plan · T09 stakeholder map & engagement · Confluence and JIRA approach." },
  { id: "agents", name: "Agent Blueprint", kind: "HTML doc", desc: "AI agents over SharePoint / Confluence / JIRA / Smartsheet: architecture, four agents, governance, 60-day pilot." },
];

function Library() {
  const [links, setLinks] = useState({});
  const [loaded, setLoaded] = useState(false);
  const timer = useRef(null);
  useEffect(() => {
    (async () => {
      try { const r = await window.storage.get(LIB_KEY); setLinks(r ? JSON.parse(r.value) : {}); } catch { setLinks({}); }
      setLoaded(true);
    })();
  }, []);
  useEffect(() => {
    if (!loaded) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => { try { await window.storage.set(LIB_KEY, JSON.stringify(links)); } catch {} }, 600);
    return () => clearTimeout(timer.current);
  }, [links, loaded]);

  return (
    <div>
      <Card style={{ marginBottom: 14 }}>
        <div style={{ fontFamily: DISP, fontWeight: 800, fontSize: 18 }}>The DCOS suite — one click from the cockpit</div>
        <div style={{ fontSize: 12.5, color: C.mid }}>Paste the SharePoint / Confluence URL where each deliverable lives in your tenancy; the links persist for everyone using this deployment of the Navigator. Until then, the names below match the files shipped in the suite.</div>
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(330px,1fr))", gap: 14 }}>
        {LIB_ITEMS.map(it => (
          <Card key={it.id}>
            <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
              <span style={{ fontFamily: DISP, fontWeight: 700, fontSize: 15 }}>{it.name}</span>
              <Chip bg={it.kind === "PPTX" ? C.mulLt : C.navyLt} color={it.kind === "PPTX" ? C.mul : C.navy} style={{ marginLeft: "auto" }}>{it.kind}</Chip>
            </div>
            <div style={{ fontSize: 12, color: C.mid, margin: "6px 0 10px" }}>{it.desc}</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={links[it.id] || ""} onChange={e => setLinks(l => ({ ...l, [it.id]: e.target.value }))} placeholder="https:// paste the corporate link"
                style={{ flex: 1, border: `1px solid ${C.line}`, borderRadius: 8, padding: "8px 10px", fontSize: 12, fontFamily: MONO }} />
              <button disabled={!links[it.id]} onClick={() => window.open(links[it.id], "_blank", "noopener")}
                style={{ border: "none", background: links[it.id] ? C.mul : C.soft, color: links[it.id] ? "#fff" : C.faint, borderRadius: 8, padding: "8px 14px", fontFamily: DISP, fontWeight: 700, fontSize: 12, cursor: links[it.id] ? "pointer" : "default" }}>Open</button>
            </div>
          </Card>
        ))}
      </div>
      <Card style={{ marginTop: 16, borderLeft: `4px solid ${C.gold}`, background: C.goldLt }}>
        <SectionLabel color={"#8A6200"}>Next evolution — agreed roadmap</SectionLabel>
        <ul style={{ margin: "0 0 0 18px", fontSize: 13, color: C.ink }}>
          <li style={{ marginBottom: 6 }}><b>AZ-branded PPT generation in-app:</b> fill T04 / T05 / T01 in the Navigator and export a finished deck on the official AstraZeneca master (mulberry/gold layouts per the brand deck) with one button — runs on pptxgenjs in the corporate deployment, where file generation is available.</li>
          <li style={{ marginBottom: 6 }}><b>Corporate deployment:</b> host inside AZ (Azure static app + Entra SSO), swap demo links for live connectors per the Agent Blueprint — the Demo Timeline becomes the real navigator, with every event resolving to its Confluence page, Smartsheet row, JIRA issue or SteerCo deck.</li>
          <li><b>Agents wired in:</b> AG-01 pre-fills the status from systems of record; AG-02's digest lands in the Review Pack; the Health Scan trend feeds the Portfolio Review automatically.</li>
        </ul>
      </Card>
    </div>
  );
}

/* ================= THIS WEEK ================= */
function isoWeekInfo(offset = 0) {
  const d = new Date(); d.setDate(d.getDate() + offset * 7);
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((t - yearStart) / 86400000 + 1) / 7);
  const mon = new Date(d); mon.setDate(d.getDate() - ((d.getDay() || 7) - 1));
  const fri = new Date(mon); fri.setDate(mon.getDate() + 4);
  const fm = x => x.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const month = mon.getMonth() + 1, quarter = Math.ceil(month / 3);
  const firstWeekOfMonth = mon.getDate() <= 7;
  const firstWeekOfQuarter = firstWeekOfMonth && (month % 3 === 1);
  return { key: `${t.getUTCFullYear()}-W${String(week).padStart(2, "0")}`, week, label: `${fm(mon)} – ${fm(fri)}`, even: week % 2 === 0, firstWeekOfMonth, firstWeekOfQuarter };
}

/* Cadence rules: which items fall due in a given week, by tier + phase. */
function weekItems(p, w) {
  const it = [];
  const add = (id, title, ref, why) => it.push({ id, title, ref, why });
  const T = p.tier, ph = p.phase;
  // Universal four
  add("raid", "RAID review — owners and dates current", "T03", "weekly, every tier");
  if (w.firstWeekOfMonth) add("t08", "Decision log sweep — anything decided but unlogged?", "T08", "monthly hygiene");
  // Status cadence
  if (T === "A" && w.even) add("status", "Sprint-end status report", "T04", "Tier A · sprint-end");
  if (T === "B" && w.even) add("status", "Biweekly status report", "T04", "Tier B · biweekly");
  if (T === "C") add("status", "Weekly status report", "T04", "Tier C · weekly");
  if (T === "D" && w.firstWeekOfMonth) add("status", "Monthly one-pager", "T04 short", "Tier D · monthly");
  // Ceremonies
  if (T === "A") { if (w.even) { add("plan", "Sprint planning", "T15/T07", "biweekly"); add("retro", "Sprint retro — one experiment", "T14", "biweekly"); } add("refine", "Backlog refinement with PO", "T15", "weekly"); }
  if (T === "B") { if (w.even) add("demo", "Iteration demo — stakeholders invited", "T15", "biweekly"); if (w.firstWeekOfMonth) add("retro", "Monthly retro", "T14", "monthly"); }
  if (T === "C" && w.even) add("ccb", "Change Control Board", "T08", "biweekly");
  if (T === "D" && w.even) add("checkin", "Biweekly check-in (30')", "—", "Tier D rhythm");
  // Governance
  if (T !== "D" && w.firstWeekOfMonth) { add("steerco", "SteerCo — deck assembled from systems of record", "T05", "monthly, rule of eight"); add("value", "Value review — leading indicators", "T13", "monthly"); }
  if (T === "D" && w.firstWeekOfQuarter) add("qrev", "Quarterly sponsor review", "T04/T13", "Tier D · quarterly");
  // Phase modifiers
  if (ph === "Frame") add("frame", "Charter draft + tier hypothesis for G1", "T01/T02", "Frame exit");
  if (ph === "Mobilise") { add("t10", "Change Impact Assessment before G2", "T10", "Mobilise exit"); add("board", "Board + workspace to standard", "T07", "Mobilise"); add("d30", "Book the day-30 configuration retro", "T14", "hypothesis check"); }
  if (ph === "Embed") { add("t12", "Adoption review — daily this week (hypercare)", "T12", "Embed: soft signal → action in 1 week"); if (w.firstWeekOfMonth) add("t11", "Comms plan: next wave senders briefed", "T11", "Embed"); }
  if (ph === "Realise") { it.length = 0; if (w.firstWeekOfQuarter) add("valueq", "Quarterly value tracking with business owner", "T13", "post-G4"); }
  if (ph === "Deliver" && (p.rag?.Adoption === "A" || p.rag?.Adoption === "R")) add("adopt", "Adoption amber/red — change action named?", "T12/T11", "from your RAG");
  if (RAG_DIMS.some(d => p.rag?.[d] === "R")) add("esc", "RED dimension — escalation with 3 options ready", "T03/T05", "never a naked problem");
  if (p.hypothesis?.text && !p.hypothesis.retroDone) {
    const days = Math.floor((Date.now() - new Date(p.hypothesis.date + "T00:00:00").getTime()) / 86400000);
    if (days >= 25) add("d30due", "Day-30 configuration retro DUE — evidence per pivot trigger", "T14/T08", days + " days since hypothesis");
  }
  return it;
}
const NEXT_GATE = { Frame: ["G1", "charter signed, tier confirmed"], Mobilise: ["G2", "impact assessed, board to standard"], Deliver: ["G3", "readiness gate — Change Lead signs"], Embed: ["G4", "closure + value handover"], Realise: [null, "value tracking with the business"] };

function WeekView({ projects }) {
  const [offset, setOffset] = useState(0);
  const [done, setDone] = useState({});
  const [loaded, setLoaded] = useState(false);
  const timer = useRef(null);
  const w = isoWeekInfo(offset);
  useEffect(() => {
    (async () => {
      try { const r = await window.storage.get("dcos-navigator-week"); setDone(r ? JSON.parse(r.value) : {}); } catch { setDone({}); }
      setLoaded(true);
    })();
  }, []);
  useEffect(() => {
    if (!loaded) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => { try { await window.storage.set("dcos-navigator-week", JSON.stringify(done)); } catch {} }, 600);
    return () => clearTimeout(timer.current);
  }, [done, loaded]);
  const toggle = (pid, iid) => setDone(d => {
    const wk = { ...(d[w.key] || {}) }, pj = { ...(wk[pid] || {}) };
    pj[iid] = !pj[iid]; wk[pid] = pj;
    return { ...d, [w.key]: wk };
  });
  const lists = projects.map(p => ({ p, items: weekItems(p, w) }));
  const total = lists.reduce((a, l) => a + l.items.length, 0);
  const ticked = lists.reduce((a, l) => a + l.items.filter(i => done[w.key]?.[l.p.id]?.[i.id]).length, 0);

  return (
    <div>
      <Card style={{ marginBottom: 14, display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontFamily: DISP, fontWeight: 800, fontSize: 18 }}>Your week, computed from the framework</div>
          <div style={{ fontSize: 12.5, color: C.mid }}>Each item comes from a tier cadence, a phase exit, or your own RAG — nothing invented. Tick as you go; it persists per week.</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => setOffset(o => o - 1)} style={{ border: `1px solid ${C.line}`, background: "#fff", borderRadius: 8, padding: "7px 11px", cursor: "pointer", fontSize: 13 }}>‹</button>
          <div style={{ textAlign: "center", minWidth: 150 }}>
            <div style={{ fontFamily: MONO, fontSize: 10.5, color: C.mul }}>{w.key}{offset === 0 ? " · current" : ""}</div>
            <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 14 }}>{w.label}</div>
          </div>
          <button onClick={() => setOffset(o => o + 1)} style={{ border: `1px solid ${C.line}`, background: "#fff", borderRadius: 8, padding: "7px 11px", cursor: "pointer", fontSize: 13 }}>›</button>
        </div>
        <div style={{ flexBasis: "100%", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1, height: 7, background: C.soft, borderRadius: 99, overflow: "hidden" }}>
            <div style={{ width: total ? `${(ticked / total) * 100}%` : 0, height: "100%", background: `linear-gradient(90deg, ${C.gold}, ${C.mul})`, transition: "width .25s" }} />
          </div>
          <span style={{ fontFamily: MONO, fontSize: 11.5, color: C.mid }}>{ticked}/{total} done</span>
        </div>
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(310px,1fr))", gap: 14, alignItems: "start" }}>
        {lists.map(({ p, items }) => {
          const [g, hint] = NEXT_GATE[p.phase] || [null, ""];
          return (
            <Card key={p.id} style={{ borderTop: `3px solid ${C.mul}` }}>
              <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap", marginBottom: 4 }}>
                <span style={{ fontFamily: DISP, fontWeight: 700, fontSize: 15 }}>{p.name}</span>
                <Chip bg={C.mulLt} color={C.mul}>Tier {p.tier}</Chip>
                <Chip bg={C.navyLt} color={C.navy}>{p.phase}</Chip>
              </div>
              {g && <div style={{ fontSize: 11, color: C.faint, marginBottom: 10 }}>Next gate: <b style={{ color: "#8A6200" }}>{g}</b> — {hint}</div>}
              {items.length === 0 && <div style={{ fontSize: 12.5, color: C.mid }}>Nothing due this week beyond the daily rhythm. Enjoy it — or pull the next gate's prep forward.</div>}
              {items.map(i => {
                const checked = !!done[w.key]?.[p.id]?.[i.id];
                return (
                  <label key={i.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 0", borderBottom: `1px dashed ${C.soft}`, cursor: "pointer" }}>
                    <input type="checkbox" checked={checked} onChange={() => toggle(p.id, i.id)} style={{ marginTop: 3, accentColor: C.mul }} />
                    <span style={{ flex: 1, fontSize: 12.5, color: checked ? C.faint : C.ink, textDecoration: checked ? "line-through" : "none" }}>
                      {i.title}
                      <span style={{ display: "block", fontFamily: MONO, fontSize: 9.5, color: C.faint }}>{i.ref} · {i.why}</span>
                    </span>
                  </label>
                );
              })}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ================= TEMPLATE CATALOG (the 17, embedded) ================= */
const TPL = [
  { id: "T01", name: "Project Charter", fam: "Govern", sor: "Confluence", owner: "PM (sponsor signs)", cad: "Once + change control", fields: ["Problem (2 sentences, business language)", "Outcome & measures → map 1:1 to T13", "Scope in / out (out is the important list)", "Roles, envelope, key dates, signatures"], good: "Fits one page; measures traceable to value tracker", bad: "'Improve efficiency' with no baseline; silent edits after G1" },
  { id: "T02", name: "Business Case & Value Hypothesis", fam: "Govern", sor: "PPT + Excel", owner: "Sponsor", cad: "G0/G1, refresh per gate", fields: ["Problem sized with data", "≥3 options incl. do-nothing", "Value hypotheses (We believe…)", "TCO + sensitivity, risks & ask"], good: "Every benefit has an owner and leading indicator", bad: "Single-point estimates; case never reopened" },
  { id: "T03", name: "RAID Log", fam: "Govern", sor: "Smartsheet", owner: "PM", cad: "Reviewed weekly", fields: ["Cause→event→impact descriptions", "P×I score, owner (a person)", "Mitigation verb + due date", "Escalation flag → feeds T04/T05"], good: "Top risks change over time; closed items kept", bad: "Same top-5 for 3 months; 'monitor' as mitigation" },
  { id: "T04", name: "Status Report (RAG one-pager)", fam: "Govern", sor: "PPT (locked layout)", owner: "PM", cad: "Weekly–monthly by tier", fields: ["Headline (written last, placed first)", "RAG × 5 dims incl. Adoption, with trend + owner", "Top 3 risks auto from RAID", "Decisions needed + look-ahead"], good: "Zero hand-typed numbers; honest ambers", bad: "Watermelon; chronological essays" },
  { id: "T05", name: "SteerCo Deck", fam: "Govern", sor: "PPT (8 slides max)", owner: "PM assembles", cad: "Monthly / per gate", fields: ["T04 verbatim", "Decisions requested up front", "Plan, value, adoption extracts", "Escalations with options + recommendation"], good: "Decisions slide by minute ten", bad: "Slide 9; 'for awareness' longer than decisions" },
  { id: "T06", name: "Delivery Plan / Roadmap", fam: "Deliver", sor: "Smartsheet", owner: "PM", cad: "Baselined per gate", fields: ["Outcome milestones with confidence %", "Dependencies with counterpart owners", "Baseline vs actual (re-baseline = T08)", "Resourcing lane"], good: "Critical path visible in 10 seconds", bad: "500-line plans nobody opens" },
  { id: "T07", name: "Board Standard (JIRA)", fam: "Deliver", sor: "JIRA", owner: "PM / SM", cad: "Set at mobilisation", fields: ["Initiative→Epic→Story hierarchy", "5 workflow states only", "DoR / DoD (telemetry in Done)", "Fibonacci points, standard dashboards"], good: "Any PM reads any board cold", bad: "Custom states incl. 'Waiting 2'" },
  { id: "T08", name: "Decision Log", fam: "Govern", sor: "Confluence", owner: "PM", cad: "Continuous", fields: ["Decision (imperative, one sentence)", "Options considered + rejection reasons", "One decision-maker", "Reversibility class Type 1/2"], good: "Type 2 logged same day at lowest level", bad: "Committee names in the decider column" },
  { id: "T09", name: "Stakeholder Map & Engagement", fam: "Deliver", sor: "Miro + Smartsheet", owner: "PM + Change Lead", cad: "Refreshed monthly", fields: ["Power/interest grid (individuals)", "Current → required stance", "What they care about (their words)", "Dated engagement actions"], good: "Stances move and actions explain why", bad: "Everyone a 'supporter'; map made once" },
  { id: "T10", name: "Change Impact Assessment", fam: "Change", sor: "Confluence", owner: "Change Lead", cad: "G1–G2", fields: ["Per group: size, 4-lens change, severity 1–4", "From→to day-in-the-life", "Readiness gaps → T11 rows", "Compliance co-signature where regulated"], good: "Built from interviews, severity drives treatment", bad: "One generic 'users' group; done after design freeze" },
  { id: "T11", name: "Comms & Engagement Plan", fam: "Change", sor: "Smartsheet", owner: "Change Lead", cad: "Living, weekly in Embed", fields: ["Audience × message × channel × sender × date", "Senders are leaders, project drafts", "Sequenced: aware → trained → live", "Feedback loop per wave"], good: "Two-way; messages repeated via credible voices", bad: "One launch email 'to all'" },
  { id: "T12", name: "Adoption & Readiness Dashboard", fam: "Change", sor: "Power BI", owner: "Change Lead", cad: "Daily → monthly", fields: ["Readiness (pre-launch)", "Usage by group vs target", "Proficiency & quality", "Sentiment + verbatims"], good: "Targets set per group before launch; 1-week SLA on soft signals", bad: "'Logins' as the only metric" },
  { id: "T13", name: "Benefits & Value Tracker", fam: "Value", sor: "Smartsheet + BI", owner: "Business owners", cad: "Monthly → quarterly post-G4", fields: ["Benefit verbatim from T02", "Baseline → target → date", "Leading indicator (what you steer by)", "Business owner + honest status"], good: "Opened live at SteerCo; write-offs said out loud", bad: "100% on-track until close, then forgotten" },
  { id: "T14", name: "Retro & Lessons Canvas", fam: "Deliver", sor: "Miro → Confluence", owner: "SM / PM", cad: "Per sprint → per phase", fields: ["Temperature 1–5 trend", "Keep / Change / Stop (mechanisms)", "ONE committed experiment", "Framework feedback → Council"], good: "Last experiment reviewed with data", bad: "5 actions per retro, zero done" },
  { id: "T15", name: "Feature / Epic One-Pager", fam: "Deliver", sor: "JIRA + Confluence", owner: "PO", cad: "Per epic", fields: ["User & problem with evidence", "Value hypothesis (magnitude + date)", "Acceptance criteria", "Instrumentation plan — no telemetry, no Done"], good: "Failed hypotheses retired out loud", bad: "Unfalsifiable hypotheses; 'as a user I want the feature'" },
  { id: "T16", name: "Discovery / Brainstorm Canvas", fam: "Deliver", sor: "Miro", owner: "Facilitator", cad: "Per session", fields: ["Framing question + pre-loaded context", "Silent diverge → cluster → vote", "Land: decisions + epic stubs", "48-hour rule to Confluence/JIRA"], good: "Quiet voices captured; boards archived", bad: "Eternal boards with 400 orphan stickies" },
  { id: "T17", name: "Closure & Handover Pack", fam: "Value", sor: "Confluence + PPT", owner: "PM", cad: "Once, at G4", fields: ["Outcomes vs charter — no laundering", "Value handover with signatures", "Risk & run transfer", "Lessons + team release & recognition"], good: "Business owner can run the next value review alone", bad: "Projects that fade instead of closing" },
];
const FAM_COLOR = { Govern: C.mul, Deliver: C.navy, Change: "#8A6200", Value: C.lime };

/* ================= RESOURCES HUB ================= */
const RES_INIT = { sub: "templates" };
function Resources() {
  const [sub, setSub] = useState(RES_INIT.sub);
  useEffect(() => { RES_INIT.sub = "templates"; }, []);
  const SUBS = [["templates", "Templates"], ["training", "Training"], ["playbook", "Playbook"], ["pmi", "PMI & AI Practice"], ["library", "Library & Links"]];
  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {SUBS.map(([id, l]) => (
          <button key={id} onClick={() => setSub(id)} style={{ border: `1px solid ${sub === id ? C.mul : C.line}`, background: sub === id ? C.mul : "#fff", color: sub === id ? "#fff" : C.mid, borderRadius: 99, padding: "8px 16px", fontFamily: DISP, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{l}</button>
        ))}
      </div>
      {sub === "templates" && <TemplatesCat />}
      {sub === "training" && <TrainingRes />}
      {sub === "playbook" && <Playbook />}
      {sub === "pmi" && <PmiRes />}
      {sub === "library" && <Library />}
    </div>
  );
}

function TemplatesCat() {
  const [q, setQ] = useState(""); const [fam, setFam] = useState("All"); const [open, setOpen] = useState(null);
  const fams = ["All", "Govern", "Deliver", "Change", "Value"];
  const list = TPL.filter(t => (fam === "All" || t.fam === fam) && (q === "" || (t.id + t.name + t.fields.join(" ")).toLowerCase().includes(q.toLowerCase())));
  return (
    <div>
      <Card style={{ marginBottom: 14, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search the 17 templates…" style={{ flex: "1 1 220px", border: `1px solid ${C.line}`, borderRadius: 8, padding: "9px 12px", fontSize: 13 }} />
        {fams.map(f => <button key={f} onClick={() => setFam(f)} style={{ border: `1px solid ${fam === f ? (FAM_COLOR[f] || C.mul) : C.line}`, background: fam === f ? (FAM_COLOR[f] || C.mul) : "#fff", color: fam === f ? "#fff" : C.mid, borderRadius: 99, padding: "6px 12px", fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}>{f}</button>)}
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(330px,1fr))", gap: 12 }}>
        {list.map(t => {
          const isOpen = open === t.id;
          return (
            <Card key={t.id} style={{ cursor: "pointer", borderTop: `3px solid ${FAM_COLOR[t.fam]}` }} onClick={() => setOpen(isOpen ? null : t.id)}>
              <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                <span style={{ fontFamily: MONO, fontSize: 11, color: FAM_COLOR[t.fam], fontWeight: 600 }}>{t.id}</span>
                <span style={{ fontFamily: DISP, fontWeight: 700, fontSize: 14.5 }}>{t.name}</span>
                <span style={{ marginLeft: "auto", color: C.faint }}>{isOpen ? "−" : "+"}</span>
              </div>
              <div style={{ display: "flex", gap: 6, margin: "7px 0", flexWrap: "wrap" }}>
                <Chip>{t.sor}</Chip><Chip>{t.cad}</Chip><Chip>{t.owner}</Chip>
              </div>
              {isOpen && (
                <div onClick={e => e.stopPropagation()}>
                  <ul style={{ margin: "8px 0 10px 18px", fontSize: 12.5 }}>{t.fields.map((f, i) => <li key={i} style={{ marginBottom: 3 }}>{f}</li>)}</ul>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 11.5 }}>
                    <div style={{ background: C.limeLt, borderRadius: 8, padding: "8px 11px" }}><b style={{ fontFamily: MONO, fontSize: 9, letterSpacing: ".1em", color: C.lime }}>GOOD</b><br />{t.good}</div>
                    <div style={{ background: "#F8E9E8", borderRadius: 8, padding: "8px 11px" }}><b style={{ fontFamily: MONO, fontSize: 9, letterSpacing: ".1em", color: C.red }}>RED FLAGS</b><br />{t.bad}</div>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
      <div style={{ fontSize: 11.5, color: C.faint, marginTop: 12 }}>Full field-by-field masters with worked examples live in the Template Pack (Library & Links). T01 and T04/T05 can be generated as branded PPT from your project data in the PPT Studio.</div>
    </div>
  );
}

function TrainingRes() {
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 14, marginBottom: 16 }}>
        {[
          ["L1 · FOUNDATION", C.navy, C.navyLt, "Know the system", "~3h self-serve · everyone", ["Five lessons + tool walkthroughs", "20-question quiz, pass ≥ 16", "Locate-the-artefact exercise", "Target: first 10 days"]],
          ["L2 · PRACTITIONER", C.mul, C.mulLt, "Run a project", "Half-day + applied · all PMs in 90 days", ["Tailoring on 3 real cases, defended", "SteerCo simulation under injects", "First project shadowed G1–G2", "Unlocks: gate chairing, tier proposals"]],
          ["L3 · COACH", "#8A6200", C.goldLt, "Tailor & teach", "Nomination · 2–3 per team", ["Facilitates day-30 config retros", "Anti-pattern clinic", "Framework Council seat", "Certifies Practitioners"]],
        ].map(([badge, col, bg, title, sub, items]) => (
          <Card key={badge}>
            <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: ".12em", background: bg, color: col, borderRadius: 99, padding: "4px 11px" }}>{badge}</span>
            <div style={{ fontFamily: DISP, fontWeight: 800, fontSize: 17, margin: "10px 0 2px" }}>{title}</div>
            <div style={{ fontSize: 11, fontStyle: "italic", color: C.mid, marginBottom: 8 }}>{sub}</div>
            <ul style={{ margin: "0 0 0 17px", fontSize: 12.5, color: C.mid }}>{items.map((x, i) => <li key={i} style={{ marginBottom: 4 }}>{x}</li>)}</ul>
          </Card>
        ))}
      </div>
      <Card>
        <SectionLabel>The 90-day runway — every new PM</SectionLabel>
        <div style={{ overflowX: "auto" }}><table style={{ borderCollapse: "collapse", width: "100%", fontSize: 12.5, minWidth: 560 }}>
          <tbody>
            {[["W1–2", "Foundation e-learning + quiz · shadow one ceremony in each active tier"],
              ["W3–4", "Project deep-read + state memo · Tailoring Engine run · configuration confirmed with D&C Director"],
              ["W5–8", "Own RAID & heartbeat · first T04 from systems of record · Practitioner workshop · first review chaired"],
              ["W9–13", "Decision log & stakeholder map owned · day-30 config retro on own project · certification panel + CoP lesson"]].map(([w, t]) => (
              <tr key={w}><td style={{ fontFamily: MONO, fontSize: 11, color: C.gold, padding: "8px 14px 8px 0", whiteSpace: "nowrap", verticalAlign: "top", fontWeight: 600 }}>{w}</td><td style={{ padding: "8px 0", borderBottom: `1px dashed ${C.soft}`, color: C.ink }}>{t}</td></tr>
            ))}
          </tbody>
        </table></div>
        <div style={{ fontSize: 11.5, color: C.faint, marginTop: 8 }}>The complete Academy — quiz bank with rationales, the three calibrated tailoring cases, the Helios SteerCo simulation and the facilitator annex — opens from Library & Links.</div>
      </Card>
    </div>
  );
}

/* ================= PROJECT DATA — key data entry ================= */
const KD_DEFAULT = { headline: "", milestone: "", milestoneDate: "", confidence: 80, risks: [], decisions: [], benefits: [] };
function ProjectData({ projects, project, setSel, update }) {
  if (!project) return <Card>Add a project in Portfolio first.</Card>;
  const kd = { ...KD_DEFAULT, ...(project.keydata || {}) };
  const setKd = patch => update(project.id, { keydata: { ...kd, ...patch } });
  const addRow = (k, row) => setKd({ [k]: [...kd[k], { id: uid(), ...row }] });
  const editRow = (k, id, patch) => setKd({ [k]: kd[k].map(r => r.id === id ? { ...r, ...patch } : r) });
  const delRow = (k, id) => setKd({ [k]: kd[k].filter(r => r.id !== id) });
  const inp = (v, on, ph, w) => <input value={v || ""} onChange={e => on(e.target.value)} placeholder={ph} style={{ flex: w ? `0 0 ${w}px` : 1, minWidth: 70, border: `1px solid ${C.soft}`, background: "#FBFAF8", borderRadius: 7, padding: "7px 9px", fontSize: 12 }} />;

  return (
    <div>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
        <ProjectPicker projects={projects} project={project} setSel={setSel} />
        <div style={{ fontSize: 12, color: C.faint }}>The governance data of record inside the Navigator. Everything here flows straight into the PPT Studio, the Review Pack and This Week.</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(330px,1fr))", gap: 14 }}>
        <Card style={{ gridColumn: "1/-1" }}>
          <SectionLabel>Status essentials → T04</SectionLabel>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <div style={{ flex: "2 1 320px" }}>
              <div style={{ fontSize: 11, color: C.faint, marginBottom: 3 }}>Headline — one sentence the sponsor can repeat verbatim</div>
              {inp(kd.headline, v => setKd({ headline: v }), "e.g. Re-sequenced plan holding; pilot telemetry live; one decision needed on market scope.")}
            </div>
            <div style={{ flex: "1 1 180px" }}>
              <div style={{ fontSize: 11, color: C.faint, marginBottom: 3 }}>Next milestone</div>
              {inp(kd.milestone, v => setKd({ milestone: v }), "e.g. Pilot live — Iberia")}
            </div>
            <div style={{ flex: "0 1 130px" }}>
              <div style={{ fontSize: 11, color: C.faint, marginBottom: 3 }}>Date</div>
              <input type="date" value={kd.milestoneDate || ""} onChange={e => setKd({ milestoneDate: e.target.value })} style={{ width: "100%", border: `1px solid ${C.soft}`, background: "#FBFAF8", borderRadius: 7, padding: "6px 8px", fontSize: 12 }} />
            </div>
            <div style={{ flex: "0 1 170px" }}>
              <div style={{ fontSize: 11, color: C.faint, marginBottom: 3 }}>Confidence {kd.confidence}%</div>
              <input type="range" min={10} max={100} step={5} value={kd.confidence} onChange={e => setKd({ confidence: +e.target.value })} style={{ width: "100%" }} />
            </div>
          </div>
        </Card>
        <Card>
          <SectionLabel color={C.red}>Top risks → T03 / T04</SectionLabel>
          {kd.risks.map(r => (
            <div key={r.id} style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center" }}>
              {inp(r.desc, v => editRow("risks", r.id, { desc: v }), "Because [cause], [event] → [impact]")}
              {inp(r.owner, v => editRow("risks", r.id, { owner: v }), "owner", 90)}
              {inp(r.due, v => editRow("risks", r.id, { due: v }), "due", 80)}
              <button onClick={() => delRow("risks", r.id)} style={{ border: "none", background: "transparent", color: C.faint, cursor: "pointer" }}>×</button>
            </div>
          ))}
          <button onClick={() => addRow("risks", { desc: "", owner: "", due: "" })} style={{ border: `1px dashed ${C.line}`, background: "#fff", color: C.mul, borderRadius: 8, padding: "7px 12px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>+ risk</button>
        </Card>
        <Card>
          <SectionLabel color={"#8A6200"}>Decisions needed / taken → T08</SectionLabel>
          {kd.decisions.map(d => (
            <div key={d.id} style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center" }}>
              {inp(d.text, v => editRow("decisions", d.id, { text: v }), "Decision, imperative")}
              {inp(d.owner, v => editRow("decisions", d.id, { owner: v }), "decider", 86)}
              <select value={d.status || "needed"} onChange={e => {
                const v = e.target.value;
                const nd = kd.decisions.map(r => r.id === d.id ? { ...r, status: v } : r);
                if (v === "taken" && d.status !== "taken") update(project.id, { keydata: { ...kd, decisions: nd }, events: evPush(project, mkEv("decision", `Decision taken: ${(d.text || "").slice(0, 80)}`, d.owner ? `Decision-maker: ${d.owner}` : "")) });
                else editRow("decisions", d.id, { status: v });
              }} style={{ border: `1px solid ${C.soft}`, borderRadius: 7, padding: "6px", fontSize: 11 }}>
                <option value="needed">needed</option><option value="taken">taken</option>
              </select>
              <button onClick={() => delRow("decisions", d.id)} style={{ border: "none", background: "transparent", color: C.faint, cursor: "pointer" }}>×</button>
            </div>
          ))}
          <button onClick={() => addRow("decisions", { text: "", owner: "", status: "needed" })} style={{ border: `1px dashed ${C.line}`, background: "#fff", color: C.mul, borderRadius: 8, padding: "7px 12px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>+ decision</button>
        </Card>
        <Card style={{ gridColumn: "1/-1" }}>
          <SectionLabel color={C.lime}>Benefits → T13</SectionLabel>
          {kd.benefits.map(b => (
            <div key={b.id} style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center", flexWrap: "wrap" }}>
              {inp(b.name, v => editRow("benefits", b.id, { name: v }), "Benefit statement (verbatim from T02)")}
              {inp(b.baseline, v => editRow("benefits", b.id, { baseline: v }), "baseline", 90)}
              {inp(b.target, v => editRow("benefits", b.id, { target: v }), "target + date", 120)}
              {inp(b.owner, v => editRow("benefits", b.id, { owner: v }), "business owner", 120)}
              <select value={b.status || "on track"} onChange={e => editRow("benefits", b.id, { status: e.target.value })} style={{ border: `1px solid ${C.soft}`, borderRadius: 7, padding: "6px", fontSize: 11 }}>
                {["on track", "at risk", "realised", "written off"].map(s => <option key={s}>{s}</option>)}
              </select>
              <button onClick={() => delRow("benefits", b.id)} style={{ border: "none", background: "transparent", color: C.faint, cursor: "pointer" }}>×</button>
            </div>
          ))}
          <button onClick={() => addRow("benefits", { name: "", baseline: "", target: "", owner: "", status: "on track" })} style={{ border: `1px dashed ${C.line}`, background: "#fff", color: C.lime, borderRadius: 8, padding: "7px 12px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>+ benefit</button>
        </Card>
      </div>
    </div>
  );
}

/* ================= WORKSPACE — mini Jira · Smartsheet · Confluence ================= */
const WCOLS = [["backlog", "Backlog"], ["doing", "In progress"], ["review", "In review"], ["done", "Done"]];
function Workspace({ projects, project, setSel, update }) {
  const [view, setView] = useState("board");
  const [planTime, setPlanTime] = useState(false);
  const [newCard, setNewCard] = useState("");
  const [pageSel, setPageSel] = useState(null);
  if (!project) return <Card>Add a project in Portfolio first.</Card>;
  const work = project.work || [], plan = project.plan || [], pages = project.pages || [];
  const setWork = w => update(project.id, { work: w });
  const setPlan = p => update(project.id, { plan: p });
  const setPages = p => update(project.id, { pages: p });
  const move = (id, dir) => setWork(work.map(c => {
    if (c.id !== id) return c;
    const i = WCOLS.findIndex(([k]) => k === c.col);
    const ni = Math.min(Math.max(i + dir, 0), WCOLS.length - 1);
    return { ...c, col: WCOLS[ni][0] };
  }));
  const donePct = work.length ? Math.round(work.filter(c => c.col === "done").length / work.length * 100) : null;
  const page = pages.find(p => p.id === pageSel);
  const inp = (v, on, ph, type = "text", w) => <input type={type} value={v || ""} onChange={e => on(e.target.value)} placeholder={ph} style={{ flex: w ? `0 0 ${w}px` : 1, minWidth: 70, border: `1px solid ${C.soft}`, background: "#FBFAF8", borderRadius: 7, padding: "7px 9px", fontSize: 12 }} />;

  return (
    <div>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
        <ProjectPicker projects={projects} project={project} setSel={setSel} />
        {donePct !== null && <Chip bg={C.navyLt} color={C.navy} style={{ fontSize: 11, padding: "5px 12px" }}>{donePct}% work done</Chip>}
        {plan.length > 0 && <Chip bg={C.goldLt} color={"#8A6200"} style={{ fontSize: 11, padding: "5px 12px" }}>{plan.filter(m => m.status !== "done").length} open milestones</Chip>}
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          {[["board", "Board"], ["plan", "Plan"], ["pages", "Pages"]].map(([id, l]) => (
            <button key={id} onClick={() => setView(id)} style={{ border: `1px solid ${view === id ? C.mul : C.line}`, background: view === id ? C.mul : "#fff", color: view === id ? "#fff" : C.mid, borderRadius: 99, padding: "7px 15px", fontFamily: DISP, fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>{l}</button>
          ))}
        </div>
      </div>
      <div style={{ fontSize: 11.5, color: C.faint, marginBottom: 12 }}>For portfolios under ~100 projects this workspace replaces the tool sprawl: Board = the work of record · Plan = the plan of record · Pages = the memory of record. One project, one place, zero duplicated truth.</div>

      {view === "board" && (
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
            <input value={newCard} onChange={e => setNewCard(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && newCard.trim()) { setWork([...work, { id: uid(), title: newCard.trim(), col: "backlog" }]); setNewCard(""); } }} placeholder="New work item — Enter to add to Backlog" style={{ flex: 1, minWidth: 220, border: `1px solid ${C.line}`, borderRadius: 8, padding: "10px 13px", fontSize: 13 }} />
            <label style={{ border: `1px solid ${C.navy}`, color: C.navy, background: "#fff", borderRadius: 8, padding: "10px 14px", fontSize: 12, fontFamily: DISP, fontWeight: 700, cursor: "pointer" }}>
              Import JIRA CSV ↑
              <input type="file" accept=".csv,text/csv" style={{ display: "none" }} onChange={e => {
                const f = e.target.files?.[0]; if (!f) return;
                Papa.parse(f, { header: true, skipEmptyLines: true, complete: res => {
                  try {
                    const REV = { "to do": "backlog", "open": "backlog", "backlog": "backlog", "in progress": "doing", "doing": "doing", "in review": "review", "review": "review", "done": "done", "closed": "done", "resolved": "done" };
                    const rows = res.data.map(r => {
                      const title = r.Summary || r.summary || r["Issue key"] || r.Title || "";
                      const st = String(r.Status || r.status || "").toLowerCase().trim();
                      return title ? { id: uid(), title: String(title).slice(0, 120), col: REV[st] || "backlog" } : null;
                    }).filter(Boolean);
                    if (rows.length) setWork([...work, ...rows]);
                    else alert("No rows with a Summary column found — export from JIRA with Summary and Status fields.");
                  } catch { alert("Couldn't parse that CSV."); }
                }});
                e.target.value = "";
              }} />
            </label>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 10 }}>
            {WCOLS.map(([k, label]) => (
              <div key={k} style={{ background: k === "done" ? C.limeLt : C.soft, borderRadius: 12, padding: 10, minHeight: 160 }}>
                <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: k === "done" ? C.lime : C.faint, margin: "2px 4px 8px" }}>{label} · {work.filter(c => c.col === k).length}</div>
                {work.filter(c => c.col === k).map(c => (
                  <div key={c.id} style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 9, padding: "9px 11px", marginBottom: 7, fontSize: 12.5 }}>
                    {c.title}
                    <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                      <button onClick={() => move(c.id, -1)} disabled={k === "backlog"} style={{ border: `1px solid ${C.soft}`, background: "#fff", borderRadius: 6, padding: "2px 8px", cursor: "pointer", color: C.mid, fontSize: 11 }}>◀</button>
                      <button onClick={() => move(c.id, 1)} disabled={k === "done"} style={{ border: `1px solid ${C.soft}`, background: "#fff", borderRadius: 6, padding: "2px 8px", cursor: "pointer", color: C.mid, fontSize: 11 }}>▶</button>
                      <button onClick={() => setWork(work.filter(x => x.id !== c.id))} style={{ marginLeft: "auto", border: "none", background: "transparent", color: C.faint, cursor: "pointer", fontSize: 12 }}>×</button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {view === "plan" && (
        <div>
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            {[["Table", false], ["Timeline", true]].map(([l, v]) => (
              <button key={l} onClick={() => setPlanTime(v)} style={{ border: `1px solid ${planTime === v ? C.navy : C.line}`, background: planTime === v ? C.navy : "#fff", color: planTime === v ? "#fff" : C.mid, borderRadius: 99, padding: "5px 14px", fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}>{l}</button>
            ))}
          </div>
          {planTime ? <PlanTimeline plan={plan} /> : (
        <Card>
          {[...plan].sort((a, b) => (a.due || "9999") < (b.due || "9999") ? -1 : 1).map(m => (
            <div key={m.id} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 7, flexWrap: "wrap" }}>
              {inp(m.name, v => setPlan(plan.map(x => x.id === m.id ? { ...x, name: v } : x)), "Milestone — an outcome, not an activity")}
              <input type="date" value={m.due || ""} onChange={e => setPlan(plan.map(x => x.id === m.id ? { ...x, due: e.target.value } : x))} style={{ border: `1px solid ${C.soft}`, background: "#FBFAF8", borderRadius: 7, padding: "6px 8px", fontSize: 12 }} />
              {inp(m.owner, v => setPlan(plan.map(x => x.id === m.id ? { ...x, owner: v } : x)), "owner", "text", 96)}
              <label style={{ display: "flex", gap: 5, alignItems: "center", fontSize: 11, color: C.mid }}>conf
                <input type="range" min={10} max={100} step={5} value={m.conf ?? 80} onChange={e => setPlan(plan.map(x => x.id === m.id ? { ...x, conf: +e.target.value } : x))} style={{ width: 80 }} />
                <span style={{ fontFamily: MONO, color: (m.conf ?? 80) < 60 ? C.red : C.mid }}>{m.conf ?? 80}%</span>
              </label>
              <select value={m.status || "open"} onChange={e => {
                const v = e.target.value;
                const np = plan.map(x => x.id === m.id ? { ...x, status: v } : x);
                if (v === "done" && m.status !== "done") update(project.id, { plan: np, events: evPush(project, mkEv(/^G\d/.test(m.name || "") ? "gate" : "artefact", `Milestone done: ${m.name || "(untitled)"}`, m.due ? `Due ${m.due} · confidence ${m.conf ?? 80}%` : "")) });
                else setPlan(np);
              }} style={{ border: `1px solid ${C.soft}`, borderRadius: 7, padding: "6px", fontSize: 11 }}>
                <option value="open">open</option><option value="done">done</option>
              </select>
              <button onClick={() => setPlan(plan.filter(x => x.id !== m.id))} style={{ border: "none", background: "transparent", color: C.faint, cursor: "pointer" }}>×</button>
            </div>
          ))}
          <button onClick={() => setPlan([...plan, { id: uid(), name: "", due: "", conf: 80, status: "open" }])} style={{ border: `1px dashed ${C.line}`, background: "#fff", color: C.mul, borderRadius: 8, padding: "8px 14px", fontSize: 12.5, cursor: "pointer", fontWeight: 600 }}>+ milestone</button>
          <div style={{ fontSize: 11, color: C.faint, marginTop: 10 }}>Milestones with confidence under 60% show red — those are the rows your next status report leads with.</div>
        </Card>
          )}
        </div>
      )}

      {view === "pages" && (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(180px,0.6fr) minmax(280px,1.4fr)", gap: 14, alignItems: "start" }}>
          <Card style={{ padding: 12 }}>
            <button onClick={() => { const np = { id: uid(), title: "Untitled page", body: "", updated: today() }; setPages([np, ...pages]); setPageSel(np.id); }} style={{ width: "100%", border: `1px dashed ${C.line}`, background: "#fff", color: C.mul, borderRadius: 8, padding: "9px", fontSize: 12.5, cursor: "pointer", fontWeight: 600, marginBottom: 10 }}>+ new page</button>
            {pages.map(pg => (
              <div key={pg.id} onClick={() => setPageSel(pg.id)} style={{ padding: "8px 10px", borderRadius: 8, cursor: "pointer", background: pageSel === pg.id ? C.mulLt : "transparent", marginBottom: 3 }}>
                <div style={{ fontFamily: DISP, fontWeight: 600, fontSize: 12.5 }}>{pg.title || "Untitled"}</div>
                <div style={{ fontFamily: MONO, fontSize: 9.5, color: C.faint }}>{pg.updated}</div>
              </div>
            ))}
            {pages.length === 0 && <div style={{ fontSize: 12, color: C.faint }}>Charter notes, meeting notes, impact assessments — the memory of record lives here.</div>}
          </Card>
          {page ? (
            <Card>
              <input value={page.title} onChange={e => setPages(pages.map(x => x.id === page.id ? { ...x, title: e.target.value, updated: today() } : x))} style={{ width: "100%", border: "none", fontFamily: DISP, fontWeight: 800, fontSize: 19, marginBottom: 8, outline: "none", color: C.ink }} />
              <textarea value={page.body} onChange={e => setPages(pages.map(x => x.id === page.id ? { ...x, body: e.target.value, updated: today() } : x))} rows={14} placeholder="Write — it saves as you type. A decision in these notes isn't real until it's also a row in Project Data → Decisions." style={{ width: "100%", border: `1px solid ${C.soft}`, background: "#FBFAF8", borderRadius: 10, padding: "12px 14px", fontSize: 13, lineHeight: 1.6 }} />
              <button onClick={() => { setPages(pages.filter(x => x.id !== page.id)); setPageSel(null); }} style={{ marginTop: 8, border: "none", background: "transparent", color: C.red, fontSize: 11.5, cursor: "pointer" }}>delete page</button>
            </Card>
          ) : <Card style={{ color: C.mid, fontSize: 13 }}>Select or create a page.</Card>}
        </div>
      )}
    </div>
  );
}

/* ================= PPT STUDIO — AZ-branded generation in the browser ================= */
let _pptxPromise = null;
function loadPptx() {
  if (window.PptxGenJS) return Promise.resolve(window.PptxGenJS);
  if (_pptxPromise) return _pptxPromise;
  _pptxPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/PptxGenJS/3.12.0/pptxgen.bundle.js";
    s.onload = () => window.PptxGenJS ? resolve(window.PptxGenJS) : reject(new Error("PptxGenJS not found after load"));
    s.onerror = () => reject(new Error("Could not load PptxGenJS from cdnjs"));
    document.head.appendChild(s);
  });
  return _pptxPromise;
}
const AZ = { mul: "830051", gold: "F0AB00", graph: "3F4444", mid: "6B6B6B", line: "D5D5D5", soft: "F4F1EF",
  green: "2E7D32", amber: "C77800", red: "B3261E", greenLt: "E8F2E9", amberLt: "FBF0DC", redLt: "F8E9E8" };

function azFrame(pptx, s, eyebrow, titleA, titleB, project) {
  s.background = { color: "FFFFFF" };
  s.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: 13.33, h: 0.16, fill: { color: AZ.mul } });
  s.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 7.34, w: 13.33, h: 0.16, fill: { color: AZ.mul } });
  s.addText("AstraZeneca", { x: 0.55, y: 0.3, w: 3, h: 0.32, fontFace: "Calibri", fontSize: 14, bold: true, color: AZ.mul });
  s.addText(eyebrow.toUpperCase(), { x: 0.55, y: 0.78, w: 9, h: 0.26, fontFace: "Arial", fontSize: 10, bold: true, color: AZ.graph, charSpacing: 3 });
  s.addText([
    { text: titleA + " ", options: { color: AZ.graph } },
    { text: titleB, options: { color: AZ.mul } },
  ], { x: 0.52, y: 1.0, w: 9.6, h: 0.62, fontFace: "Arial", fontSize: 27, bold: true });
  s.addShape(pptx.shapes.RECTANGLE, { x: 0.57, y: 1.66, w: 0.62, h: 0.05, fill: { color: AZ.gold } });
  s.addText([
    { text: `${project.name} · ${project.code}`, options: { bold: true, color: AZ.graph, breakLine: true } },
    { text: `Tier ${project.tier} · ${project.phase} · ${today()}`, options: { color: AZ.mid, fontSize: 9.5 } },
  ], { x: 9.7, y: 0.78, w: 3.1, h: 0.6, fontFace: "Calibri", fontSize: 11, align: "right" });
  s.addText("Generated by DCOS Navigator — review and sign before circulation", { x: 0.55, y: 7.02, w: 7, h: 0.24, fontFace: "Calibri", fontSize: 8.5, italic: true, color: AZ.mid });
}
const ragHex = v => v === "G" ? [AZ.greenLt, AZ.green, "GREEN"] : v === "A" ? [AZ.amberLt, AZ.amber, "AMBER"] : [AZ.redLt, AZ.red, "RED"];

function buildT04(pptx, p) {
  const kd = { ...KD_DEFAULT, ...(p.keydata || {}) };
  const s = pptx.addSlide();
  azFrame(pptx, s, "T04 · Status report — assembled from the Navigator", "Status", "report", p);
  s.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.55, y: 1.92, w: 12.23, h: 0.72, rectRadius: 0.06, fill: { color: "F6E9F1" } });
  s.addText([
    { text: "HEADLINE   ", options: { fontFace: "Arial", fontSize: 9, bold: true, color: AZ.mul, charSpacing: 2 } },
    { text: kd.headline || "— add a headline in Project Data —", options: { fontFace: "Calibri", fontSize: 12.5, italic: !kd.headline, color: kd.headline ? "1C2222" : AZ.mid } },
  ], { x: 0.8, y: 2.1, w: 11.7, h: 0.4 });
  RAG_DIMS.forEach((d, i) => {
    const [bg, fg, lbl] = ragHex(p.rag?.[d] || "G");
    const x = 0.55 + i * 2.52;
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x, y: 2.85, w: 2.32, h: 0.95, rectRadius: 0.06, fill: { color: bg } });
    s.addText(d, { x: x + 0.14, y: 2.95, w: 2.05, h: 0.26, fontFace: "Arial", fontSize: 10.5, bold: true, color: "1C2222" });
    s.addText(lbl, { x: x + 0.14, y: 3.24, w: 2.05, h: 0.34, fontFace: "Arial", fontSize: 13, bold: true, color: fg });
  });
  s.addText("TOP RISKS — from Project Data", { x: 0.55, y: 4.05, w: 5.8, h: 0.24, fontFace: "Arial", fontSize: 9, bold: true, color: AZ.mul, charSpacing: 1.5 });
  const risks = kd.risks.slice(0, 3);
  (risks.length ? risks : [{ desc: "— add risks in Project Data —" }]).forEach((r, i) => {
    s.addText([
      { text: "• ", options: { color: AZ.mul, bold: true } },
      { text: r.desc || "(empty)", options: { color: "1C2222" } },
      { text: r.owner ? `  — ${r.owner}${r.due ? ", due " + r.due : ""}` : "", options: { color: AZ.mid, fontSize: 9.5 } },
    ], { x: 0.6, y: 4.34 + i * 0.45, w: 5.9, h: 0.42, fontFace: "Calibri", fontSize: 11 });
  });
  s.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 6.75, y: 4.0, w: 6.03, h: 1.85, rectRadius: 0.06, fill: { color: "FDF3DC" } });
  s.addText("DECISIONS NEEDED", { x: 6.95, y: 4.12, w: 5.6, h: 0.24, fontFace: "Arial", fontSize: 9, bold: true, color: "8A6200", charSpacing: 1.5 });
  const dn = kd.decisions.filter(d => d.status !== "taken").slice(0, 3);
  (dn.length ? dn : [{ text: "— none open: an empty box is a statement —" }]).forEach((d, i) => {
    s.addText([
      { text: `D${i + 1}  `, options: { fontFace: "Courier New", fontSize: 9.5, bold: true, color: "8A6200" } },
      { text: d.text || "(empty)", options: { color: "1C2222" } },
      { text: d.owner ? `  — ${d.owner}` : "", options: { color: AZ.mid, fontSize: 9.5 } },
    ], { x: 6.95, y: 4.42 + i * 0.44, w: 5.65, h: 0.4, fontFace: "Calibri", fontSize: 11 });
  });
  s.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.55, y: 6.05, w: 12.23, h: 0.72, rectRadius: 0.06, fill: { color: "E7EEF4" } });
  s.addText([
    { text: "LOOK-AHEAD   ", options: { fontFace: "Arial", fontSize: 9, bold: true, color: "003865", charSpacing: 2 } },
    { text: `Next milestone: ${kd.milestone || "—"}${kd.milestoneDate ? " — " + kd.milestoneDate : ""} — confidence ${kd.confidence}%`, options: { fontFace: "Calibri", fontSize: 12, color: "1C2222" } },
  ], { x: 0.8, y: 6.24, w: 11.7, h: 0.4 });
}
function buildT01(pptx, p) {
  const cv = p.canvas || {};
  const s = pptx.addSlide();
  azFrame(pptx, s, "T01 · Project charter — drafted from the Delivery Canvas", "Project", "charter", p);
  const box = (x, y, w, h, label, text, accent = AZ.mul) => {
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.06, fill: { color: "FFFFFF" }, line: { color: AZ.line, width: 0.75 } });
    s.addText(label.toUpperCase(), { x: x + 0.16, y: y + 0.1, w: w - 0.3, h: 0.24, fontFace: "Arial", fontSize: 8.5, bold: true, color: accent, charSpacing: 1.5 });
    s.addText(text || "— complete in the Delivery Canvas —", { x: x + 0.16, y: y + 0.36, w: w - 0.32, h: h - 0.48, fontFace: "Calibri", fontSize: 10, color: text ? "1C2222" : AZ.mid, italic: !text, valign: "top" });
  };
  box(0.55, 1.92, 6.0, 1.45, "Problem", cv.problem);
  box(0.55, 3.5, 6.0, 1.45, "Outcome & success measures (→ T13)", cv.outcome, "8A9900");
  box(0.55, 5.08, 6.0, 1.6, "Scope & edges", cv.solution, "003865");
  box(6.75, 1.92, 6.08, 1.45, "Users & stakeholders", cv.users, "003865");
  box(6.75, 3.5, 6.08, 1.45, "Value hypothesis", cv.hypothesis, "8A9900");
  box(6.75, 5.08, 6.08, 0.95, "Top risks & dependencies (→ RAID)", cv.risks, "B3261E");
  s.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 6.75, y: 6.14, w: 6.08, h: 0.56, rectRadius: 0.06, fill: { color: "F6E9F1" } });
  s.addText(`Tier ${p.tier} · signatures: Sponsor ____  Sr. Director ____  PM ____`, { x: 6.95, y: 6.27, w: 5.7, h: 0.32, fontFace: "Calibri", fontSize: 9.5, color: AZ.mul, bold: true });
}
function buildT05(pptx, p) {
  buildT04(pptx, p);
  const kd = { ...KD_DEFAULT, ...(p.keydata || {}) };
  // slide 2: decisions
  let s = pptx.addSlide();
  azFrame(pptx, s, "T05 · SteerCo — slide 2", "Decisions requested", "today", p);
  const rows = [[
    { text: "#", options: { fill: { color: AZ.graph }, color: "FFFFFF", bold: true, fontFace: "Arial", fontSize: 10 } },
    { text: "Decision", options: { fill: { color: AZ.graph }, color: "FFFFFF", bold: true, fontFace: "Arial", fontSize: 10 } },
    { text: "Decision-maker", options: { fill: { color: AZ.graph }, color: "FFFFFF", bold: true, fontFace: "Arial", fontSize: 10 } },
    { text: "Status", options: { fill: { color: AZ.graph }, color: "FFFFFF", bold: true, fontFace: "Arial", fontSize: 10 } },
  ]];
  (kd.decisions.length ? kd.decisions : [{ text: "— add decisions in Project Data —", owner: "", status: "" }]).slice(0, 6).forEach((d, i) => {
    rows.push([
      { text: "D" + (i + 1), options: { fontFace: "Courier New", fontSize: 10, color: "8A6200", bold: true } },
      { text: d.text || "", options: { fontFace: "Calibri", fontSize: 11 } },
      { text: d.owner || "", options: { fontFace: "Calibri", fontSize: 11 } },
      { text: d.status || "", options: { fontFace: "Calibri", fontSize: 11, color: d.status === "taken" ? AZ.green : AZ.amber } },
    ]);
  });
  s.addTable(rows, { x: 0.55, y: 2.0, w: 12.23, colW: [0.7, 7.6, 2.4, 1.53], border: { pt: 0.5, color: AZ.line }, rowH: 0.5, valign: "middle", margin: 0.06 });
  // slide 3: value
  s = pptx.addSlide();
  azFrame(pptx, s, "T05 · SteerCo — slide 3", "Value tracker", "extract", p);
  const vrows = [[
    { text: "Benefit", options: { fill: { color: AZ.graph }, color: "FFFFFF", bold: true, fontFace: "Arial", fontSize: 10 } },
    { text: "Baseline", options: { fill: { color: AZ.graph }, color: "FFFFFF", bold: true, fontFace: "Arial", fontSize: 10 } },
    { text: "Target", options: { fill: { color: AZ.graph }, color: "FFFFFF", bold: true, fontFace: "Arial", fontSize: 10 } },
    { text: "Owner (business)", options: { fill: { color: AZ.graph }, color: "FFFFFF", bold: true, fontFace: "Arial", fontSize: 10 } },
    { text: "Status", options: { fill: { color: AZ.graph }, color: "FFFFFF", bold: true, fontFace: "Arial", fontSize: 10 } },
  ]];
  (kd.benefits.length ? kd.benefits : [{ name: "— add benefits in Project Data —" }]).slice(0, 6).forEach(b => {
    const col = b.status === "at risk" ? AZ.red : b.status === "realised" ? AZ.green : "1C2222";
    vrows.push([
      { text: b.name || "", options: { fontFace: "Calibri", fontSize: 11 } },
      { text: b.baseline || "", options: { fontFace: "Calibri", fontSize: 11 } },
      { text: b.target || "", options: { fontFace: "Calibri", fontSize: 11 } },
      { text: b.owner || "", options: { fontFace: "Calibri", fontSize: 11 } },
      { text: b.status || "", options: { fontFace: "Calibri", fontSize: 11, bold: true, color: col } },
    ]);
  });
  s.addTable(vrows, { x: 0.55, y: 2.0, w: 12.23, colW: [5.2, 1.8, 2.0, 2.0, 1.23], border: { pt: 0.5, color: AZ.line }, rowH: 0.5, valign: "middle", margin: 0.06 });
  // slide 4: plan & milestones
  s = pptx.addSlide();
  azFrame(pptx, s, "T05 · SteerCo — slide 4", "Plan &", "milestones", p);
  const plan = [...(p.plan || [])].sort((a, b) => (a.due || "9999") < (b.due || "9999") ? -1 : 1);
  const ph = ["Milestone (outcome)", "Due", "Owner", "Confidence", "Status"].map(t => ({ text: t, options: { fill: { color: AZ.graph }, color: "FFFFFF", bold: true, fontFace: "Arial", fontSize: 10 } }));
  const prows = [ph];
  (plan.length ? plan : [{ name: "— add milestones in Workspace › Plan —" }]).slice(0, 8).forEach(m => {
    const conf = m.conf ?? 80;
    prows.push([
      { text: m.name || "", options: { fontFace: "Calibri", fontSize: 11 } },
      { text: m.due || "", options: { fontFace: "Calibri", fontSize: 11 } },
      { text: m.owner || "", options: { fontFace: "Calibri", fontSize: 11 } },
      { text: m.name ? conf + "%" : "", options: { fontFace: "Calibri", fontSize: 11, bold: true, color: conf < 60 ? AZ.red : conf < 80 ? AZ.amber : AZ.green } },
      { text: m.status || "", options: { fontFace: "Calibri", fontSize: 11, color: m.status === "done" ? AZ.green : "1C2222" } },
    ]);
  });
  s.addTable(prows, { x: 0.55, y: 2.0, w: 12.23, colW: [5.6, 1.6, 2.0, 1.6, 1.43], border: { pt: 0.5, color: AZ.line }, rowH: 0.48, valign: "middle", margin: 0.06 });
  s.addText("Baseline locked at gates — any re-baseline carries a T08 entry. Confidence comes from the plan of record, not from optimism in the room.", { x: 0.55, y: 6.5, w: 12.2, h: 0.35, fontFace: "Calibri", fontSize: 10, italic: true, color: AZ.mid });
  // slide 5: risks & escalations
  s = pptx.addSlide();
  azFrame(pptx, s, "T05 · SteerCo — slide 5", "Risks &", "escalations", p);
  const risks5 = (kd.risks || []).slice(0, 4);
  if (risks5.length === 0) {
    s.addText("No escalated risks this cycle — this slide saying so is itself the signal, and the meeting shortens.", { x: 0.55, y: 2.4, w: 11, h: 0.5, fontFace: "Calibri", fontSize: 13, italic: true, color: AZ.mid });
  } else {
    risks5.forEach((r, i) => {
      const y = 2.0 + i * 1.15;
      s.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.55, y, w: 12.23, h: 1.0, rectRadius: 0.06, fill: { color: i === 0 ? AZ.redLt : "FFFFFF" }, line: { color: AZ.line, width: 0.75 } });
      s.addText([
        { text: `R${i + 1}  `, options: { fontFace: "Courier New", fontSize: 11, bold: true, color: AZ.red } },
        { text: r.desc || "", options: { fontFace: "Calibri", fontSize: 11.5, color: "1C2222" } },
      ], { x: 0.78, y: y + 0.12, w: 11.7, h: 0.42 });
      s.addText(`Owner: ${r.owner || "—"}   ·   mitigation due: ${r.due || "—"}   ·   bring options + recommendation, never the problem alone`, { x: 0.78, y: y + 0.55, w: 11.7, h: 0.32, fontFace: "Calibri", fontSize: 9.5, color: AZ.mid });
    });
  }
}

function PptStudio({ projects, project, setSel, update }) {
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState(null);
  if (!project) return <Card>Add a project in Portfolio first.</Card>;
  const kd = { ...KD_DEFAULT, ...(project.keydata || {}) };
  const cv = project.canvas || {};
  const gen = async (kind) => {
    setErr(null); setBusy(kind);
    try {
      const PptxGenJS = await loadPptx();
      const pptx = new PptxGenJS();
      pptx.layout = "LAYOUT_WIDE";
      pptx.author = "DCOS Navigator";
      if (kind === "t04") buildT04(pptx, project);
      if (kind === "t01") buildT01(pptx, project);
      if (kind === "t05") buildT05(pptx, project);
      await pptx.writeFile({ fileName: `${project.code}_${kind.toUpperCase()}_${today()}.pptx` });
      if (update) update(project.id, { events: evPush(project, mkEv("forum", `${kind.toUpperCase()} generated from the Studio`, "AZ-branded draft — review and sign before circulation")) });
    } catch (e) { setErr("PPT engine couldn't load in this environment (" + e.message + "). In the corporate deployment this runs locally — meanwhile your data is safe in Project Data and exportable as JSON."); }
    setBusy(null);
  };
  const ready = {
    t04: !!kd.headline || kd.risks.length || kd.decisions.length,
    t01: !!(cv.problem || cv.outcome || cv.hypothesis),
    t05: kd.decisions.length || kd.benefits.length,
  };
  const DOCS = [
    ["t04", "Status Report — T04", "One AZ-branded slide: headline, RAG strip with your live dots, top risks, decisions needed, look-ahead.", "Feeds from: Portfolio RAG + Project Data"],
    ["t05", "SteerCo pack — T05 (5 slides)", "The T04, decisions requested, value tracker, plan & milestones, and risks & escalations. The rule of eight, started for you.", "Feeds from: Project Data + Workspace Plan"],
    ["t01", "Charter — T01", "One-page charter on the AZ master, drafted from your Delivery Canvas boxes, signature line included.", "Feeds from: Delivery Canvas"],
  ];
  return (
    <div>
      <Card style={{ marginBottom: 14, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <ProjectPicker projects={projects} project={project} setSel={setSel} />
        <div style={{ fontSize: 12.5, color: C.mid }}>Fill once in the app — generate the deck on the official mulberry/gold master with one click. The PM still reviews and signs: the Studio drafts, certified humans dispose.</div>
      </Card>
      {err && <Card style={{ borderLeft: `4px solid ${C.red}`, background: "#F8E9E8", marginBottom: 14, fontSize: 12.5 }}>{err}</Card>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 14 }}>
        {DOCS.map(([k, name, desc, feeds]) => (
          <Card key={k} style={{ borderTop: `3px solid ${C.mul}`, display: "flex", flexDirection: "column" }}>
            <div style={{ fontFamily: DISP, fontWeight: 800, fontSize: 16 }}>{name}</div>
            <div style={{ fontSize: 12.5, color: C.mid, margin: "6px 0 8px", flex: 1 }}>{desc}</div>
            <div style={{ fontFamily: MONO, fontSize: 10, color: C.faint, marginBottom: 10 }}>{feeds}</div>
            {!ready[k] && <div style={{ fontSize: 11, color: "#8A6200", background: C.goldLt, borderRadius: 8, padding: "6px 10px", marginBottom: 8 }}>No data yet — it will generate with placeholders. Fill {k === "t01" ? "the Delivery Canvas" : "Project Data"} first for a real draft.</div>}
            <button onClick={() => gen(k)} disabled={busy !== null} style={{ background: busy === k ? C.faint : C.mul, color: "#fff", border: "none", borderRadius: 9, padding: "11px 0", fontFamily: DISP, fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}>
              {busy === k ? "Generating…" : "Generate PPTX ↓"}
            </button>
          </Card>
        ))}
      </div>
      <ExportTools project={project} />
      <Card style={{ marginTop: 16, fontSize: 12, color: C.mid }}>
        <b style={{ fontFamily: DISP, color: C.ink }}>How this scales in the corporate deployment:</b> the same builders run server-side behind SSO, pull live from Smartsheet/JIRA via the Agent Blueprint connectors instead of Project Data, and AG-01 pre-fills the headline candidates. The locked masters (Governance & Working Master in the Library) remain the layout contract.
      </Card>
    </div>
  );
}

/* ================= PLAN TIMELINE (mini-Gantt) ================= */
function PlanTimeline({ plan }) {
  const dated = [...plan].filter(m => m.due).sort((a, b) => a.due < b.due ? -1 : 1);
  if (dated.length === 0) return <Card style={{ color: C.mid, fontSize: 13 }}>Add milestones with due dates in the Table view to see the timeline.</Card>;
  const D = s => new Date(s + "T00:00:00").getTime();
  const DAY = 86400000;
  const min = Math.min(D(dated[0].due), Date.now()) - 14 * DAY;
  const max = Math.max(...dated.map(m => D(m.due))) + 21 * DAY;
  const W = 920, LW = 215, RW = W - LW - 20, RH = 34, H = dated.length * RH + 52;
  const X = t => LW + ((t - min) / (max - min)) * RW;
  // month ticks
  const ticks = [];
  const t0 = new Date(min); t0.setDate(1);
  for (let d = new Date(t0); d.getTime() < max; d.setMonth(d.getMonth() + 1)) ticks.push(new Date(d));
  return (
    <Card style={{ overflowX: "auto" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", minWidth: 720, fontFamily: BODY }} role="img" aria-label="Milestone timeline">
        {ticks.map((d, i) => (
          <g key={i}>
            <line x1={X(d.getTime())} y1={26} x2={X(d.getTime())} y2={H - 8} stroke={C.soft} />
            <text x={X(d.getTime()) + 4} y={18} fontSize="10" fill={C.faint} fontFamily={MONO}>{MONTHS[d.getMonth()]} {String(d.getFullYear()).slice(2)}</text>
          </g>
        ))}
        <line x1={X(Date.now())} y1={26} x2={X(Date.now())} y2={H - 8} stroke={C.gold} strokeWidth="2" strokeDasharray="5 4" />
        <text x={X(Date.now()) + 4} y={H - 12} fontSize="9.5" fill={"#8A6200"} fontFamily={MONO}>today</text>
        {dated.map((m, i) => {
          const y = 40 + i * RH;
          const start = i === 0 ? min + 7 * DAY : D(dated[i - 1].due);
          const conf = m.conf ?? 80;
          const col = m.status === "done" ? C.lime : conf < 60 ? C.red : conf < 80 ? C.amber : C.navy;
          const late = m.status !== "done" && D(m.due) < Date.now();
          return (
            <g key={m.id}>
              <text x={0} y={y + 4} fontSize="11.5" fill={C.ink} fontWeight="600" fontFamily={DISP}>{(m.name || "Untitled").slice(0, 30)}</text>
              <rect x={X(start)} y={y - 7} width={Math.max(X(D(m.due)) - X(start), 4)} height={14} rx={7} fill={col} opacity={m.status === "done" ? 0.45 : 0.22} />
              <path d={`M ${X(D(m.due))} ${y - 9} l 9 9 l -9 9 l -9 -9 Z`} fill={col} />
              <text x={X(D(m.due)) + 13} y={y + 4} fontSize="9.5" fill={late ? C.red : C.faint} fontFamily={MONO}>{m.due.slice(5)}{m.status === "done" ? " ✓" : ` · ${conf}%`}{late ? " · late" : ""}</text>
            </g>
          );
        })}
      </svg>
      <div style={{ fontSize: 11, color: C.faint }}>Bars cascade from the previous milestone — the diamond is the commitment. Colour: navy ≥80% confidence · amber 60–79 · red &lt;60 · green done. The dashed gold line is today.</div>
    </Card>
  );
}

/* ================= EXPORT TO TOOLS ================= */
function dl(name, content, mime = "text/plain") {
  try {
    const blob = new Blob([content], { type: mime + ";charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = name; a.click();
    URL.revokeObjectURL(a.href);
  } catch (e) { console.error(e); }
}
const csv = rows => rows.map(r => r.map(x => `"${String(x ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n");

function ExportTools({ project }) {
  const kd = { ...KD_DEFAULT, ...(project.keydata || {}) };
  const cv = project.canvas || {};
  const work = project.work || [], plan = project.plan || [], pages = project.pages || [];
  const code = project.code;
  const STATUS_MAP = { backlog: "To Do", doing: "In Progress", review: "In Review", done: "Done" };

  const jiraCsv = () => dl(`${code}_jira_import.csv`, csv([
    ["Summary", "Issue Type", "Status", "Description", "Labels"],
    [`${project.name} — delivery epic`, "Epic", "To Do", `Tier ${project.tier} · ${project.phase}. Charter: ${cv.problem || ""}`, "dcos"],
    ...work.map(c => [c.title, "Task", STATUS_MAP[c.col] || "To Do", "", "dcos"]),
  ]), "text/csv");

  const ssPlanCsv = () => dl(`${code}_smartsheet_plan.csv`, csv([
    ["Task Name", "Due Date", "Owner", "Confidence %", "Status", "Portfolio Flag"],
    ...plan.map(m => [m.name, m.due, m.owner || "", m.conf ?? 80, m.status || "open", "Yes"]),
  ]), "text/csv");

  const ssRaidCsv = () => dl(`${code}_smartsheet_raid.csv`, csv([
    ["ID", "Type", "Description (cause→event→impact)", "Owner", "Mitigation Due", "Status", "Escalated"],
    ...kd.risks.map((r, i) => [`R-${String(i + 1).padStart(3, "0")}`, "Risk", r.desc, r.owner || "", r.due || "", "Open", i === 0 && kd.risks.length ? "Yes" : "No"]),
  ]), "text/csv");

  const confluenceMd = () => {
    let md = `# ${project.name} (${code})\n\n**Tier ${project.tier}** · Phase: ${project.phase} · Exported ${today()} from DCOS Navigator\n\n`;
    if (project.hypothesis?.text) md += `> **Configuration hypothesis.** ${project.hypothesis.text}\n\n`;
    md += `## Charter (T01)\n\n`;
    CANVAS_BOXES.forEach(b => { if (cv[b.id]) md += `### ${b.title}\n${cv[b.id]}\n\n`; });
    md += `## Decision Log (T08)\n\n| ID | Decision | Decision-maker | Status |\n|---|---|---|---|\n`;
    kd.decisions.forEach((d, i) => { md += `| D-${String(i + 1).padStart(2, "0")} | ${d.text} | ${d.owner || ""} | ${d.status || "needed"} |\n`; });
    md += `\n## Benefits (T13)\n\n| Benefit | Baseline | Target | Owner | Status |\n|---|---|---|---|---|\n`;
    kd.benefits.forEach(b => { md += `| ${b.name} | ${b.baseline || ""} | ${b.target || ""} | ${b.owner || ""} | ${b.status || ""} |\n`; });
    if (pages.length) { md += `\n## Pages\n\n`; pages.forEach(pg => { md += `### ${pg.title} _(updated ${pg.updated})_\n\n${pg.body}\n\n---\n\n`; }); }
    dl(`${code}_confluence.md`, md, "text/markdown");
  };

  const EXPORTS = [
    ["JIRA — work items", "CSV in JIRA's import format: one epic + your board cards mapped to To Do / In Progress / In Review / Done. Import via JIRA › External System Import.", jiraCsv, work.length],
    ["Smartsheet — plan", "Milestones with due date, owner, confidence and portfolio flag, matching the T06 sheet columns of the DCOS workspace template.", ssPlanCsv, plan.length],
    ["Smartsheet — RAID", "Risk rows with cause→event→impact, owner and mitigation date, ready for the T03 sheet.", ssRaidCsv, kd.risks.length],
    ["Confluence — project space", "Markdown of the full memory of record: charter from the Canvas, decision log, benefits and all your Pages. Paste into Confluence or import via markdown.", confluenceMd, 1],
  ];
  return (
    <div style={{ marginTop: 18 }}>
      <SectionLabel color={C.navy}>Export to corporate tools — same data, their formats</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 12 }}>
        {EXPORTS.map(([name, desc, fn, n]) => (
          <Card key={name} style={{ borderTop: `3px solid ${C.navy}`, display: "flex", flexDirection: "column", padding: 16 }}>
            <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 14 }}>{name}</div>
            <div style={{ fontSize: 11.5, color: C.mid, margin: "5px 0 10px", flex: 1 }}>{desc}</div>
            <button onClick={fn} style={{ background: C.navy, color: "#fff", border: "none", borderRadius: 8, padding: "9px 0", fontFamily: DISP, fontWeight: 700, fontSize: 12.5, cursor: "pointer", opacity: n ? 1 : 0.55 }}>{n ? "Download ↓" : "Download (empty) ↓"}</button>
          </Card>
        ))}
      </div>
      <div style={{ fontSize: 11, color: C.faint, marginTop: 8 }}>One-way by design in this version: the Navigator drafts, the corporate tool becomes the system of record on import. In the deployment, the Agent Blueprint connectors make this live and two-way.</div>
    </div>
  );
}

/* ================= NEW PROJECT WIZARD ================= */
const WIZ_TYPES = [
  ["build", "Tech / platform build", "Invest early in the board standard (T07) and a Definition of Done with telemetry — integration risk is your critical path."],
  ["ai", "Analytics / AI product", "Value instrumentation IS the project: every epic's T15 hypothesis is the control mechanism. AI-governance classification at G1, evidence at G2/G3."],
  ["process", "Process / ways-of-working change", "Run the change stream at Tier-A intensity whatever the delivery tier. T10 impact assessment before any design freeze."],
  ["rollout", "Rollout / deployment", "Solution known: ceremony light, change heavy. The readiness gate (G3) is the real gate — the Change Lead holds it."],
  ["vendor", "Vendor / procurement-led", "Dependency governance from day one: vendor milestones in YOUR plan with counterpart owners; commercial escalation path agreed at G1."],
  ["poc", "Exploration / proof of concept", "Cap at ~90 days. Success is a decision, not a product — pre-agree the kill criteria inside the hypothesis."],
];
const WIZ_QS = [
  ["Delivery uncertainty — how well do we know the solution?", ["Known solution", "Partly known", "Exploratory / novel"]],
  ["Regulatory / compliance exposure (GxP, AI Act, promotional)", ["None", "Moderate", "High / validated"]],
  ["Team size & distribution", ["≤5, co-located", "6–15, mixed", "15+, multi-country / vendors"]],
  ["Stakeholder complexity", ["Single function", "Cross-functional", "Cross-market / external"]],
  ["Duration & spend", ["< 3 months", "3–9 months", "> 9 months / major"]],
  ["Change impact on end users", ["Minimal / back-office", "New ways of working for one group", "Behavioural change at scale"]],
];
const WIZ_XTRA = [
  ["vendorDep", "Vendor dependency on the critical path?", ["None", "Supporting", "Critical-path"]],
  ["markets", "Markets / geographies in scope", ["One", "2–5", "6+"]],
  ["sensitive", "Sensitive data or AI-governance touchpoints?", ["No", "Yes"]],
];
function wizTier(a) {
  const score = a.reduce((s, v) => s + v, 0), unc = a[0], reg = a[1];
  let t; if (score <= 3) t = "D"; else if (score >= 9 && unc === 2) t = "A"; else if (unc <= 1 && (reg === 2 || score >= 7)) t = "C"; else t = "B";
  return { t, score };
}
const TIER_CAD = { A: "Sprint-end status · biweekly demos & retros · monthly SteerCo", B: "Biweekly status & demos · monthly retro · monthly SteerCo + gates", C: "Weekly status · biweekly CCB · monthly SteerCo + gate boards", D: "Biweekly check-in · monthly one-pager · quarterly sponsor review" };

function Wizard({ onClose, onCreate }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [type, setType] = useState(null);
  const [ans, setAns] = useState([null, null, null, null, null, null]);
  const [xtra, setXtra] = useState({ vendorDep: null, markets: null, sensitive: null });
  const done6 = ans.every(v => v !== null);
  const { t: tier, score } = done6 ? wizTier(ans) : { t: null, score: 0 };
  const typeObj = WIZ_TYPES.find(x => x[0] === type);

  const advice = [];
  if (done6) {
    if (typeObj) advice.push([typeObj[1], typeObj[2]]);
    if (xtra.vendorDep === 2) advice.push(["Critical vendor", "Add vendor governance: their milestones in your plan with counterpart owners; key-person risk seeded in RAID; Sr. Director ↔ account-exec escalation path."]);
    if (xtra.markets === 2) advice.push(["6+ markets", "Stakeholder map per market cluster; comms via local leaders as senders (T11); readiness gates per wave, not one big bang."]);
    if (xtra.markets === 1) advice.push(["Multi-market", "One stakeholder map with market lanes; sequence waves and reuse wave-1 lessons in wave-2 training."]);
    if (xtra.sensitive === 1) advice.push(["Sensitive / AI governance", "Compliance evidence attaches at G2/G3 — tiering reduces ceremony, never evidence. Book the governance-gateway review now, not at launch."]);
    if (ans[5] >= 1 && (tier === "C" || tier === "D")) advice.push(["Change > tier", "Delivery tier is light but user change is real: run T10/T11/T12 at full intensity regardless."]);
    if (type === "poc" && (tier === "C")) advice.push(["POC tension", "Profile points to plan-driven control but the work is exploratory — challenge the inputs, or split discovery (Tier B, 90 days) from the build decision."]);
    if (type === "ai") advice.push(["CPMAI lens (PMI)", "Run the AI lifecycle as iterative CPMAI phases — business understanding → data understanding → data preparation → modelling → evaluation → operationalisation — inside the DCOS gates. AI projects are data projects first: budget data understanding/prep as real backlog, not as a surprise."]);
    if (type === "ai") advice.push(["Go/no-go per phase", "Each CPMAI phase ends with a go/no-go against the value hypothesis (T15). Killing at data-understanding is a cheap success; killing at operationalisation is an expensive lesson."]);
  }
  const hypothesis = done6 ? `We believe Tier ${tier} (${TIERS[tier]}; ${TIER_CAD[tier].toLowerCase()}) will deliver predictable delivery and decision-ready governance for ${name || "this project"}, because the profile scores ${score}/12 with uncertainty ${ans[0]} and regulatory exposure ${ans[1]}. We will know we are wrong if a pivot trigger fires before the day-30 retro: two consecutive red cycles · ceremony attendance < 70% · rework > 20% · adoption indicator off-track at first release.` : "";

  const create = () => {
    const id = uid();
    const wk = [];
    const addW = t2 => wk.push({ id: uid(), title: t2, col: "backlog" });
    addW("Draft charter (T01) + sign at G1"); addW("Seed RAID (T03) with top 3 risks"); addW("Stakeholder map & stance plan (T09)"); addW("Book the day-30 configuration retro (T14)");
    if (tier === "A" || tier === "B") addW("Stand up board to T07 standard (DoR/DoD with telemetry)");
    if (ans[5] >= 1) addW("Change Impact Assessment (T10) before G2");
    if (xtra.vendorDep === 2) addW("Vendor governance: counterpart owners + escalation path");
    if (type === "ai" || xtra.sensitive === 1) addW("AI/compliance governance-gateway classification");
    if (type === "ai") { addW("CPMAI 1–2: business + data understanding (sources, quality, access)"); addW("CPMAI 3: data preparation spike — estimate before committing"); addW("CPMAI 5: evaluation criteria & acceptance thresholds (pre-agreed)"); addW("CPMAI 6: operationalisation plan — MLOps, monitoring, model drift"); }
    if (type === "poc") addW("Write kill criteria + decision date into the hypothesis");
    const weeks = ans[4] === 0 ? 10 : ans[4] === 1 ? 26 : 40;
    const dAt = w2 => new Date(Date.now() + w2 * 7 * 86400000).toISOString().slice(0, 10);
    const plan = [
      { id: uid(), name: "G1 — charter signed, tier confirmed", due: dAt(3), conf: 90, status: "open", owner: "PM" },
      { id: uid(), name: "G2 — mobilised, impact assessed", due: dAt(Math.round(weeks * 0.25)), conf: 80, status: "open", owner: "PM" },
      { id: uid(), name: "G3 — readiness gate", due: dAt(Math.round(weeks * 0.8)), conf: 70, status: "open", owner: "Change Lead" },
      { id: uid(), name: "G4 — closure & value handover", due: dAt(weeks), conf: 70, status: "open", owner: "Sponsor" },
    ];
    const risks = xtra.vendorDep === 2 ? [{ id: uid(), desc: "Because a critical-path vendor carries single-team capacity, a slip on their side may delay our integration milestone, leading to multi-week impact on go-live.", owner: "PM", due: dAt(4) }] : [];
    onCreate({
      id, name: name.trim() || "New project", code: "OBU-" + Math.floor(100 + Math.random() * 900), tier, phase: "Frame",
      value: 5, effort: ans[4] + ans[2] + 3, rag: Object.fromEntries(RAG_DIMS.map(d => [d, "G"])),
      wsjf: { bv: 5, tc: 5, rr: 5, size: [2, 5, 8][ans[4]] }, health: {}, canvas: {}, work: wk, plan, pages: [],
      keydata: { ...KD_DEFAULT, risks }, ptype: type, hypothesis: { text: hypothesis, score, date: today(), answers: ans, xtra },
      events: [mkEv("gate", `Project framed — Tier ${tier} hypothesis written`, hypothesis.slice(0, 180) + "…")],
    });
  };

  const Opt = ({ sel, on, children }) => (
    <button onClick={on} style={{ border: `1px solid ${sel ? C.mul : C.line}`, background: sel ? C.mul : "#fff", color: sel ? "#fff" : C.mid, borderRadius: 99, padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{children}</button>
  );
  const steps = ["Basics", "Tailoring profile", "Complexity", "Configuration"];
  const canNext = step === 0 ? (name.trim() && type) : step === 1 ? done6 : true;

  return (
    <Card style={{ marginBottom: 18, border: `2px solid ${C.gold}`, position: "relative" }}>
      <button onClick={onClose} style={{ position: "absolute", top: 12, right: 14, border: "none", background: "transparent", color: C.faint, fontSize: 18, cursor: "pointer" }}>×</button>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
        <span style={{ fontFamily: DISP, fontWeight: 800, fontSize: 18 }}>New project wizard</span>
        {steps.map((s2, i) => (
          <span key={s2} style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".06em", textTransform: "uppercase", padding: "4px 10px", borderRadius: 99, background: i === step ? C.mul : i < step ? C.mulLt : C.soft, color: i === step ? "#fff" : i < step ? C.mul : C.faint }}>{i + 1} {s2}</span>
        ))}
      </div>

      {step === 0 && (
        <div>
          <div style={{ fontSize: 12.5, color: C.mid, marginBottom: 10 }}>The wizard adapts the project-management configuration to what you're actually running — type and complexity first, ceremony later.</div>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Project name" style={{ width: "100%", border: `1px solid ${C.line}`, borderRadius: 9, padding: "11px 13px", fontSize: 14, marginBottom: 12, fontFamily: DISP, fontWeight: 600 }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 8 }}>
            {WIZ_TYPES.map(([id, label, hint]) => (
              <div key={id} onClick={() => setType(id)} style={{ border: `1.5px solid ${type === id ? C.mul : C.line}`, background: type === id ? C.mulLt : "#fff", borderRadius: 10, padding: "11px 13px", cursor: "pointer" }}>
                <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 13 }}>{label}</div>
                <div style={{ fontSize: 10.5, color: C.faint, marginTop: 2 }}>{hint.split(":")[0].split("—")[0].slice(0, 70)}…</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 1 && (
        <div>
          <div style={{ fontSize: 12.5, color: C.mid, marginBottom: 12 }}>The six DCOS tailoring questions — risk and uncertainty set the configuration, not preference. Score each 0–2.</div>
          {WIZ_QS.map(([q, opts], qi) => (
            <div key={qi} style={{ marginBottom: 12 }}>
              <div style={{ fontFamily: DISP, fontWeight: 600, fontSize: 13, marginBottom: 5 }}>{qi + 1} · {q}</div>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                {opts.map((o, oi) => <Opt key={oi} sel={ans[qi] === oi} on={() => setAns(a => a.map((v, i) => i === qi ? oi : v))}>{o}</Opt>)}
              </div>
            </div>
          ))}
        </div>
      )}

      {step === 2 && (
        <div>
          <div style={{ fontSize: 12.5, color: C.mid, marginBottom: 12 }}>Complexity modifiers — these don't change the tier; they change what the tier must contain.</div>
          {WIZ_XTRA.map(([k, q, opts]) => (
            <div key={k} style={{ marginBottom: 12 }}>
              <div style={{ fontFamily: DISP, fontWeight: 600, fontSize: 13, marginBottom: 5 }}>{q}</div>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                {opts.map((o, oi) => <Opt key={oi} sel={xtra[k] === oi} on={() => setXtra(x => ({ ...x, [k]: oi }))}>{o}</Opt>)}
              </div>
            </div>
          ))}
        </div>
      )}

      {step === 3 && done6 && (
        <div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
            <span style={{ fontFamily: DISP, fontWeight: 800, fontSize: 22, color: C.mul }}>Tier {tier} — {TIERS[tier]}</span>
            <Chip bg={C.goldLt} color={"#8A6200"} style={{ fontSize: 11, padding: "5px 12px" }}>profile {score}/12</Chip>
            <Chip bg={C.navyLt} color={C.navy} style={{ fontSize: 11, padding: "5px 12px" }}>{TIER_CAD[tier]}</Chip>
          </div>
          <div style={{ borderLeft: `3px solid ${C.mul}`, background: C.mulLt, borderRadius: "0 10px 10px 0", padding: "12px 16px", fontSize: 12.5, fontStyle: "italic", marginBottom: 14 }}>{hypothesis}</div>
          {advice.length > 0 && <SectionLabel color={"#8A6200"}>Configuration notes for this project's shape</SectionLabel>}
          {advice.map(([h, t2], i) => (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, fontSize: 12.5 }}>
              <span style={{ fontFamily: MONO, fontSize: 10, color: C.gold, fontWeight: 600, minWidth: 110, paddingTop: 2, textTransform: "uppercase", letterSpacing: ".04em" }}>{h}</span>
              <span style={{ color: C.ink }}>{t2}</span>
            </div>
          ))}
          <div style={{ fontSize: 12, color: C.mid, marginTop: 12 }}>On create, the wizard seeds: <b>Workspace board</b> (mobilisation backlog), <b>Plan</b> (G1–G4 with rough dates from your duration), <b>RAID</b> (vendor risk if critical), and stores the hypothesis for the day-30 retro. Then export any of it to JIRA / Smartsheet / Confluence from the Studio.</div>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        {step > 0 && <button onClick={() => setStep(s2 => s2 - 1)} style={{ border: `1px solid ${C.line}`, background: "#fff", borderRadius: 9, padding: "10px 18px", fontFamily: DISP, fontWeight: 700, fontSize: 13, cursor: "pointer", color: C.mid }}>‹ Back</button>}
        {step < 3 && <button onClick={() => canNext && setStep(s2 => s2 + 1)} style={{ marginLeft: "auto", background: canNext ? C.mul : C.soft, color: canNext ? "#fff" : C.faint, border: "none", borderRadius: 9, padding: "10px 22px", fontFamily: DISP, fontWeight: 700, fontSize: 13, cursor: canNext ? "pointer" : "default" }}>Next ›</button>}
        {step === 3 && <button onClick={create} style={{ marginLeft: "auto", background: C.gold, color: C.ink, border: "none", borderRadius: 9, padding: "11px 24px", fontFamily: DISP, fontWeight: 800, fontSize: 14, cursor: "pointer" }}>Create project ✦</button>}
      </div>
    </Card>
  );
}

/* ================= PMI & AI PRACTICE (PMBOK · CPMAI · GenAI in PM) ================= */
const PMBOK_MAP = [
  ["Value", "Every epic carries a falsifiable hypothesis (T15); benefits owned business-side and tracked past closure (T13). Value review is a standing forum, not an audit."],
  ["Stakeholders", "Power/interest with stance deltas and dated actions (T09); leaders — not the project — as senders (T11)."],
  ["Tailoring", "The Tailoring Engine and the wizard: risk and uncertainty set the configuration, tested as a hypothesis at day 30. PMBOK's tailoring principle, made mechanical."],
  ["Systems thinking & complexity", "Complexity modifiers change what the tier must contain, not the tier itself; cross-project patterns surface via the RAID miner and the Council."],
  ["Risk", "Cause→event→impact RAID with dated mitigations; escalations always as options + recommendation; opportunity framing welcome in the same log."],
  ["Quality & delivery performance", "Definition of Done includes documentation and telemetry; flow metrics (velocity, cycle time, blocked-aging) comparable portfolio-wide via the T07 standard."],
  ["Adaptability & change", "Pivot triggers and tier changes at sprint/month boundaries via T08; the framework itself versions through one channel (Council)."],
  ["Leadership & team", "Altitude separation (Sr. Director / D&C Director / PM); decision rights by reversibility class; capacity and morale are Health Scan dimensions, not afterthoughts."],
  ["Stewardship", "Honest reporting as a system property; closure with no narrative laundering; accountability stays with named people — including over AI drafts."],
];
const PD_MAP = [
  ["Stakeholder", "T09 + Engagement plan", "Canvas · Project Data"],
  ["Team", "Capacity & morale dimensions", "Health Scan"],
  ["Development approach & life cycle", "Tier A–D over the same G0–G4 gates", "Wizard · Governance Year"],
  ["Planning", "Outcome milestones with confidence; baselines locked at gates", "Workspace Plan · Gantt"],
  ["Project work", "Board standard, WIP visibility, ceremonies that earn their slot", "Workspace Board · This Week"],
  ["Delivery", "DoR/DoD with telemetry; value validated per release", "Project Data · T15"],
  ["Measurement", "RAG with trend, leading indicators, adoption beside budget", "Portfolio · Review Pack"],
  ["Uncertainty", "RAID + tier hypothesis + pivot triggers", "Review Pack retro radar"],
];
const CPMAI_PHASES = [
  ["I · Business understanding", "Which decision or workflow improves, for whom, by how much — the T15 hypothesis is the CPMAI business case in miniature.", "Go/no-go: is there a measurable business outcome at all?"],
  ["II · Data understanding", "Sources, quality, access rights, representativeness. The phase most often skipped — and the cheapest place to kill a doomed project.", "Go/no-go: does usable data exist with lawful access?"],
  ["III · Data preparation", "Typically the bulk of real effort. Plan it as visible backlog with its own spike-based estimate, never as 'setup'.", "Go/no-go: is prep cost still smaller than the value at stake?"],
  ["IV · Modelling", "Iterative builds against the evaluation criteria — short loops, versioned experiments, no heroics.", "Go/no-go: does any model beat the baseline/heuristic?"],
  ["V · Evaluation", "Against pre-agreed acceptance thresholds AND business fit — accuracy without adoption is a demo.", "Go/no-go: do thresholds + user validation pass?"],
  ["VI · Operationalisation", "MLOps, monitoring, drift detection, retraining cadence, human-in-the-loop design. This is where T12 adoption discipline takes over.", "Go/no-go: can we run, watch and retrain it sustainably?"],
];
function PmiRes() {
  const [sec, setSec] = useState("pmbok");
  return (
    <div>
      <Card style={{ marginBottom: 14 }}>
        <div style={{ fontFamily: DISP, fontWeight: 800, fontSize: 18 }}>PMI practice, wired into DCOS</div>
        <div style={{ fontSize: 12.5, color: C.mid }}>How the framework implements PMBOK's principles and performance domains, how PMI's CPMAI lifecycle governs AI projects inside our gates, and where GenAI assists the PM without taking the accountability. Use it for certification study and for defending the framework upward.</div>
        <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
          {[["pmbok", "PMBOK principles"], ["domains", "Performance domains"], ["cpmai", "CPMAI — AI projects"], ["genai", "GenAI in PM"]].map(([id, l]) => (
            <button key={id} onClick={() => setSec(id)} style={{ border: `1px solid ${sec === id ? C.mul : C.line}`, background: sec === id ? C.mul : "#fff", color: sec === id ? "#fff" : C.mid, borderRadius: 99, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{l}</button>
          ))}
        </div>
      </Card>

      {sec === "pmbok" && (
        <Card>
          <SectionLabel>PMBOK principles → the DCOS mechanism that delivers each one</SectionLabel>
          {PMBOK_MAP.map(([pr, how]) => (
            <div key={pr} style={{ display: "flex", gap: 14, padding: "9px 0", borderBottom: `1px dashed ${C.soft}`, fontSize: 12.5 }}>
              <span style={{ fontFamily: DISP, fontWeight: 700, minWidth: 200, color: C.mul }}>{pr}</span>
              <span style={{ color: C.ink }}>{how}</span>
            </div>
          ))}
          <div style={{ fontSize: 11.5, color: C.faint, marginTop: 10 }}>Exam angle: when a question asks "what should the PM do first?", the DCOS answer is almost always the PMBOK answer — check the charter/hypothesis, consult the log, engage the stakeholder, escalate with options.</div>
        </Card>
      )}

      {sec === "domains" && (
        <Card style={{ padding: 0, overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 640, fontSize: 12.5 }}>
            <thead><tr>{["Performance domain", "DCOS implementation", "Where in the Navigator"].map(h => <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontFamily: DISP, fontSize: 11, color: "#fff", background: C.graph }}>{h}</th>)}</tr></thead>
            <tbody>{PD_MAP.map(([d, i, w]) => (
              <tr key={d}>
                <td style={{ padding: "9px 14px", fontFamily: DISP, fontWeight: 700, borderTop: `1px solid ${C.soft}`, whiteSpace: "nowrap" }}>{d}</td>
                <td style={{ padding: "9px 14px", borderTop: `1px solid ${C.soft}`, color: C.ink }}>{i}</td>
                <td style={{ padding: "9px 14px", borderTop: `1px solid ${C.soft}`, fontFamily: MONO, fontSize: 11, color: C.navy, whiteSpace: "nowrap" }}>{w}</td>
              </tr>
            ))}</tbody>
          </table>
        </Card>
      )}

      {sec === "cpmai" && (
        <div>
          <Card style={{ marginBottom: 12, borderLeft: `4px solid ${C.mul}`, background: C.mulLt }}>
            <div style={{ fontSize: 13 }}><b style={{ fontFamily: DISP }}>The CPMAI doctrine in one line:</b> AI projects are data projects run iteratively — most failures come from skipping straight to modelling, treating it as classic software, or operationalising without monitoring. Each phase ends in a go/no-go against the value hypothesis; in DCOS the phases live inside the Deliver stage, between G2 and G3.</div>
          </Card>
          {CPMAI_PHASES.map(([ph, desc, gate], i) => (
            <Card key={ph} style={{ marginBottom: 10, display: "flex", gap: 14, alignItems: "flex-start", borderTop: `3px solid ${i <= 2 ? C.navy : C.mul}` }}>
              <div style={{ fontFamily: DISP, fontWeight: 800, fontSize: 15, minWidth: 220 }}>{ph}</div>
              <div style={{ flex: 1, fontSize: 12.5, color: C.ink }}>{desc}
                <div style={{ fontFamily: MONO, fontSize: 10.5, color: "#8A6200", marginTop: 5 }}>{gate}</div>
              </div>
            </Card>
          ))}
          <div style={{ fontSize: 11.5, color: C.faint }}>The wizard seeds these phases as board items for any "Analytics / AI product" project. Tier B is the natural home: CPMAI iterations inside a gated envelope.</div>
        </div>
      )}

      {sec === "genai" && (
        <Card>
          <SectionLabel color={C.navy}>GenAI-augmented project management — PMI-aligned, DCOS-governed</SectionLabel>
          {[
            ["Draft, don't decide", "AI drafts status reports, risk statements, decision-log entries and meeting summaries (our AG-01/AG-03). The PM sets the RAG and writes the headline — judgement is the PM's product, and the PM's name goes on the artefact."],
            ["Mine, don't monitor blindly", "Pattern detection across RAID logs and flow data (AG-02) surfaces what humans miss across projects; every surfaced signal still needs a human-owned action with a date."],
            ["Ask, don't search", "A grounded copilot over the framework and project memory (AG-04) collapses onboarding time — answers always link back to the system of record."],
            ["Guard the calibration", "Automation bias is the certification-grade risk: seeded-error drills in Practitioner training, accuracy sampling per cycle, and 'AI-drafted, unconfirmed' banners until a certified human signs."],
            ["Govern like everything else", "Agents enter through the Framework Council intake with scoped identities and audit (Agent Blueprint); the metric is hours returned to PMs, never sophistication."],
          ].map(([h, t]) => (
            <div key={h} style={{ display: "flex", gap: 14, padding: "9px 0", borderBottom: `1px dashed ${C.soft}`, fontSize: 12.5 }}>
              <span style={{ fontFamily: DISP, fontWeight: 700, minWidth: 190, color: C.navy }}>{h}</span>
              <span style={{ color: C.ink }}>{t}</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

/* ---- tiny sparkline ---- */
function Spark({ data }) {
  const w = 64, h = 20, n = data.length;
  const pts = data.map((v, i) => `${(i / (n - 1)) * (w - 4) + 2},${h - 2 - (v / 100) * (h - 4)}`).join(" ");
  const up = data[n - 1] >= data[0];
  return (
    <svg width={w} height={h} style={{ verticalAlign: "middle" }} aria-label="health trend">
      <polyline points={pts} fill="none" stroke={up ? C.lime : C.red} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts.split(" ").pop().split(",")[0]} cy={pts.split(" ").pop().split(",")[1]} r="2.4" fill={up ? C.lime : C.red} />
    </svg>
  );
}

/* ================= TIMELINE HUB — real projects + demo ================= */
function TimelineHub({ projects }) {
  const [mode, setMode] = useState(projects.some(p => (p.events || []).length) ? "mine" : "demo");
  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {[["mine", "My projects — live ledger"], ["demo", "Demo — three model projects"]].map(([id, l]) => (
          <button key={id} onClick={() => setMode(id)} style={{ border: `1px solid ${mode === id ? C.mul : C.line}`, background: mode === id ? C.mul : "#fff", color: mode === id ? "#fff" : C.mid, borderRadius: 99, padding: "8px 16px", fontFamily: DISP, fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>{l}</button>
        ))}
      </div>
      {mode === "demo" ? <TimelineDemo /> : <MyTimeline projects={projects} />}
    </div>
  );
}

function MyTimeline({ projects }) {
  const withEv = projects.filter(p => (p.events || []).length);
  const [pid, setPid] = useState(withEv[0]?.id || projects[0]?.id || null);
  const [typ, setTyp] = useState("All");
  const [selEv, setSelEv] = useState(null);
  const proj = projects.find(p => p.id === pid);
  if (!proj) return <Card style={{ color: C.mid }}>Add a project first — every meaningful action then writes itself into the ledger.</Card>;
  const events = [...(proj.events || [])].sort((a, b) => (b.ts || 0) - (a.ts || 0)).filter(e => typ === "All" || e.type === typ);
  const months = Array.from(new Set(events.map(e => e.date.slice(0, 7))));
  const fmt = m => MONTHS[+m.slice(5, 7) - 1] + " " + m.slice(0, 4);
  return (
    <div>
      <Card style={{ marginBottom: 14 }}>
        <div style={{ fontFamily: DISP, fontWeight: 800, fontSize: 18 }}>The project's own ledger — provenance, not memory</div>
        <div style={{ fontSize: 12.5, color: C.mid }}>The Navigator writes the timeline as you work: RAG changes, gates and milestones done, decisions taken, snapshots, retros, generated decks. This is the audit-and-handover trail a new PM, an auditor or the Senior Director reads — no reconstruction, no recollection.</div>
      </Card>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12, alignItems: "center" }}>
        <select value={pid || ""} onChange={e => { setPid(e.target.value); setSelEv(null); }} style={{ fontFamily: DISP, fontWeight: 700, fontSize: 14, border: `1px solid ${C.line}`, borderRadius: 8, padding: "8px 12px", background: "#fff", cursor: "pointer" }}>
          {projects.map(p => <option key={p.id} value={p.id}>{p.code} · {p.name} ({(p.events || []).length} events)</option>)}
        </select>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["All", ...Object.keys(EV_TYPES)].map(t2 => (
            <button key={t2} onClick={() => setTyp(t2)} style={{ border: `1px solid ${typ === t2 ? C.mul : C.line}`, background: typ === t2 ? C.mul : "#fff", color: typ === t2 ? "#fff" : C.mid, borderRadius: 99, padding: "5px 11px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>{t2 === "All" ? "All" : EV_TYPES[t2].label}</button>
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(300px,1.15fr) minmax(260px,0.85fr)", gap: 16, alignItems: "start" }}>
        <div>
          {events.length === 0 && <Card style={{ color: C.mid, fontSize: 13 }}>No events yet{typ !== "All" ? " of that type" : ""}. Click a RAG dot, complete a milestone, take a decision or save a health snapshot — the ledger starts writing itself.</Card>}
          {months.map(m => (
            <div key={m}>
              <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: ".12em", textTransform: "uppercase", color: C.faint, margin: "14px 0 8px" }}>{fmt(m)}</div>
              {events.filter(e => e.date.startsWith(m)).map((e, i) => {
                const t2 = EV_TYPES[e.type] || EV_TYPES.artefact, isSel = selEv === e;
                return (
                  <div key={i} onClick={() => setSelEv(isSel ? null : e)} style={{ display: "flex", gap: 12, cursor: "pointer", padding: "9px 12px", borderRadius: 10, background: isSel ? C.mulLt : "#fff", border: `1px solid ${isSel ? "#E3BBD3" : C.line}`, marginBottom: 8, alignItems: "flex-start" }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, color: C.faint, minWidth: 38, paddingTop: 3 }}>{e.date.slice(8)} {MONTHS[+e.date.slice(5, 7) - 1]}</span>
                    <span style={{ background: t2.color, color: t2.text, fontFamily: MONO, fontSize: 9, letterSpacing: ".06em", textTransform: "uppercase", borderRadius: 99, padding: "3px 8px", whiteSpace: "nowrap", marginTop: 1 }}>{t2.label}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 13 }}>{e.title}</div>
                      {!isSel && e.detail && <div style={{ fontSize: 11.5, color: C.faint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 420 }}>{e.detail}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div style={{ position: "sticky", top: 14 }}>
          {selEv ? (
            <Card>
              <Chip bg={(EV_TYPES[selEv.type] || EV_TYPES.artefact).color} color={(EV_TYPES[selEv.type] || EV_TYPES.artefact).text}>{(EV_TYPES[selEv.type] || EV_TYPES.artefact).label}</Chip>
              <div style={{ fontFamily: DISP, fontWeight: 800, fontSize: 16, margin: "8px 0 2px" }}>{selEv.title}</div>
              <div style={{ fontFamily: MONO, fontSize: 10.5, color: C.faint, marginBottom: 10 }}>{selEv.date} · {proj.name}</div>
              {selEv.detail && <p style={{ fontSize: 13, color: C.ink }}>{selEv.detail}</p>}
              <div style={{ fontSize: 11, color: C.faint, marginTop: 8 }}>In the corporate deployment this event links to its Confluence page / Smartsheet row / JIRA issue via the Agent Blueprint connectors — the demo tab shows that experience.</div>
            </Card>
          ) : (
            <Card style={{ color: C.mid, fontSize: 13 }}>
              <b style={{ fontFamily: DISP, color: C.ink }}>{(proj.events || []).length} events on the ledger.</b><br /><br />
              Click any event for detail. Everything is generated by your own actions in the cockpit — provenance by construction, exported with the project in any JSON backup.
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================= ADVISOR — embedded AI (Claude) with rules fallback ================= */
function advisorContext(projects, project, scope) {
  const slim = p => ({
    name: p.name, tier: p.tier, phase: p.phase, rag: p.rag,
    health: healthScore(p.health),
    weakDims: ALL_DIMS.filter(d => (p.health?.[d.id] ?? 0) > 0 && p.health[d.id] <= 2).map(d => d.label),
    wsjf: +wsjfScore(p.wsjf).toFixed(1),
    headline: p.keydata?.headline || null,
    risks: (p.keydata?.risks || []).map(r => ({ desc: r.desc, owner: r.owner || null, due: r.due || null })),
    decisionsOpen: (p.keydata?.decisions || []).filter(d => d.status !== "taken").map(d => d.text),
    benefits: (p.keydata?.benefits || []).map(b => ({ name: b.name, status: b.status })),
    milestones: (p.plan || []).filter(m => m.status !== "done").slice(0, 6).map(m => ({ name: m.name, due: m.due, conf: m.conf ?? 80 })),
    hypothesisAgeDays: p.hypothesis?.text && !p.hypothesis.retroDone ? Math.floor((Date.now() - new Date(p.hypothesis.date + "T00:00:00").getTime()) / 86400000) : null,
    recentEvents: (p.events || []).slice(-8).map(e => `${e.date} ${e.type}: ${e.title}`),
  });
  return scope === "portfolio" ? { portfolio: projects.map(slim) } : { project: slim(project) };
}

const ADVISOR_ACTIONS = [
  ["briefing", "Portfolio briefing", "portfolio", "AG-01/02 preview", "Three-paragraph Senior Director briefing: overall shape, the 2–3 projects needing attention and why, and the decisions the Portfolio Review should take."],
  ["headline", "Status headline drafts", "project", "AG-01 preview", "Three candidate T04 headlines for the selected project — one neutral, one risk-forward, one value-forward. The PM picks and owns it."],
  ["riskscan", "Risk pattern scan", "portfolio", "AG-02 preview", "Hygiene and pattern findings across all RAID data: undated mitigations, ownerless risks, aging hypotheses, repeated themes."],
  ["retro", "Day-30 retro coach", "project", "Coach assist", "A facilitation brief for this project's configuration retro: the hypothesis re-read, evidence questions per pivot trigger, and the decision frame."],
];

function ruleFallback(action, ctx) {
  const L = [];
  if (action === "briefing") {
    const ps = ctx.portfolio;
    const reds = ps.filter(p => Object.values(p.rag || {}).includes("R"));
    const lowH = ps.filter(p => p.health !== null && p.health < 55);
    const retros = ps.filter(p => p.hypothesisAgeDays >= 25);
    L.push(`PORTFOLIO BRIEFING (rules-based — AI engine unavailable in this environment)\n`);
    L.push(`Shape: ${ps.length} projects. ${reds.length} with a RED dimension, ${lowH.length} below 55 health, ${retros.length} with a day-30 retro overdue.`);
    reds.forEach(p => L.push(`• ${p.name}: RED on ${Object.entries(p.rag).filter(([, v]) => v === "R").map(([k]) => k).join(", ")} — expect an escalation with options at the next SteerCo.`));
    lowH.forEach(p => L.push(`• ${p.name}: health ${p.health}/100${p.weakDims.length ? ` (weak: ${p.weakDims.join(", ")})` : ""} — pair the PM with a Coach this cycle.`));
    retros.forEach(p => L.push(`• ${p.name}: tier hypothesis ${p.hypothesisAgeDays} days old without its retro — schedule before the Portfolio Review.`));
    if (!reds.length && !lowH.length && !retros.length) L.push("Nothing flagged — verify the scans are current rather than celebrating yet.");
  }
  if (action === "headline") {
    const p = ctx.project;
    const amber = Object.entries(p.rag || {}).filter(([, v]) => v !== "G").map(([k]) => k);
    const m = p.milestones[0];
    L.push(`HEADLINE CANDIDATES (rules-based)\n`);
    L.push(`1 · Neutral: "${p.name} progressing in ${p.phase}; ${m ? `next milestone ${m.name} (${m.conf}% confidence)` : "milestones on plan"}; ${p.decisionsOpen.length ? p.decisionsOpen.length + " decision(s) requested" : "no decisions needed this cycle"}."`);
    L.push(`2 · Risk-forward: "${amber.length ? amber.join(" & ") + " under active management" : "All dimensions green"}; ${p.risks[0] ? "top risk: " + p.risks[0].desc.slice(0, 90) + "…" : "RAID stable"}."`);
    L.push(`3 · Value-forward: "${p.benefits[0] ? `Benefit '${p.benefits[0].name}' ${p.benefits[0].status}` : "Value hypotheses being instrumented"}; delivery holding ${m ? "toward " + (m.due || "next milestone") : "cadence"}."`);
  }
  if (action === "riskscan") {
    L.push(`RISK PATTERN SCAN (rules-based)\n`);
    ctx.portfolio.forEach(p => {
      p.risks.forEach(r => {
        if (!r.due) L.push(`• ${p.name}: mitigation without a date — "${(r.desc || "").slice(0, 70)}…" ('monitor' is not a mitigation).`);
        if (!r.owner) L.push(`• ${p.name}: risk without a named owner — assign a person, not a team.`);
      });
      if (p.hypothesisAgeDays > 40) L.push(`• ${p.name}: hypothesis ${p.hypothesisAgeDays} days without retro — the tier may be drifting unexamined.`);
      p.milestones.filter(m => m.conf < 60).forEach(m => L.push(`• ${p.name}: "${m.name}" at ${m.conf}% confidence — lead the next status with it.`));
    });
    if (L.length === 1) L.push("No hygiene findings — the logs look disciplined.");
  }
  if (action === "retro") {
    const p = ctx.project;
    L.push(`DAY-30 RETRO BRIEF — ${p.name} (rules-based)\n`);
    L.push(`Re-read the hypothesis first, verbatim. Then evidence per pivot trigger:`);
    L.push(`• Two consecutive red cycles? Check the ledger's status events.\n• Ceremony attendance < 70%? Ask, don't assume.\n• Rework > 20% of throughput? Pull the board's done-vs-reopened.\n• Adoption indicator off-track? T12 panel 2.`);
    L.push(`Friction round: "Which ceremony would you cancel tomorrow? Which artefact saved you this month?"`);
    L.push(`Decide: keep / adjust / change tier — effective next boundary, logged in T08 with the evidence.`);
  }
  return L.join("\n");
}

async function callAdvisor(action, ctx) {
  const actionPrompts = {
    briefing: "Write a Senior Director portfolio briefing in three short sections: (1) overall shape in 2-3 sentences, (2) the projects needing attention with the specific reason and the intervention you recommend, (3) the decisions the next Portfolio Review should take. Be direct and specific; no praise padding.",
    headline: "Write exactly three candidate status-report headlines for this project: one neutral, one risk-forward, one value-forward. Each must be a single sentence a sponsor could repeat verbatim, grounded only in the data provided. Then one line on which you'd choose and why.",
    riskscan: "Scan the portfolio data for risk-hygiene findings and cross-project patterns: undated or vague mitigations, ownerless risks, low-confidence milestones, aging tier hypotheses, repeated themes across projects. Output as a tight bulleted list grouped by project, each bullet with the specific fix.",
    retro: "Write a facilitation brief for this project's day-30 configuration retro: re-read of the hypothesis, the evidence question for each pivot trigger using the actual project data, two friction-round questions tailored to its weak dimensions, and the decision frame (keep/adjust/change tier). Max 250 words.",
  };
  const system = "You are the DCOS Advisor inside AstraZeneca's Delivery & Change Navigator. DCOS doctrine: one source of truth per artefact; tailored not templated; change is delivery (adoption beside budget); value over output; govern by exception; escalations always as options + recommendation, never naked problems; honest ambers; decisions logged with reversibility class. You draft, the certified PM decides and signs — never claim authority. Ground every statement in the JSON provided; if data is missing, say so rather than inventing. Plain text only, no markdown headers.";
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514", max_tokens: 1000,
      messages: [{ role: "user", content: system + "\n\nTASK: " + actionPrompts[action] + "\n\nDATA:\n" + JSON.stringify(ctx) }],
    }),
  });
  const data = await res.json();
  const txt = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n").trim();
  if (!txt) throw new Error("empty response");
  return txt;
}

function Advisor({ projects, project, setSel }) {
  const [busy, setBusy] = useState(null);
  const [out, setOut] = useState(null);
  const [src2, setSrc2] = useState(null);
  const run = async (action, scope) => {
    if (scope === "project" && !project) return;
    setBusy(action); setOut(null);
    const ctx = advisorContext(projects, project, scope);
    try { const txt = await callAdvisor(action, ctx); setOut(txt); setSrc2("ai"); }
    catch { setOut(ruleFallback(action, ctx)); setSrc2("rules"); }
    setBusy(null);
  };
  return (
    <div>
      <Card style={{ marginBottom: 14, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontFamily: DISP, fontWeight: 800, fontSize: 18 }}>DCOS Advisor — the Agent Blueprint, running live</div>
          <div style={{ fontSize: 12.5, color: C.mid }}>An embedded analyst over your real cockpit data: it drafts briefings, headlines, risk scans and retro guides under DCOS doctrine. Falls back to deterministic rules if the AI engine isn't reachable. Either way: <b>AI-drafted, unconfirmed — you decide and sign.</b></div>
        </div>
        {project && <div style={{ marginLeft: "auto" }}><ProjectPicker projects={projects} project={project} setSel={setSel} /></div>}
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 12, marginBottom: 16 }}>
        {ADVISOR_ACTIONS.map(([id, name, scope, badge, desc]) => (
          <Card key={id} style={{ borderTop: `3px solid ${scope === "portfolio" ? C.navy : C.mul}`, display: "flex", flexDirection: "column", padding: 16 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
              <span style={{ fontFamily: DISP, fontWeight: 800, fontSize: 14.5 }}>{name}</span>
              <Chip bg={scope === "portfolio" ? C.navyLt : C.mulLt} color={scope === "portfolio" ? C.navy : C.mul} style={{ marginLeft: "auto" }}>{badge}</Chip>
            </div>
            <div style={{ fontSize: 11.5, color: C.mid, margin: "6px 0 10px", flex: 1 }}>{desc}</div>
            <button onClick={() => run(id, scope)} disabled={busy !== null} style={{ background: busy === id ? C.faint : scope === "portfolio" ? C.navy : C.mul, color: "#fff", border: "none", borderRadius: 8, padding: "10px 0", fontFamily: DISP, fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>
              {busy === id ? "Analysing…" : scope === "portfolio" ? "Run on portfolio →" : "Run on project →"}
            </button>
          </Card>
        ))}
      </div>
      {out && (
        <Card style={{ borderLeft: `4px solid ${src2 === "ai" ? C.gold : C.faint}` }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
            <Chip bg={src2 === "ai" ? C.goldLt : C.soft} color={src2 === "ai" ? "#8A6200" : C.mid}>{src2 === "ai" ? "AI-drafted (Claude) — unconfirmed" : "Rules-based fallback — deterministic"}</Chip>
            <button onClick={() => { try { navigator.clipboard.writeText(out); } catch {} }} style={{ marginLeft: "auto", border: `1px solid ${C.line}`, background: "#fff", color: C.mid, borderRadius: 8, padding: "5px 12px", fontSize: 11.5, cursor: "pointer", fontFamily: DISP, fontWeight: 600 }}>Copy</button>
          </div>
          <div style={{ whiteSpace: "pre-wrap", fontSize: 13, lineHeight: 1.65, color: C.ink, fontFamily: BODY }}>{out}</div>
          <div style={{ fontSize: 10.5, color: C.faint, marginTop: 12 }}>Doctrine reminder: the RAG and the final headline are the PM's — the Advisor never sets them. In the corporate deployment these calls run through the enterprise AI gateway with full logging (Agent Blueprint, Module 04).</div>
        </Card>
      )}
    </div>
  );
}
