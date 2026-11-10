// Lista los datos de coyuntura con su fecha y marca los que tocan revisar.
// Uso: npm run datos
import { readFileSync } from "node:fs";
const coy = JSON.parse(readFileSync(new URL("../src/data/blondie-coyuntura.json", import.meta.url), "utf8"));
const hoy = new Date();
const meses = (d) => (hoy - new Date(d)) / (1000 * 60 * 60 * 24 * 30.4);
const limite = coy.meta.cadenceMonths;
let pendientes = 0;
console.log(`Blondie Macro · datos a ${coy.meta.label} · próxima revisión ${coy.meta.nextReview}\n`);
for (const [k, d] of Object.entries(coy.baseline)) {
  const fijo = d.status === "supuesto" || d.status === "anual";
  const viejo = !fijo && (d.status === "revisar" || meses(d.date) > limite);
  if (viejo) pendientes++;
  console.log(`${viejo ? "REVISAR" : fijo ? "  fijo " : "  ok   "}  ${k.padEnd(24)} ${String(d.value).padEnd(8)} ${d.date}  ${d.source}${d.pendiente ? "\n           -> " + d.pendiente : ""}`);
}
for (const [k, d] of Object.entries(coy.vigilancia)) {
  const viejo = meses(d.date) > limite; if (viejo) pendientes++;
  console.log(`${viejo ? "REVISAR" : "  ok   "}  vigilancia.${k.padEnd(13)} ${String(d.current).padEnd(8)} ${d.date}  ${d.source}`);
}
console.log(`\nIndicadores de vigilancia aún con dato de abril 2026: ${coy.vigilanciaPendiente.join(", ")}`);
console.log(`\n${pendientes} dato(s) por revisar.`);
if (hoy > new Date(coy.meta.nextReview)) console.log("AVISO: ha pasado la fecha de revisión.");

// ── Resto de simuladores ────────────────────────────────────────────────────
const reg = JSON.parse(readFileSync(new URL("../src/data/registro-datos.json", import.meta.url), "utf8"));
console.log("\n── Todos los simuladores ──");
for (const s of reg.simuladores) {
  const toca = hoy > new Date(s.nextReview);
  console.log(`${toca ? "TOCA   " : "  ok   "}  ${s.nombre.padEnd(32)} datos ${s.asOf} · revisar ${s.nextReview} (${s.cadencia})\n           ${s.donde}\n           ${s.que}`);
}
