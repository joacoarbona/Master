/* ============================================================
   SUSCRIPCIONES · lógica pura (fechas, costes, avisos, calendario)
   Sin React ni DOM: se puede probar con node.
   ============================================================ */

export type Unit = "week" | "month" | "year";
export type Status = "activa" | "prueba" | "pausada" | "cancelada";
export type Currency = "EUR" | "USD" | "GBP";

export interface PricePoint { date: string; amount: number }

export interface Sub {
  id: string;
  name: string;
  category: string;
  amount: number;          // importe de cada cargo, en su moneda
  currency: Currency;
  every: number;           // cada cuántas unidades se cobra
  unit: Unit;
  anchor: string;          // una fecha de cargo conocida (AAAA-MM-DD); la app la va rodando sola
  start?: string;          // fecha de alta
  status: Status;
  trialEnd?: string;       // fin de la prueba gratuita
  commitUntil?: string;    // permanencia hasta
  pay: string;             // medio de pago (texto libre)
  owner: string;           // quién la usa
  share: number;           // entre cuántos se reparte el coste (1 = todo mío)
  usage: 0 | 1 | 2 | 3;    // nulo, bajo, medio, alto
  usesPerMonth?: number;
  remind: number;          // días de antelación del aviso
  annualAlt?: number;      // precio del plan anual equivalente (si hoy se paga por meses)
  url?: string;
  notes?: string;
  reviewed?: string;       // última revisión
  cancelledOn?: string;
  history: PricePoint[];   // precio vigente desde cada fecha
  updatedAt?: number;      // ms de la última edición (para fusionar entre dispositivos)
}

export interface Settings { fx: { USD: number; GBP: number }; reviewMonths: number }
export const DEFAULT_SETTINGS: Settings = { fx: { USD: 0.92, GBP: 1.17 }, reviewMonths: 6 };

export const USAGE_LABEL = ["Nulo", "Bajo", "Medio", "Alto"] as const;
export const UNIT_LABEL: Record<Unit, [string, string]> = { week: ["semana", "semanas"], month: ["mes", "meses"], year: ["año", "años"] };

// ---------- Fechas (siempre AAAA-MM-DD, sin horas ni zonas) ----------
const pad = (n: number) => String(n).padStart(2, "0");
export const isIso = (s?: string): s is string => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(toMs(s));
function toMs(s: string) { const [y, m, d] = s.split("-").map(Number); return Date.UTC(y, m - 1, d); }
export function fromMs(ms: number) { const d = new Date(ms); return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`; }
export function todayIso(now = new Date()) { return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`; }
export const daysBetween = (a: string, b: string) => Math.round((toMs(b) - toMs(a)) / 86400000);
export const addDays = (s: string, n: number) => fromMs(toMs(s) + n * 86400000);
/** Suma meses conservando el día; si el mes no tiene ese día (31 → febrero) usa el último. */
export function addMonths(s: string, n: number) {
  const [y, m, d] = s.split("-").map(Number);
  const t = y * 12 + (m - 1) + n;
  const ny = Math.floor(t / 12), nm = t - ny * 12;
  const last = new Date(Date.UTC(ny, nm + 1, 0)).getUTCDate();
  return `${ny}-${pad(nm + 1)}-${pad(Math.min(d, last))}`;
}
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
export function fmtDate(s?: string, withYear = true) {
  if (!isIso(s)) return "sin fecha";
  const [y, m, d] = s.split("-").map(Number);
  return `${d} ${MESES[m - 1]}${withYear ? " " + y : ""}`;
}
export const monthLabel = (ym: string) => { const [y, m] = ym.split("-").map(Number); return `${MESES[m - 1]} ${String(y).slice(2)}`; };

// ---------- Costes ----------
export const counts = (s: Sub) => s.status === "activa";
export function toEUR(amount: number, cur: Currency, st: Settings) {
  return cur === "EUR" ? amount : amount * (st.fx[cur] || 1);
}
/** Lo que me toca a mí de cada cargo, en euros. */
export const myCharge = (s: Sub, st: Settings) => toEUR(s.amount || 0, s.currency, st) / Math.max(1, s.share || 1);
export function chargesPerYear(s: Sub) {
  const e = Math.max(1, s.every || 1);
  return s.unit === "week" ? 365.25 / 7 / e : s.unit === "month" ? 12 / e : 1 / e;
}
export const perYear = (s: Sub, st: Settings) => myCharge(s, st) * chargesPerYear(s);
export const perMonth = (s: Sub, st: Settings) => perYear(s, st) / 12;
export function periodText(s: Sub) {
  const e = Math.max(1, s.every || 1);
  if (e === 1) return s.unit === "week" ? "semanal" : s.unit === "month" ? "mensual" : "anual";
  if (s.unit === "month" && e === 3) return "trimestral";
  if (s.unit === "month" && e === 6) return "semestral";
  return `cada ${e} ${UNIT_LABEL[s.unit][1]}`;
}

// ---------- Renovaciones ----------
/** Fecha desde la que empiezan los cargos: en una prueba, el día que termina. */
export function firstCharge(s: Sub): string | null {
  if (s.status === "prueba" && isIso(s.trialEnd)) return s.trialEnd;
  return isIso(s.anchor) ? s.anchor : null;
}
function nth(s: Sub, base: string, k: number) {
  const e = Math.max(1, s.every || 1);
  return s.unit === "week" ? addDays(base, 7 * e * k) : addMonths(base, (s.unit === "year" ? 12 : 1) * e * k);
}
/** Primer cargo en `from` o después. La fecha guardada cuenta como el primer cargo conocido. */
export function nextRenewal(s: Sub, from: string): string | null {
  if (s.status === "pausada" || s.status === "cancelada") return null;
  const base = firstCharge(s);
  if (!base) return null;
  if (base >= from) return base;
  const e = Math.max(1, s.every || 1);
  const approxDays = s.unit === "week" ? 7 * e : s.unit === "month" ? 30.44 * e : 365.25 * e;
  let k = Math.max(0, Math.floor(daysBetween(base, from) / approxDays) - 1);
  while (nth(s, base, k) < from) k++;
  return nth(s, base, k);
}
/** Cargos previstos en [from, to). */
export function occurrences(s: Sub, from: string, to: string): string[] {
  const out: string[] = [];
  const base = firstCharge(s);
  let d = nextRenewal(s, from);
  if (!base || !d) return out;
  const e = Math.max(1, s.every || 1);
  const approxDays = s.unit === "week" ? 7 * e : s.unit === "month" ? 30.44 * e : 365.25 * e;
  let k = Math.round(daysBetween(base, d) / approxDays);
  while (nth(s, base, k) > d) k--;
  while (nth(s, base, k) < d) k++;
  while (d < to && out.length < 600) { out.push(d); k++; d = nth(s, base, k); }
  return out;
}

export interface MonthBucket { ym: string; total: number; items: { id: string; name: string; date: string; amount: number }[] }
/** Calendario de cargos de los próximos `n` meses naturales, empezando por el mes de `today`. */
export function forecast(subs: Sub[], st: Settings, today: string, n = 12, includeTrials = true): MonthBucket[] {
  const first = today.slice(0, 7) + "-01";
  const buckets: MonthBucket[] = [];
  for (let i = 0; i < n; i++) buckets.push({ ym: addMonths(first, i).slice(0, 7), total: 0, items: [] });
  const end = addMonths(first, n);
  for (const s of subs) {
    if (!(s.status === "activa" || (includeTrials && s.status === "prueba"))) continue;
    for (const d of occurrences(s, today, end)) {
      const b = buckets.find(x => x.ym === d.slice(0, 7));
      if (!b) continue;
      const amount = myCharge(s, st);
      b.total += amount; b.items.push({ id: s.id, name: s.name, date: d, amount });
    }
  }
  for (const b of buckets) b.items.sort((a, c) => a.date.localeCompare(c.date));
  return buckets;
}

// ---------- Avisos ----------
export type Level = "urgente" | "pronto" | "revisar" | "info";
export interface Alert { level: Level; subId: string; kind: string; title: string; detail: string; date?: string }
const LEVEL_ORDER: Record<Level, number> = { urgente: 0, pronto: 1, revisar: 2, info: 3 };
export const eur = (n: number) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: Math.abs(n) >= 1000 ? 0 : 2 }).format(n || 0);
const inDays = (n: number) => n === 0 ? "hoy" : n === 1 ? "mañana" : `en ${n} días`;

export function buildAlerts(subs: Sub[], st: Settings, today: string): Alert[] {
  const out: Alert[] = [];
  const active = subs.filter(s => s.status === "activa");
  for (const s of subs) {
    if (s.status === "cancelada" || s.status === "pausada") continue;
    const charge = eur(myCharge(s, st));
    if (s.status === "prueba") {
      if (!isIso(s.trialEnd)) out.push({ level: "revisar", subId: s.id, kind: "dato", title: `${s.name}: prueba sin fecha de fin`, detail: "Apunta cuándo termina la prueba para que te avise antes del primer cargo." });
      else {
        const n = daysBetween(today, s.trialEnd);
        if (n < 0) out.push({ level: "urgente", subId: s.id, kind: "prueba", title: `${s.name}: la prueba terminó el ${fmtDate(s.trialEnd)}`, detail: `Si no la cancelaste ya te están cobrando ${charge}. Márcala como activa o como cancelada.`, date: s.trialEnd });
        else if (n <= Math.max(10, s.remind)) out.push({ level: n <= 3 ? "urgente" : "pronto", subId: s.id, kind: "prueba", title: `${s.name}: la prueba termina ${inDays(n)}`, detail: `Después cobrarán ${charge} (${periodText(s)}). Cancela antes del ${fmtDate(s.trialEnd)} si no la quieres.`, date: s.trialEnd });
      }
      continue;
    }
    const next = nextRenewal(s, today);
    if (!next) { out.push({ level: "revisar", subId: s.id, kind: "dato", title: `${s.name}: falta la fecha de renovación`, detail: "Sin fecha no puedo avisarte ni colocarla en el calendario de cargos." }); }
    else {
      const n = daysBetween(today, next);
      const long = chargesPerYear(s) <= 1; // anual o más espaciada: el cargo duele y se olvida
      if (n <= s.remind) out.push({ level: n <= 2 ? "urgente" : "pronto", subId: s.id, kind: "renovacion", title: `${s.name} se renueva ${inDays(n)}`, detail: `Cargo de ${charge} el ${fmtDate(next)}${s.pay ? ` en ${s.pay}` : ""}.`, date: next });
      else if (long && n <= 45) out.push({ level: "pronto", subId: s.id, kind: "anual", title: `${s.name}: renovación ${periodText(s)} ${inDays(n)}`, detail: `Cargo de ${charge} el ${fmtDate(next)}. Es el momento de decidir si sigues, cambias de plan o cancelas.`, date: next });
    }
    const h = s.history || [];
    if (h.length >= 2) {
      const a = h[h.length - 2], b = h[h.length - 1];
      if (b.amount > a.amount && isIso(b.date) && daysBetween(b.date, today) <= 120 && daysBetween(b.date, today) >= 0) {
        const pct = a.amount > 0 ? Math.round((b.amount / a.amount - 1) * 100) : 0;
        const extra = (b.amount - a.amount) / Math.max(1, s.share || 1) * chargesPerYear(s);
        out.push({ level: "revisar", subId: s.id, kind: "subida", title: `${s.name} ha subido un ${pct} %`, detail: `De ${a.amount} a ${b.amount} ${s.currency} por cargo desde el ${fmtDate(b.date)}: ${eur(toEUR(extra, s.currency, st))} más al año.`, date: b.date });
      }
    }
    if (s.usage <= 1) out.push({ level: "revisar", subId: s.id, kind: "uso", title: `${s.name}: uso ${USAGE_LABEL[s.usage].toLowerCase()}`, detail: `Te cuesta ${eur(perYear(s, st))} al año. Candidata a cancelar o a bajar de plan.` });
    if (isIso(s.commitUntil)) {
      const n = daysBetween(today, s.commitUntil);
      if (n >= 0 && n <= 30) out.push({ level: "pronto", subId: s.id, kind: "permanencia", title: `${s.name}: la permanencia acaba ${inDays(n)}`, detail: "A partir de ese día puedes cancelar o renegociar sin penalización.", date: s.commitUntil });
      else if (n < 0 && n >= -60) out.push({ level: "info", subId: s.id, kind: "permanencia", title: `${s.name}: ya no tienes permanencia`, detail: `Terminó el ${fmtDate(s.commitUntil)}. Buen momento para pedir mejor precio.`, date: s.commitUntil });
    }
    const last = isIso(s.reviewed) ? s.reviewed : isIso(s.start) ? s.start : null;
    if (last && daysBetween(last, today) > st.reviewMonths * 30.44) out.push({ level: "info", subId: s.id, kind: "revision", title: `${s.name}: toca revisarla`, detail: `Última revisión: ${fmtDate(last)}. Comprueba precio, plan y uso, y pulsa «Revisada».` });
  }
  // Solapes: varias activas en la misma categoría
  const byCat = new Map<string, Sub[]>();
  for (const s of active) byCat.set(s.category, [...(byCat.get(s.category) || []), s]);
  for (const [cat, list] of byCat) {
    if (list.length < 2 || !OVERLAP_CATS.includes(cat)) continue;
    const total = list.reduce((a, s) => a + perYear(s, st), 0);
    out.push({ level: "revisar", subId: list[0].id, kind: "solape", title: `${list.length} suscripciones activas en «${cat}»`, detail: `${list.map(s => s.name).join(", ")}: ${eur(total)} al año entre todas. Mira si puedes alternarlas en vez de tenerlas juntas.` });
  }
  return out.sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level] || (a.date || "9").localeCompare(b.date || "9"));
}

// ---------- Categorías y catálogo de nombres (sin precios: cambian a menudo) ----------
export const CATEGORIES = ["Vídeo y TV", "Música y audio", "Nube y almacenamiento", "IA y software", "Prensa y lectura", "Juegos", "Deporte y salud", "Telefonía e internet", "Hogar y seguros", "Formación", "Web y dominios", "Otros"];
const OVERLAP_CATS = ["Vídeo y TV", "Música y audio", "Nube y almacenamiento", "IA y software", "Prensa y lectura", "Juegos"];
export const CATALOG: Record<string, string> = {
  "Netflix": "Vídeo y TV", "HBO Max": "Vídeo y TV", "Disney+": "Vídeo y TV", "Amazon Prime": "Vídeo y TV", "Movistar Plus+": "Vídeo y TV", "DAZN": "Vídeo y TV", "Apple TV+": "Vídeo y TV", "Filmin": "Vídeo y TV", "SkyShowtime": "Vídeo y TV", "YouTube Premium": "Vídeo y TV",
  "Spotify": "Música y audio", "Apple Music": "Música y audio", "Audible": "Música y audio",
  "iCloud+": "Nube y almacenamiento", "Google One": "Nube y almacenamiento", "Dropbox": "Nube y almacenamiento",
  "Claude": "IA y software", "ChatGPT": "IA y software", "Gemini": "IA y software", "GitHub Copilot": "IA y software", "Cursor": "IA y software", "Microsoft 365": "IA y software", "Adobe Creative Cloud": "IA y software", "Canva": "IA y software", "Notion": "IA y software", "1Password": "IA y software", "NordVPN": "IA y software",
  "Kindle Unlimited": "Prensa y lectura", "El País": "Prensa y lectura", "El Mundo": "Prensa y lectura", "Expansión": "Prensa y lectura", "Financial Times": "Prensa y lectura", "The Economist": "Prensa y lectura",
  "PlayStation Plus": "Juegos", "Nintendo Switch Online": "Juegos", "Xbox Game Pass": "Juegos", "Chess.com": "Juegos",
  "Gimnasio": "Deporte y salud", "Strava": "Deporte y salud", "Cuota del club": "Deporte y salud",
  "Móvil": "Telefonía e internet", "Fibra": "Telefonía e internet",
  "Seguro de hogar": "Hogar y seguros", "Alarma": "Hogar y seguros",
  "Duolingo": "Formación", "LinkedIn Premium": "Formación",
  "Vercel": "Web y dominios", "Supabase": "Web y dominios", "Dominio web": "Web y dominios",
};

// ---------- Calendario (.ics) ----------
const icsEsc = (t: string) => t.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const icsDate = (s: string) => s.replace(/-/g, "");
/** Un evento de día completo por suscripción, repetido con su periodicidad y con alarma previa. */
export function buildIcs(subs: Sub[], st: Settings, today: string, stamp = new Date()): string {
  const dt = stamp.toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  const L = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//joaco.org//Suscripciones//ES", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "X-WR-CALNAME:Suscripciones"];
  for (const s of subs) {
    if (s.status !== "activa" && s.status !== "prueba") continue;
    const next = nextRenewal(s, today);
    if (!next) continue;
    const e = Math.max(1, s.every || 1);
    const freq = s.unit === "week" ? "WEEKLY" : s.unit === "month" ? "MONTHLY" : "YEARLY";
    const title = s.status === "prueba" ? `Fin de prueba y primer cargo: ${s.name}` : `Renovación: ${s.name}`;
    L.push("BEGIN:VEVENT", `UID:${s.id}@suscripciones.joaco.org`, `DTSTAMP:${dt}`,
      `DTSTART;VALUE=DATE:${icsDate(next)}`, `DTEND;VALUE=DATE:${icsDate(addDays(next, 1))}`,
      `RRULE:FREQ=${freq};INTERVAL=${e}`,
      `SUMMARY:${icsEsc(`${title} (${eur(myCharge(s, st))})`)}`,
      `DESCRIPTION:${icsEsc([`${periodText(s)} · ${s.category}`, s.pay && `Pago: ${s.pay}`, s.url && `Gestionar: ${s.url}`, s.notes].filter(Boolean).join("\n"))}`,
      "TRANSP:TRANSPARENT",
      "BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${icsEsc(title)}`, `TRIGGER:${s.remind > 1 ? `-P${s.remind - 1}DT15H` : s.remind === 1 ? "-PT15H" : "PT9H"}`, "END:VALARM",
      "END:VEVENT");
  }
  L.push("END:VCALENDAR");
  return L.join("\r\n") + "\r\n";
}

// ---------- CSV ----------
export function buildCsv(subs: Sub[], st: Settings, today: string): string {
  const head = ["Nombre", "Categoría", "Estado", "Importe", "Moneda", "Periodicidad", "Mi coste al mes (EUR)", "Mi coste al año (EUR)", "Próxima renovación", "Medio de pago", "Quién la usa", "Uso", "Notas"];
  const q = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const num = (n: number) => n.toFixed(2).replace(".", ",");
  const rows = subs.map(s => [s.name, s.category, s.status, num(s.amount), s.currency, periodText(s), num(perMonth(s, st)), num(perYear(s, st)), nextRenewal(s, today) || "", s.pay, s.owner, USAGE_LABEL[s.usage], s.notes || ""].map(q).join(";"));
  return "\ufeff" + [head.map(q).join(";"), ...rows].join("\r\n");
}

// ---------- Saneado de datos importados ----------
export function sanitize(raw: any, today: string): Sub | null {
  if (!raw || typeof raw !== "object" || !String(raw.name || "").trim()) return null;
  const amount = Number(raw.amount) || 0;
  const unit: Unit = ["week", "month", "year"].includes(raw.unit) ? raw.unit : "month";
  const status: Status = ["activa", "prueba", "pausada", "cancelada"].includes(raw.status) ? raw.status : "activa";
  const cur: Currency = ["EUR", "USD", "GBP"].includes(raw.currency) ? raw.currency : "EUR";
  const iso = (v: any) => (isIso(v) ? v : undefined);
  const history = Array.isArray(raw.history) ? raw.history.filter((p: any) => p && isIso(p.date) && isFinite(Number(p.amount))).map((p: any) => ({ date: p.date, amount: Number(p.amount) })) : [];
  return {
    id: String(raw.id || Math.random().toString(36).slice(2) + Date.now().toString(36)),
    name: String(raw.name).trim().slice(0, 80), category: String(raw.category || "Otros").slice(0, 40),
    amount, currency: cur, every: Math.max(1, Math.round(Number(raw.every) || 1)), unit,
    anchor: iso(raw.anchor) || "", start: iso(raw.start), status, trialEnd: iso(raw.trialEnd), commitUntil: iso(raw.commitUntil),
    pay: String(raw.pay || "").slice(0, 60), owner: String(raw.owner || "").slice(0, 40),
    share: Math.max(1, Math.round(Number(raw.share) || 1)),
    usage: ([0, 1, 2, 3].includes(Number(raw.usage)) ? Number(raw.usage) : 2) as Sub["usage"],
    usesPerMonth: Number(raw.usesPerMonth) > 0 ? Number(raw.usesPerMonth) : undefined,
    remind: Math.max(0, Math.min(60, Math.round(Number(raw.remind ?? 7)))),
    annualAlt: Number(raw.annualAlt) > 0 ? Number(raw.annualAlt) : undefined,
    url: raw.url ? String(raw.url).slice(0, 300) : undefined, notes: raw.notes ? String(raw.notes).slice(0, 1000) : undefined,
    reviewed: iso(raw.reviewed), cancelledOn: iso(raw.cancelledOn),
    history: history.length ? history : [{ date: iso(raw.start) || today, amount }],
  };
}

/** Datos inventados para probar la app. Los importes son de ejemplo, no precios reales. */
export function sampleData(today: string): Sub[] {
  const mk = (o: Partial<Sub> & { name: string }) => sanitize({ category: CATALOG[o.name] || "Otros", currency: "EUR", every: 1, unit: "month", status: "activa", share: 1, usage: 2, remind: 7, pay: "Tarjeta ··0000", owner: "Familia", start: addMonths(today, -14), reviewed: addMonths(today, -2), ...o }, today)!;
  return [
    mk({ id: "ej-video", name: "Vídeo A (ejemplo)", category: "Vídeo y TV", amount: 14, anchor: addDays(today, 4), usage: 3, usesPerMonth: 20 }),
    mk({ id: "ej-video2", name: "Vídeo B (ejemplo)", category: "Vídeo y TV", amount: 10, reviewed: addMonths(today, -9), anchor: addDays(today, 19), usage: 1, usesPerMonth: 1 }),
    mk({ id: "ej-musica", name: "Música familiar (ejemplo)", category: "Música y audio", amount: 18, share: 2, anchor: addDays(today, 11), usage: 3, usesPerMonth: 40, annualAlt: 180 }),
    mk({ id: "ej-nube", name: "Nube 2 TB (ejemplo)", category: "Nube y almacenamiento", amount: 10, anchor: addDays(today, 23), usage: 3 }),
    mk({ id: "ej-ia", name: "Asistente IA (ejemplo)", category: "IA y software", amount: 20, currency: "USD", anchor: addDays(today, 2), usage: 3, usesPerMonth: 60, history: [{ date: addMonths(today, -14), amount: 18 }, { date: addMonths(today, -1), amount: 20 }] }),
    mk({ id: "ej-prensa", name: "Periódico digital (ejemplo)", category: "Prensa y lectura", amount: 96, unit: "year", anchor: addDays(today, 30), usage: 1, usesPerMonth: 3 }),
    mk({ id: "ej-dominio", name: "Dominio web (ejemplo)", category: "Web y dominios", amount: 15, unit: "year", anchor: addMonths(today, 5), usage: 3 }),
    mk({ id: "ej-gim", name: "Gimnasio (ejemplo)", category: "Deporte y salud", amount: 45, anchor: addDays(today, 15), usage: 2, usesPerMonth: 6, commitUntil: addDays(today, 20), pay: "Recibo banco" }),
    mk({ id: "ej-prueba", name: "App de idiomas (ejemplo)", category: "Formación", amount: 84, unit: "year", status: "prueba", trialEnd: addDays(today, 5), anchor: addDays(today, 5), usage: 1 }),
    mk({ id: "ej-baja", name: "Deportes TV (ejemplo)", category: "Vídeo y TV", amount: 30, status: "cancelada", cancelledOn: addMonths(today, -2), anchor: addMonths(today, -2), usage: 0 }),
  ];
}
