import React, { useState, useEffect, useRef, useMemo, useReducer } from "react";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell, Label, LineChart, Line, AreaChart, Area } from "recharts";
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
  en: { intro: "Home", graph: "Knowledge Graph", gStart: "START", portfolio: "Portfolio", week: "This Week", workspace: "Workspace", data: "Project Data", studio: "PPT Studio", health: "Health Scan", priority: "Priority Lab", canvas: "Delivery Canvas", review: "Review Pack", govyear: "Governance Year", timeline: "Timeline", advisor: "Advisor", capacity: "Capacity & Budget", whiteboard: "Whiteboard", team: "Team & AI Model", charter: "Team Charter", resources: "Resources", gRun: "RUN", gGovern: "GOVERN", gGenerate: "GENERATE", gLearn: "LEARN", subtitle: "delivery intelligence cockpit", persists: "data persists across sessions", saving: "saving\u2026", saved: "saved \u2713", saveerr: "save failed \u2014 retrying on next change", export: "Export JSON", import: "Import", langnote: "" },
  es: { intro: "Inicio", graph: "Grafo de Conocimiento", gStart: "INICIO", portfolio: "Portafolio", week: "Esta Semana", workspace: "Espacio de Trabajo", data: "Datos del Proyecto", studio: "Estudio PPT", health: "Diagn\u00f3stico", priority: "Lab de Prioridades", canvas: "Canvas de Entrega", review: "Pack de Revisi\u00f3n", govyear: "A\u00f1o de Gobierno", timeline: "L\u00ednea de Tiempo", advisor: "Asesor IA", capacity: "Capacidad y Presupuesto", whiteboard: "Pizarra", team: "Equipo e IA", charter: "Carta del Equipo", resources: "Recursos", gRun: "EJECUTA", gGovern: "GOBIERNA", gGenerate: "GENERA", gLearn: "APRENDE", subtitle: "cockpit de inteligencia de delivery", persists: "los datos persisten entre sesiones", saving: "guardando\u2026", saved: "guardado \u2713", saveerr: "fallo al guardar \u2014 reintenta en el pr\u00f3ximo cambio", export: "Exportar JSON", import: "Importar", langnote: "Los documentos generados mantienen el ingl\u00e9s corporativo (est\u00e1ndar de entregables)." },
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
const SNAP_KEY = "dcos-navigator-snapshots";
const SNAP_MAX = 7;
const uid = () => Math.random().toString(36).slice(2, 9);
const dRel = w => new Date(Date.now() + w * 7 * 86400000).toISOString().slice(0, 10);
const tRel = w => Date.now() + w * 7 * 86400000;
function mk2(ts, type, title, detail) { return { date: new Date(ts).toISOString().slice(0, 10), ts, type, title, detail }; }
const seedProjects = () => {
  const m1c = uid(), m1d = uid(), m1e = uid();
  return [
  { id: uid(), name: "Insight Assistant", code: "OBU-114", tier: "B", phase: "Deliver", value: 7, effort: 5, pm: "M. Serra",
    rag: { Scope: "G", Schedule: "A", Budget: "G", Risk: "A", Adoption: "G" },
    wsjf: { bv: 8, tc: 6, rr: 5, size: 5 },
    health: { plan: 3, flow: 3, raid: 4, decisions: 3, honesty: 4, sponsor: 4, backlog: 4, value: 3, stake: 3, adoption: 3, capacity: 3, morale: 4 },
    snapshots: [{ date: dRel(-6), score: 58, dims: { plan: 2, flow: 3, raid: 3, decisions: 3, honesty: 3, sponsor: 4, backlog: 3, value: 2, stake: 3, adoption: 2, capacity: 3, morale: 3 } }, { date: dRel(-2), score: 66, dims: { plan: 3, flow: 3, raid: 4, decisions: 3, honesty: 4, sponsor: 4, backlog: 4, value: 3, stake: 3, adoption: 3, capacity: 3, morale: 4 } }],
    hypothesis: { text: "We believe Tier B (Hybrid; biweekly status & demos, monthly SteerCo + gates) will deliver predictable delivery and decision-ready governance for Insight Assistant, because the profile scores 7/12 with uncertainty 2 and regulatory exposure 1. We will know we are wrong if a pivot trigger fires before the day-30 retro.", score: 7, date: dRel(-6), answers: [2, 1, 1, 1, 1, 1] },
    canvas: {
      problem: "Field managers wait ~5 days for performance answers that should be self-serve; ~120 requests/month consume analyst time and decisions slip a cycle.",
      users: "Primary: 140 field managers (Iberia first). Secondary: 25 insights analysts whose role shifts to curation. Deciders: BU sponsor; Data Platform lead can block via access.",
      outcome: "Same-day answer rate 35% -> 80% by Oct; analyst hours on routine requests -120 h/month; decision latency in territory reviews -2 days.",
      hypothesis: "We believe a GenAI assistant grounded on the governed insights layer lifts same-day answers to 80% within 6 weeks of pilot release, visible in query telemetry.",
      solution: "Assistant over the AI gateway with RAG on the insights mart. OUT: free-form SQL, write-back to CRM, markets beyond Iberia in phase 1.",
      risks: "Vendor API capacity on critical path; data-access approval pending; adoption depends on champion coverage per district.",
      change: "Behaviour change medium for field managers (ask-first habit), high for analysts (role shift). Senders: regional directors, not the project.",
      team: "PM + PO + 3 eng + data steward + change lead (0.5). Tier B heartbeat: biweekly demo, monthly SteerCo.",
      first30: "Data access signed; board to T07; stakeholder map v1; telemetry events defined; day-30 configuration retro booked." },
    keydata: { headline: "Re-sequenced plan holding; pilot telemetry live; one decision needed on market scope.",
      milestone: "Pilot live - Iberia", milestoneDate: dRel(3), confidence: 75,
      risks: [
        { id: uid(), desc: "Because the vendor API team carries single-squad capacity, the throughput upgrade may slip 2-3 weeks, leading to pilot delay and a compressed hypercare window.", owner: "PM + vendor AE", due: dRel(1) },
        { id: uid(), desc: "Because data-access approval for the insights mart is pending with privacy, grounding scope may shrink, leading to lower answer coverage at pilot.", owner: "Data steward", due: dRel(1) }],
      decisions: [
        { id: uid(), text: "Confirm pilot market scope: Iberia only vs Iberia+Italy", owner: "Sponsor", status: "needed" },
        { id: uid(), text: "Prioritise saved-views over export-to-deck for increment 4 (WSJF)", owner: "PO", status: "taken" }],
      benefits: [
        { id: uid(), name: "Same-day answer rate for field questions", baseline: "35%", target: "80% by Oct", owner: "E. Costa (BU Insights)", status: "on track" },
        { id: uid(), name: "Analyst hours on routine requests", baseline: "180 h/m", target: "60 h/m by Nov", owner: "R. Vidal (Ops)", status: "at risk" }] },
    budget: { envelope: 260000, lines: [{ id: uid(), label: "Vendor API tier", amount: 48000 }, { id: uid(), label: "Eval & red-team support", amount: 15000 }], tBest: 0, tLikely: 2, tWorst: 6 },
    bizcase: { problemSized: "~120 requests/month x 45 min analyst handling = ~11k EUR/month of latency and rework; territory decisions slip one cycle while answers queue.",
      options: [
        { id: uid(), name: "Do nothing", summary: "queue keeps growing with field expansion; analyst attrition risk", cost: "0 (+132k/yr hidden)" },
        { id: uid(), name: "Buy vendor copilot", summary: "fast start; weak grounding on our mart; per-seat lock-in", cost: "420k / 3y" },
        { id: uid(), name: "Build on AI gateway", summary: "governed grounding, reusable pattern for OBU; needs 2 FTE", cost: "260k + 60k/yr" }],
      recommendation: "Option C - build on the gateway: grounding quality drives the 80% target, and the pattern is reusable by two sister use cases already in the funnel.",
      tco: "260k build + 60k/yr run (3y view 440k)", sensitivity: "Adoption <50% at week 6 breaks the payback - hence champion coverage as a leading indicator.",
      ask: "260k EUR + 2 FTE for 2 quarters; scope decision by " + dRel(1) },
    epics: [
      { id: uid(), title: "Self-serve Q&A on territory performance", user: "Field manager preparing a territory review (Iberia)", problem: "Evidence: 87 tickets last quarter asking variants of the same 12 questions; median wait 5.2 days (helpdesk export).", hypothesis: "We believe grounded Q&A lifts same-day answers to 80% within 6 weeks, visible in answered-without-analyst telemetry.", acceptance: "Top-12 question patterns answered with source links; P95 latency < 8s; wrong-answer rate < 2% on the eval set; graceful refusal outside scope.", instrumentation: "Events: question_asked, answer_served(source_count), escalated_to_analyst, thumbs. Dashboard panel wired pre-launch." },
      { id: uid(), title: "Saved views for recurring reviews", user: "Field manager running the same monthly cut per district", problem: "Evidence: 60% of repeat questions are month-over-month re-runs (query log sample, n=240).", hypothesis: "We believe saved views cut repeat effort 70% and lift week-4 retention above 60%.", acceptance: "Save/rename/share a view; refresh respects row-level security; opens in <3s.", instrumentation: "view_saved, view_reopened(week_bucket), share_event." }],
    stakeholders: [
      { id: uid(), name: "L. Marquez - BU Sponsor", role: "Sponsor", quadrant: "mc", stanceFrom: "supporter", stanceTo: "champion", care: "I want one number I can defend in the QBR - not a demo.", action: "Chairs monthly value review; sender of wave-1 comms" },
      { id: uid(), name: "D. Huang - Data Platform lead", role: "Gatekeeper", quadrant: "ks", stanceFrom: "sceptic", stanceTo: "supporter", care: "If latency blame lands on my mart, I lose the quarter.", action: "Joint latency SLO + shared dashboard - PO, by " + dRel(2) },
      { id: uid(), name: "Field Council (5 RDs)", role: "Adopter voice", quadrant: "ki", stanceFrom: "neutral", stanceTo: "supporter", care: "Don't add a tool; remove a wait.", action: "Demo at council + champion per district - Change lead, " + dRel(3) },
      { id: uid(), name: "Privacy office", role: "Compliance", quadrant: "mon", stanceFrom: "neutral", stanceTo: "neutral", care: "Scope of personal data in grounding set", action: "DPIA addendum review - Data steward, " + dRel(1) }],
    impact: [
      { id: uid(), group: "Field managers - Iberia", size: "~140", process: 2, tools: 2, skills: 1, behaviour: 2, fromTo: "From emailing analysts and waiting days -> asking the assistant in the flow of territory prep.", gap: "Training wave + 1 champion per district + manager-led first-question ritual" },
      { id: uid(), group: "Insights analysts", size: "~25", process: 3, tools: 2, skills: 2, behaviour: 3, fromTo: "From report factory -> curation, eval-set ownership and exception handling.", gap: "Role narrative from Ops lead + eval-rotation schedule + skills clinic" }],
    comms: [
      { id: uid(), audience: "Field managers - Iberia", message: "Same-day answers are coming: what changes for your territory prep", channel: "Regional town-hall + manager cascade", sender: "Regional Directors", date: dRel(2), status: "planned" },
      { id: uid(), audience: "Insights analysts", message: "Your role shifts to curation - here is the path and the training", channel: "Team session + 1:1s", sender: "Ops lead (R. Vidal)", date: dRel(1), status: "planned" },
      { id: uid(), audience: "Sponsors & leadership", message: "Pilot scope decision needed by " + dRel(1), channel: "SteerCo pre-read", sender: "Sponsor", date: dRel(0), status: "sent" }],
    retros: [
      { id: uid(), date: dRel(-4), temp: 3, keep: "Async refinement notes before the session", change: "Demo prep eating PO time - rotate ownership", stop: "Status detail in standup", experiment: "Rotate demo ownership across the squad for 2 sprints", expReviewed: true },
      { id: uid(), date: dRel(-1), temp: 4, keep: "Rotated demos (kept after review - energy up)", change: "Eval-set reviews need Data Steward earlier", stop: "", experiment: "Data Steward joins refinement biweekly", expReviewed: false }],
    plan: [
      { id: uid(), name: "G1 - charter signed, tier confirmed", due: dRel(-6), conf: 95, status: "done", owner: "PM" },
      { id: uid(), name: "G2 - mobilised, impact assessed", due: dRel(-2), conf: 90, status: "done", owner: "PM" },
      { id: m1c, name: "Data access signed (privacy)", due: dRel(1), conf: 60, status: "open", owner: "Data steward" },
      { id: m1d, name: "Pilot live - Iberia", due: dRel(3), conf: 75, status: "open", owner: "PO", dep: m1c },
      { id: m1e, name: "G3 - readiness gate", due: dRel(9), conf: 70, status: "open", owner: "Change Lead", dep: m1d },
      { id: uid(), name: "G4 - closure & value handover", due: dRel(16), conf: 65, status: "open", owner: "Sponsor", dep: m1e }],
    wip: { doing: 3, review: 2 },
    flowLog: seedFlow(),
    work: [
      { id: uid(), title: "Eval set v2 - top-12 question patterns", col: "doing" },
      { id: uid(), title: "Telemetry events in pilot build", col: "review" },
      { id: uid(), title: "Champion onboarding kit", col: "backlog" },
      { id: uid(), title: "Latency SLO with Data Platform", col: "doing", blocked: true },
      { id: uid(), title: "DPIA addendum draft", col: "done" }],
    pages: [{ id: uid(), title: "SteerCo notes - last session", body: "Decisions: saved-views prioritised (logged). Risks: vendor capacity discussed, options A/B/C requested for next session. Sponsor to call vendor AE.", updated: dRel(-1) }],
    events: [
      mk2(tRel(-8), "gate", "Project framed - Tier B hypothesis written", "Profile 7/12, uncertainty 2. Pivot triggers registered."),
      mk2(tRel(-6), "gate", "Milestone done: G1 - charter signed", "Confidence 95%"),
      mk2(tRel(-6), "artefact", "Health snapshot saved - 58/100", "First scan; value instrumentation and adoption weakest."),
      mk2(tRel(-3), "status", "RAG Schedule: G -> A", "Vendor API capacity slip flagged on the Portfolio board"),
      mk2(tRel(-2), "gate", "Milestone done: G2 - mobilised, impact assessed", "Confidence 90%"),
      mk2(tRel(-2), "artefact", "Health snapshot saved - 66/100", "Plan and RAID hygiene improving after re-sequence."),
      mk2(tRel(-1), "decision", "Decision taken: Prioritise saved-views over export-to-deck", "Decision-maker: PO"),
      mk2(tRel(-0.5), "forum", "T05 generated from the Studio", "AZ-branded draft - review and sign before circulation")] },
  { id: uid(), name: "Field Excellence Rollout", code: "OBU-097", tier: "C", phase: "Embed", value: 8, effort: 8, pm: "A. Ribeiro",
    rag: { Scope: "G", Schedule: "G", Budget: "A", Risk: "G", Adoption: "A" },
    wsjf: { bv: 9, tc: 7, rr: 4, size: 8 },
    health: { plan: 4, flow: 4, raid: 4, decisions: 4, honesty: 3, sponsor: 5, backlog: 3, value: 3, stake: 4, adoption: 2, capacity: 3, morale: 3 },
    snapshots: [{ date: dRel(-4), score: 70, dims: { plan: 4, flow: 4, raid: 4, decisions: 4, honesty: 3, sponsor: 5, backlog: 3, value: 3, stake: 4, adoption: 3, capacity: 3, morale: 3 } }],
    canvas: { problem: "CRM adoption uneven across waves; call-prep time target at risk in two districts.", outcome: "Call-prep time -30% by Q3; week-4 retention >=60% per district; zero parallel trackers." },
    keydata: { headline: "Wave 2 readiness on track; retention recovering in District N after fast-follow fix.",
      milestone: "Wave 2 go-live", milestoneDate: dRel(2), confidence: 80,
      risks: [{ id: uid(), desc: "Because travel budget is amber, wave-2 floor training may move virtual, leading to weaker proficiency in low-coverage districts.", owner: "Change Lead", due: dRel(1) }],
      decisions: [{ id: uid(), text: "Fast-follow product fix over comms push for retention dip", owner: "Sponsor", status: "taken" }],
      benefits: [
        { id: uid(), name: "Call-prep time per visit", baseline: "22 min", target: "15 min by Q3", owner: "P. Ortiz (Field Ops)", status: "on track" },
        { id: uid(), name: "Parallel spreadsheet trackers", baseline: "14", target: "0 by Q4", owner: "P. Ortiz (Field Ops)", status: "realised" }] },
    impact: [{ id: uid(), group: "Field reps - wave 2 districts", size: "~220", process: 2, tools: 3, skills: 2, behaviour: 3, fromTo: "From spreadsheet prep -> CRM-first visit planning.", gap: "District-led floor sessions + manager check-ins in week 1-2" }],
    budget: { envelope: 780000, lines: [{ id: uid(), label: "Vendor & licences", amount: 180000 }, { id: uid(), label: "Travel & training waves", amount: 60000 }], tBest: 0, tLikely: 1, tWorst: 4 },
    closure: { spend: "740k", envelope: "780k", residual: "Licences 95k/yr (run)", runOwner: "CRM service team (M. Pohl)",
      keep: "Readiness gate per wave with champion coverage as entry criterion.",
      change: "Instrument retention from day 1, not week 3 - the dip was visible earlier in support tickets.",
      stop: "All-hands launch emails - zero measurable effect vs manager-led asks.",
      tellNext: "Adoption is a product problem before it is a comms problem: shadow five users before writing a single newsletter." },
    plan: [
      { id: uid(), name: "G3 - wave 1 readiness", due: dRel(-10), conf: 95, status: "done", owner: "Change Lead" },
      { id: uid(), name: "Wave 2 go-live", due: dRel(2), conf: 80, status: "open", owner: "PM" },
      { id: uid(), name: "G4 - closure & value handover", due: dRel(8), conf: 75, status: "open", owner: "Sponsor" }],
    work: [{ id: uid(), title: "Wave-2 readiness checklist", col: "doing" }, { id: uid(), title: "Retention dashboard per district", col: "done" }],
    pages: [], epics: [],
    stakeholders: [{ id: uid(), name: "P. Ortiz - Field Ops", role: "Benefit owner", quadrant: "mc", stanceFrom: "supporter", stanceTo: "champion", care: "Give my managers their hour back.", action: "Co-presents wave-2 kickoff - Change lead" }],
    events: [
      mk2(tRel(-10), "gate", "Milestone done: G3 - wave 1 readiness", "Training 96%, champions covering all districts"),
      mk2(tRel(-7), "status", "RAG Adoption: G -> A", "Week-2 retention soft in District N & E"),
      mk2(tRel(-6), "decision", "Decision taken: Fast-follow product fix over comms push", "Decision-maker: Sponsor"),
      mk2(tRel(-3), "status", "RAG Adoption: A -> A", "Recovering - District N at 57% and climbing")] },
  { id: uid(), name: "Dashboard Sunset", code: "OBU-121", tier: "D", phase: "Deliver", value: 3, effort: 2, pm: "M. Serra",
    rag: { Scope: "G", Schedule: "G", Budget: "G", Risk: "G", Adoption: "G" },
    wsjf: { bv: 4, tc: 3, rr: 2, size: 2 },
    health: { plan: 5, flow: 4, raid: 4, decisions: 4, honesty: 4, sponsor: 3, backlog: 4, value: 4, stake: 4, adoption: 4, capacity: 4, morale: 4 },
    keydata: { headline: "7 of 12 dashboards migrated; usage of new stack at 80% of old baseline.", milestone: "Full switch-off", milestoneDate: dRel(6), confidence: 85, risks: [], decisions: [{ id: uid(), text: "Sunset banners 30 days before each switch-off", owner: "PM", status: "taken" }], benefits: [{ id: uid(), name: "Legacy BI licence cost", baseline: "48k/yr", target: "0 by Q4", owner: "IT FinOps", status: "on track" }] },
    plan: [{ id: uid(), name: "Migration batch 3", due: dRel(2), conf: 85, status: "open", owner: "PM" }, { id: uid(), name: "Full switch-off", due: dRel(6), conf: 85, status: "open", owner: "PM" }],
    work: [], pages: [], canvas: {}, events: [mk2(tRel(-4), "gate", "Project framed - Tier D confirmed", "Profile 2/12; monthly one-pager, quarterly review.")] },
];};

/* ---------- shared atoms ---------- */
const Chip = ({ children, bg = C.soft, color = C.mid, style, onClick }) => (
  <span onClick={onClick} style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".08em", textTransform: "uppercase", padding: "3px 9px", borderRadius: 99, background: bg, color, whiteSpace: "nowrap", ...style }}>{children}</span>
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

async function rollSnapshot(payload) {
  try {
    const stamp = new Date().toISOString();
    let snaps = [];
    try { const raw = await window.storage.get(SNAP_KEY); if (raw?.value) snaps = JSON.parse(raw.value); } catch {}
    const last = snaps[snaps.length - 1];
    // keep at most one snapshot per ~20 min, and skip if unchanged
    if (last && (last.payload === payload || (Date.now() - new Date(last.stamp).getTime()) < 20 * 60 * 1000)) {
      if (last.payload !== payload) { last.payload = payload; last.stamp = stamp; }
      else return;
    } else {
      snaps.push({ stamp, payload });
    }
    while (snaps.length > SNAP_MAX) snaps.shift();
    await window.storage.set(SNAP_KEY, JSON.stringify(snaps));
  } catch {}
}
async function loadSnapshots() {
  try { const raw = await window.storage.get(SNAP_KEY); return raw?.value ? JSON.parse(raw.value) : []; } catch { return []; }
}
function exportJson(bundle) {
  try {
    const blob = new Blob([JSON.stringify({ exported: today(), app: "dcos-navigator", v: 10, ...bundle }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `dcos-navigator-${today()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  } catch (e) { console.error("export failed", e); }
}
const sanitizeProject = p => ({
  work: [], pages: [], events: [], snapshots: [], epics: [], stakeholders: [], impact: [], plan: [], comms: [], retros: [],
  keydata: { ...KD_DEFAULT }, canvas: {}, health: {}, ...p,
  id: String(p.id || uid()), name: String(p.name || "Untitled"), code: String(p.code || "OBU-000"),
  tier: ["A", "B", "C", "D"].includes(p.tier) ? p.tier : "B",
  phase: PHASES.includes(p.phase) ? p.phase : "Frame",
  value: +p.value || 5, effort: +p.effort || 5,
  rag: { ...Object.fromEntries(RAG_DIMS.map(d => [d, "G"])), ...(p.rag || {}) },
  wsjf: { bv: 5, tc: 5, rr: 5, size: 5, ...(p.wsjf || {}) },
});
function importJson(file, api) {
  if (!file) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const data = JSON.parse(r.result);
      if (Array.isArray(data.projects) && data.projects.length) {
        const clean = data.projects.map(sanitizeProject);
        api.setProjects(clean); api.setSel(clean[0].id);
        if (Array.isArray(data.people)) api.setPeople(data.people);
        if (Array.isArray(data.assignments)) api.setAssignments(data.assignments);
        if (Array.isArray(data.programLinks)) api.setProgramLinks(data.programLinks);
      } else alert("That file doesn't contain a Navigator portfolio (missing 'projects' array).");
    } catch { alert("Couldn't read that file — expected a Navigator JSON export."); }
  };
  r.readAsText(file);
}

export default function App() {
  const [tab, setTab] = useState("intro");
  const [projects, setProjects] = useState(null);
  const [sel, setSel] = useState(null);
  const [saveState, setSaveState] = useState("idle");
  const [lang, setLang] = useState("en");
  const [confirmAct, setConfirmAct] = useState(null);
  const [programLinks, setProgramLinks] = useState([]);
  const [showBackup, setShowBackup] = useState(false);
  const [charter, setCharter] = useState(null);
  const [people, setPeople] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const T = k => (I18N[lang] && I18N[lang][k]) || I18N.en[k] || k;
  const saveTimer = useRef(null);
  const loaded = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get(STORE_KEY);
        const data = r ? JSON.parse(r.value) : null;
        if (data?.projects?.length) { setProjects(data.projects); setSel(data.projects[0].id); if (data.lang) setLang(data.lang); if (data.programLinks) setProgramLinks(data.programLinks); if (data.people) setPeople(data.people); if (data.assignments) setAssignments(data.assignments); if (data.charter) setCharter(data.charter); }
        else { const s = seedProjects(); setProjects(s); setSel(s[0].id); const hr = seedHR(s); setPeople(hr.people); setAssignments(hr.assignments); }
      } catch { const s = seedProjects(); setProjects(s); setSel(s[0].id); const hr = seedHR(s); setPeople(hr.people); setAssignments(hr.assignments); }
      loaded.current = true;
    })();
  }, []);

  useEffect(() => {
    if (!loaded.current || !projects) return;
    setSaveState("saving");
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
          const payload = JSON.stringify({ projects, lang, programLinks, people, assignments, charter });
          await window.storage.set(STORE_KEY, payload);
          setSaveState("saved");
          rollSnapshot(payload).catch(() => {});
        }
      catch { setSaveState("error"); }
      setTimeout(() => setSaveState("idle"), 1600);
    }, 700);
    return () => clearTimeout(saveTimer.current);
  }, [projects, lang, programLinks, people, assignments, charter]);

  const update = (id, patch) => setProjects(ps => ps.map(p => p.id === id ? { ...p, ...patch } : p));
  const project = projects?.find(p => p.id === sel) || null;

  const TAB_GROUPS = [
    ["gStart", ["intro", "graph"]],
    ["gRun", ["portfolio", "week", "workspace", "data", "canvas", "whiteboard"]],
    ["gGovern", ["review", "health", "priority", "capacity", "team", "govyear", "timeline"]],
    ["gGenerate", ["studio", "advisor"]],
    ["gLearn", ["charter", "resources"]],
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
            if (projects.some(p => p.isDemo)) return;
            // Build demos with ORIGINAL codes first (seedHR links assignments by code),
            // then tag names/codes/PM with "(demo)" so they can never collide with real
            // projects in name/code-based analyses (graph, filters, lookups). IDs are
            // fresh uid()s and are left untouched, so id-based links stay intact.
            const TAG = " (demo)";
            const dpRaw = seedProjects().map(p => ({ ...p, isDemo: true }));
            const hr = seedHR(dpRaw);
            const dp = dpRaw.map(p => ({ ...p, name: p.name + TAG, code: "D-" + p.code, pm: p.pm ? p.pm + TAG : p.pm }));
            const dpe = hr.people.map(x => ({ ...x, isDemo: true, name: x.name + TAG }));
            const dpa = hr.assignments.map(x => ({ ...x, isDemo: true }));
            setProjects(prev => [...prev, ...dp]);
            setPeople(prev => [...(prev || []), ...dpe]);
            setAssignments(prev => [...(prev || []), ...dpa]);
            setSel(s => s || dp[0].id);
          }} disabled={projects.some(p => p.isDemo)} title="Add 3 fully-populated demo projects alongside your data (removable, won't touch the rest)" style={{ border: "1px solid #4A5757", background: "transparent", color: projects.some(p => p.isDemo) ? "#5E6A6A" : "#C9D2CF", borderRadius: 8, padding: "6px 12px", fontSize: 11.5, cursor: projects.some(p => p.isDemo) ? "default" : "pointer", fontFamily: DISP, fontWeight: 600 }}>+ Demo (3)</button>
          {projects.some(p => p.isDemo) && (
            <button onClick={() => {
              const remaining = projects.filter(p => !p.isDemo);
              setProjects(prev => prev.filter(p => !p.isDemo));
              setPeople(prev => (prev || []).filter(x => !x.isDemo));
              setAssignments(prev => (prev || []).filter(x => !x.isDemo));
              setSel(s => (remaining.some(p => p.id === s) ? s : (remaining[0]?.id || null)));
            }} title="Remove only the demo projects — your real data stays untouched" style={{ border: "1px solid #4A5757", background: "transparent", color: "#C9D2CF", borderRadius: 8, padding: "6px 12px", fontSize: 11.5, cursor: "pointer", fontFamily: DISP, fontWeight: 600 }}>− Demo</button>
          )}
          <button onClick={() => {
            if (confirmAct !== "clear") { setConfirmAct("clear"); setTimeout(() => setConfirmAct(c => c === "clear" ? null : c), 3000); return; }
            setProjects([]); setSel(null); setConfirmAct(null);
          }} style={{ border: "1px solid #4A5757", background: confirmAct === "clear" ? "#B3261E" : "transparent", color: confirmAct === "clear" ? "#fff" : "#C9D2CF", borderRadius: 8, padding: "6px 12px", fontSize: 11.5, cursor: "pointer", fontFamily: DISP, fontWeight: 600 }}>{confirmAct === "clear" ? "Delete everything?" : "Clear"}</button>
          <button onClick={() => setLang(l => l === "en" ? "es" : "en")} title={I18N[lang].langnote || "Switch UI language"} style={{ border: `1px solid ${C.gold}`, background: "transparent", color: C.gold, borderRadius: 8, padding: "6px 12px", fontSize: 11.5, cursor: "pointer", fontFamily: DISP, fontWeight: 700 }}>{lang === "en" ? "ES" : "EN"}</button>
          <button onClick={() => setShowBackup(true)} title="Backups & restore" style={{ border: "1px solid #4A5757", background: "transparent", color: "#C9D2CF", borderRadius: 8, padding: "6px 12px", fontSize: 11.5, cursor: "pointer", fontFamily: DISP, fontWeight: 600 }}>↻ Backups</button>
          <button onClick={() => exportJson({ projects, programLinks, people, assignments, lang, charter })} style={{ border: "1px solid #4A5757", background: "transparent", color: "#C9D2CF", borderRadius: 8, padding: "6px 12px", fontSize: 11.5, cursor: "pointer", fontFamily: DISP, fontWeight: 600 }}>{T("export")}</button>
          <label style={{ border: "1px solid #4A5757", color: "#C9D2CF", borderRadius: 8, padding: "6px 12px", fontSize: 11.5, cursor: "pointer", fontFamily: DISP, fontWeight: 600 }}>
            {T("import")}
            <input type="file" accept="application/json" style={{ display: "none" }}
              onChange={e => importJson(e.target.files?.[0], { setProjects, setSel, setPeople, setAssignments, setProgramLinks })} />
          </label>
          <span style={{ fontFamily: MONO, fontSize: 10.5, color: saveState === "error" ? "#FF9B9B" : "#9FB0AC" }}>
            {saveState === "saving" ? T("saving") : saveState === "saved" ? T("saved") : saveState === "error" ? T("saveerr") : T("persists")}
            {(() => { try { const kb = Math.round(JSON.stringify({ projects, programLinks, people, assignments }).length / 1024); return <span style={{ color: kb > 4096 ? "#FF9B9B" : "#7C8A87" }} title={kb > 4096 ? "Approaching the 5MB storage limit — export a JSON backup and clear closed projects" : "Portfolio data size"}> · {kb} KB{kb > 4096 ? " ⚠" : ""}</span>; } catch { return null; } })()}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: "#fff", borderBottom: `1px solid ${C.line}`, padding: "0 22px", display: "flex", gap: 4, overflowX: "auto" }}>
        {TAB_GROUPS.map(([g, ids], gi) => (
          <div key={g} style={{ display: "flex", alignItems: "stretch", borderLeft: gi ? `1px solid ${C.soft}` : "none", paddingLeft: gi ? 10 : 0, marginLeft: gi ? 4 : 0 }}>
            <span style={{ alignSelf: "center", fontFamily: MONO, fontSize: 8.5, letterSpacing: ".14em", color: ids.includes(tab) ? C.mul : C.faint, fontWeight: 600, marginRight: 4, whiteSpace: "nowrap" }}>{T(g)}</span>
            {ids.map(id => (
              <button key={id} className="tabbtn" onClick={() => setTab(id)} style={{
                border: "none", background: "transparent", padding: "13px 9px", cursor: "pointer",
                fontFamily: DISP, fontWeight: 700, fontSize: 13,
                color: tab === id ? C.mul : C.mid, borderBottom: `3px solid ${tab === id ? C.gold : "transparent"}`, whiteSpace: "nowrap",
              }}>{T(id)}</button>
            ))}
          </div>
        ))}
      </div>

      {lang === "es" && <div style={{ maxWidth: 1180, margin: "0 auto", padding: "10px 22px 0", fontSize: 11, color: C.faint }}>{I18N.es.langnote}</div>}
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "22px 22px 60px" }}>
        {tab === "intro" && <IntroPage setTab={setTab} />}
        {tab === "graph" && <KnowledgeGraph projects={projects} people={people} assignments={assignments} setSel={setSel} setTab={setTab} />}
        {tab === "portfolio" && <Portfolio projects={projects} setProjects={setProjects} update={update} setSel={setSel} setTab={setTab} programLinks={programLinks} setProgramLinks={setProgramLinks} />}
        {tab === "week" && <WeekView projects={projects} />}
        {tab === "workspace" && <Workspace projects={projects} project={project} setSel={setSel} update={update} people={people} assignments={assignments} />}
        {tab === "data" && <ProjectData projects={projects} project={project} setSel={setSel} update={update} people={people} />}
        {tab === "studio" && <PptStudio projects={projects} project={project} setSel={setSel} update={update} />}
        {tab === "health" && <HealthScan projects={projects} project={project} setSel={setSel} update={update} setTab={setTab} />}
        {tab === "priority" && <PriorityLab projects={projects} update={update} />}
        {tab === "capacity" && <CapacityHub projects={projects} update={update} people={people} setPeople={setPeople} assignments={assignments} setAssignments={setAssignments} />}
        {tab === "team" && <TeamAI projects={projects} update={update} people={people} assignments={assignments} setTab={setTab} setSel={setSel} />}
        {tab === "canvas" && <Canvas projects={projects} project={project} setSel={setSel} update={update} people={people} />}
        {tab === "whiteboard" && <WhiteboardTab projects={projects} project={project} setSel={setSel} update={update} />}
        {tab === "review" && <ReviewPack projects={projects} update={update} people={people} assignments={assignments} />}
        {tab === "govyear" && <GovernanceYear />}
        {tab === "timeline" && <TimelineHub projects={projects} setTab={setTab} setSel={setSel} />}
        {tab === "advisor" && <Advisor projects={projects} project={project} setSel={setSel} />}
        {tab === "charter" && <TeamCharter charter={charter} setCharter={setCharter} people={people} />}
        {tab === "resources" && <Resources />}
      </div>
      {showBackup && <BackupPanel onClose={() => setShowBackup(false)} current={{ projects, programLinks, people, assignments, lang, charter }}
        onRestore={b => { const clean = (b.projects || []).map(sanitizeProject); setProjects(clean); setSel(clean[0]?.id || null); setProgramLinks(b.programLinks || []); setPeople(b.people || []); setAssignments(b.assignments || []); if (b.lang) setLang(b.lang); if (b.charter) setCharter(b.charter); setShowBackup(false); }} />}
    </div>
  );
}

/* ================= PORTFOLIO ================= */

/* ============================================================================
   Guidance document (self-contained HTML, opened in a new tab) + Intro page
   ========================================================================== */
function openGuidance() {
  const css = "body{font-family:'Inter',Calibri,Arial,sans-serif;color:#1C2222;max-width:860px;margin:0 auto;padding:48px 32px;line-height:1.55}h1{font-family:Archivo,Arial,sans-serif;color:#830051;font-size:30px;margin:0 0 4px}.k{font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.18em;color:#9AA3A0;text-transform:uppercase}h2{font-family:Archivo,Arial;color:#3F4444;font-size:19px;margin:30px 0 8px;border-bottom:2px solid #F0AB00;display:inline-block;padding-bottom:3px}h3{font-family:Archivo,Arial;color:#830051;font-size:14px;margin:18px 0 4px}p,li{font-size:14.5px;color:#3F4444}.tag{display:inline-block;background:#F6E9F1;color:#830051;border-radius:20px;padding:2px 10px;font-size:12px;font-weight:700;margin-right:6px}.bar{height:8px;background:#830051;margin:-48px -32px 32px}.foot{margin-top:40px;border-top:1px solid #D9D6D2;padding-top:12px;font-size:11px;color:#9AA3A0;font-family:'IBM Plex Mono',monospace}";
  const html = "<!DOCTYPE html><html><head><meta charset='utf-8'><title>DCOS Navigator — Guidance</title><style>" + css + "</style></head><body><div class='bar'></div>"
    + "<div class='k'>AstraZeneca · OBU DSAI</div><h1>DCOS Navigator — Guidance</h1>"
    + "<p>The Delivery &amp; Change Operating System is one place to run, govern, generate and learn across your portfolio. This guide explains the spaces and the working doctrine.</p>"
    + "<h2>The doctrine</h2><p><span class='tag'>Tailor to risk</span><span class='tag'>Honest amber</span><span class='tag'>Value visible</span><span class='tag'>Agents draft, humans decide</span></p>"
    + "<p>P80 is what you communicate upward; P50 is what you manage to. AI/tool-drafted artefacts are always reviewed and signed by the PM. Numbers trace to the Health Scan, Priority Lab and the systems of record — DCOS supports them, it never replaces them.</p>"
    + "<h2>The four jobs</h2>"
    + "<h3>▶ Run</h3><p>Portfolio &amp; RAG board, This Week, Workspace (Jira-like board with epics, resources and dates), Project Data, Delivery Canvas, Whiteboard.</p>"
    + "<h3>◆ Govern</h3><p>Review Pack (incl. Benefits portfolio &amp; budget roll-up), Health Scan, Priority Lab, Capacity &amp; Budget, Team &amp; AI, Governance Year, Timeline.</p>"
    + "<h3>▲ Generate</h3><p>PPT Studio (branded artefacts &amp; deck JSON/HTML), AI Advisor.</p>"
    + "<h3>● Learn</h3><p>Team Charter, Resources &amp; playbook.</p>"
    + "<h2>The six components of program management</h2><p>The jobs above are <i>how</i> you work; these are <i>what</i> a programme must cover. Each maps to where it lives in DCOS:</p>"
    + "<h3>1 · Governance &amp; control</h3><p>Tailoring wizard (tier &amp; gates), Review Pack, Priority Lab (WSJF), Governance Year. <span class='tag'>T01 Charter</span><span class='tag'>T04 Status</span><span class='tag'>T05 SteerCo</span></p>"
    + "<h3>2 · Stakeholder management</h3><p>Stakeholder map &amp; engagement, comms planning, generated from the Studio. <span class='tag'>T09 Stakeholders</span><span class='tag'>T11 Comms</span></p>"
    + "<h3>3 · Benefits management</h3><p>Benefits portfolio (Review Pack), value at risk, owners. <span class='tag'>T02 Business Case</span><span class='tag'>T13 Benefits Tracker</span></p>"
    + "<h3>4 · Planning &amp; delivery</h3><p>Workspace board, Plan/Gantt, Timeline, Delivery Canvas. <span class='tag'>T06 Plan</span><span class='tag'>T07 Board</span><span class='tag'>T15 Epic</span></p>"
    + "<h3>5 · Risk &amp; issue management</h3><p>RAID in Project Data, Health Scan, and the Knowledge Graph (similar risks across projects). <span class='tag'>T03 RAID</span></p>"
    + "<h3>6 · Resource &amp; financial management</h3><p>Capacity &amp; Budget (labour + non-labour, P50/P80), Team &amp; AI, board resources. <span class='tag'>CAI plan</span></p>"
    + "<h2>A programme manager's cadence</h2>"
    + "<h3>Every day</h3><p>Scan the Workspace board — what's blocked, what's due today (Dates view); triage any new risk/issue into RAID; a 30-second Advisor briefing on what needs attention.</p>"
    + "<h3>Every week</h3><p>Set the RAG honestly in Project Data (amber with options, not green theatre); read the Review Pack; check the capacity heatmap for overload; one stakeholder touchpoint; generate the T04 status one-pager from live data.</p>"
    + "<h3>Every two weeks</h3><p>Retro / day-30 hypothesis review; refresh the Knowledge Graph to catch shared resources and repeated risks; groom epics (T15) with a value hypothesis.</p>"
    + "<h3>Every month</h3><p>Run the Health Scan; take the SteerCo (T05) with decisions up front; review the Benefits portfolio with owners; check envelope vs P80; clear the governance gate.</p>"
    + "<h3>At each gate / quarter</h3><p>Re-run the tailoring wizard if scope shifted; on landing, produce the Closure &amp; Handover pack (T17) and hand benefits to the business to track.</p>"
    + "<h2>Knowledge Graph</h2><p>A live map of the portfolio. Filter by PM or project, then explore how each project connects to its risks, resources, benefits, decisions and logs. A resource on more than one project shows as a connector between them. Select a risk to reveal similar risks in other projects — so a single mitigation can be reused, and systemic issues surface.</p>"
    + "<h2>Getting started</h2><ol><li>Run the tailoring wizard on 2–3 live projects.</li><li>Work the board; read the Review Pack weekly, Health Scan monthly.</li><li>Open the Benefits portfolio at the SteerCo; generate the branded pack from live data.</li><li>Use the Knowledge Graph to spot shared resources and repeated risks across the portfolio.</li></ol>"
    + "<div class='foot'>AstraZeneca · OBU DSAI · DCOS Navigator · AI/tool-drafted, unconfirmed — review and sign</div></body></html>";
  const w = window.open("", "_blank");
  if (w) { w.document.write(html); w.document.close(); }
  else { const b = new Blob([html], { type: "text/html" }); window.open(URL.createObjectURL(b), "_blank"); }
}

const TEMPLATE_PACK = [
  ["Govern", "#830051", [
    ["T01", "Project Charter", ["Purpose & background", "In / out of scope", "Sponsor & PM", "Tier & governance", "Success criteria", "Key milestones"]],
    ["T02", "Business Case & Value Hypothesis", ["Problem & opportunity", "Value hypothesis (falsifiable)", "Benefits & owners", "Cost envelope P50 / P80", "Options considered", "Recommendation"]],
    ["T03", "RAID Log", ["Risk (cause \u2192 event \u2192 impact)", "Assumption", "Issue", "Dependency", "Owner & due", "Severity & next step"]],
    ["T04", "Status Report \u2014 RAG one-pager", ["Headline (written last)", "RAG by dimension", "Progress this period", "Risks & asks", "Decisions needed", "Next period"]],
    ["T05", "SteerCo Deck", ["Decisions needed (minute 10)", "Portfolio / project RAG", "Value & benefits", "Plan & milestones", "Risks & escalations", "Asks of the board"]],
    ["T08", "Decision Log", ["Decision", "Context & options", "Decider (single)", "Date", "Rationale", "Consequence"]]]],
  ["Deliver", "#003865", [
    ["T06", "Delivery Plan & Roadmap", ["Phases & gates", "Milestones & dates", "Dependencies", "Critical path", "Resource view", "Assumptions"]],
    ["T07", "Board Standard (JIRA)", ["Initiatives", "Epics (with value)", "Stories & states", "WIP limits", "Resource / assignee", "Due dates"]],
    ["T09", "Stakeholder Map & Engagement", ["Stakeholders", "Power / interest", "Current vs target stance", "Engagement actions", "Owner & cadence", "Risks to engagement"]],
    ["T14", "Retro & Lessons Canvas", ["What went well", "What didn't", "Surprises", "Lessons", "Actions & owners", "Day-30 hypothesis review"]],
    ["T15", "Feature / Epic One-pager", ["Problem & user", "Value hypothesis", "Scope & acceptance", "Instrumentation / telemetry", "Dependencies", "Definition of done"]],
    ["T16", "Discovery / Brainstorm Canvas", ["Problem framing", "Ideas (diverge)", "Cluster & themes", "Promote \u2192 risk / epic / decision", "Owners", "Next steps"]]]],
  ["Change", "#8A6200", [
    ["T10", "Change Impact Assessment", ["Change description", "Impacted groups", "Process / system / people", "Severity & readiness", "Mitigations", "Owner & date"]],
    ["T11", "Comms & Engagement Plan", ["Audiences", "Key messages", "Channels", "Timeline / moments", "Owner", "Feedback loop"]],
    ["T12", "Adoption & Readiness Dashboard", ["Adoption metrics", "Readiness by group", "Training & support", "Leading indicators", "Risks to adoption", "Actions"]]]],
  ["Value", "#5E7A00", [
    ["T13", "Benefits & Value Tracker", ["Benefit & baseline", "Target & measure", "Owner (business)", "Status (on track / at risk)", "Value at risk", "Realisation date"]],
    ["T17", "Closure & Handover Pack", ["Final spend vs envelope", "What shipped", "Keep / change / stop", "Run / BAU owner", "Benefits to track", "Lessons to next"]]]],
];

function packCatalogHtml() {
  const rows = TEMPLATE_PACK.map(([job, col, items]) =>
    `<div style='font-family:Arial;font-weight:800;font-size:14px;margin:22px 0 6px;padding:4px 12px;border-radius:20px;color:#fff;display:inline-block;background:${col}'>${job.toUpperCase()}</div>`
    + items.map(([code, name, secs]) =>
      `<div style='padding:8px 4px;border-bottom:1px solid #EFEDEA'><span style='font-family:Courier New;font-weight:700;color:${col}'>${code}</span> <b>${name}</b><br><span style='font-size:11px;color:#6B6B6B'>${secs.join(" \u00b7 ")}</span></div>`).join("")).join("");
  return `<!DOCTYPE html><html><head><meta charset='utf-8'><title>DCOS Template Pack</title></head><body style='font-family:Calibri,Arial,sans-serif;color:#1C2222;max-width:860px;margin:0 auto;padding:40px 30px'><div style='height:8px;background:#830051;margin:-40px -30px 28px'></div><div style='font-family:Courier New;font-size:11px;letter-spacing:.18em;color:#9AA3A0'>ASTRAZENECA \u00b7 OBU DSAI</div><h1 style='font-family:Arial;color:#830051;margin:2px 0 14px'>DCOS Template Pack</h1><p>17 AZ templates across the four jobs. Generate populated versions from live data in the Studio.</p>${rows}<p style='margin-top:30px;font-family:Courier New;font-size:11px;color:#9AA3A0'>AI/tool-drafted, unconfirmed \u2014 review and sign</p></body></html>`;
}

async function downloadTemplatePack(setBusy, setErr) {
  setErr(null); setBusy(true);
  try {
    const PptxGenJS = await loadPptx();
    const pptx = new PptxGenJS();
    pptx.layout = "LAYOUT_WIDE"; pptx.author = "DCOS Navigator";
    const meta = { name: "DCOS", code: "Template Pack", tier: "\u2014", phase: "all jobs" };
    // cover
    const cv = pptx.addSlide();
    azFrame(pptx, cv, "AstraZeneca \u00b7 OBU DSAI", "DCOS Template", "Pack", meta);
    cv.addText("17 AZ templates across the four jobs \u2014 each slide is a fill-in structure. Generate populated versions from live data in the Studio.", { x: 0.57, y: 2.1, w: 11.5, h: 0.6, fontFace: "Calibri", fontSize: 15, color: AZ.mid });
    TEMPLATE_PACK.forEach(([job, colHex]) => {
      const col = colHex.replace("#", "");
      cv.addText("\u25A0 " + job, { x: 0.57 + ["Govern", "Deliver", "Change", "Value"].indexOf(job) * 3.05, y: 3.1, w: 2.9, h: 0.4, fontFace: "Arial", fontSize: 15, bold: true, color: col });
    });
    // one slide per template \u2014 varied structures matching Template Pack v3
    const LAYOUT = { T03: "table", T08: "table", T10: "table", T11: "table", T13: "table",
                     T02: "cols", T14: "cols", T17: "cols", T07: "cols4", T06: "timeline", T09: "matrix" };
    const fillIn = (s, x, y, w) => s.addText("\u2014 fill in \u2014", { x, y, w, h: 0.3, fontFace: "Calibri", fontSize: 10.5, italic: true, color: "9AA3A0" });
    TEMPLATE_PACK.forEach(([job, colHex, items]) => {
      const col = colHex.replace("#", "");
      items.forEach(([code, name, secs]) => {
        const s = pptx.addSlide();
        azFrame(pptx, s, code + " \u00b7 " + job, name, "\u2014 template", meta);
        const kind = LAYOUT[code] || "grid";
        if (kind === "table") {
          const heads = secs.slice(0, 5), W = 12.23, cw = W / heads.length, y0 = 2.0;
          s.addShape(pptx.shapes.RECTANGLE, { x: 0.55, y: y0, w: W, h: 0.5, fill: { color: col } });
          heads.forEach((hh, i) => s.addText(hh.toUpperCase(), { x: 0.55 + i * cw + 0.1, y: y0, w: cw - 0.2, h: 0.5, fontFace: "Courier New", fontSize: 8.5, bold: true, color: "FFFFFF", valign: "middle" }));
          for (let r = 0; r < 7; r++)
            s.addShape(pptx.shapes.RECTANGLE, { x: 0.55, y: y0 + 0.5 + r * 0.62, w: W, h: 0.62, fill: { color: r % 2 ? "FBFAF9" : "FFFFFF" }, line: { color: "D9D6D2", width: 0.5 } });
        } else if (kind === "cols" || kind === "cols4") {
          const n = kind === "cols4" ? 4 : 3, gap = 0.25, cw = (12.23 - gap * (n - 1)) / n;
          for (let i = 0; i < n; i++) {
            const cx = 0.55 + i * (cw + gap);
            s.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: cx, y: 2.0, w: cw, h: 4.6, rectRadius: 0.06, fill: { color: "F6F4F2" } });
            s.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: cx, y: 2.0, w: cw, h: 0.5, rectRadius: 0.06, fill: { color: col } });
            s.addText(secs[i] || "", { x: cx + 0.15, y: 2.0, w: cw - 0.3, h: 0.5, fontFace: "Arial", fontSize: 11.5, bold: true, color: "FFFFFF", valign: "middle" });
            [0, 1, 2].forEach(j => fillIn(s, cx + 0.2, 2.75 + j * 0.55, cw - 0.4));
          }
        } else if (kind === "timeline") {
          const phases = ["Mobilise", "Build", "Pilot", "Scale", "Embed"], W = 11.9, seg = W / 5, y = 2.7;
          s.addShape(pptx.shapes.RECTANGLE, { x: 0.7, y: y + 0.1, w: W, h: 0.06, fill: { color: "D9D6D2" } });
          phases.forEach((ph, i) => {
            const cx = 0.7 + i * seg + seg / 2;
            s.addShape(pptx.shapes.OVAL, { x: cx - 0.12, y, w: 0.24, h: 0.24, fill: { color: col } });
            s.addText(ph, { x: cx - seg / 2 + 0.1, y: y - 0.6, w: seg - 0.2, h: 0.45, fontFace: "Arial", fontSize: 12, bold: true, color: "1C2222", align: "center" });
            s.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: cx - seg / 2 + 0.2, y: y + 0.5, w: seg - 0.4, h: 1.6, rectRadius: 0.06, fill: { color: "FFFFFF" }, line: { color: "D9D6D2", width: 0.75 } });
            fillIn(s, cx - seg / 2 + 0.35, y + 1.1, seg - 0.7);
          });
          s.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.7, y: y + 2.4, w: W, h: 1.2, rectRadius: 0.06, fill: { color: "F6F4F2" } });
          s.addText("Dependencies & critical path \u2014 fill in", { x: 0.9, y: y + 2.55, w: W - 0.4, h: 0.4, fontFace: "Arial", fontSize: 12, bold: true, color: "3F4444" });
        } else if (kind === "matrix") {
          const x0 = 2.2, y0 = 1.95, sz = 4.5;
          s.addShape(pptx.shapes.RECTANGLE, { x: x0, y: y0, w: sz, h: sz, fill: { color: "FFFFFF" }, line: { color: "D9D6D2", width: 1 } });
          s.addShape(pptx.shapes.RECTANGLE, { x: x0 + sz / 2, y: y0, w: 0.02, h: sz, fill: { color: "D9D6D2" } });
          s.addShape(pptx.shapes.RECTANGLE, { x: x0, y: y0 + sz / 2, w: sz, h: 0.02, fill: { color: "D9D6D2" } });
          [["Keep satisfied", 0, 0], ["Manage closely", 1, 0], ["Monitor", 0, 1], ["Keep informed", 1, 1]].forEach(([q, qx, qy]) =>
            s.addText(q, { x: x0 + qx * sz / 2 + 0.12, y: y0 + qy * sz / 2 + 0.08, w: sz / 2 - 0.2, h: 0.35, fontFace: "Arial", fontSize: 11, bold: true, color: col }));
          s.addText("INTEREST \u2192", { x: x0, y: y0 + sz + 0.08, w: sz, h: 0.3, fontFace: "Courier New", fontSize: 9.5, bold: true, color: "6B6B6B", align: "center" });
          s.addText("\u2191 POWER", { x: x0 - 1.6, y: y0 + sz / 2 - 0.15, w: 1.4, h: 0.3, fontFace: "Courier New", fontSize: 9.5, bold: true, color: "6B6B6B", align: "center" });
          s.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: x0 + sz + 0.4, y: y0, w: 4.0, h: sz, rectRadius: 0.06, fill: { color: "F6F4F2" } });
          s.addText("Actions by quadrant \u2014 who \u00b7 what \u00b7 by when", { x: x0 + sz + 0.6, y: y0 + 0.2, w: 3.6, h: 0.8, fontFace: "Arial", fontSize: 11.5, bold: true, color: "3F4444" });
        } else {
          secs.slice(0, 6).forEach((sec, i) => {
            const cw = (12.23 - 0.4) / 3, ch = 2.45;
            const x = 0.55 + (i % 3) * (cw + 0.2), y = 2.0 + Math.floor(i / 3) * (ch + 0.2);
            s.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x, y, w: cw, h: ch, rectRadius: 0.06, fill: { color: "FFFFFF" }, line: { color: "D9D6D2", width: 0.75 } });
            s.addShape(pptx.shapes.RECTANGLE, { x, y, w: 0.09, h: ch, fill: { color: col } });
            s.addText(sec, { x: x + 0.22, y: y + 0.12, w: cw - 0.4, h: 0.55, fontFace: "Arial", fontSize: 12.5, bold: true, color: "1C2222" });
            fillIn(s, x + 0.22, y + 0.7, cw - 0.4);
          });
        }
      });
    });
    await pptx.writeFile({ fileName: `DCOS_Template_Pack_${today()}.pptx` });
  } catch (e) {
    dl("DCOS_Template_Pack_Catalog.html", packCatalogHtml(), "text/html");
    setErr("The PPT engine couldn't load here (offline / blocked CDN), so I downloaded the pack catalog as HTML instead. On joaco.org or the corporate deployment the native .pptx generates locally.");
  }
  setBusy(false);
}

function IntroPage({ setTab }) {
  const [packBusy, setPackBusy] = useState(false);
  const [packErr, setPackErr] = useState(null);
  const card = (accent, kicker, title, body, cta, onClick) => (
    <div onClick={onClick} style={{ flex: 1, minWidth: 260, background: "#fff", border: `1px solid ${C.line}`, borderTop: `4px solid ${accent}`, borderRadius: 14, padding: "24px 26px", cursor: "pointer", transition: "box-shadow .15s" }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 8px 26px rgba(0,0,0,.10)"} onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
      <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".16em", color: accent, textTransform: "uppercase" }}>{kicker}</div>
      <div style={{ fontFamily: DISP, fontWeight: 800, fontSize: 20, color: C.ink, marginTop: 6 }}>{title}</div>
      <div style={{ fontSize: 13.5, color: C.mid, marginTop: 10, lineHeight: 1.5 }}>{body}</div>
      <div style={{ marginTop: 16, display: "inline-block", background: accent, color: "#fff", borderRadius: 8, padding: "9px 16px", fontFamily: DISP, fontWeight: 700, fontSize: 13 }}>{cta}</div>
    </div>
  );
  return (
    <div>
      <div style={{ background: C.graph, borderRadius: 16, padding: "38px 40px", color: "#fff", marginBottom: 22 }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".2em", color: C.gold }}>ASTRAZENECA · OBU DSAI</div>
        <div style={{ fontFamily: DISP, fontWeight: 800, fontSize: 34, marginTop: 8 }}>DCOS <span style={{ color: C.gold }}>Navigator</span></div>
        <div style={{ fontSize: 17, color: "#D7DCDA", marginTop: 10, maxWidth: 760 }}>One cockpit to run, govern, generate and learn across the portfolio — tailored to risk, with value made visible and agents that draft what humans decide.</div>
      </div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {card(C.mul, "Read first", "Guidance document", "The working doctrine, the four jobs, every space, and how to get started — as a printable HTML you can share.", "Open guidance ↗", openGuidance)}
        {card(C.navy, "Explore", "Knowledge graph", "A live map of the portfolio: how projects connect to their risks, resources, benefits and logs — and where risks repeat across projects.", "Open the graph →", () => setTab("graph"))}
        {card(C.lime, "Jump in", "Portfolio board", "Go straight to the RAG board — every project, comparable at a glance, with WSJF priority and value vs effort.", "Go to portfolio →", () => setTab("portfolio"))}
      </div>
      <div style={{ marginTop: 22, fontSize: 12, color: C.faint, fontFamily: MONO }}>Tip: the Knowledge Graph is also the fastest way to find a shared resource or a recurring risk across teams.</div>
      <div style={{ marginTop: 24 }}>
        <div style={{ fontFamily: DISP, fontWeight: 800, fontSize: 15, color: C.ink, marginBottom: 4 }}>Program management map</div>
        <div style={{ fontSize: 12.5, color: C.mid, marginBottom: 12 }}>The six components a programme must cover — and where each lives in DCOS.</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
          {[
            ["1 · Governance & control", C.mul, "Wizard · Review Pack · Priority Lab · Governance Year"],
            ["2 · Stakeholder management", C.navy, "Stakeholder map (T09) · Comms plan (T11) — via Studio"],
            ["3 · Benefits management", C.lime, "Benefits portfolio · Value tracker (T13) · Business case (T02)"],
            ["4 · Planning & delivery", "#8A6200", "Workspace board · Plan/Gantt · Timeline · Delivery Canvas"],
            ["5 · Risk & issue management", C.red, "RAID (Project Data) · Health Scan · Knowledge Graph"],
            ["6 · Resource & financial mgmt", C.graph, "Capacity & Budget (P50/P80) · Team & AI · board resources"],
          ].map(([t, col, body]) => (
            <div key={t} style={{ background: "#fff", border: `1px solid ${C.line}`, borderLeft: `4px solid ${col}`, borderRadius: 12, padding: "13px 15px" }}>
              <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 13, color: col }}>{t}</div>
              <div style={{ fontSize: 12, color: C.mid, marginTop: 6, lineHeight: 1.4 }}>{body}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ marginTop: 24 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
          <div style={{ fontFamily: DISP, fontWeight: 800, fontSize: 15, color: C.ink }}>DCOS Template Pack</div>
          <button onClick={() => downloadTemplatePack(setPackBusy, setPackErr)} disabled={packBusy}
            style={{ border: "none", background: C.mul, color: "#fff", borderRadius: 8, padding: "7px 14px", fontFamily: DISP, fontWeight: 700, fontSize: 12, cursor: "pointer", opacity: packBusy ? 0.6 : 1 }}>
            {packBusy ? "Building\u2026" : "\u2B07 Template Pack (PPTX)"}
          </button>
        </div>
        <div style={{ fontSize: 12.5, color: C.mid, margin: "4px 0 12px" }}>17 AZ fill-in templates across the four jobs \u2014 native PowerPoint, built in your browser. Generate populated versions from live data in the Studio.</div>
        {packErr && <div style={{ background: C.goldLt, border: `1px solid ${C.gold}`, borderRadius: 10, padding: "10px 14px", fontSize: 12, color: C.ink, marginBottom: 12 }}>{packErr}</div>}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 12 }}>
          {TEMPLATE_PACK.map(([job, col, items]) => (
            <div key={job} style={{ background: "#fff", border: `1px solid ${C.line}`, borderTop: `3px solid ${col}`, borderRadius: 12, padding: "13px 15px" }}>
              <div style={{ fontFamily: DISP, fontWeight: 800, fontSize: 12.5, color: col }}>{job.toUpperCase()}</div>
              <div style={{ marginTop: 8 }}>
                {items.map(([code, name]) => (
                  <div key={code} style={{ fontSize: 11.5, color: C.ink, margin: "3px 0" }}>
                    <span style={{ fontFamily: MONO, fontWeight: 700, color: col }}>{code}</span> {name}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   Knowledge Graph — projects ↔ risks / resources / benefits / logs / decisions
   ========================================================================== */
function KnowledgeGraph({ projects, people, assignments, setSel, setTab }) {
  const [pmF, setPmF] = useState("all");
  const [copiedId, setCopiedId] = useState(null);
  const [projF, setProjF] = useState("all");
  const [show, setShow] = useState({ risks: true, resources: true, benefits: true, logs: false, decisions: false });
  const [node, setNode] = useState(null);
  const [, bump] = useReducer(x => (x + 1) % 1000000, 0);

  const W = 900, H = 600;
  const NODE = { project: C.mul, risk: C.red, resource: C.navy, benefit: C.lime, decision: "#8A6200", log: C.graph };
  const RAD = { project: 24, resource: 12, risk: 10, benefit: 10, decision: 10, log: 9 };

  const pms = [...new Set(projects.map(p => p.pm).filter(Boolean))];

  // ---------- build graph (nodes + links) from current filters ----------
  const graph = useMemo(() => {
    let vis = projects.filter(p => pmF === "all" || p.pm === pmF);
    if (projF !== "all") vis = vis.filter(p => p.id === projF);
    const nodes = [], links = [];
    const nodeById = {};
    const add = nd => { nodes.push(nd); nodeById[nd.id] = nd; return nd; };
    vis.forEach(p => add({ id: "P:" + p.id, kind: "project", label: p.code || p.name, sub: p.name, data: p, r: RAD.project }));
    // resources deduped per person (shared person => single node linked to each project)
    const personNode = {};
    vis.forEach(p => {
      if (show.resources) {
        assignments.filter(a => a.projectId === p.id).forEach(a => {
          const per = people.find(x => x.id === a.personId); if (!per) return;
          let rn = personNode[per.id];
          if (!rn) { rn = add({ id: "R:" + per.id, kind: "resource", label: per.name, data: per, r: RAD.resource, projs: [] }); personNode[per.id] = rn; }
          rn.projs.push(p.id);
          links.push({ s: "P:" + p.id, t: rn.id, kind: "resource" });
        });
      }
      if (show.risks) (p.keydata?.risks || []).forEach(rk => { const id = "K:" + p.id + ":" + rk.id; add({ id, kind: "risk", label: rk.desc || rk.title || "risk", data: rk, projId: p.id, projName: p.name, r: RAD.risk }); links.push({ s: "P:" + p.id, t: id, kind: "risk" }); });
      if (show.benefits) (p.keydata?.benefits || []).forEach(b => { const id = "B:" + p.id + ":" + b.id; add({ id, kind: "benefit", label: b.name, data: b, r: RAD.benefit }); links.push({ s: "P:" + p.id, t: id, kind: "benefit" }); });
      if (show.decisions) (p.keydata?.decisions || []).forEach(d => { const id = "D:" + p.id + ":" + d.id; add({ id, kind: "decision", label: d.text, data: d, r: RAD.decision }); links.push({ s: "P:" + p.id, t: id, kind: "decision" }); });
      if (show.logs) (p.events || []).slice(-4).forEach((e, i) => { const id = "L:" + p.id + ":" + i; add({ id, kind: "log", label: e.title, data: e, r: RAD.log }); links.push({ s: "P:" + p.id, t: id, kind: "log" }); });
    });
    // risk token sets for similarity
    const STOP = new Set("the and for with that this from because may leading lower scope team capacity pending will project delay risk could would been have into when over more less than each their there which while".split(" "));
    const tok = s => [...new Set(String(s || "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(w => w.length > 3 && !STOP.has(w)))];
    nodes.forEach(n => { if (n.kind === "risk") n.toks = tok(n.data.desc || n.data.title || n.data.cause); });
    const shared = nodes.filter(n => n.kind === "resource" && n.projs && n.projs.length > 1).length;
    return { nodes, links, nodeById, visCount: vis.length, riskCount: nodes.filter(n => n.kind === "risk").length, shared };
  }, [pmF, projF, show, projects, people, assignments]);

  // similar risks for the selected risk
  const simIds = useMemo(() => {
    if (!node || node.kind !== "risk") return new Set();
    const me = graph.nodes.find(n => n.id === node.id) || node;
    const out = new Set();
    graph.nodes.forEach(o => { if (o.kind === "risk" && o.id !== me.id && o.projId !== me.projId && (o.toks || []).filter(t => (me.toks || []).includes(t)).length >= 2) out.add(o.id); });
    return out;
  }, [node, graph]);
  const similarList = useMemo(() => {
    if (!node || node.kind !== "risk") return [];
    const me = graph.nodes.find(n => n.id === node.id) || node;
    return graph.nodes.filter(o => simIds.has(o.id)).map(o => ({ id: o.id, projName: o.projName, desc: o.data.desc || o.data.title || "", owner: o.data.owner || "", shared: (o.toks || []).filter(t => (me.toks || []).includes(t)) }));
  }, [node, simIds, graph]);

  // ---------- physics state (persisted across renders) ----------
  const sim = useRef({ pos: new Map(), alpha: 1, raf: 0, drag: null, running: false });
  const view = useRef({ k: 1, tx: 0, ty: 0 });
  const svgRef = useRef(null);
  const pan = useRef(null);

  // sync node set into the position map; seed new nodes; drop stale; re-heat
  useEffect(() => {
    const pos = sim.current.pos;
    const present = new Set(graph.nodes.map(n => n.id));
    [...pos.keys()].forEach(id => { if (!present.has(id)) pos.delete(id); });
    graph.nodes.forEach((n, i) => {
      if (!pos.has(n.id)) {
        // seed: projects on a ring, satellites near their project (or center)
        let sx = W / 2, sy = H / 2;
        if (n.kind === "project") { const pi = graph.nodes.filter(x => x.kind === "project").indexOf(n); const pc = graph.nodes.filter(x => x.kind === "project").length; const a = -Math.PI / 2 + 2 * Math.PI * pi / Math.max(pc, 1); sx = W / 2 + 150 * Math.cos(a); sy = H / 2 + 150 * Math.sin(a); }
        else { const link = graph.links.find(l => l.t === n.id); const pp = link && pos.get(link.s); sx = (pp ? pp.x : W / 2) + (Math.random() - 0.5) * 80; sy = (pp ? pp.y : H / 2) + (Math.random() - 0.5) * 80; }
        pos.set(n.id, { x: sx, y: sy, vx: 0, vy: 0 });
      }
    });
    reheat();
    return () => cancelAnimationFrame(sim.current.raf);
    // eslint-disable-next-line
  }, [graph]);

  function reheat() {
    sim.current.alpha = Math.max(sim.current.alpha, 0.9);
    if (!sim.current.running) { sim.current.running = true; sim.current.raf = requestAnimationFrame(tick); }
  }

  function tick() {
    const s = sim.current, pos = s.pos, nodes = graph.nodes, links = graph.links;
    const a = s.alpha;
    // charge (repulsion) — O(n^2), n is small
    for (let i = 0; i < nodes.length; i++) {
      const A = pos.get(nodes[i].id); if (!A) continue;
      for (let j = i + 1; j < nodes.length; j++) {
        const B = pos.get(nodes[j].id); if (!B) continue;
        let dx = A.x - B.x, dy = A.y - B.y, d2 = dx * dx + dy * dy || 0.01;
        const d = Math.sqrt(d2);
        const rep = (nodes[i].kind === "project" || nodes[j].kind === "project" ? 5200 : 2200) / d2;
        const fx = (dx / d) * rep * a, fy = (dy / d) * rep * a;
        A.vx += fx; A.vy += fy; B.vx -= fx; B.vy -= fy;
      }
    }
    // links (spring)
    links.forEach(l => {
      const A = pos.get(l.s), B = pos.get(l.t); if (!A || !B) return;
      const tgt = l.kind === "resource" ? 78 : 64;
      let dx = B.x - A.x, dy = B.y - A.y, d = Math.sqrt(dx * dx + dy * dy) || 0.01;
      const f = (d - tgt) / d * 0.05 * a;
      const fx = dx * f, fy = dy * f;
      A.vx += fx; A.vy += fy; B.vx -= fx; B.vy -= fy;
    });
    // centering gravity + integrate
    nodes.forEach(n => {
      const P = pos.get(n.id); if (!P) return;
      if (s.drag === n.id) { P.x = s.dragX; P.y = s.dragY; P.vx = 0; P.vy = 0; return; }
      P.vx += (W / 2 - P.x) * 0.006 * a;
      P.vy += (H / 2 - P.y) * 0.006 * a;
      P.vx *= 0.86; P.vy *= 0.86;
      P.x += P.vx; P.y += P.vy;
      P.x = Math.max(20, Math.min(W - 20, P.x)); P.y = Math.max(20, Math.min(H - 20, P.y));
    });
    s.alpha *= 0.975;
    bump();
    if (s.alpha > 0.02 || s.drag) s.raf = requestAnimationFrame(tick);
    else s.running = false;
  }

  // ---------- pointer: zoom / pan / drag ----------
  const toGraph = (clientX, clientY) => {
    const r = svgRef.current.getBoundingClientRect();
    const sx = (clientX - r.left) * (W / r.width), sy = (clientY - r.top) * (H / r.height);
    const v = view.current;
    return { x: (sx - v.tx) / v.k, y: (sy - v.ty) / v.k };
  };
  const onWheel = e => {
    e.preventDefault();
    const r = svgRef.current.getBoundingClientRect();
    const sx = (e.clientX - r.left) * (W / r.width), sy = (e.clientY - r.top) * (H / r.height);
    const v = view.current; const f = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    const nk = Math.max(0.4, Math.min(3.5, v.k * f));
    v.tx = sx - (sx - v.tx) * (nk / v.k); v.ty = sy - (sy - v.ty) * (nk / v.k); v.k = nk;
    bump();
  };
  const onNodeDown = (e, n) => {
    e.stopPropagation();
    const g = toGraph(e.clientX, e.clientY);
    sim.current.drag = n.id; sim.current.dragX = g.x; sim.current.dragY = g.y;
    reheat();
    const move = ev => { const gg = toGraph(ev.clientX, ev.clientY); sim.current.dragX = gg.x; sim.current.dragY = gg.y; };
    const up = () => { sim.current.drag = null; window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); reheat(); };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
  };
  const onBgDown = e => {
    const v = view.current; pan.current = { x: e.clientX, y: e.clientY, tx: v.tx, ty: v.ty };
    const move = ev => { const r = svgRef.current.getBoundingClientRect(); const sc = W / r.width; v.tx = pan.current.tx + (ev.clientX - pan.current.x) * sc; v.ty = pan.current.ty + (ev.clientY - pan.current.y) * sc; bump(); };
    const up = () => { pan.current = null; window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
  };
  const zoomBy = f => { const v = view.current; const nk = Math.max(0.4, Math.min(3.5, v.k * f)); const cx = W / 2, cy = H / 2; v.tx = cx - (cx - v.tx) * (nk / v.k); v.ty = cy - (cy - v.ty) * (nk / v.k); v.k = nk; bump(); };
  const resetView = () => { view.current = { k: 1, tx: 0, ty: 0 }; reheat(); };

  const pos = sim.current.pos;
  const v = view.current;
  const selRisk = node?.kind === "risk" ? node : null;

  const filt = (k, label) => (
    <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, color: C.ink, cursor: "pointer", marginBottom: 6 }}>
      <input type="checkbox" checked={show[k]} onChange={e => setShow({ ...show, [k]: e.target.checked })} />
      <span style={{ width: 9, height: 9, borderRadius: "50%", background: NODE[k === "risks" ? "risk" : k === "resources" ? "resource" : k === "benefits" ? "benefit" : k === "decisions" ? "decision" : "log"] }} />{label}
    </label>
  );
  const ctrlBtn = (txt, on, title) => <button onClick={on} title={title} style={{ border: `1px solid ${C.line}`, background: "#fff", borderRadius: 7, width: 30, height: 28, cursor: "pointer", color: C.graph, fontSize: 14, fontWeight: 700, lineHeight: 1 }}>{txt}</button>;

  return (
    <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
      {/* left filters */}
      <div style={{ flex: "0 0 220px", minWidth: 200 }}>
        <Card>
          <SectionLabel color={C.navy}>Filters</SectionLabel>
          <div style={{ fontFamily: MONO, fontSize: 9.5, color: C.faint, textTransform: "uppercase", letterSpacing: ".08em", margin: "6px 0 3px" }}>PM</div>
          <select value={pmF} onChange={e => { setPmF(e.target.value); setProjF("all"); setNode(null); }} style={{ width: "100%", border: `1px solid ${C.line}`, borderRadius: 7, padding: "8px 9px", fontSize: 12.5, background: "#fff", color: C.ink }}>
            <option value="all">All PMs</option>
            {pms.map(pm => <option key={pm} value={pm}>{pm}</option>)}
          </select>
          <div style={{ fontFamily: MONO, fontSize: 9.5, color: C.faint, textTransform: "uppercase", letterSpacing: ".08em", margin: "12px 0 3px" }}>Project</div>
          <select value={projF} onChange={e => { setProjF(e.target.value); setNode(null); }} style={{ width: "100%", border: `1px solid ${C.line}`, borderRadius: 7, padding: "8px 9px", fontSize: 12.5, background: "#fff", color: C.ink }}>
            <option value="all">All projects</option>
            {projects.filter(p => pmF === "all" || p.pm === pmF).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <div style={{ height: 1, background: C.soft, margin: "14px 0" }} />
          <div style={{ fontFamily: MONO, fontSize: 9.5, color: C.faint, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>Show on graph</div>
          {filt("risks", "Risks")}{filt("resources", "Resources")}{filt("benefits", "Benefits")}{filt("decisions", "Decisions")}{filt("logs", "Logs")}
          <div style={{ height: 1, background: C.soft, margin: "12px 0" }} />
          <div style={{ fontSize: 11, color: C.mid, lineHeight: 1.45 }}><b style={{ color: C.ink }}>{graph.visCount}</b> project(s) · <b style={{ color: C.ink }}>{graph.riskCount}</b> risk(s)</div>
          {graph.shared > 0 && <div style={{ fontSize: 11, color: C.navy, marginTop: 6, lineHeight: 1.4 }}>◢ {graph.shared} resource(s) shared across projects</div>}
          <div style={{ fontSize: 10.5, color: C.faint, marginTop: 10, lineHeight: 1.4 }}>Drag nodes to rearrange · scroll to zoom · drag background to pan.</div>
        </Card>
      </div>

      {/* graph */}
      <div style={{ flex: "1 1 520px", minWidth: 360 }}>
        <Card style={{ padding: 6, position: "relative" }}>
          <div style={{ position: "absolute", top: 12, right: 12, display: "flex", gap: 6, zIndex: 2 }}>
            {ctrlBtn("+", () => zoomBy(1.2), "Zoom in")}
            {ctrlBtn("−", () => zoomBy(1 / 1.2), "Zoom out")}
            {ctrlBtn("⟲", resetView, "Reset view & re-layout")}
          </div>
          <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} onWheel={onWheel} onPointerDown={onBgDown}
               style={{ width: "100%", height: "auto", display: "block", background: "#fff", borderRadius: 10, cursor: pan.current ? "grabbing" : "grab", touchAction: "none" }}>
            <g transform={`translate(${v.tx} ${v.ty}) scale(${v.k})`}>
              {/* shared-resource: links already connect resource node to each project */}
              {/* edges */}
              {graph.links.map((l, i) => {
                const A = pos.get(l.s), B = pos.get(l.t); if (!A || !B) return null;
                const hot = selRisk && (l.t === selRisk.id);
                return <line key={"e" + i} x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={hot ? C.red : l.kind === "resource" ? C.navy : C.line} strokeWidth={hot ? 1.8 : l.kind === "resource" ? 1.1 : 0.8} opacity={l.kind === "resource" ? 0.5 : 0.6} />;
              })}
              {/* similar-risk connectors */}
              {selRisk && [...simIds].map(id => { const A = pos.get(selRisk.id), B = pos.get(id); if (!A || !B) return null; return <line key={"sim" + id} x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={C.red} strokeWidth="1.8" strokeDasharray="5 4" opacity="0.85" />; })}
              {/* nodes */}
              {graph.nodes.map(n => {
                const P = pos.get(n.id); if (!P) return null;
                const on = node && node.id === n.id;
                const hot = simIds.has(n.id);
                const dim = selRisk && n.kind === "risk" && !hot && !on;
                const col = NODE[n.kind];
                const r = n.r * (hot ? 1.3 : 1);
                return (
                  <g key={n.id} transform={`translate(${P.x} ${P.y})`} style={{ cursor: "pointer" }}
                     onPointerDown={e => onNodeDown(e, n)} onClick={e => { e.stopPropagation(); setNode({ id: n.id, kind: n.kind, data: n.data, projId: n.projId }); }}>
                    <circle r={r} fill={col} stroke={on ? C.gold : hot ? C.red : "#fff"} strokeWidth={on ? 3 : hot ? 2.5 : 1.5} opacity={dim ? 0.4 : 1} />
                    {n.kind === "project"
                      ? <text textAnchor="middle" y={4} fontSize="10.5" fontWeight="700" fill="#fff" fontFamily="Archivo, Arial" style={{ pointerEvents: "none" }}>{String(n.label).slice(0, 6)}</text>
                      : null}
                    <text textAnchor="middle" y={n.kind === "project" ? r + 14 : -(r + 5)} fontSize={n.kind === "project" ? "10.5" : "8.5"} fill={n.kind === "project" ? C.ink : C.mid} fontFamily="Inter" style={{ pointerEvents: "none", opacity: dim ? 0.4 : 1 }}>{String(n.sub || n.label).slice(0, n.kind === "project" ? 22 : 16)}</text>
                  </g>
                );
              })}
            </g>
          </svg>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", padding: "6px 10px 8px" }}>
            {Object.entries({ Project: NODE.project, Risk: NODE.risk, Resource: NODE.resource, Benefit: NODE.benefit, Decision: NODE.decision, Log: NODE.log }).map(([k, c]) => (
              <span key={k} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: C.mid }}><span style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />{k}</span>
            ))}
          </div>
        </Card>
      </div>

      {/* right detail panel */}
      <div style={{ flex: "0 0 260px", minWidth: 230 }}>
        <Card>
          {!node ? (
            <div style={{ color: C.mid, fontSize: 13 }}><SectionLabel color={C.mul}>Detail</SectionLabel>Click any node to inspect it. Click a <b style={{ color: C.red }}>risk</b> to reveal similar risks in other projects. Drag to rearrange, scroll to zoom.</div>
          ) : node.kind === "project" ? (
            <div>
              <SectionLabel color={C.mul}>{node.data.code} · Project</SectionLabel>
              <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 16, color: C.ink }}>{node.data.name}</div>
              <div style={{ fontSize: 12.5, color: C.mid, marginTop: 6 }}>PM: {node.data.pm || "—"} · Tier {node.data.tier || "—"} · {node.data.phase || "—"}</div>
              <div style={{ fontSize: 12.5, color: C.ink, marginTop: 8 }}>{node.data.keydata?.headline || ""}</div>
              <button onClick={() => { setSel(node.data.id); setTab("data"); }} style={{ marginTop: 14, width: "100%", background: C.mul, color: "#fff", border: "none", borderRadius: 8, padding: "9px", fontFamily: DISP, fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>Open in Project Data →</button>
            </div>
          ) : node.kind === "risk" ? (
            <div>
              <SectionLabel color={C.red}>Risk</SectionLabel>
              <div style={{ fontSize: 13, color: C.ink, lineHeight: 1.4 }}>{node.data.desc || node.data.title || node.data.cause}</div>
              <div style={{ fontSize: 12, color: C.mid, marginTop: 8 }}>Owner: {node.data.owner || "—"}{node.data.due ? ` · due ${node.data.due}` : ""}</div>
              <div style={{ marginTop: 12 }}>
                <div style={{ fontFamily: MONO, fontSize: 9.5, color: C.faint, textTransform: "uppercase", letterSpacing: ".08em" }}>Similar risks elsewhere ({similarList.length})</div>
                {similarList.length === 0 ? <div style={{ fontSize: 12, color: C.mid, marginTop: 6 }}>None detected across the visible projects.</div> :
                  similarList.map(s => (
                    <div key={s.id} onClick={() => { const tn = graph.nodes.find(n => n.id === s.id); if (tn) setNode({ id: tn.id, kind: "risk", data: tn.data, projId: tn.projId }); }} style={{ marginTop: 8, padding: "7px 9px", background: C.redLt || "#F8E9E8", borderRadius: 8, cursor: "pointer" }}>
                      <div style={{ fontFamily: MONO, fontSize: 9, color: C.red, fontWeight: 700 }}>{s.projName}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const txt = `${s.desc || ""} — owner: ${s.owner || "?"} · seen in ${s.projName || ""}`;
                            const done = () => { setCopiedId(s.id); setTimeout(() => setCopiedId(null), 1400); };
                            if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done).catch(() => {});
                            else { const ta = document.createElement("textarea"); ta.value = txt; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); done(); } catch (_) {} document.body.removeChild(ta); }
                          }}
                          title="Copy this risk wording + owner to reuse the mitigation"
                          style={{ float: "right", border: `1px solid ${C.line}`, background: "#fff", borderRadius: 5, fontSize: 9, padding: "1px 7px", cursor: "pointer", color: copiedId === s.id ? C.lime : C.graph, fontFamily: MONO }}>
                          {copiedId === s.id ? "Copied \u2713" : "\u29C9 Adopt"}
                        </button>
                      </div>
                      <div style={{ fontSize: 11.5, color: C.ink, lineHeight: 1.35 }}>{(s.desc || "").slice(0, 90)}</div>
                      <div style={{ fontSize: 9.5, color: C.mid, marginTop: 3 }}>shared: {s.shared.slice(0, 4).join(", ")}</div>
                    </div>
                  ))}
                {similarList.length > 0 && <div style={{ fontSize: 11, color: C.mid, marginTop: 8, fontStyle: "italic" }}>A repeated risk is a portfolio risk — consider one shared mitigation.</div>}
              </div>
            </div>
          ) : node.kind === "resource" ? (
            <div>
              <SectionLabel color={C.navy}>Resource</SectionLabel>
              <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 15, color: C.ink }}>{node.data.name}</div>
              <div style={{ fontSize: 12.5, color: C.mid, marginTop: 6 }}>{node.data.role || "—"}{node.data.team ? ` · ${node.data.team}` : ""}</div>
              {(() => { const rn = graph.nodes.find(n => n.id === node.id); return rn && rn.projs && rn.projs.length > 1 ? (
                <div style={{ marginTop: 10, fontSize: 12, color: C.navy }}>◢ On {rn.projs.length} projects: {rn.projs.map(id => (projects.find(p => p.id === id) || {}).code).filter(Boolean).join(", ")}</div>
              ) : <div style={{ marginTop: 10, fontSize: 12, color: C.mid }}>On this project.</div>; })()}
            </div>
          ) : node.kind === "benefit" ? (
            <div>
              <SectionLabel color={C.lime}>Benefit</SectionLabel>
              <div style={{ fontSize: 13.5, color: C.ink, fontWeight: 600 }}>{node.data.name}</div>
              <div style={{ fontSize: 12, color: C.mid, marginTop: 8 }}>{node.data.baseline || "?"} → {node.data.target || "?"}</div>
              <div style={{ fontSize: 12, color: C.mid, marginTop: 4 }}>Owner: {node.data.owner || "no owner"} · {node.data.status || "on track"}</div>
            </div>
          ) : node.kind === "decision" ? (
            <div>
              <SectionLabel color={"#8A6200"}>Decision</SectionLabel>
              <div style={{ fontSize: 13, color: C.ink, lineHeight: 1.4 }}>{node.data.text}</div>
              <div style={{ fontSize: 12, color: C.mid, marginTop: 8 }}>Owner: {node.data.owner || "—"} · {node.data.status || "—"}</div>
            </div>
          ) : (
            <div>
              <SectionLabel color={C.graph}>Log</SectionLabel>
              <div style={{ fontSize: 13, color: C.ink }}>{node.data.title}</div>
              <div style={{ fontSize: 11.5, color: C.faint, marginTop: 4 }}>{node.data.date} · {node.data.type}</div>
              {node.data.detail && <div style={{ fontSize: 12, color: C.mid, marginTop: 8, lineHeight: 1.4 }}>{node.data.detail}</div>}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function Portfolio({ projects, setProjects, update, setSel, setTab, programLinks, setProgramLinks }) {
  const [pview, setPview] = useState("cards");
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

      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {[["cards", "Project cards"], ["map", "Program map — dependencies"]].map(([id, l]) => (
          <button key={id} onClick={() => setPview(id)} style={{ border: `1px solid ${pview === id ? C.mul : C.line}`, background: pview === id ? C.mul : "#fff", color: pview === id ? "#fff" : C.mid, borderRadius: 99, padding: "7px 15px", fontFamily: DISP, fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>{l}</button>
        ))}
      </div>
      {pview === "map" ? <ProgramMap projects={projects} programLinks={programLinks || []} setProgramLinks={setProgramLinks} setSel={setSel} setTab={setTab} /> : (<>
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
      </>)}
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
function Canvas({ projects, project, setSel, update, people = [] }) {
  if (!project) return <Card>Add a project in Portfolio first.</Card>;
  const cv = project.canvas || {};
  const setBox = (id, v) => update(project.id, { canvas: { ...cv, [id]: v } });
  const filled = CANVAS_BOXES.filter(b => (cv[b.id] || "").trim()).length;

  return (
    <div>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
        <ProjectPicker projects={projects} project={project} setSel={setSel} />
        <label style={{ fontSize: 11.5, color: C.faint, display: "flex", gap: 6, alignItems: "center" }}>PM:
          <select value={project.pm || ""} onChange={e => update(project.id, { pm: e.target.value })} style={{ border: `1px solid ${C.soft}`, borderRadius: 7, padding: "6px 8px", fontSize: 12, fontFamily: DISP, fontWeight: 600 }}>
            <option value="">— unassigned —</option>
            {people.filter(p2 => /pm|project|product/i.test(p2.role || "")).map(p2 => <option key={p2.id} value={p2.name}>{p2.name}</option>)}
          </select>
        </label>
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
function ReviewPack({ projects, update, people = [], assignments = [] }) {
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
    const be = budgetEval(p, people, assignments);
    if (be && be.env > 0 && be.p80 > be.env) flags.push(`cost P80 \u20ac${Math.round(be.p80 / 1000)}k over envelope \u20ac${Math.round(be.env / 1000)}k`);
    return { p, h, flags };
  }).filter(x => x.flags.length);

  const daysSince = d => Math.floor((Date.now() - new Date(d + "T00:00:00").getTime()) / 86400000);
  const retros = projects.filter(p => p.hypothesis?.text && !p.hypothesis.retroDone)
    .map(p => ({ p, days: daysSince(p.hypothesis.date) }))
    .filter(x => x.days >= 25)
    .sort((a, b) => b.days - a.days);

  // Benefits portfolio — every benefit across every project (value roll-up)
  const allBenefits = projects.flatMap(p => (p.keydata?.benefits || []).map(b => ({ ...b, projName: p.name, projCode: p.code })));
  const BEN_STATUS = ["on track", "at risk", "realised", "written off"];
  const BEN_COL = { "on track": C.lime, "at risk": "#8A6200", "realised": C.navy, "written off": C.red };
  const benCount = s => allBenefits.filter(b => (b.status || "on track") === s).length;
  const benAtRisk = allBenefits.filter(b => ["at risk", "written off"].includes(b.status));
  const benNoOwner = allBenefits.filter(b => !b.owner || !String(b.owner).trim());

  // Budget roll-up — portfolio cost picture (labour + non-labour, PERT P50/P80)
  const budgetRows = projects.map(p => ({ p, be: budgetEval(p, people, assignments) })).filter(x => x.be);
  const budTotals = budgetRows.reduce((a, { be }) => ({ env: a.env + (be.env || 0), p50: a.p50 + be.p50, p80: a.p80 + be.p80 }), { env: 0, p50: 0, p80: 0 });
  const budVerdict = be => !be.env ? ["no envelope", C.faint] : be.p80 <= be.env ? ["GREEN", C.lime] : be.p50 <= be.env ? ["AMBER", "#8A6200"] : ["RED", C.red];

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
    if (allBenefits.length) {
      m += `\n## Benefits portfolio (${allBenefits.length})\n`;
      m += BEN_STATUS.map(s => `${s}: ${benCount(s)}`).join(" · ") + "\n";
      allBenefits.forEach(b => { m += `- ${b.projCode} · ${b.name} — ${b.baseline || "?"} → ${b.target || "?"} (${b.owner || "no owner"}, ${b.status || "on track"})\n`; });
    }
    if (budgetRows.length) {
      m += `\n## Budget roll-up\n`;
      m += `Envelopes ${eur(budTotals.env)} · P50 ${eur(budTotals.p50)} · P80 ${eur(budTotals.p80)}\n`;
      budgetRows.forEach(({ p, be }) => { m += `- ${p.code} · ${p.name}: env ${eur(be.env)}, P50 ${eur(be.p50)}, P80 ${eur(be.p80)} — ${budVerdict(be)[0]}\n`; });
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
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button onClick={() => dl(`Portfolio_Review_Pack_${today()}.html`, buildReviewHtml(projects, attention, ranked, retros, people, assignments), "text/html")} style={{ background: C.navy, color: "#fff", border: "none", borderRadius: 8, padding: "10px 16px", fontFamily: DISP, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Print pack ↓</button>
          <button onClick={copy} style={{ background: C.mul, color: "#fff", border: "none", borderRadius: 8, padding: "10px 16px", fontFamily: DISP, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            {copied ? "Copied ✓" : "Copy as Markdown"}
          </button>
        </div>
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
        <Card style={{ gridColumn: "1/-1", borderTop: `3px solid ${C.lime}` }}>
          <SectionLabel color={C.lime}>Benefits portfolio — value across every project</SectionLabel>
          {allBenefits.length === 0 ? (
            <div style={{ fontSize: 13, color: C.mid }}>No benefits captured yet. Add them per project in Project Data; they roll up here so value is visible across the whole portfolio.</div>
          ) : (
            <>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                {BEN_STATUS.map(s => (
                  <Chip key={s} bg={"#fff"} color={BEN_COL[s]} style={{ border: `1px solid ${BEN_COL[s]}33`, fontWeight: 700 }}>{s}: {benCount(s)}</Chip>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "minmax(90px,0.8fr) minmax(160px,2fr) 1fr 1fr 1.1fr auto", gap: 4, fontSize: 12 }}>
                {["Project", "Benefit", "Baseline", "Target", "Business owner", "Status"].map(h => (
                  <div key={h} style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: ".05em", color: C.faint, textTransform: "uppercase", paddingBottom: 4, borderBottom: `1px solid ${C.line}` }}>{h}</div>
                ))}
                {allBenefits.map((b, i) => (
                  <React.Fragment key={b.id || i}>
                    <div style={{ padding: "6px 0", borderBottom: `1px solid ${C.soft}`, fontFamily: MONO, fontSize: 10.5, color: C.mul }}>{b.projCode}</div>
                    <div style={{ padding: "6px 0", borderBottom: `1px solid ${C.soft}`, fontWeight: 600 }}>{b.name}</div>
                    <div style={{ padding: "6px 0", borderBottom: `1px solid ${C.soft}`, color: C.mid }}>{b.baseline || "—"}</div>
                    <div style={{ padding: "6px 0", borderBottom: `1px solid ${C.soft}`, color: C.mid }}>{b.target || "—"}</div>
                    <div style={{ padding: "6px 0", borderBottom: `1px solid ${C.soft}`, color: b.owner ? C.ink : C.red }}>{b.owner || "no owner"}</div>
                    <div style={{ padding: "6px 0", borderBottom: `1px solid ${C.soft}` }}><Chip bg={"#fff"} color={BEN_COL[b.status || "on track"]} style={{ border: `1px solid ${BEN_COL[b.status || "on track"]}33` }}>{b.status || "on track"}</Chip></div>
                  </React.Fragment>
                ))}
              </div>
              {benAtRisk.length > 0 && (
                <div style={{ marginTop: 12, fontSize: 12.5, color: C.ink }}><b style={{ color: C.red }}>Value needing attention:</b> {benAtRisk.map(b => `${b.projCode} — ${b.name} (${b.status})`).join(" · ")}</div>
              )}
              {benNoOwner.length > 0 && (
                <div style={{ marginTop: 8, fontSize: 12, color: "#8A6200", background: C.goldLt, borderRadius: 8, padding: "8px 12px" }}>{benNoOwner.length} benefit{benNoOwner.length > 1 ? "s" : ""} with no business owner — a benefit with no owner is not a benefit.</div>
              )}
            </>
          )}
        </Card>
        <Card style={{ gridColumn: "1/-1", borderTop: `3px solid ${C.navy}` }}>
          <SectionLabel color={C.navy}>Budget roll-up — labour + non-labour, P50 / P80 vs envelope</SectionLabel>
          {budgetRows.length === 0 ? (
            <div style={{ fontSize: 13, color: C.mid }}>No budgets set yet. Add an envelope and cost lines per project in Capacity &amp; Budget; the portfolio picture appears here.</div>
          ) : (
            <>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
                {[["Envelopes", budTotals.env, C.ink], ["Forecast P50", budTotals.p50, C.navy], ["Forecast P80", budTotals.p80, budTotals.p80 > budTotals.env && budTotals.env > 0 ? C.red : C.lime]].map(([l, v, col]) => (
                  <div key={l} style={{ border: `1px solid ${C.line}`, borderRadius: 10, padding: "8px 14px", minWidth: 120 }}>
                    <div style={{ fontFamily: MONO, fontSize: 9.5, textTransform: "uppercase", color: C.faint, letterSpacing: ".05em" }}>{l}</div>
                    <div style={{ fontFamily: DISP, fontWeight: 800, fontSize: 18, color: col }}>{eur(v)}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "minmax(140px,2fr) 1fr 1fr 1fr auto", gap: 4, fontSize: 12 }}>
                {["Project", "Envelope", "P50", "P80", "Verdict"].map(h => (
                  <div key={h} style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: ".05em", color: C.faint, textTransform: "uppercase", paddingBottom: 4, borderBottom: `1px solid ${C.line}` }}>{h}</div>
                ))}
                {budgetRows.map(({ p, be }) => {
                  const [vt, vc] = budVerdict(be);
                  return (
                    <React.Fragment key={p.id}>
                      <div style={{ padding: "6px 0", borderBottom: `1px solid ${C.soft}`, fontWeight: 600 }}>{p.name} <span style={{ fontFamily: MONO, fontSize: 10, color: C.faint }}>{p.code}</span></div>
                      <div style={{ padding: "6px 0", borderBottom: `1px solid ${C.soft}`, fontFamily: MONO, fontSize: 11.5, color: C.mid }}>{eur(be.env)}</div>
                      <div style={{ padding: "6px 0", borderBottom: `1px solid ${C.soft}`, fontFamily: MONO, fontSize: 11.5, color: C.mid }}>{eur(be.p50)}</div>
                      <div style={{ padding: "6px 0", borderBottom: `1px solid ${C.soft}`, fontFamily: MONO, fontSize: 11.5, color: C.mid }}>{eur(be.p80)}</div>
                      <div style={{ padding: "6px 0", borderBottom: `1px solid ${C.soft}` }}><Chip bg={"#fff"} color={vc} style={{ border: `1px solid ${vc}33`, fontWeight: 700 }}>{vt}</Chip></div>
                    </React.Fragment>
                  );
                })}
              </div>
              <div style={{ marginTop: 10, fontSize: 11.5, fontStyle: "italic", color: C.mid }}>Doctrine: P80 is what you commit upward; P50 is what you manage to. Forecast combines labour (from assignments) and non-labour cost lines.</div>
            </>
          )}
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
  const [viewer, setViewer] = useState(null);
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
                <button key={i} onClick={() => setViewer({ kind, label, ev: selEv })} style={{ width: "100%", display: "flex", gap: 8, alignItems: "center", padding: "8px 10px", border: `1px solid ${C.line}`, borderRadius: 8, marginBottom: 6, fontSize: 12.5, background: "#fff", cursor: "pointer", textAlign: "left" }}>
                  <Chip bg={C.navyLt} color={C.navy} style={{ fontSize: 8.5 }}>{LINK_KINDS[kind]}</Chip>
                  <span style={{ color: C.ink }}>{label}</span>
                  <span style={{ marginLeft: "auto", color: C.mul, fontFamily: MONO, fontSize: 10, fontWeight: 600 }}>open →</span>
                </button>
              ))}
              <div style={{ fontSize: 10, color: C.faint }}>Opens the tool's simple mode inside the Navigator; the corporate deployment opens the real object.</div>
              {viewer && <MockDocViewer viewer={viewer} project={proj} onClose={() => setViewer(null)} />}
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
          <li style={{ marginBottom: 6 }}><b style={{ color: C.lime }}>\u2713 DONE \u2014 AZ-branded PPT generation in-app:</b> the Studio generates T01 / T02 / T04 / T05 / T09 / T10 / T15 / T17 on the official mulberry/gold master today, with a print-ready branded HTML fallback when the environment blocks the engine. In the corporate deployment the engine runs locally.</li>
          <li style={{ marginBottom: 6 }}><b style={{ color: "#8A6200" }}>\u25d4 PREPARED \u2014 Corporate deployment:</b> exports, the Agent Blueprint and the Demo Timeline's simulated tool viewers define the contract; pending: Azure static app + Entra SSO and live connectors so every ledger event resolves to its real Confluence page, Smartsheet row, JIRA issue or deck.</li>
          <li><b style={{ color: "#8A6200" }}>\u25d4 PREFIGURED \u2014 Agents wired in:</b> the Advisor already runs AG-01/02/04 behaviours on your data (with rules fallback); pending: routing through the enterprise AI gateway and AG-01 pre-filling the status from systems of record.</li>
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
/* In-app implementation status per template: live (working now) · data (entry point) · plan (planned builder) */
const TPL_IMPL = {
  T01: [["live", "PPT \u2713 in Studio"], ["data", "Delivery Canvas \u2192 charter"]],
  T02: [["live", "Builder \u2713 in Studio"], ["live", "PPT \u2713"]],
  T03: [["data", "Project Data \u2192 Risks"], ["live", "RAID CSV export \u2713"]],
  T04: [["live", "PPT \u2713 in Studio"], ["data", "Portfolio RAG + Project Data"]],
  T05: [["live", "PPT \u2713 5-slide pack"]],
  T06: [["data", "Workspace Plan + Gantt"], ["live", "Smartsheet CSV \u2713"]],
  T07: [["data", "Workspace Board"], ["live", "JIRA CSV both ways \u2713"]],
  T08: [["data", "Project Data \u2192 Decisions"], ["live", "Confluence export \u2713"]],
  T09: [["live", "Grid builder \u2713 in Studio"], ["live", "PPT \u2713"]],
  T10: [["live", "Form \u2713 in Studio"], ["live", "PPT \u2713"]],
  T11: [["live", "Builder \u2713 in Studio"], ["live", "PPT \u2713"]],
  T12: [["data", "Adoption RAG on Portfolio"]],
  T13: [["data", "Project Data \u2192 Benefits"], ["live", "T05 value slide \u2713"]],
  T14: [["live", "Day-30 retro radar \u2713"], ["live", "Retro canvas \u2713 in Studio"]],
  T15: [["live", "Builder \u2713 in Studio"], ["live", "JIRA export carries it \u2713"]],
  T16: [["file", "Master in Template Pack"]],
  T17: [["live", "Generator \u2713 in Studio"], ["live", "PPT \u2713 3 slides"]],
};
const IMPL_STYLE = { live: [C.limeLt, C.lime], data: [C.navyLt, C.navy], plan: [C.goldLt, "#8A6200"], file: [C.soft, C.mid] };

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
              <div style={{ display: "flex", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
                {(TPL_IMPL[t.id] || [["file", "Master in Template Pack"]]).map(([k2, l2], i2) => (
                  <Chip key={i2} bg={IMPL_STYLE[k2][0]} color={IMPL_STYLE[k2][1]}>{l2}</Chip>
                ))}
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
      <Card style={{ marginTop: 16, borderLeft: `4px solid ${C.gold}`, background: C.goldLt }}>
        <SectionLabel color={"#8A6200"}>Template coverage — where we are, what's next in-app</SectionLabel>
        <div style={{ fontSize: 12.5, color: C.ink, marginBottom: 8 }}>
          All 17 have full field-by-field masters in the <b>Template Pack</b> (Library & Links). Inside the Navigator today: <b>14 live</b> (builders, generation or export) and <b>the rest with structured data entry</b>. The production order below has been delivered — remaining candidates route through the Framework Council intake:
        </div>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 12 }}>
          {[["\u2713", "T17 Closure generator", "live — Studio \u203a T17 Closure"], ["\u2713", "T02 Business case builder", "live — Studio \u203a T02"], ["\u2713", "T15 One-pager builder", "live — Studio \u203a T15, rides the JIRA export"], ["\u2713", "T09 Stakeholder grid", "live — Studio \u203a T09"], ["\u2713", "T10 Impact form", "live — Studio \u203a T10"], ["next", "Live connectors & portfolio API", "corporate deployment phase"]].map(([n2, t2, d2]) => (
            <div key={n2} style={{ flex: "1 1 180px", minWidth: 170 }}>
              <span style={{ fontFamily: MONO, fontSize: 10, color: "#8A6200", fontWeight: 600 }}>{n2} \u00b7 </span>
              <b style={{ fontFamily: DISP, fontSize: 12 }}>{t2}</b>
              <div style={{ color: C.mid, fontSize: 10.5 }}>{d2}</div>
            </div>
          ))}
        </div>
      </Card>
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
function ProjectData({ projects, project, setSel, update, people = [] }) {
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
      <DataGuide />
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
function Workspace({ projects, project, setSel, update, people = [], assignments = [] }) {
  const [view, setView] = useState("board");
  const [planTime, setPlanTime] = useState(false);
  const [newCard, setNewCard] = useState("");
  const [pageSel, setPageSel] = useState(null);
  const [newEpic, setNewEpic] = useState("");
  const [newDue, setNewDue] = useState("");
  const [grpEpic, setGrpEpic] = useState(false);
  const [fEpic, setFEpic] = useState("all");
  const [fDue, setFDue] = useState("");
  const [fAssignee, setFAssignee] = useState("all");
  const [newAssignee, setNewAssignee] = useState("");
  const [editId, setEditId] = useState(null);
  if (!project) return <Card>Add a project in Portfolio first.</Card>;
  const work = project.work || [], plan = project.plan || [], pages = project.pages || [];
  const setWork = w => update(project.id, { work: w });
  const setPlan = p => update(project.id, { plan: p });
  const setPages = p => update(project.id, { pages: p });
  const teamNames = [...new Set(assignments.filter(a => a.projectId === project.id).map(a => (people.find(x => x.id === a.personId) || {}).name).filter(Boolean))];
  const assigneeOpts = teamNames.length ? teamNames : people.map(p => p.name).filter(Boolean);
  const move = (id, dir) => {
    const nw = work.map(c => {
      if (c.id !== id) return c;
      const i = WCOLS.findIndex(([k]) => k === c.col);
      const ni = Math.min(Math.max(i + dir, 0), WCOLS.length - 1);
      return { ...c, col: WCOLS[ni][0] };
    });
    update(project.id, { work: nw, flowLog: pushFlow(project, nw) });
  };
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
          {[["board", "Board"], ["dates", "Dates"], ["flow", "Flow"], ["plan", "Plan"], ["pages", "Pages"]].map(([id, l]) => (
            <button key={id} onClick={() => setView(id)} style={{ border: `1px solid ${view === id ? C.mul : C.line}`, background: view === id ? C.mul : "#fff", color: view === id ? "#fff" : C.mid, borderRadius: 99, padding: "7px 15px", fontFamily: DISP, fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>{l}</button>
          ))}
        </div>
      </div>
      <div style={{ fontSize: 11.5, color: C.faint, marginBottom: 12 }}>For portfolios under ~100 projects this workspace replaces the tool sprawl: Board = the work of record · Plan = the plan of record · Pages = the memory of record. One project, one place, zero duplicated truth.</div>

      {(() => {
        // ---- epic + date helpers shared by Board and Dates views ----
        const today0 = new Date(); today0.setHours(0, 0, 0, 0);
        const daysTo = d => d ? Math.round((new Date(d + "T00:00:00") - today0) / 86400000) : null;
        const EPIC_COL = [C.mul, C.navy, C.lime, "#8A6200", C.mulDk, "#0F6F6A", "#9A3B8C"];
        const epicList = [...new Set(work.map(c => c.epic).filter(Boolean))];
        const epicColor = e => EPIC_COL[Math.max(0, epicList.indexOf(e)) % EPIC_COL.length];
        const setCard = (id, patch) => setWork(work.map(x => x.id === id ? { ...x, ...patch } : x));
        const dueChip = c => {
          if (!c.due) return null;
          const dt = daysTo(c.due), done = c.col === "done";
          const col = done ? C.lime : dt < 0 ? C.red : dt <= 7 ? "#8A6200" : C.faint;
          const lab = dt < 0 && !done ? `${-dt}d overdue` : dt === 0 ? "today" : dt > 0 ? `${dt}d` : "met";
          return <span style={{ fontFamily: MONO, fontSize: 9, color: col, fontWeight: 700 }} title={c.due}>◷ {c.due} · {lab}</span>;
        };
        const cardEl = (c, showMove = true) => (
          <div key={c.id} style={{ background: "#fff", border: `1px solid ${c.blocked ? C.red : C.line}`, borderLeft: c.epic ? `4px solid ${epicColor(c.epic)}` : (c.blocked ? `4px solid ${C.red}` : `1px solid ${C.line}`), borderRadius: 9, padding: "9px 11px", marginBottom: 7, fontSize: 12.5 }}>
            <div>{c.title} {c.blocked && <span style={{ fontFamily: MONO, fontSize: 8.5, color: C.red, fontWeight: 700 }}>BLOCKED</span>}</div>
            <div style={{ display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap", marginTop: 5 }}>
              {c.epic && <span style={{ fontFamily: MONO, fontSize: 8.5, fontWeight: 700, color: "#fff", background: epicColor(c.epic), borderRadius: 4, padding: "1px 6px" }}>{c.epic}</span>}
              {c.assignee && <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color: C.navy, background: C.navyLt, borderRadius: 10, padding: "1px 8px" }}>◢ {c.assignee}</span>}
              {c.points ? <span style={{ fontFamily: MONO, fontSize: 9, color: C.navy, fontWeight: 700 }}>{c.points} pt</span> : null}
              {dueChip(c)}
            </div>
            {editId === c.id && (
              <div style={{ display: "flex", gap: 5, marginTop: 7, flexWrap: "wrap" }}>
                <select value={c.assignee || ""} onChange={e => setCard(c.id, { assignee: e.target.value || undefined })} style={{ flex: "0 0 130px", border: `1px solid ${C.soft}`, background: "#FBFAF8", borderRadius: 7, padding: "7px 6px", fontSize: 12, color: C.ink }}>
                  <option value="">— resource —</option>
                  {assigneeOpts.map(nm => <option key={nm} value={nm}>{nm}</option>)}
                </select>
                {inp(c.epic, v => setCard(c.id, { epic: v }), "Epic", "text", 100)}
                {inp(c.due, v => setCard(c.id, { due: v }), "Due", "date", 130)}
                {inp(c.points, v => setCard(c.id, { points: v }), "Pts", "number", 56)}
              </div>
            )}
            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
              <button onClick={() => setEditId(editId === c.id ? null : c.id)} title="Edit epic / due / points" style={{ border: `1px solid ${editId === c.id ? C.mul : C.soft}`, background: "#fff", borderRadius: 6, padding: "2px 7px", cursor: "pointer", color: editId === c.id ? C.mul : C.faint, fontSize: 11 }}>✎</button>
              <button onClick={() => setCard(c.id, { blocked: !c.blocked })} title={c.blocked ? "Unblock" : "Mark blocked"} style={{ border: `1px solid ${c.blocked ? C.red : C.soft}`, background: "#fff", borderRadius: 6, padding: "2px 7px", cursor: "pointer", color: c.blocked ? C.red : C.faint, fontSize: 11 }}>⚑</button>
              {showMove && <button onClick={() => move(c.id, -1)} disabled={c.col === "backlog"} style={{ border: `1px solid ${C.soft}`, background: "#fff", borderRadius: 6, padding: "2px 8px", cursor: "pointer", color: C.mid, fontSize: 11 }}>◀</button>}
              {showMove && <button onClick={() => move(c.id, 1)} disabled={c.col === "done"} style={{ border: `1px solid ${C.soft}`, background: "#fff", borderRadius: 6, padding: "2px 8px", cursor: "pointer", color: C.mid, fontSize: 11 }}>▶</button>}
              <button onClick={() => setWork(work.filter(x => x.id !== c.id))} style={{ marginLeft: "auto", border: "none", background: "transparent", color: C.faint, cursor: "pointer", fontSize: 12 }}>×</button>
            </div>
          </div>
        );
        const passFilter = c => (fEpic === "all" || c.epic === fEpic || (fEpic === "(none)" && !c.epic)) && (!fDue || (c.due && c.due <= fDue)) && (fAssignee === "all" || c.assignee === fAssignee || (fAssignee === "(none)" && !c.assignee));
        const fwork = work.filter(passFilter);

        return (<>
          {view === "board" && (
            <div>
              <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                <input value={newCard} onChange={e => setNewCard(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && newCard.trim()) { setWork([...work, { id: uid(), title: newCard.trim(), col: "backlog", epic: newEpic.trim() || undefined, due: newDue || undefined, assignee: newAssignee || undefined }]); setNewCard(""); } }} placeholder="New work item — Enter to add to Backlog" style={{ flex: 1, minWidth: 190, border: `1px solid ${C.line}`, borderRadius: 8, padding: "10px 13px", fontSize: 13 }} />
                <select value={newAssignee} onChange={e => setNewAssignee(e.target.value)} title="Assign a resource" style={{ flex: "0 0 140px", border: `1px solid ${C.line}`, borderRadius: 8, padding: "9px 8px", fontSize: 12.5, background: "#fff", color: newAssignee ? C.ink : C.faint }}>
                  <option value="">Resource…</option>
                  {assigneeOpts.map(nm => <option key={nm} value={nm}>{nm}</option>)}
                </select>
                {inp(newEpic, setNewEpic, "Epic (optional)", "text", 130)}
                {inp(newDue, setNewDue, "Due", "date", 140)}
                <label style={{ border: `1px solid ${C.navy}`, color: C.navy, background: "#fff", borderRadius: 8, padding: "10px 14px", fontSize: 12, fontFamily: DISP, fontWeight: 700, cursor: "pointer" }}>
                  Import JIRA CSV ↑
                  <input type="file" accept=".csv,text/csv" style={{ display: "none" }} onChange={e => {
                    const f = e.target.files?.[0]; if (!f) return;
                    Papa.parse(f, { header: true, skipEmptyLines: true, complete: res => {
                      try {
                        const REV = { "to do": "backlog", "open": "backlog", "backlog": "backlog", "in progress": "doing", "doing": "doing", "in review": "review", "review": "review", "done": "done", "closed": "done", "resolved": "done" };
                        const norm = d => { if (!d) return undefined; const m = String(d).match(/(\d{4})-(\d{2})-(\d{2})/); if (m) return m[0]; const dt = new Date(d); return isNaN(dt) ? undefined : dt.toISOString().slice(0, 10); };
                        const rows = res.data.map(r => {
                          const title = r.Summary || r.summary || r["Issue key"] || r.Title || "";
                          const st = String(r.Status || r.status || "").toLowerCase().trim();
                          const epic = r["Epic Link"] || r["Epic Name"] || r.Epic || r.epic || undefined;
                          const due = norm(r["Due date"] || r["Due Date"] || r.Due || r.due);
                          const pts = r["Story Points"] || r["Story point estimate"] || r.Points || undefined;
                          const asg = r.Assignee || r.assignee || r["Assigned To"] || undefined;
                          return title ? { id: uid(), title: String(title).slice(0, 120), col: REV[st] || "backlog", epic: epic ? String(epic).slice(0, 40) : undefined, due, points: pts ? Number(pts) || undefined : undefined, assignee: asg ? String(asg).slice(0, 40) : undefined } : null;
                        }).filter(Boolean);
                        if (rows.length) setWork([...work, ...rows]);
                        else alert("No rows with a Summary column found — export from JIRA with Summary and Status (and optionally Epic Link, Due date, Story Points).");
                      } catch { alert("Couldn't parse that CSV."); }
                    }});
                    e.target.value = "";
                  }} />
                </label>
              </div>
              {/* filter / group bar */}
              <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ fontFamily: MONO, fontSize: 10, color: C.faint, textTransform: "uppercase", letterSpacing: ".08em" }}>Resource</span>
                <select value={fAssignee} onChange={e => setFAssignee(e.target.value)} style={{ border: `1px solid ${C.line}`, borderRadius: 7, padding: "6px 9px", fontSize: 12, background: "#fff", color: C.ink }}>
                  <option value="all">All resources</option>
                  {assigneeOpts.map(nm => <option key={nm} value={nm}>{nm}</option>)}
                  <option value="(none)">— unassigned —</option>
                </select>
                <span style={{ fontFamily: MONO, fontSize: 10, color: C.faint, textTransform: "uppercase", letterSpacing: ".08em" }}>Epic</span>
                <select value={fEpic} onChange={e => setFEpic(e.target.value)} style={{ border: `1px solid ${C.line}`, borderRadius: 7, padding: "6px 9px", fontSize: 12, background: "#fff", color: C.ink }}>
                  <option value="all">All epics</option>
                  {epicList.map(e => <option key={e} value={e}>{e}</option>)}
                  <option value="(none)">— no epic —</option>
                </select>
                <span style={{ fontFamily: MONO, fontSize: 10, color: C.faint, textTransform: "uppercase", letterSpacing: ".08em" }}>Due ≤</span>
                {inp(fDue, setFDue, "any date", "date", 140)}
                {(fEpic !== "all" || fDue || fAssignee !== "all") && <button onClick={() => { setFEpic("all"); setFDue(""); setFAssignee("all"); }} style={{ border: `1px solid ${C.line}`, background: "#fff", borderRadius: 7, padding: "6px 11px", fontSize: 11.5, color: C.mid, cursor: "pointer" }}>Clear</button>}
                <label style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center", fontSize: 12, color: C.mid, cursor: "pointer" }}>
                  <input type="checkbox" checked={grpEpic} onChange={e => setGrpEpic(e.target.checked)} /> Swimlanes by epic
                </label>
              </div>

              {!grpEpic ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 10 }}>
                  {WCOLS.map(([k, label]) => {
                    const inCol = fwork.filter(c => c.col === k); const lim = project.wip?.[k]; const over = lim && inCol.length > lim;
                    return (
                      <div key={k} style={{ background: k === "done" ? C.limeLt : C.soft, borderRadius: 12, padding: 10, minHeight: 160 }}>
                        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: over ? C.red : k === "done" ? C.lime : C.faint, margin: "2px 4px 8px", fontWeight: over ? 700 : 500 }}>{label} · {inCol.length}{lim ? `/${lim}` : ""}{over ? " ⚠ WIP" : ""}</div>
                        {inCol.map(c => cardEl(c))}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[...epicList, "(no epic)"].map(ep => {
                    const lane = fwork.filter(c => (ep === "(no epic)" ? !c.epic : c.epic === ep));
                    if (!lane.length) return null;
                    const col = ep === "(no epic)" ? C.faint : epicColor(ep);
                    return (
                      <div key={ep} style={{ border: `1px solid ${C.line}`, borderRadius: 12, overflow: "hidden" }}>
                        <div style={{ background: col, color: "#fff", padding: "6px 12px", fontFamily: DISP, fontWeight: 700, fontSize: 12.5, display: "flex", justifyContent: "space-between" }}>
                          <span>{ep}</span><span style={{ fontFamily: MONO, fontSize: 10, opacity: .85 }}>{lane.filter(c => c.col === "done").length}/{lane.length} done</span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 8, padding: 8, background: "#fff" }}>
                          {WCOLS.map(([k, label]) => (
                            <div key={k} style={{ background: k === "done" ? C.limeLt : C.soft, borderRadius: 10, padding: 8, minHeight: 70 }}>
                              <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: ".08em", textTransform: "uppercase", color: C.faint, margin: "0 2px 6px" }}>{label} · {lane.filter(c => c.col === k).length}</div>
                              {lane.filter(c => c.col === k).map(c => cardEl(c))}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {view === "dates" && (
            <div>
              <div style={{ fontSize: 11.5, color: C.faint, marginBottom: 12 }}>Work items by due date. Set dates on cards in the Board view (✎) or import them from JIRA. Overdue items that aren't Done are flagged.</div>
              {(() => {
                const buckets = [["Overdue", c => c.due && c.col !== "done" && daysTo(c.due) < 0, C.red],
                                 ["This week", c => c.due && c.col !== "done" && daysTo(c.due) >= 0 && daysTo(c.due) <= 7, "#8A6200"],
                                 ["Next 30 days", c => c.due && c.col !== "done" && daysTo(c.due) > 7 && daysTo(c.due) <= 30, C.navy],
                                 ["Later", c => c.due && c.col !== "done" && daysTo(c.due) > 30, C.mid],
                                 ["Done", c => c.col === "done", C.lime],
                                 ["No date", c => !c.due && c.col !== "done", C.faint]];
                const used = new Set();
                return buckets.map(([label, test, col]) => {
                  const items = fwork.filter(c => !used.has(c.id) && test(c)); items.forEach(c => used.add(c.id));
                  if (!items.length) return null;
                  const sorted = [...items].sort((a, b) => (a.due || "9999").localeCompare(b.due || "9999"));
                  return (
                    <div key={label} style={{ marginBottom: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <span style={{ width: 10, height: 10, borderRadius: "50%", background: col }} />
                        <span style={{ fontFamily: DISP, fontWeight: 700, fontSize: 14, color: C.ink }}>{label}</span>
                        <span style={{ fontFamily: MONO, fontSize: 11, color: C.faint }}>{items.length}</span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 8 }}>
                        {sorted.map(c => cardEl(c, true))}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </>);
      })()}

      {view === "flow" && <FlowView project={project} update={update} />}

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
              <select value={m.dep || ""} onChange={e => setPlan(plan.map(x => x.id === m.id ? { ...x, dep: e.target.value || undefined } : x))} title="Depends on" style={{ border: `1px solid ${C.soft}`, borderRadius: 7, padding: "6px", fontSize: 11, maxWidth: 150 }}>
                <option value="">no dependency</option>
                {plan.filter(x => x.id !== m.id).map(x => <option key={x.id} value={x.id}>after: {(x.name || "untitled").slice(0, 22)}</option>)}
              </select>
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
const PPTX_URLS = [
  "https://cdn.jsdelivr.net/gh/gitbrent/pptxgenjs@3.12.0/dist/pptxgen.bundle.js",
  "https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js",
  "https://unpkg.com/pptxgenjs@3.12.0/dist/pptxgen.bundle.js",
  "https://cdnjs.cloudflare.com/ajax/libs/PptxGenJS/3.12.0/pptxgen.bundle.min.js",
];
function tryScript(url) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = url; s.async = true;
    const t = setTimeout(() => { s.remove(); reject(new Error("timeout " + url)); }, 9000);
    s.onload = () => { clearTimeout(t); window.PptxGenJS ? resolve(window.PptxGenJS) : reject(new Error("global missing")); };
    s.onerror = () => { clearTimeout(t); s.remove(); reject(new Error("blocked " + url)); };
    document.head.appendChild(s);
  });
}
async function loadPptx() {
  if (window.PptxGenJS) return window.PptxGenJS;
  if (_pptxPromise) return _pptxPromise;
  _pptxPromise = (async () => {
    let last = null;
    for (const u of PPTX_URLS) { try { return await tryScript(u); } catch (e) { last = e; } }
    _pptxPromise = null;
    throw last || new Error("no CDN reachable");
  })();
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


/* ================= STUDIO (documents + template builders) ================= */
function PptStudio({ projects, project, setSel, update }) {
  const [sub, setSub] = useState("docs");
  const SUBS = [["docs", "Documents & exports"], ["t02", "T02 Business Case"], ["t15", "T15 One-pagers"], ["t09", "T09 Stakeholders"], ["t10", "T10 Impact"], ["t11", "T11 Comms"], ["t14", "T14 Retros"], ["t17", "T17 Closure"]];
  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {SUBS.map(([id, l]) => (
          <button key={id} onClick={() => setSub(id)} style={{ border: `1px solid ${sub === id ? C.mul : C.line}`, background: sub === id ? C.mul : "#fff", color: sub === id ? "#fff" : C.mid, borderRadius: 99, padding: "8px 14px", fontFamily: DISP, fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>{l}</button>
        ))}
      </div>
      {sub === "docs" && <StudioDocs projects={projects} project={project} setSel={setSel} update={update} />}
      {sub === "t02" && <BizCaseBuilder projects={projects} project={project} setSel={setSel} update={update} />}
      {sub === "t15" && <EpicsBuilder projects={projects} project={project} setSel={setSel} update={update} />}
      {sub === "t09" && <StakeBuilder projects={projects} project={project} setSel={setSel} update={update} />}
      {sub === "t10" && <ImpactBuilder projects={projects} project={project} setSel={setSel} update={update} />}
      {sub === "t11" && <CommsBuilder projects={projects} project={project} setSel={setSel} update={update} />}
      {sub === "t14" && <RetrosBuilder projects={projects} project={project} setSel={setSel} update={update} />}
      {sub === "t17" && <ClosureBuilder projects={projects} project={project} setSel={setSel} update={update} />}
    </div>
  );
}
function StudioDocs({ projects, project, setSel, update }) {
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
      if (kind === "t02") buildT02(pptx, project);
      if (kind === "t15") buildT15(pptx, project);
      if (kind === "t09") buildT09(pptx, project);
      if (kind === "t10") buildT10(pptx, project);
      if (kind === "t17") buildT17(pptx, project);
      if (kind === "t11") buildT11(pptx, project);
      await pptx.writeFile({ fileName: `${project.code}_${kind.toUpperCase()}_${today()}.pptx` });
      if (update) update(project.id, { events: evPush(project, mkEv("forum", `${kind.toUpperCase()} generated from the Studio`, "AZ-branded draft — review and sign before circulation")) });
    } catch (e) {
      try {
        dl(`${project.code}_${kind.toUpperCase()}_${today()}.html`, buildHtmlDoc(kind, project), "text/html");
        setErr("This environment's security policy blocked the PPT engine, so I generated the same document as a print-ready AZ-branded HTML file instead — open it and print/save as PDF. In the corporate deployment the engine runs locally and you get native .pptx.");
        if (update) update(project.id, { events: evPush(project, mkEv("forum", `${kind.toUpperCase()} generated (HTML fallback)`, "PPT engine unavailable — branded HTML produced for print-to-PDF")) });
      } catch (e2) { setErr("Document engine unavailable (" + e.message + "). Your data is safe in Project Data and exportable as JSON."); }
    }
    setBusy(null);
  };
  const ready = {
    t04: !!kd.headline || kd.risks.length || kd.decisions.length,
    t01: !!(cv.problem || cv.outcome || cv.hypothesis),
    t05: kd.decisions.length || kd.benefits.length,
    t02: !!(project.bizcase?.problemSized || (project.bizcase?.options || []).length),
    t15: (project.epics || []).length,
    t09: (project.stakeholders || []).length,
    t10: (project.impact || []).length,
    t17: !!(project.closure?.keep || project.closure?.spend || kd.benefits.length),
    t11: (project.comms || []).length,
  };
  const DOCS = [
    ["t04", "Status Report — T04", "One AZ-branded slide: headline, RAG strip with your live dots, top risks, decisions needed, look-ahead.", "Feeds from: Portfolio RAG + Project Data"],
    ["t05", "SteerCo pack — T05 (5 slides)", "The T04, decisions requested, value tracker, plan & milestones, and risks & escalations. The rule of eight, started for you.", "Feeds from: Project Data + Workspace Plan"],
    ["t01", "Charter — T01", "One-page charter on the AZ master, drafted from your Delivery Canvas boxes, signature line included.", "Feeds from: Delivery Canvas"],
    ["t02", "Business Case — T02", "Problem sized, options with do-nothing, recommendation, value hypotheses and the ask — one decision-ready slide.", "Feeds from: T02 builder + benefits"],
    ["t15", "Epic One-pagers — T15", "One slide per epic: user, problem evidence, hypothesis, acceptance, instrumentation. The backlog's quality bar, printable.", "Feeds from: T15 builder"],
    ["t09", "Stakeholder Map — T09", "Power/interest grid with stance deltas and the engagement table. Candid by design — core team circulation only.", "Feeds from: T09 builder"],
    ["t10", "Impact Assessment — T10", "Per-group severity heat across process/tools/skills/behaviour, with readiness gaps. The G2 evidence.", "Feeds from: T10 builder"],
    ["t11", "Comms Plan — T11", "Audience × message × channel × sender × date. Senders are leaders — the project drafts, credible voices deliver.", "Feeds from: T11 builder"],
    ["t17", "Closure Pack — T17", "Outcomes vs charter, value handover with owners, lessons and release — three slides, no narrative laundering.", "Feeds from: T17 builder + benefits + risks"],
  ];
  return (
    <div>
      <Card style={{ marginBottom: 14, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <ProjectPicker projects={projects} project={project} setSel={setSel} />
        <div style={{ fontSize: 12.5, color: C.mid }}>Fill once in the app — generate the deck on the official mulberry/gold master with one click. If this environment blocks the PPT engine, the Studio automatically delivers the same document as print-ready branded HTML. The PM still reviews and signs: the Studio drafts, certified humans dispose.</div>
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
          const depM = m.dep ? dated.find(x => x.id === m.dep) : null;
          const depConflict = depM && D(depM.due) > D(m.due);
          const start = depM ? D(depM.due) : (i === 0 ? min + 7 * DAY : D(dated[i - 1].due));
          const conf = m.conf ?? 80;
          const col = m.status === "done" ? C.lime : conf < 60 ? C.red : conf < 80 ? C.amber : C.navy;
          const late = m.status !== "done" && D(m.due) < Date.now();
          return (
            <g key={m.id}>
              <text x={0} y={y + 4} fontSize="11.5" fill={C.ink} fontWeight="600" fontFamily={DISP}>{(m.name || "Untitled").slice(0, 30)}</text>
              <rect x={X(start)} y={y - 7} width={Math.max(X(D(m.due)) - X(start), 4)} height={14} rx={7} fill={col} opacity={m.status === "done" ? 0.45 : 0.22} />
              {depM && (() => { const di = dated.findIndex(x => x.id === m.dep); const dy = 40 + di * RH; return (
                <path d={`M ${X(D(depM.due))} ${dy + 9} C ${X(D(depM.due))} ${(dy + y) / 2}, ${X(start)} ${(dy + y) / 2}, ${X(start)} ${y - 8}`} fill="none" stroke={depConflict ? C.red : C.faint} strokeWidth="1.4" strokeDasharray="3 3" />
              ); })()}
              <path d={`M ${X(D(m.due))} ${y - 9} l 9 9 l -9 9 l -9 -9 Z`} fill={col} />
              {depConflict && <text x={X(D(m.due)) + 13} y={y - 10} fontSize="8.5" fill={C.red} fontFamily={MONO}>dep conflict!</text>}
              <text x={X(D(m.due)) + 13} y={y + 4} fontSize="9.5" fill={late ? C.red : C.faint} fontFamily={MONO}>{m.due.slice(5)}{m.status === "done" ? " ✓" : ` · ${conf}%`}{late ? " · late" : ""}</text>
            </g>
          );
        })}
      </svg>
      <div style={{ fontSize: 11, color: C.faint }}>Bars cascade from the previous milestone, or from a declared dependency (dashed connector; red = the dependency lands after the commitment). Colour: navy ≥80% confidence · amber 60–79 · red &lt;60 · green done. The dashed gold line is today.</div>
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
    ...(project.epics || []).length
      ? project.epics.map(ep => [ep.title || "Untitled epic", "Epic", "To Do", `USER: ${ep.user || ""}\nPROBLEM: ${ep.problem || ""}\nHYPOTHESIS: ${ep.hypothesis || ""}\nACCEPTANCE: ${ep.acceptance || ""}\nINSTRUMENTATION: ${ep.instrumentation || ""}`, "dcos,t15"])
      : [[`${project.name} — delivery epic`, "Epic", "To Do", `Tier ${project.tier} · ${project.phase}. Charter: ${cv.problem || ""}`, "dcos"]],
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
    const sh = project.stakeholders || [];
    if (sh.length) {
      md += `\n## Stakeholder Map (T09) — core team only\n\n| Name | Quadrant | Stance | Cares about | Action |\n|---|---|---|---|---|\n`;
      sh.forEach(s2 => { md += `| ${s2.name} | ${QUAD_LBL[s2.quadrant] || ""} | ${s2.stanceFrom || ""} \u2192 ${s2.stanceTo || ""} | ${s2.care || ""} | ${s2.action || ""} |\n`; });
    }
    const imp = project.impact || [];
    if (imp.length) {
      md += `\n## Change Impact (T10)\n\n| Group | Size | Process | Tools | Skills | Behaviour | Readiness gap |\n|---|---|---|---|---|---|---|\n`;
      imp.forEach(g => { md += `| ${g.group} | ${g.size || ""} | ${SEV_LBL[g.process ?? 0]} | ${SEV_LBL[g.tools ?? 0]} | ${SEV_LBL[g.skills ?? 0]} | ${SEV_LBL[g.behaviour ?? 0]} | ${g.gap || ""} |\n`; });
    }
    const bc = project.bizcase || {};
    if (bc.problemSized || (bc.options || []).length) {
      md += `\n## Business Case (T02)\n\n**Problem sized.** ${bc.problemSized || ""}\n\n`;
      (bc.options || []).forEach((o, i) => { md += `- **Option ${String.fromCharCode(65 + i)} — ${o.name}** (${o.cost || "cost ?"}): ${o.summary || ""}\n`; });
      if (bc.recommendation) md += `\n**Recommendation.** ${bc.recommendation}\n`;
      if (bc.ask) md += `\n**Ask.** ${bc.ask}\n`;
    }
    const cl = project.closure || {};
    if (cl.keep || cl.change || cl.stop || cl.spend) {
      md += `\n## Closure (T17)\n\nFinal spend: ${cl.spend || "?"} vs envelope ${cl.envelope || "?"}. Residual: ${cl.residual || "none"}\n\n- **Keep:** ${cl.keep || ""}\n- **Change:** ${cl.change || ""}\n- **Stop:** ${cl.stop || ""}\n\n> We'd tell the next team: ${cl.tellNext || ""}\n`;
    }
    const cm = project.comms || [];
    if (cm.length) {
      md += `\n## Comms Plan (T11)\n\n| Audience | Message | Channel | Sender | Date | Status |\n|---|---|---|---|---|---|\n`;
      cm.forEach(c2 => { md += `| ${c2.audience || ""} | ${c2.message || ""} | ${c2.channel || ""} | ${c2.sender || ""} | ${c2.date || ""} | ${c2.status || ""} |\n`; });
    }
    const rt = project.retros || [];
    if (rt.length) {
      md += `\n## Retros (T14)\n\n`;
      rt.forEach(r2 => { md += `### ${r2.date} — temperature ${r2.temp}/5\n- Keep: ${r2.keep || ""}\n- Change: ${r2.change || ""}\n- Stop: ${r2.stop || ""}\n- **Experiment:** ${r2.experiment || ""} ${r2.expReviewed ? "(reviewed \u2713)" : "(pending review)"}\n\n`; });
    }
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
function TimelineHub({ projects, setTab, setSel }) {
  const [mode, setMode] = useState(projects.some(p => (p.events || []).length) ? "mine" : "demo");
  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {[["mine", "My projects — live ledger"], ["cal", "Project calendar"], ["demo", "Demo — three model projects"]].map(([id, l]) => (
          <button key={id} onClick={() => setMode(id)} style={{ border: `1px solid ${mode === id ? C.mul : C.line}`, background: mode === id ? C.mul : "#fff", color: mode === id ? "#fff" : C.mid, borderRadius: 99, padding: "8px 16px", fontFamily: DISP, fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>{l}</button>
        ))}
      </div>
      {mode === "demo" ? <TimelineDemo /> : mode === "cal" ? <ProjectCalendar projects={projects} /> : <MyTimeline projects={projects} setTab={setTab} setSel={setSel} />}
    </div>
  );
}

function MyTimeline({ projects, setTab, setSel }) {
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
              {(() => {
                const t3 = selEv.type, ti = selEv.title || "";
                const targets = t3 === "status" ? [["portfolio", "Portfolio — RAG board"]]
                  : t3 === "gate" ? [["workspace", "Workspace — Plan & Gantt"]]
                  : t3 === "decision" ? (ti.startsWith("Day-30") ? [["review", "Review Pack — retro radar"]] : [["data", "Project Data — Decisions"]])
                  : t3 === "artefact" ? (ti.startsWith("Health") ? [["health", "Health Scan"]] : [["workspace", "Workspace"]])
                  : t3 === "forum" ? [["studio", "PPT Studio"]] : [["workspace", "Workspace"]];
                return targets.map(([tb, lb]) => (
                  <button key={tb} onClick={() => { setSel(proj.id); setTab(tb); }} style={{ display: "block", width: "100%", textAlign: "left", border: `1px solid ${C.line}`, background: "#fff", borderRadius: 8, padding: "8px 10px", fontSize: 12, color: C.navy, fontWeight: 600, cursor: "pointer", marginBottom: 6 }}>Open in app: {lb} →</button>
                ));
              })()}
              <div style={{ fontSize: 11, color: C.faint, marginTop: 8 }}>In the corporate deployment this event also links to its Confluence page / Smartsheet row / JIRA issue via the Agent Blueprint connectors — the Demo mode shows that experience.</div>
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

/* ================= HTML FALLBACK DOCUMENTS (print-to-PDF) ================= */
function buildHtmlDoc(kind, p) {
  const kd = { ...KD_DEFAULT, ...(p.keydata || {}) };
  const cv = p.canvas || {};
  const plan = [...(p.plan || [])].sort((a, b) => (a.due || "9999") < (b.due || "9999") ? -1 : 1);
  const esc2 = s2 => String(s2 ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const ragColor = v => v === "G" ? ["#E8F2E9", "#2E7D32", "GREEN"] : v === "A" ? ["#FBF0DC", "#C77800", "AMBER"] : ["#F8E9E8", "#B3261E", "RED"];
  const head2 = (eyebrow, tA, tB) => `
    <div class="topbar"></div>
    <div class="hwrap">
      <div class="brandrow"><span class="wordmark">AstraZeneca</span><span class="suite">DCOS NAVIGATOR · DELIVERY &amp; CHANGE OFFICE</span></div>
      <div class="eyebrow">${esc2(eyebrow)}</div>
      <h1><span class="g">${esc2(tA)}</span> <span class="m">${esc2(tB)}</span></h1>
      <div class="golddash"></div>
      <div class="ident"><b>${esc2(p.name)} · ${esc2(p.code)}</b><br>Tier ${esc2(p.tier)} · ${esc2(p.phase)} · ${today()}</div>
    </div>`;
  const css = `<style>
    @page{size:A4 landscape;margin:0}
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Calibri,'Segoe UI',Arial,sans-serif;color:#1C2222;background:#fff}
    .page{position:relative;width:297mm;min-height:209mm;padding:10mm 14mm 16mm;page-break-after:always;overflow:hidden}
    .topbar{position:absolute;top:0;left:0;right:0;height:3.5mm;background:#830051}
    .page::after{content:"";position:absolute;bottom:0;left:0;right:0;height:3.5mm;background:#830051}
    .hwrap{position:relative;padding-top:4mm}
    .brandrow{display:flex;justify-content:space-between;align-items:baseline}
    .wordmark{color:#830051;font-weight:700;font-size:15pt}
    .suite{font-family:Arial;font-size:7pt;letter-spacing:.22em;color:#9AA3A0;font-weight:700}
    .eyebrow{font-family:Arial;font-size:8pt;font-weight:700;letter-spacing:.28em;color:#3F4444;margin-top:6mm;text-transform:uppercase}
    h1{font-family:Arial;font-size:21pt;margin-top:1.5mm}
    h1 .g{color:#3F4444}h1 .m{color:#830051}
    .golddash{width:14mm;height:1.2mm;background:#F0AB00;margin:2mm 0 0 .5mm}
    .ident{position:absolute;top:10mm;right:0;text-align:right;font-size:9pt;color:#6B6B6B}
    .ident b{color:#3F4444}
    .zone{border:0.3mm solid #D5D5D5;border-radius:2.5mm;padding:4mm 5mm;margin-top:4mm}
    .zone.mul{background:#F6E9F1;border-color:#fff}.zone.gold{background:#FDF3DC;border-color:#fff}.zone.navy{background:#E7EEF4;border-color:#fff}
    .lbl{font-family:Arial;font-size:7.5pt;font-weight:700;letter-spacing:.18em;text-transform:uppercase;margin-bottom:1.5mm}
    .rags{display:flex;gap:3mm;margin-top:4mm}
    .rag{flex:1;border-radius:2.5mm;padding:3mm 4mm}
    .rag b{font-family:Arial;font-size:9pt}.rag .st{font-family:Arial;font-weight:800;font-size:11pt;margin-top:1mm}
    table{width:100%;border-collapse:collapse;margin-top:2mm;font-size:9.5pt}
    th{background:#3F4444;color:#fff;font-family:Arial;font-size:8pt;text-align:left;padding:2.2mm 3mm;letter-spacing:.04em}
    td{padding:2.2mm 3mm;border-bottom:0.2mm solid #ECE8E4;vertical-align:top}
    .foot{position:absolute;bottom:6mm;left:14mm;right:14mm;display:flex;justify-content:space-between;font-size:7.5pt;color:#9AA3A0;font-style:italic}
    ul{margin:1.5mm 0 0 5mm;font-size:10pt}li{margin-bottom:1.2mm}
    .grid2{display:grid;grid-template-columns:1fr 1fr;gap:4mm}
    .printhint{position:fixed;top:6px;right:8px;background:#2B3333;color:#fff;font:600 11px Arial;padding:6px 12px;border-radius:8px;opacity:.92}
    @media print{.printhint{display:none}}
  </style>`;
  const foot = `<div class="foot"><span>Generated by DCOS Navigator — review and sign before circulation (AI/tool-drafted, unconfirmed)</span><span>Branded HTML fallback · print or save as PDF for circulation</span></div>`;

  const t04page = () => `
  <div class="page">${head2("T04 · Status report — assembled from the Navigator", "Status", "report")}
    <div class="zone mul"><span class="lbl" style="color:#830051">Headline</span>
      <div style="font-size:11.5pt;${kd.headline ? "" : "font-style:italic;color:#9AA3A0"}">${esc2(kd.headline || "— add a headline in Project Data —")}</div></div>
    <div class="rags">${RAG_DIMS.map(d => { const [bg, fg, lbl2] = ragColor(p.rag?.[d] || "G"); return `<div class="rag" style="background:${bg}"><b>${d}</b><div class="st" style="color:${fg}">${lbl2}</div></div>`; }).join("")}</div>
    <div class="grid2" style="margin-top:4mm">
      <div class="zone"><span class="lbl" style="color:#830051">Top risks — from Project Data</span>
        ${(kd.risks.slice(0, 3).length ? kd.risks.slice(0, 3) : [{ desc: "— add risks in Project Data —" }]).map(r => `<div style="font-size:10pt;margin-top:1.6mm">• ${esc2(r.desc)}${r.owner ? ` <span style="color:#6B6B6B;font-size:8.5pt">— ${esc2(r.owner)}${r.due ? ", due " + esc2(r.due) : ""}</span>` : ""}</div>`).join("")}</div>
      <div class="zone gold"><span class="lbl" style="color:#8A6200">Decisions needed</span>
        ${(() => { const dn = kd.decisions.filter(d => d.status !== "taken").slice(0, 3); return (dn.length ? dn : [{ text: "— none open: an empty box is a statement —" }]).map((d, i) => `<div style="font-size:10pt;margin-top:1.6mm"><b style="font-family:'Courier New';color:#8A6200">D${i + 1}</b> ${esc2(d.text)}${d.owner ? ` <span style="color:#6B6B6B;font-size:8.5pt">— ${esc2(d.owner)}</span>` : ""}</div>`).join(""); })()}</div>
    </div>
    <div class="zone navy"><span class="lbl" style="color:#003865">Look-ahead</span>
      <div style="font-size:10.5pt">Next milestone: <b>${esc2(kd.milestone || "—")}</b>${kd.milestoneDate ? " — " + esc2(kd.milestoneDate) : ""} — confidence ${kd.confidence}%</div></div>
    ${foot}</div>`;

  const t01page = () => `
  <div class="page">${head2("T01 · Project charter — drafted from the Delivery Canvas", "Project", "charter")}
    <div class="grid2">
      <div>
        <div class="zone"><span class="lbl" style="color:#830051">Problem</span><div style="font-size:10pt">${esc2(cv.problem || "— complete in the Delivery Canvas —")}</div></div>
        <div class="zone"><span class="lbl" style="color:#8A9900">Outcome &amp; success measures (→ T13)</span><div style="font-size:10pt">${esc2(cv.outcome || "—")}</div></div>
        <div class="zone"><span class="lbl" style="color:#003865">Scope &amp; edges</span><div style="font-size:10pt">${esc2(cv.solution || "—")}</div></div>
      </div>
      <div>
        <div class="zone"><span class="lbl" style="color:#003865">Users &amp; stakeholders</span><div style="font-size:10pt">${esc2(cv.users || "—")}</div></div>
        <div class="zone"><span class="lbl" style="color:#8A9900">Value hypothesis</span><div style="font-size:10pt">${esc2(cv.hypothesis || "—")}</div></div>
        <div class="zone"><span class="lbl" style="color:#B3261E">Top risks &amp; dependencies (→ RAID)</span><div style="font-size:10pt">${esc2(cv.risks || "—")}</div></div>
        <div class="zone mul"><div style="font-size:9.5pt;color:#830051;font-weight:700">Tier ${esc2(p.tier)} · Signatures: Sponsor ____ &nbsp; Sr. Director ____ &nbsp; PM ____</div></div>
      </div>
    </div>${foot}</div>`;

  const t05pages = () => {
    const dn = kd.decisions.slice(0, 6);
    return t04page() + `
  <div class="page">${head2("T05 · SteerCo — slide 2", "Decisions requested", "today")}
    <table><tr><th style="width:8mm">#</th><th>Decision</th><th style="width:38mm">Decision-maker</th><th style="width:22mm">Status</th></tr>
      ${(dn.length ? dn : [{ text: "— add decisions in Project Data —" }]).map((d, i) => `<tr><td style="font-family:'Courier New';color:#8A6200;font-weight:700">D${i + 1}</td><td>${esc2(d.text)}</td><td>${esc2(d.owner || "")}</td><td style="color:${d.status === "taken" ? "#2E7D32" : "#C77800"}">${esc2(d.status || "")}</td></tr>`).join("")}
    </table>${foot}</div>
  <div class="page">${head2("T05 · SteerCo — slide 3", "Value tracker", "extract")}
    <table><tr><th>Benefit</th><th style="width:28mm">Baseline</th><th style="width:32mm">Target</th><th style="width:34mm">Owner (business)</th><th style="width:24mm">Status</th></tr>
      ${((kd.benefits.length ? kd.benefits : [{ name: "— add benefits in Project Data —" }]).slice(0, 6)).map(b => `<tr><td>${esc2(b.name)}</td><td>${esc2(b.baseline || "")}</td><td>${esc2(b.target || "")}</td><td>${esc2(b.owner || "")}</td><td style="font-weight:700;color:${b.status === "at risk" ? "#B3261E" : b.status === "realised" ? "#2E7D32" : "#1C2222"}">${esc2(b.status || "")}</td></tr>`).join("")}
    </table>${foot}</div>
  <div class="page">${head2("T05 · SteerCo — slide 4", "Plan &", "milestones")}
    <table><tr><th>Milestone (outcome)</th><th style="width:24mm">Due</th><th style="width:30mm">Owner</th><th style="width:24mm">Confidence</th><th style="width:20mm">Status</th></tr>
      ${((plan.length ? plan : [{ name: "— add milestones in Workspace › Plan —" }]).slice(0, 8)).map(m => { const c2 = m.conf ?? 80; return `<tr><td>${esc2(m.name)}</td><td>${esc2(m.due || "")}</td><td>${esc2(m.owner || "")}</td><td style="font-weight:700;color:${c2 < 60 ? "#B3261E" : c2 < 80 ? "#C77800" : "#2E7D32"}">${m.name ? c2 + "%" : ""}</td><td style="color:${m.status === "done" ? "#2E7D32" : "#1C2222"}">${esc2(m.status || "")}</td></tr>`; }).join("")}
    </table>
    <div style="font-size:8.5pt;color:#6B6B6B;font-style:italic;margin-top:3mm">Baseline locked at gates — any re-baseline carries a T08 entry. Confidence comes from the plan of record, not optimism in the room.</div>${foot}</div>
  <div class="page">${head2("T05 · SteerCo — slide 5", "Risks &", "escalations")}
    ${(kd.risks.slice(0, 4).length ? kd.risks.slice(0, 4).map((r, i) => `<div class="zone" style="${i === 0 ? "background:#F8E9E8;border-color:#fff" : ""}"><div style="font-size:10.5pt"><b style="font-family:'Courier New';color:#B3261E">R${i + 1}</b> ${esc2(r.desc)}</div><div style="font-size:8.5pt;color:#6B6B6B;margin-top:1mm">Owner: ${esc2(r.owner || "—")} · mitigation due: ${esc2(r.due || "—")} · bring options + recommendation, never the problem alone</div></div>`).join("") : `<div class="zone"><div style="font-size:11pt;font-style:italic;color:#6B6B6B">No escalated risks this cycle — this page saying so is itself the signal, and the meeting shortens.</div></div>`)}
    ${foot}</div>`;
  };

  const zone = (label, color, content) => `<div class="zone"><span class="lbl" style="color:${color}">${label}</span><div style="font-size:10pt">${content}</div></div>`;
  const genericPage = (eyebrow, tA, tB, inner) => `<div class="page">${head2(eyebrow, tA, tB)}${inner}${foot}</div>`;
  const bc = p.bizcase || {}; const eps = p.epics || []; const sh2 = p.stakeholders || []; const imp2 = p.impact || []; const cl2 = p.closure || {};
  const t02page = () => genericPage("T02 \u00b7 Business case", "Business", "case",
    zone("Problem \u2014 sized", "#830051", esc2(bc.problemSized || "\u2014")) +
    `<table><tr><th>Option</th><th>Trade-off</th><th style="width:30mm">TCO</th></tr>${(bc.options || []).map((o, i) => `<tr><td><b>${String.fromCharCode(65 + i)} \u00b7 ${esc2(o.name)}</b></td><td>${esc2(o.summary)}</td><td>${esc2(o.cost)}</td></tr>`).join("")}</table>` +
    zone("Recommendation &amp; ask", "#8A6200", esc2(bc.recommendation || "\u2014") + (bc.ask ? "<br><b>Ask:</b> " + esc2(bc.ask) : "")) +
    zone("Value hypotheses (T13)", "#8A9900", kd.benefits.map(b => "\u2022 " + esc2(b.name)).join("<br>") || "\u2014"));
  const t15pages = () => eps.map((e, i) => genericPage(`T15 \u00b7 Epic one-pager \u2014 ${i + 1}/${eps.length}`, "Epic:", esc2(e.title || "untitled"),
    `<div class="grid2"><div>${zone("User", "#003865", esc2(e.user || "\u2014"))}${zone("Problem \u2014 with evidence", "#830051", esc2(e.problem || "\u2014"))}${zone("Value hypothesis", "#8A9900", esc2(e.hypothesis || "\u2014"))}</div><div>${zone("Acceptance criteria", "#003865", esc2(e.acceptance || "\u2014"))}${zone("Instrumentation \u2014 no telemetry, no Done", "#8A6200", esc2(e.instrumentation || "\u2014"))}</div></div>`)).join("") || genericPage("T15", "Epic", "one-pagers", zone("Empty", "#830051", "Add epics in Studio \u203a T15"));
  const t09page = () => genericPage("T09 \u00b7 Stakeholder map \u2014 core team only", "Stakeholder", "map",
    `<table><tr><th>Name</th><th>Quadrant</th><th>Stance</th><th>Cares about</th><th>Action</th></tr>${(sh2.length ? sh2 : [{ name: "\u2014" }]).map(s3 => `<tr><td><b>${esc2(s3.name)}</b></td><td>${esc2(QUAD_LBL[s3.quadrant] || "")}</td><td>${esc2(s3.stanceFrom || "")} \u2192 ${esc2(s3.stanceTo || "")}</td><td><i>${esc2(s3.care || "")}</i></td><td>${esc2(s3.action || "")}</td></tr>`).join("")}</table>` +
    `<div style="font-size:8.5pt;color:#B3261E;font-style:italic;margin-top:3mm">Handle with care: candid by design \u2014 never pasted into broad-access decks.</div>`);
  const t10page = () => genericPage("T10 \u00b7 Change impact assessment", "Change", "impact",
    `<table><tr><th>Group</th><th>Size</th><th>Process</th><th>Tools</th><th>Skills</th><th>Behaviour</th><th>From \u2192 to</th><th>Readiness gap</th></tr>${(imp2.length ? imp2 : [{ group: "\u2014" }]).map(g => `<tr><td><b>${esc2(g.group)}</b></td><td>${esc2(g.size || "")}</td>${["process", "tools", "skills", "behaviour"].map(k => `<td style="font-weight:700;color:${["#9AA3A0", "#8A9900", "#C77800", "#B3261E"][g[k] ?? 0]}">${SEV_LBL[g[k] ?? 0]}</td>`).join("")}<td><i>${esc2(g.fromTo || "")}</i></td><td>${esc2(g.gap || "")}</td></tr>`).join("")}</table>`);
  const t17pages = () => genericPage("T17 \u00b7 Closure \u2014 1/3", "Outcomes vs", "charter",
    zone("Charter measures (Canvas)", "#830051", esc2(cv.outcome || "\u2014")) +
    `<table><tr><th>Benefit</th><th>Baseline \u2192 target</th><th>Owner</th><th>Final status</th></tr>${kd.benefits.map(b => `<tr><td>${esc2(b.name)}</td><td>${esc2(b.baseline || "")} \u2192 ${esc2(b.target || "")}</td><td>${esc2(b.owner || "")}</td><td style="font-weight:700">${esc2(b.status || "")}</td></tr>`).join("") || "<tr><td colspan=4>\u2014</td></tr>"}</table>` +
    zone("Final spend", "#830051", `${esc2(cl2.spend || "\u2014")} vs envelope ${esc2(cl2.envelope || "\u2014")} \u00b7 residual: ${esc2(cl2.residual || "none")}`)) +
    genericPage("T17 \u00b7 Closure \u2014 2/3", "Handover &", "transfer",
      zone("Benefits \u2192 business owners", "#8A9900", kd.benefits.filter(b => b.status !== "realised" && b.status !== "written off").map(b => `\u2022 ${esc2(b.name)} \u2192 ${esc2(b.owner || "owner?")} \u00b7 signature ___`).join("<br>") || "\u2014") +
      zone("Open risks \u2192 run owner", "#003865", kd.risks.map(r => `\u2022 ${esc2(r.desc)} \u2192 ${esc2(cl2.runOwner || "service owner ___")}`).join("<br>") || "\u2014")) +
    genericPage("T17 \u00b7 Closure \u2014 3/3", "Lessons &", "release",
      zone("Keep", "#8A9900", esc2(cl2.keep || "\u2014")) + zone("Change", "#C77800", esc2(cl2.change || "\u2014")) + zone("Stop", "#B3261E", esc2(cl2.stop || "\u2014")) +
      zone("We'd tell the next team\u2026", "#830051", esc2(cl2.tellNext || "\u2014")));
  const cm9 = p.comms || [];
  const t11page = () => genericPage("T11 \u00b7 Communications & engagement plan", "Comms", "plan",
    `<table><tr><th>Audience</th><th>Message</th><th>Channel</th><th>Sender</th><th style="width:22mm">Date</th><th style="width:18mm">Status</th></tr>${(cm9.length ? cm9 : [{ audience: "\u2014" }]).map(r => `<tr><td><b>${esc2(r.audience)}</b></td><td>${esc2(r.message || "")}</td><td>${esc2(r.channel || "")}</td><td style="color:#830051;font-weight:700">${esc2(r.sender || "")}</td><td>${esc2(r.date || "")}</td><td>${esc2(r.status || "")}</td></tr>`).join("")}</table>` +
    zone("Rule", "#8A6200", "Senders are leaders \u2014 the project drafts, credible voices deliver. Sequence aware \u2192 trained \u2192 live."));
  const PAGES = { t01: t01page, t04: t04page, t05: t05pages, t02: t02page, t15: t15pages, t09: t09page, t10: t10page, t17: t17pages, t11: t11page };
  const body = (PAGES[kind] || t04page)();
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc2(p.code)} ${kind.toUpperCase()} — ${esc2(p.name)}</title>${css}</head>
  <body><div class="printhint">Ctrl/Cmd+P → Save as PDF (landscape)</div>${body}</body></html>`;
}

/* ================= TEMPLATE BUILDERS (production order delivered) ================= */
const QUAD_LBL = { mc: "Manage closely", ks: "Keep satisfied", ki: "Keep informed", mon: "Monitor" };
const SEV_LBL = ["none", "low", "medium", "high"];
const SEV_COL = [C.soft, C.limeLt, C.goldLt, "#F8E9E8"];
const SEV_FG = [C.faint, C.lime, "#8A6200", C.red];
const Inp = ({ v, on, ph, w, mono }) => (
  <input value={v || ""} onChange={e => on(e.target.value)} placeholder={ph}
    style={{ flex: w ? `0 0 ${w}px` : 1, minWidth: 70, border: `1px solid ${C.soft}`, background: "#FBFAF8", borderRadius: 7, padding: "7px 9px", fontSize: 12, fontFamily: mono ? MONO : BODY }} />
);
const TArea = ({ v, on, ph, rows = 2 }) => (
  <textarea value={v || ""} onChange={e => on(e.target.value)} placeholder={ph} rows={rows}
    style={{ width: "100%", border: `1px solid ${C.soft}`, background: "#FBFAF8", borderRadius: 8, padding: "8px 10px", fontSize: 12.5, lineHeight: 1.5, color: C.ink }} />
);
function BuilderHead({ projects, project, setSel, title, blurb }) {
  return (
    <Card style={{ marginBottom: 14, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
      <ProjectPicker projects={projects} project={project} setSel={setSel} />
      <div style={{ flex: 1, minWidth: 220 }}>
        <div style={{ fontFamily: DISP, fontWeight: 800, fontSize: 16 }}>{title}</div>
        <div style={{ fontSize: 12, color: C.mid }}>{blurb} Saves as you type → generate from <b>Documents & exports</b>.</div>
      </div>
    </Card>
  );
}

/* ---- T02 Business Case ---- */
function BizCaseBuilder({ projects, project, setSel, update }) {
  if (!project) return <Card>Add a project first.</Card>;
  const bc = { problemSized: "", options: [], recommendation: "", tco: "", sensitivity: "", ask: "", ...(project.bizcase || {}) };
  const set = patch => update(project.id, { bizcase: { ...bc, ...patch } });
  const setOpt = (id, patch) => set({ options: bc.options.map(o => o.id === id ? { ...o, ...patch } : o) });
  return (
    <div>
      <BuilderHead projects={projects} project={project} setSel={setSel} title="T02 · Business Case & Value Hypothesis" blurb="Problem sized with data, ≥3 options including do-nothing, a recommendation and the ask." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(330px,1fr))", gap: 14 }}>
        <Card style={{ gridColumn: "1/-1" }}>
          <SectionLabel>Problem — sized, not asserted</SectionLabel>
          <TArea v={bc.problemSized} on={v => set({ problemSized: v })} ph="e.g. Field managers wait ~5 days for performance answers; ~120 requests/month × 45 min analyst time ≈ €11k/month of latency and rework." rows={2} />
        </Card>
        <Card style={{ gridColumn: "1/-1" }}>
          <SectionLabel color={C.navy}>Options — the do-nothing option is mandatory</SectionLabel>
          {bc.options.map((o, i) => (
            <div key={o.id} style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontFamily: MONO, fontSize: 11, color: C.navy, fontWeight: 600, minWidth: 18 }}>{String.fromCharCode(65 + i)}</span>
              <Inp v={o.name} on={v => setOpt(o.id, { name: v })} ph={i === 0 ? "Do nothing" : "Option name"} w={170} />
              <Inp v={o.summary} on={v => setOpt(o.id, { summary: v })} ph="one-line trade-off" />
              <Inp v={o.cost} on={v => setOpt(o.id, { cost: v })} ph="TCO €" w={100} mono />
              <button onClick={() => set({ options: bc.options.filter(x => x.id !== o.id) })} style={{ border: "none", background: "transparent", color: C.faint, cursor: "pointer" }}>×</button>
            </div>
          ))}
          <button onClick={() => set({ options: [...bc.options, { id: uid(), name: bc.options.length === 0 ? "Do nothing" : "", summary: "", cost: "" }] })}
            style={{ border: `1px dashed ${C.line}`, background: "#fff", color: C.navy, borderRadius: 8, padding: "7px 12px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>+ option</button>
        </Card>
        <Card>
          <SectionLabel>Recommendation & ask</SectionLabel>
          <TArea v={bc.recommendation} on={v => set({ recommendation: v })} ph="Option B, because… (cost, value, risk left on the table)" rows={2} />
          <div style={{ height: 8 }} />
          <Inp v={bc.ask} on={v => set({ ask: v })} ph="The ask: € envelope + FTEs + decision date" />
        </Card>
        <Card>
          <SectionLabel color={"#8A6200"}>TCO & sensitivity</SectionLabel>
          <Inp v={bc.tco} on={v => set({ tco: v })} ph="Total cost of ownership, by phase (build/run, 3y)" />
          <div style={{ height: 8 }} />
          <Inp v={bc.sensitivity} on={v => set({ sensitivity: v })} ph="Sensitivity: which assumption breaks the case first?" />
          <div style={{ fontSize: 11, color: C.faint, marginTop: 8 }}>Value hypotheses come from Project Data → Benefits and print with the case — keep them there, single source.</div>
        </Card>
      </div>
    </div>
  );
}

/* ---- T15 Epic one-pagers ---- */
function EpicsBuilder({ projects, project, setSel, update }) {
  if (!project) return <Card>Add a project first.</Card>;
  const eps = project.epics || [];
  const set = v => update(project.id, { epics: v });
  const setE = (id, patch) => set(eps.map(e => e.id === id ? { ...e, ...patch } : e));
  return (
    <div>
      <BuilderHead projects={projects} project={project} setSel={setSel} title="T15 · Feature / Epic one-pagers" blurb="No epic enters the board without one. They ride the JIRA export as the epic description." />
      <button onClick={() => set([...eps, { id: uid(), title: "", user: "", problem: "", hypothesis: "", acceptance: "", instrumentation: "" }])}
        style={{ border: `1px dashed ${C.line}`, background: "#fff", color: C.mul, borderRadius: 9, padding: "9px 16px", fontSize: 13, cursor: "pointer", fontWeight: 700, fontFamily: DISP, marginBottom: 14 }}>+ new epic one-pager</button>
      {eps.length === 0 && <Card style={{ color: C.mid, fontSize: 13 }}>The quality bar in one rule: user + evidenced problem + falsifiable hypothesis + acceptance + instrumentation. "No telemetry, no Done."</Card>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: 14 }}>
        {eps.map((e, i) => (
          <Card key={e.id} style={{ borderTop: `3px solid ${C.navy}` }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontFamily: MONO, fontSize: 10.5, color: C.navy }}>EP-{String(i + 1).padStart(2, "0")}</span>
              <Inp v={e.title} on={v => setE(e.id, { title: v })} ph="Epic title (outcome, not feature name)" />
              <button onClick={() => set(eps.filter(x => x.id !== e.id))} style={{ border: "none", background: "transparent", color: C.faint, cursor: "pointer" }}>×</button>
            </div>
            {[["user", "User — who exactly?"], ["problem", "Problem — with evidence (quote, metric, ticket count)"], ["hypothesis", "Hypothesis — we believe… measurable in [indicator] by [date]"], ["acceptance", "Acceptance criteria — testable, 3–5 bullets"], ["instrumentation", "Instrumentation — events/telemetry that prove the hypothesis"]].map(([k, ph]) => (
              <div key={k} style={{ marginBottom: 7 }}>
                <TArea v={e[k]} on={v => setE(e.id, { [k]: v })} ph={ph} rows={k === "user" ? 1 : 2} />
              </div>
            ))}
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ---- T09 Stakeholder grid ---- */
function StakeBuilder({ projects, project, setSel, update }) {
  if (!project) return <Card>Add a project first.</Card>;
  const sh = project.stakeholders || [];
  const set = v => update(project.id, { stakeholders: v });
  const setS = (id, patch) => set(sh.map(s2 => s2.id === id ? { ...s2, ...patch } : s2));
  const quads = [["ks", C.navyLt, C.navy], ["mc", C.mulLt, C.mul], ["mon", C.soft, C.faint], ["ki", C.goldLt, "#8A6200"]];
  return (
    <div>
      <BuilderHead projects={projects} project={project} setSel={setSel} title="T09 · Stakeholder map — power / interest with stance" blurb="Candid by design: this stays in the core team. Click a chip's quadrant selector to move it on the grid." />
      <div style={{ display: "grid", gridTemplateColumns: "minmax(300px,1fr) minmax(300px,1.1fr)", gap: 16, alignItems: "start" }}>
        <Card style={{ padding: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {quads.map(([q, bg, fg]) => (
              <div key={q} style={{ background: bg, borderRadius: 10, minHeight: 130, padding: 10 }}>
                <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: ".12em", textTransform: "uppercase", color: fg, marginBottom: 6 }}>{QUAD_LBL[q]}</div>
                {sh.filter(s2 => s2.quadrant === q).map(s2 => (
                  <div key={s2.id} style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 99, padding: "4px 11px", fontSize: 11, marginBottom: 5, display: "inline-block", marginRight: 5 }}>
                    {s2.name || "—"} {s2.stanceFrom && s2.stanceTo && s2.stanceFrom !== s2.stanceTo ? <span style={{ color: fg, fontFamily: MONO, fontSize: 9 }}>{s2.stanceFrom}→{s2.stanceTo}</span> : null}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 9, color: C.faint, marginTop: 6 }}><span>↑ POWER</span><span>INTEREST →</span></div>
        </Card>
        <div>
          <button onClick={() => set([...sh, { id: uid(), name: "", role: "", quadrant: "mc", stanceFrom: "neutral", stanceTo: "supporter", care: "", action: "" }])}
            style={{ border: `1px dashed ${C.line}`, background: "#fff", color: C.mul, borderRadius: 9, padding: "8px 14px", fontSize: 12.5, cursor: "pointer", fontWeight: 700, fontFamily: DISP, marginBottom: 10 }}>+ stakeholder</button>
          {sh.map(s2 => (
            <Card key={s2.id} style={{ padding: 12, marginBottom: 10 }}>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                <Inp v={s2.name} on={v => setS(s2.id, { name: v })} ph="Name · role" w={170} />
                <select value={s2.quadrant} onChange={e => setS(s2.id, { quadrant: e.target.value })} style={{ border: `1px solid ${C.soft}`, borderRadius: 7, padding: "6px", fontSize: 11 }}>
                  {Object.entries(QUAD_LBL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select>
                {["blocker", "sceptic", "neutral", "supporter", "champion"].map ? null : null}
                <select value={s2.stanceFrom} onChange={e => setS(s2.id, { stanceFrom: e.target.value })} style={{ border: `1px solid ${C.soft}`, borderRadius: 7, padding: "6px", fontSize: 11 }}>
                  {["blocker", "sceptic", "neutral", "supporter", "champion"].map(x => <option key={x}>{x}</option>)}
                </select>
                <span style={{ color: C.faint }}>→</span>
                <select value={s2.stanceTo} onChange={e => setS(s2.id, { stanceTo: e.target.value })} style={{ border: `1px solid ${C.soft}`, borderRadius: 7, padding: "6px", fontSize: 11 }}>
                  {["neutral", "supporter", "champion"].map(x => <option key={x}>{x}</option>)}
                </select>
                <button onClick={() => set(sh.filter(x => x.id !== s2.id))} style={{ marginLeft: "auto", border: "none", background: "transparent", color: C.faint, cursor: "pointer" }}>×</button>
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                <Inp v={s2.care} on={v => setS(s2.id, { care: v })} ph="What they care about — their words, from a real conversation" />
                <Inp v={s2.action} on={v => setS(s2.id, { action: v })} ph="Engagement action + owner + date" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---- T10 Impact form ---- */
function ImpactBuilder({ projects, project, setSel, update }) {
  if (!project) return <Card>Add a project first.</Card>;
  const imp = project.impact || [];
  const set = v => update(project.id, { impact: v });
  const setG = (id, patch) => set(imp.map(g => g.id === id ? { ...g, ...patch } : g));
  const LENSES2 = [["process", "Process"], ["tools", "Tools"], ["skills", "Skills"], ["behaviour", "Behaviour"]];
  return (
    <div>
      <BuilderHead projects={projects} project={project} setSel={setSel} title="T10 · Change Impact Assessment" blurb="Per affected group, severity across four lenses. Built from interviews, signed before G2 — never after design freeze." />
      <button onClick={() => set([...imp, { id: uid(), group: "", size: "", process: 0, tools: 0, skills: 0, behaviour: 0, fromTo: "", gap: "" }])}
        style={{ border: `1px dashed ${C.line}`, background: "#fff", color: C.mul, borderRadius: 9, padding: "8px 14px", fontSize: 12.5, cursor: "pointer", fontWeight: 700, fontFamily: DISP, marginBottom: 12 }}>+ affected group</button>
      {imp.map(g => {
        const maxSev = Math.max(g.process ?? 0, g.tools ?? 0, g.skills ?? 0, g.behaviour ?? 0);
        return (
          <Card key={g.id} style={{ marginBottom: 12, borderLeft: `4px solid ${SEV_FG[maxSev]}` }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginBottom: 8 }}>
              <Inp v={g.group} on={v => setG(g.id, { group: v })} ph="Group (e.g. Field managers — Iberia)" w={240} />
              <Inp v={g.size} on={v => setG(g.id, { size: v })} ph="size (~n)" w={90} mono />
              <Chip bg={SEV_COL[maxSev]} color={SEV_FG[maxSev]}>overall: {SEV_LBL[maxSev]}</Chip>
              <button onClick={() => set(imp.filter(x => x.id !== g.id))} style={{ marginLeft: "auto", border: "none", background: "transparent", color: C.faint, cursor: "pointer" }}>×</button>
            </div>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 8 }}>
              {LENSES2.map(([k, l]) => (
                <label key={k} style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 11.5, color: C.mid }}>
                  {l}
                  <input type="range" min={0} max={3} value={g[k] ?? 0} onChange={e => setG(g.id, { [k]: +e.target.value })} style={{ width: 90 }} />
                  <span style={{ fontFamily: MONO, fontSize: 10.5, color: SEV_FG[g[k] ?? 0], minWidth: 48 }}>{SEV_LBL[g[k] ?? 0]}</span>
                </label>
              ))}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <Inp v={g.fromTo} on={v => setG(g.id, { fromTo: v })} ph="From → to: a day-in-the-life sentence" />
              <Inp v={g.gap} on={v => setG(g.id, { gap: v })} ph="Readiness gap → becomes a T11 comms/training row" />
            </div>
          </Card>
        );
      })}
      {imp.length === 0 && <Card style={{ color: C.mid, fontSize: 13 }}>Anti-pattern this kills: one generic "users" group assessed from a desk. Severity 3 anywhere = named treatment plan, leaders as senders, readiness gate evidence.</Card>}
    </div>
  );
}

/* ---- T17 Closure ---- */
function ClosureBuilder({ projects, project, setSel, update }) {
  if (!project) return <Card>Add a project first.</Card>;
  const cl = { spend: "", envelope: "", residual: "", keep: "", change: "", stop: "", tellNext: "", runOwner: "", ...(project.closure || {}) };
  const set = patch => update(project.id, { closure: { ...cl, ...patch } });
  const kd = { ...KD_DEFAULT, ...(project.keydata || {}) };
  return (
    <div>
      <BuilderHead projects={projects} project={project} setSel={setSel} title="T17 · Closure & handover" blurb="Outcomes vs charter with no narrative laundering. The generator pulls benefits, open risks and the canvas automatically." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(330px,1fr))", gap: 14 }}>
        <Card>
          <SectionLabel>Final spend vs envelope</SectionLabel>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <Inp v={cl.spend} on={v => set({ spend: v })} ph="actual €" mono />
            <Inp v={cl.envelope} on={v => set({ envelope: v })} ph="envelope €" mono />
          </div>
          <div style={{ height: 8 }} />
          <Inp v={cl.residual} on={v => set({ residual: v })} ph="Residual commitments (licences, run cost…)" />
          <div style={{ height: 8 }} />
          <Inp v={cl.runOwner} on={v => set({ runOwner: v })} ph="Run / service owner receiving open risks" />
          <div style={{ fontSize: 11, color: C.faint, marginTop: 10 }}>Auto-pulled into the pack: {kd.benefits.length} benefit(s) with owners and honest status · {kd.risks.length} open risk(s) for transfer · charter measures from the Canvas.</div>
        </Card>
        <Card>
          <SectionLabel color={C.lime}>Lessons → Framework Council</SectionLabel>
          <TArea v={cl.keep} on={v => set({ keep: v })} ph="KEEP — what the next team should copy" rows={2} />
          <div style={{ height: 6 }} />
          <TArea v={cl.change} on={v => set({ change: v })} ph="CHANGE — what we'd do differently, and the mechanism" rows={2} />
          <div style={{ height: 6 }} />
          <TArea v={cl.stop} on={v => set({ stop: v })} ph="STOP — what cost effort and returned nothing" rows={2} />
        </Card>
        <Card style={{ gridColumn: "1/-1" }}>
          <SectionLabel color={"#8A6200"}>"We'd tell the next team…"</SectionLabel>
          <TArea v={cl.tellNext} on={v => set({ tellNext: v })} ph="One honest paragraph. The credibility of every future business case is priced off this." rows={2} />
        </Card>
      </div>
    </div>
  );
}

/* ================= PPTX BUILDERS — T02 · T15 · T09 · T10 · T17 ================= */
function buildT02(pptx, p) {
  const bc = { problemSized: "", options: [], recommendation: "", tco: "", sensitivity: "", ask: "", ...(p.bizcase || {}) };
  const kd = { ...KD_DEFAULT, ...(p.keydata || {}) };
  const s = pptx.addSlide();
  azFrame(pptx, s, "T02 · Business case & value hypothesis", "Business", "case", p);
  s.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.55, y: 1.92, w: 12.23, h: 0.85, rectRadius: 0.06, fill: { color: "F6E9F1" } });
  s.addText([{ text: "PROBLEM — SIZED   ", options: { fontFace: "Arial", fontSize: 9, bold: true, color: AZ.mul, charSpacing: 2 } },
    { text: bc.problemSized || "— complete in Studio › T02 —", options: { fontFace: "Calibri", fontSize: 11.5, italic: !bc.problemSized, color: bc.problemSized ? "1C2222" : AZ.mid } }],
    { x: 0.8, y: 2.06, w: 11.7, h: 0.6 });
  const ohdr = ["Option", "Trade-off", "TCO"].map(t => ({ text: t, options: { fill: { color: AZ.graph }, color: "FFFFFF", bold: true, fontFace: "Arial", fontSize: 10 } }));
  const orows = [(ohdr)];
  (bc.options.length ? bc.options : [{ name: "— add options (incl. do-nothing) —" }]).slice(0, 4).forEach((o, i) => {
    orows.push([
      { text: String.fromCharCode(65 + i) + " · " + (o.name || ""), options: { fontFace: "Calibri", fontSize: 10.5, bold: true } },
      { text: o.summary || "", options: { fontFace: "Calibri", fontSize: 10.5 } },
      { text: o.cost || "", options: { fontFace: "Courier New", fontSize: 10 } },
    ]);
  });
  s.addTable(orows, { x: 0.55, y: 2.95, w: 7.3, colW: [2.3, 3.7, 1.3], border: { pt: 0.5, color: AZ.line }, rowH: 0.46, valign: "middle", margin: 0.05 });
  s.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 8.05, y: 2.95, w: 4.73, h: 2.3, rectRadius: 0.06, fill: { color: "FDF3DC" } });
  s.addText("RECOMMENDATION & ASK", { x: 8.25, y: 3.08, w: 4.3, h: 0.24, fontFace: "Arial", fontSize: 8.5, bold: true, color: "8A6200", charSpacing: 1.5 });
  s.addText(bc.recommendation || "—", { x: 8.25, y: 3.36, w: 4.35, h: 1.1, fontFace: "Calibri", fontSize: 10.5, color: "1C2222" });
  s.addText(bc.ask ? "Ask: " + bc.ask : "", { x: 8.25, y: 4.5, w: 4.35, h: 0.6, fontFace: "Calibri", fontSize: 10.5, bold: true, color: AZ.mul });
  s.addText("VALUE HYPOTHESES (from T13 rows)", { x: 0.55, y: 5.45, w: 6, h: 0.24, fontFace: "Arial", fontSize: 8.5, bold: true, color: AZ.lime, charSpacing: 1.5 });
  (kd.benefits.slice(0, 3).length ? kd.benefits.slice(0, 3) : [{ name: "— add benefits in Project Data —" }]).forEach((b, i) => {
    s.addText("• " + (b.name || "") + (b.baseline ? ` (${b.baseline} → ${b.target || "?"})` : ""), { x: 0.6, y: 5.72 + i * 0.34, w: 7.0, h: 0.32, fontFace: "Calibri", fontSize: 10, color: "1C2222" });
  });
  s.addText([{ text: "TCO: ", options: { bold: true } }, { text: (bc.tco || "—") + "   ", options: {} }, { text: "Sensitivity: ", options: { bold: true } }, { text: bc.sensitivity || "—", options: {} }],
    { x: 8.05, y: 5.72, w: 4.7, h: 1.0, fontFace: "Calibri", fontSize: 9.5, color: AZ.mid });
}
function buildT15(pptx, p) {
  const eps = (p.epics || []).length ? p.epics : [{ title: "— add epics in Studio › T15 —" }];
  eps.forEach((e, i) => {
    const s = pptx.addSlide();
    azFrame(pptx, s, `T15 · Epic one-pager — ${i + 1} of ${eps.length}`, "Epic:", (e.title || "untitled").slice(0, 40), p);
    const box = (x, y, w, h, label, text, accent) => {
      s.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.06, fill: { color: "FFFFFF" }, line: { color: AZ.line, width: 0.75 } });
      s.addText(label, { x: x + 0.16, y: y + 0.1, w: w - 0.3, h: 0.24, fontFace: "Arial", fontSize: 8.5, bold: true, color: accent, charSpacing: 1.5 });
      s.addText(text || "—", { x: x + 0.16, y: y + 0.36, w: w - 0.32, h: h - 0.48, fontFace: "Calibri", fontSize: 10.5, color: text ? "1C2222" : AZ.mid, italic: !text, valign: "top" });
    };
    box(0.55, 1.92, 6.0, 1.25, "USER — WHO EXACTLY", e.user, AZ.navy);
    box(0.55, 3.3, 6.0, 1.6, "PROBLEM — WITH EVIDENCE", e.problem, AZ.mul);
    box(0.55, 5.03, 6.0, 1.65, "VALUE HYPOTHESIS", e.hypothesis, AZ.lime);
    box(6.75, 1.92, 6.08, 2.4, "ACCEPTANCE CRITERIA", e.acceptance, AZ.navy);
    box(6.75, 4.45, 6.08, 1.7, "INSTRUMENTATION — NO TELEMETRY, NO DONE", e.instrumentation, "8A6200");
    s.addText("PO owns this page · linked from the JIRA epic · failed hypotheses are retired out loud at the value review.", { x: 6.75, y: 6.3, w: 6.0, h: 0.35, fontFace: "Calibri", fontSize: 8.5, italic: true, color: AZ.mid });
  });
}
function buildT09(pptx, p) {
  const sh = p.stakeholders || [];
  const s = pptx.addSlide();
  azFrame(pptx, s, "T09 · Stakeholder map — core team only", "Stakeholder", "map", p);
  const quads = [["ks", "KEEP SATISFIED", "E7EEF4", AZ.navy, 0.55, 1.95], ["mc", "MANAGE CLOSELY", "F6E9F1", AZ.mul, 3.85, 1.95], ["mon", "MONITOR", "F6F4F2", AZ.mid, 0.55, 4.3], ["ki", "KEEP INFORMED", "FDF3DC", "8A6200", 3.85, 4.3]];
  quads.forEach(([q, lbl, bg, fg, x, y]) => {
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x, y, w: 3.2, h: 2.25, rectRadius: 0.06, fill: { color: bg } });
    s.addText(lbl, { x: x + 0.15, y: y + 0.1, w: 2.9, h: 0.24, fontFace: "Arial", fontSize: 8.5, bold: true, color: fg, charSpacing: 1.5 });
    sh.filter(s2 => s2.quadrant === q).slice(0, 5).forEach((s2, i) => {
      s.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: x + 0.18, y: y + 0.42 + i * 0.36, w: 2.85, h: 0.3, rectRadius: 0.15, fill: { color: "FFFFFF" }, line: { color: AZ.line, width: 0.5 } });
      s.addText((s2.name || "—") + (s2.stanceFrom !== s2.stanceTo ? `  ${s2.stanceFrom}→${s2.stanceTo}` : ""), { x: x + 0.3, y: y + 0.42 + i * 0.36, w: 2.65, h: 0.3, fontFace: "Calibri", fontSize: 8.5, color: "1C2222", valign: "middle" });
    });
  });
  s.addText("POWER ↑   INTEREST →", { x: 0.55, y: 6.62, w: 4, h: 0.26, fontFace: "Courier New", fontSize: 8.5, color: AZ.faint });
  const thdr = ["Stakeholder", "Stance", "Cares about (their words)", "Engagement action"].map(t => ({ text: t, options: { fill: { color: AZ.graph }, color: "FFFFFF", bold: true, fontFace: "Arial", fontSize: 9 } }));
  const trows = [thdr];
  (sh.length ? sh : [{ name: "— add stakeholders in Studio › T09 —" }]).slice(0, 7).forEach(s2 => {
    trows.push([
      { text: s2.name || "", options: { fontFace: "Calibri", fontSize: 9, bold: true } },
      { text: s2.stanceFrom ? `${s2.stanceFrom} → ${s2.stanceTo}` : "", options: { fontFace: "Calibri", fontSize: 9 } },
      { text: s2.care || "", options: { fontFace: "Calibri", fontSize: 9, italic: true } },
      { text: s2.action || "", options: { fontFace: "Calibri", fontSize: 9 } },
    ]);
  });
  s.addTable(trows, { x: 7.25, y: 1.95, w: 5.53, colW: [1.25, 1.05, 1.7, 1.53], border: { pt: 0.5, color: AZ.line }, rowH: 0.5, valign: "middle", margin: 0.04 });
  s.addText("Handle with care: stance notes are candid by design — never pasted into broad-access decks.", { x: 7.25, y: 6.55, w: 5.5, h: 0.4, fontFace: "Calibri", fontSize: 8.5, italic: true, color: AZ.red });
}
function buildT10(pptx, p) {
  const imp = p.impact || [];
  const s = pptx.addSlide();
  azFrame(pptx, s, "T10 · Change impact assessment — G2 evidence", "Change", "impact", p);
  const sevFill = ["FFFFFF", "EFF4D6", "FDF3DC", "F8E9E8"], sevTxt = ["9AA3A0", "8A9900", "C77800", "B3261E"];
  const hdr = ["Group", "Size", "Process", "Tools", "Skills", "Behaviour", "From → to", "Readiness gap → T11"].map(t => ({ text: t, options: { fill: { color: AZ.graph }, color: "FFFFFF", bold: true, fontFace: "Arial", fontSize: 9 } }));
  const rows = [hdr];
  (imp.length ? imp : [{ group: "— add groups in Studio › T10 —" }]).slice(0, 7).forEach(g => {
    const cell = k => ({ text: SEV_LBL[g[k] ?? 0], options: { fontFace: "Arial", fontSize: 9, bold: true, color: sevTxt[g[k] ?? 0], fill: { color: sevFill[g[k] ?? 0] }, align: "center" } });
    rows.push([
      { text: g.group || "", options: { fontFace: "Calibri", fontSize: 9.5, bold: true } },
      { text: g.size || "", options: { fontFace: "Courier New", fontSize: 9 } },
      cell("process"), cell("tools"), cell("skills"), cell("behaviour"),
      { text: g.fromTo || "", options: { fontFace: "Calibri", fontSize: 9, italic: true } },
      { text: g.gap || "", options: { fontFace: "Calibri", fontSize: 9 } },
    ]);
  });
  s.addTable(rows, { x: 0.55, y: 2.0, w: 12.23, colW: [2.1, 0.7, 0.95, 0.95, 0.95, 1.05, 2.7, 2.83], border: { pt: 0.5, color: AZ.line }, rowH: 0.55, valign: "middle", margin: 0.05 });
  s.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.55, y: 6.15, w: 12.23, h: 0.75, rectRadius: 0.06, fill: { color: "E7EEF4" } });
  s.addText([{ text: "Treatment rule:  ", options: { bold: true, color: AZ.navy } }, { text: "severity HIGH on any lens → named treatment plan, leaders as senders (T11), and explicit evidence at the G3 readiness gate. Built from interviews; co-signed where regulated.", options: { color: "1C2222" } }],
    { x: 0.8, y: 6.33, w: 11.7, h: 0.45, fontFace: "Calibri", fontSize: 10.5 });
}
function buildT17(pptx, p) {
  const cl = { spend: "", envelope: "", residual: "", keep: "", change: "", stop: "", tellNext: "", runOwner: "", ...(p.closure || {}) };
  const kd = { ...KD_DEFAULT, ...(p.keydata || {}) };
  const cv = p.canvas || {};
  // slide 1 — outcomes
  let s = pptx.addSlide();
  azFrame(pptx, s, "T17 · Closure pack — slide 1 of 3", "Outcomes vs", "charter", p);
  s.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.55, y: 1.92, w: 12.23, h: 1.0, rectRadius: 0.06, fill: { color: "FFFFFF" }, line: { color: AZ.line, width: 0.75 } });
  s.addText("CHARTER SUCCESS MEASURES (from the Canvas)", { x: 0.75, y: 2.04, w: 8, h: 0.24, fontFace: "Arial", fontSize: 8.5, bold: true, color: AZ.mul, charSpacing: 1.5 });
  s.addText(cv.outcome || "— outcome measures not captured in the Canvas —", { x: 0.75, y: 2.32, w: 11.8, h: 0.55, fontFace: "Calibri", fontSize: 10.5, color: cv.outcome ? "1C2222" : AZ.mid, italic: !cv.outcome });
  const bh = ["Benefit", "Baseline → target", "Owner", "Final status"].map(t => ({ text: t, options: { fill: { color: AZ.graph }, color: "FFFFFF", bold: true, fontFace: "Arial", fontSize: 9.5 } }));
  const br = [bh];
  (kd.benefits.length ? kd.benefits : [{ name: "— benefits in Project Data print here —" }]).slice(0, 5).forEach(b => {
    const col = b.status === "realised" ? AZ.lime : b.status === "written off" ? AZ.red : b.status === "at risk" ? "C77800" : "1C2222";
    br.push([
      { text: b.name || "", options: { fontFace: "Calibri", fontSize: 10 } },
      { text: (b.baseline || "") + (b.target ? " → " + b.target : ""), options: { fontFace: "Calibri", fontSize: 10 } },
      { text: b.owner || "", options: { fontFace: "Calibri", fontSize: 10 } },
      { text: b.status || "", options: { fontFace: "Arial", fontSize: 10, bold: true, color: col } },
    ]);
  });
  s.addTable(br, { x: 0.55, y: 3.1, w: 12.23, colW: [5.2, 3.0, 2.2, 1.83], border: { pt: 0.5, color: AZ.line }, rowH: 0.48, valign: "middle", margin: 0.05 });
  s.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.55, y: 6.0, w: 12.23, h: 0.9, rectRadius: 0.06, fill: { color: "F6E9F1" } });
  s.addText([{ text: "FINAL SPEND  ", options: { fontFace: "Arial", fontSize: 9, bold: true, color: AZ.mul, charSpacing: 2 } },
    { text: `${cl.spend || "—"} vs envelope ${cl.envelope || "—"}   ·   residual: ${cl.residual || "none"}   ·   no narrative laundering — a missed measure is stated plainly with the reason.`, options: { fontFace: "Calibri", fontSize: 11, color: "1C2222" } }],
    { x: 0.8, y: 6.22, w: 11.7, h: 0.55 });
  // slide 2 — handover
  s = pptx.addSlide();
  azFrame(pptx, s, "T17 · Closure pack — slide 2 of 3", "Value handover &", "transfer", p);
  s.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.55, y: 1.95, w: 6.0, h: 3.6, rectRadius: 0.06, fill: { color: "EFF4D6" } });
  s.addText("OPEN BENEFITS → BUSINESS OWNERS", { x: 0.75, y: 2.08, w: 5.5, h: 0.24, fontFace: "Arial", fontSize: 8.5, bold: true, color: AZ.lime, charSpacing: 1.5 });
  kd.benefits.filter(b => b.status !== "realised" && b.status !== "written off").slice(0, 4).forEach((b, i) => {
    s.addText(`• ${b.name || "—"} → ${b.owner || "owner?"} · quarterly cadence · signature ___`, { x: 0.78, y: 2.42 + i * 0.42, w: 5.6, h: 0.4, fontFace: "Calibri", fontSize: 10, color: "1C2222" });
  });
  s.addText("The test: the business owner can run the next value review without the project team.", { x: 0.78, y: 4.7, w: 5.5, h: 0.7, fontFace: "Calibri", fontSize: 9.5, italic: true, color: AZ.mid });
  s.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 6.8, y: 1.95, w: 6.0, h: 3.6, rectRadius: 0.06, fill: { color: "FFFFFF" }, line: { color: AZ.line, width: 0.75 } });
  s.addText("OPEN RISKS & RUN TRANSFER", { x: 7.0, y: 2.08, w: 5.5, h: 0.24, fontFace: "Arial", fontSize: 8.5, bold: true, color: AZ.navy, charSpacing: 1.5 });
  (kd.risks.slice(0, 3).length ? kd.risks.slice(0, 3) : [{ desc: "— no open risks recorded —" }]).forEach((r, i) => {
    s.addText(`• ${r.desc || ""} → ${cl.runOwner || "service owner ___"}`, { x: 7.0, y: 2.42 + i * 0.55, w: 5.6, h: 0.52, fontFace: "Calibri", fontSize: 9.5, color: "1C2222" });
  });
  s.addText(`Run owner: ${cl.runOwner || "___"} · support model & escalation path confirmed before the closure board, not in it.`, { x: 7.0, y: 4.6, w: 5.6, h: 0.7, fontFace: "Calibri", fontSize: 9.5, italic: true, color: AZ.mid });
  s.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.55, y: 5.75, w: 12.23, h: 1.05, rectRadius: 0.06, fill: { color: "F6F4F2" } });
  s.addText([{ text: "G4 exit test:  ", options: { bold: true, color: AZ.mul } }, { text: "every open benefit has a countersigned business owner; every open risk a named run owner. The Senior Director closes at Portfolio Review only when both columns are complete.", options: { color: "1C2222" } }],
    { x: 0.8, y: 5.98, w: 11.7, h: 0.65, fontFace: "Calibri", fontSize: 11 });
  // slide 3 — lessons
  s = pptx.addSlide();
  azFrame(pptx, s, "T17 · Closure pack — slide 3 of 3", "Lessons &", "release", p);
  [["KEEP", cl.keep, AZ.lime, "EFF4D6"], ["CHANGE", cl.change, "C77800", "FDF3DC"], ["STOP", cl.stop, AZ.red, "F8E9E8"]].forEach((r, i) => {
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.55 + i * 4.18, y: 1.95, w: 3.95, h: 2.2, rectRadius: 0.06, fill: { color: r[3] } });
    s.addText(r[0], { x: 0.75 + i * 4.18, y: 2.1, w: 3, h: 0.26, fontFace: "Arial", fontSize: 10, bold: true, color: r[2], charSpacing: 2 });
    s.addText(r[1] || "—", { x: 0.75 + i * 4.18, y: 2.42, w: 3.55, h: 1.6, fontFace: "Calibri", fontSize: 10.5, color: r[1] ? "1C2222" : AZ.mid, italic: !r[1], valign: "top" });
  });
  s.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.55, y: 4.4, w: 12.23, h: 1.2, rectRadius: 0.06, fill: { color: "F6E9F1" } });
  s.addText([{ text: "\u201cWe'd tell the next team\u2026\u201d  ", options: { bold: true, color: AZ.mul } }, { text: cl.tellNext || "— one honest paragraph —", options: { italic: !cl.tellNext, color: cl.tellNext ? "1C2222" : AZ.mid } }],
    { x: 0.8, y: 4.62, w: 11.7, h: 0.85, fontFace: "Calibri", fontSize: 11.5 });
  s.addText("Lessons route to the Framework Council with tier and context. And then it ends: space archived read-only, board closed — only the value tracker stays alive, in the business's hands.", { x: 0.55, y: 5.85, w: 12.2, h: 0.6, fontFace: "Calibri", fontSize: 10.5, italic: true, color: AZ.mid });
}

/* ================= MOCK TOOL VIEWERS (simple mode inside the app) ================= */
function MockDocViewer({ viewer, project, onClose }) {
  if (!viewer) return null;
  const { kind, label, ev } = viewer;
  const name = project?.name || "Project";
  const Shell = ({ tool, color, children }) => (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(28,34,34,.55)", zIndex: 50, display: "grid", placeItems: "center", padding: 18 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: "min(680px, 94vw)", maxHeight: "86vh", overflowY: "auto", background: "#fff", borderRadius: 14, boxShadow: "0 18px 50px rgba(0,0,0,.3)" }}>
        <div style={{ background: color, color: "#fff", padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, borderRadius: "14px 14px 0 0" }}>
          <span style={{ fontFamily: DISP, fontWeight: 800, fontSize: 13 }}>{tool}</span>
          <span style={{ fontFamily: MONO, fontSize: 9.5, opacity: .85 }}>SIMULATED · simple mode inside the Navigator</span>
          <button onClick={onClose} style={{ marginLeft: "auto", border: "none", background: "rgba(255,255,255,.18)", color: "#fff", borderRadius: 6, padding: "3px 10px", cursor: "pointer", fontSize: 13 }}>×</button>
        </div>
        <div style={{ padding: 18 }}>{children}</div>
        <div style={{ padding: "8px 18px 14px", fontSize: 10.5, color: C.faint }}>In the corporate deployment this button opens the real object via the Agent Blueprint connectors.</div>
      </div>
    </div>
  );
  if (kind === "confluence") return (
    <Shell tool="Confluence" color="#1868DB">
      <div style={{ fontFamily: MONO, fontSize: 10.5, color: C.faint, marginBottom: 6 }}>OBU DSAI › {name} › {label}</div>
      <div style={{ fontFamily: DISP, fontWeight: 800, fontSize: 20, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 11, color: C.faint, marginBottom: 12 }}>Owned by PM · last updated {ev.date} · <Chip bg={C.limeLt} color={C.lime}>current</Chip></div>
      <p style={{ fontSize: 13.5, lineHeight: 1.65 }}>{ev.detail}</p>
      {ev.discussion && <div style={{ borderLeft: `3px solid ${C.line}`, padding: "8px 12px", fontSize: 12.5, fontStyle: "italic", color: C.mid, marginTop: 10 }}>💬 {ev.discussion}</div>}
      <div style={{ marginTop: 14, padding: "9px 12px", background: "#F4F8FF", borderRadius: 8, fontSize: 11.5, color: C.mid }}>🔗 Linked: Decision Log (T08) · RAID sheet · {name} space home</div>
    </Shell>
  );
  if (kind === "smartsheet") return (
    <Shell tool="Smartsheet" color="#1D3D6E">
      <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 15, marginBottom: 10 }}>{name} — plan & RAID workspace</div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead><tr>{["Row", "Item", "Owner", "Date", "Status"].map(h => <th key={h} style={{ background: C.graph, color: "#fff", padding: "7px 9px", textAlign: "left", fontFamily: DISP, fontSize: 10.5 }}>{h}</th>)}</tr></thead>
        <tbody>
          <tr><td style={{ padding: 8, borderBottom: `1px solid ${C.soft}` }}>14</td><td style={{ padding: 8, borderBottom: `1px solid ${C.soft}`, color: C.faint }}>…</td><td style={{ padding: 8, borderBottom: `1px solid ${C.soft}` }} /><td style={{ padding: 8, borderBottom: `1px solid ${C.soft}` }} /><td style={{ padding: 8, borderBottom: `1px solid ${C.soft}` }} /></tr>
          <tr style={{ background: C.goldLt }}><td style={{ padding: 8, fontWeight: 700 }}>15</td><td style={{ padding: 8, fontWeight: 600 }}>{label}: {ev.title}</td><td style={{ padding: 8 }}>PM</td><td style={{ padding: 8, fontFamily: MONO, fontSize: 11 }}>{ev.date}</td><td style={{ padding: 8 }}><Chip bg={C.navyLt} color={C.navy}>open</Chip></td></tr>
          <tr><td style={{ padding: 8 }}>16</td><td style={{ padding: 8, color: C.faint }}>…</td><td /><td /><td /></tr>
        </tbody>
      </table>
      <div style={{ fontSize: 11.5, color: C.mid, marginTop: 10 }}>{ev.detail}</div>
    </Shell>
  );
  if (kind === "jira") return (
    <Shell tool="JIRA" color="#1868DB">
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
        <Chip bg="#E9F2FF" color="#1868DB">{(project?.code || "PRJ") + "-" + (40 + (ev.title.length % 50))}</Chip>
        <Chip bg={C.mulLt} color={C.mul}>Epic</Chip>
        <span style={{ marginLeft: "auto" }}><Chip bg={C.navyLt} color={C.navy}>IN PROGRESS</Chip></span>
      </div>
      <div style={{ fontFamily: DISP, fontWeight: 800, fontSize: 18, marginBottom: 10 }}>{label}</div>
      <div style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>{ev.detail}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 11.5, color: C.mid, background: "#FBFAF8", borderRadius: 8, padding: 12 }}>
        <div><b>Assignee:</b> PO</div><div><b>Sprint:</b> current</div>
        <div><b>Labels:</b> dcos, t15</div><div><b>Linked:</b> T15 one-pager (Confluence)</div>
      </div>
    </Shell>
  );
  if (kind === "ppt") return (
    <Shell tool="PowerPoint" color={"#" + "B7472A"}>
      <div style={{ aspectRatio: "16/9", border: `1px solid ${C.line}`, borderRadius: 8, position: "relative", overflow: "hidden", background: "#fff" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 7, background: C.mul }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 7, background: C.mul }} />
        <div style={{ padding: "26px 26px 0" }}>
          <div style={{ color: C.mul, fontWeight: 700, fontSize: 13, fontFamily: BODY }}>AstraZeneca</div>
          <div style={{ fontFamily: DISP, fontWeight: 800, fontSize: 21, marginTop: 14 }}><span style={{ color: "#3F4444" }}>{label.split(" ")[0]} </span><span style={{ color: C.mul }}>{label.split(" ").slice(1).join(" ")}</span></div>
          <div style={{ width: 38, height: 4, background: C.gold, marginTop: 6 }} />
          <div style={{ fontSize: 11.5, color: C.mid, marginTop: 12, lineHeight: 1.6 }}>{ev.detail}</div>
        </div>
      </div>
      <div style={{ fontSize: 11, color: C.faint, marginTop: 8 }}>Generated on the locked Governance Master layout · {ev.date} · review and sign before circulation.</div>
    </Shell>
  );
  if (kind === "teams") return (
    <Shell tool="Microsoft Teams" color="#5B5FC7">
      <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 14, marginBottom: 12 }}># {name} — delivery channel</div>
      {[(ev.discussion || ev.detail), "Noted — bring it to Thursday with the three options costed.", "On it. Deck draft will be in the channel by Wednesday EOD."].map((m, i) => (
        <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, flexDirection: i === 1 ? "row-reverse" : "row" }}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: i === 1 ? C.navy : C.mul, color: "#fff", display: "grid", placeItems: "center", fontFamily: DISP, fontWeight: 700, fontSize: 12, flexShrink: 0 }}>{i === 1 ? "SP" : "PM"}</div>
          <div style={{ background: i === 1 ? C.navyLt : "#F4F3F1", borderRadius: 10, padding: "8px 12px", fontSize: 12.5, maxWidth: "78%" }}>{m}</div>
        </div>
      ))}
    </Shell>
  );
  return (
    <Shell tool="Power BI" color="#E9A800">
      <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 14, marginBottom: 12 }}>{name} — {label}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 12 }}>
        {[["Activation", "92%", C.lime], ["Week-4 retention", "57%", C.amber], ["Sentiment", "3.9 / 5", C.navy]].map(([l, v, col]) => (
          <div key={l} style={{ background: "#FBFAF8", border: `1px solid ${C.soft}`, borderRadius: 10, padding: 12 }}>
            <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: ".1em", textTransform: "uppercase", color: C.faint }}>{l}</div>
            <div style={{ fontFamily: DISP, fontWeight: 800, fontSize: 22, color: col }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 70, padding: "0 4px" }}>
        {[42, 51, 48, 57, 61, 60, 66, 71].map((h, i) => <div key={i} style={{ flex: 1, height: `${h}%`, background: i >= 6 ? C.mul : C.line, borderRadius: "3px 3px 0 0" }} />)}
      </div>
      <div style={{ fontSize: 11.5, color: C.mid, marginTop: 10 }}>{ev.detail}</div>
    </Shell>
  );
}

/* ================= PROJECT CALENDAR (governance-year view, per project, real dates) ================= */
function ProjectCalendar({ projects }) {
  const [pid, setPid] = useState(projects[0]?.id || null);
  const [det, setDet] = useState(null);
  const proj = projects.find(p => p.id === pid);
  if (!proj) return <Card>Add a project first.</Card>;
  const plan = proj.plan || [], snaps = proj.snapshots || [];
  const D = s => new Date(s + "T00:00:00");
  const dates = [...plan.filter(m => m.due).map(m => D(m.due)), ...snaps.map(s => D(s.date)), new Date()];
  if (proj.hypothesis?.date) dates.push(new Date(D(proj.hypothesis.date).getTime() + 30 * 86400000));
  let lo = new Date(Math.min(...dates.map(d => d.getTime()))), hi = new Date(Math.max(...dates.map(d => d.getTime())));
  lo = new Date(lo.getFullYear(), lo.getMonth(), 1); hi = new Date(hi.getFullYear(), hi.getMonth() + 1, 1);
  const cols = [];
  for (let d = new Date(lo); d < hi && cols.length < 14; d.setMonth(d.getMonth() + 1)) cols.push(new Date(d));
  const ym = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
  const colKeys = cols.map(ym);
  const nowYm = ym(new Date());
  const T2 = proj.tier;
  const inMonth = (k, arr) => arr.filter(x => x.k === k);
  const gates = plan.filter(m => m.due && /^G\d/.test(m.name || "")).map(m => ({ k: m.due.slice(0, 7), label: (m.name || "").slice(0, 2), done: m.status === "done", item: `${m.name} — ${m.due} · ${m.conf ?? 80}%${m.status === "done" ? " · done ✓" : ""}` }));
  const miles = plan.filter(m => m.due && !/^G\d/.test(m.name || "")).map(m => ({ k: m.due.slice(0, 7), done: m.status === "done", item: `${m.name} — ${m.due} · ${m.conf ?? 80}%${m.dep ? " · has dependency" : ""}` }));
  const retro = [];
  if (proj.hypothesis?.date) {
    const rd = new Date(D(proj.hypothesis.date).getTime() + 30 * 86400000);
    retro.push({ k: ym(rd), late: !proj.hypothesis.retroDone && rd < new Date(), done: !!proj.hypothesis.retroDone, item: `Day-30 configuration retro — due ~${rd.toISOString().slice(0, 10)}${proj.hypothesis.retroDone ? " · done ✓ " + proj.hypothesis.retroDone : ""}` });
  }
  const snapDots = snaps.map(s => ({ k: s.date.slice(0, 7), item: `Health snapshot ${s.date} — ${s.score}/100` }));
  const cadence = {
    "Status report (T04)": T2 === "C" ? "weekly" : T2 === "D" ? "monthly" : "biweekly",
    "SteerCo / sponsor review": T2 === "D" ? "quarterly" : "monthly",
    "RAID review (T03)": "weekly",
    "Value review (T13)": T2 === "D" ? "quarterly" : "monthly",
  };
  const cadCell = (mode, d) => {
    if (mode === "quarterly" && d.getMonth() % 3 !== 0) return null;
    return mode === "weekly" ? "w" : mode === "biweekly" ? "2×" : "●";
  };
  const rows = [
    ["Gates (from plan)", C.gold, k => inMonth(k, gates).map(g => ({ txt: g.label, col: g.done ? C.green : "#8A6200", bg: g.done ? C.limeLt : C.goldLt, item: g.item }))],
    ["Milestones", C.navy, k => inMonth(k, miles).map(m => ({ txt: "◆", col: m.done ? C.green : C.navy, item: m.item }))],
    ["Day-30 retro (T14)", C.mul, k => inMonth(k, retro).map(r => ({ txt: r.done ? "✓" : "◆", col: r.done ? C.green : r.late ? C.red : C.mul, item: r.item }))],
    ["Health snapshots", C.lime, k => inMonth(k, snapDots).map(s => ({ txt: "●", col: C.lime, item: s.item }))],
  ];
  return (
    <div>
      <Card style={{ marginBottom: 14, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <select value={pid} onChange={e => { setPid(e.target.value); setDet(null); }} style={{ fontFamily: DISP, fontWeight: 700, fontSize: 14, border: `1px solid ${C.line}`, borderRadius: 8, padding: "8px 12px", background: "#fff", cursor: "pointer" }}>
          {projects.map(p => <option key={p.id} value={p.id}>{p.code} · {p.name}</option>)}
        </select>
        <div style={{ fontSize: 12, color: C.mid }}>The Governance Year, instantiated for one project with <b>real dates</b>: gates and milestones from the plan, the day-30 retro from the hypothesis, snapshots from the Health Scan, and the Tier {T2} cadences. Click any marked cell.</div>
      </Card>
      <Card style={{ padding: 0, overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 760 }}>
          <thead><tr>
            <th style={{ textAlign: "left", padding: "9px 14px", fontFamily: DISP, fontSize: 11, color: "#fff", background: C.graph }}>Rhythm / event</th>
            {cols.map((d, i) => <th key={i} style={{ padding: "9px 6px", fontFamily: MONO, fontSize: 9.5, color: colKeys[i] === nowYm ? C.gold : "#C9D2CF", background: C.graph, fontWeight: colKeys[i] === nowYm ? 700 : 500 }}>{MONTHS[d.getMonth()]} {String(d.getFullYear()).slice(2)}</th>)}
          </tr></thead>
          <tbody>
            {rows.map(([name, color, fn]) => (
              <tr key={name}>
                <td style={{ padding: "9px 14px", fontFamily: DISP, fontWeight: 600, fontSize: 12, borderTop: `1px solid ${C.soft}`, whiteSpace: "nowrap", color }}>{name}</td>
                {colKeys.map(k => {
                  const items = fn(k);
                  return (
                    <td key={k} onClick={() => items.length && setDet({ k, name, items: items.map(x => x.item) })} style={{ textAlign: "center", borderTop: `1px solid ${C.soft}`, background: k === nowYm ? "#FBF7EF" : "transparent", cursor: items.length ? "pointer" : "default", padding: "7px 2px" }}>
                      {items.map((x, i) => (
                        <span key={i} style={{ display: "inline-block", fontFamily: MONO, fontSize: 10.5, fontWeight: 700, color: x.col, background: x.bg || "transparent", borderRadius: 99, padding: x.bg ? "2px 7px" : 0, margin: "0 1px" }}>{x.txt}</span>
                      ))}
                    </td>
                  );
                })}
              </tr>
            ))}
            {Object.entries(cadence).map(([name, mode]) => (
              <tr key={name}>
                <td style={{ padding: "9px 14px", fontFamily: DISP, fontWeight: 600, fontSize: 12, borderTop: `1px solid ${C.soft}`, whiteSpace: "nowrap", color: C.mid }}>{name}</td>
                {cols.map((d, i) => (
                  <td key={i} onClick={() => setDet({ k: colKeys[i], name, items: [`${name}: ${mode} cadence (Tier ${T2}) — items land in This Week automatically`] })} style={{ textAlign: "center", borderTop: `1px solid ${C.soft}`, background: colKeys[i] === nowYm ? "#FBF7EF" : "transparent", fontFamily: MONO, fontSize: 9.5, color: C.faint, cursor: "pointer", padding: "7px 2px" }}>
                    {cadCell(mode, d)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      {det && (
        <Card style={{ marginTop: 12, borderLeft: `4px solid ${C.gold}` }}>
          <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
            <SectionLabel color={"#8A6200"}>{det.name} · {det.k}</SectionLabel>
            <button onClick={() => setDet(null)} style={{ marginLeft: "auto", border: "none", background: "transparent", color: C.faint, cursor: "pointer" }}>×</button>
          </div>
          {det.items.map((x, i) => <div key={i} style={{ fontSize: 13, marginBottom: 4 }}>{x}</div>)}
        </Card>
      )}
    </div>
  );
}

/* ================= PROGRAM MAP (cross-project dependencies) ================= */
const LINK_TYPES = { content: ["Content / scope", "#830051"], data: ["Data", "#003865"], stakeholder: ["Stakeholders", "#8A6200"], adoption: ["Adoption / users", "#8A9900"] };
function ProgramMap({ projects, programLinks, setProgramLinks, setSel, setTab }) {
  const [selEdge, setSelEdge] = useState(null);
  const norm = s => String(s || "").toLowerCase().trim();
  const auto = useMemo(() => {
    const edges = [];
    for (let i = 0; i < projects.length; i++) for (let j = i + 1; j < projects.length; j++) {
      const a = projects[i], b = projects[j];
      const shN = (a.stakeholders || []).map(s => norm(s.name)).filter(Boolean).filter(n => (b.stakeholders || []).some(s => norm(s.name) === n));
      if (shN.length) edges.push({ from: a.id, to: b.id, type: "stakeholder", note: "Shared stakeholders: " + shN.join(", "), auto: true });
      const shG = (a.impact || []).map(g => norm(g.group)).filter(Boolean).filter(n => (b.impact || []).some(g => norm(g.group) === n));
      if (shG.length) edges.push({ from: a.id, to: b.id, type: "adoption", note: "Same affected groups: " + shG.join(", "), auto: true });
      const shO = (a.keydata?.benefits || []).map(x => norm(x.owner)).filter(Boolean).filter(n => (b.keydata?.benefits || []).some(x => norm(x.owner) === n));
      if (shO.length) edges.push({ from: a.id, to: b.id, type: "data", note: "Shared benefit owners: " + shO.join(", "), auto: true });
    }
    return edges;
  }, [projects]);
  const all = [...auto, ...programLinks.filter(l => projects.some(p => p.id === l.from) && projects.some(p => p.id === l.to))];
  const W = 860, H = 420, cx = W / 2, cy = H / 2, R = Math.min(165, 60 + projects.length * 18);
  const pos = {}; projects.forEach((p, i) => { const a = (i / projects.length) * 2 * Math.PI - Math.PI / 2; pos[p.id] = [cx + R * Math.cos(a), cy + R * Math.sin(a)]; });
  const byId = id => projects.find(p => p.id === id);
  return (
    <div>
      <Card style={{ marginBottom: 12 }}>
        <SectionLabel>Program map — where projects touch</SectionLabel>
        <div style={{ fontSize: 12.5, color: C.mid }}>Connections are <b>auto-detected</b> from shared stakeholders, shared affected groups (adoption) and shared benefit owners — plus any program links you declare below. Two or more connected projects are a de-facto programme: govern the seam, not just the nodes.</div>
        <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
          {Object.entries(LINK_TYPES).map(([k, [l, col]]) => <Chip key={k} bg="#fff" color={col} style={{ borderColor: col }}>― {l}</Chip>)}
        </div>
      </Card>
      <Card style={{ overflowX: "auto" }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", minWidth: 640 }} role="img" aria-label="Program dependency map">
          {all.map((e, i) => {
            const [x1, y1] = pos[e.from] || [0, 0], [x2, y2] = pos[e.to] || [0, 0];
            const col = LINK_TYPES[e.type]?.[1] || C.faint;
            const mx = (x1 + x2) / 2 + (i % 2 ? 14 : -14), my = (y1 + y2) / 2 + (i % 3 ? 10 : -10);
            return (
              <g key={i} onClick={() => setSelEdge(e)} style={{ cursor: "pointer" }}>
                <path d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`} fill="none" stroke={col} strokeWidth={selEdge === e ? 3.5 : 2} strokeDasharray={e.auto ? "none" : "6 4"} opacity={0.8} />
                <circle cx={mx} cy={my} r={4.5} fill={col} />
              </g>
            );
          })}
          {projects.map(p => {
            const [x, y] = pos[p.id];
            const anyR = RAG_DIMS.some(d => p.rag?.[d] === "R");
            return (
              <g key={p.id} onClick={() => { setSel(p.id); setTab("data"); }} style={{ cursor: "pointer" }}>
                <circle cx={x} cy={y} r={27} fill={C.mul} stroke={anyR ? C.red : C.gold} strokeWidth={anyR ? 3 : 2} />
                <text x={x} y={y + 4} textAnchor="middle" fontSize="10" fontWeight="700" fill="#fff" fontFamily={MONO}>{p.code.replace("OBU-", "")}</text>
                <text x={x} y={y + 44} textAnchor="middle" fontSize="11" fontWeight="600" fill={C.ink} fontFamily={DISP}>{p.name.slice(0, 22)}</text>
                <text x={x} y={y + 57} textAnchor="middle" fontSize="8.5" fill={C.faint} fontFamily={MONO}>Tier {p.tier} · {p.phase}</text>
              </g>
            );
          })}
        </svg>
        {selEdge && (
          <div style={{ borderLeft: `4px solid ${LINK_TYPES[selEdge.type]?.[1] || C.faint}`, background: "#FBFAF8", borderRadius: "0 10px 10px 0", padding: "10px 14px", marginTop: 8 }}>
            <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 13 }}>{byId(selEdge.from)?.name} ↔ {byId(selEdge.to)?.name} <Chip bg="#fff" color={LINK_TYPES[selEdge.type]?.[1]}>{LINK_TYPES[selEdge.type]?.[0]}</Chip> {selEdge.auto && <Chip>auto-detected</Chip>}</div>
            <div style={{ fontSize: 12.5, color: C.mid, marginTop: 3 }}>{selEdge.note || "—"}</div>
          </div>
        )}
      </Card>
      <Card style={{ marginTop: 12 }}>
        <SectionLabel color={C.navy}>Declared program links</SectionLabel>
        {programLinks.map(l => (
          <div key={l.id} style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center", flexWrap: "wrap" }}>
            <select value={l.from} onChange={e => setProgramLinks(ls => ls.map(x => x.id === l.id ? { ...x, from: e.target.value } : x))} style={{ border: `1px solid ${C.soft}`, borderRadius: 7, padding: "6px", fontSize: 11.5 }}>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <span style={{ color: C.faint }}>↔</span>
            <select value={l.to} onChange={e => setProgramLinks(ls => ls.map(x => x.id === l.id ? { ...x, to: e.target.value } : x))} style={{ border: `1px solid ${C.soft}`, borderRadius: 7, padding: "6px", fontSize: 11.5 }}>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select value={l.type} onChange={e => setProgramLinks(ls => ls.map(x => x.id === l.id ? { ...x, type: e.target.value } : x))} style={{ border: `1px solid ${C.soft}`, borderRadius: 7, padding: "6px", fontSize: 11.5 }}>
              {Object.entries(LINK_TYPES).map(([k, [lab]]) => <option key={k} value={k}>{lab}</option>)}
            </select>
            <input value={l.note || ""} onChange={e => setProgramLinks(ls => ls.map(x => x.id === l.id ? { ...x, note: e.target.value } : x))} placeholder="why they're linked (e.g. shared data product, sequenced go-lives)" style={{ flex: 1, minWidth: 180, border: `1px solid ${C.soft}`, background: "#FBFAF8", borderRadius: 7, padding: "7px 9px", fontSize: 12 }} />
            <button onClick={() => setProgramLinks(ls => ls.filter(x => x.id !== l.id))} style={{ border: "none", background: "transparent", color: C.faint, cursor: "pointer" }}>×</button>
          </div>
        ))}
        <button onClick={() => projects.length >= 2 && setProgramLinks(ls => [...ls, { id: uid(), from: projects[0].id, to: projects[1].id, type: "content", note: "" }])}
          style={{ border: `1px dashed ${C.line}`, background: "#fff", color: C.navy, borderRadius: 8, padding: "8px 14px", fontSize: 12.5, cursor: "pointer", fontWeight: 600 }}>+ program link</button>
        <div style={{ fontSize: 11, color: C.faint, marginTop: 8 }}>Cross-project conflicts surface here before they surface in a SteerCo: a shared stakeholder pulled two ways, or two go-lives landing on the same user group, is a Portfolio Review decision — escalate the conflict, not the frustration.</div>
      </Card>
    </div>
  );
}

/* ================= DATA GUIDE (app vs corporate tool) ================= */
function DataGuide() {
  const [open, setOpen] = useState(false);
  const ROWS = [
    ["Work items / backlog", "Workspace › Board", "JIRA", "multi-team flow, >100 items, compliance workflows"],
    ["Plan & milestones", "Workspace › Plan (+ Gantt, dependencies)", "Smartsheet", "resource management, cross-portfolio roll-ups"],
    ["Risks (RAID)", "Project Data › Risks", "Smartsheet T03 sheet", "portfolio-wide RAID mining, audit at scale"],
    ["Decisions (T08)", "Project Data › Decisions", "Confluence Decision Log", "broad-organisation visibility & search"],
    ["Benefits (T13)", "Project Data › Benefits", "Smartsheet + Power BI", "automated telemetry feeds, exec dashboards"],
    ["Notes & memory", "Workspace › Pages", "Confluence", "many contributors, permissions, longevity"],
    ["Stakeholders / impact / case / closure", "Studio › T09 · T10 · T02 · T17 builders", "Miro + masters in the Template Pack", "live workshops, very large maps"],
  ];
  return (
    <Card style={{ marginBottom: 14, borderLeft: `4px solid ${C.navy}` }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: "flex", gap: 10, alignItems: "baseline", cursor: "pointer" }}>
        <SectionLabel color={C.navy}>Where does each piece of data live? — app vs corporate tool</SectionLabel>
        <span style={{ marginLeft: "auto", color: C.faint }}>{open ? "−" : "+"}</span>
      </div>
      {open && (
        <div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 640, fontSize: 12 }}>
              <thead><tr>{["Data", "In the Navigator (default)", "Corporate alternative", "Switch to the tool when…"].map(h => <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontFamily: DISP, fontSize: 10.5, color: "#fff", background: C.graph }}>{h}</th>)}</tr></thead>
              <tbody>{ROWS.map(r => (
                <tr key={r[0]}>{r.map((c, i) => <td key={i} style={{ padding: "8px 12px", borderTop: `1px solid ${C.soft}`, fontWeight: i === 0 ? 600 : 400, fontFamily: i === 1 ? MONO : BODY, fontSize: i === 1 ? 11 : 12, color: i === 1 ? C.navy : C.ink }}>{c}</td>)}</tr>
              ))}</tbody>
            </table>
          </div>
          <div style={{ fontSize: 12, color: C.mid, marginTop: 10 }}>
            <b style={{ color: C.ink }}>Rule of thumb:</b> under ~100 projects, enter once here and push out with the Studio exports — zero duplicated truth. The moment a corporate tool is declared the system of record for a data type, enter it <i>there</i> and treat the Navigator as the cockpit view (import for JIRA today; live connectors in the corporate deployment).
          </div>
        </div>
      )}
    </Card>
  );
}

/* ================= CAPACITY & BUDGET (people · load · forecast · triple-constraint risk) ================= */
const ymNow = () => new Date().toISOString().slice(0, 7);
const ymAdd = (ym, n) => { const d = new Date(ym + "-01T00:00:00"); d.setMonth(d.getMonth() + n); return d.toISOString().slice(0, 7); };
const ymDiff = (a, b) => (new Date(b + "-01") - new Date(a + "-01")) / (30.44 * 86400000);
const monthsBetween = (from, to) => { const out = []; let m = from; while (m <= to && out.length < 36) { out.push(m); m = ymAdd(m, 1); } return out; };
const eur = n => "\u20ac" + (Math.abs(n) >= 1e6 ? (n / 1e6).toFixed(2) + "M" : Math.round(n / 1000) + "k");
const PERT = (o, m, p2) => { const e = (o + 4 * m + p2) / 6, s = Math.max((p2 - o) / 6, 0); return { e, s, p80: e + 0.8416 * s }; };

function labourForecast(p, people, assignments) {
  let total = 0; const who = new Set();
  assignments.filter(a => a.projectId === p.id).forEach(a => {
    const per = people.find(x => x.id === a.personId); if (!per || !a.from || !a.to) return;
    const months = Math.max(Math.round(ymDiff(a.from, a.to)) + 1, 0);
    total += months * (a.pct / 100) * (per.costMonth || 0); who.add(per.id);
  });
  return { labour: total, headcount: who.size };
}
function budgetEval(p, people, assignments) {
  const b = p.budget; if (!b) return null;
  const { labour } = labourForecast(p, people, assignments);
  const lines = (b.lines || []).reduce((s, l) => s + (+l.amount || 0), 0);
  const forecast = labour + lines;
  const cBest = b.cBest ?? forecast * 0.92, cLikely = b.cLikely ?? forecast, cWorst = b.cWorst ?? forecast * 1.3;
  const pc = PERT(cBest, cLikely, cWorst);
  return { env: +b.envelope || 0, labour, lines, forecast, p50: pc.e, p80: pc.p80, cBest, cLikely, cWorst };
}
function seedHR(projects) {
  const byCode = c => projects.find(p => p.code === c)?.id;
  const P = (name, role, costMonth, cap = 100, team = "Delivery", type = "AZ Permanent", location = "Barcelona", extra = {}) => ({ id: uid(), name, role, costMonth, cap, team, type, location, status: extra.vacancy ? "Vacancy" : "Staffed", supervisor: extra.supervisor || "J. Arbona", cc: extra.cc || "1175", vacancy: !!extra.vacancy, ...extra });
  const people = [
    P("M. Serra", "Project Manager", 9800, 100, "Delivery"), P("A. Ribeiro", "Project Manager", 9800, 100, "Delivery"),
    P("T. Keller", "Product Owner", 10400, 100, "Product"), P("N. Osei", "Engineer", 8900, 100, "Engineering", "OSP"), P("C. Duarte", "Engineer", 8900, 100, "Engineering"),
    P("S. Lindqvist", "Data Steward", 9200, 80, "Data", "AZ Permanent", "Cambridge"), P("E. Romero", "Change Lead", 9500, 100, "Change"), P("K. Yamada", "BI Analyst", 8300, 60, "Data", "OSP", "Warsaw"),
    P("(open req) - Sr Engineer", "Engineer", 9100, 100, "Engineering", "OSP", "Warsaw", { vacancy: true }),
    P("(open req) - Change Analyst", "Change Analyst", 7800, 100, "Change", "AZ Permanent", "Barcelona", { vacancy: true }),
  ];
  const id = n => people[n].id, m0 = ymNow();
  const A = (n, code, pct, fromOff, toOff) => ({ id: uid(), personId: id(n), projectId: byCode(code), pct, from: ymAdd(m0, fromOff), to: ymAdd(m0, toOff) });
  const assignments = [
    A(0, "OBU-114", 60, -1, 4), A(2, "OBU-114", 50, -1, 4), A(3, "OBU-114", 100, 0, 3), A(4, "OBU-114", 80, 0, 3), A(5, "OBU-114", 40, -1, 2), A(6, "OBU-114", 50, 0, 4),
    A(1, "OBU-097", 80, -2, 2), A(6, "OBU-097", 60, -1, 2), A(7, "OBU-097", 60, -1, 1), A(4, "OBU-097", 30, 1, 2),
    A(0, "OBU-121", 20, 0, 2), A(7, "OBU-121", 40, 0, 2),
  ].filter(a => a.projectId);
  return { people, assignments };
}


/* ================= EXCEL EXPORT (CAI 2026 Portfolio & Capacity Plan style) ================= */
let _xlsxPromise = null;
const XLSX_URLS = [
  "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js",
  "https://cdn.sheetjs.com/xlsx-0.18.5/package/dist/xlsx.full.min.js",
  "https://unpkg.com/xlsx@0.18.5/dist/xlsx.full.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js",
];
function loadXLSX() {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  if (_xlsxPromise) return _xlsxPromise;
  _xlsxPromise = (async () => {
    let last;
    for (const u of XLSX_URLS) {
      try { return await new Promise((res, rej) => { const s = document.createElement("script"); s.src = u; const t = setTimeout(() => { s.remove(); rej(new Error("timeout")); }, 9000); s.onload = () => { clearTimeout(t); window.XLSX ? res(window.XLSX) : rej(new Error("no global")); }; s.onerror = () => { clearTimeout(t); s.remove(); rej(new Error("blocked")); }; document.head.appendChild(s); }); }
      catch (e) { last = e; }
    }
    _xlsxPromise = null; throw last || new Error("no CDN");
  })();
  return _xlsxPromise;
}
const MONTH_HDRS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function allocByMonth(personId, projectId, assignments) {
  // returns 12 fractional FTE values for the 2026 calendar from assignments
  const out = Array(12).fill(0);
  assignments.filter(a => a.personId === personId && (!projectId || a.projectId === projectId) && a.from && a.to).forEach(a => {
    for (let m = 0; m < 12; m++) { const ym = "2026-" + String(m + 1).padStart(2, "0"); if (a.from <= ym && ym <= a.to) out[m] += (+a.pct || 0) / 100; }
  });
  return out;
}
async function exportCapacityXlsx(projects, people, assignments) {
  const XLSX = await loadXLSX();
  const wb = XLSX.utils.book_new();
  const FOCUS = 0.8, HRS_MONTH = 152; // net hours assumption
  const projName = id => (projects.find(p => p.id === id) || {}).name || "Unassigned";
  const projById = id => projects.find(p => p.id === id) || {};
  const aoa = (rows) => XLSX.utils.aoa_to_sheet(rows);
  const setCols = (ws, widths) => { ws["!cols"] = widths.map(w => ({ wch: w })); };

  /* --- Sheet 1: Project Profiling --- */
  const p1 = [
    ["CAI 2026 — Portfolio & Capacity Plan · generated by DCOS Navigator " + today()],
    ["Project portfolio mapping (not a project resource plan)"],
    [],
    ["ID", "Project Name", "PM / PO", "Status", "Tier", "Priority (WSJF)", "Staffing Confidence", "Start", "End (G4)", "Team", "Headcount", "Labour forecast (€)", "Envelope (€)", "Description / Benefit"],
  ];
  projects.forEach(p => {
    const lf = labourForecast(p, people, assignments);
    const plan = (p.plan || []).filter(m => m.due).map(m => m.due).sort();
    const g4 = (p.plan || []).filter(m => /^G4/.test(m.name || "") && m.due).map(m => m.due)[0] || plan.slice(-1)[0] || "";
    const w = p.wsjf || {}; const wsjf = ((w.bv || 0) + (w.tc || 0) + (w.rr || 0)) / Math.max(w.size || 1, 1);
    const kd = p.keydata || {};
    const teams = [...new Set(assignments.filter(a => a.projectId === p.id).map(a => (people.find(x => x.id === a.personId) || {}).team).filter(Boolean))].join(", ");
    p1.push([p.code, p.name, p.pm || "—", p.phase, "Tier " + p.tier, +wsjf.toFixed(1), p.staffConf || "—", plan[0] || "", g4, teams, lf.headcount, Math.round(lf.labour), +p.budget?.envelope || "", (kd.headline || "").slice(0, 80)]);
  });
  const ws1 = aoa(p1); setCols(ws1, [10, 26, 16, 12, 8, 12, 16, 12, 12, 16, 11, 16, 14, 40]);
  XLSX.utils.book_append_sheet(wb, ws1, "Project Profiling");

  /* --- Sheet 2: CAI Resource Profile (monthly allocation + day rate -> cost) --- */
  const hdr2 = ["ID", "Project Name", "Resource Confidence", "Status", "Name", "Role", "Type", "Team", "Location", "Allocation", "Day Rate (€)", ...MONTH_HDRS, "Monthly Rate (€)", "2026 Cost (€)"];
  const p2 = [["Resource & Cost Profiling Based on Demand"], [], hdr2];
  assignments.forEach(a => {
    const per = people.find(x => x.id === a.personId); if (!per) return;
    const pr = projById(a.projectId);
    const months = allocByMonth(a.personId, a.projectId, assignments);
    const dayRate = Math.round((per.costMonth || 0) / 21);
    const monthly = Math.round((per.costMonth || 0) * (a.pct / 100));
    const cost = months.reduce((s, m) => s + m * (per.costMonth || 0), 0);
    p2.push([pr.code || "", pr.name || "Unassigned", "1 - Very High (81%-100%)", pr.phase || "", per.name, per.role, per.type || "AZ Permanent", per.team || "", per.location || "—", a.pct / 100, dayRate, ...months.map(m => +m.toFixed(2)), monthly, Math.round(cost)]);
  });
  // total row
  const firstData = 4, lastData = p2.length;
  const totRow = ["", "TOTAL", "", "", "", "", "", "", "", "", ""];
  for (let m = 0; m < 12; m++) totRow.push({ f: `SUM(${XLSX.utils.encode_col(11 + m)}${firstData}:${XLSX.utils.encode_col(11 + m)}${lastData})` });
  totRow.push("", { f: `SUM(${XLSX.utils.encode_col(11 + 13)}${firstData}:${XLSX.utils.encode_col(11 + 13)}${lastData})` });
  p2.push(totRow);
  const ws2 = aoa(p2); setCols(ws2, [9, 22, 18, 10, 16, 18, 14, 14, 12, 10, 11, ...MONTH_HDRS.map(() => 6), 13, 13]);
  XLSX.utils.book_append_sheet(wb, ws2, "CAI Resource Profile");

  /* --- Sheet 3: Team Structure (capacity planned vs assigned, focus factor, vacancies) --- */
  const hdr3 = ["Name", "Business Title", "Team", "LM / Supervisor", "CC", "Vacancy", "Status", "Employee Type", "Location", ...MONTH_HDRS.map(m => m + " plan"), "·", ...MONTH_HDRS.map(m => m + " assigned"), "Gross Hrs", "Net Hrs (×0.8)"];
  const p3 = [["Capacity Planned vs Assigned", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "Focus Factor", FOCUS], [], hdr3];
  people.forEach(per => {
    const planned = Array(12).fill(per.cap != null ? per.cap / 100 : 1);
    const assigned = allocByMonth(per.id, null, assignments);
    const grossH = HRS_MONTH * 12 * (per.cap != null ? per.cap / 100 : 1);
    p3.push([per.name, per.role, per.team || "", per.supervisor || "—", per.cc || "", per.vacancy ? "Yes" : "No", per.status || "Staffed", per.type || "AZ Permanent", per.location || "—", ...planned.map(x => +x.toFixed(2)), "", ...assigned.map(x => +x.toFixed(2)), Math.round(grossH), Math.round(grossH * FOCUS)]);
  });
  const ws3 = aoa(p3); setCols(ws3, [16, 18, 14, 16, 7, 8, 10, 14, 12, ...MONTH_HDRS.map(() => 5.5), 2, ...MONTH_HDRS.map(() => 6.5), 9, 11]);
  XLSX.utils.book_append_sheet(wb, ws3, "Team Structure");

  /* --- Sheet 4: Vacancies & availability --- */
  const p4 = [["Vacancies & Availability — where capacity is open"], [], ["Name / Req", "Role", "Team", "Status", "Type", "Avg 2026 allocation", "Avg free capacity", "Flag"]];
  people.forEach(per => {
    const assigned = allocByMonth(per.id, null, assignments);
    const avg = assigned.reduce((s, m) => s + m, 0) / 12;
    const cap = per.cap != null ? per.cap / 100 : 1;
    const free = cap - avg;
    const flag = per.vacancy ? "VACANCY — to hire" : free > 0.4 ? "Under-utilised" : free < -0.05 ? "OVERALLOCATED" : "Balanced";
    p4.push([per.name || "(open req)", per.role, per.team || "", per.status || (per.vacancy ? "Vacancy" : "Staffed"), per.type || "AZ Permanent", +avg.toFixed(2), +free.toFixed(2), flag]);
  });
  const ws4 = aoa(p4); setCols(ws4, [20, 18, 14, 12, 14, 18, 18, 18]);
  XLSX.utils.book_append_sheet(wb, ws4, "Vacancies");

  /* --- Sheet 5: ByProject pivot --- */
  const p5 = [["Pivot — FTE allocation ByProject"], [], ["Project Name", "Team", "Role", "Name", ...MONTH_HDRS.map(m => m + "26")]];
  let r5 = 4;
  const projGroups = {};
  assignments.forEach(a => { (projGroups[a.projectId] = projGroups[a.projectId] || []).push(a); });
  Object.entries(projGroups).forEach(([pid, list]) => {
    const startRow = r5;
    list.forEach(a => { const per = people.find(x => x.id === a.personId); if (!per) return; const months = allocByMonth(a.personId, pid, assignments); p5.push([projName(pid), per.team || "", per.role, per.name, ...months.map(m => +m.toFixed(2))]); r5++; });
    if (r5 > startRow) {
      const total = [projName(pid) + " Total", "", "", ""];
      for (let m = 0; m < 12; m++) { const col = XLSX.utils.encode_col(4 + m); total.push({ f: `SUM(${col}${startRow}:${col}${r5 - 1})` }); }
      p5.push(total); r5++;
    }
  });
  const gt5 = ["Grand Total", "", "", ""];
  for (let m = 0; m < 12; m++) { const col = XLSX.utils.encode_col(4 + m); gt5.push({ f: `SUMIF($A$4:$A$${r5 - 1},"*Total",${col}$4:${col}$${r5 - 1})/0+SUM(${col}4:${col}${r5 - 1})/2` }); }
  // simpler robust grand total: sum of detail rows only (skip the per-project total rows)
  const gt5b = ["Grand Total", "", "", ""];
  for (let m = 0; m < 12; m++) { const col = XLSX.utils.encode_col(4 + m); gt5b.push({ f: `SUMIFS(${col}4:${col}${r5 - 1},$A4:$A${r5 - 1},"<>*Total")` }); }
  p5.push(gt5b);
  const ws5 = aoa(p5); setCols(ws5, [26, 14, 18, 16, ...MONTH_HDRS.map(() => 6.5)]);
  XLSX.utils.book_append_sheet(wb, ws5, "ByProject");

  /* --- Sheet 6: ByPeople pivot --- */
  const p6 = [["Pivot — FTE allocation ByPeople"], [], ["Name", "Project Name", ...MONTH_HDRS.map(m => m + "26")]];
  let r6 = 4;
  const peopleGroups = {};
  assignments.forEach(a => { (peopleGroups[a.personId] = peopleGroups[a.personId] || []).push(a); });
  Object.entries(peopleGroups).forEach(([pid, list]) => {
    const per = people.find(x => x.id === pid); if (!per) return;
    const startRow = r6;
    list.forEach(a => { const months = allocByMonth(pid, a.projectId, assignments); p6.push([per.name, projName(a.projectId), ...months.map(m => +m.toFixed(2))]); r6++; });
    if (r6 > startRow) { const total = [per.name + " Total", ""]; for (let m = 0; m < 12; m++) { const col = XLSX.utils.encode_col(2 + m); total.push({ f: `SUM(${col}${startRow}:${col}${r6 - 1})` }); } p6.push(total); r6++; }
  });
  const gt6 = ["Grand Total", ""];
  for (let m = 0; m < 12; m++) { const col = XLSX.utils.encode_col(2 + m); gt6.push({ f: `SUMIFS(${col}4:${col}${r6 - 1},$A4:$A${r6 - 1},"<>*Total")` }); }
  p6.push(gt6);
  const ws6 = aoa(p6); setCols(ws6, [16, 26, ...MONTH_HDRS.map(() => 6.5)]);
  XLSX.utils.book_append_sheet(wb, ws6, "ByPeople");

  /* --- Sheet 7: Dashboard (text KPIs + instructions to insert native charts) --- */
  const totLabour = projects.reduce((s, p) => s + labourForecast(p, people, assignments).labour, 0);
  const totEnv = projects.reduce((s, p) => s + (+p.budget?.envelope || 0), 0);
  const vac = people.filter(p => p.vacancy).length;
  const over = people.filter(p => { const a = allocByMonth(p.id, null, assignments); const avg = a.reduce((s, m) => s + m, 0) / 12; return avg > (p.cap != null ? p.cap / 100 : 1) + 0.01; }).length;
  const p7 = [
    ["Capacity & Budget — Dashboard"], [],
    ["KPI", "Value"],
    ["Projects", projects.length],
    ["People", people.length],
    ["Vacancies to fill", vac],
    ["Overallocated people", over],
    ["Total labour forecast (€)", Math.round(totLabour)],
    ["Total envelopes (€)", Math.round(totEnv)],
    ["Headcount allocated", new Set(assignments.map(a => a.personId)).size],
    [],
    ["FTE by team (avg 2026)", ""],
  ];
  const teamAgg = {};
  people.forEach(per => { const a = allocByMonth(per.id, null, assignments); const avg = a.reduce((s, m) => s + m, 0) / 12; teamAgg[per.team || "Unassigned"] = (teamAgg[per.team || "Unassigned"] || 0) + avg; });
  const teamStart = p7.length + 1;
  Object.entries(teamAgg).forEach(([t, v]) => p7.push([t, +v.toFixed(2)]));
  const teamEnd = p7.length;
  p7.push([], ["To visualise: select the 'FTE by team' range above → Insert → Chart (bar). The ByProject/ByPeople sheets are ready to drop into a PivotTable (Insert → PivotTable)."]);
  const ws7 = aoa(p7); setCols(ws7, [30, 16]);
  XLSX.utils.book_append_sheet(wb, ws7, "Dashboard");
  // move Dashboard to first position
  wb.SheetNames = ["Dashboard", "Project Profiling", "CAI Resource Profile", "Team Structure", "Vacancies", "ByProject", "ByPeople"];

  XLSX.writeFile(wb, `CAI_2026_Capacity_Plan_${today()}.xlsx`);
}

function CapacityHub({ projects, update, people, setPeople, assignments, setAssignments }) {
  const [sub, setSub] = useState("load");
  const [xls, setXls] = useState(null);
  const SUBS = [["load", "Load heatmap"], ["people", `People (${people.length})`], ["budget", "Budget & risk"]];
  const doExport = async () => {
    setXls("working");
    try { await exportCapacityXlsx(projects, people, assignments); setXls("done"); setTimeout(() => setXls(null), 2500); }
    catch (e) { console.error(e); setXls("err"); setTimeout(() => setXls(null), 6000); }
  };
  return (
    <div>
      <Card style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ fontFamily: DISP, fontWeight: 800, fontSize: 18 }}>Capacity & Budget — the resourcing spine</div>
            <div style={{ fontSize: 12.5, color: C.mid }}>Sized for &lt;100 projects and &lt;1000 people: a people registry with monthly cost, assignments that drive a portfolio load heatmap, an automatic labour forecast per project, and a triple-constraint risk read (cost · time · scope) using PERT P50/P80.</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <button onClick={doExport} disabled={xls === "working"} style={{ background: "#1D6F42", color: "#fff", border: "none", borderRadius: 9, padding: "10px 16px", fontFamily: DISP, fontWeight: 700, fontSize: 13, cursor: xls === "working" ? "default" : "pointer", whiteSpace: "nowrap" }}>
              {xls === "working" ? "Building…" : xls === "done" ? "Downloaded ✓" : xls === "err" ? "Engine blocked — retry" : "⬇ Export to Excel"}
            </button>
            <div style={{ fontSize: 10.5, color: C.faint, marginTop: 5, maxWidth: 210 }}>CAI-style workbook: portfolio, resource profile, team structure, vacancies + ByProject / ByPeople pivots & charts.</div>
          </div>
        </div>
      </Card>
      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {SUBS.map(([id, l]) => (
          <button key={id} onClick={() => setSub(id)} style={{ border: `1px solid ${sub === id ? C.mul : C.line}`, background: sub === id ? C.mul : "#fff", color: sub === id ? "#fff" : C.mid, borderRadius: 99, padding: "8px 15px", fontFamily: DISP, fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>{l}</button>
        ))}
      </div>
      {sub === "people" && <PeopleReg people={people} setPeople={setPeople} assignments={assignments} />}
      {sub === "load" && <LoadHeatmap projects={projects} people={people} assignments={assignments} setAssignments={setAssignments} />}
      {sub === "budget" && <BudgetRisk projects={projects} update={update} people={people} assignments={assignments} />}
    </div>
  );
}

function PeopleReg({ people, setPeople, assignments }) {
  const totalCost = people.reduce((s, p) => s + (p.costMonth || 0) * ((p.cap ?? 100) / 100), 0);
  return (
    <div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
        <Card style={{ flex: "1 1 140px", padding: "12px 16px" }}><div style={{ fontFamily: MONO, fontSize: 10, textTransform: "uppercase", color: C.faint }}>People</div><div style={{ fontFamily: DISP, fontWeight: 800, fontSize: 26 }}>{people.length}</div></Card>
        <Card style={{ flex: "1 1 180px", padding: "12px 16px" }}><div style={{ fontFamily: MONO, fontSize: 10, textTransform: "uppercase", color: C.faint }}>Available capacity cost / month</div><div style={{ fontFamily: DISP, fontWeight: 800, fontSize: 26, color: C.mul }}>{eur(totalCost)}</div></Card>
        <Card style={{ flex: "2 1 260px", padding: "12px 16px", fontSize: 12, color: C.mid }}>Cost is the loaded monthly rate (salary + overheads). Capacity &lt;100% models part-time or shared roles. People with assignments can't be deleted.</Card>
      </div>
      <Card>
        {people.map(p => {
          const used = assignments.some(a => a.personId === p.id);
          return (
            <div key={p.id} style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center", flexWrap: "wrap" }}>
              <Inp v={p.name} on={v => setPeople(ps => ps.map(x => x.id === p.id ? { ...x, name: v } : x))} ph="Name" w={170} />
              <Inp v={p.role} on={v => setPeople(ps => ps.map(x => x.id === p.id ? { ...x, role: v } : x))} ph="Role" w={150} />
              <label style={{ fontSize: 11, color: C.faint }}>\u20ac/month <input type="number" value={p.costMonth || 0} onChange={e => setPeople(ps => ps.map(x => x.id === p.id ? { ...x, costMonth: +e.target.value } : x))} style={{ width: 86, border: `1px solid ${C.soft}`, background: "#FBFAF8", borderRadius: 7, padding: "6px 8px", fontSize: 12, fontFamily: MONO }} /></label>
              <label style={{ fontSize: 11, color: C.faint }}>cap % <input type="number" value={p.cap ?? 100} onChange={e => setPeople(ps => ps.map(x => x.id === p.id ? { ...x, cap: +e.target.value } : x))} style={{ width: 60, border: `1px solid ${C.soft}`, background: "#FBFAF8", borderRadius: 7, padding: "6px 8px", fontSize: 12, fontFamily: MONO }} /></label>
              <button onClick={() => !used && setPeople(ps => ps.filter(x => x.id !== p.id))} title={used ? "Has assignments" : "Remove"} style={{ border: "none", background: "transparent", color: used ? C.soft : C.faint, cursor: used ? "default" : "pointer" }}>×</button>
            </div>
          );
        })}
        <button onClick={() => setPeople(ps => [...ps, { id: uid(), name: "", role: "", costMonth: 9000, cap: 100 }])} style={{ border: `1px dashed ${C.line}`, background: "#fff", color: C.mul, borderRadius: 8, padding: "8px 14px", fontSize: 12.5, cursor: "pointer", fontWeight: 600 }}>+ person</button>
      </Card>
    </div>
  );
}

function LoadHeatmap({ projects, people, assignments, setAssignments }) {
  const m0 = ymNow();
  const cols = Array.from({ length: 9 }, (_, i) => ymAdd(m0, i - 1));
  const loadOf = (pid, ym) => assignments.filter(a => a.personId === pid && a.from && a.to && a.from <= ym && ym <= a.to).reduce((s, a) => s + (+a.pct || 0), 0);
  const cell = (load, cap) => {
    if (!load) return ["", "transparent", C.faint];
    const r = load / (cap || 100);
    return [load + "%", r > 1 ? "#F8E9E8" : r > 0.85 ? C.goldLt : C.limeLt, r > 1 ? C.red : r > 0.85 ? "#8A6200" : C.lime];
  };
  return (
    <div>
      <Card style={{ padding: 0, overflowX: "auto", marginBottom: 14 }}>
        <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 760 }}>
          <thead><tr>
            <th style={{ textAlign: "left", padding: "9px 14px", fontFamily: DISP, fontSize: 11, color: "#fff", background: C.graph }}>Person · capacity</th>
            {cols.map(c2 => <th key={c2} style={{ padding: "9px 6px", fontFamily: MONO, fontSize: 9.5, color: c2 === m0 ? C.gold : "#C9D2CF", background: C.graph, fontWeight: c2 === m0 ? 700 : 500 }}>{MONTHS[+c2.slice(5) - 1]} {c2.slice(2, 4)}</th>)}
          </tr></thead>
          <tbody>
            {people.map(per => (
              <tr key={per.id}>
                <td style={{ padding: "8px 14px", borderTop: `1px solid ${C.soft}`, whiteSpace: "nowrap" }}>
                  <span style={{ fontFamily: DISP, fontWeight: 600, fontSize: 12.5 }}>{per.name || "—"}</span>
                  <span style={{ fontFamily: MONO, fontSize: 9.5, color: C.faint }}> · {per.role} · {per.cap ?? 100}%</span>
                </td>
                {cols.map(c2 => {
                  const [txt, bg, fg] = cell(loadOf(per.id, c2), per.cap ?? 100);
                  return <td key={c2} style={{ textAlign: "center", borderTop: `1px solid ${C.soft}`, background: c2 === m0 ? "#FBF7EF" : "transparent", padding: "6px 2px" }}>
                    {txt && <span style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 700, color: fg, background: bg, borderRadius: 99, padding: "2px 7px" }}>{txt}</span>}
                  </td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card>
        <SectionLabel color={C.navy}>Assignments — who, where, how much, when</SectionLabel>
        {assignments.map(a => (
          <div key={a.id} style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center", flexWrap: "wrap" }}>
            <select value={a.personId} onChange={e => setAssignments(as => as.map(x => x.id === a.id ? { ...x, personId: e.target.value } : x))} style={{ border: `1px solid ${C.soft}`, borderRadius: 7, padding: "6px", fontSize: 11.5, maxWidth: 150 }}>
              {people.map(p => <option key={p.id} value={p.id}>{p.name || "—"}</option>)}
            </select>
            <span style={{ color: C.faint, fontSize: 11 }}>on</span>
            <select value={a.projectId} onChange={e => setAssignments(as => as.map(x => x.id === a.id ? { ...x, projectId: e.target.value } : x))} style={{ border: `1px solid ${C.soft}`, borderRadius: 7, padding: "6px", fontSize: 11.5, maxWidth: 180 }}>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <label style={{ fontSize: 11, color: C.faint }}>% <input type="number" value={a.pct} min={5} max={100} step={5} onChange={e => setAssignments(as => as.map(x => x.id === a.id ? { ...x, pct: +e.target.value } : x))} style={{ width: 58, border: `1px solid ${C.soft}`, background: "#FBFAF8", borderRadius: 7, padding: "6px 8px", fontSize: 12, fontFamily: MONO }} /></label>
            <input type="month" value={a.from || ""} onChange={e => setAssignments(as => as.map(x => x.id === a.id ? { ...x, from: e.target.value } : x))} style={{ border: `1px solid ${C.soft}`, background: "#FBFAF8", borderRadius: 7, padding: "5px 7px", fontSize: 11.5 }} />
            <span style={{ color: C.faint }}>→</span>
            <input type="month" value={a.to || ""} onChange={e => setAssignments(as => as.map(x => x.id === a.id ? { ...x, to: e.target.value } : x))} style={{ border: `1px solid ${C.soft}`, background: "#FBFAF8", borderRadius: 7, padding: "5px 7px", fontSize: 11.5 }} />
            <button onClick={() => setAssignments(as => as.filter(x => x.id !== a.id))} style={{ border: "none", background: "transparent", color: C.faint, cursor: "pointer" }}>×</button>
          </div>
        ))}
        <button onClick={() => people.length && projects.length && setAssignments(as => [...as, { id: uid(), personId: people[0].id, projectId: projects[0].id, pct: 50, from: ymNow(), to: ymAdd(ymNow(), 3) }])}
          style={{ border: `1px dashed ${C.line}`, background: "#fff", color: C.navy, borderRadius: 8, padding: "8px 14px", fontSize: 12.5, cursor: "pointer", fontWeight: 600 }}>+ assignment</button>
        <div style={{ fontSize: 11, color: C.faint, marginTop: 8 }}>Red cells = overallocation vs that person's capacity — a Portfolio Review conversation, not a heroics plan. Assignments drive the labour forecast in Budget & risk automatically.</div>
      </Card>
    </div>
  );
}

function BudgetRisk({ projects, update, people, assignments }) {
  const evals = projects.map(p => ({ p, be: budgetEval(p, people, assignments), lab: labourForecast(p, people, assignments) }));
  const withB = evals.filter(x => x.be);
  const tot = withB.reduce((s, x) => ({ env: s.env + x.be.env, p50: s.p50 + x.be.p50, p80: s.p80 + x.be.p80 }), { env: 0, p50: 0, p80: 0 });
  const over = withB.filter(x => x.be.env > 0 && x.be.p80 > x.be.env).length;
  const numIn = (v, on, w = 96) => <input type="number" value={Math.round(v)} onChange={e => on(+e.target.value)} style={{ width: w, border: `1px solid ${C.soft}`, background: "#FBFAF8", borderRadius: 7, padding: "6px 8px", fontSize: 12, fontFamily: MONO }} />;
  return (
    <div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
        {[["Envelopes (total)", eur(tot.env), C.ink], ["Forecast P50", eur(tot.p50), tot.p50 > tot.env ? C.red : C.navy], ["Forecast P80", eur(tot.p80), tot.p80 > tot.env ? C.red : "#8A6200"], ["Projects with P80 > envelope", over, over ? C.red : C.lime]].map(([l, v, col]) => (
          <Card key={l} style={{ flex: "1 1 150px", padding: "12px 16px" }}>
            <div style={{ fontFamily: MONO, fontSize: 10, textTransform: "uppercase", color: C.faint }}>{l}</div>
            <div style={{ fontFamily: DISP, fontWeight: 800, fontSize: 24, color: col }}>{v}</div>
          </Card>
        ))}
      </div>
      {evals.map(({ p, be, lab }) => {
        const b = p.budget || {};
        const setB = patch => update(p.id, { budget: { lines: [], ...b, ...patch } });
        const g4 = (p.plan || []).filter(m => m.due && /^G4/.test(m.name || "")).map(m => m.due)[0] || (p.plan || []).filter(m => m.due).map(m => m.due).sort().slice(-1)[0];
        const pt = PERT(b.tBest ?? 0, b.tLikely ?? 2, b.tWorst ?? 6);
        const shift = d => d ? new Date(new Date(d + "T00:00:00").getTime() + 0 * 1).toISOString().slice(0, 10) : null;
        const dShift = (d, w) => d ? new Date(new Date(d + "T00:00:00").getTime() + w * 7 * 86400000).toISOString().slice(0, 10) : "—";
        const costChip = !be || !be.env ? ["set envelope", C.soft, C.faint] : be.p80 <= be.env ? ["COST GREEN — P80 inside envelope", C.limeLt, C.lime] : be.p50 <= be.env ? ["COST AMBER — P80 " + eur(be.p80 - be.env) + " over", C.goldLt, "#8A6200"] : ["COST RED — P50 already over by " + eur(be.p50 - be.env), "#F8E9E8", C.red];
        const timeChip = pt.p80 <= 2 ? ["TIME GREEN — P80 slip \u2264 2w", C.limeLt, C.lime] : pt.p80 <= 6 ? ["TIME AMBER — P80 slip " + pt.p80.toFixed(1) + "w", C.goldLt, "#8A6200"] : ["TIME RED — P80 slip " + pt.p80.toFixed(1) + "w", "#F8E9E8", C.red];
        const openDec = (p.keydata?.decisions || []).filter(d => d.status !== "taken").length;
        const sc = p.rag?.Scope || "G";
        const scopeChip = sc === "G" && openDec <= 1 ? ["SCOPE GREEN — stable", C.limeLt, C.lime] : sc === "R" ? ["SCOPE RED — RAG red", "#F8E9E8", C.red] : ["SCOPE AMBER — " + (sc !== "G" ? "RAG " + sc : openDec + " open decisions"), C.goldLt, "#8A6200"];
        return (
          <Card key={p.id} style={{ marginBottom: 14, borderTop: `3px solid ${C.mul}` }}>
            <div style={{ display: "flex", gap: 10, alignItems: "baseline", flexWrap: "wrap", marginBottom: 8 }}>
              <span style={{ fontFamily: MONO, fontSize: 10.5, color: C.mul }}>{p.code}</span>
              <span style={{ fontFamily: DISP, fontWeight: 800, fontSize: 16 }}>{p.name}</span>
              <Chip bg={C.mulLt} color={C.mul}>Tier {p.tier} · {p.phase}</Chip>
              <span style={{ marginLeft: "auto", display: "flex", gap: 6, flexWrap: "wrap" }}>
                {[costChip, timeChip, scopeChip].map(([t2, bg, fg], i) => <Chip key={i} bg={bg} color={fg} style={{ fontSize: 9.5 }}>{t2}</Chip>)}
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 14 }}>
              <div>
                <SectionLabel>Cost — forecast vs envelope</SectionLabel>
                <div style={{ fontSize: 12, marginBottom: 6 }}>
                  Labour (auto, {lab.headcount} people): <b style={{ fontFamily: MONO }}>{eur(lab.labour)}</b> · Lines: <b style={{ fontFamily: MONO }}>{eur((b.lines || []).reduce((s, l) => s + (+l.amount || 0), 0))}</b> → Forecast <b style={{ fontFamily: MONO, color: C.navy }}>{be ? eur(be.forecast) : "—"}</b>
                </div>
                {(b.lines || []).map(l => (
                  <div key={l.id} style={{ display: "flex", gap: 6, marginBottom: 5, alignItems: "center" }}>
                    <Inp v={l.label} on={v => setB({ lines: b.lines.map(x => x.id === l.id ? { ...x, label: v } : x) })} ph="Cost line (vendor, licences…)" />
                    {numIn(+l.amount || 0, v => setB({ lines: b.lines.map(x => x.id === l.id ? { ...x, amount: v } : x) }), 90)}
                    <button onClick={() => setB({ lines: b.lines.filter(x => x.id !== l.id) })} style={{ border: "none", background: "transparent", color: C.faint, cursor: "pointer" }}>×</button>
                  </div>
                ))}
                <button onClick={() => setB({ lines: [...(b.lines || []), { id: uid(), label: "", amount: 0 }] })} style={{ border: `1px dashed ${C.line}`, background: "#fff", color: C.mul, borderRadius: 7, padding: "5px 11px", fontSize: 11.5, cursor: "pointer", fontWeight: 600 }}>+ line</button>
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 8, flexWrap: "wrap", fontSize: 11.5, color: C.mid }}>
                  Envelope \u20ac {numIn(+b.envelope || 0, v => setB({ envelope: v }))}
                  {be && be.env > 0 && (
                    <div style={{ flex: "1 1 160px", minWidth: 150 }}>
                      <div style={{ height: 10, background: C.soft, borderRadius: 99, position: "relative", overflow: "hidden" }}>
                        <div style={{ width: Math.min((be.p50 / be.env) * 100, 100) + "%", height: "100%", background: be.p50 > be.env ? C.red : C.navy }} />
                        <div style={{ position: "absolute", left: Math.min((be.p80 / be.env) * 100, 99) + "%", top: 0, bottom: 0, width: 2, background: "#8A6200" }} />
                      </div>
                      <div style={{ fontFamily: MONO, fontSize: 9.5 }}>P50 {eur(be.p50)} · <span style={{ color: "#8A6200" }}>P80 {eur(be.p80)}</span> vs {eur(be.env)}</div>
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 10.5, color: C.faint, marginTop: 6 }}>PERT cost range (best / likely / worst): {be && <>{numIn(be.cBest, v => setB({ cBest: v }), 84)} {numIn(be.cLikely, v => setB({ cLikely: v }), 84)} {numIn(be.cWorst, v => setB({ cWorst: v }), 84)}</>} <span>defaults: 0.92× / 1× / 1.3× forecast</span></div>
              </div>
              <div>
                <SectionLabel color={C.navy}>Time — slip vs {g4 ? "G4 " + g4 : "last milestone"}</SectionLabel>
                <div style={{ fontSize: 11.5, color: C.mid, marginBottom: 6 }}>Schedule slip in weeks (best / likely / worst):</div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  {numIn(b.tBest ?? 0, v => setB({ tBest: v }), 64)} {numIn(b.tLikely ?? 2, v => setB({ tLikely: v }), 64)} {numIn(b.tWorst ?? 6, v => setB({ tWorst: v }), 64)}
                </div>
                <div style={{ fontSize: 12, marginTop: 8 }}>
                  P50 finish: <b style={{ fontFamily: MONO }}>{dShift(g4, pt.e)}</b><br />
                  P80 finish: <b style={{ fontFamily: MONO, color: pt.p80 > 6 ? C.red : "#8A6200" }}>{dShift(g4, pt.p80)}</b>
                </div>
                <div style={{ fontSize: 10.5, color: C.faint, marginTop: 6 }}>Anchor the worst case in evidence: the Gantt's dep conflicts and any milestone under 60% confidence belong here.</div>
                <SectionLabel color={"#8A6200"}>Scope — derived</SectionLabel>
                <div style={{ fontSize: 11.5, color: C.mid }}>From your Scope RAG ({sc}) and {openDec} open decision(s). Scope risk isn't an input — it's the consequence of unfunded asks; route them through T15 + WSJF.</div>
              </div>
            </div>
          </Card>
        );
      })}
      <div style={{ fontSize: 11, color: C.faint }}>Doctrine: P80 is what you communicate upward ("80% confident by…"); P50 is what you manage to. An envelope breached at P80 but not P50 is an honest amber — say it before it says itself.</div>
    </div>
  );
}

/* ================= T11 COMMS PLANNER ================= */
function CommsBuilder({ projects, project, setSel, update }) {
  if (!project) return <Card>Add a project first.</Card>;
  const cm = project.comms || [];
  const set = v => update(project.id, { comms: v });
  const setR = (id, patch) => set(cm.map(r => r.id === id ? { ...r, ...patch } : r));
  return (
    <div>
      <BuilderHead projects={projects} project={project} setSel={setSel} title="T11 · Communications & engagement plan" blurb="Audience × message × channel × sender × date. Sequenced aware → trained → live; gaps from T10 become rows here." />
      <button onClick={() => set([...cm, { id: uid(), audience: "", message: "", channel: "", sender: "", date: "", status: "planned" }])}
        style={{ border: `1px dashed ${C.line}`, background: "#fff", color: C.mul, borderRadius: 9, padding: "9px 16px", fontSize: 13, cursor: "pointer", fontWeight: 700, fontFamily: DISP, marginBottom: 14 }}>+ comms row</button>
      {cm.length === 0 && <Card style={{ color: C.mid, fontSize: 13 }}>Doctrine: <b>senders are leaders</b> — the project drafts, credible voices deliver. One message per audience per moment; if everyone is the audience, no one is.</Card>}
      {cm.map(r => (
        <Card key={r.id} style={{ marginBottom: 10, padding: 12 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <Inp v={r.audience} on={v => setR(r.id, { audience: v })} ph="Audience (specific group)" w={200} />
            <Inp v={r.message} on={v => setR(r.id, { message: v })} ph="Key message — what changes for them, in their words" />
            <button onClick={() => set(cm.filter(x => x.id !== r.id))} style={{ border: "none", background: "transparent", color: C.faint, cursor: "pointer" }}>×</button>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginTop: 6 }}>
            <Inp v={r.channel} on={v => setR(r.id, { channel: v })} ph="Channel (town-hall, cascade, 1:1…)" w={210} />
            <Inp v={r.sender} on={v => setR(r.id, { sender: v })} ph="Sender — a leader, not the project" w={190} />
            <input type="date" value={r.date || ""} onChange={e => setR(r.id, { date: e.target.value })} style={{ border: `1px solid ${C.soft}`, background: "#FBFAF8", borderRadius: 7, padding: "6px 8px", fontSize: 11.5 }} />
            <select value={r.status || "planned"} onChange={e => setR(r.id, { status: e.target.value })} style={{ border: `1px solid ${C.soft}`, borderRadius: 7, padding: "6px", fontSize: 11.5 }}>
              <option>planned</option><option>sent</option>
            </select>
            {r.sender && /pm|project/i.test(r.sender) && <Chip bg={C.goldLt} color="#8A6200">sender should be a leader</Chip>}
          </div>
        </Card>
      ))}
      {cm.length > 0 && <div style={{ fontSize: 11, color: C.faint }}>Generate the T11 slide from Documents & exports; rows also travel in the Confluence export.</div>}
    </div>
  );
}

/* ================= T14 RETRO CANVAS ================= */
function RetrosBuilder({ projects, project, setSel, update }) {
  if (!project) return <Card>Add a project first.</Card>;
  const rt = [...(project.retros || [])].sort((a, b) => (a.date || "") < (b.date || "") ? -1 : 1);
  const set = v => update(project.id, { retros: v });
  const setR = (id, patch) => set((project.retros || []).map(r => r.id === id ? { ...r, ...patch } : r));
  const last = rt[rt.length - 1];
  const pendingExp = last && last.experiment && !last.expReviewed;
  return (
    <div>
      <BuilderHead projects={projects} project={project} setSel={setSel} title="T14 · Retro canvas — keep / change / stop + ONE experiment" blurb="Temperature first, one experiment per retro, and the previous experiment is reviewed before a new one starts." />
      <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
        <button onClick={() => set([...(project.retros || []), { id: uid(), date: today(), temp: 3, keep: "", change: "", stop: "", experiment: "", expReviewed: false }])}
          style={{ border: `1px dashed ${C.line}`, background: "#fff", color: C.mul, borderRadius: 9, padding: "9px 16px", fontSize: 13, cursor: "pointer", fontWeight: 700, fontFamily: DISP }}>+ new retro</button>
        {pendingExp && <Chip bg={C.goldLt} color="#8A6200">previous experiment not reviewed yet — open it first</Chip>}
        {rt.length > 1 && (
          <span style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 30 }} title="Temperature trend">
            {rt.slice(-8).map((r, i) => <span key={i} style={{ width: 9, height: 4 + (r.temp || 3) * 5, background: (r.temp || 3) >= 4 ? C.lime : (r.temp || 3) >= 3 ? C.gold : C.red, borderRadius: 2 }} />)}
            <span style={{ fontFamily: MONO, fontSize: 9.5, color: C.faint, marginLeft: 4 }}>temp 1–5</span>
          </span>
        )}
      </div>
      {rt.length === 0 && <Card style={{ color: C.mid, fontSize: 13 }}>The day-30 configuration retro lives in the Review Pack radar; this canvas is for the regular cadence retro (per sprint or month). Anti-pattern it kills: ten actions, zero owners, same list next retro.</Card>}
      {rt.map(r => (
        <Card key={r.id} style={{ marginBottom: 12, borderLeft: `4px solid ${(r.temp || 3) >= 4 ? C.lime : (r.temp || 3) >= 3 ? C.gold : C.red}` }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 8 }}>
            <input type="date" value={r.date || ""} onChange={e => setR(r.id, { date: e.target.value })} style={{ border: `1px solid ${C.soft}`, background: "#FBFAF8", borderRadius: 7, padding: "6px 8px", fontSize: 11.5 }} />
            <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 11.5, color: C.mid }}>
              Temperature <input type="range" min={1} max={5} value={r.temp || 3} onChange={e => setR(r.id, { temp: +e.target.value })} style={{ width: 110 }} />
              <b style={{ fontFamily: MONO }}>{r.temp || 3}/5</b>
            </label>
            <button onClick={() => set((project.retros || []).filter(x => x.id !== r.id))} style={{ marginLeft: "auto", border: "none", background: "transparent", color: C.faint, cursor: "pointer" }}>×</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 8 }}>
            <TArea v={r.keep} on={v => setR(r.id, { keep: v })} ph="KEEP — working, protect it" rows={2} />
            <TArea v={r.change} on={v => setR(r.id, { change: v })} ph="CHANGE — friction + the mechanism to fix it" rows={2} />
            <TArea v={r.stop} on={v => setR(r.id, { stop: v })} ph="STOP — costs effort, returns nothing" rows={2} />
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8, flexWrap: "wrap" }}>
            <Inp v={r.experiment} on={v => setR(r.id, { experiment: v })} ph="THE experiment (one only) — owner + review date implied next retro" />
            <label style={{ fontSize: 11.5, color: C.mid, display: "flex", gap: 5, alignItems: "center", whiteSpace: "nowrap" }}>
              <input type="checkbox" checked={!!r.expReviewed} onChange={e => setR(r.id, { expReviewed: e.target.checked })} /> reviewed
            </label>
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ================= T11 PPTX ================= */
function buildT11(pptx, p) {
  const cm = p.comms || [];
  const s = pptx.addSlide();
  azFrame(pptx, s, "T11 · Communications & engagement plan", "Comms", "plan", p);
  const hdr = ["Audience", "Key message", "Channel", "Sender", "Date", "Status"].map(t => ({ text: t, options: { fill: { color: AZ.graph }, color: "FFFFFF", bold: true, fontFace: "Arial", fontSize: 9 } }));
  const rows = [hdr];
  (cm.length ? cm : [{ audience: "— add rows in Studio › T11 —" }]).slice(0, 8).forEach(r => {
    rows.push([
      { text: r.audience || "", options: { fontFace: "Calibri", fontSize: 9.5, bold: true } },
      { text: r.message || "", options: { fontFace: "Calibri", fontSize: 9.5 } },
      { text: r.channel || "", options: { fontFace: "Calibri", fontSize: 9 } },
      { text: r.sender || "", options: { fontFace: "Calibri", fontSize: 9, color: AZ.mul, bold: true } },
      { text: r.date || "", options: { fontFace: "Courier New", fontSize: 8.5 } },
      { text: r.status || "", options: { fontFace: "Arial", fontSize: 8.5, bold: true, color: r.status === "sent" ? "2E7D32" : "C77800" } },
    ]);
  });
  s.addTable(rows, { x: 0.55, y: 2.0, w: 12.23, colW: [2.2, 3.7, 2.0, 1.9, 1.13, 1.3], border: { pt: 0.5, color: AZ.line }, rowH: 0.5, valign: "middle", margin: 0.05 });
  s.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.55, y: 6.25, w: 12.23, h: 0.7, rectRadius: 0.06, fill: { color: "FDF3DC" } });
  s.addText([{ text: "Rule:  ", options: { bold: true, color: "8A6200" } }, { text: "senders are leaders — the project drafts, credible voices deliver. Sequence aware → trained → live; every T10 readiness gap has a row here before G3.", options: { color: "1C2222" } }],
    { x: 0.8, y: 6.42, w: 11.7, h: 0.42, fontFace: "Calibri", fontSize: 10.5 });
}

/* ================= PORTFOLIO REVIEW PRINT PACK ================= */
function buildReviewHtml(projects, attention, ranked, retros, people = [], assignments = []) {
  const esc2 = s2 => String(s2 ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const buds = projects.map(p => budgetEval(p, people, assignments)).filter(Boolean);
  const tot = buds.reduce((s, b) => ({ env: s.env + b.env, p50: s.p50 + b.p50, p80: s.p80 + b.p80 }), { env: 0, p50: 0, p80: 0 });
  const reds = projects.reduce((n, p) => n + RAG_DIMS.filter(d => p.rag?.[d] === "R").length, 0);
  const ambers = projects.reduce((n, p) => n + RAG_DIMS.filter(d => p.rag?.[d] === "A").length, 0);
  const stat = (l, v, col = "#1C2222") => `<div style="flex:1;min-width:110px;background:#F6F4F2;border-radius:3mm;padding:3mm 4mm"><div style="font-family:'Courier New';font-size:6.5pt;letter-spacing:.12em;text-transform:uppercase;color:#9AA3A0">${l}</div><div style="font-family:Arial;font-weight:800;font-size:15pt;color:${col}">${v}</div></div>`;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Portfolio Review Pack — ${today()}</title><style>
  @page{size:A4;margin:0} *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Calibri,'Segoe UI',Arial,sans-serif;color:#1C2222;background:#fff}
  .page{position:relative;width:210mm;min-height:296mm;padding:10mm 14mm 16mm;page-break-after:always}
  .page::before{content:"";position:absolute;top:0;left:0;right:0;height:3.5mm;background:#830051}
  .page::after{content:"";position:absolute;bottom:0;left:0;right:0;height:3.5mm;background:#830051}
  h1{font-family:Arial;font-size:19pt;margin-top:6mm}h1 .m{color:#830051}h1 .g{color:#3F4444}
  .dash{width:13mm;height:1.2mm;background:#F0AB00;margin:2mm 0 4mm .5mm}
  h2{font-family:Arial;font-size:10pt;letter-spacing:.18em;text-transform:uppercase;color:#830051;margin:6mm 0 2mm}
  table{width:100%;border-collapse:collapse;font-size:9pt;margin-top:1.5mm}
  th{background:#3F4444;color:#fff;font-family:Arial;font-size:7.5pt;text-align:left;padding:2mm 2.5mm}
  td{padding:2mm 2.5mm;border-bottom:.2mm solid #ECE8E4;vertical-align:top}
  .chip{display:inline-block;font-family:Arial;font-size:6.5pt;font-weight:700;border-radius:99px;padding:.8mm 2.5mm;margin:.3mm}
  .foot{position:absolute;bottom:6mm;left:14mm;right:14mm;display:flex;justify-content:space-between;font-size:7pt;color:#9AA3A0;font-style:italic}
  .hint{position:fixed;top:6px;right:8px;background:#2B3333;color:#fff;font:600 11px Arial;padding:6px 12px;border-radius:8px}
  @media print{.hint{display:none}}</style></head><body>
  <div class="hint">Ctrl/Cmd+P → Save as PDF</div>
  <div class="page">
    <div style="display:flex;justify-content:space-between;align-items:baseline;padding-top:4mm"><span style="color:#830051;font-weight:700;font-size:13pt">AstraZeneca</span><span style="font-family:Arial;font-size:7pt;letter-spacing:.2em;color:#9AA3A0;font-weight:700">PORTFOLIO REVIEW · ${today()}</span></div>
    <h1><span class="g">Portfolio</span> <span class="m">Review Pack</span></h1><div class="dash"></div>
    <div style="display:flex;gap:3mm;flex-wrap:wrap">
      ${stat("Projects", projects.length)}${stat("Reds", reds, reds ? "#B3261E" : "#2E7D32")}${stat("Ambers", ambers, ambers ? "#C77800" : "#2E7D32")}${stat("Needs attention", attention.length, attention.length ? "#B3261E" : "#2E7D32")}${stat("Retros due", retros.length, retros.length ? "#C77800" : "#2E7D32")}
    </div>
    <h2>Needs attention first</h2>
    ${attention.length ? attention.map(({ p, flags }) => `<div style="border-left:1.2mm solid #B3261E;background:#FBFAF8;padding:2.5mm 3.5mm;margin-bottom:2mm;border-radius:0 2mm 2mm 0"><b style="font-family:Arial;font-size:9.5pt">${esc2(p.name)}</b> <span style="font-family:'Courier New';font-size:7pt;color:#830051">${esc2(p.code)} · Tier ${p.tier} · ${esc2(p.phase)}</span><div style="margin-top:1mm">${flags.map(f => `<span class="chip" style="background:#F8E9E8;color:#B3261E">${esc2(f)}</span>`).join("")}</div></div>`).join("") : `<div style="font-size:9.5pt;font-style:italic;color:#6B6B6B">Nothing flagged — and this page saying so is itself the signal.</div>`}
    <h2>Priority order (WSJF)</h2>
    <table><tr><th style="width:8mm">#</th><th>Project</th><th style="width:14mm">Tier</th><th style="width:18mm">WSJF</th><th>Headline</th></tr>
    ${ranked.slice(0, 8).map((p, i) => `<tr><td style="font-family:'Courier New';color:#8A6200;font-weight:700">${i + 1}</td><td><b>${esc2(p.name)}</b></td><td>${p.tier}</td><td style="font-family:'Courier New'">${p._wsjf}</td><td style="font-size:8.5pt;color:#6B6B6B">${esc2(p.keydata?.headline || "—")}</td></tr>`).join("")}</table>
    <div class="foot"><span>Generated by DCOS Navigator — assembled from live project data, review before circulation</span><span>Page 1</span></div>
  </div>
  <div class="page">
    <h2 style="margin-top:8mm">Day-30 configuration retros due</h2>
    ${retros.length ? `<table><tr><th>Project</th><th style="width:24mm">Hypothesis date</th><th>Hypothesis (excerpt)</th></tr>${retros.map(p => `<tr><td><b>${esc2(p.name)}</b></td><td style="font-family:'Courier New';font-size:8pt">${esc2(p.hypothesis?.date || "")}</td><td style="font-size:8.5pt;color:#6B6B6B">${esc2((p.hypothesis?.text || "").slice(0, 180))}…</td></tr>`).join("")}</table>` : `<div style="font-size:9.5pt;font-style:italic;color:#6B6B6B">None due this cycle.</div>`}
    <h2>Budget — portfolio roll-up (PERT)</h2>
    <div style="display:flex;gap:3mm;flex-wrap:wrap">
      ${stat("Envelopes", eur(tot.env))}${stat("Forecast P50", eur(tot.p50), tot.p50 > tot.env ? "#B3261E" : "#003865")}${stat("Forecast P80", eur(tot.p80), tot.p80 > tot.env ? "#B3261E" : "#8A6200")}
    </div>
    <table><tr><th>Project</th><th style="width:22mm">Envelope</th><th style="width:22mm">P50</th><th style="width:22mm">P80</th><th style="width:30mm">Verdict</th></tr>
    ${projects.map(p => { const b = budgetEval(p, people, assignments); if (!b) return ""; const v = !b.env ? ["no envelope", "#9AA3A0"] : b.p80 <= b.env ? ["GREEN", "#2E7D32"] : b.p50 <= b.env ? ["AMBER — P80 over", "#C77800"] : ["RED — P50 over", "#B3261E"]; return `<tr><td><b>${esc2(p.name)}</b></td><td style="font-family:'Courier New'">${eur(b.env)}</td><td style="font-family:'Courier New'">${eur(b.p50)}</td><td style="font-family:'Courier New'">${eur(b.p80)}</td><td style="font-family:Arial;font-weight:700;color:${v[1]}">${v[0]}</td></tr>`; }).join("")}</table>
    <div style="font-size:8pt;color:#6B6B6B;font-style:italic;margin-top:3mm">P80 is what we communicate upward; P50 is what we manage to. An envelope breached at P80 but not P50 is an honest amber.</div>
    ${(() => {
      const allB = projects.flatMap(p => (p.keydata?.benefits || []).map(b => ({ ...b, code: p.code })));
      if (!allB.length) return "";
      const SC = { "on track": "#2E7D32", "at risk": "#C77800", "realised": "#003865", "written off": "#B3261E" };
      const cnt = s => allB.filter(b => (b.status || "on track") === s).length;
      const noOwn = allB.filter(b => !b.owner || !String(b.owner).trim()).length;
      return `<h2>Benefits — portfolio value roll-up</h2>
      <div style="display:flex;gap:3mm;flex-wrap:wrap">
        ${["on track", "at risk", "realised", "written off"].map(s => stat(s, cnt(s), SC[s])).join("")}
      </div>
      <table><tr><th style="width:18mm">Project</th><th>Benefit</th><th style="width:24mm">Baseline</th><th style="width:24mm">Target</th><th style="width:30mm">Owner</th><th style="width:22mm">Status</th></tr>
      ${allB.map(b => `<tr><td style="font-family:'Courier New';font-size:8pt;color:#830051">${esc2(b.code)}</td><td><b>${esc2(b.name)}</b></td><td style="font-size:8.5pt;color:#6B6B6B">${esc2(b.baseline || "—")}</td><td style="font-size:8.5pt;color:#6B6B6B">${esc2(b.target || "—")}</td><td style="font-size:8.5pt;color:${b.owner ? "#1C2222" : "#B3261E"}">${esc2(b.owner || "no owner")}</td><td style="font-family:Arial;font-weight:700;font-size:8.5pt;color:${SC[b.status || "on track"]}">${esc2(b.status || "on track")}</td></tr>`).join("")}</table>
      <div style="font-size:8pt;color:#6B6B6B;font-style:italic;margin-top:3mm">A benefit with no owner is not a benefit.${noOwn ? ` ${noOwn} currently unowned.` : ""} Value status traces to each project's T02 hypotheses.</div>`;
    })()}
    <div class="foot"><span>DCOS Navigator · Delivery &amp; Change Office</span><span>Page 2</span></div>
  </div></body></html>`;
}

/* ================= FLOW ANALYTICS (Businessmap-style: WIP · blockers · CFD · Little's law) ================= */
function pushFlow(p, nw) {
  const counts = { backlog: 0, doing: 0, review: 0, done: 0 };
  nw.forEach(c => { counts[c.col] = (counts[c.col] || 0) + 1; });
  const d = today();
  const log = (p.flowLog || []).filter(e => e.d !== d);
  return [...log, { d, ...counts }].slice(-120);
}
function seedFlow() {
  const dDay = n => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
  const traj = [[4, 1, 0, 0], [4, 1, 0, 0], [3, 2, 0, 0], [3, 2, 0, 0], [3, 1, 1, 0], [2, 2, 1, 0], [2, 2, 1, 0], [2, 2, 0, 1], [2, 2, 0, 1], [1, 3, 0, 1], [1, 3, 0, 1], [1, 2, 1, 1], [1, 2, 1, 1], [1, 2, 1, 1], [1, 2, 1, 1]];
  return traj.map((t, i) => ({ d: dDay(i - traj.length), backlog: t[0], doing: t[1], review: t[2], done: t[3] }));
}
function FlowView({ project, update }) {
  const work = project.work || [], log = project.flowLog || [];
  const wip = project.wip || {};
  const n = k => work.filter(c => c.col === k).length;
  const wipNow = n("doing") + n("review");
  const blocked = work.filter(c => c.blocked);
  const ago = log.length > 1 ? log[Math.max(log.length - 15, 0)] : null;
  const thr = ago ? Math.max((log[log.length - 1]?.done ?? 0) - (ago.done ?? 0), 0) : 0;
  const days = ago ? Math.max(Math.round((new Date(log[log.length - 1].d) - new Date(ago.d)) / 86400000), 1) : 14;
  const cycle = thr > 0 ? (wipNow / (thr / days)).toFixed(1) : null;
  const bn = ["doing", "review"].map(k => ({ k, n: n(k), lim: wip[k] })).filter(x => x.lim).sort((a, b) => b.n / b.lim - a.n / a.lim)[0];
  const setWip = (k, v) => update(project.id, { wip: { ...wip, [k]: v ? +v : undefined } });
  const kpi = (l, v, col = C.ink, sub) => (
    <Card style={{ flex: "1 1 140px", padding: "12px 16px" }}>
      <div style={{ fontFamily: MONO, fontSize: 10, textTransform: "uppercase", color: C.faint }}>{l}</div>
      <div style={{ fontFamily: DISP, fontWeight: 800, fontSize: 24, color: col }}>{v}</div>
      {sub && <div style={{ fontSize: 10.5, color: C.faint }}>{sub}</div>}
    </Card>
  );
  return (
    <div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
        {kpi("WIP now", wipNow, bn && bn.n > bn.lim ? C.red : C.navy, "doing + review")}
        {kpi("Blocked", blocked.length, blocked.length ? C.red : C.lime)}
        {kpi("Throughput", thr + " items", C.ink, `last ${days} days → done`)}
        {kpi("Cycle time est.", cycle ? cycle + " d" : "—", "#8A6200", "Little's law: WIP ÷ throughput rate")}
      </div>
      <Card style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap", marginBottom: 8 }}>
          <SectionLabel color={C.navy}>WIP limits</SectionLabel>
          {["doing", "review"].map(k => (
            <label key={k} style={{ fontSize: 12, color: C.mid, display: "flex", gap: 6, alignItems: "center" }}>
              {k === "doing" ? "In progress" : "In review"} ≤
              <input type="number" min={1} value={wip[k] ?? ""} placeholder="—" onChange={e => setWip(k, e.target.value)} style={{ width: 56, border: `1px solid ${C.soft}`, background: "#FBFAF8", borderRadius: 7, padding: "6px 8px", fontSize: 12, fontFamily: MONO }} />
            </label>
          ))}
          {bn && bn.n > bn.lim && <Chip bg="#F8E9E8" color={C.red}>bottleneck: {bn.k} at {bn.n}/{bn.lim} — stop starting, start finishing</Chip>}
          {bn && bn.n <= bn.lim && <Chip bg={C.limeLt} color={C.lime}>flow inside limits</Chip>}
        </div>
        <div style={{ fontSize: 11.5, color: C.faint }}>Limits show on the Board headers (⚠ WIP when breached). A breached limit is a pull-system signal, not a performance verdict: swarm the column, don't open new work.</div>
      </Card>
      <Card style={{ marginBottom: 14 }}>
        <SectionLabel>Cumulative flow — where the work sits over time</SectionLabel>
        {log.length > 2 ? (
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={log} margin={{ top: 8, right: 10, left: -18, bottom: 0 }}>
              <CartesianGrid stroke={C.soft} vertical={false} />
              <XAxis dataKey="d" tick={{ fontSize: 9, fill: C.faint }} tickFormatter={v => v.slice(5)} />
              <YAxis tick={{ fontSize: 9, fill: C.faint }} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
              <Area type="monotone" dataKey="done" stackId="1" stroke={C.lime} fill={C.limeLt} name="Done" />
              <Area type="monotone" dataKey="review" stackId="1" stroke="#C77800" fill={C.goldLt} name="In review" />
              <Area type="monotone" dataKey="doing" stackId="1" stroke={C.navy} fill={C.navyLt} name="In progress" />
              <Area type="monotone" dataKey="backlog" stackId="1" stroke={C.faint} fill={C.soft} name="Backlog" />
            </AreaChart>
          </ResponsiveContainer>
        ) : <div style={{ fontSize: 12.5, color: C.mid }}>The diagram draws itself as you move cards — every board move logs a daily snapshot. Reload demo data for a seeded history.</div>}
        <div style={{ fontSize: 11, color: C.faint, marginTop: 6 }}>Read it like Businessmap: parallel bands = healthy flow · a widening band = the bottleneck · flat "Done" = nothing shipping while everything moves.</div>
      </Card>
      <Card>
        <SectionLabel color={C.red}>Blocked items — every flag needs an owner and an unblock path</SectionLabel>
        {blocked.length === 0 && <div style={{ fontSize: 12.5, color: C.mid }}>Nothing blocked. When something is, flag it on the Board (⚑) and capture the unblock note here.</div>}
        {blocked.map(c => (
          <div key={c.id} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 7, flexWrap: "wrap" }}>
            <Chip bg="#F8E9E8" color={C.red}>{(WCOLS.find(([k]) => k === c.col) || [])[1]}</Chip>
            <span style={{ fontSize: 12.5, fontWeight: 600 }}>{c.title}</span>
            <input value={c.blockNote || ""} onChange={e => update(project.id, { work: work.map(x => x.id === c.id ? { ...x, blockNote: e.target.value } : x) })} placeholder="Blocked by… → unblock action + owner" style={{ flex: 1, minWidth: 200, border: `1px solid ${C.soft}`, background: "#FBFAF8", borderRadius: 7, padding: "7px 9px", fontSize: 12 }} />
          </div>
        ))}
        {blocked.length > 0 && <div style={{ fontSize: 11, color: C.faint, marginTop: 4 }}>A blocker older than one cycle is an escalation (T03 → SteerCo with options), not a status note.</div>}
      </Card>
    </div>
  );
}

/* ================= WHITEBOARD (Miro-style canvas → tracked objects) ================= */
const WB_COLORS = ["#FFF4B8", "#FFD6E7", "#D6E8FF", "#DFF5D8", "#F3E3FF"];
function WhiteboardTab({ projects, project, setSel, update }) {
  const [selId, setSelId] = useState(null);
  const [editId, setEditId] = useState(null);
  const [drag, setDrag] = useState(null);
  const [live, setLive] = useState(null);
  if (!project) return <Card>Add a project in Portfolio first.</Card>;
  const notes = project.canvasNotes || [];
  const mode = project.canvasMode || "free";
  const setNotes = v => update(project.id, { canvasNotes: v });
  const selNote = notes.find(x => x.id === selId);
  const W2 = 1020, H2 = 540;
  const addNote = () => {
    const nn = { id: uid(), x: 60 + Math.random() * 300, y: 50 + Math.random() * 220, color: WB_COLORS[notes.length % WB_COLORS.length], text: "" };
    setNotes([...notes, nn]); setSelId(nn.id); setEditId(nn.id);
  };
  const onDown = (e, nIt) => {
    if (editId === nIt.id) return;
    const rect = e.currentTarget.parentElement.getBoundingClientRect();
    setDrag({ id: nIt.id, dx: e.clientX - rect.left - nIt.x, dy: e.clientY - rect.top - nIt.y });
    setSelId(nIt.id);
  };
  const onMove = e => {
    if (!drag) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setLive({ id: drag.id, x: Math.min(Math.max(e.clientX - rect.left - drag.dx, 0), W2 - 150), y: Math.min(Math.max(e.clientY - rect.top - drag.dy, 0), H2 - 60) });
  };
  const onUp = () => {
    if (drag && live && live.id === drag.id) setNotes(notes.map(x => x.id === live.id ? { ...x, x: live.x, y: live.y } : x));
    setDrag(null); setLive(null);
  };
  const pos = nIt => (live && live.id === nIt.id) ? live : nIt;
  const promote = (kind) => {
    if (!selNote || selNote.promoted) return;
    const text = (selNote.text || "Untitled").trim() || "Untitled";
    const kd = { ...KD_DEFAULT, ...(project.keydata || {}) };
    const patch =
      kind === "work" ? { work: [...(project.work || []), { id: uid(), title: text, col: "backlog" }] }
      : kind === "risk" ? { keydata: { ...kd, risks: [...kd.risks, { id: uid(), desc: text, owner: "", due: "" }] } }
      : kind === "benefit" ? { keydata: { ...kd, benefits: [...kd.benefits, { id: uid(), name: text, baseline: "", target: "", owner: "", status: "on track" }] } }
      : kind === "decision" ? { keydata: { ...kd, decisions: [...kd.decisions, { id: uid(), text, owner: "", status: "needed" }] } }
      : { epics: [...(project.epics || []), { id: uid(), title: text, user: "", problem: "", hypothesis: "", acceptance: "", instrumentation: "" }] };
    const label = { work: "Board item", risk: "Risk (T03)", benefit: "Benefit (T13)", decision: "Decision (T08)", epic: "Epic (T15)" }[kind];
    update(project.id, { ...patch, canvasNotes: notes.map(x => x.id === selNote.id ? { ...x, promoted: label } : x), events: evPush(project, mkEv("artefact", `Whiteboard note promoted → ${label}`, text.slice(0, 120))) });
  };
  const quickWins = mode === "quad" ? notes.filter(nIt => nIt.x < W2 / 2 - 75 && nIt.y < H2 / 2 - 30).length : 0;
  const lanes = ["Frame", "Mobilise", "Deliver", "Embed", "Realise"];
  const btn = (label, on, dis, color = C.navy) => (
    <button onClick={on} disabled={dis} style={{ border: `1px solid ${dis ? C.soft : color}`, background: "#fff", color: dis ? C.faint : color, borderRadius: 8, padding: "6px 11px", fontSize: 11.5, fontWeight: 700, fontFamily: DISP, cursor: dis ? "default" : "pointer" }}>{label}</button>
  );
  return (
    <div>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
        <ProjectPicker projects={projects} project={project} setSel={setSel} />
        <button onClick={addNote} style={{ background: C.mul, color: "#fff", border: "none", borderRadius: 8, padding: "9px 16px", fontFamily: DISP, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>+ Note</button>
        <div style={{ display: "flex", gap: 6 }}>
          {[["free", "Free"], ["quad", "Value / Effort"], ["lanes", "Stage lanes"]].map(([id, l]) => (
            <button key={id} onClick={() => update(project.id, { canvasMode: id })} style={{ border: `1px solid ${mode === id ? C.navy : C.line}`, background: mode === id ? C.navy : "#fff", color: mode === id ? "#fff" : C.mid, borderRadius: 99, padding: "6px 13px", fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}>{l}</button>
          ))}
        </div>
        {mode === "quad" && <Chip bg={C.limeLt} color={C.lime}>quick wins (high value · low effort): {quickWins}</Chip>}
      </div>
      <Card style={{ marginBottom: 12, padding: "10px 16px", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontFamily: MONO, fontSize: 10, textTransform: "uppercase", color: C.faint }}>Selected note →</span>
        {WB_COLORS.map(col => <button key={col} onClick={() => selNote && setNotes(notes.map(x => x.id === selId ? { ...x, color: col } : x))} style={{ width: 20, height: 20, borderRadius: "50%", background: col, border: `2px solid ${selNote?.color === col ? C.graph : "#fff"}`, cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,.15)" }} />)}
        <span style={{ width: 1, height: 20, background: C.line, margin: "0 4px" }} />
        {btn("→ Board", () => promote("work"), !selNote || selNote.promoted)}
        {btn("→ Risk", () => promote("risk"), !selNote || selNote.promoted, C.red)}
        {btn("→ Benefit", () => promote("benefit"), !selNote || selNote.promoted, C.lime)}
        {btn("→ Epic", () => promote("epic"), !selNote || selNote.promoted, C.mul)}
        {btn("→ Decision", () => promote("decision"), !selNote || selNote.promoted, "#8A6200")}
        <span style={{ width: 1, height: 20, background: C.line, margin: "0 4px" }} />
        {btn("Delete", () => { setNotes(notes.filter(x => x.id !== selId)); setSelId(null); }, !selNote, C.faint)}
        {selNote?.promoted && <Chip bg={C.limeLt} color={C.lime}>tracked as {selNote.promoted} ✓</Chip>}
      </Card>
      <Card style={{ padding: 0, overflowX: "auto" }}>
        <div onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp} onClick={e => { if (e.target === e.currentTarget) { setSelId(null); setEditId(null); } }}
          style={{ position: "relative", width: W2, height: H2, background: "#FDFCFA", borderRadius: 12, touchAction: "none", backgroundImage: "radial-gradient(#E8E3DD 1px, transparent 1px)", backgroundSize: "22px 22px" }}>
          {mode === "quad" && (<>
            <div style={{ position: "absolute", left: W2 / 2, top: 0, bottom: 0, width: 1.5, background: C.line }} />
            <div style={{ position: "absolute", top: H2 / 2, left: 0, right: 0, height: 1.5, background: C.line }} />
            {[["HIGH VALUE · LOW EFFORT — do first", 10, 8, C.lime], ["HIGH VALUE · HIGH EFFORT — plan", W2 / 2 + 10, 8, C.navy], ["LOW VALUE · LOW EFFORT — maybe", 10, H2 / 2 + 8, "#8A6200"], ["LOW VALUE · HIGH EFFORT — kill", W2 / 2 + 10, H2 / 2 + 8, C.red]].map(([t2, x, y, col]) => (
              <span key={t2} style={{ position: "absolute", left: x, top: y, fontFamily: MONO, fontSize: 9, letterSpacing: ".08em", color: col, pointerEvents: "none" }}>{t2}</span>
            ))}
          </>)}
          {mode === "lanes" && lanes.map((l, i) => (
            <div key={l} style={{ position: "absolute", left: i * (W2 / 5), top: 0, bottom: 0, width: W2 / 5, borderRight: i < 4 ? `1.5px solid ${C.line}` : "none", pointerEvents: "none" }}>
              <span style={{ position: "absolute", top: 8, left: 10, fontFamily: MONO, fontSize: 9.5, letterSpacing: ".1em", textTransform: "uppercase", color: C.mul }}>{l}</span>
            </div>
          ))}
          {notes.map(nIt => {
            const p2 = pos(nIt);
            const isSel = nIt.id === selId;
            return (
              <div key={nIt.id} onPointerDown={e => onDown(e, nIt)} onDoubleClick={() => setEditId(nIt.id)}
                style={{ position: "absolute", left: p2.x, top: p2.y, width: 150, minHeight: 56, background: nIt.color, borderRadius: 8, padding: "9px 11px", fontSize: 12, lineHeight: 1.45, boxShadow: isSel ? `0 0 0 2px ${C.mul}, 0 4px 12px rgba(0,0,0,.18)` : "0 3px 8px rgba(0,0,0,.14)", cursor: drag?.id === nIt.id ? "grabbing" : "grab", userSelect: "none", transform: "rotate(-0.4deg)" }}>
                {editId === nIt.id ? (
                  <textarea autoFocus defaultValue={nIt.text} onBlur={e => { setNotes(notes.map(x => x.id === nIt.id ? { ...x, text: e.target.value } : x)); setEditId(null); }}
                    style={{ width: "100%", minHeight: 48, border: "none", background: "transparent", fontSize: 12, fontFamily: BODY, resize: "none", outline: "none" }} />
                ) : (nIt.text || <span style={{ color: "#9A8F7E" }}>double-click to write…</span>)}
                {nIt.promoted && <div style={{ fontFamily: MONO, fontSize: 8, color: C.lime, fontWeight: 700, marginTop: 4 }}>✓ {nIt.promoted}</div>}
              </div>
            );
          })}
        </div>
      </Card>
      <div style={{ fontSize: 11.5, color: C.faint, marginTop: 10 }}>Drag to position · double-click to write · click to select, then promote. <b>The point of the wall:</b> a sticky that matters doesn't stay a sticky — promoted notes become tracked objects (board, RAID, benefits, epics, decisions) and the promotion is logged in the ledger. In Value/Effort mode the wall is your next Priority Lab session; in Stage lanes it's a lightweight process map of the delivery path.</div>
    </div>
  );
}

/* ================= TEAM & AI OPERATING MODEL ================= */
function agentReadiness(p) {
  const kd = { ...KD_DEFAULT, ...(p.keydata || {}) };
  const eps = p.epics || [];
  const checks = [
    ["Headline written (T04 seed)", !!kd.headline],
    ["Risks carry owner + date", kd.risks.length > 0 && kd.risks.every(r => r.owner && r.due)],
    ["Decisions carry decision-makers", kd.decisions.length > 0 && kd.decisions.every(d => d.owner)],
    ["Benefits have business owners", kd.benefits.length > 0 && kd.benefits.every(b => b.owner)],
    ["Plan ≥3 milestones with confidence", (p.plan || []).filter(m => m.due).length >= 3],
    ["Stakeholder map exists (T09)", (p.stakeholders || []).length >= 3],
    ["Epics carry instrumentation", eps.length === 0 || eps.every(e => e.instrumentation)],
    ["Ledger alive (≥5 events)", (p.events || []).length >= 5],
    ["Tier hypothesis on record", !!p.hypothesis?.text],
    ["PM accountable named", !!p.pm],
  ];
  const score = Math.round(checks.filter(c => c[1]).length / checks.length * 100);
  return { checks, score };
}
const AGENT_SPLIT = [
  ["Status assembly (T04/T05)", "AG-01", "Drafts headline candidates + populates the deck from systems of record", "Sets the RAG, chooses the narrative, signs", "From author to editor-in-chief"],
  ["RAID hygiene & mining", "AG-02", "Flags undated mitigations, ownerless risks, aging items; clusters patterns across projects", "Judges severity, owns escalations, brings options to the SteerCo", "From bookkeeper to risk strategist"],
  ["Meeting capture (minutes, actions)", "AG-03", "Transcribes, drafts decisions/actions with owners, files to the ledger", "Confirms the decision actually taken; resolves ambiguity in the room", "Presence over note-taking"],
  ["Plan & dependency upkeep", "AG-01", "Syncs dates from JIRA/Smartsheet, recomputes confidence signals, flags dep conflicts", "Re-baselines (with T08 entry), negotiates trade-offs", "From scheduler to negotiator"],
  ["Stakeholder engagement", "—", "Surfaces stance-change signals from interaction data (future)", "All of it: trust, candour, the corridor conversation", "Untouched — and more valuable"],
  ["Value narrative & benefits", "AG-04 assist", "Pulls telemetry, drafts the value story against T13 targets", "Owns the honest amber, the write-off call, the QBR defence", "From reporter to value steward"],
  ["Tailoring & retro judgement", "Copilot", "Prepares evidence packs against pivot triggers", "Decides keep / adjust / change tier; coaches the team", "Hypothesis discipline is the job"],
];
function TeamAI({ projects, update, people, assignments, setTab, setSel }) {
  const pmNames = [...new Set([...projects.map(p => p.pm).filter(Boolean), ...people.filter(p2 => /\bpm\b|project manager/i.test(p2.role || "")).map(p2 => p2.name)])];
  const m0 = ymNow();
  const loadOf = name => {
    const per = people.find(x => x.name === name); if (!per) return null;
    return assignments.filter(a => a.personId === per.id && a.from && a.to && a.from <= m0 && m0 <= a.to).reduce((s, a) => s + (+a.pct || 0), 0);
  };
  const rows = pmNames.map(name => {
    const led = projects.filter(p => p.pm === name);
    const reds = led.reduce((n, p) => n + RAG_DIMS.filter(d => p.rag?.[d] === "R").length, 0);
    const ambers = led.reduce((n, p) => n + RAG_DIMS.filter(d => p.rag?.[d] === "A").length, 0);
    const health = led.map(p => (p.snapshots || []).slice(-1)[0]?.score).filter(Boolean);
    const retrosDue = led.filter(p => p.hypothesis?.date && !p.hypothesis.retroDone && (Date.now() - new Date(p.hypothesis.date)) / 86400000 >= 25).length;
    const ready = led.length ? Math.round(led.reduce((s, p) => s + agentReadiness(p).score, 0) / led.length) : null;
    return { name, led, reds, ambers, health: health.length ? Math.round(health.reduce((a, b) => a + b, 0) / health.length) : null, retrosDue, load: loadOf(name), ready };
  });
  const unassigned = projects.filter(p => !p.pm);
  const portReady = projects.length ? Math.round(projects.reduce((s, p) => s + agentReadiness(p).score, 0) / projects.length) : 0;
  const [openP, setOpenP] = useState(null);
  return (
    <div>
      <Card style={{ marginBottom: 14 }}>
        <div style={{ fontFamily: DISP, fontWeight: 800, fontSize: 18 }}>Team & AI operating model</div>
        <div style={{ fontSize: 12.5, color: C.mid }}>Managing a PM team in a data & AI environment means three things: balanced spans of control with comparable signals, a portfolio whose data is clean enough for agents to draft from, and absolute clarity on what stays human. This space covers all three.</div>
      </Card>

      <SectionLabel>1 · The PM team — span, signal and load</SectionLabel>
      <Card style={{ padding: 0, overflowX: "auto", marginBottom: 8 }}>
        <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 720, fontSize: 12.5 }}>
          <thead><tr>{["PM", "Projects led", "Reds / Ambers", "Avg health", "Retros due", "Load (this month)", "Agent-readiness"].map(h => <th key={h} style={{ textAlign: "left", padding: "9px 14px", fontFamily: DISP, fontSize: 10.5, color: "#fff", background: C.graph, whiteSpace: "nowrap" }}>{h}</th>)}</tr></thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.name}>
                <td style={{ padding: "9px 14px", borderTop: `1px solid ${C.soft}`, fontFamily: DISP, fontWeight: 700 }}>{r.name}</td>
                <td style={{ padding: "9px 14px", borderTop: `1px solid ${C.soft}` }}>{r.led.length ? r.led.map(p => <Chip key={p.id} bg={C.mulLt} color={C.mul} style={{ cursor: "pointer" }} onClick={() => { setSel(p.id); setTab("data"); }}>{p.code}</Chip>) : <span style={{ color: C.faint }}>—</span>}</td>
                <td style={{ padding: "9px 14px", borderTop: `1px solid ${C.soft}`, fontFamily: MONO, fontSize: 11.5 }}><span style={{ color: r.reds ? C.red : C.faint, fontWeight: 700 }}>{r.reds}R</span> / <span style={{ color: r.ambers ? "#8A6200" : C.faint }}>{r.ambers}A</span></td>
                <td style={{ padding: "9px 14px", borderTop: `1px solid ${C.soft}`, fontFamily: MONO }}>{r.health ?? "—"}</td>
                <td style={{ padding: "9px 14px", borderTop: `1px solid ${C.soft}`, color: r.retrosDue ? "#8A6200" : C.faint, fontWeight: r.retrosDue ? 700 : 400 }}>{r.retrosDue || "—"}</td>
                <td style={{ padding: "9px 14px", borderTop: `1px solid ${C.soft}` }}>{r.load === null ? <span style={{ color: C.faint }}>not in registry</span> : <Chip bg={r.load > 100 ? "#F8E9E8" : r.load > 85 ? C.goldLt : C.limeLt} color={r.load > 100 ? C.red : r.load > 85 ? "#8A6200" : C.lime}>{r.load}%</Chip>}</td>
                <td style={{ padding: "9px 14px", borderTop: `1px solid ${C.soft}`, fontFamily: MONO, fontWeight: 700, color: r.ready === null ? C.faint : r.ready >= 80 ? C.lime : r.ready >= 60 ? "#8A6200" : C.red }}>{r.ready === null ? "—" : r.ready + "%"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <div style={{ fontSize: 11.5, color: C.faint, marginBottom: 14 }}>
        {unassigned.length > 0 && <span style={{ color: "#8A6200", fontWeight: 600 }}>{unassigned.length} project(s) without a named PM ({unassigned.map(p => p.code).join(", ")}) — assign in Project Data. </span>}
        Span of control doctrine: a PM carries what their signal quality can sustain — when reds pile up on one row, rebalance in Capacity before coaching in 1:1s.
      </div>

      <SectionLabel color={C.navy}>2 · Agent-readiness — can an agent draft from this portfolio?</SectionLabel>
      <Card style={{ marginBottom: 8 }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
          <div>
            <div style={{ fontFamily: MONO, fontSize: 10, textTransform: "uppercase", color: C.faint }}>Portfolio average</div>
            <div style={{ fontFamily: DISP, fontWeight: 800, fontSize: 30, color: portReady >= 80 ? C.lime : portReady >= 60 ? "#8A6200" : C.red }}>{portReady}%</div>
          </div>
          <div style={{ flex: 1, minWidth: 240, fontSize: 12, color: C.mid }}>An agent can only draft from what exists: AG-01 can't write a status without a headline habit and dated risks; AG-02 can't mine RAID without owners. <b>Data hygiene is the AI strategy.</b> Each check below is a field the Blueprint agents will consume.</div>
        </div>
        {projects.map(p => {
          const { checks, score } = agentReadiness(p);
          return (
            <div key={p.id} style={{ marginBottom: 8 }}>
              <div onClick={() => setOpenP(openP === p.id ? null : p.id)} style={{ display: "flex", gap: 10, alignItems: "center", cursor: "pointer" }}>
                <span style={{ fontFamily: DISP, fontWeight: 700, fontSize: 13, minWidth: 170 }}>{p.name}</span>
                <div style={{ flex: 1, height: 9, background: C.soft, borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ width: score + "%", height: "100%", background: score >= 80 ? C.lime : score >= 60 ? C.gold : C.red }} />
                </div>
                <span style={{ fontFamily: MONO, fontSize: 11.5, fontWeight: 700, minWidth: 40 }}>{score}%</span>
                <span style={{ color: C.faint }}>{openP === p.id ? "−" : "+"}</span>
              </div>
              {openP === p.id && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: "2px 18px", padding: "8px 4px 4px", fontSize: 11.5 }}>
                  {checks.map(([l, ok]) => <div key={l} style={{ color: ok ? C.mid : C.red }}>{ok ? "✓" : "✗"} {l}</div>)}
                </div>
              )}
            </div>
          );
        })}
      </Card>
      <div style={{ fontSize: 11.5, color: C.faint, marginBottom: 14 }}>Run this before the agent pilot: the 60-day gates (≥1.5 h/week returned, ≥95% draft accuracy) are only winnable above ~80% readiness.</div>

      <SectionLabel color={"#8A6200"}>3 · Who does what — agents draft, PMs dispose</SectionLabel>
      <Card style={{ padding: 0, overflowX: "auto", marginBottom: 8 }}>
        <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 860, fontSize: 12 }}>
          <thead><tr>{["PM activity", "Agent", "The agent will…", "The PM keeps…", "Skill shift"].map(h => <th key={h} style={{ textAlign: "left", padding: "9px 13px", fontFamily: DISP, fontSize: 10.5, color: "#fff", background: C.graph }}>{h}</th>)}</tr></thead>
          <tbody>
            {AGENT_SPLIT.map(r => (
              <tr key={r[0]}>
                <td style={{ padding: "8px 13px", borderTop: `1px solid ${C.soft}`, fontWeight: 600 }}>{r[0]}</td>
                <td style={{ padding: "8px 13px", borderTop: `1px solid ${C.soft}` }}><Chip bg={r[1] === "—" ? C.soft : C.mulLt} color={r[1] === "—" ? C.faint : C.mul}>{r[1]}</Chip></td>
                <td style={{ padding: "8px 13px", borderTop: `1px solid ${C.soft}`, color: C.mid }}>{r[2]}</td>
                <td style={{ padding: "8px 13px", borderTop: `1px solid ${C.soft}`, color: C.ink, fontWeight: 500 }}>{r[3]}</td>
                <td style={{ padding: "8px 13px", borderTop: `1px solid ${C.soft}`, color: C.navy, fontStyle: "italic" }}>{r[4]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card style={{ borderLeft: `4px solid ${C.gold}`, background: C.goldLt }}>
        <div style={{ fontSize: 12.5, color: C.ink }}>
          <b>The role doesn't shrink — it concentrates.</b> Agents absorb assembly, hygiene and capture (~30–40% of a PM's week per the Blueprint baseline); what remains is the part that was always the job: judgement under uncertainty, stakeholder trust, honest narratives, and the signature. Develop the team accordingly: Academy L2/L3, eval discipline (reviewing agent drafts is a skill), and the tailoring/retro muscle. <b>The PM who only assembled status is exposed; the PM who decides well becomes the bottleneck worth paying for.</b>
        </div>
      </Card>
    </div>
  );
}

/* ================= BACKUP & RESTORE PANEL ================= */
function BackupPanel({ onClose, current, onRestore }) {
  const [snaps, setSnaps] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const fileRef = React.useRef(null);
  React.useEffect(() => { loadSnapshots().then(s => setSnaps(s.slice().reverse())); }, []);
  const curKb = (() => { try { return Math.round(JSON.stringify(current).length / 1024); } catch { return 0; } })();
  const fmt = s => { try { const d = new Date(s); return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }); } catch { return s; } };
  const summary = payload => { try { const b = JSON.parse(payload); return `${(b.projects || []).length} projects · ${(b.people || []).length} people · ${Math.round(payload.length / 1024)} KB`; } catch { return "—"; } };
  const restore = payload => { try { onRestore(JSON.parse(payload)); } catch { alert("That snapshot is unreadable."); } };
  const importFile = file => {
    if (!file) return;
    const r = new FileReader();
    r.onload = () => { try { const b = JSON.parse(r.result); if (Array.isArray(b.projects)) onRestore(b); else alert("That file has no 'projects' array."); } catch { alert("Couldn't parse that JSON file."); } };
    r.readAsText(file);
  };
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(28,34,34,.55)", zIndex: 60, display: "grid", placeItems: "center", padding: 18 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: "min(640px,95vw)", maxHeight: "88vh", overflowY: "auto", background: "#fff", borderRadius: 14, boxShadow: "0 18px 50px rgba(0,0,0,.3)" }}>
        <div style={{ background: C.graph, color: "#fff", padding: "12px 18px", borderRadius: "14px 14px 0 0", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: DISP, fontWeight: 800, fontSize: 15 }}>Backups & restore</span>
          <button onClick={onClose} style={{ marginLeft: "auto", border: "none", background: "rgba(255,255,255,.18)", color: "#fff", borderRadius: 6, padding: "3px 10px", cursor: "pointer", fontSize: 13 }}>×</button>
        </div>
        <div style={{ padding: 18 }}>
          <Card style={{ marginBottom: 14, background: C.soft }}>
            <SectionLabel>Your data &amp; how it's protected</SectionLabel>
            <div style={{ fontSize: 12.5, color: C.mid, lineHeight: 1.6 }}>
              Everything lives in this browser's local storage and saves automatically as you work (currently <b>{curKb} KB</b>). On top of that the app keeps the <b>last {SNAP_MAX} automatic snapshots</b> (one roughly every 20 minutes of changes) so you can roll back a mistake. For a backup that survives clearing the browser, <b>download a JSON file</b> and keep it safe — that's the portable copy you can re-import here or on another machine.
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
              <button onClick={() => exportJson(current)} style={{ background: C.mul, color: "#fff", border: "none", borderRadius: 8, padding: "9px 15px", fontFamily: DISP, fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>Download JSON backup ↓</button>
              <button onClick={() => fileRef.current?.click()} style={{ border: `1px solid ${C.navy}`, color: C.navy, background: "#fff", borderRadius: 8, padding: "9px 15px", fontFamily: DISP, fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>Restore from a file ↑</button>
              <input ref={fileRef} type="file" accept="application/json" style={{ display: "none" }} onChange={e => importFile(e.target.files?.[0])} />
            </div>
          </Card>
          <SectionLabel color={C.navy}>Automatic snapshots</SectionLabel>
          {snaps === null && <div style={{ fontSize: 12.5, color: C.faint }}>Loading…</div>}
          {snaps && snaps.length === 0 && <div style={{ fontSize: 12.5, color: C.faint }}>No snapshots yet — they start accumulating as you make changes.</div>}
          {snaps && snaps.map((s, i) => (
            <div key={s.stamp} style={{ display: "flex", gap: 10, alignItems: "center", padding: "9px 12px", border: `1px solid ${C.line}`, borderRadius: 9, marginBottom: 7, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 13 }}>{fmt(s.stamp)} {i === 0 && <Chip bg={C.limeLt} color={C.lime}>latest</Chip>}</div>
                <div style={{ fontSize: 11, color: C.faint, fontFamily: MONO }}>{summary(s.payload)}</div>
              </div>
              {confirm === s.stamp ? (
                <>
                  <span style={{ fontSize: 11.5, color: C.red }}>Replace current data?</span>
                  <button onClick={() => restore(s.payload)} style={{ background: C.red, color: "#fff", border: "none", borderRadius: 7, padding: "6px 12px", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>Yes, restore</button>
                  <button onClick={() => setConfirm(null)} style={{ border: `1px solid ${C.line}`, background: "#fff", borderRadius: 7, padding: "6px 12px", fontSize: 11.5, cursor: "pointer" }}>Cancel</button>
                </>
              ) : (
                <>
                  <button onClick={() => exportJson(JSON.parse(s.payload))} title="Download this snapshot" style={{ border: `1px solid ${C.line}`, background: "#fff", borderRadius: 7, padding: "6px 11px", fontSize: 11.5, cursor: "pointer", color: C.mid }}>↓</button>
                  <button onClick={() => setConfirm(s.stamp)} style={{ border: `1px solid ${C.navy}`, color: C.navy, background: "#fff", borderRadius: 7, padding: "6px 12px", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>Restore</button>
                </>
              )}
            </div>
          ))}
          <div style={{ fontSize: 11, color: C.faint, marginTop: 6 }}>Restoring replaces what's on screen now — download a backup of the current state first if unsure. Snapshots are kept in this browser; the JSON file is the copy that travels.</div>
        </div>
      </div>
    </div>
  );
}

/* ================= TEAM CHARTER (North Star · principles · pain points · WoW · training · best practice · prioritisation · decision log) ================= */
const CHARTER_DEFAULT = {
  northStar: "", northMetrics: [],
  principles: [], painPoints: [], wow: [], training: [], bestPractice: [],
  priorities: [], log: [], appIdeas: [],
};
const PAIN_STATUS = { open: ["open", C.redLt || "#F8E9E8", C.red], addressing: ["addressing", C.goldLt, "#8A6200"], resolved: ["resolved", C.limeLt, C.lime] };
const CHARTER_EXAMPLES = {
  north: { title: "North Star — examples", apply: "Use as your North Star",
    items: ["Every OBU data & AI initiative delivers value the business can measure, with governance it trusts — and we ship faster each year than the last.",
      "We are the team that makes the right AI bets obvious and the wrong ones cheap to stop.",
      "From request to trusted answer in days, not cycles — at portfolio scale, without heroics."],
    note: "A good North Star is outcome-led, a little uncomfortable, and true a year from now. Pair it with 2-3 leading metrics (cycle time idea\u2192pilot, % benefits with a named owner, adoption at week 4)." },
  principles: { title: "Principles — examples (belief \u2192 consequence)",
    items: ["Honest ambers over green theatre \u2192 we surface bad news early and always bring options, never a naked problem.",
      "Tailor the method to the risk \u2192 the wizard decides the tier; seniority and preference don't.",
      "No telemetry, no Done \u2192 every epic ships with the instrumentation that proves its hypothesis.",
      "Value is owned by the business \u2192 a benefit with no business owner is not a benefit.",
      "Draft with AI, decide as humans \u2192 the agent assembles; the PM sets the RAG and signs.",
      "Stewardship over speed-at-any-cost \u2192 we leave the codebase, the data and the team better than we found them."],
    note: "Each line names what you'll actually do differently. A principle you never have to act on isn't one." },
  pain: { title: "Pain points — examples to prompt the conversation",
    items: ["Status reporting eats Friday afternoons; the same numbers get retyped into three tools.",
      "Decisions get made in meetings but aren't logged, so we relitigate them a month later.",
      "Adoption is treated as a comms afterthought instead of designed in from G2.",
      "Vendor dependencies surface as surprises at the SteerCo, not as tracked risks.",
      "Every PM formats their deck differently; leadership can't compare projects at a glance.",
      "We discover data-access blockers only when we try to build, not when we plan."],
    note: "Name the cost, not just the symptom. Then give it an owner and a countermeasure \u2014 several of these can become app ideas." },
  wow: { title: "Ways of working — examples",
    items: ["Cadence: biweekly delivery sync (Tue 30 min), monthly portfolio review, retro every 4 weeks.",
      "Comms: decisions in the Decision Log within 24h; Teams for async, no status by email.",
      "Definition of Done: merged + instrumented + page updated + benefit line touched.",
      "Escalation: a blocker older than one cycle goes to the SteerCo with 2-3 costed options.",
      "AI use: the Advisor drafts status and risk scans; the PM reviews every line before it leaves the team.",
      "1:1s: monthly, agenda owned by the PM, health-scan trend reviewed together."],
    note: "Make the implicit explicit so a new joiner is productive in a week. Keep each agreement testable." },
  learn: { title: "Training & best practice — examples",
    items: ["Training: eval discipline \u2014 how to review an AI draft well (whole team, this quarter).",
      "Training: CPMAI lifecycle for AI projects \u2014 data understanding before modelling.",
      "Training: stakeholder craft \u2014 turning a sceptic into a supporter.",
      "Best practice: shadow five real users before writing a single comms (from Field Excellence).",
      "Best practice: re-sequence around the dependency, don't push the date (from Insight Assistant).",
      "Best practice: bring options + a recommendation to every escalation, never the problem alone."],
    note: "Promote the durable best practices into Playbook patterns at the quarterly Framework Council." },
  prioritise: { title: "Prioritisation canvas — how to run it",
    items: ["Put each candidate (initiative or app idea) on the wall, then drag for value (up) and effort (right).",
      "Do First = high value, low effort: commit this quarter.",
      "Plan / Big bets = high value, high effort: needs a business case (T02).",
      "Quick fillers = low value, low effort: only when there's slack.",
      "Avoid = low value, high effort: say no out loud and move on."],
    note: "The number in each bubble is value \u00f7 effort (a WSJF proxy). Drag as a team \u2014 the disagreement is the value of the session." },
  ideas: { title: "App backlog — example improvements",
    items: ["Two-way sync with JIRA & Smartsheet via the corporate connectors.",
      "AG-01 pre-fills the weekly status from systems of record overnight.",
      "Portfolio-level dependency alerts when two projects' go-lives hit the same user group.",
      "A 'what changed since last review' digest for the Portfolio Review.",
      "Capacity what-if: simulate moving a PM and see the load + budget impact."],
    note: "This is the Navigator's own product backlog \u2014 dogfood the doctrine: prioritise it on the canvas, ship the top items." },
  log: { title: "Decision log — what to capture",
    items: ["Agreed the North Star and three leading metrics (2026-Q3).",
      "Adopted 'no telemetry, no Done' as a hard gate from next sprint.",
      "Decided to pilot the Advisor for status drafts with 3 PMs for one cycle.",
      "Retired the weekly email status in favour of the Review Pack."],
    note: "The audit trail of how the team's operating agreement evolved. Decisions, resolved pains and ideas raised all land here." },
};
function InspireDot({ topic, onUse }) {
  const [open, setOpen] = useState(false);
  const ex = CHARTER_EXAMPLES[topic];
  if (!ex) return null;
  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      <button onClick={() => setOpen(o => !o)} title="Examples for inspiration"
        style={{ width: 19, height: 19, borderRadius: "50%", border: `1.5px solid ${C.gold}`, background: open ? C.gold : "#fff", color: open ? "#fff" : "#8A6200", fontFamily: DISP, fontWeight: 800, fontSize: 12, lineHeight: 1, cursor: "pointer", padding: 0, verticalAlign: "middle" }}>?</button>
      {open && (
        <>
          <span onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
          <div style={{ position: "absolute", top: 26, left: 0, zIndex: 41, width: "min(420px, 80vw)", background: "#fff", border: `1px solid ${C.line}`, borderRadius: 12, boxShadow: "0 14px 40px rgba(0,0,0,.22)", padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontFamily: DISP, fontWeight: 800, fontSize: 13, color: "#8A6200" }}>{ex.title}</span>
              <button onClick={() => setOpen(false)} style={{ marginLeft: "auto", border: "none", background: "transparent", color: C.faint, cursor: "pointer", fontSize: 14 }}>\u00d7</button>
            </div>
            {ex.items.map((t, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "6px 0", borderTop: i ? `1px solid ${C.soft}` : "none" }}>
                <span style={{ color: C.gold, fontWeight: 700, fontSize: 13, lineHeight: 1.5 }}>\u2022</span>
                <span style={{ fontSize: 12.5, lineHeight: 1.5, color: C.ink, flex: 1 }}>{t}</span>
                {onUse && <button onClick={() => { onUse(t); setOpen(false); }} title="Use this" style={{ border: `1px solid ${C.mul}`, color: C.mul, background: "#fff", borderRadius: 6, padding: "2px 8px", fontSize: 10.5, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>use</button>}
              </div>
            ))}
            <div style={{ fontSize: 11, color: C.mid, marginTop: 8, fontStyle: "italic", borderTop: `1px solid ${C.soft}`, paddingTop: 8 }}>{ex.note}</div>
          </div>
        </>
      )}
    </span>
  );
}
function TeamCharter({ charter, setCharter, people }) {
  const c = { ...CHARTER_DEFAULT, ...(charter || {}) };
  const [sub, setSub] = useState("north");
  const set = patch => setCharter({ ...c, ...patch });
  const addTo = (k, row) => set({ [k]: [...(c[k] || []), { id: uid(), ...row }] });
  const editIn = (k, id, patch) => set({ [k]: c[k].map(r => r.id === id ? { ...r, ...patch } : r) });
  const delIn = (k, id) => set({ [k]: c[k].filter(r => r.id !== id) });
  const logEvent = (text, tag) => set({ log: [...(c.log || []), { id: uid(), date: today(), ts: Date.now(), text, tag }] });

  const SUBS = [["north", "North Star"], ["principles", "Principles"], ["pain", "Pain points"], ["wow", "Ways of working"], ["learn", "Training & best practice"], ["prioritise", "Prioritisation canvas"], ["ideas", "App backlog"], ["log", "Decision log"]];
  const Line = ({ k, row, fields, accent = C.mul }) => (
    <div style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center", flexWrap: "wrap" }}>
      {fields.map(f => f.type === "select"
        ? <select key={f.key} value={row[f.key] || f.opts[0]} onChange={e => editIn(k, row.id, { [f.key]: e.target.value })} style={{ border: `1px solid ${C.soft}`, borderRadius: 7, padding: "6px", fontSize: 11.5 }}>{f.opts.map(o => <option key={o}>{o}</option>)}</select>
        : <input key={f.key} value={row[f.key] || ""} onChange={e => editIn(k, row.id, { [f.key]: e.target.value })} placeholder={f.ph} style={{ flex: f.w ? `0 0 ${f.w}px` : 1, minWidth: 90, border: `1px solid ${C.soft}`, background: "#FBFAF8", borderRadius: 7, padding: "7px 9px", fontSize: 12 }} />)}
      <button onClick={() => delIn(k, row.id)} style={{ border: "none", background: "transparent", color: C.faint, cursor: "pointer" }}>×</button>
    </div>
  );
  const AddBtn = ({ k, row, label, color = C.mul }) => (
    <button onClick={() => addTo(k, row)} style={{ border: `1px dashed ${C.line}`, background: "#fff", color, borderRadius: 8, padding: "8px 14px", fontSize: 12.5, cursor: "pointer", fontWeight: 600, fontFamily: DISP }}>{label}</button>
  );

  return (
    <div>
      <Card style={{ marginBottom: 14 }}>
        <div style={{ fontFamily: DISP, fontWeight: 800, fontSize: 18 }}>Team Charter — the team's operating agreement</div>
        <div style={{ fontSize: 12.5, color: C.mid }}>The living document the Director and the PM team shape together: where we're heading, what we believe, what hurts, how we work, how we grow — and how this very app should evolve. Everything here persists, exports with your JSON backup, and writes to the decision log. This is the seed of the next version of the Navigator.</div>
      </Card>
      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {SUBS.map(([id, l]) => (
          <button key={id} onClick={() => setSub(id)} style={{ border: `1px solid ${sub === id ? C.mul : C.line}`, background: sub === id ? C.mul : "#fff", color: sub === id ? "#fff" : C.mid, borderRadius: 99, padding: "8px 14px", fontFamily: DISP, fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>{l}</button>
        ))}
      </div>

      {sub === "north" && (
        <div>
          <Card style={{ marginBottom: 12, borderTop: `3px solid ${C.gold}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}><SectionLabel color={"#8A6200"}>North Star — the one sentence everything serves</SectionLabel><InspireDot topic="north" onUse={t => set({ northStar: t })} /></div>
            <textarea value={c.northStar} onChange={e => set({ northStar: e.target.value })} rows={2} placeholder="e.g. Every OBU data & AI initiative delivers measurable value with governance the business trusts — faster than last year, and visibly."
              style={{ width: "100%", border: `1px solid ${C.soft}`, background: "#FBFAF8", borderRadius: 8, padding: "10px 12px", fontSize: 15, lineHeight: 1.5, fontFamily: DISP, fontWeight: 600, color: C.ink }} />
          </Card>
          <Card>
            <SectionLabel>How we'll know we're moving toward it — leading metrics</SectionLabel>
            {(c.northMetrics || []).map(r => <Line key={r.id} k="northMetrics" row={r} fields={[{ key: "name", ph: "Metric (e.g. cycle time idea→pilot, % benefits with owner)" }, { key: "baseline", ph: "baseline", w: 110 }, { key: "target", ph: "target", w: 110 }]} />)}
            <AddBtn k="northMetrics" row={{ name: "", baseline: "", target: "" }} label="+ metric" />
          </Card>
        </div>
      )}

      {sub === "principles" && (
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}><SectionLabel>Principles — what we hold true even when it's inconvenient</SectionLabel><InspireDot topic="principles" onUse={t => { const [b, ...rest] = t.split(" → "); addTo("principles", { belief: b, consequence: rest.join(" → ") }); }} /></div>
          <div style={{ fontSize: 12, color: C.faint, marginBottom: 10 }}>Each principle pairs a belief with its consequence — a principle you never have to act on isn't one. Examples seeded from DCOS: "Honest ambers over green theatre — we surface bad news early and bring options."</div>
          {(c.principles || []).map((r, i) => (
            <div key={r.id} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
              <span style={{ fontFamily: MONO, fontSize: 11, color: C.mul, fontWeight: 700, marginTop: 8 }}>{String(i + 1).padStart(2, "0")}</span>
              <div style={{ flex: 1, display: "flex", gap: 6, flexWrap: "wrap" }}>
                <input value={r.belief || ""} onChange={e => editIn("principles", r.id, { belief: e.target.value })} placeholder="We believe…" style={{ flex: "1 1 220px", border: `1px solid ${C.soft}`, background: "#FBFAF8", borderRadius: 7, padding: "8px 10px", fontSize: 12.5, fontWeight: 600 }} />
                <input value={r.consequence || ""} onChange={e => editIn("principles", r.id, { consequence: e.target.value })} placeholder="…so we always / never…" style={{ flex: "1 1 220px", border: `1px solid ${C.soft}`, background: "#FBFAF8", borderRadius: 7, padding: "8px 10px", fontSize: 12.5 }} />
              </div>
              <button onClick={() => delIn("principles", r.id)} style={{ border: "none", background: "transparent", color: C.faint, cursor: "pointer", marginTop: 6 }}>×</button>
            </div>
          ))}
          <AddBtn k="principles" row={{ belief: "", consequence: "" }} label="+ principle" />
        </Card>
      )}

      {sub === "pain" && (
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}><SectionLabel color={C.red}>Pain points — name them to fix them</SectionLabel><InspireDot topic="pain" onUse={t => addTo("painPoints", { text: t, status: "open" })} /></div>
          <div style={{ fontSize: 12, color: C.faint, marginBottom: 10 }}>Raised in retros and 1:1s; tracked to resolution. A pain point with no owner is just a complaint.</div>
          {(c.painPoints || []).map(r => (
            <div key={r.id} style={{ borderLeft: `3px solid ${(PAIN_STATUS[r.status] || PAIN_STATUS.open)[2]}`, background: "#FBFAF8", borderRadius: "0 8px 8px 0", padding: "8px 12px", marginBottom: 8 }}>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                <input value={r.text || ""} onChange={e => editIn("painPoints", r.id, { text: e.target.value })} placeholder="The pain — concrete, with the cost it imposes" style={{ flex: 1, minWidth: 220, border: `1px solid ${C.soft}`, background: "#fff", borderRadius: 7, padding: "7px 9px", fontSize: 12.5 }} />
                <select value={r.status || "open"} onChange={e => { editIn("painPoints", r.id, { status: e.target.value }); if (e.target.value === "resolved") logEvent(`Pain point resolved: ${(r.text || "").slice(0, 70)}`, "pain"); }} style={{ border: `1px solid ${C.soft}`, borderRadius: 7, padding: "6px", fontSize: 11.5 }}>{Object.keys(PAIN_STATUS).map(s => <option key={s}>{s}</option>)}</select>
                <button onClick={() => delIn("painPoints", r.id)} style={{ border: "none", background: "transparent", color: C.faint, cursor: "pointer" }}>×</button>
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                <input value={r.owner || ""} onChange={e => editIn("painPoints", r.id, { owner: e.target.value })} placeholder="Owner" style={{ flex: "0 0 150px", border: `1px solid ${C.soft}`, background: "#fff", borderRadius: 7, padding: "6px 9px", fontSize: 12 }} />
                <input value={r.fix || ""} onChange={e => editIn("painPoints", r.id, { fix: e.target.value })} placeholder="Countermeasure / experiment → could become an app idea" style={{ flex: 1, minWidth: 180, border: `1px solid ${C.soft}`, background: "#fff", borderRadius: 7, padding: "6px 9px", fontSize: 12 }} />
                <button onClick={() => { addTo("appIdeas", { text: r.fix || r.text, value: 3, effort: 2, from: "pain point" }); logEvent(`App idea raised from pain point: ${(r.text || "").slice(0, 60)}`, "idea"); }} title="Promote to App backlog" style={{ border: `1px solid ${C.navy}`, color: C.navy, background: "#fff", borderRadius: 7, padding: "6px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>→ app idea</button>
              </div>
            </div>
          ))}
          <AddBtn k="painPoints" row={{ text: "", owner: "", fix: "", status: "open" }} label="+ pain point" color={C.red} />
        </Card>
      )}

      {sub === "wow" && (
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}><SectionLabel color={C.navy}>Ways of working — the team's explicit agreements</SectionLabel><InspireDot topic="wow" onUse={t => { const [a, ...rest] = t.split(": "); addTo("wow", { area: a, agreement: rest.join(": ") }); }} /></div>
          <div style={{ fontSize: 12, color: C.faint, marginBottom: 10 }}>Cadence, channels, definition of done, how we escalate, how we use the Advisor and review its drafts. Make the implicit explicit so a new joiner is productive in a week.</div>
          {(c.wow || []).map(r => <Line key={r.id} k="wow" row={r} fields={[{ key: "area", ph: "Area (cadence, comms, DoD, escalation, AI use…)", w: 220 }, { key: "agreement", ph: "Our agreement — specific and testable" }]} accent={C.navy} />)}
          <AddBtn k="wow" row={{ area: "", agreement: "" }} label="+ agreement" color={C.navy} />
        </Card>
      )}

      {sub === "learn" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 14 }}>
          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}><SectionLabel color={"#8A6200"}>Training plan — capability we're building</SectionLabel><InspireDot topic="learn" onUse={t => addTo("training", { topic: t.replace(/^(Training|Best practice): /, ""), status: "planned" })} /></div>
            {(c.training || []).map(r => <Line key={r.id} k="training" row={r} fields={[{ key: "topic", ph: "Topic (e.g. eval discipline, CPMAI, stakeholder craft)" }, { key: "who", ph: "who", w: 110 }, { key: "when", ph: "when", w: 90 }, { key: "status", type: "select", opts: ["planned", "in progress", "done"] }]} />)}
            <AddBtn k="training" row={{ topic: "", who: "", when: "", status: "planned" }} label="+ training" color={"#8A6200"} />
            <div style={{ fontSize: 11, color: C.faint, marginTop: 8 }}>Links to the Academy (Resources): L1 Foundation → L2 Practitioner → L3 Coach.</div>
          </Card>
          <Card>
            <SectionLabel color={C.lime}>Best practices — what worked, captured before we forget</SectionLabel>
            {(c.bestPractice || []).map(r => <Line key={r.id} k="bestPractice" row={r} fields={[{ key: "text", ph: "The practice — and the evidence it works" }, { key: "source", ph: "from (project/retro)", w: 130 }]} accent={C.lime} />)}
            <AddBtn k="bestPractice" row={{ text: "", source: "" }} label="+ best practice" color={C.lime} />
            <div style={{ fontSize: 11, color: C.faint, marginTop: 8 }}>Promote the durable ones into the Playbook patterns at the quarterly Framework Council.</div>
          </Card>
        </div>
      )}

      {sub === "prioritise" && <PrioritiseCanvas c={c} set={set} addTo={addTo} editIn={editIn} delIn={delIn} logEvent={logEvent} />}

      {sub === "ideas" && (
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}><SectionLabel color={C.navy}>App backlog — how the Navigator itself should evolve</SectionLabel><InspireDot topic="ideas" onUse={t => addTo("appIdeas", { text: t, value: 3, effort: 2 })} /></div>
          <div style={{ fontSize: 12, color: C.faint, marginBottom: 10 }}>The team's own product backlog for this tool. Ideas flow in from pain points; the prioritisation canvas ranks them; the top ones become the next version. Dogfooding the doctrine on ourselves.</div>
          {(c.appIdeas || []).map(r => (
            <div key={r.id} style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center", flexWrap: "wrap" }}>
              <input value={r.text || ""} onChange={e => editIn("appIdeas", r.id, { text: e.target.value })} placeholder="Idea / improvement for the Navigator" style={{ flex: 1, minWidth: 220, border: `1px solid ${C.soft}`, background: "#FBFAF8", borderRadius: 7, padding: "7px 9px", fontSize: 12.5 }} />
              {r.from && <Chip bg={C.soft} color={C.faint}>{r.from}</Chip>}
              <label style={{ fontSize: 10.5, color: C.faint }}>value <input type="number" min={1} max={5} value={r.value || 3} onChange={e => editIn("appIdeas", r.id, { value: +e.target.value })} style={{ width: 46, border: `1px solid ${C.soft}`, background: "#FBFAF8", borderRadius: 6, padding: "5px", fontSize: 11.5, fontFamily: MONO }} /></label>
              <label style={{ fontSize: 10.5, color: C.faint }}>effort <input type="number" min={1} max={5} value={r.effort || 2} onChange={e => editIn("appIdeas", r.id, { effort: +e.target.value })} style={{ width: 46, border: `1px solid ${C.soft}`, background: "#FBFAF8", borderRadius: 6, padding: "5px", fontSize: 11.5, fontFamily: MONO }} /></label>
              <button onClick={() => delIn("appIdeas", r.id)} style={{ border: "none", background: "transparent", color: C.faint, cursor: "pointer" }}>×</button>
            </div>
          ))}
          <AddBtn k="appIdeas" row={{ text: "", value: 3, effort: 2 }} label="+ app idea" color={C.navy} />
        </Card>
      )}

      {sub === "log" && (
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}><SectionLabel>Decision & evolution log</SectionLabel><InspireDot topic="log" onUse={t => logEvent(t, "decision")} /></div>
          <div style={{ fontSize: 12, color: C.faint, marginBottom: 10 }}>The audit trail of how the team's operating agreement evolved — decisions, resolved pains, ideas raised. Add a manual entry, or let actions here log themselves.</div>
          <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
            <input id="logIn" placeholder="Decision the team took today…" onKeyDown={e => { if (e.key === "Enter" && e.target.value.trim()) { logEvent(e.target.value.trim(), "decision"); e.target.value = ""; } }} style={{ flex: 1, minWidth: 240, border: `1px solid ${C.line}`, borderRadius: 8, padding: "9px 12px", fontSize: 13 }} />
            <span style={{ fontSize: 11, color: C.faint, alignSelf: "center" }}>Enter to log</span>
          </div>
          {[...(c.log || [])].reverse().map(e => (
            <div key={e.id} style={{ display: "flex", gap: 10, alignItems: "baseline", padding: "8px 0", borderTop: `1px solid ${C.soft}` }}>
              <span style={{ fontFamily: MONO, fontSize: 10.5, color: C.faint, minWidth: 78 }}>{e.date}</span>
              <Chip bg={e.tag === "decision" ? C.mulLt : e.tag === "pain" ? C.limeLt : C.navyLt} color={e.tag === "decision" ? C.mul : e.tag === "pain" ? C.lime : C.navy}>{e.tag}</Chip>
              <span style={{ flex: 1, fontSize: 12.5 }}>{e.text}</span>
              <button onClick={() => delIn("log", e.id)} style={{ border: "none", background: "transparent", color: C.faint, cursor: "pointer" }}>×</button>
            </div>
          ))}
          {(!c.log || c.log.length === 0) && <div style={{ fontSize: 12.5, color: C.faint }}>No entries yet.</div>}
        </Card>
      )}
    </div>
  );
}

function PrioritiseCanvas({ c, set, addTo, editIn, delIn, logEvent }) {
  const items = c.priorities || [];
  const [drag, setDrag] = useState(null);
  const [live, setLive] = useState(null);
  const W2 = 1000, H2 = 520, pad = 44;
  const X = v => pad + (v / 100) * (W2 - 2 * pad);
  const Y = v => H2 - pad - (v / 100) * (H2 - 2 * pad);
  const pos = it => (live && live.id === it.id) ? live : it;
  const onMove = e => { if (!drag) return; const r = e.currentTarget.getBoundingClientRect(); setLive({ id: drag.id, ex: Math.min(Math.max((e.clientX - r.left - pad) / (W2 - 2 * pad) * 100, 0), 100), ey: Math.min(Math.max((1 - (e.clientY - r.top - pad) / (H2 - 2 * pad)) * 100, 0), 100) }); };
  const onUp = () => { if (drag && live && live.id === drag.id) editIn("priorities", drag.id, { ex: Math.round(live.ex), ey: Math.round(live.ey) }); setDrag(null); setLive(null); };
  const wsjf = it => ((it.ey || 50) / Math.max((it.effort || 3), 1)).toFixed(1);
  const ranked = [...items].sort((a, b) => wsjf(b) - wsjf(a));
  return (
    <div>
      <Card style={{ marginBottom: 12, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <SectionLabel>Prioritisation canvas — value vs effort, dragged by the team</SectionLabel><InspireDot topic="prioritise" />
        <button onClick={() => addTo("priorities", { text: "New item", ex: 30, ey: 70, effort: 3 })} style={{ marginLeft: "auto", background: C.mul, color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", fontFamily: DISP, fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>+ item</button>
        <button onClick={() => { (c.appIdeas || []).forEach(i => { if (!items.some(p => p.srcId === i.id)) addTo("priorities", { text: i.text, ex: (i.effort || 2) / 5 * 60 + 10, ey: (i.value || 3) / 5 * 70 + 15, effort: i.effort || 2, srcId: i.id }); }); }} style={{ border: `1px solid ${C.navy}`, color: C.navy, background: "#fff", borderRadius: 8, padding: "8px 14px", fontFamily: DISP, fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>pull app ideas ↓</button>
      </Card>
      <Card style={{ padding: 0, overflowX: "auto" }}>
        <svg viewBox={`0 0 ${W2} ${H2}`} style={{ width: "100%", minWidth: 680, touchAction: "none" }} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp}>
          <line x1={W2 / 2} y1={pad} x2={W2 / 2} y2={H2 - pad} stroke={C.line} strokeDasharray="4 4" />
          <line x1={pad} y1={H2 / 2} x2={W2 - pad} y2={H2 / 2} stroke={C.line} strokeDasharray="4 4" />
          {[["DO FIRST", pad + 8, pad + 16, C.lime], ["PLAN / BIG BETS", W2 / 2 + 8, pad + 16, C.navy], ["QUICK FILLERS", pad + 8, H2 - pad - 6, "#8A6200"], ["AVOID", W2 / 2 + 8, H2 - pad - 6, C.red]].map(([t, x, y, col]) => <text key={t} x={x} y={y} fontSize="11" fontFamily={MONO} fill={col} fontWeight="700">{t}</text>)}
          <text x={W2 / 2} y={H2 - 12} textAnchor="middle" fontSize="10" fontFamily={MONO} fill={C.faint}>EFFORT →</text>
          <text x={14} y={H2 / 2} textAnchor="middle" fontSize="10" fontFamily={MONO} fill={C.faint} transform={`rotate(-90 14 ${H2 / 2})`}>VALUE →</text>
          {items.map(it => { const p = pos(it); const x = X(p.ex ?? 50), y = Y(p.ey ?? 50); return (
            <g key={it.id} onPointerDown={e => { setDrag({ id: it.id }); }} style={{ cursor: "grab" }}>
              <circle cx={x} cy={y} r={13} fill={C.mul} opacity={0.9} />
              <text x={x} y={y + 4} textAnchor="middle" fontSize="9" fill="#fff" fontFamily={MONO} fontWeight="700">{wsjf(it)}</text>
              <text x={x + 17} y={y + 4} fontSize="11" fill={C.ink} fontFamily={BODY}>{(it.text || "").slice(0, 30)}</text>
            </g>
          ); })}
        </svg>
      </Card>
      <Card style={{ marginTop: 12 }}>
        <SectionLabel color={C.navy}>Ranked (value ÷ effort) — the team's agreed order</SectionLabel>
        {ranked.map((it, i) => (
          <div key={it.id} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
            <span style={{ fontFamily: MONO, fontSize: 11, color: "#8A6200", fontWeight: 700, minWidth: 20 }}>{i + 1}</span>
            <input value={it.text || ""} onChange={e => editIn("priorities", it.id, { text: e.target.value })} style={{ flex: 1, minWidth: 200, border: `1px solid ${C.soft}`, background: "#FBFAF8", borderRadius: 7, padding: "7px 9px", fontSize: 12.5 }} />
            <label style={{ fontSize: 10.5, color: C.faint }}>effort <input type="number" min={1} max={5} value={it.effort || 3} onChange={e => editIn("priorities", it.id, { effort: +e.target.value })} style={{ width: 44, border: `1px solid ${C.soft}`, background: "#FBFAF8", borderRadius: 6, padding: "5px", fontSize: 11.5, fontFamily: MONO }} /></label>
            <Chip bg={C.mulLt} color={C.mul}>WSJF {wsjf(it)}</Chip>
            <button onClick={() => delIn("priorities", it.id)} style={{ border: "none", background: "transparent", color: C.faint, cursor: "pointer" }}>×</button>
          </div>
        ))}
        {items.length === 0 && <div style={{ fontSize: 12.5, color: C.faint }}>Add items or pull the app ideas in — then drag them on the canvas to agree value and effort as a team.</div>}
      </Card>
    </div>
  );
}
