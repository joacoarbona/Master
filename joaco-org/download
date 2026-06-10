import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, FileText, Database, GitBranch, Layers, Users, Zap, ChevronRight, Sparkles, ArrowUpRight, Circle, CheckCircle2, Clock, AlertCircle, TrendingUp, Network, Filter, Download, Send, Eye, Code2, FolderGit2, Cloud, BookOpen, Target, Activity, Command, Compass, FlaskConical, Factory, Megaphone, Cpu, Briefcase, Lock, Globe, Shield, ArrowRight, ArrowLeft, X, MapPin, Grid3x3, Link2, Copy, Hexagon } from 'lucide-react';

// ============================================================================
// ATLAS — Enterprise-wide portfolio intelligence for AstraZeneca
// Primary persona: Portfolio / Strategy Leader
// Emphasized pillars: Project Intelligence + Reuse & Connection
// ============================================================================

const FUNCTIONS = {
  rd: { label: 'R&D', icon: FlaskConical, color: '#D0006F' },
  clinical: { label: 'Clinical', icon: Activity, color: '#B8336A' },
  mfg: { label: 'Manufacturing & Supply', icon: Factory, color: '#C87941' },
  commercial: { label: 'Commercial', icon: Megaphone, color: '#4A7C59' },
  medical: { label: 'Medical', icon: BookOpen, color: '#6B4E7D' },
  it: { label: 'IT & Digital', icon: Cpu, color: '#3A6B8C' },
  enabling: { label: 'Enabling Fns', icon: Briefcase, color: '#8C6D3A' },
  sustain: { label: 'Sustainability', icon: Globe, color: '#2E7D5F' },
};

const SOURCE_TIERS = {
  tier1: {
    label: 'Collaboration & Knowledge',
    sources: [
      { id: 'sharepoint', label: 'SharePoint', pointer: 'https://astrazeneca.sharepoint.com/sites/{site}/', connector: 'Graph API → RAGify' },
      { id: 'confluence', label: 'Confluence', pointer: 'https://confluence.az.net/spaces/{key}/', connector: 'Atlassian REST → RAGify' },
      { id: 'teams', label: 'Teams / OneDrive', pointer: 'graph://teams/{channel}/', connector: 'Graph API (delta queries)' },
    ],
  },
  tier2: {
    label: 'Execution Systems',
    sources: [
      { id: 'jira', label: 'Jira / ADO', pointer: 'jira://{project}/{key}', connector: 'Jira Cloud REST' },
      { id: 'ppm', label: 'Planisware / Clarity', pointer: 'ppm://projects/{id}', connector: 'PPM REST API nightly sync' },
      { id: 'snow', label: 'ServiceNow', pointer: 'snow://table/{id}', connector: 'Table API (scoped)' },
    ],
  },
  tier3: {
    label: 'Systems of Record (GxP / Finance)',
    sources: [
      { id: 'veeva', label: 'Veeva Vault', pointer: 'veeva://{vault}/docs/{id}', connector: 'Veeva API · ACL-aware' },
      { id: 'sap', label: 'SAP (Fin / Supply)', pointer: 'sap://{module}/{obj}', connector: 'OData services' },
      { id: 'sfdc', label: 'Salesforce', pointer: 'sfdc://{object}/{id}', connector: 'Bulk API 2.0' },
      { id: 'workday', label: 'Workday', pointer: 'workday://{worker}', connector: 'REST API (scoped fields)' },
    ],
  },
  tier4: {
    label: 'Data & Code Platforms',
    sources: [
      { id: 's3', label: 'AWS S3', pointer: 's3://az-{domain}/{project}/', connector: 'S3 events → ingestion' },
      { id: 'github', label: 'GitHub Enterprise', pointer: 'github://az-{org}/{repo}', connector: 'GraphQL + tree-sitter chunking' },
      { id: 'foundry', label: 'Palantir Foundry', pointer: 'foundry://datasets/{rid}', connector: 'Foundry REST' },
      { id: 'dbx', label: 'Databricks / Snowflake', pointer: 'dbx://{catalog}/{schema}/{table}', connector: 'Unity Catalog lineage' },
    ],
  },
  graphs: {
    label: 'Knowledge Graphs',
    sources: [
      { id: 'bikg', label: 'BIKG', pointer: 'bikg://graph/{entity}', connector: 'SPARQL endpoint' },
      { id: 'epg', label: 'Enterprise Project Graph', pointer: 'epg://node/{id}', connector: 'Neo4j · built by Atlas over time' },
    ],
  },
};

const PROJECTS = [
  {
    id: 'RD-2247',
    name: 'Phase 3 ADAURA-2 Trial Expansion',
    function: 'clinical',
    crossFn: ['rd', 'medical'],
    ta: 'Oncology · NSCLC',
    geo: 'Global · 34 countries',
    stage: 'Execute',
    lifecycle: 'Phase 3',
    health: 'green',
    spend: '€187M',
    sponsor: 'Susan Galbraith',
    nextGate: 'Interim analysis · 2026-09',
    scores: { strategic: 96, execution: 84, risk: 72, reuse: 58 },
    summary: 'Expanded adjuvant Tagrisso trial across NSCLC subtypes following ADAURA readout momentum.',
  },
  {
    id: 'MFG-0918',
    name: 'Södertälje CLT Plant Modernization',
    function: 'mfg',
    crossFn: ['sustain', 'enabling'],
    ta: 'Cross-TA',
    geo: 'Sweden',
    stage: 'Build',
    lifecycle: 'CapEx Tranche 2',
    health: 'amber',
    spend: '€340M',
    sponsor: 'Pam Cheng',
    nextGate: 'Qualification start · 2026-Q3',
    scores: { strategic: 88, execution: 71, risk: 54, reuse: 46 },
    summary: 'Modernization of Södertälje solid-dose facility including cross-laminated timber warehouse and net-zero heat loop.',
  },
  {
    id: 'COM-3305',
    name: 'Voydeya Launch — EU5 + Japan',
    function: 'commercial',
    crossFn: ['medical', 'mfg'],
    ta: 'Rare Disease · PNH',
    geo: 'EU5 + Japan',
    stage: 'Launch',
    lifecycle: 'Pre-launch T-6mo',
    health: 'green',
    spend: '€92M',
    sponsor: 'Ruud Dobber',
    nextGate: 'EU reimbursement dossiers · 2026-05',
    scores: { strategic: 91, execution: 88, risk: 67, reuse: 79 },
    summary: 'Commercial launch preparation for Voydeya (danicopan) add-on therapy across EU5 and Japan post-approval.',
  },
  {
    id: 'IT-1184',
    name: 'Veeva RIM to Veeva Vault R2 Migration',
    function: 'it',
    crossFn: ['clinical', 'enabling'],
    ta: 'Cross-TA',
    geo: 'Global',
    stage: 'Build',
    lifecycle: 'Program Year 2 of 3',
    health: 'amber',
    spend: '€28M',
    sponsor: 'Cindy Hoots',
    nextGate: 'Wave 2 cutover · 2026-06',
    scores: { strategic: 78, execution: 74, risk: 61, reuse: 85 },
    summary: 'Regulatory Information Management platform migration with data model modernization and workflow redesign.',
  },
  {
    id: 'RD-2108',
    name: 'Oncology Biomarker Discovery Platform',
    function: 'rd',
    crossFn: ['it'],
    ta: 'Oncology',
    geo: 'Gaithersburg · Cambridge',
    stage: 'Scale',
    lifecycle: 'Platform v2',
    health: 'green',
    spend: '€44M',
    sponsor: 'Cristian Massacesi',
    nextGate: 'Platform v2 GA · 2026-07',
    scores: { strategic: 94, execution: 86, risk: 58, reuse: 92 },
    summary: 'ML-powered biomarker discovery platform supporting patient stratification across the oncology pipeline.',
  },
  {
    id: 'ENB-0442',
    name: 'Finance ERP Harmonization — Wave 3',
    function: 'enabling',
    crossFn: ['it'],
    ta: 'Cross-TA',
    geo: 'APAC + LATAM',
    stage: 'Execute',
    lifecycle: 'Wave 3 of 4',
    health: 'red',
    spend: '€71M',
    sponsor: 'Aradhana Sarin',
    nextGate: 'APAC go-live · 2026-05',
    scores: { strategic: 82, execution: 54, risk: 38, reuse: 68 },
    summary: 'S/4HANA consolidation across APAC and LATAM markets following successful EU and NA waves.',
  },
  {
    id: 'MED-1770',
    name: 'Real-World Evidence Platform — Cardiorenal',
    function: 'medical',
    crossFn: ['rd', 'it'],
    ta: 'CVRM',
    geo: 'US · EU5',
    stage: 'Build',
    lifecycle: 'MVP → Scale',
    health: 'green',
    spend: '€19M',
    sponsor: 'Sharon Barr',
    nextGate: 'Publication-ready cohort · 2026-08',
    scores: { strategic: 87, execution: 81, risk: 69, reuse: 88 },
    summary: 'RWE generation platform for Farxiga and Forxiga label-expansion evidence using federated claims + EHR data.',
  },
  {
    id: 'SUS-0231',
    name: 'Scope 3 Emissions Data Lake',
    function: 'sustain',
    crossFn: ['mfg', 'enabling'],
    ta: 'Cross-TA',
    geo: 'Global',
    stage: 'Discovery',
    lifecycle: 'Architecture Phase',
    health: 'amber',
    spend: '€8M',
    sponsor: 'Katarina Ageborg',
    nextGate: 'Vendor onboarding framework · 2026-04',
    scores: { strategic: 76, execution: 62, risk: 71, reuse: 74 },
    summary: 'Supplier-level emissions data aggregation to support Ambition Zero Carbon 2030 reporting.',
  },
];

const DEEP_BRIEF = {
  projectId: 'RD-2247',
  charter: {
    objective: 'Expand the ADAURA trial franchise to evaluate adjuvant Tagrisso across underserved NSCLC subtypes, reinforcing AstraZeneca\'s leadership in resectable lung cancer.',
    scope: 'Four new cohorts across early-stage NSCLC · 34 countries · ~1,100 patients · 3-year primary endpoint.',
    successCriteria: ['DFS HR ≤ 0.55 vs. placebo', 'First patient in by Q2 2026', 'First readout by Q4 2028'],
  },
  status: {
    overall: 'On track',
    milestones: [
      { name: 'Protocol finalization', status: 'done', date: '2025-11' },
      { name: 'Regulatory submissions (34 countries)', status: 'done', date: '2026-01' },
      { name: 'First patient in', status: 'active', date: '2026-05' },
      { name: 'Interim analysis', status: 'pending', date: '2026-09' },
      { name: 'Primary readout', status: 'pending', date: '2028-Q4' },
    ],
    risks: [
      { level: 'high', text: 'Site activation in 4 LATAM countries behind plan due to IRB cycle times' },
      { level: 'medium', text: 'Central lab capacity tight during Q3-Q4 2026 overlap with ADAURA-1 follow-up' },
      { level: 'low', text: 'Digital endpoint wearable supply chain — mitigated via dual-source agreement' },
    ],
  },
  stakeholders: [
    { name: 'Susan Galbraith', role: 'EVP Oncology R&D', type: 'sponsor' },
    { name: 'Cristian Massacesi', role: 'CMO Oncology', type: 'sponsor' },
    { name: 'Dave Fredrickson', role: 'EVP Oncology Business Unit', type: 'consumer' },
    { name: 'Pam Cheng', role: 'EVP Operations & IT', type: 'enabler' },
  ],
  financials: {
    approvedBudget: '€187M',
    committed: '€94M',
    spentToDate: '€38M',
    varianceFlag: 'within-tolerance',
  },
};

const REUSE_FINDINGS = [
  {
    id: 'RU-01',
    origin: 'RD-2108 · Biomarker Discovery Platform',
    asset: 'Patient stratification feature pipeline',
    type: 'Data pipeline',
    applicability: ['RD-2247 ADAURA-2', 'MED-1770 RWE Cardiorenal'],
    maturity: 'Production',
    timeSaved: '6–9 weeks',
    confidence: 0.92,
    pointer: 'github://az-oncrd/biomarker-platform/pipelines/stratification',
  },
  {
    id: 'RU-02',
    origin: 'COM-3305 · Voydeya Launch',
    asset: 'EU reimbursement dossier template (rare disease)',
    type: 'Document template',
    applicability: ['Future rare disease launches', 'Farxiga label-expansion markets'],
    maturity: 'Validated',
    timeSaved: '3–4 weeks',
    confidence: 0.88,
    pointer: 'sharepoint://Commercial/Launch-Excellence/Templates/EU-RD-Dossier-v4',
  },
  {
    id: 'RU-03',
    origin: 'IT-1184 · Veeva Vault R2',
    asset: 'Validated migration scripts + test harness',
    type: 'Code · validated',
    applicability: ['Any Veeva Vault migration', 'QualityDocs consolidation'],
    maturity: 'GxP-qualified',
    timeSaved: '8–12 weeks',
    confidence: 0.95,
    pointer: 'github://az-it-platforms/veeva-migration-toolkit',
  },
  {
    id: 'RU-04',
    origin: 'MFG-0918 · Södertälje CLT',
    asset: 'Net-zero heat loop engineering package',
    type: 'Engineering design',
    applicability: ['Macclesfield expansion', 'Frederick facility retrofit'],
    maturity: 'Build-validated',
    timeSaved: '16–20 weeks',
    confidence: 0.81,
    pointer: 'sharepoint://Ops/Sustainability/Engineering/NZ-Heat-Loop-v2',
  },
  {
    id: 'RU-05',
    origin: 'ENB-0442 · Finance ERP',
    asset: 'APAC legal entity data model',
    type: 'Data model',
    applicability: ['Any APAC system rollout', 'Workday APAC expansion'],
    maturity: 'Production',
    timeSaved: '4–6 weeks',
    confidence: 0.86,
    pointer: 's3://az-erp/ref-data/apac-entity-model/v3',
  },
];

const CONNECTIONS = [
  { from: 'RD-2247', to: 'RD-2108', relation: 'Shares biomarker platform', strength: 'strong' },
  { from: 'RD-2247', to: 'MED-1770', relation: 'Overlapping RWE scope', strength: 'medium' },
  { from: 'RD-2247', to: 'IT-1184', relation: 'Depends on Veeva Vault R2', strength: 'strong' },
  { from: 'COM-3305', to: 'MFG-0918', relation: 'Launch supply dependency', strength: 'strong' },
  { from: 'IT-1184', to: 'ENB-0442', relation: 'Shared change-mgmt capacity', strength: 'medium' },
  { from: 'SUS-0231', to: 'MFG-0918', relation: 'Scope 3 data producer', strength: 'strong' },
];

const AGENTS = [
  { id: 'strategist', name: 'Strategist', role: 'Frames the ask against governance lens', icon: Target },
  { id: 'investigator', name: 'Investigator', role: 'Retrieves across all authoritative sources', icon: Search },
  { id: 'connector', name: 'Connector', role: 'Walks the enterprise project graph', icon: Network },
  { id: 'reuseScout', name: 'Reuse Scout', role: 'Finds reusable artifacts across functions', icon: Copy },
  { id: 'sentinel', name: 'Risk & Compliance Sentinel', role: 'Screens for GxP, privacy, IP, financial sensitivities', icon: Shield },
  { id: 'composer', name: 'Composer', role: 'Assembles governance-appropriate deliverable', icon: FileText },
];

// ============================================================================

export default function Atlas() {
  const [view, setView] = useState('home');
  const [selectedProject, setSelectedProject] = useState(null);
  const [query, setQuery] = useState('');
  const [runState, setRunState] = useState('idle'); // idle | running | done
  const [agentStates, setAgentStates] = useState({});
  const [revealedSources, setRevealedSources] = useState(0);

  // color palette
  const C = {
    bg: '#0E1620',
    panel: '#141E2C',
    panelLight: '#1A2636',
    ink: '#EDE4D3',
    inkDim: '#9AA4B2',
    inkFaint: '#5A6676',
    rule: '#233042',
    accent: '#E8A33D',
    accent2: '#D0006F',
    green: '#7FB069',
    amber: '#E8A33D',
    red: '#D35050',
  };

  const runQuery = async (q) => {
    const queryToRun = q || query;
    if (!queryToRun.trim()) return;
    setQuery(queryToRun);
    setRunState('running');
    setAgentStates({});
    setRevealedSources(0);

    const seq = ['strategist', 'investigator', 'connector', 'reuseScout', 'sentinel', 'composer'];
    for (const id of seq) {
      setAgentStates(prev => ({ ...prev, [id]: 'working' }));
      await new Promise(r => setTimeout(r, 600));
      if (id === 'investigator') {
        for (let i = 1; i <= 8; i++) {
          await new Promise(r => setTimeout(r, 150));
          setRevealedSources(i);
        }
      }
      setAgentStates(prev => ({ ...prev, [id]: 'done' }));
    }
    setRunState('done');
  };

  return (
    <div style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', minHeight: '100vh', background: C.bg, color: C.ink, position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=IBM+Plex+Mono:wght@300;400;500&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        .mono { font-family: 'IBM Plex Mono', monospace; }
        .sans { font-family: 'IBM Plex Sans', sans-serif; }
        .serif { font-family: 'Cormorant Garamond', serif; }
        @keyframes fade-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pulse-dot { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.35; transform: scale(0.85); } }
        @keyframes scan { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        @keyframes draw-line { from { stroke-dashoffset: 300; } to { stroke-dashoffset: 0; } }
        .fade-up { animation: fade-up 0.55s ease-out both; }
        .fade-in { animation: fade-in 0.6s ease-out both; }
        .pulse-dot { animation: pulse-dot 1.2s ease-in-out infinite; }
        .grid-bg {
          background-image:
            linear-gradient(rgba(237,228,211,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(237,228,211,0.025) 1px, transparent 1px);
          background-size: 48px 48px;
        }
        .hover-lift { transition: transform 0.2s ease, border-color 0.2s ease; }
        .hover-lift:hover { transform: translateY(-2px); border-color: #E8A33D !important; }
        button:focus { outline: none; }
      `}</style>

      {/* Grid background */}
      <div className="grid-bg" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', opacity: 0.7 }} />

      {/* Decorative compass watermark */}
      <div style={{ position: 'fixed', right: -80, top: 120, pointerEvents: 'none', opacity: 0.04 }}>
        <CompassRose size={400} color={C.ink} />
      </div>

      {/* HEADER */}
      <header style={{ borderBottom: `1px solid ${C.rule}`, background: C.bg, position: 'sticky', top: 0, zIndex: 50, backdropFilter: 'blur(8px)' }}>
        <div style={{ maxWidth: 1480, margin: '0 auto', padding: '18px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <CompassRose size={36} color={C.accent} />
            <div>
              <div className="serif" style={{ fontSize: 26, fontWeight: 500, letterSpacing: '0.02em', lineHeight: 1, fontStyle: 'italic' }}>
                Atlas
              </div>
              <div className="mono" style={{ fontSize: 9, color: C.inkFaint, letterSpacing: '0.2em', marginTop: 4, textTransform: 'uppercase' }}>
                Enterprise Portfolio Intelligence · AstraZeneca
              </div>
            </div>
          </div>

          <nav style={{ display: 'flex', gap: 2 }}>
            {[
              { id: 'home', label: 'Ask' },
              { id: 'portfolio', label: 'Portfolio' },
              { id: 'reuse', label: 'Reuse Radar' },
              { id: 'architecture', label: 'Architecture' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setView(tab.id); setSelectedProject(null); }}
                className="sans"
                style={{
                  padding: '8px 18px',
                  border: 'none',
                  background: view === tab.id ? C.accent : 'transparent',
                  color: view === tab.id ? C.bg : C.ink,
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 500,
                  letterSpacing: '0.02em',
                  textTransform: 'uppercase',
                  transition: 'all 0.15s',
                }}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="mono" style={{ fontSize: 9, color: C.inkFaint, letterSpacing: '0.2em' }}>
              PORTFOLIO · STRATEGY LEADER
            </div>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: C.accent, color: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="sans" >
              <span style={{ fontSize: 11, fontWeight: 600 }}>JD</span>
            </div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1480, margin: '0 auto', padding: '48px 40px', position: 'relative', zIndex: 1 }}>

        {/* ================= HOME / ASK VIEW ================= */}
        {view === 'home' && !selectedProject && (
          <div className="fade-up">
            {/* Hero */}
            <div style={{ marginBottom: 56, position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <div style={{ width: 48, height: 1, background: C.accent }} />
                <div className="mono" style={{ fontSize: 10, color: C.accent, letterSpacing: '0.25em', textTransform: 'uppercase' }}>
                  I · Ask Atlas
                </div>
              </div>
              <h1 className="serif" style={{ fontSize: 'clamp(48px, 6.5vw, 84px)', fontWeight: 400, lineHeight: 0.96, letterSpacing: '-0.02em', margin: 0, marginBottom: 28, maxWidth: 1100 }}>
                One question.<br />
                <span style={{ fontStyle: 'italic', color: C.accent }}>Every project.</span> Every source.
              </h1>
              <p className="sans" style={{ fontSize: 17, lineHeight: 1.6, color: C.inkDim, maxWidth: 720, fontWeight: 300 }}>
                A specialised crew of agents retrieves across SharePoint, Confluence, Veeva, SAP, GitHub, S3, Jira, and the enterprise knowledge graph — then composes the answer you actually need: a project brief, a reuse map, a connection graph, or a leadership readout.
              </p>
            </div>

            {/* Query bar */}
            <div style={{ background: C.panel, border: `1px solid ${C.rule}`, marginBottom: 40, position: 'relative', overflow: 'hidden' }}>
              {runState === 'running' && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${C.accent}, transparent)`, animation: 'scan 1.6s linear infinite' }} />
              )}
              <div style={{ padding: '22px 28px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <Search size={18} color={C.inkDim} strokeWidth={1.5} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && runQuery()}
                  placeholder="Ask anything about any AstraZeneca project or the portfolio…"
                  className="sans"
                  style={{ flex: 1, border: 'none', outline: 'none', fontSize: 16, background: 'transparent', color: C.ink, letterSpacing: '0.005em', fontWeight: 300 }}
                  disabled={runState === 'running'}
                />
                <button
                  onClick={() => runQuery()}
                  disabled={runState === 'running' || !query.trim()}
                  className="sans"
                  style={{
                    padding: '10px 20px',
                    background: runState === 'running' ? C.inkFaint : C.accent,
                    color: C.bg,
                    border: 'none',
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    cursor: runState === 'running' ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  {runState === 'running' ? 'Searching' : 'Ask Atlas'}
                  {runState !== 'running' && <ArrowRight size={12} strokeWidth={2.5} />}
                </button>
              </div>
            </div>

            {/* Example queries OR live run */}
            {runState === 'idle' && (
              <div style={{ marginBottom: 48 }}>
                <div className="mono" style={{ fontSize: 10, color: C.inkFaint, letterSpacing: '0.2em', marginBottom: 20, textTransform: 'uppercase' }}>
                  — Try a question
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 1, background: C.rule, border: `1px solid ${C.rule}` }}>
                  {[
                    { pillar: 'Project Intelligence', q: 'Give me a full brief on ADAURA-2 including status, risks, stakeholders, and dependencies' },
                    { pillar: 'Project Intelligence', q: 'Summarise Södertälje CLT plant readiness for Q3 qualification' },
                    { pillar: 'Reuse & Connection', q: 'What reusable assets exist for launching a new rare-disease product in EU5?' },
                    { pillar: 'Reuse & Connection', q: 'Which active projects share stakeholders, scope, or dependencies with ADAURA-2?' },
                  ].map((ex, i) => (
                    <button
                      key={i}
                      onClick={() => runQuery(ex.q)}
                      className="hover-lift"
                      style={{
                        textAlign: 'left',
                        padding: '22px 24px',
                        background: C.panel,
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <div className="mono" style={{ fontSize: 9, color: C.accent, letterSpacing: '0.2em', marginBottom: 10, textTransform: 'uppercase' }}>
                        — {ex.pillar}
                      </div>
                      <div className="serif" style={{ fontSize: 19, fontWeight: 400, color: C.ink, lineHeight: 1.3, letterSpacing: '-0.005em' }}>
                        {ex.q}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Agent crew live */}
            {runState !== 'idle' && (
              <div style={{ marginBottom: 40 }}>
                <div className="mono" style={{ fontSize: 10, color: C.inkFaint, letterSpacing: '0.2em', marginBottom: 16, textTransform: 'uppercase' }}>
                  — Agent crew · Orchestrated via Agent Mesh
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${AGENTS.length}, 1fr)`, border: `1px solid ${C.rule}`, background: C.panel }}>
                  {AGENTS.map((agent, i) => {
                    const status = agentStates[agent.id] || 'idle';
                    return (
                      <div key={agent.id} style={{
                        padding: 18,
                        borderRight: i < AGENTS.length - 1 ? `1px solid ${C.rule}` : 'none',
                        background: status === 'working' ? `${C.accent}12` : 'transparent',
                        transition: 'background 0.4s',
                        position: 'relative',
                      }}>
                        {status === 'working' && (
                          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: C.accent }} />
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                          <div style={{
                            width: 30, height: 30,
                            border: `1px solid ${status === 'idle' ? C.rule : C.accent}`,
                            background: status === 'done' ? C.accent : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <agent.icon size={14} color={status === 'done' ? C.bg : (status === 'idle' ? C.inkFaint : C.accent)} strokeWidth={1.5} />
                          </div>
                          {status === 'working' && <Circle size={6} fill={C.accent} color={C.accent} className="pulse-dot" />}
                          {status === 'done' && <CheckCircle2 size={12} color={C.green} strokeWidth={2} />}
                        </div>
                        <div className="serif" style={{ fontSize: 17, fontWeight: 500, marginBottom: 4, letterSpacing: '-0.005em', color: C.ink }}>
                          {agent.name}
                        </div>
                        <div className="sans" style={{ fontSize: 11, color: C.inkDim, lineHeight: 1.4, fontWeight: 300 }}>
                          {agent.role}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Retrieved evidence */}
            {runState !== 'idle' && revealedSources > 0 && (
              <RetrievedEvidence count={revealedSources} C={C} />
            )}

            {/* Composed answer */}
            {runState === 'done' && (
              <ComposedAnswer C={C} onOpenProject={() => { setSelectedProject('RD-2247'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
            )}
          </div>
        )}

        {/* ================= PROJECT DEEP DIVE ================= */}
        {selectedProject && (
          <ProjectDeepDive
            project={PROJECTS.find(p => p.id === selectedProject)}
            onClose={() => setSelectedProject(null)}
            C={C}
          />
        )}

        {/* ================= PORTFOLIO VIEW ================= */}
        {view === 'portfolio' && !selectedProject && (
          <PortfolioView projects={PROJECTS} onSelect={setSelectedProject} C={C} />
        )}

        {/* ================= REUSE RADAR ================= */}
        {view === 'reuse' && !selectedProject && (
          <ReuseRadar C={C} />
        )}

        {/* ================= ARCHITECTURE ================= */}
        {view === 'architecture' && !selectedProject && (
          <ArchitectureView C={C} />
        )}

      </main>

      <footer style={{ borderTop: `1px solid ${C.rule}`, padding: '28px 40px', marginTop: 100, position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1480, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="mono" style={{ fontSize: 9, color: C.inkFaint, letterSpacing: '0.2em' }}>
            ATLAS · ENTERPRISE PORTFOLIO INTELLIGENCE · v0.1 MOCK
          </div>
          <div className="mono" style={{ fontSize: 9, color: C.inkFaint, letterSpacing: '0.2em' }}>
            ACL-AWARE · GXP-SAFE · AUDIT-LOGGED
          </div>
        </div>
      </footer>
    </div>
  );
}

// ============================================================================
// COMPONENTS
// ============================================================================

function CompassRose({ size = 36, color = '#E8A33D' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ flexShrink: 0 }}>
      <circle cx="50" cy="50" r="48" fill="none" stroke={color} strokeWidth="0.5" />
      <circle cx="50" cy="50" r="38" fill="none" stroke={color} strokeWidth="0.3" />
      <circle cx="50" cy="50" r="2" fill={color} />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
        const rad = (angle - 90) * Math.PI / 180;
        const x1 = 50 + Math.cos(rad) * 2;
        const y1 = 50 + Math.sin(rad) * 2;
        const len = i % 2 === 0 ? 46 : 38;
        const x2 = 50 + Math.cos(rad) * len;
        const y2 = 50 + Math.sin(rad) * len;
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={i % 2 === 0 ? 0.8 : 0.4} />;
      })}
      {[0, 90, 180, 270].map((angle, i) => {
        const rad = (angle - 90) * Math.PI / 180;
        const x = 50 + Math.cos(rad) * 44;
        const y = 50 + Math.sin(rad) * 44;
        const x2 = 50 + Math.cos(rad) * 36;
        const y2 = 50 + Math.sin(rad) * 36;
        const label = ['N', 'E', 'S', 'W'][i];
        return (
          <g key={`l${i}`}>
            <polygon
              points={`${x},${y} ${x2 + Math.cos(rad + Math.PI/2) * 2},${y2 + Math.sin(rad + Math.PI/2) * 2} ${x2 - Math.cos(rad + Math.PI/2) * 2},${y2 - Math.sin(rad + Math.PI/2) * 2}`}
              fill={color}
              opacity="0.6"
            />
          </g>
        );
      })}
    </svg>
  );
}

function RetrievedEvidence({ count, C }) {
  const EVIDENCE = [
    { src: 'Confluence', icon: BookOpen, tier: 'T1', title: 'ADAURA-2 Protocol v4.2 — Summary', path: 'Clinical / Oncology / ADAURA-2 / Protocol', snippet: 'Adjuvant osimertinib in stage IB-IIIA NSCLC post-resection. Primary endpoint: DFS. Four cohorts including EGFR-mutant underrepresented subtypes…', rel: 0.96, updated: '2 days ago', acl: 'Clinical-Onc' },
    { src: 'Veeva Vault', icon: Lock, tier: 'T3', title: 'eTMF — Regulatory submissions dossier (34 countries)', path: 'RIM / ADAURA-2 / Submissions', snippet: 'Submissions completed Jan 2026. LATAM cluster: 4 countries awaiting IRB approval (CL, CO, PE, MX). Est. activation: Apr 2026…', rel: 0.93, updated: '6 days ago', acl: 'Clinical+Reg' },
    { src: 'Planisware', icon: Layers, tier: 'T2', title: 'Project RD-2247 — Milestone tracker', path: 'Portfolio / Clinical / RD-2247', snippet: 'First patient in: target 2026-05. Interim analysis: 2026-09. Primary readout: 2028-Q4. Budget utilised 20.3% (€38M of €187M approved)…', rel: 0.91, updated: '12 hours ago', acl: 'Portfolio' },
    { src: 'SharePoint', icon: Cloud, tier: 'T1', title: 'Q1 2026 Oncology Portfolio Review deck', path: '/Oncology/Governance/PortReview/2026-Q1.pptx', snippet: 'ADAURA-2 flagged as high-strategic-priority. Dependencies: biomarker platform (RD-2108), Veeva Vault R2 (IT-1184), central lab capacity…', rel: 0.88, updated: '3 weeks ago', acl: 'OBU-LT' },
    { src: 'GitHub', icon: FolderGit2, tier: 'T4', title: 'az-oncrd/biomarker-platform', path: 'pipelines/stratification · models/nsclc-v3', snippet: 'NSCLC patient stratification pipeline. Output schema compatible with ADAURA-2 cohort definitions. Last production deploy: 2026-03-22…', rel: 0.84, updated: '3 weeks ago', acl: 'Oncology-RD' },
    { src: 'BIKG', icon: Network, tier: 'Graph', title: 'NSCLC adjuvant therapy — competitive landscape', path: 'BIKG / Oncology / NSCLC / Competitive', snippet: 'Keytruda adjuvant approval (KEYNOTE-671), Alecensa ALINA readout Q3 2026. Tagrisso remains first EGFR-TKI with OS benefit in this setting…', rel: 0.82, updated: '1 week ago', acl: 'Enterprise-read' },
    { src: 'Jira', icon: Grid3x3, tier: 'T2', title: 'ADAURA-2-EPIC-01: Site activation tracker', path: 'Epic · 34 stories · 8 in progress', snippet: 'LATAM sub-epic blocked on IRB cycle. Central lab capacity sub-epic amber. Digital endpoint wearable sub-epic green (dual-source signed)…', rel: 0.79, updated: '5 hours ago', acl: 'Clinical' },
    { src: 'S3', icon: Database, tier: 'T4', title: 'adaura2_risk_register_2026Q1.xlsx', path: 's3://az-clinical/adaura-2/risks/', snippet: '12 open risks. 1 high (LATAM IRB), 3 medium, 8 low. Mitigation plans documented for all high/medium. Review cadence: biweekly…', rel: 0.76, updated: '1 week ago', acl: 'Clinical-Onc' },
  ];

  return (
    <div style={{ marginBottom: 40 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
        <div className="mono" style={{ fontSize: 10, color: C.inkFaint, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
          — Retrieved evidence · {count} sources · ACL-filtered
        </div>
        <div className="mono" style={{ fontSize: 10, color: C.accent, letterSpacing: '0.2em' }}>
          T1 → T4 + GRAPH
        </div>
      </div>
      <div style={{ background: C.panel, border: `1px solid ${C.rule}` }}>
        {EVIDENCE.slice(0, count).map((e, i) => (
          <div key={i} className="fade-in" style={{
            padding: '18px 24px',
            borderBottom: i < count - 1 ? `1px solid ${C.rule}` : 'none',
            display: 'grid',
            gridTemplateColumns: '160px 1fr 100px',
            gap: 20,
            alignItems: 'start',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 28, height: 28, border: `1px solid ${C.accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <e.icon size={13} color={C.accent} strokeWidth={1.5} />
              </div>
              <div>
                <div className="sans" style={{ fontSize: 11, color: C.ink, fontWeight: 500, letterSpacing: '0.01em' }}>
                  {e.src}
                </div>
                <div className="mono" style={{ fontSize: 9, color: C.inkFaint, letterSpacing: '0.1em' }}>
                  {e.tier} · {e.acl}
                </div>
              </div>
            </div>
            <div>
              <div className="serif" style={{ fontSize: 17, fontWeight: 500, marginBottom: 4, letterSpacing: '-0.005em', color: C.ink }}>
                {e.title}
              </div>
              <div className="mono" style={{ fontSize: 10, color: C.inkFaint, marginBottom: 8, letterSpacing: '0.02em' }}>
                {e.path}
              </div>
              <div className="sans" style={{ fontSize: 13, color: C.inkDim, lineHeight: 1.55, fontWeight: 300 }}>
                {e.snippet}
              </div>
            </div>
            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 50, height: 2, background: C.rule, position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${e.rel * 100}%`, background: C.accent }} />
                </div>
                <span className="mono" style={{ fontSize: 10, color: C.inkDim }}>{(e.rel * 100).toFixed(0)}</span>
              </div>
              <div className="mono" style={{ fontSize: 9, color: C.inkFaint }}>
                {e.updated}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ComposedAnswer({ C, onOpenProject }) {
  return (
    <div className="fade-up">
      <div className="mono" style={{ fontSize: 10, color: C.inkFaint, letterSpacing: '0.2em', marginBottom: 16, textTransform: 'uppercase' }}>
        — Composed answer · Governance-checked
      </div>
      <div style={{ background: C.panel, border: `1px solid ${C.rule}`, padding: 40 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div className="mono" style={{ fontSize: 9, color: C.accent, letterSpacing: '0.25em', marginBottom: 8 }}>
              RD-2247 · PROJECT BRIEF · PHASE 3
            </div>
            <h2 className="serif" style={{ fontSize: 36, fontWeight: 500, letterSpacing: '-0.015em', margin: 0, color: C.ink }}>
              ADAURA-2 Trial Expansion
            </h2>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <span style={{ padding: '4px 10px', background: `${C.green}22`, color: C.green, fontSize: 10, letterSpacing: '0.1em' }} className="mono">● ON TRACK</span>
            <span style={{ padding: '4px 10px', border: `1px solid ${C.rule}`, color: C.inkDim, fontSize: 10, letterSpacing: '0.1em' }} className="mono">€187M</span>
          </div>
        </div>

        <p className="serif" style={{ fontSize: 22, fontStyle: 'italic', lineHeight: 1.5, color: C.ink, marginBottom: 32, fontWeight: 400, maxWidth: 900 }}>
          "Expanded adjuvant Tagrisso trial across four NSCLC subtypes — 1,100 patients across 34 countries. Flagship oncology asset; high strategic priority; amber on site activation in LATAM."
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 40, marginBottom: 32 }}>
          <div>
            <div className="mono" style={{ fontSize: 10, color: C.inkFaint, letterSpacing: '0.2em', marginBottom: 12, textTransform: 'uppercase' }}>
              Status · Milestones
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {DEEP_BRIEF.status.milestones.map((m, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '14px 1fr auto', gap: 14, alignItems: 'center' }}>
                  <Circle size={10} fill={m.status === 'done' ? C.green : m.status === 'active' ? C.accent : 'transparent'} color={m.status === 'done' ? C.green : m.status === 'active' ? C.accent : C.inkFaint} strokeWidth={1.5} />
                  <div className="sans" style={{ fontSize: 13, color: m.status === 'pending' ? C.inkFaint : C.ink, fontWeight: 400 }}>{m.name}</div>
                  <div className="mono" style={{ fontSize: 10, color: C.inkFaint, letterSpacing: '0.05em' }}>{m.date}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="mono" style={{ fontSize: 10, color: C.inkFaint, letterSpacing: '0.2em', marginBottom: 12, textTransform: 'uppercase' }}>
              Top Risks
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {DEEP_BRIEF.status.risks.map((r, i) => (
                <div key={i} style={{ padding: 12, background: C.bg, borderLeft: `2px solid ${r.level === 'high' ? C.red : r.level === 'medium' ? C.amber : C.inkFaint}` }}>
                  <div className="mono" style={{ fontSize: 9, color: r.level === 'high' ? C.red : r.level === 'medium' ? C.amber : C.inkFaint, letterSpacing: '0.15em', marginBottom: 4, textTransform: 'uppercase' }}>
                    {r.level} risk
                  </div>
                  <div className="sans" style={{ fontSize: 12, color: C.inkDim, lineHeight: 1.45, fontWeight: 300 }}>
                    {r.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ padding: 18, background: C.bg, border: `1px solid ${C.rule}`, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <Shield size={14} color={C.green} strokeWidth={1.5} />
            <div className="mono" style={{ fontSize: 10, color: C.green, letterSpacing: '0.2em' }}>SENTINEL CHECK · PASSED</div>
          </div>
          <div className="sans" style={{ fontSize: 12, color: C.inkDim, lineHeight: 1.6, fontWeight: 300 }}>
            No GxP, unblinded patient data, financial disclosure, or IP sensitivities detected. 2 citations from Tier 3 Veeva content redacted to document-level references only. Full audit trail logged (atlas-trace://q-8847).
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={onOpenProject} className="sans" style={{ padding: '10px 18px', background: C.accent, color: C.bg, border: 'none', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            Open project file <ArrowRight size={12} strokeWidth={2.5} />
          </button>
          <button className="sans" style={{ padding: '10px 18px', background: 'transparent', color: C.ink, border: `1px solid ${C.rule}`, fontSize: 11, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Download size={12} /> Export brief
          </button>
          <button className="sans" style={{ padding: '10px 18px', background: 'transparent', color: C.ink, border: `1px solid ${C.rule}`, fontSize: 11, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Send size={12} /> Share to Teams
          </button>
        </div>
      </div>
    </div>
  );
}

function ProjectDeepDive({ project, onClose, C }) {
  if (!project) return null;
  const fn = FUNCTIONS[project.function];
  const relatedConnections = CONNECTIONS.filter(c => c.from === project.id || c.to === project.id);
  const applicableReuse = REUSE_FINDINGS.filter(r => r.applicability.some(a => a.includes(project.id) || a.includes(project.name.split(' ')[0])));

  return (
    <div className="fade-up">
      <button onClick={onClose} className="sans" style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: 'none', color: C.inkDim, cursor: 'pointer', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 24 }}>
        <ArrowLeft size={12} /> Back
      </button>

      {/* Project header */}
      <div style={{ marginBottom: 40, paddingBottom: 32, borderBottom: `1px solid ${C.rule}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <fn.icon size={14} color={fn.color} strokeWidth={1.5} />
          <div className="mono" style={{ fontSize: 10, color: fn.color, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            {fn.label} · {project.id}
          </div>
        </div>
        <h1 className="serif" style={{ fontSize: 52, fontWeight: 400, lineHeight: 1, letterSpacing: '-0.02em', margin: 0, marginBottom: 16, color: C.ink }}>
          {project.name}
        </h1>
        <p className="serif" style={{ fontSize: 20, fontStyle: 'italic', color: C.inkDim, maxWidth: 900, lineHeight: 1.4, margin: 0, fontWeight: 400 }}>
          {project.summary}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1, marginTop: 32, background: C.rule, border: `1px solid ${C.rule}` }}>
          {[
            { label: 'Therapeutic Area', value: project.ta },
            { label: 'Geography', value: project.geo },
            { label: 'Stage · Lifecycle', value: `${project.stage} · ${project.lifecycle}` },
            { label: 'Sponsor', value: project.sponsor },
            { label: 'Next Gate', value: project.nextGate },
          ].map((stat, i) => (
            <div key={i} style={{ padding: '18px 20px', background: C.panel }}>
              <div className="mono" style={{ fontSize: 9, color: C.inkFaint, letterSpacing: '0.2em', marginBottom: 6, textTransform: 'uppercase' }}>
                {stat.label}
              </div>
              <div className="serif" style={{ fontSize: 16, color: C.ink, fontWeight: 500, lineHeight: 1.2, letterSpacing: '-0.005em' }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two-column layout: Intelligence + Reuse/Connections */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 40 }}>

        {/* LEFT: Project intelligence */}
        <div>
          <div className="mono" style={{ fontSize: 10, color: C.accent, letterSpacing: '0.25em', marginBottom: 16, textTransform: 'uppercase' }}>
            — I · Project Intelligence
          </div>

          {/* Charter */}
          <div style={{ background: C.panel, border: `1px solid ${C.rule}`, padding: 28, marginBottom: 20 }}>
            <div className="mono" style={{ fontSize: 10, color: C.inkFaint, letterSpacing: '0.2em', marginBottom: 10, textTransform: 'uppercase' }}>
              Charter
            </div>
            <h3 className="serif" style={{ fontSize: 22, fontWeight: 500, margin: 0, marginBottom: 14, color: C.ink, letterSpacing: '-0.01em' }}>
              Objective
            </h3>
            <p className="sans" style={{ fontSize: 14, lineHeight: 1.6, color: C.inkDim, margin: 0, marginBottom: 20, fontWeight: 300 }}>
              {DEEP_BRIEF.charter.objective}
            </p>
            <div className="mono" style={{ fontSize: 9, color: C.inkFaint, letterSpacing: '0.2em', marginBottom: 8, textTransform: 'uppercase' }}>
              Scope
            </div>
            <p className="sans" style={{ fontSize: 13, color: C.inkDim, marginBottom: 16, fontWeight: 300 }}>{DEEP_BRIEF.charter.scope}</p>
            <div className="mono" style={{ fontSize: 9, color: C.inkFaint, letterSpacing: '0.2em', marginBottom: 8, textTransform: 'uppercase' }}>
              Success Criteria
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {DEEP_BRIEF.charter.successCriteria.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 16, height: 1, background: C.accent }} />
                  <span className="sans" style={{ fontSize: 13, color: C.ink, fontWeight: 300 }}>{s}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Milestones */}
          <div style={{ background: C.panel, border: `1px solid ${C.rule}`, padding: 28, marginBottom: 20 }}>
            <div className="mono" style={{ fontSize: 10, color: C.inkFaint, letterSpacing: '0.2em', marginBottom: 14, textTransform: 'uppercase' }}>
              Milestones
            </div>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: 4, top: 8, bottom: 8, width: 1, background: C.rule }} />
              {DEEP_BRIEF.status.milestones.map((m, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '20px 1fr auto', gap: 14, alignItems: 'center', padding: '10px 0', position: 'relative' }}>
                  <div style={{ width: 9, height: 9, borderRadius: '50%', background: m.status === 'done' ? C.green : m.status === 'active' ? C.accent : C.bg, border: `1.5px solid ${m.status === 'done' ? C.green : m.status === 'active' ? C.accent : C.inkFaint}`, zIndex: 1, marginLeft: -1 }} />
                  <div className="serif" style={{ fontSize: 16, color: m.status === 'pending' ? C.inkFaint : C.ink, fontWeight: 500, letterSpacing: '-0.005em' }}>{m.name}</div>
                  <div className="mono" style={{ fontSize: 10, color: C.inkFaint, letterSpacing: '0.08em' }}>{m.date}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Risks */}
          <div style={{ background: C.panel, border: `1px solid ${C.rule}`, padding: 28, marginBottom: 20 }}>
            <div className="mono" style={{ fontSize: 10, color: C.inkFaint, letterSpacing: '0.2em', marginBottom: 14, textTransform: 'uppercase' }}>
              Risks & Issues
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {DEEP_BRIEF.status.risks.map((r, i) => (
                <div key={i} style={{ padding: 14, background: C.bg, borderLeft: `2px solid ${r.level === 'high' ? C.red : r.level === 'medium' ? C.amber : C.inkFaint}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div className="mono" style={{ fontSize: 9, color: r.level === 'high' ? C.red : r.level === 'medium' ? C.amber : C.inkFaint, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                      {r.level} risk
                    </div>
                  </div>
                  <div className="sans" style={{ fontSize: 13, color: C.ink, lineHeight: 1.5, fontWeight: 300 }}>
                    {r.text}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Financials */}
          <div style={{ background: C.panel, border: `1px solid ${C.rule}`, padding: 28 }}>
            <div className="mono" style={{ fontSize: 10, color: C.inkFaint, letterSpacing: '0.2em', marginBottom: 14, textTransform: 'uppercase' }}>
              Financials
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
              <div>
                <div className="mono" style={{ fontSize: 9, color: C.inkFaint, letterSpacing: '0.15em', marginBottom: 4 }}>APPROVED</div>
                <div className="serif" style={{ fontSize: 26, fontWeight: 500, color: C.ink, letterSpacing: '-0.01em' }}>{DEEP_BRIEF.financials.approvedBudget}</div>
              </div>
              <div>
                <div className="mono" style={{ fontSize: 9, color: C.inkFaint, letterSpacing: '0.15em', marginBottom: 4 }}>COMMITTED</div>
                <div className="serif" style={{ fontSize: 26, fontWeight: 500, color: C.accent, letterSpacing: '-0.01em' }}>{DEEP_BRIEF.financials.committed}</div>
              </div>
              <div>
                <div className="mono" style={{ fontSize: 9, color: C.inkFaint, letterSpacing: '0.15em', marginBottom: 4 }}>SPENT</div>
                <div className="serif" style={{ fontSize: 26, fontWeight: 500, color: C.ink, letterSpacing: '-0.01em' }}>{DEEP_BRIEF.financials.spentToDate}</div>
              </div>
            </div>
            <div style={{ marginTop: 16, height: 3, background: C.bg, position: 'relative' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: '50%', background: C.accent }} />
              <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: '20.3%', background: C.green }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span className="mono" style={{ fontSize: 9, color: C.inkFaint }}>0%</span>
              <span className="mono" style={{ fontSize: 9, color: C.inkFaint }}>20% spent · 50% committed</span>
              <span className="mono" style={{ fontSize: 9, color: C.inkFaint }}>100%</span>
            </div>
          </div>
        </div>

        {/* RIGHT: Reuse & Connections */}
        <div>
          <div className="mono" style={{ fontSize: 10, color: C.accent, letterSpacing: '0.25em', marginBottom: 16, textTransform: 'uppercase' }}>
            — II · Reuse & Connection
          </div>

          {/* Applicable reuse */}
          <div style={{ background: C.panel, border: `1px solid ${C.rule}`, padding: 28, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div className="mono" style={{ fontSize: 10, color: C.inkFaint, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                Applicable Reuse
              </div>
              <div className="serif" style={{ fontSize: 28, fontWeight: 500, color: C.accent, fontStyle: 'italic', letterSpacing: '-0.02em' }}>
                {applicableReuse.length > 0 ? applicableReuse.length : 2}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {REUSE_FINDINGS.slice(0, 3).map((r, i) => (
                <div key={i} style={{ padding: 16, background: C.bg, border: `1px solid ${C.rule}` }} className="hover-lift">
                  <div className="mono" style={{ fontSize: 9, color: C.accent, letterSpacing: '0.2em', marginBottom: 8, textTransform: 'uppercase' }}>
                    {r.type} · {r.maturity}
                  </div>
                  <div className="serif" style={{ fontSize: 17, fontWeight: 500, color: C.ink, marginBottom: 6, letterSpacing: '-0.005em' }}>
                    {r.asset}
                  </div>
                  <div className="sans" style={{ fontSize: 11, color: C.inkDim, marginBottom: 10, fontWeight: 300 }}>
                    From <span style={{ color: C.ink }}>{r.origin}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: `1px solid ${C.rule}` }}>
                    <span className="mono" style={{ fontSize: 9, color: C.inkFaint, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Time saved</span>
                    <span className="serif" style={{ fontSize: 16, color: C.accent, fontStyle: 'italic', fontWeight: 500 }}>{r.timeSaved}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Connection graph */}
          <div style={{ background: C.panel, border: `1px solid ${C.rule}`, padding: 28, marginBottom: 20 }}>
            <div className="mono" style={{ fontSize: 10, color: C.inkFaint, letterSpacing: '0.2em', marginBottom: 14, textTransform: 'uppercase' }}>
              Portfolio Connections
            </div>
            <ConnectionGraph focalId={project.id} C={C} />
          </div>

          {/* Stakeholders */}
          <div style={{ background: C.panel, border: `1px solid ${C.rule}`, padding: 28 }}>
            <div className="mono" style={{ fontSize: 10, color: C.inkFaint, letterSpacing: '0.2em', marginBottom: 14, textTransform: 'uppercase' }}>
              Stakeholder Map
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {DEEP_BRIEF.stakeholders.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: i < DEEP_BRIEF.stakeholders.length - 1 ? `1px solid ${C.rule}` : 'none' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: s.type === 'sponsor' ? C.accent : s.type === 'consumer' ? C.green : C.inkFaint, display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="sans">
                    <span style={{ fontSize: 10, color: C.bg, fontWeight: 600 }}>{s.name.split(' ').map(w => w[0]).join('')}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="serif" style={{ fontSize: 15, color: C.ink, fontWeight: 500, letterSpacing: '-0.005em' }}>{s.name}</div>
                    <div className="sans" style={{ fontSize: 11, color: C.inkDim, fontWeight: 300 }}>{s.role}</div>
                  </div>
                  <div className="mono" style={{ fontSize: 9, color: C.inkFaint, letterSpacing: '0.15em', textTransform: 'uppercase' }}>{s.type}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConnectionGraph({ focalId, C }) {
  const focal = PROJECTS.find(p => p.id === focalId);
  const related = CONNECTIONS
    .filter(c => c.from === focalId || c.to === focalId)
    .map(c => {
      const otherId = c.from === focalId ? c.to : c.from;
      return { project: PROJECTS.find(p => p.id === otherId), relation: c.relation, strength: c.strength };
    })
    .filter(r => r.project);

  const radius = 90;
  const cx = 180, cy = 140;

  return (
    <svg viewBox="0 0 360 280" style={{ width: '100%', height: 'auto' }}>
      {/* Concentric circles */}
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke={C.rule} strokeWidth="0.5" strokeDasharray="2 3" />
      <circle cx={cx} cy={cy} r={radius + 30} fill="none" stroke={C.rule} strokeWidth="0.3" strokeDasharray="1 4" />

      {/* Connecting lines */}
      {related.map((r, i) => {
        const angle = (i / related.length) * Math.PI * 2 - Math.PI / 2;
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;
        return (
          <line
            key={`l${i}`}
            x1={cx} y1={cy}
            x2={x} y2={y}
            stroke={r.strength === 'strong' ? C.accent : C.inkFaint}
            strokeWidth={r.strength === 'strong' ? 1 : 0.5}
            strokeDasharray={r.strength === 'strong' ? '0' : '2 3'}
          />
        );
      })}

      {/* Focal node */}
      <circle cx={cx} cy={cy} r="14" fill={C.accent} />
      <text x={cx} y={cy + 4} fill={C.bg} fontSize="9" fontFamily="IBM Plex Mono" textAnchor="middle" fontWeight="500">
        {focalId.split('-')[0]}
      </text>

      {/* Connected nodes */}
      {related.map((r, i) => {
        const angle = (i / related.length) * Math.PI * 2 - Math.PI / 2;
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;
        const fn = FUNCTIONS[r.project.function];
        return (
          <g key={`n${i}`}>
            <circle cx={x} cy={y} r="10" fill={C.panel} stroke={fn.color} strokeWidth="1.5" />
            <text x={x} y={y + 3} fill={C.ink} fontSize="7" fontFamily="IBM Plex Mono" textAnchor="middle" fontWeight="500">
              {r.project.id.split('-')[0]}
            </text>
            <text x={x} y={y + (Math.sin(angle) > 0 ? 26 : -16)} fill={C.inkDim} fontSize="8" fontFamily="IBM Plex Sans" textAnchor="middle">
              {r.project.id}
            </text>
            <text x={x} y={y + (Math.sin(angle) > 0 ? 36 : -26)} fill={C.inkFaint} fontSize="7" fontFamily="IBM Plex Mono" textAnchor="middle">
              {r.relation.slice(0, 28)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function PortfolioView({ projects, onSelect, C }) {
  const [filterFn, setFilterFn] = useState('all');
  const filtered = filterFn === 'all' ? projects : projects.filter(p => p.function === filterFn);

  return (
    <div className="fade-up">
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 48, height: 1, background: C.accent }} />
          <div className="mono" style={{ fontSize: 10, color: C.accent, letterSpacing: '0.25em', textTransform: 'uppercase' }}>
            II · Portfolio
          </div>
        </div>
        <h2 className="serif" style={{ fontSize: 60, fontWeight: 400, letterSpacing: '-0.02em', margin: 0, marginBottom: 18, lineHeight: 1 }}>
          Eight active initiatives across <span style={{ fontStyle: 'italic', color: C.accent }}>every function</span>.
        </h2>
        <p className="sans" style={{ fontSize: 15, color: C.inkDim, maxWidth: 720, fontWeight: 300, lineHeight: 1.5 }}>
          The enterprise portfolio as Atlas sees it — scored across strategic fit, execution health, risk, and reuse potential. Click any project to open its full intelligence file.
        </p>
      </div>

      {/* Function filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
        <button onClick={() => setFilterFn('all')} className="sans" style={{ padding: '6px 12px', border: `1px solid ${filterFn === 'all' ? C.accent : C.rule}`, background: filterFn === 'all' ? C.accent : 'transparent', color: filterFn === 'all' ? C.bg : C.inkDim, fontSize: 11, cursor: 'pointer', letterSpacing: '0.05em' }}>
          All functions ({projects.length})
        </button>
        {Object.entries(FUNCTIONS).map(([key, fn]) => {
          const count = projects.filter(p => p.function === key).length;
          if (count === 0) return null;
          return (
            <button key={key} onClick={() => setFilterFn(key)} className="sans" style={{ padding: '6px 12px', border: `1px solid ${filterFn === key ? fn.color : C.rule}`, background: filterFn === key ? fn.color : 'transparent', color: filterFn === key ? C.bg : C.inkDim, fontSize: 11, cursor: 'pointer', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
              <fn.icon size={10} strokeWidth={1.5} />
              {fn.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div style={{ border: `1px solid ${C.rule}`, background: C.panel }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2.3fr 1fr 0.8fr 0.8fr 1fr 1fr 1fr 1fr 40px', padding: '12px 20px', borderBottom: `1px solid ${C.rule}`, background: C.panelLight }}>
          {['Project', 'Function', 'Stage', 'Health', 'Strategic', 'Execution', 'Risk', 'Reuse', ''].map(h => (
            <div key={h} className="mono" style={{ fontSize: 9, color: C.inkFaint, letterSpacing: '0.2em', textTransform: 'uppercase' }}>{h}</div>
          ))}
        </div>
        {filtered.map((p, i) => {
          const fn = FUNCTIONS[p.function];
          return (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              className="hover-lift"
              style={{
                display: 'grid',
                gridTemplateColumns: '2.3fr 1fr 0.8fr 0.8fr 1fr 1fr 1fr 1fr 40px',
                padding: '20px 20px',
                borderBottom: i < filtered.length - 1 ? `1px solid ${C.rule}` : 'none',
                alignItems: 'center',
                width: '100%',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                gap: 12,
              }}
            >
              <div>
                <div className="serif" style={{ fontSize: 17, fontWeight: 500, color: C.ink, letterSpacing: '-0.005em', marginBottom: 2 }}>{p.name}</div>
                <div className="mono" style={{ fontSize: 9, color: C.inkFaint, letterSpacing: '0.08em' }}>{p.id} · {p.ta} · {p.geo}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <fn.icon size={11} color={fn.color} strokeWidth={1.5} />
                <span className="sans" style={{ fontSize: 11, color: C.inkDim }}>{fn.label}</span>
              </div>
              <div className="sans" style={{ fontSize: 11, color: C.inkDim }}>{p.stage}</div>
              <div>
                <span style={{ padding: '2px 8px', background: p.health === 'green' ? `${C.green}22` : p.health === 'amber' ? `${C.amber}22` : `${C.red}22`, color: p.health === 'green' ? C.green : p.health === 'amber' ? C.amber : C.red, fontSize: 10, letterSpacing: '0.1em' }} className="mono">
                  ● {p.health.toUpperCase()}
                </span>
              </div>
              {['strategic', 'execution', 'risk', 'reuse'].map(k => (
                <ScoreBar key={k} value={p.scores[k]} C={C} />
              ))}
              <ChevronRight size={14} color={C.inkFaint} strokeWidth={1.5} />
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ marginTop: 16, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <div className="mono" style={{ fontSize: 9, color: C.inkFaint, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          Scores: <span style={{ color: C.green }}>● ≥80 high</span> · <span style={{ color: C.amber }}>● 60–79 mid</span> · <span style={{ color: C.red }}>● &lt;60 low</span>
        </div>
      </div>
    </div>
  );
}

function ScoreBar({ value, C }) {
  const color = value >= 80 ? C.green : value >= 60 ? C.amber : C.red;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 2, background: C.rule, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${value}%`, background: color }} />
      </div>
      <span className="mono" style={{ fontSize: 10, color: C.ink, fontWeight: 500, minWidth: 20, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

function ReuseRadar({ C }) {
  return (
    <div className="fade-up">
      <div style={{ marginBottom: 48 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 48, height: 1, background: C.accent }} />
          <div className="mono" style={{ fontSize: 10, color: C.accent, letterSpacing: '0.25em', textTransform: 'uppercase' }}>
            III · Reuse Radar
          </div>
        </div>
        <h2 className="serif" style={{ fontSize: 60, fontWeight: 400, letterSpacing: '-0.02em', margin: 0, marginBottom: 18, lineHeight: 1 }}>
          What has already been built, <span style={{ fontStyle: 'italic', color: C.accent }}>somewhere</span>.
        </h2>
        <p className="sans" style={{ fontSize: 15, color: C.inkDim, maxWidth: 720, fontWeight: 300, lineHeight: 1.5 }}>
          The Reuse Scout continuously indexes artifacts across all sources — code, templates, playbooks, data models, validated components — and surfaces applicability to current initiatives. Enterprise-scale deduplication, by design.
        </p>
      </div>

      {/* Top metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, marginBottom: 40, background: C.rule, border: `1px solid ${C.rule}` }}>
        {[
          { label: 'Reusable assets indexed', value: '1,847', sub: 'Across all functions' },
          { label: 'Matches surfaced this Q', value: '312', sub: '+48% vs prior quarter' },
          { label: 'Est. time saved YTD', value: '148w', sub: 'Across matched reuses' },
          { label: 'Top contributing function', value: 'IT & Digital', sub: '41% of reusable assets' },
        ].map((m, i) => (
          <div key={i} style={{ padding: '24px 24px', background: C.panel }}>
            <div className="mono" style={{ fontSize: 9, color: C.inkFaint, letterSpacing: '0.2em', marginBottom: 10, textTransform: 'uppercase' }}>
              {m.label}
            </div>
            <div className="serif" style={{ fontSize: 36, fontWeight: 500, color: C.accent, lineHeight: 1, letterSpacing: '-0.02em', fontStyle: 'italic', marginBottom: 6 }}>
              {m.value}
            </div>
            <div className="sans" style={{ fontSize: 11, color: C.inkDim, fontWeight: 300 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Findings */}
      <div className="mono" style={{ fontSize: 10, color: C.inkFaint, letterSpacing: '0.2em', marginBottom: 16, textTransform: 'uppercase' }}>
        — High-Value Reuse Findings
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16 }}>
        {REUSE_FINDINGS.map((r, i) => (
          <div key={i} className="hover-lift" style={{ background: C.panel, border: `1px solid ${C.rule}`, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div className="mono" style={{ fontSize: 9, color: C.accent, letterSpacing: '0.2em' }}>{r.type.toUpperCase()}</div>
              <div className="mono" style={{ fontSize: 9, color: C.inkFaint, letterSpacing: '0.1em' }}>{r.maturity}</div>
            </div>
            <h3 className="serif" style={{ fontSize: 20, fontWeight: 500, color: C.ink, margin: 0, marginBottom: 10, letterSpacing: '-0.01em', lineHeight: 1.2 }}>
              {r.asset}
            </h3>
            <div className="sans" style={{ fontSize: 12, color: C.inkDim, marginBottom: 16, fontWeight: 300, lineHeight: 1.5 }}>
              Built in <span style={{ color: C.ink }}>{r.origin}</span>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div className="mono" style={{ fontSize: 9, color: C.inkFaint, letterSpacing: '0.15em', marginBottom: 6, textTransform: 'uppercase' }}>Applicable to</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {r.applicability.map((a, j) => (
                  <div key={j} className="sans" style={{ fontSize: 12, color: C.ink, fontWeight: 300, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Hexagon size={8} color={C.accent} fill={C.accent} strokeWidth={0} />
                    {a}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: `1px solid ${C.rule}` }}>
              <div>
                <div className="mono" style={{ fontSize: 9, color: C.inkFaint, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>Time saved</div>
                <div className="serif" style={{ fontSize: 22, color: C.accent, fontWeight: 500, fontStyle: 'italic', letterSpacing: '-0.01em' }}>{r.timeSaved}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="mono" style={{ fontSize: 9, color: C.inkFaint, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>Confidence</div>
                <div className="mono" style={{ fontSize: 15, color: C.ink, fontWeight: 500 }}>{(r.confidence * 100).toFixed(0)}%</div>
              </div>
            </div>

            <div style={{ marginTop: 14, padding: 10, background: C.bg, border: `1px solid ${C.rule}` }}>
              <div className="mono" style={{ fontSize: 9, color: C.inkFaint, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Pointer</div>
              <div className="mono" style={{ fontSize: 10, color: C.inkDim, wordBreak: 'break-all' }}>{r.pointer}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ArchitectureView({ C }) {
  return (
    <div className="fade-up">
      <div style={{ marginBottom: 48 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 48, height: 1, background: C.accent }} />
          <div className="mono" style={{ fontSize: 10, color: C.accent, letterSpacing: '0.25em', textTransform: 'uppercase' }}>
            IV · Architecture
          </div>
        </div>
        <h2 className="serif" style={{ fontSize: 60, fontWeight: 400, letterSpacing: '-0.02em', margin: 0, marginBottom: 18, lineHeight: 1 }}>
          From mock to <span style={{ fontStyle: 'italic', color: C.accent }}>every system</span> that matters.
        </h2>
        <p className="sans" style={{ fontSize: 15, color: C.inkDim, maxWidth: 720, fontWeight: 300, lineHeight: 1.5 }}>
          Every mock source maps to a real enterprise system. Adapt in waves by connector tier — start with Tier 1 collaboration sources, add Tier 2 execution systems, then systems of record once access-control patterns are proven.
        </p>
      </div>

      {/* Tier cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {Object.entries(SOURCE_TIERS).map(([key, tier], ti) => (
          <div key={key} style={{ background: C.panel, border: `1px solid ${C.rule}`, padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
                <div className="serif" style={{ fontSize: 40, fontWeight: 500, color: C.accent, fontStyle: 'italic', letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {String(ti + 1).padStart(2, '0')}
                </div>
                <div>
                  <div className="mono" style={{ fontSize: 9, color: C.inkFaint, letterSpacing: '0.2em', marginBottom: 4, textTransform: 'uppercase' }}>
                    {key === 'graphs' ? 'Layer' : `Tier ${ti + 1}`}
                  </div>
                  <div className="serif" style={{ fontSize: 24, fontWeight: 500, color: C.ink, letterSpacing: '-0.01em' }}>
                    {tier.label}
                  </div>
                </div>
              </div>
              <div className="mono" style={{ fontSize: 10, color: C.inkFaint, letterSpacing: '0.15em' }}>
                {tier.sources.length} SOURCE{tier.sources.length !== 1 ? 'S' : ''}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 1, background: C.rule, border: `1px solid ${C.rule}` }}>
              {tier.sources.map(src => (
                <div key={src.id} style={{ padding: 18, background: C.bg }}>
                  <div className="serif" style={{ fontSize: 17, fontWeight: 500, color: C.ink, marginBottom: 6, letterSpacing: '-0.005em' }}>
                    {src.label}
                  </div>
                  <div className="mono" style={{ fontSize: 10, color: C.inkFaint, marginBottom: 10, wordBreak: 'break-all', lineHeight: 1.4 }}>
                    {src.pointer}
                  </div>
                  <div className="sans" style={{ fontSize: 12, color: C.inkDim, fontWeight: 300, lineHeight: 1.45 }}>
                    {src.connector}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Tooling layer */}
      <div style={{ marginTop: 48 }}>
        <div className="mono" style={{ fontSize: 10, color: C.inkFaint, letterSpacing: '0.2em', marginBottom: 16, textTransform: 'uppercase' }}>
          — Approved AZ tooling stack
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 1, background: C.rule, border: `1px solid ${C.rule}` }}>
          {[
            { t: 'AI Gateway', r: 'Model routing, auth, rate limits, cost telemetry for every LLM call.', layer: 'INGRESS' },
            { t: 'RAGify', r: 'Unified retrieval index across all tier-1 to tier-4 sources.', layer: 'RETRIEVAL' },
            { t: 'BIKG', r: 'Biomedical knowledge graph for scientific grounding.', layer: 'RETRIEVAL' },
            { t: 'Agent Mesh', r: 'Agent registry, role definitions, inter-agent messaging.', layer: 'ORCHESTRATION' },
            { t: 'LangFlow', r: 'Visual workflow canvas for agent composition.', layer: 'ORCHESTRATION' },
            { t: 'Azimuth', r: 'Faithfulness, relevance, precision eval per run.', layer: 'EVAL' },
            { t: 'AWS QuickSuite', r: 'Leadership dashboards, portfolio views, comms tracker.', layer: 'UI' },
          ].map((s, i) => (
            <div key={i} style={{ padding: 22, background: C.panel }}>
              <div className="mono" style={{ fontSize: 9, color: C.accent, letterSpacing: '0.2em', marginBottom: 10 }}>
                {s.layer}
              </div>
              <div className="serif" style={{ fontSize: 20, fontWeight: 500, color: C.ink, marginBottom: 8, letterSpacing: '-0.01em' }}>
                {s.t}
              </div>
              <div className="sans" style={{ fontSize: 12, color: C.inkDim, lineHeight: 1.5, fontWeight: 300 }}>
                {s.r}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Roadmap */}
      <div style={{ marginTop: 48, background: C.panel, border: `1px solid ${C.rule}`, padding: 40 }}>
        <div style={{ marginBottom: 28 }}>
          <div className="mono" style={{ fontSize: 10, color: C.accent, letterSpacing: '0.25em', marginBottom: 12, textTransform: 'uppercase' }}>
            — Adoption Roadmap
          </div>
          <div className="serif" style={{ fontSize: 32, fontWeight: 500, color: C.ink, letterSpacing: '-0.015em', maxWidth: 780, lineHeight: 1.15 }}>
            Four waves, from proof-of-concept to enterprise-wide operating system.
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: C.rule, border: `1px solid ${C.rule}` }}>
          {[
            { phase: 'WAVE 01', title: 'Mock & demo', duration: 'Weeks 1–3', items: ['Mock data across all 8 functions', 'LangFlow canvas with 6-agent crew', 'Project Intelligence + Reuse pillars', 'Portfolio/Strategy leader UX'] },
            { phase: 'WAVE 02', title: 'One function pilot', duration: 'Months 2–4', items: ['Real Tier 1 sources (SharePoint, Confluence)', 'Scope: one function (e.g. R&D Oncology)', 'Azimuth evals on 100 real queries', 'Human review + feedback loop'] },
            { phase: 'WAVE 03', title: 'Multi-function beta', duration: 'Months 4–9', items: ['Add Tier 2 (Jira, Planisware)', 'Add 3 more functions', 'Enterprise Project Graph seeding', 'ACL inheritance from source systems'] },
            { phase: 'WAVE 04', title: 'Enterprise rollout', duration: 'Months 9–18', items: ['Tier 3 systems of record (Veeva, SAP)', 'QuickSuite leadership dashboards', 'Full audit + governance', 'Self-service per function'] },
          ].map((p, i) => (
            <div key={i} style={{ padding: 24, background: C.bg }}>
              <div className="mono" style={{ fontSize: 9, color: C.accent, letterSpacing: '0.2em', marginBottom: 8 }}>
                {p.phase}
              </div>
              <div className="serif" style={{ fontSize: 22, fontWeight: 500, color: C.ink, letterSpacing: '-0.01em', marginBottom: 4, lineHeight: 1.15 }}>
                {p.title}
              </div>
              <div className="mono" style={{ fontSize: 9, color: C.inkFaint, letterSpacing: '0.1em', marginBottom: 16, textTransform: 'uppercase' }}>
                {p.duration}
              </div>
              <ul className="sans" style={{ fontSize: 12, lineHeight: 1.65, color: C.inkDim, margin: 0, paddingLeft: 0, listStyle: 'none', fontWeight: 300 }}>
                {p.items.map((it, j) => (
                  <li key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 8, height: 1, background: C.accent, marginTop: 8, flexShrink: 0 }} />
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
