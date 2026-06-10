import React, { useState, useMemo } from "react";

const SUBS = {
  earlyDx: "Early Detection & Dx",
  genomics: "Genomics & Sequencing",
  ioOncology: "IO / Checkpoint Onc",
  adcOncology: "ADCs / Next-Gen Onc",
  cellgene: "Cell & Gene Therapy",
  hematology: "Hematology-Oncology",
  metabolic: "Metabolic / GLP-1",
  cvRenal: "CV-Renal",
  immunology: "Immunology",
  neuroscience: "Neuroscience / CNS",
  rareDisease: "Rare Disease",
  primaryCare: "Primary Care Rx",
  vaccines: "Vaccines",
  aiDiscovery: "AI Drug Discovery",
  cro: "CRO / Clinical Svcs",
  toolsLife: "Life Science Tools",
  pharmaSaaS: "Pharma Data / SaaS",
  surgicalRobotics: "Surgical Robotics",
  integratedCare: "Integrated / VBC",
  acuteHospital: "Acute Hospital",
  specialtyPharmacy: "Specialty Pharmacy",
  medDevice: "Medical Devices"
};

const ASSUMPTIONS = [
  { id: "mced", label: "MCED / Blood Screening", group: "Prevention", color: "#00a39a", desc: "Multi-cancer early detection at population scale." },
  { id: "wearables", label: "Continuous Monitoring", group: "Prevention", color: "#00a39a", desc: "Consumer devices as clinical-grade data sources." },
  { id: "glp1", label: "GLP-1 Expansion", group: "Chronic", color: "#c8893a", desc: "GLP-1s expanding into CV, kidney, liver, AD." },
  { id: "chronicRx", label: "Chronic Earlier-Line Tx", group: "Chronic", color: "#c8893a", desc: "Same drug, new patient population multiplies TAM." },
  { id: "adcBispecific", label: "ADCs / Bispecifics", group: "Oncology", color: "#b8526b", desc: "ADCs as backbone oncology." },
  { id: "cellTherapy", label: "Cell Therapy Solid Tumors", group: "Oncology", color: "#b8526b", desc: "CAR-T and TIL expanding beyond heme." },
  { id: "robotics", label: "Surgical Robotics", group: "Delivery", color: "#7a7dc9", desc: "Robotic platforms displacing conventional surgery." },
  { id: "autonomousDx", label: "Autonomous AI Dx", group: "Delivery", color: "#7a7dc9", desc: "AI dx as standalone tools." },
  { id: "vbc", label: "Value-Based Care", group: "Delivery", color: "#7a7dc9", desc: "Capitation displaces FFS." },
  { id: "aiDiscovery", label: "AI Drug Discovery", group: "AI", color: "#5b8def", desc: "Foundation models commoditize target ID." },
  { id: "syntheticTrials", label: "Synthetic Controls", group: "AI", color: "#5b8def", desc: "ML-augmented trials compress CRO volume." },
  { id: "rweAcceleration", label: "RWE Acc. Approval", group: "Regulatory", color: "#c8484f", desc: "FDA/EMA accept RWE, adaptive designs." }
];

const SENS = {
  earlyDx: { mced: 95, wearables: 70, glp1: 10, chronicRx: 20, adcBispecific: 15, cellTherapy: 5, robotics: 5, autonomousDx: 40, vbc: 35, aiDiscovery: 20, syntheticTrials: 5, rweAcceleration: 15 },
  genomics: { mced: 60, wearables: 15, glp1: 5, chronicRx: 10, adcBispecific: 35, cellTherapy: 45, robotics: 5, autonomousDx: 30, vbc: 20, aiDiscovery: 40, syntheticTrials: 20, rweAcceleration: 25 },
  ioOncology: { mced: -5, wearables: 5, glp1: -5, chronicRx: 10, adcBispecific: -20, cellTherapy: -15, robotics: 5, autonomousDx: 10, vbc: 5, aiDiscovery: 15, syntheticTrials: 15, rweAcceleration: 40 },
  adcOncology: { mced: 5, wearables: 0, glp1: -5, chronicRx: 10, adcBispecific: 90, cellTherapy: 10, robotics: 10, autonomousDx: 15, vbc: 10, aiDiscovery: 25, syntheticTrials: 20, rweAcceleration: 45 },
  cellgene: { mced: 10, wearables: 0, glp1: 0, chronicRx: 5, adcBispecific: -10, cellTherapy: 90, robotics: 5, autonomousDx: 5, vbc: -5, aiDiscovery: 25, syntheticTrials: 15, rweAcceleration: 50 },
  hematology: { mced: 15, wearables: 5, glp1: 0, chronicRx: 15, adcBispecific: 25, cellTherapy: 55, robotics: 0, autonomousDx: 10, vbc: 5, aiDiscovery: 20, syntheticTrials: 20, rweAcceleration: 30 },
  metabolic: { mced: 10, wearables: 45, glp1: 95, chronicRx: 60, adcBispecific: -5, cellTherapy: 0, robotics: 5, autonomousDx: 20, vbc: 30, aiDiscovery: 10, syntheticTrials: 10, rweAcceleration: 15 },
  cvRenal: { mced: 25, wearables: 60, glp1: 70, chronicRx: 50, adcBispecific: -5, cellTherapy: 0, robotics: 10, autonomousDx: 25, vbc: 35, aiDiscovery: 15, syntheticTrials: 15, rweAcceleration: 20 },
  immunology: { mced: 5, wearables: 10, glp1: 15, chronicRx: 55, adcBispecific: -5, cellTherapy: 10, robotics: 0, autonomousDx: 5, vbc: 10, aiDiscovery: 20, syntheticTrials: 15, rweAcceleration: 25 },
  neuroscience: { mced: 55, wearables: 35, glp1: 45, chronicRx: 40, adcBispecific: 0, cellTherapy: 15, robotics: 5, autonomousDx: 20, vbc: 15, aiDiscovery: 30, syntheticTrials: 25, rweAcceleration: 45 },
  rareDisease: { mced: 30, wearables: 10, glp1: 5, chronicRx: 20, adcBispecific: 10, cellTherapy: 50, robotics: 0, autonomousDx: 10, vbc: -5, aiDiscovery: 30, syntheticTrials: 35, rweAcceleration: 60 },
  primaryCare: { mced: -35, wearables: -15, glp1: -30, chronicRx: -5, adcBispecific: -20, cellTherapy: -10, robotics: -10, autonomousDx: -20, vbc: -30, aiDiscovery: -15, syntheticTrials: -10, rweAcceleration: -10 },
  vaccines: { mced: 35, wearables: 20, glp1: 0, chronicRx: 0, adcBispecific: 0, cellTherapy: 0, robotics: 0, autonomousDx: 5, vbc: 10, aiDiscovery: 25, syntheticTrials: 20, rweAcceleration: 25 },
  aiDiscovery: { mced: 15, wearables: 10, glp1: 10, chronicRx: 10, adcBispecific: 20, cellTherapy: 25, robotics: 10, autonomousDx: 25, vbc: 15, aiDiscovery: 95, syntheticTrials: 50, rweAcceleration: 30 },
  cro: { mced: -5, wearables: 5, glp1: 15, chronicRx: 10, adcBispecific: 15, cellTherapy: 15, robotics: 0, autonomousDx: -15, vbc: -5, aiDiscovery: -40, syntheticTrials: -75, rweAcceleration: 25 },
  toolsLife: { mced: 45, wearables: 15, glp1: 15, chronicRx: 15, adcBispecific: 40, cellTherapy: 50, robotics: 5, autonomousDx: 20, vbc: 10, aiDiscovery: 55, syntheticTrials: 20, rweAcceleration: 15 },
  pharmaSaaS: { mced: 25, wearables: 20, glp1: 10, chronicRx: 15, adcBispecific: 20, cellTherapy: 20, robotics: 5, autonomousDx: 30, vbc: 25, aiDiscovery: 65, syntheticTrials: 40, rweAcceleration: 25 },
  surgicalRobotics: { mced: 10, wearables: 10, glp1: 0, chronicRx: 0, adcBispecific: 10, cellTherapy: 10, robotics: 95, autonomousDx: 35, vbc: 25, aiDiscovery: 15, syntheticTrials: 5, rweAcceleration: 10 },
  integratedCare: { mced: 40, wearables: 45, glp1: 20, chronicRx: 25, adcBispecific: 5, cellTherapy: 0, robotics: 30, autonomousDx: 55, vbc: 90, aiDiscovery: 20, syntheticTrials: 10, rweAcceleration: 15 },
  acuteHospital: { mced: -20, wearables: -15, glp1: 5, chronicRx: -10, adcBispecific: 5, cellTherapy: 10, robotics: -40, autonomousDx: -45, vbc: -80, aiDiscovery: -15, syntheticTrials: 0, rweAcceleration: -5 },
  specialtyPharmacy: { mced: -5, wearables: 0, glp1: 40, chronicRx: 20, adcBispecific: 20, cellTherapy: 25, robotics: 0, autonomousDx: 10, vbc: 25, aiDiscovery: 5, syntheticTrials: 0, rweAcceleration: 15 },
  medDevice: { mced: 20, wearables: 40, glp1: 10, chronicRx: 15, adcBispecific: 10, cellTherapy: 20, robotics: 45, autonomousDx: 30, vbc: 25, aiDiscovery: 20, syntheticTrials: 5, rweAcceleration: 15 }
};

const COMPANIES = [
  { tkr: "LLY", name: "Eli Lilly", region: "US", mix: { metabolic: 50, cvRenal: 5, ioOncology: 10, adcOncology: 5, immunology: 10, neuroscience: 8, primaryCare: 12 }, cap: 810 },
  { tkr: "NVO", name: "Novo Nordisk", region: "EU", mix: { metabolic: 85, cvRenal: 5, rareDisease: 10 }, cap: 165 },
  { tkr: "JNJ", name: "Johnson & Johnson", region: "US", mix: { immunology: 25, ioOncology: 15, adcOncology: 10, neuroscience: 10, medDevice: 35, primaryCare: 5 }, cap: 575 },
  { tkr: "MRK", name: "Merck", region: "US", mix: { ioOncology: 45, adcOncology: 10, vaccines: 20, primaryCare: 15, immunology: 10 }, cap: 300 },
  { tkr: "ABBV", name: "AbbVie", region: "US", mix: { immunology: 50, ioOncology: 10, hematology: 5, neuroscience: 15, primaryCare: 15, rareDisease: 5 }, cap: 370 },
  { tkr: "AZN", name: "AstraZeneca", region: "EU", mix: { ioOncology: 20, adcOncology: 20, metabolic: 15, cvRenal: 10, immunology: 10, rareDisease: 15, vaccines: 5, primaryCare: 5 }, cap: 245 },
  { tkr: "PFE", name: "Pfizer", region: "US", mix: { primaryCare: 25, vaccines: 20, ioOncology: 15, adcOncology: 10, immunology: 10, rareDisease: 15, hematology: 5 }, cap: 155 },
  { tkr: "NOVN", name: "Novartis", region: "EU", mix: { metabolic: 5, cvRenal: 20, ioOncology: 15, adcOncology: 5, immunology: 20, neuroscience: 15, rareDisease: 15, hematology: 5 }, cap: 225 },
  { tkr: "ROG", name: "Roche", region: "EU", mix: { ioOncology: 20, adcOncology: 10, hematology: 5, earlyDx: 20, immunology: 15, neuroscience: 10, primaryCare: 10, rareDisease: 10 }, cap: 270 },
  { tkr: "BMY", name: "Bristol-Myers", region: "US", mix: { ioOncology: 30, adcOncology: 10, hematology: 10, immunology: 15, cellgene: 10, primaryCare: 25 }, cap: 120 },
  { tkr: "AMGN", name: "Amgen", region: "US", mix: { ioOncology: 15, hematology: 10, immunology: 25, rareDisease: 20, primaryCare: 20, metabolic: 10 }, cap: 190 },
  { tkr: "SAN", name: "Sanofi", region: "EU", mix: { immunology: 40, vaccines: 20, rareDisease: 15, primaryCare: 15, metabolic: 10 }, cap: 135 },
  { tkr: "GILD", name: "Gilead", region: "US", mix: { primaryCare: 55, ioOncology: 15, adcOncology: 10, immunology: 10, cellgene: 10 }, cap: 115 },
  { tkr: "VRTX", name: "Vertex", region: "US", mix: { rareDisease: 80, cellgene: 15, neuroscience: 5 }, cap: 115 },
  { tkr: "REGN", name: "Regeneron", region: "US", mix: { immunology: 45, ioOncology: 15, adcOncology: 5, primaryCare: 25, rareDisease: 10 }, cap: 60 },
  { tkr: "EXAS", name: "Exact Sciences", region: "US", mix: { earlyDx: 95, genomics: 5 }, cap: 14 },
  { tkr: "NTRA", name: "Natera", region: "US", mix: { earlyDx: 60, genomics: 40 }, cap: 24 },
  { tkr: "ILMN", name: "Illumina", region: "US", mix: { genomics: 85, earlyDx: 10, toolsLife: 5 }, cap: 17 },
  { tkr: "TEM", name: "Tempus AI", region: "US", mix: { genomics: 40, pharmaSaaS: 35, earlyDx: 25 }, cap: 11 },
  { tkr: "TMO", name: "Thermo Fisher", region: "US", mix: { toolsLife: 50, cro: 15, pharmaSaaS: 5, earlyDx: 20, medDevice: 10 }, cap: 215 },
  { tkr: "DHR", name: "Danaher", region: "US", mix: { toolsLife: 55, earlyDx: 30, medDevice: 15 }, cap: 170 },
  { tkr: "IQV", name: "IQVIA", region: "US", mix: { cro: 65, pharmaSaaS: 35 }, cap: 38 },
  { tkr: "VEEV", name: "Veeva Systems", region: "US", mix: { pharmaSaaS: 100 }, cap: 40 },
  { tkr: "SDGR", name: "Schrodinger", region: "US", mix: { aiDiscovery: 80, ioOncology: 20 }, cap: 2.2 },
  { tkr: "RXRX", name: "Recursion", region: "US", mix: { aiDiscovery: 85, ioOncology: 10, rareDisease: 5 }, cap: 1.4 },
  { tkr: "ISRG", name: "Intuitive Surgical", region: "US", mix: { surgicalRobotics: 100 }, cap: 170 },
  { tkr: "MDT", name: "Medtronic", region: "US", mix: { medDevice: 80, surgicalRobotics: 10, integratedCare: 10 }, cap: 120 },
  { tkr: "BSX", name: "Boston Scientific", region: "US", mix: { medDevice: 95, surgicalRobotics: 5 }, cap: 145 },
  { tkr: "UNH", name: "UnitedHealth", region: "US", mix: { integratedCare: 65, specialtyPharmacy: 30, pharmaSaaS: 5 }, cap: 405 },
  { tkr: "CVS", name: "CVS Health", region: "US", mix: { specialtyPharmacy: 55, integratedCare: 35, primaryCare: 10 }, cap: 70 },
  { tkr: "CI", name: "Cigna", region: "US", mix: { integratedCare: 50, specialtyPharmacy: 50 }, cap: 85 },
  { tkr: "HCA", name: "HCA Healthcare", region: "US", mix: { acuteHospital: 90, integratedCare: 10 }, cap: 72 }
];

const PRESETS = {
  reset: { mced: 50, wearables: 50, glp1: 50, chronicRx: 50, adcBispecific: 50, cellTherapy: 50, robotics: 50, autonomousDx: 50, vbc: 50, aiDiscovery: 50, syntheticTrials: 50, rweAcceleration: 50 },
  bull: { mced: 80, wearables: 75, glp1: 85, chronicRx: 75, adcBispecific: 85, cellTherapy: 75, robotics: 75, autonomousDx: 75, vbc: 80, aiDiscovery: 80, syntheticTrials: 70, rweAcceleration: 75 },
  bear: { mced: 25, wearables: 30, glp1: 30, chronicRx: 35, adcBispecific: 35, cellTherapy: 20, robotics: 30, autonomousDx: 25, vbc: 25, aiDiscovery: 20, syntheticTrials: 15, rweAcceleration: 25 },
  ai: { mced: 70, wearables: 70, glp1: 60, chronicRx: 60, adcBispecific: 70, cellTherapy: 65, robotics: 60, autonomousDx: 85, vbc: 65, aiDiscovery: 95, syntheticTrials: 90, rweAcceleration: 80 },
  ira: { mced: 55, wearables: 55, glp1: 35, chronicRx: 25, adcBispecific: 50, cellTherapy: 40, robotics: 50, autonomousDx: 45, vbc: 70, aiDiscovery: 45, syntheticTrials: 40, rweAcceleration: 55 }
};

function scoreColor(s) {
  if (s >= 25) return "#00a39a";
  if (s >= 8) return "#34a8d8";
  if (s >= -8) return "#9ca3af";
  if (s >= -25) return "#c8893a";
  return "#c8484f";
}

export default function App() {
  const [assumptions, setAssumptions] = useState(PRESETS.reset);
  const [tab, setTab] = useState("redistribution");
  const [selectedSub, setSelectedSub] = useState("adcOncology");
  const [selectedCo, setSelectedCo] = useState("LLY");

  const subScores = useMemo(() => {
    const r = {};
    for (const sub in SENS) {
      let s = 0;
      for (const a in SENS[sub]) {
        const norm = (assumptions[a] - 50) / 50;
        s += SENS[sub][a] * norm;
      }
      r[sub] = Math.round(s / 12);
    }
    return r;
  }, [assumptions]);

  const companies = useMemo(() => {
    return COMPANIES.map(c => {
      let s = 0;
      const breakdown = [];
      for (const sub in c.mix) {
        const contrib = (subScores[sub] || 0) * (c.mix[sub] / 100);
        s += contrib;
        breakdown.push({ sub, weight: c.mix[sub], contribution: contrib });
      }
      breakdown.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
      return { ...c, score: Math.round(s), breakdown };
    }).sort((a, b) => b.score - a.score);
  }, [subScores]);

  const intensity = Math.round(Object.values(assumptions).reduce((a, b) => a + b, 0) / 12);
  const avgImpact = companies.reduce((a, b) => a + b.score, 0) / companies.length;

  const selSub = selectedSub;
  const selCo = companies.find(c => c.tkr === selectedCo) || companies[0];

  const grouped = {};
  ASSUMPTIONS.forEach(a => {
    if (!grouped[a.group]) grouped[a.group] = [];
    grouped[a.group].push(a);
  });

  return (
    <div style={{ fontFamily: "Georgia, serif", color: "#1a202c", background: "#fff", minHeight: "100vh" }}>
      <style>{".mono{font-family:ui-monospace,Menlo,monospace}input[type=range]{-webkit-appearance:none;height:3px;background:rgba(5,28,44,0.1);outline:none;border-radius:3px;width:100%}input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;background:#2251ff;border-radius:50%;cursor:pointer}"}</style>

      <div style={{ padding: "20px 28px", borderBottom: "1px solid #eee" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div className="mono" style={{ fontSize: 10, letterSpacing: "0.2em", color: "#2251ff", fontWeight: 600 }}>HEALTHCARE THESIS · 2026-2032</div>
            <h1 style={{ fontSize: 28, fontWeight: 400, margin: "6px 0 0 0", color: "#051c2c" }}>
              The <em style={{ color: "#2251ff" }}>redistribution</em> of healthcare value
            </h1>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>
              12 assumptions · 22 sub-industries · {COMPANIES.length} companies
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
              <button onClick={() => setAssumptions(PRESETS.reset)} className="mono" style={{ padding: "5px 10px", background: "#f7f8fa", border: "1px solid #ddd", borderRadius: 4, fontSize: 10, cursor: "pointer", fontWeight: 600 }}>NEUTRAL</button>
              <button onClick={() => setAssumptions(PRESETS.bull)} className="mono" style={{ padding: "5px 10px", background: "rgba(0,163,154,0.1)", border: "1px solid rgba(0,163,154,0.4)", borderRadius: 4, fontSize: 10, color: "#00a39a", cursor: "pointer", fontWeight: 700 }}>BULL</button>
              <button onClick={() => setAssumptions(PRESETS.bear)} className="mono" style={{ padding: "5px 10px", background: "rgba(200,72,79,0.1)", border: "1px solid rgba(200,72,79,0.4)", borderRadius: 4, fontSize: 10, color: "#c8484f", cursor: "pointer", fontWeight: 700 }}>BEAR</button>
              <button onClick={() => setAssumptions(PRESETS.ai)} className="mono" style={{ padding: "5px 10px", background: "rgba(91,141,239,0.1)", border: "1px solid rgba(91,141,239,0.4)", borderRadius: 4, fontSize: 10, color: "#5b8def", cursor: "pointer", fontWeight: 700 }}>AI BREAK</button>
              <button onClick={() => setAssumptions(PRESETS.ira)} className="mono" style={{ padding: "5px 10px", background: "rgba(200,137,58,0.1)", border: "1px solid rgba(200,137,58,0.4)", borderRadius: 4, fontSize: 10, color: "#c8893a", cursor: "pointer", fontWeight: 700 }}>IRA SQUEEZE</button>
            </div>
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            <div style={{ textAlign: "right" }}>
              <div className="mono" style={{ fontSize: 9, color: "#9ca3af", fontWeight: 600 }}>INTENSITY</div>
              <div className="mono" style={{ fontSize: 36, color: "#2251ff", lineHeight: 1 }}>{intensity}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="mono" style={{ fontSize: 9, color: "#9ca3af", fontWeight: 600 }}>AVG IMPACT</div>
              <div className="mono" style={{ fontSize: 26, color: scoreColor(avgImpact), lineHeight: 1.4 }}>
                {avgImpact > 0 ? "+" : ""}{avgImpact.toFixed(1)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", borderBottom: "1px solid #eee", paddingLeft: 28, overflowX: "auto" }}>
        {["redistribution", "sub-industries", "companies", "appendix"].map(t => (
          <button
            key={t}
            className="mono"
            onClick={() => setTab(t)}
            style={{
              padding: "12px 18px",
              background: "transparent",
              border: "none",
              borderBottom: tab === t ? "2px solid #2251ff" : "2px solid transparent",
              color: tab === t ? "#2251ff" : "#6b7280",
              fontSize: 10,
              letterSpacing: "0.15em",
              cursor: "pointer",
              fontWeight: tab === t ? 700 : 500,
              whiteSpace: "nowrap"
            }}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {tab === "redistribution" && (
        <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", background: "#f7f8fa" }}>
          <div style={{ borderRight: "1px solid #eee", padding: 18, background: "#fff" }}>
            <div className="mono" style={{ fontSize: 10, color: "#2251ff", marginBottom: 12, fontWeight: 700 }}>12 ASSUMPTIONS</div>
            {Object.keys(grouped).map(g => (
              <div key={g} style={{ marginBottom: 14 }}>
                <div
                  className="mono"
                  style={{
                    fontSize: 9,
                    color: grouped[g][0].color,
                    marginBottom: 6,
                    paddingBottom: 3,
                    borderBottom: "1px solid " + grouped[g][0].color + "33",
                    fontWeight: 700
                  }}
                >
                  {g.toUpperCase()}
                </div>
                {grouped[g].map(a => (
                  <div
                    key={a.id}
                    style={{
                      marginBottom: 8,
                      padding: "8px 10px",
                      background: "#fff",
                      borderRadius: 4,
                      border: "1px solid #eee",
                      borderLeft: "3px solid " + a.color
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <div style={{ fontSize: 12, color: "#051c2c", fontWeight: 600 }}>{a.label}</div>
                      <div className="mono" style={{ fontSize: 13, color: a.color, fontWeight: 700 }}>{assumptions[a.id]}</div>
                    </div>
                    <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 6 }}>{a.desc}</div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={assumptions[a.id]}
                      onChange={e => setAssumptions({ ...assumptions, [a.id]: parseInt(e.target.value) })}
                      style={{ accentColor: a.color }}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div style={{ padding: "20px 24px" }}>
            <div className="mono" style={{ fontSize: 10, color: "#2251ff", marginBottom: 10, fontWeight: 700 }}>▸ WINNERS & CHALLENGED · 2032</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <div className="mono" style={{ fontSize: 10, color: "#00a39a", marginBottom: 8, fontWeight: 700 }}>▲ TOP 10 WINNERS</div>
                {companies.slice(0, 10).map((c, i) => {
                  const t = c.cap * Math.pow(1 + (c.score * 2) / 100, 6);
                  return (
                    <button
                      key={c.tkr}
                      onClick={() => { setSelectedCo(c.tkr); setTab("companies"); }}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        marginBottom: 4,
                        background: "#fff",
                        border: "1px solid rgba(0,163,154,0.2)",
                        borderLeft: "3px solid #00a39a",
                        borderRadius: "0 4px 4px 0",
                        cursor: "pointer",
                        textAlign: "left",
                        fontFamily: "inherit",
                        color: "#1a202c"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <div style={{ fontSize: 12 }}>
                          <span className="mono" style={{ fontSize: 10, color: "#9ca3af", marginRight: 6 }}>#{i + 1}</span>
                          {c.name}
                        </div>
                        <div className="mono" style={{ fontSize: 12, color: "#00a39a", fontWeight: 700 }}>+{c.score}</div>
                      </div>
                      <div className="mono" style={{ fontSize: 10 }}>
                        <span style={{ color: "#6b7280" }}>${c.cap.toFixed(0)}B</span>
                        <span style={{ color: "#9ca3af" }}> → </span>
                        <span style={{ color: "#00a39a", fontWeight: 700 }}>${t.toFixed(0)}B</span>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div>
                <div className="mono" style={{ fontSize: 10, color: "#c8484f", marginBottom: 8, fontWeight: 700 }}>▼ TOP 10 CHALLENGED</div>
                {companies.slice().reverse().slice(0, 10).map((c, i) => {
                  const t = c.cap * Math.pow(1 + (c.score * 2) / 100, 6);
                  return (
                    <button
                      key={c.tkr}
                      onClick={() => { setSelectedCo(c.tkr); setTab("companies"); }}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        marginBottom: 4,
                        background: "#fff",
                        border: "1px solid rgba(200,72,79,0.2)",
                        borderLeft: "3px solid #c8484f",
                        borderRadius: "0 4px 4px 0",
                        cursor: "pointer",
                        textAlign: "left",
                        fontFamily: "inherit",
                        color: "#1a202c"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <div style={{ fontSize: 12 }}>
                          <span className="mono" style={{ fontSize: 10, color: "#9ca3af", marginRight: 6 }}>#{i + 1}</span>
                          {c.name}
                        </div>
                        <div className="mono" style={{ fontSize: 12, color: c.score < 0 ? "#c8484f" : "#9ca3af", fontWeight: 700 }}>
                          {c.score > 0 ? "+" : ""}{c.score}
                        </div>
                      </div>
                      <div className="mono" style={{ fontSize: 10 }}>
                        <span style={{ color: "#6b7280" }}>${c.cap.toFixed(0)}B</span>
                        <span style={{ color: "#9ca3af" }}> → </span>
                        <span style={{ color: c.score < 0 ? "#c8484f" : "#6b7280", fontWeight: 700 }}>${t.toFixed(0)}B</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "sub-industries" && (
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", background: "#f7f8fa" }}>
          <div style={{ borderRight: "1px solid #eee", padding: 16, background: "#fff" }}>
            <div className="mono" style={{ fontSize: 10, color: "#2251ff", marginBottom: 12, fontWeight: 700 }}>22 SUB-INDUSTRIES</div>
            {Object.keys(SUBS)
              .map(id => ({ id, s: subScores[id] || 0 }))
              .sort((a, b) => b.s - a.s)
              .map(x => (
                <button
                  key={x.id}
                  onClick={() => setSelectedSub(x.id)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "8px 10px",
                    marginBottom: 3,
                    background: selectedSub === x.id ? "rgba(34,81,255,0.08)" : "#fff",
                    border: "1px solid " + (selectedSub === x.id ? "#2251ff" : "#eee"),
                    borderLeft: "3px solid " + scoreColor(x.s),
                    borderRadius: "0 4px 4px 0",
                    cursor: "pointer",
                    color: "#1a202c",
                    fontFamily: "inherit",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <span style={{ fontSize: 12 }}>{SUBS[x.id]}</span>
                  <span className="mono" style={{ fontSize: 13, color: scoreColor(x.s), fontWeight: 700 }}>
                    {x.s > 0 ? "+" : ""}{x.s}
                  </span>
                </button>
              ))}
          </div>
          <div style={{ padding: "20px 24px" }}>
            <h2 style={{ fontSize: 24, fontWeight: 400, margin: "4px 0 8px 0", color: "#051c2c" }}>{SUBS[selSub]}</h2>
            <div style={{ display: "flex", gap: 28, marginBottom: 20 }}>
              <div>
                <div className="mono" style={{ fontSize: 9, color: "#9ca3af", fontWeight: 600 }}>SCORE</div>
                <div className="mono" style={{ fontSize: 30, color: scoreColor(subScores[selSub]), fontWeight: 700 }}>
                  {subScores[selSub] > 0 ? "+" : ""}{subScores[selSub]}
                </div>
              </div>
              <div>
                <div className="mono" style={{ fontSize: 9, color: "#9ca3af", fontWeight: 600 }}>EXPOSED COS</div>
                <div className="mono" style={{ fontSize: 22, color: "#051c2c" }}>
                  {companies.filter(c => c.mix[selSub] > 0).length}
                </div>
              </div>
            </div>

            <div className="mono" style={{ fontSize: 10, color: "#2251ff", marginBottom: 10, fontWeight: 700 }}>▸ TOP DRIVERS</div>
            <div style={{ background: "#fff", padding: 14, borderRadius: 8, border: "1px solid #eee", marginBottom: 16 }}>
              {ASSUMPTIONS
                .map(a => ({ ...a, sens: SENS[selSub][a.id] }))
                .sort((a, b) => Math.abs(b.sens) - Math.abs(a.sens))
                .slice(0, 6)
                .map(d => (
                  <div
                    key={d.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "6px 10px",
                      marginBottom: 3,
                      background: "#f7f8fa",
                      borderRadius: 4,
                      borderLeft: "2px solid " + d.color
                    }}
                  >
                    <span style={{ fontSize: 11, color: "#1a202c" }}>{d.label}</span>
                    <span className="mono" style={{ fontSize: 11, color: d.sens >= 0 ? "#00a39a" : "#c8484f", fontWeight: 700 }}>
                      {d.sens > 0 ? "+" : ""}{d.sens}
                    </span>
                  </div>
                ))}
            </div>

            <div className="mono" style={{ fontSize: 10, color: "#2251ff", marginBottom: 10, fontWeight: 700 }}>▸ EXPOSED COMPANIES</div>
            <div style={{ background: "#fff", padding: 14, borderRadius: 8, border: "1px solid #eee" }}>
              {companies
                .filter(c => c.mix[selSub] > 0)
                .sort((a, b) => b.mix[selSub] - a.mix[selSub])
                .slice(0, 12)
                .map(c => (
                  <button
                    key={c.tkr}
                    onClick={() => { setSelectedCo(c.tkr); setTab("companies"); }}
                    style={{
                      width: "100%",
                      padding: "6px 8px",
                      marginBottom: 2,
                      background: "transparent",
                      border: "none",
                      borderBottom: "1px solid #eee",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      color: "#1a202c",
                      textAlign: "left",
                      display: "flex",
                      justifyContent: "space-between"
                    }}
                  >
                    <div style={{ fontSize: 12 }}>
                      <span className="mono" style={{ fontSize: 10, color: "#9ca3af", marginRight: 6 }}>{c.tkr}</span>
                      {c.name}
                    </div>
                    <div className="mono" style={{ fontSize: 12, color: "#051c2c", fontWeight: 700 }}>{c.mix[selSub]}%</div>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {tab === "companies" && (
        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", background: "#f7f8fa" }}>
          <div style={{ borderRight: "1px solid #eee", padding: 16, background: "#fff" }}>
            <div className="mono" style={{ fontSize: 10, color: "#2251ff", marginBottom: 10, fontWeight: 700 }}>{companies.length} COMPANIES</div>
            {companies.map(c => (
              <button
                key={c.tkr}
                onClick={() => setSelectedCo(c.tkr)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "8px 10px",
                  marginBottom: 3,
                  background: selectedCo === c.tkr ? "rgba(34,81,255,0.08)" : "#fff",
                  border: "1px solid " + (selectedCo === c.tkr ? "#2251ff" : "#eee"),
                  borderLeft: "3px solid " + scoreColor(c.score),
                  borderRadius: "0 4px 4px 0",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  color: "#1a202c"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <span className="mono" style={{ fontSize: 10, fontWeight: 700, color: "#051c2c" }}>{c.tkr}</span>
                      <span style={{ fontSize: 12 }}>{c.name}</span>
                    </div>
                    <div className="mono" style={{ fontSize: 9, color: "#9ca3af", marginTop: 2 }}>
                      ${c.cap.toFixed(0)}B · {c.region}
                    </div>
                  </div>
                  <div className="mono" style={{ fontSize: 14, color: scoreColor(c.score), fontWeight: 700 }}>
                    {c.score > 0 ? "+" : ""}{c.score}
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div style={{ padding: "20px 24px" }}>
            <div className="mono" style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600 }}>{selCo.region.toUpperCase()} · {selCo.tkr}</div>
            <h2 style={{ fontSize: 26, fontWeight: 400, margin: "4px 0 12px 0", color: "#051c2c" }}>{selCo.name}</h2>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 18 }}>
              <div style={{ padding: "12px 14px", background: "#fff", borderRadius: 6, border: "1px solid #eee" }}>
                <div className="mono" style={{ fontSize: 9, color: "#9ca3af", fontWeight: 600 }}>CURRENT CAP</div>
                <div className="mono" style={{ fontSize: 22, color: "#051c2c" }}>${selCo.cap.toFixed(0)}B</div>
              </div>
              <div style={{ padding: "12px 14px", background: "#fff", borderRadius: 6, border: "1px solid " + scoreColor(selCo.score) + "44", borderLeft: "3px solid " + scoreColor(selCo.score) }}>
                <div className="mono" style={{ fontSize: 9, color: "#9ca3af", fontWeight: 600 }}>SCORE</div>
                <div className="mono" style={{ fontSize: 22, color: scoreColor(selCo.score), fontWeight: 700 }}>
                  {selCo.score > 0 ? "+" : ""}{selCo.score}
                </div>
              </div>
              <div style={{ padding: "12px 14px", background: "#fff", borderRadius: 6, border: "1px solid #eee" }}>
                <div className="mono" style={{ fontSize: 9, color: "#9ca3af", fontWeight: 600 }}>2032 PROJ</div>
                <div className="mono" style={{ fontSize: 22, color: scoreColor(selCo.score) }}>
                  ${(selCo.cap * Math.pow(1 + (selCo.score * 2) / 100, 6)).toFixed(0)}B
                </div>
              </div>
            </div>

            <div className="mono" style={{ fontSize: 10, color: "#2251ff", marginBottom: 8, fontWeight: 700 }}>▸ REVENUE MIX → CONTRIBUTION</div>
            <div style={{ background: "#fff", padding: 14, borderRadius: 8, border: "1px solid #eee" }}>
              {selCo.breakdown.map(b => (
                <div
                  key={b.sub}
                  style={{
                    padding: "8px 12px",
                    marginBottom: 4,
                    background: "#f7f8fa",
                    borderRadius: 4,
                    borderLeft: "2px solid " + scoreColor(b.contribution * 5),
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <div style={{ fontSize: 12, color: "#1a202c" }}>{SUBS[b.sub]}</div>
                  <div style={{ display: "flex", gap: 14 }}>
                    <div className="mono" style={{ fontSize: 11, color: "#9ca3af", width: 36, textAlign: "right" }}>{b.weight}%</div>
                    <div
                      className="mono"
                      style={{
                        fontSize: 12,
                        color: scoreColor(b.contribution * 5),
                        fontWeight: 700,
                        width: 50,
                        textAlign: "right"
                      }}
                    >
                      {b.contribution > 0 ? "+" : ""}{b.contribution.toFixed(1)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "appendix" && (
        <div style={{ padding: "20px 28px", background: "#f7f8fa" }}>
          <h2 style={{ fontSize: 22, fontWeight: 400, margin: "0 0 4px 0", color: "#051c2c" }}>Methodology</h2>
          <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 16 }}>
            How 12 assumptions map to {COMPANIES.length} companies.
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div style={{ padding: 16, background: "#fff", border: "1px solid #eee", borderRadius: 8 }}>
              <div className="mono" style={{ fontSize: 10, color: "#2251ff", marginBottom: 8, fontWeight: 700 }}>▸ MODEL FLOW</div>
              <div style={{ fontSize: 12, lineHeight: 1.7 }}>
                <div><strong style={{ color: "#051c2c" }}>1. Sliders</strong> [0-100] normalized to [-1, +1].</div>
                <div><strong style={{ color: "#051c2c" }}>2. Sub-industry score</strong> = Σ(sensitivity × normalized) / 12.</div>
                <div><strong style={{ color: "#051c2c" }}>3. Company score</strong> = Σ(sub score × mix weight).</div>
                <div><strong style={{ color: "#051c2c" }}>4. 2032 projection</strong> = current × (1 + score/50)^6.</div>
              </div>
            </div>
            <div style={{ padding: 16, background: "#fff", border: "1px solid #eee", borderRadius: 8 }}>
              <div className="mono" style={{ fontSize: 10, color: "#2251ff", marginBottom: 8, fontWeight: 700 }}>▸ COLOR SCALE</div>
              <div style={{ display: "grid", gridTemplateColumns: "70px 1fr", gap: 4, fontSize: 11 }}>
                <div className="mono" style={{ color: "#00a39a", fontWeight: 700 }}>+25/+50</div>
                <div>Strong tailwind</div>
                <div className="mono" style={{ color: "#34a8d8", fontWeight: 700 }}>+8/+24</div>
                <div>Net positive</div>
                <div className="mono" style={{ color: "#9ca3af", fontWeight: 700 }}>-7/+7</div>
                <div>Neutral</div>
                <div className="mono" style={{ color: "#c8893a", fontWeight: 700 }}>-24/-8</div>
                <div>Net headwind</div>
                <div className="mono" style={{ color: "#c8484f", fontWeight: 700 }}>-50/-25</div>
                <div>Strong headwind</div>
              </div>
            </div>
          </div>

          <div className="mono" style={{ fontSize: 10, color: "#2251ff", marginBottom: 8, fontWeight: 700 }}>▸ SENSITIVITY MATRIX</div>
          <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 8, overflow: "auto", marginBottom: 16 }}>
            <table style={{ borderCollapse: "collapse", fontSize: 10, width: "100%" }}>
              <thead>
                <tr style={{ background: "#f7f8fa" }}>
                  <th className="mono" style={{ padding: "8px 10px", textAlign: "left", color: "#9ca3af", fontWeight: 700, minWidth: 150 }}>SUB-INDUSTRY</th>
                  {ASSUMPTIONS.map(a => (
                    <th
                      key={a.id}
                      className="mono"
                      style={{ padding: "6px 4px", color: a.color, fontWeight: 700, minWidth: 50, fontSize: 9 }}
                      title={a.label}
                    >
                      {a.label.split(" ")[0].slice(0, 6).toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.keys(SUBS).map(subId => (
                  <tr key={subId} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "5px 10px", fontSize: 11, color: "#1a202c", fontWeight: 600 }}>{SUBS[subId]}</td>
                    {ASSUMPTIONS.map(a => {
                      const v = SENS[subId][a.id];
                      const intensity = Math.abs(v) / 100;
                      const bg = v >= 0
                        ? "rgba(0,163,154," + (intensity * 0.5) + ")"
                        : "rgba(200,72,79," + (intensity * 0.5) + ")";
                      return (
                        <td
                          key={a.id}
                          className="mono"
                          style={{
                            padding: "5px 4px",
                            textAlign: "center",
                            background: bg,
                            color: Math.abs(v) > 60 ? "#fff" : "#1a202c",
                            fontWeight: Math.abs(v) > 30 ? 700 : 400
                          }}
                        >
                          {v > 0 ? "+" : ""}{v}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mono" style={{ fontSize: 10, color: "#2251ff", marginBottom: 8, fontWeight: 700 }}>▸ LIMITATIONS</div>
          <div style={{ padding: 16, background: "#fff", border: "1px solid #eee", borderRadius: 8, fontSize: 12, lineHeight: 1.7 }}>
            <div>· Revenue mix held static at 2026 composition.</div>
            <div>· Linear sensitivity; patent cliffs and step-changes smoothed.</div>
            <div>· Currency effects ignored; EU/Asia caps in local terms.</div>
            <div>· No cross-correlations between assumptions.</div>
          </div>
        </div>
      )}

      <div style={{ padding: "10px 28px", borderTop: "1px solid #eee" }}>
        <div className="mono" style={{ fontSize: 9, color: "#9ca3af", letterSpacing: "0.08em" }}>
          Educational framework — not investment advice. Caps anchored Apr 2026.
        </div>
      </div>
    </div>
  );
}
