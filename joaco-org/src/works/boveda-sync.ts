/* ============================================================
   BÓVEDA · documentos cifrados de la cuenta y su progreso
   - Los documentos viven cifrados en /boveda/<id>.bin. La clave
     sale de un código de activación (PBKDF2) y solo la tiene quien
     tiene el código; en el repositorio solo hay bytes cifrados.
   - El progreso de cada documento y las claves ya añadidas se
     sincronizan con Supabase (tabla public.app_store) como un
     mapa clave → [valor, fecha]: de cada clave gana la fecha más
     reciente, así que dos dispositivos nunca se pisan.
   Sin React: lo usa Documentos.tsx.
   ============================================================ */

export type Entry = [unknown, number];
export interface Wire { v: 1; e: Record<string, Entry> }
export const emptyWire = (): Wire => ({ v: 1, e: {} });

export function validWire(w: any): w is Wire {
  if (!w || w.v !== 1 || !w.e || typeof w.e !== "object" || Array.isArray(w.e)) return false;
  for (const k of Object.keys(w.e)) {
    const x = w.e[k];
    if (!Array.isArray(x) || x.length !== 2 || typeof x[1] !== "number") return false;
  }
  return true;
}

/** Une dos versiones: de cada clave, la de fecha más reciente. Conmutativa: da igual el orden. */
export function mergeWire(a: Wire, b: Wire): Wire {
  const e: Record<string, Entry> = {};
  const A = a?.e || {}, B = b?.e || {};
  for (const k of new Set([...Object.keys(A), ...Object.keys(B)])) {
    const x = A[k], y = B[k];
    if (!x) { e[k] = y; continue; }
    if (!y) { e[k] = x; continue; }
    e[k] = y[1] > x[1] || (y[1] === x[1] && JSON.stringify(y[0]) > JSON.stringify(x[0])) ? y : x;
  }
  return { v: 1, e };
}

/** Huella estable para comparar versiones. Usa el mismo orden que la página del documento. */
export function wireKey(w: Wire): string {
  const e = w?.e || {};
  return JSON.stringify(Object.keys(e).sort().map((k) => [k, e[k]]));
}

// ---------- Acceso remoto ----------
export type WriteResult = "ok" | "conflict";
export interface Remote {
  fetch(): Promise<{ data: unknown; rev: number } | null>;
  insert(data: Wire): Promise<WriteResult>;
  update(data: Wire, expectedRev: number): Promise<WriteResult>;
}

/** Lee lo remoto, fusiona con lo local y escribe si hace falta. Reintenta si otro dispositivo escribe a la vez. */
export async function syncWire(local: Wire, remote: Remote, maxTries = 4): Promise<{ wire: Wire; rev: number; pushed: boolean }> {
  for (let i = 0; i < maxTries; i++) {
    const row = await remote.fetch();
    const theirs = row && validWire(row.data) ? (row.data as Wire) : null;
    const merged = theirs ? mergeWire(local, theirs) : local;
    if (row && theirs && wireKey(merged) === wireKey(theirs)) return { wire: merged, rev: row.rev, pushed: false };
    const res = row ? await remote.update(merged, row.rev) : await remote.insert(merged);
    if (res === "ok") return { wire: merged, rev: row ? row.rev + 1 : 1, pushed: true };
    local = merged; // lo fusionado no se pierde: entra en el siguiente intento
  }
  throw new Error(`No se pudo guardar tras ${maxTries} intentos: otro dispositivo escribía a la vez.`);
}

/** Adaptador para Supabase (tabla public.app_store, ver supabase/app_store.sql). */
export function appRemote(sb: any, userId: string, app: string): Remote {
  const T = "app_store";
  const fail = (e: any): never => { throw Object.assign(new Error(e?.message || String(e)), { code: e?.code }); };
  return {
    async fetch() {
      const { data, error } = await sb.from(T).select("data, rev").eq("user_id", userId).eq("app", app).maybeSingle();
      if (error) fail(error);
      return data ? { data: data.data, rev: Number(data.rev) || 0 } : null;
    },
    async insert(doc) {
      const { error } = await sb.from(T).insert({ user_id: userId, app, data: doc, rev: 1 });
      if (error) { if (error.code === "23505") return "conflict"; fail(error); }
      return "ok";
    },
    async update(doc, expectedRev) {
      const { data, error } = await sb.from(T).update({ data: doc, rev: expectedRev + 1 }).eq("user_id", userId).eq("app", app).eq("rev", expectedRev).select("rev");
      if (error) fail(error);
      return Array.isArray(data) && data.length === 1 ? "ok" : "conflict";
    },
  };
}

/** Traduce los errores de Supabase y de red a algo que se entienda. */
export function friendly(e: unknown): string {
  const m = String((e as any)?.message || e || "");
  const code = String((e as any)?.code || "");
  if (/Invalid login credentials/i.test(m)) return "Correo o contraseña incorrectos.";
  if (/Email not confirmed/i.test(m)) return "Falta confirmar el correo: abre el enlace que te ha llegado y vuelve a entrar.";
  if (/User already registered/i.test(m)) return "Ya existe una cuenta con ese correo. Usa «Entrar».";
  if (/Password should be at least/i.test(m)) return "La contraseña es demasiado corta (mínimo 6 caracteres).";
  if (/rate limit|too many/i.test(m)) return "Demasiados intentos seguidos. Espera un minuto y vuelve a probar.";
  if (code === "42P01" || code === "PGRST205" || /app_store.*(does not exist|not find)|Could not find the table/i.test(m))
    return "Falta crear la tabla de sincronización en Supabase: ejecuta supabase/app_store.sql en el SQL Editor.";
  if (/Failed to fetch|NetworkError|Load failed/i.test(m)) return "Sin conexión con el servidor. Lo hecho queda guardado aquí y se subirá al volver la conexión.";
  if (/JWT|token/i.test(m)) return "La sesión ha caducado. Vuelve a entrar.";
  return m || "Error desconocido.";
}

// ---------- Cifrado ----------
export interface DocEntry { id: string; path: string; salt: string; iter: number }
const b64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const toB64 = (u: Uint8Array) => { let s = ""; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000)); return btoa(s); };

/** El código se escribe como se quiera (minúsculas, guiones, espacios): solo cuentan letras y números. */
export const normCode = (c: string) => c.toUpperCase().replace(/[^A-Z0-9]/g, "");

/** Deriva la clave del documento a partir del código (PBKDF2-SHA256). Devuelve la clave en base64. */
export async function deriveKey(code: string, d: DocEntry): Promise<string> {
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(normCode(code)), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: b64(d.salt), iterations: d.iter, hash: "SHA-256" }, base, 256);
  return toB64(new Uint8Array(bits));
}

/** Descifra un fichero .bin (12 bytes de vector + texto cifrado AES-GCM). Lanza si la clave no es la suya. */
export async function decryptDoc(keyB64: string, buf: ArrayBuffer): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", b64(keyB64), { name: "AES-GCM" }, false, ["decrypt"]);
  const all = new Uint8Array(buf);
  return new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: all.subarray(0, 12) }, key, all.subarray(12)));
}

export function titleOf(html: Uint8Array): string {
  const head = new TextDecoder().decode(html.subarray(0, 4000));
  const m = head.match(/<title>([^<]{1,120})<\/title>/i);
  return m ? m[1].trim() : "Documento";
}
