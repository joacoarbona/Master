import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { getSupabase } from "../lib/supabase";
import {
  appRemote, decryptDoc, deriveKey, friendly, mergeWire, normCode, syncWire, titleOf, validWire, wireKey,
  type DocEntry, type Wire,
} from "./boveda-sync";

/* ============================================================
   DOCUMENTOS DE LA CUENTA (#/app/documentos)
   Abre documentos cifrados de /boveda/ con su código de activación
   y sincroniza su progreso entre dispositivos con la cuenta de
   Supabase del portal. Ver supabase/DOCUMENTOS.md.
   Protocolo con el documento (iframe, mismo origen):
     doc → app:ready · app:state {wire}
     aquí → host:init {wire,status} · host:state {wire} · host:status {text}
   ============================================================ */

const K_KEYS = "boveda-keys-v1";     // Wire: id del documento → [clave en base64, fecha]
const K_TITLES = "boveda-titles-v1"; // id → título
const K_APP = (app: string) => "boveda-app-v1:" + app;
const KEYS_APP = "boveda";
const appOf = (id: string) => "d-" + id;
const ORIGIN = () => window.location.origin;

function loadJson<T>(k: string, fallback: T): T {
  try { const raw = localStorage.getItem(k); if (raw) return JSON.parse(raw) as T; } catch { /* sin almacenamiento */ }
  return fallback;
}
function saveJson(k: string, v: unknown) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin almacenamiento */ } }
function loadWire(k: string): Wire { const w = loadJson<any>(k, null); return validWire(w) ? w : { v: 1, e: {} }; }

type Status = "local" | "syncing" | "ok" | "offline" | "error";
interface SyncState { s: Status; at: number | null; msg?: string }
const hhmm = (t: number) => new Date(t).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
function statusText(st: SyncState, hasUser: boolean): string {
  switch (st.s) {
    case "syncing": return "Sincronizando…";
    case "ok": return "Sincronizado" + (st.at ? " · " + hhmm(st.at) : "");
    case "offline": return "Sin conexión · se subirá al volver";
    case "error": return st.msg || "Error al sincronizar";
    default: return hasUser ? "Guardado en este dispositivo" : "Solo en este dispositivo · entra en tu cuenta para sincronizar";
  }
}

// ---------- Cuenta ----------
interface User { id: string; email: string | null }
const AUTH_PARAMS = ["sx_auth", "sx_reset", "code", "error", "error_code", "error_description"];
function cleanUrl() {
  try {
    const u = new URL(window.location.href); let changed = false;
    for (const p of AUTH_PARAMS) if (u.searchParams.has(p)) { u.searchParams.delete(p); changed = true; }
    if (changed) window.history.replaceState(window.history.state, "", u.pathname + u.search + u.hash);
  } catch { /* sin history */ }
}
function useAccount() {
  const sb = getSupabase();
  const [ready, setReady] = useState(!sb);
  const [user, setUser] = useState<User | null>(null);
  const [recovery, setRecovery] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  useEffect(() => {
    if (!sb) return;
    const q = new URLSearchParams(window.location.search);
    const fromReset = q.has("sx_reset"), fromConfirm = q.has("sx_auth");
    const apply = (session: any) => { const u = session?.user; setUser((cur) => (u ? (cur?.id === u.id ? cur : { id: u.id, email: u.email ?? null }) : null)); };
    sb.auth.getSession().then(({ data }: any) => {
      apply(data?.session);
      if (fromReset && data?.session) setRecovery(true);
      if ((fromReset || fromConfirm) && !data?.session) setNotice(fromReset
        ? "El enlace para cambiar la contraseña ha caducado o se abrió en otro navegador. Pide otro y ábrelo en este mismo navegador."
        : "Correo confirmado. Entra con tu correo y tu contraseña.");
      setReady(true); cleanUrl();
    }).catch(() => setReady(true));
    const { data: sub } = sb.auth.onAuthStateChange((ev: string, session: any) => { apply(session); if (ev === "PASSWORD_RECOVERY") setRecovery(true); });
    return () => sub?.subscription?.unsubscribe();
  }, [sb]);
  return { sb, ready, user, recovery, setRecovery, notice, setNotice };
}
type Acct = ReturnType<typeof useAccount>;

function AccountBox({ acct, keysState, onSync }: { acct: Acct; keysState: SyncState; onSync: () => void }) {
  const [mode, setMode] = useState<"in" | "up" | "reset">("in");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const sb = acct.sb;
  if (!sb) return <p>La sincronización no está configurada en este sitio. Todo se guarda en este dispositivo.</p>;
  if (!acct.ready) return <p className="bv-muted">Comprobando la sesión…</p>;
  const act = async (f: () => Promise<{ ok: boolean; text: string } | null>) => {
    setBusy(true); setMsg(null);
    try { setMsg(await f()); } catch (e) { setMsg({ ok: false, text: friendly(e) }); } finally { setBusy(false); }
  };
  if (acct.recovery) {
    const submit = (e: FormEvent) => { e.preventDefault(); act(async () => {
      const { error } = await sb.auth.updateUser({ password: pw }); if (error) return { ok: false, text: friendly(error) };
      acct.setRecovery(false); setPw(""); return { ok: true, text: "Contraseña cambiada." };
    }); };
    return (
      <form className="bv-form" onSubmit={submit}>
        <p>Escribe tu nueva contraseña.</p>
        <label htmlFor="bv-newpw">Nueva contraseña</label>
        <input id="bv-newpw" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} minLength={6} required />
        <div className="bv-row"><button className="bv-btn" disabled={busy || pw.length < 6}>Guardar la contraseña</button></div>
        {msg && <p className={msg.ok ? "bv-ok" : "bv-err"} role="status">{msg.text}</p>}
      </form>
    );
  }
  if (acct.user) return (
    <div className="bv-acct">
      <p>Has entrado como <b>{acct.user.email || "tu cuenta"}</b>.</p>
      <p className={"bv-pill " + keysState.s}>{statusText(keysState, true)}</p>
      <div className="bv-row">
        <button className="bv-btn2" onClick={onSync} disabled={keysState.s === "syncing"}>Sincronizar ahora</button>
        <button className="bv-btn2 ghost" onClick={() => sb.auth.signOut().catch(() => undefined)}>Salir</button>
      </div>
    </div>
  );
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (mode === "in") act(async () => { const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password: pw }); if (error) return { ok: false, text: friendly(error) }; setPw(""); acct.setNotice(null); return null; });
    else if (mode === "up") act(async () => {
      const { data, error } = await sb.auth.signUp({ email: email.trim(), password: pw, options: { emailRedirectTo: `${ORIGIN()}/?sx_auth=1#/app/documentos` } });
      if (error) return { ok: false, text: friendly(error) };
      setPw("");
      return data?.session ? null : { ok: true, text: "Te hemos enviado un correo para confirmar la cuenta. Ábrelo en este dispositivo y vuelve a entrar aquí." };
    });
    else act(async () => {
      const { error } = await sb.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${ORIGIN()}/?sx_reset=1#/app/documentos` });
      if (error) return { ok: false, text: friendly(error) };
      return { ok: true, text: "Si hay una cuenta con ese correo, te llegará un enlace. Ábrelo en este mismo navegador." };
    });
  };
  return (
    <form className="bv-form" onSubmit={submit}>
      <div className="bv-tabs" role="tablist">
        {([["in", "Entrar"], ["up", "Crear cuenta"], ["reset", "He olvidado la contraseña"]] as const).map(([m, l]) => (
          <button key={m} type="button" role="tab" aria-selected={mode === m} className={mode === m ? "on" : ""} onClick={() => { setMode(m); setMsg(null); }}>{l}</button>
        ))}
      </div>
      {acct.notice && <p className="bv-note">{acct.notice}</p>}
      <label htmlFor="bv-email">Correo</label>
      <input id="bv-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      {mode !== "reset" && <>
        <label htmlFor="bv-pw">Contraseña</label>
        <input id="bv-pw" type="password" autoComplete={mode === "up" ? "new-password" : "current-password"} value={pw} onChange={(e) => setPw(e.target.value)} minLength={6} required />
      </>}
      <div className="bv-row"><button className="bv-btn" disabled={busy}>{busy ? "Un momento…" : mode === "in" ? "Entrar" : mode === "up" ? "Crear la cuenta" : "Enviar el enlace"}</button></div>
      {msg && <p className={msg.ok ? "bv-ok" : "bv-err"} role="status">{msg.text}</p>}
      <p className="bv-muted">Es la misma cuenta que usan otras apps de joaco.org, como Suscripciones.</p>
    </form>
  );
}

// ---------- Visor con sincronización ----------
function Viewer({ doc, sb, uid, onClose }: { doc: { id: string; url: string; title: string }; sb: any; uid: string | null; onClose: () => void }) {
  const app = appOf(doc.id);
  const frame = useRef<HTMLIFrameElement>(null);
  const local = useRef<Wire>(loadWire(K_APP(app)));
  const sent = useRef("");
  const rev = useRef<number | null>(null);
  const running = useRef(false);
  const again = useRef(false);
  const [st, setSt] = useState<SyncState>({ s: "local", at: null });
  const text = statusText(st, !!uid);
  const textRef = useRef(text); textRef.current = text;

  const post = (m: unknown) => { try { frame.current?.contentWindow?.postMessage(m, ORIGIN()); } catch { /* marco cerrado */ } };
  const pushToFrame = () => { const k = wireKey(local.current); if (k !== sent.current) { post({ type: "host:state", wire: local.current }); sent.current = k; } };

  const run = useCallback(async () => {
    if (!sb || !uid) { setSt({ s: "local", at: null }); return; }
    if (running.current) { again.current = true; return; }
    running.current = true;
    setSt((x) => ({ ...x, s: "syncing" }));
    try {
      do {
        again.current = false;
        const r = await syncWire(local.current, appRemote(sb, uid, app));
        rev.current = r.rev;
        local.current = mergeWire(local.current, r.wire);
        saveJson(K_APP(app), local.current);
        pushToFrame();
      } while (again.current);
      setSt({ s: "ok", at: Date.now() });
    } catch (e) {
      setSt({ s: typeof navigator !== "undefined" && navigator.onLine === false ? "offline" : "error", at: null, msg: friendly(e) });
    } finally { running.current = false; }
  }, [sb, uid, app]);

  // Mensajes del documento
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onMsg = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow || e.origin !== ORIGIN()) return;
      const d: any = e.data || {};
      if (d.type === "app:ready") {
        post({ type: "host:init", wire: local.current, status: textRef.current });
        sent.current = wireKey(local.current);
        run();
      } else if (d.type === "app:state" && validWire(d.wire)) {
        local.current = mergeWire(local.current, d.wire);
        saveJson(K_APP(app), local.current);
        sent.current = wireKey(d.wire);
        if (timer) clearTimeout(timer);
        timer = setTimeout(run, 1200);
      }
    };
    window.addEventListener("message", onMsg);
    return () => { window.removeEventListener("message", onMsg); if (timer) clearTimeout(timer); };
  }, [run, app]);

  // Estado de la sincronización, también dentro del documento
  useEffect(() => { post({ type: "host:status", text }); }, [text]);

  // Al entrar en la cuenta, al volver a la pestaña, al recuperar la conexión, cada 5 minutos y en directo
  useEffect(() => {
    if (!sb || !uid) return;
    run();
    const onVis = () => { if (document.visibilityState === "visible") run(); };
    const onOnline = () => run();
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("online", onOnline);
    const iv = setInterval(() => { if (document.visibilityState === "visible") run(); }, 5 * 60000);
    let ch: any = null;
    try {
      ch = sb.channel(`app-store-${uid}-${app}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "app_store", filter: `user_id=eq.${uid}` }, (p: any) => {
          if (p?.new?.app === app && Number(p?.new?.rev) !== rev.current) run();
        })
        .subscribe();
    } catch { /* sin realtime: queda el refresco al volver a la pestaña */ }
    return () => {
      document.removeEventListener("visibilitychange", onVis); window.removeEventListener("online", onOnline); clearInterval(iv);
      if (ch) sb.removeChannel(ch);
    };
  }, [sb, uid, app, run]);

  return (
    <div className="bv-view">
      <style>{CSS}</style>
      <div className="bv-bar">
        <button onClick={onClose}>← Documentos</button>
        <span className="bv-vt">{doc.title}</span>
        <span className={"bv-pill " + st.s} role="status">{text}</span>
      </div>
      <iframe ref={frame} src={doc.url} title={doc.title} />
    </div>
  );
}

// ---------- Página ----------
export default function Documentos() {
  const acct = useAccount();
  const uid = acct.user?.id || null;
  const [idx, setIdx] = useState<DocEntry[] | null>(null);
  const [idxErr, setIdxErr] = useState("");
  const [keys, setKeys] = useState<Wire>(() => loadWire(K_KEYS));
  const [titles, setTitles] = useState<Record<string, string>>(() => loadJson(K_TITLES, {}));
  const [keysState, setKeysState] = useState<SyncState>({ s: "local", at: null });
  const [open, setOpen] = useState<{ id: string; url: string; title: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [code, setCode] = useState("");
  const [forget, setForget] = useState(false);
  const bins = useRef(new Map<string, ArrayBuffer>());
  const keysRef = useRef(keys); keysRef.current = keys;

  useEffect(() => {
    fetch("/boveda/indice.json", { cache: "no-cache" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j) => setIdx(Array.isArray(j?.docs) ? j.docs.filter((d: any) => d && /^[a-f0-9]{8,32}$/.test(d.id) && typeof d.path === "string") : []))
      .catch(() => { setIdx([]); setIdxErr("No se ha podido cargar la lista de documentos. Comprueba la conexión y vuelve a abrir la página."); });
  }, []);

  const saveKeys = (w: Wire) => { keysRef.current = w; setKeys(w); saveJson(K_KEYS, w); };
  const saveTitle = (id: string, t: string) => setTitles((cur) => { const n = { ...cur, [id]: t }; saveJson(K_TITLES, n); return n; });

  const syncKeys = useCallback(async () => {
    if (!acct.sb || !uid) { setKeysState({ s: "local", at: null }); return; }
    setKeysState((x) => ({ ...x, s: "syncing" }));
    try {
      const r = await syncWire(keysRef.current, appRemote(acct.sb, uid, KEYS_APP));
      saveKeys(mergeWire(keysRef.current, r.wire));
      setKeysState({ s: "ok", at: Date.now() });
    } catch (e) {
      setKeysState({ s: typeof navigator !== "undefined" && navigator.onLine === false ? "offline" : "error", at: null, msg: friendly(e) });
    }
  }, [acct.sb, uid]);
  useEffect(() => { if (uid) syncKeys(); }, [uid, syncKeys]);

  const keyOf = (id: string): string | null => { const x = keys.e[id]; return x && typeof x[0] === "string" && x[0] ? (x[0] as string) : null; };
  const docs = idx || [];
  const unlocked = docs.filter((d) => keyOf(d.id));
  const pending = docs.filter((d) => !keyOf(d.id));

  const bin = async (d: DocEntry): Promise<ArrayBuffer> => {
    const c = bins.current.get(d.id); if (c) return c;
    const r = await fetch(d.path); if (!r.ok) throw new Error("No se ha podido descargar el documento.");
    const b = await r.arrayBuffer(); bins.current.set(d.id, b); return b;
  };

  // Documentos que llegan desde otro dispositivo sin título todavía: se descifran una vez para leerlo.
  const naming = useRef(new Set<string>());
  useEffect(() => {
    for (const d of unlocked) {
      if (titles[d.id] || naming.current.has(d.id)) continue;
      naming.current.add(d.id);
      const k = keyOf(d.id)!;
      bin(d).then((b) => decryptDoc(k, b)).then((plain) => saveTitle(d.id, titleOf(plain))).catch(() => naming.current.delete(d.id));
    }
  });

  const addCode = async (e: FormEvent) => {
    e.preventDefault();
    const c = normCode(code);
    if (c.length < 16) { setMsg({ ok: false, text: "El código tiene 20 letras y números. Revisa que esté completo." }); return; }
    setBusy("add"); setMsg(null);
    try {
      const found: string[] = [];
      for (const d of pending) {
        const k = await deriveKey(c, d);
        try { const plain = await decryptDoc(k, await bin(d)); const t = titleOf(plain); saveTitle(d.id, t); saveKeys(mergeWire(keysRef.current, { v: 1, e: { [d.id]: [k, Date.now()] } })); found.push(t); }
        catch (x) { if (x instanceof Error && /descargar/.test(x.message)) throw x; /* no es su clave: probar el siguiente */ }
      }
      if (found.length) { setCode(""); setMsg({ ok: true, text: `Añadido: ${found.join(", ")}.` + (uid ? "" : " Entra en tu cuenta para tenerlo también en tus otros dispositivos.") }); if (uid) syncKeys(); }
      else setMsg({ ok: false, text: pending.length ? "Ese código no abre ningún documento. Revisa que esté bien escrito." : "Ya tienes añadidos todos los documentos." });
    } catch (x) { setMsg({ ok: false, text: x instanceof Error ? x.message : "No se ha podido comprobar el código." }); }
    finally { setBusy(null); }
  };

  const openDoc = async (d: DocEntry) => {
    const k = keyOf(d.id); if (!k) return;
    setBusy(d.id); setMsg(null);
    try {
      const plain = await decryptDoc(k, await bin(d));
      const t = titleOf(plain); if (titles[d.id] !== t) saveTitle(d.id, t);
      setOpen({ id: d.id, url: URL.createObjectURL(new Blob([plain as BlobPart], { type: "text/html;charset=utf-8" })), title: t });
    } catch (x) {
      bins.current.delete(d.id);
      setMsg({ ok: false, text: x instanceof Error && /descargar/.test(x.message) ? x.message : "No se ha podido abrir. Si el documento se ha actualizado, vuelve a añadirlo con su código." });
    } finally { setBusy(null); }
  };
  const close = () => { if (open) URL.revokeObjectURL(open.url); setOpen(null); };

  const forgetDevice = async () => {
    try { for (const k of Object.keys(localStorage)) if (k.startsWith("boveda-")) localStorage.removeItem(k); } catch { /* nada que borrar */ }
    setKeys({ v: 1, e: {} }); keysRef.current = { v: 1, e: {} }; setTitles({}); setForget(false);
    if (acct.sb && uid) await acct.sb.auth.signOut().catch(() => undefined);
    setMsg({ ok: true, text: "Este dispositivo ya no guarda tus documentos ni tus códigos." });
  };

  if (open) return <Viewer doc={open} sb={acct.sb} uid={uid} onClose={close} />;

  return (
    <div className="bv-root">
      <style>{CSS}</style>
      <main className="bv-main">
        <header className="bv-head">
          <p className="bv-eyebrow">joaco.org · cuenta</p>
          <h1>Documentos de tu cuenta</h1>
          <p className="bv-lead">Documentos cifrados que solo se abren con su código de activación. Lo escribes una vez: si has entrado en tu cuenta, el código y tu progreso pasan solos a tus otros dispositivos.</p>
        </header>

        <section className="bv-sec" aria-labelledby="bv-h-docs">
          <h2 id="bv-h-docs">Tus documentos</h2>
          {idx === null && <p className="bv-muted">Cargando…</p>}
          {idxErr && <p className="bv-err">{idxErr}</p>}
          {idx !== null && !unlocked.length && !idxErr && <p className="bv-muted">Aún no has añadido ninguno en este dispositivo. Escribe su código abajo{acct.user ? "" : ", o entra en tu cuenta si ya lo añadiste en otro"}.</p>}
          <div className="bv-list">
            {unlocked.map((d) => (
              <div className="bv-doc" key={d.id}>
                <div><b>{titles[d.id] || "Documento"}</b><span className="bv-muted">Progreso: {uid ? "se sincroniza con tu cuenta" : "solo en este dispositivo"}</span></div>
                <button className="bv-btn" onClick={() => openDoc(d)} disabled={!!busy}>{busy === d.id ? "Abriendo…" : "Abrir"}</button>
              </div>
            ))}
          </div>
        </section>

        <section className="bv-sec" aria-labelledby="bv-h-add">
          <h2 id="bv-h-add">Añadir un documento</h2>
          <form className="bv-form" onSubmit={addCode}>
            <label htmlFor="bv-code">Código de activación</label>
            <input id="bv-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="XXXXX-XXXXX-XXXXX-XXXXX" autoComplete="off" autoCapitalize="characters" spellCheck={false} />
            <div className="bv-row"><button className="bv-btn" disabled={!!busy || !code.trim()}>{busy === "add" ? "Comprobando…" : "Añadir"}</button></div>
          </form>
          {msg && <p className={msg.ok ? "bv-ok" : "bv-err"} role="status">{msg.text}</p>}
        </section>

        <section className="bv-sec" aria-labelledby="bv-h-acct">
          <h2 id="bv-h-acct">Cuenta y sincronización</h2>
          <AccountBox acct={acct} keysState={keysState} onSync={syncKeys} />
        </section>

        <section className="bv-sec" aria-labelledby="bv-h-how">
          <h2 id="bv-h-how">Cómo funciona</h2>
          <ol className="bv-how">
            <li>Cada documento está cifrado en el servidor. Sin su código nadie puede leerlo, tampoco desde el repositorio.</li>
            <li>El código se comprueba en tu navegador y no se envía a ningún sitio. Si has entrado en tu cuenta, se guarda en ella para que tus otros dispositivos no tengan que pedirlo.</li>
            <li>Lo que marcas dentro de un documento se guarda siempre en este dispositivo y, con cuenta, se sube unos segundos después. Al abrirlo en otro dispositivo, al volver a la pestaña y cada cinco minutos se baja lo que hayas hecho en los demás.</li>
            <li>Si dos dispositivos cambian cosas a la vez, de cada tarea se queda el cambio más reciente. No se pierde nada del historial.</li>
            <li>Sin conexión todo sigue funcionando y se sube al volver.</li>
          </ol>
        </section>

        <section className="bv-sec" aria-labelledby="bv-h-dev">
          <h2 id="bv-h-dev">Este dispositivo</h2>
          {!forget
            ? <div className="bv-row"><button className="bv-btn2 ghost" onClick={() => setForget(true)}>Olvidar los documentos en este dispositivo</button></div>
            : <div className="bv-confirm"><p>Se borran de este dispositivo los códigos y la copia local del progreso, y se cierra la sesión. Lo que ya esté en tu cuenta no se borra.</p>
                <div className="bv-row"><button className="bv-btn danger" onClick={forgetDevice}>Sí, olvidar</button><button className="bv-btn2" onClick={() => setForget(false)}>Cancelar</button></div></div>}
        </section>
      </main>
    </div>
  );
}

const CSS = `
.bv-root{--paper:#F3F5F4;--card:#fff;--ink:#16211D;--muted:#5B6B65;--line:#D6DDD9;--accent:#C8420A;--ok:#1C7448;--okbg:#E2F3EA;--warn:#A86A00;--bad:#B3261E;--badbg:#FBE4E2;
  min-height:100vh;background:var(--paper);color:var(--ink);font-family:'Sora',system-ui,sans-serif;color-scheme:light}
.bv-main{max-width:720px;margin:0 auto;padding:28px 16px 90px;display:flex;flex-direction:column;gap:22px}
.bv-head{display:flex;flex-direction:column;gap:8px}
.bv-eyebrow{font:500 12px 'IBM Plex Mono',monospace;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin:0}
.bv-head h1{font-family:'Fraunces',serif;font-weight:650;font-size:30px;line-height:1.1;margin:0}
.bv-lead{margin:0;font-size:15px;line-height:1.55;max-width:62ch}
.bv-sec{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:16px;display:flex;flex-direction:column;gap:10px}
.bv-sec h2{font-size:17px;margin:0}
.bv-sec p{margin:0;line-height:1.5;font-size:14.5px}
.bv-muted{color:var(--muted);font-size:13.5px}
.bv-list{display:flex;flex-direction:column;gap:8px}
.bv-doc{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;padding:12px;border:1px solid var(--line);border-radius:10px}
.bv-doc>div{display:flex;flex-direction:column;gap:2px;min-width:0}
.bv-form{display:flex;flex-direction:column;gap:8px}
.bv-form label{font-weight:600;font-size:13.5px}
.bv-form input{font:500 16px 'Sora',sans-serif;padding:10px 12px;border:1px solid var(--line);border-radius:8px;background:var(--card);color:var(--ink);width:100%;box-sizing:border-box}
#bv-code{font-family:'IBM Plex Mono',monospace;letter-spacing:.06em}
.bv-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.bv-btn,.bv-btn2{font:600 14px 'Sora',sans-serif;padding:9px 14px;border-radius:8px;cursor:pointer;border:1px solid var(--ink)}
.bv-btn{background:var(--ink);color:#fff}
.bv-btn.danger{background:var(--bad);border-color:var(--bad)}
.bv-btn2{background:var(--card);color:var(--ink)}
.bv-btn2.ghost{border-color:transparent;color:var(--muted)}
.bv-btn:disabled,.bv-btn2:disabled{opacity:.5;cursor:default}
.bv-root :focus-visible,.bv-view :focus-visible{outline:3px solid var(--accent);outline-offset:2px}
.bv-tabs{display:flex;gap:4px;flex-wrap:wrap;border-bottom:1px solid var(--line);margin-bottom:4px}
.bv-tabs button{font:600 13px 'Sora',sans-serif;background:none;border:0;border-bottom:3px solid transparent;padding:8px 10px;color:var(--muted);cursor:pointer}
.bv-tabs button.on{color:var(--ink);border-bottom-color:var(--accent)}
.bv-ok{color:var(--ok)}.bv-err{color:var(--bad)}
.bv-note{background:#FBF0D9;border-left:4px solid var(--warn);padding:8px 10px;border-radius:0 8px 8px 0}
.bv-confirm{display:flex;flex-direction:column;gap:8px}
.bv-how{margin:0;padding-left:1.2rem;display:flex;flex-direction:column;gap:6px;font-size:14.5px;line-height:1.5}
.bv-pill{font:500 12px 'IBM Plex Mono',monospace;padding:3px 8px;border-radius:6px;background:#E6EEFA;color:#2456A6;align-self:flex-start;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
.bv-pill.ok{background:var(--okbg);color:var(--ok)}.bv-pill.error{background:var(--badbg);color:var(--bad)}.bv-pill.offline{background:#FBF0D9;color:var(--warn)}.bv-pill.local{background:#EEF1EF;color:var(--muted)}
.bv-view{position:fixed;inset:0;z-index:200;background:#fff;display:flex;flex-direction:column}
.bv-view iframe{flex:1;border:0;width:100%}
.bv-bar{display:flex;align-items:center;gap:10px;padding:8px 12px;padding-top:max(8px,env(safe-area-inset-top,0px));background:#16211D;color:#fff;font:600 13px 'Sora',sans-serif}
.bv-bar button{font:600 13px 'Sora',sans-serif;border:1px solid rgba(255,255,255,.35);background:transparent;color:#fff;border-radius:8px;padding:5px 10px;cursor:pointer;flex:none}
.bv-vt{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bv-bar .bv-pill{flex:none;max-width:45%}
@media (max-width:560px){.bv-bar .bv-pill{display:none}}
`;
