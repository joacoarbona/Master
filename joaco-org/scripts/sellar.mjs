// Incorpora al sitio el paquete cifrado que genera «Sellar los ficheros privados» (Zona privada).
// Uso: node scripts/sellar.mjs ruta/al/privado-sellado.json [--conservar]
// Hace: public/privado/<id>.bin + public/privado/indice.json, comprueba tamaños y borra los originales en claro.
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
const root = fileURLToPath(new URL("..", import.meta.url));
const [, , file, flag] = process.argv;
if (!file) { console.error("Falta la ruta del paquete."); process.exit(1); }
const pkg = JSON.parse(readFileSync(file, "utf8"));
const src = readFileSync(join(root, "src/PrivateArea.tsx"), "utf8");
const salt = /FILES_SALT = "([^"]+)"/.exec(src)[1];
if (pkg.v !== 1 || pkg.salt !== salt || !Array.isArray(pkg.files)) { console.error("El paquete no corresponde a este sitio (versión o sal distintas)."); process.exit(1); }
const dir = join(root, "public/privado"); mkdirSync(dir, { recursive: true });
const idxPath = join(dir, "indice.json"); const index = existsSync(idxPath) ? JSON.parse(readFileSync(idxPath, "utf8")) : {};
const idOf = (p) => createHash("sha256").update("joaco.org" + p).digest("hex").slice(0, 24);
let ok = 0, warn = 0; const toDelete = [];
for (const f of pkg.files) {
  if (!/^\/[\w./-]+$/.test(f.path) || f.path.includes("..")) { console.error("Ruta no válida:", f.path); process.exit(1); }
  const ct = Buffer.from(f.ct, "base64"), iv = Buffer.from(f.iv, "base64");
  if (iv.length !== 12 || ct.length < 17) { console.error("Entrada dañada:", f.path); process.exit(1); }
  const plain = join(root, "public", f.path);
  if (existsSync(plain)) { const n = readFileSync(plain).length; if (ct.length !== n + 16) { console.warn(`AVISO ${f.path}: cifrado ${ct.length} bytes, original ${n} (+16 esperado). No se borra el original.`); warn++; } else toDelete.push(plain); }
  const id = idOf(f.path); writeFileSync(join(dir, id + ".bin"), ct); index[id] = { iv: f.iv, type: f.type || "text/html;charset=utf-8" }; ok++;
}
writeFileSync(idxPath, JSON.stringify(index, null, 1) + "\n");
if (flag !== "--conservar") for (const p of toDelete) rmSync(p);
console.log(`${ok} fichero(s) sellado(s) en public/privado/ · ${flag === "--conservar" ? 0 : toDelete.length} original(es) borrado(s) · ${warn} aviso(s).`);
