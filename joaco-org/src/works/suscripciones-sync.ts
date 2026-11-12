/* ============================================================
   SUSCRIPCIONES · sincronización entre dispositivos
   - Fusión por suscripción: gana el cambio más reciente de cada una
     (updatedAt), y las bajas definitivas (borrados) viajan como
     «lápidas» con su fecha para que no resuciten desde otro aparato.
   - Escritura con control de versión (rev): si otro dispositivo ha
     escrito entre medias, se vuelve a leer, fusionar y escribir.
   Sin React ni Supabase: el acceso remoto llega como adaptador.
   ============================================================ */
import { DEFAULT_SETTINGS, sanitize, todayIso, type Settings, type Sub } from "./suscripciones-core";

export interface Doc {
  subs: Sub[];
  settings: Settings;
  settingsAt: number;              // ms de la última edición de ajustes
  deleted: Record<string, number>; // id → ms en que se borró
}
export const emptyDoc = (): Doc => ({ subs: [], settings: DEFAULT_SETTINGS, settingsAt: 0, deleted: {} });

const TOMBSTONE_TTL = 400 * 86400000; // las lápidas de más de ~13 meses se olvidan

/** Lee cualquier cosa guardada (versión local antigua, copia exportada, fila remota) y la deja en forma. */
export function parseDoc(o: any, today = todayIso()): Doc {
  const list = Array.isArray(o) ? o : Array.isArray(o?.subs) ? o.subs : [];
  const subs: Sub[] = [];
  const seen = new Set<string>();
  for (const x of list) {
    const s = sanitize(x, today);
    if (!s || seen.has(s.id)) continue;
    seen.add(s.id);
    s.updatedAt = Number(x?.updatedAt) > 0 ? Number(x.updatedAt) : 0;
    subs.push(s);
  }
  const fx = o?.settings?.fx || {};
  const settings: Settings = {
    fx: { USD: Number(fx.USD) > 0 ? Number(fx.USD) : DEFAULT_SETTINGS.fx.USD, GBP: Number(fx.GBP) > 0 ? Number(fx.GBP) : DEFAULT_SETTINGS.fx.GBP },
    reviewMonths: Number(o?.settings?.reviewMonths) > 0 ? Number(o.settings.reviewMonths) : DEFAULT_SETTINGS.reviewMonths,
  };
  const deleted: Record<string, number> = {};
  if (o?.deleted && typeof o.deleted === "object") for (const [k, v] of Object.entries(o.deleted)) if (Number(v) > 0) deleted[k] = Number(v);
  return { subs, settings, settingsAt: Number(o?.settingsAt) > 0 ? Number(o.settingsAt) : 0, deleted };
}

/** Une dos versiones. Conmutativa en el contenido: da lo mismo el orden en que se fusionen. */
export function mergeDocs(a: Doc, b: Doc, now = Date.now()): Doc {
  const deleted: Record<string, number> = {};
  for (const src of [a.deleted, b.deleted]) for (const [k, v] of Object.entries(src)) if (v > (deleted[k] || 0)) deleted[k] = v;
  for (const k of Object.keys(deleted)) if (now - deleted[k] > TOMBSTONE_TTL) delete deleted[k];

  const pick = new Map<string, Sub>();
  const order: string[] = [];
  for (const s of [...a.subs, ...b.subs]) {
    const cur = pick.get(s.id);
    if (!cur) { pick.set(s.id, s); order.push(s.id); continue; }
    const ta = cur.updatedAt || 0, tb = s.updatedAt || 0;
    // Empate (mismo milisegundo en dos aparatos): desempate estable por contenido, para que ambos lleguen al mismo resultado.
    if (tb > ta || (tb === ta && JSON.stringify(s) > JSON.stringify(cur))) pick.set(s.id, s);
  }
  const subs = order.map(id => pick.get(id)!).filter(s => !(deleted[s.id] && deleted[s.id] >= (s.updatedAt || 0)));
  // Una lápida más antigua que la última edición no sirve: alguien la volvió a crear o editar después.
  for (const s of subs) if (deleted[s.id]) delete deleted[s.id];

  const useB = b.settingsAt > a.settingsAt || (b.settingsAt === a.settingsAt && JSON.stringify(b.settings) > JSON.stringify(a.settings));
  return { subs, settings: useB ? b.settings : a.settings, settingsAt: Math.max(a.settingsAt, b.settingsAt), deleted };
}

/** Huella para comparar versiones sin importar el orden de la lista. */
export function docKey(d: Doc): string {
  const subs = [...d.subs].sort((x, y) => x.id.localeCompare(y.id)).map(s => JSON.stringify(s, Object.keys(s).sort()));
  const del = Object.keys(d.deleted).sort().map(k => `${k}:${d.deleted[k]}`);
  return JSON.stringify([subs, d.settings, d.settingsAt, del]);
}

// ---------- Acceso remoto ----------
export type WriteResult = "ok" | "conflict";
export interface Remote {
  fetch(): Promise<{ data: unknown; rev: number } | null>;
  insert(data: Doc): Promise<WriteResult>;             // "conflict" si la fila ya existía
  update(data: Doc, expectedRev: number): Promise<WriteResult>; // "conflict" si rev ya no es la esperada
}
export interface SyncResult { doc: Doc; pushed: boolean; pulled: boolean; rev: number }

/** Lee lo remoto, fusiona con lo local y, si hace falta, escribe. Reintenta ante escrituras simultáneas. */
export async function syncOnce(local: Doc, remote: Remote, now = Date.now(), maxTries = 4): Promise<SyncResult> {
  let lastErr: unknown = null;
  for (let i = 0; i < maxTries; i++) {
    const row = await remote.fetch();
    const theirs = row ? parseDoc(row.data) : null;
    const merged = theirs ? mergeDocs(local, theirs, now) : mergeDocs(local, emptyDoc(), now);
    const pulled = !!theirs && docKey(merged) !== docKey(local);
    if (theirs && docKey(merged) === docKey(theirs)) return { doc: merged, pushed: false, pulled, rev: row!.rev };
    const res = row ? await remote.update(merged, row.rev) : await remote.insert(merged);
    if (res === "ok") return { doc: merged, pushed: true, pulled, rev: row ? row.rev + 1 : 1 };
    lastErr = res;
    local = merged; // lo fusionado no se pierde: entra en el siguiente intento
  }
  throw new Error(`No se pudo guardar tras ${maxTries} intentos (otro dispositivo escribía a la vez): ${String(lastErr)}`);
}

/** Adaptador para Supabase (tabla public.sx_store, ver supabase/suscripciones.sql). */
export function supabaseRemote(sb: any, userId: string): Remote {
  const T = "sx_store";
  const fail = (e: any): never => { throw new Error(e?.message || String(e)); };
  return {
    async fetch() {
      const { data, error } = await sb.from(T).select("data, rev").eq("user_id", userId).maybeSingle();
      if (error) fail(error);
      return data ? { data: data.data, rev: Number(data.rev) || 0 } : null;
    },
    async insert(doc) {
      const { error } = await sb.from(T).insert({ user_id: userId, data: doc, rev: 1 });
      if (error) { if (error.code === "23505") return "conflict"; fail(error); }
      return "ok";
    },
    async update(doc, expectedRev) {
      const { data, error } = await sb.from(T).update({ data: doc, rev: expectedRev + 1 }).eq("user_id", userId).eq("rev", expectedRev).select("rev");
      if (error) fail(error);
      return Array.isArray(data) && data.length === 1 ? "ok" : "conflict";
    },
  };
}

/** Traduce los errores de Supabase/red a algo que se entienda. */
export function friendlyError(e: unknown): string {
  const m = String((e as any)?.message || e || "");
  if (/Invalid login credentials/i.test(m)) return "Correo o contraseña incorrectos.";
  if (/Email not confirmed/i.test(m)) return "Falta confirmar el correo: abre el enlace que te ha llegado y vuelve a entrar.";
  if (/User already registered/i.test(m)) return "Ya existe una cuenta con ese correo. Usa «Entrar».";
  if (/Password should be at least/i.test(m)) return "La contraseña es demasiado corta (mínimo 6 caracteres).";
  if (/rate limit|too many/i.test(m)) return "Demasiados intentos seguidos. Espera un minuto y vuelve a probar.";
  if (/relation .*sx_store.* does not exist|Could not find the table/i.test(m)) return "Falta crear la tabla en Supabase: ejecuta supabase/suscripciones.sql (ver Guía).";
  if (/Failed to fetch|NetworkError|Load failed/i.test(m)) return "Sin conexión con el servidor. Los cambios quedan guardados aquí y se subirán al volver la conexión.";
  if (/JWT|token/i.test(m)) return "La sesión ha caducado. Vuelve a entrar.";
  return m || "Error desconocido.";
}
