import { useEffect, useState, type FormEvent } from "react";
import ElGabinete, { type Work } from "./ElGabinete";

/**
 * PrivateArea — works that are not listed publicly. The list (titles and links) travels encrypted with
 * AES-GCM; the key comes from the password with PBKDF2, so the page source does not show what is inside.
 * The unlocked list stays in this browser tab (sessionStorage) until "Cerrar el privado".
 * Note: the HTML files themselves are still served at their URLs; this hides them from the public menus.
 */
const BLOB = { salt: "u6GEnPdoq13LPvs6me7bew==", iv: "Y1ZSkq1GBK/TyxcL", ct: "HP81aCZO3pPBkombxrJ2llH12gJHK45euhXybGd6rTP0NIO5sj3Lnp7SSotqbQlJjd3mVfpt+dRA27e5i3FfebUcS0UqFzsLUl1RY697jLebJaBw764e8hhRSumBjxu2KYwFJhWy634gIUTyeHknZHPy+W8KKJXoiXNqW3qeqrx3sW/XaqTGuY9J58Kue7Z/QmQw7bMcECasnMBlh3dVF0hMY7dV8PHBB12KEE7N4LL/RJm21vGSCzSLDLp4jT6Hb3Fis/RWKihfN52nZX3lvrG4SiQbegMSW7SJdngXhNNkpeWknvWyQss8PSpGLcuJiQsuAWkJxnWDrnp/aEbEtbV/r4GeWODgaKGyMV4MBJynxE74YgzyT5nr8okNQS7eOrcUtgCSMyMarhA138ntzPaSmqE4NDfUQ4oeFnxHTEccJULespYX+q6HxdPecoC9jBW7FVv5B/RvO5ebMQM6Pykp9OVthak1r/dJqpz/RV9aqgcrAYbjUd/pg1p/qqNoNXpDHwwHJ8JJcZ7+fDfczFvJwnopAua70QhfWGnu9yyZxsNRDJ5L4mdNHTVu9yorFwgyYz2K1wbvROqPVxNY0SCxVLcAdEUDUoz2g77SpJO9x5YtvzRjf7LWAuJDWZsL6ACgSFhhXByfoOLp5pnzxFQgOa9MQf0EKrFcn7UoQGRQ6RucvLMt/c9tjNznAhAPDOvdCfYVeQ30KDfLPIHpGu9FvwjdPFb4xrfT/vgBcFkqw3suSFgZKfqlVgcLn1pmCK08j+HbuYOo4h6eo6daas1iD+A069hoSMs0mUjVZRKxqwiBbNXWJKH7FfaV5GEE5hgS4eeC30rvgEIk2zGAz4WCr/7je2C2vhw3GJI4hZVIQ3LsAyaDl4fdsdNGtvuaDDVPufWteCdknSNC+Lt0JUZ3fmhQg9o1o9ZFPL3zWBDmXJhm/mYK9VB5hk/YDac6g/trn8EPaD4gK+Ac30JnCQe6+RZW/ou1D+2VVV6CzGqXiEr7reVUYf24UYvR3Vd7Yp9AuEddlkaoEhBvI7rvf0k8aXWPgeZklWhssFdAo/2rxNQkyDXQffQ41RaNV81v+W4Kc2Aony1/xDwExmFHO947x2YFBrO+v3C0DgPJVm9gigT2/Yha3MUcD1TDaDGVxrBaKGdY1esphsY1celqRztV5opfo0pcSoihW4ejtjvpE0rXhx1bZ3837BvI+gwWyNDwf6dGzYrwudii7Qs9V413j+cE1hwYIB3yuj4SMSVSo+huEMAg/HySWqQARCzQbWFoMHlwKAsaBJEh7rgyJ+ThAtpS9d5AlBYjEmQCGun25XYCh7o4mzItsy2nQ+IksiBGRjRa" };
const KEY = "joaco_privado";
const b64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function unlock(password: string): Promise<Work[]> {
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
  const key = await crypto.subtle.deriveKey({ name: "PBKDF2", salt: b64(BLOB.salt), iterations: 210000, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64(BLOB.iv) }, key, b64(BLOB.ct));
  return JSON.parse(new TextDecoder().decode(plain)) as Work[];
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
`;

export default function PrivateArea() {
  const [items, setItems] = useState<Work[] | null>(null);
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    try { const s = sessionStorage.getItem(KEY); if (s) setItems(JSON.parse(s)); } catch { /* storage blocked: ask again */ }
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setErr("");
    try {
      const list = await unlock(pw);
      setItems(list); setPw("");
      try { sessionStorage.setItem(KEY, JSON.stringify(list)); } catch { /* fine without */ }
    } catch { setErr("Contraseña incorrecta."); }
    setBusy(false);
  };
  const lock = () => { try { sessionStorage.removeItem(KEY); } catch { /* ignore */ } setItems(null); };

  if (items) return (
    <>
      <style>{STYLES}</style>
      <button className="prv-lock" onClick={lock}>Cerrar el privado</button>
      <ElGabinete works={items} autoFocus={false} title={<>Zona <em>privada</em></>} subtitle="Trabajos que no aparecen en el Gabinete ni en Proyectos." />
    </>
  );
  return (
    <div className="prv-root">
      <style>{STYLES}</style>
      <form className="prv-card" onSubmit={submit}>
        <h1>Zona <em>privada</em></h1>
        <p>Escribe la contraseña para ver los trabajos privados.</p>
        <input id="prv-pass" type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Contraseña" aria-label="Contraseña" autoFocus />
        <button type="submit" disabled={busy || !pw}>{busy ? "Comprobando…" : "Entrar"}</button>
        {err && <p className="prv-err" role="alert">{err}</p>}
      </form>
    </div>
  );
}
