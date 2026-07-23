import React, { useState, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis, BarChart, Bar, Cell, ReferenceLine, Legend
} from "recharts";

/* ============================================================
   THE SCARCITY LEDGER
   A model of what happens to prices, baskets and savings when
   labour cost falls towards zero but land, energy and scarcity
   do not.
   ============================================================ */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap');

.sl { --ink:#0A0F16; --panel:#111B25; --panel2:#18242F; --line:#263543; --line2:#334555;
  --bone:#E7EBEE; --mute:#8395A4; --dim:#5D7183;
  --deflate:#3FBFC4; --inflate:#E0913C; --alarm:#DE5B4E; --violet:#9584E8;
  background:var(--ink); color:var(--bone);
  font-family:'IBM Plex Sans',system-ui,sans-serif; min-height:100%;
  font-size:14px; line-height:1.5; }
.sl *{box-sizing:border-box;}
.sl h1,.sl h2,.sl h3,.sl .disp{font-family:'Space Grotesk',system-ui,sans-serif;letter-spacing:-0.02em;}
.sl .mono{font-family:'IBM Plex Mono',ui-monospace,monospace;font-variant-numeric:tabular-nums;}
.sl .eyebrow{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:0.18em;
  text-transform:uppercase;color:var(--dim);}
.sl .wrap{max-width:1240px;margin:0 auto;padding:22px 18px 60px;}
.sl .masthead{border-bottom:1px solid var(--line);padding-bottom:16px;margin-bottom:18px;}
.sl .masthead h1{font-size:30px;font-weight:700;margin:6px 0 4px;}
.sl .masthead p{color:var(--mute);max-width:66ch;margin:0;font-size:13.5px;}
.sl .grid{display:grid;grid-template-columns:290px 1fr;gap:18px;align-items:start;}
@media (max-width:900px){.sl .grid{grid-template-columns:1fr;}}
.sl .panel{background:var(--panel);border:1px solid var(--line);border-radius:3px;padding:14px;}
.sl .rail{position:sticky;top:10px;max-height:calc(100vh - 24px);overflow:auto;}
.sl .rail::-webkit-scrollbar{width:6px;} .sl .rail::-webkit-scrollbar-thumb{background:var(--line2);}
.sl .lever{margin:0 0 13px;}
.sl .lever .top{display:flex;justify-content:space-between;align-items:baseline;gap:8px;}
.sl .lever label{font-size:11.5px;color:var(--bone);}
.sl .lever .val{font-family:'IBM Plex Mono',monospace;font-size:11.5px;color:var(--deflate);}
.sl .lever .hint{font-size:10.5px;color:var(--dim);margin-top:1px;}
.sl input[type=range]{width:100%;margin-top:5px;accent-color:var(--deflate);height:16px;}
.sl input[type=number]{background:var(--panel2);border:1px solid var(--line);color:var(--bone);
  font-family:'IBM Plex Mono',monospace;font-size:11.5px;padding:2px 5px;width:62px;border-radius:2px;}
.sl select{background:var(--panel2);border:1px solid var(--line);color:var(--bone);
  font-size:12.5px;padding:5px 7px;border-radius:2px;font-family:'IBM Plex Sans',sans-serif;}
.sl .tabs{display:flex;gap:2px;flex-wrap:wrap;margin-bottom:14px;border-bottom:1px solid var(--line);}
.sl .tab{background:none;border:none;border-bottom:2px solid transparent;color:var(--mute);
  font-family:'Space Grotesk',sans-serif;font-size:13px;font-weight:500;padding:8px 13px;cursor:pointer;}
.sl .tab:hover{color:var(--bone);}
.sl .tab.on{color:var(--bone);border-bottom-color:var(--inflate);}
.sl .presets{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px;}
.sl .preset{background:var(--panel2);border:1px solid var(--line);color:var(--mute);
  font-size:11.5px;padding:5px 9px;border-radius:2px;cursor:pointer;font-family:'IBM Plex Sans',sans-serif;}
.sl .preset:hover{border-color:var(--line2);color:var(--bone);}
.sl .preset.on{border-color:var(--inflate);color:var(--bone);background:#221A12;}
.sl .stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(146px,1fr));gap:1px;
  background:var(--line);border:1px solid var(--line);margin-bottom:16px;}
.sl .stat{background:var(--panel);padding:11px 12px;}
.sl .stat .k{font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:0.12em;
  text-transform:uppercase;color:var(--dim);}
.sl .stat .v{font-family:'Space Grotesk',sans-serif;font-size:23px;font-weight:500;margin-top:3px;}
.sl .stat .s{font-size:11px;color:var(--mute);margin-top:1px;}
.sl table{width:100%;border-collapse:collapse;font-size:12.5px;}
.sl th{text-align:right;font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:0.1em;
  text-transform:uppercase;color:var(--dim);padding:6px 7px;border-bottom:1px solid var(--line);font-weight:500;}
.sl th:first-child,.sl td:first-child{text-align:left;}
.sl td{padding:6px 7px;border-bottom:1px solid #1A2530;text-align:right;
  font-family:'IBM Plex Mono',monospace;font-variant-numeric:tabular-nums;}
.sl tbody tr:hover td{background:var(--panel2);}
.sl .sect{font-family:'IBM Plex Sans',sans-serif !important;}
.sl .note{font-size:12.5px;color:var(--mute);margin:10px 0 0;max-width:80ch;}
.sl .chip{display:inline-block;font-family:'IBM Plex Mono',monospace;font-size:10px;
  padding:1px 6px;border-radius:2px;border:1px solid var(--line2);color:var(--mute);}
.sl .bar{height:7px;background:var(--panel2);border-radius:1px;overflow:hidden;}
.sl .bar>i{display:block;height:100%;}
.sl h3{font-size:15px;margin:0 0 3px;font-weight:500;}
.sl .sub{font-size:12px;color:var(--mute);margin:0 0 12px;}
.sl .split{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
@media (max-width:820px){.sl .split{grid-template-columns:1fr;}}
.sl .verdict{border-left:2px solid var(--inflate);padding:10px 0 10px 13px;margin:16px 0 0;
  font-size:13px;color:var(--bone);}
.sl .verdict b{font-family:'Space Grotesk',sans-serif;}
@media (prefers-reduced-motion:no-preference){
  .sl .fade{animation:slf .35s ease-out;} @keyframes slf{from{opacity:0;transform:translateY(4px);}to{opacity:1;}}
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

/* ============================ UI BITS ============================ */
const pct = (v, d=1) => (v*100).toFixed(d) + "%";
const sgn = (v, d=1) => (v>=0?"+":"") + (v*100).toFixed(d) + "%";
const money = (v) => v >= 1e6 ? "$"+(v/1e6).toFixed(1)+"tn" : "$"+(v/1e3).toFixed(0)+"bn";

function mixColor(t) { // 0 = reproducible/cyan, 1 = non-reproducible/amber
  const a = [63,191,196], b = [224,145,60];
  const c = a.map((v,i)=> Math.round(v + (b[i]-v)*Math.max(0,Math.min(1,t))));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

function Lever({ label, hint, value, min, max, step, onChange, fmt }) {
  return (
    <div className="lever">
      <div className="top"><label>{label}</label><span className="val">{fmt(value)}</span></div>
      {hint && <div className="hint">{hint}</div>}
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e=>onChange(parseFloat(e.target.value))} />
    </div>
  );
}

function Stat({ k, v, s, color }) {
  return <div className="stat"><div className="k">{k}</div>
    <div className="v" style={color?{color}:undefined}>{v}</div>
    {s && <div className="s">{s}</div>}</div>;
}

function TipBox({ active, payload, label, sectors }) {
  if (!active || !payload || !payload.length) return null;
  const sorted = [...payload].sort((a,b)=>b.value-a.value);
  return (
    <div style={{background:"#0A0F16",border:"1px solid #263543",padding:"8px 10px",fontSize:11.5}}>
      <div className="mono" style={{color:"#8395A4",marginBottom:4}}>{label}</div>
      {sorted.map(p=>(
        <div key={p.dataKey} style={{display:"flex",justifyContent:"space-between",gap:14,color:p.stroke}}>
          <span>{p.name}</span><span className="mono">{p.value.toFixed(0)}</span>
        </div>
      ))}
    </div>
  );
}

/* ============================ APP ============================ */
export default function ScarcityLedger() {
  const [preset, setPreset] = useState("rent");
  const [L, setL] = useState({ ...PRESETS.rent.d, bondY:0.038 });
  const [geos, setGeos] = useState(GEOS_0);
  const [sectors, setSectors] = useState(SECTORS_0);
  const [tab, setTab] = useState("fan");
  const [home, setHome] = useState("EUS");
  const [nest, setNest] = useState(25);
  const [alloc, setAlloc] = useState(() => {
    const o = {}; ASSETS.forEach(a => o[a.id] = 0);
    o.eqty = 40; o.resi = 20; o.grid = 10; o.farm = 10; o.bond = 10; o.cash = 10;
    return o;
  });

  const set = (k) => (v) => { setL(p=>({...p,[k]:v})); setPreset("custom"); };
  const applyPreset = (k) => { setPreset(k); setL(p=>({ ...PRESETS[k].d, bondY:p.bondY })); };

  const M = useMemo(()=>runModel(L, geos, sectors), [L, geos, sectors]);
  const AR = useMemo(()=>assetReturns(M, L), [M, L]);

  const homeGeo = M.geoOut.find(g=>g.id===home) || M.geoOut[0];
  const allocTot = Object.values(alloc).reduce((a,b)=>a+b,0) || 1;
  const portNom = AR.reduce((a,x)=>a + (alloc[x.id]/allocTot)*x.nom, 0);
  const portReal = (1+portNom)/(1+homeGeo.colC) - 1;
  const ppMult = Math.pow(1+portReal, M.N);
  const yearsCovered = nest * ppMult;

  const fanData = M.rows;

  return (
    <div className="sl">
      <style>{CSS}</style>
      <div className="wrap">

        <div className="masthead">
          <div className="eyebrow">A model of the post-labour price system · 17 economies · 12 sectors · 5 factors</div>
          <h1>The Scarcity Ledger</h1>
          <p>Musk's claim is an arithmetic claim: labour cost → 0, so the cost of living → 0, so savings are pointless.
             The arithmetic only works if labour is the only thing you pay for. This model splits every price into the
             five things you actually buy — <b>labour, capital, resources, land, scarcity</b> — and lets you watch what
             happens to each one separately.</p>
        </div>

        <div className="presets">
          {Object.entries(PRESETS).map(([k,v])=>(
            <button key={k} className={"preset"+(preset===k?" on":"")} onClick={()=>applyPreset(k)}>{v.label}</button>
          ))}
          {preset==="custom" && <span className="preset on">Custom</span>}
        </div>

        <div className="grid">
          {/* ---------------- LEVERS ---------------- */}
          <div className="panel rail">
            <div className="eyebrow" style={{marginBottom:10}}>Levers</div>

            <Lever label="Horizon" hint="Model runs from 2026" value={L.end} min={2032} max={2066} step={1}
              onChange={set("end")} fmt={v=>v} />
            <Lever label="Labour unit-cost decay" hint="Annual fall in the cost of an automatable task"
              value={L.decay} min={0} max={0.25} step={0.005} onChange={set("decay")} fmt={v=>"−"+pct(v)} />
            <Lever label="Diffusion multiplier" hint="How fast the world actually deploys it"
              value={L.diffM} min={0.2} max={1.5} step={0.05} onChange={set("diffM")} fmt={v=>v.toFixed(2)+"×"} />
            <Lever label="Diffusion spread" hint="&gt;1 widens the gap between rich and poor economies"
              value={L.spread} min={0.3} max={3} step={0.1} onChange={set("spread")} fmt={v=>v.toFixed(1)} />
            <Lever label="Capital-goods learning rate" hint="Annual fall in machine prices"
              value={L.learn} min={0} max={0.12} step={0.005} onChange={set("learn")} fmt={v=>"−"+pct(v)} />
            <Lever label="Resource & energy drift" hint="Negative = solar/mining abundance wins"
              value={L.res} min={-0.05} max={0.08} step={0.005} onChange={set("res")} fmt={v=>sgn(v)} />
            <Lever label="Rent elasticity to income" hint="How much of each extra $ of income land captures"
              value={L.landE} min={0} max={2.5} step={0.05} onChange={set("landE")} fmt={v=>v.toFixed(2)} />
            <Lever label="Scarcity / brand / licence drift" hint="Prices of things that cannot be copied"
              value={L.scar} min={0} max={0.07} step={0.0025} onChange={set("scar")} fmt={v=>sgn(v)} />
            <Lever label="AI boost to output growth" hint="Extra real growth per year at full diffusion"
              value={L.boost} min={0} max={0.06} step={0.0025} onChange={set("boost")} fmt={v=>"+"+pct(v)} />
            <Lever label="Share reaching the median household" hint="0 = all gains accrue to asset owners"
              value={L.capture} min={0} max={1} step={0.05} onChange={set("capture")} fmt={v=>pct(v,0)} />
            <Lever label="Wage drift, non-automatable work" hint="What the irreplaceable humans get"
              value={L.wage} min={0} max={0.06} step={0.0025} onChange={set("wage")} fmt={v=>sgn(v)} />
            <Lever label="Substitution elasticity σ" hint="&lt;1 = you cannot substitute away from what gets dear"
              value={L.sigma} min={0.2} max={1.6} step={0.05} onChange={set("sigma")} fmt={v=>v.toFixed(2)} />
            <Lever label="Long bond yield" hint="Used in the savings test"
              value={L.bondY} min={0} max={0.09} step={0.0025} onChange={set("bondY")} fmt={v=>pct(v)} />
          </div>

          {/* ---------------- CANVAS ---------------- */}
          <div>
            <div className="tabs">
              {[["fan","Divergence"],["geo","Geographies"],["sec","Sectors & factor mix"],
                ["inv","Where to invest"],["save","Your savings"]].map(([k,lbl])=>(
                <button key={k} className={"tab"+(tab===k?" on":"")} onClick={()=>setTab(k)}>{lbl}</button>
              ))}
            </div>

            {/* ---- headline stats always visible ---- */}
            <div className="stats">
              <Stat k="World cost of living" v={sgn(M.worldCol,2)+" /yr"}
                s={`index ${M.last.col.toFixed(0)} by ${L.end}`}
                color={M.worldCol>0?"var(--inflate)":"var(--deflate)"} />
              <Stat k="Cheapest ÷ dearest sector" v={M.spread.toFixed(0)+"×"} s="price dispersion at horizon" />
              <Stat k="Basket that deflates >2%/yr" v={pct(M.deflating,0)} s="of world spending at horizon"
                color="var(--deflate)" />
              <Stat k="Basket paid to land, atoms, scarcity"
                v={pct(M.nonRepShareBeg,0)+" → "+pct(M.nonRepShareEnd,0)} s="the part no robot makes"
                color="var(--inflate)" />
              <Stat k="€1 of cash, real value at horizon"
                v={(100/M.last.col).toFixed(2)} s={`in ${L.end} purchasing power`}
                color={M.last.col>100?"var(--alarm)":"var(--deflate)"} />
            </div>

            {tab==="fan" && (
              <div className="fade">
                <div className="panel">
                  <h3>The scissors</h3>
                  <p className="sub">Every sector priced at 100 in 2026. Line colour = share of unit cost paid to
                    land, atoms and scarcity — <span style={{color:"var(--deflate)"}}>cyan is reproducible</span>,
                    <span style={{color:"var(--inflate)"}}> amber cannot be copied</span>. The white line is the
                    consumer basket itself.</p>
                  <div style={{height:400}}>
                    <ResponsiveContainer>
                      <LineChart data={fanData} margin={{top:6,right:70,left:0,bottom:0}}>
                        <CartesianGrid stroke="#1B2530" vertical={false} />
                        <XAxis dataKey="year" stroke="#5D7183" tick={{fontSize:11,fontFamily:"IBM Plex Mono"}} />
                        <YAxis scale="log" domain={["auto","auto"]} stroke="#5D7183"
                          tick={{fontSize:11,fontFamily:"IBM Plex Mono"}} width={52} />
                        <Tooltip content={<TipBox sectors={sectors} />} />
                        <ReferenceLine y={100} stroke="#334555" strokeDasharray="3 3" />
                        {M.sectorOut.map(s=>(
                          <Line key={s.id} type="monotone" dataKey={"s"+s.id} name={s.short}
                            stroke={mixColor((s.nonRep-0.15)/0.55)} dot={false} strokeWidth={1.6} isAnimationActive={false} />
                        ))}
                        <Line type="monotone" dataKey="col" name="Consumer basket" stroke="#E7EBEE"
                          strokeWidth={2.4} dot={false} isAnimationActive={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="verdict">
                    <b>Read it this way.</b> Musk is right about the cyan lines and wrong about the white one.
                    Labour going to zero collapses the price of anything reproducible. It does nothing to the price of
                    a hectare in a good school district, a grid connection, a licence, a Tuscan hotel or a name people
                    recognise. Under these settings the basket a household actually buys moves
                    at <b style={{color:M.worldCol>0?"var(--inflate)":"var(--deflate)"}}> {sgn(M.worldCol,2)} a year</b>,
                    because as the cheap things get cheap they fall out of the budget and the dear things take it over.
                  </div>
                </div>

                <div className="panel" style={{marginTop:16}}>
                  <h3>Average annual drift, by factor</h3>
                  <p className="sub">This is the whole argument in five numbers. Everything else is weighting.</p>
                  {[["Labour (per unit of task)",M.fAvg.lab],["Capital goods",M.fAvg.cap],
                    ["Resources & energy",M.fAvg.res],["Land & location rent",M.fAvg.land],
                    ["Scarcity, brand, licence",M.fAvg.scar]].map(([n,v])=>(
                    <div key={n} style={{display:"grid",gridTemplateColumns:"200px 1fr 70px",gap:10,
                      alignItems:"center",marginBottom:7}}>
                      <span style={{fontSize:12.5}}>{n}</span>
                      <div className="bar"><i style={{width:Math.min(100,Math.abs(v)*600)+"%",
                        background:v<0?"var(--deflate)":"var(--inflate)"}} /></div>
                      <span className="mono" style={{fontSize:12,textAlign:"right",
                        color:v<0?"var(--deflate)":"var(--inflate)"}}>{sgn(v,2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab==="geo" && (
              <div className="fade panel">
                <h3>People and prices, by bucket</h3>
                <p className="sub">Diffusion is editable — it is the single biggest driver of who gets the deflation.
                  Basket shift measures how much of household spending has moved between sectors by {L.end}.</p>
                <div style={{overflowX:"auto"}}>
                <table>
                  <thead><tr>
                    <th>Bucket</th><th>Pop 26 → {String(L.end).slice(2)}</th><th>GNI/head</th>
                    <th>Diffusion</th><th>Land constraint</th><th>Cost of living</th>
                    <th>Median/mean</th><th>Basket shift</th><th>Spend pool</th>
                  </tr></thead>
                  <tbody>
                    {M.geoOut.map((g,i)=>(
                      <tr key={g.id}>
                        <td className="sect">{g.name}</td>
                        <td>{g.popBeg.toFixed(0)} → {g.popEnd.toFixed(0)}m</td>
                        <td>{(g.yBeg/1000).toFixed(0)}k → {(g.yEnd/1000).toFixed(0)}k</td>
                        <td><input type="number" min="0" max="1" step="0.05" value={geos[i].d}
                          onChange={e=>{const v=parseFloat(e.target.value)||0;
                            setGeos(p=>p.map((x,j)=>j===i?{...x,d:v}:x));}} /></td>
                        <td><input type="number" min="0" max="1" step="0.05" value={geos[i].lc}
                          onChange={e=>{const v=parseFloat(e.target.value)||0;
                            setGeos(p=>p.map((x,j)=>j===i?{...x,lc:v}:x));}} /></td>
                        <td style={{color:g.colC>0?"var(--inflate)":"var(--deflate)"}}>{sgn(g.colC,2)}</td>
                        <td>{pct(g.medRatio,0)}</td>
                        <td>{pct(g.shift,0)}</td>
                        <td>{money(g.poolEnd/1000)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
                <div style={{height:230,marginTop:18}}>
                  <ResponsiveContainer>
                    <BarChart data={M.geoOut.map(g=>({name:g.id, v:g.colC*100}))} margin={{top:4,right:8,left:0,bottom:4}}>
                      <CartesianGrid stroke="#1B2530" vertical={false} />
                      <XAxis dataKey="name" stroke="#5D7183" tick={{fontSize:10,fontFamily:"IBM Plex Mono"}} />
                      <YAxis stroke="#5D7183" tick={{fontSize:10,fontFamily:"IBM Plex Mono"}} width={44}
                        tickFormatter={v=>v.toFixed(1)+"%"} />
                      <Tooltip contentStyle={{background:"#0A0F16",border:"1px solid #263543",fontSize:12}}
                        formatter={v=>[v.toFixed(2)+"%","Cost of living /yr"]} />
                      <ReferenceLine y={0} stroke="#334555" />
                      <Bar dataKey="v" isAnimationActive={false}>
                        {M.geoOut.map(g=><Cell key={g.id} fill={g.colC>0?"#E0913C":"#3FBFC4"} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="note">The pattern to watch: the buckets with the <i>most</i> automation are often the ones
                  with the <i>fastest</i> cost-of-living growth, because their land is constrained and their income gains
                  get bid straight into rent and positional goods. Deflation shows up in the shops and inflation shows up
                  in the deed.</p>
              </div>
            )}

            {tab==="sec" && (
              <div className="fade">
                <div className="panel">
                  <h3>Factor mix — edit the assumptions</h3>
                  <p className="sub">Labour share is what Musk's argument acts on. Automatable share is how much of it
                    a machine can actually take. Everything else is what survives.</p>
                  <div style={{overflowX:"auto"}}>
                  <table>
                    <thead><tr>
                      <th>Sector</th><th>Labour</th><th>Automatable</th><th>Capital</th><th>Atoms</th>
                      <th>Land</th><th>Scarcity</th><th>Price /yr</th><th>Volume /yr</th><th>Nominal pool /yr</th>
                    </tr></thead>
                    <tbody>
                      {M.sectorOut.map((s,i)=>(
                        <tr key={s.id}>
                          <td className="sect"><span style={{color:mixColor((s.nonRep-0.15)/0.55)}}>■ </span>{s.name}</td>
                          <td><input type="number" min="0" max="1" step="0.02" value={sectors[i].f.lab}
                            onChange={e=>{const v=parseFloat(e.target.value)||0;
                              setSectors(p=>p.map((x,j)=>j===i?{...x,f:{...x.f,lab:v}}:x));}} /></td>
                          <td><input type="number" min="0" max="1" step="0.05" value={sectors[i].auto}
                            onChange={e=>{const v=parseFloat(e.target.value)||0;
                              setSectors(p=>p.map((x,j)=>j===i?{...x,auto:v}:x));}} /></td>
                          <td>{s.f.cap.toFixed(2)}</td><td>{s.f.res.toFixed(2)}</td>
                          <td style={{color:s.f.land>0.15?"var(--inflate)":undefined}}>{s.f.land.toFixed(2)}</td>
                          <td style={{color:s.f.scar>0.15?"var(--inflate)":undefined}}>{s.f.scar.toFixed(2)}</td>
                          <td style={{color:s.priceC<0?"var(--deflate)":"var(--inflate)"}}>{sgn(s.priceC,1)}</td>
                          <td>{sgn(s.volC,1)}</td>
                          <td style={{color:s.poolC<0?"var(--alarm)":"var(--bone)"}}>{sgn(s.poolC,1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                </div>
                <div className="panel" style={{marginTop:16}}>
                  <h3>Price collapse vs volume explosion</h3>
                  <p className="sub">Bubble size = nominal revenue pool at horizon. Bottom-right is the trap: everyone
                    uses far more of it and nobody pays for it. Top-right is where the money is.</p>
                  <div style={{height:330}}>
                    <ResponsiveContainer>
                      <ScatterChart margin={{top:10,right:20,left:0,bottom:16}}>
                        <CartesianGrid stroke="#1B2530" />
                        <XAxis type="number" dataKey="x" name="Volume" stroke="#5D7183"
                          tick={{fontSize:11,fontFamily:"IBM Plex Mono"}} tickFormatter={v=>v.toFixed(0)+"%"}
                          label={{value:"real volume growth /yr", position:"insideBottom", offset:-8,
                            fill:"#5D7183", fontSize:11}} />
                        <YAxis type="number" dataKey="y" name="Price" stroke="#5D7183" width={52}
                          tick={{fontSize:11,fontFamily:"IBM Plex Mono"}} tickFormatter={v=>v.toFixed(0)+"%"} />
                        <ZAxis type="number" dataKey="z" range={[40,900]} />
                        <ReferenceLine y={0} stroke="#334555" /><ReferenceLine x={0} stroke="#334555" />
                        <Tooltip contentStyle={{background:"#0A0F16",border:"1px solid #263543",fontSize:12}}
                          formatter={(v,n)=>[typeof v==="number"?v.toFixed(1)+(n==="z"?"":"%"):v,n]}
                          labelFormatter={()=>""} />
                        <Scatter data={M.sectorOut.map(s=>({x:s.volC*100,y:s.priceC*100,z:s.poolEnd/1000,name:s.short}))}
                          isAnimationActive={false}>
                          {M.sectorOut.map(s=><Cell key={s.id} fill={mixColor((s.nonRep-0.15)/0.55)} fillOpacity={0.75} />)}
                        </Scatter>
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="note">Sectors, largest pool first at horizon:{" "}
                    {[...M.sectorOut].sort((a,b)=>b.poolEnd-a.poolEnd).map(s=>s.short).join(" · ")}</p>
                </div>
              </div>
            )}

            {tab==="inv" && (
              <div className="fade">
                <div className="panel">
                  <h3>Sector scoreboard</h3>
                  <p className="sub">Score = 40% nominal revenue-pool growth + 30% price gain relative to the basket
                    + 30% margin durability (non-reproducible share minus labour share). It is a ranking, not a
                    recommendation.</p>
                  <table>
                    <thead><tr><th>Sector</th><th>Pool now</th><th>Pool {L.end}</th><th>Pool /yr</th>
                      <th>Real price /yr</th><th>Non-reproducible</th><th>Score</th></tr></thead>
                    <tbody>
                      {[...M.sectorOut].sort((a,b)=>b.score-a.score).map(s=>(
                        <tr key={s.id}>
                          <td className="sect">{s.name}</td>
                          <td>{money(s.poolBeg/1000)}</td><td>{money(s.poolEnd/1000)}</td>
                          <td style={{color:s.poolC<0?"var(--alarm)":undefined}}>{sgn(s.poolC,1)}</td>
                          <td style={{color:s.realPrice<0?"var(--deflate)":"var(--inflate)"}}>{sgn(s.realPrice,1)}</td>
                          <td>{pct(s.nonRep,0)}</td>
                          <td style={{color:s.score>0?"var(--inflate)":"var(--dim)"}}>{s.score.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="panel" style={{marginTop:16}}>
                  <h3>Asset classes, ranked by real return</h3>
                  <p className="sub">Each asset earns the drift of the factors it owns plus 70% of the volume growth of
                    the sector it serves, deflated by the cost of living in{" "}
                    <select value={home} onChange={e=>setHome(e.target.value)}>
                      {M.geoOut.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>.</p>
                  <table>
                    <thead><tr><th>Asset</th><th>Owns</th><th>Nominal /yr</th><th>Real /yr</th><th></th></tr></thead>
                    <tbody>
                      {[...AR].sort((a,b)=>b.nom-a.nom).map(a=>{
                        const real = (1+a.nom)/(1+homeGeo.colC)-1;
                        return (
                          <tr key={a.id}>
                            <td className="sect">{a.name}</td>
                            <td className="sect" style={{color:"var(--dim)",fontSize:11.5}}>{a.note}</td>
                            <td>{sgn(a.nom,1)}</td>
                            <td style={{color:real<0?"var(--alarm)":"var(--deflate)"}}>{sgn(real,1)}</td>
                            <td style={{width:130}}>
                              <div className="bar"><i style={{width:Math.min(100,Math.abs(real)*700)+"%",
                                background:real<0?"var(--alarm)":"var(--deflate)"}} /></div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <p className="note">The ordering is the useful output, not the levels. Notice which assets flip sign
                    when you move a single lever — those are the positions that are really bets on the hypothesis rather
                    than on the world.</p>
                </div>
              </div>
            )}

            {tab==="save" && (
              <div className="fade">
                <div className="panel">
                  <h3>Is Musk right about your savings?</h3>
                  <p className="sub">Set a portfolio and a nest egg, then read the only number that matters: how many
                    years of your own consumption it still buys at the horizon.</p>
                  <div className="split">
                    <div>
                      <div style={{display:"flex",gap:14,alignItems:"center",marginBottom:12,flexWrap:"wrap"}}>
                        <label style={{fontSize:12.5}}>Nest egg, in years of today's spending
                          <input type="number" min="0" max="80" step="1" value={nest} style={{marginLeft:8}}
                            onChange={e=>setNest(parseFloat(e.target.value)||0)} /></label>
                        <span className="chip">Home: {homeGeo.name}</span>
                      </div>
                      <div style={{maxHeight:330,overflow:"auto",paddingRight:6}}>
                        {ASSETS.map(a=>(
                          <div key={a.id} style={{display:"grid",gridTemplateColumns:"1fr 84px 46px",
                            gap:8,alignItems:"center",marginBottom:5}}>
                            <span style={{fontSize:12}}>{a.name}</span>
                            <input type="range" min="0" max="60" step="1" value={alloc[a.id]}
                              onChange={e=>setAlloc(p=>({...p,[a.id]:parseFloat(e.target.value)}))} />
                            <span className="mono" style={{fontSize:11.5,color:"var(--mute)",textAlign:"right"}}>
                              {((alloc[a.id]/allocTot)*100).toFixed(0)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="stats" style={{gridTemplateColumns:"1fr 1fr"}}>
                        <Stat k="Portfolio nominal" v={sgn(portNom,1)+" /yr"} />
                        <Stat k="Portfolio real" v={sgn(portReal,1)+" /yr"}
                          color={portReal<0?"var(--alarm)":"var(--deflate)"} />
                        <Stat k="Purchasing power ×" v={ppMult.toFixed(2)+"×"} s={`over ${M.N} years`} />
                        <Stat k="Years of consumption covered" v={yearsCovered.toFixed(0)}
                          s={`from ${nest} today`}
                          color={yearsCovered<nest?"var(--alarm)":"var(--deflate)"} />
                      </div>
                      <div style={{height:220}}>
                        <ResponsiveContainer>
                          <LineChart data={M.years.map((y,i)=>({
                            year:y,
                            port: nest*Math.pow(1+portReal,i),
                            cash: nest*(100/(M.rows[i]?.col||100)),
                            need: nest }))} margin={{top:6,right:10,left:0,bottom:0}}>
                            <CartesianGrid stroke="#1B2530" vertical={false} />
                            <XAxis dataKey="year" stroke="#5D7183" tick={{fontSize:10,fontFamily:"IBM Plex Mono"}} />
                            <YAxis stroke="#5D7183" tick={{fontSize:10,fontFamily:"IBM Plex Mono"}} width={40} />
                            <Tooltip contentStyle={{background:"#0A0F16",border:"1px solid #263543",fontSize:12}}
                              formatter={v=>[v.toFixed(1)+" yrs",""]} />
                            <Line type="monotone" dataKey="port" name="Portfolio" stroke="#3FBFC4"
                              strokeWidth={2.2} dot={false} isAnimationActive={false} />
                            <Line type="monotone" dataKey="cash" name="Held as cash" stroke="#DE5B4E"
                              strokeWidth={1.6} dot={false} isAnimationActive={false} />
                            <Line type="monotone" dataKey="need" name="Starting point" stroke="#5D7183"
                              strokeDasharray="4 4" strokeWidth={1.2} dot={false} isAnimationActive={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      <p className="note">Cyan is your portfolio in years of your own consumption. Red is the same money
                        left in cash. Grey is where you started.</p>
                    </div>
                  </div>
                  <div className="verdict">
                    <b>The honest reading.</b> Musk's claim is best understood as a claim about <i>human capital</i>, not
                    about savings. A career is a claim on wages, and wages are what this technology destroys. Financial
                    capital is a claim on land, atoms, capacity and scarcity — which is exactly the part of the price
                    system that survives. Run H1 with rent elasticity at zero and he is right. Move rent elasticity
                    above about 1.0 and the conclusion inverts: saving stops being optional and starts being the only
                    way to stand on the owning side of the line.
                  </div>
                </div>
              </div>
            )}

            <p className="note" style={{marginTop:18,color:"var(--dim)",fontSize:11.5}}>
              A reasoning tool, not a forecast and not investment advice. Population and income levels are
              order-of-magnitude 2026 estimates; Engel curves, factor shares and automatability are stylised and meant
              to be argued with — the table cells are editable for exactly that reason. Every output is a mechanical
              consequence of the levers on the left.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
