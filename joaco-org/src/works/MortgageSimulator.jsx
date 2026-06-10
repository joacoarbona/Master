/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║           SIMULADOR HIPOTECARIO ESPAÑA                       ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Instalación de dependencias:
 *   npm install @supabase/supabase-js recharts
 *
 * Configuración en 3 pasos:
 *   1. Crea un proyecto gratis en https://supabase.com
 *   2. Ejecuta el SQL de supabase_setup.sql en el SQL Editor
 *   3. Reemplaza las dos constantes SUPABASE_URL y SUPABASE_ANON_KEY
 *      con los valores de tu proyecto (Settings → API → Project URL / anon key)
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

// ─── SUPABASE CONFIG ──────────────────────────────────────────────────────────
// Reemplaza estos valores con los de tu proyecto de Supabase
const SUPABASE_URL  = 'https://TU_PROYECTO.supabase.co';
const SUPABASE_ANON = 'TU_ANON_KEY_AQUI';

// Detecta si Supabase está configurado
const SUPABASE_READY = !SUPABASE_URL.includes('TU_PROYECTO');
const sb = SUPABASE_READY
  ? createClient(SUPABASE_URL, SUPABASE_ANON)
  : null;

// ─── FECHAS DINÁMICAS ────────────────────────────────────────────────────────
const NOW_Y = new Date().getFullYear();
const NOW_M = new Date().getMonth() + 1;
const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

// ─── EURÍBOR 12M HISTÓRICO (base local hasta mar 2025) ───────────────────────
// Se actualiza automáticamente con datos del BCE al cargar la app
const EUR_BASE = {
  "2000-01":3.89,"2000-02":4.09,"2000-03":4.25,"2000-04":4.44,"2000-05":4.71,"2000-06":4.98,
  "2000-07":5.02,"2000-08":5.05,"2000-09":5.17,"2000-10":5.16,"2000-11":5.17,"2000-12":5.19,
  "2001-01":5.07,"2001-02":4.93,"2001-03":4.84,"2001-04":5.06,"2001-05":5.13,"2001-06":5.04,
  "2001-07":4.89,"2001-08":4.76,"2001-09":4.20,"2001-10":3.86,"2001-11":3.54,"2001-12":3.36,
  "2002-01":3.38,"2002-02":3.48,"2002-03":3.54,"2002-04":3.58,"2002-05":3.51,"2002-06":3.55,
  "2002-07":3.50,"2002-08":3.39,"2002-09":3.26,"2002-10":3.15,"2002-11":3.03,"2002-12":2.95,
  "2003-01":2.84,"2003-02":2.71,"2003-03":2.53,"2003-04":2.46,"2003-05":2.37,"2003-06":2.24,
  "2003-07":2.15,"2003-08":2.13,"2003-09":2.19,"2003-10":2.22,"2003-11":2.23,"2003-12":2.31,
  "2004-01":2.31,"2004-02":2.22,"2004-03":2.17,"2004-04":2.17,"2004-05":2.27,"2004-06":2.40,
  "2004-07":2.38,"2004-08":2.22,"2004-09":2.25,"2004-10":2.29,"2004-11":2.30,"2004-12":2.30,
  "2005-01":2.31,"2005-02":2.35,"2005-03":2.37,"2005-04":2.37,"2005-05":2.38,"2005-06":2.41,
  "2005-07":2.44,"2005-08":2.54,"2005-09":2.61,"2005-10":2.69,"2005-11":2.78,"2005-12":2.83,
  "2006-01":2.94,"2006-02":3.04,"2006-03":3.25,"2006-04":3.44,"2006-05":3.55,"2006-06":3.62,
  "2006-07":3.70,"2006-08":3.85,"2006-09":3.95,"2006-10":4.00,"2006-11":4.02,"2006-12":4.02,
  "2007-01":4.06,"2007-02":4.09,"2007-03":4.10,"2007-04":4.22,"2007-05":4.36,"2007-06":4.51,
  "2007-07":4.56,"2007-08":4.66,"2007-09":4.73,"2007-10":4.71,"2007-11":4.72,"2007-12":4.79,
  "2008-01":4.50,"2008-02":4.34,"2008-03":4.59,"2008-04":4.83,"2008-05":5.00,"2008-06":5.36,
  "2008-07":5.39,"2008-08":5.47,"2008-09":5.38,"2008-10":5.25,"2008-11":4.35,"2008-12":3.45,
  "2009-01":2.62,"2009-02":2.14,"2009-03":1.91,"2009-04":1.77,"2009-05":1.64,"2009-06":1.61,
  "2009-07":1.41,"2009-08":1.33,"2009-09":1.26,"2009-10":1.24,"2009-11":1.23,"2009-12":1.24,
  "2010-01":1.23,"2010-02":1.22,"2010-03":1.21,"2010-04":1.22,"2010-05":1.26,"2010-06":1.28,
  "2010-07":1.37,"2010-08":1.42,"2010-09":1.42,"2010-10":1.49,"2010-11":1.54,"2010-12":1.53,
  "2011-01":1.55,"2011-02":1.71,"2011-03":1.92,"2011-04":2.09,"2011-05":2.15,"2011-06":2.14,
  "2011-07":2.18,"2011-08":2.09,"2011-09":2.07,"2011-10":2.11,"2011-11":2.04,"2011-12":2.00,
  "2012-01":1.84,"2012-02":1.68,"2012-03":1.50,"2012-04":1.50,"2012-05":1.27,"2012-06":1.22,
  "2012-07":1.06,"2012-08":0.89,"2012-09":0.74,"2012-10":0.65,"2012-11":0.59,"2012-12":0.55,
  "2013-01":0.58,"2013-02":0.59,"2013-03":0.54,"2013-04":0.53,"2013-05":0.48,"2013-06":0.51,
  "2013-07":0.53,"2013-08":0.54,"2013-09":0.54,"2013-10":0.54,"2013-11":0.51,"2013-12":0.55,
  "2014-01":0.56,"2014-02":0.49,"2014-03":0.57,"2014-04":0.60,"2014-05":0.58,"2014-06":0.51,
  "2014-07":0.50,"2014-08":0.47,"2014-09":0.36,"2014-10":0.34,"2014-11":0.33,"2014-12":0.25,
  "2015-01":0.25,"2015-02":0.23,"2015-03":0.21,"2015-04":0.19,"2015-05":0.16,"2015-06":0.16,
  "2015-07":0.16,"2015-08":0.16,"2015-09":0.15,"2015-10":0.12,"2015-11":0.08,"2015-12":0.06,
  "2016-01":0.04,"2016-02":0.00,"2016-03":-0.01,"2016-04":-0.01,"2016-05":-0.01,"2016-06":-0.03,
  "2016-07":-0.06,"2016-08":-0.06,"2016-09":-0.07,"2016-10":-0.07,"2016-11":-0.07,"2016-12":-0.08,
  "2017-01":-0.10,"2017-02":-0.10,"2017-03":-0.11,"2017-04":-0.12,"2017-05":-0.12,"2017-06":-0.15,
  "2017-07":-0.15,"2017-08":-0.15,"2017-09":-0.17,"2017-10":-0.17,"2017-11":-0.18,"2017-12":-0.19,
  "2018-01":-0.19,"2018-02":-0.19,"2018-03":-0.19,"2018-04":-0.19,"2018-05":-0.19,"2018-06":-0.18,
  "2018-07":-0.18,"2018-08":-0.17,"2018-09":-0.15,"2018-10":-0.15,"2018-11":-0.15,"2018-12":-0.13,
  "2019-01":-0.13,"2019-02":-0.15,"2019-03":-0.13,"2019-04":-0.12,"2019-05":-0.13,"2019-06":-0.19,
  "2019-07":-0.28,"2019-08":-0.36,"2019-09":-0.34,"2019-10":-0.31,"2019-11":-0.27,"2019-12":-0.26,
  "2020-01":-0.26,"2020-02":-0.29,"2020-03":-0.27,"2020-04":-0.27,"2020-05":-0.30,"2020-06":-0.15,
  "2020-07":-0.27,"2020-08":-0.36,"2020-09":-0.41,"2020-10":-0.47,"2020-11":-0.48,"2020-12":-0.50,
  "2021-01":-0.50,"2021-02":-0.50,"2021-03":-0.49,"2021-04":-0.49,"2021-05":-0.48,"2021-06":-0.48,
  "2021-07":-0.49,"2021-08":-0.50,"2021-09":-0.49,"2021-10":-0.47,"2021-11":-0.49,"2021-12":-0.50,
  "2022-01":-0.48,"2022-02":-0.34,"2022-03":0.00,"2022-04":0.01,"2022-05":0.29,"2022-06":0.85,
  "2022-07":0.99,"2022-08":1.25,"2022-09":2.23,"2022-10":2.62,"2022-11":2.83,"2022-12":3.02,
  "2023-01":3.34,"2023-02":3.53,"2023-03":3.65,"2023-04":3.76,"2023-05":3.86,"2023-06":4.01,
  "2023-07":4.15,"2023-08":4.07,"2023-09":4.15,"2023-10":4.16,"2023-11":4.02,"2023-12":3.68,
  "2024-01":3.61,"2024-02":3.67,"2024-03":3.72,"2024-04":3.70,"2024-05":3.68,"2024-06":3.65,
  "2024-07":3.53,"2024-08":3.17,"2024-09":2.94,"2024-10":2.69,"2024-11":2.56,"2024-12":2.44,
  "2025-01":2.52,"2025-02":2.39,"2025-03":2.41,
};

// ─── FETCH BCE — actualiza con los últimos meses publicados ──────────────────
async function fetchLatestEuribor() {
  try {
    const url =
      'https://data-api.ecb.europa.eu/service/data/FM/M.U2.EUR.RT0.MM.EURIBOR12MD_.HSTA' +
      '?format=csvdata&lastNObservations=24';
    const res = await fetch(url);
    if (!res.ok) return {};
    const text = await res.text();
    const lines = text.trim().split('\n');
    const hdrs = lines[0].split(',');
    const ti = hdrs.findIndex(h => h.trim() === 'TIME_PERIOD');
    const vi = hdrs.findIndex(h => h.trim() === 'OBS_VALUE');
    const updates = {};
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',');
      const key = cols[ti]?.trim();
      const val = parseFloat(cols[vi]);
      if (key && !isNaN(val)) updates[key] = val;
    }
    return updates;
  } catch {
    return {};
  }
}

// ─── CÁLCULO ─────────────────────────────────────────────────────────────────
function dk(y, m) { return `${y}-${String(m).padStart(2, '0')}`; }
function addM(y, m, n) { const t = y*12+(m-1)+n; return [Math.floor(t/12), t%12+1]; }
function pmt(b, r, n) {
  if (r < 1e-10) return b / n;
  return b * r * Math.pow(1+r, n) / (Math.pow(1+r, n) - 1);
}
function isPast(y, m) { return y < NOW_Y || (y === NOW_Y && m <= NOW_M); }
function fmt(n) { return Math.round(n).toLocaleString('es-ES'); }

function buildSchedule(cfg, euribor, forecast) {
  const { amt, yrs, type, fRate, marg, fYrs, sy, sm } = cfg;
  const N = yrs * 12;
  const rows = [];
  let bal = amt, curP = 0, lastRev = -13;

  for (let m = 0; m < N && bal > 0.01; m++) {
    const [yr, mo] = addM(sy, sm, m);
    const key = dk(yr, mo);

    const e = euribor[key] !== undefined
      ? euribor[key]
      : (() => {
          const ys = Object.keys(forecast).map(Number).filter(k => k <= yr).sort((a,b)=>b-a);
          return ys.length ? forecast[ys[0]] : 2.5;
        })();

    let rate;
    if (type === 'fixed') rate = fRate;
    else if (type === 'variable') rate = e + marg;
    else rate = m < fYrs * 12 ? fRate : e + marg;
    rate = Math.max(0, rate);

    const r = rate / 100 / 12;
    const rem = N - m;
    const isTransition = type === 'mixed' && m === fYrs * 12;

    if (m - lastRev >= 12 || m === 0 || isTransition) {
      curP = pmt(bal, r, rem);
      lastRev = m;
    }

    const intr = bal * r;
    const prin = Math.min(Math.max(0, curP - intr), bal);
    bal = Math.max(0, bal - prin);

    rows.push({ m: m+1, yr, mo, pmt: curP, prin, intr, bal, e, rate, past: isPast(yr, mo) });
  }
  return rows;
}

// ─── ESTILOS BASE ─────────────────────────────────────────────────────────────
const C = {
  bg: '#F8F9FA', surface: '#FFFFFF', border: '#E5E7EB', border2: '#D1D5DB',
  text: '#111827', muted: '#6B7280', faint: '#9CA3AF',
  green: '#059669', greenBg: '#ECFDF5',
  red: '#DC2626', redBg: '#FEF2F2',
  blue: '#2563EB', blueBg: '#EFF6FF', blueBorder: '#BFDBFE',
  amber: '#D97706',
  mono: "'Courier New', Courier, monospace",
  sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const card  = { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '1.25rem', marginBottom: '1rem' };
const inp   = { width: '100%', padding: '7px 10px', border: `1px solid ${C.border2}`, borderRadius: 6, fontSize: 13, background: C.surface, color: C.text, fontFamily: C.sans };
const lbl   = { fontSize: 12, color: C.muted, display: 'block', marginBottom: 3 };
const btn   = { padding: '6px 13px', border: `1px solid ${C.border2}`, borderRadius: 6, background: C.surface, cursor: 'pointer', fontSize: 13, color: C.text, fontFamily: C.sans };
const btnPr = { padding: '7px 14px', border: 'none', borderRadius: 6, background: C.blue, cursor: 'pointer', fontSize: 13, color: '#fff', fontWeight: 600, fontFamily: C.sans };

// ─── MODAL BASE ───────────────────────────────────────────────────────────────
function Modal({ children, onClose, width = 380 }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex',
               alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: C.surface, borderRadius: 14, padding: '1.75rem',
                    width, maxWidth: '92vw', maxHeight: '85vh', overflowY: 'auto',
                    fontFamily: C.sans }}>
        {children}
      </div>
    </div>
  );
}

// ─── AUTH MODAL ───────────────────────────────────────────────────────────────
function AuthModal({ onClose, onAuth }) {
  const [tab, setTab]         = useState('login');
  const [email, setEmail]     = useState('');
  const [pass, setPass]       = useState('');
  const [err, setErr]         = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);

  const handle = async () => {
    if (!sb) return;
    setLoading(true); setErr('');
    try {
      if (tab === 'login') {
        const { data, error } = await sb.auth.signInWithPassword({ email, password: pass });
        if (error) throw error;
        onAuth(data.user);
        onClose();
      } else {
        const { error } = await sb.auth.signUp({ email, password: pass });
        if (error) throw error;
        setDone(true);
      }
    } catch (e) { setErr(e.message); }
    setLoading(false);
  };

  return (
    <Modal onClose={onClose} width={360}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: '1.25rem', color: C.text }}>
        {tab === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
      </h2>
      {done ? (
        <>
          <p style={{ color: C.green, marginBottom: '1rem', fontSize: 14 }}>
            ✓ Revisa tu email para confirmar la cuenta y luego inicia sesión.
          </p>
          <button onClick={() => setDone(false)} style={{ ...btn, marginRight: 8 }}>
            Volver al login
          </button>
          <button onClick={onClose} style={btnPr}>Cerrar</button>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', marginBottom: '1.25rem', borderBottom: `1px solid ${C.border}` }}>
            {[['login','Iniciar sesión'],['register','Crear cuenta']].map(([t,l]) => (
              <button key={t} onClick={() => setTab(t)} style={{
                flex: 1, padding: '8px', background: 'none', border: 'none', cursor: 'pointer',
                fontWeight: tab===t ? 700 : 400, color: tab===t ? C.blue : C.muted,
                borderBottom: tab===t ? `2px solid ${C.blue}` : '2px solid transparent',
                fontFamily: C.sans, fontSize: 13,
              }}>{l}</button>
            ))}
          </div>
          <label style={lbl}>Email</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
            placeholder="tu@email.com" style={{ ...inp, marginBottom: 10 }}
            onKeyDown={e => e.key === 'Enter' && handle()} />
          <label style={lbl}>Contraseña {tab==='register'&&<span style={{color:C.faint}}>(mínimo 6 caracteres)</span>}</label>
          <input type="password" value={pass} onChange={e=>setPass(e.target.value)}
            placeholder="••••••••" style={{ ...inp, marginBottom: 14 }}
            onKeyDown={e => e.key === 'Enter' && handle()} />
          {err && <p style={{ color: C.red, fontSize: 12, marginBottom: 10 }}>{err}</p>}
          <button onClick={handle} disabled={loading} style={{ ...btnPr, width: '100%', padding: '9px' }}>
            {loading ? 'Procesando…' : tab==='login' ? 'Entrar' : 'Crear cuenta'}
          </button>
          {tab==='login' && (
            <p style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: C.muted }}>
              ¿No tienes cuenta?{' '}
              <span onClick={()=>setTab('register')} style={{ color: C.blue, cursor: 'pointer', fontWeight: 600 }}>
                Regístrate gratis
              </span>
            </p>
          )}
        </>
      )}
    </Modal>
  );
}

// ─── PANEL MIS SIMULACIONES ──────────────────────────────────────────────────
function SimsPanel({ onLoad, onClose }) {
  const [sims, setSims]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sb) return;
    sb.from('simulations')
      .select('id, name, created_at, config')
      .order('created_at', { ascending: false })
      .then(({ data }) => { setSims(data || []); setLoading(false); });
  }, []);

  const del = async (id, e) => {
    e.stopPropagation();
    await sb.from('simulations').delete().eq('id', id);
    setSims(s => s.filter(x => x.id !== id));
  };

  return (
    <Modal onClose={onClose} width={420}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: C.text }}>Mis simulaciones</h2>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: C.muted, lineHeight: 1 }}>×</button>
      </div>
      {loading && <p style={{ color: C.muted, fontSize: 13 }}>Cargando…</p>}
      {!loading && sims.length === 0 && (
        <p style={{ color: C.muted, fontSize: 13 }}>Aún no tienes simulaciones guardadas.<br/>
          Configura una hipoteca y pulsa <strong>Guardar</strong>.</p>
      )}
      {sims.map(s => (
        <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '11px 0', borderBottom: `1px solid ${C.border}` }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 2 }}>{s.name}</p>
            <p style={{ fontSize: 11, color: C.faint }}>
              €{fmt(s.config?.amt)} · {s.config?.yrs} años · {s.config?.type === 'fixed' ? 'fija' : s.config?.type === 'variable' ? 'variable' : 'mixta'}
              {' · '}{new Date(s.created_at).toLocaleDateString('es-ES')}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => { onLoad(s.id); onClose(); }}
              style={{ padding: '5px 11px', background: C.blueBg, color: C.blue, border: `1px solid ${C.blueBorder}`, borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
              Cargar
            </button>
            <button onClick={(e) => del(s.id, e)}
              style={{ padding: '5px 9px', background: C.redBg, color: C.red, border: `1px solid #FECACA`, borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
              ✕
            </button>
          </div>
        </div>
      ))}
    </Modal>
  );
}

// ─── TOOLTIPS RECHARTS ────────────────────────────────────────────────────────
const PayTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + (p.value || 0), 0);
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 13px', fontSize: 12, fontFamily: C.sans }}>
      <p style={{ fontWeight: 700, marginBottom: 5, color: C.text }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: €{p.value?.toLocaleString('es-ES')}
        </p>
      ))}
      <p style={{ color: C.muted, marginTop: 4, borderTop: `1px solid ${C.border}`, paddingTop: 4 }}>
        Total: €{total.toLocaleString('es-ES')}
      </p>
    </div>
  );
};

const EurTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const p = payload.find(x => x.value != null);
  if (!p) return null;
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 13px', fontSize: 12, fontFamily: C.sans }}>
      <p style={{ fontWeight: 700, color: C.text, marginBottom: 3 }}>{label}</p>
      <p style={{ color: p.color }}>{p.name}: {p.value?.toFixed(2)}%</p>
    </div>
  );
};

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function MortgageSimulator() {
  // Auth
  const [user, setUser]         = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showSims, setShowSims] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveMsg, setSaveMsg]   = useState('');

  // Euríbor
  const [euribor, setEuribor]     = useState(EUR_BASE);
  const [eurStatus, setEurStatus] = useState('Actualizando datos del BCE…');

  // Config hipoteca
  const [config, setConfig] = useState(() => {
    const defaults = {
      amt: 200000, yrs: 25, type: 'variable',
      fRate: 2.50, marg: 0.99, fYrs: 10,
      sy: 2019, sm: 1,
    };
    try {
      const saved = localStorage.getItem("joaco-hipoteca-config");
      return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    } catch { return defaults; }
  });
  useEffect(() => {
    try { localStorage.setItem("joaco-hipoteca-config", JSON.stringify(config)); } catch {}
  }, [config]);

  // Previsión Euríbor
  const initForecast = () => {
    const f = {};
    for (let i = 0; i <= 15; i++) f[NOW_Y + i] = i <= 1 ? 2.2 : i <= 3 ? 2.0 : 2.2;
    return f;
  };
  const [forecast, setForecast] = useState(() => {
    try {
      const saved = localStorage.getItem("joaco-hipoteca-forecast");
      return saved ? JSON.parse(saved) : initForecast();
    } catch { return initForecast(); }
  });
  useEffect(() => {
    try { localStorage.setItem("joaco-hipoteca-forecast", JSON.stringify(forecast)); } catch {}
  }, [forecast]);

  // Tabla
  const [page, setPage] = useState(0);
  const RPP = 12;

  // ── Init: auth + euríbor ────────────────────────────────────────────────
  useEffect(() => {
    // Auth
    if (sb) {
      sb.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
      const { data: { subscription } } = sb.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
      return () => subscription.unsubscribe();
    }
  }, []);

  useEffect(() => {
    fetchLatestEuribor().then(updates => {
      const count = Object.keys(updates).length;
      if (count > 0) {
        setEuribor(prev => ({ ...prev, ...updates }));
        const last = Object.keys(updates).sort().pop();
        setEurStatus(`Euríbor actualizado hasta ${last} (BCE)`);
      } else {
        setEurStatus('Datos locales (sin conexión al BCE)');
      }
    });
  }, []);

  // Ensure forecast covers mortgage duration
  useEffect(() => {
    const endY = config.sy + config.yrs + 1;
    setForecast(prev => {
      const next = { ...prev };
      for (let y = NOW_Y; y <= endY; y++) if (next[y] === undefined) next[y] = 2.2;
      return next;
    });
  }, [config.sy, config.yrs, config.sm]);

  const setC = useCallback((k, v) => setConfig(prev => ({ ...prev, [k]: v })), []);

  // ── Cálculo ─────────────────────────────────────────────────────────────
  const schedule = useMemo(
    () => buildSchedule(config, euribor, forecast),
    [config, euribor, forecast]
  );

  const metrics = useMemo(() => {
    if (!schedule.length) return null;
    const totalP = schedule.reduce((s, r) => s + r.pmt,  0);
    const totalI = schedule.reduce((s, r) => s + r.intr, 0);
    const paidI  = schedule.filter(r => r.past).reduce((s, r) => s + r.intr, 0);
    const todayR = schedule.find(r => r.yr === NOW_Y && r.mo === NOW_M)
                || schedule.find(r => !r.past)
                || schedule[schedule.length - 1];
    return {
      totalP, totalI, paidI, futureI: totalI - paidI,
      bal: todayR.bal, curPmt: todayR.pmt,
      e: todayR.e, rate: todayR.rate,
      amtPct: Math.round((1 - todayR.bal / config.amt) * 100),
    };
  }, [schedule, config.amt]);

  // ── Datos gráficos ───────────────────────────────────────────────────────
  const payChartData = useMemo(() => {
    const yd = {};
    schedule.forEach(r => {
      if (!yd[r.yr]) yd[r.yr] = { p: 0, i: 0 };
      yd[r.yr].p += r.prin; yd[r.yr].i += r.intr;
    });
    return Object.keys(yd).sort().map(y => ({
      year: y,
      Capital:    Math.round(yd[y].p),
      Intereses:  Math.round(yd[y].i),
      futureYear: +y > NOW_Y,
    }));
  }, [schedule]);

  const eurChartData = useMemo(() => {
    const yd = {};
    schedule.forEach(r => { if (!yd[r.yr]) yd[r.yr] = []; yd[r.yr].push(r.e); });
    return Object.keys(yd).sort().map(y => {
      const avg = +(yd[y].reduce((s,v)=>s+v,0)/yd[y].length).toFixed(3);
      const hist = +y <= NOW_Y;
      return {
        year:       y,
        Histórico:  hist ? avg : +y === NOW_Y ? avg : null,
        Previsión:  !hist ? avg : null,
      };
    });
  }, [schedule]);

  // ── Tabla ────────────────────────────────────────────────────────────────
  const totalPages = Math.ceil(schedule.length / RPP);
  const tableRows  = useMemo(() => schedule.slice(page*RPP, (page+1)*RPP), [schedule, page]);

  const jumpToday = () => {
    const idx = schedule.findIndex(r => r.yr === NOW_Y && r.mo === NOW_M);
    if (idx >= 0) setPage(Math.floor(idx / RPP));
  };

  // ── Escenarios previsión ─────────────────────────────────────────────────
  const applyScenario = (sc) => {
    const endY = config.sy + config.yrs + 1;
    const fns = {
      drop:   (_, i) => Math.max(0.5, 2.3 - i * 0.12),
      flat:   ()     => 2.0,
      rise:   (_, i) => Math.min(5.5, 2.3 + i * 0.15),
      stress: (_, i) => i < 3 ? 2.3 + i * 0.9 : 5.5,
    };
    const fn = fns[sc];
    const next = {};
    let i = 0;
    for (let y = NOW_Y; y <= endY; y++) next[y] = +fn(y, i++).toFixed(1);
    setForecast(prev => ({ ...prev, ...next }));
  };

  const forecastYears = Object.keys(forecast)
    .map(Number).sort()
    .filter(y => y >= NOW_Y && y <= config.sy + config.yrs + 1);

  // ── Guardar simulación ───────────────────────────────────────────────────
  const saveSimulation = async () => {
    if (!sb || !user) { setShowAuth(true); setShowSave(false); return; }
    setSaveMsg('Guardando…');
    const name = saveName.trim() || `Hipoteca ${fmt(config.amt)}€ · ${config.yrs}a · ${new Date().toLocaleDateString('es-ES')}`;
    const { error } = await sb.from('simulations').insert([{
      user_id: user.id, name, config, forecast,
    }]);
    setSaveMsg(error ? `Error: ${error.message}` : '✓ Guardado correctamente');
    setTimeout(() => { setSaveMsg(''); setShowSave(false); setSaveName(''); }, 2200);
  };

  const loadSimulation = async (id) => {
    if (!sb) return;
    const { data } = await sb.from('simulations').select('config, forecast').eq('id', id).single();
    if (data) { setConfig(data.config); setForecast(data.forecast); setPage(0); }
  };

  const type = config.type;

  // ── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: C.sans, background: C.bg, minHeight: '100vh', padding: '1.5rem 1.25rem', color: C.text }}>

      {/* ── Modals ── */}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onAuth={setUser} />}
      {showSims && <SimsPanel onLoad={loadSimulation} onClose={() => setShowSims(false)} />}
      {showSave && (
        <Modal onClose={() => setShowSave(false)} width={360}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: '1rem' }}>
            Guardar simulación
          </h3>
          <label style={lbl}>Nombre</label>
          <input value={saveName} onChange={e => setSaveName(e.target.value)}
            placeholder={`Hipoteca ${fmt(config.amt)}€ · ${config.yrs} años`}
            style={{ ...inp, marginBottom: 14 }}
            onKeyDown={e => e.key === 'Enter' && saveSimulation()} />
          {saveMsg && (
            <p style={{ color: saveMsg.startsWith('✓') ? C.green : C.red, fontSize: 13, marginBottom: 10 }}>
              {saveMsg}
            </p>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowSave(false)} style={{ ...btn, flex: 1 }}>Cancelar</button>
            <button onClick={saveSimulation} style={{ ...btnPr, flex: 1 }}>Guardar</button>
          </div>
        </Modal>
      )}

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                    marginBottom: '1.25rem', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 2 }}>
            Simulador Hipotecario España
          </h1>
          <p style={{ fontSize: 11, color: C.faint }}>{eurStatus}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {SUPABASE_READY ? (
            user ? (
              <>
                <span style={{ fontSize: 12, color: C.muted }}>{user.email}</span>
                <button onClick={() => setShowSims(true)} style={btn}>Mis simulaciones</button>
                <button onClick={() => setShowSave(true)} style={btnPr}>Guardar</button>
                <button onClick={() => sb.auth.signOut()}
                  style={{ ...btn, color: C.red, borderColor: '#FECACA', background: C.redBg }}>
                  Salir
                </button>
              </>
            ) : (
              <>
                <button onClick={() => { setShowSims(true); }}
                  style={{ ...btn, fontSize: 12 }}>Mis simulaciones</button>
                <button onClick={() => setShowAuth(true)} style={btnPr}>
                  Iniciar sesión / Registrarse
                </button>
              </>
            )
          ) : (
            <span style={{ fontSize: 11, color: C.amber, background: '#FFFBEB', border: '1px solid #FDE68A',
              borderRadius: 6, padding: '4px 10px' }}>
              ⚠ Configura Supabase para activar cuentas de usuario
            </span>
          )}
        </div>
      </div>

      {/* ── Configuración ── */}
      <div style={card}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(165px, 1fr))', gap: 12, alignItems: 'end' }}>
          <div>
            <label style={lbl}>Capital (€)</label>
            <input type="number" value={config.amt}
              onChange={e => setC('amt', Math.max(1000, +e.target.value))}
              min={10000} max={2000000} step={5000} style={inp} />
          </div>
          <div>
            <label style={lbl}>Plazo (años)</label>
            <input type="number" value={config.yrs}
              onChange={e => setC('yrs', Math.max(1, Math.min(40, +e.target.value)))}
              min={5} max={40} style={inp} />
          </div>
          <div>
            <label style={lbl}>Fecha inicio</label>
            <input type="month" value={dk(config.sy, config.sm)}
              onChange={e => { const [y,m] = e.target.value.split('-').map(Number); setC('sy',y); setC('sm',m); }}
              style={inp} />
          </div>
          <div>
            <label style={lbl}>Tipo hipoteca</label>
            <select value={type} onChange={e => setC('type', e.target.value)} style={inp}>
              <option value="variable">Variable (Euríbor + diferencial)</option>
              <option value="fixed">Fija</option>
              <option value="mixed">Mixta (fija luego variable)</option>
            </select>
          </div>
          {type !== 'fixed' && (
            <div>
              <label style={lbl}>Diferencial (%)</label>
              <input type="number" value={config.marg}
                onChange={e => setC('marg', +e.target.value)}
                min={0} max={5} step={0.01} style={inp} />
            </div>
          )}
          {type !== 'variable' && (
            <div>
              <label style={lbl}>Tipo fijo (%)</label>
              <input type="number" value={config.fRate}
                onChange={e => setC('fRate', +e.target.value)}
                min={0.1} max={10} step={0.01} style={inp} />
            </div>
          )}
          {type === 'mixed' && (
            <div>
              <label style={lbl}>Años período fijo</label>
              <input type="number" value={config.fYrs}
                onChange={e => setC('fYrs', Math.max(1, +e.target.value))}
                min={1} max={20} style={inp} />
            </div>
          )}
        </div>
      </div>

      {/* ── Métricas ── */}
      {metrics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 10, marginBottom: '1rem' }}>
          {[
            {
              label: 'Total a pagar',
              val: `€${fmt(metrics.totalP)}`,
              sub: `${Math.round(metrics.totalI / metrics.totalP * 100)}% del total en intereses`,
            },
            {
              label: 'Total intereses',
              val: `€${fmt(metrics.totalI)}`,
              sub: `pagados €${fmt(metrics.paidI)}  ·  pendientes €${fmt(metrics.futureI)}`,
              vc: C.red,
            },
            {
              label: 'Capital pendiente hoy',
              val: `€${fmt(metrics.bal)}`,
              sub: `${metrics.amtPct}% amortizado del capital`,
              vc: C.green,
            },
            {
              label: 'Cuota mensual actual',
              val: `€${fmt(metrics.curPmt)}`,
              sub: type === 'fixed'
                ? `Tipo fijo ${config.fRate.toFixed(2)}%`
                : `Euríbor ${metrics.e.toFixed(2)}% + ${config.marg.toFixed(2)}% = ${metrics.rate.toFixed(2)}%`,
            },
          ].map(({ label, val, sub, vc }) => (
            <div key={label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '0.9rem 1rem' }}>
              <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 5 }}>
                {label}
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, fontFamily: C.mono, color: vc || C.text, marginBottom: 4 }}>
                {val}
              </div>
              <div style={{ fontSize: 11, color: C.faint, lineHeight: 1.4 }}>{sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Gráficos ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: '1rem' }}>
        {/* Desglose anual */}
        <div style={{ ...card, marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Desglose anual de pagos</p>
            <div style={{ display: 'flex', gap: 12, fontSize: 11, color: C.muted }}>
              <span><span style={{ display:'inline-block', width:9, height:9, borderRadius:2, background:C.green, marginRight:3 }}/>Capital</span>
              <span><span style={{ display:'inline-block', width:9, height:9, borderRadius:2, background:C.red, marginRight:3 }}/>Intereses</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={payChartData} barCategoryGap="22%">
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 10, fill: C.faint }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: C.faint }} tickLine={false} axisLine={false}
                tickFormatter={v => v >= 1000 ? `${Math.round(v/1000)}k` : v} />
              <Tooltip content={<PayTooltip />} />
              <Bar dataKey="Capital"   stackId="s" fill={C.green} />
              <Bar dataKey="Intereses" stackId="s" fill={C.red}   radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Euríbor */}
        <div style={{ ...card, marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Euríbor 12M (media anual)</p>
            <div style={{ display: 'flex', gap: 12, fontSize: 11, color: C.muted }}>
              <span><span style={{ display:'inline-block', width:9, height:9, borderRadius:2, background:C.blue, marginRight:3 }}/>Histórico</span>
              <span><span style={{ display:'inline-block', width:9, height:9, borderRadius:2, background:C.amber, marginRight:3, outline:`1px dashed ${C.amber}` }}/>Previsión</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={eurChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 10, fill: C.faint }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: C.faint }} tickLine={false} axisLine={false}
                tickFormatter={v => v.toFixed(1)+'%'} />
              <Tooltip content={<EurTooltip />} />
              <Line type="monotone" dataKey="Histórico" stroke={C.blue}  strokeWidth={2} dot={false} connectNulls={false} />
              <Line type="monotone" dataKey="Previsión"  stroke={C.amber} strokeWidth={2}
                strokeDasharray="5 3" dot={{ r:2, fill:C.amber }} connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Previsión Euríbor ── */}
      <div style={card}>
        <p style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: '0.5rem' }}>
          Previsión del Euríbor — ajusta tu escenario
        </p>
        <p style={{ fontSize: 12, color: C.muted, marginBottom: '0.75rem' }}>
          Los meses futuros de la simulación variable/mixta usan estos valores anuales.
        </p>
        <div style={{ display: 'flex', gap: 8, marginBottom: '0.9rem', flexWrap: 'wrap' }}>
          {[
            ['drop',   '📉 Bajada gradual'],
            ['flat',   '→ Estabilización ~2%'],
            ['rise',   '📈 Subida prolongada'],
            ['stress', '⚠ Escenario adverso'],
          ].map(([k, l]) => (
            <button key={k} onClick={() => applyScenario(k)} style={{ ...btn, fontSize: 12 }}>{l}</button>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(195px, 1fr))', gap: 6 }}>
          {forecastYears.map(y => (
            <div key={y} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: C.muted, minWidth: 36, fontFamily: C.mono }}>{y}</span>
              <input type="range" min="-1" max="7" step="0.1"
                value={forecast[y] ?? 2.2}
                onChange={e => setForecast(prev => ({ ...prev, [y]: +e.target.value }))}
                style={{ flex: 1 }} />
              <span style={{ fontSize: 11, fontFamily: C.mono, minWidth: 38, textAlign: 'right', color: C.text }}>
                {(forecast[y] ?? 2.2).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabla de amortización ── */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      marginBottom: '0.75rem', flexWrap: 'wrap', gap: 8 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Tabla de amortización</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={jumpToday} style={{ ...btn, fontSize: 11, color: C.muted }}>Ir a hoy</button>
            <button onClick={() => setPage(p => Math.max(0, p-1))} disabled={page === 0} style={btn}>← Ant.</button>
            <span style={{ fontSize: 12, color: C.muted, whiteSpace: 'nowrap' }}>
              Meses {page*RPP+1}–{Math.min((page+1)*RPP, schedule.length)} de {schedule.length}
            </span>
            <button onClick={() => setPage(p => Math.min(totalPages-1, p+1))} disabled={page >= totalPages-1} style={btn}>Sig. →</button>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                {['Período','Cuota','Capital','Intereses','Pendiente','Euríbor','Tipo aplic.'].map((h, i) => (
                  <th key={h} style={{ textAlign: i === 0 ? 'left' : 'right', padding: '7px 6px',
                    color: C.muted, fontWeight: 600, borderBottom: `1px solid ${C.border}`,
                    fontSize: 11, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.map(r => {
                const isToday = r.yr === NOW_Y && r.mo === NOW_M;
                const isFuture = !r.past;
                const textColor = isToday ? C.blue : isFuture ? C.text : C.faint;
                const mono = { fontFamily: C.mono, fontSize: 11 };
                return (
                  <tr key={r.m} style={{ background: isToday ? C.blueBg : 'transparent' }}>
                    <td style={{ padding: '5px 6px', borderBottom: `1px solid ${C.border}`, color: textColor, fontWeight: isToday ? 700 : 400 }}>
                      {MONTHS[r.mo-1]} {r.yr}{isToday ? ' ◀' : ''}
                    </td>
                    <td style={{ ...mono, padding:'5px 6px', borderBottom:`1px solid ${C.border}`, textAlign:'right', color: textColor }}>€{fmt(r.pmt)}</td>
                    <td style={{ ...mono, padding:'5px 6px', borderBottom:`1px solid ${C.border}`, textAlign:'right', color: C.green }}>€{fmt(r.prin)}</td>
                    <td style={{ ...mono, padding:'5px 6px', borderBottom:`1px solid ${C.border}`, textAlign:'right', color: C.red }}>€{fmt(r.intr)}</td>
                    <td style={{ ...mono, padding:'5px 6px', borderBottom:`1px solid ${C.border}`, textAlign:'right', color: textColor }}>€{fmt(r.bal)}</td>
                    <td style={{ ...mono, padding:'5px 6px', borderBottom:`1px solid ${C.border}`, textAlign:'right', color: textColor }}>{r.e.toFixed(2)}%</td>
                    <td style={{ ...mono, padding:'5px 6px', borderBottom:`1px solid ${C.border}`, textAlign:'right', color: textColor }}>{r.rate.toFixed(2)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <p style={{ textAlign: 'center', fontSize: 11, color: C.faint, marginTop: '0.5rem' }}>
        Datos del Euríbor: Banco Central Europeo (BCE) · Cálculo por amortización francesa con revisión anual
      </p>
    </div>
  );
}
