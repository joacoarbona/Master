import React, { useState, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis, LabelList, BarChart, Bar, Cell, ReferenceLine
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
   mr = median / mean income ratio today                                   */
const GEOS_0 = [
  { id:"US",  name:"United States",              pop:345,  pg:0.004,  y:76000, g:0.018, d:1.00, lc:0.55, mr:0.60 },
  { id:"CAZ", name:"Canada + Aus/NZ",            pop:75,   pg:0.009,  y:58000, g:0.016, d:0.90, lc:0.60, mr:0.66 },
  { id:"UKN", name:"UK + Nordics + CH",          pop:105,  pg:0.004,  y:60000, g:0.014, d:0.85, lc:0.70, mr:0.68 },
  { id:"EUC", name:"EU core-north",              pop:220,  pg:0.001,  y:55000, g:0.012, d:0.75, lc:0.75, mr:0.70 },
  { id:"EUS", name:"EU south",                   pop:130,  pg:-0.002, y:42000, g:0.011, d:0.60, lc:0.70, mr:0.68 },
  { id:"EUE", name:"EU east",                    pop:95,   pg:-0.004, y:35000, g:0.022, d:0.55, lc:0.45, mr:0.69 },
  { id:"LAU", name:"LatAm upper-middle",         pop:400,  pg:0.007,  y:19000, g:0.018, d:0.40, lc:0.40, mr:0.52 },
  { id:"LAL", name:"LatAm lower + Caribbean",    pop:265,  pg:0.009,  y:11000, g:0.022, d:0.28, lc:0.35, mr:0.50 },
  { id:"CHN", name:"China",                      pop:1410, pg:-0.002, y:25000, g:0.032, d:0.85, lc:0.65, mr:0.58 },
  { id:"AAS", name:"Advanced Asia (JP KR TW SG)",pop:205,  pg:-0.005, y:52000, g:0.013, d:0.90, lc:0.80, mr:0.66 },
  { id:"IND", name:"India + South Asia",         pop:2000, pg:0.008,  y:10000, g:0.050, d:0.45, lc:0.55, mr:0.48 },
  { id:"SEA", name:"SE Asia emerging",           pop:690,  pg:0.008,  y:14000, g:0.038, d:0.40, lc:0.45, mr:0.54 },
  { id:"GCC", name:"Gulf states",                pop:60,   pg:0.014,  y:62000, g:0.020, d:0.65, lc:0.30, mr:0.45 },
  { id:"NAL", name:"North Africa + Levant",      pop:290,  pg:0.015,  y:12000, g:0.024, d:0.25, lc:0.35, mr:0.55 },
  { id:"WAF", name:"West + Central Africa",      pop:620,  pg:0.024,  y:4500,  g:0.030, d:0.12, lc:0.20, mr:0.46 },
  { id:"ESA", name:"East + Southern Africa",     pop:620,  pg:0.023,  y:4200,  g:0.032, d:0.15, lc:0.25, mr:0.44 },
  { id:"EUR", name:"Eurasia (RU TR C.Asia)",     pop:300,  pg:0.003,  y:24000, g:0.015, d:0.35, lc:0.30, mr:0.56 },
];

/* ---------- 2. BASKET + 4. FACTOR MIX : 12 sectors ----------
   f = share of unit cost paid to each factor. Sums to 1.
   auto = share of that sector's labour a machine can actually take.
   lo/hi = budget share (%) at GNI 2,000 and at GNI 80,000  -> Engel curve.
   tilt  = how much the sector gains when income concentrates at the top.  */
const SECTORS_0 = [
  { id:0,  name:"Staple food & agriculture",   short:"Food",      f:{lab:.28,cap:.18,res:.30,land:.20,scar:.04}, auto:.55, lo:34, hi:8,  tilt:-0.30 },
  { id:1,  name:"Housing & shelter",           short:"Housing",   f:{lab:.12,cap:.18,res:.10,land:.58,scar:.02}, auto:.60, lo:18, hi:21, tilt:-0.10 },
  { id:2,  name:"Energy & utilities",          short:"Energy",    f:{lab:.10,cap:.35,res:.40,land:.08,scar:.07}, auto:.70, lo:7,  hi:5,  tilt:-0.05 },
  { id:3,  name:"Manufactured goods",          short:"Goods",     f:{lab:.25,cap:.35,res:.28,land:.04,scar:.08}, auto:.85, lo:12, hi:9,  tilt:0.05 },
  { id:4,  name:"Transport & mobility",        short:"Transport", f:{lab:.30,cap:.30,res:.28,land:.06,scar:.06}, auto:.85, lo:8,  hi:10, tilt:0.05 },
  { id:5,  name:"Healthcare & longevity",      short:"Health",    f:{lab:.52,cap:.18,res:.10,land:.08,scar:.12}, auto:.55, lo:4,  hi:14, tilt:0.20 },
  { id:6,  name:"Education & training",        short:"Education", f:{lab:.68,cap:.10,res:.03,land:.09,scar:.10}, auto:.70, lo:3,  hi:5,  tilt:0.10 },
  { id:7,  name:"Professional & business svc", short:"Prof svc",  f:{lab:.72,cap:.12,res:.02,land:.08,scar:.06}, auto:.80, lo:2,  hi:5,  tilt:0.10 },
  { id:8,  name:"Software, digital & media",   short:"Digital",   f:{lab:.55,cap:.22,res:.06,land:.02,scar:.15}, auto:.90, lo:1,  hi:5,  tilt:0.10 },
  { id:9,  name:"Leisure, travel & hospitality",short:"Leisure",  f:{lab:.40,cap:.20,res:.12,land:.22,scar:.06}, auto:.45, lo:3,  hi:10, tilt:0.30 },
  { id:10, name:"Luxury, status & positional", short:"Status",    f:{lab:.22,cap:.12,res:.16,land:.10,scar:.40}, auto:.35, lo:1,  hi:6,  tilt:0.80 },
  { id:11, name:"Finance, insurance & security",short:"Finance",  f:{lab:.48,cap:.22,res:.03,land:.07,scar:.20}, auto:.75, lo:7,  hi:9,  tilt:0.50 },
];

/* ---------- Assets: each one owns a bundle of factors + a sector's volume ---------- */
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
  { id:"luxe", name:"Luxury & heritage brands",    e:{scar:.75,res:.15,land:.10}, s:10, note:"Sells what can't be copied" },
  { id:"expr", name:"Experiences, venues, travel", e:{land:.45,scar:.30,lab:.25}, s:9,  note:"Fixed seats, rising demand" },
  { id:"heal", name:"Healthcare delivery",         e:{lab:.40,scar:.35,cap:.25},  s:5,  note:"Licence-limited capacity" },
  { id:"eqty", name:"Broad equity index",          e:{cap:.35,scar:.25,res:.20,land:.20}, s:3, note:"A bit of everything" },
  { id:"bond", name:"Long nominal bonds",          e:{},                          s:null, kind:"bond", note:"Wins only if deflation is real" },
  { id:"gold", name:"Gold & monetary metals",      e:{scar:.80,res:.20},          s:null, note:"Neither land nor labour" },
  { id:"cash", name:"Cash",                        e:{},                          s:null, kind:"cash", note:"The null hypothesis" },
];

/* ---------- 3. HYPOTHESES ---------- */
const PRESETS = {
  musk: { label:"H1 · Musk: full abundance",
    d:{ decay:0.12, diffM:1.20, spread:0.60, learn:0.060, res:-0.010, landE:0.50, scar:0.010,
        boost:0.035, capture:0.90, wage:0.005, sigma:0.85, end:2050 } },
  rent: { label:"H2 · Rent absorbs the surplus",
    d:{ decay:0.09, diffM:1.00, spread:1.20, learn:0.040, res:0.020,  landE:1.60, scar:0.035,
        boost:0.020, capture:0.35, wage:0.020, sigma:0.55, end:2050 } },
  baum: { label:"H3 · Baumol drag: slow diffusion",
    d:{ decay:0.030, diffM:0.70, spread:1.30, learn:0.020, res:0.015, landE:1.00, scar:0.020,
        boost:0.006, capture:0.50, wage:0.025, sigma:0.50, end:2050 } },
  ener: { label:"H4 · Energy & atoms bottleneck",
    d:{ decay:0.10, diffM:1.05, spread:1.10, learn:0.045, res:0.050,  landE:1.20, scar:0.030,
        boost:0.025, capture:0.50, wage:0.015, sigma:0.60, end:2050 } },
  fork: { label:"H5 · Two-track world",
    d:{ decay:0.11, diffM:1.00, spread:2.20, learn:0.050, res:0.025,  landE:1.40, scar:0.030,
        boost:0.030, capture:0.40, wage:0.018, sigma:0.60, end:2050 } },
};

/* ============================ ENGINE ============================ */
function engelShare(sec, y) {
  const t = Math.max(0, Math.min(1, (Math.log(Math.max(y, 600)) - Math.log(2000)) / (Math.log(80000) - Math.log(2000))));
  return sec.lo + (sec.hi - sec.lo) * t;
}

function runModel(L, geos, sectors) {
  const years = [];
  for (let y = 2026; y <= L.end; y++) years.push(y);
  const NS = sectors.length;

  const st = geos.map(g => {
    const eff = Math.min(1.25, Math.pow(g.d, L.spread) * L.diffM);
    return { g, eff, pop:g.pop, rMean:g.y, rMed:g.y*g.mr, P:new Array(NS).fill(100),
             col:100, share:null, share0:null, pool:new Array(NS).fill(0) };
  });

  const shareOf = (s, P, colv, gap) => {
    const raw = sectors.map((sec,i) => {
      const base = engelShare(sec, s.rMed);
      const rel  = Math.pow(Math.max(P[i]/colv, 0.02), 1 - L.sigma);   // sigma<1 -> dear things eat the budget
      const ineq = Math.max(0.2, 1 + sec.tilt * (gap - 1));
      return Math.max(0.0005, base * rel * ineq);
    });
    const tot = raw.reduce((a,b)=>a+b,0);
    return raw.map(v => v/tot);
  };

  // initialise
  st.forEach(s => {
    s.share = shareOf(s, s.P, s.col, s.g.y/(s.g.y*s.g.mr));
    s.share0 = s.share.slice();
    const nomY = s.rMean;
    s.pool = s.share.map(w => s.pop * nomY * w);   // millions x $ = $m
  });
  const pool0 = st.map(s => s.pool.slice());
  const gW = sectors.map((_,i) => st.reduce((a,s)=>a+s.pool[i],0));
  const gTot0 = gW.reduce((a,b)=>a+b,0);

  const rows = [{ year:2026 }];
  sectors.forEach((sec,i)=> rows[0]["s"+i] = 100);
  rows[0].col = 100;

  const factorTrack = [];      // global average factor drifts per year

  for (let t = 1; t < years.length; t++) {
    let fl=0, fk=0, fr=0, fd=0, fs=0, fw=0;
    st.forEach(s => {
      const gr  = s.g.g + L.boost * s.eff;
      const grM = s.g.g + L.boost * s.eff * L.capture;
      s.rMean *= (1+gr); s.rMed *= (1+grM);
      const dLand = L.landE * gr * s.g.lc;
      const dScar = L.scar + 0.30 * gr;
      const dCap  = -L.learn;
      const dRes  = L.res;
      const prevShare = s.share;
      let colStep = 0;
      const dP = sectors.map((sec,i) => {
        const dLab = (1-sec.auto)*L.wage - sec.auto*L.decay*s.eff;
        const d = sec.f.lab*dLab + sec.f.cap*dCap + sec.f.res*dRes + sec.f.land*dLand + sec.f.scar*dScar;
        colStep += prevShare[i]*d;
        const w = pool0[st.indexOf(s)][i];
        fl += w*dLab; fk += w*dCap; fr += w*dRes; fd += w*dLand; fs += w*dScar; fw += w;
        return d;
      });
      dP.forEach((d,i)=> s.P[i] *= (1+d));
      s.col *= (1+colStep);
      s.pop *= (1+s.g.pg);
      const gap = 1/s.g.mr;
      s.share = shareOf(s, s.P, s.col, gap);
      const nomY = s.rMean * s.col/100;
      s.pool = s.share.map(w => s.pop * nomY * w);
    });
    factorTrack.push({ lab:fl/fw, cap:fk/fw, res:fr/fw, land:fd/fw, scar:fs/fw });

    const row = { year: years[t] };
    let colG = 0, wsum = 0;
    sectors.forEach((sec,i) => {
      let num = 0;
      st.forEach((s,ci) => { num += pool0[ci][i] * s.P[i]; });
      row["s"+i] = num / gW[i];
    });
    st.forEach((s,ci) => { const w = pool0[ci].reduce((a,b)=>a+b,0); colG += w*s.col; wsum += w; });
    row.col = colG/wsum;
    rows.push(row);
  }

  const N = years.length - 1;
  const cagr = (a,b) => N>0 ? Math.pow(b/a, 1/N) - 1 : 0;

  const last = rows[rows.length-1];
  const sectorOut = sectors.map((sec,i) => {
    const poolEnd = st.reduce((a,s)=>a+s.pool[i],0);
    const poolBeg = gW[i];
    const priceC = cagr(100, last["s"+i]);
    const poolC  = cagr(poolBeg, poolEnd);
    const volC   = (1+poolC)/(1+priceC) - 1;
    const nonRep = sec.f.land + sec.f.scar + sec.f.res;
    return { ...sec, poolBeg, poolEnd, priceC, poolC, volC, nonRep,
             realPrice: (1+priceC)/(1+cagr(100,last.col)) - 1,
             shareEnd: poolEnd / st.reduce((a,s)=>a+s.pool.reduce((x,y)=>x+y,0),0),
             shareBeg: poolBeg / gTot0 };
  });

  // investment score
  const z = (arr) => { const m = arr.reduce((a,b)=>a+b,0)/arr.length;
    const sd = Math.sqrt(arr.reduce((a,b)=>a+(b-m)*(b-m),0)/arr.length) || 1;
    return arr.map(v => (v-m)/sd); };
  const zPool = z(sectorOut.map(s=>s.poolC));
  const zReal = z(sectorOut.map(s=>s.realPrice));
  const zDur  = z(sectorOut.map(s=>s.nonRep - s.f.lab));
  sectorOut.forEach((s,i)=> s.score = 0.40*zPool[i] + 0.30*zReal[i] + 0.30*zDur[i]);

  const geoOut = st.map((s,ci) => {
    const shift = s.share.reduce((a,w,i)=>a+Math.abs(w - s.share0[i]),0)/2;
    return { id:s.g.id, name:s.g.name, eff:s.eff, colC:cagr(100,s.col), col:s.col,
      popEnd:s.pop, popBeg:geos[ci].pop, yBeg:geos[ci].y, yEnd:s.rMean, yMedEnd:s.rMed,
      medRatio:s.rMed/s.rMean, shift, share:s.share, share0:s.share0,
      poolEnd:s.pool.reduce((a,b)=>a+b,0), poolBeg:pool0[ci].reduce((a,b)=>a+b,0) };
  });

  const fAvg = factorTrack.reduce((a,b)=>({lab:a.lab+b.lab/N, cap:a.cap+b.cap/N, res:a.res+b.res/N,
    land:a.land+b.land/N, scar:a.scar+b.scar/N}), {lab:0,cap:0,res:0,land:0,scar:0});

  const worldCol = cagr(100, last.col);
  const nonRepShareBeg = sectorOut.reduce((a,s)=>a+s.shareBeg*s.nonRep,0);
  const nonRepShareEnd = sectorOut.reduce((a,s)=>a+s.shareEnd*s.nonRep,0);
  const deflating = sectorOut.filter(s=>s.priceC < -0.02).reduce((a,s)=>a+s.shareEnd,0);

  const spread = Math.max(...sectorOut.map(s=>last["s"+s.id])) / Math.min(...sectorOut.map(s=>last["s"+s.id]));

  return { years, rows, sectorOut, geoOut, fAvg, worldCol, nonRepShareBeg, nonRepShareEnd,
           deflating, spread, N, cagr, last };
}

function assetReturns(M, L) {
  const f = M.fAvg;
  return ASSETS.map(a => {
    let nom;
    if (a.kind === "cash") nom = 0;
    else if (a.kind === "bond") nom = L.bondY;
    else {
      const price = (a.e.lab||0)*f.lab + (a.e.cap||0)*f.cap + (a.e.res||0)*f.res
                  + (a.e.land||0)*f.land + (a.e.scar||0)*f.scar;
      const vol = a.s === null ? 0 : M.sectorOut[a.s].volC;
      nom = price + vol * 0.7;
    }
    return { ...a, nom };
  });
}

/* ============================ SHARED VOCAB ============================ */
const FACTORS = [
  { k:"lab",  name:"Labour",     c:"#0E7C86", def:"Hours of human work embodied in the price. This is the only thing Musk's argument acts on." },
  { k:"cap",  name:"Capital",    c:"#4A8FA8", def:"Machines, buildings and software that make the thing. Falls with learning curves, but never to zero." },
  { k:"res",  name:"Atoms",      c:"#7C6E96", def:"Physical inputs: energy, steel, copper, lithium, water, fertiliser. Robots consume more of these, not fewer." },
  { k:"land", name:"Land",       c:"#A85A7E", def:"Location rent. Fixed supply. Rises with local income almost by definition." },
  { k:"scar", name:"Scarcity",   c:"#93356B", def:"Anything that cannot be copied: brands, licences, permits, spectrum, a view, a doctor's registration, a Michelin star." },
];
const FC = Object.fromEntries(FACTORS.map(f=>[f.k,f.c]));

const SCENARIO_TEXT = {
  musk: { assume:"Labour cost collapses fast, diffusion is near-universal, energy gets cheaper, and land barely reacts to rising income. Almost all of the gain reaches ordinary households.",
    musk:"Right", tone:"good",
    watch:"Rent elasticity is set to 0.50. That is the load-bearing assumption — no property market on record has been that docile." },
  rent: { assume:"The same technology, but landlords, licence-holders and brand owners capture the surplus. Rent rises about 1.6× as fast as income.",
    musk:"Wrong, and expensively so", tone:"bad",
    watch:"Shop prices still fall. The basket does not, because housing and positional goods swallow the saving." },
  baum: { assume:"Baumol's cost disease holds. Automation is real but diffuses slowly through regulated, licensed, physical-world sectors.",
    musk:"Wrong on timing", tone:"bad",
    watch:"This is the boring scenario and historically the most common one. Nothing dramatic happens by 2050." },
  ener: { assume:"AI works, but the atoms bite. Energy, copper, lithium and water get dearer as billions of robots demand them.",
    musk:"Wrong on mechanism", tone:"bad",
    watch:"Deflation in services, inflation in everything with mass. Miners and grid owners are the residual claimants." },
  fork: { assume:"Diffusion is extremely uneven. Rich, capable economies get the abundance; the rest get the price effects without the income.",
    musk:"Right for some, wrong for most", tone:"bad",
    watch:"Compare the cost-of-living column across buckets in Geographies — the spread is the whole story." },
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
      aria-label={label} onChange={e=>onChange(parseFloat(e.target.value))} />
  </div>);
}
function Stat({k,v,s,color}){
  return <div className="stat"><div className="k">{k}</div>
    <div className="v" style={color?{color}:undefined}>{v}</div>
    {s && <div className="s">{s}</div>}</div>;
}
function Anatomy({f,height=26}){
  return <div className="anat" style={{height}}>
    {FACTORS.map(x=>{ const w=(f[x.k]||0)*100; if(w<0.5) return null;
      return <span key={x.k} title={`${x.name} ${w.toFixed(0)}%`}
        style={{width:w+"%",background:x.c}}>{w>=11?x.name:""}</span>; })}
  </div>;
}
function FanTip({active,payload,label}){
  if(!active||!payload||!payload.length) return null;
  const s=[...payload].sort((a,b)=>b.value-a.value);
  return <div style={{background:"#fff",border:"1px solid #C3CDD5",padding:"9px 11px",fontSize:11.5,
    boxShadow:"0 2px 10px rgba(19,26,33,.10)",borderRadius:4,maxHeight:280,overflow:"hidden"}}>
    <div className="mono" style={{color:"#6C7C89",marginBottom:5}}>{label} · price index, 2026 = 100</div>
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
    return [k,{m,top:[...assetReturns(m,l)].sort((a,b)=>b.nom-a.nom).slice(0,3)}];
  })),[L.bondY]);

  const homeGeo  = M.geoOut.find(g=>g.id===home) || M.geoOut[0];
  const allocTot = Object.values(alloc).reduce((a,b)=>a+b,0)||1;
  const portNom  = AR.reduce((a,x)=>a+(alloc[x.id]/allocTot)*x.nom,0);
  const portReal = (1+portNom)/(1+homeGeo.colC)-1;
  const ppMult   = Math.pow(1+portReal,M.N);

  const cashReal = 100/M.last.col;
  const muskRight = M.worldCol < -0.02 && cashReal > 1.5;
  const sectorsByEnd = [...M.sectorOut].sort((a,b)=>M.last["s"+b.id]-M.last["s"+a.id]);

  return (
  <div className="fp"><style>{CSS}</style><div className="wrap">

    <div className="masthead">
      <div className="eyebrow">A reasoning tool · 17 economies · 12 sectors · 5 payments · 13 levers</div>
      <h1>The Five Payments</h1>
      <p>Elon Musk says saving for retirement will be pointless in ten or twenty years because AI and robots
        drive labour costs to zero, and the cost of living follows. This tool takes that claim seriously enough
        to test it — by splitting every price into the five separate things you actually pay for, and letting
        you watch each one move on its own.</p>
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
          Move one at a time and watch the headline row. The four that decide almost everything are marked ◆.</p>

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
        <Lever label="◆ Atoms & energy drift" hint="Negative means solar and mining abundance win the race"
          value={L.res} min={-0.05} max={0.08} step={0.005} onChange={set("res")} fmt={v=>sgn(v)}/>
        <Lever label="◆ Rent elasticity to income" hint="Share of each extra $1 of local income that land captures"
          value={L.landE} min={0} max={2.5} step={0.05} onChange={set("landE")} fmt={v=>v.toFixed(2)}/>
        <Lever label="Scarcity & licence drift" hint="Annual price drift of things that cannot be copied"
          value={L.scar} min={0} max={0.07} step={0.0025} onChange={set("scar")} fmt={v=>sgn(v)}/>
        <Lever label="AI boost to output growth" hint="Extra real growth per year at full diffusion"
          value={L.boost} min={0} max={0.06} step={0.0025} onChange={set("boost")} fmt={v=>"+"+pct(v)}/>
        <Lever label="◆ Share reaching median household" hint="0% = every gain accrues to asset owners"
          value={L.capture} min={0} max={1} step={0.05} onChange={set("capture")} fmt={v=>pct(v,0)}/>
        <Lever label="Wage drift, non-automatable work" hint="What the irreplaceable humans get paid"
          value={L.wage} min={0} max={0.06} step={0.0025} onChange={set("wage")} fmt={v=>sgn(v)}/>
        <Lever label="Substitution elasticity σ" hint="Below 1 means you cannot escape what gets expensive"
          value={L.sigma} min={0.2} max={1.6} step={0.05} onChange={set("sigma")} fmt={v=>v.toFixed(2)}/>
        <Lever label="Long bond yield" hint="Used only in the savings test" value={L.bondY} min={0} max={0.09}
          step={0.0025} onChange={set("bondY")} fmt={v=>pct(v)}/>
      </div>

      {/* ---------------- CANVAS ---------------- */}
      <div>
        <div className="tabs">
          {[["start","Start here"],["fan","Prices"],["geo","Geographies"],["sec","Sectors"],
            ["inv","Where to invest"],["save","Your savings"],["gloss","Glossary"]].map(([k,l])=>(
            <button key={k} className={"tab"+(tab===k?" on":"")} onClick={()=>setTab(k)}>{l}</button>))}
        </div>

        {/* headline row — always visible except on the reference tabs */}
        {tab!=="gloss" && tab!=="start" && (
          <div className="stats">
            <Stat k="Cost of living, world" v={sgn(M.worldCol,2)+" /yr"}
              s={`basket index ${M.last.col.toFixed(0)} by ${L.end}`}
              color={M.worldCol>0?"var(--infl)":"var(--defl)"}/>
            <Stat k="Dearest ÷ cheapest sector" v={M.spread.toFixed(0)+"×"} s="price gap at horizon"/>
            <Stat k="Basket falling >2%/yr" v={pct(M.deflating,0)} s="of world spending" color="var(--defl)"/>
            <Stat k="Paid to land, atoms, scarcity" v={pct(M.nonRepShareBeg,0)+" → "+pct(M.nonRepShareEnd,0)}
              s="the part no robot makes" color="var(--infl)"/>
            <Stat k="€1 of cash, real value" v={cashReal.toFixed(2)} s={`in ${L.end} purchasing power`}
              color={cashReal<1?"var(--alarm)":"var(--defl)"}/>
          </div>
        )}

        {/* ============ START HERE ============ */}
        {tab==="start" && (<div className="fade">
          <div className="card">
            <h3>The argument in one picture</h3>
            <p className="sub">Musk's claim is an arithmetic claim: labour → 0, therefore prices → 0, therefore
              savings are pointless. The arithmetic only works if labour is the only thing you pay for. It isn't.
              Every price is five payments stacked together:</p>
            <Anatomy f={{lab:.25,cap:.20,res:.20,land:.20,scar:.15}} height={34}/>
            <div className="legend" style={{borderTop:"none",paddingTop:10,marginTop:8}}>
              {FACTORS.map(f=><span key={f.k} className="lg">
                <i className="sw" style={{background:f.c,height:10,width:10,borderRadius:2}}/>
                <b style={{fontWeight:600}}>{f.name}</b></span>)}
            </div>
            <p className="note" style={{marginTop:14}}>Robots crush the first two. They do nothing to the last
              three — land is fixed, atoms have to be dug up, and scarcity is scarce by definition. So the question
              is never "does AI make things cheap". It is: <b style={{color:"var(--ink)"}}>as the cheap things get
              cheap and fall out of the household budget, what takes their place?</b></p>
          </div>

          <div className="card" style={{marginTop:16}}>
            <h3>How to use this in five minutes</h3>
            <ol className="steps" style={{marginTop:12}}>
              <li><b>Pick a scenario</b> from the row of buttons above. Each one is a coherent set of beliefs about
                the next 25 years, not a random setting.</li>
              <li><b>Read the headline row</b> that appears on every tab. The one number that answers Musk is
                <span className="kbd" style={{margin:"0 4px"}}>Cost of living, world</span> — if it is deeply negative,
                he is right; if it hovers near zero while shop prices collapse, he is wrong.</li>
              <li><b>Open Prices</b> to see the scissors: cheap things and dear things separating. Colour tells you why.</li>
              <li><b>Open Where to invest</b> for the ranking of sectors and asset classes that follows mechanically
                from your settings.</li>
              <li><b>Move one lever</b> on the left and watch what flips. Anything that changes sign on a single
                lever is a bet on the hypothesis, not on the world.</li>
            </ol>
          </div>

          <div className="card" style={{marginTop:16}}>
            <h3>How to read the five hypotheses</h3>
            <p className="sub">All five run the same machinery on the same world. They differ only in what they
              assume about diffusion, rent and atoms. Results shown are at your current horizon of {L.end}.</p>
            <div style={{overflowX:"auto"}}>
            <table>
              <thead><tr><th>Hypothesis</th><th style={{width:"34%"}}>What it assumes</th>
                <th>Cost of living</th><th>Cash keeps</th><th>Is Musk right?</th><th style={{width:"22%"}}>What wins</th></tr></thead>
              <tbody>
                {Object.entries(PRESETS).map(([k,v])=>{
                  const r=ALL[k], t=SCENARIO_TEXT[k], cr=100/r.m.last.col;
                  return (<tr key={k}>
                    <td className="sect"><b style={{color:"var(--ink)"}}>{v.label}</b></td>
                    <td className="sect" style={{textAlign:"left",fontSize:11.5,color:"var(--body)"}}>{t.assume}</td>
                    <td style={{color:r.m.worldCol>0?"var(--infl)":"var(--defl)"}}>{sgn(r.m.worldCol,2)}</td>
                    <td style={{color:cr<1?"var(--alarm)":"var(--defl)"}}>{cr.toFixed(2)}×</td>
                    <td className="sect" style={{color:t.tone==="good"?"var(--ok)":"var(--alarm)",fontWeight:500,
                      textAlign:"right",fontSize:12}}>{t.musk}</td>
                    <td className="sect" style={{textAlign:"left",fontSize:11.5}}>{r.top.map(a=>a.name).join(", ")}</td>
                  </tr>);
                })}
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
                <dt>1 · People</dt><dd>17 country buckets — population, income per head, growth, how capable they
                  are of deploying automation, and how tightly their land supply is constrained.</dd>
                <dt>2 · Products and services</dt><dd>12 sectors, with the share of household budget each one takes
                  moving as income rises — food shrinks, health and leisure grow. That is the Maslow ladder in
                  spreadsheet form.</dd>
              </dl>
              <dl>
                <dt>3 · Price</dt><dd>Computed per sector and per bucket from the five payments below, then
                  reweighted every year as households shift what they buy.</dd>
                <dt>4 · Factor mix</dt><dd>How much of each sector's cost is labour, capital, atoms, land and
                  scarcity — and crucially, how much of that labour a machine can actually take.</dd>
              </dl>
            </div>
          </div>
        </div>)}

        {/* ============ PRICES ============ */}
        {tab==="fan" && (<div className="fade">
          <div className="card">
            <h3>The scissors</h3>
            <p className="sub">Every sector starts at 100 in 2026. The thick dark line is the household basket
              itself — what a family actually pays across everything, reweighted each year.</p>
            <div style={{height:400}}>
              <ResponsiveContainer>
                <LineChart data={M.rows} margin={{top:6,right:16,left:0,bottom:0}}>
                  <CartesianGrid stroke="#E4E9ED" vertical={false}/>
                  <XAxis dataKey="year" stroke="#93A2AE" tick={{fontSize:11,fontFamily:"IBM Plex Mono",fill:"#6C7C89"}}/>
                  <YAxis scale="log" domain={["auto","auto"]} stroke="#93A2AE" width={54}
                    tick={{fontSize:11,fontFamily:"IBM Plex Mono",fill:"#6C7C89"}}/>
                  <Tooltip content={<FanTip/>}/>
                  <ReferenceLine y={100} stroke="#C3CDD5" strokeDasharray="4 4"/>
                  {M.sectorOut.map(s=>(<Line key={s.id} type="monotone" dataKey={"s"+s.id} name={s.short}
                    stroke={mixColor((s.nonRep-0.15)/0.55)} dot={false} strokeWidth={1.7} isAnimationActive={false}/>))}
                  <Line type="monotone" dataKey="col" name="Household basket" stroke="#131A21"
                    strokeWidth={3} dot={false} isAnimationActive={false}/>
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="legend">
              <span className="lg" style={{width:"100%",marginBottom:2}}>
                <b style={{fontWeight:600,color:"var(--ink)"}}>Legend</b>
                <span style={{color:"var(--mute)"}}>— ordered by price at {L.end}, highest first. Colour shows
                  how much of the sector's cost is land, atoms and scarcity.</span></span>
              <span className="lg" style={{gap:8}}><i className="sw" style={{background:"#131A21",height:4,width:20}}/>
                <b style={{fontWeight:600}}>Household basket</b></span>
              {sectorsByEnd.map(s=>(<span key={s.id} className="lg">
                <i className="sw" style={{background:mixColor((s.nonRep-0.15)/0.55)}}/>
                {s.short}<span className="mono" style={{color:"var(--mute)"}}>{M.last["s"+s.id].toFixed(0)}</span></span>))}
              <span className="lg" style={{width:"100%",marginTop:6,gap:10}}>
                <span style={{color:"var(--defl)",fontSize:11}}>reproducible</span>
                <i className="ramp" style={{width:180}}/>
                <span style={{color:"var(--infl)",fontSize:11}}>cannot be copied</span></span>
            </div>

            <div className={"verdict"+(muskRight?" good":"")}>
              <b>Reading this chart.</b> {muskRight
                ? <>Under these settings Musk's mechanism holds all the way through to the basket: it falls
                    {" "}{sgn(M.worldCol,2)} a year, and cash left under the mattress buys {cashReal.toFixed(2)}×
                    what it buys today. Check the rent elasticity lever before you believe it.</>
                : <>Musk is right about the cyan lines and wrong about the dark one. Labour going to zero collapses
                    anything reproducible. It does nothing to a hectare in a good school district, a grid connection,
                    a licence, a hotel on a coastline or a name people recognise. The basket moves
                    {" "}<b style={{color:M.worldCol>0?"var(--infl)":"var(--defl)"}}>{sgn(M.worldCol,2)} a year</b>,
                    because as the cheap things get cheap they leave the budget and the dear things take it over.</>}
            </div>
          </div>

          <div className="card" style={{marginTop:16}}>
            <h3>Average annual drift, by payment</h3>
            <p className="sub">The whole argument in five numbers. Everything else in this tool is weighting.
              Bars are scaled to each other; the figure on the right is the annual rate.</p>
            {FACTORS.map(f=>{ const v=M.fAvg[f.k];
              return (<div key={f.k} style={{display:"grid",gridTemplateColumns:"210px 1fr 74px",gap:12,
                alignItems:"center",marginBottom:9}}>
                <span style={{fontSize:12.5}}><i style={{display:"inline-block",width:9,height:9,borderRadius:2,
                  background:f.c,marginRight:7}}/>{f.name}</span>
                <div className="bar"><i style={{width:Math.min(100,Math.abs(v)*600)+"%",
                  background:v<0?"var(--defl)":"var(--infl)"}}/></div>
                <span className="mono" style={{fontSize:12,textAlign:"right",
                  color:v<0?"var(--defl)":"var(--infl)"}}>{sgn(v,2)}</span>
              </div>);})}
            <div className="legend"><span className="lg"><i className="sw" style={{background:"var(--defl)",height:9,width:9,borderRadius:2}}/>getting cheaper</span>
              <span className="lg"><i className="sw" style={{background:"var(--infl)",height:9,width:9,borderRadius:2}}/>getting dearer</span></div>
          </div>
        </div>)}

        {/* ============ GEOGRAPHIES ============ */}
        {tab==="geo" && (<div className="fade card">
          <h3>People and prices, by bucket</h3>
          <p className="sub">Diffusion and land constraint are editable — they are the two country-level dials that
            decide who gets the abundance. Basket shift measures how much of household spending has moved between
            sectors by {L.end}.</p>
          <div style={{overflowX:"auto"}}>
          <table>
            <thead><tr><th>Bucket</th><th>Pop 2026 → {L.end}</th><th>Income/head</th><th>Diffusion 0–1</th>
              <th>Land constraint 0–1</th><th>Cost of living</th><th>Median ÷ mean</th><th>Basket shift</th>
              <th>Spend pool</th></tr></thead>
            <tbody>
              {M.geoOut.map((g,i)=>(<tr key={g.id}>
                <td className="sect">{g.name}</td>
                <td>{g.popBeg.toFixed(0)} → {g.popEnd.toFixed(0)}m</td>
                <td>{(g.yBeg/1000).toFixed(0)}k → {(g.yEnd/1000).toFixed(0)}k</td>
                <td><input type="number" min="0" max="1" step="0.05" value={geos[i].d} aria-label={"Diffusion "+g.name}
                  onChange={e=>{const v=parseFloat(e.target.value)||0; setGeos(p=>p.map((x,j)=>j===i?{...x,d:v}:x));}}/></td>
                <td><input type="number" min="0" max="1" step="0.05" value={geos[i].lc} aria-label={"Land constraint "+g.name}
                  onChange={e=>{const v=parseFloat(e.target.value)||0; setGeos(p=>p.map((x,j)=>j===i?{...x,lc:v}:x));}}/></td>
                <td style={{color:g.colC>0?"var(--infl)":"var(--defl)"}}>{sgn(g.colC,2)}</td>
                <td>{pct(g.medRatio,0)}</td><td>{pct(g.shift,0)}</td><td>{money(g.poolEnd/1000)}</td>
              </tr>))}
            </tbody>
          </table>
          </div>
          <h4>Cost of living, annual change by bucket</h4>
          <div style={{height:230}}>
            <ResponsiveContainer>
              <BarChart data={M.geoOut.map(g=>({name:g.id,v:g.colC*100,full:g.name}))} margin={{top:4,right:8,left:0,bottom:4}}>
                <CartesianGrid stroke="#E4E9ED" vertical={false}/>
                <XAxis dataKey="name" stroke="#93A2AE" tick={{fontSize:10,fontFamily:"IBM Plex Mono",fill:"#6C7C89"}}/>
                <YAxis stroke="#93A2AE" width={46} tickFormatter={v=>v.toFixed(1)+"%"}
                  tick={{fontSize:10,fontFamily:"IBM Plex Mono",fill:"#6C7C89"}}/>
                <Tooltip contentStyle={{background:"#fff",border:"1px solid #C3CDD5",fontSize:12,borderRadius:4}}
                  formatter={v=>[v.toFixed(2)+"% per year","Cost of living"]}
                  labelFormatter={(l,p)=>p&&p[0]?p[0].payload.full:l}/>
                <ReferenceLine y={0} stroke="#93A2AE"/>
                <Bar dataKey="v" isAnimationActive={false}>
                  {M.geoOut.map(g=><Cell key={g.id} fill={g.colC>0?"#93356B":"#0E7C86"}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="legend">
            <span className="lg"><i className="sw" style={{background:"#0E7C86",height:10,width:10,borderRadius:2}}/>cost of living falling</span>
            <span className="lg"><i className="sw" style={{background:"#93356B",height:10,width:10,borderRadius:2}}/>cost of living rising</span>
            <span className="lg" style={{color:"var(--mute)"}}>Bucket codes match the table above</span>
          </div>
          <p className="note">The pattern worth noticing: the buckets with the <i>most</i> automation often have the
            <i> fastest</i> cost-of-living growth, because their land is constrained and their income gains get bid
            straight into rent and positional goods. Deflation shows up in the shops; inflation shows up in the deed.</p>
        </div>)}

        {/* ============ SECTORS ============ */}
        {tab==="sec" && (<div className="fade">
          <div className="card">
            <h3>Anatomy of a price, sector by sector</h3>
            <p className="sub">Each strip is one sector's cost broken into the five payments. Labour and capital are
              what automation attacks; the rest is what survives. Labour share and automatable share are editable.</p>
            <div className="legend" style={{borderTop:"none",paddingTop:0,marginBottom:14}}>
              {FACTORS.map(f=><span key={f.k} className="lg" title={f.def}>
                <i className="sw" style={{background:f.c,height:10,width:10,borderRadius:2}}/>{f.name}</span>)}
              <span className="lg" style={{color:"var(--mute)"}}>hover a band for its exact share</span>
            </div>
            {M.sectorOut.map((s,i)=>(
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
            <p className="sub">Automatable share is the single most contestable number in the model: it is the
              fraction of a sector's labour that a machine can genuinely take over, not the fraction of tasks a
              demo can imitate.</p>
            <div style={{overflowX:"auto"}}>
            <table>
              <thead><tr><th>Sector</th><th>Labour</th><th>Automatable</th><th>Capital</th><th>Atoms</th>
                <th>Land</th><th>Scarcity</th><th>Price /yr</th><th>Volume /yr</th><th>Revenue pool /yr</th></tr></thead>
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
              </tr>))}</tbody>
            </table>
            </div>
          </div>

          <div className="card" style={{marginTop:16}}>
            <h3>Price collapse versus volume explosion</h3>
            <p className="sub">Horizontal: how much more of it the world consumes each year. Vertical: what happens
              to its price. Bubble size: the money that still changes hands in {L.end}.</p>
            <div style={{height:380}}>
              <ResponsiveContainer>
                <ScatterChart margin={{top:16,right:26,left:0,bottom:26}}>
                  <CartesianGrid stroke="#E4E9ED"/>
                  <XAxis type="number" dataKey="x" name="Volume growth" stroke="#93A2AE"
                    tick={{fontSize:11,fontFamily:"IBM Plex Mono",fill:"#6C7C89"}} tickFormatter={v=>v.toFixed(0)+"%"}
                    label={{value:"real volume growth per year →",position:"insideBottom",offset:-14,
                      fill:"#6C7C89",fontSize:11}}/>
                  <YAxis type="number" dataKey="y" name="Price change" stroke="#93A2AE" width={58}
                    tick={{fontSize:11,fontFamily:"IBM Plex Mono",fill:"#6C7C89"}} tickFormatter={v=>v.toFixed(0)+"%"}
                    label={{value:"price per year",angle:-90,position:"insideLeft",offset:12,
                      fill:"#6C7C89",fontSize:11}}/>
                  <ZAxis type="number" dataKey="z" range={[70,1300]} name="Revenue pool"/>
                  <ReferenceLine y={0} stroke="#93A2AE"/><ReferenceLine x={0} stroke="#93A2AE"/>
                  <Tooltip cursor={{strokeDasharray:"3 3"}}
                    contentStyle={{background:"#fff",border:"1px solid #C3CDD5",fontSize:12,borderRadius:4}}
                    formatter={(v,n)=>n==="Revenue pool"?[money(v),"Revenue pool "+L.end]
                      :[v.toFixed(1)+"% /yr",n]}
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
                  <circle cx="9"  cy="19" r="5"  fill="#4C5C7C" fillOpacity="0.55"/>
                  <circle cx="31" cy="16" r="9"  fill="#4C5C7C" fillOpacity="0.55"/>
                  <circle cx="63" cy="15" r="14" fill="#4C5C7C" fillOpacity="0.55"/>
                </svg>
                bubble size = revenue pool at horizon, small → large</span>
              <span className="lg" style={{gap:10}}>
                <span style={{color:"var(--defl)",fontSize:11}}>reproducible</span>
                <i className="ramp" style={{width:150}}/>
                <span style={{color:"var(--infl)",fontSize:11}}>cannot be copied</span></span>
              <span className="lg" style={{width:"100%",color:"var(--mute)",display:"block",lineHeight:1.5}}>
                <b style={{color:"var(--ink)",fontWeight:600}}>Bottom-right</b> is the commodity trap: everyone uses
                far more of it and nobody pays for it. <b style={{color:"var(--ink)",fontWeight:600}}>Top-right</b> is
                where the money goes: rising volume and rising price at the same time.</span>
            </div>
          </div>
        </div>)}

        {/* ============ INVEST ============ */}
        {tab==="inv" && (<div className="fade">
          <div className="card">
            <h3>Sector scoreboard</h3>
            <p className="sub">Score = 40% growth in the nominal revenue pool + 30% price gain relative to the
              basket + 30% margin durability, defined as non-reproducible share minus labour share. It is a
              ranking that follows from your levers, not a recommendation.</p>
            <table>
              <thead><tr><th>Sector</th><th>Pool now</th><th>Pool {L.end}</th><th>Pool /yr</th>
                <th>Price vs basket</th><th>Non-reproducible</th><th>Score</th></tr></thead>
              <tbody>{[...M.sectorOut].sort((a,b)=>b.score-a.score).map(s=>(<tr key={s.id}>
                <td className="sect">{s.name}</td>
                <td>{money(s.poolBeg/1000)}</td><td>{money(s.poolEnd/1000)}</td>
                <td style={{color:s.poolC<0?"var(--alarm)":undefined}}>{sgn(s.poolC,1)}</td>
                <td style={{color:s.realPrice<0?"var(--defl)":"var(--infl)"}}>{sgn(s.realPrice,1)}</td>
                <td>{pct(s.nonRep,0)}</td>
                <td style={{color:s.score>0?"var(--infl)":"var(--dim)",fontWeight:s.score>0?600:400}}>{s.score.toFixed(2)}</td>
              </tr>))}</tbody>
            </table>
          </div>

          <div className="card" style={{marginTop:16}}>
            <h3>Asset classes, ranked by real return</h3>
            <p className="sub">Each asset earns the drift of the payments it owns, plus 70% of the volume growth of
              the sector it serves, then deflated by the cost of living where you live:{" "}
              <select value={home} onChange={e=>setHome(e.target.value)} aria-label="Home geography">
                {M.geoOut.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}
              </select></p>
            <table>
              <thead><tr><th>Asset</th><th>What it really owns</th><th>Nominal /yr</th><th>Real /yr</th><th></th></tr></thead>
              <tbody>{[...AR].sort((a,b)=>b.nom-a.nom).map(a=>{ const real=(1+a.nom)/(1+homeGeo.colC)-1;
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
            <p className="note">The ordering is the useful output, not the levels. Watch which assets flip sign when
              you move a single lever — those are positions that are really bets on the hypothesis rather than on
              the world.</p>
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
                <Stat k="Portfolio, real" v={sgn(portReal,1)+" /yr"}
                  color={portReal<0?"var(--alarm)":"var(--defl)"}/>
                <Stat k="Purchasing power" v={ppMult.toFixed(2)+"×"} s={`over ${M.N} years`}/>
                <Stat k="Years of consumption covered" v={(nest*ppMult).toFixed(0)} s={`from ${nest} today`}
                  color={nest*ppMult<nest?"var(--alarm)":"var(--defl)"}/>
              </div>
              <div style={{height:230}}>
                <ResponsiveContainer>
                  <LineChart data={M.years.map((y,i)=>({year:y, port:nest*Math.pow(1+portReal,i),
                    cash:nest*(100/(M.rows[i]?.col||100)), need:nest}))} margin={{top:6,right:12,left:0,bottom:0}}>
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
          <div className="verdict">
            <b>The honest reading.</b> Musk's claim is best understood as a claim about <i>human capital</i>, not
            about savings. A career is a claim on wages, and wages are exactly what this technology destroys.
            Financial capital is a claim on land, atoms, capacity and scarcity — which is exactly the part of the
            price system that survives. Run H1 with rent elasticity at zero and he is right. Push rent elasticity
            above roughly 1.0 and the conclusion inverts: saving stops being optional and becomes the only way to
            end up on the owning side of the line.
          </div>
        </div>)}

        {/* ============ GLOSSARY ============ */}
        {tab==="gloss" && (<div className="fade">
          <div className="card">
            <h3>The five payments</h3>
            <p className="sub">Every price in the model is built from these. Their shares sum to 1 in each sector.</p>
            <dl>{FACTORS.map(f=>(<React.Fragment key={f.k}>
              <dt><i style={{display:"inline-block",width:10,height:10,borderRadius:2,background:f.c,
                marginRight:8}}/>{f.name}</dt><dd>{f.def}</dd></React.Fragment>))}</dl>
          </div>

          <div className="card" style={{marginTop:16}}>
            <h3>Levers</h3>
            <dl>
              <dt>Labour unit-cost decay</dt><dd>How fast the cost of getting one unit of automatable work done
                falls each year. 10% means a task that costs €100 today costs €90 next year. This is the number
                Musk is implicitly setting very high.</dd>
              <dt>Diffusion multiplier and spread</dt><dd>A capability existing is not the same as it being used.
                The multiplier scales global adoption; the spread decides whether adoption is evenly shared or
                concentrated in the most capable economies. Spread above 1 means the rich pull away.</dd>
              <dt>Capital-goods learning rate</dt><dd>How fast robots and compute get cheaper to buy. High values
                help everyone; they also compress the margins of the companies selling them.</dd>
              <dt>Atoms and energy drift</dt><dd>The direction of physical input prices. Negative means cheap solar
                and better mining outrun demand. Positive means a billion robots bid up copper, power and water.</dd>
              <dt>Rent elasticity to income</dt><dd>For every extra €1 of local income, how much lands in the
                landlord's pocket. This is the single most important lever in the tool. At 0 the abundance reaches
                households; above 1 it is absorbed before it gets there.</dd>
              <dt>Scarcity and licence drift</dt><dd>Annual price drift of things that cannot be copied at any
                price — permits, brands, spectrum, registrations, unique locations.</dd>
              <dt>AI boost to output growth</dt><dd>How much extra real growth per year full automation adds on top
                of a country's trend rate.</dd>
              <dt>Share reaching the median household</dt><dd>Of that extra growth, how much shows up in a typical
                family's income rather than in profits and asset values. Low values produce a rich average and a
                squeezed median.</dd>
              <dt>Wage drift, non-automatable work</dt><dd>What happens to pay in the work machines cannot take.
                Scarce human labour can get more expensive even as most labour gets cheap.</dd>
              <dt>Substitution elasticity σ</dt><dd>How freely households swap away from things that get expensive.
                Below 1 they cannot: you can't respond to a rent rise by consuming less shelter. Below 1 is why the
                dear things take over the budget.</dd>
            </dl>
          </div>

          <div className="card" style={{marginTop:16}}>
            <h3>Columns and outputs</h3>
            <dl>
              <dt>Cost of living</dt><dd>The price of the basket a household actually buys, reweighted every year as
                spending shifts. Not an average of sector prices — the weights move, and that is the point.</dd>
              <dt>Basket shift</dt><dd>How much of household spending has moved from one sector to another by the
                horizon. High values mean the composition of life has changed, not just its price.</dd>
              <dt>Median ÷ mean income</dt><dd>How typical the average is. Falling values mean the gains are
                concentrating.</dd>
              <dt>Revenue pool</dt><dd>Price × volume × population, summed across buckets. A sector can have
                collapsing prices and a growing pool, or the reverse. Investors are paid out of the pool.</dd>
              <dt>Volume growth</dt><dd>Real quantity consumed, derived as pool growth minus price growth.</dd>
              <dt>Price vs basket</dt><dd>A sector's price change relative to the cost of living. Positive means it
                is getting more expensive in real terms — it is claiming a bigger slice of the pie.</dd>
              <dt>Non-reproducible share</dt><dd>Land + atoms + scarcity as a share of cost. A rough proxy for how
                defensible a margin is once labour is free.</dd>
              <dt>Automatable share</dt><dd>The fraction of a sector's labour a machine can genuinely replace, as
                opposed to assist. The most contestable number in the model, and editable for that reason.</dd>
              <dt>Engel curve</dt><dd>The empirical regularity that as income rises, food falls as a share of
                spending while health, leisure and status rise. It is how the Maslow ladder enters the arithmetic.</dd>
              <dt>Baumol's cost disease</dt><dd>Sectors that cannot automate get relatively more expensive over
                time, because they must still compete for workers with sectors that can. It is why haircuts,
                nursing and live music have outpaced televisions for a century.</dd>
              <dt>Ricardian rent</dt><dd>When supply is fixed and demand rises, the whole gain accrues to the owner
                of the fixed thing. Applied to land, it is the mechanism by which abundance can leave households no
                better off.</dd>
            </dl>
          </div>
        </div>)}

        <p className="note" style={{marginTop:20,color:"var(--dim)",fontSize:11.5}}>
          A reasoning tool, not a forecast, and not investment advice. Population and income levels are
          order-of-magnitude 2026 estimates; Engel curves, factor shares and automatability are stylised and meant
          to be argued with — which is why the table cells are editable. Every output is a mechanical consequence
          of the levers on the left.
        </p>
      </div>
    </div>
  </div></div>);
}
