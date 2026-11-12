import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  CATALOG, CATEGORIES, DEFAULT_SETTINGS, USAGE_LABEL, addDays, addMonths, buildAlerts, buildCsv, buildIcs,
  chargesPerYear, daysBetween, eur, fmtDate, forecast, isIso, monthLabel, myCharge, nextRenewal, perMonth, perYear,
  periodText, sampleData, sanitize, toEUR, todayIso,
  type Alert, type Currency, type Level, type Settings, type Status, type Sub, type Unit,
} from "./suscripciones-core";

/* ============================================================
   SUSCRIPCIONES
   Registro de suscripciones con avisos de renovación, totales,
   calendario de cargos y comparativas. Los datos se guardan solo
   en este navegador (localStorage); no hay servidor ni cuentas.
   ============================================================ */

const KEY = "joaco-suscripciones-v1";
type Store = { subs: Sub[]; settings: Settings };
type Tab = "resumen" | "lista" | "avisos" | "comparar" | "guia";

function load(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return parseStore(JSON.parse(raw));
  } catch { /* sin almacenamiento o dato corrupto */ }
  return { subs: [], settings: DEFAULT_SETTINGS };
}
function parseStore(o: any): Store {
  const today = todayIso();
  const list = Array.isArray(o) ? o : Array.isArray(o?.subs) ? o.subs : [];
  const subs = list.map((x: any) => sanitize(x, today)).filter(Boolean) as Sub[];
  const fx = o?.settings?.fx || {};
  return {
    subs,
    settings: {
      fx: { USD: Number(fx.USD) > 0 ? Number(fx.USD) : DEFAULT_SETTINGS.fx.USD, GBP: Number(fx.GBP) > 0 ? Number(fx.GBP) : DEFAULT_SETTINGS.fx.GBP },
      reviewMonths: Number(o?.settings?.reviewMonths) > 0 ? Number(o.settings.reviewMonths) : DEFAULT_SETTINGS.reviewMonths,
    },
  };
}
function download(name: string, text: string, mime: string) {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement("a");
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
const newId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const blank = (today: string): Sub => ({
  id: "", name: "", category: "Otros", amount: 0, currency: "EUR", every: 1, unit: "month", anchor: today, start: today,
  status: "activa", pay: "", owner: "", share: 1, usage: 2, remind: 7, history: [],
});

const LEVEL_META: Record<Level, { label: string; icon: string; cls: string }> = {
  urgente: { label: "Urgente", icon: "▲", cls: "lv-urg" },
  pronto: { label: "Pronto", icon: "●", cls: "lv-pro" },
  revisar: { label: "Para revisar", icon: "◆", cls: "lv-rev" },
  info: { label: "Recordatorio", icon: "○", cls: "lv-inf" },
};
const STATUS_LABEL: Record<Status, string> = { activa: "Activa", prueba: "En prueba", pausada: "Pausada", cancelada: "Cancelada" };
// Uso: una sola tinta de clara a oscura (más oscuro = más uso). Siempre va con su etiqueta escrita.
const USAGE_COLOR = ["#b9c3cf", "#8fb4e3", "#4b8fdc", "#1b5aa8"];

export default function Suscripciones() {
  const [store, setStore] = useState<Store>(load);
  const [tab, setTab] = useState<Tab>("resumen");
  const [editing, setEditing] = useState<Sub | null>(null);
  const [saveError, setSaveError] = useState(false);
  const today = todayIso();
  const { subs, settings } = store;

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(store)); setSaveError(false); } catch { setSaveError(true); }
  }, [store]);
  useEffect(() => { const t = document.title; document.title = "Suscripciones · joaco.org"; return () => { document.title = t; }; }, []);

  const active = useMemo(() => subs.filter(s => s.status === "activa"), [subs]);
  const alerts = useMemo(() => buildAlerts(subs, settings, today), [subs, settings, today]);
  const urgent = alerts.filter(a => a.level === "urgente" || a.level === "pronto").length;

  const upsert = (s: Sub) => setStore(st => {
    const prev = st.subs.find(x => x.id === s.id);
    let next = { ...s };
    if (!prev) { next.id = newId(); next.history = [{ date: isIso(next.start) ? next.start : today, amount: next.amount }]; }
    else if (prev.amount !== next.amount) next.history = [...(prev.history || []), { date: today, amount: next.amount }];
    if (next.status === "cancelada" && !next.cancelledOn) next.cancelledOn = today;
    if (next.status !== "cancelada") next.cancelledOn = undefined;
    return { ...st, subs: prev ? st.subs.map(x => (x.id === s.id ? next : x)) : [...st.subs, next] };
  });
  const patch = (id: string, p: Partial<Sub>) => setStore(st => ({ ...st, subs: st.subs.map(x => (x.id === id ? { ...x, ...p } : x)) }));
  const remove = (id: string) => setStore(st => ({ ...st, subs: st.subs.filter(x => x.id !== id) }));
  const openSub = (id: string) => { const s = subs.find(x => x.id === id); if (s) setEditing(s); };

  const TABS: [Tab, string][] = [["resumen", "Resumen"], ["lista", "Lista"], ["avisos", "Avisos"], ["comparar", "Comparar"], ["guia", "Guía"]];

  return (
    <div className="sx">
      <style>{CSS}</style>
      <header className="sx-head">
        <div>
          <h1>Suscripciones</h1>
          <p className="sx-lede">Todo lo que pagas de forma recurrente, en un sitio: cuánto suma, cuándo se renueva y qué sobra.</p>
        </div>
        <button className="btn primary" onClick={() => setEditing(blank(today))}>+ Añadir</button>
      </header>
      <nav className="sx-tabs" role="tablist" aria-label="Secciones">
        {TABS.map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? "on" : ""} onClick={() => setTab(id)}>
            {label}{id === "avisos" && urgent > 0 && <span className="badge" aria-label={`${urgent} avisos próximos`}>{urgent}</span>}
          </button>
        ))}
      </nav>
      {saveError && <p className="note warn">No se han podido guardar los cambios en este navegador (almacenamiento lleno o bloqueado, por ejemplo en navegación privada). Exporta una copia desde Guía antes de cerrar.</p>}

      <main className="sx-main">
        {subs.length === 0 && tab !== "guia" ? (
          <Empty onAdd={() => setEditing(blank(today))} onSample={() => setStore(st => ({ ...st, subs: sampleData(today) }))} onGuide={() => setTab("guia")} />
        ) : (
          <>
            {tab === "resumen" && <Resumen subs={subs} active={active} settings={settings} today={today} alerts={alerts} goAlerts={() => setTab("avisos")} open={openSub} />}
            {tab === "lista" && <Lista subs={subs} settings={settings} today={today} onEdit={setEditing} patch={patch} />}
            {tab === "avisos" && <Avisos subs={subs} settings={settings} today={today} alerts={alerts} open={openSub} patch={patch} />}
            {tab === "comparar" && <Comparar subs={subs} active={active} settings={settings} />}
            {tab === "guia" && <Guia store={store} setStore={setStore} today={today} />}
          </>
        )}
      </main>
      <footer className="sx-foot">Los datos se guardan solo en este navegador. Importes en euros; lo que pagas en otra moneda se convierte con el tipo de cambio de Guía → Ajustes.</footer>

      {editing && <Form initial={editing} today={today} onClose={() => setEditing(null)}
        onSave={s => { upsert(s); setEditing(null); }} onDelete={id => { remove(id); setEditing(null); }} />}
    </div>
  );
}

// ---------- Vacío ----------
function Empty({ onAdd, onSample, onGuide }: { onAdd: () => void; onSample: () => void; onGuide: () => void }) {
  return (
    <section className="card empty">
      <h2>Empieza por apuntar la primera</h2>
      <p>Con nombre, importe, periodicidad y próxima fecha de cargo ya tienes totales y avisos. Lo demás (uso, medio de pago, plan anual) afina las comparativas y puedes rellenarlo después.</p>
      <p className="muted">Truco: abre el extracto del banco y de la tarjeta de los últimos 12 meses y busca cargos que se repiten; las anuales son las que más se olvidan.</p>
      <div className="row">
        <button className="btn primary" onClick={onAdd}>+ Añadir suscripción</button>
        <button className="btn" onClick={onSample}>Ver con datos de ejemplo</button>
        <button className="btn ghost" onClick={onGuide}>Cómo funciona</button>
      </div>
    </section>
  );
}

// ---------- Piezas ----------
function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return <div className="stat"><div className="stat-l">{label}</div><div className="stat-v">{value}</div>{hint && <div className="stat-h">{hint}</div>}</div>;
}
function HBars({ rows, unit }: { rows: { key: string; label: string; value: number; color?: string; sub?: string; onClick?: () => void }[]; unit?: string }) {
  const max = Math.max(1e-9, ...rows.map(r => r.value));
  return (
    <div className="hbars" role="list">
      {rows.map(r => (
        <div className={"hbar" + (r.onClick ? " click" : "")} role="listitem" key={r.key} onClick={r.onClick}
          title={`${r.label}: ${eur(r.value)}${unit || ""}${r.sub ? " · " + r.sub : ""}`}>
          <div className="hbar-top"><span className="hbar-l">{r.label}{r.sub && <em> · {r.sub}</em>}</span><span className="hbar-v">{eur(r.value)}</span></div>
          <div className="hbar-track"><div className="hbar-fill" style={{ width: `${Math.max(1.5, (r.value / max) * 100)}%`, background: r.color || "var(--s1)" }} /></div>
        </div>
      ))}
    </div>
  );
}
function AlertRow({ a, open }: { a: Alert; open: (id: string) => void }) {
  const m = LEVEL_META[a.level];
  return (
    <button className={"alert " + m.cls} onClick={() => open(a.subId)}>
      <span className="alert-ic" aria-hidden="true">{m.icon}</span>
      <span className="alert-body"><span className="alert-lv">{m.label}</span><strong>{a.title}</strong><span>{a.detail}</span></span>
    </button>
  );
}

// ---------- Resumen ----------
function Resumen({ subs, active, settings, today, alerts, goAlerts, open }: { subs: Sub[]; active: Sub[]; settings: Settings; today: string; alerts: Alert[]; goAlerts: () => void; open: (id: string) => void }) {
  const month = active.reduce((a, s) => a + perMonth(s, settings), 0);
  const year = month * 12;
  const trials = subs.filter(s => s.status === "prueba");
  const trialYear = trials.reduce((a, s) => a + perYear(s, settings), 0);
  const saved = subs.filter(s => s.status === "cancelada").reduce((a, s) => a + perYear(s, settings), 0);
  const cats = useMemo(() => {
    const m = new Map<string, { v: number; n: number }>();
    for (const s of active) { const c = m.get(s.category) || { v: 0, n: 0 }; c.v += perMonth(s, settings); c.n++; m.set(s.category, c); }
    return [...m].map(([k, c]) => ({ key: k, label: k, value: c.v, sub: `${c.n} ${c.n === 1 ? "suscripción" : "suscripciones"} · ${month > 0 ? Math.round((c.v / month) * 100) : 0} %` })).sort((a, b) => b.value - a.value);
  }, [active, settings, month]);
  const fc = useMemo(() => forecast(subs, settings, today, 12, true), [subs, settings, today]);
  const upcoming = useMemo(() => subs.map(s => ({ s, d: nextRenewal(s, today) })).filter(x => x.d).sort((a, b) => a.d!.localeCompare(b.d!)).slice(0, 6), [subs, today]);
  const top = alerts.slice(0, 3);
  const in30 = fc.flatMap(b => b.items).filter(i => daysBetween(today, i.date) < 30).reduce((a, i) => a + i.amount, 0);

  return (
    <>
      <section className="stats">
        <Stat label="Al mes" value={eur(month)} hint="Promedio: las anuales repartidas en 12" />
        <Stat label="Al año" value={eur(year)} hint={`${eur(year / 365)} al día`} />
        <Stat label="Activas" value={String(active.length)} hint={trials.length ? `+ ${trials.length} en prueba` : `${subs.length} apuntadas en total`} />
        <Stat label="Próximos 30 días" value={eur(in30)} hint="Cargos reales previstos" />
      </section>
      {(trialYear > 0 || saved > 0) && (
        <p className="note">
          {trialYear > 0 && <>Si no cancelas las pruebas en curso, el total anual sube en <strong>{eur(trialYear)}</strong>. </>}
          {saved > 0 && <>Con lo que ya has cancelado te ahorras <strong>{eur(saved)}</strong> al año.</>}
        </p>
      )}

      {top.length > 0 && (
        <section className="card">
          <div className="card-h"><h2>Avisos</h2><button className="link" onClick={goAlerts}>Ver los {alerts.length}</button></div>
          <div className="alerts">{top.map((a, i) => <AlertRow key={i} a={a} open={open} />)}</div>
        </section>
      )}

      <section className="card">
        <h2>Próximos cargos</h2>
        <ul className="next">
          {upcoming.map(({ s, d }) => {
            const n = daysBetween(today, d!);
            return (
              <li key={s.id}><button onClick={() => open(s.id)}>
                <span className="next-d"><b>{fmtDate(d!, false)}</b><i>{n === 0 ? "hoy" : n === 1 ? "mañana" : `en ${n} días`}</i></span>
                <span className="next-n">{s.name}<i>{s.status === "prueba" ? "fin de prueba · " : ""}{periodText(s)}{s.pay ? " · " + s.pay : ""}</i></span>
                <span className="next-a">{eur(myCharge(s, settings))}</span>
              </button></li>
            );
          })}
          {upcoming.length === 0 && <li className="muted pad">Ninguna suscripción activa tiene fecha de renovación.</li>}
        </ul>
      </section>

      <section className="card">
        <h2>Gasto mensual por categoría</h2>
        <p className="legend">Cómo leerlo: cada barra es lo que te cuesta esa categoría en un mes medio (activas, tu parte, en euros). El porcentaje es su peso sobre el total. Ordenado de más a menos.</p>
        {cats.length ? <HBars rows={cats} unit=" al mes" /> : <p className="muted">No hay suscripciones activas.</p>}
      </section>

      <Forecast fc={fc} avg={month} />
    </>
  );
}

function Forecast({ fc, avg }: { fc: ReturnType<typeof forecast>; avg: number }) {
  const [sel, setSel] = useState(0);
  const max = Math.max(avg, ...fc.map(b => b.total), 1e-9);
  const peak = fc.reduce((a, b, i) => (b.total > fc[a].total ? i : a), 0);
  const b = fc[sel];
  return (
    <section className="card">
      <h2>Calendario de cargos: próximos 12 meses</h2>
      <p className="legend">Cómo leerlo: cada columna es lo que te cobrarán de verdad ese mes (el mes actual, solo lo que queda desde hoy). La línea discontinua es tu gasto mensual medio. Las columnas que la superan son meses con renovaciones anuales: conviene tenerlos previstos. Incluye las pruebas, suponiendo que no las cancelas. Toca un mes para ver sus cargos.</p>
      <div className="cols" role="group" aria-label="Cargos por mes">
        <div className="cols-avg" style={{ bottom: `calc(22px + ${(avg / max) * 100}% * 0.86)` }}><span>media {eur(avg)}</span></div>
        {fc.map((m, i) => (
          <button key={m.ym} className={"col" + (i === sel ? " on" : "")} onClick={() => setSel(i)} aria-pressed={i === sel}
            aria-label={`${monthLabel(m.ym)}: ${eur(m.total)}`} title={`${monthLabel(m.ym)}: ${eur(m.total)} en ${m.items.length} cargos`}>
            <span className="col-v">{i === sel || i === peak ? eur(m.total).replace(/,\d\d/, "") : ""}</span>
            <span className="col-bar" style={{ height: `${(m.total / max) * 86}%` }} />
            <span className="col-x">{monthLabel(m.ym).split(" ")[0]}</span>
          </button>
        ))}
      </div>
      <div className="key"><span><i className="sw" />Cargos previstos del mes</span><span><i className="sw dash" />Gasto mensual medio</span></div>
      <div className="month">
        <h3>{monthLabel(b.ym)}: {eur(b.total)}</h3>
        {b.items.length === 0 ? <p className="muted">Sin cargos previstos.</p> : (
          <table className="tbl"><tbody>{b.items.map((it, i) => <tr key={i}><td>{fmtDate(it.date, false)}</td><td>{it.name}</td><td className="num">{eur(it.amount)}</td></tr>)}</tbody></table>
        )}
      </div>
    </section>
  );
}

// ---------- Lista ----------
function Lista({ subs, settings, today, onEdit, patch }: { subs: Sub[]; settings: Settings; today: string; onEdit: (s: Sub) => void; patch: (id: string, p: Partial<Sub>) => void }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"todas" | Status>("todas");
  const [sort, setSort] = useState<"fecha" | "coste" | "nombre" | "categoria">("fecha");
  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = subs.filter(s => (status === "todas" || s.status === status) && (!needle || [s.name, s.category, s.pay, s.owner, s.notes || ""].join(" ").toLowerCase().includes(needle)));
    const nx = (s: Sub) => nextRenewal(s, today) || "9999";
    return list.sort((a, b) => sort === "coste" ? perYear(b, settings) - perYear(a, settings) : sort === "nombre" ? a.name.localeCompare(b.name, "es") : sort === "categoria" ? a.category.localeCompare(b.category, "es") || a.name.localeCompare(b.name, "es") : nx(a).localeCompare(nx(b)));
  }, [subs, q, status, sort, settings, today]);
  const total = rows.filter(s => s.status === "activa").reduce((a, s) => a + perMonth(s, settings), 0);
  return (
    <>
      <div className="filters">
        <input type="search" placeholder="Buscar por nombre, categoría, medio de pago…" value={q} onChange={e => setQ(e.target.value)} aria-label="Buscar" />
        <select value={status} onChange={e => setStatus(e.target.value as any)} aria-label="Estado">
          <option value="todas">Todos</option>{(Object.keys(STATUS_LABEL) as Status[]).map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
        <select value={sort} onChange={e => setSort(e.target.value as any)} aria-label="Orden">
          <option value="fecha">Por fecha</option><option value="coste">Más caras</option><option value="nombre">Por nombre</option><option value="categoria">Por categoría</option>
        </select>
      </div>
      <p className="muted small">{rows.length} de {subs.length} · las activas de esta lista suman {eur(total)} al mes</p>
      <div className="list">
        {rows.map(s => {
          const d = nextRenewal(s, today);
          const n = d ? daysBetween(today, d) : null;
          return (
            <article key={s.id} className={"sub st-" + s.status}>
              <button className="sub-main" onClick={() => onEdit(s)} aria-label={`Editar ${s.name}`}>
                <span className="sub-t"><strong>{s.name}</strong><i>{s.category}{s.owner ? " · " + s.owner : ""}{s.share > 1 ? ` · entre ${s.share}` : ""}</i></span>
                <span className="sub-c"><strong>{eur(perMonth(s, settings))}</strong><i>al mes</i></span>
              </button>
              <div className="sub-meta">
                <span className={"chip c-" + s.status}>{STATUS_LABEL[s.status]}</span>
                <span className="chip">{s.amount.toLocaleString("es-ES")} {s.currency} · {periodText(s)}</span>
                {d && <span className={"chip" + (n! <= s.remind ? " c-soon" : "")}>{s.status === "prueba" ? "Fin de prueba" : "Renueva"} {fmtDate(d)}{n! <= 31 ? ` (${n === 0 ? "hoy" : n + " d"})` : ""}</span>}
                <span className="chip"><i className="dot" style={{ background: USAGE_COLOR[s.usage] }} />Uso {USAGE_LABEL[s.usage].toLowerCase()}</span>
                {s.pay && <span className="chip">{s.pay}</span>}
              </div>
              <div className="sub-act">
                {s.status !== "cancelada" && <button className="link" onClick={() => patch(s.id, { reviewed: today })}>{s.reviewed === today ? "✓ Revisada hoy" : "Marcar revisada"}</button>}
                {s.status === "prueba" && <button className="link" onClick={() => patch(s.id, { status: "activa", anchor: isIso(s.trialEnd) ? s.trialEnd : s.anchor })}>Me la quedo</button>}
                {s.status !== "cancelada" ? <button className="link" onClick={() => patch(s.id, { status: "cancelada", cancelledOn: today })}>Dar de baja</button>
                  : <button className="link" onClick={() => patch(s.id, { status: "activa", cancelledOn: undefined })}>Reactivar</button>}
                {s.url && <a className="link" href={/^https?:\/\//i.test(s.url) ? s.url : "https://" + s.url} target="_blank" rel="noopener noreferrer">Gestionar ↗</a>}
              </div>
            </article>
          );
        })}
        {rows.length === 0 && <p className="muted pad">Nada coincide con ese filtro.</p>}
      </div>
    </>
  );
}

// ---------- Avisos ----------
function Avisos({ subs, settings, today, alerts, open, patch }: { subs: Sub[]; settings: Settings; today: string; alerts: Alert[]; open: (id: string) => void; patch: (id: string, p: Partial<Sub>) => void }) {
  const levels: Level[] = ["urgente", "pronto", "revisar", "info"];
  const exportIcs = () => download("suscripciones.ics", buildIcs(subs, settings, today), "text/calendar;charset=utf-8");
  const reviewAll = () => alerts.filter(a => a.kind === "revision").forEach(a => patch(a.subId, { reviewed: today }));
  return (
    <>
      <section className="card">
        <h2>Avisos en el móvil</h2>
        <p>Esta página no puede enviarte notificaciones cuando está cerrada. Para que el teléfono te avise solo, descarga el calendario: crea un evento por suscripción en su fecha de renovación, repetido con su periodicidad y con una alarma a las 9:00 los días de antelación que hayas puesto en cada una.</p>
        <div className="row"><button className="btn primary" onClick={exportIcs}>Descargar calendario (.ics)</button></div>
        <p className="muted small">En iPhone se abre en Calendario y pregunta dónde añadirlo. Si cambias fechas o importes, borra ese calendario y vuelve a descargarlo: no se actualiza solo.</p>
      </section>
      {alerts.length === 0 && <p className="note ok">Nada pendiente: sin renovaciones cercanas, pruebas a punto de acabar ni suscripciones sin revisar.</p>}
      {levels.map(lv => {
        const list = alerts.filter(a => a.level === lv);
        if (!list.length) return null;
        return (
          <section className="card" key={lv}>
            <div className="card-h"><h2>{LEVEL_META[lv].label} <span className="count">{list.length}</span></h2>
              {lv === "info" && list.some(a => a.kind === "revision") && <button className="link" onClick={reviewAll}>Marcar todas revisadas</button>}</div>
            <p className="legend">{LEVEL_EXPLAIN[lv]}</p>
            <div className="alerts">{list.map((a, i) => <AlertRow key={i} a={a} open={open} />)}</div>
          </section>
        );
      })}
    </>
  );
}
const LEVEL_EXPLAIN: Record<Level, string> = {
  urgente: "Cargo en dos días o menos, o prueba que termina en tres o ya ha vencido. Si vas a cancelar, es ahora.",
  pronto: "Renovación dentro del plazo de aviso de cada suscripción, anuales a menos de 45 días y permanencias que acaban este mes.",
  revisar: "No hay fecha límite, pero hay dinero en juego: poco uso, subidas de precio, varias del mismo tipo a la vez o datos que faltan.",
  info: "Suscripciones que llevan meses sin revisar y permanencias ya terminadas.",
};

// ---------- Comparativas ----------
function Comparar({ subs, active, settings }: { subs: Sub[]; active: Sub[]; settings: Settings }) {
  const [cut, setCut] = useState<Set<string>>(new Set());
  const month = active.reduce((a, s) => a + perMonth(s, settings), 0);
  const ranked = [...active].sort((a, b) => perYear(b, settings) - perYear(a, settings));
  const cutMonth = active.filter(s => cut.has(s.id)).reduce((a, s) => a + perMonth(s, settings), 0);
  const toggle = (id: string) => setCut(c => { const n = new Set(c); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const perUse = active.filter(s => (s.usesPerMonth || 0) > 0).map(s => ({ s, v: perMonth(s, settings) / s.usesPerMonth! })).sort((a, b) => b.v - a.v);
  const plans = active.filter(s => s.unit !== "year" && (s.annualAlt || 0) > 0).map(s => {
    const now = perYear(s, settings); const alt = toEUR(s.annualAlt!, s.currency, settings) / Math.max(1, s.share);
    return { s, now, alt, save: now - alt };
  }).sort((a, b) => b.save - a.save);
  const planSave = plans.filter(p => p.save > 0).reduce((a, p) => a + p.save, 0);
  const group = (f: (s: Sub) => string) => {
    const m = new Map<string, number>();
    for (const s of active) { const k = f(s) || "Sin indicar"; m.set(k, (m.get(k) || 0) + perYear(s, settings)); }
    return [...m].map(([k, v]) => ({ key: k, label: k, value: v })).sort((a, b) => b.value - a.value);
  };
  const rises = subs.filter(s => (s.history || []).length >= 2).map(s => {
    const h = s.history; const a = h[0], b = h[h.length - 1];
    return { s, a, b, pct: a.amount > 0 ? (b.amount / a.amount - 1) * 100 : 0, extra: toEUR(b.amount - a.amount, s.currency, settings) / Math.max(1, s.share) * chargesPerYear(s) };
  }).sort((x, y) => y.extra - x.extra);
  if (!active.length) return <p className="note">No hay suscripciones activas que comparar.</p>;

  return (
    <>
      <section className="card">
        <h2>Ranking por coste anual</h2>
        <p className="legend">Cómo leerlo: todas las suscripciones puestas en la misma unidad (euros al año, tu parte), sin importar si las pagas por semanas, meses o años. El color indica cuánto la usas; busca barras largas y claras: mucho coste y poco uso.</p>
        <div className="key">{USAGE_LABEL.map((l, i) => <span key={l}><i className="sw" style={{ background: USAGE_COLOR[i] }} />Uso {l.toLowerCase()}</span>)}</div>
        <HBars unit=" al año" rows={ranked.map(s => ({ key: s.id, label: s.name, value: perYear(s, settings), color: USAGE_COLOR[s.usage], sub: `uso ${USAGE_LABEL[s.usage].toLowerCase()} · ${month > 0 ? Math.round((perMonth(s, settings) / month) * 100) : 0} %` }))} />
      </section>

      <section className="card">
        <h2>Simulador de recortes</h2>
        <p className="legend">Cómo leerlo: es una hipótesis, no cambia tus datos. Marca las que te plantearías cancelar y mira el efecto sobre el gasto mensual, anual y a cinco años (a precios de hoy, sin subidas). Para aplicarlo de verdad, da de baja cada una en la pestaña Lista.</p>
        <div className="row">
          <button className="btn" onClick={() => setCut(new Set(active.filter(s => s.usage <= 1).map(s => s.id)))}>Marcar las de uso bajo o nulo</button>
          <button className="btn ghost" onClick={() => setCut(new Set())}>Limpiar</button>
        </div>
        <div className="checks">
          {ranked.map(s => (
            <label key={s.id} className={cut.has(s.id) ? "on" : ""}>
              <input type="checkbox" checked={cut.has(s.id)} onChange={() => toggle(s.id)} />
              <span>{s.name}<i>uso {USAGE_LABEL[s.usage].toLowerCase()}</i></span><b>{eur(perMonth(s, settings))}/mes</b>
            </label>
          ))}
        </div>
        <div className="stats tight">
          <Stat label="Hoy" value={eur(month) + "/mes"} />
          <Stat label="Con el recorte" value={eur(month - cutMonth) + "/mes"} hint={month > 0 ? `−${Math.round((cutMonth / month) * 100)} %` : undefined} />
          <Stat label="Ahorro al año" value={eur(cutMonth * 12)} />
          <Stat label="Ahorro en 5 años" value={eur(cutMonth * 60)} />
        </div>
      </section>

      <section className="card">
        <h2>Coste por uso</h2>
        <p className="legend">Cómo leerlo: coste mensual dividido entre las veces que la usas al mes. Sirve para comparar cosas distintas con la misma vara: si una película suelta cuesta 4 € y cada uso de tu plataforma te sale a 9 €, pagarías menos alquilando. Solo aparecen las que tienen «usos al mes» rellenado.</p>
        {perUse.length ? (
          <table className="tbl"><thead><tr><th>Suscripción</th><th className="num">Usos/mes</th><th className="num">Al mes</th><th className="num">Por uso</th></tr></thead>
            <tbody>{perUse.map(({ s, v }) => <tr key={s.id}><td>{s.name}</td><td className="num">{s.usesPerMonth}</td><td className="num">{eur(perMonth(s, settings))}</td><td className="num"><strong>{eur(v)}</strong></td></tr>)}</tbody></table>
        ) : <p className="muted">Rellena «Usos al mes» en alguna suscripción para ver esta tabla.</p>}
      </section>

      <section className="card">
        <h2>Pago mensual frente a plan anual</h2>
        <p className="legend">Cómo leerlo: para las que pagas por meses y tienen plan anual, compara lo que pagas en 12 meses con el precio del plan anual. Ahorro positivo = el anual sale más barato, a cambio de pagar de golpe y no poder dejarlo a mitad de año. Solo compensa en las que estás seguro de mantener.</p>
        {plans.length ? (
          <>
            <table className="tbl"><thead><tr><th>Suscripción</th><th className="num">Hoy, al año</th><th className="num">Plan anual</th><th className="num">Ahorro</th></tr></thead>
              <tbody>{plans.map(p => <tr key={p.s.id}><td>{p.s.name}</td><td className="num">{eur(p.now)}</td><td className="num">{eur(p.alt)}</td><td className="num"><strong>{p.save > 0 ? eur(p.save) : "no compensa"}</strong></td></tr>)}</tbody></table>
            {planSave > 0 && <p className="note ok">Pasando a anual las que compensan ahorrarías <strong>{eur(planSave)}</strong> al año.</p>}
          </>
        ) : <p className="muted">Apunta el «Precio del plan anual» en las suscripciones que pagas por meses para ver cuánto ahorrarías.</p>}
      </section>

      <section className="card">
        <h2>Quién lo usa y con qué se paga</h2>
        <p className="legend">Cómo leerlo: el mismo gasto anual repartido de dos formas. Por persona, para ver en quién se concentra; por medio de pago, para saber qué revisar si cambias de tarjeta o de banco.</p>
        <h3>Por quién la usa (euros al año)</h3><HBars rows={group(s => s.owner)} unit=" al año" />
        <h3>Por medio de pago (euros al año)</h3><HBars rows={group(s => s.pay)} unit=" al año" />
      </section>

      <section className="card">
        <h2>Subidas de precio</h2>
        <p className="legend">Cómo leerlo: cada vez que cambias el importe de una suscripción, la app guarda el anterior. Aquí ves el primer precio apuntado frente al actual y lo que supone al año.</p>
        {rises.length ? (
          <table className="tbl"><thead><tr><th>Suscripción</th><th className="num">Antes</th><th className="num">Ahora</th><th className="num">Cambio</th><th className="num">Al año</th></tr></thead>
            <tbody>{rises.map(r => <tr key={r.s.id}><td>{r.s.name}<i className="sub-i">desde {fmtDate(r.a.date)}</i></td><td className="num">{r.a.amount.toLocaleString("es-ES")}</td><td className="num">{r.b.amount.toLocaleString("es-ES")} {r.s.currency}</td><td className="num">{r.pct >= 0 ? "+" : ""}{r.pct.toFixed(0)} %</td><td className="num"><strong>{r.extra >= 0 ? "+" : ""}{eur(r.extra)}</strong></td></tr>)}</tbody></table>
        ) : <p className="muted">Aún no hay cambios de precio registrados. Cuando te suban una, edita su importe y quedará apuntado aquí.</p>}
      </section>
    </>
  );
}

// ---------- Formulario ----------
function Form({ initial, today, onClose, onSave, onDelete }: { initial: Sub; today: string; onClose: () => void; onSave: (s: Sub) => void; onDelete: (id: string) => void }) {
  const [s, setS] = useState<Sub>(initial);
  const [amount, setAmount] = useState(initial.amount ? String(initial.amount).replace(".", ",") : "");
  const [annual, setAnnual] = useState(initial.annualAlt ? String(initial.annualAlt).replace(".", ",") : "");
  const [more, setMore] = useState(!!initial.id);
  const [confirmDel, setConfirmDel] = useState(false);
  const [err, setErr] = useState("");
  const set = (p: Partial<Sub>) => setS(x => ({ ...x, ...p }));
  const num = (v: string) => { const n = parseFloat(v.replace(/\s/g, "").replace(",", ".")); return isFinite(n) && n >= 0 ? n : NaN; };
  const isNew = !initial.id;
  const preset = s.unit === "month" && s.every === 1 ? "m1" : s.unit === "month" && s.every === 3 ? "m3" : s.unit === "month" && s.every === 6 ? "m6" : s.unit === "year" && s.every === 1 ? "y1" : s.unit === "week" && s.every === 1 ? "w1" : "x";
  const [custom, setCustom] = useState(preset === "x");
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); }; window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [onClose]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const a = num(amount);
    if (!s.name.trim()) return setErr("Ponle un nombre.");
    if (isNaN(a)) return setErr("El importe tiene que ser un número (por ejemplo 12,99).");
    if (s.status === "prueba" && !isIso(s.trialEnd)) return setErr("Indica cuándo termina la prueba.");
    const an = annual.trim() ? num(annual) : undefined;
    onSave({ ...s, name: s.name.trim(), amount: a, annualAlt: an && !isNaN(an) && an > 0 ? an : undefined, anchor: isIso(s.anchor) ? s.anchor : "" });
  };
  const next = nextRenewal({ ...s, amount: num(amount) || 0 }, today);

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={isNew ? "Nueva suscripción" : "Editar suscripción"} onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <form className="sheet" onSubmit={submit}>
        <div className="sheet-h"><h2>{isNew ? "Nueva suscripción" : s.name || "Editar"}</h2><button type="button" className="x" onClick={onClose} aria-label="Cerrar">×</button></div>
        <div className="sheet-b">
          <label>Nombre
            <input list="sx-cat" value={s.name} autoFocus={isNew} placeholder="Netflix, gimnasio, dominio…" onChange={e => { const v = e.target.value; set({ name: v, ...(CATALOG[v] && (isNew || s.category === "Otros") ? { category: CATALOG[v] } : {}) }); }} />
            <datalist id="sx-cat">{Object.keys(CATALOG).map(n => <option key={n} value={n} />)}</datalist>
          </label>
          <div className="g2">
            <label>Importe de cada cargo
              <input inputMode="decimal" value={amount} placeholder="12,99" onChange={e => setAmount(e.target.value)} />
            </label>
            <label>Moneda
              <select value={s.currency} onChange={e => set({ currency: e.target.value as Currency })}><option>EUR</option><option>USD</option><option>GBP</option></select>
            </label>
          </div>
          <label>Se cobra
            <select value={custom ? "x" : preset} onChange={e => {
              const v = e.target.value; setCustom(v === "x");
              if (v === "m1") set({ unit: "month", every: 1 }); if (v === "m3") set({ unit: "month", every: 3 }); if (v === "m6") set({ unit: "month", every: 6 });
              if (v === "y1") set({ unit: "year", every: 1 }); if (v === "w1") set({ unit: "week", every: 1 });
            }}>
              <option value="m1">Cada mes</option><option value="y1">Cada año</option><option value="m3">Cada trimestre</option><option value="m6">Cada semestre</option><option value="w1">Cada semana</option><option value="x">Otra periodicidad…</option>
            </select>
          </label>
          {custom && (
            <div className="g2">
              <label>Cada<input type="number" min={1} max={99} value={s.every} onChange={e => set({ every: Math.max(1, parseInt(e.target.value) || 1) })} /></label>
              <label>Unidad<select value={s.unit} onChange={e => set({ unit: e.target.value as Unit })}><option value="week">semanas</option><option value="month">meses</option><option value="year">años</option></select></label>
            </div>
          )}
          <div className="g2">
            <label>Estado
              <select value={s.status} onChange={e => set({ status: e.target.value as Status })}>{(Object.keys(STATUS_LABEL) as Status[]).map(k => <option key={k} value={k}>{STATUS_LABEL[k]}</option>)}</select>
            </label>
            {s.status === "prueba" ? (
              <label>La prueba termina el<input type="date" value={s.trialEnd || ""} onChange={e => set({ trialEnd: e.target.value, anchor: e.target.value })} /></label>
            ) : (
              <label>Próximo cargo (o uno pasado)<input type="date" value={s.anchor || ""} onChange={e => set({ anchor: e.target.value })} /></label>
            )}
          </div>
          <p className="hint">{next ? <>Próxima renovación calculada: <strong>{fmtDate(next)}</strong>. Basta con una fecha de cargo; la app la va avanzando sola según la periodicidad.</> : s.status === "pausada" || s.status === "cancelada" ? "Pausada o cancelada: no cuenta en totales ni genera avisos." : "Sin fecha no habrá avisos de renovación."}</p>
          <div className="g2">
            <label>Categoría<select value={s.category} onChange={e => set({ category: e.target.value })}>{[...new Set([...CATEGORIES, s.category])].map(c => <option key={c}>{c}</option>)}</select></label>
            <label>Cuánto la usas<select value={s.usage} onChange={e => set({ usage: Number(e.target.value) as Sub["usage"] })}>{USAGE_LABEL.map((l, i) => <option key={l} value={i}>{l}</option>)}</select></label>
          </div>

          <button type="button" className="link more" onClick={() => setMore(m => !m)} aria-expanded={more}>{more ? "− Menos detalles" : "+ Más detalles (pago, reparto, avisos, plan anual, notas)"}</button>
          {more && (
            <>
              <div className="g2">
                <label>Medio de pago<input value={s.pay} placeholder="Visa ··1234, PayPal, recibo…" onChange={e => set({ pay: e.target.value })} /></label>
                <label>Quién la usa<input value={s.owner} placeholder="Yo, familia, niños…" onChange={e => set({ owner: e.target.value })} /></label>
              </div>
              <div className="g2">
                <label>Se reparte entre<input type="number" min={1} max={20} value={s.share} onChange={e => set({ share: Math.max(1, parseInt(e.target.value) || 1) })} /></label>
                <label>Avisar con (días)<input type="number" min={0} max={60} value={s.remind} onChange={e => set({ remind: Math.max(0, Math.min(60, parseInt(e.target.value) || 0)) })} /></label>
              </div>
              <p className="hint">Reparto: si la pagas a medias con alguien, pon 2 y los totales contarán solo tu mitad.</p>
              <div className="g2">
                <label>Usos al mes<input type="number" min={0} value={s.usesPerMonth ?? ""} placeholder="p. ej. 8" onChange={e => set({ usesPerMonth: parseFloat(e.target.value) > 0 ? parseFloat(e.target.value) : undefined })} /></label>
                <label>Precio del plan anual<input inputMode="decimal" value={annual} placeholder="si pagas por meses" onChange={e => setAnnual(e.target.value)} /></label>
              </div>
              <div className="g2">
                <label>Fecha de alta<input type="date" value={s.start || ""} onChange={e => set({ start: e.target.value || undefined })} /></label>
                <label>Permanencia hasta<input type="date" value={s.commitUntil || ""} onChange={e => set({ commitUntil: e.target.value || undefined })} /></label>
              </div>
              <label>Web para gestionarla o cancelarla<input value={s.url || ""} placeholder="https://…" onChange={e => set({ url: e.target.value || undefined })} /></label>
              <label>Notas<textarea rows={2} value={s.notes || ""} placeholder="Plan, cuenta con la que entras, cómo se cancela…" onChange={e => set({ notes: e.target.value || undefined })} /></label>
              <p className="hint">No apuntes aquí contraseñas ni números completos de tarjeta: esto se guarda sin cifrar en el navegador.</p>
              {!isNew && s.history?.length > 1 && <p className="hint">Historial de precio: {s.history.map(h => `${h.amount.toLocaleString("es-ES")} (${fmtDate(h.date)})`).join(" → ")}</p>}
            </>
          )}
          {err && <p className="note warn" role="alert">{err}</p>}
        </div>
        <div className="sheet-f">
          {!isNew && (confirmDel
            ? <button type="button" className="btn danger" onClick={() => onDelete(s.id)}>Sí, borrar del todo</button>
            : <button type="button" className="btn ghost" onClick={() => setConfirmDel(true)} title="Para conservar el historial, mejor márcala como cancelada">Borrar</button>)}
          <span className="grow" />
          <button type="button" className="btn" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn primary">Guardar</button>
        </div>
      </form>
    </div>
  );
}

// ---------- Guía, glosario y ajustes ----------
function Guia({ store, setStore, today }: { store: Store; setStore: React.Dispatch<React.SetStateAction<Store>>; today: string }) {
  const file = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState("");
  const [wipe, setWipe] = useState(false);
  const { subs, settings } = store;
  const setFx = (k: "USD" | "GBP", v: string) => { const n = parseFloat(v.replace(",", ".")); if (n > 0) setStore(st => ({ ...st, settings: { ...st.settings, fx: { ...st.settings.fx, [k]: n } } })); };
  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; e.target.value = "";
    if (!f) return;
    try {
      const parsed = parseStore(JSON.parse(await f.text()));
      if (!parsed.subs.length) return setMsg("Ese fichero no contiene suscripciones.");
      setStore(parsed); setMsg(`Importadas ${parsed.subs.length} suscripciones. Han sustituido a las que había.`);
    } catch { setMsg("No he podido leer el fichero: tiene que ser una copia exportada desde esta app (.json)."); }
  };
  const hasSample = subs.some(s => s.id.startsWith("ej-"));
  return (
    <>
      <section className="card prose">
        <h2>Para qué sirve</h2>
        <p>Las suscripciones se contratan de una en una y se pagan en silencio: cada cargo es pequeño, llegan a tarjetas distintas y las anuales aparecen cuando ya nadie se acuerda. Esta herramienta las junta para responder a tres preguntas: <strong>cuánto suman</strong>, <strong>cuándo toca pagar o decidir</strong> y <strong>cuáles no compensan</strong>.</p>
        <h2>Cómo usarla</h2>
        <ol>
          <li><strong>Apunta</strong> cada suscripción con «+ Añadir». Lo imprescindible: nombre, importe, periodicidad y una fecha de cargo (la próxima o cualquiera pasada).</li>
          <li><strong>Afina</strong> en «Más detalles»: medio de pago, quién la usa, entre cuántos se reparte, usos al mes y precio del plan anual. Cuanto más rellenes, más dicen las comparativas.</li>
          <li><strong>Descarga el calendario</strong> desde Avisos para que el móvil te avise antes de cada renovación.</li>
          <li><strong>Revisa</strong> cada pocos meses: entra en Avisos, decide sobre cada una y pulsa «Marcar revisada». Si te suben el precio, edita el importe: el anterior queda en el historial.</li>
          <li><strong>Da de baja</strong> en vez de borrar: las canceladas dejan de contar pero conservan el dato de cuánto te ahorras.</li>
        </ol>
        <h2>Qué hay en cada pestaña</h2>
        <ul>
          <li><strong>Resumen</strong>: totales, próximos cargos, gasto por categoría y calendario de cargos a 12 meses.</li>
          <li><strong>Lista</strong>: todas las suscripciones, con búsqueda, filtros y acciones rápidas.</li>
          <li><strong>Avisos</strong>: lo que requiere atención, ordenado por urgencia, y el calendario descargable.</li>
          <li><strong>Comparar</strong>: ranking, simulador de recortes, coste por uso, mensual frente a anual, reparto por persona y medio de pago, y subidas de precio.</li>
        </ul>
        <h2>Cómo leer las hipótesis</h2>
        <ul>
          <li><strong>«Al mes» es una media, no un cargo.</strong> Una anual de 120 € cuenta 10 € cada mes aunque se pague de una vez. Para ver los cargos reales mes a mes está el calendario de 12 meses.</li>
          <li><strong>El calendario supone que nada cambia</strong>: mismos precios, ninguna baja y las pruebas se convierten en suscripciones de pago. Es el escenario «si no hago nada».</li>
          <li><strong>El simulador de recortes es un «y si»</strong>: no toca tus datos. El ahorro a cinco años es el anual multiplicado por cinco, a precios de hoy; como los precios suelen subir, es una estimación prudente.</li>
          <li><strong>Mensual frente a anual</strong> compara 12 pagos mensuales con un pago anual. No valora la flexibilidad que pierdes: con el anual no puedes dejarlo a los tres meses.</li>
          <li><strong>Otras monedas</strong> se convierten con el tipo fijo de Ajustes, no con el del día del cargo. El banco puede añadir comisión.</li>
        </ul>
      </section>

      <section className="card prose">
        <h2>Glosario</h2>
        <dl>
          <dt>Coste al mes / al año</dt><dd>Tu parte del importe, en euros, repartida de forma uniforme. Anual = importe × cargos al año ÷ personas entre las que se reparte.</dd>
          <dt>Cargo</dt><dd>Cada cobro real en la tarjeta o cuenta, en su fecha.</dd>
          <dt>Próximo cargo / renovación</dt><dd>La siguiente fecha de cobro. La app la calcula sumando la periodicidad a la fecha que apuntaste.</dd>
          <dt>Periodicidad</dt><dd>Cada cuánto se cobra: semanal, mensual, trimestral, semestral, anual u otra.</dd>
          <dt>Prueba</dt><dd>Periodo gratuito que pasa a ser de pago si no se cancela antes de su fecha de fin. No cuenta en los totales hasta que la marcas como activa, pero sí en el calendario de cargos.</dd>
          <dt>Pausada</dt><dd>Suspendida temporalmente: ni cuenta ni avisa.</dd>
          <dt>Cancelada</dt><dd>Dada de baja. Se conserva para saber cuánto ahorras con ella.</dd>
          <dt>Reparto</dt><dd>Número de personas que pagan la suscripción. Los totales usan solo tu parte.</dd>
          <dt>Uso</dt><dd>Tu valoración: nulo, bajo, medio o alto. «Nulo» y «bajo» generan aviso de candidata a cancelar.</dd>
          <dt>Coste por uso</dt><dd>Coste mensual ÷ usos al mes.</dd>
          <dt>Permanencia</dt><dd>Fecha hasta la que cancelar tiene penalización.</dd>
          <dt>Plazo de aviso</dt><dd>Días de antelación con los que una renovación aparece en Avisos y suena en el calendario (7 por defecto).</dd>
          <dt>Solape</dt><dd>Varias suscripciones activas de la misma categoría a la vez (por ejemplo, tres plataformas de vídeo).</dd>
          <dt>Revisada</dt><dd>Marca de que has comprobado precio, plan y uso. Pasado el plazo de revisión vuelve a aparecer en Avisos.</dd>
        </dl>
        <h2>Leyenda de avisos</h2>
        <ul className="plain">
          {(Object.keys(LEVEL_META) as Level[]).map(l => <li key={l}><span className={"pill " + LEVEL_META[l].cls}>{LEVEL_META[l].icon} {LEVEL_META[l].label}</span> {LEVEL_EXPLAIN[l]}</li>)}
        </ul>
      </section>

      <section className="card">
        <h2>Ajustes</h2>
        <div className="g3">
          <label>1 USD en euros<input inputMode="decimal" defaultValue={String(settings.fx.USD).replace(".", ",")} onBlur={e => setFx("USD", e.target.value)} /></label>
          <label>1 GBP en euros<input inputMode="decimal" defaultValue={String(settings.fx.GBP).replace(".", ",")} onBlur={e => setFx("GBP", e.target.value)} /></label>
          <label>Revisar cada (meses)<input type="number" min={1} max={24} value={settings.reviewMonths} onChange={e => setStore(st => ({ ...st, settings: { ...st.settings, reviewMonths: Math.max(1, parseInt(e.target.value) || 6) } }))} /></label>
        </div>
        <p className="muted small">Los tipos de cambio son orientativos y no se actualizan solos: pon el que veas en tu banco.</p>
      </section>

      <section className="card">
        <h2>Tus datos</h2>
        <p>Se guardan únicamente en este navegador y en este dispositivo. No se envían a ningún servidor, y por eso tampoco aparecen en otro móvil u ordenador: para pasarlos, exporta la copia aquí e impórtala allí. Si borras los datos de navegación de este sitio, se pierden; guarda una copia de vez en cuando.</p>
        <div className="row">
          <button className="btn" onClick={() => download(`suscripciones-${today}.json`, JSON.stringify({ app: "joaco.org/suscripciones", version: 1, exported: today, ...store }, null, 2), "application/json")} disabled={!subs.length}>Exportar copia (.json)</button>
          <button className="btn" onClick={() => file.current?.click()}>Importar copia</button>
          <button className="btn" onClick={() => download(`suscripciones-${today}.csv`, buildCsv(subs, settings, today), "text/csv;charset=utf-8")} disabled={!subs.length}>Exportar a Excel (.csv)</button>
          <input ref={file} type="file" accept="application/json,.json" hidden onChange={onFile} />
        </div>
        <div className="row">
          {!subs.length && <button className="btn" onClick={() => setStore(st => ({ ...st, subs: sampleData(today) }))}>Cargar datos de ejemplo</button>}
          {hasSample && <button className="btn" onClick={() => setStore(st => ({ ...st, subs: st.subs.filter(s => !s.id.startsWith("ej-")) }))}>Quitar los datos de ejemplo</button>}
          {subs.length > 0 && (wipe
            ? <button className="btn danger" onClick={() => { setStore(st => ({ ...st, subs: [] })); setWipe(false); setMsg("Todo borrado."); }}>Sí, borrar las {subs.length}</button>
            : <button className="btn ghost" onClick={() => setWipe(true)}>Borrar todo</button>)}
        </div>
        {msg && <p className="note" role="status">{msg}</p>}
      </section>
    </>
  );
}

// ---------- Estilos (tema claro) ----------
const CSS = `
.sx{--bg:#f6f5f1;--card:#fcfcfb;--ink:#0b0b0b;--ink2:#52514e;--ink3:#6f6e69;--line:#e3e1da;--s1:#2a78d6;--s1d:#1b5aa8;--tint:#eaf2fc;
  --urg:#b3261e;--urg-bg:#fdecea;--pro:#8a5a00;--pro-bg:#fdf3d8;--rev:#1b5aa8;--rev-bg:#eaf2fc;--inf:#52514e;--inf-bg:#efeee9;--ok:#1b6e3c;--ok-bg:#e6f4ea;
  color-scheme:light;min-height:100vh;background:var(--bg);color:var(--ink);font-family:'Sora',system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.5;
  padding:clamp(14px,3vw,32px) clamp(12px,3vw,32px) 84px;-webkit-text-size-adjust:100%}
.sx *{box-sizing:border-box}
.sx h1{font-family:'Fraunces',Georgia,serif;font-weight:650;font-size:clamp(28px,5vw,40px);line-height:1.05;margin:0;letter-spacing:-.01em;text-wrap:balance}
.sx h2{font-size:17px;font-weight:600;margin:0 0 6px}
.sx h3{font-size:14px;font-weight:600;margin:16px 0 8px;color:var(--ink2)}
.sx p{margin:0 0 10px}
.sx-head,.sx-tabs,.sx-main,.sx-foot,.sx>.note{max-width:920px;margin-left:auto;margin-right:auto}
.sx-head{display:flex;gap:14px;align-items:flex-end;justify-content:space-between;margin-bottom:14px}
.sx-lede{color:var(--ink2);margin:6px 0 0;max-width:52ch}
.sx-tabs{display:flex;gap:4px;overflow-x:auto;border-bottom:1px solid var(--line);margin-bottom:16px;scrollbar-width:none}
.sx-tabs::-webkit-scrollbar{display:none}
.sx-tabs button{font:inherit;font-weight:600;color:var(--ink3);background:none;border:0;border-bottom:3px solid transparent;padding:10px 12px;cursor:pointer;white-space:nowrap;display:flex;gap:6px;align-items:center}
.sx-tabs button.on{color:var(--ink);border-bottom-color:var(--s1)}
.sx .badge{background:var(--urg);color:#fff;border-radius:99px;font-size:11px;min-width:18px;height:18px;display:inline-grid;place-items:center;padding:0 5px}
.sx-main{display:flex;flex-direction:column;gap:14px}
.sx-foot{color:var(--ink3);font-size:12px;margin-top:22px}
.sx .card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px}
.sx .card-h{display:flex;justify-content:space-between;align-items:baseline;gap:10px}
.sx .count{font-weight:400;color:var(--ink3);font-size:14px}
.sx .muted{color:var(--ink3)}.sx .small{font-size:13px}.sx .pad{padding:10px 0}
.sx .legend{color:var(--ink2);font-size:13px;margin-bottom:12px;max-width:75ch}
.sx .note{background:var(--tint);border-radius:10px;padding:10px 12px;font-size:14px;margin:0}
.sx .note.warn{background:var(--urg-bg);color:var(--urg)}.sx .note.ok{background:var(--ok-bg);color:var(--ok)}
.sx .row{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}
.sx .btn{font:inherit;font-weight:600;font-size:14px;white-space:nowrap;border:1px solid var(--line);background:#fff;color:var(--ink);border-radius:10px;padding:9px 14px;cursor:pointer;min-height:40px}
.sx .btn:hover{border-color:#bdbab0}.sx .btn:disabled{opacity:.45;cursor:default}
.sx .btn.primary{background:var(--s1d);border-color:var(--s1d);color:#fff}.sx .btn.primary:hover{background:#164a8c}
.sx .btn.ghost{background:transparent}.sx .btn.danger{background:var(--urg);border-color:var(--urg);color:#fff}
.sx .link{font:inherit;font-size:13px;font-weight:600;color:var(--s1d);background:none;border:0;padding:6px 0;cursor:pointer;text-decoration:none}
.sx .link:hover{text-decoration:underline}
.sx :focus-visible{outline:2px solid var(--s1);outline-offset:2px}
.sx .empty{text-align:left;padding:24px}.sx .empty h2{font-family:'Fraunces',Georgia,serif;font-size:22px}
.sx .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.sx .stats.tight{margin-top:14px}
.sx .stat{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:12px 14px;min-width:0}
.sx .stats.tight .stat{background:var(--bg)}
.sx .stat-l{font-size:12px;color:var(--ink3);font-weight:600;text-transform:uppercase;letter-spacing:.04em}
.sx .stat-v{font-size:clamp(19px,3.4vw,26px);font-weight:600;font-variant-numeric:tabular-nums;line-height:1.2;margin-top:2px;overflow-wrap:anywhere}
.sx .stat-h{font-size:12px;color:var(--ink3);margin-top:2px}
.sx .alerts{display:flex;flex-direction:column;gap:8px}
.sx .alert{font:inherit;text-align:left;display:flex;gap:10px;border:0;border-left:4px solid;border-radius:10px;padding:10px 12px;cursor:pointer;width:100%;color:var(--ink)}
.sx .alert-ic{font-size:13px;line-height:1.6}
.sx .alert-body{display:flex;flex-direction:column;gap:1px;min-width:0}.sx .alert-body span{font-size:13px;color:var(--ink2)}
.sx .alert-lv{font-size:11px!important;font-weight:700;text-transform:uppercase;letter-spacing:.05em}
.sx .lv-urg{background:var(--urg-bg);border-color:var(--urg)}.sx .lv-urg .alert-ic,.sx .lv-urg .alert-lv{color:var(--urg)}
.sx .lv-pro{background:var(--pro-bg);border-color:#d99a00}.sx .lv-pro .alert-ic,.sx .lv-pro .alert-lv{color:var(--pro)}
.sx .lv-rev{background:var(--rev-bg);border-color:var(--s1)}.sx .lv-rev .alert-ic,.sx .lv-rev .alert-lv{color:var(--rev)}
.sx .lv-inf{background:var(--inf-bg);border-color:#a3a199}.sx .lv-inf .alert-ic,.sx .lv-inf .alert-lv{color:var(--inf)}
.sx .pill{display:inline-block;border-radius:99px;padding:1px 9px;font-size:12px;font-weight:700;border:0;margin-right:4px}
.sx .pill.lv-urg{color:var(--urg)}.sx .pill.lv-pro{color:var(--pro)}.sx .pill.lv-rev{color:var(--rev)}.sx .pill.lv-inf{color:var(--inf)}
.sx .next{list-style:none;margin:0;padding:0}
.sx .next li+li{border-top:1px solid var(--line)}
.sx .next button{font:inherit;color:inherit;background:none;border:0;width:100%;display:grid;grid-template-columns:86px 1fr auto;gap:10px;align-items:center;padding:9px 0;text-align:left;cursor:pointer}
.sx .next i{display:block;font-style:normal;font-size:12px;color:var(--ink3)}
.sx .next-n{min-width:0;overflow-wrap:anywhere}.sx .next-a{font-weight:600;font-variant-numeric:tabular-nums}
.sx .hbars{display:flex;flex-direction:column;gap:10px}
.sx .hbar.click{cursor:pointer}
.sx .hbar-top{display:flex;justify-content:space-between;gap:10px;font-size:14px}
.sx .hbar-l{min-width:0;overflow-wrap:anywhere}.sx .hbar-l em{font-style:normal;color:var(--ink3);font-size:12px}
.sx .hbar-v{font-weight:600;font-variant-numeric:tabular-nums;white-space:nowrap}
.sx .hbar-track{height:10px;margin-top:4px;background:#efeee9;border-radius:4px}
.sx .hbar-fill{height:100%;border-radius:0 4px 4px 0;min-width:3px}
.sx .hbar:hover .hbar-track{background:#e6e4dc}
.sx .cols{position:relative;display:grid;grid-template-columns:repeat(12,1fr);gap:2px;height:200px;align-items:end;border-bottom:1px solid var(--line);margin-bottom:0;padding-bottom:0}
.sx .col{font:inherit;background:none;border:0;padding:0;height:100%;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;cursor:pointer;min-width:0;color:var(--ink)}
.sx .col-bar{width:68%;max-width:34px;background:#9dbfe9;border-radius:4px 4px 0 0;min-height:2px}
.sx .col.on .col-bar,.sx .col:hover .col-bar{background:var(--s1d)}
.sx .col-v{font-size:11px;font-weight:600;font-variant-numeric:tabular-nums;white-space:nowrap;height:16px}
.sx .col-x{font-size:11px;color:var(--ink3);height:22px;line-height:22px}
.sx .col.on .col-x{color:var(--ink);font-weight:700}
.sx .cols-avg{position:absolute;left:0;right:0;border-top:2px dashed #7c7a73;pointer-events:none;z-index:1}
.sx .cols-avg span{position:absolute;right:0;top:-18px;font-size:11px;color:var(--ink2);background:var(--card);padding:0 4px}
.sx .key{display:flex;flex-wrap:wrap;gap:6px 16px;font-size:12px;color:var(--ink2);margin:10px 0}
.sx .key span{display:inline-flex;align-items:center;gap:6px}
.sx .sw{display:inline-block;width:14px;height:10px;border-radius:2px;background:#9dbfe9}
.sx .sw.dash{background:none;border-top:2px dashed #7c7a73;height:0;border-radius:0}
.sx .month{background:var(--bg);border-radius:10px;padding:10px 12px}.sx .month h3{margin-top:0}
.sx .tbl{width:100%;border-collapse:collapse;font-size:14px}
.sx .tbl th{font-size:12px;color:var(--ink3);font-weight:600;text-align:left;padding:6px 6px 6px 0;border-bottom:1px solid var(--line)}
.sx .tbl td{padding:7px 6px 7px 0;border-bottom:1px solid var(--line);vertical-align:top;overflow-wrap:anywhere}
.sx .tbl tr:last-child td{border-bottom:0}
.sx .tbl .num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap;padding-right:0;padding-left:8px}
.sx .sub-i{display:block;font-style:normal;font-size:12px;color:var(--ink3)}
.sx .filters{display:grid;grid-template-columns:1fr auto auto;gap:8px}
.sx input,.sx select,.sx textarea{font:inherit;font-size:16px;color:var(--ink);background:#fff;border:1px solid #cfccc2;border-radius:10px;padding:9px 10px;width:100%;min-height:42px}
.sx textarea{min-height:0;resize:vertical}
.sx .list{display:flex;flex-direction:column;gap:10px}
.sx .sub{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:12px 14px}
.sx .sub.st-cancelada,.sx .sub.st-pausada{background:transparent}.sx .sub.st-cancelada .sub-main strong{text-decoration:line-through;color:var(--ink3)}
.sx .sub-main{font:inherit;color:inherit;background:none;border:0;padding:0;width:100%;display:flex;justify-content:space-between;gap:12px;text-align:left;cursor:pointer}
.sx .sub-main i{display:block;font-style:normal;font-size:12px;color:var(--ink3)}
.sx .sub-t{min-width:0;overflow-wrap:anywhere}.sx .sub-t strong{font-size:16px}
.sx .sub-c{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}
.sx .sub-meta{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.sx .chip{font-size:12px;background:#efeee9;border-radius:99px;padding:2px 9px;color:var(--ink2);display:inline-flex;align-items:center;gap:5px}
.sx .chip.c-activa{background:var(--ok-bg);color:var(--ok)}.sx .chip.c-prueba,.sx .chip.c-soon{background:var(--pro-bg);color:var(--pro)}
.sx .dot{width:8px;height:8px;border-radius:50%;display:inline-block}
.sx .sub-act{display:flex;flex-wrap:wrap;gap:4px 16px;margin-top:6px}
.sx .checks{display:flex;flex-direction:column;margin-top:6px}
.sx .checks label{display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:center;padding:8px 6px;border-radius:8px;cursor:pointer}
.sx .checks label+label{border-top:1px solid var(--line)}
.sx .checks label.on{background:var(--tint)}
.sx .checks input{width:20px;height:20px;min-height:0;padding:0;accent-color:var(--s1d)}
.sx .checks i{display:block;font-style:normal;font-size:12px;color:var(--ink3)}.sx .checks b{font-weight:600;font-variant-numeric:tabular-nums;white-space:nowrap}
.sx .modal{position:fixed;inset:0;background:rgba(20,20,18,.45);z-index:200;display:flex;align-items:flex-end;justify-content:center}
.sx .sheet{background:var(--card);width:100%;max-width:560px;max-height:94vh;max-height:94dvh;border-radius:18px 18px 0 0;display:flex;flex-direction:column}
.sx .sheet-h{display:flex;justify-content:space-between;align-items:center;padding:14px 16px 8px}.sx .sheet-h h2{margin:0;font-size:18px}
.sx .x{font-size:26px;line-height:1;background:none;border:0;cursor:pointer;color:var(--ink2);width:40px;height:40px}
.sx .sheet-b{overflow-y:auto;padding:4px 16px 12px;display:flex;flex-direction:column;gap:10px}
.sx .sheet-f{display:flex;gap:8px;padding:10px 16px calc(10px + env(safe-area-inset-bottom,0px));border-top:1px solid var(--line)}
.sx .grow{flex:1}
.sx label{display:flex;flex-direction:column;gap:4px;font-size:13px;font-weight:600;color:var(--ink2);min-width:0}
.sx .g2{display:grid;grid-template-columns:1fr 1fr;gap:10px}.sx .g3{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;align-items:end}
.sx .hint{font-size:12px;color:var(--ink3);margin:-2px 0 0}
.sx .more{text-align:left;padding:8px 0}
.sx .prose h2{margin-top:18px}.sx .prose h2:first-child{margin-top:0}
.sx .prose ol,.sx .prose ul{margin:0 0 10px;padding-left:20px}.sx .prose li{margin-bottom:6px}
.sx .prose ul.plain{list-style:none;padding:0}
.sx .prose p,.sx .prose li,.sx .prose dd{max-width:72ch}
.sx dl{margin:0}.sx dt{font-weight:600;margin-top:10px}.sx dd{margin:0;color:var(--ink2)}
@media (min-width:640px){.sx .modal{align-items:center}.sx .sheet{border-radius:18px}}
@media (max-width:640px){
  .sx .stats{grid-template-columns:1fr 1fr}
  .sx .filters{grid-template-columns:1fr 1fr}.sx .filters input{grid-column:1/-1}
  .sx .g3{grid-template-columns:1fr}
  .sx .sx-head{align-items:flex-start}
  .sx .sx-tabs button{padding:10px 7px;font-size:13.5px}
  .sx .sx-tabs{gap:0}
  .sx .next button{grid-template-columns:70px 1fr auto}
}
@media (prefers-reduced-motion:no-preference){.sx .hbar-fill,.sx .col-bar{transition:width .25s,height .25s}}
`;
