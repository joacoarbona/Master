/**
 * Salas cifradas sin servidor propio.
 *
 * Mismo esquema que usa el multijugador del juego de golf: un código corto se convierte
 * (PBKDF2) en una clave AES-GCM y en un tema de un broker MQTT público. Todo lo que viaja va
 * cifrado con esa clave; el broker solo ve bytes. No hay cuentas ni base de datos.
 *
 * Límites: los brokers públicos no garantizan disponibilidad ni cuánto tiempo conservan el
 * último mensaje retenido. Para datos poco sensibles (progreso de un juego) es suficiente.
 */

export const DEFAULT_BROKERS = ["wss://broker.emqx.io:8084/mqtt", "wss://broker.hivemq.com:8884/mqtt"];
const ALPHA = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const TE = new TextEncoder(), TD = new TextDecoder();

/** `?broker=wss://…` en la URL sustituye a los brokers por defecto (se usa en pruebas). */
export function brokers(): string[] {
  try {
    const q = new URLSearchParams(window.location.search).get("broker");
    if (q) return q.split(",").map(s => s.trim()).filter(Boolean);
  } catch { /* sin window */ }
  return DEFAULT_BROKERS;
}
export const roomsSupported = () => typeof window !== "undefined" && !!(window.crypto && crypto.subtle && window.WebSocket);

const toHex = (u: Uint8Array) => { let s = ""; for (const b of u) s += b.toString(16).padStart(2, "0"); return s; };
export function randId(bytes = 8) { const a = new Uint8Array(bytes); crypto.getRandomValues(a); return toHex(a); }
export function newCode(len = 10) { const a = new Uint8Array(len); crypto.getRandomValues(a); let s = ""; for (const v of a) s += ALPHA[v % ALPHA.length]; return s; }
export function normCode(s: string) { return String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 16); }
export function prettyCode(c: string) { if (!c) return ""; const n = c.length <= 6 ? Math.ceil(c.length / 2) : 5; return c.replace(new RegExp(`(.{${n}})(?=.)`, "g"), "$1-"); }

async function derive(code: string, ns: string) {
  const base = await crypto.subtle.importKey("raw", TE.encode(code), "PBKDF2", false, ["deriveBits"]);
  const bits = new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", salt: TE.encode("joaco.org/" + ns), iterations: 150000, hash: "SHA-256" }, base, 256));
  const key = await crypto.subtle.importKey("raw", bits.slice(0, 16), { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
  return { key, topic: "joaco/" + ns + "/" + toHex(bits.slice(16, 28)) };
}
async function seal(key: CryptoKey, obj: unknown) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, TE.encode(JSON.stringify(obj))));
  const out = new Uint8Array(12 + ct.length); out.set(iv); out.set(ct, 12); return out;
}
async function unseal(key: CryptoKey, buf: Uint8Array) {
  if (buf.length < 29) return null;
  try { return JSON.parse(TD.decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: buf.subarray(0, 12) }, key, buf.subarray(12)))); } catch { return null; }
}

/* ---- Cliente MQTT 3.1.1 mínimo sobre WebSocket (QoS 0, keep-alive, reconexión) ---- */
function mqStr(s: string | Uint8Array) { const b = typeof s === "string" ? TE.encode(s) : s; const o = new Uint8Array(2 + b.length); o[0] = (b.length >> 8) & 255; o[1] = b.length & 255; o.set(b, 2); return o; }
function mqPkt(type: number, parts: Uint8Array[]) {
  let L = 0; for (const p of parts) L += p.length;
  const lb: number[] = []; let n = L; do { let d = n % 128; n = Math.floor(n / 128); if (n > 0) d |= 128; lb.push(d); } while (n > 0);
  const o = new Uint8Array(1 + lb.length + L); o[0] = type; o.set(lb, 1); let k = 1 + lb.length; for (const p of parts) { o.set(p, k); k += p.length; } return o;
}
class MQ {
  ws: WebSocket | null = null; subs: string[] = []; up = false; buf: Uint8Array | null = null; tries = 0; dead = false; pid = 1; cid = "jo" + randId();
  private pingT: any; private cto: any; private rt: any;
  constructor(public url: string, private onMsg: (topic: string, payload: Uint8Array) => void, private onUp: (up: boolean) => void) { this.open(); }
  open() {
    if (this.dead) return; let ws: WebSocket;
    try { ws = new WebSocket(this.url, ["mqtt"]); } catch { this.retry(); return; }
    this.ws = ws; ws.binaryType = "arraybuffer"; this.buf = null;
    ws.onopen = () => { try { ws.send(mqPkt(0x10, [new Uint8Array([0, 4, 77, 81, 84, 84, 4, 0x02, 0, 40]), mqStr(this.cid)])); } catch { /* se reintenta */ } };
    ws.onmessage = (e) => { if (typeof e.data !== "string") this.feed(new Uint8Array(e.data)); };
    ws.onclose = () => { if (this.ws !== ws) return; clearInterval(this.pingT); clearTimeout(this.cto); const was = this.up; this.up = false; if (was) this.onUp(false); this.retry(); };
    ws.onerror = () => { /* onclose se encarga */ };
    clearTimeout(this.cto); this.cto = setTimeout(() => { if (!this.up && this.ws === ws) { try { ws.close(); } catch { /* ya cerrado */ } } }, 9000);
  }
  retry() { if (this.dead) return; clearTimeout(this.rt); const d = Math.min(20000, 1200 * Math.pow(1.8, this.tries++)); this.rt = setTimeout(() => this.open(), d); }
  sendSub(list: string[]) { if (!list.length || !this.ws) return; this.pid = (this.pid % 65535) + 1; const parts = [new Uint8Array([this.pid >> 8, this.pid & 255])]; for (const t of list) parts.push(mqStr(t), new Uint8Array([0])); try { this.ws.send(mqPkt(0x82, parts)); } catch { /* se reintenta al reconectar */ } }
  sub(t: string) { if (!this.subs.includes(t)) this.subs.push(t); if (this.up) this.sendSub([t]); }
  pub(t: string, payload: Uint8Array, retain = false) { if (!this.up || !this.ws || this.ws.readyState !== 1) return false; try { this.ws.send(mqPkt(retain ? 0x31 : 0x30, [mqStr(t), payload])); return true; } catch { return false; } }
  feed(ch: Uint8Array) {
    let b = ch; if (this.buf && this.buf.length) { b = new Uint8Array(this.buf.length + ch.length); b.set(this.buf); b.set(ch, this.buf.length); }
    let p = 0;
    while (b.length - p >= 2) { let mul = 1, len = 0, i = p + 1, byte = 0, ok = true; do { if (i >= b.length) { ok = false; break; } byte = b[i++]; len += (byte & 127) * mul; mul *= 128; } while (byte & 128); if (!ok || b.length - i < len) break; this.pkt(b[p], b.subarray(i, i + len)); p = i + len; }
    this.buf = p < b.length ? b.slice(p) : null;
  }
  pkt(h: number, d: Uint8Array) {
    const t = h >> 4;
    if (t === 2) {
      if (d.length >= 2 && d[1] === 0) { this.up = true; this.tries = 0; clearTimeout(this.cto); this.sendSub(this.subs); clearInterval(this.pingT); this.pingT = setInterval(() => { try { if (this.ws && this.ws.readyState === 1) this.ws.send(new Uint8Array([0xC0, 0])); } catch { /* se detecta en onclose */ } }, 15000); this.onUp(true); }
      else { try { this.ws?.close(); } catch { /* ya cerrado */ } }
    } else if (t === 3) { if (d.length < 2) return; const tl = (d[0] << 8) | d[1]; const topic = TD.decode(d.subarray(2, 2 + tl)); let o = 2 + tl; if ((h >> 1) & 3) o += 2; this.onMsg(topic, d.slice(o)); }
  }
  close() { this.dead = true; clearTimeout(this.rt); clearTimeout(this.cto); clearInterval(this.pingT); const ws = this.ws; this.ws = null; this.up = false; try { if (ws && ws.readyState === 1) ws.send(new Uint8Array([0xE0, 0])); ws?.close(); } catch { /* ya cerrado */ } }
}

export type RoomMsg = { from: string; channel: string; data: any };
export type RoomOpts = { code: string; ns: string; deviceId: string; onMessage: (m: RoomMsg) => void; onStatus?: (up: boolean) => void };

/**
 * Sala: publica y recibe objetos cifrados en `canales`. Con `retain`, el broker guarda el
 * último mensaje de ese canal y dispositivo y se lo entrega a quien se conecte después.
 */
export class Room {
  private conns: MQ[] = []; private key: CryptoKey | null = null; private topic = ""; private seen = new Map<string, number>(); private closed = false; private queue: Array<() => void> = [];
  constructor(private o: RoomOpts) { this.init(); }
  private async init() {
    try { const d = await derive(this.o.code, this.o.ns); if (this.closed) return; this.key = d.key; this.topic = d.topic; } catch { this.o.onStatus?.(false); return; }
    for (const url of brokers()) {
      const c = new MQ(url, (topic, payload) => this.recv(topic, payload), () => { const up = this.isUp(); this.o.onStatus?.(up); if (up) { const q = this.queue; this.queue = []; q.forEach(f => f()); } });
      c.sub(this.topic + "/#"); this.conns.push(c);
    }
  }
  isUp() { return this.conns.some(c => c.up); }
  private async recv(topic: string, payload: Uint8Array) {
    if (!this.key || !payload.length) return;
    const m = await unseal(this.key, payload); if (!m || typeof m !== "object" || m.from === this.o.deviceId) return;
    const mid = String(m.mid || ""); if (mid) { if (this.seen.has(mid)) return; this.seen.set(mid, Date.now()); if (this.seen.size > 400) { const first = this.seen.keys().next().value; if (first) this.seen.delete(first); } }
    const channel = topic.slice(this.topic.length + 1).split("/")[0];
    this.o.onMessage({ from: m.from, channel, data: m.data });
  }
  /** Envía `data` por `channel`. Devuelve false si no hay conexión (se manda al reconectar si `retain`). */
  async send(channel: string, data: unknown, retain = false): Promise<boolean> {
    if (this.closed) return false;
    const doSend = async () => { if (!this.key) return false; const sealed = await seal(this.key, { from: this.o.deviceId, mid: randId(6), data }); const t = this.topic + "/" + channel + (retain ? "/" + this.o.deviceId : ""); let ok = false; for (const c of this.conns) ok = c.pub(t, sealed, retain) || ok; return ok; };
    if (!this.isUp() || !this.key) { if (retain) { this.queue = [() => { doSend(); }]; } return false; }
    return doSend();
  }
  close() { this.closed = true; this.conns.forEach(c => c.close()); this.conns = []; }
}
