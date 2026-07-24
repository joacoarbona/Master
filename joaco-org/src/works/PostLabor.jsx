import React, { useState, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis, LabelList, BarChart, Bar, Cell, ReferenceLine, ReferenceArea
} from "recharts";

/* ============================================================
   THE FIVE PAYMENTS
   What happens to prices, household baskets and savings when
   the cost of labour falls towards zero — but land, atoms and
   scarcity do not.
   ============================================================ */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap');

.fp { --paper:#F1F3F5; --card:#FFFFFF; --card2:#F7F9FA; --rule:#DCE2E7; --rule2:#C3CDD5;
  --ink:#131A21; --body:#3B4854; --mute:#6C7C89; --dim:#93A2AE;
  --defl:#0E7C86; --defl2:#E0F1F2; --infl:#93356B; --infl2:#F6E7EF;
  --alarm:#B3382C; --ok:#2F6E3F;
  background:var(--paper); color:var(--body);
  font-family:'IBM Plex Sans',system-ui,sans-serif; font-size:14px; line-height:1.55; }
.fp *{box-sizing:border-box;}
.fp h1,.fp h2,.fp h3,.fp h4,.fp .disp{font-family:'Archivo',system-ui,sans-serif;
  letter-spacing:-0.022em;color:var(--ink);}
.fp .mono{font-family:'IBM Plex Mono',ui-monospace,monospace;font-variant-numeric:tabular-nums;}
.fp .eyebrow{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:0.2em;
  text-transform:uppercase;color:var(--dim);}
.fp .wrap{max-width:1260px;margin:0 auto;padding:24px 18px 64px;}

.fp .masthead{border-bottom:2px solid var(--ink);padding-bottom:16px;margin-bottom:18px;}
.fp .masthead h1{font-size:34px;font-weight:700;margin:7px 0 6px;line-height:1.05;}
.fp .masthead p{color:var(--body);max-width:70ch;margin:0;font-size:14px;}

.fp .grid{display:grid;grid-template-columns:296px 1fr;gap:18px;align-items:start;}
@media (max-width:920px){.fp .grid{grid-template-columns:1fr;}}
.fp .card{background:var(--card);border:1px solid var(--rule);border-radius:4px;padding:16px;}
.fp .rail{position:sticky;top:10px;max-height:calc(100vh - 24px);overflow:auto;}
.fp .rail::-webkit-scrollbar{width:7px;}
.fp .rail::-webkit-scrollbar-thumb{background:var(--rule2);border-radius:4px;}

.fp .lever{margin:0 0 14px;}
.fp .lever .top{display:flex;justify-content:space-between;align-items:baseline;gap:8px;}
.fp .lever label{font-size:12px;color:var(--ink);font-weight:500;}
.fp .lever .val{font-family:'IBM Plex Mono',monospace;font-size:12px;color:var(--defl);font-weight:500;}
.fp .lever .hint{font-size:11px;color:var(--mute);margin-top:1px;}
.fp input[type=range]{width:100%;margin-top:6px;accent-color:var(--defl);height:16px;}
.fp input[type=number]{background:var(--card2);border:1px solid var(--rule);color:var(--ink);
  font-family:'IBM Plex Mono',monospace;font-size:12px;padding:3px 5px;width:64px;border-radius:3px;}
.fp select{background:var(--card);border:1px solid var(--rule2);color:var(--ink);
  font-size:13px;padding:5px 8px;border-radius:3px;font-family:'IBM Plex Sans',sans-serif;}

.fp .tabs{display:flex;gap:3px;flex-wrap:wrap;margin-bottom:16px;border-bottom:1px solid var(--rule);}
.fp .tab{background:none;border:none;border-bottom:2px solid transparent;color:var(--mute);
  font-family:'Archivo',sans-serif;font-size:13.5px;font-weight:500;padding:9px 14px;cursor:pointer;}
.fp .tab:hover{color:var(--ink);}
.fp .tab.on{color:var(--ink);border-bottom-color:var(--infl);}
.fp .tab:focus-visible,.fp .preset:focus-visible,.fp button:focus-visible{outline:2px solid var(--defl);outline-offset:2px;}

.fp .presets{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:16px;}
.fp .preset{background:var(--card);border:1px solid var(--rule2);color:var(--body);
  font-size:12px;padding:6px 11px;border-radius:3px;cursor:pointer;font-family:'IBM Plex Sans',sans-serif;}
.fp .preset:hover{border-color:var(--ink);color:var(--ink);}
.fp .preset.on{border-color:var(--infl);color:var(--infl);background:var(--infl2);font-weight:500;}

.fp .stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(158px,1fr));gap:1px;
  background:var(--rule);border:1px solid var(--rule);margin-bottom:16px;border-radius:4px;overflow:hidden;}
.fp .stat{background:var(--card);padding:12px 13px;}
.fp .stat .k{font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:0.12em;
  text-transform:uppercase;color:var(--dim);}
.fp .stat .v{font-family:'Archivo',sans-serif;font-size:24px;font-weight:600;margin-top:4px;color:var(--ink);}
.fp .stat .s{font-size:11.5px;color:var(--mute);margin-top:2px;}

.fp table{width:100%;border-collapse:collapse;font-size:12.5px;}
.fp th{text-align:right;font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:0.1em;
  text-transform:uppercase;color:var(--dim);padding:7px 7px;border-bottom:1px solid var(--rule2);font-weight:500;}
.fp th:first-child,.fp td:first-child{text-align:left;}
.fp td{padding:6px 7px;border-bottom:1px solid var(--rule);text-align:right;
  font-family:'IBM Plex Mono',monospace;font-variant-numeric:tabular-nums;color:var(--ink);}
.fp tbody tr:hover td{background:var(--card2);}
.fp .sect{font-family:'IBM Plex Sans',sans-serif !important;}

.fp .note{font-size:12.5px;color:var(--mute);margin:11px 0 0;max-width:82ch;}
.fp .chip{display:inline-block;font-family:'IBM Plex Mono',monospace;font-size:10.5px;
  padding:2px 7px;border-radius:3px;border:1px solid var(--rule2);color:var(--mute);background:var(--card2);}
.fp .bar{height:8px;background:var(--card2);border:1px solid var(--rule);border-radius:2px;overflow:hidden;}
.fp .bar>i{display:block;height:100%;}
.fp h3{font-size:16px;margin:0 0 3px;font-weight:600;}
.fp h4{font-size:13.5px;margin:18px 0 5px;font-weight:600;}
.fp .sub{font-size:12.5px;color:var(--mute);margin:0 0 14px;max-width:88ch;}
.fp .split{display:grid;grid-template-columns:1fr 1fr;gap:18px;}
@media (max-width:840px){.fp .split{grid-template-columns:1fr;}}

.fp .verdict{border-left:3px solid var(--infl);background:var(--infl2);padding:12px 14px;
  margin:16px 0 0;font-size:13px;color:var(--ink);border-radius:0 3px 3px 0;}
.fp .verdict.good{border-left-color:var(--defl);background:var(--defl2);}
.fp .verdict b{font-family:'Archivo',sans-serif;}

.fp .legend{display:flex;flex-wrap:wrap;gap:6px 14px;margin-top:12px;padding-top:12px;
  border-top:1px solid var(--rule);}
.fp .lg{display:flex;align-items:center;gap:6px;font-size:11.5px;color:var(--body);}
.fp .sw{width:14px;height:3px;border-radius:2px;flex:none;}
.fp .ramp{height:9px;border-radius:2px;background:linear-gradient(90deg,#0E7C86,#4C5C7C,#93356B);}

.fp .steps{counter-reset:s;list-style:none;padding:0;margin:0;}
.fp .steps li{position:relative;padding-left:34px;margin-bottom:14px;}
.fp .steps li:before{counter-increment:s;content:counter(s);position:absolute;left:0;top:1px;
  width:22px;height:22px;border-radius:50%;background:var(--ink);color:var(--paper);
  font-family:'IBM Plex Mono',monospace;font-size:11px;display:flex;align-items:center;justify-content:center;}
.fp .steps li b{font-family:'Archivo',sans-serif;color:var(--ink);}

.fp dl{margin:0;} .fp dt{font-weight:600;color:var(--ink);font-size:13px;margin-top:12px;}
.fp dd{margin:2px 0 0;font-size:12.5px;color:var(--body);}
.fp .anat{display:flex;height:26px;border-radius:3px;overflow:hidden;border:1px solid var(--rule);}
.fp .anat>span{display:flex;align-items:center;justify-content:center;font-family:'IBM Plex Mono',monospace;
  font-size:9.5px;color:#fff;overflow:hidden;white-space:nowrap;}
.fp .kbd{font-family:'IBM Plex Mono',monospace;font-size:11px;background:var(--card2);
  border:1px solid var(--rule2);border-radius:3px;padding:1px 5px;color:var(--ink);}
@media (prefers-reduced-motion:no-preference){
  .fp .fade{animation:fpf .3s ease-out;} @keyframes fpf{from{opacity:0;transform:translateY(4px);}to{opacity:1;}}
}
`;
/* ---------- 1. PEOPLE : 17 country buckets ---------- */
/* pop = millions 2026 | y = GNI per head, USD PPP | g = trend real growth
   d = AI/robotics diffusion capacity (0-1) | lc = land/permit constraint (0-1)
   mr = median / mean income ratio today | ws = labour share of income today
   dep = people supported per earner (dependency on someone else's wage)      */
const GEOS_0 = [
  { id:"US",  name:"United States",              pop:345,  pg:0.004,  y:76000, g:0.018, d:1.00, lc:0.55, mr:0.60, ws:0.58, dep:2.0 },
  { id:"CAZ", name:"Canada + Aus/NZ",            pop:75,   pg:0.009,  y:58000, g:0.016, d:0.90, lc:0.60, mr:0.66, ws:0.57, dep:2.0 },
  { id:"UKN", name:"UK + Nordics + CH",          pop:105,  pg:0.004,  y:60000, g:0.014, d:0.85, lc:0.70, mr:0.68, ws:0.60, dep:2.0 },
  { id:"EUC", name:"EU core-north",              pop:220,  pg:0.001,  y:55000, g:0.012, d:0.75, lc:0.75, mr:0.70, ws:0.61, dep:2.1 },
  { id:"EUS", name:"EU south",                   pop:130,  pg:-0.002, y:42000, g:0.011, d:0.60, lc:0.70, mr:0.68, ws:0.57, dep:2.3 },
  { id:"EUE", name:"EU east",                    pop:95,   pg:-0.004, y:35000, g:0.022, d:0.55, lc:0.45, mr:0.69, ws:0.54, dep:2.2 },
  { id:"LAU", name:"LatAm upper-middle",         pop:400,  pg:0.007,  y:19000, g:0.018, d:0.40, lc:0.40, mr:0.52, ws:0.50, dep:2.6 },
  { id:"LAL", name:"LatAm lower + Caribbean",    pop:265,  pg:0.009,  y:11000, g:0.022, d:0.28, lc:0.35, mr:0.50, ws:0.48, dep:3.0 },
  { id:"CHN", name:"China",                      pop:1410, pg:-0.002, y:25000, g:0.032, d:0.85, lc:0.65, mr:0.58, ws:0.52, dep:2.2 },
  { id:"AAS", name:"Advanced Asia (JP KR TW SG)",pop:205,  pg:-0.005, y:52000, g:0.013, d:0.90, lc:0.80, mr:0.66, ws:0.56, dep:2.1 },
  { id:"IND", name:"India + South Asia",         pop:2000, pg:0.008,  y:10000, g:0.050, d:0.45, lc:0.55, mr:0.48, ws:0.47, dep:3.4 },
  { id:"SEA", name:"SE Asia emerging",           pop:690,  pg:0.008,  y:14000, g:0.038, d:0.40, lc:0.45, mr:0.54, ws:0.48, dep:2.9 },
  { id:"GCC", name:"Gulf states",                pop:60,   pg:0.014,  y:62000, g:0.020, d:0.65, lc:0.30, mr:0.45, ws:0.38, dep:2.4 },
  { id:"NAL", name:"North Africa + Levant",      pop:290,  pg:0.015,  y:12000, g:0.024, d:0.25, lc:0.35, mr:0.55, ws:0.45, dep:3.6 },
  { id:"WAF", name:"West + Central Africa",      pop:620,  pg:0.024,  y:4500,  g:0.030, d:0.12, lc:0.20, mr:0.46, ws:0.44, dep:4.0 },
  { id:"ESA", name:"East + Southern Africa",     pop:620,  pg:0.023,  y:4200,  g:0.032, d:0.15, lc:0.25, mr:0.44, ws:0.44, dep:3.9 },
  { id:"EUR", name:"Eurasia (RU TR C.Asia)",     pop:300,  pg:0.003,  y:24000, g:0.015, d:0.35, lc:0.30, mr:0.56, ws:0.50, dep:2.4 },
];

/* ---------- 2. BASKET + 4. FACTOR MIX : 12 sectors ---------- */
const SECTORS_0 = [
  { id:0,  name:"Staple food & agriculture",   short:"Food",      f:{lab:.28,cap:.18,res:.30,land:.20,scar:.04}, auto:.55, lo:38, hi:4,  tilt:-0.30 },
  { id:1,  name:"Housing & shelter",           short:"Housing",   f:{lab:.12,cap:.18,res:.10,land:.58,scar:.02}, auto:.60, lo:20, hi:22, tilt:-0.10 },
  { id:2,  name:"Energy & utilities",          short:"Energy",    f:{lab:.10,cap:.35,res:.40,land:.08,scar:.07}, auto:.70, lo:7,  hi:3,  tilt:-0.05 },
  { id:3,  name:"Manufactured goods",          short:"Goods",     f:{lab:.25,cap:.35,res:.28,land:.04,scar:.08}, auto:.85, lo:12, hi:8,  tilt:0.05 },
  { id:4,  name:"Transport & mobility",        short:"Transport", f:{lab:.30,cap:.30,res:.28,land:.06,scar:.06}, auto:.85, lo:8,  hi:9, tilt:0.05 },
  { id:5,  name:"Healthcare & longevity",      short:"Health",    f:{lab:.52,cap:.18,res:.10,land:.08,scar:.12}, auto:.55, lo:4,  hi:15, tilt:0.20 },
  { id:6,  name:"Education & training",        short:"Education", f:{lab:.68,cap:.10,res:.03,land:.09,scar:.10}, auto:.70, lo:3,  hi:6,  tilt:0.10 },
  { id:7,  name:"Professional & business svc", short:"Prof svc",  f:{lab:.72,cap:.12,res:.02,land:.08,scar:.06}, auto:.80, lo:2,  hi:6,  tilt:0.10 },
  { id:8,  name:"Software, digital & media",   short:"Digital",   f:{lab:.55,cap:.22,res:.06,land:.02,scar:.15}, auto:.90, lo:1,  hi:5,  tilt:0.10 },
  { id:9,  name:"Leisure, travel & hospitality",short:"Leisure",  f:{lab:.40,cap:.20,res:.12,land:.22,scar:.06}, auto:.45, lo:3,  hi:13, tilt:0.30 },
  { id:10, name:"Luxury, status & positional", short:"Status",    f:{lab:.22,cap:.12,res:.16,land:.10,scar:.40}, auto:.35, lo:1,  hi:12,  tilt:0.80 },
  { id:11, name:"Finance, insurance & security",short:"Finance",  f:{lab:.48,cap:.22,res:.03,land:.07,scar:.20}, auto:.75, lo:7,  hi:12,  tilt:0.50 },
];

/* ---------- Assets ---------- */
const ASSETS = [
  { id:"farm", name:"Farmland & agri land",        e:{land:.65,res:.35},          s:0,  note:"Owns dirt that grows calories" },
  { id:"resi", name:"Urban residential land",      e:{land:1.0},                  s:1,  note:"Pure Ricardian rent" },
  { id:"logi", name:"Prime logistics & industrial",e:{land:.70,cap:.30},          s:3,  note:"Land under the robots" },
  { id:"grid", name:"Power generation & grid",     e:{res:.45,cap:.30,scar:.25},  s:2,  note:"Permits are the moat" },
  { id:"mine", name:"Critical minerals & mining",  e:{res:.90,cap:.10},           s:3,  note:"Atoms per robot" },
  { id:"watr", name:"Water rights & utilities",    e:{land:.40,res:.30,scar:.30}, s:2,  note:"Regulated, non-reproducible" },
  { id:"robo", name:"Robotics & automation capex", e:{cap:.70,scar:.30},          s:3,  note:"Sells the deflation" },
  { id:"ai",   name:"Frontier AI & compute",       e:{scar:.60,cap:.40},          s:8,  note:"Scarcity rent while it lasts" },
  { id:"saas", name:"Seat-priced software",        e:{cap:.40,lab:.30,scar:.30},  s:8,  note:"Priced per human seat" },
  { id:"bpo",  name:"Labour arbitrage (BPO, ITO)", e:{lab:.90,cap:.10},           s:7,  note:"Sells hours" },
  { id:"prof", name:"Professional svc rollups",    e:{lab:.80,scar:.20},          s:7,  note:"Bills by the hour" },
  { id:"luxe", name:"Luxury & heritage brands",    e:{scar:.75,res:.15,land:.10}, s:10, note:"Sells what can't be copied", top:true },
  { id:"expr", name:"Experiences, venues, travel", e:{land:.45,scar:.30,lab:.25}, s:9,  note:"Fixed seats, rising demand" },
  { id:"heal", name:"Healthcare delivery",         e:{lab:.40,scar:.35,cap:.25},  s:5,  note:"Licence-limited capacity" },
  { id:"stpl", name:"Staples & discount retail",   e:{cap:.40,land:.30,res:.30},  s:0,  note:"Sells to whoever is left" },
  { id:"eqty", name:"Broad equity index",          e:{cap:.35,scar:.25,res:.20,land:.20}, s:3, note:"A bit of everything" },
  { id:"bond", name:"Long nominal bonds",          e:{},                          s:null, kind:"bond", note:"Wins only if deflation is real" },
  { id:"gold", name:"Gold & monetary metals",      e:{scar:.80,res:.20},          s:null, note:"Neither land nor labour" },
  { id:"cash", name:"Cash",                        e:{},                          s:null, kind:"cash", note:"The null hypothesis" },
];

/* ---------- 3. HYPOTHESES ---------- */
const PRESETS = {
  musk: { label:"H1 · Musk: full abundance",
    d:{ decay:0.12, diffM:1.20, spread:0.60, learn:0.060, res:-0.010, landE:0.50, scar:0.010,
        boost:0.035, wage:0.005, sigma:0.85, reabsorb:0.85, redist:0.75, conc:0.60, mpcGap:0.40, end:2050 } },
  rent: { label:"H2 · Rent absorbs the surplus",
    d:{ decay:0.09, diffM:1.00, spread:1.20, learn:0.040, res:0.020,  landE:1.60, scar:0.035,
        boost:0.020, wage:0.020, sigma:0.55, reabsorb:0.70, redist:0.25, conc:0.78, mpcGap:0.40, end:2050 } },
  baum: { label:"H3 · Baumol drag: slow diffusion",
    d:{ decay:0.030, diffM:0.70, spread:1.30, learn:0.020, res:0.015, landE:1.00, scar:0.020,
        boost:0.006, wage:0.025, sigma:0.50, reabsorb:0.90, redist:0.30, conc:0.72, mpcGap:0.40, end:2050 } },
  ener: { label:"H4 · Energy & atoms bottleneck",
    d:{ decay:0.10, diffM:1.05, spread:1.10, learn:0.045, res:0.050,  landE:1.20, scar:0.030,
        boost:0.025, wage:0.015, sigma:0.60, reabsorb:0.70, redist:0.30, conc:0.75, mpcGap:0.40, end:2050 } },
  fork: { label:"H5 · Two-track world",
    d:{ decay:0.11, diffM:1.00, spread:2.20, learn:0.050, res:0.025,  landE:1.40, scar:0.030,
        boost:0.030, wage:0.018, sigma:0.60, reabsorb:0.55, redist:0.20, conc:0.82, mpcGap:0.40, end:2050 } },
  bust: { label:"H6 · Wages go first",
    d:{ decay:0.14, diffM:1.15, spread:1.40, learn:0.055, res:0.015,  landE:1.30, scar:0.030,
        boost:0.030, wage:0.010, sigma:0.55, reabsorb:0.15, redist:0.10, conc:0.88, mpcGap:0.75, end:2050 } },
};

/* ============================ ENGINE ============================ */
const TOPF = 0.10;            // top decile
const MPC_B = 0.96, MPC_T = 0.52;   // propensity to consume, bottom 90 / top 10
const REF_REDIST = 0.25, REF_CONC = 0.78;   // reference point used to calibrate t=0 only

function engelShare(sec, y) {
  const t = Math.max(0, Math.min(1, (Math.log(Math.max(y,600)) - Math.log(2000)) /
                                    (Math.log(250000) - Math.log(2000))));
  return sec.lo + (sec.hi - sec.lo) * t;
}

/* budget shares for one representative household at income y */
function basketAt(sectors, y, P, colv, sigma) {
  const raw = sectors.map((sec,i) => {
    const base = engelShare(sec, y);
    const rel  = Math.pow(Math.max(P[i]/colv, 0.02), 1 - sigma);
    return Math.max(0.0005, base * rel);
  });
  const tot = raw.reduce((a,b)=>a+b,0);
  return raw.map(v=>v/tot);
}

function runModel(L, geos, sectors) {
  const years = []; for (let y=2026; y<=L.end; y++) years.push(y);
  const NS = sectors.length, N = years.length - 1;

  const st = geos.map(g => {
    const eff = Math.min(1.25, Math.pow(g.d, L.spread) * L.diffM);
    // share of the wage bill that sits in automatable tasks
    const expose = (() => {
      let a=0,b=0; sectors.forEach(s=>{ const w=engelShare(s,g.y)*s.f.lab; a+=w*s.auto; b+=w; });
      return b>0 ? a/b : 0.6; })();
    // calibrate the wage skew so t=0 reproduces the observed median/mean ratio
    const fTop0 = Math.max(0.15, Math.min(0.70, 1 - (g.mr/0.88)*(1-TOPF)));
    const capRef = (1-g.ws)*((1-REF_REDIST)*REF_CONC + REF_REDIST*TOPF);
    const wTop = Math.max(0.12, Math.min(0.50, (fTop0 - capRef)/Math.max(g.ws,0.2)));
    return { g, eff, expose, wTop, pop:g.pop, ws:g.ws, emp:1, y:g.y,
             P:new Array(NS).fill(100), col:100, colBot:100, colTop:100, util:1, C0:null,
             yBot:0, yTop:0, yMed:0, out:1, sBot:null, sTop:null, pool:new Array(NS).fill(0) };
  });

  const splitIncome = (s) => {
    const fTop = s.ws*s.wTop + (1-s.ws)*((1-L.redist)*L.conc + L.redist*TOPF);
    const fT = Math.max(0.05, Math.min(0.92, fTop)), fB = 1-fT;
    s.fTop = fT;
    s.yTop = s.y*fT/TOPF;
    s.yBot = s.y*fB/(1-TOPF);
    s.yMed = s.yBot*0.88;
    s.C = fB*MPC_B + fT*MPC_T;
  };

  st.forEach(s => {
    splitIncome(s); s.C0 = s.C;
    s.sBot = basketAt(sectors, s.yMed, s.P, s.col, L.sigma);
    s.sTop = basketAt(sectors, s.yTop, s.P, s.col, L.sigma);
    s.sBot0 = s.sBot.slice();
    s.pool = sectors.map((_,i) =>
      s.pop*(1-TOPF)*s.yBot*MPC_B*s.sBot[i] + s.pop*TOPF*s.yTop*MPC_T*s.sTop[i]);
    s.ws0 = s.ws; s.yMed0 = s.yMed; s.yTop0 = s.yTop;
  });

  const pool0 = st.map(s=>s.pool.slice());
  const gW = sectors.map((_,i)=>st.reduce((a,s)=>a+s.pool[i],0));
  const gTot0 = gW.reduce((a,b)=>a+b,0);

  const rows = [{ year:2026, col:100, colBot:100, colTop:100, ws:100, emp:100, medReal:100, topReal:100 }];
  sectors.forEach((_,i)=>rows[0]["s"+i]=100);

  const track = [];

  for (let t=1; t<years.length; t++) {
    let fl=0,fk=0,fr=0,fd=0,fs=0,fw=0;
    st.forEach((s,ci) => {
      /* --- 1. displacement: the payment for a task migrates from wages to capital --- */
      const disp = s.expose * L.decay * s.eff * (1 - L.reabsorb);
      s.ws  = Math.max(0.04, s.ws * (1 - disp));
      s.emp = Math.max(0.25, s.emp * (1 - disp*0.55));
      const slack = 1 - s.emp;

      /* --- 2. realised real growth, capped by whether anyone can buy the output --- */
      const gr = s.g.g + L.boost*s.eff*s.util;
      s.out *= (1+gr);

      /* --- 3. price drift, and the unspent surplus bid into assets --- */
      const assetBid = 1 + 1.8*Math.max(0, (s.C0 - s.C)/s.C0);
      const dLand = L.landE*gr*s.g.lc*assetBid;
      const dScar = (L.scar + 0.30*gr)*assetBid;
      const dCap  = -L.learn, dRes = L.res;
      const wageEff = L.wage - 0.07*slack;

      const wB = s.sBot.map((v,i)=>v), wT = s.sTop.map((v,i)=>v);
      const wAllRaw = sectors.map((_,i)=>
        (1-TOPF)*s.yBot*MPC_B*wB[i] + TOPF*s.yTop*MPC_T*wT[i]);
      const wAllTot = wAllRaw.reduce((a,b)=>a+b,0);
      let colStep=0, colBotStep=0, colTopStep=0;
      const dP = sectors.map((sec,i) => {
        const dLab = (1-sec.auto)*wageEff - sec.auto*L.decay*s.eff;
        const d = sec.f.lab*dLab + sec.f.cap*dCap + sec.f.res*dRes + sec.f.land*dLand + sec.f.scar*dScar;
        colStep    += (wAllRaw[i]/wAllTot)*d;
        colBotStep += wB[i]*d;
        colTopStep += wT[i]*d;
        const w = pool0[ci][i];
        fl+=w*dLab; fk+=w*dCap; fr+=w*dRes; fd+=w*dLand; fs+=w*dScar; fw+=w;
        return d;
      });
      dP.forEach((d,i)=> s.P[i] *= (1+d));
      s.col    *= (1+colStep);
      s.colBot *= (1+colBotStep);
      s.colTop *= (1+colTopStep);

      /* --- 4. nominal income = real output growth x the price level (no double count) --- */
      s.y *= (1+gr)*(1+colStep);
      s.pop *= (1+s.g.pg);
      splitIncome(s);

      /* --- 5. next year's utilisation: concentrated income spends less --- */
      s.util = Math.max(0.30, Math.min(1.05, 1 - L.mpcGap*3*(1 - s.C/s.C0)));

      /* --- 6. rebuild each group's basket at its own REAL income --- */
      s.sBot = basketAt(sectors, s.yMed*100/s.colBot, s.P, s.colBot, L.sigma);
      s.sTop = basketAt(sectors, s.yTop*100/s.colTop, s.P, s.colTop, L.sigma);
      s.pool = sectors.map((_,i) =>
        s.pop*(1-TOPF)*s.yBot*MPC_B*s.sBot[i] + s.pop*TOPF*s.yTop*MPC_T*s.sTop[i]);
    });
    track.push({ lab:fl/fw, cap:fk/fw, res:fr/fw, land:fd/fw, scar:fs/fw });

    const row = { year: years[t] };
    sectors.forEach((_,i)=>{ let n=0; st.forEach((s,ci)=>{ n+=pool0[ci][i]*s.P[i]; }); row["s"+i]=n/gW[i]; });
    let cg=0, cb=0, ct=0, ws=0, wsum=0, mreal=0, treal=0, emp=0;
    st.forEach((s,ci)=>{ const w=pool0[ci].reduce((a,b)=>a+b,0);
      cg+=w*s.col; cb+=w*s.colBot; ct+=w*s.colTop; ws+=w*(s.ws/s.ws0)*100;
      mreal+=w*((s.yMed/s.yMed0)/(s.colBot/100))*100;
      treal+=w*((s.yTop/s.yTop0)/(s.colTop/100))*100;
      emp+=w*s.emp*100; wsum+=w; });
    row.col=cg/wsum; row.colBot=cb/wsum; row.colTop=ct/wsum;
    row.ws=ws/wsum; row.emp=emp/wsum;
    row.medReal=mreal/wsum; row.topReal=treal/wsum;
    rows.push(row);
  }

  const cagr = (a,b) => N>0 ? Math.pow(b/a,1/N)-1 : 0;
  const last = rows[rows.length-1];

  const sectorOut = sectors.map((sec,i) => {
    const poolEnd = st.reduce((a,s)=>a+s.pool[i],0), poolBeg = gW[i];
    const priceC = cagr(100,last["s"+i]), poolC = cagr(poolBeg,poolEnd);
    const volC = (1+poolC)/(1+priceC)-1;
    const nonRep = sec.f.land+sec.f.scar+sec.f.res;
    // what share of this sector's revenue now comes from the top decile
    let topRev=0, allRev=0;
    st.forEach(s=>{ topRev += s.pop*TOPF*s.yTop*MPC_T*s.sTop[i];
                    allRev += s.pool[i]; });
    return { ...sec, poolBeg, poolEnd, priceC, poolC, volC, nonRep,
      realPrice:(1+priceC)/(1+cagr(100,last.col))-1,
      topDep: allRev>0 ? topRev/allRev : 0,
      shareEnd: poolEnd/st.reduce((a,s)=>a+s.pool.reduce((x,y)=>x+y,0),0),
      shareBeg: poolBeg/gTot0 };
  });

  const z = arr => { const m=arr.reduce((a,b)=>a+b,0)/arr.length;
    const sd=Math.sqrt(arr.reduce((a,b)=>a+(b-m)*(b-m),0)/arr.length)||1; return arr.map(v=>(v-m)/sd); };
  const zP=z(sectorOut.map(s=>s.poolC)), zR=z(sectorOut.map(s=>s.realPrice)),
        zD=z(sectorOut.map(s=>s.nonRep-s.f.lab));
  sectorOut.forEach((s,i)=> s.score = 0.40*zP[i]+0.30*zR[i]+0.30*zD[i]);

  const geoOut = st.map((s,ci)=>({
    id:s.g.id, name:s.g.name, eff:s.eff, expose:s.expose, colC:cagr(100,s.col), col:s.col,
    popEnd:s.pop, popBeg:geos[ci].pop, yBeg:geos[ci].y, yEnd:s.y,
    wsBeg:s.ws0, wsEnd:s.ws, empEnd:s.emp,
    outC: cagr(1, s.out),
    medRealC: cagr(1, (s.yMed/s.yMed0)/(s.colBot/100)),
    topRealC: cagr(1, (s.yTop/s.yTop0)/(s.colTop/100)),
    colBotC: cagr(100, s.colBot), colTopC: cagr(100, s.colTop), dep: s.g.dep,
    medRatio: s.yMed/s.y, gap: s.yTop/s.yBot,
    shift: s.sBot.reduce((a,w,i)=>a+Math.abs(w-s.sBot0[i]),0)/2,
    sBot:s.sBot, sTop:s.sTop, sBot0:s.sBot0,
    poolEnd:s.pool.reduce((a,b)=>a+b,0), poolBeg:pool0[ci].reduce((a,b)=>a+b,0) }));

  const fAvg = track.reduce((a,b)=>({lab:a.lab+b.lab/N,cap:a.cap+b.cap/N,res:a.res+b.res/N,
    land:a.land+b.land/N,scar:a.scar+b.scar/N}),{lab:0,cap:0,res:0,land:0,scar:0});

  const worldCol = cagr(100,last.col);
  const colBotC = cagr(100,last.colBot);
  const colTopC = cagr(100,last.colTop);
  const medRealC = cagr(100,last.medReal);
  const topRealC = cagr(100,last.topReal);
  const wsEnd = last.ws/100;
  const nonRepShareBeg = sectorOut.reduce((a,s)=>a+s.shareBeg*s.nonRep,0);
  const nonRepShareEnd = sectorOut.reduce((a,s)=>a+s.shareEnd*s.nonRep,0);
  const deflating = sectorOut.filter(s=>s.priceC<-0.02).reduce((a,s)=>a+s.shareEnd,0);
  const spread = Math.max(...sectorOut.map(s=>last["s"+s.id]))/Math.min(...sectorOut.map(s=>last["s"+s.id]));
  const topRev = sectorOut.reduce((a,s)=>a+s.shareEnd*s.topDep,0);
  let ma=0,mw=0,ga=0; geoOut.forEach(g=>{ if(g.eff>=0.55){ const w=g.popBeg;
    ma+=w*g.medRealC; ga+=w*g.outC; mw+=w; } });
  const medRealAdv = mw>0 ? ma/mw : medRealC;
  const outAdv = mw>0 ? ga/mw : 0;
  const passThrough = outAdv>0.0005 ? medRealAdv/outAdv : (medRealAdv>=0 ? 1 : 0);

  /* three-state verdict */
  let verdict;
  if (medRealAdv < 0.0005) verdict = "collapse";
  else if (passThrough >= 0.70) verdict = "abundance";
  else verdict = "capture";

  return { years, rows, sectorOut, geoOut, fAvg, worldCol, colBotC, colTopC, medRealC, medRealAdv, outAdv, passThrough, topRealC, wsEnd,
           nonRepShareBeg, nonRepShareEnd, deflating, spread, topRev, verdict, N, cagr, last };
}

function assetReturns(M, L) {
  const f = M.fAvg;
  return ASSETS.map(a => {
    let nom;
    if (a.kind==="cash") nom = 0;
    else if (a.kind==="bond") nom = L.bondY;
    else {
      const price = (a.e.lab||0)*f.lab + (a.e.cap||0)*f.cap + (a.e.res||0)*f.res
                  + (a.e.land||0)*f.land + (a.e.scar||0)*f.scar;
      const vol = a.s===null ? 0 : M.sectorOut[a.s].volC;
      nom = price + vol*0.7;
    }
    return { ...a, nom };
  });
}
/* ============================ SHARED VOCAB ============================ */
const FACTORS = [
  { k:"lab",  name:"Labour",   c:"#0E7C86", def:"Hours of human work embodied in the price. The only thing Musk's argument acts on — and also the thing most households live on." },
  { k:"cap",  name:"Capital",  c:"#4A8FA8", def:"Machines, buildings and software that make the thing. Falls with learning curves, never to zero." },
  { k:"res",  name:"Atoms",    c:"#7C6E96", def:"Energy, steel, copper, lithium, water, fertiliser. Robots consume more of these, not fewer." },
  { k:"land", name:"Land",     c:"#A85A7E", def:"Location rent. Fixed supply. Rises with local income almost by definition." },
  { k:"scar", name:"Scarcity", c:"#93356B", def:"Anything that cannot be copied: brands, licences, permits, spectrum, a view, a registration, a Michelin star." },
];

const VERDICT = {
  abundance:{ label:"Abundance reaches households", c:"var(--ok)",
    say:"Most of the extra output shows up in the median household's real income. This is the world Musk describes." },
  capture:{ label:"Growth happens, households don't get it", c:"var(--infl)",
    say:"Output grows, prices fall, and the median household captures only a fraction of it. The rest goes to owners of land, licences and capital." },
  collapse:{ label:"Wage income falls faster than prices", c:"var(--alarm)",
    say:"The median household's real income is falling. Deflation here is not abundance — it is missing buyers." },
};

const SCENARIO_TEXT = {
  musk:{ assume:"Labour cost collapses fast, diffusion is near-universal, energy gets cheaper, land barely reacts, and three quarters of the capital surplus is recycled to households.",
    musk:"Right", tone:"good",
    watch:"Two load-bearing assumptions, not one: rent elasticity at 0.50 and redistribution at 75%. The second is a political choice nobody has made yet." },
  rent:{ assume:"Same technology, but landlords, licence-holders and brand owners capture the surplus. Rent rises about 1.6× as fast as income.",
    musk:"Wrong, and expensively so", tone:"bad",
    watch:"Shop prices still fall. The basket does not, because housing and positional goods swallow the saving." },
  baum:{ assume:"Baumol's cost disease holds. Automation is real but diffuses slowly through regulated, licensed, physical-world sectors.",
    musk:"Wrong on timing", tone:"bad",
    watch:"The boring scenario, and historically the most common. Wages survive because the machines never arrive at scale." },
  ener:{ assume:"AI works, but the atoms bite. Energy, copper, lithium and water get dearer as billions of robots demand them.",
    musk:"Wrong on mechanism", tone:"bad",
    watch:"Deflation in services, inflation in anything with mass. Miners and grid owners are the residual claimants." },
  fork:{ assume:"Diffusion is extremely uneven. Capable economies get the abundance; the rest get the price effects without the income.",
    musk:"Right for some, wrong for most", tone:"bad",
    watch:"Compare the cost-of-living and median-income columns across buckets. The spread is the whole story." },
  bust:{ assume:"Displaced workers are not reabsorbed, almost nothing is redistributed, and capital ownership is highly concentrated. The wage bill goes before the price level does.",
    musk:"Right about prices, catastrophically wrong about savings", tone:"bad",
    watch:"This is the scenario his claim ignores. Prices fall, and that is precisely the problem: they fall partly for lack of buyers." },
};

/* ============================ HELPERS ============================ */
const pct = (v,d=1) => (v*100).toFixed(d)+"%";
const sgn = (v,d=1) => (v>=0?"+":"")+(v*100).toFixed(d)+"%";
const money = v => v>=1e6 ? "$"+(v/1e6).toFixed(1)+"tn" : "$"+(v/1e3).toFixed(0)+"bn";
function mixColor(t){ const a=[14,124,134], b=[147,53,107];
  const c=a.map((v,i)=>Math.round(v+(b[i]-v)*Math.max(0,Math.min(1,t))));
  return `rgb(${c[0]},${c[1]},${c[2]})`; }

function Lever({label,hint,value,min,max,step,onChange,fmt}){
  return (<div className="lever">
    <div className="top"><label>{label}</label><span className="val">{fmt(value)}</span></div>
    {hint && <div className="hint">{hint}</div>}
    <input type="range" min={min} max={max} step={step} value={value}
      aria-label={label} onChange={e=>onChange(parseFloat(e.target.value))}/>
  </div>);
}
function Stat({k,v,s,color}){
  return <div className="stat"><div className="k">{k}</div>
    <div className="v" style={color?{color}:undefined}>{v}</div>{s && <div className="s">{s}</div>}</div>;
}
function Anatomy({f,height=26}){
  return <div className="anat" style={{height}}>
    {FACTORS.map(x=>{ const w=(f[x.k]||0)*100; if(w<0.5) return null;
      return <span key={x.k} title={`${x.name} ${w.toFixed(0)}%`}
        style={{width:w+"%",background:x.c}}>{w>=11?x.name:""}</span>;})}
  </div>;
}
function Basket({shares,sectors,height=24}){
  return <div className="anat" style={{height}}>
    {shares.map((v,i)=>{ const w=v*100; if(w<2.2) return null;
      return <span key={i} title={`${sectors[i].name} ${w.toFixed(0)}%`}
        style={{width:w+"%",background:mixColor((sectors[i].f.land+sectors[i].f.scar+sectors[i].f.res-0.15)/0.55)}}>
        {w>=9?sectors[i].short:""}</span>;})}
  </div>;
}
function FanTip({active,payload,label,unit}){
  if(!active||!payload||!payload.length) return null;
  const s=[...payload].sort((a,b)=>b.value-a.value);
  return <div style={{background:"#fff",border:"1px solid #C3CDD5",padding:"9px 11px",fontSize:11.5,
    boxShadow:"0 2px 10px rgba(19,26,33,.10)",borderRadius:4}}>
    <div className="mono" style={{color:"#6C7C89",marginBottom:5}}>{label} · {unit}</div>
    {s.map(p=><div key={p.dataKey} style={{display:"flex",justifyContent:"space-between",gap:16,color:p.stroke}}>
      <span>{p.name}</span><span className="mono">{p.value.toFixed(0)}</span></div>)}
  </div>;
}

/* ============================ APP ============================ */
export default function FivePayments(){
  const [preset,setPreset] = useState("rent");
  const [L,setL] = useState({...PRESETS.rent.d, bondY:0.038});
  const [geos,setGeos] = useState(GEOS_0);
  const [sectors,setSectors] = useState(SECTORS_0);
  const [tab,setTab] = useState("start");
  const [home,setHome] = useState("EUS");
  const [nest,setNest] = useState(25);
  const [alloc,setAlloc] = useState(()=>{ const o={}; ASSETS.forEach(a=>o[a.id]=0);
    o.eqty=40;o.resi=20;o.grid=10;o.farm=10;o.bond=10;o.cash=10; return o; });

  const set = k => v => { setL(p=>({...p,[k]:v})); setPreset("custom"); };
  const applyPreset = k => { setPreset(k); setL(p=>({...PRESETS[k].d, bondY:p.bondY})); };

  const M  = useMemo(()=>runModel(L,geos,sectors),[L,geos,sectors]);
  const AR = useMemo(()=>assetReturns(M,L),[M,L]);
  const ALL = useMemo(()=>Object.fromEntries(Object.keys(PRESETS).map(k=>{
    const l={...PRESETS[k].d,bondY:L.bondY}; const m=runModel(l,GEOS_0,SECTORS_0);
    return [k,{m,top:[...assetReturns(m,l)].sort((a,b)=>b.nom-a.nom).slice(0,3)}];})),[L.bondY]);

  const homeGeo  = M.geoOut.find(g=>g.id===home) || M.geoOut[0];
  const allocTot = Object.values(alloc).reduce((a,b)=>a+b,0)||1;
  const portNom  = AR.reduce((a,x)=>a+(alloc[x.id]/allocTot)*x.nom,0);
  const portReal = (1+portNom)/(1+homeGeo.colBotC)-1;
  const ppMult   = Math.pow(1+portReal,M.N);
  const cashReal = 100/M.last.colBot;
  const V = VERDICT[M.verdict];
  const sectorsByEnd = [...M.sectorOut].sort((a,b)=>M.last["s"+b.id]-M.last["s"+a.id]);

  return (
  <div className="fp"><style>{CSS}</style><div className="wrap">

    <div className="masthead">
      <div className="eyebrow">A reasoning tool · 17 economies · 12 sectors · 5 payments · two income classes · 17 levers</div>
      <h1>The Five Payments</h1>
      <p>Elon Musk says saving for retirement will be pointless in ten or twenty years because AI and robots drive
        labour costs to zero, and the cost of living follows. This tool takes that seriously enough to test it — by
        splitting every price into the five things you actually pay for, and by tracking the fact that
        <b> for most households, labour cost is not a cost. It is their income.</b></p>
    </div>

    <div className="presets">
      <span className="eyebrow" style={{alignSelf:"center",marginRight:2}}>Scenario</span>
      {Object.entries(PRESETS).map(([k,v])=>(
        <button key={k} className={"preset"+(preset===k?" on":"")} onClick={()=>applyPreset(k)}>{v.label}</button>))}
      {preset==="custom" && <span className="preset on">Custom settings</span>}
    </div>

    <div className="grid">
      {/* ---------------- LEVERS ---------------- */}
      <div className="card rail">
        <div className="eyebrow" style={{marginBottom:4}}>Levers</div>
        <p style={{fontSize:11.5,color:"var(--mute)",margin:"0 0 14px"}}>
          Move one at a time and watch the headline row. The five that decide almost everything are marked ◆.</p>

        <div className="eyebrow" style={{margin:"0 0 8px"}}>Technology</div>
        <Lever label="Horizon" hint="Model runs from 2026 to this year" value={L.end} min={2032} max={2066} step={1}
          onChange={set("end")} fmt={v=>v}/>
        <Lever label="◆ Labour unit-cost decay" hint="How fast the cost of an automatable task falls each year"
          value={L.decay} min={0} max={0.25} step={0.005} onChange={set("decay")} fmt={v=>"−"+pct(v)}/>
        <Lever label="Diffusion multiplier" hint="How much of the frontier the world actually deploys"
          value={L.diffM} min={0.2} max={1.5} step={0.05} onChange={set("diffM")} fmt={v=>v.toFixed(2)+"×"}/>
        <Lever label="Diffusion spread" hint="Above 1 widens the gap between capable and less capable economies"
          value={L.spread} min={0.3} max={3} step={0.1} onChange={set("spread")} fmt={v=>v.toFixed(1)}/>
        <Lever label="Capital-goods learning rate" hint="Annual fall in the price of the machines themselves"
          value={L.learn} min={0} max={0.12} step={0.005} onChange={set("learn")} fmt={v=>"−"+pct(v)}/>
        <Lever label="AI boost to output growth" hint="Extra real growth per year at full diffusion and full demand"
          value={L.boost} min={0} max={0.06} step={0.0025} onChange={set("boost")} fmt={v=>"+"+pct(v)}/>

        <div className="eyebrow" style={{margin:"18px 0 8px"}}>Who gets paid</div>
        <Lever label="◆ Reabsorption of displaced work" hint="Share of destroyed wage bill recreated as new human tasks. 0 = permanent."
          value={L.reabsorb} min={0} max={1} step={0.05} onChange={set("reabsorb")} fmt={v=>pct(v,0)}/>
        <Lever label="◆ Redistribution of the surplus" hint="Share of capital income recycled to households as transfers or UBI"
          value={L.redist} min={0} max={1} step={0.05} onChange={set("redist")} fmt={v=>pct(v,0)}/>
        <Lever label="◆ Capital ownership concentration" hint="Top decile's share of what capital earns"
          value={L.conc} min={0.4} max={0.97} step={0.01} onChange={set("conc")} fmt={v=>pct(v,0)}/>
        <Lever label="Demand feedback strength" hint="How much a concentrated income distribution suppresses realised output"
          value={L.mpcGap} min={0} max={1} step={0.05} onChange={set("mpcGap")} fmt={v=>v.toFixed(2)}/>
        <Lever label="Wage drift, non-automatable work" hint="Pay in work machines cannot take, before slack pressure"
          value={L.wage} min={0} max={0.06} step={0.0025} onChange={set("wage")} fmt={v=>sgn(v)}/>

        <div className="eyebrow" style={{margin:"18px 0 8px"}}>Scarcity</div>
        <Lever label="◆ Rent elasticity to income" hint="Share of each extra $1 of local income that land captures"
          value={L.landE} min={0} max={2.5} step={0.05} onChange={set("landE")} fmt={v=>v.toFixed(2)}/>
        <Lever label="Atoms & energy drift" hint="Negative means solar and mining abundance win the race"
          value={L.res} min={-0.05} max={0.08} step={0.005} onChange={set("res")} fmt={v=>sgn(v)}/>
        <Lever label="Scarcity & licence drift" hint="Annual price drift of things that cannot be copied"
          value={L.scar} min={0} max={0.07} step={0.0025} onChange={set("scar")} fmt={v=>sgn(v)}/>
        <Lever label="Substitution elasticity σ" hint="Below 1 means you cannot escape what gets expensive"
          value={L.sigma} min={0.2} max={1.6} step={0.05} onChange={set("sigma")} fmt={v=>v.toFixed(2)}/>
        <Lever label="Long bond yield" hint="Used only in the savings test" value={L.bondY} min={0} max={0.09}
          step={0.0025} onChange={set("bondY")} fmt={v=>pct(v)}/>
      </div>

      {/* ---------------- CANVAS ---------------- */}
      <div>
        <div className="tabs">
          {[["start","Start here"],["inc","Who gets paid"],["fan","Prices"],["geo","Geographies"],
            ["sec","Sectors"],["inv","Where to invest"],["save","Your savings"],["gloss","Glossary"]].map(([k,l])=>(
            <button key={k} className={"tab"+(tab===k?" on":"")} onClick={()=>setTab(k)}>{l}</button>))}
        </div>

        {tab!=="gloss" && tab!=="start" && (
          <div className="stats">
            <Stat k="Verdict" v={<span style={{fontSize:15,lineHeight:1.25,display:"block"}}>{V.label}</span>} color={V.c}/>
            <Stat k="Median household, real income" v={sgn(M.medRealAdv,2)+" /yr"}
              s="advanced economies" color={M.medRealAdv<0?"var(--alarm)":"var(--defl)"}/>
            <Stat k="Pass-through to the median" v={pct(Math.max(0,M.passThrough),0)}
              s={`of ${sgn(M.outAdv,1)} output growth`} color={M.passThrough<0.7?"var(--infl)":"var(--ok)"}/>
            <Stat k="Cost of living, bottom 90%" v={sgn(M.colBotC,2)+" /yr"}
              s={`top decile ${sgn(M.colTopC,2)}`} color={M.colBotC>0?"var(--infl)":"var(--defl)"}/>
            <Stat k="Labour share of income" v={pct(M.wsEnd,0)} s="of its 2026 level"
              color={M.wsEnd<0.7?"var(--alarm)":undefined}/>
            <Stat k="Top decile's share of spending" v={pct(M.topRev,0)} s="of all consumer revenue"
              color={M.topRev>0.4?"var(--infl)":undefined}/>
          </div>
        )}

        {/* ============ START HERE ============ */}
        {tab==="start" && (<div className="fade">
          <div className="card">
            <h3>The argument in one picture</h3>
            <p className="sub">Musk's claim is arithmetic: labour → 0, therefore prices → 0, therefore savings are
              pointless. The arithmetic only works if labour is the only thing you pay for. It isn't. Every price
              is five payments stacked together:</p>
            <Anatomy f={{lab:.25,cap:.20,res:.20,land:.20,scar:.15}} height={34}/>
            <div className="legend" style={{borderTop:"none",paddingTop:10,marginTop:8}}>
              {FACTORS.map(f=><span key={f.k} className="lg">
                <i className="sw" style={{background:f.c,height:10,width:10,borderRadius:2}}/>
                <b style={{fontWeight:600}}>{f.name}</b></span>)}
            </div>
            <p className="note" style={{marginTop:14}}>Robots crush the first two. They do nothing to the last three —
              land is fixed, atoms must be dug up, and scarcity is scarce by definition.</p>
          </div>

          <div className="card" style={{marginTop:16}}>
            <h3>And the payment that is somebody's wage</h3>
            <p className="sub">There is a second problem with the argument, and it is bigger than the first.</p>
            <p style={{fontSize:13.5,maxWidth:"78ch"}}>The blue band above is a <i>cost</i> to a firm and an
              <i> income</i> to a household. Around 55% of world income is wages, and in poorer economies most
              people either earn a wage or live on someone else's. If the price of an automatable task falls 10% a
              year, that payment does not disappear — <b>it migrates from labour to capital.</b> The output still
              gets made. The question is who is left holding a claim on it.</p>
            <p style={{fontSize:13.5,maxWidth:"78ch"}}>So this model tracks the labour share of income as a
              <i> state variable</i>, splits households into the bottom 90% and the top decile, gives each its own
              basket and its own cost of living, and lets aggregate demand fall when income concentrates — because
              the top decile saves a much larger fraction of what it receives. That saving is then bid into assets,
              which is why land and scarcity inflate hardest in exactly the scenario where the median is squeezed.</p>
            <div className="verdict">
              <b>The uncomfortable result.</b> Deflation is not evidence that Musk is right. In the wage-collapse
              scenario, prices fall <i>faster</i> than in the abundance scenario — partly because there are fewer
              buyers. The falling price index and the falling wage bill are the same event seen from two sides.
              To tell abundance from collapse you have to look at the median household's real income, not at prices.
              That is the second headline number on every tab.
            </div>
          </div>

          <div className="card" style={{marginTop:16}}>
            <h3>How to use this in five minutes</h3>
            <ol className="steps" style={{marginTop:12}}>
              <li><b>Pick a scenario</b> above. Each is a coherent set of beliefs, not a random setting.</li>
              <li><b>Read the verdict and the two numbers beside it.</b> Prices alone cannot answer the question;
                median real income and pass-through can.</li>
              <li><b>Open "Who gets paid"</b> to see the labour share, employment and the two income classes diverge.</li>
              <li><b>Open "Prices"</b> for the scissors, and <b>"Where to invest"</b> for the ranking that follows.</li>
              <li><b>Move one lever</b> and watch what flips. Anything that changes sign on a single lever is a bet
                on the hypothesis, not on the world.</li>
            </ol>
          </div>

          <div className="card" style={{marginTop:16}}>
            <h3>How to read the six hypotheses</h3>
            <p className="sub">All six run identical machinery on the same world. They differ in what they assume
              about diffusion, rent, atoms — and now about reabsorption and redistribution. Results at {L.end}.</p>
            <div style={{overflowX:"auto"}}>
            <table>
              <thead><tr><th>Hypothesis</th><th style={{width:"28%"}}>What it assumes</th><th>Cost of living,<br/>bottom 90%</th>
                <th>Median real<br/>income</th><th>Pass-<br/>through</th><th>Is Musk right?</th>
                <th style={{width:"18%"}}>What wins</th></tr></thead>
              <tbody>
                {Object.entries(PRESETS).map(([k,v])=>{ const r=ALL[k], t=SCENARIO_TEXT[k];
                  return (<tr key={k}>
                    <td className="sect"><b style={{color:"var(--ink)"}}>{v.label}</b>
                      <div style={{fontSize:10.5,color:VERDICT[r.m.verdict].c,fontFamily:"IBM Plex Sans"}}>
                        {VERDICT[r.m.verdict].label}</div></td>
                    <td className="sect" style={{textAlign:"left",fontSize:11.5,color:"var(--body)"}}>{t.assume}</td>
                    <td style={{color:r.m.colBotC>0?"var(--infl)":"var(--defl)"}}>{sgn(r.m.colBotC,2)}</td>
                    <td style={{color:r.m.medRealAdv<0?"var(--alarm)":"var(--defl)",fontWeight:600}}>{sgn(r.m.medRealAdv,2)}</td>
                    <td style={{color:r.m.passThrough<0.7?"var(--infl)":"var(--ok)"}}>{pct(Math.max(0,r.m.passThrough),0)}</td>
                    <td className="sect" style={{color:t.tone==="good"?"var(--ok)":"var(--alarm)",fontWeight:500,
                      textAlign:"right",fontSize:12}}>{t.musk}</td>
                    <td className="sect" style={{textAlign:"left",fontSize:11.5}}>{r.top.map(a=>a.name).join(", ")}</td>
                  </tr>);})}
              </tbody>
            </table>
            </div>
            <h4>Watch-outs, scenario by scenario</h4>
            <dl>{Object.entries(SCENARIO_TEXT).map(([k,t])=>(
              <React.Fragment key={k}><dt>{PRESETS[k].label}</dt><dd>{t.watch}</dd></React.Fragment>))}</dl>
          </div>

          <div className="card" style={{marginTop:16}}>
            <h3>What the tool models</h3>
            <div className="split" style={{gap:22}}>
              <dl>
                <dt>1 · People</dt><dd>17 country buckets — population, income per head, growth, capacity to deploy
                  automation, land constraint, labour share of income, and how many people each earner supports.</dd>
                <dt>2 · Products and services</dt><dd>12 sectors, with each group's budget share moving as its own
                  real income rises or falls. That is the Maslow ladder in spreadsheet form — and it runs backwards
                  too.</dd>
              </dl>
              <dl>
                <dt>3 · Price</dt><dd>Computed per sector and per bucket from the five payments, then reweighted
                  every year — separately for the bottom 90% and the top decile, who buy different things.</dd>
                <dt>4 · Factor mix</dt><dd>How much of each sector's cost is labour, capital, atoms, land and
                  scarcity — and how much of that labour a machine can actually take. That last number drives both
                  the price fall and the wage loss.</dd>
              </dl>
            </div>
          </div>
        </div>)}

        {/* ============ WHO GETS PAID ============ */}
        {tab==="inc" && (<div className="fade">
          <div className="card">
            <h3>Where the payment goes when the robot does the task</h3>
            <p className="sub">All four series start at 100 in 2026. The labour share is the share of national
              income paid to people for working; employment is an index of hours still demanded.</p>
            <div style={{height:330}}>
              <ResponsiveContainer>
                <LineChart data={M.rows} margin={{top:6,right:16,left:0,bottom:0}}>
                  <CartesianGrid stroke="#E4E9ED" vertical={false}/>
                  <XAxis dataKey="year" stroke="#93A2AE" tick={{fontSize:11,fontFamily:"IBM Plex Mono",fill:"#6C7C89"}}/>
                  <YAxis stroke="#93A2AE" width={50} tick={{fontSize:11,fontFamily:"IBM Plex Mono",fill:"#6C7C89"}}/>
                  <Tooltip content={<FanTip unit="index, 2026 = 100"/>}/>
                  <ReferenceLine y={100} stroke="#C3CDD5" strokeDasharray="4 4"/>
                  <Line type="monotone" dataKey="topReal" name="Top decile real income" stroke="#93356B"
                    strokeWidth={2.4} dot={false} isAnimationActive={false}/>
                  <Line type="monotone" dataKey="medReal" name="Median household real income" stroke="#0E7C86"
                    strokeWidth={2.8} dot={false} isAnimationActive={false}/>
                  <Line type="monotone" dataKey="ws" name="Labour share of income" stroke="#B3382C"
                    strokeWidth={2} dot={false} isAnimationActive={false}/>
                  <Line type="monotone" dataKey="emp" name="Employment index" stroke="#93A2AE"
                    strokeWidth={1.6} strokeDasharray="5 4" dot={false} isAnimationActive={false}/>
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="legend">
              <span className="lg"><i className="sw" style={{background:"#0E7C86"}}/>median household, real income</span>
              <span className="lg"><i className="sw" style={{background:"#93356B"}}/>top decile, real income</span>
              <span className="lg"><i className="sw" style={{background:"#B3382C"}}/>labour share of national income</span>
              <span className="lg"><i className="sw" style={{background:"#93A2AE"}}/>employment index</span>
              <span className="lg" style={{color:"var(--mute)"}}>each income line uses its own group's basket as the deflator</span>
            </div>
            <div className="verdict" style={{borderLeftColor:V.c,background:M.verdict==="abundance"?"var(--defl2)":"var(--infl2)"}}>
              <b>{V.label}.</b> {V.say} Output per head grows {sgn(M.outAdv,1)} a year in the automating economies;
              the median household sees {sgn(M.medRealAdv,2)}. That is a pass-through
              of {pct(Math.max(0,M.passThrough),0)}. Meanwhile the top decile's real income
              moves {sgn(M.topRealC,1)} a year, and its share of all consumer spending
              reaches {pct(M.topRev,0)}.
            </div>
          </div>

          <div className="card" style={{marginTop:16}}>
            <h3>Two households, two baskets</h3>
            <p className="sub">Each strip is one group's spending in {L.end}, sector by sector. When the median is
              squeezed, its basket walks back <i>down</i> the Maslow ladder — food and shelter reclaim the share
              that health, leisure and education had taken.</p>
            <div style={{marginBottom:6}}>
              <div style={{fontSize:12,marginBottom:4,color:"var(--ink)"}}>Bottom 90% in {homeGeo.name} — cost of
                living {sgn(homeGeo.colBotC,2)}/yr</div>
              <Basket shares={homeGeo.sBot} sectors={sectors} height={28}/>
            </div>
            <div style={{marginBottom:6}}>
              <div style={{fontSize:12,margin:"12px 0 4px",color:"var(--ink)"}}>Top decile in {homeGeo.name} — cost of
                living {sgn(homeGeo.colTopC,2)}/yr</div>
              <Basket shares={homeGeo.sTop} sectors={sectors} height={28}/>
            </div>
            <div style={{marginBottom:6}}>
              <div style={{fontSize:12,margin:"12px 0 4px",color:"var(--mute)"}}>Bottom 90% in 2026, for comparison</div>
              <Basket shares={homeGeo.sBot0} sectors={sectors} height={22}/>
            </div>
            <div style={{marginTop:12}}>
              <select value={home} onChange={e=>setHome(e.target.value)} aria-label="Bucket">
                {M.geoOut.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select>
            </div>
            <div className="legend">
              <span className="lg" style={{gap:10}}><span style={{color:"var(--defl)",fontSize:11}}>reproducible</span>
                <i className="ramp" style={{width:150}}/>
                <span style={{color:"var(--infl)",fontSize:11}}>cannot be copied</span></span>
              <span className="lg" style={{color:"var(--mute)"}}>hover any band for its exact share</span>
            </div>
          </div>

          <div className="card" style={{marginTop:16}}>
            <h3>By bucket: does the growth reach the household?</h3>
            <div style={{overflowX:"auto"}}>
            <table>
              <thead><tr><th>Bucket</th><th>Automatable<br/>wage bill</th><th>Labour share<br/>2026 → {L.end}</th>
                <th>Employment</th><th>Output /yr</th><th>Median real<br/>income /yr</th><th>Top decile<br/>real /yr</th>
                <th>Pass-<br/>through</th><th>People per<br/>earner</th></tr></thead>
              <tbody>{M.geoOut.map(g=>{ const pass = g.outC>0.0005 ? g.medRealC/g.outC : (g.medRealC>=0?1:0);
                return (<tr key={g.id}>
                  <td className="sect">{g.name}</td>
                  <td>{pct(g.expose,0)}</td>
                  <td>{pct(g.wsBeg,0)} → <b style={{color:g.wsEnd<g.wsBeg*0.8?"var(--alarm)":"var(--ink)"}}>{pct(g.wsEnd,0)}</b></td>
                  <td style={{color:g.empEnd<0.85?"var(--alarm)":undefined}}>{(g.empEnd*100).toFixed(0)}</td>
                  <td>{sgn(g.outC,1)}</td>
                  <td style={{color:g.medRealC<0?"var(--alarm)":"var(--defl)",fontWeight:600}}>{sgn(g.medRealC,2)}</td>
                  <td style={{color:"var(--infl)"}}>{sgn(g.topRealC,2)}</td>
                  <td style={{color:pass<0.7?"var(--infl)":"var(--ok)"}}>{pct(Math.max(0,pass),0)}</td>
                  <td>{g.dep.toFixed(1)}</td>
                </tr>);})}</tbody>
            </table>
            </div>
            <p className="note">Two patterns worth arguing with. First, the economies with the <i>most</i> automation
              lose the most wage share — the technology arrives where the wages are. Second, the buckets where
              people still live on someone else's labour are partly protected by not automating, which is a
              protection nobody would choose.</p>
          </div>
        </div>)}

        {/* ============ PRICES ============ */}
        {tab==="fan" && (<div className="fade">
          <div className="card">
            <h3>The scissors</h3>
            <p className="sub">Every sector starts at 100 in 2026. The thick dark line is the bottom 90%'s basket —
              what an ordinary household actually pays across everything, reweighted each year.</p>
            <div style={{height:400}}>
              <ResponsiveContainer>
                <LineChart data={M.rows} margin={{top:6,right:16,left:0,bottom:0}}>
                  <CartesianGrid stroke="#E4E9ED" vertical={false}/>
                  <XAxis dataKey="year" stroke="#93A2AE" tick={{fontSize:11,fontFamily:"IBM Plex Mono",fill:"#6C7C89"}}/>
                  <YAxis scale="log" domain={["auto","auto"]} stroke="#93A2AE" width={54}
                    tick={{fontSize:11,fontFamily:"IBM Plex Mono",fill:"#6C7C89"}}/>
                  <Tooltip content={<FanTip unit="price index, 2026 = 100"/>}/>
                  <ReferenceLine y={100} stroke="#C3CDD5" strokeDasharray="4 4"/>
                  {M.sectorOut.map(s=>(<Line key={s.id} type="monotone" dataKey={"s"+s.id} name={s.short}
                    stroke={mixColor((s.nonRep-0.15)/0.55)} dot={false} strokeWidth={1.7} isAnimationActive={false}/>))}
                  <Line type="monotone" dataKey="colBot" name="Basket, bottom 90%" stroke="#131A21"
                    strokeWidth={3} dot={false} isAnimationActive={false}/>
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="legend">
              <span className="lg" style={{width:"100%",marginBottom:2}}>
                <b style={{fontWeight:600,color:"var(--ink)"}}>Legend</b>
                <span style={{color:"var(--mute)"}}>— ordered by price at {L.end}, highest first. Colour shows how
                  much of the sector's cost is land, atoms and scarcity.</span></span>
              <span className="lg" style={{gap:8}}><i className="sw" style={{background:"#131A21",height:4,width:20}}/>
                <b style={{fontWeight:600}}>Basket, bottom 90%</b></span>
              {sectorsByEnd.map(s=>(<span key={s.id} className="lg">
                <i className="sw" style={{background:mixColor((s.nonRep-0.15)/0.55)}}/>
                {s.short}<span className="mono" style={{color:"var(--mute)"}}>{M.last["s"+s.id].toFixed(0)}</span></span>))}
              <span className="lg" style={{width:"100%",marginTop:6,gap:10}}>
                <span style={{color:"var(--defl)",fontSize:11}}>reproducible</span>
                <i className="ramp" style={{width:180}}/>
                <span style={{color:"var(--infl)",fontSize:11}}>cannot be copied</span></span>
            </div>
            <div className="verdict" style={{borderLeftColor:V.c}}>
              <b>Reading this chart.</b> Musk is right about the teal lines. He is wrong that they settle the
              question. Labour going to zero collapses anything reproducible and does nothing to a hectare in a good
              school district, a grid connection, a licence or a name people recognise. The bottom 90%'s basket moves
              {" "}<b style={{color:M.colBotC>0?"var(--infl)":"var(--defl)"}}>{sgn(M.colBotC,2)} a year</b> — and
              their income moves <b style={{color:M.medRealAdv<0?"var(--alarm)":"var(--defl)"}}>{sgn(M.medRealAdv,2)}</b>.
              Compare those two numbers before concluding anything about savings.
            </div>
          </div>

          <div className="card" style={{marginTop:16}}>
            <h3>Average annual drift, by payment</h3>
            <p className="sub">The whole argument in five numbers. Everything else in this tool is weighting.</p>
            {FACTORS.map(f=>{ const v=M.fAvg[f.k];
              return (<div key={f.k} style={{display:"grid",gridTemplateColumns:"210px 1fr 74px",gap:12,
                alignItems:"center",marginBottom:9}}>
                <span style={{fontSize:12.5}}><i style={{display:"inline-block",width:9,height:9,borderRadius:2,
                  background:f.c,marginRight:7}}/>{f.name}</span>
                <div className="bar"><i style={{width:Math.min(100,Math.abs(v)*600)+"%",
                  background:v<0?"var(--defl)":"var(--infl)"}}/></div>
                <span className="mono" style={{fontSize:12,textAlign:"right",
                  color:v<0?"var(--defl)":"var(--infl)"}}>{sgn(v,2)}</span></div>);})}
            <div className="legend">
              <span className="lg"><i className="sw" style={{background:"var(--defl)",height:9,width:9,borderRadius:2}}/>getting cheaper</span>
              <span className="lg"><i className="sw" style={{background:"var(--infl)",height:9,width:9,borderRadius:2}}/>getting dearer</span>
              <span className="lg" style={{color:"var(--mute)"}}>the labour bar is also the household income line, inverted</span>
            </div>
          </div>
        </div>)}

        {/* ============ GEOGRAPHIES ============ */}
        {tab==="geo" && (<div className="fade card">
          <h3>People and prices, by bucket</h3>
          <p className="sub">Diffusion and land constraint are editable — the two country-level dials that decide who
            gets the abundance and who gets the price effects without the income.</p>
          <div style={{overflowX:"auto"}}>
          <table>
            <thead><tr><th>Bucket</th><th>Pop 2026 → {L.end}</th><th>Income/head</th><th>Diffusion 0–1</th>
              <th>Land constraint 0–1</th><th>Cost of living,<br/>bottom 90%</th><th>Median real<br/>income /yr</th>
              <th>Basket shift</th><th>Spend pool</th></tr></thead>
            <tbody>{M.geoOut.map((g,i)=>(<tr key={g.id}>
              <td className="sect">{g.name}</td>
              <td>{g.popBeg.toFixed(0)} → {g.popEnd.toFixed(0)}m</td>
              <td>{(g.yBeg/1000).toFixed(0)}k → {(g.yEnd/1000).toFixed(0)}k</td>
              <td><input type="number" min="0" max="1" step="0.05" value={geos[i].d} aria-label={"Diffusion "+g.name}
                onChange={e=>{const v=parseFloat(e.target.value)||0; setGeos(p=>p.map((x,j)=>j===i?{...x,d:v}:x));}}/></td>
              <td><input type="number" min="0" max="1" step="0.05" value={geos[i].lc} aria-label={"Land constraint "+g.name}
                onChange={e=>{const v=parseFloat(e.target.value)||0; setGeos(p=>p.map((x,j)=>j===i?{...x,lc:v}:x));}}/></td>
              <td style={{color:g.colBotC>0?"var(--infl)":"var(--defl)"}}>{sgn(g.colBotC,2)}</td>
              <td style={{color:g.medRealC<0?"var(--alarm)":"var(--defl)",fontWeight:600}}>{sgn(g.medRealC,2)}</td>
              <td>{pct(g.shift,0)}</td><td>{money(g.poolEnd/1000)}</td>
            </tr>))}</tbody>
          </table>
          </div>
          <h4>Median household real income, annual change by bucket</h4>
          <div style={{height:240}}>
            <ResponsiveContainer>
              <BarChart data={M.geoOut.map(g=>({name:g.id,v:g.medRealC*100,full:g.name}))} margin={{top:4,right:8,left:0,bottom:4}}>
                <CartesianGrid stroke="#E4E9ED" vertical={false}/>
                <XAxis dataKey="name" stroke="#93A2AE" tick={{fontSize:10,fontFamily:"IBM Plex Mono",fill:"#6C7C89"}}/>
                <YAxis stroke="#93A2AE" width={46} tickFormatter={v=>v.toFixed(1)+"%"}
                  tick={{fontSize:10,fontFamily:"IBM Plex Mono",fill:"#6C7C89"}}/>
                <Tooltip contentStyle={{background:"#fff",border:"1px solid #C3CDD5",fontSize:12,borderRadius:4}}
                  formatter={v=>[v.toFixed(2)+"% per year","Median real income"]}
                  labelFormatter={(l,p)=>p&&p[0]?p[0].payload.full:l}/>
                <ReferenceLine y={0} stroke="#93A2AE"/>
                <Bar dataKey="v" isAnimationActive={false}>
                  {M.geoOut.map(g=><Cell key={g.id} fill={g.medRealC<0?"#B3382C":"#0E7C86"}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="legend">
            <span className="lg"><i className="sw" style={{background:"#0E7C86",height:10,width:10,borderRadius:2}}/>median household gaining</span>
            <span className="lg"><i className="sw" style={{background:"#B3382C",height:10,width:10,borderRadius:2}}/>median household losing</span>
            <span className="lg" style={{color:"var(--mute)"}}>bucket codes match the table above</span>
          </div>
          <p className="note">Deflation shows up in the shops; inflation shows up in the deed; and the wage loss
            shows up wherever the automation actually landed. Those three effects rarely hit the same people.</p>
        </div>)}

        {/* ============ SECTORS ============ */}
        {tab==="sec" && (<div className="fade">
          <div className="card">
            <h3>Anatomy of a price, sector by sector</h3>
            <p className="sub">Each strip is one sector's cost split into the five payments. Labour and capital are
              what automation attacks; the rest survives. Remember the labour band is also somebody's income.</p>
            <div className="legend" style={{borderTop:"none",paddingTop:0,marginBottom:14}}>
              {FACTORS.map(f=><span key={f.k} className="lg" title={f.def}>
                <i className="sw" style={{background:f.c,height:10,width:10,borderRadius:2}}/>{f.name}</span>)}
              <span className="lg" style={{color:"var(--mute)"}}>hover a band for its exact share</span>
            </div>
            {M.sectorOut.map(s=>(
              <div key={s.id} style={{display:"grid",gridTemplateColumns:"196px 1fr 132px",gap:12,
                alignItems:"center",marginBottom:8}}>
                <span style={{fontSize:12.5,color:"var(--ink)"}}>{s.name}</span>
                <Anatomy f={s.f} height={22}/>
                <span className="mono" style={{fontSize:11.5,textAlign:"right"}}>
                  <span style={{color:s.priceC<0?"var(--defl)":"var(--infl)"}}>{sgn(s.priceC,1)}</span>
                  <span style={{color:"var(--dim)"}}> price/yr</span></span>
              </div>))}
          </div>

          <div className="card" style={{marginTop:16}}>
            <h3>Assumptions you can argue with</h3>
            <p className="sub">Automatable share is the most contestable number in the model — the fraction of a
              sector's labour a machine can genuinely take over, not the fraction a demo can imitate. It drives both
              the price fall and the wage loss, which is why it matters twice.</p>
            <div style={{overflowX:"auto"}}>
            <table>
              <thead><tr><th>Sector</th><th>Labour</th><th>Automatable</th><th>Capital</th><th>Atoms</th><th>Land</th>
                <th>Scarcity</th><th>Price /yr</th><th>Volume /yr</th><th>Pool /yr</th><th>From top<br/>decile</th></tr></thead>
              <tbody>{M.sectorOut.map((s,i)=>(<tr key={s.id}>
                <td className="sect"><span style={{color:mixColor((s.nonRep-0.15)/0.55)}}>■ </span>{s.name}</td>
                <td><input type="number" min="0" max="1" step="0.02" value={sectors[i].f.lab} aria-label={"Labour share "+s.name}
                  onChange={e=>{const v=parseFloat(e.target.value)||0;
                    setSectors(p=>p.map((x,j)=>j===i?{...x,f:{...x.f,lab:v}}:x));}}/></td>
                <td><input type="number" min="0" max="1" step="0.05" value={sectors[i].auto} aria-label={"Automatable "+s.name}
                  onChange={e=>{const v=parseFloat(e.target.value)||0;
                    setSectors(p=>p.map((x,j)=>j===i?{...x,auto:v}:x));}}/></td>
                <td>{s.f.cap.toFixed(2)}</td><td>{s.f.res.toFixed(2)}</td>
                <td style={{color:s.f.land>0.15?"var(--infl)":undefined}}>{s.f.land.toFixed(2)}</td>
                <td style={{color:s.f.scar>0.15?"var(--infl)":undefined}}>{s.f.scar.toFixed(2)}</td>
                <td style={{color:s.priceC<0?"var(--defl)":"var(--infl)"}}>{sgn(s.priceC,1)}</td>
                <td>{sgn(s.volC,1)}</td>
                <td style={{color:s.poolC<0?"var(--alarm)":undefined}}>{sgn(s.poolC,1)}</td>
                <td style={{color:s.topDep>0.5?"var(--infl)":undefined}}>{pct(s.topDep,0)}</td>
              </tr>))}</tbody>
            </table>
            </div>
            <p className="note"><b style={{color:"var(--ink)"}}>From top decile</b> is the share of that sector's
              revenue coming from the richest 10% of households. Above roughly 50%, the sector has stopped being a
              consumer business and become a luxury business — which is a different multiple, a different cycle and
              a different political risk.</p>
          </div>

          <div className="card" style={{marginTop:16}}>
            <h3>Price collapse versus volume explosion</h3>
            <p className="sub">Horizontal: how much more of it the world consumes each year. Vertical: what happens
              to its price. Bubble size: the money still changing hands in {L.end}.</p>
            <div style={{height:380}}>
              <ResponsiveContainer>
                <ScatterChart margin={{top:16,right:26,left:0,bottom:26}}>
                  <CartesianGrid stroke="#E4E9ED"/>
                  <XAxis type="number" dataKey="x" name="Volume growth" stroke="#93A2AE"
                    tick={{fontSize:11,fontFamily:"IBM Plex Mono",fill:"#6C7C89"}} tickFormatter={v=>v.toFixed(0)+"%"}
                    label={{value:"real volume growth per year →",position:"insideBottom",offset:-14,fill:"#6C7C89",fontSize:11}}/>
                  <YAxis type="number" dataKey="y" name="Price change" stroke="#93A2AE" width={58}
                    tick={{fontSize:11,fontFamily:"IBM Plex Mono",fill:"#6C7C89"}} tickFormatter={v=>v.toFixed(0)+"%"}
                    label={{value:"price per year",angle:-90,position:"insideLeft",offset:12,fill:"#6C7C89",fontSize:11}}/>
                  <ZAxis type="number" dataKey="z" range={[70,1300]} name="Revenue pool"/>
                  <ReferenceLine y={0} stroke="#93A2AE"/><ReferenceLine x={0} stroke="#93A2AE"/>
                  <Tooltip cursor={{strokeDasharray:"3 3"}}
                    contentStyle={{background:"#fff",border:"1px solid #C3CDD5",fontSize:12,borderRadius:4}}
                    formatter={(v,n)=>n==="Revenue pool"?[money(v),"Revenue pool "+L.end]:[v.toFixed(1)+" % /yr",n]}
                    labelFormatter={(l,p)=>p&&p[0]?p[0].payload.name:""}/>
                  <Scatter data={M.sectorOut.map(s=>({x:s.volC*100,y:s.priceC*100,z:s.poolEnd/1000,name:s.name,short:s.short}))}
                    isAnimationActive={false}>
                    {M.sectorOut.map(s=><Cell key={s.id} fill={mixColor((s.nonRep-0.15)/0.55)} fillOpacity={0.62}
                      stroke={mixColor((s.nonRep-0.15)/0.55)}/>)}
                    <LabelList dataKey="short" position="top" offset={9}
                      style={{fontSize:10.5,fill:"#3B4854",fontFamily:"IBM Plex Sans"}}/>
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div className="legend">
              <span className="lg" style={{width:"100%"}}><b style={{fontWeight:600,color:"var(--ink)"}}>Legend</b></span>
              <span className="lg" style={{gap:9}}>
                <svg width="86" height="30" aria-hidden="true">
                  <circle cx="9" cy="19" r="5" fill="#4C5C7C" fillOpacity="0.55"/>
                  <circle cx="31" cy="16" r="9" fill="#4C5C7C" fillOpacity="0.55"/>
                  <circle cx="63" cy="15" r="14" fill="#4C5C7C" fillOpacity="0.55"/>
                </svg>bubble size = revenue pool at horizon, small → large</span>
              <span className="lg" style={{gap:10}}>
                <span style={{color:"var(--defl)",fontSize:11}}>reproducible</span>
                <i className="ramp" style={{width:150}}/>
                <span style={{color:"var(--infl)",fontSize:11}}>cannot be copied</span></span>
              <span className="lg" style={{width:"100%",color:"var(--mute)",display:"block",lineHeight:1.5}}>
                <b style={{color:"var(--ink)",fontWeight:600}}>Bottom-right</b> is the commodity trap: everyone uses
                far more of it and nobody pays for it. <b style={{color:"var(--ink)",fontWeight:600}}>Top-right</b> is
                where the money goes. Under a squeezed median, watch bubbles migrate toward the top-right <i>and</i>
                {" "}toward the top decile — a smaller market at a higher price.</span>
            </div>
          </div>
        </div>)}

        {/* ============ INVEST ============ */}
        {tab==="inv" && (<div className="fade">
          <div className="card">
            <h3>Sector scoreboard</h3>
            <p className="sub">Score = 40% growth in the nominal revenue pool + 30% price gain relative to the
              basket + 30% margin durability, defined as non-reproducible share minus labour share. A ranking that
              follows from your levers, not a recommendation.</p>
            <table>
              <thead><tr><th>Sector</th><th>Pool now</th><th>Pool {L.end}</th><th>Pool /yr</th>
                <th>Price vs basket</th><th>Non-reproducible</th><th>From top decile</th><th>Score</th></tr></thead>
              <tbody>{[...M.sectorOut].sort((a,b)=>b.score-a.score).map(s=>(<tr key={s.id}>
                <td className="sect">{s.name}</td>
                <td>{money(s.poolBeg/1000)}</td><td>{money(s.poolEnd/1000)}</td>
                <td style={{color:s.poolC<0?"var(--alarm)":undefined}}>{sgn(s.poolC,1)}</td>
                <td style={{color:s.realPrice<0?"var(--defl)":"var(--infl)"}}>{sgn(s.realPrice,1)}</td>
                <td>{pct(s.nonRep,0)}</td>
                <td style={{color:s.topDep>0.5?"var(--infl)":undefined}}>{pct(s.topDep,0)}</td>
                <td style={{color:s.score>0?"var(--infl)":"var(--dim)",fontWeight:s.score>0?600:400}}>{s.score.toFixed(2)}</td>
              </tr>))}</tbody>
            </table>
          </div>

          <div className="card" style={{marginTop:16}}>
            <h3>Asset classes, ranked by real return</h3>
            <p className="sub">Each asset earns the drift of the payments it owns, plus 70% of the volume growth of
              the sector it serves, deflated by the bottom 90%'s cost of living in{" "}
              <select value={home} onChange={e=>setHome(e.target.value)} aria-label="Home geography">
                {M.geoOut.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select></p>
            <table>
              <thead><tr><th>Asset</th><th>What it really owns</th><th>Nominal /yr</th><th>Real /yr</th><th></th></tr></thead>
              <tbody>{[...AR].sort((a,b)=>b.nom-a.nom).map(a=>{ const real=(1+a.nom)/(1+homeGeo.colBotC)-1;
                return (<tr key={a.id}>
                  <td className="sect">{a.name}</td>
                  <td className="sect" style={{color:"var(--mute)",fontSize:11.5,textAlign:"left"}}>{a.note}</td>
                  <td>{sgn(a.nom,1)}</td>
                  <td style={{color:real<0?"var(--alarm)":"var(--defl)",fontWeight:600}}>{sgn(real,1)}</td>
                  <td style={{width:140}}><div className="bar"><i style={{width:Math.min(100,Math.abs(real)*700)+"%",
                    background:real<0?"var(--alarm)":"var(--defl)"}}/></div></td>
                </tr>);})}</tbody>
            </table>
            <div className="legend">
              <span className="lg"><i className="sw" style={{background:"var(--defl)",height:9,width:9,borderRadius:2}}/>gains purchasing power</span>
              <span className="lg"><i className="sw" style={{background:"var(--alarm)",height:9,width:9,borderRadius:2}}/>loses purchasing power</span>
            </div>
            <p className="note">Anything that sells hours is short the same thing households are long. If you earn a
              salary <i>and</i> hold service-sector equity, you hold the wage bill twice. That concentration is
              invisible on a standard risk report and is the practical lesson of the whole model.</p>
          </div>
        </div>)}

        {/* ============ SAVINGS ============ */}
        {tab==="save" && (<div className="fade card">
          <h3>Is Musk right about your savings?</h3>
          <p className="sub">Build a portfolio, set a nest egg, and read the only number that matters: how many
            years of your own consumption it still buys at the horizon.</p>
          <div className="split">
            <div>
              <div style={{display:"flex",gap:14,alignItems:"center",marginBottom:12,flexWrap:"wrap"}}>
                <label style={{fontSize:12.5}}>Nest egg, in years of today's spending
                  <input type="number" min="0" max="80" step="1" value={nest} style={{marginLeft:8}}
                    onChange={e=>setNest(parseFloat(e.target.value)||0)}/></label>
                <span className="chip">Living in {homeGeo.name}</span>
              </div>
              <div style={{maxHeight:340,overflow:"auto",paddingRight:8}}>
                {ASSETS.map(a=>(<div key={a.id} style={{display:"grid",gridTemplateColumns:"1fr 90px 44px",
                  gap:8,alignItems:"center",marginBottom:6}}>
                  <span style={{fontSize:12}}>{a.name}</span>
                  <input type="range" min="0" max="60" step="1" value={alloc[a.id]} aria-label={a.name}
                    onChange={e=>setAlloc(p=>({...p,[a.id]:parseFloat(e.target.value)}))}/>
                  <span className="mono" style={{fontSize:11.5,color:"var(--mute)",textAlign:"right"}}>
                    {((alloc[a.id]/allocTot)*100).toFixed(0)}%</span>
                </div>))}
              </div>
            </div>
            <div>
              <div className="stats" style={{gridTemplateColumns:"1fr 1fr"}}>
                <Stat k="Portfolio, nominal" v={sgn(portNom,1)+" /yr"}/>
                <Stat k="Portfolio, real" v={sgn(portReal,1)+" /yr"} color={portReal<0?"var(--alarm)":"var(--defl)"}/>
                <Stat k="Purchasing power" v={ppMult.toFixed(2)+"×"} s={`over ${M.N} years`}/>
                <Stat k="Years of consumption covered" v={(nest*ppMult).toFixed(0)} s={`from ${nest} today`}
                  color={nest*ppMult<nest?"var(--alarm)":"var(--defl)"}/>
              </div>
              <div style={{height:230}}>
                <ResponsiveContainer>
                  <LineChart data={M.years.map((y,i)=>({year:y, port:nest*Math.pow(1+portReal,i),
                    cash:nest*(100/(M.rows[i]?.colBot||100)), need:nest}))} margin={{top:6,right:12,left:0,bottom:0}}>
                    <CartesianGrid stroke="#E4E9ED" vertical={false}/>
                    <XAxis dataKey="year" stroke="#93A2AE" tick={{fontSize:10,fontFamily:"IBM Plex Mono",fill:"#6C7C89"}}/>
                    <YAxis stroke="#93A2AE" width={42} tick={{fontSize:10,fontFamily:"IBM Plex Mono",fill:"#6C7C89"}}/>
                    <Tooltip contentStyle={{background:"#fff",border:"1px solid #C3CDD5",fontSize:12,borderRadius:4}}
                      formatter={(v,n)=>[v.toFixed(1)+" years of spending",n]}/>
                    <Line type="monotone" dataKey="port" name="Your portfolio" stroke="#0E7C86"
                      strokeWidth={2.4} dot={false} isAnimationActive={false}/>
                    <Line type="monotone" dataKey="cash" name="Same money in cash" stroke="#B3382C"
                      strokeWidth={1.8} dot={false} isAnimationActive={false}/>
                    <Line type="monotone" dataKey="need" name="Where you started" stroke="#93A2AE"
                      strokeDasharray="5 4" strokeWidth={1.3} dot={false} isAnimationActive={false}/>
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="legend" style={{paddingTop:8}}>
                <span className="lg"><i className="sw" style={{background:"#0E7C86"}}/>your portfolio</span>
                <span className="lg"><i className="sw" style={{background:"#B3382C"}}/>same money left in cash</span>
                <span className="lg"><i className="sw" style={{background:"#93A2AE"}}/>where you started</span>
                <span className="lg" style={{color:"var(--mute)"}}>vertical axis = years of your own consumption</span>
              </div>
            </div>
          </div>
          <div className="verdict" style={{borderLeftColor:V.c}}>
            <b>The honest reading.</b> Musk's claim is best understood as a claim about <i>human capital</i>, not
            about savings — and it is half right in the worst possible way. A career is a claim on wages, and wages
            are exactly what this technology destroys. Financial capital is a claim on land, atoms, capacity and
            scarcity, which is exactly what survives. So the argument that savings will not matter is, on this
            model's own logic, the argument for why they will matter more: the wage stops being a reliable claim on
            output, and the only remaining claim is ownership. Under the current settings the median household's
            real income moves {sgn(M.medRealAdv,2)} a year while the top decile's moves {sgn(M.topRealC,1)}. The
            question a saver faces is not whether to save. It is which side of that gap they will be standing on.
          </div>
        </div>)}

        {/* ============ GLOSSARY ============ */}
        {tab==="gloss" && (<div className="fade">
          <div className="card">
            <h3>The five payments</h3>
            <p className="sub">Every price is built from these; their shares sum to 1 in each sector.</p>
            <dl>{FACTORS.map(f=>(<React.Fragment key={f.k}>
              <dt><i style={{display:"inline-block",width:10,height:10,borderRadius:2,background:f.c,marginRight:8}}/>{f.name}</dt>
              <dd>{f.def}</dd></React.Fragment>))}</dl>
          </div>

          <div className="card" style={{marginTop:16}}>
            <h3>Levers · technology</h3>
            <dl>
              <dt>Labour unit-cost decay</dt><dd>How fast the cost of getting one unit of automatable work done falls
                each year. 10% means a task costing €100 today costs €90 next year. Musk sets this very high.</dd>
              <dt>Diffusion multiplier and spread</dt><dd>A capability existing is not the same as it being used. The
                multiplier scales global adoption; the spread decides whether adoption is shared or concentrated.</dd>
              <dt>Capital-goods learning rate</dt><dd>How fast robots and compute get cheaper to buy.</dd>
              <dt>AI boost to output growth</dt><dd>Extra real growth per year at full diffusion — before the demand
                feedback below reduces how much of it is actually realised.</dd>
            </dl>
          </div>

          <div className="card" style={{marginTop:16}}>
            <h3>Levers · who gets paid</h3>
            <dl>
              <dt>Reabsorption of displaced work</dt><dd>When a machine takes a task, the payment for it moves from
                the wage bill to capital. Reabsorption is the share of that lost wage bill recreated as new human
                tasks — historically close to 100% over decades, but with long and painful lags. At 0 the loss is
                permanent.</dd>
              <dt>Redistribution of the surplus</dt><dd>The fraction of capital income recycled to households as
                transfers, a dividend or a UBI. A political variable, not a technological one — and the difference
                between two entirely different worlds.</dd>
              <dt>Capital ownership concentration</dt><dd>The top decile's share of what capital earns. Currently
                around 75–85% of financial assets in most rich countries. As the labour share falls, this becomes
                the main determinant of the income distribution.</dd>
              <dt>Demand feedback strength</dt><dd>The top decile spends roughly half its income; the bottom 90%
                spends nearly all of it. So as income concentrates, aggregate consumption falls short of output and
                less of the potential growth is actually realised. This lever sets how strongly that bites. The
                unspent remainder is bid into assets, which is why land and scarcity inflate fastest in exactly the
                scenario where wages are weakest.</dd>
              <dt>Wage drift, non-automatable work</dt><dd>Pay in the work machines cannot take. Note it is reduced
                by labour-market slack: when displaced workers compete for the remaining jobs, even safe jobs get
                cheaper.</dd>
            </dl>
          </div>

          <div className="card" style={{marginTop:16}}>
            <h3>Levers · scarcity</h3>
            <dl>
              <dt>Rent elasticity to income</dt><dd>For every extra €1 of local income, how much lands in the
                landlord's pocket. At 0 the abundance reaches households; above 1 it is absorbed before it gets
                there.</dd>
              <dt>Atoms and energy drift</dt><dd>Negative means cheap solar and better mining outrun demand;
                positive means a billion robots bid up copper, power and water.</dd>
              <dt>Scarcity and licence drift</dt><dd>Annual price drift of what cannot be copied at any price.</dd>
              <dt>Substitution elasticity σ</dt><dd>How freely households swap away from what gets expensive. Below
                1 they cannot — you can't answer a rent rise by consuming less shelter. That is why the dear things
                take over the budget.</dd>
            </dl>
          </div>

          <div className="card" style={{marginTop:16}}>
            <h3>Outputs and columns</h3>
            <dl>
              <dt>Cost of living, bottom 90% / top decile</dt><dd>Two separate price indices, each weighted by that
                group's own basket. They diverge because the two groups buy different things — which is why a single
                national inflation figure can be true and useless at the same time.</dd>
              <dt>Median household real income</dt><dd>Bottom-90% income per head, deflated by the bottom-90%
                basket. The number that actually answers Musk. Reported for the advanced economies, where the
                automation lands.</dd>
              <dt>Pass-through</dt><dd>Median real income growth divided by output growth per head. 100% means every
                unit of extra output reaches the typical household. 30% means it mostly did not.</dd>
              <dt>Labour share of income</dt><dd>The share of national income paid to people for working. Falls as
                the payment for automated tasks migrates to capital.</dd>
              <dt>Automatable wage bill</dt><dd>The fraction of a country's wages sitting in tasks a machine can
                take, given its sector mix. Rich economies have more of it, which is why the wage loss lands there
                first.</dd>
              <dt>From top decile</dt><dd>Share of a sector's revenue coming from the richest 10%. Above 50%, a
                consumer business has quietly become a luxury business.</dd>
              <dt>Revenue pool</dt><dd>Price × volume × population, summed across buckets and income classes.
                Investors are paid out of the pool, not out of the price.</dd>
              <dt>Basket shift</dt><dd>How much of household spending has moved between sectors by the horizon. It
                can run backwards: a squeezed household spends more on food and shelter, not less.</dd>
              <dt>Engel curve</dt><dd>As income rises, food falls as a share of spending while health, leisure and
                status rise. The Maslow ladder in spreadsheet form — and it descends as readily as it climbs.</dd>
              <dt>Baumol's cost disease</dt><dd>Sectors that cannot automate get relatively more expensive, because
                they still compete for workers with sectors that can.</dd>
              <dt>Ricardian rent</dt><dd>When supply is fixed and demand rises, the whole gain accrues to the owner
                of the fixed thing. Applied to land, it is how abundance can leave households no better off.</dd>
              <dt>Lump of labour</dt><dd>The fallacy that there is a fixed amount of work to go round. It has been
                wrong for two centuries, which is the strongest argument against the collapse scenarios — and the
                reason reabsorption is a lever rather than a constant.</dd>
            </dl>
          </div>
        </div>)}

        <p className="note" style={{marginTop:20,color:"var(--dim)",fontSize:11.5}}>
          A reasoning tool, not a forecast, and not investment advice. Population, income and labour-share levels are
          order-of-magnitude 2026 estimates; Engel curves, factor shares, automatability and the demand feedback are
          stylised and meant to be argued with — which is why the cells are editable. Every output is a mechanical
          consequence of the levers on the left.
        </p>
      </div>
    </div>
  </div></div>);
}
