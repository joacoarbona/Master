import { useEffect, useState, type FormEvent } from "react";
import ElGabinete, { type Work } from "./ElGabinete";

/**
 * PrivateArea — works that are not listed publicly. The list (titles and links) travels encrypted with
 * AES-GCM; the key comes from the password with PBKDF2, so the page source does not show what is inside.
 * The unlocked list stays in this browser tab (sessionStorage) until "Cerrar el privado".
 * Note: the HTML files themselves are still served at their URLs; this hides them from the public menus.
 */
const BLOB = { salt: "/yCVSV3W0mjOIaJ+169Nww==", iv: "AgoIgHFaV5Ed3viv", ct: "i1XSONzrCFXAR4c3HjJiunzcqe2761Hv008e4ehnWrNlV8NOBTkoPa2e+7PErRS0iLPwzT8/opDzdWVw1WuxoBImvqRdS8Y6zI+UdBlBVdtGX+KHXc8cbk7wbeRZ4HlKfPg4snxCqvIGXsLnC+D1H9W2TPx5ir/uu1ES+VBB0z8Kl29zUDkFKoLAfP6ytP9uhw9r0FM5k2ruI+GSNKiplWaZvM8TatERIyzsLnmWCkLn9/U2+J8k2qycWfr4bGU4lolnzkpEult6n937SCbjUom6G0NkA+jkVBeZnq6keDgFxChoer8yaVsG2aFXn1W+SY3DUHrRj38TadJkE7ll3OCZrXXQ5RKm73SnxmxtE6x2OREGiCa1VKmmYxG7hs4QyKOoghY9K0Sew2OAhYmaqDw5/Kd1FRAnSXyvEtXinrgsvOkDFk0LKJWUDsFWBn68VpLz/iEPSOTXiEKY9bGhKOZotIuOl1DnC/gJYN9DH5i01YqHRaINwL51eSbQP7gut/iy3dfF48qy2L1Axk6jAIhGqjNb6/Hy72/6yQY45aKIUnNu/JY3ynBH8cLuCjUJjNckWHDTuSQldMcjgH3VUtR8+XUd4RiUBotVtKGCqBvYBKc95qkdIDts3qsKvTwRN1EKwUkrsqMTkmzFXT0Y0sZOpvtd6/YIKmDDLh0U79FdTyPPqe7M4hp0LTwdl1g9Frxxwi3LDo22b7oX7Ug71q8P0GMKaP117Q/N2E4Fn0C8vgVby2VZ1qwZI1v8NzKPcRMBCfHIOM3oQrk/42cMurls7XKgzEFDJfTZRF2uX0ESRZKvGlPdJsmESTKrpb4gs5+HXQ6ZR/SdG58zkV+gGkfzEPCeXcDFgIbZkmejEF0AJB2gVQvtSMNKUJCehMzwPqSkFym3FFLv6AnA5VvcMZJW1/1gEX6RAhCSuwRLRFv7iIDrrUTYGb4adhg8v1iZ35NV82+o5dLu8fMZOz2Jsn/91/nHIHrauqpDHc7punnaUkjPnD7Y5dIvPl1+iDCKVP7wSf4uqGcmGlaV/dOQsmAvmzZn4SgEqUBQsYSDI8AiNe9M+EJmM0xPDK4PHhdPw7Q9w83xSuDdm+3eSOlBVLJwvun/nGnhw0GQrvIOP868D+mptI6TPbKDnQzrR5Pfiy93czH30xVp+/OIPKdMog0vBOq2w6gma1A/V3aCNpLj3UDv5dSdYTg7Banj5p4fG6yk2/mGzmKYYAxZ6WAvf76A36/82S+cLX8tir7xptJujamOS2PO9cSywlNg1EFnxSrp14B+fy8/4KUpSSlDT6hL/rD4YtisWmIIXKyZlG9DhKY=" };
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
