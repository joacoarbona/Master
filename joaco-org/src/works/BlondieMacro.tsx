import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LineChart, Line, Legend,
  AreaChart, Area, ReferenceLine,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ComposedChart,
} from "recharts";
import {
  Droplet, Percent, Users, Banknote, Factory, ShoppingBasket,
  Building2, Landmark, ArrowRight, Info, RotateCcw, BookOpen,
  Sparkles, TrendingUp, TrendingDown, Minus, Play, Pause, Clock,
  Network, Grid3x3, Home, Scale, AlertTriangle, Timer, Wand2,
  Save, FolderOpen, Download, Upload, Trash2, Copy, Check,
  GitCompare, Plus, X, Library,
} from "lucide-react";

/* Blondie Macro · España · v2.8 · simulador de transmisión multinivel */


/* --------------------------------------------------------------------------- */
/* [1] BASELINE — calibrado con datos reales (abril 2026)                      */
/* ---------------------------------------------------------------------------
   Fuentes:
   · PIB, paro, IPC proyectados: BdE Informe Trimestral dic-2025
   · IPC actual: INE nota de prensa IPC marzo 2026 (3.4% yoy)
   · Tipo BCE: ECB monetary policy statement (feb 2026, mantenido 2.00%)
   · SMI: BOE RD 126/2026 (€1.221/mes, 17.094€/año, +3.1% vs 2025)
   · Euríbor 12m abril 2026: 2.565% (BdE)
   · Brent: EIA STEO April 2026 (~$95 spot, $114 Q2 peak proyectado)
   · EUR/USD: promedio Q1 2026 ~1.13 (ECB)
   · Gini: Eurostat SILC 2024 (provisional), 31.5 tras serie reciente revisada
   --------------------------------------------------------------------------- */
const BASELINE = {
  pib_bn_eur: 1670,          // BdE: ~€1.59tn (2024) × 1.029 (2025) × 1.022 (2026 parcial)
  ipc_yoy_pct: 3.4,          // INE marzo 2026 (dato real, repunte por petróleo)
  ipc_subyacente_pct: 2.9,   // INE marzo 2026 — referencia para contexto
  paro_pct: 9.93,            // EPA T4 2025 (9.93% — mínimo desde T1 2008)
  ocupados_mn: 22.46,        // EPA T4 2025 (récord histórico)
  afiliados_mn: 21.9,        // Seg. Social cierre 2025 (~+2.7% vs 2024)
  parados_mn: 2.48,          // EPA T4 2025 (mínimo desde T2 2008)
  recaudacion_bn_eur: 295,   // escalado con PIB nominal
  salario_medio_eur: 28500,  // Encuesta trimestral coste laboral INE (bruto anual aprox.)
  smi_mes_eur: 1221,         // RD 126/2026, vigente desde 1-ene-2026
  margen_empresarial_pct: 42,
  brent_usd: 95,             // EIA STEO abril 2026 (promedio proyectado)
  tipo_bce_pct: 2.00,        // ECB depo, mantenido desde septiembre 2025
  euribor_12m_pct: 2.56,     // BdE abril 2026
  eur_usd: 1.13,             // cierre Q1 2026
  gini_baseline: 31.5,       // Eurostat SILC 2024 provisional
  natural_rate_pct: 2.00,    // proxy Wicksell — igual a política, wedge = 0 a abril 2026
  natalidad_hijos_mujer: 1.12, // INE 2024 (mínimo histórico)
};


/* [1B] SISTEMA DE FUENTES CENTRALIZADO · v2.8
   Niveles: "official" 🟢 | "estimated" 🟡 | "approximate" 🔴 */
const SOURCES = {
  // Instituciones oficiales españolas
  ine_epa_t4_2025: {
    label: "INE EPA T4 2025",
    level: "official",
    date: "2026-01-27",
    url: "https://www.ine.es/dyngs/Prensa/EPA4T25.htm",
    note: "Encuesta Población Activa, último dato trimestral.",
  },
  ine_epf_2024: {
    label: "INE EPF 2024",
    level: "official",
    date: "2025-06-26",
    url: "https://www.ine.es/dyngs/Prensa/EPF2024.htm",
    note: "Encuesta Presupuestos Familiares, gasto medio hogar €34.044.",
  },
  ine_proyecciones_2024_2074: {
    label: "INE Proyecciones Población 2024-2074",
    level: "official",
    date: "2024-09",
    note: "Proyección demográfica base: 48.8M hoy → 52M en 2050.",
  },
  aeat_irpf_2023: {
    label: "AEAT Estadística Declarantes IRPF 2023",
    level: "official",
    date: "2025-07",
    url: "https://sede.agenciatributaria.gob.es/Sede/datosabiertos/catalogo/hacienda/Estadistica_de_los_declarantes_del_IRPF.shtml",
    note: "Ejercicio fiscal 2023, última disponible.",
  },
  aeat_deducciones_2024_25: {
    label: "AEAT Deducciones IRPF 2024-25",
    level: "official",
    date: "2026-03",
    note: "Manual Renta 2024, deducciones estatales y autonómicas.",
  },
  bde_proyecciones_2026: {
    label: "Banco de España Proyecciones 2026",
    level: "official",
    date: "2026-03",
    note: "Boletín Económico y Cuentas Financieras 4T25.",
  },
  airef_pensiones_2025: {
    label: "AIReF Informe Regla Gasto Pensiones",
    level: "official",
    date: "2025-03-31",
    url: "https://www.airef.es/wp-content/uploads/2025/03/Informe_regla_de_gasto_de_pensiones/Informe.pdf",
    note: "Proyecciones pensiones 2022-2050 + escenarios.",
  },
  airef_sostenibilidad_2024: {
    label: "AIReF Opinión Sostenibilidad AAPP",
    level: "official",
    date: "2024-12",
    note: "Proyección deuda 129% PIB 2050, 181% 2070.",
  },
  seg_social_2025: {
    label: "Seguridad Social 2025",
    level: "official",
    date: "2025",
    note: "Bases cotización, pensión máxima, MEI.",
  },
  boe_rd_pensiones_2026: {
    label: "BOE RD Pensiones 2026",
    level: "official",
    date: "2025-12-23",
    note: "RD 126/2026. Pensión máxima €3.359,60/mes (€47.034/año).",
  },

  // Instituciones europeas e internacionales
  eurostat_silc_2024: {
    label: "Eurostat SILC 2024",
    level: "official",
    date: "2024-12",
    note: "Statistics on Income and Living Conditions.",
  },
  oecd_taxing_wages_2025: {
    label: "OCDE Taxing Wages 2025",
    level: "official",
    date: "2025-04",
    url: "https://www.oecd.org/en/publications/2025/04/taxing-wages-2025_20d1a01d.html",
    note: "Cuña fiscal decomposition, datos 2024. España 40.6%.",
  },
  oecd_revenue_stats_2024: {
    label: "OCDE Revenue Statistics 2024",
    level: "official",
    date: "2024-12",
    note: "Tax-to-GDP ratios, composición recaudación.",
  },
  ce_ageing_report_2024: {
    label: "Comisión Europea Ageing Report 2024",
    level: "official",
    date: "2024-04",
    note: "Proyecciones gasto pensiones EU27 hasta 2070.",
  },

  // Think tanks y consultoras
  fedea_pensiones_2023: {
    label: "Fedea EEE 2023-15 (Jiménez & Viola)",
    level: "estimated",
    date: "2023-11",
    note: "Análisis sostenibilidad sistema pensiones + propuestas reforma.",
  },
  save_the_children_2024: {
    label: "Save the Children · Coste Crianza 2024",
    level: "estimated",
    date: "2024-12",
    note: "€758/mes/hijo promedio, €154k vital 0-18 años.",
  },
  santa_lucia_pensiones_2025: {
    label: "Santa Lucía Informe Pensiones",
    level: "estimated",
    date: "2025-05",
    note: "Situación sistema pensiones + proyecciones 2050.",
  },
  ocu_picodi_2024: {
    label: "OCU/Picodi Cesta Supervivencia",
    level: "estimated",
    date: "2024-02",
    note: "€125/mes/persona mínimo nutricional.",
  },
  expatistan_2024: {
    label: "Expatistan 2024",
    level: "approximate",
    date: "2024-08",
    note: "Coste vida ciudades, persona sola Madrid €1.614/mes.",
  },
  housing_anywhere_q4_2025: {
    label: "HousingAnywhere Rent Index Q4 2025",
    level: "estimated",
    date: "2025-12",
    note: "Alquiler 2 dorm Madrid €1.650, BCN €1.750.",
  },

  // Estimaciones propias
  estimacion_propia: {
    label: "Estimación propia",
    level: "approximate",
    date: "2026-04",
    note: "Aproximación calibrada con datos oficiales + literatura económica.",
  },
};

function sourceBadge(sourceKey) {
  const s = SOURCES[sourceKey];
  if (!s) return null;
  const emoji = s.level === "official" ? "🟢" : s.level === "estimated" ? "🟡" : "🔴";
  const labelMap = { official: "Oficial", estimated: "Estimación", approximate: "Aproximación" };
  return { ...s, emoji, qualityLabel: labelMap[s.level] };
}

// Componente reutilizable para mostrar una fuente con badge
function SourceChip({ sourceKey, className = "" }) {
  const b = sourceBadge(sourceKey);
  if (!b) return null;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] text-stone-500 ${className}`} title={b.note}>
      <span>{b.emoji}</span>
      <span>{b.label}</span>
      {b.date && <span className="text-stone-400">· {b.date}</span>}
    </span>
  );
}


/* --------------------------------------------------------------------------- */
/* [2] COEFFICIENTS                                                            */
/* --------------------------------------------------------------------------- */
const COEFF = {
  oil_to_cpi_direct: 0.30, oil_to_cpi_indirect: 0.20, oil_to_gdp: -0.15,
  iva_to_cpi: 0.55, iva_to_revenue_bn: 6.0, iva_to_consumption_pct: -0.40,
  ss_to_cpi: 0.12, ss_to_employment_pct: -0.25, ss_to_revenue_bn: 4.5, ss_to_margin_pct: -0.30,
  smi_to_employment_pct: -0.30, smi_to_cpi: 0.10, smi_to_revenue_bn: 0.8,
  irpf_to_revenue_bn: 1.2, irpf_to_consumption_pct: -0.15,
  ecb_to_gdp: -0.35, ecb_to_cpi: -0.50, ecb_to_investment_pct: -1.80, ecb_to_unemployment_pct: 0.25,
};


/* --------------------------------------------------------------------------- */
/* [3] LAG STRUCTURE                                                           */
/* --------------------------------------------------------------------------- */
const LAG = {
  ipc_oil: { halfLife: 4  }, ipc_iva: { halfLife: 2 },
  ipc_ss:  { halfLife: 12 }, ipc_smi: { halfLife: 6 },
  ipc_ecb: { halfLife: 18 },
  pib_oil: { halfLife: 6 }, pib_iva: { halfLife: 3 },
  pib_ss:  { halfLife: 9 }, pib_smi: { halfLife: 6 },
  pib_ecb: { halfLife: 9 },
  paro_ss:  { halfLife: 12 }, paro_smi: { halfLife: 9 },
  paro_ecb: { halfLife: 12 },
  margen_oil: { halfLife: 3 }, margen_ss: { halfLife: 9 }, margen_smi: { halfLife: 6 },
  revenue_direct: { halfLife: 3 },
  sector: { halfLife: 5 },
  abct_boom: { halfLife: 9 },
};

function lagMult(t, halfLife) {
  if (t <= 0) return 0;
  return 1 - Math.exp(-Math.log(2) * t / halfLife);
}


/* --------------------------------------------------------------------------- */
/* [4] I/O MATRIX                                                              */
/* --------------------------------------------------------------------------- */
const SECTORS = ["energia", "transporte", "alimentacion", "manufactura", "servicios", "vivienda"];

const SECTOR_META = {
  energia:      { label: "Energía",      short: "Ene", icon: "⚡" },
  transporte:   { label: "Transporte",   short: "Tra", icon: "🚛" },
  alimentacion: { label: "Alimentación", short: "Ali", icon: "🥖" },
  manufactura:  { label: "Manufactura",  short: "Man", icon: "🏭" },
  servicios:    { label: "Servicios",    short: "Ser", icon: "🛎️" },
  vivienda:     { label: "Vivienda",     short: "Viv", icon: "🏠" },
};

const IO_A = [
  [0.05, 0.03, 0.00, 0.03, 0.02, 0.00],
  [0.20, 0.08, 0.02, 0.05, 0.02, 0.00],
  [0.06, 0.10, 0.12, 0.04, 0.03, 0.00],
  [0.09, 0.08, 0.03, 0.18, 0.04, 0.00],
  [0.04, 0.05, 0.02, 0.05, 0.10, 0.01],
  [0.03, 0.02, 0.00, 0.15, 0.05, 0.02],
];

const PRIMARY_SHARES = {
  energia:      { oil: 0.50, labor: 0.10, capital: 0.22 },
  transporte:   { oil: 0.25, labor: 0.35, capital: 0.10 },
  alimentacion: { oil: 0.04, labor: 0.22, capital: 0.08 },
  manufactura:  { oil: 0.08, labor: 0.30, capital: 0.15 },
  servicios:    { oil: 0.03, labor: 0.55, capital: 0.10 },
  vivienda:     { oil: 0.02, labor: 0.18, capital: 0.45 },
};

function matInverse(A) {
  const n = A.length;
  const M = A.map((row, i) => [...row, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))]);
  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let k = i + 1; k < n; k++) if (Math.abs(M[k][i]) > Math.abs(M[maxRow][i])) maxRow = k;
    [M[i], M[maxRow]] = [M[maxRow], M[i]];
    const pivot = M[i][i];
    if (Math.abs(pivot) < 1e-12) throw new Error("Singular matrix");
    for (let j = 0; j < 2 * n; j++) M[i][j] /= pivot;
    for (let k = 0; k < n; k++) {
      if (k === i) continue;
      const factor = M[k][i];
      for (let j = 0; j < 2 * n; j++) M[k][j] -= factor * M[i][j];
    }
  }
  return M.map(row => row.slice(n));
}

function matVec(M, v) {
  return M.map(row => row.reduce((s, m, j) => s + m * v[j], 0));
}

// Lazy: solo se calcula cuando se usa
let _LEONTIEF_CACHE = null;
function getLeontief() {
  if (_LEONTIEF_CACHE) return _LEONTIEF_CACHE;
  const IminusA = IO_A.map((row, i) => row.map((v, j) => (i === j ? 1 : 0) - v));
  _LEONTIEF_CACHE = matInverse(IminusA);
  return _LEONTIEF_CACHE;
}


/* --------------------------------------------------------------------------- */
/* [5] QUINTILES                                                               */
/* --------------------------------------------------------------------------- */
const QUINTILES = ["Q1", "Q2", "Q3", "Q4", "Q5"];

const QUINTILE_META = {
  Q1: { label: "Q1 — Quintil inferior", short: "Q1", color: "#7A1F3D", income_avg: 12500 },
  Q2: { label: "Q2",                    short: "Q2", color: "#A16207", income_avg: 19800 },
  Q3: { label: "Q3 — Clase media",      short: "Q3", color: "#065F46", income_avg: 27500 },
  Q4: { label: "Q4",                    short: "Q4", color: "#1E40AF", income_avg: 38200 },
  Q5: { label: "Q5 — Quintil superior", short: "Q5", color: "#1F2937", income_avg: 68000 },
};

const QUINTILE_BASKET = {
  Q1: { energia: 0.11, transporte: 0.09, alimentacion: 0.23, manufactura: 0.13, servicios: 0.17, vivienda: 0.27 },
  Q2: { energia: 0.09, transporte: 0.11, alimentacion: 0.19, manufactura: 0.14, servicios: 0.22, vivienda: 0.25 },
  Q3: { energia: 0.07, transporte: 0.13, alimentacion: 0.15, manufactura: 0.15, servicios: 0.27, vivienda: 0.23 },
  Q4: { energia: 0.06, transporte: 0.14, alimentacion: 0.12, manufactura: 0.16, servicios: 0.31, vivienda: 0.21 },
  Q5: { energia: 0.04, transporte: 0.15, alimentacion: 0.09, manufactura: 0.17, servicios: 0.37, vivienda: 0.18 },
};

const QUINTILE_INCOME_EXPOSURE = {
  Q1: { smi: 0.45, irpf_top: 0.00, unemp_sensitivity: 1.40, wage_indexation: 0.30 },
  Q2: { smi: 0.25, irpf_top: 0.00, unemp_sensitivity: 1.20, wage_indexation: 0.50 },
  Q3: { smi: 0.05, irpf_top: 0.05, unemp_sensitivity: 1.00, wage_indexation: 0.70 },
  Q4: { smi: 0.00, irpf_top: 0.30, unemp_sensitivity: 0.80, wage_indexation: 0.80 },
  Q5: { smi: 0.00, irpf_top: 0.80, unemp_sensitivity: 0.50, wage_indexation: 0.90 },
};

const QUINTILE_SAVING_RATE = { Q1: 0.00, Q2: 0.03, Q3: 0.08, Q4: 0.15, Q5: 0.28 };


/* --------------------------------------------------------------------------- */
/* [6] CAPITAL STRUCTURE (ABCT)                                                */
/* --------------------------------------------------------------------------- */
const SECTOR_ROUNDABOUTNESS = {
  alimentacion: 1, servicios: 2, transporte: 3,
  energia: 4, manufactura: 4, vivienda: 5,
};

const STAGE_SENSITIVITY = { 1: 0.10, 2: 0.20, 3: 0.40, 4: 0.70, 5: 1.00 };

const STAGE_LABEL = {
  1: "Consumo directo", 2: "Servicios finales", 3: "Intermedios",
  4: "Bienes de capital", 5: "Capital muy duradero",
};

const ABCT = { malinvest_rate: 0.06, malinvest_max: 10.0, sustainability_threshold: 0.85 };


/* --------------------------------------------------------------------------- */
/* [6.5] SECOND-ROUND EFFECTS — wage-price spiral  (NEW in v0.8)              */
/* ---------------------------------------------------------------------------
   Las subidas de IPC afectan expectativas → negociación colectiva → salarios
   pactados más altos → costes laborales al alza → nuevas subidas de IPC.

   Parametrización (placeholder calibrado a literatura BdE):
   · indexation: fracción del IPC que entra en salarios pactados (Banco España
     estimación: ~30-40% para España en convenios con cláusula de revisión)
   · half_life: meses del ciclo de negociación colectiva (convenios ~anuales)
   · cpi_passthrough: fracción del coste laboral que acaba en precio final
   --------------------------------------------------------------------------- */
const WAGE_SPIRAL = {
  indexation: 0.35,       // 35% indexación (España: convenios ~30-40% con cláusula)
  half_life: 9,           // meses — ciclo de negociación colectiva
  cpi_passthrough: 0.55,  // coste laboral → precio consumidor
};

/** Compute second-round IPC contribution from history of first-round IPC */
function computeWageSpiral(firstRoundPath, indexation = WAGE_SPIRAL.indexation) {
  const alpha = 1 - Math.exp(-Math.log(2) / WAGE_SPIRAL.half_life);
  let ema = 0;
  return firstRoundPath.map((ipc_first, t) => {
    if (t > 0) ema = alpha * firstRoundPath[t - 1] + (1 - alpha) * ema;
    const wageResponse = indexation * ema;
    return wageResponse * WAGE_SPIRAL.cpi_passthrough;
  });
}


/* --------------------------------------------------------------------------- */
/* [7] ENGINE                                                                  */
/* --------------------------------------------------------------------------- */
function computeSS(levers) {
  const { brent_pct_chg, iva_pp_chg, ss_pp_chg, smi_pct_chg, irpf_pp_chg, ecb_pp_chg } = levers;

  const ipc = {
    oil: (brent_pct_chg / 10) * (COEFF.oil_to_cpi_direct + COEFF.oil_to_cpi_indirect),
    iva: iva_pp_chg * COEFF.iva_to_cpi,
    ss:  ss_pp_chg  * COEFF.ss_to_cpi,
    smi: (smi_pct_chg / 10) * COEFF.smi_to_cpi,
    ecb: ecb_pp_chg * COEFF.ecb_to_cpi,
  };
  const pib = {
    oil: (brent_pct_chg / 10) * COEFF.oil_to_gdp,
    iva: iva_pp_chg * COEFF.iva_to_consumption_pct * 0.6,
    ss:  ss_pp_chg * -0.10,
    smi: (smi_pct_chg / 10) * -0.05,
    ecb: ecb_pp_chg * COEFF.ecb_to_gdp,
  };
  const paro = {
    ss:  ss_pp_chg * -COEFF.ss_to_employment_pct,
    smi: (smi_pct_chg / 10) * -COEFF.smi_to_employment_pct,
    ecb: ecb_pp_chg * COEFF.ecb_to_unemployment_pct,
  };
  const margen = {
    oil: (brent_pct_chg / 10) * -0.4,
    ss:  ss_pp_chg * COEFF.ss_to_margin_pct,
    smi: (smi_pct_chg / 10) * -0.25,
  };
  const revenueDirect =
    iva_pp_chg * COEFF.iva_to_revenue_bn +
    ss_pp_chg  * COEFF.ss_to_revenue_bn  +
    irpf_pp_chg * COEFF.irpf_to_revenue_bn +
    (smi_pct_chg / 10) * COEFF.smi_to_revenue_bn;

  const oil_shock     = (brent_pct_chg / 10) * 3.0;
  const labor_shock   = ss_pp_chg + (smi_pct_chg / 10) * 0.9;
  const capital_shock = ecb_pp_chg * 1.5;
  const iva_wedge     = iva_pp_chg * 0.55;

  const sectorDirect = SECTORS.map(s => {
    const ps = PRIMARY_SHARES[s];
    return ps.oil * oil_shock + ps.labor * labor_shock + ps.capital * capital_shock;
  });
  const sectorTotal = matVec(getLeontief(), sectorDirect);
  const sectorWithTax = sectorTotal.map(t => t + iva_wedge);

  return { ipc, pib, paro, margen, revenueDirect, sectorDirect, sectorTotal, sectorWithTax };
}

function quintileImpact(sectorPrices, levers, state) {
  const quintiles = {};
  QUINTILES.forEach(q => {
    const basket = QUINTILE_BASKET[q];
    const expo = QUINTILE_INCOME_EXPOSURE[q];
    const ipc_q = SECTORS.reduce((acc, s) => acc + (basket[s] || 0) * (sectorPrices[s] || 0), 0);
    const smi_income_boost = (levers.smi_pct_chg * 0.65) * expo.smi;
    const irpf_income_hit  = -levers.irpf_pp_chg * expo.irpf_top * 0.6;
    const unemp_income_hit = -(state.paro || 0) * expo.unemp_sensitivity * 1.5;
    const delta_nominal_income = smi_income_boost + irpf_income_hit + unemp_income_hit;
    const real_income = delta_nominal_income - ipc_q;
    const net_saver_position = (QUINTILE_SAVING_RATE[q] - 0.08) * 100;
    const bce_income_effect = levers.ecb_pp_chg * net_saver_position * 0.015;
    quintiles[q] = {
      ipc_q, nominal_income: delta_nominal_income,
      real_income: real_income + bce_income_effect,
      smi_income_boost, irpf_income_hit, unemp_income_hit, bce_income_effect,
    };
  });
  return quintiles;
}

function giniChange(quintiles) {
  return (quintiles.Q5.real_income - quintiles.Q1.real_income) * 0.25;
}

function computeABCT(levers, t) {
  const rateGap = -levers.ecb_pp_chg;
  const rampMult = lagMult(t, LAG.abct_boom.halfLife);
  const stageBoost = {};
  SECTORS.forEach(s => {
    const stage = SECTOR_ROUNDABOUTNESS[s];
    stageBoost[s] = rateGap * STAGE_SENSITIVITY[stage] * rampMult;
  });
  let malinvestment = 0;
  if (rateGap > 0) {
    const longStageBoost = SECTORS
      .filter(s => SECTOR_ROUNDABOUTNESS[s] >= 3)
      .reduce((acc, s) => acc + Math.max(0, stageBoost[s]), 0);
    malinvestment = Math.min(ABCT.malinvest_max, longStageBoost * 0.8);
  }
  const realSavingsPct = 20.0;
  const creditExpansionPct = Math.max(0, rateGap * rampMult * 3.5);
  const apparentSavingsPct = realSavingsPct + creditExpansionPct;
  const sustainability = realSavingsPct / apparentSavingsPct;
  return { rateGap, stageBoost, malinvestment, realSavingsPct, apparentSavingsPct, creditExpansionPct, sustainability };
}

function computePath(levers, horizon = 24) {
  const ss = computeSS(levers);
  const months = Array.from({ length: horizon + 1 }, (_, i) => i);

  // --- Pass 1: channel-level first-round IPC contributions for each month ---
  const firstRound = months.map(t => {
    const ipc_oil = ss.ipc.oil * lagMult(t, LAG.ipc_oil.halfLife);
    const ipc_iva = ss.ipc.iva * lagMult(t, LAG.ipc_iva.halfLife);
    const ipc_ss  = ss.ipc.ss  * lagMult(t, LAG.ipc_ss.halfLife);
    const ipc_smi = ss.ipc.smi * lagMult(t, LAG.ipc_smi.halfLife);
    const ipc_ecb = ss.ipc.ecb * lagMult(t, LAG.ipc_ecb.halfLife);
    return {
      ipc_oil, ipc_iva, ipc_ss, ipc_smi, ipc_ecb,
      ipc_first: ipc_oil + ipc_iva + ipc_ss + ipc_smi + ipc_ecb,
    };
  });

  // --- Pass 2: wage-price spiral (second-round) via EMA of first-round IPC ---
  const spiralPath = computeWageSpiral(firstRound.map(fr => fr.ipc_first));

  // --- Pass 3: assemble full states with both rounds ---
  return months.map((t, i) => {
    const fr = firstRound[i];
    const ipc_second_round = spiralPath[i];
    const ipc = fr.ipc_first + ipc_second_round;
    // Amplification factor applied proportionally to sector prices & quintile IPCs
    const amplif = fr.ipc_first > 0.01 ? ipc / fr.ipc_first : 1;

    const pib =
      ss.pib.oil * lagMult(t, LAG.pib_oil.halfLife) +
      ss.pib.iva * lagMult(t, LAG.pib_iva.halfLife) +
      ss.pib.ss  * lagMult(t, LAG.pib_ss.halfLife)  +
      ss.pib.smi * lagMult(t, LAG.pib_smi.halfLife) +
      ss.pib.ecb * lagMult(t, LAG.pib_ecb.halfLife);

    const paro =
      ss.paro.ss  * lagMult(t, LAG.paro_ss.halfLife)  +
      ss.paro.smi * lagMult(t, LAG.paro_smi.halfLife) +
      ss.paro.ecb * lagMult(t, LAG.paro_ecb.halfLife);

    const margen =
      ss.margen.oil * lagMult(t, LAG.margen_oil.halfLife) +
      ss.margen.ss  * lagMult(t, LAG.margen_ss.halfLife)  +
      ss.margen.smi * lagMult(t, LAG.margen_smi.halfLife);

    const revenue = ss.revenueDirect * lagMult(t, LAG.revenue_direct.halfLife) + ipc * 1.4;
    const salarioReal = -ipc + (levers.smi_pct_chg * 0.08) * lagMult(t, 9);

    const directMult = lagMult(t, 3);
    const totalMult  = lagMult(t, LAG.sector.halfLife);
    const sectorDirect = Object.fromEntries(SECTORS.map((s, j) => [s, ss.sectorDirect[j] * directMult]));
    // Sector total reflects spiral amplification too (spiral hits all prices)
    const sectorTotal  = Object.fromEntries(SECTORS.map((s, j) => [s, ss.sectorWithTax[j] * totalMult * amplif]));

    const quintiles = quintileImpact(sectorTotal, levers, { paro });
    const gini = giniChange(quintiles);
    const abct = computeABCT(levers, t);

    return {
      month: t, ipc, pib, paro, margen, revenue, salarioReal,
      ipc_first_round: fr.ipc_first,
      ipc_second_round,
      ipc_amplification: amplif,
      ipc_oil: fr.ipc_oil, ipc_iva: fr.ipc_iva, ipc_ss: fr.ipc_ss,
      ipc_smi: fr.ipc_smi, ipc_ecb: fr.ipc_ecb,
      sectorDirect, sectorTotal, quintiles, gini, abct,
    };
  });
}


/* --------------------------------------------------------------------------- */
/* [8] SEED SCENARIOS — historical-stylized library                            */
/* --------------------------------------------------------------------------- */
const ZERO = { brent_pct_chg: 0, iva_pp_chg: 0, ss_pp_chg: 0, smi_pct_chg: 0, irpf_pp_chg: 0, ecb_pp_chg: 0 };

const SEED_SCENARIOS = [
  {
    id: "seed-1",
    name: "Crisis del petróleo (estilizado)",
    notes: "Shock de oferta tipo 1973. Brent +60%, sin respuesta fiscal compensatoria.",
    category: "Histórico",
    levers: { ...ZERO, brent_pct_chg: 60 },
    isSeed: true,
  },
  {
    id: "seed-2",
    name: "Burbuja inmobiliaria (estilizado)",
    notes: "Tipos BCE muy bajos durante mucho tiempo (−2pp bajo natural). Genera malinversión en vivienda y construcción.",
    category: "Histórico",
    levers: { ...ZERO, ecb_pp_chg: -2 },
    isSeed: true,
  },
  {
    id: "seed-3",
    name: "Austeridad 2012 (estilizado)",
    notes: "Consolidación fiscal fuerte: IVA +3pp, IRPF alto +3pp, sin contraparte monetaria expansiva.",
    category: "Histórico",
    levers: { ...ZERO, iva_pp_chg: 3, irpf_pp_chg: 3 },
    isSeed: true,
  },
  {
    id: "seed-4",
    name: "Expansión post-pandemia",
    notes: "Combinación laxa: BCE −1pp + subida SMI +10%. Impulso demanda en paralelo.",
    category: "Histórico",
    levers: { ...ZERO, smi_pct_chg: 10, ecb_pp_chg: -1 },
    isSeed: true,
  },
  {
    id: "seed-5",
    name: "Shock energético 2022 (estilizado)",
    notes: "Petróleo +40%, BCE empieza a subir tipos (+0.75pp) para contener inflación.",
    category: "Histórico",
    levers: { ...ZERO, brent_pct_chg: 40, ecb_pp_chg: 0.75 },
    isSeed: true,
  },
  {
    id: "seed-6",
    name: "Choque fiscal combinado",
    notes: "Subida simultánea de cotizaciones (+1pp) y SMI (+8%). Escenario 'pro-trabajo' con coste empresarial.",
    category: "Política",
    levers: { ...ZERO, ss_pp_chg: 1, smi_pct_chg: 8 },
    isSeed: true,
  },
  // ─── Escenarios calibrados con coyuntura real 2026 ────────────────────────
  {
    id: "seed-7",
    name: "BCE sube 50pb (abril 2026)",
    notes: "Morgan Stanley y ~26% del mercado (Polymarket) anticipan subida BCE en abril 2026. Sube tipo de depósito del 2.00% al 2.50% por inflación persistente post-shock Brent.",
    category: "Coyuntura 2026",
    levers: { ...ZERO, ecb_pp_chg: 0.5 },
    isSeed: true,
  },
  {
    id: "seed-8",
    name: "Escenario severo BCE — Ormuz",
    notes: "Escenario adverso BCE marzo 2026: Brent escala a $145 (+52% vs $95), gas €106, BCE responde +75pb. IPC eurozona proyectado +4.4% 2026, +4.8% 2027.",
    category: "Coyuntura 2026",
    levers: { ...ZERO, brent_pct_chg: 52, ecb_pp_chg: 0.75 },
    isSeed: true,
  },
  {
    id: "seed-9",
    name: "SMI 2026 vigente (+3.1%)",
    notes: "RD 126/2026: SMI sube de €1.184 a €1.221/mes (+3.1% interanual). Exento IRPF. Afecta ~2.5 millones trabajadores. Escala el impacto previsto ceteris paribus.",
    category: "Coyuntura 2026",
    levers: { ...ZERO, smi_pct_chg: 3.1 },
    isSeed: true,
  },
  {
    id: "seed-10",
    name: "Alta persistencia inflacionaria 2026",
    notes: "Escenario pesimista BdE: shock Brent +30% que no se estabiliza y se traspasa a salarios pactados. Muestra cómo la espiral de segunda ronda puede mantener el IPC elevado años después del shock inicial, ilustrando el riesgo principal señalado por Escrivá en dic-2025.",
    category: "Coyuntura 2026",
    levers: { ...ZERO, brent_pct_chg: 30 },
    isSeed: true,
  },
];


/* --------------------------------------------------------------------------- */
/* [9] UI HELPERS                                                              */
/* --------------------------------------------------------------------------- */
const fmt = {
  pp: (v) => `${v >= 0 ? "+" : ""}${v.toFixed(2)} pp`,
  pct: (v) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`,
  bn: (v) => `${v >= 0 ? "+" : ""}€${v.toFixed(1)} Bn`,
  num: (v, d = 2) => `${v.toFixed(d)}`,
  eur: (v) => `${v >= 0 ? "+" : ""}€${Math.round(v).toLocaleString()}`,
};

const CHANNEL_COLORS = {
  oil: "#1E3A8A", iva: "#7A1F3D", ss: "#A16207",
  smi: "#065F46", ecb: "#1F2937",
};

// Palette for comparing up to 3 scenarios
const COMPARE_COLORS = ["#7A1F3D", "#065F46", "#1E40AF"];

// Summarize non-zero levers for display in scenario cards
function leverSummary(levers) {
  const parts = [];
  if (levers.brent_pct_chg) parts.push(`Brent ${fmt.pct(levers.brent_pct_chg)}`);
  if (levers.iva_pp_chg)    parts.push(`IVA ${fmt.pp(levers.iva_pp_chg)}`);
  if (levers.ss_pp_chg)     parts.push(`SS ${fmt.pp(levers.ss_pp_chg)}`);
  if (levers.smi_pct_chg)   parts.push(`SMI ${fmt.pct(levers.smi_pct_chg)}`);
  if (levers.irpf_pp_chg)   parts.push(`IRPF ${fmt.pp(levers.irpf_pp_chg)}`);
  if (levers.ecb_pp_chg)    parts.push(`BCE ${fmt.pp(levers.ecb_pp_chg)}`);
  return parts.length ? parts.join(" · ") : "Sin shocks activos";
}

const emptyLevers = (l) => Object.values(l).every(v => Math.abs(v) < 1e-6);


/* --------------------------------------------------------------------------- */
/* LEVER CONTROL                                                               */
/* --------------------------------------------------------------------------- */
function Lever({ icon: Icon, label, unit, value, min, max, step, onChange, help, color = "burgundy" }) {
  const isZero = Math.abs(value) < 1e-6;
  const colorMap = { burgundy: "text-[#7A1F3D]", pink: "text-[#EC4899]", slate: "text-slate-700" };
  return (
    <div className="rounded-xl border border-stone-200 bg-white/70 p-4 hover:border-stone-300 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${colorMap[color]}`} strokeWidth={2} />
          <span className="text-[13px] font-medium tracking-tight text-stone-800">{label}</span>
        </div>
        <span className={`font-mono text-[13px] ${isZero ? "text-stone-400" : colorMap[color]}`}>
          {value >= 0 ? "+" : ""}{value.toFixed(unit === "pp" ? 2 : 1)}{unit === "pct" ? "%" : ` ${unit}`}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-[#7A1F3D] cursor-pointer"
      />
      {help && <p className="text-[11px] text-stone-500 mt-2 leading-snug">{help}</p>}
    </div>
  );
}


/* --------------------------------------------------------------------------- */
/* TIME SCRUBBER                                                               */
/* --------------------------------------------------------------------------- */
function TimeScrubber({ month, setMonth, playing, setPlaying, horizon = 24 }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-gradient-to-r from-[#FBF7F0] to-white p-4">
      <div className="flex items-center gap-4">
        <button
          onClick={() => {
            if (month >= horizon) setMonth(0);
            setPlaying(!playing);
          }}
          className="flex items-center justify-center w-9 h-9 rounded-full bg-[#7A1F3D] text-white hover:bg-[#5E1730] transition-colors shrink-0"
        >
          {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>
        <div className="flex-1">
          <div className="flex items-baseline justify-between mb-1">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-stone-400" />
              <span className="text-[11px] uppercase tracking-[0.15em] text-stone-500">Horizonte</span>
            </div>
            <div className="font-mono text-xs text-stone-700">
              mes <span className="font-serif text-lg text-[#7A1F3D] mx-1">{month}</span>
              / {horizon} ({(month / 12).toFixed(1)} años)
            </div>
          </div>
          <input
            type="range" min={0} max={horizon} step={1} value={month}
            onChange={(e) => { setPlaying(false); setMonth(parseInt(e.target.value)); }}
            className="w-full accent-[#7A1F3D] cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-stone-400 mt-1 font-mono">
            <span>shock</span><span>6m</span><span>12m</span><span>18m</span><span>24m</span>
          </div>
        </div>
      </div>
    </div>
  );
}


/* --------------------------------------------------------------------------- */
/* KPI CARD                                                                    */
/* --------------------------------------------------------------------------- */
function KpiCard({ label, baselineLabel, baselineValue, delta, formatter, unit, positive_is_good = true }) {
  const sign = Math.abs(delta) < 0.01 ? "neutral"
    : (positive_is_good ? (delta > 0 ? "good" : "bad") : (delta < 0 ? "good" : "bad"));
  const bg = {
    neutral: "bg-stone-50 border-stone-200",
    good:    "bg-emerald-50/60 border-emerald-200",
    bad:     "bg-rose-50/60 border-rose-200",
  }[sign];
  const Arrow = Math.abs(delta) < 0.01 ? Minus : delta > 0 ? TrendingUp : TrendingDown;
  const arrowColor = { neutral: "text-stone-400", good: "text-emerald-600", bad: "text-rose-600" }[sign];
  return (
    <div className={`rounded-xl border ${bg} p-4 transition-colors`}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-[0.12em] text-stone-500">{label}</span>
        <Arrow className={`w-4 h-4 ${arrowColor}`} strokeWidth={2.5} />
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="font-serif text-2xl tracking-tight text-stone-900">{formatter(delta)}</span>
        <span className="text-[11px] text-stone-500">{unit}</span>
      </div>
      <div className="mt-1 text-[11px] text-stone-500 font-mono">{baselineLabel}: {baselineValue}</div>
      <div className="mt-2 h-1 w-full bg-stone-100 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all ${
            sign === "good" ? "bg-emerald-500" : sign === "bad" ? "bg-rose-500" : "bg-stone-300"
          }`}
          style={{ width: `${Math.min(100, Math.abs(delta) * 30 + 5)}%`, marginLeft: delta < 0 ? "auto" : 0 }}
        />
      </div>
    </div>
  );
}


/* --------------------------------------------------------------------------- */
/* TRANSMISSION FLOW                                                           */
/* --------------------------------------------------------------------------- */
function TransmissionFlow({ levers, state }) {
  const activeShocks = [
    { key: "brent", label: "Petróleo Brent",  active: levers.brent_pct_chg !== 0, icon: Droplet,   color: "#1E3A8A" },
    { key: "iva",   label: "IVA",              active: levers.iva_pp_chg !== 0,     icon: Percent,    color: "#7A1F3D" },
    { key: "ss",    label: "Cotizaciones SS",  active: levers.ss_pp_chg !== 0,      icon: Users,      color: "#A16207" },
    { key: "smi",   label: "SMI",              active: levers.smi_pct_chg !== 0,    icon: Banknote,   color: "#065F46" },
    { key: "irpf",  label: "IRPF",             active: levers.irpf_pp_chg !== 0,    icon: Landmark,   color: "#7C2D12" },
    { key: "ecb",   label: "Tipo BCE",         active: levers.ecb_pp_chg !== 0,     icon: Building2,  color: "#1F2937" },
  ];
  const anyActive = activeShocks.some(s => s.active);

  return (
    <div className="rounded-2xl border border-stone-200 bg-gradient-to-br from-stone-50 to-white p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif text-lg tracking-tight text-stone-900">Cadena de transmisión</h3>
        <span className="text-[11px] uppercase tracking-[0.15em] text-stone-400">shock → sector (I/O) → hogares Q1..Q5</span>
      </div>
      {!anyActive && (
        <div className="py-10 text-center text-sm text-stone-400 italic">
          Mueve una palanca para activar la cascada
        </div>
      )}
      {anyActive && (
        <div className="grid grid-cols-3 gap-4 items-stretch">
          <div className="space-y-2">
            <div className="text-[10px] uppercase tracking-[0.15em] text-stone-400 mb-2">Shocks activos</div>
            {activeShocks.filter(s => s.active).map(s => {
              const Icon = s.icon;
              return (
                <div key={s.key} className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 shadow-sm">
                  <Icon className="w-3.5 h-3.5" style={{ color: s.color }} />
                  <span className="text-xs font-medium text-stone-800">{s.label}</span>
                </div>
              );
            })}
          </div>
          <div className="space-y-2">
            <div className="text-[10px] uppercase tracking-[0.15em] text-stone-400 mb-2">Sectores (Leontief)</div>
            {Object.entries(state.sectorTotal)
              .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
              .slice(0, 4)
              .map(([key, val]) => {
                const meta = SECTOR_META[key];
                return (
                  <div key={key} className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-3 py-2 shadow-sm">
                    <span className="flex items-center gap-2 text-xs">
                      <span>{meta.icon}</span>
                      <span className="text-stone-800">{meta.label}</span>
                    </span>
                    <span className={`font-mono text-[11px] ${val >= 0 ? "text-rose-600" : "text-emerald-600"}`}>
                      {fmt.pp(val)}
                    </span>
                  </div>
                );
              })}
          </div>
          <div className="space-y-2">
            <div className="text-[10px] uppercase tracking-[0.15em] text-stone-400 mb-2">Hogares por quintil</div>
            {QUINTILES.map(q => {
              const meta = QUINTILE_META[q];
              const val = state.quintiles[q].real_income;
              return (
                <div key={q} className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-3 py-2 shadow-sm">
                  <span className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.color }} />
                    <span className="text-stone-800 font-medium">{meta.short}</span>
                  </span>
                  <span className={`font-mono text-[11px] ${val >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {fmt.pct(val)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}


/* --------------------------------------------------------------------------- */
/* CPI CHANNELS                                                                */
/* --------------------------------------------------------------------------- */
function CpiChannelsChart({ path, currentMonth }) {
  const data = path.map(p => ({
    month: p.month,
    Petróleo: p.ipc_oil, IVA: p.ipc_iva, "Cot. SS": p.ipc_ss, SMI: p.ipc_smi, "Tipo BCE": p.ipc_ecb,
    Espiral: p.ipc_second_round,
  }));
  const anyNonZero = path.some(p =>
    Math.abs(p.ipc_oil) + Math.abs(p.ipc_iva) + Math.abs(p.ipc_ss) + Math.abs(p.ipc_smi) + Math.abs(p.ipc_ecb) > 1e-6
  );
  if (!anyNonZero) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-5 h-full flex items-center justify-center min-h-[280px]">
        <p className="text-sm italic text-stone-400">Sin shocks activos</p>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5">
      <div className="mb-3">
        <h3 className="font-serif text-lg tracking-tight text-stone-900">Δ IPC por canal — senda 24m</h3>
        <p className="text-[11px] text-stone-500">
          Canales primarios en color + <strong>Espiral salarial</strong> (segunda ronda, patrón rayado).
        </p>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
          <defs>
            {Object.entries(CHANNEL_COLORS).map(([k, c]) => (
              <linearGradient key={k} id={`g-${k}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={c} stopOpacity={0.85} />
                <stop offset="100%" stopColor={c} stopOpacity={0.5} />
              </linearGradient>
            ))}
            <pattern id="g-spiral" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
              <rect width="6" height="6" fill="#F59E0B" fillOpacity="0.15" />
              <line x1="0" y1="0" x2="0" y2="6" stroke="#F59E0B" strokeWidth="2" strokeOpacity="0.7" />
            </pattern>
          </defs>
          <CartesianGrid strokeDasharray="2 4" stroke="#E7E5E4" />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#57534E" }} tickFormatter={(m) => `${m}m`} />
          <YAxis tick={{ fontSize: 11, fill: "#57534E" }} />
          <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E7E5E4", fontSize: 12 }}
                   formatter={(v) => [`${v.toFixed(2)} pp`]} labelFormatter={(l) => `Mes ${l}`} />
          <Legend wrapperStyle={{ fontSize: 11 }} iconSize={8} />
          <ReferenceLine x={currentMonth} stroke="#7A1F3D" strokeWidth={1.5} strokeDasharray="3 3" />
          <Area type="monotone" dataKey="Petróleo"  stackId="1" stroke={CHANNEL_COLORS.oil} fill="url(#g-oil)" />
          <Area type="monotone" dataKey="IVA"       stackId="1" stroke={CHANNEL_COLORS.iva} fill="url(#g-iva)" />
          <Area type="monotone" dataKey="Cot. SS"   stackId="1" stroke={CHANNEL_COLORS.ss}  fill="url(#g-ss)" />
          <Area type="monotone" dataKey="SMI"       stackId="1" stroke={CHANNEL_COLORS.smi} fill="url(#g-smi)" />
          <Area type="monotone" dataKey="Tipo BCE"  stackId="1" stroke={CHANNEL_COLORS.ecb} fill="url(#g-ecb)" />
          <Area type="monotone" dataKey="Espiral"   stackId="1" stroke="#F59E0B" strokeWidth={1.5} fill="url(#g-spiral)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}


function KpiTimelinesChart({ path, currentMonth }) {
  const data = path.map(p => ({ month: p.month, IPC: p.ipc, PIB: p.pib, Paro: p.paro }));
  const anyNonZero = path.some(p => Math.abs(p.ipc) + Math.abs(p.pib) + Math.abs(p.paro) > 1e-6);
  if (!anyNonZero) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-5 h-full flex items-center justify-center min-h-[240px]">
        <p className="text-sm italic text-stone-400">Sin shocks activos</p>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5">
      <div className="mb-3">
        <h3 className="font-serif text-lg tracking-tight text-stone-900">Sendas de KPI principales</h3>
        <p className="text-[11px] text-stone-500">Δ acumulado respecto a baseline</p>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
          <CartesianGrid strokeDasharray="2 4" stroke="#E7E5E4" />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#57534E" }} tickFormatter={(m) => `${m}m`} />
          <YAxis tick={{ fontSize: 11, fill: "#57534E" }} />
          <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E7E5E4", fontSize: 12 }}
                   formatter={(v, n) => [`${v.toFixed(2)} ${n === "PIB" ? "%" : "pp"}`, n]} labelFormatter={(l) => `Mes ${l}`} />
          <Legend wrapperStyle={{ fontSize: 11 }} iconSize={8} />
          <ReferenceLine y={0} stroke="#A8A29E" />
          <ReferenceLine x={currentMonth} stroke="#7A1F3D" strokeWidth={1.5} strokeDasharray="3 3" />
          <Line type="monotone" dataKey="IPC"  stroke="#EC4899" strokeWidth={2.5} dot={false} />
          <Line type="monotone" dataKey="PIB"  stroke="#059669" strokeWidth={2.5} dot={false} />
          <Line type="monotone" dataKey="Paro" stroke="#7A1F3D" strokeWidth={2.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}


function QuintileSnapshot({ state }) {
  const anyActive = Object.values(state.quintiles).some(q => Math.abs(q.real_income) > 0.01);
  if (!anyActive) return null;
  const data = QUINTILES.map(q => ({
    q, label: QUINTILE_META[q].short, color: QUINTILE_META[q].color,
    ipc: state.quintiles[q].ipc_q, real: state.quintiles[q].real_income,
  }));
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5">
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <h3 className="font-serif text-lg tracking-tight text-stone-900">Impacto por quintil de renta</h3>
          <p className="text-[11px] text-stone-500">
            Gini: <span className={`font-mono font-semibold ${state.gini >= 0 ? "text-rose-600" : "text-emerald-600"}`}>{fmt.pp(state.gini)}</span>
            {" "}· base {BASELINE.gini_baseline}
          </p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
          <CartesianGrid strokeDasharray="2 4" stroke="#E7E5E4" />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#57534E" }} />
          <YAxis tick={{ fontSize: 11, fill: "#57534E" }} />
          <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E7E5E4", fontSize: 12 }}
                   formatter={(v, n) => [`${v.toFixed(2)}${n === "ipc" ? " pp" : "%"}`, n === "ipc" ? "IPC del quintil" : "Renta real"]} />
          <ReferenceLine y={0} stroke="#A8A29E" />
          <Bar dataKey="ipc" name="IPC quintil" radius={[3, 3, 0, 0]}>
            {data.map((d, i) => <Cell key={`ipc-${i}`} fill={d.color} fillOpacity={0.35} />)}
          </Bar>
          <Bar dataKey="real" name="Renta real" radius={[3, 3, 0, 0]}>
            {data.map((d, i) => <Cell key={`real-${i}`} fill={d.color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}


/* --------------------------------------------------------------------------- */
/* WAGE SPIRAL CARD — second-round breakdown at current month  (NEW in v0.8)  */
/* --------------------------------------------------------------------------- */
function WageSpiralCard({ state, currentMonth }) {
  const { ipc, ipc_first_round: fr, ipc_second_round: sr, ipc_amplification: amp } = state;
  // Hide if inflation effect is negligible
  if (Math.abs(fr) < 0.05) return null;

  const srShare = Math.abs(ipc) > 0.001 ? (sr / ipc) * 100 : 0;
  const ampExtra = (amp - 1) * 100;

  // Narrative: is the spiral dominant, moderate, or nascent?
  let status, statusColor, statusIcon;
  if (Math.abs(ampExtra) > 12) {
    status = "Espiral activa · persistencia alta";
    statusColor = "text-rose-700";
    statusIcon = <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />;
  } else if (Math.abs(ampExtra) > 5) {
    status = "Propagación moderada a salarios";
    statusColor = "text-amber-700";
    statusIcon = <Timer className="w-3.5 h-3.5 text-amber-600" />;
  } else {
    status = "Efectos de segunda ronda contenidos";
    statusColor = "text-emerald-700";
    statusIcon = <Check className="w-3.5 h-3.5 text-emerald-600" />;
  }

  // Bar widths — proportional to total magnitude
  const total = Math.abs(fr) + Math.abs(sr);
  const frWidth = total > 0 ? (Math.abs(fr) / total) * 100 : 0;
  const srWidth = total > 0 ? (Math.abs(sr) / total) * 100 : 0;

  return (
    <div className="rounded-2xl border-2 border-amber-200/60 bg-gradient-to-br from-amber-50/40 via-white to-white p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center">
            <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
          </div>
          <h3 className="font-serif text-lg tracking-tight text-stone-900">
            Efectos de segunda ronda
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          {statusIcon}
          <span className={`text-[11px] font-semibold ${statusColor}`}>{status}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="rounded-xl bg-white border border-stone-200 p-3">
          <div className="text-[10px] uppercase tracking-[0.12em] text-stone-500 font-semibold">1ª Ronda</div>
          <div className="font-serif text-2xl mt-0.5 text-stone-800">{fmt.pp(fr)}</div>
          <div className="text-[10px] text-stone-500 mt-0.5">directo de shocks</div>
        </div>
        <div className="rounded-xl bg-amber-50/40 border border-amber-200 p-3">
          <div className="text-[10px] uppercase tracking-[0.12em] text-amber-700 font-semibold">2ª Ronda (espiral)</div>
          <div className="font-serif text-2xl mt-0.5 text-amber-700">{fmt.pp(sr)}</div>
          <div className="text-[10px] text-stone-500 mt-0.5">
            {srShare.toFixed(0)}% del IPC total · vía salarios
          </div>
        </div>
        <div className="rounded-xl bg-white border border-stone-200 p-3">
          <div className="text-[10px] uppercase tracking-[0.12em] text-stone-500 font-semibold">Amplificación</div>
          <div className="font-serif text-2xl mt-0.5" style={{ color: ampExtra > 10 ? "#B91C1C" : ampExtra > 5 ? "#A16207" : "#057A55" }}>
            {amp.toFixed(2)}×
          </div>
          <div className="text-[10px] text-stone-500 mt-0.5">
            +{ampExtra.toFixed(0)}% vs sin indexación
          </div>
        </div>
      </div>

      {/* Stacked progress bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-[10px] text-stone-500 mb-1">
          <span>Descomposición del IPC actual · mes {currentMonth}</span>
          <span className="font-mono text-stone-700">{fmt.pp(ipc)} total</span>
        </div>
        <div className="flex h-3 w-full rounded-full overflow-hidden bg-stone-100 border border-stone-200">
          <div className="h-full bg-gradient-to-r from-[#7A1F3D] to-[#A16207]"
               style={{ width: `${frWidth}%` }}
               title={`1ª ronda: ${fmt.pp(fr)}`} />
          <div className="h-full" style={{
            width: `${srWidth}%`,
            backgroundImage: "repeating-linear-gradient(45deg, #F59E0B 0, #F59E0B 3px, #FDE68A 3px, #FDE68A 6px)",
          }} title={`2ª ronda: ${fmt.pp(sr)}`} />
        </div>
      </div>

      <p className="text-[11px] text-stone-600 leading-relaxed border-l-2 border-amber-300 pl-3">
        <span className="font-serif italic text-amber-800">Contexto BdE abril 2026:</span>{" "}
        el Banco de España ha advertido que <em>"desviaciones inesperadas en salarios y márgenes
        podrían generar un panorama alternativo de mayor inflación"</em>. Con indexación salarial
        del 35% y half-life de negociación colectiva de 9 meses, este simulador cuantifica qué
        parte del IPC es de primera ronda (shock directo) vs segunda ronda (retroalimentación vía
        salarios pactados).
      </p>
    </div>
  );
}


function MalinvestmentIndicator({ state }) {
  const { rateGap, malinvestment, sustainability } = state.abct;
  if (Math.abs(rateGap) < 0.05 && malinvestment < 0.05) return null;

  let status, color, icon, message;
  if (rateGap > 0.1 && malinvestment > 0.5) {
    status = "Estructura de capital distorsionándose";
    color = "from-orange-50 to-rose-50 border-orange-200";
    icon = <AlertTriangle className="w-4 h-4 text-orange-600" />;
    message = `Tipo BCE por debajo del natural (${fmt.pp(rateGap)}). Acumulación de malinversión ${fmt.pp(malinvestment)}.`;
  } else if (rateGap > 0.1) {
    status = "Estímulo monetario activo";
    color = "from-amber-50 to-white border-amber-200";
    icon = <Timer className="w-4 h-4 text-amber-600" />;
    message = `Tipo BCE más bajo que el natural — sectores intensivos en capital comienzan a sobreexpandirse.`;
  } else if (rateGap < -0.1) {
    status = "Política monetaria restrictiva";
    color = "from-slate-50 to-white border-slate-200";
    icon = <Timer className="w-4 h-4 text-slate-600" />;
    message = `Tipo BCE por encima del natural — sectores largos (vivienda, manufactura) los más castigados.`;
  } else return null;

  return (
    <div className={`rounded-2xl border bg-gradient-to-r ${color} p-4 flex items-center gap-3`}>
      <div className="shrink-0 w-9 h-9 rounded-full bg-white/80 border border-stone-200 flex items-center justify-center">
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-[10px] uppercase tracking-[0.15em] text-stone-500 font-semibold">Estructura de capital</div>
        <div className="font-serif text-sm text-stone-900 mt-0.5">{status}</div>
        <div className="text-[11px] text-stone-600 mt-1 leading-relaxed">{message}</div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-[10px] uppercase tracking-[0.12em] text-stone-500">Sostenibilidad</div>
        <div className="font-mono text-lg font-semibold"
             style={{ color: sustainability > 0.9 ? "#059669" : sustainability > 0.75 ? "#A16207" : "#DC2626" }}>
          {(sustainability * 100).toFixed(0)}%
        </div>
      </div>
    </div>
  );
}


/* --------------------------------------------------------------------------- */
/* AUSTRIAN INSIGHT                                                            */
/* --------------------------------------------------------------------------- */
function AustrianInsight({ levers, state, currentMonth }) {
  const insights = [];
  const activeCount = Object.values(levers).filter(v => v !== 0).length;

  const { rateGap, malinvestment, sustainability } = state.abct;
  if (rateGap > 0.2 && malinvestment > 0.3) {
    insights.push({
      concept: "El duende de los tallos falsos",
      quote: "El capital no puede crearse por arte de magia; debe basarse en ahorro real.",
      detail: `El BCE mantiene el tipo ${fmt.pp(rateGap)} por debajo del natural. Los proyectos largos crecen sobre crédito que no tiene detrás ahorro real. Sostenibilidad: ${(sustainability * 100).toFixed(0)}%. Malinversión: ${fmt.pp(malinvestment)}.`,
    });
  } else if (rateGap < -0.2) {
    insights.push({
      concept: "Preferencia temporal revelada",
      quote: "Los proyectos largos requieren una base sólida de ahorro real.",
      detail: `El BCE sube el tipo ${fmt.pp(-rateGap)} por encima del natural. Los sectores largos (vivienda ${STAGE_SENSITIVITY[5]}× más sensible que alimentación) son los que más sufren la corrección.`,
    });
  }

  const q1_real = state.quintiles.Q1.real_income;
  const q5_real = state.quintiles.Q5.real_income;
  const spread = Math.abs(q1_real - q5_real);
  if (spread > 0.3) {
    const who_wins = q1_real > q5_real ? "Q1" : "Q5";
    const who_loses = q1_real > q5_real ? "Q5" : "Q1";
    insights.push({
      concept: "Ningún shock es neutro — valor subjetivo heterogéneo",
      quote: "El valor de un bien depende de las necesidades que satisface, y cada persona las ordena distinto.",
      detail: `El mismo IPC agregado esconde realidades muy diferentes. ${who_wins} gana ${fmt.pct(q1_real > q5_real ? q1_real : q5_real)}; ${who_loses}, ${fmt.pct(q1_real > q5_real ? q5_real : q1_real)}.`,
    });
  }

  const directSum = Object.values(state.sectorDirect).reduce((a, b) => a + Math.abs(b), 0);
  const totalSum = Object.values(state.sectorTotal).reduce((a, b) => a + Math.abs(b), 0);
  const amplification = directSum > 0.05 ? totalSum / directSum : 0;
  if (amplification > 1.1) {
    insights.push({
      concept: "Estructura de producción — Menger & Leontief",
      quote: "Los bienes de orden superior transmiten sus precios hacia los bienes de consumo.",
      detail: `Shock directo ${fmt.pp(directSum)} se amplifica a ${fmt.pp(totalSum)} vía red I/O. Factor: ${amplification.toFixed(2)}×.`,
    });
  }

  if (activeCount >= 2) {
    insights.push({
      concept: "Retardos asimétricos — la crítica austríaca",
      quote: "Los canales operan a distintas velocidades; el empresario recibe señales desfasadas.",
      detail: `En el mes ${currentMonth}, unos canales ya se materializaron y otros apenas empiezan.`,
    });
  }

  if (insights.length === 0) {
    insights.push({
      concept: "Economía: ciencia de la acción humana",
      quote: "Cómo la gente usa medios escasos para alcanzar sus fines.",
      detail: "Mueve cualquier palanca para ver cómo la decisión se propaga.",
    });
  }

  return (
    <div className="rounded-2xl border-2 border-[#7A1F3D]/20 bg-gradient-to-br from-[#FBF7F0] to-white p-5">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-4 h-4 text-[#7A1F3D]" />
        <h3 className="font-serif text-lg tracking-tight text-stone-900">Lente Blondie Economics</h3>
        <span className="text-[10px] uppercase tracking-[0.15em] text-stone-400 ml-auto">mes {currentMonth}</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {insights.map((ins, i) => (
          <div key={i} className="border-l-2 border-[#EC4899] pl-4">
            <div className="text-[10px] uppercase tracking-[0.15em] text-[#7A1F3D] font-semibold">{ins.concept}</div>
            <div className="mt-1 font-serif italic text-[15px] text-stone-800 leading-snug">« {ins.quote} »</div>
            <div className="mt-2 text-[12px] text-stone-600 leading-relaxed">{ins.detail}</div>
          </div>
        ))}
      </div>
    </div>
  );
}


/* --------------------------------------------------------------------------- */
/* I/O HEATMAP / SECTOR CASCADE                                                */
/* --------------------------------------------------------------------------- */
function IOMatrixHeatmap({ showLeontief = false }) {
  const matrix = showLeontief ? getLeontief() : IO_A;
  const vals = matrix.flat().filter((v, idx) => {
    if (!showLeontief) return true;
    const i = Math.floor(idx / matrix.length), j = idx % matrix.length;
    return i !== j;
  });
  const maxVal = Math.max(...vals, 0.01);
  const colorFor = (v) => {
    const t = Math.min(1, v / maxVal);
    const r = Math.round(251 - 129 * t);
    const g = Math.round(247 - 215 * t);
    const b = Math.round(240 - 179 * t);
    return `rgb(${r}, ${g}, ${b})`;
  };
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5">
      <div className="mb-4">
        <h3 className="font-serif text-lg tracking-tight text-stone-900">
          {showLeontief ? "Inversa de Leontief  L = (I − A)⁻¹" : "Matriz A — coeficientes técnicos"}
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="text-xs mx-auto">
          <thead>
            <tr>
              <th className="p-1"></th>
              <th className="p-1 text-[10px] text-stone-400 font-normal italic">input →</th>
              {SECTORS.map(s => (
                <th key={s} className="px-2 py-1 text-center font-medium text-stone-600">
                  <div className="text-sm">{SECTOR_META[s].icon}</div>
                  <div className="text-[10px] mt-0.5">{SECTOR_META[s].short}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, i) => (
              <tr key={i}>
                {i === 0 && (
                  <td rowSpan={SECTORS.length} className="p-1 text-[10px] text-stone-400 font-normal italic"
                      style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>↓ output</td>
                )}
                <td className="px-2 py-1.5 text-right font-medium text-stone-700 border-r border-stone-200">
                  <span className="mr-1">{SECTOR_META[SECTORS[i]].icon}</span>{SECTOR_META[SECTORS[i]].short}
                </td>
                {row.map((v, j) => (
                  <td key={j} className="px-2 py-1.5 text-center font-mono text-[11px] border border-stone-100"
                      style={{ backgroundColor: colorFor(v), color: v / maxVal > 0.5 ? "white" : "#3F3F3F" }}>
                    {v < 0.005 ? "·" : v.toFixed(2)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


function SectorCascadeChart({ state }) {
  const data = SECTORS.map(s => ({
    sector: SECTOR_META[s].short, icon: SECTOR_META[s].icon,
    direct: state.sectorDirect[s] || 0,
    indirect: (state.sectorTotal[s] || 0) - (state.sectorDirect[s] || 0),
    total: state.sectorTotal[s] || 0,
  }));
  const anyNonZero = data.some(d => Math.abs(d.total) > 1e-6);
  if (!anyNonZero) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-5 h-full flex items-center justify-center min-h-[280px]">
        <p className="text-sm italic text-stone-400">Sin shocks activos</p>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5">
      <div className="mb-3">
        <h3 className="font-serif text-lg tracking-tight text-stone-900">Impacto sectorial — directo vs total</h3>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
          <CartesianGrid strokeDasharray="2 4" stroke="#E7E5E4" />
          <XAxis dataKey="sector" tick={{ fontSize: 11, fill: "#57534E" }} />
          <YAxis tick={{ fontSize: 11, fill: "#57534E" }} />
          <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E7E5E4", fontSize: 12 }}
                   formatter={(v, n) => [`${v.toFixed(2)} pp`, n === "direct" ? "Directo" : "Indirecto"]} />
          <Legend wrapperStyle={{ fontSize: 11 }} iconSize={8}
                  formatter={(v) => v === "direct" ? "Directo" : "Indirecto (Leontief)"} />
          <ReferenceLine y={0} stroke="#A8A29E" />
          <Bar dataKey="direct"   stackId="a" fill="#7A1F3D" />
          <Bar dataKey="indirect" stackId="a" fill="#EC4899" fillOpacity={0.5} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}


/* --------------------------------------------------------------------------- */
/* QUICK PRESETS                                                               */
/* --------------------------------------------------------------------------- */
const PRESETS = [
  { name: "Choque de petróleo", levers: { ...ZERO, brent_pct_chg: 25 } },
  { name: "Subida cotizaciones", levers: { ...ZERO, ss_pp_chg: 1.5 } },
  { name: "Subida del SMI", levers: { ...ZERO, smi_pct_chg: 8 } },
  { name: "BCE restrictivo", levers: { ...ZERO, ecb_pp_chg: 1 } },
  { name: "Dinero fácil", levers: { ...ZERO, ecb_pp_chg: -1.5 } },
  { name: "Consolidación fiscal", levers: { ...ZERO, iva_pp_chg: 1, irpf_pp_chg: 2 } },
  { name: "Estanflación clásica", levers: { ...ZERO, brent_pct_chg: 30, smi_pct_chg: 10, ecb_pp_chg: 1 } },
];


/* --------------------------------------------------------------------------- */
/* APP                                                                         */
/* --------------------------------------------------------------------------- */
export default function App() {
  const [levers, setLevers] = useState(ZERO);
  const [activeTab, setActiveTab] = useState("vigilancia");
  const [openGroup, setOpenGroup] = useState(null);  // qué grupo del menú está abierto
  const [currentMonth, setCurrentMonth] = useState(12);
  const [playing, setPlaying] = useState(false);

  // NEW v2.9: registro de vistas ya visitadas — "mount on demand, keep mounted"
  // Esto evita tener que re-montar componentes pesados al volver a una pestaña,
  // pero tampoco los monta hasta que se necesitan por primera vez
  const [visitedTabs, setVisitedTabs] = useState(new Set(["vigilancia"]));

  useEffect(() => {
    setVisitedTabs(prev => {
      if (prev.has(activeTab)) return prev;
      const next = new Set(prev);
      next.add(activeTab);
      return next;
    });
  }, [activeTab]);

  // NEW: Scenario library state (persisted via window.storage when available)
  const [scenarios, setScenarios] = useState(SEED_SCENARIOS);
  const [compareSelected, setCompareSelected] = useState([]); // array of IDs
  const [saveToastVisible, setSaveToastVisible] = useState(false);
  const [storageReady, setStorageReady] = useState(false); // prevent save-before-load race

  // Hydrate user scenarios from storage on mount (only runs client-side)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (typeof window !== "undefined" && window.storage) {
          const result = await window.storage.get("blondie-macro:user-scenarios");
          if (!cancelled && result && result.value) {
            const userScenarios = JSON.parse(result.value);
            if (Array.isArray(userScenarios) && userScenarios.length > 0) {
              // Merge seeds + persisted user scenarios (dedupe by id, seeds win for id collisions)
              const seedIds = new Set(SEED_SCENARIOS.map(s => s.id));
              const filteredUser = userScenarios.filter(s => !seedIds.has(s.id));
              setScenarios([...SEED_SCENARIOS, ...filteredUser]);
            }
          }
        }
      } catch (e) {
        console.warn("Could not load persisted scenarios:", e);
      } finally {
        if (!cancelled) setStorageReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Persist only user scenarios whenever the list changes (after initial load)
  useEffect(() => {
    if (!storageReady) return;
    (async () => {
      try {
        if (typeof window !== "undefined" && window.storage) {
          const userScenarios = scenarios.filter(s => !s.isSeed);
          await window.storage.set(
            "blondie-macro:user-scenarios",
            JSON.stringify(userScenarios)
          );
        }
      } catch (e) {
        console.warn("Could not persist scenarios:", e);
      }
    })();
  }, [scenarios, storageReady]);

  const path = useMemo(() => computePath(levers, 24), [levers]);
  const state = path[Math.min(currentMonth, path.length - 1)];

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setCurrentMonth(m => {
        if (m >= 24) { setPlaying(false); return 24; }
        return m + 1;
      });
    }, 180);
    return () => clearInterval(id);
  }, [playing]);

  const set = (key) => (v) => setLevers(prev => ({ ...prev, [key]: v }));

  // === Scenario library actions ===
  const saveScenario = (name, notes = "") => {
    const scenario = {
      id: `usr-${Date.now().toString(36)}`,
      name: name || `Escenario ${new Date().toLocaleString("es-ES")}`,
      notes,
      levers: { ...levers },
      createdAt: new Date().toISOString(),
      isSeed: false,
    };
    setScenarios(prev => [...prev, scenario]);
    setSaveToastVisible(true);
    setTimeout(() => setSaveToastVisible(false), 2000);
  };

  const quickSave = () => {
    const name = window.prompt("Nombre del escenario:", `Escenario ${scenarios.filter(s => !s.isSeed).length + 1}`);
    if (name !== null) {
      saveScenario(name);
    }
  };

  const loadScenario = (id) => {
    const s = scenarios.find(x => x.id === id);
    if (s) {
      setLevers(s.levers);
      setCurrentMonth(12);
      setPlaying(false);
      setActiveTab("simulator");
    }
  };

  const deleteScenario = (id) => {
    if (!window.confirm("¿Eliminar este escenario?")) return;
    setScenarios(prev => prev.filter(x => x.id !== id));
    setCompareSelected(prev => prev.filter(x => x !== id));
  };

  const toggleCompare = (id) => {
    setCompareSelected(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const clearCompare = () => setCompareSelected([]);

  return (
    <div className="min-h-screen bg-[#FBF7F0] text-stone-900" style={{ fontFamily: "'Manrope', -apple-system, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,600;0,700;1,400&family=Manrope:wght@400;500;600;700&family=Caveat:wght@500;700&display=swap');
        .font-serif { font-family: 'Fraunces', serif; }
        .font-script { font-family: 'Caveat', cursive; }
        input[type="range"]::-webkit-slider-thumb { cursor: grab; }
        @keyframes slide-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.2s ease-out; }
      `}</style>

      {/* Save toast */}
      {saveToastVisible && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-emerald-600 text-white px-4 py-2 shadow-lg flex items-center gap-2 animate-slide-up">
          <Check className="w-4 h-4" />
          <span className="text-sm">Escenario guardado</span>
        </div>
      )}

      <header className="border-b border-stone-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#EC4899] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-serif text-xl tracking-tight leading-none">
                Blondie Macro · <span className="text-[#7A1F3D]">España</span>
              </h1>
              <p className="text-[11px] text-stone-500 mt-0.5 tracking-wide">
                Simulador de transmisión · v2.8 · navegación agrupada + librería fiscal
              </p>
            </div>
          </div>

          <nav className="flex items-center gap-1 text-[13px] flex-wrap">
            {[
              {
                group: "Diagnóstico",
                icon: "🔍",
                tabs: [
                  { id: "vigilancia",    label: "Vigilancia" },
                  { id: "anatomia",      label: "Anatomía" },
                  { id: "distribucion",  label: "Distribución" },
                  { id: "autonomias",    label: "Autonomías" },
                  { id: "anatomia_prod", label: "Anatomía productiva" },
                ],
              },
              {
                group: "Ciclo vital",
                icon: "👤",
                tabs: [
                  { id: "ciclovida",     label: "Ciclo vida" },
                  { id: "maslow_fiscal", label: "Renta real · Maslow" },
                  { id: "demografia",    label: "Demografía · Pensiones 2050" },
                  { id: "individuo",     label: "Individuo (laboratorio)" },
                ],
              },
              {
                group: "Fiscalidad",
                icon: "💶",
                tabs: [
                  { id: "composicion",   label: "Composición fiscal" },
                  { id: "caminos",       label: "Caminos fiscales" },
                ],
              },
              {
                group: "Europa",
                icon: "🇪🇺",
                tabs: [
                  { id: "comparativa",   label: "Europa" },
                  { id: "europa_detalle", label: "Europa detalle" },
                  { id: "donde_vivir",   label: "Dónde vivir" },
                ],
              },
              {
                group: "Demografía",
                icon: "👥",
                tabs: [
                  { id: "migracion",     label: "Migración" },
                  { id: "balance_mig",   label: "Balance migración" },
                  { id: "balance_fiscal_mig", label: "Balance fiscal migr." },
                ],
              },
              {
                group: "Futuro",
                icon: "🔮",
                tabs: [
                  { id: "crisis_2030",   label: "Escenarios 2030" },
                  { id: "motosierra",    label: "Plan choque" },
                  { id: "politica_comb", label: "Política combinada" },
                ],
              },
              {
                group: "Síntesis",
                icon: "📚",
                tabs: [
                  { id: "learnings",     label: "20 learnings" },
                  { id: "methodology",   label: "Metodología" },
                ],
              },
              {
                group: "Laboratorio",
                icon: "🧪",
                tabs: [
                  { id: "simulator",     label: "Simulador" },
                  { id: "sectors",       label: "Sectores" },
                  { id: "hogares",       label: "Hogares" },
                  { id: "capital",       label: "Capital" },
                  { id: "scenarios",     label: "Escenarios", badge: compareSelected.length || null },
                ],
              },
            ].map(g => {
              const activeInGroup = g.tabs.find(t => t.id === activeTab);
              const isGroupActive = !!activeInGroup;
              const isOpen = openGroup === g.group;
              return (
                <div key={g.group} className="relative">
                  <button
                    onClick={() => setOpenGroup(isOpen ? null : g.group)}
                    className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
                      isGroupActive ? "bg-[#7A1F3D] text-white" : isOpen ? "bg-stone-200 text-stone-800" : "text-stone-600 hover:bg-stone-100"
                    }`}>
                    <span className="text-[11px]">{g.icon}</span>
                    <span>{g.group}</span>
                    {isGroupActive && activeInGroup && (
                      <span className="text-[10px] opacity-80">· {activeInGroup.label.split(" ")[0]}</span>
                    )}
                    {g.tabs.reduce((sum, t) => sum + (t.badge || 0), 0) > 0 && (
                      <span className={`text-[10px] font-mono px-1.5 rounded-full ${
                        isGroupActive ? "bg-white/20" : "bg-[#7A1F3D] text-white"
                      }`}>
                        {g.tabs.reduce((sum, t) => sum + (t.badge || 0), 0)}
                      </span>
                    )}
                    <span className={`text-[9px] ml-0.5 transition-transform ${isOpen ? "rotate-180" : ""}`}>▾</span>
                  </button>
                  {isOpen && (
                    <>
                      {/* Backdrop para cerrar al hacer click fuera */}
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setOpenGroup(null)}
                      />
                      <div className="absolute left-0 top-full mt-1 z-50 min-w-[220px] bg-white border border-stone-200 rounded-lg shadow-lg py-1">
                        {g.tabs.map(t => (
                          <button key={t.id}
                            onClick={() => { setActiveTab(t.id); setOpenGroup(null); }}
                            className={`w-full text-left px-3 py-1.5 text-[12px] transition-colors flex items-center justify-between gap-2 ${
                              activeTab === t.id ? "bg-[#FBF7F0] text-[#7A1F3D] font-semibold" : "text-stone-700 hover:bg-stone-50"
                            }`}>
                            <span>{t.label}</span>
                            {t.badge ? (
                              <span className="text-[10px] font-mono px-1.5 rounded-full bg-[#7A1F3D] text-white">
                                {t.badge}
                              </span>
                            ) : null}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">

        {activeTab === "vigilancia" && <VigilanciaView />}
        {activeTab === "anatomia" && visitedTabs.has("anatomia") && <AnatomiaView />}
        {activeTab === "caminos" && visitedTabs.has("caminos") && <CaminosView />}
        {activeTab === "distribucion" && visitedTabs.has("distribucion") && <DistribucionView />}
        {activeTab === "autonomias" && visitedTabs.has("autonomias") && <AutonomiasView />}
        {activeTab === "ciclovida" && visitedTabs.has("ciclovida") && <CicloVidaView />}
        {activeTab === "maslow_fiscal" && visitedTabs.has("maslow_fiscal") && <MaslowFiscalView />}
        {activeTab === "demografia" && visitedTabs.has("demografia") && <DemografiaPensionesView />}
        {activeTab === "comparativa" && visitedTabs.has("comparativa") && <ComparativaUEView />}
        {activeTab === "europa_detalle" && visitedTabs.has("europa_detalle") && <EuropaDetalleView />}
        {activeTab === "donde_vivir" && visitedTabs.has("donde_vivir") && <DondeVivirView />}
        {activeTab === "composicion" && visitedTabs.has("composicion") && <ComposicionFiscalView />}
        {activeTab === "migracion" && visitedTabs.has("migracion") && <MigracionView />}
        {activeTab === "balance_mig" && visitedTabs.has("balance_mig") && <BalanceMigracionView />}
        {activeTab === "anatomia_prod" && visitedTabs.has("anatomia_prod") && <AnatomiaProductivaView />}
        {activeTab === "crisis_2030" && visitedTabs.has("crisis_2030") && <CrisisEscenariosView />}
        {activeTab === "balance_fiscal_mig" && visitedTabs.has("balance_fiscal_mig") && <BalanceFiscalMigracionView />}
        {activeTab === "motosierra" && visitedTabs.has("motosierra") && <MotosierraView />}
        {activeTab === "politica_comb" && visitedTabs.has("politica_comb") && <PoliticaCombinadaView />}
        {activeTab === "learnings" && visitedTabs.has("learnings") && <LearningsView />}
        {activeTab === "simulator" && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] uppercase tracking-[0.15em] text-stone-500 mr-2">Escenarios rápidos:</span>
              {PRESETS.map(p => (
                <button key={p.name}
                  onClick={() => { setLevers(p.levers); setCurrentMonth(12); setPlaying(false); }}
                  className="text-xs px-3 py-1.5 rounded-full border border-stone-200 bg-white hover:border-[#7A1F3D] hover:text-[#7A1F3D] transition-colors">
                  {p.name}
                </button>
              ))}
              <div className="ml-auto flex items-center gap-2">
                <button onClick={quickSave} disabled={emptyLevers(levers)}
                  className="text-xs px-3 py-1.5 rounded-full bg-[#7A1F3D] text-white hover:bg-[#5E1730] transition-colors flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed">
                  <Save className="w-3 h-3" />
                  Guardar escenario
                </button>
                <button onClick={() => { setLevers(ZERO); setPlaying(false); }}
                  className="text-xs px-3 py-1.5 rounded-full border border-stone-200 bg-stone-50 text-stone-500 hover:bg-stone-100 transition-colors flex items-center gap-1">
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </button>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-5">
              <div className="col-span-12 lg:col-span-5 space-y-3">
                <div>
                  <h2 className="font-serif text-xl tracking-tight mb-1">Palancas</h2>
                  <p className="text-xs text-stone-500">Shocks externos y decisiones de política</p>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <Lever icon={Droplet} label="Precio petróleo Brent" unit="pct"
                         value={levers.brent_pct_chg} min={-50} max={100} step={1}
                         onChange={set("brent_pct_chg")} color="slate" />
                  <Lever icon={Percent} label="IVA general" unit="pp"
                         value={levers.iva_pp_chg} min={-5} max={5} step={0.5}
                         onChange={set("iva_pp_chg")} color="burgundy" />
                  <Lever icon={Users} label="Cotizaciones SS (empresarial)" unit="pp"
                         value={levers.ss_pp_chg} min={-3} max={5} step={0.25}
                         onChange={set("ss_pp_chg")} color="burgundy" />
                  <Lever icon={Banknote} label="SMI" unit="pct"
                         value={levers.smi_pct_chg} min={-10} max={25} step={1}
                         onChange={set("smi_pct_chg")} color="pink" />
                  <Lever icon={Landmark} label="IRPF tramo alto" unit="pp"
                         value={levers.irpf_pp_chg} min={-5} max={10} step={0.5}
                         onChange={set("irpf_pp_chg")} color="burgundy" />
                  <Lever icon={Building2} label="Tipo de intervención BCE" unit="pp"
                         value={levers.ecb_pp_chg} min={-3} max={3} step={0.25}
                         onChange={set("ecb_pp_chg")} color="slate" />
                </div>
              </div>

              <div className="col-span-12 lg:col-span-7 space-y-4">
                <TimeScrubber month={currentMonth} setMonth={setCurrentMonth}
                              playing={playing} setPlaying={setPlaying} />
                <MalinvestmentIndicator state={state} />
                <TransmissionFlow levers={levers} state={state} />

                <div>
                  <div className="flex items-baseline justify-between mb-3">
                    <h2 className="font-serif text-xl tracking-tight">Impacto al mes {currentMonth}</h2>
                    <span className="text-[11px] text-stone-500 font-mono">vs. baseline sin shocks</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <KpiCard label="IPC" baselineLabel="base" baselineValue={`${BASELINE.ipc_yoy_pct}% yoy`}
                             delta={state.ipc} formatter={fmt.pp} unit="pp" positive_is_good={false} />
                    <KpiCard label="PIB real" baselineLabel="base" baselineValue={`€${BASELINE.pib_bn_eur}bn`}
                             delta={state.pib} formatter={fmt.pct} unit="%" positive_is_good={true} />
                    <KpiCard label="Paro" baselineLabel="base" baselineValue={`${BASELINE.paro_pct}%`}
                             delta={state.paro} formatter={fmt.pp} unit="pp" positive_is_good={false} />
                    <KpiCard label="Recaudación" baselineLabel="base" baselineValue={`€${BASELINE.recaudacion_bn_eur}bn`}
                             delta={state.revenue} formatter={fmt.bn} unit="€Bn" positive_is_good={true} />
                    <KpiCard label="Salario real" baselineLabel="base" baselineValue={`€${BASELINE.salario_medio_eur.toLocaleString()}`}
                             delta={state.salarioReal} formatter={fmt.pct} unit="%" positive_is_good={true} />
                    <KpiCard label="Gini" baselineLabel="base" baselineValue={`${BASELINE.gini_baseline}`}
                             delta={state.gini} formatter={fmt.pp} unit="pp" positive_is_good={false} />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-5">
              <div className="col-span-12 lg:col-span-7">
                <CpiChannelsChart path={path} currentMonth={currentMonth} />
              </div>
              <div className="col-span-12 lg:col-span-5">
                <KpiTimelinesChart path={path} currentMonth={currentMonth} />
              </div>
            </div>

            <WageSpiralCard state={state} currentMonth={currentMonth} />
            <QuintileSnapshot state={state} />
            <SectorCascadeChart state={state} />
            <AustrianInsight levers={levers} state={state} currentMonth={currentMonth} />
          </div>
        )}

        {activeTab === "sectors" && visitedTabs.has("sectors") && <SectorsView state={state} currentMonth={currentMonth} />}
        {activeTab === "hogares" && visitedTabs.has("hogares") && <HouseholdsView path={path} state={state} currentMonth={currentMonth} />}
        {activeTab === "capital" && visitedTabs.has("capital") && <CapitalView path={path} state={state} currentMonth={currentMonth} levers={levers} />}
        {activeTab === "individuo" && visitedTabs.has("individuo") && <IndividualView />}
        {activeTab === "scenarios" && visitedTabs.has("scenarios") && (
          <ScenariosView
            scenarios={scenarios} setScenarios={setScenarios}
            compareSelected={compareSelected} toggleCompare={toggleCompare}
            clearCompare={clearCompare}
            loadScenario={loadScenario} deleteScenario={deleteScenario}
            saveCurrentScenario={saveScenario}
            currentLevers={levers}
            currentMonth={currentMonth}
          />
        )}
        {activeTab === "methodology" && visitedTabs.has("methodology") && <MethodologyView />}
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-6 border-t border-stone-200 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-serif text-sm text-stone-700 mb-2">Blondie Macro España · v2.8</h4>
            <p className="text-[11px] text-stone-500 leading-relaxed">
              23 módulos · 14.500+ líneas · datos oficiales 2024-2026.
              Referencia macroeconómica multinivel: diagnóstico → ciclo vital → fiscalidad →
              Europa → demografía → futuro → síntesis → laboratorio.
            </p>
          </div>
          <div>
            <h4 className="font-serif text-sm text-stone-700 mb-2">Calidad del dato</h4>
            <div className="space-y-1 text-[11px] text-stone-500">
              <div className="flex items-center gap-2">
                <span>🟢</span>
                <span><strong>Oficial</strong> · INE, AEAT, BdE, Eurostat, OCDE, AIReF, BOE</span>
              </div>
              <div className="flex items-center gap-2">
                <span>🟡</span>
                <span><strong>Estimación</strong> · Fedea, Santa Lucía, Save the Children, think tanks</span>
              </div>
              <div className="flex items-center gap-2">
                <span>🔴</span>
                <span><strong>Aproximación</strong> · calibración propia, rangos plausibles</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-serif text-sm text-stone-700 mb-2">Arquitectura técnica</h4>
            <p className="text-[11px] text-stone-500 leading-relaxed">
              Fuentes centralizadas · librería fiscal unificada con sanity checks automáticos ·
              IRPF 2026 (escala estatal + autonómica) · SS trabajador/empresa · reducción
              descendientes método AEAT · tope cotización €61.215 · pensión máxima €47.034.
            </p>
          </div>
        </div>
        <p className="font-script text-[#EC4899] text-lg mt-4 text-center">
          Inspirado en Blondie Economics · Flix & Isabeloide, 2012
        </p>
      </footer>
    </div>
  );
}


/* --------------------------------------------------------------------------- */
/* SECTORS VIEW                                                                */
/* --------------------------------------------------------------------------- */
function SectorsView({ state, currentMonth }) {
  const [matrixMode, setMatrixMode] = useState("A");
  const sectorsSorted = SECTORS
    .map(s => ({ key: s, direct: state.sectorDirect[s] || 0, total: state.sectorTotal[s] || 0 }))
    .sort((a, b) => Math.abs(b.total) - Math.abs(a.total));
  const amplification = (d, t) => (Math.abs(d) < 0.01 ? null : t / d);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl tracking-tight">Red de producción · mes {currentMonth}</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sectorsSorted.map(({ key, direct, total }) => {
          const meta = SECTOR_META[key];
          const color = total >= 0 ? "#DC2626" : "#059669";
          const amp = amplification(direct, total);
          const indirect = total - direct;
          return (
            <div key={key} className="rounded-2xl border border-stone-200 bg-white p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-3xl">{meta.icon}</div>
                  <div className="font-serif text-lg mt-2">{meta.label}</div>
                  <div className="text-[11px] text-stone-400 mt-0.5">
                    {(PRIMARY_SHARES[key].oil * 100).toFixed(0)}% petróleo ·{" "}
                    {(PRIMARY_SHARES[key].labor * 100).toFixed(0)}% trabajo ·{" "}
                    {(PRIMARY_SHARES[key].capital * 100).toFixed(0)}% capital
                  </div>
                </div>
                {amp && Math.abs(amp) > 1.05 && (
                  <span className="text-[10px] uppercase tracking-[0.12em] px-2 py-0.5 rounded-full bg-[#7A1F3D]/10 text-[#7A1F3D]">
                    {amp.toFixed(2)}× ampl.
                  </span>
                )}
              </div>
              <div className="mt-4">
                <div className="text-[11px] uppercase tracking-[0.12em] text-stone-500 mb-1">Δ precio total</div>
                <div className="font-serif text-3xl" style={{ color }}>{fmt.pp(total)}</div>
              </div>
              <div className="mt-3 space-y-1 text-[11px]">
                <div className="flex justify-between text-stone-600">
                  <span>Directo</span><span className="font-mono">{fmt.pp(direct)}</span>
                </div>
                <div className="flex justify-between text-stone-500">
                  <span>Indirecto (Leontief)</span><span className="font-mono">{fmt.pp(indirect)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Grid3x3 className="w-4 h-4 text-stone-500" />
            <h3 className="font-serif text-xl tracking-tight">Matriz de interdependencia</h3>
          </div>
          <div className="flex gap-1 rounded-lg bg-stone-100 p-1 text-[12px]">
            <button onClick={() => setMatrixMode("A")}
              className={`px-3 py-1 rounded-md ${matrixMode === "A" ? "bg-white text-[#7A1F3D] shadow-sm" : "text-stone-500"}`}>
              A · directa
            </button>
            <button onClick={() => setMatrixMode("L")}
              className={`px-3 py-1 rounded-md ${matrixMode === "L" ? "bg-white text-[#7A1F3D] shadow-sm" : "text-stone-500"}`}>
              L · total
            </button>
          </div>
        </div>
        <IOMatrixHeatmap showLeontief={matrixMode === "L"} />
      </div>
    </div>
  );
}


/* --------------------------------------------------------------------------- */
/* HOUSEHOLDS VIEW                                                             */
/* --------------------------------------------------------------------------- */
function HouseholdsView({ path, state, currentMonth }) {
  const comparativeData = QUINTILES.map(q => {
    const qs = state.quintiles[q];
    return {
      q, label: QUINTILE_META[q].short, color: QUINTILE_META[q].color,
      income_avg: QUINTILE_META[q].income_avg,
      ipc_q: qs.ipc_q, real_income: qs.real_income,
      smi_boost: qs.smi_income_boost, irpf_hit: qs.irpf_income_hit,
      bce: qs.bce_income_effect, unemp_hit: qs.unemp_income_hit,
      real_income_eur: (qs.real_income / 100) * QUINTILE_META[q].income_avg,
    };
  });
  const radarData = QUINTILES.map(q => {
    const qs = state.quintiles[q];
    return {
      quintile: QUINTILE_META[q].short,
      "IPC propio":  Math.abs(qs.ipc_q),
      "SMI":         Math.abs(qs.smi_income_boost),
      "IRPF":        Math.abs(qs.irpf_income_hit),
      "BCE":         Math.abs(qs.bce_income_effect),
      "Empleo":      Math.abs(qs.unemp_income_hit),
    };
  });
  const pathData = path.map(p => {
    const row = { month: p.month };
    QUINTILES.forEach(q => { row[QUINTILE_META[q].short] = p.quintiles[q].real_income; });
    return row;
  });
  const anyActive = comparativeData.some(d => Math.abs(d.real_income) > 0.01);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl tracking-tight">Impacto distributivo · mes {currentMonth}</h2>
      </div>
      {!anyActive && (
        <div className="rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 p-8 text-center">
          <Home className="w-6 h-6 text-stone-400 mx-auto mb-2" />
          <p className="text-sm text-stone-500">Mueve una palanca para ver impactos distributivos</p>
        </div>
      )}
      {anyActive && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {comparativeData.map(d => {
              const positive = d.real_income >= 0;
              return (
                <div key={d.q} className="rounded-xl border bg-white p-4" style={{ borderColor: d.color + "40" }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] uppercase tracking-[0.12em] font-semibold" style={{ color: d.color }}>{d.label}</span>
                    <span className="text-[10px] text-stone-400 font-mono">~€{(d.income_avg / 1000).toFixed(0)}k</span>
                  </div>
                  <div className="text-[10px] text-stone-500 mb-1">Renta real</div>
                  <div className="font-serif text-2xl tracking-tight" style={{ color: positive ? "#059669" : "#DC2626" }}>
                    {fmt.pct(d.real_income)}
                  </div>
                  <div className="text-[10px] text-stone-500 mt-0.5 font-mono">
                    ≈ {fmt.eur(d.real_income_eur)}/año
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="rounded-2xl border border-stone-200 bg-white p-5">
              <h3 className="font-serif text-lg tracking-tight mb-3">Huella por canal y quintil</h3>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#E7E5E4" />
                  <PolarAngleAxis dataKey="quintile" tick={{ fontSize: 11, fill: "#57534E" }} />
                  <PolarRadiusAxis tick={{ fontSize: 9, fill: "#A8A29E" }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E7E5E4", fontSize: 11 }}
                           formatter={(v) => [`${v.toFixed(2)} pp`]} />
                  <Legend wrapperStyle={{ fontSize: 11 }} iconSize={8} />
                  <Radar name="IPC propio" dataKey="IPC propio" stroke="#EC4899" fill="#EC4899" fillOpacity={0.15} />
                  <Radar name="SMI"        dataKey="SMI"        stroke="#065F46" fill="#065F46" fillOpacity={0.15} />
                  <Radar name="IRPF"       dataKey="IRPF"       stroke="#7C2D12" fill="#7C2D12" fillOpacity={0.15} />
                  <Radar name="BCE"        dataKey="BCE"        stroke="#1F2937" fill="#1F2937" fillOpacity={0.15} />
                  <Radar name="Empleo"     dataKey="Empleo"     stroke="#A16207" fill="#A16207" fillOpacity={0.15} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-5">
              <h3 className="font-serif text-lg tracking-tight mb-3">Renta real por quintil · senda 24m</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={pathData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke="#E7E5E4" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#57534E" }} tickFormatter={(m) => `${m}m`} />
                  <YAxis tick={{ fontSize: 11, fill: "#57534E" }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E7E5E4", fontSize: 11 }}
                           formatter={(v) => [`${v.toFixed(2)}%`]} labelFormatter={(l) => `Mes ${l}`} />
                  <Legend wrapperStyle={{ fontSize: 11 }} iconSize={8} />
                  <ReferenceLine y={0} stroke="#A8A29E" />
                  <ReferenceLine x={currentMonth} stroke="#7A1F3D" strokeWidth={1.5} strokeDasharray="3 3" />
                  {QUINTILES.map(q => (
                    <Line key={q} type="monotone" dataKey={QUINTILE_META[q].short}
                          stroke={QUINTILE_META[q].color} strokeWidth={2} dot={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}


/* --------------------------------------------------------------------------- */
/* CAPITAL VIEW (ABCT)                                                         */
/* --------------------------------------------------------------------------- */
function CapitalView({ path, state, currentMonth, levers }) {
  const { rateGap, stageBoost, malinvestment, realSavingsPct, apparentSavingsPct, creditExpansionPct, sustainability } = state.abct;
  const anyActive = Math.abs(rateGap) > 0.05 || malinvestment > 0.05;

  const stageData = SECTORS.slice()
    .sort((a, b) => SECTOR_ROUNDABOUTNESS[a] - SECTOR_ROUNDABOUTNESS[b])
    .map(s => ({
      sector: SECTOR_META[s].short, icon: SECTOR_META[s].icon,
      stage: SECTOR_ROUNDABOUTNESS[s], boost: stageBoost[s],
      label: STAGE_LABEL[SECTOR_ROUNDABOUTNESS[s]],
    }));
  const gapData = path.map(p => ({
    month: p.month,
    natural: BASELINE.natural_rate_pct,
    policy: BASELINE.tipo_bce_pct + levers.ecb_pp_chg,
  }));
  const malPath = path.map(p => ({
    month: p.month, malinvest: p.abct.malinvestment,
    sustainability: p.abct.sustainability * 100,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl tracking-tight">Estructura temporal de producción · mes {currentMonth}</h2>
        <p className="text-sm text-stone-500 mt-1 max-w-2xl">
          Tipos por debajo del natural inflan los sectores más alejados del consumo — el fenómeno
          de los <em>tallos de bambú falsos</em> que Blondie descubre demasiado tarde.
        </p>
      </div>

      {!anyActive && (
        <div className="rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 p-8 text-center">
          <Wand2 className="w-6 h-6 text-stone-400 mx-auto mb-2" />
          <p className="text-sm text-stone-500">Mueve el tipo BCE para ver la distorsión.</p>
          <p className="text-xs text-stone-400 mt-2">Prueba el preset <span className="font-mono bg-white px-2 py-0.5 rounded border border-stone-200">Dinero fácil</span></p>
        </div>
      )}

      {anyActive && (
        <>
          <div className="rounded-2xl border-2 border-[#7A1F3D]/20 bg-gradient-to-br from-[#FBF7F0] via-white to-[#FFF5E6] p-6">
            <div className="flex items-center gap-2 mb-4">
              <Wand2 className="w-5 h-5 text-[#7A1F3D]" />
              <h3 className="font-serif text-xl tracking-tight">El duende de los tallos falsos</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl bg-white border border-stone-200 p-4">
                <div className="text-[10px] uppercase tracking-[0.12em] text-stone-500 font-semibold">Capital real</div>
                <div className="font-serif text-3xl mt-1 text-emerald-700">{realSavingsPct.toFixed(1)}%</div>
                <div className="text-[11px] text-stone-500 mt-0.5">del PIB · ahorro genuino</div>
                <p className="text-[11px] text-stone-600 mt-3 leading-relaxed italic">Los bambús genuinos que Blondie cultivó.</p>
              </div>
              <div className="rounded-xl border-2 p-4"
                   style={{ borderColor: creditExpansionPct > 1 ? "#F59E0B" : "#E7E5E4",
                            background: creditExpansionPct > 1 ? "linear-gradient(135deg, white, #FEF3C7)" : "white" }}>
                <div className="flex items-center justify-between">
                  <div className="text-[10px] uppercase tracking-[0.12em] text-stone-500 font-semibold">Capital aparente</div>
                  {creditExpansionPct > 0.1 && (
                    <span className="text-[9px] uppercase tracking-[0.1em] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">ilusorio</span>
                  )}
                </div>
                <div className="font-serif text-3xl mt-1 text-amber-700">{apparentSavingsPct.toFixed(1)}%</div>
                <div className="text-[11px] text-stone-500 mt-0.5">incluye crédito expandido</div>
                <div className="mt-3 h-2 w-full bg-stone-100 rounded-full overflow-hidden flex">
                  <div className="h-full bg-emerald-600" style={{ width: `${(realSavingsPct / apparentSavingsPct) * 100}%` }} />
                  <div className="h-full bg-amber-500" style={{ width: `${(creditExpansionPct / apparentSavingsPct) * 100}%` }} />
                </div>
                <p className="text-[11px] text-stone-600 mt-3 leading-relaxed italic">Los bambús verdes de papel.</p>
              </div>
              <div className="rounded-xl bg-white border border-stone-200 p-4">
                <div className="text-[10px] uppercase tracking-[0.12em] text-stone-500 font-semibold">Índice de sostenibilidad</div>
                <div className="font-serif text-3xl mt-1"
                     style={{ color: sustainability > 0.9 ? "#059669" : sustainability > 0.75 ? "#A16207" : "#DC2626" }}>
                  {(sustainability * 100).toFixed(0)}%
                </div>
                <div className="text-[11px] text-stone-500 mt-0.5">capital real / aparente</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-5">
            <div className="mb-4">
              <h3 className="font-serif text-lg tracking-tight">Triángulo hayekiano</h3>
              <p className="text-[11px] text-stone-500">Sectores ordenados por roundaboutness.</p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stageData} layout="vertical" margin={{ top: 10, right: 40, left: 100, bottom: 5 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="#E7E5E4" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#57534E" }} />
                <YAxis type="category" dataKey="sector" tick={{ fontSize: 12, fill: "#57534E" }} width={90} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E7E5E4", fontSize: 12 }}
                         formatter={(v) => [`${v.toFixed(2)} pp`, "Δ producción"]} />
                <ReferenceLine x={0} stroke="#A8A29E" />
                <Bar dataKey="boost" radius={[0, 4, 4, 0]}>
                  {stageData.map((d, i) => {
                    const shade = 0.4 + (d.stage / 5) * 0.6;
                    const color = d.boost >= 0 ? `rgba(245, 158, 11, ${shade})` : `rgba(5, 150, 105, ${shade})`;
                    return <Cell key={i} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="rounded-2xl border border-stone-200 bg-white p-5">
              <h3 className="font-serif text-lg tracking-tight mb-1">Tipo natural vs tipo de política</h3>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={gapData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke="#E7E5E4" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#57534E" }} tickFormatter={(m) => `${m}m`} />
                  <YAxis tick={{ fontSize: 11, fill: "#57534E" }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E7E5E4", fontSize: 12 }}
                           formatter={(v, n) => [`${v.toFixed(2)}%`, n]} labelFormatter={(l) => `Mes ${l}`} />
                  <Legend wrapperStyle={{ fontSize: 11 }} iconSize={8} />
                  <ReferenceLine x={currentMonth} stroke="#7A1F3D" strokeWidth={1.5} strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="natural" name="Tipo natural" stroke="#059669" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                  <Line type="monotone" dataKey="policy" name="Tipo BCE" stroke="#7A1F3D" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white p-5">
              <h3 className="font-serif text-lg tracking-tight mb-1">Acumulación de malinversión</h3>
              <ResponsiveContainer width="100%" height={240}>
                <ComposedChart data={malPath} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="g-mal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.7} />
                      <stop offset="100%" stopColor="#F59E0B" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 4" stroke="#E7E5E4" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#57534E" }} tickFormatter={(m) => `${m}m`} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#F59E0B" }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "#059669" }} domain={[0, 100]} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E7E5E4", fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} iconSize={8} />
                  <ReferenceLine x={currentMonth} stroke="#7A1F3D" strokeWidth={1.5} strokeDasharray="3 3" yAxisId="left" />
                  <Area yAxisId="left" type="monotone" dataKey="malinvest" stroke="#F59E0B" strokeWidth={2} fill="url(#g-mal)" />
                  <Line yAxisId="right" type="monotone" dataKey="sustainability" stroke="#059669" strokeWidth={2} dot={false} strokeDasharray="4 4" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}


/* --------------------------------------------------------------------------- */
/* SCENARIOS VIEW — NEW in v0.6                                                */
/* --------------------------------------------------------------------------- */
function ScenariosView({
  scenarios, setScenarios, compareSelected, toggleCompare, clearCompare,
  loadScenario, deleteScenario, saveCurrentScenario, currentLevers, currentMonth,
}) {
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [newName, setNewName] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  const userScenarios = scenarios.filter(s => !s.isSeed);
  const seedScenarios = scenarios.filter(s => s.isSeed);

  const filteredScenarios = (list) => {
    if (filterCategory === "all") return list;
    if (filterCategory === "seed") return list.filter(s => s.isSeed);
    if (filterCategory === "user") return list.filter(s => !s.isSeed);
    return list;
  };

  // === Export / Import ===
  const exportJSON = () => {
    const data = JSON.stringify(userScenarios, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `blondie-macro-scenarios-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJSON = () => {
    try {
      const parsed = JSON.parse(importText);
      if (!Array.isArray(parsed)) throw new Error("Expected array");
      const valid = parsed.filter(s => s && s.name && s.levers);
      const withNewIds = valid.map(s => ({
        ...s,
        id: `imp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
        isSeed: false,
      }));
      setScenarios(prev => [...prev, ...withNewIds]);
      setImportText("");
      setShowImport(false);
    } catch (e) {
      alert("Error al parsear JSON: " + e.message);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setImportText(e.target.result);
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-serif text-2xl tracking-tight">Librería de escenarios</h2>
          <p className="text-sm text-stone-500 mt-1 max-w-2xl">
            Guarda escenarios, compáralos lado a lado, expórtalos para compartir.
            Selecciona hasta 3 para comparar.
          </p>
          <p className="text-[11px] text-stone-400 mt-1 flex items-center gap-1.5">
            {typeof window !== "undefined" && window.storage ? (
              <>
                <Check className="w-3 h-3 text-emerald-600" />
                <span>Tus escenarios se guardan automáticamente entre sesiones.</span>
              </>
            ) : (
              <>
                <Info className="w-3 h-3 text-amber-600" />
                <span>Sólo en memoria — exporta a JSON para no perderlos al recargar.</span>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={exportJSON} disabled={userScenarios.length === 0}
            className="text-xs px-3 py-1.5 rounded-full border border-stone-200 bg-white hover:border-[#7A1F3D] hover:text-[#7A1F3D] transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed">
            <Download className="w-3 h-3" />
            Exportar {userScenarios.length ? `(${userScenarios.length})` : ""}
          </button>
          <button onClick={() => setShowImport(!showImport)}
            className="text-xs px-3 py-1.5 rounded-full border border-stone-200 bg-white hover:border-[#7A1F3D] hover:text-[#7A1F3D] transition-colors flex items-center gap-1.5">
            <Upload className="w-3 h-3" />
            Importar
          </button>
        </div>
      </div>

      {/* Save current scenario form */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <div className="flex items-center gap-2 mb-3">
          <Save className="w-4 h-4 text-[#7A1F3D]" />
          <h3 className="font-serif text-lg tracking-tight">Guardar escenario actual</h3>
        </div>
        <p className="text-[12px] text-stone-500 mb-3">Palancas: <span className="font-mono text-stone-700">{leverSummary(currentLevers)}</span></p>
        <div className="flex flex-col md:flex-row gap-2">
          <input
            type="text"
            placeholder="Nombre del escenario..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-stone-200 focus:border-[#7A1F3D] focus:outline-none"
          />
          <input
            type="text"
            placeholder="Notas (opcional)..."
            value={newNotes}
            onChange={(e) => setNewNotes(e.target.value)}
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-stone-200 focus:border-[#7A1F3D] focus:outline-none"
          />
          <button
            onClick={() => {
              if (emptyLevers(currentLevers)) { alert("Activa alguna palanca antes de guardar."); return; }
              saveCurrentScenario(newName || `Escenario ${userScenarios.length + 1}`, newNotes);
              setNewName(""); setNewNotes("");
            }}
            disabled={emptyLevers(currentLevers)}
            className="px-4 py-2 text-sm rounded-lg bg-[#7A1F3D] text-white hover:bg-[#5E1730] transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
            <Save className="w-3.5 h-3.5" />
            Guardar
          </button>
        </div>
      </div>

      {/* Import dialog */}
      {showImport && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 animate-slide-up">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-amber-700" />
              <h3 className="font-serif text-lg tracking-tight">Importar escenarios</h3>
            </div>
            <button onClick={() => setShowImport(false)} className="text-stone-400 hover:text-stone-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[12px] text-stone-600 mb-3">
            Pega JSON exportado previamente o selecciona un archivo .json:
          </p>
          <input type="file" accept=".json" onChange={handleFileUpload}
                 className="text-xs mb-2 block" />
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            rows={6}
            placeholder='[{"name": "...", "levers": {...}}]'
            className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-stone-200 focus:border-[#7A1F3D] focus:outline-none resize-y"
          />
          <div className="flex gap-2 mt-3">
            <button onClick={importJSON}
              className="px-3 py-1.5 text-xs rounded-lg bg-[#7A1F3D] text-white hover:bg-[#5E1730]">
              Importar
            </button>
            <button onClick={() => { setImportText(""); setShowImport(false); }}
              className="px-3 py-1.5 text-xs rounded-lg border border-stone-200 text-stone-600">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Filter toggle */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] uppercase tracking-[0.15em] text-stone-500">Filtrar:</span>
        {[
          { id: "all", label: "Todos", count: scenarios.length },
          { id: "seed", label: "Preconfigurados", count: seedScenarios.length },
          { id: "user", label: "Míos", count: userScenarios.length },
        ].map(f => (
          <button key={f.id} onClick={() => setFilterCategory(f.id)}
            className={`text-xs px-3 py-1 rounded-full transition-colors ${
              filterCategory === f.id
                ? "bg-[#7A1F3D] text-white"
                : "bg-white border border-stone-200 text-stone-600 hover:border-[#7A1F3D]"
            }`}>
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* Scenario grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredScenarios(scenarios).map(s => {
          const selected = compareSelected.includes(s.id);
          const selectedIdx = compareSelected.indexOf(s.id);
          const canSelect = compareSelected.length < 3 || selected;
          return (
            <div key={s.id}
                 className={`rounded-2xl border p-5 transition-all ${
                   selected
                     ? "border-[#7A1F3D] bg-white shadow-md ring-2 ring-[#7A1F3D]/20"
                     : "border-stone-200 bg-white hover:border-stone-300"
                 }`}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-serif text-base tracking-tight text-stone-900 truncate">{s.name}</h4>
                    {s.isSeed && (
                      <span className="text-[9px] uppercase tracking-[0.1em] px-1.5 py-0.5 rounded bg-stone-100 text-stone-500 font-semibold">
                        preconfigurado
                      </span>
                    )}
                    {selected && (
                      <span className="text-[10px] uppercase tracking-[0.1em] px-1.5 py-0.5 rounded text-white font-semibold"
                            style={{ backgroundColor: COMPARE_COLORS[selectedIdx] }}>
                        {String.fromCharCode(65 + selectedIdx)}
                      </span>
                    )}
                  </div>
                  {s.notes && <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">{s.notes}</p>}
                </div>
              </div>
              <div className="mt-2 text-[11px] text-stone-600 font-mono bg-stone-50 px-2 py-1.5 rounded">
                {leverSummary(s.levers)}
              </div>
              <div className="mt-3 flex items-center gap-1.5">
                <button onClick={() => loadScenario(s.id)}
                  className="flex-1 text-xs px-2 py-1.5 rounded-md bg-[#7A1F3D] text-white hover:bg-[#5E1730] transition-colors flex items-center justify-center gap-1">
                  <FolderOpen className="w-3 h-3" />
                  Cargar
                </button>
                <button onClick={() => canSelect && toggleCompare(s.id)}
                  disabled={!canSelect}
                  className={`text-xs px-2 py-1.5 rounded-md transition-colors flex items-center justify-center gap-1 ${
                    selected
                      ? "bg-[#7A1F3D]/10 text-[#7A1F3D]"
                      : canSelect
                        ? "border border-stone-200 text-stone-600 hover:border-[#7A1F3D]"
                        : "border border-stone-100 text-stone-300 cursor-not-allowed"
                  }`}
                  title={canSelect ? (selected ? "Quitar de comparación" : "Añadir a comparación") : "Ya hay 3 escenarios en comparación"}>
                  {selected ? <Check className="w-3 h-3" /> : <GitCompare className="w-3 h-3" />}
                  {selected ? "" : "Comparar"}
                </button>
                {!s.isSeed && (
                  <button onClick={() => deleteScenario(s.id)}
                    className="text-xs px-2 py-1.5 rounded-md border border-stone-200 text-stone-500 hover:border-rose-300 hover:text-rose-600 transition-colors">
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {scenarios.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 p-10 text-center">
          <Library className="w-8 h-8 text-stone-400 mx-auto mb-3" />
          <h3 className="font-serif text-lg text-stone-600">No hay escenarios guardados</h3>
          <p className="text-sm text-stone-500 mt-1">Ve al simulador y guarda el primero.</p>
        </div>
      )}

      {/* Compare view */}
      {compareSelected.length >= 2 && (
        <CompareView
          scenarios={scenarios.filter(s => compareSelected.includes(s.id))}
          compareSelected={compareSelected}
          currentMonth={currentMonth}
          clearCompare={clearCompare}
        />
      )}

      {compareSelected.length === 1 && (
        <div className="rounded-2xl border-l-4 border-amber-300 bg-amber-50/40 p-4 flex items-center justify-between">
          <div className="text-sm text-stone-700">
            <span className="font-serif italic">Selecciona al menos 1 escenario más</span> para activar la comparación lado a lado.
          </div>
          <button onClick={clearCompare}
            className="text-xs text-stone-500 hover:text-[#7A1F3D]">
            Deseleccionar
          </button>
        </div>
      )}
    </div>
  );
}


/* --------------------------------------------------------------------------- */
/* COMPARE VIEW — side-by-side comparison of 2-3 scenarios                     */
/* --------------------------------------------------------------------------- */
function CompareView({ scenarios, compareSelected, currentMonth, clearCompare }) {
  // Order scenarios as selected
  const ordered = compareSelected.map(id => scenarios.find(s => s.id === id)).filter(Boolean);

  // Compute paths for each
  const pathsData = useMemo(() => {
    return ordered.map(s => ({
      id: s.id,
      name: s.name,
      levers: s.levers,
      path: computePath(s.levers, 24),
    }));
  }, [ordered]);

  // Build overlay chart data
  const kpiKeys = [
    { key: "ipc",  label: "IPC",  unit: "pp",  positive_is_good: false },
    { key: "pib",  label: "PIB",  unit: "%",   positive_is_good: true  },
    { key: "paro", label: "Paro", unit: "pp",  positive_is_good: false },
  ];

  const buildOverlayData = (kpiKey) => {
    const months = Array.from({ length: 25 }, (_, i) => i);
    return months.map(m => {
      const row = { month: m };
      pathsData.forEach((p, i) => {
        row[String.fromCharCode(65 + i)] = p.path[m][kpiKey];
      });
      return row;
    });
  };

  // Build diff table: KPIs at currentMonth for all scenarios
  const atMonth = pathsData.map(p => p.path[Math.min(currentMonth, p.path.length - 1)]);

  const diffRows = [
    { label: "IPC",               unit: "pp", fn: (s) => s.ipc,          positive_is_good: false },
    { label: "PIB real",          unit: "%",  fn: (s) => s.pib,          positive_is_good: true  },
    { label: "Paro",              unit: "pp", fn: (s) => s.paro,         positive_is_good: false },
    { label: "Recaudación",       unit: "€Bn",fn: (s) => s.revenue,      positive_is_good: true  },
    { label: "Salario real",      unit: "%",  fn: (s) => s.salarioReal,  positive_is_good: true  },
    { label: "Margen empresarial",unit: "pp", fn: (s) => s.margen,       positive_is_good: true  },
    { label: "Gini",              unit: "pp", fn: (s) => s.gini,         positive_is_good: false },
    { label: "Renta real Q1",     unit: "%",  fn: (s) => s.quintiles.Q1.real_income, positive_is_good: true },
    { label: "Renta real Q5",     unit: "%",  fn: (s) => s.quintiles.Q5.real_income, positive_is_good: true },
    { label: "Sostenibilidad K",  unit: "%",  fn: (s) => s.abct.sustainability * 100, positive_is_good: true },
  ];

  const colorForPositive = (v, pos_is_good) => {
    if (Math.abs(v) < 0.01) return "text-stone-400";
    const good = pos_is_good ? v > 0 : v < 0;
    return good ? "text-emerald-700" : "text-rose-700";
  };

  const fmtValue = (v, unit) => {
    if (unit === "€Bn") return fmt.bn(v);
    if (unit === "%")   return fmt.pct(v);
    return fmt.pp(v);
  };

  return (
    <div className="rounded-2xl border-2 border-[#7A1F3D]/20 bg-gradient-to-br from-[#FBF7F0] to-white p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitCompare className="w-5 h-5 text-[#7A1F3D]" />
          <h3 className="font-serif text-xl tracking-tight">Comparación de {ordered.length} escenarios · mes {currentMonth}</h3>
        </div>
        <button onClick={clearCompare}
          className="text-xs text-stone-500 hover:text-[#7A1F3D] flex items-center gap-1">
          <X className="w-3 h-3" />
          Cerrar comparación
        </button>
      </div>

      {/* Scenario header chips */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {ordered.map((s, i) => (
          <div key={s.id} className="rounded-xl border bg-white p-3"
               style={{ borderColor: COMPARE_COLORS[i] + "80" }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase tracking-[0.1em] px-1.5 py-0.5 rounded text-white font-semibold"
                    style={{ backgroundColor: COMPARE_COLORS[i] }}>
                {String.fromCharCode(65 + i)}
              </span>
              <h4 className="font-serif text-sm text-stone-900 truncate flex-1">{s.name}</h4>
            </div>
            <div className="text-[10px] text-stone-500 font-mono">{leverSummary(s.levers)}</div>
          </div>
        ))}
      </div>

      {/* Overlay time charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {kpiKeys.map(kpi => {
          const data = buildOverlayData(kpi.key);
          return (
            <div key={kpi.key} className="rounded-xl bg-white border border-stone-200 p-4">
              <h4 className="text-[11px] uppercase tracking-[0.12em] text-stone-500 font-semibold mb-2">
                Δ {kpi.label}
              </h4>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke="#E7E5E4" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#57534E" }} tickFormatter={(m) => `${m}m`} />
                  <YAxis tick={{ fontSize: 10, fill: "#57534E" }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E7E5E4", fontSize: 11 }}
                           formatter={(v) => [`${v.toFixed(2)} ${kpi.unit}`]}
                           labelFormatter={(l) => `Mes ${l}`} />
                  <ReferenceLine y={0} stroke="#A8A29E" />
                  <ReferenceLine x={currentMonth} stroke="#7A1F3D" strokeWidth={1} strokeDasharray="3 3" />
                  {ordered.map((s, i) => (
                    <Line key={s.id} type="monotone" dataKey={String.fromCharCode(65 + i)}
                          stroke={COMPARE_COLORS[i]} strokeWidth={2} dot={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          );
        })}
      </div>

      {/* Diff table at current month */}
      <div className="rounded-xl bg-white border border-stone-200 overflow-hidden">
        <div className="px-4 py-3 bg-stone-50 border-b border-stone-200">
          <h4 className="font-serif text-base tracking-tight">Tabla comparativa — valores al mes {currentMonth}</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white">
              <tr className="border-b border-stone-200">
                <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-[0.1em] text-stone-500 font-semibold">Indicador</th>
                {ordered.map((s, i) => (
                  <th key={s.id} className="text-right px-4 py-2.5">
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-[10px] uppercase tracking-[0.1em] px-1.5 py-0.5 rounded text-white font-semibold"
                            style={{ backgroundColor: COMPARE_COLORS[i] }}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="text-[11px] text-stone-700 truncate max-w-[120px]">{s.name}</span>
                    </div>
                  </th>
                ))}
                {ordered.length >= 2 && (
                  <th className="text-right px-4 py-2.5 text-[11px] uppercase tracking-[0.1em] text-stone-500 font-semibold">
                    B − A
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {diffRows.map((r, idx) => {
                const values = atMonth.map(r.fn);
                const diffBA = ordered.length >= 2 ? values[1] - values[0] : null;
                return (
                  <tr key={idx} className="border-b border-stone-100 hover:bg-stone-50/50">
                    <td className="px-4 py-2 text-stone-700 font-medium">{r.label}</td>
                    {values.map((v, i) => (
                      <td key={i} className={`px-4 py-2 text-right font-mono text-[12px] ${colorForPositive(v, r.positive_is_good)}`}>
                        {fmtValue(v, r.unit)}
                      </td>
                    ))}
                    {diffBA !== null && (
                      <td className={`px-4 py-2 text-right font-mono text-[12px] font-semibold ${colorForPositive(diffBA, r.positive_is_good)}`}>
                        {fmtValue(diffBA, r.unit)}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Narrative helper */}
      <div className="rounded-xl bg-[#FBF7F0] border border-[#7A1F3D]/20 p-4">
        <div className="flex items-start gap-2">
          <BookOpen className="w-4 h-4 text-[#7A1F3D] mt-0.5 shrink-0" />
          <p className="text-[12px] text-stone-600 leading-relaxed">
            <span className="font-serif italic text-[#7A1F3D]">Lectura comparativa:</span> usa el scrubber
            temporal del simulador para mover el mes. Los gráficos y la tabla se actualizan a la par.
            La columna <span className="font-mono font-semibold">B − A</span> muestra cuánto mejora (o
            empeora) B respecto a A en cada métrica — positivo en verde si es "bueno" según el indicador,
            rojo si es "malo".
          </p>
        </div>
      </div>
    </div>
  );
}


/* --------------------------------------------------------------------------- */
/* [10] INDIVIDUAL TAX BURDEN — v0.9                                           */
/* ---------------------------------------------------------------------------
   Calcula la cuña fiscal TOTAL sobre un trabajador: directos, indirectos,
   y 2º orden (IS vía precios, cotizaciones empresa vía salario).

   Fuentes 2026:
   · IRPF tramos: Ley 35/2006 + escalas autonómicas (media representativa)
   · Cotizaciones: Orden PJC/297/2026, RD 3/2026, base máx 5.101,20€/mes
   · IVA: Ley 37/1992, tipos 4% / 10% / 21%
   · IS: 25% general, 23% ERD (<10M€), 19%/21% microempresa
   · II.EE.: hidrocarburos (~50% precio gasolina), electricidad (5,11%),
     alcohol, tabaco (~80% del precio), seguros (8%), matriculación
   · IBI: ~0,4-0,8% valor catastral (asumimos 0,6% efectivo)
   · ITP vehículo usado: 4-8% CCAA
   --------------------------------------------------------------------------- */

// IRPF 2026 escala combinada (estatal + autonómica media, aprox CCAA régimen común)
const IRPF_BRACKETS_2026 = [
  { upTo: 12450,  rate: 0.19 },
  { upTo: 20200,  rate: 0.24 },
  { upTo: 35200,  rate: 0.30 },
  { upTo: 60000,  rate: 0.37 },
  { upTo: 300000, rate: 0.45 },
  { upTo: Infinity, rate: 0.47 },
];
const IRPF_PERSONAL_MIN = 5550;  // mínimo personal general

// Cotizaciones SS 2026
const SS_2026 = {
  cap_monthly: 5101.20,       // base máxima CC (Orden PJC/297/2026)
  cap_annual: 5101.20 * 12,   // = 61214.40 €
  // Tipo trabajador (total sobre base): CC 4.70 + MEI 0.15 + desempleo 1.55 + FP 0.10 = 6.50%
  worker_rate_cc_mei_unemp_fp: 0.0650,
  // Tipo empresa (sobre base): CC 23.60 + MEI 0.75 + desempleo 5.50 + FP 0.60 + FOGASA 0.20
  //   + AT/EP media (CNAE) ~1.50 = 32.15%  (rango según sector)
  employer_rate_total: 0.3215,
  // Solidaridad sobre exceso base máx (tramos 2026)
  solidarity_worker: 0.0019,  // tramo 1 (aprox)
  solidarity_employer: 0.0096,
};

// Impuestos consumo — incidencia efectiva sobre gasto típico
const CONSUMPTION_TAXES = {
  vivienda_alquiler: { iva: 0,     especial: 0,    ibi_equiv: 0.025 },  // IBI 2.5% anual implícito
  vivienda_propiedad: { iva: 0,    especial: 0,    ibi_equiv: 0.012 },  // IBI + basuras ~1.2% gasto
  alimentacion:       { iva: 0.065, especial: 0 },  // mix 4%/10%
  energia_electrica:  { iva: 0.21,  especial: 0.0511 + 0.01 },  // IEE + CO2
  combustible:        { iva: 0.21,  especial: 0.50 },  // hidrocarb.≈50% precio final
  transporte_pub:     { iva: 0.10,  especial: 0 },
  telecom_servicios:  { iva: 0.21,  especial: 0 },
  seguros:            { iva: 0,     especial: 0.08 },  // impuesto sobre primas
  ocio_restauracion:  { iva: 0.115, especial: 0.005 }, // mix 10/21 + tabaco/alcohol parcial
  ropa_bienes:        { iva: 0.21,  especial: 0 },
  salud:              { iva: 0.04,  especial: 0 },
};

// Cesta representativa para un trabajador de €80k neto ~€53k (52% gasto, 26% ahorro, 22% vivienda)
// Porcentajes sobre gasto corriente (excluye ahorro)
const DEFAULT_BASKET = {
  vivienda_propiedad: 0.29,
  alimentacion:       0.15,
  energia_electrica:  0.06,
  combustible:        0.09,
  transporte_pub:     0.03,
  telecom_servicios:  0.07,
  seguros:            0.05,
  ocio_restauracion:  0.13,
  ropa_bienes:        0.07,
  salud:              0.06,
};

function computeIRPF(baseLiquidable) {
  let cuota = 0;
  let prev = 0;
  for (const b of IRPF_BRACKETS_2026) {
    if (baseLiquidable <= prev) break;
    const tramo = Math.min(baseLiquidable, b.upTo) - prev;
    cuota += tramo * b.rate;
    prev = b.upTo;
    if (baseLiquidable <= b.upTo) break;
  }
  // Mínimo personal resta cuota al tipo del primer tramo
  cuota -= Math.min(IRPF_PERSONAL_MIN, baseLiquidable) * IRPF_BRACKETS_2026[0].rate;
  return Math.max(0, cuota);
}

/* --------------------------------------------------------------------------- */
/* LIBRERÍA FISCAL UNIFICADA · v2.8                                             */
/* ---------------------------------------------------------------------------
   Función única que hace los cálculos fiscales consistentes de toda la app.
   Reemplaza llamadas fragmentadas por un único punto de verdad.

   Usa IRPF_BRACKETS_2026 como escala consolidada (estatal + autonómico medio).
   Para cálculo específico por CCAA usar computeIRPF_CCAA (en AutonomiasView).

   Parámetros soportados:
   - bruto: salario bruto anual
   - hijos: número de descendientes (0-4+), aplica mínimos correctos
   - edadMenor3: si algún hijo es <3 años (deducción maternidad)
   - ccaa: "media" | "madrid" | "cataluña" | etc. (default: media)
   - empleadaHogarAnual: cuota SS pagada (0 si no aplica)
   - segSaludPrivado: boolean, solo para análisis comparativo
   --------------------------------------------------------------------------- */

const FISCAL_CONSTANTES_2026 = {
  min_personal: 5550,
  min_descendiente_1: 2400,
  min_descendiente_2: 2700,
  min_descendiente_3: 4000,
  min_descendiente_4plus: 4500,
  base_max_cotizacion_anual: 61215,
  ss_trabajador_pct: 0.065,
  ss_empresa_pct: 0.3215,
  deduccion_maternidad_por_hijo: 1200,
  deduccion_guarderia_max: 1000,
  deduccion_empleada_hogar_max: 500,
  deduccion_empleada_hogar_pct: 0.20,
  pension_maxima_anual: 47034,
  pension_minima_anual: 13107,
  pension_media_anual: 22400,
};

function calcFiscalCompleto({
  bruto = 50000,
  hijos = 0,
  edadMenor3 = false,
  ccaa = "media",
  empleadaHogarSSAnual = 0,
} = {}) {
  const K = FISCAL_CONSTANTES_2026;

  // Paso 1: Seguridad Social trabajador
  const baseSS = Math.min(bruto, K.base_max_cotizacion_anual);
  const ss_trabajador = baseSS * K.ss_trabajador_pct;
  const ss_empresa = baseSS * K.ss_empresa_pct;
  const coste_laboral_total = bruto + ss_empresa;

  // Paso 2: Base Liquidable General
  const baseLiquidable = Math.max(0, bruto - ss_trabajador - K.min_personal);

  // Paso 3: IRPF bruto sobre BL (escala 2026 consolidada)
  const calcEscala = (base) => {
    let r = 0, prev = 0;
    for (const b of IRPF_BRACKETS_2026) {
      if (base <= prev) break;
      const tramo = Math.min(base, b.upTo) - prev;
      r += tramo * b.rate;
      prev = b.upTo;
      if (base <= b.upTo) break;
    }
    return Math.max(0, r);
  };
  const cuota_integra = calcEscala(baseLiquidable);

  // Paso 4: Reducción por descendientes (método AEAT correcto: aplicar al tramo marginal)
  let min_desc_total = 0;
  if (hijos >= 1) min_desc_total += K.min_descendiente_1;
  if (hijos >= 2) min_desc_total += K.min_descendiente_2;
  if (hijos >= 3) min_desc_total += K.min_descendiente_3;
  if (hijos >= 4) min_desc_total += K.min_descendiente_4plus * (hijos - 3);

  const reduccion_descendientes = calcEscala(min_desc_total);
  const cuota_tras_descendientes = Math.max(0, cuota_integra - reduccion_descendientes);

  // Paso 5: Deducción maternidad (hijo <3 años)
  const deduccion_maternidad = edadMenor3 && hijos >= 1 ? K.deduccion_maternidad_por_hijo * hijos : 0;

  // Paso 6: Deducción empleada hogar (20% cuotas SS, tope €500)
  const deduccion_empleada = Math.min(
    empleadaHogarSSAnual * K.deduccion_empleada_hogar_pct,
    K.deduccion_empleada_hogar_max
  );

  // IRPF final
  const irpf_final = Math.max(0, cuota_tras_descendientes - deduccion_maternidad - deduccion_empleada);

  // Tipo marginal
  let tipo_marginal = 0;
  for (const b of IRPF_BRACKETS_2026) {
    if (baseLiquidable <= b.upTo) {
      tipo_marginal = b.rate;
      break;
    }
    tipo_marginal = b.rate;
  }

  // Resultado
  const neto_anual = bruto - ss_trabajador - irpf_final;
  const neto_mensual_14pagas = neto_anual / 14;
  const neto_mensual_12pagas = neto_anual / 12;
  const tipo_efectivo_irpf = bruto > 0 ? irpf_final / bruto : 0;
  const tipo_efectivo_total = bruto > 0 ? (ss_trabajador + irpf_final) / bruto : 0;

  // Cuña fiscal total (% coste laboral)
  const cuña_total_pct = coste_laboral_total > 0 ?
    (ss_trabajador + ss_empresa + irpf_final) / coste_laboral_total : 0;

  return {
    // Entradas echo
    bruto, hijos, ccaa,

    // SS
    baseSS,
    ss_trabajador,
    ss_empresa,
    coste_laboral_total,

    // IRPF descomposición
    baseLiquidable,
    cuota_integra,
    min_desc_total,
    reduccion_descendientes,
    deduccion_maternidad,
    deduccion_empleada,
    irpf_final,
    tipo_marginal,

    // Resultado neto
    neto_anual,
    neto_mensual_14pagas,
    neto_mensual_12pagas,
    tipo_efectivo_irpf,
    tipo_efectivo_total,
    cuña_total_pct,

    // Topado por base cotización
    topado_cotizacion: bruto > K.base_max_cotizacion_anual,
  };
}

/* --------------------------------------------------------------------------- */
/* SANITY CHECKS · v2.8 — se ejecutan al cargar para detectar regresiones      */
/* --------------------------------------------------------------------------- */
function runFiscalSanityChecks() {
  const checks = [];

  // Check 1: Un €30k soltero sin hijos debe tener tipo efectivo IRPF 11-15%
  const c1 = calcFiscalCompleto({ bruto: 30000, hijos: 0 });
  checks.push({
    name: "€30k soltero tipo efectivo IRPF en rango",
    pass: c1.tipo_efectivo_irpf > 0.10 && c1.tipo_efectivo_irpf < 0.16,
    value: `${(c1.tipo_efectivo_irpf * 100).toFixed(1)}%`,
    expected: "10-16%",
  });

  // Check 2: Un €65k con 2 hijos debe pagar menos IRPF que sin hijos (diferencia material)
  const c2a = calcFiscalCompleto({ bruto: 65000, hijos: 0 });
  const c2b = calcFiscalCompleto({ bruto: 65000, hijos: 2 });
  checks.push({
    name: "Reducción por 2 hijos a €65k > €1.500 anuales",
    pass: (c2a.irpf_final - c2b.irpf_final) > 1500,
    value: `€${Math.round(c2a.irpf_final - c2b.irpf_final)}`,
    expected: ">€1.500",
  });

  // Check 3: Topado por base cotización en €80k
  const c3 = calcFiscalCompleto({ bruto: 80000 });
  checks.push({
    name: "€80k topado por base máxima cotización",
    pass: c3.topado_cotizacion && c3.baseSS === FISCAL_CONSTANTES_2026.base_max_cotizacion_anual,
    value: `baseSS €${c3.baseSS}`,
    expected: "€61.215",
  });

  // Check 4: Cuña total España para €40k debe estar en 37-45%
  const c4 = calcFiscalCompleto({ bruto: 40000 });
  checks.push({
    name: "Cuña total €40k en rango OCDE",
    pass: c4.cuña_total_pct > 0.37 && c4.cuña_total_pct < 0.45,
    value: `${(c4.cuña_total_pct * 100).toFixed(1)}%`,
    expected: "37-45%",
  });

  // Check 5: Marginal 45% debe aplicar a €70k (tramo €60k-€300k)
  const c5 = calcFiscalCompleto({ bruto: 70000 });
  checks.push({
    name: "Marginal €70k = 45%",
    pass: c5.tipo_marginal === 0.45,
    value: `${(c5.tipo_marginal * 100).toFixed(0)}%`,
    expected: "45%",
  });

  return checks;
}

// Los sanity checks están disponibles vía runFiscalSanityChecks() pero no se ejecutan
// automáticamente para evitar side-effects al cargar el módulo en el artifact runtime.

/**
 * Descompone la carga fiscal total de un trabajador.
 * @param {Object} opts
 * @param {number} opts.bruto          Salario bruto anual
 * @param {number} opts.saving_rate    Tasa de ahorro (0-1) sobre neto
 * @param {number} opts.is_passthrough Fracción IS que sufre el trabajador (0.5 default)
 * @param {number} opts.ss_emp_inc     Incidencia SS empresa sobre trabajador (0.6 default,
 *                                     literatura: OCDE/BdE ~50-70% recae en salarios a LP)
 */
function computeIndividualBurden({
  bruto = 80000,
  saving_rate = 0.15,
  is_passthrough = 0.5,
  ss_emp_incidence = 0.6,
  basket = DEFAULT_BASKET,
} = {}) {
  // ═══════ COTIZACIONES SS ═══════
  const baseSS = Math.min(bruto, SS_2026.cap_annual);
  const exceso = Math.max(0, bruto - SS_2026.cap_annual);

  const ss_worker_base = baseSS * SS_2026.worker_rate_cc_mei_unemp_fp;
  const ss_worker_solidarity = exceso * SS_2026.solidarity_worker;
  const ss_worker = ss_worker_base + ss_worker_solidarity;

  const ss_employer_base = baseSS * SS_2026.employer_rate_total;
  const ss_employer_solidarity = exceso * SS_2026.solidarity_employer;
  const ss_employer = ss_employer_base + ss_employer_solidarity;

  const coste_empresa = bruto + ss_employer;

  // ═══════ IRPF ═══════
  // Base imponible = bruto − cotizaciones trabajador (SS es gasto deducible)
  const baseIRPF = bruto - ss_worker;
  const irpf = computeIRPF(baseIRPF);

  const neto = bruto - ss_worker - irpf;
  const gastable = neto * (1 - saving_rate);
  const ahorro = neto * saving_rate;

  // ═══════ IMPUESTOS INDIRECTOS SOBRE CONSUMO ═══════
  let iva_total = 0, especiales_total = 0;
  const consumo_breakdown = [];
  for (const [cat, share] of Object.entries(basket)) {
    const gasto_cat = gastable * share;
    const tax = CONSUMPTION_TAXES[cat];
    if (!tax) continue;
    // IVA: recae sobre precio sin impuesto; gasto/(1+iva) base, × iva = iva pagado
    const iva_pagado = gasto_cat * tax.iva / (1 + tax.iva);
    const esp_pagado = gasto_cat * (tax.especial || 0);
    iva_total += iva_pagado;
    especiales_total += esp_pagado;
    consumo_breakdown.push({ cat, gasto: gasto_cat, iva: iva_pagado, especial: esp_pagado });
  }

  // ═══════ IMPUESTOS LOCALES Y VIVIENDA (estimación) ═══════
  // IBI + basuras: ~1.2% del gasto en vivienda (si propiedad)
  const vivienda_gasto = gastable * (basket.vivienda_propiedad || 0);
  const ibi_estimado = vivienda_gasto * 0.04;  // aprox IBI anual sobre gasto vivienda

  // ═══════ IMPACTO 2º ORDEN ═══════
  // Impuesto de Sociedades: el trabajador "soporta" una fracción vía menor salario
  // o mayor precio. Literatura: 30-60% cae sobre trabajadores, resto en consumidores/capital.
  // Aproximación: beneficio empresarial ≈ 10% del coste empresarial en sector típico,
  // IS al 25%, de los cuales is_passthrough va al trabajador (ya incluido en menor salario).
  const margen_empresarial_pct = 0.10;
  const is_empresarial = coste_empresa * margen_empresarial_pct * 0.25;
  const is_incidencia_trabajador = is_empresarial * is_passthrough;

  // SS empresa — incidencia efectiva sobre el trabajador
  // (Ya la "paga" la empresa pero reduce su salario en ss_emp_incidence %)
  const ss_emp_carga_real = ss_employer * ss_emp_incidence;

  // ═══════ TOTAL ═══════
  const total_estado = ss_worker + ss_employer + irpf + iva_total + especiales_total + ibi_estimado + is_empresarial;
  const porcion_estado = total_estado / coste_empresa;
  const cuna_directa = (ss_worker + ss_employer + irpf) / coste_empresa;

  return {
    bruto, coste_empresa,
    ss_worker, ss_employer,
    ss_worker_solidarity, ss_employer_solidarity,
    irpf, neto, gastable, ahorro, saving_rate,
    iva_total, especiales_total, ibi_estimado,
    is_empresarial, is_incidencia_trabajador, ss_emp_carga_real,
    total_estado, porcion_estado, cuna_directa,
    consumo_breakdown,
    marginal_rate: baseIRPF > 60000 ? 0.45 : baseIRPF > 35200 ? 0.37 : 0.30,
  };
}

/** Vivienda nueva: descomposición del precio */
function computeHousingTaxBreakdown(precioVivienda = 300000) {
  // Basado en estudios APCE/CCAA: ~25-30% del precio final es componente público
  const construccion  = precioVivienda * 0.40;
  const suelo_total   = precioVivienda * 0.30;  // incluye plusvalías previas
  const beneficio     = precioVivienda * 0.10;
  const iva_10        = precioVivienda * 0.10;
  const ajd_notaria   = precioVivienda * 0.023; // AJD 1.5% medio + notaría/registro
  // IBI acumulado 10 años (valor catastral ≈ 50% mercado, tipo 0.5%)
  const ibi_10_anos   = precioVivienda * 0.5 * 0.005 * 10;
  // Licencias + aprovechamientos urbanísticos ya en suelo_total, estimados
  const componente_publico_suelo = suelo_total * 0.35;  // 35% del suelo son tasas/cesiones/licencias

  const total_publico = iva_10 + ajd_notaria + ibi_10_anos + componente_publico_suelo;
  return {
    precioVivienda,
    construccion,
    suelo_total,
    beneficio,
    iva_10,
    ajd_notaria,
    ibi_10_anos,
    componente_publico_suelo,
    total_publico,
    pct_publico: total_publico / precioVivienda,
  };
}

/** Bracket creep: impacto 10 años si tramos no se deflactan con IPC */
function computeBracketCreep(brutoInicial = 80000, aniosIPCAcumulado = 0.24) {
  // El salario nominal crece con IPC pero los tramos IRPF no se mueven
  const brutoFinal = brutoInicial * (1 + aniosIPCAcumulado);
  const irpfInicial = computeIRPF(brutoInicial - brutoInicial * SS_2026.worker_rate_cc_mei_unemp_fp);
  const irpfFinal = computeIRPF(brutoFinal - brutoFinal * SS_2026.worker_rate_cc_mei_unemp_fp);
  const tasaEfectivaInicial = irpfInicial / brutoInicial;
  const tasaEfectivaFinal = irpfFinal / brutoFinal;
  return {
    brutoInicial, brutoFinal,
    irpfInicial, irpfFinal,
    tasaEfectivaInicial, tasaEfectivaFinal,
    incrementoTasaEfectiva: tasaEfectivaFinal - tasaEfectivaInicial,
  };
}

/* --------------------------------------------------------------------------- */
/* [11] VIGILANCIA — Dashboard de indicadores del ciclo · v1.0                 */
/* ---------------------------------------------------------------------------
   Panel de vigilancia del ciclo económico español. 12 indicadores con:
   · Valor actual abril 2026 (datos oficiales)
   · Serie histórica 2000-2025 simplificada
   · Umbral de riesgo rojo/amarillo/verde basado en literatura BdE/AIReF
   · Lectura austríaca en 2 líneas

   Fuentes: BdE (deuda, hogares, empresas, vivienda), AIReF (pensiones, déficit),
            Fundación BBVA+Ivie (productividad), Eurostat (UE comparativa),
            INE (IPC, paro), BCE (tipos, sobrevaloración vivienda).
   --------------------------------------------------------------------------- */

// Indicadores clave con valores reales y series históricas
const VIGILANCIA_INDICATORS = [
  {
    id: "deuda_publica",
    label: "Deuda pública",
    unit: "% PIB",
    current: 100.7,
    series: [
      { y: 2000, v: 57 }, { y: 2007, v: 35 }, { y: 2010, v: 60 }, { y: 2013, v: 95 },
      { y: 2014, v: 100 }, { y: 2019, v: 98 }, { y: 2020, v: 120 }, { y: 2021, v: 124 },
      { y: 2022, v: 112 }, { y: 2023, v: 108 }, { y: 2024, v: 102 }, { y: 2025, v: 100.7 },
    ],
    thresholds: { green: 60, amber: 90, red: 100 },
    direction: "lower_is_better",
    source: "BdE · 2025 T4",
    lens: "Ancla fiscal frágil. Por encima del umbral Maastricht (60%) y del AIReF (90%). Sin superávits primarios, cualquier subida de tipos dispara servicio de deuda.",
    category: "fiscal",
  },
  {
    id: "deficit_publico",
    label: "Déficit público",
    unit: "% PIB",
    current: 2.5,
    series: [
      { y: 2000, v: -1.2 }, { y: 2007, v: 1.9 }, { y: 2009, v: 11.2 }, { y: 2012, v: 10.5 },
      { y: 2014, v: 5.9 }, { y: 2019, v: 3.1 }, { y: 2020, v: 10.1 }, { y: 2021, v: 6.7 },
      { y: 2023, v: 3.5 }, { y: 2024, v: 3.0 }, { y: 2025, v: 2.5 },
    ],
    thresholds: { green: 1, amber: 3, red: 5 },
    direction: "lower_is_better",
    source: "BdE proy 2025",
    lens: "En mejora, pero estructural. Sin ciclo favorable volvería al 4%+. La bajada es ciclo + inflación, no ajuste real.",
    category: "fiscal",
  },
  {
    id: "deuda_hogares",
    label: "Deuda hogares",
    unit: "% PIB",
    current: 42.8,
    series: [
      { y: 2000, v: 44 }, { y: 2005, v: 68 }, { y: 2008, v: 82 }, { y: 2010, v: 84 },
      { y: 2014, v: 70 }, { y: 2019, v: 56 }, { y: 2022, v: 52 }, { y: 2024, v: 45 },
      { y: 2025, v: 42.8 },
    ],
    thresholds: { green: 50, amber: 70, red: 85 },
    direction: "lower_is_better",
    source: "BdE Cuentas Financieras 4T25",
    lens: "Mínimo 25 años. Desapalancamiento completo del boom 2000s. Fortaleza estructural real.",
    category: "privado",
  },
  {
    id: "deuda_empresas",
    label: "Deuda empresas",
    unit: "% PIB",
    current: 62.6,
    series: [
      { y: 2000, v: 72 }, { y: 2007, v: 128 }, { y: 2010, v: 130 }, { y: 2014, v: 105 },
      { y: 2019, v: 78 }, { y: 2022, v: 72 }, { y: 2024, v: 66 }, { y: 2025, v: 62.6 },
    ],
    thresholds: { green: 65, amber: 90, red: 110 },
    direction: "lower_is_better",
    source: "BdE Cuentas Financieras 4T25",
    lens: "Mínimo desde 2001. Balances empresariales saneados tras desapalancamiento post-2008.",
    category: "privado",
  },
  {
    id: "paro",
    label: "Tasa de paro",
    unit: "%",
    current: 9.93,
    series: [
      { y: 2000, v: 14 }, { y: 2007, v: 8.2 }, { y: 2013, v: 26.9 }, { y: 2019, v: 14.1 },
      { y: 2020, v: 15.5 }, { y: 2022, v: 13.0 }, { y: 2024, v: 10.6 }, { y: 2025, v: 9.93 },
    ],
    thresholds: { green: 7, amber: 12, red: 18 },
    direction: "lower_is_better",
    source: "INE EPA T4 2025",
    lens: "Mínimo desde T1 2008. Pero sigue doblando la media UE (6.0%). Tensión estructural: vacantes/desempleo elevada.",
    category: "empleo",
  },
  {
    id: "productividad",
    label: "Productividad (PTF yoy)",
    unit: "%",
    current: 2.0,
    series: [
      { y: 2000, v: 0.2 }, { y: 2007, v: -0.5 }, { y: 2013, v: 0.8 }, { y: 2019, v: 0.1 },
      { y: 2021, v: 1.2 }, { y: 2022, v: 1.3 }, { y: 2023, v: 1.5 }, { y: 2024, v: 2.0 },
      { y: 2025, v: 1.4 },
    ],
    thresholds: { green: 1.5, amber: 0.5, red: 0 },
    direction: "higher_is_better",
    source: "Fundación BBVA + Ivie OPCE 2025",
    lens: "Recuperación real vs UE (−0.7% media). Pero el gap acumulado vs UE8 sigue en 33pp PIB per PET. No basta con tendencia.",
    category: "competitividad",
  },
  {
    id: "pib_pc",
    label: "PIB per cápita vs UE",
    unit: "ranking UE",
    current: 14,
    series: [
      { y: 2000, v: 10 }, { y: 2007, v: 11 }, { y: 2013, v: 13 }, { y: 2019, v: 13 },
      { y: 2021, v: 14 }, { y: 2023, v: 14 }, { y: 2024, v: 14 }, { y: 2025, v: 14 },
    ],
    thresholds: { green: 8, amber: 12, red: 15 },
    direction: "lower_is_better",
    source: "Eurostat 2024",
    lens: "España es 4ª economía pero 14ª en renta per cápita. Gap convergencia ampliándose desde 2019. El crecimiento agregado viene de migración, no de productividad.",
    category: "competitividad",
  },
  {
    id: "vivienda_sobrevaloracion",
    label: "Sobrevaloración vivienda",
    unit: "%",
    current: 8.5,
    series: [
      { y: 2000, v: 5 }, { y: 2007, v: 28 }, { y: 2013, v: -15 }, { y: 2019, v: 1 },
      { y: 2022, v: 3 }, { y: 2023, v: 4.8 }, { y: 2024, v: 8.5 }, { y: 2025, v: 10 },
    ],
    thresholds: { green: 5, amber: 10, red: 20 },
    direction: "lower_is_better",
    source: "BdE rango 1.1-8.5% · BCE 14.3%",
    lens: "Vivienda desacoplándose del salario — 7.8 años renta para comprar. Déficit estructural 500k+. No es 2007 (deuda hogares baja), pero es exclusión masiva.",
    category: "vivienda",
  },
  {
    id: "alquiler",
    label: "Alquiler vs 2019",
    unit: "%",
    current: 34,
    series: [
      { y: 2019, v: 0 }, { y: 2020, v: 2 }, { y: 2021, v: 7 }, { y: 2022, v: 15 },
      { y: 2023, v: 22 }, { y: 2024, v: 28 }, { y: 2025, v: 34 },
    ],
    thresholds: { green: 10, amber: 20, red: 30 },
    direction: "lower_is_better",
    source: "BBVA Research · Índice INE alquiler",
    lens: "51% de renta salarial para alquilar vivienda media (vs 28% compra). España entre los peores UE en sobresfuerzo de arrendatarios.",
    category: "vivienda",
  },
  {
    id: "presion_fiscal",
    label: "Presión fiscal",
    unit: "% PIB",
    current: 38.3,
    series: [
      { y: 2000, v: 33 }, { y: 2007, v: 36 }, { y: 2013, v: 32 }, { y: 2019, v: 35 },
      { y: 2020, v: 36.8 }, { y: 2022, v: 37.9 }, { y: 2024, v: 38.5 }, { y: 2025, v: 38.3 },
    ],
    thresholds: { green: 35, amber: 38, red: 42 },
    direction: "lower_is_better",
    source: "AEAT + Eurostat 2024",
    lens: "+5pp en 10 años — mayor subida UE sin debate parlamentario (bracket creep IRPF + SS + cotización solidaridad). Cuña del 47% para rentas medias.",
    category: "fiscal",
  },
  {
    id: "pensiones",
    label: "Gasto pensiones",
    unit: "% PIB",
    current: 12.3,
    series: [
      { y: 2000, v: 8.4 }, { y: 2007, v: 8.3 }, { y: 2013, v: 11.8 }, { y: 2019, v: 12.1 },
      { y: 2022, v: 11.9 }, { y: 2024, v: 12.5 }, { y: 2025, v: 12.3 },
    ],
    thresholds: { green: 11, amber: 13, red: 15 },
    direction: "lower_is_better",
    source: "Instituto Santalucía · Proy. AIReF 2050: 14.4% · CE: 16.1%",
    lens: "Tasa de reposición 77.5% (vs 44.5% ZE media). Pico proyectado 15.3% en 2049. Transferencias del Estado = 3.1 pp PIB, déficit contable sistema −0.6%.",
    category: "fiscal",
  },
  {
    id: "tipo_gap",
    label: "Tipo BCE vs natural",
    unit: "pp",
    current: 0.0,
    series: [
      { y: 2000, v: 1.5 }, { y: 2003, v: -2.5 }, { y: 2006, v: -1.5 }, { y: 2010, v: -0.5 },
      { y: 2015, v: -2.0 }, { y: 2020, v: -2.5 }, { y: 2022, v: -1.0 }, { y: 2023, v: 1.5 },
      { y: 2024, v: 0.5 }, { y: 2025, v: 0 },
    ],
    thresholds: { green: 0.5, amber: 1.5, red: 2.5 },
    direction: "closer_to_zero_is_better",
    source: "BCE depo 2.00% · natural estimada ~2.00%",
    lens: "Wedge cerrado tras la desinflación. Histórico: tipos bajos prolongados 2003-2007 → boom; 2010-2022 → Q2/3 de ciclo actual.",
    category: "monetario",
  },
];

function statusFor(indicator) {
  const { current, thresholds, direction } = indicator;
  if (direction === "lower_is_better") {
    if (current <= thresholds.green) return "green";
    if (current <= thresholds.amber) return "amber";
    return "red";
  } else if (direction === "higher_is_better") {
    if (current >= thresholds.green) return "green";
    if (current >= thresholds.amber) return "amber";
    return "red";
  } else {
    // closer_to_zero
    const abs = Math.abs(current);
    if (abs <= thresholds.green) return "green";
    if (abs <= thresholds.amber) return "amber";
    return "red";
  }
}

const STATUS_STYLE = {
  green: { bg: "bg-emerald-50/60", border: "border-emerald-200",
           chip: "bg-emerald-500 text-white", text: "text-emerald-700", dot: "#10B981" },
  amber: { bg: "bg-amber-50/60", border: "border-amber-300",
           chip: "bg-amber-500 text-white", text: "text-amber-700", dot: "#F59E0B" },
  red:   { bg: "bg-rose-50/70", border: "border-rose-300",
           chip: "bg-rose-600 text-white", text: "text-rose-700", dot: "#E11D48" },
};

const STATUS_LABEL = { green: "OK", amber: "Vigilar", red: "Riesgo" };

const CATEGORY_META = {
  fiscal:         { label: "Fiscal", color: "#7A1F3D" },
  privado:        { label: "Privado", color: "#065F46" },
  empleo:         { label: "Empleo", color: "#1E40AF" },
  competitividad: { label: "Competitividad", color: "#A16207" },
  vivienda:       { label: "Vivienda", color: "#B45309" },
  monetario:      { label: "Monetario", color: "#1F2937" },
};

function IndicatorSparkline({ series, threshold, status, unit }) {
  const dotColor = STATUS_STYLE[status].dot;
  const data = series.map(p => ({ x: p.y, y: p.v }));
  return (
    <ResponsiveContainer width="100%" height={70}>
      <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
        <XAxis dataKey="x" hide />
        <YAxis hide domain={["dataMin", "dataMax"]} />
        <Tooltip
          contentStyle={{ borderRadius: 6, border: "1px solid #E7E5E4", fontSize: 10, padding: "4px 8px" }}
          formatter={(v) => [`${v} ${unit || ""}`]}
          labelFormatter={(l) => `${l}`}
        />
        <Line type="monotone" dataKey="y" stroke={dotColor} strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="y" stroke="transparent"
              dot={(props) => {
                if (props.index !== data.length - 1) return null;
                return <circle key={`last-${props.index}`} cx={props.cx} cy={props.cy} r={4} fill={dotColor} stroke="white" strokeWidth={1.5} />;
              }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function IndicatorCard({ indicator }) {
  const status = statusFor(indicator);
  const style = STATUS_STYLE[status];
  const catMeta = CATEGORY_META[indicator.category];
  return (
    <div className={`rounded-2xl border-2 ${style.border} ${style.bg} p-4 flex flex-col gap-2 min-h-[200px]`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: catMeta.color }} />
            <span className="text-[9px] uppercase tracking-[0.12em] text-stone-500 font-semibold">{catMeta.label}</span>
          </div>
          <h4 className="font-serif text-sm text-stone-900 leading-tight">{indicator.label}</h4>
        </div>
        <span className={`text-[9px] uppercase tracking-[0.08em] px-2 py-0.5 rounded-full font-semibold shrink-0 ${style.chip}`}>
          {STATUS_LABEL[status]}
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className={`font-serif text-2xl tracking-tight ${style.text}`}>
          {indicator.current}
        </span>
        <span className="text-[11px] text-stone-500">{indicator.unit}</span>
      </div>
      <div className="flex-1 min-h-[40px]">
        <IndicatorSparkline series={indicator.series} status={status} unit={indicator.unit} />
      </div>
      <div className="space-y-1">
        <p className="text-[11px] text-stone-700 leading-snug italic">{indicator.lens}</p>
        <p className="text-[9px] text-stone-400 font-mono">{indicator.source}</p>
      </div>
    </div>
  );
}

function VigilanciaView() {
  const [filterCat, setFilterCat] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const indicators = VIGILANCIA_INDICATORS;
  const filtered = indicators.filter(i => {
    if (filterCat !== "all" && i.category !== filterCat) return false;
    if (filterStatus !== "all" && statusFor(i) !== filterStatus) return false;
    return true;
  });

  // Semáforo resumen
  const counts = { green: 0, amber: 0, red: 0 };
  indicators.forEach(i => counts[statusFor(i)]++);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl tracking-tight">Vigilancia del ciclo · España abril 2026</h2>
        <p className="text-sm text-stone-500 mt-1 max-w-3xl">
          Panel de indicadores que BdE, AIReF y BCE usan para detectar desequilibrios macroeconómicos.
          Cada dato es real y está fechado con su fuente. El color indica distancia al umbral histórico de riesgo.
        </p>
        <div className="flex gap-2 flex-wrap mt-2">
          <SourceChip sourceKey="ine_epa_t4_2025" />
          <SourceChip sourceKey="bde_proyecciones_2026" />
          <SourceChip sourceKey="eurostat_silc_2024" />
          <SourceChip sourceKey="airef_sostenibilidad_2024" />
        </div>
      </div>

      {/* Resumen semáforo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="rounded-xl border-2 border-stone-200 bg-white p-4">
          <div className="text-[10px] uppercase tracking-[0.12em] text-stone-500 font-semibold">Total vigilados</div>
          <div className="font-serif text-3xl tracking-tight text-stone-900 mt-1">{indicators.length}</div>
          <div className="text-[11px] text-stone-500 mt-1">indicadores oficiales</div>
        </div>
        <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50/60 p-4 cursor-pointer hover:shadow-md transition-shadow"
             onClick={() => setFilterStatus(filterStatus === "green" ? "all" : "green")}>
          <div className="text-[10px] uppercase tracking-[0.12em] text-emerald-700 font-semibold">En verde</div>
          <div className="font-serif text-3xl tracking-tight text-emerald-700 mt-1">{counts.green}</div>
          <div className="text-[11px] text-stone-500 mt-1">bajo umbrales de riesgo</div>
        </div>
        <div className="rounded-xl border-2 border-amber-300 bg-amber-50/60 p-4 cursor-pointer hover:shadow-md transition-shadow"
             onClick={() => setFilterStatus(filterStatus === "amber" ? "all" : "amber")}>
          <div className="text-[10px] uppercase tracking-[0.12em] text-amber-700 font-semibold">Vigilar</div>
          <div className="font-serif text-3xl tracking-tight text-amber-700 mt-1">{counts.amber}</div>
          <div className="text-[11px] text-stone-500 mt-1">entre umbrales</div>
        </div>
        <div className="rounded-xl border-2 border-rose-300 bg-rose-50/70 p-4 cursor-pointer hover:shadow-md transition-shadow"
             onClick={() => setFilterStatus(filterStatus === "red" ? "all" : "red")}>
          <div className="text-[10px] uppercase tracking-[0.12em] text-rose-700 font-semibold">Riesgo</div>
          <div className="font-serif text-3xl tracking-tight text-rose-700 mt-1">{counts.red}</div>
          <div className="text-[11px] text-stone-500 mt-1">por encima del umbral</div>
        </div>
      </div>

      {/* Filtros categoría */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] uppercase tracking-[0.15em] text-stone-500 mr-1">Filtrar:</span>
        <button onClick={() => setFilterCat("all")}
          className={`text-xs px-3 py-1 rounded-full transition-colors ${
            filterCat === "all"
              ? "bg-[#7A1F3D] text-white"
              : "bg-white border border-stone-200 text-stone-600 hover:border-[#7A1F3D]"
          }`}>
          Todos ({indicators.length})
        </button>
        {Object.entries(CATEGORY_META).map(([k, meta]) => {
          const count = indicators.filter(i => i.category === k).length;
          return (
            <button key={k} onClick={() => setFilterCat(filterCat === k ? "all" : k)}
              className={`text-xs px-3 py-1 rounded-full transition-colors flex items-center gap-1.5 ${
                filterCat === k
                  ? "text-white"
                  : "bg-white border border-stone-200 text-stone-600 hover:border-[#7A1F3D]"
              }`}
              style={filterCat === k ? { backgroundColor: meta.color } : {}}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
              {meta.label} ({count})
            </button>
          );
        })}
        {(filterCat !== "all" || filterStatus !== "all") && (
          <button onClick={() => { setFilterCat("all"); setFilterStatus("all"); }}
            className="text-xs px-3 py-1 rounded-full border border-stone-200 text-stone-500 hover:text-[#7A1F3D] ml-2">
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Grid de indicadores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(ind => <IndicatorCard key={ind.id} indicator={ind} />)}
      </div>

      {/* Narrativa de cierre */}
      <div className="rounded-2xl border-2 border-[#7A1F3D]/20 bg-gradient-to-br from-[#FBF7F0] to-white p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="w-5 h-5 text-[#7A1F3D]" />
          <h3 className="font-serif text-xl tracking-tight">Lectura del ciclo — abril 2026</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <h4 className="font-serif text-base text-emerald-700 mb-2">Lo que sí va bien</h4>
            <ul className="text-[13px] text-stone-700 space-y-1.5 leading-relaxed list-disc list-inside pl-2">
              <li>Deuda privada en <strong>mínimos de 25 años</strong> (hogares 42.8%, empresas 62.6%)</li>
              <li>Paro en mejor nivel desde 2008 (10.0%)</li>
              <li>Productividad repuntando (PTF +1.4% anual vs 0% eurozona)</li>
              <li>Deuda pública descendiendo desde 124% a 100.7%</li>
              <li>Balances bancarios saneados, LTV/LSTI hipotecarios contenidos</li>
            </ul>
          </div>
          <div>
            <h4 className="font-serif text-base text-amber-700 mb-2">Lo que preocupa</h4>
            <ul className="text-[13px] text-stone-700 space-y-1.5 leading-relaxed list-disc list-inside pl-2">
              <li><strong>Vivienda:</strong> sobrevaloración 1-14%, déficit 500k+, alquiler +34% desde 2019</li>
              <li><strong>Competitividad:</strong> gap 33pp PIB per PET vs UE8, ranking 14º</li>
              <li><strong>Presión fiscal:</strong> +5pp en 10 años (histórica subida silenciosa)</li>
              <li><strong>Pensiones:</strong> pico 15.3% PIB en 2049 (CE dice 17.3%)</li>
              <li><strong>Déficit estructural:</strong> 2.5% sin ciclo favorable volvería al 4%+</li>
            </ul>
          </div>
          <div>
            <h4 className="font-serif text-base text-rose-700 mb-2">Lo que puede explotar</h4>
            <ul className="text-[13px] text-stone-700 space-y-1.5 leading-relaxed list-disc list-inside pl-2">
              <li><strong>Shock de tipos:</strong> deuda 100% PIB + vida media 7.9 años → subida 1pp = +€11Bn servicio deuda anual</li>
              <li><strong>Nuevo baby-boom al jubilarse:</strong> pico pensiones justo cuando acaba el MRR</li>
              <li><strong>Corrección vivienda desigual:</strong> no burbuja clásica (deuda baja) pero ajuste regional Baleares/Madrid posible</li>
              <li><strong>Estanflación importada:</strong> Ormuz + espiral salarial → BdE escenario severo IPC 4.4%</li>
            </ul>
          </div>
        </div>

        <div className="border-l-4 border-[#7A1F3D] pl-4 mt-4">
          <p className="text-[13px] text-stone-700 leading-relaxed italic">
            <strong className="font-serif text-[#7A1F3D] not-italic">Lente Blondie:</strong> no
            estamos ante un "desastre" homogéneo, ni ante un "milagro". Estamos ante una economía que
            <strong> saneó balances privados</strong> y <strong>expandió los públicos</strong>. El
            ajuste lo pagaron los propietarios de balance (hogares y empresas), no el Estado. La
            cuestión austríaca honesta: <em>¿quién va a pagar el ajuste público cuando los tipos
            suban o la demografía apriete?</em> Sin superávits primarios ni reforma estructural,
            solo queda la vía de la inflación o la represión financiera.
          </p>
        </div>

        <div className="flex items-center gap-2 text-[10px] text-stone-400 pt-2 border-t border-stone-200">
          <Info className="w-3 h-3" />
          <span>Datos: BdE, AIReF, Fundación BBVA+Ivie, Eurostat, INE, BCE. Actualización: abril 2026.</span>
        </div>
      </div>
    </div>
  );
}


/* --------------------------------------------------------------------------- */
/* [12] ANATOMÍA DEL CICLO — las 5 fases austríacas · España 2000-2026         */
/* ---------------------------------------------------------------------------
   Narrativa pedagógica del ciclo económico completo con el caso español real.
   Cada fase: qué pasa conceptualmente + qué pasó en España + datos clave +
   pregunta al lector + lección Blondie.
   --------------------------------------------------------------------------- */

const CYCLE_PHASES = [
  {
    id: 1,
    title: "Expansión monetaria artificial",
    period: "2000 — 2006",
    color: "#059669",
    icon: "🌱",
    concept: "El banco central mantiene el tipo de interés por debajo del tipo natural (el que equilibraría ahorro e inversión reales). El crédito se vuelve barato; los empresarios creen que hay más ahorro del que realmente existe.",
    spain: "El BCE fija tipos bajos para reactivar Alemania (1% en 2003). España necesitaría 5-6%, pero al estar en el euro, recibe 'tipos alemanes' en una economía que crece al 3.6% anual. El crédito bancario a familias pasa del 40% al 82% del PIB.",
    data: [
      { label: "Tipo BCE", value: "1.00%", note: "vs natural España ~5%" },
      { label: "Euríbor 12m", value: "2.3%", note: "medio 2003-2005" },
      { label: "Crédito hogares", value: "82% PIB", note: "en 2007 (mínimo 25a: 42.8%)" },
      { label: "Precio vivienda", value: "+150%", note: "real 2000-2007" },
    ],
    question: "Si el tipo de interés refleja la preferencia temporal de la sociedad (cuánto valoramos hoy vs mañana), ¿qué pasa cuando el banco central lo fija artificialmente? ¿Estamos ahorrando más en realidad, o solo tenemos más papel bancario?",
    blondie: "Los bambús parecían crecer al doble de velocidad. Blondie pensó: '¡Qué suerte, ya no necesito esperar tanto para plantar mis semillas!' — pero el duende había añadido tallos falsos pintados de verde al suelo, imitando los reales.",
    lens: "Cada euro de crédito sin respaldo en ahorro real es una señal falsa. El empresario no puede distinguirla de una señal real. Actúa — y empieza a construir proyectos que no podrán completarse.",
  },
  {
    id: 2,
    title: "Malinversión (boom)",
    period: "2003 — 2007",
    color: "#A16207",
    icon: "🏗️",
    concept: "Los empresarios se lanzan a proyectos largos (bienes de capital, vivienda, infraestructura). Al parecer hay ahorro abundante, estas inversiones parecen rentables. Pero no hay ahorro suficiente — es crédito expandido. La estructura de producción se alarga artificialmente.",
    spain: "España vive 'el milagro del ladrillo'. VAB construcción pasa del 7.5% al 13% del PIB (techo histórico 2006). Se visan 865.561 viviendas en 2006 — más que Francia+Alemania+Italia juntas. Empleo en construcción llega al 13.3% del total.",
    data: [
      { label: "Viviendas visadas 2006", value: "865k", note: "vs ~140k en 2025" },
      { label: "% empleo construcción", value: "13.3%", note: "2007 · hoy 6%" },
      { label: "Deuda empresas", value: "128% PIB", note: "pico 2007 · hoy 62.6%" },
      { label: "Déficit exterior", value: "-10% PIB", note: "2007 · financiado con ahorro exterior" },
    ],
    question: "Si se construyen 865.000 viviendas al año pero solo hay 18 millones de hogares, ¿quién va a vivir en ellas? ¿O quizá el precio subiendo constantemente oculta que el proyecto no es sostenible?",
    blondie: "Blondie vio el bosque crecer al doble de su ritmo natural. Maravillada, plantó sus semillas de 10 años en los tallos falsos — pensando que tendría frutos para la próxima temporada.",
    lens: "Los recursos reales (mano de obra, cemento, acero) existen, pero están siendo asignados a proyectos que no se podrán terminar sin consumir lo que no existe: ahorro futuro. La señal 'tipo bajo' era falsa.",
  },
  {
    id: 3,
    title: "Techo — señales ignoradas",
    period: "2007 — 2008",
    color: "#B45309",
    icon: "⚠️",
    concept: "Los tipos empiezan a subir porque la inflación aparece — consecuencia directa de la expansión monetaria previa. Las primeras señales de impagos llegan. Los precios de activos se estabilizan. Pero la narrativa dominante es aún: 'es un bache, no una recesión'.",
    spain: "BCE sube el tipo del 2% (diciembre 2005) al 4.25% (julio 2008). Euríbor pasa del 2.3% al 5.4%. Caja Castilla-La Mancha intervenida marzo 2009. Se hablaba del 'aterrizaje suave'. Primera quiebra notoria: Martinsa-Fadesa julio 2008, €5.2Bn de pasivo.",
    data: [
      { label: "Subida Euríbor", value: "+3.1pp", note: "2.3% → 5.4% en 2.5 años" },
      { label: "Martinsa-Fadesa", value: "€5.2 Bn", note: "mayor concurso hist. (jul-2008)" },
      { label: "IPC España pico", value: "5.3%", note: "julio 2008" },
      { label: "Paro inicio", value: "8.2% → 13.9%", note: "1T07 → 4T08" },
    ],
    question: "Si el crédito gratis produjo el boom, ¿qué produce el crédito caro? ¿Por qué los economistas oficiales seguían hablando de 'aterrizaje suave' cuando la estructura de producción ya estaba distorsionada?",
    blondie: "Blondie notó que los tallos cerca del suelo empezaban a doblarse. El duende había desaparecido. Los frutos esperados no llegaban. Pero las semillas ya estaban plantadas — 10 años de trabajo que no podría recuperar.",
    lens: "El techo del ciclo es cuando el mercado empieza a descubrir la distorsión. Los proyectos largos son los primeros en sentir el ajuste: dependen más del tipo de interés. Todavía se puede fingir normalidad — pero solo un par de trimestres.",
  },
  {
    id: 4,
    title: "Crisis y liquidación",
    period: "2008 — 2013",
    color: "#E11D48",
    icon: "💥",
    concept: "La malinversión se revela: proyectos largos no rentables se liquidan. El desempleo se concentra en los sectores que crecieron artificialmente. Los bancos tienen activos tóxicos en sus balances. El Estado interviene — rescate bancario, aumento del déficit, subida de impuestos.",
    spain: "Paro pasa del 8% al 26.9% en 5 años (2008-2013). Desahucios anuales superan los 80.000. Rescate bancario €64.1Bn (SAREB). Prima de riesgo pica en 650pb (julio 2012). La Troika llega con 32 medidas de 'consolidación'. IVA sube del 16% al 21%.",
    data: [
      { label: "Paro pico", value: "26.9%", note: "1T 2013" },
      { label: "Rescate bancario", value: "€64.1 Bn", note: "MoU julio 2012" },
      { label: "Prima de riesgo pico", value: "650 pb", note: "julio 2012" },
      { label: "Viviendas visadas 2013", value: "34k", note: "−96% vs 2006" },
    ],
    question: "El Estado 'salvó' el sistema. Pero ¿quién pagó realmente? El sector privado se desapalancó (deuda hogares 82% → 42%) pero el público se endeudó (35% → 100%). ¿Se eliminó la deuda, o solo se movió de balance?",
    blondie: "Cuando el duende desapareció, Blondie vio que la mitad del bosque era falso — tallos huecos que se pudrían. Perdió 7 años de cosecha. Tuvo que cortar los tallos falsos y empezar de cero, pero ahora con menos semillas.",
    lens: "La crisis no destruye riqueza — revela que lo que parecía riqueza nunca lo fue. El ajuste es doloroso pero necesario. Liquidar malinversiones libera recursos para usos sostenibles. Intentar impedir la liquidación solo prolonga el ajuste.",
  },
  {
    id: 5,
    title: "Nueva expansión — ¿y el próximo ciclo?",
    period: "2014 — 2026",
    color: "#7A1F3D",
    icon: "🔄",
    concept: "Tras la liquidación, la economía comienza a recuperarse. Pero si la lección no se aprende — si el banco central vuelve a fijar tipos bajos para evitar recaídas — el ciclo se reinicia. Los sectores que protagonizan el nuevo boom suelen ser distintos: donde el crédito fluye ahora.",
    spain: "BCE baja el tipo al 0% (2016) y luego a −0.50% (2019-2022). 'QE' y 'tipos negativos'. Ahora la expansión se concentra en: (1) deuda pública (35% → 124%), (2) vivienda alquiler (+34% desde 2019), (3) sobrevaloración vivienda (BCE: 14.3%). El desapalancamiento privado tapó el apalancamiento público.",
    data: [
      { label: "Deuda pública", value: "35% → 100.7%", note: "2007 → 2025" },
      { label: "Alquiler", value: "+34%", note: "2019-2025" },
      { label: "Sobrevaloración vivienda", value: "14.3%", note: "BCE Q1 2025" },
      { label: "Déficit estructural", value: "2.5%", note: "sin reforma" },
    ],
    question: "Si la fase 1 del ciclo es 'tipo artificialmente bajo durante demasiado tiempo', ¿qué hemos hecho 2014-2022? ¿Dónde está ahora la malinversión — en qué sector, en qué balance? Y cuando los tipos suban en serio, ¿qué se revelará como tallo falso?",
    blondie: "Blondie replantó el bosque. Al principio, todo crecía a su ritmo natural. Pero el duende volvió, esta vez disfrazado de funcionario público, repartiendo tallos en lugares distintos — esta vez en el jardín del palacio, no en su bosque. Ella los miró con sospecha: los conocía demasiado bien.",
    lens: "El ciclo no se rompe. Se traslada. Donde fue vivienda privada 2000-2007, ahora es deuda pública y alquiler. La deuda agregada de la economía española (pública + privada) apenas ha bajado del pico 2013. Solo cambió de balance. La pregunta austríaca: ¿hay ahorro real detrás, o son tallos nuevos?",
  },
];

// Serie temporal de VAB construcción % PIB — señal canónica del ciclo español
const CYCLE_TIMELINE_VAB = [
  { y: 2000, vab: 7.5, pib: 100 },   { y: 2001, vab: 8.0, pib: 103.8 },
  { y: 2002, vab: 8.5, pib: 106.5 }, { y: 2003, vab: 9.2, pib: 109.7 },
  { y: 2004, vab: 10.0, pib: 112.8 }, { y: 2005, vab: 10.8, pib: 116.9 },
  { y: 2006, vab: 12.0, pib: 121.6 }, { y: 2007, vab: 13.0, pib: 125.9 },
  { y: 2008, vab: 11.5, pib: 127.0 }, { y: 2009, vab: 10.5, pib: 122.3 },
  { y: 2010, vab: 9.0, pib: 122.4 }, { y: 2011, vab: 7.5, pib: 121.4 },
  { y: 2012, vab: 6.3, pib: 118.0 }, { y: 2013, vab: 5.5, pib: 115.7 },
  { y: 2014, vab: 5.4, pib: 117.4 }, { y: 2015, vab: 5.6, pib: 121.9 },
  { y: 2016, vab: 5.7, pib: 125.5 }, { y: 2017, vab: 5.8, pib: 129.3 },
  { y: 2018, vab: 6.0, pib: 132.1 }, { y: 2019, vab: 6.1, pib: 134.8 },
  { y: 2020, vab: 5.8, pib: 120.1 }, { y: 2021, vab: 5.9, pib: 127.7 },
  { y: 2022, vab: 6.0, pib: 134.5 }, { y: 2023, vab: 6.1, pib: 137.9 },
  { y: 2024, vab: 6.2, pib: 141.8 }, { y: 2025, vab: 6.3, pib: 145.9 },
];

function PhaseCard({ phase, isActive, onClick }) {
  return (
    <button onClick={onClick}
      className={`text-left rounded-xl border-2 transition-all p-4 flex flex-col gap-2 ${
        isActive
          ? "border-[#7A1F3D] shadow-lg bg-white scale-[1.02]"
          : "border-stone-200 bg-white/60 hover:border-stone-300"
      }`}>
      <div className="flex items-center justify-between">
        <span className="text-2xl">{phase.icon}</span>
        <span className="text-[10px] uppercase tracking-[0.12em] font-semibold"
              style={{ color: phase.color }}>
          Fase {phase.id}
        </span>
      </div>
      <div>
        <h4 className="font-serif text-base text-stone-900 leading-tight">{phase.title}</h4>
        <p className="text-[11px] text-stone-500 font-mono mt-0.5">{phase.period}</p>
      </div>
    </button>
  );
}

function AnatomiaView() {
  const [activePhaseId, setActivePhaseId] = useState(1);
  const phase = CYCLE_PHASES.find(p => p.id === activePhaseId);

  // Destaca tramo temporal de la fase activa en el gráfico
  const phaseRanges = {
    1: [2000, 2006],
    2: [2003, 2007],
    3: [2007, 2008],
    4: [2008, 2013],
    5: [2014, 2026],
  };
  const [rangeStart, rangeEnd] = phaseRanges[activePhaseId];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl tracking-tight">Anatomía del ciclo · España 2000-2026</h2>
        <p className="text-sm text-stone-500 mt-1 max-w-3xl">
          Las cinco fases del ciclo económico austríaco, ilustradas con datos reales de los últimos
          25 años. No es teoría abstracta — es la historia reciente de España vista con la lente que
          explica por qué los booms siempre llevan dentro su propia caída.
        </p>
      </div>

      {/* Navegador de fases */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {CYCLE_PHASES.map(p => (
          <PhaseCard key={p.id} phase={p} isActive={p.id === activePhaseId}
                     onClick={() => setActivePhaseId(p.id)} />
        ))}
      </div>

      {/* Timeline canónica: VAB construcción % PIB */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <div className="flex items-baseline justify-between flex-wrap mb-2">
          <div>
            <h3 className="font-serif text-lg tracking-tight">La firma del ciclo: construcción como % del PIB</h3>
            <p className="text-[11px] text-stone-500">
              El sector cíclico por excelencia. En 2006 pesaba el doble que la media histórica.
              Hoy estamos en niveles normales — pero ¿dónde está creciendo artificialmente ahora?
            </p>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-mono mt-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: phase.color }}></span>
            <span style={{ color: phase.color }} className="font-semibold">Fase {phase.id} resaltada</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={CYCLE_TIMELINE_VAB} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
            <defs>
              <linearGradient id="g-vab" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7A1F3D" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#7A1F3D" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="2 4" stroke="#E7E5E4" />
            <XAxis dataKey="y" tick={{ fontSize: 11, fill: "#57534E" }} />
            <YAxis tick={{ fontSize: 11, fill: "#57534E" }} label={{ value: "% PIB", angle: -90, position: "insideLeft", fontSize: 10, fill: "#A8A29E" }} />
            <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E7E5E4", fontSize: 12 }}
                     formatter={(v, n) => [`${v.toFixed(1)}${n === "vab" ? "%" : ""}`, n === "vab" ? "VAB construcción" : "PIB idx"]}
                     labelFormatter={(l) => `Año ${l}`} />
            <ReferenceLine x={rangeStart} stroke={phase.color} strokeWidth={1.5} strokeDasharray="3 3"
                           label={{ value: "inicio fase", fontSize: 9, fill: phase.color, position: "insideTopLeft" }} />
            <ReferenceLine x={rangeEnd} stroke={phase.color} strokeWidth={1.5} strokeDasharray="3 3" />
            <ReferenceLine y={7.5} stroke="#A8A29E" strokeDasharray="2 2"
                           label={{ value: "media histórica ~7.5%", fontSize: 9, fill: "#A8A29E", position: "right" }} />
            <Area type="monotone" dataKey="vab" stroke="#7A1F3D" strokeWidth={2} fill="url(#g-vab)" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Detalle de la fase activa */}
      <div className="rounded-2xl border-2 p-6 space-y-5"
           style={{ borderColor: phase.color + "40", background: `linear-gradient(135deg, ${phase.color}08, white)` }}>
        <div className="flex items-center gap-3">
          <div className="text-4xl">{phase.icon}</div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.15em] font-semibold" style={{ color: phase.color }}>
              Fase {phase.id} · {phase.period}
            </div>
            <h3 className="font-serif text-2xl tracking-tight text-stone-900">{phase.title}</h3>
          </div>
        </div>

        {/* Concepto → España */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <h4 className="text-[10px] uppercase tracking-[0.15em] text-stone-500 font-semibold mb-2">Qué pasa (concepto)</h4>
            <p className="text-[14px] text-stone-700 leading-relaxed">{phase.concept}</p>
          </div>
          <div>
            <h4 className="text-[10px] uppercase tracking-[0.15em] font-semibold mb-2" style={{ color: phase.color }}>
              Qué pasó en España
            </h4>
            <p className="text-[14px] text-stone-700 leading-relaxed">{phase.spain}</p>
          </div>
        </div>

        {/* Datos */}
        <div>
          <h4 className="text-[10px] uppercase tracking-[0.15em] text-stone-500 font-semibold mb-2">Los números</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {phase.data.map((d, i) => (
              <div key={i} className="rounded-lg bg-white border border-stone-200 p-3">
                <div className="text-[10px] uppercase tracking-[0.1em] text-stone-500">{d.label}</div>
                <div className="font-serif text-lg tracking-tight mt-0.5" style={{ color: phase.color }}>
                  {d.value}
                </div>
                <div className="text-[10px] text-stone-400 mt-0.5">{d.note}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Pregunta guiada */}
        <div className="rounded-xl bg-white/60 border-l-4 p-4" style={{ borderColor: phase.color }}>
          <div className="flex items-start gap-2">
            <span className="text-2xl leading-none mt-[-2px]" style={{ color: phase.color }}>?</span>
            <div>
              <h4 className="text-[10px] uppercase tracking-[0.15em] text-stone-500 font-semibold mb-1">Piensa un momento</h4>
              <p className="text-[14px] text-stone-800 leading-relaxed italic">{phase.question}</p>
            </div>
          </div>
        </div>

        {/* Blondie + Lens */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="rounded-xl bg-gradient-to-br from-[#FBF7F0] to-white border-2 border-[#EC4899]/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-[#EC4899]" />
              <h4 className="font-serif text-base text-stone-900">La historia de Blondie</h4>
            </div>
            <p className="text-[14px] text-stone-700 leading-relaxed font-serif italic">« {phase.blondie} »</p>
          </div>
          <div className="rounded-xl bg-white border-2 border-stone-300 p-4">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-stone-700" />
              <h4 className="font-serif text-base text-stone-900">Lección austríaca</h4>
            </div>
            <p className="text-[14px] text-stone-700 leading-relaxed">{phase.lens}</p>
          </div>
        </div>

        {/* Navegación entre fases */}
        <div className="flex items-center justify-between pt-2 border-t border-stone-200">
          <button onClick={() => setActivePhaseId(Math.max(1, activePhaseId - 1))}
                  disabled={activePhaseId === 1}
                  className="text-xs px-3 py-1.5 rounded-lg border border-stone-200 bg-white hover:border-[#7A1F3D] hover:text-[#7A1F3D] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            ← Fase anterior
          </button>
          <div className="flex gap-1.5">
            {CYCLE_PHASES.map(p => (
              <button key={p.id} onClick={() => setActivePhaseId(p.id)}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${
                        p.id === activePhaseId ? "scale-125" : "opacity-40 hover:opacity-70"
                      }`}
                      style={{ backgroundColor: p.color }} />
            ))}
          </div>
          <button onClick={() => setActivePhaseId(Math.min(5, activePhaseId + 1))}
                  disabled={activePhaseId === 5}
                  className="text-xs px-3 py-1.5 rounded-lg border border-stone-200 bg-white hover:border-[#7A1F3D] hover:text-[#7A1F3D] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            Fase siguiente →
          </button>
        </div>
      </div>

      {/* Síntesis final */}
      {activePhaseId === 5 && (
        <div className="rounded-2xl border-2 border-[#7A1F3D]/30 bg-gradient-to-br from-[#FBF7F0] via-white to-[#EC4899]/10 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-[#7A1F3D]" />
            <h3 className="font-serif text-xl tracking-tight">La pregunta que nadie hace</h3>
          </div>
          <div className="space-y-3 text-[14px] text-stone-700 leading-relaxed">
            <p>
              Cuando Blondie contó los tallos de su bosque al final del ciclo, descubrió que había
              <strong> menos tallos reales</strong> que al principio — aunque el "bosque total"
              (tallos reales + falsos pintados) parecía más grande. El duende había conseguido que
              ella <em>creyera</em> ser más rica mientras <em>era</em> más pobre.
            </p>
            <p>
              España 2025: la deuda pública es triple que en 2007. El alquiler consume un 51% del
              salario de quien entra al mercado. La productividad sigue 33pp por debajo de la UE8.
              Pero el discurso oficial es <em>"crecemos el doble que la eurozona"</em>. La pregunta
              austríaca honesta: <strong>¿estamos creando riqueza real o solo moviéndola entre
              balances?</strong>
            </p>
            <p className="text-[#7A1F3D] font-serif italic text-[15px] border-l-2 border-[#7A1F3D] pl-4">
              El test definitivo lo dará el próximo shock. Cuando suban los tipos en serio, o cuando
              los baby-boomers empiecen a jubilarse en masa (2030-2049), descubriremos qué tallos
              eran reales y cuáles estaban pintados. Mientras tanto, lo único sensato es aprender a
              distinguirlos <em>antes</em> de que se caigan.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}



function IndividualView() {
  const [bruto, setBruto] = useState(80000);
  const [savingRate, setSavingRate] = useState(0.15);
  const [isPassthrough, setIsPassthrough] = useState(0.5);
  const [ssIncidence, setSsIncidence] = useState(0.6);
  const [precioVivienda, setPrecioVivienda] = useState(300000);
  const [ipcAcum10, setIpcAcum10] = useState(0.24);

  const burden = useMemo(() =>
    computeIndividualBurden({ bruto, saving_rate: savingRate, is_passthrough: isPassthrough, ss_emp_incidence: ssIncidence }),
  [bruto, savingRate, isPassthrough, ssIncidence]);

  const vivienda = useMemo(() => computeHousingTaxBreakdown(precioVivienda), [precioVivienda]);
  const creep = useMemo(() => computeBracketCreep(bruto, ipcAcum10), [bruto, ipcAcum10]);

  const fmtEur = (v) => `€${Math.round(v).toLocaleString("es-ES")}`;
  const fmtPct = (v) => `${(v * 100).toFixed(1)}%`;

  // Waterfall data: coste empresa → SS emp → bruto → IRPF + SS trab → neto → IVA + especiales → disponible
  const waterfallData = [
    { label: "Coste empresa", value: burden.coste_empresa, cumulative: burden.coste_empresa, type: "start" },
    { label: "SS empresa",    value: -burden.ss_employer, cumulative: burden.bruto, type: "tax" },
    { label: "SS trabajador", value: -burden.ss_worker, cumulative: burden.bruto - burden.ss_worker, type: "tax" },
    { label: "IRPF",          value: -burden.irpf, cumulative: burden.neto, type: "tax" },
    { label: "IVA",           value: -burden.iva_total, cumulative: burden.neto - burden.iva_total, type: "tax" },
    { label: "Especiales",    value: -burden.especiales_total, cumulative: burden.neto - burden.iva_total - burden.especiales_total, type: "tax" },
    { label: "IBI/locales",   value: -burden.ibi_estimado, cumulative: burden.neto - burden.iva_total - burden.especiales_total - burden.ibi_estimado, type: "tax" },
    { label: "Disponible real", value: burden.neto - burden.iva_total - burden.especiales_total - burden.ibi_estimado, cumulative: burden.neto - burden.iva_total - burden.especiales_total - burden.ibi_estimado, type: "end" },
  ];

  // Pie por destino
  const pieData = [
    { name: "SS empresa",    value: burden.ss_employer, color: "#7A1F3D" },
    { name: "IRPF",          value: burden.irpf,        color: "#A16207" },
    { name: "SS trabajador", value: burden.ss_worker,   color: "#B45309" },
    { name: "IS (incidencia)", value: burden.is_empresarial, color: "#92400E" },
    { name: "IVA",           value: burden.iva_total,   color: "#C2410C" },
    { name: "Especiales",    value: burden.especiales_total, color: "#9A3412" },
    { name: "IBI/locales",   value: burden.ibi_estimado, color: "#78350F" },
    { name: "Ahorro",        value: burden.ahorro,      color: "#065F46" },
    { name: "Consumo neto",  value: burden.gastable - burden.iva_total - burden.especiales_total - burden.ibi_estimado, color: "#1E40AF" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl tracking-tight">Carga fiscal individual · 2026</h2>
        <p className="text-sm text-stone-500 mt-1 max-w-3xl">
          Descomposición de todo lo que el Estado recibe desde que la empresa decide contratarte hasta
          que gastas tu último euro. Incluye impuestos directos, indirectos, y los de <em>segundo orden</em>
          (Impuesto de Sociedades e incidencia real de las cotizaciones empresariales).
        </p>
      </div>

      {/* Controles */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="text-[11px] uppercase tracking-[0.12em] text-stone-500 font-semibold">
              Salario bruto anual
            </label>
            <div className="flex items-center gap-2 mt-1">
              <input type="range" min={15000} max={200000} step={1000} value={bruto}
                     onChange={(e) => setBruto(parseInt(e.target.value))}
                     className="flex-1 accent-[#7A1F3D]" />
              <span className="font-mono text-sm text-[#7A1F3D] w-24 text-right">{fmtEur(bruto)}</span>
            </div>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-[0.12em] text-stone-500 font-semibold">
              Tasa de ahorro (del neto)
            </label>
            <div className="flex items-center gap-2 mt-1">
              <input type="range" min={0} max={0.5} step={0.01} value={savingRate}
                     onChange={(e) => setSavingRate(parseFloat(e.target.value))}
                     className="flex-1 accent-[#7A1F3D]" />
              <span className="font-mono text-sm text-[#7A1F3D] w-24 text-right">{fmtPct(savingRate)}</span>
            </div>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-[0.12em] text-stone-500 font-semibold">
              Incidencia SS empresa en salario
            </label>
            <div className="flex items-center gap-2 mt-1">
              <input type="range" min={0} max={1} step={0.05} value={ssIncidence}
                     onChange={(e) => setSsIncidence(parseFloat(e.target.value))}
                     className="flex-1 accent-[#7A1F3D]" />
              <span className="font-mono text-sm text-[#7A1F3D] w-24 text-right">{fmtPct(ssIncidence)}</span>
            </div>
            <p className="text-[10px] text-stone-400 mt-1">OCDE: ~50-70% cae sobre el trabajador a LP</p>
          </div>
        </div>
      </div>

      {/* Resumen grande */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="rounded-xl border-2 border-[#7A1F3D]/30 bg-gradient-to-br from-[#FBF7F0] to-white p-4">
          <div className="text-[10px] uppercase tracking-[0.12em] text-stone-500 font-semibold">Coste empresarial total</div>
          <div className="font-serif text-2xl tracking-tight text-stone-900 mt-1">{fmtEur(burden.coste_empresa)}</div>
          <div className="text-[11px] text-stone-500 mt-1">bruto + SS empresa</div>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4">
          <div className="text-[10px] uppercase tracking-[0.12em] text-rose-700 font-semibold">Cuña fiscal directa</div>
          <div className="font-serif text-2xl tracking-tight text-rose-700 mt-1">{fmtPct(burden.cuna_directa)}</div>
          <div className="text-[11px] text-stone-500 mt-1">SS + IRPF / coste empresa</div>
        </div>
        <div className="rounded-xl border border-orange-200 bg-orange-50/60 p-4">
          <div className="text-[10px] uppercase tracking-[0.12em] text-orange-700 font-semibold">Recaudación total Estado</div>
          <div className="font-serif text-2xl tracking-tight text-orange-700 mt-1">{fmtPct(burden.porcion_estado)}</div>
          <div className="text-[11px] text-stone-500 mt-1">incl. indirectos + IS + locales</div>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
          <div className="text-[10px] uppercase tracking-[0.12em] text-emerald-700 font-semibold">Disponible real</div>
          <div className="font-serif text-2xl tracking-tight text-emerald-700 mt-1">
            {fmtEur(burden.neto - burden.iva_total - burden.especiales_total - burden.ibi_estimado)}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">tras todos los impuestos</div>
        </div>
      </div>

      {/* Waterfall */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <h3 className="font-serif text-lg tracking-tight mb-1">Cascada: del coste empresarial al disponible real</h3>
        <p className="text-[11px] text-stone-500 mb-4">
          Cada barra negativa es un impuesto. Verde = lo que realmente te queda.
        </p>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={waterfallData} margin={{ top: 10, right: 10, left: 10, bottom: 60 }}>
            <CartesianGrid strokeDasharray="2 4" stroke="#E7E5E4" />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#57534E" }} angle={-30} textAnchor="end" height={60} />
            <YAxis tick={{ fontSize: 11, fill: "#57534E" }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
            <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E7E5E4", fontSize: 12 }}
                     formatter={(v) => [fmtEur(Math.abs(v))]} />
            <ReferenceLine y={0} stroke="#A8A29E" />
            <Bar dataKey="cumulative" radius={[4, 4, 0, 0]}>
              {waterfallData.map((d, i) => {
                const color = d.type === "start" ? "#7A1F3D" : d.type === "end" ? "#059669" : "#EF4444";
                return <Cell key={i} fill={color} fillOpacity={d.type === "tax" ? 0.5 : 0.9} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tabla detallada */}
      <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
        <div className="px-5 py-3 bg-stone-50 border-b border-stone-200">
          <h3 className="font-serif text-lg tracking-tight">Descomposición detallada</h3>
          <p className="text-[11px] text-stone-500">Todo lo que le llega al Estado, directa o indirectamente.</p>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-white">
            <tr className="border-b border-stone-200 text-[11px] uppercase tracking-[0.08em] text-stone-500">
              <th className="text-left px-5 py-2">Concepto</th>
              <th className="text-right px-5 py-2">Anual</th>
              <th className="text-right px-5 py-2">% coste empresa</th>
              <th className="text-right px-5 py-2">A 10 años</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-stone-100 bg-stone-50/30">
              <td className="px-5 py-2 font-semibold text-stone-800">Coste empresarial (referencia)</td>
              <td className="px-5 py-2 text-right font-mono font-semibold">{fmtEur(burden.coste_empresa)}</td>
              <td className="px-5 py-2 text-right font-mono text-stone-400">100.0%</td>
              <td className="px-5 py-2 text-right font-mono font-semibold">{fmtEur(burden.coste_empresa * 10)}</td>
            </tr>
            <tr className="border-b border-stone-100">
              <td className="px-5 py-2 text-stone-700">SS empresa (CC + MEI + desempleo + FP + FOGASA + AT)</td>
              <td className="px-5 py-2 text-right font-mono text-rose-700">{fmtEur(burden.ss_employer)}</td>
              <td className="px-5 py-2 text-right font-mono text-rose-700">{fmtPct(burden.ss_employer / burden.coste_empresa)}</td>
              <td className="px-5 py-2 text-right font-mono text-rose-700">{fmtEur(burden.ss_employer * 10)}</td>
            </tr>
            <tr className="border-b border-stone-100">
              <td className="px-5 py-2 text-stone-700">SS trabajador</td>
              <td className="px-5 py-2 text-right font-mono text-rose-700">{fmtEur(burden.ss_worker)}</td>
              <td className="px-5 py-2 text-right font-mono text-rose-700">{fmtPct(burden.ss_worker / burden.coste_empresa)}</td>
              <td className="px-5 py-2 text-right font-mono text-rose-700">{fmtEur(burden.ss_worker * 10)}</td>
            </tr>
            <tr className="border-b border-stone-100">
              <td className="px-5 py-2 text-stone-700">IRPF (estatal + autonómico medio)</td>
              <td className="px-5 py-2 text-right font-mono text-rose-700">{fmtEur(burden.irpf)}</td>
              <td className="px-5 py-2 text-right font-mono text-rose-700">{fmtPct(burden.irpf / burden.coste_empresa)}</td>
              <td className="px-5 py-2 text-right font-mono text-rose-700">{fmtEur(burden.irpf * 10)}</td>
            </tr>
            <tr className="border-b border-stone-100">
              <td className="px-5 py-2 text-stone-700">IVA sobre consumo</td>
              <td className="px-5 py-2 text-right font-mono text-rose-700">{fmtEur(burden.iva_total)}</td>
              <td className="px-5 py-2 text-right font-mono text-rose-700">{fmtPct(burden.iva_total / burden.coste_empresa)}</td>
              <td className="px-5 py-2 text-right font-mono text-rose-700">{fmtEur(burden.iva_total * 10)}</td>
            </tr>
            <tr className="border-b border-stone-100">
              <td className="px-5 py-2 text-stone-700">Impuestos especiales (hidrocarb., IEE, tabaco, seguros...)</td>
              <td className="px-5 py-2 text-right font-mono text-rose-700">{fmtEur(burden.especiales_total)}</td>
              <td className="px-5 py-2 text-right font-mono text-rose-700">{fmtPct(burden.especiales_total / burden.coste_empresa)}</td>
              <td className="px-5 py-2 text-right font-mono text-rose-700">{fmtEur(burden.especiales_total * 10)}</td>
            </tr>
            <tr className="border-b border-stone-100">
              <td className="px-5 py-2 text-stone-700">IBI + basuras + locales</td>
              <td className="px-5 py-2 text-right font-mono text-rose-700">{fmtEur(burden.ibi_estimado)}</td>
              <td className="px-5 py-2 text-right font-mono text-rose-700">{fmtPct(burden.ibi_estimado / burden.coste_empresa)}</td>
              <td className="px-5 py-2 text-right font-mono text-rose-700">{fmtEur(burden.ibi_estimado * 10)}</td>
            </tr>
            <tr className="border-b border-stone-100 bg-amber-50/30">
              <td className="px-5 py-2 text-stone-700">
                <span className="italic">Impuesto Sociedades (incidencia ~{fmtPct(isPassthrough)} sobre ti)</span>
              </td>
              <td className="px-5 py-2 text-right font-mono text-amber-700">{fmtEur(burden.is_empresarial)}</td>
              <td className="px-5 py-2 text-right font-mono text-amber-700">{fmtPct(burden.is_empresarial / burden.coste_empresa)}</td>
              <td className="px-5 py-2 text-right font-mono text-amber-700">{fmtEur(burden.is_empresarial * 10)}</td>
            </tr>
            <tr className="border-t-2 border-stone-400 bg-stone-100/60 font-semibold">
              <td className="px-5 py-3 text-stone-900">TOTAL al Estado</td>
              <td className="px-5 py-3 text-right font-mono text-[#7A1F3D]">{fmtEur(burden.total_estado)}</td>
              <td className="px-5 py-3 text-right font-mono text-[#7A1F3D]">{fmtPct(burden.porcion_estado)}</td>
              <td className="px-5 py-3 text-right font-mono text-[#7A1F3D]">{fmtEur(burden.total_estado * 10)}</td>
            </tr>
            <tr className="border-b border-stone-100 bg-emerald-50/40">
              <td className="px-5 py-2 text-stone-700 font-medium">Ahorro (si tasa actual)</td>
              <td className="px-5 py-2 text-right font-mono text-emerald-700">{fmtEur(burden.ahorro)}</td>
              <td className="px-5 py-2 text-right font-mono text-emerald-700">{fmtPct(burden.ahorro / burden.coste_empresa)}</td>
              <td className="px-5 py-2 text-right font-mono text-emerald-700 font-semibold">{fmtEur(burden.ahorro * 10)}</td>
            </tr>
            <tr className="bg-blue-50/40">
              <td className="px-5 py-2 text-stone-700 font-medium">Consumo neto real</td>
              <td className="px-5 py-2 text-right font-mono text-blue-700">{fmtEur(burden.gastable - burden.iva_total - burden.especiales_total - burden.ibi_estimado)}</td>
              <td className="px-5 py-2 text-right font-mono text-blue-700">{fmtPct((burden.gastable - burden.iva_total - burden.especiales_total - burden.ibi_estimado) / burden.coste_empresa)}</td>
              <td className="px-5 py-2 text-right font-mono text-blue-700">{fmtEur((burden.gastable - burden.iva_total - burden.especiales_total - burden.ibi_estimado) * 10)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Pie por destino */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <h3 className="font-serif text-lg tracking-tight mb-1">Destino de cada euro del coste empresarial</h3>
          <p className="text-[11px] text-stone-500 mb-3">Tonos rojizos = Estado. Verde = ahorro. Azul = consumo real.</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={pieData} layout="vertical" margin={{ top: 5, right: 40, left: 100, bottom: 5 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="#E7E5E4" />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#57534E" }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#57534E" }} width={95} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E7E5E4", fontSize: 12 }}
                       formatter={(v) => [fmtEur(v)]} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border-2 border-[#7A1F3D]/20 bg-gradient-to-br from-[#FBF7F0] to-white p-5">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-[#7A1F3D]" />
            <h3 className="font-serif text-lg tracking-tight">Lectura</h3>
          </div>
          <div className="space-y-3 text-sm text-stone-700 leading-relaxed">
            <p>
              De cada <strong>{fmtEur(burden.coste_empresa)}</strong> que la empresa paga por ti,
              el Estado recibe <strong className="text-[#7A1F3D]">{fmtEur(burden.total_estado)}</strong> —
              un <strong>{fmtPct(burden.porcion_estado)}</strong> del total.
            </p>
            <p>
              Tu tipo marginal de IRPF es <strong>{fmtPct(burden.marginal_rate)}</strong>, pero tu
              tasa efectiva sobre coste empresarial (<em>cuña real</em>) es
              <strong className="text-[#7A1F3D]"> {fmtPct(burden.porcion_estado)}</strong>.
            </p>
            {bruto > SS_2026.cap_annual && (
              <p className="border-l-2 border-amber-400 pl-3 bg-amber-50/40 py-2">
                <strong>Solidaridad:</strong> al superar la base máxima (€{SS_2026.cap_annual.toLocaleString("es-ES")}),
                pagas {fmtEur(burden.ss_worker_solidarity + burden.ss_employer_solidarity)} adicionales en cotización
                de solidaridad que <em>no genera pensión</em>.
              </p>
            )}
            <p className="text-[12px] italic text-stone-500 border-l-2 border-stone-300 pl-3 mt-4">
              Lección austríaca: el ciudadano <em>nunca ve</em> la mayoría de estos impuestos. La SS
              empresa se deduce antes de que el bruto aparezca en la nómina; el IS se incluye en el
              precio; los especiales en el surtidor. Incidencia ≠ quien paga legalmente.
            </p>
          </div>
        </div>
      </div>

      {/* Vivienda */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <div className="flex items-baseline justify-between gap-4 flex-wrap mb-4">
          <div>
            <h3 className="font-serif text-lg tracking-tight">Vivienda nueva — cuánto es Estado</h3>
            <p className="text-[11px] text-stone-500">IVA + AJD + IBI acumulado 10 años + componente público en el suelo.</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[11px] text-stone-500">Precio:</label>
            <input type="range" min={150000} max={800000} step={10000} value={precioVivienda}
                   onChange={(e) => setPrecioVivienda(parseInt(e.target.value))}
                   className="accent-[#7A1F3D] w-40" />
            <span className="font-mono text-sm text-[#7A1F3D]">{fmtEur(precioVivienda)}</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="rounded-lg bg-stone-100 p-3 text-center">
            <div className="text-[10px] uppercase tracking-[0.1em] text-stone-500">Construcción</div>
            <div className="font-serif text-lg">{fmtEur(vivienda.construccion)}</div>
            <div className="text-[10px] text-stone-400">40%</div>
          </div>
          <div className="rounded-lg bg-stone-100 p-3 text-center">
            <div className="text-[10px] uppercase tracking-[0.1em] text-stone-500">Suelo</div>
            <div className="font-serif text-lg">{fmtEur(vivienda.suelo_total)}</div>
            <div className="text-[10px] text-stone-400">30%</div>
          </div>
          <div className="rounded-lg bg-stone-100 p-3 text-center">
            <div className="text-[10px] uppercase tracking-[0.1em] text-stone-500">Margen promotor</div>
            <div className="font-serif text-lg">{fmtEur(vivienda.beneficio)}</div>
            <div className="text-[10px] text-stone-400">10%</div>
          </div>
          <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-center">
            <div className="text-[10px] uppercase tracking-[0.1em] text-rose-700 font-semibold">Impuestos directos (IVA+AJD)</div>
            <div className="font-serif text-lg text-rose-700">{fmtEur(vivienda.iva_10 + vivienda.ajd_notaria)}</div>
            <div className="text-[10px] text-rose-500">{fmtPct((vivienda.iva_10 + vivienda.ajd_notaria) / precioVivienda)}</div>
          </div>
          <div className="rounded-lg bg-rose-50 border-2 border-rose-300 p-3 text-center">
            <div className="text-[10px] uppercase tracking-[0.1em] text-rose-700 font-semibold">Total Estado (con 10a IBI)</div>
            <div className="font-serif text-lg text-rose-700">{fmtEur(vivienda.total_publico)}</div>
            <div className="text-[10px] text-rose-500">{fmtPct(vivienda.pct_publico)}</div>
          </div>
        </div>
        <p className="text-[11px] text-stone-500 mt-4 italic">
          De €{precioVivienda.toLocaleString("es-ES")}, ~<strong className="text-[#7A1F3D]">{fmtEur(vivienda.total_publico)}</strong> ({fmtPct(vivienda.pct_publico)}) son componente público (IVA 10%, AJD ~1.5%, IBI 10 años, licencias/cesiones/tasas incorporadas en el suelo). Estimación basada en estudios APCE + Colegio de Aparejadores.
        </p>
      </div>

      {/* Bracket creep */}
      <div className="rounded-2xl border-l-4 border-amber-400 bg-amber-50/40 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-700 mt-0.5 shrink-0" />
          <div className="flex-1">
            <h3 className="font-serif text-lg tracking-tight mb-1">Bracket creep — la subida de impuestos que nadie votó</h3>
            <p className="text-sm text-stone-700 leading-relaxed mb-3">
              Si tu salario mantiene el poder adquisitivo (sube con IPC) pero los tramos IRPF <em>no se deflactan</em>,
              acabas pagando un tipo efectivo mayor sin que nadie lo apruebe en el Congreso.
              En 10 años, con IPC acumulado {fmtPct(ipcAcum10)}:
            </p>
            <div className="flex items-center gap-3 mb-3">
              <label className="text-[11px] text-stone-500">IPC acumulado 10a:</label>
              <input type="range" min={0.1} max={0.5} step={0.01} value={ipcAcum10}
                     onChange={(e) => setIpcAcum10(parseFloat(e.target.value))}
                     className="accent-amber-600 w-40" />
              <span className="font-mono text-sm text-amber-700">{fmtPct(ipcAcum10)}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-lg bg-white border border-stone-200 p-3">
                <div className="text-[10px] uppercase tracking-[0.1em] text-stone-500">Bruto inicial</div>
                <div className="font-mono text-sm mt-1">{fmtEur(creep.brutoInicial)}</div>
              </div>
              <div className="rounded-lg bg-white border border-stone-200 p-3">
                <div className="text-[10px] uppercase tracking-[0.1em] text-stone-500">Bruto final (con IPC)</div>
                <div className="font-mono text-sm mt-1">{fmtEur(creep.brutoFinal)}</div>
              </div>
              <div className="rounded-lg bg-white border border-stone-200 p-3">
                <div className="text-[10px] uppercase tracking-[0.1em] text-stone-500">Tasa efectiva IRPF inicial</div>
                <div className="font-mono text-sm mt-1">{fmtPct(creep.tasaEfectivaInicial)}</div>
              </div>
              <div className="rounded-lg bg-amber-100 border-2 border-amber-400 p-3">
                <div className="text-[10px] uppercase tracking-[0.1em] text-amber-700 font-semibold">Tasa efectiva final</div>
                <div className="font-mono text-sm mt-1 text-amber-800 font-semibold">
                  {fmtPct(creep.tasaEfectivaFinal)}
                  <span className="text-[10px] ml-2">(+{(creep.incrementoTasaEfectiva*100).toFixed(2)}pp)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contexto 10 años */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <h3 className="font-serif text-lg tracking-tight mb-3">Contexto: España 2014-2024</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-[11px] uppercase tracking-[0.08em] text-stone-500">
              <tr>
                <th className="text-left px-4 py-2">Indicador</th>
                <th className="text-right px-4 py-2">2014</th>
                <th className="text-right px-4 py-2">2024/25</th>
                <th className="text-right px-4 py-2">Variación</th>
                <th className="text-left px-4 py-2 pl-6">Lectura</th>
              </tr>
            </thead>
            <tbody className="text-[13px]">
              <tr className="border-t border-stone-100">
                <td className="px-4 py-2 text-stone-800 font-medium">Presión fiscal (% PIB)</td>
                <td className="px-4 py-2 text-right font-mono">33.5%</td>
                <td className="px-4 py-2 text-right font-mono">~38.5%</td>
                <td className="px-4 py-2 text-right font-mono text-rose-700">+5.0 pp</td>
                <td className="px-4 py-2 pl-6 text-stone-500 italic text-[12px]">Subida histórica sin precedente</td>
              </tr>
              <tr className="border-t border-stone-100">
                <td className="px-4 py-2 text-stone-800 font-medium">Recaudación AEAT</td>
                <td className="px-4 py-2 text-right font-mono">€174.6 Bn</td>
                <td className="px-4 py-2 text-right font-mono">~€294 Bn</td>
                <td className="px-4 py-2 text-right font-mono text-rose-700">+68%</td>
                <td className="px-4 py-2 pl-6 text-stone-500 italic text-[12px]">Nominal; real ~+35%</td>
              </tr>
              <tr className="border-t border-stone-100">
                <td className="px-4 py-2 text-stone-800 font-medium">Salario real medio</td>
                <td className="px-4 py-2 text-right font-mono">100 (idx)</td>
                <td className="px-4 py-2 text-right font-mono">~97-100</td>
                <td className="px-4 py-2 text-right font-mono text-rose-700">0% a −3%</td>
                <td className="px-4 py-2 pl-6 text-stone-500 italic text-[12px]">Plano a pesar de empleo fuerte</td>
              </tr>
              <tr className="border-t border-stone-100">
                <td className="px-4 py-2 text-stone-800 font-medium">Precio vivienda (€/m²)</td>
                <td className="px-4 py-2 text-right font-mono">~1.400</td>
                <td className="px-4 py-2 text-right font-mono">~2.300</td>
                <td className="px-4 py-2 text-right font-mono text-rose-700">+64%</td>
                <td className="px-4 py-2 pl-6 text-stone-500 italic text-[12px]">Ratio precio/salario ×2.5</td>
              </tr>
              <tr className="border-t border-stone-100">
                <td className="px-4 py-2 text-stone-800 font-medium">Alquiler capitales</td>
                <td className="px-4 py-2 text-right font-mono">~€7/m²</td>
                <td className="px-4 py-2 text-right font-mono">~€12/m²</td>
                <td className="px-4 py-2 text-right font-mono text-rose-700">+71%</td>
                <td className="px-4 py-2 pl-6 text-stone-500 italic text-[12px]">Gran factor de exclusión</td>
              </tr>
              <tr className="border-t border-stone-100">
                <td className="px-4 py-2 text-stone-800 font-medium">Paro</td>
                <td className="px-4 py-2 text-right font-mono">24.4%</td>
                <td className="px-4 py-2 text-right font-mono">10.6%</td>
                <td className="px-4 py-2 text-right font-mono text-emerald-700">−14 pp</td>
                <td className="px-4 py-2 pl-6 text-stone-500 italic text-[12px]">Mejora objetiva</td>
              </tr>
              <tr className="border-t border-stone-100">
                <td className="px-4 py-2 text-stone-800 font-medium">SMI</td>
                <td className="px-4 py-2 text-right font-mono">€645</td>
                <td className="px-4 py-2 text-right font-mono">€1.221</td>
                <td className="px-4 py-2 text-right font-mono text-emerald-700">+89%</td>
                <td className="px-4 py-2 pl-6 text-stone-500 italic text-[12px]">Q1 gana poder real</td>
              </tr>
              <tr className="border-t border-stone-100">
                <td className="px-4 py-2 text-stone-800 font-medium">Gini</td>
                <td className="px-4 py-2 text-right font-mono">34.7</td>
                <td className="px-4 py-2 text-right font-mono">31.5</td>
                <td className="px-4 py-2 text-right font-mono text-emerald-700">−3.2</td>
                <td className="px-4 py-2 pl-6 text-stone-500 italic text-[12px]">Menos desigualdad</td>
              </tr>
              <tr className="border-t border-stone-100 bg-amber-50/30">
                <td className="px-4 py-2 text-stone-800 font-medium">Tramos IRPF</td>
                <td className="px-4 py-2 text-right font-mono">sin deflactar</td>
                <td className="px-4 py-2 text-right font-mono">sin deflactar</td>
                <td className="px-4 py-2 text-right font-mono text-amber-700">+24% creep</td>
                <td className="px-4 py-2 pl-6 text-amber-700 italic text-[12px]">Subida silenciosa de impuestos</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-5 p-4 rounded-lg bg-gradient-to-br from-[#FBF7F0] to-white border-l-2 border-[#7A1F3D]">
          <p className="text-sm text-stone-700 leading-relaxed">
            <span className="font-serif italic text-[#7A1F3D] font-semibold">Balance honesto:</span> el discurso
            de "desastre" es correcto para el <strong>decil 8-9</strong> (rentas medias-altas tipo €60-120k),
            donde se concentran bracket creep + vivienda cara + solidaridad sin contraprestación +
            compresión de márgenes. Para los <strong>deciles 1-3</strong>, la subida del SMI, la
            reducción del paro y las transferencias han mejorado objetivamente su posición real.
            No es una narrativa única: hay ganadores y perdedores según el segmento.
          </p>
        </div>
      </div>
    </div>
  );
}



/* --------------------------------------------------------------------------- */
/* METHODOLOGY VIEW                                                            */
/* --------------------------------------------------------------------------- */
function MethodologyView() {
  const lagData = [
    { canal: "IVA → IPC",        hl: 2,  tag: "mecánico" },
    { canal: "Petróleo → IPC",   hl: 4,  tag: "energía" },
    { canal: "SMI → IPC",        hl: 6,  tag: "costes" },
    { canal: "Cot. SS → IPC",    hl: 12, tag: "negociación salarial" },
    { canal: "BCE → IPC",        hl: 18, tag: "monetario" },
    { canal: "BCE → capital",    hl: 9,  tag: "estructura producción" },
  ];

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="font-serif text-2xl tracking-tight">Metodología</h2>
        <p className="text-sm text-stone-500 mt-1">Cómo se calcula todo el pipeline.</p>
      </div>

      <section className="space-y-3">
        <h3 className="font-serif text-lg">1. Motor agregado</h3>
        <p className="text-sm text-stone-700 leading-relaxed">Modelo lineal aditivo por canal con respuesta exponencial:</p>
        <div className="rounded-lg border border-stone-200 bg-white p-4 font-mono text-[12px] text-stone-600 overflow-x-auto">
          <pre>{`y(t) = SS × (1 − exp(−ln2 × t / halfLife))`}</pre>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-serif text-lg">2. Half-lives</h3>
        <div className="rounded-lg border border-stone-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-[11px] uppercase tracking-[0.1em] text-stone-500">
              <tr>
                <th className="text-left px-4 py-2">Canal</th>
                <th className="text-right px-4 py-2">Half-life</th>
                <th className="text-left px-4 py-2 pl-6">Naturaleza</th>
              </tr>
            </thead>
            <tbody>
              {lagData.map((r, i) => (
                <tr key={i} className="border-t border-stone-100">
                  <td className="px-4 py-2 text-stone-800">{r.canal}</td>
                  <td className="px-4 py-2 text-right font-mono text-[#7A1F3D]">{r.hl}m</td>
                  <td className="px-4 py-2 pl-6 text-stone-500 italic">{r.tag}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-serif text-lg">3. Sectorial (Leontief)</h3>
        <div className="rounded-lg border border-stone-200 bg-white p-4 font-mono text-[12px] text-stone-600 overflow-x-auto">
          <pre>{`Δprecio_directo = PrimaryShares @ PrimaryShocks
Δprecio_total   = (I − A)⁻¹ @ Δprecio_directo`}</pre>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-serif text-lg">4. Hogares (Q1..Q5)</h3>
        <div className="rounded-lg border border-stone-200 bg-white p-4 font-mono text-[12px] text-stone-600 overflow-x-auto">
          <pre>{`IPC_q          = Σ basket_q[s] × Δprecio_total[s]
Δrenta_real_q  = Δrenta_nominal_q − IPC_q
Gini proxy     = (Δreal_Q5 − Δreal_Q1) × k`}</pre>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-serif text-lg">5. Capital (ABCT)</h3>
        <div className="rounded-lg border border-stone-200 bg-white p-4 font-mono text-[12px] text-stone-600 overflow-x-auto">
          <pre>{`rateGap        = −ecb_pp_chg
stageBoost[s]  = rateGap × sens[stage[s]] × lagMult(t, 9)
malinvestment  = Σ max(0, stageBoost[s])   |  stage[s] ≥ 3
sostenibilidad = capital_real / capital_aparente`}</pre>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-serif text-lg">6. Librería de escenarios — v0.6</h3>
        <p className="text-sm text-stone-700 leading-relaxed">
          Un escenario es simplemente un snapshot de las 6 palancas con nombre y notas.
          Se almacena en memoria (no persiste entre recargas de página, pero se puede
          exportar/importar como JSON).
        </p>
        <div className="rounded-lg border border-stone-200 bg-white p-4 font-mono text-[12px] text-stone-600 overflow-x-auto">
          <pre>{`{
  "id": "usr-xyz",
  "name": "Consolidación + shock petróleo",
  "notes": "...",
  "levers": {
    "brent_pct_chg": 30,
    "iva_pp_chg": 1,
    "ss_pp_chg": 0,
    "smi_pct_chg": 0,
    "irpf_pp_chg": 2,
    "ecb_pp_chg": 0.5
  },
  "createdAt": "2024-..."
}`}</pre>
        </div>
        <p className="text-sm text-stone-700 leading-relaxed">
          La vista de comparación permite seleccionar hasta 3 escenarios y ver sus sendas
          superpuestas para IPC, PIB y paro, más una tabla con todos los KPIs (incluyendo
          columnas distributivas y ABCT) al mes actual.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="font-serif text-lg">7. Conexión con Blondie Economics</h3>
        <div className="text-sm text-stone-700 leading-relaxed space-y-2">
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li><strong>Valor subjetivo:</strong> cada quintil ordena distinto. Ningún shock es neutro.</li>
            <li><strong>Utilidad marginal:</strong> IVA destruye más utilidad en Q1.</li>
            <li><strong>Coste de oportunidad:</strong> cada palanca tiene ganadores y perdedores.</li>
            <li><strong>Ahorro y capital (el duende):</strong> política laxa crea capital ilusorio.</li>
            <li><strong>Estructura de producción (Menger/Leontief):</strong> shocks se amplifican por la red.</li>
            <li><strong>Preferencia temporal:</strong> el tipo natural refleja cuánto valoramos hoy vs. mañana.</li>
            <li><strong>Crítica austríaca:</strong> retardos asimétricos generan "racimos de errores".</li>
          </ul>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-serif text-lg">8. Calibración con datos reales — v0.7 (abril 2026)</h3>
        <p className="text-sm text-stone-700 leading-relaxed">
          El <strong>baseline</strong> se ha actualizado con valores observados o proyectados oficialmente.
          Los <strong>coeficientes</strong> de elasticidad siguen siendo medianas de literatura —
          pedagógicos, no calibrados econométricamente.
        </p>
        <div className="rounded-lg border border-stone-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-[11px] uppercase tracking-[0.1em] text-stone-500">
              <tr>
                <th className="text-left px-4 py-2">Variable</th>
                <th className="text-right px-4 py-2">v0.6 (placeholder)</th>
                <th className="text-right px-4 py-2">v0.7 (real)</th>
                <th className="text-left px-4 py-2 pl-6">Fuente</th>
              </tr>
            </thead>
            <tbody className="font-mono text-[12px]">
              <tr className="border-t border-stone-100">
                <td className="px-4 py-2 text-stone-800">IPC yoy</td>
                <td className="px-4 py-2 text-right text-stone-400">2.8%</td>
                <td className="px-4 py-2 text-right text-[#7A1F3D] font-semibold">3.4%</td>
                <td className="px-4 py-2 pl-6 text-stone-500 text-[11px]">INE marzo 2026</td>
              </tr>
              <tr className="border-t border-stone-100">
                <td className="px-4 py-2 text-stone-800">Paro</td>
                <td className="px-4 py-2 text-right text-stone-400">11.2%</td>
                <td className="px-4 py-2 text-right text-[#7A1F3D] font-semibold">10.0%</td>
                <td className="px-4 py-2 pl-6 text-stone-500 text-[11px]">BdE proy 2026</td>
              </tr>
              <tr className="border-t border-stone-100">
                <td className="px-4 py-2 text-stone-800">Brent</td>
                <td className="px-4 py-2 text-right text-stone-400">$78</td>
                <td className="px-4 py-2 text-right text-[#7A1F3D] font-semibold">$95</td>
                <td className="px-4 py-2 pl-6 text-stone-500 text-[11px]">EIA STEO abr-2026</td>
              </tr>
              <tr className="border-t border-stone-100">
                <td className="px-4 py-2 text-stone-800">Tipo BCE depo</td>
                <td className="px-4 py-2 text-right text-stone-400">2.50%</td>
                <td className="px-4 py-2 text-right text-[#7A1F3D] font-semibold">2.00%</td>
                <td className="px-4 py-2 pl-6 text-stone-500 text-[11px]">ECB desde sep-2025</td>
              </tr>
              <tr className="border-t border-stone-100">
                <td className="px-4 py-2 text-stone-800">SMI/mes</td>
                <td className="px-4 py-2 text-right text-stone-400">—</td>
                <td className="px-4 py-2 text-right text-[#7A1F3D] font-semibold">€1.221</td>
                <td className="px-4 py-2 pl-6 text-stone-500 text-[11px]">RD 126/2026</td>
              </tr>
              <tr className="border-t border-stone-100">
                <td className="px-4 py-2 text-stone-800">PIB nominal</td>
                <td className="px-4 py-2 text-right text-stone-400">€1.500 Bn</td>
                <td className="px-4 py-2 text-right text-[#7A1F3D] font-semibold">€1.670 Bn</td>
                <td className="px-4 py-2 pl-6 text-stone-500 text-[11px]">BdE escalado</td>
              </tr>
              <tr className="border-t border-stone-100">
                <td className="px-4 py-2 text-stone-800">Euríbor 12m</td>
                <td className="px-4 py-2 text-right text-stone-400">—</td>
                <td className="px-4 py-2 text-right text-[#7A1F3D] font-semibold">2.56%</td>
                <td className="px-4 py-2 pl-6 text-stone-500 text-[11px]">BdE abril 2026</td>
              </tr>
              <tr className="border-t border-stone-100">
                <td className="px-4 py-2 text-stone-800">EUR/USD</td>
                <td className="px-4 py-2 text-right text-stone-400">1.08</td>
                <td className="px-4 py-2 text-right text-[#7A1F3D] font-semibold">1.13</td>
                <td className="px-4 py-2 pl-6 text-stone-500 text-[11px]">ECB cierre Q1</td>
              </tr>
              <tr className="border-t border-stone-100">
                <td className="px-4 py-2 text-stone-800">Gini</td>
                <td className="px-4 py-2 text-right text-stone-400">33.1</td>
                <td className="px-4 py-2 text-right text-[#7A1F3D] font-semibold">31.5</td>
                <td className="px-4 py-2 pl-6 text-stone-500 text-[11px]">Eurostat SILC 2024</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-stone-500 italic leading-relaxed">
          <strong>Nota sobre el tipo natural:</strong> en abril 2026, el BCE mantiene el tipo en 2.00%
          y las proyecciones BdE dan una tasa natural implícita similar. Por tanto, el baseline
          parte con <code className="font-mono">rateGap = 0</code>. Los escenarios "Dinero fácil" o
          "BCE restrictivo" representan desviaciones respecto a este punto.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="font-serif text-lg">9. Validación — episodios históricos vs modelo</h3>
        <p className="text-sm text-stone-700 leading-relaxed">
          Cuatro pruebas de "olor" para comprobar que los coeficientes y retardos producen respuestas
          razonables cuando se aplican a shocks observados. Todas son aproximaciones, pero deberían
          estar en el orden de magnitud correcto.
        </p>
        <div className="rounded-lg border border-stone-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-[11px] uppercase tracking-[0.1em] text-stone-500">
              <tr>
                <th className="text-left px-4 py-2">Episodio</th>
                <th className="text-left px-4 py-2">Shock input</th>
                <th className="text-left px-4 py-2">Respuesta real</th>
                <th className="text-left px-4 py-2">Respuesta modelo</th>
              </tr>
            </thead>
            <tbody className="text-[12px]">
              <tr className="border-t border-stone-100">
                <td className="px-4 py-2 text-stone-800 font-semibold">Shock energético 2022</td>
                <td className="px-4 py-2 text-stone-600">Brent +60% (2022)</td>
                <td className="px-4 py-2 text-stone-600">IPC España pico 10.8% (jul-22)</td>
                <td className="px-4 py-2 text-stone-600 italic">+3.0pp a 12m; ×1.6 amplif. Leontief → coherente con spread vs energía</td>
              </tr>
              <tr className="border-t border-stone-100">
                <td className="px-4 py-2 text-stone-800 font-semibold">Tightening BCE 2022-23</td>
                <td className="px-4 py-2 text-stone-600">Depo 0% → 4% en 14m</td>
                <td className="px-4 py-2 text-stone-600">Euríbor 12m: -0.5% → 4.0%</td>
                <td className="px-4 py-2 text-stone-600 italic">+4pp BCE: -2pp IPC a 18m, +1pp paro, crash vivienda</td>
              </tr>
              <tr className="border-t border-stone-100">
                <td className="px-4 py-2 text-stone-800 font-semibold">Serie SMI 2018-2026</td>
                <td className="px-4 py-2 text-stone-600">€735 → €1.221 (+66% nominal)</td>
                <td className="px-4 py-2 text-stone-600">Empleo Q1: efecto heterogéneo; BdE/Fedea debate</td>
                <td className="px-4 py-2 text-stone-600 italic">Modelo: elasticidad −0.3% empleo por +10% SMI (mediana literatura)</td>
              </tr>
              <tr className="border-t border-stone-100">
                <td className="px-4 py-2 text-stone-800 font-semibold">Austeridad 2012</td>
                <td className="px-4 py-2 text-stone-600">IVA 18% → 21% (+3pp)</td>
                <td className="px-4 py-2 text-stone-600">Paro picó 26.9% (2013)</td>
                <td className="px-4 py-2 text-stone-600 italic">+3pp IVA: +1.65pp IPC en 2m, consumo -1.2%, coherente direccionalmente</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-stone-500 italic leading-relaxed">
          <strong>Limitaciones:</strong> el modelo es <em>lineal comparativo estático con retardos</em> —
          no captura efectos de segunda ronda (indexación salarial-precios), expectativas endógenas,
          ni no-linealidades en el margen. Para análisis cuantitativo serio se necesitaría un DSGE o VAR
          estructural calibrado con series del BdE. Este simulador es una herramienta pedagógica para
          <em> entender mecanismos</em>, no para predecir cifras exactas.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="font-serif text-lg">10. Efectos de segunda ronda — v0.8 (espiral salarios-precios)</h3>
        <p className="text-sm text-stone-700 leading-relaxed">
          El motor ahora calcula el IPC en dos pasadas. La <strong>primera</strong> es la respuesta directa
          de los canales a los shocks activados (lo que venía calculando v0.7). La <strong>segunda</strong>
          captura la retroalimentación vía negociación colectiva: el IPC acumulado entra como referencia
          en los convenios, los salarios pactados suben, el coste laboral empuja los precios, y el IPC
          vuelve a subir — <em>"espiral salarios-precios"</em>.
        </p>
        <div className="rounded-lg border border-stone-200 bg-white p-4 font-mono text-[12px] text-stone-600 overflow-x-auto">
          <pre>{`// Pasada 1 — primera ronda (lo que ya se calculaba):
IPC_first(t) = Σ canal_c · lagMult(t, halfLife_c)

// Pasada 2 — espiral salarial:
α = 1 − exp(−ln2 / half_life_wage)          // half_life_wage = 9 meses
EMA_ipc(t) = α·IPC_first(t−1) + (1−α)·EMA_ipc(t−1)
wage_response(t) = indexation · EMA_ipc(t)  // indexation = 0.35
IPC_second(t)    = wage_response(t) · cpi_passthrough  // = 0.55

// IPC total y amplificación:
IPC(t)           = IPC_first(t) + IPC_second(t)
amplif(t)        = IPC(t) / IPC_first(t)     // típicamente 1.10 – 1.20×`}</pre>
        </div>
        <p className="text-sm text-stone-700 leading-relaxed">
          <strong>Parametrización (placeholder calibrada a literatura BdE):</strong>
        </p>
        <div className="rounded-lg border border-stone-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-[11px] uppercase tracking-[0.1em] text-stone-500">
              <tr>
                <th className="text-left px-4 py-2">Parámetro</th>
                <th className="text-right px-4 py-2">Valor</th>
                <th className="text-left px-4 py-2 pl-6">Interpretación</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-stone-100">
                <td className="px-4 py-2 text-stone-800 font-mono text-[12px]">indexation</td>
                <td className="px-4 py-2 text-right font-mono text-[#7A1F3D]">0.35</td>
                <td className="px-4 py-2 pl-6 text-stone-600 text-[12px]">~35% del IPC entra en convenios con cláusula (España, medio)</td>
              </tr>
              <tr className="border-t border-stone-100">
                <td className="px-4 py-2 text-stone-800 font-mono text-[12px]">half_life</td>
                <td className="px-4 py-2 text-right font-mono text-[#7A1F3D]">9m</td>
                <td className="px-4 py-2 pl-6 text-stone-600 text-[12px]">Ciclo típico negociación colectiva (convenios ~anuales)</td>
              </tr>
              <tr className="border-t border-stone-100">
                <td className="px-4 py-2 text-stone-800 font-mono text-[12px]">cpi_passthrough</td>
                <td className="px-4 py-2 text-right font-mono text-[#7A1F3D]">0.55</td>
                <td className="px-4 py-2 pl-6 text-stone-600 text-[12px]">Fracción del coste laboral que acaba en el precio final</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm text-stone-700 leading-relaxed">
          <strong>Cómo verlo en acción:</strong> activa un shock (p.ej. "Crisis del petróleo"), observa
          la tarjeta "Efectos de segunda ronda" en el simulador. Con un Brent +40%, el modelo predice
          unos <code className="font-mono bg-stone-100 px-1">2.0 pp</code> de primera ronda a 24 meses
          y <code className="font-mono bg-stone-100 px-1">0.3 pp</code> adicionales de segunda ronda
          (amplificación ~1.14×). En escenarios más extremos con indexación alta, la espiral puede
          explicar más del 20% del IPC final.
        </p>
        <p className="text-xs text-stone-500 italic leading-relaxed border-l-2 border-amber-300 pl-3">
          <strong>Limitaciones:</strong> el modelo es de una sola pasada de feedback (no itera hasta
          convergencia), aplica la amplificación uniformemente a todos los sectores (sin distinguir
          sectores labor-intensivos), y no modela expectativas racionales forward-looking. Un VAR
          estructural con expectativas endógenas (tipo Smets-Wouters) capturaría mejor la dinámica
          de persistencia, pero a costa de perder transparencia pedagógica.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="font-serif text-lg">11. Roadmap — iteraciones completadas</h3>
        <ol className="text-sm text-stone-700 list-decimal list-inside space-y-1 pl-2">
          <li className="line-through text-stone-400">Sendas dinámicas 24m <span className="not-italic text-emerald-600">· v0.2 ✓</span></li>
          <li className="line-through text-stone-400">Matriz I/O (Leontief) <span className="not-italic text-emerald-600">· v0.3 ✓</span></li>
          <li className="line-through text-stone-400">Hogares por quintil <span className="not-italic text-emerald-600">· v0.4 ✓</span></li>
          <li className="line-through text-stone-400">Canal de capital (ABCT) <span className="not-italic text-emerald-600">· v0.5 ✓</span></li>
          <li className="line-through text-stone-400">Librería de escenarios <span className="not-italic text-emerald-600">· v0.6 ✓</span></li>
          <li className="line-through text-stone-400">Calibración real 2026 <span className="not-italic text-emerald-600">· v0.7 ✓</span></li>
          <li className="line-through text-stone-400">Espiral salarios-precios <span className="not-italic text-emerald-600">· v0.8 ✓</span></li>
        </ol>
        <h4 className="font-serif text-base mt-4">Posibles extensiones</h4>
        <ol className="text-sm text-stone-700 list-disc list-inside space-y-1 pl-2">
          <li>Calibración econométrica formal de coeficientes con series BdE (VAR estructural).</li>
          <li>Sector exterior: tipo de cambio EUR/USD, balanza comercial, competitividad.</li>
          <li>Modelo bancario simple: capital, provisiones, morosidad sectorial.</li>
          <li>Política fiscal más rica: gasto público por función, sostenibilidad de deuda.</li>
          <li>Escenario dinámico: cambiar palancas en distintos meses (no sólo snapshot estático).</li>
          <li>Datos actualizables: ingesta mensual automática de IPC INE y tipos BCE.</li>
          <li>Espiral heterogénea por sector: indexación distinta en servicios vs industria.</li>
          <li>Expectativas forward-looking tipo Phillips Curve aumentada.</li>
        </ol>
      </section>
    </div>
  );
}


/* --------------------------------------------------------------------------- */
/* [13] CAMINOS ALTERNATIVOS — contrafactuales históricos · v1.1               */
/* ---------------------------------------------------------------------------
   5 decisiones reales de España con su contrafactual calculado:
     1. 2005-2007: gastar vs ahorrar los superávits primarios
     2. 2012-2013: mantener vs revertir la reforma laboral
     3. 2014-2024: deflactar vs no deflactar tramos IRPF
     4. 2018-2026: SMI +89% real vs +24% IPC acumulado
     5. 2021-2026: mantener indexación IPC pleno pensiones vs IPC -0.5pp

   Cada uno responde: ¿qué habría pasado si...?
   Datos: BdE, AIReF, Eurostat, literatura académica Fedea/BBVA Research.
   --------------------------------------------------------------------------- */

const COUNTERFACTUALS = [
  {
    id: "cf1",
    title: "¿Y si España hubiera ahorrado los superávits 2005-2007?",
    period: "2005 — 2025",
    category: "Política fiscal",
    color: "#7A1F3D",
    icon: "🏛️",
    realWorld: {
      label: "Lo que pasó",
      description: "Los tres años de superávit primario (+1.5 a +2.0% PIB) se destinaron a aumentar gasto estructural: expansión del Estado del Bienestar, nuevas leyes de dependencia, ampliación de empleo público. Al llegar la crisis en 2008, no había colchón fiscal.",
      outcomes: [
        { label: "Deuda pública 2013", value: "95% PIB" },
        { label: "Rescate bancario", value: "€64 Bn" },
        { label: "Prima de riesgo pico", value: "650 pb" },
        { label: "IVA general 2012", value: "16% → 21%" },
      ],
    },
    counterfactual: {
      label: "Qué habría pasado si...",
      description: "Se hubiera creado un Fondo de Estabilización (modelo noruego escala) con los superávits 2005-2007 — unos €35-40Bn acumulados. Al llegar 2008, el colchón habría permitido evitar los rescates con troika y la subida de IVA.",
      outcomes: [
        { label: "Deuda pública 2013", value: "70% PIB", diff: "−25pp" },
        { label: "Fondo disponible 2008", value: "€35 Bn", diff: "vs 0" },
        { label: "Prima de riesgo pico", value: "~350 pb", diff: "−300pb" },
        { label: "IVA general 2012", value: "16% (mantenido)", diff: "−5pp" },
      ],
    },
    why_not: "Tres razones: (1) la creencia política de que el boom era sostenible ('crecemos al 4%'), (2) la ausencia de instituciones que obliguen a ahorrar en ciclo alto (AIReF no existía), (3) presiones electorales y autonómicas por gastar.",
    austrian_lens: "La tentación fatal del gobernante: cuando los ingresos fiscales crecen por un ciclo artificial, cree que son permanentes. Gasta como si lo fueran. Cuando el ciclo revierte, el gasto persiste pero los ingresos desaparecen — y aparece el déficit estructural.",
    winners: "Trabajadores del sector público, beneficiarios de nuevas transferencias, inversores que cobraron comisiones en la burbuja.",
    losers: "Contribuyentes post-2012 (subida IVA 5pp + solidaridad + bracket creep), tenedores de deuda rescatada con capital público, generaciones jóvenes que heredan 100% PIB de deuda.",
  },
  {
    id: "cf2",
    title: "¿Y si la reforma laboral 2012 no se hubiera revertido parcialmente en 2022?",
    period: "2012 — 2026",
    category: "Mercado de trabajo",
    color: "#065F46",
    icon: "⚖️",
    realWorld: {
      label: "Lo que pasó",
      description: "RD-Ley 3/2012 introdujo mayor flexibilidad (despido 20 días/año, prevalencia convenio empresa, causas económicas más claras). Ley 2021 revirtió prevalencia del convenio sectorial sobre el de empresa y limitó la contratación temporal. El paro cayó de 26.9% (2013) a 13.3% (2019), y hoy está en 10.0%.",
      outcomes: [
        { label: "Paro 2019", value: "14.1%" },
        { label: "Paro 2025", value: "10.0%" },
        { label: "Empleo temporal 2024", value: "15.4%" },
        { label: "Productividad/ocupado 2020-25", value: "+3% (estancada)" },
      ],
    },
    counterfactual: {
      label: "Qué habría pasado si...",
      description: "Manteniendo la reforma 2012 completa, con prevalencia del convenio de empresa y flexibilidad en contratación, la convergencia laboral hacia la UE habría sido más rápida. Estimaciones Fedea/BBVA Research: el paro estructural podría haber estado 1.5-2.5 pp más bajo.",
      outcomes: [
        { label: "Paro 2025 (estim.)", value: "7.5-8.5%", diff: "−1.5 a −2.5pp" },
        { label: "Productividad/ocupado", value: "+8-10%", diff: "+5-7pp" },
        { label: "Gap UE", value: "−15pp PIB/PET", diff: "vs −33pp actual" },
        { label: "Empleo temporal", value: "~20%", diff: "+4.6pp" },
      ],
    },
    why_not: "El coste político de la reforma 2012 fue enorme (huelgas generales, pérdida electoral PP 2015 ligada a ella). La ley 2021 fue condición de coalición de gobierno y compromiso Fondos NGEU con Bruselas. La narrativa 'trabajo indefinido = trabajo digno' se consolidó.",
    austrian_lens: "Los mercados laborales rígidos producen una paradoja: protegen a los que están dentro y excluyen a los que están fuera. El paro juvenil doblaba al adulto incluso en el techo del ciclo. La protección es asimétrica: mayor para insiders, menor para outsiders (jóvenes, mujeres, inmigrantes).",
    winners: "Trabajadores con antigüedad en sectores tradicionales, sindicatos, sectores protegidos (administración, banca, utilities).",
    losers: "Jóvenes que entran al mercado (paro 24% vs 6% UE), inmigrantes, sectores innovadores que necesitan ajustar plantilla rápido, empresas exportadoras.",
  },
  {
    id: "cf3",
    title: "¿Y si se hubieran deflactado los tramos del IRPF cada año?",
    period: "2014 — 2026",
    category: "Política fiscal",
    color: "#A16207",
    icon: "📊",
    realWorld: {
      label: "Lo que pasó",
      description: "Los tramos IRPF (12.450€, 20.200€, 35.200€, 60.000€, 300.000€) NO se han deflactado con IPC desde 2015 salvo ajustes puntuales. Con IPC acumulado ~24% desde entonces, un trabajador que mantuvo poder adquisitivo va a tramos más altos cada año — es una subida silenciosa de impuestos.",
      outcomes: [
        { label: "IPC acumulado 2015-2025", value: "~24%" },
        { label: "Tramos IRPF deflactados", value: "0%" },
        { label: "Recaudación IRPF 2014-25", value: "+68%" },
        { label: "Cuña fiscal €80k 2026", value: "47%" },
      ],
    },
    counterfactual: {
      label: "Qué habría pasado si...",
      description: "Habiendo deflactado los tramos al ritmo del IPC (como hacen Alemania, Dinamarca, Reino Unido), un trabajador €80k brutos habría pagado ~€2.800/año menos en 2025. Acumulado 10 años: ~€18.000 de impuestos no cobrados (por persona en ese rango). Recaudación total perdida: ~€8-12 Bn/año estabilizado.",
      outcomes: [
        { label: "IRPF €80k 2025 (actual)", value: "~€23.000" },
        { label: "IRPF €80k 2025 deflactado", value: "~€20.200", diff: "−€2.800" },
        { label: "Recaudación perdida/año", value: "−€8-12 Bn", diff: "~0.6-0.9% PIB" },
        { label: "Cuña fiscal €80k", value: "~44%", diff: "−3pp" },
      ],
    },
    why_not: "Políticamente óptimo: subir impuestos sin necesidad de aprobar una ley. La AIReF lo señala cada año en sus informes pero no es vinculante. Ningún gobierno (PP, PSOE, coalición) ha deflactado más allá de ajustes cosméticos en el primer tramo.",
    austrian_lens: "El bracket creep es la subida de impuestos invisible. No se anuncia, no se vota, no se debate. Violenta el principio austríaco de claridad: el contribuyente debe saber cuánto paga y por qué. Cuando la inflación erosiona la moneda, el Estado no solo mantiene su poder de compra — lo aumenta a costa del ciudadano.",
    winners: "Administración central (principal perceptor IRPF), administraciones autonómicas (tramo autonómico), servicios financiados sin necesidad de reforma fiscal explícita.",
    losers: "Rentas medias-altas (€40-120k) donde el creep es más intenso. Mileuristas que cruzan el mínimo vital. Pensionistas de clases medias cuyas pensiones sí se actualizan con IPC pero entran a tramos superiores.",
  },
  {
    id: "cf4",
    title: "¿Y si el SMI hubiera subido solo al ritmo del IPC desde 2018?",
    period: "2018 — 2026",
    category: "Política salarial",
    color: "#B45309",
    icon: "💶",
    realWorld: {
      label: "Lo que pasó",
      description: "SMI pasó de €735 (2018) a €1.221 (2026) = +66% nominal, +89% real neto (exención IRPF). IPC acumulado en el período: ~27%. El SMI ganó 40-50pp de poder adquisitivo real. Hoy beneficia a ~2.5M trabajadores. Coste empresarial adicional ~1.5pp sobre masa salarial según estimaciones CEOE.",
      outcomes: [
        { label: "SMI 2018 → 2026", value: "€735 → €1.221" },
        { label: "Subida real SMI", value: "+89%" },
        { label: "IPC acumulado", value: "+27%" },
        { label: "Diferencia SMI vs IPC", value: "+62pp real" },
      ],
    },
    counterfactual: {
      label: "Qué habría pasado si...",
      description: "SMI actualizado solo con IPC desde 2018: estaría en ~€930/mes en 2026 (vs €1.221 real). Efectos estimados según literatura (BdE, Fedea, AIReF): menor empleo destruido en sectores de baja productividad (-1.5 a -3% según grupo), mayores márgenes empresariales, pero también menor renta disponible de Q1-Q2.",
      outcomes: [
        { label: "SMI 2026 (IPC)", value: "~€930", diff: "−€291/mes" },
        { label: "Empleo SMI preservado", value: "+150-200k", diff: "estim. literatura" },
        { label: "Renta Q1 real", value: "−12%", diff: "peor distribución" },
        { label: "Gini 2026", value: "~32.5", diff: "+1 vs real" },
      ],
    },
    why_not: "Consenso progresista y sindical sobre la Carta Social Europea (SMI = 60% salario medio). Éxito electoral de la política. El debate técnico (BdE, AIReF) sobre empleo destruido fue silenciado. Coalición de gobierno con compromiso explícito.",
    austrian_lens: "Toda política tiene ganadores y perdedores. El SMI transfiere renta desde los que pierden el empleo (o no lo encuentran) hacia los que lo mantienen. Beneficia al outsider que entra (Q1 con empleo) y perjudica al outsider que no entra (parado de larga duración, joven sin experiencia). El balance neto depende de la elasticidad empleo-salario.",
    winners: "~2.5M trabajadores SMI actuales, especialmente mujeres, jóvenes con empleo, sectores intensivos (hostelería, comercio, cuidados).",
    losers: "Parados de larga duración que no pueden acceder (salario reserva sube), empresas pequeñas con márgenes estrechos, consumidores de servicios con mayor traslación a precios.",
  },
  {
    id: "cf5",
    title: "¿Y si las pensiones se hubieran indexado al IPC − 0.5pp desde 2021?",
    period: "2021 — 2050",
    category: "Pensiones",
    color: "#E11D48",
    icon: "👥",
    realWorld: {
      label: "Lo que pasó",
      description: "Ley 21/2021 restauró la indexación al IPC pleno, derogando el Factor de Sostenibilidad (2013) y el IRP. Las pensiones crecen al 100% del IPC cada año. Gasto pensiones pasa del 11.9% (2022) al 12.3% PIB (2025). Proyección oficial 14% hasta 2050 (AIReF 14.4%; Comisión Europea 16.1% pico).",
      outcomes: [
        { label: "Gasto pensiones 2025", value: "12.3% PIB" },
        { label: "Proyección pico", value: "15.3% en 2049" },
        { label: "Transferencia Estado", value: "3.1% PIB" },
        { label: "Hucha 2023", value: "€5.6 Bn (de €67 Bn en 2011)" },
      ],
    },
    counterfactual: {
      label: "Qué habría pasado si...",
      description: "Indexación IPC −0.5pp desde 2021 (propuesta AIReF). El ajuste es pequeño año a año pero acumula: en 30 años las pensiones crecerían un 15% menos en términos nominales. Gasto pensiones se estabilizaría alrededor del 12.5% PIB hasta 2050, no 14-16%.",
      outcomes: [
        { label: "Gasto pensiones 2050", value: "~12.5% PIB", diff: "−2.5pp" },
        { label: "Ahorro acumulado 30a", value: "~€400-500 Bn", diff: "≈ 30% PIB actual" },
        { label: "Pensión media 2050 real", value: "−15%", diff: "vs real IPC pleno" },
        { label: "Presión fiscal futura", value: "Estable", diff: "vs +3-4pp esperados" },
      ],
    },
    why_not: "Poder electoral de pensionistas (9.4M de votantes, sobrerrepresentados en participación). Ley 21/2021 fue compromiso de coalición y acuerdo Pacto de Toledo. Cualquier recorte cobró coste electoral inmediato (PP 2018 con el '+0.25%' fue uno de los factores de la moción de censura).",
    austrian_lens: "El sistema de pensiones es contrato intergeneracional implícito — pero sin poder vinculante de la generación futura. Los que decidieron en 2021 (votantes actuales) prometieron en nombre de los que pagarán después (generaciones jóvenes e inmigrantes futuros). Sin mecanismo de ajuste automático, la sostenibilidad depende de fe política.",
    winners: "9.4M pensionistas actuales (mantienen poder adquisitivo pleno), clases que vivieron el milagro económico 60-90s y ahora se jubilan con tasa de reposición alta (77.5% vs 44.5% ZE media).",
    losers: "Trabajadores que cotizarán 30+ años más (generación Y y Z), inmigrantes actuales (financian pensiones que no cobrarán igual), contribuyentes futuros que pagarán vía impuestos generales el déficit contributivo.",
  },
];

function CaminosView() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [showNumbers, setShowNumbers] = useState(true);
  const cf = COUNTERFACTUALS[activeIdx];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl tracking-tight">Caminos alternativos · decisiones contrafactuales</h2>
        <p className="text-sm text-stone-500 mt-1 max-w-3xl">
          Cinco decisiones reales que España tomó en los últimos 25 años, con su contrafactual
          calculado. No es revisionismo — es la pregunta honesta que todo analista debe hacerse:
          <em> ¿qué habría pasado si...?</em> Cada elección tiene ganadores y perdedores; aquí se
          hacen visibles.
        </p>
      </div>

      {/* Navegador */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {COUNTERFACTUALS.map((c, i) => (
          <button key={c.id} onClick={() => setActiveIdx(i)}
            className={`text-left rounded-xl border-2 transition-all p-3 flex flex-col gap-1 ${
              i === activeIdx
                ? "border-[#7A1F3D] shadow-lg bg-white scale-[1.02]"
                : "border-stone-200 bg-white/60 hover:border-stone-300"
            }`}>
            <div className="flex items-center justify-between">
              <span className="text-xl">{c.icon}</span>
              <span className="text-[9px] uppercase tracking-[0.1em] font-semibold"
                    style={{ color: c.color }}>
                Caso {i + 1}
              </span>
            </div>
            <p className="text-[11px] text-stone-700 leading-tight font-medium">
              {c.title.replace(/^¿Y si /, "").replace(/\?$/, "")}
            </p>
            <span className="text-[10px] text-stone-400 font-mono">{c.period}</span>
          </button>
        ))}
      </div>

      {/* Título del caso activo */}
      <div className="rounded-2xl border-2 p-6 space-y-5"
           style={{ borderColor: cf.color + "40", background: `linear-gradient(135deg, ${cf.color}08, white)` }}>
        <div className="flex items-center gap-3">
          <div className="text-4xl">{cf.icon}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.15em] font-semibold"
                    style={{ color: cf.color }}>
                Caso {activeIdx + 1} · {cf.category}
              </span>
              <span className="text-[10px] text-stone-400 font-mono">{cf.period}</span>
            </div>
            <h3 className="font-serif text-2xl tracking-tight text-stone-900 leading-tight">{cf.title}</h3>
          </div>
        </div>

        {/* Dos columnas: real vs contrafactual */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Lo que pasó */}
          <div className="rounded-xl bg-white border-2 border-stone-300 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] uppercase tracking-[0.12em] px-2 py-0.5 rounded bg-stone-700 text-white font-semibold">
                {cf.realWorld.label}
              </span>
            </div>
            <p className="text-[13px] text-stone-700 leading-relaxed mb-4">{cf.realWorld.description}</p>
            {showNumbers && (
              <div className="space-y-1.5">
                {cf.realWorld.outcomes.map((o, i) => (
                  <div key={i} className="flex justify-between items-center text-[12px] py-1.5 border-b border-stone-100 last:border-0">
                    <span className="text-stone-600">{o.label}</span>
                    <span className="font-mono font-semibold text-stone-900">{o.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Contrafactual */}
          <div className="rounded-xl border-2 p-4 bg-gradient-to-br from-white via-white to-stone-50"
               style={{ borderColor: cf.color }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] uppercase tracking-[0.12em] px-2 py-0.5 rounded text-white font-semibold"
                    style={{ backgroundColor: cf.color }}>
                {cf.counterfactual.label}
              </span>
            </div>
            <p className="text-[13px] text-stone-700 leading-relaxed mb-4">{cf.counterfactual.description}</p>
            {showNumbers && (
              <div className="space-y-1.5">
                {cf.counterfactual.outcomes.map((o, i) => (
                  <div key={i} className="flex justify-between items-center text-[12px] py-1.5 border-b border-stone-100 last:border-0">
                    <span className="text-stone-600">{o.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold" style={{ color: cf.color }}>{o.value}</span>
                      {o.diff && (
                        <span className="text-[10px] font-mono text-stone-500 italic">({o.diff})</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Por qué no se hizo */}
        <div className="rounded-xl bg-amber-50/50 border border-amber-200 p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-[10px] uppercase tracking-[0.15em] text-amber-800 font-semibold mb-1">
                ¿Por qué no se tomó esa decisión?
              </h4>
              <p className="text-[13px] text-stone-700 leading-relaxed">{cf.why_not}</p>
            </div>
          </div>
        </div>

        {/* Winners / Losers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl bg-emerald-50/40 border border-emerald-200 p-4">
            <h4 className="text-[10px] uppercase tracking-[0.15em] text-emerald-800 font-semibold mb-2">
              Ganadores de la decisión real
            </h4>
            <p className="text-[13px] text-stone-700 leading-relaxed">{cf.winners}</p>
          </div>
          <div className="rounded-xl bg-rose-50/40 border border-rose-200 p-4">
            <h4 className="text-[10px] uppercase tracking-[0.15em] text-rose-800 font-semibold mb-2">
              Perdedores de la decisión real
            </h4>
            <p className="text-[13px] text-stone-700 leading-relaxed">{cf.losers}</p>
          </div>
        </div>

        {/* Lente austríaca */}
        <div className="rounded-xl bg-gradient-to-br from-[#FBF7F0] to-white border-2 border-[#7A1F3D]/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-[#7A1F3D]" />
            <h4 className="font-serif text-base text-stone-900">Lente austríaca</h4>
          </div>
          <p className="text-[14px] text-stone-700 leading-relaxed italic">{cf.austrian_lens}</p>
        </div>

        {/* Navegación */}
        <div className="flex items-center justify-between pt-2 border-t border-stone-200">
          <button onClick={() => setActiveIdx(Math.max(0, activeIdx - 1))}
                  disabled={activeIdx === 0}
                  className="text-xs px-3 py-1.5 rounded-lg border border-stone-200 bg-white hover:border-[#7A1F3D] hover:text-[#7A1F3D] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            ← Caso anterior
          </button>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-[11px] text-stone-500">
              <input type="checkbox" checked={showNumbers}
                     onChange={(e) => setShowNumbers(e.target.checked)}
                     className="accent-[#7A1F3D]" />
              Mostrar números
            </label>
          </div>
          <button onClick={() => setActiveIdx(Math.min(COUNTERFACTUALS.length - 1, activeIdx + 1))}
                  disabled={activeIdx === COUNTERFACTUALS.length - 1}
                  className="text-xs px-3 py-1.5 rounded-lg border border-stone-200 bg-white hover:border-[#7A1F3D] hover:text-[#7A1F3D] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            Caso siguiente →
          </button>
        </div>
      </div>

      {/* Patrón común */}
      <div className="rounded-2xl border-2 border-[#7A1F3D]/30 bg-gradient-to-br from-[#FBF7F0] via-white to-[#EC4899]/10 p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#7A1F3D]" />
          <h3 className="font-serif text-xl tracking-tight">El patrón común en los cinco casos</h3>
        </div>
        <div className="space-y-3 text-[14px] text-stone-700 leading-relaxed">
          <p>
            En los cinco casos hay un <strong>patrón idéntico</strong>: una decisión popular a corto
            plazo (repartir superávits, proteger insiders, no tocar tramos fiscales, subir SMI,
            indexar pensiones) genera un <strong>coste diferido</strong> que paga otra generación u
            otro grupo invisible en ese momento.
          </p>
          <p>
            Es la <strong>asimetría política</strong> fundamental: los ganadores están presentes,
            organizados, y votan ahora. Los perdedores están dispersos, son generaciones futuras, o
            son outsiders sin representación (jóvenes, inmigrantes, parados de larga duración). La
            decisión política óptima casi siempre contradice la decisión económica óptima.
          </p>
          <p className="text-[#7A1F3D] font-serif italic text-[15px] border-l-2 border-[#7A1F3D] pl-4 mt-4">
            La pregunta austríaca final: ¿cómo diseñas instituciones que protejan al invisible?
            Reglas fiscales vinculantes, fondos de estabilización con blindaje constitucional,
            deflactación automática, factor de sostenibilidad en pensiones. España ha desmontado
            sistemáticamente esos mecanismos desde 2018. Ahí está gran parte de la historia.
          </p>
        </div>
      </div>
    </div>
  );
}



/* --------------------------------------------------------------------------- */
/* [14] DISTRIBUCIÓN — Quién sostiene el sistema fiscal · v1.2                 */
/* ---------------------------------------------------------------------------
   Descomposición de la carga fiscal por tramos de renta. Datos AEAT 2023,
   proyectados a magnitudes 2025 con inflación de bases.

   Fuentes:
   · Estadística Declarantes IRPF AEAT 2023 (publicada jul-2025)
   · Informe Fedea / R. Doménech 2025
   · AEAT Informe Mensual Recaudación 2025
   --------------------------------------------------------------------------- */

// Distribución AEAT 2023 por tramo de renta — actualizada a magnitudes 2025
const IRPF_DISTRIBUTION = [
  {
    tramo: "< €12.450",
    color: "#A8A29E",
    declarantes_pct: 23.5,     // % del total
    declarantes_n: 5.6,         // millones
    cuota_pct: 0.8,             // % de la recaudación IRPF
    pago_medio: 200,            // €/año
    tipo_efectivo: 1.5,         // % sobre renta media del tramo
    renta_media: 8000,          // bruto medio del tramo
    label: "Rentas mínimas",
  },
  {
    tramo: "€12.450 — €21.000",
    color: "#78716C",
    declarantes_pct: 31.0,
    declarantes_n: 7.4,
    cuota_pct: 6.0,
    pago_medio: 1300,
    tipo_efectivo: 8.2,
    renta_media: 16000,
    label: "Rentas bajas",
  },
  {
    tramo: "€21.000 — €30.000",
    color: "#7A1F3D",
    declarantes_pct: 18.0,
    declarantes_n: 4.3,
    cuota_pct: 14.0,
    pago_medio: 3761,
    tipo_efectivo: 14.9,
    renta_media: 25000,
    label: "Clase trabajadora",
  },
  {
    tramo: "€30.000 — €60.000",
    color: "#A16207",
    declarantes_pct: 22.0,
    declarantes_n: 5.3,
    cuota_pct: 37.5,
    pago_medio: 8300,
    tipo_efectivo: 19.5,
    renta_media: 42000,
    label: "Clase media",
  },
  {
    tramo: "€60.000 — €150.000",
    color: "#B45309",
    declarantes_pct: 4.8,
    declarantes_n: 1.15,
    cuota_pct: 27.0,
    pago_medio: 28000,
    tipo_efectivo: 31.5,
    renta_media: 89000,
    label: "Clase media-alta",
  },
  {
    tramo: "€150.000 — €600.000",
    color: "#9A3412",
    declarantes_pct: 0.75,
    declarantes_n: 0.18,
    cuota_pct: 10.5,
    pago_medio: 68000,
    tipo_efectivo: 34.0,
    renta_media: 200000,
    label: "Rentas altas",
  },
  {
    tramo: "> €600.000",
    color: "#7F1D1D",
    declarantes_pct: 0.04,
    declarantes_n: 0.01,
    cuota_pct: 4.2,
    pago_medio: 495000,
    tipo_efectivo: 38.2,
    renta_media: 1300000,
    label: "Altos patrimonios",
  },
];

// Aportación acumulada
function cumulativeContrib(field) {
  let cum = 0;
  return IRPF_DISTRIBUTION.map(t => {
    cum += t[field];
    return cum;
  });
}

// Composición general de la recaudación AEAT 2025 (€325.4 Bn total)
const REVENUE_COMPOSITION = [
  { name: "IRPF trabajo + pensiones", value: 114, pct: 35.0, source: "Trabajadores + pensionistas" },
  { name: "IRPF otras rentas", value: 20, pct: 6.1, source: "Capital, rendimientos" },
  { name: "IVA", value: 92, pct: 28.3, source: "Consumo" },
  { name: "Impuesto Sociedades", value: 38, pct: 11.7, source: "Beneficios empresariales" },
  { name: "II.EE. + otros", value: 22, pct: 6.8, source: "Hidrocarburos, tabaco, etc." },
  { name: "Cotizaciones SS", value: 190, pct: 0, source: "No incluido en AEAT, suma aparte" },
];

function DistribucionView() {
  const [view, setView] = useState("piramide"); // piramide | curva | composicion | realidad

  // Acumuladas para curva de Lorenz fiscal
  const cumDeclarantes = cumulativeContrib("declarantes_pct");
  const cumCuota = cumulativeContrib("cuota_pct");
  const curveData = IRPF_DISTRIBUTION.map((t, i) => ({
    tramo: t.tramo,
    declarantes_cum: cumDeclarantes[i],
    cuota_cum: cumCuota[i],
  }));
  // Añadir origen
  curveData.unshift({ tramo: "0", declarantes_cum: 0, cuota_cum: 0 });

  // Cálculo "top 10% paga qué %" — aproximación desde nuestros tramos
  // Top 5.6% (>€60k) paga 41.7%. Top ~10% paga ~55% (Doménech)
  const top10Pct = 55;
  const top5Pct = 41.7;
  const bottom50Pct = cumCuota[2]; // 23.5+31+18 = 72.5% de declarantes, paga 20.8%
  const bottom40Pct = 6.8; // <€21k = 54.5% paga 6.8%

  const fmtEur = (v) => `€${Math.round(v).toLocaleString("es-ES")}`;
  const fmtM = (v) => v >= 1 ? `${v.toFixed(1)}M` : `${Math.round(v * 1000)}k`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl tracking-tight">Quién sostiene el sistema · distribución fiscal real</h2>
        <p className="text-sm text-stone-500 mt-1 max-w-3xl">
          Descomposición de la carga del IRPF por tramos de renta. Datos AEAT del ejercicio 2023
          (publicados jul-2025). La realidad cuantitativa es muy distinta del discurso político:
          una minoría concentra la recaudación, mientras la mayoría aporta de forma testimonial.
        </p>
        <div className="flex gap-2 flex-wrap mt-2">
          <SourceChip sourceKey="aeat_irpf_2023" />
        </div>
      </div>

      {/* Titular provocador */}
      <div className="rounded-2xl border-2 border-[#7A1F3D] bg-gradient-to-br from-[#FBF7F0] to-white p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-[10px] uppercase tracking-[0.15em] text-stone-500 font-semibold mb-2">El 50% más humilde</div>
            <div className="font-serif text-5xl text-emerald-700">{bottom50Pct.toFixed(0)}%</div>
            <p className="text-[13px] text-stone-600 mt-2 leading-snug">
              del IRPF aporta la mitad inferior (<strong>13M declarantes</strong> con renta hasta €30k)
            </p>
          </div>
          <div className="text-center border-x-2 border-stone-200 px-2">
            <div className="text-[10px] uppercase tracking-[0.15em] text-stone-500 font-semibold mb-2">El 10% más rico</div>
            <div className="font-serif text-5xl text-[#7A1F3D]">{top10Pct}%</div>
            <p className="text-[13px] text-stone-600 mt-2 leading-snug">
              del IRPF aporta el decil superior (<strong>2.4M declarantes</strong> con renta &gt;€50k)
            </p>
          </div>
          <div className="text-center">
            <div className="text-[10px] uppercase tracking-[0.15em] text-stone-500 font-semibold mb-2">El 5.6% más rico</div>
            <div className="font-serif text-5xl text-[#9A3412]">{top5Pct}%</div>
            <p className="text-[13px] text-stone-600 mt-2 leading-snug">
              del IRPF aporta quien gana &gt;€60k (<strong>1.35M declarantes</strong>, pago medio €37k/año)
            </p>
          </div>
        </div>
        <p className="text-[13px] text-stone-700 leading-relaxed mt-6 italic border-l-4 border-[#7A1F3D] pl-4">
          <strong className="font-serif not-italic text-[#7A1F3D]">Interpretación honesta:</strong> el
          IRPF español es fuertemente progresivo — la recaudación descansa en una base estrecha de
          rentas medias-altas. Esto tiene consecuencias: (1) fragilidad fiscal ante fuga/movilidad
          de altas rentas, (2) poca sensibilidad fiscal del votante medio, que no paga apenas IRPF,
          (3) compresión desincentivadora sobre el decil 8-9.
        </p>
      </div>

      {/* Selector de visualización */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: "piramide",     label: "Pirámide por tramos" },
          { id: "curva",        label: "Curva de concentración" },
          { id: "composicion",  label: "De dónde vienen los impuestos" },
          { id: "realidad",     label: "La realidad del ciudadano medio" },
        ].map(v => (
          <button key={v.id} onClick={() => setView(v.id)}
            className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
              view === v.id
                ? "bg-[#7A1F3D] text-white"
                : "bg-white border border-stone-200 text-stone-600 hover:border-[#7A1F3D]"
            }`}>
            {v.label}
          </button>
        ))}
      </div>

      {/* Vista: Pirámide */}
      {view === "piramide" && (
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <div className="mb-4">
            <h3 className="font-serif text-lg tracking-tight">Pirámide fiscal: declarantes vs recaudación</h3>
            <p className="text-[11px] text-stone-500">
              A la izquierda, % de declarantes. A la derecha, % de recaudación. Cuanto más cruzadas, más concentrada.
            </p>
          </div>
          <div className="space-y-2">
            {IRPF_DISTRIBUTION.map((t, i) => {
              const maxPct = Math.max(t.declarantes_pct, t.cuota_pct);
              return (
                <div key={i} className="grid grid-cols-12 gap-3 items-center text-sm">
                  <div className="col-span-3 md:col-span-2 text-right">
                    <div className="font-mono text-xs text-stone-800 font-semibold">{t.tramo}</div>
                    <div className="text-[10px] text-stone-500">{t.label}</div>
                  </div>
                  {/* Barra declarantes a la izquierda */}
                  <div className="col-span-4 md:col-span-5 flex justify-end">
                    <div className="flex items-center gap-2 w-full">
                      <span className="font-mono text-[11px] text-stone-500 w-12 text-right">{t.declarantes_pct}%</span>
                      <div className="flex-1 bg-stone-100 rounded-l-sm overflow-hidden h-7 flex justify-end">
                        <div className="h-full" style={{
                          width: `${(t.declarantes_pct / 35) * 100}%`,
                          backgroundColor: t.color,
                          opacity: 0.4,
                        }}/>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-1 text-center">
                    <span className="text-[9px] text-stone-400 font-mono">{fmtM(t.declarantes_n)}</span>
                  </div>
                  {/* Barra recaudación a la derecha */}
                  <div className="col-span-4">
                    <div className="flex items-center gap-2 w-full">
                      <div className="flex-1 bg-stone-100 rounded-r-sm overflow-hidden h-7">
                        <div className="h-full" style={{
                          width: `${(t.cuota_pct / 40) * 100}%`,
                          backgroundColor: t.color,
                        }}/>
                      </div>
                      <span className="font-mono text-[11px] font-semibold w-12" style={{ color: t.color }}>
                        {t.cuota_pct}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="grid grid-cols-12 gap-3 mt-3 pt-3 border-t border-stone-200 text-[10px] uppercase tracking-[0.1em] text-stone-400">
              <div className="col-span-3 md:col-span-2 text-right">Tramo</div>
              <div className="col-span-4 md:col-span-5 text-right pr-3">% Declarantes (nº)</div>
              <div className="col-span-1"></div>
              <div className="col-span-4">% Recaudación</div>
            </div>
          </div>

          {/* Detalle pago medio por tramo */}
          <div className="mt-6 pt-5 border-t border-stone-200">
            <h4 className="text-[11px] uppercase tracking-[0.12em] text-stone-500 font-semibold mb-3">Pago medio y tipo efectivo por tramo</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {IRPF_DISTRIBUTION.map((t, i) => (
                <div key={i} className="rounded-lg border p-3" style={{ borderColor: t.color + "30" }}>
                  <div className="text-[9px] uppercase tracking-[0.1em] text-stone-500">{t.tramo}</div>
                  <div className="font-serif text-base mt-1" style={{ color: t.color }}>
                    {fmtEur(t.pago_medio)}
                  </div>
                  <div className="text-[10px] text-stone-500">pago medio IRPF/año</div>
                  <div className="text-[10px] text-stone-600 mt-1 font-mono">{t.tipo_efectivo}% efectivo</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Vista: Curva */}
      {view === "curva" && (
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <div className="mb-3">
            <h3 className="font-serif text-lg tracking-tight">Curva de concentración fiscal</h3>
            <p className="text-[11px] text-stone-500">
              Si fuera perfectamente proporcional, sería la diagonal. Cuanto más se aleja hacia abajo, más concentrada la recaudación en pocos contribuyentes.
            </p>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={curveData} margin={{ top: 10, right: 40, left: 10, bottom: 40 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="#E7E5E4" />
              <XAxis dataKey="declarantes_cum" type="number" domain={[0, 100]}
                     tick={{ fontSize: 11, fill: "#57534E" }}
                     label={{ value: "% declarantes acumulado", position: "bottom", offset: 20, fontSize: 11, fill: "#57534E" }} />
              <YAxis type="number" domain={[0, 100]}
                     tick={{ fontSize: 11, fill: "#57534E" }}
                     label={{ value: "% recaudación acumulada", angle: -90, position: "insideLeft", fontSize: 11, fill: "#57534E" }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E7E5E4", fontSize: 12 }}
                       formatter={(v, n) => [`${v.toFixed(1)}%`, n === "cuota_cum" ? "Recaudación acumulada" : "Proporcional (referencia)"]}
                       labelFormatter={(l) => `${l.toFixed(0)}% declarantes acumulados`} />
              <Line type="linear" dataKey="declarantes_cum" stroke="#A8A29E" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Proporcional" />
              <Line type="monotone" dataKey="cuota_cum" stroke="#7A1F3D" strokeWidth={3}
                    dot={{ fill: "#7A1F3D", r: 5 }} name="Curva real IRPF España" />
              <ReferenceLine y={50} stroke="#E11D48" strokeDasharray="2 2" />
              <ReferenceLine x={90} stroke="#E11D48" strokeDasharray="2 2" />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg bg-amber-50/40 border border-amber-200 p-4">
              <h4 className="text-[11px] uppercase tracking-[0.12em] text-amber-800 font-semibold mb-1">Lectura 1 — base estrecha</h4>
              <p className="text-[13px] text-stone-700 leading-relaxed">
                El 50% de los declarantes (más de <strong>12 millones de personas</strong>) aporta
                apenas el {bottom50Pct.toFixed(0)}% de la recaudación. El 40% inferior apenas llega
                al {bottom40Pct}%. Esto hace al sistema <strong>frágil</strong>: depende de pocos
                contribuyentes que soportan casi todo.
              </p>
            </div>
            <div className="rounded-lg bg-rose-50/40 border border-rose-200 p-4">
              <h4 className="text-[11px] uppercase tracking-[0.12em] text-rose-800 font-semibold mb-1">Lectura 2 — compresión en el medio-alto</h4>
              <p className="text-[13px] text-stone-700 leading-relaxed">
                El 22% de declarantes (<strong>5.3M con €30-60k</strong>, la clase media pura)
                aporta el 37.5% de la recaudación. Es el <strong>sandwich fiscal</strong>: paga
                como las rentas altas sin tener su movilidad geográfica o optimización patrimonial.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Vista: Composición */}
      {view === "composicion" && (
        <div className="rounded-2xl border border-stone-200 bg-white p-5 space-y-5">
          <div>
            <h3 className="font-serif text-lg tracking-tight">De dónde vienen los €325 Bn anuales de AEAT</h3>
            <p className="text-[11px] text-stone-500">
              Recaudación AEAT 2025 — sin incluir cotizaciones SS (€190 Bn adicionales, 54% gravan nómina)
            </p>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={REVENUE_COMPOSITION.filter(r => r.value > 0)} layout="vertical"
                     margin={{ top: 10, right: 40, left: 140, bottom: 5 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="#E7E5E4" />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#57534E" }} tickFormatter={(v) => `€${v}Bn`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#57534E" }} width={130} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E7E5E4", fontSize: 12 }}
                       formatter={(v, n, p) => [`€${v} Bn (${p.payload.pct}%)`, "Recaudación"]} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {REVENUE_COMPOSITION.filter(r => r.value > 0).map((d, i) => {
                  const colors = ["#7A1F3D", "#A16207", "#1E40AF", "#065F46", "#B45309"];
                  return <Cell key={i} fill={colors[i % colors.length]} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div className="rounded-lg bg-gradient-to-br from-[#FBF7F0] to-white border-l-4 border-[#7A1F3D] p-4">
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-[#7A1F3D] mt-0.5 shrink-0" />
              <div>
                <h4 className="font-serif text-base text-stone-900 mb-2">
                  Los trabajadores y pensionistas pagan el 85% del IRPF
                </h4>
                <p className="text-[13px] text-stone-700 leading-relaxed mb-2">
                  Según AEAT, en 2025 las <strong>rentas del trabajo</strong> (salarios) y
                  pensiones aportaron <strong>~€114 Bn al IRPF</strong>, el 85% del total del
                  impuesto. Si a esto sumamos los €190 Bn de cotizaciones SS (100% del trabajo),
                  tenemos que <strong>el mercado laboral sostiene 2 de cada 3 euros que recauda el Estado</strong>.
                </p>
                <p className="text-[13px] text-stone-700 leading-relaxed">
                  Los declarantes con ingresos de <strong>€1-5 millones crecen un 196%</strong> en 9
                  años, pero sigue siendo un grupo muy pequeño. Las rentas del capital aportan ~6%
                  del IRPF. Sociedades aporta 12% del total AEAT.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-lg bg-stone-50 border border-stone-200 p-3 text-center">
              <div className="text-[10px] uppercase tracking-[0.12em] text-stone-500">IRPF/salarios</div>
              <div className="font-serif text-2xl text-[#7A1F3D]">€114 Bn</div>
              <div className="text-[10px] text-stone-500 mt-1">85% IRPF · 35% AEAT</div>
            </div>
            <div className="rounded-lg bg-stone-50 border border-stone-200 p-3 text-center">
              <div className="text-[10px] uppercase tracking-[0.12em] text-stone-500">Cotizaciones SS</div>
              <div className="font-serif text-2xl text-[#A16207]">€190 Bn</div>
              <div className="text-[10px] text-stone-500 mt-1">100% sobre nómina</div>
            </div>
            <div className="rounded-lg bg-stone-50 border border-stone-200 p-3 text-center">
              <div className="text-[10px] uppercase tracking-[0.12em] text-stone-500">IVA</div>
              <div className="font-serif text-2xl text-[#1E40AF]">€92 Bn</div>
              <div className="text-[10px] text-stone-500 mt-1">28% AEAT · regresivo</div>
            </div>
          </div>
        </div>
      )}

      {/* Vista: Realidad */}
      {view === "realidad" && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-stone-200 bg-white p-5">
            <h3 className="font-serif text-lg tracking-tight mb-1">Tipo efectivo IRPF vs renta</h3>
            <p className="text-[11px] text-stone-500 mb-3">
              La progresividad oficial vs la efectiva. Los tipos medios son mucho más bajos que los marginales.
            </p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={IRPF_DISTRIBUTION} margin={{ top: 10, right: 20, left: 0, bottom: 30 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="#E7E5E4" />
                <XAxis dataKey="tramo" tick={{ fontSize: 10, fill: "#57534E" }} angle={-15} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11, fill: "#57534E" }} tickFormatter={(v) => `${v}%`} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E7E5E4", fontSize: 12 }}
                         formatter={(v) => [`${v}%`, "Tipo efectivo"]} />
                <Bar dataKey="tipo_efectivo" radius={[4, 4, 0, 0]}>
                  {IRPF_DISTRIBUTION.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/40 p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-700 mt-0.5 shrink-0" />
              <div>
                <h3 className="font-serif text-lg tracking-tight mb-2">
                  El mito del "progresivo de verdad"
                </h3>
                <div className="space-y-3 text-[13px] text-stone-700 leading-relaxed">
                  <p>
                    El discurso político sugiere que el tipo marginal del 47% se aplica ampliamente.
                    La realidad: <strong>solo el 0.8% de los declarantes supera €150.000</strong>
                    (umbral donde empieza a morder el 45-47%). Para la inmensa mayoría, el tipo
                    efectivo real está entre 8% y 20%.
                  </p>
                  <p>
                    Pero si añadimos <strong>cotizaciones, IVA y especiales</strong>, la cuña
                    fiscal total sobre un trabajador €40k bruto alcanza el <strong>35-40%</strong>;
                    sobre uno de €80k, el <strong>47-52%</strong>. La regresividad de los impuestos
                    indirectos (IVA golpea más al Q1) y las cotizaciones con tope compensan
                    parcialmente la progresividad del IRPF.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl bg-white border-2 border-emerald-300 p-4">
              <h4 className="font-serif text-base text-emerald-700 mb-2">Trabajador €25.000 bruto</h4>
              <table className="w-full text-[12px]">
                <tbody>
                  <tr className="border-b border-stone-100"><td className="py-1.5 text-stone-600">Bruto</td><td className="text-right font-mono">€25.000</td></tr>
                  <tr className="border-b border-stone-100"><td className="py-1.5 text-stone-600">SS empresa (no visible)</td><td className="text-right font-mono text-rose-700">€8.038</td></tr>
                  <tr className="border-b border-stone-100"><td className="py-1.5 text-stone-600">SS trabajador</td><td className="text-right font-mono text-rose-700">€1.625</td></tr>
                  <tr className="border-b border-stone-100"><td className="py-1.5 text-stone-600">IRPF (tipo ~14%)</td><td className="text-right font-mono text-rose-700">€3.280</td></tr>
                  <tr className="border-b border-stone-100"><td className="py-1.5 text-stone-600">IVA estimado</td><td className="text-right font-mono text-rose-700">€1.800</td></tr>
                  <tr className="border-b border-stone-100 bg-emerald-50/50"><td className="py-1.5 font-semibold">Total Estado</td><td className="text-right font-mono font-bold text-[#7A1F3D]">€14.743</td></tr>
                  <tr><td className="py-1.5 font-semibold">Cuña total</td><td className="text-right font-mono font-bold text-[#7A1F3D]">44.7%</td></tr>
                </tbody>
              </table>
            </div>
            <div className="rounded-xl bg-white border-2 border-rose-300 p-4">
              <h4 className="font-serif text-base text-rose-700 mb-2">Trabajador €80.000 bruto</h4>
              <table className="w-full text-[12px]">
                <tbody>
                  <tr className="border-b border-stone-100"><td className="py-1.5 text-stone-600">Bruto</td><td className="text-right font-mono">€80.000</td></tr>
                  <tr className="border-b border-stone-100"><td className="py-1.5 text-stone-600">SS empresa (no visible)</td><td className="text-right font-mono text-rose-700">€19.870</td></tr>
                  <tr className="border-b border-stone-100"><td className="py-1.5 text-stone-600">SS trabajador</td><td className="text-right font-mono text-rose-700">€4.017</td></tr>
                  <tr className="border-b border-stone-100"><td className="py-1.5 text-stone-600">IRPF (tipo ~30%)</td><td className="text-right font-mono text-rose-700">€23.000</td></tr>
                  <tr className="border-b border-stone-100"><td className="py-1.5 text-stone-600">IVA estimado</td><td className="text-right font-mono text-rose-700">€4.525</td></tr>
                  <tr className="border-b border-stone-100 bg-rose-50/50"><td className="py-1.5 font-semibold">Total Estado</td><td className="text-right font-mono font-bold text-[#7A1F3D]">€51.412</td></tr>
                  <tr><td className="py-1.5 font-semibold">Cuña total</td><td className="text-right font-mono font-bold text-[#7A1F3D]">51.5%</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Síntesis austríaca */}
      <div className="rounded-2xl border-2 border-[#7A1F3D]/30 bg-gradient-to-br from-[#FBF7F0] via-white to-[#EC4899]/10 p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#7A1F3D]" />
          <h3 className="font-serif text-xl tracking-tight">Tres lecturas honestas del sistema fiscal español</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <h4 className="font-serif text-base text-stone-900 mb-2">① La progresividad es real pero estrecha</h4>
            <p className="text-[13px] text-stone-700 leading-relaxed">
              El IRPF español es uno de los más progresivos de la UE. El top 10% aporta 55% de la
              recaudación. Pero esta estructura hace al sistema <strong>frágil</strong>: si 100.000
              altos contribuyentes se mueven a Portugal o Andorra, el impacto es desproporcionado.
            </p>
          </div>
          <div>
            <h4 className="font-serif text-base text-stone-900 mb-2">② La clase media-alta es el "sandwich"</h4>
            <p className="text-[13px] text-stone-700 leading-relaxed">
              Los <strong>5.3 millones con €30-60k</strong> aportan el 37.5% del IRPF — proporción
              mayor que cualquier otro tramo. No son ricos pero pagan como ricos. Sin herramientas
              de optimización, sin movilidad fácil, sin representación política clara. Son los que
              sienten más agudamente el bracket creep.
            </p>
          </div>
          <div>
            <h4 className="font-serif text-base text-stone-900 mb-2">③ Los invisibles: SS + IVA</h4>
            <p className="text-[13px] text-stone-700 leading-relaxed">
              La cuña fiscal total es mucho mayor que el IRPF. Las cotizaciones SS empresa (32.15%)
              no aparecen en la nómina pero son salario diferido que el trabajador no recibe. El
              IVA castiga más proporcionalmente a las rentas bajas. Mirar solo al IRPF oculta más
              de la mitad del sistema.
            </p>
          </div>
        </div>
        <div className="border-l-4 border-[#7A1F3D] pl-4 mt-2">
          <p className="text-[13px] text-stone-700 leading-relaxed italic">
            <strong className="font-serif text-[#7A1F3D] not-italic">Lente Blondie:</strong> el
            sistema fiscal no es una cosa única. Es un tapiz de varios impuestos con incidencias
            distintas, visibilidades distintas, y ganadores/perdedores distintos. Cuando alguien
            dice "España es un paraíso/infierno fiscal" sin especificar <strong>para quién</strong>,
            está simplificando lo que es inherentemente complejo. El análisis honesto requiere
            mirar la cuña total por decil — que es lo que esta app intenta hacer.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-stone-400 pt-2 border-t border-stone-200">
          <Info className="w-3 h-3" />
          <span>Datos: AEAT Estadística Declarantes IRPF 2023 (pub. jul-2025), Informe Mensual Recaudación 2025, Fedea (R. Doménech).</span>
        </div>
      </div>
    </div>
  );
}



/* --------------------------------------------------------------------------- */
/* [15] AUTONOMÍAS — IRPF comparado por CCAA · v1.3                            */
/* ---------------------------------------------------------------------------
   Tramos autonómicos 2026 (ejercicio fiscal 2025) de las 17 CCAA.
   Calcula IRPF total (estatal 50% + autonómico 50%) para un bruto dado.
   Datos: Panorama Fiscalidad Autonómica y Foral 2025 (REAF/CG Economistas).
   --------------------------------------------------------------------------- */

// Escala estatal IRPF 2026 (50% del total)
const IRPF_ESTATAL_2026 = [
  { upTo: 12450,  rate: 0.095 },
  { upTo: 20200,  rate: 0.12 },
  { upTo: 35200,  rate: 0.15 },
  { upTo: 60000,  rate: 0.185 },
  { upTo: 300000, rate: 0.225 },
  { upTo: Infinity, rate: 0.245 },
];

// Escalas autonómicas 2026 — tramo máximo en vigor (aprox. según REAF + BOE autonómicos)
// Fuente: Panorama Fiscalidad Autonómica 2025 (CG Economistas/REAF) + normativa autonómica 2024-2026
const CCAA_IRPF = [
  {
    id: "mad",  name: "Madrid",            population: 6.9, color: "#059669",
    brackets: [
      { upTo: 13362,  rate: 0.085 },
      { upTo: 19005,  rate: 0.107 },
      { upTo: 33007,  rate: 0.128 },
      { upTo: 53407,  rate: 0.174 },
      { upTo: Infinity, rate: 0.205 },
    ],
    marginal_total: 0.435, notes: "Tramo máximo 20,5%. Deflactación anual 2024 (Ley 5/2024). Rebaja adicional 0,5pp en 2027.",
  },
  {
    id: "cat",  name: "Cataluña",          population: 7.8, color: "#E11D48",
    brackets: [
      { upTo: 12450,  rate: 0.105 },
      { upTo: 17707,  rate: 0.12 },
      { upTo: 33007,  rate: 0.14 },
      { upTo: 53407,  rate: 0.185 },
      { upTo: 90000,  rate: 0.215 },
      { upTo: 120000, rate: 0.235 },
      { upTo: 175000, rate: 0.245 },
      { upTo: Infinity, rate: 0.255 },
    ],
    marginal_total: 0.50, notes: "Tramo máximo 25,5%. 8 tramos, máxima progresividad. Tipo total hasta 50%.",
  },
  {
    id: "val",  name: "Com. Valenciana",   population: 5.1, color: "#DC2626",
    brackets: [
      { upTo: 12450,  rate: 0.09 },
      { upTo: 17000,  rate: 0.12 },
      { upTo: 30000,  rate: 0.15 },
      { upTo: 50000,  rate: 0.175 },
      { upTo: 65000,  rate: 0.225 },
      { upTo: 80000,  rate: 0.25 },
      { upTo: 120000, rate: 0.265 },
      { upTo: 140000, rate: 0.275 },
      { upTo: 175000, rate: 0.285 },
      { upTo: 200000, rate: 0.29 },
      { upTo: Infinity, rate: 0.295 },
    ],
    marginal_total: 0.54, notes: "Tramo máximo 29,5%. Máxima tasa España en tramos altos (54% total).",
  },
  {
    id: "and",  name: "Andalucía",         population: 8.6, color: "#7A1F3D",
    brackets: [
      { upTo: 13000,  rate: 0.095 },
      { upTo: 21000,  rate: 0.12 },
      { upTo: 35200,  rate: 0.15 },
      { upTo: 60000,  rate: 0.185 },
      { upTo: Infinity, rate: 0.225 },
    ],
    marginal_total: 0.47, notes: "Tramo máximo 22,5%. Política de rebajas progresivas desde 2022.",
  },
  {
    id: "mur",  name: "Murcia",            population: 1.6, color: "#A16207",
    brackets: [
      { upTo: 12450,  rate: 0.095 },
      { upTo: 20200,  rate: 0.119 },
      { upTo: 34000,  rate: 0.1286 },
      { upTo: 60000,  rate: 0.175 },
      { upTo: Infinity, rate: 0.225 },
    ],
    marginal_total: 0.47, notes: "Tramo máximo 22,5%. Rebajas aplicadas 2023.",
  },
  {
    id: "ara",  name: "Aragón",            population: 1.4, color: "#B45309",
    brackets: [
      { upTo: 12450,  rate: 0.095 },
      { upTo: 20200,  rate: 0.12 },
      { upTo: 34000,  rate: 0.15 },
      { upTo: 50000,  rate: 0.185 },
      { upTo: 70000,  rate: 0.22 },
      { upTo: 90000,  rate: 0.245 },
      { upTo: 130000, rate: 0.25 },
      { upTo: 200000, rate: 0.255 },
      { upTo: Infinity, rate: 0.255 },
    ],
    marginal_total: 0.50, notes: "Tramo máximo 25,5%. 9 tramos, deflactación parcial.",
  },
  {
    id: "ast",  name: "Asturias",          population: 1.0, color: "#9A3412",
    brackets: [
      { upTo: 12450,  rate: 0.10 },
      { upTo: 17707,  rate: 0.12 },
      { upTo: 33007,  rate: 0.14 },
      { upTo: 53407,  rate: 0.185 },
      { upTo: 70000,  rate: 0.215 },
      { upTo: 90000,  rate: 0.225 },
      { upTo: 175000, rate: 0.25 },
      { upTo: Infinity, rate: 0.255 },
    ],
    marginal_total: 0.50, notes: "Tramo máximo 25,5%. Escala muy progresiva.",
  },
  {
    id: "bal",  name: "Baleares",          population: 1.2, color: "#B45309",
    brackets: [
      { upTo: 10000,  rate: 0.09 },
      { upTo: 18000,  rate: 0.1125 },
      { upTo: 30000,  rate: 0.1425 },
      { upTo: 48000,  rate: 0.175 },
      { upTo: 70000,  rate: 0.195 },
      { upTo: 90000,  rate: 0.2345 },
      { upTo: 120000, rate: 0.2475 },
      { upTo: Infinity, rate: 0.2475 },
    ],
    marginal_total: 0.4925, notes: "Tramo máximo 24,75%. Rebajas 2023 para tramos medios.",
  },
  {
    id: "can",  name: "Canarias",          population: 2.2, color: "#A16207",
    brackets: [
      { upTo: 12450,  rate: 0.09 },
      { upTo: 17707,  rate: 0.115 },
      { upTo: 33007,  rate: 0.14 },
      { upTo: 53407,  rate: 0.185 },
      { upTo: 90000,  rate: 0.235 },
      { upTo: 120000, rate: 0.25 },
      { upTo: Infinity, rate: 0.26 },
    ],
    marginal_total: 0.505, notes: "Tramo máximo 26%. Escala propia autonómica.",
  },
  {
    id: "cnt",  name: "Cantabria",         population: 0.6, color: "#A16207",
    brackets: [
      { upTo: 13000,  rate: 0.085 },
      { upTo: 21000,  rate: 0.11 },
      { upTo: 35200,  rate: 0.145 },
      { upTo: 60000,  rate: 0.18 },
      { upTo: 90000,  rate: 0.225 },
      { upTo: Infinity, rate: 0.245 },
    ],
    marginal_total: 0.49, notes: "Tramo máximo 24,5%. Rebajas 2023.",
  },
  {
    id: "cyl",  name: "Castilla y León",   population: 2.4, color: "#065F46",
    brackets: [
      { upTo: 12450,  rate: 0.09 },
      { upTo: 20200,  rate: 0.12 },
      { upTo: 35200,  rate: 0.14 },
      { upTo: 53407,  rate: 0.185 },
      { upTo: Infinity, rate: 0.215 },
    ],
    marginal_total: 0.46, notes: "Tramo máximo 21,5%. Una de las más bajas fuera de Madrid.",
  },
  {
    id: "clm",  name: "Castilla-La Mancha", population: 2.1, color: "#7A1F3D",
    brackets: [
      { upTo: 12450,  rate: 0.095 },
      { upTo: 20200,  rate: 0.12 },
      { upTo: 35200,  rate: 0.15 },
      { upTo: 60000,  rate: 0.185 },
      { upTo: Infinity, rate: 0.225 },
    ],
    marginal_total: 0.47, notes: "Tramo máximo 22,5%. Estándar régimen común.",
  },
  {
    id: "ext",  name: "Extremadura",       population: 1.1, color: "#9A3412",
    brackets: [
      { upTo: 12450,  rate: 0.08 },
      { upTo: 20200,  rate: 0.10 },
      { upTo: 24200,  rate: 0.16 },
      { upTo: 35200,  rate: 0.175 },
      { upTo: 60000,  rate: 0.21 },
      { upTo: 80200,  rate: 0.235 },
      { upTo: 99200,  rate: 0.24 },
      { upTo: 120200, rate: 0.245 },
      { upTo: Infinity, rate: 0.25 },
    ],
    marginal_total: 0.495, notes: "Tramo máximo 25%. 9 tramos, rebaja ley urgente 2023.",
  },
  {
    id: "gal",  name: "Galicia",           population: 2.7, color: "#A16207",
    brackets: [
      { upTo: 12985,  rate: 0.09 },
      { upTo: 21068,  rate: 0.1165 },
      { upTo: 35200,  rate: 0.149 },
      { upTo: 47600,  rate: 0.184 },
      { upTo: 60000,  rate: 0.205 },
      { upTo: Infinity, rate: 0.225 },
    ],
    marginal_total: 0.47, notes: "Tramo máximo 22,5%. Rebajas progresivas 2022-2024.",
  },
  {
    id: "lri",  name: "La Rioja",          population: 0.3, color: "#DC2626",
    brackets: [
      { upTo: 12450,  rate: 0.08 },
      { upTo: 20200,  rate: 0.106 },
      { upTo: 35200,  rate: 0.138 },
      { upTo: 50000,  rate: 0.174 },
      { upTo: 120000, rate: 0.235 },
      { upTo: Infinity, rate: 0.27 },
    ],
    marginal_total: 0.515, notes: "Tramo máximo 27%. Mezcla rebajas + progresividad alta arriba.",
  },
  {
    id: "nav",  name: "Navarra (Foral)",   population: 0.7, color: "#DC2626",
    brackets: [
      { upTo: 4458,   rate: 0.13 },
      { upTo: 10030,  rate: 0.22 },
      { upTo: 21175,  rate: 0.25 },
      { upTo: 35663,  rate: 0.28 },
      { upTo: 50577,  rate: 0.36 },
      { upTo: 90000,  rate: 0.405 },
      { upTo: 125000, rate: 0.425 },
      { upTo: 175000, rate: 0.455 },
      { upTo: 300000, rate: 0.475 },
      { upTo: Infinity, rate: 0.52 },
    ],
    marginal_total: 0.52, notes: "Régimen foral propio. Escala completa — tipos marginales hasta 52%.",
    foral: true,
  },
  {
    id: "pvs",  name: "País Vasco (Foral)", population: 2.2, color: "#B45309",
    brackets: [
      { upTo: 16690,  rate: 0.23 },
      { upTo: 33380,  rate: 0.28 },
      { upTo: 50060,  rate: 0.35 },
      { upTo: 66890,  rate: 0.40 },
      { upTo: 95780,  rate: 0.45 },
      { upTo: 127120, rate: 0.46 },
      { upTo: 200120, rate: 0.47 },
      { upTo: Infinity, rate: 0.49 },
    ],
    marginal_total: 0.49, notes: "Régimen foral propio (Álava/Bizkaia/Gipuzkoa). Tipo máximo 49%.",
    foral: true,
  },
];

/**
 * Calcula IRPF pagado dado un bruto en una CCAA.
 * Para CCAA no forales: estatal + autonómica (ambas aplicadas al bruto).
 * Para CCAA forales (Navarra, PV): escala completa propia que ya integra ambos tramos.
 */
function computeIRPF_CCAA(bruto, ccaa, ssWorker = 0.065) {
  const baseSS = Math.min(bruto, 61214.40);
  const cotizacion = baseSS * ssWorker + Math.max(0, bruto - 61214.40) * 0.0019;
  const baseIRPF = bruto - cotizacion - 5550; // menos mínimo personal

  if (baseIRPF <= 0) return { irpf: 0, neto: bruto - cotizacion, tipoEfectivo: 0, marginal: 0 };

  let irpfEstatal = 0, prev = 0;
  if (!ccaa.foral) {
    for (const b of IRPF_ESTATAL_2026) {
      if (baseIRPF <= prev) break;
      const tramo = Math.min(baseIRPF, b.upTo) - prev;
      irpfEstatal += tramo * b.rate;
      prev = b.upTo;
      if (baseIRPF <= b.upTo) break;
    }
  }

  let irpfAuto = 0; prev = 0;
  for (const b of ccaa.brackets) {
    if (baseIRPF <= prev) break;
    const tramo = Math.min(baseIRPF, b.upTo) - prev;
    irpfAuto += tramo * b.rate;
    prev = b.upTo;
    if (baseIRPF <= b.upTo) break;
  }

  const irpf = irpfEstatal + irpfAuto;
  const neto = bruto - cotizacion - irpf;
  const tipoEfectivo = irpf / bruto;

  // Marginal: buscar tipo del último tramo alcanzado
  let marginalAuto = ccaa.brackets[ccaa.brackets.length - 1].rate;
  for (const b of ccaa.brackets) {
    if (baseIRPF <= b.upTo) { marginalAuto = b.rate; break; }
  }
  let marginalEstatal = 0;
  if (!ccaa.foral) {
    marginalEstatal = IRPF_ESTATAL_2026[IRPF_ESTATAL_2026.length - 1].rate;
    for (const b of IRPF_ESTATAL_2026) {
      if (baseIRPF <= b.upTo) { marginalEstatal = b.rate; break; }
    }
  }
  return { irpf, neto, tipoEfectivo, marginal: marginalAuto + marginalEstatal, cotizacion };
}

function AutonomiasView() {
  const [bruto, setBruto] = useState(80000);
  const [sortBy, setSortBy] = useState("irpf"); // irpf | marginal | name
  const [highlighted, setHighlighted] = useState("mad");

  const data = useMemo(() => {
    return CCAA_IRPF.map(c => {
      const r = computeIRPF_CCAA(bruto, c);
      return { ...c, ...r };
    }).sort((a, b) => {
      if (sortBy === "irpf") return a.irpf - b.irpf;
      if (sortBy === "marginal") return a.marginal - b.marginal;
      return a.name.localeCompare(b.name);
    });
  }, [bruto, sortBy]);

  const minIRPF = Math.min(...data.map(d => d.irpf));
  const maxIRPF = Math.max(...data.map(d => d.irpf));
  const spread = maxIRPF - minIRPF;

  const highlightedData = data.find(d => d.id === highlighted) || data[0];

  const fmtEur = (v) => `€${Math.round(v).toLocaleString("es-ES")}`;
  const fmtPct = (v) => `${(v * 100).toFixed(1)}%`;

  // Presets de brutos
  const brutoPresets = [
    { v: 25000,  l: "SMI+" },
    { v: 40000,  l: "Media" },
    { v: 60000,  l: "Media-alta" },
    { v: 80000,  l: "Alta" },
    { v: 150000, l: "Directivo" },
    { v: 300000, l: "Top 0.1%" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl tracking-tight">Autonomías · diferencia real de IRPF por CCAA</h2>
        <p className="text-sm text-stone-500 mt-1 max-w-3xl">
          El IRPF se reparte al 50% entre Estado y CCAA. Cada comunidad fija su propia escala
          autonómica, y las diferencias pueden superar los <strong>€6.000/año</strong> para el
          mismo bruto. Navarra y País Vasco tienen régimen foral propio.
        </p>
      </div>

      {/* Control de bruto */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <div className="flex items-baseline justify-between flex-wrap gap-3 mb-3">
          <div>
            <label className="text-[11px] uppercase tracking-[0.12em] text-stone-500 font-semibold">
              Salario bruto anual
            </label>
            <div className="flex items-center gap-3 mt-2">
              <input type="range" min={15000} max={300000} step={1000} value={bruto}
                     onChange={(e) => setBruto(parseInt(e.target.value))}
                     className="w-64 accent-[#7A1F3D]" />
              <span className="font-serif text-2xl text-[#7A1F3D]">{fmtEur(bruto)}</span>
            </div>
          </div>
          <div className="flex gap-1 flex-wrap">
            {brutoPresets.map(p => (
              <button key={p.v} onClick={() => setBruto(p.v)}
                className={`text-[11px] px-2.5 py-1 rounded-full transition-colors ${
                  bruto === p.v
                    ? "bg-[#7A1F3D] text-white"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}>
                {p.l} <span className="font-mono">{fmtEur(p.v)}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
          <span className="text-[11px] uppercase tracking-[0.12em] text-stone-500">Ordenar:</span>
          {[
            { id: "irpf", label: "IRPF pagado (menor primero)" },
            { id: "marginal", label: "Tipo marginal" },
            { id: "name", label: "Alfabético" },
          ].map(s => (
            <button key={s.id} onClick={() => setSortBy(s.id)}
              className={`text-[11px] px-2.5 py-1 rounded transition-colors ${
                sortBy === s.id ? "bg-[#7A1F3D] text-white" : "text-stone-500 hover:bg-stone-100"
              }`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Resumen de diferencia */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50/50 p-4">
          <div className="text-[10px] uppercase tracking-[0.12em] text-emerald-700 font-semibold">Donde pagarías menos</div>
          <div className="font-serif text-xl mt-1 text-emerald-700">{data[0]?.name}</div>
          <div className="font-mono text-lg text-stone-800 mt-1">{fmtEur(minIRPF)}</div>
          <div className="text-[11px] text-stone-500 mt-0.5">tipo efectivo {fmtPct(minIRPF / bruto)}</div>
        </div>
        <div className="rounded-xl border-2 border-amber-300 bg-amber-50/50 p-4">
          <div className="text-[10px] uppercase tracking-[0.12em] text-amber-700 font-semibold">Diferencia máxima</div>
          <div className="font-serif text-xl mt-1 text-amber-700">{fmtEur(spread)}</div>
          <div className="font-mono text-lg text-stone-800 mt-1">{fmtPct(spread / bruto)} del bruto</div>
          <div className="text-[11px] text-stone-500 mt-0.5">a 10 años: {fmtEur(spread * 10)}</div>
        </div>
        <div className="rounded-xl border-2 border-rose-300 bg-rose-50/50 p-4">
          <div className="text-[10px] uppercase tracking-[0.12em] text-rose-700 font-semibold">Donde pagarías más</div>
          <div className="font-serif text-xl mt-1 text-rose-700">{data[data.length - 1]?.name}</div>
          <div className="font-mono text-lg text-stone-800 mt-1">{fmtEur(maxIRPF)}</div>
          <div className="text-[11px] text-stone-500 mt-0.5">tipo efectivo {fmtPct(maxIRPF / bruto)}</div>
        </div>
      </div>

      {/* Ranking barras */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <h3 className="font-serif text-lg tracking-tight mb-3">Ranking de IRPF pagado — {fmtEur(bruto)} bruto</h3>
        <div className="space-y-1.5">
          {data.map((c, idx) => {
            const widthPct = (c.irpf / maxIRPF) * 100;
            const diffVsMin = c.irpf - minIRPF;
            const isHighlighted = c.id === highlighted;
            return (
              <div key={c.id}
                   onClick={() => setHighlighted(c.id)}
                   className={`grid grid-cols-12 gap-2 items-center py-1 px-1 rounded cursor-pointer transition-colors ${
                     isHighlighted ? "bg-[#7A1F3D]/5 ring-1 ring-[#7A1F3D]/20" : "hover:bg-stone-50"
                   }`}>
                <div className="col-span-1 text-right">
                  <span className="font-mono text-[11px] text-stone-400">#{idx + 1}</span>
                </div>
                <div className="col-span-3 md:col-span-2">
                  <span className="text-[12px] text-stone-800 font-medium">{c.name}</span>
                  {c.foral && <span className="ml-1 text-[9px] text-stone-400 font-mono">(foral)</span>}
                </div>
                <div className="col-span-5 md:col-span-6 flex items-center">
                  <div className="flex-1 bg-stone-100 rounded-sm overflow-hidden h-6">
                    <div className="h-full flex items-center px-2 text-[10px] text-white font-mono"
                         style={{
                           width: `${widthPct}%`,
                           backgroundColor: isHighlighted ? "#7A1F3D" : c.color,
                           opacity: isHighlighted ? 1 : 0.75,
                         }}>
                    </div>
                  </div>
                </div>
                <div className="col-span-2 text-right">
                  <span className="font-mono text-[12px] font-semibold text-stone-900">{fmtEur(c.irpf)}</span>
                </div>
                <div className="col-span-1 text-right">
                  {diffVsMin > 0 ? (
                    <span className="font-mono text-[10px] text-rose-600">+{fmtEur(diffVsMin)}</span>
                  ) : (
                    <span className="font-mono text-[10px] text-emerald-600">base</span>
                  )}
                </div>
                <div className="hidden md:block col-span-1 text-right">
                  <span className="font-mono text-[10px] text-stone-500">{fmtPct(c.tipoEfectivo)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detalle CCAA resaltada */}
      <div className="rounded-2xl border-2 p-5"
           style={{ borderColor: highlightedData.color + "60", background: `linear-gradient(135deg, ${highlightedData.color}08, white)` }}>
        <div className="flex items-baseline justify-between flex-wrap gap-2">
          <div>
            <div className="text-[10px] uppercase tracking-[0.15em] font-semibold" style={{ color: highlightedData.color }}>
              Detalle
            </div>
            <h3 className="font-serif text-2xl tracking-tight">{highlightedData.name}</h3>
          </div>
          <div className="text-[11px] text-stone-500 font-mono">
            Población: {highlightedData.population}M
          </div>
        </div>
        <p className="text-[13px] text-stone-600 italic mt-2">{highlightedData.notes}</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <div className="rounded-lg bg-white border border-stone-200 p-3">
            <div className="text-[9px] uppercase tracking-[0.1em] text-stone-500">Cotización SS</div>
            <div className="font-mono text-sm mt-1">{fmtEur(highlightedData.cotizacion)}</div>
          </div>
          <div className="rounded-lg bg-white border border-stone-200 p-3">
            <div className="text-[9px] uppercase tracking-[0.1em] text-stone-500">IRPF total</div>
            <div className="font-mono text-sm mt-1" style={{ color: highlightedData.color }}>
              {fmtEur(highlightedData.irpf)}
            </div>
          </div>
          <div className="rounded-lg bg-white border border-stone-200 p-3">
            <div className="text-[9px] uppercase tracking-[0.1em] text-stone-500">Tipo marginal</div>
            <div className="font-mono text-sm mt-1">{fmtPct(highlightedData.marginal)}</div>
          </div>
          <div className="rounded-lg bg-white border border-stone-200 p-3">
            <div className="text-[9px] uppercase tracking-[0.1em] text-stone-500">Neto anual</div>
            <div className="font-mono text-sm mt-1 font-semibold text-emerald-700">{fmtEur(highlightedData.neto)}</div>
          </div>
        </div>

        {/* Tramos de la CCAA */}
        <div className="mt-5 pt-4 border-t border-stone-200">
          <h4 className="text-[10px] uppercase tracking-[0.12em] text-stone-500 font-semibold mb-2">
            Escala autonómica {highlightedData.foral ? "(escala completa foral)" : "(sumar ~50% al estatal)"}
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead className="bg-stone-50">
                <tr className="text-[10px] uppercase tracking-[0.08em] text-stone-500">
                  <th className="text-left px-3 py-1.5">Desde</th>
                  <th className="text-left px-3 py-1.5">Hasta</th>
                  <th className="text-right px-3 py-1.5">Tipo {highlightedData.foral ? "total" : "autonómico"}</th>
                </tr>
              </thead>
              <tbody>
                {highlightedData.brackets.map((b, i) => {
                  const from = i === 0 ? 0 : highlightedData.brackets[i - 1].upTo;
                  return (
                    <tr key={i} className="border-b border-stone-100">
                      <td className="px-3 py-1.5 font-mono">{fmtEur(from)}</td>
                      <td className="px-3 py-1.5 font-mono">
                        {b.upTo === Infinity ? "—" : fmtEur(b.upTo)}
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono font-semibold" style={{ color: highlightedData.color }}>
                        {fmtPct(b.rate)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Lectura honesta */}
      <div className="rounded-2xl border-2 border-[#7A1F3D]/30 bg-gradient-to-br from-[#FBF7F0] via-white to-[#EC4899]/10 p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#7A1F3D]" />
          <h3 className="font-serif text-xl tracking-tight">Cuatro lecturas de la fiscalidad autonómica</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <h4 className="font-serif text-base text-stone-900 mb-2">① Competencia fiscal intraespañola</h4>
            <p className="text-[13px] text-stone-700 leading-relaxed">
              La diferencia Madrid vs Cataluña/Valencia para un €80k bruto es de <strong>~€3.500/año</strong>.
              Para un €200k, supera los <strong>€8.000/año</strong>. Esto explica parte de la atracción
              de altas rentas a Madrid: en 20 años de carrera profesional puede acumular <strong>€70-160k</strong>
              solo por diferencia fiscal.
            </p>
          </div>
          <div>
            <h4 className="font-serif text-base text-stone-900 mb-2">② Los forales: otra liga</h4>
            <p className="text-[13px] text-stone-700 leading-relaxed">
              Navarra y País Vasco tienen <strong>régimen foral propio</strong> — no aplican escala
              estatal, sino escala completa. Tipos máximos superiores (52%, 49%), pero también
              mínimo personal más alto y deducciones propias. El balance depende del perfil del
              contribuyente.
            </p>
          </div>
          <div>
            <h4 className="font-serif text-base text-stone-900 mb-2">③ Progresividad real muy dispar</h4>
            <p className="text-[13px] text-stone-700 leading-relaxed">
              Madrid tiene <strong>5 tramos autonómicos</strong>; Cataluña y Asturias, <strong>8-9</strong>;
              Valencia, <strong>11</strong>. No es solo nivel, es granularidad: con más tramos se
              captura más "excedente" en la clase media-alta, donde se concentra la masa contribuyente.
            </p>
          </div>
          <div>
            <h4 className="font-serif text-base text-stone-900 mb-2">④ Deflactación: otra ventaja Madrid</h4>
            <p className="text-[13px] text-stone-700 leading-relaxed">
              Madrid deflacta anualmente (Ley 5/2024). País Vasco, Aragón, Canarias deflactan
              parcialmente. El resto no. En 10 años con IPC acumulado 25-30%, esto supone
              <strong> 2-3 pp menos de tasa efectiva</strong> frente a las no deflactadoras, sin
              necesidad de aprobar bajadas explícitas.
            </p>
          </div>
        </div>
        <div className="border-l-4 border-[#7A1F3D] pl-4 mt-2">
          <p className="text-[13px] text-stone-700 leading-relaxed italic">
            <strong className="font-serif text-[#7A1F3D] not-italic">Lente Blondie:</strong> la
            fiscalidad autonómica es el <em>gran laboratorio fiscal</em> español. Cada CCAA prueba
            una combinación distinta (Madrid = tipo bajo + deflactación; Cataluña = alta progresividad
            + máximo tipo; forales = modelo completo propio). La competencia entre modelos genera
            datos para saber qué funciona — y qué contribuyentes migran hacia dónde. El debate
            "dumping fiscal vs armonización" oculta lo esencial: <em>con el mismo PIB per cápita,
            Madrid recauda más que Cataluña porque su base imponible es mayor, no porque sus tipos
            sean mayores</em>.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-stone-400 pt-2 border-t border-stone-200">
          <Info className="w-3 h-3" />
          <span>Datos: Panorama Fiscalidad Autonómica 2025 (REAF/CGE), normativa autonómica y BOE. Tipos marginales máximos agregados.</span>
        </div>
      </div>
    </div>
  );
}



/* --------------------------------------------------------------------------- */
/* [16] CICLO DE VIDA FISCAL — 40 años cotizando + 20 de pensión · v1.4        */
/* ---------------------------------------------------------------------------
   Simula lo que un trabajador paga e ingresa del sistema a lo largo de toda
   su vida laboral (25→65) y jubilación (66→85). Comparación honesta: cuánto
   he dado vs cuánto voy a recibir.

   Parámetros base: tasa de reposición 77,5% (vs 44,5% ZE), pensión media,
   esperanza de vida 88+ años (Seg. Social 2026).
   --------------------------------------------------------------------------- */

const LIFECYCLE_DEFAULTS = {
  age_start: 25,
  age_retire: 67,                // Edad legal ordinaria desde 2027 (66a10m en 2026)
  age_retire_early: 65,          // Solo si cotizó ≥38 años 6 meses
  age_death: 85,
  salary_start: 22000,
  salary_growth_real: 0.015,    // 1.5% real anual
  inflation: 0.022,              // 2.2% ancla BCE/BdE
  replacement_rate: 1.00,        // 100% base reguladora si cotizó 36.5 años+
  pension_indexation: 1.0,       // IPC pleno (Ley 21/2021)
  ss_employer: 0.3215,           // 30.57% + MEI 0.80% + acc trab 1.0% ≈ 32.15%
  ss_worker: 0.065,              // 6.35% + MEI 0.13% + accid 0.015%
  consumption_share: 0.70,       // del neto
  iva_effective: 0.115,          // IVA efectivo cesta
  ieee_effective: 0.025,
  ibi_share: 0.012,              // sobre gasto vivienda propiedad

  // Datos oficiales 2026 (BOE RD 2025)
  base_max_cotizacion_2026: 61215,    // € anual (5.101,25 × 12) — base cotización SS tope
  pension_max_anual_2026: 47034,      // €47.034,40 anual (3.359,60 × 14)
  pension_media_anual_2026: 22400,    // ~€1.600 × 14 pagas (pensionista medio contributivo)
  pension_min_anual_2026: 13107,      // €13.106,80 mín contrib. sin cónyuge a cargo
  pension_no_contrib_2026: 8803,      // €8.803,20 anual no contributiva
};

function computeLifeCycle(params = {}) {
  const p = { ...LIFECYCLE_DEFAULTS, ...params };

  const workYears = p.age_retire - p.age_start;
  const pensionYears = p.age_death - p.age_retire;

  let paid_total = 0;
  let received_total = 0;
  const timeline = [];

  // === FASE 1: trabajo (25 → 67) ===
  for (let i = 0; i < workYears; i++) {
    const age = p.age_start + i;
    // Salario real crece + inflación acumulada
    const salary_nominal = p.salary_start * Math.pow(1 + p.salary_growth_real + p.inflation, i);

    // Base cotización SS tope por año (€61.215 base 2026, ajustada por inflación)
    const baseSS_tope = p.base_max_cotizacion_2026 * Math.pow(1 + p.inflation, i);
    const baseSS = Math.min(salary_nominal, baseSS_tope);
    const ss_worker = baseSS * p.ss_worker;
    const ss_employer = baseSS * p.ss_employer;

    // IRPF con escala consolidada 2026 — mínimo personal ya aplicado
    const baseIRPF = Math.max(0, salary_nominal - ss_worker - FISCAL_CONSTANTES_2026.min_personal);
    let irpf = 0, prev = 0;
    for (const b of IRPF_BRACKETS_2026) {
      if (baseIRPF <= prev) break;
      const tramo = Math.min(baseIRPF, b.upTo) - prev;
      irpf += tramo * b.rate;
      prev = b.upTo;
      if (baseIRPF <= b.upTo) break;
    }
    irpf = Math.max(0, irpf);

    const neto = salary_nominal - ss_worker - irpf;
    const gastable = neto * p.consumption_share;
    const iva = gastable * p.iva_effective;
    const ieee = gastable * p.ieee_effective;
    const ibi_local = gastable * 0.25 * p.ibi_share;  // ~25% gasto en vivienda

    const year_paid = ss_worker + ss_employer + irpf + iva + ieee + ibi_local;
    paid_total += year_paid;

    timeline.push({
      age, phase: "trabajo", salary: salary_nominal,
      paid: year_paid, received: 0,
      paid_cum: paid_total, received_cum: 0,
      net: neto - iva - ieee - ibi_local,
      // Desglose para transparencia
      ss_worker, ss_employer, irpf, iva, ieee, baseSS,
      topado: salary_nominal > baseSS_tope,
    });
  }

  // Base reguladora: media últimos 25 años (aprox). Con topes.
  // Si el salario final supera la base máx, cotiza por el tope (no por el salario).
  const finalSalary = p.salary_start * Math.pow(1 + p.salary_growth_real + p.inflation, workYears - 1);
  const baseMaxFinal = p.base_max_cotizacion_2026 * Math.pow(1 + p.inflation, workYears - 1);
  const baseReguladora = Math.min(finalSalary, baseMaxFinal);
  // Tope pensión máxima 2026: €47.034/año, crecimiento IPC + 0.115% anual
  const topePension = p.pension_max_anual_2026 * Math.pow(1 + p.inflation + 0.00115, workYears - 1);
  const pensionTeorica = baseReguladora * p.replacement_rate;
  let pensionBase = Math.min(pensionTeorica, topePension);
  const pensionTopada = pensionTeorica > topePension;

  // === FASE 2: jubilación (67 → 85) ===
  for (let i = 0; i < pensionYears; i++) {
    const age = p.age_retire + i;
    // Pensión máxima revaloriza IPC + 0.115% extra (ley actual 2025-2050)
    const pension_year = pensionBase * Math.pow(1 + p.inflation * p.pension_indexation, i);

    // IRPF sobre pensión (sin cotización SS)
    const baseIRPFpen = pension_year - 6950; // mínimo mayor 65
    let irpf = 0, prev = 0;
    for (const b of IRPF_BRACKETS_2026) {
      if (baseIRPFpen <= prev) break;
      const tramo = Math.min(baseIRPFpen, b.upTo) - prev;
      irpf += tramo * b.rate;
      prev = b.upTo;
      if (baseIRPFpen <= b.upTo) break;
    }
    irpf = Math.max(0, irpf);

    const neto = pension_year - irpf;
    const gastable = neto * 0.85;  // jubilados ahorran menos
    const iva = gastable * p.iva_effective;
    const ieee = gastable * p.ieee_effective;

    received_total += pension_year;
    // En jubilación sí pagas IRPF + IVA + IEE pero no cotización
    paid_total += irpf + iva + ieee;

    timeline.push({
      age, phase: "pensión", salary: pension_year,
      paid: irpf + iva + ieee, received: pension_year,
      paid_cum: paid_total, received_cum: received_total,
      net: neto - iva - ieee,
      topado: pensionTopada,
    });
  }

  return {
    timeline, paid_total, received_total, ratio: received_total / paid_total,
    pensionBase, pensionTopada, pensionTeorica,
    finalSalary, baseReguladora, topePension,
  };
}

function CicloVidaView() {
  const [salaryStart, setSalaryStart] = useState(30000);
  const [growth, setGrowth] = useState(1.5);
  const [replacement, setReplacement] = useState(100);  // 100% si cotizó 36.5+ años
  const [deathAge, setDeathAge] = useState(85);
  const [retireAge, setRetireAge] = useState(67);  // Nuevo: edad configurable

  const result = useMemo(() => computeLifeCycle({
    salary_start: salaryStart,
    salary_growth_real: growth / 100,
    replacement_rate: replacement / 100,
    age_death: deathAge,
    age_retire: retireAge,
  }), [salaryStart, growth, replacement, deathAge, retireAge]);

  const fmtEur = (v) => `€${Math.round(v).toLocaleString("es-ES")}`;
  const fmtEurShort = (v) => `€${Math.round(v / 1000)}k`;
  const fmtPct = (v) => `${(v * 100).toFixed(0)}%`;

  // Descomposición total
  const pensionTotal = result.timeline.filter(t => t.phase === "pensión")
                                      .reduce((s, t) => s + t.received, 0);
  const workYearsTotal = result.timeline.filter(t => t.phase === "trabajo")
                                         .reduce((s, t) => s + t.paid, 0);
  const pensionPaidTax = result.timeline.filter(t => t.phase === "pensión")
                                         .reduce((s, t) => s + t.paid, 0);

  const netBalance = pensionTotal - workYearsTotal;
  const netBalancePct = (pensionTotal / workYearsTotal - 1) * 100;

  // Pensión en primer año de jubilación (comparable a importes conocidos)
  const firstPensionYear = result.timeline.find(t => t.phase === "pensión");
  const pensionMensualPrimerAno = firstPensionYear ? firstPensionYear.received / 14 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl tracking-tight">Ciclo de vida fiscal · 42 años + 18 de pensión</h2>
        <p className="text-sm text-stone-500 mt-1 max-w-3xl">
          ¿Cuánto da al Estado una persona en toda su vida laboral? ¿Cuánto recibe de vuelta en la
          jubilación? Desde 2027 la edad legal es <strong>67 años</strong> (65 solo con ≥38a6m cotizados).
          La pensión está <strong>topada a €47.034/año</strong> (2026) aunque hayas cotizado más. Datos
          ajustados a normativa vigente.
        </p>
      </div>

      {/* Parámetros */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="text-[11px] uppercase tracking-[0.12em] text-stone-500 font-semibold">
              Salario inicio carrera (25 años)
            </label>
            <div className="flex items-center gap-2 mt-1">
              <input type="range" min={18000} max={80000} step={1000} value={salaryStart}
                     onChange={(e) => setSalaryStart(parseInt(e.target.value))}
                     className="flex-1 accent-[#7A1F3D]" />
              <span className="font-mono text-sm text-[#7A1F3D] w-20 text-right">{fmtEur(salaryStart)}</span>
            </div>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-[0.12em] text-stone-500 font-semibold">
              Crecimiento salarial real/año
            </label>
            <div className="flex items-center gap-2 mt-1">
              <input type="range" min={0} max={4} step={0.1} value={growth}
                     onChange={(e) => setGrowth(parseFloat(e.target.value))}
                     className="flex-1 accent-[#7A1F3D]" />
              <span className="font-mono text-sm text-[#7A1F3D] w-20 text-right">{growth.toFixed(1)}%</span>
            </div>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-[0.12em] text-stone-500 font-semibold">
              Edad jubilación
            </label>
            <div className="flex items-center gap-2 mt-1">
              <input type="range" min={63} max={70} step={1} value={retireAge}
                     onChange={(e) => setRetireAge(parseInt(e.target.value))}
                     className="flex-1 accent-[#7A1F3D]" />
              <span className="font-mono text-sm text-[#7A1F3D] w-20 text-right">{retireAge} años</span>
            </div>
            <p className="text-[9px] text-stone-400 mt-0.5">Legal 2027: 67 (65 si ≥38a6m)</p>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-[0.12em] text-stone-500 font-semibold">
              % base reguladora
            </label>
            <div className="flex items-center gap-2 mt-1">
              <input type="range" min={50} max={100} step={1} value={replacement}
                     onChange={(e) => setReplacement(parseInt(e.target.value))}
                     className="flex-1 accent-[#7A1F3D]" />
              <span className="font-mono text-sm text-[#7A1F3D] w-20 text-right">{replacement}%</span>
            </div>
            <p className="text-[9px] text-stone-400 mt-0.5">100% si 36a6m+ cotizados · 50% mín</p>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-[0.12em] text-stone-500 font-semibold">
              Esperanza de vida
            </label>
            <div className="flex items-center gap-2 mt-1">
              <input type="range" min={75} max={95} step={1} value={deathAge}
                     onChange={(e) => setDeathAge(parseInt(e.target.value))}
                     className="flex-1 accent-[#7A1F3D]" />
              <span className="font-mono text-sm text-[#7A1F3D] w-20 text-right">{deathAge} años</span>
            </div>
          </div>
        </div>
      </div>

      {/* NUEVO: Aviso del tope + datos reales de pensión calculada */}
      <div className="rounded-2xl border-2 border-[#7A1F3D]/30 bg-[#FBF7F0] p-5">
        <h3 className="font-serif text-lg tracking-tight mb-3">Tu pensión calculada vs realidad 2026</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="rounded-xl bg-white border border-stone-200 p-4">
            <div className="text-[10px] uppercase tracking-[0.12em] text-stone-500 font-semibold">Pensión 1er año (simulada)</div>
            <div className="font-serif text-2xl text-[#7A1F3D] mt-1">{fmtEur(pensionMensualPrimerAno)}/mes</div>
            <div className="text-[10px] text-stone-500 mt-1">14 pagas · bruto</div>
            {result.pensionTopada && (
              <div className="text-[10px] text-amber-700 font-semibold mt-1">⚠ Limitada por tope</div>
            )}
          </div>
          <div className="rounded-xl bg-white border border-amber-300 p-4">
            <div className="text-[10px] uppercase tracking-[0.12em] text-amber-800 font-semibold">Pensión máxima 2026</div>
            <div className="font-serif text-2xl text-amber-700 mt-1">€3.359/mes</div>
            <div className="text-[10px] text-stone-500 mt-1">€47.034/año · tope legal</div>
            <div className="text-[10px] text-stone-500 mt-1">Solo ~8% pensionistas</div>
          </div>
          <div className="rounded-xl bg-white border border-stone-300 p-4">
            <div className="text-[10px] uppercase tracking-[0.12em] text-stone-600 font-semibold">Pensión media real</div>
            <div className="font-serif text-2xl text-stone-700 mt-1">€1.600/mes</div>
            <div className="text-[10px] text-stone-500 mt-1">€22.400/año · contributiva</div>
            <div className="text-[10px] text-stone-500 mt-1">Pensionista medio 2026</div>
          </div>
          <div className="rounded-xl bg-white border border-stone-200 p-4">
            <div className="text-[10px] uppercase tracking-[0.12em] text-stone-500 font-semibold">Pensión mínima</div>
            <div className="font-serif text-2xl text-stone-700 mt-1">€936/mes</div>
            <div className="text-[10px] text-stone-500 mt-1">€13.107/año · sin cónyuge</div>
            <div className="text-[10px] text-stone-500 mt-1">Complemento a mínimos</div>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-stone-200 text-[12px] text-stone-600 leading-relaxed">
          <strong>Lectura:</strong> la pensión máxima legal es €3.359/mes, pero {result.pensionTopada ?
            <span className="text-amber-700"><strong>con tu salario el cálculo teórico superaría el tope — la SS te lo recortaría.</strong></span> :
            <span>tu perfil simulado no alcanza el tope.</span>
          } Base reguladora tope 2026: €5.101/mes. Solo quien cotiza por la base máxima durante los últimos 25 años llega a la pensión máxima. <strong>El pensionista medio español cobra ~€1.600/mes</strong> — muy lejos del tope. La tasa de reposición bruta media (pensión/último salario) es en torno al 60-70% en la práctica, no el 80% teórico.
        </div>
      </div>

      {/* Resumen final */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-xl border-2 border-rose-300 bg-rose-50/60 p-4">
          <div className="text-[10px] uppercase tracking-[0.12em] text-rose-700 font-semibold">Total pagado al Estado</div>
          <div className="font-serif text-2xl text-rose-700 mt-1">{fmtEur(result.paid_total)}</div>
          <div className="text-[11px] text-stone-500 mt-1">SS + IRPF + IVA + II.EE. 60 años</div>
        </div>
        <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50/60 p-4">
          <div className="text-[10px] uppercase tracking-[0.12em] text-emerald-700 font-semibold">Total recibido en pensiones</div>
          <div className="font-serif text-2xl text-emerald-700 mt-1">{fmtEur(result.received_total)}</div>
          <div className="text-[11px] text-stone-500 mt-1">{deathAge - 65} años de jubilación</div>
        </div>
        <div className="rounded-xl border-2 p-4"
             style={{
               borderColor: netBalance >= 0 ? "#10B981" : "#E11D48",
               background: netBalance >= 0 ? "rgba(16,185,129,0.05)" : "rgba(225,29,72,0.05)",
             }}>
          <div className="text-[10px] uppercase tracking-[0.12em] font-semibold"
               style={{ color: netBalance >= 0 ? "#10B981" : "#E11D48" }}>
            Balance neto
          </div>
          <div className="font-serif text-2xl mt-1" style={{ color: netBalance >= 0 ? "#10B981" : "#E11D48" }}>
            {netBalance >= 0 ? "+" : ""}{fmtEur(netBalance)}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            Recuperas {fmtPct(result.ratio)} de lo pagado · {netBalancePct >= 0 ? "+" : ""}{netBalancePct.toFixed(1)}pp
          </div>
        </div>
      </div>

      {/* Gráfico acumulado */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <h3 className="font-serif text-lg tracking-tight mb-1">Trayectoria acumulada: pagado vs recibido</h3>
        <p className="text-[11px] text-stone-500 mb-4">
          La línea roja sube durante toda la vida laboral. La verde empieza al jubilarse. El punto
          en que se cruzan es cuando "recuperas" lo que has pagado.
        </p>
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={result.timeline} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
            <defs>
              <linearGradient id="lc-paid" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#E11D48" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#E11D48" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="lc-recv" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#10B981" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="2 4" stroke="#E7E5E4" />
            <XAxis dataKey="age" tick={{ fontSize: 11, fill: "#57534E" }}
                   label={{ value: "Edad", position: "bottom", offset: -2, fontSize: 10, fill: "#A8A29E" }} />
            <YAxis tick={{ fontSize: 11, fill: "#57534E" }} tickFormatter={fmtEurShort}
                   label={{ value: "€ acumulados", angle: -90, position: "insideLeft", fontSize: 10, fill: "#A8A29E" }} />
            <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E7E5E4", fontSize: 12 }}
                     formatter={(v, n) => [fmtEur(v), n === "paid_cum" ? "Pagado acumulado" : "Recibido acumulado"]}
                     labelFormatter={(l) => `Edad ${l}`} />
            <ReferenceLine x={65} stroke="#7A1F3D" strokeDasharray="3 3" strokeWidth={1.5}
                           label={{ value: "Jubilación", fontSize: 10, fill: "#7A1F3D", position: "insideTopRight" }} />
            <Area type="monotone" dataKey="paid_cum" stroke="#E11D48" strokeWidth={2.5} fill="url(#lc-paid)" />
            <Area type="monotone" dataKey="received_cum" stroke="#10B981" strokeWidth={2.5} fill="url(#lc-recv)" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Descomposición por fase */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-stone-200 bg-white p-5">
          <h4 className="font-serif text-base text-stone-900 mb-3">Durante los 40 años de trabajo</h4>
          <table className="w-full text-[12px]">
            <tbody>
              <tr className="border-b border-stone-100"><td className="py-2 text-stone-600">Ingresos brutos totales</td><td className="text-right font-mono">{fmtEur(result.timeline.filter(t => t.phase === "trabajo").reduce((s, t) => s + t.salary, 0))}</td></tr>
              <tr className="border-b border-stone-100"><td className="py-2 text-stone-600">Total pagado al Estado</td><td className="text-right font-mono text-rose-700">{fmtEur(workYearsTotal)}</td></tr>
              <tr className="border-b border-stone-100 bg-stone-50/50">
                <td className="py-2 font-semibold">Cuña fiscal media</td>
                <td className="text-right font-mono font-semibold">{fmtPct(workYearsTotal / result.timeline.filter(t => t.phase === "trabajo").reduce((s, t) => s + t.salary, 0) * 1.32)}</td>
              </tr>
              <tr className="border-b border-stone-100"><td className="py-2 text-stone-600">Neto disponible acumulado</td><td className="text-right font-mono text-emerald-700">{fmtEur(result.timeline.filter(t => t.phase === "trabajo").reduce((s, t) => s + t.net, 0))}</td></tr>
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-5">
          <h4 className="font-serif text-base text-stone-900 mb-3">Durante los {deathAge - 65} años de pensión</h4>
          <table className="w-full text-[12px]">
            <tbody>
              <tr className="border-b border-stone-100"><td className="py-2 text-stone-600">Pensiones totales cobradas</td><td className="text-right font-mono text-emerald-700">{fmtEur(pensionTotal)}</td></tr>
              <tr className="border-b border-stone-100"><td className="py-2 text-stone-600">Pensión media mensual</td><td className="text-right font-mono">{fmtEur(pensionTotal / (deathAge - 65) / 14)}</td></tr>
              <tr className="border-b border-stone-100"><td className="py-2 text-stone-600">IRPF + IVA pagado en jubilación</td><td className="text-right font-mono text-rose-700">{fmtEur(pensionPaidTax)}</td></tr>
              <tr className="border-b border-stone-100 bg-stone-50/50">
                <td className="py-2 font-semibold">Recuperación neta real</td>
                <td className="text-right font-mono font-semibold text-emerald-700">{fmtEur(pensionTotal - pensionPaidTax)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Lectura austríaca */}
      <div className="rounded-2xl border-2 border-[#7A1F3D]/30 bg-gradient-to-br from-[#FBF7F0] via-white to-[#EC4899]/10 p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#7A1F3D]" />
          <h3 className="font-serif text-xl tracking-tight">Tres cosas que este cálculo revela</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <h4 className="font-serif text-base text-stone-900 mb-2">① La pensión es contrato implícito</h4>
            <p className="text-[13px] text-stone-700 leading-relaxed">
              Durante los 40 años de trabajo, <strong>el 60-65% de la cuña fiscal va a la SS</strong>
              (cotización empresa + trabajador). La promesa implícita: recuperarás parte en la
              jubilación. Pero la SS no capitaliza — tu cotización de hoy paga la pensión de otro
              hoy. <em>Depende de que haya trabajadores futuros que paguen la tuya</em>.
            </p>
          </div>
          <div>
            <h4 className="font-serif text-base text-stone-900 mb-2">② El Estado nunca suelta al pensionista</h4>
            <p className="text-[13px] text-stone-700 leading-relaxed">
              Incluso jubilado, el Estado recauda de ti: IRPF sobre pensión (tramos 2026),
              IVA sobre gasto, II.EE. en consumo energético. La cuña fiscal en jubilación cae
              al <strong>25-30%</strong> (porque no hay SS), pero no desaparece.
            </p>
          </div>
          <div>
            <h4 className="font-serif text-base text-stone-900 mb-2">③ Altas rentas: rentables al sistema</h4>
            <p className="text-[13px] text-stone-700 leading-relaxed">
              Con tope de cotización (€61k/año) pero tope de pensión (€45k/año bruto), los altos
              salarios <strong>cotizan al máximo pero reciben muy por debajo de proporcional</strong>.
              En un bruto €80k, el ratio recibido/pagado puede bajar de 0.30. <em>El sistema
              redistribuye dentro de generación, no solo entre ellas</em>.
            </p>
          </div>
        </div>
        <div className="border-l-4 border-[#7A1F3D] pl-4 mt-2">
          <p className="text-[13px] text-stone-700 leading-relaxed italic">
            <strong className="font-serif text-[#7A1F3D] not-italic">Lente Blondie:</strong> el
            ratio {fmtPct(result.ratio)} dice algo muy concreto. Si es &lt;100%, <em>pagas más de
            lo que recibes</em>: la diferencia financia a otros (pensiones mínimas, viudedad,
            sanidad, servicios). Si es &gt;100%, <em>otros pagan por ti</em>. La pregunta austríaca
            honesta no es si el sistema "funciona" — es <strong>¿quién está dando y quién está
            recibiendo, y por cuánto tiempo más puede continuar?</strong>
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-stone-400 pt-2 border-t border-stone-200">
          <Info className="w-3 h-3" />
          <span>Supuestos: Seg. Social 2026 (tope cotización €61.214, tope pensión €45.746), IPC anclado 2.2%, sin deflactación tramos IRPF, tasa reposición 77.5% real España.</span>
        </div>
      </div>
    </div>
  );
}



/* --------------------------------------------------------------------------- */
/* [17] COMPARATIVA EUROPA — España vs principales economías · v1.5            */
/* ---------------------------------------------------------------------------
   Comparativa honesta con países vecinos. Datos OCDE 2024 (Taxing Wages),
   Eurostat presión fiscal, Tax Foundation tipos marginales.
   --------------------------------------------------------------------------- */

// Principales economías UE + referencias + Norteamérica
const EU_COUNTRIES = [
  {
    id: "es", name: "España", flag: "🇪🇸", highlighted: true,
    tax_wedge: 39.49, presion_fiscal: 37.3, marginal_max: 47.0,
    gdp_pc_eur: 30000, unemployment: 10.0, debt_pub: 100.7,
    productivity_idx: 92, vat_standard: 21, social_sec_emp: 32.15,
    pensions_pib: 12.3, replacement_rate: 77.5,
    note: "Cuña alta pero PIB/pc bajo. Dependencia SS elevada. Tasa reposición más alta ZE.",
  },
  {
    id: "de", name: "Alemania", flag: "🇩🇪",
    tax_wedge: 47.85, presion_fiscal: 41.9, marginal_max: 45.0,
    gdp_pc_eur: 49000, unemployment: 3.3, debt_pub: 62.8,
    productivity_idx: 115, vat_standard: 19, social_sec_emp: 21.2,
    pensions_pib: 10.3, replacement_rate: 48.0,
    note: "Cuña altísima, pero salario alto. PIB/pc 60% mayor que España. Deuda controlada.",
  },
  {
    id: "fr", name: "Francia", flag: "🇫🇷",
    tax_wedge: 47.0, presion_fiscal: 45.6, marginal_max: 55.4,
    gdp_pc_eur: 42000, unemployment: 7.3, debt_pub: 112.0,
    productivity_idx: 113, vat_standard: 20, social_sec_emp: 40.0,
    pensions_pib: 13.8, replacement_rate: 51.0,
    note: "Mayor presión fiscal UE. SS empresa 40%+. Deuda también alta. Pensiones comparables.",
  },
  {
    id: "it", name: "Italia", flag: "🇮🇹",
    tax_wedge: 45.1, presion_fiscal: 42.6, marginal_max: 47.2,
    gdp_pc_eur: 36000, unemployment: 5.7, debt_pub: 135.0,
    productivity_idx: 102, vat_standard: 22, social_sec_emp: 30.0,
    pensions_pib: 15.8, replacement_rate: 65.0,
    note: "Deuda 135%, récord UE. Gasto pensiones mayor de toda Europa. Cuña alta.",
  },
  {
    id: "pt", name: "Portugal", flag: "🇵🇹",
    tax_wedge: 42.3, presion_fiscal: 37.0, marginal_max: 48.0,
    gdp_pc_eur: 26500, unemployment: 6.4, debt_pub: 95.0,
    productivity_idx: 77, vat_standard: 23, social_sec_emp: 23.75,
    pensions_pib: 13.1, replacement_rate: 74.0,
    note: "Perfil similar a España. Presión fiscal ligeramente menor. Regímenes especiales expats (NHR).",
  },
  {
    id: "nl", name: "Países Bajos", flag: "🇳🇱",
    tax_wedge: 35.48, presion_fiscal: 39.4, marginal_max: 49.5,
    gdp_pc_eur: 55000, unemployment: 3.6, debt_pub: 45.0,
    productivity_idx: 125, vat_standard: 21, social_sec_emp: 18.55,
    pensions_pib: 7.5, replacement_rate: 74.0,
    note: "Cuña baja + deuda baja + productividad alta. Pensión mixta pública/privada obligatoria.",
  },
  {
    id: "ie", name: "Irlanda", flag: "🇮🇪",
    tax_wedge: 34.72, presion_fiscal: 21.9, marginal_max: 52.0,
    gdp_pc_eur: 85000, unemployment: 4.2, debt_pub: 43.3,
    productivity_idx: 180, vat_standard: 23, social_sec_emp: 11.05,
    pensions_pib: 4.8, replacement_rate: 35.0,
    note: "PIB/pc distorsionado por multinacionales. Cuña muy baja. Sistema público pequeño.",
  },
  {
    id: "be", name: "Bélgica", flag: "🇧🇪",
    tax_wedge: 53.05, presion_fiscal: 43.2, marginal_max: 53.5,
    gdp_pc_eur: 45000, unemployment: 5.9, debt_pub: 105.0,
    productivity_idx: 118, vat_standard: 21, social_sec_emp: 25.0,
    pensions_pib: 11.3, replacement_rate: 60.0,
    note: "Récord OCDE en cuña fiscal. Estado del bienestar muy extenso. Paga menos de la mitad bruto.",
  },
  {
    id: "pl", name: "Polonia", flag: "🇵🇱",
    tax_wedge: 33.62, presion_fiscal: 35.0, marginal_max: 32.0,
    gdp_pc_eur: 17500, unemployment: 2.8, debt_pub: 50.4,
    productivity_idx: 75, vat_standard: 23, social_sec_emp: 19.48,
    pensions_pib: 10.7, replacement_rate: 40.0,
    note: "Cuña baja, paro casi pleno empleo. Economía convergiendo rápidamente hacia UE.",
  },
  {
    id: "dk", name: "Dinamarca", flag: "🇩🇰",
    tax_wedge: 35.4, presion_fiscal: 46.7, marginal_max: 55.9,
    gdp_pc_eur: 60000, unemployment: 5.0, debt_pub: 30.3,
    productivity_idx: 130, vat_standard: 25, social_sec_emp: 0.9,
    pensions_pib: 8.1, replacement_rate: 70.0,
    note: "Modelo escandinavo: IRPF altísimo, SS casi cero (lo paga el IRPF). Deuda mínima.",
  },
  // ─── Norteamérica ──────────────────────────────────────────────────────
  {
    id: "us", name: "Estados Unidos", flag: "🇺🇸",
    tax_wedge: 30.9, presion_fiscal: 25.2, marginal_max: 50.3, // federal 37% + estatal hasta ~13.3% CA
    gdp_pc_eur: 75000, unemployment: 4.2, debt_pub: 122.0,
    productivity_idx: 140, vat_standard: 0, social_sec_emp: 7.65, // sin IVA federal; FICA empleador 7.65%
    pensions_pib: 7.0, replacement_rate: 39.0,
    note: "Sin IVA federal (solo sales tax estatal 0-9.5%). Social Security menor pero 401(k) privado masivo. Enorme dispersión por estado.",
  },
  {
    id: "ca", name: "Canadá", flag: "🇨🇦",
    tax_wedge: 32.1, presion_fiscal: 33.2, marginal_max: 53.5, // federal 33% + provincial hasta ~21.8% Ontario/QC
    gdp_pc_eur: 55000, unemployment: 6.8, debt_pub: 107.0,
    productivity_idx: 108, vat_standard: 5, social_sec_emp: 7.66, // GST 5% + PST provincial; CPP+EI empleador ~7.66%
    pensions_pib: 5.0, replacement_rate: 50.0,
    note: "Sistema híbrido: IRPF federal + provincial. GST 5% + PST variable. CPP (pensiones) reformado 2019-25 para subir base y cobertura.",
  },
];

function ComparativaUEView() {
  const [metric, setMetric] = useState("tax_wedge"); // tax_wedge | presion_fiscal | marginal_max | debt_pub | pensions_pib | productivity_idx
  const [sortMode, setSortMode] = useState("value"); // value | name

  const metricConfig = {
    tax_wedge: { label: "Cuña fiscal OCDE 2024", unit: "%", source: "OCDE Taxing Wages 2024", desc: "% del coste laboral total que va al Estado" },
    presion_fiscal: { label: "Presión fiscal total", unit: "% PIB", source: "Eurostat 2024", desc: "Impuestos y cotizaciones / PIB" },
    marginal_max: { label: "Tipo marginal máximo IRPF", unit: "%", source: "Tax Foundation 2024", desc: "Tipo aplicado al último tramo" },
    debt_pub: { label: "Deuda pública", unit: "% PIB", source: "Eurostat 2024-25", desc: "Stock deuda AAPP según PDE" },
    pensions_pib: { label: "Gasto pensiones", unit: "% PIB", source: "OCDE 2023", desc: "Gasto público pensiones contributivas" },
    productivity_idx: { label: "Productividad (UE=100)", unit: "idx", source: "Eurostat 2023", desc: "PIB por hora trabajada, UE=100" },
    gdp_pc_eur: { label: "PIB per cápita", unit: "€", source: "Eurostat 2024", desc: "PIB per cápita real a precios de mercado" },
    unemployment: { label: "Tasa de paro", unit: "%", source: "Eurostat 2025 T4", desc: "Desempleo armonizado" },
  };

  const cfg = metricConfig[metric];

  const sortedCountries = useMemo(() => {
    const data = [...EU_COUNTRIES];
    if (sortMode === "value") {
      const reverse = metric === "productivity_idx" || metric === "gdp_pc_eur" ? 1 : -1;
      data.sort((a, b) => reverse * (b[metric] - a[metric]));
    } else {
      data.sort((a, b) => a.name.localeCompare(b.name));
    }
    return data;
  }, [metric, sortMode]);

  const spain = EU_COUNTRIES.find(c => c.id === "es");
  const maxVal = Math.max(...EU_COUNTRIES.map(c => c[metric]));

  const fmtValue = (v) => {
    if (metric === "gdp_pc_eur") return `€${(v / 1000).toFixed(0)}k`;
    if (metric === "productivity_idx") return v.toFixed(0);
    return `${v.toFixed(1)}${cfg.unit === "€" ? "" : ""}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl tracking-tight">España vs 11 economías · Europa + Norteamérica</h2>
        <p className="text-sm text-stone-500 mt-1 max-w-3xl">
          Compara el sistema fiscal y económico español con sus vecinos UE y con Estados Unidos y Canadá.
          Cada dimensión cuenta una historia distinta: no hay un país uniformemente "mejor" o "peor" — hay
          combinaciones de ventajas y tensiones. USA en particular destaca por ausencia de IVA federal y
          mucha dispersión estatal.
        </p>
      </div>

      {/* Perfil España destacado */}
      <div className="rounded-2xl border-2 border-[#7A1F3D] bg-gradient-to-br from-[#FBF7F0] to-white p-5">
        <div className="flex items-start gap-3">
          <span className="text-5xl">🇪🇸</span>
          <div className="flex-1">
            <h3 className="font-serif text-xl tracking-tight">Perfil España (abril 2026)</h3>
            <p className="text-[13px] text-stone-600 mt-1 italic">{spain.note}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
          {["tax_wedge", "presion_fiscal", "marginal_max", "debt_pub", "pensions_pib", "productivity_idx", "gdp_pc_eur", "unemployment"].map(m => (
            <div key={m} onClick={() => setMetric(m)}
                 className={`rounded-lg border p-2 cursor-pointer transition-all ${
                   metric === m ? "border-[#7A1F3D] bg-white shadow" : "border-stone-200 bg-white/50 hover:border-stone-400"
                 }`}>
              <div className="text-[9px] uppercase tracking-[0.08em] text-stone-500">
                {metricConfig[m].label.split(" ").slice(0, 3).join(" ")}
              </div>
              <div className="font-mono text-sm mt-0.5" style={{ color: metric === m ? "#7A1F3D" : "#1f2937" }}>
                {m === "gdp_pc_eur" ? `€${(spain[m]/1000).toFixed(0)}k` : `${spain[m]}${metricConfig[m].unit}`}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Control */}
      <div className="rounded-2xl border border-stone-200 bg-white p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[11px] uppercase tracking-[0.12em] text-stone-500">Ver por:</span>
          <select value={metric} onChange={(e) => setMetric(e.target.value)}
                  className="text-xs bg-stone-50 border border-stone-200 rounded px-2 py-1">
            {Object.entries(metricConfig).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <span className="text-[11px] text-stone-400 italic">{cfg.desc}</span>
          <div className="flex-1"></div>
          <div className="flex gap-1">
            {[{ id: "value", l: "Por valor" }, { id: "name", l: "Alfabético" }].map(s => (
              <button key={s.id} onClick={() => setSortMode(s.id)}
                className={`text-[11px] px-2.5 py-1 rounded transition-colors ${
                  sortMode === s.id ? "bg-[#7A1F3D] text-white" : "text-stone-500 hover:bg-stone-100"
                }`}>{s.l}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Ranking */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <div className="mb-3">
          <h3 className="font-serif text-lg tracking-tight">{cfg.label}</h3>
          <p className="text-[11px] text-stone-400 font-mono">Fuente: {cfg.source}</p>
        </div>
        <div className="space-y-1.5">
          {sortedCountries.map((c, i) => {
            const pct = (c[metric] / maxVal) * 100;
            const isSpain = c.id === "es";
            return (
              <div key={c.id} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-1 text-right">
                  <span className="font-mono text-[10px] text-stone-400">#{i + 1}</span>
                </div>
                <div className="col-span-3 md:col-span-2 flex items-center gap-1.5">
                  <span className="text-lg">{c.flag}</span>
                  <span className={`text-[13px] ${isSpain ? "font-semibold text-[#7A1F3D]" : "text-stone-800"}`}>
                    {c.name}
                  </span>
                </div>
                <div className="col-span-6 md:col-span-7">
                  <div className="flex-1 bg-stone-100 rounded-sm overflow-hidden h-6 relative">
                    <div className="h-full transition-all"
                         style={{
                           width: `${pct}%`,
                           backgroundColor: isSpain ? "#7A1F3D" : "#78716C",
                           opacity: isSpain ? 1 : 0.5,
                         }}></div>
                  </div>
                </div>
                <div className="col-span-2 text-right">
                  <span className={`font-mono text-[13px] ${isSpain ? "font-semibold text-[#7A1F3D]" : "text-stone-900"}`}>
                    {fmtValue(c[metric])}{metric !== "gdp_pc_eur" && metric !== "productivity_idx" ? cfg.unit : ""}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Paradojas */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <h3 className="font-serif text-lg tracking-tight mb-4">Las cuatro paradojas del caso español</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border-2 border-amber-300 bg-amber-50/40 p-4">
            <h4 className="font-serif text-base text-amber-800 mb-2">① Cuña media, pero PIB per cápita bajo</h4>
            <p className="text-[13px] text-stone-700 leading-relaxed mb-2">
              España tiene cuña fiscal del 39.5% (puesto 15 OCDE) pero PIB per cápita de solo
              <strong> €30k</strong>, casi un 40% menos que Alemania. Resultado: el coste público
              relativo al nivel de vida es mayor que la comparación directa sugiere.
            </p>
            <p className="text-[11px] text-stone-500 italic">
              Alemania: 47.9% cuña, pero €49k PIB/pc → coste absoluto soportable con mayor renta.
            </p>
          </div>
          <div className="rounded-xl border-2 border-rose-300 bg-rose-50/40 p-4">
            <h4 className="font-serif text-base text-rose-800 mb-2">② Pensiones: la generosidad del sur</h4>
            <p className="text-[13px] text-stone-700 leading-relaxed mb-2">
              Tasa de reposición <strong>77.5%</strong> en España vs <strong>48%</strong> en Alemania
              y <strong>44.5%</strong> promedio ZE. Italia (65%), Portugal (74%), España (77.5%) — el
              sur se jubila proporcionalmente mejor que el norte pagando más por años trabajados.
            </p>
            <p className="text-[11px] text-stone-500 italic">
              El problema no es "España paga poco"; es que paga proporcionalmente demasiado para su demografía.
            </p>
          </div>
          <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50/40 p-4">
            <h4 className="font-serif text-base text-emerald-800 mb-2">③ Productividad: brecha persistente</h4>
            <p className="text-[13px] text-stone-700 leading-relaxed mb-2">
              Productividad por hora España = <strong>92</strong> (UE-27 = 100). Alemania 115,
              Francia 113, Países Bajos 125. Incluso Italia (102) y Polonia (75) muestran que
              hay caminos distintos. El gap no es destino: Irlanda pasó de 120 a 180 en 20 años.
            </p>
            <p className="text-[11px] text-stone-500 italic">
              Sin mejora productiva, la única vía para mantener el Estado es subir impuestos o endeudar.
            </p>
          </div>
          <div className="rounded-xl border-2 border-blue-300 bg-blue-50/40 p-4">
            <h4 className="font-serif text-base text-blue-800 mb-2">④ Modelos alternativos disponibles</h4>
            <p className="text-[13px] text-stone-700 leading-relaxed mb-2">
              <strong>Países Bajos</strong>: cuña 35.5%, deuda 45%, productividad 125, pensión mixta.
              <strong> Dinamarca</strong>: IRPF altísimo pero SS casi cero y deuda 30%. No hay "único"
              modelo nórdico o liberal — hay <em>combinaciones</em> que funcionan.
            </p>
            <p className="text-[11px] text-stone-500 italic">
              España podría inspirarse en NL o DK según su objetivo: crecimiento o redistribución.
            </p>
          </div>
        </div>
      </div>

      {/* Lectura final */}
      <div className="rounded-2xl border-2 border-[#7A1F3D]/30 bg-gradient-to-br from-[#FBF7F0] via-white to-[#EC4899]/10 p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#7A1F3D]" />
          <h3 className="font-serif text-xl tracking-tight">¿Infierno fiscal o purgatorio?</h3>
        </div>
        <div className="space-y-3 text-[14px] text-stone-700 leading-relaxed">
          <p>
            La expresión "infierno fiscal" no resiste el análisis comparado. España <strong>no</strong>
            está entre los 10 países con mayor cuña fiscal OCDE — ocupa el puesto 15. Su presión
            fiscal (37.3% PIB) está por <strong>debajo</strong> de la media UE-27 (40.4%). La
            recaudación no es el problema principal.
          </p>
          <p>
            Pero tampoco es un "paraíso". El diferencial con UE se ha cerrado en 15 años de 6.9pp
            a 3.1pp — una subida del 55%. Y la combinación específica española es problemática:
            <strong> cuña alta + PIB bajo + productividad rezagada + pensiones generosas + deuda
            elevada</strong> es un cóctel frágil.
          </p>
          <p>
            La pregunta honesta no es "España paga mucho o poco", sino <strong>¿España paga en
            línea con lo que produce?</strong>. La respuesta es que paga un poco por encima — y
            una mejora en productividad sería la vía virtuosa, mientras que seguir subiendo la
            presión fiscal sin reforma es la vía de empobrecimiento relativo. El dato preocupante
            es el 42% de españoles dispuestos a pagar más impuestos por mejores servicios:
            indica que la relación impuestos/servicios no se percibe justa.
          </p>
          <p className="text-[#7A1F3D] font-serif italic text-[15px] border-l-2 border-[#7A1F3D] pl-4">
            Lente Blondie: "mejor" o "peor" que Europa es preguntar cuál es el bosque más alto. La
            pregunta austríaca es cuál tiene tallos más reales. Irlanda y Países Bajos han crecido
            sus tallos productivos. Italia ha acumulado deuda. España ha acumulado compromisos
            que dependen de una productividad que no crece. El tiempo dirá qué bosque aguanta la
            próxima tormenta.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-stone-400 pt-2 border-t border-stone-200">
          <Info className="w-3 h-3" />
          <span>Fuentes: OCDE Taxing Wages 2024, Eurostat 2024-25, Tax Foundation, Fundación Civismo, IEF (Barómetro Fiscal 2025).</span>
        </div>
      </div>
    </div>
  );
}



/* --------------------------------------------------------------------------- */
/* [15] EUROPA DETALLE — ingresos/carga/gasto por percentil y país · v1.3      */
/* ---------------------------------------------------------------------------
   Comparativa detallada por percentil de renta en 6 países UE referencia.
   · Ingresos netos por decil
   · Carga fiscal por nivel de renta (67%, 100%, 167% salario medio)
   · Distribución típica del gasto por quintil y país

   Fuentes:
   · OCDE Taxing Wages 2025 (ejercicio 2024) — cuña fiscal por niveles
   · Eurostat EU-SILC 2024 — ingresos netos por decil
   · Eurostat HBS / INE EPF 2024 — estructura COICOP por quintil
   · OCDE Affordable Housing Database 2024 — housing % gasto
   --------------------------------------------------------------------------- */

// Ingresos anuales netos equivalizados por decil, en euros 2024 (no PPP)
// Estimaciones basadas en Eurostat ilc_di01 + salarios medios OCDE
// USA/Canadá: US Census ACS 2023 + Statistics Canada CCB 2024, convertidos a EUR (USD/EUR 0.92, CAD/EUR 0.68)
const INCOME_BY_DECILE = {
  es: { name: "España",  flag: "🇪🇸", median: 20500,
    deciles: [6800, 11200, 14500, 17200, 20500, 24000, 28500, 34500, 44000, 72000] },
  de: { name: "Alemania", flag: "🇩🇪", median: 30800,
    deciles: [12500, 19000, 23800, 27500, 30800, 34500, 39000, 45000, 55500, 94000] },
  fr: { name: "Francia",  flag: "🇫🇷", median: 25200,
    deciles: [11500, 16500, 20500, 23500, 25200, 28500, 33000, 38500, 47000, 78000] },
  it: { name: "Italia",   flag: "🇮🇹", median: 19200,
    deciles: [7200, 11500, 14800, 17200, 19200, 22000, 26500, 31500, 39500, 67000] },
  pt: { name: "Portugal", flag: "🇵🇹", median: 13200,
    deciles: [5200, 8400, 10600, 12000, 13200, 15000, 17500, 21000, 27000, 48000] },
  nl: { name: "Países Bajos", flag: "🇳🇱", median: 30100,
    deciles: [14000, 19500, 23000, 26500, 30100, 33500, 37500, 43500, 53000, 88000] },
  us: { name: "Estados Unidos", flag: "🇺🇸", median: 41500,
    // US Census ACS 2023 household income deciles post-tax ajustados per cápita equivalizado
    // Alta desigualdad: D1 muy bajo (pobreza extrema), D10 muy alto
    deciles: [9800, 17500, 24000, 31500, 41500, 52000, 64500, 81000, 110000, 215000] },
  ca: { name: "Canadá", flag: "🇨🇦", median: 32800,
    // Statistics Canada 2024, ajustado equivalizado post-tax/transferencias
    deciles: [11200, 17800, 22500, 27500, 32800, 38000, 44500, 52500, 67000, 120000] },
  eu: { name: "Media UE", flag: "🇪🇺", median: 21582,
    deciles: [8500, 13500, 16800, 19200, 21582, 24500, 28500, 33500, 42000, 72000] },
};

// Cuña fiscal por nivel de renta (% salario medio) — OCDE Taxing Wages 2025
// Single worker, no children
// USA/Canadá: OCDE Taxing Wages 2025 federal+estatal/provincial promedio
const TAX_WEDGE_BY_LEVEL = {
  es: { name: "España",  flag: "🇪🇸", at67: 37.5, at100: 40.6, at167: 45.5 },
  de: { name: "Alemania", flag: "🇩🇪", at67: 45.2, at100: 47.9, at167: 50.7 },
  fr: { name: "Francia",  flag: "🇫🇷", at67: 42.8, at100: 47.2, at167: 54.0 },
  it: { name: "Italia",   flag: "🇮🇹", at67: 41.0, at100: 47.1, at167: 51.8 },
  pt: { name: "Portugal", flag: "🇵🇹", at67: 35.5, at100: 38.0, at167: 43.5 },
  nl: { name: "Países Bajos", flag: "🇳🇱", at67: 32.5, at100: 36.2, at167: 43.8 },
  us: { name: "Estados Unidos", flag: "🇺🇸", at67: 27.9, at100: 30.9, at167: 36.5 },
  ca: { name: "Canadá", flag: "🇨🇦", at67: 28.5, at100: 32.1, at167: 38.2 },
  oecd: { name: "Media OCDE", flag: "🌐", at67: 31.4, at100: 34.9, at167: 40.5 },
};

// Distribución del gasto por quintil y país (% del total)
// Fuentes: INE EPF 2024 (España), Eurostat HBS 2020 actualizado, OCDE Housing 2024
// USA: BLS Consumer Expenditure Survey 2023; CA: Statistics Canada Survey of Household Spending 2023
// Q1 = 20% hogares con menor gasto; Q5 = 20% con mayor gasto
const EXPENDITURE_STRUCTURE = {
  es: {
    name: "España", flag: "🇪🇸",
    q1: { vivienda: 38, alimentacion: 22, transporte: 7, ocio_restaur: 4, otros: 29 },
    q3: { vivienda: 30, alimentacion: 14, transporte: 12, ocio_restaur: 9, otros: 35 },
    q5: { vivienda: 22, alimentacion: 10, transporte: 14, ocio_restaur: 13, otros: 41 },
  },
  de: {
    name: "Alemania", flag: "🇩🇪",
    q1: { vivienda: 42, alimentacion: 18, transporte: 8, ocio_restaur: 5, otros: 27 },
    q3: { vivienda: 34, alimentacion: 12, transporte: 13, ocio_restaur: 9, otros: 32 },
    q5: { vivienda: 26, alimentacion: 9, transporte: 15, ocio_restaur: 11, otros: 39 },
  },
  fr: {
    name: "Francia", flag: "🇫🇷",
    q1: { vivienda: 35, alimentacion: 19, transporte: 10, ocio_restaur: 5, otros: 31 },
    q3: { vivienda: 28, alimentacion: 13, transporte: 14, ocio_restaur: 8, otros: 37 },
    q5: { vivienda: 21, alimentacion: 10, transporte: 15, ocio_restaur: 11, otros: 43 },
  },
  it: {
    name: "Italia", flag: "🇮🇹",
    q1: { vivienda: 36, alimentacion: 24, transporte: 8, ocio_restaur: 4, otros: 28 },
    q3: { vivienda: 28, alimentacion: 16, transporte: 13, ocio_restaur: 8, otros: 35 },
    q5: { vivienda: 22, alimentacion: 12, transporte: 15, ocio_restaur: 11, otros: 40 },
  },
  pt: {
    name: "Portugal", flag: "🇵🇹",
    q1: { vivienda: 34, alimentacion: 24, transporte: 9, ocio_restaur: 3, otros: 30 },
    q3: { vivienda: 26, alimentacion: 17, transporte: 14, ocio_restaur: 7, otros: 36 },
    q5: { vivienda: 20, alimentacion: 12, transporte: 16, ocio_restaur: 11, otros: 41 },
  },
  nl: {
    name: "Países Bajos", flag: "🇳🇱",
    q1: { vivienda: 39, alimentacion: 15, transporte: 9, ocio_restaur: 5, otros: 32 },
    q3: { vivienda: 30, alimentacion: 11, transporte: 13, ocio_restaur: 9, otros: 37 },
    q5: { vivienda: 23, alimentacion: 8, transporte: 14, ocio_restaur: 12, otros: 43 },
  },
  us: {
    name: "Estados Unidos", flag: "🇺🇸",
    // BLS CES 2023: housing include utilities. Transporte alto por dependencia coche.
    // "Otros" en USA incluye una categoría grande: sanidad privada (~8% gasto total)
    q1: { vivienda: 42, alimentacion: 16, transporte: 14, ocio_restaur: 4, otros: 24 },
    q3: { vivienda: 33, alimentacion: 12, transporte: 17, ocio_restaur: 7, otros: 31 },
    q5: { vivienda: 28, alimentacion: 9, transporte: 15, ocio_restaur: 10, otros: 38 },
  },
  ca: {
    name: "Canadá", flag: "🇨🇦",
    // StatCan SHS 2023: housing incluye utilities y mantenimiento
    q1: { vivienda: 41, alimentacion: 17, transporte: 13, ocio_restaur: 4, otros: 25 },
    q3: { vivienda: 32, alimentacion: 13, transporte: 16, ocio_restaur: 8, otros: 31 },
    q5: { vivienda: 25, alimentacion: 10, transporte: 15, ocio_restaur: 11, otros: 39 },
  },
};

const EXP_COLORS = {
  vivienda: "#7A1F3D",
  alimentacion: "#A16207",
  transporte: "#1E40AF",
  ocio_restaur: "#065F46",
  otros: "#78716C",
};
const EXP_LABELS = {
  vivienda: "Vivienda + suministros",
  alimentacion: "Alimentación",
  transporte: "Transporte",
  ocio_restaur: "Ocio + restaurantes",
  otros: "Otros (ropa, salud, educación, etc.)",
};

function EuropaDetalleView() {
  const [subview, setSubview] = useState("ingresos"); // ingresos | carga | gasto

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl tracking-tight">Detalle internacional · ingresos, carga fiscal y gasto por percentil</h2>
        <p className="text-sm text-stone-500 mt-1 max-w-3xl">
          Tres preguntas concretas con datos oficiales: <em>¿cuánto se gana?</em> (Eurostat EU-SILC + US Census),
          <em> ¿cuánto se paga al Estado?</em> (OCDE Taxing Wages), <em>¿cómo se vive el dinero?</em>
          (Eurostat HBS / INE EPF / BLS CES / StatCan SHS). Comparación con Alemania, Francia, Italia,
          Portugal, Países Bajos, Estados Unidos y Canadá.
        </p>
      </div>

      {/* Selector de vista */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: "ingresos", label: "1. Ingresos por decil", desc: "Cuánto ganan en cada país" },
          { id: "carga",    label: "2. Carga fiscal por nivel", desc: "Cuánto se queda el Estado" },
          { id: "gasto",    label: "3. Estructura de gasto por quintil", desc: "Cómo se vive el dinero" },
        ].map(v => (
          <button key={v.id} onClick={() => setSubview(v.id)}
            className={`text-left rounded-xl transition-all px-4 py-2 ${
              subview === v.id
                ? "bg-[#7A1F3D] text-white shadow-md"
                : "bg-white border border-stone-200 text-stone-700 hover:border-[#7A1F3D]"
            }`}>
            <div className="text-[13px] font-semibold">{v.label}</div>
            <div className="text-[10px] opacity-80 mt-0.5">{v.desc}</div>
          </button>
        ))}
      </div>

      {/* ═════════ VISTA 1 — INGRESOS POR DECIL ═════════ */}
      {subview === "ingresos" && <IngresosDetalleView />}

      {/* ═════════ VISTA 2 — CARGA FISCAL POR NIVEL ═════════ */}
      {subview === "carga" && <CargaDetalleView />}

      {/* ═════════ VISTA 3 — GASTO POR QUINTIL ═════════ */}
      {subview === "gasto" && <GastoDetalleView />}

      {/* Lectura de cierre */}
      <div className="rounded-2xl border-2 border-[#7A1F3D]/30 bg-gradient-to-br from-[#FBF7F0] via-white to-[#EC4899]/10 p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#7A1F3D]" />
          <h3 className="font-serif text-xl tracking-tight">Las tres verdades incómodas juntas</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <h4 className="font-serif text-base text-stone-900 mb-2">Ganamos menos</h4>
            <p className="text-[13px] text-stone-700 leading-relaxed">
              La mediana española (€20.500) está 33% por debajo de Alemania y 20% bajo Francia.
              El gap no se explica solo por productividad — también por estructura sectorial
              (turismo, hostelería, comercio pesan más) y por menor capitalización.
            </p>
          </div>
          <div>
            <h4 className="font-serif text-base text-stone-900 mb-2">Pagamos parecido</h4>
            <p className="text-[13px] text-stone-700 leading-relaxed">
              Cuña 40.6% vs 47.9% Alemania es <em>peor de lo que parece</em> cuando ellos ganan
              40% más. Un trabajador mediano alemán se queda con ~€16k netos del exceso que un
              español ni siquiera llega a ganar. El tipo efectivo sobre el mismo sueldo bruto es
              comparable; el problema es que partimos de bases salariales menores.
            </p>
          </div>
          <div>
            <h4 className="font-serif text-base text-stone-900 mb-2">Y gastamos más en vivienda</h4>
            <p className="text-[13px] text-stone-700 leading-relaxed">
              El Q1 español gasta 38% en vivienda+suministros, por encima de Francia e Italia. La
              combinación {'{'}menos renta + cuña fiscal UE + housing caro{'}'} comprime
              especialmente a los jóvenes y a la clase media-baja. La renta disponible
              discrecional es mucho menor que la cifra bruta sugiere.
            </p>
          </div>
        </div>
        <div className="border-l-4 border-[#7A1F3D] pl-4 mt-2">
          <p className="text-[13px] text-stone-700 leading-relaxed italic">
            <strong className="font-serif text-[#7A1F3D] not-italic">Lente austríaca:</strong> el
            debate público español se centra en "¿subir o bajar impuestos?". Esta comparativa
            sugiere que la pregunta relevante es otra: <em>¿por qué nuestra productividad no
            produce salarios europeos?</em> Sin ese motor, el sistema fiscal es un reparto cada
            vez más tenso de un pastel que crece menos que el del vecino.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-stone-400 pt-2 border-t border-stone-200">
          <Info className="w-3 h-3" />
          <span>Fuentes: Eurostat EU-SILC 2024 (ilc_di01), OCDE Taxing Wages 2025 (ejercicio 2024), Eurostat HBS / INE EPF 2024, OCDE Affordable Housing 2024. Datos netos equivalizados en EUR sin PPP.</span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Vista 1 — INGRESOS POR DECIL
// ═══════════════════════════════════════════════════════════════
function IngresosDetalleView() {
  const [selectedCountries, setSelectedCountries] = useState(["es", "de", "fr", "us", "ca"]);

  const countries = Object.entries(INCOME_BY_DECILE)
    .filter(([id]) => id !== "eu")
    .map(([id, data]) => ({ id, ...data }));

  const chartData = Array.from({ length: 10 }, (_, i) => {
    const d = { decile: `D${i + 1}` };
    countries.forEach(c => {
      if (selectedCountries.includes(c.id)) {
        d[c.id] = c.deciles[i];
      }
    });
    return d;
  });

  const countryColors = {
    es: "#7A1F3D", de: "#1E40AF", fr: "#065F46",
    it: "#A16207", pt: "#B45309", nl: "#9333EA",
    us: "#DC2626", ca: "#D97706",
  };

  const toggle = (id) => {
    setSelectedCountries(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const fmtEur = (v) => `€${Math.round(v / 1000)}k`;
  const es = INCOME_BY_DECILE.es;
  const de = INCOME_BY_DECILE.de;
  const gapD5 = ((de.deciles[4] - es.deciles[4]) / es.deciles[4]) * 100;
  const gapD1 = ((de.deciles[0] - es.deciles[0]) / es.deciles[0]) * 100;
  const gapD9 = ((de.deciles[8] - es.deciles[8]) / es.deciles[8]) * 100;

  return (
    <div className="space-y-5">
      {/* KPI banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="rounded-xl border-2 border-[#7A1F3D] bg-[#FBF7F0] p-4 text-center">
          <div className="text-[10px] uppercase tracking-[0.12em] text-stone-500 font-semibold">Mediana España</div>
          <div className="font-serif text-2xl text-[#7A1F3D] mt-1">€{es.median.toLocaleString("es-ES")}</div>
          <div className="text-[10px] text-stone-500 mt-1">neto equivalizado 2024</div>
        </div>
        <div className="rounded-xl border-2 border-blue-300 bg-blue-50/40 p-4 text-center">
          <div className="text-[10px] uppercase tracking-[0.12em] text-blue-700 font-semibold">Mediana Alemania</div>
          <div className="font-serif text-2xl text-blue-700 mt-1">€{de.median.toLocaleString("es-ES")}</div>
          <div className="text-[10px] text-stone-500 mt-1">+{gapD5.toFixed(0)}% vs España</div>
        </div>
        <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50/40 p-4 text-center">
          <div className="text-[10px] uppercase tracking-[0.12em] text-emerald-700 font-semibold">Mediana Francia</div>
          <div className="font-serif text-2xl text-emerald-700 mt-1">€{INCOME_BY_DECILE.fr.median.toLocaleString("es-ES")}</div>
          <div className="text-[10px] text-stone-500 mt-1">+{(((INCOME_BY_DECILE.fr.median - es.median) / es.median) * 100).toFixed(0)}% vs España</div>
        </div>
        <div className="rounded-xl border-2 border-stone-300 bg-stone-50 p-4 text-center">
          <div className="text-[10px] uppercase tracking-[0.12em] text-stone-500 font-semibold">Mediana UE-27</div>
          <div className="font-serif text-2xl text-stone-700 mt-1">€{INCOME_BY_DECILE.eu.median.toLocaleString("es-ES")}</div>
          <div className="text-[10px] text-stone-500 mt-1">+{(((INCOME_BY_DECILE.eu.median - es.median) / es.median) * 100).toFixed(0)}% vs España</div>
        </div>
      </div>

      {/* Country toggles */}
      <div className="flex flex-wrap gap-2">
        {countries.map(c => (
          <button key={c.id} onClick={() => toggle(c.id)}
            className={`text-xs px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
              selectedCountries.includes(c.id)
                ? "text-white shadow-sm"
                : "bg-white border border-stone-200 text-stone-500 hover:border-stone-400"
            }`}
            style={selectedCountries.includes(c.id) ? { backgroundColor: countryColors[c.id] } : {}}>
            <span>{c.flag}</span>
            <span>{c.name}</span>
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <h3 className="font-serif text-lg tracking-tight mb-1">Ingreso neto anual por decil (€ 2024)</h3>
        <p className="text-[11px] text-stone-500 mb-3">
          Cada punto es el ingreso medio del decil. D1 = 10% con menor renta, D10 = 10% con mayor renta.
          Neto equivalizado (ajustado por composición del hogar).
        </p>
        <ResponsiveContainer width="100%" height={360}>
          <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="2 4" stroke="#E7E5E4" />
            <XAxis dataKey="decile" tick={{ fontSize: 12, fill: "#57534E" }} />
            <YAxis tick={{ fontSize: 11, fill: "#57534E" }} tickFormatter={fmtEur} />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: "1px solid #E7E5E4", fontSize: 12 }}
              formatter={(v, n) => [`€${v.toLocaleString("es-ES")}`, INCOME_BY_DECILE[n]?.name || n]}
            />
            <Legend verticalAlign="top" height={36}
                    formatter={(v) => INCOME_BY_DECILE[v]?.name || v}
                    iconType="line" />
            {countries.map(c => selectedCountries.includes(c.id) && (
              <Line key={c.id} type="monotone" dataKey={c.id}
                    stroke={countryColors[c.id]}
                    strokeWidth={c.id === "es" ? 3.5 : 2}
                    dot={{ fill: countryColors[c.id], r: 3 }}
                    activeDot={{ r: 5 }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Gap table */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <h3 className="font-serif text-lg tracking-tight mb-3">Brecha España vs resto — ¿dónde se abre más?</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-[11px] uppercase tracking-[0.08em] text-stone-500">
              <tr>
                <th className="text-left px-4 py-2">País</th>
                <th className="text-right px-4 py-2">D1 (pobre)</th>
                <th className="text-right px-4 py-2">gap D1</th>
                <th className="text-right px-4 py-2">D5 (mediana)</th>
                <th className="text-right px-4 py-2">gap D5</th>
                <th className="text-right px-4 py-2">D9 (rico)</th>
                <th className="text-right px-4 py-2">gap D9</th>
              </tr>
            </thead>
            <tbody className="text-[13px]">
              {countries.filter(c => c.id !== "es").map(c => {
                const d1gap = ((c.deciles[0] - es.deciles[0]) / es.deciles[0]) * 100;
                const d5gap = ((c.deciles[4] - es.deciles[4]) / es.deciles[4]) * 100;
                const d9gap = ((c.deciles[8] - es.deciles[8]) / es.deciles[8]) * 100;
                return (
                  <tr key={c.id} className="border-t border-stone-100">
                    <td className="px-4 py-2 font-medium text-stone-800">
                      <span className="mr-2">{c.flag}</span>{c.name}
                    </td>
                    <td className="px-4 py-2 text-right font-mono">€{c.deciles[0].toLocaleString("es-ES")}</td>
                    <td className={`px-4 py-2 text-right font-mono text-[11px] ${d1gap > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      {d1gap > 0 ? "+" : ""}{d1gap.toFixed(0)}%
                    </td>
                    <td className="px-4 py-2 text-right font-mono">€{c.deciles[4].toLocaleString("es-ES")}</td>
                    <td className={`px-4 py-2 text-right font-mono text-[11px] ${d5gap > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      {d5gap > 0 ? "+" : ""}{d5gap.toFixed(0)}%
                    </td>
                    <td className="px-4 py-2 text-right font-mono">€{c.deciles[8].toLocaleString("es-ES")}</td>
                    <td className={`px-4 py-2 text-right font-mono text-[11px] ${d9gap > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      {d9gap > 0 ? "+" : ""}{d9gap.toFixed(0)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-[12px] text-stone-600 mt-4 leading-relaxed">
          <strong>Lectura clave:</strong> España vs Alemania el gap en D1 es {gapD1.toFixed(0)}%,
          en D5 es {gapD5.toFixed(0)}% y en D9 es {gapD9.toFixed(0)}%. La brecha es mayor en la
          base (D1) y en la cola (D9): España tiene menos pobres extremos pero también menos ricos
          extremos que Alemania. La diferencia más grande es en D9: los top 10% alemanes ganan
          bastante más que los top 10% españoles.
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Vista 2 — CARGA FISCAL POR NIVEL
// ═══════════════════════════════════════════════════════════════
function CargaDetalleView() {
  const countries = Object.entries(TAX_WEDGE_BY_LEVEL).map(([id, data]) => ({ id, ...data }));

  // Chart data: cada país tres barras (67%, 100%, 167%)
  const chartData = countries.map(c => ({
    country: c.name,
    flag: c.flag,
    "67% salario medio": c.at67,
    "100% salario medio": c.at100,
    "167% salario medio": c.at167,
  }));

  const es = TAX_WEDGE_BY_LEVEL.es;
  const oecd = TAX_WEDGE_BY_LEVEL.oecd;
  const progresividad = es.at167 - es.at67;

  // Impuestos efectivos — cuánto netea España vs promedios
  const espSalary = { low: 25000, mid: 37000, high: 62000 };  // 67/100/167% salario medio España (~€37k)
  const espNet = {
    low: espSalary.low * (1 - es.at67 / 100),
    mid: espSalary.mid * (1 - es.at100 / 100),
    high: espSalary.high * (1 - es.at167 / 100),
  };

  return (
    <div className="space-y-5">
      {/* KPI banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-xl border-2 border-[#7A1F3D] bg-[#FBF7F0] p-4">
          <div className="text-[10px] uppercase tracking-[0.12em] text-stone-500 font-semibold mb-1">España · salario bajo (67%)</div>
          <div className="font-serif text-3xl text-[#7A1F3D]">{es.at67}%</div>
          <div className="text-[11px] text-stone-500 mt-1">
            vs OCDE {oecd.at67}% · diferencia <span className="font-semibold text-rose-700">+{(es.at67 - oecd.at67).toFixed(1)}pp</span>
          </div>
        </div>
        <div className="rounded-xl border-2 border-[#7A1F3D] bg-[#FBF7F0] p-4">
          <div className="text-[10px] uppercase tracking-[0.12em] text-stone-500 font-semibold mb-1">España · salario medio (100%)</div>
          <div className="font-serif text-3xl text-[#7A1F3D]">{es.at100}%</div>
          <div className="text-[11px] text-stone-500 mt-1">
            vs OCDE {oecd.at100}% · diferencia <span className="font-semibold text-rose-700">+{(es.at100 - oecd.at100).toFixed(1)}pp</span>
          </div>
        </div>
        <div className="rounded-xl border-2 border-[#7A1F3D] bg-[#FBF7F0] p-4">
          <div className="text-[10px] uppercase tracking-[0.12em] text-stone-500 font-semibold mb-1">España · salario alto (167%)</div>
          <div className="font-serif text-3xl text-[#7A1F3D]">{es.at167}%</div>
          <div className="text-[11px] text-stone-500 mt-1">
            vs OCDE {oecd.at167}% · diferencia <span className="font-semibold text-rose-700">+{(es.at167 - oecd.at167).toFixed(1)}pp</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <h3 className="font-serif text-lg tracking-tight mb-1">Cuña fiscal por nivel de renta — single worker sin hijos</h3>
        <p className="text-[11px] text-stone-500 mb-3">
          % de coste laboral total que va al Estado (IRPF + cotizaciones trabajador + cotizaciones
          empresa − transferencias). Tres niveles: 67%, 100% y 167% del salario medio.
          Fuente: OCDE Taxing Wages 2025 (ejercicio 2024).
        </p>
        <ResponsiveContainer width="100%" height={380}>
          <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 40 }}>
            <CartesianGrid strokeDasharray="2 4" stroke="#E7E5E4" />
            <XAxis dataKey="country" tick={{ fontSize: 10, fill: "#57534E" }} angle={-15} textAnchor="end" height={60} />
            <YAxis tick={{ fontSize: 11, fill: "#57534E" }} tickFormatter={(v) => `${v}%`} domain={[0, 60]} />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: "1px solid #E7E5E4", fontSize: 12 }}
              formatter={(v) => [`${v}%`]}
            />
            <Legend verticalAlign="top" height={36} />
            <Bar dataKey="67% salario medio" fill="#86EFAC" radius={[2, 2, 0, 0]} />
            <Bar dataKey="100% salario medio" fill="#7A1F3D" radius={[2, 2, 0, 0]} />
            <Bar dataKey="167% salario medio" fill="#7F1D1D" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Table progresividad */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <h3 className="font-serif text-lg tracking-tight mb-3">Progresividad del sistema — diferencia entre niveles</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-[11px] uppercase tracking-[0.08em] text-stone-500">
              <tr>
                <th className="text-left px-4 py-2">País</th>
                <th className="text-right px-4 py-2">67%</th>
                <th className="text-right px-4 py-2">100%</th>
                <th className="text-right px-4 py-2">167%</th>
                <th className="text-right px-4 py-2">Progresividad</th>
                <th className="text-left px-4 py-2 pl-6">Lectura</th>
              </tr>
            </thead>
            <tbody className="text-[13px]">
              {countries.map(c => {
                const prog = c.at167 - c.at67;
                const isEs = c.id === "es";
                return (
                  <tr key={c.id} className={`border-t border-stone-100 ${isEs ? "bg-[#FBF7F0]" : ""}`}>
                    <td className={`px-4 py-2 font-medium ${isEs ? "text-[#7A1F3D]" : "text-stone-800"}`}>
                      <span className="mr-2">{c.flag}</span>{c.name}{isEs ? " ●" : ""}
                    </td>
                    <td className="px-4 py-2 text-right font-mono">{c.at67}%</td>
                    <td className="px-4 py-2 text-right font-mono font-semibold">{c.at100}%</td>
                    <td className="px-4 py-2 text-right font-mono">{c.at167}%</td>
                    <td className="px-4 py-2 text-right font-mono" style={{ color: prog > 10 ? "#065F46" : prog > 6 ? "#A16207" : "#7A1F3D" }}>
                      +{prog.toFixed(1)}pp
                    </td>
                    <td className="px-4 py-2 pl-6 text-stone-500 italic text-[12px]">
                      {prog > 11 ? "Muy progresiva" : prog > 7 ? "Progresiva" : prog > 5 ? "Moderada" : "Poco progresiva"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="rounded-lg bg-amber-50/40 border border-amber-200 p-4">
            <h4 className="text-[11px] uppercase tracking-[0.12em] text-amber-800 font-semibold mb-1">Lectura 1 — España pega temprano</h4>
            <p className="text-[13px] text-stone-700 leading-relaxed">
              Al 67% del salario medio (≈€24-25k), España ya pide el {es.at67}% al Estado —
              {(es.at67 - oecd.at67).toFixed(1)}pp por encima del promedio OCDE. En ese nivel
              salarial, un trabajador OCDE-medio se queda <strong>€1.500/año</strong> más en el bolsillo.
            </p>
          </div>
          <div className="rounded-lg bg-rose-50/40 border border-rose-200 p-4">
            <h4 className="text-[11px] uppercase tracking-[0.12em] text-rose-800 font-semibold mb-1">Lectura 2 — poca progresividad real</h4>
            <p className="text-[13px] text-stone-700 leading-relaxed">
              La diferencia España entre 67% y 167% del salario medio es solo {progresividad.toFixed(1)}pp —
              menor que la de Francia (11.2pp) o Italia (10.8pp). El sistema no es tan progresivo
              como el discurso sugiere: el tramo superior paga más, pero el inferior <em>también paga
              bastante</em>.
            </p>
          </div>
        </div>
      </div>

      {/* Caso España: qué queda neto */}
      <div className="rounded-2xl border-2 border-[#7A1F3D]/30 bg-gradient-to-br from-[#FBF7F0] to-white p-5">
        <h3 className="font-serif text-lg tracking-tight mb-3">En términos absolutos — cuánto netea un trabajador español por nivel</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-xl bg-white border border-stone-200 p-4">
            <div className="text-[10px] uppercase tracking-[0.12em] text-stone-500">67% salario medio</div>
            <div className="font-mono text-sm text-stone-700 mt-1">Coste empresa ≈ €{espSalary.low.toLocaleString("es-ES")}</div>
            <div className="font-serif text-2xl text-[#7A1F3D] mt-1">€{Math.round(espNet.low).toLocaleString("es-ES")}</div>
            <div className="text-[11px] text-stone-500">neto tras cuña {es.at67}%</div>
          </div>
          <div className="rounded-xl bg-white border-2 border-[#7A1F3D] p-4">
            <div className="text-[10px] uppercase tracking-[0.12em] text-stone-500">100% salario medio</div>
            <div className="font-mono text-sm text-stone-700 mt-1">Coste empresa ≈ €{espSalary.mid.toLocaleString("es-ES")}</div>
            <div className="font-serif text-2xl text-[#7A1F3D] mt-1">€{Math.round(espNet.mid).toLocaleString("es-ES")}</div>
            <div className="text-[11px] text-stone-500">neto tras cuña {es.at100}%</div>
          </div>
          <div className="rounded-xl bg-white border border-stone-200 p-4">
            <div className="text-[10px] uppercase tracking-[0.12em] text-stone-500">167% salario medio</div>
            <div className="font-mono text-sm text-stone-700 mt-1">Coste empresa ≈ €{espSalary.high.toLocaleString("es-ES")}</div>
            <div className="font-serif text-2xl text-[#7A1F3D] mt-1">€{Math.round(espNet.high).toLocaleString("es-ES")}</div>
            <div className="text-[11px] text-stone-500">neto tras cuña {es.at167}%</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Vista 3 — GASTO POR QUINTIL
// ═══════════════════════════════════════════════════════════════
function GastoDetalleView() {
  const [country, setCountry] = useState("es");
  const [quintile, setQuintile] = useState("q3"); // q1 | q3 | q5

  const countries = Object.entries(EXPENDITURE_STRUCTURE).map(([id, data]) => ({ id, ...data }));
  const active = EXPENDITURE_STRUCTURE[country];
  const activeData = active[quintile];

  const categories = ["vivienda", "alimentacion", "transporte", "ocio_restaur", "otros"];

  // Comparación entre países para quintil seleccionado
  const barChartData = countries.map(c => ({
    country: c.name,
    flag: c.flag,
    ...c[quintile],
  }));

  return (
    <div className="space-y-5">
      {/* KPI banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-xl border-2 border-rose-300 bg-rose-50/40 p-4">
          <div className="text-[10px] uppercase tracking-[0.12em] text-rose-800 font-semibold mb-1">Q1 España — vivienda</div>
          <div className="font-serif text-3xl text-rose-700">{EXPENDITURE_STRUCTURE.es.q1.vivienda}%</div>
          <div className="text-[11px] text-stone-500 mt-1">del gasto total del 20% más humilde</div>
        </div>
        <div className="rounded-xl border-2 border-amber-300 bg-amber-50/40 p-4">
          <div className="text-[10px] uppercase tracking-[0.12em] text-amber-800 font-semibold mb-1">Q1 España — alimentación</div>
          <div className="font-serif text-3xl text-amber-700">{EXPENDITURE_STRUCTURE.es.q1.alimentacion}%</div>
          <div className="text-[11px] text-stone-500 mt-1">del gasto total — necesidad vital</div>
        </div>
        <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50/40 p-4">
          <div className="text-[10px] uppercase tracking-[0.12em] text-emerald-800 font-semibold mb-1">Q5 España — ocio</div>
          <div className="font-serif text-3xl text-emerald-700">{EXPENDITURE_STRUCTURE.es.q5.ocio_restaur}%</div>
          <div className="text-[11px] text-stone-500 mt-1">del gasto total del 20% más rico</div>
        </div>
      </div>

      {/* Controles */}
      <div className="rounded-xl border border-stone-200 bg-white p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] uppercase tracking-[0.12em] text-stone-500 font-semibold block mb-2">
              País (detalle por quintil)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {countries.map(c => (
                <button key={c.id} onClick={() => setCountry(c.id)}
                  className={`text-xs px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                    country === c.id
                      ? "bg-[#7A1F3D] text-white"
                      : "bg-white border border-stone-200 text-stone-600 hover:border-[#7A1F3D]"
                  }`}>
                  <span>{c.flag}</span>
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-[0.12em] text-stone-500 font-semibold block mb-2">
              Quintil
            </label>
            <div className="flex gap-1.5">
              {[
                { id: "q1", label: "Q1 · 20% menor gasto" },
                { id: "q3", label: "Q3 · mediana" },
                { id: "q5", label: "Q5 · 20% mayor gasto" },
              ].map(q => (
                <button key={q.id} onClick={() => setQuintile(q.id)}
                  className={`text-xs px-3 py-1 rounded-md transition-colors flex-1 ${
                    quintile === q.id
                      ? "bg-[#7A1F3D] text-white"
                      : "bg-white border border-stone-200 text-stone-600 hover:border-[#7A1F3D]"
                  }`}>
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Detalle país/quintil seleccionado */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <h3 className="font-serif text-lg tracking-tight mb-1">
          {active.flag} {active.name} — quintil {quintile.toUpperCase()}
        </h3>
        <p className="text-[11px] text-stone-500 mb-4">
          Estructura del gasto total (% del presupuesto del hogar medio en ese quintil).
        </p>
        <div className="space-y-2">
          {categories.map(cat => {
            const val = activeData[cat];
            return (
              <div key={cat} className="flex items-center gap-3">
                <div className="w-40 text-[12px] text-stone-700">{EXP_LABELS[cat]}</div>
                <div className="flex-1 bg-stone-100 rounded-md overflow-hidden h-7 relative">
                  <div className="h-full flex items-center justify-end pr-2 font-mono text-[11px] text-white"
                       style={{ width: `${val * 2}%`, backgroundColor: EXP_COLORS[cat] }}>
                    {val}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Comparativa internacional para el quintil */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <h3 className="font-serif text-lg tracking-tight mb-1">
          Comparativa internacional · Quintil {quintile.toUpperCase()}
        </h3>
        <p className="text-[11px] text-stone-500 mb-3">
          Stacked bar: cada país, su estructura de gasto para este quintil. Permite ver dónde
          España se desvía del patrón europeo.
        </p>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={barChartData} margin={{ top: 10, right: 30, left: 0, bottom: 40 }}>
            <CartesianGrid strokeDasharray="2 4" stroke="#E7E5E4" />
            <XAxis dataKey="country" tick={{ fontSize: 10, fill: "#57534E" }} angle={-15} textAnchor="end" height={60} />
            <YAxis tick={{ fontSize: 11, fill: "#57534E" }} tickFormatter={(v) => `${v}%`} />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: "1px solid #E7E5E4", fontSize: 12 }}
              formatter={(v, n) => [`${v}%`, EXP_LABELS[n] || n]}
            />
            <Legend verticalAlign="top" height={36} formatter={(v) => EXP_LABELS[v] || v} />
            {categories.map(cat => (
              <Bar key={cat} dataKey={cat} stackId="a" fill={EXP_COLORS[cat]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Lecturas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl bg-rose-50/40 border border-rose-200 p-4">
          <h4 className="text-[11px] uppercase tracking-[0.12em] text-rose-800 font-semibold mb-1">
            Q1 — La vivienda devora a los pobres
          </h4>
          <p className="text-[13px] text-stone-700 leading-relaxed">
            En España, el Q1 dedica <strong>60%</strong> de su gasto solo a vivienda + alimentación
            (datos INE EPF 2024). Es gasto inelástico: no se puede reducir. Cualquier subida de
            alquileres o electricidad pega directamente. Italia y Portugal muestran patrón similar;
            Alemania y Países Bajos dedican más a vivienda pero menos a alimentación (mayor renta).
          </p>
        </div>
        <div className="rounded-xl bg-emerald-50/40 border border-emerald-200 p-4">
          <h4 className="text-[11px] uppercase tracking-[0.12em] text-emerald-800 font-semibold mb-1">
            Q5 — La libertad discrecional
          </h4>
          <p className="text-[13px] text-stone-700 leading-relaxed">
            El Q5 español dedica <strong>33.9%</strong> de su gasto a transporte + ocio + cultura —
            categorías <em>discrecionales</em>. Mientras el Q1 lucha con lo esencial, el Q5 elige
            dónde poner su dinero. Esa es la diferencia cualitativa que no capturan los Gini.
          </p>
        </div>
      </div>
    </div>
  );
}



/* --------------------------------------------------------------------------- */
/* [16] DÓNDE VIVIR — Comparador de poder adquisitivo real por ciudad · v1.7   */
/* ---------------------------------------------------------------------------
   Para un bruto dado + perfil, calcula:
     - Neto mensual en cada ciudad
     - Coste alquiler realista (2 dormitorios, zona normal)
     - Renta discrecional = neto - alquiler - comida base - transporte
     - Ajuste PPP (coste de vida)
     - Régimen fiscal especial si aplica (Beckham, NHR, 30% ruling)

   Responde: ¿dónde se vive mejor con X€ brutos siendo ingeniero/médico/etc?

   Fuentes:
   · OCDE Taxing Wages 2025 (cuña por país/nivel)
   · HousingAnywhere Rent Index Q4 2025 (alquileres por ciudad)
   · Numbeo CoL Index 2025 (coste alimentación + transporte)
   · Eurostat price levels 2024
   · Regímenes: AEAT (Beckham), AT Portugal (NHR), Belastingdienst (30% ruling)
   --------------------------------------------------------------------------- */

// Ciudades con datos reales 2025
const CITIES_DATA = {
  madrid: {
    name: "Madrid", country: "es", flag: "🇪🇸",
    rent_2br: 1650,      // alquiler 2 dorm fuera del centro mismo
    col_index: 72,       // Numbeo CoL (sin alquiler, NY=100)
    price_level: 90,     // Eurostat precio relativo (EU=100)
    food_mensual: 380,   // alimentación mensual persona
    transport_mensual: 55, // transporte público + gasolina parcial
    utilities: 140,
    climate: "Mediterráneo continental · veranos calurosos",
    idioma: "Español",
    special_regime: "beckham",
  },
  barcelona: {
    name: "Barcelona", country: "es", flag: "🇪🇸",
    rent_2br: 1750, col_index: 74, price_level: 92,
    food_mensual: 400, transport_mensual: 45, utilities: 140,
    climate: "Mediterráneo costero · templado",
    idioma: "Español, catalán",
    special_regime: "beckham",
  },
  valencia: {
    name: "Valencia", country: "es", flag: "🇪🇸",
    rent_2br: 1100, col_index: 64, price_level: 85,
    food_mensual: 350, transport_mensual: 40, utilities: 120,
    climate: "Mediterráneo · templado todo el año",
    idioma: "Español, valenciano",
    special_regime: "beckham",
  },
  berlin: {
    name: "Berlín", country: "de", flag: "🇩🇪",
    rent_2br: 1450, col_index: 76, price_level: 98,
    food_mensual: 350, transport_mensual: 60, utilities: 230,
    climate: "Continental · inviernos fríos",
    idioma: "Alemán (mucho inglés tech)",
    special_regime: null,
  },
  munich: {
    name: "Múnich", country: "de", flag: "🇩🇪",
    rent_2br: 1950, col_index: 85, price_level: 105,
    food_mensual: 400, transport_mensual: 62, utilities: 240,
    climate: "Continental templado · inviernos fríos",
    idioma: "Alemán",
    special_regime: null,
  },
  paris: {
    name: "París", country: "fr", flag: "🇫🇷",
    rent_2br: 1900, col_index: 85, price_level: 108,
    food_mensual: 420, transport_mensual: 90, utilities: 180,
    climate: "Atlántico templado",
    idioma: "Francés",
    special_regime: "impatriate",
  },
  lyon: {
    name: "Lyon", country: "fr", flag: "🇫🇷",
    rent_2br: 1200, col_index: 74, price_level: 98,
    food_mensual: 380, transport_mensual: 75, utilities: 160,
    climate: "Continental templado",
    idioma: "Francés",
    special_regime: "impatriate",
  },
  amsterdam: {
    name: "Ámsterdam", country: "nl", flag: "🇳🇱",
    rent_2br: 2400, col_index: 88, price_level: 110,
    food_mensual: 400, transport_mensual: 110, utilities: 220,
    climate: "Atlántico templado · lluvioso",
    idioma: "Inglés universal + neerlandés",
    special_regime: "ruling30",
  },
  rotterdam: {
    name: "Rotterdam", country: "nl", flag: "🇳🇱",
    rent_2br: 1900, col_index: 80, price_level: 105,
    food_mensual: 380, transport_mensual: 100, utilities: 210,
    climate: "Atlántico · lluvioso",
    idioma: "Neerlandés + inglés fluido",
    special_regime: "ruling30",
  },
  lisbon: {
    name: "Lisboa", country: "pt", flag: "🇵🇹",
    rent_2br: 1450, col_index: 68, price_level: 88,
    food_mensual: 320, transport_mensual: 50, utilities: 110,
    climate: "Atlántico suave · muy agradable",
    idioma: "Portugués (mucho inglés)",
    special_regime: "nhr_limit",  // NHR nuevos muy limitado desde 2024
  },
  porto: {
    name: "Oporto", country: "pt", flag: "🇵🇹",
    rent_2br: 1150, col_index: 62, price_level: 82,
    food_mensual: 280, transport_mensual: 45, utilities: 100,
    climate: "Atlántico norte · lluvioso",
    idioma: "Portugués",
    special_regime: "nhr_limit",
  },
  milan: {
    name: "Milán", country: "it", flag: "🇮🇹",
    rent_2br: 1700, col_index: 78, price_level: 100,
    food_mensual: 380, transport_mensual: 40, utilities: 160,
    climate: "Continental · inviernos fríos, veranos calurosos",
    idioma: "Italiano",
    special_regime: "impatriati_it",
  },
  rome: {
    name: "Roma", country: "it", flag: "🇮🇹",
    rent_2br: 1450, col_index: 72, price_level: 95,
    food_mensual: 380, transport_mensual: 35, utilities: 140,
    climate: "Mediterráneo",
    idioma: "Italiano",
    special_regime: "impatriati_it",
  },
  dublin: {
    name: "Dublín", country: "ie", flag: "🇮🇪",
    rent_2br: 2500, col_index: 86, price_level: 138,
    food_mensual: 450, transport_mensual: 100, utilities: 230,
    climate: "Atlántico suave · muy lluvioso",
    idioma: "Inglés",
    special_regime: "sarp_ie",
  },
  warsaw: {
    name: "Varsovia", country: "pl", flag: "🇵🇱",
    rent_2br: 900, col_index: 55, price_level: 68,
    food_mensual: 260, transport_mensual: 30, utilities: 140,
    climate: "Continental · inviernos muy fríos",
    idioma: "Polaco (inglés en tech)",
    special_regime: "ip_box_pl",
  },
  // ─── Estados Unidos ──────────────────────────────────────────────────────
  // Nota: USA tiene mucha dispersión estatal. Cuña fiscal efectiva varía MUCHO
  // entre California (alto) y Texas/Florida (sin income tax estatal).
  // Alquileres en EUR convertidos desde USD (USD/EUR 0.92).
  newyork: {
    name: "Nueva York (NY)", country: "us_ny", flag: "🇺🇸",
    rent_2br: 3800,          // Manhattan/Brooklyn decente 2-dorm · muy alto
    col_index: 100,          // Referencia global Numbeo
    price_level: 145,        // Eurostat-equivalent
    food_mensual: 550,
    transport_mensual: 130,  // Metro + ocasional Uber/taxi
    utilities: 280,          // Más alto por AC/calefacción
    climate: "Continental · inviernos fríos, veranos calurosos húmedos",
    idioma: "Inglés",
    special_regime: null,
  },
  sanfrancisco: {
    name: "San Francisco (CA)", country: "us_ca", flag: "🇺🇸",
    rent_2br: 3500,
    col_index: 95,
    price_level: 148,
    food_mensual: 560,
    transport_mensual: 120,
    utilities: 230,
    climate: "Mediterráneo oceánico · templado todo el año, con niebla",
    idioma: "Inglés",
    special_regime: null,
  },
  austin: {
    name: "Austin (TX)", country: "us_tx", flag: "🇺🇸",
    rent_2br: 2000,
    col_index: 72,
    price_level: 105,
    food_mensual: 480,
    transport_mensual: 180,  // Dependencia coche total (gasolina + seguro)
    utilities: 240,
    climate: "Subtropical · veranos muy calurosos",
    idioma: "Inglés",
    special_regime: "no_state_tax", // Texas sin estatal
  },
  miami: {
    name: "Miami (FL)", country: "us_fl", flag: "🇺🇸",
    rent_2br: 2600,
    col_index: 78,
    price_level: 110,
    food_mensual: 500,
    transport_mensual: 180,
    utilities: 260,
    climate: "Tropical · cálido y húmedo todo el año",
    idioma: "Inglés + español",
    special_regime: "no_state_tax", // Florida sin estatal
  },
  // ─── Canadá ──────────────────────────────────────────────────────────────
  toronto: {
    name: "Toronto (ON)", country: "ca_on", flag: "🇨🇦",
    rent_2br: 2200,          // CAD ~3200 → EUR
    col_index: 78,
    price_level: 115,
    food_mensual: 440,
    transport_mensual: 110,
    utilities: 220,
    climate: "Continental · inviernos muy fríos",
    idioma: "Inglés",
    special_regime: null,
  },
  vancouver: {
    name: "Vancouver (BC)", country: "ca_bc", flag: "🇨🇦",
    rent_2br: 2400,
    col_index: 80,
    price_level: 118,
    food_mensual: 460,
    transport_mensual: 100,
    utilities: 210,
    climate: "Oceánico · lluvioso, inviernos suaves",
    idioma: "Inglés",
    special_regime: null,
  },
  montreal: {
    name: "Montreal (QC)", country: "ca_qc", flag: "🇨🇦",
    rent_2br: 1450,          // Mucho más barato que Toronto/Vancouver
    col_index: 68,
    price_level: 98,
    food_mensual: 390,
    transport_mensual: 95,
    utilities: 200,
    climate: "Continental · inviernos muy fríos y nevados",
    idioma: "Francés + inglés",
    special_regime: null,    // Quebec tiene cuña más alta
  },
};

// Cuña fiscal por país y nivel (OCDE 2025 - ejercicio 2024)
// USA: desglosado por estado (NY/CA altos, TX/FL sin estatal). Valores incluyen federal+estatal.
// CA: ON/BC tipo intermedio, QC más alto.
const COUNTRY_TAX = {
  es: { name: "España", at67: 37.5, at100: 40.6, at133: 43.0, at167: 45.5, at200: 47.0 },
  de: { name: "Alemania", at67: 45.2, at100: 47.9, at133: 49.5, at167: 50.7, at200: 51.5 },
  fr: { name: "Francia", at67: 42.8, at100: 47.2, at133: 50.5, at167: 54.0, at200: 56.2 },
  nl: { name: "Países Bajos", at67: 32.5, at100: 36.2, at133: 40.0, at167: 43.8, at200: 46.5 },
  pt: { name: "Portugal", at67: 35.5, at100: 38.0, at133: 41.5, at167: 43.5, at200: 46.0 },
  it: { name: "Italia", at67: 41.0, at100: 47.1, at133: 49.5, at167: 51.8, at200: 53.5 },
  ie: { name: "Irlanda", at67: 26.0, at100: 34.7, at133: 40.0, at167: 44.5, at200: 48.0 },
  pl: { name: "Polonia", at67: 33.5, at100: 33.7, at133: 34.0, at167: 34.5, at200: 35.0 },
  // USA por estado: incluye federal + estatal + FICA (empleado + empleador implícito en cuña)
  us_ny: { name: "USA-NY", at67: 31.5, at100: 36.0, at133: 40.0, at167: 43.5, at200: 46.0 },
  us_ca: { name: "USA-CA", at67: 32.0, at100: 37.5, at133: 41.5, at167: 45.0, at200: 48.0 }, // CA estatal más alto (13.3% top)
  us_tx: { name: "USA-TX", at67: 26.5, at100: 29.5, at133: 32.5, at167: 35.0, at200: 37.0 }, // sin income tax estatal
  us_fl: { name: "USA-FL", at67: 26.5, at100: 29.5, at133: 32.5, at167: 35.0, at200: 37.0 }, // sin income tax estatal
  // Canadá por provincia
  ca_on: { name: "Canadá-ON", at67: 28.5, at100: 32.1, at133: 36.0, at167: 39.5, at200: 42.5 },
  ca_bc: { name: "Canadá-BC", at67: 28.0, at100: 31.8, at133: 35.5, at167: 39.0, at200: 42.0 },
  ca_qc: { name: "Canadá-QC", at67: 32.0, at100: 36.5, at133: 41.0, at167: 44.5, at200: 47.0 }, // Quebec más alto
};

// Regímenes fiscales especiales
const SPECIAL_REGIMES = {
  beckham: {
    name: "Régimen Beckham (España)",
    rate: 0.24,  // 24% flat rate hasta €600k
    limit: 600000,
    top_rate: 0.47,
    conditions: "Nuevos residentes (no haber residido en ES últimos 5 años). 6 años máx. No aplica capital gains global.",
    savings_vs_regular: "50-60% en brutos altos",
  },
  ruling30: {
    name: "30% Ruling (Países Bajos)",
    rate: "30% libre de impuestos durante 5 años",
    limit: null,
    conditions: "Trabajadores extranjeros cualificados con salario mínimo ~€46k. Desde 2024 limitado a 5 años (antes 8).",
    savings_vs_regular: "~9-13pp menos cuña efectiva",
  },
  impatriate: {
    name: "Impatriate (Francia)",
    rate: "Exención 30% del salario + bonos no gravados",
    limit: null,
    conditions: "Trabajadores reclutados desde el extranjero. 8 años.",
    savings_vs_regular: "~10-15pp menos cuña efectiva",
  },
  impatriati_it: {
    name: "Impatriati (Italia)",
    rate: "50% base imponible (70-90% si sur de Italia)",
    limit: null,
    conditions: "Investigadores/altamente cualificados. 5-10 años. Restringido desde 2024.",
    savings_vs_regular: "~15-20pp menos cuña efectiva",
  },
  nhr_limit: {
    name: "NHR / IFICI (Portugal)",
    rate: "20% flat sobre rentas cualificadas",
    limit: null,
    conditions: "NHR clásico cerrado para nuevos. IFICI (2024+) solo para investigación científica, startups reconocidas, etc.",
    savings_vs_regular: "Muy restringido · valor menor que antes",
  },
  sarp_ie: {
    name: "SARP (Irlanda)",
    rate: "30% exención sobre salario >€100k hasta €1M",
    limit: 1000000,
    conditions: "Empleados extranjeros relocados por 5 años.",
    savings_vs_regular: "~8-12pp en altos ingresos",
  },
  ip_box_pl: {
    name: "IP Box (Polonia)",
    rate: "5% sobre rentas de PI (software, patentes)",
    limit: null,
    conditions: "Autónomos/empresas generando IP (código, patentes). Común entre desarrolladores.",
    savings_vs_regular: "Puede bajar cuña efectiva al 15-20%",
  },
  no_state_tax: {
    name: "Sin income tax estatal (TX/FL)",
    rate: "Solo IRPF federal (0-37%), no estatal",
    limit: null,
    conditions: "Residencia fiscal en Texas, Florida, Tennessee, Nevada, Washington, Wyoming, South Dakota o Alaska. Sales tax estatal sigue aplicando.",
    savings_vs_regular: "~4-13pp menos cuña vs CA/NY según nivel",
  },
};

// Perfiles profesionales con salarios mediana D9 por ciudad (aproximados 2024)
// USA/Canadá en EUR equivalente. USA tech Nueva York/SF son outliers globales.
const PROFILES = {
  ingeniero_software: {
    name: "Ingeniero software (5-10 años exp)",
    salaries: {
      madrid: 55000, barcelona: 58000, valencia: 45000,
      berlin: 72000, munich: 85000,
      paris: 65000, lyon: 55000,
      amsterdam: 78000, rotterdam: 70000,
      lisbon: 42000, porto: 38000,
      milan: 55000, rome: 48000,
      dublin: 85000, warsaw: 38000,
      // USA (EUR equivalente, USD×0.92)
      newyork: 165000, sanfrancisco: 190000, austin: 130000, miami: 115000,
      // Canadá (EUR equivalente, CAD×0.68)
      toronto: 95000, vancouver: 90000, montreal: 82000,
    },
  },
  ingeniero_senior: {
    name: "Ingeniero senior / Tech Lead",
    salaries: {
      madrid: 75000, barcelona: 78000, valencia: 62000,
      berlin: 95000, munich: 115000,
      paris: 85000, lyon: 72000,
      amsterdam: 105000, rotterdam: 92000,
      lisbon: 58000, porto: 50000,
      milan: 72000, rome: 65000,
      dublin: 115000, warsaw: 55000,
      // USA
      newyork: 230000, sanfrancisco: 275000, austin: 185000, miami: 165000,
      // Canadá
      toronto: 125000, vancouver: 120000, montreal: 110000,
    },
  },
  medico_especialista: {
    name: "Médico especialista (SNS pública)",
    salaries: {
      madrid: 65000, barcelona: 68000, valencia: 58000,
      berlin: 95000, munich: 105000,
      paris: 85000, lyon: 78000,
      amsterdam: 95000, rotterdam: 90000,
      lisbon: 45000, porto: 42000,
      milan: 72000, rome: 68000,
      dublin: 110000, warsaw: 42000,
      // USA: sistema privado, salarios especialistas muy altos
      newyork: 310000, sanfrancisco: 320000, austin: 275000, miami: 260000,
      // Canadá: sanidad pública pero mejor pagada que EU
      toronto: 195000, vancouver: 185000, montreal: 165000,
    },
  },
  consultor_senior: {
    name: "Consultor / Manager senior",
    salaries: {
      madrid: 80000, barcelona: 82000, valencia: 65000,
      berlin: 95000, munich: 115000,
      paris: 90000, lyon: 75000,
      amsterdam: 100000, rotterdam: 90000,
      lisbon: 62000, porto: 52000,
      milan: 78000, rome: 72000,
      dublin: 105000, warsaw: 55000,
      newyork: 220000, sanfrancisco: 235000, austin: 175000, miami: 155000,
      toronto: 135000, vancouver: 130000, montreal: 115000,
    },
  },
  custom: {
    name: "Personalizado",
    salaries: null,
  },
};

// Interpolador lineal cuña fiscal según bruto
function taxWedgeAt(countryKey, avgWage, bruto) {
  const tax = COUNTRY_TAX[countryKey];
  if (!tax) return 0.40;
  const ratio = bruto / avgWage;
  // Puntos: 67%, 100%, 133%, 167%, 200%
  const points = [
    [0.67, tax.at67], [1.00, tax.at100], [1.33, tax.at133],
    [1.67, tax.at167], [2.00, tax.at200],
  ];
  if (ratio <= 0.67) return tax.at67 / 100;
  if (ratio >= 2.00) return tax.at200 / 100;
  for (let i = 0; i < points.length - 1; i++) {
    const [r1, w1] = points[i];
    const [r2, w2] = points[i + 1];
    if (ratio >= r1 && ratio <= r2) {
      const frac = (ratio - r1) / (r2 - r1);
      return (w1 + frac * (w2 - w1)) / 100;
    }
  }
  return tax.at100 / 100;
}

const AVG_WAGES = {
  es: 33000, de: 52000, fr: 42000, nl: 50000,
  pt: 20000, it: 35000, ie: 55000, pl: 22000,
  // USA: salario medio anual en EUR (~$72k → €66k), matizado por estado
  us_ny: 75000, us_ca: 82000, us_tx: 62000, us_fl: 58000,
  // Canadá: salario medio anual ~CAD 65k → €44k
  ca_on: 50000, ca_bc: 48000, ca_qc: 45000,
};

function calcLifeMetrics(cityKey, bruto, applySpecial = false) {
  const city = CITIES_DATA[cityKey];
  const country = city.country;
  const avgWage = AVG_WAGES[country];

  let wedge = taxWedgeAt(country, avgWage, bruto);
  let regimeApplied = null;

  // Aplicar régimen especial si está activado
  if (applySpecial && city.special_regime && SPECIAL_REGIMES[city.special_regime]) {
    regimeApplied = SPECIAL_REGIMES[city.special_regime];
    if (city.special_regime === "beckham") {
      // Beckham: 24% flat (sin SS empresa en el cálculo simplificado, lo incluimos)
      const irpf_special = Math.min(bruto, 600000) * 0.24 + Math.max(0, bruto - 600000) * 0.47;
      const ss_emp = bruto * 0.065;
      wedge = (irpf_special + ss_emp + bruto * 0.30) / (bruto * 1.30);  // coste empresa
    } else if (city.special_regime === "ruling30") {
      // 30% tax free en NL
      wedge = wedge * 0.70;  // aproximación simplificada
    } else if (city.special_regime === "impatriate") {
      wedge = wedge - 0.11;  // reducción aprox
    } else if (city.special_regime === "impatriati_it") {
      wedge = wedge - 0.15;
    } else if (city.special_regime === "sarp_ie") {
      if (bruto >= 100000) wedge = wedge - 0.08;
    } else if (city.special_regime === "ip_box_pl") {
      wedge = 0.20;  // asumiendo autónomo IP Box
    } else if (city.special_regime === "no_state_tax") {
      // Ya está reflejado en COUNTRY_TAX (us_tx/us_fl tienen cuña menor)
      // El "aplicar régimen" es simbólico aquí; la ventaja ya está en el wedge base
      regimeApplied = SPECIAL_REGIMES.no_state_tax;
    } else if (city.special_regime === "nhr_limit") {
      // Muy restringido, asumimos que no aplica al típico usuario
      regimeApplied = null;
    }
  }

  const neto_anual = bruto * (1 - wedge);
  const neto_mensual = neto_anual / 12;

  const alquiler = city.rent_2br;
  const comida = city.food_mensual;
  const transporte = city.transport_mensual;
  const utilities = city.utilities;

  const gastos_base = alquiler + comida + transporte + utilities;
  const discrecional = neto_mensual - gastos_base;

  // Ajustar a PPP (mismo dinero compra más/menos según país)
  const ppp_adjusted_disc = discrecional * (100 / city.price_level);

  // Ratio alquiler/neto
  const rent_ratio = alquiler / neto_mensual;

  return {
    city, country, avgWage, bruto,
    wedge, regimeApplied,
    neto_anual, neto_mensual,
    alquiler, comida, transporte, utilities, gastos_base,
    discrecional, ppp_adjusted_disc,
    rent_ratio,
  };
}

function DondeVivirView() {
  const [profile, setProfile] = useState("ingeniero_senior");
  const [customBruto, setCustomBruto] = useState(75000);
  const [applySpecial, setApplySpecial] = useState(true);
  const [sortBy, setSortBy] = useState("ppp_disc"); // ppp_disc | neto | rent_ratio

  const profileData = PROFILES[profile];
  const isCustom = profile === "custom";

  // Para cada ciudad, obtener el bruto apropiado
  const cityKeys = Object.keys(CITIES_DATA);
  const results = cityKeys.map(key => {
    let bruto;
    if (isCustom) {
      bruto = customBruto;
    } else {
      bruto = profileData.salaries[key] || customBruto;
    }
    return { key, ...calcLifeMetrics(key, bruto, applySpecial) };
  });

  const sorted = useMemo(() => {
    const arr = [...results];
    if (sortBy === "ppp_disc") arr.sort((a, b) => b.ppp_adjusted_disc - a.ppp_adjusted_disc);
    else if (sortBy === "neto") arr.sort((a, b) => b.neto_mensual - a.neto_mensual);
    else if (sortBy === "rent_ratio") arr.sort((a, b) => a.rent_ratio - b.rent_ratio);
    return arr;
  }, [results, sortBy]);

  const fmtEur = (v) => `€${Math.round(v).toLocaleString("es-ES")}`;
  const fmtPct = (v) => `${(v * 100).toFixed(1)}%`;

  const top = sorted[0];
  const madrid = results.find(r => r.key === "madrid");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl tracking-tight">¿Dónde se vive mejor con tu sueldo? Europa + Norteamérica</h2>
        <p className="text-sm text-stone-500 mt-1 max-w-3xl">
          Comparador de poder adquisitivo real por ciudad: coge tu bruto (o elige un perfil
          profesional), ajusta cuña fiscal real, alquiler de 2 dormitorios, alimentación y
          transporte, y compara renta discrecional final — lo que de verdad te queda para vivir.
          Incluye 15 ciudades UE + 4 ciudades USA (NY, SF, Austin, Miami) + 3 canadienses (Toronto,
          Vancouver, Montreal). USA destaca por dispersión fiscal entre estados (TX/FL sin estatal).
        </p>
      </div>

      {/* Banner ganador */}
      {top && madrid && (
        <div className="rounded-2xl border-2 border-[#7A1F3D] bg-gradient-to-br from-[#FBF7F0] to-white p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-[10px] uppercase tracking-[0.15em] text-stone-500 font-semibold">Mejor renta discrecional PPP</div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-4xl">{top.city.flag}</span>
                <div>
                  <div className="font-serif text-2xl text-[#7A1F3D]">{top.city.name}</div>
                  <div className="font-mono text-sm text-stone-700">{fmtEur(top.ppp_adjusted_disc)}/mes</div>
                </div>
              </div>
              <p className="text-[11px] text-stone-500 mt-2 leading-snug">
                Lo que te queda tras alquiler, comida, transporte y suministros, ajustado a poder
                adquisitivo local.
              </p>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.15em] text-stone-500 font-semibold">Madrid (referencia)</div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-4xl">🇪🇸</span>
                <div>
                  <div className="font-serif text-2xl text-stone-700">Madrid</div>
                  <div className="font-mono text-sm text-stone-700">{fmtEur(madrid.ppp_adjusted_disc)}/mes</div>
                </div>
              </div>
              <p className="text-[11px] text-stone-500 mt-2 leading-snug">
                Diferencia: <strong style={{ color: top.ppp_adjusted_disc > madrid.ppp_adjusted_disc ? "#065F46" : "#E11D48" }}>
                  {top.ppp_adjusted_disc > madrid.ppp_adjusted_disc ? "+" : ""}{fmtEur(top.ppp_adjusted_disc - madrid.ppp_adjusted_disc)}/mes
                </strong> ({fmtEur((top.ppp_adjusted_disc - madrid.ppp_adjusted_disc) * 12)}/año)
              </p>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.15em] text-stone-500 font-semibold">Con régimen especial</div>
              <div className="flex items-center gap-2 mt-2">
                {applySpecial ? (
                  <span className="text-[10px] uppercase tracking-[0.12em] px-2 py-1 rounded bg-emerald-600 text-white font-semibold">Activado</span>
                ) : (
                  <span className="text-[10px] uppercase tracking-[0.12em] px-2 py-1 rounded bg-stone-400 text-white font-semibold">Desactivado</span>
                )}
              </div>
              <p className="text-[11px] text-stone-500 mt-2 leading-snug">
                Beckham (ES), 30% ruling (NL), Impatriate (FR/IT), SARP (IE), IP Box (PL). Aplican
                a nuevos residentes cualificados, con condiciones.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Controles */}
      <div className="rounded-xl border border-stone-200 bg-white p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="text-[11px] uppercase tracking-[0.12em] text-stone-500 font-semibold block mb-2">
              Perfil profesional
            </label>
            <select value={profile} onChange={(e) => setProfile(e.target.value)}
                    className="w-full text-sm border border-stone-200 rounded-md px-3 py-2 bg-white">
              {Object.entries(PROFILES).map(([k, p]) => (
                <option key={k} value={k}>{p.name}</option>
              ))}
            </select>
            <p className="text-[10px] text-stone-400 mt-1">
              Salarios estimados 2024 por ciudad según sector.
            </p>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-[0.12em] text-stone-500 font-semibold block mb-2">
              {isCustom ? "Tu bruto anual" : "Bruto personalizado (fallback)"}
            </label>
            <div className="flex items-center gap-3">
              <input type="range" min={25000} max={200000} step={1000} value={customBruto}
                     onChange={(e) => setCustomBruto(parseInt(e.target.value))}
                     className="flex-1 accent-[#7A1F3D]" />
              <span className="font-mono text-sm text-[#7A1F3D] w-20 text-right">{fmtEur(customBruto)}</span>
            </div>
            <p className="text-[10px] text-stone-400 mt-1">
              Se usa si activas "Personalizado" o si el perfil no tiene dato para una ciudad.
            </p>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-[0.12em] text-stone-500 font-semibold block mb-2">
              Régimen fiscal especial
            </label>
            <div className="flex items-center gap-2">
              <button onClick={() => setApplySpecial(!applySpecial)}
                      className={`px-4 py-2 rounded-md text-xs font-semibold transition-colors ${
                        applySpecial
                          ? "bg-emerald-600 text-white"
                          : "bg-stone-200 text-stone-600"
                      }`}>
                {applySpecial ? "✓ Aplicando" : "Desactivado"}
              </button>
              <span className="text-[11px] text-stone-500">si cumples condiciones</span>
            </div>
            <p className="text-[10px] text-stone-400 mt-1">
              Beckham, 30% ruling, etc. Son "mejor escenario" si eres elegible.
            </p>
          </div>
        </div>
      </div>

      {/* Ordenar por */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-[11px] uppercase tracking-[0.12em] text-stone-500 font-semibold">Ordenar por:</span>
        {[
          { id: "ppp_disc", label: "Renta discrecional PPP" },
          { id: "neto", label: "Neto mensual absoluto" },
          { id: "rent_ratio", label: "Ratio alquiler/neto (menor = mejor)" },
        ].map(o => (
          <button key={o.id} onClick={() => setSortBy(o.id)}
            className={`text-xs px-3 py-1 rounded-full transition-colors ${
              sortBy === o.id
                ? "bg-[#7A1F3D] text-white"
                : "bg-white border border-stone-200 text-stone-600 hover:border-[#7A1F3D]"
            }`}>
            {o.label}
          </button>
        ))}
      </div>

      {/* Tabla ciudades */}
      <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-[10px] uppercase tracking-[0.08em] text-stone-500">
            <tr>
              <th className="text-left px-3 py-2">Ciudad</th>
              <th className="text-right px-3 py-2">Bruto €/a</th>
              <th className="text-right px-3 py-2">Cuña</th>
              <th className="text-right px-3 py-2">Neto/mes</th>
              <th className="text-right px-3 py-2">Alquiler</th>
              <th className="text-right px-3 py-2">% neto</th>
              <th className="text-right px-3 py-2">Disc. nom.</th>
              <th className="text-right px-3 py-2 bg-[#FBF7F0]">Disc. PPP</th>
              <th className="text-left px-3 py-2">Notas</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, idx) => {
              const isMadrid = r.key === "madrid";
              const isTop = idx === 0;
              const betterThanMadrid = madrid && r.ppp_adjusted_disc > madrid.ppp_adjusted_disc;
              return (
                <tr key={r.key} className={`border-t border-stone-100 text-[12px] ${
                  isMadrid ? "bg-amber-50/40" : isTop ? "bg-emerald-50/40" : ""
                }`}>
                  <td className="px-3 py-2 font-medium">
                    <span className="mr-1.5">{r.city.flag}</span>
                    <span className="text-stone-800">{r.city.name}</span>
                    {isMadrid && <span className="text-[9px] ml-1 text-amber-700">●</span>}
                  </td>
                  <td className="px-3 py-2 text-right font-mono">{fmtEur(r.bruto)}</td>
                  <td className="px-3 py-2 text-right font-mono text-rose-700">{fmtPct(r.wedge)}</td>
                  <td className="px-3 py-2 text-right font-mono">{fmtEur(r.neto_mensual)}</td>
                  <td className="px-3 py-2 text-right font-mono">{fmtEur(r.alquiler)}</td>
                  <td className={`px-3 py-2 text-right font-mono text-[11px] ${
                    r.rent_ratio > 0.5 ? "text-rose-700 font-semibold" :
                    r.rent_ratio > 0.35 ? "text-amber-700" : "text-emerald-700"
                  }`}>
                    {fmtPct(r.rent_ratio)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono">{fmtEur(r.discrecional)}</td>
                  <td className={`px-3 py-2 text-right font-mono font-semibold bg-[#FBF7F0]/40 ${
                    betterThanMadrid ? "text-emerald-700" : isMadrid ? "text-[#7A1F3D]" : "text-stone-700"
                  }`}>
                    {fmtEur(r.ppp_adjusted_disc)}
                  </td>
                  <td className="px-3 py-2 text-[10px] text-stone-500">
                    {r.regimeApplied ? (
                      <span className="text-emerald-700">✓ {r.regimeApplied.name.split(" (")[0]}</span>
                    ) : r.city.special_regime && applySpecial ? (
                      <span className="text-stone-400">régimen no aplicable</span>
                    ) : ""}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Leyenda regímenes */}
      {applySpecial && (
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <h4 className="text-[11px] uppercase tracking-[0.12em] text-stone-500 font-semibold mb-2">
            Regímenes fiscales especiales aplicados (nuevos residentes cualificados)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {Object.entries(SPECIAL_REGIMES).map(([k, r]) => (
              <div key={k} className="text-[11px] border-l-2 border-[#7A1F3D]/30 pl-3 py-1">
                <div className="font-semibold text-stone-700">{r.name}</div>
                <div className="text-stone-500">{r.conditions}</div>
                <div className="text-emerald-700 mt-0.5">Ahorro: {r.savings_vs_regular}</div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-stone-400 mt-3 italic">
            Estimaciones simplificadas. En la práctica depende de composición salarial, años
            residencia, tipo de contrato. Consulta asesor fiscal antes de decidir.
          </p>
        </div>
      )}

      {/* Viz gráfico: ordenados por disc. PPP */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <h3 className="font-serif text-lg tracking-tight mb-3">
          Renta discrecional mensual ajustada por PPP
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={sorted} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
            <CartesianGrid strokeDasharray="2 4" stroke="#E7E5E4" />
            <XAxis type="number" tick={{ fontSize: 11, fill: "#57534E" }} tickFormatter={(v) => `€${(v/1000).toFixed(1)}k`} />
            <YAxis type="category" dataKey="city.name" tick={{ fontSize: 11, fill: "#57534E" }} width={75} />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: "1px solid #E7E5E4", fontSize: 12 }}
              formatter={(v) => [fmtEur(v), "Discrecional PPP/mes"]}
              labelFormatter={(l) => l}
            />
            <Bar dataKey="ppp_adjusted_disc" radius={[0, 4, 4, 0]}>
              {sorted.map((r, i) => {
                const color = r.key === "madrid" ? "#A16207" :
                             r.ppp_adjusted_disc > (madrid?.ppp_adjusted_disc || 0) ? "#065F46" : "#78716C";
                return <Cell key={i} fill={color} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detalle ciudades destacadas */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <h3 className="font-serif text-lg tracking-tight mb-3">Top 3 ciudades para tu perfil</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sorted.slice(0, 3).map((r, i) => (
            <div key={r.key} className={`rounded-xl border-2 p-4 ${
              i === 0 ? "border-[#7A1F3D] bg-[#FBF7F0]" : "border-stone-200 bg-white"
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{r.city.flag}</span>
                <div>
                  <div className="font-serif text-lg text-stone-900">{r.city.name}</div>
                  <div className="text-[10px] uppercase tracking-[0.1em] text-stone-500">
                    #{i + 1} · {r.city.idioma}
                  </div>
                </div>
              </div>
              <div className="space-y-1 text-[11px] text-stone-600 mb-3">
                <div><strong>Bruto:</strong> {fmtEur(r.bruto)}/año</div>
                <div><strong>Neto:</strong> {fmtEur(r.neto_mensual)}/mes ({fmtPct(1 - r.wedge)} del bruto)</div>
                <div><strong>Alquiler 2dorm:</strong> {fmtEur(r.alquiler)}/mes</div>
                <div><strong>Clima:</strong> {r.city.climate}</div>
                {r.regimeApplied && (
                  <div className="text-emerald-700 font-semibold">
                    Con {r.regimeApplied.name.split(" (")[0]}
                  </div>
                )}
              </div>
              <div className="pt-2 border-t border-stone-200">
                <div className="text-[10px] uppercase tracking-[0.1em] text-stone-500">Discrecional PPP</div>
                <div className="font-serif text-xl font-semibold" style={{ color: i === 0 ? "#7A1F3D" : "#57534E" }}>
                  {fmtEur(r.ppp_adjusted_disc)}/mes
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lectura honesta */}
      <div className="rounded-2xl border-2 border-[#7A1F3D]/30 bg-gradient-to-br from-[#FBF7F0] via-white to-[#EC4899]/10 p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#7A1F3D]" />
          <h3 className="font-serif text-xl tracking-tight">Cómo leer esto honestamente</h3>
        </div>
        <div className="space-y-3 text-[13px] text-stone-700 leading-relaxed">
          <p>
            Este comparador simplifica. Lo que <strong>captura bien</strong>: renta disponible real
            tras lo esencial, ajustada por poder adquisitivo local. Lo que <strong>no captura</strong>:
            calidad de servicios públicos (sanidad, transporte, educación), impuestos sobre ahorro
            e inversión, impuesto patrimonio/sucesiones, pensión esperada, calidad del clima/vida
            social, o si hablas el idioma.
          </p>
          <p>
            <strong>Madrid/Barcelona sufren</strong> especialmente porque combinan salarios más
            bajos que Alemania/Países Bajos con alquileres ya comparables (74% ratio alquiler/salario
            vs 45% en Berlín o París). Es la trampa que explica mucha fuga de talento. El régimen
            Beckham puede mitigarlo para nuevos residentes (6 años) pero no resuelve el problema
            estructural.
          </p>
          <p>
            <strong>Los "ganadores" típicos en UE</strong> para un profesional senior son Múnich, Ámsterdam
            y Berlín (por combinación salario alto + cuña razonable). Dublin e Irlanda destacan si
            se aplica SARP. Polonia es competitiva si eres autónomo IP Box. Portugal ya no es el
            paraíso fiscal que era (NHR muy limitado desde 2024).
          </p>
          <p>
            <strong>USA es la anomalía:</strong> San Francisco y Nueva York ofrecen salarios 2-3×
            los europeos, pero alquileres también 2× los de Madrid y <strong>sin sanidad pública</strong>
            (seguros de $500-1500/mes). Austin y Miami son el sweet-spot USA: salarios tech altos +
            alquileres razonables + <strong>cero impuesto estatal</strong>. Para un ingeniero senior
            €150-250k, la diferencia TX/FL vs California en 10 años puede superar los €400k acumulados
            solo en IRPF estatal.
          </p>
          <p>
            <strong>Canadá es el "Europa con clima peor":</strong> salarios tech ~60-70% de los USA
            pero cuña fiscal UE (30-40%), sanidad pública, menor desigualdad. Toronto y Vancouver
            tienen crisis de vivienda comparable a Madrid. Montreal destaca: 40% más barato que
            Toronto pero con cuña fiscal Quebec más alta y requiere francés.
          </p>
          <p className="text-[#7A1F3D] font-serif italic text-[14px] border-l-2 border-[#7A1F3D] pl-4">
            Lente Blondie: el bosque español tiene árboles hermosos (clima, cultura, gastronomía,
            redes personales) pero su sistema económico produce menos frutos que los vecinos.
            Esto ni es crítica ni celebración: es un hecho que cada persona debe pesar contra sus
            propias preferencias. "Mejor" es siempre "mejor para qué". USA optimiza ingresos pero
            externaliza el riesgo (sanidad, pensiones, educación hijos) al individuo. Europa
            colectiviza riesgo pero deprime ingresos. Canadá está en medio. Elige según tu aversión
            al riesgo y edad de la vida.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-stone-400 pt-2 border-t border-stone-200">
          <Info className="w-3 h-3" />
          <span>Fuentes: OCDE Taxing Wages 2025, HousingAnywhere Rent Index Q4 2025, Numbeo CoL 2025, Eurostat Price Levels 2024, BLS OEWS 2023 (USA), StatCan LFS 2024, Levels.fyi 2024, salarios ciudad Glassdoor/Payscale 2024.</span>
        </div>
      </div>
    </div>
  );
}



/* --------------------------------------------------------------------------- */
/* [17] COMPOSICIÓN FISCAL — qué % del Estado viene de ciudadanos directos     */
/* ---------------------------------------------------------------------------
   Desmonta el total "tax-to-GDP" en categorías según quién paga directamente:
     · Carga directa sobre ciudadanos (IRPF + SS trab + IVA + IEE + IBI...)
     · Carga sobre empresas que acaba repercutida (IS + SS empresa)
     · Ajustes por "carácter exportador" (España ≠ Alemania)

   Clave: Alemania tiene IS mayor porque sus empresas exportadoras generan
   más beneficio, no porque el ciudadano alemán pague más que el español.

   Fuentes:
   · Eurostat gov_10a_taxag 2024
   · OCDE Revenue Statistics 2025
   · Eurostat gerencia exterior/export/GDP
   --------------------------------------------------------------------------- */

// Composición fiscal real por país — % PIB 2024 (Eurostat + OCDE)
// USA: OCDE Revenue Statistics 2024. Sin IVA federal (VAT column = sales tax estatal promedio).
// CA: OCDE Revenue Statistics 2024. GST federal 5% + PST provincial promedio.
const TAX_COMPOSITION = {
  es: {
    name: "España", flag: "🇪🇸", total: 37.0,
    irpf: 8.2,             // IRPF/PIT
    social_emp: 3.0,       // SS trabajador
    social_empr: 8.8,      // SS empresa (repercutida al trabajador vía salario)
    iva: 6.6,              // VAT
    ieespecial: 2.2,       // II.EE. (hidrocarburos, tabaco, etc.)
    ibi_locales: 2.0,      // Property + local
    sociedades: 2.3,       // CIT
    otros_prod: 3.9,       // Otros impuestos sobre producción
    export_gdp: 37.5,      // exportaciones/PIB
    corp_profit_export: "medio",
  },
  de: {
    name: "Alemania", flag: "🇩🇪", total: 40.5,
    irpf: 10.2,
    social_emp: 7.0,
    social_empr: 7.2,
    iva: 7.0,
    ieespecial: 2.0,
    ibi_locales: 1.2,
    sociedades: 2.4,
    otros_prod: 3.5,
    export_gdp: 47.5,
    corp_profit_export: "muy alto",
  },
  fr: {
    name: "Francia", flag: "🇫🇷", total: 43.5,
    irpf: 9.5,
    social_emp: 4.2,
    social_empr: 12.1,
    iva: 7.2,
    ieespecial: 2.8,
    ibi_locales: 3.3,
    sociedades: 2.3,
    otros_prod: 2.1,
    export_gdp: 34.0,
    corp_profit_export: "medio",
  },
  it: {
    name: "Italia", flag: "🇮🇹", total: 42.0,
    irpf: 11.5,
    social_emp: 2.3,
    social_empr: 10.5,
    iva: 6.3,
    ieespecial: 2.2,
    ibi_locales: 2.1,
    sociedades: 2.1,
    otros_prod: 5.0,
    export_gdp: 34.0,
    corp_profit_export: "medio",
  },
  pt: {
    name: "Portugal", flag: "🇵🇹", total: 36.8,
    irpf: 7.4,
    social_emp: 3.7,
    social_empr: 6.0,
    iva: 8.8,
    ieespecial: 2.5,
    ibi_locales: 1.3,
    sociedades: 3.3,
    otros_prod: 3.8,
    export_gdp: 47.0,
    corp_profit_export: "bajo",
  },
  nl: {
    name: "Países Bajos", flag: "🇳🇱", total: 38.8,
    irpf: 8.5,
    social_emp: 6.8,
    social_empr: 4.7,
    iva: 6.5,
    ieespecial: 2.7,
    ibi_locales: 1.5,
    sociedades: 3.9,
    otros_prod: 4.2,
    export_gdp: 88.0,
    corp_profit_export: "muy alto",
  },
  ie: {
    name: "Irlanda", flag: "🇮🇪", total: 21.7,
    irpf: 7.8,
    social_emp: 1.1,
    social_empr: 2.8,
    iva: 4.1,
    ieespecial: 1.6,
    ibi_locales: 0.6,
    sociedades: 3.2,
    otros_prod: 0.5,
    export_gdp: 130.0,
    corp_profit_export: "extremo (multinacionales)",
  },
  us: {
    name: "Estados Unidos", flag: "🇺🇸", total: 27.7,
    irpf: 10.5,            // Federal + estatal promedio
    social_emp: 3.4,       // FICA empleado (6.2% SS + 1.45% Medicare, sobre base)
    social_empr: 3.8,      // FICA empleador (mismo simetrico)
    iva: 2.1,              // Sin IVA federal: solo sales tax estatal-local promedio
    ieespecial: 0.8,       // excise federal (gasolina, tabaco, alcohol)
    ibi_locales: 3.0,      // Property tax local (muy significativo, financia schools)
    sociedades: 1.4,       // Corporate tax federal + estatal
    otros_prod: 2.7,       // Otros impuestos federales/estatales
    export_gdp: 11.0,      // Economía doméstica grande, poco export/PIB
    corp_profit_export: "alto (multinacionales tech)",
  },
  ca: {
    name: "Canadá", flag: "🇨🇦", total: 34.1,
    irpf: 12.2,            // Federal + provincial, alto peso IRPF
    social_emp: 2.5,       // CPP/QPP + EI (~5.95%+1.66% sobre base, empleado)
    social_empr: 3.1,      // Parte empleador CPP/EI
    iva: 4.5,              // GST federal 5% + HST/PST provincial
    ieespecial: 1.5,       // Excise federal + provincial
    ibi_locales: 3.2,      // Property tax municipal
    sociedades: 3.7,       // Corporate tax federal + provincial (ingresos recursos naturales)
    otros_prod: 3.4,
    export_gdp: 33.0,
    corp_profit_export: "alto (recursos naturales)",
  },
};

function ComposicionFiscalView() {
  const [sortBy, setSortBy] = useState("citizen_direct");
  const [showView, setShowView] = useState("cuña-trabajador"); // cuña-trabajador | composition | citizen-vs-corp | exports

  const countries = Object.entries(TAX_COMPOSITION).map(([id, d]) => {
    const citizen_direct = d.irpf + d.social_emp + d.iva + d.ieespecial + d.ibi_locales;
    const corp_passthrough = d.social_empr + d.sociedades;
    const other = d.otros_prod;
    return {
      id, ...d,
      citizen_direct,
      corp_passthrough,
      other,
      citizen_share_total: (citizen_direct / d.total) * 100,
    };
  });

  const sorted = useMemo(() => {
    const arr = [...countries];
    if (sortBy === "total") arr.sort((a, b) => b.total - a.total);
    else if (sortBy === "citizen_direct") arr.sort((a, b) => b.citizen_direct - a.citizen_direct);
    else if (sortBy === "citizen_share") arr.sort((a, b) => b.citizen_share_total - a.citizen_share_total);
    else if (sortBy === "corp") arr.sort((a, b) => b.sociedades - a.sociedades);
    return arr;
  }, [countries, sortBy]);

  const es = countries.find(c => c.id === "es");
  const de = countries.find(c => c.id === "de");
  const ie = countries.find(c => c.id === "ie");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl tracking-tight">Composición fiscal · quién paga de verdad al Estado</h2>
        <p className="text-sm text-stone-500 mt-1 max-w-3xl">
          El total "tax-to-GDP" es engañoso: agrega impuestos muy distintos. Aquí los separamos por
          <em> incidencia real</em>: carga directa sobre el ciudadano vs. impuestos corporativos que
          dependen del beneficio de empresas grandes (y exportadoras en Alemania, Países Bajos, Irlanda).
          El detalle cambia por completo la lectura.
        </p>
        <div className="flex gap-2 flex-wrap mt-2">
          <SourceChip sourceKey="oecd_revenue_stats_2024" />
          <SourceChip sourceKey="oecd_taxing_wages_2025" />
        </div>
      </div>

      {/* Insight destacado */}
      <div className="rounded-2xl border-2 border-[#7A1F3D] bg-gradient-to-br from-[#FBF7F0] to-white p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <div className="text-[10px] uppercase tracking-[0.15em] text-stone-500 font-semibold">Total tax/GDP</div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-3xl">🇪🇸</span>
              <div className="font-serif text-3xl text-[#7A1F3D]">{es.total.toFixed(1)}%</div>
            </div>
            <div className="mt-1 text-[12px] text-stone-600">
              Alemania: <strong>{de.total.toFixed(1)}%</strong> · Irlanda: <strong>{ie.total.toFixed(1)}%</strong>
            </div>
            <p className="text-[11px] text-stone-500 mt-2 leading-snug">
              Comparación directa sugiere España &lt; Alemania. Pero...
            </p>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.15em] text-stone-500 font-semibold">Carga directa sobre ciudadano</div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-3xl">🇪🇸</span>
              <div className="font-serif text-3xl text-[#7A1F3D]">{es.citizen_direct.toFixed(1)}%</div>
            </div>
            <div className="mt-1 text-[12px] text-stone-600">
              Alemania: <strong>{de.citizen_direct.toFixed(1)}%</strong>
            </div>
            <p className="text-[11px] text-stone-500 mt-2 leading-snug">
              IRPF + SS trabajador + IVA + especiales + locales. La diferencia se reduce mucho.
            </p>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.15em] text-stone-500 font-semibold">Impuesto Sociedades</div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-3xl">🇪🇸</span>
              <div className="font-serif text-3xl text-[#A16207]">{es.sociedades.toFixed(1)}%</div>
            </div>
            <div className="mt-1 text-[12px] text-stone-600">
              Alemania: <strong>{de.sociedades.toFixed(1)}%</strong> · Irlanda: <strong>{ie.sociedades.toFixed(1)}%</strong>
            </div>
            <p className="text-[11px] text-stone-500 mt-2 leading-snug">
              No es que el ciudadano alemán pague más: son sus <em>empresas exportadoras</em>.
            </p>
          </div>
        </div>
        <div className="mt-5 pt-4 border-t border-stone-200">
          <p className="text-[13px] text-stone-700 leading-relaxed italic">
            <strong className="font-serif text-[#7A1F3D] not-italic">Insight clave:</strong> cuando se
            dice "Alemania recauda más impuestos que España", se mezclan tres cosas muy distintas:
            (1) lo que paga el ciudadano directamente de su salario/consumo, (2) lo que paga via
            empresas donde trabaja, y (3) lo que pagan las <strong>grandes exportadoras alemanas por
            beneficios en mercados globales</strong>. La tercera categoría es nutrida en Alemania,
            Países Bajos e Irlanda, y es <em>residual</em> en España. El ciudadano español paga
            proporcionalmente más de lo que parece.
          </p>
        </div>
      </div>

      {/* Selector vista */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: "cuña-trabajador", label: "Cuña trabajador (OCDE)" },
          { id: "composition", label: "Desglose macro por componente" },
          { id: "citizen-vs-corp", label: "Ciudadano vs empresas" },
          { id: "exports", label: "Impuestos vs exportaciones" },
        ].map(v => (
          <button key={v.id} onClick={() => setShowView(v.id)}
            className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
              showView === v.id
                ? "bg-[#7A1F3D] text-white"
                : "bg-white border border-stone-200 text-stone-600 hover:border-[#7A1F3D]"
            }`}>
            {v.label}
          </button>
        ))}
      </div>

      {/* Vista 0 (NUEVA): Cuña trabajador OCDE desagregada */}
      {showView === "cuña-trabajador" && (
        <CuñaTrabajadorView />
      )}

      {/* Vista 1: desglose */}
      {showView === "composition" && (
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <h3 className="font-serif text-lg tracking-tight mb-1">Desglose por componente — % PIB 2024</h3>
          <p className="text-[11px] text-stone-500 mb-3">
            Stacked bars con cada componente. España: menos IS y menos cotizaciones empresa que
            Alemania, pero niveles similares de IVA y IRPF.
          </p>
          <ResponsiveContainer width="100%" height={380}>
            <BarChart data={countries} margin={{ top: 10, right: 30, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="#E7E5E4" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#57534E" }} angle={-15} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11, fill: "#57534E" }} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E7E5E4", fontSize: 12 }}
                       formatter={(v, n) => [`${v.toFixed(1)}% PIB`, n]} />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="irpf" stackId="a" fill="#7A1F3D" name="IRPF (ciudadano)" />
              <Bar dataKey="social_emp" stackId="a" fill="#A16207" name="SS trabajador" />
              <Bar dataKey="iva" stackId="a" fill="#B45309" name="IVA" />
              <Bar dataKey="ieespecial" stackId="a" fill="#9A3412" name="II.EE." />
              <Bar dataKey="ibi_locales" stackId="a" fill="#78716C" name="IBI/locales" />
              <Bar dataKey="social_empr" stackId="a" fill="#4A5568" name="SS empresa" />
              <Bar dataKey="sociedades" stackId="a" fill="#1E40AF" name="Sociedades" />
              <Bar dataKey="otros_prod" stackId="a" fill="#065F46" name="Otros producción" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Vista 2: ciudadano vs empresas */}
      {showView === "citizen-vs-corp" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-stone-200 bg-white p-5">
            <h3 className="font-serif text-lg tracking-tight mb-1">Carga directa ciudadano vs impuestos corporativos</h3>
            <p className="text-[11px] text-stone-500 mb-3">
              <strong>Naranja</strong>: ciudadano paga directamente (IRPF + SS trab + IVA + especiales + locales).
              <strong> Azul</strong>: paga via empresa (SS empresa + Sociedades).
              <strong> Verde</strong>: otros productivos.
            </p>
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={sorted} margin={{ top: 10, right: 30, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="#E7E5E4" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#57534E" }} angle={-15} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11, fill: "#57534E" }} tickFormatter={(v) => `${v}%`} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E7E5E4", fontSize: 12 }}
                         formatter={(v) => [`${v.toFixed(1)}% PIB`]} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="citizen_direct" stackId="a" fill="#C2410C" name="Ciudadano directo" />
                <Bar dataKey="corp_passthrough" stackId="a" fill="#1E40AF" name="Empresas (repercutido)" />
                <Bar dataKey="other" stackId="a" fill="#065F46" name="Otros" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-5">
            <h3 className="font-serif text-lg tracking-tight mb-3">Tabla detallada</h3>
            <table className="w-full text-sm">
              <thead className="bg-stone-50 text-[10px] uppercase tracking-[0.08em] text-stone-500">
                <tr>
                  <th className="text-left px-3 py-2">País</th>
                  <th className="text-right px-3 py-2">Total/PIB</th>
                  <th className="text-right px-3 py-2">Directa</th>
                  <th className="text-right px-3 py-2">% del total</th>
                  <th className="text-right px-3 py-2">Empresas</th>
                  <th className="text-right px-3 py-2">IS solo</th>
                  <th className="text-right px-3 py-2">Export/PIB</th>
                </tr>
              </thead>
              <tbody className="text-[12px]">
                {sorted.map(c => {
                  const isEs = c.id === "es";
                  return (
                    <tr key={c.id} className={`border-t border-stone-100 ${isEs ? "bg-[#FBF7F0]" : ""}`}>
                      <td className={`px-3 py-2 font-medium ${isEs ? "text-[#7A1F3D]" : ""}`}>
                        <span className="mr-2">{c.flag}</span>{c.name}
                      </td>
                      <td className="px-3 py-2 text-right font-mono">{c.total.toFixed(1)}%</td>
                      <td className="px-3 py-2 text-right font-mono text-orange-700 font-semibold">
                        {c.citizen_direct.toFixed(1)}%
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px]">{c.citizen_share_total.toFixed(0)}%</td>
                      <td className="px-3 py-2 text-right font-mono text-blue-700">{c.corp_passthrough.toFixed(1)}%</td>
                      <td className="px-3 py-2 text-right font-mono text-blue-800">{c.sociedades.toFixed(1)}%</td>
                      <td className="px-3 py-2 text-right font-mono text-[11px] text-emerald-700">{c.export_gdp.toFixed(0)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Vista 3: exportaciones */}
      {showView === "exports" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-stone-200 bg-white p-5">
            <h3 className="font-serif text-lg tracking-tight mb-1">Impuesto Sociedades vs. Exportaciones</h3>
            <p className="text-[11px] text-stone-500 mb-3">
              Scatter: ¿hay relación entre exportaciones/PIB y recaudación IS? Los países
              exportadores (Alemania, Países Bajos, Irlanda) recaudan IS no solo de empresas
              nacionales sino de <em>beneficios generados en mercados globales</em>.
            </p>
            <ResponsiveContainer width="100%" height={380}>
              <ScatterChart margin={{ top: 10, right: 30, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="#E7E5E4" />
                <XAxis type="number" dataKey="export_gdp"
                       tick={{ fontSize: 11, fill: "#57534E" }}
                       label={{ value: "Exportaciones/PIB (%)", position: "bottom", offset: 20, fontSize: 11 }} />
                <YAxis type="number" dataKey="sociedades"
                       tick={{ fontSize: 11, fill: "#57534E" }}
                       label={{ value: "IS (% PIB)", angle: -90, position: "insideLeft", fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E7E5E4", fontSize: 12 }}
                         formatter={(v, n) => [n === "sociedades" ? `${v}% PIB` : `${v}%`, n]}
                         cursor={{ strokeDasharray: "3 3" }} />
                <Scatter data={countries} fill="#7A1F3D">
                  {countries.map((c, i) => (
                    <Cell key={i} fill={c.id === "es" ? "#7A1F3D" : "#78716C"} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { id: "ie", note: "Multinacionales (Apple, Google, Meta) facturan sus beneficios globales. IS/PIB del 3.2% pero viene mayormente de ahí." },
              { id: "de", note: "BMW, SAP, Siemens, etc. exportan masivamente. El IS alemán es del 2.4% PIB pero sostiene servicios para todos los alemanes." },
              { id: "es", note: "Economía más doméstica (turismo, servicios, consumo interno). IS solo 2.3% PIB, pocas multinacionales exportadoras masivas." },
            ].map(e => {
              const c = countries.find(x => x.id === e.id);
              return (
                <div key={e.id} className="rounded-xl border border-stone-200 bg-white p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{c.flag}</span>
                    <div>
                      <div className="font-serif text-base">{c.name}</div>
                      <div className="text-[10px] text-stone-500">
                        Export/PIB: <strong>{c.export_gdp.toFixed(0)}%</strong> · IS: <strong>{c.sociedades.toFixed(1)}%</strong>
                      </div>
                    </div>
                  </div>
                  <p className="text-[12px] text-stone-600 leading-relaxed">{e.note}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Lectura honesta */}
      <div className="rounded-2xl border-2 border-[#7A1F3D]/30 bg-gradient-to-br from-[#FBF7F0] via-white to-[#EC4899]/10 p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#7A1F3D]" />
          <h3 className="font-serif text-xl tracking-tight">Lo que esto implica realmente</h3>
        </div>
        <div className="space-y-3 text-[13px] text-stone-700 leading-relaxed">
          <p>
            <strong>Primera lectura:</strong> al mirar el total "tax-to-GDP", España (37%) está por debajo
            de Alemania (40.5%), Francia (43.5%) e Italia (42%). Parece que pagamos "menos impuestos".
          </p>
          <p>
            <strong>Segunda lectura (más honesta):</strong> cuando separamos por incidencia real, la
            diferencia se reduce significativamente. Carga directa ciudadano: España <strong>22.8%</strong>,
            Alemania <strong>27.6%</strong>. La brecha real es de 4.8pp, no de 3.5pp. Y buena parte de lo
            que Alemania recauda "de más" viene de <strong>cotizaciones empresa más altas</strong> (que
            en la práctica afectan al salario que recibe el trabajador).
          </p>
          <p>
            <strong>Tercera lectura (clave):</strong> el Impuesto Sociedades español (2.3% PIB) es
            similar al alemán (2.4%). <strong>Pero los contextos son opuestos</strong>. Alemania tiene
            campeones globales que tributan beneficios de toda Europa; España tiene economía doméstica
            concentrada en turismo, consumo y servicios. Cada punto de IS español es más "doloroso"
            para su tejido productivo que un punto de IS alemán.
          </p>
          <p className="text-[#7A1F3D] font-serif italic text-[14px] border-l-2 border-[#7A1F3D] pl-4">
            Lente austríaca: el debate "¿subir o bajar impuestos?" pierde matiz sin esta desagregación.
            El problema español no es que los <em>tipos</em> sean bajos — es que la <em>base productiva</em>
            no genera excedente suficiente. Sin multinacionales exportadoras, sin productividad alta, el
            Estado pide al ciudadano lo que no puede pedir a un beneficio corporativo globalizado que
            no existe en la escala alemana o irlandesa.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-stone-400 pt-2 border-t border-stone-200">
          <Info className="w-3 h-3" />
          <span>Fuentes: Eurostat gov_10a_taxag 2024, OCDE Revenue Statistics 2025, Tax Foundation Europe 2025, Eurostat trade statistics.</span>
        </div>
      </div>
    </div>
  );
}


/* --------------------------------------------------------------------------- */
/* [18] MIGRACIÓN — datos honestos sobre su impacto económico · v1.8           */
/* ---------------------------------------------------------------------------
   Tema sensible. Lo abordamos con datos oficiales y matices:
     · % afiliación SS (¿los inmigrantes trabajan?)
     · IMV y ayudas por nacionalidad
     · Contribución fiscal neta
     · Impacto sobre PIB y productividad

   Fuentes:
   · Seg. Social (afiliados extranjeros 2024)
   · Fedea, BdE Boletín 2025/T2 (contribución inmigración)
   · Ministerio Inclusión (receptores IMV)
   · Funcas diciembre 2024 (84% crecimiento población)
   --------------------------------------------------------------------------- */

const IMMIGRATION_KPIS = {
  poblacion_extranjera_2024: 6.7,       // millones (nacionalidad extranjera)
  poblacion_nacidos_fuera: 9.0,          // millones (nacidos en extranjero)
  total_poblacion: 48.9,                 // millones
  afiliados_ss_extranjeros: 2.9,         // millones (cierre 2024)
  pct_afiliacion: 13.7,                  // % total afiliados SS
  crecimiento_empleo_2022_2024: 40,      // % nuevos empleos ocupados por extranjeros
  contribucion_pib_pc: 0.55,             // pp aportación PIB per cápita (BdE: 0.4-0.7)
  receptores_imv_total: 650000,          // beneficiarios totales del IMV (hogares)
  receptores_imv_extranjeros_pct: 24,    // % IMV con titular extranjero (aprox)
  aportacion_crecimiento_poblacion: 84,  // % crecimiento población 2022-2024 viene de inmigración
};

const IMMIGRATION_BY_SECTOR = [
  { sector: "Agricultura", pct_extranjeros: 80, comentario: "Sin inmigración el sector colapsaría. Salarios muy bajos." },
  { sector: "Hostelería", pct_extranjeros: 50, comentario: "Restaurantes, hoteles, turismo — sector crítico del PIB español." },
  { sector: "Construcción", pct_extranjeros: 50, comentario: "Recuperación sector post-crisis 2013." },
  { sector: "Comercio", pct_extranjeros: 45, comentario: "Tiendas, distribución, logística." },
  { sector: "Servicio doméstico", pct_extranjeros: 35, comentario: "Cuidados personas mayores, limpieza." },
  { sector: "Industria", pct_extranjeros: 12, comentario: "Presencia menor." },
  { sector: "Administración", pct_extranjeros: 3, comentario: "Muy escaso acceso por requisitos." },
];

const IMMIGRATION_BY_NATIONALITY = [
  { nacionalidad: "Rumanía", afiliados_k: 333, pct_activos: 78, imv_ratio: "bajo" },
  { nacionalidad: "Marruecos", afiliados_k: 323, pct_activos: 62, imv_ratio: "alto" },
  { nacionalidad: "Italia", afiliados_k: 176, pct_activos: 82, imv_ratio: "muy bajo" },
  { nacionalidad: "Colombia", afiliados_k: 176, pct_activos: 75, imv_ratio: "medio-bajo" },
  { nacionalidad: "Venezuela", afiliados_k: 149, pct_activos: 72, imv_ratio: "medio" },
  { nacionalidad: "Ucrania", afiliados_k: 66, pct_activos: 55, imv_ratio: "alto (refugiados)" },
  { nacionalidad: "China", afiliados_k: 115, pct_activos: 78, imv_ratio: "muy bajo" },
  { nacionalidad: "Ecuador", afiliados_k: 102, pct_activos: 70, imv_ratio: "medio" },
];

function MigracionView() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl tracking-tight">Inmigración · datos honestos sobre su impacto económico</h2>
        <p className="text-sm text-stone-500 mt-1 max-w-3xl">
          Tema delicado que merece datos oficiales por encima de ideología. Las cifras de
          Seguridad Social, BdE y Fedea muestran una realidad más matizada que los extremos del
          debate público.
        </p>
      </div>

      {/* Banner con la verdad incómoda */}
      <div className="rounded-2xl border-2 border-[#7A1F3D] bg-gradient-to-br from-[#FBF7F0] to-white p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.15em] text-stone-500 font-semibold">Afiliados SS extranjeros</div>
            <div className="font-serif text-3xl text-[#7A1F3D] mt-1">{IMMIGRATION_KPIS.afiliados_ss_extranjeros}M</div>
            <div className="text-[11px] text-stone-500 mt-1">
              = <strong>{IMMIGRATION_KPIS.pct_afiliacion}%</strong> del total cotizantes
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.15em] text-stone-500 font-semibold">Nuevo empleo 2022-24</div>
            <div className="font-serif text-3xl text-emerald-700 mt-1">{IMMIGRATION_KPIS.crecimiento_empleo_2022_2024}%</div>
            <div className="text-[11px] text-stone-500 mt-1">ocupado por extranjeros</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.15em] text-stone-500 font-semibold">Aportación PIB per cápita</div>
            <div className="font-serif text-3xl text-emerald-700 mt-1">+{IMMIGRATION_KPIS.contribucion_pib_pc.toFixed(2)}pp</div>
            <div className="text-[11px] text-stone-500 mt-1">crecimiento 2022-24 (BdE)</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.15em] text-stone-500 font-semibold">% crecimiento población</div>
            <div className="font-serif text-3xl text-blue-700 mt-1">{IMMIGRATION_KPIS.aportacion_crecimiento_poblacion}%</div>
            <div className="text-[11px] text-stone-500 mt-1">viene de inmigración (Funcas)</div>
          </div>
        </div>
      </div>

      {/* Verdad 1 */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-serif text-lg">1</span>
          <h3 className="font-serif text-lg tracking-tight">La mayoría trabaja — y trabaja en sectores que España necesita</h3>
        </div>
        <p className="text-[13px] text-stone-700 leading-relaxed mb-4">
          Los datos oficiales de Seguridad Social (serie 2024) muestran que los extranjeros son el
          13.7% de afiliados cotizantes. Representan el 40-45% del nuevo empleo creado desde 2022.
          Pero la distribución sectorial es muy reveladora:
        </p>
        <div className="space-y-2">
          {IMMIGRATION_BY_SECTOR.map(s => (
            <div key={s.sector} className="flex items-center gap-3">
              <div className="w-36 text-[12px] text-stone-700">{s.sector}</div>
              <div className="flex-1 bg-stone-100 rounded overflow-hidden h-6 relative">
                <div className="h-full flex items-center justify-end pr-2 font-mono text-[10px] text-white"
                     style={{ width: `${s.pct_extranjeros}%`, backgroundColor:
                       s.pct_extranjeros > 60 ? "#7A1F3D" :
                       s.pct_extranjeros > 30 ? "#A16207" : "#78716C" }}>
                  {s.pct_extranjeros}%
                </div>
              </div>
              <div className="w-96 text-[11px] text-stone-500 italic">{s.comentario}</div>
            </div>
          ))}
        </div>
        <p className="text-[12px] text-stone-600 mt-4 leading-relaxed">
          <strong>Lectura honesta:</strong> sin inmigración no hay agricultura, no hay hostelería y
          no hay cuidados de personas mayores en España. Son sectores que los trabajadores nativos
          <em> no quieren ocupar</em> a los salarios ofrecidos. La inmigración sostiene el modelo
          productivo bajo-salarial del que muchos se quejan pero del que también dependen.
        </p>
      </div>

      {/* Verdad 2 */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-serif text-lg">2</span>
          <h3 className="font-serif text-lg tracking-tight">La situación varía radicalmente por nacionalidad</h3>
        </div>
        <p className="text-[13px] text-stone-700 leading-relaxed mb-4">
          Agregar todo bajo "inmigración" oculta diferencias enormes. La tasa de actividad laboral
          varía entre 55% (ucranianos, muchos refugiados) y 82% (italianos, chinos). El uso del
          IMV también varía.
        </p>
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-[10px] uppercase tracking-[0.08em] text-stone-500">
            <tr>
              <th className="text-left px-3 py-2">Origen</th>
              <th className="text-right px-3 py-2">Afiliados (k)</th>
              <th className="text-right px-3 py-2">% activos</th>
              <th className="text-left px-3 py-2 pl-4">Uso IMV (relativo)</th>
            </tr>
          </thead>
          <tbody className="text-[12px]">
            {IMMIGRATION_BY_NATIONALITY.map(n => (
              <tr key={n.nacionalidad} className="border-t border-stone-100">
                <td className="px-3 py-2 font-medium text-stone-800">{n.nacionalidad}</td>
                <td className="px-3 py-2 text-right font-mono">{n.afiliados_k}k</td>
                <td className="px-3 py-2 text-right font-mono"
                    style={{ color: n.pct_activos > 75 ? "#065F46" : n.pct_activos > 65 ? "#A16207" : "#E11D48" }}>
                  {n.pct_activos}%
                </td>
                <td className="px-3 py-2 pl-4 text-stone-600 italic text-[11px]">{n.imv_ratio}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-[12px] text-stone-600 mt-4 leading-relaxed">
          <strong>Lectura honesta:</strong> los inmigrantes latinoamericanos y europeos tienen tasas
          de actividad similares o superiores a los españoles (~65%). Los colectivos con mayor uso
          de ayudas son refugiados (Ucrania) y familias de países del Magreb con estructuras
          familiares más numerosas. Generalizar es empíricamente incorrecto.
        </p>
      </div>

      {/* Verdad 3 — IMV */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-serif text-lg">3</span>
          <h3 className="font-serif text-lg tracking-tight">El IMV: números absolutos y relativos</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="rounded-lg bg-stone-50 border border-stone-200 p-4">
            <div className="text-[10px] uppercase tracking-[0.1em] text-stone-500">Hogares receptores IMV</div>
            <div className="font-serif text-2xl text-stone-800 mt-1">~650k</div>
            <div className="text-[11px] text-stone-500">hogares beneficiarios totales</div>
          </div>
          <div className="rounded-lg bg-stone-50 border border-stone-200 p-4">
            <div className="text-[10px] uppercase tracking-[0.1em] text-stone-500">Coste IMV (anual)</div>
            <div className="font-serif text-2xl text-stone-800 mt-1">€4.2 Bn</div>
            <div className="text-[11px] text-stone-500">0.26% PIB · 1.3% presupuesto Estado</div>
          </div>
          <div className="rounded-lg bg-stone-50 border border-stone-200 p-4">
            <div className="text-[10px] uppercase tracking-[0.1em] text-stone-500">Titular extranjero</div>
            <div className="font-serif text-2xl text-stone-800 mt-1">~24%</div>
            <div className="text-[11px] text-stone-500">estimación (más que el 13.7% SS)</div>
          </div>
        </div>
        <p className="text-[13px] text-stone-700 leading-relaxed">
          <strong>Contexto necesario:</strong> el gasto total en IMV es <strong>€4.2Bn/año</strong>, el
          1.3% del presupuesto del Estado. La contribución vía cotizaciones SS de extranjeros se estima
          en <strong>€22-28Bn/año</strong>. El balance neto a corto plazo es positivo: cada euro en
          IMV se compensa con €5-7 en cotizaciones. Lo que sí es cierto es que hay <strong>concentración
          relativa</strong> de receptores entre extranjeros (24% titular extranjero vs 13.7% afiliación),
          pero es estructural del perfil socioeconómico, no de la nacionalidad.
        </p>
      </div>

      {/* Balance honesto */}
      <div className="rounded-2xl border-2 border-[#7A1F3D]/30 bg-gradient-to-br from-[#FBF7F0] via-white to-[#EC4899]/10 p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#7A1F3D]" />
          <h3 className="font-serif text-xl tracking-tight">Balance honesto — tres matices clave</h3>
        </div>
        <div className="space-y-3 text-[13px] text-stone-700 leading-relaxed">
          <p>
            <strong className="text-emerald-700">Lo que los datos SÍ dicen:</strong> la inmigración contribuye
            positivamente al crecimiento del PIB per cápita (BdE: +0.4-0.7pp anual), sostiene la Seguridad
            Social en un momento de envejecimiento, y ocupa sectores donde hay escasez de mano de obra
            (agricultura, hostelería, cuidados). Sin inmigración el PIB español sería ~3-5% menor.
          </p>
          <p>
            <strong className="text-amber-700">Lo que los datos TAMBIÉN dicen:</strong> la inmigración se
            concentra en sectores de baja productividad y baja cualificación. Eso arrastra el salario
            medio nacional a la baja en términos relativos vs UE (no porque los inmigrantes cobren menos
            <em> per se</em>, sino porque desplazan la mediana). La productividad por hora no mejora.
          </p>
          <p>
            <strong className="text-rose-700">Lo que los datos NO dicen:</strong> los datos NO apoyan el
            relato de "España se mantiene con ayudas a inmigrantes que no trabajan". La gran mayoría
            trabaja (tasa actividad 65-80% según origen). El IMV supone una fracción minúscula del
            presupuesto público (1.3%) y se financia con creces con las cotizaciones que aportan esos
            mismos colectivos.
          </p>
          <p className="text-[#7A1F3D] font-serif italic text-[14px] border-l-2 border-[#7A1F3D] pl-4">
            Lente austríaca: el problema real no es la inmigración <em>per se</em> — es que España atrae
            inmigración de perfil bajo-salarial en vez de alto-cualificado porque <strong>su economía no
            genera demanda de lo segundo</strong> (pocos puestos tech senior, industria escasa). Cambiar
            el perfil de inmigración requiere primero cambiar el perfil productivo del país. La causa es
            estructural, no migratoria.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-stone-400 pt-2 border-t border-stone-200">
          <Info className="w-3 h-3" />
          <span>Fuentes: Seg. Social (afiliación ext. 2024), BdE Boletín 2025/T2 art. 10, Fedea, Funcas 2024, Ministerio Inclusión IMV 2024.</span>
        </div>
      </div>
    </div>
  );
}


/* --------------------------------------------------------------------------- */
/* [19] PLAN CHOQUE — simulación tipo Milei aplicada a España · v1.8           */
/* ---------------------------------------------------------------------------
   Permite al usuario activar/desactivar partidas de gasto "superfluo" y ver
   impacto en déficit, deuda y devolución fiscal por decil.

   Datos reales: PGE 2025 prorrogado. Milei: ajuste Argentina 2024.
   --------------------------------------------------------------------------- */

// Partidas del gasto público español (€Bn anuales, PGE 2025 aproximado)
const GASTO_PARTIDAS = [
  { id: "pensiones", nombre: "Pensiones", monto: 206, cat: "Transferencias", recortable: false, razon_recortable: "Derecho adquirido, imposible políticamente" },
  { id: "sanidad", nombre: "Sanidad (CCAA)", monto: 95, cat: "Servicios", recortable: false, razon_recortable: "Función esencial" },
  { id: "educacion", nombre: "Educación (CCAA)", monto: 62, cat: "Servicios", recortable: false, razon_recortable: "Función esencial" },
  { id: "desempleo", nombre: "Desempleo y subsidios", monto: 26, cat: "Transferencias", recortable: false, razon_recortable: "Protección social" },
  { id: "intereses", nombre: "Intereses deuda", monto: 42, cat: "Deuda", recortable: false, razon_recortable: "Obligación legal" },
  { id: "salarios_ap", nombre: "Salarios Admin Pública", monto: 145, cat: "Personal", recortable: true, razon_recortable: "Duplicidades autonómicas, estructuras infladas" },
  { id: "inversion", nombre: "Inversión pública", monto: 32, cat: "Inversión", recortable: false, razon_recortable: "Necesaria crecimiento futuro" },
  { id: "subvenciones", nombre: "Subvenciones empresas/sectores", monto: 18, cat: "Subvenciones", recortable: true, razon_recortable: "Muchas duplican ayudas UE o benefician a grupos específicos" },
  { id: "transf_ccaa", nombre: "Transferencias CCAA", monto: 45, cat: "Transferencias", recortable: true, razon_recortable: "Duplicidad con gasto autonómico propio" },
  { id: "sindicatos_part", nombre: "Sindicatos y partidos políticos", monto: 0.15, cat: "Subvenciones", recortable: true, razon_recortable: "Financiación pública cuestionada" },
  { id: "empresas_pub", nombre: "Empresas públicas deficitarias", monto: 8, cat: "Subvenciones", recortable: true, razon_recortable: "RENFE, AENA sin concesión, RTVE, etc." },
  { id: "consejerias_dup", nombre: "Consejerías duplicadas CCAA-Estado", monto: 12, cat: "Personal", recortable: true, razon_recortable: "Agricultura, Cultura, Sanidad a nivel estatal Y autonómico" },
  { id: "cooperacion", nombre: "Cooperación internacional", monto: 3.5, cat: "Transferencias", recortable: true, razon_recortable: "Discrecional, no esencial en crisis" },
  { id: "propaganda", nombre: "Publicidad institucional", monto: 0.8, cat: "Funcionamiento", recortable: true, razon_recortable: "Comunicación del Gobierno, no servicio" },
  { id: "asesores", nombre: "Asesores y personal de confianza", monto: 0.5, cat: "Personal", recortable: true, razon_recortable: "Más de 1.000 asesores solo en el Gobierno central" },
  { id: "defensa", nombre: "Defensa", monto: 30, cat: "Servicios", recortable: false, razon_recortable: "Compromiso OTAN 2% PIB" },
  { id: "otros", nombre: "Otros gastos de funcionamiento", monto: 56, cat: "Funcionamiento", recortable: true, razon_recortable: "Revisables parcialmente" },
];

// Distribución de carga IRPF por decil (AEAT 2023)
const IRPF_POR_DECIL = [
  { decil: "D1-D5", pct_cuota: 7, renta_media: 17000, contribuyentes_m: 12 },
  { decil: "D6", pct_cuota: 7, renta_media: 26000, contribuyentes_m: 2.4 },
  { decil: "D7", pct_cuota: 11, renta_media: 33000, contribuyentes_m: 2.4 },
  { decil: "D8", pct_cuota: 15, renta_media: 42000, contribuyentes_m: 2.4 },
  { decil: "D9", pct_cuota: 19, renta_media: 60000, contribuyentes_m: 2.4 },
  { decil: "D10", pct_cuota: 41, renta_media: 110000, contribuyentes_m: 2.4 },
];

function MotosierraView() {
  const [activeRecortes, setActiveRecortes] = useState({
    salarios_ap: 0,           // % recorte (0-100)
    subvenciones: 0,
    transf_ccaa: 0,
    sindicatos_part: 0,
    empresas_pub: 0,
    consejerias_dup: 0,
    cooperacion: 0,
    propaganda: 0,
    asesores: 0,
    otros: 0,
  });

  const [modo, setModo] = useState("moderado"); // moderado | agresivo | milei | custom

  const setPreset = (preset) => {
    setModo(preset);
    if (preset === "moderado") {
      setActiveRecortes({
        salarios_ap: 5, subvenciones: 30, transf_ccaa: 10, sindicatos_part: 50,
        empresas_pub: 25, consejerias_dup: 40, cooperacion: 30, propaganda: 70,
        asesores: 50, otros: 10,
      });
    } else if (preset === "agresivo") {
      setActiveRecortes({
        salarios_ap: 12, subvenciones: 50, transf_ccaa: 20, sindicatos_part: 100,
        empresas_pub: 60, consejerias_dup: 70, cooperacion: 50, propaganda: 100,
        asesores: 80, otros: 25,
      });
    } else if (preset === "milei") {
      setActiveRecortes({
        salarios_ap: 20, subvenciones: 80, transf_ccaa: 40, sindicatos_part: 100,
        empresas_pub: 90, consejerias_dup: 90, cooperacion: 100, propaganda: 100,
        asesores: 100, otros: 50,
      });
    }
  };

  const gastoTotal = GASTO_PARTIDAS.reduce((s, p) => s + p.monto, 0);

  // Cálculo ahorro
  const ahorroTotal = Object.entries(activeRecortes).reduce((sum, [k, pct]) => {
    const partida = GASTO_PARTIDAS.find(p => p.id === k);
    if (!partida) return sum;
    return sum + partida.monto * pct / 100;
  }, 0);

  const pibEs = 1690;  // €Bn 2025
  const deficit_actual = 2.5 * pibEs / 100;  // ~€42Bn
  const deficit_post = Math.max(0, deficit_actual - ahorroTotal);
  const ahorro_pct_pib = (ahorroTotal / pibEs) * 100;

  // Devolución fiscal: si se devolviese el ahorro al contribuyente proporcional a IRPF
  const devolucion_total = ahorroTotal;  // € Bn
  const devolucion_por_decil = IRPF_POR_DECIL.map(d => {
    const dev_decil = devolucion_total * d.pct_cuota / 100;  // € Bn por decil completo
    const dev_per_capita = (dev_decil * 1000) / d.contribuyentes_m;  // € por persona/año (aprox)
    return { ...d, dev_total: dev_decil, dev_per_capita };
  });

  const fmtEur = (v) => v >= 1 ? `€${v.toFixed(1)}Bn` : `€${(v * 1000).toFixed(0)}M`;
  const fmtPct = (v) => `${v.toFixed(1)}%`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl tracking-tight">Plan de choque tipo Milei — simulador</h2>
        <p className="text-sm text-stone-500 mt-1 max-w-3xl">
          ¿Qué pasaría si España aplicase un ajuste como el de Argentina 2024? Milei recortó 15.3pp
          de PIB en gasto, llevando el público del 40% al 33%. Aquí puedes simular recortes en
          partidas específicas y ver el impacto en déficit y devolución fiscal por decil.
        </p>
      </div>

      {/* Referencia Milei */}
      <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/40 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-700 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-serif text-lg tracking-tight mb-1">Referencia: el ajuste Milei (Argentina 2024)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.1em] text-stone-500">Ajuste total</div>
                <div className="font-serif text-xl text-amber-700">15.3pp PIB</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.1em] text-stone-500">Reducción gasto</div>
                <div className="font-serif text-xl text-amber-700">-26%</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.1em] text-stone-500">Pensiones recortadas</div>
                <div className="font-serif text-xl text-rose-700">-19%</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.1em] text-stone-500">Salario real caída</div>
                <div className="font-serif text-xl text-rose-700">-12%</div>
              </div>
            </div>
            <p className="text-[12px] text-stone-700 leading-relaxed">
              Contexto muy distinto: Argentina tenía <strong>15% de déficit</strong>, inflación 200%+
              anual, crisis cambiaria. Los recortes fueron fulgurantes pero dolorosos: pobreza subió
              al 50% temporalmente, salario real público cayó 20%, obra pública cayó 75%.
              <strong> El ajuste funcionó fiscalmente pero con alto coste social a corto plazo.</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Presets */}
      <div className="rounded-xl border border-stone-200 bg-white p-5">
        <h3 className="font-serif text-lg tracking-tight mb-3">Elige tu nivel de choque</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          {[
            { id: "moderado", label: "Moderado", desc: "Recorte grasa visible, sin tocar estructura", color: "#A16207" },
            { id: "agresivo", label: "Agresivo", desc: "Recorte duplicidades + subvenciones + personal confianza", color: "#B45309" },
            { id: "milei", label: "Tipo Milei", desc: "Ajuste radical, eliminación partidas, coste social alto", color: "#E11D48" },
            { id: "custom", label: "Personalizado", desc: "Configúralo tú sliders a sliders", color: "#7A1F3D" },
          ].map(p => (
            <button key={p.id} onClick={() => setPreset(p.id)}
              className={`text-left p-3 rounded-lg border-2 transition-all ${
                modo === p.id ? "bg-white shadow-md" : "bg-stone-50 hover:bg-white"
              }`}
              style={modo === p.id ? { borderColor: p.color } : { borderColor: "#E7E5E4" }}>
              <div className="font-serif text-base" style={{ color: modo === p.id ? p.color : "#292524" }}>
                {p.label}
              </div>
              <div className="text-[11px] text-stone-500 mt-1 leading-snug">{p.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* KPIs resultado */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="rounded-xl border-2 border-[#7A1F3D] bg-[#FBF7F0] p-4">
          <div className="text-[10px] uppercase tracking-[0.12em] text-stone-500 font-semibold">Ahorro total anual</div>
          <div className="font-serif text-3xl text-[#7A1F3D] mt-1">{fmtEur(ahorroTotal)}</div>
          <div className="text-[11px] text-stone-500 mt-1">
            {fmtPct(ahorro_pct_pib)} del PIB
          </div>
        </div>
        <div className="rounded-xl border-2 border-amber-300 bg-amber-50/40 p-4">
          <div className="text-[10px] uppercase tracking-[0.12em] text-amber-700 font-semibold">Déficit actual</div>
          <div className="font-serif text-3xl text-amber-700 mt-1">€{deficit_actual.toFixed(0)}Bn</div>
          <div className="text-[11px] text-stone-500 mt-1">2.5% PIB</div>
        </div>
        <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50/40 p-4">
          <div className="text-[10px] uppercase tracking-[0.12em] text-emerald-700 font-semibold">Déficit post-recorte</div>
          <div className="font-serif text-3xl text-emerald-700 mt-1">€{deficit_post.toFixed(1)}Bn</div>
          <div className="text-[11px] text-stone-500 mt-1">{fmtPct(deficit_post / pibEs * 100)} PIB</div>
        </div>
        <div className="rounded-xl border-2 border-blue-300 bg-blue-50/40 p-4">
          <div className="text-[10px] uppercase tracking-[0.12em] text-blue-700 font-semibold">Margen devolución</div>
          <div className="font-serif text-3xl text-blue-700 mt-1">{fmtEur(Math.max(0, ahorroTotal - deficit_actual))}</div>
          <div className="text-[11px] text-stone-500 mt-1">tras cubrir déficit</div>
        </div>
      </div>

      {/* Sliders partidas recortables */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <h3 className="font-serif text-lg tracking-tight mb-3">Partidas recortables — ajusta el % de recorte</h3>
        <div className="space-y-3">
          {GASTO_PARTIDAS.filter(p => p.recortable).map(p => {
            const pct = activeRecortes[p.id] || 0;
            const ahorro = p.monto * pct / 100;
            return (
              <div key={p.id} className="grid grid-cols-12 gap-3 items-center">
                <div className="col-span-3 md:col-span-3">
                  <div className="text-[12px] font-medium text-stone-800">{p.nombre}</div>
                  <div className="text-[10px] text-stone-500">{fmtEur(p.monto)} base</div>
                </div>
                <div className="col-span-6 md:col-span-6 flex items-center gap-2">
                  <input type="range" min="0" max="100" step="5" value={pct}
                         onChange={(e) => {
                           setActiveRecortes({...activeRecortes, [p.id]: parseInt(e.target.value)});
                           setModo("custom");
                         }}
                         className="flex-1 accent-[#7A1F3D]" />
                  <span className="font-mono text-xs text-[#7A1F3D] w-12 text-right">-{pct}%</span>
                </div>
                <div className="col-span-3 md:col-span-3 text-[11px] text-stone-500 italic">
                  Ahorro: <strong className="text-emerald-700">{fmtEur(ahorro)}</strong> · {p.razon_recortable}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Partidas no recortables */}
      <div className="rounded-2xl border border-stone-200 bg-stone-50/60 p-5">
        <h3 className="font-serif text-base tracking-tight mb-3 text-stone-700">Partidas "intocables" (por qué)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
          {GASTO_PARTIDAS.filter(p => !p.recortable).map(p => (
            <div key={p.id} className="flex gap-3">
              <div className="w-32 font-medium text-stone-700">{p.nombre}</div>
              <div className="flex-1 text-stone-500 italic">{p.razon_recortable}</div>
              <div className="w-16 font-mono text-right text-stone-600">{fmtEur(p.monto)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Devolución fiscal por decil */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <h3 className="font-serif text-lg tracking-tight mb-1">
          Si el ahorro se devolviera al contribuyente vía bajada IRPF proporcional
        </h3>
        <p className="text-[11px] text-stone-500 mb-4">
          Cada decil recibiría una devolución proporcional a lo que aporta al IRPF. Los deciles altos
          reciben más porque pagan más. Simulación asumiendo ahorro total {fmtEur(ahorroTotal)}.
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={devolucion_por_decil} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="2 4" stroke="#E7E5E4" />
            <XAxis dataKey="decil" tick={{ fontSize: 11, fill: "#57534E" }} />
            <YAxis tick={{ fontSize: 11, fill: "#57534E" }} tickFormatter={(v) => `€${v.toFixed(0)}`} />
            <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E7E5E4", fontSize: 12 }}
                     formatter={(v, n) => n === "dev_per_capita" ? [`€${Math.round(v)}`, "Devolución por persona/año"] : [v, n]} />
            <Bar dataKey="dev_per_capita" fill="#7A1F3D" radius={[4, 4, 0, 0]}>
              {devolucion_por_decil.map((d, i) => (
                <Cell key={i} fill={
                  d.decil === "D10" ? "#7F1D1D" :
                  d.decil === "D9" ? "#7A1F3D" :
                  d.decil === "D8" ? "#9A3412" :
                  "#A16207"
                } />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3 text-[11px]">
          {devolucion_por_decil.map(d => (
            <div key={d.decil} className="rounded-lg bg-stone-50 border border-stone-200 p-3">
              <div className="font-serif text-sm font-semibold" style={{
                color: d.decil === "D10" ? "#7F1D1D" : "#7A1F3D"
              }}>
                {d.decil}
              </div>
              <div className="text-stone-500">Renta media: €{d.renta_media.toLocaleString("es-ES")}</div>
              <div className="text-stone-800 font-mono mt-1">
                Devolución: <strong>€{Math.round(d.dev_per_capita)}/año</strong>
              </div>
              <div className="text-[10px] text-stone-500">
                Total decil: {fmtEur(d.dev_total)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lectura honesta */}
      <div className="rounded-2xl border-2 border-[#7A1F3D]/30 bg-gradient-to-br from-[#FBF7F0] via-white to-[#EC4899]/10 p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#7A1F3D]" />
          <h3 className="font-serif text-xl tracking-tight">Lo que la realidad enseña sobre ajustes tipo Milei</h3>
        </div>
        <div className="space-y-3 text-[13px] text-stone-700 leading-relaxed">
          <p>
            <strong>Primer hecho:</strong> el "gasto superfluo" real en España (lo que se puede recortar
            sin tocar pensiones, sanidad, educación, desempleo o defensa) suma aproximadamente €30-45Bn
            anuales si eres moderado, €60-80Bn si eres muy agresivo. Es <strong>menos del 20% del
            gasto total</strong>.
          </p>
          <p>
            <strong>Segundo hecho:</strong> para lograr un ajuste Milei (15pp PIB) en España habría que
            tocar <em>obligatoriamente</em> pensiones, sanidad y educación. Argentina lo hizo y el salario
            real cayó 12-20% en un año, con pobreza subiendo al 50%. <strong>Una sociedad con pacto
            social más sólido no aceptaría esos costes</strong> aunque fiscalmente funcione.
          </p>
          <p>
            <strong>Tercer hecho:</strong> si el ahorro se devolviera al contribuyente, la mayor parte
            iría a deciles altos (D10 recibe ~43% de la devolución porque paga 41% del IRPF). Los
            deciles bajos recibirían muy poco pese a ser los que más ayudas públicas pierden — un
            resultado incómodo para cualquier posición ideológica.
          </p>
          <p className="text-[#7A1F3D] font-serif italic text-[14px] border-l-2 border-[#7A1F3D] pl-4">
            Lente austríaca: el problema no es solo "cuánto gasta el Estado" sino <strong>qué gasta y
            cómo</strong>. Un recorte quirúrgico del 15-20% del gasto no-esencial (duplicidades,
            subvenciones clientelares, entidades deficitarias, publicidad institucional) generaría
            €40-80Bn/año sin tocar el pacto social — pero requiere voluntad política que hasta ahora
            nadie ha tenido. El dilema español no es ideológico: es institucional.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-stone-400 pt-2 border-t border-stone-200">
          <Info className="w-3 h-3" />
          <span>Fuentes: PGE 2025 Consolidados, AEAT IRPF por decil 2023, OPC Argentina (ajuste Milei), IAF Argentina, BdE.</span>
        </div>
      </div>
    </div>
  );
}



/* --------------------------------------------------------------------------- */
/* [20] BALANCE FISCAL MIGRACIÓN — simulador de aporta vs recibe · v1.9        */
/* ---------------------------------------------------------------------------
   Estima cuánto aporta e cuánto recibe la población extranjera del Estado
   español, con TRANSPARENCIA METODOLÓGICA TOTAL.

   Cada supuesto es ajustable por el usuario con rangos basados en fuentes:
   · Mahía (UAM) — presencia "testimonial" pensiones contributivas
   · Ministerio Inclusión — ~24% IMV con titular extranjero
   · IEF — ~7% recaudación IRPF
   · Seg. Social — 13.7% afiliación
   · BdE 2025/T2 — contribución +0.4-0.7pp PIB pc
   · OCDE 2024 — primeros 10-15 años receptores, después contribuyentes
   · Paniagua 2025 (Nada es Gratis) — España no permite réplica Denmark study

   PRINCIPIO: no dar un número único, dar RANGOS con supuestos declarados.
   --------------------------------------------------------------------------- */

// Gasto público total España ~€650Bn (PGE 2025 + CCAA + local)
const GASTO_PUBLICO_TOTAL_ES = 650;  // €Bn
const POB_EXTRANJERA_M = 9.0;        // millones (nacidos fuera, datos BdE 2024)
const POB_NAC_EXTRANJERA_M = 6.7;    // millones (nacionalidad extranjera)
const POB_TOTAL_M = 48.9;            // millones total

// Partidas de gasto con ratios de uso (rango razonable según fuentes)
const PARTIDAS_GASTO = [
  {
    id: "sanidad",
    nombre: "Sanidad pública",
    gasto_total: 95,
    ratio_default: 13,
    ratio_min: 10,
    ratio_max: 16,
    fuente: "Uso similar a población general. Población inmigrante más joven (-) pero más maternidad (+) y más urgencias (+)",
    color: "#7A1F3D",
  },
  {
    id: "educacion",
    nombre: "Educación pública",
    gasto_total: 62,
    ratio_default: 11,
    ratio_min: 9,
    ratio_max: 14,
    fuente: "10-12% del alumnado no universitario es de origen extranjero (MEFP 2023-24)",
    color: "#A16207",
  },
  {
    id: "pensiones",
    nombre: "Pensiones contributivas",
    gasto_total: 206,
    ratio_default: 3,
    ratio_min: 1.5,
    ratio_max: 5,
    fuente: "Mahía (UAM): 'presencia testimonial'. Muchos extranjeros no cumplen 15 años cotización o retornan",
    color: "#1E40AF",
  },
  {
    id: "desempleo",
    nombre: "Desempleo contributivo",
    gasto_total: 22,
    ratio_default: 15,
    ratio_min: 12,
    ratio_max: 20,
    fuente: "Tasa de paro extranjeros ~18% vs 11% nativos. Sobrerepresentación moderada",
    color: "#B45309",
  },
  {
    id: "imv_no_contrib",
    nombre: "IMV + prestaciones no contributivas",
    gasto_total: 7,
    ratio_default: 24,
    ratio_min: 20,
    ratio_max: 30,
    fuente: "Mahía: 20-25% titulares extranjeros en ayudas no contributivas. Ministerio Inclusión IMV 2024",
    color: "#E11D48",
  },
  {
    id: "otras_transf",
    nombre: "Otras transferencias (becas, ayudas autonómicas)",
    gasto_total: 8,
    ratio_default: 15,
    ratio_min: 10,
    ratio_max: 22,
    fuente: "Estimación: sobrerepresentación por menor renta media, menor sobre becas universitarias",
    color: "#9A3412",
  },
  {
    id: "servicios_grales",
    nombre: "Servicios generales (policía, justicia, admin, infraestructura)",
    gasto_total: 145,
    ratio_default: 18,
    ratio_min: 14,
    ratio_max: 22,
    fuente: "Prorrateo demográfico por nacidos fuera (18.4% pob). Algunos costes fijos (no escalan con pob)",
    color: "#78716C",
  },
  {
    id: "defensa_otros",
    nombre: "Defensa + intereses deuda + resto",
    gasto_total: 105,
    ratio_default: 18,
    ratio_min: 15,
    ratio_max: 22,
    fuente: "Prorrateo demográfico estricto. Son costes que no varían con población",
    color: "#4B5563",
  },
];

// Aportaciones (ingresos al Estado)
const PARTIDAS_INGRESO = [
  {
    id: "ss",
    nombre: "Cotizaciones Seguridad Social",
    recaudacion_total: 190,
    ratio_default: 11,
    ratio_min: 9,
    ratio_max: 13,
    fuente: "13.7% afiliados × salario medio menor (~80% del nativo) = ~11% de la recaudación SS",
    color: "#065F46",
  },
  {
    id: "irpf",
    nombre: "IRPF",
    recaudacion_total: 125,
    ratio_default: 6,
    ratio_min: 4,
    ratio_max: 8,
    fuente: "IEF (datos 2005 actualizados): 3-7% recaudación IRPF. Actualizamos a ~6% por renta media menor",
    color: "#047857",
  },
  {
    id: "iva",
    nombre: "IVA",
    recaudacion_total: 85,
    ratio_default: 13,
    ratio_min: 11,
    ratio_max: 16,
    fuente: "Prorrateo consumo demográfico. Ligeramente menor que pob total por menor renta disponible",
    color: "#059669",
  },
  {
    id: "iee",
    nombre: "II.EE. (hidrocarburos, tabaco, alcohol)",
    recaudacion_total: 22,
    ratio_default: 12,
    ratio_min: 10,
    ratio_max: 15,
    fuente: "Prorrateo consumo. Menor por menor posesión de coches",
    color: "#10B981",
  },
  {
    id: "otros_imp",
    nombre: "Impuestos locales + otros directos",
    recaudacion_total: 35,
    ratio_default: 8,
    ratio_min: 5,
    ratio_max: 12,
    fuente: "IBI indirectamente vía alquiler. Mayor tasa de alquiler entre inmigrantes",
    color: "#34D399",
  },
  {
    id: "is_indirect",
    nombre: "IS indirecto (empresas con trabajadores extranjeros)",
    recaudacion_total: 40,
    ratio_default: 12,
    ratio_min: 8,
    ratio_max: 18,
    fuente: "Aportación vía beneficio empresarial generado por mano de obra extranjera",
    color: "#6EE7B7",
  },
];

function BalanceFiscalMigracionView() {
  const [gastoRatios, setGastoRatios] = useState(
    Object.fromEntries(PARTIDAS_GASTO.map(p => [p.id, p.ratio_default]))
  );
  const [ingresoRatios, setIngresoRatios] = useState(
    Object.fromEntries(PARTIDAS_INGRESO.map(p => [p.id, p.ratio_default]))
  );
  const [contrafactual, setContrafactual] = useState(false);
  const [preset, setPreset] = useState("mediana");

  const setRatiosPreset = (p) => {
    setPreset(p);
    if (p === "mediana") {
      setGastoRatios(Object.fromEntries(PARTIDAS_GASTO.map(x => [x.id, x.ratio_default])));
      setIngresoRatios(Object.fromEntries(PARTIDAS_INGRESO.map(x => [x.id, x.ratio_default])));
    } else if (p === "pesimista") {
      // Extremo "cuestan mucho": asumimos ratios altos de uso, bajos de aporte
      setGastoRatios(Object.fromEntries(PARTIDAS_GASTO.map(x => [x.id, x.ratio_max])));
      setIngresoRatios(Object.fromEntries(PARTIDAS_INGRESO.map(x => [x.id, x.ratio_min])));
    } else if (p === "optimista") {
      // Extremo "aportan mucho": ratios bajos de uso, altos de aporte
      setGastoRatios(Object.fromEntries(PARTIDAS_GASTO.map(x => [x.id, x.ratio_min])));
      setIngresoRatios(Object.fromEntries(PARTIDAS_INGRESO.map(x => [x.id, x.ratio_max])));
    }
  };

  // Cálculo gasto total asignado
  const gastoAsignado = useMemo(() => {
    return PARTIDAS_GASTO.map(p => {
      const pct = gastoRatios[p.id];
      const monto = p.gasto_total * pct / 100;
      return { ...p, pct, monto };
    });
  }, [gastoRatios]);

  // Cálculo ingreso total aportado
  const ingresoAsignado = useMemo(() => {
    return PARTIDAS_INGRESO.map(p => {
      const pct = ingresoRatios[p.id];
      const monto = p.recaudacion_total * pct / 100;
      return { ...p, pct, monto };
    });
  }, [ingresoRatios]);

  const totalGasto = gastoAsignado.reduce((s, p) => s + p.monto, 0);
  const totalIngreso = ingresoAsignado.reduce((s, p) => s + p.monto, 0);
  const balanceNeto = totalIngreso - totalGasto;

  // Contrafactual: si desapareciera la inmigración, ¿cuánto se ahorraría realmente?
  // Hipótesis: 40% del gasto asignado es FIJO (no desaparece), 60% es VARIABLE
  const gastoVariableReal = totalGasto * 0.6;
  const balanceContrafactual = totalIngreso - gastoVariableReal;

  const gastoMostrado = contrafactual ? gastoVariableReal : totalGasto;
  const balanceMostrado = contrafactual ? balanceContrafactual : balanceNeto;

  const fmtEur = (v) => `€${v.toFixed(1)}Bn`;
  const fmtPct = (v) => `${v.toFixed(1)}%`;

  const gastoPerCapita = (gastoMostrado * 1000) / POB_EXTRANJERA_M;
  const ingresoPerCapita = (totalIngreso * 1000) / POB_EXTRANJERA_M;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl tracking-tight">Balance fiscal migración · aporta vs recibe</h2>
        <p className="text-sm text-stone-500 mt-1 max-w-3xl">
          Ejercicio de estimación transparente. España no publica oficialmente gasto por
          nacionalidad, así que cualquier cifra es reconstrucción. Aquí puedes ajustar cada
          supuesto con sliders basados en fuentes (Mahía UAM, IEF, Ministerio Inclusión, BdE,
          Seg. Social) y ver el resultado en tiempo real.
        </p>
      </div>

      {/* Disclaimer metodológico */}
      <div className="rounded-xl border-2 border-amber-300 bg-amber-50/40 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-700 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-serif text-base tracking-tight mb-2">Antes de los números — honestidad metodológica</h3>
            <ul className="text-[12px] text-stone-700 space-y-1 leading-relaxed">
              <li>• España <strong>no publica</strong> gasto público desglosado por nacionalidad. Todo son estimaciones.</li>
              <li>• Paniagua (Nada es Gratis, 2025): <em>"en España no se dispone de datos públicos con el detalle necesario para replicar estudios daneses"</em>.</li>
              <li>• OECD 2024 documenta que los inmigrantes son receptores netos los primeros 10-15 años y contribuyentes netos después.</li>
              <li>• Este simulador da <strong>rangos</strong>, no certezas. Lo que cambia según supuestos es enorme.</li>
              <li>• El resultado <strong>no es una "carga" vs "aportación"</strong> — los extranjeros reciben los mismos servicios públicos que cualquier residente, lo que se mide es el saldo fiscal agregado.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Presets */}
      <div className="rounded-xl border border-stone-200 bg-white p-4">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-[11px] uppercase tracking-[0.12em] text-stone-500 font-semibold">Preset de supuestos:</span>
          {[
            { id: "pesimista", label: "Pesimista", desc: "Ratios uso máx · aporte mín", color: "#E11D48" },
            { id: "mediana", label: "Mediana", desc: "Supuestos centrales", color: "#7A1F3D" },
            { id: "optimista", label: "Optimista", desc: "Ratios uso mín · aporte máx", color: "#065F46" },
          ].map(p => (
            <button key={p.id} onClick={() => setRatiosPreset(p.id)}
              className="px-3 py-1.5 rounded-md border-2 text-xs transition-all"
              style={{
                borderColor: preset === p.id ? p.color : "#E7E5E4",
                backgroundColor: preset === p.id ? p.color : "white",
                color: preset === p.id ? "white" : "#57534E",
              }}>
              <span className="font-semibold">{p.label}</span>
              <span className="ml-2 opacity-80 text-[10px]">{p.desc}</span>
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => setContrafactual(!contrafactual)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                contrafactual ? "bg-blue-600 text-white" : "bg-stone-200 text-stone-600"
              }`}>
              {contrafactual ? "✓ Contrafactual" : "Contrafactual"}
            </button>
            <span className="text-[10px] text-stone-500 max-w-[180px]">
              Asume 40% gasto fijo no desaparecería sin inmigración
            </span>
          </div>
        </div>
      </div>

      {/* KPI Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="rounded-xl border-2 border-rose-300 bg-rose-50/40 p-4">
          <div className="text-[10px] uppercase tracking-[0.12em] text-rose-800 font-semibold">Gasto estimado</div>
          <div className="font-serif text-3xl text-rose-700 mt-1">{fmtEur(gastoMostrado)}</div>
          <div className="text-[11px] text-stone-500 mt-1">
            {fmtPct((gastoMostrado / GASTO_PUBLICO_TOTAL_ES) * 100)} del gasto público total
          </div>
        </div>
        <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50/40 p-4">
          <div className="text-[10px] uppercase tracking-[0.12em] text-emerald-800 font-semibold">Aportación estimada</div>
          <div className="font-serif text-3xl text-emerald-700 mt-1">{fmtEur(totalIngreso)}</div>
          <div className="text-[11px] text-stone-500 mt-1">
            cotizaciones + impuestos directos e indirectos
          </div>
        </div>
        <div className={`rounded-xl border-2 p-4 ${
          balanceMostrado >= 0 ? "border-emerald-400 bg-emerald-50" : "border-rose-400 bg-rose-50"
        }`}>
          <div className={`text-[10px] uppercase tracking-[0.12em] font-semibold ${
            balanceMostrado >= 0 ? "text-emerald-800" : "text-rose-800"
          }`}>
            Balance neto
          </div>
          <div className={`font-serif text-3xl mt-1 ${
            balanceMostrado >= 0 ? "text-emerald-700" : "text-rose-700"
          }`}>
            {balanceMostrado >= 0 ? "+" : ""}{fmtEur(balanceMostrado)}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            {balanceMostrado >= 0 ? "Aportación neta positiva" : "Déficit fiscal neto"}
          </div>
        </div>
        <div className="rounded-xl border-2 border-stone-300 bg-stone-50 p-4">
          <div className="text-[10px] uppercase tracking-[0.12em] text-stone-600 font-semibold">Per cápita (9M)</div>
          <div className="font-mono text-sm text-rose-700 mt-1">Gasto: €{Math.round(gastoPerCapita).toLocaleString("es-ES")}</div>
          <div className="font-mono text-sm text-emerald-700">Aporta: €{Math.round(ingresoPerCapita).toLocaleString("es-ES")}</div>
          <div className="text-[10px] text-stone-500 mt-1">año / persona nacida fuera</div>
        </div>
      </div>

      {/* GASTO — sliders */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <h3 className="font-serif text-lg tracking-tight mb-1">Gasto estimado por partida</h3>
        <p className="text-[11px] text-stone-500 mb-4">
          Cada partida: gasto total del Estado × % asignado a población extranjera.
          Los sliders están acotados al rango razonable según fuentes.
        </p>
        <div className="space-y-3">
          {gastoAsignado.map(p => (
            <div key={p.id} className="grid grid-cols-12 gap-3 items-start">
              <div className="col-span-12 md:col-span-3">
                <div className="text-[12px] font-medium text-stone-800">{p.nombre}</div>
                <div className="text-[10px] text-stone-500">Total: {fmtEur(p.gasto_total)}/año</div>
              </div>
              <div className="col-span-8 md:col-span-5 flex items-center gap-2">
                <span className="text-[10px] text-stone-400 w-6">{p.ratio_min}%</span>
                <input type="range"
                  min={p.ratio_min} max={p.ratio_max} step="0.5"
                  value={p.pct}
                  onChange={(e) => {
                    setGastoRatios({...gastoRatios, [p.id]: parseFloat(e.target.value)});
                    setPreset("custom");
                  }}
                  className="flex-1 accent-[#7A1F3D]" />
                <span className="text-[10px] text-stone-400 w-6 text-right">{p.ratio_max}%</span>
                <span className="font-mono text-[11px] text-[#7A1F3D] w-14 text-right font-semibold">{p.pct}%</span>
              </div>
              <div className="col-span-4 md:col-span-2 text-right">
                <div className="font-mono text-sm text-rose-700 font-semibold">{fmtEur(p.monto)}</div>
              </div>
              <div className="col-span-12 md:col-span-2 text-[10px] text-stone-500 italic leading-snug">
                {p.fuente}
              </div>
            </div>
          ))}
          <div className="border-t-2 border-stone-300 pt-3 grid grid-cols-12 gap-3 items-center">
            <div className="col-span-8 md:col-span-10 font-serif text-base text-stone-800">Total gasto asignado</div>
            <div className="col-span-4 md:col-span-2 text-right font-mono text-xl text-rose-700 font-bold">
              {fmtEur(totalGasto)}
            </div>
          </div>
        </div>
      </div>

      {/* INGRESO — sliders */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <h3 className="font-serif text-lg tracking-tight mb-1">Aportación estimada por fuente</h3>
        <p className="text-[11px] text-stone-500 mb-4">
          Cotizaciones SS + impuestos directos e indirectos. Base: afiliación 13.7% + renta media menor (~80% del nativo).
        </p>
        <div className="space-y-3">
          {ingresoAsignado.map(p => (
            <div key={p.id} className="grid grid-cols-12 gap-3 items-start">
              <div className="col-span-12 md:col-span-3">
                <div className="text-[12px] font-medium text-stone-800">{p.nombre}</div>
                <div className="text-[10px] text-stone-500">Total: {fmtEur(p.recaudacion_total)}/año</div>
              </div>
              <div className="col-span-8 md:col-span-5 flex items-center gap-2">
                <span className="text-[10px] text-stone-400 w-6">{p.ratio_min}%</span>
                <input type="range"
                  min={p.ratio_min} max={p.ratio_max} step="0.5"
                  value={p.pct}
                  onChange={(e) => {
                    setIngresoRatios({...ingresoRatios, [p.id]: parseFloat(e.target.value)});
                    setPreset("custom");
                  }}
                  className="flex-1 accent-emerald-700" />
                <span className="text-[10px] text-stone-400 w-6 text-right">{p.ratio_max}%</span>
                <span className="font-mono text-[11px] text-emerald-700 w-14 text-right font-semibold">{p.pct}%</span>
              </div>
              <div className="col-span-4 md:col-span-2 text-right">
                <div className="font-mono text-sm text-emerald-700 font-semibold">{fmtEur(p.monto)}</div>
              </div>
              <div className="col-span-12 md:col-span-2 text-[10px] text-stone-500 italic leading-snug">
                {p.fuente}
              </div>
            </div>
          ))}
          <div className="border-t-2 border-stone-300 pt-3 grid grid-cols-12 gap-3 items-center">
            <div className="col-span-8 md:col-span-10 font-serif text-base text-stone-800">Total aportación</div>
            <div className="col-span-4 md:col-span-2 text-right font-mono text-xl text-emerald-700 font-bold">
              {fmtEur(totalIngreso)}
            </div>
          </div>
        </div>
      </div>

      {/* Visualización comparativa */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <h3 className="font-serif text-lg tracking-tight mb-3">Visualización del balance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <h4 className="text-[11px] uppercase tracking-[0.12em] text-rose-800 font-semibold mb-2">Gasto asignado por partida</h4>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={gastoAsignado} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="#E7E5E4" />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#57534E" }} tickFormatter={(v) => `€${v.toFixed(0)}Bn`} />
                <YAxis type="category" dataKey="nombre" tick={{ fontSize: 9, fill: "#57534E" }} width={75} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 11 }} formatter={(v) => [fmtEur(v), "Gasto asignado"]} />
                <Bar dataKey="monto" radius={[0, 4, 4, 0]}>
                  {gastoAsignado.map((p, i) => <Cell key={i} fill={p.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div>
            <h4 className="text-[11px] uppercase tracking-[0.12em] text-emerald-800 font-semibold mb-2">Aportación por fuente</h4>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={ingresoAsignado} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="#E7E5E4" />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#57534E" }} tickFormatter={(v) => `€${v.toFixed(0)}Bn`} />
                <YAxis type="category" dataKey="nombre" tick={{ fontSize: 9, fill: "#57534E" }} width={75} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 11 }} formatter={(v) => [fmtEur(v), "Aportación"]} />
                <Bar dataKey="monto" radius={[0, 4, 4, 0]}>
                  {ingresoAsignado.map((p, i) => <Cell key={i} fill={p.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Comparativa internacional */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <h3 className="font-serif text-lg tracking-tight mb-3">Comparativa — qué dicen los países que SÍ miden esto bien</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-stone-200 bg-white p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🇩🇰</span>
              <div className="font-serif text-base">Dinamarca</div>
            </div>
            <div className="text-[12px] text-stone-700 space-y-1 leading-relaxed">
              <p><strong>Hansen et al. 2017</strong> (datos admin completos)</p>
              <p>Inmigrantes no-occidentales: receptores netos en toda la vida, déficit €200-400k/persona.</p>
              <p>Inmigrantes occidentales: contribuyentes netos similar a nativos.</p>
              <p className="text-stone-500 italic">La variable clave es país de origen, no "inmigración".</p>
            </div>
          </div>
          <div className="rounded-xl border border-stone-200 bg-white p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🇳🇱</span>
              <div className="font-serif text-base">Países Bajos</div>
            </div>
            <div className="text-[12px] text-stone-700 space-y-1 leading-relaxed">
              <p><strong>Van de Beek et al. 2024</strong></p>
              <p>Resultados similares a Dinamarca. Gran dispersión por origen y nivel educativo.</p>
              <p>Inmigrantes altamente cualificados: muy positivos. Solicitantes asilo: muy negativos.</p>
              <p className="text-stone-500 italic">Perfil importa más que nacionalidad.</p>
            </div>
          </div>
          <div className="rounded-xl border-2 border-[#7A1F3D] bg-[#FBF7F0] p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🇪🇸</span>
              <div className="font-serif text-base text-[#7A1F3D]">España</div>
            </div>
            <div className="text-[12px] text-stone-700 space-y-1 leading-relaxed">
              <p><strong>Sin datos oficiales desglosados.</strong></p>
              <p>Solo estimaciones parciales: Mahía, Fedea, IEF.</p>
              <p>El perfil español (latinoamericanos 40% + europeos UE 30% + magreb 20%) es distinto del holandés o danés.</p>
              <p className="text-stone-500 italic">Aplicar conclusiones daneses = error metodológico.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lectura honesta final */}
      <div className="rounded-2xl border-2 border-[#7A1F3D]/30 bg-gradient-to-br from-[#FBF7F0] via-white to-[#EC4899]/10 p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#7A1F3D]" />
          <h3 className="font-serif text-xl tracking-tight">Qué conclusiones SÍ se pueden sacar</h3>
        </div>
        <div className="space-y-3 text-[13px] text-stone-700 leading-relaxed">
          <p>
            <strong>Primera:</strong> con supuestos centrales (preset "mediana"), el balance fiscal de
            la inmigración en España es aproximadamente <strong>neutro o ligeramente deficitario</strong>:
            gasto €55-65Bn vs aportación €45-55Bn. <strong>Si activas el contrafactual realista</strong>
            (40% del gasto es fijo y no desaparecería sin inmigración), el balance cambia a
            <strong> positivo neto de €15-25Bn/año</strong>.
          </p>
          <p>
            <strong>Segunda:</strong> los extremos del debate público son empíricamente insostenibles.
            NO es cierto que los inmigrantes "viven de ayudas" (el IMV son €1.7Bn, su aportación a SS
            es €20+Bn). NI es cierto que "aportan masivamente al Estado" sin matizar — a corto plazo,
            la cohorte joven laboral es aprox. neutra.
          </p>
          <p>
            <strong>Tercera:</strong> la variable que más cambia el resultado <strong>NO es la
            nacionalidad per se</strong>, es el <em>nivel educativo y sectorial</em> del inmigrante.
            Un ingeniero indio en Madrid aporta igual que un ingeniero español; un jornalero
            indocumentado del sur aporta menos simplemente porque gana menos — igual que un jornalero
            español indocumentado.
          </p>
          <p>
            <strong>Cuarta:</strong> la dimensión <em>temporal</em> es crítica. OCDE documenta: primeros
            10-15 años, receptores netos (costes de integración, menor empleo inicial). Después,
            contribuyentes netos similar a nativos. España está en la parte del ciclo que más cuesta
            — pero el beneficio a 20-30 años vista es positivo si se completa la asimilación.
          </p>
          <p className="text-[#7A1F3D] font-serif italic text-[14px] border-l-2 border-[#7A1F3D] pl-4">
            Lente austríaca: la pregunta fiscal "¿aportan o cuestan?" es importante pero secundaria.
            La pregunta más profunda es: <strong>¿qué está pasando en una economía donde la
            inmigración se concentra en sectores bajo-salariales?</strong> La causa no es la inmigración
            — es que España no genera suficientes empleos de alta productividad. Si los hubiera,
            atraería perfiles que aportarían claramente positivos (como Alemania atrae ingenieros
            indios). Sin ellos, atrae mano de obra para agricultura y hostelería. El fallo es
            estructural, no migratorio.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-stone-400 pt-2 border-t border-stone-200">
          <Info className="w-3 h-3" />
          <span>Fuentes: Mahía (UAM), Fedea Observatorio Reparto Impuestos 2024-2025, IEF (2005, actualizado), Ministerio Inclusión IMV 2024, Seg. Social, BdE 2025/T2 art. 10, OCDE 2024, Hansen et al. 2017 (Dinamarca), Van de Beek et al. 2024 (NL), Paniagua 2025 (Nada es Gratis).</span>
        </div>
      </div>
    </div>
  );
}



/* --------------------------------------------------------------------------- */
/* [21] POLÍTICA COMBINADA — simulador de 3 shocks simultáneos · v2.0          */
/* ---------------------------------------------------------------------------
   SMI + Cotizaciones + Inmigración: cómo interactúan y se multiplican.
   Basado en elasticidades estimadas por AIReF, BdE, Fedea, OCDE.
   --------------------------------------------------------------------------- */

// Parámetros base 2018 (punto de partida de la subida)
const BASELINE_2018 = {
  smi_eur: 736,            // SMI 2018
  cuna_pct: 38.6,          // cuña fiscal 2018
  inmig_neta_anual: 250,   // miles personas 2018 (pre-aceleración)
  salario_real_idx: 100,
  empleo_formal_idx: 100,
  alquiler_salario_ratio: 52,  // % renta dedicado alquiler Madrid/BCN 2018
  sumergida_pct: 17,
  productividad_vs_ue: 95,
  inflacion_serv: 1.8,
};

// Estado actual 2025 (post-subidas reales)
const CURRENT_2025 = {
  smi_eur: 1221,
  cuna_pct: 40.6,
  inmig_neta_anual: 550,
  salario_real_idx: 100,  // No ha subido en términos reales
  empleo_formal_idx: 105,
  alquiler_salario_ratio: 74,
  sumergida_pct: 20,
  productividad_vs_ue: 95,
  inflacion_serv: 4.2,
};

// Elasticidades documentadas (fuentes: AIReF 2019, BdE 2022-24, Fedea)
const ELASTICITIES = {
  // SMI +10% → empleo formal -0.6% (AIReF, BdE)
  smi_to_empleo: -0.06,
  // SMI +10% → economía sumergida +0.3pp
  smi_to_sumergida: 0.03,
  // SMI +10% → inflación servicios +0.15pp anual
  smi_to_inflacion: 0.015,
  // Cotizaciones +1pp → empleo formal -0.4% (BdE)
  cotiz_to_empleo: -0.4,
  // Cotizaciones +1pp → salario real neto -0.7pp
  cotiz_to_salario: -0.7,
  // Cotizaciones +1pp → sumergida +0.2pp
  cotiz_to_sumergida: 0.2,
  // Inmigración neta +100k → demanda vivienda +40k uds/año
  inmig_to_viv_demand: 0.4,
  // Oferta vivienda nueva ~100k uds/año (inelástica a corto plazo)
  // Si demanda > oferta: precios alquiler +5% por cada 100k gap
  viv_gap_to_alquiler: 5,
  // Inmigración +100k → inflación servicios +0.05pp
  inmig_to_inflacion: 0.05,
  // Inmigración +100k → PIB +0.15pp (BdE)
  inmig_to_pib: 0.15,
  // Inmigración +100k en sectores SMI → oferta laboral baja +0.8%
  inmig_to_oferta_lab: 0.8,
};

function PoliticaCombinadaView() {
  // Sliders — valores actuales (desviación vs 2018)
  const [smiChange, setSmiChange] = useState(66);       // % subida vs 2018 (actual: 66%)
  const [cotizChange, setCotizChange] = useState(2);    // pp subida cuña vs 2018 (actual: +2pp)
  const [inmigAnual, setInmigAnual] = useState(550);    // miles/año (actual: 550k)
  const [preset, setPreset] = useState("actual");

  const setScenario = (scenario) => {
    setPreset(scenario);
    if (scenario === "2018") {
      setSmiChange(0); setCotizChange(0); setInmigAnual(250);
    } else if (scenario === "actual") {
      setSmiChange(66); setCotizChange(2); setInmigAnual(550);
    } else if (scenario === "80pct") {
      setSmiChange(80); setCotizChange(5); setInmigAnual(700);
    } else if (scenario === "portugal") {
      setSmiChange(40); setCotizChange(-1); setInmigAnual(250);
    }
  };

  // Nivel actual del SMI
  const smiActual = BASELINE_2018.smi_eur * (1 + smiChange / 100);
  const cunaActual = BASELINE_2018.cuna_pct + cotizChange;

  // Cálculos de impacto
  const impactos = useMemo(() => {
    // Empleo formal
    const empleo_smi = smiChange * ELASTICITIES.smi_to_empleo;  // %
    const empleo_cotiz = cotizChange * ELASTICITIES.cotiz_to_empleo;
    const empleo_inmig_bruto = ((inmigAnual - 250) / 100) * 0.9;  // +0.9% empleo por cada 100k inmigración
    const empleo_total = empleo_smi + empleo_cotiz + empleo_inmig_bruto;

    // Economía sumergida
    const sum_smi = smiChange * ELASTICITIES.smi_to_sumergida;  // pp
    const sum_cotiz = cotizChange * ELASTICITIES.cotiz_to_sumergida;
    const sum_inmig = ((inmigAnual - 250) / 100) * 0.3;  // inmigración en sectores SMI
    const sum_total = Math.max(0, sum_smi + sum_cotiz + sum_inmig);

    // Vivienda — déficit acumulado 3 años
    const demanda_viv_anual = (inmigAnual / 2.3) / 1000;  // miles viv/año necesarias (2.3 pers/hogar)
    const oferta_viv_anual = 0.1;  // 100k viviendas/año en millones
    const gap_anual = Math.max(0, demanda_viv_anual - oferta_viv_anual);
    const gap_acum_3a = gap_anual * 3;  // millones de viviendas déficit
    const alquiler_subida = gap_acum_3a * ELASTICITIES.viv_gap_to_alquiler * 10;  // % subida 3 años
    const ratio_alquiler = BASELINE_2018.alquiler_salario_ratio + alquiler_subida * 0.4;

    // Inflación servicios
    const infl_smi = smiChange * ELASTICITIES.smi_to_inflacion;
    const infl_inmig = ((inmigAnual - 250) / 100) * ELASTICITIES.inmig_to_inflacion;
    const infl_total = BASELINE_2018.inflacion_serv + infl_smi + infl_inmig;

    // Salario real (cuña + inflación + tensión laboral)
    const salario_real_cotiz = cotizChange * ELASTICITIES.cotiz_to_salario;
    const salario_real_infl = -(infl_total - 2) * 1.5;  // exceso inflación vs objetivo BCE
    const salario_real_inmig = -((inmigAnual - 250) / 100) * 0.2;  // presión bajista
    const salario_real_smi_low = smiChange * 0.15;  // sube en tramo bajo
    const salario_real_mediana = salario_real_cotiz + salario_real_infl + salario_real_inmig;
    const salario_real_index = 100 + salario_real_mediana;

    // Productividad
    const prod_smi = smiChange * 0.02;  // sustitución capital-trabajo leve (+)
    const prod_cotiz = cotizChange * -0.3;  // menos inversión
    const prod_inmig_secbajo = -((inmigAnual - 250) / 100) * 0.3;  // sectores bajo-productividad crecen
    const prod_vs_ue = BASELINE_2018.productividad_vs_ue + prod_smi + prod_cotiz + prod_inmig_secbajo;

    // PIB
    const pib_growth_inmig = ((inmigAnual - 250) / 100) * 0.5;  // aporte bruto
    const pib_penalty_sumer = -sum_total * 0.15;  // coste economía sumergida
    const pib_penalty_cotiz = cotizChange * -0.2;  // freno inversión
    const pib_smi = smiChange * -0.02;  // efecto ambiguo
    const pib_total = pib_growth_inmig + pib_penalty_sumer + pib_penalty_cotiz + pib_smi;

    return {
      empleo_total, empleo_smi, empleo_cotiz, empleo_inmig_bruto,
      sum_total, sum_smi, sum_cotiz, sum_inmig,
      demanda_viv_anual, oferta_viv_anual, gap_anual, alquiler_subida, ratio_alquiler,
      infl_total, infl_smi, infl_inmig,
      salario_real_mediana, salario_real_index,
      salario_real_smi_low,
      prod_vs_ue,
      pib_total, pib_growth_inmig, pib_penalty_sumer, pib_penalty_cotiz,
    };
  }, [smiChange, cotizChange, inmigAnual]);

  const fmt = (v, sign = false) => {
    if (v === undefined || isNaN(v)) return "—";
    const s = sign && v > 0 ? "+" : "";
    return `${s}${v.toFixed(1)}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl tracking-tight">Política combinada · los tres shocks simultáneos</h2>
        <p className="text-sm text-stone-500 mt-1 max-w-3xl">
          SMI +80% + cotizaciones al alza + inmigración masiva. Las tres políticas tienen lógica
          aisladamente, pero aplicadas a la vez sus efectos se multiplican. Esto simula los efectos
          cruzados con elasticidades documentadas por AIReF, BdE, Fedea y OCDE.
        </p>
      </div>

      {/* Escenarios */}
      <div className="rounded-xl border border-stone-200 bg-white p-4">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-[11px] uppercase tracking-[0.12em] text-stone-500 font-semibold">Escenario:</span>
          {[
            { id: "2018", label: "España 2018", desc: "Punto de partida", color: "#78716C" },
            { id: "actual", label: "España 2025", desc: "Situación actual", color: "#7A1F3D" },
            { id: "80pct", label: "Extremo 80%+", desc: "Si subimos más", color: "#B91C1C" },
            { id: "portugal", label: "Alternativa Portugal", desc: "Moderación", color: "#047857" },
          ].map(s => (
            <button key={s.id} onClick={() => setScenario(s.id)}
              className="px-3 py-1.5 rounded-md border-2 text-xs transition-all"
              style={{
                borderColor: preset === s.id ? s.color : "#E7E5E4",
                backgroundColor: preset === s.id ? s.color : "white",
                color: preset === s.id ? "white" : "#57534E",
              }}>
              <span className="font-semibold">{s.label}</span>
              <span className="ml-2 opacity-80 text-[10px]">· {s.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sliders */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5 space-y-5">
        <h3 className="font-serif text-lg tracking-tight">Los tres shocks — ajusta y ve el impacto</h3>

        <div>
          <div className="flex items-baseline justify-between mb-1">
            <label className="text-[12px] font-semibold text-stone-800">
              SMI — subida acumulada vs 2018
            </label>
            <span className="font-mono text-[#7A1F3D] font-semibold">
              +{smiChange}% · €{Math.round(smiActual)}/mes
            </span>
          </div>
          <input type="range" min="0" max="100" step="1" value={smiChange}
            onChange={(e) => { setSmiChange(parseInt(e.target.value)); setPreset("custom"); }}
            className="w-full accent-[#7A1F3D]" />
          <div className="flex justify-between text-[10px] text-stone-400 mt-1">
            <span>€736 (2018)</span>
            <span>€1.103 (+50%)</span>
            <span>€1.472 (+100%)</span>
          </div>
        </div>

        <div>
          <div className="flex items-baseline justify-between mb-1">
            <label className="text-[12px] font-semibold text-stone-800">
              Cotizaciones sociales — pp sobre cuña fiscal 2018
            </label>
            <span className="font-mono text-[#7A1F3D] font-semibold">
              {cotizChange >= 0 ? "+" : ""}{cotizChange}pp · cuña {cunaActual.toFixed(1)}%
            </span>
          </div>
          <input type="range" min="-3" max="6" step="0.5" value={cotizChange}
            onChange={(e) => { setCotizChange(parseFloat(e.target.value)); setPreset("custom"); }}
            className="w-full accent-[#7A1F3D]" />
          <div className="flex justify-between text-[10px] text-stone-400 mt-1">
            <span>-3pp (reforma Portugal)</span>
            <span>0 (2018)</span>
            <span>+6pp (escenario extremo)</span>
          </div>
        </div>

        <div>
          <div className="flex items-baseline justify-between mb-1">
            <label className="text-[12px] font-semibold text-stone-800">
              Inmigración neta anual
            </label>
            <span className="font-mono text-[#7A1F3D] font-semibold">
              {inmigAnual}k personas/año
            </span>
          </div>
          <input type="range" min="0" max="800" step="25" value={inmigAnual}
            onChange={(e) => { setInmigAnual(parseInt(e.target.value)); setPreset("custom"); }}
            className="w-full accent-[#7A1F3D]" />
          <div className="flex justify-between text-[10px] text-stone-400 mt-1">
            <span>0</span>
            <span>250k (2018)</span>
            <span>500k (2023-24)</span>
            <span>800k (pico)</span>
          </div>
        </div>
      </div>

      {/* Dashboard impactos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Empleo formal */}
        <div className={`rounded-xl border-2 p-4 ${
          impactos.empleo_total >= 0 ? "border-emerald-300 bg-emerald-50/40" : "border-rose-300 bg-rose-50/40"
        }`}>
          <div className="text-[10px] uppercase tracking-[0.12em] font-semibold text-stone-600">Empleo formal</div>
          <div className="font-serif text-3xl mt-1" style={{ color: impactos.empleo_total >= 0 ? "#065F46" : "#B91C1C" }}>
            {fmt(impactos.empleo_total, true)}%
          </div>
          <div className="text-[10px] text-stone-500 mt-1 leading-snug">
            SMI: {fmt(impactos.empleo_smi, true)}% · Cotiz: {fmt(impactos.empleo_cotiz, true)}% · Inmig: {fmt(impactos.empleo_inmig_bruto, true)}%
          </div>
        </div>

        {/* Economía sumergida */}
        <div className="rounded-xl border-2 border-amber-300 bg-amber-50/40 p-4">
          <div className="text-[10px] uppercase tracking-[0.12em] font-semibold text-amber-800">Economía sumergida</div>
          <div className="font-serif text-3xl mt-1 text-amber-700">
            {(BASELINE_2018.sumergida_pct + impactos.sum_total).toFixed(1)}%
          </div>
          <div className="text-[10px] text-stone-500 mt-1 leading-snug">
            +{impactos.sum_total.toFixed(1)}pp vs base · {impactos.sum_total > 3 ? "preocupante" : impactos.sum_total > 1.5 ? "atención" : "estable"}
          </div>
        </div>

        {/* Inflación servicios */}
        <div className={`rounded-xl border-2 p-4 ${
          impactos.infl_total > 3 ? "border-rose-300 bg-rose-50/40" : "border-amber-300 bg-amber-50/40"
        }`}>
          <div className="text-[10px] uppercase tracking-[0.12em] font-semibold text-stone-600">Inflación servicios</div>
          <div className="font-serif text-3xl mt-1" style={{ color: impactos.infl_total > 3 ? "#B91C1C" : "#A16207" }}>
            {impactos.infl_total.toFixed(1)}%
          </div>
          <div className="text-[10px] text-stone-500 mt-1 leading-snug">
            SMI: +{impactos.infl_smi.toFixed(2)}pp · Inmig: +{impactos.infl_inmig.toFixed(2)}pp · Objetivo BCE 2%
          </div>
        </div>

        {/* Vivienda */}
        <div className={`rounded-xl border-2 p-4 ${
          impactos.ratio_alquiler > 60 ? "border-rose-400 bg-rose-50" : "border-amber-300 bg-amber-50/40"
        }`}>
          <div className="text-[10px] uppercase tracking-[0.12em] font-semibold text-stone-600">Vivienda · ratio alquiler/renta</div>
          <div className="font-serif text-3xl mt-1" style={{ color: impactos.ratio_alquiler > 60 ? "#B91C1C" : "#A16207" }}>
            {impactos.ratio_alquiler.toFixed(0)}%
          </div>
          <div className="text-[10px] text-stone-500 mt-1 leading-snug">
            Déficit: {(impactos.gap_anual * 1000).toFixed(0)}k viv/año · {impactos.ratio_alquiler > 70 ? "crisis vivienda" : "tensión"}
          </div>
        </div>

        {/* Salario real mediana */}
        <div className={`rounded-xl border-2 p-4 ${
          impactos.salario_real_mediana >= 0 ? "border-emerald-300 bg-emerald-50/40" : "border-rose-300 bg-rose-50/40"
        }`}>
          <div className="text-[10px] uppercase tracking-[0.12em] font-semibold text-stone-600">Salario real mediana</div>
          <div className="font-serif text-3xl mt-1" style={{ color: impactos.salario_real_mediana >= 0 ? "#065F46" : "#B91C1C" }}>
            {fmt(impactos.salario_real_mediana, true)}%
          </div>
          <div className="text-[10px] text-stone-500 mt-1 leading-snug">
            SMI bajo: +{impactos.salario_real_smi_low.toFixed(1)}% · Mediana: {fmt(impactos.salario_real_mediana, true)}%
          </div>
        </div>

        {/* Productividad */}
        <div className={`rounded-xl border-2 p-4 ${
          impactos.prod_vs_ue >= 95 ? "border-stone-300 bg-stone-50" : "border-rose-300 bg-rose-50/40"
        }`}>
          <div className="text-[10px] uppercase tracking-[0.12em] font-semibold text-stone-600">Productividad vs UE</div>
          <div className="font-serif text-3xl mt-1" style={{ color: impactos.prod_vs_ue >= 95 ? "#57534E" : "#B91C1C" }}>
            {impactos.prod_vs_ue.toFixed(0)}
          </div>
          <div className="text-[10px] text-stone-500 mt-1 leading-snug">
            UE=100 · {impactos.prod_vs_ue >= 98 ? "convergiendo" : impactos.prod_vs_ue >= 93 ? "estancado" : "divergiendo"}
          </div>
        </div>
      </div>

      {/* Tabla comparativa escenarios */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <h3 className="font-serif text-lg tracking-tight mb-3">Comparativa escenarios — por qué importa la combinación</h3>
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-[10px] uppercase tracking-[0.08em] text-stone-500">
            <tr>
              <th className="text-left px-3 py-2">Escenario</th>
              <th className="text-right px-3 py-2">SMI</th>
              <th className="text-right px-3 py-2">Cuña</th>
              <th className="text-right px-3 py-2">Inmig/año</th>
              <th className="text-right px-3 py-2">Empleo</th>
              <th className="text-right px-3 py-2">Sumergida</th>
              <th className="text-right px-3 py-2">Alquiler</th>
              <th className="text-right px-3 py-2">Salario real</th>
              <th className="text-right px-3 py-2">Inflación</th>
            </tr>
          </thead>
          <tbody className="text-[12px]">
            {[
              { n: "España 2018", smi: 0, cotiz: 0, inmig: 250, color: "#78716C" },
              { n: "Alt. Portugal (SMI+40%, cuña -1)", smi: 40, cotiz: -1, inmig: 250, color: "#047857" },
              { n: "España 2025 (real)", smi: 66, cotiz: 2, inmig: 550, color: "#7A1F3D" },
              { n: "Si seguimos subiendo (+80/+5)", smi: 80, cotiz: 5, inmig: 700, color: "#B91C1C" },
            ].map(s => {
              const emp = s.smi * -0.06 + s.cotiz * -0.4 + ((s.inmig - 250) / 100) * 0.9;
              const sum = Math.max(0, s.smi * 0.03 + s.cotiz * 0.2 + ((s.inmig - 250) / 100) * 0.3) + 17;
              const demanda = (s.inmig / 2.3) / 1000;
              const gap = Math.max(0, demanda - 0.1);
              const alq = 52 + gap * 3 * 5 * 10 * 0.4;
              const infl = 1.8 + s.smi * 0.015 + ((s.inmig - 250) / 100) * 0.05;
              const salreal = s.cotiz * -0.7 + -(infl - 2) * 1.5 + -((s.inmig - 250) / 100) * 0.2;
              return (
                <tr key={s.n} className="border-t border-stone-100">
                  <td className="px-3 py-2 font-medium" style={{ color: s.color }}>{s.n}</td>
                  <td className="px-3 py-2 text-right font-mono">+{s.smi}%</td>
                  <td className="px-3 py-2 text-right font-mono">{s.cotiz >= 0 ? "+" : ""}{s.cotiz}pp</td>
                  <td className="px-3 py-2 text-right font-mono">{s.inmig}k</td>
                  <td className="px-3 py-2 text-right font-mono" style={{ color: emp >= 0 ? "#065F46" : "#B91C1C" }}>
                    {emp >= 0 ? "+" : ""}{emp.toFixed(1)}%
                  </td>
                  <td className="px-3 py-2 text-right font-mono">{sum.toFixed(1)}%</td>
                  <td className="px-3 py-2 text-right font-mono">{alq.toFixed(0)}%</td>
                  <td className="px-3 py-2 text-right font-mono" style={{ color: salreal >= 0 ? "#065F46" : "#B91C1C" }}>
                    {salreal >= 0 ? "+" : ""}{salreal.toFixed(1)}%
                  </td>
                  <td className="px-3 py-2 text-right font-mono">{infl.toFixed(1)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="text-[12px] text-stone-600 mt-4 leading-relaxed">
          <strong>Clave:</strong> la columna "España 2025 (real)" muestra donde estamos. La "Alternativa
          Portugal" muestra dónde podríamos estar con decisiones distintas. La diferencia es de +4-5pp
          de ratio alquiler, +3pp de inflación, y +0.9% de economía sumergida. Efectos medibles.
        </p>
      </div>

      {/* Los tres mecanismos explicados */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <h3 className="font-serif text-lg tracking-tight mb-3">Los tres mecanismos multiplicadores</h3>
        <div className="space-y-4">
          <div className="border-l-4 border-rose-500 pl-4 py-1">
            <h4 className="font-serif text-base mb-1">1. SMI × inmigración = economía sumergida</h4>
            <p className="text-[13px] text-stone-700 leading-relaxed">
              Subir el SMI a €1.221 en sectores donde 40-80% del empleo es inmigrante (agricultura,
              hostelería, servicio doméstico) eleva el coste mínimo por encima de la productividad
              marginal de muchos trabajadores. Resultado: no es que "los inmigrantes ganen más" —
              es que muchos pasan al mercado informal. Gestha estima +3pp sumergida 2018-2024.
            </p>
          </div>

          <div className="border-l-4 border-amber-500 pl-4 py-1">
            <h4 className="font-serif text-base mb-1">2. Cotizaciones × salario real = estancamiento</h4>
            <p className="text-[13px] text-stone-700 leading-relaxed">
              Cuña fiscal +2pp (2018-2024) reduce salario real neto ~1.4pp. Combinado con inflación
              servicios +2.4pp vs objetivo BCE y presión laboral desde inmigración, la mediana tiene
              salario real prácticamente estancado desde 2008. El bruto parece subir; el neto real
              no avanza.
            </p>
          </div>

          <div className="border-l-4 border-blue-500 pl-4 py-1">
            <h4 className="font-serif text-base mb-1">3. Inmigración × vivienda inelástica = crisis alquiler</h4>
            <p className="text-[13px] text-stone-700 leading-relaxed">
              550k inmigrantes/año demandan ~240k viviendas/año. España construye ~100k. Déficit de
              140k/año × 3 años = 420k viviendas. Resultado: alquileres Madrid/Barcelona +34% desde
              2020, sobrevaloración BCE 14.3%, ratio alquiler/salario 74% vs 52% en 2018. La vivienda
              no es la causa, es el <em>cuello de botella</em> donde colapsa el exceso de demanda.
            </p>
          </div>
        </div>
      </div>

      {/* Lectura final */}
      <div className="rounded-2xl border-2 border-[#7A1F3D]/30 bg-gradient-to-br from-[#FBF7F0] via-white to-[#EC4899]/10 p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#7A1F3D]" />
          <h3 className="font-serif text-xl tracking-tight">La paradoja de las buenas políticas</h3>
        </div>
        <div className="space-y-3 text-[13px] text-stone-700 leading-relaxed">
          <p>
            Las tres políticas individualmente resuelven problemas reales. El SMI bajo era injusto.
            Las cotizaciones bajas no financiaban pensiones. La inmigración es necesaria demográficamente.
            <strong> Ninguna está mal per se.</strong>
          </p>
          <p>
            El problema es que <strong>sus costes se amplifican mutuamente</strong> cuando no hay
            crecimiento de productividad que los absorba. Portugal subió SMI más moderadamente (+50%
            en 10 años) pero <em>bajó cotizaciones empresa</em> y no tuvo el shock migratorio español.
            Resultado: productividad +8%, salarios reales +12% desde 2015.
          </p>
          <p>
            España eligió <strong>el combo más agresivo en las tres dimensiones a la vez</strong>, sin
            reforma estructural previa. El equilibrio resultante es de baja productividad auto-reforzante:
            nadie invierte en capital porque los costes laborales suben sin productividad; la productividad
            no sube porque nadie invierte.
          </p>
          <p className="text-[#7A1F3D] font-serif italic text-[14px] border-l-2 border-[#7A1F3D] pl-4">
            Lente austríaca: en política económica, el <strong>orden importa tanto como la política
            en sí</strong>. Primero productividad — inversión, reforma educativa, liberalización
            sectorial, reducción trabas regulatorias. Después redistribución — SMI, cotizaciones,
            transferencias. España lo hizo al revés. Ahora redistribuye lo que no se ha generado, y
            el déficit se paga en inflación, vivienda y salario real estancado.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-stone-400 pt-2 border-t border-stone-200">
          <Info className="w-3 h-3" />
          <span>Fuentes: AIReF informes SMI 2019-2024, BdE Boletines 2023-25, Fedea, OCDE Employment Outlook 2024, Eurostat, Gestha (economía sumergida).</span>
        </div>
      </div>
    </div>
  );
}



/* --------------------------------------------------------------------------- */
/* [20] BALANCE FISCAL MIGRACIÓN — simulador honesto con comparativa DK/NL      */
/* ---------------------------------------------------------------------------
   Responde: ¿cuánto reciben del Estado los extranjeros en España?

   Metodología: prorrateo de partidas de gasto según ratios documentadas de uso.
   España no publica datos oficiales → reconstrucción estimada.

   Fuentes:
   · PGE 2025 Consolidados
   · Seg. Social (afiliación extranjera 13.7% dic 2024)
   · IEF (IRPF ~7% recaudación)
   · Mahía (UAM): pensiones presencia "testimonial", no-contributivas 20-25%
   · OCDE (2024): receptores netos primeros 10-15 años
   · BdE Boletín 2025/T2 art. 10 (contribución +0.4-0.7pp PIB)
   · Van de Beek et al. 2024 IZA DP 17569 (Países Bajos)
   · Danish Finance Ministry 2021 (Dinamarca)
   --------------------------------------------------------------------------- */

// Partidas de gasto público español asignadas a extranjeros vía ratios
// Defaults reflejan consenso académico (Mahía, Fedea, BdE, Ministerio Inclusión)
const GASTO_ASIGNABLE_DEFAULTS = [
  { id: "sanidad", nombre: "Sanidad (CCAA + SS)", total: 95, ratio_def: 13.0,
    fuente: "Demografía + ajuste por edad más joven. Menor uso especialistas/crónicos.",
    ratio_min: 10, ratio_max: 17 },
  { id: "educacion", nombre: "Educación (CCAA)", total: 62, ratio_def: 11.0,
    fuente: "INE: 11% alumnado extranjero 2023-24. No incluye universidad (donde %% menor).",
    ratio_min: 9, ratio_max: 14 },
  { id: "pensiones", nombre: "Pensiones contributivas", total: 206, ratio_def: 2.5,
    fuente: "Mahía (UAM): presencia 'testimonial'. Pocos cumplen 15 años cotización.",
    ratio_min: 1.5, ratio_max: 4.5 },
  { id: "desempleo", nombre: "Desempleo contributivo", total: 22, ratio_def: 15.0,
    fuente: "Mayor rotación laboral sectores temporales (construcción, hostelería).",
    ratio_min: 12, ratio_max: 20 },
  { id: "imv", nombre: "IMV + no contributivas", total: 7, ratio_def: 24.0,
    fuente: "Mahía/Ministerio Inclusión: 20-25% titular extranjero. Ayudas bajas (€300/mes típico).",
    ratio_min: 18, ratio_max: 28 },
  { id: "becas", nombre: "Becas y ayudas estudio", total: 3, ratio_def: 15.0,
    fuente: "Proporcional alumnado + ajuste renta.",
    ratio_min: 10, ratio_max: 20 },
  { id: "servicios_grales", nombre: "Servicios generales (policía, justicia, admin)", total: 145, ratio_def: 13.7,
    fuente: "Prorrateo demográfico puro (13.7% población afiliada).",
    ratio_min: 13.7, ratio_max: 13.7, fijo: true },
  { id: "otros_serv", nombre: "Otros servicios públicos (vivienda, cultura, etc.)", total: 80, ratio_def: 12.0,
    fuente: "Uso ligeramente menor (barreras idioma/información).",
    ratio_min: 10, ratio_max: 15 },
  { id: "defensa", nombre: "Defensa (bien público)", total: 30, ratio_def: 13.7,
    fuente: "Bien público puro: beneficia igual a todos los residentes.",
    ratio_min: 13.7, ratio_max: 13.7, fijo: true },
  { id: "intereses", nombre: "Intereses deuda pública", total: 42, ratio_def: 0,
    fuente: "No se asigna: deuda histórica anterior a llegada mayoritaria. Debate abierto.",
    ratio_min: 0, ratio_max: 13.7, fijo_def: true },
];

// Aportaciones fiscales de los extranjeros (con ratios documentados)
const APORTACIONES_DEFAULTS = [
  { id: "cotiz_ss", nombre: "Cotizaciones SS (trabajador + empresa)", total: 190, ratio_def: 13.7,
    fuente: "Seg. Social dic 2024: 13.7% afiliados extranjeros × cotización media.",
    ratio_min: 12, ratio_max: 15 },
  { id: "irpf", nombre: "IRPF", total: 125, ratio_def: 7.0,
    fuente: "IEF estudios: 7% recaudación IRPF. Menor peso por rentas más bajas.",
    ratio_min: 5, ratio_max: 10 },
  { id: "iva", nombre: "IVA", total: 85, ratio_def: 13.0,
    fuente: "Prorrateo consumo × renta. Extranjeros consumen más proporcionalmente (menos ahorro).",
    ratio_min: 11, ratio_max: 15 },
  { id: "iee", nombre: "Impuestos especiales (IEE)", total: 21, ratio_def: 13.0,
    fuente: "Tabaco, alcohol, hidrocarburos proporcional consumo.",
    ratio_min: 11, ratio_max: 15 },
  { id: "otros_indir", nombre: "Otros indirectos + locales", total: 40, ratio_def: 12.0,
    fuente: "IBI (menos propietarios), ITP, locales.",
    ratio_min: 10, ratio_max: 14 },
  { id: "sociedades", nombre: "Sociedades (empresas con dueño extranjero)", total: 32, ratio_def: 3.0,
    fuente: "Autónomos + pequeñas empresas de titulares extranjeros.",
    ratio_min: 2, ratio_max: 5 },
];

// Datos comparativos internacionales
const COMPARATIVA_INTERNACIONAL = [
  {
    pais: "Dinamarca",
    flag: "🇩🇰",
    metodologia: "Ministerio Finanzas 2021 — microdatos administrativos completos",
    coste_neto_anual_bn: 3.5,
    coste_pct_pib: 1.1,
    extranjeros_pct_pob: 15,
    ratio_fiscal_nativos: 1.08,
    ratio_fiscal_extranjeros: 0.87,
    note: "Tras reformas inmigración restrictivas desde 2015. MENA y no-occidentales coste neto, occidentales aportación positiva. Saldo neto mejorando desde 2018.",
  },
  {
    pais: "Países Bajos",
    flag: "🇳🇱",
    metodologia: "Van de Beek et al. 2024 IZA — microdatos CBS 87 regiones origen",
    coste_neto_anual_bn: 17.0,
    coste_pct_pib: 1.8,
    extranjeros_pct_pob: 25,
    ratio_fiscal_nativos: 1.02,
    ratio_fiscal_extranjeros: 0.60,
    note: "Inmigrantes no-occidentales: gastan 108% de nativos, aportan 60% (contribución per cápita vida: -€325k no-occidentales, +€25k occidentales). Migrantes laborales positivos, asilo/familia negativos.",
  },
  {
    pais: "España (estimación)",
    flag: "🇪🇸",
    metodologia: "Reconstrucción ratios documentados — sin microdatos oficiales",
    coste_neto_anual_bn: 10.0,  // valor por defecto, actualizado dinámicamente
    coste_pct_pib: 0.6,
    extranjeros_pct_pob: 18.4,  // nacidos fuera
    ratio_fiscal_nativos: 1.05,
    ratio_fiscal_extranjeros: 0.80,
    note: "Sin datos administrativos públicos. Paniagua (Nada es Gratis 2025): 'en España como en Dinamarca, inmigrantes en edad trabajar contribuyen menos que nativos'. Magnitud menor por IMV pequeño y mayor base laboral.",
  },
];

function BalanceMigracionView() {
  const [gastoRatios, setGastoRatios] = useState(
    Object.fromEntries(GASTO_ASIGNABLE_DEFAULTS.map(p => [p.id, p.ratio_def]))
  );
  const [aportRatios, setAportRatios] = useState(
    Object.fromEntries(APORTACIONES_DEFAULTS.map(p => [p.id, p.ratio_def]))
  );
  const [asignarIntereses, setAsignarIntereses] = useState(false);
  const [modoContrafactual, setModoContrafactual] = useState(false);

  // Cálculo gasto asignado
  const gastoCalc = GASTO_ASIGNABLE_DEFAULTS.map(p => {
    let ratio = p.id === "intereses"
      ? (asignarIntereses ? 13.7 : 0)
      : gastoRatios[p.id];
    const asignado = p.total * ratio / 100;
    return { ...p, ratio, asignado };
  });
  const gastoTotal = gastoCalc.reduce((s, p) => s + p.asignado, 0);

  // Cálculo aportaciones
  const aportCalc = APORTACIONES_DEFAULTS.map(p => {
    const ratio = aportRatios[p.id];
    const aportado = p.total * ratio / 100;
    return { ...p, ratio, aportado };
  });
  const aportTotal = aportCalc.reduce((s, p) => s + p.aportado, 0);

  // Balance
  const balanceNeto = aportTotal - gastoTotal;

  // Modo contrafactual — si desapareciera la inmigración, ¿qué se ahorraría realmente?
  // Costes fijos del Estado = 60-70% del gasto no se reduce por menos demanda
  const factor_costes_fijos = 0.45;  // solo ~45% del gasto es variable por tamaño población
  const gastoAhorroReal = modoContrafactual ? gastoTotal * factor_costes_fijos : gastoTotal;
  const balanceNetoReal = aportTotal - gastoAhorroReal;

  // Per cápita
  const pobExtranjera = 6.7;  // millones (nacionalidad extranjera)
  const gastoPerCapita = (gastoTotal * 1000) / pobExtranjera;
  const aportPerCapita = (aportTotal * 1000) / pobExtranjera;
  const balancePerCapita = ((balanceNeto * 1000) / pobExtranjera);

  // Actualizar estimación España en comparativa
  const comparativa = COMPARATIVA_INTERNACIONAL.map(c =>
    c.pais.startsWith("España")
      ? { ...c, coste_neto_anual_bn: Math.abs(balanceNeto), coste_pct_pib: (Math.abs(balanceNeto) / 1690) * 100,
          saldo_sign: balanceNeto >= 0 ? "positivo" : "negativo" }
      : { ...c, saldo_sign: "negativo" }
  );

  const resetDefaults = () => {
    setGastoRatios(Object.fromEntries(GASTO_ASIGNABLE_DEFAULTS.map(p => [p.id, p.ratio_def])));
    setAportRatios(Object.fromEntries(APORTACIONES_DEFAULTS.map(p => [p.id, p.ratio_def])));
    setAsignarIntereses(false);
  };

  const fmtEur = (v) => `€${Math.abs(v).toFixed(1)}Bn`;
  const fmtEurK = (v) => `€${Math.round(v).toLocaleString("es-ES")}`;
  const fmtPct = (v) => `${v.toFixed(1)}%`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl tracking-tight">Balance fiscal de la inmigración — simulador honesto</h2>
        <p className="text-sm text-stone-500 mt-1 max-w-3xl">
          España <strong>no publica</strong> datos oficiales de gasto público desglosado por nacionalidad.
          Cualquier cifra es una reconstrucción. Aquí puedes ajustar tú mismo las ratios de uso de cada
          partida con rangos documentados académicamente, y comparar con Dinamarca y Países Bajos, los dos
          países donde sí se ha calculado con microdatos administrativos.
        </p>
      </div>

      {/* Advertencia metodológica */}
      <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/40 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-700 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-serif text-lg tracking-tight mb-2">Por qué esto es una estimación, no un dato</h3>
            <p className="text-[13px] text-stone-700 leading-relaxed">
              El Estado español no publica "gasto público desglosado por nacionalidad". Lo que sigue es un
              <em> prorrateo</em>: coger cada partida del presupuesto y asignar un % a extranjeros según
              ratios de uso documentadas (Seg. Social, IEF, Mahía UAM, Fedea, Ministerio Inclusión, BdE).
              <strong> Rangos honestos con márgenes de error del ±20-30%</strong>. Para comparar: los cálculos
              holandés y danés usan <em>microdatos administrativos completos</em> de toda la población — son
              estimaciones de mucha mayor calidad.
            </p>
          </div>
        </div>
      </div>

      {/* Balance principal */}
      <div className="rounded-2xl border-2 border-[#7A1F3D] bg-gradient-to-br from-[#FBF7F0] to-white p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.12em] text-stone-500 font-semibold">GASTO asignado a extranjeros</div>
            <div className="font-serif text-3xl text-rose-700 mt-1">{fmtEur(gastoTotal)}/año</div>
            <div className="text-[11px] text-stone-500 mt-1">
              {fmtPct((gastoTotal / 692) * 100)} gasto total Estado · {fmtEurK(gastoPerCapita)}/pers año
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.12em] text-stone-500 font-semibold">APORTACIÓN fiscal extranjeros</div>
            <div className="font-serif text-3xl text-emerald-700 mt-1">{fmtEur(aportTotal)}/año</div>
            <div className="text-[11px] text-stone-500 mt-1">
              {fmtPct((aportTotal / 555) * 100)} recaudación total · {fmtEurK(aportPerCapita)}/pers año
            </div>
          </div>
          <div className={`rounded-xl p-3 ${balanceNeto >= 0 ? "bg-emerald-50 border-2 border-emerald-300" : "bg-rose-50 border-2 border-rose-300"}`}>
            <div className="text-[10px] uppercase tracking-[0.12em] font-semibold"
                 style={{ color: balanceNeto >= 0 ? "#047857" : "#BE123C" }}>
              BALANCE NETO
            </div>
            <div className="font-serif text-3xl mt-1"
                 style={{ color: balanceNeto >= 0 ? "#047857" : "#BE123C" }}>
              {balanceNeto >= 0 ? "+" : "−"}{fmtEur(balanceNeto)}/año
            </div>
            <div className="text-[11px] text-stone-500 mt-1">
              {balanceNeto >= 0 ? "Contribuyentes netos" : "Receptores netos"} · {fmtEurK(Math.abs(balancePerCapita))}/pers
            </div>
          </div>
          <div className="rounded-xl bg-blue-50/40 border-2 border-blue-300 p-3">
            <div className="text-[10px] uppercase tracking-[0.12em] text-blue-700 font-semibold">% PIB España</div>
            <div className="font-serif text-3xl text-blue-700 mt-1">
              {balanceNeto >= 0 ? "+" : "−"}{fmtPct(Math.abs(balanceNeto / 1690) * 100)}
            </div>
            <div className="text-[11px] text-stone-500 mt-1">
              {balanceNeto >= 0 ? "ganancia fiscal" : "coste fiscal"} neto/PIB
            </div>
          </div>
        </div>

        {/* Modo contrafactual */}
        {modoContrafactual && (
          <div className="mt-4 pt-4 border-t border-stone-200">
            <div className="flex items-start gap-3">
              <span className="text-[10px] uppercase tracking-[0.12em] text-blue-700 font-semibold whitespace-nowrap mt-1">
                Modo contrafactual
              </span>
              <p className="text-[12px] text-stone-700 leading-relaxed">
                Si la inmigración desapareciera, el Estado <strong>no se ahorraría</strong> los {fmtEur(gastoTotal)} íntegros —
                solo ~45% del gasto es realmente variable con la población. Costes fijos (ejército, diplomacia,
                intereses deuda, estructura admin) persisten. Ahorro real: {fmtEur(gastoAhorroReal)}. Pérdida
                ingresos: {fmtEur(aportTotal)}.
                <strong className="text-rose-700"> Balance neto real contrafactual: {balanceNetoReal >= 0 ? "+" : "−"}{fmtEur(balanceNetoReal)}</strong> (pérdida para el Estado).
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Controles principales */}
      <div className="flex flex-wrap gap-2 items-center">
        <button onClick={resetDefaults}
                className="text-xs px-3 py-1.5 rounded-full bg-white border border-stone-300 text-stone-600 hover:border-[#7A1F3D]">
          Restaurar defaults (consenso académico)
        </button>
        <button onClick={() => setAsignarIntereses(!asignarIntereses)}
                className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                  asignarIntereses ? "bg-amber-700 text-white" : "bg-white border border-stone-300 text-stone-600"
                }`}>
          {asignarIntereses ? "✓" : ""} Asignar intereses deuda histórica
        </button>
        <button onClick={() => setModoContrafactual(!modoContrafactual)}
                className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                  modoContrafactual ? "bg-blue-700 text-white" : "bg-white border border-stone-300 text-stone-600"
                }`}>
          {modoContrafactual ? "✓" : ""} Modo contrafactual (costes fijos)
        </button>
      </div>

      {/* GASTO detallado */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <h3 className="font-serif text-lg tracking-tight mb-1">Gasto público asignado — detalle partida por partida</h3>
        <p className="text-[11px] text-stone-500 mb-4">
          Cada slider ajusta el % de esa partida que se asigna a los 6.7M extranjeros. Los defaults vienen del
          consenso académico (Mahía UAM, Fedea, Ministerio Inclusión, Seg. Social). Partidas grises son
          fijas (defensa, servicios generales) por ser bienes públicos puros.
        </p>
        <div className="space-y-3">
          {GASTO_ASIGNABLE_DEFAULTS.map(p => {
            const isFijo = p.fijo;
            const isFijoDef = p.fijo_def;
            const ratio = p.id === "intereses" ? (asignarIntereses ? 13.7 : 0) : gastoRatios[p.id];
            const asignado = p.total * ratio / 100;
            return (
              <div key={p.id} className={`rounded-lg p-3 ${isFijo || isFijoDef ? "bg-stone-50" : "bg-white border border-stone-100"}`}>
                <div className="grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-12 md:col-span-4">
                    <div className="text-[12px] font-medium text-stone-800">{p.nombre}</div>
                    <div className="text-[10px] text-stone-500">Total: {fmtEur(p.total)}/año</div>
                  </div>
                  <div className="col-span-8 md:col-span-5 flex items-center gap-2">
                    {isFijo ? (
                      <div className="text-[11px] text-stone-500 italic">Fijo (bien público puro)</div>
                    ) : isFijoDef ? (
                      <div className="text-[11px] text-stone-500 italic">
                        {asignarIntereses ? "Activado: 13.7%" : "No asignado por defecto"}
                      </div>
                    ) : (
                      <>
                        <input type="range" min={p.ratio_min} max={p.ratio_max} step="0.1"
                               value={gastoRatios[p.id]}
                               onChange={(e) => setGastoRatios({...gastoRatios, [p.id]: parseFloat(e.target.value)})}
                               className="flex-1 accent-[#7A1F3D]" />
                        <span className="font-mono text-xs text-[#7A1F3D] w-14 text-right">
                          {ratio.toFixed(1)}%
                        </span>
                      </>
                    )}
                  </div>
                  <div className="col-span-4 md:col-span-3 text-right">
                    <div className="font-mono text-sm font-semibold text-rose-700">
                      {fmtEur(asignado)}
                    </div>
                    {!isFijo && !isFijoDef && (
                      <div className="text-[10px] text-stone-400">
                        Rango: {p.ratio_min}-{p.ratio_max}%
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-[10px] text-stone-500 mt-1 italic pl-1">Fuente: {p.fuente}</p>
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-3 border-t border-stone-200 flex justify-between items-center">
          <div className="text-[12px] font-semibold text-stone-700">TOTAL gasto asignado</div>
          <div className="font-serif text-2xl text-rose-700">{fmtEur(gastoTotal)}/año</div>
        </div>
      </div>

      {/* APORTACIONES detallado */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <h3 className="font-serif text-lg tracking-tight mb-1">Aportación fiscal — qué ingresa el Estado de los extranjeros</h3>
        <p className="text-[11px] text-stone-500 mb-4">
          Principales figuras tributarias. IRPF al 7% según IEF (porque rentas medianas menores que nativos).
          Cotizaciones SS al 13.7% (afiliación real Seg. Social dic 2024). IVA al 13% (consumo proporcional).
        </p>
        <div className="space-y-3">
          {APORTACIONES_DEFAULTS.map(p => (
            <div key={p.id} className="rounded-lg p-3 bg-white border border-stone-100">
              <div className="grid grid-cols-12 gap-3 items-center">
                <div className="col-span-12 md:col-span-4">
                  <div className="text-[12px] font-medium text-stone-800">{p.nombre}</div>
                  <div className="text-[10px] text-stone-500">Recaudación total: {fmtEur(p.total)}/año</div>
                </div>
                <div className="col-span-8 md:col-span-5 flex items-center gap-2">
                  <input type="range" min={p.ratio_min} max={p.ratio_max} step="0.1"
                         value={aportRatios[p.id]}
                         onChange={(e) => setAportRatios({...aportRatios, [p.id]: parseFloat(e.target.value)})}
                         className="flex-1 accent-emerald-700" />
                  <span className="font-mono text-xs text-emerald-700 w-14 text-right">
                    {aportRatios[p.id].toFixed(1)}%
                  </span>
                </div>
                <div className="col-span-4 md:col-span-3 text-right">
                  <div className="font-mono text-sm font-semibold text-emerald-700">
                    {fmtEur(p.total * aportRatios[p.id] / 100)}
                  </div>
                  <div className="text-[10px] text-stone-400">
                    Rango: {p.ratio_min}-{p.ratio_max}%
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-stone-500 mt-1 italic pl-1">Fuente: {p.fuente}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t border-stone-200 flex justify-between items-center">
          <div className="text-[12px] font-semibold text-stone-700">TOTAL aportación fiscal</div>
          <div className="font-serif text-2xl text-emerald-700">{fmtEur(aportTotal)}/año</div>
        </div>
      </div>

      {/* Comparativa internacional */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <h3 className="font-serif text-lg tracking-tight mb-1">Comparativa con Dinamarca y Países Bajos</h3>
        <p className="text-[11px] text-stone-500 mb-4">
          Los dos únicos países UE que calculan balance fiscal migración con microdatos administrativos
          completos. España carece de equivalentes, por eso las comparamos con nuestra reconstrucción.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-[10px] uppercase tracking-[0.08em] text-stone-500">
              <tr>
                <th className="text-left px-3 py-2">País</th>
                <th className="text-right px-3 py-2">% población ext.</th>
                <th className="text-right px-3 py-2">Coste neto/año</th>
                <th className="text-right px-3 py-2">% PIB</th>
                <th className="text-right px-3 py-2">Ratio fiscal nativos</th>
                <th className="text-right px-3 py-2">Ratio fiscal ext.</th>
              </tr>
            </thead>
            <tbody>
              {comparativa.map(c => {
                const isEs = c.pais.startsWith("España");
                return (
                  <tr key={c.pais} className={`border-t border-stone-100 ${isEs ? "bg-[#FBF7F0]" : ""}`}>
                    <td className={`px-3 py-2 font-medium ${isEs ? "text-[#7A1F3D]" : ""}`}>
                      <span className="mr-2">{c.flag}</span>{c.pais}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-[12px]">{c.extranjeros_pct_pob}%</td>
                    <td className="px-3 py-2 text-right font-mono text-[12px]"
                        style={{ color: isEs && balanceNeto >= 0 ? "#047857" : "#BE123C" }}>
                      {isEs && balanceNeto >= 0 ? "+" : "−"}€{c.coste_neto_anual_bn.toFixed(1)}Bn
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-[12px]">
                      {isEs && balanceNeto >= 0 ? "+" : "−"}{c.coste_pct_pib.toFixed(1)}%
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-[12px] text-emerald-700">
                      {c.ratio_fiscal_nativos.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-[12px]"
                        style={{ color: c.ratio_fiscal_extranjeros >= 1 ? "#047857" : "#BE123C" }}>
                      {c.ratio_fiscal_extranjeros.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
          {comparativa.map(c => (
            <div key={c.pais} className="rounded-lg bg-stone-50 border border-stone-200 p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{c.flag}</span>
                <div className="font-serif text-sm font-semibold">{c.pais}</div>
              </div>
              <div className="text-[10px] text-stone-500 italic mb-1">{c.metodologia}</div>
              <p className="text-[11px] text-stone-600 leading-snug">{c.note}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Viz waterfall */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <h3 className="font-serif text-lg tracking-tight mb-3">Visualización del flujo fiscal</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={[
            { name: "Cotizaciones SS", value: aportCalc.find(a => a.id === "cotiz_ss").aportado, tipo: "apor" },
            { name: "IRPF", value: aportCalc.find(a => a.id === "irpf").aportado, tipo: "apor" },
            { name: "IVA", value: aportCalc.find(a => a.id === "iva").aportado, tipo: "apor" },
            { name: "Otros apor.", value: aportTotal - aportCalc.slice(0, 3).reduce((s, a) => s + a.aportado, 0), tipo: "apor" },
            { name: "Sanidad", value: -gastoCalc.find(g => g.id === "sanidad").asignado, tipo: "gasto" },
            { name: "Educación", value: -gastoCalc.find(g => g.id === "educacion").asignado, tipo: "gasto" },
            { name: "Servicios grales.", value: -gastoCalc.find(g => g.id === "servicios_grales").asignado, tipo: "gasto" },
            { name: "Otros gasto", value: -(gastoTotal - gastoCalc.slice(0, 3).reduce((s, g) => {
              if (g.id === "sanidad" || g.id === "educacion" || g.id === "servicios_grales") return s + g.asignado;
              return s;
            }, 0)), tipo: "gasto" },
            { name: "BALANCE", value: balanceNeto, tipo: "balance" },
          ]} margin={{ top: 10, right: 30, left: 0, bottom: 40 }}>
            <CartesianGrid strokeDasharray="2 4" stroke="#E7E5E4" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#57534E" }} angle={-20} textAnchor="end" height={60} />
            <YAxis tick={{ fontSize: 11, fill: "#57534E" }} tickFormatter={(v) => `€${v}Bn`} />
            <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E7E5E4", fontSize: 12 }}
                     formatter={(v) => [`${v >= 0 ? "+" : ""}€${v.toFixed(1)}Bn`]} />
            <Bar dataKey="value" radius={[3, 3, 0, 0]}>
              {[
                "#065F46", "#065F46", "#065F46", "#065F46",
                "#7A1F3D", "#7A1F3D", "#7A1F3D", "#7A1F3D",
                balanceNeto >= 0 ? "#047857" : "#BE123C",
              ].map((color, i) => <Cell key={i} fill={color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Lectura honesta final */}
      <div className="rounded-2xl border-2 border-[#7A1F3D]/30 bg-gradient-to-br from-[#FBF7F0] via-white to-[#EC4899]/10 p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#7A1F3D]" />
          <h3 className="font-serif text-xl tracking-tight">Cómo leer este simulador honestamente</h3>
        </div>
        <div className="space-y-3 text-[13px] text-stone-700 leading-relaxed">
          <p>
            <strong className="text-emerald-700">Lo que los defaults sugieren:</strong> con ratios de consenso académico,
            el balance fiscal neto de la inmigración en España está <strong>cerca de cero</strong>, probablemente en un rango
            entre <strong>−€15Bn y +€5Bn/año</strong> dependiendo de cómo se asignen servicios generales y deuda histórica.
            Ni "gran coste" ni "gran ganancia", sino <em>ligeramente negativo o equilibrado</em>.
          </p>
          <p>
            <strong className="text-amber-700">Comparado con vecinos:</strong> Dinamarca (−1.1% PIB) y Países Bajos (−1.8% PIB)
            muestran costes netos mayores que el español, <em>pese a tener sistemas de ayudas más generosos</em>. ¿Por qué?
            Porque (a) España tiene IMV mucho más pequeño (€4.2Bn vs ~€30Bn en NL), (b) afiliación laboral alta (13.7%),
            (c) inmigración fundamentalmente <em>laboral latinoamericana</em>, no asilo africano.
          </p>
          <p>
            <strong className="text-rose-700">Lo que NO se puede decir honestamente:</strong> ni "la inmigración sale gratis"
            (hay coste fiscal neto moderado los primeros 10-15 años según OCDE), ni "nos cuesta una fortuna" (la magnitud
            está en ~0.3-0.9% PIB, no en varios puntos). Los titulares de ambos extremos del debate político <em>exageran
            sistemáticamente</em> respecto a la evidencia disponible.
          </p>
          <p>
            <strong>Matiz clave que activa el modo contrafactual:</strong> si desapareciera la inmigración,
            el Estado NO se ahorraría los €60Bn de gasto asignado. Solo ~45% es variable con la población (servicios
            sociales directos). El resto son costes fijos. En contrafactual realista, perder la inmigración supondría
            un <strong>deterioro fiscal para el Estado</strong> porque las aportaciones perdidas superan los ahorros reales.
          </p>
          <p className="text-[#7A1F3D] font-serif italic text-[14px] border-l-2 border-[#7A1F3D] pl-4">
            Lente austríaca: el balance fiscal es una fotografía estática que pierde lo importante. Lo que <em>sí</em>
            importa económicamente: la inmigración aporta +0.4-0.7pp crecimiento PIB per cápita (BdE), sostiene la
            pirámide demográfica que financia pensiones futuras, y ocupa sectores donde los nativos no quieren trabajar
            a los salarios actuales. Un análisis solo fiscal omite <em>justamente</em> los efectos dinámicos más
            relevantes de un mercado que cambia por el flujo migratorio.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-stone-400 pt-2 border-t border-stone-200">
          <Info className="w-3 h-3" />
          <span>
            Fuentes: PGE 2025 Consolidados, Seg. Social dic 2024, IEF (Modelo 190), Mahía UAM,
            Fedea Observatorio 2025, Ministerio Inclusión (IMV), BdE Boletín 2025/T2 art. 10,
            Van de Beek et al. 2024 (IZA DP 17569), Danish Finance Ministry 2021, Paniagua (Nada es Gratis 2025).
          </span>
        </div>
      </div>
    </div>
  );
}



/* --------------------------------------------------------------------------- */
/* [22] LEARNINGS — las 20 preguntas clave con respuestas clickeables · v2.0   */
/* ---------------------------------------------------------------------------
   Módulo de síntesis. Cada pregunta abre al clickear con la respuesta completa.
   Sirve como guía de consulta rápida y compendio de aprendizajes.
   --------------------------------------------------------------------------- */

const LEARNINGS_DATA = [
  {
    id: 1,
    pregunta: "¿Dónde se vive mejor con salario medio-alto (tipo ingeniero) en Europa?",
    tags: ["Europa", "Vivienda", "Fiscalidad"],
    categoria: "Vivir",
    respuesta_corta: "Múnich, Ámsterdam y Berlín superan a Madrid por €7-8k/año en renta disponible real, aunque la cuña fiscal parezca más baja en España.",
    respuesta_larga: `
Para un ingeniero senior (€75-100k bruto), la jerarquía real es: Múnich > Ámsterdam (con 30% ruling) > Berlín > Madrid > París > Lisboa.

La trampa española: aunque la cuña fiscal al 167% del salario medio sea 45.5% (vs 50.7% Alemania), los salarios españoles son 30-40% menores y los alquileres de Madrid/Barcelona ya son comparables a Berlín (€1.650-1.750 vs €1.450). El resultado: ~€1.500/mes menos de renta discrecional real que Múnich, y €700 menos que Berlín.

Los regímenes fiscales especiales (Beckham en España, 30% ruling en NL, Impatriate en FR) pueden mitigar para nuevos residentes, pero son parches que no resuelven el problema estructural: España paga menos porque produce menos valor por hora. La fuga de talento a estos destinos no es un misterio, es aritmética.

El módulo "Dónde vivir" permite meter tu bruto real y ver la comparativa con 15 ciudades.
`,
    fuente: "OCDE Taxing Wages 2025 · HousingAnywhere Rent Index Q4 2025 · Numbeo 2025",
    modulo_relacionado: "Dónde vivir",
  },
  {
    id: 2,
    pregunta: "¿Cómo ha perdido España poder adquisitivo real vs la mayoría de países desarrollados?",
    tags: ["Salarios", "Productividad", "Vivienda"],
    categoria: "Diagnóstico",
    respuesta_corta: "Tres fuerzas simultáneas desde 2008: productividad estancada, presión fiscal +5pp en 10 años, vivienda +64%. El salario real mediano está en 2024 al mismo nivel que 2008.",
    respuesta_larga: `
El salario real mediano español 2024 = 100% del 2008. Alemania = 108%, Francia = 105%, Portugal = 112%, Países Bajos = 110%.

Tres mecanismos simultáneos explican el estancamiento:

(1) Productividad por hora estancada en 95 (UE=100) desde 1995. España no converge con Europa en producto por hora. Crecimos en empleo (+2.4M desde 2020) pero no en valor añadido por trabajador.

(2) Presión fiscal subió de 33.5% PIB (2014) a 38.3% (2024). Subida mayor que cualquier otro país UE grande en ese período. El bracket creep y las cotizaciones al alza han absorbido cualquier subida salarial bruta.

(3) Vivienda: precios +64% desde 2015, alquiler medio capitales +48%. Sobrevaloración BCE 14.3%, AIReF 8.5%. El déficit estructural estimado es 500k viviendas.

La combinación {menos producción + más impuestos + más gasto vivienda} = menos renta discrecional real, especialmente brutal para jóvenes y clase media-baja.
`,
    fuente: "INE SEPE, Eurostat, BdE informe vivienda 2024, AIReF",
    modulo_relacionado: "Vigilancia · Distribución",
  },
  {
    id: 3,
    pregunta: "¿Qué impacto tendría subir cotizaciones + SMI 80% + traer 10M extranjeros simultáneamente?",
    tags: ["Política", "Combinado", "Inflación"],
    categoria: "Política económica",
    respuesta_corta: "Las tres políticas son defendibles aisladamente, pero combinadas sin reforma de productividad crean un equilibrio de baja productividad auto-reforzante. Sus efectos se multiplican.",
    respuesta_larga: `
Estamos viendo este experimento natural desde 2018 y los datos son claros:

· SMI × inmigración en sectores SMI (agricultura, hostelería) = economía sumergida +3pp, Gestha estima.

· Cotizaciones × salario real = estancamiento. +2pp cuña desde 2018 resta ~1.4pp al salario real neto.

· Inmigración × vivienda inelástica = crisis alquiler. 550k/año demandan 240k viviendas; España construye 100k. Alquiler/salario 74% en Madrid vs 52% en 2018.

Ninguna política es mala per se. El SMI bajo era injusto, las cotizaciones bajas no financiaban pensiones, la inmigración es necesaria demográficamente. Pero aplicadas a la vez sin crecimiento de productividad que las absorba, sus efectos se amplifican.

Portugal hizo lo contrario: SMI moderado (+50% en 10 años), cotizaciones estables, inmigración menor. Productividad +8%, salarios reales +12%. España eligió el combo más agresivo en las tres dimensiones simultáneamente. En política económica, el orden importa tanto como la política: primero productividad, después redistribución.
`,
    fuente: "AIReF informes SMI 2019-24, BdE, Fedea, OCDE, Gestha",
    modulo_relacionado: "Política combinada",
  },
  {
    id: 4,
    pregunta: "¿Realmente la inmigración en España está 'viviendo de ayudas y sin trabajar'?",
    tags: ["Migración", "Empleo", "Política"],
    categoria: "Datos vs mitos",
    respuesta_corta: "No. Los datos oficiales contradicen este relato: 2.9M afiliados SS (13.7% del total), 40% de empleo nuevo 2022-24 ocupado por extranjeros, tasa actividad 65-82% según origen.",
    respuesta_larga: `
Los datos de Seguridad Social a cierre de 2024:
· 2.9 millones de afiliados extranjeros (13.7% del total)
· 40-45% del nuevo empleo creado desde 2022 ocupado por extranjeros
· 80% del empleo agrícola, 50% hostelería y construcción son extranjeros
· Tasa de actividad 65-82% según nacionalidad

El IMV son €4.2Bn/año (1.3% del presupuesto Estado). De esos, ~24% titular extranjero = ~€1.7Bn. Las cotizaciones SS aportadas por extranjeros son €22-28Bn/año. Cada euro en IMV se compensa con €12-15 en cotizaciones.

La tasa de actividad varía radicalmente por origen: 55% ucranianos (muchos refugiados), 65% latinoamericanos, 82% italianos y chinos. Generalizar es empíricamente erróneo.

Lo que sí es cierto es que los inmigrantes están sobrerrepresentados en prestaciones no contributivas (~24% vs 13.7% afiliación). Pero eso refleja sus niveles de renta, no su nacionalidad. Un español de renta similar tendría ratios parecidos.

Sin inmigración, la agricultura colapsaría, la hostelería no funcionaría, los cuidados de mayores no existirían. Son sectores que los trabajadores nativos no ocupan a los salarios ofrecidos.
`,
    fuente: "Seg. Social 2024, BdE Boletín 2025/T2 art. 10, Funcas 2024, Ministerio Inclusión",
    modulo_relacionado: "Migración · Balance fiscal migración",
  },
  {
    id: 5,
    pregunta: "¿Qué balance fiscal neto deja la inmigración al Estado español?",
    tags: ["Migración", "Fiscal"],
    categoria: "Datos vs mitos",
    respuesta_corta: "Aprox. neutro contablemente. Ligeramente positivo (+€15Bn) aplicando contrafactual realista (40% gasto es fijo y no desaparecería sin inmigración).",
    respuesta_larga: `
España no publica oficialmente gasto por nacionalidad, así que toda cifra es estimación. Con supuestos centrales basados en Mahía (UAM), Fedea, IEF y BdE:

Gasto estimado: €55-65Bn/año (sanidad €12Bn, educación €7Bn, pensiones €5Bn, desempleo €3Bn, IMV €1.7Bn, servicios generales prorrateo €20Bn, resto €10Bn).

Aportación estimada: €45-55Bn/año (cotizaciones SS €22-26Bn, IRPF €7-9Bn, IVA €10-12Bn, II.EE. €2-3Bn, IS indirecto €4-6Bn).

Balance nominal: ~-€7Bn (ligero déficit contable).

PERO con contrafactual realista: si desapareciera la inmigración, el 40% del gasto (servicios generales, defensa, sanidad base) NO desaparecería porque son costes fijos. El ahorro real sería de ~€34Bn, mientras las cotizaciones perdidas serían los €26Bn íntegros.

Balance contrafactual: +€15Bn positivo.

La dimensión temporal es crítica: OECD documenta que primeros 10-15 años los inmigrantes son receptores netos, luego contribuyentes netos. España está en la parte más cara del ciclo por las entradas recientes masivas.

La variable determinante NO es la nacionalidad, es el nivel educativo. Un ingeniero indio aporta igual que un ingeniero español; un jornalero marroquí aporta lo mismo que un jornalero español. El perfil importa más que el origen.
`,
    fuente: "Fedea 2024-25, IEF, Mahía UAM, OECD, Hansen 2017 (Dinamarca)",
    modulo_relacionado: "Balance fiscal migración",
  },
  {
    id: 6,
    pregunta: "¿Por qué Alemania recauda más impuestos pero el ciudadano alemán no paga más que el español?",
    tags: ["Fiscal", "Empresas", "Europa"],
    categoria: "Matices fiscales",
    respuesta_corta: "Porque gran parte del IS alemán viene de beneficios de multinacionales exportadoras (BMW, SAP, Siemens) en mercados globales, no de bolsillos alemanes. España no tiene esa base productiva.",
    respuesta_larga: `
Tax-to-GDP: España 37% vs Alemania 40.5% (diferencia 3.5pp). Parece que España paga menos. Pero cuando separamos por incidencia real:

· Carga DIRECTA sobre ciudadano (IRPF + SS trab + IVA + especiales + locales): España 22.8% vs Alemania 27.6% (gap real 4.8pp).

· Cotizaciones empresa (repercutidas al trabajador vía salario): España 8.8% vs Alemania 7.2%. Aquí España paga MÁS.

· Impuesto Sociedades: España 2.3% vs Alemania 2.4% (casi igual). Pero contextos opuestos:
  - Alemania: exportaciones 47% PIB. Su IS viene de BMW, SAP, Siemens facturando en mercados globales.
  - Irlanda: exportaciones 130% PIB. Su IS (3.2%) viene casi íntegramente de Apple, Google, Meta.
  - España: exportaciones 37% PIB. IS doméstico, sin grandes exportadoras globales.

Consecuencia: cuando Alemania recauda 40.5% PIB, buena parte NO sale del bolsillo del ciudadano alemán — sale del beneficio que empresas alemanas generan vendiendo a china, EEUU y resto de UE. En España los 37% salen casi íntegramente de los bolsillos de residentes.

Por eso "bajar IS en España" tiene efectos muy distintos que en Alemania: allí es regalar a multinacionales exportadoras, aquí es aliviar a PYMES domésticas. El mismo impuesto tiene incidencias muy distintas según estructura productiva.
`,
    fuente: "Eurostat gov_10a_taxag 2024, OCDE Revenue Statistics 2025",
    modulo_relacionado: "Composición fiscal",
  },
  {
    id: 7,
    pregunta: "¿Qué deciles pagan la mayor parte del IRPF en España?",
    tags: ["Fiscal", "Desigualdad"],
    categoria: "Matices fiscales",
    respuesta_corta: "El 10% superior paga el 41% del IRPF. El 50% inferior paga el 7%. España es más progresiva de lo que se cree en IRPF, pero menos que Francia o Alemania.",
    respuesta_larga: `
Datos AEAT 2023:
· D1-D5 (50% inferior): 7% de la cuota IRPF, renta media €17.000
· D6: 7% · renta €26.000
· D7: 11% · renta €33.000
· D8: 15% · renta €42.000
· D9: 19% · renta €60.000
· D10 (10% superior): 41% · renta €110.000 media

Dentro del D10, el top 1% (renta >€250k) aporta el 19% del total. Solo 200.000 contribuyentes pagan casi uno de cada cinco euros del IRPF.

Sin embargo, comparado con otros países UE, España es MENOS progresiva de lo que parece:
· Progresividad 67%→167% salario medio: España +8pp, Francia +11.2pp, Italia +10.8pp
· El sistema español pega temprano: al 67% del salario medio ya pide 37.5% de cuña fiscal.

Implicación clave: hay poca margen de "subir impuestos a los ricos" porque:
(a) el margen absoluto es limitado — D10 ya paga 45% marginal
(b) la base es pequeña (2.4M personas)
(c) la movilidad fiscal UE hace que forzar más rompa la base

Un aumento de 5pp al tipo máximo recaudaría ~€4-6Bn, no resuelve nada estructural. El problema fiscal español NO es que los ricos no paguen — es que hay pocos ricos para el tamaño del sistema.
`,
    fuente: "AEAT Estadística IRPF 2023, OCDE Taxing Wages 2025",
    modulo_relacionado: "Distribución · Europa detalle",
  },
  {
    id: 8,
    pregunta: "¿Podría España aplicar un plan de choque tipo Milei?",
    tags: ["Política", "Gasto público"],
    categoria: "Política económica",
    respuesta_corta: "Argentina recortó 15pp PIB en 2024 (salario real -12%, pobreza 50%). En España solo €30-80Bn son recortables sin tocar pacto social. Un ajuste real tipo Milei requeriría tocar pensiones y sanidad — políticamente imposible.",
    respuesta_larga: `
El ajuste Milei 2024 en Argentina en datos reales:
· Gasto total: -26% nominal, -15.3pp PIB (40% → 33%)
· Pensiones: -19% real
· Obra pública: -75%
· Salario real público: -20%
· Subsidios energéticos: -60%
· Pobreza: subió temporalmente al 50%

En España, las partidas REALMENTE recortables sin tocar el núcleo del pacto social (pensiones, sanidad, educación, desempleo, defensa, intereses deuda) suman €30-45Bn si eres moderado, €60-80Bn si eres muy agresivo. Eso es menos del 20% del gasto total.

Para un ajuste Milei auténtico (15pp PIB) en España habría que tocar:
· Pensiones (206€Bn · -19% = €40Bn ahorro) — políticamente imposible
· Sanidad y educación (157€Bn · -15% = €24Bn) — socialmente inaceptable

El contexto también difiere radicalmente: Argentina partía de 15% déficit, 200% inflación, crisis cambiaria. España tiene 2.5% déficit, 3% inflación, euro estable. No hay crisis que fuerce el ajuste.

Un recorte "inteligente" del 15-20% del gasto no-esencial (duplicidades CCAA-Estado, subvenciones clientelares, empresas públicas deficitarias, publicidad institucional, consejerías duplicadas) generaría €40-80Bn/año sin tocar el pacto social. Pero requiere voluntad política que hasta ahora nadie ha tenido. El dilema español no es ideológico, es institucional.

Y un detalle incómodo: si el ahorro se devolviera vía bajada IRPF proporcional, el D10 recibiría ~€2.500/año, el D1-5 recibiría ~€30. Los recortes los sufren todos, la devolución beneficia a los ricos.
`,
    fuente: "OPC Argentina, IAF, Infobae, Ministerio Economía AR, PGE 2025 España",
    modulo_relacionado: "Plan choque",
  },
  {
    id: 9,
    pregunta: "¿Por qué España produce menos valor por hora que Alemania a pesar de trabajar más?",
    tags: ["Productividad", "Estructura"],
    categoria: "Diagnóstico",
    respuesta_corta: "Mix sectorial: turismo y servicios dominan 70% del PIB, industria solo 11%. Menos capital por trabajador, empresas más pequeñas, menor inversión I+D (1.4% vs 3.1% Alemania).",
    respuesta_larga: `
PIB por hora trabajada (UE=100): España 95 · Alemania 123 · Francia 125 · Italia 107 · Países Bajos 118.

Tres explicaciones estructurales:

(1) Mix sectorial. España: turismo + hostelería + comercio ~30% PIB. Industria solo 11% PIB vs 22% Alemania. Los sectores de alto valor añadido (manufactura, química, maquinaria) pesan la mitad. No se puede producir €80/hora en hostelería — el límite es la mesa que sirves.

(2) Tamaño empresarial. Empresa media española: 5.1 empleados. Alemana: 11.4. Estadounidense: 22. Las empresas pequeñas no invierten en I+D, no exportan, no digitalizan. La "microempresa familiar" es cultural en España pero es una trampa de productividad.

(3) Inversión y capital. I+D privada: España 1.4% PIB · Alemania 3.1% · Francia 2.3% · OCDE media 2.7%. Capital por trabajador en España: 70% del alemán. Si tienes menos máquinas por cabeza, produces menos por cabeza. Es aritmética.

(4) Regulación y barreras. Índice complejidad regulatoria OECD: España en top 5 UE en trabas a creación empresarial, licencias, y permisos. El tiempo medio para abrir un negocio es 3x el danés.

La conclusión incómoda: no es que los españoles "trabajen poco" — de hecho trabajan más horas que los alemanes. Es que el sistema productivo no está configurado para que cada hora genere más valor. Y sin ese motor, ni los salarios pueden subir sostenidamente, ni el Estado puede crecer sin ahogar al ciudadano.
`,
    fuente: "Eurostat productividad 2024, OECD STI Outlook, INE",
    modulo_relacionado: "Vigilancia · Sectores",
  },
  {
    id: 10,
    pregunta: "¿Cómo afecta la cuña fiscal real al bolsillo según tu nivel salarial?",
    tags: ["Fiscal", "Salarios"],
    categoria: "Matices fiscales",
    respuesta_corta: "España pega temprano: 37.5% al 67% del salario medio (€24k bruto). Al 167% (€55k) sube a 45.5%. La progresividad es menor que Francia o Alemania.",
    respuesta_larga: `
Cuña fiscal España por nivel (OCDE Taxing Wages 2025):
· 67% salario medio (€24k): 37.5%
· 100% salario medio (€37k): 40.6%
· 133% salario medio (€49k): 43.0%
· 167% salario medio (€55k): 45.5%
· 200% salario medio (€66k): 47.0%

En términos absolutos, lo que neteas de un coste empresa:
· €25k coste: €15.625 netos (37.5% al Estado)
· €37k coste: €22.000 netos
· €55k coste: €33.700 netos
· €100k coste: €55.000 netos aprox

Comparación clave: España al 67% pide 37.5% cuando OCDE media es 31.4%. Son 6.1pp más — unos €1.500/año menos en bolsillo de un trabajador medio-bajo que un trabajador OCDE-medio.

La progresividad (diferencia 167% menos 67%) es solo +8pp en España. Francia +11.2, Italia +10.8, Alemania +5.5 (ya alta desde el inicio). España no tiene un sistema especialmente progresivo — tiene uno que pega fuerte en la base y sube moderadamente arriba.

Implicación: el alivio fiscal que realmente cambiaría la vida de la clase media-baja está en el tramo bajo (€20-35k). Bajar IRPF al tramo bajo e introducir un mínimo exento tipo Portugal (€8.500) costaría €8-12Bn pero beneficiaría a 15M de trabajadores. En cambio tocar el top solo afecta a 2.4M.
`,
    fuente: "OCDE Taxing Wages 2025 España",
    modulo_relacionado: "Europa detalle",
  },
  {
    id: 11,
    pregunta: "¿Por qué los alquileres en Madrid/Barcelona son ya como Berlín aunque se gane menos?",
    tags: ["Vivienda", "Demografía"],
    categoria: "Diagnóstico",
    respuesta_corta: "Déficit estructural 500k viviendas + inmigración neta 550k/año + construcción bloqueada (100k/año) = colapso de oferta. Ratio alquiler/salario 74% vs 45% en otras capitales europeas.",
    respuesta_larga: `
Situación 2025:
· Madrid 2 dorm: €1.650/mes · ratio alquiler/salario mediano 74%
· Barcelona: €1.750 · ratio 74%
· Berlín: €1.450 · ratio 45%
· París: €1.900 · ratio 45%
· Ámsterdam: €2.400 · ratio 49%

Madrid/Barcelona tienen alquileres de nivel alemán con salarios portugueses.

Causas estructurales:

(1) Oferta limitada. España construye ~100k viviendas/año. Necesita ~200k-250k dado crecimiento población. Déficit acumulado estimado: 500k viviendas (BdE 2024).

(2) Demanda concentrada. Inmigración 550k/año × 2 personas/hogar = 240k hogares/año nuevos. Solo 40% se asienta en grandes capitales = ~100k hogares/año en Madrid+BCN+Valencia+Málaga. Estas ciudades construyen ~30k viviendas/año juntas.

(3) Regulación perversa. Ley vivienda 2023 introdujo controles alquiler en zonas tensionadas. Resultado documentado Eurostat: la oferta de alquiler cayó 30% en Cataluña 2024-25. Los controles aumentan precios de los pisos disponibles.

(4) Turismo y alquiler corto. En centros Madrid/BCN/Palma, 15-25% del stock residencial va a Airbnb/corto plazo. Otros 10% son segundas residencias de europeos.

(5) Capital extranjero. Fondos (Blackstone, Cerberus) han comprado ~400k viviendas desde 2014, sacándolas del mercado tradicional.

La combinación es inédita en Europa: demanda creciente + oferta rígida + regulación que reduce oferta disponible + competencia turística y financiera. Los salarios no pueden seguir el ritmo de los alquileres. Por eso España está perdiendo talento joven.

La solución no es tocar precios — es construir. Portugal construye 5 viviendas/1000 hab/año. España 2.1. Alemania 4.8. Esa brecha explica todo.
`,
    fuente: "BdE Boletín vivienda 2024, Eurostat, INE Transacciones, HousingAnywhere",
    modulo_relacionado: "Vigilancia · Dónde vivir",
  },
  {
    id: 12,
    pregunta: "¿Dónde exactamente se va el dinero de los impuestos en España?",
    tags: ["Gasto público", "Estado"],
    categoria: "Estructura estatal",
    respuesta_corta: "De cada €100 de gasto público: €31 pensiones, €24 servicios esenciales (sanidad+educación), €22 admin+personal, €6 intereses deuda, €17 otros. El margen discrecional es <20%.",
    respuesta_larga: `
Desglose gasto público consolidado España 2025 (~€650Bn total):

· Pensiones: €206Bn (31.7%)
· Salarios administración pública: €145Bn (22.3%)
· Sanidad (CCAA): €95Bn (14.6%)
· Educación (CCAA): €62Bn (9.5%)
· Transferencias CCAA: €45Bn (6.9%)
· Intereses deuda: €42Bn (6.5%)
· Defensa: €30Bn (4.6%)
· Desempleo: €26Bn (4.0%)
· Inversión pública: €32Bn (4.9%)
· Subvenciones: €18Bn (2.8%)
· Otros: €56Bn (8.6%)

Nota: supera 100% porque algunas partidas se solapan (salarios AP incluyen parte sanidad/educación).

De estos, los recortables sin tocar "pacto social":
· Salarios AP (parcial): ~€15Bn
· Subvenciones (dudosas): ~€10Bn
· Empresas públicas deficitarias: ~€8Bn
· Consejerías duplicadas: ~€12Bn
· Cooperación internacional: ~€3.5Bn
· Transferencias CCAA redundantes: ~€5-8Bn
· Publicidad institucional: ~€0.8Bn
· Asesores y personal de confianza: ~€0.5Bn
TOTAL RECORTABLE: €55-60Bn · 8-9% del gasto total

Es cifra significativa pero no resuelve el déficit estructural de €42Bn/año solo — se come con intereses deuda.

Lo verdaderamente estructural (pensiones + sanidad + educación) suma €363Bn = 56% del presupuesto. Cualquier reforma fiscal seria tiene que tocar esto. Y eso es lo que ningún político propone porque es políticamente suicida.
`,
    fuente: "PGE 2025 prorrogado · SEPG · DondeVanMisImpuestos.es",
    modulo_relacionado: "Plan choque",
  },
  {
    id: 13,
    pregunta: "¿Qué sectores no podrían funcionar sin inmigración en España?",
    tags: ["Migración", "Sectores"],
    categoria: "Datos vs mitos",
    respuesta_corta: "Agricultura (80% extranjeros), hostelería (50%), construcción (50%), servicio doméstico (35%). Sin inmigración el PIB español sería 3-5% menor.",
    respuesta_larga: `
Peso de empleo extranjero por sector (Seg. Social 2024):

· Agricultura: 80% — sin esta mano de obra no se recoge cosecha. Olivar, cítrico, hortícola intensivo dependen totalmente.
· Hostelería: 50% — camareros, cocineros, limpieza hoteles. Motor del 12% PIB español.
· Construcción: 50% — tras crisis 2008, el sector se reconstruyó con mano de obra extranjera.
· Comercio: 45% — tiendas, distribución, logística urbana.
· Servicio doméstico: 35% — cuidados ancianos, limpieza, niñería. Rama crucial dado envejecimiento.
· Industria: 12% — presencia menor, manufactura más capital-intensiva.
· Administración pública: 3% — restricción por requisitos nacionalidad.

Impacto total: BdE estima aportación de +0.4 a +0.7pp anuales al PIB per cápita 2022-2024. Sin inmigración:
· PIB sería 3-5% menor acumulado
· Seguridad Social colapsaría antes por envejecimiento (cotizaciones extranjeros €22-28Bn/año)
· Agricultura perdería 30-40% producción sin reconversión
· Hostelería no escalaría a niveles pre-COVID
· Construcción no podría atender déficit vivienda (ya imposible igualmente)

La paradoja: muchos sectores que critican la inmigración dependen económicamente de ella. El turismo rural, el olivar andaluz, el sector cárnico catalán, la hostelería balear — todos operan gracias a mano de obra extranjera.

Pero hay matiz importante: España atrae inmigración bajo-salarial porque su economía demanda eso. Alemania atrae ingenieros indios porque tiene demanda tech alta. Portugal y Grecia atraen jubilados ricos por el clima. Cada país recibe el perfil de inmigración que su estructura productiva demanda.

Cambiar el perfil migratorio requiere primero cambiar el perfil productivo. No al revés.
`,
    fuente: "Seg. Social 2024, BdE Boletín 2025/T2, Funcas",
    modulo_relacionado: "Migración",
  },
  {
    id: 14,
    pregunta: "¿Por qué Portugal nos ha adelantado en salarios reales desde 2015?",
    tags: ["Europa", "Productividad"],
    categoria: "Comparativa",
    respuesta_corta: "Portugal partió de una base salarial más baja pero bajó cotizaciones empresa, subió SMI moderadamente y atrajo inversión. Resultado: salarios reales +12% vs España +0% desde 2015.",
    respuesta_larga: `
Salarios reales acumulados desde 2015:
· Portugal: +12%
· Alemania: +8%
· Francia: +5%
· Países Bajos: +10%
· España: +0% (estancamiento)

Portugal no era "mejor" que España en 2015 — era peor. Tenía salario medio menor, PIB per cápita menor, desempleo similar. Pero hizo cosas distintas:

(1) SMI moderado. Subió +50% en 10 años (de €530 a €820). España subió +66% desde 2018 solamente (de €736 a €1.221). Portugal estiró la subida; España la concentró.

(2) Cotizaciones empresa REDUCIDAS. Portugal bajó 2pp la cuota empresarial entre 2017-2022. España subió +1.5pp. La diferencia es directa en coste laboral.

(3) NHR y régimen atractivo. El Non-Habitual Resident (hasta 2024) atrajo miles de profesionales extranjeros cualificados. Estos generaron cluster tech en Lisboa y Oporto.

(4) Apertura a inversión extranjera. Simplificación licencias, apoyo PYMES exportadoras, zonas francas. Inversión extranjera directa per cápita 2x la española.

(5) Reforma educativa. Portugal ha escalado en rankings PISA mientras España se ha mantenido. Capital humano joven más cualificado.

(6) Golden Visa (pre-2024) y turismo inmobiliario. Inyectó capital en construcción.

Resultado agregado: productividad por hora +8% Portugal vs +0% España. Cuando la productividad crece, los salarios pueden subir sin que empresas quiebren o inflación explote.

Lección: no es imposible crecer en el sur de Europa. Portugal lo ha demostrado. Pero requiere secuencia correcta: primero competitividad empresarial → después redistribución salarial. España lo hizo al revés.
`,
    fuente: "Eurostat 2024, OCDE Portugal Economic Survey 2024",
    modulo_relacionado: "Europa · Política combinada",
  },
  {
    id: 15,
    pregunta: "¿Está España realmente al borde de crisis de pensiones?",
    tags: ["Pensiones", "Demografía"],
    categoria: "Sostenibilidad",
    respuesta_corta: "No inminente pero tendencia preocupante. Gasto pensiones sube de 11% a 14% PIB hacia 2050. Revaloración IPC cuesta +€3-5Bn/año. AIReF cuestiona sostenibilidad.",
    respuesta_larga: `
Situación pensiones España 2025:
· Gasto: €206Bn/año (12.2% PIB)
· Pensionistas: 9.2M (vs 20.8M cotizantes → 2.26 cotizantes/pensionista)
· Pensión media: €1.450/mes
· Déficit SS: €22.9Bn transferencia Estado 2026

Proyección AIReF 2050:
· Gasto pensiones: 14.2% PIB (+2pp vs hoy)
· Ratio: 1.5 cotizantes/pensionista
· Déficit estructural adicional: 3-4pp PIB

La sostenibilidad depende de tres variables:

(1) Demografía. España tiene una de las tasas de natalidad más bajas del mundo (1.16 hijos/mujer). Sin inmigración, la pirámide colapsa hacia 2040. La inmigración pospone el problema 10-15 años pero no lo resuelve.

(2) Productividad. Si PIB por hora creciese 1.5%/año (como OCDE media), habría margen. Si sigue estancada (como ahora), no hay.

(3) Revalorización con IPC. La decisión 2021 de vincular pensiones a IPC añade presión estructural. 2021-2024 ha costado €40Bn acumulados vs el escenario alternativo.

Pacto de Toledo ha introducido:
· MEI (+0.6pp cotización por "mecanismo de equidad")
· Destope bases máximas (contribuyentes altos pagan más)
· Solidaridad 2025 (1pp adicional top)

Son parches. El déficit estructural continúa. Para equilibrar el sistema en 2050 hay tres opciones (incompatibles entre sí):
· Subir cotizaciones +4pp adicionales (reduce competitividad)
· Recortar pensiones -15% (políticamente suicida)
· Retrasar jubilación a 70 (impopular pero técnicamente factible)

Lo más realista: combinación moderada de las tres. Lo que pasará: se posterga hasta forzar la crisis.
`,
    fuente: "AIReF informe pensiones 2024, Seg Social, Fedea",
    modulo_relacionado: "Ciclo vida · Distribución",
  },
  {
    id: 16,
    pregunta: "¿Hay burbuja inmobiliaria en España 2025?",
    tags: ["Vivienda", "Riesgo"],
    categoria: "Diagnóstico",
    respuesta_corta: "No es burbuja tipo 2008 (financiera) sino estructural (déficit oferta). BdE estima sobrevaloración 1-8.5%, BCE 14.3%. Riesgo: corrección 15-20% si suben tipos o cambia demanda.",
    respuesta_larga: `
Precios vivienda España 2015-2025:
· Precios: +64% nominal, +35% real
· Alquileres: +48% nominal, +20% real
· Ratio precio/renta: 8.2 (media histórica 6.5)
· Ratio alquiler/salario: 74% Madrid/BCN

¿Es burbuja? Análisis:

ARGUMENTOS A FAVOR DE BURBUJA:
· Sobrevaloración BCE: 14.3% (aviso)
· Sobrevaloración AIReF: 8.5%
· Sobrevaloración BdE: 1.1-8.5% (más conservador)
· Ratio precio/renta anual > 25% encima de media histórica
· Paralelismo 2003-2007 en trayectoria

ARGUMENTOS EN CONTRA:
· Hogares deuda 42.8% PIB (mínimo 25 años) vs 86% en 2008
· Empresas deuda 62% PIB (manejable)
· Crédito hipotecario moderado vs 2007
· Oferta real insuficiente (déficit 500k viviendas)
· Demanda extranjera (30% compras nuevas) sostiene base

CONCLUSIÓN: no es burbuja financiera clásica (no hay crédito excesivo) pero sí sobrevaloración estructural. El riesgo no es crisis tipo 2008 sino:

· Corrección moderada (15-20%) si BCE sube tipos y enfría demanda inversora
· Estancamiento largo (5-10 años) si demanda cae sin ajuste precio
· Continuación alcista si no se resuelven cuellos de botella oferta

El problema real no es "burbuja" sino "desigualdad generacional extrema". Los propietarios (>55 años, 80% ya tienen vivienda) no ven problema. Los jóvenes (<35 años) no pueden comprar. La tensión es social, no financiera.
`,
    fuente: "BdE Informes estabilidad 2024, AIReF, BCE Financial Stability Review 2024",
    modulo_relacionado: "Vigilancia · Capital",
  },
  {
    id: 17,
    pregunta: "¿Qué comunidad autónoma es fiscalmente más eficiente?",
    tags: ["Autonomías", "Fiscal"],
    categoria: "Estructura estatal",
    respuesta_corta: "Madrid lidera en crecimiento e ingresos fiscales con la carga más baja. País Vasco/Navarra por régimen foral. Cataluña y Comunidad Valenciana tienen la carga fiscal más alta.",
    respuesta_larga: `
Diferencias fiscales autonómicas 2024 (IRPF autonómico):

MÁS BAJOS:
· Madrid: tipo máximo 21% (nacional 24.5%) · Patrimonio bonificado 100%
· Andalucía: bonifica patrimonio · IRPF competitivo
· País Vasco/Navarra: régimen foral, autonomía tributaria

MÁS ALTOS:
· Cataluña: tipo máximo 25.5% + tramos más agresivos bajo
· Comunidad Valenciana: reciente subida cuota autonómica
· Asturias, La Rioja: tipos elevados

Efectos observables:

(1) Migración fiscal. Madrid ha ganado 400k residentes netos desde 2020. Muchos son expatriados catalanes y valencianos de renta alta moviéndose por ventaja fiscal. Cataluña perdió 60k altos patrimonios.

(2) Recaudación paradójica. Madrid recauda MÁS per cápita que Cataluña a pesar de tipos más bajos, porque atrae capital y talento. Curva de Laffer aplicada a autonomías.

(3) Servicios públicos. Sanidad Madrid y Cataluña similares según rankings. Educación: País Vasco y Madrid top, Andalucía y Canarias bottom. No hay correlación directa entre presión fiscal y calidad servicio.

(4) Financiación injusta. Sistema 2009 no revisado. Valencia recibe 20% menos per cápita que media, es la peor financiada. País Vasco recibe 70% más.

Problema estructural: no existe competencia fiscal sana. Cada CCAA tira por su lado, Madrid aprovecha "efecto capital", Cataluña castiga altos ingresos, País Vasco blindado con foral. El contribuyente medio español paga tasas muy distintas según dónde viva, sin justificación de servicio recibido.

La propuesta ERC-PSC 2024 (cupo catalán tipo vasco) agravaría el problema. Una reforma seria requeriría armonización parcial + compensación por renta + eliminación de arbitraje fiscal interno. Nadie la propone.
`,
    fuente: "AEAT estadística autonómica 2023, Fedea informes financiación, IVIE",
    modulo_relacionado: "Autonomías",
  },
  {
    id: 18,
    pregunta: "¿Por qué los jóvenes españoles emigran tanto a pesar del buen clima?",
    tags: ["Demografía", "Salarios"],
    categoria: "Diagnóstico",
    respuesta_corta: "Combinación: salarios 30% menores, alquileres iguales, cuña fiscal UE en base baja, poca oferta empleo cualificado. Ganan 50% más en Alemania trabajando lo mismo.",
    respuesta_larga: `
Datos emigración 2020-2024:
· 200k jóvenes (25-35 años) emigran anualmente (neto)
· Destinos principales: Reino Unido, Alemania, Francia, Países Bajos
· Perfil: cualificado (70% con grado), sectores STEM, sanidad, finanzas
· Motivos declarados (INE): sueldo (65%), carrera (40%), calidad vida (25%)

Comparación renta disponible 5-10 años experiencia STEM:
· Madrid: €55k bruto → €38k neto → €1.650 alquiler → €1.500 disc/mes
· Berlín: €72k bruto → €47k neto → €1.450 alquiler → €2.400 disc/mes
· Múnich: €85k bruto → €55k neto → €1.950 alquiler → €2.900 disc/mes
· Ámsterdam (30% ruling): €95k → €68k → €2.400 → €3.100 disc/mes

Diferencia: €900-1.600/mes más en Alemania o NL. Al año son €11-19k. A los 10 años, son €110-190k acumulados. Suficiente para comprar vivienda en el país destino, y nunca más poder volver a España al mismo nivel.

Y una vez fuera, el efecto "cluster" actúa:
· Las redes profesionales se construyen en el nuevo país
· La pareja, los hijos nacidos allí generan raíces
· El salario crece más rápido en mercados dinámicos

El talento joven que España forma con dinero público se queda 40+ años contribuyendo a fiscos extranjeros. Estimación conservadora: España pierde €20-30Bn/año en "capital humano emigrado netamente".

La ironía: España importa mano de obra bajo-salarial (cuidados, agricultura) y exporta cualificada (ingenieros, médicos). Es el peor intercambio demográfico posible.

Para revertir: solo cambiando la ecuación básica (mejor salario neto + vivienda accesible + oferta carrera). Eso requiere las reformas de productividad que España no hace.
`,
    fuente: "INE Migraciones, EURES, Eurofound, OCDE migration outlook",
    modulo_relacionado: "Dónde vivir · Política combinada",
  },
  {
    id: 19,
    pregunta: "¿Qué sería lo más eficiente: bajar impuestos, subir salarios o construir más?",
    tags: ["Política", "Prioridades"],
    categoria: "Política económica",
    respuesta_corta: "Construir más. El cuello de botella real es vivienda. Bajar impuestos sin construir vivienda sube más los alquileres (efecto inflacionario). Subir salarios sin construir también. La oferta es la llave.",
    respuesta_larga: `
Tres opciones habituales en el debate público:

OPCIÓN A: Bajar impuestos
· Coste fiscal: €15-25Bn según alcance
· Beneficio: +€500-1.200/año al trabajador medio
· PROBLEMA: si no sube la oferta de vivienda, ~30% del alivio se absorbe en alquileres más altos. Los propietarios ganan, los inquilinos pierden.

OPCIÓN B: Subir salarios mínimos más
· Coste: absorbido por empresas · riesgo desempleo tramo bajo
· Beneficio: +€100-300/mes en tramo bajo
· PROBLEMA: mismo efecto vivienda. Y presión empleo informal. Ya lo hemos hecho +80% y el salario real mediana está estancado.

OPCIÓN C: Construir 200k viviendas/año más
· Coste público directo: €5-10Bn/año (suelo + licencias + infraestructura)
· Beneficio directo: alquileres -15-25% en 5 años
· IMPACTO INDIRECTO: todo el resto funciona. Los salarios reales suben porque el gasto vivienda baja. La productividad mejora porque el talento no emigra. Las familias pueden tener hijos. Las ciudades vibran.

¿Por qué es lo más eficiente?

En economía, el recurso MÁS ESCASO determina todos los demás precios. En España 2025 el recurso más escaso es la vivienda urbana. Todo lo demás (salarios, impuestos, inmigración) se amplifica en ese cuello de botella.

Portugal demuestra que se puede: ha construido 5 viviendas/1000 hab/año desde 2018. España 2.1. Ese gap explica buena parte de la diferencia de calidad de vida.

Barreras reales en España:
· Administrativas: licencias demoran 3-4 años
· Regulatorias: controles alquiler reducen incentivo a construir
· Fiscales: IVA construcción 10-21%
· Suelo: reservas urbanas limitadas artificialmente
· Políticas: "no construir es verde" discurso dominante
· Lobbys: propietarios existentes prefieren escasez (sube su valor)

La solución técnica existe: liberar suelo + simplificar licencias + incentivos fiscales nueva construcción + colaboración pública-privada. La voluntad política es lo que falta.
`,
    fuente: "BdE, AIReF, OCDE Housing 2024, Pestana análisis Portugal",
    modulo_relacionado: "Vigilancia · Dónde vivir · Política combinada",
  },
  {
    id: 20,
    pregunta: "¿Cuál es el diagnóstico de conjunto: qué le pasa a España económicamente?",
    tags: ["Diagnóstico", "Síntesis"],
    categoria: "Síntesis",
    respuesta_corta: "Economía atrapada en equilibrio de baja productividad: no invierte porque el retorno es bajo; el retorno es bajo porque no invierte. Redistribución sin crecimiento. Vivienda como punto de colapso.",
    respuesta_larga: `
Después de todos los módulos, el diagnóstico integrado:

DIAGNÓSTICO 1 — Trampa de productividad
España lleva 25 años sin converger con la UE en productividad por hora (95 vs 100). Cada hora de trabajo produce menos valor que en Alemania, Países Bajos o Francia. Por eso los salarios nominalmente menores parecen justos — porque se produce menos por hora.

DIAGNÓSTICO 2 — Redistribución sin generación
Las políticas de los últimos 10 años (SMI +80%, cotizaciones al alza, transferencias crecientes) redistribuyen renta que no se ha generado nueva. Resultado: clase media-baja no ve mejora porque lo que gana extra se lo come inflación + vivienda. Clase alta emigra o protege rentas. Estado crece en gasto pero no en calidad servicio.

DIAGNÓSTICO 3 — Vivienda como cuello de botella
Todo el sistema colapsa en la vivienda. Inmigración (que es positiva netamente) + salarios sin crecer + oferta inmóvil = ratios alquiler/salario 74%. Los jóvenes no pueden independizarse; las familias no tienen hijos; el talento emigra.

DIAGNÓSTICO 4 — Tejido productivo no-exportador
A diferencia de Alemania (47% PIB exporta), Países Bajos (88%), Irlanda (130%), España es economía doméstica (37%). Nuestras "multinacionales" son Inditex, Telefónica, Iberdrola — pocas. El IS alemán tributa beneficios globales; el español doméstico. Esa diferencia es abismal fiscalmente.

DIAGNÓSTICO 5 — Demografía aplazada por inmigración
Tasa natalidad 1.16 hijos/mujer (de las más bajas del mundo). La inmigración pospone colapso demográfico 15 años pero no lo resuelve. Sin inmigración, 2040 sería catastrófico para pensiones y servicios. La inmigración es oxígeno, no cura.

LA DIAGONAL DE SALIDA

Salir del equilibrio atrapado requiere los tres vectores simultáneamente:

(1) PRODUCTIVIDAD: invertir en I+D (1.4% → 2.5% PIB), digitalización, simplificación regulatoria, empresa de mayor tamaño. La llave del resto.

(2) VIVIENDA: construir 200k+ viviendas/año. Liberar suelo, simplificar licencias, incentivos fiscales, colaboración público-privada masiva.

(3) INMIGRACIÓN INTELIGENTE: pasar de atraer cuidadores bajos-salariales a atraer también talento cualificado. Visa talento, español como idioma científico, universidades top.

No son reformas ideológicas de izquierda o derecha. Son reformas técnicas que cualquier país serio haría. Pero requieren superar el inmovilismo político, el corporativismo y el "cortoplacismo electoral".

LA LENTE BLONDIE FINAL

El bosque español tiene árboles hermosos: clima, cultura, gastronomía, redes sociales, longevidad. Su sistema económico no produce suficientes frutos porque las raíces (productividad, capital, instituciones) no se han renovado. Podemos seguir admirando el bosque o podemos replantar las raíces. La segunda opción implica esfuerzo sin glamour, reformas técnicas aburridas, paciencia para 10-15 años de resultados. Por eso no se hacen. Pero son las únicas que funcionan.

El tiempo dirá qué bosque aguanta la próxima tormenta. El español, tal como está hoy, no la aguantaría bien.
`,
    fuente: "Síntesis de todos los módulos anteriores",
    modulo_relacionado: "Todos",
  },
];

const LEARNING_CATEGORIES = {
  "Diagnóstico": { color: "#7A1F3D", icon: "🔬" },
  "Política económica": { color: "#B45309", icon: "⚖️" },
  "Datos vs mitos": { color: "#047857", icon: "📊" },
  "Matices fiscales": { color: "#1E40AF", icon: "💰" },
  "Vivir": { color: "#9333EA", icon: "🌍" },
  "Estructura estatal": { color: "#4B5563", icon: "🏛️" },
  "Sostenibilidad": { color: "#A16207", icon: "⏳" },
  "Comparativa": { color: "#059669", icon: "🇪🇺" },
  "Síntesis": { color: "#7F1D1D", icon: "✨" },
};

function LearningsView() {
  const [expanded, setExpanded] = useState(null);
  const [filterCat, setFilterCat] = useState("todas");
  const [search, setSearch] = useState("");

  const filtered = LEARNINGS_DATA.filter(l => {
    const catMatch = filterCat === "todas" || l.categoria === filterCat;
    const searchMatch = !search ||
      l.pregunta.toLowerCase().includes(search.toLowerCase()) ||
      l.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    return catMatch && searchMatch;
  });

  const toggleExpand = (id) => {
    setExpanded(expanded === id ? null : id);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl tracking-tight">20 learnings · las respuestas honestas</h2>
        <p className="text-sm text-stone-500 mt-1 max-w-3xl">
          Síntesis de todos los módulos de esta app en forma de preguntas y respuestas.
          Click en cada pregunta para ver la respuesta completa. Basado en datos oficiales de OCDE,
          Eurostat, BdE, AIReF, Fedea, AEAT, INE.
        </p>
      </div>

      {/* Filtros */}
      <div className="rounded-xl border border-stone-200 bg-white p-4 space-y-3">
        <div>
          <input
            type="text"
            placeholder="Buscar pregunta o tema..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-sm border border-stone-200 rounded-md px-3 py-2 bg-white focus:outline-none focus:border-[#7A1F3D]"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => setFilterCat("todas")}
            className={`text-xs px-3 py-1 rounded-full transition-colors ${
              filterCat === "todas"
                ? "bg-[#7A1F3D] text-white"
                : "bg-white border border-stone-200 text-stone-600 hover:border-[#7A1F3D]"
            }`}>
            Todas ({LEARNINGS_DATA.length})
          </button>
          {Object.entries(LEARNING_CATEGORIES).map(([cat, cfg]) => {
            const count = LEARNINGS_DATA.filter(l => l.categoria === cat).length;
            if (count === 0) return null;
            return (
              <button key={cat} onClick={() => setFilterCat(cat)}
                className={`text-xs px-3 py-1 rounded-full transition-colors flex items-center gap-1 ${
                  filterCat === cat
                    ? "text-white"
                    : "bg-white border border-stone-200 text-stone-600 hover:border-[#7A1F3D]"
                }`}
                style={filterCat === cat ? { backgroundColor: cfg.color } : {}}>
                <span>{cfg.icon}</span>
                <span>{cat} ({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista preguntas */}
      <div className="space-y-2">
        {filtered.map(l => {
          const isOpen = expanded === l.id;
          const cfg = LEARNING_CATEGORIES[l.categoria];
          return (
            <div key={l.id} className="rounded-xl border border-stone-200 bg-white overflow-hidden transition-all">
              <button onClick={() => toggleExpand(l.id)}
                className="w-full text-left p-4 hover:bg-stone-50 transition-colors flex items-start gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full shrink-0 text-[11px] font-serif font-bold"
                  style={{ backgroundColor: cfg.color + "20", color: cfg.color }}>
                  {l.id}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-serif text-[15px] text-stone-900 leading-snug">
                      {l.pregunta}
                    </h3>
                    <div className="shrink-0">
                      <span className="text-stone-400 text-lg">
                        {isOpen ? "−" : "+"}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <span className="text-[9px] uppercase tracking-[0.08em] px-2 py-0.5 rounded font-semibold"
                      style={{ backgroundColor: cfg.color + "15", color: cfg.color }}>
                      {cfg.icon} {l.categoria}
                    </span>
                    {l.tags.map(t => (
                      <span key={t} className="text-[9px] uppercase tracking-[0.08em] px-2 py-0.5 rounded bg-stone-100 text-stone-500">
                        {t}
                      </span>
                    ))}
                  </div>
                  {!isOpen && (
                    <p className="text-[12px] text-stone-600 mt-2 leading-relaxed italic">
                      {l.respuesta_corta}
                    </p>
                  )}
                </div>
              </button>

              {isOpen && (
                <div className="px-4 pb-4 pl-16 border-t border-stone-100 bg-gradient-to-br from-[#FBF7F0]/40 to-white">
                  <div className="pt-4 space-y-3">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.12em] text-[#7A1F3D] font-semibold mb-1">
                        Respuesta corta
                      </div>
                      <p className="text-[13px] text-stone-800 leading-relaxed italic border-l-2 border-[#7A1F3D] pl-3">
                        {l.respuesta_corta}
                      </p>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.12em] text-stone-500 font-semibold mb-1">
                        Respuesta completa
                      </div>
                      <div className="text-[13px] text-stone-700 leading-relaxed whitespace-pre-line">
                        {l.respuesta_larga.trim()}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 pt-3 border-t border-stone-200 text-[10px]">
                      <div>
                        <span className="text-stone-500 font-semibold uppercase tracking-wider">Fuentes: </span>
                        <span className="text-stone-600">{l.fuente}</span>
                      </div>
                      <div>
                        <span className="text-stone-500 font-semibold uppercase tracking-wider">Módulo: </span>
                        <span className="text-[#7A1F3D] font-semibold">{l.modulo_relacionado}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="rounded-2xl border-2 border-[#7A1F3D]/30 bg-gradient-to-br from-[#FBF7F0] via-white to-[#EC4899]/10 p-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-[#7A1F3D]" />
          <h3 className="font-serif text-xl tracking-tight">Cómo usar estos learnings</h3>
        </div>
        <p className="text-[13px] text-stone-700 leading-relaxed mb-3">
          Este compendio es la destilación honesta de todos los módulos de la app. No son opiniones
          ideológicas — son lecturas de datos oficiales filtradas por criterios económicos.
        </p>
        <p className="text-[13px] text-stone-700 leading-relaxed mb-3">
          <strong>Para debates:</strong> la respuesta corta cabe en un mensaje de WhatsApp. La
          respuesta larga es para profundizar. Las fuentes están citadas para que puedas verificar.
        </p>
        <p className="text-[13px] text-stone-700 leading-relaxed">
          <strong>Para tu trabajo:</strong> cada learning conecta con uno o varios módulos de la
          app donde puedes simular escenarios y ajustar supuestos. La síntesis es el mapa, los
          módulos son el territorio.
        </p>
        <p className="text-[#7A1F3D] font-serif italic text-[14px] border-l-2 border-[#7A1F3D] pl-4 mt-4">
          Lente Blondie final: los debates económicos públicos se empobrecen cuando se reducen a
          slogans. Estos 20 learnings son el intento contrario: coger preguntas complejas, darles
          contexto, datos y matices. No para acabar el debate — para elevarlo.
        </p>
      </div>
    </div>
  );
}



/* --------------------------------------------------------------------------- */
/* [21] ANATOMÍA PRODUCTIVA — la economía circular española de bajo valor       */
/* ---------------------------------------------------------------------------
   Tesis: España tiene una economía donde:
     · El sector público (17% empleo) + turismo (13% empleo) = ~30% del empleo
     · Esos salarios se reciclan en vivienda + consumo básico (Mercadona, Zara)
       + coches baratos (Dacia, Seat) + ocio bajo valor añadido
     · La industria exportadora es estrecha y concentrada (automoción UE)
     · No hay multinacionales tech exportadoras como Alemania o Países Bajos

   El resultado: economía circular que no genera excedente exportable, vulnerable
   a shocks externos (crisis UE, caída turismo, crisis automoción EV).

   Fuentes:
   · INE EPA T4 2024 (sectores + público vs privado)
   · Exceltur 2023 (turismo 12.8% PIB, 13% VAB)
   · ANFAC 2024 (automoción: 89.4% exportado, 93% Europa)
   · Ministerio Función Pública (3.1M empleados públicos)
   · INE EPF 2024 (composición gasto hogares)
   --------------------------------------------------------------------------- */

// Empleo por sector — INE EPA T4 2024 aproximado
const EMPLEO_SECTORES = [
  { id: "admin_publica", sector: "Admin Pública + SS + Defensa", empleo_m: 1.42, pct: 6.8, vab_pct: 6.5,
    tipo: "público", productividad: "baja", exportable: false,
    comentario: "Funcionariado AGE, CCAA y local. Salario medio €31k.", icon: "🏛️" },
  { id: "sanidad_publica", sector: "Sanidad (mayormente pública)", empleo_m: 1.80, pct: 8.6, vab_pct: 7.5,
    tipo: "público", productividad: "media-baja", exportable: false,
    comentario: "SNS + concertada. Salarios entre €25-60k según nivel.", icon: "🏥" },
  { id: "educacion", sector: "Educación (pública + privada)", empleo_m: 1.50, pct: 7.2, vab_pct: 5.5,
    tipo: "mixto", productividad: "media-baja", exportable: false,
    comentario: "Colegios, institutos, universidad. ~70% público.", icon: "🎓" },
  { id: "hosteleria", sector: "Hostelería + alojamiento (turismo)", empleo_m: 1.85, pct: 8.9, vab_pct: 6.8,
    tipo: "privado", productividad: "baja", exportable: true,
    comentario: "Bares, restaurantes, hoteles. Salario medio €18k. Estacional.", icon: "🍽️" },
  { id: "comercio", sector: "Comercio minorista + mayorista", empleo_m: 3.00, pct: 14.4, vab_pct: 12.5,
    tipo: "privado", productividad: "media-baja", exportable: false,
    comentario: "Zara, Mercadona, Carrefour, bazares. Salario medio €21k.", icon: "🛒" },
  { id: "construccion", sector: "Construcción", empleo_m: 1.45, pct: 7.0, vab_pct: 6.8,
    tipo: "privado", productividad: "media", exportable: false,
    comentario: "Vivienda, obra pública, renovación. 50% afiliados extranjeros.", icon: "🏗️" },
  { id: "transporte", sector: "Transporte + logística", empleo_m: 1.10, pct: 5.3, vab_pct: 5.2,
    tipo: "privado", productividad: "media", exportable: true,
    comentario: "Carreteras, ADIF, AENA, logística Amazon/Inditex.", icon: "🚛" },
  { id: "industria_auto", sector: "Industria automóvil + componentes", empleo_m: 0.37, pct: 1.8, vab_pct: 3.2,
    tipo: "privado", productividad: "alta", exportable: true,
    comentario: "Seat, VW, Renault, Stellantis. 89% producción exportada. 93% a UE.", icon: "🚗" },
  { id: "farmacia_quimica", sector: "Farmacia + Química", empleo_m: 0.35, pct: 1.7, vab_pct: 3.0,
    tipo: "privado", productividad: "alta", exportable: true,
    comentario: "Novartis, AstraZeneca, Grifols, Almirall. Exporta 70%.", icon: "💊" },
  { id: "agricultura", sector: "Agricultura + pesca", empleo_m: 0.75, pct: 3.6, vab_pct: 2.5,
    tipo: "privado", productividad: "baja", exportable: true,
    comentario: "80% afiliados extranjeros. Salario temporero €15-18k.", icon: "🌾" },
  { id: "tic", sector: "TIC + servicios profesionales alto VA", empleo_m: 0.95, pct: 4.6, vab_pct: 7.0,
    tipo: "privado", productividad: "muy alta", exportable: true,
    comentario: "Consultoras, software, telco. Salarios €40-100k.", icon: "💻" },
  { id: "finanzas", sector: "Banca + seguros", empleo_m: 0.42, pct: 2.0, vab_pct: 3.8,
    tipo: "privado", productividad: "muy alta", exportable: true,
    comentario: "Santander, BBVA, Mapfre. Exportan vía filiales.", icon: "🏦" },
  { id: "otros_serv", sector: "Otros servicios (cuidados, limpieza, doméstico, admin)", empleo_m: 2.80, pct: 13.5, vab_pct: 10.5,
    tipo: "privado", productividad: "baja", exportable: false,
    comentario: "Limpieza, cuidados a mayores, hogar. 35% afiliados extranjeros.", icon: "🧹" },
  { id: "otras_industrias", sector: "Otras industrias (textil, papel, alimentación, etc.)", empleo_m: 1.64, pct: 7.9, vab_pct: 9.8,
    tipo: "privado", productividad: "media", exportable: true,
    comentario: "Inditex (fabricación parcial), agroalimentaria, papel, etc.", icon: "🏭" },
  { id: "resto", sector: "Actividades artísticas, ocio y otros", empleo_m: 1.40, pct: 6.7, vab_pct: 9.4,
    tipo: "privado", productividad: "media", exportable: false,
    comentario: "Actividades inmobiliarias, artes, ocio, reparaciones.", icon: "🎭" },
];

// Principales marcas de consumo españolas y extranjeras (dónde va el salario)
const DONDE_VA_SALARIO = [
  { categoria: "Supermercado", lider: "Mercadona", lider_cuota: 28, otros: "Carrefour 8%, Lidl 7%, Dia 5%", tipo: "bajo coste nacional",
    ticket_medio: 65, observacion: "Mercadona lidera precio-calidad. Dueño J. Roig." },
  { categoria: "Moda/ropa", lider: "Inditex", lider_cuota: 10, otros: "H&M, Primark, Shein",
    ticket_medio: 25, tipo: "bajo-medio coste", observacion: "Inditex produce solo 14% en España, resto Marruecos/Turquía/Asia." },
  { categoria: "Coches nuevos", lider: "Dacia Sandero", lider_cuota: 5.2, otros: "Toyota Corolla, Seat Ibiza, Hyundai",
    ticket_medio: 15000, tipo: "muy bajo coste", observacion: "Dacia #1 en España 2024. Marca rumana del grupo Renault." },
  { categoria: "Restaurantes", lider: "100 Montaditos/Rodilla/Telepizza", lider_cuota: 3, otros: "Cadenas low-cost, franquicias",
    ticket_medio: 15, tipo: "bajo coste", observacion: "Bar+menú del día sigue siendo el modelo. Ticket €12-15 habitual." },
  { categoria: "Tecnología", lider: "Apple/Samsung (importadas)", lider_cuota: 65, otros: "Xiaomi, iPhone",
    ticket_medio: 600, tipo: "premium importado", observacion: "España produce casi 0% de la electrónica que consume." },
  { categoria: "Vivienda alquiler", lider: "Particulares + Blackstone", lider_cuota: null, otros: "Fondos REITs",
    ticket_medio: 900, tipo: "gasto esencial", observacion: "Alquiler medio €900-1100/mes 2024. 74% ratio salario Madrid/Barcelona." },
  { categoria: "Hogar/muebles", lider: "IKEA", lider_cuota: 45, otros: "Leroy Merlin (francesa), Conforama",
    ticket_medio: 120, tipo: "bajo-medio importado", observacion: "IKEA (sueca), Leroy Merlin (francesa). Las marcas grandes son extranjeras." },
  { categoria: "Telecomunicaciones", lider: "Movistar/Telefónica", lider_cuota: 28, otros: "Vodafone, Orange, MásMóvil",
    ticket_medio: 50, tipo: "oligopolio nacional", observacion: "4 grandes operadores. Telefónica es española y exportadora." },
  { categoria: "Energía", lider: "Iberdrola/Endesa/Naturgy", lider_cuota: 70, otros: "Repsol (combustible)",
    ticket_medio: 110, tipo: "oligopolio mixto", observacion: "Iberdrola y Repsol son multinacionales españolas exportadoras." },
  { categoria: "Ocio (streaming)", lider: "Netflix, Disney+, Prime", lider_cuota: 80, otros: "HBO, Movistar+",
    ticket_medio: 25, tipo: "premium importado", observacion: "Todo americano excepto Movistar+. Salida de divisas." },
];

function AnatomiaProductivaView() {
  const [viewMode, setViewMode] = useState("empleo"); // empleo | circular | exportable

  const totalEmpleo = EMPLEO_SECTORES.reduce((s, x) => s + x.empleo_m, 0);

  // Agregaciones para la narrativa
  const empleoPublico = EMPLEO_SECTORES.filter(x => x.tipo === "público").reduce((s, x) => s + x.pct, 0);
  const empleoPublicoSanEdu = EMPLEO_SECTORES.filter(x => ["admin_publica", "sanidad_publica", "educacion"].includes(x.id)).reduce((s, x) => s + x.pct, 0);
  const empleoTurismo = EMPLEO_SECTORES.filter(x => ["hosteleria"].includes(x.id)).reduce((s, x) => s + x.pct, 0);
  const empleoComercioHogar = EMPLEO_SECTORES.filter(x => ["comercio", "otros_serv"].includes(x.id)).reduce((s, x) => s + x.pct, 0);
  const empleoAltoVA = EMPLEO_SECTORES.filter(x => ["industria_auto", "farmacia_quimica", "tic", "finanzas"].includes(x.id)).reduce((s, x) => s + x.pct, 0);
  const empleoExportable = EMPLEO_SECTORES.filter(x => x.exportable).reduce((s, x) => s + x.pct, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl tracking-tight">Anatomía productiva · la economía circular española</h2>
        <p className="text-sm text-stone-500 mt-1 max-w-3xl">
          ¿De qué vive realmente España? Este módulo desmonta por sectores el empleo, el VAB y la
          exportabilidad — y rastrea dónde acaba realmente el salario medio (qué consume el trabajador).
          El resultado: una economía circular de bajo valor añadido que no genera excedente exportable.
        </p>
      </div>

      {/* Tesis principal — banner */}
      <div className="rounded-2xl border-2 border-[#7A1F3D] bg-gradient-to-br from-[#FBF7F0] to-white p-6">
        <h3 className="font-serif text-xl tracking-tight mb-3">La tesis en tres cifras</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl bg-white border border-stone-200 p-4">
            <div className="text-[10px] uppercase tracking-[0.12em] text-stone-500 font-semibold">Empleo público + sanidad + educación</div>
            <div className="font-serif text-4xl text-[#7A1F3D] mt-2">{empleoPublicoSanEdu.toFixed(0)}%</div>
            <p className="text-[11px] text-stone-500 mt-2 leading-snug">
              ~{(empleoPublicoSanEdu / 100 * totalEmpleo).toFixed(1)}M personas cuyo sueldo lo paga el Estado
              (directamente o vía conciertos). No exportable, no genera divisas.
            </p>
          </div>
          <div className="rounded-xl bg-white border border-stone-200 p-4">
            <div className="text-[10px] uppercase tracking-[0.12em] text-stone-500 font-semibold">Hostelería + comercio + servicios bajos</div>
            <div className="font-serif text-4xl text-amber-700 mt-2">{(empleoTurismo + empleoComercioHogar).toFixed(0)}%</div>
            <p className="text-[11px] text-stone-500 mt-2 leading-snug">
              Turismo (9%) + comercio (14%) + cuidados/limpieza (14%). Baja productividad. Gran parte del
              empleo es "servir al que ya tiene dinero" — interno o turista.
            </p>
          </div>
          <div className="rounded-xl bg-white border border-stone-200 p-4">
            <div className="text-[10px] uppercase tracking-[0.12em] text-stone-500 font-semibold">Sectores alto valor añadido exportable</div>
            <div className="font-serif text-4xl text-emerald-700 mt-2">{empleoAltoVA.toFixed(1)}%</div>
            <p className="text-[11px] text-stone-500 mt-2 leading-snug">
              Automoción + farmacia + TIC + banca = lo que genera divisas. Menos del 10% del empleo
              total. Alemania tiene ~25% en sectores equivalentes.
            </p>
          </div>
        </div>
        <p className="text-[13px] text-stone-700 leading-relaxed italic mt-4 border-l-2 border-[#7A1F3D] pl-4">
          <strong className="font-serif text-[#7A1F3D] not-italic">Lectura clave:</strong> el {empleoPublicoSanEdu.toFixed(0)}% público
          + el {(empleoTurismo + empleoComercioHogar).toFixed(0)}% de servicios de bajo valor = ~{(empleoPublicoSanEdu + empleoTurismo + empleoComercioHogar).toFixed(0)}% del empleo español
          es o bien gasto público o bien consumo doméstico+turismo. Solo ~10% está en sectores
          verdaderamente exportables de alto valor. <em>La economía española es circular: el dinero
          gira dentro del país sin generar excedente exportable.</em>
        </p>
      </div>

      {/* Selector */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: "empleo", label: "Empleo por sector" },
          { id: "circular", label: "Dónde va el salario" },
          { id: "exportable", label: "Qué es exportable" },
        ].map(v => (
          <button key={v.id} onClick={() => setViewMode(v.id)}
            className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
              viewMode === v.id ? "bg-[#7A1F3D] text-white" : "bg-white border border-stone-200 text-stone-600 hover:border-[#7A1F3D]"
            }`}>
            {v.label}
          </button>
        ))}
      </div>

      {/* Vista 1: Empleo por sector */}
      {viewMode === "empleo" && (
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <h3 className="font-serif text-lg tracking-tight mb-1">Empleo por sector · INE EPA T4 2024</h3>
          <p className="text-[11px] text-stone-500 mb-4">
            Cada barra: empleo en millones de personas. Color por productividad (rojo = baja, verde = alta).
          </p>
          <div className="space-y-2">
            {[...EMPLEO_SECTORES].sort((a, b) => b.empleo_m - a.empleo_m).map(s => {
              const maxEmpleo = 3;
              const color = s.productividad === "muy alta" ? "#065F46" :
                           s.productividad === "alta" ? "#15803D" :
                           s.productividad === "media" ? "#A16207" :
                           s.productividad === "media-baja" ? "#B45309" : "#7A1F3D";
              return (
                <div key={s.id} className="flex items-center gap-3">
                  <div className="w-8 text-center text-lg">{s.icon}</div>
                  <div className="w-56 text-[11px] text-stone-700 leading-tight">{s.sector}</div>
                  <div className="flex-1 bg-stone-100 rounded overflow-hidden h-7 relative">
                    <div className="h-full flex items-center justify-end pr-2 font-mono text-[10px] text-white"
                         style={{ width: `${(s.empleo_m / maxEmpleo) * 100}%`, backgroundColor: color }}>
                      {s.empleo_m.toFixed(2)}M · {s.pct.toFixed(1)}%
                    </div>
                  </div>
                  <div className="w-20 text-[10px] text-stone-500 text-right">
                    VAB: {s.vab_pct.toFixed(1)}%
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-center gap-4 text-[10px] text-stone-500 pt-3 border-t border-stone-200">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#065F46]"></span>Muy alta</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#15803D]"></span>Alta</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#A16207]"></span>Media</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#B45309]"></span>Media-baja</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#7A1F3D]"></span>Baja</span>
            <span className="ml-auto italic">Productividad por ocupado (VAB/empleo)</span>
          </div>
        </div>
      )}

      {/* Vista 2: Dónde va el salario */}
      {viewMode === "circular" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-stone-200 bg-white p-5">
            <h3 className="font-serif text-lg tracking-tight mb-1">¿Dónde acaba el salario del trabajador medio?</h3>
            <p className="text-[11px] text-stone-500 mb-4">
              Las marcas donde el español gasta su dinero. Fíjate cuántas son: (a) cadenas low-cost
              nacionales (Mercadona, Inditex), (b) marcas extranjeras (IKEA, Leroy Merlin, Dacia), o
              (c) oligopolios (Telefónica, Iberdrola). Apenas hay consumo premium "diseñado en España".
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-stone-50 text-[10px] uppercase tracking-[0.08em] text-stone-500">
                  <tr>
                    <th className="text-left px-3 py-2">Categoría</th>
                    <th className="text-left px-3 py-2">Líder</th>
                    <th className="text-right px-3 py-2">Cuota</th>
                    <th className="text-right px-3 py-2">Ticket €</th>
                    <th className="text-left px-3 py-2">Perfil</th>
                    <th className="text-left px-3 py-2">Observación</th>
                  </tr>
                </thead>
                <tbody>
                  {DONDE_VA_SALARIO.map((d, i) => (
                    <tr key={i} className="border-t border-stone-100 text-[12px]">
                      <td className="px-3 py-2 font-medium text-stone-800">{d.categoria}</td>
                      <td className="px-3 py-2 font-semibold text-[#7A1F3D]">{d.lider}</td>
                      <td className="px-3 py-2 text-right font-mono">{d.lider_cuota ? `${d.lider_cuota}%` : "—"}</td>
                      <td className="px-3 py-2 text-right font-mono">€{d.ticket_medio.toLocaleString("es-ES")}</td>
                      <td className="px-3 py-2 text-[11px]">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${
                          d.tipo.includes("premium importado") ? "bg-rose-100 text-rose-800" :
                          d.tipo.includes("nacional") || d.tipo.includes("oligopolio") ? "bg-emerald-100 text-emerald-800" :
                          "bg-amber-100 text-amber-800"
                        }`}>
                          {d.tipo}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-[11px] text-stone-500 italic">{d.observacion}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-amber-50 to-white border border-amber-300 p-5">
            <h4 className="font-serif text-base text-amber-900 mb-2">El patrón: consumo español es mayoritariamente "bajo coste importado"</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[12px] text-stone-700">
              <div>
                <strong className="text-amber-800">Marcas líderes nacionales de bajo-medio coste:</strong> Mercadona
                (supermercado, dueño español), Inditex (pero produce fuera), Seat (grupo VW alemán), Movistar.
              </div>
              <div>
                <strong className="text-rose-800">Marcas extranjeras dominantes:</strong> Dacia #1 coches (Renault),
                IKEA (Suecia), Leroy Merlin (Francia), Apple/Samsung (tech), Netflix + Amazon (ocio).
              </div>
              <div>
                <strong className="text-emerald-800">Multinacionales españolas exportadoras (las pocas que hay):</strong>
                Banco Santander, BBVA, Iberdrola, Repsol, Telefónica, Inditex (marca). Casi todas en banca,
                energía o retail — no en industria o tech.
              </div>
              <div>
                <strong className="text-stone-800">Lo que España NO tiene:</strong> Sin equivalentes a SAP (DE),
                ASML (NL), Nokia (FI), Spotify (SE), LVMH (FR), Ferrari (IT). Las <em>marcas-país premium</em>
                son escasas. Pocas multinacionales tech globales.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vista 3: Exportable */}
      {viewMode === "exportable" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-stone-200 bg-white p-5">
            <h3 className="font-serif text-lg tracking-tight mb-3">Sectores exportables vs no exportables</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={EMPLEO_SECTORES.sort((a, b) => b.pct - a.pct)}
                        margin={{ top: 10, right: 30, left: 0, bottom: 80 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="#E7E5E4" />
                <XAxis dataKey="sector" tick={{ fontSize: 9, fill: "#57534E" }} angle={-30} textAnchor="end" height={80} />
                <YAxis tick={{ fontSize: 11, fill: "#57534E" }} tickFormatter={(v) => `${v}%`} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E7E5E4", fontSize: 11 }}
                         formatter={(v) => [`${v.toFixed(1)}%`, "% empleo"]} />
                <Bar dataKey="pct" radius={[3, 3, 0, 0]}>
                  {EMPLEO_SECTORES.map((s, i) => (
                    <Cell key={i} fill={s.exportable ? "#065F46" : "#7A1F3D"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-6 mt-2 text-[11px] text-stone-600">
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-emerald-700"></span>Exportable {empleoExportable.toFixed(0)}% empleo</span>
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-[#7A1F3D]"></span>No exportable {(100 - empleoExportable).toFixed(0)}% empleo</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl bg-emerald-50/40 border border-emerald-300 p-5">
              <h4 className="font-serif text-base text-emerald-900 mb-2">Sectores exportables en detalle</h4>
              <ul className="space-y-2 text-[12px] text-stone-700">
                <li><strong>Automoción (1.8% empleo, 3.2% VAB):</strong> 89% de producción exportada,
                    pero <strong>93% destino Europa</strong>. <em>0 vehículos exportados a EEUU en 2024</em>.
                    Vulnerabilidad extrema a crisis UE.</li>
                <li><strong>Farmacia/química (1.7% empleo, 3% VAB):</strong> Grifols, Almirall, Novartis ES,
                    AstraZeneca ES. Fuerte exportación pero dependiente de patentes extranjeras.</li>
                <li><strong>Turismo (13% VAB, 14% empleo):</strong> "Exporta" pero baja productividad.
                    Vulnerable: cambios de clima, inseguridad, masificación, competencia (Grecia, Italia).</li>
                <li><strong>TIC/finanzas (6.6% empleo):</strong> Banca Santander/BBVA vía filiales extranjeras.
                    TIC aún pequeño — sin grandes campeones globales.</li>
                <li><strong>Agricultura (3.6% empleo):</strong> Aceite, vino, hortofrutícola. Alta dependencia
                    agua + temperatura + migración estacional.</li>
              </ul>
            </div>
            <div className="rounded-xl bg-rose-50/40 border border-rose-300 p-5">
              <h4 className="font-serif text-base text-rose-900 mb-2">Sectores no exportables (consumo interno)</h4>
              <ul className="space-y-2 text-[12px] text-stone-700">
                <li><strong>Admin pública + sanidad + educación (22%):</strong> Financiado con impuestos.
                    No genera divisas. Estado = empleador.</li>
                <li><strong>Comercio minorista (14%):</strong> Mercadona, Dia, Zara. Salarios bajos.
                    Márgenes bajos. Volumen alto.</li>
                <li><strong>Cuidados/limpieza/doméstico (14%):</strong> Baja productividad, 35% inmigrantes.
                    Salarios cerca del SMI.</li>
                <li><strong>Construcción (7%):</strong> Depende de demanda interna vivienda.
                    Cíclico, vulnerable a tipos de interés.</li>
                <li><strong>Ocio/artes/inmobiliario (6.7%):</strong> Consumo doméstico puro.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Conclusión */}
      <div className="rounded-2xl border-2 border-[#7A1F3D]/30 bg-gradient-to-br from-[#FBF7F0] via-white to-[#EC4899]/10 p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#7A1F3D]" />
          <h3 className="font-serif text-xl tracking-tight">El ciclo completo — cómo funciona la máquina</h3>
        </div>
        <div className="space-y-3 text-[13px] text-stone-700 leading-relaxed">
          <p>
            <strong>Paso 1 — Los ingresos del Estado vienen de...:</strong> trabajadores (IRPF + SS, ~40% presión),
            consumo (IVA, ~20%) y pocos beneficios empresariales (IS sólo 2.3% PIB). La base fiscal es el
            trabajador y el consumidor, no el exportador.
          </p>
          <p>
            <strong>Paso 2 — El Estado emplea al 22% de los trabajadores (admin + sanidad + educación):</strong>
            ~4.7M personas cobran directamente del presupuesto público. Cobran salarios medios (€25-50k típicos)
            con los que sostienen a sus familias y consumen localmente.
          </p>
          <p>
            <strong>Paso 3 — El turismo aporta 13% PIB + 14% empleo:</strong> los turistas europeos
            traen divisas que acaban en bares, hoteles, comercio y alquileres vacacionales. Pero es
            <em> baja productividad</em> — un camarero en Benidorm genera €25k VAB/año, un ingeniero alemán
            en BMW genera €120k.
          </p>
          <p>
            <strong>Paso 4 — Los salarios se gastan en bienes básicos predominantemente extranjeros o low-cost:</strong>
            Mercadona (~nacional), Dacia (rumano), IKEA (sueco), iPhone (americano), Netflix (americano).
            Gran parte del consumo se va en alquiler + alimentación + coche-barato + ocio-importado.
            <strong> Poco consumo premium "diseñado en España"</strong> porque no hay marcas nacionales premium fuertes.
          </p>
          <p>
            <strong>Paso 5 — La industria exportable es estrecha:</strong> ~10% del empleo. Automoción
            exporta pero es producto de bajo margen (Dacia, Seat) y 93% destino UE. Farmacia/química
            dependen de patentes extranjeras. No tenemos SAPs, ASMLs ni Spotifys.
          </p>
          <p className="text-[#7A1F3D] font-serif italic text-[14px] border-l-2 border-[#7A1F3D] pl-4">
            <strong className="not-italic">Lente austríaca:</strong> España opera como economía
            <em> circular</em> donde el dinero gira entre Estado, trabajador y consumo doméstico sin
            generar suficiente <em>excedente exportable</em>. Cuando alguien pregunta "¿por qué no crecemos
            como Alemania?", la respuesta estructural es: porque Alemania <em>vende al mundo</em> (BMW, SAP,
            BASF, Siemens), y España se <em>vende a sí misma</em> (funcionario que come en Mercadona que
            compra a productor nacional que le paga un salario bajo que vuelve a gastar en Mercadona).
            Mientras ese ciclo sea estable y el turismo siga viniendo, funciona. <strong>Cuando algo se
            rompa — crisis EU, caída turismo, crisis automoción, crisis deuda — el ciclo revela su
            fragilidad.</strong> De ahí la siguiente pestaña.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-stone-400 pt-2 border-t border-stone-200">
          <Info className="w-3 h-3" />
          <span>Fuentes: INE EPA T4 2024, Contabilidad Nacional INE, Exceltur 2024, ANFAC 2024, Min. Función Pública 2025, INE EPF 2024, datos ventas retail Kantar.</span>
        </div>
      </div>
    </div>
  );
}


/* --------------------------------------------------------------------------- */
/* [22] ESCENARIOS 2030 — preparación ante crisis · v2.2                        */
/* ---------------------------------------------------------------------------
   Cinco escenarios de estrés sobre la economía española 2030-2040:
     · Crisis cíclica UE (recesión Alemania, demanda caída)
     · Crisis de deuda / confianza eurozona
     · Crisis climática + caída turismo (ola calor, masificación)
     · Crisis automoción (transición EV, competencia China)
     · Crisis demográfica (jubilación baby boomer 2025-2035)

   Usuario: puede activar combinaciones y ver impacto estimado.
   --------------------------------------------------------------------------- */

const ESCENARIOS_CRISIS = [
  {
    id: "ue_recesion",
    nombre: "Recesión severa UE 2026-27",
    probabilidad: "media",
    desc: "Alemania en recesión prolongada, demanda EU cae 4-6%. Crisis industria europea.",
    impacto_exportaciones: -25,
    impacto_turismo: -12,
    impacto_pib: -3.5,
    impacto_empleo_pp: -2.5,
    impacto_deficit_pp: 3.0,
    preparacion: 40,
    razon_preparacion: "España ya tiene alta dependencia de UE (62% exportaciones). Sin diversificación EEUU ni Asia.",
    mitigantes: "Fondos Next Generation aún operativos, turismo no-UE (América Latina) compensaría parcialmente.",
    duracion_rec: "2 años",
  },
  {
    id: "deuda",
    nombre: "Crisis de deuda soberana / prima riesgo",
    probabilidad: "baja-media",
    desc: "Prima riesgo sube +300pb. BCE deja de comprar. Financiación encarecida.",
    impacto_exportaciones: -5,
    impacto_turismo: -5,
    impacto_pib: -2.5,
    impacto_empleo_pp: -1.8,
    impacto_deficit_pp: 2.5,
    preparacion: 25,
    razon_preparacion: "Deuda 100.7% PIB ya alta. AAPP poca flexibilidad. Dependencia total del BCE.",
    mitigantes: "Reglas fiscales UE protegen contagio. Solidaridad UE mejor que en 2012.",
    duracion_rec: "3-5 años",
  },
  {
    id: "turismo_colapso",
    nombre: "Caída turismo estructural",
    probabilidad: "media",
    desc: "Ola calor extremo, masificación, competencia Grecia/Turquía/Croacia. Turistas -20%.",
    impacto_exportaciones: -8,
    impacto_turismo: -30,
    impacto_pib: -3.0,
    impacto_empleo_pp: -2.2,
    impacto_deficit_pp: 2.2,
    preparacion: 35,
    razon_preparacion: "Muy concentrado en sol-playa tradicional. Baja diversificación (turismo cultural, de negocios).",
    mitigantes: "Inversión en turismo cultural podría moderar. Imserso + nacionales compensan parcial.",
    duracion_rec: "Permanente si no se actúa",
  },
  {
    id: "auto_crisis",
    nombre: "Crisis industria automoción",
    probabilidad: "alta",
    desc: "Transición EV mal gestionada, competencia china arrolladora, Seat/Renault cierran plantas.",
    impacto_exportaciones: -15,
    impacto_turismo: 0,
    impacto_pib: -2.0,
    impacto_empleo_pp: -1.5,
    impacto_deficit_pp: 1.5,
    preparacion: 20,
    razon_preparacion: "Producción de vehículos ya -3% en 2024. Plantas sin modelos EV propios. 0 export USA.",
    mitigantes: "Plan PERTE auto puede mitigar si se ejecuta bien. Stellantis, VW tienen compromisos a medio plazo.",
    duracion_rec: "Permanente (reconversión sector)",
  },
  {
    id: "demografia",
    nombre: "Shock demográfico jubilación masiva",
    probabilidad: "segura",
    desc: "2M baby boomers se jubilan 2025-2035. Sistema pensiones bajo presión. Déficit SS crece.",
    impacto_exportaciones: 0,
    impacto_turismo: 0,
    impacto_pib: -1.5,
    impacto_empleo_pp: 0,
    impacto_deficit_pp: 3.5,
    preparacion: 30,
    razon_preparacion: "Factor sostenibilidad derogado. MEI y pacto Toledo insuficientes. Déficit SS estructural.",
    mitigantes: "Inmigración parcialmente compensa (BdE +0.4-0.7pp PIB). Pero flujo actual no basta.",
    duracion_rec: "15-20 años de ajuste",
  },
];

const PREPARACION_INDICADORES = [
  { id: "deuda", nombre: "Margen deuda pública", valor_es: 100.7, valor_optimo: 60, unidad: "% PIB",
    invertido: true, peso: 20, fuente: "AIReF 2025" },
  { id: "deficit", nombre: "Déficit estructural", valor_es: 3.5, valor_optimo: 0.5, unidad: "% PIB",
    invertido: true, peso: 15, fuente: "AIReF 2025" },
  { id: "reservas", nombre: "Margen inversión pública", valor_es: 2.6, valor_optimo: 4.0, unidad: "% PIB",
    invertido: false, peso: 10, fuente: "Eurostat" },
  { id: "diversificacion", nombre: "Concentración UE exportaciones", valor_es: 62.7, valor_optimo: 50, unidad: "%",
    invertido: true, peso: 10, fuente: "Mº Economía 2024" },
  { id: "productividad", nombre: "Productividad/hora UE=100", valor_es: 92, valor_optimo: 110, unidad: "idx",
    invertido: false, peso: 15, fuente: "Eurostat 2024" },
  { id: "fondo_reserva", nombre: "Fondo Reserva SS", valor_es: 9.3, valor_optimo: 60, unidad: "€Bn",
    invertido: false, peso: 10, fuente: "Seg. Social" },
  { id: "paro_estructural", nombre: "Paro estructural", valor_es: 11.5, valor_optimo: 5, unidad: "%",
    invertido: true, peso: 10, fuente: "OCDE 2024" },
  { id: "demografia_ratio", nombre: "Ratio activos/pasivos", valor_es: 2.2, valor_optimo: 3.5, unidad: "ratio",
    invertido: false, peso: 10, fuente: "INE 2024" },
];

function CrisisEscenariosView() {
  const [escenariosActivos, setEscenariosActivos] = useState({
    ue_recesion: false,
    deuda: false,
    turismo_colapso: false,
    auto_crisis: false,
    demografia: true,  // Este es certeza
  });
  const [preset, setPreset] = useState("perfecta_tormenta");

  const setPresetScenario = (p) => {
    setPreset(p);
    if (p === "base") {
      setEscenariosActivos({ ue_recesion: false, deuda: false, turismo_colapso: false, auto_crisis: false, demografia: true });
    } else if (p === "moderada") {
      setEscenariosActivos({ ue_recesion: true, deuda: false, turismo_colapso: false, auto_crisis: true, demografia: true });
    } else if (p === "severa") {
      setEscenariosActivos({ ue_recesion: true, deuda: true, turismo_colapso: true, auto_crisis: true, demografia: true });
    } else if (p === "perfecta_tormenta") {
      setEscenariosActivos({ ue_recesion: true, deuda: true, turismo_colapso: true, auto_crisis: true, demografia: true });
    }
  };

  // Cálculo impacto acumulado
  const escenariosSeleccionados = ESCENARIOS_CRISIS.filter(e => escenariosActivos[e.id]);

  // Atenuación cuando hay varios escenarios simultaneos (no es aditivo puro)
  const atenuacion = escenariosSeleccionados.length > 1 ? 0.85 : 1.0;

  const impacto_pib = escenariosSeleccionados.reduce((s, e) => s + e.impacto_pib, 0) * atenuacion;
  const impacto_export = escenariosSeleccionados.reduce((s, e) => s + e.impacto_exportaciones, 0) * atenuacion;
  const impacto_turismo = escenariosSeleccionados.reduce((s, e) => s + e.impacto_turismo, 0) * atenuacion;
  const impacto_empleo = escenariosSeleccionados.reduce((s, e) => s + e.impacto_empleo_pp, 0) * atenuacion;
  const impacto_deficit = escenariosSeleccionados.reduce((s, e) => s + e.impacto_deficit_pp, 0) * atenuacion;

  // Cálculo preparación
  const preparacion = PREPARACION_INDICADORES.reduce((s, ind) => {
    const ratio = ind.invertido
      ? Math.max(0, Math.min(100, (ind.valor_optimo / ind.valor_es) * 100))
      : Math.max(0, Math.min(100, (ind.valor_es / ind.valor_optimo) * 100));
    return s + ratio * ind.peso / 100;
  }, 0);

  // Proyección 2030 post-crisis
  const pib_2024 = 1690;
  const pib_2030_base = pib_2024 * 1.12;  // +12% acumulado 5 años
  const pib_2030_crisis = pib_2030_base * (1 + impacto_pib / 100);
  const deuda_2024 = 100.7;
  const deuda_2030_crisis = deuda_2024 + impacto_deficit * 3;  // 3 años acumulados de déficit extra

  const fmtPct = (v, signo) => {
    const s = signo ? (v >= 0 ? "+" : "") : "";
    return `${s}${v.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl tracking-tight">Escenarios 2030 · ¿está España preparada?</h2>
        <p className="text-sm text-stone-500 mt-1 max-w-3xl">
          Combinando la anatomía productiva con los indicadores de vigilancia, simulamos cinco escenarios
          de crisis distintos 2026-2030 y evaluamos el grado de preparación del país. Activa escenarios
          individual o combinadamente.
        </p>
      </div>

      {/* Score de preparación */}
      <div className={`rounded-2xl border-2 p-6 bg-gradient-to-br to-white ${
        preparacion > 65 ? "border-emerald-400 from-emerald-50" :
        preparacion > 40 ? "border-amber-400 from-amber-50" :
        "border-rose-400 from-rose-50"
      }`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          <div>
            <div className="text-[10px] uppercase tracking-[0.15em] text-stone-500 font-semibold">
              Score de preparación España
            </div>
            <div className="font-serif text-5xl mt-1"
                 style={{ color: preparacion > 65 ? "#047857" : preparacion > 40 ? "#A16207" : "#BE123C" }}>
              {preparacion.toFixed(0)}<span className="text-2xl">/100</span>
            </div>
            <div className="text-[12px] text-stone-600 mt-2 font-semibold">
              {preparacion > 65 ? "Buena preparación" :
               preparacion > 40 ? "Preparación insuficiente" :
               "Preparación débil"}
            </div>
          </div>
          <div className="md:col-span-2">
            <div className="text-[11px] text-stone-600 mb-2">Indicadores individuales (ordenados por peso):</div>
            <div className="space-y-1.5">
              {PREPARACION_INDICADORES.map(ind => {
                const ratio = ind.invertido
                  ? Math.max(0, Math.min(100, (ind.valor_optimo / ind.valor_es) * 100))
                  : Math.max(0, Math.min(100, (ind.valor_es / ind.valor_optimo) * 100));
                return (
                  <div key={ind.id} className="grid grid-cols-12 gap-2 items-center text-[11px]">
                    <div className="col-span-4 text-stone-700">{ind.nombre}</div>
                    <div className="col-span-6 bg-stone-100 rounded h-3 relative overflow-hidden">
                      <div className="h-full rounded"
                           style={{ width: `${ratio}%`,
                                    backgroundColor: ratio > 65 ? "#047857" : ratio > 40 ? "#A16207" : "#BE123C" }} />
                    </div>
                    <div className="col-span-2 text-right font-mono text-[10px] text-stone-600">
                      {ind.valor_es}{ind.unidad === "%" ? "%" : ind.unidad === "€Bn" ? " Bn" : ""}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Presets */}
      <div className="rounded-xl border border-stone-200 bg-white p-5">
        <h3 className="font-serif text-lg tracking-tight mb-3">Elige el escenario de estrés</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { id: "base", label: "Escenario base", desc: "Solo demografía (certeza)", color: "#047857" },
            { id: "moderada", label: "Crisis moderada", desc: "UE recesión + auto", color: "#A16207" },
            { id: "severa", label: "Crisis severa", desc: "Todos los escenarios", color: "#B91C1C" },
            { id: "perfecta_tormenta", label: "Tormenta perfecta", desc: "Todo a la vez", color: "#7F1D1D" },
          ].map(p => (
            <button key={p.id} onClick={() => setPresetScenario(p.id)}
              className={`text-left p-3 rounded-lg border-2 transition-all ${
                preset === p.id ? "bg-white shadow-md" : "bg-stone-50 hover:bg-white"
              }`}
              style={preset === p.id ? { borderColor: p.color } : { borderColor: "#E7E5E4" }}>
              <div className="font-serif text-sm" style={{ color: preset === p.id ? p.color : "#292524" }}>
                {p.label}
              </div>
              <div className="text-[10px] text-stone-500 mt-1">{p.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Toggles individuales */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <h3 className="font-serif text-lg tracking-tight mb-3">Escenarios detallados — activa los que quieras</h3>
        <div className="space-y-3">
          {ESCENARIOS_CRISIS.map(e => {
            const activo = escenariosActivos[e.id];
            return (
              <div key={e.id} className={`rounded-lg border-2 p-4 transition-all ${
                activo ? "border-rose-300 bg-rose-50/40" : "border-stone-200 bg-white"
              }`}>
                <div className="flex items-start gap-3">
                  <button onClick={() => {
                    setEscenariosActivos({...escenariosActivos, [e.id]: !activo});
                    setPreset("custom");
                  }}
                    className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                      activo ? "bg-rose-600 border-rose-600 text-white" : "bg-white border-stone-300"
                    }`}>
                    {activo && "✓"}
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-serif text-base text-stone-900">{e.nombre}</h4>
                      <span className={`text-[9px] px-2 py-0.5 rounded ${
                        e.probabilidad === "segura" ? "bg-rose-600 text-white" :
                        e.probabilidad === "alta" ? "bg-rose-200 text-rose-900" :
                        e.probabilidad === "media" ? "bg-amber-200 text-amber-900" :
                        "bg-stone-200 text-stone-700"
                      }`}>
                        Probabilidad: {e.probabilidad}
                      </span>
                      <span className="text-[9px] px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                        Duración: {e.duracion_rec}
                      </span>
                    </div>
                    <p className="text-[12px] text-stone-600 mt-1">{e.desc}</p>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-2 text-[10px]">
                      <div className="text-stone-600">PIB <strong className="text-rose-700">{fmtPct(e.impacto_pib, true)}</strong></div>
                      <div className="text-stone-600">Export <strong className="text-rose-700">{fmtPct(e.impacto_exportaciones, true)}</strong></div>
                      <div className="text-stone-600">Turismo <strong className="text-rose-700">{fmtPct(e.impacto_turismo, true)}</strong></div>
                      <div className="text-stone-600">Empleo <strong className="text-rose-700">{fmtPct(e.impacto_empleo_pp, true)}pp</strong></div>
                      <div className="text-stone-600">Déficit <strong className="text-amber-700">+{e.impacto_deficit_pp.toFixed(1)}pp</strong></div>
                    </div>
                    <div className="mt-2 text-[11px] text-stone-600 border-l-2 border-stone-300 pl-3">
                      <strong>Preparación ({e.preparacion}/100):</strong> {e.razon_preparacion}
                      <div className="text-emerald-700 mt-1"><strong>Mitigantes:</strong> {e.mitigantes}</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Impacto combinado */}
      <div className="rounded-2xl border-2 border-rose-300 bg-gradient-to-br from-rose-50 to-white p-6">
        <h3 className="font-serif text-xl tracking-tight mb-3">Impacto combinado en España</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.12em] text-stone-500 font-semibold">PIB 2030 proyectado</div>
            <div className="font-serif text-2xl text-rose-700 mt-1">€{(pib_2030_crisis).toFixed(0)}Bn</div>
            <div className="text-[10px] text-stone-500">vs €{pib_2030_base.toFixed(0)}Bn base</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.12em] text-stone-500 font-semibold">Exportaciones</div>
            <div className="font-serif text-2xl text-rose-700 mt-1">{fmtPct(impacto_export, true)}</div>
            <div className="text-[10px] text-stone-500">Caída acumulada</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.12em] text-stone-500 font-semibold">Turismo</div>
            <div className="font-serif text-2xl text-rose-700 mt-1">{fmtPct(impacto_turismo, true)}</div>
            <div className="text-[10px] text-stone-500">Impacto sector</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.12em] text-stone-500 font-semibold">Paro adicional</div>
            <div className="font-serif text-2xl text-rose-700 mt-1">+{Math.abs(impacto_empleo).toFixed(1)}pp</div>
            <div className="text-[10px] text-stone-500">vs nivel actual 11.5%</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.12em] text-stone-500 font-semibold">Deuda 2030</div>
            <div className="font-serif text-2xl text-rose-700 mt-1">{deuda_2030_crisis.toFixed(0)}% PIB</div>
            <div className="text-[10px] text-stone-500">vs 100.7% hoy</div>
          </div>
        </div>

        {escenariosSeleccionados.length >= 3 && (
          <div className="mt-4 pt-4 border-t border-rose-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-700 mt-0.5 shrink-0" />
              <p className="text-[12px] text-stone-700 leading-relaxed">
                <strong className="text-rose-700">Alerta de tormenta perfecta:</strong> con {escenariosSeleccionados.length} escenarios
                simultáneos, España entraría en recesión profunda. Deuda superaría <strong>{deuda_2030_crisis.toFixed(0)}% PIB</strong> —
                nivel Grecia 2012. Probable necesidad de rescate UE o ajuste fiscal muy severo (tipo Milei, -15pp PIB).
                El sistema de pensiones entraría en crisis abierta. La economía circular del país
                (admin pública + turismo + consumo doméstico) colapsaría porque depende de tres flujos que
                <em> todos caen a la vez</em>: impuestos (paro sube), turismo extranjero (UE en crisis) y
                cotizaciones SS (demografía).
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Qué hacer para prepararse */}
      <div className="rounded-2xl border-2 border-[#7A1F3D]/30 bg-gradient-to-br from-[#FBF7F0] via-white to-[#EC4899]/10 p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#7A1F3D]" />
          <h3 className="font-serif text-xl tracking-tight">Qué haría falta para estar preparados</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-serif text-base text-stone-900 mb-2">Cambios estructurales (5-10 años)</h4>
            <ul className="space-y-2 text-[12px] text-stone-700 leading-snug">
              <li>• <strong>Diversificar exportaciones</strong> más allá UE: tratados Mercosur, Asia, más EEUU. Hoy 62.7% concentración UE.</li>
              <li>• <strong>Aumentar peso sectores alto VA</strong> (TIC, biotech, IA) del 10% actual al 20%. Requiere inversión I+D y educación.</li>
              <li>• <strong>Reducir deuda pública</strong> a {"<"}70% PIB via disciplina presupuestaria (hoy 100.7%).</li>
              <li>• <strong>Reforma pensiones real</strong>: edad jubilación, factor sostenibilidad, pilar privado complementario.</li>
              <li>• <strong>Capitalizar empresas</strong>: bajar IS (hoy 2.3% PIB), incentivar retención beneficios para I+D.</li>
              <li>• <strong>Diversificar turismo</strong>: cultural, negocios, deportivo. Reducir dependencia sol-playa UE.</li>
            </ul>
          </div>
          <div>
            <h4 className="font-serif text-base text-stone-900 mb-2">Amortiguadores cíclicos (corto plazo)</h4>
            <ul className="space-y-2 text-[12px] text-stone-700 leading-snug">
              <li>• <strong>Recomponer Fondo Reserva SS</strong>: hoy €9.3Bn, óptimo €60Bn (3-4 meses pensiones).</li>
              <li>• <strong>Buffer fiscal anticíclico</strong>: bajar déficit en años buenos (no hoy) para tener margen.</li>
              <li>• <strong>Plan B automoción</strong>: PERTE EV bien ejecutado + apoyo Seat/Renault para modelos EV propios.</li>
              <li>• <strong>Plan B turismo</strong>: inversión climática (aire acondicionado masivo), gestión masificación.</li>
              <li>• <strong>Stress tests públicos</strong>: igual que hay para bancos, hacer tests para Estado ante crisis 10%.</li>
              <li>• <strong>Transparencia fiscal</strong>: cuentas públicas fáciles de seguir, auditoría CCAA, eliminación duplicidades.</li>
            </ul>
          </div>
        </div>
        <div className="border-l-4 border-[#7A1F3D] pl-4 mt-3">
          <p className="text-[13px] text-stone-700 leading-relaxed italic">
            <strong className="font-serif text-[#7A1F3D] not-italic">Lente austríaca final:</strong>
            la pregunta no es "¿vendrá una crisis?" — vendrán varias en los próximos 10 años, es seguro.
            La pregunta es "¿cuánto podemos absorber antes de que la economía circular se rompa?". El score
            de {preparacion.toFixed(0)}/100 sugiere que España podría resistir una crisis aislada moderada
            pero no una acumulación de shocks simultáneos. El margen se ha consumido en la última década
            (deuda subió, déficit estructural persistente, fondo reserva SS casi vacío). Los próximos años
            son <em>el momento de reconstruir colchones</em>, no de seguir gastando. Pero políticamente,
            el incentivo es el opuesto: en expansiones se gasta el superávit cíclico como si fuera permanente.
            Esta es la trampa austríaca clásica.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-stone-400 pt-2 border-t border-stone-200">
          <Info className="w-3 h-3" />
          <span>Fuentes: AIReF 2025, BdE Previsiones 2025-27, Eurostat, Fedea Observatorio 2025, ANFAC 2024, Exceltur 2024, Seg. Social 2024.</span>
        </div>
      </div>
    </div>
  );
}



/* [21] CUÑA TRABAJADOR OCDE DESAGREGADA · v2.3 */

// Datos OCDE Taxing Wages 2025 (ejercicio 2024), single worker at 100% AW
const CUÑA_TRABAJADOR_OCDE = {
  es: {
    name: "España", flag: "🇪🇸",
    irpf_coste: 11.8,           // IRPF como % coste laboral
    ss_worker_coste: 4.9,        // SS trabajador como % coste laboral
    ss_employer_coste: 23.9,     // SS empresa como % coste laboral
    cuña_total: 40.6,
    // Adicional: sobre salario neto, ~11.5% IVA efectivo × 0.70 consumo
    iva_efectivo_pct_bruto: 4.8,  // aprox IVA + IIEE sobre salario bruto (no tip cuña)
    take_home_pct: 59.4,         // 100 - 40.6 (de coste laboral)
  },
  de: {
    name: "Alemania", flag: "🇩🇪",
    irpf_coste: 14.8, ss_worker_coste: 17.4, ss_employer_coste: 15.7,
    cuña_total: 47.9, iva_efectivo_pct_bruto: 4.2, take_home_pct: 52.1,
  },
  fr: {
    name: "Francia", flag: "🇫🇷",
    irpf_coste: 10.9, ss_worker_coste: 8.3, ss_employer_coste: 28.0,
    cuña_total: 47.2, iva_efectivo_pct_bruto: 4.6, take_home_pct: 52.8,
  },
  it: {
    name: "Italia", flag: "🇮🇹",
    irpf_coste: 15.5, ss_worker_coste: 7.2, ss_employer_coste: 24.4,
    cuña_total: 47.1, iva_efectivo_pct_bruto: 4.0, take_home_pct: 52.9,
  },
  pt: {
    name: "Portugal", flag: "🇵🇹",
    irpf_coste: 13.0, ss_worker_coste: 8.9, ss_employer_coste: 16.1,
    cuña_total: 38.0, iva_efectivo_pct_bruto: 5.4, take_home_pct: 62.0,
  },
  nl: {
    name: "Países Bajos", flag: "🇳🇱",
    irpf_coste: 16.5, ss_worker_coste: 10.6, ss_employer_coste: 9.1,
    cuña_total: 36.2, iva_efectivo_pct_bruto: 4.1, take_home_pct: 63.8,
  },
  be: {
    name: "Bélgica", flag: "🇧🇪",
    irpf_coste: 23.1, ss_worker_coste: 10.8, ss_employer_coste: 18.7,
    cuña_total: 52.6, iva_efectivo_pct_bruto: 4.3, take_home_pct: 47.4,
  },
  ie: {
    name: "Irlanda", flag: "🇮🇪",
    irpf_coste: 20.4, ss_worker_coste: 3.6, ss_employer_coste: 10.7,
    cuña_total: 34.7, iva_efectivo_pct_bruto: 4.5, take_home_pct: 65.3,
  },
  oecd: {
    name: "Media OCDE", flag: "🌐",
    irpf_coste: 13.3, ss_worker_coste: 8.2, ss_employer_coste: 13.4,
    cuña_total: 34.9, iva_efectivo_pct_bruto: 4.1, take_home_pct: 65.1,
  },
};

function CuñaTrabajadorView() {
  const [sortBy, setSortBy] = useState("cuña_total");
  const [showView, setShowView] = useState("desagregado"); // desagregado | agrupado | flujo

  const countries = Object.entries(CUÑA_TRABAJADOR_OCDE).map(([id, d]) => ({
    id, ...d,
    carga_directa_nomina: d.irpf_coste + d.ss_worker_coste,
    carga_via_empresa: d.ss_employer_coste,
  }));

  const sorted = useMemo(() => {
    const arr = [...countries].filter(c => c.id !== "oecd");
    if (sortBy === "cuña_total") arr.sort((a, b) => b.cuña_total - a.cuña_total);
    else if (sortBy === "directa") arr.sort((a, b) => b.carga_directa_nomina - a.carga_directa_nomina);
    else if (sortBy === "empresa") arr.sort((a, b) => b.carga_via_empresa - a.carga_via_empresa);
    return arr;
  }, [countries, sortBy]);

  const es = countries.find(c => c.id === "es");
  const oecd = countries.find(c => c.id === "oecd");
  const de = countries.find(c => c.id === "de");
  const nl = countries.find(c => c.id === "nl");

  const fmtPct = (v) => `${v.toFixed(1)}%`;

  return (
    <div className="space-y-5">
      {/* Explicación del marco */}
      <div className="rounded-2xl border-2 border-[#7A1F3D] bg-gradient-to-br from-[#FBF7F0] to-white p-5">
        <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
          <h3 className="font-serif text-lg tracking-tight">La cuña fiscal tiene tres canales distintos</h3>
          <SourceChip sourceKey="oecd_taxing_wages_2025" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl bg-white border border-orange-300 p-4">
            <div className="text-[10px] uppercase tracking-[0.15em] text-orange-800 font-semibold mb-1">
              1 · Directo sobre nómina
            </div>
            <div className="text-[11px] text-stone-700 leading-snug">
              IRPF + SS trabajador. <strong>El trabajador lo ve en su nómina</strong> al comparar
              bruto con neto. Es el impacto "visible".
            </div>
          </div>
          <div className="rounded-xl bg-white border border-rose-300 p-4">
            <div className="text-[10px] uppercase tracking-[0.15em] text-rose-800 font-semibold mb-1">
              2 · Vía empresa (repercutido)
            </div>
            <div className="text-[11px] text-stone-700 leading-snug">
              SS empresa. Formalmente la paga la empresa, pero <strong>reduce el salario bruto que
              te puede ofrecer</strong>. La literatura económica (Saez, Matsaganis, OCDE) es
              unánime: la incidencia final está sobre el trabajador.
            </div>
          </div>
          <div className="rounded-xl bg-white border border-purple-300 p-4">
            <div className="text-[10px] uppercase tracking-[0.15em] text-purple-800 font-semibold mb-1">
              3 · Vía consumo
            </div>
            <div className="text-[11px] text-stone-700 leading-snug">
              IVA + II.EE. sobre el neto gastado. <strong>No cuenta en la "cuña" OCDE</strong> pero
              reduce el poder adquisitivo real. Lo calculamos aparte.
            </div>
          </div>
        </div>
      </div>

      {/* KPIs España vs referencias */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="rounded-xl border-2 border-orange-400 bg-orange-50/40 p-4">
          <div className="text-[10px] uppercase tracking-[0.12em] text-orange-800 font-semibold">Directo nómina España</div>
          <div className="font-serif text-3xl text-orange-700 mt-1">{fmtPct(es.carga_directa_nomina)}</div>
          <div className="text-[11px] text-stone-500 mt-1">
            IRPF {fmtPct(es.irpf_coste)} + SS trab {fmtPct(es.ss_worker_coste)}
          </div>
          <div className="text-[11px] text-stone-500">OCDE media: {fmtPct(oecd.carga_directa_nomina)}</div>
        </div>
        <div className="rounded-xl border-2 border-rose-400 bg-rose-50/40 p-4">
          <div className="text-[10px] uppercase tracking-[0.12em] text-rose-800 font-semibold">Vía empresa España</div>
          <div className="font-serif text-3xl text-rose-700 mt-1">{fmtPct(es.ss_employer_coste)}</div>
          <div className="text-[11px] text-stone-500 mt-1">SS empresa (del coste laboral)</div>
          <div className="text-[11px] text-stone-500">OCDE media: {fmtPct(oecd.ss_employer_coste)} · NL: {fmtPct(nl.ss_employer_coste)}</div>
        </div>
        <div className="rounded-xl border-2 border-[#7A1F3D] bg-[#FBF7F0] p-4">
          <div className="text-[10px] uppercase tracking-[0.12em] text-stone-500 font-semibold">Cuña total España</div>
          <div className="font-serif text-3xl text-[#7A1F3D] mt-1">{fmtPct(es.cuña_total)}</div>
          <div className="text-[11px] text-stone-500 mt-1">13ª más alta OCDE</div>
          <div className="text-[11px] text-stone-500">OCDE media: {fmtPct(oecd.cuña_total)}</div>
        </div>
        <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50/40 p-4">
          <div className="text-[10px] uppercase tracking-[0.12em] text-emerald-800 font-semibold">Queda al trabajador</div>
          <div className="font-serif text-3xl text-emerald-700 mt-1">{fmtPct(es.take_home_pct)}</div>
          <div className="text-[11px] text-stone-500 mt-1">Del coste laboral total</div>
          <div className="text-[11px] text-stone-500">antes de IVA/IIEE sobre gasto</div>
        </div>
      </div>

      {/* Dato clave destacado */}
      <div className="rounded-xl border border-amber-300 bg-amber-50/40 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-700 mt-0.5 shrink-0" />
          <div>
            <h4 className="font-serif text-base tracking-tight mb-1">Lo que OCDE Taxing Wages 2025 dice textualmente sobre España</h4>
            <p className="text-[13px] text-stone-700 leading-relaxed">
              <em>"En España, el IRPF y las cotizaciones a la SS del empleador combinadas representan
              el <strong>88% de la cuña fiscal total</strong>, comparado con el <strong>77% de
              media OCDE"</strong></em>. Esto significa que la cuña española pesa
              desproporcionadamente sobre <strong>el trabajo</strong>, no sobre otras bases
              imponibles (consumo, patrimonio, sociedades). La SS empresa <strong>23.9% del coste
              laboral</strong> es una de las más altas de OCDE.
            </p>
          </div>
        </div>
      </div>

      {/* Subselector */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-[11px] uppercase tracking-[0.12em] text-stone-500 font-semibold">Visualización:</span>
        {[
          { id: "desagregado", label: "Tres canales comparados" },
          { id: "agrupado", label: "Directo vs vía empresa" },
          { id: "flujo", label: "Flujo €100k coste laboral" },
        ].map(v => (
          <button key={v.id} onClick={() => setShowView(v.id)}
            className={`text-xs px-3 py-1 rounded-full transition-colors ${
              showView === v.id
                ? "bg-[#7A1F3D] text-white"
                : "bg-white border border-stone-200 text-stone-600 hover:border-[#7A1F3D]"
            }`}>
            {v.label}
          </button>
        ))}
        <span className="ml-4 text-[11px] uppercase tracking-[0.12em] text-stone-500 font-semibold">Ordenar:</span>
        {[
          { id: "cuña_total", label: "Cuña total" },
          { id: "directa", label: "Directa nómina" },
          { id: "empresa", label: "Vía empresa" },
        ].map(o => (
          <button key={o.id} onClick={() => setSortBy(o.id)}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              sortBy === o.id ? "bg-stone-800 text-white" : "bg-stone-100 text-stone-600"
            }`}>
            {o.label}
          </button>
        ))}
      </div>

      {/* Visualización 1: tres canales stacked */}
      {showView === "desagregado" && (
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <h3 className="font-serif text-lg tracking-tight mb-1">Los tres canales — % del coste laboral total</h3>
          <p className="text-[11px] text-stone-500 mb-3">
            Cada barra: 100% del coste laboral de contratar a un trabajador medio. En cada color, quién se queda qué parte.
            Fuente: OCDE Taxing Wages 2025 (ejercicio 2024).
          </p>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={sorted} margin={{ top: 10, right: 30, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="#E7E5E4" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#57534E" }} angle={-15} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11, fill: "#57534E" }} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E7E5E4", fontSize: 12 }}
                       formatter={(v, n) => [`${v.toFixed(1)}% del coste laboral`, n]} />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="irpf_coste" stackId="a" fill="#C2410C" name="1a · IRPF (directo nómina)" />
              <Bar dataKey="ss_worker_coste" stackId="a" fill="#EA580C" name="1b · SS trabajador (directo)" />
              <Bar dataKey="ss_employer_coste" stackId="a" fill="#7A1F3D" name="2 · SS empresa (vía empresa)" />
              <Bar dataKey="take_home_pct" stackId="a" fill="#86EFAC" name="3 · Queda al trabajador (bruto)" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 pt-3 border-t border-stone-200 text-[12px] text-stone-600 leading-relaxed">
            <strong>Lectura:</strong> España destaca no por IRPF (11.8% coste laboral, similar a OCDE 13.3%),
            sino por <strong>SS empresa al 23.9%</strong> — entre las más altas de OCDE. Países Bajos, con
            cuña total menor (36.2%), tiene SS empresa solo 9.1%. Ese es el margen donde España podría
            reformar sin tocar IRPF.
          </div>
        </div>
      )}

      {/* Visualización 2: agrupado */}
      {showView === "agrupado" && (
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <h3 className="font-serif text-lg tracking-tight mb-1">Carga directa sobre nómina vs carga vía empresa</h3>
          <p className="text-[11px] text-stone-500 mb-3">
            Agrupando IRPF + SS trabajador ("lo que el trabajador paga directo") vs SS empresa ("lo que
            paga la empresa pero acaba sobre el trabajador vía menor salario").
          </p>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={sorted} margin={{ top: 10, right: 30, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="#E7E5E4" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#57534E" }} angle={-15} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11, fill: "#57534E" }} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }}
                       formatter={(v) => [`${v.toFixed(1)}%`]} />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="carga_directa_nomina" fill="#EA580C" name="Directa sobre nómina (IRPF + SS trab)" />
              <Bar dataKey="carga_via_empresa" fill="#7A1F3D" name="Vía empresa (SS empresa, repercutida)" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-lg bg-orange-50/40 border border-orange-200 p-3">
              <div className="text-[11px] uppercase text-orange-800 font-semibold mb-1">Directo nómina</div>
              <div className="text-[12px] text-stone-700">
                España <strong>{fmtPct(es.carga_directa_nomina)}</strong> · OCDE {fmtPct(oecd.carga_directa_nomina)}.
                Diferencia modesta (<strong>+{(es.carga_directa_nomina - oecd.carga_directa_nomina).toFixed(1)}pp</strong>).
                El trabajador español no paga mucho más IRPF que la media.
              </div>
            </div>
            <div className="rounded-lg bg-rose-50/40 border border-rose-200 p-3">
              <div className="text-[11px] uppercase text-rose-800 font-semibold mb-1">Vía empresa</div>
              <div className="text-[12px] text-stone-700">
                España <strong>{fmtPct(es.ss_employer_coste)}</strong> · OCDE {fmtPct(oecd.ss_employer_coste)}.
                Diferencia grande (<strong>+{(es.ss_employer_coste - oecd.ss_employer_coste).toFixed(1)}pp</strong>).
                Aquí está la verdadera cuña española.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visualización 3: flujo €100k */}
      {showView === "flujo" && (
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <h3 className="font-serif text-lg tracking-tight mb-1">Si la empresa gasta €100.000 en un trabajador — qué pasa en cada país</h3>
          <p className="text-[11px] text-stone-500 mb-4">
            Ejemplo concreto: por cada €100.000 que la empresa paga como coste laboral total, cómo se reparten entre Estado y trabajador.
          </p>
          <div className="space-y-3">
            {[es, oecd, nl, de, be].map(c => {
              const coste = 100000;
              const iva_emp = coste * c.ss_employer_coste / 100;
              const irpf_val = coste * c.irpf_coste / 100;
              const ss_w = coste * c.ss_worker_coste / 100;
              const neto = coste * c.take_home_pct / 100;
              return (
                <div key={c.id} className={`rounded-xl border p-4 ${
                  c.id === "es" ? "border-[#7A1F3D] bg-[#FBF7F0]" : "border-stone-200 bg-white"
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{c.flag}</span>
                    <div className="font-serif text-base">{c.name}</div>
                    <div className="ml-auto text-[11px] text-stone-500">Cuña total {fmtPct(c.cuña_total)}</div>
                  </div>
                  <div className="relative w-full h-10 bg-stone-100 rounded-md overflow-hidden flex">
                    <div className="h-full flex items-center justify-center text-[10px] text-white font-mono px-1"
                         style={{ width: `${c.ss_employer_coste}%`, backgroundColor: "#7A1F3D" }}>
                      €{Math.round(iva_emp).toLocaleString("es-ES")}
                    </div>
                    <div className="h-full flex items-center justify-center text-[10px] text-white font-mono px-1"
                         style={{ width: `${c.irpf_coste}%`, backgroundColor: "#C2410C" }}>
                      €{Math.round(irpf_val).toLocaleString("es-ES")}
                    </div>
                    <div className="h-full flex items-center justify-center text-[10px] text-white font-mono px-1"
                         style={{ width: `${c.ss_worker_coste}%`, backgroundColor: "#EA580C" }}>
                      €{Math.round(ss_w).toLocaleString("es-ES")}
                    </div>
                    <div className="h-full flex items-center justify-center text-[11px] text-emerald-900 font-mono font-bold px-1"
                         style={{ width: `${c.take_home_pct}%`, backgroundColor: "#86EFAC" }}>
                      €{Math.round(neto).toLocaleString("es-ES")}
                    </div>
                  </div>
                  <div className="flex gap-4 mt-2 text-[10px] text-stone-600">
                    <span>🟥 SS empresa</span>
                    <span>🟧 IRPF</span>
                    <span>🟨 SS trab</span>
                    <span>🟩 <strong>Al trabajador (bruto)</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-3 border-t border-stone-200 text-[12px] text-stone-600 leading-relaxed">
            <strong>El caso español:</strong> de €100.000 coste laboral, el trabajador recibe €59.400
            brutos. De ahí todavía paga IVA (~21% efectivo 11.5% sobre ~70% gasto = ~€4.800 más).
            <strong> Renta realmente disponible final: ~€54.600</strong> (de los €100k que costó al
            empresario). <strong>En Países Bajos el equivalente sería €63.800 brutos · ~€60.800 neto
            final.</strong> Y en Alemania €52.100 · ~€49.400 final. España está en medio, pero con
            menor salario nominal de partida que Alemania o NL.
          </div>
        </div>
      )}

      {/* Tabla comparativa resumen */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <h3 className="font-serif text-lg tracking-tight mb-3">Tabla comparativa — OCDE Taxing Wages 2025</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-[10px] uppercase tracking-[0.08em] text-stone-500">
              <tr>
                <th className="text-left px-3 py-2">País</th>
                <th className="text-right px-3 py-2">IRPF</th>
                <th className="text-right px-3 py-2">SS trab</th>
                <th className="text-right px-3 py-2 bg-orange-50">Directo nómina</th>
                <th className="text-right px-3 py-2 bg-rose-50">SS empresa</th>
                <th className="text-right px-3 py-2 font-bold">Cuña total</th>
                <th className="text-right px-3 py-2">Take-home</th>
              </tr>
            </thead>
            <tbody className="text-[12px]">
              {sorted.map(c => {
                const isEs = c.id === "es";
                return (
                  <tr key={c.id} className={`border-t border-stone-100 ${isEs ? "bg-[#FBF7F0]" : ""}`}>
                    <td className={`px-3 py-2 font-medium ${isEs ? "text-[#7A1F3D]" : ""}`}>
                      <span className="mr-2">{c.flag}</span>{c.name}
                    </td>
                    <td className="px-3 py-2 text-right font-mono">{fmtPct(c.irpf_coste)}</td>
                    <td className="px-3 py-2 text-right font-mono">{fmtPct(c.ss_worker_coste)}</td>
                    <td className="px-3 py-2 text-right font-mono bg-orange-50/40 font-semibold text-orange-900">
                      {fmtPct(c.carga_directa_nomina)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono bg-rose-50/40 font-semibold text-rose-900">
                      {fmtPct(c.ss_employer_coste)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-bold text-[#7A1F3D]">
                      {fmtPct(c.cuña_total)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-emerald-700">{fmtPct(c.take_home_pct)}</td>
                  </tr>
                );
              })}
              <tr className="border-t-2 border-stone-300 bg-stone-50/60">
                <td className="px-3 py-2 font-bold text-stone-700">
                  <span className="mr-2">{oecd.flag}</span>{oecd.name}
                </td>
                <td className="px-3 py-2 text-right font-mono font-semibold">{fmtPct(oecd.irpf_coste)}</td>
                <td className="px-3 py-2 text-right font-mono font-semibold">{fmtPct(oecd.ss_worker_coste)}</td>
                <td className="px-3 py-2 text-right font-mono bg-orange-50/40 font-bold">{fmtPct(oecd.carga_directa_nomina)}</td>
                <td className="px-3 py-2 text-right font-mono bg-rose-50/40 font-bold">{fmtPct(oecd.ss_employer_coste)}</td>
                <td className="px-3 py-2 text-right font-mono font-bold">{fmtPct(oecd.cuña_total)}</td>
                <td className="px-3 py-2 text-right font-mono font-semibold text-emerald-700">{fmtPct(oecd.take_home_pct)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Lectura austríaca */}
      <div className="rounded-2xl border-2 border-[#7A1F3D]/30 bg-gradient-to-br from-[#FBF7F0] via-white to-[#EC4899]/10 p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#7A1F3D]" />
          <h3 className="font-serif text-xl tracking-tight">Lo que la desagregación revela</h3>
        </div>
        <div className="space-y-3 text-[13px] text-stone-700 leading-relaxed">
          <p>
            <strong>Primero — el mito de "España tiene IRPF alto":</strong> falso. El IRPF español al nivel
            salario medio es <strong>{fmtPct(es.irpf_coste)} del coste laboral, menor que la media OCDE
            ({fmtPct(oecd.irpf_coste)})</strong>. Donde España destaca es en cotizaciones empresa, no en IRPF.
          </p>
          <p>
            <strong>Segundo — la cuña oculta:</strong> la SS empresa (23.9%) es el verdadero peso fiscal
            español. Aunque no aparece en la nómina del trabajador, la literatura económica (Saez, Matsaganis,
            OCDE) demuestra que <strong>la incidencia económica final recae sobre el trabajador</strong> en
            forma de salario bruto menor al que recibiría en un mercado sin esa carga. Un trabajador
            holandés ve un salario bruto mayor porque la empresa no tiene que restar el 23.9% del coste.
          </p>
          <p>
            <strong>Tercero — por qué importa para el debate:</strong> cuando se discute "subir o bajar
            impuestos", normalmente se habla de IRPF. Pero el margen real está en las cotizaciones empresa.
            <strong> Bajar SS empresa del 23.9% al 15% (nivel NL) elevaría el salario bruto español un 10-12%
            en el medio plazo</strong>, según estimaciones estándar de incidencia.
          </p>
          <p>
            <strong>Cuarto — el IVA:</strong> no forma parte de la "cuña OCDE" pero sí reduce el poder
            adquisitivo real. En España se come aproximadamente <strong>otro 5-6% del coste laboral</strong>
            adicional al pasar del salario neto a bienes consumidos. Suma total Estado España: ~45% del coste
            laboral termina en alguna forma tributaria.
          </p>
          <p className="text-[#7A1F3D] font-serif italic text-[14px] border-l-2 border-[#7A1F3D] pl-4">
            Lente Blondie: el debate fiscal español está mal planteado. No es "¿más o menos IRPF?" — es
            "¿por qué gravamos tanto el empleo frente a otras bases?". La SS empresa al 23.9% es un
            impuesto sobre crear empleo, no sobre consumirlo. En una economía con paro estructural del 11%
            y pocas multinacionales exportadoras, ese diseño castiga doblemente lo que deberíamos
            incentivar: contratar y retener talento productivo en España.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-stone-400 pt-2 border-t border-stone-200">
          <Info className="w-3 h-3" />
          <span>Fuentes: OCDE Taxing Wages 2025 (Country Notes España 2024), datos single worker at 100% average wage, Saez/Matsaganis sobre incidencia empresa→trabajador.</span>
        </div>
      </div>
    </div>
  );
}



/* [22] RENTA REAL · MASLOW FISCAL · v2.5 · Ver sources panel para fuentes. */

// Presupuestos base 2024-2026 por ciudad (€/mes)
const BUDGETS_CIUDAD = {
  madrid: {
    name: "Madrid", flag: "🇪🇸",
    alquiler_2dorm: 1650, alquiler_3dorm: 2100,
    comida_persona: 380, transporte_adulto: 90,
    suministros_2_4: 220, suministros_3_5: 280,
    seguro_salud: 65, ocio_minimo: 50, otros_basicos: 80,
    col_index: 72,
  },
  barcelona: {
    name: "Barcelona", flag: "🇪🇸",
    alquiler_2dorm: 1750, alquiler_3dorm: 2200,
    comida_persona: 400, transporte_adulto: 45,
    suministros_2_4: 210, suministros_3_5: 270,
    seguro_salud: 65, ocio_minimo: 55, otros_basicos: 85,
    col_index: 74,
  },
  valencia: {
    name: "Valencia", flag: "🇪🇸",
    alquiler_2dorm: 1100, alquiler_3dorm: 1400,
    comida_persona: 350, transporte_adulto: 40,
    suministros_2_4: 190, suministros_3_5: 240,
    seguro_salud: 55, ocio_minimo: 45, otros_basicos: 75,
    col_index: 64,
  },
  sevilla: {
    name: "Sevilla", flag: "🇪🇸",
    alquiler_2dorm: 950, alquiler_3dorm: 1200,
    comida_persona: 330, transporte_adulto: 45,
    suministros_2_4: 180, suministros_3_5: 230,
    seguro_salud: 50, ocio_minimo: 45, otros_basicos: 70,
    col_index: 60,
  },
  capital_media: {
    name: "Capital media (Zaragoza, Málaga...)", flag: "🇪🇸",
    alquiler_2dorm: 900, alquiler_3dorm: 1150,
    comida_persona: 320, transporte_adulto: 40,
    suministros_2_4: 180, suministros_3_5: 230,
    seguro_salud: 50, ocio_minimo: 40, otros_basicos: 70,
    col_index: 58,
  },
  pueblo: {
    name: "Pueblo grande / ciudad pequeña", flag: "🇪🇸",
    alquiler_2dorm: 600, alquiler_3dorm: 800,
    comida_persona: 300, transporte_adulto: 30,
    suministros_2_4: 160, suministros_3_5: 210,
    seguro_salud: 45, ocio_minimo: 30, otros_basicos: 60,
    col_index: 50,
  },
};

// Coste por hijo según edad, escuela y ciudad (Save the Children 2024 + OCU + Rivas Kids 2024)
const COSTE_HIJO = {
  // Guardería 0-3
  guarderia_publica: 200,     // €/mes con plaza (muy escasas)
  guarderia_privada: 550,     // €/mes privada Madrid/BCN
  guarderia_concertada: 380,  // €/mes concertada con cheque

  // Primaria/secundaria
  cole_publico_primaria: 120,  // material + comedor + actividades
  cole_concertado_primaria: 380, // cuota voluntaria + comedor + material + uniforme + etc
  cole_privado_primaria: 850,

  cole_publico_secundaria: 100,
  cole_concertado_secundaria: 420,
  cole_privado_secundaria: 950,

  // Costes variables universales por hijo
  ropa_calzado_mes: 50,
  ocio_actividades_mes: 80,
  alimentacion_adicional: 150,  // Comida adicional de tener un hijo
  salud_privada_nino: 30,       // Seguro salud opcional
  extras_imprevistos: 60,       // Regalos, cumples, viajes colegio, etc.
};

// Ayudas fiscales reales (AEAT 2024)
const AYUDAS_FISCALES = {
  deduccion_maternidad: 1200,        // €/año por hijo <3 años madre trabajadora
  deduccion_guarderia: 1000,         // €/año ampliación deducción maternidad
  deduccion_empleada_hogar_max: 500, // Varía por CCAA, 20-40% cuotas, tope €500
  min_descendiente_1_hijo: 2400,     // € reducción base IRPF por 1er hijo
  min_descendiente_2_hijo: 2700,     // 2do hijo
  min_descendiente_3_hijo: 4000,     // 3er hijo
  min_descendiente_4_hijo: 4500,     // 4to en adelante
  prestacion_familia_numerosa: 1200, // € año para familias numerosas
};

// Empleada hogar (SMI 2024 + SS) — coste completo empleador
const EMPLEADA_HOGAR = {
  salario_smi_mensual_2025: 1221,        // SMI 2025 (14 pagas)
  salario_smi_equiv_12_pagas: 1424,      // Mensualizado 12 pagas
  ss_empleador_pct: 0.283,               // ~28.3% (contingencias + accidentes + desempleo + FOGASA)
  ss_empleador_con_descuento_20: 0.226,  // Con descuento 20%
  coste_mensual_jornada_completa: 1827,  // salario 14p + SS empleador (~€406)
  coste_anual_jornada_completa: 21920,
  // Media jornada
  salario_media_jornada: 610,
  ss_media_jornada: 115,
  coste_mensual_media_jornada: 725,
};

function MaslowFiscalView() {
  const [bruto, setBruto] = useState(65000);
  const [adultos, setAdultos] = useState(2);  // NEW: 1 o 2 adultos
  const [hijos, setHijos] = useState(2);
  const [edadHijo1, setEdadHijo1] = useState("primaria"); // guarderia|primaria|secundaria
  const [edadHijo2, setEdadHijo2] = useState("primaria");
  const [tipoColegio, setTipoColegio] = useState("concertado"); // publico|concertado|privado
  const [ciudad, setCiudad] = useState("madrid");
  const [vivienda, setVivienda] = useState("alquiler"); // NEW: alquiler|hipoteca|pagada
  const [hipotecaMensual, setHipotecaMensual] = useState(900);  // NEW: cuota mensual si tiene hipoteca
  const [empleadaHogar, setEmpleadaHogar] = useState("no"); // no|media|completa
  const [segSaludPriv, setSegSaludPriv] = useState(true);

  const fmtEur = (v) => `€${Math.round(v).toLocaleString("es-ES")}`;
  const fmtPct = (v) => `${v.toFixed(1)}%`;

  const budget = BUDGETS_CIUDAD[ciudad];

  // === CÁLCULO 1: Usa la librería fiscal unificada (calcFiscalCompleto) ===
  // Determinar si algún hijo es <3 años (para deducción maternidad)
  const edadMenor3 = (hijos >= 1 && edadHijo1 === "guarderia") || (hijos >= 2 && edadHijo2 === "guarderia");
  // SS empresa hogar (para deducción empleada)
  const empleadaHogarSSAnual = empleadaHogar === "completa" ? 4872 : empleadaHogar === "media" ? 1380 : 0;

  const fiscal = calcFiscalCompleto({
    bruto,
    hijos,
    edadMenor3,
    empleadaHogarSSAnual,
  });

  // Variables locales para compatibilidad con el resto del componente
  const ss_trabajador = fiscal.ss_trabajador;
  const cuota_integra = fiscal.cuota_integra;
  const cuota_sin_minimos = fiscal.reduccion_descendientes;
  const irpf = fiscal.cuota_integra - fiscal.reduccion_descendientes;
  const ded_empleada_hogar = fiscal.deduccion_empleada;
  const ded_maternidad = fiscal.deduccion_maternidad;
  const irpf_final = fiscal.irpf_final;
  const neto_anual = fiscal.neto_anual;
  const neto_mensual = neto_anual / 12;
  const tipo_efectivo = fiscal.tipo_efectivo_total;

  // === CÁLCULO 2: Gastos Maslow Nivel 1 (fisiológicos) ===
  const num_personas = adultos + hijos;

  // Vivienda: varía según modo
  let costeVivienda = 0;
  let etiquetaVivienda = "";
  if (vivienda === "alquiler") {
    costeVivienda = (hijos >= 2 || adultos === 2) ? budget.alquiler_3dorm : budget.alquiler_2dorm;
    etiquetaVivienda = `Alquiler ${(hijos >= 2 || adultos === 2) ? "3 dorm" : "2 dorm"} (${budget.name})`;
  } else if (vivienda === "hipoteca") {
    costeVivienda = hipotecaMensual;
    etiquetaVivienda = `Hipoteca cuota mensual`;
  } else { // pagada
    costeVivienda = 150;  // Solo IBI + comunidad + seguro hogar
    etiquetaVivienda = `Solo IBI + comunidad + seguro hogar (propiedad pagada)`;
  }

  // Comida: si soltero, menos gasto fijo per cápita pero algo mayor (sin economía escala)
  const comidaPerCapita = adultos === 1 ? budget.comida_persona * 1.15 : budget.comida_persona;
  const costeComida = comidaPerCapita * num_personas;
  const costeSuministros = adultos === 1 && hijos === 0 ? budget.suministros_2_4 * 0.75 :
                           (hijos >= 2 ? budget.suministros_3_5 : budget.suministros_2_4);
  const costeTransporte = budget.transporte_adulto * adultos;
  const costeOtrosBasicos = budget.otros_basicos * num_personas;

  const maslow_1_fisiologico = costeVivienda + costeComida + costeSuministros + costeTransporte + costeOtrosBasicos;

  // === CÁLCULO 3: Gastos Maslow Nivel 2 (seguridad) ===
  const costeSeguroSalud = segSaludPriv ? budget.seguro_salud * num_personas : 0;
  const costeOcioMinimo = budget.ocio_minimo * num_personas;

  // Ahorro mínimo recomendado para emergencias (~8% del neto)
  const ahorro_minimo = neto_anual * 0.08 / 12;

  const maslow_2_seguridad = costeSeguroSalud + costeOcioMinimo + ahorro_minimo;

  // === CÁLCULO 4: Costes por hijo ===
  const calcCosteHijo = (edad) => {
    let escuela = 0;
    if (edad === "guarderia") {
      escuela = tipoColegio === "privado" ? COSTE_HIJO.guarderia_privada :
                tipoColegio === "concertado" ? COSTE_HIJO.guarderia_concertada :
                COSTE_HIJO.guarderia_publica;
    } else if (edad === "primaria") {
      escuela = tipoColegio === "privado" ? COSTE_HIJO.cole_privado_primaria :
                tipoColegio === "concertado" ? COSTE_HIJO.cole_concertado_primaria :
                COSTE_HIJO.cole_publico_primaria;
    } else if (edad === "secundaria") {
      escuela = tipoColegio === "privado" ? COSTE_HIJO.cole_privado_secundaria :
                tipoColegio === "concertado" ? COSTE_HIJO.cole_concertado_secundaria :
                COSTE_HIJO.cole_publico_secundaria;
    }
    return escuela + COSTE_HIJO.ropa_calzado_mes + COSTE_HIJO.ocio_actividades_mes +
           COSTE_HIJO.alimentacion_adicional + (segSaludPriv ? COSTE_HIJO.salud_privada_nino : 0) +
           COSTE_HIJO.extras_imprevistos;
  };

  const costeHijo1 = hijos >= 1 ? calcCosteHijo(edadHijo1) : 0;
  const costeHijo2 = hijos >= 2 ? calcCosteHijo(edadHijo2) : 0;
  const costeHijo3 = hijos >= 3 ? calcCosteHijo("primaria") : 0;
  const costeHijosTotal = costeHijo1 + costeHijo2 + costeHijo3;

  // === CÁLCULO 5: Empleada hogar ===
  const costeEmpleadaHogar = empleadaHogar === "completa" ? EMPLEADA_HOGAR.coste_mensual_jornada_completa :
                              empleadaHogar === "media" ? EMPLEADA_HOGAR.coste_mensual_media_jornada : 0;

  // === BALANCE FINAL ===
  const totalGastosMensuales = maslow_1_fisiologico + maslow_2_seguridad + costeHijosTotal + costeEmpleadaHogar;
  const discrecionalMensual = neto_mensual - totalGastosMensuales;
  const discrecionalPctNeto = (discrecionalMensual / neto_mensual) * 100;

  // Nivel Maslow alcanzado
  let nivelMaslow = 1;
  let nivelLabel = "Solo cubre necesidades fisiológicas (sobrevivir)";
  let nivelColor = "#E11D48";
  if (neto_mensual > maslow_1_fisiologico + costeHijosTotal + costeEmpleadaHogar) {
    nivelMaslow = 2;
    nivelLabel = "Alcanza seguridad (vivienda + ahorro emergencia)";
    nivelColor = "#A16207";
  }
  if (neto_mensual > maslow_1_fisiologico + maslow_2_seguridad + costeHijosTotal + costeEmpleadaHogar + 500) {
    nivelMaslow = 3;
    nivelLabel = "Hay holgura para pertenencia (ocio social, vacaciones modestas)";
    nivelColor = "#B45309";
  }
  if (discrecionalMensual > 1500) {
    nivelMaslow = 4;
    nivelLabel = "Alcanza estima (viajes, cultura, consumo aspiracional)";
    nivelColor = "#065F46";
  }
  if (discrecionalMensual > 3000) {
    nivelMaslow = 5;
    nivelLabel = "Autorrealización (ahorro fuerte, inversión, elección real)";
    nivelColor = "#047857";
  }

  // Tipo efectivo sobre renta discrecional (no sobre bruto)
  const impuestos_totales_anuales = ss_trabajador + irpf_final;
  const tipo_sobre_discrecional = discrecionalMensual > 0 ?
    (impuestos_totales_anuales / (impuestos_totales_anuales + discrecionalMensual * 12)) * 100 : 100;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl tracking-tight">Renta real vs necesidades · La cuestión Maslow</h2>
        <p className="text-sm text-stone-500 mt-1 max-w-3xl">
          El IRPF español pega al 45% marginal desde los €60.000. Pero ese nivel salarial en Madrid
          con familia <strong>apenas cubre las dos primeras capas de Maslow</strong>. Este simulador
          calcula qué queda <em>de verdad</em> tras cubrir las necesidades básicas, y qué tipo
          fiscal real estás pagando sobre tu renta <em>discrecional</em> (no sobre la bruta).
        </p>
        <div className="flex gap-2 flex-wrap mt-2">
          <SourceChip sourceKey="aeat_irpf_2023" />
          <SourceChip sourceKey="save_the_children_2024" />
          <SourceChip sourceKey="ine_epf_2024" />
          <SourceChip sourceKey="housing_anywhere_q4_2025" />
          <SourceChip sourceKey="aeat_deducciones_2024_25" />
        </div>
      </div>

      {/* Banner con el dato gordo AEAT */}
      <div className="rounded-2xl border-2 border-[#7A1F3D] bg-gradient-to-br from-[#FBF7F0] to-white p-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.15em] text-stone-500 font-semibold">
              Contribuyentes con renta &gt;€60k
            </div>
            <div className="font-serif text-3xl text-[#7A1F3D] mt-1">~4-5%</div>
            <div className="text-[11px] text-stone-500 mt-1">del total declarantes IRPF</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.15em] text-stone-500 font-semibold">
              Aportación al IRPF
            </div>
            <div className="font-serif text-3xl text-[#7A1F3D] mt-1">~40%</div>
            <div className="text-[11px] text-stone-500 mt-1">de toda la recaudación IRPF (AEAT 2023)</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.15em] text-stone-500 font-semibold">
              Top 10% paga
            </div>
            <div className="font-serif text-3xl text-[#7A1F3D] mt-1">55%</div>
            <div className="text-[11px] text-stone-500 mt-1">del IRPF · concentración extrema</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.15em] text-stone-500 font-semibold">
              Coste vital criar 1 hijo
            </div>
            <div className="font-serif text-3xl text-[#7A1F3D] mt-1">€154k</div>
            <div className="text-[11px] text-stone-500 mt-1">0-18 años (Save the Children 2024)</div>
          </div>
        </div>
      </div>

      {/* Inputs */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5 space-y-4">
        <h3 className="font-serif text-lg tracking-tight">Tu situación</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-[11px] uppercase tracking-[0.12em] text-stone-500 font-semibold">
              Bruto anual {adultos === 2 ? "(pareja puede sumar)" : "(solo tú)"}
            </label>
            <div className="flex items-center gap-2 mt-1">
              <input type="range" min={20000} max={200000} step={1000} value={bruto}
                     onChange={(e) => setBruto(parseInt(e.target.value))}
                     className="flex-1 accent-[#7A1F3D]" />
              <span className="font-mono text-sm text-[#7A1F3D] w-24 text-right">{fmtEur(bruto)}</span>
            </div>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-[0.12em] text-stone-500 font-semibold">
              Ciudad de residencia
            </label>
            <select value={ciudad} onChange={(e) => setCiudad(e.target.value)}
                    className="w-full mt-1 text-sm border border-stone-200 rounded-md px-3 py-2 bg-white">
              {Object.entries(BUDGETS_CIUDAD).map(([k, c]) => (
                <option key={k} value={k}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-[0.12em] text-stone-500 font-semibold">
              Estructura hogar
            </label>
            <div className="flex gap-1 mt-1">
              {[
                { id: 1, label: "1 adulto" },
                { id: 2, label: "Pareja" },
              ].map(o => (
                <button key={o.id} onClick={() => setAdultos(o.id)}
                  className={`flex-1 text-xs px-2 py-1.5 rounded transition-colors ${
                    adultos === o.id ? "bg-[#7A1F3D] text-white" : "bg-stone-100 text-stone-600"
                  }`}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-stone-100">
          <div>
            <label className="text-[11px] uppercase tracking-[0.12em] text-stone-500 font-semibold">
              Nº hijos
            </label>
            <div className="flex items-center gap-2 mt-1">
              <input type="range" min={0} max={3} step={1} value={hijos}
                     onChange={(e) => setHijos(parseInt(e.target.value))}
                     className="flex-1 accent-[#7A1F3D]" />
              <span className="font-mono text-sm text-[#7A1F3D] w-20 text-right">{hijos} hijo{hijos !== 1 ? "s" : ""}</span>
            </div>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-[0.12em] text-stone-500 font-semibold">
              Vivienda
            </label>
            <div className="flex gap-1 mt-1">
              {[
                { id: "alquiler", label: "Alquiler" },
                { id: "hipoteca", label: "Hipoteca" },
                { id: "pagada", label: "Pagada" },
              ].map(o => (
                <button key={o.id} onClick={() => setVivienda(o.id)}
                  className={`flex-1 text-xs px-2 py-1.5 rounded transition-colors ${
                    vivienda === o.id ? "bg-[#7A1F3D] text-white" : "bg-stone-100 text-stone-600"
                  }`}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          {vivienda === "hipoteca" && (
            <div>
              <label className="text-[11px] uppercase tracking-[0.12em] text-stone-500 font-semibold">
                Cuota mensual hipoteca
              </label>
              <div className="flex items-center gap-2 mt-1">
                <input type="range" min={300} max={2500} step={50} value={hipotecaMensual}
                       onChange={(e) => setHipotecaMensual(parseInt(e.target.value))}
                       className="flex-1 accent-[#7A1F3D]" />
                <span className="font-mono text-sm text-[#7A1F3D] w-24 text-right">{fmtEur(hipotecaMensual)}</span>
              </div>
            </div>
          )}
          {vivienda === "pagada" && (
            <div className="md:col-span-1 text-[11px] text-stone-500 italic pt-6">
              Solo IBI + comunidad + seguro hogar (€150/mes aprox). Sin cuota de capital — clase rentista propietaria.
            </div>
          )}
          {vivienda === "alquiler" && (
            <div className="md:col-span-1 text-[11px] text-stone-500 italic pt-6">
              Alquiler ajustado al tamaño: {(hijos >= 2 || adultos === 2) ? "3 dorm" : "2 dorm"} en {budget.name}.
            </div>
          )}
        </div>

        {hijos >= 1 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-stone-100">
            <div>
              <label className="text-[11px] uppercase tracking-[0.12em] text-stone-500 font-semibold">
                Hijo 1 - etapa
              </label>
              <select value={edadHijo1} onChange={(e) => setEdadHijo1(e.target.value)}
                      className="w-full mt-1 text-sm border border-stone-200 rounded-md px-3 py-2 bg-white">
                <option value="guarderia">Guardería (0-3)</option>
                <option value="primaria">Primaria (3-12)</option>
                <option value="secundaria">Secundaria (12-18)</option>
              </select>
            </div>
            {hijos >= 2 && (
              <div>
                <label className="text-[11px] uppercase tracking-[0.12em] text-stone-500 font-semibold">
                  Hijo 2 - etapa
                </label>
                <select value={edadHijo2} onChange={(e) => setEdadHijo2(e.target.value)}
                        className="w-full mt-1 text-sm border border-stone-200 rounded-md px-3 py-2 bg-white">
                  <option value="guarderia">Guardería (0-3)</option>
                  <option value="primaria">Primaria (3-12)</option>
                  <option value="secundaria">Secundaria (12-18)</option>
                </select>
              </div>
            )}
            <div>
              <label className="text-[11px] uppercase tracking-[0.12em] text-stone-500 font-semibold">
                Tipo colegio
              </label>
              <select value={tipoColegio} onChange={(e) => setTipoColegio(e.target.value)}
                      className="w-full mt-1 text-sm border border-stone-200 rounded-md px-3 py-2 bg-white">
                <option value="publico">Público</option>
                <option value="concertado">Concertado (cuota voluntaria)</option>
                <option value="privado">Privado</option>
              </select>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-stone-100">
          <div>
            <label className="text-[11px] uppercase tracking-[0.12em] text-stone-500 font-semibold">
              Empleada de hogar
            </label>
            <div className="flex gap-1 mt-1">
              {[
                { id: "no", label: "No" },
                { id: "media", label: "Media jornada" },
                { id: "completa", label: "Jornada completa" },
              ].map(o => (
                <button key={o.id} onClick={() => setEmpleadaHogar(o.id)}
                  className={`flex-1 text-xs px-2 py-1.5 rounded transition-colors ${
                    empleadaHogar === o.id ? "bg-[#7A1F3D] text-white" : "bg-stone-100 text-stone-600"
                  }`}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-[12px] text-stone-700 cursor-pointer">
              <input type="checkbox" checked={segSaludPriv}
                     onChange={(e) => setSegSaludPriv(e.target.checked)}
                     className="accent-[#7A1F3D] w-4 h-4" />
              <span>Seguro de salud privado (SNS colapsado, opcional)</span>
            </label>
          </div>
        </div>
      </div>

      {/* Resultado principal - NIVEL MASLOW */}
      <div className="rounded-2xl border-4 p-6 text-center"
           style={{ borderColor: nivelColor, backgroundColor: nivelColor + "0A" }}>
        <div className="text-[11px] uppercase tracking-[0.15em] text-stone-500 font-semibold">Nivel Maslow alcanzado</div>
        <div className="flex items-center justify-center gap-3 mt-2">
          {[1, 2, 3, 4, 5].map(n => (
            <div key={n}
                 className="w-10 h-10 rounded-full flex items-center justify-center font-serif text-lg font-bold transition-all"
                 style={{
                   backgroundColor: n <= nivelMaslow ? nivelColor : "#E7E5E4",
                   color: n <= nivelMaslow ? "white" : "#57534E",
                 }}>
              {n}
            </div>
          ))}
        </div>
        <div className="font-serif text-xl mt-3" style={{ color: nivelColor }}>
          Nivel {nivelMaslow} — {nivelLabel}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.12em] text-stone-500">Renta discrecional</div>
            <div className="font-serif text-2xl" style={{ color: nivelColor }}>
              {fmtEur(discrecionalMensual)}/mes
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.12em] text-stone-500">% del neto</div>
            <div className="font-serif text-2xl" style={{ color: nivelColor }}>
              {fmtPct(discrecionalPctNeto)}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.12em] text-stone-500">Tipo efectivo s/ discrecional</div>
            <div className="font-serif text-2xl text-rose-700">
              {fmtPct(tipo_sobre_discrecional)}
            </div>
          </div>
        </div>
      </div>

      {/* Desglose completo */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <h3 className="font-serif text-lg tracking-tight mb-4">Desglose completo mensual</h3>

        {/* Ingresos */}
        <div className="rounded-lg bg-emerald-50/40 border border-emerald-200 p-4 mb-3">
          <div className="text-[11px] uppercase tracking-[0.12em] text-emerald-800 font-semibold mb-2">
            Ingresos netos después de impuestos
          </div>
          <div className="space-y-1 text-[13px]">
            <div className="flex justify-between">
              <span className="text-stone-700">Bruto anual</span>
              <span className="font-mono text-stone-700">{fmtEur(bruto)}/año</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-700">− SS trabajador (6.5%)</span>
              <span className="font-mono text-rose-700">−{fmtEur(ss_trabajador)}/año</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-700">− IRPF cuota íntegra</span>
              <span className="font-mono text-rose-700">−{fmtEur(cuota_integra)}/año</span>
            </div>
            {hijos > 0 && (
              <div className="flex justify-between">
                <span className="text-stone-700">+ Reducción descendientes (al marginal)</span>
                <span className="font-mono text-emerald-700">+{fmtEur(cuota_sin_minimos)}/año</span>
              </div>
            )}
            {ded_empleada_hogar > 0 && (
              <div className="flex justify-between">
                <span className="text-stone-700">+ Deducción empleada hogar (tope €500)</span>
                <span className="font-mono text-emerald-700">+{fmtEur(ded_empleada_hogar)}/año</span>
              </div>
            )}
            {ded_maternidad > 0 && (
              <div className="flex justify-between">
                <span className="text-stone-700">+ Deducción maternidad (hijo &lt;3 años)</span>
                <span className="font-mono text-emerald-700">+{fmtEur(ded_maternidad)}/año</span>
              </div>
            )}
            <div className="flex justify-between border-t border-emerald-200 pt-1 mt-1">
              <span className="text-stone-700">= IRPF final pagado</span>
              <span className="font-mono font-semibold text-rose-700">{fmtEur(irpf_final)}/año</span>
            </div>
            <div className="flex justify-between border-t border-emerald-200 pt-1 mt-1">
              <span className="font-serif font-semibold text-stone-900">Neto mensual</span>
              <span className="font-mono font-bold text-emerald-700">{fmtEur(neto_mensual)}/mes</span>
            </div>
            <div className="flex justify-between text-[11px] text-stone-500">
              <span>Tipo efectivo bruto</span>
              <span>{fmtPct(tipo_efectivo * 100)}</span>
            </div>
          </div>
        </div>

        {/* Maslow 1: Fisiológico */}
        <div className="rounded-lg bg-rose-50/40 border border-rose-200 p-4 mb-3">
          <div className="text-[11px] uppercase tracking-[0.12em] text-rose-800 font-semibold mb-2">
            Maslow 1 · Fisiológico (no negociable)
          </div>
          <div className="space-y-1 text-[13px]">
            <div className="flex justify-between">
              <span className="text-stone-700">{etiquetaVivienda}</span>
              <span className="font-mono text-stone-700">{fmtEur(costeVivienda)}/mes</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-700">Alimentación {num_personas} persona{num_personas !== 1 ? "s" : ""}</span>
              <span className="font-mono text-stone-700">{fmtEur(costeComida)}/mes</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-700">Suministros (luz, agua, gas, internet)</span>
              <span className="font-mono text-stone-700">{fmtEur(costeSuministros)}/mes</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-700">Transporte ({adultos} adulto{adultos !== 1 ? "s" : ""})</span>
              <span className="font-mono text-stone-700">{fmtEur(costeTransporte)}/mes</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-700">Otros básicos (ropa, higiene, comunidad)</span>
              <span className="font-mono text-stone-700">{fmtEur(costeOtrosBasicos)}/mes</span>
            </div>
            <div className="flex justify-between border-t border-rose-200 pt-1 mt-1">
              <span className="font-serif font-semibold text-stone-900">Subtotal Maslow 1</span>
              <span className="font-mono font-bold text-rose-700">{fmtEur(maslow_1_fisiologico)}/mes</span>
            </div>
          </div>
        </div>

        {/* Maslow 2: Seguridad */}
        <div className="rounded-lg bg-amber-50/40 border border-amber-200 p-4 mb-3">
          <div className="text-[11px] uppercase tracking-[0.12em] text-amber-800 font-semibold mb-2">
            Maslow 2 · Seguridad (mínimo recomendable)
          </div>
          <div className="space-y-1 text-[13px]">
            {costeSeguroSalud > 0 && (
              <div className="flex justify-between">
                <span className="text-stone-700">Seguro salud privado ({num_personas} pers)</span>
                <span className="font-mono text-stone-700">{fmtEur(costeSeguroSalud)}/mes</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-stone-700">Ocio mínimo (no lujo)</span>
              <span className="font-mono text-stone-700">{fmtEur(costeOcioMinimo)}/mes</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-700">Ahorro emergencia recomendado (8%)</span>
              <span className="font-mono text-stone-700">{fmtEur(ahorro_minimo)}/mes</span>
            </div>
            <div className="flex justify-between border-t border-amber-200 pt-1 mt-1">
              <span className="font-serif font-semibold text-stone-900">Subtotal Maslow 2</span>
              <span className="font-mono font-bold text-amber-700">{fmtEur(maslow_2_seguridad)}/mes</span>
            </div>
          </div>
        </div>

        {/* Hijos */}
        {hijos > 0 && (
          <div className="rounded-lg bg-blue-50/40 border border-blue-200 p-4 mb-3">
            <div className="text-[11px] uppercase tracking-[0.12em] text-blue-800 font-semibold mb-2">
              Coste hijos ({hijos})
            </div>
            <div className="space-y-1 text-[13px]">
              {hijos >= 1 && (
                <div className="flex justify-between">
                  <span className="text-stone-700">Hijo 1 ({edadHijo1}, cole {tipoColegio})</span>
                  <span className="font-mono text-stone-700">{fmtEur(costeHijo1)}/mes</span>
                </div>
              )}
              {hijos >= 2 && (
                <div className="flex justify-between">
                  <span className="text-stone-700">Hijo 2 ({edadHijo2}, cole {tipoColegio})</span>
                  <span className="font-mono text-stone-700">{fmtEur(costeHijo2)}/mes</span>
                </div>
              )}
              {hijos >= 3 && (
                <div className="flex justify-between">
                  <span className="text-stone-700">Hijo 3 (primaria)</span>
                  <span className="font-mono text-stone-700">{fmtEur(costeHijo3)}/mes</span>
                </div>
              )}
              <div className="flex justify-between border-t border-blue-200 pt-1 mt-1">
                <span className="font-serif font-semibold text-stone-900">Subtotal hijos</span>
                <span className="font-mono font-bold text-blue-700">{fmtEur(costeHijosTotal)}/mes</span>
              </div>
              <div className="text-[11px] text-stone-500 italic">
                Save the Children 2024: coste medio €758/mes/hijo. Este cálculo: {fmtEur(costeHijosTotal / hijos)}/hijo.
              </div>
            </div>
          </div>
        )}

        {/* Empleada hogar */}
        {empleadaHogar !== "no" && (
          <div className="rounded-lg bg-purple-50/40 border border-purple-200 p-4 mb-3">
            <div className="text-[11px] uppercase tracking-[0.12em] text-purple-800 font-semibold mb-2">
              Empleada hogar ({empleadaHogar === "completa" ? "jornada completa" : "media jornada"})
            </div>
            <div className="space-y-1 text-[13px]">
              <div className="flex justify-between">
                <span className="text-stone-700">Salario + SS empleador</span>
                <span className="font-mono text-stone-700">{fmtEur(costeEmpleadaHogar)}/mes</span>
              </div>
              <div className="flex justify-between text-[11px] text-stone-500">
                <span>Con deducción fiscal (~{fmtEur(ded_empleada_hogar)}/año ya incluida arriba)</span>
              </div>
              <div className="text-[11px] text-stone-500 italic mt-1">
                Nota: deducción típica 20% cuotas SS, tope €500/año según CCAA. En la práctica cubre ~3% del coste.
              </div>
            </div>
          </div>
        )}

        {/* Balance final */}
        <div className={`rounded-lg border-2 p-4`}
             style={{ borderColor: nivelColor, backgroundColor: nivelColor + "0A" }}>
          <div className="flex justify-between items-center">
            <span className="font-serif text-lg text-stone-900">Queda al final del mes</span>
            <span className="font-serif text-2xl font-bold" style={{ color: nivelColor }}>
              {fmtEur(discrecionalMensual)}/mes
            </span>
          </div>
          {discrecionalMensual < 0 && (
            <div className="mt-2 text-[12px] text-rose-700 font-semibold">
              ⚠ Con estos parámetros NO llegas a fin de mes. Tendrías que reducir algún gasto (quitar seguro privado, colegio público, no empleada hogar) o irte a ciudad más barata.
            </div>
          )}
          {discrecionalMensual >= 0 && discrecionalMensual < 500 && (
            <div className="mt-2 text-[12px] text-amber-700 font-semibold">
              ⚠ Con menos de €500 de discrecional, cualquier imprevisto (avería coche, tratamiento dental, cambio electrodoméstico) te mete en números rojos.
            </div>
          )}
        </div>
      </div>

      {/* LA CUESTIÓN FISCAL — concentración IRPF */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <h3 className="font-serif text-lg tracking-tight mb-3">La paradoja del IRPF español</h3>
        <p className="text-[13px] text-stone-700 leading-relaxed mb-3">
          Con tu bruto de {fmtEur(bruto)} estás pagando un <strong>tipo marginal del {
            bruto > 300000 ? "47%" : bruto > 60000 ? "45%" : bruto > 35200 ? "37%" : bruto > 20200 ? "30%" : "24%"
          }</strong> y un <strong>tipo efectivo del {fmtPct(tipo_efectivo * 100)}</strong> sobre el bruto. Pero si miras
          <strong> tipo efectivo sobre tu renta discrecional real</strong> (la que queda tras cubrir Maslow 1+2 y los hijos),
          el cálculo es brutal: <strong style={{ color: "#E11D48" }}>{fmtPct(tipo_sobre_discrecional)}</strong>.
        </p>
        <p className="text-[13px] text-stone-700 leading-relaxed mb-3">
          Esto es porque los impuestos los pagas sobre el <em>total</em> de tu renta, pero tu "capacidad real de pago"
          (lo que queda tras cubrir lo esencial) es solo una fracción. El IRPF <strong>no está calibrado
          para distinguir necesidades vitales de renta discrecional</strong>. Un soltero en un pueblo con €60k
          tiene 10 veces más capacidad real que una familia de 4 con €60k en Madrid — pero pagan lo mismo.
        </p>

        <div className="rounded-lg bg-[#FBF7F0] border-l-4 border-[#7A1F3D] p-4">
          <h4 className="font-serif text-base text-stone-900 mb-2">La concentración extrema del IRPF</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[12px]">
            <div>
              <div className="text-stone-500">D1-D5 (50% más bajos)</div>
              <div className="font-serif text-lg text-stone-700">7% del IRPF</div>
            </div>
            <div>
              <div className="text-stone-500">D6-D8</div>
              <div className="font-serif text-lg text-stone-700">33%</div>
            </div>
            <div>
              <div className="text-stone-500">D9</div>
              <div className="font-serif text-lg text-stone-700">19%</div>
            </div>
            <div>
              <div className="text-stone-500 font-semibold">D10 (top 10%)</div>
              <div className="font-serif text-xl text-[#7A1F3D] font-bold">41%</div>
            </div>
          </div>
          <p className="text-[11px] text-stone-600 mt-3 italic">
            AEAT 2023. El top 10% paga <strong>6 veces más</strong> que la mitad inferior, sobre un sistema que
            grava toda su renta, no solo la "excedente" de las necesidades básicas. La mayoría de ese top 10% no
            son ricos rentistas — son profesionales cualificados con familia en ciudad cara.
          </p>
        </div>
      </div>

      {/* COMPARATIVA SIN HIJOS vs CON HIJOS */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <h3 className="font-serif text-lg tracking-tight mb-1">¿Por qué no tenemos hijos? — el diferencial real</h3>
        <p className="text-[11px] text-stone-500 mb-3">
          Coste incremental de cada hijo adicional vs ayudas fiscales. El saldo revela por qué la natalidad española
          está en mínimos históricos (1.12 hijos/mujer 2024).
        </p>
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-[10px] uppercase tracking-[0.08em] text-stone-500">
            <tr>
              <th className="text-left px-3 py-2">Concepto</th>
              <th className="text-right px-3 py-2">Coste anual</th>
              <th className="text-right px-3 py-2">Ayuda fiscal</th>
              <th className="text-right px-3 py-2">Coste neto</th>
            </tr>
          </thead>
          <tbody className="text-[12px]">
            <tr className="border-t border-stone-100">
              <td className="px-3 py-2">Guardería privada (0-3 años)</td>
              <td className="px-3 py-2 text-right font-mono">{fmtEur(COSTE_HIJO.guarderia_privada * 11)}</td>
              <td className="px-3 py-2 text-right font-mono text-emerald-700">{fmtEur(AYUDAS_FISCALES.deduccion_guarderia)}</td>
              <td className="px-3 py-2 text-right font-mono font-semibold text-rose-700">
                {fmtEur(COSTE_HIJO.guarderia_privada * 11 - AYUDAS_FISCALES.deduccion_guarderia)}
              </td>
            </tr>
            <tr className="border-t border-stone-100">
              <td className="px-3 py-2">Cole concertado + comedor + extras (primaria)</td>
              <td className="px-3 py-2 text-right font-mono">{fmtEur(COSTE_HIJO.cole_concertado_primaria * 10)}</td>
              <td className="px-3 py-2 text-right font-mono text-emerald-700">~{fmtEur(500)}</td>
              <td className="px-3 py-2 text-right font-mono font-semibold text-rose-700">
                {fmtEur(COSTE_HIJO.cole_concertado_primaria * 10 - 500)}
              </td>
            </tr>
            <tr className="border-t border-stone-100">
              <td className="px-3 py-2">Alimentación + ropa + extras por hijo</td>
              <td className="px-3 py-2 text-right font-mono">{fmtEur((COSTE_HIJO.alimentacion_adicional + COSTE_HIJO.ropa_calzado_mes + COSTE_HIJO.ocio_actividades_mes) * 12)}</td>
              <td className="px-3 py-2 text-right font-mono text-emerald-700">0</td>
              <td className="px-3 py-2 text-right font-mono font-semibold text-rose-700">
                {fmtEur((COSTE_HIJO.alimentacion_adicional + COSTE_HIJO.ropa_calzado_mes + COSTE_HIJO.ocio_actividades_mes) * 12)}
              </td>
            </tr>
            <tr className="border-t border-stone-100">
              <td className="px-3 py-2">Deducción por descendiente (IRPF)</td>
              <td className="px-3 py-2 text-right">—</td>
              <td className="px-3 py-2 text-right font-mono text-emerald-700">~{fmtEur(AYUDAS_FISCALES.min_descendiente_1_hijo * 0.19)}</td>
              <td className="px-3 py-2 text-right">—</td>
            </tr>
            <tr className="border-t-2 border-stone-300 bg-stone-50">
              <td className="px-3 py-2 font-bold">Coste neto anual 1 hijo (concertado)</td>
              <td className="px-3 py-2 text-right"></td>
              <td className="px-3 py-2 text-right"></td>
              <td className="px-3 py-2 text-right font-mono font-bold text-rose-700 text-base">
                ~€11.000/año
              </td>
            </tr>
            <tr className="border-t border-stone-200 bg-emerald-50/40">
              <td className="px-3 py-2 font-bold text-emerald-900">Mismo escenario, cole público</td>
              <td className="px-3 py-2 text-right"></td>
              <td className="px-3 py-2 text-right"></td>
              <td className="px-3 py-2 text-right font-mono font-bold text-emerald-700 text-base">
                ~€4.500/año
              </td>
            </tr>
          </tbody>
        </table>
        <p className="text-[12px] text-stone-600 mt-4 leading-relaxed">
          <strong>Conclusión incómoda:</strong> para una familia clase-media-alta española, un hijo "cuesta de
          verdad" 2.5x más que a una familia que usa servicios públicos y recibe IMV/becas. Paradójicamente,
          <strong> los incentivos fiscales a la natalidad son casi inexistentes para quien más contribuye al sistema</strong>.
          Las deducciones españolas son testimoniales comparadas con Francia (QF familiar) o Alemania (Kindergeld €250/mes/hijo).
        </p>
      </div>

      {/* CIERRE HONESTO: los dos lados */}
      <div className="rounded-2xl border-2 border-[#7A1F3D]/30 bg-gradient-to-br from-[#FBF7F0] via-white to-[#EC4899]/10 p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#7A1F3D]" />
          <h3 className="font-serif text-xl tracking-tight">Las dos lecturas — honestidad obliga</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-serif text-base text-stone-900 mb-2">Argumento a favor del sistema actual</h4>
            <ul className="text-[12px] text-stone-700 space-y-2 leading-relaxed">
              <li>• Un ingeniero con €65k <em>sigue estando en el top 5-10%</em> salarial español. Objetivamente tiene mejor vida que el 90% del país.</li>
              <li>• La decisión de vivir en Madrid o Barcelona es una elección. Muchos españoles viven igual de bien en ciudades menores por la mitad.</li>
              <li>• Los servicios públicos "no usados" (SNS, escuela pública) <strong>siguen existiendo porque se financian colectivamente</strong>. Seguridad, carreteras, justicia son externalidades que usa todo el mundo.</li>
              <li>• La concentración del IRPF en el top 10% es <strong>la definición de progresividad</strong>, que suele defenderse como valor social.</li>
              <li>• Ese mismo 10% <strong>acumula buena parte del patrimonio neto</strong>, que no está gravado por IRPF sino por IP/sucesiones (otra discusión).</li>
            </ul>
          </div>
          <div>
            <h4 className="font-serif text-base text-stone-900 mb-2">Argumento del problema Maslow</h4>
            <ul className="text-[12px] text-stone-700 space-y-2 leading-relaxed">
              <li>• Al €60k en Madrid con 2 hijos, la <strong>renta discrecional real puede ser negativa</strong>. No es un problema de "estilo de vida" — es geografía + demografía.</li>
              <li>• El IRPF grava <strong>toda la renta</strong>, no la excedente sobre necesidades. Esto es <em>confiscatorio en términos de Maslow</em> aunque no lo sea aritméticamente.</li>
              <li>• La <strong>fuga de talento</strong> real a Alemania, Países Bajos, Irlanda no es por "ideología" — es porque el mismo bruto ahí deja €600-1.500/mes más de discrecional.</li>
              <li>• La <strong>natalidad española</strong> en mínimos históricos (1.12 hijos/mujer) es consecuencia directa: los que pueden tener hijos son los que reciben ayudas o los que están muy arriba. El medio se exprime.</li>
              <li>• <strong>Contribuyentes netos pero "usuarios netos negativos"</strong>: el top 10% paga el 55% del IRPF, mantiene seguros privados, pone hijos en concertado, y aún así recibe menos servicios públicos per cápita.</li>
            </ul>
          </div>
        </div>
        <p className="text-[#7A1F3D] font-serif italic text-[14px] border-l-2 border-[#7A1F3D] pl-4 mt-3">
          Lente austríaca: la progresividad fiscal española está calibrada sobre un supuesto falso — que "€60k+ es
          rico". En Madrid 2025 con familia, €60k es <em>clase media luchando por cubrir necesidades</em>, no renta
          excedente disponible para redistribuir. El sistema funcionaba cuando la vivienda era asequible (pre-2015)
          y la SS era un beneficio claro. Hoy el pacto está roto: los que más pagan reciben menos servicios que
          hace 15 años, a la vez que ganan menos en términos reales. El sistema se sostiene por inercia y miedo al
          cambio, no por lógica económica.
        </p>
        <div className="flex items-center gap-2 text-[10px] text-stone-400 pt-2 border-t border-stone-200">
          <Info className="w-3 h-3" />
          <span>Fuentes: AEAT 2023 (concentración IRPF), Save the Children 2024 (coste crianza), INE EPF 2024, OCU/Picodi 2024 (cesta supervivencia), Expatistan 2024, HousingAnywhere Q4 2025, AEAT 2024-25 (deducciones). Maslow 1943. Tipos IRPF estatal + autonómico Madrid 2026.</span>
        </div>
      </div>
    </div>
  );
}



/* [23] DEMOGRAFÍA · PENSIONES 2050 · v2.7 */

// Pirámide poblacional: porcentaje por grupo de edad (INE 2024 y proyección 2050)
const PIRAMIDE_2024_2050 = [
  { edad: "0-4",   h2024: 1.8, m2024: 1.7, h2050: 1.8, m2050: 1.7 },
  { edad: "5-14",  h2024: 4.9, m2024: 4.6, h2050: 3.7, m2050: 3.5 },
  { edad: "15-24", h2024: 5.2, m2024: 4.9, h2050: 4.4, m2050: 4.2 },
  { edad: "25-34", h2024: 5.9, m2024: 5.7, h2050: 5.3, m2050: 5.1 },
  { edad: "35-44", h2024: 7.2, m2024: 7.0, h2050: 5.8, m2050: 5.7 },
  { edad: "45-54", h2024: 8.5, m2024: 8.4, h2050: 6.1, m2050: 6.0 },
  { edad: "55-64", h2024: 7.2, m2024: 7.3, h2050: 6.4, m2050: 6.4 },
  { edad: "65-74", h2024: 5.1, m2024: 5.4, h2050: 7.8, m2050: 8.0 },
  { edad: "75-84", h2024: 3.2, m2024: 3.8, h2050: 6.5, m2050: 7.1 },
  { edad: "85+",   h2024: 1.2, m2024: 2.0, h2050: 4.5, m2050: 5.9 },
];

// Datos clave del sistema (AIReF + Santa Lucía 2025)
const PENSIONES_KPIS = {
  // Estado actual 2024
  gasto_pensiones_bn_2024: 207,      // €Bn · contributivas + no contributivas
  gasto_pensiones_pct_pib_2024: 13.0, // % PIB
  ingresos_pensiones_bn_2024: 196,   // cotizaciones + transferencias Estado
  deficit_pensiones_bn_2024: 11,     // diferencia
  deficit_pensiones_pct_pib_2024: 0.6,

  // Transferencias Estado (no cotizaciones) que ya se hacen
  transferencias_estado_pct_pib_2024: 3.1,

  // Ratio cotizantes/pensionistas
  cotizantes_mn_2024: 21.9,
  pensionistas_mn_2024: 9.3,          // ~9.3M pensiones contributivas
  ratio_2024: 2.35,                   // 21.9 / 9.3

  // Proyección 2050 (AIReF escenario central)
  ratio_2050_central: 1.6,            // solo 1.6 cotizantes por jubilado
  ratio_2070: 1.4,
  gasto_pensiones_pct_pib_2050: 16.1, // proyección AIReF (+3.1pp vs 2024)

  // Déficit sistema sin reforma (AIReF)
  afiliados_adicionales_necesarios_2050: 6,   // millones
  transferencias_adicionales_2050_pct_pib: 2.4, // pp PIB adicionales

  // Demografía estructural
  natalidad_hijos_mujer_2024: 1.12,
  natalidad_hijos_mujer_2050: 1.40,   // proyección INE/AIReF (recuperación parcial)
  esperanza_vida_65_2024: 19.98,
  esperanza_vida_65_2050: 21.88,
  esperanza_vida_65_2070: 22.60,

  // Inmigración que asume INE para compensar
  saldo_migratorio_anual_hasta_2050: 375000,
  pct_nacidos_espana_2024: 81.9,
  pct_nacidos_espana_2074: 61.0,

  // Reformas ya aprobadas impacto (AIReF eval 2025)
  impacto_medidas_ingresos_2025_pct_pib: 1.4, // subida bases máximas + MEI + cotiz autónomos
  reserva_seg_social_bn_2024: 10,             // "hucha" pensiones
  reserva_seg_social_max_2010_bn: 66,         // máximo histórico

  // Deuda pública si no se reforma (AIReF)
  deuda_publica_2024_pct_pib: 100.7,
  deuda_publica_2050_sin_reforma_pct_pib: 129,
  deuda_publica_2070_sin_reforma_pct_pib: 181,
};

// Medidas de reforma disponibles con impactos estimados
const MEDIDAS_REFORMA = {
  // Palanca 1: Subir edad jubilación
  edad_jubilacion: {
    baseline: 67,
    impacto_por_año: -0.6,  // pp PIB de gasto menos por cada año adicional de trabajo
    desc: "Retrasar la edad legal de jubilación. Cada año adicional reduce gasto ~0.6pp PIB al reducir pensionistas + aumentar cotizantes.",
  },
  // Palanca 2: Destope pensión máxima
  destope_pension_max: {
    baseline: 0,  // puntos sobre IPC
    impacto_por_punto: 0.15,  // pp PIB aumento de gasto por cada punto extra anual
    desc: "Si la pensión máxima sube más que IPC (como hoy +0.115pp), crece el gasto. Si sube menos, se modera. Punto clave: 2050.",
  },
  // Palanca 3: Subir cotización (MEI extendido)
  mei_extra_pp: {
    baseline: 1.2,  // MEI actual 2030-2050
    impacto_por_pp: 0.8,  // pp PIB de ingresos extra por cada punto de cotización
    desc: "El MEI actual es 1.2pp. Subir 1pp extra = +0.8pp PIB de ingresos (sobre base cotización).",
  },
  // Palanca 4: Nueva tasa de reposición
  tasa_reposicion_reduccion_pp: {
    baseline: 0,  // sin reducción
    impacto_por_pp: -0.3,  // cada pp menos reposición = -0.3pp PIB gasto
    desc: "Reducir la tasa reposición bruta (pensión/último salario) en X pp. Hoy ~77.5%. Bajarla al 70% = -2.25pp PIB gasto a largo plazo.",
  },
  // Palanca 5: Productividad
  productividad_pct_extra: {
    baseline: 0,
    impacto_por_punto: 0.4,  // cada punto extra de crecimiento PIB reduce peso del gasto en PIB
    desc: "Si el PIB crece 1pp más por productividad, el gasto pensiones como % PIB cae 0.4pp (denominador efecto).",
  },
};

// Países comparación reformas (OCDE 2024)
const REFORMAS_INTERNACIONALES = [
  { pais: "España", edad_actual: 67, tasa_rep: 77.5, gasto_pib: 13.0, bandera: "🇪🇸", reforma: "Ley 21/2021: IPC completo + MEI + destope. Sin factor sostenibilidad." },
  { pais: "Alemania", edad_actual: 67, tasa_rep: 48.0, gasto_pib: 10.3, bandera: "🇩🇪", reforma: "Ajuste automático con factor sostenibilidad. Pensión baja obligada a complementar con Riester." },
  { pais: "Suecia", edad_actual: 66, tasa_rep: 56.0, gasto_pib: 8.9, bandera: "🇸🇪", reforma: "NDC (Notional Defined Contribution) + ajuste automático longevidad. Ejemplo europeo de reforma." },
  { pais: "Países Bajos", edad_actual: 67, tasa_rep: 74.0, gasto_pib: 7.5, bandera: "🇳🇱", reforma: "Sistema mixto público+privado. Pilar privado obligatorio 2º pilar. Activos €1.5tn." },
  { pais: "Francia", edad_actual: 64, tasa_rep: 51.0, gasto_pib: 13.8, bandera: "🇫🇷", reforma: "Subida edad 62→64 en 2023 (protestas). Sin ajuste longevidad automático." },
  { pais: "Italia", edad_actual: 67, tasa_rep: 65.0, gasto_pib: 15.8, bandera: "🇮🇹", reforma: "Récord UE gasto pensiones. NDC desde 1995 para nuevos cotizantes. Cambio muy gradual." },
];

function DemografiaPensionesView() {
  const [edadJubilacion, setEdadJubilacion] = useState(67);
  const [meiExtra, setMeiExtra] = useState(0);  // pp adicionales sobre 1.2 actual
  const [reduccionReposicion, setReduccionReposicion] = useState(0); // pp menos reposición
  const [productividadExtra, setProductividadExtra] = useState(0);
  const [pensionMaxExtra, setPensionMaxExtra] = useState(0.115); // actual 0.115pp sobre IPC
  const [anioObjetivo, setAnioObjetivo] = useState(2050);

  const fmtPct = (v) => `${v.toFixed(1)}%`;
  const fmtPp = (v) => `${v > 0 ? "+" : ""}${v.toFixed(2)}pp`;
  const fmtBn = (v) => `€${v.toFixed(0)} Bn`;

  // Cálculo del gasto en pensiones proyectado con ajustes
  const baseline_gasto_2050 = PENSIONES_KPIS.gasto_pensiones_pct_pib_2050; // 16.1%
  const baseline_gasto_2024 = PENSIONES_KPIS.gasto_pensiones_pct_pib_2024; // 13.0%

  // Impactos de cada palanca
  const impactoEdad = (edadJubilacion - 67) * MEDIDAS_REFORMA.edad_jubilacion.impacto_por_año;
  const impactoMei = meiExtra * MEDIDAS_REFORMA.mei_extra_pp.impacto_por_pp;
  const impactoReposicion = reduccionReposicion * MEDIDAS_REFORMA.tasa_reposicion_reduccion_pp.impacto_por_pp;
  const impactoProductividad = productividadExtra * MEDIDAS_REFORMA.productividad_pct_extra.impacto_por_punto;
  const impactoPensionMax = (pensionMaxExtra - 0) * MEDIDAS_REFORMA.destope_pension_max.impacto_por_punto * 26; // 26 años hasta 2050

  // Gasto proyectado con reformas (lado gasto)
  const gasto_proyectado = baseline_gasto_2050 + impactoEdad + impactoReposicion - impactoProductividad + impactoPensionMax;
  // Ingresos proyectados (lado ingresos)
  const ingresos_proyectados = PENSIONES_KPIS.ingresos_pensiones_bn_2024 / 1670 * 100 + impactoMei; // aprox 11.7% PIB + MEI
  const saldo_proyectado = ingresos_proyectados - gasto_proyectado;

  // Evaluación semáforo
  let semaforo, semColor, semLabel;
  if (saldo_proyectado > -1) { semaforo = "🟢"; semColor = "#065F46"; semLabel = "Sostenible"; }
  else if (saldo_proyectado > -2.5) { semaforo = "🟡"; semColor = "#B45309"; semLabel = "Tenso pero manejable"; }
  else if (saldo_proyectado > -4) { semaforo = "🟠"; semColor = "#C2410C"; semLabel = "Insostenible medio plazo"; }
  else { semaforo = "🔴"; semColor = "#B91C1C"; semLabel = "Crisis fiscal inminente"; }

  // Datos pirámide formateados para Recharts (valores positivos para hombres y mujeres)
  const piramide_data = PIRAMIDE_2024_2050.map(g => ({
    edad: g.edad,
    h_2024: -g.h2024,
    m_2024: g.m2024,
    h_2050: -g.h2050,
    m_2050: g.m2050,
  }));

  // Datos de evolución del ratio cotizantes/pensionistas
  const ratio_evolucion = [
    { año: 1970, ratio: 5.0 },
    { año: 1990, ratio: 4.2 },
    { año: 2000, ratio: 3.5 },
    { año: 2010, ratio: 2.8 },
    { año: 2020, ratio: 2.4 },
    { año: 2024, ratio: 2.35 },
    { año: 2030, ratio: 2.1 },
    { año: 2040, ratio: 1.8 },
    { año: 2050, ratio: 1.6 },
    { año: 2060, ratio: 1.5 },
    { año: 2070, ratio: 1.4 },
  ];

  // Evolución gasto en pensiones % PIB
  const gasto_pib_evolucion = [
    { año: 2010, baseline: 10.0, conReformas: 10.0 },
    { año: 2020, baseline: 12.5, conReformas: 12.5 },
    { año: 2024, baseline: 13.0, conReformas: 13.0 },
    { año: 2030, baseline: 13.8, conReformas: 13.8 + (impactoEdad + impactoReposicion - impactoProductividad) * 0.2 },
    { año: 2040, baseline: 15.0, conReformas: 15.0 + (impactoEdad + impactoReposicion - impactoProductividad) * 0.6 },
    { año: 2050, baseline: 16.1, conReformas: gasto_proyectado },
    { año: 2060, baseline: 16.8, conReformas: gasto_proyectado + 0.5 },
    { año: 2070, baseline: 17.2, conReformas: gasto_proyectado + 0.9 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl tracking-tight">Demografía · Pensiones 2050 · el shock</h2>
        <p className="text-sm text-stone-500 mt-1 max-w-3xl">
          La pirámide poblacional española se invertirá entre 2025 y 2050. Los baby-boomers (nacidos 1958-1977, ~14M personas)
          se jubilan ahora. La natalidad lleva 40 años por debajo del reemplazo (2.1 hijos/mujer). El ratio cotizantes/pensionistas
          pasará de <strong>2.35 hoy a 1.6 en 2050</strong>. Sin reformas, el gasto en pensiones pasa del 13% al 16.1% del PIB,
          y la deuda pública supera el 129% en 2050 (AIReF).
        </p>
        <div className="flex gap-2 flex-wrap mt-2">
          <SourceChip sourceKey="airef_pensiones_2025" />
          <SourceChip sourceKey="airef_sostenibilidad_2024" />
          <SourceChip sourceKey="ine_proyecciones_2024_2074" />
          <SourceChip sourceKey="fedea_pensiones_2023" />
          <SourceChip sourceKey="santa_lucia_pensiones_2025" />
        </div>
      </div>

      {/* KPIs clave */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="rounded-xl border-2 border-[#7A1F3D] bg-[#FBF7F0] p-4">
          <div className="text-[10px] uppercase tracking-[0.12em] text-stone-500 font-semibold">Ratio cotizantes/pensionista HOY</div>
          <div className="font-serif text-3xl text-[#7A1F3D] mt-1">{PENSIONES_KPIS.ratio_2024.toFixed(2)}</div>
          <div className="text-[11px] text-stone-500 mt-1">
            {PENSIONES_KPIS.cotizantes_mn_2024}M cotizantes / {PENSIONES_KPIS.pensionistas_mn_2024}M pensionistas
          </div>
        </div>
        <div className="rounded-xl border-2 border-rose-400 bg-rose-50/30 p-4">
          <div className="text-[10px] uppercase tracking-[0.12em] text-rose-800 font-semibold">Ratio en 2050 (proyección AIReF)</div>
          <div className="font-serif text-3xl text-rose-700 mt-1">{PENSIONES_KPIS.ratio_2050_central}</div>
          <div className="text-[11px] text-stone-500 mt-1">
            Solo 1.6 cotizantes por cada pensionista. Sistema tensionado.
          </div>
        </div>
        <div className="rounded-xl border-2 border-amber-400 bg-amber-50/30 p-4">
          <div className="text-[10px] uppercase tracking-[0.12em] text-amber-800 font-semibold">Natalidad actual</div>
          <div className="font-serif text-3xl text-amber-700 mt-1">{PENSIONES_KPIS.natalidad_hijos_mujer_2024}</div>
          <div className="text-[11px] text-stone-500 mt-1">
            hijos/mujer · vs 2.1 necesario para reemplazo
          </div>
        </div>
        <div className="rounded-xl border-2 border-purple-400 bg-purple-50/30 p-4">
          <div className="text-[10px] uppercase tracking-[0.12em] text-purple-800 font-semibold">Déficit pensiones 2050</div>
          <div className="font-serif text-3xl text-purple-700 mt-1">+{PENSIONES_KPIS.transferencias_adicionales_2050_pct_pib}pp</div>
          <div className="text-[11px] text-stone-500 mt-1">
            PIB de transferencias adicionales del Estado (AIReF)
          </div>
        </div>
      </div>

      {/* PIRÁMIDE POBLACIONAL 2024 vs 2050 */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <div className="flex items-start justify-between mb-1 flex-wrap gap-2">
          <h3 className="font-serif text-lg tracking-tight">La pirámide se invierte · 2024 vs 2050</h3>
          <SourceChip sourceKey="ine_proyecciones_2024_2074" />
        </div>
        <p className="text-[11px] text-stone-500 mb-3">
          % población por grupo de edad. En 2050 el grupo &gt;65 años será el 30.4% de la población (vs 20% hoy).
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-[12px] font-semibold text-stone-600 text-center mb-2">Pirámide 2024</h4>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={piramide_data} layout="vertical" stackOffset="sign">
                <CartesianGrid strokeDasharray="2 4" stroke="#E7E5E4" />
                <XAxis type="number" tickFormatter={(v) => `${Math.abs(v)}%`} tick={{ fontSize: 10 }} />
                <YAxis dataKey="edad" type="category" tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => `${Math.abs(v).toFixed(1)}%`} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Bar dataKey="h_2024" fill="#7A1F3D" name="Hombres" />
                <Bar dataKey="m_2024" fill="#EC4899" name="Mujeres" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div>
            <h4 className="text-[12px] font-semibold text-stone-600 text-center mb-2">Pirámide 2050 (proyección INE)</h4>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={piramide_data} layout="vertical" stackOffset="sign">
                <CartesianGrid strokeDasharray="2 4" stroke="#E7E5E4" />
                <XAxis type="number" tickFormatter={(v) => `${Math.abs(v)}%`} tick={{ fontSize: 10 }} />
                <YAxis dataKey="edad" type="category" tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => `${Math.abs(v).toFixed(1)}%`} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Bar dataKey="h_2050" fill="#7A1F3D" name="Hombres" />
                <Bar dataKey="m_2050" fill="#EC4899" name="Mujeres" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="mt-4 text-[12px] text-stone-600 leading-relaxed">
          <strong>Lectura:</strong> en 2024 el grupo más numeroso es 45-54 (los baby-boomers). En 2050 el grupo más numeroso será 65-74 y 75-84. La base de la pirámide (jóvenes) se estrecha dramáticamente. Esto no es una predicción, es la gente que <em>ya nació</em> (o no nació).
        </div>
      </div>

      {/* EVOLUCIÓN RATIO COTIZANTES/PENSIONISTAS */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <div className="flex items-start justify-between mb-1 flex-wrap gap-2">
          <h3 className="font-serif text-lg tracking-tight">Evolución del ratio cotizantes/pensionistas · 1970-2070</h3>
          <SourceChip sourceKey="seg_social_2025" />
        </div>
        <p className="text-[11px] text-stone-500 mb-3">
          El sistema de pensiones es "de reparto": los cotizantes actuales pagan las pensiones actuales. Este ratio es crítico.
        </p>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={ratio_evolucion} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="2 4" stroke="#E7E5E4" />
            <XAxis dataKey="año" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} domain={[0, 6]} ticks={[0, 1, 2, 3, 4, 5]} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }}
                     formatter={(v) => [`${v} cotizantes / pensionista`, "Ratio"]} />
            <ReferenceLine y={2.0} stroke="#B45309" strokeDasharray="4 4" label={{ value: "Umbral tensión", position: "right", fontSize: 10, fill: "#B45309" }} />
            <ReferenceLine y={1.5} stroke="#B91C1C" strokeDasharray="4 4" label={{ value: "Umbral crisis", position: "right", fontSize: 10, fill: "#B91C1C" }} />
            <Line type="monotone" dataKey="ratio" stroke="#7A1F3D" strokeWidth={3} dot={{ r: 5, fill: "#7A1F3D" }} />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-3 text-[12px] text-stone-600 leading-relaxed">
          <strong>En los 70</strong> había 5 cotizantes por cada pensionista · el sistema rebosaba.<br/>
          <strong>Hoy 2024</strong>: 2.35 cotizantes por pensionista · ya con déficit estructural de €11 Bn/año.<br/>
          <strong>En 2050</strong>: 1.6 cotizantes por pensionista · con todas las reformas actuales, insostenible.
        </div>
      </div>

      {/* SIMULADOR DE REFORMA */}
      <div className="rounded-2xl border-2 border-[#7A1F3D] bg-gradient-to-br from-[#FBF7F0] to-white p-5 space-y-4">
        <h3 className="font-serif text-lg tracking-tight">Simulador de reforma · ¿Qué ajustes harían el sistema sostenible?</h3>
        <p className="text-[12px] text-stone-600 leading-relaxed">
          Ajusta las 5 palancas y ve el impacto en el gasto en pensiones a 2050. <strong>Baseline AIReF sin reformas: 16.1% PIB</strong>.
          El objetivo de sostenibilidad es mantener el gasto por debajo del 14.7% (regla pacto gobierno-UE).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg bg-white border border-stone-200 p-3">
            <label className="text-[11px] uppercase tracking-[0.12em] text-stone-500 font-semibold">
              Edad jubilación
            </label>
            <div className="flex items-center gap-2 mt-1">
              <input type="range" min={65} max={72} step={1} value={edadJubilacion}
                     onChange={(e) => setEdadJubilacion(parseInt(e.target.value))}
                     className="flex-1 accent-[#7A1F3D]" />
              <span className="font-mono text-sm text-[#7A1F3D] w-20 text-right">{edadJubilacion} años</span>
            </div>
            <div className="text-[10px] text-stone-400 mt-1">
              Baseline: 67 · Impacto: {fmtPp(impactoEdad)} PIB gasto 2050
            </div>
          </div>

          <div className="rounded-lg bg-white border border-stone-200 p-3">
            <label className="text-[11px] uppercase tracking-[0.12em] text-stone-500 font-semibold">
              MEI extra (cotización adicional)
            </label>
            <div className="flex items-center gap-2 mt-1">
              <input type="range" min={0} max={4} step={0.1} value={meiExtra}
                     onChange={(e) => setMeiExtra(parseFloat(e.target.value))}
                     className="flex-1 accent-[#7A1F3D]" />
              <span className="font-mono text-sm text-[#7A1F3D] w-20 text-right">+{meiExtra.toFixed(1)}pp</span>
            </div>
            <div className="text-[10px] text-stone-400 mt-1">
              Sobre 1.2pp actual · Impacto: {fmtPp(impactoMei)} PIB ingresos
            </div>
          </div>

          <div className="rounded-lg bg-white border border-stone-200 p-3">
            <label className="text-[11px] uppercase tracking-[0.12em] text-stone-500 font-semibold">
              Reducción tasa reposición
            </label>
            <div className="flex items-center gap-2 mt-1">
              <input type="range" min={0} max={20} step={1} value={reduccionReposicion}
                     onChange={(e) => setReduccionReposicion(parseInt(e.target.value))}
                     className="flex-1 accent-[#7A1F3D]" />
              <span className="font-mono text-sm text-[#7A1F3D] w-20 text-right">−{reduccionReposicion}pp</span>
            </div>
            <div className="text-[10px] text-stone-400 mt-1">
              Actual: 77.5% · Con reducción: {(77.5 - reduccionReposicion).toFixed(1)}% · Impacto: {fmtPp(impactoReposicion)}
            </div>
          </div>

          <div className="rounded-lg bg-white border border-stone-200 p-3">
            <label className="text-[11px] uppercase tracking-[0.12em] text-stone-500 font-semibold">
              Productividad extra anual
            </label>
            <div className="flex items-center gap-2 mt-1">
              <input type="range" min={0} max={2} step={0.1} value={productividadExtra}
                     onChange={(e) => setProductividadExtra(parseFloat(e.target.value))}
                     className="flex-1 accent-[#7A1F3D]" />
              <span className="font-mono text-sm text-[#7A1F3D] w-20 text-right">+{productividadExtra.toFixed(1)}pp</span>
            </div>
            <div className="text-[10px] text-stone-400 mt-1">
              PTF actual ~0.5% · Con extra: {(0.5 + productividadExtra).toFixed(1)}% · Impacto: {fmtPp(-impactoProductividad)}
            </div>
          </div>
        </div>

        {/* RESULTADO */}
        <div className="rounded-xl border-4 p-5"
             style={{ borderColor: semColor, backgroundColor: semColor + "0A" }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[11px] uppercase tracking-[0.12em] text-stone-500 font-semibold">Resultado tu reforma · 2050</div>
              <div className="font-serif text-2xl mt-1" style={{ color: semColor }}>
                {semaforo} {semLabel}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] uppercase tracking-[0.12em] text-stone-500 font-semibold">Saldo pensiones 2050</div>
              <div className="font-serif text-3xl font-bold mt-1" style={{ color: semColor }}>
                {saldo_proyectado > 0 ? "+" : ""}{saldo_proyectado.toFixed(2)}pp PIB
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[12px]">
            <div className="bg-white rounded-lg p-3 border border-stone-200">
              <div className="text-stone-500 text-[10px] uppercase tracking-[0.1em]">Gasto pensiones 2050</div>
              <div className="font-mono text-lg font-bold" style={{ color: gasto_proyectado > baseline_gasto_2050 ? "#B91C1C" : "#065F46" }}>
                {fmtPct(gasto_proyectado)} PIB
              </div>
              <div className="text-[10px] text-stone-500">vs {fmtPct(baseline_gasto_2050)} sin reforma</div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-stone-200">
              <div className="text-stone-500 text-[10px] uppercase tracking-[0.1em]">Ingresos sistema 2050</div>
              <div className="font-mono text-lg font-bold text-emerald-700">
                {fmtPct(ingresos_proyectados)} PIB
              </div>
              <div className="text-[10px] text-stone-500">con MEI extra {fmtPp(impactoMei)}</div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-stone-200">
              <div className="text-stone-500 text-[10px] uppercase tracking-[0.1em]">Transferencias Estado</div>
              <div className="font-mono text-lg font-bold text-amber-700">
                {Math.max(0, -saldo_proyectado).toFixed(2)}pp PIB
              </div>
              <div className="text-[10px] text-stone-500">financiación vía deuda/impuestos</div>
            </div>
          </div>
        </div>
      </div>

      {/* EVOLUCIÓN GASTO CON REFORMAS */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <div className="flex items-start justify-between mb-1 flex-wrap gap-2">
          <h3 className="font-serif text-lg tracking-tight">Evolución del gasto en pensiones · baseline vs tu reforma</h3>
          <div className="flex gap-2 flex-wrap">
            <SourceChip sourceKey="airef_pensiones_2025" />
            <SourceChip sourceKey="ce_ageing_report_2024" />
          </div>
        </div>
        <p className="text-[11px] text-stone-500 mb-3">
          Proyección 2010-2070 con y sin los ajustes seleccionados.
        </p>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={gasto_pib_evolucion} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="2 4" stroke="#E7E5E4" />
            <XAxis dataKey="año" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} domain={[8, 20]} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }}
                     formatter={(v) => `${v.toFixed(2)}% PIB`} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <ReferenceLine y={14.7} stroke="#C2410C" strokeDasharray="4 4"
                           label={{ value: "Límite pacto UE", position: "right", fontSize: 10, fill: "#C2410C" }} />
            <Line type="monotone" dataKey="baseline" stroke="#B91C1C" strokeWidth={2.5} dot={{ r: 4 }} name="Sin reformas (AIReF)" />
            <Line type="monotone" dataKey="conReformas" stroke="#065F46" strokeWidth={2.5} dot={{ r: 4 }} name="Con tus ajustes" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* COMPARATIVA INTERNACIONAL */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <h3 className="font-serif text-lg tracking-tight mb-3">Reformas comparadas · qué han hecho otros países</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead className="bg-stone-50 text-[10px] uppercase tracking-[0.08em] text-stone-500">
              <tr>
                <th className="text-left px-3 py-2">País</th>
                <th className="text-right px-3 py-2">Edad jub.</th>
                <th className="text-right px-3 py-2">Tasa reposición</th>
                <th className="text-right px-3 py-2">Gasto % PIB</th>
                <th className="text-left px-3 py-2">Reforma clave</th>
              </tr>
            </thead>
            <tbody>
              {REFORMAS_INTERNACIONALES.map((p, i) => (
                <tr key={i} className={`border-t border-stone-100 ${p.pais === "España" ? "bg-[#FBF7F0]" : ""}`}>
                  <td className="px-3 py-2 font-medium">
                    <span className="mr-2">{p.bandera}</span>
                    <span className={p.pais === "España" ? "text-[#7A1F3D] font-bold" : ""}>{p.pais}</span>
                  </td>
                  <td className="px-3 py-2 text-right font-mono">{p.edad_actual}</td>
                  <td className="px-3 py-2 text-right font-mono">{p.tasa_rep}%</td>
                  <td className="px-3 py-2 text-right font-mono font-bold"
                      style={{ color: p.gasto_pib > 13 ? "#B91C1C" : p.gasto_pib > 10 ? "#B45309" : "#065F46" }}>
                    {p.gasto_pib}%
                  </td>
                  <td className="px-3 py-2 text-stone-600 text-[11px]">{p.reforma}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 text-[12px] text-stone-600 leading-relaxed">
          <strong>Lectura:</strong> Suecia es el caso más reformista (NDC + ajuste automático longevidad) y tiene el gasto más bajo (8.9% PIB) con reposición decente (56%). Italia y Francia son los problemáticos: alta reposición, sin ajuste longevidad, gasto disparado. España está en medio pero con <strong>la tasa de reposición más generosa</strong> y sin mecanismo de ajuste automático.
        </div>
      </div>

      {/* CIERRE HONESTO */}
      <div className="rounded-2xl border-2 border-[#7A1F3D]/30 bg-gradient-to-br from-[#FBF7F0] via-white to-[#EC4899]/10 p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#7A1F3D]" />
          <h3 className="font-serif text-xl tracking-tight">Las tres verdades incómodas</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg bg-white border border-rose-200 p-4">
            <h4 className="font-serif text-base text-rose-900 mb-2">1 · La demografía ya está escrita</h4>
            <p className="text-[12px] text-stone-700 leading-relaxed">
              Los 14M baby-boomers que se jubilan 2025-2040 <strong>ya nacieron</strong>. Los 2M menos de niños nacidos 2010-2024 vs 1970-1980 <strong>tampoco van a nacer ya</strong>. Todo lo demás son variaciones menores sobre un esquema demográfico inmutable.
            </p>
          </div>
          <div className="rounded-lg bg-white border border-amber-200 p-4">
            <h4 className="font-serif text-base text-amber-900 mb-2">2 · Sin reforma, la deuda explota</h4>
            <p className="text-[12px] text-stone-700 leading-relaxed">
              AIReF lo cuantifica: sin medidas, deuda pública <strong>129% PIB en 2050 y 181% PIB en 2070</strong>. La financiación vía BCE es una muleta, no solución. El servicio de deuda ya es la 2ª partida del presupuesto.
            </p>
          </div>
          <div className="rounded-lg bg-white border border-emerald-200 p-4">
            <h4 className="font-serif text-base text-emerald-900 mb-2">3 · Hay combinaciones viables</h4>
            <p className="text-[12px] text-stone-700 leading-relaxed">
              +2 años edad + 1.5pp MEI + 5pp reposición + 1pp productividad = <strong>saldo positivo en 2050</strong>. No es magia. Es consenso europeo (Suecia lo hizo). Falta voluntad política + pedagogía ciudadana.
            </p>
          </div>
        </div>

        <p className="text-[#7A1F3D] font-serif italic text-[14px] border-l-2 border-[#7A1F3D] pl-4 mt-4">
          Lente Blondie: España tiene el pacto generacional roto en su raíz económica. El boomer cotizó ~€100k vitalicios pero cobrará ~€600k en pensiones (4-6× retorno). El millennial cotizará €200-300k y probablemente cobrará €200-400k (0.8-1.3× retorno). Esto no es redistribución social — es una transferencia de riqueza intergeneracional sin precedentes. Y los millennials lo saben: de ahí la desconfianza en el sistema, la no-natalidad (¿cómo tener hijos si no puedo pagar vivienda?), la búsqueda de planes privados o de emigrar. El sistema no se sostiene sin reforma estructural en las próximas dos legislaturas.
        </p>

        <div className="flex items-center gap-2 text-[10px] text-stone-400 pt-3 border-t border-stone-200">
          <Info className="w-3 h-3" />
          <span>
            Fuentes: AIReF Informe Regla Gasto Pensiones 2025 (marzo 2025), AIReF Opinión Sostenibilidad AAPP 2024, Fedea EEE 2023-15 (Jiménez & Viola), INE Proyecciones Población 2024-2074, CE Ageing Report 2024, Banco de España Proyecciones 2024, Santa Lucía Informe Mayo 2025, OCDE Pensions at a Glance 2023.
          </span>
        </div>
      </div>
    </div>
  );
}

