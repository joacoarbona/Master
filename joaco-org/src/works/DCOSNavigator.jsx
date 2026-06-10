import React, { useState, useEffect, useRef, useMemo } from "react";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell, Label, LineChart, Line } from "recharts";

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
  const saveTimer = useRef(null);
  const loaded = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get(STORE_KEY);
        const data = r ? JSON.parse(r.value) : null;
        if (data?.projects?.length) { setProjects(data.projects); setSel(data.projects[0].id); }
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
      try { await window.storage.set(STORE_KEY, JSON.stringify({ projects })); setSaveState("saved"); }
      catch { setSaveState("error"); }
      setTimeout(() => setSaveState("idle"), 1600);
    }, 700);
    return () => clearTimeout(saveTimer.current);
  }, [projects]);

  const update = (id, patch) => setProjects(ps => ps.map(p => p.id === id ? { ...p, ...patch } : p));
  const project = projects?.find(p => p.id === sel) || null;

  const TABS = [
    ["portfolio", "Portfolio"], ["week", "This Week"], ["health", "Health Scan"], ["priority", "Priority Lab"], ["canvas", "Delivery Canvas"], ["playbook", "Playbook"], ["review", "Review Pack"], ["govyear", "Governance Year"], ["timeline", "Demo Timeline"], ["library", "Library"],
  ];

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

      {/* App bar */}
      <div style={{ background: C.graph, color: "#fff", padding: "14px 22px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".18em", color: C.gold }}>ASTRAZENECA · OBU DSAI · DCOS</div>
          <div style={{ fontFamily: DISP, fontWeight: 800, fontSize: 21, lineHeight: 1.1 }}>Navigator <span style={{ color: "#9FB0AC", fontWeight: 600, fontSize: 13 }}>· delivery intelligence cockpit</span></div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <button onClick={() => exportJson(projects)} style={{ border: "1px solid #4A5757", background: "transparent", color: "#C9D2CF", borderRadius: 8, padding: "6px 12px", fontSize: 11.5, cursor: "pointer", fontFamily: DISP, fontWeight: 600 }}>Export JSON</button>
          <label style={{ border: "1px solid #4A5757", color: "#C9D2CF", borderRadius: 8, padding: "6px 12px", fontSize: 11.5, cursor: "pointer", fontFamily: DISP, fontWeight: 600 }}>
            Import
            <input type="file" accept="application/json" style={{ display: "none" }}
              onChange={e => importJson(e.target.files?.[0], setProjects, setSel)} />
          </label>
          <span style={{ fontFamily: MONO, fontSize: 10.5, color: saveState === "error" ? "#FF9B9B" : "#9FB0AC" }}>
            {saveState === "saving" ? "saving…" : saveState === "saved" ? "saved ✓" : saveState === "error" ? "save failed — retrying on next change" : "data persists across sessions"}
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

      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "22px 22px 60px" }}>
        {tab === "portfolio" && <Portfolio projects={projects} setProjects={setProjects} update={update} setSel={setSel} setTab={setTab} />}
        {tab === "week" && <WeekView projects={projects} />}
        {tab === "health" && <HealthScan projects={projects} project={project} setSel={setSel} update={update} setTab={setTab} />}
        {tab === "priority" && <PriorityLab projects={projects} update={update} />}
        {tab === "canvas" && <Canvas projects={projects} project={project} setSel={setSel} update={update} />}
        {tab === "playbook" && <Playbook />}
        {tab === "review" && <ReviewPack projects={projects} />}
        {tab === "govyear" && <GovernanceYear />}
        {tab === "timeline" && <TimelineDemo />}
        {tab === "library" && <Library />}
      </div>
    </div>
  );
}

/* ================= PORTFOLIO ================= */
function Portfolio({ projects, setProjects, update, setSel, setTab }) {
  const [name, setName] = useState("");
  const [tier, setTier] = useState("B");
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
          <button onClick={addProject} style={{ background: C.mul, color: "#fff", border: "none", borderRadius: 8, padding: "10px 16px", fontFamily: DISP, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Add project</button>
        </Card>
      </div>

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
              </div>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                {RAG_DIMS.map(d => (
                  <div key={d} style={{ textAlign: "center" }}>
                    <div className="ragdot" role="button" tabIndex={0} aria-label={`${d}: ${p.rag?.[d] || "G"} — click to cycle`}
                      onClick={() => update(p.id, { rag: { ...p.rag, [d]: RAG_CYCLE[p.rag?.[d] || "G"] } })}
                      onKeyDown={e => e.key === "Enter" && update(p.id, { rag: { ...p.rag, [d]: RAG_CYCLE[p.rag?.[d] || "G"] } })}
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
  const radarData = ALL_DIMS.map(d => ({ dim: d.label, v: h[d.id] ?? 0, full: 5 }));
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
            const snaps = (project.snapshots || []).filter(s => s.date !== today());
            update(project.id, { snapshots: [...snaps, { date: today(), score, dims: { ...h } }] });
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
                  <Radar dataKey="v" stroke={C.mul} fill={C.mul} fillOpacity={0.28} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ fontSize: 11.5, color: C.faint }}>A healthy project is round. Spikes are strengths to protect; dents are this month's work.</div>
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
                  {card && <button onClick={() => setTab("playbook")} style={{ border: "none", background: "transparent", color: C.mul, fontWeight: 600, fontSize: 12, cursor: "pointer", padding: 0 }}>
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
function ReviewPack({ projects }) {
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

  const md = () => {
    let m = `# Portfolio Review pre-pack — ${today()}\n\n## Snapshot\n${projects.length} projects · attention needed on ${attention.length}\n\n## Needs attention\n`;
    attention.forEach(({ p, flags }) => { m += `- **${p.name}** (${p.code}, Tier ${p.tier}, ${p.phase}): ${flags.join(" · ")}\n`; });
    if (!attention.length) m += "- none flagged this cycle\n";
    m += `\n## Priority order (WSJF)\n`;
    ranked.forEach((p, i) => { m += `${i + 1}. ${p.name} — ${wsjfScore(p.wsjf).toFixed(1)} (value ${p.value}, effort ${p.effort})\n`; });
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
