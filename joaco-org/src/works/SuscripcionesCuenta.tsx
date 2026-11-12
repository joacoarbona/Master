import React, { useCallback, useEffect, useRef, useState } from "react";
import { getSupabase, supabaseConfigured } from "../lib/supabase";
import { docKey, friendlyError, mergeDocs, supabaseRemote, syncOnce, type Doc } from "./suscripciones-sync";

/* ============================================================
   SUSCRIPCIONES · cuenta y sincronización (Supabase)
   El navegador sigue siendo la copia principal: se guarda aquí
   siempre, y si hay sesión además se sube a la cuenta y se baja
   lo que hayan cambiado otros dispositivos.
   ============================================================ */

export type CloudStatus = "off" | "syncing" | "ok" | "error" | "offline";
export interface Cloud {
  configured: boolean;
  ready: boolean;            // ya se sabe si hay sesión
  email: string | null;
  status: CloudStatus;
  lastSync: number | null;
  error: string | null;
  recovery: boolean;         // ha vuelto del correo de «nueva contraseña»
  returned: boolean;         // ha llegado desde un enlace de correo (confirmar o recuperar)
  syncNow: () => void;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<string | null>;
  resetPassword: (email: string) => Promise<string | null>;
  setNewPassword: (password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const AUTH_PARAMS = ["sx_auth", "sx_reset", "code", "error", "error_code", "error_description"];
function cleanUrl() {
  try {
    const u = new URL(window.location.href);
    let changed = false;
    for (const p of AUTH_PARAMS) if (u.searchParams.has(p)) { u.searchParams.delete(p); changed = true; }
    if (changed) window.history.replaceState(window.history.state, "", u.pathname + (u.search ? u.search : "") + u.hash);
  } catch { /* sin history */ }
}
const backUrl = (param: string) => `${window.location.origin}/?${param}=1`;

export function useCloudSync(doc: Doc, setDoc: (f: (d: Doc) => Doc) => void): Cloud {
  const sb = getSupabase();
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(!sb);
  const [status, setStatus] = useState<CloudStatus>("off");
  const [lastSync, setLastSync] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recovery, setRecovery] = useState(false);
  const [returned, setReturned] = useState(false);

  const docRef = useRef(doc); docRef.current = doc;
  const uidRef = useRef<string | null>(null);
  const syncedKey = useRef<string | null>(null);
  const lastRev = useRef<number | null>(null);
  const running = useRef(false);
  const again = useRef(false);

  const run = useCallback(async () => {
    const uid = uidRef.current;
    if (!sb || !uid) return;
    if (running.current) { again.current = true; return; }
    running.current = true;
    setStatus("syncing");
    try {
      do {
        again.current = false;
        const res = await syncOnce(docRef.current, supabaseRemote(sb, uid));
        if (uidRef.current !== uid) { setStatus("off"); return; } // cerró sesión mientras tanto
        lastRev.current = res.rev;
        syncedKey.current = docKey(res.doc);
        if (syncedKey.current !== docKey(docRef.current)) setDoc(cur => mergeDocs(cur, res.doc));
      } while (again.current);
      setStatus("ok"); setError(null); setLastSync(Date.now());
    } catch (e) {
      const offline = typeof navigator !== "undefined" && navigator.onLine === false;
      setStatus(offline ? "offline" : "error");
      setError(friendlyError(e));
    } finally {
      running.current = false;
    }
  }, [sb, setDoc]);

  // Sesión
  useEffect(() => {
    if (!sb) return;
    const params = new URLSearchParams(window.location.search);
    const fromReset = params.has("sx_reset");
    const fromConfirm = params.has("sx_auth");
    if (fromReset || fromConfirm) setReturned(true);
    const apply = (session: any) => {
      const u = session?.user || null;
      uidRef.current = u?.id || null;
      setUserId(u?.id || null);
      setEmail(u?.email || null);
      if (!u) { setStatus("off"); syncedKey.current = null; lastRev.current = null; }
    };
    sb.auth.getSession().then(({ data, error: err }: any) => {
      apply(data?.session);
      if (fromReset && data?.session) setRecovery(true);
      if ((fromReset || fromConfirm) && !data?.session) {
        setError(fromReset
          ? "El enlace para cambiar la contraseña ha caducado o se abrió en otro navegador. Pide otro desde «¿Has olvidado la contraseña?» y ábrelo en este mismo navegador."
          : "Correo confirmado. Entra con tu correo y contraseña.");
      }
      if (err) setError(friendlyError(err));
      setReady(true);
      cleanUrl();
    });
    const { data: sub } = sb.auth.onAuthStateChange((event: string, session: any) => {
      apply(session);
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
    });
    return () => sub?.subscription?.unsubscribe();
  }, [sb]);

  // Al entrar: primera sincronización
  useEffect(() => { if (userId) run(); }, [userId, run]);

  // Cambios locales → subir (con un pequeño retardo para agrupar ediciones)
  useEffect(() => {
    if (!userId || syncedKey.current === null || docKey(doc) === syncedKey.current) return;
    const t = setTimeout(run, 1200);
    return () => clearTimeout(t);
  }, [doc, userId, run]);

  // Volver a la pestaña, recuperar conexión y cada 5 minutos → ponerse al día
  useEffect(() => {
    if (!userId) return;
    const onVis = () => { if (document.visibilityState === "visible") run(); };
    const onOnline = () => run();
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("online", onOnline);
    const iv = setInterval(() => { if (document.visibilityState === "visible") run(); }, 5 * 60000);
    return () => { document.removeEventListener("visibilitychange", onVis); window.removeEventListener("online", onOnline); clearInterval(iv); };
  }, [userId, run]);

  // En directo: otro dispositivo ha escrito
  useEffect(() => {
    if (!sb || !userId) return;
    let ch: any = null;
    try {
      ch = sb.channel(`sx-store-${userId}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "sx_store", filter: `user_id=eq.${userId}` }, (p: any) => {
          const rev = Number(p?.new?.rev);
          if (!rev || rev !== lastRev.current) run();
        })
        .subscribe();
    } catch { /* sin realtime: queda el refresco al volver a la pestaña */ }
    return () => { if (ch) sb.removeChannel(ch); };
  }, [sb, userId, run]);

  const wrap = async (f: () => Promise<any>): Promise<string | null> => {
    try { const r = await f(); if (r?.error) return friendlyError(r.error); setError(null); return null; }
    catch (e) { return friendlyError(e); }
  };

  return {
    configured: supabaseConfigured, ready, email, status, lastSync, error, recovery, returned,
    syncNow: () => { run(); },
    signIn: (e, p) => wrap(() => sb!.auth.signInWithPassword({ email: e.trim(), password: p })),
    signUp: async (e, p) => {
      try {
        const { data, error: err } = await sb!.auth.signUp({ email: e.trim(), password: p, options: { emailRedirectTo: backUrl("sx_auth") } });
        if (err) return friendlyError(err);
        if (!data?.session) return "CHECK_EMAIL";
        return null;
      } catch (x) { return friendlyError(x); }
    },
    resetPassword: (e) => wrap(() => sb!.auth.resetPasswordForEmail(e.trim(), { redirectTo: backUrl("sx_reset") })),
    setNewPassword: async (p) => { const r = await wrap(() => sb!.auth.updateUser({ password: p })); if (!r) setRecovery(false); return r; },
    signOut: async () => { try { await sb?.auth.signOut(); } catch { /* sin conexión: la sesión local se borra igual */ } uidRef.current = null; setUserId(null); setEmail(null); setStatus("off"); },
  };
}

// ---------- Indicador en la cabecera ----------
export function CloudPill({ cloud, onOpen }: { cloud: Cloud; onOpen: () => void }) {
  let icon = "○", text = "Solo en este dispositivo", cls = "cp-off";
  if (cloud.configured && cloud.email) {
    if (cloud.status === "syncing") { icon = "↻"; text = "Sincronizando…"; cls = "cp-sync"; }
    else if (cloud.status === "ok") { icon = "✓"; text = `Sincronizado${cloud.lastSync ? " · " + ago(cloud.lastSync) : ""}`; cls = "cp-ok"; }
    else if (cloud.status === "offline") { icon = "⏸"; text = "Sin conexión · se subirá luego"; cls = "cp-warn"; }
    else if (cloud.status === "error") { icon = "!"; text = "Error al sincronizar"; cls = "cp-err"; }
    else { icon = "✓"; text = "Con sesión"; cls = "cp-ok"; }
  } else if (cloud.configured) text = "Sin cuenta · Sincronizar";
  return <button className={"cloudpill " + cls} onClick={onOpen} aria-label={`Cuenta y sincronización: ${text}`}><span aria-hidden="true">{icon}</span>{text}</button>;
}
function ago(ms: number) {
  const s = Math.max(0, Math.round((Date.now() - ms) / 1000));
  if (s < 45) return "ahora";
  const m = Math.round(s / 60);
  if (m < 60) return `hace ${m} min`;
  const h = Math.round(m / 60);
  return h < 24 ? `hace ${h} h` : `hace ${Math.round(h / 24)} d`;
}

// ---------- Panel de cuenta ----------
export function AccountPanel({ cloud, hasSample, removeSample, count, wipeLocal, onClose }: {
  cloud: Cloud; hasSample: boolean; removeSample: () => void; count: number; wipeLocal: () => void; onClose: () => void;
}) {
  const [mode, setMode] = useState<"in" | "up" | "reset">("in");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [wipe, setWipe] = useState(false);
  const [, tick] = useState(0);
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); }; window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [onClose]);
  useEffect(() => { const i = setInterval(() => tick(x => x + 1), 30000); return () => clearInterval(i); }, []);

  const act = async (f: () => Promise<string | null>, okText?: string) => {
    setBusy(true); setMsg(null);
    const r = await f();
    setBusy(false);
    if (r === "CHECK_EMAIL") setMsg({ ok: true, text: `Te hemos enviado un correo a ${email.trim()}. Ábrelo para confirmar la cuenta y luego entra aquí con tu contraseña.` });
    else if (r) setMsg({ ok: false, text: r });
    else if (okText) setMsg({ ok: true, text: okText });
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cloud.recovery) {
      if (pw.length < 8) return setMsg({ ok: false, text: "Usa al menos 8 caracteres." });
      if (pw !== pw2) return setMsg({ ok: false, text: "Las dos contraseñas no coinciden." });
      return act(() => cloud.setNewPassword(pw), "Contraseña cambiada. Ya estás dentro.");
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setMsg({ ok: false, text: "Escribe un correo válido." });
    if (mode === "reset") return act(() => cloud.resetPassword(email), "Si existe una cuenta con ese correo, te llegará un enlace para poner una contraseña nueva. Ábrelo en este mismo navegador.");
    if (mode === "up") {
      if (pw.length < 8) return setMsg({ ok: false, text: "Usa al menos 8 caracteres." });
      if (pw !== pw2) return setMsg({ ok: false, text: "Las dos contraseñas no coinciden." });
      return act(() => cloud.signUp(email, pw));
    }
    return act(() => cloud.signIn(email, pw));
  };

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label="Cuenta y sincronización" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet">
        <div className="sheet-h"><h2>Cuenta y sincronización</h2><button type="button" className="x" onClick={onClose} aria-label="Cerrar">×</button></div>
        <div className="sheet-b">
          {!cloud.configured ? (
            <>
              <p className="note">La sincronización todavía no está activada en esta web. Mientras tanto la app funciona igual y guarda en este navegador; para pasar los datos a otro dispositivo usa Exportar e Importar en Guía.</p>
              <p className="muted small">Para activarla, el dueño del sitio tiene que configurar Supabase (pasos en supabase/SUSCRIPCIONES.md del repositorio).</p>
            </>
          ) : !cloud.ready ? <p className="muted">Comprobando sesión…</p> : cloud.recovery && cloud.email ? (
            <form onSubmit={submit} className="stack">
              <p>Pon una contraseña nueva para <strong>{cloud.email}</strong>.</p>
              <label>Contraseña nueva<input type="password" autoComplete="new-password" value={pw} onChange={e => setPw(e.target.value)} autoFocus /></label>
              <label>Repítela<input type="password" autoComplete="new-password" value={pw2} onChange={e => setPw2(e.target.value)} /></label>
              <button className="btn primary" disabled={busy}>{busy ? "Guardando…" : "Cambiar contraseña"}</button>
              {msg && <p className={"note " + (msg.ok ? "ok" : "warn")} role="status">{msg.text}</p>}
            </form>
          ) : cloud.email ? (
            <div className="stack">
              <div className="acct">
                <div><span className="muted small">Has entrado como</span><strong>{cloud.email}</strong></div>
                <StatusLine cloud={cloud} />
              </div>
              {cloud.error && <p className={"note " + (cloud.status === "offline" ? "" : "warn")} role="status">{cloud.error}</p>}
              <div className="row">
                <button className="btn primary" onClick={cloud.syncNow} disabled={cloud.status === "syncing"}>{cloud.status === "syncing" ? "Sincronizando…" : "Sincronizar ahora"}</button>
              </div>
              {hasSample && (
                <p className="note">Tienes datos de ejemplo y se están guardando en tu cuenta. <button className="link" onClick={removeSample}>Quitarlos de todos los dispositivos</button></p>
              )}
              <p className="muted small">Cada cambio se guarda primero aquí y en un par de segundos se sube a tu cuenta. Los otros dispositivos lo reciben al momento si están abiertos, o al volver a abrir la app. Si dos editan la misma suscripción, se queda el cambio más reciente.</p>
              <div className="row">
                <button className="btn" onClick={async () => { await cloud.signOut(); setMsg({ ok: true, text: "Sesión cerrada. Los datos siguen en este dispositivo." }); }}>Cerrar sesión</button>
                {wipe
                  ? <button className="btn danger" onClick={async () => { await cloud.signOut(); wipeLocal(); setWipe(false); setMsg({ ok: true, text: "Sesión cerrada y datos borrados de este dispositivo. Siguen en tu cuenta." }); }}>Sí, cerrar y borrar aquí</button>
                  : <button className="btn ghost" onClick={() => setWipe(true)}>Cerrar y borrar de este dispositivo</button>}
              </div>
              <p className="muted small">«Cerrar y borrar» es para un ordenador prestado: quita los datos de este navegador, pero no de tu cuenta.</p>
              {msg && <p className={"note " + (msg.ok ? "ok" : "warn")} role="status">{msg.text}</p>}
            </div>
          ) : (
            <form onSubmit={submit} className="stack">
              <p>Con una cuenta, tus suscripciones se ven igual en el móvil, la tablet y el ordenador. Sin cuenta, la app sigue funcionando en este dispositivo.</p>
              <div className="seg" role="tablist" aria-label="Acción">
                <button type="button" role="tab" aria-selected={mode === "in"} className={mode === "in" ? "on" : ""} onClick={() => { setMode("in"); setMsg(null); }}>Entrar</button>
                <button type="button" role="tab" aria-selected={mode === "up"} className={mode === "up" ? "on" : ""} onClick={() => { setMode("up"); setMsg(null); }}>Crear cuenta</button>
              </div>
              {cloud.error && !msg && <p className="note" role="status">{cloud.error}</p>}
              <label>Correo<input type="email" inputMode="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} autoFocus /></label>
              {mode !== "reset" && <label>Contraseña<input type="password" autoComplete={mode === "up" ? "new-password" : "current-password"} value={pw} onChange={e => setPw(e.target.value)} /></label>}
              {mode === "up" && <label>Repite la contraseña<input type="password" autoComplete="new-password" value={pw2} onChange={e => setPw2(e.target.value)} /></label>}
              <button className="btn primary" disabled={busy}>{busy ? "Un momento…" : mode === "in" ? "Entrar" : mode === "up" ? "Crear cuenta" : "Enviar enlace"}</button>
              {mode === "in" && <button type="button" className="link" onClick={() => { setMode("reset"); setMsg(null); }}>¿Has olvidado la contraseña?</button>}
              {mode === "reset" && <button type="button" className="link" onClick={() => { setMode("in"); setMsg(null); }}>← Volver a Entrar</button>}
              {msg && <p className={"note " + (msg.ok ? "ok" : "warn")} role="status">{msg.text}</p>}
              {count > 0 && <p className="muted small">Al entrar, las {count} suscripciones de este dispositivo se suman a las de tu cuenta; no se borra nada.{hasSample ? " Incluye los datos de ejemplo: quítalos antes desde Guía si no quieres subirlos." : ""}</p>}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusLine({ cloud }: { cloud: Cloud }) {
  const map: Record<CloudStatus, [string, string]> = {
    off: ["○", "Sin sincronizar todavía"],
    syncing: ["↻", "Sincronizando…"],
    ok: ["✓", "Al día"],
    offline: ["⏸", "Sin conexión: los cambios se subirán al volver"],
    error: ["!", "No se ha podido sincronizar"],
  };
  const [i, t] = map[cloud.status];
  return <div className={"stline st-" + cloud.status}><span aria-hidden="true">{i}</span>{t}{cloud.lastSync && cloud.status !== "syncing" ? <em> · última vez {ago(cloud.lastSync)}</em> : null}</div>;
}
