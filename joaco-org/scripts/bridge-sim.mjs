// Banco de pruebas de Bridge Maestro: cuatro bots subastan y cartean N manos y se miden los resultados.
// Uso: npm run bridge:sim            (400 manos)
//      npm run bridge:sim -- 1500
// Qué mirar: % de mangas cumplidas, nº de subastas anómalas ("weird") y que "illegal" sea 0.
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
const SRC = fileURLToPath(new URL("../src/works/Bridge.jsx", import.meta.url));
const src = readFileSync(SRC, "utf8").split("\n");
const cut = src.findIndex(l => l.startsWith("const _mem = {}"));
const a = src.findIndex(l => l.startsWith("function partnerOf("));
const b = src.findIndex(l => l.startsWith("function SeatCard("));
const firstCode = src.findIndex(l => l.startsWith("/* ====="));
let code = src.slice(firstCode, cut).join("\n") + "\n" + src.slice(a, b).join("\n");
code += "\nexport { botTableResult, impsFor, generateDeal, botCall, auctionDone, auctionContract, aiCard, initGame, applyCard, resolveTrick, hcp, legalCards, sideOfSeat, nextSeat };\n";
const out = join(mkdtempSync(join(tmpdir(), "bridge-")), "engine.mjs");
writeFileSync(out, code);
const E = await import(pathToFileURL(out).href);
const N = +process.argv[2] || 400, ORD = ["N","E","S","W"];
const st = { passout: 0, lvl: {}, made: 0, played: 0, ms: 0, weird: [], bySide: { NS: 0, EW: 0 }, dbl: 0, illegal: 0, long: 0 };
const overUnder = {};
for (let seed = 1; seed <= N; seed++) {
  const d = E.generateDeal(seed); const hands = d.hands; let seat = ORD[seed % 4]; const calls = [];
  while (!E.auctionDone(calls) && calls.length < 60) { let c; try { c = E.botCall(hands, seat, calls, { expert: true }); } catch (e) { st.weird.push(seed + " EXC " + e.message); c = "Pass"; } calls.push({ seat, call: c }); seat = E.nextSeat(seat); }
  if (calls.length >= 60) st.long++;
  const ct = E.auctionContract(calls);
  if (!ct) { st.passout++; const ns = E.hcp(hands.N) + E.hcp(hands.S); if (ns >= 25 || ns <= 15) st.weird.push(`${seed} PASSOUT ns=${ns}`); continue; }
  const side = E.sideOfSeat(ct.declarer); st.bySide[side]++; st.lvl[ct.level] = (st.lvl[ct.level] || 0) + 1; if (ct.doubled) st.dbl++;
  const dh = side === "NS" ? E.hcp(hands.N) + E.hcp(hands.S) : E.hcp(hands.E) + E.hcp(hands.W);
  const t0 = Date.now(); let g = E.initGame({ hands, contract: ct });
  while (!g.finished) { if (g.resolving) { g = E.resolveTrick(g); continue; } const c = E.aiCard(g.turn, g, "hard", ct.declarer); const led = g.trick.length ? g.trick[0].card.s : null; if (!E.legalCards(g.hands[g.turn], led).some(x => x.s === c.s && x.r === c.r)) st.illegal++; g = E.applyCard(g, g.turn, c); }
  st.ms += Date.now() - t0; st.played++;
  const tr = side === "NS" ? g.tricksNS : g.tricksEW; const diff = tr - (6 + ct.level); if (diff >= 0) st.made++;
  const k = ct.level >= 6 ? "slam" : (ct.level >= 5 || (ct.level === 4 && (ct.strain === "♠" || ct.strain === "♥")) || (ct.level >= 3 && ct.strain === "ST")) ? "game" : "part";
  overUnder[k] = overUnder[k] || { n: 0, made: 0, sum: 0 }; overUnder[k].n++; overUnder[k].made += diff >= 0 ? 1 : 0; overUnder[k].sum += diff;
  if ((k === "game" && dh < 21) || (k === "slam" && dh < 28) || (k === "part" && dh >= 27) || diff <= -4)
    st.weird.push(`${seed} ${ct.level}${ct.strain}${ct.doubled} by ${ct.declarer} hcp=${dh} tricks=${tr} :: ${calls.map(c => c.call).join(" ")}`);
}
console.log(JSON.stringify({ N, passout: st.passout, bySide: st.bySide, lvl: st.lvl, doubled: st.dbl, madePct: Math.round(100 * st.made / st.played), msPerDeal: Math.round(st.ms / st.played), illegal: st.illegal, long: st.long }));
for (const k in overUnder) console.log(k, overUnder[k].n, "made", Math.round(100 * overUnder[k].made / overUnder[k].n) + "%", "avg diff", (overUnder[k].sum / overUnder[k].n).toFixed(2));
console.log("weird:", st.weird.length); console.log(st.weird.slice(0, 28).join("\n"));
