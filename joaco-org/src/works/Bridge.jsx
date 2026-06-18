import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Globe, User, Users, BookOpen, Brain, Layers, FileText, Lightbulb,
  Eye, EyeOff, Check, RotateCcw, ChevronRight, ChevronLeft, Play,
  Award, Sparkles, Home as HomeIcon, Library, ArrowLeft, HelpCircle,
  X, GraduationCap, Target, Trophy, Shuffle, Plus
} from "lucide-react";

/* ============================================================
   BRIDGE MAESTRO — Mayores Quintos / 5-Card Majors
   Single-file React learning app.
   ============================================================ */

// ---------- Theme palette (inline styles; Tailwind core only for layout) ----------
const C = {
  felt: "#1b4332", feltDark: "#0f261c", feltLite: "#2d6a4f",
  ivory: "#f6f1e3", parch: "#ece4cf", ink: "#1d231f",
  brass: "#c9a227", brassDim: "#8f6f1c", red: "#b3261e",
  line: "#3a5d4c", line2: "#26463a", win: "#3f8f5e", soft: "#cdbf95",
};
const SUIT_RED = new Set(["♥", "♦"]);

// ---------- Cards / deck ----------
const SUITS = ["♠", "♥", "♦", "♣"];
const SUIT_KEY = { "♠": "S", "♥": "H", "♦": "D", "♣": "C" };
const RANKS = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];
const RVAL = { A: 14, K: 13, Q: 12, J: 11, T: 10, "9": 9, "8": 8, "7": 7, "6": 6, "5": 5, "4": 4, "3": 3, "2": 2 };
const HCP = { A: 4, K: 3, Q: 2, J: 1 };

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function makeDeck() {
  const d = [];
  for (const s of SUITS) for (const r of RANKS) d.push({ s, r });
  return d;
}
function shuffle(arr, rng) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor((rng ? rng() : Math.random()) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function dealHands(rng) {
  const d = shuffle(makeDeck(), rng);
  return { N: d.slice(0, 13), E: d.slice(13, 26), S: d.slice(26, 39), W: d.slice(39, 52) };
}
function sortHand(cards) {
  const order = { "♠": 0, "♥": 1, "♦": 2, "♣": 3 };
  return cards.slice().sort((a, b) => order[a.s] - order[b.s] || RVAL[b.r] - RVAL[a.r]);
}
function bySuit(cards) {
  const m = { "♠": [], "♥": [], "♦": [], "♣": [] };
  for (const c of cards) m[c.s].push(c);
  for (const s of SUITS) m[s].sort((a, b) => RVAL[b.r] - RVAL[a.r]);
  return m;
}
function hcp(cards) { return cards.reduce((n, c) => n + (HCP[c.r] || 0), 0); }
function lengths(cards) { const m = bySuit(cards); return { "♠": m["♠"].length, "♥": m["♥"].length, "♦": m["♦"].length, "♣": m["♣"].length }; }
function isBalanced(L) {
  const v = [L["♠"], L["♥"], L["♦"], L["♣"]].sort((a, b) => a - b);
  // 4333,4432,5332
  const shape = v.join("");
  return shape === "3334" || shape === "2344" || shape === "2335";
}
function distPoints(L) { // shortness points for support
  let p = 0; for (const s of SUITS) { if (L[s] === 0) p += 3; else if (L[s] === 1) p += 2; else if (L[s] === 2) p += 1; }
  return p;
}

// ============================================================
//  BIDDING ENGINE — 5-card majors
//  Returns { bid, alts:[], why, insight, hint }
//  lang-aware via tx(es,en)
// ============================================================
function tx(lang, es, en) { return lang === "es" ? es : en; }

function evalOpening(hand, lang) {
  const h = hcp(hand), L = lengths(hand), bal = isBalanced(L);
  const sp = L["♠"], he = L["♥"], di = L["♦"], cl = L["♣"];
  const longest = Math.max(sp, he, di, cl);
  const ruleOf20 = h + sp + he + di + cl - longest /*not used*/;
  const twoLongest = (() => { const a = [sp, he, di, cl].sort((x, y) => y - x); return a[0] + a[1]; })();
  let bid, why, insight, hint;
  if (bal && h >= 15 && h <= 17) {
    bid = "1NT"; why = tx(lang, "Mano equilibrada con 15-17 PH: apertura natural de 1ST.", "Balanced 15-17 HCP: natural 1NT opening.");
    insight = tx(lang, "Compañero sabe PH (15-17) y forma equilibrada; puede usar Stayman o transferencias.", "Partner now knows 15-17 HCP balanced; can use Stayman or transfers.");
  } else if (bal && h >= 20 && h <= 21) {
    bid = "2NT"; why = tx(lang, "Equilibrada de 20-21 PH: apertura de 2ST.", "Balanced 20-21 HCP: 2NT opening.");
    insight = tx(lang, "Casi obliga a juego; compañero invita o cierra.", "Near game-forcing; partner invites or signs off.");
  } else if (h >= 22) {
    bid = "2♣"; why = tx(lang, "22+ PH (o equivalente en juego): apertura fuerte y artificial de 2♣.", "22+ HCP (or game-equivalent): strong artificial 2♣.");
    insight = tx(lang, "2♣ es artificial y forcing a manga. Compañero responde 2♦ (relevo) por defecto.", "2♣ is artificial and game-forcing. Partner relays with 2♦ by default.");
  } else if (he >= 5 || sp >= 5) {
    if (sp >= 5 && sp >= he) { bid = "1♠"; }
    else { bid = "1♥"; }
    why = tx(lang, "Mayores quintos: con 5+ cartas en un mayor (y 12-21 PH), abre ese mayor. Con 5-5 abre el más alto (♠).", "5-card majors: with 5+ in a major and 12-21 HCP, open it. With 5-5, open the higher (♠).");
    insight = tx(lang, "Promete 5+ cartas y 12-21 PH. La respuesta define apoyo, fuerza o palo propio.", "Promises 5+ cards, 12-21 HCP. Responder shows fit, strength, or own suit.");
  } else if (h >= 12 || (twoLongest >= 9 && h >= 11)) {
    // open a minor
    if (di > cl) { bid = "1♦"; } else if (cl > di) { bid = "1♣"; } else { bid = di >= 4 ? "1♦" : "1♣"; }
    why = tx(lang, "Sin mayor quinto, abre el mejor menor (12-21 PH). 4-4 → 1♦; 3-3 → 1♣.", "No 5-card major: open the better minor (12-21 HCP). 4-4 → 1♦; 3-3 → 1♣.");
    insight = tx(lang, "Apertura de menor: 3+ cartas. No niega un mayor de 4. Deja sitio para encontrar fit mayor.", "Minor opening: 3+ cards. Does not deny a 4-card major. Keeps room to find a major fit.");
  } else if (h >= 6 && h <= 10 && longest >= 6 && (he === longest || sp === longest || di === longest) && cl !== longest) {
    const suit = sp === longest ? "♠" : he === longest ? "♥" : "♦";
    bid = "2" + suit; why = tx(lang, "Mano débil con sexta: barrida débil (6-10 PH, 6 cartas).", "Weak hand with a 6-card suit: weak two (6-10 HCP).");
    insight = tx(lang, "Preventiva: roba espacio. Promete 6 cartas y poca fuerza. 2ST = relevo de descripción.", "Preemptive: steals space. Shows 6 cards, limited values. 2NT = feature ask.");
  } else if (h >= 6 && h <= 10 && longest >= 7) {
    const suit = sp === longest ? "♠" : he === longest ? "♥" : di === longest ? "♦" : "♣";
    bid = "3" + suit; why = tx(lang, "Séptima y poca fuerza: apertura preventiva de 3.", "7-card suit, limited values: preemptive 3-level opening.");
    insight = tx(lang, "Preventiva agresiva; presiona a los rivales antes de que dialoguen.", "Aggressive preempt; pressures opponents before they can talk.");
  } else {
    bid = "Pass"; why = tx(lang, "Menos de 12 PH y sin forma de apertura preventiva: paso.", "Fewer than 12 HCP and no preempt shape: pass.");
    insight = tx(lang, "Pasar no es debilidad: esperar mejor momento es disciplina.", "Passing isn't weakness — waiting is discipline.");
  }
  hint = tx(lang,
    `Cuenta PH (${h}) y mira tu palo más largo (${longest}). ¿Equilibrada? ${bal ? "sí" : "no"}.`,
    `Count HCP (${h}) and your longest suit (${longest}). Balanced? ${bal ? "yes" : "no"}.`);
  const alts = bid === "1♠" && sp === he ? ["1♥"] : [];
  return { bid, alts, why, insight, hint };
}

function evalRespMajor(hand, openMajor, lang) {
  const h = hcp(hand), L = lengths(hand);
  const support = L[openMajor];
  const total = h + (support >= 3 ? distPoints(L) : 0);
  let bid, why, insight, hint, alts = [];
  const other = openMajor === "♠" ? "♥" : "♠";
  if (support >= 3) {
    if (total <= 9) { bid = "2" + openMajor; why = tx(lang, "Apoyo de 3+ y 6-9 puntos de apoyo: subida simple a 2.", "3+ support and 6-9 support points: simple raise to 2."); insight = tx(lang, "Fit hallado, fuerza limitada. Abridor pasa o invita.", "Fit found, limited values. Opener passes or invites."); }
    else if (total <= 12) { bid = "3" + openMajor; why = tx(lang, "Apoyo de 3-4 y 10-12: subida invitacional (limit raise) a 3.", "3-4 support and 10-12: invitational limit raise to 3."); insight = tx(lang, "Invita a manga; abridor cierra en 4 con máximo.", "Invites game; opener bids 4 with a maximum."); }
    else { bid = support >= 4 ? "4" + openMajor : "2NT"; why = tx(lang, support >= 4 ? "Apoyo de 4 y 13+ o forma distributiva: a manga (o un fit-jump/Jacoby según convención)." : "Apoyo de 3 y 13+ equilibrada: 2ST (forcing de manga / Jacoby 2NT según convención).", support >= 4 ? "4-card support and 13+ or distributional: bid game (or a Jacoby 2NT per convention)." : "3-card support and 13+ balanced: 2NT (game force / Jacoby per convention)."); insight = tx(lang, "Acuerdo de manga con fit; explorar slam si hay 30+.", "Game with a fit; explore slam if 30+ combined."); }
  } else if (L[other] >= 4 && h >= 6 && (openMajor === "♥")) {
    bid = "1♠"; why = tx(lang, "Sin apoyo pero con 4+ ♠ y 6+ PH: cambio de palo a nivel 1, forcing.", "No fit but 4+ ♠ and 6+ HCP: new suit at the 1-level, forcing.");
    insight = tx(lang, "Cambio de palo = forcing. Promete 4+ cartas y busca fit alternativo.", "New suit = forcing. Shows 4+ cards, seeks an alternative fit.");
  } else if (h >= 6 && h <= 10) {
    bid = "1NT"; why = tx(lang, "Sin fit y 6-10 sin palo nuevo cómodo: 1ST de respuesta (semi-forcing).", "No fit, 6-10, no convenient new suit: 1NT response (semi-forcing).");
    insight = tx(lang, "Niega apoyo y limita fuerza; mano no apta para nivel 2.", "Denies support, caps strength; not enough for the 2-level.");
  } else if (h >= 11) {
    bid = "2NT"; why = tx(lang, "Equilibrada de 11-12 sin fit: invitación natural (depende del sistema).", "Balanced 11-12 without a fit: natural invitation (system-dependent).");
    insight = tx(lang, "Invita a 3ST mostrando paradas equilibradas.", "Invites 3NT showing balanced stoppers.");
  } else {
    bid = "Pass"; why = tx(lang, "Menos de 6 PH: pasa la apertura de 1.", "Fewer than 6 HCP: pass the 1-level opening.");
    insight = tx(lang, "Muy débil para responder; mejor no subir el contrato.", "Too weak to respond; don't push the contract up.");
  }
  hint = tx(lang, `¿Tienes 3+ en ${openMajor}? Tienes ${support}. PH=${h}.`, `Do you have 3+ ${openMajor}? You have ${support}. HCP=${h}.`);
  return { bid, alts, why, insight, hint };
}

function evalRespNT(hand, lang) {
  const h = hcp(hand), L = lengths(hand), bal = isBalanced(L);
  let bid, why, insight, hint, alts = [];
  const has5M = L["♥"] >= 5 || L["♠"] >= 5;
  const has4M = L["♥"] >= 4 || L["♠"] >= 4;
  if (L["♥"] >= 5 && L["♥"] >= L["♠"]) { bid = "2♦"; why = tx(lang, "Transferencia Jacoby: 2♦ pide a abridor declarar 2♥ (5+ corazones).", "Jacoby transfer: 2♦ asks opener to bid 2♥ (5+ hearts)."); insight = tx(lang, "Abridor declara y queda como mano oculta; protege tenazas.", "Opener becomes declarer; protects tenaces."); }
  else if (L["♠"] >= 5) { bid = "2♥"; why = tx(lang, "Transferencia Jacoby: 2♥ pide 2♠ (5+ picas).", "Jacoby transfer: 2♥ asks for 2♠ (5+ spades)."); insight = tx(lang, "Tras la transferencia, el respondedor describe fuerza.", "After the transfer, responder describes strength."); }
  else if (has4M && h >= 8) { bid = "2♣"; why = tx(lang, "Stayman: 2♣ pregunta por un mayor de 4 cartas (con interés de manga).", "Stayman: 2♣ asks for a 4-card major (with game interest)."); insight = tx(lang, "Busca fit 4-4 en mayor antes de jugar 3ST.", "Looks for a 4-4 major fit before settling on 3NT."); }
  else if (bal && h <= 7) { bid = "Pass"; why = tx(lang, "0-7 equilibrada: pasa 1ST.", "0-7 balanced: pass 1NT."); insight = tx(lang, "Combinado < 25; no hay manga. Mejor parcial.", "Combined < 25; no game. Settle for the part-score."); }
  else if (bal && h <= 9) { bid = "2NT"; why = tx(lang, "8-9 equilibrada: invitación a 3ST.", "8-9 balanced: invitation to 3NT."); insight = tx(lang, "Abridor acepta con 17 (o 16 bueno).", "Opener accepts with 17 (or a good 16)."); }
  else { bid = "3NT"; why = tx(lang, "10-15 equilibrada sin mayor 5: cierra en 3ST.", "10-15 balanced, no 5-card major: bid 3NT."); insight = tx(lang, "25+ combinados garantizan manga sin slam.", "25+ combined points: game, not slam."); }
  hint = tx(lang, `PH=${h}. ¿Mayor de 5? ${has5M ? "sí" : "no"}. ¿Mayor de 4? ${has4M ? "sí" : "no"}.`, `HCP=${h}. 5-card major? ${has5M ? "yes" : "no"}. 4-card major? ${has4M ? "yes" : "no"}.`);
  return { bid, alts, why, insight, hint };
}

function evalOvercall(hand, rhoSuit, lang) {
  const h = hcp(hand), L = lengths(hand);
  // takeout double if short in rho suit and opening values with support for others
  const shortRho = L[rhoSuit] <= 2;
  let bid, why, insight, hint, alts = [];
  const longest = Math.max(L["♠"], L["♥"], L["♦"], L["♣"]);
  const longSuit = SUITS.find(s => L[s] === longest);
  if (h >= 12 && shortRho && (L["♠"] >= 3 && L["♥"] >= 3 && L[rhoSuit] <= 2)) {
    bid = "X"; why = tx(lang, "Doblo de información (takeout): 12+ PH, corto en el palo rival y apoyo a los otros palos.", "Takeout double: 12+ HCP, short in opener's suit, support for the others.");
    insight = tx(lang, "Pide a compañero elegir su mejor palo; no es de castigo.", "Asks partner to pick their best suit; not for penalty.");
  } else if (longest >= 5 && h >= 8 && h <= 16 && longSuit !== rhoSuit) {
    bid = "1" + longSuit; if (RANKS && (longSuit === "♣" || (longSuit === "♦" && rhoSuit === "♠"))) { /*level handled below*/ }
    // simple: overcall at the cheapest level
    bid = "1" + longSuit; why = tx(lang, "Intervención natural: 5+ cartas y 8-16 PH en un buen palo.", "Natural overcall: 5+ cards and 8-16 HCP in a good suit.");
    insight = tx(lang, "Sugiere salida, gana espacio y describe un palo de 5+.", "Suggests a lead, grabs space, shows a 5+ suit.");
  } else if (longest >= 6 && h >= 6 && h <= 10) {
    bid = "2" + longSuit; why = tx(lang, "Sexta y poca fuerza: intervención débil a salto / barrida.", "6-card suit, limited values: weak jump overcall.");
    insight = tx(lang, "Preventiva: complica la subasta rival.", "Preemptive: disrupts the opponents' auction.");
  } else {
    bid = "Pass"; why = tx(lang, "Sin palo decente ni valores para doblar: paso.", "No decent suit or doubling values: pass.");
    insight = tx(lang, "Intervenir flojo regala información y puntos.", "Overcalling light leaks information and points.");
  }
  hint = tx(lang, `Rival abrió ${rhoSuit}. Tu palo más largo: ${longSuit} (${longest}). PH=${h}.`, `RHO opened ${rhoSuit}. Your longest suit: ${longSuit} (${longest}). HCP=${h}.`);
  return { bid, alts, why, insight, hint };
}

// ============================================================
//  CURRICULUM — 5 levels, bilingual content
// ============================================================
const LEVELS = [
  {
    id: 1, key: "fund",
    name: { es: "Nivel 1 · Fundamentos", en: "Level 1 · Foundations" },
    sub: { es: "La baraja, bazas, puntos y el contrato", en: "The deck, tricks, points and the contract" },
    dealsTarget: 40,
    lessons: [
      { id: "l1a", t: { es: "La baraja, las bazas y la mesa", en: "The deck, tricks and the table" },
        body: { es: "El bridge usa **52 cartas**, 13 por palo (♠ ♥ ♦ ♣) y dentro de cada palo el orden de fuerza es A K Q J 10 9 8 7 6 5 4 3 2.\n\nCuatro jugadores forman **dos parejas**: Norte-Sur contra Este-Oeste, sentados en los puntos cardinales. Tu compañero está enfrente.\n\n› Cómo se gana una baza\n• Cada mano se reparte 13 cartas y se juegan **13 bazas**.\n• A cada baza, los cuatro ponen una carta por turno en el sentido de las agujas del reloj.\n• Gana la **carta más alta del palo de salida**, salvo que alguien ponga un triunfo: entonces gana el triunfo más alto.\n• Estás **obligado a asistir** (servir) al palo de salida si tienes una carta de ese palo. Solo si no tienes puedes fallar (poner triunfo) o descartar.\n\n› El dador y la rotación\nEl **dador** reparte y hace la primera declaración; el turno avanza siempre a la izquierda. Quien gana una baza sale (lidera) a la siguiente.", en: "Bridge uses **52 cards**, 13 per suit (♠ ♥ ♦ ♣); within a suit the strength order is A K Q J 10 9 8 7 6 5 4 3 2.\n\nFour players form **two partnerships**: North-South vs East-West, seated at the compass points. Your partner sits opposite you.\n\n› How a trick is won\n• Each hand is dealt 13 cards and **13 tricks** are played.\n• On each trick the four players play one card in turn, clockwise.\n• The **highest card of the led suit** wins, unless someone plays a trump: then the highest trump wins.\n• You **must follow suit** if you hold the led suit. Only when void may you ruff (play a trump) or discard.\n\n› Dealer and rotation\nThe **dealer** deals and makes the first call; the turn always moves to the left. Whoever wins a trick leads to the next." } },
      { id: "l1b", t: { es: "Puntos de honor y distribución", en: "High-card points and distribution" },
        body: { es: "Para valorar tu mano sumas **puntos de honor (PH)**: As=4, Rey=3, Dama=2, Jota=1. La baraja tiene **40 PH** en total, así que una mano media vale 10.\n\n› Puntos de distribución\nCuando ya hay (o esperas) un **fit** de triunfo, los cortes valen:\n• Singleton (1 carta) = **+2**\n• Void/chicane (0 cartas) = **+3**\n• Doubleton (2 cartas) = **+1**\nEstos puntos cuentan porque podrás fallar perdedoras con el triunfo. Sin fit, en Sin Triunfo, los cortes no suman; lo que vale es la **longitud** (un 5º o 6º cartón de un palo largo puede ganar bazas).\n\n› Umbrales que debes memorizar\n• ~**25 PH** combinados → **manga** (game)\n• ~**33 PH** → **slam pequeño** (12 bazas)\n• ~**37 PH** → **gran slam** (13 bazas)\nLa subasta entera gira en torno a estimar los puntos conjuntos de la pareja sin ver las cartas del otro.", en: "To value your hand add **high-card points (HCP)**: Ace=4, King=3, Queen=2, Jack=1. The deck holds **40 HCP**, so an average hand is worth 10.\n\n› Distribution points\nOnce you have (or expect) a trump **fit**, short suits are worth:\n• Singleton (1 card) = **+2**\n• Void (0 cards) = **+3**\n• Doubleton (2 cards) = **+1**\nThey count because you can ruff losers with the trump suit. Without a fit, in Notrump, shortness does not add; **length** does (a 5th or 6th card in a long suit can win tricks).\n\n› Thresholds to memorise\n• ~**25 HCP** combined → **game**\n• ~**33 HCP** → **small slam** (12 tricks)\n• ~**37 HCP** → **grand slam** (13 tricks)\nThe whole auction is about estimating the partnership's combined points without seeing partner's cards." } },
      { id: "l1c", t: { es: "Tipos de mano: equilibrada o no", en: "Hand types: balanced or not" },
        body: { es: "Clasificar tu forma es el primer paso para elegir tu declaración.\n\n› Mano equilibrada\nSin singleton ni void y como mucho un doubleton. Las formas son **4-3-3-3, 4-4-3-2 y 5-3-3-2**. Estas manos prefieren jugar a **Sin Triunfo** y se describen con aperturas o rebids de ST.\n\n› Mano desequilibrada\nTiene un palo largo (6+), dos palos largos (5-5, 6-5) o un corte (singleton/void). Prefieren un **contrato con triunfo** porque aprovechan la longitud y los fallos.\n\n› Por qué importa\n• Equilibrada 15-17 → abre **1ST**.\n• Equilibrada 20-21 → abre **2ST**.\n• Con un mayor de 5 (♥/♠) buscas el **fit de 8 cartas** para jugar la mayor.\n• Con manos muy desequilibradas piensas en fallos, no en PH puros.", en: "Classifying your shape is the first step to choosing your call.\n\n› Balanced hand\nNo singleton or void and at most one doubleton. The shapes are **4-3-3-3, 4-4-3-2 and 5-3-3-2**. These hands prefer **Notrump** and are shown with NT openings or rebids.\n\n› Unbalanced hand\nHas a long suit (6+), two long suits (5-5, 6-5) or a short suit (singleton/void). They prefer a **trump contract** to exploit length and ruffs.\n\n› Why it matters\n• Balanced 15-17 → open **1NT**.\n• Balanced 20-21 → open **2NT**.\n• With a 5-card major (♥/♠) you hunt the **8-card fit** to play the major.\n• With very shapely hands you think in ruffs, not raw HCP." } },
      { id: "l1d", t: { es: "El contrato y cómo se puntúa", en: "The contract and how scoring works" },
        body: { es: "El **contrato** dice cuántas bazas por encima de 6 te comprometes a ganar, y en qué triunfo (o en Sin Triunfo).\n\n› Leer un contrato\n• 1♠ = ganar **7** bazas con ♠ de triunfo (6+1).\n• 3ST = **9** bazas sin triunfo.\n• 4♥/4♠ = **10** bazas: **manga mayor**.\n• 5♣/5♦ = **11** bazas: **manga menor**.\n• 6X = **slam pequeño** (12); 7X = **gran slam** (13).\n\n› Parciales, manga y primas\nCumplir un contrato bajo es un **parcial**; pero alcanzar **manga** (100+ puntos de bazas: 3ST, 4♥/♠, 5♣/♦) da una **gran prima**. Por eso 3ST se prefiere a 5♣ aunque ambos sean manga: 3ST pide solo 9 bazas.\n\n› Vulnerabilidad\nCada mano tiene una vulnerabilidad fijada. **Vulnerable** sube las primas de manga/slam pero también las **multas** si caes. Esto cambia cuánto te puedes arriesgar al competir.", en: "The **contract** states how many tricks over 6 you commit to win, and in which trump (or Notrump).\n\n› Reading a contract\n• 1♠ = win **7** tricks with ♠ trump (6+1).\n• 3NT = **9** tricks in notrump.\n• 4♥/4♠ = **10** tricks: **major game**.\n• 5♣/5♦ = **11** tricks: **minor game**.\n• 6X = **small slam** (12); 7X = **grand slam** (13).\n\n› Partscores, game and bonuses\nMaking a low contract is a **partscore**; but reaching **game** (100+ trick points: 3NT, 4♥/♠, 5♣/♦) earns a **large bonus**. That is why 3NT is preferred over 5♣ though both are game: 3NT needs only 9 tricks.\n\n› Vulnerability\nEach deal has a set vulnerability. **Vulnerable** raises game/slam bonuses but also the **penalties** when you go down. It changes how much you can risk when competing." } },
      { id: "l1e", t: { es: "Triunfo contra Sin Triunfo", en: "Trump versus Notrump" },
        body: { es: "Elegir la denominación correcta es media batalla del bridge.\n\n› Jugar con triunfo\nLas cartas del palo de triunfo ganan a cualquier otra. Te permite **fallar** (ruff) los palos cortos y **controlar** la mano: cortar el palo largo del rival y no perder el control. Necesitas un **fit de 8+ cartas** entre la pareja para nombrar un palo como triunfo.\n\n› Jugar a Sin Triunfo\nNo hay fallos: mandan los **palos largos** establecidos y las **paradas** (stoppers: A, KQ, etc.) que frenan a los rivales. Necesitas paradas en los palos donde el contrario es fuerte.\n\n› La gran decisión\nCon un fit mayor (♥/♠) de 8 cartas, juega la **mayor**: 4♥/4♠ (10 bazas) suele ser más seguro que 3ST si tienes cortes. Sin fit mayor pero con manos equilibradas y paradas, ve a **3ST**. Las menores (♣/♦) solo se juegan de manga cuando 3ST es imposible.", en: "Choosing the right denomination is half the battle.\n\n› Playing with a trump\nTrump cards beat any other suit. They let you **ruff** short suits and keep **control**: cut the opponents' long suit and never lose the lead permanently. You need an **8+ card fit** between the partnership to name a trump.\n\n› Playing Notrump\nNo ruffing: established **long suits** and **stoppers** (A, KQ, etc.) that hold opponents off rule the day. You need stoppers where the opponents are strong.\n\n› The big decision\nWith an 8-card major fit (♥/♠), play the **major**: 4♥/4♠ (10 tricks) is usually safer than 3NT when you have short suits. With no major fit but balanced hands and stoppers, go for **3NT**. Minors (♣/♦) are played at game only when 3NT is impossible." } },
      { id: "l1f", t: { es: "Plan de bazas: ganadoras y perdedoras", en: "Counting winners and losers" },
        body: { es: "Antes de jugar una sola carta, **cuenta**. Es lo que separa a un principiante de un jugador sólido.\n\n› En Sin Triunfo: cuenta GANADORAS\nSuma las bazas que ganas **de salida** (top tricks): ases, reyes protegidos, secuencias. Si te faltan para tu contrato, planifica de dónde saldrán las demás: estableciendo un palo largo, con un impasse, etc.\n\n› Con triunfo: cuenta PERDEDORAS\nMira tu mano y la del muerto juntas y cuenta las **perdedoras** por palo (cartas que no son ganadoras en las primeras rondas). Luego busca cómo eliminarlas: fallarlas en el muerto, descartarlas sobre un palo largo, o con un impasse.\n\n› La regla de oro\nHaz el **plan completo antes de jugar de la baza 1**. Pregúntate: ¿cuántas bazas necesito, cuántas tengo seguras, y de dónde vienen las que faltan? Jugar sin plan es la causa nº1 de contratos caídos.", en: "Before you play a single card, **count**. This is what separates a beginner from a solid player.\n\n› In Notrump: count WINNERS\nAdd the tricks you can take **right away** (top tricks): aces, guarded kings, sequences. If you are short of your contract, plan where the rest will come from: establishing a long suit, a finesse, etc.\n\n› With a trump: count LOSERS\nLook at your hand and dummy together and count the **losers** by suit (cards that are not winners in the early rounds). Then find how to get rid of them: ruff them in dummy, discard them on a long suit, or take a finesse.\n\n› The golden rule\nMake the **whole plan before playing from trick 1**. Ask: how many tricks do I need, how many are sure, and where do the missing ones come from? Playing without a plan is the No.1 cause of failed contracts." } },
      { id: "l1g", t: { es: "Objetivo de la subasta y lenguaje", en: "Goal of the auction and its language" },
        body: { es: "La **subasta** es una conversación codificada: cada voz transmite puntos y/o longitud para que la pareja encuentre el **mejor contrato**.\n\n› Qué decide la pareja\n• El **palo** (o Sin Triunfo): ¿hay fit mayor de 8?\n• El **nivel**: ¿parcial, manga o slam? Lo marca la suma de puntos.\n\n› Tipos de voz\n• **Natural**: muestra cartas reales del palo nombrado.\n• **Convencional/artificial**: tiene un significado pactado (p. ej. Stayman 2♣ no promete tréboles).\n• **Forcing**: obliga a tu compañero a volver a hablar.\n• **Invitacional**: ofrece seguir a manga si el compañero tiene su máximo.\n• **De cierre (signoff)**: pide parar.\n\n› Pasar, doblar, redoblar\n**Paso** = no añado nada ahora. **Doblo (X)** = de castigo o de reapertura/informativo según contexto. **Redoblo (XX)** = típicamente fuerza o muestra confianza. Aprenderás cada uno en su nivel.", en: "The **auction** is a coded conversation: each call conveys points and/or length so the partnership finds the **best contract**.\n\n› What the partnership decides\n• The **suit** (or Notrump): is there an 8-card major fit?\n• The **level**: partscore, game or slam? Set by the combined points.\n\n› Kinds of call\n• **Natural**: shows real cards in the named suit.\n• **Conventional/artificial**: has an agreed meaning (e.g. Stayman 2♣ does not promise clubs).\n• **Forcing**: obliges partner to bid again.\n• **Invitational**: offers to continue to game if partner is maximum.\n• **Signoff**: asks to stop.\n\n› Pass, double, redouble\n**Pass** = I add nothing now. **Double (X)** = penalty, or take-out/informative depending on context. **Redouble (XX)** = typically strength or confidence. You will learn each in its level." } },
    ],
    quiz: [
      { q: { es: "¿Cuántos PH tiene la baraja entera?", en: "How many HCP are in the full deck?" }, opts: ["20", "30", "40", "52"], a: 2 },
      { q: { es: "¿Cuántas cartas vale una Dama?", en: "How many points is a Queen worth?" }, opts: ["1", "2", "3", "4"], a: 1 },
      { q: { es: "¿Cuántas bazas son 3ST?", en: "How many tricks is 3NT?" }, opts: ["3", "7", "9", "10"], a: 2 },
      { q: { es: "Para manga mayor (4♥/4♠) hay que ganar...", en: "Major game (4♥/4♠) requires winning..." }, opts: ["8 bazas", "9 bazas", "10 bazas", "11 bazas"], a: 2 },
      { q: { es: "¿PH aproximados de la pareja para manga?", en: "Approx. partnership HCP for game?" }, opts: ["15", "20", "25", "33"], a: 2 },
      { q: { es: "Si puedes asistir al palo de salida...", en: "If you can follow the led suit you..." }, opts: [{ es: "debes hacerlo", en: "must do so" }, { es: "puedes fallar", en: "may ruff" }, { es: "puedes descartar", en: "may discard" }, { es: "eliges libremente", en: "choose freely" }], a: 0 },
    ],
    flash: [
      { f: { es: "PH del As", en: "HCP of an Ace" }, b: { es: "4", en: "4" } },
      { f: { es: "PH del Rey", en: "HCP of a King" }, b: { es: "3", en: "3" } },
      { f: { es: "Bazas de 3ST", en: "Tricks in 3NT" }, b: { es: "9 (6+3)", en: "9 (6+3)" } },
      { f: { es: "Bazas de 4♠", en: "Tricks in 4♠" }, b: { es: "10", en: "10" } },
      { f: { es: "Bazas de 6♦ (slam)", en: "Tricks in 6♦ (slam)" }, b: { es: "12", en: "12" } },
      { f: { es: "PH para manga", en: "HCP for game" }, b: { es: "≈25", en: "≈25" } },
      { f: { es: "PH para slam pequeño", en: "HCP for small slam" }, b: { es: "≈33", en: "≈33" } },
      { f: { es: "Tamaño de un fit mayor", en: "Major fit size" }, b: { es: "8+ cartas combinadas", en: "8+ combined cards" } },
    ],
    cheat: {
      title: { es: "Chuleta · Valoración", en: "Cheat sheet · Evaluation" },
      rows: [
        { es: "A=4 · K=3 · Q=2 · J=1 (40 totales)", en: "A=4 · K=3 · Q=2 · J=1 (40 total)" },
        { es: "Corte (con fit): singleton +2 · void +3 · doubleton +1", en: "Shortness (with fit): singleton +2 · void +3 · doubleton +1" },
        { es: "25 PH → manga · 33 → slam · 37 → gran slam", en: "25 HCP → game · 33 → slam · 37 → grand slam" },
        { es: "Niveles: 1=7 bazas … 7=13 bazas", en: "Levels: 1=7 tricks … 7=13 tricks" },
      ],
    },
    schema: [
      { es: "¿Equilibrada y 15-17? → 1ST", en: "Balanced & 15-17? → 1NT" },
      { es: "¿Mayor de 5? → abre ese mayor", en: "5-card major? → open it" },
      { es: "¿Si no? → mejor menor", en: "Otherwise → better minor" },
    ],
  },
  {
    id: 2, key: "bid1",
    name: { es: "Nivel 2 · Subasta básica", en: "Level 2 · Basic bidding" },
    sub: { es: "Aperturas, respuestas y 1ST", en: "Openings, responses and 1NT" },
    dealsTarget: 60,
    lessons: [
      { id: "l2a", t: { es: "Cuándo abrir y la regla de 20", en: "When to open and the rule of 20" },
        body: { es: "Abres la subasta con aproximadamente **12-21 PH** (o manos distribucionales válidas). Por debajo de 12, normalmente **pasas**.\n\n› La regla de 20\nSi **PH + las longitudes de tus dos palos más largos ≥ 20**, abre. Ej.: 11 PH con 5♠ y 5♥ (11+5+5=21) es apertura clara aunque tengas solo 11 PH.\n\n› Qué abrir (5ª mayor)\n• Equilibrada **15-17** → **1ST**.\n• Equilibrada **20-21** → **2ST**.\n• Mano fuerte **22+** o juego seguro de manga → **2♣** (fuerte, artificial).\n• ¿Mayor de 5+ (♥/♠)? → abre esa **mayor** (con dos mayores de 5, abre ♠).\n• Si no hay mayor de 5 → abre tu **mejor menor**; con 3-3 en menores abre **1♣**, con 4-4 abre **1♦**.\n\nAbrir bien fija el rumbo: tu compañero contará con tu rango y forma para responder.", en: "You open the bidding with roughly **12-21 HCP** (or sound distributional hands). Below 12 you normally **pass**.\n\n› The rule of 20\nIf **HCP + the lengths of your two longest suits ≥ 20**, open. E.g. 11 HCP with 5♠ and 5♥ (11+5+5=21) is a clear opening even with only 11 HCP.\n\n› What to open (5-card majors)\n• Balanced **15-17** → **1NT**.\n• Balanced **20-21** → **2NT**.\n• Strong hand **22+** or near-certain game → **2♣** (strong, artificial).\n• A 5+ card major (♥/♠)? → open that **major** (with two 5-card majors, open ♠).\n• No 5-card major → open your **better minor**; with 3-3 minors open **1♣**, with 4-4 open **1♦**.\n\nOpening well sets the course: partner will rely on your range and shape to respond." } },
      { id: "l2b", t: { es: "Qué significa abrir 1♥ o 1♠", en: "What opening 1♥ or 1♠ means" },
        body: { es: "Abrir **1♥ o 1♠** promete **5+ cartas** del palo y 12-21 PH. Es la piedra angular del sistema de mayores quintos.\n\n› El mensaje\n«Tengo al menos cinco de este mayor; busquemos el fit de 8.» Tu compañero sabe que con **3 cartas de apoyo** ya hay fit, porque 5+3 = 8.\n\n› Tu plan de rebid (avance)\nTu segunda declaración aclara fuerza y forma:\n• Repetir el mayor (1♠-...-2♠) = 6+ cartas, mínima.\n• Nombrar un nuevo palo más bajo = forma 5-4, fuerza no límite.\n• Salto a 3 del palo = 6+ y fuerza invitacional.\n• Rebid de 1ST/2ST = equilibrada fuera del rango de 1ST (p. ej. 12-14 si abriste color por no caber en 1ST).\n\n› Mayor antes que menor\nAunque tengas un menor más largo, con un mayor de 5 sueles abrir el **mayor** para no perder el fit mayor, que da manga más barata (4 vs 5).", en: "Opening **1♥ or 1♠** promises **5+ cards** in the suit and 12-21 HCP. It is the cornerstone of the five-card-major system.\n\n› The message\n\"I have at least five of this major; let's find the 8-card fit.\" Partner knows that with **3-card support** there is already a fit, because 5+3 = 8.\n\n› Your rebid plan\nYour second call clarifies strength and shape:\n• Rebidding the major (1♠-...-2♠) = 6+ cards, minimum.\n• Naming a new lower suit = 5-4 shape, non-limit strength.\n• Jump to 3 of the suit = 6+ and invitational strength.\n• 1NT/2NT rebid = balanced outside the 1NT range (e.g. 12-14 if you opened a suit because you didn't fit 1NT).\n\n› Major before minor\nEven with a longer minor, holding a 5-card major you usually open the **major** so as not to miss the major fit, which gives a cheaper game (4 vs 5)." } },
      { id: "l2c", t: { es: "Qué significa abrir 1♣ o 1♦", en: "What opening 1♣ or 1♦ means" },
        body: { es: "Abrir **1♣ o 1♦** promete 12-21 PH pero **no** un mayor de 5. A menudo es un palo «preparado» para empezar a describir la mano.\n\n› Longitudes típicas\n• **1♦** suele ser 4+ diamantes reales.\n• **1♣** puede ser tan corto como **3 cartas** (el famoso «trébol corto/preparado»): se abre cuando no hay mayor de 5 ni 4+ diamantes, para poder rebatir cómodamente.\n\n› Por qué se abre un menor\nPara mantener la subasta baja y dar espacio a que el compañero muestre un mayor de 4. Por eso una respuesta de **1♥/1♠** sobre tu 1♣/1♦ solo promete **4** cartas: aún buscáis el fit mayor.\n\n› Tu rebid\n• Equilibrada 12-14 → 1ST.\n• Apoyo al mayor del compañero con 4 → súbelo.\n• Otro palo nuevo → muestra forma. Recuerda: tras abrir menor, todavía estás pintando la mano.", en: "Opening **1♣ or 1♦** promises 12-21 HCP but **no** 5-card major. It is often a \"prepared\" suit to start describing the hand.\n\n› Typical lengths\n• **1♦** is usually 4+ real diamonds.\n• **1♣** can be as short as **3 cards** (the famous \"short/prepared club\"): opened when you have no 5-card major and no 4+ diamonds, so you can rebid comfortably.\n\n› Why open a minor\nTo keep the auction low and give partner room to show a 4-card major. That is why a **1♥/1♠** response over your 1♣/1♦ promises only **4** cards: you are still hunting the major fit.\n\n› Your rebid\n• Balanced 12-14 → 1NT.\n• Support partner's major with 4 → raise it.\n• A new suit → show shape. Remember: after opening a minor you are still painting the hand." } },
      { id: "l2d", t: { es: "Qué significa abrir 1ST (15-17)", en: "What opening 1NT (15-17) means" },
        body: { es: "**1ST** describe casi toda tu mano de un golpe: **equilibrada con 15-17 PH** y paradas repartidas. Es una de las aperturas más precisas y cómodas.\n\n› Requisitos\n• Forma 4-3-3-3, 4-4-3-2 o 5-3-3-2 (a veces con mayor de 5 «escondida»).\n• 15-17 PH, idealmente con honores repartidos, no concentrados en dobletes.\n\n› Por qué es tan útil\nEl compañero conoce puntos y forma al instante, así que puede **pilotar**: sumar, decidir manga/slam, y usar herramientas como **Stayman** (¿tienes mayor de 4?) y **transferencias** (mostrar su mayor de 5). Lo verás en las próximas lecciones.\n\n› Respuestas rápidas (vista previa)\n• 0-7 sin mayor largo → pasar (a veces 2♦/2♥ transfer para parar mejor).\n• 8-9 equilibrado → 2ST invita.\n• 10+ → manga (3ST) o explorar mayor/slam.", en: "**1NT** describes almost your whole hand at once: **balanced with 15-17 HCP** and stoppers spread around. It is one of the most precise and comfortable openings.\n\n› Requirements\n• Shape 4-3-3-3, 4-4-3-2 or 5-3-3-2 (sometimes with a hidden 5-card major).\n• 15-17 HCP, ideally with honours spread, not bunched in doubletons.\n\n› Why it is so useful\nPartner knows points and shape instantly, so they can **drive**: add up, decide game/slam, and use tools like **Stayman** (do you have a 4-card major?) and **transfers** (to show their own 5-card major). You'll see these next.\n\n› Quick responses (preview)\n• 0-7 with no long major → pass (sometimes a 2♦/2♥ transfer to land softer).\n• 8-9 balanced → 2NT invites.\n• 10+ → game (3NT) or explore major/slam." } },
      { id: "l2e", t: { es: "Respuestas a 1 mayor: el apoyo", en: "Responses to 1 major: the raise" },
        body: { es: "Tras la apertura **1♥/1♠** de tu compañero, tu prioridad es **decir si hay fit** (tienes 3+ cartas del mayor) y con qué fuerza.\n\n› Apoyos directos (con 3+ del mayor)\n• **2♥/2♠** = apoyo simple, **6-9 PH**. «Tengo fit, mano floja.»\n• **3♥/3♠** = apoyo de salto **invitacional**, ~**10-11** y 4 cartas. «Voy a manga si tienes algo extra.»\n• **4♥/4♠** = a manga, pero **débil y muy distribucional** (preventivo, 5 triunfos y pocos PH): quita espacio al rival.\n\n› Apoyo fuerte (manos buenas)\nCon apoyo y **12+** no saltes a 4: empieza por otro camino (cambio de color 2/1, o convenciones como **Jacoby 2ST**, que verás en Nivel 3) para investigar slam.\n\n› Regla práctica\nCuenta puntos de distribución al apoyar: con fit, un singleton vale +2. Una mano de 9 PH con corte se comporta como invitacional.", en: "After partner opens **1♥/1♠**, your priority is to **say whether there is a fit** (you hold 3+ of the major) and with what strength.\n\n› Direct raises (with 3+ of the major)\n• **2♥/2♠** = simple raise, **6-9 HCP**. \"I have a fit, weak hand.\"\n• **3♥/3♠** = jump raise, **invitational**, ~**10-11** and 4 cards. \"I'll go to game if you have extra.\"\n• **4♥/4♠** = to game, but **weak and very shapely** (pre-emptive, 5 trumps and few HCP): it robs the opponents of room.\n\n› Strong raises (good hands)\nWith support and **12+** do not jump to 4: start another way (a 2/1 new suit, or conventions like **Jacoby 2NT**, seen in Level 3) to investigate slam.\n\n› Practical rule\nCount distribution points when raising: with a fit a singleton is +2. A 9-HCP hand with a short suit behaves like an invitation." } },
      { id: "l2f", t: { es: "Respuestas a 1 mayor sin fit", en: "Responses to 1 major without a fit" },
        body: { es: "Si **no** tienes 3 del mayor del abridor, eliges entre cambiar de color, decir 1ST o saltar según tu fuerza.\n\n› Cambios de color\n• **Nuevo palo a nivel 1** (1♥ → 1♠) = 6+ PH, 4+ cartas, **forcing 1 vuelta**. Explora otro fit.\n• **Nuevo palo a nivel 2** (1♠ → 2♣/2♦/2♥) = «cambio a nivel 2», promete **~11+ PH** (en estilo 2/1, suele ser forcing a manga). Requiere mano de respuesta sólida.\n\n› 1ST de respuesta\n**1♥/1♠ → 1ST** = **6-10 PH**, sin fit y sin palo cómodo para nombrar a nivel 1. Es un cajón de sastre, no promete equilibrio perfecto.\n\n› Saltos\n• Salto a 2ST/3ST = manos con paradas y puntos definidos (según acuerdo).\n• Salto a nuevo palo (jump shift) = mano muy fuerte, mira a slam.\n\nRegla de oro: con 6+ PH **no pases** la apertura de tu compañero; busca la mejor descripción.", en: "If you do **not** hold 3 of opener's major, you choose between a new suit, 1NT, or a jump based on strength.\n\n› New suits\n• **New suit at the 1 level** (1♥ → 1♠) = 6+ HCP, 4+ cards, **forcing for one round**. Explores another fit.\n• **New suit at the 2 level** (1♠ → 2♣/2♦/2♥) = \"two-level response\", promises **~11+ HCP** (in 2/1 style it is usually game-forcing). Needs a sound responding hand.\n\n› 1NT response\n**1♥/1♠ → 1NT** = **6-10 HCP**, no fit and no comfortable suit to name at the 1 level. It is a catch-all, not a promise of perfect balance.\n\n› Jumps\n• Jump to 2NT/3NT = hands with stoppers and defined points (by agreement).\n• Jump in a new suit (jump shift) = very strong hand, looking at slam.\n\nGolden rule: with 6+ HCP **do not pass** partner's opening; find the best description." } },
      { id: "l2g", t: { es: "El rebid del abridor", en: "Opener's rebid" },
        body: { es: "La **segunda voz del abridor** es donde la mano cobra forma. Tras la respuesta de tu compañero, describe **fuerza** y **forma** a la vez.\n\n› Escalones de fuerza\n• **Mínima (12-15)**: rebid barato — repetir tu palo de 6, apoyar con 4 al nivel mínimo, o 1ST.\n• **Media-fuerte (16-18)**: salto — repetir con salto (1♠-2♣-3♠), salto de apoyo, o 2ST.\n• **Fuerte (19-21)**: salto a manga o cambio que fuerza, porque ya quieres jugar manga.\n\n› Mostrar forma\n• Repetir el palo = 6+ cartas.\n• Nuevo palo más barato = segundo palo real (5-4 o 6-4).\n• «Reverse» (nuevo palo más alto a nivel 2, 1♦-1♠-2♥) = mano **fuerte 17+** porque obliga a subir el nivel.\n\n› Apoyar al mayor del compañero\nSi tu compañero mostró un mayor y tú tienes 4, **súbelo** según tu fuerza (simple, salto o a manga). El fit manda.", en: "**Opener's second call** is where the hand takes shape. After partner's response, show **strength** and **shape** at once.\n\n› Strength steps\n• **Minimum (12-15)**: cheap rebid — repeat your 6-card suit, support with 4 at the minimum level, or 1NT.\n• **Medium-strong (16-18)**: a jump — jump rebid (1♠-2♣-3♠), jump raise, or 2NT.\n• **Strong (19-21)**: jump to game or a forcing bid, because you already want game.\n\n› Showing shape\n• Repeating the suit = 6+ cards.\n• A cheaper new suit = a real second suit (5-4 or 6-4).\n• A \"reverse\" (a higher new suit at the 2 level, 1♦-1♠-2♥) = a **strong 17+** hand because it forces partner higher.\n\n› Supporting partner's major\nIf partner showed a major and you hold 4, **raise it** according to strength (simple, jump or to game). The fit rules." } },
      { id: "l2h", t: { es: "Stayman: ¿tienes mayor de 4?", en: "Stayman: do you hold a 4-card major?" },
        body: { es: "Sobre la apertura **1ST**, la respuesta **2♣** es **Stayman**: artificial, pregunta «¿tienes un mayor de 4 cartas?». No promete tréboles.\n\n› Cuándo usar Stayman\nCuando tienes **8+ PH** (invitacional o más) y al menos un mayor de 4, para buscar el fit 4-4 en ♥/♠ y jugar 4M en vez de 3ST.\n\n› Respuestas del abridor a 2♣\n• **2♦** = «no tengo mayor de 4». \n• **2♥** = «tengo 4 (o 5) corazones». \n• **2♠** = «tengo 4 picas (y no 4 corazones)».\n\n› Continuación del respondiente\n• Si encontráis fit mayor → invita (3M) o ve a manga (4M).\n• Si no hay fit → 2ST (invita) o 3ST (manga), según puntos.\n\n› Aviso\nNo uses Stayman con manos débiles sin destino: si abridor contesta 2♦ te quedas alto y sin sitio. Stayman es para **planear** manga con un mayor de 4.", en: "Over a **1NT** opening, the response **2♣** is **Stayman**: artificial, asking \"do you have a 4-card major?\" It does not promise clubs.\n\n› When to use Stayman\nWhen you have **8+ HCP** (invitational or better) and at least one 4-card major, to find the 4-4 fit in ♥/♠ and play 4M instead of 3NT.\n\n› Opener's answers to 2♣\n• **2♦** = \"no 4-card major.\"\n• **2♥** = \"I have 4 (or 5) hearts.\"\n• **2♠** = \"I have 4 spades (and not 4 hearts).\"\n\n› Responder's continuation\n• If you find a major fit → invite (3M) or bid game (4M).\n• If no fit → 2NT (invites) or 3NT (game), by points.\n\n› Warning\nDo not use Stayman on weak hands with no plan: if opener answers 2♦ you are stuck high. Stayman is for **planning** game with a 4-card major." } },
      { id: "l2i", t: { es: "Transferencias Jacoby", en: "Jacoby transfers" },
        body: { es: "Sobre **1ST**, las **transferencias** dejan que el abridor (mano fuerte) juegue el contrato y permiten describir mayores de 5.\n\n› El mecanismo\n• **2♦** = transfer a corazones: «pon 2♥». El abridor declara **2♥**.\n• **2♥** = transfer a picas: «pon 2♠». El abridor declara **2♠**.\nTú prometes **5+** cartas del mayor de destino, con cualquier fuerza.\n\n› Por qué transferir\n• El **fuerte** (abridor) se vuelve declarante: su mano queda oculta y protegida en la salida.\n• Puedes describir luego tu fuerza: tras la transferencia, pasar (débil), 2ST/3 del palo (invita) o ir a manga.\n\n› Continuaciones típicas\n1ST–2♦–2♥–**pasa** = débil con 5 corazones. \n1ST–2♦–2♥–**3ST** = «tengo 5 corazones y manga; elige 3ST o 4♥». \n1ST–2♥–2♠–**4♠** = a manga con 5+ picas.\n\nStayman + transferencias convierten 1ST en una herramienta de precisión.", en: "Over **1NT**, **transfers** let opener (the strong hand) play the contract and let you show 5-card majors.\n\n› The mechanism\n• **2♦** = transfer to hearts: \"bid 2♥\". Opener bids **2♥**.\n• **2♥** = transfer to spades: \"bid 2♠\". Opener bids **2♠**.\nYou promise **5+** cards in the target major, any strength.\n\n› Why transfer\n• The **strong** hand (opener) becomes declarer: their hand stays hidden and protected on the lead.\n• You then describe strength: after the transfer, pass (weak), 2NT/3 of the suit (invite), or bid game.\n\n› Typical continuations\n1NT–2♦–2♥–**pass** = weak with 5 hearts.\n1NT–2♦–2♥–**3NT** = \"I have 5 hearts and game values; pick 3NT or 4♥.\"\n1NT–2♥–2♠–**4♠** = game with 5+ spades.\n\nStayman plus transfers turn 1NT into a precision tool." } },
      { id: "l2j", t: { es: "Aperturas de 2: fuertes y débiles", en: "2-level openings: strong and weak" },
        body: { es: "Las aperturas de 2 tienen significados muy distintos según el palo.\n\n› 2♣ — fuerte y artificial\nPromete una mano enorme: **22+ PH equilibrada** o juego de manga prácticamente seguro con palo largo. Es **forcing**. La respuesta más común es **2♦** (relé «espera, cuéntame más»); el abridor describe luego su mano. Nunca pases un 2♣.\n\n› 2♦/2♥/2♠ — barrera débil (weak two)\nMuestra **6 cartas** del palo y solo **6-10 PH**: una mano preventiva. El objetivo es **robar espacio** al rival y dificultar su subasta. No se abre weak two con un mayor de 4 al lado o mano de apertura.\n\n› Responder a un weak two\n• Sin ajuste y débil → pasa.\n• Con fit y ganas de molestar → sube preventivamente.\n• 2ST = pregunta artificial de fuerza/calidad (feature), invitando a manga.\n\nLa clave: 2♣ grita fuerza; 2 en color grita estorbo.", en: "Two-level openings mean very different things depending on the suit.\n\n› 2♣ — strong and artificial\nPromises a huge hand: **22+ HCP balanced** or a near-certain game with a long suit. It is **forcing**. The usual reply is **2♦** (a \"wait, tell me more\" relay); opener then describes. Never pass a 2♣.\n\n› 2♦/2♥/2♠ — weak two\nShows **6 cards** in the suit and only **6-10 HCP**: a pre-emptive hand. The aim is to **steal room** from the opponents and make their auction hard. Don't open a weak two with a side 4-card major or an opening-strength hand.\n\n› Responding to a weak two\n• No fit and weak → pass.\n• With a fit and a wish to obstruct → raise pre-emptively.\n• 2NT = an artificial strength/quality ask (feature), inviting game.\n\nThe point: 2♣ shouts strength; a 2-of-a-suit opening shouts obstruction." } },
      { id: "l2k", t: { es: "Forcing, invitacional y cierre", en: "Forcing, invitational and signoff" },
        body: { es: "Entender el **estatus** de cada voz evita los dos grandes errores: pasar una voz forcing o seguir sobre una de cierre.\n\n› Forcing (obliga a seguir)\n• Un **nuevo palo del respondiente** es forcing (no puedes pasar).\n• Saltos a nuevo palo, cuarto color forcing, 2♣ de apertura: forcing.\n• Si tu compañero fuerza, **debes** volver a hablar aunque tengas mínimo.\n\n› Invitacional (ofrece, no obliga)\n• Subidas con salto (1♥-3♥), 2ST de respuesta, repetir palo con salto.\n• Significan: «ve a manga **si** tienes algo extra; si no, para.»\n\n› Cierre / signoff\n• Repetir tu palo sin saltar a nivel mínimo, pasar, o poner directamente la manga que quieres.\n• Pide **parar**: tu compañero respeta salvo que tenga una mano excepcional no descrita.\n\nAntes de cada declaración pregúntate: ¿esto fuerza, invita o cierra? Hablar el mismo idioma con tu compañero es lo que gana parejas.", en: "Understanding each call's **status** avoids the two big mistakes: passing a forcing bid or bidding on over a signoff.\n\n› Forcing (must continue)\n• A **new suit by responder** is forcing (you cannot pass).\n• Jumps in a new suit, fourth-suit forcing, a 2♣ opening: forcing.\n• If partner forces, you **must** speak again even with a minimum.\n\n› Invitational (offers, not obligatory)\n• Jump raises (1♥-3♥), a 2NT response, a jump rebid of a suit.\n• They mean: \"bid game **if** you have extra; otherwise stop.\"\n\n› Signoff\n• Rebidding your suit at the minimum level, passing, or placing the game you want directly.\n• It asks to **stop**: partner respects it unless holding an exceptional undescribed hand.\n\nBefore each call ask yourself: does this force, invite or sign off? Speaking the same language as partner is what wins partnerships." } },
      { id: "l2l", t: { es: "Competir: overcalls y contra informativo", en: "Competing: overcalls and takeout double" },
        body: { es: "Cuando el rival abre, no te calles sin más: competir bien gana parciales y encuentra mangas o buenas defensas.\n\n› Overcall (intervención de color)\nNombrar un palo sobre la apertura rival (1♦ – **1♠**). Promete un **buen palo de 5+** y ~**8-16 PH**. No necesita la fuerza de una apertura: la calidad del palo importa más que los puntos. Sirve para indicar **salida** y robar espacio.\n\n› Contra informativo (takeout double)\nDoblar la apertura rival en bajo nivel (1♦ – **X**) **no** es de castigo: pide a tu compañero que **elija palo**, típicamente con **apertura+ y cortedad en el palo rival**, apoyo a los otros tres palos (idealmente 4-4-4-1 ó 4-3-4-... corto en su palo). Tu compañero responde nombrando su mejor palo; cuanto más salta, más fuerte.\n\n› 1ST de intervención\n~15-18 con parada en el palo rival: como una apertura de 1ST pero pasada por encima.\n\nCompetir es un arte: equilibra el riesgo de multa con la prima de encontrar tu contrato.", en: "When an opponent opens, don't just fall silent: competing well wins partscores and finds games or good defences.\n\n› Overcall (bidding a suit)\nNaming a suit over their opening (1♦ – **1♠**). It promises a **good 5+ card suit** and ~**8-16 HCP**. It needs less than an opening: suit quality matters more than points. It suggests a **lead** and steals room.\n\n› Takeout double\nDoubling their low-level opening (1♦ – **X**) is **not** for penalty: it asks partner to **pick a suit**, typically showing **opening values+ and shortness in their suit**, support for the other three suits (ideally 4-4-4-1 or similar, short in their suit). Partner answers by naming their best suit; the bigger the jump, the stronger.\n\n› 1NT overcall\n~15-18 with a stopper in their suit: like a 1NT opening but made over the top.\n\nCompeting is an art: balance the risk of a penalty against the bonus of finding your contract." } },
    ],
    quiz: [
      { q: { es: "Tienes ♠KQ1095 ♥A3 ♦K842 ♣74, 12 PH. Abres...", en: "You hold ♠KQ1095 ♥A3 ♦K842 ♣74, 12 HCP. Open..." }, opts: ["1♣", "1♦", "1♠", "1NT"], a: 2 },
      { q: { es: "Regla del 20: abres con 11 PH si...", en: "Rule of 20: open with 11 HCP when..." }, opts: [{ es: "tienes un As", en: "you have an Ace" }, { es: "PH + 2 palos largos ≥ 20", en: "HCP + 2 longest suits ≥ 20" }, { es: "tienes 6 cartas", en: "you have a 6-card suit" }, { es: "nunca", en: "never" }], a: 1 },
      { q: { es: "Compañero abre 1♥, tú: ♠K3 ♥Q1086 ♦K1042 ♣J85 (9 PH). Dices...", en: "Partner opens 1♥, you: ♠K3 ♥Q1086 ♦K1042 ♣J85 (9 HCP). Bid..." }, opts: ["Pass", "2♥", "3♥", "1NT"], a: 1 },
      { q: { es: "Sobre 1ST, con ♠AJ976 y 9 PH usas...", en: "Over 1NT, with ♠AJ976 and 9 HCP you use..." }, opts: [{ es: "Stayman 2♣", en: "Stayman 2♣" }, { es: "transferencia 2♥", en: "transfer 2♥" }, { es: "3NT", en: "3NT" }, { es: "Pass", en: "Pass" }], a: 1 },
      { q: { es: "Stayman 2♣ pregunta por...", en: "Stayman 2♣ asks for..." }, opts: [{ es: "un mayor de 4", en: "a 4-card major" }, { es: "ases", en: "aces" }, { es: "un menor", en: "a minor" }, { es: "fuerza", en: "strength" }], a: 0 },
      { q: { es: "Sin mayor quinto y 4-4 en menores abres...", en: "No 5-card major and 4-4 minors: open..." }, opts: ["1♣", "1♦", "1NT", "Pass"], a: 1 },
    ],
    flash: [
      { f: { es: "Apertura mayor", en: "Major opening" }, b: { es: "5+ cartas, 12-21 PH", en: "5+ cards, 12-21 HCP" } },
      { f: { es: "1ST", en: "1NT" }, b: { es: "15-17 equilibrada", en: "15-17 balanced" } },
      { f: { es: "Stayman", en: "Stayman" }, b: { es: "2♣ = ¿mayor de 4?", en: "2♣ = 4-card major?" } },
      { f: { es: "Transferencia a ♥", en: "Transfer to ♥" }, b: { es: "2♦", en: "2♦" } },
      { f: { es: "Transferencia a ♠", en: "Transfer to ♠" }, b: { es: "2♥", en: "2♥" } },
      { f: { es: "Subida simple", en: "Simple raise" }, b: { es: "6-9, apoyo 3+", en: "6-9, 3+ support" } },
      { f: { es: "Subida invitacional", en: "Limit raise" }, b: { es: "10-12, apoyo 3-4", en: "10-12, 3-4 support" } },
      { f: { es: "Cambio de palo respondedor", en: "Responder's new suit" }, b: { es: "forcing", en: "forcing" } },
      { f: { es: "Regla del 20", en: "Rule of 20" }, b: { es: "PH + 2 palos largos ≥ 20", en: "HCP + 2 longest ≥ 20" } },
    ],
    cheat: {
      title: { es: "Chuleta · Subasta básica", en: "Cheat sheet · Basic bidding" },
      rows: [
        { es: "1♥/1♠ = 5+ · 1♣/1♦ = mejor menor", en: "1♥/1♠ = 5+ · 1♣/1♦ = better minor" },
        { es: "1ST = 15-17 eq · 2ST = 20-21 · 2♣ = 22+", en: "1NT = 15-17 bal · 2NT = 20-21 · 2♣ = 22+" },
        { es: "Stayman 2♣ · Jacoby 2♦→♥ 2♥→♠", en: "Stayman 2♣ · Jacoby 2♦→♥ 2♥→♠" },
        { es: "Subidas: 2=6-9 · 3=10-12 · 4=apoyo+distrib.", en: "Raises: 2=6-9 · 3=10-12 · 4=fit+shape" },
      ],
    },
    schema: [
      { es: "Compañero abre 1♥ → ¿3+ ♥? Sí: sube. No: palo nuevo / 1ST", en: "Partner opens 1♥ → 3+ ♥? Yes: raise. No: new suit / 1NT" },
      { es: "Sobre 1ST → mayor 5: transfiere · mayor 4: Stayman · plana: 2ST/3ST", en: "Over 1NT → 5-card major: transfer · 4-card: Stayman · flat: 2NT/3NT" },
    ],
  },
  {
    id: 3, key: "bid2",
    name: { es: "Nivel 3 · Subasta intermedia", en: "Level 3 · Intermediate bidding" },
    sub: { es: "Barridas, intervenciones, slams", en: "Preempts, competition, slams" },
    dealsTarget: 80,
    lessons: [
      { id: "l3a", t: { es: "2/1 forzando a manga", en: "2/1 game forcing" },
        body: { es: "El **2/1** es el cambio de color a nivel 2 del respondiente **no pasado** sobre una apertura de 1 en color (1♠ – 2♣/2♦/2♥). En el estilo moderno **fuerza a manga**.\n\n› Qué promete\n**12+ PH** (o equivalente) y compromiso de **no parar por debajo de manga**. Como ya sabéis que hay manga, podéis usar toda la subasta para **describir forma y buscar slam** sin miedo a que el otro pase.\n\n› Cómo se desarrolla\nTras un 2/1, ninguna voz por debajo de manga es de cierre: ambos pintan palos, muestran cortes y miden controles. Es la base para investigar slams con calma.\n\n› Excepción: 1ST forcing\nCuando no llegas a 2/1 pero tienes 6-12 sin fit, muchos juegan **1ST forcing** (1♠ – 1ST obliga al abridor a rebatir). Permite manejar manos intermedias sin saltar de nivel.\n\nAcuerda con tu compañero si jugáis 2/1 GF y 1ST forcing: son el esqueleto de la subasta natural moderna.", en: "**2/1** is a non-passed responder's two-level new suit over a one-of-a-suit opening (1♠ – 2♣/2♦/2♥). In the modern style it is **game forcing**.\n\n› What it promises\n**12+ HCP** (or equivalent) and a commitment to **not stop below game**. Since you both know game is on, you can use the whole auction to **describe shape and look for slam** without fear of partner passing.\n\n› How it develops\nAfter a 2/1, no call below game is a signoff: both paint suits, show shortness and measure controls. It is the foundation for unhurried slam investigation.\n\n› Exception: forcing 1NT\nWhen you can't make a 2/1 but hold 6-12 with no fit, many play a **forcing 1NT** (1♠ – 1NT forces opener to rebid). It handles in-between hands without jumping levels.\n\nAgree with partner whether you play 2/1 GF and a forcing 1NT: they are the skeleton of modern natural bidding." } },
      { id: "l3b", t: { es: "Apoyos fuertes: Jacoby 2ST y splinters", en: "Strong raises: Jacoby 2NT and splinters" },
        body: { es: "Cuando apoyas el mayor del compañero con **mano de manga (12+)** y 4+ triunfos, no saltes a 4M: usa una herramienta que investigue slam.\n\n› Jacoby 2ST\nSobre 1♥/1♠, la respuesta **2ST** es artificial: «apoyo de 4+ triunfos y fuerza de manga; descríbeme tu mano». El abridor contesta:\n• Salto a nuevo palo = **singleton/void** ahí (corte).\n• 3ST = mano equilibrada mínima.\n• 4 del palo = mínima sin corte.\n• 3 del palo = mano fuerte sin corte.\nAsí localizas cortes y controles para decidir slam.\n\n› Splinter\nUn **salto de color** en apoyo (1♠ – **4♦**) muestra **fit de 4+ triunfos, fuerza de manga y singleton/void en el palo del salto**. Le dice al abridor: «si tus puntos no están malgastados frente a mi corte, vamos a slam».\n\nAmbos convierten un simple «4♠» en una conversación de slam.", en: "When you support partner's major with a **game-going hand (12+)** and 4+ trumps, don't jump to 4M: use a tool that investigates slam.\n\n› Jacoby 2NT\nOver 1♥/1♠, the **2NT** response is artificial: \"4+ trump support and game values; describe your hand.\" Opener answers:\n• Jump in a new suit = **singleton/void** there (shortness).\n• 3NT = balanced minimum.\n• 4 of the suit = minimum, no shortness.\n• 3 of the suit = strong, no shortness.\nThis pinpoints shortness and controls to judge slam.\n\n› Splinter\nA **jump in a new suit** in support (1♠ – **4♦**) shows **4+ trump support, game values and a singleton/void in the jump suit**. It tells opener: \"if your points aren't wasted opposite my shortness, let's slam.\"\n\nBoth turn a plain \"4♠\" into a slam conversation." } },
      { id: "l3c", t: { es: "Preguntas de ases: Blackwood y Gerber", en: "Ace-asking: Blackwood and Gerber" },
        body: { es: "Antes de comprometerte a slam debes saber que **no faltan dos ases** (o un as y el rey de triunfo). Para eso preguntas.\n\n› Blackwood 4ST\n**4ST** pregunta por ases. En la versión clásica las respuestas son por escalones: 5♣=0 o 4, 5♦=1, 5♥=2, 5♠=3. Luego 5ST pregunta reyes.\n\n› RKCB 1430 (Roman Key Card)\nLa versión moderna cuenta **5 «cartas clave»**: los 4 ases **+ el rey de triunfo**, y vigila también la **dama de triunfo**. Respuestas (1430): 5♣=1 o 4, 5♦=0 o 3, 5♥=2 sin dama, 5♠=2 con dama. Es mucho más precisa porque el rey y la dama de triunfo deciden muchos slams.\n\n› Gerber 4♣\nSobre aperturas/rebids de **Sin Triunfo**, se usa **4♣** como pregunta de ases (para no pasar de 3ST con un 4ST natural).\n\nRegla: pregunta ases solo cuando ya tienes fit y fuerza de slam; si faltan dos claves, **frena en 5**.", en: "Before committing to slam you must know you are **not missing two aces** (or an ace and the trump king). So you ask.\n\n› Blackwood 4NT\n**4NT** asks for aces. Classic responses step up: 5♣=0 or 4, 5♦=1, 5♥=2, 5♠=3. Then 5NT asks for kings.\n\n› RKCB 1430 (Roman Key Card)\nThe modern version counts **5 \"key cards\"**: the 4 aces **+ the trump king**, and also tracks the **trump queen**. Responses (1430): 5♣=1 or 4, 5♦=0 or 3, 5♥=2 without the queen, 5♠=2 with the queen. It is far more precise because the trump king and queen decide many slams.\n\n› Gerber 4♣\nOver **Notrump** openings/rebids, **4♣** is used as the ace-ask (so you don't confuse it with a natural 4NT).\n\nRule: ask for aces only when you already have a fit and slam strength; if two key cards are missing, **stop in 5**." } },
      { id: "l3d", t: { es: "Cue bids y controles", en: "Cue bids and controls" },
        body: { es: "Cuando hay fit y ambicción de slam pero Blackwood no basta (te importa **dónde** están los controles), usas **cue bids**.\n\n› Qué es un cue bid\nTras fijar el triunfo, nombrar un **nuevo palo** ya no es natural: muestra un **control** en ese palo (un as o void en primera ronda; luego rey o singleton en segunda). Es una voz de **camino a slam**.\n\n› Cómo se usan\nSubes por escalones mostrando controles **de abajo arriba**, saltándote los palos donde no tienes control. Si tu compañero ve que cubres justo sus palos débiles, sigue; si detecta un palo **sin control en ninguna mano** (dos perdedoras rápidas), frena.\n\n› Por qué importan\nBlackwood cuenta ases pero no dice si te faltan **dos perdedoras rápidas en el mismo palo**. Los cue bids localizan esa fuga antes de pasar de 5. Combinados con RKCB, son la herramienta fina de slam.\n\nAcuerdo típico: primero se intercambian cue bids de controles; cuando todo cuadra, RKCB confirma el número exacto de claves.", en: "When there is a fit and slam ambition but Blackwood isn't enough (you care **where** the controls are), you use **cue bids**.\n\n› What a cue bid is\nAfter trumps are agreed, naming a **new suit** is no longer natural: it shows a **control** in that suit (an ace or void at first round; later a king or singleton at second round). It is a **slam-try** call.\n\n› How they are used\nYou step up showing controls **from the bottom upward**, skipping suits where you have no control. If partner sees you cover exactly their weak suits, they continue; if they spot a suit with **no control in either hand** (two fast losers), they stop.\n\n› Why they matter\nBlackwood counts aces but won't tell you if you're missing **two fast losers in the same suit**. Cue bids find that leak before going past 5. Combined with RKCB, they are the fine slam tool.\n\nTypical agreement: exchange control cue bids first; when everything fits, RKCB confirms the exact number of key cards." } },
      { id: "l3e", t: { es: "Doblos en competición", en: "Doubles in competition" },
        body: { es: "El **doblo (X)** cambia de sentido según el contexto. Confundir castigo con informativo cuesta muchos puntos.\n\n› Contra informativo (takeout)\nA **bajo nivel** sobre la apertura rival pide a tu compañero que elija palo (visto en Nivel 2). Muestra apertura+ y corto en el palo rival.\n\n› Contra negativo (negative double)\nCuando **tu** compañero abre y el rival interviene (1♦ – (1♠) – **X**), tu doblo es **informativo**: muestra los palos no nombrados, típicamente la(s) mayor(es) de 4 que no pudiste decir por la intervención, con 6+ PH. Es la herramienta más usada en competición.\n\n› Contra de castigo (penalty)\nA **niveles altos** o cuando ya describiste tu mano, X significa «creo que no cumplen; defiéndelo». Cuando el contexto deja claro que no es de toma, es de palo.\n\n› Regla práctica\nPor debajo de cierto nivel y en posición de respondiente, casi todos los doblos «bajos» son **negativos/informativos**, no de castigo. Acuérdalo con tu compañero (hasta 2♠, 3♠, 4♥...).", en: "The **double (X)** changes meaning with context. Confusing penalty with takeout costs many points.\n\n› Takeout double\nAt a **low level** over their opening it asks partner to choose a suit (seen in Level 2). Shows opening values+ and shortness in their suit.\n\n› Negative double\nWhen **your** partner opens and the opponent overcalls (1♦ – (1♠) – **X**), your double is **informative**: it shows the unbid suits, typically the 4-card major(s) you couldn't name because of the overcall, with 6+ HCP. It is the most-used competitive tool.\n\n› Penalty double\nAt **high levels** or once you've already described your hand, X means \"I think they're going down; defend it.\" When context makes clear it isn't takeout, it is for penalty.\n\n› Practical rule\nBelow an agreed level and in the responder seat, almost all \"low\" doubles are **negative/takeout**, not penalty. Agree the cut-off with partner (through 2♠, 3♠, 4♥...)." } },
      { id: "l3f", t: { es: "Intervenciones de dos palos", en: "Two-suited overcalls" },
        body: { es: "Para mostrar **dos palos a la vez** sobre la apertura rival hay convenciones que ganan espacio y avisan a tu compañero de un buen ajuste.\n\n› Cue-bid de Michaels\nNombrar el **mismo palo que abrió el rival** (1♥ – **2♥**) es Michaels: muestra **dos palos de 5+**. Sobre apertura menor, promete **las dos mayores**; sobre apertura mayor, la **otra mayor + un menor**. Tu compañero elige el ajuste.\n\n› Unusual 2ST\nSaltar a **2ST** sobre la apertura rival (1♠ – **2ST**) no es natural: muestra **los dos palos menores** (5-5+) o, por contexto, los dos más bajos sin nombrar. Es para manos distribucionales y competir/preventir.\n\n› Cuándo usarlas\nCon manos **5-5 (o más)** y puntos modestos a buenos. El riesgo es que entregas mucha información si el rival acaba declarando; úsalas cuando la forma compense.\n\nAmbas convierten una mano bicolor en un mensaje único, en lugar de tener que adivinar dos veces.", en: "To show **two suits at once** over their opening there are conventions that gain room and alert partner to a good fit.\n\n› Michaels cue-bid\nBidding the **same suit the opponent opened** (1♥ – **2♥**) is Michaels: it shows **two 5+ card suits**. Over a minor opening it promises **both majors**; over a major opening, the **other major + a minor**. Partner picks the fit.\n\n› Unusual 2NT\nJumping to **2NT** over their opening (1♠ – **2NT**) is not natural: it shows **the two minors** (5-5+) or, by context, the two lowest unbid suits. It is for shapely hands to compete/pre-empt.\n\n› When to use them\nWith **5-5 (or more)** shapes and modest to good points. The risk is that you hand over information if the opponents end up declaring; use them when the shape pays.\n\nBoth turn a two-suiter into a single message instead of having to guess twice." } },
      { id: "l3g", t: { es: "Invitar o forzar: medir la manga", en: "Invite or force: judging game" },
        body: { es: "La mayoría de las manos no son ni claramente parcial ni claramente manga: están en la **zona de invitación** (combinado ~23-24). Saber invitar bien es lo que más puntos gana a la larga.\n\n› Cómo invitar\n• Subida con salto del mayor (1♥ – 3♥): ~10-11 y 4 triunfos.\n• 2ST de respuesta / rebid de 2ST: equilibrada en el límite.\n• Repetir un palo con salto: 6 cartas y valores de invitación.\n\n› Cómo aceptar o rechazar\nEl que recibe la invitación cuenta su **rango**: con el máximo de lo que ya prometió, **acepta** (va a manga); con el mínimo, **rechaza** (para en parcial). Suma puntos de distribución y calidad de honores (ases y reyes valen más que damas/jotas sueltas).\n\n› Cuándo NO invitar\nCon manga clara, **no inviten**: vayan directos (no le des al rival pistas ni una salida fácil). Con mano floja, paren pronto. La invitación es solo para la franja intermedia.\n\nMejor invitación = mejor puntuación; aquí se deciden muchos partidos.", en: "Most hands are neither clearly partscore nor clearly game: they live in the **invitational zone** (combined ~23-24). Inviting well is what gains the most points over time.\n\n› How to invite\n• Jump raise of the major (1♥ – 3♥): ~10-11 and 4 trumps.\n• 2NT response / 2NT rebid: balanced on the borderline.\n• Jump rebid of a suit: 6 cards and invitational values.\n\n› How to accept or reject\nThe hand receiving the invitation counts its **range**: with the maximum of what it already promised, **accept** (bid game); with the minimum, **reject** (stay in partscore). Add distribution points and honour quality (aces and kings beat loose queens/jacks).\n\n› When NOT to invite\nWith a clear game, **don't invite**: bid it directly (give opponents no clues and no easy lead). With a weak hand, stop early. Inviting is only for the in-between band.\n\nBetter invitations = better scores; many matches are decided here." } },
    ],
    quiz: [
      { q: { es: "♠4 ♥KQ10976 ♦J83 ♣952 (7 PH). De mano abres...", en: "♠4 ♥KQ10976 ♦J83 ♣952 (7 HCP). As dealer you open..." }, opts: ["Pass", "1♥", "2♥", "3♥"], a: 2 },
      { q: { es: "2♣ es...", en: "2♣ is..." }, opts: [{ es: "débil con clubs", en: "weak with clubs" }, { es: "fuerte 22+ forcing", en: "strong 22+ forcing" }, { es: "Stayman", en: "Stayman" }, { es: "natural 12", en: "natural 12" }], a: 1 },
      { q: { es: "RHO abre 1♦. Tú: ♠AQ97 ♥KJ86 ♦3 ♣K1042 (13 PH). Dices...", en: "RHO opens 1♦. You: ♠AQ97 ♥KJ86 ♦3 ♣K1042 (13 HCP). Bid..." }, opts: [{ es: "Pass", en: "Pass" }, { es: "1♥", en: "1♥" }, { es: "Doblo (takeout)", en: "Double (takeout)" }, { es: "2♦", en: "2♦" }], a: 2 },
      { q: { es: "Respuesta de Blackwood con 2 ases:", en: "Blackwood response with 2 aces:" }, opts: ["5♣", "5♦", "5♥", "5♠"], a: 2 },
      { q: { es: "Respuesta por defecto a 2♣:", en: "Default response to 2♣:" }, opts: ["2♦", "2NT", "Pass", "3♣"], a: 0 },
      { q: { es: "El doblo de información pide al compañero...", en: "A takeout double asks partner to..." }, opts: [{ es: "pasar", en: "pass" }, { es: "elegir su mejor palo", en: "pick their best suit" }, { es: "doblar otra vez", en: "double again" }, { es: "salir del As", en: "lead an ace" }], a: 1 },
    ],
    flash: [
      { f: { es: "Barrida débil", en: "Weak two" }, b: { es: "6 cartas, 6-10 PH", en: "6 cards, 6-10 HCP" } },
      { f: { es: "Apertura 2♣", en: "2♣ opening" }, b: { es: "22+ forcing a manga", en: "22+ game-forcing" } },
      { f: { es: "Blackwood", en: "Blackwood" }, b: { es: "4ST pregunta ases", en: "4NT asks aces" } },
      { f: { es: "Gerber", en: "Gerber" }, b: { es: "4♣ sobre ST", en: "4♣ over NT" } },
      { f: { es: "Doblo de información", en: "Takeout double" }, b: { es: "12+, corto en palo rival", en: "12+, short in their suit" } },
      { f: { es: "Intervención natural", en: "Natural overcall" }, b: { es: "5+, 8-16 PH", en: "5+, 8-16 HCP" } },
      { f: { es: "Regla 2-3 (preventiva)", en: "Rule of 2-3 (preempt)" }, b: { es: "pierde 2 vul / 3 no vul", en: "down 2 vul / 3 non-vul" } },
      { f: { es: "Cue-bid", en: "Cue-bid" }, b: { es: "muestra control de palo", en: "shows suit control" } },
    ],
    cheat: {
      title: { es: "Chuleta · Subasta intermedia", en: "Cheat sheet · Intermediate" },
      rows: [
        { es: "Preventivas: 2 = 6c · 3 = 7c · 4 = 8c (débil)", en: "Preempts: 2 = 6c · 3 = 7c · 4 = 8c (weak)" },
        { es: "2♣ fuerte → 2♦ relevo → abridor describe", en: "Strong 2♣ → 2♦ relay → opener describes" },
        { es: "Blackwood 5♣=0/4 5♦=1 5♥=2 5♠=3", en: "Blackwood 5♣=0/4 5♦=1 5♥=2 5♠=3" },
        { es: "Doblo X = takeout (corto en su palo, apoyo a los otros)", en: "Double X = takeout (short in their suit, support others)" },
      ],
    },
    schema: [
      { es: "Mano fuerte 22+ → 2♣ → 2♦ → describe", en: "Strong 22+ → 2♣ → 2♦ → describe" },
      { es: "Rival abre → 5+ buen palo: interviene · corto+12: doblo", en: "RHO opens → 5+ good suit: overcall · short+12: double" },
      { es: "Fit + 33 → 4ST Blackwood → cuenta ases → slam", en: "Fit + 33 → 4NT Blackwood → count aces → slam" },
    ],
  },
  {
    id: 4, key: "play",
    name: { es: "Nivel 4 · Carteo", en: "Level 4 · Declarer play" },
    sub: { es: "Plan de juego, impasses, triunfos", en: "Planning, finesses, drawing trumps" },
    dealsTarget: 90,
    lessons: [
      { id: "l4a", t: { es: "El plan del carteo", en: "The declarer's plan" },
        body: { es: "Cuando bajan el muerto, **para**. El instinto de ganar la primera baza rápido es el gran enemigo. Haz el plan completo antes de jugar de la baza 1.\n\n› Los cuatro pasos (en ST: cuenta ganadoras)\n1. **Cuenta** tus ganadoras seguras (top tricks).\n2. Resta de las bazas que necesitas: ¿cuántas faltan?\n3. **Busca** de dónde salen: palo largo, impasse, fallo, fuerza...\n4. **Ordena** la jugada: entradas, peligros, orden de los palos.\n\n› Con triunfo: cuenta perdedoras\nMira ambas manos y cuenta perdedoras por palo; luego decide cómo eliminarlas (fallar en el muerto, descartar sobre un largo, impasse) y **cuándo sacar triunfos**.\n\n› La pregunta clave\n«¿Qué puede salir mal?» Identifica el **riesgo** (un palo que rompe mal, una mano peligrosa que no debe ganar) y diseña el plan para neutralizarlo. El buen carteo es 80% plan, 20% técnica.", en: "When dummy comes down, **stop**. The urge to grab the first trick is the great enemy. Make the whole plan before playing from trick 1.\n\n› The four steps (in NT: count winners)\n1. **Count** your sure winners (top tricks).\n2. Subtract from the tricks you need: how many are missing?\n3. **Find** where they come from: long suit, finesse, ruff, force...\n4. **Sequence** the play: entries, dangers, order of suits.\n\n› With a trump: count losers\nLook at both hands and count losers per suit; then decide how to remove them (ruff in dummy, discard on a long suit, finesse) and **when to draw trumps**.\n\n› The key question\n\"What can go wrong?\" Identify the **risk** (a suit that breaks badly, a danger hand that must not gain the lead) and design the plan to neutralise it. Good declarer play is 80% plan, 20% technique." } },
      { id: "l4b", t: { es: "Sacar triunfos: cuándo sí y cuándo no", en: "Drawing trumps: when and when not" },
        body: { es: "Sacar los triunfos del rival evita que te **fallen** tus ganadoras. Pero hacerlo a destiempo arruina contratos.\n\n› Saca triunfos cuando...\n• No necesitas el triunfo del muerto para **fallar** perdedoras.\n• Temes que el rival falle tus ases/reyes de palos laterales.\nCuenta los triunfos rivales y sácalos hasta que no quede ninguno alto contra ti.\n\n› NO saques triunfos (todavía) cuando...\n• Necesitas **fallar perdedoras en el muerto** primero (si gastas los triunfos del muerto sacándolos, te quedas sin con qué fallar).\n• Quieres usar el triunfo como **entrada** o para un cross-ruff.\n• Hay un impasse de triunfo que debes hacer antes.\n\n› Regla mnemotécnica\nCuenta cuántos fallos necesitas en la **mano corta** de triunfos. Si necesitas fallar, **falla primero** y saca triunfos después; si no, sácalos cuanto antes para no sufrir fallos.", en: "Drawing the opponents' trumps stops them from **ruffing** your winners. But doing it at the wrong time wrecks contracts.\n\n› Draw trumps when...\n• You don't need dummy's trumps to **ruff** losers.\n• You fear opponents ruffing your side-suit aces/kings.\nCount their trumps and pull them until none high remain against you.\n\n› Do NOT draw trumps (yet) when...\n• You need to **ruff losers in dummy** first (if you spend dummy's trumps drawing, you've nothing left to ruff with).\n• You want a trump as an **entry** or for a cross-ruff.\n• There is a trump finesse to take first.\n\n› Mnemonic\nCount how many ruffs you need in the **short** trump hand. If you need ruffs, **ruff first** and draw trumps later; if not, draw them early to avoid suffering ruffs." } },
      { id: "l4c", t: { es: "El impasse (finesse)", en: "The finesse" },
        body: { es: "El **impasse** es la maniobra para ganar una baza con un honor que no es el más alto, aprovechando la **posición** de un honor rival.\n\n› El impasse simple\nCon **AQ** en una mano y pequeñas enfrente, juegas hacia el AQ: si el **Rey está delante** (a tu derecha, jugando antes), la dama gana. Es una apuesta ~50%: el rey está «bien colocado» la mitad de las veces.\n\n› Hacia el honor\nSiempre **lideras hacia** el honor que quieres hacer valer, desde la mano de enfrente. Nunca «sueltes» el honor desde su propia mano esperando que cubran.\n\n› Doble impasse\nCon **AQ10**, puedes impasar dos veces (primero la 10, luego la Q) buscando R y J en la mano correcta.\n\n› Antes de impasar, ¿hay algo mejor?\nA veces una **jugada de seguridad** o establecer otro palo evita el riesgo. Y recuerda: cuenta tus bazas — quizá no necesitas el impasse y puedes asegurar el contrato sin arriesgar.", en: "The **finesse** is the play to win a trick with an honour that is not the highest, exploiting the **position** of an opponent's honour.\n\n› The simple finesse\nWith **AQ** in one hand and small cards opposite, you lead toward the AQ: if the **King is in front** (to your right, playing first), the queen wins. It is roughly 50%: the king is \"well placed\" half the time.\n\n› Lead toward the honour\nAlways **lead toward** the honour you want to score, from the opposite hand. Never \"release\" the honour from its own hand hoping they cover.\n\n› Double finesse\nWith **AQ10**, you can finesse twice (first the 10, then the Q) hoping for K and J in the right hand.\n\n› Before finessing, is there something better?\nSometimes a **safety play** or establishing another suit avoids the risk. And remember: count your tricks — maybe you don't need the finesse and can secure the contract without risk." } },
      { id: "l4d", t: { es: "Establecer un palo largo", en: "Establishing a long suit" },
        body: { es: "Un palo largo (5+ cartas combinadas, mejor 8+) puede dar **bazas extra** una vez que el rival se queda sin cartas de ese palo. Es la mina de oro del Sin Triunfo.\n\n› La idea\nSi tienes **A K x x x** frente a **x x x**, las cartas pequeñas se vuelven ganadoras cuando los rivales (que tienen 5) ya no asisten: tras 2-3 rondas, tu **4ª y 5ª** ganan solas.\n\n› Cuenta y entradas\n• Cuenta cuántas veces tienes que **ceder** para establecerlo (con AKxxx contra 3-2, una ronda perdida quizá ninguna).\n• Reserva una **entrada** a la mano larga para cobrar los ganadores establecidos. Sin entrada, el palo largo no sirve.\n\n› Rotura del palo\nCalcula la rotura probable (un palo de 5 cartas rivales suele partir **3-2 ~68%**). Planifica para la rotura más común y, si puedes, para una mala sin coste.\n\nEstablecer un largo a menudo bate al impasse: es trabajo seguro en vez de apuesta 50%.", en: "A long suit (5+ combined, ideally 8+) can give **extra tricks** once opponents run out of it. It is the gold mine of Notrump.\n\n› The idea\nWith **A K x x x** opposite **x x x**, the small cards become winners when opponents (who hold 5) can no longer follow: after 2-3 rounds, your **4th and 5th** win by themselves.\n\n› Count and entries\n• Count how many times you must **concede** to establish it (with AKxxx against 3-2, maybe one round or none).\n• Keep an **entry** to the long hand to cash the established winners. Without an entry, the long suit is useless.\n\n› Suit break\nEstimate the likely break (a 5-card holding by opponents usually splits **3-2 ~68%**). Plan for the common break and, if you can, for a bad one at no cost.\n\nEstablishing a long suit often beats a finesse: sure work instead of a 50% bet." } },
      { id: "l4e", t: { es: "Fallar en el muerto y cruz de fallos", en: "Ruffing in dummy and the cross-ruff" },
        body: { es: "Las perdedoras que no puedes descartar las puedes **fallar**. El truco está en fallar en la mano **corta** de triunfos para no perder fuerza de triunfo.\n\n› Fallo en el muerto\nSi tu mano tiene la longitud de triunfo y el muerto es corto en un palo lateral, **falla allí**: cada fallo en el muerto es una baza extra que no tenías. Hazlo **antes** de sacar todos los triunfos del muerto (si no, te quedas sin con qué fallar).\n\n› Cruz de fallos (cross-ruff)\nCuando **ambas manos** tienen cortes complementarios y triunfos, puedes fallar de un lado y de otro alternativamente, cobrando triunfos por separado. \n• Primero **cobra tus ganadoras laterales** (luego no podrás, porque las fallarás o descartarás).\n• Después cruza fallando: cada baza la ganas con un triunfo distinto.\n\n› Cuidado con el sobre-fallo\nEn el cross-ruff, falla con triunfos **altos** cuando temas que el rival sobre-falle con uno mayor. Cuenta tus triunfos: el cross-ruff puede dar muchas bazas pero exige orden.", en: "Losers you can't discard you can **ruff**. The trick is to ruff in the **short** trump hand so you don't lose trump strength.\n\n› Ruffing in dummy\nIf your hand holds the trump length and dummy is short in a side suit, **ruff there**: each dummy ruff is an extra trick you didn't have. Do it **before** drawing all of dummy's trumps (otherwise you have nothing left to ruff with).\n\n› Cross-ruff\nWhen **both hands** have complementary short suits and trumps, you can ruff back and forth, scoring trumps separately.\n• First **cash your side winners** (later you can't, because you'll ruff or discard them).\n• Then cross-ruff: each trick is won with a different trump.\n\n› Beware the over-ruff\nIn a cross-ruff, ruff with **high** trumps when you fear an opponent over-ruffing with a bigger one. Count your trumps: the cross-ruff can yield many tricks but demands order." } },
      { id: "l4f", t: { es: "Hold-up y control en Sin Triunfo", en: "Hold-up and control in Notrump" },
        body: { es: "En Sin Triunfo, el **hold-up** consiste en **no ganar** tu parada en el palo del rival hasta que sea forzoso. Sirve para **cortar la comunicación** entre las dos manos contrarias.\n\n› La maniobra clásica\nEl rival sale de su palo largo (5 cartas) y tú tienes el As y poco más. Si ganas enseguida, cuando luego cedas el control en otro palo, el rival cobra su largo entero. En cambio, si **dejas pasar** una o dos rondas y ganas el As en la tercera, el peligroso se queda **sin cartas de enlace** con su compañero.\n\n› La regla de Bath / regla del 7\nUna guía: deja pasar hasta que el rival corto se quede sin el palo. A menudo basta con **rendir las dos primeras** y ganar la tercera (si el largo es 5 y reparten 5-3, en la 3ª ronda el de 3 ya no asiste).\n\n› Por qué funciona\nEl bridge en ST es una carrera de establecer palos. El hold-up **rompe la entrada** a la mano peligrosa: aunque establezca su palo, no podrá cobrarlo. Combínalo con dirigir tus impasses hacia la mano **no peligrosa**.", en: "In Notrump, the **hold-up** means **not winning** your stopper in the opponents' suit until you must. It serves to **cut communication** between the two opposing hands.\n\n› The classic play\nAn opponent leads their long suit (5 cards) and you hold the Ace and little else. If you win at once, when you later concede the lead in another suit, the opponent cashes their whole long suit. But if you **let it pass** once or twice and win the Ace on the third round, the danger hand is left **with no link cards** to partner.\n\n› The rule of 7\nA guide: hold up until the short opponent runs out of the suit. Often it's enough to **duck the first two** and win the third (if the long suit is 5 and it splits 5-3, on the 3rd round the 3-card hand no longer follows).\n\n› Why it works\nNT bridge is a race to establish suits. The hold-up **breaks the entry** to the danger hand: even if they establish their suit, they can't cash it. Combine it with steering your finesses toward the **safe** hand." } },
      { id: "l4g", t: { es: "Entradas, seguridad y conteo", en: "Entries, safety plays and counting" },
        body: { es: "Tres habilidades que distinguen al carteador experto.\n\n› Gestión de entradas\nUna **entrada** es una carta con la que pasas a una mano concreta. Antes de jugar, cuenta tus entradas a la mano que tiene el palo largo o el impasse. Muchos contratos caen no por falta de bazas sino por **falta de entradas** para cobrarlas. Conserva los honores pequeños de enlace; no malgastes una entrada temprano.\n\n› Jugadas de seguridad\nA veces sacrificas una posible baza extra para **garantizar** el contrato contra una mala rotura. Ej.: con A K x x x frente a x x, jugar primero hacia un honor para protegerte de un singleton. Pregúntate: «¿qué rotura me hunde y cómo la evito?».\n\n› Contar la mano\nSigue la **distribución**: cuántas cartas de cada palo ha mostrado cada rival (por la subasta, las salidas y los descartes). Cuando reconstruyes su forma, el impasse deja de ser adivinanza: sabes dónde está la dama. Contar es la diferencia entre un buen jugador y un experto.", en: "Three skills that mark the expert declarer.\n\n› Entry management\nAn **entry** is a card that lets you reach a particular hand. Before playing, count your entries to the hand holding the long suit or the finesse. Many contracts fail not for lack of tricks but for **lack of entries** to cash them. Preserve small linking honours; don't waste an entry early.\n\n› Safety plays\nSometimes you give up a possible extra trick to **guarantee** the contract against a bad break. E.g. with A K x x x opposite x x, play toward an honour first to guard against a singleton. Ask: \"which break sinks me and how do I avoid it?\"\n\n› Counting the hand\nTrack the **distribution**: how many cards of each suit each opponent has shown (from the bidding, leads and discards). Once you reconstruct their shape, the finesse stops being a guess: you know where the queen is. Counting is the difference between a good player and an expert." } },
      { id: "l4h", t: { es: "Loser-on-loser y avoidance", en: "Loser-on-loser and avoidance" },
        body: { es: "Dos técnicas elegantes para cuando el conteo básico no basta.\n\n› Loser-on-loser (perdedora sobre perdedora)\nEn vez de fallar o ganar, **descartas una perdedora de un palo sobre una perdedora de otro**. Usos típicos:\n• Ceder la baza a la mano **segura** (no peligrosa) del rival.\n• Evitar un sobre-fallo.\n• Rectificar el conteo para una squeeze.\nEs «cambiar una perdedora por otra» para controlar **quién** gana la baza.\n\n› Avoidance (evitar la mano peligrosa)\nCuando un rival es **peligroso** (si gana, cobra o lidera algo letal) y el otro no, diseñas la jugada para que **solo el inofensivo** pueda ganar la baza que cedes. Ejemplos:\n• Impasar hacia la mano peligrosa para que, si falla, gane el de detrás (el seguro).\n• Rendir el palo de modo que el peligroso nunca quede en mano.\n\n› La idea común\nNo todas las bazas perdidas son iguales: importa **a quién** se las das. Controlar el flujo de la mano —qué rival gana y cuándo— es carteo de nivel avanzado que convierte contratos imposibles en cumplidos.", en: "Two elegant techniques for when basic counting isn't enough.\n\n› Loser-on-loser\nInstead of ruffing or winning, you **discard a loser in one suit on a loser in another**. Typical uses:\n• Concede the trick to the **safe** opponent (not the danger hand).\n• Avoid an over-ruff.\n• Rectify the count for a squeeze.\nIt is \"swapping one loser for another\" to control **who** wins the trick.\n\n› Avoidance (keeping the danger hand off lead)\nWhen one opponent is **dangerous** (if on lead they cash or lead something lethal) and the other is not, you arrange the play so that **only the harmless** one can win the trick you concede. Examples:\n• Finesse toward the danger hand so that, if it loses, the safe hand behind wins.\n• Concede the suit so the danger hand is never on lead.\n\n› The common idea\nNot all lost tricks are equal: it matters **to whom** you give them. Controlling the flow of the hand — which opponent wins and when — is advanced play that turns impossible contracts into made ones." } },
    ],
    quiz: [
      { q: { es: "Sin triunfo, lo primero que cuentas son tus...", en: "In notrump, you first count your..." }, opts: [{ es: "perdedoras", en: "losers" }, { es: "ganadoras seguras", en: "sure winners" }, { es: "triunfos", en: "trumps" }, { es: "PH", en: "HCP" }], a: 1 },
      { q: { es: "Con AQ haces impasse esperando que el Rey esté...", en: "With AQ you finesse hoping the King is..." }, opts: [{ es: "delante (a tu derecha)", en: "in front (on your right)" }, { es: "detrás", en: "behind" }, { es: "fallado", en: "ruffed" }, { es: "descartado", en: "discarded" }], a: 0 },
      { q: { es: "Regla práctica de triunfos:", en: "Practical trump rule:" }, opts: [{ es: "nunca los saques", en: "never draw them" }, { es: "sácalos salvo que tengas algo mejor", en: "draw unless you have something better" }, { es: "déjalos siempre", en: "always leave them" }, { es: "fállalos", en: "ruff them" }], a: 1 },
      { q: { es: "Para cobrar un palo largo establecido necesitas...", en: "To cash an established long suit you need..." }, opts: [{ es: "más triunfos", en: "more trumps" }, { es: "una entrada", en: "an entry" }, { es: "un impasse", en: "a finesse" }, { es: "doblar", en: "to double" }], a: 1 },
      { q: { es: "Con triunfo cuentas sobre todo tus...", en: "In a suit contract you mainly count your..." }, opts: [{ es: "ganadoras", en: "winners" }, { es: "perdedoras", en: "losers" }, { es: "ases", en: "aces" }, { es: "entradas", en: "entries" }], a: 1 },
    ],
    flash: [
      { f: { es: "Sin triunfo: cuenta...", en: "Notrump: count..." }, b: { es: "ganadoras seguras", en: "sure winners" } },
      { f: { es: "Con triunfo: cuenta...", en: "Suit: count..." }, b: { es: "perdedoras", en: "losers" } },
      { f: { es: "Impasse", en: "Finesse" }, b: { es: "juega hacia el honor", en: "lead toward the honor" } },
      { f: { es: "Entrada", en: "Entry" }, b: { es: "carta para llegar a otra mano", en: "card to reach another hand" } },
      { f: { es: "Regla de triunfos", en: "Trump rule" }, b: { es: "saca salvo algo mejor", en: "draw unless better plan" } },
      { f: { es: "Fallo (ruff)", en: "Ruff" }, b: { es: "triunfar un palo corto", en: "trump a short suit" } },
      { f: { es: "Palo largo", en: "Long suit" }, b: { es: "bazas tras agotar rivales", en: "tricks after opponents run out" } },
    ],
    cheat: {
      title: { es: "Chuleta · Carteo", en: "Cheat sheet · Declarer play" },
      rows: [
        { es: "PLAN: cuenta · localiza honores · entradas · orden", en: "PLAN: count · place honors · entries · order" },
        { es: "ST → ganadoras · Triunfo → perdedoras", en: "NT → winners · Suit → losers" },
        { es: "Impasse: juega bajo hacia el honor", en: "Finesse: lead low toward the honor" },
        { es: "Saca triunfos salvo que necesites fallar antes", en: "Draw trumps unless you must ruff first" },
      ],
    },
    schema: [
      { es: "Gana 1ª baza → cuenta → ¿faltan bazas? → impasse/fallo/largo", en: "Win trick 1 → count → tricks short? → finesse/ruff/long suit" },
      { es: "¿Triunfos rivales peligrosos? → sácalos · ¿necesitas fallar? → espera", en: "Dangerous trumps? → draw · need to ruff? → wait" },
    ],
  },
  {
    id: 5, key: "adv",
    name: { es: "Nivel 5 · Avanzado", en: "Level 5 · Advanced" },
    sub: { es: "Squeeze, endplay, defensa experta", en: "Squeeze, endplay, expert defense" },
    dealsTarget: 90,
    lessons: [
      { id: "l5a", t: { es: "La squeeze (compresión)", en: "The squeeze" },
        body: { es: "Una **squeeze** obliga a un rival a descartar una carta que necesita: defiende dos palos y no puede guardar ambos. Es la maniobra avanzada más espectacular.\n\n› Requisitos (la receta clásica)\n• **Cuenta rectificada**: te falta exactamente **una** baza (debes haber perdido ya las demás perdedoras: «rectificar el conteo»).\n• Una **carta de menaza** en cada uno de dos palos.\n• **Comunicación** (entradas) entre las dos manos.\n• Un solo rival guarda ambos palos (squeeze simple).\n\n› Cómo funciona\nAl cobrar tu última carta larga (la «carta de squeeze»), el rival debe soltar de un palo o de otro. Suelte lo que suelte, una de tus menazas se vuelve ganadora.\n\n› En la práctica\nCobra tus ganadoras seguras dejando para el final el palo que aprieta. No necesitas «verlo» perfectamente: si la cuenta está rectificada y tienes menazas con entrada, **cobra tus triunfos/largos y observa los descartes**. Muchas squeezes funcionan «solas» si preparas la posición.", en: "A **squeeze** forces an opponent to discard a card they need: they guard two suits and can't keep both. It is the most spectacular advanced play.\n\n› Requirements (the classic recipe)\n• **Rectified count**: you are exactly **one** trick short (you must already have lost your other losers: \"rectifying the count\").\n• A **threat card** in each of two suits.\n• **Communication** (entries) between the two hands.\n• A single opponent guards both suits (simple squeeze).\n\n› How it works\nAs you cash your last long card (the \"squeeze card\"), the opponent must let go of one suit or the other. Whatever they release, one of your threats becomes a winner.\n\n› In practice\nCash your sure winners, keeping the squeezing suit for last. You don't need to \"see\" it perfectly: if the count is rectified and you have threats with an entry, **cash your trumps/long cards and watch the discards**. Many squeezes work \"by themselves\" if you prepare the position." } },
      { id: "l5b", t: { es: "Eliminación y endplay", en: "Elimination and endplay" },
        body: { es: "El **endplay** (jugada de fin) entrega la baza a un rival en un momento en que **cualquier carta que devuelva te ayuda**: o lidera hacia tu tenaza, o te da un fallo y descarte (ruff-and-discard).\n\n› La eliminación previa\nAntes de poner al rival en mano, **eliminas** sus salidas seguras: sacas triunfos y «despojas» (cobras y luego fallas) los palos laterales hasta que el rival se queda solo con cartas venenosas.\n\n› El throw-in\nEntonces le **cedes** una baza (a menudo con un honor o una carta perdedora calculada). Ahora está «en mano» y obligado a:\n• Liderar hacia tu **AQ** (te regala el impasse), o\n• Liderar un palo donde tú y el muerto estáis **vacíos de triunfo en ambos** → **ruff-and-discard**: fallas en una mano y descartas una perdedora en la otra.\n\n› Cuándo buscarlo\nCuando te falta una baza y un impasse es 50%, el endplay puede subir a **100%**: en vez de adivinar dónde está la dama, **obligas** al rival a resolverte el palo. Requiere contar la mano y eliminar con cuidado el orden de los palos.", en: "The **endplay** hands a trick to an opponent at a moment when **whatever they return helps you**: either they lead into your tenace, or give you a ruff-and-discard.\n\n› The prior elimination\nBefore throwing the opponent in, you **eliminate** their safe exits: draw trumps and \"strip\" (cash then ruff) the side suits until the opponent is left only with poisonous cards.\n\n› The throw-in\nThen you **concede** a trick (often with an honour or a calculated loser). Now they are \"on lead\" and forced to:\n• Lead into your **AQ** (handing you the finesse), or\n• Lead a suit where you and dummy are **both void of trumps** → **ruff-and-discard**: ruff in one hand, discard a loser in the other.\n\n› When to look for it\nWhen you're a trick short and a finesse is 50%, the endplay can raise it to **100%**: instead of guessing where the queen is, you **force** the opponent to solve the suit for you. It needs counting and careful order of suit elimination." } },
      { id: "l5c", t: { es: "Coups de triunfo", en: "Trump coups" },
        body: { es: "Cuando un rival tiene una tenaza de triunfo sobre ti (p. ej. tú lideras y él tiene J9 sobre tu AQ10 «al revés»), no puedes impasar normalmente porque no tienes triunfo bajo para liderar. Los **coups** lo resuelven.\n\n› Trump coup\nReduces tu longitud de triunfo (**fallando** en tu propia mano) hasta tener **el mismo número de triunfos que el rival**, y te colocas de modo que, al liderar otro palo desde el muerto en el momento justo, el rival deba **fallar antes que tú** quedando atrapado: su honor de triunfo cae bajo el tuyo.\n\n› Coup en passant\nSi el rival tiene un honor de triunfo alto pero tú lideras un palo lateral del que él está corto, juegas para **fallar delante de él**: si falla con su honor, sobre-fallas; si no falla, tu triunfo pequeño gana «de pasada».\n\n› La clave común\nAmbos requieren **acortar tu triunfo** (trump reduction) mediante fallos y manejar las **entradas** para estar en la mano correcta al final. Son raros pero deciden contratos imposibles; reconocerlos exige contar los triunfos rivales con exactitud.", en: "When an opponent has a trump tenace over you (e.g. you lead and they hold J9 over your AQ10 \"the wrong way\"), you can't finesse normally because you have no low trump to lead. **Coups** solve it.\n\n› Trump coup\nYou reduce your trump length (by **ruffing** in your own hand) until you hold **the same number of trumps as the opponent**, and position yourself so that, by leading another suit from dummy at the right moment, the opponent must **ruff before you** and is trapped: their trump honour falls under yours.\n\n› Coup en passant\nIf the opponent holds a high trump honour but you lead a side suit they are short in, you play to **ruff in front of them**: if they ruff with their honour you over-ruff; if they don't, your small trump wins \"in passing\".\n\n› The common key\nBoth require **shortening your trumps** (trump reduction) via ruffs and managing **entries** to be in the right hand at the end. They are rare but win impossible contracts; recognising them demands counting the opponents' trumps exactly." } },
      { id: "l5d", t: { es: "Dummy reversal", en: "The dummy reversal" },
        body: { es: "Normalmente fallas en la mano **corta** de triunfos. El **dummy reversal** invierte los papeles: fallas en la mano **larga** de triunfos a propósito, y usas la mano corta (el muerto) para **sacar los triunfos** al final.\n\n› Por qué hacerlo\nCuando fallar en la mano larga produce **más** bazas que el plan normal. Si la mano larga de triunfos puede dar 3 fallos y luego los triunfos del muerto sacan los del rival, ganas bazas extra por fallo que no tendrías de otro modo.\n\n› Requisitos\n• Suficientes **entradas al muerto** para fallar varias veces en la mano larga y volver.\n• Triunfos en el muerto bastantes para **terminar de sacar** los del rival.\n• Cuenta clara: el reversal suele cambiar 1 baza, así que solo cuando esa baza es decisiva.\n\n› La idea mental\nRe-imagina cuál mano es «el muerto»: trata tu mano larga como si fuera la corta para fallar, y deja que el muerto haga el trabajo de triunfo. Es contraintuitivo, por eso pilla a muchos; planifícalo desde la baza 1 contando entradas.", en: "Normally you ruff in the **short** trump hand. The **dummy reversal** flips the roles: you ruff in the **long** trump hand on purpose, and use the short hand (dummy) to **draw trumps** at the end.\n\n› Why do it\nWhen ruffing in the long hand produces **more** tricks than the normal plan. If the long trump hand can take 3 ruffs and then dummy's trumps draw the opponents', you gain extra ruff tricks you wouldn't otherwise have.\n\n› Requirements\n• Enough **entries to dummy** to ruff several times in the long hand and return.\n• Enough trumps in dummy to **finish drawing** the opponents'.\n• A clear count: the reversal usually swaps 1 trick, so do it only when that trick is decisive.\n\n› The mental trick\nRe-imagine which hand is \"dummy\": treat your long hand as if it were the short one for ruffing, and let dummy do the trump-drawing work. It is counter-intuitive, which is why it catches many out; plan it from trick 1, counting entries." } },
      { id: "l5e", t: { es: "Defensa: la salida (lead)", en: "Defence: the opening lead" },
        body: { es: "La **salida** (la primera carta de la defensa) es la decisión defensiva más importante: a ciegas, antes de ver el muerto. Cada salida transmite un mensaje a tu compañero.\n\n› Salidas estándar\n• **Top of a sequence**: de KQJ sales **K**; de QJ10 sales **Q**. Promete el honor de debajo.\n• **Cuarta mejor**: de un palo largo sin secuencia, sales tu **4ª carta más alta** (regla del 11 para que el compañero calcule).\n• **Top of nothing** / par: de xx sales la alta; muestra que no tienes honor.\n• **Singleton**: contra contrato de palo, busca un **fallo** si tienes entrada de triunfo.\n\n› Contra Sin Triunfo vs contra palo\n• Contra **ST**: ataca tu **palo largo** para establecerlo (longitud manda).\n• Contra **palo**: evita **subleader por debajo de un As** (no salgas de Ax bajo); prefiere secuencias, singletons o palos pasivos. No regales impasses.\n\n› La regla más cara de romper\nNo subleades ases contra contratos de palo, y no abras palos donde el declarante tiene tenazas. La salida pone el tono de toda la defensa.", en: "The **opening lead** (defence's first card) is the most important defensive decision: made blind, before seeing dummy. Each lead sends a message to partner.\n\n› Standard leads\n• **Top of a sequence**: from KQJ lead the **K**; from QJ10 lead the **Q**. It promises the honour beneath.\n• **Fourth best**: from a long suit without a sequence, lead your **fourth highest** (rule of 11 lets partner work it out).\n• **Top of nothing** / from a doubleton: lead the high one; shows no honour.\n• **Singleton**: against a suit contract, seek a **ruff** if you have a trump entry.\n\n› Against Notrump vs against a suit\n• Against **NT**: attack your **long suit** to establish it (length rules).\n• Against a **suit**: avoid **underleading an ace** (don't lead low from Ax); prefer sequences, singletons or passive suits. Don't give away finesses.\n\n› The costliest rule to break\nDon't underlead aces against suit contracts, and don't open suits where declarer has tenaces. The lead sets the tone for the whole defence." } },
      { id: "l5f", t: { es: "Defensa: señales", en: "Defence: signals" },
        body: { es: "Como defensor solo ves tu mano y el muerto: las **señales** son cómo tu compañero y tú os pasáis información con las cartas que jugáis.\n\n› Las tres señales clásicas\n• **Actitud (attitude)**: cuando el compañero lidera, una carta **alta = me gusta** (anima a seguir), **baja = no me gusta**. La más usada.\n• **Cuenta (count)**: al asistir a un palo del declarante, **alta-baja = par (número par de cartas)**, **baja-alta = impar**. Ayuda al compañero a contar la mano y saber cuándo ganar.\n• **Preferencia de palo (suit-preference)**: una carta **alta** pide el palo más alto de los dos relevantes; **baja**, el más bajo. Útil al dar un fallo o en el último cartón de un palo.\n\n› Cómo usarlas\nNo señales «porque sí»: la señal sirve cuando tu compañero tiene una **decisión** (seguir el palo, cambiar, saber cuándo ganar el As en un hold-up). \n\n› Prioridad\nGeneralmente: **actitud** primero; si la actitud es obvia, da **cuenta**; si ambas son claras, da **preferencia**. Acuerda el sistema (estándar o «upside-down») con tu compañero: defender en equipo bate al declarante.", en: "As a defender you see only your hand and dummy: **signals** are how you and partner pass information with the cards you play.\n\n› The three classic signals\n• **Attitude**: when partner leads, a **high card = I like it** (encourages continuing), **low = I don't**. The most used.\n• **Count**: when following to declarer's suit, **high-low = even (an even number of cards)**, **low-high = odd**. It helps partner count the hand and know when to win.\n• **Suit-preference**: a **high** card asks for the higher of the two relevant suits; **low**, the lower. Useful when giving a ruff or on the last card of a suit.\n\n› How to use them\nDon't signal \"for no reason\": a signal matters when partner has a **decision** (continue the suit, switch, know when to take the Ace in a hold-up).\n\n› Priority\nGenerally: **attitude** first; if attitude is obvious, give **count**; if both are clear, give **preference**. Agree the system (standard or \"upside-down\") with partner: defending as a team beats declarer." } },
      { id: "l5g", t: { es: "Defensa: técnica de cartón", en: "Defence: card technique" },
        body: { es: "Las reglas posicionales de la defensa, las mismas que tu rival-máquina aplica, y que debes dominar para no regalar bazas.\n\n› Tercera mano alta\nCuando tu compañero lidera y tú eres **tercero** en jugar, juega **alto** para forzar al declarante o ganar la baza. Con honores **tocados** (QJ), juega el **más bajo** (la J): gana igual y «promete» el de arriba a tu compañero.\n\n› Segunda mano baja\nCuando el declarante lidera y tú eres **segundo**, normalmente juega **bajo**: deja que tu compañero (cuarto en jugar) aporte la carta decisiva con más información. No «subas» honores sin motivo.\n\n› Cubrir un honor con un honor\nSi el declarante (o el muerto) lidera un **honor** (J, Q...), cúbrelo con el tuyo inmediatamente superior **solo** cuando pueda promover una carta tuya o de tu compañero. Cubrir el **último** de honores tocados; no malgastes tu rey sobre una J si el muerto tiene QJ10 (espera a la Q).\n\n› Contar y deducir\nSuma lo que ves: la subasta del declarante, las señales del compañero, las cartas jugadas. Reconstruye la mano oculta. La mejor defensa nace de **contar**, no de adivinar: sabrás cuándo ganar un As, cuándo cambiar de palo y cuándo un fallo te espera.", en: "The positional rules of defence — the same your robot opponent applies — that you must master to avoid gifting tricks.\n\n› Third hand high\nWhen partner leads and you are **third** to play, play **high** to force declarer or win the trick. With **touching** honours (QJ), play the **lowest** (the J): it wins equally and \"promises\" the one above to partner.\n\n› Second hand low\nWhen declarer leads and you are **second**, usually play **low**: let partner (fourth to play) contribute the decisive card with more information. Don't \"rise\" with honours for no reason.\n\n› Cover an honour with an honour\nIf declarer (or dummy) leads an **honour** (J, Q...), cover with your next-higher one **only** when it can promote a card for you or partner. Cover the **last** of touching honours; don't waste your king on a J when dummy has QJ10 (wait for the Q).\n\n› Count and deduce\nAdd up what you see: declarer's bidding, partner's signals, the cards played. Reconstruct the hidden hand. The best defence comes from **counting**, not guessing: you'll know when to win an Ace, when to switch suits and when a ruff awaits you." } },
      { id: "l5h", t: { es: "Probabilidades y estrategia", en: "Probabilities and strategy" },
        body: { es: "El bridge experto se apoya en números sencillos y en adaptar la estrategia al tipo de competición.\n\n› Roturas de palo (lo que más se usa)\n• Con un número **par** de cartas que faltan, tienden a partir **desigual**: 5 cartas → 3-2 (~68%) más que 4-1.\n• Con un número **impar**, parten más **parejo**: 4 cartas → 3-1 (~50%) o 2-2 (~40%).\n• Plazas vacías (vacant places): cuanto más larga sabes que es una mano en otros palos, **menos** sitio le queda para la carta que buscas.\n\n› Elección restringida (restricted choice)\nSi un rival juega un honor de dos tocados (p. ej. la J de QJ), es **más probable** que fuera forzado (solo tenía esa) que que eligiera entre dos. Conclusión práctica: tras ver caer un honor, **el impasse contra el otro suele ganar**. Es un ~2:1 a tu favor.\n\n› MP contra IMP\n• En **parejas (matchpoints)** cada baza extra cuenta: arriesga por sobrebazas, busca el mejor tanteo relativo.\n• En **equipos (IMPs)** prima **cumplir el contrato**: toma jugadas de seguridad, no arriesgues una manga por una sobrebaza. La estrategia correcta cambia el modo de jugar la misma mano.", en: "Expert bridge leans on simple numbers and on adapting strategy to the form of competition.\n\n› Suit breaks (the most used)\n• With an **even** number of missing cards, they tend to split **unevenly**: 5 missing → 3-2 (~68%) more than 4-1.\n• With an **odd** number, they split more **evenly**: 4 missing → 3-1 (~50%) or 2-2 (~40%).\n• Vacant places: the longer you know a hand is in other suits, the **less** room it has for the card you seek.\n\n› Restricted choice\nIf an opponent plays an honour from two touching (e.g. the J from QJ), it is **more likely** they were forced (held only that) than that they chose between two. Practical upshot: after an honour falls, **the finesse against the other usually wins**. It's about 2:1 in your favour.\n\n› MP versus IMP\n• In **pairs (matchpoints)** every extra trick counts: risk for overtricks, chase the best relative score.\n• In **teams (IMPs)** **making the contract** is paramount: take safety plays, never risk a game for an overtrick. The right strategy changes how you play the very same hand." } },
    ],
    quiz: [
      { q: { es: "El squeeze necesita la 'cuenta rectificada', es decir...", en: "A squeeze needs a 'rectified count', meaning..." }, opts: [{ es: "ganar todas las bazas antes", en: "win all tricks first" }, { es: "perder las perdedoras menos una", en: "lose your losers down to one" }, { es: "sacar triunfos", en: "draw trumps" }, { es: "doblar", en: "double" }], a: 1 },
      { q: { es: "Señal de actitud alto-bajo significa...", en: "High-low attitude signal means..." }, opts: [{ es: "me gusta / continúa", en: "I like it / continue" }, { es: "no me gusta", en: "I dislike it" }, { es: "número par", en: "even count" }, { es: "preferencia", en: "preference" }], a: 0 },
      { q: { es: "Contra ST, salida estándar del palo largo:", en: "Vs NT, standard lead from your long suit:" }, opts: [{ es: "la más alta", en: "highest" }, { es: "4ª mejor", en: "4th best" }, { es: "la más baja", en: "lowest" }, { es: "el As", en: "the Ace" }], a: 1 },
      { q: { es: "El endplay fuerza al rival a...", en: "An endplay forces the opponent to..." }, opts: [{ es: "doblar", en: "double" }, { es: "jugar regalando una baza", en: "lead and concede a trick" }, { es: "descartar un As", en: "discard an Ace" }, { es: "pasar", en: "pass" }], a: 1 },
      { q: { es: "Michaels cue-bid muestra...", en: "Michaels cue-bid shows..." }, opts: [{ es: "una mano fuerte de un palo", en: "a strong one-suiter" }, { es: "dos palos (bicolor)", en: "a two-suiter" }, { es: "castigo", en: "penalty" }, { es: "ases", en: "aces" }], a: 1 },
    ],
    flash: [
      { f: { es: "Endplay", en: "Endplay" }, b: { es: "entregar mano para forzar regalo", en: "throw in to force a gift" } },
      { f: { es: "Squeeze", en: "Squeeze" }, b: { es: "rival no puede guardar 2 amenazas", en: "opp can't guard 2 threats" } },
      { f: { es: "Cuenta rectificada", en: "Rectified count" }, b: { es: "perdedoras menos una", en: "losers down to one" } },
      { f: { es: "Señal de actitud", en: "Attitude signal" }, b: { es: "alto-bajo = me gusta", en: "high-low = I like it" } },
      { f: { es: "Salida vs ST", en: "Lead vs NT" }, b: { es: "4ª mejor palo largo", en: "4th best long suit" } },
      { f: { es: "Michaels", en: "Michaels" }, b: { es: "bicolor por cue-bid", en: "two-suiter via cue-bid" } },
      { f: { es: "Unusual 2ST", en: "Unusual 2NT" }, b: { es: "dos menores", en: "two minors" } },
      { f: { es: "Ley de bazas totales", en: "Law of total tricks" }, b: { es: "compite a tu nivel de fit", en: "compete to your fit level" } },
    ],
    cheat: {
      title: { es: "Chuleta · Avanzado", en: "Cheat sheet · Advanced" },
      rows: [
        { es: "Squeeze: amenazas + entradas + cuenta rectificada", en: "Squeeze: threats + entries + rectified count" },
        { es: "Endplay: stripear palos → throw-in → ruff&discard / impasse forzado", en: "Endplay: strip suits → throw-in → ruff&discard / forced finesse" },
        { es: "Señales: actitud · conteo (par/impar) · preferencia", en: "Signals: attitude · count (even/odd) · suit preference" },
        { es: "Competitiva: neg X · Michaels · Unusual 2ST · Ley bazas totales", en: "Competitive: neg X · Michaels · Unusual 2NT · Law of total tricks" },
      ],
    },
    schema: [
      { es: "Cuenta exacta → elimina salidas → throw-in → rival regala", en: "Exact count → remove exits → throw-in → opp concedes" },
      { es: "Amenaza A + amenaza B + carta presionante → squeeze", en: "Threat A + threat B + squeeze card → squeeze" },
    ],
  },
];

function levelTotal(level) {
  // total trackable items: lessons + 1 quiz + dealsTarget(scaled)
  return level.lessons.length + 1 + level.dealsTarget;
}

// ============================================================
//  PLAY ENGINE — interactive trick play
//  South = declarer (user), North = dummy (user controls), E/W = auto defenders
// ============================================================
const SEAT_ORDER = ["N", "E", "S", "W"]; // clockwise
function nextSeat(s) { return SEAT_ORDER[(SEAT_ORDER.indexOf(s) + 1) % 4]; }
function isDeclSide(seat) { return seat === "N" || seat === "S"; }

function trickWinner(plays, trump) {
  // plays: [{seat, card}] in order; led suit = first
  const led = plays[0].card.s;
  let best = plays[0];
  for (let i = 1; i < plays.length; i++) {
    const p = plays[i];
    const pTrump = trump !== "ST" && p.card.s === trump;
    const bTrump = trump !== "ST" && best.card.s === trump;
    if (pTrump && !bTrump) best = p;
    else if (pTrump && bTrump) { if (RVAL[p.card.r] > RVAL[best.card.r]) best = p; }
    else if (!pTrump && !bTrump && p.card.s === led && best.card.s === led) { if (RVAL[p.card.r] > RVAL[best.card.r]) best = p; }
  }
  return best.seat;
}
function legalCards(hand, led) {
  if (!led) return hand;
  const inSuit = hand.filter(c => c.s === led);
  return inSuit.length ? inSuit : hand;
}
function cardEq(a, b) { return a.s === b.s && a.r === b.r; }

// ----- Defensive carding helpers -----
const isHonor = (c) => RVAL[c.r] >= 11; // J,Q,K,A
function suitDesc(hand, suit) { return hand.filter(c => c.s === suit).sort((a, b) => RVAL[b.r] - RVAL[a.r]); }
// Lowest card of the consecutive (rank-adjacent) run that starts at index `idx` in a desc-sorted suit.
function lowestOfRun(desc, idx) {
  let j = idx;
  while (j + 1 < desc.length && RVAL[desc[j].r] - RVAL[desc[j + 1].r] === 1) j++;
  return desc[j];
}
const lowestCard = (cards) => cards.reduce((lo, c) => RVAL[c.r] < RVAL[lo.r] ? c : lo, cards[0]);
// Choose a discard: keep trumps & honors, pitch low from the longest weak side suit.
function pickDiscard(hand, trump) {
  const m = bySuit(hand);
  let best = null, bestScore = -1;
  for (const s of SUITS) {
    if (!m[s].length) continue;
    if (s === trump && SUITS.some(o => o !== trump && m[o].length)) continue; // avoid pitching trump if alternatives
    const len = m[s].length;
    const hasHonor = m[s].some(isHonor);
    const score = len * 2 - (hasHonor ? 5 : 0) - (s === trump ? 100 : 0);
    if (score > bestScore) { bestScore = score; best = s; }
  }
  if (best == null) best = SUITS.find(s => m[s].length);
  return lowestCard(m[best]);
}

// Stronger defender AI. Sees own hand, current trick, trump, partner seat, and cards already played.
function defenderPlay(hand, trick, trump, partnerSeat, played) {
  played = played || [];
  const suitContract = trump !== "ST";

  // ---------- OPENING LEAD ----------
  if (!trick.length) {
    const m = bySuit(hand);
    const side = SUITS.filter(s => s !== trump && m[s].length); // side suits (vs suit contract)
    const pool = suitContract && side.length ? side : SUITS.filter(s => m[s].length);
    // 1) Top of an honor sequence (2+ touching, headed by an honor)
    let seqLead = null;
    for (const s of pool) {
      const d = m[s];
      if (d.length >= 2 && isHonor(d[0]) && RVAL[d[0].r] - RVAL[d[1].r] === 1) {
        if (!seqLead || d.length > m[seqLead].length) seqLead = s;
      }
    }
    if (seqLead) return m[seqLead][0];
    // 2) vs suit contract: lead a side-suit singleton if we hold 3+ trumps (ruff hope)
    if (suitContract && m[trump].length >= 3) {
      const singles = side.filter(s => m[s].length === 1);
      if (singles.length) return m[singles[0]][0];
    }
    // 3) longest suit, avoiding underleading a bare ace vs a suit contract
    const ranked = pool.slice().sort((a, b) => m[b].length - m[a].length || SUITS.indexOf(a) - SUITS.indexOf(b));
    let pick = ranked[0];
    if (suitContract) {
      const safe = ranked.find(s => { const d = m[s]; const hasA = d[0] && d[0].r === "A"; const hasK = d.some(c => c.r === "K"); return !(hasA && !hasK); });
      if (safe) pick = safe;
    }
    const d = m[pick];
    if (!d) { const any = SUITS.find(s => m[s].length); return lowestCard(m[any]); }
    if (d[0] && d[0].r === "A" && !d.some(c => c.r === "K") && suitContract) return d[0]; // lead the ace, don't underlead it
    if (d.length >= 4) return d[3]; // 4th best
    if (d.length === 3) return d[2];
    return d[d.length - 1];
  }

  // ---------- FOLLOWING / DISCARDING ----------
  const led = trick[0].card.s;
  const legal = legalCards(hand, led);
  const winSeat = trickWinner(trick, trump);
  const partnerWinning = winSeat === partnerSeat;
  const curWin = trick.find(p => p.seat === winSeat).card;
  const pos = trick.length; // 1 => we are 2nd, 2 => 3rd, 3 => 4th
  const canBeat = (c) => {
    const cT = suitContract && c.s === trump, wT = suitContract && curWin.s === trump;
    if (cT && !wT) return true;
    if (cT && wT) return RVAL[c.r] > RVAL[curWin.r];
    if (!cT && !wT && c.s === led && curWin.s === led) return RVAL[c.r] > RVAL[curWin.r];
    return false;
  };
  const followingSuit = hand.some(c => c.s === led);

  // Can't follow suit -> ruff or discard
  if (!followingSuit) {
    if (suitContract && !partnerWinning) {
      const trumps = legal.filter(c => c.s === trump).sort((a, b) => RVAL[a.r] - RVAL[b.r]);
      const winningTrumps = trumps.filter(canBeat);
      if (winningTrumps.length) return winningTrumps[0]; // ruff / over-ruff cheaply
    }
    return pickDiscard(hand, trump);
  }

  const inSuit = suitDesc(hand, led); // desc
  const beats = inSuit.filter(canBeat);

  // Partner already winning the trick
  if (partnerWinning && pos >= 2) {
    // 4th seat with partner winning: just play low. 3rd seat: low unless we'd unblock — keep simple, low.
    return lowestCard(inSuit);
  }

  // 2nd hand (an opponent led and is winning)
  if (pos === 1) {
    // Cover an honor with an honor: if led card is J+ and we hold the next card up, cover cheaply.
    if (isHonor(curWin)) {
      const covers = beats.filter(isHonor).sort((a, b) => RVAL[a.r] - RVAL[b.r]);
      if (covers.length) { const idx = inSuit.findIndex(c => cardEq(c, covers[0])); return lowestOfRun(inSuit, idx); }
    }
    return lowestCard(inSuit); // second hand low
  }

  // 3rd hand high (partner led, opponent played 2nd and may be winning)
  if (pos === 2) {
    if (beats.length) { const top = beats[0]; const idx = inSuit.findIndex(c => cardEq(c, top)); return lowestOfRun(inSuit, idx); }
    return lowestCard(inSuit);
  }

  // 4th hand: win as cheaply as possible, else low
  if (beats.length) { const cheap = beats.sort((a, b) => RVAL[a.r] - RVAL[b.r])[0]; return cheap; }
  return lowestCard(inSuit);
}

// Declarer hint heuristic
function declarerHint(state, lang) {
  const { trick, trump, hands, turn } = state;
  const hand = hands[turn];
  const led = trick.length ? trick[0].card.s : null;
  if (!led) {
    // on lead
    if (trump !== "ST") {
      const outTrumps = countOutstandingTrumps(state);
      if (outTrumps > 0) return tx(lang, `Quedan ${outTrumps} triunfos rivales. Considera sacarlos jugando ${trump} alto si controlas el palo.`, `${outTrumps} enemy trumps remain. Consider drawing them by leading a high ${trump} if you control the suit.`);
    }
    return tx(lang, "Sin triunfos pendientes peligrosos: cobra tus ganadoras seguras o desarrolla tu palo largo.", "No dangerous trumps left: cash sure winners or develop your long suit.");
  }
  const legal = legalCards(hand, led);
  // can we win cheaply?
  const win = trickWinner(trick, trump);
  if (isDeclSide(win)) return tx(lang, "Tu lado ya gana la baza: juega tu carta más baja para no malgastar honores.", "Your side already wins the trick: play your lowest card to avoid wasting honors.");
  const sorted = legal.slice().sort((a, b) => RVAL[b.r] - RVAL[a.r]);
  return tx(lang, `Para ganar esta baza necesitas una carta alta del palo ${led}. Si no puedes ganarla barato, no malgastes un honor.`, `To win this trick you need a high ${led}. If you can't win cheaply, don't waste an honor.`);
}
function countOutstandingTrumps(state) {
  const { trump, hands, played } = state;
  if (trump === "ST") return 0;
  const declarerTrumps = hands.S.filter(c => c.s === trump).length + hands.N.filter(c => c.s === trump).length;
  const playedTrumps = played.filter(c => c.s === trump).length;
  return Math.max(0, 13 - declarerTrumps - playedTrumps - hands.S.filter(c=>c.s===trump).length*0); // approx visible
}

// ============================================================
//  DEAL GENERATORS
// ============================================================
function suggestContract(hands) {
  // Decide a sensible contract with South as declarer based on N+S
  const ns = hands.S.concat(hands.N);
  const L = lengths(ns);
  const h = hcp(ns);
  let strain = "ST", level = 1;
  // best major fit?
  if (L["♠"] >= 8) strain = "♠"; else if (L["♥"] >= 8) strain = "♥";
  else if (L["♦"] >= 8 && L["♦"] >= L["♣"]) strain = "♦"; else if (L["♣"] >= 8) strain = "♣"; else strain = "ST";
  // level by points
  if (strain === "ST") { level = h >= 25 ? 3 : h >= 23 ? 2 : 1; }
  else if (strain === "♠" || strain === "♥") { level = h >= 26 ? 4 : h >= 23 ? 3 : h >= 20 ? 2 : 1; }
  else { level = h >= 28 ? 5 : h >= 24 ? 3 : 2; }
  return { level, strain, declarer: "S" };
}

function generateDeal(seed) {
  const rng = mulberry32(seed >>> 0);
  const hands = dealHands(rng);
  const contract = suggestContract(hands);
  return { seed, hands, contract };
}

// Teaching deal themes for the "learn" library (labels only; deals are generated)
const LEARN_THEMES = {
  es: ["Apertura y respuesta", "Encontrar el fit mayor", "Elegir 3ST vs 4 mayor", "Subida invitacional", "Stayman en acción", "Transferencia Jacoby", "Barrida débil", "Intervención natural", "Doblo de información", "Plan de carteo sin triunfo", "Sacar triunfos a tiempo", "Impasse decisivo", "Establecer palo largo", "Fallo en el muerto", "Defensa: 4ª mejor", "Señal de actitud", "Conteo de la mano", "Endplay sencillo", "Explorar slam", "Competir con seguridad"],
  en: ["Opening and response", "Finding the major fit", "3NT vs 4 of a major", "Limit raise", "Stayman in action", "Jacoby transfer", "Weak two", "Natural overcall", "Takeout double", "Notrump play plan", "Drawing trumps in time", "The decisive finesse", "Establishing a long suit", "Ruff in dummy", "Defense: 4th best", "Attitude signal", "Counting the hand", "Simple endplay", "Slam exploration", "Competing safely"],
};
const CLASSIC_MOTIFS = {
  es: ["El impasse imposible", "Squeeze de salón", "Endplay de maestros", "El gran slam arriesgado", "Defensa heroica", "La falsa carta", "Coup en passant", "Squeeze doble", "Avalancha de triunfos", "El descarte clave", "Comunicaciones rotas", "La jugada de seguridad", "Trump coup", "El throw-in perfecto", "Gambito de honor", "La promoción de triunfo", "Loser-on-loser", "El squeeze de Vienna", "Bath coup", "Morton's fork"],
  en: ["The impossible finesse", "Parlor squeeze", "Masters' endplay", "The risky grand slam", "Heroic defense", "The false card", "Coup en passant", "Double squeeze", "Trump avalanche", "The key discard", "Broken communications", "The safety play", "Trump coup", "The perfect throw-in", "Honor gambit", "Trump promotion", "Loser-on-loser", "The Vienna coup", "Bath coup", "Morton's fork"],
};
function libDeals(kind, level, count, lang) {
  // kind: "learn" | "classic"; deterministic seeds
  const base = kind === "learn" ? 100000 + level * 1000 : 500000 + level * 1000;
  const themes = kind === "learn" ? LEARN_THEMES[lang] : CLASSIC_MOTIFS[lang];
  const out = [];
  for (let i = 0; i < count; i++) {
    const seed = base + i;
    out.push({
      id: `${kind}-${level}-${i}`,
      seed,
      label: `${themes[i % themes.length]} #${i + 1}`,
    });
  }
  return out;
}

// ============================================================
//  PBN IMPORT — parse real bridge deals (Portable Bridge Notation)
// ============================================================
const PBN_SUIT_ORDER = ["♠", "♥", "♦", "♣"];
const PBN_RANK_OK = new Set(RANKS);
function pbnContractToStrain(str) {
  // "4S" / "3NT" / "6H" / "PASS" -> { level, strain }
  if (!str) return null;
  const m = String(str).trim().toUpperCase().match(/^(\d)\s*(NT|S|H|D|C)/);
  if (!m) return null;
  const map = { S: "♠", H: "♥", D: "♦", C: "♣", NT: "ST" };
  return { level: parseInt(m[1], 10), strain: map[m[2]] };
}
// Parse one PBN hand fragment "AKQ.J93.T8.7654" into card array
function pbnHandToCards(frag) {
  const cards = [];
  const groups = frag.split(".");
  for (let i = 0; i < 4 && i < groups.length; i++) {
    const suit = PBN_SUIT_ORDER[i];
    for (const ch of groups[i].trim()) {
      const r = ch === "10" ? "T" : ch.toUpperCase();
      if (PBN_RANK_OK.has(r)) cards.push({ s: suit, r });
    }
  }
  return cards;
}
// Parse a [Deal "..."] value into {N,E,S,W}
function pbnDealValue(val) {
  const m = val.match(/^\s*([NESW])\s*:\s*(.+)$/i);
  if (!m) return null;
  const first = m[1].toUpperCase();
  const frags = m[2].trim().split(/\s+/);
  if (frags.length < 4) return null;
  const order = ["N", "E", "S", "W"];
  const start = order.indexOf(first);
  const hands = {};
  for (let i = 0; i < 4; i++) hands[order[(start + i) % 4]] = pbnHandToCards(frags[i]);
  return hands;
}
function validHands(hands) {
  if (!hands) return false;
  const seen = new Set();
  for (const s of ["N", "E", "S", "W"]) {
    if (!hands[s] || hands[s].length !== 13) return false;
    for (const c of hands[s]) { const k = c.s + c.r; if (seen.has(k)) return false; seen.add(k); }
  }
  return seen.size === 52;
}
// Rotate seats so that `declarer` sits South (keeps partnerships; user always declares from S)
function rotateDealToSouth(hands, declarer) {
  const order = ["N", "E", "S", "W"];
  const di = order.indexOf((declarer || "S").toUpperCase());
  if (di < 0) return hands;
  const shift = (2 - di + 4) % 4; // move declarer index -> 2 (South)
  const out = {};
  for (let i = 0; i < 4; i++) out[order[(i + shift) % 4]] = hands[order[i]];
  return out;
}
// Parse a whole PBN text (one or many deals, tag-based) -> array of {hands, contract, label}
function parsePBN(text) {
  if (!text) return [];
  const blocks = text.split(/\n\s*\n/); // PBN games separated by blank lines
  const out = [];
  const grab = (block, tag) => { const m = block.match(new RegExp(`\\[${tag}\\s+"([^"]*)"\\]`, "i")); return m ? m[1] : null; };
  for (const block of blocks) {
    const dealVal = grab(block, "Deal");
    if (!dealVal) continue;
    let hands = pbnDealValue(dealVal);
    if (!validHands(hands)) continue;
    const declarer = grab(block, "Declarer");
    const contractStr = grab(block, "Contract");
    const parsed = pbnContractToStrain(contractStr);
    if (declarer) hands = rotateDealToSouth(hands, declarer);
    const contract = parsed ? { level: parsed.level, strain: parsed.strain, declarer: "S" } : suggestContract(hands);
    const ev = grab(block, "Event"), bd = grab(block, "Board"), site = grab(block, "Site"), room = grab(block, "Room");
    const label = [ev && ev !== "?" ? ev : null, bd ? `#${bd}` : null].filter(Boolean).join(" ") || site || null;
    out.push({ hands, contract, label, board: bd || null, room: room || null });
  }
  return out;
}
function dealFromPBN(entry, idx) {
  return { seed: 800000 + idx, hands: entry.hands, contract: entry.contract };
}

// Built-in curated teaching deals in PBN (verified 52-card layouts; generated to illustrate a technique).
const BUILTIN_PBN = `[Event "finesse"]
[Board "1"]
[Dealer "S"]
[Declarer "S"]
[Contract "3NT"]
[Deal "N:5432..AK8.Q98764 9.Q76532.965.AKJ AQJT76.AKJ9.T43. K8.T84.QJ72.T532"]

[Event "longsuit"]
[Board "2"]
[Dealer "S"]
[Declarer "S"]
[Contract "3NT"]
[Deal "N:.T9.AKQJT9874.K2 QT532.QJ8.62.T63 AKJ8764.AK..AQJ4 9.765432.53.9875"]

[Event "drawtrumps"]
[Board "3"]
[Dealer "S"]
[Declarer "S"]
[Contract "4S"]
[Deal "N:98762.AKQ8.Q4.96 4.72.A32.AKT8532 AKQJT.54.KT76.QJ 53.JT963.J985.74"]

[Event "ruffdummy"]
[Board "4"]
[Dealer "S"]
[Declarer "S"]
[Contract "4H"]
[Deal "N:JT943.T98.97.982 K87.732.J63.KJT7 A.AKQJ5.AKQ854.A Q652.64.T2.Q6543"]

[Event "holdup"]
[Board "5"]
[Dealer "S"]
[Declarer "S"]
[Contract "3NT"]
[Deal "N:QJ85.T4.AKQJ72.5 2.98532.984.7432 AK943.AKJ.T65.A6 T76.Q76.3.KQJT98"]

[Event "endplay"]
[Board "6"]
[Dealer "S"]
[Declarer "S"]
[Contract "4S"]
[Deal "N:JT98.KJ.T93.QJ65 76.T9642.KJ62.A4 AKQ2.AQ73.85.872 543.85.AQ74.KT93"]

[Event "crossruff"]
[Board "7"]
[Dealer "S"]
[Declarer "S"]
[Contract "4H"]
[Deal "N:97.JT94.QJ6.AKQ2 J8543.32.AK3.J65 AKQT.AKQ75.7542. 62.86.T98.T98743"]

[Event "trumppromo"]
[Board "8"]
[Dealer "S"]
[Declarer "S"]
[Contract "4H"]
[Deal "N:86.765.KJ754.965 A974.QJ4.Q32.K72 KQ3.AKT983.A9.Q8 JT52.2.T86.AJT43"]`;

const BUILTIN_LABELS = {
  finesse: { es: "Impasse decisivo", en: "The key finesse" },
  longsuit: { es: "Establecer palo largo", en: "Establish a long suit" },
  drawtrumps: { es: "Sacar triunfos", en: "Drawing trumps" },
  ruffdummy: { es: "Fallo en el muerto", en: "Ruff in dummy" },
  holdup: { es: "Hold-up en ST", en: "Hold-up in NT" },
  endplay: { es: "Endplay / throw-in", en: "Endplay / throw-in" },
  crossruff: { es: "Cruz de fallos", en: "Cross-ruff" },
  trumppromo: { es: "Promoción de triunfo (defensa)", en: "Trump promotion (defense)" },
};
const BUILTIN_DEALS = parsePBN(BUILTIN_PBN); // parsed once

// Bundled real-deal pack: Big Deal output (the official EBL/WBF dealing engine), hands only.
const PACK_BIGDEAL = `[Board "1"]
[Deal "N:7.KJT.Q63.AKJT52 KT4.Q9764.AKT5.6 AJ862.85.J9742.4 Q953.A32.8.Q9873"]

[Board "2"]
[Deal "N:QJ974.75.975.872 AK65.Q.K8632.Q94 2.AKT32.AQJ.JT63 T83.J9864.T4.AK5"]

[Board "3"]
[Deal "N:J.JT76.QJT8742.Q AK985.K53.AK6.42 Q763.9.953.KJ653 T42.AQ842..AT987"]

[Board "4"]
[Deal "N:84.Q75.K98732.54 AQJT9.T.JT.KQ762 7532.AJ6.6.AJT98 K6.K98432.AQ54.3"]

[Board "5"]
[Deal "N:AQJ97.53.KJ7.952 T63.A7642.643.K3 52.KT98.A9.JT874 K84.QJ.QT852.AQ6"]

[Board "6"]
[Deal "N:KQ95.872.AQ4.764 AJT6.AQJ9.85.K98 832.KT65.9763.AT 74.43.KJT2.QJ532"]

[Board "7"]
[Deal "N:73.743.A986.J973 AQJ.JT9652.754.2 KT42.K.K3.AQT654 9865.AQ8.QJT2.K8"]

[Board "8"]
[Deal "N:AQT9543.KQJ.3.J3 .3.QT86542.QT874 K87.A754.AJ9.962 J62.T9862.K7.AK5"]

[Board "9"]
[Deal "N:QT82.43.754.AKJ7 A97.QT86.J983.T5 J.J752.AKT2.8642 K6543.AK9.Q6.Q93"]

[Board "10"]
[Deal "N:.KJ8.K8653.QJ963 K74.A96432.AT7.A QJ82.75.QJ94.T85 AT9653.QT.2.K742"]

[Board "11"]
[Deal "N:.J52.T864.A76542 K3.KT4.QJ973.Q83 AT9764.AQ76.AK2. QJ852.983.5.KJT9"]

[Board "12"]
[Deal "N:A.AKT85.Q732.KJT 83.J7643.95.A876 KJT65.Q.AKJ4.543 Q9742.92.T86.Q92"]

[Board "13"]
[Deal "N:AK7532.73.K96.85 9.KQJ854..KJT943 4.T.QT87432.A762 QJT86.A962.AJ5.Q"]

[Board "14"]
[Deal "N:975.75.AQ63.8743 A86.AJT82.T8.KQ9 QJ2.96.J9754.AJ6 KT43.KQ43.K2.T52"]

[Board "15"]
[Deal "N:J743.J.KT87532.K KQT6.K83.J.AQ976 8.AQT74.A94.T842 A952.9652.Q6.J53"]

[Board "16"]
[Deal "N:A52.Q.AT832.A932 QT8.963.KQJ94.54 76.AT542..KQJ876 KJ943.KJ87.765.T"]

[Board "17"]
[Deal "N:J94.T97.J62.KQ82 T5.K63.AT983.953 Q863.Q54.KQ54.74 AK72.AJ82.7.AJT6"]

[Board "18"]
[Deal "N:KQT.K98.9874.QJ9 2.QJT32.JT5.A654 AJ97.A74.K3.K732 86543.65.AQ62.T8"]

[Board "19"]
[Deal "N:A765.QT72..KJ752 QJ4.A53.654.Q963 KT92.KJ84.JT.A84 83.96.AKQ98732.T"]

[Board "20"]
[Deal "N:J98.97.K9742.Q42 T7654.A65.Q5.AT9 AK.Q84.T63.87653 Q32.KJT32.AJ8.KJ"]

[Board "21"]
[Deal "N:KJT3.T952.KQ98.7 86.8764.32.KT864 95.AKJ.T654.AJ32 AQ742.Q3.AJ7.Q95"]

[Board "22"]
[Deal "N:AQ4.KQ9542.97.96 J976.A87.T8.J752 T852.J.AQ653.AQ3 K3.T63.KJ42.KT84"]

[Board "23"]
[Deal "N:KQ96.3.763.K6532 JT843.KJ984.9.Q9 A72.A52.QJ842.JT 5.QT76.AKT5.A874"]

[Board "24"]
[Deal "N:J76.K74.KJ73.KQ2 KT953.AJ982..A87 A8.53.AQ6542.965 Q42.QT6.T98.JT43"]

[Board "25"]
[Deal "N:QT543.QJ4.T875.A 7.AK32.AJ42.J943 AK62.9876.KQ6.86 J98.T5.93.KQT752"]

[Board "26"]
[Deal "N:KJ3.54.QT75.AK54 9.QJT972.AK2.862 T42.K.J9863.QJ97 AQ8765.A863.4.T3"]

[Board "27"]
[Deal "N:8653.K.J962.J982 KJ4.A98542.QT.73 QT92.JT73.K8.Q65 A7.Q6.A7543.AKT4"]

[Board "28"]
[Deal "N:AQ8.QJ96.64.J542 9752.5.QT5.KQ973 KT643.KT8.973.T6 J.A7432.AKJ82.A8"]

[Board "29"]
[Deal "N:J3.93.J74.AT8654 Q9.QJ74.85.KQJ93 AT642.865.Q9632. K875.AKT2.AKT.72"]

[Board "30"]
[Deal "N:K7.AT7.A7.AJ9875 53.KQ6.KQ653.KT6 J864.984.JT.Q432 AQT92.J532.9842."]

[Board "31"]
[Deal "N:98654.QT75.QJ.94 T.32.A852.QJT872 AK3.J86.T9643.A5 QJ72.AK94.K7.K63"]

[Board "32"]
[Deal "N:AJT3.Q43.52.9753 82.T9872.87.AKT2 K974.K5.AQ943.64 Q65.AJ6.KJT6.QJ8"]

[Board "33"]
[Deal "N:A8764.AJ97.83.KJ J92.QT52.AT9754. K3.8643.Q.AQT542 QT5.K.KJ62.98763"]

[Board "34"]
[Deal "N:J3.Q.AK53.QJT532 AKT852.A4.T986.6 964.KT9863.72.74 Q7.J752.QJ4.AK98"]

[Board "35"]
[Deal "N:T43.754.54.Q8742 AQ62.AKT.AQ7.KJ6 K85.9.K98632.A53 J97.QJ8632.JT.T9"]

[Board "36"]
[Deal "N:KQ82.K975.T73.QJ 976.A.A864.T9632 T54.JT632.KQ2.74 AJ3.Q84.J95.AK85"]

[Board "37"]
[Deal "N:T5.KT94.762.KT43 A.AJ753.AQJ98.87 K976.Q82.543.Q92 QJ8432.6.KT.AJ65"]

[Board "38"]
[Deal "N:JT5.K9653.T85.J3 42.AJ.J62.AQ9642 AQ876.742.AK.K87 K93.QT8.Q9743.T5"]

[Board "39"]
[Deal "N:632.3.AT87.AJ985 AQ9.KQ9654.K9.Q3 T7.A82.J654.KT74 KJ854.JT7.Q32.62"]

[Board "40"]
[Deal "N:J942.J8.KQ42.KQ4 T6.K643.T9753.82 Q83.AQ.AJ86.A965 AK75.T9752..JT73"]

[Board "41"]
[Deal "N:AQ9.JT4.Q95.KT76 .K732.74.AQJ9832 T8654.Q6.AKJT32. KJ732.A985.86.54"]

[Board "42"]
[Deal "N:J4.T86.A632.7542 AKQT653.AQ3.9.AQ 98.K97.KQT854.93 72.J542.J7.KJT86"]

[Board "43"]
[Deal "N:87.KJ97632.2.J86 A42.T54.K73.T542 QJ93.Q8.Q865.KQ9 KT65.A.AJT94.A73"]

[Board "44"]
[Deal "N:Q987.Q5.Q652.AT9 T4.K942.AK4.QJ43 J32.AJT3.83.K852 AK65.876.JT97.76"]

[Board "45"]
[Deal "N:AK72.97.AJ7.K873 T986.J.K62.AQT62 J4.KT864.QT854.9 Q53.AQ532.93.J54"]

[Board "46"]
[Deal "N:AK.QT9842.A54.Q9 742.AJ65.863.T87 QT6.3.QJ972.A653 J9853.K7.KT.KJ42"]

[Board "47"]
[Deal "N:KQ9.J53.Q83.J653 AJ2.A862.KT54.Q2 8765.Q7.A962.A74 T43.KT94.J7.KT98"]

[Board "48"]
[Deal "N:T62.J93.9875.KQT K93.76.AKT.J9862 A7.AQT52.QJ63.53 QJ854.K84.42.A74"]

[Board "49"]
[Deal "N:AQ.9532.T75.AJ98 KT3.AQT6.A98.T62 872.K74.KQJ643.Q J9654.J8.2.K7543"]

[Board "50"]
[Deal "N:932.QT2.Q3.AQJ94 JT65.J64.AJ975.5 AK874.K75.8.8762 Q.A983.KT642.KT3"]

[Board "51"]
[Deal "N:653.6.J953.AQ532 874.J32.T762.KT9 AT2.A97.AKQ8.J86 KQJ9.KQT854.4.74"]

[Board "52"]
[Deal "N:942.A9543.J72.J8 KJ86..KT843.Q964 QT7.Q876.AQ9.A52 A53.KJT2.65.KT73"]

[Board "53"]
[Deal "N:AKT62.JT63.K96.8 Q87.A54.AJ832.AJ 543.92.QT7.Q9532 J9.KQ87.54.KT764"]

[Board "54"]
[Deal "N:Q53.98.K654.T843 742.AJT543.A97.5 J6.KQ76.T32.Q962 AKT98.2.QJ8.AKJ7"]

[Board "55"]
[Deal "N:K2.43.KT3.KQT542 QT8543.T7.7542.3 6.AKQJ62.J6.J976 AJ97.985.AQ98.A8"]

[Board "56"]
[Deal "N:54.8.KJ74.J87542 QT9862.KJ5.92.A9 AKJ.T932.AT65.63 73.AQ764.Q83.KQT"]

[Board "57"]
[Deal "N:KJ9.KT7.4.AQT843 763.J6432.AK652. AQT2..QJ93.J9752 854.AQ985.T87.K6"]

[Board "58"]
[Deal "N:Q95.QJ972.3.AT84 AKJ42.K86.K98.65 T76.AT53.T742.KQ 83.4.AQJ65.J9732"]

[Board "59"]
[Deal "N:AT72.Q.863.J6542 6.KJT9852.KJ.AT7 KJ98.A76.AT97.K3 Q543.43.Q542.Q98"]

[Board "60"]
[Deal "N:KQ82.A86.A7.AKQ7 76.532.Q9632.983 AJ9543.KQ.J8.542 T.JT974.KT54.JT6"]

[Board "61"]
[Deal "N:5.QT97432.AJ.JT9 AKJT.AJ8.KT5.Q42 742.6.8732.A7653 Q9863.K5.Q964.K8"]

[Board "62"]
[Deal "N:A96.A82.A9864.Q4 KJT2.9.J2.AKJ863 54.Q53.KQ73.T952 Q873.KJT764.T5.7"]

[Board "63"]
[Deal "N:KJT6.7.Q872.Q973 7543.AJ852.T.K54 Q82.KT.AK3.AJT86 A9.Q9643.J9654.2"]

[Board "64"]
[Deal "N:K9.AKT7.JT875.65 T64.5.A9643.A984 A753.982.K2.K732 QJ82.QJ643.Q.QJT"]

[Board "65"]
[Deal "N:KJ9.974.965.T964 8.QJ62.872.KQJ53 QT53.AKT.KQ3.A87 A7642.853.AJT4.2"]

[Board "66"]
[Deal "N:K9542.J98.K8.743 J7.AK4.AQ7542.JT AQT8.T2.T3.AKQ86 63.Q7653.J96.952"]

[Board "67"]
[Deal "N:K75.AK32.A32.KT3 AT62.QT9764..J92 3.J85.KQT965.A75 QJ984..J874.Q864"]

[Board "68"]
[Deal "N:JT73.KJ5.82.AKQ5 AQ5.Q6.KJ975.742 98.94.AQT63.J983 K642.AT8732.4.T6"]

[Board "69"]
[Deal "N:QT62.J7.AJ8732.J AKJ943.Q96.4.953 8.AK854.QT.AKT87 75.T32.K965.Q642"]

[Board "70"]
[Deal "N:T4.A4.JT762.AKJ8 AKQ.T75.Q93.T943 9875.KQ986.84.75 J632.J32.AK5.Q62"]

[Board "71"]
[Deal "N:.Q43.AKQ76.KT843 KJT98654.9.T932. AQ3.AKT862..Q762 72.J75.J854.AJ95"]

[Board "72"]
[Deal "N:KQ3.J652.KQ642.T 942.Q74.J98.AJ85 AT8.AT98.A3.Q762 J765.K3.T75.K943"]

[Board "73"]
[Deal "N:J.75.T872.AKQJT9 KT72.QT864.4.642 AQ843.J2.KQJ5.85 965.AK93.A963.73"]

[Board "74"]
[Deal "N:K53.95.7542.K987 QJ9864.A7..T6542 A2.QJ864.QJ96.J3 T7.KT32.AKT83.AQ"]

[Board "75"]
[Deal "N:A32.QT65.5.QT643 7.K743.JT974.A82 KT9854.J98.KQ3.K QJ6.A2.A862.J975"]

[Board "76"]
[Deal "N:52.T9.A32.Q98542 KJ9874.AKQ.KJ9.A 6.J876542.T65.JT AQT3.3.Q874.K763"]

[Board "77"]
[Deal "N:AK8754.AK94.T.K4 6.QJT83.K643.T92 T932.5.AQ9875.A3 QJ.762.J2.QJ8765"]

[Board "78"]
[Deal "N:J8.732.Q654.9752 Q653.A64.AKJ3.86 KT74.J8.T97.AKJ4 A92.KQT95.82.QT3"]

[Board "79"]
[Deal "N:A96.A76.AKJ652.8 T85.J8432.73.Q92 QJ42.Q9.Q4.76543 K73.KT5.T98.AKJT"]

[Board "80"]
[Deal "N:T532.K2.KJ4.AT53 AJ7.JT976.975.K4 KQ4.A543.T82.J92 986.Q8.AQ63.Q876"]

[Board "81"]
[Deal "N:T76.4.Q6432.AJ92 KQJ85.K87.AT5.T4 92.QJ53.KJ7.8765 A43.AT962.98.KQ3"]

[Board "82"]
[Deal "N:AT7532.A3.QT4.A7 KQJ94.876.95.KJT .KT542.J8.Q65432 86.QJ9.AK7632.98"]

[Board "83"]
[Deal "N:AQ8.98542.Q965.2 92.AKJT.J743.854 J643.63.K8.AKJT9 KT75.Q7.AT2.Q763"]

[Board "84"]
[Deal "N:J8.A9652.AKT972. KQ532.T43.J6.J54 A9764.K7.Q84.KQ2 T.QJ8.53.AT98763"]

[Board "85"]
[Deal "N:97653.T962.K.T93 AJT8.AQ.T642.AJ5 K42.K743.AQ7.872 Q.J85.J9853.KQ64"]

[Board "86"]
[Deal "N:62.6.T9865.Q9532 AK4.AKQ2.QJ74.T6 JT83.J97.K2.KJ84 Q975.T8543.A3.A7"]

[Board "87"]
[Deal "N:KQJ854.AJ73..T84 T.T62.QJ632.AJ53 732.K85.A975.962 A96.Q94.KT84.KQ7"]

[Board "88"]
[Deal "N:A632.T4.AQ632.63 QT98.Q753.J.QT54 J4.J962.KT975.KJ K75.AK8.84.A9872"]

[Board "89"]
[Deal "N:KT9.K.Q2.AT97543 86.AJ97542.97.K8 J4.86.KJT53.QJ62 AQ7532.QT3.A864."]

[Board "90"]
[Deal "N:KQ96.K73.965.KT3 72.98.AKQJ87.A62 AJ8.A652.T4.J954 T543.QJT4.32.Q87"]

[Board "91"]
[Deal "N:T54.A7.KT542.964 AJ76.62.QJ986.Q2 KQ9.KQT9854.A.53 832.J3.73.AKJT87"]

[Board "92"]
[Deal "N:AK976.K852.2.KT3 QJ.943.KQ84.QJ42 2.QJT.AT97.A8765 T8543.A76.J653.9"]

[Board "93"]
[Deal "N:76.432.KT976.K92 53.KQJ65.Q543.Q8 AQ92.AT97.A8.754 KJT84.8.J2.AJT63"]

[Board "94"]
[Deal "N:T6.43.T852.AKT72 KQ95.K6.AK3.9863 82.AQJT985.QJ4.J AJ743.72.976.Q54"]

[Board "95"]
[Deal "N:9863.A72.32.T753 T542.KQJ3.KQ4.AJ A7.965.JT9865.Q4 KQJ.T84.A7.K9862"]

[Board "96"]
[Deal "N:65.AQ6.JT875.753 T74.T753.Q93.KJ9 KQJ8.984.AK642.Q A932.KJ2..AT8642"]

[Board "97"]
[Deal "N:T.Q653.T975.KT42 K32.KT98.A843.Q5 AQ985.J74.Q2.AJ6 J764.A2.KJ6.9873"]

[Board "98"]
[Deal "N:Q42.AK6542.753.A A983.QJ.AJ8.K842 T75.973.Q2.QJ953 KJ6.T8.KT964.T76"]

[Board "99"]
[Deal "N:AK.J64.KQ432.KQ3 Q982.AKQ83.J986. 76.975.T75.AJ874 JT543.T2.A.T9652"]

[Board "100"]
[Deal "N:QJ3.K853.AQ2.763 T842.72.K93.KT85 AK97.AT9.T7.AQ42 65.QJ64.J8654.J9"]

[Board "101"]
[Deal "N:AKJ92.95.Q932.76 75.KQT.J8654.KQ3 643.73.K7.AJ9854 QT8.AJ8642.AT.T2"]

[Board "102"]
[Deal "N:Q92.J8.KT542.KQ7 KJT764.92.J763.8 A.AKQ54.Q9.JT965 853.T763.A8.A432"]

[Board "103"]
[Deal "N:A82..K9753.98752 K7.QJ83.JT842.QT T64.T72.AQ.KJ643 QJ953.AK9654.6.A"]

[Board "104"]
[Deal "N:T83.954.J876.743 AQJ52.KJ6.43.AK6 K976.QT83.952.J2 4.A72.AKQT.QT985"]

[Board "105"]
[Deal "N:KT63.3.QT876.QT8 AQ9742.9.A5.A742 J.AKJ862.K932.96 85.QT754.J4.KJ53"]

[Board "106"]
[Deal "N:AJT2.A95.87.AK76 85.T6.AQJT62.JT4 KQ763.KQJ2.K3.Q2 94.8743.954.9853"]

[Board "107"]
[Deal "N:J3.K974.Q6542.K8 K84.QT.A8.AJ7652 QT762.A32.T7.Q43 A95.J865.KJ93.T9"]

[Board "108"]
[Deal "N:985.A.Q9875.T943 AJ62.KJ865.3.AKJ KT3.9743.A62.865 Q74.QT2.KJT4.Q72"]

[Board "109"]
[Deal "N:KT975.Q4.Q543.94 Q843.AT53.KJT7.K AJ6.K862.62.AJ87 2.J97.A98.QT6532"]

[Board "110"]
[Deal "N:AKJ97.A975.A.953 Q8.T864.JT543.KQ 63.K2.KQ872.7642 T542.QJ3.96.AJT8"]

[Board "111"]
[Deal "N:96.Q.KJ86.Q98732 QJ87543.J96.T.A4 KT2.AKT753.Q9.T6 A.842.A75432.KJ5"]

[Board "112"]
[Deal "N:J43.AQ92.T6.J543 97.753.AJ43.AT72 AKQT5.T4.9752.Q9 862.KJ86.KQ8.K86"]

[Board "113"]
[Deal "N:842.QJ7.Q8754.A5 A96.82.93.Q87632 KT3.K9.KT62.KJ94 QJ75.AT6543.AJ.T"]

[Board "114"]
[Deal "N:AJ65.A62.K954.AT KT94.Q5.7.QJ9652 32.KT974.AT6.843 Q87.J83.QJ832.K7"]

[Board "115"]
[Deal "N:9642.4.AKT2.A754 8.KQ862.J8764.83 AT.AT9.Q93.KQ962 KQJ753.J753.5.JT"]

[Board "116"]
[Deal "N:AK852.J62.Q85.Q9 JT9643.A5.K9.AT5 .QT83.JT42.J8432 Q7.K974.A763.K76"]

[Board "117"]
[Deal "N:AK.98732.T8762.T Q84.A6.A943.QJ63 T752.JT.Q.A97542 J963.KQ54.KJ5.K8"]

[Board "118"]
[Deal "N:JT963.3.64.AQ742 75.KQT65.Q32.963 Q2.A842.AK98.JT8 AK84.J97.JT75.K5"]

[Board "119"]
[Deal "N:QJT87.T73.KQJ2.5 54.J.A7543.AKJ84 AK96.652.T98.632 32.AKQ984.6.QT97"]

[Board "120"]
[Deal "N:Q762.KT.Q864.QT5 KJT.764.A75.AK63 A83.Q982.K2.9742 954.AJ53.JT93.J8"]

[Board "121"]
[Deal "N:A63.T7.QT43.QJ64 QJ54.AQ863.8.983 KT82.42.AJ2.AKT5 97.KJ95.K9765.72"]

[Board "122"]
[Deal "N:AQJ97.AT7.T64.94 83.652.AQ73.A863 KT42.K3.KJ982.J7 65.QJ984.5.KQT52"]

[Board "123"]
[Deal "N:QJ43.K85.93.K987 982.J.AJT6.QJT52 K75.Q743.Q8754.A AT6.AT962.K2.643"]

[Board "124"]
[Deal "N:A97.K.KQT542.QJ4 JT.AQ854.7.A9865 K53.T9632.J9.K32 Q8642.J7.A863.T7"]

[Board "125"]
[Deal "N:T632.J64.KT54.87 8.9732.AQJ872.54 AQ954.AK85.6.962 KJ7.QT.93.AKQJT3"]

[Board "126"]
[Deal "N:A.QJ85.KQ.AJT764 KQT85.97643.T95. J932.AKT2.862.92 764..AJ743.KQ853"]

[Board "127"]
[Deal "N:K32.A972.Q972.43 765.Q8.AJT543.92 A.KJ53.K8.KQ8765 QJT984.T64.6.AJT"]

[Board "128"]
[Deal "N:JT9.QJ8.98754.K7 Q75.A53.AK3.AQJ9 AK64.T942.T.T643 832.K76.QJ62.852"]

[Board "129"]
[Deal "N:86.AQ.T62.AJ9863 A952.K9863.A.QT5 KJ3.T754.KJ985.7 QT74.J2.Q743.K42"]

[Board "130"]
[Deal "N:T75.AQ62.K9653.8 Q2.KJ53.Q.KJT765 AJ986.974.J84.A9 K43.T8.AT72.Q432"]

[Board "131"]
[Deal "N:T5.AT543.A82.742 A93.KQ.Q65.KQ965 J742.72.T943.AJ3 KQ86.J986.KJ7.T8"]

[Board "132"]
[Deal "N:AQJ.84.J54.K8542 KT875.J3.A76.AJ9 6.AKQT92.K92.QT6 9432.765.QT83.73"]`;
const PACK_PLUMLEY = `[Board "1"]
[Room "Closed"]
[Declarer "E"]
[Contract "3NT"]
[Deal "N:K73.AT94.J82.854 AQ4.KQ.Q95.QT976 J865.863.KT763.J T92.J752.A4.AK32"]

[Board "2"]
[Room "Open"]
[Declarer "W"]
[Contract "3NT"]
[Deal "N:KQJ5.73.JT54.862 9742.Q42.A63.K94 6.KJ9865.Q72.J73 AT83.AT.K98.AQT5"]

[Board "2"]
[Room "Closed"]
[Declarer "E"]
[Contract "4S"]
[Deal "N:KQJ5.73.JT54.862 9742.Q42.A63.K94 6.KJ9865.Q72.J73 AT83.AT.K98.AQT5"]

[Board "3"]
[Room "Open"]
[Declarer "E"]
[Contract "5C"]
[Deal "N:K96.762.J98764.A T5.AKQT9.A.T6532 QJ8432.54.32.QJ9 A7.J83.KQT5.K874"]

[Board "3"]
[Room "Closed"]
[Declarer "W"]
[Contract "4H"]
[Deal "N:K96.762.J98764.A T5.AKQT9.A.T6532 QJ8432.54.32.QJ9 A7.J83.KQT5.K874"]

[Board "4"]
[Room "Closed"]
[Declarer "N"]
[Contract "3NT"]
[Deal "N:K96.AJ732.75.A42 AJ532.5.K862.T65 874.KQ98.AT.KQ87 QT.T64.QJ943.J93"]

[Board "5"]
[Room "Closed"]
[Declarer "S"]
[Contract "3NT"]
[Deal "N:A954.5.T864.KQ98 T3.QJ83.AQ953.T4 KJ7.AKT9.KJ.A652 Q862.7642.72.J73"]

[Board "6"]
[Room "Closed"]
[Declarer "E"]
[Contract "4S"]
[Deal "N:654.AK9.KJ4.QJ98 AJ83.QJT.AQ85.75 9.8654.7632.KT62 KQT72.732.T9.A43"]

[Board "7"]
[Room "Closed"]
[Declarer "E"]
[Contract "4H"]
[Deal "N:K43.A2.KQJ65.Q76 A8.QJT865..AKJ52 QT52.K43.742.T94 J976.97.AT983.83"]

[Board "7"]
[Room "Open"]
[Declarer "W"]
[Contract "4H"]
[Deal "N:K43.A2.KQJ65.Q76 A8.QJT865..AKJ52 QT52.K43.742.T94 J976.97.AT983.83"]

[Board "8"]
[Room "Closed"]
[Declarer "S"]
[Contract "3NT"]
[Deal "N:AKJ6.AT53..AKQ63 9.K987.AKJ.JT987 Q732.QJ42.Q654.4 T854.6.T98732.52"]

[Board "8"]
[Room "Open"]
[Declarer "S"]
[Contract "6S"]
[Deal "N:AKJ6.AT53..AKQ63 9.K987.AKJ.JT987 Q732.QJ42.Q654.4 T854.6.T98732.52"]

[Board "9"]
[Room "Closed"]
[Declarer "N"]
[Contract "6NT"]
[Deal "N:JT95.A87.AJT.QJ3 Q864.J65.95.KT96 AK2.KQ4.KQ7.A752 73.T932.86432.84"]

[Board "9"]
[Room "Open"]
[Declarer "S"]
[Contract "6NT"]
[Deal "N:JT95.A87.AJT.QJ3 Q864.J65.95.KT96 AK2.KQ4.KQ7.A752 73.T932.86432.84"]

[Board "10"]
[Room "Closed"]
[Declarer "W"]
[Contract "4S"]
[Deal "N:Q.Q9872.53.QJ432 A87.A.AKJ8.KT985 KJ95.KT653.42.A7 T6432.J4.QT976.6"]

[Board "10"]
[Room "Open"]
[Declarer "W"]
[Contract "5D"]
[Deal "N:Q.Q9872.53.QJ432 A87.A.AKJ8.KT985 KJ95.KT653.42.A7 T6432.J4.QT976.6"]

[Board "11"]
[Room "Open"]
[Declarer "W"]
[Contract "4S"]
[Deal "N:T83.AT7.KT96.532 J72.KQ62.Q3.AK97 Q4.9854.J854.T84 AK965.J3.A72.QJ6"]

[Board "12"]
[Room "Open"]
[Declarer "S"]
[Contract "2S"]
[Deal "N:A98.J6.86543.KT5 543.Q753.972.943 KJT76.AK42.J.QJ8 Q2.T98.AKQT.A762"]

[Board "12"]
[Room "Closed"]
[Declarer "S"]
[Contract "4S"]
[Deal "N:A98.J6.86543.KT5 543.Q753.972.943 KJT76.AK42.J.QJ8 Q2.T98.AKQT.A762"]

[Board "13"]
[Room "Open"]
[Declarer "N"]
[Contract "3NT"]
[Deal "N:Q.AJ85.AJT7.AQ83 T9853.KT93.Q98.K AJ764.Q2.52.JT92 K2.764.K643.7654"]

[Board "14"]
[Room "Open"]
[Declarer "W"]
[Contract "4S"]
[Deal "N:J4.876.T87.98765 A.QT43.5432.QT42 T96.J2.AKQ96.AJ3 KQ87532.AK95.J.K"]

[Board "15"]
[Room "Open"]
[Declarer "W"]
[Contract "2S"]
[Deal "N:K4.9865.K5.AJ543 Q932.Q42.AT93.72 J76.K7.7642.KT98 AT85.AJT3.QJ8.Q6"]

[Board "15"]
[Room "Closed"]
[Declarer "W"]
[Contract "1NT"]
[Deal "N:K4.9865.K5.AJ543 Q932.Q42.AT93.72 J76.K7.7642.KT98 AT85.AJT3.QJ8.Q6"]

[Board "16"]
[Room "Open"]
[Declarer "W"]
[Contract "4SX"]
[Deal "N:.KQT9532.AKT5.T6 K986.6.QJ9763.Q3 QT432.AJ7.82.K95 AJ75.84.4.AJ8742"]

[Board "17"]
[Room "Closed"]
[Declarer "N"]
[Contract "3D"]
[Deal "N:AK.4.AKJ763.A864 Q4.QJ97.854.Q532 T9875.T852.Q92.J J632.AK63.T.KT97"]

[Board "17"]
[Room "Open"]
[Declarer "S"]
[Contract "4S"]
[Deal "N:AK.4.AKJ763.A864 Q4.QJ97.854.Q532 T9875.T852.Q92.J J632.AK63.T.KT97"]

[Board "18"]
[Room "Closed"]
[Declarer "E"]
[Contract "2S"]
[Deal "N:AT.J62.7632.AJ98 K9652.943.AKJT8. J874.AKQ7.Q5.T52 Q3.T85.94.KQ7643"]

[Board "19"]
[Room "Open"]
[Declarer "N"]
[Contract "1S"]
[Deal "N:AQ972.8752.K5.JT KT853.JT9..AQ874 64.A4.T87432.K96 J.KQ63.AQJ96.532"]

[Board "19"]
[Room "Closed"]
[Declarer "E"]
[Contract "5C"]
[Deal "N:AQ972.8752.K5.JT KT853.JT9..AQ874 64.A4.T87432.K96 J.KQ63.AQJ96.532"]

[Board "20"]
[Room "Open"]
[Declarer "E"]
[Contract "1H"]
[Deal "N:QJ2.84.98532.JT9 AKT5.AK973.AK.62 63.J62.QJT7.AKQ4 9874.QT5.64.8753"]

[Board "21"]
[Room "Closed"]
[Declarer "E"]
[Contract "4S"]
[Deal "N:.K6.Q763.AJT8643 QJ742.QT75.J95.Q 953.AJ43.T82.K52 AKT86.982.AK4.97"]

[Board "21"]
[Room "Open"]
[Declarer "N"]
[Contract "5CX"]
[Deal "N:.K6.Q763.AJT8643 QJ742.QT75.J95.Q 953.AJ43.T82.K52 AKT86.982.AK4.97"]

[Board "22"]
[Room "Closed"]
[Declarer "E"]
[Contract "4H"]
[Deal "N:KT93.542.QJ72.K5 AQ.QT86.AK6.AQ73 J654.K.985.JT982 872.AJ973.T43.64"]

[Board "22"]
[Room "Open"]
[Declarer "E"]
[Contract "3NT"]
[Deal "N:KT93.542.QJ72.K5 AQ.QT86.AK6.AQ73 J654.K.985.JT982 872.AJ973.T43.64"]

[Board "23"]
[Room "Closed"]
[Declarer "E"]
[Contract "3NT"]
[Deal "N:K952.AT8.9832.AJ AQT3.K3.AKJT75.4 874.964.64.K9532 J6.QJ752.Q.QT876"]

[Board "23"]
[Room "Open"]
[Declarer "W"]
[Contract "4H"]
[Deal "N:K952.AT8.9832.AJ AQT3.K3.AKJT75.4 874.964.64.K9532 J6.QJ752.Q.QT876"]

[Board "24"]
[Room "Closed"]
[Declarer "W"]
[Contract "4S"]
[Deal "N:53.JT5432.K4.QJ6 KQ76.Q.J876.K972 984.AK986.2.T854 AJT2.7.AQT953.A3"]

[Board "24"]
[Room "Open"]
[Declarer "N"]
[Contract "5HX"]
[Deal "N:53.JT5432.K4.QJ6 KQ76.Q.J876.K972 984.AK986.2.T854 AJT2.7.AQT953.A3"]

[Board "25"]
[Room "Closed"]
[Declarer "N"]
[Contract "7S"]
[Deal "N:JT87532.A4.AKJ.4 Q9.J93.9653.9653 AK64.Q6.T84.AKQJ .KT8752.Q72.T872"]

[Board "25"]
[Room "Open"]
[Declarer "N"]
[Contract "6S"]
[Deal "N:JT87532.A4.AKJ.4 Q9.J93.9653.9653 AK64.Q6.T84.AKQJ .KT8752.Q72.T872"]

[Board "26"]
[Room "Closed"]
[Declarer "E"]
[Contract "4S"]
[Deal "N:98.Q.AQ95.AK9765 AJ764.AK85.KJ43. T53.T974.T8.J843 KQ2.J632.762.QT2"]

[Board "26"]
[Room "Open"]
[Declarer "E"]
[Contract "4H"]
[Deal "N:98.Q.AQ95.AK9765 AJ764.AK85.KJ43. T53.T974.T8.J843 KQ2.J632.762.QT2"]

[Board "27"]
[Room "Closed"]
[Declarer "W"]
[Contract "3NT"]
[Deal "N:AJ7.KJT92.J2.A76 Q96.Q874.6.KJT32 KT54.A653.875.Q9 832..AKQT943.854"]

[Board "27"]
[Room "Open"]
[Declarer "W"]
[Contract "3D"]
[Deal "N:AJ7.KJT92.J2.A76 Q96.Q874.6.KJT32 KT54.A653.875.Q9 832..AKQT943.854"]

[Board "28"]
[Room "Closed"]
[Declarer "W"]
[Contract "1NT"]
[Deal "N:765.87.AQT84.A94 K2.AKJT5.K65.T82 QJT98.Q963.J.K75 A43.42.9732.QJ63"]

[Board "28"]
[Room "Open"]
[Declarer "S"]
[Contract "2S"]
[Deal "N:765.87.AQT84.A94 K2.AKJT5.K65.T82 QJT98.Q963.J.K75 A43.42.9732.QJ63"]

[Board "29"]
[Room "Closed"]
[Declarer "E"]
[Contract "1NT"]
[Deal "N:J86.JT93.AQ98.84 AKT75.864.42.KQ5 Q43.K5.KJT7.A732 92.AQ72.653.JT96"]

[Board "29"]
[Room "Open"]
[Declarer "W"]
[Contract "1NT"]
[Deal "N:J86.JT93.AQ98.84 AKT75.864.42.KQ5 Q43.K5.KJT7.A732 92.AQ72.653.JT96"]

[Board "30"]
[Room "Closed"]
[Declarer "E"]
[Contract "4H"]
[Deal "N:T.T73.QJ876.AT97 A76.AQJ962.3.KJ4 KJ52.K4.A952.532 Q9843.85.KT4.Q86"]

[Board "30"]
[Room "Open"]
[Declarer "E"]
[Contract "3H"]
[Deal "N:T.T73.QJ876.AT97 A76.AQJ962.3.KJ4 KJ52.K4.A952.532 Q9843.85.KT4.Q86"]

[Board "31"]
[Room "Closed"]
[Declarer "W"]
[Contract "1NT"]
[Deal "N:AT7.A9.J952.T953 J93.KJ72.AK6.QJ2 K852.QT643.QT.84 Q64.85.8743.AK76"]

[Board "31"]
[Room "Open"]
[Declarer "E"]
[Contract "3NT"]
[Deal "N:AT7.A9.J952.T953 J93.KJ72.AK6.QJ2 K852.QT643.QT.84 Q64.85.8743.AK76"]

[Board "32"]
[Room "Closed"]
[Declarer "N"]
[Contract "3NT"]
[Deal "N:AQT.AQ.92.AQJT87 J73.6543.QJT65.5 85.9872.K87.K964 K9642.KJT.A43.32"]`;
const PACK_HAINES = `[Board "1"]
[Room "Open"]
[Declarer "E"]
[Contract "5S"]
[Deal "N:96.KJ8632.8.JT52 KJT743..QJT953.9 A5.Q74.72.AQ8643 Q82.AT95.AK64.K7"]

[Board "1"]
[Room "Closed"]
[Declarer "S"]
[Contract "6CX"]
[Deal "N:96.KJ8632.8.JT52 KJT743..QJT953.9 A5.Q74.72.AQ8643 Q82.AT95.AK64.K7"]

[Board "2"]
[Room "Closed"]
[Declarer "N"]
[Contract "4C"]
[Deal "N:983.Q742.J.AKQ65 AK765.J3.A653.32 QT.AT85.K987.JT7 J42.K96.QT42.984"]

[Board "2"]
[Room "Open"]
[Declarer "N"]
[Contract "4H"]
[Deal "N:983.Q742.J.AKQ65 AK765.J3.A653.32 QT.AT85.K987.JT7 J42.K96.QT42.984"]

[Board "3"]
[Room "Closed"]
[Declarer "N"]
[Contract "5HX"]
[Deal "N:.KQJ632.KQJ87.62 AQ8542.AT8.T6.AK JT73.754.A32.Q85 K96.9.954.JT9743"]

[Board "3"]
[Room "Open"]
[Declarer "N"]
[Contract "6HX"]
[Deal "N:.KQJ632.KQJ87.62 AQ8542.AT8.T6.AK JT73.754.A32.Q85 K96.9.954.JT9743"]

[Board "4"]
[Room "Closed"]
[Declarer "N"]
[Contract "4S"]
[Deal "N:AQT4.A96.AQ984.8 K32.K832.J532.Q2 J865.QJ7.K6.KT53 97.T54.T7.AJ9764"]

[Board "4"]
[Room "Open"]
[Declarer "S"]
[Contract "4S"]
[Deal "N:AQT4.A96.AQ984.8 K32.K832.J532.Q2 J865.QJ7.K6.KT53 97.T54.T7.AJ9764"]

[Board "5"]
[Room "Closed"]
[Declarer "N"]
[Contract "4S"]
[Deal "N:AQ76.653.QJ94.Q5 42.QJ42.A.K87642 KJT8.AK98.T8.AJ9 953.T7.K76532.T3"]

[Board "5"]
[Room "Open"]
[Declarer "S"]
[Contract "4S"]
[Deal "N:AQ76.653.QJ94.Q5 42.QJ42.A.K87642 KJT8.AK98.T8.AJ9 953.T7.K76532.T3"]

[Board "6"]
[Room "Closed"]
[Declarer "S"]
[Contract "3NT"]
[Deal "N:AJT5.A4.Q87.KT65 K632.Q.J6543.QJ8 74.KJ62.KT92.A94 Q98.T98753.A.732"]

[Board "7"]
[Room "Closed"]
[Declarer "N"]
[Contract "3NT"]
[Deal "N:Q9.K432.T9732.J3 72.85.AJ54.AKT84 AK.AJT6.KQ86.752 JT86543.Q97..Q96"]

[Board "7"]
[Room "Open"]
[Declarer "S"]
[Contract "1NT"]
[Deal "N:Q9.K432.T9732.J3 72.85.AJ54.AKT84 AK.AJT6.KQ86.752 JT86543.Q97..Q96"]

[Board "8"]
[Room "Closed"]
[Declarer "W"]
[Contract "4S"]
[Deal "N:976.743.AK95.Q75 KJ32.952.T872.A2 T5.J86.Q63.J9863 AQ84.AKQT.J4.KT4"]

[Board "8"]
[Room "Open"]
[Declarer "E"]
[Contract "4S"]
[Deal "N:976.743.AK95.Q75 KJ32.952.T872.A2 T5.J86.Q63.J9863 AQ84.AKQT.J4.KT4"]

[Board "9"]
[Room "Closed"]
[Declarer "W"]
[Contract "4C"]
[Deal "N:Q9763.K8765.A8.3 .J943.QJT32.AJ98 AKT84.T2.965.Q54 J52.AQ.K74.KT762"]

[Board "9"]
[Room "Open"]
[Declarer "N"]
[Contract "4S"]
[Deal "N:Q9763.K8765.A8.3 .J943.QJT32.AJ98 AKT84.T2.965.Q54 J52.AQ.K74.KT762"]

[Board "10"]
[Room "Closed"]
[Declarer "W"]
[Contract "3NT"]
[Deal "N:J943.KT96.T973.7 AK85.J74.K6.Q532 762.Q52.QJ84.KJ9 QT.A83.A52.AT864"]

[Board "10"]
[Room "Open"]
[Declarer "E"]
[Contract "3NT"]
[Deal "N:J943.KT96.T973.7 AK85.J74.K6.Q532 762.Q52.QJ84.KJ9 QT.A83.A52.AT864"]

[Board "11"]
[Room "Closed"]
[Declarer "S"]
[Contract "6NT"]
[Deal "N:Q5.K53.AT.AQJT74 JT8.9764.QJ963.8 AK972.AQT8.K4.K5 643.J2.8752.9632"]

[Board "12"]
[Room "Closed"]
[Declarer "S"]
[Contract "6CX"]
[Deal "N:92.98762.J.J9872 865.J54.6432.T54 AJT43..QT9.AKQ63 KQ7.AKQT3.AK875."]

[Board "12"]
[Room "Open"]
[Declarer "W"]
[Contract "4HX"]
[Deal "N:92.98762.J.J9872 865.J54.6432.T54 AJT43..QT9.AKQ63 KQ7.AKQT3.AK875."]

[Board "13"]
[Room "Closed"]
[Declarer "N"]
[Contract "3NT"]
[Deal "N:QJ.J986.A85.KQT5 K9865.K72.96.986 T742.AQT.KT4.AJ2 A3.543.QJ732.743"]

[Board "14"]
[Room "Closed"]
[Declarer "E"]
[Contract "1NT"]
[Deal "N:KT32.83.Q62.KT63 986.KJ5.J98.Q975 74.AQ976.KT43.J8 AQJ5.T42.A75.A42"]

[Board "14"]
[Room "Open"]
[Declarer "S"]
[Contract "2H"]
[Deal "N:KT32.83.Q62.KT63 986.KJ5.J98.Q975 74.AQ976.KT43.J8 AQJ5.T42.A75.A42"]

[Board "15"]
[Room "Closed"]
[Declarer "W"]
[Contract "4S"]
[Deal "N:A432.J82.74.Q965 KJ9.A.AQ9653.KJ3 8.QT654.KJ82.A74 QT765.K973.T.T82"]

[Board "16"]
[Room "Closed"]
[Declarer "N"]
[Contract "3D"]
[Deal "N:A87.9.KJT975.K97 .KJ65.AQ632.AQ54 QJT6.T8742..JT86 K95432.AQ3.84.32"]

[Board "16"]
[Room "Open"]
[Declarer "E"]
[Contract "3NT"]
[Deal "N:A87.9.KJT975.K97 .KJ65.AQ632.AQ54 QJT6.T8742..JT86 K95432.AQ3.84.32"]

[Board "17"]
[Room "Closed"]
[Declarer "W"]
[Contract "3H"]
[Deal "N:T53.J92.843.KQ75 J42.KQT73.QJ9.T9 AQ97..AT762.A843 K86.A8654.K5.J62"]

[Board "17"]
[Room "Open"]
[Declarer "N"]
[Contract "4C"]
[Deal "N:T53.J92.843.KQ75 J42.KQT73.QJ9.T9 AQ97..AT762.A843 K86.A8654.K5.J62"]

[Board "18"]
[Room "Closed"]
[Declarer "S"]
[Contract "4H"]
[Deal "N:AT6.Q86.AT4.QT65 KJ952.K3.QJ92.43 87.AJ752.K7.AKJ2 Q43.T94.8653.987"]

[Board "18"]
[Room "Open"]
[Declarer "N"]
[Contract "3NT"]
[Deal "N:AT6.Q86.AT4.QT65 KJ952.K3.QJ92.43 87.AJ752.K7.AKJ2 Q43.T94.8653.987"]

[Board "19"]
[Room "Closed"]
[Declarer "E"]
[Contract "3NT"]
[Deal "N:KT52.AJ43.T93.52 A7.K82.AQ76.KT76 QJ964.T95.K52.94 83.Q76.J84.AQJ83"]

[Board "20"]
[Room "Closed"]
[Declarer "E"]
[Contract "3S"]
[Deal "N:T532.AT4.J8.QJ96 KQ976.Q5.K632.T2 8.KJ93.Q974.A754 AJ4.8762.AT5.K83"]

[Board "20"]
[Room "Open"]
[Declarer "E"]
[Contract "2S"]
[Deal "N:T532.AT4.J8.QJ96 KQ976.Q5.K632.T2 8.KJ93.Q974.A754 AJ4.8762.AT5.K83"]

[Board "21"]
[Room "Open"]
[Declarer "N"]
[Contract "3NT"]
[Deal "N:.AK654.Q8632.Q72 T2.9872.AJ9.AK53 AKQ93.J.K54.9864 J87654.QT3.T7.JT"]

[Board "22"]
[Room "Open"]
[Declarer "E"]
[Contract "4H"]
[Deal "N:8764.Q94.AK74.A4 5.AK732.J832.Q76 KQ93.J.QT9.J9532 AJT2.T865.65.KT8"]

[Board "22"]
[Room "Closed"]
[Declarer "E"]
[Contract "3H"]
[Deal "N:8764.Q94.AK74.A4 5.AK732.J832.Q76 KQ93.J.QT9.J9532 AJT2.T865.65.KT8"]

[Board "23"]
[Room "Open"]
[Declarer "S"]
[Contract "1NT"]
[Deal "N:K5.Q873.98763.52 T9763.AT2.K5.JT9 Q84.KJ64.A42.KQ6 AJ2.95.QJT.A8743"]

[Board "24"]
[Room "Open"]
[Declarer "E"]
[Contract "3H"]
[Deal "N:T742..T84.JT9872 AK653.6532.73.K5 9.AQJ.AK965.AQ64 QJ8.KT9874.QJ2.3"]

[Board "24"]
[Room "Closed"]
[Declarer "N"]
[Contract "6C"]
[Deal "N:T742..T84.JT9872 AK653.6532.73.K5 9.AQJ.AK965.AQ64 QJ8.KT9874.QJ2.3"]`;
const BUNDLED_PACKS = [
  { key: "plumley", name: { es: "Plumley vs Norman (RealBridge, jul 2025)", en: "Plumley vs Norman (RealBridge, Jul 2025)" }, pbn: PACK_PLUMLEY },
  { key: "haines", name: { es: "Haines vs Pryor (RealBridge, jul 2025)", en: "Haines vs Pryor (RealBridge, Jul 2025)" }, pbn: PACK_HAINES },
  { key: "bigdeal", name: { es: "Big Deal · repartidor oficial EBL/WBF", en: "Big Deal · official EBL/WBF dealer" }, pbn: PACK_BIGDEAL },
];
const BUNDLED_PARSED = BUNDLED_PACKS.map(p => ({ key: p.key, name: p.name, deals: parsePBN(p.pbn) }));

function packDealLabel(e, i, lang) {
  const bd = e.board ? `#${e.board}` : `#${i + 1}`;
  const rm = e.room ? ` ${e.room[0]}` : "";
  return `${bd}${rm} · ${e.contract.level}${bidLabel(e.contract.strain, lang)}`;
}

// Build classic-tab sources: imported PBN, technique positions, bundled real packs, generated catalog.
function classicSources(lang, imported) {
  const tech = BUILTIN_DEALS.map((e, i) => ({
    id: `tech-${i}`,
    label: (BUILTIN_LABELS[e.label] ? BUILTIN_LABELS[e.label][lang] : e.label) + ` · ${e.contract.level}${bidLabel(e.contract.strain, lang)}`,
    deal: dealFromPBN(e, i),
  }));
  const imp = (imported || []).map((e, i) => ({
    id: `pbn-${i}`,
    label: (e.label || `PBN #${i + 1}`) + ` · ${e.contract.level}${bidLabel(e.contract.strain, lang)}`,
    deal: { seed: 900000 + i, hands: e.hands, contract: e.contract },
  }));
  const packs = BUNDLED_PARSED.map(p => ({
    key: p.key, label: p.name[lang],
    items: p.deals.map((e, i) => ({
      id: `pack-${p.key}-${i}`,
      label: packDealLabel(e, i, lang),
      deal: { seed: 700000 + i, hands: e.hands, contract: e.contract },
    })),
  }));
  const gen = libDeals("classic", 0, 360, lang);
  const sources = [];
  if (imp.length) sources.push({ key: "imported", label: T[lang].imported, items: imp });
  sources.push({ key: "tech", label: T[lang].builtinTech, items: tech });
  for (const p of packs) sources.push(p);
  sources.push({ key: "generated", label: T[lang].generated, items: gen });
  return sources;
}



const _mem = {};
const store = {
  async get(k) {
    try { if (typeof window !== "undefined" && window.storage) { const r = await window.storage.get(k); return r ? JSON.parse(r.value) : null; } } catch (e) { }
    return _mem[k] !== undefined ? _mem[k] : null;
  },
  async set(k, v) {
    _mem[k] = v;
    try { if (typeof window !== "undefined" && window.storage) await window.storage.set(k, JSON.stringify(v)); } catch (e) { }
  },
};

// ============================================================
//  UI STRINGS
// ============================================================
const T = {
  es: {
    app: "Bridge Maestro", tag: "Aprende bridge · Mayores Quintos",
    chooseProfile: "Elige un jugador", newProfile: "Nuevo jugador", name: "Nombre",
    create: "Crear", cancel: "Cancelar", upTo: "Hasta 10 jugadores",
    expertise: "Nivel de experiencia", beg: "Principiante", inter: "Intermedio", adv: "Avanzado",
    dashboard: "Inicio", levels: "Niveles", library: "Biblioteca", bidTrainer: "Subasta", playTrainer: "Carteo",
    progress: "Progreso", completed: "Completadas", reviewed: "Repasadas", total: "Total",
    overall: "Progreso global", lessons: "Lecciones", quiz: "Quiz", flashcards: "Flashcards",
    cheatsheet: "Chuleta", schema: "Esquema", practiceBid: "Práctica subasta", practicePlay: "Práctica carteo",
    learnDeals: "Partidas de aprendizaje", classicDeals: "Partidas clásicas",
    start: "Empezar", next: "Siguiente", prev: "Anterior", back: "Volver",
    markDone: "Marcar completada", reviewIt: "Marcar repasada", doneTag: "Completada", revTag: "Repasada",
    why: "Por qué", hint: "Pista", insight: "Insights", showIns: "Ver insights", hideIns: "Ocultar insights",
    yourHand: "Tu mano", dealer: "Eres mano (de salida)", pOpened: "Compañero abrió", rhoOpened: "El rival (derecha) abrió",
    yourBid: "Tu declaración", recommended: "Recomendado", contract: "Contrato", declarer: "Declarante",
    needed: "Bazas necesarias", tricksWon: "Bazas ganadas", made: "¡Contrato cumplido!", down: "Contrato caído",
    newDeal: "Nueva partida", dummy: "Muerto", you: "Tú (Sur)", N: "Norte", S: "Sur", E: "Este", W: "Oeste",
    play: "Jugar", replay: "Repetir", finish: "Terminar", sessionScore: "Aciertos",
    flip: "Girar", correct: "¡Correcto!", incorrect: "No es la mejor", continue: "Continuar",
    pickLevel: "Elige nivel", classicsTitle: "Partidas históricas y clásicas", learnTitle: "Partidas para aprender",
    yourTurn: "Tu turno", waiting: "Pensando…", leadNow: "Sal de salida",
    trumpsOut: "Triunfos rivales aprox.", noTrump: "Sin triunfo", switchUser: "Cambiar jugador",
    questionsLeft: "Restantes", deal: "Reparto", openContract: "Contrato propuesto",
    insightIntro: "Lo que se puede interpretar:", noContent: "Selecciona una sección.",
    quizDone: "Quiz terminado", retry: "Reintentar", ofItems: "ítems",
    points: "PH", balanced: "equilibrada", playForMe: "Auto-defensa", autoplay: "Los rivales juegan solos.",
    selectCard: "Toca una carta de tu mano o del muerto.", trickN: "Baza",
    delUser: "Borrar", confirmDel: "¿Borrar este jugador?",
    term: "Concepto", definition: "Respuesta",
    importTitle: "Importar partidas reales (PBN)", importHint: "Pega texto PBN o carga un archivo .pbn de un archivo real (Deal Archive, BBO, etc.).",
    importBtn: "Importar", loadFile: "Cargar .pbn", pasteHere: "Pega aquí el PBN…",
    imported: "Importadas (PBN)", builtinTech: "Posiciones de técnica", generated: "Generadas (estilo clásico)",
    pbnNone: "No se encontraron partidas válidas (52 cartas) en el texto.", clearImported: "Borrar importadas",
  },
  en: {
    app: "Bridge Maestro", tag: "Learn bridge · 5-Card Majors",
    chooseProfile: "Choose a player", newProfile: "New player", name: "Name",
    create: "Create", cancel: "Cancel", upTo: "Up to 10 players",
    expertise: "Experience level", beg: "Beginner", inter: "Intermediate", adv: "Advanced",
    dashboard: "Home", levels: "Levels", library: "Library", bidTrainer: "Bidding", playTrainer: "Play",
    progress: "Progress", completed: "Completed", reviewed: "Reviewed", total: "Total",
    overall: "Overall progress", lessons: "Lessons", quiz: "Quiz", flashcards: "Flashcards",
    cheatsheet: "Cheat sheet", schema: "Schema", practiceBid: "Bidding practice", practicePlay: "Play practice",
    learnDeals: "Learning deals", classicDeals: "Classic deals",
    start: "Start", next: "Next", prev: "Previous", back: "Back",
    markDone: "Mark completed", reviewIt: "Mark reviewed", doneTag: "Completed", revTag: "Reviewed",
    why: "Why", hint: "Hint", insight: "Insights", showIns: "Show insights", hideIns: "Hide insights",
    yourHand: "Your hand", dealer: "You are on lead (dealer)", pOpened: "Partner opened", rhoOpened: "RHO opened",
    yourBid: "Your bid", recommended: "Recommended", contract: "Contract", declarer: "Declarer",
    needed: "Tricks needed", tricksWon: "Tricks won", made: "Contract made!", down: "Contract went down",
    newDeal: "New deal", dummy: "Dummy", you: "You (South)", N: "North", S: "South", E: "East", W: "West",
    play: "Play", replay: "Replay", finish: "Finish", sessionScore: "Correct",
    flip: "Flip", correct: "Correct!", incorrect: "Not the best", continue: "Continue",
    pickLevel: "Pick a level", classicsTitle: "Historical & classic deals", learnTitle: "Learning deals",
    yourTurn: "Your turn", waiting: "Thinking…", leadNow: "Make the opening lead",
    trumpsOut: "Enemy trumps approx.", noTrump: "Notrump", switchUser: "Switch player",
    questionsLeft: "Remaining", deal: "Deal", openContract: "Proposed contract",
    insightIntro: "What can be read here:", noContent: "Pick a section.",
    quizDone: "Quiz complete", retry: "Retry", ofItems: "items",
    points: "HCP", balanced: "balanced", playForMe: "Auto-defense", autoplay: "Opponents play themselves.",
    selectCard: "Tap a card from your hand or dummy.", trickN: "Trick",
    delUser: "Delete", confirmDel: "Delete this player?",
    term: "Concept", definition: "Answer",
    importTitle: "Import real deals (PBN)", importHint: "Paste PBN text or load a .pbn file from a real archive (Deal Archive, BBO, etc.).",
    importBtn: "Import", loadFile: "Load .pbn", pasteHere: "Paste PBN here…",
    imported: "Imported (PBN)", builtinTech: "Technique positions", generated: "Generated (classic style)",
    pbnNone: "No valid (52-card) deals found in the text.", clearImported: "Clear imported",
  },
};

const AVATARS = ["#c9a227", "#b3261e", "#2d6a4f", "#3a6ea5", "#8e44ad", "#d35400", "#16a085", "#c0392b", "#2c3e50", "#7f8c8d"];

// ============================================================
//  SMALL VISUAL COMPONENTS
// ============================================================
function Suit({ s, size = 16 }) {
  return <span style={{ color: SUIT_RED.has(s) ? C.red : C.ink, fontSize: size, lineHeight: 1 }}>{s}</span>;
}
function PlayingCard({ card, onClick, dim, small, hidden }) {
  const w = small ? 36 : 48, h = small ? 50 : 66;
  if (hidden) {
    return <div style={{ width: w, height: h, borderRadius: 5, background: "linear-gradient(135deg,#244,#0d2a20)", border: `1px solid ${C.brassDim}` }} className="flex items-center justify-center">
      <div style={{ width: w - 12, height: h - 14, border: `1px solid ${C.brass}`, borderRadius: 3, opacity: .5 }} /></div>;
  }
  const red = SUIT_RED.has(card.s);
  return (
    <button onClick={onClick} disabled={!onClick}
      style={{ width: w, height: h, background: dim ? "#d8d2c0" : C.ivory, color: red ? C.red : C.ink, borderRadius: 6, border: `1px solid ${onClick ? C.brass : "#bdb38f"}`, boxShadow: onClick ? "0 2px 5px rgba(0,0,0,.35)" : "0 1px 2px rgba(0,0,0,.25)", opacity: dim ? .55 : 1, cursor: onClick ? "pointer" : "default" }}
      className="flex flex-col items-center justify-center font-semibold leading-none transition-transform hover:-translate-y-1">
      <span style={{ fontSize: small ? 16 : 20 }}>{card.r}</span>
      <span style={{ fontSize: small ? 17 : 22 }}>{card.s}</span>
    </button>
  );
}
function HandSuitRows({ cards, small }) {
  const m = bySuit(cards);
  return (
    <div className="flex flex-col gap-1">
      {SUITS.map(s => (
        <div key={s} className="flex items-center gap-1">
          <span style={{ width: 16, color: SUIT_RED.has(s) ? C.red : C.ivory, fontSize: 14 }}>{s}</span>
          <span style={{ color: C.ivory, fontSize: small ? 13 : 15, letterSpacing: 1 }} className="font-mono">
            {m[s].length ? m[s].map(c => c.r).join(" ") : "—"}
          </span>
        </div>
      ))}
    </div>
  );
}
function ProgressBar({ done, reviewed, total }) {
  const d = total ? (done / total) * 100 : 0;
  const r = total ? (reviewed / total) * 100 : 0;
  return (
    <div style={{ background: C.line2, borderRadius: 999, height: 9, overflow: "hidden" }} className="w-full relative">
      <div style={{ width: `${d}%`, background: C.brass, height: "100%" }} />
      <div style={{ width: `${r}%`, background: C.win, height: 3, position: "absolute", bottom: 0, left: 0, opacity: .9 }} />
    </div>
  );
}
function Pill({ children, bg, color }) {
  return <span style={{ background: bg || C.line2, color: color || C.soft }} className="text-xs px-2 py-0.5 rounded-full whitespace-nowrap">{children}</span>;
}
function SectionTitle({ children, icon: Icon }) {
  return <div className="flex items-center gap-2 mb-3">{Icon && <Icon size={18} style={{ color: C.brass }} />}<h2 style={{ color: C.ivory }} className="text-lg font-serif tracking-wide">{children}</h2></div>;
}

// Bidding box
const BID_STRAINS = ["♣", "♦", "♥", "♠", "NT"];
function BiddingBox({ onBid, disabled }) {
  return (
    <div className="flex flex-col gap-1.5 items-center">
      {[1, 2, 3, 4, 5, 6, 7].map(lv => (
        <div key={lv} className="flex gap-1.5">
          {BID_STRAINS.map(st => {
            const bid = `${lv}${st}`;
            const red = SUIT_RED.has(st);
            return (
              <button key={st} disabled={disabled} onClick={() => onBid(bid)}
                style={{ width: 36, height: 28, background: C.ivory, color: st === "NT" ? C.ink : (red ? C.red : C.ink), border: `1px solid ${C.brass}`, borderRadius: 4, opacity: disabled ? .5 : 1 }}
                className="text-sm font-semibold flex items-center justify-center hover:-translate-y-0.5 transition-transform">
                {lv}{st === "NT" ? "ST" : st}
              </button>
            );
          })}
        </div>
      ))}
      <div className="flex gap-1.5 mt-1">
        {[["Pass", "Pass"], ["X", "X"], ["XX", "XX"]].map(([v, lbl]) => (
          <button key={v} disabled={disabled} onClick={() => onBid(v)}
            style={{ background: v === "Pass" ? C.feltLite : v === "X" ? C.red : C.brassDim, color: C.ivory, opacity: disabled ? .5 : 1 }}
            className="px-4 py-1.5 rounded text-sm font-semibold">{lbl}</button>
        ))}
      </div>
    </div>
  );
}

function bidLabel(bid, lang) {
  if (!bid) return "";
  if (lang === "es") return bid.replace("NT", "ST").replace("Pass", "Paso").replace(/^X$/, "Doblo").replace(/^XX$/, "Redoblo");
  return bid;
}

// ---------- Lessons ----------
function renderInline(text, kc) {
  // split on **bold**
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((seg, i) => i % 2 === 1
    ? <b key={kc + "-" + i} style={{ color: C.brass }}>{seg}</b>
    : <span key={kc + "-" + i}>{seg}</span>);
}
function RichText({ text }) {
  const blocks = (text || "").split("\n\n");
  return (
    <div className="flex flex-col gap-3">
      {blocks.map((blk, bi) => {
        const lines = blk.split("\n");
        // bullet group
        if (lines.every(l => l.trim().startsWith("• "))) {
          return (
            <ul key={bi} className="flex flex-col gap-1.5">
              {lines.map((l, li) => (
                <li key={li} className="flex gap-2" style={{ color: C.ivory }}>
                  <span style={{ color: C.brass }}>•</span>
                  <span className="leading-relaxed text-[15px]">{renderInline(l.trim().slice(2), bi + "-" + li)}</span>
                </li>
              ))}
            </ul>
          );
        }
        // subhead
        if (lines.length === 1 && lines[0].startsWith("› ")) {
          return <h4 key={bi} style={{ color: C.brass }} className="font-serif text-[15px] mt-1">{lines[0].slice(2)}</h4>;
        }
        return <p key={bi} style={{ color: C.ivory }} className="leading-relaxed text-[15px]">{renderInline(blk, "p" + bi)}</p>;
      })}
    </div>
  );
}
function LessonView({ level, lang, status, onMark }) {
  const [i, setI] = useState(0);
  const lesson = level.lessons[i];
  const st = status?.lessons?.[lesson.id];
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <SectionTitle icon={BookOpen}>{T[lang].lessons}</SectionTitle>
        <Pill bg={C.line2}>{i + 1} / {level.lessons.length}</Pill>
      </div>
      <div style={{ background: C.feltDark, border: `1px solid ${C.line}`, borderRadius: 12 }} className="p-5">
        <h3 style={{ color: C.brass }} className="text-lg font-serif mb-3">{lesson.t[lang]}</h3>
        <RichText text={lesson.body[lang]} />
        <div className="flex items-center gap-2 mt-5 flex-wrap">
          <button onClick={() => onMark(lesson.id, st ? "reviewed" : "done")}
            style={{ background: st === "done" ? C.win : st === "reviewed" ? C.brass : C.feltLite, color: C.ivory }}
            className="px-3 py-1.5 rounded text-sm font-semibold flex items-center gap-1">
            <Check size={15} /> {st ? T[lang].reviewIt : T[lang].markDone}
          </button>
          {st && <Pill bg={st === "reviewed" ? C.brass : C.win} color={C.ink}>{st === "reviewed" ? T[lang].revTag : T[lang].doneTag}</Pill>}
        </div>
      </div>
      <div className="flex justify-between mt-4">
        <button disabled={i === 0} onClick={() => setI(i - 1)} style={{ color: C.soft, opacity: i === 0 ? .4 : 1 }} className="flex items-center gap-1 text-sm"><ChevronLeft size={16} />{T[lang].prev}</button>
        <button disabled={i === level.lessons.length - 1} onClick={() => setI(i + 1)} style={{ color: C.brass, opacity: i === level.lessons.length - 1 ? .4 : 1 }} className="flex items-center gap-1 text-sm font-semibold">{T[lang].next}<ChevronRight size={16} /></button>
      </div>
    </div>
  );
}

// ---------- Quiz ----------
function QuizView({ level, lang, status, onMark }) {
  const [i, setI] = useState(0);
  const [sel, setSel] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const q = level.quiz[i];
  const optText = (o) => typeof o === "string" ? o : o[lang];
  function answer(idx) {
    if (sel !== null) return;
    setSel(idx);
    if (idx === q.a) setScore(s => s + 1);
  }
  function nextQ() {
    if (i + 1 >= level.quiz.length) { setDone(true); onMark(score, level.quiz.length); }
    else { setI(i + 1); setSel(null); }
  }
  if (done) {
    const pct = Math.round((score / level.quiz.length) * 100);
    return (
      <div style={{ background: C.feltDark, border: `1px solid ${C.line}`, borderRadius: 12 }} className="p-6 text-center">
        <Trophy size={40} style={{ color: C.brass }} className="mx-auto mb-2" />
        <h3 style={{ color: C.ivory }} className="text-xl font-serif">{T[lang].quizDone}</h3>
        <p style={{ color: C.brass }} className="text-3xl font-bold my-2">{score} / {level.quiz.length}</p>
        <p style={{ color: C.soft }} className="text-sm mb-4">{pct}%</p>
        <button onClick={() => { setI(0); setSel(null); setScore(0); setDone(false); }} style={{ background: C.feltLite, color: C.ivory }} className="px-4 py-2 rounded text-sm font-semibold flex items-center gap-1 mx-auto"><RotateCcw size={15} />{T[lang].retry}</button>
      </div>
    );
  }
  return (
    <div>
      <div className="flex items-center justify-between mb-3"><SectionTitle icon={Brain}>{T[lang].quiz}</SectionTitle><Pill bg={C.line2}>{i + 1} / {level.quiz.length}</Pill></div>
      <div style={{ background: C.feltDark, border: `1px solid ${C.line}`, borderRadius: 12 }} className="p-5">
        <p style={{ color: C.ivory }} className="text-[15px] mb-4 font-medium">{q.q[lang]}</p>
        <div className="flex flex-col gap-2">
          {q.opts.map((o, idx) => {
            const isA = idx === q.a, picked = sel === idx;
            let bg = C.feltLite, bd = C.line;
            if (sel !== null) { if (isA) { bg = C.win; bd = C.win; } else if (picked) { bg = C.red; bd = C.red; } else { bg = C.feltDark; } }
            return <button key={idx} onClick={() => answer(idx)} style={{ background: bg, border: `1px solid ${bd}`, color: C.ivory }} className="text-left px-3 py-2 rounded text-sm">{optText(o)}</button>;
          })}
        </div>
        {sel !== null && <button onClick={nextQ} style={{ background: C.brass, color: C.ink }} className="mt-4 px-4 py-2 rounded text-sm font-bold flex items-center gap-1">{T[lang].next}<ChevronRight size={16} /></button>}
      </div>
    </div>
  );
}

// ---------- Flashcards ----------
function Flashcards({ level, lang, onSeen }) {
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = level.flash[i];
  useEffect(() => { if (i === level.flash.length - 1 && flipped) onSeen(); }, [i, flipped]);
  return (
    <div>
      <div className="flex items-center justify-between mb-3"><SectionTitle icon={Layers}>{T[lang].flashcards}</SectionTitle><Pill bg={C.line2}>{i + 1} / {level.flash.length}</Pill></div>
      <button onClick={() => setFlipped(f => !f)} style={{ background: flipped ? C.brass : C.feltDark, border: `1px solid ${C.brass}`, borderRadius: 14, minHeight: 150, color: flipped ? C.ink : C.ivory }} className="w-full p-6 flex flex-col items-center justify-center transition-colors">
        <span style={{ color: flipped ? C.brassDim : C.soft }} className="text-xs uppercase tracking-widest mb-2">{flipped ? T[lang].definition || "Def" : T[lang].term || "Term"}</span>
        <span className="text-xl font-serif text-center">{flipped ? card.b[lang] : card.f[lang]}</span>
        <span style={{ color: flipped ? C.brassDim : C.soft }} className="text-xs mt-3 flex items-center gap-1"><RotateCcw size={12} />{T[lang].flip}</span>
      </button>
      <div className="flex justify-between mt-4">
        <button disabled={i === 0} onClick={() => { setI(i - 1); setFlipped(false); }} style={{ color: C.soft, opacity: i === 0 ? .4 : 1 }} className="flex items-center gap-1 text-sm"><ChevronLeft size={16} />{T[lang].prev}</button>
        <button disabled={i === level.flash.length - 1} onClick={() => { setI(i + 1); setFlipped(false); }} style={{ color: C.brass, opacity: i === level.flash.length - 1 ? .4 : 1 }} className="flex items-center gap-1 text-sm font-semibold">{T[lang].next}<ChevronRight size={16} /></button>
      </div>
    </div>
  );
}

// ---------- Cheatsheet + Schema ----------
function CheatSheet({ level, lang }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <SectionTitle icon={FileText}>{level.cheat.title[lang]}</SectionTitle>
        <div style={{ background: C.feltDark, border: `1px solid ${C.line}`, borderRadius: 12 }} className="p-4 flex flex-col gap-2">
          {level.cheat.rows.map((r, i) => (
            <div key={i} className="flex items-start gap-2">
              <span style={{ color: C.brass }} className="font-mono text-xs mt-0.5">{String(i + 1).padStart(2, "0")}</span>
              <span style={{ color: C.ivory }} className="text-sm">{r[lang]}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <SectionTitle icon={Target}>{T[lang].schema}</SectionTitle>
        <div className="flex flex-col gap-2">
          {level.schema.map((s, i) => (
            <div key={i} style={{ background: C.feltLite, border: `1px solid ${C.brassDim}`, borderRadius: 10 }} className="px-4 py-3">
              <span style={{ color: C.ivory }} className="text-sm">{s[lang]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------- Bidding practice ----------
function makeScenario(levelId, lang) {
  const types = levelId <= 1 ? ["opening", "opening", "opening"]
    : levelId === 2 ? ["opening", "respMajor", "respNT"]
      : levelId === 3 ? ["opening", "overcall", "respNT"]
        : ["opening", "respMajor", "respNT", "overcall"];
  const type = types[Math.floor(Math.random() * types.length)];
  let hand, ctx = { type }, rec;
  for (let tries = 0; tries < 300; tries++) {
    const hands = dealHands();
    hand = sortHand(hands.S);
    const h = hcp(hand);
    if (type === "opening") { rec = evalOpening(hand, lang); ctx.text = T[lang].dealer; break; }
    if (type === "respMajor") { const M = Math.random() < 0.5 ? "♥" : "♠"; if (h < 4) continue; rec = evalRespMajor(hand, M, lang); ctx.text = `${T[lang].pOpened} 1${M}`; ctx.open = M; break; }
    if (type === "respNT") { if (h < 5) continue; rec = evalRespNT(hand, lang); ctx.text = `${T[lang].pOpened} 1${lang === "es" ? "ST" : "NT"}`; break; }
    if (type === "overcall") { const ss = ["♠", "♥", "♦", "♣"]; const r = ss[Math.floor(Math.random() * 4)]; if (lengths(hand)[r] >= 6) continue; rec = evalOvercall(hand, r, lang); ctx.text = `${T[lang].rhoOpened} 1${r}`; ctx.rho = r; break; }
  }
  if (!rec) { hand = sortHand(dealHands().S); rec = evalOpening(hand, lang); ctx = { type: "opening", text: T[lang].dealer }; }
  return { hand, ctx, rec };
}
function BiddingPractice({ levelId, lang, onComplete }) {
  const [sc, setSc] = useState(() => makeScenario(levelId, lang));
  const [chosen, setChosen] = useState(null);
  const [showIns, setShowIns] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [count, setCount] = useState(0);
  const [correct, setCorrect] = useState(0);
  const answered = chosen !== null;
  const ok = answered && (chosen === sc.rec.bid || (sc.rec.alts || []).includes(chosen));
  function pick(bid) {
    if (answered) return;
    setChosen(bid);
    const good = bid === sc.rec.bid || (sc.rec.alts || []).includes(bid);
    setCount(c => c + 1); if (good) setCorrect(x => x + 1);
  }
  function next() {
    const newCount = count;
    if (newCount >= 10) { onComplete && onComplete(); }
    setSc(makeScenario(levelId, lang)); setChosen(null); setShowIns(false); setShowHint(false);
  }
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <SectionTitle icon={Sparkles}>{T[lang].practiceBid}</SectionTitle>
        <Pill bg={C.line2}>{T[lang].sessionScore}: {correct}/{count}</Pill>
      </div>
      <div style={{ background: C.felt, border: `1px solid ${C.line}`, borderRadius: 12 }} className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span style={{ color: C.brass }} className="text-sm font-semibold">{sc.ctx.text}</span>
          <Pill bg={C.line2}>{hcp(sc.hand)} {T[lang].points}</Pill>
        </div>
        <div style={{ background: C.feltDark, borderRadius: 10 }} className="p-3 mb-3"><HandSuitRows cards={sc.hand} /></div>

        {!answered ? (
          <div>
            <p style={{ color: C.soft }} className="text-xs mb-2 text-center">{T[lang].yourBid}:</p>
            <BiddingBox onBid={pick} />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div style={{ background: ok ? C.win : C.red, color: C.ivory, borderRadius: 10 }} className="p-3 text-center">
              <div className="font-bold">{ok ? T[lang].correct : T[lang].incorrect}</div>
              <div className="text-sm mt-1">{T[lang].yourBid}: <b>{bidLabel(chosen, lang)}</b> · {T[lang].recommended}: <b>{bidLabel(sc.rec.bid, lang)}</b>{sc.rec.alts && sc.rec.alts.length ? ` / ${sc.rec.alts.map(a => bidLabel(a, lang)).join(", ")}` : ""}</div>
            </div>
            <div style={{ background: C.feltDark, border: `1px solid ${C.line}`, borderRadius: 10 }} className="p-3">
              <div style={{ color: C.brass }} className="text-xs font-bold uppercase tracking-wide mb-1">{T[lang].why}</div>
              <p style={{ color: C.ivory }} className="text-sm">{sc.rec.why}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setShowIns(s => !s)} style={{ background: C.feltLite, color: C.ivory }} className="px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1">{showIns ? <EyeOff size={14} /> : <Eye size={14} />}{showIns ? T[lang].hideIns : T[lang].showIns}</button>
              <button onClick={next} style={{ background: C.brass, color: C.ink }} className="px-4 py-1.5 rounded text-sm font-bold flex items-center gap-1 ml-auto">{T[lang].next}<ChevronRight size={15} /></button>
            </div>
            {showIns && <div style={{ background: C.feltDark, border: `1px dashed ${C.brass}`, borderRadius: 10 }} className="p-3"><div style={{ color: C.brass }} className="text-xs font-bold mb-1">{T[lang].insightIntro}</div><p style={{ color: C.ivory }} className="text-sm">{sc.rec.insight}</p></div>}
          </div>
        )}
        {!answered && (
          <div className="mt-3 flex flex-col items-center gap-2">
            <button onClick={() => setShowHint(s => !s)} style={{ color: C.brass }} className="text-xs flex items-center gap-1"><Lightbulb size={14} />{T[lang].hint}</button>
            {showHint && <p style={{ color: C.soft }} className="text-xs text-center max-w-xs">{sc.rec.hint}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
//  PART 6 — INTERACTIVE PLAY TABLE
// ============================================================
function partnerOf(seat) { return seat === "N" ? "S" : seat === "S" ? "N" : seat === "E" ? "W" : "E"; }

function applyCard(g, seat, card) {
  const hands = { ...g.hands, [seat]: g.hands[seat].filter(c => !cardEq(c, card)) };
  const trick = [...g.trick, { seat, card }];
  const played = [...g.played, card];
  if (trick.length === 4) return { ...g, hands, trick, played, resolving: true };
  return { ...g, hands, trick, played, turn: nextSeat(seat) };
}
function resolveTrick(g) {
  const winner = trickWinner(g.trick, g.trump);
  const ns = isDeclSide(winner);
  const newCount = g.trickCount + 1;
  return { ...g, trick: [], turn: winner, tricksNS: g.tricksNS + (ns ? 1 : 0), tricksEW: g.tricksEW + (ns ? 0 : 1), trickCount: newCount, resolving: false, finished: newCount >= 13 };
}
function initGame(deal) {
  const trump = deal.contract.strain; // "♠"/"♥"/"♦"/"♣"/"ST"
  const declarer = deal.contract.declarer || "S";
  const lead = nextSeat(declarer); // West leads when South declares
  const hands = { N: deal.hands.N.slice(), E: deal.hands.E.slice(), S: deal.hands.S.slice(), W: deal.hands.W.slice() };
  return { hands, trick: [], turn: lead, tricksNS: 0, tricksEW: 0, played: [], trickCount: 0, trump, finished: false, resolving: false };
}

function SeatCard({ play }) {
  if (!play) return <div style={{ width: 36, height: 50 }} />;
  return <PlayingCard card={play.card} small />;
}
function HiddenFan({ count }) {
  return (
    <div className="flex items-center gap-1">
      <div className="relative" style={{ width: 46, height: 50 }}>
        {[0, 1, 2].map(k => (
          <div key={k} style={{ position: "absolute", left: k * 7, top: k * 2, width: 32, height: 46, borderRadius: 5, background: "linear-gradient(135deg,#244,#0d2a20)", border: `1px solid ${C.brassDim}` }} />
        ))}
      </div>
      <span style={{ color: C.soft }} className="text-xs font-mono">{count}</span>
    </div>
  );
}

function PlayPractice({ deal, lang, onComplete, onExit, title }) {
  const [g, setG] = useState(() => initGame(deal));
  const [showHint, setShowHint] = useState(false);
  const [showIns, setShowIns] = useState(false);
  const firedRef = useRef(false);
  const L = T[lang];
  const needed = 6 + deal.contract.level;
  const trumpLabel = g.trump === "ST" ? L.noTrump : g.trump;

  // driver: resolve completed tricks and auto-play defenders
  useEffect(() => {
    if (g.finished) return;
    if (g.resolving) {
      const t = setTimeout(() => setG(cur => (cur.resolving ? resolveTrick(cur) : cur)), 900);
      return () => clearTimeout(t);
    }
    if (g.turn === "E" || g.turn === "W") {
      const t = setTimeout(() => {
        setG(cur => {
          if (cur.finished || cur.resolving || (cur.turn !== "E" && cur.turn !== "W")) return cur;
          const card = defenderPlay(cur.hands[cur.turn], cur.trick, cur.trump, partnerOf(cur.turn), cur.played);
          if (!card) return cur;
          return applyCard(cur, cur.turn, card);
        });
      }, 720);
      return () => clearTimeout(t);
    }
  }, [g]);

  useEffect(() => {
    if (g.finished && !firedRef.current) { firedRef.current = true; if (onComplete) onComplete(g.tricksNS >= needed); }
  }, [g.finished]);

  const led = g.trick.length ? g.trick[0].card.s : null;
  const isUser = g.turn === "S" || g.turn === "N";
  const userLegal = (seat) => legalCards(g.hands[seat], led);

  function userPlay(seat, card) {
    if (g.finished || g.resolving) return;
    if (g.turn !== seat) return;
    if (seat !== "S" && seat !== "N") return;
    if (!userLegal(seat).some(c => cardEq(c, card))) return;
    setShowHint(false);
    setG(cur => applyCard(cur, seat, card));
  }

  function renderHand(seat) {
    const cards = sortHand(g.hands[seat]);
    const legal = userLegal(seat);
    const myTurn = g.turn === seat && !g.resolving && !g.finished;
    return (
      <div className="flex flex-wrap gap-1 justify-center">
        {cards.map((c, i) => {
          const ok = myTurn && legal.some(x => cardEq(x, c));
          return <PlayingCard key={i} card={c} small onClick={ok ? () => userPlay(seat, c) : undefined} dim={myTurn && !ok} />;
        })}
        {!cards.length && <span style={{ color: C.soft }} className="text-xs">—</span>}
      </div>
    );
  }

  const find = (seat) => g.trick.find(p => p.seat === seat);
  const hintText = declarerHint({ trick: g.trick, trump: g.trump, hands: g.hands, turn: g.turn, played: g.played }, lang);
  const nsHcpLeft = hcp(g.hands.S) + hcp(g.hands.N);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <button onClick={onExit} style={{ color: C.soft }} className="flex items-center gap-1 text-sm"><ArrowLeft size={16} />{L.back}</button>
        <span style={{ color: C.brass }} className="text-sm font-serif">{title || L.practicePlay}</span>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2" style={{ background: C.feltDark, border: `1px solid ${C.line}`, borderRadius: 10 }}>
        <div className="flex items-center gap-2 p-2">
          <Pill bg={C.brass} color={C.ink}>{L.contract}: {deal.contract.level}{bidLabel(g.trump, lang)}</Pill>
          <Pill bg={C.line2}>{L.needed}: {needed}</Pill>
        </div>
        <div className="flex items-center gap-2 p-2">
          <Pill bg={C.win} color={C.ink}>N/S {g.tricksNS}</Pill>
          <Pill bg={C.red} color={C.ivory}>E/W {g.tricksEW}</Pill>
          <Pill bg={C.line2}>{L.trickN} {Math.min(g.trickCount + 1, 13)}/13</Pill>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: `radial-gradient(circle at 50% 40%, ${C.feltLite}, ${C.felt} 70%)`, border: `2px solid ${C.brassDim}`, borderRadius: 18 }} className="p-3">
        {/* North / dummy */}
        <div className="text-center mb-1"><span style={{ color: C.brass }} className="text-xs uppercase tracking-widest">{L.N} · {L.dummy}{g.turn === "N" && !g.finished ? " ◄" : ""}</span></div>
        {renderHand("N")}

        {/* Middle: W | trick | E */}
        <div className="grid grid-cols-3 items-center my-2" style={{ minHeight: 90 }}>
          <div className="flex flex-col items-center gap-1">
            <span style={{ color: g.turn === "W" ? C.brass : C.soft }} className="text-xs">{L.W}{g.turn === "W" && !g.finished ? " ◄" : ""}</span>
            <HiddenFan count={g.hands.W.length} />
          </div>
          <div className="flex items-center justify-center">
            <div className="grid grid-cols-3 gap-1 items-center justify-items-center" style={{ width: 140 }}>
              <div /><SeatCard play={find("N")} /><div />
              <SeatCard play={find("W")} /><div style={{ width: 18, height: 18, borderRadius: 9, border: `1px solid ${C.brassDim}` }} /><SeatCard play={find("E")} />
              <div /><SeatCard play={find("S")} /><div />
            </div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span style={{ color: g.turn === "E" ? C.brass : C.soft }} className="text-xs">{L.E}{g.turn === "E" && !g.finished ? " ◄" : ""}</span>
            <HiddenFan count={g.hands.E.length} />
          </div>
        </div>

        {/* South / you */}
        {renderHand("S")}
        <div className="text-center mt-1"><span style={{ color: C.brass }} className="text-xs uppercase tracking-widest">{L.S} · {L.you}{g.turn === "S" && !g.finished ? " ◄" : ""}</span></div>
      </div>

      {/* Status / controls */}
      {!g.finished ? (
        <div className="flex flex-col gap-2">
          <div className="text-center">
            <span style={{ color: isUser ? C.brass : C.soft }} className="text-sm font-semibold">{isUser ? (g.trick.length ? L.yourTurn : L.leadNow) : L.waiting}</span>
            {isUser && <p style={{ color: C.soft }} className="text-xs mt-0.5">{L.selectCard}</p>}
          </div>
          <div className="flex gap-2 flex-wrap justify-center">
            <button onClick={() => setShowHint(s => !s)} style={{ background: C.feltLite, color: C.ivory }} className="px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1"><Lightbulb size={14} />{L.hint}</button>
            <button onClick={() => setShowIns(s => !s)} style={{ background: C.feltLite, color: C.ivory }} className="px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1">{showIns ? <EyeOff size={14} /> : <Eye size={14} />}{showIns ? L.hideIns : L.showIns}</button>
            <button onClick={onExit} style={{ background: C.line2, color: C.soft }} className="px-3 py-1.5 rounded text-xs flex items-center gap-1"><X size={14} />{L.finish}</button>
          </div>
          {showHint && isUser && <div style={{ background: C.feltDark, border: `1px dashed ${C.brass}`, borderRadius: 10 }} className="p-3"><p style={{ color: C.ivory }} className="text-sm">{hintText}</p></div>}
          {showIns && <div style={{ background: C.feltDark, border: `1px dashed ${C.brass}`, borderRadius: 10 }} className="p-3 text-sm" >
            <div style={{ color: C.brass }} className="text-xs font-bold mb-1">{L.insightIntro}</div>
            <p style={{ color: C.ivory }}>{L.trumpsOut}: <b>{g.trump === "ST" ? "—" : countOutstandingTrumps({ trump: g.trump, hands: g.hands, played: g.played })}</b> · {L.points} N/S: <b>{nsHcpLeft}</b></p>
          </div>}
        </div>
      ) : (
        <div style={{ background: g.tricksNS >= needed ? C.win : C.red, color: C.ivory, borderRadius: 12 }} className="p-4 text-center">
          <Trophy size={28} className="mx-auto mb-1" />
          <div className="font-bold text-lg">{g.tricksNS >= needed ? L.made : L.down}</div>
          <div className="text-sm mt-1">{L.tricksWon} N/S: {g.tricksNS} · {L.needed}: {needed}</div>
          <div className="flex gap-2 justify-center mt-3">
            <button onClick={() => { firedRef.current = false; setG(initGame(deal)); }} style={{ background: C.ivory, color: C.ink }} className="px-3 py-1.5 rounded text-sm font-bold flex items-center gap-1"><RotateCcw size={14} />{L.replay}</button>
            <button onClick={onExit} style={{ background: C.feltDark, color: C.ivory }} className="px-3 py-1.5 rounded text-sm font-semibold">{L.back}</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Deal list (used in Library and Level play tab) ----------
function DealList({ deals, statusMap, lang, onOpen, pageSize = 24 }) {
  const [page, setPage] = useState(0);
  const pages = Math.ceil(deals.length / pageSize);
  const slice = deals.slice(page * pageSize, page * pageSize + pageSize);
  const L = T[lang];
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1.5">
        {slice.map(d => {
          const st = statusMap[d.id];
          return (
            <button key={d.id} onClick={() => onOpen(d)} style={{ background: C.feltDark, border: `1px solid ${st ? C.brassDim : C.line}`, borderRadius: 10 }} className="flex items-center justify-between px-3 py-2 text-left">
              <span style={{ color: C.ivory }} className="text-sm">{d.label}</span>
              <span className="flex items-center gap-2">
                {st && <Pill bg={st === "reviewed" ? C.brass : C.win} color={C.ink}>{st === "reviewed" ? L.revTag : L.doneTag}</Pill>}
                <Play size={15} style={{ color: C.brass }} />
              </span>
            </button>
          );
        })}
      </div>
      {pages > 1 && (
        <div className="flex items-center justify-between mt-1">
          <button disabled={page === 0} onClick={() => setPage(p => p - 1)} style={{ color: C.soft, opacity: page === 0 ? .4 : 1 }} className="flex items-center gap-1 text-sm"><ChevronLeft size={16} />{L.prev}</button>
          <span style={{ color: C.soft }} className="text-xs">{page + 1} / {pages}</span>
          <button disabled={page === pages - 1} onClick={() => setPage(p => p + 1)} style={{ color: C.brass, opacity: page === pages - 1 ? .4 : 1 }} className="flex items-center gap-1 text-sm font-semibold">{L.next}<ChevronRight size={16} /></button>
        </div>
      )}
    </div>
  );
}

// ============================================================
//  PART 7 — PROGRESS MODEL, SCREENS & APP
// ============================================================
function expFactor(e) { return e === "beg" ? 0.5 : e === "inter" ? 0.75 : 1; }
function levelDealTarget(level, e) { return Math.max(6, Math.round(level.dealsTarget * expFactor(e))); }
function levelMaxId(e) { return e === "beg" ? 2 : e === "inter" ? 4 : 5; }
function levelTotalItems(level, e) { return level.lessons.length + 3 + levelDealTarget(level, e); }

function levelStats(level, prog, e) {
  const p = prog[level.id] || {};
  const lessons = p.lessons || {}, deals = p.deals || {};
  const lessonDone = Object.keys(lessons).length;
  const lessonRev = Object.values(lessons).filter(s => s === "reviewed").length;
  const target = levelDealTarget(level, e);
  const dealVals = Object.values(deals);
  const dealDone = Math.min(dealVals.length, target);
  const dealRev = Math.min(dealVals.filter(s => s === "reviewed").length, target);
  const quizDone = p.quiz ? 1 : 0, quizRev = p.quiz === "reviewed" ? 1 : 0;
  const flashDone = p.flash ? 1 : 0, flashRev = p.flash === "reviewed" ? 1 : 0;
  const bidDone = p.bid ? 1 : 0, bidRev = p.bid === "reviewed" ? 1 : 0;
  return {
    total: levelTotalItems(level, e),
    done: lessonDone + quizDone + flashDone + bidDone + dealDone,
    reviewed: lessonRev + quizRev + flashRev + bidRev + dealRev,
    quizBest: p.quizBest || 0,
  };
}

// ---------- Dashboard ----------
function Dashboard({ lang, user, onOpenLevel, onQuickPlay }) {
  const L = T[lang];
  const e = user.exp;
  const maxId = levelMaxId(e);
  const counted = LEVELS.filter(lv => lv.id <= maxId);
  const agg = counted.reduce((a, lv) => { const s = levelStats(lv, user.progress, e); a.done += s.done; a.reviewed += s.reviewed; a.total += s.total; return a; }, { done: 0, reviewed: 0, total: 0 });
  const pct = agg.total ? Math.round((agg.done / agg.total) * 100) : 0;
  return (
    <div className="flex flex-col gap-4">
      <div style={{ background: `linear-gradient(135deg, ${C.feltLite}, ${C.feltDark})`, border: `1px solid ${C.brassDim}`, borderRadius: 16 }} className="p-5">
        <div className="flex items-center justify-between mb-2">
          <h2 style={{ color: C.ivory }} className="text-xl font-serif">{L.overall}</h2>
          <Pill bg={C.brass} color={C.ink}>{L[e]}</Pill>
        </div>
        <div className="flex items-end gap-3 mb-2">
          <span style={{ color: C.brass }} className="text-4xl font-bold">{pct}%</span>
          <span style={{ color: C.soft }} className="text-sm mb-1">{agg.done}/{agg.total} {L.ofItems}</span>
        </div>
        <ProgressBar done={agg.done} reviewed={agg.reviewed} total={agg.total} />
        <div className="flex items-center gap-4 mt-3 text-xs">
          <span className="flex items-center gap-1"><span style={{ width: 10, height: 10, background: C.brass, borderRadius: 2 }} /><span style={{ color: C.soft }}>{L.completed}</span></span>
          <span className="flex items-center gap-1"><span style={{ width: 10, height: 4, background: C.win, borderRadius: 2 }} /><span style={{ color: C.soft }}>{L.reviewed}</span></span>
        </div>
      </div>

      <button onClick={onQuickPlay} style={{ background: C.brass, color: C.ink, borderRadius: 12 }} className="p-3 flex items-center justify-center gap-2 font-bold"><Shuffle size={18} />{L.newDeal} · {L.playTrainer}</button>

      <div className="flex flex-col gap-3">
        {LEVELS.map(lv => {
          const s = levelStats(lv, user.progress, e);
          const locked = lv.id > maxId;
          const p = s.total ? Math.round((s.done / s.total) * 100) : 0;
          return (
            <button key={lv.id} onClick={() => onOpenLevel(lv.id)} style={{ background: C.feltDark, border: `1px solid ${locked ? C.line2 : C.line}`, borderRadius: 14, opacity: locked ? .7 : 1 }} className="p-4 text-left">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span style={{ background: C.feltLite, color: C.brass, width: 26, height: 26, borderRadius: 8 }} className="flex items-center justify-center text-sm font-bold">{lv.id}</span>
                  <span style={{ color: C.ivory }} className="font-serif">{lv.name[lang]}</span>
                </div>
                <span className="flex items-center gap-2">
                  {locked && <Pill bg={C.line2}>+{L[e === "beg" ? "inter" : "adv"]}</Pill>}
                  <span style={{ color: C.brass }} className="text-sm font-bold">{p}%</span>
                </span>
              </div>
              <p style={{ color: C.soft }} className="text-xs mb-2">{lv.sub[lang]}</p>
              <ProgressBar done={s.done} reviewed={s.reviewed} total={s.total} />
              <div className="flex items-center justify-between mt-1.5">
                <span style={{ color: C.soft }} className="text-xs">{s.done}/{s.total} · {L.reviewed}: {s.reviewed}</span>
                <ChevronRight size={16} style={{ color: C.brass }} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Level detail (tabbed) ----------
function LevelDetail({ levelId, lang, user, onBack, marks, onOpenDeal }) {
  const level = LEVELS.find(l => l.id === levelId);
  const [tab, setTab] = useState("lessons");
  const L = T[lang];
  const prog = user.progress[levelId] || {};
  const e = user.exp;
  const target = levelDealTarget(level, e);
  const deals = useMemo(() => libDeals("learn", levelId, target, lang), [levelId, target, lang]);
  const tabs = [
    { k: "lessons", label: L.lessons, icon: BookOpen },
    { k: "quiz", label: L.quiz, icon: Brain },
    { k: "flash", label: L.flashcards, icon: Layers },
    { k: "cheat", label: L.cheatsheet, icon: FileText },
    { k: "bid", label: L.practiceBid, icon: Sparkles },
    { k: "play", label: L.practicePlay, icon: Play },
  ];
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <button onClick={onBack} style={{ color: C.soft }} className="flex items-center gap-1 text-sm"><ArrowLeft size={16} />{L.levels}</button>
      </div>
      <div style={{ background: `linear-gradient(135deg, ${C.feltLite}, ${C.feltDark})`, border: `1px solid ${C.brassDim}`, borderRadius: 14 }} className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <span style={{ background: C.brass, color: C.ink, width: 28, height: 28, borderRadius: 8 }} className="flex items-center justify-center font-bold">{level.id}</span>
          <h2 style={{ color: C.ivory }} className="text-xl font-serif">{level.name[lang]}</h2>
        </div>
        <p style={{ color: C.soft }} className="text-sm">{level.sub[lang]}</p>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ WebkitOverflowScrolling: "touch" }}>
        {tabs.map(t => (
          <button key={t.k} onClick={() => setTab(t.k)} style={{ background: tab === t.k ? C.brass : C.feltDark, color: tab === t.k ? C.ink : C.soft, border: `1px solid ${tab === t.k ? C.brass : C.line}`, borderRadius: 999 }} className="px-3 py-1.5 text-xs font-semibold flex items-center gap-1 whitespace-nowrap">
            <t.icon size={14} />{t.label}
          </button>
        ))}
      </div>

      <div>
        {tab === "lessons" && <LessonView level={level} lang={lang} status={prog} onMark={(id, st) => marks.lesson(levelId, id, st)} />}
        {tab === "quiz" && <QuizView level={level} lang={lang} status={prog} onMark={(score, total) => marks.quiz(levelId, score, total)} />}
        {tab === "flash" && <Flashcards level={level} lang={lang} onSeen={() => marks.flash(levelId)} />}
        {tab === "cheat" && <CheatSheet level={level} lang={lang} />}
        {tab === "bid" && <BiddingPractice levelId={levelId} lang={lang} onComplete={() => marks.bid(levelId)} />}
        {tab === "play" && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <SectionTitle icon={Play}>{L.learnTitle}</SectionTitle>
              <Pill bg={C.line2}>{Object.keys(prog.deals || {}).length}/{target}</Pill>
            </div>
            <p style={{ color: C.soft }} className="text-xs -mt-2">{L.autoplay}</p>
            <DealList deals={deals} statusMap={prog.deals || {}} lang={lang} onOpen={(d) => onOpenDeal(d, "learn", levelId)} />
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Library ----------
function LibraryView({ lang, user, onOpenDeal, pbnImported, onImport, onClearImported }) {
  const L = T[lang];
  const [tab, setTab] = useState("learn");
  const [lvSel, setLvSel] = useState(1);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteVal, setPasteVal] = useState("");
  const [msg, setMsg] = useState(null);
  const fileRef = useRef(null);
  const e = user.exp;
  const level = LEVELS.find(l => l.id === lvSel);
  const target = levelDealTarget(level, e);
  const learn = useMemo(() => libDeals("learn", lvSel, target, lang), [lvSel, target, lang]);
  const sources = useMemo(() => classicSources(lang, pbnImported), [lang, pbnImported]);
  const [srcKey, setSrcKey] = useState("tech");
  const activeSrc = sources.find(s => s.key === srcKey) || sources[0];

  function doImport(text) {
    const entries = parsePBN(text);
    if (!entries.length) { setMsg(L.pbnNone); return; }
    onImport(entries); setMsg(`+${entries.length}`); setPasteVal(""); setPasteOpen(false);
  }
  function onFile(ev) {
    const f = ev.target.files && ev.target.files[0];
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => doImport(String(rd.result || ""));
    rd.readAsText(f);
    ev.target.value = "";
  }

  return (
    <div className="flex flex-col gap-4">
      <SectionTitle icon={Library}>{L.library}</SectionTitle>
      <div className="flex gap-2">
        <button onClick={() => setTab("learn")} style={{ background: tab === "learn" ? C.brass : C.feltDark, color: tab === "learn" ? C.ink : C.soft, borderRadius: 999, border: `1px solid ${tab === "learn" ? C.brass : C.line}` }} className="px-4 py-1.5 text-sm font-semibold">{L.learnDeals}</button>
        <button onClick={() => setTab("classic")} style={{ background: tab === "classic" ? C.brass : C.feltDark, color: tab === "classic" ? C.ink : C.soft, borderRadius: 999, border: `1px solid ${tab === "classic" ? C.brass : C.line}` }} className="px-4 py-1.5 text-sm font-semibold">{L.classicDeals}</button>
      </div>

      {tab === "learn" ? (
        <div className="flex flex-col gap-3">
          <div className="flex gap-1.5 flex-wrap">
            {LEVELS.map(lv => (
              <button key={lv.id} onClick={() => setLvSel(lv.id)} style={{ background: lvSel === lv.id ? C.feltLite : C.feltDark, color: lvSel === lv.id ? C.ivory : C.soft, border: `1px solid ${lvSel === lv.id ? C.brass : C.line}`, borderRadius: 8 }} className="px-3 py-1.5 text-xs font-semibold">{L.levels} {lv.id}</button>
            ))}
          </div>
          <p style={{ color: C.soft }} className="text-xs">{level.name[lang]} · {target} {L.ofItems}</p>
          <DealList deals={learn} statusMap={(user.progress[lvSel] || {}).deals || {}} lang={lang} onOpen={(d) => onOpenDeal(d, "learn", lvSel)} />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* PBN import */}
          <div style={{ background: C.feltDark, border: `1px dashed ${C.brass}`, borderRadius: 12 }} className="p-3 flex flex-col gap-2">
            <div className="flex items-center gap-2"><FileText size={15} style={{ color: C.brass }} /><span style={{ color: C.ivory }} className="text-sm font-semibold">{L.importTitle}</span></div>
            <p style={{ color: C.soft }} className="text-xs">{L.importHint}</p>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setPasteOpen(o => !o)} style={{ background: C.feltLite, color: C.ivory }} className="px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1"><Plus size={13} />{L.importBtn}</button>
              <button onClick={() => fileRef.current && fileRef.current.click()} style={{ background: C.feltLite, color: C.ivory }} className="px-3 py-1.5 rounded text-xs font-semibold">{L.loadFile}</button>
              <input ref={fileRef} type="file" accept=".pbn,text/plain" onChange={onFile} style={{ display: "none" }} />
              {pbnImported && pbnImported.length > 0 && <button onClick={onClearImported} style={{ background: C.line2, color: C.soft }} className="px-3 py-1.5 rounded text-xs flex items-center gap-1"><X size={13} />{L.clearImported}</button>}
            </div>
            {pasteOpen && (
              <div className="flex flex-col gap-2">
                <textarea value={pasteVal} onChange={ev => setPasteVal(ev.target.value)} placeholder={L.pasteHere} rows={5}
                  style={{ background: C.feltLite, color: C.ivory, border: `1px solid ${C.line}`, borderRadius: 8, fontFamily: "monospace", fontSize: 12 }} className="px-2 py-2 outline-none" />
                <button onClick={() => doImport(pasteVal)} style={{ background: C.brass, color: C.ink }} className="px-3 py-1.5 rounded text-xs font-bold self-start">{L.importBtn}</button>
              </div>
            )}
            {msg && <p style={{ color: msg.startsWith("+") ? C.win : C.red }} className="text-xs">{msg.startsWith("+") ? `${msg} ✓` : msg}</p>}
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ WebkitOverflowScrolling: "touch" }}>
            {sources.map(s => (
              <button key={s.key} onClick={() => setSrcKey(s.key)} style={{ background: activeSrc.key === s.key ? C.brass : C.feltDark, color: activeSrc.key === s.key ? C.ink : C.soft, border: `1px solid ${activeSrc.key === s.key ? C.brass : C.line}`, borderRadius: 999 }} className="px-3 py-1.5 text-xs font-semibold whitespace-nowrap flex items-center gap-1.5">
                {s.label}<span style={{ opacity: .7 }}>· {s.items.length}</span>
              </button>
            ))}
          </div>

          <DealList key={activeSrc.key} deals={activeSrc.items} statusMap={user.classics || {}} lang={lang} onOpen={(d) => onOpenDeal(d, "classic", null)} />
        </div>
      )}
    </div>
  );
}

// ---------- Bidding trainer (global) ----------
function BidTrainer({ lang, user, marks }) {
  const L = T[lang];
  const [lvSel, setLvSel] = useState(null);
  if (lvSel == null) {
    return (
      <div className="flex flex-col gap-4">
        <SectionTitle icon={Sparkles}>{L.bidTrainer}</SectionTitle>
        <p style={{ color: C.soft }} className="text-sm">{L.pickLevel}</p>
        <div className="flex flex-col gap-2">
          {LEVELS.map(lv => (
            <button key={lv.id} onClick={() => setLvSel(lv.id)} style={{ background: C.feltDark, border: `1px solid ${C.line}`, borderRadius: 12 }} className="p-3 flex items-center justify-between text-left">
              <span className="flex items-center gap-2"><span style={{ background: C.feltLite, color: C.brass, width: 24, height: 24, borderRadius: 7 }} className="flex items-center justify-center text-xs font-bold">{lv.id}</span><span style={{ color: C.ivory }} className="text-sm font-serif">{lv.name[lang]}</span></span>
              <ChevronRight size={16} style={{ color: C.brass }} />
            </button>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <button onClick={() => setLvSel(null)} style={{ color: C.soft }} className="flex items-center gap-1 text-sm"><ArrowLeft size={16} />{L.back}</button>
      <BiddingPractice levelId={lvSel} lang={lang} onComplete={() => marks.bid(lvSel)} />
    </div>
  );
}

// ---------- Profile screen ----------
function ProfileScreen({ lang, users, onSelect, onCreate, onDelete, onToggleLang }) {
  const L = T[lang];
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [exp, setExp] = useState("beg");
  const [confirmId, setConfirmId] = useState(null);
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-5" style={{ background: `radial-gradient(circle at 50% 30%, ${C.felt}, ${C.feltDark})` }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Sparkles size={26} style={{ color: C.brass }} />
            <h1 style={{ color: C.ivory }} className="text-3xl font-serif tracking-wide">{L.app}</h1>
          </div>
          <p style={{ color: C.soft }} className="text-sm">{L.tag}</p>
          <button onClick={onToggleLang} style={{ color: C.brass }} className="mt-2 text-xs flex items-center gap-1 mx-auto"><Globe size={13} />{lang === "es" ? "English" : "Español"}</button>
        </div>

        <div style={{ background: C.feltDark, border: `1px solid ${C.line}`, borderRadius: 16 }} className="p-5">
          <h2 style={{ color: C.ivory }} className="font-serif text-lg mb-3">{L.chooseProfile}</h2>
          <div className="flex flex-col gap-2 mb-4">
            {users.map(u => (
              <div key={u.id} className="flex items-center gap-2">
                <button onClick={() => onSelect(u.id)} style={{ background: C.feltLite, border: `1px solid ${C.line}`, borderRadius: 12 }} className="flex-1 flex items-center gap-3 p-3 text-left">
                  <span style={{ background: u.color, width: 34, height: 34, borderRadius: 999 }} className="flex items-center justify-center font-bold" >{u.name.slice(0, 1).toUpperCase()}</span>
                  <span className="flex flex-col">
                    <span style={{ color: C.ivory }} className="font-semibold text-sm">{u.name}</span>
                    <span style={{ color: C.soft }} className="text-xs">{L[u.exp]}</span>
                  </span>
                </button>
                {confirmId === u.id ? (
                  <button onClick={() => { onDelete(u.id); setConfirmId(null); }} style={{ background: C.red, color: C.ivory }} className="px-2 py-2 rounded text-xs font-semibold">{L.confirmDel}</button>
                ) : (
                  <button onClick={() => setConfirmId(u.id)} style={{ color: C.soft }} className="p-2"><X size={16} /></button>
                )}
              </div>
            ))}
            {!users.length && <p style={{ color: C.soft }} className="text-sm text-center py-2">{L.upTo}</p>}
          </div>

          {creating ? (
            <div style={{ background: C.felt, border: `1px solid ${C.line}`, borderRadius: 12 }} className="p-3 flex flex-col gap-3">
              <input value={name} onChange={ev => setName(ev.target.value)} placeholder={L.name} maxLength={14}
                style={{ background: C.feltDark, color: C.ivory, border: `1px solid ${C.line}`, borderRadius: 8 }} className="px-3 py-2 text-sm outline-none" />
              <div>
                <p style={{ color: C.soft }} className="text-xs mb-1">{L.expertise}</p>
                <div className="flex gap-2">
                  {["beg", "inter", "adv"].map(x => (
                    <button key={x} onClick={() => setExp(x)} style={{ background: exp === x ? C.brass : C.feltDark, color: exp === x ? C.ink : C.soft, border: `1px solid ${exp === x ? C.brass : C.line}`, borderRadius: 8 }} className="flex-1 px-2 py-1.5 text-xs font-semibold">{L[x]}</button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { if (name.trim()) { onCreate(name.trim(), exp); setName(""); setExp("beg"); setCreating(false); } }} style={{ background: C.brass, color: C.ink }} className="flex-1 px-3 py-2 rounded text-sm font-bold">{L.create}</button>
                <button onClick={() => setCreating(false)} style={{ background: C.line2, color: C.soft }} className="px-3 py-2 rounded text-sm">{L.cancel}</button>
              </div>
            </div>
          ) : (
            users.length < 10 && <button onClick={() => setCreating(true)} style={{ background: C.feltLite, color: C.ivory, border: `1px dashed ${C.brass}`, borderRadius: 12 }} className="w-full p-3 flex items-center justify-center gap-2 text-sm font-semibold"><Plus size={16} />{L.newProfile}</button>
          )}
        </div>
        <p style={{ color: C.soft }} className="text-center text-xs mt-3">{L.upTo}</p>
      </div>
    </div>
  );
}

// ---------- Header ----------
function Header({ lang, user, view, onNav, onSwitch, onToggleLang }) {
  const L = T[lang];
  const items = [
    { k: "dashboard", label: L.dashboard, icon: HomeIcon },
    { k: "levels", label: L.levels, icon: GraduationCap },
    { k: "library", label: L.library, icon: Library },
    { k: "bid", label: L.bidTrainer, icon: Sparkles },
    { k: "play", label: L.playTrainer, icon: Play },
  ];
  return (
    <div style={{ background: C.feltDark, borderBottom: `1px solid ${C.line}` }} className="sticky top-0 z-10">
      <div className="max-w-md mx-auto px-3 pt-3 pb-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles size={18} style={{ color: C.brass }} />
            <span style={{ color: C.ivory }} className="font-serif text-lg">{L.app}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onToggleLang} style={{ color: C.brass, border: `1px solid ${C.brassDim}`, borderRadius: 8 }} className="px-2 py-1 text-xs font-semibold flex items-center gap-1"><Globe size={12} />{lang.toUpperCase()}</button>
            <button onClick={onSwitch} style={{ background: user.color, width: 28, height: 28, borderRadius: 999 }} className="flex items-center justify-center text-xs font-bold" title={L.switchUser}>{user.name.slice(0, 1).toUpperCase()}</button>
          </div>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ WebkitOverflowScrolling: "touch" }}>
          {items.map(it => {
            const active = view === it.k;
            return (
              <button key={it.k} onClick={() => onNav(it.k)} style={{ background: active ? C.brass : "transparent", color: active ? C.ink : C.soft, border: `1px solid ${active ? C.brass : C.line}`, borderRadius: 999 }} className="px-3 py-1 text-xs font-semibold flex items-center gap-1 whitespace-nowrap">
                <it.icon size={13} />{it.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================
//  MAIN APP
// ============================================================
export default function App() {
  const [lang, setLang] = useState("es");
  const [users, setUsers] = useState([]);
  const [currentId, setCurrentId] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState({ name: "dashboard", params: {} });
  const [pbnImported, setPbnImported] = useState([]);

  // load
  useEffect(() => {
    (async () => {
      const u = await store.get("bm_users");
      const c = await store.get("bm_current");
      const lg = await store.get("bm_lang");
      const pb = await store.get("bm_pbn");
      if (Array.isArray(u)) setUsers(u);
      if (c) setCurrentId(c);
      if (lg) setLang(lg);
      if (Array.isArray(pb)) setPbnImported(pb);
      setLoaded(true);
    })();
  }, []);
  // persist
  useEffect(() => { if (loaded) store.set("bm_users", users); }, [users, loaded]);
  useEffect(() => { if (loaded) store.set("bm_current", currentId); }, [currentId, loaded]);
  useEffect(() => { if (loaded) store.set("bm_lang", lang); }, [lang, loaded]);
  useEffect(() => { if (loaded) store.set("bm_pbn", pbnImported); }, [pbnImported, loaded]);

  const user = users.find(u => u.id === currentId) || null;

  function createUser(name, exp) {
    const id = "u" + Date.now();
    const color = AVATARS[users.length % AVATARS.length];
    const nu = { id, name, exp, color, progress: {}, classics: {} };
    setUsers(us => [...us, nu]); setCurrentId(id); setView({ name: "dashboard", params: {} });
  }
  function deleteUser(id) {
    setUsers(us => us.filter(u => u.id !== id));
    if (currentId === id) setCurrentId(null);
  }
  function updateUser(fn) {
    setUsers(us => us.map(u => u.id === currentId ? fn(u) : u));
  }
  function bump(prev) { return prev ? "reviewed" : "done"; }

  const marks = {
    lesson(levelId, id, st) {
      updateUser(u => { const p = { ...u.progress }; const lv = { ...(p[levelId] || {}) }; lv.lessons = { ...(lv.lessons || {}), [id]: st }; p[levelId] = lv; return { ...u, progress: p }; });
    },
    quiz(levelId, score, total) {
      updateUser(u => { const p = { ...u.progress }; const lv = { ...(p[levelId] || {}) }; lv.quiz = bump(lv.quiz); lv.quizBest = Math.max(lv.quizBest || 0, score); p[levelId] = lv; return { ...u, progress: p }; });
    },
    flash(levelId) {
      updateUser(u => { const p = { ...u.progress }; const lv = { ...(p[levelId] || {}) }; lv.flash = bump(lv.flash); p[levelId] = lv; return { ...u, progress: p }; });
    },
    bid(levelId) {
      updateUser(u => { const p = { ...u.progress }; const lv = { ...(p[levelId] || {}) }; lv.bid = bump(lv.bid); p[levelId] = lv; return { ...u, progress: p }; });
    },
    deal(kind, levelId, dealId) {
      updateUser(u => {
        if (kind === "classic") { const cl = { ...(u.classics || {}) }; cl[dealId] = bump(cl[dealId]); return { ...u, classics: cl }; }
        const p = { ...u.progress }; const lv = { ...(p[levelId] || {}) }; lv.deals = { ...(lv.deals || {}) }; lv.deals[dealId] = bump(lv.deals[dealId]); p[levelId] = lv; return { ...u, progress: p };
      });
    },
  };

  function openDeal(d, kind, levelId) {
    const deal = d.deal ? d.deal : generateDeal(d.seed);
    setView({ name: "play", params: { deal, dealId: d.id, kind, levelId, title: d.label } });
  }
  function quickPlay() {
    const seed = Math.floor(Math.random() * 1e9);
    setView({ name: "play", params: { deal: generateDeal(seed), dealId: null, kind: "quick", levelId: null, title: T[lang].playTrainer } });
  }

  if (!loaded) {
    return <div style={{ background: C.feltDark, minHeight: "100vh" }} className="flex items-center justify-center"><Sparkles size={28} style={{ color: C.brass }} className="animate-pulse" /></div>;
  }
  if (!user) {
    return <ProfileScreen lang={lang} users={users} onSelect={(id) => { setCurrentId(id); setView({ name: "dashboard", params: {} }); }} onCreate={createUser} onDelete={deleteUser} onToggleLang={() => setLang(l => l === "es" ? "en" : "es")} />;
  }

  // top-level nav name (for header active state)
  const navName = view.name === "level" ? "levels" : view.name;

  return (
    <div style={{ background: `radial-gradient(circle at 50% 0%, ${C.felt}, ${C.feltDark} 80%)`, minHeight: "100vh", fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
      <style>{`.font-serif{font-family:Georgia,'Times New Roman',serif;}`}</style>
      <Header lang={lang} user={user} view={navName}
        onNav={(k) => setView({ name: k, params: {} })}
        onSwitch={() => setCurrentId(null)}
        onToggleLang={() => setLang(l => l === "es" ? "en" : "es")} />

      <div className="max-w-md mx-auto px-3 py-4 pb-24">
        {view.name === "dashboard" && <Dashboard lang={lang} user={user} onOpenLevel={(id) => setView({ name: "level", params: { levelId: id } })} onQuickPlay={quickPlay} />}
        {view.name === "levels" && <Dashboard lang={lang} user={user} onOpenLevel={(id) => setView({ name: "level", params: { levelId: id } })} onQuickPlay={quickPlay} />}
        {view.name === "level" && <LevelDetail levelId={view.params.levelId} lang={lang} user={user} marks={marks} onBack={() => setView({ name: "dashboard", params: {} })} onOpenDeal={openDeal} />}
        {view.name === "library" && <LibraryView lang={lang} user={user} onOpenDeal={openDeal} pbnImported={pbnImported} onImport={(entries) => setPbnImported(prev => [...entries, ...prev])} onClearImported={() => setPbnImported([])} />}
        {view.name === "bid" && <BidTrainer lang={lang} user={user} marks={marks} />}
        {view.name === "play" && view.params.deal && (
          <PlayPractice deal={view.params.deal} lang={lang} title={view.params.title}
            onExit={() => setView({ name: view.params.levelId ? "level" : "dashboard", params: view.params.levelId ? { levelId: view.params.levelId } : {} })}
            onComplete={() => { if (view.params.dealId) marks.deal(view.params.kind, view.params.levelId, view.params.dealId); }} />
        )}
        {view.name === "play" && !view.params.deal && (
          <div className="flex flex-col items-center gap-3 py-10">
            <p style={{ color: C.soft }} className="text-sm">{T[lang].pickLevel}</p>
            <button onClick={quickPlay} style={{ background: C.brass, color: C.ink }} className="px-4 py-2 rounded font-bold flex items-center gap-2"><Shuffle size={16} />{T[lang].newDeal}</button>
          </div>
        )}
      </div>
    </div>
  );
}
