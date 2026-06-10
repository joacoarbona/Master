import React, { useState, useMemo } from "react";

const SUBS = {
  earlyDx: "Early Detection & Dx", genomics: "Genomics & Sequencing",
  ioOncology: "IO / Checkpoint Onc", adcOncology: "ADCs / Next-Gen Onc",
  cellgene: "Cell & Gene Therapy", hematology: "Hematology-Oncology",
  metabolic: "Metabolic / GLP-1", cvRenal: "CV-Renal",
  immunology: "Immunology", neuroscience: "Neuroscience / CNS",
  rareDisease: "Rare Disease", primaryCare: "Primary Care Rx",
  vaccines: "Vaccines", aiDiscovery: "AI Drug Discovery",
  cro: "CRO / Clinical Svcs", toolsLife: "Life Science Tools",
  pharmaSaaS: "Pharma Data / SaaS", surgicalRobotics: "Surgical Robotics",
  integratedCare: "Integrated / VBC", acuteHospital: "Acute Hospital",
  specialtyPharmacy: "Specialty Pharmacy", medDevice: "Medical Devices"
};

const CONTINUUM_COLUMNS = [
  { id: "discovery", label: "Discovery", subs: ["aiDiscovery", "toolsLife"] },
  { id: "development", label: "Development", subs: ["cro", "pharmaSaaS"] },
  { id: "prevention", label: "Prevention", subs: ["vaccines", "earlyDx", "genomics"] },
  { id: "therapeutics", label: "Therapeutics", subs: ["ioOncology", "adcOncology", "cellgene", "hematology", "metabolic", "cvRenal", "immunology", "neuroscience", "rareDisease", "primaryCare"] },
  { id: "delivery", label: "Delivery", subs: ["surgicalRobotics", "medDevice", "integratedCare", "acuteHospital", "specialtyPharmacy"] }
];

const CONNECTIONS = [
  { from: "aiDiscovery", to: "ioOncology", type: "feeds" },
  { from: "aiDiscovery", to: "adcOncology", type: "feeds" },
  { from: "aiDiscovery", to: "rareDisease", type: "feeds" },
  { from: "aiDiscovery", to: "neuroscience", type: "feeds" },
  { from: "aiDiscovery", to: "metabolic", type: "feeds" },
  { from: "aiDiscovery", to: "cro", type: "substitutes" },
  { from: "toolsLife", to: "genomics", type: "feeds" },
  { from: "toolsLife", to: "cellgene", type: "feeds" },
  { from: "cro", to: "ioOncology", type: "feeds" },
  { from: "cro", to: "adcOncology", type: "feeds" },
  { from: "pharmaSaaS", to: "cro", type: "substitutes" },
  { from: "pharmaSaaS", to: "integratedCare", type: "feeds" },
  { from: "earlyDx", to: "adcOncology", type: "feeds" },
  { from: "earlyDx", to: "neuroscience", type: "feeds" },
  { from: "earlyDx", to: "acuteHospital", type: "pressures" },
  { from: "genomics", to: "cellgene", type: "feeds" },
  { from: "genomics", to: "earlyDx", type: "feeds" },
  { from: "vaccines", to: "acuteHospital", type: "pressures" },
  { from: "metabolic", to: "cvRenal", type: "feeds" },
  { from: "metabolic", to: "primaryCare", type: "substitutes" },
  { from: "metabolic", to: "acuteHospital", type: "pressures" },
  { from: "metabolic", to: "medDevice", type: "pressures" },
  { from: "ioOncology", to: "adcOncology", type: "substitutes" },
  { from: "adcOncology", to: "surgicalRobotics", type: "pressures" },
  { from: "cellgene", to: "hematology", type: "substitutes" },
  { from: "immunology", to: "primaryCare", type: "substitutes" },
  { from: "surgicalRobotics", to: "acuteHospital", type: "substitutes" },
  { from: "integratedCare", to: "acuteHospital", type: "substitutes" },
  { from: "medDevice", to: "integratedCare", type: "feeds" }
];

const ASSUMPTIONS = [
  { id: "mced", label: "MCED / Blood Screening", group: "Prevention", color: "#22d3ee",
    desc: "Multi-cancer early detection at population scale.",
    thesis: "Single blood draws identifying cancer years before symptoms could redistribute $300B+ of oncology spend upstream.",
    catalysts: [{ date: "Mid 2026", event: "Medicare MCED coverage decision" }, { date: "2024", event: "Cologuard Plus FDA approval" }],
    pro: ["GRAIL Galleri NHS 140K+ enrolled", "Cologuard Plus 95% sensitivity", "Natera Signatera expanding"],
    con: ["Most MCED still out-of-pocket", "False positive cascade", "Lead-time bias"],
    winners: ["EXAS", "NTRA", "GH", "GRAIL"], losers: ["HCA"] },
  { id: "wearables", label: "Continuous Monitoring", group: "Prevention", color: "#22d3ee",
    desc: "Consumer devices as clinical-grade data sources.",
    thesis: "Apple Watch, CGMs, smart patches as continuous clinical data shifts diagnosis from episodic to always-on.",
    catalysts: [{ date: "Q3 2025", event: "Dexcom Stelo OTC CGM" }, { date: "Oct 2025", event: "Apple Watch hypertension" }],
    pro: ["Apple Watch FDA-cleared AFib", "CGMs moving OTC", "RPM CPT codes expanded"],
    con: ["Clinical actionability debated", "Data privacy unresolved", "Payer reimbursement patchy"],
    winners: ["DXCM", "UNH", "MDT"], losers: ["HCA"] },
  { id: "glp1", label: "GLP-1 Expansion", group: "Chronic", color: "#f59e0b",
    desc: "GLP-1s expanding into CV, kidney, liver, AD.",
    thesis: "GLP-1s becoming the aspirin of the 21st century — one molecular class treating a constellation of diseases.",
    catalysts: [{ date: "2025", event: "FLOW kidney outcomes" }, { date: "2026+", event: "EVOKE Alzheimer readout" }],
    pro: ["Tirzepatide/sema expanding T2D to AD", "MASH approvals coming", "Oral GLP-1 launches"],
    con: ["IRA negotiation looming", "Adherence under 50% real-world", "Compounded pressure on pricing"],
    winners: ["LLY", "NVO"], losers: ["PFE"] },
  { id: "chronicRx", label: "Chronic Earlier-Line Tx", group: "Chronic", color: "#f59e0b",
    desc: "Same drug, new patient population multiplies TAM.",
    thesis: "Lecanemab for pre-symptomatic AD, PCSK9 for primary prevention, ADCs adjuvant.",
    catalysts: [{ date: "Ongoing", event: "Lecanemab primary care rollout" }, { date: "Ongoing", event: "Farxiga HFpEF/CKD" }],
    pro: ["Lecanemab DMTs for AD", "Farxiga T2D to CKD 4x market", "PCSK9 primary prevention"],
    con: ["IRA targets chronic drugs first", "Adherence under 50%", "More competitors earlier line"],
    winners: ["AZN", "LLY", "NOVN"], losers: ["PFE", "BMY"] },
  { id: "adcBispecific", label: "ADCs / Bispecifics", group: "Oncology", color: "#ec4899",
    desc: "ADCs as backbone oncology.",
    thesis: "ADCs are the new chemotherapy — targeted payloads replacing broad chemo.",
    catalysts: [{ date: "Aug 2025", event: "Enhertu HER2-low 1L" }, { date: "Q1 2025", event: "Datroway global" }],
    pro: ["Enhertu HER2-low $15B+ peak", "Datroway 35+ countries", "Pfizer-Seagen $43B bet"],
    con: ["ILD safety signals", "Manufacturing complexity", "Target saturation"],
    winners: ["4568", "AZN", "MRK"], losers: ["primary chemo"] },
  { id: "cellTherapy", label: "Cell Therapy Solid Tumors", group: "Oncology", color: "#ec4899",
    desc: "CAR-T and TIL expanding beyond heme.",
    thesis: "Cell therapy unlocks curative immunotherapy — if CMC bottlenecks break.",
    catalysts: [{ date: "2024", event: "Amtagvi first solid tumor" }, { date: "Ongoing", event: "Allogeneic CAR-T P3" }],
    pro: ["Amtagvi melanoma approval", "Solid tumor CAR-T early data", "Allogeneic platforms"],
    con: ["Manufacturing limits scale", "Solid tumor efficacy limited", "One-shot pricing struggles"],
    winners: ["VRTX", "GILD"], losers: ["traditional heme"] },
  { id: "robotics", label: "Surgical Robotics", group: "Delivery", color: "#a78bfa",
    desc: "Robotic platforms displacing conventional surgery.",
    thesis: "Intuitive owns urology/gyn; expansion into general/cardiac is the prize.",
    catalysts: [{ date: "2024", event: "da Vinci 5 launch" }, { date: "2025-26", event: "Medtronic Hugo US" }],
    pro: ["da Vinci 5 2.7M+ procedures", "Hugo US approval pending", "Stryker Mako ortho leader"],
    con: ["High capital cost", "GLP-1 reducing bariatric", "Outpatient shift caps growth"],
    winners: ["ISRG", "MDT", "BSX"], losers: ["HCA"] },
  { id: "autonomousDx", label: "Autonomous AI Dx", group: "Delivery", color: "#a78bfa",
    desc: "AI dx as standalone tools.",
    thesis: "AI dx that doesnt need a radiologist re-routes specialist revenue to primary care.",
    catalysts: [{ date: "Ongoing", event: "CMS AI CPT codes" }],
    pro: ["IDx-DR autonomous dx", "Aidoc in 1500+ hospitals", "Foundation models"],
    con: ["Liability unclear", "AI augments radiologists", "Reimbursement lag"],
    winners: ["TEM", "UNH"], losers: ["radiology hospitals"] },
  { id: "vbc", label: "Value-Based Care", group: "Delivery", color: "#a78bfa",
    desc: "Capitation displaces FFS.",
    thesis: "Vertically integrated payers convert FFS into capitated care.",
    catalysts: [{ date: "2025", event: "CMS ACO REACH" }, { date: "2026", event: "MA rate decisions" }],
    pro: ["Optum largest US physician employer", "CVS Oak Street", "MA penetration 50%+"],
    con: ["UNH regulatory scrutiny", "MA STAR pressure", "MLR caps margins"],
    winners: ["UNH", "CVS", "CI"], losers: ["HCA"] },
  { id: "aiDiscovery", label: "AI Drug Discovery", group: "AI", color: "#10b981",
    desc: "Foundation models commoditize target ID.",
    thesis: "AlphaFold solved structure. But structure is not function. Clinical wins unproven.",
    catalysts: [{ date: "2024", event: "AlphaFold 3 released" }, { date: "Ongoing", event: "Xaira $1B launch" }],
    pro: ["AlphaFold 3 near-solved", "Isomorphic $3B+ in deals", "Xaira $1B Series A"],
    con: ["Zero AI drugs approved 2026", "P2/3 failures 23-25", "Clinical bottleneck biological"],
    winners: ["SDGR", "RXRX", "Isomorphic"], losers: ["traditional IRO"] },
  { id: "syntheticTrials", label: "Synthetic Controls", group: "AI", color: "#10b981",
    desc: "ML-augmented trials compress CRO volume.",
    thesis: "If regulators accept synthetic controls at scale, trial costs drop 30-50%.",
    catalysts: [{ date: "2024", event: "FDA synthetic guidance" }, { date: "2025", event: "EMA Unlearn qualified" }],
    pro: ["Unlearn EMA-qualified", "FDA accepting rare/onco", "Flatiron RWE at scale"],
    con: ["Concurrent controls still required", "Works for rare", "IQVIA adapting"],
    winners: ["VEEV", "TEM"], losers: ["IQV"] },
  { id: "rweAcceleration", label: "RWE Acc. Approval", group: "Regulatory", color: "#dc2626",
    desc: "FDA/EMA accept RWE, adaptive designs.",
    thesis: "Faster approvals compress time-to-revenue. Aduhelm/Makena may swing pendulum.",
    catalysts: [{ date: "2025", event: "EU HTAR live" }, { date: "2026", event: "PDUFA VII RWE" }],
    pro: ["EU HTAR pan-EU onco", "70%+ onco accelerated", "Project Optimus smaller trials"],
    con: ["Aduhelm/Makena withdrawals", "Political pressure", "EU HTA pricing harder"],
    winners: ["biotechs"], losers: ["large CROs"] }
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
  { tkr: "LLY", name: "Eli Lilly", region: "US", mix: { metabolic: 50, cvRenal: 5, ioOncology: 10, adcOncology: 5, immunology: 10, neuroscience: 8, primaryCare: 12 }, caps: [365, 710, 780, 810] },
  { tkr: "NVO", name: "Novo Nordisk", region: "EU", mix: { metabolic: 85, cvRenal: 5, rareDisease: 10 }, caps: [360, 575, 330, 165] },
  { tkr: "JNJ", name: "Johnson & Johnson", region: "US", mix: { immunology: 25, ioOncology: 15, adcOncology: 10, neuroscience: 10, medDevice: 35, primaryCare: 5 }, caps: [440, 360, 385, 575] },
  { tkr: "MRK", name: "Merck", region: "US", mix: { ioOncology: 45, adcOncology: 10, vaccines: 20, primaryCare: 15, immunology: 10 }, caps: [290, 325, 245, 300] },
  { tkr: "ABBV", name: "AbbVie", region: "US", mix: { immunology: 50, ioOncology: 10, hematology: 5, neuroscience: 15, primaryCare: 15, rareDisease: 5 }, caps: [280, 290, 335, 370] },
  { tkr: "AZN", name: "AstraZeneca", region: "EU", mix: { ioOncology: 20, adcOncology: 20, metabolic: 15, cvRenal: 10, immunology: 10, rareDisease: 15, vaccines: 5, primaryCare: 5 }, caps: [210, 235, 215, 245] },
  { tkr: "PFE", name: "Pfizer", region: "US", mix: { primaryCare: 25, vaccines: 20, ioOncology: 15, adcOncology: 10, immunology: 10, rareDisease: 15, hematology: 5 }, caps: [220, 150, 135, 155] },
  { tkr: "NOVN", name: "Novartis", region: "EU", mix: { metabolic: 5, cvRenal: 20, ioOncology: 15, adcOncology: 5, immunology: 20, neuroscience: 15, rareDisease: 15, hematology: 5 }, caps: [205, 215, 235, 225] },
  { tkr: "ROG", name: "Roche", region: "EU", mix: { ioOncology: 20, adcOncology: 10, hematology: 5, earlyDx: 20, immunology: 15, neuroscience: 10, primaryCare: 10, rareDisease: 10 }, caps: [265, 220, 240, 270] },
  { tkr: "BMY", name: "Bristol-Myers", region: "US", mix: { ioOncology: 30, adcOncology: 10, hematology: 10, immunology: 15, cellgene: 10, primaryCare: 25 }, caps: [140, 110, 95, 120] },
  { tkr: "AMGN", name: "Amgen", region: "US", mix: { ioOncology: 15, hematology: 10, immunology: 25, rareDisease: 20, primaryCare: 20, metabolic: 10 }, caps: [130, 150, 175, 190] },
  { tkr: "SAN", name: "Sanofi", region: "EU", mix: { immunology: 40, vaccines: 20, rareDisease: 15, primaryCare: 15, metabolic: 10 }, caps: [145, 130, 140, 135] },
  { tkr: "GSK", name: "GSK", region: "EU", mix: { vaccines: 35, immunology: 20, primaryCare: 20, ioOncology: 10, adcOncology: 5, rareDisease: 10 }, caps: [85, 90, 75, 80] },
  { tkr: "GILD", name: "Gilead", region: "US", mix: { primaryCare: 55, ioOncology: 15, adcOncology: 10, immunology: 10, cellgene: 10 }, caps: [105, 85, 125, 115] },
  { tkr: "VRTX", name: "Vertex", region: "US", mix: { rareDisease: 80, cellgene: 15, neuroscience: 5 }, caps: [82, 110, 125, 115] },
  { tkr: "REGN", name: "Regeneron", region: "US", mix: { immunology: 45, ioOncology: 15, adcOncology: 5, primaryCare: 25, rareDisease: 10 }, caps: [86, 100, 75, 60] },
  { tkr: "BAYN", name: "Bayer", region: "EU", mix: { primaryCare: 35, ioOncology: 15, adcOncology: 10, aiDiscovery: 5, immunology: 15, rareDisease: 20 }, caps: [65, 35, 25, 30] },
  { tkr: "BMRN", name: "BioMarin", region: "US", mix: { rareDisease: 85, cellgene: 15 }, caps: [18, 15, 11, 13] },
  { tkr: "UCB", name: "UCB", region: "EU", mix: { immunology: 45, neuroscience: 40, rareDisease: 15 }, caps: [15, 25, 30, 28] },
  { tkr: "MRNA", name: "Moderna", region: "US", mix: { vaccines: 90, ioOncology: 5, rareDisease: 5 }, caps: [55, 40, 12, 8] },
  { tkr: "4568", name: "Daiichi Sankyo", region: "Asia", mix: { adcOncology: 55, ioOncology: 10, primaryCare: 30, vaccines: 5 }, caps: [62, 85, 68, 55] },
  { tkr: "ONC", name: "BeOne", region: "Asia", mix: { hematology: 55, ioOncology: 25, adcOncology: 10, immunology: 10 }, caps: [27, 26, 24, 32] },
  { tkr: "4528", name: "Ono Pharma", region: "Asia", mix: { ioOncology: 50, immunology: 20, primaryCare: 30 }, caps: [11, 9, 8, 9] },
  { tkr: "EXAS", name: "Exact Sciences", region: "US", mix: { earlyDx: 95, genomics: 5 }, caps: [11, 11, 8, 14] },
  { tkr: "NTRA", name: "Natera", region: "US", mix: { earlyDx: 60, genomics: 40 }, caps: [6, 10, 18, 24] },
  { tkr: "GH", name: "Guardant Health", region: "US", mix: { earlyDx: 55, genomics: 45 }, caps: [3.2, 2.5, 4.8, 7] },
  { tkr: "ILMN", name: "Illumina", region: "US", mix: { genomics: 85, earlyDx: 10, toolsLife: 5 }, caps: [35, 20, 15, 17] },
  { tkr: "TEM", name: "Tempus AI", region: "US", mix: { genomics: 40, pharmaSaaS: 35, earlyDx: 25 }, caps: [0.1, 7, 12, 11] },
  { tkr: "TMO", name: "Thermo Fisher", region: "US", mix: { toolsLife: 50, cro: 15, pharmaSaaS: 5, earlyDx: 20, medDevice: 10 }, caps: [215, 220, 195, 215] },
  { tkr: "DHR", name: "Danaher", region: "US", mix: { toolsLife: 55, earlyDx: 30, medDevice: 15 }, caps: [175, 185, 150, 170] },
  { tkr: "IQV", name: "IQVIA", region: "US", mix: { cro: 65, pharmaSaaS: 35 }, caps: [40, 45, 30, 38] },
  { tkr: "VEEV", name: "Veeva Systems", region: "US", mix: { pharmaSaaS: 100 }, caps: [28, 35, 35, 40] },
  { tkr: "SDGR", name: "Schrodinger", region: "US", mix: { aiDiscovery: 80, ioOncology: 20 }, caps: [2.4, 1.8, 1.5, 2.2] },
  { tkr: "RXRX", name: "Recursion", region: "US", mix: { aiDiscovery: 85, ioOncology: 10, rareDisease: 5 }, caps: [1.6, 1.2, 1.8, 1.4] },
  { tkr: "ISRG", name: "Intuitive Surgical", region: "US", mix: { surgicalRobotics: 100 }, caps: [105, 135, 175, 170] },
  { tkr: "MDT", name: "Medtronic", region: "US", mix: { medDevice: 80, surgicalRobotics: 10, integratedCare: 10 }, caps: [120, 105, 115, 120] },
  { tkr: "BSX", name: "Boston Scientific", region: "US", mix: { medDevice: 95, surgicalRobotics: 5 }, caps: [75, 105, 150, 145] },
  { tkr: "UNH", name: "UnitedHealth", region: "US", mix: { integratedCare: 65, specialtyPharmacy: 30, pharmaSaaS: 5 }, caps: [485, 450, 485, 405] },
  { tkr: "CVS", name: "CVS Health", region: "US", mix: { specialtyPharmacy: 55, integratedCare: 35, primaryCare: 10 }, caps: [95, 90, 85, 70] },
  { tkr: "CI", name: "Cigna", region: "US", mix: { integratedCare: 50, specialtyPharmacy: 50 }, caps: [75, 100, 95, 85] },
  { tkr: "HCA", name: "HCA Healthcare", region: "US", mix: { acuteHospital: 90, integratedCare: 10 }, caps: [80, 90, 88, 72] },
  { tkr: "PRIV1", name: "Isomorphic Labs", region: "Private", mix: { aiDiscovery: 100 }, caps: [1.0, 2.5, 5.0, 7.5] },
  { tkr: "PRIV2", name: "Xaira Therapeutics", region: "Private", mix: { aiDiscovery: 85, ioOncology: 15 }, caps: [0.1, 1.0, 1.2, 1.5] },
  { tkr: "PRIV3", name: "GRAIL", region: "US", mix: { earlyDx: 100 }, caps: [3.5, 2.0, 2.5, 3.2] }
];

const COMPANY_INTEL = {
  "LLY:Eli Lilly": { oneLiner: "US pharma, $810B. Dominant metabolic platform.", remarkable: "From $365B to $810B in 3 years on GLP-1.", narrative: "Manufacturing scale-up, oral GLP-1, AD expansion.", macroKey: ["glp1", "chronicRx", "wearables"], macroRisk: ["rweAcceleration", "vbc"] },
  "NVO:Novo Nordisk": { oneLiner: "Danish, $165B (down 50%). Original GLP-1 innovator.", remarkable: "Concentration penalty: 85% GLP-1 revenue.", narrative: "Defensive, oral sema, diversification.", macroKey: ["glp1", "chronicRx"], macroRisk: ["rweAcceleration", "mced"] },
  "JNJ:Johnson & Johnson": { oneLiner: "$575B diversified. Pharma + MedTech.", remarkable: "Ottava soft-tissue robotics is underappreciated optionality.", narrative: "MedTech via robotics, pharma pipeline.", macroKey: ["robotics", "chronicRx", "adcBispecific"], macroRisk: ["glp1", "vbc"] },
  "MRK:Merck": { oneLiner: "$300B. Keytruda-centric. Racing 2028 LOE.", remarkable: "$22B Daiichi ADC deal biggest concentration hedge.", narrative: "Cliff planning, sub-q Keytruda.", macroKey: ["adcBispecific", "chronicRx"], macroRisk: ["cellTherapy", "rweAcceleration"] },
  "ABBV:AbbVie": { oneLiner: "$370B. Skyrizi + Rinvoq post-Humira.", remarkable: "Most successful LOE navigation ever.", narrative: "S+R to $27B+, Cerevel neuro.", macroKey: ["chronicRx"], macroRisk: ["glp1", "rweAcceleration"] },
  "AZN:AstraZeneca": { oneLiner: "$245B. Oncology + CVRM.", remarkable: "Enhertu co-dev with Daiichi most valuable onco partnership.", narrative: "$80B by 2030, oncology breadth.", macroKey: ["adcBispecific", "chronicRx", "glp1"], macroRisk: ["rweAcceleration", "cellTherapy"] },
  "PFE:Pfizer": { oneLiner: "$155B. Pivoting via Seagen.", remarkable: "Seagen $43B bet defining. Pays off or value trap.", narrative: "Cost-cutting, oncology integration.", macroKey: ["adcBispecific"], macroRisk: ["glp1", "chronicRx", "mced", "rweAcceleration"] },
  "NOVN:Novartis": { oneLiner: "Swiss $225B. Innovative pure-play.", remarkable: "Leqvio twice-yearly PCSK9 step-change. Pluvicto radiopharma.", narrative: "Compounder, radioligand scaling.", macroKey: ["chronicRx", "cellTherapy"], macroRisk: ["rweAcceleration", "glp1"] },
  "ROG:Roche": { oneLiner: "Swiss $270B. Pharma + Dx integration.", remarkable: "Vabysmo fastest to $2B in ophthalmology ever.", narrative: "Alzheimer bet, obesity via Carmot.", macroKey: ["mced", "chronicRx", "adcBispecific"], macroRisk: ["rweAcceleration", "glp1"] },
  "BMY:Bristol-Myers": { oneLiner: "$120B. Navigating LOE.", remarkable: "Cobenfy first novel schizophrenia MoA in decades.", narrative: "Cobenfy execution, IRA mitigation.", macroKey: ["cellTherapy", "chronicRx"], macroRisk: ["rweAcceleration", "glp1"] },
  "AMGN:Amgen": { oneLiner: "$190B. MariTide GLP-1 entry.", remarkable: "MariTide monthly dosing vs LLY/NVO weekly.", narrative: "MariTide readouts, biosimilars.", macroKey: ["glp1", "chronicRx"], macroRisk: ["rweAcceleration"] },
  "SAN:Sanofi": { oneLiner: "French $135B. Dupixent-led.", remarkable: "Dupixent most successful biologic of the 2020s.", narrative: "Dupixent expansion, Beyfortus.", macroKey: ["chronicRx"], macroRisk: ["rweAcceleration", "glp1"] },
  "GSK:GSK": { oneLiner: "UK $80B. Vaccines + HIV.", remarkable: "Arexvy strong but competitive pressure.", narrative: "Specialty growth, pipeline rebuild.", macroKey: [], macroRisk: ["rweAcceleration", "chronicRx"] },
  "GILD:Gilead": { oneLiner: "$115B. HIV + lenacapavir.", remarkable: "Lenacapavir PrEP 100% efficacy in PURPOSE.", narrative: "Lenacapavir launch, Kite cell therapy.", macroKey: ["adcBispecific", "cellTherapy"], macroRisk: ["mced", "rweAcceleration"] },
  "VRTX:Vertex": { oneLiner: "$115B. CF + pain + Casgevy.", remarkable: "Journavx first non-opioid acute pain in decades.", narrative: "Journavx, Casgevy CMC.", macroKey: ["cellTherapy", "chronicRx"], macroRisk: ["rweAcceleration"] },
  "REGN:Regeneron": { oneLiner: "$60B. Eylea under pressure.", remarkable: "Dupixent hidden gem 50/50 with Sanofi.", narrative: "Eylea HD defense, Libtayo.", macroKey: ["chronicRx"], macroRisk: ["rweAcceleration", "glp1"] },
  "BAYN:Bayer": { oneLiner: "German $30B. Pharma + Crop + CH.", remarkable: "Nubeqa Kerendia growth engines.", narrative: "Cost-cutting, breakup pressure.", macroKey: ["chronicRx", "aiDiscovery"], macroRisk: ["rweAcceleration"] },
  "BMRN:BioMarin": { oneLiner: "$13B rare disease.", remarkable: "Voxzogo expansion into skeletal dysplasia.", narrative: "Refocus on high-value rare.", macroKey: ["rweAcceleration"], macroRisk: [] },
  "UCB:UCB": { oneLiner: "Belgian $28B. Bimzelx best-in-class.", remarkable: "Bimzelx head-to-head wins vs Humira/Cosentyx.", narrative: "Bimzelx expansion, rare neurology.", macroKey: ["chronicRx"], macroRisk: ["rweAcceleration"] },
  "MRNA:Moderna": { oneLiner: "$8B (down 85%). mRNA platform.", remarkable: "Cancer vaccine P3 readout is the binary event.", narrative: "Cost restructuring, partnerships.", macroKey: ["adcBispecific"], macroRisk: ["rweAcceleration", "mced"] },
  "4568:Daiichi Sankyo": { oneLiner: "Japanese $55B. ADC pure-play.", remarkable: "Center of the ADC revolution.", narrative: "Enhertu growth, Datroway launches.", macroKey: ["adcBispecific", "mced"], macroRisk: ["rweAcceleration"] },
  "ONC:BeOne": { oneLiner: "Swiss-redomiciled $32B. Brukinsa #1 BTK.", remarkable: "Brukinsa $1B quarterly, 51% YoY.", narrative: "CLL share, Sonrotoclax pipeline.", macroKey: ["adcBispecific", "chronicRx"], macroRisk: ["rweAcceleration"] },
  "4528:Ono Pharma": { oneLiner: "Japanese $9B. Opdivo royalty declining.", remarkable: "Opdivo transition is the story.", narrative: "Pipeline rebuild post-Opdivo.", macroKey: [], macroRisk: ["adcBispecific", "rweAcceleration"] },
  "EXAS:Exact Sciences": { oneLiner: "$14B. Cologuard + MCED.", remarkable: "Cologuard Plus 95% sensitivity FDA approved.", narrative: "Cologuard Plus, MCED pipeline.", macroKey: ["mced", "wearables"], macroRisk: [] },
  "NTRA:Natera": { oneLiner: "$24B. Signatera MRD leader.", remarkable: "Signatera niche to SOC in 3 years.", narrative: "Signatera expansion, prenatal.", macroKey: ["mced", "adcBispecific", "chronicRx"], macroRisk: [] },
  "GH:Guardant Health": { oneLiner: "$7B liquid biopsy.", remarkable: "Shield first FDA blood-based CRC screening.", narrative: "Shield reimbursement, Reveal MRD.", macroKey: ["mced"], macroRisk: [] },
  "ILMN:Illumina": { oneLiner: "$17B sequencing.", remarkable: "Post-GRAIL refocus. Clinical sequencing growth.", narrative: "Clinical capture, multi-omics.", macroKey: ["mced", "cellTherapy", "aiDiscovery"], macroRisk: [] },
  "TEM:Tempus AI": { oneLiner: "$11B clinical-genomic + AI.", remarkable: "Only scaled player bridging seq + RWD + AI.", narrative: "Pharma partnerships, Lens platform.", macroKey: ["mced", "aiDiscovery", "syntheticTrials"], macroRisk: [] },
  "TMO:Thermo Fisher": { oneLiner: "$215B life science tools.", remarkable: "Most diversified picks-and-shovels in HC.", narrative: "Bioprocessing recovery, PPD.", macroKey: ["cellTherapy", "aiDiscovery", "mced"], macroRisk: ["syntheticTrials"] },
  "DHR:Danaher": { oneLiner: "$170B life sci + dx.", remarkable: "Bioprocessing recovery is the 2025-26 thesis.", narrative: "Destocking end, Cepheid volume.", macroKey: ["cellTherapy", "mced"], macroRisk: [] },
  "IQV:IQVIA": { oneLiner: "$38B CRO + data.", remarkable: "Dominant franchise + most at risk from AI.", narrative: "AI integration, backlog conversion.", macroKey: [], macroRisk: ["syntheticTrials", "aiDiscovery"] },
  "VEEV:Veeva Systems": { oneLiner: "$40B pharma SaaS.", remarkable: "De facto monopoly. Salesforce transition opens TAM.", narrative: "Vault CRM, AI agents.", macroKey: ["aiDiscovery", "syntheticTrials"], macroRisk: [] },
  "SDGR:Schrodinger": { oneLiner: "$2.2B AI software + pipeline.", remarkable: "Original comp chem leader. Internal pipeline is call option.", narrative: "Software consistency, readouts.", macroKey: ["aiDiscovery"], macroRisk: [] },
  "RXRX:Recursion": { oneLiner: "$1.4B. Merged with Exscientia.", remarkable: "P2 failures pressured stock.", narrative: "Integration, P2 readouts.", macroKey: ["aiDiscovery"], macroRisk: [] },
  "ISRG:Intuitive Surgical": { oneLiner: "$170B surgical robotics.", remarkable: "2.7M+ procedures/yr. da Vinci 5 refresh.", narrative: "da Vinci 5 ramp, international.", macroKey: ["robotics"], macroRisk: ["glp1"] },
  "MDT:Medtronic": { oneLiner: "$120B medtech.", remarkable: "Hugo US pending. Credible ISRG challenger.", narrative: "Hugo launch, PFA Affera.", macroKey: ["robotics", "wearables", "medDevice"], macroRisk: ["glp1"] },
  "BSX:Boston Scientific": { oneLiner: "$145B medtech. Farapulse leader.", remarkable: "Farapulse the medtech product of the decade.", narrative: "Farapulse capacity, WATCHMAN.", macroKey: ["medDevice"], macroRisk: ["glp1"] },
  "UNH:UnitedHealth": { oneLiner: "$405B payer + Optum.", remarkable: "Most important US HC company. VBC blueprint.", narrative: "MA normalization, Change remediation.", macroKey: ["vbc", "autonomousDx", "wearables"], macroRisk: [] },
  "CVS:CVS Health": { oneLiner: "$70B retail + PBM + Aetna.", remarkable: "Building UNH model 10 years late.", narrative: "MA discipline, Oak Street.", macroKey: ["vbc"], macroRisk: [] },
  "CI:Cigna": { oneLiner: "$85B payer + Evernorth.", remarkable: "The unintegrated option.", narrative: "Specialty mgmt, GLP-1 cost.", macroKey: ["vbc", "glp1"], macroRisk: [] },
  "HCA:HCA Healthcare": { oneLiner: "$72B acute hospitals.", remarkable: "Excellence in a declining model.", narrative: "Volume + pricing, outpatient ASC.", macroKey: [], macroRisk: ["vbc", "robotics", "autonomousDx", "mced", "wearables"] },
  "PRIV1:Isomorphic Labs": { oneLiner: "$7.5B AlphaFold spinout.", remarkable: "Most credible AI-native pure-play.", narrative: "Partnership flow, wholly-owned.", macroKey: ["aiDiscovery"], macroRisk: [] },
  "PRIV2:Xaira Therapeutics": { oneLiner: "$1.5B. Launched 2024 with $1B.", remarkable: "Largest biotech Series A ever.", narrative: "Platform buildout.", macroKey: ["aiDiscovery"], macroRisk: [] },
  "PRIV3:GRAIL": { oneLiner: "$3.2B MCED pioneer.", remarkable: "NHS Galleri readout is the binary event for MCED.", narrative: "NHS readout, Medicare pursuit.", macroKey: ["mced"], macroRisk: [] }
};

const BENCHMARKS = {
  XLV: { name: "S&P Healthcare", color: "#eab308", caps: [100, 108, 112, 115] },
  IHI: { name: "Medical Devices", color: "#a78bfa", caps: [100, 115, 92, 100] },
  IBB: { name: "Biotech", color: "#ec4899", caps: [100, 108, 102, 99] },
  PPH: { name: "Pharmaceutical", color: "#22d3ee", caps: [100, 120, 118, 127] },
  IHF: { name: "Healthcare Providers", color: "#dc2626", caps: [100, 98, 105, 93] },
  XBI: { name: "Biotech EW", color: "#10b981", caps: [100, 95, 98, 110] }
};

const GLOBAL_TOTAL = 6500;
const GLOBAL_BY_REGION = { US: 5100, EU: 900, Asia: 400, Private: 100 };
const COL_COLORS = ["#10b981", "#22d3ee", "#a78bfa", "#ec4899", "#f59e0b"];

function trajectory(caps) {
  const result = [];
  for (let m = 0; m < 37; m++) {
    const seg = Math.min(Math.floor(m / 12), 2);
    const f = (m % 12) / 12;
    const v = caps[seg] + (caps[seg + 1] - caps[seg]) * f;
    const noise = Math.sin(m * 1.7 + caps[0] * 0.1) * Math.max(0.5, v) * 0.04;
    result.push(Math.max(0.1, v + noise));
  }
  return result;
}

function maxOf(arr) {
  let m = -Infinity;
  for (let i = 0; i < arr.length; i++) if (arr[i] > m) m = arr[i];
  return m;
}

function minOf(arr) {
  let m = Infinity;
  for (let i = 0; i < arr.length; i++) if (arr[i] < m) m = arr[i];
  return m;
}

function updateAssumption(prev, key, val) {
  const next = {};
  const keys = Object.keys(prev);
  for (let i = 0; i < keys.length; i++) next[keys[i]] = prev[keys[i]];
  next[key] = val;
  return next;
}

export default function App() {
  const initialAssumptions = {};
  for (let i = 0; i < ASSUMPTIONS.length; i++) initialAssumptions[ASSUMPTIONS[i].id] = 50;

  const [assumptions, setAssumptions] = useState(initialAssumptions);
  const [activeTab, setActiveTab] = useState("overview");
  const [radarMode, setRadarMode] = useState("company");
  const [selectedCompany, setSelectedCompany] = useState("LLY:Eli Lilly");
  const [selectedSub, setSelectedSub] = useState("adcOncology");
  const [regionFilter, setRegionFilter] = useState("all");
  const [evidencePanel, setEvidencePanel] = useState(null);
  const [hoveredSub, setHoveredSub] = useState(null);
  const [scenarios, setScenarios] = useState([
    { id: "consensus", label: "Consensus", color: "#a8a29e", values: { mced: 50, wearables: 50, glp1: 65, chronicRx: 55, adcBispecific: 60, cellTherapy: 45, robotics: 55, autonomousDx: 40, vbc: 50, aiDiscovery: 55, syntheticTrials: 35, rweAcceleration: 50 } },
    { id: "bull", label: "Bull", color: "#22c55e", values: { mced: 80, wearables: 75, glp1: 85, chronicRx: 75, adcBispecific: 85, cellTherapy: 75, robotics: 75, autonomousDx: 75, vbc: 80, aiDiscovery: 80, syntheticTrials: 70, rweAcceleration: 75 } },
    { id: "bear", label: "Bear", color: "#dc2626", values: { mced: 25, wearables: 30, glp1: 30, chronicRx: 35, adcBispecific: 35, cellTherapy: 20, robotics: 30, autonomousDx: 25, vbc: 25, aiDiscovery: 20, syntheticTrials: 15, rweAcceleration: 25 } }
  ]);
  const [compareIds, setCompareIds] = useState(["consensus", "bull", "bear"]);
  const [saveLabel, setSaveLabel] = useState("");

  const subScores = useMemo(function() {
    const norm = {};
    const keys = Object.keys(assumptions);
    for (let i = 0; i < keys.length; i++) norm[keys[i]] = (assumptions[keys[i]] - 50) / 50;
    const r = {};
    const subKeys = Object.keys(SENS);
    for (let i = 0; i < subKeys.length; i++) {
      const sub = subKeys[i];
      const sens = SENS[sub];
      let s = 0;
      const aKeys = Object.keys(sens);
      for (let j = 0; j < aKeys.length; j++) s += sens[aKeys[j]] * (norm[aKeys[j]] || 0);
      r[sub] = Math.round(s / 12);
    }
    return r;
  }, [assumptions]);

  const companyData = useMemo(function() {
    const out = [];
    for (let i = 0; i < COMPANIES.length; i++) {
      const c = COMPANIES[i];
      let s = 0;
      const breakdown = [];
      const subKeys = Object.keys(c.mix);
      for (let j = 0; j < subKeys.length; j++) {
        const sub = subKeys[j];
        const w = c.mix[sub];
        const contrib = (subScores[sub] || 0) * (w / 100);
        s += contrib;
        breakdown.push({ sub: sub, weight: w, subScore: subScores[sub] || 0, contribution: contrib });
      }
      breakdown.sort(function(a, b) { return Math.abs(b.contribution) - Math.abs(a.contribution); });
      const traj = trajectory(c.caps);
      out.push({ tkr: c.tkr, name: c.name, region: c.region, mix: c.mix, caps: c.caps, score: Math.round(s), breakdown: breakdown, trajectory: traj });
    }
    out.sort(function(a, b) { return b.score - a.score; });
    return out;
  }, [subScores]);

  const intensity = useMemo(function() {
    let sum = 0;
    const keys = Object.keys(assumptions);
    for (let i = 0; i < keys.length; i++) sum += assumptions[keys[i]];
    return Math.round(sum / ASSUMPTIONS.length);
  }, [assumptions]);

  const totalTraj = useMemo(function() {
    const r = [];
    for (let i = 0; i < 37; i++) r.push(0);
    for (let i = 0; i < companyData.length; i++) {
      const t = companyData[i].trajectory;
      for (let j = 0; j < t.length; j++) r[j] += t[j];
    }
    return r;
  }, [companyData]);

  const avgScore = useMemo(function() {
    let s = 0;
    for (let i = 0; i < companyData.length; i++) s += companyData[i].score;
    return s / companyData.length;
  }, [companyData]);

  const coverage = useMemo(function() {
    let total = 0;
    for (let i = 0; i < companyData.length; i++) total += companyData[i].trajectory[36];
    const byReg = { US: 0, EU: 0, Asia: 0, Private: 0 };
    for (let i = 0; i < companyData.length; i++) {
      const c = companyData[i];
      byReg[c.region] = (byReg[c.region] || 0) + c.trajectory[36];
    }
    const regional = {};
    const rKeys = Object.keys(byReg);
    for (let i = 0; i < rKeys.length; i++) {
      const r = rKeys[i];
      regional[r] = { tracked: byReg[r], pct: (byReg[r] / GLOBAL_BY_REGION[r]) * 100, share: (byReg[r] / total) * 100 };
    }
    const shares = [];
    for (let i = 0; i < companyData.length; i++) shares.push((companyData[i].trajectory[36] / total) * 100);
    const sorted = shares.slice().sort(function(a, b) { return b - a; });
    let top5 = 0;
    for (let i = 0; i < 5 && i < sorted.length; i++) top5 += sorted[i];
    let top10 = 0;
    for (let i = 0; i < 10 && i < sorted.length; i++) top10 += sorted[i];
    const sortedComp = companyData.slice().sort(function(a, b) { return b.trajectory[36] - a.trajectory[36]; });
    const biggest = sortedComp[0];
    const subCov = {};
    const sKeys = Object.keys(SUBS);
    for (let i = 0; i < sKeys.length; i++) {
      const sub = sKeys[i];
      let count = 0;
      let weighted = 0;
      for (let j = 0; j < companyData.length; j++) {
        const c = companyData[j];
        if (c.mix[sub] > 0) {
          count++;
          weighted += (c.mix[sub] / 100) * c.trajectory[36];
        }
      }
      subCov[sub] = { count: count, cap: weighted };
    }
    return { total: total, coveragePct: (total / GLOBAL_TOTAL) * 100, regional: regional, top5: top5, top10: top10, biggest: biggest, subCov: subCov };
  }, [companyData]);

  function evaluateScenario(vals) {
    const norm = {};
    const keys = Object.keys(vals);
    for (let i = 0; i < keys.length; i++) norm[keys[i]] = (vals[keys[i]] - 50) / 50;
    const subs = {};
    const subKeys = Object.keys(SENS);
    for (let i = 0; i < subKeys.length; i++) {
      const sub = subKeys[i];
      const sens = SENS[sub];
      let s = 0;
      const aKeys = Object.keys(sens);
      for (let j = 0; j < aKeys.length; j++) s += sens[aKeys[j]] * (norm[aKeys[j]] || 0);
      subs[sub] = Math.round(s / 12);
    }
    const comps = [];
    for (let i = 0; i < COMPANIES.length; i++) {
      const c = COMPANIES[i];
      let s = 0;
      const mKeys = Object.keys(c.mix);
      for (let j = 0; j < mKeys.length; j++) s += (subs[mKeys[j]] || 0) * (c.mix[mKeys[j]] / 100);
      comps.push({ tkr: c.tkr, name: c.name, score: Math.round(s) });
    }
    let avg = 0;
    for (let i = 0; i < comps.length; i++) avg += comps[i].score;
    avg = avg / comps.length;
    let intSum = 0;
    const vKeys = Object.keys(vals);
    for (let i = 0; i < vKeys.length; i++) intSum += vals[vKeys[i]];
    return { subs: subs, comps: comps, avg: avg, intensity: Math.round(intSum / ASSUMPTIONS.length) };
  }

  const scenResults = useMemo(function() {
    const r = {};
    for (let i = 0; i < scenarios.length; i++) r[scenarios[i].id] = evaluateScenario(scenarios[i].values);
    return r;
  }, [scenarios]);

  function sc(s) {
    if (s >= 25) return "#22c55e";
    if (s >= 8) return "#84cc16";
    if (s >= -8) return "#a8a29e";
    if (s >= -25) return "#f59e0b";
    return "#dc2626";
  }

  function fmt(v) {
    if (v >= 1000) return "$" + (v / 1000).toFixed(2) + "T";
    return "$" + v.toFixed(0) + "B";
  }

  let selCo = companyData[0];
  for (let i = 0; i < companyData.length; i++) {
    if ((companyData[i].tkr + ":" + companyData[i].name) === selectedCompany) {
      selCo = companyData[i];
      break;
    }
  }

  let evCo = null;
  if (evidencePanel) {
    for (let i = 0; i < ASSUMPTIONS.length; i++) {
      if (ASSUMPTIONS[i].id === evidencePanel) { evCo = ASSUMPTIONS[i]; break; }
    }
  }

  const grouped = {
    Prevention: [], Chronic: [], Oncology: [], Delivery: [], AI: [], Regulatory: []
  };
  for (let i = 0; i < ASSUMPTIONS.length; i++) grouped[ASSUMPTIONS[i].group].push(ASSUMPTIONS[i]);

  function Radar(props) {
    const axes = props.axes;
    const values = props.values;
    const max = props.max || 100;
    const size = props.size || 320;
    const color = props.color || "#eab308";
    const neg = !!props.neg;
    const cx = size / 2;
    const cy = size / 2;
    const R = size * 0.34;
    const n = axes.length;
    
    const ringPolys = [];
    const rings = [0.25, 0.5, 0.75, 1];
    for (let r = 0; r < rings.length; r++) {
      const pts = [];
      for (let i = 0; i < n; i++) {
        const a = (Math.PI * 2 * i) / n - Math.PI / 2;
        pts.push((cx + Math.cos(a) * R * rings[r]) + "," + (cy + Math.sin(a) * R * rings[r]));
      }
      ringPolys.push(pts.join(" "));
    }
    
    let zeroPoly = "";
    if (neg) {
      const pts = [];
      for (let i = 0; i < n; i++) {
        const a = (Math.PI * 2 * i) / n - Math.PI / 2;
        pts.push((cx + Math.cos(a) * R * 0.5) + "," + (cy + Math.sin(a) * R * 0.5));
      }
      zeroPoly = pts.join(" ");
    }
    
    const dataPts = [];
    const circles = [];
    for (let i = 0; i < values.length; i++) {
      const v = values[i];
      const a = (Math.PI * 2 * i) / n - Math.PI / 2;
      const norm = neg ? (v + max) / (max * 2) : v / max;
      const r = Math.max(0, Math.min(1, norm)) * R;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      dataPts.push(x + "," + y);
      circles.push({ x: x, y: y });
    }
    
    return (
      <svg width={size} height={size} style={{ overflow: "visible" }}>
        {ringPolys.map(function(p, i) { return <polygon key={i} points={p} fill="none" stroke="rgba(255,255,255,0.08)" />; })}
        {neg && <polygon points={zeroPoly} fill="none" stroke="rgba(255,255,255,0.22)" strokeDasharray="2,3" />}
        {axes.map(function(_, i) {
          const a = (Math.PI * 2 * i) / n - Math.PI / 2;
          return <line key={i} x1={cx} y1={cy} x2={cx + Math.cos(a) * R} y2={cy + Math.sin(a) * R} stroke="rgba(255,255,255,0.08)" />;
        })}
        <polygon points={dataPts.join(" ")} fill={color} fillOpacity="0.15" stroke={color} strokeWidth="2" />
        {circles.map(function(c, i) { return <circle key={i} cx={c.x} cy={c.y} r="3" fill={color} />; })}
        {axes.map(function(lbl, i) {
          const a = (Math.PI * 2 * i) / n - Math.PI / 2;
          const x = cx + Math.cos(a) * (R + 16);
          const y = cy + Math.sin(a) * (R + 16);
          const ta = Math.abs(Math.cos(a)) < 0.3 ? "middle" : (Math.cos(a) > 0 ? "start" : "end");
          const shown = lbl.length > 20 ? lbl.slice(0, 18) + "..." : lbl;
          return <text key={i} x={x} y={y} fill="#d6d3d1" fontSize="9" textAnchor={ta} dominantBaseline="middle" fontFamily="monospace">{shown}</text>;
        })}
      </svg>
    );
  }

  function renderSlider(a) {
    return (
      <div key={a.id} style={{ marginBottom: 10, padding: "10px 12px", background: "rgba(255,255,255,0.02)", borderRadius: 6, borderLeft: "2px solid " + a.color }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <button onClick={function() { setEvidencePanel(a.id); }} style={{ background: "transparent", border: "none", color: "#fafaf9", fontSize: 12, fontWeight: 500, padding: 0, cursor: "pointer", textAlign: "left", flex: 1, fontFamily: "inherit", borderBottom: "1px dotted rgba(234,179,8,0.3)" }}>
            {a.label} <span style={{ color: a.color, fontSize: 10, opacity: 0.6 }}>{"▸"}</span>
          </button>
          <div style={{ fontSize: 13, fontWeight: 600, color: a.color, fontFamily: "monospace" }}>{assumptions[a.id]}</div>
        </div>
        <div style={{ fontSize: 10, color: "#a8a29e", marginBottom: 8, lineHeight: 1.4 }}>{a.desc}</div>
        <input type="range" min="0" max="100" value={assumptions[a.id]} onChange={function(e) { setAssumptions(updateAssumption(assumptions, a.id, parseInt(e.target.value))); }} style={{ width: "100%", accentColor: a.color }} />
      </div>
    );
  }

  const filteredCompanies = regionFilter === "all" ? companyData : companyData.filter(function(c) { return c.region === regionFilter; });

  return (
    <div style={{ minHeight: "100vh", background: "#0c0a09", color: "#fafaf9", fontFamily: "Georgia, serif" }}>
      <style>{".m { font-family: ui-monospace, monospace; } input[type='range'] { -webkit-appearance: none; height: 2px; background: rgba(255,255,255,0.1); outline: none; border-radius: 2px; } input[type='range']::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; background: #eab308; border-radius: 50%; cursor: pointer; } * { box-sizing: border-box; } body { margin: 0; }"}</style>

      {evidencePanel && evCo && (
        <div onClick={function() { setEvidencePanel(null); }} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.75)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
          <div onClick={function(e) { e.stopPropagation(); }} style={{ background: "#1c1917", borderRadius: 12, border: "1px solid " + evCo.color + "44", maxWidth: 920, maxHeight: "85vh", width: "100%", overflow: "auto" }}>
            <div style={{ padding: "24px 28px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <div className="m" style={{ fontSize: 10, color: evCo.color, letterSpacing: "0.15em" }}>ASSUMPTION · {evCo.group.toUpperCase()}</div>
                  <h2 style={{ fontSize: 28, fontWeight: 400, margin: "4px 0 0 0" }}>{evCo.label}</h2>
                  <div style={{ fontSize: 13, color: "#a8a29e", marginTop: 4 }}>{evCo.desc}</div>
                </div>
                <button onClick={function() { setEvidencePanel(null); }} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#a8a29e", padding: "8px 14px", cursor: "pointer", borderRadius: 6 }}>{"✕"}</button>
              </div>
            </div>
            <div style={{ padding: "24px 28px" }}>
              <div style={{ padding: "16px 18px", background: evCo.color + "0d", borderLeft: "3px solid " + evCo.color, borderRadius: "0 8px 8px 0", marginBottom: 20, fontSize: 14, lineHeight: 1.6, fontStyle: "italic", color: "#d6d3d1" }}>{evCo.thesis}</div>
              <div style={{ marginBottom: 20, padding: 14, background: "rgba(255,255,255,0.02)", borderRadius: 8 }}>
                <div className="m" style={{ fontSize: 10, color: evCo.color, marginBottom: 8 }}>ADJUST CONVICTION · {assumptions[evCo.id]}</div>
                <input type="range" min="0" max="100" value={assumptions[evCo.id]} onChange={function(e) { setAssumptions(updateAssumption(assumptions, evCo.id, parseInt(e.target.value))); }} style={{ width: "100%", accentColor: evCo.color }} />
              </div>
              <div className="m" style={{ fontSize: 10, color: "#78716c", letterSpacing: "0.15em", marginBottom: 10 }}>▸ CATALYSTS</div>
              {evCo.catalysts.map(function(c, i) {
                return (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: 14, padding: "10px 14px", marginBottom: 4, background: "rgba(255,255,255,0.02)", borderLeft: "2px solid " + evCo.color, borderRadius: "0 6px 6px 0" }}>
                    <div className="m" style={{ fontSize: 11, color: evCo.color }}>{c.date}</div>
                    <div style={{ fontSize: 13, color: "#d6d3d1" }}>{c.event}</div>
                  </div>
                );
              })}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 20 }}>
                <div>
                  <div className="m" style={{ fontSize: 10, color: "#22c55e", marginBottom: 10 }}>▲ SUPPORTING</div>
                  {evCo.pro.map(function(p, i) { return <div key={i} style={{ padding: "10px 14px", marginBottom: 4, background: "rgba(34,197,94,0.05)", borderLeft: "2px solid #22c55e", borderRadius: "0 6px 6px 0", fontSize: 12, color: "#d6d3d1", lineHeight: 1.5 }}>{p}</div>; })}
                </div>
                <div>
                  <div className="m" style={{ fontSize: 10, color: "#dc2626", marginBottom: 10 }}>▼ COUNTER-SIGNALS</div>
                  {evCo.con.map(function(p, i) { return <div key={i} style={{ padding: "10px 14px", marginBottom: 4, background: "rgba(220,38,38,0.05)", borderLeft: "2px solid #dc2626", borderRadius: "0 6px 6px 0", fontSize: 12, color: "#d6d3d1", lineHeight: 1.5 }}>{p}</div>; })}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 20 }}>
                <div style={{ padding: 14, background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.15)", borderRadius: 8 }}>
                  <div className="m" style={{ fontSize: 9, color: "#22c55e", marginBottom: 8 }}>WINNERS</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {evCo.winners.map(function(w, i) { return <span key={i} className="m" style={{ padding: "4px 10px", background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 4, fontSize: 11, color: "#22c55e" }}>{w}</span>; })}
                  </div>
                </div>
                <div style={{ padding: 14, background: "rgba(220,38,38,0.04)", border: "1px solid rgba(220,38,38,0.15)", borderRadius: 8 }}>
                  <div className="m" style={{ fontSize: 9, color: "#dc2626", marginBottom: 8 }}>CHALLENGED</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {evCo.losers.map(function(l, i) { return <span key={i} className="m" style={{ padding: "4px 10px", background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.3)", borderRadius: 4, fontSize: 11, color: "#dc2626" }}>{l}</span>; })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: "24px 40px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div className="m" style={{ fontSize: 10, letterSpacing: "0.2em", color: "#eab308", marginBottom: 8 }}>HEALTHCARE THESIS · 2026-2032</div>
            <h1 style={{ fontSize: 36, fontWeight: 400, margin: 0 }}>The <em style={{ color: "#eab308" }}>redistribution</em> of healthcare value</h1>
            <div style={{ fontSize: 13, color: "#a8a29e", marginTop: 10, maxWidth: 640 }}>12 assumptions to 22 sub-industries to {COMPANIES.length} companies.</div>
            <div style={{ display: "flex", gap: 6, marginTop: 14, alignItems: "center", flexWrap: "wrap" }}>
              <div className="m" style={{ fontSize: 9, color: "#78716c", letterSpacing: "0.15em" }}>SCENARIOS:</div>
              {scenarios.map(function(s) {
                return (
                  <button key={s.id} className="m" title="Click load - Shift-click delete" onClick={function(e) {
                    if (e.shiftKey && scenarios.length > 1) {
                      setScenarios(scenarios.filter(function(x) { return x.id !== s.id; }));
                      setCompareIds(compareIds.filter(function(id) { return id !== s.id; }));
                    } else {
                      setAssumptions(s.values);
                    }
                  }} style={{ padding: "4px 10px", background: s.color + "15", border: "1px solid " + s.color + "55", borderRadius: 4, color: s.color, fontSize: 9, letterSpacing: "0.12em", cursor: "pointer" }}>{s.label.toUpperCase()}</button>
                );
              })}
              <input type="text" value={saveLabel} onChange={function(e) { setSaveLabel(e.target.value); }} placeholder="Label" onKeyDown={function(e) {
                if (e.key === "Enter" && saveLabel.trim()) {
                  const id = Date.now() + "-" + saveLabel.slice(0, 8);
                  const cs = ["#eab308", "#22d3ee", "#a78bfa", "#ec4899", "#f59e0b", "#10b981"];
                  const vals = {};
                  const ks = Object.keys(assumptions);
                  for (let i = 0; i < ks.length; i++) vals[ks[i]] = assumptions[ks[i]];
                  const newScen = { id: id, label: saveLabel.trim(), color: cs[scenarios.length % cs.length], values: vals };
                  setScenarios(scenarios.concat([newScen]));
                  setCompareIds(compareIds.concat([id]).slice(-4));
                  setSaveLabel("");
                }
              }} style={{ padding: "3px 8px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, color: "#fafaf9", fontSize: 10, fontFamily: "monospace", width: 80, outline: "none" }} />
              <button className="m" onClick={function() {
                const r = {};
                for (let i = 0; i < ASSUMPTIONS.length; i++) r[ASSUMPTIONS[i].id] = 50;
                setAssumptions(r);
              }} style={{ padding: "4px 10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 4, color: "#78716c", fontSize: 9, letterSpacing: "0.12em", cursor: "pointer" }}>RESET</button>
            </div>
          </div>
          <div style={{ display: "flex", gap: 32, alignItems: "flex-end" }}>
            <div style={{ textAlign: "right" }}>
              <div className="m" style={{ fontSize: 9, color: "#78716c" }}>TOTAL</div>
              <div className="m" style={{ fontSize: 28, fontWeight: 300 }}>${(totalTraj[36] / 1000).toFixed(2)}T</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="m" style={{ fontSize: 9, color: "#78716c" }}>INTENSITY</div>
              <div className="m" style={{ fontSize: 44, fontWeight: 300, color: "#eab308" }}>{intensity}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="m" style={{ fontSize: 9, color: "#78716c" }}>AVG IMPACT</div>
              <div className="m" style={{ fontSize: 28, fontWeight: 300, color: sc(avgScore) }}>{avgScore > 0 ? "+" : ""}{avgScore.toFixed(1)}</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingLeft: 40 }}>
        {["overview", "redistribution", "compare", "sub-industries", "companies", "appendix"].map(function(t) {
          return <button key={t} className="m" onClick={function() { setActiveTab(t); }} style={{ padding: "14px 24px", background: "transparent", border: "none", borderBottom: activeTab === t ? "2px solid #eab308" : "2px solid transparent", color: activeTab === t ? "#eab308" : "#a8a29e", fontSize: 11, letterSpacing: "0.15em", cursor: "pointer" }}>{t.toUpperCase()}</button>;
        })}
      </div>

      {activeTab === "overview" && (
        <div style={{ padding: "24px 40px", overflow: "auto", maxHeight: "calc(100vh - 240px)" }}>
          <div style={{ marginBottom: 32 }}>
            <div className="m" style={{ fontSize: 10, color: "#78716c", marginBottom: 4 }}>01 · SECTOR SIZE</div>
            <h2 style={{ fontSize: 24, fontWeight: 400, margin: "0 0 14px 0" }}>The healthcare universe</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: 14, marginBottom: 20 }}>
              <div style={{ padding: 20, background: "rgba(234,179,8,0.06)", border: "1px solid rgba(234,179,8,0.2)", borderRadius: 10 }}>
                <div className="m" style={{ fontSize: 10, color: "#78716c", marginBottom: 6 }}>GLOBAL HEALTHCARE</div>
                <div className="m" style={{ fontSize: 36, fontWeight: 300, color: "#eab308" }}>$6.5T</div>
                <div style={{ fontSize: 11, color: "#a8a29e", marginTop: 6 }}>S&P Healthcare alone is ~$5T (13% of S&P 500).</div>
              </div>
              <div style={{ padding: 20, background: "rgba(255,255,255,0.03)", borderRadius: 10 }}>
                <div className="m" style={{ fontSize: 10, color: "#78716c", marginBottom: 6 }}>THIS MODEL</div>
                <div className="m" style={{ fontSize: 36, fontWeight: 300 }}>${(coverage.total / 1000).toFixed(2)}T</div>
                <div className="m" style={{ fontSize: 10, color: "#a8a29e", marginTop: 6 }}>{COMPANIES.length} companies - {coverage.coveragePct.toFixed(0)}%</div>
              </div>
              <div style={{ padding: 20, background: "rgba(255,255,255,0.03)", borderRadius: 10 }}>
                <div className="m" style={{ fontSize: 10, color: "#78716c", marginBottom: 6 }}>LARGEST</div>
                <div style={{ fontSize: 18 }}>{coverage.biggest.name}</div>
                <div className="m" style={{ fontSize: 24, color: "#eab308" }}>${coverage.biggest.trajectory[36].toFixed(0)}B</div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div style={{ padding: 20, background: "rgba(255,255,255,0.02)", borderRadius: 10 }}>
                <div className="m" style={{ fontSize: 10, color: "#eab308", marginBottom: 12 }}>▸ BY REGION</div>
                {Object.keys(coverage.regional).sort(function(a, b) { return coverage.regional[b].tracked - coverage.regional[a].tracked; }).map(function(r) {
                  const d = coverage.regional[r];
                  return (
                    <div key={r} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 12 }}>
                        <span>{r}</span>
                        <span className="m">${(d.tracked / 1000).toFixed(2)}T <span style={{ color: "#78716c" }}>({d.share.toFixed(0)}%)</span></span>
                      </div>
                      <div style={{ height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 3 }}>
                        <div style={{ width: d.share + "%", height: "100%", background: "#eab308", borderRadius: 3 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ padding: 20, background: "rgba(255,255,255,0.02)", borderRadius: 10 }}>
                <div className="m" style={{ fontSize: 10, color: "#eab308", marginBottom: 12 }}>▸ TOP 8 SUB-INDUSTRIES</div>
                {Object.keys(coverage.subCov).sort(function(a, b) { return coverage.subCov[b].cap - coverage.subCov[a].cap; }).slice(0, 8).map(function(id) {
                  const d = coverage.subCov[id];
                  const pct = (d.cap / coverage.total) * 100;
                  return (
                    <div key={id} style={{ marginBottom: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3, fontSize: 11 }}>
                        <span>{SUBS[id]}</span>
                        <span className="m">${d.cap.toFixed(0)}B <span style={{ color: "#78716c" }}>({pct.toFixed(1)}%)</span></span>
                      </div>
                      <div style={{ height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 2 }}>
                        <div style={{ width: (pct * 3) + "%", height: "100%", background: "#22d3ee", borderRadius: 2 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 32 }}>
            <div className="m" style={{ fontSize: 10, color: "#78716c", marginBottom: 4 }}>02 · CONTINUUM</div>
            <h2 style={{ fontSize: 24, fontWeight: 400, margin: "0 0 6px 0" }}>Where dollars sit and flow</h2>
            <div style={{ fontSize: 12, color: "#a8a29e", marginBottom: 14 }}>Box size = tracked cap. Red dotted = pressure. Hover to trace.</div>
            <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 12, padding: 20, overflowX: "auto" }}>
              <svg width="1400" height="700" style={{ display: "block" }}>
                {CONTINUUM_COLUMNS.map(function(col, i) {
                  const x = 40 + i * 272;
                  const c = COL_COLORS[i];
                  let total = 0;
                  for (let j = 0; j < col.subs.length; j++) {
                    if (coverage.subCov[col.subs[j]]) total += coverage.subCov[col.subs[j]].cap;
                  }
                  return (
                    <g key={col.id}>
                      <rect x={x} y={8} width={250} height={38} fill={c + "15"} rx="6" />
                      <text x={x + 125} y={24} fill={c} fontSize="11" fontFamily="monospace" textAnchor="middle" fontWeight="600">{col.label.toUpperCase()}</text>
                      <text x={x + 125} y={39} fill="#d6d3d1" fontSize="10" fontFamily="monospace" textAnchor="middle">{fmt(total)}</text>
                    </g>
                  );
                })}
                {CONNECTIONS.map(function(cn, i) {
                  let fC = -1, tC = -1;
                  for (let k = 0; k < CONTINUUM_COLUMNS.length; k++) {
                    if (CONTINUUM_COLUMNS[k].subs.indexOf(cn.from) >= 0) fC = k;
                    if (CONTINUUM_COLUMNS[k].subs.indexOf(cn.to) >= 0) tC = k;
                  }
                  if (fC < 0 || tC < 0) return null;
                  const fI = CONTINUUM_COLUMNS[fC].subs.indexOf(cn.from);
                  const tI = CONTINUUM_COLUMNS[tC].subs.indexOf(cn.to);
                  const fCap = coverage.subCov[cn.from] ? coverage.subCov[cn.from].cap : 0;
                  const tCap = coverage.subCov[cn.to] ? coverage.subCov[cn.to].cap : 0;
                  const w = Math.max(0.8, Math.min(3, Math.log10(fCap + tCap + 1) * 0.7));
                  const x1 = 40 + fC * 272 + 250;
                  const y1 = 68 + fI * 54 + 22;
                  const x2 = 40 + tC * 272;
                  const y2 = 68 + tI * 54 + 22;
                  const mx = (x1 + x2) / 2;
                  const path = "M " + x1 + " " + y1 + " Q " + mx + " " + y1 + ", " + mx + " " + ((y1 + y2) / 2) + " T " + x2 + " " + y2;
                  const hi = hoveredSub && (cn.from === hoveredSub || cn.to === hoveredSub);
                  const color = cn.type === "pressures" ? "#dc2626" : (hi ? "#eab308" : "rgba(168,162,158,0.25)");
                  const dash = cn.type === "pressures" ? "2,3" : (cn.type === "substitutes" ? "5,3" : "none");
                  const stroke = hi ? color : (hoveredSub ? "rgba(168,162,158,0.06)" : color);
                  const sw = hi ? w + 1 : w;
                  const op = hoveredSub && !hi ? 0.15 : 0.9;
                  return <path key={i} d={path} fill="none" stroke={stroke} strokeWidth={sw} strokeDasharray={dash} opacity={op} />;
                })}
                {CONTINUUM_COLUMNS.map(function(col, ci) {
                  const x = 40 + ci * 272;
                  const c = COL_COLORS[ci];
                  return col.subs.map(function(id, si) {
                    const y = 68 + si * 54;
                    const cap = coverage.subCov[id] ? coverage.subCov[id].cap : 0;
                    const ct = coverage.subCov[id] ? coverage.subCov[id].count : 0;
                    const hov = hoveredSub === id;
                    let conn = false;
                    if (hoveredSub) {
                      for (let i = 0; i < CONNECTIONS.length; i++) {
                        const cn = CONNECTIONS[i];
                        if ((cn.from === hoveredSub && cn.to === id) || (cn.to === hoveredSub && cn.from === id)) { conn = true; break; }
                      }
                    }
                    return (
                      <g key={id} style={{ cursor: "pointer" }} onMouseEnter={function() { setHoveredSub(id); }} onMouseLeave={function() { setHoveredSub(null); }} onClick={function() { setSelectedSub(id); setActiveTab("sub-industries"); }}>
                        <rect x={x} y={y} width={250} height={44} rx="6" fill={c + (hov ? "28" : "12")} stroke={hov || conn ? c : c + "55"} strokeWidth={hov ? 2.5 : 1.2} opacity={hoveredSub && !hov && !conn ? 0.3 : 1} />
                        <text x={x + 12} y={y + 16} fill="#fafaf9" fontSize="11" fontWeight="500">{SUBS[id]}</text>
                        <text x={x + 12} y={y + 32} fill={c} fontSize="13" fontFamily="monospace" fontWeight="600">{fmt(cap)}</text>
                        <text x={x + 240} y={y + 17} fill="#78716c" fontSize="9" fontFamily="monospace" textAnchor="end">{ct} co</text>
                      </g>
                    );
                  });
                })}
              </svg>
            </div>
          </div>

          <div>
            <div className="m" style={{ fontSize: 10, color: "#78716c", marginBottom: 4 }}>03 · COVERAGE</div>
            <h2 style={{ fontSize: 24, fontWeight: 400, margin: "0 0 14px 0" }}>What this model captures</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ padding: 20, background: "rgba(255,255,255,0.02)", borderRadius: 10 }}>
                <div className="m" style={{ fontSize: 10, color: "#eab308", marginBottom: 10 }}>▸ CONCENTRATION</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                  <div>
                    <div className="m" style={{ fontSize: 9, color: "#78716c" }}>TOP 5</div>
                    <div className="m" style={{ fontSize: 22, color: coverage.top5 > 50 ? "#f59e0b" : "#fafaf9" }}>{coverage.top5.toFixed(0)}%</div>
                  </div>
                  <div>
                    <div className="m" style={{ fontSize: 9, color: "#78716c" }}>TOP 10</div>
                    <div className="m" style={{ fontSize: 22 }}>{coverage.top10.toFixed(0)}%</div>
                  </div>
                </div>
                {companyData.slice().sort(function(a, b) { return b.trajectory[36] - a.trajectory[36]; }).slice(0, 6).map(function(c, i) {
                  const pct = (c.trajectory[36] / coverage.total) * 100;
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", fontSize: 11 }}>
                      <div className="m" style={{ color: "#78716c", minWidth: 18 }}>#{i + 1}</div>
                      <div style={{ flex: 1 }}>{c.name}</div>
                      <div className="m" style={{ color: "#a8a29e", minWidth: 48, textAlign: "right" }}>${c.trajectory[36].toFixed(0)}B</div>
                      <div className="m" style={{ fontSize: 10, minWidth: 36, textAlign: "right", color: "#eab308" }}>{pct.toFixed(1)}%</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ padding: 20, background: "rgba(255,255,255,0.02)", borderRadius: 10 }}>
                <div className="m" style={{ fontSize: 10, color: "#eab308", marginBottom: 10 }}>▸ BENCHMARKS (36MO RET)</div>
                {Object.keys(BENCHMARKS).map(function(id) {
                  const b = BENCHMARKS[id];
                  const ret = ((b.caps[3] - b.caps[0]) / b.caps[0]) * 100;
                  return (
                    <div key={id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 0", fontSize: 11 }}>
                      <div style={{ flex: 1 }}>{id} - {b.name}</div>
                      <div className="m" style={{ fontSize: 11, minWidth: 50, textAlign: "right", color: ret >= 0 ? "#22c55e" : "#dc2626" }}>{ret >= 0 ? "+" : ""}{ret.toFixed(0)}%</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "redistribution" && (
        <div style={{ display: "grid", gridTemplateColumns: "420px 1fr", minHeight: "calc(100vh - 240px)" }}>
          <div style={{ borderRight: "1px solid rgba(255,255,255,0.08)", padding: 20, overflow: "auto", maxHeight: "calc(100vh - 240px)" }}>
            <div className="m" style={{ fontSize: 10, color: "#eab308", marginBottom: 4 }}>12 ASSUMPTIONS · 2032</div>
            <div style={{ fontSize: 11, color: "#78716c", marginBottom: 14 }}>Click labels for evidence.</div>
            {Object.keys(grouped).map(function(g) {
              const items = grouped[g];
              if (items.length === 0) return null;
              return (
                <div key={g} style={{ marginBottom: 18 }}>
                  <div className="m" style={{ fontSize: 9, color: items[0].color, marginBottom: 8, paddingBottom: 4, borderBottom: "1px solid " + items[0].color + "33" }}>{g.toUpperCase()}</div>
                  {items.map(function(a) { return renderSlider(a); })}
                </div>
              );
            })}
          </div>
          <div style={{ padding: "24px 30px", overflow: "auto", maxHeight: "calc(100vh - 240px)" }}>
            <div className="m" style={{ fontSize: 10, color: "#78716c" }}>SECTOR REDISTRIBUTION · 2023 to 2032</div>
            <div style={{ fontSize: 18, marginBottom: 16 }}>How does total sector value redistribute?</div>
            {(function() {
              const g = (avgScore * 2) / 100;
              const cur = totalTraj[36];
              const future = [];
              for (let i = 0; i < 72; i++) future.push(cur * Math.pow(1 + g, (i + 1) / 12));
              const baseline = [];
              for (let i = 0; i < 72; i++) baseline.push(cur * Math.pow(1.05, (i + 1) / 12));
              const all = totalTraj.concat(future);
              const term = future[71];
              const W = 960, H = 240;
              const padL = 55, padR = 15, padT = 20, padB = 28;
              const cW = W - padL - padR, cH = H - padT - padB;
              const min = minOf(all) * 0.92;
              const max = maxOf(all) * 1.05;
              const xs = cW / (all.length - 1);
              function Y(v) { return padT + (1 - (v - min) / (max - min)) * cH; }
              let histPath = "";
              for (let i = 0; i < totalTraj.length; i++) histPath += (i === 0 ? "M " : "L ") + (padL + i * xs) + " " + Y(totalTraj[i]) + " ";
              let futPath = "M " + (padL + 36 * xs) + " " + Y(totalTraj[36]) + " ";
              for (let i = 0; i < future.length; i++) futPath += "L " + (padL + (37 + i) * xs) + " " + Y(future[i]) + " ";
              let basePath = "M " + (padL + 36 * xs) + " " + Y(totalTraj[36]) + " ";
              for (let i = 0; i < baseline.length; i++) basePath += "L " + (padL + (37 + i) * xs) + " " + Y(baseline[i]) + " ";
              const years = [2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032];
              return (
                <div style={{ background: "rgba(255,255,255,0.02)", padding: 22, borderRadius: 10, marginBottom: 24 }}>
                  <svg width="100%" height="240" viewBox={"0 0 " + W + " " + H} style={{ display: "block", maxWidth: "100%" }}>
                    {[0, 0.25, 0.5, 0.75, 1].map(function(f) { return <line key={f} x1={padL} y1={padT + f * cH} x2={W - padR} y2={padT + f * cH} stroke="rgba(255,255,255,0.04)" />; })}
                    {[0, 0.5, 1].map(function(f) { return <text key={f} x={padL - 8} y={padT + (1 - f) * cH} fill="#78716c" fontSize="9" fontFamily="monospace" textAnchor="end" dominantBaseline="middle">${((min + f * (max - min)) / 1000).toFixed(1)}T</text>; })}
                    {years.map(function(y, i) { return <text key={i} x={padL + i * 12 * xs} y={H - padB + 14} fill="#78716c" fontSize="9" fontFamily="monospace" textAnchor="middle">{y}</text>; })}
                    <line x1={padL + 36 * xs} y1={padT} x2={padL + 36 * xs} y2={H - padB} stroke="rgba(234,179,8,0.3)" strokeDasharray="3,3" />
                    <text x={padL + 36 * xs} y={padT - 5} fill="#eab308" fontSize="9" fontFamily="monospace" textAnchor="middle">TODAY</text>
                    <path d={basePath} fill="none" stroke="rgba(168,162,158,0.35)" strokeWidth="1.5" strokeDasharray="2,4" />
                    <path d={histPath} fill="none" stroke="#eab308" strokeWidth="2.5" />
                    <path d={futPath} fill="none" stroke={sc(avgScore)} strokeWidth="2.5" strokeDasharray="5,3" opacity="0.9" />
                  </svg>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <div><div className="m" style={{ fontSize: 9, color: "#78716c" }}>TODAY</div><div className="m" style={{ fontSize: 18, color: "#eab308" }}>${(cur / 1000).toFixed(2)}T</div></div>
                    <div><div className="m" style={{ fontSize: 9, color: "#78716c" }}>INTENSITY</div><div className="m" style={{ fontSize: 18 }}>{intensity}/100</div></div>
                    <div><div className="m" style={{ fontSize: 9, color: "#78716c" }}>CAGR</div><div className="m" style={{ fontSize: 18, color: sc(avgScore) }}>{g >= 0 ? "+" : ""}{(g * 100).toFixed(1)}%</div></div>
                    <div><div className="m" style={{ fontSize: 9, color: "#78716c" }}>2032</div><div className="m" style={{ fontSize: 18, color: sc(avgScore) }}>${(term / 1000).toFixed(2)}T</div></div>
                    <div><div className="m" style={{ fontSize: 9, color: "#78716c" }}>DELTA</div><div className="m" style={{ fontSize: 18, color: sc(avgScore) }}>{(term - cur) >= 0 ? "+" : ""}${((term - cur) / 1000).toFixed(2)}T</div></div>
                  </div>
                </div>
              );
            })()}
            <div style={{ marginBottom: 24 }}>
              <div className="m" style={{ fontSize: 10, color: "#eab308", marginBottom: 8 }}>▸ SUB-INDUSTRY REDISTRIBUTION · 2026 to 2032</div>
              <div style={{ background: "rgba(255,255,255,0.02)", padding: 16, borderRadius: 10 }}>
                {(function() {
                  const data = [];
                  const sKeys = Object.keys(SUBS);
                  for (let i = 0; i < sKeys.length; i++) {
                    const id = sKeys[i];
                    const cur = coverage.subCov[id] ? coverage.subCov[id].cap : 0;
                    const s = subScores[id] || 0;
                    const t = cur * Math.pow(1 + (s * 2) / 100, 6);
                    data.push({ id: id, name: SUBS[id], cur: cur, s: s, t: t, d: t - cur });
                  }
                  data.sort(function(a, b) { return b.d - a.d; });
                  const curArr = [], tArr = [];
                  for (let i = 0; i < data.length; i++) { curArr.push(data[i].cur); tArr.push(data[i].t); }
                  const scale = Math.max(maxOf(curArr), maxOf(tArr));
                  return data.filter(function(x) { return x.cur >= 5; }).map(function(x) {
                    const cw = (x.cur / scale) * 100;
                    const tw = (x.t / scale) * 100;
                    return (
                      <div key={x.id} style={{ marginBottom: 6, padding: "6px 8px", background: "rgba(0,0,0,0.2)", borderRadius: 4, display: "flex", alignItems: "center", gap: 10, fontSize: 11 }}>
                        <div style={{ width: 170 }}>{x.name}</div>
                        <div className="m" style={{ width: 60, color: "#78716c", textAlign: "right" }}>${x.cur.toFixed(0)}B</div>
                        <div style={{ flex: 1, height: 14, background: "rgba(255,255,255,0.04)", borderRadius: 2, position: "relative", overflow: "hidden" }}>
                          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: cw + "%", background: "rgba(234,179,8,0.5)" }} />
                          {x.t > x.cur ? <div style={{ position: "absolute", left: cw + "%", top: 0, bottom: 0, width: (tw - cw) + "%", background: sc(x.s), opacity: 0.7 }} /> : <div style={{ position: "absolute", left: tw + "%", top: 0, bottom: 0, width: (cw - tw) + "%", background: sc(x.s), opacity: 0.5 }} />}
                        </div>
                        <div className="m" style={{ width: 60, color: sc(x.s), textAlign: "right", fontWeight: 600 }}>${x.t.toFixed(0)}B</div>
                        <div className="m" style={{ width: 60, color: sc(x.s), textAlign: "right", fontSize: 10 }}>{x.d >= 0 ? "+" : ""}${x.d.toFixed(0)}B</div>
                        <div className="m" style={{ width: 40, color: sc(x.s), textAlign: "right", fontSize: 10 }}>{x.s > 0 ? "+" : ""}{x.s}</div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
            <div>
              <div className="m" style={{ fontSize: 10, color: "#eab308", marginBottom: 8 }}>▸ COMPANY IMPACT · 2032 TERMINAL</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <div className="m" style={{ fontSize: 10, color: "#22c55e", marginBottom: 8 }}>▲ TOP 10 WINNERS</div>
                  {companyData.slice(0, 10).map(function(c, i) {
                    const t = c.trajectory[36] * Math.pow(1 + (c.score * 2) / 100, 6);
                    return (
                      <button key={i} onClick={function() { setSelectedCompany(c.tkr + ":" + c.name); setActiveTab("companies"); }} style={{ width: "100%", padding: "10px 12px", marginBottom: 4, background: "rgba(34,197,94,0.05)", borderLeft: "2px solid #22c55e", border: "1px solid rgba(34,197,94,0.15)", borderRadius: "0 4px 4px 0", cursor: "pointer", textAlign: "left", fontFamily: "inherit", color: "#fafaf9" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <div style={{ fontSize: 12 }}><span className="m" style={{ fontSize: 10, color: "#78716c", marginRight: 8 }}>#{i + 1}</span>{c.name}</div>
                          <div className="m" style={{ fontSize: 12, fontWeight: 600, color: "#22c55e" }}>+{c.score}</div>
                        </div>
                        <div className="m" style={{ display: "flex", gap: 8, fontSize: 10 }}>
                          <span style={{ color: "#a8a29e" }}>${c.trajectory[36].toFixed(0)}B</span>
                          <span style={{ color: "#57534e" }}>→</span>
                          <span style={{ color: "#22c55e", fontWeight: 600 }}>${t.toFixed(0)}B</span>
                          <span style={{ color: "#22c55e", marginLeft: "auto" }}>+${(t - c.trajectory[36]).toFixed(0)}B</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div>
                  <div className="m" style={{ fontSize: 10, color: "#dc2626", marginBottom: 8 }}>▼ TOP 10 CHALLENGED</div>
                  {companyData.slice().reverse().slice(0, 10).map(function(c, i) {
                    const t = c.trajectory[36] * Math.pow(1 + (c.score * 2) / 100, 6);
                    return (
                      <button key={i} onClick={function() { setSelectedCompany(c.tkr + ":" + c.name); setActiveTab("companies"); }} style={{ width: "100%", padding: "10px 12px", marginBottom: 4, background: "rgba(220,38,38,0.05)", borderLeft: "2px solid #dc2626", border: "1px solid rgba(220,38,38,0.15)", borderRadius: "0 4px 4px 0", cursor: "pointer", textAlign: "left", fontFamily: "inherit", color: "#fafaf9" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <div style={{ fontSize: 12 }}><span className="m" style={{ fontSize: 10, color: "#78716c", marginRight: 8 }}>#{i + 1}</span>{c.name}</div>
                          <div className="m" style={{ fontSize: 12, fontWeight: 600, color: c.score < 0 ? "#dc2626" : "#a8a29e" }}>{c.score > 0 ? "+" : ""}{c.score}</div>
                        </div>
                        <div className="m" style={{ display: "flex", gap: 8, fontSize: 10 }}>
                          <span style={{ color: "#a8a29e" }}>${c.trajectory[36].toFixed(0)}B</span>
                          <span style={{ color: "#57534e" }}>→</span>
                          <span style={{ color: c.score < 0 ? "#dc2626" : "#a8a29e", fontWeight: 600 }}>${t.toFixed(0)}B</span>
                          <span style={{ color: c.score < 0 ? "#dc2626" : "#a8a29e", marginLeft: "auto" }}>{(t - c.trajectory[36]) >= 0 ? "+" : ""}${(t - c.trajectory[36]).toFixed(0)}B</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "compare" && (
        <div style={{ padding: "24px 40px", overflow: "auto", maxHeight: "calc(100vh - 240px)" }}>
          <h2 style={{ fontSize: 26, fontWeight: 400, margin: "0 0 6px 0" }}>Compare saved theses</h2>
          <div style={{ fontSize: 13, color: "#a8a29e", marginBottom: 20 }}>Save scenarios from the header (type label, hit enter).</div>
          <div style={{ padding: "14px 16px", background: "rgba(255,255,255,0.02)", borderRadius: 8, marginBottom: 20 }}>
            <div className="m" style={{ fontSize: 9, color: "#78716c", marginBottom: 8 }}>SELECT UP TO 4</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {scenarios.map(function(s) {
                const sel = compareIds.indexOf(s.id) >= 0;
                return (
                  <button key={s.id} className="m" onClick={function() {
                    if (sel) setCompareIds(compareIds.filter(function(id) { return id !== s.id; }));
                    else if (compareIds.length < 4) setCompareIds(compareIds.concat([s.id]));
                  }} style={{ padding: "6px 12px", background: sel ? s.color + "20" : "rgba(255,255,255,0.03)", border: "1px solid " + (sel ? s.color : "rgba(255,255,255,0.08)"), borderRadius: 4, color: sel ? s.color : "#a8a29e", fontSize: 10, cursor: "pointer" }}>{sel ? "✓ " : ""}{s.label.toUpperCase()}</button>
                );
              })}
            </div>
          </div>
          {compareIds.length < 2 ? (
            <div style={{ padding: 40, background: "rgba(255,255,255,0.02)", borderRadius: 8, textAlign: "center", color: "#78716c" }}>Select 2+ scenarios.</div>
          ) : (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(" + compareIds.length + ", 1fr)", gap: 12, marginBottom: 24 }}>
                {compareIds.map(function(id) {
                  let s = null;
                  for (let i = 0; i < scenarios.length; i++) if (scenarios[i].id === id) { s = scenarios[i]; break; }
                  const r = scenResults[id];
                  if (!s || !r) return null;
                  return (
                    <div key={id} style={{ padding: "16px 18px", background: s.color + "08", border: "1px solid " + s.color + "33", borderRadius: 8 }}>
                      <div className="m" style={{ fontSize: 10, color: s.color, marginBottom: 6 }}>{s.label.toUpperCase()}</div>
                      <div style={{ display: "flex", gap: 20 }}>
                        <div><div className="m" style={{ fontSize: 8, color: "#78716c" }}>INTENSITY</div><div className="m" style={{ fontSize: 22 }}>{r.intensity}</div></div>
                        <div><div className="m" style={{ fontSize: 8, color: "#78716c" }}>AVG</div><div className="m" style={{ fontSize: 22, color: sc(r.avg) }}>{r.avg > 0 ? "+" : ""}{r.avg.toFixed(1)}</div></div>
                      </div>
                      <button onClick={function() { setAssumptions(s.values); }} className="m" style={{ marginTop: 10, padding: "4px 10px", width: "100%", background: "transparent", border: "1px solid " + s.color + "44", borderRadius: 4, color: s.color, fontSize: 9, cursor: "pointer" }}>LOAD</button>
                    </div>
                  );
                })}
              </div>
              <div className="m" style={{ fontSize: 10, color: "#eab308", marginBottom: 10 }}>▸ COMPANIES · MAX SPREAD</div>
              <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 8, overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "60px 180px repeat(" + compareIds.length + ", 1fr) 60px", padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="m" style={{ fontSize: 9, color: "#78716c" }}>TICKER</div>
                  <div className="m" style={{ fontSize: 9, color: "#78716c" }}>COMPANY</div>
                  {compareIds.map(function(id) {
                    let s = null;
                    for (let i = 0; i < scenarios.length; i++) if (scenarios[i].id === id) { s = scenarios[i]; break; }
                    return <div key={id} className="m" style={{ fontSize: 9, color: s ? s.color : "#78716c", textAlign: "center" }}>{s ? s.label.toUpperCase() : ""}</div>;
                  })}
                  <div className="m" style={{ fontSize: 9, color: "#eab308", textAlign: "right" }}>SPREAD</div>
                </div>
                {(function() {
                  const rows = [];
                  for (let i = 0; i < COMPANIES.length; i++) {
                    const c = COMPANIES[i];
                    const scores = [];
                    for (let j = 0; j < compareIds.length; j++) {
                      const r = scenResults[compareIds[j]];
                      let found = null;
                      if (r) {
                        for (let k = 0; k < r.comps.length; k++) {
                          if (r.comps[k].tkr === c.tkr && r.comps[k].name === c.name) { found = r.comps[k]; break; }
                        }
                      }
                      scores.push(found ? found.score : 0);
                    }
                    const spread = maxOf(scores) - minOf(scores);
                    rows.push({ tkr: c.tkr, name: c.name, scores: scores, spread: spread });
                  }
                  rows.sort(function(a, b) { return b.spread - a.spread; });
                  return rows.slice(0, 18).map(function(c, i) {
                    return (
                      <div key={i} style={{ display: "grid", gridTemplateColumns: "60px 180px repeat(" + compareIds.length + ", 1fr) 60px", padding: "8px 16px", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                        <div className="m" style={{ fontSize: 10 }}>{c.tkr}</div>
                        <div style={{ fontSize: 12 }}>{c.name}</div>
                        {c.scores.map(function(s, j) { return <div key={j} className="m" style={{ fontSize: 13, fontWeight: 600, color: sc(s), textAlign: "center" }}>{s > 0 ? "+" : ""}{s}</div>; })}
                        <div className="m" style={{ fontSize: 12, color: "#eab308", textAlign: "right", fontWeight: 600 }}>{c.spread}</div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "sub-industries" && (
        <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", minHeight: "calc(100vh - 240px)" }}>
          <div style={{ borderRight: "1px solid rgba(255,255,255,0.08)", padding: 20, overflow: "auto", maxHeight: "calc(100vh - 240px)" }}>
            <div className="m" style={{ fontSize: 10, color: "#eab308", marginBottom: 12 }}>22 SUB-INDUSTRIES</div>
            {(function() {
              const arr = [];
              const ks = Object.keys(SUBS);
              for (let i = 0; i < ks.length; i++) arr.push({ id: ks[i], name: SUBS[ks[i]], s: subScores[ks[i]] || 0 });
              arr.sort(function(a, b) { return b.s - a.s; });
              return arr.map(function(x) {
                return (
                  <button key={x.id} onClick={function() { setSelectedSub(x.id); }} style={{ width: "100%", textAlign: "left", padding: "10px 12px", marginBottom: 3, background: selectedSub === x.id ? "rgba(234,179,8,0.1)" : "rgba(255,255,255,0.02)", border: "1px solid " + (selectedSub === x.id ? "#eab308" : "rgba(255,255,255,0.04)"), borderLeft: "3px solid " + sc(x.s), borderRadius: "0 4px 4px 0", color: "#fafaf9", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13 }}>{x.name}</span>
                    <span className="m" style={{ fontSize: 14, fontWeight: 600, color: sc(x.s) }}>{x.s > 0 ? "+" : ""}{x.s}</span>
                  </button>
                );
              });
            })()}
          </div>
          <div style={{ padding: "24px 30px", overflow: "auto", maxHeight: "calc(100vh - 240px)" }}>
            <h2 style={{ fontSize: 28, fontWeight: 400, margin: "4px 0 8px 0" }}>{SUBS[selectedSub]}</h2>
            <div style={{ display: "flex", gap: 32, marginBottom: 24 }}>
              <div><div className="m" style={{ fontSize: 9, color: "#78716c" }}>SCORE</div><div className="m" style={{ fontSize: 36, fontWeight: 600, color: sc(subScores[selectedSub]) }}>{subScores[selectedSub] > 0 ? "+" : ""}{subScores[selectedSub]}</div></div>
              <div><div className="m" style={{ fontSize: 9, color: "#78716c" }}>EXPOSED</div><div className="m" style={{ fontSize: 24 }}>{companyData.filter(function(c) { return c.mix[selectedSub] > 0; }).length}</div></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div style={{ background: "rgba(255,255,255,0.02)", padding: 20, borderRadius: 8 }}>
                <div className="m" style={{ fontSize: 10, color: "#eab308", marginBottom: 12 }}>SENSITIVITY TO 12 ASSUMPTIONS</div>
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <Radar axes={ASSUMPTIONS.map(function(a) { return a.label; })} values={ASSUMPTIONS.map(function(a) { return SENS[selectedSub][a.id]; })} max={100} size={340} neg={true} />
                </div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.02)", padding: 20, borderRadius: 8 }}>
                <div className="m" style={{ fontSize: 10, color: "#eab308", marginBottom: 12 }}>COMPANY EXPOSURE</div>
                {companyData.filter(function(c) { return c.mix[selectedSub] > 0; }).sort(function(a, b) { return b.mix[selectedSub] - a.mix[selectedSub]; }).slice(0, 14).map(function(c, i) {
                  return (
                    <div key={i} style={{ padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", justifyContent: "space-between" }}>
                      <div style={{ fontSize: 13 }}>{c.name}</div>
                      <div className="m" style={{ fontSize: 12, fontWeight: 600 }}>{c.mix[selectedSub]}%</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "companies" && (
        <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", minHeight: "calc(100vh - 240px)" }}>
          <div style={{ borderRight: "1px solid rgba(255,255,255,0.08)", padding: 20, overflow: "auto", maxHeight: "calc(100vh - 240px)" }}>
            <div className="m" style={{ fontSize: 10, color: "#eab308", marginBottom: 12 }}>{filteredCompanies.length} COMPANIES</div>
            <div style={{ display: "flex", gap: 4, marginBottom: 14, flexWrap: "wrap" }}>
              {[{ id: "all", l: "ALL" }, { id: "US", l: "US" }, { id: "EU", l: "EU" }, { id: "Asia", l: "ASIA" }, { id: "Private", l: "PRIV" }].map(function(r) {
                return <button key={r.id} onClick={function() { setRegionFilter(r.id); }} className="m" style={{ padding: "5px 10px", background: regionFilter === r.id ? "rgba(234,179,8,0.15)" : "rgba(255,255,255,0.04)", border: "1px solid " + (regionFilter === r.id ? "#eab308" : "rgba(255,255,255,0.08)"), borderRadius: 4, color: regionFilter === r.id ? "#eab308" : "#a8a29e", fontSize: 10, cursor: "pointer" }}>{r.l}</button>;
              })}
            </div>
            {filteredCompanies.map(function(c) {
              const id = c.tkr + ":" + c.name;
              const sel = selectedCompany === id;
              return (
                <button key={id} onClick={function() { setSelectedCompany(id); }} style={{ width: "100%", textAlign: "left", padding: "10px 12px", marginBottom: 3, background: sel ? "rgba(234,179,8,0.1)" : "rgba(255,255,255,0.02)", border: "1px solid " + (sel ? "#eab308" : "rgba(255,255,255,0.04)"), borderLeft: "3px solid " + sc(c.score), borderRadius: "0 4px 4px 0", color: "#fafaf9", cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <span className="m" style={{ fontSize: 10, fontWeight: 600 }}>{c.tkr}</span>
                        <span style={{ fontSize: 12 }}>{c.name}</span>
                      </div>
                      <div className="m" style={{ fontSize: 9, color: "#78716c", marginTop: 2 }}>${c.trajectory[36].toFixed(1)}B · {c.region}</div>
                    </div>
                    <div className="m" style={{ fontSize: 15, fontWeight: 600, color: sc(c.score) }}>{c.score > 0 ? "+" : ""}{c.score}</div>
                  </div>
                </button>
              );
            })}
          </div>
          <div style={{ padding: "24px 30px", overflow: "auto", maxHeight: "calc(100vh - 240px)" }}>
            <div className="m" style={{ fontSize: 10, color: "#78716c" }}>{selCo.region.toUpperCase()} · {selCo.tkr}</div>
            <h2 style={{ fontSize: 28, fontWeight: 400, margin: "4px 0 6px 0" }}>{selCo.name}</h2>
            {(function() {
              const intel = COMPANY_INTEL[selCo.tkr + ":" + selCo.name];
              if (!intel) return null;
              return (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ padding: "16px 18px", background: "rgba(255,255,255,0.02)", borderLeft: "3px solid #eab308", borderRadius: "0 8px 8px 0", marginBottom: 12 }}>
                    <div style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 10 }}>{intel.oneLiner}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <div>
                        <div className="m" style={{ fontSize: 9, color: "#22c55e", marginBottom: 4 }}>▸ REMARKABLE</div>
                        <div style={{ fontSize: 12, color: "#d6d3d1", lineHeight: 1.6 }}>{intel.remarkable}</div>
                      </div>
                      <div>
                        <div className="m" style={{ fontSize: 9, color: "#22d3ee", marginBottom: 4 }}>▸ NARRATIVE</div>
                        <div style={{ fontSize: 12, color: "#d6d3d1", lineHeight: 1.6 }}>{intel.narrative}</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div style={{ padding: "14px 16px", background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.15)", borderRadius: 8 }}>
                      <div className="m" style={{ fontSize: 9, color: "#22c55e", marginBottom: 8 }}>▲ TAILWINDS</div>
                      {intel.macroKey.length === 0 ? <div style={{ fontSize: 11, color: "#78716c", fontStyle: "italic" }}>No direct exposure.</div> : intel.macroKey.map(function(id) {
                        let a = null;
                        for (let i = 0; i < ASSUMPTIONS.length; i++) if (ASSUMPTIONS[i].id === id) { a = ASSUMPTIONS[i]; break; }
                        if (!a) return null;
                        return (
                          <button key={id} onClick={function() { setEvidencePanel(id); }} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", padding: "6px 10px", marginBottom: 4, background: "rgba(0,0,0,0.25)", border: "1px solid " + a.color + "33", borderRadius: 4, cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}>
                            <span style={{ fontSize: 11, color: "#d6d3d1" }}>{a.label}</span>
                            <span className="m" style={{ fontSize: 11, color: a.color, fontWeight: 600 }}>{assumptions[id]}</span>
                          </button>
                        );
                      })}
                    </div>
                    <div style={{ padding: "14px 16px", background: "rgba(220,38,38,0.04)", border: "1px solid rgba(220,38,38,0.15)", borderRadius: 8 }}>
                      <div className="m" style={{ fontSize: 9, color: "#dc2626", marginBottom: 8 }}>▼ HEADWINDS</div>
                      {intel.macroRisk.length === 0 ? <div style={{ fontSize: 11, color: "#78716c", fontStyle: "italic" }}>No direct exposure.</div> : intel.macroRisk.map(function(id) {
                        let a = null;
                        for (let i = 0; i < ASSUMPTIONS.length; i++) if (ASSUMPTIONS[i].id === id) { a = ASSUMPTIONS[i]; break; }
                        if (!a) return null;
                        return (
                          <button key={id} onClick={function() { setEvidencePanel(id); }} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", padding: "6px 10px", marginBottom: 4, background: "rgba(0,0,0,0.25)", border: "1px solid " + a.color + "33", borderRadius: 4, cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}>
                            <span style={{ fontSize: 11, color: "#d6d3d1" }}>{a.label}</span>
                            <span className="m" style={{ fontSize: 11, color: a.color, fontWeight: 600 }}>{assumptions[id]}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 20 }}>
              {["APR 23", "APR 24", "APR 25", "APR 26", "36M DELTA"].map(function(lbl, i) {
                const isT = i === 3;
                const isC = i === 4;
                const delta = (selCo.caps[3] >= selCo.caps[0] ? "+" : "") + ((selCo.caps[3] / selCo.caps[0] - 1) * 100).toFixed(0) + "%";
                const val = isC ? delta : "$" + selCo.caps[i].toFixed(1) + "B";
                const cellColor = isT ? "#eab308" : (isC ? (selCo.caps[3] >= selCo.caps[0] ? "#22c55e" : "#dc2626") : "#fafaf9");
                return (
                  <div key={i} style={{ padding: "10px 12px", background: isT ? "rgba(234,179,8,0.08)" : "rgba(255,255,255,0.03)", borderRadius: 6, border: isT ? "1px solid rgba(234,179,8,0.3)" : "none" }}>
                    <div className="m" style={{ fontSize: 9, color: isT ? "#eab308" : "#78716c" }}>{lbl}</div>
                    <div className="m" style={{ fontSize: 15, color: cellColor }}>{val}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ background: "rgba(255,255,255,0.02)", padding: 20, borderRadius: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <div className="m" style={{ fontSize: 10, color: "#eab308" }}>RADAR</div>
                <div style={{ display: "flex", gap: 4 }}>
                  {[{ id: "company", l: "REVENUE" }, { id: "subIndustry", l: "IMPACT" }].map(function(m) {
                    return <button key={m.id} onClick={function() { setRadarMode(m.id); }} className="m" style={{ padding: "5px 12px", background: radarMode === m.id ? "rgba(234,179,8,0.15)" : "rgba(255,255,255,0.04)", border: "1px solid " + (radarMode === m.id ? "#eab308" : "rgba(255,255,255,0.08)"), borderRadius: 4, color: radarMode === m.id ? "#eab308" : "#a8a29e", fontSize: 10, cursor: "pointer" }}>{m.l}</button>;
                  })}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div style={{ display: "flex", justifyContent: "center" }}>
                  {radarMode === "company" ? <Radar axes={Object.keys(selCo.mix).map(function(s) { return SUBS[s]; })} values={Object.keys(selCo.mix).map(function(s) { return selCo.mix[s]; })} max={100} size={320} /> : <Radar axes={selCo.breakdown.map(function(b) { return SUBS[b.sub]; })} values={selCo.breakdown.map(function(b) { return b.contribution; })} max={50} size={320} color={sc(selCo.score)} neg={true} />}
                </div>
                <div>
                  <div className="m" style={{ fontSize: 10, color: "#78716c", marginBottom: 10 }}>MIX → CONTRIBUTION</div>
                  {selCo.breakdown.map(function(b, i) {
                    return (
                      <div key={i} style={{ padding: "8px 10px", marginBottom: 4, background: "rgba(0,0,0,0.2)", borderRadius: 4, borderLeft: "2px solid " + sc(b.contribution * 10), display: "flex", justifyContent: "space-between" }}>
                        <div style={{ fontSize: 11 }}>{SUBS[b.sub]}</div>
                        <div style={{ display: "flex", gap: 10 }}>
                          <div className="m" style={{ fontSize: 10, color: "#78716c" }}>{b.weight}%</div>
                          <div className="m" style={{ fontSize: 12, fontWeight: 600, color: sc(b.contribution * 5) }}>{b.contribution > 0 ? "+" : ""}{b.contribution.toFixed(1)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "appendix" && (
        <div style={{ padding: "24px 40px", overflow: "auto", maxHeight: "calc(100vh - 240px)" }}>
          <h2 style={{ fontSize: 26, fontWeight: 400, margin: "0 0 6px 0" }}>Appendix · benchmarks</h2>
          <div style={{ fontSize: 13, color: "#a8a29e", marginBottom: 24 }}>Your basket vs major sector ETFs.</div>
          <div style={{ padding: 20, background: "rgba(255,255,255,0.02)", borderRadius: 8 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {Object.keys(BENCHMARKS).map(function(id) {
                const b = BENCHMARKS[id];
                const ret = ((b.caps[3] - b.caps[0]) / b.caps[0]) * 100;
                return (
                  <div key={id} style={{ padding: "10px 12px", background: "rgba(255,255,255,0.02)", borderRadius: 6, borderLeft: "3px solid " + b.color }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <div className="m" style={{ fontSize: 11, fontWeight: 600, color: b.color }}>{id}</div>
                      <div className="m" style={{ fontSize: 11, color: ret >= 0 ? "#22c55e" : "#dc2626" }}>{ret >= 0 ? "+" : ""}{ret.toFixed(0)}%</div>
                    </div>
                    <div style={{ fontSize: 11, marginTop: 3 }}>{b.name}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: "14px 40px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="m" style={{ fontSize: 9, color: "#57534e", letterSpacing: "0.08em" }}>Educational framework - not investment advice. Market cap anchors Apr 2026.</div>
      </div>
    </div>
  );
}
