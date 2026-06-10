import React, { useReducer, useEffect, useState, useRef, useMemo } from "react";

/* AI PRODUCT TYCOON v2.0 "Imperio Agéntico" - Jefe DSAI + PMO Lead */

const C = {
  bg: "#0c0a08", panel: "#1a1612", panel2: "#231c16", panel3: "#2b2218",
  border: "#3d2f1f", borderLight: "#5a4731",
  text: "#e8dcc4", muted: "#8a7c66", parchment: "#d4c39a",
  gold: "#c89b3c", goldLight: "#e8c674",
  crimson: "#8b1538", ember: "#d2693e",
  steel: "#7a8499", bronze: "#9c6b2a", jade: "#3d8b6e",
  blue: "#3a5e8c", green: "#4a6e3d", purple: "#5d3a6e", red: "#8b3a3a",
};
const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700;900&family=Crimson+Text:ital,wght@0,400;0,600;1,400&family=JetBrains+Mono:wght@400;500;700&family=VT323&display=swap');`;

const ERAS = [
  { id: 1, name: "Era I · Reportes", short: "Reportes", desc: "Excel, dashboards, BI.", color: C.steel, banner: "I", advanceCost: { budget: 0, knowledge: 0, vision: 0 } },
  { id: 2, name: "Era II · Predictiva", short: "Predictiva", desc: "ML clásico: propensión, forecast.", color: C.jade, banner: "II", advanceCost: { budget: 200, knowledge: 60, vision: 10 } },
  { id: 3, name: "Era III · GenAI", short: "GenAI", desc: "LLMs, copilotos, RAG.", color: C.purple, banner: "III", advanceCost: { budget: 500, knowledge: 180, vision: 25 } },
  { id: 4, name: "Era IV · Agéntica", short: "Agéntica", desc: "Agentes autónomos E2E.", color: C.crimson, banner: "IV", advanceCost: { budget: 1100, knowledge: 380, vision: 60 } },
];
const ROLES = {
  data_engineer: { label: "Data Engineer", short: "DE", color: C.blue, salary: 8, minEra: 1, desc: "+2 Cómputo/turno por nivel.", sprite: "worker", contrib: { compute: 2 } },
  data_scientist: { label: "Data Scientist", short: "DS", color: C.purple, salary: 10, minEra: 1, desc: "+15% velocidad analytics/predictive.", sprite: "scholar", contrib: { projectSpeed: 0.15, types: ["analytics", "predictive"] } },
  ml_engineer: { label: "ML Engineer", short: "MLE", color: C.jade, salary: 12, minEra: 2, desc: "Despliegue prod. -20% riesgo ML.", sprite: "engineer", contrib: { projectSpeed: 0.1, types: ["predictive", "genai"], risk: -0.2 } },
  product_manager: { label: "Product Manager", short: "PM", color: C.gold, salary: 11, minEra: 1, desc: "+1 confianza a los 3 más débiles.", sprite: "captain", contrib: { trustPerTurn: 1 } },
  domain_expert: { label: "Experto Dominio", short: "DOM", color: C.ember, salary: 9, minEra: 1, desc: "+1 conocimiento/turno.", sprite: "sage", contrib: { knowledge: 1, quality: 0.1 } },
  ai_engineer: { label: "AI Engineer", short: "AIE", color: C.crimson, salary: 14, minEra: 3, desc: "+20% velocidad GenAI/Agéntico.", sprite: "mage", contrib: { projectSpeed: 0.2, types: ["genai", "agentic"] } },
};
const BUILDINGS = {
  feature_store: { label: "Feature Store", building: "granary", cost: { budget: 100, knowledge: 25 }, minEra: 2, desc: "+25% velocidad predictive.", effects: { projectSpeed: { predictive: 0.25 } } },
  data_lake: { label: "Data Lake Unificado", building: "aqueduct", cost: { budget: 140, knowledge: 15 }, minEra: 1, desc: "+1 conocimiento y +1 cómputo/turno.", effects: { passive: { knowledge: 1, compute: 1 } } },
  ai_gateway: { label: "AI Gateway", building: "gatetower", cost: { budget: 240, knowledge: 70 }, minEra: 3, desc: "Requisito GenAI sin sanción.", effects: { gatesGenAI: true } },
  model_registry: { label: "Model Registry MLOps", building: "library", cost: { budget: 170, knowledge: 50 }, minEra: 2, desc: "-30% rework. -15% riesgo ML.", effects: { reworkDiscount: 0.3, risk: -0.15 } },
  war_room: { label: "War Room (RACI-IA)", building: "townhall", cost: { budget: 80, knowledge: 35 }, minEra: 1, desc: "+1 negociación. +2 capacidad. Stage gates.", effects: { negotiationsPerTurn: 1 } },
  agent_mesh: { label: "Agent Mesh Atlas", building: "castle", cost: { budget: 480, knowledge: 140, vision: 20 }, minEra: 4, desc: "Productividad +50%. Habilita agentes.", effects: { productivityMult: 1.5, gatesAgentic: true } },
};
const PROJECTS = [
  { id: "dash_tagrisso", name: "Dashboard Tagrisso", type: "analytics", minEra: 1, duration: 3, cost: { budget: 25, compute: 5 }, reward: { trust: { commercial: 12 }, budget: 50, knowledge: 8, vision: 1 }, risk: 0.05, rice: { r: 8, i: 5, c: 9, e: 2 }, desc: "Tablero táctico de pulmón." },
  { id: "rep_cuotas", name: "Reporte Cuotas Q", type: "analytics", minEra: 1, duration: 2, cost: { budget: 15, compute: 3 }, reward: { trust: { cfo: 14 }, budget: 35, knowledge: 5 }, risk: 0.05, rice: { r: 5, i: 4, c: 10, e: 1 }, desc: "Lo que el CFO espera." },
  { id: "compliance_hcp", name: "Compliance HCP", type: "analytics", minEra: 1, duration: 3, cost: { budget: 20, compute: 2 }, reward: { trust: { medical: 10, regulatory: 12 }, knowledge: 10, vision: 1 }, risk: 0.05, rice: { r: 4, i: 6, c: 9, e: 2 }, desc: "Auditoría interacciones HCP." },
  { id: "penetracion_hosp", name: "Penetración Hospital", type: "analytics", minEra: 1, duration: 4, cost: { budget: 35, compute: 6 }, reward: { trust: { commercial: 14 }, budget: 60, knowledge: 12, vision: 1 }, risk: 0.1, rice: { r: 9, i: 6, c: 8, e: 3 }, desc: "Dónde perdemos cuota." },
  { id: "voice_hcp", name: "Voice of HCP (NPS)", type: "analytics", minEra: 1, duration: 4, cost: { budget: 28, compute: 4 }, reward: { trust: { medical: 10, commercial: 8 }, knowledge: 14 }, risk: 0.08, rice: { r: 6, i: 5, c: 7, e: 3 }, desc: "Encuestas + sentimiento." },
  { id: "churn_hcp", name: "Modelo Churn HCP", type: "predictive", minEra: 2, duration: 5, cost: { budget: 70, compute: 30 }, reward: { trust: { commercial: 18, cfo: 8 }, budget: 120, knowledge: 24, vision: 2 }, risk: 0.15, rice: { r: 8, i: 8, c: 7, e: 5 }, desc: "Anticipa abandonos de marca." },
  { id: "seg_kols", name: "Segmentación KOLs", type: "predictive", minEra: 2, duration: 4, cost: { budget: 55, compute: 20 }, reward: { trust: { medical: 15, commercial: 8 }, knowledge: 22, vision: 2 }, risk: 0.12, rice: { r: 5, i: 7, c: 8, e: 4 }, desc: "Clustering de KOLs." },
  { id: "forecast_demanda", name: "Forecasting Oncológico", type: "predictive", minEra: 2, duration: 6, cost: { budget: 90, compute: 40 }, reward: { trust: { cfo: 22, executive: 8 }, budget: 160, knowledge: 30, vision: 3 }, risk: 0.2, rice: { r: 7, i: 9, c: 7, e: 6 }, stageGate: { atProgress: 3, stakeholder: "cfo" }, desc: "Predicción Q+1/Q+2." },
  { id: "switch_enhertu", name: "Switch a Enhertu", type: "predictive", minEra: 2, duration: 5, cost: { budget: 75, compute: 32 }, reward: { trust: { commercial: 24 }, budget: 140, knowledge: 24, vision: 2 }, risk: 0.18, rice: { r: 8, i: 9, c: 6, e: 5 }, desc: "HCPs con propensión a cambiar." },
  { id: "adverse_signal", name: "Señales Adversas RWE", type: "predictive", minEra: 2, duration: 6, cost: { budget: 100, compute: 38 }, reward: { trust: { medical: 24, regulatory: 18 }, knowledge: 32, vision: 3 }, risk: 0.22, rice: { r: 6, i: 9, c: 6, e: 6 }, stageGate: { atProgress: 3, stakeholder: "regulatory" }, desc: "RWE + signal detection." },
  { id: "copiloto_msl", name: "Copiloto MSL", type: "genai", minEra: 3, duration: 6, cost: { budget: 140, compute: 65 }, reward: { trust: { medical: 28, executive: 6 }, knowledge: 38, vision: 4 }, risk: 0.2, rice: { r: 7, i: 9, c: 7, e: 6 }, requiresBuilding: "ai_gateway", desc: "Asistente con evidencia clínica." },
  { id: "gen_promo", name: "Generador Promo", type: "genai", minEra: 3, duration: 5, cost: { budget: 115, compute: 55 }, reward: { trust: { commercial: 26 }, budget: 220, knowledge: 30, vision: 3 }, risk: 0.25, rice: { r: 9, i: 8, c: 6, e: 5 }, requiresBuilding: "ai_gateway", desc: "Drafts auto con review.", sideEffect: { trust: { regulatory: -6 } } },
  { id: "qa_pipeline", name: "Q&A Pipeline AZ", type: "genai", minEra: 3, duration: 7, cost: { budget: 175, compute: 75 }, reward: { trust: { executive: 24, medical: 10 }, knowledge: 44, vision: 5 }, risk: 0.2, rice: { r: 6, i: 10, c: 7, e: 7 }, stageGate: { atProgress: 4, stakeholder: "executive" }, requiresBuilding: "ai_gateway", desc: "Conversa sobre pipeline." },
  { id: "asistente_inv", name: "Asistente Investigador", type: "genai", minEra: 3, duration: 6, cost: { budget: 130, compute: 58 }, reward: { trust: { medical: 30 }, knowledge: 36, vision: 4 }, risk: 0.22, rice: { r: 6, i: 9, c: 6, e: 6 }, requiresBuilding: "ai_gateway", desc: "RAG protocolos clínicos." },
  { id: "intel_lit", name: "Inteligencia Literatura", type: "genai", minEra: 3, duration: 5, cost: { budget: 110, compute: 52 }, reward: { trust: { medical: 18, executive: 10 }, knowledge: 40 }, risk: 0.18, rice: { r: 7, i: 8, c: 7, e: 5 }, requiresBuilding: "ai_gateway", desc: "LLM monitoriza papers." },
  { id: "nba_agente", name: "Agente NBA Autónomo", type: "agentic", minEra: 4, duration: 7, cost: { budget: 240, compute: 120 }, reward: { trust: { commercial: 34, executive: 12 }, budget: 400, knowledge: 48, vision: 7 }, risk: 0.3, rice: { r: 9, i: 10, c: 6, e: 7 }, stageGate: { atProgress: 4, stakeholder: "regulatory" }, requiresBuilding: "agent_mesh", desc: "NBA ejecutado por agente." },
  { id: "ag_intel_comp", name: "Agente Inteligencia Comp.", type: "agentic", minEra: 4, duration: 6, cost: { budget: 200, compute: 100 }, reward: { trust: { executive: 30, commercial: 12 }, knowledge: 50, vision: 6 }, risk: 0.25, rice: { r: 7, i: 9, c: 7, e: 6 }, requiresBuilding: "agent_mesh", desc: "Monitoriza y resume al board." },
  { id: "agente_multi", name: "Multi-Agente KAMs E2E", type: "agentic", minEra: 4, duration: 9, cost: { budget: 310, compute: 155 }, reward: { trust: { commercial: 40, cfo: 14 }, budget: 540, knowledge: 60, vision: 9 }, risk: 0.32, rice: { r: 9, i: 10, c: 5, e: 9 }, stageGate: { atProgress: 5, stakeholder: "executive" }, requiresBuilding: "agent_mesh", desc: "Pre/durante/post-call auto." },
  { id: "atlas_mesh", name: "Atlas Mesh Portfolio", type: "agentic", minEra: 4, duration: 10, cost: { budget: 400, compute: 200 }, reward: { trust: { executive: 50, medical: 14, commercial: 14 }, knowledge: 90, vision: 14 }, risk: 0.35, rice: { r: 10, i: 10, c: 5, e: 10 }, stageGate: { atProgress: 5, stakeholder: "executive" }, requiresBuilding: "agent_mesh", desc: "Strategist+Investigator+Connector+Composer." },
];
const STAKEHOLDERS = {
  commercial: { label: "Comercial", short: "Com", color: C.gold, portrait: "merchant", desc: "Velocidad, ROI inmediato, NBA.", angry: "Filtran al board." },
  medical: { label: "Medical Affairs", short: "Med", color: C.jade, portrait: "healer", desc: "Rigor científico, evidencia.", angry: "Paran tu proyecto activo." },
  cfo: { label: "CFO", short: "Fin", color: C.bronze, portrait: "treasurer", desc: "ROI demostrable.", angry: "Recorte 25%." },
  it: { label: "IT/Seguridad", short: "IT", color: C.steel, portrait: "guard", desc: "Gobierno dato, EU AI Act.", angry: "Auditoría: 2 turnos perdidos." },
  executive: { label: "Comité Ejecutivo", short: "Exec", color: C.crimson, portrait: "king", desc: "Visión IA estratégica.", angry: "Game over si <20." },
  regulatory: { label: "Regulatorio", short: "Reg", color: C.purple, portrait: "judge", desc: "EU AI Act, GDPR.", angry: "Veta despliegues 3t." },
};
const PROGRAMS = [
  { id: "prog_datroway", name: "Lanzamiento Datroway 2026", minEra: 2, required: ["forecast_demanda", "seg_kols", "switch_enhertu", "dash_tagrisso"], desc: "Preparar lanzamiento.", reward: { trust: { commercial: 25, executive: 18, medical: 10 }, budget: 350, vision: 12 } },
  { id: "prog_nlp_medical", name: "Transformación NLP Medical", minEra: 3, required: ["copiloto_msl", "asistente_inv", "intel_lit"], desc: "Renovar Medical con GenAI E2E.", reward: { trust: { medical: 35, executive: 15 }, knowledge: 60, vision: 14 } },
  { id: "prog_compliance", name: "Compliance Reforzado", minEra: 1, required: ["compliance_hcp", "adverse_signal"], desc: "Robustecer frente regulatorio.", reward: { trust: { regulatory: 30, medical: 18, it: 12 }, budget: 200, vision: 10 } },
  { id: "prog_revenue_intel", name: "Revenue Intelligence", minEra: 2, required: ["churn_hcp", "switch_enhertu", "penetracion_hosp"], desc: "Inteligencia comercial integral.", reward: { trust: { commercial: 28, cfo: 20 }, budget: 280, vision: 10 } },
  { id: "prog_agentic_obu", name: "Plataforma Agéntica OBU", minEra: 4, required: ["nba_agente", "ag_intel_comp"], desc: "Base agéntica.", reward: { trust: { executive: 40, commercial: 20 }, knowledge: 70, vision: 18 } },
  { id: "prog_atlas", name: "Atlas Portafolio Agéntico", minEra: 4, required: ["atlas_mesh", "agente_multi"], desc: "Portafolio gestionado por agentes.", reward: { trust: { executive: 60, commercial: 25, medical: 15 }, budget: 700, vision: 28 } },
];
const OKR_TEMPLATES = {
  1: [{ id: "an3", label: "3 proyectos analíticos", target: 3, type: "completed_by_type", payload: "analytics" }, { id: "t50", label: "Stakeholders ≥50", target: 50, type: "trust_min_all" }, { id: "ts5", label: "Equipo a 5", target: 5, type: "team_size" }],
  2: [{ id: "e2", label: "Avanzar a Era II", target: 2, type: "era_reached" }, { id: "wr", label: "Construir War Room", target: "war_room", type: "building_built" }, { id: "ta55", label: "Confianza media ≥55", target: 55, type: "trust_avg" }],
  3: [{ id: "p2", label: "2 proyectos predictivos", target: 2, type: "completed_by_type", payload: "predictive" }, { id: "fs", label: "Feature Store", target: "feature_store", type: "building_built" }, { id: "k150", label: "Conocimiento 150", target: 150, type: "knowledge_total" }],
  4: [{ id: "e3", label: "Avanzar a Era III", target: 3, type: "era_reached" }, { id: "pg1", label: "1 programa", target: 1, type: "programs_completed" }, { id: "te70", label: "Confianza Exec ≥70", target: 70, type: "trust_specific", payload: "executive" }],
  5: [{ id: "ag", label: "AI Gateway", target: "ai_gateway", type: "building_built" }, { id: "g2", label: "2 proyectos GenAI", target: 2, type: "completed_by_type", payload: "genai" }, { id: "v50", label: "Visión 50", target: 50, type: "vision_total" }],
  6: [{ id: "e4", label: "Avanzar a Era IV", target: 4, type: "era_reached" }, { id: "am", label: "Agent Mesh", target: "agent_mesh", type: "building_built" }, { id: "pg2", label: "2 programas", target: 2, type: "programs_completed" }],
  7: [{ id: "ag2", label: "2 proyectos agénticos", target: 2, type: "completed_by_type", payload: "agentic" }, { id: "t60", label: "Stakeholders ≥60", target: 60, type: "trust_min_all" }, { id: "atl", label: "Completar Atlas", target: "atlas_mesh", type: "project_completed" }],
};
const RISK_TEMPLATES = [
  { id: "data_quality", label: "Calidad datos HCP en cuestión", impact: "+15% riesgo predictive", mitigationCost: { budget: 40 }, affects: { types: ["predictive"], risk: 0.15 } },
  { id: "key_person", label: "Dependencia persona clave", impact: "Si se va pierdes 1 turno", mitigationCost: { budget: 60 }, affects: {} },
  { id: "regulatory_drift", label: "Cambio regulatorio", impact: "+20% riesgo GenAI", mitigationCost: { budget: 70 }, affects: { types: ["genai", "agentic"], risk: 0.2 } },
  { id: "exec_distraction", label: "Atención ejecutiva dispersa", impact: "-1 Exec/turno", mitigationCost: { budget: 50 }, affects: { execDecay: 1 } },
  { id: "competitor_launch", label: "Competidor lanza primero", impact: "-1 Comercial/turno", mitigationCost: { budget: 60 }, affects: { commercialDecay: 1 } },
  { id: "shadow_it_drift", label: "Shadow IT externo", impact: "-1 IT/turno", mitigationCost: { budget: 45 }, affects: { itDecay: 1 } },
];
const DECISION_EVENTS = [
  { id: "nba_express", title: "NBA Express", minEra: 2, text: "Comercial quiere NBA en 2 sem sin validación.", options: [{ label: "Lanzar ya.", effects: { trust: { commercial: 18, medical: -16, regulatory: -14 }, budget: 60 } }, { label: "Bloquear hasta validación.", effects: { trust: { commercial: -12, medical: 12, regulatory: 14 } } }, { label: "Pilot 1 región.", effects: { trust: { commercial: 8, medical: 6, regulatory: 4 }, budget: 20, vision: 2 } }] },
  { id: "offshore_ml", title: "Offshoring ML", minEra: 2, text: "CFO propone offshoring para ahorrar 35%.", options: [{ label: "Aceptar.", effects: { trust: { cfo: 20, executive: -10 }, budget: 140, fireRole: "ml_engineer" } }, { label: "Rechazar y comprometer productividad.", effects: { trust: { cfo: -10, commercial: 6 }, vision: 3 } }, { label: "Híbrido.", effects: { trust: { cfo: 10, executive: 4 }, budget: 60, vision: 1 } }] },
  { id: "shadow_it", title: "Shadow IT en Comercial", minEra: 3, text: "Comercial usa ChatGPT con datos de pacientes.", options: [{ label: "Reportar a IT.", effects: { trust: { it: 18, regulatory: 16, commercial: -22 } } }, { label: "Bloquear y formar.", effects: { trust: { it: 8, commercial: 4, regulatory: -4 }, knowledge: 10 } }, { label: "Acelerar Copiloto interno.", effects: { trust: { it: 10, commercial: 12, regulatory: 6 }, budget: -50, vision: 4 } }] },
  { id: "data_rd", title: "R&D pide plataforma", minEra: 2, text: "I+D quiere usar Insight Explorer (30% bandwidth).", options: [{ label: "Colaborar.", effects: { trust: { executive: 14, medical: 10, commercial: -8 }, knowledge: 25, vision: 5 } }, { label: "Declinar.", effects: { trust: { executive: -10, commercial: 8 } } }, { label: "Slot semanal.", effects: { trust: { executive: 6, medical: 4, commercial: -2 }, knowledge: 10, vision: 2 } }] },
  { id: "build_buy", title: "Build vs Buy", minEra: 3, text: "Sales pide agéntico YA. Vendor 600k€ vs build 6 meses.", options: [{ label: "Comprar.", effects: { trust: { commercial: 18, cfo: -16, executive: -4 }, budget: -180 } }, { label: "Build interno.", effects: { trust: { commercial: -10, cfo: 12, executive: 10 }, knowledge: 30, vision: 6 } }, { label: "Híbrido.", effects: { trust: { commercial: 8, cfo: 4, executive: 8 }, budget: -80, vision: 3 } }] },
  { id: "eu_ai_act", title: "EU AI Act", minEra: 2, text: "Clasifica modelos. KOLs en zona gris.", options: [{ label: "Bajo riesgo y seguir.", effects: { trust: { regulatory: -22, commercial: 6 } } }, { label: "Pausar y documentar.", effects: { trust: { regulatory: 18, medical: 8, commercial: -8 }, pauseTurns: 2, vision: 2 } }, { label: "Consultoría regulatoria.", effects: { trust: { regulatory: 14, cfo: -8 }, budget: -90 } }] },
  { id: "talento_fuga", title: "Oferta FAANG", minEra: 1, text: "Tu mejor DS pide +40% o se va.", options: [{ label: "Igualar.", effects: { trust: { cfo: -10, executive: 4 }, budget: -100 } }, { label: "Dejarle ir.", effects: { trust: { cfo: 6, commercial: -8 }, fireRole: "data_scientist" } }, { label: "Contraoferta + proyecto estrella.", effects: { trust: { executive: 8, cfo: -4 }, budget: -50, knowledge: 10, vision: 3 } }] },
  { id: "board_demo", title: "Demo en el Board", minEra: 3, text: "CEO pide demo agéntica en 3 sem.", options: [{ label: "Mockup convincente.", effects: { trust: { executive: 22, commercial: 10, it: -8, regulatory: -6 } } }, { label: "Demo honesta.", effects: { trust: { executive: 4, it: 10, regulatory: 8 }, vision: 4 } }, { label: "Componente + roadmap.", effects: { trust: { executive: 14, it: 6, regulatory: 4 }, knowledge: 8, vision: 6 } }] },
  { id: "headcount_freeze", title: "Freeze Headcount", minEra: 1, text: "Corporativo congela contrataciones.", options: [{ label: "Aceptar.", effects: { trust: { cfo: 14, executive: 8 }, vision: 2 } }, { label: "Escalar al board.", effects: { trust: { cfo: -12, executive: 6 }, budget: 80 } }, { label: "Contractors.", effects: { trust: { cfo: -6, commercial: 8 }, budget: -120 } }] },
  { id: "audit", title: "Auditoría sorpresa", minEra: 2, text: "IT audita en 48h.", options: [{ label: "Cooperar al 100%.", effects: { trust: { it: 20, regulatory: 14 }, pauseTurns: 1 } }, { label: "Mínimo y seguir.", effects: { trust: { it: -10, regulatory: -8 } } }, { label: "Consultoría externa.", effects: { trust: { it: 12, regulatory: 10 }, budget: -60 } }] },
];
const RANDOM_EVENTS = [
  { text: "Partnership con hyperscaler. +40 cómputo.", apply: { compute: 40 } },
  { text: "Competidor lanzó GenAI antes.", apply: { trustAll: -6 } },
  { text: "Premio interno de innovación.", apply: { trust: { executive: 12 }, vision: 3 } },
  { text: "Recorte presupuestario.", apply: { budget: -50 } },
  { text: "Congreso oncológico inspira.", apply: { knowledge: 15 } },
  { text: "Data Lake cae 1 turno.", apply: { stallTurns: 1 } },
  { text: "Caso de éxito publicado.", apply: { trust: { commercial: 8, medical: 8 } } },
  { text: "Newsletter de IA viral.", apply: { vision: 5 } },
  { text: "Colaboración académica.", apply: { knowledge: 20 } },
];
const TURNS_PER_QUARTER = 12;
const initialState = {
  turn: 1, quarter: 1, year: 1, era: 1, paused: true, speed: 1,
  resources: { budget: 300, compute: 30, knowledge: 0, vision: 0 }, capacity: 6,
  team: [
    { id: "u1", role: "data_engineer", level: 1, status: "idle", projectId: null, trainingTurns: 0, allocation: 100, performance: 60, loyalty: 70 },
    { id: "u2", role: "data_scientist", level: 1, status: "idle", projectId: null, trainingTurns: 0, allocation: 100, performance: 60, loyalty: 70 },
    { id: "u3", role: "product_manager", level: 1, status: "idle", projectId: null, trainingTurns: 0, allocation: 100, performance: 60, loyalty: 70 },
    { id: "u4", role: "domain_expert", level: 1, status: "idle", projectId: null, trainingTurns: 0, allocation: 100, performance: 60, loyalty: 70 },
  ],
  buildings: [], activeProjects: [], completedProjects: [], completedPrograms: [],
  stakeholders: { commercial: { trust: 55 }, medical: { trust: 55 }, cfo: { trust: 55 }, it: { trust: 55 }, executive: { trust: 60 }, regulatory: { trust: 55 } },
  okrs: OKR_TEMPLATES[1].map((t) => ({ ...t, status: "open" })),
  pastOKRs: [], risks: [], pendingEvent: null, pendingQBR: null, pendingReviews: null,
  log: [{ turn: 0, text: "Aterrizas como Jefe de DSAI Comercial de la OBU." }],
  pauseTurns: 0, gameOver: null, gameOverReason: "", uidCounter: 5, negotiationsThisTurn: 0,
};

const clamp = (n, mn, mx) => Math.max(mn, Math.min(mx, n));
const fmt = (n) => Math.round(n).toLocaleString("es-ES");
const riceScore = (rc) => Math.round((rc.r * rc.i * (rc.c / 10)) / Math.max(1, rc.e) * 10) / 10;

function activeRiskEffects(state) {
  let extraRisk = {}, extraDecay = { executive: 0, commercial: 0, it: 0 };
  for (const r of state.risks) {
    if (r.mitigated) continue; const a = r.affects;
    if (a.types) for (const t of a.types) extraRisk[t] = (extraRisk[t] || 0) + a.risk;
    if (a.execDecay) extraDecay.executive += a.execDecay;
    if (a.commercialDecay) extraDecay.commercial += a.commercialDecay;
    if (a.itDecay) extraDecay.it += a.itDecay;
  }
  return { extraRisk, extraDecay };
}
function computeBuildingEffects(state) {
  let passive = { knowledge: 0, compute: 0 }, projSpeed = {}, negotiationsPerTurn = 0;
  let productivityMult = 1, gatesGenAI = false, gatesAgentic = false, reworkDiscount = 0, riskMod = 0;
  for (const id of state.buildings) {
    const b = BUILDINGS[id]; if (!b) continue;
    if (b.effects.passive) { passive.knowledge += b.effects.passive.knowledge || 0; passive.compute += b.effects.passive.compute || 0; }
    if (b.effects.projectSpeed) for (const t in b.effects.projectSpeed) projSpeed[t] = (projSpeed[t] || 0) + b.effects.projectSpeed[t];
    if (b.effects.negotiationsPerTurn) negotiationsPerTurn += b.effects.negotiationsPerTurn;
    if (b.effects.productivityMult) productivityMult = Math.max(productivityMult, b.effects.productivityMult);
    if (b.effects.gatesGenAI) gatesGenAI = true;
    if (b.effects.gatesAgentic) gatesAgentic = true;
    if (b.effects.reworkDiscount) reworkDiscount += b.effects.reworkDiscount;
    if (b.effects.risk) riskMod += b.effects.risk;
  }
  return { passive, projSpeed, negotiationsPerTurn, productivityMult, gatesGenAI, gatesAgentic, reworkDiscount, riskMod };
}
function computeTeamContrib(state) {
  let compute = 0, knowledge = 0, trustPerTurn = 0;
  for (const u of state.team) {
    if (u.status === "training") continue;
    const r = ROLES[u.role], alloc = (u.allocation || 100) / 100;
    if (r.contrib.compute) compute += r.contrib.compute * u.level * alloc;
    if (r.contrib.knowledge) knowledge += r.contrib.knowledge * u.level * alloc;
    if (r.contrib.trustPerTurn) trustPerTurn += r.contrib.trustPerTurn * u.level * alloc;
  }
  return { compute, knowledge, trustPerTurn };
}
function payroll(state) {
  let s = 0;
  for (const u of state.team) s += ROLES[u.role].salary * u.level * ((u.allocation || 100) / 100) * (u.loyalty > 80 ? 1.1 : 1);
  return s;
}
function computeProjectSpeed(state, project, eff, ap) {
  let base = 0.4;
  const assigned = state.team.filter((u) => u.projectId === project.id);
  for (const u of assigned) {
    const r = ROLES[u.role], alloc = (u.allocation || 100) / 100;
    let contrib = 0.5 * alloc;
    if (r.contrib.projectSpeed && (!r.contrib.types || r.contrib.types.includes(project.type))) contrib += r.contrib.projectSpeed * u.level * alloc;
    if (u.level === 3) contrib += 0.15;
    base += contrib;
  }
  if (eff.projSpeed[project.type]) base += eff.projSpeed[project.type];
  base *= eff.productivityMult;
  if (project.stageGate && ap.progress >= project.stageGate.atProgress && !ap.gateApproved) base = 0;
  return base;
}
function isOKRMet(okr, state) {
  switch (okr.type) {
    case "completed_by_type": return state.completedProjects.filter((id) => PROJECTS.find((p) => p.id === id)?.type === okr.payload).length >= okr.target;
    case "trust_min_all": return Object.values(state.stakeholders).every((s) => s.trust >= okr.target);
    case "trust_avg": return Object.values(state.stakeholders).reduce((a, b) => a + b.trust, 0) / 6 >= okr.target;
    case "trust_specific": return state.stakeholders[okr.payload].trust >= okr.target;
    case "team_size": return state.team.length >= okr.target;
    case "era_reached": return state.era >= okr.target;
    case "building_built": return state.buildings.includes(okr.target);
    case "knowledge_total": return state.resources.knowledge >= okr.target;
    case "vision_total": return state.resources.vision >= okr.target;
    case "programs_completed": return state.completedPrograms.length >= okr.target;
    case "project_completed": return state.completedProjects.includes(okr.target);
    default: return false;
  }
}
function okrProgress(okr, state) {
  switch (okr.type) {
    case "completed_by_type": return `${state.completedProjects.filter((id) => PROJECTS.find((p) => p.id === id)?.type === okr.payload).length}/${okr.target}`;
    case "trust_min_all": return `${Math.round(Math.min(...Object.values(state.stakeholders).map((s) => s.trust)))}/${okr.target}`;
    case "trust_avg": return `${Math.round(Object.values(state.stakeholders).reduce((a, b) => a + b.trust, 0) / 6)}/${okr.target}`;
    case "trust_specific": return `${Math.round(state.stakeholders[okr.payload].trust)}/${okr.target}`;
    case "team_size": return `${state.team.length}/${okr.target}`;
    case "era_reached": return `${state.era}/${okr.target}`;
    case "building_built": return state.buildings.includes(okr.target) ? "✓" : "—";
    case "knowledge_total": return `${fmt(state.resources.knowledge)}/${okr.target}`;
    case "vision_total": return `${fmt(state.resources.vision)}/${okr.target}`;
    case "programs_completed": return `${state.completedPrograms.length}/${okr.target}`;
    case "project_completed": return state.completedProjects.includes(okr.target) ? "✓" : "—";
    default: return "?";
  }
}
function generateOKRs(q) { return (OKR_TEMPLATES[q] || OKR_TEMPLATES[7]).map((x) => ({ ...x, status: "open" })); }
function prepend(log, turn, text) { return [{ turn, text }, ...log].slice(0, 80); }
function logIt(state, text) { return { ...state, log: prepend(state.log, state.turn, text) }; }
function applyEffects(state, effects) {
  let s = { ...state };
  if (effects.budget) s.resources = { ...s.resources, budget: s.resources.budget + effects.budget };
  if (effects.compute) s.resources = { ...s.resources, compute: Math.max(0, s.resources.compute + effects.compute) };
  if (effects.knowledge) s.resources = { ...s.resources, knowledge: Math.max(0, s.resources.knowledge + effects.knowledge) };
  if (effects.vision) s.resources = { ...s.resources, vision: Math.max(0, s.resources.vision + effects.vision) };
  if (effects.trust) { const sh = { ...s.stakeholders }; for (const k in effects.trust) if (sh[k]) sh[k] = { ...sh[k], trust: clamp(sh[k].trust + effects.trust[k], 0, 100) }; s.stakeholders = sh; }
  if (effects.trustAll) { const sh = { ...s.stakeholders }; for (const k in sh) sh[k] = { ...sh[k], trust: clamp(sh[k].trust + effects.trustAll, 0, 100) }; s.stakeholders = sh; }
  if (effects.pauseTurns) s.pauseTurns += effects.pauseTurns;
  if (effects.stallTurns) s.pauseTurns += effects.stallTurns;
  if (effects.fireRole) { const idx = s.team.findIndex((u) => u.role === effects.fireRole); if (idx >= 0) s.team = s.team.filter((u) => u.id !== s.team[idx].id); }
  return s;
}

function reducer(state, action) {
  if (state.gameOver && action.type !== "RESET") return state;
  switch (action.type) {
    case "TOGGLE_PAUSE": return { ...state, paused: !state.paused };
    case "SET_SPEED": return { ...state, speed: action.speed };
    case "HIRE": {
      const r = ROLES[action.role]; if (!r) return state;
      if (state.era < r.minEra) return logIt(state, "Era insuficiente.");
      if (state.team.length >= state.capacity) return logIt(state, "Sin capacidad. Construye War Room.");
      if (state.resources.budget < 80) return logIt(state, "Sin presupuesto (€80).");
      const id = "u" + state.uidCounter;
      return { ...state, uidCounter: state.uidCounter + 1, resources: { ...state.resources, budget: state.resources.budget - 80 }, team: [...state.team, { id, role: action.role, level: 1, status: "idle", projectId: null, trainingTurns: 0, allocation: 100, performance: 60, loyalty: 70 }], log: prepend(state.log, state.turn, `Contratado ${r.label} (€80).`) };
    }
    case "FIRE": { const u = state.team.find((x) => x.id === action.id); if (!u) return state; return { ...state, team: state.team.filter((x) => x.id !== action.id), log: prepend(state.log, state.turn, `Sale ${ROLES[u.role].label}.`) }; }
    case "TRAIN": {
      const u = state.team.find((x) => x.id === action.id); if (!u) return state;
      if (u.status !== "idle") return logIt(state, "Libéralo primero.");
      if (u.level >= 3) return logIt(state, "Ya es Lead.");
      if (state.resources.budget < 50) return logIt(state, "Sin presupuesto.");
      return { ...state, resources: { ...state.resources, budget: state.resources.budget - 50 }, team: state.team.map((x) => x.id === action.id ? { ...x, status: "training", trainingTurns: 4 } : x), log: prepend(state.log, state.turn, `Upskill: ${ROLES[u.role].label}.`) };
    }
    case "SET_ALLOCATION": return { ...state, team: state.team.map((x) => x.id === action.id ? { ...x, allocation: clamp(action.value, 25, 100) } : x) };
    case "BUILD": {
      const b = BUILDINGS[action.id]; if (!b || state.buildings.includes(action.id)) return state;
      if (state.era < b.minEra) return logIt(state, "Era insuficiente.");
      if (state.resources.budget < b.cost.budget) return logIt(state, "Sin presupuesto.");
      if (state.resources.knowledge < b.cost.knowledge) return logIt(state, "Sin conocimiento.");
      if (b.cost.vision && state.resources.vision < b.cost.vision) return logIt(state, "Sin visión.");
      const newCap = action.id === "war_room" ? state.capacity + 2 : state.capacity;
      return { ...state, capacity: newCap, resources: { ...state.resources, budget: state.resources.budget - b.cost.budget, knowledge: state.resources.knowledge - b.cost.knowledge, vision: state.resources.vision - (b.cost.vision || 0) }, buildings: [...state.buildings, action.id], log: prepend(state.log, state.turn, `Construido: ${b.label}.`) };
    }
    case "START_PROJECT": {
      const p = PROJECTS.find((x) => x.id === action.id); if (!p) return state;
      if (state.era < p.minEra) return logIt(state, "Era insuficiente.");
      if (state.activeProjects.find((ap) => ap.id === p.id) || state.completedProjects.includes(p.id)) return state;
      if (state.resources.budget < p.cost.budget) return logIt(state, "Sin presupuesto.");
      if (state.resources.compute < p.cost.compute) return logIt(state, "Sin cómputo.");
      if (p.requiresBuilding && !state.buildings.includes(p.requiresBuilding)) return logIt(state, `Requiere ${BUILDINGS[p.requiresBuilding].label}.`);
      return { ...state, resources: { ...state.resources, budget: state.resources.budget - p.cost.budget, compute: state.resources.compute - p.cost.compute }, activeProjects: [...state.activeProjects, { id: p.id, progress: 0, gateApproved: false, gateRequested: false }], log: prepend(state.log, state.turn, `Lanzado: ${p.name}.`) };
    }
    case "ASSIGN": {
      const u = state.team.find((x) => x.id === action.userId); if (!u || u.status === "training") return state;
      return { ...state, team: state.team.map((x) => x.id === action.userId ? { ...x, status: action.projectId ? "on_project" : "idle", projectId: action.projectId } : x) };
    }
    case "REQUEST_GATE": {
      const eff = computeBuildingEffects(state);
      if (state.negotiationsThisTurn >= 1 + eff.negotiationsPerTurn) return logIt(state, "Sin negociaciones.");
      if (!state.buildings.includes("war_room")) return logIt(state, "Necesitas War Room.");
      const ap = state.activeProjects.find((x) => x.id === action.projectId);
      const p = PROJECTS.find((x) => x.id === action.projectId);
      if (!ap || !p || !p.stageGate) return state;
      const sh = state.stakeholders[p.stageGate.stakeholder];
      const passes = sh.trust > 40 + Math.random() * 20;
      let s = { ...state, negotiationsThisTurn: state.negotiationsThisTurn + 1 };
      if (passes) { s.activeProjects = s.activeProjects.map((x) => x.id === action.projectId ? { ...x, gateApproved: true, gateRequested: true } : x); s = logIt(s, `✓ Gate aprobado por ${STAKEHOLDERS[p.stageGate.stakeholder].label}.`); }
      else { s.activeProjects = s.activeProjects.map((x) => x.id === action.projectId ? { ...x, gateRequested: true } : x); const sh2 = { ...s.stakeholders }; sh2[p.stageGate.stakeholder] = { ...sh2[p.stageGate.stakeholder], trust: clamp(sh2[p.stageGate.stakeholder].trust - 8, 0, 100) }; s.stakeholders = sh2; s = logIt(s, `✗ Gate rechazado. -8.`); }
      return s;
    }
    case "ADVANCE_ERA": {
      const next = ERAS.find((e) => e.id === state.era + 1); if (!next) return state;
      const c = next.advanceCost;
      if (state.resources.budget < c.budget || state.resources.knowledge < c.knowledge || (c.vision && state.resources.vision < c.vision)) return logIt(state, "Recursos insuficientes.");
      return { ...state, era: next.id, capacity: state.capacity + 2, resources: { ...state.resources, budget: state.resources.budget - c.budget, knowledge: state.resources.knowledge - c.knowledge, vision: state.resources.vision - (c.vision || 0) }, log: prepend(state.log, state.turn, `▲ ${next.name}.`) };
    }
    case "NEGOTIATE": {
      const eff = computeBuildingEffects(state);
      if (state.negotiationsThisTurn >= 1 + eff.negotiationsPerTurn) return logIt(state, "Sin negociaciones.");
      const sh = state.stakeholders[action.id]; if (!sh || state.resources.budget < 35) return logIt(state, "Sin presupuesto.");
      const gain = 12 + Math.floor(Math.random() * 8);
      return { ...state, negotiationsThisTurn: state.negotiationsThisTurn + 1, resources: { ...state.resources, budget: state.resources.budget - 35 }, stakeholders: { ...state.stakeholders, [action.id]: { ...sh, trust: clamp(sh.trust + gain, 0, 100) } }, log: prepend(state.log, state.turn, `Negociación ${STAKEHOLDERS[action.id].label}: +${gain}.`) };
    }
    case "MITIGATE_RISK": {
      const r = state.risks.find((x) => x.id === action.id); if (!r || r.mitigated) return state;
      const cost = r.mitigationCost.budget || 0;
      if (state.resources.budget < cost) return logIt(state, "Sin presupuesto.");
      return { ...state, resources: { ...state.resources, budget: state.resources.budget - cost }, risks: state.risks.map((x) => x.id === r.id ? { ...x, mitigated: true } : x), log: prepend(state.log, state.turn, `Riesgo mitigado: ${r.label}.`) };
    }
    case "RESOLVE_EVENT": { const ev = state.pendingEvent; if (!ev) return state; const opt = ev.options[action.optionIndex]; let s = { ...state, pendingEvent: null, paused: false }; s = applyEffects(s, opt.effects); return logIt(s, `Decisión: ${opt.label}`); }
    case "CLOSE_QBR": return { ...state, pendingQBR: null, paused: false };
    case "RESOLVE_REVIEWS": {
      let s = { ...state, pendingReviews: null, paused: false };
      const decisions = action.decisions; let team = [...s.team]; let bd = 0; const sh = { ...s.stakeholders };
      for (const uid in decisions) {
        const idx = team.findIndex((u) => u.id === uid); if (idx === -1) continue;
        const u = team[idx], d = decisions[uid];
        if (d === "promote" && u.level < 3) team[idx] = { ...u, level: u.level + 1, loyalty: clamp(u.loyalty + 15, 0, 100), performance: 70 };
        else if (d === "raise") { team[idx] = { ...u, loyalty: clamp(u.loyalty + 20, 0, 100), performance: 65 }; bd -= 40; }
        else if (d === "pip") { team[idx] = { ...u, loyalty: clamp(u.loyalty - 15, 0, 100), performance: u.performance - 5 }; sh.executive = { ...sh.executive, trust: clamp(sh.executive.trust + 2, 0, 100) }; }
        else if (d === "fire") { team = team.filter((x) => x.id !== uid); sh.cfo = { ...sh.cfo, trust: clamp(sh.cfo.trust + 4, 0, 100) }; }
      }
      s.team = team; s.stakeholders = sh; s.resources = { ...s.resources, budget: s.resources.budget + bd };
      return logIt(s, "Revisión de desempeño completada.");
    }
    case "TICK": return tick(state);
    case "RESET": return { ...initialState, log: [{ turn: 0, text: "Nueva partida." }] };
    default: return state;
  }
}

function tick(state) {
  let s = { ...state }; const eff = computeBuildingEffects(s), riskEff = activeRiskEffects(s);
  s.negotiationsThisTurn = 0;
  s.team = s.team.map((u) => {
    if (u.status === "training") { const t = u.trainingTurns - 1; if (t <= 0) return { ...u, status: "idle", trainingTurns: 0, level: Math.min(3, u.level + 1) }; return { ...u, trainingTurns: t }; }
    return u;
  });
  const stalled = s.pauseTurns > 0; if (stalled) s.pauseTurns -= 1;
  const teamC = computeTeamContrib(s); const pr = payroll(s);
  s.resources = { ...s.resources, budget: s.resources.budget - pr, compute: s.resources.compute + teamC.compute + eff.passive.compute, knowledge: s.resources.knowledge + teamC.knowledge + eff.passive.knowledge };
  if (teamC.trustPerTurn > 0) { const sh = { ...s.stakeholders }; const list = Object.entries(sh).sort((a, b) => a[1].trust - b[1].trust).slice(0, 3); for (const [k] of list) sh[k] = { ...sh[k], trust: clamp(sh[k].trust + teamC.trustPerTurn, 0, 100) }; s.stakeholders = sh; }
  if (!stalled) {
    const stillActive = [];
    for (const ap of s.activeProjects) {
      const p = PROJECTS.find((x) => x.id === ap.id); const speed = computeProjectSpeed(s, p, eff, ap); const newProgress = ap.progress + speed;
      if (newProgress >= p.duration) {
        const totalRisk = Math.max(0, p.risk + eff.riskMod + (riskEff.extraRisk[p.type] || 0));
        if (Math.random() < totalRisk) { s = logIt(s, `❌ ${p.name} falló.`); s.resources = { ...s.resources, budget: s.resources.budget - Math.floor(p.cost.budget * (1 - eff.reworkDiscount) * 0.4) }; }
        else {
          s = logIt(s, `✅ ${p.name} completado.`);
          if (p.reward.budget) s.resources = { ...s.resources, budget: s.resources.budget + p.reward.budget };
          if (p.reward.knowledge) s.resources = { ...s.resources, knowledge: s.resources.knowledge + p.reward.knowledge };
          if (p.reward.vision) s.resources = { ...s.resources, vision: s.resources.vision + p.reward.vision };
          if (p.reward.trust) { const sh = { ...s.stakeholders }; for (const k in p.reward.trust) sh[k] = { ...sh[k], trust: clamp(sh[k].trust + p.reward.trust[k], 0, 100) }; s.stakeholders = sh; }
          if (p.sideEffect?.trust) { const sh = { ...s.stakeholders }; for (const k in p.sideEffect.trust) sh[k] = { ...sh[k], trust: clamp(sh[k].trust + p.sideEffect.trust[k], 0, 100) }; s.stakeholders = sh; }
          s.completedProjects = [...s.completedProjects, p.id];
          for (const prog of PROGRAMS) { if (s.completedPrograms.includes(prog.id)) continue; if (prog.required.every((r) => s.completedProjects.includes(r))) { s.completedPrograms = [...s.completedPrograms, prog.id]; s = logIt(s, `🏆 PROGRAMA: ${prog.name}!`); s = applyEffects(s, prog.reward); } }
        }
        s.team = s.team.map((u) => u.projectId === p.id ? { ...u, status: "idle", projectId: null } : u);
      } else stillActive.push({ ...ap, progress: newProgress });
    }
    s.activeProjects = stillActive;
  }
  const sh = { ...s.stakeholders };
  for (const k in sh) {
    let drop = 1;
    if (k === "executive") drop += riskEff.extraDecay.executive;
    if (k === "commercial") drop += riskEff.extraDecay.commercial;
    if (k === "it") drop += riskEff.extraDecay.it;
    sh[k] = { ...sh[k], trust: clamp(sh[k].trust - drop, 0, 100) };
    if (sh[k].trust < 25 && Math.random() < 0.28) { s = applyAttack(s, k); sh[k] = { ...sh[k], trust: 30 }; }
  }
  s.stakeholders = sh;
  if (s.risks.length < 4 && Math.random() < 0.06) { const pool = RISK_TEMPLATES.filter((r) => !s.risks.find((x) => x.id === r.id)); if (pool.length) { const r = pool[Math.floor(Math.random() * pool.length)]; s.risks = [...s.risks, { ...r, mitigated: false }]; s = logIt(s, `⚠ Riesgo: ${r.label}.`); } }
  if (Math.random() < 0.1 && !s.pendingEvent) { const re = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)]; s = logIt(s, `📰 ${re.text}`); s = applyEffects(s, re.apply); }
  if (Math.random() < 0.09 && !s.pendingEvent && !s.pendingQBR && !s.pendingReviews) { const pool = DECISION_EVENTS.filter((e) => s.era >= e.minEra); if (pool.length) { s.pendingEvent = pool[Math.floor(Math.random() * pool.length)]; s.paused = true; s = logIt(s, `⚡ ${s.pendingEvent.title}.`); } }
  s.turn += 1;
  if (s.turn % TURNS_PER_QUARTER === 1 && s.turn > 1) {
    const newQuarter = s.quarter + 1;
    const evaluated = s.okrs.map((okr) => ({ ...okr, status: isOKRMet(okr, s) ? "met" : "missed" }));
    const metCount = evaluated.filter((o) => o.status === "met").length;
    const missedCount = evaluated.filter((o) => o.status === "missed").length;
    const sh2 = { ...s.stakeholders };
    sh2.executive = { ...sh2.executive, trust: clamp(sh2.executive.trust + (metCount - missedCount) * 4, 0, 100) };
    sh2.cfo = { ...sh2.cfo, trust: clamp(sh2.cfo.trust + (metCount - missedCount) * 2, 0, 100) };
    s.stakeholders = sh2;
    if (metCount >= 2) s.resources = { ...s.resources, vision: s.resources.vision + 6, budget: s.resources.budget + 80 };
    if (missedCount === 3) s.resources = { ...s.resources, budget: s.resources.budget - 60 };
    s.pastOKRs = [...s.pastOKRs, { quarter: s.quarter, year: s.year, results: evaluated }];
    s.okrs = generateOKRs(newQuarter);
    s.quarter = newQuarter;
    if (newQuarter > 4 && newQuarter % 4 === 1) s.year += 1;
    s.pendingQBR = { metCount, missedCount, oldOKRs: evaluated };
    s.pendingReviews = s.team.map((u) => u.id);
    s.paused = true;
  }
  if (s.resources.budget < -250) { s.gameOver = "lose"; s.gameOverReason = "Quiebra del equipo."; }
  else if (s.stakeholders.executive.trust < 20) { s.gameOver = "lose"; s.gameOverReason = "Comité Ejecutivo te ha cesado."; }
  const agenticDone = s.completedProjects.filter((id) => PROJECTS.find((p) => p.id === id)?.type === "agentic").length;
  if (s.era === 4 && agenticDone >= 2 && s.completedPrograms.length >= 3 && s.stakeholders.executive.trust >= 70) { s.gameOver = "win"; s.gameOverReason = "Operación agéntica consolidada."; }
  return s;
}
function applyAttack(s, key) {
  const sh = STAKEHOLDERS[key]; let msg = `🔥 ${sh.label}: ${sh.angry}`;
  switch (key) {
    case "cfo": s = { ...s, resources: { ...s.resources, budget: Math.floor(s.resources.budget * 0.75) } }; break;
    case "it": s = { ...s, pauseTurns: s.pauseTurns + 2 }; break;
    case "regulatory": s = { ...s, pauseTurns: s.pauseTurns + 3 }; break;
    case "medical": if (s.activeProjects.length) { s = { ...s, activeProjects: s.activeProjects.slice(1) }; msg += ` Paran proyecto.`; } break;
    case "commercial": s = { ...s, resources: { ...s.resources, compute: Math.floor(s.resources.compute * 0.6) } }; break;
  }
  return logIt(s, msg);
}

/* ============ SPRITES ============ */

function Sprite({ type, color = C.steel, size = 44, level = 1, animate = true }) {
  const s = size, isCav = level === 3;
  return (
    <div style={{ width: s, height: s * 1.35, position: "relative", display: "inline-block", animation: animate ? "bob 2.4s ease-in-out infinite" : "none" }}>
      <svg width={s} height={s * 1.35} viewBox="0 0 44 60">
        <ellipse cx="22" cy={isCav ? 56 : 54} rx={isCav ? 18 : 11} ry="2.5" fill="rgba(0,0,0,0.4)" />
        {isCav && <Horse color={color} />}
        {(() => {
          const oY = isCav ? -10 : 0;
          const map = { worker: Worker, scholar: Scholar, engineer: Engineer, captain: Captain, sage: Sage, mage: Mage };
          const Comp = map[type] || Worker;
          return <Comp color={color} oY={oY} />;
        })()}
        {level === 2 && <rect x="20" y="22" width="4" height="2" fill={C.goldLight} transform={`translate(0,${isCav ? -10 : 0})`} />}
        {level === 3 && <><rect x="18" y="22" width="3" height="2" fill={C.goldLight} transform="translate(0,-10)" /><rect x="23" y="22" width="3" height="2" fill={C.goldLight} transform="translate(0,-10)" /></>}
      </svg>
    </div>
  );
}
const Worker = ({ color, oY = 0 }) => (<g transform={`translate(0,${oY})`}>
  <rect x="15" y="26" width="14" height="16" fill={color} stroke={C.bg} strokeWidth="0.5" />
  <rect x="14" y="34" width="16" height="2" fill={C.bg} />
  <circle cx="22" cy="20" r="6" fill="#e8c39a" />
  <path d="M 15 18 Q 22 9 29 18 L 29 19 L 15 19 Z" fill={C.bronze} />
  <rect x="32" y="24" width="1.5" height="14" fill="#4a2a14" />
  <rect x="29" y="22" width="7" height="4" fill={C.steel} />
  <rect x="16" y="42" width="4" height="10" fill="#4a2a14" />
  <rect x="24" y="42" width="4" height="10" fill="#4a2a14" />
</g>);
const Scholar = ({ color, oY = 0 }) => (<g transform={`translate(0,${oY})`}>
  <path d="M 14 28 L 30 28 L 33 52 L 11 52 Z" fill={color} stroke={C.bg} strokeWidth="0.5" />
  <rect x="20" y="34" width="4" height="14" fill={C.goldLight} opacity="0.6" />
  <circle cx="22" cy="22" r="5.5" fill="#e8c39a" />
  <path d="M 16 22 Q 22 10 28 22 L 28 23 L 16 23 Z" fill={C.bg} stroke={color} strokeWidth="0.7" />
  <rect x="9" y="32" width="6" height="3" fill="#d4c39a" />
</g>);
const Engineer = ({ color, oY = 0 }) => (<g transform={`translate(0,${oY})`}>
  <rect x="13" y="26" width="18" height="18" fill={color} stroke={C.bg} strokeWidth="0.5" />
  <circle cx="22" cy="20" r="5.5" fill="#e8c39a" />
  <path d="M 17 22 Q 22 28 27 22 L 26 24 Q 22 27 18 24 Z" fill="#5a4731" />
  <rect x="16" y="14" width="12" height="3" fill={C.bg} />
  <rect x="6" y="30" width="2" height="10" fill="#5a4731" />
  <circle cx="7" cy="29" r="3" fill="none" stroke="#5a4731" strokeWidth="1.5" />
  <rect x="15" y="44" width="5" height="8" fill="#3a2818" />
  <rect x="24" y="44" width="5" height="8" fill="#3a2818" />
</g>);
const Captain = ({ color, oY = 0 }) => (<g transform={`translate(0,${oY})`}>
  <path d="M 13 28 L 31 28 L 34 50 L 28 48 L 22 50 L 16 48 L 10 50 Z" fill={color} stroke={C.bg} strokeWidth="0.5" />
  <rect x="16" y="26" width="12" height="12" fill={C.steel} />
  <circle cx="22" cy="20" r="5.5" fill="#e8c39a" />
  <rect x="20" y="9" width="4" height="6" fill={C.crimson} />
  <path d="M 15 16 Q 22 11 29 16 L 28 19 L 16 19 Z" fill={C.steel} />
  <rect x="32" y="14" width="1.5" height="28" fill="#5a4731" />
  <path d="M 33 14 L 41 16 L 41 22 L 33 20 Z" fill={C.crimson} stroke={C.goldLight} strokeWidth="0.5" />
  <rect x="16" y="42" width="4" height="10" fill={C.steel} />
  <rect x="24" y="42" width="4" height="10" fill={C.steel} />
</g>);
const Sage = ({ color, oY = 0 }) => (<g transform={`translate(0,${oY})`}>
  <path d="M 13 26 L 31 26 L 33 52 L 11 52 Z" fill={color} stroke={C.bg} strokeWidth="0.5" />
  <circle cx="22" cy="20" r="5.5" fill="#e8c39a" />
  <path d="M 16 22 Q 22 36 28 22 L 26 26 Q 22 32 18 26 Z" fill="#d4c39a" />
  <path d="M 14 21 Q 22 8 30 21 L 30 23 L 14 23 Z" fill={C.bg} stroke={color} strokeWidth="0.7" />
  <rect x="7" y="20" width="1.5" height="30" fill="#5a4731" />
  <circle cx="7.7" cy="20" r="2.5" fill={C.goldLight} />
</g>);
const Mage = ({ color, oY = 0 }) => (<g transform={`translate(0,${oY})`}>
  <path d="M 13 26 L 31 26 L 33 52 L 11 52 Z" fill={color} stroke={C.bg} strokeWidth="0.5" />
  <circle cx="22" cy="20" r="5" fill="#e8c39a" />
  <path d="M 12 22 Q 22 5 32 22 L 30 24 L 14 24 Z" fill={C.bg} stroke={color} strokeWidth="0.7" />
  <circle cx="20" cy="21" r="0.8" fill={C.goldLight} />
  <circle cx="24" cy="21" r="0.8" fill={C.goldLight} />
  <circle cx="35" cy="30" r="4" fill={color} opacity="0.4" />
  <circle cx="35" cy="30" r="2.5" fill={C.goldLight} />
  <rect x="34" y="33" width="1.5" height="14" fill="#5a4731" />
</g>);
const Horse = ({ color }) => (<g>
  <ellipse cx="22" cy="46" rx="13" ry="6" fill="#5a4731" stroke={C.bg} strokeWidth="0.7" />
  <rect x="11" y="48" width="2.5" height="10" fill="#3a2818" />
  <rect x="16" y="48" width="2.5" height="10" fill="#3a2818" />
  <rect x="26" y="48" width="2.5" height="10" fill="#3a2818" />
  <rect x="31" y="48" width="2.5" height="10" fill="#3a2818" />
  <path d="M 34 42 L 41 38 L 41 44 L 34 46 Z" fill="#5a4731" stroke={C.bg} strokeWidth="0.7" />
  <path d="M 30 40 L 32 36 L 35 40 Z" fill="#3a2818" />
  <rect x="14" y="40" width="14" height="4" fill={color} opacity="0.7" />
</g>);

function BuildingSvg({ type, size = 80, active = true }) {
  return (<div style={{ width: size, height: size * 0.9, display: "inline-block", filter: active ? "none" : "grayscale(0.6) opacity(0.5)", animation: active ? "bob 4s ease-in-out infinite" : "none" }}>
    <svg width={size} height={size * 0.9} viewBox="0 0 100 90">
      <ellipse cx="50" cy="85" rx="40" ry="3" fill="rgba(0,0,0,0.4)" />
      {{ hut: <Hut />, granary: <Granary />, aqueduct: <Aqueduct />, gatetower: <GateTower />, library: <Library />, townhall: <Townhall />, castle: <Castle /> }[type] || <Hut />}
    </svg>
  </div>);
}
const Hut = () => (<g>
  <rect x="30" y="48" width="40" height="32" fill="#7a5a3a" stroke="#3a2818" strokeWidth="1.5" />
  <path d="M 26 48 L 50 24 L 74 48 Z" fill="#8b3a3a" stroke="#3a2818" strokeWidth="1.5" />
  <rect x="44" y="62" width="12" height="18" fill="#3a2818" />
  <rect x="34" y="54" width="8" height="8" fill="#d4c39a" />
  <rect x="58" y="54" width="8" height="8" fill="#d4c39a" />
</g>);
const Granary = () => (<g>{[20, 50, 80].map((x, i) => (<g key={i}>
  <rect x={x - 11} y="40" width="22" height="40" fill="#c9a874" stroke="#5a4731" strokeWidth="1.2" />
  <path d={`M ${x - 13} 40 L ${x} 22 L ${x + 13} 40 Z`} fill="#8b3a3a" stroke="#5a4731" strokeWidth="1.2" />
  <rect x={x - 8} y="55" width="16" height="2" fill="#5a4731" />
  <rect x={x - 8} y="65" width="16" height="2" fill="#5a4731" />
</g>))}</g>);
const Aqueduct = () => (<g>
  {[0, 30, 60].map((x, i) => (<g key={i}>
    <rect x={x + 8} y="30" width="22" height="50" fill="#a89074" stroke="#5a4731" strokeWidth="1.2" />
    <path d={`M ${x + 12} 48 Q ${x + 19} 32 ${x + 26} 48 L ${x + 26} 80 L ${x + 12} 80 Z`} fill={C.bg} />
  </g>))}
  <rect x="0" y="22" width="100" height="12" fill="#a89074" stroke="#5a4731" strokeWidth="1.2" />
  <rect x="2" y="22" width="96" height="4" fill="#3a5e8c" opacity="0.7" />
</g>);
const GateTower = () => (<g>
  <rect x="15" y="22" width="20" height="58" fill="#7a8499" stroke="#3a2818" strokeWidth="1.5" />
  <rect x="65" y="22" width="20" height="58" fill="#7a8499" stroke="#3a2818" strokeWidth="1.5" />
  {[16, 22, 28].map((x, i) => <rect key={i} x={x} y="18" width="4" height="6" fill="#7a8499" stroke="#3a2818" strokeWidth="1" />)}
  {[66, 72, 78].map((x, i) => <rect key={i} x={x} y="18" width="4" height="6" fill="#7a8499" stroke="#3a2818" strokeWidth="1" />)}
  <rect x="35" y="38" width="30" height="42" fill="#3a2818" />
  <path d="M 35 50 Q 50 36 65 50 L 65 80 L 35 80 Z" fill="#3a2818" />
  <path d="M 38 50 Q 50 38 62 50 L 62 78 L 38 78 Z" fill="#5a4731" />
  <rect x="49" y="6" width="2" height="14" fill="#3a2818" />
  <path d="M 51 6 L 60 8 L 60 14 L 51 12 Z" fill={C.crimson} />
</g>);
const Library = () => (<g>
  <rect x="14" y="62" width="72" height="18" fill="#7a5a3a" stroke="#3a2818" strokeWidth="1.2" />
  {[20, 35, 50, 65, 80].map((x, i) => (<g key={i}>
    <rect x={x - 3} y="32" width="6" height="30" fill="#d4c39a" stroke="#5a4731" strokeWidth="0.8" />
    <rect x={x - 5} y="30" width="10" height="3" fill="#d4c39a" stroke="#5a4731" strokeWidth="0.8" />
  </g>))}
  <path d="M 10 32 L 50 12 L 90 32 Z" fill="#b89870" stroke="#3a2818" strokeWidth="1.5" />
  <circle cx="50" cy="22" r="4" fill={C.goldLight} stroke="#5a4731" />
</g>);
const Townhall = () => (<g>
  <rect x="20" y="40" width="60" height="40" fill="#c9a874" stroke="#3a2818" strokeWidth="1.5" />
  <path d="M 20 40 L 50 60 L 80 40 M 20 80 L 50 60 L 80 80 M 35 40 L 35 80 M 50 40 L 50 80 M 65 40 L 65 80" stroke="#5a3a1a" strokeWidth="1.2" fill="none" />
  <path d="M 16 40 L 50 18 L 84 40 Z" fill="#8b3a3a" stroke="#3a2818" strokeWidth="1.5" />
  <rect x="45" y="6" width="10" height="14" fill="#7a5a3a" stroke="#3a2818" />
  <path d="M 43 6 L 50 0 L 57 6 Z" fill="#8b3a3a" stroke="#3a2818" />
  <rect x="44" y="58" width="12" height="22" fill="#3a2818" />
  <path d="M 44 64 Q 50 56 56 64 L 56 80 L 44 80 Z" fill="#3a2818" />
</g>);
const Castle = () => (<g>
  <rect x="32" y="30" width="36" height="50" fill="#7a8499" stroke="#3a2818" strokeWidth="1.5" />
  <rect x="10" y="40" width="20" height="40" fill="#7a8499" stroke="#3a2818" strokeWidth="1.5" />
  <rect x="70" y="40" width="20" height="40" fill="#7a8499" stroke="#3a2818" strokeWidth="1.5" />
  {[11, 17, 23].map((x, i) => <rect key={"l" + i} x={x} y="36" width="4" height="5" fill="#7a8499" stroke="#3a2818" strokeWidth="0.8" />)}
  {[71, 77, 83].map((x, i) => <rect key={"r" + i} x={x} y="36" width="4" height="5" fill="#7a8499" stroke="#3a2818" strokeWidth="0.8" />)}
  {[33, 40, 47, 54, 61].map((x, i) => <rect key={"m" + i} x={x} y="26" width="5" height="5" fill="#7a8499" stroke="#3a2818" strokeWidth="0.8" />)}
  <rect x="44" y="14" width="12" height="22" fill="#7a8499" stroke="#3a2818" strokeWidth="1.5" />
  <path d="M 42 14 L 50 4 L 58 14 Z" fill={C.crimson} stroke="#3a2818" strokeWidth="1" />
  <rect x="49" y="2" width="2" height="12" fill="#3a2818" />
  <path d="M 51 4 L 62 6 L 62 12 L 51 10 Z" fill={C.goldLight} stroke="#3a2818" strokeWidth="0.5" />
  <path d="M 44 60 Q 50 50 56 60 L 56 80 L 44 80 Z" fill="#3a2818" />
  <rect x="40" y="44" width="3" height="6" fill={C.goldLight} opacity="0.6" />
  <rect x="57" y="44" width="3" height="6" fill={C.goldLight} opacity="0.6" />
</g>);
function Portrait({ type, color, size = 48 }) {
  return (<svg width={size} height={size} viewBox="0 0 48 48">
    <circle cx="24" cy="24" r="22" fill={C.panel2} stroke={color} strokeWidth="2" />
    {{
      merchant: <g><circle cx="24" cy="20" r="6" fill="#e8c39a" /><path d="M 18 22 Q 24 30 30 22 L 28 26 Q 24 28 20 26 Z" fill="#5a4731" /><rect x="20" y="10" width="8" height="3" fill="#5a4731" /><rect x="16" y="29" width="16" height="14" fill={color} /><circle cx="32" cy="34" r="3" fill={C.goldLight} stroke="#5a4731" /></g>,
      healer: <g><circle cx="24" cy="20" r="6" fill="#e8c39a" /><path d="M 16 21 Q 24 8 32 21 L 32 24 L 16 24 Z" fill="#fff" stroke={color} /><rect x="14" y="28" width="20" height="16" fill="#fff" /><rect x="22" y="32" width="4" height="10" fill={color} /><rect x="18" y="36" width="12" height="2" fill={color} /></g>,
      treasurer: <g><circle cx="24" cy="20" r="6" fill="#e8c39a" /><rect x="14" y="29" width="20" height="15" fill={color} /><rect x="20" y="32" width="8" height="10" fill="#d4c39a" /><path d="M 16 16 Q 24 10 32 16 L 30 18 L 18 18 Z" fill="#3a2818" /></g>,
      guard: <g><circle cx="24" cy="20" r="6" fill="#e8c39a" /><path d="M 16 16 Q 24 5 32 16 L 32 22 L 16 22 Z" fill={C.steel} stroke="#3a2818" strokeWidth="0.7" /><rect x="20" y="9" width="8" height="3" fill={C.crimson} /><rect x="14" y="29" width="20" height="15" fill={C.steel} /><rect x="22" y="29" width="4" height="15" fill={C.goldLight} /></g>,
      king: <g><circle cx="24" cy="20" r="6" fill="#e8c39a" /><path d="M 16 14 L 18 8 L 21 12 L 24 6 L 27 12 L 30 8 L 32 14 Z" fill={C.goldLight} stroke="#5a4731" strokeWidth="0.7" /><rect x="16" y="14" width="16" height="3" fill={C.goldLight} stroke="#5a4731" /><circle cx="24" cy="11" r="1.5" fill={C.crimson} /><path d="M 18 22 Q 24 32 30 22 L 28 28 Q 24 30 20 28 Z" fill="#d4c39a" /><rect x="14" y="29" width="20" height="15" fill={color} /><rect x="22" y="30" width="4" height="14" fill={C.goldLight} /></g>,
      judge: <g><circle cx="24" cy="20" r="6" fill="#e8c39a" /><path d="M 14 18 Q 24 6 34 18 L 32 26 L 16 26 Z" fill="#d4c39a" stroke={color} strokeWidth="0.7" /><ellipse cx="24" cy="22" rx="3" ry="2" fill="#e8c39a" /><rect x="14" y="29" width="20" height="15" fill={C.bg} /><rect x="23" y="32" width="2" height="10" fill={C.goldLight} /><rect x="18" y="34" width="12" height="1" fill={C.goldLight} /></g>,
    }[type] || null}
  </svg>);
}
/* CONTINÚA EN PARTE 2 ABAJO */
/* ============ UI ============ */

function projectTypeColor(t) { return { analytics: C.steel, predictive: C.purple, genai: C.crimson, agentic: C.gold }[t] || C.text; }
function primaryBtn(c) { return { background: c, color: C.bg, border: "none", padding: "6px 12px", borderRadius: 2, fontWeight: 700, fontSize: 11, fontFamily: "'Cinzel', serif", letterSpacing: 0.5, width: "100%", cursor: "pointer" }; }
function miniBtn(border, color = C.text) { return { background: "transparent", border: `1px solid ${border}`, color, padding: "3px 8px", borderRadius: 2, fontSize: 10, fontWeight: 600, flex: 1, cursor: "pointer" }; }
function modalStyle(w = 540) { return { background: C.panel, border: `2px solid ${C.gold}`, borderRadius: 4, padding: 24, maxWidth: w, width: "92%", boxShadow: "0 20px 60px rgba(0,0,0,0.7)", maxHeight: "85vh", overflowY: "auto" }; }

function Panel({ title, subtitle, accent = C.gold, right, children }) {
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 3, padding: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10, paddingBottom: 8, borderBottom: `1px solid ${C.border}` }}>
        <div>
          <div className="cinzel" style={{ fontSize: 13, fontWeight: 700, color: accent, letterSpacing: 1.5, textTransform: "uppercase" }}>{title}</div>
          {subtitle && <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{subtitle}</div>}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

function Empty({ text }) { return <div style={{ padding: 20, textAlign: "center", color: C.muted, fontStyle: "italic", fontSize: 11 }}>{text}</div>; }
function Overlay({ children }) { return <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>{children}</div>; }

function Resource({ label, value, icon, color, sub, mono, warn }) {
  return (
    <div style={{ padding: "5px 10px", background: warn ? "rgba(139,21,56,0.15)" : C.panel2, border: `1px solid ${warn ? C.crimson : C.border}`, borderRadius: 2, minWidth: 90 }}>
      <div className="cinzel" style={{ fontSize: 9, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
      <div className={mono ? "mono" : ""} style={{ fontSize: 15, color: warn ? C.crimson : color, fontWeight: 700, lineHeight: 1.1 }}>
        <span style={{ marginRight: 4, opacity: 0.8 }}>{icon}</span>{value}
      </div>
      {sub && <div className="mono" style={{ fontSize: 9, color: C.muted, marginTop: 1 }}>{sub}</div>}
    </div>
  );
}

function CtrlBtn({ children, onClick, active, title }) {
  return (
    <button onClick={onClick} title={title} style={{
      background: active ? C.gold : C.panel2, border: `1px solid ${active ? C.gold : C.border}`,
      color: active ? C.bg : C.text, padding: "4px 10px", borderRadius: 2, fontWeight: 700, fontSize: 11, minWidth: 32,
      fontFamily: "'JetBrains Mono', monospace",
    }}>{children}</button>
  );
}

function MicroBar({ label, value, color }) {
  return (
    <div style={{ flex: 1 }}>
      <div className="mono" style={{ fontSize: 8, color: C.muted, marginBottom: 1 }}>{label} {Math.round(value)}</div>
      <div style={{ height: 3, background: C.bg, borderRadius: 1, overflow: "hidden" }}>
        <div style={{ width: clamp(value, 0, 100) + "%", height: "100%", background: color }} />
      </div>
    </div>
  );
}

/* ---------- KINGDOM MAP ---------- */
function KingdomMap({ state }) {
  const slots = {
    war_room: { x: 50, y: 60 },
    data_lake: { x: 80, y: 32 },
    feature_store: { x: 22, y: 32 },
    model_registry: { x: 78, y: 70 },
    ai_gateway: { x: 22, y: 70 },
    agent_mesh: { x: 50, y: 30 },
  };
  const idle = state.team.filter((u) => u.status === "idle");
  const training = state.team.filter((u) => u.status === "training");
  const era = ERAS[state.era - 1];

  return (
    <div style={{
      position: "relative", width: "100%", height: 340,
      background: `radial-gradient(ellipse at 50% 30%, #2a2218 0%, transparent 60%), linear-gradient(180deg, #1a1612 0%, #0c0a08 100%)`,
      border: `1px solid ${C.border}`, borderRadius: 4, overflow: "hidden",
    }}>
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.18 }}>
        <defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke={C.bronze} strokeWidth="0.5" /></pattern></defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      <div style={{
        position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)",
        background: `linear-gradient(180deg, ${era.color}33, ${era.color}11)`, border: `1px solid ${era.color}`,
        padding: "4px 14px", borderRadius: 2, zIndex: 10,
      }}>
        <span className="cinzel" style={{ color: era.color, fontSize: 13, fontWeight: 700, letterSpacing: 2 }}>
          {era.banner} · {era.short.toUpperCase()}
        </span>
      </div>

      {/* edificios construidos */}
      {state.buildings.map((bid) => {
        const slot = slots[bid]; const b = BUILDINGS[bid]; if (!slot) return null;
        return (
          <div key={bid} style={{ position: "absolute", left: `${slot.x}%`, top: `${slot.y}%`, transform: "translate(-50%, -50%)", textAlign: "center" }} title={b.label}>
            <BuildingSvg type={b.building} size={64} />
            <div className="cinzel" style={{ fontSize: 8, color: C.parchment, marginTop: -2, letterSpacing: 1 }}>{b.label.slice(0, 16)}</div>
          </div>
        );
      })}
      {/* placeholders */}
      {Object.entries(slots).map(([bid, slot]) => {
        if (state.buildings.includes(bid)) return null;
        const b = BUILDINGS[bid]; if (state.era < b.minEra) return null;
        return (
          <div key={"ph_" + bid} style={{ position: "absolute", left: `${slot.x}%`, top: `${slot.y}%`, transform: "translate(-50%, -50%)", opacity: 0.18 }}>
            <BuildingSvg type={b.building} size={50} active={false} />
          </div>
        );
      })}

      {/* idle soldiers */}
      <div style={{ position: "absolute", bottom: 18, left: 8, display: "flex", gap: 1, flexWrap: "wrap", maxWidth: 230 }}>
        {idle.map((u) => (
          <div key={u.id} title={`${ROLES[u.role].label} · ${["Jr", "Sr", "Lead"][u.level - 1]}`}>
            <Sprite type={ROLES[u.role].sprite} color={ROLES[u.role].color} size={30} level={u.level} />
          </div>
        ))}
      </div>
      {idle.length > 0 && <div className="cinzel" style={{ position: "absolute", bottom: 2, left: 8, fontSize: 9, color: C.muted, letterSpacing: 1 }}>⚔ BARRACÓN</div>}

      {/* training */}
      <div style={{ position: "absolute", bottom: 18, right: 8, display: "flex", gap: 1, flexWrap: "wrap", maxWidth: 180 }}>
        {training.map((u) => (
          <div key={u.id} style={{ position: "relative" }} title="Upskill">
            <Sprite type={ROLES[u.role].sprite} color={ROLES[u.role].color} size={30} level={u.level} />
            <div style={{ position: "absolute", top: -2, right: -2, background: C.gold, color: C.bg, borderRadius: "50%", width: 13, height: 13, fontSize: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{u.trainingTurns}</div>
          </div>
        ))}
      </div>
      {training.length > 0 && <div className="cinzel" style={{ position: "absolute", bottom: 2, right: 8, fontSize: 9, color: C.muted, letterSpacing: 1 }}>📜 ACADEMIA</div>}

      {/* active project banners */}
      <div style={{
        position: "absolute", top: 130, left: "50%", transform: "translateX(-50%)",
        display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", maxWidth: "60%",
      }}>
        {state.activeProjects.slice(0, 5).map((ap) => {
          const p = PROJECTS.find((x) => x.id === ap.id); const pct = (ap.progress / p.duration) * 100;
          const c = projectTypeColor(p.type);
          const team = state.team.filter((u) => u.projectId === p.id);
          return (
            <div key={ap.id} style={{ textAlign: "center" }}>
              <div style={{ position: "relative", display: "inline-block" }}>
                <svg width="50" height="56" viewBox="0 0 50 60">
                  <rect x="24" y="0" width="2" height="60" fill="#3a2818" />
                  <path d="M 26 4 L 46 8 L 46 32 L 26 28 Z" fill={c} stroke={C.goldLight} strokeWidth="0.8">
                    <animate attributeName="d" values="M 26 4 L 46 8 L 46 32 L 26 28 Z;M 26 4 L 44 10 L 44 30 L 26 28 Z;M 26 4 L 46 8 L 46 32 L 26 28 Z" dur="2.5s" repeatCount="indefinite" />
                  </path>
                  <text x="36" y="22" fontSize="10" fill={C.bg} textAnchor="middle" fontWeight="700">{p.type[0].toUpperCase()}</text>
                </svg>
                <div style={{ display: "flex", justifyContent: "center", marginTop: -6 }}>
                  {team.slice(0, 3).map((u, i) => (
                    <div key={u.id} style={{ marginLeft: i === 0 ? 0 : -10 }}>
                      <Sprite type={ROLES[u.role].sprite} color={ROLES[u.role].color} size={22} level={u.level} />
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ width: 80, height: 4, background: C.panel2, borderRadius: 2, marginTop: 2, overflow: "hidden" }}>
                <div style={{ width: pct + "%", height: "100%", background: c }} />
              </div>
              <div className="cinzel" style={{ fontSize: 8, color: C.parchment, marginTop: 2, maxWidth: 88, lineHeight: 1.2, letterSpacing: 0.5 }}>
                {p.name.slice(0, 22)}
              </div>
            </div>
          );
        })}
      </div>

      {state.buildings.length === 0 && (
        <div style={{ position: "absolute", left: "50%", top: "55%", transform: "translate(-50%, -50%)", opacity: 0.5 }}>
          <BuildingSvg type="hut" size={58} active={false} />
          <div className="cinzel" style={{ fontSize: 9, color: C.muted, textAlign: "center", marginTop: -4 }}>Aldea inicial</div>
        </div>
      )}
    </div>
  );
}

/* ---------- HEADER ---------- */
function Header({ state, dispatch }) {
  const eff = computeBuildingEffects(state); const teamC = computeTeamContrib(state); const pr = payroll(state);
  const inQ = ((state.quarter - 1) % 4) + 1;
  return (
    <div style={{ borderBottom: `2px solid ${C.border}`, background: "rgba(26,22,18,0.95)", backdropFilter: "blur(8px)", padding: "10px 18px", position: "sticky", top: 0, zIndex: 50 }}>
      <div style={{ maxWidth: 1600, margin: "0 auto", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <span className="cinzel" style={{ fontSize: 22, color: C.gold, letterSpacing: 3, fontWeight: 700 }}>⚔ IMPERIO · AGÉNTICO ⚔</span>
        <span className="mono" style={{ color: C.muted, fontSize: 10 }}>v2.0 OBU</span>
        <div style={{ padding: "5px 12px", background: C.panel2, border: `1px solid ${C.gold}`, borderRadius: 2 }}>
          <div className="cinzel" style={{ fontSize: 11, color: C.gold, letterSpacing: 1.5 }}>Q{inQ} · AÑO {state.year} · TURNO {state.turn}</div>
        </div>
        <div style={{ flex: 1 }} />
        <Resource label="Presupuesto" value={"€" + fmt(state.resources.budget)} icon="◈" color={C.gold} warn={state.resources.budget < 100} />
        <Resource label="Cómputo" value={fmt(state.resources.compute)} icon="⚡" color={C.purple} sub={`+${Math.round(teamC.compute + eff.passive.compute)}/t`} />
        <Resource label="Conocimiento" value={fmt(state.resources.knowledge)} icon="📜" color={C.jade} sub={`+${Math.round(teamC.knowledge + eff.passive.knowledge)}/t`} />
        <Resource label="Visión" value={fmt(state.resources.vision)} icon="✦" color={C.crimson} sub="estratégica" />
        <Resource label="Nómina/t" value={"-" + fmt(pr)} icon="◔" color={C.ember} mono />
        <div style={{ display: "flex", gap: 5 }}>
          <CtrlBtn onClick={() => dispatch({ type: "TOGGLE_PAUSE" })} active={!state.paused}>{state.paused ? "▶" : "❚❚"}</CtrlBtn>
          {[1, 2, 3].map((s) => <CtrlBtn key={s} onClick={() => dispatch({ type: "SET_SPEED", speed: s })} active={state.speed === s}>{s}x</CtrlBtn>)}
        </div>
      </div>
      {state.pauseTurns > 0 && (
        <div style={{ maxWidth: 1600, margin: "8px auto 0", padding: "5px 10px", background: "rgba(139,21,56,0.15)", border: `1px solid ${C.crimson}`, borderRadius: 2, fontSize: 11, color: C.crimson }}>
          ⚠ Operativa pausada · {state.pauseTurns} turnos
        </div>
      )}
    </div>
  );
}

/* ---------- TABS ---------- */
function Tabs({ tab, setTab, state }) {
  const tabs = [
    { id: "portfolio", label: "Portfolio", count: state.activeProjects.length },
    { id: "okrs", label: "OKRs/QBR", count: state.okrs.filter((o) => isOKRMet(o, state)).length + "/" + state.okrs.length },
    { id: "risks", label: "Riesgos", count: state.risks.filter((r) => !r.mitigated).length },
    { id: "build", label: "Infraestructura", count: state.buildings.length },
    { id: "era", label: "Roadmap", count: null },
    { id: "log", label: "Registro", count: null },
  ];
  return (
    <div style={{ display: "flex", gap: 4, borderBottom: `1px solid ${C.border}` }}>
      {tabs.map((t) => (
        <button key={t.id} onClick={() => setTab(t.id)} style={{
          background: tab === t.id ? C.panel2 : "transparent", border: "none",
          borderBottom: tab === t.id ? `2px solid ${C.gold}` : "2px solid transparent",
          color: tab === t.id ? C.gold : C.muted, padding: "7px 12px", fontSize: 12, fontWeight: 600,
          fontFamily: "'Cinzel', serif", letterSpacing: 0.3, cursor: "pointer",
        }}>
          {t.label}{t.count != null && <span className="mono" style={{ marginLeft: 5, opacity: 0.7, fontSize: 10 }}>·{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

/* ---------- TEAM PANEL ---------- */
function TeamPanel({ state, dispatch, assigning, setAssigning }) {
  const [showHire, setShowHire] = useState(false);
  return (
    <Panel title="Equipo" subtitle={`${state.team.length}/${state.capacity} miembros`} accent={C.steel}>
      <div className="scrolly" style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 8, maxHeight: 480, overflowY: "auto" }}>
        {state.team.map((u) => (<TeamCard key={u.id} u={u} state={state} dispatch={dispatch} assigning={assigning === u.id} setAssigning={setAssigning} />))}
      </div>
      <button onClick={() => setShowHire(!showHire)} style={primaryBtn(C.steel)}>{showHire ? "▾" : "▸"} Contratar (€80)</button>
      {showHire && (
        <div style={{ marginTop: 7, display: "flex", flexDirection: "column", gap: 5 }}>
          {Object.entries(ROLES).map(([id, r]) => {
            const locked = state.era < r.minEra, noCap = state.team.length >= state.capacity, noBudget = state.resources.budget < 80;
            return (
              <button key={id} disabled={locked || noCap || noBudget} onClick={() => { dispatch({ type: "HIRE", role: id }); setShowHire(false); }}
                style={{ background: locked ? C.panel : C.panel2, border: `1px solid ${locked ? C.border : r.color}`, color: C.text, textAlign: "left", padding: 7, borderRadius: 2 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 700, color: locked ? C.muted : r.color, fontFamily: "'Cinzel', serif", fontSize: 12 }}>{r.label}</span>
                  <span className="mono" style={{ fontSize: 10, color: C.muted }}>{locked ? `Era ${r.minEra}+` : `€${r.salary}/t`}</span>
                </div>
                <div style={{ fontSize: 10, color: C.muted, marginTop: 2, lineHeight: 1.3 }}>{r.desc}</div>
              </button>
            );
          })}
        </div>
      )}
    </Panel>
  );
}

function TeamCard({ u, state, dispatch, assigning, setAssigning }) {
  const r = ROLES[u.role];
  const projDef = u.projectId ? PROJECTS.find((p) => p.id === u.projectId) : null;
  const isTraining = u.status === "training";
  return (
    <div style={{ background: C.panel2, border: `1px solid ${assigning ? C.gold : C.border}`, borderLeft: `3px solid ${r.color}`, borderRadius: 2, padding: 7 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <Sprite type={r.sprite} color={r.color} size={32} level={u.level} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, fontWeight: 700, color: r.color }}>{r.label}</div>
          <div className="mono" style={{ fontSize: 9, color: C.muted }}>
            <span style={{ color: u.level === 3 ? C.goldLight : C.muted }}>{["Jr", "Sr", "Lead"][u.level - 1]}</span> · <span style={{ color: isTraining ? C.purple : projDef ? C.gold : C.jade }}>{isTraining ? `Upskill ${u.trainingTurns}t` : projDef ? "Asignado" : "Idle"}</span> · {u.allocation}%
          </div>
        </div>
      </div>
      {projDef && <div style={{ marginTop: 4, padding: "3px 5px", background: C.bg, borderRadius: 2, fontSize: 9, color: C.gold, lineHeight: 1.3 }}>→ {projDef.name.slice(0, 32)}</div>}
      <div style={{ marginTop: 5, display: "flex", alignItems: "center", gap: 5 }}>
        <span className="mono" style={{ fontSize: 9, color: C.muted, minWidth: 28 }}>Alloc</span>
        <input type="range" min={25} max={100} step={25} value={u.allocation} onChange={(e) => dispatch({ type: "SET_ALLOCATION", id: u.id, value: parseInt(e.target.value) })} style={{ flex: 1, accentColor: r.color }} />
        <span className="mono" style={{ fontSize: 9, color: r.color, minWidth: 30 }}>{u.allocation}%</span>
      </div>
      <div style={{ marginTop: 4, display: "flex", gap: 6 }}>
        <MicroBar label="Perf" value={u.performance} color={C.jade} />
        <MicroBar label="Loy" value={u.loyalty} color={C.gold} />
      </div>
      <div style={{ display: "flex", gap: 3, marginTop: 6 }}>
        <button onClick={() => setAssigning(assigning ? null : u.id)} disabled={isTraining} style={miniBtn(assigning ? C.gold : C.border, assigning ? C.gold : C.text)}>{assigning ? "Cancel" : "Asignar"}</button>
        {u.status === "on_project" ? (
          <button onClick={() => dispatch({ type: "ASSIGN", userId: u.id, projectId: null })} style={miniBtn(C.border, C.gold)}>Liberar</button>
        ) : (
          <button onClick={() => dispatch({ type: "TRAIN", id: u.id })} disabled={isTraining || u.level >= 3} style={miniBtn(C.border)}>Upskill</button>
        )}
        <button onClick={() => dispatch({ type: "FIRE", id: u.id })} style={miniBtn(C.border, C.crimson)}>✕</button>
      </div>
    </div>
  );
}

/* ---------- PORTFOLIO PANEL ---------- */
function PortfolioPanel({ state, dispatch, assigning, setAssigning }) {
  const eff = computeBuildingEffects(state);
  const available = PROJECTS.filter((p) => state.era >= p.minEra && !state.completedProjects.includes(p.id) && !state.activeProjects.find((ap) => ap.id === p.id));
  const [sort, setSort] = useState("rice");
  const sortedAvail = useMemo(() => {
    const list = [...available];
    if (sort === "rice") list.sort((a, b) => riceScore(b.rice) - riceScore(a.rice));
    if (sort === "duration") list.sort((a, b) => a.duration - b.duration);
    if (sort === "cost") list.sort((a, b) => a.cost.budget - b.cost.budget);
    return list;
  }, [available, sort]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Panel title="Programas Estratégicos" subtitle={`${state.completedPrograms.length}/${PROGRAMS.length} completados`} accent={C.crimson}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 8 }}>
          {PROGRAMS.filter((p) => state.era >= p.minEra).map((prog) => {
            const done = state.completedPrograms.includes(prog.id);
            const cr = prog.required.filter((r) => state.completedProjects.includes(r)).length;
            return (
              <div key={prog.id} style={{ background: done ? `linear-gradient(135deg, ${C.goldLight}22, ${C.panel2})` : C.panel2, border: `1px solid ${done ? C.gold : C.border}`, borderRadius: 2, padding: 10, position: "relative" }}>
                {done && <div className="cinzel" style={{ position: "absolute", top: 6, right: 8, fontSize: 9, color: C.gold, letterSpacing: 1, fontWeight: 700 }}>★ COMPLETADO</div>}
                <div className="cinzel" style={{ fontSize: 13, fontWeight: 700, color: done ? C.goldLight : C.crimson, letterSpacing: 0.5 }}>{prog.name}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 3, lineHeight: 1.3 }}>{prog.desc}</div>
                <div className="mono" style={{ fontSize: 10, color: C.parchment, marginTop: 5 }}>{cr}/{prog.required.length} proyectos</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginTop: 4 }}>
                  {prog.required.map((r) => {
                    const ok = state.completedProjects.includes(r);
                    return (
                      <span key={r} style={{ fontSize: 9, padding: "2px 5px", background: ok ? C.jade + "33" : C.panel, color: ok ? C.jade : C.muted, borderRadius: 2, border: `1px solid ${ok ? C.jade : C.border}` }}>
                        {ok ? "✓ " : ""}{PROJECTS.find((p) => p.id === r)?.name.slice(0, 20) || r}
                      </span>
                    );
                  })}
                </div>
                <div className="mono" style={{ fontSize: 9, color: C.gold, marginTop: 6 }}>Recompensa: €{prog.reward.budget || 0} · ✦{prog.reward.vision || 0} · 📜{prog.reward.knowledge || 0}</div>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel title="Proyectos Activos" accent={C.gold}>
        {state.activeProjects.length === 0 && <Empty text="Sin proyectos en curso. Lanza alguno del catálogo." />}
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {state.activeProjects.map((ap) => {
            const p = PROJECTS.find((x) => x.id === ap.id); const speed = computeProjectSpeed(state, p, eff, ap);
            const pct = (ap.progress / p.duration) * 100;
            const remaining = speed > 0 ? Math.ceil((p.duration - ap.progress) / speed) : "∞";
            const assignedCount = state.team.filter((u) => u.projectId === p.id).length;
            const needsGate = p.stageGate && ap.progress >= p.stageGate.atProgress && !ap.gateApproved;
            return (
              <div key={ap.id} onClick={() => { if (assigning) { dispatch({ type: "ASSIGN", userId: assigning, projectId: ap.id }); setAssigning(null); } }}
                style={{ background: C.panel2, border: `1px solid ${needsGate ? C.crimson : assigning ? C.gold : C.border}`, borderLeft: `3px solid ${projectTypeColor(p.type)}`, borderRadius: 2, padding: 9, cursor: assigning ? "pointer" : "default" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                  <div>
                    <span className="cinzel" style={{ fontSize: 13, fontWeight: 700, color: projectTypeColor(p.type) }}>{p.name}</span>
                    <div className="mono" style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>{p.type.toUpperCase()} · {speed.toFixed(2)}x · {remaining}t · {assignedCount} pers · RICE {riceScore(p.rice)}</div>
                  </div>
                  {needsGate && (
                    <button onClick={(e) => { e.stopPropagation(); dispatch({ type: "REQUEST_GATE", projectId: ap.id }); }} style={{ background: C.crimson, color: C.bg, border: "none", padding: "4px 8px", fontSize: 10, borderRadius: 2, fontFamily: "'Cinzel', serif", fontWeight: 700, cursor: "pointer" }}>
                      ⛔ Gate · {STAKEHOLDERS[p.stageGate.stakeholder].label}
                    </button>
                  )}
                </div>
                <div style={{ marginTop: 6, height: 6, background: C.bg, borderRadius: 2, overflow: "hidden", position: "relative" }}>
                  {p.stageGate && <div style={{ position: "absolute", left: `${(p.stageGate.atProgress / p.duration) * 100}%`, top: 0, bottom: 0, width: 2, background: ap.gateApproved ? C.jade : C.crimson, zIndex: 2 }} />}
                  <div style={{ width: pct + "%", height: "100%", background: `linear-gradient(90deg, ${projectTypeColor(p.type)}, ${projectTypeColor(p.type)}aa)` }} />
                </div>
                {assigning && <div style={{ fontSize: 10, color: C.gold, marginTop: 4 }}>Click aquí para asignar →</div>}
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel title="Catálogo" subtitle={`${available.length} disponibles`} accent={C.purple}
        right={<div style={{ display: "flex", gap: 4 }}>
          {[{ k: "rice", l: "RICE" }, { k: "duration", l: "Dur" }, { k: "cost", l: "€" }].map((x) => (
            <button key={x.k} onClick={() => setSort(x.k)} style={{ background: sort === x.k ? C.purple : C.panel2, border: `1px solid ${sort === x.k ? C.purple : C.border}`, color: sort === x.k ? C.text : C.muted, padding: "3px 7px", borderRadius: 2, fontSize: 10, cursor: "pointer" }}>{x.l}</button>
          ))}
        </div>}>
        <div className="scrolly" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 7, maxHeight: 380, overflowY: "auto", paddingRight: 4 }}>
          {sortedAvail.map((p) => {
            const canLaunch = state.resources.budget >= p.cost.budget && state.resources.compute >= p.cost.compute && (!p.requiresBuilding || state.buildings.includes(p.requiresBuilding));
            const c = projectTypeColor(p.type);
            return (
              <div key={p.id} style={{ background: C.panel2, border: `1px solid ${C.border}`, borderLeft: `3px solid ${c}`, borderRadius: 2, padding: 8, opacity: canLaunch ? 1 : 0.65 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span className="cinzel" style={{ fontSize: 11.5, fontWeight: 700, color: c }}>{p.name}</span>
                  <span className="mono" style={{ fontSize: 9, color: c, marginLeft: 4 }}>{p.type.slice(0, 3).toUpperCase()}</span>
                </div>
                <div style={{ fontSize: 10, color: C.muted, marginTop: 3, lineHeight: 1.3 }}>{p.desc}</div>
                <div className="mono" style={{ fontSize: 9, color: C.muted, marginTop: 5, display: "flex", gap: 5, flexWrap: "wrap" }}>
                  <span>€{p.cost.budget}</span><span>⚡{p.cost.compute}</span><span>⌛{p.duration}t</span>
                  <span style={{ color: p.risk > 0.25 ? C.crimson : C.muted }}>r{Math.round(p.risk * 100)}%</span>
                  <span style={{ color: C.goldLight }}>RICE {riceScore(p.rice)}</span>
                </div>
                <div style={{ marginTop: 5, display: "flex", gap: 3, flexWrap: "wrap" }}>
                  {p.reward.trust && Object.entries(p.reward.trust).map(([k, v]) => (
                    <span key={k} className="mono" style={{ fontSize: 8, padding: "1px 4px", background: STAKEHOLDERS[k].color + "33", color: STAKEHOLDERS[k].color, borderRadius: 2 }}>+{v} {STAKEHOLDERS[k].short}</span>
                  ))}
                  {p.reward.vision && <span className="mono" style={{ fontSize: 8, padding: "1px 4px", background: C.crimson + "33", color: C.crimson, borderRadius: 2 }}>✦{p.reward.vision}</span>}
                  {p.stageGate && <span className="mono" style={{ fontSize: 8, padding: "1px 4px", background: C.bronze + "33", color: C.bronze, borderRadius: 2 }}>⛔ Gate</span>}
                </div>
                {p.requiresBuilding && !state.buildings.includes(p.requiresBuilding) && <div style={{ fontSize: 9, color: C.crimson, marginTop: 4 }}>Requiere: {BUILDINGS[p.requiresBuilding].label}</div>}
                <button onClick={() => dispatch({ type: "START_PROJECT", id: p.id })} disabled={!canLaunch} style={{ ...primaryBtn(c), marginTop: 6, padding: "4px 8px", fontSize: 11 }}>Lanzar</button>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}

/* ---------- OKR PANEL ---------- */
function OKRPanel({ state }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Panel title={`OKRs · Q${((state.quarter - 1) % 4) + 1} año ${state.year}`} subtitle="Cumplir o pierdes confianza Ejec" accent={C.gold}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {state.okrs.map((okr) => {
            const met = isOKRMet(okr, state);
            return (
              <div key={okr.id} style={{ background: C.panel2, border: `1px solid ${met ? C.jade : C.border}`, borderLeft: `3px solid ${met ? C.jade : C.gold}`, padding: 10, borderRadius: 2 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span className="cinzel" style={{ fontSize: 12, color: met ? C.jade : C.parchment, fontWeight: 600 }}>{met ? "✓ " : "○ "}{okr.label}</span>
                  <span className="mono" style={{ fontSize: 11, color: met ? C.jade : C.gold }}>{okrProgress(okr, state)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>
      {state.pastOKRs.length > 0 && (
        <Panel title="Histórico Trimestres" accent={C.bronze}>
          <div className="scrolly" style={{ maxHeight: 240, overflowY: "auto" }}>
            {state.pastOKRs.slice().reverse().map((q, i) => (
              <div key={i} style={{ padding: 8, borderBottom: `1px solid ${C.border}` }}>
                <div className="cinzel" style={{ fontSize: 11, color: C.gold }}>Q{((q.quarter - 1) % 4) + 1} · año {q.year} · {q.results.filter((r) => r.status === "met").length}/{q.results.length} cumplidos</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                  {q.results.map((r) => (
                    <span key={r.id} style={{ fontSize: 9, padding: "1px 5px", background: r.status === "met" ? C.jade + "33" : C.crimson + "33", color: r.status === "met" ? C.jade : C.crimson, borderRadius: 2 }}>{r.status === "met" ? "✓" : "✗"} {r.label.slice(0, 30)}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}

/* ---------- RISKS ---------- */
function RisksPanel({ state, dispatch }) {
  const active = state.risks.filter((r) => !r.mitigated), mitigated = state.risks.filter((r) => r.mitigated);
  return (
    <Panel title="Risk Register" subtitle={`${active.length} activos · ${mitigated.length} mitigados`} accent={C.crimson}>
      {active.length === 0 && <Empty text="No hay riesgos activos." />}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {active.map((r) => (
          <div key={r.id} style={{ background: "rgba(139,21,56,0.1)", border: `1px solid ${C.crimson}`, borderRadius: 2, padding: 10 }}>
            <div className="cinzel" style={{ fontSize: 12, color: C.crimson, fontWeight: 700 }}>⚠ {r.label}</div>
            <div style={{ fontSize: 11, color: C.parchment, marginTop: 4 }}>Impacto: {r.impact}</div>
            <div className="mono" style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>Mitigación: €{r.mitigationCost.budget}</div>
            <button onClick={() => dispatch({ type: "MITIGATE_RISK", id: r.id })} disabled={state.resources.budget < r.mitigationCost.budget} style={{ ...primaryBtn(C.crimson), marginTop: 6, padding: "4px 8px", fontSize: 11 }}>Mitigar</button>
          </div>
        ))}
        {mitigated.map((r) => (
          <div key={r.id} style={{ background: C.panel2, border: `1px solid ${C.jade}`, borderRadius: 2, padding: 8, opacity: 0.6 }}>
            <div className="cinzel" style={{ fontSize: 11, color: C.jade }}>✓ {r.label}</div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

/* ---------- BUILD PANEL ---------- */
function BuildPanel({ state, dispatch }) {
  return (
    <Panel title="Infraestructura" subtitle="Construye una vez, beneficio permanente" accent={C.jade}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 9 }}>
        {Object.entries(BUILDINGS).map(([id, b]) => {
          const built = state.buildings.includes(id), locked = state.era < b.minEra;
          const can = !built && !locked && state.resources.budget >= b.cost.budget && state.resources.knowledge >= b.cost.knowledge && (!b.cost.vision || state.resources.vision >= b.cost.vision);
          return (
            <div key={id} style={{ background: built ? `linear-gradient(135deg, ${C.jade}22, ${C.panel2})` : C.panel2, border: `1px solid ${built ? C.jade : C.border}`, borderRadius: 2, padding: 10, opacity: locked ? 0.5 : 1, display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <BuildingSvg type={b.building} size={56} active={built} />
                <div style={{ flex: 1 }}>
                  <div className="cinzel" style={{ fontSize: 12, fontWeight: 700, color: built ? C.jade : C.gold }}>{b.label}</div>
                  {built && <span className="mono" style={{ fontSize: 9, color: C.jade }}>★ ACTIVO</span>}
                  {locked && <span className="mono" style={{ fontSize: 9, color: C.muted }}>Era {b.minEra}+</span>}
                </div>
              </div>
              <div style={{ fontSize: 11, color: C.parchment, lineHeight: 1.4 }}>{b.desc}</div>
              <div className="mono" style={{ fontSize: 9, color: C.muted }}>€{b.cost.budget} · 📜{b.cost.knowledge}{b.cost.vision ? ` · ✦${b.cost.vision}` : ""}</div>
              {!built && <button onClick={() => dispatch({ type: "BUILD", id })} disabled={!can} style={{ ...primaryBtn(C.jade), padding: "5px 10px", fontSize: 11 }}>Construir</button>}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

/* ---------- ERA / ROADMAP ---------- */
function EraPanel({ state, dispatch }) {
  const next = ERAS[state.era];
  return (
    <Panel title="Roadmap Madurez IA" subtitle="De reportes a Atlas agéntico" accent={C.gold}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {ERAS.map((e) => {
          const reached = state.era >= e.id, isCurrent = state.era === e.id;
          return (
            <div key={e.id} style={{ padding: 10, background: isCurrent ? `linear-gradient(135deg, ${e.color}22, ${C.panel2})` : C.panel, border: `1px solid ${isCurrent ? e.color : C.border}`, borderLeft: `4px solid ${e.color}`, borderRadius: 2, opacity: reached ? 1 : 0.5 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span className="cinzel" style={{ color: e.color, fontWeight: 700, fontSize: 13, letterSpacing: 0.5 }}>{e.name}</span>
                {isCurrent && <span className="cinzel" style={{ color: e.color, fontSize: 10 }}>● ACTUAL</span>}
              </div>
              <div style={{ fontSize: 11, color: C.parchment, marginTop: 3 }}>{e.desc}</div>
              {!reached && <div className="mono" style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>Coste: €{e.advanceCost.budget} · 📜{e.advanceCost.knowledge}{e.advanceCost.vision ? ` · ✦${e.advanceCost.vision}` : ""}</div>}
            </div>
          );
        })}
      </div>
      {next && (
        <button onClick={() => dispatch({ type: "ADVANCE_ERA" })} disabled={state.resources.budget < next.advanceCost.budget || state.resources.knowledge < next.advanceCost.knowledge || (next.advanceCost.vision && state.resources.vision < next.advanceCost.vision)} style={{ ...primaryBtn(C.gold), marginTop: 12, padding: "10px", fontSize: 12 }}>▲ Avanzar a {next.name}</button>
      )}
      <div style={{ marginTop: 14, padding: 10, background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 2, fontSize: 11, lineHeight: 1.4 }}>
        <div className="cinzel" style={{ color: C.gold, fontWeight: 700, marginBottom: 5, letterSpacing: 1 }}>🏆 VICTORIA</div>
        <div style={{ color: C.parchment }}>Era IV · ≥2 proyectos agénticos · ≥3 programas · Comité Ejec ≥70</div>
        <div className="cinzel" style={{ color: C.crimson, marginTop: 8, fontWeight: 700, letterSpacing: 1 }}>☠ GAME OVER</div>
        <div style={{ color: C.parchment }}>Presupuesto &lt; -250 · Comité Ejec &lt; 20</div>
      </div>
    </Panel>
  );
}

/* ---------- LOG ---------- */
function LogPanel({ state }) {
  return (
    <Panel title="Registro" accent={C.muted}>
      <div className="scrolly" style={{ maxHeight: 540, overflowY: "auto" }}>
        {state.log.map((l, i) => (
          <div key={i} style={{ padding: "6px 0", borderBottom: `1px solid ${C.border}`, fontSize: 12, color: C.text }}>
            <span className="mono" style={{ color: C.muted, marginRight: 8 }}>T{l.turn}</span>{l.text}
          </div>
        ))}
      </div>
    </Panel>
  );
}

/* ---------- STAKEHOLDERS ---------- */
function StakeholdersPanel({ state, dispatch }) {
  const eff = computeBuildingEffects(state); const max = 1 + eff.negotiationsPerTurn;
  return (
    <Panel title="Stakeholders" subtitle={`Negociaciones ${state.negotiationsThisTurn}/${max} · €35`} accent={C.crimson}>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {Object.entries(STAKEHOLDERS).map(([id, sh]) => {
          const data = state.stakeholders[id]; const happy = data.trust >= 50; const critical = data.trust < 30;
          return (
            <div key={id} style={{ background: C.panel2, border: `1px solid ${critical ? C.crimson : C.border}`, borderLeft: `3px solid ${sh.color}`, borderRadius: 2, padding: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Portrait type={sh.portrait} color={sh.color} size={42} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="cinzel" style={{ fontSize: 12, fontWeight: 700, color: sh.color }}>{sh.label}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4 }}>
                    <div style={{ flex: 1, height: 5, background: C.bg, borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ width: data.trust + "%", height: "100%", background: critical ? C.crimson : happy ? C.jade : C.gold, transition: "width 0.4s ease" }} />
                    </div>
                    <span className={`mono ${critical ? "pulse" : ""}`} style={{ fontSize: 10, color: critical ? C.crimson : C.text, minWidth: 22 }}>{Math.round(data.trust)}</span>
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 9, color: C.muted, marginTop: 4, lineHeight: 1.3 }}>{sh.desc}</div>
              <button onClick={() => dispatch({ type: "NEGOTIATE", id })} disabled={state.negotiationsThisTurn >= max || state.resources.budget < 35} style={{ ...miniBtn(sh.color, sh.color), marginTop: 5, padding: "4px", fontSize: 10, width: "100%" }}>Negociar</button>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

/* ---------- MODALS ---------- */
function effectsToText(e) {
  const out = [];
  if (e.budget) out.push(`€${e.budget > 0 ? "+" : ""}${e.budget}`);
  if (e.knowledge) out.push(`📜+${e.knowledge}`);
  if (e.vision) out.push(`✦+${e.vision}`);
  if (e.trust) for (const k in e.trust) out.push(`${e.trust[k] > 0 ? "+" : ""}${e.trust[k]} ${STAKEHOLDERS[k].short}`);
  if (e.trustAll) out.push(`${e.trustAll > 0 ? "+" : ""}${e.trustAll} todos`);
  if (e.pauseTurns) out.push(`pausa ${e.pauseTurns}t`);
  if (e.fireRole) out.push(`pierdes ${ROLES[e.fireRole].label}`);
  return out.join(" · ");
}

function EventModal({ event, dispatch }) {
  return (
    <Overlay>
      <div style={modalStyle(580)}>
        <div className="cinzel" style={{ color: C.gold, fontSize: 14, letterSpacing: 3, fontWeight: 700 }}>⚡ DECISIÓN ESTRATÉGICA</div>
        <div className="cinzel" style={{ fontSize: 22, fontWeight: 700, marginTop: 6, color: C.parchment }}>{event.title}</div>
        <div style={{ fontSize: 14, color: C.parchment, marginTop: 10, lineHeight: 1.5, fontStyle: "italic" }}>{event.text}</div>
        <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 7 }}>
          {event.options.map((o, i) => (
            <button key={i} onClick={() => dispatch({ type: "RESOLVE_EVENT", optionIndex: i })} style={{ background: C.panel2, border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.gold}`, color: C.text, padding: 12, borderRadius: 2, textAlign: "left", cursor: "pointer", fontFamily: "inherit" }}>
              <div style={{ fontWeight: 700, fontFamily: "'Cinzel', serif", fontSize: 13 }}>▸ {o.label}</div>
              <div className="mono" style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>{effectsToText(o.effects)}</div>
            </button>
          ))}
        </div>
      </div>
    </Overlay>
  );
}

function QBRModal({ qbr, dispatch, state }) {
  const inQ = ((state.quarter - 2 + 4) % 4) + 1; // QBR del trimestre que acaba de cerrar
  return (
    <Overlay>
      <div style={modalStyle(640)}>
        <div className="cinzel" style={{ color: C.gold, fontSize: 14, letterSpacing: 3, fontWeight: 700 }}>📊 QUARTERLY BUSINESS REVIEW</div>
        <div className="cinzel" style={{ fontSize: 22, fontWeight: 700, marginTop: 6, color: C.parchment }}>Cierre de Q{inQ}</div>
        <div style={{ fontSize: 14, color: C.parchment, marginTop: 8, lineHeight: 1.5 }}>
          El board te recibe. Cumpliste <span style={{ color: C.jade, fontWeight: 700 }}>{qbr.metCount}</span> de {qbr.metCount + qbr.missedCount} OKRs.
          {qbr.metCount >= 2 && <span style={{ color: C.jade }}> ✓ Bonus: +€80 y +6 visión.</span>}
          {qbr.missedCount === 3 && <span style={{ color: C.crimson }}> ⚠ Penalización: -€60.</span>}
        </div>
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 5 }}>
          {qbr.oldOKRs.map((o) => (
            <div key={o.id} style={{ padding: "6px 10px", background: C.panel2, borderLeft: `3px solid ${o.status === "met" ? C.jade : C.crimson}`, borderRadius: 2, fontSize: 12 }}>
              <span style={{ color: o.status === "met" ? C.jade : C.crimson, fontWeight: 700, marginRight: 6 }}>{o.status === "met" ? "✓" : "✗"}</span>
              {o.label}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14, padding: 10, background: C.panel2, border: `1px solid ${C.gold}`, borderRadius: 2 }}>
          <div className="cinzel" style={{ fontSize: 11, color: C.gold, letterSpacing: 1.5 }}>NUEVO TRIMESTRE — OKRs Q{((state.quarter - 1) % 4) + 1}</div>
          {state.okrs.map((okr) => (
            <div key={okr.id} style={{ fontSize: 12, color: C.parchment, marginTop: 4 }}>○ {okr.label}</div>
          ))}
        </div>
        <button onClick={() => dispatch({ type: "CLOSE_QBR" })} style={{ ...primaryBtn(C.gold), marginTop: 16, padding: "10px", fontSize: 13 }}>
          Continuar a Performance Reviews →
        </button>
      </div>
    </Overlay>
  );
}

function ReviewModal({ state, dispatch }) {
  const [decisions, setDecisions] = useState({});
  const setD = (uid, val) => setDecisions((d) => ({ ...d, [uid]: val }));
  const allDecided = state.team.every((u) => decisions[u.id]);

  return (
    <Overlay>
      <div style={modalStyle(720)}>
        <div className="cinzel" style={{ color: C.gold, fontSize: 14, letterSpacing: 3, fontWeight: 700 }}>👤 PERFORMANCE REVIEWS</div>
        <div className="cinzel" style={{ fontSize: 22, fontWeight: 700, marginTop: 6, color: C.parchment }}>Calibración trimestral</div>
        <div style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>Decide acción para cada persona. Esto afecta nómina, lealtad y stakeholders.</div>

        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
          {state.team.map((u) => {
            const r = ROLES[u.role];
            const opts = [
              { id: "promote", label: "Promover", color: C.gold, desc: "+nivel, +loyalty, salario sube", disabled: u.level >= 3 },
              { id: "raise", label: "Subida (€40)", color: C.jade, desc: "+loyalty alto, cuesta €40" },
              { id: "keep", label: "Mantener", color: C.steel, desc: "Sin cambio" },
              { id: "pip", label: "PIP", color: C.ember, desc: "-loyalty, +trust Exec" },
              { id: "fire", label: "Despedir", color: C.crimson, desc: "Fuera. +trust CFO" },
            ];
            return (
              <div key={u.id} style={{ background: C.panel2, border: `1px solid ${C.border}`, borderLeft: `3px solid ${r.color}`, borderRadius: 2, padding: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Sprite type={r.sprite} color={r.color} size={36} level={u.level} animate={false} />
                  <div style={{ flex: 1 }}>
                    <div className="cinzel" style={{ fontSize: 12, fontWeight: 700, color: r.color }}>{r.label}</div>
                    <div className="mono" style={{ fontSize: 10, color: C.muted }}>{["Jr", "Sr", "Lead"][u.level - 1]} · Perf {Math.round(u.performance)} · Loy {Math.round(u.loyalty)}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 4, marginTop: 8, flexWrap: "wrap" }}>
                  {opts.map((opt) => (
                    <button key={opt.id} disabled={opt.disabled} onClick={() => setD(u.id, opt.id)} title={opt.desc}
                      style={{ background: decisions[u.id] === opt.id ? opt.color : C.panel, border: `1px solid ${opt.color}`, color: decisions[u.id] === opt.id ? C.bg : opt.color, padding: "4px 8px", borderRadius: 2, fontSize: 11, fontWeight: 600, cursor: opt.disabled ? "not-allowed" : "pointer", opacity: opt.disabled ? 0.4 : 1 }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <button onClick={() => dispatch({ type: "RESOLVE_REVIEWS", decisions })} disabled={!allDecided} style={{ ...primaryBtn(C.gold), marginTop: 14, padding: "10px", fontSize: 13 }}>
          {allDecided ? "Aplicar decisiones" : `Decide ${state.team.length - Object.keys(decisions).length} pendientes`}
        </button>
      </div>
    </Overlay>
  );
}

function GameOverModal({ state, dispatch }) {
  const win = state.gameOver === "win";
  return (
    <Overlay>
      <div style={{ ...modalStyle(560), borderColor: win ? C.gold : C.crimson, textAlign: "center" }}>
        <div className="cinzel" style={{ fontSize: 36, color: win ? C.gold : C.crimson, letterSpacing: 4, fontWeight: 900 }}>{win ? "🏆 VICTORIA" : "☠ GAME OVER"}</div>
        <div className="cinzel" style={{ fontSize: 18, fontWeight: 700, color: C.parchment, marginTop: 10 }}>{state.gameOverReason}</div>
        <div style={{ marginTop: 18, padding: 14, background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 2, textAlign: "left" }}>
          <div className="cinzel" style={{ color: C.gold, fontSize: 11, letterSpacing: 1.5, marginBottom: 8 }}>RESUMEN DE LA PARTIDA</div>
          <div className="mono" style={{ fontSize: 12, color: C.parchment, lineHeight: 1.7 }}>
            Turno: T{state.turn} · Q{((state.quarter - 1) % 4) + 1} año {state.year}<br />
            Era alcanzada: {ERAS[state.era - 1].name}<br />
            Proyectos completados: {state.completedProjects.length}<br />
            Programas completados: {state.completedPrograms.length}<br />
            Equipo final: {state.team.length} miembros<br />
            Confianza Comité Ejec: {Math.round(state.stakeholders.executive.trust)}<br />
            Visión estratégica acumulada: {fmt(state.resources.vision)}
          </div>
        </div>
        <button onClick={() => dispatch({ type: "RESET" })} style={{ ...primaryBtn(win ? C.gold : C.crimson), marginTop: 16, padding: "12px", fontSize: 14 }}>↻ Nueva partida</button>
      </div>
    </Overlay>
  );
}

/* ---------- GLOBAL STYLES ---------- */
function GlobalStyles() {
  return (
    <style>{`
      body { background: ${C.bg}; margin: 0; }
      button { font-family: inherit; cursor: pointer; transition: all 0.15s ease; }
      button:hover:not(:disabled) { transform: translateY(-1px); filter: brightness(1.1); }
      button:disabled { opacity: 0.4; cursor: not-allowed; }
      .cinzel { font-family: 'Cinzel', serif; }
      .mono { font-family: 'JetBrains Mono', monospace; }
      .pixel { font-family: 'VT323', monospace; }
      .pulse { animation: pulse 2s ease-in-out infinite; }
      @keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.5 } }
      @keyframes bob { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-2px) } }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px) } to { opacity: 1; transform: none } }
      .scrolly { scrollbar-width: thin; scrollbar-color: ${C.border} transparent; }
      .scrolly::-webkit-scrollbar { width: 6px; height: 6px; }
      .scrolly::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 3px; }
    `}</style>
  );
}

/* ---------- MAIN APP ---------- */
export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState, (init) => {
    try {
      const saved = localStorage.getItem("joaco-tycoon-v1");
      return saved ? { ...init, ...JSON.parse(saved) } : init;
    } catch { return init; }
  });
  useEffect(() => {
    try { localStorage.setItem("joaco-tycoon-v1", JSON.stringify(state)); } catch {}
  }, [state]);
  const [tab, setTab] = useState("portfolio");
  const [assigning, setAssigning] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (state.paused || state.gameOver || state.pendingEvent || state.pendingQBR || state.pendingReviews) return;
    const ms = state.speed === 1 ? 2500 : state.speed === 2 ? 1500 : 800;
    intervalRef.current = setInterval(() => dispatch({ type: "TICK" }), ms);
    return () => clearInterval(intervalRef.current);
  }, [state.paused, state.speed, state.gameOver, state.pendingEvent, state.pendingQBR, state.pendingReviews]);

  return (
    <div style={{ minHeight: "100vh", background: `radial-gradient(ellipse at top, #2a2218 0%, ${C.bg} 65%)`, color: C.text, fontFamily: "'Crimson Text', 'Cinzel', serif", paddingBottom: 30 }}>
      <style>{FONTS}</style>
      <GlobalStyles />
      <Header state={state} dispatch={dispatch} />
      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr 320px", gap: 14, padding: "14px 18px", maxWidth: 1600, margin: "0 auto" }}>
        <TeamPanel state={state} dispatch={dispatch} assigning={assigning} setAssigning={setAssigning} />
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <KingdomMap state={state} />
          <Tabs tab={tab} setTab={setTab} state={state} />
          {tab === "portfolio" && <PortfolioPanel state={state} dispatch={dispatch} assigning={assigning} setAssigning={setAssigning} />}
          {tab === "okrs" && <OKRPanel state={state} />}
          {tab === "build" && <BuildPanel state={state} dispatch={dispatch} />}
          {tab === "risks" && <RisksPanel state={state} dispatch={dispatch} />}
          {tab === "era" && <EraPanel state={state} dispatch={dispatch} />}
          {tab === "log" && <LogPanel state={state} />}
        </div>
        <StakeholdersPanel state={state} dispatch={dispatch} />
      </div>
      {state.pendingEvent && <EventModal event={state.pendingEvent} dispatch={dispatch} />}
      {state.pendingQBR && !state.pendingEvent && <QBRModal qbr={state.pendingQBR} dispatch={dispatch} state={state} />}
      {state.pendingReviews && !state.pendingEvent && !state.pendingQBR && <ReviewModal state={state} dispatch={dispatch} />}
      {state.gameOver && <GameOverModal state={state} dispatch={dispatch} />}
    </div>
  );
}
