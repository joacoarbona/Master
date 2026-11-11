import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import ElGabinete, { type Work } from "./ElGabinete";

/**
 * Zona privada.
 *
 * 1. La LISTA de trabajos privados viaja cifrada (AES-GCM, clave PBKDF2 de la contraseña).
 * 2. Los FICHEROS privados también: están en /privado/<id>.bin, cifrados con una segunda clave que
 *    sale de la misma contraseña (sal FILES_SALT). Se descifran en el navegador y se muestran en un
 *    marco; en el servidor y en el repositorio solo hay bytes cifrados.
 * 3. «Sellado»: como la contraseña solo la conoce el dueño, el cifrado se hace en SU navegador
 *    (SealTool) y el resultado se incorpora al repo con scripts/sellar.mjs. Ver PRIVADO.md.
 *
 * Mientras un fichero no esté sellado (no figura en /privado/indice.json) se abre por su URL normal.
 */
const BLOB = { salt: "u6GEnPdoq13LPvs6me7bew==", iv: "Y1ZSkq1GBK/TyxcL", ct: "HP81aCZO3pPBkombxrJ2llH12gJHK45euhXybGd6rTP0NIO5sj3Lnp7SSotqbQlJjd3mVfpt+dRA27e5i3FfebUcS0UqFzsLUl1RY697jLebJaBw764e8hhRSumBjxu2KYwFJhWy634gIUTyeHknZHPy+W8KKJXoiXNqW3qeqrx3sW/XaqTGuY9J58Kue7Z/QmQw7bMcECasnMBlh3dVF0hMY7dV8PHBB12KEE7N4LL/RJm21vGSCzSLDLp4jT6Hb3Fis/RWKihfN52nZX3lvrG4SiQbegMSW7SJdngXhNNkpeWknvWyQss8PSpGLcuJiQsuAWkJxnWDrnp/aEbEtbV/r4GeWODgaKGyMV4MBJynxE74YgzyT5nr8okNQS7eOrcUtgCSMyMarhA138ntzPaSmqE4NDfUQ4oeFnxHTEccJULespYX+q6HxdPecoC9jBW7FVv5B/RvO5ebMQM6Pykp9OVthak1r/dJqpz/RV9aqgcrAYbjUd/pg1p/qqNoNXpDHwwHJ8JJcZ7+fDfczFvJwnopAua70QhfWGnu9yyZxsNRDJ5L4mdNHTVu9yorFwgyYz2K1wbvROqPVxNY0SCxVLcAdEUDUoz2g77SpJO9x5YtvzRjf7LWAuJDWZsL6ACgSFhhXByfoOLp5pnzxFQgOa9MQf0EKrFcn7UoQGRQ6RucvLMt/c9tjNznAhAPDOvdCfYVeQ30KDfLPIHpGu9FvwjdPFb4xrfT/vgBcFkqw3suSFgZKfqlVgcLn1pmCK08j+HbuYOo4h6eo6daas1iD+A069hoSMs0mUjVZRKxqwiBbNXWJKH7FfaV5GEE5hgS4eeC30rvgEIk2zGAz4WCr/7je2C2vhw3GJI4hZVIQ3LsAyaDl4fdsdNGtvuaDDVPufWteCdknSNC+Lt0JUZ3fmhQg9o1o9ZFPL3zWBDmXJhm/mYK9VB5hk/YDac6g/trn8EPaD4gK+Ac30JnCQe6+RZW/ou1D+2VVV6CzGqXiEr7reVUYf24UYvR3Vd7Yp9AuEddlkaoEhBvI7rvf0k8aXWPgeZklWhssFdAo/2rxNQkyDXQffQ41RaNV81v+W4Kc2Aony1/xDwExmFHO947x2YFBrO+v3C0DgPJVm9gigT2/Yha3MUcD1TDaDGVxrBaKGdY1esphsY1celqRztV5opfo0pcSoihW4ejtjvpE0rXhx1bZ3837BvI+gwWyNDwf6dGzYrwudii7Qs9V413j+cE1hwYIB3yuj4SMSVSo+huEMAg/HySWqQARCzQbWFoMHlwKAsaBJEh7rgyJ+ThAtpS9d5AlBYjEmQCGun25XYCh7o4mzItsy2nQ+IksiBGRjRa" };
export const FILES_SALT = "qH3C7btJaNlJPAr9wNjfLw==";
const KEY = "joaco_privado";
const KEY_FILES = "joaco_privado_k";
/** Ficheros que deben quedar sellados aunque no estén en la lista privada (p. ej. los juegos de Fiesta). */
export const SEAL_PATHS = [
  "/gabinete/aic-bbu-senior-director-dossier.html", "/gabinete/data-project-leadership-dossier.html",
  "/gabinete/bpo-zero-based-operating-plan.html", "/gabinete/innovation.html", "/proyectos/innovation.html",
  "/gabinete/pension_simulator.html",
  "/fiesta/adivina-foto.html", "/fiesta/bingo.html", "/fiesta/memoria-fotos.html", "/fiesta/mimica.html",
  "/fiesta/princesas-magicas.html", "/fiesta/princesas.html", "/fiesta/quien-dijo-que.html",
  "/fiesta/quiz-cumpleanera.html", "/fiesta/ruleta-letras.html", "/fiesta/ruleta.html",
];

const b64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const toB64 = (u: Uint8Array) => { let s = ""; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000)); return btoa(s); };
const cleanPath = (href: string) => href.split("#")[0].split("?")[0];
export async function pathId(path: string) {
  const h = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode("joaco.org" + path)));
  return Array.from(h.slice(0, 12), (x) => x.toString(16).padStart(2, "0")).join("");
}
async function pbkdf(password: string, salt: string, extractable: boolean) {
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", salt: b64(salt), iterations: 210000, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, extractable, ["encrypt", "decrypt"]);
}
type Session = { items: Work[]; fileKey: string };
async function unlock(password: string): Promise<Session> {
  const key = await pbkdf(password, BLOB.salt, false);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64(BLOB.iv) }, key, b64(BLOB.ct));     // lanza si la contraseña no es
  const items = JSON.parse(new TextDecoder().decode(plain)) as Work[];
  const fk = await pbkdf(password, FILES_SALT, true);
  return { items, fileKey: toB64(new Uint8Array(await crypto.subtle.exportKey("raw", fk))) };
}
const importFileKey = (raw: string) => crypto.subtle.importKey("raw", b64(raw), { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);

type Index = Record<string, { iv: string; type?: string }>;
let indexPromise: Promise<Index | null> | null = null;
function loadIndex(): Promise<Index | null> {
  if (!indexPromise) indexPromise = fetch("/privado/indice.json", { cache: "no-cache" }).then(async (r) => { if (!r.ok) return null; try { return (await r.json()) as Index; } catch { return null; } }).catch(() => null);
  return indexPromise;
}

const STYLES = `
.prv-root{min-height:100vh;background:#11182e;color:#eee7d6;font-family:'Sora',sans-serif;display:grid;place-items:center;padding:24px max(16px,env(safe-area-inset-right,0px)) 24px max(16px,env(safe-area-inset-left,0px))}
.prv-card{width:min(380px,100%);background:#19223e;border:1px solid rgba(201,166,78,.28);border-radius:16px;padding:26px 22px;display:grid;gap:12px}
.prv-card h1{font-family:'Fraunces',serif;font-weight:650;font-size:30px;margin:0}
.prv-card h1 em{color:#c9a64e;font-style:italic}
.prv-card p{margin:0;color:#98a1bd;font-size:13.5px;line-height:1.45}
.prv-card input{font:600 16px 'Sora',sans-serif;padding:11px 12px;border-radius:10px;border:1px solid rgba(255,255,255,.18);background:#11182e;color:#eee7d6}
.prv-card input:focus-visible,.prv-card button:focus-visible{outline:2px solid #c9a64e;outline-offset:2px}
.prv-card button{font:600 15px 'Sora',sans-serif;padding:11px 12px;border-radius:10px;border:0;background:#c9a64e;color:#11182e;cursor:pointer}
.prv-card button:disabled{opacity:.6;cursor:default}
.prv-err{color:#e58a8a !important}
.prv-lock{position:fixed;left:14px;top:10px;z-index:101;font-family:'IBM Plex Mono',monospace;font-size:12px;color:#eee7d6;background:rgba(0,0,0,.45);border:1px solid rgba(255,255,255,.25);border-radius:8px;padding:4px 10px;cursor:pointer}
.prv-view{position:fixed;inset:0;z-index:200;background:#fff;display:flex;flex-direction:column}
.prv-view iframe{flex:1;border:0;width:100%}
.prv-bar{display:flex;align-items:center;gap:10px;background:#11182e;color:#eee7d6;padding:8px 12px;font:600 13px 'Sora',sans-serif}
.prv-bar button{font:600 13px 'Sora',sans-serif;border:1px solid rgba(255,255,255,.3);background:transparent;color:#eee7d6;border-radius:8px;padding:5px 12px;cursor:pointer}
.prv-seal{max-width:760px;margin:0 auto 60px;padding:0 16px;font-family:'Sora',sans-serif}
.prv-seal .box{background:#19223e;border:1px solid rgba(201,166,78,.28);border-radius:14px;padding:18px;color:#eee7d6}
.prv-seal h2{font-family:'Fraunces',serif;font-size:20px;margin:0 0 6px}
.prv-seal p,.prv-seal li{color:#b4bcd4;font-size:13.5px;line-height:1.5}
.prv-seal button{font:600 14px 'Sora',sans-serif;padding:10px 14px;border-radius:10px;border:0;background:#c9a64e;color:#11182e;cursor:pointer;margin-right:8px;margin-top:6px}
.prv-seal button:disabled{opacity:.6}
.prv-busy{position:fixed;inset:0;z-index:150;display:grid;place-items:center;background:rgba(17,24,46,.7);color:#eee7d6;font:600 15px 'Sora',sans-serif}
`;

export type PrivateApi = { items: Work[]; open: (href?: string, title?: string) => void; lock: () => void };

/** Pide la contraseña y, una vez abierta la sesión, pinta `children` con la forma de abrir ficheros sellados. */
export function PrivateGate({ children, heading, hint }: { children: (api: PrivateApi) => ReactNode; heading?: ReactNode; hint?: string }) {
  const [session, setSession] = useState<Session | null>(null);
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [view, setView] = useState<{ url: string; title: string } | null>(null);
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    try { const s = sessionStorage.getItem(KEY), k = sessionStorage.getItem(KEY_FILES); if (s && k) setSession({ items: JSON.parse(s), fileKey: k }); } catch { /* almacenamiento bloqueado: se vuelve a pedir */ }
  }, []);
  useEffect(() => () => { if (view) URL.revokeObjectURL(view.url); }, [view]);

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setErr("");
    try {
      const s = await unlock(pw); setSession(s); setPw("");
      try { sessionStorage.setItem(KEY, JSON.stringify(s.items)); sessionStorage.setItem(KEY_FILES, s.fileKey); } catch { /* funciona igual sin guardar */ }
    } catch { setErr("Contraseña incorrecta."); }
    setBusy(false);
  };
  const lock = () => { try { sessionStorage.removeItem(KEY); sessionStorage.removeItem(KEY_FILES); } catch { /* nada que borrar */ } setSession(null); setView(null); };
  const open = async (href?: string, title?: string) => {
    if (!href || !session) return;
    if (href.startsWith("#")) { window.location.hash = href; return; }
    setOpening(true);
    try {
      const idx = await loadIndex(); const id = await pathId(cleanPath(href)); const entry = idx ? idx[id] : null;
      if (!entry) { window.location.href = href; return; }                                            // aún sin sellar
      const res = await fetch(`/privado/${id}.bin`); if (!res.ok) throw new Error("no encontrado");
      const key = await importFileKey(session.fileKey);
      const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64(entry.iv) }, key, await res.arrayBuffer());
      setView({ url: URL.createObjectURL(new Blob([plain], { type: entry.type || "text/html;charset=utf-8" })), title: title || "" });
    } catch { setErr("No se ha podido abrir ese fichero."); window.alert("No se ha podido abrir ese fichero."); }
    setOpening(false);
  };

  if (session) return (
    <>
      <style>{STYLES}</style>
      {children({ items: session.items, open, lock })}
      {opening && <div className="prv-busy" role="status">Descifrando…</div>}
      {view && (
        <div className="prv-view">
          <div className="prv-bar"><button onClick={() => setView(null)}>← Cerrar</button><span>{view.title}</span></div>
          <iframe src={view.url} title={view.title || "Documento privado"} />
        </div>
      )}
    </>
  );
  return (
    <div className="prv-root">
      <style>{STYLES}</style>
      <form className="prv-card" onSubmit={submit}>
        <h1>{heading || <>Zona <em>privada</em></>}</h1>
        <p>{hint || "Escribe la contraseña para ver los trabajos privados."}</p>
        <input id="prv-pass" type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Contraseña" aria-label="Contraseña" autoFocus />
        <button type="submit" disabled={busy || !pw}>{busy ? "Comprobando…" : "Entrar"}</button>
        {err && <p className="prv-err" role="alert">{err}</p>}
      </form>
    </div>
  );
}

/** Sellado: cifra en este navegador los ficheros que aún se sirven en claro y descarga el paquete. */
function SealTool({ items }: { items: Work[] }) {
  const [pending, setPending] = useState<string[] | null>(null);
  const [state, setState] = useState<{ busy: boolean; msg: string; file: File | null }>({ busy: false, msg: "", file: null });
  const keyRef = useRef<string>("");
  const all = Array.from(new Set([...SEAL_PATHS, ...items.map((w) => w.href || "").filter((h) => h.startsWith("/")).map(cleanPath)]));
  useEffect(() => { (async () => {
    try { keyRef.current = sessionStorage.getItem(KEY_FILES) || ""; } catch { /* sin sesión guardada */ }
    const idx = (await loadIndex()) || {}; const out: string[] = [];
    for (const p of all) if (!idx[await pathId(p)]) out.push(p);
    setPending(out);
  })(); }, []);
  if (!pending || !pending.length) return null;
  const run = async () => {
    setState({ busy: true, msg: "Cifrando…", file: null });
    try {
      const key = await importFileKey(keyRef.current); const files: Array<{ path: string; iv: string; ct: string; type: string }> = []; const missing: string[] = [];
      for (const p of pending) {
        const r = await fetch(p, { cache: "no-store" }); const type = r.headers.get("content-type") || "text/html;charset=utf-8";
        const buf = r.ok ? new Uint8Array(await r.arrayBuffer()) : null;
        if (!buf || new TextDecoder().decode(buf.subarray(0, 600)).includes('<div id="root">')) { missing.push(p); continue; }   // no existe (el servidor devolvió la portada)
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, buf));
        files.push({ path: p, iv: toB64(iv), ct: toB64(ct), type: p.endsWith(".pdf") ? "application/pdf" : (type.includes("html") ? "text/html;charset=utf-8" : type) });
      }
      const file = new File([JSON.stringify({ v: 1, salt: FILES_SALT, created: new Date().toISOString(), files })], "privado-sellado.json", { type: "application/json" });
      setState({ busy: false, msg: `${files.length} fichero(s) cifrado(s)` + (missing.length ? ` · ${missing.length} no encontrado(s)` : "") + ". Descarga el paquete y adjúntalo en el chat con Claude.", file });
    } catch { setState({ busy: false, msg: "No se ha podido cifrar. Cierra el privado, vuelve a entrar e inténtalo otra vez.", file: null }); }
  };
  const save = () => { const f = state.file; if (!f) return; const a = document.createElement("a"); a.href = URL.createObjectURL(f); a.download = f.name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); };
  const share = async () => { const f = state.file; if (!f) return; try { await (navigator as any).share({ files: [f], title: f.name }); } catch { save(); } };
  const canShare = !!state.file && typeof navigator !== "undefined" && !!(navigator as any).canShare && (navigator as any).canShare({ files: [state.file] });
  return (
    <div className="prv-seal">
      <div className="box">
        <h2>Sellar los ficheros privados</h2>
        <p>Hay {pending.length} fichero(s) que todavía se sirven sin cifrar: quien tenga la dirección exacta puede abrirlos. Este paso los cifra aquí, en tu navegador, con tu contraseña. La contraseña no sale de este dispositivo.</p>
        <ol>
          <li>Pulsa «Cifrar ahora».</li>
          <li>Guarda o comparte el fichero <b>privado-sellado.json</b>.</li>
          <li>Adjúntalo en el chat con Claude: él sustituye los originales por la versión cifrada.</li>
        </ol>
        <button onClick={run} disabled={state.busy}>{state.busy ? "Cifrando…" : "Cifrar ahora"}</button>
        {state.file && <button onClick={save}>Descargar</button>}
        {canShare && <button onClick={share}>Compartir…</button>}
        {state.msg && <p role="status" style={{ marginTop: 10 }}>{state.msg}</p>}
      </div>
    </div>
  );
}

export default function PrivateArea() {
  return (
    <PrivateGate>
      {(api) => (
        <>
          <button className="prv-lock" onClick={api.lock}>Cerrar el privado</button>
          <ElGabinete works={api.items} autoFocus={false} onSelect={(w) => api.open(w.href, w.title)} title={<>Zona <em>privada</em></>} subtitle="Trabajos que no aparecen en el Gabinete ni en Proyectos." />
          <SealTool items={api.items} />
        </>
      )}
    </PrivateGate>
  );
}
