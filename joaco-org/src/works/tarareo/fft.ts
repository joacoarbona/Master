/* ============================================================
   TARAREO · FFT (radix-2) y espectros de magnitud
   ============================================================ */

const cache = new Map<number, { cos: Float64Array; sin: Float64Array; rev: Uint32Array }>();
function tables(n: number) {
  let t = cache.get(n);
  if (t) return t;
  const cos = new Float64Array(n / 2), sin = new Float64Array(n / 2);
  for (let i = 0; i < n / 2; i++) { cos[i] = Math.cos((2 * Math.PI * i) / n); sin[i] = -Math.sin((2 * Math.PI * i) / n); }
  const bits = Math.log2(n), rev = new Uint32Array(n);
  for (let i = 0; i < n; i++) { let r = 0, x = i; for (let b = 0; b < bits; b++) { r = (r << 1) | (x & 1); x >>= 1; } rev[i] = r; }
  t = { cos, sin, rev };
  cache.set(n, t);
  return t;
}

/** FFT compleja en el sitio. n potencia de 2. */
export function fft(re: Float64Array, im: Float64Array) {
  const n = re.length, { cos, sin, rev } = tables(n);
  for (let i = 0; i < n; i++) {
    const j = rev[i];
    if (j > i) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; }
  }
  for (let size = 2; size <= n; size <<= 1) {
    const half = size >> 1, step = n / size;
    for (let i = 0; i < n; i += size) {
      for (let j = 0, k = 0; j < half; j++, k += step) {
        const a = i + j, b = a + half;
        const tr = re[b] * cos[k] - im[b] * sin[k];
        const ti = re[b] * sin[k] + im[b] * cos[k];
        re[b] = re[a] - tr; im[b] = im[a] - ti;
        re[a] += tr; im[a] += ti;
      }
    }
  }
}

const hannCache = new Map<number, Float64Array>();
export function hann(n: number): Float64Array {
  let w = hannCache.get(n);
  if (!w) { w = new Float64Array(n); for (let i = 0; i < n; i++) w[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1)); hannCache.set(n, w); }
  return w;
}

/**
 * Magnitud de un trozo [start, start+win) con ventana de Hann, rellenado con ceros hasta n.
 * Normalizada por la suma de la ventana: una senoide de amplitud A da un pico ≈ A/2.
 */
export function magSpectrum(x: Float32Array, start: number, win: number, n: number, re = new Float64Array(n), im = new Float64Array(n)): Float32Array {
  const w = hann(win);
  let ws = 0;
  for (let i = 0; i < win; i++) ws += w[i];
  re.fill(0); im.fill(0);
  for (let i = 0; i < win; i++) { const k = start + i; re[i] = k >= 0 && k < x.length ? x[k] * w[i] : 0; }
  fft(re, im);
  const out = new Float32Array(n / 2 + 1);
  for (let i = 0; i <= n / 2; i++) out[i] = Math.hypot(re[i], im[i]) / ws;
  return out;
}
