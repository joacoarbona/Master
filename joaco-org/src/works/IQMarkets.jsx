import React, { useState, useMemo } from 'react';
import {
  Activity, TrendingUp, Layers, Network, BookOpen, Target, Briefcase,
  Globe, Brain, ChevronRight, ArrowUpRight, ArrowDownRight, Plus, Search,
  Filter, MoreHorizontal, Calendar, CheckCircle2, Circle, AlertCircle,
  AlertTriangle, Building2, DollarSign, Clock, Zap, GitBranch, Star,
  MapPin, FileText, Users, BarChart3, Microscope, Pill, Stethoscope,
  Bell, ArrowRight, MinusCircle, Command, Hexagon,
  Inbox, MessageSquare, Eye, FileSearch, Send, Check, X, ThumbsUp, ThumbsDown,
  Lightbulb, Newspaper, Sparkles, ExternalLink, ChevronUp, ChevronDown,
  Mail, Radio, Trophy, Settings, Hash, Edit3, BookText,
  ScrollText, Flag, Vote, Workflow, PenLine
} from 'lucide-react';

// ============================================================
// DESIGN TOKENS — editorial dossier aesthetic
// ============================================================
const C = {
  ink: '#1B1F2A',        inkSoft: '#3F4756',    slate: '#6B7280',     faint: '#9CA3AF',
  paper: '#FBF9F4',      surface: '#FFFFFF',     cream: '#F8F6F1',    creamDeep: '#F1EDE2',
  rule: '#E5E1D8',        ruleSoft: '#F1EFE7',
  crimson: '#9E2A2B',     crimsonSoft: '#C84B4D', crimsonPale: '#F7E2E3', crimsonDk: '#6D1A1B',
  gold: '#B68B3F',        goldSoft: '#D9B870',    goldPale: '#F5ECD8',
  navy: '#21304D',        navySoft: '#3A4D70',    teal: '#2C6E7B',     sage: '#748A6D',
  green: '#16a34a',       amber: '#d97706',       red: '#dc2626',
};
const FONT_HEAD = '"Iowan Old Style", "Apple Garamond", Georgia, serif';
const FONT_MONO = '"SF Mono", "JetBrains Mono", Menlo, Consolas, monospace';

// ============================================================
// MASTER DATA
// ============================================================
const STAGES = [
  { n: 1, name: 'Scouting',      count: 124, kind: 'upstream' },
  { n: 2, name: 'Triage',        count:  38, kind: 'upstream' },
  { n: 3, name: 'Strategic fit', count:  16, kind: 'upstream' },
  { n: 4, name: 'Evaluation',    count:  11, kind: 'mid' },
  { n: 5, name: 'Term sheet',    count:   7, kind: 'mid' },
  { n: 6, name: 'Due diligence', count:   5, kind: 'mid' },
  { n: 7, name: 'Negotiation',   count:   4, kind: 'mid' },
  { n: 8, name: 'Contracting',   count:   2, kind: 'mid' },
  { n: 9, name: 'Mobilisation',  count:   6, kind: 'downstream' },
  { n:10, name: 'Renewal',       count:  12, kind: 'downstream' },
];

const TAs = [
  { id:'onc',   name:'Oncology',     color: C.crimson, count: 18 },
  { id:'cvrm',  name:'CVRM',         color: C.gold,    count: 9  },
  { id:'rare',  name:'Rare Disease', color: C.navy,    count: 4  },
  { id:'resp',  name:'Respiratory',  color: C.teal,    count: 6  },
  { id:'cross', name:'Cross-TA',     color: C.sage,    count: 10 },
];
const CAPABILITIES = ['RWE Data', 'Multimodal AI', 'Discovery AI', 'Digital Health', 'Agentic'];

const STAKEHOLDERS = [
  { id:'ta',   name:'TA Sponsor',     short:'TA',   icon: Target },
  { id:'bd',   name:'BD + Legal',     short:'BD',   icon: Briefcase },
  { id:'ma',   name:'Medical Affairs',short:'MA',   icon: Stethoscope },
  { id:'comm', name:'Commercial',     short:'CMRC', icon: TrendingUp },
  { id:'acat', name:'A.Catalyst',     short:'A.C',  icon: Globe },
  { id:'eai',  name:'Enterprise AI',  short:'EAI',  icon: Brain },
];

// Stakeholder engagement status palette
const SH = {
  sponsor:  { lbl:'Sponsor',  color: C.crimson,  bg: C.crimsonPale, dot: '●' },
  engaged:  { lbl:'Engaged',  color: C.gold,     bg: C.goldPale,    dot: '◐' },
  aligned:  { lbl:'Aligned',  color: C.navy,     bg: '#E8EEF6',     dot: '○' },
  pending:  { lbl:'Pending',  color: C.faint,    bg: C.creamDeep,   dot: '·' },
  blocked:  { lbl:'Blocked',  color: C.red,      bg: '#FEE2E2',     dot: '✕' },
};

// 14 partnerships — realistic AZ ecosystem
const PARTNERSHIPS = [
  { id:'tem', name:'Tempus AI', cat:'onc', cap:'Multimodal AI', loc:'Chicago, US',
    stage:10, days:18, health:'green', sponsor:'Galbraith (Onc R&D)',
    structure:'Alliance + trilateral', value:'$200M', tag:'FLAGSHIP', source:'Strategic',
    next:'Q3 renewal · scope expansion', alert:0,
    sh:{ta:'sponsor', bd:'engaged', ma:'engaged', comm:'engaged', acat:'aligned', eai:'engaged'}},
  { id:'mod', name:'Modella AI', cat:'onc', cap:'Multimodal AI', loc:'Boston, US',
    stage:10, days:42, health:'green', sponsor:'Reis-Filho (Comp Path)',
    structure:'M&A · Jan 2026', value:'Acquired', tag:'INTEGRATED', source:'M&A',
    next:'Cross-TA scale-out · Q4', alert:0,
    sh:{ta:'sponsor', bd:'aligned', ma:'engaged', comm:'aligned', acat:'aligned', eai:'sponsor'}},
  { id:'bos', name:'BostonGene', cat:'onc', cap:'RWE Data', loc:'Waltham, US',
    stage:9, days:12, health:'green', sponsor:'Hudson (Onc Disc)',
    structure:'Alliance', value:'$45M', tag:'ACTIVE', source:'A.Catalyst US',
    next:'JSC kickoff · w/c 26 May', alert:0,
    sh:{ta:'sponsor', bd:'engaged', ma:'engaged', comm:'aligned', acat:'engaged', eai:'aligned'}},
  { id:'aig', name:'Aignostics', cat:'onc', cap:'Multimodal AI', loc:'Berlin, DE',
    stage:5, days:9, health:'green', sponsor:'Reis-Filho (Comp Path)',
    structure:'Alliance (negot.)', value:'€25M HoT', tag:'TARGET', source:'Direct',
    next:'Heads of terms · 31 May', alert:0,
    sh:{ta:'sponsor', bd:'engaged', ma:'pending', comm:'aligned', acat:'aligned', eai:'engaged'}},
  { id:'owk', name:'Owkin', cat:'cross', cap:'RWE Data', loc:'Paris, FR',
    stage:4, days:21, health:'amber', sponsor:'Cross-TA · Reic',
    structure:'TBD · federated', value:'€18-30M est.', tag:'TARGET', source:'EU scouting',
    next:'Scorecard review · 28 May', alert:1,
    sh:{ta:'engaged', bd:'aligned', ma:'aligned', comm:'pending', acat:'sponsor', eai:'aligned'}},
  { id:'sav', name:'Savana Médica', cat:'cross', cap:'RWE Data', loc:'Madrid, ES',
    stage:3, days:14, health:'green', sponsor:'Spain CoE (proposed)',
    structure:'Alliance (EU)', value:'€8-15M est.', tag:'TARGET', source:'A.Catalyst Spain',
    next:'Sponsor sign-off · w/c 2 Jun', alert:0,
    sh:{ta:'engaged', bd:'pending', ma:'aligned', comm:'engaged', acat:'sponsor', eai:'engaged'}},
  { id:'ben', name:'BenevolentAI', cat:'cvrm', cap:'Discovery AI', loc:'London, UK',
    stage:10, days:62, health:'amber', sponsor:'Hudson (Onc Disc)',
    structure:'Alliance · restructured', value:'Milestone-weighted', tag:'ACTIVE', source:'Legacy',
    next:'Phase 2 next-target gate', alert:1,
    sh:{ta:'engaged', bd:'aligned', ma:'aligned', comm:'pending', acat:'aligned', eai:'aligned'}},
  { id:'nab', name:'Nabla', cat:'cross', cap:'Agentic', loc:'Paris, FR',
    stage:2, days:5, health:'green', sponsor:'EAI office',
    structure:'TBD', value:'TBD', tag:'SCOUT', source:'A.Catalyst Paris',
    next:'Opportunity brief · 26 May', alert:0,
    sh:{ta:'pending', bd:'pending', ma:'pending', comm:'pending', acat:'engaged', eai:'sponsor'}},
  { id:'qui', name:'Quibim', cat:'cross', cap:'Multimodal AI', loc:'Valencia, ES',
    stage:4, days:11, health:'green', sponsor:'Imaging · proposed',
    structure:'Alliance', value:'€10-18M est.', tag:'TARGET', source:'A.Catalyst Spain',
    next:'Eval scorecard · 30 May', alert:0,
    sh:{ta:'engaged', bd:'aligned', ma:'engaged', comm:'pending', acat:'sponsor', eai:'engaged'}},
  { id:'tuc', name:'Tucuvi', cat:'resp', cap:'Digital Health', loc:'Madrid, ES',
    stage:2, days:7, health:'green', sponsor:'Resp + Spain CoE',
    structure:'Pilot → alliance', value:'€2-5M pilot', tag:'SCOUT', source:'A.Catalyst Spain',
    next:'Triage brief · 28 May', alert:0,
    sh:{ta:'pending', bd:'pending', ma:'aligned', comm:'engaged', acat:'sponsor', eai:'engaged'}},
  { id:'med', name:'Mediktor', cat:'cvrm', cap:'Digital Health', loc:'Barcelona, ES',
    stage:3, days:22, health:'amber', sponsor:'CVRM (proposed)',
    structure:'Alliance', value:'€5-12M est.', tag:'TARGET', source:'A.Catalyst Spain',
    next:'Sponsor sign-off pending', alert:1,
    sh:{ta:'engaged', bd:'pending', ma:'aligned', comm:'engaged', acat:'engaged', eai:'aligned'}},
  { id:'atr', name:'Atropos Health', cat:'cross', cap:'RWE Data', loc:'New York, US',
    stage:4, days:33, health:'red', sponsor:'TBD',
    structure:'Pilot → alliance', value:'Pilot $1M', tag:'TARGET', source:'BD-sourced',
    next:'Sponsor needed (DECISION)', alert:2,
    sh:{ta:'pending', bd:'sponsor', ma:'pending', comm:'pending', acat:'pending', eai:'aligned'}},
  { id:'aet', name:'Aetion', cat:'cross', cap:'RWE Data', loc:'New York, US',
    stage:6, days:24, health:'green', sponsor:'Med Affairs',
    structure:'License + alliance', value:'$12M', tag:'ACTIVE', source:'Direct',
    next:'DD report · 4 Jun', alert:0,
    sh:{ta:'engaged', bd:'engaged', ma:'sponsor', comm:'aligned', acat:'aligned', eai:'engaged'}},
  { id:'vev', name:'Veeva ext.', cat:'cross', cap:'Digital Health', loc:'Pleasanton, US',
    stage:8, days:8, health:'green', sponsor:'Commercial · Hoots org',
    structure:'License extension', value:'$28M (3yr)', tag:'ACTIVE', source:'Legacy renewal',
    next:'Contract signature · 30 May', alert:0,
    sh:{ta:'aligned', bd:'engaged', ma:'aligned', comm:'sponsor', acat:'aligned', eai:'engaged'}},
];

// Activity feed (recent events across pipeline)
const ACTIVITY = [
  { when:'2h', kind:'gate',   icon:CheckCircle2, c:C.green,   text:'Aignostics passed stage 4 · advanced to term sheet',  who:'Joaquín · Eval committee' },
  { when:'5h', kind:'alert',  icon:AlertTriangle,c:C.amber,   text:'Atropos Health · sponsor decision overdue (33d)',     who:'BD escalation' },
  { when:'1d', kind:'doc',    icon:FileText,    c:C.crimson, text:'Owkin DD report draft circulated for review',          who:'DD workstream lead' },
  { when:'2d', kind:'meeting',icon:Calendar,    c:C.navy,    text:'Tempus JSC quarterly · 14 actions logged',             who:'Alliance Mgr' },
  { when:'3d', kind:'add',    icon:Plus,        c:C.gold,    text:'Nabla added to pipeline · stage 2 triage',             who:'A.Catalyst Paris' },
  { when:'4d', kind:'gate',   icon:CheckCircle2,c:C.green,   text:'Aetion advanced to stage 6 · DD launched',             who:'Med Affairs sponsor' },
];

// Decisions queue (action items needing Director sign-off)
const DECISIONS = [
  { id:1, prio:'HIGH', partnership:'Atropos Health',  what:'Identify TA sponsor or decline',     by:'30 May', stage:4 },
  { id:2, prio:'HIGH', partnership:'Aignostics',       what:'Approve term sheet structure',       by:'31 May', stage:5 },
  { id:3, prio:'MED',  partnership:'Owkin',            what:'Federated architecture sign-off',    by:'4 Jun',  stage:4 },
  { id:4, prio:'MED',  partnership:'Mediktor',         what:'CVRM TA sponsor decision',           by:'6 Jun',  stage:3 },
  { id:5, prio:'LOW',  partnership:'BenevolentAI',     what:'Phase 2 gate · target advancement',  by:'12 Jun', stage:10 },
];

// Framework adoption metrics
const ADOPTION = [
  { lbl:'9-dim DD coverage',        pct: 92, target: 100 },
  { lbl:'Sponsor letter in stage 3',pct: 78, target:  95 },
  { lbl:'30/60/90 plans signed',    pct: 64, target:  90 },
  { lbl:'AI Act clauses in term sheet', pct: 88, target: 100 },
  { lbl:'KPI baselines pre-launch', pct: 71, target:  90 },
];

// KPI summary
const KPIS = [
  { lbl:'In-flight partnerships',   v: '29', sub:'stages 3-9',          delta:'+3 MoM',  trend:'up',   c:C.crimson },
  { lbl:'Time-to-decision',          v: '84d', sub:'median scout→sig',  delta:'−12d',    trend:'up',   c:C.gold },
  { lbl:'Renewal w/ expansion',      v: '64%', sub:'eligible portfolio',delta:'+8pp',    trend:'up',   c:C.navy },
  { lbl:'Cross-TA share',            v: '34%', sub:'portfolio',          delta:'+4pp',    trend:'up',   c:C.teal },
  { lbl:'Stakeholder NPS',           v: '+42', sub:'BD+TA+Legal+MA',    delta:'+6',      trend:'up',   c:C.sage },
  { lbl:'EU-native share',           v: '38%', sub:'of new deals',       delta:'+11pp',  trend:'up',   c:C.crimson },
];

// ============================================================
// HELPERS
// ============================================================
const taById = (id) => TAs.find(t => t.id === id) || TAs[0];
const healthColor = (h) => h==='green'?C.green : h==='amber'?C.amber : h==='red'?C.red : C.faint;

// ============================================================
// ATOMS
// ============================================================
function MonoLabel({ children, color = C.slate, size = 10, ls = 0.14, weight = 600 }) {
  return (
    <span style={{ fontFamily: FONT_MONO, fontSize: size, fontWeight: weight, letterSpacing: `${ls}em`,
                   textTransform:'uppercase', color }}>
      {children}
    </span>
  );
}

function Serif({ children, size = 18, weight = 400, italic = false, color = C.ink, style = {} }) {
  return (
    <span style={{ fontFamily: FONT_HEAD, fontSize: size, fontWeight: weight,
                   fontStyle: italic ? 'italic' : 'normal', color, letterSpacing:'-0.005em', ...style }}>
      {children}
    </span>
  );
}

function TAChip({ ta, size = 'sm' }) {
  const t = taById(ta);
  const isLg = size === 'lg';
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:6,
      padding: isLg ? '5px 11px' : '2px 8px',
      background: t.color + '12',
      color: t.color,
      border: `1px solid ${t.color}30`,
      fontFamily: FONT_MONO,
      fontSize: isLg ? 11 : 10, fontWeight: 600, letterSpacing:'0.08em',
      borderRadius: 2,
    }}>
      <span style={{ width:5, height:5, borderRadius:'50%', background: t.color }}/>
      {t.name.toUpperCase()}
    </span>
  );
}

function HealthDot({ health }) {
  const c = healthColor(health);
  return (
    <span style={{ display:'inline-block', width:8, height:8, borderRadius:'50%', background: c,
                   boxShadow: `0 0 0 2px ${c}33` }}/>
  );
}

function StageProgress({ stage, total = 10, height = 6 }) {
  return (
    <div style={{ display:'flex', gap:2 }}>
      {Array.from({length: total}).map((_, i) => {
        const n = i + 1;
        const isPast = n < stage;
        const isCurrent = n === stage;
        const bg = isCurrent ? C.crimson : isPast ? C.crimsonDk : C.rule;
        const opacity = isCurrent ? 1 : isPast ? 0.85 : 1;
        return <div key={n} style={{ flex:1, height, background:bg, opacity }}/>;
      })}
    </div>
  );
}

function StageDots({ stage, total = 10 }) {
  return (
    <div style={{ display:'flex', gap:3, alignItems:'center' }}>
      {Array.from({length: total}).map((_, i) => {
        const n = i + 1;
        const isPast = n < stage;
        const isCurrent = n === stage;
        const bg = isCurrent ? C.crimson : isPast ? C.crimsonDk : 'transparent';
        const border = isCurrent ? C.crimson : isPast ? C.crimsonDk : C.rule;
        return (
          <div key={n} style={{
            width: isCurrent ? 11 : 8, height: isCurrent ? 11 : 8,
            borderRadius:'50%', background: bg,
            border: `1.5px solid ${border}`,
            transition: 'all 0.15s',
          }}/>
        );
      })}
    </div>
  );
}

function KPICard({ kpi }) {
  const TrendIcon = kpi.trend === 'up' ? ArrowUpRight : ArrowDownRight;
  return (
    <div style={{ background: C.surface, border:`1px solid ${C.rule}`, padding:'18px 20px',
                  position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background: kpi.c }}/>
      <MonoLabel color={C.slate}>{kpi.lbl}</MonoLabel>
      <div style={{ marginTop:8, display:'flex', alignItems:'baseline', gap:10 }}>
        <Serif size={36} weight={400} color={C.ink}>{kpi.v}</Serif>
        <span style={{ display:'inline-flex', alignItems:'center', gap:3,
                       fontFamily: FONT_MONO, fontSize:11, fontWeight:600, color: kpi.c }}>
          <TrendIcon size={12}/>{kpi.delta}
        </span>
      </div>
      <div style={{ marginTop:4, fontFamily: FONT_HEAD, fontStyle:'italic',
                    fontSize:12.5, color: C.slate }}>{kpi.sub}</div>
    </div>
  );
}

function PriorityBadge({ p }) {
  const map = {
    HIGH: { bg: C.crimson, fg:'white' },
    MED:  { bg: C.gold,    fg:'white' },
    LOW:  { bg: C.faint,   fg: C.ink },
  };
  const s = map[p];
  return (
    <span style={{
      padding:'2px 8px', background: s.bg, color: s.fg,
      fontFamily: FONT_MONO, fontSize: 9, fontWeight: 700, letterSpacing:'0.12em',
    }}>{p}</span>
  );
}

// ============================================================
// SIDE NAV
// ============================================================
function SideNav({ current, onChange }) {
  const sections = [
    {
      label: 'ORIGINATE',
      items: [
        { id:'dashboard',  icon: Activity,    label:'Dashboard',  hint:'Executive view' },
        { id:'inbox',      icon: Inbox,       label:'Inbox',      hint:'External requests', badge:'12' },
        { id:'pipeline',   icon: TrendingUp,  label:'Pipeline',   hint:'Opportunities' },
        { id:'intel',      icon: Eye,         label:'Intel',      hint:'Competitive · events' },
      ]
    },
    {
      label: 'DELIVER',
      items: [
        { id:'lifecycle',   icon: Layers,        label:'Lifecycle',   hint:'Stage gates' },
        { id:'evaluate',    icon: Target,        label:'Evaluate',    hint:'Notes · scorecards' },
        { id:'stakeholders',icon: Network,       label:'Stakeholders',hint:'Alignment · map' },
        { id:'governance',  icon: MessageSquare, label:'Governance',  hint:'Discuss · decide', badge:'3' },
      ]
    },
    {
      label: 'METHOD',
      items: [
        { id:'reports',    icon: BarChart3,  label:'Reports',    hint:'Spider · journey' },
        { id:'templates',  icon: ScrollText, label:'Templates',  hint:'Library · RACI' },
        { id:'framework',  icon: BookOpen,   label:'Framework',  hint:'Methodology' },
      ]
    },
  ];

  return (
    <aside style={{ width: 240, background: C.ink, color: C.paper, position:'sticky', top:0,
                    height:'100vh', display:'flex', flexDirection:'column',
                    borderRight: `1px solid ${C.crimsonDk}`, overflow:'auto' }}>
      {/* Brand */}
      <div style={{ padding:'24px 22px 22px', borderBottom: `1px solid ${C.inkSoft}` }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:36, height:36, background: C.crimson,
                        display:'grid', placeItems:'center', fontFamily: FONT_HEAD,
                        fontSize: 18, fontWeight: 600, fontStyle:'italic', color:'white' }}>JA</div>
          <div>
            <div style={{ fontFamily: FONT_HEAD, fontSize: 16, fontWeight: 500, color:'white',
                          lineHeight: 1.15 }}>Partnership<br/>Dashboard</div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: C.gold, letterSpacing:'0.14em', marginTop:4 }}>
              JOAQUÍN · AZ DS&AI
            </div>
          </div>
        </div>
      </div>

      {/* Nav sections */}
      <nav style={{ flex:1, padding:'16px 8px' }}>
        {sections.map((sec, si) => (
          <div key={sec.label} style={{ marginBottom: 14 }}>
            <div style={{ padding:'6px 12px 8px', fontFamily: FONT_MONO, fontSize: 9.5,
                          fontWeight: 700, letterSpacing:'0.18em', color: C.faint }}>
              {sec.label}
            </div>
            {sec.items.map(item => {
              const Icon = item.icon;
              const active = current === item.id;
              return (
                <button key={item.id} onClick={() => onChange(item.id)}
                  style={{
                    width:'100%', display:'flex', alignItems:'center', gap:12,
                    padding:'10px 12px', marginBottom:1,
                    background: active ? C.crimson : 'transparent',
                    color: active ? 'white' : C.faint,
                    border: 'none', cursor:'pointer', textAlign:'left',
                    transition:'all 0.15s', fontFamily: 'inherit',
                  }}
                  onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = C.inkSoft; e.currentTarget.style.color = 'white'; }}}
                  onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.faint; }}}>
                  <Icon size={16} strokeWidth={active ? 2 : 1.6}/>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize: 13, fontWeight: active ? 600 : 500,
                                  color: active ? 'white' : 'inherit', display:'flex', alignItems:'center', gap: 8 }}>
                      {item.label}
                      {item.badge && (
                        <span style={{ background: active ? 'white' : C.crimson, color: active ? C.crimson : 'white',
                                       fontFamily: FONT_MONO, fontSize: 9, fontWeight: 700,
                                       padding:'1px 5px', borderRadius: 2 }}>{item.badge}</span>
                      )}
                    </div>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 8.5, letterSpacing:'0.06em',
                                  color: active ? '#f5d9b5' : C.slate, marginTop:1 }}>
                      {item.hint.toUpperCase()}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding:'14px 22px', borderTop: `1px solid ${C.inkSoft}` }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width: 28, height:28, borderRadius:'50%', background: C.gold,
                        display:'grid', placeItems:'center', fontFamily: FONT_HEAD,
                        fontSize: 12, fontWeight: 600, color:'white' }}>JA</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize: 12, color:'white', fontWeight:500 }}>Joaquín A.</div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 8.5, color: C.gold, letterSpacing:'0.10em' }}>
              PARTNERSHIP DIR.
            </div>
          </div>
          <Bell size={13} color={C.faint}/>
        </div>
      </div>
    </aside>
  );
}

// ============================================================
// TOPBAR (per-view)
// ============================================================
function ViewHeader({ tag, title, dek, actions }) {
  return (
    <div style={{ padding:'32px 40px 24px', borderBottom: `1px solid ${C.rule}`,
                  background: 'linear-gradient(180deg, #fefcf7 0%, transparent 100%)' }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap: 40 }}>
        <div style={{ flex:1 }}>
          <MonoLabel color={C.crimson} size={11} ls={0.20}>{tag}</MonoLabel>
          <h1 style={{ fontFamily: FONT_HEAD, fontSize: 36, fontWeight: 400,
                       letterSpacing:'-0.02em', color: C.ink, marginTop: 10, lineHeight: 1.1 }}>
            {title}
          </h1>
          {dek && (
            <p style={{ fontFamily: FONT_HEAD, fontSize: 15.5, fontStyle:'italic',
                        color: C.inkSoft, marginTop: 10, maxWidth: 780, lineHeight: 1.5 }}>{dek}</p>
          )}
        </div>
        {actions && <div style={{ display:'flex', gap: 10, paddingTop: 6 }}>{actions}</div>}
      </div>
    </div>
  );
}

function ActionBtn({ icon: Icon, label, primary = false, onClick }) {
  return (
    <button onClick={onClick} style={{
      display:'inline-flex', alignItems:'center', gap: 8,
      padding:'9px 14px',
      background: primary ? C.crimson : C.surface,
      color: primary ? 'white' : C.ink,
      border: `1px solid ${primary ? C.crimson : C.rule}`,
      fontFamily: FONT_MONO, fontSize: 10.5, fontWeight: 600, letterSpacing:'0.10em',
      textTransform:'uppercase', cursor:'pointer',
      transition:'all 0.15s',
    }}
    onMouseEnter={(e) => { if (!primary) e.currentTarget.style.borderColor = C.ink; }}
    onMouseLeave={(e) => { if (!primary) e.currentTarget.style.borderColor = C.rule; }}>
      {Icon && <Icon size={13}/>}
      {label}
    </button>
  );
}

// ============================================================
// DASHBOARD VIEW
// ============================================================
function DashboardView() {
  return (
    <div>
      <ViewHeader
        tag="OVERVIEW · 19 MAY 2026"
        title="The state of the function."
        dek="Six metrics, ten stages, one decision queue. The plane where you start the morning."
        actions={[
          <ActionBtn key="x" icon={Search} label="Search"/>,
          <ActionBtn key="r" icon={Plus} label="Log opportunity" primary/>,
        ]}
      />

      <div style={{ padding:'32px 40px', maxWidth: 1400 }}>

        {/* KPI Row */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap: 12, marginBottom: 32 }}>
          {KPIS.map((k, i) => <KPICard key={i} kpi={k}/>)}
        </div>

        {/* Funnel section */}
        <div style={{ background: C.surface, border:`1px solid ${C.rule}`, padding:'28px 32px', marginBottom: 24 }}>
          <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom: 24 }}>
            <div>
              <MonoLabel color={C.crimson} size={10} ls={0.18}>PIPELINE · ALL STAGES</MonoLabel>
              <Serif size={24} weight={400} style={{ display:'block', marginTop: 6 }}>
                225 opportunities flowing across ten stages.
              </Serif>
            </div>
            <div style={{ display:'flex', gap: 20, alignItems:'center' }}>
              <FlowLegend color={C.faint} label="UPSTREAM"/>
              <FlowLegend color={C.gold} label="EVAL"/>
              <FlowLegend color={C.crimson} label="MIDSTREAM"/>
              <FlowLegend color={C.crimsonDk} label="MOBILISE"/>
              <FlowLegend color={C.navy} label="RENEW"/>
            </div>
          </div>

          {/* Funnel — custom SVG */}
          <FunnelChart/>
        </div>

        {/* Two-column: heatmap + decisions */}
        <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap: 24, marginBottom: 24 }}>

          {/* TA × Capability heatmap */}
          <div style={{ background: C.surface, border:`1px solid ${C.rule}`, padding:'24px 28px' }}>
            <MonoLabel color={C.crimson} size={10} ls={0.18}>PORTFOLIO · TA × CAPABILITY</MonoLabel>
            <Serif size={20} weight={400} style={{ display:'block', marginTop: 6, marginBottom: 18 }}>
              Where coverage is dense, and where it isn't.
            </Serif>
            <Heatmap/>
            <div style={{ marginTop: 16, fontFamily: FONT_HEAD, fontSize: 12.5, fontStyle:'italic',
                          color: C.slate, borderTop:`1px solid ${C.rule}`, paddingTop: 12 }}>
              Oncology over-indexed (correctly). Rare disease + agentic capability the obvious next bet.
            </div>
          </div>

          {/* Decisions queue */}
          <div style={{ background: C.surface, border:`1px solid ${C.rule}`, padding:'24px 28px' }}>
            <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between' }}>
              <div>
                <MonoLabel color={C.crimson} size={10} ls={0.18}>DECISIONS NEEDED</MonoLabel>
                <Serif size={20} weight={400} style={{ display:'block', marginTop: 6 }}>5 items on your plate.</Serif>
              </div>
              <span style={{ background: C.crimson, color:'white', padding:'4px 10px',
                             fontFamily: FONT_MONO, fontSize: 10, fontWeight:700, letterSpacing:'0.12em' }}>
                2 OVERDUE
              </span>
            </div>
            <div style={{ marginTop: 18 }}>
              {DECISIONS.map((d) => <DecisionRow key={d.id} d={d}/>)}
            </div>
          </div>

        </div>

        {/* Bottom: Adoption + Activity feed */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 24 }}>

          {/* Adoption metrics */}
          <div style={{ background: C.surface, border:`1px solid ${C.rule}`, padding:'24px 28px' }}>
            <MonoLabel color={C.crimson} size={10} ls={0.18}>FRAMEWORK ADOPTION</MonoLabel>
            <Serif size={20} weight={400} style={{ display:'block', marginTop: 6, marginBottom: 6 }}>
              Discipline adoption across in-flight deals.
            </Serif>
            <div style={{ fontFamily: FONT_HEAD, fontStyle:'italic', fontSize: 13, color: C.slate, marginBottom: 18 }}>
              The closer the gap to target, the closer the function is to operating system.
            </div>
            {ADOPTION.map((a, i) => <AdoptionRow key={i} a={a}/>)}
          </div>

          {/* Activity feed */}
          <div style={{ background: C.surface, border:`1px solid ${C.rule}`, padding:'24px 28px' }}>
            <MonoLabel color={C.crimson} size={10} ls={0.18}>RECENT ACTIVITY</MonoLabel>
            <Serif size={20} weight={400} style={{ display:'block', marginTop: 6, marginBottom: 18 }}>
              The last 96 hours.
            </Serif>
            <div>
              {ACTIVITY.map((a, i) => <ActivityRow key={i} a={a}/>)}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

function FlowLegend({ color, label }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap: 6 }}>
      <span style={{ width:10, height:10, background: color }}/>
      <MonoLabel size={9} ls={0.10}>{label}</MonoLabel>
    </span>
  );
}

function FunnelChart() {
  // Width per slot is dynamic; bars sit on a baseline
  // Each stage gets its own column
  const maxCount = Math.max(...STAGES.map(s => s.count));
  const colW = 100;     // each column width
  const gap = 6;        // gap between cols
  const totalW = STAGES.length * colW + (STAGES.length - 1) * gap;
  const baseH = 200;
  const maxBarH = 140;

  const stageColor = (s) => {
    if (s.n <= 2)  return C.faint;
    if (s.n <= 5)  return C.gold;
    if (s.n <= 8)  return C.crimson;
    if (s.n === 9) return C.crimsonDk;
    return C.navy;
  };

  return (
    <div style={{ overflowX:'auto' }}>
      <svg viewBox={`0 0 ${totalW + 80} ${baseH + 60}`} width="100%" style={{ display:'block' }}>

        {/* Stage bars */}
        {STAGES.map((s, i) => {
          const x = 40 + i * (colW + gap);
          const h = (s.count / maxCount) * maxBarH;
          const y = 40 + (maxBarH - h);
          const col = stageColor(s);
          return (
            <g key={s.n}>
              {/* Count label above bar */}
              <text x={x + colW/2} y={y - 8} textAnchor="middle"
                    style={{ fontFamily: FONT_HEAD, fontSize: 18, fontWeight: 500, fill: C.ink }}>
                {s.count}
              </text>
              {/* Bar */}
              <rect x={x} y={y} width={colW} height={h} fill={col}/>
              {/* Stage number under bar */}
              <text x={x + colW/2} y={40 + maxBarH + 24} textAnchor="middle"
                    style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, fill: C.slate, letterSpacing: '0.12em' }}>
                STAGE {String(s.n).padStart(2,'0')}
              </text>
              {/* Stage name */}
              <text x={x + colW/2} y={40 + maxBarH + 40} textAnchor="middle"
                    style={{ fontFamily: FONT_HEAD, fontSize: 13, fontStyle:'italic', fill: C.ink }}>
                {s.name}
              </text>
            </g>
          );
        })}

        {/* Baseline */}
        <line x1={20} y1={40 + maxBarH + 2} x2={totalW + 60} y2={40 + maxBarH + 2}
              stroke={C.ink} strokeWidth="1.5"/>
      </svg>
    </div>
  );
}

function Heatmap() {
  // Build pseudo-heatmap counts from PARTNERSHIPS for TA × Capability
  const counts = {};
  TAs.forEach(t => {
    counts[t.id] = {};
    CAPABILITIES.forEach(c => { counts[t.id][c] = 0; });
  });
  PARTNERSHIPS.forEach(p => {
    if (counts[p.cat] && counts[p.cat][p.cap] !== undefined) {
      counts[p.cat][p.cap]++;
    }
  });
  // Augment with some signal beyond just the 14 partnerships so heatmap is informative
  const augment = {
    onc:   {RWE: 5, Multi: 6, Disc: 3, Dig: 2, Ag: 1},
    cvrm:  {RWE: 2, Multi: 1, Disc: 4, Dig: 2, Ag: 0},
    rare:  {RWE: 1, Multi: 1, Disc: 1, Dig: 1, Ag: 0},
    resp:  {RWE: 2, Multi: 1, Disc: 1, Dig: 2, Ag: 0},
    cross: {RWE: 3, Multi: 2, Disc: 1, Dig: 3, Ag: 1},
  };
  // Use augment as the displayed counts
  return (
    <div>
      {/* Header row */}
      <div style={{ display:'grid', gridTemplateColumns: `140px repeat(${CAPABILITIES.length}, 1fr)`,
                    gap: 4, marginBottom: 6 }}>
        <div/>
        {CAPABILITIES.map((c, i) => (
          <div key={i} style={{ fontFamily: FONT_MONO, fontSize: 9.5, fontWeight: 700,
                                color: C.slate, letterSpacing:'0.10em', textAlign:'center',
                                textTransform:'uppercase', paddingBottom: 4 }}>
            {c}
          </div>
        ))}
      </div>
      {TAs.map((t, ri) => {
        const row = augment[t.id];
        const keys = ['RWE','Multi','Disc','Dig','Ag'];
        return (
          <div key={t.id} style={{ display:'grid', gridTemplateColumns:`140px repeat(${CAPABILITIES.length}, 1fr)`,
                                   gap: 4, marginBottom: 4 }}>
            <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
              <span style={{ width: 4, height: 22, background: t.color }}/>
              <span style={{ fontFamily: FONT_HEAD, fontSize: 13.5, fontWeight: 500, color: C.ink }}>{t.name}</span>
            </div>
            {keys.map((k, ci) => {
              const v = row[k];
              // Intensity: 0=very light, 6+=deep
              const intensity = Math.min(v / 6, 1);
              const bg = v === 0 ? C.cream
                       : `rgba(158, 42, 43, ${0.12 + intensity * 0.65})`;
              const textColor = v >= 4 ? 'white' : v === 0 ? C.faint : C.ink;
              return (
                <div key={ci} style={{ background: bg, height: 44, display:'grid', placeItems:'center',
                                       fontFamily: FONT_HEAD, fontSize: 20, fontWeight: 500, color: textColor,
                                       border: `1px solid ${C.ruleSoft}` }}>
                  {v === 0 ? '·' : v}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function DecisionRow({ d }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'auto 1fr auto', gap: 14, padding:'14px 0',
                  borderTop: `1px solid ${C.ruleSoft}`, alignItems:'center' }}>
      <PriorityBadge p={d.prio}/>
      <div>
        <div style={{ fontSize: 13.5, color: C.ink, fontWeight: 500 }}>{d.partnership}</div>
        <div style={{ fontFamily: FONT_HEAD, fontSize: 12.5, fontStyle:'italic', color: C.slate, marginTop: 2 }}>
          {d.what}
        </div>
      </div>
      <div style={{ textAlign:'right' }}>
        <div style={{ fontFamily: FONT_MONO, fontSize: 10.5, fontWeight: 600, color: C.crimson, letterSpacing:'0.08em' }}>
          DUE {d.by.toUpperCase()}
        </div>
        <div style={{ fontFamily: FONT_MONO, fontSize: 9.5, color: C.faint, letterSpacing:'0.08em', marginTop: 2 }}>
          STAGE {String(d.stage).padStart(2,'0')}
        </div>
      </div>
    </div>
  );
}

function AdoptionRow({ a }) {
  const gap = a.target - a.pct;
  const gapColor = gap <= 5 ? C.green : gap <= 15 ? C.gold : C.crimson;
  return (
    <div style={{ padding:'10px 0', borderTop: `1px solid ${C.ruleSoft}` }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: C.ink, fontWeight: 500 }}>{a.lbl}</span>
        <span>
          <span style={{ fontFamily: FONT_MONO, fontSize: 13, fontWeight: 700, color: C.ink }}>{a.pct}%</span>
          <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.faint, marginLeft: 6 }}>/ {a.target}%</span>
        </span>
      </div>
      <div style={{ background: C.ruleSoft, height: 6, position:'relative' }}>
        <div style={{ width: `${a.pct}%`, height:'100%', background: gapColor }}/>
        {/* target marker */}
        <div style={{ position:'absolute', left:`${a.target}%`, top:-2, bottom:-2, width: 2, background: C.ink }}/>
      </div>
    </div>
  );
}

function ActivityRow({ a }) {
  const Icon = a.icon;
  return (
    <div style={{ display:'flex', gap: 12, padding:'12px 0', borderTop:`1px solid ${C.ruleSoft}` }}>
      <div style={{ width: 28, height: 28, background: a.c + '15', display:'grid', placeItems:'center',
                    flexShrink: 0 }}>
        <Icon size={14} color={a.c} strokeWidth={2}/>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: C.ink, lineHeight: 1.45 }}>{a.text}</div>
        <div style={{ display:'flex', gap: 10, marginTop: 3 }}>
          <span style={{ fontFamily: FONT_MONO, fontSize: 9.5, color: C.faint, letterSpacing:'0.08em' }}>
            {a.when.toUpperCase()} AGO
          </span>
          <span style={{ fontFamily: FONT_HEAD, fontSize: 11.5, fontStyle:'italic', color: C.slate }}>
            {a.who}
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// PIPELINE VIEW
// ============================================================
function PipelineView() {
  const [filterTA, setFilterTA] = useState('all');
  const [filterCap, setFilterCap] = useState('all');
  const [filterStage, setFilterStage] = useState('all');

  const filtered = PARTNERSHIPS.filter(p => {
    if (filterTA !== 'all' && p.cat !== filterTA) return false;
    if (filterCap !== 'all' && p.cap !== filterCap) return false;
    if (filterStage !== 'all') {
      const range = filterStage;
      if (range === 'upstream' && p.stage > 3) return false;
      if (range === 'mid' && (p.stage < 4 || p.stage > 8)) return false;
      if (range === 'downstream' && p.stage < 9) return false;
    }
    return true;
  });

  return (
    <div>
      <ViewHeader
        tag="PIPELINE · ORIGINATE"
        title="The opportunity pipeline."
        dek="225 opportunities · filterable by therapeutic area, capability, and stage. Source-tagged. Always one click from the next action."
        actions={[
          <ActionBtn key="i" icon={Filter} label="Filters"/>,
          <ActionBtn key="p" icon={Plus} label="Add opportunity" primary/>,
        ]}
      />

      <div style={{ padding:'24px 40px' }}>

        {/* Filter bar */}
        <div style={{ display:'flex', flexWrap:'wrap', gap: 6, marginBottom: 24, alignItems:'center',
                      padding:'16px 18px', background: C.cream, border:`1px solid ${C.rule}` }}>
          <MonoLabel color={C.slate} size={10} ls={0.14}>FILTER</MonoLabel>
          <span style={{ width: 1, height: 18, background: C.rule, margin:'0 8px' }}/>

          <FilterGroup label="TA">
            <FilterPill active={filterTA==='all'} onClick={() => setFilterTA('all')}>All</FilterPill>
            {TAs.map(t => (
              <FilterPill key={t.id} active={filterTA===t.id} onClick={() => setFilterTA(t.id)} accent={t.color}>
                {t.name}
              </FilterPill>
            ))}
          </FilterGroup>

          <span style={{ width: 1, height: 18, background: C.rule, margin:'0 8px' }}/>

          <FilterGroup label="STAGE">
            <FilterPill active={filterStage==='all'} onClick={() => setFilterStage('all')}>All</FilterPill>
            <FilterPill active={filterStage==='upstream'} onClick={() => setFilterStage('upstream')}>Upstream (1-3)</FilterPill>
            <FilterPill active={filterStage==='mid'} onClick={() => setFilterStage('mid')}>Mid (4-8)</FilterPill>
            <FilterPill active={filterStage==='downstream'} onClick={() => setFilterStage('downstream')}>Downstream (9-10)</FilterPill>
          </FilterGroup>

          <span style={{ marginLeft:'auto', fontFamily: FONT_MONO, fontSize: 10.5, fontWeight: 600, color: C.crimson, letterSpacing:'0.10em' }}>
            {filtered.length} OF {PARTNERSHIPS.length} SHOWN
          </span>
        </div>

        {/* Stage stripe summary */}
        <div style={{ marginBottom: 24 }}>
          <StageStripe partnerships={filtered}/>
        </div>

        {/* Cards grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(360px, 1fr))', gap: 14 }}>
          {filtered.map(p => <PartnershipCard key={p.id} p={p}/>)}
        </div>

      </div>
    </div>
  );
}

function FilterGroup({ label, children }) {
  return (
    <div style={{ display:'inline-flex', alignItems:'center', gap: 4 }}>
      <MonoLabel color={C.faint} size={9} ls={0.14}>{label}</MonoLabel>
      <div style={{ display:'inline-flex', gap: 4, marginLeft: 4 }}>{children}</div>
    </div>
  );
}

function FilterPill({ active, onClick, children, accent }) {
  const ac = accent || C.crimson;
  return (
    <button onClick={onClick} style={{
      padding:'5px 10px',
      background: active ? ac : 'transparent',
      color: active ? 'white' : C.ink,
      border:`1px solid ${active ? ac : C.rule}`,
      fontFamily: FONT_MONO, fontSize: 10.5, fontWeight: 600, letterSpacing:'0.06em',
      cursor:'pointer', transition:'all 0.15s',
    }}>{children}</button>
  );
}

function StageStripe({ partnerships }) {
  // Group partnerships by stage
  const byStage = {};
  for (let i = 1; i <= 10; i++) byStage[i] = [];
  partnerships.forEach(p => byStage[p.stage].push(p));

  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(10, 1fr)', gap: 4 }}>
      {STAGES.map(s => {
        const ps = byStage[s.n];
        const color = s.n <= 2 ? C.faint : s.n <= 5 ? C.gold : s.n <= 8 ? C.crimson : s.n === 9 ? C.crimsonDk : C.navy;
        return (
          <div key={s.n} style={{ background: C.surface, border:`1px solid ${C.rule}`,
                                  borderTop:`3px solid ${color}`, padding:'10px 8px' }}>
            <MonoLabel color={C.slate} size={9} ls={0.10}>STAGE {String(s.n).padStart(2,'0')}</MonoLabel>
            <div style={{ fontFamily: FONT_HEAD, fontSize: 12.5, fontWeight:500, color: C.ink, marginTop: 4, lineHeight: 1.2 }}>
              {s.name}
            </div>
            <div style={{ marginTop: 8, fontFamily: FONT_HEAD, fontSize: 22, fontWeight: 500, color: color }}>
              {ps.length}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PartnershipCard({ p }) {
  const ta = taById(p.cat);
  return (
    <div style={{
      background: C.surface, border:`1px solid ${C.rule}`,
      padding: 0, position:'relative', display:'flex', flexDirection:'column',
      transition: 'all 0.15s', cursor: 'pointer',
    }}
    onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.ink; e.currentTarget.style.boxShadow = '0 4px 12px rgba(27,31,42,0.05)';}}
    onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.rule; e.currentTarget.style.boxShadow = 'none';}}>

      {/* Top stripe with TA color */}
      <div style={{ height: 4, background: ta.color }}/>

      <div style={{ padding:'18px 20px 16px' }}>
        {/* Top: name + alert */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <Serif size={20} weight={500}>{p.name}</Serif>
            <div style={{ display:'flex', alignItems:'center', gap: 8, marginTop: 6, color: C.slate }}>
              <MapPin size={11}/>
              <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.slate, letterSpacing:'0.06em' }}>
                {p.loc.toUpperCase()}
              </span>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap: 6 }}>
            <HealthDot health={p.health}/>
            {p.alert > 0 && (
              <div style={{ display:'inline-flex', alignItems:'center', gap: 3,
                            padding:'2px 6px', background: C.crimsonPale, color: C.crimson,
                            fontFamily: FONT_MONO, fontSize: 9, fontWeight: 700, letterSpacing:'0.08em' }}>
                <AlertCircle size={10}/>
                {p.alert}
              </div>
            )}
          </div>
        </div>

        {/* Tags row */}
        <div style={{ display:'flex', gap: 6, marginTop: 12, flexWrap:'wrap' }}>
          <TAChip ta={p.cat}/>
          <span style={{ fontFamily: FONT_MONO, fontSize: 9.5, fontWeight: 600,
                         padding:'2px 8px', background: C.creamDeep, color: C.ink,
                         letterSpacing:'0.08em' }}>{p.cap.toUpperCase()}</span>
          <span style={{ fontFamily: FONT_MONO, fontSize: 9.5, fontWeight: 600,
                         padding:'2px 8px', background: C.ink, color: 'white',
                         letterSpacing:'0.08em' }}>{p.tag}</span>
        </div>

        {/* Capability description */}
        <div style={{ marginTop: 14, fontFamily: FONT_HEAD, fontSize: 13.5, fontStyle:'italic',
                      color: C.inkSoft, lineHeight: 1.45 }}>
          Sponsor · {p.sponsor} · {p.structure}
        </div>

        {/* Stage progress */}
        <div style={{ marginTop: 18 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom: 6 }}>
            <MonoLabel color={C.slate} size={9} ls={0.12}>STAGE {String(p.stage).padStart(2,'0')} · {STAGES[p.stage-1].name.toUpperCase()}</MonoLabel>
            <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.slate, letterSpacing:'0.08em' }}>
              {p.days}D IN STAGE
            </span>
          </div>
          <StageProgress stage={p.stage}/>
        </div>

        {/* Footer: value + next */}
        <div style={{ marginTop: 14, paddingTop: 12, borderTop:`1px solid ${C.ruleSoft}`,
                      display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
          <div>
            <MonoLabel color={C.faint} size={9}>VALUE</MonoLabel>
            <div style={{ fontFamily: FONT_HEAD, fontSize: 14, fontWeight: 500, color: C.ink, marginTop: 2 }}>
              {p.value}
            </div>
          </div>
          <div style={{ textAlign:'right', flex: 1, marginLeft: 16 }}>
            <MonoLabel color={C.faint} size={9}>NEXT</MonoLabel>
            <div style={{ fontFamily: FONT_HEAD, fontSize: 12.5, fontStyle:'italic', color: C.crimson, marginTop: 2 }}>
              {p.next}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// LIFECYCLE VIEW
// ============================================================
function LifecycleView() {
  const [sortBy, setSortBy] = useState('stage');
  const inFlight = useMemo(() => {
    const list = PARTNERSHIPS.filter(p => p.stage >= 3 && p.stage <= 9);
    if (sortBy === 'stage') return [...list].sort((a, b) => b.stage - a.stage);
    if (sortBy === 'days')  return [...list].sort((a, b) => b.days - a.days);
    if (sortBy === 'health') return [...list].sort((a, b) => {
      const order = {red:0, amber:1, green:2};
      return order[a.health] - order[b.health];
    });
    return list;
  }, [sortBy]);

  return (
    <div>
      <ViewHeader
        tag="LIFECYCLE · STAGE GATES"
        title="Every in-flight deal, every stage."
        dek="Twenty-nine partnerships moving through gates 3 through 9. Stage owners, artefacts, days in stage. The plane where you spend most of your time."
        actions={[
          <ActionBtn key="r" icon={GitBranch} label="Stage report"/>,
          <ActionBtn key="e" icon={FileText} label="Export" primary/>,
        ]}
      />

      <div style={{ padding:'24px 40px' }}>

        {/* Sort bar */}
        <div style={{ display:'flex', alignItems:'center', gap: 12, marginBottom: 18 }}>
          <MonoLabel color={C.slate} size={10}>SORT</MonoLabel>
          <FilterPill active={sortBy==='stage'} onClick={() => setSortBy('stage')}>Stage</FilterPill>
          <FilterPill active={sortBy==='days'} onClick={() => setSortBy('days')}>Days in stage</FilterPill>
          <FilterPill active={sortBy==='health'} onClick={() => setSortBy('health')}>Health</FilterPill>
          <span style={{ marginLeft:'auto', fontFamily: FONT_MONO, fontSize: 10.5, color: C.crimson, fontWeight: 600, letterSpacing:'0.10em' }}>
            {inFlight.length} IN FLIGHT
          </span>
        </div>

        {/* Lifecycle table */}
        <div style={{ background: C.surface, border:`1px solid ${C.rule}` }}>

          {/* Header */}
          <div style={{ display:'grid', gridTemplateColumns:'1.6fr 0.8fr 2.2fr 0.6fr 1.3fr 1.4fr',
                        gap: 12, padding:'14px 20px', borderBottom:`1px solid ${C.rule}`,
                        background: C.ink, color:'white' }}>
            <MonoLabel color="white" size={9.5} ls={0.14}>PARTNERSHIP</MonoLabel>
            <MonoLabel color="white" size={9.5} ls={0.14}>TA</MonoLabel>
            <MonoLabel color="white" size={9.5} ls={0.14}>10-STAGE PROGRESSION</MonoLabel>
            <MonoLabel color="white" size={9.5} ls={0.14}>DAYS</MonoLabel>
            <MonoLabel color="white" size={9.5} ls={0.14}>SPONSOR</MonoLabel>
            <MonoLabel color="white" size={9.5} ls={0.14}>NEXT MILESTONE</MonoLabel>
          </div>

          {/* Rows */}
          {inFlight.map((p, i) => (
            <div key={p.id} style={{ display:'grid', gridTemplateColumns:'1.6fr 0.8fr 2.2fr 0.6fr 1.3fr 1.4fr',
                                     gap: 12, padding:'14px 20px',
                                     borderBottom: i < inFlight.length - 1 ? `1px solid ${C.ruleSoft}` : 'none',
                                     alignItems:'center', transition:'background 0.12s' }}
                 onMouseEnter={(e) => e.currentTarget.style.background = C.cream}
                 onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>

              <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
                <HealthDot health={p.health}/>
                <div>
                  <Serif size={14.5} weight={500}>{p.name}</Serif>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 9.5, color: C.faint, letterSpacing:'0.06em', marginTop:1 }}>
                    {p.loc.toUpperCase()}
                  </div>
                </div>
              </div>

              <div><TAChip ta={p.cat}/></div>

              <div>
                <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
                  <StageDots stage={p.stage}/>
                  <div>
                    <MonoLabel color={C.crimson} size={9.5}>STAGE {String(p.stage).padStart(2,'0')}</MonoLabel>
                    <div style={{ fontFamily: FONT_HEAD, fontSize: 12.5, fontStyle:'italic', color: C.inkSoft }}>
                      {STAGES[p.stage-1].name}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <span style={{ fontFamily: FONT_HEAD, fontSize: 17, fontWeight: 500,
                               color: p.days > 30 ? C.crimson : p.days > 20 ? C.gold : C.ink }}>
                  {p.days}
                </span>
                <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.faint, marginLeft: 3 }}>d</span>
              </div>

              <div style={{ fontSize: 12.5, color: C.inkSoft }}>{p.sponsor}</div>

              <div style={{ fontFamily: FONT_HEAD, fontSize: 12.5, fontStyle:'italic',
                            color: p.alert > 0 ? C.crimson : C.inkSoft }}>
                {p.alert > 0 && <AlertTriangle size={12} style={{ display:'inline', marginRight: 5, verticalAlign: '-1px' }}/>}
                {p.next}
              </div>
            </div>
          ))}
        </div>

        {/* Stage gate breakdown footer */}
        <div style={{ marginTop: 32, display:'grid', gridTemplateColumns:'1fr 1fr', gap: 24 }}>

          {/* Stage breakdown */}
          <div style={{ background: C.surface, border:`1px solid ${C.rule}`, padding:'22px 26px' }}>
            <MonoLabel color={C.crimson} size={10} ls={0.18}>STAGE BREAKDOWN · IN-FLIGHT</MonoLabel>
            <Serif size={18} weight={400} style={{ display:'block', marginTop: 6, marginBottom: 14 }}>
              Stage concentration suggests upstream stretch.
            </Serif>
            {[3,4,5,6,7,8,9].map(n => {
              const count = inFlight.filter(p => p.stage === n).length;
              const max = 5;
              const w = Math.max((count / max) * 100, 4);
              const col = n <= 5 ? C.gold : n <= 8 ? C.crimson : C.crimsonDk;
              return (
                <div key={n} style={{ display:'grid', gridTemplateColumns:'120px 1fr 30px', gap: 12,
                                       alignItems:'center', padding:'6px 0' }}>
                  <div>
                    <MonoLabel color={C.slate} size={9}>STAGE {String(n).padStart(2,'0')}</MonoLabel>
                    <div style={{ fontFamily: FONT_HEAD, fontSize: 12, color: C.inkSoft, fontStyle:'italic' }}>
                      {STAGES[n-1].name}
                    </div>
                  </div>
                  <div style={{ background: C.ruleSoft, height: 18, position:'relative' }}>
                    <div style={{ width: `${w}%`, height:'100%', background: col }}/>
                  </div>
                  <div style={{ fontFamily: FONT_HEAD, fontSize: 16, fontWeight: 500, textAlign:'right' }}>{count}</div>
                </div>
              );
            })}
          </div>

          {/* Aging warnings */}
          <div style={{ background: C.surface, border:`1px solid ${C.rule}`, padding:'22px 26px' }}>
            <MonoLabel color={C.crimson} size={10} ls={0.18}>AGING ALERTS</MonoLabel>
            <Serif size={18} weight={400} style={{ display:'block', marginTop: 6, marginBottom: 14 }}>
              Deals sitting too long in stage.
            </Serif>
            {inFlight.filter(p => p.days > 20).sort((a,b) => b.days - a.days).map(p => (
              <div key={p.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                                       padding:'10px 0', borderTop:`1px solid ${C.ruleSoft}` }}>
                <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
                  <HealthDot health={p.health}/>
                  <div>
                    <span style={{ fontSize: 13, color: C.ink, fontWeight: 500 }}>{p.name}</span>
                    <span style={{ fontFamily: FONT_HEAD, fontSize: 12, fontStyle:'italic', color: C.slate, marginLeft: 8 }}>
                      stuck at stage {p.stage}
                    </span>
                  </div>
                </div>
                <div style={{ fontFamily: FONT_HEAD, fontSize: 18, fontWeight: 500,
                              color: p.days > 30 ? C.crimson : C.gold }}>
                  {p.days}d
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

// ============================================================
// STAKEHOLDERS VIEW
// ============================================================
function StakeholdersView() {
  return (
    <div>
      <ViewHeader
        tag="STAKEHOLDERS · ALIGN"
        title="Who is in the room for which deal."
        dek="Six groups, fourteen partnerships, one alignment matrix. Sponsorship without engagement is theatre; engagement without sponsorship is risk."
        actions={[
          <ActionBtn key="r" icon={Users} label="Engagement plan"/>,
        ]}
      />

      <div style={{ padding:'24px 40px' }}>

        {/* Status legend */}
        <div style={{ display:'flex', flexWrap:'wrap', gap: 14, marginBottom: 24, padding:'14px 18px',
                      background: C.cream, border:`1px solid ${C.rule}` }}>
          <MonoLabel color={C.slate} size={10}>LEGEND</MonoLabel>
          {Object.entries(SH).map(([k, v]) => (
            <span key={k} style={{ display:'inline-flex', alignItems:'center', gap: 6 }}>
              <span style={{ width: 14, height: 14, background: v.bg, border:`1.5px solid ${v.color}`,
                             display:'grid', placeItems:'center', color: v.color, fontSize: 9, fontWeight: 700 }}>
                {v.dot}
              </span>
              <MonoLabel color={v.color} size={10}>{v.lbl.toUpperCase()}</MonoLabel>
            </span>
          ))}
        </div>

        {/* Stakeholder summary stats */}
        <div style={{ display:'grid', gridTemplateColumns:`repeat(${STAKEHOLDERS.length}, 1fr)`, gap: 8, marginBottom: 24 }}>
          {STAKEHOLDERS.map(s => {
            const Icon = s.icon;
            // Count by status
            const counts = { sponsor:0, engaged:0, aligned:0, pending:0, blocked:0 };
            PARTNERSHIPS.forEach(p => { counts[p.sh[s.id]]++; });
            return (
              <div key={s.id} style={{ background: C.surface, border:`1px solid ${C.rule}`,
                                       padding:'14px 16px', borderTop:`3px solid ${C.crimson}` }}>
                <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
                  <Icon size={14} color={C.crimson}/>
                  <Serif size={13.5} weight={500}>{s.name}</Serif>
                </div>
                <div style={{ marginTop: 12, display:'flex', gap: 8, alignItems:'baseline' }}>
                  <Serif size={28} weight={400} color={C.crimson}>{counts.sponsor + counts.engaged}</Serif>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.faint }}>/ {PARTNERSHIPS.length}</span>
                </div>
                <div style={{ fontFamily: FONT_HEAD, fontStyle:'italic', fontSize: 11, color: C.slate, marginTop: 2 }}>
                  active engagements
                </div>
              </div>
            );
          })}
        </div>

        {/* Matrix */}
        <div style={{ background: C.surface, border:`1px solid ${C.rule}`, overflow:'hidden' }}>
          <div style={{ padding:'18px 24px', borderBottom:`1px solid ${C.rule}` }}>
            <MonoLabel color={C.crimson} size={10} ls={0.18}>ALIGNMENT MATRIX</MonoLabel>
            <Serif size={22} weight={400} style={{ display:'block', marginTop: 6 }}>
              Partnership × Stakeholder.
            </Serif>
          </div>

          {/* Header row */}
          <div style={{ display:'grid', gridTemplateColumns:`240px 60px repeat(${STAKEHOLDERS.length}, 1fr) 80px`,
                        gap: 0, padding:'10px 20px', background: C.cream, borderBottom:`1px solid ${C.rule}` }}>
            <MonoLabel color={C.slate} size={9.5}>PARTNERSHIP</MonoLabel>
            <MonoLabel color={C.slate} size={9.5}>STAGE</MonoLabel>
            {STAKEHOLDERS.map(s => (
              <div key={s.id} style={{ textAlign:'center' }}>
                <MonoLabel color={C.slate} size={9.5}>{s.short}</MonoLabel>
              </div>
            ))}
            <div style={{ textAlign:'right' }}>
              <MonoLabel color={C.slate} size={9.5}>HEALTH</MonoLabel>
            </div>
          </div>

          {/* Body rows */}
          {PARTNERSHIPS.map((p, i) => (
            <div key={p.id} style={{ display:'grid', gridTemplateColumns:`240px 60px repeat(${STAKEHOLDERS.length}, 1fr) 80px`,
                                     gap: 0, padding:'10px 20px', alignItems:'center',
                                     borderBottom: i < PARTNERSHIPS.length-1 ? `1px solid ${C.ruleSoft}` : 'none',
                                     transition: 'background 0.12s' }}
                 onMouseEnter={(e) => e.currentTarget.style.background = C.cream}
                 onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>

              <div>
                <Serif size={13.5} weight={500}>{p.name}</Serif>
                <div style={{ marginTop: 1 }}><TAChip ta={p.cat} size="sm"/></div>
              </div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 11.5, fontWeight: 600, color: C.slate }}>
                {String(p.stage).padStart(2,'0')}
              </div>
              {STAKEHOLDERS.map(s => {
                const status = p.sh[s.id];
                const sd = SH[status];
                return (
                  <div key={s.id} style={{ display:'grid', placeItems:'center' }}>
                    <div style={{
                      width: 30, height: 30,
                      background: sd.bg,
                      border:`1.5px solid ${sd.color}`,
                      display:'grid', placeItems:'center',
                      color: sd.color, fontSize: 12, fontWeight: 700,
                      transition:'all 0.12s', cursor:'help',
                    }} title={`${s.name}: ${sd.lbl}`}>
                      {sd.dot}
                    </div>
                  </div>
                );
              })}
              <div style={{ textAlign:'right' }}>
                <HealthDot health={p.health}/>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

// ============================================================
// FRAMEWORK VIEW
// ============================================================
function FrameworkView() {
  const [tab, setTab] = useState('lifecycle');
  const tabs = [
    { id:'lifecycle', label:'10-stage lifecycle', icon: GitBranch },
    { id:'eval',      label:'8-dim evaluation',   icon: Target },
    { id:'dd',        label:'9-dim due diligence',icon: FileText },
    { id:'deal',      label:'Deal structures',    icon: Briefcase },
    { id:'mistakes',  label:'10 Director mistakes', icon: AlertTriangle },
  ];

  return (
    <div>
      <ViewHeader
        tag="FRAMEWORK · METHODOLOGY"
        title="The operating system, documented."
        dek="Five reusable frameworks · the working library every partnership decision routes through. Adoption tracked on the dashboard."
        actions={[<ActionBtn key="d" icon={FileText} label="Download library"/>]}
      />

      {/* Tab bar */}
      <div style={{ padding:'0 40px', borderBottom:`1px solid ${C.rule}`, background: C.cream }}>
        <div style={{ display:'flex', gap: 0, overflowX:'auto' }}>
          {tabs.map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                display:'inline-flex', alignItems:'center', gap: 8,
                padding:'14px 18px',
                background: 'transparent',
                color: active ? C.crimson : C.slate,
                border:'none',
                borderBottom: active ? `3px solid ${C.crimson}` : '3px solid transparent',
                fontFamily: FONT_HEAD, fontSize: 14.5, fontWeight: active ? 500 : 400,
                cursor:'pointer', whiteSpace:'nowrap',
                transition:'all 0.15s',
              }}>
                <Icon size={14}/>
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ padding:'32px 40px' }}>
        {tab==='lifecycle' && <FrameworkLifecycle/>}
        {tab==='eval' && <FrameworkEval/>}
        {tab==='dd' && <FrameworkDD/>}
        {tab==='deal' && <FrameworkDeal/>}
        {tab==='mistakes' && <FrameworkMistakes/>}
      </div>
    </div>
  );
}

function FrameworkLifecycle() {
  const stages = [
    { n:1, t:'Scouting',       dur:'Continuous',   who:'Director + A.Catalyst', art:'Pipeline list' },
    { n:2, t:'Triage',         dur:'1-2 weeks',    who:'Director + analyst',     art:'Opportunity brief' },
    { n:3, t:'Strategic fit',  dur:'2-4 weeks',    who:'Director + TA sponsor',  art:'Sponsor letter' },
    { n:4, t:'Evaluation',     dur:'4-8 weeks',    who:'Director + cross-fn',    art:'Scorecard' },
    { n:5, t:'Term sheet',     dur:'3-6 weeks',    who:'Director + BD + legal',  art:'Heads of terms' },
    { n:6, t:'Due diligence',  dur:'6-10 weeks',   who:'DD workstreams',         art:'DD report (9 dim.)' },
    { n:7, t:'Negotiation',    dur:'4-8 weeks',    who:'Director + BD + legal',  art:'Detailed terms' },
    { n:8, t:'Contracting',    dur:'2-4 weeks',    who:'Legal-led',              art:'Signed agreement' },
    { n:9, t:'Mobilisation',   dur:'60-90 days',   who:'Director + Alliance Mgr',art:'30/60/90 plan' },
    { n:10,t:'Renewal',        dur:'~year 1',      who:'Director + sponsor',     art:'Expansion case' },
  ];
  return (
    <div>
      <Serif size={26} weight={400} style={{ display:'block', marginBottom: 8 }}>
        Ten stages. No skip steps.
      </Serif>
      <p style={{ fontFamily: FONT_HEAD, fontSize: 15, fontStyle:'italic', color: C.slate, marginBottom: 28, maxWidth: 720 }}>
        Each stage has an owner, an artefact, a duration band. The stage gates are the discipline; the artefacts are the proof.
      </p>

      <div style={{ background: C.surface, border:`1px solid ${C.rule}` }}>
        <div style={{ display:'grid', gridTemplateColumns:'80px 1.4fr 1fr 1.4fr 1.4fr',
                      padding:'12px 20px', background: C.ink, color:'white' }}>
          <MonoLabel color="white" size={9.5}>STAGE</MonoLabel>
          <MonoLabel color="white" size={9.5}>NAME</MonoLabel>
          <MonoLabel color="white" size={9.5}>DURATION</MonoLabel>
          <MonoLabel color="white" size={9.5}>OWNER</MonoLabel>
          <MonoLabel color="white" size={9.5}>ARTEFACT</MonoLabel>
        </div>
        {stages.map((s, i) => (
          <div key={s.n} style={{ display:'grid', gridTemplateColumns:'80px 1.4fr 1fr 1.4fr 1.4fr',
                                  padding:'14px 20px', alignItems:'center',
                                  background: i % 2 === 0 ? C.surface : C.cream,
                                  borderBottom: i < stages.length-1 ? `1px solid ${C.ruleSoft}` : 'none' }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 13, fontWeight: 700, color: C.crimson, letterSpacing:'0.06em' }}>
              {String(s.n).padStart(2,'0')}
            </div>
            <Serif size={15} weight={500}>{s.t}</Serif>
            <div style={{ fontFamily: FONT_HEAD, fontSize: 13, fontStyle:'italic', color: C.slate }}>{s.dur}</div>
            <div style={{ fontSize: 13, color: C.inkSoft }}>{s.who}</div>
            <div style={{ fontFamily: FONT_HEAD, fontSize: 13.5, color: C.ink }}>{s.art}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FrameworkEval() {
  const dims = [
    { n:'01', t:'Strategic fit',          d:'TA fit · gap closure · pipeline impact', w:'HIGH' },
    { n:'02', t:'Maturity',                d:'TRL · clinical evidence · regulatory',   w:'HIGH' },
    { n:'03', t:'Data / IP defensibility', d:'Moat depth · exclusivity available',     w:'HIGH' },
    { n:'04', t:'EU / regulatory ready',   d:'GDPR · EHDS · AI Act · MDR posture',     w:'HIGH' },
    { n:'05', t:'Commercial model fit',    d:'License · alliance · JV · equity · M&A', w:'MED' },
    { n:'06', t:'Operational compat.',     d:'Stack · governance · velocity match',    w:'MED' },
    { n:'07', t:'People · culture · rep.', d:'Founders · team · prior outcomes',       w:'MED' },
    { n:'08', t:'Risk profile',            d:'Financial · legal · geopolitical',       w:'HIGH' },
  ];
  return (
    <div>
      <Serif size={26} weight={400} style={{ display:'block', marginBottom: 8 }}>
        Eight dimensions, scored 1–5. Total ≥30 advances.
      </Serif>
      <p style={{ fontFamily: FONT_HEAD, fontSize: 15, fontStyle:'italic', color: C.slate, marginBottom: 28, maxWidth: 720 }}>
        The pre-DD scorecard. Run before evaluation, not after — pre-empts anchor bias.
      </p>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 12 }}>
        {dims.map(d => (
          <div key={d.n} style={{ background: C.surface, border:`1px solid ${C.rule}`,
                                  borderLeft:`3px solid ${C.crimson}`, padding:'18px 20px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
              <MonoLabel color={C.crimson} size={10}>{d.n}</MonoLabel>
              <MonoLabel color={d.w==='HIGH'?C.crimson:C.gold} size={9} ls={0.12}>WEIGHT {d.w}</MonoLabel>
            </div>
            <Serif size={16} weight={500} style={{ display:'block', marginTop: 10, marginBottom: 8 }}>{d.t}</Serif>
            <div style={{ fontFamily: FONT_HEAD, fontSize: 12.5, fontStyle:'italic', color: C.slate, lineHeight: 1.5 }}>
              {d.d}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FrameworkDD() {
  const dims = [
    { n:'01', t:'Strategic / commercial',   d:'Market · TA fit · competitive landscape' },
    { n:'02', t:'Technical / scientific',    d:'Validity · evidence · benchmarks' },
    { n:'03', t:'Data assets',                d:'Provenance · consent · quality · rights' },
    { n:'04', t:'IP & freedom-to-operate',    d:'Patents · know-how · encumbrances' },
    { n:'05', t:'Regulatory',                 d:'FDA · EMA · MDR · AI Act · GDPR/EHDS' },
    { n:'06', t:'Financial',                  d:'Burn · runway · cap table · exits' },
    { n:'07', t:'Operational',                d:'Talent · governance · process maturity' },
    { n:'08', t:'Cultural / reputational',    d:'Founders · team · prior partner outcomes' },
    { n:'09', t:'Cybersecurity & privacy',    d:'SOC2 · HIPAA · ISO 27001 · breach hx' },
  ];
  return (
    <div>
      <Serif size={26} weight={400} style={{ display:'block', marginBottom: 8 }}>
        Nine dimensions, nine owners.
      </Serif>
      <p style={{ fontFamily: FONT_HEAD, fontSize: 15, fontStyle:'italic', color: C.slate, marginBottom: 28, maxWidth: 720 }}>
        The full DD battery before term-sheet signature. Each dim has a named owner; coverage tracked on dashboard.
      </p>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap: 12 }}>
        {dims.map(d => (
          <div key={d.n} style={{ background: C.surface, border:`1px solid ${C.rule}`,
                                  borderLeft:`3px solid ${C.crimson}`, padding:'16px 18px' }}>
            <MonoLabel color={C.crimson} size={10}>{d.n}</MonoLabel>
            <Serif size={15} weight={500} style={{ display:'block', marginTop: 8, marginBottom: 6 }}>{d.t}</Serif>
            <div style={{ fontFamily: FONT_HEAD, fontSize: 12.5, fontStyle:'italic', color: C.slate }}>{d.d}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FrameworkDeal() {
  const structures = [
    { t:'License',   commit:'High',   integ:'Low',  use:'Well-defined capability · clear scope' },
    { t:'Alliance',  commit:'Med',    integ:'Med',  use:'The workhorse · most AZ-pharma partnerships' },
    { t:'JV',        commit:'Med',    integ:'High', use:'Shared entity · neither side can do alone' },
    { t:'Equity',    commit:'Low',    integ:'Low',  use:'Signal + option · cheap to enter' },
    { t:'M&A',       commit:'V.High', integ:'V.High',use:'Full integration · weights are the asset (Modella)' },
  ];
  return (
    <div>
      <Serif size={26} weight={400} style={{ display:'block', marginBottom: 8 }}>
        Five structures. Match the structure to the bet.
      </Serif>
      <p style={{ fontFamily: FONT_HEAD, fontSize: 15, fontStyle:'italic', color: C.slate, marginBottom: 28, maxWidth: 720 }}>
        Most failed partnerships used the wrong structure for the underlying intent. Decide structure with intent in hand.
      </p>

      <div style={{ background: C.surface, border:`1px solid ${C.rule}` }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 3fr',
                      padding:'12px 20px', background: C.ink, color:'white' }}>
          <MonoLabel color="white" size={9.5}>STRUCTURE</MonoLabel>
          <MonoLabel color="white" size={9.5}>FIN. COMMITMENT</MonoLabel>
          <MonoLabel color="white" size={9.5}>INTEGRATION</MonoLabel>
          <MonoLabel color="white" size={9.5}>WHEN TO USE</MonoLabel>
        </div>
        {structures.map((s, i) => (
          <div key={s.t} style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 3fr',
                                  padding:'14px 20px',
                                  background: i%2===0 ? C.surface : C.cream,
                                  borderBottom: i < structures.length-1 ? `1px solid ${C.ruleSoft}` : 'none' }}>
            <Serif size={16} weight={500}>{s.t}</Serif>
            <div style={{ fontFamily: FONT_MONO, fontSize: 11.5, color: C.inkSoft, letterSpacing:'0.06em' }}>
              {s.commit.toUpperCase()}
            </div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 11.5, color: C.inkSoft, letterSpacing:'0.06em' }}>
              {s.integ.toUpperCase()}
            </div>
            <div style={{ fontFamily: FONT_HEAD, fontSize: 13.5, fontStyle:'italic', color: C.ink }}>{s.use}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FrameworkMistakes() {
  const mistakes = [
    { n:'01', t:'Source from BD only',           f:'UPSTREAM' },
    { n:'02', t:'No named sponsor before eval',  f:'UPSTREAM' },
    { n:'03', t:'Scope drift in term sheet',     f:'MIDSTREAM' },
    { n:'04', t:'Anchor too high on upfront',    f:'MIDSTREAM' },
    { n:'05', t:'Single-stream DD',              f:'MIDSTREAM' },
    { n:'06', t:'Sign before governance real',   f:'MIDSTREAM' },
    { n:'07', t:'No 30/60/90 mobilisation plan', f:'DOWNSTREAM' },
    { n:'08', t:'KPIs without baselines',        f:'DOWNSTREAM' },
    { n:'09', t:'Renewal as administrative',     f:'DOWNSTREAM' },
    { n:'10', t:'No exit story for stakeholders',f:'DOWNSTREAM' },
  ];
  return (
    <div>
      <Serif size={26} weight={400} style={{ display:'block', marginBottom: 8 }}>
        Ten Director-level mistakes — most upstream, most expensive downstream.
      </Serif>
      <p style={{ fontFamily: FONT_HEAD, fontSize: 15, fontStyle:'italic', color: C.slate, marginBottom: 28, maxWidth: 720 }}>
        Walking into the C-level room knowing these IS the seniority signal.
      </p>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap: 12 }}>
        {mistakes.map(m => {
          const phaseColor = m.f === 'UPSTREAM' ? C.gold : m.f === 'MIDSTREAM' ? C.crimson : C.crimsonDk;
          return (
            <div key={m.n} style={{ background: C.surface, border:`1px solid ${C.rule}`,
                                    display:'grid', gridTemplateColumns:'60px 1fr auto',
                                    alignItems:'center', padding:'14px 18px', gap: 14 }}>
              <div style={{ fontFamily: FONT_HEAD, fontSize: 28, fontWeight: 400, fontStyle:'italic',
                            color: phaseColor }}>{m.n}</div>
              <Serif size={14.5} weight={500}>{m.t}</Serif>
              <MonoLabel color={phaseColor} size={9} ls={0.14}>{m.f}</MonoLabel>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// EXTENDED DATA — REQUESTS · INTEL · GOVERNANCE · TEMPLATES · RACI
// ============================================================

// EXTERNAL REQUESTS — auto-routed inbox
const REQUESTS = [
  { id:'r1', from:'Aignostics GmbH', who:'Dr. Maximilian Alber (CEO)', via:'Direct outreach', channel:'Email', when:'1h',
    summary:'Pathology FM partnership · co-development inquiry · CE-marked clinical workflow ready',
    autoScore: 84, autoTA:'onc', autoCap:'Multimodal AI', urgency:'high',
    autoTags:['EU-native','CE-marked','Berlin'], suggested:'advance', status:'new' },
  { id:'r2', from:'Verta Health', who:'Anna Reyes (BD)', via:'A.Catalyst US referral', channel:'A.Catalyst', when:'4h',
    summary:'Cardiac AI imaging · seeking AZ CVRM partnership for trial site qualification',
    autoScore: 62, autoTA:'cvrm', autoCap:'Multimodal AI', urgency:'med',
    autoTags:['US','Series A','CE pending'], suggested:'triage', status:'new' },
  { id:'r3', from:'Sintegra Sciences', who:'Marc Dubois (Head of Pharma)', via:'BioEurope event', channel:'Event', when:'1d',
    summary:'Synthetic data for clinical control arms — proposed pilot programme',
    autoScore: 71, autoTA:'cross', autoCap:'RWE Data', urgency:'med',
    autoTags:['EU','Privacy-tech'], suggested:'triage', status:'new' },
  { id:'r4', from:'X-Reality VR Labs', who:'Mike Chen (Founder)', via:'Cold outreach', channel:'LinkedIn', when:'2d',
    summary:'VR training for clinical investigators · pre-seed company',
    autoScore: 28, autoTA:null, autoCap:'Digital Health', urgency:'low',
    autoTags:['US','Pre-seed','No regulatory'], suggested:'decline', status:'new' },
  { id:'r5', from:'Helivax Bio', who:'Sarah Park (CSO)', via:'Direct outreach', channel:'Email', when:'2d',
    summary:'AI-driven respiratory biomarker discovery platform',
    autoScore: 58, autoTA:'resp', autoCap:'Discovery AI', urgency:'med',
    autoTags:['US','Series B'], suggested:'triage', status:'new' },
  { id:'r6', from:'Rosa Bio Spain', who:'Carlos Vilanova (CEO)', via:'A.Catalyst Spain', channel:'A.Catalyst', when:'3d',
    summary:'In-silico clinical trial simulation platform · Barcelona-based',
    autoScore: 76, autoTA:'cross', autoCap:'Discovery AI', urgency:'med',
    autoTags:['ES','Catalonia','EU-native'], suggested:'advance', status:'reviewing' },
  { id:'r7', from:'NeuralFlow', who:'Priya Sharma (Partnerships)', via:'BD-sourced', channel:'BD', when:'5d',
    summary:'Federated learning infrastructure for hospital networks',
    autoScore: 67, autoTA:'cross', autoCap:'RWE Data', urgency:'low',
    autoTags:['EU','Series A','Federated'], suggested:'triage', status:'reviewing' },
  { id:'r8', from:'Carex Oncology', who:'David Liu (BD)', via:'ASCO follow-up', channel:'Event', when:'6d',
    summary:'CAR-T patient identification AI · Boston-based',
    autoScore: 81, autoTA:'onc', autoCap:'Multimodal AI', urgency:'high',
    autoTags:['US','Boston','CE pending'], suggested:'advance', status:'reviewing' },
  { id:'r9', from:'Probit AI Madrid', who:'Sofía Domínguez (CTO)', via:'A.Catalyst Spain', channel:'A.Catalyst', when:'1w',
    summary:'NLP for trial protocol design · Spanish hospital partnerships established',
    autoScore: 72, autoTA:'cross', autoCap:'RWE Data', urgency:'med',
    autoTags:['ES','Madrid','Series A'], suggested:'triage', status:'reviewing' },
  { id:'r10', from:'Globant Healthcare', who:'Iván Pereira', via:'Cold outreach', channel:'Email', when:'1w',
    summary:'Generic healthcare digital transformation services',
    autoScore: 22, autoTA:null, autoCap:null, urgency:'low',
    autoTags:['Services'], suggested:'decline', status:'queued' },
  { id:'r11', from:'Voxel Imaging', who:'Anna Roussel (CEO)', via:'Direct outreach', channel:'Email', when:'1w',
    summary:'Multimodal pathology + radiology joint imaging FM',
    autoScore: 69, autoTA:'onc', autoCap:'Multimodal AI', urgency:'med',
    autoTags:['EU','Paris','Series A'], suggested:'triage', status:'queued' },
  { id:'r12', from:'Helio Diagnostics', who:'Dr. James Cooper', via:'BioEurope event', channel:'Event', when:'2w',
    summary:'Multi-cancer early detection partnership opportunity',
    autoScore: 64, autoTA:'onc', autoCap:'Discovery AI', urgency:'med',
    autoTags:['US','Series C'], suggested:'triage', status:'queued' },
];

// INTEL — competitive intelligence + event monitoring
const INTEL = [
  { id:'in1', source:'ASCO 2026', when:'2h', sourceType:'event',
    title:'Roche announces Pathos AI multimodal FM deal — $250M',
    detail:'Roche announced an exclusive 5-year partnership with Pathos AI for multimodal oncology foundation model development, $250M upfront + milestones. Tempus partnership scope appears unaffected for now.',
    impact:'high', linked:['tem'], action:'Review Tempus posture in next quarterly' },
  { id:'in2', source:'BioEurope Spring', when:'5h', sourceType:'event',
    title:'Aignostics keynote — TPaaS architecture revealed',
    detail:'Aignostics CEO presented their Tissue Pattern-as-a-Service architecture at BioEurope. Slide deck implies they have an unannounced major pharma partner moving to negotiation.',
    impact:'high', linked:['aig'], action:'Accelerate Aignostics term sheet timeline' },
  { id:'in3', source:'Fierce Biotech', when:'1d', sourceType:'news',
    title:'Novartis data42 announces Microsoft Fabric expansion',
    detail:'Novartis Pharma announced extension of data42 with Microsoft Fabric infrastructure stack expansion. Cloud co-opetition intensifying across major pharma.',
    impact:'med', linked:[], action:'Brief Hoots on AZ infrastructure parity' },
  { id:'in4', source:'STAT News', when:'1d', sourceType:'news',
    title:'EHDS secondary use guidance expected Q3 2026',
    detail:'STAT reports European Commission expected to publish clarifying guidance on secondary use rules under EHDS in Q3 2026. May affect federated partner contracting language.',
    impact:'med', linked:['owk','sav'], action:'Hold Owkin DD until guidance published' },
  { id:'in5', source:'Biocat newsletter', when:'2d', sourceType:'ecosystem',
    title:'Catalonia announces €30M digital health fund 2026–2028',
    detail:'Generalitat de Catalunya + private investors form new €30M digital health investment vehicle. AZ A.Catalyst Spain referenced as LP candidate.',
    impact:'low', linked:[], action:'Explore A.Catalyst Spain LP participation' },
  { id:'in6', source:'South Summit', when:'2d', sourceType:'event',
    title:'Spanish health AI track: 14 finalist startups',
    detail:'South Summit Madrid announced 14 finalist startups in health AI track including Quibim, Tucuvi, Mediktor, and three new entrants worth scouting.',
    impact:'med', linked:['qui','tuc','med'], action:'Brief A.Catalyst Spain on new entrants' },
  { id:'in7', source:'LinkedIn (competitor track)', when:'3d', sourceType:'competitor',
    title:'Pfizer hires former Tempus VP for AI partnerships role',
    detail:'Pfizer announced hiring of Sarah Chen, former Tempus VP of pharma partnerships, as VP of Strategic AI Partnerships. May impact Tempus relationship dynamics.',
    impact:'med', linked:['tem'], action:'Update Tempus stakeholder map' },
  { id:'in8', source:'Endpoints', when:'4d', sourceType:'news',
    title:'BenevolentAI announces strategic review',
    detail:'BenevolentAI board announced strategic review process, citing valuation pressure. May affect AZ partnership terms in next renewal cycle.',
    impact:'high', linked:['ben'], action:'Brief Hudson on BenevolentAI restructure risk' },
  { id:'in9', source:'JP Morgan Healthcare', when:'1w', sourceType:'event',
    title:'2026 trends panel: agentic AI consensus emerges',
    detail:'Panel of CDOs from Roche, Novartis, AZ, Pfizer, Sanofi reached consensus that agentic AI is 2027–28 deployment horizon. AZ Hoots most cautious in tone.',
    impact:'low', linked:[], action:'No immediate action — continue tracking' },
  { id:'in10', source:'EU AI Office', when:'1w', sourceType:'regulatory',
    title:'AI Act Annex III final guidance published',
    detail:'European AI Office published final Annex III guidance for high-risk AI in healthcare. Clarifies medical device pathway requirements substantially.',
    impact:'high', linked:['aig','qui','tuc'], action:'Update AI Act clause library in templates' },
  { id:'in11', source:'Genomic Health Week', when:'2w', sourceType:'event',
    title:'Aignostics + Charité multi-cancer FM published',
    detail:'Aignostics and Charité Berlin published collaborative paper on multi-cancer pathology FM. Strengthens scientific credibility for AZ partnership case.',
    impact:'med', linked:['aig'], action:'Include in Aignostics term sheet rationale' },
  { id:'in12', source:'WSJ Pharma', when:'2w', sourceType:'news',
    title:'Pharma AI partnership total funding hits $4.2B in Q1',
    detail:'WSJ reports total pharma-AI partnership funding hit $4.2B in Q1 2026, up 23% YoY. Concentration in late-stage deals continuing.',
    impact:'low', linked:[], action:'Cite in next leadership update' },
];

// GOVERNANCE THREADS — multi-stakeholder discussions
const THREADS = [
  { id:'th1', partnership:'aig', topic:'AI Act Annex III clause negotiation',
    status:'active', urgency:'high', participants:6, lastActivity:'2h',
    messages: [
      { who:'Joaquín', role:'Director', when:'5d ago', text:'Initiating discussion on AI Act Annex III clause structure for the Aignostics term sheet. The Pandora question: who carries liability for downstream clinical use post-AI Act effective date.' },
      { who:'Marcus Weber', role:'Legal (BD)', when:'4d ago', text:'Proposed dual-track posture — we accept liability scope through Aug 2028 deadline, partner covers thereafter. Standard in three of our last EU deals.' },
      { who:'Reis-Filho', role:'Comp Path Sponsor', when:'3d ago', text:'From the scientific side I support the proposed structure. We need clarity on what classifies as Annex III for digital pathology specifically.' },
      { who:'Petra Müller', role:'Compliance', when:'2d ago', text:'The EU AI Office Annex III guidance published yesterday changes the picture — digital pathology is now explicitly listed. We should restructure with that in mind.' },
      { who:'Joaquín', role:'Director', when:'1d ago', text:'Agree with Petra. Proposing we re-table the clause with the new Annex III text inline. Marcus, can you draft revision by Friday?' },
      { who:'Marcus Weber', role:'Legal (BD)', when:'2h ago', text:'Drafting now. Will circulate revised v3 by EOD Thursday for review before Friday call.' },
    ]
  },
  { id:'th2', partnership:'atr', topic:'TA Sponsor identification — decision needed',
    status:'blocked', urgency:'high', participants:4, lastActivity:'1d',
    messages: [
      { who:'Joaquín', role:'Director', when:'2w ago', text:'Atropos Health request advanced from inbox but no TA sponsor identified after 30 days. Per framework, we cannot advance to stage 4 evaluation without sponsor. Need either sponsor or decline.' },
      { who:'BD Lead', role:'BD', when:'10d ago', text:'Original source was BD-sourced. We see synthetic-control-arm value but need a TA champion. Have approached Onc R&D and CVRM, no response yet.' },
      { who:'Joaquín', role:'Director', when:'5d ago', text:'Setting hard deadline of 30 May. If no sponsor by then, declining and moving on. Sunk cost on review is too high otherwise.' },
      { who:'Sarah Kim', role:'CVRM RWE Lead', when:'1d ago', text:'CVRM passing — not our use case priority for 2026. Suggest taking it back to Onc R&D for second look or declining.' },
    ]
  },
  { id:'th3', partnership:'sav', topic:'Spain CoE strategy — Savana as anchor',
    status:'active', urgency:'med', participants:5, lastActivity:'3d',
    messages: [
      { who:'Joaquín', role:'Director', when:'2w ago', text:'Proposing Savana as anchor for the Spanish CoE strategy. EHDS-compatible, Madrid-based, global pharma client base. Three structural advantages.' },
      { who:'María Benjumea', role:'A.Catalyst Spain', when:'1w ago', text:'Full support from A.Catalyst Spain. Savana has been on our radar since 2023 — finally the moment is right.' },
      { who:'Reic', role:'EVP International', when:'5d ago', text:'Strongly support. This anchors the Spain narrative we have been waiting to put behind. Suggest €15M starting envelope with expansion options.' },
      { who:'Joaquín', role:'Director', when:'3d ago', text:'Aligning with the proposed envelope. Will brief in next QBR on the Spain CoE concept with Savana as anchor.' },
    ]
  },
  { id:'th4', partnership:'tem', topic:'Q3 renewal — scope expansion options',
    status:'active', urgency:'med', participants:7, lastActivity:'4d',
    messages: [
      { who:'Galbraith', role:'EVP Onc R&D', when:'1w ago', text:'Opening discussion on Q3 Tempus renewal. We have three scope expansion options: (a) RWE breadth, (b) FM training depth, (c) trial site network. Suggest we run all three through evaluation.' },
      { who:'Reis-Filho', role:'Comp Path', when:'1w ago', text:'From pathology side, option (b) creates the largest moat — model weights we cannot reproduce internally without 18+ months of investment.' },
      { who:'Joaquín', role:'Director', when:'5d ago', text:'Proposing we structure as primary (b) + secondary (a), with (c) as future option. Maximises strategic depth while preserving flexibility.' },
      { who:'BD Lead', role:'BD', when:'4d ago', text:'Tempus side indicated openness to all three. Their preference is (b) + (c) but flexible.' },
    ]
  },
  { id:'th5', partnership:'owk', topic:'Federated architecture validation — EHDS readiness',
    status:'active', urgency:'med', participants:5, lastActivity:'6d',
    messages: [
      { who:'Joaquín', role:'Director', when:'2w ago', text:'Owkin federated architecture needs validation against EHDS secondary use rules. Holding DD until we have clarity from EU guidance.' },
      { who:'Petra Müller', role:'Compliance', when:'1w ago', text:'EU guidance expected Q3 2026 per STAT report. Suggest we proceed with conditional DD with explicit clause for revision post-guidance.' },
      { who:'Joaquín', role:'Director', when:'6d ago', text:'Agreed. Marking DD as conditional, advancing.' },
    ]
  },
];

// DECISIONS LOG — auditable decisions register
const DECISIONS_LOG = [
  { id:'dl1', when:'16 May', partnership:'aig', decision:'Approve advance to stage 5 (term sheet) with conditional Annex III clause language', by:'Joaquín', participants:'Marcus Weber, Reis-Filho, Petra Müller' },
  { id:'dl2', when:'14 May', partnership:'tem', decision:'Approve Q3 renewal scope (option b + a) for negotiation', by:'Galbraith', participants:'Hoots, Reis-Filho, Joaquín, BD Lead' },
  { id:'dl3', when:'12 May', partnership:'mod', decision:'Approve cross-TA Modella scale-out plan for Q4 2026', by:'Hoots', participants:'Reis-Filho, Galbraith, Joaquín' },
  { id:'dl4', when:'10 May', partnership:'sav', decision:'Advance Savana to stage 4 evaluation with €15M target envelope', by:'Joaquín', participants:'Reic, M. Benjumea, BD Lead' },
  { id:'dl5', when:'8 May',  partnership:'ben', decision:'Maintain BenevolentAI partnership status; flag strategic review for re-evaluation in 60 days', by:'Hudson', participants:'BD Lead, Joaquín' },
  { id:'dl6', when:'3 May',  partnership:'qui', decision:'Approve Quibim advance to evaluation; sponsor: Imaging team', by:'Joaquín', participants:'M. Benjumea, Imaging lead' },
  { id:'dl7', when:'1 May',  partnership:'aet', decision:'Approve Aetion DD launch with Med Affairs as sponsor', by:'MA Sponsor', participants:'BD Lead, Joaquín' },
  { id:'dl8', when:'28 Apr', partnership:'bos', decision:'Approve BostonGene mobilisation kickoff with $45M envelope', by:'Hudson', participants:'Galbraith, Joaquín' },
];

// UPCOMING MEETINGS
const MEETINGS = [
  { id:'m1', when:'21 May · 14:00', topic:'Tempus JSC Q2 review',           attendees:9,  type:'JSC',       partnership:'tem' },
  { id:'m2', when:'22 May · 10:00', topic:'Aignostics term sheet review',    attendees:5,  type:'Review',    partnership:'aig' },
  { id:'m3', when:'24 May · 16:00', topic:'Spain CoE strategy briefing',     attendees:7,  type:'Brief',     partnership:'sav' },
  { id:'m4', when:'28 May · 09:00', topic:'Owkin DD checkpoint',             attendees:4,  type:'DD',        partnership:'owk' },
  { id:'m5', when:'2 Jun · 11:00',  topic:'Monthly portfolio review',        attendees:12, type:'Portfolio', partnership:null },
];

// TEMPLATES LIBRARY
const TEMPLATES = [
  // NDAs
  { id:'t1', cat:'NDA', name:'Mutual NDA — Standard', desc:'Standard mutual confidentiality agreement for early-stage partnership discussions',
    used:24, updated:'5 Apr 2026', pages:8,
    raci:{ R:'BD', A:'Director', C:'Legal · TA', I:'Sponsor · MA' }, signRequired:'Director + Partner CEO' },
  { id:'t2', cat:'NDA', name:'One-way NDA (AZ receives)', desc:'For when partner is sharing pre-existing IP or commercial info before AZ shares anything',
    used:18, updated:'5 Apr 2026', pages:6,
    raci:{ R:'BD', A:'Director', C:'Legal', I:'Sponsor' }, signRequired:'Director only' },
  { id:'t3', cat:'NDA', name:'Data-Sharing NDA', desc:'Enhanced NDA specifically for partnerships involving exchange of identifiable or sensitive patient data',
    used:11, updated:'2 May 2026', pages:14,
    raci:{ R:'Privacy lead', A:'Director', C:'Legal · Compliance · DPO', I:'MA · Sponsor' }, signRequired:'Director + DPO + Partner CEO + Partner DPO' },
  // DSAs
  { id:'t4', cat:'DSA', name:'Data Sharing — EHDS template', desc:'EU EHDS-compatible data sharing template, supports federated architecture',
    used:7, updated:'15 May 2026', pages:32,
    raci:{ R:'Director', A:'Hoots org', C:'Legal · DPO · Compliance · IT', I:'TA Sponsor · MA' }, signRequired:'Director + Compliance + Partner CEO + Partner DPO' },
  { id:'t5', cat:'DSA', name:'Data Sharing — US (HIPAA)', desc:'US-compatible data sharing for HIPAA-covered scenarios',
    used:9, updated:'10 Mar 2026', pages:28,
    raci:{ R:'Director', A:'Hoots org', C:'Legal · Privacy · IT', I:'TA Sponsor' }, signRequired:'Director + Privacy + Partner CEO' },
  { id:'t6', cat:'DSA', name:'Federated Learning Sandbox', desc:'Specialised DSA for federated learning with multiple data nodes — no data moves',
    used:3, updated:'12 May 2026', pages:42,
    raci:{ R:'Director', A:'Hoots org', C:'Legal · DPO · IT · Architecture', I:'TA · MA · Sponsor' }, signRequired:'Director + Compliance + IT + Partner CEO' },
  { id:'t7', cat:'DSA', name:'Synthetic Data License', desc:'For synthetic data partnerships (Aetion, Syntegra) — covers privacy + utility guarantees',
    used:2, updated:'8 May 2026', pages:18,
    raci:{ R:'Director', A:'Sponsor', C:'Legal · Compliance · Stats', I:'MA' }, signRequired:'Director + Partner CEO' },
  // Term Sheets
  { id:'t8', cat:'Term Sheet', name:'Alliance Term Sheet (standard)', desc:'Standard pharma-AI alliance heads of terms with 7 commercial points',
    used:14, updated:'3 May 2026', pages:12,
    raci:{ R:'Director', A:'Sponsor', C:'BD · Legal · Finance', I:'MA · TA' }, signRequired:'Director + Sponsor + Partner CEO (non-binding)' },
  { id:'t9', cat:'Term Sheet', name:'License Term Sheet', desc:'License-only deal template (high commitment, low integration)',
    used:8, updated:'12 Apr 2026', pages:14,
    raci:{ R:'Director', A:'Sponsor', C:'BD · Legal · Finance', I:'IP' }, signRequired:'Director + Sponsor + Partner CEO' },
  { id:'t10', cat:'Term Sheet', name:'Equity Stake Term Sheet', desc:'Equity investment template with option clauses',
    used:4, updated:'1 Mar 2026', pages:16,
    raci:{ R:'Director', A:'Investment Comm.', C:'BD · Legal · Finance · Treasury', I:'Sponsor' }, signRequired:'Investment Committee + Partner CEO' },
  // DD
  { id:'t11', cat:'DD', name:'9-Dimension DD Checklist', desc:'Master checklist covering 9 DD dimensions; 87 line items',
    used:11, updated:'8 May 2026', pages:24,
    raci:{ R:'DD workstream leads', A:'Director', C:'9 dim. owners', I:'Sponsor · TA · MA' }, signRequired:'Director + each workstream owner' },
  { id:'t12', cat:'DD', name:'Technical / Scientific DD', desc:'Deep-dive scientific validation checklist for AI/data partners',
    used:13, updated:'5 May 2026', pages:18,
    raci:{ R:'TA Sponsor + Tech lead', A:'Director', C:'MA · External advisors', I:'Hoots org' }, signRequired:'TA Sponsor + Director' },
  { id:'t13', cat:'DD', name:'EU Compliance DD', desc:'EU compliance check — GDPR, EHDS, AI Act, MDR readiness',
    used:8, updated:'14 May 2026', pages:22,
    raci:{ R:'Compliance lead', A:'Director', C:'Legal · DPO · Regulatory', I:'TA' }, signRequired:'Compliance + Legal + Director' },
  { id:'t14', cat:'DD', name:'Cyber & Privacy DD', desc:'SOC2, HIPAA, ISO 27001, breach history check',
    used:7, updated:'2 May 2026', pages:16,
    raci:{ R:'IT Security', A:'Director', C:'Privacy · Legal', I:'Sponsor' }, signRequired:'CISO + Director' },
  // Mobilisation
  { id:'t15', cat:'Mobilisation', name:'30/60/90 Mobilisation Plan', desc:'Stage 9 mobilisation playbook — KPIs, governance, kickoff structure',
    used:8, updated:'10 May 2026', pages:20,
    raci:{ R:'Director + Alliance Mgr', A:'Sponsor', C:'IT · Comm · Med · BD', I:'C-level + Partner team' }, signRequired:'Director + Alliance Mgr + Sponsor' },
  { id:'t16', cat:'Mobilisation', name:'JSC Charter', desc:'JSC governance template — composition, cadence, decision rights, escalation',
    used:14, updated:'25 Apr 2026', pages:12,
    raci:{ R:'Alliance Mgr', A:'Sponsor', C:'BD · Legal', I:'C-level · MA · TA' }, signRequired:'JSC chair + Partner JSC chair' },
  { id:'t17', cat:'Mobilisation', name:'KPI baseline pack', desc:'Pre-launch KPI definition template with measurement protocols',
    used:9, updated:'1 May 2026', pages:14,
    raci:{ R:'Alliance Mgr + Analytics', A:'Director', C:'TA · MA · Comm', I:'Sponsor' }, signRequired:'Director + Analytics lead' },
  // Renewal
  { id:'t18', cat:'Renewal', name:'Annual Partnership Review', desc:'Renewal-cycle review template — performance, value, expansion options',
    used:6, updated:'1 Apr 2026', pages:18,
    raci:{ R:'Director + Alliance Mgr', A:'Sponsor', C:'TA · MA · BD · Finance', I:'C-level' }, signRequired:'Director + Sponsor' },
  { id:'t19', cat:'Renewal', name:'Expansion Case Template', desc:'For renewals with scope expansion — business case, structure, terms',
    used:4, updated:'15 Apr 2026', pages:16,
    raci:{ R:'Director', A:'Sponsor · BD · Finance', C:'Legal · TA · MA', I:'C-level' }, signRequired:'Director + Sponsor + BD' },
];

// STAGE GATES WITH RACI VALIDATIONS
const STAGE_GATE_RACI = [
  { n:1, name:'Scouting', R:'Director + A.Catalyst', A:'Director', C:'TA leads · external advisors', I:'Sponsor pool',
    validation:'Opportunity added to pipeline with TA tag, capability tag, source tag', artefacts:['Pipeline entry','Source tag','Initial assessment'] },
  { n:2, name:'Triage', R:'Director + analyst', A:'Director', C:'A.Catalyst lead · TA hint', I:'BD',
    validation:'Opportunity brief (1 page) approved · TA hint identified', artefacts:['Opportunity brief','Auto-scored fit','Recommended TA'] },
  { n:3, name:'Strategic fit', R:'Director', A:'TA Sponsor', C:'BD · MA · Analytics', I:'A.Catalyst',
    validation:'Named TA sponsor confirmed in writing · go/no-go documented', artefacts:['Sponsor letter','Strategic fit memo','Go/no-go decision'] },
  { n:4, name:'Evaluation', R:'Director + cross-functional team', A:'Director', C:'TA · MA · BD · Compliance · IT', I:'Sponsor · C-level',
    validation:'8-dim scorecard ≥30/40 · pre-DD light-touch complete', artefacts:['8-dim scorecard','Alignment memo','Pre-DD summary'] },
  { n:5, name:'Term sheet', R:'Director + BD', A:'Sponsor', C:'Legal · Finance · TA', I:'C-level · MA',
    validation:'Heads of terms covering 7 commercial points · ready for DD', artefacts:['Heads of terms','Commercial outline','Risk schedule'] },
  { n:6, name:'Due diligence', R:'9 dim. workstream owners', A:'Director', C:'External advisors · auditors', I:'Sponsor · BD · Legal',
    validation:'9-dim DD coverage 100% · all workstreams report-out · red flags surfaced', artefacts:['DD report (9 dim.)','Risk register','Workstream summaries'] },
  { n:7, name:'Negotiation', R:'Director + BD + Legal', A:'Director', C:'Sponsor · Finance · TA', I:'C-level · MA',
    validation:'Detailed terms reflect heads of terms + DD findings · open issues resolved', artefacts:['Detailed terms','Open issues log','BATNA doc'] },
  { n:8, name:'Contracting', R:'Legal-led', A:'Director · Sponsor · BD VP', C:'Compliance · IP', I:'C-level · A.Catalyst · MA',
    validation:'Contract signed by both sides · reps & warranties documented · execution date', artefacts:['Signed agreement','Execution copy','Obligations schedule'] },
  { n:9, name:'Mobilisation', R:'Director + Alliance Manager', A:'Sponsor', C:'IT · TA · MA · Comm · BD', I:'C-level · Partner team',
    validation:'30/60/90 plan signed · JSC charter agreed · KPI baselines set', artefacts:['30/60/90 plan','JSC charter','KPI baseline pack','Kickoff'] },
  { n:10, name:'Renewal', R:'Director + Sponsor', A:'Sponsor · Director', C:'BD · Finance · TA · MA', I:'C-level',
    validation:'Annual review documented · renewal or wind-down decision · expansion case if renewing', artefacts:['Annual review','Renewal decision','Expansion case'] },
];

// INTERNAL STAKEHOLDER PROFILES
const STAKEHOLDER_PROFILES = [
  { id:'galbraith', name:'Susan Galbraith', role:'EVP Oncology R&D', group:'C-level', influence:9, location:'Cambridge',
    cares:'Pipeline acceleration · differentiation · launch readiness', style:'Scientific · data-driven · decisive',
    bestApproach:'Frame as pipeline impact · cite ASCO precedents · keep meetings short',
    recentTouch:'14 May · Tempus renewal review', partnerships:['tem','mod','bos'] },
  { id:'hoots', name:'Cindy Hoots', role:'Chief Digital & Tech Officer', group:'C-level', influence:10, location:'UK',
    cares:'Cross-TA reuse · architecture coherence · #EAI mandate', style:'Strategic · platform-thinking · selective',
    bestApproach:'Frame as cross-functional · ladder to #EAI · avoid TA-specific noise',
    recentTouch:'16 May · Cross-TA Modella scale', partnerships:['mod','tem','vev'] },
  { id:'reis', name:'Jorge Reis-Filho', role:'SVP Computational Pathology', group:'TA', influence:8, location:'Cambridge',
    cares:'Multimodal oncology FM · pathology reusability · model weights', style:'Scientific · collaborative · deep-domain',
    bestApproach:'Engage on scientific merit · respect domain expertise · cite Modella precedent',
    recentTouch:'12 May · Aignostics scientific review', partnerships:['mod','aig','bos','tem'] },
  { id:'hudson', name:'Tom Hudson', role:'SVP Oncology Discovery', group:'TA', influence:7, location:'Cambridge',
    cares:'AI-discovered target pipeline · phase advancement · scientific rigor', style:'Cautious · evidence-led · long-horizon',
    bestApproach:'Provide deep scientific evidence · acknowledge failure modes · respect timelines',
    recentTouch:'10 May · BenevolentAI strategic review', partnerships:['ben','bos'] },
  { id:'reic', name:'Iskra Reic', role:'EVP International + EU/Canada', group:'C-level', influence:9, location:'London',
    cares:'Geography balance · EU-native posture · emerging market access', style:'Strategic · geo-political · ambitious',
    bestApproach:'Frame as geography rebalancing · EU narrative · cite Spain advantage',
    recentTouch:'8 May · Spain CoE briefing', partnerships:['sav','owk','aig','qui'] },
  { id:'vincenzo', name:'Vincenzo', role:'OBU DSAI Commercial Lead', group:'Internal', influence:7, location:'Barcelona',
    cares:'Commercial AI delivery · cross-functional alignment · DSAI maturity', style:'Operational · collaborative · pragmatic',
    bestApproach:'Operating context · keep him in the loop · leverage for translation',
    recentTouch:'19 May · Daily', partnerships:[] },
];

// PARTNERSHIP EVALUATION NOTES
const NOTES = {
  aig: [
    { id:'n1', when:'5d ago', author:'Joaquín', kind:'observation',
      text:'Aignostics CEO Maximilian Alber was very direct in our intro call — they want to be the EU-native pathology partner of choice for one major pharma, not many. Suggests we have negotiating leverage if we move fast.' },
    { id:'n2', when:'4d ago', author:'Joaquín', kind:'risk',
      text:'Their fundraising round closed in Mar 2026 at €30M Series B led by a healthcare-tech fund. Cap table looks clean. Risk: VCs may push for broader pharma engagement post-money.' },
    { id:'n3', when:'3d ago', author:'Reis-Filho', kind:'scientific',
      text:'Reviewed their Charité collaboration paper. Methodology is sound. The multi-cancer FM architecture is unique in EU; closest comparison is Tempus in US.' },
    { id:'n4', when:'2d ago', author:'Joaquín', kind:'observation',
      text:'Their Berlin office runs federated learning compatible architecture from day one — strong EHDS readiness signal. Validated with Petra Müller.' },
    { id:'n5', when:'1d ago', author:'Joaquín', kind:'risk',
      text:'New AI Act Annex III guidance landed yesterday. Need to update term sheet language. Marcus is drafting v3.' },
    { id:'n6', when:'2h ago', author:'Joaquín', kind:'next',
      text:'Setting up Aignostics for stage 5 advance after term sheet review on 31 May. Sponsor: Reis-Filho. Structure: alliance with milestones + ROFR on next-gen FM.' },
  ]
};

// 8-DIM SCORES (for evaluate view of Aignostics)
const SCORES_AIG = [
  { dim:'Strategic fit',          score:4, weight:'HIGH', note:'Closes EU-native pathology FM gap vs Roche/Foundation' },
  { dim:'Maturity',                score:4, weight:'HIGH', note:'CE-marked workflow live · Charité validation published' },
  { dim:'Data / IP defensibility', score:4, weight:'HIGH', note:'Multi-cancer FM weights · proprietary; ROFR feasible' },
  { dim:'EU / regulatory ready',   score:5, weight:'HIGH', note:'EU-native by design · AI Act compliance built-in' },
  { dim:'Commercial model fit',    score:4, weight:'MED',  note:'Alliance structure · milestone-weighted · standard' },
  { dim:'Operational compat.',     score:4, weight:'MED',  note:'Azure-compatible · IT integration straightforward' },
  { dim:'People · culture · rep.', score:5, weight:'MED',  note:'Founder team strong · Charité reputation · clean cap table' },
  { dim:'Risk profile',            score:3, weight:'HIGH', note:'Series B funded · VC pressure for broader pharma engagement' },
];

// 8-DIM LABELS shared across views
const DIMS_8 = [
  { short:'Strategic fit',  full:'Strategic fit',          owner:'Director + TA Sponsor',  weight:'HIGH' },
  { short:'Maturity',        full:'Maturity',                owner:'Tech lead + Sponsor',    weight:'HIGH' },
  { short:'Data / IP',       full:'Data / IP defensibility', owner:'BD Lead + IP',           weight:'HIGH' },
  { short:'EU regulatory',   full:'EU / regulatory ready',   owner:'Compliance lead',        weight:'HIGH' },
  { short:'Commercial',      full:'Commercial model fit',    owner:'Finance + BD',           weight:'MED' },
  { short:'Operational',     full:'Operational compat.',     owner:'IT + Hoots org',         weight:'MED' },
  { short:'People · rep.',   full:'People · culture · rep.', owner:'Sponsor + BD',           weight:'MED' },
  { short:'Risk',            full:'Risk profile',            owner:'All workstreams',        weight:'HIGH' },
];

// ALL_SCORES — scores per partnership across 8 dimensions (initial state)
const ALL_SCORES_INIT = {
  aig: [4, 4, 4, 5, 4, 4, 5, 3],
  tem: [5, 5, 5, 4, 5, 4, 4, 4],
  mod: [5, 5, 5, 4, 5, 4, 5, 5],
  bos: [4, 4, 4, 3, 4, 4, 4, 3],
  owk: [4, 3, 5, 5, 3, 3, 4, 3],
  sav: [4, 4, 4, 5, 3, 4, 4, 4],
  ben: [3, 4, 3, 3, 3, 4, 3, 2],
  aet: [4, 4, 3, 4, 4, 4, 4, 4],
  qui: [4, 3, 4, 5, 3, 3, 4, 3],
  atr: [3, 3, 3, 3, 3, 3, 3, 2],
  nab: [3, 3, 3, 4, 3, 3, 4, 3],
  tuc: [4, 3, 3, 5, 3, 3, 4, 3],
  med: [3, 3, 3, 4, 3, 3, 3, 3],
  vev: [4, 5, 4, 4, 5, 5, 4, 4],
};

// PENDING_SCORERS — who hasn't scored which dimension yet (per partnership)
const PENDING_SCORERS_INIT = {
  aig: {
    4: { name:'Finance · Sarah Park',       pending:'3d' },
    5: { name:'IT Architecture · Hoots org',pending:'5d' },
  },
  owk: {
    2: { name:'Reis-Filho · Comp Path',      pending:'2d' },
    3: { name:'IP Lead',                     pending:'4d' },
    5: { name:'Finance · Sarah Park',        pending:'6d' },
  },
  sav: {
    1: { name:'Reic · International',        pending:'1d' },
    4: { name:'Compliance · Petra Müller',   pending:'2d' },
  },
  qui: {
    0: { name:'Imaging Lead',                pending:'4d' },
    3: { name:'Compliance · Petra Müller',   pending:'5d' },
    7: { name:'BD Lead',                     pending:'3d' },
  },
  atr: {
    0: { name:'TA Sponsor · UNASSIGNED',     pending:'14d' },
    1: { name:'TA Sponsor · UNASSIGNED',     pending:'14d' },
    2: { name:'Tech Lead',                   pending:'12d' },
    3: { name:'Compliance · Petra Müller',   pending:'8d' },
  },
};

// JOURNEY_DECISIONS — gate decisions for each completed stage (per partnership)
const JOURNEY_DECISIONS = {
  aig: {
    1: { date:'12 Mar 2026', decision:'Added to pipeline post-direct outreach · auto-scored 84/100',          by:'Joaquín' },
    2: { date:'24 Mar 2026', decision:'Opportunity brief approved · TA hint: Onc Comp Path',                  by:'Joaquín' },
    3: { date:'8 Apr 2026',  decision:'Sponsor confirmed: Reis-Filho (Comp Path) · go decision documented',   by:'Reis-Filho' },
    4: { date:'5 May 2026',  decision:'Scorecard 81/100 · advance with conditional Annex III clause',         by:'Joaquín' },
  },
  tem: {
    1: { date:'2018',  decision:'Initial AZ-Tempus strategic discussions · pipeline entry',           by:'BD · Galbraith team' },
    2: { date:'2019',  decision:'Triage advanced · Onc R&D as primary TA',                            by:'Galbraith team' },
    3: { date:'2019',  decision:'Galbraith confirmed sponsor · multi-year strategic intent',          by:'Galbraith' },
    4: { date:'2019',  decision:'Scorecard cleared 38/40 · advance to terms',                         by:'BD Lead' },
    5: { date:'2019',  decision:'Heads of terms · strategic alliance + data access',                  by:'BD + Galbraith' },
    6: { date:'2019',  decision:'9-dim DD · all green except risk profile (US-only, accepted)',       by:'DD workstreams' },
    7: { date:'2020',  decision:'Final terms · $100M expansion 2022, Pathos trilateral added 2024',   by:'BD + Legal' },
    8: { date:'2020',  decision:'Contract signed · multi-amendment evolution since',                  by:'Legal' },
    9: { date:'2020',  decision:'JSC active · 14 actions tracked quarterly',                          by:'Alliance Mgr' },
  },
  mod: {
    1: { date:'2024 Q3', decision:'Modella identified · pathology FM with cross-TA reuse potential',  by:'A.Catalyst US' },
    2: { date:'2024 Q4', decision:'Strategic value: weights are the asset · M&A path explored',       by:'Joaquín · BD' },
    3: { date:'2024 Q4', decision:'Reis-Filho sponsorship + Hoots cross-TA mandate',                  by:'Reis-Filho + Hoots' },
    4: { date:'2025 Q1', decision:'Eval composite 47/40 · M&A recommended over alliance',             by:'Joaquín' },
    5: { date:'2025 Q2', decision:'Term sheet · acquisition envelope cleared',                        by:'Investment Comm.' },
    6: { date:'2025 Q3', decision:'9-dim DD complete · all green · weights confirmed reusable',       by:'DD workstreams' },
    7: { date:'2025 Q4', decision:'Negotiation closed · valuation accepted',                          by:'Legal + Finance' },
    8: { date:'Jan 2026',decision:'Acquisition closed · integration plan launched',                    by:'Legal' },
    9: { date:'Q1 2026', decision:'Cross-TA scale plan signed · 4 TAs in scope',                       by:'Hoots + Joaquín' },
  },
  bos: {
    1: { date:'2025 Q1', decision:'BostonGene scouted via A.Catalyst US',                              by:'A.Catalyst' },
    2: { date:'2025 Q2', decision:'Triage advanced · RWE strength confirmed',                          by:'BD Lead' },
    3: { date:'2025 Q2', decision:'Hudson (Onc Disc) sponsor confirmed',                               by:'Hudson' },
    4: { date:'2025 Q3', decision:'Scorecard 32/40 · advance to terms',                                by:'Joaquín' },
    5: { date:'2025 Q4', decision:'Alliance heads of terms · $45M envelope',                           by:'BD + Hudson' },
    6: { date:'2026 Q1', decision:'DD complete · technical + financial green',                          by:'DD workstreams' },
    7: { date:'2026 Q1', decision:'Detailed terms agreed · milestones structured',                      by:'Legal' },
    8: { date:'Apr 2026',decision:'Contract signed · 3yr term + options',                              by:'Legal' },
  },
  owk: {
    1: { date:'2025 Q3', decision:'Owkin scouted · EU-native federated learning',                       by:'A.Catalyst EU' },
    2: { date:'2025 Q4', decision:'Triage · cross-TA value confirmed',                                  by:'Joaquín' },
    3: { date:'Q1 2026', decision:'Cross-TA sponsorship · Reic supportive',                             by:'Reic' },
  },
  sav: {
    1: { date:'2025 Q4', decision:'Savana added via A.Catalyst Spain anchor strategy',                  by:'M. Benjumea' },
    2: { date:'Q1 2026', decision:'Triage · EHDS-compatible RWE confirmed',                            by:'Joaquín' },
  },
  ben: {
    1: { date:'2019',    decision:'BenevolentAI initial discovery partnership · target ID',           by:'BD + Hudson' },
    2: { date:'2019',    decision:'Triage advance · discovery AI thesis',                              by:'BD' },
    3: { date:'2019',    decision:'Hudson sponsor · multi-year discovery alliance',                    by:'Hudson' },
    4: { date:'2019',    decision:'Initial alliance scorecard cleared',                                 by:'BD' },
    5: { date:'2019',    decision:'Heads of terms · risk-shared structure',                            by:'BD + Legal' },
    6: { date:'2019',    decision:'DD complete · scientific case strong',                              by:'DD workstreams' },
    7: { date:'2020',    decision:'Detailed terms · multiple targets',                                  by:'Legal' },
    8: { date:'2020',    decision:'Contract executed · $1bn potential value',                          by:'Legal' },
    9: { date:'2020',    decision:'JSC active · target advancement tracking',                          by:'Alliance Mgr' },
  },
  aet: {
    1: { date:'2025 Q2', decision:'Aetion · synthetic data thesis',                                     by:'BD' },
    2: { date:'2025 Q3', decision:'Triage · MA workstream interest',                                   by:'MA team' },
    3: { date:'2025 Q4', decision:'MA sponsor confirmed',                                              by:'MA Sponsor' },
    4: { date:'Q1 2026', decision:'Scorecard 31/40 · advance to terms',                                by:'Joaquín' },
    5: { date:'Q1 2026', decision:'License + alliance hybrid heads of terms',                          by:'BD + MA' },
  },
  qui: {
    1: { date:'2025 Q4', decision:'Quibim · Series A imaging AI · Valencia',                            by:'A.Catalyst Spain' },
    2: { date:'Q1 2026', decision:'Triage · imaging + EU-native fit',                                   by:'Joaquín' },
    3: { date:'Q1 2026', decision:'Imaging sponsor proposed',                                           by:'Imaging Lead' },
  },
  atr: {
    1: { date:'2025 Q4', decision:'Atropos via BD-sourced cold outreach',                               by:'BD' },
    2: { date:'2025 Q4', decision:'Triage advanced despite no clear sponsor (RISK)',                    by:'BD' },
    3: { date:'Q1 2026', decision:'Sponsor search initiated · Onc R&D + CVRM both passed',             by:'BD' },
  },
};

// TEMPLATE PROPOSAL — which templates to surface based on partnership stage
const TEMPLATE_PROPOSALS = {
  3: ['t1', 't15'],        // Stage 3: NDA + sponsor materials
  4: ['t11', 't12'],        // Stage 4: DD checklists
  5: ['t8', 't4'],          // Stage 5: Term sheet + DSA if data-heavy
  6: ['t11', 't13', 't14'], // Stage 6: DD batteries
  7: ['t8', 't4'],          // Stage 7: Refined term + DSA
  8: ['t4', 't6'],          // Stage 8: Final agreements
  9: ['t15', 't16', 't17'], // Stage 9: Mobilisation pack
  10:['t18', 't19'],        // Stage 10: Renewal pack
};
// ============================================================
// INBOX VIEW — external partnership requests, auto-routed
// ============================================================
function InboxView({ requestStatuses, setRequestStatuses }) {
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(REQUESTS[0]);

  // Effective status: stored override, or original
  const getEffStatus = (r) => requestStatuses[r.id] || r.status;
  const getEffDecision = (r) => requestStatuses[r.id + '_decision']; // 'advanced' | 'declined' | 'deferred'

  const filtered = REQUESTS.filter(r => {
    if (filter === 'all') return true;
    if (filter === 'high') return r.urgency === 'high';
    if (filter === 'advance') return r.suggested === 'advance';
    if (filter === 'decline') return r.suggested === 'decline';
    if (filter === 'dispositioned') return !!getEffDecision(r);
    return getEffStatus(r) === filter;
  });

  const counts = {
    received: REQUESTS.length,
    advance:  REQUESTS.filter(r => r.suggested === 'advance').length,
    triage:   REQUESTS.filter(r => r.suggested === 'triage').length,
    decline:  REQUESTS.filter(r => r.suggested === 'decline').length,
  };

  function disposition(reqId, action) {
    setRequestStatuses(prev => ({
      ...prev,
      [reqId]: 'dispositioned',
      [reqId + '_decision']: action,
    }));
  }

  return (
    <div>
      <ViewHeader
        tag="INBOX · AUTO-ROUTED"
        title="12 new partnership requests."
        dek="Every inbound request auto-scored against the 8-dim framework, auto-tagged to TA + capability, and triaged with a suggested action. Click to disposition; queue clears."
        actions={[
          <ActionBtn key="s" icon={Search} label="Search inbox"/>,
          <ActionBtn key="r" icon={Workflow} label="Routing rules" primary/>,
        ]}
      />

      <div style={{ padding:'24px 40px' }}>

        <div style={{ background: C.surface, border:`1px solid ${C.rule}`, padding:'20px 26px', marginBottom: 20 }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom: 18 }}>
            <div>
              <MonoLabel color={C.crimson}>AUTO-ROUTING · LAST 30 DAYS</MonoLabel>
              <Serif size={20} weight={400} style={{ display:'block', marginTop: 4 }}>
                Inbound → triage flow.
              </Serif>
            </div>
            <span style={{ fontFamily: FONT_MONO, fontSize: 10.5, color: C.green, fontWeight: 600, letterSpacing:'0.10em' }}>
              ★ 73% AUTO-DISPOSITIONED
            </span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 60px 1fr 60px 1fr 60px 1fr', alignItems:'center', gap: 0 }}>
            <FunnelStage label="RECEIVED"    count={counts.received} color={C.faint} sub="all sources"/>
            <FunnelArrow/>
            <FunnelStage label="AUTO-ADVANCE" count={counts.advance} color={C.green}  sub="score ≥75"/>
            <FunnelArrow/>
            <FunnelStage label="HUMAN TRIAGE" count={counts.triage}  color={C.gold}   sub="score 50–74"/>
            <FunnelArrow/>
            <FunnelStage label="AUTO-DECLINE" count={counts.decline} color={C.crimson} sub="score &lt;50"/>
          </div>
        </div>

        <div style={{ display:'flex', gap: 6, marginBottom: 18, alignItems:'center',
                      padding:'12px 16px', background: C.cream, border:`1px solid ${C.rule}` }}>
          <MonoLabel color={C.slate}>FILTER</MonoLabel>
          <span style={{ width: 1, height: 18, background: C.rule, margin:'0 8px' }}/>
          <FilterPill active={filter==='all'} onClick={() => setFilter('all')}>All ({REQUESTS.length})</FilterPill>
          <FilterPill active={filter==='new'} onClick={() => setFilter('new')}>New</FilterPill>
          <FilterPill active={filter==='reviewing'} onClick={() => setFilter('reviewing')}>Reviewing</FilterPill>
          <FilterPill active={filter==='dispositioned'} onClick={() => setFilter('dispositioned')} accent={C.green}>Dispositioned</FilterPill>
          <FilterPill active={filter==='high'} onClick={() => setFilter('high')}>High urgency</FilterPill>
          <span style={{ marginLeft:'auto', fontFamily: FONT_MONO, fontSize: 10.5, color: C.crimson, fontWeight: 600 }}>
            {filtered.length} SHOWN
          </span>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1.3fr 1fr', gap: 16, alignItems:'flex-start' }}>

          <div style={{ background: C.surface, border:`1px solid ${C.rule}` }}>
            {filtered.map((r, i) => (
              <RequestCard key={r.id} r={r} selected={selected?.id === r.id}
                onClick={() => setSelected(r)} last={i === filtered.length - 1}
                decision={getEffDecision(r)}/>
            ))}
          </div>

          {selected && <RequestDetail r={selected} decision={getEffDecision(selected)}
                                       onDecision={(a) => disposition(selected.id, a)}/>}

        </div>

      </div>
    </div>
  );
}

function FunnelStage({ label, count, color, sub }) {
  return (
    <div style={{ background: color + '15', border:`1px solid ${color}40`, padding:'14px 18px' }}>
      <MonoLabel color={color}>{label}</MonoLabel>
      <Serif size={32} weight={400} color={color} style={{ display:'block', marginTop: 4 }}>{count}</Serif>
      <div style={{ fontFamily: FONT_HEAD, fontStyle:'italic', fontSize: 11.5, color: C.slate, marginTop: 2 }}
           dangerouslySetInnerHTML={{__html: sub}}/>
    </div>
  );
}

function FunnelArrow() {
  return (
    <div style={{ display:'grid', placeItems:'center', color: C.faint }}>
      <ArrowRight size={22}/>
    </div>
  );
}

function RequestCard({ r, selected, onClick, last, decision }) {
  const sugColor = r.suggested === 'advance' ? C.green : r.suggested === 'decline' ? C.crimson : C.gold;
  const scoreColor = r.autoScore >= 75 ? C.green : r.autoScore >= 50 ? C.gold : C.crimson;
  const ta = r.autoTA ? taById(r.autoTA) : null;
  // If dispositioned, override the visual
  const isDone = !!decision;
  const doneColor = decision === 'advance' ? C.green : decision === 'decline' ? C.crimson : C.gold;
  return (
    <div onClick={onClick} style={{
      padding:'16px 20px',
      borderBottom: last ? 'none' : `1px solid ${C.ruleSoft}`,
      borderLeft: selected ? `4px solid ${C.crimson}` : '4px solid transparent',
      background: selected ? C.cream : isDone ? '#fafaf7' : 'transparent',
      cursor:'pointer', transition: 'all 0.12s',
      opacity: isDone ? 0.85 : 1,
    }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <Serif size={16} weight={500} style={{ textDecoration: isDone ? 'line-through' : 'none' }}>{r.from}</Serif>
          <div style={{ fontFamily: FONT_HEAD, fontSize: 12.5, fontStyle:'italic', color: C.slate, marginTop: 2 }}>
            {r.who} · via {r.via}
          </div>
        </div>
        <div style={{ textAlign:'right' }}>
          {!isDone ? (
            <div style={{ display:'inline-flex', alignItems:'baseline', gap: 4,
                          padding:'3px 9px', background: scoreColor + '15', border:`1px solid ${scoreColor}50` }}>
              <Sparkles size={11} color={scoreColor}/>
              <span style={{ fontFamily: FONT_MONO, fontSize: 13, fontWeight: 700, color: scoreColor }}>{r.autoScore}</span>
            </div>
          ) : (
            <div style={{ display:'inline-flex', alignItems:'center', gap: 4,
                          padding:'3px 9px', background: doneColor, color: 'white',
                          fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, letterSpacing:'0.10em' }}>
              <Check size={11}/>{decision.toUpperCase()}
            </div>
          )}
          <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: C.faint, letterSpacing:'0.08em', marginTop: 4 }}>
            {r.when.toUpperCase()} AGO
          </div>
        </div>
      </div>

      <div style={{ marginTop: 10, fontSize: 13, color: C.inkSoft, lineHeight: 1.5 }}>
        {r.summary}
      </div>

      <div style={{ display:'flex', gap: 6, marginTop: 12, flexWrap:'wrap', alignItems:'center' }}>
        {ta && <TAChip ta={r.autoTA}/>}
        {r.autoCap && (
          <span style={{ fontFamily: FONT_MONO, fontSize: 9.5, fontWeight: 600,
                         padding:'2px 8px', background: C.creamDeep, color: C.ink, letterSpacing:'0.06em' }}>
            {r.autoCap.toUpperCase()}
          </span>
        )}
        {!isDone && (
          <span style={{ marginLeft:'auto', display:'inline-flex', alignItems:'center', gap: 5,
                         padding:'3px 9px', background: sugColor, color: 'white',
                         fontFamily: FONT_MONO, fontSize: 9.5, fontWeight: 700, letterSpacing:'0.10em' }}>
            {r.suggested === 'advance' && <CheckCircle2 size={11}/>}
            {r.suggested === 'decline' && <X size={11}/>}
            {r.suggested === 'triage'  && <Filter size={11}/>}
            SUGGEST: {r.suggested.toUpperCase()}
          </span>
        )}
      </div>
    </div>
  );
}

function RequestDetail({ r, decision, onDecision }) {
  const ta = r.autoTA ? taById(r.autoTA) : null;
  const scoreColor = r.autoScore >= 75 ? C.green : r.autoScore >= 50 ? C.gold : C.crimson;
  return (
    <div style={{ background: C.surface, border:`1px solid ${C.rule}`, position:'sticky', top: 20 }}>
      <div style={{ padding:'20px 24px', borderBottom:`1px solid ${C.rule}`,
                    background: 'linear-gradient(180deg, #fefcf7, transparent)' }}>
        <MonoLabel color={C.crimson}>REQUEST DETAIL</MonoLabel>
        <Serif size={22} weight={500} style={{ display:'block', marginTop: 6 }}>{r.from}</Serif>
        <div style={{ fontFamily: FONT_HEAD, fontSize: 13, fontStyle:'italic', color: C.slate, marginTop: 4 }}>
          {r.who} · received {r.when} ago via {r.channel}
        </div>
      </div>

      <div style={{ padding:'18px 24px' }}>
        <MonoLabel color={C.slate}>SUMMARY</MonoLabel>
        <p style={{ marginTop: 6, fontSize: 13.5, lineHeight: 1.55, color: C.ink }}>{r.summary}</p>

        <MonoLabel color={C.slate}>AUTO-CLASSIFICATION</MonoLabel>
        <div style={{ marginTop: 8, marginBottom: 16, display:'grid', gridTemplateColumns:'1fr 1fr', gap: 8 }}>
          <div style={{ background: C.cream, padding:'10px 12px', border:`1px solid ${C.rule}` }}>
            <MonoLabel color={C.faint} size={9}>SCORE</MonoLabel>
            <div style={{ display:'flex', alignItems:'baseline', gap: 6 }}>
              <Serif size={26} color={scoreColor} weight={500}>{r.autoScore}</Serif>
              <span style={{ fontFamily: FONT_MONO, fontSize: 9.5, color: C.faint }}>/ 100</span>
            </div>
          </div>
          <div style={{ background: C.cream, padding:'10px 12px', border:`1px solid ${C.rule}` }}>
            <MonoLabel color={C.faint} size={9}>URGENCY</MonoLabel>
            <div style={{ fontFamily: FONT_HEAD, fontSize: 18, color: r.urgency==='high'?C.crimson:r.urgency==='med'?C.gold:C.slate,
                          fontWeight: 500, textTransform:'capitalize', marginTop: 4 }}>
              {r.urgency}
            </div>
          </div>
        </div>

        <div style={{ display:'flex', gap: 6, marginBottom: 18, flexWrap:'wrap' }}>
          {ta && <TAChip ta={r.autoTA}/>}
          {r.autoCap && (
            <span style={{ fontFamily: FONT_MONO, fontSize: 9.5, fontWeight: 600,
                           padding:'2px 8px', background: C.creamDeep, color: C.ink, letterSpacing:'0.06em' }}>
              {r.autoCap.toUpperCase()}
            </span>
          )}
          {r.autoTags.map(t => (
            <span key={t} style={{ fontFamily: FONT_MONO, fontSize: 9.5, padding:'2px 8px',
                                    background: 'transparent', border:`1px solid ${C.rule}`,
                                    color: C.slate, letterSpacing:'0.06em' }}>{t.toUpperCase()}</span>
          ))}
        </div>

        <MonoLabel color={C.crimson}>DECISION</MonoLabel>

        {decision ? (
          <div style={{ marginTop: 10, padding:'14px', background: (decision==='advance'?C.green:decision==='decline'?C.crimson:C.gold) + '15',
                        border:`1px solid ${decision==='advance'?C.green:decision==='decline'?C.crimson:C.gold}`,
                        display:'flex', alignItems:'center', justifyContent:'space-between', gap: 12 }}>
            <span style={{ display:'inline-flex', alignItems:'center', gap: 8 }}>
              {decision==='advance' && <CheckCircle2 size={16} color={C.green}/>}
              {decision==='decline' && <X size={16} color={C.crimson}/>}
              {decision==='defer'   && <Clock size={16} color={C.gold}/>}
              <span style={{ fontFamily: FONT_HEAD, fontSize: 14, fontWeight: 500,
                             color: decision==='advance'?C.green:decision==='decline'?C.crimson:C.gold }}>
                {decision === 'advance' ? 'Advanced to triage queue' : decision === 'decline' ? 'Declined · template sent' : 'Deferred · 7 days'}
              </span>
            </span>
            <button onClick={() => onDecision(null)} style={{
              padding:'5px 10px', background:'transparent', border:`1px solid ${C.rule}`,
              fontFamily: FONT_MONO, fontSize: 9.5, fontWeight: 600, letterSpacing:'0.10em',
              color: C.slate, cursor:'pointer' }}>
              UNDO
            </button>
          </div>
        ) : (
          <div style={{ marginTop: 10, display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap: 6 }}>
            <DecisionBtn icon={CheckCircle2} label="Advance" color={C.green}   primary={r.suggested==='advance'} onClick={() => onDecision('advance')}/>
            <DecisionBtn icon={Clock}         label="Defer"   color={C.gold}    primary={r.suggested==='triage'}  onClick={() => onDecision('defer')}/>
            <DecisionBtn icon={X}             label="Decline" color={C.crimson} primary={r.suggested==='decline'} onClick={() => onDecision('decline')}/>
          </div>
        )}

        <div style={{ marginTop: 18, padding:'12px 14px', background: C.crimsonPale,
                      borderLeft:`3px solid ${C.crimson}` }}>
          <MonoLabel color={C.crimson} size={9}>AI ASSIST</MonoLabel>
          <div style={{ fontFamily: FONT_HEAD, fontStyle:'italic', fontSize: 13, color: C.crimsonDk, marginTop: 6, lineHeight: 1.4 }}>
            {r.suggested === 'advance' && 'High strategic fit + EU regulatory readiness. Recommend advance to triage with TA hint pre-routed.'}
            {r.suggested === 'triage'  && 'Worth human review — capability fits but maturity uncertain. Suggest opportunity brief before advancing.'}
            {r.suggested === 'decline' && 'Low strategic fit + no regulatory pathway. Polite decline template available.'}
          </div>
        </div>
      </div>
    </div>
  );
}

function DecisionBtn({ icon: Icon, label, color, primary, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding:'10px 8px', background: primary ? color : 'transparent',
      color: primary ? 'white' : color, border:`1px solid ${color}`,
      fontFamily: FONT_MONO, fontSize: 10.5, fontWeight: 600, letterSpacing:'0.08em',
      cursor: 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap: 6,
      transition:'all 0.12s',
    }}
    onMouseEnter={(e) => { if (!primary) { e.currentTarget.style.background = color + '15'; }}}
    onMouseLeave={(e) => { if (!primary) { e.currentTarget.style.background = 'transparent'; }}}>
      <Icon size={12}/>
      {label.toUpperCase()}
    </button>
  );
}

// ============================================================
// EVALUATE VIEW — interactive scorecard + pending scorers + template proposals
// ============================================================
function EvaluateView({ allScores, setAllScores, allNotes, setAllNotes }) {
  const [targetId, setTargetId] = useState('aig');
  const [draftNote, setDraftNote] = useState('');
  const [draftKind, setDraftKind] = useState('observation');
  const [hoverScore, setHoverScore] = useState({ dim:-1, val:0 });

  const partnership = PARTNERSHIPS.find(p => p.id === targetId) || PARTNERSHIPS[0];
  const scores = allScores[targetId] || [3,3,3,3,3,3,3,3];
  const notes = allNotes[targetId] || [];
  const pending = PENDING_SCORERS_INIT[targetId] || {};
  const pendingCount = Object.keys(pending).length;
  const completedCount = DIMS_8.length - pendingCount;

  const totalScore = scores.reduce((s, x) => s + x, 0);
  const maxScore = DIMS_8.length * 5;
  const composite = Math.round((totalScore / maxScore) * 100);

  const proposedIds = TEMPLATE_PROPOSALS[partnership.stage] || [];
  const proposedTemplates = proposedIds.map(id => TEMPLATES.find(t => t.id === id)).filter(Boolean);

  function updateScore(dimIdx, val) {
    setAllScores(prev => {
      const current = prev[targetId] || [3,3,3,3,3,3,3,3];
      const updated = current.map((s, i) => i === dimIdx ? val : s);
      return { ...prev, [targetId]: updated };
    });
  }

  function addNote() {
    const text = draftNote.trim();
    if (!text) return;
    const newNote = {
      id: 'n_' + Date.now(),
      when: 'just now',
      author: 'Joaquín',
      kind: draftKind,
      text,
    };
    setAllNotes(prev => ({
      ...prev,
      [targetId]: [newNote, ...(prev[targetId] || [])]
    }));
    setDraftNote('');
  }

  return (
    <div>
      <ViewHeader
        tag="EVALUATE · WORKSPACE"
        title="Partnership evaluation workspace."
        dek="Scorecard · pending scorers · notes · suggested templates. Click any cell to score. Live composite."
        actions={[
          <ActionBtn key="c" icon={Vote} label="Compare partners"/>,
          <ActionBtn key="r" icon={FileText} label="Generate memo" primary/>,
        ]}
      />

      {/* Partnership selector */}
      <div style={{ padding:'16px 40px', borderBottom:`1px solid ${C.rule}`, background: C.cream }}>
        <div style={{ display:'flex', alignItems:'center', gap: 12, flexWrap:'wrap' }}>
          <MonoLabel color={C.slate}>EVALUATING</MonoLabel>
          <select value={targetId} onChange={(e) => setTargetId(e.target.value)}
            style={{ padding:'8px 12px', fontFamily: FONT_HEAD, fontSize: 16, fontWeight: 500,
                     background: C.surface, border:`1px solid ${C.rule}`, color: C.ink, cursor:'pointer' }}>
            {PARTNERSHIPS.filter(p => p.stage >= 2 && p.stage <= 8).map(p => (
              <option key={p.id} value={p.id}>{p.name} · stage {p.stage}</option>
            ))}
          </select>
          <span style={{ width: 1, height: 24, background: C.rule, margin:'0 8px' }}/>
          <TAChip ta={partnership.cat} size="lg"/>
          <span style={{ fontFamily: FONT_MONO, fontSize: 10.5, color: C.slate, letterSpacing:'0.08em' }}>
            STAGE {String(partnership.stage).padStart(2,'0')} · {STAGES[partnership.stage-1].name.toUpperCase()}
          </span>
          <span style={{ marginLeft:'auto', display:'inline-flex', alignItems:'center', gap: 10 }}>
            <span>
              <MonoLabel color={C.slate}>SCORED</MonoLabel>
              <span style={{ fontFamily: FONT_HEAD, fontSize: 18, fontWeight: 500, color: C.ink, marginLeft: 8 }}>
                {completedCount}<span style={{ fontSize: 12, color: C.faint }}>/{DIMS_8.length}</span>
              </span>
            </span>
            <span style={{ width: 1, height: 24, background: C.rule, margin:'0 4px' }}/>
            <span>
              <MonoLabel color={C.slate}>COMPOSITE</MonoLabel>
              <span style={{ fontFamily: FONT_HEAD, fontSize: 26, fontWeight: 500, marginLeft: 8,
                             color: composite >= 75 ? C.green : composite >= 60 ? C.gold : C.crimson }}>
                {composite}<span style={{ fontSize: 13, color: C.faint }}>/100</span>
              </span>
            </span>
          </span>
        </div>
      </div>

      <div style={{ padding:'24px 40px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1.2fr 1fr', gap: 24, alignItems:'flex-start' }}>

          {/* LEFT COL */}
          <div>
            {/* Interactive Scorecard */}
            <div style={{ background: C.surface, border:`1px solid ${C.rule}`, padding:'22px 26px' }}>
              <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom: 6 }}>
                <div>
                  <MonoLabel color={C.crimson}>8-DIM INTERACTIVE SCORECARD</MonoLabel>
                  <Serif size={22} weight={400} style={{ display:'block', marginTop: 6 }}>
                    Click a cell · 1 to 5 · live composite.
                  </Serif>
                </div>
                <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.faint, letterSpacing:'0.10em' }}>
                  {composite >= 75 ? '★ ADVANCE READY' : composite >= 60 ? '· REVIEW NEEDED' : '⚠ BELOW THRESHOLD'}
                </span>
              </div>

              <div style={{ marginTop: 16 }}>
                {DIMS_8.map((d, i) => (
                  <ScoreRowInteractive
                    key={i}
                    dim={d}
                    score={scores[i]}
                    pending={pending[i]}
                    onScore={(v) => updateScore(i, v)}
                    hovered={hoverScore.dim === i ? hoverScore.val : 0}
                    onHover={(v) => setHoverScore({ dim:i, val:v })}
                    onLeave={() => setHoverScore({ dim:-1, val:0 })}
                  />
                ))}
              </div>

              <div style={{ marginTop: 18, padding:'14px 16px', background: C.cream,
                            display:'grid', gridTemplateColumns:'auto 1fr auto', gap: 16, alignItems:'center' }}>
                <MonoLabel color={C.crimson}>RECOMMENDATION</MonoLabel>
                <div style={{ fontFamily: FONT_HEAD, fontSize: 14, fontStyle:'italic', color: C.ink }}>
                  {composite >= 75 ? `Composite ${composite}/100 — advance to next stage with named risks logged.` :
                   composite >= 60 ? `Composite ${composite}/100 — review with sponsor before advancing.` :
                                     `Composite ${composite}/100 — below 60 threshold; defer or restructure.`}
                </div>
                <span style={{ display:'inline-flex', alignItems:'center', gap: 5,
                               padding:'4px 10px', background: composite>=75?C.green:composite>=60?C.gold:C.crimson, color:'white',
                               fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, letterSpacing:'0.10em' }}>
                  {composite>=75 ? <><ThumbsUp size={11}/> ADVANCE</> : composite>=60 ? <><AlertCircle size={11}/> REVIEW</> : <><ThumbsDown size={11}/> DEFER</>}
                </span>
              </div>
            </div>

            {/* Pending scorers */}
            {pendingCount > 0 && (
              <div style={{ background: C.surface, border:`1px solid ${C.rule}`, padding:'22px 26px', marginTop: 16 }}>
                <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between' }}>
                  <div>
                    <MonoLabel color={C.crimson}>PENDING SCORERS</MonoLabel>
                    <Serif size={20} weight={400} style={{ display:'block', marginTop: 6 }}>
                      {pendingCount} of {DIMS_8.length} dimensions still need input.
                    </Serif>
                  </div>
                  <ActionBtn icon={Send} label="Nudge all"/>
                </div>
                <div style={{ marginTop: 14 }}>
                  {Object.entries(pending).map(([dimIdx, p]) => {
                    const dim = DIMS_8[parseInt(dimIdx)];
                    const overdue = parseInt(p.pending) > 5;
                    return (
                      <div key={dimIdx} style={{ display:'grid', gridTemplateColumns:'auto 1fr auto auto', gap: 12,
                                                  padding:'12px 0', borderTop:`1px solid ${C.ruleSoft}`, alignItems:'center' }}>
                        <div style={{ width: 32, height: 32, borderRadius:'50%', background: overdue ? C.crimsonPale : C.creamDeep,
                                      display:'grid', placeItems:'center', color: overdue ? C.crimson : C.slate }}>
                          <Clock size={14}/>
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500, color: C.ink }}>{dim.full}</div>
                          <div style={{ fontFamily: FONT_HEAD, fontStyle:'italic', fontSize: 12, color: C.slate, marginTop: 2 }}>
                            Waiting on: <strong style={{ fontStyle:'normal', color: C.ink }}>{p.name}</strong>
                          </div>
                        </div>
                        <span style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700,
                                       padding:'3px 8px', color: overdue ? C.crimson : C.gold,
                                       background: overdue ? C.crimsonPale : C.goldPale, letterSpacing:'0.10em' }}>
                          {p.pending.toUpperCase()}
                        </span>
                        <button style={{ padding:'5px 10px', background: C.surface, border:`1px solid ${C.rule}`,
                                          fontFamily: FONT_MONO, fontSize: 9.5, fontWeight: 600, letterSpacing:'0.10em',
                                          color: C.ink, cursor:'pointer' }}>
                          NUDGE
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Template proposals */}
            <div style={{ background: C.surface, border:`1px solid ${C.rule}`, padding:'22px 26px', marginTop: 16 }}>
              <MonoLabel color={C.crimson}>SUGGESTED TEMPLATES · STAGE {String(partnership.stage).padStart(2,'0')}</MonoLabel>
              <Serif size={20} weight={400} style={{ display:'block', marginTop: 6, marginBottom: 4 }}>
                Templates fit for the current gate.
              </Serif>
              <div style={{ fontFamily: FONT_HEAD, fontStyle:'italic', fontSize: 13, color: C.slate, marginBottom: 14 }}>
                Auto-proposed based on stage transition logic. One click pre-fills with partnership context.
              </div>
              <div style={{ display:'grid', gap: 10 }}>
                {proposedTemplates.map(t => (
                  <div key={t.id} style={{ display:'grid', gridTemplateColumns:'auto 1fr auto', gap: 14,
                                            padding:'12px 14px', border:`1px solid ${C.rule}`,
                                            borderLeft:`3px solid ${C.gold}`, alignItems:'center' }}>
                    <div style={{ width: 32, height: 32, background: C.goldPale, display:'grid', placeItems:'center', color: C.gold }}>
                      <FileText size={15}/>
                    </div>
                    <div>
                      <div style={{ fontFamily: FONT_HEAD, fontSize: 14.5, fontWeight: 500, color: C.ink }}>{t.name}</div>
                      <div style={{ fontFamily: FONT_HEAD, fontStyle:'italic', fontSize: 12, color: C.slate, marginTop: 2 }}>
                        {t.cat} · {t.pages} pages · used {t.used}× · {t.signRequired}
                      </div>
                    </div>
                    <button style={{ padding:'7px 12px', background: C.crimson, color:'white', border:'none',
                                      fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, letterSpacing:'0.10em',
                                      cursor:'pointer', display:'inline-flex', alignItems:'center', gap: 6 }}>
                      <Sparkles size={11}/>USE
                    </button>
                  </div>
                ))}
                {proposedTemplates.length === 0 && (
                  <div style={{ fontFamily: FONT_HEAD, fontStyle:'italic', fontSize: 13, color: C.slate }}>
                    No suggested templates for this stage.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COL: Notes */}
          <div style={{ background: C.surface, border:`1px solid ${C.rule}`, padding:'22px 26px' }}>
            <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between' }}>
              <div>
                <MonoLabel color={C.crimson}>EVALUATION NOTES</MonoLabel>
                <Serif size={20} weight={400} style={{ display:'block', marginTop: 6 }}>{notes.length} timestamped entries.</Serif>
              </div>
            </div>

            <div style={{ marginTop: 18, maxHeight: 480, overflowY:'auto' }}>
              {notes.map(n => <NoteRow key={n.id} n={n}/>)}
              {notes.length === 0 && (
                <div style={{ padding:'24px 0', fontFamily: FONT_HEAD, fontStyle:'italic', fontSize: 13, color: C.slate, textAlign:'center' }}>
                  No notes yet. Start with an observation below.
                </div>
              )}
            </div>

            {/* Compose */}
            <div style={{ marginTop: 16, padding:'12px 14px', background: C.cream, border:`1px solid ${C.rule}` }}>
              <MonoLabel color={C.slate}>QUICK NOTE</MonoLabel>
              <textarea value={draftNote} onChange={e => setDraftNote(e.target.value)}
                placeholder="Add an evaluation note · timestamped automatically..."
                style={{ width:'100%', marginTop: 6, padding:'10px', border:`1px solid ${C.rule}`,
                         background: C.surface, fontFamily: 'inherit', fontSize: 13, resize:'none',
                         minHeight: 60, outline:'none' }}/>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop: 8 }}>
                <div style={{ display:'flex', gap: 4 }}>
                  {['observation','risk','scientific','next'].map(k => (
                    <button key={k} onClick={() => setDraftKind(k)}
                      style={{ padding:'3px 8px',
                                background: draftKind === k ? C.ink : C.surface,
                                color: draftKind === k ? 'white' : C.slate,
                                border:`1px solid ${draftKind === k ? C.ink : C.rule}`,
                                fontFamily: FONT_MONO, fontSize: 9, fontWeight: 600,
                                letterSpacing:'0.08em', cursor:'pointer' }}>
                      {k.toUpperCase()}
                    </button>
                  ))}
                </div>
                <button onClick={addNote} style={{
                  padding:'6px 14px', background: draftNote.trim() ? C.crimson : C.faint, color:'white', border:'none',
                  fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, letterSpacing:'0.10em',
                  cursor: draftNote.trim() ? 'pointer' : 'not-allowed', display:'inline-flex', alignItems:'center', gap: 6 }}>
                  <Send size={11}/>SAVE NOTE
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function ScoreRowInteractive({ dim, score, pending, onScore, hovered, onHover, onLeave }) {
  const isPending = !!pending;
  return (
    <div style={{ display:'grid', gridTemplateColumns:'160px 1fr 160px 40px', gap: 12, padding:'10px 0',
                  borderTop:`1px solid ${C.ruleSoft}`, alignItems:'center' }}>
      <div>
        <div style={{ fontSize: 12.5, fontWeight: 500, color: C.ink }}>{dim.full}</div>
        <div style={{ display:'flex', alignItems:'center', gap: 6, marginTop: 3 }}>
          <MonoLabel color={dim.weight==='HIGH'?C.crimson:C.gold} size={9}>{dim.weight}</MonoLabel>
          {isPending && (
            <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: C.crimson, letterSpacing:'0.10em', fontWeight:700 }}>
              · PENDING {pending.pending.toUpperCase()}
            </span>
          )}
        </div>
      </div>
      <div style={{ fontFamily: FONT_HEAD, fontSize: 12, fontStyle:'italic', color: C.slate, lineHeight: 1.4 }}>
        {dim.owner}
      </div>
      <div style={{ display:'flex', gap: 3 }} onMouseLeave={onLeave}>
        {[1,2,3,4,5].map(n => {
          const isActive = n <= score;
          const isHovered = hovered > 0 && n <= hovered;
          const showHover = hovered > 0 && hovered !== score;
          const bg = showHover && isHovered ? C.gold
                   : isActive ? C.crimson
                   : C.ruleSoft;
          return (
            <button key={n}
              onClick={() => onScore(n)}
              onMouseEnter={() => onHover(n)}
              style={{ width: 22, height: 22, background: bg, border:'none', cursor:'pointer',
                       transition:'background 0.1s', padding: 0,
                       fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700,
                       color: (isActive || isHovered) ? 'white' : C.faint }}>
              {n}
            </button>
          );
        })}
      </div>
      <div style={{ fontFamily: FONT_HEAD, fontSize: 22, fontWeight: 500, color: C.ink, textAlign:'right' }}>
        {score}
      </div>
    </div>
  );
}

function FeedbackRow({ fb }) {
  const voteColor = fb.vote === 'advance' ? C.green : fb.vote === 'advance-conditional' ? C.gold : C.crimson;
  return (
    <div style={{ display:'grid', gridTemplateColumns:'auto 1fr auto', gap: 14, padding:'12px 0',
                  borderTop:`1px solid ${C.ruleSoft}`, alignItems:'center' }}>
      <div style={{ width: 32, height: 32, borderRadius:'50%', background: voteColor + '20',
                    display:'grid', placeItems:'center', color: voteColor }}>
        {fb.vote.startsWith('advance') ? <ThumbsUp size={13}/> : <ThumbsDown size={13}/>}
      </div>
      <div>
        <div style={{ fontSize: 12.5, color: C.ink, fontWeight: 500 }}>{fb.who}</div>
        <div style={{ fontFamily: FONT_HEAD, fontStyle:'italic', fontSize: 12, color: C.slate, marginTop: 2 }}>
          {fb.note}
        </div>
      </div>
      <span style={{ fontFamily: FONT_MONO, fontSize: 9, fontWeight: 700, padding:'2px 6px',
                     background: voteColor + '15', color: voteColor, letterSpacing:'0.08em' }}>
        {fb.vote.toUpperCase()}
      </span>
    </div>
  );
}

function NoteRow({ n }) {
  const kindColor = n.kind === 'risk' ? C.crimson : n.kind === 'next' ? C.gold : n.kind === 'scientific' ? C.navy : C.slate;
  return (
    <div style={{ padding:'14px 0', borderTop:`1px solid ${C.ruleSoft}` }}>
      <div style={{ display:'flex', alignItems:'center', gap: 8, marginBottom: 6 }}>
        <span style={{ fontFamily: FONT_MONO, fontSize: 9, fontWeight: 700, padding:'2px 6px',
                       background: kindColor + '15', color: kindColor, letterSpacing:'0.08em' }}>
          {n.kind.toUpperCase()}
        </span>
        <span style={{ fontSize: 12, color: C.ink, fontWeight: 500 }}>{n.author}</span>
        <span style={{ fontFamily: FONT_MONO, fontSize: 9.5, color: C.faint, letterSpacing:'0.06em', marginLeft:'auto' }}>
          {n.when.toUpperCase()}
        </span>
      </div>
      <div style={{ fontSize: 13, color: C.ink, lineHeight: 1.55 }}>{n.text}</div>
    </div>
  );
}


// ============================================================
// GOVERNANCE VIEW — discussion threads + decisions log
// ============================================================
function GovernanceView() {
  const [selectedThread, setSelectedThread] = useState(THREADS[0]);

  return (
    <div>
      <ViewHeader
        tag="GOVERNANCE · DISCUSS · DECIDE"
        title="The conversation around every partnership."
        dek="Multi-stakeholder threads · decisions log · upcoming meetings · all linked back to partnerships. The audit trail and the working memory."
        actions={[
          <ActionBtn key="d" icon={Vote} label="Log decision"/>,
          <ActionBtn key="t" icon={Plus} label="New thread" primary/>,
        ]}
      />

      <div style={{ padding:'24px 40px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'320px 1.4fr 360px', gap: 16, alignItems:'flex-start' }}>

          {/* COL 1: Thread list */}
          <div style={{ background: C.surface, border:`1px solid ${C.rule}` }}>
            <div style={{ padding:'16px 18px', borderBottom:`1px solid ${C.rule}`,
                          display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
              <div>
                <MonoLabel color={C.crimson}>ACTIVE THREADS</MonoLabel>
                <Serif size={16} weight={500} style={{ display:'block', marginTop: 4 }}>
                  {THREADS.length} discussions.
                </Serif>
              </div>
              <span style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: C.crimson, letterSpacing:'0.10em' }}>
                {THREADS.filter(t => t.urgency === 'high').length} HIGH
              </span>
            </div>
            {THREADS.map((t, i) => <ThreadCard key={t.id} t={t} selected={selectedThread?.id === t.id}
              onClick={() => setSelectedThread(t)} last={i === THREADS.length - 1}/>)}
          </div>

          {/* COL 2: Thread detail */}
          {selectedThread && <ThreadDetail t={selectedThread}/>}

          {/* COL 3: Decisions log + meetings */}
          <div>
            <div style={{ background: C.surface, border:`1px solid ${C.rule}`, marginBottom: 14 }}>
              <div style={{ padding:'14px 16px', borderBottom:`1px solid ${C.rule}` }}>
                <MonoLabel color={C.crimson}>UPCOMING MEETINGS</MonoLabel>
                <Serif size={16} weight={500} style={{ display:'block', marginTop: 4 }}>Next 14 days.</Serif>
              </div>
              {MEETINGS.map((m, i) => (
                <div key={m.id} style={{ padding:'12px 16px',
                                          borderBottom: i < MEETINGS.length-1 ? `1px solid ${C.ruleSoft}` : 'none' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
                    <span style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: C.crimson, letterSpacing:'0.08em' }}>
                      {m.when.toUpperCase()}
                    </span>
                    <span style={{ fontFamily: FONT_MONO, fontSize: 9, fontWeight: 700, padding:'1px 6px',
                                    background: C.creamDeep, color: C.slate, letterSpacing:'0.08em' }}>
                      {m.type.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ fontFamily: FONT_HEAD, fontSize: 13.5, fontWeight: 500, color: C.ink, marginTop: 4 }}>
                    {m.topic}
                  </div>
                  <div style={{ fontFamily: FONT_HEAD, fontStyle:'italic', fontSize: 11.5, color: C.slate, marginTop: 2 }}>
                    {m.attendees} attendees
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: C.surface, border:`1px solid ${C.rule}` }}>
              <div style={{ padding:'14px 16px', borderBottom:`1px solid ${C.rule}` }}>
                <MonoLabel color={C.crimson}>DECISIONS LOG</MonoLabel>
                <Serif size={16} weight={500} style={{ display:'block', marginTop: 4 }}>Last 30 days.</Serif>
              </div>
              {DECISIONS_LOG.slice(0, 6).map((d, i) => (
                <div key={d.id} style={{ padding:'12px 16px',
                                          borderBottom: i < 5 ? `1px solid ${C.ruleSoft}` : 'none' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom: 4 }}>
                    <span style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: C.crimson, letterSpacing:'0.08em' }}>
                      {d.when.toUpperCase()}
                    </span>
                    <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: C.faint, letterSpacing:'0.06em' }}>
                      → {PARTNERSHIPS.find(p => p.id === d.partnership)?.name || d.partnership}
                    </span>
                  </div>
                  <div style={{ fontSize: 12.5, color: C.ink, lineHeight: 1.45 }}>{d.decision}</div>
                  <div style={{ fontFamily: FONT_HEAD, fontStyle:'italic', fontSize: 11, color: C.slate, marginTop: 4 }}>
                    by {d.by}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function ThreadCard({ t, selected, onClick, last }) {
  const partnership = PARTNERSHIPS.find(p => p.id === t.partnership);
  const urgColor = t.urgency === 'high' ? C.crimson : t.urgency === 'med' ? C.gold : C.slate;
  const statusColor = t.status === 'blocked' ? C.red : t.status === 'active' ? C.green : C.faint;
  return (
    <div onClick={onClick} style={{
      padding:'14px 16px',
      borderBottom: last ? 'none' : `1px solid ${C.ruleSoft}`,
      borderLeft: selected ? `3px solid ${C.crimson}` : '3px solid transparent',
      background: selected ? C.cream : 'transparent',
      cursor:'pointer', transition: 'all 0.12s',
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
        <span style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: urgColor, letterSpacing:'0.10em' }}>
          {t.urgency.toUpperCase()}
        </span>
        <span style={{ display:'inline-flex', alignItems:'center', gap: 4,
                       fontFamily: FONT_MONO, fontSize: 9.5, color: statusColor, fontWeight: 600, letterSpacing:'0.08em' }}>
          <span style={{ width: 6, height: 6, borderRadius:'50%', background: statusColor }}/>
          {t.status.toUpperCase()}
        </span>
      </div>
      <div style={{ fontFamily: FONT_HEAD, fontSize: 14.5, fontWeight: 500, color: C.ink, marginTop: 6, lineHeight: 1.3 }}>
        {t.topic}
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginTop: 8 }}>
        <div style={{ display:'flex', gap: 6, alignItems:'center' }}>
          {partnership && <TAChip ta={partnership.cat}/>}
          <span style={{ fontFamily: FONT_HEAD, fontSize: 12, fontStyle:'italic', color: C.slate }}>
            {partnership?.name}
          </span>
        </div>
        <span style={{ fontFamily: FONT_MONO, fontSize: 9.5, color: C.faint, letterSpacing:'0.06em' }}>
          {t.participants} · {t.lastActivity} AGO
        </span>
      </div>
    </div>
  );
}

function ThreadDetail({ t }) {
  const partnership = PARTNERSHIPS.find(p => p.id === t.partnership);
  return (
    <div style={{ background: C.surface, border:`1px solid ${C.rule}`, display:'flex', flexDirection:'column' }}>
      <div style={{ padding:'18px 22px', borderBottom:`1px solid ${C.rule}`,
                    background: 'linear-gradient(180deg, #fefcf7, transparent)' }}>
        <div style={{ display:'flex', alignItems:'center', gap: 8, marginBottom: 4 }}>
          {partnership && <TAChip ta={partnership.cat}/>}
          <span style={{ fontFamily: FONT_HEAD, fontStyle:'italic', fontSize: 13, color: C.slate }}>
            → {partnership?.name}
          </span>
        </div>
        <Serif size={22} weight={500}>{t.topic}</Serif>
        <div style={{ display:'flex', gap: 14, marginTop: 8 }}>
          <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.slate, letterSpacing:'0.08em' }}>
            {t.participants} PARTICIPANTS
          </span>
          <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.slate, letterSpacing:'0.08em' }}>
            STATUS: {t.status.toUpperCase()}
          </span>
        </div>
      </div>

      <div style={{ padding:'18px 22px' }}>
        {t.messages.map((m, i) => <MessageBubble key={i} m={m} isLast={i === t.messages.length - 1}/>)}
      </div>

      <div style={{ borderTop:`1px solid ${C.rule}`, padding:'14px 22px', background: C.cream }}>
        <div style={{ display:'flex', gap: 10, alignItems:'flex-start' }}>
          <div style={{ width: 28, height: 28, borderRadius:'50%', background: C.crimson,
                        display:'grid', placeItems:'center', color:'white',
                        fontFamily: FONT_HEAD, fontSize: 11, fontWeight: 600, flexShrink: 0 }}>JA</div>
          <textarea placeholder="Reply to thread..."
            style={{ flex: 1, padding:'8px 12px', border:`1px solid ${C.rule}`,
                     background: C.surface, fontFamily: 'inherit', fontSize: 13, resize:'none',
                     minHeight: 50, outline:'none' }}/>
          <button style={{ padding:'8px 14px', background: C.crimson, color:'white', border:'none',
                            fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, letterSpacing:'0.10em',
                            cursor:'pointer', alignSelf:'flex-start',
                            display:'inline-flex', alignItems:'center', gap: 6 }}>
            <Send size={11}/>SEND
          </button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ m, isLast }) {
  const isJoaquin = m.who === 'Joaquín';
  return (
    <div style={{ display:'flex', gap: 12, marginBottom: isLast ? 0 : 18 }}>
      <div style={{ width: 32, height: 32, borderRadius:'50%',
                    background: isJoaquin ? C.crimson : C.navy, color:'white',
                    display:'grid', placeItems:'center',
                    fontFamily: FONT_HEAD, fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
        {m.who.split(' ').map(w => w[0]).join('').slice(0, 2)}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display:'flex', alignItems:'baseline', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{m.who}</span>
          <span style={{ fontFamily: FONT_MONO, fontSize: 9.5, color: C.faint, letterSpacing:'0.06em' }}>
            {m.role.toUpperCase()}
          </span>
          <span style={{ fontFamily: FONT_MONO, fontSize: 9.5, color: C.faint, marginLeft:'auto', letterSpacing:'0.06em' }}>
            {m.when.toUpperCase()}
          </span>
        </div>
        <div style={{ fontSize: 13, color: C.inkSoft, lineHeight: 1.55 }}>{m.text}</div>
      </div>
    </div>
  );
}

// ============================================================
// INTEL VIEW — competitive intelligence + event monitoring
// ============================================================
function IntelView() {
  const [filter, setFilter] = useState('all');

  const filtered = INTEL.filter(i => {
    if (filter === 'all') return true;
    return i.sourceType === filter;
  });

  const counts = {
    event:      INTEL.filter(i => i.sourceType === 'event').length,
    news:       INTEL.filter(i => i.sourceType === 'news').length,
    competitor: INTEL.filter(i => i.sourceType === 'competitor').length,
    ecosystem:  INTEL.filter(i => i.sourceType === 'ecosystem').length,
    regulatory: INTEL.filter(i => i.sourceType === 'regulatory').length,
  };

  const sources = [
    { id:'all',        label:'ALL',         count:INTEL.length,      color: C.ink,    icon: Eye },
    { id:'event',      label:'EVENTS',      count:counts.event,      color: C.crimson, icon: Trophy },
    { id:'news',       label:'NEWS',        count:counts.news,       color: C.navy,    icon: Newspaper },
    { id:'competitor', label:'COMPETITORS', count:counts.competitor, color: C.gold,    icon: Flag },
    { id:'ecosystem',  label:'ECOSYSTEM',   count:counts.ecosystem,  color: C.sage,    icon: Globe },
    { id:'regulatory', label:'REGULATORY',  count:counts.regulatory, color: C.teal,    icon: FileText },
  ];

  return (
    <div>
      <ViewHeader
        tag="INTEL · COMPETITIVE + EVENTS"
        title="The signal stream feeding partnership strategy."
        dek="Conference talks · competitor announcements · regulatory shifts · Spanish ecosystem moves. Auto-tagged, linked to partnerships, action-ready."
        actions={[
          <ActionBtn key="m" icon={Settings} label="Monitors"/>,
          <ActionBtn key="r" icon={Plus} label="Log intel" primary/>,
        ]}
      />

      <div style={{ padding:'24px 40px' }}>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap: 8, marginBottom: 24 }}>
          {sources.map(c => {
            const Icon = c.icon;
            const active = filter === c.id;
            return (
              <button key={c.id} onClick={() => setFilter(c.id)} style={{
                background: active ? c.color : C.surface,
                color: active ? 'white' : C.ink,
                border:`1px solid ${active ? c.color : C.rule}`,
                padding:'14px 16px', textAlign:'left', cursor:'pointer', transition:'all 0.12s',
                fontFamily:'inherit',
              }}>
                <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
                  <Icon size={14} color={active ? 'white' : c.color}/>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 9.5, fontWeight: 700, letterSpacing:'0.12em',
                                  color: active ? 'white' : C.slate }}>{c.label}</span>
                </div>
                <div style={{ fontFamily: FONT_HEAD, fontSize: 22, fontWeight: 500,
                              color: active ? 'white' : c.color, marginTop: 4 }}>{c.count}</div>
              </button>
            );
          })}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap: 14 }}>
          {filtered.map(i => <IntelCard key={i.id} i={i}/>)}
        </div>

      </div>
    </div>
  );
}

function IntelCard({ i }) {
  const impactColor = i.impact === 'high' ? C.crimson : i.impact === 'med' ? C.gold : C.sage;
  const typeColor = i.sourceType === 'event' ? C.crimson : i.sourceType === 'news' ? C.navy
                  : i.sourceType === 'competitor' ? C.gold : i.sourceType === 'ecosystem' ? C.sage : C.teal;
  return (
    <div style={{ background: C.surface, border:`1px solid ${C.rule}`,
                  borderTop:`3px solid ${typeColor}`, padding:'18px 20px',
                  display:'flex', flexDirection:'column' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
        <MonoLabel color={typeColor}>{i.source.toUpperCase()}</MonoLabel>
        <span style={{ fontFamily: FONT_MONO, fontSize: 9.5, color: C.faint, letterSpacing:'0.06em' }}>
          {i.when.toUpperCase()} AGO
        </span>
      </div>
      <Serif size={17} weight={500} style={{ display:'block', marginTop: 8, lineHeight: 1.25 }}>{i.title}</Serif>
      <div style={{ marginTop: 10, fontSize: 13, color: C.inkSoft, lineHeight: 1.55, flex: 1 }}>{i.detail}</div>

      {i.linked.length > 0 && (
        <div style={{ marginTop: 12, paddingTop: 10, borderTop:`1px solid ${C.ruleSoft}` }}>
          <MonoLabel color={C.faint} size={9}>LINKED PARTNERSHIPS</MonoLabel>
          <div style={{ display:'flex', gap: 6, marginTop: 5, flexWrap:'wrap' }}>
            {i.linked.map(pid => {
              const p = PARTNERSHIPS.find(x => x.id === pid);
              return p ? (
                <span key={pid} style={{ padding:'2px 8px', background: C.creamDeep, border:`1px solid ${C.rule}`,
                                          fontSize: 11, color: C.ink, fontWeight: 500 }}>
                  {p.name}
                </span>
              ) : null;
            })}
          </div>
        </div>
      )}

      <div style={{ marginTop: 14, padding:'10px 12px', background: impactColor + '15',
                    borderLeft:`3px solid ${impactColor}`,
                    display:'grid', gridTemplateColumns:'auto 1fr auto', gap: 12, alignItems:'center' }}>
        <span style={{ fontFamily: FONT_MONO, fontSize: 9.5, fontWeight: 700, color: impactColor, letterSpacing:'0.10em' }}>
          IMPACT: {i.impact.toUpperCase()}
        </span>
        <span style={{ fontFamily: FONT_HEAD, fontSize: 12.5, fontStyle:'italic', color: C.ink }}>
          {i.action}
        </span>
        <button style={{ padding:'5px 10px', background: impactColor, color:'white', border:'none',
                          fontFamily: FONT_MONO, fontSize: 9, fontWeight: 700, letterSpacing:'0.10em', cursor:'pointer' }}>
          ACTION
        </button>
      </div>
    </div>
  );
}

// ============================================================
// TEMPLATES VIEW — document library with RACI
// ============================================================
function TemplatesView() {
  const [cat, setCat] = useState('NDA');
  const cats = ['NDA', 'DSA', 'Term Sheet', 'DD', 'Mobilisation', 'Renewal', 'Stage Gates'];
  const filtered = cat === 'Stage Gates' ? [] : TEMPLATES.filter(t => t.cat === cat);
  const [selectedTpl, setSelectedTpl] = useState(filtered[0] || TEMPLATES[0]);

  return (
    <div>
      <ViewHeader
        tag="TEMPLATES · LIBRARY"
        title="The signed-document architecture."
        dek="NDAs · Data Sharing Agreements · Term Sheets · DD checklists · Mobilisation · Renewals · Stage Gates with RACI. Every template carries its audit trail."
        actions={[
          <ActionBtn key="r" icon={Workflow} label="RACI guide"/>,
          <ActionBtn key="t" icon={Plus} label="New template" primary/>,
        ]}
      />

      {/* Category tabs */}
      <div style={{ padding:'0 40px', borderBottom:`1px solid ${C.rule}`, background: C.cream }}>
        <div style={{ display:'flex', gap: 0, overflowX:'auto' }}>
          {cats.map(c => {
            const active = cat === c;
            return (
              <button key={c} onClick={() => {
                setCat(c);
                if (c !== 'Stage Gates') {
                  const first = TEMPLATES.find(t => t.cat === c);
                  if (first) setSelectedTpl(first);
                }
              }} style={{
                padding:'14px 18px', background:'transparent',
                color: active ? C.crimson : C.slate, border:'none',
                borderBottom: active ? `3px solid ${C.crimson}` : '3px solid transparent',
                fontFamily: FONT_HEAD, fontSize: 14.5, fontWeight: active ? 500 : 400,
                cursor:'pointer', whiteSpace:'nowrap',
              }}>{c}</button>
            );
          })}
        </div>
      </div>

      <div style={{ padding:'24px 40px' }}>
        {cat === 'Stage Gates' ? (
          <StageGatesRACI/>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'1.3fr 1fr', gap: 16, alignItems:'flex-start' }}>
            {/* Template list */}
            <div style={{ display:'grid', gap: 10 }}>
              {filtered.map(t => <TemplateCard key={t.id} t={t} selected={selectedTpl?.id === t.id}
                                                onClick={() => setSelectedTpl(t)}/>)}
            </div>
            {/* Template detail */}
            {selectedTpl && <TemplateDetail t={selectedTpl}/>}
          </div>
        )}
      </div>
    </div>
  );
}

function TemplateCard({ t, selected, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: selected ? C.cream : C.surface,
      border:`1px solid ${selected ? C.crimson : C.rule}`,
      borderLeft: `3px solid ${selected ? C.crimson : C.gold}`,
      padding:'16px 20px', cursor:'pointer', transition:'all 0.12s',
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
        <Serif size={16} weight={500}>{t.name}</Serif>
        <span style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, padding:'2px 8px',
                       background: C.creamDeep, color: C.ink, letterSpacing:'0.10em' }}>
          {t.cat.toUpperCase()}
        </span>
      </div>
      <div style={{ marginTop: 6, fontSize: 13, color: C.inkSoft, lineHeight: 1.5 }}>{t.desc}</div>
      <div style={{ display:'flex', gap: 16, marginTop: 12, fontFamily: FONT_MONO, fontSize: 10, color: C.slate, letterSpacing:'0.06em' }}>
        <span>USED {t.used}×</span>
        <span>·</span>
        <span>UPDATED {t.updated.toUpperCase()}</span>
        <span>·</span>
        <span>{t.pages} PAGES</span>
      </div>
    </div>
  );
}

function TemplateDetail({ t }) {
  return (
    <div style={{ background: C.surface, border:`1px solid ${C.rule}`, position:'sticky', top: 20 }}>
      <div style={{ padding:'18px 22px', borderBottom:`1px solid ${C.rule}`,
                    background: 'linear-gradient(180deg, #fefcf7, transparent)' }}>
        <MonoLabel color={C.crimson}>TEMPLATE</MonoLabel>
        <Serif size={20} weight={500} style={{ display:'block', marginTop: 6 }}>{t.name}</Serif>
        <div style={{ fontFamily: FONT_HEAD, fontSize: 13, fontStyle:'italic', color: C.slate, marginTop: 4 }}>
          {t.cat} · {t.pages} pages · used {t.used}× · last updated {t.updated}
        </div>
      </div>

      <div style={{ padding:'18px 22px' }}>
        <MonoLabel color={C.slate}>DESCRIPTION</MonoLabel>
        <p style={{ marginTop: 6, fontSize: 13, lineHeight: 1.55, color: C.ink, marginBottom: 18 }}>{t.desc}</p>

        {/* RACI matrix */}
        <MonoLabel color={C.crimson}>RACI MATRIX</MonoLabel>
        <div style={{ marginTop: 8, marginBottom: 18, display:'grid', gridTemplateColumns:'auto 1fr', gap: 6 }}>
          {Object.entries(t.raci).map(([key, val]) => (
            <React.Fragment key={key}>
              <div style={{ background: C.ink, color:'white', padding:'8px 12px',
                            fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700, letterSpacing:'0.10em',
                            textAlign:'center', minWidth: 24 }}>
                {key}
              </div>
              <div style={{ background: C.cream, border:`1px solid ${C.rule}`, padding:'8px 12px',
                            fontSize: 12.5, color: C.ink }}>
                {val}
              </div>
            </React.Fragment>
          ))}
        </div>

        <MonoLabel color={C.crimson}>SIGNATURES REQUIRED</MonoLabel>
        <div style={{ marginTop: 8, padding:'10px 14px', background: C.gold + '15',
                      border:`1px solid ${C.gold}`, fontFamily: FONT_HEAD, fontSize: 13, color: C.ink }}>
          {t.signRequired}
        </div>

        <div style={{ marginTop: 18, display:'grid', gridTemplateColumns:'1fr 1fr', gap: 8 }}>
          <button style={{ padding:'10px', background: C.surface, color: C.ink, border:`1px solid ${C.rule}`,
                            fontFamily: FONT_MONO, fontSize: 10.5, fontWeight: 600, letterSpacing:'0.10em',
                            cursor:'pointer', display:'inline-flex', alignItems:'center', justifyContent:'center', gap: 6 }}>
            <Eye size={12}/>PREVIEW
          </button>
          <button style={{ padding:'10px', background: C.crimson, color:'white', border:'none',
                            fontFamily: FONT_MONO, fontSize: 10.5, fontWeight: 700, letterSpacing:'0.10em',
                            cursor:'pointer', display:'inline-flex', alignItems:'center', justifyContent:'center', gap: 6 }}>
            <FileText size={12}/>USE TEMPLATE
          </button>
        </div>
      </div>
    </div>
  );
}

function StageGatesRACI() {
  return (
    <div>
      <Serif size={26} weight={400} style={{ display:'block', marginBottom: 8 }}>
        Ten stage gates. Each with RACI roles, validation criteria, required artefacts.
      </Serif>
      <p style={{ fontFamily: FONT_HEAD, fontSize: 15, fontStyle:'italic', color: C.slate, marginBottom: 24, maxWidth: 760 }}>
        No stage advances without R signing off, A approving, C consulted, I informed — and the artefacts in the box.
      </p>

      <div style={{ display:'grid', gap: 12 }}>
        {STAGE_GATE_RACI.map(s => (
          <div key={s.n} style={{ background: C.surface, border:`1px solid ${C.rule}`,
                                   borderLeft:`4px solid ${C.crimson}` }}>
            {/* Stage header */}
            <div style={{ padding:'14px 20px', borderBottom:`1px solid ${C.rule}`,
                          display:'flex', alignItems:'center', gap: 16 }}>
              <div style={{ fontFamily: FONT_HEAD, fontSize: 36, fontWeight: 300, fontStyle:'italic',
                            color: C.crimson, lineHeight: 1, minWidth: 50 }}>
                {String(s.n).padStart(2, '0')}
              </div>
              <div style={{ flex: 1 }}>
                <Serif size={20} weight={500}>{s.name}</Serif>
                <div style={{ fontFamily: FONT_HEAD, fontSize: 12.5, fontStyle:'italic', color: C.slate, marginTop: 2 }}>
                  Gate validation: {s.validation}
                </div>
              </div>
            </div>

            {/* RACI + artefacts */}
            <div style={{ padding:'14px 20px', display:'grid', gridTemplateColumns:'2fr 1fr', gap: 24 }}>
              <div>
                <MonoLabel color={C.crimson} size={9.5}>RACI</MonoLabel>
                <div style={{ marginTop: 8, display:'grid', gridTemplateColumns:'auto 1fr auto 1fr', gap:'6px 10px',
                              alignItems:'center', fontSize: 12 }}>
                  <span style={{ fontFamily: FONT_MONO, fontWeight: 700, color: C.crimson, letterSpacing:'0.10em' }}>R</span>
                  <span style={{ color: C.ink }}>{s.R}</span>
                  <span style={{ fontFamily: FONT_MONO, fontWeight: 700, color: C.gold, letterSpacing:'0.10em' }}>A</span>
                  <span style={{ color: C.ink }}>{s.A}</span>
                  <span style={{ fontFamily: FONT_MONO, fontWeight: 700, color: C.navy, letterSpacing:'0.10em' }}>C</span>
                  <span style={{ color: C.inkSoft }}>{s.C}</span>
                  <span style={{ fontFamily: FONT_MONO, fontWeight: 700, color: C.sage, letterSpacing:'0.10em' }}>I</span>
                  <span style={{ color: C.inkSoft }}>{s.I}</span>
                </div>
              </div>
              <div>
                <MonoLabel color={C.crimson} size={9.5}>REQUIRED ARTEFACTS</MonoLabel>
                <div style={{ marginTop: 8, display:'flex', flexDirection:'column', gap: 4 }}>
                  {s.artefacts.map(a => (
                    <div key={a} style={{ display:'flex', alignItems:'center', gap: 6, fontSize: 12, color: C.ink }}>
                      <CheckCircle2 size={12} color={C.green}/>
                      {a}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// REPORTS VIEW — per-company journey + spider graphs + criteria comparison
// ============================================================
function ReportsView({ allScores }) {
  const [mode, setMode] = useState('company');  // 'company' | 'compare' | 'criterion'
  const [targetId, setTargetId] = useState('aig');
  const [compareIds, setCompareIds] = useState(['aig', 'tem', 'sav']);
  const [criterionIdx, setCriterionIdx] = useState(3); // default to EU regulatory

  return (
    <div>
      <ViewHeader
        tag="REPORTS · PORTFOLIO ANALYTICS"
        title="Every company, every criterion, every gate."
        dek="Per-company journey through the lifecycle · spider graphs across 8 criteria · cross-company comparison · single-criterion ranking. The board pack writes itself."
        actions={[
          <ActionBtn key="e" icon={FileText} label="Export PDF"/>,
          <ActionBtn key="b" icon={Send} label="Email summary" primary/>,
        ]}
      />

      {/* Mode tabs */}
      <div style={{ padding:'0 40px', borderBottom:`1px solid ${C.rule}`, background: C.cream }}>
        <div style={{ display:'flex', gap: 0 }}>
          {[
            { id:'company',   label:'Company report',         icon:Building2 },
            { id:'compare',   label:'Cross-company spider',   icon:Hexagon },
            { id:'criterion', label:'Criterion across portfolio', icon:BarChart3 },
          ].map(t => {
            const Icon = t.icon;
            const active = mode === t.id;
            return (
              <button key={t.id} onClick={() => setMode(t.id)} style={{
                display:'inline-flex', alignItems:'center', gap: 8,
                padding:'14px 18px', background:'transparent',
                color: active ? C.crimson : C.slate, border:'none',
                borderBottom: active ? `3px solid ${C.crimson}` : '3px solid transparent',
                fontFamily: FONT_HEAD, fontSize: 14.5, fontWeight: active ? 500 : 400,
                cursor:'pointer', whiteSpace:'nowrap',
              }}>
                <Icon size={14}/>{t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ padding:'24px 40px' }}>
        {mode === 'company'   && <ReportCompany   targetId={targetId} setTargetId={setTargetId} allScores={allScores}/>}
        {mode === 'compare'   && <ReportCompare   compareIds={compareIds} setCompareIds={setCompareIds} allScores={allScores}/>}
        {mode === 'criterion' && <ReportCriterion criterionIdx={criterionIdx} setCriterionIdx={setCriterionIdx} allScores={allScores}/>}
      </div>
    </div>
  );
}

// ============================================================
// SPIDER CHART (radar) — reusable, 8 axes
// ============================================================
function SpiderChart({ datasets, size = 360, showLabels = true, showScale = true }) {
  // datasets = [{ scores: [8 ints], color, label }, ...]
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.35;
  const angleStep = (2 * Math.PI) / DIMS_8.length;
  const angleFor = (i) => -Math.PI / 2 + i * angleStep;

  const pointAt = (i, dist) => ({
    x: cx + dist * Math.cos(angleFor(i)),
    y: cy + dist * Math.sin(angleFor(i)),
  });

  const polygonPoints = (scores) => scores.map((s, i) => {
    const p = pointAt(i, (s / 5) * r);
    return `${p.x},${p.y}`;
  }).join(' ');

  return (
    <svg viewBox={`0 0 ${size} ${size + 16}`} style={{ width:'100%', height:'auto', overflow:'visible' }}>
      {/* Concentric rings (decagons in our case octagons) */}
      {[1, 2, 3, 4, 5].map(level => {
        const points = DIMS_8.map((_, i) => {
          const p = pointAt(i, (level / 5) * r);
          return `${p.x},${p.y}`;
        }).join(' ');
        return <polygon key={level} points={points} fill="none" stroke={C.rule} strokeWidth="1" strokeDasharray={level === 5 ? "" : "2 3"}/>;
      })}

      {/* Axis lines */}
      {DIMS_8.map((_, i) => {
        const p = pointAt(i, r);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={C.rule} strokeWidth="1"/>;
      })}

      {/* Scale labels (1..5) on first axis */}
      {showScale && [1, 2, 3, 4, 5].map(level => {
        const p = pointAt(0, (level / 5) * r);
        return (
          <text key={level} x={p.x + 4} y={p.y - 2}
                style={{ fontFamily: FONT_MONO, fontSize: 8.5, fill: C.faint, letterSpacing:'0.06em' }}>
            {level}
          </text>
        );
      })}

      {/* Datasets polygons */}
      {datasets.map((ds, idx) => (
        <g key={idx}>
          <polygon points={polygonPoints(ds.scores)}
                   fill={ds.color} fillOpacity={datasets.length > 1 ? 0.18 : 0.32}
                   stroke={ds.color} strokeWidth="2"/>
          {ds.scores.map((s, i) => {
            const p = pointAt(i, (s / 5) * r);
            return <circle key={i} cx={p.x} cy={p.y} r="3.5" fill={ds.color}/>;
          })}
        </g>
      ))}

      {/* Axis labels */}
      {showLabels && DIMS_8.map((d, i) => {
        const p = pointAt(i, r + 18);
        const angle = angleFor(i);
        const cos = Math.cos(angle);
        const ta = Math.abs(cos) < 0.2 ? 'middle' : cos > 0 ? 'start' : 'end';
        // Dynamic vertical adjust
        const dy = Math.sin(angle) > 0.5 ? 8 : Math.sin(angle) < -0.5 ? -2 : 4;
        return (
          <text key={i} x={p.x} y={p.y + dy}
                textAnchor={ta}
                style={{ fontFamily: FONT_MONO, fontSize: 10, fill: C.ink, fontWeight: 600, letterSpacing:'0.04em' }}>
            {d.short}
          </text>
        );
      })}
    </svg>
  );
}

// ============================================================
// COMPANY REPORT
// ============================================================
function ReportCompany({ targetId, setTargetId, allScores }) {
  const partnership = PARTNERSHIPS.find(p => p.id === targetId);
  const scores = allScores[targetId] || [3,3,3,3,3,3,3,3];
  const totalScore = scores.reduce((s, x) => s + x, 0);
  const composite = Math.round((totalScore / (DIMS_8.length * 5)) * 100);
  const journey = JOURNEY_DECISIONS[targetId] || {};
  const notes = NOTES[targetId] || [];
  const decisions = DECISIONS_LOG.filter(d => d.partnership === targetId);
  const threads = THREADS.filter(t => t.partnership === targetId);

  return (
    <div>
      {/* Selector + hero */}
      <div style={{ display:'flex', alignItems:'center', gap: 16, marginBottom: 20, flexWrap:'wrap' }}>
        <MonoLabel color={C.slate}>REPORT FOR</MonoLabel>
        <select value={targetId} onChange={(e) => setTargetId(e.target.value)}
          style={{ padding:'8px 12px', fontFamily: FONT_HEAD, fontSize: 17, fontWeight: 500,
                   background: C.surface, border:`1px solid ${C.rule}`, color: C.ink, cursor:'pointer' }}>
          {PARTNERSHIPS.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Hero row */}
      <div style={{ background: C.surface, border:`1px solid ${C.rule}`,
                    borderTop:`4px solid ${taById(partnership.cat).color}`,
                    padding:'24px 28px', marginBottom: 20 }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap: 20 }}>
          <div>
            <MonoLabel color={C.slate} size={9.5}>{partnership.loc.toUpperCase()} · {partnership.tag}</MonoLabel>
            <Serif size={36} weight={500} style={{ display:'block', marginTop: 6 }}>{partnership.name}</Serif>
            <div style={{ display:'flex', gap: 6, marginTop: 10, flexWrap:'wrap' }}>
              <TAChip ta={partnership.cat} size="lg"/>
              <span style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 600,
                             padding:'4px 10px', background: C.creamDeep, color: C.ink, letterSpacing:'0.08em' }}>
                {partnership.cap.toUpperCase()}
              </span>
              <span style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 600,
                             padding:'4px 10px', background: C.ink, color:'white', letterSpacing:'0.08em' }}>
                STAGE {String(partnership.stage).padStart(2,'0')} · {STAGES[partnership.stage-1].name.toUpperCase()}
              </span>
            </div>
            <div style={{ fontFamily: FONT_HEAD, fontStyle:'italic', fontSize: 14, color: C.slate, marginTop: 12 }}>
              Sponsor: <strong style={{ color: C.ink, fontStyle:'normal' }}>{partnership.sponsor}</strong> · Structure: <strong style={{ color: C.ink, fontStyle:'normal' }}>{partnership.structure}</strong> · Value: <strong style={{ color: C.ink, fontStyle:'normal' }}>{partnership.value}</strong>
            </div>
          </div>
          <div style={{ textAlign:'right' }}>
            <MonoLabel color={C.slate}>COMPOSITE SCORE</MonoLabel>
            <div style={{ fontFamily: FONT_HEAD, fontSize: 64, fontWeight: 400, lineHeight: 1,
                          color: composite >= 75 ? C.green : composite >= 60 ? C.gold : C.crimson, marginTop: 4 }}>
              {composite}
            </div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.faint, marginTop: 6, letterSpacing:'0.10em' }}>
              / 100 · 8 DIMENSIONS
            </div>
            <div style={{ marginTop: 12, display:'flex', alignItems:'center', gap: 6, justifyContent:'flex-end' }}>
              <HealthDot health={partnership.health}/>
              <span style={{ fontFamily: FONT_MONO, fontSize: 10.5, color: C.slate, letterSpacing:'0.08em', fontWeight: 600 }}>
                HEALTH: {partnership.health.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Spider + Journey */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Spider */}
        <div style={{ background: C.surface, border:`1px solid ${C.rule}`, padding:'22px 26px' }}>
          <MonoLabel color={C.crimson}>SPIDER · 8 DIMENSIONS</MonoLabel>
          <Serif size={18} weight={500} style={{ display:'block', marginTop: 6, marginBottom: 14 }}>
            Shape of strength · shape of risk.
          </Serif>
          <div style={{ maxWidth: 420, margin:'0 auto' }}>
            <SpiderChart datasets={[{ scores, color: taById(partnership.cat).color, label: partnership.name }]} size={380}/>
          </div>
          {/* Legend / score breakdown */}
          <div style={{ marginTop: 16, display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 6 }}>
            {DIMS_8.map((d, i) => (
              <div key={i} style={{ padding:'6px 8px', background: C.cream }}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 9, fontWeight: 600, color: C.slate, letterSpacing:'0.06em' }}>
                  {d.short.toUpperCase()}
                </div>
                <div style={{ fontFamily: FONT_HEAD, fontSize: 18, fontWeight: 500,
                              color: scores[i] >= 4 ? C.green : scores[i] >= 3 ? C.gold : C.crimson }}>
                  {scores[i]}<span style={{ fontSize: 10, color: C.faint }}>/5</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Journey timeline */}
        <div style={{ background: C.surface, border:`1px solid ${C.rule}`, padding:'22px 26px' }}>
          <MonoLabel color={C.crimson}>JOURNEY · STAGE-BY-STAGE</MonoLabel>
          <Serif size={18} weight={500} style={{ display:'block', marginTop: 6, marginBottom: 14 }}>
            How {partnership.name} navigated the gates.
          </Serif>
          <div style={{ maxHeight: 520, overflowY:'auto', paddingRight: 4 }}>
            {STAGE_GATE_RACI.map(s => {
              const isPast = s.n < partnership.stage;
              const isCurrent = s.n === partnership.stage;
              const isFuture = s.n > partnership.stage;
              const decision = journey[s.n];
              return (
                <JourneyStageRow key={s.n} stage={s} isPast={isPast} isCurrent={isCurrent}
                                  isFuture={isFuture} decision={decision} partnership={partnership}/>
              );
            })}
          </div>
        </div>
      </div>

      {/* Decisions + Threads + Notes */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap: 16 }}>
        {/* Decisions log */}
        <div style={{ background: C.surface, border:`1px solid ${C.rule}`, padding:'20px 22px' }}>
          <MonoLabel color={C.crimson}>DECISIONS LOG · THIS PARTNERSHIP</MonoLabel>
          <Serif size={16} weight={500} style={{ display:'block', marginTop: 4, marginBottom: 12 }}>
            {decisions.length} documented gate decisions.
          </Serif>
          {decisions.length === 0 ? (
            <div style={{ fontFamily: FONT_HEAD, fontStyle:'italic', fontSize: 12.5, color: C.slate }}>
              No formal decisions logged yet — partnership pre-gate 4.
            </div>
          ) : (
            decisions.map(d => (
              <div key={d.id} style={{ padding:'10px 0', borderTop:`1px solid ${C.ruleSoft}` }}>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: C.crimson, letterSpacing:'0.08em' }}>
                    {d.when.toUpperCase()}
                  </span>
                  <span style={{ fontFamily: FONT_HEAD, fontStyle:'italic', fontSize: 11, color: C.slate }}>
                    by {d.by}
                  </span>
                </div>
                <div style={{ fontSize: 12.5, color: C.ink, lineHeight: 1.45, marginTop: 4 }}>{d.decision}</div>
              </div>
            ))
          )}
        </div>

        {/* Active threads */}
        <div style={{ background: C.surface, border:`1px solid ${C.rule}`, padding:'20px 22px' }}>
          <MonoLabel color={C.crimson}>OPEN DISCUSSIONS</MonoLabel>
          <Serif size={16} weight={500} style={{ display:'block', marginTop: 4, marginBottom: 12 }}>
            {threads.length} active threads.
          </Serif>
          {threads.length === 0 ? (
            <div style={{ fontFamily: FONT_HEAD, fontStyle:'italic', fontSize: 12.5, color: C.slate }}>
              No open threads.
            </div>
          ) : (
            threads.map(t => (
              <div key={t.id} style={{ padding:'10px 0', borderTop:`1px solid ${C.ruleSoft}` }}>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700,
                                  color: t.urgency==='high'?C.crimson:t.urgency==='med'?C.gold:C.slate, letterSpacing:'0.08em' }}>
                    {t.urgency.toUpperCase()}
                  </span>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.faint, letterSpacing:'0.06em' }}>
                    {t.participants} · {t.lastActivity}
                  </span>
                </div>
                <div style={{ fontFamily: FONT_HEAD, fontSize: 13.5, fontWeight: 500, color: C.ink, marginTop: 4, lineHeight: 1.3 }}>
                  {t.topic}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Notes */}
        <div style={{ background: C.surface, border:`1px solid ${C.rule}`, padding:'20px 22px' }}>
          <MonoLabel color={C.crimson}>EVALUATION NOTES</MonoLabel>
          <Serif size={16} weight={500} style={{ display:'block', marginTop: 4, marginBottom: 12 }}>
            {notes.length} entries.
          </Serif>
          {notes.length === 0 ? (
            <div style={{ fontFamily: FONT_HEAD, fontStyle:'italic', fontSize: 12.5, color: C.slate }}>
              No notes attached.
            </div>
          ) : (
            <div style={{ maxHeight: 240, overflowY:'auto' }}>
              {notes.slice(0, 5).map(n => {
                const kindColor = n.kind === 'risk' ? C.crimson : n.kind === 'next' ? C.gold : n.kind === 'scientific' ? C.navy : C.slate;
                return (
                  <div key={n.id} style={{ padding:'8px 0', borderTop:`1px solid ${C.ruleSoft}` }}>
                    <div style={{ display:'flex', gap: 6, alignItems:'center' }}>
                      <span style={{ fontFamily: FONT_MONO, fontSize: 8.5, fontWeight: 700, padding:'1px 5px',
                                      background: kindColor + '15', color: kindColor, letterSpacing:'0.08em' }}>
                        {n.kind.toUpperCase()}
                      </span>
                      <span style={{ fontFamily: FONT_MONO, fontSize: 8.5, color: C.faint, letterSpacing:'0.06em' }}>
                        {n.when.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ fontSize: 11.5, color: C.ink, lineHeight: 1.45, marginTop: 3 }}>{n.text}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function JourneyStageRow({ stage, isPast, isCurrent, isFuture, decision, partnership }) {
  const dotColor = isPast ? C.green : isCurrent ? C.crimson : C.faint;
  const dotFill  = isPast ? C.green : isCurrent ? C.crimson : 'transparent';
  return (
    <div style={{ display:'grid', gridTemplateColumns:'40px 1fr', gap: 12, paddingBottom: 14, position:'relative' }}>
      <div style={{ position:'relative' }}>
        <div style={{ width: 28, height: 28, borderRadius:'50%',
                      background: dotFill, border:`2px solid ${dotColor}`,
                      display:'grid', placeItems:'center', color: isPast ? 'white' : isCurrent ? 'white' : C.faint,
                      fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700 }}>
          {isPast ? <Check size={14}/> : String(stage.n).padStart(2,'0')}
        </div>
        {/* Connector line */}
        {stage.n < 10 && <div style={{ position:'absolute', top: 28, left: 13, width: 2, height: 30, background: isPast ? C.green : C.rule }}/>}
      </div>
      <div style={{ paddingTop: 2 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
          <Serif size={14} weight={500} style={{ color: isFuture ? C.faint : C.ink }}>{stage.name}</Serif>
          {decision && (
            <span style={{ fontFamily: FONT_MONO, fontSize: 9.5, color: C.crimson, letterSpacing:'0.08em' }}>
              {decision.date.toUpperCase()}
            </span>
          )}
          {isCurrent && (
            <span style={{ fontFamily: FONT_MONO, fontSize: 9.5, color: C.crimson, fontWeight: 700, letterSpacing:'0.10em' }}>
              IN PROGRESS · {partnership.days}D
            </span>
          )}
        </div>
        {decision && (
          <div style={{ fontFamily: FONT_HEAD, fontStyle:'italic', fontSize: 12, color: C.slate, marginTop: 3, lineHeight: 1.45 }}>
            {decision.decision}
          </div>
        )}
        {decision && (
          <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: C.faint, letterSpacing:'0.06em', marginTop: 2 }}>
            BY {decision.by.toUpperCase()}
          </div>
        )}
        {isCurrent && !decision && (
          <div style={{ fontFamily: FONT_HEAD, fontStyle:'italic', fontSize: 12, color: C.slate, marginTop: 3 }}>
            Next milestone: {partnership.next}
          </div>
        )}
        {isFuture && (
          <div style={{ fontFamily: FONT_HEAD, fontStyle:'italic', fontSize: 11.5, color: C.faint, marginTop: 3 }}>
            Pending · {stage.validation}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// CROSS-COMPANY COMPARE
// ============================================================
function ReportCompare({ compareIds, setCompareIds, allScores }) {
  const palette = [C.crimson, C.gold, C.navy, C.teal];
  const candidates = PARTNERSHIPS.filter(p => allScores[p.id]);

  function toggleCompany(id) {
    if (compareIds.includes(id)) {
      if (compareIds.length > 1) {
        setCompareIds(compareIds.filter(x => x !== id));
      }
    } else {
      if (compareIds.length < 4) {
        setCompareIds([...compareIds, id]);
      }
    }
  }

  const datasets = compareIds.map((id, idx) => {
    const p = PARTNERSHIPS.find(x => x.id === id);
    return {
      scores: allScores[id],
      color: palette[idx],
      label: p?.name || id,
    };
  });

  return (
    <div>
      {/* Selector */}
      <div style={{ background: C.cream, border:`1px solid ${C.rule}`, padding:'14px 18px', marginBottom: 20 }}>
        <div style={{ display:'flex', alignItems:'center', gap: 10, marginBottom: 10, flexWrap:'wrap' }}>
          <MonoLabel color={C.slate}>OVERLAY · UP TO 4 COMPANIES</MonoLabel>
          <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.crimson, fontWeight: 700, letterSpacing:'0.10em' }}>
            {compareIds.length} / 4 SELECTED
          </span>
        </div>
        <div style={{ display:'flex', flexWrap:'wrap', gap: 6 }}>
          {candidates.map(p => {
            const idx = compareIds.indexOf(p.id);
            const active = idx >= 0;
            const color = active ? palette[idx] : C.faint;
            return (
              <button key={p.id} onClick={() => toggleCompany(p.id)} style={{
                padding:'4px 10px', background: active ? color : C.surface,
                color: active ? 'white' : C.ink, border:`1px solid ${active ? color : C.rule}`,
                fontFamily: FONT_HEAD, fontSize: 12.5, fontWeight: 500, cursor:'pointer',
                display:'inline-flex', alignItems:'center', gap: 6, transition:'all 0.12s',
              }}>
                {active && <span style={{ width: 6, height: 6, borderRadius:'50%', background:'white' }}/>}
                {p.name}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1.2fr 1fr', gap: 16 }}>
        {/* Spider overlay */}
        <div style={{ background: C.surface, border:`1px solid ${C.rule}`, padding:'24px 28px' }}>
          <MonoLabel color={C.crimson}>SPIDER OVERLAY</MonoLabel>
          <Serif size={20} weight={500} style={{ display:'block', marginTop: 6, marginBottom: 16 }}>
            {compareIds.length} companies across 8 criteria.
          </Serif>
          <div style={{ maxWidth: 500, margin:'0 auto' }}>
            <SpiderChart datasets={datasets} size={460}/>
          </div>
          {/* Legend */}
          <div style={{ marginTop: 18, display:'flex', flexWrap:'wrap', gap: 14, justifyContent:'center' }}>
            {datasets.map((ds, i) => (
              <span key={i} style={{ display:'inline-flex', alignItems:'center', gap: 7 }}>
                <span style={{ width: 12, height: 12, background: ds.color }}/>
                <span style={{ fontFamily: FONT_HEAD, fontSize: 13, color: C.ink, fontWeight: 500 }}>{ds.label}</span>
                <span style={{ fontFamily: FONT_MONO, fontSize: 10.5, color: ds.color, fontWeight: 700, letterSpacing:'0.06em' }}>
                  {Math.round(ds.scores.reduce((s,x)=>s+x,0) / 40 * 100)}
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* Insights panel */}
        <div style={{ background: C.surface, border:`1px solid ${C.rule}`, padding:'24px 26px' }}>
          <MonoLabel color={C.crimson}>STRONGEST · WEAKEST · PER COMPANY</MonoLabel>
          <Serif size={18} weight={500} style={{ display:'block', marginTop: 6, marginBottom: 16 }}>
            Profile shape comparison.
          </Serif>
          {datasets.map((ds, idx) => {
            const max = Math.max(...ds.scores);
            const min = Math.min(...ds.scores);
            const strongDims = ds.scores.map((s, i) => ({ s, i })).filter(x => x.s === max).map(x => DIMS_8[x.i].short);
            const weakDims   = ds.scores.map((s, i) => ({ s, i })).filter(x => x.s === min).map(x => DIMS_8[x.i].short);
            return (
              <div key={idx} style={{ padding:'14px 0', borderTop: idx > 0 ? `1px solid ${C.ruleSoft}` : 'none' }}>
                <div style={{ display:'flex', alignItems:'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ width: 10, height: 10, background: ds.color }}/>
                  <Serif size={15} weight={500}>{ds.label}</Serif>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'auto 1fr', gap:'4px 12px' }}>
                  <MonoLabel color={C.green} size={9}>STRONGEST</MonoLabel>
                  <span style={{ fontSize: 12, color: C.ink }}>{strongDims.join(' · ')} <span style={{ color: C.green, fontWeight: 600 }}>({max}/5)</span></span>
                  <MonoLabel color={C.crimson} size={9}>WEAKEST</MonoLabel>
                  <span style={{ fontSize: 12, color: C.ink }}>{weakDims.join(' · ')} <span style={{ color: C.crimson, fontWeight: 600 }}>({min}/5)</span></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dimension-by-dimension comparison */}
      <div style={{ background: C.surface, border:`1px solid ${C.rule}`, padding:'24px 28px', marginTop: 20 }}>
        <MonoLabel color={C.crimson}>DIMENSION-BY-DIMENSION COMPARISON</MonoLabel>
        <Serif size={20} weight={500} style={{ display:'block', marginTop: 6, marginBottom: 16 }}>
          Same companies · each criterion broken out.
        </Serif>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:'14px 24px' }}>
          {DIMS_8.map((d, di) => (
            <div key={di}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom: 4 }}>
                <span style={{ fontFamily: FONT_HEAD, fontSize: 13, fontWeight: 500 }}>{d.full}</span>
                <MonoLabel color={d.weight==='HIGH'?C.crimson:C.gold} size={9}>{d.weight}</MonoLabel>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'80px 1fr 30px', gap: 8 }}>
                {datasets.map((ds, idx) => (
                  <React.Fragment key={idx}>
                    <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.slate, letterSpacing:'0.04em', textAlign:'right' }}>
                      {ds.label.slice(0, 10).toUpperCase()}
                    </span>
                    <div style={{ background: C.ruleSoft, height: 14, position:'relative' }}>
                      <div style={{ width:`${(ds.scores[di]/5)*100}%`, height:'100%', background: ds.color }}/>
                    </div>
                    <span style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700, color: ds.color, textAlign:'right' }}>
                      {ds.scores[di]}
                    </span>
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// CRITERION ACROSS PORTFOLIO
// ============================================================
function ReportCriterion({ criterionIdx, setCriterionIdx, allScores }) {
  const dim = DIMS_8[criterionIdx];
  // Ranked partnerships by this criterion
  const ranked = PARTNERSHIPS
    .filter(p => allScores[p.id])
    .map(p => ({ p, score: allScores[p.id][criterionIdx] }))
    .sort((a, b) => b.score - a.score);

  // Distribution
  const dist = [1,2,3,4,5].map(s => ranked.filter(x => x.score === s).length);

  return (
    <div>
      {/* Criterion selector */}
      <div style={{ background: C.cream, border:`1px solid ${C.rule}`, padding:'16px 20px', marginBottom: 20 }}>
        <MonoLabel color={C.slate}>CRITERION</MonoLabel>
        <div style={{ display:'flex', flexWrap:'wrap', gap: 6, marginTop: 8 }}>
          {DIMS_8.map((d, i) => (
            <button key={i} onClick={() => setCriterionIdx(i)} style={{
              padding:'8px 12px',
              background: criterionIdx === i ? C.crimson : C.surface,
              color: criterionIdx === i ? 'white' : C.ink,
              border:`1px solid ${criterionIdx === i ? C.crimson : C.rule}`,
              fontFamily: FONT_HEAD, fontSize: 13, fontWeight: criterionIdx === i ? 500 : 400, cursor:'pointer',
              display:'inline-flex', alignItems:'center', gap: 8, transition:'all 0.12s',
            }}>
              <span>{d.full}</span>
              <MonoLabel color={criterionIdx === i ? 'white' : (d.weight==='HIGH'?C.crimson:C.gold)} size={8.5}>{d.weight}</MonoLabel>
            </button>
          ))}
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr', gap: 16 }}>
        {/* Ranked list */}
        <div style={{ background: C.surface, border:`1px solid ${C.rule}`, padding:'24px 28px' }}>
          <MonoLabel color={C.crimson}>RANKED — {dim.full.toUpperCase()}</MonoLabel>
          <Serif size={22} weight={500} style={{ display:'block', marginTop: 6, marginBottom: 16 }}>
            {ranked.length} partnerships · scored 1–5.
          </Serif>
          <div>
            {ranked.map((row, rank) => {
              const ta = taById(row.p.cat);
              const barColor = row.score >= 4 ? C.green : row.score >= 3 ? C.gold : C.crimson;
              return (
                <div key={row.p.id} style={{ display:'grid', gridTemplateColumns:'30px 160px 1fr 40px',
                                              gap: 14, padding:'10px 0', borderTop: rank > 0 ? `1px solid ${C.ruleSoft}` : 'none',
                                              alignItems:'center' }}>
                  <div style={{ fontFamily: FONT_HEAD, fontSize: 20, fontWeight: 400, fontStyle:'italic', color: C.faint }}>
                    {String(rank + 1).padStart(2, '0')}
                  </div>
                  <div>
                    <Serif size={14} weight={500}>{row.p.name}</Serif>
                    <TAChip ta={row.p.cat}/>
                  </div>
                  <div style={{ background: C.ruleSoft, height: 18, position:'relative' }}>
                    <div style={{ width: `${(row.score/5)*100}%`, height:'100%', background: barColor }}/>
                    <span style={{ position:'absolute', right: 8, top: 2, fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: row.score >= 3 ? 'white' : C.slate }}>
                      {row.score}/5
                    </span>
                  </div>
                  <span style={{ fontFamily: FONT_HEAD, fontSize: 22, fontWeight: 500, color: barColor, textAlign:'right' }}>
                    {row.score}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Distribution */}
        <div>
          <div style={{ background: C.surface, border:`1px solid ${C.rule}`, padding:'24px 26px', marginBottom: 16 }}>
            <MonoLabel color={C.crimson}>DISTRIBUTION</MonoLabel>
            <Serif size={18} weight={500} style={{ display:'block', marginTop: 6, marginBottom: 14 }}>
              How portfolio scores on {dim.short}.
            </Serif>
            {[5,4,3,2,1].map(s => {
              const count = dist[s-1];
              const max = Math.max(...dist);
              const w = max > 0 ? (count / max) * 100 : 0;
              const col = s >= 4 ? C.green : s >= 3 ? C.gold : C.crimson;
              return (
                <div key={s} style={{ display:'grid', gridTemplateColumns:'40px 1fr 30px', gap: 8, alignItems:'center', marginBottom: 6 }}>
                  <div style={{ fontFamily: FONT_HEAD, fontSize: 16, fontWeight: 500, color: col }}>
                    {s}
                  </div>
                  <div style={{ background: C.ruleSoft, height: 22, position:'relative' }}>
                    <div style={{ width: `${w}%`, height:'100%', background: col }}/>
                  </div>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 12, fontWeight: 700, color: col, textAlign:'right' }}>
                    {count}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Stats */}
          <div style={{ background: C.surface, border:`1px solid ${C.rule}`, padding:'20px 24px' }}>
            <MonoLabel color={C.crimson}>PORTFOLIO STATS</MonoLabel>
            <div style={{ marginTop: 12, display:'grid', gridTemplateColumns:'1fr 1fr', gap: 10 }}>
              <Stat label="MEAN" value={(ranked.reduce((s,x) => s + x.score, 0) / ranked.length).toFixed(1)}/>
              <Stat label="MEDIAN" value={ranked[Math.floor(ranked.length/2)]?.score || '–'}/>
              <Stat label="≥ 4" value={ranked.filter(x => x.score >= 4).length} sub="strong"/>
              <Stat label="≤ 2" value={ranked.filter(x => x.score <= 2).length} sub="weak"/>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, sub }) {
  return (
    <div style={{ padding:'12px 14px', background: C.cream, border:`1px solid ${C.rule}` }}>
      <MonoLabel color={C.faint} size={9}>{label}</MonoLabel>
      <div style={{ fontFamily: FONT_HEAD, fontSize: 26, fontWeight: 500, color: C.ink, marginTop: 2 }}>
        {value}
      </div>
      {sub && <div style={{ fontFamily: FONT_HEAD, fontStyle:'italic', fontSize: 11, color: C.slate }}>{sub}</div>}
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function App() {
  const [view, setView] = useState('dashboard');
  // Lifted state for cross-view persistence
  const [allScores, setAllScores] = useState(ALL_SCORES_INIT);
  const [allNotes, setAllNotes] = useState(NOTES);
  const [requestStatuses, setRequestStatuses] = useState({});

  return (
    <div style={{ display:'flex', minHeight:'100vh', background: C.paper, color: C.ink,
                  fontFamily:'system-ui, -apple-system, sans-serif', fontSize: 14 }}>
      <SideNav current={view} onChange={setView}/>
      <main style={{ flex: 1, minWidth: 0, overflow:'auto' }}>
        {view === 'dashboard'    && <DashboardView/>}
        {view === 'inbox'        && <InboxView requestStatuses={requestStatuses} setRequestStatuses={setRequestStatuses}/>}
        {view === 'pipeline'     && <PipelineView/>}
        {view === 'intel'        && <IntelView/>}
        {view === 'lifecycle'    && <LifecycleView/>}
        {view === 'evaluate'     && <EvaluateView allScores={allScores} setAllScores={setAllScores}
                                                   allNotes={allNotes} setAllNotes={setAllNotes}/>}
        {view === 'stakeholders' && <StakeholdersView/>}
        {view === 'governance'   && <GovernanceView/>}
        {view === 'reports'      && <ReportsView allScores={allScores}/>}
        {view === 'templates'    && <TemplatesView/>}
        {view === 'framework'    && <FrameworkView/>}
      </main>
    </div>
  );
}
