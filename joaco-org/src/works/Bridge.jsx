import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Globe, User, Users, BookOpen, Brain, Layers, FileText, Lightbulb,
  Eye, EyeOff, Check, RotateCcw, ChevronRight, ChevronLeft, Play,
  Award, Sparkles, Home as HomeIcon, Library, ArrowLeft, HelpCircle,
  X, GraduationCap, Target, Trophy, Shuffle, Plus, Settings, Lock, BarChart3
} from "lucide-react";

/* ============================================================
   BRIDGE MAESTRO — Mayores Quintos / 5-Card Majors
   Single-file React learning app.
   ============================================================ */

// ---------- Theme palette (inline styles; Tailwind core only for layout) ----------
const THEMES = {
  classic: {
    name: { es: "Clásico", en: "Classic" }, sub: { es: "Tapete verde y latón", en: "Green felt & brass" }, ui: { maxW: "max-w-md", tips: false },
    C: { felt: "#1b4332", feltDark: "#0f261c", feltLite: "#2d6a4f", ivory: "#f6f1e3", parch: "#ece4cf", ink: "#1d231f", brass: "#c9a227", brassDim: "#8f6f1c", red: "#b3261e", line: "#3a5d4c", line2: "#26463a", win: "#3f8f5e", soft: "#cdbf95" },
  },
  clean: {
    name: { es: "Limpio", en: "Clean" }, sub: { es: "Claro, plano y moderno", en: "Light, flat, modern" }, ui: { maxW: "max-w-md", tips: false, page: "#e6eaef" },
    C: { felt: "#eceff3", feltDark: "#ffffff", feltLite: "#f5f7fa", ivory: "#0f172a", parch: "#334155", ink: "#ffffff", brass: "#0d9488", brassDim: "#5eead4", red: "#dc2626", line: "#d3dae2", line2: "#e6eaef", win: "#15803d", soft: "#586273" },
  },
  ipad: {
    name: { es: "iPad", en: "iPad" }, sub: { es: "Amplio para tablet", en: "Spacious for tablet" }, ui: { maxW: "max-w-3xl", tips: false, rootPx: 18, page: "#e3e8f0" },
    C: { felt: "#e9edf3", feltDark: "#ffffff", feltLite: "#f4f7fb", ivory: "#0f172a", parch: "#334155", ink: "#ffffff", brass: "#4f46e5", brassDim: "#a5b4fc", red: "#e11d48", line: "#ccd6e3", line2: "#e3e9f1", win: "#15803d", soft: "#586273" },
  },
  tutor: {
    name: { es: "Tutor", en: "Tutor" }, sub: { es: "Sepia con consejos", en: "Sepia with tips" }, ui: { maxW: "max-w-md", tips: true },
    C: { felt: "#4a3a28", feltDark: "#2b2118", feltLite: "#3a2d20", ivory: "#f4ead6", parch: "#e8dcc0", ink: "#241a10", brass: "#caa45a", brassDim: "#8a6d2f", red: "#c0503f", line: "#5a4631", line2: "#3a2d20", win: "#6a9a52", soft: "#c9b48f" },
  },
  night: {
    name: { es: "Nocturno", en: "Night" }, sub: { es: "Pizarra y cian", en: "Slate & cyan" }, ui: { maxW: "max-w-md", tips: false },
    C: { felt: "#172033", feltDark: "#0b1220", feltLite: "#1e293b", ivory: "#e8edf5", parch: "#cbd5e1", ink: "#0b1220", brass: "#38bdf8", brassDim: "#0ea5e9", red: "#f87171", line: "#334155", line2: "#1e293b", win: "#34d399", soft: "#94a3b8" },
  },
};
let C = THEMES.classic.C;
let UI = THEMES.classic.ui;
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
  {"id": 6, "key": "conv", "name": {"es": "Nivel 6 · Convenciones", "en": "Level 6 · Conventions"}, "sub": {"es": "Convenciones de club para competir y describir", "en": "Club conventions to compete and describe"}, "dealsTarget": 40, "lessons": [{"id": "c1", "t": {"es": "Doblo negativo", "en": "Negative double"}, "body": {"es": "El **doblo negativo** convierte un doblo que parecería de castigo en **informativo** cuando un rival **interviene** sobre la apertura de tu compañero.\n\n› La situación\n1♥ (1♠) **X** ← tu doblo NO es castigo: muestra **valores (6+ PH) y las mayores no nombradas**, típicamente 4 cartas en el otro mayor.\n\n› Por qué existe\nSin él, perderías los palos de 4 cartas que ya no puedes nombrar a nivel 1 tras la intervención. El doblo negativo los recupera.\n\n› Acuerdos típicos\n• Hasta cierto nivel (p. ej. 2♠ o 3♥) los doblos son negativos; por encima, de castigo.\n• 1♣ (1♦) X = 4-4 en mayores; 1♥ (1♠) X = 4 picas exactas.\n\n› El abridor responde\nComo a una respuesta natural: apoya el mayor implícito, repite, o describe. Es la convención competitiva más usada en club.", "en": "The **negative double** turns a seemingly penalty double into a **takeout** one when an opponent **overcalls** your partner's opening.\n\n› The situation\n1♥ (1♠) **X** ← your double is NOT penalty: it shows **values (6+ HCP) and the unbid major(s)**, typically 4 cards in the other major.\n\n› Why it exists\nWithout it you'd lose the 4-card suits you can no longer name at the 1 level after the overcall. The negative double recovers them.\n\n› Typical agreements\n• Up to an agreed level (e.g. 2♠ or 3♥) doubles are negative; above it, penalty.\n• 1♣ (1♦) X = 4-4 majors; 1♥ (1♠) X = exactly 4 spades.\n\n› Opener answers\nAs to a natural response: support the implied major, rebid, or describe. It is the most-used competitive convention in clubs."}}, {"id": "c2", "t": {"es": "Jacoby 2ST (apoyo mayor forzante)", "en": "Jacoby 2NT (forcing major raise)"}, "body": {"es": "**Jacoby 2ST** es un apoyo a manga **forzante** con fit de 4+ en la mayor de tu compañero.\n\n› El mecanismo\n1♥ – **2ST** = «tengo fit de 4+ corazones y mano de manga o más (12+ PH); descríbeme tu mano para explorar slam».\n\n› Las respuestas del abridor\n• **Nuevo palo a nivel 3** = singleton/void (cortedad) en ese palo.\n• **Nuevo palo a nivel 4** = palo lateral de 5 cartas con honores.\n• **3 de tu mayor** = mano fuerte sin cortedad (extras).\n• **3ST / 4 de tu mayor** = mínima sin cortedad.\n\n› Para qué sirve\nLas cortedades son oro para el slam: una cortedad enfrente de perdedoras sueltas convierte 4♥ en 6♥. Jacoby intercambia esa información **por debajo de la manga**, dejando sitio para Blackwood si encaja.\n\n› Alternativa sencilla\nSi no juegas Jacoby, el **splinter** (doble salto en nuevo palo: 1♥–4♣) muestra fit + cortedad en ese palo directamente.", "en": "**Jacoby 2NT** is a **forcing** game raise with a 4+ fit in partner's major.\n\n› The mechanism\n1♥ – **2NT** = \"I have a 4+ heart fit and game values or better (12+ HCP); describe your hand to explore slam\".\n\n› Opener's replies\n• **New suit at the 3 level** = a singleton/void (shortness) there.\n• **New suit at the 4 level** = a 5-card side suit with honours.\n• **3 of your major** = a strong hand with no shortness (extras).\n• **3NT / 4 of your major** = a minimum with no shortness.\n\n› What it's for\nShortness is gold for slam: a singleton opposite loose losers turns 4♥ into 6♥. Jacoby trades that information **below game**, leaving room for Blackwood if it fits.\n\n› Simple alternative\nIf you don't play Jacoby, a **splinter** (double jump in a new suit: 1♥–4♣) shows fit + shortness in that suit directly."}}, {"id": "c3", "t": {"es": "Cuarta color forzosa", "en": "Fourth suit forcing"}, "body": {"es": "La **cuarta color forzosa** (4th suit forcing) usa el **único palo que nadie ha nombrado** como una pregunta artificial y **forzante**, no como un palo natural.\n\n› Cuándo aparece\n1♦ – 1♥ – 1♠ – **2♣** ← el 2♣ del respondedor (4º color) no promete tréboles: dice «tengo valores de manga, sigue describiendo, aún no encontramos contrato».\n\n› Por qué se necesita\nA veces tienes fuerza de manga pero ningún bid natural describe bien tu mano (ni fit, ni palo propio repetible, ni parada para ST). El 4º color **gana una ronda** forzante para aclararlo.\n\n› El abridor responde\n• **ST** con parada en el 4º color.\n• **Apoyo** al palo del respondedor con 3 cartas.\n• **Repite** su primer palo con 6.\n• **Describe** distribución/fuerza extra.\n\n› Regla práctica\nEs una herramienta de **mano de manga** (normalmente 12+ PH). Por debajo, cambia de palo de forma natural o invita.", "en": "**Fourth suit forcing** uses the **one suit nobody has named** as an artificial, **forcing** question rather than a natural suit.\n\n› When it appears\n1♦ – 1♥ – 1♠ – **2♣** ← responder's 2♣ (the 4th suit) promises no clubs: it says \"I have game values, keep describing, we haven't found our contract yet\".\n\n› Why it's needed\nSometimes you have game-going strength but no natural bid describes your hand well (no fit, no rebiddable suit, no stopper for NT). The 4th suit **buys a forcing round** to clarify.\n\n› Opener answers\n• **NT** with a stopper in the 4th suit.\n• **Support** responder's suit with 3 cards.\n• **Rebid** their first suit with 6.\n• **Describe** extra shape/strength.\n\n› Rule of thumb\nIt is a **game-forcing** tool (usually 12+ HCP). Below that, change suit naturally or invite."}}, {"id": "c4", "t": {"es": "2♣ fuerte y desarrollos", "en": "Strong 2♣ and developments"}, "body": {"es": "La apertura **2♣** es fuerte y **artificial**: 22+ PH equilibrado **o** cualquier mano con bazas de manga casi seguras. Es **forzante a manga** (salvo la secuencia 2♣–2♦–2ST).\n\n› La respuesta básica\n• **2♦** = «esperando» (waiting), la respuesta comodín que no niega ni promete nada; deja describir al abridor.\n• A veces se juega 2♦ = negativo (0-3 PH) y otras respuestas positivas; el waiting puro es lo más simple.\n\n› El abridor describe\n• **2ST** = 22-24 equilibrado (el respondedor sigue con Stayman/transferencias).\n• **Nuevo palo** = palo real, 5+, forzante a manga; el respondedor apoya, da segundo palo o dice 2ST.\n\n› Por qué con cuidado\nEl 2♣ consume mucho espacio, así que se reserva a manos donde la manga es casi inevitable. No lo uses con 19-21 desequilibradas: ábrelas a nivel 1 con un plan de salto.\n\n› Recuerda\nUna vez abierto 2♣, **no podéis pararos por debajo de manga**, salvo el rebid 2ST que el respondedor puede pasar con basura.", "en": "The **2♣** opening is strong and **artificial**: 22+ balanced **or** any hand with near-certain game-going tricks. It is **game-forcing** (except the 2♣–2♦–2NT sequence).\n\n› The basic response\n• **2♦** = \"waiting\", the catch-all reply that neither denies nor promises anything; it lets opener describe.\n• Some play 2♦ = negative (0-3 HCP) with other positive replies; pure waiting is simplest.\n\n› Opener describes\n• **2NT** = 22-24 balanced (responder continues with Stayman/transfers).\n• **New suit** = a real 5+ suit, game-forcing; responder supports, gives a second suit, or bids 2NT.\n\n› Why use it carefully\n2♣ eats a lot of room, so reserve it for hands where game is almost inevitable. Don't use it with 19-21 unbalanced: open those at the 1 level with a jump plan.\n\n› Remember\nOnce 2♣ is opened you **cannot stop below game**, except the 2NT rebid which responder may pass with rubbish."}}, {"id": "c5", "t": {"es": "Respuestas a la barrera de 2", "en": "Responses to a weak two"}, "body": {"es": "Tras la **apertura barrera** de tu compañero (2♥/2♠ débil, 6 cartas 6-10 PH), necesitas una forma de preguntar si tiene «máximo o mínimo».\n\n› 2ST forzante (Ogust)\n1ª opción: **2ST** pregunta. El abridor responde por pasos:\n• **3♣** = mínimo, palo malo.\n• **3♦** = mínimo, palo bueno.\n• **3♥** = máximo, palo malo.\n• **3♠** = máximo, palo bueno.\n• **3ST** = AKQ del palo (excepcional).\n\n› 2ST «feature» (alternativa)\nOtros juegan que el abridor muestra un **honor lateral** (feature) con máximo, o repite su palo con mínimo. Acuerda cuál usáis.\n\n› El resto de respuestas\n• **Apoyo directo** (3 del palo) = preventivo, sin interés de manga (ley de bazas: súbele para estorbar).\n• **Manga** (4 del palo) = a jugar.\n• **Nuevo palo** = forzante una vuelta, palo propio.\n\n› Idea clave\nLa barrera ya describió la mano; el respondedor es el «capitán» y decide. 2ST es solo para cuando la manga depende del **tipo** de mínimo/máximo.", "en": "After partner's **weak-two opening** (2♥/2♠, 6 cards 6-10 HCP) you need a way to ask whether they are \"maximum or minimum\".\n\n› 2NT forcing (Ogust)\nOption 1: **2NT** asks. Opener replies in steps:\n• **3♣** = minimum, bad suit.\n• **3♦** = minimum, good suit.\n• **3♥** = maximum, bad suit.\n• **3♠** = maximum, good suit.\n• **3NT** = AKQ of the suit (exceptional).\n\n› 2NT \"feature\" (alternative)\nOthers play opener shows a **side honour** (feature) with a maximum, or rebids the suit with a minimum. Agree which you use.\n\n› The other responses\n• **Direct raise** (3 of the suit) = pre-emptive, no game interest (law of tricks: raise to obstruct).\n• **Game** (4 of the suit) = to play.\n• **New suit** = forcing one round, a real suit.\n\n› Key idea\nThe weak two already described the hand; responder is the \"captain\" and decides. 2NT is only for when game depends on the **type** of minimum/maximum."}}, {"id": "c6", "t": {"es": "Defensas a 1ST rival", "en": "Defending against 1NT"}, "body": {"es": "Cuando un rival abre **1ST** (15-17), pasar siempre es perder el contrato barato. Necesitas un sistema para competir, pero con cuidado: ellos tienen 15-17 y tú estás a ciegas.\n\n› El doblo\nEn directo, **X de 1ST = castigo** (mano fuerte, 15+): esperas hundirlos. En passing (4ª mano) muchos lo juegan informativo.\n\n› Sistemas bicolores (visión general)\nLas convenciones populares muestran **dos palos** para encontrar fit rápido:\n• **Cappelletti/Hamilton**: 2♣ = un palo mayor cualquiera; 2♦ = ambos mayores; 2♥/2♠ = ese mayor + un menor; 2ST = ambos menores.\n• **DONT**: X = un palo; 2♣/2♦/2♥ = ese palo + uno más alto.\n• **Landy**: 2♣ = ambos mayores.\n\n› Regla de oro\nCompetir contra 1ST es **agresivo y posicional**: hazlo más con distribución (bicolores) que con puntos sueltos, y mejor no vulnerable. Acuerda **un** sistema con tu compañero y conoce sus respuestas; improvisar aquí cuesta números rojos.", "en": "When an opponent opens **1NT** (15-17), always passing means losing the contract cheaply. You need a system to compete — but carefully: they have 15-17 and you're in the dark.\n\n› The double\nIn the direct seat, **X of 1NT = penalty** (a strong hand, 15+): you aim to set them. In the passout seat many play it as takeout.\n\n› Two-suited systems (overview)\nPopular conventions show **two suits** to find a fit fast:\n• **Cappelletti/Hamilton**: 2♣ = any one major; 2♦ = both majors; 2♥/2♠ = that major + a minor; 2NT = both minors.\n• **DONT**: X = one suit; 2♣/2♦/2♥ = that suit + a higher one.\n• **Landy**: 2♣ = both majors.\n\n› Golden rule\nCompeting over 1NT is **aggressive and positional**: do it more with distribution (two-suiters) than with loose points, and preferably non-vulnerable. Agree on **one** system with partner and know its follow-ups; improvising here costs red numbers."}}, {"id": "c7", "t": {"es": "Defensas a barreras rivales", "en": "Defending against pre-empts"}, "body": {"es": "Cuando un rival abre **barrera** (2♥, 3♣, etc.), te roba espacio a propósito. Tu arma principal es el **doblo informativo**.\n\n› Doblo de barrera\n(2♠) **X** = informativo: «apertura, apoyo a los palos no nombrados (sobre todo el otro mayor) y normalmente cortedad en su palo». Tu compañero elige palo o convierte a castigo pasando con longitud en el palo rival.\n\n› Overcalls\n• **Cambio de palo** = natural, buen palo de 5-6 cartas y mano sólida (subes un nivel, así que necesitas más que sobre una apertura de 1).\n• **2ST sobre barrera de 2** = ~15-18 equilibrado con parada (como un 1ST grande).\n\n› Lebensohl (idea)\nTras (2♥) X (P), el respondedor usa **2ST como relé a 3♣** para mostrar manos débiles, reservando los bids directos a nivel 3 para valores. Es el matiz que evita malentendidos «rápido vs lento».\n\n› Mentalidad\nLa barrera funciona si te hace adivinar; con el doblo informativo y disciplina de fuerza, recuperas la iniciativa sin lanzarte a ciegas a manga.", "en": "When an opponent opens a **pre-empt** (2♥, 3♣, etc.), they steal room on purpose. Your main weapon is the **takeout double**.\n\n› Double of a pre-empt\n(2♠) **X** = takeout: \"opening values, support for the unbid suits (especially the other major), and usually shortness in their suit\". Partner picks a suit or converts to penalty by passing with length in their suit.\n\n› Overcalls\n• **New suit** = natural, a good 5-6 card suit and a sound hand (you're a level higher, so you need more than over a 1-opening).\n• **2NT over a weak two** = ~15-18 balanced with a stopper (like a big 1NT).\n\n› Lebensohl (idea)\nAfter (2♥) X (P), responder uses **2NT as a relay to 3♣** to show weak hands, reserving direct 3-level bids for values. It's the nuance that avoids \"fast vs slow\" misunderstandings.\n\n› Mindset\nA pre-empt works if it makes you guess; with the takeout double and strength discipline, you regain the initiative without leaping blindly to game."}}, {"id": "c8", "t": {"es": "Bicolores: Michaels y Unusual 2ST", "en": "Two-suiters: Michaels & Unusual 2NT"}, "body": {"es": "Dos convenciones de **intervención bicolor** que muestran **dos palos de 5+** con una sola voz, ideales para competir y estorbar.\n\n› Michaels cue-bid\nCubrir el palo del rival muestra un bicolor:\n• (1♥/1♠) **2 del palo rival** = **el otro mayor + un menor** (5-5).\n• (1♣/1♦) **2 del palo rival** = **ambos mayores** (5-5).\nEl compañero elige el palo; con 2ST a veces pregunta el menor.\n\n› Unusual 2ST\n**Salto a 2ST** sobre la apertura rival = **los dos palos inferiores no nombrados**, casi siempre **ambos menores** (5-5) sobre una apertura mayor.\n\n› Fuerza y vulnerabilidad\nAmbas son **distribucionales**: úsalas con 5-5 y manos de ataque/estorbo, no con puntos planos. La vulnerabilidad importa: bicolor 5-5 no vulnerable es barato; vulnerable, sé más prudente (riesgo de doblos de castigo).\n\n› Para qué sirven\nEncuentran fit de 9-10 cartas rápido y aplican la **ley de bazas totales**: con doble fit, compite alto aunque tengas pocos puntos.", "en": "Two **two-suited overcall** conventions that show **two 5+ suits** with a single call, ideal for competing and obstructing.\n\n› Michaels cue-bid\nBidding the opponent's suit shows a two-suiter:\n• (1♥/1♠) **2 of their suit** = **the other major + a minor** (5-5).\n• (1♣/1♦) **2 of their suit** = **both majors** (5-5).\nPartner picks the suit; 2NT sometimes asks for the minor.\n\n› Unusual 2NT\nA **jump to 2NT** over their opening = **the two lowest unbid suits**, almost always **both minors** (5-5) over a major opening.\n\n› Strength and vulnerability\nBoth are **distributional**: use them with 5-5 and attacking/obstructive hands, not with flat points. Vulnerability matters: a 5-5 two-suiter non-vulnerable is cheap; vulnerable, be more careful (penalty-double risk).\n\n› What they're for\nThey find a 9-10 card fit fast and apply the **law of total tricks**: with a double fit, compete high even with few points."}}, {"id": "c9", "t": {"es": "Cue-bids de control y slam", "en": "Control cue-bids & slam"}, "body": {"es": "Para el **slam** no basta con contar puntos: necesitas saber que no os falten **dos ases** (o un as y el rey del triunfo). Tras acordar palo y nivel de manga, los **cue-bids de control** y Blackwood lo resuelven.\n\n› Cue-bids de control (control bids)\nUna vez fijado el palo de triunfo con interés de slam, nombrar un **nuevo palo por encima de la manga** muestra un **control** en ese palo (As o void primero; luego Rey o singleton). Vais subiendo, palo por palo, mostrando controles **de abajo arriba**. Si descubrís que controláis todos los palos, el slam es seguro.\n\n› Blackwood 4ST\nLa pregunta de **ases**: respuestas 5♣/5♦/5♥/5♠ (0/4, 1, 2, 3). Luego **5ST** pide reyes. Variante moderna **RKCB 1430**: cuenta el **Rey de triunfo como un as** (5 «ases»), y distingue además la **dama de triunfo**: mucho más preciso.\n\n› Gerber 4♣\nPregunta de ases **solo** cuando el último bid natural fue **ST** (1ST–4♣). No la uses con fit de palo: ahí es Blackwood.\n\n› Regla de oro del slam\nPrimero **control bids** para asegurar que no hay dos perdedoras rápidas; **después** Blackwood para contar ases. Saltar a Blackwood sin controles puede meterte en 6 con dos ases fuera.", "en": "For **slam** counting points isn't enough: you need to know you're not missing **two aces** (or an ace and the trump king). After agreeing a suit and game level, **control cue-bids** and Blackwood settle it.\n\n› Control cue-bids\nOnce the trump suit is set with slam interest, naming a **new suit above game** shows a **control** there (Ace or void first; then King or singleton). You go up suit by suit, showing controls **from the bottom up**. If you find you control every suit, the slam is safe.\n\n› Blackwood 4NT\nThe **ace** ask: replies 5♣/5♦/5♥/5♠ (0/4, 1, 2, 3). Then **5NT** asks for kings. The modern variant **RKCB 1430** counts the **trump King as an ace** (5 \"aces\") and also locates the **trump Queen**: far more precise.\n\n› Gerber 4♣\nAn ace ask **only** when the last natural bid was **NT** (1NT–4♣). Don't use it with a suit fit: there it's Blackwood.\n\n› Slam golden rule\nFirst **control bids** to make sure there aren't two fast losers; **then** Blackwood to count aces. Jumping to Blackwood without controls can land you in 6 with two aces missing."}}], "quiz": [{"q": {"es": "1♥ (1♠) X de tu compañero es...", "en": "1♥ (1♠) X by partner is..."}, "opts": [{"es": "castigo", "en": "penalty"}, {"es": "negativo: valores + las mayores", "en": "negative: values + the other major(s)"}, {"es": "Blackwood", "en": "Blackwood"}, {"es": "para jugar", "en": "to play"}], "a": 1}, {"q": {"es": "1♥ – 2ST (Jacoby) muestra...", "en": "1♥ – 2NT (Jacoby) shows..."}, "opts": [{"es": "dos menores", "en": "two minors"}, {"es": "fit de 4+ y mano de manga+", "en": "4+ fit and game-forcing values"}, {"es": "nada, es natural", "en": "nothing, it's natural"}, {"es": "castigo", "en": "penalty"}], "a": 1}, {"q": {"es": "La cuarta color forzosa es...", "en": "Fourth suit forcing is..."}, "opts": [{"es": "un palo natural largo", "en": "a long natural suit"}, {"es": "artificial y forzante a manga", "en": "artificial and game-forcing"}, {"es": "preventiva", "en": "pre-emptive"}, {"es": "una barrera", "en": "a pre-empt"}], "a": 1}, {"q": {"es": "Respuesta comodín a la apertura 2♣ fuerte:", "en": "Catch-all reply to a strong 2♣ opening:"}, "opts": [{"es": "2♥", "en": "2♥"}, {"es": "2♦ esperando", "en": "2♦ waiting"}, {"es": "Pasar", "en": "Pass"}, {"es": "3ST", "en": "3NT"}], "a": 1}, {"q": {"es": "Ogust 2ST tras barrera pregunta...", "en": "Ogust 2NT after a weak two asks..."}, "opts": [{"es": "ases", "en": "aces"}, {"es": "mínimo/máximo y calidad de palo", "en": "min/max and suit quality"}, {"es": "cortedad", "en": "shortness"}, {"es": "el menor", "en": "the minor"}], "a": 1}, {"q": {"es": "Unusual 2ST sobre apertura mayor muestra...", "en": "Unusual 2NT over a major opening shows..."}, "opts": [{"es": "ambos menores (5-5)", "en": "both minors (5-5)"}, {"es": "un solo palo fuerte", "en": "a strong one-suiter"}, {"es": "castigo", "en": "penalty"}, {"es": "apoyo", "en": "support"}], "a": 0}, {"q": {"es": "Para el slam, antes de Blackwood conviene...", "en": "For slam, before Blackwood you should..."}, "opts": [{"es": "saltar directo a 6", "en": "jump straight to 6"}, {"es": "mostrar controles (cue-bids)", "en": "show controls (cue-bids)"}, {"es": "doblar", "en": "double"}, {"es": "pasar", "en": "pass"}], "a": 1}], "flash": [{"f": {"es": "Doblo negativo", "en": "Negative double"}, "b": {"es": "informativo tras intervención", "en": "takeout after an overcall"}}, {"f": {"es": "Jacoby 2ST", "en": "Jacoby 2NT"}, "b": {"es": "fit mayor + manga forzante", "en": "major fit + game force"}}, {"f": {"es": "Splinter", "en": "Splinter"}, "b": {"es": "doble salto = fit + cortedad", "en": "double jump = fit + shortness"}}, {"f": {"es": "4º color forzosa", "en": "4th suit forcing"}, "b": {"es": "artificial, pide describir", "en": "artificial, asks to describe"}}, {"f": {"es": "2♣ fuerte", "en": "Strong 2♣"}, "b": {"es": "22+ o manga segura; 2♦ waiting", "en": "22+ or game-sure; 2♦ waiting"}}, {"f": {"es": "Ogust", "en": "Ogust"}, "b": {"es": "min/max + palo tras barrera", "en": "min/max + suit after weak two"}}, {"f": {"es": "Michaels", "en": "Michaels"}, "b": {"es": "cue = bicolor 5-5", "en": "cue = 5-5 two-suiter"}}, {"f": {"es": "Unusual 2ST", "en": "Unusual 2NT"}, "b": {"es": "dos menores 5-5", "en": "two minors 5-5"}}, {"f": {"es": "RKCB 1430", "en": "RKCB 1430"}, "b": {"es": "Blackwood con Rey de triunfo", "en": "Blackwood incl. trump King"}}, {"f": {"es": "Cue-bid de control", "en": "Control cue-bid"}, "b": {"es": "As/void → Rey/singleton, de abajo arriba", "en": "Ace/void → King/singleton, bottom-up"}}], "cheat": {"title": {"es": "Chuleta · Convenciones", "en": "Cheat sheet · Conventions"}, "rows": [{"es": "1M (1X) X = negativo: valores + mayor(es) no nombrada(s)", "en": "1M (1X) X = negative: values + unbid major(s)"}, {"es": "1M – 2ST = Jacoby (fit 4+, manga+); 1M–4m = splinter", "en": "1M – 2NT = Jacoby (4+ fit, GF); 1M–4m = splinter"}, {"es": "4º color = artificial forzante; busca parada/fit", "en": "4th suit = artificial forcing; seeks stopper/fit"}, {"es": "2♣ fuerte → 2♦ waiting → abridor describe (2ST=22-24)", "en": "Strong 2♣ → 2♦ waiting → opener describes (2NT=22-24)"}, {"es": "Barrera 2: 2ST = Ogust (min/max + palo)", "en": "Weak two: 2NT = Ogust (min/max + suit)"}, {"es": "vs 1ST: X castigo; bicolores (Cappelletti/DONT/Landy)", "en": "vs 1NT: X penalty; two-suiters (Cappelletti/DONT/Landy)"}, {"es": "vs barrera: X informativo; 2ST nat. 15-18", "en": "vs pre-empt: X takeout; 2NT nat. 15-18"}, {"es": "Slam: controles primero, luego Blackwood/RKCB", "en": "Slam: controls first, then Blackwood/RKCB"}]}},
  {"id": 7, "key": "club", "name": {"es": "Nivel 7 · Juego de club", "en": "Level 7 · Club play"}, "sub": {"es": "Mesa, ética, puntuación y técnica práctica", "en": "Table, ethics, scoring and practical technique"}, "dealsTarget": 40, "lessons": [{"id": "k1", "t": {"es": "La mesa y el bidding box", "en": "The table and the bidding box"}, "body": {"es": "En el bridge de club juegas con **estuches (boards)** y **bidding box**. Conviene conocer la mecánica para ir cómodo.\n\n› El estuche (board)\nCada estuche fija las 4 manos, el **repartidor** y la **vulnerabilidad** (impresos en el board). No se baraja: se juega la misma mano en varias mesas y se comparan resultados.\n\n› El bidding box\nEn vez de hablar, sacas tarjetas de puja. Una vez puesta sobre la mesa, la voz **vale**. La caja incluye **Doblo (X)**, **Redoblo (XX)**, **Paso** y, donde se use, la tarjeta **STOP** (antes de un salto) y **Alerta**.\n\n› Alertas y anuncios\nDebes **alertar** las pujas convencionales de tu compañero para que los rivales pregunten su significado. Algunas (1ST, transferencias) se **anuncian** directamente. La regla de oro: **información plena** a los rivales sobre vuestros acuerdos.\n\n› Orden de la mano\nSalida (el de la izquierda del declarante), se baja el **muerto**, y se juega en el sentido de las agujas. El declarante juega muerto y su mano.", "en": "In club bridge you play with **boards** and a **bidding box**. Knowing the mechanics keeps you comfortable.\n\n› The board\nEach board fixes the 4 hands, the **dealer** and the **vulnerability** (printed on it). Cards aren't shuffled: the same deal is played at several tables and results compared.\n\n› The bidding box\nInstead of speaking, you draw bidding cards. Once placed on the table, the call **stands**. The box includes **Double (X)**, **Redouble (XX)**, **Pass** and, where used, the **STOP** card (before a jump) and **Alert**.\n\n› Alerts and announcements\nYou must **alert** partner's conventional calls so opponents can ask their meaning. Some (1NT, transfers) are **announced** directly. The golden rule: **full disclosure** to opponents about your agreements.\n\n› Order of play\nLead (declarer's left), **dummy** comes down, play proceeds clockwise. Declarer plays both dummy and their own hand."}}, {"id": "k2", "t": {"es": "Ética e Información No Autorizada", "en": "Ethics and Unauthorized Information"}, "body": {"es": "La **ética** no es un adorno: es lo que hace justo el juego. El concepto clave es la **Información No Autorizada (INA / UI)**.\n\n› Qué es la INA\nLa información que te llega por medios **ajenos a las pujas y cartas legales**: una **vacilación** de tu compañero, un suspiro, un gesto, la rapidez o lentitud de una voz. Esa información **no puedes usarla**.\n\n› La regla\nSi tu compañero duda y luego pasa, y tú tienes una decisión dudosa, debes elegir la acción que **no** se vea sugerida por esa duda. La norma es **«inclinarte hacia atrás»** para no aprovecharte.\n\n› Información Autorizada\nLo que sí puedes usar: las **pujas y cartas** efectivamente jugadas, y vuestros **acuerdos** declarados. Y debes **revelar** esos acuerdos por completo cuando te preguntan.\n\n› El árbitro es tu amigo\nLlamar al **director** no es acusar a nadie: es el procedimiento normal para resolver una irregularidad o una posible INA. Hazlo con naturalidad y cortesía.", "en": "**Ethics** isn't decoration: it's what keeps the game fair. The key concept is **Unauthorized Information (UI)**.\n\n› What UI is\nInformation reaching you by means **other than legal calls and plays**: partner's **hesitation**, a sigh, a gesture, the speed or slowness of a call. You **may not use** it.\n\n› The rule\nIf partner hesitates and then passes, and you have a close decision, you must choose the action **not** suggested by that hesitation. The standard is to **\"bend over backwards\"** not to profit.\n\n› Authorized information\nWhat you may use: the **calls and cards** actually made, and your disclosed **agreements**. And you must **fully disclose** those agreements when asked.\n\n› The director is your friend\nCalling the **director** isn't accusing anyone: it's the normal procedure to resolve an irregularity or possible UI. Do it naturally and politely."}}, {"id": "k3", "t": {"es": "Reclamar y conceder bazas", "en": "Claiming and conceding"}, "body": {"es": "Saber **reclamar** bien ahorra tiempo y evita errores. Reclamas cuando el resto de bazas es tuyo (o el reparto es claro).\n\n› Cómo se reclama\nMuestras tus cartas y **declaras tu línea de juego** en voz alta: «saco triunfos y las demás son mías», o «todas menos una de tréboles». Sin un enunciado claro, **no reclames**.\n\n› La regla de oro\nAnte una reclamación **dudosa**, la ley resuelve **en contra del que reclama**: cualquier baza que pudiera perderse con un juego normal se concede a la defensa. Por eso solo se reclama cuando está **clarísimo**.\n\n› Conceder\nTambién puedes **conceder** bazas que vas a perder para acelerar. Igual que al reclamar: di tu línea.\n\n› Si dudas, juega\nEn el club, si no estás seguro del orden o de un impasse pendiente, **juega las cartas** una a una en vez de reclamar: es más lento pero más seguro.", "en": "Knowing how to **claim** saves time and avoids errors. You claim when the rest of the tricks are yours (or the layout is clear).\n\n› How to claim\nYou show your cards and **state your line of play** aloud: \"draw trumps and the rest are mine,\" or \"all but one club.\" Without a clear statement, **don't claim**.\n\n› The golden rule\nFor a **doubtful** claim, the law rules **against the claimer**: any trick that could be lost by normal play is awarded to the defense. So only claim when it's **crystal clear**.\n\n› Conceding\nYou can also **concede** tricks you will lose to speed things up. As with claiming: state your line.\n\n› If in doubt, play it out\nAt the club, if you're unsure of the order or a pending finesse, **play the cards** one by one instead of claiming: slower but safer."}}, {"id": "k4", "t": {"es": "Matchpoints vs IMPs", "en": "Matchpoints vs IMPs"}, "body": {"es": "El **tipo de puntuación** cambia tu estrategia más de lo que parece. Las dos grandes son **Matchpoints (MP)** e **IMPs**.\n\n› Matchpoints (parejas)\nCompites contra todas las parejas que jugaron tu mano: cada **bazita extra** y cada tanto cuenta para superar a las otras. Importan los **overtricks**, los partscores disputados y jugar el contrato **más puntuador** (ST sobre menor). Un tanto más que la media puede ser un **top**.\n\n› IMPs (equipos)\nLas diferencias se convierten en una escala (IMPs). Aquí importa **el contrato, no la bazita**: priorizas **cumplir** (jugadas de seguridad) y **acertar mangas/slams**. Un overtrick vale poco; ir abajo en una manga vulnerable, mucho.\n\n› Consecuencias prácticas\n• MP: arriesga por overtricks, compite por parciales, dobla a la ligera con justicia.\n• IMPs: protege el contrato, busca la manga vulnerable «del 40%», evita doblos temerarios.\n\n› Sacrificios\nSacrificarte (irte abajo doblado para perder menos que su manga) es más rentable a **IMPs/parciales** y más delicado a MP.", "en": "The **scoring type** changes your strategy more than you'd think. The two big ones are **Matchpoints (MP)** and **IMPs**.\n\n› Matchpoints (pairs)\nYou compete against every pair that played your deal: each **overtrick** and each point counts to beat the others. **Overtricks**, contested partscores and playing the **best-scoring** contract (NT over a minor) matter. One point above average can be a **top**.\n\n› IMPs (teams)\nDifferences convert to a scale (IMPs). Here **the contract matters, not the overtrick**: you prioritize **making** (safety plays) and getting **games/slams** right. An overtrick is worth little; going down in a vulnerable game, a lot.\n\n› Practical consequences\n• MP: risk for overtricks, fight for partscores, double thin but soundly.\n• IMPs: protect the contract, bid the \"40%\" vulnerable game, avoid reckless doubles.\n\n› Sacrifices\nSacrificing (going down doubled for less than their game) pays more at **IMPs/partials** and is trickier at MP."}}, {"id": "k5", "t": {"es": "Plan de carteo en 3 pasos", "en": "The 3-step play plan"}, "body": {"es": "Antes de jugar a la **primera carta del muerto**, párate y haz un **plan en 3 pasos**. Es el hábito que más bazas gana.\n\n› Paso 1 — Cuenta\nEn **ST**, cuenta tus **ganadores seguros**. En **palo**, cuenta tus **perdedoras**. Compara con lo que necesitas.\n\n› Paso 2 — Plan\n¿De dónde salen las bazas que faltan (ST) o cómo elimino perdedoras (palo)?\n• **Establecer un palo largo** (forzar honores rivales, contar entradas).\n• **Impasse** (finesse) vs **caída** (drop) del honor que falta.\n• **Holdup**: en ST, retén el as del palo de ataque para cortar la comunicación rival.\n• **Ceder (ducking)** una baza pronto para conservar control o entradas.\n• En palo: **fallar** perdedoras en el muerto, **descartar** sobre un palo largo, sacar triunfos en el momento justo.\n\n› Paso 3 — Entradas\nAntes de tocar nada, **cuenta tus entradas** a cada mano. Muchos contratos se caen por quedarse sin entradas para el palo ya establecido.\n\n› Regla\nNo juegues a la primera del tirón. **Piensa primero, juega después.**", "en": "Before playing to the **first card from dummy**, stop and make a **3-step plan**. It's the habit that wins the most tricks.\n\n› Step 1 — Count\nIn **NT**, count your **sure winners**. In a **suit**, count your **losers**. Compare to what you need.\n\n› Step 2 — Plan\nWhere do the missing tricks come from (NT), or how do I get rid of losers (suit)?\n• **Establish a long suit** (force out honors, count entries).\n• **Finesse** vs **drop** of the missing honor.\n• **Holdup**: in NT, hold up the ace of the attacked suit to cut opponents' communication.\n• **Duck** a trick early to keep control or entries.\n• In a suit: **ruff** losers in dummy, **discard** on a long suit, draw trumps at the right moment.\n\n› Step 3 — Entries\nBefore touching anything, **count your entries** to each hand. Many contracts fail from running out of entries to the established suit.\n\n› Rule\nDon't play to trick one on autopilot. **Think first, play second.**"}}, {"id": "k6", "t": {"es": "La salida de defensa", "en": "The opening lead"}, "body": {"es": "La **salida** (opening lead) es la única carta que juegas a ciegas, y a menudo decide el contrato. Hay tablas estándar y, sobre todo, hay que **escuchar la subasta**.\n\n› Reglas de qué carta\n• **Cima de secuencia**: de KQJ sales **K**; de QJT, **Q** (honores tocados).\n• **4ª mejor** de tu palo más largo y fuerte (clásico contra ST).\n• **MUD** (medio-arriba-abajo) de tres cartas pequeñas sin honor.\n• **Singleton** vs palo: buscando fallo (si tienes triunfos).\n• Evita **subsalir** de un As contra palo (sale el As o cambia de palo).\n\n› Qué palo elegir\n• Contra **ST**: ataca tu **palo largo** para establecerlo (cuenta entradas).\n• Contra **palo**: salidas más seguras/activas según la subasta; secuencias, singletons, o el palo que insinuó tu compañero.\n\n› Escucha la subasta\nSi los rivales bidieron dos palos, ataca un tercero; si tu compañero pujó, suele querer **su** palo; si doblaron tu salida cantada, reconsidera.", "en": "The **opening lead** is the only card you play blind, and it often decides the contract. There are standard tables and, above all, you must **listen to the auction**.\n\n› Which card\n• **Top of a sequence**: from KQJ lead the **K**; from QJT, the **Q** (touching honors).\n• **4th best** of your longest, strongest suit (classic vs NT).\n• **MUD** (middle-up-down) from three small cards with no honor.\n• A **singleton** vs a suit contract: seeking a ruff (if you hold trumps).\n• Avoid **underleading an Ace** vs a suit (lead the Ace or switch).\n\n› Which suit\n• Vs **NT**: attack your **long suit** to establish it (count entries).\n• Vs a **suit**: safer/active leads per the auction; sequences, singletons, or the suit partner implied.\n\n› Listen to the auction\nIf opponents bid two suits, attack a third; if partner bid, they usually want **their** suit; if they doubled your suit, reconsider."}}, {"id": "k7", "t": {"es": "Contar la mano", "en": "Counting the hand"}, "body": {"es": "El jugador fuerte **cuenta la mano**: reconstruye la **forma** (y luego los puntos) de los rivales a medida que se juega. Parece difícil; se entrena por pasos.\n\n› Contar un palo\nEmpieza por **un** palo. Suma lo que ves (tu mano + muerto) y deduce cuántas cartas tienen los rivales y **cómo se reparten** según sigan o fallen. Cuando un rival falla, ya sabes su número de partida.\n\n› De la forma a los puntos\nLas **pujas** dan pistas de fuerza y forma; cada baza añade datos. Si un rival mostró 5-5 en dos palos, le quedan 3 cartas para los otros dos: eso **localiza** honores y guía impasses.\n\n› Para qué sirve\nContar decide el **impasse correcto** (¿finesse o caída?), encuentra **squeezes** y **endplays**, y evita líneas perdedoras. La mayoría de las «adivinanzas» de dos vías se resuelven contando.\n\n› Hábito\nDi mentalmente la distribución probable en la **primera baza** y **actualízala** carta a carta. Es el salto de intermedio a avanzado.", "en": "The strong player **counts the hand**: reconstructing opponents' **shape** (then points) as the play unfolds. It looks hard; you train it in steps.\n\n› Count one suit\nStart with **one** suit. Add what you see (your hand + dummy) and deduce how many cards opponents hold and **how they split** as they follow or show out. When an opponent shows out, you know their original count.\n\n› From shape to points\nThe **auction** hints at strength and shape; every trick adds data. If an opponent showed 5-5 in two suits, they have 3 cards for the other two: that **locates** honors and guides finesses.\n\n› What it's for\nCounting decides the **right finesse** (hook or drop?), finds **squeezes** and **endplays**, and avoids losing lines. Most two-way \"guesses\" are solved by counting.\n\n› Habit\nState the likely distribution mentally at **trick one** and **update** it card by card. It's the leap from intermediate to advanced."}}, {"id": "k8", "t": {"es": "Errores de club y cómo evitarlos", "en": "Club mistakes and how to avoid them"}, "body": {"es": "Muchas bazas se pierden por errores **repetidos y evitables**. Conócelos para no caer en ellos.\n\n› Carteo\n• **No sacar triunfos** a tiempo (o sacarlos cuando necesitabas fallar primero).\n• **Cobrar demasiado pronto** los ases y perder el control o las entradas.\n• Jugar a la **primera del tirón** sin plan ni contar.\n• Olvidar **contar entradas** al palo que estableciste.\n\n› Subasta\n• **Pujar dos veces los mismos puntos** (ya describiste tu mano: no la repitas).\n• Confundir voces **forzantes** con invitaciones (y pasar un forzante).\n• Reabrir o competir sin atender a **vulnerabilidad** y forma.\n\n› Defensa\n• Salidas pasivas cuando tocaba **atacar** (o al revés).\n• **Señales descuidadas**: da actitud/cuenta con intención.\n• No **escuchar la subasta** ni contar la mano del declarante.\n\n› Mentalidad\nEl bridge premia el **método**: plan, cuenta y disciplina baten al talento improvisado. Un error menos por mano es muchísimo a lo largo de una sesión.", "en": "Many tricks are lost to **repeated, avoidable** mistakes. Know them so you don't fall in.\n\n› Declarer play\n• **Not drawing trumps** in time (or drawing them when you needed to ruff first).\n• **Cashing aces too early** and losing control or entries.\n• Playing to **trick one on autopilot** with no plan or count.\n• Forgetting to **count entries** to the suit you established.\n\n› Bidding\n• **Bidding the same values twice** (you already described your hand: don't repeat it).\n• Confusing **forcing** calls with invitations (and passing a force).\n• Competing without minding **vulnerability** and shape.\n\n› Defense\n• Passive leads when you should **attack** (or vice versa).\n• **Sloppy signals**: give attitude/count with intent.\n• Not **listening to the auction** or counting declarer's hand.\n\n› Mindset\nBridge rewards **method**: plan, count and discipline beat improvised talent. One fewer error per deal is a lot across a session."}}], "quiz": [{"q": {"es": "La Información No Autorizada incluye...", "en": "Unauthorized Information includes..."}, "opts": [{"es": "las pujas hechas", "en": "the calls made"}, {"es": "la vacilación de tu compañero", "en": "partner's hesitation"}, {"es": "vuestros acuerdos", "en": "your agreements"}, {"es": "el muerto", "en": "the dummy"}], "a": 1}, {"q": {"es": "Ante una reclamación dudosa, la ley falla...", "en": "A doubtful claim is ruled..."}, "opts": [{"es": "a favor del que reclama", "en": "for the claimer"}, {"es": "en contra del que reclama", "en": "against the claimer"}, {"es": "se repite la mano", "en": "replay the hand"}, {"es": "la decide el muerto", "en": "dummy decides"}], "a": 1}, {"q": {"es": "A Matchpoints importan especialmente...", "en": "At Matchpoints what matters most is..."}, "opts": [{"es": "solo cumplir", "en": "just making"}, {"es": "las bazitas extra (overtricks)", "en": "the overtricks"}, {"es": "nunca los parciales", "en": "never partscores"}, {"es": "solo los slams", "en": "only slams"}], "a": 1}, {"q": {"es": "A IMPs priorizas...", "en": "At IMPs you prioritize..."}, "opts": [{"es": "overtricks", "en": "overtricks"}, {"es": "cumplir el contrato (seguridad)", "en": "making the contract (safety)"}, {"es": "doblar siempre", "en": "always doubling"}, {"es": "salir activo siempre", "en": "always active leads"}], "a": 1}, {"q": {"es": "Primer paso del plan de carteo en ST:", "en": "First step of the NT play plan:"}, "opts": [{"es": "sacar triunfos", "en": "draw trumps"}, {"es": "contar ganadores seguros", "en": "count sure winners"}, {"es": "fallar", "en": "ruff"}, {"es": "reclamar", "en": "claim"}], "a": 1}, {"q": {"es": "Contra ST, normalmente sales...", "en": "Vs NT you usually lead..."}, "opts": [{"es": "4ª mejor de tu palo largo", "en": "4th best of your long suit"}, {"es": "un triunfo", "en": "a trump"}, {"es": "tu carta más alta", "en": "your highest card"}, {"es": "siempre un singleton", "en": "always a singleton"}], "a": 0}, {"q": {"es": "«Pujar dos veces los mismos puntos» es...", "en": "\"Bidding the same values twice\" is..."}, "opts": [{"es": "buena técnica", "en": "good technique"}, {"es": "un error de subasta", "en": "a bidding error"}, {"es": "obligatorio", "en": "mandatory"}, {"es": "una convención", "en": "a convention"}], "a": 1}], "flash": [{"f": {"es": "INA / UI", "en": "UI"}, "b": {"es": "info por vacilación/tempo: no usarla", "en": "info from hesitation/tempo: don't use it"}}, {"f": {"es": "Información plena", "en": "Full disclosure"}, "b": {"es": "revela tus acuerdos a los rivales", "en": "reveal your agreements to opponents"}}, {"f": {"es": "Reclamación dudosa", "en": "Doubtful claim"}, "b": {"es": "falla contra el que reclama", "en": "ruled against the claimer"}}, {"f": {"es": "Matchpoints", "en": "Matchpoints"}, "b": {"es": "cuentan overtricks y parciales", "en": "overtricks and partscores count"}}, {"f": {"es": "IMPs", "en": "IMPs"}, "b": {"es": "cumple; seguridad; acierta manga/slam", "en": "make it; safety; right game/slam"}}, {"f": {"es": "Plan 3 pasos", "en": "3-step plan"}, "b": {"es": "cuenta · plan · entradas", "en": "count · plan · entries"}}, {"f": {"es": "Holdup", "en": "Holdup"}, "b": {"es": "retén el as para cortar comunicación", "en": "hold up the ace to cut communication"}}, {"f": {"es": "4ª mejor", "en": "4th best"}, "b": {"es": "salida clásica contra ST", "en": "classic lead vs NT"}}, {"f": {"es": "Contar la mano", "en": "Count the hand"}, "b": {"es": "forma → puntos, baza a baza", "en": "shape → points, trick by trick"}}, {"f": {"es": "Sacar triunfos", "en": "Draw trumps"}, "b": {"es": "sí, salvo que necesites fallar antes", "en": "yes, unless you must ruff first"}}], "cheat": {"title": {"es": "Chuleta · Juego de club", "en": "Cheat sheet · Club play"}, "rows": [{"es": "INA: no uses vacilaciones/tempo; revela acuerdos; llama al director con naturalidad", "en": "UI: don't use hesitation/tempo; disclose agreements; call the director naturally"}, {"es": "Reclama solo si está clarísimo y di tu línea; la duda falla contra ti", "en": "Claim only when crystal clear and state your line; doubt rules against you"}, {"es": "MP: overtricks y parciales · IMPs: cumplir, seguridad, manga/slam", "en": "MP: overtricks & partials · IMPs: make it, safety, game/slam"}, {"es": "Carteo: 1) cuenta 2) plan 3) entradas — antes de la 1ª carta", "en": "Play: 1) count 2) plan 3) entries — before card one"}, {"es": "ST: establece tu palo largo, holdup, cuenta entradas", "en": "NT: establish your long suit, holdup, count entries"}, {"es": "Palo: saca triunfos (salvo fallo previo), falla/descarta perdedoras", "en": "Suit: draw trumps (unless ruff first), ruff/discard losers"}, {"es": "Salida: cima de secuencia / 4ª mejor / MUD; escucha la subasta", "en": "Lead: top of sequence / 4th best / MUD; listen to the auction"}, {"es": "Cuenta la mano: forma primero, luego puntos; resuelve impasses", "en": "Count the hand: shape first, then points; solves finesses"}]}},
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
  // Suit-preference (Lavinthal) discard: vs a suit contract there are exactly two other side suits;
  // a high spot of the worthless suit points to the higher-ranked of them, a low spot to the lower.
  if (trump !== "ST") {
    const others = SUITS.filter(s => s !== trump && s !== best);
    if (others.length === 2) {
      const hv = c => ({ A: 4, K: 3, Q: 2, J: 1 }[c.r] || 0);
      const str = s => (m[s] || []).reduce((t, c) => t + hv(c), 0);
      const d = str(others[0]) - str(others[1]); // others[0] is the higher-ranked suit
      if (Math.abs(d) >= 2) {
        const descBest = m[best].slice().sort((a, b) => RVAL[b.r] - RVAL[a.r]);
        const sig = signalSpot(descBest, d > 0);
        if (sig) return sig;
      }
    }
  }
  return lowestCard(m[best]);
}

// Stronger defender AI. Sees own hand, current trick, trump, partner seat, and cards already played.
// Choose which low SPOT card (2..9) to play to encode a signal; null if not enough spots.
// wantHigh=true -> highest spot (encourage / even count / higher suit); else lowest spot.
function signalSpot(inSuitDesc, wantHigh) {
  const spots = inSuitDesc.filter(c => RVAL[c.r] <= 9);
  if (spots.length <= 1) return null;
  return wantHigh ? spots[0] : spots[spots.length - 1];
}

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
    // Attitude signal: encourage (high spot) with an honour in the suit or a doubleton (ruff hope), else discourage (low spot).
    const like = inSuit.some(c => RVAL[c.r] >= 12) || (suitContract && inSuit.length === 2);
    return signalSpot(inSuit, like) || lowestCard(inSuit);
  }

  // 2nd hand (an opponent led and is winning)
  if (pos === 1) {
    // Cover an honor with an honor: if led card is J+ and we hold the next card up, cover cheaply.
    if (isHonor(curWin)) {
      const covers = beats.filter(isHonor).sort((a, b) => RVAL[a.r] - RVAL[b.r]);
      if (covers.length) { const idx = inSuit.findIndex(c => cardEq(c, covers[0])); return lowestOfRun(inSuit, idx); }
    }
    // Count signal: even length -> high spot first (high-low); odd -> low spot.
    return signalSpot(inSuit, inSuit.length % 2 === 0) || lowestCard(inSuit); // second hand low
  }

  // 3rd hand high (partner led, opponent played 2nd and may be winning)
  if (pos === 2) {
    if (beats.length) { const top = beats[0]; const idx = inSuit.findIndex(c => cardEq(c, top)); return lowestOfRun(inSuit, idx); }
    // can't beat -> attitude signal to partner who led
    const like = inSuit.some(c => RVAL[c.r] >= 12) || (suitContract && inSuit.length === 2);
    return signalSpot(inSuit, like) || lowestCard(inSuit);
  }

  // 4th hand: win as cheaply as possible, else low
  if (beats.length) { const cheap = beats.sort((a, b) => RVAL[a.r] - RVAL[b.r])[0]; return cheap; }
  return lowestCard(inSuit);
}

// Declarer-side auto-play (used when the human is defending). Reasonable, not expert.
function cardWinsTrick(card, trick, trump) {
  if (!trick.length) return true;
  return trickWinner([...trick, { seat: "__t", card }], trump) === "__t";
}
function declarerAuto(seat, g) {
  const hand = g.hands[seat], trick = g.trick, trump = g.trump;
  const led = trick.length ? trick[0].card.s : null;
  const legal = legalCards(hand, led);
  if (!legal.length) return null;
  const hi = arr => arr.slice().sort((a, b) => RVAL[b.r] - RVAL[a.r]);
  const lo = arr => arr.slice().sort((a, b) => RVAL[a.r] - RVAL[b.r]);
  if (!trick.length) {
    // leading: draw trumps if defenders still hold some and we have trumps
    if (trump !== "ST") {
      const declSide = (seat === "N" || seat === "S") ? ["N", "S"] : ["E", "W"];
      const defs = ["N", "E", "S", "W"].filter(s => !declSide.includes(s));
      const out = defs.reduce((n, s) => n + g.hands[s].filter(c => c.s === trump).length, 0);
      const myTr = hand.filter(c => c.s === trump);
      if (myTr.length && out > 0 && hi(myTr)[0] && RVAL[hi(myTr)[0].r] >= 11) return hi(myTr)[0];
    }
    // otherwise cash/establish: lead highest card of longest non-trump suit
    const suits = ["♠", "♥", "♦", "♣"].filter(s => trump === "ST" || s !== trump);
    let best = null;
    for (const s of suits) { const cs = hand.filter(c => c.s === s); if (cs.length && (!best || cs.length > best.len)) best = { s, len: cs.length }; }
    if (best) return hi(hand.filter(c => c.s === best.s))[0];
    return hi(hand)[0];
  }
  const winning = trickWinner(trick, trump);
  const partnerWinning = winning === partnerOf(seat);
  const lastToPlay = trick.length === 3;
  const canWin = legal.filter(c => cardWinsTrick(c, trick, trump));
  if (partnerWinning) return lo(legal)[0];               // partner has it: play low
  if (canWin.length) return lo(canWin)[0];               // win as cheaply as possible
  return lo(legal)[0];                                   // can't win: low
}

// ----- Difficulty-tiered card AI -----
function seatsAfterN(seat, count) { const out = []; let s = seat; for (let i = 0; i < count; i++) { s = nextSeat(s); out.push(s); } return out; }
function canAnyBeat(partial, opps, g, trump) {
  const led = partial[0].card.s;
  for (const o of opps) { const lc = legalCards(g.hands[o], led); if (lc.some(c => trickWinner([...partial, { seat: o, card: c }], trump) === o)) return true; }
  return false;
}
function topRemaining(g, suit) { let best = -1; for (const s of ["N", "E", "S", "W"]) for (const c of g.hands[s]) if (c.s === suit && RVAL[c.r] > best) best = RVAL[c.r]; return best; }
function oppVoidInSuit(g, seat, suit) { const opps = sideOfSeat(seat) === "NS" ? ["E", "W"] : ["N", "S"]; return opps.some(o => g.hands[o].every(c => c.s !== suit)); }

// Principiante: weak — leads low, only grabs a trick when last to play and partner isn't winning.
function playEasy(seat, g) {
  const hand = g.hands[seat], trick = g.trick, trump = g.trump, led = trick.length ? trick[0].card.s : null;
  const legal = legalCards(hand, led); if (!legal.length) return null;
  const lo = a => a.slice().sort((x, y) => RVAL[x.r] - RVAL[y.r]);
  if (!trick.length) return lo(legal)[0];
  if (trick.length === 3) { const w = trickWinner(trick, trump); if (w !== partnerOf(seat)) { const cw = legal.filter(c => cardWinsTrick(c, trick, trump)); if (cw.length) return lo(cw)[0]; } }
  return lo(legal)[0];
}

// Experto: perfect-information FOLLOW play (returns null when leading, so the tuned lead is kept).
function strongFollow(seat, g) {
  const hand = g.hands[seat], trick = g.trick, trump = g.trump, led = trick.length ? trick[0].card.s : null;
  if (!trick.length) return null;
  const legal = legalCards(hand, led); if (!legal.length) return null;
  const lo = a => a.slice().sort((x, y) => RVAL[x.r] - RVAL[y.r]);
  const partner = partnerOf(seat);
  const winner = trickWinner(trick, trump);
  const oppsAfter = seatsAfterN(seat, 3 - trick.length).filter(s => sideOfSeat(s) !== sideOfSeat(seat));
  if (winner === partner) {
    // partner is winning: if an opponent still to play can steal it and I can stop that by winning, do so cheaply; else keep low
    if (oppsAfter.length && canAnyBeat(trick, oppsAfter, g, trump)) {
      const canWin = legal.filter(c => cardWinsTrick(c, trick, trump));
      const safe = canWin.filter(c => !canAnyBeat([...trick, { seat, card: c }], oppsAfter, g, trump));
      if (safe.length) return lo(safe)[0];
    }
    return lo(legal)[0];
  }
  const canWin = legal.filter(c => cardWinsTrick(c, trick, trump));
  if (canWin.length) {
    const safe = canWin.filter(c => !canAnyBeat([...trick, { seat, card: c }], oppsAfter, g, trump));
    return (safe.length ? lo(safe) : lo(canWin))[0];
  }
  // cannot win: ruff low (safe) if void in led under a trump contract, else discard lowest
  if (led && hand.every(c => c.s !== led) && trump !== "ST") {
    const trumps = legal.filter(c => c.s === trump);
    for (const t of lo(trumps)) { const p = [...trick, { seat, card: t }]; if (trickWinner(p, trump) === seat && !canAnyBeat(p, oppsAfter, g, trump)) return t; }
  }
  return lo(legal)[0];
}

// ----- Double-dummy endgame solver (alpha-beta + equivalent-card reduction + node cap) -----
const DDS_MAX = 6;          // invoke exact search once each hand holds <= this many cards
const DDS_NODE_CAP = 120000; // abort + fall back to heuristic if a search exceeds this
let _ddsNodes = 0;
const DDS_ABORT = { abort: true };
function reduceMoves(legal, hands, turn) {
  const bySuit = {};
  for (const c of legal) (bySuit[c.s] = bySuit[c.s] || []).push(c);
  const reps = [];
  for (const s in bySuit) {
    const mine = bySuit[s].slice().sort((a, b) => RVAL[b.r] - RVAL[a.r]);
    const others = new Set();
    for (const seat of ["N", "E", "S", "W"]) if (seat !== turn) for (const c of hands[seat]) if (c.s === s) others.add(RVAL[c.r]);
    let i = 0;
    while (i < mine.length) {
      let j = i;
      while (j + 1 < mine.length) {
        const hiR = RVAL[mine[j].r], loR = RVAL[mine[j + 1].r];
        let gap = false;
        for (const r of others) if (r < hiR && r > loR) { gap = true; break; }
        if (gap) break;
        j++;
      }
      reps.push(mine[j]);
      i = j + 1;
    }
  }
  return reps;
}
function ddsSolve(hands, trump, trick, turn, declSide, declWon, alpha, beta) {
  if (++_ddsNodes > DDS_NODE_CAP) throw DDS_ABORT;
  if (trick.length === 4) {
    const w = trickWinner(trick, trump);
    const nd = declWon + (sideOfSeat(w) === declSide ? 1 : 0);
    if (hands.N.length + hands.E.length + hands.S.length + hands.W.length === 0) return nd;
    return ddsSolve(hands, trump, [], w, declSide, nd, alpha, beta);
  }
  const led = trick.length ? trick[0].card.s : null;
  const moves = reduceMoves(legalCards(hands[turn], led), hands, turn);
  moves.sort((a, b) => RVAL[b.r] - RVAL[a.r]);
  const maxing = sideOfSeat(turn) === declSide;
  let best = maxing ? -1 : 99;
  for (const c of moves) {
    const nh = { N: hands.N, E: hands.E, S: hands.S, W: hands.W };
    nh[turn] = hands[turn].filter(x => !(x.s === c.s && x.r === c.r));
    const nt = [...trick, { seat: turn, card: c }];
    const val = ddsSolve(nh, trump, nt, nt.length < 4 ? nextSeat(turn) : turn, declSide, declWon, alpha, beta);
    if (maxing) { if (val > best) best = val; if (best > alpha) alpha = best; }
    else { if (val < best) best = val; if (best < beta) beta = best; }
    if (beta <= alpha) break;
  }
  return best;
}
function ddsPick(g, seat, declarer) {
  const declSide = sideOfSeat(declarer);
  const led = g.trick.length ? g.trick[0].card.s : null;
  const moves = reduceMoves(legalCards(g.hands[seat], led), g.hands, seat);
  const maxing = sideOfSeat(seat) === declSide;
  let best = null, bestVal = maxing ? -1 : 99, alpha = -1, beta = 99;
  _ddsNodes = 0;
  try {
    for (const c of moves) {
      const nh = { N: g.hands.N, E: g.hands.E, S: g.hands.S, W: g.hands.W };
      nh[seat] = g.hands[seat].filter(x => !(x.s === c.s && x.r === c.r));
      const nt = [...g.trick, { seat, card: c }];
      const val = ddsSolve(nh, g.trump, nt, nt.length < 4 ? nextSeat(seat) : seat, declSide, 0, alpha, beta);
      if (maxing) { if (val > bestVal) { bestVal = val; best = c; } if (bestVal > alpha) alpha = bestVal; }
      else { if (val < bestVal) { bestVal = val; best = c; } if (bestVal < beta) beta = bestVal; }
    }
  } catch (e) { if (e === DDS_ABORT) return null; throw e; }
  return best;
}

function ddsValue(hands, trump, trick, turn, declarer) {
  _ddsNodes = 0;
  try { return ddsSolve(hands, trump, trick, turn, sideOfSeat(declarer), 0, -1, 99); }
  catch (e) { if (e === DDS_ABORT) return null; throw e; }
}

const DDS_BODY = `
var RV={A:14,K:13,Q:12,J:11,T:10,"9":9,"8":8,"7":7,"6":6,"5":5,"4":4,"3":3,"2":2};
var ORD=["N","E","S","W"];
function nextSeat(s){return ORD[(ORD.indexOf(s)+1)%4];}
function side(s){return (s==="N"||s==="S")?"NS":"EW";}
function partner(s){return {N:"S",S:"N",E:"W",W:"E"}[s];}
function legalC(hand, led){ if(!led) return hand.slice(); var f=hand.filter(function(c){return c.s===led;}); return f.length?f:hand.slice(); }
function winnerOf(trick, trump){
  var best=trick[0], bestV=(best.card.s===trump?100:0)+RV[best.card.r], ledS=trick[0].card.s;
  for(var i=1;i<trick.length;i++){ var c=trick[i].card; var v; if(c.s===trump) v=100+RV[c.r]; else if(c.s===ledS) v=RV[c.r]; else v=-1; if(v>bestV){bestV=v;best=trick[i];} }
  return best.seat;
}
function lowest(a){ var b=a[0]; for(var i=1;i<a.length;i++) if(RV[a[i].r]<RV[b.r]) b=a[i]; return b; }
function reduceMoves(legal, hands, turn){
  var bySuit={}; for(var i=0;i<legal.length;i++){ var c=legal[i]; (bySuit[c.s]=bySuit[c.s]||[]).push(c); }
  var reps=[];
  for(var s in bySuit){
    var mine=bySuit[s].slice().sort(function(a,b){return RV[b.r]-RV[a.r];});
    var others={}; for(var k=0;k<ORD.length;k++){ var seat=ORD[k]; if(seat===turn) continue; var h=hands[seat]; for(var j=0;j<h.length;j++) if(h[j].s===s) others[RV[h[j].r]]=1; }
    var i2=0;
    while(i2<mine.length){
      var jj=i2;
      while(jj+1<mine.length){ var hiR=RV[mine[jj].r], loR=RV[mine[jj+1].r], gap=false; for(var r in others){ var rr=+r; if(rr<hiR&&rr>loR){gap=true;break;} } if(gap)break; jj++; }
      reps.push(mine[jj]); i2=jj+1;
    }
  }
  return reps;
}
function bestMove(data){ return searchRoot(data,false); }
function bestValueOf(data){ return searchRoot(data,true); }
var G_trump, G_declSide, G_deadline, G_nodes;
function tickG(){ if(((++G_nodes)&1023)===0 && Date.now()>G_deadline) throw "T"; }
function estimateG(h,tk,tn,dw){
  h={N:h.N.slice(),E:h.E.slice(),S:h.S.slice(),W:h.W.slice()}; tk=tk.slice(); var decl=dw;
  while(h.N.length+h.E.length+h.S.length+h.W.length>0){
    var ld=tk.length?tk[0].card.s:null; var lg=legalC(h[tn],ld); var card;
    if(!tk.length){ card=lowest(lg); }
    else { var win=winnerOf(tk,G_trump); if(win===partner(tn)){ card=lowest(lg); } else { var cw=lg.filter(function(c){ return winnerOf(tk.concat([{seat:tn,card:c}]),G_trump)===tn; }); card=cw.length?lowest(cw):lowest(lg); } }
    h[tn]=h[tn].filter(function(c){return !(c.s===card.s&&c.r===card.r);});
    tk=tk.concat([{seat:tn,card:card}]);
    if(tk.length===4){ var w=winnerOf(tk,G_trump); if(side(w)===G_declSide)decl++; tn=w; tk=[]; } else tn=nextSeat(tn);
  }
  return decl;
}
function abG(h,tk,tn,dw,alpha,beta,depth){
  tickG();
  if(tk.length===4){ var w=winnerOf(tk,G_trump); var nd=dw+(side(w)===G_declSide?1:0); if(h.N.length+h.E.length+h.S.length+h.W.length===0) return nd; return abG(h,[],w,nd,alpha,beta,depth); }
  if(depth<=0) return estimateG(h,tk,tn,dw);
  var ld=tk.length?tk[0].card.s:null; var mv=reduceMoves(legalC(h[tn],ld),h,tn); mv.sort(function(a,b){return RV[b.r]-RV[a.r];});
  var mx=side(tn)===G_declSide; var bst=mx?-1:99;
  for(var i=0;i<mv.length;i++){ var c=mv[i]; var nh={N:h.N,E:h.E,S:h.S,W:h.W}; nh[tn]=h[tn].filter(function(x){return !(x.s===c.s&&x.r===c.r);}); var nt=tk.concat([{seat:tn,card:c}]); var v=abG(nh,nt,nt.length<4?nextSeat(tn):tn,dw,alpha,beta,depth-1); if(mx){ if(v>bst)bst=v; if(bst>alpha)alpha=bst; } else { if(v<bst)bst=v; if(bst<beta)beta=bst; } if(beta<=alpha) break; }
  return bst;
}
function searchRoot(data, wantValue){
  var hands={N:data.hands.N.slice(),E:data.hands.E.slice(),S:data.hands.S.slice(),W:data.hands.W.slice()};
  var trump=data.trump, trick=data.trick.slice(), turn=data.turn, declarer=data.declarer;
  G_declSide=side(declarer); G_trump=trump; G_deadline=Date.now()+(data.budgetMs||3000); G_nodes=0;
  var led=trick.length?trick[0].card.s:null;
  var rootMoves=reduceMoves(legalC(hands[turn],led),hands,turn);
  if(!rootMoves.length) return wantValue?{value:0,exact:true}:null;
  rootMoves.sort(function(a,b){return RV[b.r]-RV[a.r];});
  var maxing=side(turn)===G_declSide;
  var best=rootMoves[0];
  var total=hands.N.length+hands.E.length+hands.S.length+hands.W.length;
  var lastValue=0, exact=false;
  for(var depth=4; depth<=total+1; depth+=2){
    try{
      var bv=maxing?-1:99, bm=best, a=-1, b=99;
      for(var i=0;i<rootMoves.length;i++){ var c=rootMoves[i]; var nh={N:hands.N,E:hands.E,S:hands.S,W:hands.W}; nh[turn]=hands[turn].filter(function(x){return !(x.s===c.s&&x.r===c.r);}); var nt=trick.concat([{seat:turn,card:c}]); var v=abG(nh,nt,nt.length<4?nextSeat(turn):turn,0,a,b,depth-1); if(maxing){ if(v>bv){bv=v;bm=c;} if(bv>a)a=bv; } else { if(v<bv){bv=v;bm=c;} if(bv<b)b=bv; } }
      best=bm; lastValue=bv;
      if(depth>=total){ exact=true; break; }
    }catch(e){ if(e==="T") break; else throw e; }
  }
  return wantValue ? {value:lastValue, exact:exact} : best;
}
function ddfValue(handsObj, trumpSym, trickArr, turnSeat, declarerSeat, cap){
  var SU={ "\u2660":0,"\u2665":1,"\u2666":2,"\u2663":3 }; var SEATI={N:0,E:1,S:2,W:3}; var SEATS=["N","E","S","W"];
  var trump = trumpSym==="ST" ? -1 : SU[trumpSym];
  var declSide = (declarerSeat==="N"||declarerSeat==="S") ? 0 : 1;
  var m=[[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];
  for(var si=0;si<4;si++){ var arr=handsObj[SEATS[si]]; for(var ci=0;ci<arr.length;ci++){ m[si][SU[arr[ci].s]] |= (1<<RV[arr[ci].r]); } }
  var trick=[]; var tl=trickArr?trickArr.length:0; for(var ti=0;ti<tl;ti++){ var tt=trickArr[ti]; trick.push({p:SEATI[tt.seat], s:SU[tt.card.s], r:RV[tt.card.r]}); }
  var turn=SEATI[turnSeat]; var TT={}; var nodes=0; var CAP=cap||1200000; var ABORT=false;
  function sideOf(p){ return (p===0||p===2)?0:1; }
  function tw(cards){ var best=cards[0]; for(var i=1;i<4;i++){ var c=cards[i]; var cT=(c.s===trump),bT=(best.s===trump); if(cT&&!bT) best=c; else if(cT===bT){ if(c.s===best.s && c.r>best.r) best=c; } } return best.p; }
  function mv(hh,p,led){ var out=[]; var suits=(led>=0 && hh[p][led])?[led]:[0,1,2,3];
    for(var k=0;k<suits.length;k++){ var s=suits[k]; var mm=hh[p][s]; if(!mm) continue; var present=hh[0][s]|hh[1][s]|hh[2][s]|hh[3][s];
      for(var r=14;r>=2;r--){ if(!(mm&(1<<r))) continue; var lower=-1; for(var q=r-1;q>=2;q--){ if(present&(1<<q)){ lower=q; break; } } if(lower>=0 && (mm&(1<<lower))) continue; out.push({s:s,r:r}); } }
    return out; }
  function ky(hh,t){ var k=t+""; for(var s=0;s<4;s++){ var present=hh[0][s]|hh[1][s]|hh[2][s]|hh[3][s]; var c0=0,c1=0,c2=0,c3=0,idx=0;
      for(var r=14;r>=2;r--){ if(present&(1<<r)){ if(hh[0][s]&(1<<r))c0|=(1<<idx); if(hh[1][s]&(1<<r))c1|=(1<<idx); if(hh[2][s]&(1<<r))c2|=(1<<idx); if(hh[3][s]&(1<<r))c3|=(1<<idx); idx++; } } k+="|"+c0+","+c1+","+c2+","+c3; } return k; }
  function emptyH(hh){ for(var p=0;p<4;p++) for(var s=0;s<4;s++) if(hh[p][s]) return false; return true; }
  function rec(hh,tr,tn,alpha,beta){
    if(++nodes>CAP){ ABORT=true; return 0; }
    if(tr.length===4){ var w=tw(tr); var inc=(sideOf(w)===declSide)?1:0; return inc+rec(hh,[],w,alpha-inc,beta-inc); }
    if(emptyH(hh) && tr.length===0) return 0;
    var useTT=(tr.length===0), kk;
    if(useTT){ kk=ky(hh,tn); var e=TT[kk]; if(e){ if(e.lo>=beta) return e.lo; if(e.hi<=alpha) return e.hi; if(e.lo>alpha)alpha=e.lo; if(e.hi<beta)beta=e.hi; if(alpha>=beta) return alpha; } }
    var a0=alpha,b0=beta; var led=tr.length?tr[0].s:-1; var list=mv(hh,tn,led); var maxing=(sideOf(tn)===declSide); var best=maxing?-1:99;
    for(var i2=0;i2<list.length;i2++){ var c=list[i2]; hh[tn][c.s]&=~(1<<c.r); var ntr=tr.concat([{p:tn,s:c.s,r:c.r}]); var v=rec(hh,ntr,(tn+1)%4,alpha,beta); hh[tn][c.s]|=(1<<c.r); if(ABORT) return 0;
      if(maxing){ if(v>best)best=v; if(best>alpha)alpha=best; } else { if(v<best)best=v; if(best<beta)beta=best; } if(alpha>=beta) break; }
    if(useTT){ var lo=-1,hi=99; if(best<=a0)hi=best; else if(best>=b0)lo=best; else {lo=best;hi=best;} var e2=TT[kk]||{lo:-1,hi:99}; if(lo>e2.lo)e2.lo=lo; if(hi<e2.hi)e2.hi=hi; TT[kk]=e2; }
    return best;
  }
  var total=0; for(var p=0;p<4;p++){ for(var s=0;s<4;s++){ var x=m[p][s]; while(x){ x&=x-1; total++; } } }
  var tricksLeft=((total + trick.length)/4)|0; var lo=0, hi=tricksLeft;
  while(lo<hi){ var mid=Math.floor((lo+hi+1)/2); var hc=[m[0].slice(),m[1].slice(),m[2].slice(),m[3].slice()]; var v=rec(hc, trick.slice(), turn, mid-1, mid); if(ABORT) return {value:-1, exact:false}; if(v>=mid) lo=mid; else hi=mid-1; }
  return { value: lo, exact: true };
}
function analyzeOf(data){
  var trump=data.trump, declarer=data.declarer, threshold=data.threshold||40, cap=data.cap||1200000;
  var declSide=side(declarer), userDeclares=declSide==="NS";
  var userSeats = userDeclares ? [declarer, partner(declarer)] : ["S"];
  var hands={N:data.hands.N.slice(),E:data.hands.E.slice(),S:data.hands.S.slice(),W:data.hands.W.slice()};
  var seq=[], leader=nextSeat(declarer), tk=[];
  for(var i=0;i<data.played.length;i++){ var card=data.played[i]; var seat=ORD[(ORD.indexOf(leader)+tk.length)%4]; seq.push({seat:seat,card:card}); tk.push({seat:seat,card:card}); if(tk.length===4){ leader=winnerOf(tk,trump); tk=[]; } }
  function val(trickX,turnX,already){ var r=ddfValue(hands,trump,trickX,turnX,declarer,cap); if(!r.exact) return null; return already+r.value; }
  function bestAltCard(handsB,trickB,seat,dwB,maximize){ var led=trickB.length?trickB[0].card.s:null; var legal=legalC(handsB[seat],led); var scored=[];
    for(var j=0;j<legal.length;j++){ var lc=legal[j]; var h={N:handsB.N.slice(),E:handsB.E.slice(),S:handsB.S.slice(),W:handsB.W.slice()}; h[seat]=h[seat].filter(function(c){return !(c.s===lc.s&&c.r===lc.r);}); var nt=trickB.concat([{seat:seat,card:lc}]); var turnX,trickX,dW=dwB;
      if(nt.length===4){ var w=winnerOf(nt,trump); dW+=side(w)===declSide?1:0; turnX=w; trickX=[]; } else { turnX=ORD[(ORD.indexOf(seat)+1)%4]; trickX=nt; }
      var rr=ddfValue(h,trump,trickX,turnX,declarer,cap); if(!rr.exact) continue; scored.push({card:lc, total:dW+rr.value}); }
    if(!scored.length) return {best:null, bestCards:[]};
    var bestV=maximize?-1:99; for(var s2=0;s2<scored.length;s2++){ if(maximize?scored[s2].total>bestV:scored[s2].total<bestV) bestV=scored[s2].total; }
    var bestCards=[]; for(var s3=0;s3<scored.length;s3++){ if(scored[s3].total===bestV) bestCards.push(scored[s3].card); }
    return {best:bestCards[0]||null, bestCards:bestCards}; }
  var trick=[], declWon=0, findings=[], analyzedFrom=null;
  function remaining(){ return hands.N.length+hands.E.length+hands.S.length+hands.W.length; }
  for(var k=0;k<seq.length;k++){ var seat=seq[k].seat, card=seq[k].card; var rem=remaining(); var tractable=rem<=threshold;
    var handsBefore=null, trickBefore=trick.slice(), dwBefore=declWon, vBefore=null;
    if(tractable){ handsBefore={N:hands.N.slice(),E:hands.E.slice(),S:hands.S.slice(),W:hands.W.slice()}; vBefore=val(trick,seat,declWon); }
    hands[seat]=hands[seat].filter(function(c){return !(c.s===card.s&&c.r===card.r);});
    var nt=trick.concat([{seat:seat,card:card}]), nextTurn, nextTrick;
    if(nt.length===4){ var w=winnerOf(nt,trump); declWon+=side(w)===declSide?1:0; nextTurn=w; nextTrick=[]; } else { nextTurn=ORD[(ORD.indexOf(seat)+1)%4]; nextTrick=nt; }
    var vAfter=tractable?val(nextTrick,nextTurn,declWon):null;
    if(vBefore!=null && vAfter!=null){ if(analyzedFrom==null) analyzedFrom=k; var moverDecl=side(seat)===declSide; var lost=moverDecl?(vBefore-vAfter):(vAfter-vBefore);
      if(userSeats.indexOf(seat)>=0 && lost>0){ var ba=bestAltCard(handsBefore,trickBefore,seat,dwBefore,userDeclares); findings.push({trickNo:Math.floor(k/4)+1, ply:k, seat:seat, card:card, lost:lost, better:ba.best, bestCards:ba.bestCards}); } }
    trick=nextTrick; }
  return { made:declWon, findings:findings, analyzedFromTrick: analyzedFrom==null?null:Math.floor(analyzedFrom/4)+1, userDeclares:userDeclares };
}
`;
const DDS_WORKER_SRC = DDS_BODY + "\nonmessage=function(e){ if(e.data&&e.data.want===\"analyze\"){ postMessage(analyzeOf(e.data)); } else if(e.data&&e.data.want===\"value\"){ postMessage(bestValueOf(e.data)); } else { postMessage(bestMove(e.data)); } };";

// Dispatcher: choose a card for a non-user seat by difficulty.
function aiCard(seat, g, skill, declarer) {
  if (skill === "easy") return playEasy(seat, g);
  const onDecl = sideOfSeat(seat) === sideOfSeat(declarer);
  const base = onDecl ? declarerAuto(seat, g) : defenderPlay(g.hands[seat], g.trick, g.trump, partnerOf(seat), g.played);
  if (skill !== "hard") return base;                        // medium: tuned engines
  if (g.hands[seat].length <= DDS_MAX) { const c = ddsPick(g, seat, declarer); if (c) return c; } // expert endgame: exact double-dummy
  if (!g.trick.length) return base;                          // expert early: tuned lead
  return strongFollow(seat, g) || base;                      // expert early: perfect-info follow
}

// ----- Duplicate scoring + vulnerability -----
const VUL_SCHEDULE = ["O", "N", "E", "B", "N", "E", "B", "O", "E", "B", "O", "N", "B", "O", "N", "E"];
function vulForSeed(seed) {
  const st = VUL_SCHEDULE[(Math.abs(seed | 0)) % 16];
  return { NS: st === "N" || st === "B", EW: st === "E" || st === "B", label: st };
}
function duplicateScore({ level, strain, tricks, vul, dbl }) {
  const need = 6 + level;
  const mult = dbl === "XX" ? 4 : dbl === "X" ? 2 : 1;
  if (tricks >= need) {
    const per = (strain === "♣" || strain === "♦") ? 20 : 30;
    let trickPts = strain === "ST" ? 40 + 30 * (level - 1) : per * level;
    trickPts *= mult;
    let score = trickPts;
    score += trickPts >= 100 ? (vul ? 500 : 300) : 50;       // game / partscore
    if (level === 6) score += vul ? 750 : 500;                // small slam
    if (level === 7) score += vul ? 1500 : 1000;              // grand slam
    if (dbl === "X") score += 50;                             // insult
    if (dbl === "XX") score += 100;
    const over = tricks - need;
    if (over > 0) {
      if (dbl === "") score += over * (strain === "♣" || strain === "♦" ? 20 : 30);
      else score += over * (dbl === "XX" ? (vul ? 400 : 200) : (vul ? 200 : 100));
    }
    return score;
  }
  const down = need - tricks;
  let pen = 0;
  if (dbl === "") pen = down * (vul ? 100 : 50);
  else {
    for (let i = 1; i <= down; i++) pen += vul ? (i === 1 ? 200 : 300) : (i === 1 ? 100 : (i <= 3 ? 200 : 300));
    if (dbl === "XX") pen *= 2;
  }
  return -pen;
}


// ----- Declarer play planning: immediate winners & estimated losers -----
function planCounts(decl, dummy, trump) {
  const suits = ["♠", "♥", "♦", "♣"];
  const winnersBySuit = {}, losersBySuit = {}, lenBySuit = {};
  let W = 0, Lo = 0;
  for (const s of suits) {
    const d = decl.filter(c => c.s === s), m = dummy.filter(c => c.s === s);
    const held = new Set([...d, ...m].map(c => RVAL[c.r]));
    let win = 0; for (let r = 14; r >= 2; r--) { if (held.has(r)) win++; else break; }
    const maxLen = Math.max(d.length, m.length), minLen = Math.min(d.length, m.length);
    win = Math.min(win, maxLen);
    winnersBySuit[s] = win; W += win;
    lenBySuit[s] = { d: d.length, m: m.length };
    const tops = [14, 13, 12]; let topLosers = 0;
    for (let i = 0; i < Math.min(3, maxLen); i++) if (!held.has(tops[i])) topLosers++;
    let suitLosers = topLosers;
    if (trump !== "ST" && s !== trump) suitLosers = Math.min(topLosers, minLen);
    losersBySuit[s] = suitLosers; Lo += suitLosers;
  }
  return { winnersBySuit, losersBySuit, lenBySuit, W, Lo };
}

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
      label: `${themes[(i + (level - 1) * 3) % themes.length]} #${(level - 1) * 100 + i + 1}`,
    });
  }
  return out;
}

// ============================================================
//  INTERACTIVE BIDDING ENGINE — natural 5-card majors, 1NT 15-17
//  Pragmatic auto-bidder for all four hands + bid explanations.
// ============================================================
const STRAIN_RANK = { C: 0, D: 1, H: 2, S: 3, NT: 4 };
const SUIT_SYM = { C: "♣", D: "♦", H: "♥", S: "♠" };
const SYM_LET = { "♣": "C", "♦": "D", "♥": "H", "♠": "S" };
function canonCall(bid) { // BiddingBox symbol bid -> canonical letter token
  if (bid === "Pass" || bid === "X" || bid === "XX") return bid;
  const m = /^(\d)(NT|[♣♦♥♠])$/.exec(bid);
  if (!m) return bid;
  return m[1] + (m[2] === "NT" ? "NT" : SYM_LET[m[2]]);
}
function bidRankT(t) { const m = /^(\d)(C|D|H|S|NT)$/.exec(t); return m ? (+m[1]) * 5 + STRAIN_RANK[m[2]] : -1; }
function isBidT(t) { return bidRankT(t) >= 0; }
function lastBidOf(calls) { for (let i = calls.length - 1; i >= 0; i--) if (isBidT(calls[i].call)) return calls[i]; return null; }
function legalUpT(t, calls) { const lb = lastBidOf(calls); return !lb || bidRankT(t) > bidRankT(lb.call); }
function pseat(s) { return { N: "S", S: "N", E: "W", W: "E" }[s]; }
function sideOfSeat(s) { return (s === "N" || s === "S") ? "NS" : "EW"; }
function L4h(hand) { const l = lengths(hand); return { S: l["♠"], H: l["♥"], D: l["♦"], C: l["♣"] }; }

function auctionDone(calls) {
  if (calls.length === 4 && calls.every(c => c.call === "Pass")) return true;
  if (calls.length >= 4) { const last3 = calls.slice(-3); if (last3.every(c => c.call === "Pass") && calls.some(c => isBidT(c.call))) return true; }
  return false;
}
function auctionContract(calls) {
  const lb = lastBidOf(calls); if (!lb) return null;
  const m = /^(\d)(C|D|H|S|NT)$/.exec(lb.call);
  const strain = m[2] === "NT" ? "ST" : SUIT_SYM[m[2]];
  const side = sideOfSeat(lb.seat);
  let declarer = lb.seat;
  for (const c of calls) { if (sideOfSeat(c.seat) === side && isBidT(c.call)) { const mm = /^(\d)(C|D|H|S|NT)$/.exec(c.call); if (mm && mm[2] === m[2]) { declarer = c.seat; break; } } }
  // doubled?
  let dbl = ""; for (let i = calls.length - 1; i >= 0; i--) { if (isBidT(calls[i].call)) break; if (calls[i].call === "XX") { dbl = "XX"; break; } if (calls[i].call === "X") { dbl = "X"; break; } }
  return { level: +m[1], strain, declarer, doubled: dbl };
}

function lastNonPass(calls) { for (let i = calls.length - 1; i >= 0; i--) if (calls[i].call !== "Pass") return calls[i]; return null; }
function canDoubleT(calls, seat) { const c = lastNonPass(calls); return !!(c && isBidT(c.call) && sideOfSeat(c.seat) !== sideOfSeat(seat)); }
function canRedoubleT(calls, seat) { const c = lastNonPass(calls); return !!(c && c.call === "X" && sideOfSeat(c.seat) !== sideOfSeat(seat)); }
function countAces(hand) { return hand.filter(c => c.r === "A").length; }
function agreedMajor(calls, seat) { // a major bid by BOTH partners (a fit), highest such
  const partner = pseat(seat);
  const mineSuits = new Set(), partSuits = new Set();
  for (const c of calls) { const m = /^(\d)(H|S)$/.exec(c.call); if (!m) continue; if (c.seat === seat) mineSuits.add(m[2]); if (c.seat === partner) partSuits.add(m[2]); }
  for (const M of ["S", "H"]) if (mineSuits.has(M) && partSuits.has(M)) return M;
  // Jacoby 2NT: opener opened 1H/1S and opener's partner bid 2NT immediately -> that major is agreed
  const opener = calls.find(c => /^(\d)(C|D|H|S|NT)$/.test(c.call));
  if (opener) { const om = /^1(H|S)$/.exec(opener.call); if (om) { const oppPartner = pseat(opener.seat); const jac = calls.find(c => c.seat === oppPartner && /^\d/.test(c.call)); if (jac && jac.call === "2NT") return om[1]; } }
  return null;
}

// Control cue-bidding zone (expert): after a Jacoby 2NT major agreement, show first-round
// controls (Ace/void) cheapest-first below game; strictly increasing -> guaranteed to terminate.
function cueZoneCall(hand, H, calls, seat, expert) {
  if (!expert) return null;
  const M = agreedMajor(calls, seat);
  if (!M) return null;
  if (calls.some(c => c.call === "4NT")) return null;            // Blackwood takes over
  const opener = calls.find(c => isBidT(c.call));
  if (!opener || !/^1(H|S)$/.test(opener.call)) return null;     // must be a 1M opening
  if (sideOfSeat(seat) !== sideOfSeat(opener.seat)) return null; // only the agreeing side cues
  if (calls.some(c => isBidT(c.call) && sideOfSeat(c.seat) !== sideOfSeat(opener.seat))) return null; // uncontested only
  const opPartner = pseat(opener.seat);
  const jacoby = calls.some(c => c.seat === opPartner && c.call === "2NT");
  if (!jacoby) return null;
  // opener must have made a rebid after the 2NT (the Jacoby answer)
  const idx2NT = calls.findIndex(c => c.seat === opPartner && c.call === "2NT");
  const openerRebid = calls.slice(idx2NT + 1).some(c => c.seat === opener.seat && isBidT(c.call));
  if (!openerRebid) return null;
  const gameRank = bidRankT("4" + M);
  const lb = lastBidOf(calls);
  if (!lb) return null;
  const lbRank = bidRankT(lb.call);
  if (lbRank >= gameRank) return null;                            // at/above game: not a cue zone
  // has our side already cued a side suit (above 3-level, below game)?
  const ourCues = calls.filter(c => sideOfSeat(c.seat) === sideOfSeat(seat) && /^[34](C|D|H|S)$/.test(c.call) && /^[34](C|D|H|S)$/.exec(c.call)[1] !== M && bidRankT(c.call) > bidRankT("2NT") && bidRankT(c.call) < gameRank);
  const someoneCued = ourCues.length > 0;
  if (!someoneCued && H < 16) return null;                        // only strong hands initiate
  const myCued = new Set(ourCues.filter(c => c.seat === seat).map(c => /^[34](C|D|H|S)$/.exec(c.call)[1]));
  // cheapest first-round control (A or void) in a side suit, legal above lb and below game
  let best = null, bestRank = Infinity;
  for (const s of ["C", "D", "H", "S"]) {
    if (s === M || myCued.has(s)) continue;
    const len = hand.filter(c => c.s === SUIT_SYM[s]).length;
    const control = len === 0 || hand.some(c => c.s === SUIT_SYM[s] && c.r === "A");
    if (!control) continue;
    for (let lv = 3; lv <= 4; lv++) { const t = lv + s; const r = bidRankT(t); if (r > lbRank && r < gameRank && legalUpT(t, calls)) { if (r < bestRank) { bestRank = r; best = t; } break; } }
  }
  if (best) return best;
  if (H >= 16 && legalUpT("4NT", calls)) return "4NT";           // strong, no cheap cue -> ask aces
  if (someoneCued && legalUpT("4NT", calls)) return "4NT";       // partner cued and we have nothing more -> Blackwood
  return legalUpT("4" + M, calls) ? "4" + M : null;              // sign off in game
}

// Core auto-bidder. calls: [{seat,call(canonical)}]. opts.expert enables Blackwood/sharper bidding.
function botCall(hands, seat, calls, opts) {
  const hand = hands[seat];
  const H = hcp(hand), L = L4h(hand), Lsym = lengths(hand), bal = isBalanced(Lsym);
  const partner = pseat(seat);
  const pick = (...c) => { for (const t of c) { if (t && t !== "Pass" && legalUpT(t, calls) && bidRankT(t) <= 36) return t; } return "Pass"; };
  const realBids = calls.filter(c => isBidT(c.call));
  const opener = realBids[0] || null;
  const openerSeat = opener ? opener.seat : null;
  const partnerBids = calls.filter(c => c.seat === partner && isBidT(c.call));
  const myBids = calls.filter(c => c.seat === seat && isBidT(c.call));
  const lens = [["S", L.S], ["H", L.H], ["D", L.D], ["C", L.C]];
  const sortedLen = lens.slice().sort((a, b) => b[1] - a[1] || STRAIN_RANK[b[0]] - STRAIN_RANK[a[0]]);

  // ---------- 1) Nobody has opened yet ----------
  if (!openerSeat) {
    if (bal && H >= 15 && H <= 17) return "1NT";
    if (bal && H >= 20 && H <= 21) return "2NT";
    if (H >= 22) return "2C";
    const r20 = H + sortedLen[0][1] + sortedLen[1][1];
    if (H >= 12 || r20 >= 20) {
      if (L.S >= 5 && L.S >= L.H) return "1S";
      if (L.H >= 5) return "1H";
      if (L.D > L.C) return "1D";
      if (L.C > L.D) return "1C";
      return L.C >= 4 ? "1D" : "1C";
    }
    if (H >= 6 && H <= 10) {
      for (const s of ["S", "H", "D"]) { if (L[s] === 6 && !(s !== "S" && L.S >= 4) && !(s !== "H" && L.H >= 4)) { const t = "2" + s; if (legalUpT(t, calls)) return t; } }
    }
    return "Pass";
  }

  const iAmOpener = openerSeat === seat;
  const partnerOpened = openerSeat === partner;
  const oppOpened = sideOfSeat(openerSeat) !== sideOfSeat(seat);
  const openBid = opener.call;
  const openStrain = /^(\d)(C|D|H|S|NT)$/.exec(openBid)[2];
  const expert = !!(opts && opts.expert);
  const lnp = lastNonPass(calls);

  // ---------- 1b) RKCB 1430 (expert): respond to / place 4NT on an agreed major ----------
  if (expert) {
    const M = agreedMajor(calls, seat);
    const symM = M ? SUIT_SYM[M] : null;
    const keyCards = (h) => countAces(h) + (M && h.some(c => c.s === symM && c.r === "K") ? 1 : 0);
    const hasQ = (h) => M && h.some(c => c.s === symM && c.r === "Q");
    // partner asked 4NT (RKCB 1430): answer key cards (4 aces + trump King)
    if (M && lnp && lnp.call === "4NT" && lnp.seat === pseat(seat)) {
      const k = keyCards(hand);
      if (k === 1 || k === 4) return pick("5C");                 // 1430: 5♣ = 1 or 4
      if (k === 0 || k === 3) return pick("5D");                 // 5♦ = 0 or 3
      return pick(hasQ(hand) ? "5S" : "5H");                     // 2/5: 5♠ with trump Q, 5♥ without
    }
    // I asked 4NT; partner answered 5x -> place using key-card count
    const myLast = [...calls].reverse().find(c => c.seat === seat && isBidT(c.call));
    if (M && myLast && myLast.call === "4NT") {
      const ans = [...calls].reverse().find(c => c.seat === pseat(seat) && /^5(C|D|H|S)$/.test(c.call));
      if (ans) {
        const opts = { "5C": [1, 4], "5D": [0, 3], "5H": [2, 5], "5S": [2, 5] }[ans.call];
        const my = keyCards(hand);
        const feasible = opts.filter(k => my + k <= 5);
        const partnerKeys = feasible.length ? Math.max(...feasible) : Math.min(...opts);
        const total = my + partnerKeys;
        const queenOk = ans.call === "5S" || hasQ(hand);        // partner showed Q, or we hold it
        if (total <= 3) return pick("5" + M);                   // missing two key cards -> sign off in 5
        if (total === 5 && queenOk && H >= 19) return pick("7" + M, "6" + M); // all keys + queen + extras -> grand try
        return pick("6" + M, "5" + M);                          // small slam
      }
    }
  }

  // ---------- 1b·cue) Control cue-bidding zone (expert) ----------
  { const cz = cueZoneCall(hand, H, calls, seat, expert); if (cz) return cz; }

  // ---------- 1c) Redouble: RHO doubled partner's opening and I have values ----------
  if (canRedoubleT(calls, seat) && openerSeat === pseat(seat) && H >= 10 && myBids.length === 0) return "XX";

  // ---------- 1d) Advancer: partner made a takeout double ----------
  const partnerDbl = [...calls].reverse().find(c => c.seat === pseat(seat) && (c.call === "X" || isBidT(c.call)));
  const partnerTakeoutX = partnerDbl && partnerDbl.call === "X" && sideOfSeat(openerSeat) !== sideOfSeat(seat) && !calls.some(c => c.seat === pseat(seat) && isBidT(c.call));
  if (partnerTakeoutX && myBids.length === 0) {
    const opSuit = openStrain;
    // choose best unbid suit (prefer 4+ majors), bid at cheapest legal level; jump with 10+, game/cue with strong
    const order2 = ["S", "H", "D", "C"].filter(s => s !== opSuit);
    order2.sort((a, b) => (L[b] - L[a]) || (STRAIN_RANK[SUIT_SYM[b]] - STRAIN_RANK[SUIT_SYM[a]]));
    const best = order2[0];
    if (H >= 11 && (best === "H" || best === "S") && L[best] >= 4) return pick("4" + best, "3" + best, "2" + best, "1" + best);
    if (H >= 10) { for (let lv = 1; lv <= 3; lv++) { const t = lv + best; if (legalUpT(t, calls) && bidRankT(t) >= bidRankT(lnp ? lnp.call : "1C") + 5) return t; } }
    if (bal && H >= 7 && H <= 10 && legalUpT("1NT", calls)) return "1NT";
    for (let lv = 1; lv <= 4; lv++) { const t = lv + best; if (legalUpT(t, calls)) return t; }
    return "Pass";
  }

  // ---------- 2) Partner opened; my first response ----------
  if (partnerOpened && partnerBids.length === 1 && myBids.length === 0) {
    // Negative double: partner opened a suit, RHO overcalled a suit, I have values + an unbid 4-card major
    if (openBid !== "1NT" && openBid !== "2NT" && openBid !== "2C" && canDoubleT(calls, seat) && H >= 6 && H <= 11) {
      const oppSuitBids = calls.filter(c => sideOfSeat(c.seat) !== sideOfSeat(seat) && /^(\d)(C|D|H|S)$/.test(c.call));
      if (oppSuitBids.length) {
        const bidSuits = new Set([openStrain, ...oppSuitBids.map(c => /^(\d)(C|D|H|S)$/.exec(c.call)[2])]);
        const unbidMajor = ["S", "H"].find(M => !bidSuits.has(M) && L[M] >= 4);
        const lastOpp = oppSuitBids[oppSuitBids.length - 1];
        if (unbidMajor && bidRankT(lastOpp.call) <= bidRankT("2S")) return "X";
      }
    }
    if (openBid === "1NT") {
      if (L.H >= 5 && L.S < 5) return pick("2D");
      if (L.S >= 5) return pick("2H");
      if (H >= 8 && (L.H === 4 || L.S === 4)) return pick("2C", "3NT");
      if (H >= 10) return pick("3NT");
      if (H >= 8) return pick("2NT");
      return "Pass";
    }
    if (openBid === "2NT") return H >= 5 ? pick("3NT") : "Pass";
    if (openBid === "2C") return pick("2D", "2NT");
    if (openStrain === "H" || openStrain === "S") {
      const M = openStrain, sup = L[M];
      if (sup >= 3) {
        const TP = H + distPoints(Lsym);
        const contested = calls.some(c => sideOfSeat(c.seat) !== sideOfSeat(seat) && isBidT(c.call));
        if (expert && sup >= 4 && TP >= 13 && !contested && legalUpT("2NT", calls)) return "2NT"; // Jacoby 2NT: GF major raise
        if (TP >= 13) return pick("4" + M, "3" + M, "2" + M);
        if (TP >= 11) return pick("3" + M, "2" + M);
        if (H >= 6) return pick("2" + M);
        if (sup >= 5) return pick("4" + M, "3" + M, "2" + M);
        return "Pass";
      }
      if (M === "H" && L.S >= 4 && H >= 6) return pick("1S", "1NT");
      if (H >= 11) { for (const s of ["D", "C", "H"]) { if (s !== M && L[s] >= 4) { const t = "2" + s; if (legalUpT(t, calls)) return t; } } }
      if (H >= 6) return pick("1NT");
      return "Pass";
    }
    if (openStrain === "D" || openStrain === "C") {
      const m = openStrain;
      if (H >= 6 && L.H >= 4 && L.H >= L.S) return pick("1H", "1NT");
      if (H >= 6 && L.S >= 4) return pick("1S", "1NT");
      if (L[m] >= 5) { if (H >= 11) return pick("3" + m, "2" + m); if (H >= 6) return pick("2" + m); }
      if (H >= 13 && bal) return pick("3NT");
      if (H >= 11 && bal) return pick("2NT");
      if (H >= 6) return pick("1NT");
      return "Pass";
    }
  }

  // ---------- 3·neg) Opener answers partner's negative double ----------
  if (iAmOpener && myBids.length === 1 && partnerBids.length === 0 && calls.some(c => c.seat === partner && c.call === "X")) {
    const oppSuitBids = calls.filter(c => sideOfSeat(c.seat) !== sideOfSeat(seat) && /^(\d)(C|D|H|S)$/.test(c.call));
    const bidSuits = new Set([openStrain, ...oppSuitBids.map(c => /^(\d)(C|D|H|S)$/.exec(c.call)[2])]);
    for (const M of ["H", "S"]) {
      if (!bidSuits.has(M) && L[M] >= 4) {
        for (let lv = 1; lv <= 4; lv++) { const t = lv + M; if (legalUpT(t, calls)) return (H >= 16 && lv < 3) ? pick("" + (lv + 1) + M, t) : t; }
      }
    }
    if (L[openStrain] >= 6) return pick("2" + openStrain, "3" + openStrain);
    if (bal && H >= 15) return pick("2NT", "3NT");
    if (bal) return pick("1NT", "2NT");
    for (const m of ["D", "C"]) if (!bidSuits.has(m) && L[m] >= 4) { const t = "2" + m; if (legalUpT(t, calls)) return t; }
    return "Pass";
  }

  // ---------- 3) I opened; my rebid after partner responded ----------
  if (iAmOpener && partnerBids.length >= 1 && myBids.length === 1) {
    const resp = partnerBids[partnerBids.length - 1].call;
    const myOpen = myBids[0].call;
    const myStrain = /^(\d)(C|D|H|S|NT)$/.exec(myOpen)[2];
    if (myOpen === "1NT") {
      if (resp === "2C") { if (L.H === 4 || L.H === 5) return pick("2H", "2NT"); if (L.S === 4 || L.S === 5) return pick("2S", "2NT"); return pick("2D"); }
      if (resp === "2D") return pick("2H");
      if (resp === "2H") return pick("2S");
      if (resp === "2NT") return H >= 17 ? pick("3NT") : "Pass";
      return "Pass";
    }
    if (myOpen === "2C") { if (bal && H >= 22) return pick("2NT", "3NT"); const best = sortedLen[0][0]; return pick("3" + best, "2" + best); }
    if (myStrain === "H" || myStrain === "S") {
      const M = myStrain;
      if (resp === "2NT") { // Jacoby 2NT: show shortness, then strength
        for (const s of ["S", "H", "D", "C"]) if (s !== M && L[s] <= 1) { const t = "3" + s; if (legalUpT(t, calls)) return t; }
        if (bal && H >= 18) return pick("3NT");
        if (H >= 15) return pick("3" + M);
        return pick("4" + M);
      }
      if (resp === "2" + M) { if (H >= 18) return pick("4" + M); if (H >= 16) return pick("3" + M); return "Pass"; }
      if (resp === "3" + M) return H >= 14 ? pick("4" + M) : "Pass";
      if (resp === "1NT") { if (L[M] >= 6) return pick("2" + M); for (const s of ["D", "C"]) if (L[s] >= 4) { const t = "2" + s; if (legalUpT(t, calls)) return t; } return "Pass"; }
      if (resp === "1S" && M === "H") { if (L.S >= 4) return H >= 16 ? pick("3S", "2S") : pick("2S"); if (L.H >= 6) return pick("2H"); if (bal) return pick("1NT", "2NT"); for (const s of ["D", "C"]) if (L[s] >= 4) { const t = "2" + s; if (legalUpT(t, calls)) return t; } return "Pass"; }
      if (L[M] >= 6) return pick("3" + M, "2" + M);
      if (bal) return H >= 18 ? pick("3NT") : pick("2NT");
      for (const s of ["S", "H", "D", "C"]) if (s !== M && L[s] >= 4) { const t = "2" + s; if (legalUpT(t, calls)) return t; }
      return "Pass";
    }
    if (myStrain === "D" || myStrain === "C") {
      const rm = /^(\d)(C|D|H|S|NT)$/.exec(resp);
      if (rm && (rm[2] === "H" || rm[2] === "S") && L[rm[2]] >= 4) { const M = rm[2]; if (H >= 19) return pick("4" + M, "3" + M, "2" + M); if (H >= 16) return pick("3" + M, "2" + M); return pick("2" + M); }
      if (bal) { if (H >= 18) return pick("3NT"); if (H >= 15) return pick("2NT"); return pick("1NT"); }
      if (L[myStrain] >= 6) return pick("2" + myStrain);
      for (const s of ["S", "H", "D", "C"]) if (s !== myStrain && L[s] >= 4) { const t = "2" + s; if (legalUpT(t, calls)) return t; }
      return pick("1NT");
    }
  }

  // ---------- 3b) Responder's rebid: accept invitations / reach game ----------
  if (partnerOpened && partnerBids.length === 2 && myBids.length === 1) {
    // Jacoby 2NT continuation: after opener's shortness/strength rebid, sign off game or launch Blackwood
    if (myBids[0].call === "2NT" && /^1(H|S)$/.test(openBid)) {
      const M = openStrain;
      if (expert && H >= 17 && !calls.some(c => c.call === "4NT") && legalUpT("4NT", calls)) return "4NT";
      if (legalUpT("4" + M, calls)) return pick("4" + M, "3" + M);
      return "Pass";
    }
    const reb = partnerBids[1].call;
    const rm = /^(\d)(C|D|H|S|NT)$/.exec(reb);
    if (rm) {
      const lvl = +rm[1], st = rm[2];
      if (lvl === 3 && (st === "H" || st === "S") && H >= 8 && L[st] >= 3) return pick("4" + st);
      if (reb === "2NT" && H >= 7) return pick("3NT");
      if (reb === "3NT" || lvl >= 4) return "Pass";
      // partner showed a 6-card major rebid; raise to game with a fit + extras
      if (lvl === 2 && (st === "H" || st === "S") && L[st] >= 3 && H >= 11) return pick("4" + st, "3" + st);
    }
    return "Pass";
  }

  // ---------- 4) Opponents opened: overcall / takeout X / advance once, then pass ----------
  if (oppOpened && myBids.length === 0) {
    if (!partnerBids.length) {
      // takeout double: 1-level suit opening, opening values, short in their suit, support for the others
      if (canDoubleT(calls, seat) && /^1(C|D|H|S)$/.test(openBid)) {
        const opS = openStrain, others = ["S", "H", "D", "C"].filter(s => s !== opS);
        const supportsOthers = others.every(s => L[s] >= 3) || (L[opS] <= 2 && others.filter(s => L[s] >= 3).length >= 3);
        if (H >= 12 && L[opS] <= 3 && supportsOthers) return "X";
      }
      if (bal && H >= 15 && H <= 18 && legalUpT("1NT", calls)) return "1NT";
      for (const [s, ln] of sortedLen) {
        if (ln >= 5 && H >= 9 && H <= 16) {
          const t1 = "1" + s, t2 = "2" + s;
          if (legalUpT(t1, calls) && bidRankT(t1) <= bidRankT(openBid) + 4) return t1;
          if (legalUpT(t2, calls) && H >= 11) return t2;
        }
      }
      return "Pass";
    }
    const povc = partnerBids[partnerBids.length - 1].call;
    const pm = /^(\d)(C|D|H|S|NT)$/.exec(povc);
    if (pm && pm[2] !== "NT" && L[pm[2]] >= 3 && H >= 6) {
      const lv = parseInt(pm[1], 10) + 1;
      if (H >= 12) { const g = (pm[2] === "H" || pm[2] === "S") ? "4" + pm[2] : "3NT"; if (legalUpT(g, calls)) return g; }
      if (H <= 11 && lv <= 4) { const t = lv + pm[2]; if (legalUpT(t, calls)) return t; }
    }
    if (pm && pm[2] === "NT" && H >= 8) return pick("3NT");
    return "Pass";
  }

  // ---------- 4b) Expert: launch Blackwood with a big hand on an agreed major ----------
  if (expert) {
    const M = agreedMajor(calls, seat);
    if (M && myBids.length >= 1 && H >= 18 && !calls.some(c => c.call === "4NT") && legalUpT("4NT", calls) && bidRankT(lastBidOf(calls) ? lastBidOf(calls).call : "1C") < bidRankT("4NT")) {
      // only if we are around game level already (avoid leaping past a making partscore)
      const lb = lastBidOf(calls);
      if (lb && bidRankT(lb.call) >= bidRankT("3" + M)) return "4NT";
    }
  }

  // ---------- 5) Later rounds / no rule: pass to close the auction ----------
  return "Pass";
}

// Explain what a call means in context (bilingual), for insights / comparison.
function describeCall(call, calls, seat, hand) {
  const L = hand ? L4h(hand) : null, H = hand ? hcp(hand) : null;
  const realBids = calls.filter(c => isBidT(c.call));
  const opener = realBids[0] || null;
  const partner = pseat(seat);
  const partnerOpened = opener && opener.seat === partner;
  const iAmOpener = opener && opener.seat === seat;
  const nthMyBid = calls.filter(c => c.seat === seat && isBidT(c.call)).length; // incl this if already pushed? caller passes pre-push
  const before = !opener;
  if (call === "Pass") {
    if (before) return { es: "Paso: sin valores de apertura (menos de ~12 puntos) o mano sin acción clara.", en: "Pass: no opening values (under ~12) or no clear action." };
    return { es: "Paso: conforme con la situación o sin fuerza para seguir describiendo.", en: "Pass: content with the situation or no strength to keep describing." };
  }
  if (call === "X") {
    const oppBidAfterOpen = opener && calls.some(c => isBidT(c.call) && sideOfSeat(c.seat) !== sideOfSeat(opener.seat));
    if (partnerOpened && oppBidAfterOpen) return { es: "Doblo negativo: valores (6-11) y 4+ en la(s) mayor(es) no nombrada(s); pide a tu pareja elegir.", en: "Negative double: values (6-11) and 4+ in the unbid major(s); asks partner to pick." };
    return { es: "Doblo: informativo (pide a la pareja elegir palo) o de castigo según el nivel.", en: "Double: takeout (asks partner to pick a suit) or penalty depending on level." };
  }
  if (call === "XX") return { es: "Redoblo: muestra fuerza/confianza tras un doblo rival.", en: "Redouble: shows strength/confidence after an opponents' double." };
  { // control cue-bid (after a Jacoby 2NT major agreement)
    const op = realBids[0];
    const cm = /^[34](C|D|H|S)$/.exec(call);
    if (op && /^1(H|S)$/.test(op.call) && cm) {
      const opPartner = pseat(op.seat), M = op.call[1];
      const jac = calls.some(c => c.seat === opPartner && c.call === "2NT");
      if (jac && cm[1] !== M && bidRankT(call) > bidRankT("2NT") && bidRankT(call) < bidRankT("4" + M) && sideOfSeat(seat) === sideOfSeat(op.seat)) {
        const sym = SUIT_SYM[cm[1]];
        return { es: `Cue-bid de control: muestra un control (As o void) en ${sym}; camino a slam tras el fit Jacoby.`, en: `Control cue-bid: shows a control (Ace or void) in ${sym}; a slam try after the Jacoby fit.` };
      }
    }
  }
  { // RKCB 1430 ask & responses (agreed major)
    const M = agreedMajor(calls, seat);
    if (M && call === "4NT") return { es: "Blackwood RKCB 1430: pregunta cartas clave (4 ases + Rey de triunfo).", en: "RKCB 1430 Blackwood: asks for key cards (4 aces + trump King)." };
    if (M && /^5(C|D|H|S)$/.test(call) && realBids.length && realBids[realBids.length - 1].call === "4NT") {
      const map = { "5C": ["1 o 4 claves", "1 or 4 keys"], "5D": ["0 o 3 claves", "0 or 3 keys"], "5H": ["2 o 5 claves, sin dama de triunfo", "2 or 5 keys, no trump queen"], "5S": ["2 o 5 claves, con dama de triunfo", "2 or 5 keys, with trump queen"] }[call];
      return { es: `Respuesta RKCB 1430: ${map[0]}.`, en: `RKCB 1430 reply: ${map[1]}.` };
    }
  }
  const m = /^(\d)(C|D|H|S|NT)$/.exec(call); if (!m) return { es: "", en: "" };
  const lvl = +m[1], st = m[2], sym = st === "NT" ? "ST" : SUIT_SYM[st], symEN = st === "NT" ? "NT" : SUIT_SYM[st];
  // openings
  if (before) {
    if (call === "1NT") return { es: "Apertura 1ST: mano equilibrada de 15-17 PH con paradas repartidas.", en: "1NT opening: balanced 15-17 HCP with stoppers spread around." };
    if (call === "2NT") return { es: "Apertura 2ST: equilibrada de 20-21 PH.", en: "2NT opening: balanced 20-21 HCP." };
    if (call === "2C") return { es: "Apertura 2♣: fuerte y artificial (22+ PH o juego de manga); forcing.", en: "2♣ opening: strong artificial (22+ HCP or game-going); forcing." };
    if (lvl === 1 && (st === "H" || st === "S")) return { es: `Apertura 1${sym}: 5+ cartas de ${sym} y 12-21 PH. Busca el fit de 8 en la mayor.`, en: `1${symEN} opening: 5+ cards in ${symEN} and 12-21 HCP. Hunts the 8-card major fit.` };
    if (lvl === 1) return { es: `Apertura 1${sym}: 12-21 PH sin mayor de 5; palo menor (puede ser preparado).`, en: `1${symEN} opening: 12-21 HCP with no 5-card major; a minor suit (may be prepared).` };
    if (lvl === 2 && st !== "C") return { es: `Apertura barrera 2${sym}: 6 cartas y 6-10 PH; preventiva, roba espacio al rival.`, en: `Weak two 2${symEN}: 6 cards and 6-10 HCP; pre-emptive, steals room.` };
  }
  // responses to partner's opening
  if (partnerOpened) {
    const ob = opener.call;
    if ((ob === "1H" || ob === "1S") && call === "2NT" && nthMyBid === 0) {
      const sym = ob === "1H" ? "♥" : "♠";
      return { es: `Jacoby 2ST: apoyo de 4+ en ${sym} con mano de manga (forcing); pide al abridor que muestre cortedad para explorar slam.`, en: `Jacoby 2NT: 4+ ${sym} support with game-forcing values; asks opener to show shortness to explore slam.` };
    }
    if (ob === "1NT") {
      if (call === "2C") return { es: "Stayman 2♣: pregunta si el abridor tiene un mayor de 4 (8+ PH).", en: "Stayman 2♣: asks whether opener holds a 4-card major (8+ HCP)." };
      if (call === "2D") return { es: "Transferencia a corazones: 5+ ♥; pide al abridor que diga 2♥.", en: "Transfer to hearts: 5+ ♥; asks opener to bid 2♥." };
      if (call === "2H") return { es: "Transferencia a picas: 5+ ♠; pide al abridor que diga 2♠.", en: "Transfer to spades: 5+ ♠; asks opener to bid 2♠." };
      if (call === "2NT") return { es: "Invitación: ~8-9 PH equilibrado; manga si el abridor tiene su máximo.", en: "Invitation: ~8-9 balanced; game if opener is maximum." };
      if (call === "3NT") return { es: "A manga: ~10-15 PH equilibrado, sin mayor de 4.", en: "To game: ~10-15 balanced, no 4-card major." };
    }
    const oStrain = /^(\d)(C|D|H|S|NT)$/.exec(ob)[2];
    if ((oStrain === "H" || oStrain === "S") && st === oStrain) {
      if (lvl === 2) return { es: `Apoyo simple a ${sym}: fit de 3+ y 6-9 PH.`, en: `Simple raise of ${symEN}: 3+ fit and 6-9 HCP.` };
      if (lvl === 3) return { es: `Apoyo invitacional a ${sym}: 4 triunfos y ~10-11 PH.`, en: `Invitational raise of ${symEN}: 4 trumps and ~10-11 HCP.` };
      if (lvl === 4) return { es: `Manga directa ${sym}: fit con valores de manga (o preventivo distribucional).`, en: `Direct game ${symEN}: fit with game values (or pre-emptive shapely).` };
    }
    if (call === "1NT") return { es: "Respuesta 1ST: 6-10 PH, sin fit ni palo cómodo a nivel 1.", en: "1NT response: 6-10 HCP, no fit and no comfortable 1-level suit." };
    if (call === "3NT") return { es: "A manga en ST: valores de manga con paradas, sin fit mayor.", en: "To game in NT: game values with stoppers, no major fit." };
    if (lvl === 1) return { es: `Cambio a 1${sym}: 4+ cartas y 6+ PH; forcing una vuelta, busca otro fit.`, en: `New suit 1${symEN}: 4+ cards and 6+ HCP; forcing one round, seeks another fit.` };
    if (lvl === 2 && st !== oStrain) return { es: `Cambio a 2${sym} (2/1): 11+ PH; suele forzar a manga.`, en: `Two-level new suit 2${symEN} (2/1): 11+ HCP; usually game-forcing.` };
  }
  // opener's rebids
  if (iAmOpener) {
    if (call === "1NT" || call === "2NT") return { es: `Rebid ${sym}: mano equilibrada, muestra rango fuera del 1ST de apertura.`, en: `${symEN} rebid: balanced, shows a range outside a 1NT opening.` };
    if (lvl >= 3 && (st === "H" || st === "S")) return { es: `Apoyo/manga en ${sym}: confirma fit y fuerza para jugar la mayor.`, en: `${symEN} support/game: confirms fit and strength to play the major.` };
    return { es: `Rebid ${sym}: aclara forma (repetir = 6 cartas; nuevo palo = 5-4) y fuerza.`, en: `${symEN} rebid: clarifies shape (repeat = 6 cards; new suit = 5-4) and strength.` };
  }
  // generic
  return { es: `${lvl}${sym}: voz natural mostrando ${sym}.`, en: `${lvl}${symEN}: natural call showing ${symEN}.` };
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
  const order = ["N", "E", "S", "W"];
  const grab = (block, tag) => { const m = block.match(new RegExp(`\\[${tag}\\s+"([^"]*)"\\]`, "i")); return m ? m[1] : null; };
  const normCall = (t) => { const u = String(t).toUpperCase(); if (u === "PASS" || u === "P") return "Pass"; if (u === "X" || u === "DBL" || u === "D") return "X"; if (u === "XX" || u === "RDBL" || u === "R") return "XX"; return u; };
  for (const block of blocks) {
    const dealVal = grab(block, "Deal");
    if (!dealVal) continue;
    let hands = pbnDealValue(dealVal);
    if (!validHands(hands)) continue;
    const declarer = grab(block, "Declarer");
    const contractStr = grab(block, "Contract");
    const parsed = pbnContractToStrain(contractStr);
    const shift = declarer && order.indexOf(declarer.toUpperCase()) >= 0 ? (2 - order.indexOf(declarer.toUpperCase()) + 4) % 4 : 0;
    if (declarer) hands = rotateDealToSouth(hands, declarer);
    const contract = parsed ? { level: parsed.level, strain: parsed.strain, declarer: "S" } : suggestContract(hands);
    const ev = grab(block, "Event"), bd = grab(block, "Board"), site = grab(block, "Site"), room = grab(block, "Room"), dealerOrig = grab(block, "Dealer");
    // Auction: [Auction "<seat>"] then call tokens until next tag / comment
    let auction = null, dealer = null;
    const am = block.match(/\[Auction\s+"([NESW])"\]([\s\S]*?)(?=\n\[|\n%|$)/i);
    if (am) {
      const startSeat = am[1].toUpperCase();
      const raw = am[2].split(/\s+/).map(s => s.trim()).filter(Boolean).filter(s => !/[=*!?]/.test(s));
      const calls = [];
      for (const t of raw) { if (/^AP$/i.test(t)) { calls.push("Pass", "Pass", "Pass"); } else calls.push(normCall(t)); }
      let si = order.indexOf(startSeat);
      if (si >= 0 && calls.length) {
        auction = calls.map((c, idx) => ({ seat: order[(((si + idx) % 4) + shift) % 4], call: c }));
        dealer = order[(si + shift) % 4];
      }
    } else if (dealerOrig && order.indexOf(dealerOrig.toUpperCase()) >= 0) {
      dealer = order[(order.indexOf(dealerOrig.toUpperCase()) + shift) % 4];
    }
    const label = [ev && ev !== "?" ? ev : null, bd ? `#${bd}` : null].filter(Boolean).join(" ") || site || null;
    out.push({ hands, contract, label, board: bd || null, room: room || null, auction, dealer });
  }
  return out;
}
function dealFromPBN(entry, idx) {
  return { seed: 800000 + idx, hands: entry.hands, contract: entry.contract, auction: entry.auction, dealer: entry.dealer };
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
[Dealer "N"]
[Declarer "E"]
[Contract "3NT"]
[Deal "N:K73.AT94.J82.854 AQ4.KQ.Q95.QT976 J865.863.KT763.J T92.J752.A4.AK32"]
[Auction "N"]
Pass 1C Pass 1H Pass 1NT Pass 3NT Pass Pass Pass

[Board "2"]
[Room "Open"]
[Dealer "E"]
[Declarer "W"]
[Contract "3NT"]
[Deal "N:KQJ5.73.JT54.862 9742.Q42.A63.K94 6.KJ9865.Q72.J73 AT83.AT.K98.AQT5"]
[Auction "E"]
Pass 2D 2NT Pass 3NT Pass Pass Pass

[Board "2"]
[Room "Closed"]
[Dealer "E"]
[Declarer "E"]
[Contract "4S"]
[Deal "N:KQJ5.73.JT54.862 9742.Q42.A63.K94 6.KJ9865.Q72.J73 AT83.AT.K98.AQT5"]
[Auction "E"]
Pass Pass 1C Pass 1S Pass 4S Pass Pass Pass

[Board "3"]
[Room "Open"]
[Dealer "S"]
[Declarer "E"]
[Contract "5C"]
[Deal "N:K96.762.J98764.A T5.AKQT9.A.T6532 QJ8432.54.32.QJ9 A7.J83.KQT5.K874"]
[Auction "S"]
2D Pass Pass 2H Pass 4H 4S 5C Pass Pass Pass

[Board "3"]
[Room "Closed"]
[Dealer "S"]
[Declarer "W"]
[Contract "4H"]
[Deal "N:K96.762.J98764.A T5.AKQT9.A.T6532 QJ8432.54.32.QJ9 A7.J83.KQT5.K874"]
[Auction "S"]
Pass 1NT Pass 2D Pass 2H Pass 3C Pass 3H Pass 4H Pass Pass Pass

[Board "4"]
[Room "Closed"]
[Dealer "W"]
[Declarer "N"]
[Contract "3NT"]
[Deal "N:K96.AJ732.75.A42 AJ532.5.K862.T65 874.KQ98.AT.KQ87 QT.T64.QJ943.J93"]
[Auction "W"]
Pass 1NT Pass 3NT Pass Pass Pass

[Board "5"]
[Room "Closed"]
[Dealer "N"]
[Declarer "S"]
[Contract "3NT"]
[Deal "N:A954.5.T864.KQ98 T3.QJ83.AQ953.T4 KJ7.AKT9.KJ.A652 Q862.7642.72.J73"]
[Auction "N"]
Pass Pass 1H Pass 1S Pass 3NT Pass Pass Pass

[Board "6"]
[Room "Closed"]
[Dealer "E"]
[Declarer "E"]
[Contract "4S"]
[Deal "N:654.AK9.KJ4.QJ98 AJ83.QJT.AQ85.75 9.8654.7632.KT62 KQT72.732.T9.A43"]
[Auction "E"]
1NT Pass 2H Pass 3C Pass 3H Pass 3S Pass 4S Pass Pass Pass

[Board "7"]
[Room "Closed"]
[Dealer "S"]
[Declarer "E"]
[Contract "4H"]
[Deal "N:K43.A2.KQJ65.Q76 A8.QJT865..AKJ52 QT52.K43.742.T94 J976.97.AT983.83"]
[Auction "S"]
Pass Pass 1D 2NT Pass 3C Pass 3H Pass 4H Pass Pass Pass

[Board "7"]
[Room "Open"]
[Dealer "S"]
[Declarer "W"]
[Contract "4H"]
[Deal "N:K43.A2.KQJ65.Q76 A8.QJT865..AKJ52 QT52.K43.742.T94 J976.97.AT983.83"]
[Auction "S"]
Pass Pass 1NT 3D Pass 3H Pass 4H Pass Pass Pass

[Board "8"]
[Room "Closed"]
[Dealer "W"]
[Declarer "S"]
[Contract "3NT"]
[Deal "N:AKJ6.AT53..AKQ63 9.K987.AKJ.JT987 Q732.QJ42.Q654.4 T854.6.T98732.52"]
[Auction "W"]
Pass 2C Pass 2D Pass 3C Pass 3NT Pass Pass Pass

[Board "8"]
[Room "Open"]
[Dealer "W"]
[Declarer "S"]
[Contract "6S"]
[Deal "N:AKJ6.AT53..AKQ63 9.K987.AKJ.JT987 Q732.QJ42.Q654.4 T854.6.T98732.52"]
[Auction "W"]
Pass 1C 1H X Pass 4D Pass 4S Pass 6S Pass Pass Pass

[Board "9"]
[Room "Closed"]
[Dealer "N"]
[Declarer "N"]
[Contract "6NT"]
[Deal "N:JT95.A87.AJT.QJ3 Q864.J65.95.KT96 AK2.KQ4.KQ7.A752 73.T932.86432.84"]
[Auction "N"]
1NT Pass 6NT Pass Pass Pass

[Board "9"]
[Room "Open"]
[Dealer "N"]
[Declarer "S"]
[Contract "6NT"]
[Deal "N:JT95.A87.AJT.QJ3 Q864.J65.95.KT96 AK2.KQ4.KQ7.A752 73.T932.86432.84"]
[Auction "N"]
1C Pass 2D Pass 2S Pass 2NT Pass 3NT Pass 6NT Pass Pass Pass

[Board "10"]
[Room "Closed"]
[Dealer "E"]
[Declarer "W"]
[Contract "4S"]
[Deal "N:Q.Q9872.53.QJ432 A87.A.AKJ8.KT985 KJ95.KT653.42.A7 T6432.J4.QT976.6"]
[Auction "E"]
1C 1H Pass 4H X Pass 4S Pass Pass Pass

[Board "10"]
[Room "Open"]
[Dealer "E"]
[Declarer "W"]
[Contract "5D"]
[Deal "N:Q.Q9872.53.QJ432 A87.A.AKJ8.KT985 KJ95.KT653.42.A7 T6432.J4.QT976.6"]
[Auction "E"]
1C 2C Pass 4H X Pass 5D Pass Pass Pass

[Board "11"]
[Room "Open"]
[Dealer "S"]
[Declarer "W"]
[Contract "4S"]
[Deal "N:T83.AT7.KT96.532 J72.KQ62.Q3.AK97 Q4.9854.J854.T84 AK965.J3.A72.QJ6"]
[Auction "S"]
Pass 1NT Pass 2C Pass 2S Pass 4S Pass Pass Pass

[Board "12"]
[Room "Open"]
[Dealer "W"]
[Declarer "S"]
[Contract "2S"]
[Deal "N:A98.J6.86543.KT5 543.Q753.972.943 KJT76.AK42.J.QJ8 Q2.T98.AKQT.A762"]
[Auction "W"]
1NT Pass Pass 2C Pass 2D Pass 2S Pass Pass Pass

[Board "12"]
[Room "Closed"]
[Dealer "W"]
[Declarer "S"]
[Contract "4S"]
[Deal "N:A98.J6.86543.KT5 543.Q753.972.943 KJT76.AK42.J.QJ8 Q2.T98.AKQT.A762"]
[Auction "W"]
1C Pass Pass X Pass 1NT Pass 2S Pass 4S Pass Pass Pass

[Board "13"]
[Room "Open"]
[Dealer "N"]
[Declarer "N"]
[Contract "3NT"]
[Deal "N:Q.AJ85.AJT7.AQ83 T9853.KT93.Q98.K AJ764.Q2.52.JT92 K2.764.K643.7654"]
[Auction "N"]
1D Pass 1S Pass 1NT Pass 2C Pass 2NT Pass 3NT Pass Pass Pass

[Board "14"]
[Room "Open"]
[Dealer "E"]
[Declarer "W"]
[Contract "4S"]
[Deal "N:J4.876.T87.98765 A.QT43.5432.QT42 T96.J2.AKQ96.AJ3 KQ87532.AK95.J.K"]
[Auction "E"]
Pass 1NT 4S Pass Pass Pass

[Board "15"]
[Room "Open"]
[Dealer "S"]
[Declarer "W"]
[Contract "2S"]
[Deal "N:K4.9865.K5.AJ543 Q932.Q42.AT93.72 J76.K7.7642.KT98 AT85.AJT3.QJ8.Q6"]
[Auction "S"]
Pass 1NT Pass 2C Pass 2D Pass 2H Pass 2S Pass Pass Pass

[Board "15"]
[Room "Closed"]
[Dealer "S"]
[Declarer "W"]
[Contract "1NT"]
[Deal "N:K4.9865.K5.AJ543 Q932.Q42.AT93.72 J76.K7.7642.KT98 AT85.AJT3.QJ8.Q6"]
[Auction "S"]
Pass 1NT Pass Pass Pass

[Board "16"]
[Room "Open"]
[Dealer "W"]
[Declarer "W"]
[Contract "4SX"]
[Deal "N:.KQT9532.AKT5.T6 K986.6.QJ9763.Q3 QT432.AJ7.82.K95 AJ75.84.4.AJ8742"]
[Auction "W"]
1C 1D 1H 2D 2S 4H 4S X Pass Pass Pass

[Board "17"]
[Room "Closed"]
[Dealer "N"]
[Declarer "N"]
[Contract "3D"]
[Deal "N:AK.4.AKJ763.A864 Q4.QJ97.854.Q532 T9875.T852.Q92.J J632.AK63.T.KT97"]
[Auction "N"]
1D Pass Pass X 3D Pass Pass Pass

[Board "17"]
[Room "Open"]
[Dealer "N"]
[Declarer "S"]
[Contract "4S"]
[Deal "N:AK.4.AKJ763.A864 Q4.QJ97.854.Q532 T9875.T852.Q92.J J632.AK63.T.KT97"]
[Auction "N"]
2D Pass 2H Pass 3D Pass 3S Pass 4S Pass Pass Pass

[Board "18"]
[Room "Closed"]
[Dealer "E"]
[Declarer "E"]
[Contract "2S"]
[Deal "N:AT.J62.7632.AJ98 K9652.943.AKJT8. J874.AKQ7.Q5.T52 Q3.T85.94.KQ7643"]
[Auction "E"]
1S Pass 1NT Pass 2D X 2S Pass Pass Pass

[Board "19"]
[Room "Open"]
[Dealer "S"]
[Declarer "N"]
[Contract "1S"]
[Deal "N:AQ972.8752.K5.JT KT853.JT9..AQ874 64.A4.T87432.K96 J.KQ63.AQJ96.532"]
[Auction "S"]
Pass 1D 1S Pass Pass Pass

[Board "19"]
[Room "Closed"]
[Dealer "S"]
[Declarer "E"]
[Contract "5C"]
[Deal "N:AQ972.8752.K5.JT KT853.JT9..AQ874 64.A4.T87432.K96 J.KQ63.AQJ96.532"]
[Auction "S"]
Pass 1D 1S 2C Pass 3C Pass 5C Pass Pass Pass

[Board "20"]
[Room "Open"]
[Dealer "W"]
[Declarer "E"]
[Contract "1H"]
[Deal "N:QJ2.84.98532.JT9 AKT5.AK973.AK.62 63.J62.QJT7.AKQ4 9874.QT5.64.8753"]
[Auction "W"]
Pass Pass 1H Pass Pass Pass

[Board "21"]
[Room "Closed"]
[Dealer "N"]
[Declarer "E"]
[Contract "4S"]
[Deal "N:.K6.Q763.AJT8643 QJ742.QT75.J95.Q 953.AJ43.T82.K52 AKT86.982.AK4.97"]
[Auction "N"]
1C 1S X 2C 3C Pass Pass 4S Pass Pass Pass

[Board "21"]
[Room "Open"]
[Dealer "N"]
[Declarer "N"]
[Contract "5CX"]
[Deal "N:.K6.Q763.AJT8643 QJ742.QT75.J95.Q 953.AJ43.T82.K52 AKT86.982.AK4.97"]
[Auction "N"]
1C 1S X 4S 4NT Pass 5C X Pass Pass Pass

[Board "22"]
[Room "Closed"]
[Dealer "E"]
[Declarer "E"]
[Contract "4H"]
[Deal "N:KT93.542.QJ72.K5 AQ.QT86.AK6.AQ73 J654.K.985.JT982 872.AJ973.T43.64"]
[Auction "E"]
2NT Pass 3D Pass 3NT Pass 4D Pass 4H Pass Pass Pass

[Board "22"]
[Room "Open"]
[Dealer "E"]
[Declarer "E"]
[Contract "3NT"]
[Deal "N:KT93.542.QJ72.K5 AQ.QT86.AK6.AQ73 J654.K.985.JT982 872.AJ973.T43.64"]
[Auction "E"]
2C Pass 2S Pass 2NT Pass 3C Pass 3NT Pass Pass Pass

[Board "23"]
[Room "Closed"]
[Dealer "S"]
[Declarer "E"]
[Contract "3NT"]
[Deal "N:K952.AT8.9832.AJ AQT3.K3.AKJT75.4 874.964.64.K9532 J6.QJ752.Q.QT876"]
[Auction "S"]
Pass 2H Pass 2NT Pass 3H Pass 3NT Pass Pass Pass

[Board "23"]
[Room "Open"]
[Dealer "S"]
[Declarer "W"]
[Contract "4H"]
[Deal "N:K952.AT8.9832.AJ AQT3.K3.AKJT75.4 874.964.64.K9532 J6.QJ752.Q.QT876"]
[Auction "S"]
Pass Pass 1NT X XX Pass 2C 3D Pass 3H Pass 4H Pass Pass Pass

[Board "24"]
[Room "Closed"]
[Dealer "W"]
[Declarer "W"]
[Contract "4S"]
[Deal "N:53.JT5432.K4.QJ6 KQ76.Q.J876.K972 984.AK986.2.T854 AJT2.7.AQT953.A3"]
[Auction "W"]
1D 1H X 4H 4S Pass Pass Pass

[Board "24"]
[Room "Open"]
[Dealer "W"]
[Declarer "N"]
[Contract "5HX"]
[Deal "N:53.JT5432.K4.QJ6 KQ76.Q.J876.K972 984.AK986.2.T854 AJT2.7.AQT953.A3"]
[Auction "W"]
1D 2H X 3NT 4S Pass Pass 5H Pass Pass X Pass Pass Pass

[Board "25"]
[Room "Closed"]
[Dealer "N"]
[Declarer "N"]
[Contract "7S"]
[Deal "N:JT87532.A4.AKJ.4 Q9.J93.9653.9653 AK64.Q6.T84.AKQJ .KT8752.Q72.T872"]
[Auction "N"]
1S Pass 2NT Pass 3C Pass 4C Pass 4NT Pass 5D Pass 5NT Pass 6C Pass 7S Pass Pass Pass

[Board "25"]
[Room "Open"]
[Dealer "N"]
[Declarer "N"]
[Contract "6S"]
[Deal "N:JT87532.A4.AKJ.4 Q9.J93.9653.9653 AK64.Q6.T84.AKQJ .KT8752.Q72.T872"]
[Auction "N"]
1S Pass 2NT Pass 3C Pass 4C Pass 4D Pass 5S Pass 6S Pass Pass Pass

[Board "26"]
[Room "Closed"]
[Dealer "E"]
[Declarer "E"]
[Contract "4S"]
[Deal "N:98.Q.AQ95.AK9765 AJ764.AK85.KJ43. T53.T974.T8.J843 KQ2.J632.762.QT2"]
[Auction "E"]
1S Pass 1NT 2C X Pass 3S Pass 4S Pass Pass Pass

[Board "26"]
[Room "Open"]
[Dealer "E"]
[Declarer "E"]
[Contract "4H"]
[Deal "N:98.Q.AQ95.AK9765 AJ764.AK85.KJ43. T53.T974.T8.J843 KQ2.J632.762.QT2"]
[Auction "E"]
1S Pass 2S 3C 3H Pass 4H Pass Pass Pass

[Board "27"]
[Room "Closed"]
[Dealer "S"]
[Declarer "W"]
[Contract "3NT"]
[Deal "N:AJ7.KJT92.J2.A76 Q96.Q874.6.KJT32 KT54.A653.875.Q9 832..AKQT943.854"]
[Auction "S"]
Pass 3NT Pass Pass Pass

[Board "27"]
[Room "Open"]
[Dealer "S"]
[Declarer "W"]
[Contract "3D"]
[Deal "N:AJ7.KJT92.J2.A76 Q96.Q874.6.KJT32 KT54.A653.875.Q9 832..AKQT943.854"]
[Auction "S"]
Pass 3D Pass Pass Pass

[Board "28"]
[Room "Closed"]
[Dealer "W"]
[Declarer "W"]
[Contract "1NT"]
[Deal "N:765.87.AQT84.A94 K2.AKJT5.K65.T82 QJT98.Q963.J.K75 A43.42.9732.QJ63"]
[Auction "W"]
Pass Pass 1H Pass 1NT Pass Pass Pass

[Board "28"]
[Room "Open"]
[Dealer "W"]
[Declarer "S"]
[Contract "2S"]
[Deal "N:765.87.AQT84.A94 K2.AKJT5.K65.T82 QJT98.Q963.J.K75 A43.42.9732.QJ63"]
[Auction "W"]
Pass Pass 1H 1S X 2H X 2S Pass Pass Pass

[Board "29"]
[Room "Closed"]
[Dealer "N"]
[Declarer "E"]
[Contract "1NT"]
[Deal "N:J86.JT93.AQ98.84 AKT75.864.42.KQ5 Q43.K5.KJT7.A732 92.AQ72.653.JT96"]
[Auction "N"]
Pass 1NT Pass Pass Pass

[Board "29"]
[Room "Open"]
[Dealer "N"]
[Declarer "W"]
[Contract "1NT"]
[Deal "N:J86.JT93.AQ98.84 AKT75.864.42.KQ5 Q43.K5.KJT7.A732 92.AQ72.653.JT96"]
[Auction "N"]
Pass 1S Pass 1NT Pass Pass Pass

[Board "30"]
[Room "Closed"]
[Dealer "E"]
[Declarer "E"]
[Contract "4H"]
[Deal "N:T.T73.QJ876.AT97 A76.AQJ962.3.KJ4 KJ52.K4.A952.532 Q9843.85.KT4.Q86"]
[Auction "E"]
1H Pass 1S Pass 3H Pass 4H Pass Pass Pass

[Board "30"]
[Room "Open"]
[Dealer "E"]
[Declarer "E"]
[Contract "3H"]
[Deal "N:T.T73.QJ876.AT97 A76.AQJ962.3.KJ4 KJ52.K4.A952.532 Q9843.85.KT4.Q86"]
[Auction "E"]
1H X XX 2D 3H Pass Pass Pass

[Board "31"]
[Room "Closed"]
[Dealer "S"]
[Declarer "W"]
[Contract "1NT"]
[Deal "N:AT7.A9.J952.T953 J93.KJ72.AK6.QJ2 K852.QT643.QT.84 Q64.85.8743.AK76"]
[Auction "S"]
Pass Pass Pass 1H Pass 1NT Pass Pass Pass

[Board "31"]
[Room "Open"]
[Dealer "S"]
[Declarer "E"]
[Contract "3NT"]
[Deal "N:AT7.A9.J952.T953 J93.KJ72.AK6.QJ2 K852.QT643.QT.84 Q64.85.8743.AK76"]
[Auction "S"]
Pass Pass Pass 1NT Pass 3NT Pass Pass Pass

[Board "32"]
[Room "Closed"]
[Dealer "W"]
[Declarer "N"]
[Contract "3NT"]
[Deal "N:AQT.AQ.92.AQJT87 J73.6543.QJT65.5 85.9872.K87.K964 K9642.KJT.A43.32"]
[Auction "W"]
1S X 2S Pass Pass 3NT Pass Pass Pass`;
const PACK_HAINES = `[Board "1"]
[Room "Open"]
[Dealer "N"]
[Declarer "E"]
[Contract "5S"]
[Deal "N:96.KJ8632.8.JT52 KJT743..QJT953.9 A5.Q74.72.AQ8643 Q82.AT95.AK64.K7"]
[Auction "N"]
2H 4S Pass 4NT Pass 5C Pass 5S Pass Pass Pass

[Board "1"]
[Room "Closed"]
[Dealer "N"]
[Declarer "S"]
[Contract "6CX"]
[Deal "N:96.KJ8632.8.JT52 KJT743..QJT953.9 A5.Q74.72.AQ8643 Q82.AT95.AK64.K7"]
[Auction "N"]
2D Pass 2S X 3H 4S 6C X Pass Pass Pass

[Board "2"]
[Room "Closed"]
[Dealer "E"]
[Declarer "N"]
[Contract "4C"]
[Deal "N:983.Q742.J.AKQ65 AK765.J3.A653.32 QT.AT85.K987.JT7 J42.K96.QT42.984"]
[Auction "E"]
1S Pass 2S 3C 3S 4C Pass Pass Pass

[Board "2"]
[Room "Open"]
[Dealer "E"]
[Declarer "N"]
[Contract "4H"]
[Deal "N:983.Q742.J.AKQ65 AK765.J3.A653.32 QT.AT85.K987.JT7 J42.K96.QT42.984"]
[Auction "E"]
1S Pass 1NT 2C 2D 2S 3D 3H Pass 4H Pass Pass Pass

[Board "3"]
[Room "Closed"]
[Dealer "S"]
[Declarer "N"]
[Contract "5HX"]
[Deal "N:.KQJ632.KQJ87.62 AQ8542.AT8.T6.AK JT73.754.A32.Q85 K96.9.954.JT9743"]
[Auction "S"]
Pass Pass 4H 4S Pass Pass 5D Pass 5H Pass Pass X Pass Pass Pass

[Board "3"]
[Room "Open"]
[Dealer "S"]
[Declarer "N"]
[Contract "6HX"]
[Deal "N:.KQJ632.KQJ87.62 AQ8542.AT8.T6.AK JT73.754.A32.Q85 K96.9.954.JT9743"]
[Auction "S"]
Pass Pass 1H X 2H 3C 3D 3S Pass 4S 5H 5S X Pass 6D X 6H X Pass Pass Pass

[Board "4"]
[Room "Closed"]
[Dealer "W"]
[Declarer "N"]
[Contract "4S"]
[Deal "N:AQT4.A96.AQ984.8 K32.K832.J532.Q2 J865.QJ7.K6.KT53 97.T54.T7.AJ9764"]
[Auction "W"]
Pass 1S Pass 2S Pass 4S Pass Pass Pass

[Board "4"]
[Room "Open"]
[Dealer "W"]
[Declarer "S"]
[Contract "4S"]
[Deal "N:AQT4.A96.AQ984.8 K32.K832.J532.Q2 J865.QJ7.K6.KT53 97.T54.T7.AJ9764"]
[Auction "W"]
Pass 1C Pass 2D Pass 2H Pass 2S Pass 4S Pass Pass Pass

[Board "5"]
[Room "Closed"]
[Dealer "N"]
[Declarer "N"]
[Contract "4S"]
[Deal "N:AQ76.653.QJ94.Q5 42.QJ42.A.K87642 KJT8.AK98.T8.AJ9 953.T7.K76532.T3"]
[Auction "N"]
1S Pass 2C Pass 2NT Pass 4S Pass Pass Pass

[Board "5"]
[Room "Open"]
[Dealer "N"]
[Declarer "S"]
[Contract "4S"]
[Deal "N:AQ76.653.QJ94.Q5 42.QJ42.A.K87642 KJT8.AK98.T8.AJ9 953.T7.K76532.T3"]
[Auction "N"]
Pass 1C 1NT Pass 2C Pass 2H Pass 3NT Pass 4S Pass Pass Pass

[Board "6"]
[Room "Closed"]
[Dealer "E"]
[Declarer "S"]
[Contract "3NT"]
[Deal "N:AJT5.A4.Q87.KT65 K632.Q.J6543.QJ8 74.KJ62.KT92.A94 Q98.T98753.A.732"]
[Auction "E"]
Pass 1H Pass 1S Pass 1NT Pass 3NT Pass Pass Pass

[Board "7"]
[Room "Closed"]
[Dealer "S"]
[Declarer "N"]
[Contract "3NT"]
[Deal "N:Q9.K432.T9732.J3 72.85.AJ54.AKT84 AK.AJT6.KQ86.752 JT86543.Q97..Q96"]
[Auction "S"]
1C 2S 2NT Pass 3NT Pass Pass Pass

[Board "7"]
[Room "Open"]
[Dealer "S"]
[Declarer "S"]
[Contract "1NT"]
[Deal "N:Q9.K432.T9732.J3 72.85.AJ54.AKT84 AK.AJT6.KQ86.752 JT86543.Q97..Q96"]
[Auction "S"]
1NT Pass Pass Pass

[Board "8"]
[Room "Closed"]
[Dealer "W"]
[Declarer "W"]
[Contract "4S"]
[Deal "N:976.743.AK95.Q75 KJ32.952.T872.A2 T5.J86.Q63.J9863 AQ84.AKQT.J4.KT4"]
[Auction "W"]
2NT Pass 3C Pass 3D X 3H Pass 3S Pass 4S Pass Pass Pass

[Board "8"]
[Room "Open"]
[Dealer "W"]
[Declarer "E"]
[Contract "4S"]
[Deal "N:976.743.AK95.Q75 KJ32.952.T872.A2 T5.J86.Q63.J9863 AQ84.AKQT.J4.KT4"]
[Auction "W"]
1H Pass 1S Pass 4S Pass Pass Pass

[Board "9"]
[Room "Closed"]
[Dealer "N"]
[Declarer "W"]
[Contract "4C"]
[Deal "N:Q9763.K8765.A8.3 .J943.QJT32.AJ98 AKT84.T2.965.Q54 J52.AQ.K74.KT762"]
[Auction "N"]
Pass Pass Pass 1C 2C 2D 3S Pass Pass 4C Pass Pass Pass

[Board "9"]
[Room "Open"]
[Dealer "N"]
[Declarer "N"]
[Contract "4S"]
[Deal "N:Q9763.K8765.A8.3 .J943.QJT32.AJ98 AKT84.T2.965.Q54 J52.AQ.K74.KT762"]
[Auction "N"]
1S Pass 4S Pass Pass Pass

[Board "10"]
[Room "Closed"]
[Dealer "E"]
[Declarer "W"]
[Contract "3NT"]
[Deal "N:J943.KT96.T973.7 AK85.J74.K6.Q532 762.Q52.QJ84.KJ9 QT.A83.A52.AT864"]
[Auction "E"]
1C Pass 2C Pass 2D Pass 3NT Pass Pass Pass

[Board "10"]
[Room "Open"]
[Dealer "E"]
[Declarer "E"]
[Contract "3NT"]
[Deal "N:J943.KT96.T973.7 AK85.J74.K6.Q532 762.Q52.QJ84.KJ9 QT.A83.A52.AT864"]
[Auction "E"]
1NT Pass 3NT Pass Pass Pass

[Board "11"]
[Room "Closed"]
[Dealer "S"]
[Declarer "S"]
[Contract "6NT"]
[Deal "N:Q5.K53.AT.AQJT74 JT8.9764.QJ963.8 AK972.AQT8.K4.K5 643.J2.8752.9632"]
[Auction "S"]
1C Pass 2C Pass 2S Pass 3C Pass 3H Pass 4C Pass 5NT Pass 6NT Pass Pass Pass

[Board "12"]
[Room "Closed"]
[Dealer "W"]
[Declarer "S"]
[Contract "6CX"]
[Deal "N:92.98762.J.J9872 865.J54.6432.T54 AJT43..QT9.AKQ63 KQ7.AKQT3.AK875."]
[Auction "W"]
2C Pass 2D 2S 3H Pass 4H 5C 5H 6C Pass Pass X Pass Pass Pass

[Board "12"]
[Room "Open"]
[Dealer "W"]
[Declarer "W"]
[Contract "4HX"]
[Deal "N:92.98762.J.J9872 865.J54.6432.T54 AJT43..QT9.AKQ63 KQ7.AKQT3.AK875."]
[Auction "W"]
1H Pass Pass 2H 4D Pass 4H X Pass Pass Pass

[Board "13"]
[Room "Closed"]
[Dealer "N"]
[Declarer "N"]
[Contract "3NT"]
[Deal "N:QJ.J986.A85.KQT5 K9865.K72.96.986 T742.AQT.KT4.AJ2 A3.543.QJ732.743"]
[Auction "N"]
1NT Pass 3NT Pass Pass Pass

[Board "14"]
[Room "Closed"]
[Dealer "E"]
[Declarer "E"]
[Contract "1NT"]
[Deal "N:KT32.83.Q62.KT63 986.KJ5.J98.Q975 74.AQ976.KT43.J8 AQJ5.T42.A75.A42"]
[Auction "E"]
Pass 1H X 1S 1NT Pass Pass Pass

[Board "14"]
[Room "Open"]
[Dealer "E"]
[Declarer "S"]
[Contract "2H"]
[Deal "N:KT32.83.Q62.KT63 986.KJ5.J98.Q975 74.AQ976.KT43.J8 AQJ5.T42.A75.A42"]
[Auction "E"]
Pass Pass 1NT Pass Pass 2H Pass Pass Pass

[Board "15"]
[Room "Closed"]
[Dealer "S"]
[Declarer "W"]
[Contract "4S"]
[Deal "N:A432.J82.74.Q965 KJ9.A.AQ9653.KJ3 8.QT654.KJ82.A74 QT765.K973.T.T82"]
[Auction "S"]
1H 1S 2H 4S Pass Pass Pass

[Board "16"]
[Room "Closed"]
[Dealer "W"]
[Declarer "N"]
[Contract "3D"]
[Deal "N:A87.9.KJT975.K97 .KJ65.AQ632.AQ54 QJT6.T8742..JT86 K95432.AQ3.84.32"]
[Auction "W"]
2D 3D Pass Pass Pass

[Board "16"]
[Room "Open"]
[Dealer "W"]
[Declarer "E"]
[Contract "3NT"]
[Deal "N:A87.9.KJT975.K97 .KJ65.AQ632.AQ54 QJT6.T8742..JT86 K95432.AQ3.84.32"]
[Auction "W"]
Pass 1D Pass 1H 1S 2D 3NT Pass Pass Pass

[Board "17"]
[Room "Closed"]
[Dealer "N"]
[Declarer "W"]
[Contract "3H"]
[Deal "N:T53.J92.843.KQ75 J42.KQT73.QJ9.T9 AQ97..AT762.A843 K86.A8654.K5.J62"]
[Auction "N"]
Pass Pass 1D 1H Pass 2NT X 3H Pass Pass Pass

[Board "17"]
[Room "Open"]
[Dealer "N"]
[Declarer "N"]
[Contract "4C"]
[Deal "N:T53.J92.843.KQ75 J42.KQT73.QJ9.T9 AQ97..AT762.A843 K86.A8654.K5.J62"]
[Auction "N"]
Pass Pass 1D 1H Pass 3H X Pass 4C Pass Pass Pass

[Board "18"]
[Room "Closed"]
[Dealer "E"]
[Declarer "S"]
[Contract "4H"]
[Deal "N:AT6.Q86.AT4.QT65 KJ952.K3.QJ92.43 87.AJ752.K7.AKJ2 Q43.T94.8653.987"]
[Auction "E"]
2S X Pass 3C Pass 3H Pass 4H Pass Pass Pass

[Board "18"]
[Room "Open"]
[Dealer "E"]
[Declarer "N"]
[Contract "3NT"]
[Deal "N:AT6.Q86.AT4.QT65 KJ952.K3.QJ92.43 87.AJ752.K7.AKJ2 Q43.T94.8653.987"]
[Auction "E"]
2S X 3S 3NT Pass Pass Pass

[Board "19"]
[Room "Closed"]
[Dealer "S"]
[Declarer "E"]
[Contract "3NT"]
[Deal "N:KT52.AJ43.T93.52 A7.K82.AQ76.KT76 QJ964.T95.K52.94 83.Q76.J84.AQJ83"]
[Auction "S"]
Pass Pass Pass 1NT Pass 3C Pass 3H Pass 3NT Pass Pass Pass

[Board "20"]
[Room "Closed"]
[Dealer "W"]
[Declarer "E"]
[Contract "3S"]
[Deal "N:T532.AT4.J8.QJ96 KQ976.Q5.K632.T2 8.KJ93.Q974.A754 AJ4.8762.AT5.K83"]
[Auction "W"]
1C Pass 1S X XX 2C 2S 3C Pass Pass 3D Pass 3S Pass Pass Pass

[Board "20"]
[Room "Open"]
[Dealer "W"]
[Declarer "E"]
[Contract "2S"]
[Deal "N:T532.AT4.J8.QJ96 KQ976.Q5.K632.T2 8.KJ93.Q974.A754 AJ4.8762.AT5.K83"]
[Auction "W"]
1H Pass 1S Pass 1NT Pass 2S Pass Pass Pass

[Board "21"]
[Room "Open"]
[Dealer "N"]
[Declarer "N"]
[Contract "3NT"]
[Deal "N:.AK654.Q8632.Q72 T2.9872.AJ9.AK53 AKQ93.J.K54.9864 J87654.QT3.T7.JT"]
[Auction "N"]
1H Pass 1S Pass 2D Pass 3C Pass 3NT Pass Pass Pass

[Board "22"]
[Room "Open"]
[Dealer "E"]
[Declarer "E"]
[Contract "4H"]
[Deal "N:8764.Q94.AK74.A4 5.AK732.J832.Q76 KQ93.J.QT9.J9532 AJT2.T865.65.KT8"]
[Auction "E"]
2H Pass 4H Pass Pass Pass

[Board "22"]
[Room "Closed"]
[Dealer "E"]
[Declarer "E"]
[Contract "3H"]
[Deal "N:8764.Q94.AK74.A4 5.AK732.J832.Q76 KQ93.J.QT9.J9532 AJT2.T865.65.KT8"]
[Auction "E"]
Pass Pass Pass 1NT 2H X 3H Pass Pass Pass

[Board "23"]
[Room "Open"]
[Dealer "S"]
[Declarer "S"]
[Contract "1NT"]
[Deal "N:K5.Q873.98763.52 T9763.AT2.K5.JT9 Q84.KJ64.A42.KQ6 AJ2.95.QJT.A8743"]
[Auction "S"]
1NT Pass Pass Pass

[Board "24"]
[Room "Open"]
[Dealer "W"]
[Declarer "E"]
[Contract "3H"]
[Deal "N:T742..T84.JT9872 AK653.6532.73.K5 9.AQJ.AK965.AQ64 QJ8.KT9874.QJ2.3"]
[Auction "W"]
2D Pass 3H Pass Pass Pass

[Board "24"]
[Room "Closed"]
[Dealer "W"]
[Declarer "N"]
[Contract "6C"]
[Deal "N:T742..T84.JT9872 AK653.6532.73.K5 9.AQJ.AK965.AQ64 QJ8.KT9874.QJ2.3"]
[Auction "W"]
2D Pass 4H X Pass 5C Pass 6C Pass Pass Pass`;
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
    deal: { seed: 900000 + i, hands: e.hands, contract: e.contract, auction: e.auction, dealer: e.dealer },
  }));
  const packs = BUNDLED_PARSED.map(p => ({
    key: p.key, label: p.name[lang],
    items: p.deals.map((e, i) => ({
      id: `pack-${p.key}-${i}`,
      label: packDealLabel(e, i, lang),
      deal: { seed: 700000 + i, hands: e.hands, contract: e.contract, auction: e.auction, dealer: e.dealer },
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
    auctionTitle: "Subasta", auctionBtn: "Subasta", nextCall: "Siguiente voz", showAll: "Mostrar toda",
    startPlay: "Empezar carteo", dealerLbl: "Dador", noAuction: "Subasta no registrada para esta mano.",
    contractReached: "Contrato", declares: "declara",
    introTitle: "¿Cómo quieres empezar?", replayReal: "Ver la subasta real", bidAndCompare: "Subastar tú y comparar",
    bidYourself: "Subastar tú (robots de compañero/rivales)", goPlay: "Ir directo al carteo", yourCall: "Te toca pujar",
    thinking: "Pensando…", yourAuction: "Tu subasta", realAuctionLbl: "Subasta real (mesa)",
    compareTitle: "Tu subasta vs. la mesa real", matchTag: "igual", diffTag: "distinta",
    atTable: "En la mesa", meaningLbl: "Significa", passedOut: "Pasada (sin contrato)",
    declarerTag: "declarante", partnerTag: "compañero", toDefeat: "para hundir", defeated: "¡Hundido!", contractMade: "Contrato cumplido", defendTitle: "Defiendes", levelExpert: "Experto", levelStd: "Estándar", difficulty: "Dificultad del juego", diffEasy: "Principiante", diffMed: "Intermedio", diffHard: "Experto", diffEasyD: "Los robots juegan flojo: ideal para aprender el carteo sin agobios.", suggestLbl: "Sugerencia", vulLbl: "Vul", vulYou: "tú", vulOpp: "rivales", vulBoth: "ambos", vulNone: "nadie", yourScore: "Tu puntuación", vulYesShort: "vulnerable", vulNoShort: "no vul.", planBtn: "Plan", planTitle: "Plan de carteo", sureWinners: "Ganadores seguros", estLosers: "Perdedoras est.", planNTgap: "Te faltan {n} baza(s): desarróllalas en tu palo más largo ({suit}) o con impasses antes de ceder la mano.", planNTok: "Tienes ganadores de sobra: cóbralos con cuidado de bloqueos y entradas.", planSuit: "Cuenta perdedoras, saca triunfos ({trump}) si controlas, y maneja las perdedoras con fallo, descarte o impasse antes de soltar el control.", optimalBtn: "Óptimo (doble-muerto)", calculating: "Calculando…", optimalLbl: "Óptimo", tricksWord: "bazas", exact: "exacto", estimated: "estimado", makes: "cumple", downN: "cae por {n}", optimalErr: "No se pudo calcular aquí (disponible en el navegador; o juega unas bazas y reintenta).", analyzeBtn: "Analizar la mano", analyzeTitle: "Análisis (doble-muerto)", youMade: "Hiciste {n} bazas.", analyzedFrom: "Análisis exacto desde el truco {t}.", analyzedNone: "El final no fue analizable con cálculo exacto aquí.", youPlayed: "jugaste", betterWas: "mejor", noErrors: "Sin errores en la parte analizada. ¡Bien jugado!", diffMedD: "Juego sólido y natural (motor por defecto).", diffHardD: "Información perfecta al seguir: ganan/cortan al menor coste. Muy exigente.", themesNav: "Temas", themesTitle: "Práctica temática", themesIntro: "Manos verificadas por doble-muerto para entrenar técnicas concretas.", themeDeclare: "Declaras", themeDefend: "Defiendes", themeDeal: "Mano", themePlay: "Jugar", themeDD: "Doble-muerto", themeRandom: "Mano aleatoria", themeRandomAny: "Mano aleatoria (cualquier tema)", leadTitle: "Análisis de la salida", yourLead: "Tu salida", defLead: "Salida del defensor", declMakes: "el declarante hace", leadOptimal: "Salida óptima ✓ (mejor defensa)", leadBest: "Mejor salida", reviewNav: "Repaso", reviewTitle: "Repaso de errores", reviewLead: "Salida", reviewYouDefend: "Defiendes desde el", reviewPickLead: "Elige tu salida.", reviewYourLead: "Tu salida", reviewBest: "Mejor", reviewOptimal: "¡Salida óptima! ✓", reviewAgain: "Otra vez", reviewGood: "Bien", reviewEasy: "Fácil", reviewNonePending: "No hay repasos pendientes", reviewDone: "¡Repaso completado!", reviewTotal: "manos en tu mazo de repaso", reviewNextDue: "Próximo repaso", reviewGradedN: "Repasaste {n} en esta sesión.", reviewEmptyHint: "tus errores de salida en las manos temáticas aparecerán aquí.", reviewPlay: "Carteo", reviewTrickN: "Truco {n}", reviewYouPlay: "juegas desde el", reviewWhatPlay: "¿Qué jugarías?", reviewTrick: "Baza", reviewYourHand: "Tu mano", reviewYouPlayed: "Jugaste", reviewCorrect: "¡Correcto! ✓", levelTest: "Test de nivel", mastery: "Maestría", overallMastery: "maestría global", skills: "Destrezas", skillBidding: "Subasta", skillCardplay: "Carteo", skillDefense: "Defensa", skillsHint: "Cobertura de estudio según tu progreso y tus repasos.", nextStep: "Siguiente paso", techniques: "Técnicas avanzadas", techniquesSub: "Seis recursos clave del juego de la carta, con cartas de ejemplo y la línea a seguir.", tqKeyCards: "Cartas clave", tqLine: "La línea", tqPoint: "La idea", statsTitle: "Estadísticas", statsEmpty: "Juega manos para ver tus estadísticas y tendencias.", statContracts: "Contratos cumplidos", statDefense: "Defensa lograda", statLeads: "Salidas óptimas", statHands: "manos", statLeadsN: "salidas", statContractsTrend: "Contratos cumplidos (tendencia)", statLeadsTrend: "Salidas óptimas (tendencia)", statTestTrend: "Tests (% de acierto)", statActivity: "Actividad", statBuckets: "por bloques de 5", stat14d: "últimos 14 días", statTotalHands: "Manos jugadas", statReviews: "Repasos hechos", statsHint: "Calculado a partir de tu juego real registrado en este dispositivo.", helpTitle: "Ayuda y glosario", glossary: "Glosario", glossarySearch: "Buscar término…", glossaryTerms: "términos", glossaryNone: "Sin resultados", tourSkip: "Saltar", tourStart: "¡Empezar!", tourReplay: "Ver la guía rápida", tourReplaySub: "Un recorrido por la app en 6 pasos", tourSteps: [
  { t: "Bienvenido a Bridge Maestro", d: "Aprende bridge (5 cartas en mayores) paso a paso, en español o inglés. Cambia el idioma con el botón de la esquina." },
  { t: "Niveles y maestría", d: "Avanza por niveles. Cada uno mide tu maestría con lecciones, quiz, subasta, manos y un test final. El siguiente nivel se desbloquea al 40% del anterior." },
  { t: "Práctica de juego", d: "Juega manos completas con análisis doble-muerto exacto, además de práctica específica de subasta y de carteo." },
  { t: "Manos temáticas", d: "Entrena situaciones concretas: slams, grandes slams, defensa, batir slams o exprimir sobrebazas. Cada tema tiene 50 manos." },
  { t: "Repaso de errores", d: "Tus fallos de salida y de carteo se guardan y vuelven con repetición espaciada. Y puedes repasar cualquier mano truco a truco." },
  { t: "¿Por dónde empiezo?", d: "Mira la tarjeta \"Siguiente paso\" del panel: siempre te dice la acción más útil ahora mismo. ¡Suerte!" },
], mastered: "Dominado", locked: "Bloqueado", unlockHint: "Alcanza {n}% en el nivel anterior para desbloquear", testPassed: "¡Aprobado!", testFailed: "No superado", testNeed: "necesitas 80% para aprobar", testReview: "Repasa tus fallos", testBest: "Mejor marca", testNoHints: "Sin pistas hasta el final.", testFinish: "Terminar test", replayHand: "Repasar la mano", replayStart: "Inicio", replayEnd: "Final", replayNextError: "Saltar al próximo error", replayNoFindings: "Analiza la mano para ver dónde fallaste.", declarer3: "declarante", defender3: "defensa", settingsTitle: "Ajustes", themePick: "Elige el aspecto de la interfaz:", themeNote: "El tema se guarda y se aplica en toda la app. ✦ = muestra consejos de aprendizaje.",
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
    auctionTitle: "Auction", auctionBtn: "Auction", nextCall: "Next call", showAll: "Show all",
    startPlay: "Start play", dealerLbl: "Dealer", noAuction: "No recorded auction for this deal.",
    contractReached: "Contract", declares: "declares",
    introTitle: "How would you like to begin?", replayReal: "Replay the real auction", bidAndCompare: "Bid it yourself & compare",
    bidYourself: "Bid it yourself (partner/opps are robots)", goPlay: "Go straight to play", yourCall: "Your call",
    thinking: "Thinking…", yourAuction: "Your auction", realAuctionLbl: "Real auction (table)",
    compareTitle: "Your auction vs. the real table", matchTag: "same", diffTag: "different",
    atTable: "At the table", meaningLbl: "Means", passedOut: "Passed out (no contract)",
    declarerTag: "declarer", partnerTag: "partner", toDefeat: "to defeat", defeated: "Defeated!", contractMade: "Contract made", defendTitle: "You defend", levelExpert: "Expert", levelStd: "Standard", difficulty: "Play difficulty", diffEasy: "Beginner", diffMed: "Intermediate", diffHard: "Expert", diffEasyD: "Robots play loosely: great for learning the play with no pressure.", suggestLbl: "Suggestion", vulLbl: "Vul", vulYou: "you", vulOpp: "opp.", vulBoth: "both", vulNone: "none", yourScore: "Your score", vulYesShort: "vulnerable", vulNoShort: "non-vul.", planBtn: "Plan", planTitle: "Play plan", sureWinners: "Sure winners", estLosers: "Est. losers", planNTgap: "You are {n} trick(s) short: develop them in your longest suit ({suit}) or with finesses before giving up the lead.", planNTok: "You have plenty of winners: cash them watching for blockages and entries.", planSuit: "Count losers, draw trumps ({trump}) if you control them, and handle losers by ruffing, discarding or finessing before releasing control.", optimalBtn: "Optimal (double-dummy)", calculating: "Calculating…", optimalLbl: "Optimal", tricksWord: "tricks", exact: "exact", estimated: "estimate", makes: "makes", downN: "down {n}", optimalErr: "Could not compute here (works in the browser; or play a few tricks and retry).", analyzeBtn: "Analyze the hand", analyzeTitle: "Analysis (double-dummy)", youMade: "You made {n} tricks.", analyzedFrom: "Exact analysis from trick {t}.", analyzedNone: "The ending was not exactly analyzable here.", youPlayed: "you played", betterWas: "better", noErrors: "No errors in the analyzed part. Well played!", diffMedD: "Solid, natural play (default engine).", diffHardD: "Perfect-information following: wins/ruffs at least cost. Very demanding.", themesNav: "Themes", themesTitle: "Thematic practice", themesIntro: "Double-dummy verified deals to drill specific techniques.", themeDeclare: "You declare", themeDefend: "You defend", themeDeal: "Deal", themePlay: "Play", themeDD: "Double-dummy", themeRandom: "Random deal", themeRandomAny: "Random deal (any theme)", leadTitle: "Opening-lead analysis", yourLead: "Your lead", defLead: "Defender's lead", declMakes: "declarer makes", leadOptimal: "Optimal lead ✓ (best defense)", leadBest: "Best lead", reviewNav: "Review", reviewTitle: "Mistakes review", reviewLead: "Lead", reviewYouDefend: "You defend as", reviewPickLead: "Choose your lead.", reviewYourLead: "Your lead", reviewBest: "Best", reviewOptimal: "Optimal lead! ✓", reviewAgain: "Again", reviewGood: "Good", reviewEasy: "Easy", reviewNonePending: "No reviews due", reviewDone: "Review complete!", reviewTotal: "deals in your review deck", reviewNextDue: "Next review", reviewGradedN: "You reviewed {n} this session.", reviewEmptyHint: "your opening-lead mistakes in themed deals will show up here.", reviewPlay: "Card play", reviewTrickN: "Trick {n}", reviewYouPlay: "you play from", reviewWhatPlay: "What would you play?", reviewTrick: "Trick", reviewYourHand: "Your hand", reviewYouPlayed: "You played", reviewCorrect: "Correct! ✓", levelTest: "Level test", mastery: "Mastery", overallMastery: "overall mastery", skills: "Skills", skillBidding: "Bidding", skillCardplay: "Card play", skillDefense: "Defense", skillsHint: "Study coverage based on your progress and reviews.", nextStep: "Next step", techniques: "Advanced techniques", techniquesSub: "Six key card-play tools, with example cards and the line to follow.", tqKeyCards: "Key cards", tqLine: "The line", tqPoint: "The point", statsTitle: "Statistics", statsEmpty: "Play hands to see your stats and trends.", statContracts: "Contracts made", statDefense: "Defense success", statLeads: "Optimal leads", statHands: "hands", statLeadsN: "leads", statContractsTrend: "Contracts made (trend)", statLeadsTrend: "Optimal leads (trend)", statTestTrend: "Tests (% correct)", statActivity: "Activity", statBuckets: "in blocks of 5", stat14d: "last 14 days", statTotalHands: "Hands played", statReviews: "Reviews done", statsHint: "Computed from your real play logged on this device.", helpTitle: "Help & glossary", glossary: "Glossary", glossarySearch: "Search a term…", glossaryTerms: "terms", glossaryNone: "No results", tourSkip: "Skip", tourStart: "Start!", tourReplay: "See the quick guide", tourReplaySub: "A 6-step tour of the app", tourSteps: [
  { t: "Welcome to Bridge Maestro", d: "Learn bridge (5-card majors) step by step, in English or Spanish. Switch language with the corner button." },
  { t: "Levels & mastery", d: "Progress through levels. Each measures your mastery via lessons, quiz, bidding, deals and a final test. The next level unlocks at 40% of the previous." },
  { t: "Play practice", d: "Play full hands with exact double-dummy analysis, plus focused bidding and card-play drills." },
  { t: "Themed deals", d: "Train specific situations: slams, grand slams, defense, beating slams or squeezing overtricks. Each theme has 50 deals." },
  { t: "Mistakes review", d: "Your opening-lead and card-play mistakes are saved and resurface via spaced repetition. You can also replay any hand trick by trick." },
  { t: "Where do I start?", d: "Check the \"Next step\" card on the dashboard: it always tells you the most useful action right now. Good luck!" },
], mastered: "Mastered", locked: "Locked", unlockHint: "Reach {n}% in the previous level to unlock", testPassed: "Passed!", testFailed: "Not passed", testNeed: "you need 80% to pass", testReview: "Review your misses", testBest: "Best score", testNoHints: "No hints until the end.", testFinish: "Finish test", replayHand: "Replay the hand", replayStart: "Start", replayEnd: "End", replayNextError: "Jump to next mistake", replayNoFindings: "Analyze the hand to see where you slipped.", declarer3: "declarer", defender3: "defense", settingsTitle: "Settings", themePick: "Choose the interface look:", themeNote: "The theme is saved and applied across the app. ✦ = shows learning tips.",
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
      style={{ width: w, height: h, background: C.ivory, color: red ? C.red : C.ink, borderRadius: 6, border: `1px solid ${onClick ? C.brass : "#bdb38f"}`, boxShadow: onClick ? "0 2px 5px rgba(0,0,0,.35)" : "0 1px 2px rgba(0,0,0,.25)", opacity: dim ? .4 : 1, cursor: onClick ? "pointer" : "default" }}
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
function BiddingBox({ onBid, disabled, minRank = -1, noDouble }) {
  return (
    <div className="flex flex-col gap-1.5 items-center">
      {[1, 2, 3, 4, 5, 6, 7].map(lv => (
        <div key={lv} className="flex gap-1.5">
          {BID_STRAINS.map((st, si) => {
            const bid = `${lv}${st}`;
            const red = SUIT_RED.has(st);
            const rank = lv * 5 + si;
            const off = disabled || rank <= minRank;
            return (
              <button key={st} disabled={off} onClick={() => onBid(bid)}
                style={{ width: 36, height: 28, background: C.ivory, color: st === "NT" ? C.ink : (red ? C.red : C.ink), border: `1px solid ${C.brass}`, borderRadius: 4, opacity: off ? .35 : 1, cursor: off ? "default" : "pointer" }}
                className="text-sm font-semibold flex items-center justify-center hover:-translate-y-0.5 transition-transform">
                {lv}{st === "NT" ? "ST" : st}
              </button>
            );
          })}
        </div>
      ))}
      <div className="flex gap-1.5 mt-1">
        {[["Pass", "Pass"], ["X", "X"], ["XX", "XX"]].map(([v, lbl]) => (
          <button key={v} disabled={disabled || (noDouble && v !== "Pass")} onClick={() => onBid(v)}
            style={{ background: v === "Pass" ? C.feltLite : v === "X" ? C.red : C.brassDim, color: C.ivory, opacity: (disabled || (noDouble && v !== "Pass")) ? .35 : 1 }}
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

// ---------- Level test (graded assessment, no hints until the end) ----------
function LevelTest({ level, lang, best, onDone }) {
  const L = T[lang];
  const pool = level.quiz || [];
  const N = Math.min(8, pool.length);
  const [order] = useState(() => { const idx = pool.map((_, i) => i); for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = idx[i]; idx[i] = idx[j]; idx[j] = t; } return idx.slice(0, N); });
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [pick, setPick] = useState(null);
  const [done, setDone] = useState(false);
  const optText = (o) => typeof o === "string" ? o : o[lang];
  if (pool.length === 0) return <p style={{ color: C.soft }} className="text-sm">—</p>;
  if (done) {
    const correct = order.reduce((a, qi, n) => a + (answers[n] === pool[qi].a ? 1 : 0), 0);
    const frac = correct / order.length, pct = Math.round(frac * 100), passed = frac >= 0.8;
    const wrong = order.map((qi, n) => ({ qi, n })).filter(({ qi, n }) => answers[n] !== pool[qi].a);
    return (
      <div className="flex flex-col gap-3">
        <div style={{ background: passed ? "rgba(63,143,94,0.18)" : "rgba(74,31,36,0.4)", border: `1px solid ${passed ? C.win : C.red}`, borderRadius: 14 }} className="p-5 text-center">
          {passed ? <Award size={40} style={{ color: C.win }} className="mx-auto mb-2" /> : <RotateCcw size={36} style={{ color: C.red }} className="mx-auto mb-2" />}
          <h3 style={{ color: C.ivory }} className="text-lg font-serif">{passed ? L.testPassed : L.testFailed}</h3>
          <p style={{ color: passed ? C.win : C.brass }} className="text-3xl font-bold my-1">{correct}/{order.length}</p>
          <p style={{ color: C.soft }} className="text-sm">{pct}% · {L.testNeed}</p>
        </div>
        {wrong.length > 0 && (
          <div style={{ background: C.feltDark, border: `1px solid ${C.line}`, borderRadius: 12 }} className="p-3 flex flex-col gap-2">
            <span style={{ color: C.brass }} className="text-xs font-bold uppercase">{L.testReview}</span>
            {wrong.map(({ qi, n }) => (
              <div key={n} className="text-sm">
                <p style={{ color: C.ivory }}>{pool[qi].q[lang]}</p>
                <p style={{ color: C.red }} className="text-xs">✗ {optText(pool[qi].opts[answers[n]])}</p>
                <p style={{ color: C.win }} className="text-xs">✓ {optText(pool[qi].opts[pool[qi].a])}</p>
              </div>
            ))}
          </div>
        )}
        <button onClick={() => { setI(0); setAnswers([]); setPick(null); setDone(false); }} style={{ background: C.brass, color: C.ink }} className="px-4 py-2 rounded text-sm font-bold flex items-center gap-1 mx-auto"><RotateCcw size={15} />{L.retry}</button>
      </div>
    );
  }
  const finish = (na) => { const correct = order.reduce((a, qi, n) => a + (na[n] === pool[qi].a ? 1 : 0), 0); onDone(correct / order.length); setDone(true); };
  const next = () => { const na = answers.slice(); na[i] = pick; setAnswers(na); setPick(null); if (i + 1 >= order.length) finish(na); else setI(i + 1); };
  const q = pool[order[i]];
  return (
    <div>
      <div className="flex items-center justify-between mb-3"><SectionTitle icon={Award}>{L.levelTest}</SectionTitle><Pill bg={C.line2}>{i + 1} / {order.length}</Pill></div>
      <div style={{ background: C.feltDark, border: `1px solid ${C.line}`, borderRadius: 12 }} className="p-5">
        <p style={{ color: C.soft }} className="text-xs mb-2">{best ? `${L.testBest}: ${Math.round(best * 100)}%` : L.testNoHints}</p>
        <p style={{ color: C.ivory }} className="text-[15px] mb-4 font-medium">{q.q[lang]}</p>
        <div className="flex flex-col gap-2">
          {q.opts.map((o, idx) => (
            <button key={idx} onClick={() => setPick(idx)} style={{ background: pick === idx ? C.brass : C.feltLite, border: `1px solid ${pick === idx ? C.brass : C.line}`, color: pick === idx ? C.ink : C.ivory }} className="text-left px-3 py-2 rounded text-sm">{optText(o)}</button>
          ))}
        </div>
        <button onClick={next} disabled={pick === null} style={{ background: pick === null ? C.feltLite : C.brass, color: pick === null ? C.soft : C.ink, opacity: pick === null ? .6 : 1 }} className="mt-4 px-4 py-2 rounded text-sm font-bold flex items-center gap-1">{i + 1 >= order.length ? L.testFinish : L.next}<ChevronRight size={16} /></button>
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
      {level.schema && (
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
      )}
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

const SUIT_LETTER = { C: "♣", D: "♦", H: "♥", S: "♠" };
function fmtCall(call, lang) {
  if (call === "Pass" || call === "X" || call === "XX") return bidLabel(call, lang);
  const m = String(call).match(/^(\d)(NT|C|D|H|S)$/);
  if (!m) return call;
  const den = m[2] === "NT" ? (lang === "es" ? "ST" : "NT") : SUIT_LETTER[m[2]];
  return m[1] + den;
}
function callIsRed(call) { return /[♥♦]/.test(call) || /H$|D$/.test(call); }
function AuctionView({ auction, lang, reveal }) {
  const cols = ["N", "E", "S", "W"];
  const L = T[lang];
  if (!auction || !auction.length) return <p style={{ color: C.soft }} className="text-sm">{L.noAuction}</p>;
  const shown = reveal == null ? auction : auction.slice(0, reveal);
  const startCol = cols.indexOf(auction[0].seat);
  const cells = [];
  for (let i = 0; i < startCol; i++) cells.push(null);
  for (const c of shown) cells.push(c);
  const rows = [];
  for (let i = 0; i < cells.length; i += 4) rows.push(cells.slice(i, i + 4));
  return (
    <div style={{ background: C.feltDark, border: `1px solid ${C.line}`, borderRadius: 10 }} className="p-2">
      <div className="grid grid-cols-4 gap-1 mb-1">
        {cols.map(c => <div key={c} style={{ color: C.brass }} className="text-center text-xs font-bold uppercase">{L[c]}</div>)}
      </div>
      <div className="flex flex-col gap-0.5">
        {rows.map((row, ri) => (
          <div key={ri} className="grid grid-cols-4 gap-1">
            {[0, 1, 2, 3].map(ci => {
              const cell = row[ci];
              const txt = cell ? fmtCall(cell.call, lang) : "";
              const red = cell && callIsRed(txt);
              return <div key={ci} style={{ background: cell ? C.feltLite : "transparent", color: red ? "#ff8a80" : C.ivory, borderRadius: 5 }} className="text-center text-sm py-1 font-mono">{txt || "·"}</div>;
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ----- Replay a hand to an arbitrary ply (for the interactive hand replay) -----
function replayTo(deal, played, cursor) {
  const declarer = deal.contract.declarer, trump = deal.contract.strain;
  const hands = { N: deal.hands.N.slice(), E: deal.hands.E.slice(), S: deal.hands.S.slice(), W: deal.hands.W.slice() };
  const playedBy = { N: [], E: [], S: [], W: [] };
  let leader = nextSeat(declarer), trick = [], nsT = 0, ewT = 0, lastCard = null;
  for (let i = 0; i < cursor && i < played.length; i++) {
    const c = played[i];
    const seat = SEAT_ORDER[(SEAT_ORDER.indexOf(leader) + trick.length) % 4];
    hands[seat] = hands[seat].filter(x => !(x.s === c.s && x.r === c.r));
    playedBy[seat].push(c);
    trick.push({ seat, card: c }); lastCard = { seat, card: c };
    if (trick.length === 4) { const w = trickWinner(trick, trump); if (sideOfSeat(w) === "NS") nsT++; else ewT++; leader = w; trick = []; }
  }
  const turn = trick.length ? SEAT_ORDER[(SEAT_ORDER.indexOf(leader) + trick.length) % 4] : leader;
  return { hands, playedBy, trick, turn, nsT, ewT, lastCard };
}

// ----- Reconstruct the position at a captured play-mistake point -----
function reconstructPlay(card) {
  const hands = decodeThemeDeal(card.d);
  const declarer = card.contract.declarer, trump = card.contract.strain;
  let leader = nextSeat(declarer), trick = [];
  for (const c of (card.seq || [])) {
    const seat = SEAT_ORDER[(SEAT_ORDER.indexOf(leader) + trick.length) % 4];
    hands[seat] = hands[seat].filter(x => !(x.s === c.s && x.r === c.r));
    trick.push({ seat, card: c });
    if (trick.length === 4) { leader = trickWinner(trick, trump); trick = []; }
  }
  const turn = trick.length ? SEAT_ORDER[(SEAT_ORDER.indexOf(leader) + trick.length) % 4] : leader;
  return { hands, trick, turn };
}

// ----- Spaced repetition (SM-2 lite) for the personal mistakes deck -----
function sm2(card, grade) { // grade: 0 again, 1 good, 2 easy
  let ease = card.ease || 2.5, interval = card.interval || 0, reps = card.reps || 0, lapses = card.lapses || 0;
  if (grade === 0) { reps = 0; lapses++; ease = Math.max(1.3, ease - 0.2); interval = 0; }
  else { reps++; if (reps === 1) interval = 1; else if (reps === 2) interval = 3; else interval = Math.round(interval * ease); if (grade === 2) { ease += 0.15; interval = Math.round(interval * 1.3); } }
  const dueMs = grade === 0 ? 10 * 60 * 1000 : interval * 24 * 60 * 60 * 1000;
  return { ...card, ease, interval, reps, lapses, due: Date.now() + dueMs, last: Date.now() };
}
function dueCount(reviews, now) { now = now || Date.now(); return (reviews || []).filter(c => (c.due || 0) <= now).length; }

// ----- Opening-lead evaluation (precomputed table for themed deals) -----
const LT_CH = "0123456789ABCD";
function leadEval(deal, openingLead) {
  if (!deal || !deal.lt || !openingLead) return null;
  const leader = nextSeat(deal.contract.declarer); // LHO of declarer leads
  const cards = (deal.hands[leader] || []).slice().sort((a, b) => (SUITS.indexOf(a.s) * 13 + RANKS.indexOf(a.r)) - (SUITS.indexOf(b.s) * 13 + RANKS.indexOf(b.r)));
  if (cards.length !== deal.lt.length) return null;
  const map = {}; let best = 99, bestCards = [];
  for (let i = 0; i < cards.length; i++) { const t = LT_CH.indexOf(deal.lt[i]); map[cards[i].s + cards[i].r] = t; if (t < best) best = t; }
  for (const c of cards) { if (map[c.s + c.r] === best) bestCards.push(c); }
  const ledKey = openingLead.s + openingLead.r;
  const leadTricks = map[ledKey];
  if (leadTricks == null) return null;
  return { leader, leadTricks, best, bestCards, userIsLeader: leader === "S", lost: leadTricks - best };
}

// ---------- Interactive hand replay (step through trick by trick) ----------
function HandReplay({ deal, played, declarer, findings, lang, onExit }) {
  const L = T[lang];
  const [cursor, setCursor] = useState(0);
  const total = played.length;
  const pos = replayTo(deal, played, cursor);
  const trump = deal.contract.strain;
  const userDeclares = sideOfSeat(declarer) === "NS";
  const dummy = partnerOf(declarer);
  const fnds = findings || [];
  const findingAt = cursor > 0 ? fnds.find(f => f.ply === cursor - 1) : null;
  const nextMistake = fnds.filter(f => f.ply >= cursor).sort((a, b) => a.ply - b.ply)[0];
  const canon = (a, b) => (SUITS.indexOf(a.s) * 13 + RANKS.indexOf(a.r)) - (SUITS.indexOf(b.s) * 13 + RANKS.indexOf(b.r));
  const trickNo = Math.min(13, Math.floor(cursor / 4) + (cursor % 4 === 0 && cursor > 0 ? 0 : 1));
  const role = (seat) => seat === declarer ? L.declarer3 : seat === dummy ? L.dummy : L.defender3;
  const isUser = (seat) => userDeclares ? (seat === "S" || seat === "N") : seat === "S";
  const playedSet = (seat) => new Set(pos.playedBy[seat].map(c => c.s + c.r));
  const lastKey = pos.lastCard ? pos.lastCard.card.s + pos.lastCard.card.r : null;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <SectionTitle icon={Eye}>{L.replayHand}</SectionTitle>
        <button onClick={onExit} style={{ color: C.brass }} className="text-sm flex items-center gap-1"><ChevronLeft size={16} />{L.back}</button>
      </div>
      <div style={{ background: C.feltDark, border: `1px solid ${C.brassDim}`, borderRadius: 12 }} className="p-3 flex items-center justify-between flex-wrap gap-2">
        <span style={{ color: C.ivory }} className="text-sm font-semibold">{deal.contract.level}{bidLabel(trump === "ST" ? "NT" : trump, lang)} · {L[declarer] || declarer}</span>
        <span style={{ color: C.soft }} className="text-xs">{L.tricksWord}: NS <b style={{ color: C.ivory }}>{pos.nsT}</b> · EO <b style={{ color: C.ivory }}>{pos.ewT}</b></span>
        <span style={{ color: C.brass }} className="text-xs">{cursor === 0 ? L.replayStart : (cursor >= total ? L.replayEnd : `${L.reviewTrick} ${trickNo}`)}</span>
      </div>
      <div className="flex flex-col gap-1.5">
        {SEAT_ORDER.map(seat => {
          const ps = playedSet(seat);
          const orig = deal.hands[seat].slice().sort(canon);
          return (
            <div key={seat} style={{ background: pos.turn === seat && cursor < total ? C.feltLite : C.feltDark, border: `1px solid ${isUser(seat) ? C.brass : C.line}`, borderRadius: 8 }} className="px-2 py-1">
              <div className="flex items-center gap-2">
                <span style={{ color: isUser(seat) ? C.brass : C.soft, width: 86 }} className="text-[11px] font-semibold">{L[seat]} · {role(seat)}{isUser(seat) ? " ★" : ""}{pos.turn === seat && cursor < total ? " ◄" : ""}</span>
                <div className="flex gap-2 flex-wrap flex-1">
                  {SUITS.map(s => {
                    const cs = orig.filter(c => c.s === s); if (!cs.length) return null;
                    return (
                      <span key={s} className="inline-flex items-center gap-0.5">
                        <Suit s={s} size={11} />
                        {cs.map((c, i) => { const pl = ps.has(c.s + c.r); const last = (c.s + c.r) === lastKey; return <span key={i} style={{ color: pl ? (last ? C.brass : C.line) : (SUIT_RED.has(c.s) ? C.red : C.ivory), textDecoration: pl ? "line-through" : "none", fontWeight: last ? 700 : 400 }} className="text-xs">{c.r}</span>; })}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ background: C.feltLite, borderRadius: 10 }} className="p-2 min-h-[44px] flex items-center gap-3 flex-wrap">
        <span style={{ color: C.soft }} className="text-xs">{L.reviewTrick}:</span>
        {pos.trick.length === 0 ? <span style={{ color: C.soft }} className="text-xs">—</span> :
          pos.trick.map((t, i) => <span key={i} className="text-sm font-semibold" style={{ color: SUIT_RED.has(t.card.s) ? "#ff8a80" : C.ivory, opacity: (t.card.s + t.card.r) === lastKey ? 1 : .7 }}>{L[t.seat] || t.seat}&nbsp;{t.card.r}{t.card.s}</span>)}
      </div>
      {findingAt && (
        <div style={{ background: "rgba(74,31,36,0.4)", border: `1px solid ${C.red}`, borderRadius: 10 }} className="p-2 text-sm">
          <span style={{ color: C.ivory }}>{L.reviewTrickN.replace("{n}", findingAt.trickNo)}: {L.youPlayed} <b style={{ color: SUIT_RED.has(findingAt.card.s) ? "#ff8a80" : C.ivory }}>{findingAt.card.r}{findingAt.card.s}</b> — {L.reviewBest}: {(findingAt.bestCards || [findingAt.better]).filter(Boolean).map((c, i) => <b key={i} style={{ color: SUIT_RED.has(c.s) ? "#ff8a80" : C.win }}>{c.r}{c.s} </b>)} <span style={{ color: C.red }}>(−{findingAt.lost})</span></span>
        </div>
      )}
      <div className="flex items-center justify-center gap-2">
        <button onClick={() => setCursor(0)} disabled={cursor === 0} style={{ background: C.feltDark, color: cursor === 0 ? C.line : C.ivory, border: `1px solid ${C.line}` }} className="px-3 py-2 rounded text-sm font-bold">⏮</button>
        <button onClick={() => setCursor(c => Math.max(0, c - 1))} disabled={cursor === 0} style={{ background: C.feltDark, color: cursor === 0 ? C.line : C.ivory, border: `1px solid ${C.line}` }} className="px-3 py-2 rounded text-sm font-bold">◄</button>
        <button onClick={() => setCursor(c => Math.min(total, c + 1))} disabled={cursor >= total} style={{ background: C.brass, color: C.ink, opacity: cursor >= total ? .5 : 1 }} className="px-4 py-2 rounded text-sm font-bold">►</button>
        <button onClick={() => setCursor(total)} disabled={cursor >= total} style={{ background: C.feltDark, color: cursor >= total ? C.line : C.ivory, border: `1px solid ${C.line}` }} className="px-3 py-2 rounded text-sm font-bold">⏭</button>
      </div>
      {nextMistake && (
        <button onClick={() => setCursor(nextMistake.ply + 1)} style={{ background: C.red, color: C.ivory }} className="px-3 py-2 rounded text-sm font-semibold flex items-center justify-center gap-2">{L.replayNextError}</button>
      )}
      {fnds.length === 0 && <p style={{ color: C.soft }} className="text-xs text-center">{L.replayNoFindings}</p>}
    </div>
  );
}

// ----- Post-hand double-dummy analysis (exact for the tractable endgame) -----
function bestAlt(handsB, trickB, seat, declWonB, trump, declarer, declSide, maximize) {
  const led = trickB.length ? trickB[0].card.s : null;
  const legal = legalCards(handsB[seat], led);
  const scored = [];
  for (const lc of legal) {
    const h = { N: handsB.N.slice(), E: handsB.E.slice(), S: handsB.S.slice(), W: handsB.W.slice() };
    h[seat] = h[seat].filter(c => !(c.s === lc.s && c.r === lc.r));
    const nt = trickB.concat([{ seat, card: lc }]);
    let turnX, trickX, dW = declWonB;
    if (nt.length === 4) { const w = trickWinner(nt, trump); dW += sideOfSeat(w) === declSide ? 1 : 0; turnX = w; trickX = []; }
    else { turnX = SEAT_ORDER[(SEAT_ORDER.indexOf(seat) + 1) % 4]; trickX = nt; }
    const v = ddsValue(h, trump, trickX, turnX, declarer);
    if (v == null) continue;
    scored.push({ card: lc, total: dW + v });
  }
  if (!scored.length) return { best: null, bestCards: [] };
  const bestV = maximize ? Math.max(...scored.map(s => s.total)) : Math.min(...scored.map(s => s.total));
  const bestCards = scored.filter(s => s.total === bestV).map(s => s.card);
  return { best: bestCards[0] || null, bestCards };
}

function analyzeEndgame(deal, playedCards, declarer, threshold) {
  threshold = threshold || 24;
  const trump = deal.contract.strain; // "♠".. or "ST"
  const declSide = sideOfSeat(declarer);
  const userDeclares = declSide === "NS";
  const userSeats = userDeclares ? [declarer, partnerOf(declarer)] : ["S"];
  // annotate each played card with the seat that played it
  const played = [];
  { let leader = nextSeat(declarer), tk = [];
    for (const card of playedCards) {
      const seat = SEAT_ORDER[(SEAT_ORDER.indexOf(leader) + tk.length) % 4];
      played.push({ seat, card }); tk.push({ seat, card });
      if (tk.length === 4) { leader = trickWinner(tk, trump); tk = []; }
    } }
  const hands = { N: deal.hands.N.slice(), E: deal.hands.E.slice(), S: deal.hands.S.slice(), W: deal.hands.W.slice() };
  let trick = [], declWon = 0, analyzedFrom = null;
  const findings = [];
  const remaining = () => hands.N.length + hands.E.length + hands.S.length + hands.W.length;
  const valueAt = (trickX, turnX, alreadyDecl) => { const v = ddsValue(hands, trump, trickX, turnX, declarer); return v == null ? null : alreadyDecl + v; };
  for (let i = 0; i < played.length; i++) {
    const { seat, card } = played[i];
    const rem = remaining();
    const tractable = rem <= threshold;
    const handsBefore = tractable ? { N: hands.N.slice(), E: hands.E.slice(), S: hands.S.slice(), W: hands.W.slice() } : null;
    const trickBefore = trick.slice(), declWonBefore = declWon;
    const vBefore = tractable ? valueAt(trick, seat, declWon) : null;
    // apply the actual card
    hands[seat] = hands[seat].filter(c => !(c.s === card.s && c.r === card.r));
    const nt = trick.concat([{ seat, card }]);
    let nextTurn, nextTrick;
    if (nt.length === 4) { const w = trickWinner(nt, trump); declWon += sideOfSeat(w) === declSide ? 1 : 0; nextTurn = w; nextTrick = []; }
    else { nextTurn = SEAT_ORDER[(SEAT_ORDER.indexOf(seat) + 1) % 4]; nextTrick = nt; }
    const vAfter = tractable ? valueAt(nextTrick, nextTurn, declWon) : null;
    if (vBefore != null && vAfter != null) {
      if (analyzedFrom == null) analyzedFrom = i;
      const moverDecl = sideOfSeat(seat) === declSide;
      const lost = moverDecl ? (vBefore - vAfter) : (vAfter - vBefore);
      if (userSeats.includes(seat) && lost > 0) {
        const { best, bestCards } = bestAlt(handsBefore, trickBefore, seat, declWonBefore, trump, declarer, declSide, userDeclares);
        findings.push({ trickNo: Math.floor(i / 4) + 1, ply: i, seat, card, lost, better: best, bestCards });
      }
    }
    trick = nextTrick;
  }
  return { made: declWon, findings, analyzedFromTrick: analyzedFrom == null ? null : Math.floor(analyzedFrom / 4) + 1, userDeclares };
}

function PlayPractice({ deal, lang, onComplete, onExit, title, onCaptureLead, onCapturePlay, onLog }) {
  const hasAuction = !!(deal.auction && deal.auction.length);
  const ORD = ["N", "E", "S", "W"];
  const dealerSeat = deal.dealer || ORD[(Math.abs(deal.seed || 0)) % 4];
  const [activeDeal, setActiveDeal] = useState(deal);
  const [g, setG] = useState(() => initGame(deal));
  const [showHint, setShowHint] = useState(false);
  const [showIns, setShowIns] = useState(false);
  const [phase, setPhase] = useState("intro");
  const [reveal, setReveal] = useState(0);
  const [showAuction, setShowAuction] = useState(false);
  const [showPlan, setShowPlan] = useState(false);
  const [optimal, setOptimal] = useState(null);   // {tricks, exact} | {error:true}
  const [optBusy, setOptBusy] = useState(false);
  const [analysis, setAnalysis] = useState(null); // post-hand analysis result
  const [anaBusy, setAnaBusy] = useState(false);
  const [showReplay, setShowReplay] = useState(false);
  const [icalls, setICalls] = useState([]);
  const [expert, setExpert] = useState(true);
  const [skill, setSkill] = useState("medium");
  const [bidHint, setBidHint] = useState(false);
  const [thinking, setThinking] = useState(false);
  const workerRef = useRef(null);
  const firedRef = useRef(false);

  // Background double-dummy worker (web only; falls back to inline engine if unavailable)
  useEffect(() => {
    if (typeof window === "undefined" || typeof Worker === "undefined") return;
    let url;
    try {
      const blob = new Blob([DDS_WORKER_SRC], { type: "application/javascript" });
      url = URL.createObjectURL(blob);
      workerRef.current = new Worker(url);
    } catch (e) { workerRef.current = null; }
    return () => { try { workerRef.current && workerRef.current.terminate(); } catch (e) {} if (url) { try { URL.revokeObjectURL(url); } catch (e) {} } workerRef.current = null; };
  }, []);
  const L = T[lang];
  const AD = activeDeal;
  const declarer = AD.contract.declarer || "S";
  const dummy = partnerOf(declarer);
  const userDeclares = declarer === "S" || declarer === "N";
  const userSeats = userDeclares ? [declarer, dummy] : ["S"];
  const declNeed = 6 + AD.contract.level;
  const needed = userDeclares ? declNeed : (14 - declNeed); // user-side trick target
  const userTricks = g.tricksNS;                            // user always sits on the N/S side
  const vul = vulForSeed(AD.seed || 0);
  const declVul = (declarer === "N" || declarer === "S") ? vul.NS : vul.EW;
  const declTricks = (declarer === "N" || declarer === "S") ? g.tricksNS : g.tricksEW;
  const declScore = duplicateScore({ level: AD.contract.level, strain: AD.contract.strain, tricks: declTricks, vul: declVul, dbl: AD.contract.doubled || "" });
  const userScore = (declarer === "N" || declarer === "S") ? declScore : -declScore; // user is always N/S
  const vulText = vul.NS && vul.EW ? L.vulBoth : vul.NS ? L.vulYou : vul.EW ? L.vulOpp : L.vulNone;
  const leadStarted = g.played.length > 0 || g.trick.length > 0;
  const faceUp = (seat) => userSeats.includes(seat) || (seat === dummy && leadStarted);
  const trumpLabel = g.trump === "ST" ? L.noTrump : g.trump;

  // clear stale optimal result as the position changes
  useEffect(() => { setOptimal(null); setOptBusy(false); }, [g.played.length, g.trick.length]);
  const computeOptimal = () => {
    setOptBusy(true); setOptimal(null);
    const data = { hands: g.hands, trump: g.trump, trick: g.trick, turn: g.turn, declarer, budgetMs: 6000, want: "value" };
    let done = false;
    const fallbackInline = () => {
      try { const v = ddsValue(g.hands, g.trump, g.trick, g.turn, declarer); if (v != null) setOptimal({ tricks: declTricks + v, exact: true }); else setOptimal({ error: true }); }
      catch (e) { setOptimal({ error: true }); }
      setOptBusy(false);
    };
    const finish = (res, w, url) => {
      if (done) return; done = true;
      try { w && w.terminate(); } catch (e) {} try { url && URL.revokeObjectURL(url); } catch (e) {}
      if (res && typeof res.value === "number") { setOptimal({ tricks: declTricks + res.value, exact: !!res.exact }); setOptBusy(false); }
      else fallbackInline();
    };
    try {
      const blob = new Blob([DDS_WORKER_SRC], { type: "application/javascript" });
      const url = URL.createObjectURL(blob);
      const w = new Worker(url);
      w.onmessage = (e) => finish(e.data, w, url);
      w.onerror = () => finish(null, w, url);
      w.postMessage(data);
      setTimeout(() => { if (!done) finish(null, w, url); }, 9000);
    } catch (e) { fallbackInline(); }
  };

  const runAnalysis = () => {
    setAnaBusy(true); setAnalysis(null);
    const data = { hands: g.hands, trump: g.trump, played: g.played, declarer, threshold: 40, cap: 1200000, want: "analyze" };
    let done = false;
    const captureFindings = (res) => {
      if (!AD.d || !onCapturePlay || !res || !res.findings) return;
      for (const fd of res.findings) {
        if (fd.ply == null || !fd.bestCards || !fd.bestCards.length) continue;
        onCapturePlay({ d: AD.d, contract: AD.contract, declarer, seq: g.played.slice(0, fd.ply), ply: fd.ply, seat: fd.seat, userCard: fd.card, bestCards: fd.bestCards, lost: fd.lost, trickNo: fd.trickNo });
      }
    };
    const inline = () => { try { const res = analyzeEndgame(AD, g.played, declarer); setAnalysis(res); captureFindings(res); } catch (e) { setAnalysis({ error: true }); } setAnaBusy(false); };
    const finish = (res, w, url) => { if (done) return; done = true; try { w && w.terminate(); } catch (e) {} try { url && URL.revokeObjectURL(url); } catch (e) {}
      if (res && typeof res.made === "number") { setAnalysis(res); captureFindings(res); setAnaBusy(false); } else inline(); };
    try {
      const blob = new Blob([DDS_WORKER_SRC], { type: "application/javascript" });
      const url = URL.createObjectURL(blob);
      const w = new Worker(url);
      w.onmessage = (e) => finish(e.data, w, url);
      w.onerror = () => finish(null, w, url);
      w.postMessage(data);
      setTimeout(() => { if (!done) finish(null, w, url); }, 30000);
    } catch (e) { inline(); }
  };

  // driver: resolve completed tricks and auto-play defenders (only during card play)
  useEffect(() => {
    if (phase !== "play") return;
    if (g.finished) return;
    if (g.resolving) {
      const t = setTimeout(() => setG(cur => (cur.resolving ? resolveTrick(cur) : cur)), 900);
      return () => clearTimeout(t);
    }
    const t = g.turn;
    if (!userSeats.includes(t)) {
      const w = workerRef.current;
      if (skill === "hard" && w) {
        let cancelled = false;
        setThinking(true);
        const cardsLeft = g.hands[t].length;
        const budget = Math.min(5000, Math.max(400, (cardsLeft - 5) * 700));
        const apply = (card) => setG(cur => {
          if (cur.finished || cur.resolving || userSeats.includes(cur.turn) || cur.turn !== t) return cur;
          const chosen = card || aiCard(cur.turn, cur, "hard", declarer);
          return chosen ? applyCard(cur, cur.turn, chosen) : cur;
        });
        const handle = (e) => { if (cancelled) return; cancelled = true; w.removeEventListener("message", handle); setThinking(false); apply(e.data); };
        w.addEventListener("message", handle);
        const startId = setTimeout(() => { try { w.postMessage({ hands: g.hands, trump: g.trump, trick: g.trick, turn: t, declarer, budgetMs: budget }); } catch (err) { if (!cancelled) { cancelled = true; w.removeEventListener("message", handle); setThinking(false); apply(null); } } }, 50);
        const safety = setTimeout(() => { if (cancelled) return; cancelled = true; w.removeEventListener("message", handle); setThinking(false); apply(null); }, budget + 4000);
        return () => { cancelled = true; w.removeEventListener("message", handle); clearTimeout(startId); clearTimeout(safety); setThinking(false); };
      }
      const timer = setTimeout(() => {
        setG(cur => {
          if (cur.finished || cur.resolving || userSeats.includes(cur.turn)) return cur;
          const card = aiCard(cur.turn, cur, skill, declarer);
          if (!card) return cur;
          return applyCard(cur, cur.turn, card);
        });
      }, 720);
      return () => clearTimeout(timer);
    }
  }, [g, phase, skill, declarer]);

  useEffect(() => {
    if (phase === "play" && g.finished && !firedRef.current) {
      firedRef.current = true;
      if (onComplete) onComplete(g.tricksNS >= needed);
      const declSide = sideOfSeat(declarer);
      const declTricks = declSide === "NS" ? g.tricksNS : g.tricksEW;
      const made = declTricks >= needed;
      const userDeclares = declSide === "NS";
      if (onLog) onLog({ kind: "hand", role: userDeclares ? "declare" : "defend", made, success: userDeclares ? made : !made, themed: !!AD.lt });
      if (AD.lt && g.played && g.played.length > 0) {
        const le = leadEval(AD, g.played[0]);
        if (le && le.userIsLeader) {
          if (onLog) onLog({ kind: "lead", optimal: le.lost <= 0 });
          if (le.lost > 0 && onCaptureLead) onCaptureLead(AD.d, AD.contract, AD.lt, g.played[0], le.leadTricks, le.best);
        }
      }
    }
  }, [g.finished, phase]);

  // interactive auction: robots bid until it is South's turn or the auction ends
  const ibidSeat = ORD[(ORD.indexOf(dealerSeat) + icalls.length) % 4];
  const ibidEnded = auctionDone(icalls);
  useEffect(() => {
    if (phase !== "ibid" || ibidEnded) return;
    if (ibidSeat === "S") return;
    const t = setTimeout(() => {
      setICalls(cur => {
        if (auctionDone(cur)) return cur;
        const s2 = ORD[(ORD.indexOf(dealerSeat) + cur.length) % 4];
        if (s2 === "S") return cur;
        return [...cur, { seat: s2, call: botCall(deal.hands, s2, cur, { expert }) }];
      });
    }, 600);
    return () => clearTimeout(t);
  }, [phase, icalls, ibidEnded, ibidSeat, expert]);

  function userBid(bid) {
    const call = canonCall(bid);
    if (call !== "Pass" && call !== "X" && call !== "XX" && !legalUpT(call, icalls)) return;
    if (call === "X" && !canDoubleT(icalls, "S")) return;
    if (call === "XX" && !canRedoubleT(icalls, "S")) return;
    setBidHint(false);
    setICalls(cur => [...cur, { seat: "S", call }]);
  }
  function startInteractive() { setICalls([]); setPhase("ibid"); }
  function beginPlay(playDeal) {
    setActiveDeal(playDeal); setG(initGame(playDeal)); firedRef.current = false; setShowAuction(false); setPhase("play");
  }
  function finishInteractive() {
    const ct = auctionContract(icalls);
    if (!ct) { beginPlay(deal); return; }
    const declSideNS = ct.declarer === "N" || ct.declarer === "S";
    const target = declSideNS ? "S" : "E"; // we declare from South, or defend (declarer to East, user leads)
    const shift = (ORD.indexOf(target) - ORD.indexOf(ct.declarer) + 4) % 4;
    const rot = (s) => ORD[(ORD.indexOf(s) + shift) % 4];
    const rotHands = {}; for (const s of ORD) rotHands[rot(s)] = deal.hands[s].slice();
    const rotAuction = icalls.map(c => ({ seat: rot(c.seat), call: c.call }));
    beginPlay({ ...deal, hands: rotHands, contract: { level: ct.level, strain: ct.strain, declarer: target, doubled: ct.doubled || "" }, auction: rotAuction, dealer: rot(dealerSeat) });
  }

  const led = g.trick.length ? g.trick[0].card.s : null;
  const isUser = userSeats.includes(g.turn);
  const userLegal = (seat) => legalCards(g.hands[seat], led);

  function userPlay(seat, card) {
    if (g.finished || g.resolving) return;
    if (g.turn !== seat) return;
    if (!userSeats.includes(seat)) return;
    if (!userLegal(seat).some(c => cardEq(c, card))) return;
    setShowHint(false);
    setG(cur => applyCard(cur, seat, card));
  }

  function renderHand(seat, interactive = true) {
    const cards = sortHand(g.hands[seat]);
    const legal = userLegal(seat);
    const myTurn = interactive && userSeats.includes(seat) && g.turn === seat && !g.resolving && !g.finished;
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
  const seatRole = (seat) => seat === declarer ? L.declarerTag : seat === dummy ? L.dummy : (userSeats.includes(seat) ? L.you : L.partnerTag);

  const find = (seat) => g.trick.find(p => p.seat === seat);
  const hintText = declarerHint({ trick: g.trick, trump: g.trump, hands: g.hands, turn: g.turn, played: g.played }, lang);
  const nsHcpLeft = hcp(g.hands.S) + hcp(g.hands.N);

  // ===== REPLAY: interactive trick-by-trick walkthrough of the finished hand =====
  if (g.finished && showReplay) {
    return <HandReplay deal={AD} played={g.played} declarer={declarer} findings={(analysis && analysis.findings) || []} lang={lang} onExit={() => setShowReplay(false)} />;
  }

  // ===== INTRO: choose how to begin =====
  if (phase === "intro") {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <button onClick={onExit} style={{ color: C.soft }} className="flex items-center gap-1 text-sm"><ArrowLeft size={16} />{L.back}</button>
          <span style={{ color: C.brass }} className="text-sm font-serif">{title || L.practicePlay}</span>
        </div>
        <div style={{ background: `linear-gradient(135deg, ${C.feltLite}, ${C.feltDark})`, border: `1px solid ${C.brassDim}`, borderRadius: 12 }} className="p-4">
          <SectionTitle icon={Sparkles}>{L.introTitle}</SectionTitle>
          <p style={{ color: C.soft }} className="text-xs mt-1">{L.contractReached}: <b style={{ color: C.brass }}>{deal.contract.level}{bidLabel(deal.contract.strain === "ST" ? "NT" : deal.contract.strain, lang)}</b>{deal.dealer ? ` · ${L.dealerLbl}: ${L[deal.dealer]}` : ""}</p>
        </div>
        <div style={{ background: C.feltDark, border: `1px solid ${C.line}`, borderRadius: 10 }} className="p-3">
          <div style={{ color: C.brass }} className="text-xs font-bold uppercase tracking-wide mb-2">{L.difficulty}</div>
          <div className="flex gap-2">
            {[["easy", L.diffEasy], ["medium", L.diffMed], ["hard", L.diffHard]].map(([k, lbl]) => (
              <button key={k} onClick={() => setSkill(k)} style={{ background: skill === k ? C.brass : C.feltLite, color: skill === k ? C.ink : C.ivory, border: `1px solid ${skill === k ? C.brass : C.line}` }} className="flex-1 px-2 py-2 rounded text-xs font-bold">{lbl}</button>
            ))}
          </div>
          <p style={{ color: C.soft }} className="text-xs mt-2">{skill === "easy" ? L.diffEasyD : skill === "medium" ? L.diffMedD : L.diffHardD}</p>
        </div>
        <div className="flex flex-col gap-2">
          {hasAuction && <button onClick={() => { setReveal(0); setPhase("replay"); }} style={{ background: C.feltDark, border: `1px solid ${C.line}`, color: C.ivory, borderRadius: 10 }} className="p-3 text-left flex items-center gap-2 text-sm font-semibold"><FileText size={16} style={{ color: C.brass }} />{L.replayReal}</button>}
          <button onClick={startInteractive} style={{ background: C.brass, color: C.ink, borderRadius: 10 }} className="p-3 text-left flex items-center gap-2 text-sm font-bold"><Sparkles size={16} />{hasAuction ? L.bidAndCompare : L.bidYourself}</button>
          <button onClick={() => beginPlay(deal)} style={{ background: C.feltDark, border: `1px solid ${C.line}`, color: C.soft, borderRadius: 10 }} className="p-3 text-left flex items-center gap-2 text-sm font-semibold"><Play size={16} style={{ color: C.brass }} />{L.goPlay}</button>
        </div>
      </div>
    );
  }

  // ===== REPLAY: step through the recorded real auction =====
  if (phase === "replay") {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <button onClick={() => setPhase("intro")} style={{ color: C.soft }} className="flex items-center gap-1 text-sm"><ArrowLeft size={16} />{L.back}</button>
          <span style={{ color: C.brass }} className="text-sm font-serif">{title || L.practicePlay}</span>
        </div>
        <div style={{ background: `linear-gradient(135deg, ${C.feltLite}, ${C.feltDark})`, border: `1px solid ${C.brassDim}`, borderRadius: 12 }} className="p-4">
          <div className="flex items-center justify-between mb-1">
            <SectionTitle icon={FileText}>{L.realAuctionLbl}</SectionTitle>
            {deal.dealer && <Pill bg={C.line2}>{L.dealerLbl}: {L[deal.dealer]}</Pill>}
          </div>
          <p style={{ color: C.soft }} className="text-xs mb-3">{L.contractReached}: <b style={{ color: C.brass }}>{deal.contract.level}{bidLabel(deal.contract.strain === "ST" ? "NT" : deal.contract.strain, lang)}</b> · {L.S} {L.declares}</p>
          <AuctionView auction={deal.auction} lang={lang} reveal={reveal} />
        </div>
        <div className="flex gap-2 flex-wrap justify-center">
          <button onClick={() => setReveal(r => Math.min(r + 1, deal.auction.length))} disabled={reveal >= deal.auction.length}
            style={{ background: C.feltLite, color: C.ivory, opacity: reveal >= deal.auction.length ? .5 : 1 }} className="px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1"><ChevronRight size={14} />{L.nextCall}</button>
          <button onClick={() => setReveal(deal.auction.length)} style={{ background: C.feltLite, color: C.ivory }} className="px-3 py-1.5 rounded text-xs font-semibold">{L.showAll}</button>
          <button onClick={() => beginPlay(deal)} style={{ background: C.brass, color: C.ink }} className="px-4 py-1.5 rounded text-sm font-bold flex items-center gap-1"><Play size={15} />{L.startPlay}</button>
        </div>
      </div>
    );
  }

  // ===== INTERACTIVE AUCTION: user bids South, robots bid the rest =====
  if (phase === "ibid") {
    const lastB = lastBidOf(icalls);
    const minR = lastB ? bidRankT(lastB.call) : -1;
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <button onClick={() => setPhase("intro")} style={{ color: C.soft }} className="flex items-center gap-1 text-sm"><ArrowLeft size={16} />{L.back}</button>
          <span style={{ color: C.brass }} className="text-sm font-serif">{L.auctionTitle}</span>
        </div>
        <div style={{ background: C.feltDark, border: `1px solid ${C.line}`, borderRadius: 12 }} className="p-3">
          <div className="flex items-center justify-between mb-2">
            <Pill bg={C.line2}>{L.dealerLbl}: {L[dealerSeat]}</Pill>
            <button onClick={() => setExpert(e => !e)} style={{ background: expert ? C.brass : C.line2, color: expert ? C.ink : C.soft }} className="px-2 py-1 rounded text-xs font-bold">{expert ? L.levelExpert : L.levelStd}</button>
            <Pill bg={C.brass} color={C.ink}>{L.S}: {hcp(deal.hands.S)} {L.points}</Pill>
          </div>
          <div style={{ background: C.feltDark, borderRadius: 8 }} className="mb-2"><HandSuitRows cards={deal.hands.S} /></div>
          <AuctionView auction={icalls} lang={lang} />
        </div>
        {!ibidEnded ? (
          ibidSeat === "S" ? (
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2">
                <span style={{ color: C.brass }} className="text-sm font-semibold">{L.yourCall}</span>
                <button onClick={() => setBidHint(h => !h)} style={{ background: bidHint ? C.brass : C.feltLite, color: bidHint ? C.ink : C.ivory }} className="px-2 py-1 rounded text-xs font-semibold flex items-center gap-1"><Lightbulb size={13} />{L.hint}</button>
              </div>
              {bidHint && (() => {
                const sug = botCall(deal.hands, "S", icalls, { expert });
                const why = describeCall(sug, icalls, "S", deal.hands.S);
                return <div style={{ background: C.feltDark, border: `1px dashed ${C.brass}`, borderRadius: 10 }} className="p-2 text-center max-w-md">
                  <span style={{ color: C.ivory }} className="text-sm">{L.suggestLbl}: <b style={{ color: C.brass }}>{fmtCall(sug, lang)}</b></span>
                  <p style={{ color: C.soft }} className="text-xs mt-1">{why[lang]}</p>
                </div>;
              })()}
              <BiddingBox onBid={userBid} minRank={minR} noDouble={!canDoubleT(icalls, "S") && !canRedoubleT(icalls, "S")} />
            </div>
          ) : (
            <div className="text-center py-3"><span style={{ color: C.soft }} className="text-sm">{L[ibidSeat]} · {L.thinking}</span></div>
          )
        ) : (
          <div className="flex flex-col gap-2">
            <div style={{ background: C.feltDark, border: `1px solid ${C.brassDim}`, borderRadius: 10 }} className="p-3 text-center">
              {(() => { const ct = auctionContract(icalls); return ct ? <span style={{ color: C.ivory }} className="text-sm">{L.contractReached}: <b style={{ color: C.brass }}>{ct.level}{bidLabel(ct.strain === "ST" ? "NT" : ct.strain, lang)}</b> · {L[ct.declarer]} {L.declares}</span> : <span style={{ color: C.soft }} className="text-sm">{L.passedOut}</span>; })()}
            </div>
            <div className="flex gap-2 justify-center flex-wrap">
              <button onClick={() => { setICalls([]); }} style={{ background: C.line2, color: C.soft }} className="px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1"><RotateCcw size={14} />{L.replay}</button>
              <button onClick={() => hasAuction ? setPhase("compare") : finishInteractive()} style={{ background: C.brass, color: C.ink }} className="px-4 py-1.5 rounded text-sm font-bold flex items-center gap-1">{hasAuction ? <><Eye size={15} />{L.compareTitle}</> : <><Play size={15} />{L.startPlay}</>}</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ===== COMPARE: user's auction vs the real recorded auction, with insights =====
  if (phase === "compare") {
    const realSouth = (deal.auction || []).filter(c => c.seat === "S");
    const mySouth = icalls.filter(c => c.seat === "S");
    const rows = [];
    const maxn = Math.max(realSouth.length, mySouth.length);
    for (let k = 0; k < maxn; k++) {
      const mine = mySouth[k], real = realSouth[k];
      const same = mine && real && mine.call === real.call;
      // context up to (not including) my k-th South call, for the meaning
      let ctxCalls = []; let cnt = 0;
      for (const c of icalls) { if (c.seat === "S") { if (cnt === k) break; cnt++; } ctxCalls.push(c); }
      const why = mine ? describeCall(mine.call, ctxCalls, "S", deal.hands.S) : null;
      rows.push({ mine, real, same, why });
    }
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <button onClick={() => setPhase("ibid")} style={{ color: C.soft }} className="flex items-center gap-1 text-sm"><ArrowLeft size={16} />{L.back}</button>
          <span style={{ color: C.brass }} className="text-sm font-serif">{L.compareTitle}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div style={{ background: C.feltDark, border: `1px solid ${C.line}`, borderRadius: 10 }} className="p-2">
            <div style={{ color: C.brass }} className="text-xs font-bold mb-1 text-center">{L.yourAuction}</div>
            <AuctionView auction={icalls} lang={lang} />
          </div>
          <div style={{ background: C.feltDark, border: `1px solid ${C.line}`, borderRadius: 10 }} className="p-2">
            <div style={{ color: C.brass }} className="text-xs font-bold mb-1 text-center">{L.realAuctionLbl}</div>
            <AuctionView auction={deal.auction} lang={lang} />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {rows.map((r, i) => (
            <div key={i} style={{ background: C.feltDark, border: `1px solid ${r.same ? C.line : C.brassDim}`, borderRadius: 10 }} className="p-3">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <Pill bg={C.brass} color={C.ink}>{L.S} #{i + 1}: {r.mine ? fmtCall(r.mine.call, lang) : "—"}</Pill>
                {r.real && <Pill bg={r.same ? C.win : C.red} color={C.ivory}>{r.same ? L.matchTag : `${L.atTable}: ${fmtCall(r.real.call, lang)}`}</Pill>}
              </div>
              {r.why && <p style={{ color: C.ivory }} className="text-sm"><span style={{ color: C.brass }}>{L.meaningLbl}:</span> {r.why[lang]}</p>}
              {!r.same && r.real && (() => {
                let ctxCalls = []; let cnt = 0; for (const c of (deal.auction || [])) { if (c.seat === "S") { if (cnt === i) break; cnt++; } ctxCalls.push(c); }
                const rw = describeCall(r.real.call, ctxCalls, "S", deal.hands.S);
                return <p style={{ color: C.soft }} className="text-xs mt-1">{L.atTable} ({fmtCall(r.real.call, lang)}): {rw[lang]}</p>;
              })()}
            </div>
          ))}
        </div>
        <button onClick={() => beginPlay(deal)} style={{ background: C.brass, color: C.ink }} className="px-4 py-2 rounded text-sm font-bold flex items-center gap-1 self-center"><Play size={15} />{L.startPlay}</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <button onClick={onExit} style={{ color: C.soft }} className="flex items-center gap-1 text-sm"><ArrowLeft size={16} />{L.back}</button>
        <span style={{ color: C.brass }} className="text-sm font-serif">{title || L.practicePlay}</span>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2" style={{ background: C.feltDark, border: `1px solid ${C.line}`, borderRadius: 10 }}>
        <div className="flex items-center gap-2 p-2">
          <Pill bg={C.brass} color={C.ink}>{L.contract}: {AD.contract.level}{bidLabel(g.trump, lang)}</Pill>
          <Pill bg={C.line2}>{userDeclares ? L.needed : L.toDefeat}: {needed}</Pill>
        </div>
        <div className="flex items-center gap-2 p-2">
          <Pill bg={C.win} color={C.ink}>{L.you} {userTricks}</Pill>
          <Pill bg={C.red} color={C.ivory}>{userDeclares ? "E/W" : L.declarerTag} {g.tricksEW}</Pill>
          <Pill bg={C.line2}>{L.trickN} {Math.min(g.trickCount + 1, 13)}/13</Pill>
          <Pill bg={(declVul) ? C.red : C.line2} color={declVul ? C.ivory : C.soft}>{L.vulLbl}: {vulText}</Pill>
          {thinking && <Pill bg={C.brass} color={C.ink}>{L.thinking}</Pill>}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: `radial-gradient(circle at 50% 40%, ${C.feltLite}, ${C.felt} 70%)`, border: `2px solid ${C.brassDim}`, borderRadius: 18 }} className="p-3">
        {/* North */}
        <div className="text-center mb-1"><span style={{ color: C.brass }} className="text-xs uppercase tracking-widest">{L.N} · {seatRole("N")}{g.turn === "N" && !g.finished ? " ◄" : ""}</span></div>
        {faceUp("N") ? renderHand("N", userSeats.includes("N")) : <div className="flex justify-center"><HiddenFan count={g.hands.N.length} /></div>}

        {/* Middle: W | trick | E */}
        <div className="grid grid-cols-3 items-center my-2" style={{ minHeight: 90 }}>
          <div className="flex flex-col items-center gap-1">
            <span style={{ color: g.turn === "W" ? C.brass : C.soft }} className="text-xs">{L.W}{g.turn === "W" && !g.finished ? " ◄" : ""}</span>
            {faceUp("W") ? <div className="max-w-[120px]">{renderHand("W", userSeats.includes("W"))}</div> : <HiddenFan count={g.hands.W.length} />}
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
            {faceUp("E") ? <div className="max-w-[120px]">{renderHand("E", userSeats.includes("E"))}</div> : <HiddenFan count={g.hands.E.length} />}
          </div>
        </div>

        {/* South / you */}
        {renderHand("S", userSeats.includes("S"))}
        <div className="text-center mt-1"><span style={{ color: C.brass }} className="text-xs uppercase tracking-widest">{L.S} · {seatRole("S")}{g.turn === "S" && !g.finished ? " ◄" : ""}</span></div>
      </div>

      {/* Status / controls */}
      {!g.finished ? (
        <div className="flex flex-col gap-2">
          <div className="text-center">
            <span style={{ color: isUser ? C.brass : C.soft }} className="text-sm font-semibold">{isUser ? (g.trick.length ? L.yourTurn : L.leadNow) : L.waiting}</span>
            {isUser && <p style={{ color: C.soft }} className="text-xs mt-0.5">{L.selectCard}</p>}
          </div>
          <div className="flex gap-2 flex-wrap justify-center">
            {userDeclares && <button onClick={() => setShowHint(s => !s)} style={{ background: C.feltLite, color: C.ivory }} className="px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1"><Lightbulb size={14} />{L.hint}</button>}
            {userDeclares && <button onClick={() => setShowPlan(s => !s)} style={{ background: showPlan ? C.brass : C.feltLite, color: showPlan ? C.ink : C.ivory }} className="px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1"><Target size={14} />{L.planBtn}</button>}
            <button onClick={() => setShowIns(s => !s)} style={{ background: C.feltLite, color: C.ivory }} className="px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1">{showIns ? <EyeOff size={14} /> : <Eye size={14} />}{showIns ? L.hideIns : L.showIns}</button>
            <button onClick={() => setShowAuction(s => !s)} style={{ background: C.feltLite, color: C.ivory }} className="px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1"><FileText size={14} />{L.auctionBtn}</button>
            <button onClick={() => setSkill(s => s === "easy" ? "medium" : s === "medium" ? "hard" : "easy")} style={{ background: skill === "hard" ? C.brass : C.feltLite, color: skill === "hard" ? C.ink : C.ivory }} className="px-3 py-1.5 rounded text-xs font-semibold">{skill === "easy" ? L.diffEasy : skill === "medium" ? L.diffMed : L.diffHard}</button>
            <button onClick={onExit} style={{ background: C.line2, color: C.soft }} className="px-3 py-1.5 rounded text-xs flex items-center gap-1"><X size={14} />{L.finish}</button>
          </div>
          {showAuction && <div className="mt-1">{AD.dealer && <p style={{ color: C.soft }} className="text-xs mb-1">{L.dealerLbl}: {L[AD.dealer]}</p>}<AuctionView auction={AD.auction} lang={lang} /></div>}
          {showPlan && userDeclares && (() => {
            const plan = planCounts(g.hands[declarer], g.hands[dummy], g.trump);
            const isNT = g.trump === "ST";
            const longest = ["♠", "♥", "♦", "♣"].filter(s => isNT || s !== g.trump).sort((a, b) => (plan.lenBySuit[b].d + plan.lenBySuit[b].m) - (plan.lenBySuit[a].d + plan.lenBySuit[a].m))[0];
            const gap = needed - plan.W;
            return (
              <div style={{ background: C.feltDark, border: `1px dashed ${C.brass}`, borderRadius: 10 }} className="p-3">
                <div style={{ color: C.brass }} className="text-xs font-bold uppercase tracking-wide mb-2">{L.planTitle} · {AD.contract.level}{bidLabel(g.trump, lang)}</div>
                <div className="flex gap-3 flex-wrap text-sm" style={{ color: C.ivory }}>
                  <span>{L.sureWinners}: <b style={{ color: C.win }}>{plan.W}</b> / {L.needed} {needed}</span>
                  {!isNT && <span>{L.estLosers}: <b style={{ color: C.red }}>{plan.Lo}</b></span>}
                </div>
                <div className="flex gap-1 mt-2 flex-wrap">
                  {["♠", "♥", "♦", "♣"].map(s => (
                    <span key={s} style={{ background: C.feltLite, color: SUIT_RED.has(s) ? "#ff8a80" : C.ivory, borderRadius: 5 }} className="text-xs px-2 py-1 font-mono">{s} {plan.winnersBySuit[s]}{!isNT ? `/${plan.losersBySuit[s]}` : ""}</span>
                  ))}
                </div>
                <p style={{ color: C.soft }} className="text-xs mt-2">
                  {isNT
                    ? (gap > 0 ? `${L.planNTgap.replace("{n}", gap).replace("{suit}", longest)}` : L.planNTok)
                    : `${L.planSuit.replace("{trump}", g.trump)}`}
                </p>
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <button onClick={computeOptimal} disabled={optBusy} style={{ background: optBusy ? C.feltLite : C.brassDim, color: C.ivory, opacity: optBusy ? .7 : 1 }} className="px-3 py-1 rounded text-xs font-semibold">{optBusy ? L.calculating : L.optimalBtn}</button>
                  {optimal && optimal.tricks != null && (
                    <span className="text-sm" style={{ color: C.ivory }}>
                      {L.optimalLbl}: <b style={{ color: optimal.tricks >= needed ? C.win : C.red }}>{optimal.tricks}</b> {L.tricksWord} <span style={{ color: C.soft }} className="text-xs">({optimal.exact ? L.exact : L.estimated}{optimal.tricks >= needed ? ` · ${L.makes}` : ` · ${L.downN.replace("{n}", needed - optimal.tricks)}`})</span>
                    </span>
                  )}
                  {optimal && optimal.error && <span className="text-xs" style={{ color: C.soft }}>{L.optimalErr}</span>}
                </div>
              </div>
            );
          })()}
          {showHint && isUser && <div style={{ background: C.feltDark, border: `1px dashed ${C.brass}`, borderRadius: 10 }} className="p-3"><p style={{ color: C.ivory }} className="text-sm">{hintText}</p></div>}
          {showIns && <div style={{ background: C.feltDark, border: `1px dashed ${C.brass}`, borderRadius: 10 }} className="p-3 text-sm" >
            <div style={{ color: C.brass }} className="text-xs font-bold mb-1">{L.insightIntro}</div>
            <p style={{ color: C.ivory }}>{L.trumpsOut}: <b>{g.trump === "ST" ? "—" : countOutstandingTrumps({ trump: g.trump, hands: g.hands, played: g.played })}</b> · {L.points} N/S: <b>{nsHcpLeft}</b></p>
          </div>}
        </div>
      ) : (
        <>
        <div style={{ background: userTricks >= needed ? C.win : C.red, color: C.ivory, borderRadius: 12 }} className="p-4 text-center">
          <Trophy size={28} className="mx-auto mb-1" />
          <div className="font-bold text-lg">{userDeclares ? (userTricks >= needed ? L.made : L.down) : (userTricks >= needed ? L.defeated : L.contractMade)}</div>
          <div className="text-sm mt-1">{L.tricksWon} {L.you}: {userTricks} · {userDeclares ? L.needed : L.toDefeat}: {needed}</div>
          <div className="mt-2 inline-flex items-center gap-2" style={{ background: "rgba(0,0,0,0.25)", borderRadius: 8, padding: "4px 10px" }}>
            <span className="text-xs uppercase tracking-wide" style={{ opacity: .8 }}>{L.yourScore}</span>
            <span className="text-lg font-bold">{userScore >= 0 ? "+" : ""}{userScore}</span>
            <span className="text-xs" style={{ opacity: .8 }}>({AD.contract.level}{bidLabel(AD.contract.strain === "ST" ? "NT" : AD.contract.strain, lang)}{AD.contract.doubled ? " " + AD.contract.doubled : ""} · {declVul ? L.vulYesShort : L.vulNoShort})</span>
          </div>
          <div className="flex gap-2 justify-center mt-3 flex-wrap">
            <button onClick={() => { firedRef.current = false; setG(initGame(AD)); }} style={{ background: C.ivory, color: C.ink }} className="px-3 py-1.5 rounded text-sm font-bold flex items-center gap-1"><RotateCcw size={14} />{L.replay}</button>
            <button onClick={() => setShowReplay(true)} style={{ background: C.brass, color: C.ink }} className="px-3 py-1.5 rounded text-sm font-bold flex items-center gap-1"><Eye size={14} />{L.replayHand}</button>
            <button onClick={onExit} style={{ background: C.feltDark, color: C.ivory }} className="px-3 py-1.5 rounded text-sm font-semibold">{L.back}</button>
          </div>
        </div>
        {AD.lt && g.played && g.played.length > 0 && (() => {
          const le = leadEval(AD, g.played[0]); if (!le) return null; const lead = g.played[0]; const optimal = le.lost <= 0;
          return (
            <div style={{ background: C.feltDark, border: `1px solid ${C.brassDim}`, borderRadius: 12 }} className="p-3 flex flex-col gap-1">
              <div style={{ color: C.brass }} className="text-xs font-bold uppercase tracking-wide">{L.leadTitle}</div>
              <p className="text-sm" style={{ color: C.ivory }}>{le.userIsLeader ? L.yourLead : L.defLead} <b style={{ color: SUIT_RED.has(lead.s) ? "#ff8a80" : C.ivory }}>{lead.r}{lead.s}</b>: {L.declMakes} <b>{le.leadTricks}</b>.</p>
              {optimal ? (
                <p className="text-sm" style={{ color: C.win }}>{L.leadOptimal}</p>
              ) : (
                <p className="text-sm" style={{ color: C.soft }}>{L.leadBest}: {le.bestCards.map((c, i) => <b key={i} style={{ color: SUIT_RED.has(c.s) ? "#ff8a80" : C.win }}>{c.r}{c.s}{i < le.bestCards.length - 1 ? " " : ""}</b>)} → {L.declMakes} <b>{le.best}</b> <span style={{ color: C.red }}>(−{le.lost})</span></p>
              )}
            </div>
          );
        })()}
        {userSeats.length > 0 && (
          <div style={{ background: C.feltDark, border: `1px dashed ${C.brass}`, borderRadius: 12 }} className="p-3">
            {!analysis ? (
              <button onClick={runAnalysis} disabled={anaBusy} style={{ background: anaBusy ? C.feltLite : C.brass, color: anaBusy ? C.ivory : C.ink, opacity: anaBusy ? .7 : 1 }} className="w-full px-3 py-2 rounded text-sm font-semibold flex items-center justify-center gap-2"><Eye size={15} />{anaBusy ? L.calculating : L.analyzeBtn}</button>
            ) : analysis.error ? (
              <p className="text-sm" style={{ color: C.soft }}>{L.optimalErr}</p>
            ) : (
              <div className="flex flex-col gap-2">
                <div style={{ color: C.brass }} className="text-xs font-bold uppercase tracking-wide">{L.analyzeTitle}</div>
                <p className="text-sm" style={{ color: C.ivory }}>{L.youMade.replace("{n}", analysis.made)} {analysis.analyzedFromTrick ? L.analyzedFrom.replace("{t}", analysis.analyzedFromTrick) : L.analyzedNone}</p>
                {analysis.findings && analysis.findings.length > 0 ? (
                  <div className="flex flex-col gap-1.5">
                    {analysis.findings.slice().sort((a, b) => b.lost - a.lost).slice(0, 4).map((fd, i) => (
                      <div key={i} style={{ background: "rgba(74,31,36,0.4)", border: `1px solid ${C.red}`, borderRadius: 8 }} className="px-3 py-2 text-sm" >
                        <span style={{ color: C.ivory }}>{L.trickN} {fd.trickNo}: {L.youPlayed} <b style={{ color: SUIT_RED.has(fd.card.s) ? "#ff8a80" : C.ivory }}>{fd.card.r}{fd.card.s}</b>{fd.better ? <>; {L.betterWas} <b style={{ color: SUIT_RED.has(fd.better.s) ? "#ff8a80" : C.win }}>{fd.better.r}{fd.better.s}</b></> : null} <span style={{ color: C.red }}>(−{fd.lost})</span></span>
                      </div>
                    ))}
                  </div>
                ) : analysis.analyzedFromTrick ? (
                  <p className="text-sm" style={{ color: C.win }}>{L.noErrors}</p>
                ) : null}
              </div>
            )}
          </div>
        )}
        </>
      )}
    </div>
  );
}

// ---------- Deal list (used in Library and Level play tab) ----------
function DealList({ deals, statusMap, lang, onOpen, pageSize = 24 }) {
  const [page, setPage] = useState(0);
  useEffect(() => { setPage(0); }, [deals]);
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
function levelMaxId(e) { return e === "beg" ? 2 : e === "inter" ? 4 : 7; }
function levelTotalItems(level, e) { return level.lessons.length + 3 + levelDealTarget(level, e); }

// ---------- Mastery / skills / recommendation layer ----------
const MASTERY_PASS = 70; // % to consider a level "mastered"
const UNLOCK_AT = 40;    // previous-level mastery % needed to unlock the next

function levelMastery(level, prog, e) {
  const p = prog[level.id] || {};
  const comps = [];
  const lessonsN = (level.lessons || []).length;
  if (lessonsN) comps.push({ k: "lessons", w: 0.22, frac: Math.min(1, Object.keys(p.lessons || {}).length / lessonsN) });
  const quizN = (level.quiz || []).length;
  if (quizN) comps.push({ k: "quiz", w: 0.18, frac: Math.min(1, (p.quizBest || 0) / quizN) });
  if ((level.flash || []).length) comps.push({ k: "flash", w: 0.06, frac: p.flash ? 1 : 0 });
  comps.push({ k: "bid", w: 0.12, frac: p.bid ? 1 : 0 });
  const target = levelDealTarget(level, e);
  if (target > 0) comps.push({ k: "deals", w: 0.20, frac: Math.min(1, Object.keys(p.deals || {}).length / target) });
  comps.push({ k: "test", w: 0.22, frac: Math.min(1, p.testScore || 0) });
  const wsum = comps.reduce((a, c) => a + c.w, 0) || 1;
  const pct = Math.round(100 * comps.reduce((a, c) => a + c.w * c.frac, 0) / wsum);
  return { pct, comps };
}

function levelMastered(level, prog, e) {
  const p = prog[level.id] || {};
  return levelMastery(level, prog, e).pct >= MASTERY_PASS && (p.testScore || 0) >= 0.8;
}

function levelHasProgress(level, prog) {
  const p = prog[level.id] || {};
  return Object.keys(p.lessons || {}).length > 0 || !!p.quiz || !!p.flash || !!p.bid || Object.keys(p.deals || {}).length > 0 || !!p.testScore;
}

function levelUnlocked(levelId, user, e) {
  if (levelId > levelMaxId(e)) return false;
  if (levelId === 1) return true;
  const prev = LEVELS.find(l => l.id === levelId - 1);
  const lv = LEVELS.find(l => l.id === levelId);
  if (lv && levelHasProgress(lv, user.progress)) return true; // never lock out work already begun
  return prev ? levelMastery(prev, user.progress, e).pct >= UNLOCK_AT : true;
}

function skillMastery(user, e) {
  const counted = LEVELS.filter(lv => lv.id <= levelMaxId(e));
  const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  const quizF = [], bidF = [], dealF = [], testF = [];
  counted.forEach(lv => {
    const p = user.progress[lv.id] || {};
    if ((lv.quiz || []).length) quizF.push(Math.min(1, (p.quizBest || 0) / lv.quiz.length));
    bidF.push(p.bid ? 1 : 0);
    const t = levelDealTarget(lv, e);
    if (t > 0) dealF.push(Math.min(1, Object.keys(p.deals || {}).length / t));
    testF.push(Math.min(1, p.testScore || 0));
  });
  const reviews = user.reviews || [];
  const leadM = reviews.filter(r => r.type === "lead").map(r => Math.min(1, (r.reps || 0) / 3));
  const playM = reviews.filter(r => r.type === "play").map(r => Math.min(1, (r.reps || 0) / 3));
  return {
    bidding: Math.round(100 * (0.6 * avg(quizF) + 0.4 * avg(bidF))),
    cardplay: Math.round(100 * (0.5 * avg(dealF) + 0.3 * avg(testF) + 0.2 * avg(playM))),
    defense: Math.round(100 * (leadM.length ? (0.7 * avg(leadM) + 0.3 * Math.min(1, leadM.length / 8)) : 0)),
  };
}

// Pick the single most useful next action for the learner
function recommendNext(user, e) {
  const reviews = user.reviews || [];
  const due = dueCount(reviews);
  if (due >= 3) return { kind: "review", label: { es: `Repasa ${due} errores pendientes`, en: `Review ${due} pending mistakes` } };
  const counted = LEVELS.filter(lv => lv.id <= levelMaxId(e) && levelUnlocked(lv.id, user, e));
  for (const lv of counted) {
    if (levelMastered(lv, user.progress, e)) continue;
    const p = user.progress[lv.id] || {};
    const lessonsN = (lv.lessons || []).length;
    if (lessonsN && Object.keys(p.lessons || {}).length < lessonsN)
      return { kind: "level", levelId: lv.id, label: { es: `Completa las lecciones del ${lv.name.es}`, en: `Finish the lessons of ${lv.name.en}` } };
    if ((lv.quiz || []).length && (p.quizBest || 0) < lv.quiz.length)
      return { kind: "level", levelId: lv.id, label: { es: `Mejora el quiz del ${lv.name.es}`, en: `Ace the quiz of ${lv.name.en}` } };
    if (!p.bid) return { kind: "level", levelId: lv.id, label: { es: `Práctica de subasta · ${lv.name.es}`, en: `Bidding drill · ${lv.name.en}` } };
    const target = levelDealTarget(lv, e), dn = Object.keys(p.deals || {}).length;
    if (target > 0 && dn < target)
      return { kind: "level", levelId: lv.id, label: { es: `Juega ${target - dn} manos del ${lv.name.es}`, en: `Play ${target - dn} deals in ${lv.name.en}` } };
    if (!p.testScore || p.testScore < 0.8)
      return { kind: "test", levelId: lv.id, label: { es: `Haz el test del ${lv.name.es}`, en: `Take the ${lv.name.en} test` } };
    return { kind: "level", levelId: lv.id, label: { es: `Repasa el ${lv.name.es}`, en: `Polish ${lv.name.en}` } };
  }
  if (due > 0) return { kind: "review", label: { es: `Repasa ${due} error${due > 1 ? "es" : ""}`, en: `Review ${due} mistake${due > 1 ? "s" : ""}` } };
  return { kind: "done", label: { es: "¡Has dominado todo lo disponible!", en: "You've mastered everything available!" } };
}

// ---------- Statistics from logged events ----------
function computeStats(user) {
  const ev = user.stats || [];
  const hands = ev.filter(e => e.kind === "hand");
  const declares = hands.filter(e => e.role === "declare");
  const defends = hands.filter(e => e.role === "defend");
  const leads = ev.filter(e => e.kind === "lead");
  const tests = ev.filter(e => e.kind === "test");
  const reviews = ev.filter(e => e.kind === "review");
  const pct = (n, d) => d ? Math.round(100 * n / d) : 0;
  const buckets = (arr, pred, B) => { B = B || 5; const out = []; for (let i = 0; i < arr.length; i += B) { const s = arr.slice(i, i + B); out.push(Math.round(100 * s.filter(pred).length / s.length)); } return out; };
  const dayKey = (ts) => { const d = new Date(ts); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); };
  const now = new Date(); const days = [];
  for (let i = 13; i >= 0; i--) { const d = new Date(now); d.setDate(now.getDate() - i); const k = d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); days.push({ k, c: hands.filter(e => dayKey(e.ts) === k).length, label: (d.getMonth() + 1) + "/" + d.getDate() }); }
  return {
    total: hands.length, declareN: declares.length, defendN: defends.length, leadN: leads.length, reviewN: reviews.length,
    declareMadePct: pct(declares.filter(e => e.made).length, declares.length),
    defendSuccessPct: pct(defends.filter(e => e.success).length, defends.length),
    leadAccPct: pct(leads.filter(e => e.optimal).length, leads.length),
    madeTrend: buckets(declares, e => e.made), leadTrend: buckets(leads, e => e.optimal),
    days, testTrend: tests.map(t => Math.round(t.score * 100)),
  };
}

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
function Dashboard({ lang, user, onOpenLevel, onQuickPlay, onGoReview, onTechniques }) {
  const L = T[lang];
  const e = user.exp;
  const maxId = levelMaxId(e);
  const counted = LEVELS.filter(lv => lv.id <= maxId);
  const masteryPct = Math.round(counted.reduce((a, lv) => a + levelMastery(lv, user.progress, e).pct, 0) / (counted.length || 1));
  const skills = skillMastery(user, e);
  const rec = recommendNext(user, e);
  const skillRows = [
    { k: "bidding", label: L.skillBidding, v: skills.bidding },
    { k: "cardplay", label: L.skillCardplay, v: skills.cardplay },
    { k: "defense", label: L.skillDefense, v: skills.defense },
  ];
  return (
    <div className="flex flex-col gap-4">
      <div style={{ background: `linear-gradient(135deg, ${C.feltLite}, ${C.feltDark})`, border: `1px solid ${C.brassDim}`, borderRadius: 16 }} className="p-5">
        <div className="flex items-center justify-between mb-2">
          <h2 style={{ color: C.ivory }} className="text-xl font-serif">{L.mastery}</h2>
          <Pill bg={C.brass} color={C.ink}>{L[e]}</Pill>
        </div>
        <div className="flex items-end gap-3 mb-2">
          <span style={{ color: C.brass }} className="text-4xl font-bold">{masteryPct}%</span>
          <span style={{ color: C.soft }} className="text-sm mb-1">{L.overallMastery}</span>
        </div>
        <div style={{ background: C.feltDark, borderRadius: 999, height: 10, overflow: "hidden" }}>
          <div style={{ width: `${masteryPct}%`, height: "100%", background: `linear-gradient(90deg, ${C.brassDim}, ${C.brass})` }} />
        </div>
      </div>

      <div style={{ background: C.feltDark, border: `1px solid ${C.line}`, borderRadius: 14 }} className="p-4">
        <SectionTitle icon={Target}>{L.skills}</SectionTitle>
        <div className="flex flex-col gap-2.5 mt-2">
          {skillRows.map(sr => (
            <div key={sr.k}>
              <div className="flex items-center justify-between mb-1"><span style={{ color: C.ivory }} className="text-sm">{sr.label}</span><span style={{ color: C.brass }} className="text-xs font-bold">{sr.v}%</span></div>
              <div style={{ background: C.feltLite, borderRadius: 999, height: 7, overflow: "hidden" }}>
                <div style={{ width: `${sr.v}%`, height: "100%", background: sr.v >= 70 ? C.win : C.brass }} />
              </div>
            </div>
          ))}
        </div>
        <p style={{ color: C.soft }} className="text-[11px] mt-2">{L.skillsHint}</p>
      </div>

      <button onClick={() => { if (rec.kind === "review") onGoReview && onGoReview(); else if (rec.kind === "test") onOpenLevel(rec.levelId, "test"); else if (rec.levelId) onOpenLevel(rec.levelId); }}
        disabled={rec.kind === "done"}
        style={{ background: `linear-gradient(135deg, ${C.brass}, ${C.brassDim})`, color: C.ink, borderRadius: 14, opacity: rec.kind === "done" ? .8 : 1 }} className="p-4 text-left flex items-center gap-3">
        <Sparkles size={22} />
        <div className="flex-1">
          <div className="text-[11px] font-bold uppercase tracking-wide opacity-70">{L.nextStep}</div>
          <div className="text-sm font-bold">{rec.label[lang]}</div>
        </div>
        {rec.kind !== "done" && <ChevronRight size={20} />}
      </button>

      <button onClick={onQuickPlay} style={{ background: C.feltDark, color: C.ivory, border: `1px solid ${C.brass}`, borderRadius: 12 }} className="p-3 flex items-center justify-center gap-2 font-bold"><Shuffle size={18} />{L.newDeal} · {L.playTrainer}</button>

      <button onClick={onTechniques} style={{ background: C.feltDark, color: C.ivory, border: `1px solid ${C.line}`, borderRadius: 12 }} className="p-3 flex items-center justify-between"><span className="flex items-center gap-2 font-bold"><GraduationCap size={18} style={{ color: C.brass }} />{L.techniques}</span><ChevronRight size={18} style={{ color: C.brass }} /></button>

      <div className="flex flex-col gap-3">
        {LEVELS.map(lv => {
          const expLocked = lv.id > maxId;
          const unlocked = levelUnlocked(lv.id, user, e);
          const m = levelMastery(lv, user.progress, e);
          const mastered = levelMastered(lv, user.progress, e);
          const p = m.pct;
          const blocked = expLocked || !unlocked;
          return (
            <button key={lv.id} onClick={() => { if (!blocked) onOpenLevel(lv.id); }} disabled={blocked}
              style={{ background: C.feltDark, border: `1px solid ${mastered ? C.win : blocked ? C.line2 : C.line}`, borderRadius: 14, opacity: blocked ? .6 : 1 }} className="p-4 text-left">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span style={{ background: mastered ? C.win : C.feltLite, color: mastered ? C.ivory : C.brass, width: 26, height: 26, borderRadius: 8 }} className="flex items-center justify-center text-sm font-bold">{blocked ? <Lock size={13} /> : lv.id}</span>
                  <span style={{ color: C.ivory }} className="font-serif">{lv.name[lang]}</span>
                </div>
                <span className="flex items-center gap-2">
                  {expLocked ? <Pill bg={C.line2}>+{L[e === "beg" ? "inter" : "adv"]}</Pill>
                    : !unlocked ? <Pill bg={C.line2}>{L.locked}</Pill>
                      : mastered ? <Pill bg={C.win} color={C.ivory}>{L.mastered}</Pill> : null}
                  <span style={{ color: mastered ? C.win : C.brass }} className="text-sm font-bold">{p}%</span>
                </span>
              </div>
              <p style={{ color: C.soft }} className="text-xs mb-2">{lv.sub[lang]}</p>
              <div style={{ background: C.feltLite, borderRadius: 999, height: 7, overflow: "hidden" }}>
                <div style={{ width: `${p}%`, height: "100%", background: mastered ? C.win : C.brass }} />
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <span style={{ color: C.soft }} className="text-xs">{!unlocked && !expLocked ? L.unlockHint.replace("{n}", UNLOCK_AT) : `${L.mastery}: ${p}%`}</span>
                {!blocked && <ChevronRight size={16} style={{ color: C.brass }} />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Level detail (tabbed) ----------
const THEME_DECKS = {"themes": [{"key": "tight", "title": {"es": "Manga exacta", "en": "Tight game"}, "role": "declare", "tip": {"es": "Se hace JUSTA con buen juego. Cuenta ganadores/perdedoras y planifica antes de la primera carta.", "en": "Makes EXACTLY with careful play. Count winners/losers and plan before card one."}, "deals": [{"d": "SNESNSWWENEEENWSNESNWENNNEWNSNSSWESWWSWWNWWEESESNWES", "contract": {"declarer": "S", "strain": "ST", "level": 3}, "dd": 9, "lt": "AABBAAAAA9999"}, {"d": "ESNEESESNWNNNNNSSESWENEWWNESWSNWWWSNESSSNWEEWEWWSWEN", "contract": {"declarer": "S", "strain": "♠", "level": 4}, "dd": 10, "lt": "AAAAAAAAAAAAA"}, {"d": "NESSSWEWSNSNESSEEESNWWSNWWWNNEENWENWESSENSNENWEWNWWS", "contract": {"declarer": "S", "strain": "♠", "level": 4}, "dd": 10, "lt": "AAAAAAAAAAAAA"}, {"d": "NNSWNWEWNWNNNSWNENSSESNEWEWESSSWSWWESEEWSSSNWNNEWEEE", "contract": {"declarer": "S", "strain": "♠", "level": 4}, "dd": 10, "lt": "BAAABBBBBBAAA"}, {"d": "SSNWEEEWWENNNSSEWNSSEWWWSEWWNSSWNENENEWENNNSSNSWWSEE", "contract": {"declarer": "S", "strain": "ST", "level": 3}, "dd": 9, "lt": "9999999999999"}, {"d": "EWWSWWEWNENSNSNNWNSSNSWESEWNSESWNSSEESWSNNWWENWEEEEN", "contract": {"declarer": "S", "strain": "♥", "level": 4}, "dd": 10, "lt": "AAAAACCACCCCC"}, {"d": "NSSENEWSSSWWWSSWNEEWSSSNWENESSNEEWNWEEEWNNENWNWNESNW", "contract": {"declarer": "S", "strain": "♠", "level": 4}, "dd": 10, "lt": "CBBBBBBAABCCC"}, {"d": "NESEESWNWESSWSNWNNSNENEENEWSNEEEWESESSWWNSWWNSWNSWNW", "contract": {"declarer": "S", "strain": "ST", "level": 3}, "dd": 9, "lt": "99999A9AAAAAA"}, {"d": "WNSEENSNWNNSWNSSEWNEENEWESWSSNWEWSESSNNSSENWWWWNEEEW", "contract": {"declarer": "S", "strain": "ST", "level": 3}, "dd": 9, "lt": "BBBBBBBB99999"}, {"d": "WENNNEEWSSSWEENNEWWNWWEESESSNWNSSWNNSSWNSEENNWEWSESW", "contract": {"declarer": "S", "strain": "ST", "level": 3}, "dd": 9, "lt": "AA99999999999"}, {"d": "EESSWWNSEWSWNSEWWNENWEESNESESNWWWNNESWWSNNNEENWSNSES", "contract": {"declarer": "S", "strain": "ST", "level": 3}, "dd": 9, "lt": "9999999999999"}, {"d": "SSSNWNWNEEENSWSESSENSNEWNWWWNNNSEWSEWNWSSNWEEEWWEESN", "contract": {"declarer": "S", "strain": "♥", "level": 4}, "dd": 10, "lt": "AAAAAAABBBAAA"}, {"d": "WSNSSSEWWENNESWSNWNNWSENNESNSNEESWWENSSWNSEWWEEWEWNE", "contract": {"declarer": "S", "strain": "♠", "level": 4}, "dd": 10, "lt": "AAABBBAAAAAAA"}, {"d": "NNWENESSSWSSWSWNWWSWSSWNWNNWWSNEENEENEWSSENEENEWESEN", "contract": {"declarer": "S", "strain": "♠", "level": 4}, "dd": 10, "lt": "BAABAABBBAABA"}, {"d": "WNESSWSSNWWENNNNSNSEEEEEEWWENWSSWWNNWENSSSWWENWSENES", "contract": {"declarer": "S", "strain": "ST", "level": 3}, "dd": 9, "lt": "AAAAAA9AAAAAA"}, {"d": "SSNWSSWNEEEEEESNSWNSNSEWENWESNESNNWENEENWSWWWSWWSNNW", "contract": {"declarer": "S", "strain": "ST", "level": 3}, "dd": 9, "lt": "999999AAAAAAA"}, {"d": "SNENESEWNNNWSNSNWSEWESESWNNWEWEWSESENNWSWNSSWNESWEEW", "contract": {"declarer": "S", "strain": "♥", "level": 4}, "dd": 10, "lt": "BBBBBAAAACCCC"}, {"d": "ENWNWSSESWESNNSWESWENEWWNESEWNWSENSWNENNSESWENNSWWES", "contract": {"declarer": "S", "strain": "ST", "level": 3}, "dd": 9, "lt": "AAA99999AA999"}, {"d": "NEEENESWWSNWENSENWWNSSWSNWSNEWSEESEEWNWWNSWSNNWESSEN", "contract": {"declarer": "S", "strain": "♥", "level": 4}, "dd": 10, "lt": "BBBBBBBBAABBB"}, {"d": "ENSNNSSNWSEEEWNSNWWWWENSSWNNWESWENSEEWWSSENSWSNWEEEN", "contract": {"declarer": "S", "strain": "♠", "level": 4}, "dd": 10, "lt": "AABBBBBAAAAAA"}, {"d": "NWESWESESNWEENENSWWNNWSSEWESNWWSSWESENSNNNENSENWWSWE", "contract": {"declarer": "S", "strain": "♥", "level": 4}, "dd": 10, "lt": "AAAAAAAAAAAAA"}, {"d": "SEEENWNNEWWEWNNNEWWESWNSSNSESESSSEEWNSSSEWNNWENNWWWS", "contract": {"declarer": "S", "strain": "ST", "level": 3}, "dd": 9, "lt": "9999AAAABBAAA"}, {"d": "WSNEESNNWWWEENSEEWNNWENSSEENNNWEWNNWEWWSNSSSWSWEESSS", "contract": {"declarer": "S", "strain": "♥", "level": 4}, "dd": 10, "lt": "AAAAAAAAAAAAA"}, {"d": "SNSNSNWSEEWSWEESNWENWNESWWNSNWWSWWSESENSWEWEEEESNNNN", "contract": {"declarer": "S", "strain": "♠", "level": 4}, "dd": 10, "lt": "AAAAAAAAAAAAA"}, {"d": "SNNSNWWSNWNEWNESSSWSNSEENWENSNSWNEWSSESWNEEEEWEWEWWN", "contract": {"declarer": "S", "strain": "♠", "level": 4}, "dd": 10, "lt": "AAAAABAABBBBB"}, {"d": "WWSSWEWSNWSNNNNNNWEENWESEEWWSWWNSNWEENSSSSNSNEEEEWSE", "contract": {"declarer": "S", "strain": "ST", "level": 3}, "dd": 9, "lt": "99AAA9999AAA9"}, {"d": "SNWSNNSWSWSWSNEWENNWSNWEWESEENENWEESEWSSWNNNESWENWES", "contract": {"declarer": "S", "strain": "ST", "level": 3}, "dd": 9, "lt": "BBBBAAAA99CBB"}, {"d": "NNNESWNWNESNWSESEWSNWWSESWEEWESESENWEEESNSWWSSNNNNWW", "contract": {"declarer": "S", "strain": "♠", "level": 4}, "dd": 10, "lt": "CCCDCCCBCAAAA"}, {"d": "SWWNWSEWEEEEWSENEESESENENNNSNSWWNWSNESSNSWWWWNNNSWES", "contract": {"declarer": "S", "strain": "ST", "level": 3}, "dd": 9, "lt": "99AAA9999999A"}, {"d": "SNNWSNEEWWENNWEENSNENWESSESSSWSEEEWWWWSSNWNNWWSNNEES", "contract": {"declarer": "S", "strain": "♠", "level": 4}, "dd": 10, "lt": "DDDABDDDDDDDD"}, {"d": "EWESWWWNNWSWNNNNNSWNNWSEEENESWSSSESEWNWSSNEEEEWSSENW", "contract": {"declarer": "S", "strain": "♥", "level": 4}, "dd": 10, "lt": "BBBBBBBBAAABB"}, {"d": "SWSSEEWNWEEWENWSSNWSWNSEWENEENNSEWSWNSSNNNNNSEESEWWW", "contract": {"declarer": "S", "strain": "♥", "level": 4}, "dd": 10, "lt": "CBBBCBBBAABBB"}, {"d": "NNESNESENEENSENSEWWWENEWWWSWESWWNWSSESESNNSSSWNWENWN", "contract": {"declarer": "S", "strain": "ST", "level": 3}, "dd": 9, "lt": "999999A999AAA"}, {"d": "SWSESNWEEEEWWSNEEESNWNNSWNWNNWNSWEEESWEWSSSNNNWESSNW", "contract": {"declarer": "S", "strain": "ST", "level": 3}, "dd": 9, "lt": "AAAA999999AAA"}, {"d": "ESWNSSSWEEWSSSNSNSENEWWNWWNESESWENSNWNESNENNENWEWWWE", "contract": {"declarer": "S", "strain": "♥", "level": 4}, "dd": 10, "lt": "BBBBBBBAABBBB"}, {"d": "ENWWENESWSEWENSENENSSNEWNWSSWSSWEEWWSNESSWNESWNENNWN", "contract": {"declarer": "S", "strain": "♥", "level": 4}, "dd": 10, "lt": "AAAABBBBBBCCC"}, {"d": "WWNNEEEENNWNSNNWNNENESEWNESNSESEWWSWESWESWSSWEWWSSNS", "contract": {"declarer": "S", "strain": "ST", "level": 3}, "dd": 9, "lt": "99AAAAAAAA999"}, {"d": "SNSENEENWWWENSSWENNNNEWENSSESWSSWSWESEWESENNNNWWSEWW", "contract": {"declarer": "S", "strain": "ST", "level": 3}, "dd": 9, "lt": "9999ABBBB9999"}, {"d": "SWEWWEEENWENENNSSNWSNNESWSSWEWSWEWENNSNSSWEWEWNSENSN", "contract": {"declarer": "S", "strain": "♥", "level": 4}, "dd": 10, "lt": "BBBBBBAAAABBB"}, {"d": "NNWEWSWNWSWEENSNSENSESEEWSEESWNESEENWNSSNNWWNWNWSSWE", "contract": {"declarer": "S", "strain": "♥", "level": 4}, "dd": 10, "lt": "BBBBBBAABBBBB"}, {"d": "EWESSWNSSNWNNNSNWEENEESEWNNSEWNWWEWEWNWNSSSEWEESSWNS", "contract": {"declarer": "S", "strain": "♠", "level": 4}, "dd": 10, "lt": "BAAAAAAAAAAAA"}, {"d": "NSSNWWEWNWNSNSWWWWEEEWNWNSENSNEESWENSSESEESNWSWNNESE", "contract": {"declarer": "S", "strain": "♠", "level": 4}, "dd": 10, "lt": "BBBBAAAAAAABB"}, {"d": "SNNNEEWESENSWNSEEENSWESEWWESWNWNSSWWSNWNWNESNENESSWW", "contract": {"declarer": "S", "strain": "♠", "level": 4}, "dd": 10, "lt": "AAAAABAAAAAAA"}, {"d": "NNSWESEENEWWSSSWWNWNWENSSSEWSSNWSWSEWENNWNEENEWNNSEE", "contract": {"declarer": "S", "strain": "ST", "level": 3}, "dd": 9, "lt": "99999AA999999"}, {"d": "NNWNEESNWWSNWNNWEENSSEESNESENWNSEESEWWSSWSSENNWEWWSW", "contract": {"declarer": "S", "strain": "♥", "level": 4}, "dd": 10, "lt": "AAAAABAABAAAA"}, {"d": "SENNWWEEWESENWNNWEEWNESNWESNSNNEWSNSSWEESWNSSSEWWSWN", "contract": {"declarer": "S", "strain": "ST", "level": 3}, "dd": 9, "lt": "999AAAAAABAAA"}, {"d": "NESNEESSNSNNNNWNEWNESWNNWWSSSSESEEWEWESWWNWEWEEWNWSS", "contract": {"declarer": "S", "strain": "♠", "level": 4}, "dd": 10, "lt": "CCCCCCCAACCCC"}, {"d": "NESSSEWWESNWESNNWNESNEWWWWSESESEEWNESNWESNSNNWESNWNW", "contract": {"declarer": "S", "strain": "♥", "level": 4}, "dd": 10, "lt": "AAABBBBBBBBBB"}, {"d": "NSENWENENNNWEWNEWWENWSWWWSSESWNSENWSSESSENNSENESSWEW", "contract": {"declarer": "S", "strain": "♠", "level": 4}, "dd": 10, "lt": "AAABBBBBBAAAA"}, {"d": "NEWWNWNSEWNSESESNWSWNNSSEESESENWWNWSENESSWSNEEWWNNWE", "contract": {"declarer": "S", "strain": "ST", "level": 3}, "dd": 9, "lt": "9999AAAAAAAAA"}]}, {"key": "slam", "title": {"es": "Juego de slam", "en": "Slam play"}, "role": "declare", "tip": {"es": "12 bazas con juego preciso: cuida entradas, impasses y el orden de los palos.", "en": "12 tricks with precise play: mind entries, finesses and suit order."}, "deals": [{"d": "NNSWWWSEEESENNSSWWNEESWEEESNEWSNSNWNSNESSENWNWEWWWNS", "contract": {"declarer": "S", "strain": "♠", "level": 6}, "dd": 12, "lt": "CCCCCCCCCCCCC"}, {"d": "WSWSWNWNEENENNSSNSEENESNSESESSWSWSEWWWENNNSNWWEWWNEE", "contract": {"declarer": "S", "strain": "♥", "level": 6}, "dd": 12, "lt": "CDDDDDDDDDDDD"}, {"d": "SNESSWSWNWWENSNSSWEWENSNEWNWWSEWENSWNSESNNENWEEEWENS", "contract": {"declarer": "S", "strain": "♥", "level": 6}, "dd": 12, "lt": "CCCCCCCCCDDCC"}, {"d": "NNSSWENSEEWEWNNNEWNSWSWEWENENNENWEWWSSSNSWWSSESNSEEW", "contract": {"declarer": "S", "strain": "ST", "level": 6}, "dd": 12, "lt": "CCCCCCCCCCCCC"}, {"d": "NSNENEEWSWWEESSNWSNSSNNNWESWSEESSNEWWWNNSWNNEWEEWESW", "contract": {"declarer": "S", "strain": "♥", "level": 6}, "dd": 12, "lt": "CCCCCDDDDCCCC"}, {"d": "SNEWESWSESEEENWSNWWWNWWSENNNEWEENWWESWNSNSSNSSSNENWE", "contract": {"declarer": "S", "strain": "ST", "level": 6}, "dd": 12, "lt": "DDDDDDDDCCCCD"}, {"d": "NNSNEESWEEENNSSSNWESWWNNSNSSNNEWEWWNEWEWWESSSWEEWSWN", "contract": {"declarer": "S", "strain": "♥", "level": 6}, "dd": 12, "lt": "CCCCCCCCCCCCC"}, {"d": "ENWSNEESWWEEWSNSEWWSWSSEEWNNESEWNNEWWSSSNNNSESNWNWEN", "contract": {"declarer": "S", "strain": "ST", "level": 6}, "dd": 12, "lt": "CCCCCCCCCCCCC"}, {"d": "NNESESSEWSENNNWENNWWEWWWEWSSSSEENNEWSENNSNSSEEWWWWNS", "contract": {"declarer": "S", "strain": "ST", "level": 6}, "dd": 12, "lt": "CCCCCCCCCCCCC"}, {"d": "NNSNESEWENWWWSSSSNSEWWNSEENNNEEWESESWSEWNWWNESNNWWES", "contract": {"declarer": "S", "strain": "♠", "level": 6}, "dd": 12, "lt": "DDDDDDDDCDDDD"}, {"d": "NWSNEWEWSSWWWNNSNSEWEWWSEWNNSSNSSEWNNENESNEEEESWSNWE", "contract": {"declarer": "S", "strain": "ST", "level": 6}, "dd": 12, "lt": "CCCCCCCCCCCCC"}, {"d": "SSNNWSENNENWENWWENESWEESNWNSWSWWENSWEESSNSESNWENWSWE", "contract": {"declarer": "S", "strain": "ST", "level": 6}, "dd": 12, "lt": "CCCCCCDDDDCCC"}, {"d": "NWSESSWENWENWNNESWSEENNSNWNSESEWSNNWWWENNSEWESWSEWSE", "contract": {"declarer": "S", "strain": "♥", "level": 6}, "dd": 12, "lt": "CCCCCCCCCCCCC"}, {"d": "NNWEWWWSEEWEWSSWNENSSNNWWSSSEWEEEEWEWNNSSNNNESWSNSNE", "contract": {"declarer": "S", "strain": "♥", "level": 6}, "dd": 12, "lt": "CCCCCCDDDCCCC"}, {"d": "WSESESEEWWWNNNNNENSESWWEENNSESWWSESSSWWNNNSWNSEEWWEN", "contract": {"declarer": "S", "strain": "ST", "level": 6}, "dd": 12, "lt": "CCCCCCCCCCCCC"}, {"d": "SSEWWSSENSWNESNWWNWENESWEENNNNWENWNEEEWSESSNWWWESNSS", "contract": {"declarer": "S", "strain": "♠", "level": 6}, "dd": 12, "lt": "CCCCCCCCCCCCC"}, {"d": "SSNEWWNSNNNNNSNWSESWESSSEENSNEEWWWEEEWNNEWNESSWSWEWW", "contract": {"declarer": "S", "strain": "♥", "level": 6}, "dd": 12, "lt": "CCCCCCCCCCCCC"}, {"d": "NNSEWSWEWEEWSNNNENWWSEWEENSWSSSSWWESNWESNESNNENEWWNS", "contract": {"declarer": "S", "strain": "♥", "level": 6}, "dd": 12, "lt": "CCCCCCCCCCCCC"}, {"d": "NNNWEWESNWNWESSESESEWSWNSSNNWWNNNWESEEWSNSWEESWWNESE", "contract": {"declarer": "S", "strain": "♠", "level": 6}, "dd": 12, "lt": "CCCCCCCCCCCCC"}, {"d": "NSESESWEWESWESNEWESNWSENWNNWSWNENEEWNNENNNSWWSWSSWSE", "contract": {"declarer": "S", "strain": "♥", "level": 6}, "dd": 12, "lt": "CCCCCCCCCCCCC"}, {"d": "NSWNSEWEWENEWSSNNSSESWWSEENWSSEWSENNNWEWNNNWEWESNSWE", "contract": {"declarer": "S", "strain": "♥", "level": 6}, "dd": 12, "lt": "CCCCCCDCCCCCC"}, {"d": "SNSWWWEWSSEEESSNNWENSESNSEWNNNESNWENSWNNSSEEWWWWWNEE", "contract": {"declarer": "S", "strain": "ST", "level": 6}, "dd": 12, "lt": "CCCCCCCCCCCCC"}, {"d": "ENSSNSENWEEWESSSNWWNNEWENWSNSWNWEENNWWESSSESSWENNWWE", "contract": {"declarer": "S", "strain": "ST", "level": 6}, "dd": 12, "lt": "CCCCCCCCCCCCC"}, {"d": "NESEWSWNWNWWNNNSESEESSSEWENWNNWNEWESEWESNSENSSWESNWW", "contract": {"declarer": "S", "strain": "ST", "level": 6}, "dd": 12, "lt": "CCCCCCDCCCCCC"}, {"d": "SNWSESEENWWNSSNNWWNEWSSWNWNSNWSESSWENNNWSSWNEEEEEEEW", "contract": {"declarer": "S", "strain": "♠", "level": 6}, "dd": 12, "lt": "DDDDDDDDDDCDD"}, {"d": "NSSEWEWESESENNNNWNNEEESEWEESSSWWNWESNEWNSNSSNWWSNWWW", "contract": {"declarer": "S", "strain": "ST", "level": 6}, "dd": 12, "lt": "DDDDCCCCDDDDD"}, {"d": "SNSEWWWSWWWWWESNSNNEWEEWNWNNSSNSNEENENSSSNEENEWEWSES", "contract": {"declarer": "S", "strain": "ST", "level": 6}, "dd": 12, "lt": "DDDDDDDDCCCDD"}, {"d": "ENSNESSEWENNSNSNESWWWWNWSNNSSWWESENENWSSNEEEWSWWNWEE", "contract": {"declarer": "S", "strain": "ST", "level": 6}, "dd": 12, "lt": "CCCCCCCCCCCCC"}, {"d": "NSWWNWSESSWEESNNESWENESSEWENNSNWNEESWWWNSNEEWSNESNWW", "contract": {"declarer": "S", "strain": "ST", "level": 6}, "dd": 12, "lt": "CCCCCCCCCCCCC"}, {"d": "SNSENSEWNEWSWNNNENESESENWESSEWSWEWWWSENNSNEWNSSEWWNW", "contract": {"declarer": "S", "strain": "♥", "level": 6}, "dd": 12, "lt": "CCCCCCCCCCCCC"}, {"d": "WNSSEWSWNNEWWSSWEWNWSEWWEESNENNNEWNSNSESNSSEESENEWNW", "contract": {"declarer": "S", "strain": "ST", "level": 6}, "dd": 12, "lt": "CDDDDCCCCCCCC"}, {"d": "SSNSWEWNSNENNSWENEEENWESWESWNSNWWEWEEWNSSSESWNENNWSW", "contract": {"declarer": "S", "strain": "♠", "level": 6}, "dd": 12, "lt": "CCCCCDDDDDCCC"}, {"d": "NSSEWSENEWSWNNSESESEEEENWNENSNEWNNEWNWWSNSSWWWSEWWNS", "contract": {"declarer": "S", "strain": "♠", "level": 6}, "dd": 12, "lt": "CCCCCCCCCCCCC"}, {"d": "NSEWWNSENESSENSSSENSENEWWENNNEESEEWWWSWNNNWNESWWWWSS", "contract": {"declarer": "S", "strain": "♠", "level": 6}, "dd": 12, "lt": "CCCCCCCCCCCCC"}, {"d": "NSNNWESESWSWNNNNSENWEESSESNENWEWNEWNEWSSWWNEWESSSEWW", "contract": {"declarer": "S", "strain": "♥", "level": 6}, "dd": 12, "lt": "CCCCCCCCCCDDD"}, {"d": "SNSEWWSENWEEWNSSENWNESWSNWNSNNEWWENSWSSSWWENESNNWEEE", "contract": {"declarer": "S", "strain": "ST", "level": 6}, "dd": 12, "lt": "CCCCCCCCCCCCC"}, {"d": "NSNWWEWNSENWWENNNSWSNEENSSSESSEWSSWEEWWNNSSENWEWEENW", "contract": {"declarer": "S", "strain": "ST", "level": 6}, "dd": 12, "lt": "CCCCCCCCCCCCC"}, {"d": "SNWSESESEEESEESEEWESWSNWNWNSNNWWSWWSSENNNSNNWNEWNEWW", "contract": {"declarer": "S", "strain": "ST", "level": 6}, "dd": 12, "lt": "DCCCCDDDDDDDD"}, {"d": "SSSSSSWWWEWNSNNNEESEENWWENSNEEWWSEWNEWNWNNEEESSNWNWS", "contract": {"declarer": "S", "strain": "ST", "level": 6}, "dd": 12, "lt": "CCCCCCCCCCCDD"}, {"d": "SNNSWEENWENSWSWWEWNSWEWWNENNNSESESNSSEWSSWWNSEEWNEEN", "contract": {"declarer": "S", "strain": "♠", "level": 6}, "dd": 12, "lt": "CCCCCCCCCCCCD"}, {"d": "NSNWNWEWWENSWESSWWSENEWEWENNNESWWNSESNESSESNSSENWNWE", "contract": {"declarer": "S", "strain": "ST", "level": 6}, "dd": 12, "lt": "DDDDDCCCCDDDD"}, {"d": "SWNNSNWWNNENSSNNESEEENEEWWSSWEESNEWWWSESSNWWEWNNWSES", "contract": {"declarer": "S", "strain": "♠", "level": 6}, "dd": 12, "lt": "DCCCCCCCCCCCC"}, {"d": "SNSNWNNSWWNSESNESWSWEENWNWSSNSEEWEWNWEWWNEEEENNESWSS", "contract": {"declarer": "S", "strain": "♠", "level": 6}, "dd": 12, "lt": "CCCCCCCCCCCCC"}, {"d": "ESNWSNENSNNWWSNEWWWEWENESNSNNSENNWESWEESSSWSSWNWEEEW", "contract": {"declarer": "S", "strain": "♠", "level": 6}, "dd": 12, "lt": "CCCCCCCCCCCCC"}, {"d": "SESEEWSWWWEWNNNSSSWEENNWSEWNSWSNWEESWEENNNSWEENWNSNS", "contract": {"declarer": "S", "strain": "ST", "level": 6}, "dd": 12, "lt": "CCCCCCCCDDDCC"}, {"d": "NSNENNWNWESESNSSWEEWNEWSSENNWWSENEWSNWESESNSNESEWWWW", "contract": {"declarer": "S", "strain": "♥", "level": 6}, "dd": 12, "lt": "CCCCCCCCCCCCC"}, {"d": "SNESSWEEEESNSNESSNWWEWENWNSSNEWWSNWWWEWSSNSENNENWNWE", "contract": {"declarer": "S", "strain": "♠", "level": 6}, "dd": 12, "lt": "CCCCCCCCCCCCC"}, {"d": "SSWESSWENSEWENNSWNEWWSEESNSSNWNWWWNENEWSENEENSWSNWEN", "contract": {"declarer": "S", "strain": "♥", "level": 6}, "dd": 12, "lt": "CDDCCCCCCCCCC"}, {"d": "NSSWSESWESNEWNNENEWWSWEEEESNESWEWNSNWEEWNSNSNWWSWSNN", "contract": {"declarer": "S", "strain": "ST", "level": 6}, "dd": 12, "lt": "CCCCCCCCCCCCC"}, {"d": "SSEWWNWSNWESESNSSEEWEWWSNNSEWNEEWWNEENENNNSWESWWNSNS", "contract": {"declarer": "S", "strain": "ST", "level": 6}, "dd": 12, "lt": "CCCCCCCCCCCCC"}]}, {"key": "grand", "title": {"es": "Gran slam", "en": "Grand slam"}, "role": "declare", "tip": {"es": "13 bazas: no se perdona ni una. Cuenta entradas y el orden exacto antes de empezar.", "en": "All 13 tricks: no margin. Count entries and the exact order before you start."}, "deals": [{"d": "NSSNEEESSENSWNSENSWWNENNNSSNEWEWSESWWNESWSNWWWNEEWEW", "contract": {"declarer": "S", "strain": "♥", "level": 7}, "dd": 13, "lt": "DDDDDDDDDDDDD"}, {"d": "NNSWWWSEEESENNSSWWNEESWEEESNEWSNSNWNSNESSENWNWEWWWNS", "contract": {"declarer": "S", "strain": "ST", "level": 7}, "dd": 13, "lt": "DDDDDDDDDDDDD"}, {"d": "SNNEESESWWENESNNNWSWWENEWNSNWSWSNSEWNWNSSSEEEWSNWEEW", "contract": {"declarer": "S", "strain": "♥", "level": 7}, "dd": 13, "lt": "DDDDDDDDDDDDD"}, {"d": "NNNSWSNEWSENWSSESESEWSEEESNWNWNWWSWWSNENSNEEESWENWNW", "contract": {"declarer": "S", "strain": "♠", "level": 7}, "dd": 13, "lt": "DDDDDDDDDDDDD"}, {"d": "NSNEEEENWSNEWNNSSWWNWNSNWNSNNEWSEEESWESSESNWWWSWEESW", "contract": {"declarer": "S", "strain": "♥", "level": 7}, "dd": 13, "lt": "DDDDDDDDDDDDD"}, {"d": "NNSEWEEESENESNSSWESNNNSWWNSSWNEEEWESWNWNWSNNEWWWWSSE", "contract": {"declarer": "S", "strain": "ST", "level": 7}, "dd": 13, "lt": "DDDDDDDDDDDDD"}, {"d": "NWSSNEWEWSSSNNNNSEWESNNNSESSEWWWEEWEESNSNWNENEEWWSWW", "contract": {"declarer": "S", "strain": "♥", "level": 7}, "dd": 13, "lt": "DDDDDDDDDDDDD"}, {"d": "NNNWEWESNWNWESSESESEWSWNSSNNWWNNNWESEEWSNSWEESWWNESE", "contract": {"declarer": "S", "strain": "ST", "level": 7}, "dd": 13, "lt": "DDDDDDDDDDDDD"}, {"d": "SSSEEWNWEEWEWSNSESNEWSEWEWNSNNSNWENNEWNSNWWNEENWSSWS", "contract": {"declarer": "S", "strain": "ST", "level": 7}, "dd": 13, "lt": "DDDDDDDDDDDDD"}, {"d": "NWNSSWSNEEWESNNNWNEWSNWWEENNSSWNEEESWWWSNSNSEEWEESWS", "contract": {"declarer": "S", "strain": "♠", "level": 7}, "dd": 13, "lt": "DDDDDDDDDDDDD"}, {"d": "SNNESESSWEWSWNNWENWEEWWNNNSSSSSNEEESWWESNEWENWWSNNWE", "contract": {"declarer": "S", "strain": "♠", "level": 7}, "dd": 13, "lt": "DDDDDDDDDDDDD"}, {"d": "SNSENSEWNEWSWNNNENESESENWESSEWSWEWWWSENNSNEWNSSEWWNW", "contract": {"declarer": "S", "strain": "♠", "level": 7}, "dd": 13, "lt": "DDDDDDDDDDDDD"}, {"d": "NEWNESEENEWNWNSNNSENWWESEESNESESWNWSSWSSSNWSENWWNWWE", "contract": {"declarer": "S", "strain": "♥", "level": 7}, "dd": 13, "lt": "DDDDDDDDDDDDD"}, {"d": "NSEWWNSENESSENSSSENSENEWWENNNEESEEWWWSWNNNWNESWWWWSS", "contract": {"declarer": "S", "strain": "ST", "level": 7}, "dd": 13, "lt": "DDDDDDDDDDDDD"}, {"d": "SSNWWESSNNWESNSNNWESWSWSNENEWSEEEESNEWWSNNNSNEEWWEWW", "contract": {"declarer": "S", "strain": "ST", "level": 7}, "dd": 13, "lt": "DDDDDDDDDDDDD"}, {"d": "SSSWEWNEEESEESNWSNWNNNWESWSWSNWSENEWEWWSNSENNWSNNEWE", "contract": {"declarer": "S", "strain": "♥", "level": 7}, "dd": 13, "lt": "DDDDDDDDDDDDD"}, {"d": "NSNENNWNWESESNSSWEEWNEWSSENNWWSENEWSNWESESNSNESEWWWW", "contract": {"declarer": "S", "strain": "♠", "level": 7}, "dd": 13, "lt": "DDDDDDDDDDDDD"}, {"d": "SNSEWEWWWEEWSNSNWESWEESNNNNWNWWSSNSESNWNNSWEEEWESESN", "contract": {"declarer": "S", "strain": "♥", "level": 7}, "dd": 13, "lt": "DDDDDDDDDDDDD"}, {"d": "SNESSWEEEESNSNESSNWWEWENWNSSNEWWSNWWWEWSSNSENNENWNWE", "contract": {"declarer": "S", "strain": "ST", "level": 7}, "dd": 13, "lt": "DDDDDDDDDDDDD"}, {"d": "SSEWWNWSNWESESNSSEEWEWWSNNSEWNEEWWNEENENNNSWESWWNSNS", "contract": {"declarer": "S", "strain": "♥", "level": 7}, "dd": 13, "lt": "DDDDDDDDDDDDD"}, {"d": "SESWWWSEESNSWNSSSEWWNENSEESWSNNWWNNENEENNSNWWWWSEENE", "contract": {"declarer": "S", "strain": "♥", "level": 7}, "dd": 13, "lt": "DDDDDDDDDDDDD"}, {"d": "SSNENSWENNWWSNSWNSWWNSNNEESNSSEEEWWEEEWSNWSSNEEEWWWN", "contract": {"declarer": "S", "strain": "♥", "level": 7}, "dd": 13, "lt": "DDDDDDDDDDDDD"}, {"d": "SSSSEWEEWNENWNNWNWSEENWESWNNSNSESWNWESSNESWEEWWWESNN", "contract": {"declarer": "S", "strain": "ST", "level": 7}, "dd": 13, "lt": "DDDDDDDDDDDDD"}, {"d": "NNNWNSNWEESWESNWNNEEWSEEESNNNEESWWSSSEWSWNSWWEWNSESW", "contract": {"declarer": "S", "strain": "♠", "level": 7}, "dd": 13, "lt": "DDDDDDDDDDDDD"}, {"d": "SNNWEEWNSENNWSESSSEEWENSSNSSWWEWWEENWNESSNWSEWWWNNEN", "contract": {"declarer": "S", "strain": "ST", "level": 7}, "dd": 13, "lt": "DDDDDDDDDDDDD"}, {"d": "SSNEWNESEWSENSSSNWWEEEWWNSSNWSNWEWENWWNSESWWSENNEENN", "contract": {"declarer": "S", "strain": "♥", "level": 7}, "dd": 13, "lt": "DDDDDDDDDDDDD"}, {"d": "NSNWEWEESNSEENNNWNEWWWEWWSSSSWESWSNEENWNNNSEWNESWSES", "contract": {"declarer": "S", "strain": "ST", "level": 7}, "dd": 13, "lt": "DDDDDDDDDDDDD"}, {"d": "NSNESWSEWNNWWNNSNEWWWEWSSNSSESENWWWESWNSNSEEEEESNENW", "contract": {"declarer": "S", "strain": "♠", "level": 7}, "dd": 13, "lt": "DDDDDDDDDDDDD"}, {"d": "NWSSNWEEWSSWWNSNESEEESWWSWSWNWEESWNNESESNNNNNEWENEWS", "contract": {"declarer": "S", "strain": "ST", "level": 7}, "dd": 13, "lt": "DDDDDDDDDDDDD"}, {"d": "NSNENNEWWESNWNSSWEEWESSWWWNESNWEWEESNWNSNSWENSEENWSS", "contract": {"declarer": "S", "strain": "♠", "level": 7}, "dd": 13, "lt": "DDDDDDDDDDDDD"}, {"d": "NNSSSEWNWEEWWNSNSEWWSEWSENNNSSNNSEWEWWWNSNEESESNWWEE", "contract": {"declarer": "S", "strain": "ST", "level": 7}, "dd": 13, "lt": "DDDDDDDDDDDDD"}, {"d": "SNENSNWNEWSSNSNSSEEWSSNEWESSWEWWSWEWEEWNENNNEWNWNESW", "contract": {"declarer": "S", "strain": "♠", "level": 7}, "dd": 13, "lt": "DDDDDDDDDDDDD"}, {"d": "NNSENSEWWWNSESSEEWNSWNSEWEENNNWEEWWWEWWNSSSSNNWSNESE", "contract": {"declarer": "S", "strain": "♠", "level": 7}, "dd": 13, "lt": "DDDDDDDDDDDDD"}, {"d": "NENEWESEENSWWNNSEWWSEEWNWNSSWSNEESNNSWENNNWWSWSESWES", "contract": {"declarer": "S", "strain": "ST", "level": 7}, "dd": 13, "lt": "DDDDDDDDDDDDD"}, {"d": "NNEEWSSENWESENNSSEENNSWWWWSNESEWNNSNWNESNEWSWWEWSWSE", "contract": {"declarer": "S", "strain": "♥", "level": 7}, "dd": 13, "lt": "DDDDDDDDDDDDD"}, {"d": "NSNWWESSWWSSESSNWEWNEESSSWNNSWWNSSNEEENNNEEWWENNEEWW", "contract": {"declarer": "S", "strain": "♥", "level": 7}, "dd": 13, "lt": "DDDDDDDDDDDDD"}, {"d": "NNNWNWWEEEWWWSSEEWEWNEENESNSWSNSWNWWESNNNNSWSESSSSEE", "contract": {"declarer": "S", "strain": "ST", "level": 7}, "dd": 13, "lt": "DDDDDDDDDDDDD"}, {"d": "NNNNESNENSSWSNWNSSNWSSEEESSSNEWWWWWWEEWSSEWWENNENEWE", "contract": {"declarer": "S", "strain": "ST", "level": 7}, "dd": 13, "lt": "DDDDDDDDDDDDD"}, {"d": "SNESENSWWWWWESSNEWWSSEWENWSNSENNWWNESSENSNNENNWEEWSE", "contract": {"declarer": "S", "strain": "ST", "level": 7}, "dd": 13, "lt": "DDDDDDDDDDDDD"}, {"d": "NEENSNSSEEWWWSNSSWSWWEENEWNNNSENNSNWEWWNNSSSEEWEEWWS", "contract": {"declarer": "S", "strain": "ST", "level": 7}, "dd": 13, "lt": "DDDDDDDDDDDDD"}, {"d": "SSWWESENSSWEWSSWNSEEWNEEEENNWSWESNWNWWENSNNENSWNWNSE", "contract": {"declarer": "S", "strain": "ST", "level": 7}, "dd": 13, "lt": "DDDDDDDDDDDDD"}, {"d": "SSSEWNWWNSESNNNNWSESESNWNSSNWNWWWEEENEWNSNWSWEEEEEWS", "contract": {"declarer": "S", "strain": "♠", "level": 7}, "dd": 13, "lt": "DDDDDDDDDDDDD"}, {"d": "SNNNNWEWWSSNENSSEEEEEWEWSSNNSSNSWWWNSNESWEESWWWWEENN", "contract": {"declarer": "S", "strain": "ST", "level": 7}, "dd": 13, "lt": "DDDDDDDDDDDDD"}, {"d": "SSSEWWWNNEWWENNNEESENNSWEWNWSEEWEWNWESENSWNWNNSSSESS", "contract": {"declarer": "S", "strain": "ST", "level": 7}, "dd": 13, "lt": "DDDDDDDDDDDDD"}, {"d": "SNNSSWNWNSNWNSEWSSEEWWENEWSSENWEWEWNWNESNNSWEWNEESES", "contract": {"declarer": "S", "strain": "♠", "level": 7}, "dd": 13, "lt": "DDDDDDDDDDDDD"}, {"d": "NNWEENNEESEWENSWWNSEESSNNESSNNWSWSENWSENSWSWESWWWENW", "contract": {"declarer": "S", "strain": "ST", "level": 7}, "dd": 13, "lt": "DDDDDDDDDDDDD"}, {"d": "NSNWEESNWENWESSESEWNEESWWESWWSWWWEENSENSSNNNNNWESSNW", "contract": {"declarer": "S", "strain": "ST", "level": 7}, "dd": 13, "lt": "DDDDDDDDDDDDD"}, {"d": "NNSESWWSENNNWSNNEENESSSSWWSSEEWNEESWWEENNESNWESNWWWW", "contract": {"declarer": "S", "strain": "♠", "level": 7}, "dd": 13, "lt": "DDDDDDDDDDDDD"}, {"d": "SNWSNEWEWSENNSSESSWENEENWNSWNNWEWEWNSWWNSNSESWWEESEN", "contract": {"declarer": "S", "strain": "♠", "level": 7}, "dd": 13, "lt": "DDDDDDDDDDDDD"}, {"d": "NNSEEWESWNSSWSSNSWSWEWSWWENNENNSSNESWSNNENWWEEENWEEW", "contract": {"declarer": "S", "strain": "ST", "level": 7}, "dd": 13, "lt": "DDDDDDDDDDDDD"}]}, {"key": "defend", "title": {"es": "Hundir el contrato", "en": "Defeat the contract"}, "role": "defend", "tip": {"es": "El contrato CAE con la mejor defensa. Encuentra la línea: ataca el palo correcto, cuenta y señaliza.", "en": "The contract GOES DOWN with best defense. Find the line: attack the right suit, count and signal."}, "deals": [{"d": "NEESEEWSWSSNNWWNEESNNEWSENESESENWWWWWNNENWNSSSNWWSES", "contract": {"declarer": "E", "strain": "ST", "level": 3}, "dd": 8, "lt": "AAAA88BB88888"}, {"d": "WEEWNSNNNSSSWSNNSWWWEESSENNEEESSNWESEWNWESWENESWNWWN", "contract": {"declarer": "E", "strain": "ST", "level": 3}, "dd": 8, "lt": "8888888888888"}, {"d": "EEENSESWNWSSNWEESSWSSWESENENESENNWWNNSWNENNWWSSWNEWW", "contract": {"declarer": "E", "strain": "♠", "level": 4}, "dd": 9, "lt": "A999AAAAAAAAA"}, {"d": "EWWWENEWSESWWSNWESNNENWWENWWENESSSSNEWNNWENESSSNESSN", "contract": {"declarer": "E", "strain": "♠", "level": 4}, "dd": 9, "lt": "AA99AAAA99999"}, {"d": "EEESWWSNSWSNNWNENWEWNSNWENSNEENENWENESSWWESESWSWSSWN", "contract": {"declarer": "E", "strain": "♠", "level": 4}, "dd": 9, "lt": "999999AA99999"}, {"d": "EWNWENSNNSNWSEESEWSSESSESWNSEWWWNSEEWNSWSWENNNNWEENW", "contract": {"declarer": "E", "strain": "♥", "level": 4}, "dd": 9, "lt": "9999999999999"}, {"d": "WNEEWEENNSEWEWSEESWNSNWEWSSSEWSNENNWENSEWSNWNNSWNSSW", "contract": {"declarer": "E", "strain": "ST", "level": 3}, "dd": 8, "lt": "9AA9988998888"}, {"d": "NWWWESSWSNEENWNSSEEWNWNSNEWSSENNESNWSNSEWENEWSEENSWW", "contract": {"declarer": "E", "strain": "ST", "level": 3}, "dd": 8, "lt": "AAA99988BBBAA"}, {"d": "WWWSNSSSWSSNEESSNWESEWWESWSWNNWNNNEWWSEWEENEEENNSNNE", "contract": {"declarer": "E", "strain": "ST", "level": 3}, "dd": 8, "lt": "8888889998999"}, {"d": "WSSWWEWENNENSWNSSWSWWENSNENWEWNSESWEWNSEEESNSSNNWENE", "contract": {"declarer": "E", "strain": "♥", "level": 4}, "dd": 9, "lt": "9999999999999"}, {"d": "ENSNEWSEWSWENSNNNWWSNSSNEWWEEWEWSSWENSNWEWESNENSWENS", "contract": {"declarer": "E", "strain": "♠", "level": 4}, "dd": 9, "lt": "A999999999999"}, {"d": "WSNWWSEEENSNSNEWWNSSSEWWNWSEWNEWNSSSWENEEWWSEENNESNN", "contract": {"declarer": "E", "strain": "♠", "level": 4}, "dd": 9, "lt": "9999999999999"}, {"d": "EEWNEEWSWSSSSWWESNNENESENNWNNESWEENWWSNSNEENWSNWWSSW", "contract": {"declarer": "E", "strain": "ST", "level": 3}, "dd": 8, "lt": "9999999889999"}, {"d": "EEWSWSNEESNNNWSWWNSWWWNENNWNENNSNEWSSEESSEEWEWWSNSES", "contract": {"declarer": "E", "strain": "♠", "level": 4}, "dd": 9, "lt": "9999999999AAA"}, {"d": "EWWWESENESNNWSNSNNWSESWNSWEWWWSSSSSEWNNEENWSWENEENEN", "contract": {"declarer": "E", "strain": "ST", "level": 3}, "dd": 8, "lt": "DD88888DDDDDD"}, {"d": "EEWNSSENWWNWNWWWSENWNEESSSNWSNESWNEWESWNSWEENSSEENSN", "contract": {"declarer": "E", "strain": "ST", "level": 3}, "dd": 8, "lt": "8888888888888"}, {"d": "WNSSEWSWSEWEEEWSSEWNSWNNWEWNENNESSNNWWNEWSNENWSEESSN", "contract": {"declarer": "E", "strain": "ST", "level": 3}, "dd": 8, "lt": "AA99AAA999988"}, {"d": "ENESWWENNSWWEWSENWENSNSWWWWNSWNNSESNENSEEWSSNENESWSE", "contract": {"declarer": "E", "strain": "ST", "level": 3}, "dd": 8, "lt": "CCAAA8888AAAA"}, {"d": "WSEEEENESNNSWSEWSWNNNWSNEESWWNNESESSNEEWSWWWSENNNWWS", "contract": {"declarer": "E", "strain": "♥", "level": 4}, "dd": 9, "lt": "9999999999999"}, {"d": "NEWESSNEEWNWNESWESENNSENWENWWWSNWSNEESWSEWNSSNNSSEWW", "contract": {"declarer": "E", "strain": "♠", "level": 4}, "dd": 9, "lt": "99AAA99999999"}, {"d": "NENSSWSWNWSSNWEENSENSSEWSNWWNWWENNWSEEWWESNNEESENESW", "contract": {"declarer": "E", "strain": "♥", "level": 4}, "dd": 9, "lt": "9999999999999"}, {"d": "WWWNSENSNSNWSEWSEWESEEESENSESWENENSWNNSNENWWWENWSNSW", "contract": {"declarer": "E", "strain": "ST", "level": 3}, "dd": 8, "lt": "8888AAABB9988"}, {"d": "SEENSNWEEWSSSSEWWWNNSEEEWNNEWWNESSWSSNSWWNWNSNEENENW", "contract": {"declarer": "E", "strain": "ST", "level": 3}, "dd": 8, "lt": "9A99999888889"}, {"d": "WNEWSNSESENESEENSENENNSEWENESWNWWNSSWWWWWSNWWSESENSN", "contract": {"declarer": "E", "strain": "♥", "level": 4}, "dd": 9, "lt": "9999ABB999999"}, {"d": "WWEWNSESSSENWEWWWSSEENNNNSNNWWWSWNNWEESNWESNSENSEEES", "contract": {"declarer": "E", "strain": "♠", "level": 4}, "dd": 9, "lt": "A999999999999"}, {"d": "SENSNSNENESNNEWESEEWSNSSSENWSWWNWWWEEEWWESEWNNSNSWWN", "contract": {"declarer": "E", "strain": "♥", "level": 4}, "dd": 9, "lt": "AAAAB99999AAA"}, {"d": "WEWENWSENESESWENSNSEEWNNNSNSENSEWENSWSWWNWNEESSNWWSW", "contract": {"declarer": "E", "strain": "♠", "level": 4}, "dd": 9, "lt": "999999AA99999"}, {"d": "NSENNWESESEWENEEWSESEENNWSWNWESSNSSSWNWWWWNNNWSWNSEE", "contract": {"declarer": "E", "strain": "♥", "level": 4}, "dd": 9, "lt": "A999999999999"}, {"d": "ENESEWNNWSEWNEESNNWSEWSNNSENNSSSEEWWWEWWNEWSWWNSESSN", "contract": {"declarer": "E", "strain": "♠", "level": 4}, "dd": 9, "lt": "AA99999999999"}, {"d": "ENNSSNSEESSSSEEWWNWNEEEWSWENWWESWWNSWNENWSNNWSEESNWN", "contract": {"declarer": "E", "strain": "ST", "level": 3}, "dd": 8, "lt": "BBBBBBBBBB8BB"}, {"d": "WWWWSWWNEESSSEWNEEWNNWSENWSNNEENSSSNNESESSEWWESENNNW", "contract": {"declarer": "E", "strain": "ST", "level": 3}, "dd": 8, "lt": "BBBBB88888BBC"}, {"d": "EENSWWSSNWSNSWSWEEESNWWWSNEEEWWNSWSENNENSNEESNWENSNW", "contract": {"declarer": "E", "strain": "ST", "level": 3}, "dd": 8, "lt": "CCCCCCCCCC888"}, {"d": "ESNSSWWSNNEESNWEWNWENENNWEWNESNWSSEWEWWWESESSENSNSWN", "contract": {"declarer": "E", "strain": "♥", "level": 4}, "dd": 9, "lt": "99999999AAAAA"}, {"d": "WESENESWNNESSESNWWWWWNESEEWNSWNSENNWNSEEESSWSNNEWNSW", "contract": {"declarer": "E", "strain": "♠", "level": 4}, "dd": 9, "lt": "B9999999999AA"}, {"d": "WWWEWENSSWEENENEENSSWEWWNWSENWNWSNSSNWSEESNNWNSESNES", "contract": {"declarer": "E", "strain": "ST", "level": 3}, "dd": 8, "lt": "BBBB8CCCCBBBB"}, {"d": "WWEESEWWEEESNESWESNEWSNWNNEWNSWSWNNSSSENNNWWNWESSSEN", "contract": {"declarer": "E", "strain": "ST", "level": 3}, "dd": 8, "lt": "99BAAAAAAA888"}, {"d": "EEWSEWEWEWNSNESSNSWSWNWSWNEENNWWNSWSENESWNEEWSNSNNES", "contract": {"declarer": "E", "strain": "ST", "level": 3}, "dd": 8, "lt": "9988888999999"}, {"d": "ENSNENESEWENNWEWEWSWNSWSNSESSSEWNWNNWNNSWWENESEWSESW", "contract": {"declarer": "E", "strain": "♥", "level": 4}, "dd": 9, "lt": "AAAAAAAAA9AAA"}, {"d": "EEWSESWSWNNNNNNSWNWSNSEEEEWESWWENWSENSEESWWSENWWNSSN", "contract": {"declarer": "E", "strain": "ST", "level": 3}, "dd": 8, "lt": "888888888B999"}, {"d": "NWWWNESNSNSSSSWENNEWEWNSESSESWNESWEENNSEWENWEWWSEWNN", "contract": {"declarer": "E", "strain": "ST", "level": 3}, "dd": 8, "lt": "8888899999999"}, {"d": "NWENSWSESWNSWWEEWESWNNSEWNNWNENWSWSENSWEESENWSSEENSN", "contract": {"declarer": "E", "strain": "ST", "level": 3}, "dd": 8, "lt": "8899888889999"}, {"d": "WWNNESEWNSNWSNWWWNNWSSESEEWNSNESSENWNNEESWWEESWNESSE", "contract": {"declarer": "E", "strain": "♥", "level": 4}, "dd": 9, "lt": "999999999B999"}, {"d": "EWSWSNSNNNNSWNEESWSESWENWNNWSEESENSEEEWWWSEWENWSWSNN", "contract": {"declarer": "E", "strain": "♠", "level": 4}, "dd": 9, "lt": "9999999999999"}, {"d": "EWENWSESNENNSSNWWESWSNEENSWWENEWSWSNWSWNWSENENENWSSE", "contract": {"declarer": "E", "strain": "♠", "level": 4}, "dd": 9, "lt": "AAA9999999AAA"}, {"d": "NNEENSNWWSSWNEWWNWEWNSEESWEESWWESNWNENSWNSNSESEESSWN", "contract": {"declarer": "E", "strain": "ST", "level": 3}, "dd": 8, "lt": "88888AAA88888"}, {"d": "EWSSNWSWWENESNWWNNSWEENNWEENWNEEEWSESWWEENSSSSNNSNWS", "contract": {"declarer": "E", "strain": "ST", "level": 3}, "dd": 8, "lt": "9999999888888"}, {"d": "EWNEWWSENNWWWNEEENSNWESSSSSWEWEESNENESNWNNSNSWWEWSNS", "contract": {"declarer": "E", "strain": "ST", "level": 3}, "dd": 8, "lt": "BAAAAABBB8888"}, {"d": "NEEEWEWWSWNSEWSSSWESNNNNWNWSNNEESNSWSWSWWEESSNNWEEEN", "contract": {"declarer": "E", "strain": "ST", "level": 3}, "dd": 8, "lt": "BB999C88888BB"}, {"d": "EEENNESSWSSEWWSWNSNSSSWENSNNSEEWNEWSENSWWWNENWENWNEW", "contract": {"declarer": "E", "strain": "♠", "level": 4}, "dd": 9, "lt": "CCCCAAAAAA999"}, {"d": "WWSSNWWEWSNSWEESWSENSENENEWNSSEEENEWSWSNEEWNNWNSSNWN", "contract": {"declarer": "E", "strain": "♥", "level": 4}, "dd": 9, "lt": "9999ABB9999AA"}]}, {"key": "beatslam", "title": {"es": "Batir un slam", "en": "Beat a slam"}, "role": "defend", "tip": {"es": "El slam rival se bate con la defensa correcta. Una salida o un cambio precisos lo hunden.", "en": "The opponents' slam can be beaten with correct defense. A precise lead or switch sets it."}, "deals": [{"d": "WEWWEWNSNNSNNWWNESNESESSEESSWESSWSNNSEEEEWNWWWWNNNES", "contract": {"declarer": "E", "strain": "ST", "level": 6}, "dd": 11, "lt": "CCDCCCBBDDDDC"}, {"d": "WSSWNNSSWSEEWWWWNNNSESWSSNENWEWNSEEWNWNEWENEESNSNESE", "contract": {"declarer": "E", "strain": "♥", "level": 6}, "dd": 11, "lt": "BBCCCCCCCCCCC"}, {"d": "WWNWENSNWEWSSEEEEWSWEESNSSENSWWNWEWEENSWWSSENNNSNNSN", "contract": {"declarer": "E", "strain": "♠", "level": 6}, "dd": 11, "lt": "CCCCCCCBBCCCC"}, {"d": "WWENSNWWEWNSSSEEENNWEENSNNESNWSNWNSWWSEWEESNWESENSSW", "contract": {"declarer": "E", "strain": "♠", "level": 6}, "dd": 11, "lt": "CCCCCBBBBCCCC"}, {"d": "EEWENSNESNNESNWEWSWEWWEWSSSWNSENSNENNSNEEWWWSWSNNEWS", "contract": {"declarer": "E", "strain": "♥", "level": 6}, "dd": 11, "lt": "CCCBBBBCCCCCC"}, {"d": "SEWESSNEEESNWWWEWENSNWNSWEESSWNNSENNEWEWWNSNWNSSNSEW", "contract": {"declarer": "E", "strain": "♥", "level": 6}, "dd": 11, "lt": "CBBBBBBBCCCCC"}, {"d": "NSEENWSWESWSWWSEWNSSNENWWEEEEWESNWNENNNEWWENWSNSSSNS", "contract": {"declarer": "E", "strain": "ST", "level": 6}, "dd": 11, "lt": "BBBBCCCBBBBBB"}, {"d": "ESWNWWWSEWNWSENEWNWNSESSNNSEWWSNSENSWSEEEEWEEWNSNSNN", "contract": {"declarer": "E", "strain": "♠", "level": 6}, "dd": 11, "lt": "DBBBBBBBBBBBB"}, {"d": "EEWWNNWNWWNNESENESWNENNWESWSWWSSSESSWSSWWENSENNESNEE", "contract": {"declarer": "E", "strain": "♠", "level": 6}, "dd": 11, "lt": "BBBBBBBBBBBBB"}, {"d": "EENWWEWWNESSNWWESWNSWNEEEWNNENWNESENSSEWEWWNSSSNSSSN", "contract": {"declarer": "E", "strain": "ST", "level": 6}, "dd": 11, "lt": "CCCCBBBCCCCCC"}, {"d": "EWSSWNSEWNSEWWWESEENSWEWEWWNNNSNNNSWSWNEENENSNEWSSSE", "contract": {"declarer": "E", "strain": "♠", "level": 6}, "dd": 11, "lt": "CCCCCCBBBCCCC"}, {"d": "WWWWSEESNENEEWESNWEENNSWNWWEEESSSSNNWESENNSNNSNSWSWW", "contract": {"declarer": "E", "strain": "♥", "level": 6}, "dd": 11, "lt": "CCCCCCCCCBBBB"}, {"d": "WEEWWNNNNWSESSSEEWWNSNWWNWEEESEEEESSNWNWWSSNSWNNSSNE", "contract": {"declarer": "E", "strain": "♥", "level": 6}, "dd": 11, "lt": "BBBBBBBBBBBBB"}, {"d": "WWWESEEWSNNSWEEEWWSSSNSEEEWEWSNWENNNNSSSNSWWENEWNSNN", "contract": {"declarer": "E", "strain": "♠", "level": 6}, "dd": 11, "lt": "DDDDDDDDDDBBB"}, {"d": "WNWSNNESWNNWEEEWWEWWSESEENEEWEWNWSNSNNSENSSWSSESNSNW", "contract": {"declarer": "E", "strain": "♥", "level": 6}, "dd": 11, "lt": "BBBBBBBBBBBBB"}, {"d": "ESWEESNSWENSWWWWWNSSWNNNNNEENSNENENSESESWESNWWEWSWSE", "contract": {"declarer": "E", "strain": "ST", "level": 6}, "dd": 11, "lt": "CBBBBBBBBBBBB"}, {"d": "EWNSNNSEEESNWWNNWSEENSSWNSWWEESSWNWESEWWWSEWNENNESNS", "contract": {"declarer": "E", "strain": "ST", "level": 6}, "dd": 11, "lt": "BBBBBBBBBBCBB"}, {"d": "WENNWNWSNSNEWEESSESEESNWWEEWNNSESSESWSNEWWSSNNWEWNWN", "contract": {"declarer": "E", "strain": "♥", "level": 6}, "dd": 11, "lt": "BBBBCCBBBBBBB"}, {"d": "EWENESNEWNWSENSWWNNSSNSNWEEEWSNNWESENEWEWSSSWSEWNNSW", "contract": {"declarer": "E", "strain": "ST", "level": 6}, "dd": 11, "lt": "CCBBBBCCCCCDD"}, {"d": "WESWNNNNSNNWSSEEWSWNWNEEWNNEWESSSESSESEWWENESNEWSWNW", "contract": {"declarer": "E", "strain": "♥", "level": 6}, "dd": 11, "lt": "BBBBBBBBBBBBB"}, {"d": "WNEEWESESSESNWNESSWNNSNWNEWNEWSESENNENSEWSWWNWNWEWSS", "contract": {"declarer": "E", "strain": "♠", "level": 6}, "dd": 11, "lt": "CCCCCCCBBBCCC"}, {"d": "WEESSWESWSNNEEENSWSWNSNWWSEENWNWNSENSNWSEENEWWNEWSNS", "contract": {"declarer": "E", "strain": "♠", "level": 6}, "dd": 11, "lt": "BBBBBBBBBBBBB"}, {"d": "WEWEWSENSSENEWSSSWNNWNENWNEESESNENNNNWWESESEWSWSSWNW", "contract": {"declarer": "E", "strain": "ST", "level": 6}, "dd": 11, "lt": "BBBBBBBBCCCCC"}, {"d": "NEENEESNSEWSWWWENNWSWEWSNWWWNWNNNESENNESEWESSSWESSSN", "contract": {"declarer": "E", "strain": "ST", "level": 6}, "dd": 11, "lt": "BBBBBBBCCCCCC"}, {"d": "ESSENEENWWSSWWEWWWNSSWSNSWEWENEESNWSNEWESSNENWNENNNS", "contract": {"declarer": "E", "strain": "♠", "level": 6}, "dd": 11, "lt": "CCBBBBBBBBBBB"}, {"d": "WNWENSNSSSENEESWENWENESWEEWNWSSNWSSSEWNWEWESWENNWNSN", "contract": {"declarer": "E", "strain": "♥", "level": 6}, "dd": 11, "lt": "BBBBDDCCCCCCC"}, {"d": "EENNWESNNWENNEESSSSSWSWWNNWSWSSWNSSWNEWWEEEWNENNESWE", "contract": {"declarer": "E", "strain": "♠", "level": 6}, "dd": 11, "lt": "BBBBBBBBBBBBB"}, {"d": "EEESESWSNSWNNESWSSNNNNWWEWWSWNNNSESWENWESWWENEWEESSN", "contract": {"declarer": "E", "strain": "ST", "level": 6}, "dd": 11, "lt": "BBBBBBBBBBCBB"}, {"d": "EWENEENWSWSNNWEWEEWWNNSNSEWSWNSSSSEEESWESNEWWNNNWSSN", "contract": {"declarer": "E", "strain": "ST", "level": 6}, "dd": 11, "lt": "BBBBBBBBBBCCC"}, {"d": "EWNSENNSNNSSWNEWNNWESSWSEEEWWSWSSNEEWWWWESNEENSWSNNE", "contract": {"declarer": "E", "strain": "ST", "level": 6}, "dd": 11, "lt": "BBBBBBBBBBCBB"}, {"d": "WEESSWSNWSSSNWNENNWWENSSNWEWNWENNENSEWWESWENESSWEESN", "contract": {"declarer": "E", "strain": "ST", "level": 6}, "dd": 11, "lt": "CCCCCCBBCDCCC"}, {"d": "WNNESNSWESESSWEWWEWEWENSNSWNENEWSNSWEEWEENWSNSSNSWNN", "contract": {"declarer": "E", "strain": "♥", "level": 6}, "dd": 11, "lt": "BBBBBBBBBBBBB"}, {"d": "EENSNWWNNWEWWWWWWNEESNESNNEEENWNWWSWSSNNSESSSESESNSE", "contract": {"declarer": "E", "strain": "♠", "level": 6}, "dd": 11, "lt": "BBBBBBBBBBBBB"}, {"d": "SWNWNSWNNSNSWWENEWEEWWSNNEWSESESNNSEWSSEEWENSWSNEENW", "contract": {"declarer": "E", "strain": "ST", "level": 6}, "dd": 11, "lt": "CCCCBCCCCCCBB"}, {"d": "ESEWESWWNESWSWWSEWENSNNENWEESENWNNSNSNESWWEWNWSNSENS", "contract": {"declarer": "E", "strain": "♠", "level": 6}, "dd": 11, "lt": "CBBBBBBBBBBBB"}, {"d": "WEENNSNEWWNENWEWEESWSSEWWESNEWSNSNNSNEWWWSWNENNSSESS", "contract": {"declarer": "E", "strain": "♥", "level": 6}, "dd": 11, "lt": "CCCCBBBBCCCCC"}, {"d": "EWWSNSNNENWNWWENWSNNSNWSWENEWEWSNESSSWSWSENEEESEENWS", "contract": {"declarer": "E", "strain": "ST", "level": 6}, "dd": 11, "lt": "BBBBBBBBBBDBB"}, {"d": "NEEWWSNENNWEEWWESNSEWSSNNNSEEWSNSNNNWEWEWWWNSSESSWSE", "contract": {"declarer": "E", "strain": "ST", "level": 6}, "dd": 11, "lt": "BBBBBBBBBBBBB"}, {"d": "EWENWSWESNWSNWWESNNENEWENESEESSSNSNEESSWWNEWSNNWWWSN", "contract": {"declarer": "E", "strain": "ST", "level": 6}, "dd": 11, "lt": "BBBBCBBBBBBBB"}, {"d": "SESWNNWNWSSNNEEWWSEWSNNSSWEEWSEENWSNNWSWWSNEEWESEENN", "contract": {"declarer": "E", "strain": "♥", "level": 6}, "dd": 11, "lt": "BCCCBBBBBBBBB"}, {"d": "WWWSSSWSNWSWNESEWEENSESWSNSENWWNNENSEENWEWSENEWNNSNE", "contract": {"declarer": "E", "strain": "ST", "level": 6}, "dd": 11, "lt": "BBBBBCBBBBBBB"}, {"d": "WEESNNWNEWWWNENNEWNWNSENWNENENESNWSWSEWWESESWSESSSSS", "contract": {"declarer": "E", "strain": "ST", "level": 6}, "dd": 11, "lt": "BBBBBCCCCCCCC"}, {"d": "EWSNEWWEWNENWWSWSWSNSNSNEEEWENNSNESENENWSWEWSSSSWNNE", "contract": {"declarer": "E", "strain": "♥", "level": 6}, "dd": 11, "lt": "BBBBBBBBBBBBB"}, {"d": "WNWENSNNWSSEEEWEESWSWWNSNNEWNWWEWSNNEENSEEEWSSSWSNNS", "contract": {"declarer": "E", "strain": "ST", "level": 6}, "dd": 11, "lt": "BBBBBBBBBBBBB"}, {"d": "SNNSWNNNSENESEWWSSWWENNESSWEEWNNESWSNENWWESNWEWSSWEE", "contract": {"declarer": "E", "strain": "♥", "level": 6}, "dd": 11, "lt": "BBBBDDDDDDDDD"}, {"d": "WENNSNSNSSSSWWENWNEEEESWENEWEWWNSWENSSNWNWSSENWESWNE", "contract": {"declarer": "E", "strain": "ST", "level": 6}, "dd": 11, "lt": "CCCCCCCCCCBBB"}, {"d": "WEWWENSSWSNEWSWWSENSEWENNSEWESNNWSNNESEWSWSEWNENESNN", "contract": {"declarer": "E", "strain": "♥", "level": 6}, "dd": 11, "lt": "BBBBBBBBBBBBB"}, {"d": "EWNEWNNNWSSNESNWWWNEWESNSEWEESENSSNSSENEEWWEWNWSSWSN", "contract": {"declarer": "E", "strain": "ST", "level": 6}, "dd": 11, "lt": "BBBBBCBBBBBBB"}, {"d": "EEWEEESSSSNNWWESWSWSWNWSNWEENWSNNNSEEEEWNNNWWWNENSSS", "contract": {"declarer": "E", "strain": "♥", "level": 6}, "dd": 11, "lt": "BBBBCCBBCCBBB"}, {"d": "NWENSSSESEWEWEWEWEWWWSNWESENENNESNSNSNSWNEWSWNWNESSN", "contract": {"declarer": "E", "strain": "ST", "level": 6}, "dd": 11, "lt": "BBBBBBBBBBBBB"}]}, {"key": "overtrick", "title": {"es": "Cosechar sobrebazas", "en": "Harvest overtricks"}, "role": "declare", "tip": {"es": "Hay 2+ sobrebazas: a Matchpoints cada bazita cuenta. No te relajes al cumplir.", "en": "There are 2+ overtricks: at Matchpoints every trick counts. Don't relax once it's safe."}, "deals": [{"d": "SNWSSSNNWNNWNNSEWSSSEEEWENNNWEEWWESNSSNESWWNEWSWEEEW", "contract": {"declarer": "S", "strain": "ST", "level": 3}, "dd": 11, "lt": "BBBCCBBBBBBBB"}, {"d": "SESNSSWSEWENSWSNEESWWNEWWENSENWESSNEWWENSENNEWNWSNWN", "contract": {"declarer": "S", "strain": "ST", "level": 3}, "dd": 12, "lt": "DDCDDDDDDDDDD"}, {"d": "NSNNESWNSENSWNWSEENWWEENWENWWSNENEWEEWNNSSWSWSEWSSSE", "contract": {"declarer": "S", "strain": "ST", "level": 3}, "dd": 13, "lt": "DDDDDDDDDDDDD"}, {"d": "SWWSSSEWSNEWWNNSNNWWEEEEEWNSNWNESNWNNEWESEENSNWSSSWE", "contract": {"declarer": "S", "strain": "ST", "level": 3}, "dd": 11, "lt": "BBCCCCCCCCCCC"}, {"d": "NNEEWNSSEWNWWSNENWEEWSEESWSEWSNSWWNWWSENSNSESNEWENNS", "contract": {"declarer": "S", "strain": "ST", "level": 3}, "dd": 11, "lt": "BBBBBBBCCCCCB"}, {"d": "WEWEWNNWNWNNENSWNNWSSWEWSESSNSENEEWNEESNSESWSNSSEWWE", "contract": {"declarer": "S", "strain": "♥", "level": 4}, "dd": 12, "lt": "CCCCCDDDDCCCC"}, {"d": "NNNENWNSSESWNSSWWEESEEWENNEENNESSWWWNSSNSSEWWESWEWWN", "contract": {"declarer": "S", "strain": "ST", "level": 3}, "dd": 11, "lt": "BBBBBBBBBBBBB"}, {"d": "SWSEWEESWNWEEWSSSWWNEWNSEWSNWNNENNNSENNNWNWSESWEESES", "contract": {"declarer": "S", "strain": "ST", "level": 3}, "dd": 12, "lt": "CCCCCDDDDCCCC"}, {"d": "WSNEESNNWWWEENSEEWNNWENSSEENNNWEWNNWEWWSNSSSWSWEESSS", "contract": {"declarer": "S", "strain": "ST", "level": 3}, "dd": 11, "lt": "BBBBBBBBBBBBB"}, {"d": "SWSEEEEEWNWSNWNSNWSWNSNEENSSNNSSEENSSWEWSNNWNEWEEWWW", "contract": {"declarer": "S", "strain": "ST", "level": 3}, "dd": 11, "lt": "BBBBBBBBBBBBB"}, {"d": "ESWEWWEWNSWSSNSSSESEESNWWSNNEWEEWENSWEWNNNWNSESWNNEN", "contract": {"declarer": "S", "strain": "♥", "level": 4}, "dd": 12, "lt": "CCCCCDDDDDDDD"}, {"d": "SWSSEEWNWEEWENWSSNWSWNSEWENEENNSEWSWNSSNNNNNSEESEWWW", "contract": {"declarer": "S", "strain": "ST", "level": 3}, "dd": 11, "lt": "CBBBCBBBBBBBB"}, {"d": "NNWEWSWNWSWEENSNSENSESEEWSEESWNESEENWNSSNNWWNWNWSSWE", "contract": {"declarer": "S", "strain": "ST", "level": 3}, "dd": 11, "lt": "BBBBBBBBBBBBB"}, {"d": "WSSESENNNEEEENNESNSWSWWNESWNNNWEWWWWESESSNWSNESSNEWW", "contract": {"declarer": "S", "strain": "ST", "level": 3}, "dd": 11, "lt": "BBBBBBBBBBBBB"}, {"d": "EWESSWNSSNWNNNSNWEENEESEWNNSEWNWWEWEWNWNSSSEWEESSWNS", "contract": {"declarer": "S", "strain": "ST", "level": 3}, "dd": 11, "lt": "BBBBBCBBBBBBB"}, {"d": "WNWNWEEEWWSNESSSNSNNEEWSEEESNWWEWESWWNNSSSWEEWSSNNNN", "contract": {"declarer": "S", "strain": "ST", "level": 3}, "dd": 11, "lt": "BBBBBBBBBBBBB"}, {"d": "NWSWENNSWWWWESSENESWWSNSNSENNEWENWENSEESSENNWSWSEWEN", "contract": {"declarer": "S", "strain": "ST", "level": 3}, "dd": 12, "lt": "CCCCCCCCCCCCC"}, {"d": "NESSSEWWESNWESNNWNESNEWWWWSESESEEWNESNWESNSNNWESNWNW", "contract": {"declarer": "S", "strain": "ST", "level": 3}, "dd": 11, "lt": "BBBCCCCCCCCCC"}, {"d": "SESNEWNSWSNNWENNSENNEWNSWNSSSWEENESWEWESNWEEWSWWESNW", "contract": {"declarer": "S", "strain": "ST", "level": 3}, "dd": 12, "lt": "CCCCCCCCCCCCC"}, {"d": "NNNENESNWNNNSSWWSEWEEEWNESESSSSWEWWENSWNNWNWSESWWEES", "contract": {"declarer": "S", "strain": "ST", "level": 3}, "dd": 12, "lt": "CCCDDCCCCCCCC"}, {"d": "SSWNSESSEWSEENWEWSNWEWESESNNNNSESNNEWEWNWNNEWESWWWSN", "contract": {"declarer": "S", "strain": "ST", "level": 3}, "dd": 13, "lt": "DDDDDDDDDDDDD"}, {"d": "SESSSSWSWEWEWSEEWWWESNNSWNNSWNENENNESNNSNENEWNSWWEWE", "contract": {"declarer": "S", "strain": "ST", "level": 3}, "dd": 12, "lt": "DDDDCCCCCCCCC"}, {"d": "NNWSWWESWWWNWSSESNNWSESSEESEEWWSEWESSWENNNNSEENNENWN", "contract": {"declarer": "S", "strain": "♥", "level": 4}, "dd": 13, "lt": "DDDDDDDDDDDDD"}, {"d": "SSEWWENWSWENSSSEEEWWNWEWNNWSSNNNSSWWWNENNWNSEESEEESN", "contract": {"declarer": "S", "strain": "ST", "level": 3}, "dd": 11, "lt": "BBBBBBBBBBBBB"}, {"d": "EWSEWWEEWSSSENNENNWWSSNNENSSWNWEENWWNSNSESNNWESWSWEE", "contract": {"declarer": "S", "strain": "♥", "level": 4}, "dd": 12, "lt": "CCCCCCDDDDCCC"}, {"d": "SNWNNEWEEEWSNSESSNNSSEWESWNWESNNEWSNWSWESSEEWEWNNNWW", "contract": {"declarer": "S", "strain": "ST", "level": 3}, "dd": 11, "lt": "CCCCCBBBBCCCC"}, {"d": "SNNSSESESENWENENWENSWWWNWSSNWSWEENEWSSNESNENWEEWNSWW", "contract": {"declarer": "S", "strain": "ST", "level": 3}, "dd": 11, "lt": "BBBBBBCCCBBBB"}, {"d": "SSSNNEWSWEESWNENWEWWEWSNENNEWSWEWSSNSWNSNSWNEESENEWN", "contract": {"declarer": "S", "strain": "ST", "level": 3}, "dd": 11, "lt": "BBBBBBBCBBBBB"}, {"d": "ESESESNWWEEEWSNWWSEWWSWNWESNESNWNWESSENWSSNESNWNNNNE", "contract": {"declarer": "S", "strain": "ST", "level": 3}, "dd": 11, "lt": "BBBBBBBBBBBBB"}, {"d": "SNSSWNESWWSEESNWSNWNWNESWENEESWENWNENWNNEEEWSSSWNSWE", "contract": {"declarer": "S", "strain": "♠", "level": 4}, "dd": 12, "lt": "CCCCCCCCCCCCC"}, {"d": "WSESWSESWWWWWNNNNENSSENWNNWNESSESEWWSESSNESEENWNWEEN", "contract": {"declarer": "S", "strain": "♥", "level": 4}, "dd": 12, "lt": "DDDDDDDCCDDCC"}, {"d": "WSSNESEWNEENEWSNEESWWSNNENNSWNWNEEWSSNWSESNSNWWEWWSE", "contract": {"declarer": "S", "strain": "ST", "level": 3}, "dd": 11, "lt": "BBBBBBBBBBBBB"}, {"d": "NNEESNSSNSWWNNSNSNWSWEESEENWWNENWWSWWSWESEENSEESNEWW", "contract": {"declarer": "S", "strain": "ST", "level": 3}, "dd": 11, "lt": "BBBBBBCCCCCBB"}, {"d": "SNNWWNNSEWSNNSSEESSENNEEWWESEEEWSWSENNSNNSWNESWEWWWW", "contract": {"declarer": "S", "strain": "♠", "level": 4}, "dd": 12, "lt": "DDDDDCCDDDDDD"}, {"d": "WNWNWESWNNENSNSNEEWSSENSWESNESWSEWSNWSENNSWNSWWEEEWE", "contract": {"declarer": "S", "strain": "ST", "level": 3}, "dd": 12, "lt": "CCCCCCCCCCCCC"}, {"d": "NWESWNWSENEWENSWNEEWWNNNSESWNESNEEESSEENSSSNWWSNWWWS", "contract": {"declarer": "S", "strain": "ST", "level": 3}, "dd": 13, "lt": "DDDDDDDDDDDDD"}, {"d": "WSNENNEWSNWWEWNEWNWSEESNEENSWSENENWNWWSSSSNEWEWSSSEN", "contract": {"declarer": "S", "strain": "ST", "level": 3}, "dd": 11, "lt": "BBBBBBBBBBBBB"}, {"d": "NSNSSESSWSNEENEWSWNEWWENSNWNEWENEWEWWSENNNNEESSWSSWW", "contract": {"declarer": "S", "strain": "ST", "level": 3}, "dd": 11, "lt": "CBBBBCCCCCCCC"}, {"d": "SNSSWWSEESWENSEWSWSWSEEEEWWSNSENWNWNNNENNWSNENEEWSWN", "contract": {"declarer": "S", "strain": "ST", "level": 3}, "dd": 11, "lt": "CCCBBBBCCCCCC"}, {"d": "NEEWWNESEWNWESNNSWSSEENNSSNNSNSWWEWWESSWNSSWEWWEENEN", "contract": {"declarer": "S", "strain": "♥", "level": 4}, "dd": 12, "lt": "CCCCCCCCCCCCC"}, {"d": "NENSNNSNNWSSNWNWWEEESWEWESSNSNESEWEWWNSSNSWESEWEENWW", "contract": {"declarer": "S", "strain": "♠", "level": 4}, "dd": 12, "lt": "DCDDDDDDDDDDD"}, {"d": "SNEWNSSSENEWENSSEWEEWSWENESESWEWNWNSSEWNENNSNNWSWWWN", "contract": {"declarer": "S", "strain": "ST", "level": 3}, "dd": 13, "lt": "DDDDDDDDDDDDD"}, {"d": "NNWSNESSENSEWSNWWSEEWWSWEENNNEWSENEENWESWWEWSSNWNSNS", "contract": {"declarer": "S", "strain": "♠", "level": 4}, "dd": 12, "lt": "CCCCCCCCCCCCC"}, {"d": "SNWSNNEWSSWESNSNNNWESNWWEENWNSESNNSEWEWSEWWENSSWEEEW", "contract": {"declarer": "S", "strain": "♥", "level": 4}, "dd": 13, "lt": "DDDDDDDDDDDDD"}, {"d": "WNWEWEWSESWWNESNWEWESWWSNESNESNSEWENEESNNNNSNNSSWSWE", "contract": {"declarer": "S", "strain": "ST", "level": 3}, "dd": 11, "lt": "BBBBBBBBBBBBB"}, {"d": "SNNWSEESNSENNNWEWNNSEWWEEESSNWWNENNWEEESWWNWSSSSWWSE", "contract": {"declarer": "S", "strain": "♠", "level": 4}, "dd": 12, "lt": "CCCCCCCCDDDDD"}, {"d": "NNWSWNWNNNWESSEWESNNEEWENESSEEWNNWESSSWSNSSWWEWENSWE", "contract": {"declarer": "S", "strain": "♠", "level": 4}, "dd": 13, "lt": "DDDDDDDDDDDDD"}, {"d": "NSEWNWWWNWSEWNWSSWSWNNEWSWESESEENSESWENNSSNSNEENNEWE", "contract": {"declarer": "S", "strain": "ST", "level": 3}, "dd": 11, "lt": "CBBBCCCCCCCCC"}, {"d": "SSWEWENNSSWWENSNWNNEWENNSSNEWNSNEEWWEEWESSWEESNWSWSN", "contract": {"declarer": "S", "strain": "ST", "level": 3}, "dd": 11, "lt": "CCCCCCBBBBCCC"}, {"d": "NNSNSNNEWEESESENNNWWWEEWNSSEWWSWWSSSEESNNSWEENNSEWWW", "contract": {"declarer": "S", "strain": "♠", "level": 4}, "dd": 13, "lt": "DDDDDDDDDDDDD"}]}]};
const DEAL_ORDER = (function(){ var a=[]; for (var si=0; si<SUITS.length; si++){ for (var ri=0; ri<RANKS.length; ri++){ a.push({s:SUITS[si], r:RANKS[ri]}); } } return a; })();
function decodeThemeDeal(str){ var h={N:[],E:[],S:[],W:[]}; for (var i=0;i<52;i++){ h[str[i]].push(DEAL_ORDER[i]); } return h; }


// ---------- Thematic practice decks (double-dummy verified) ----------
function ThemePractice({ lang, onPlay }) {
  const [theme, setTheme] = useState(null);
  const L = T[lang];
  const playRandom = (t) => { const ri = Math.floor(Math.random() * t.deals.length); const d = t.deals[ri]; onPlay({ seed: 100 + ri, hands: decodeThemeDeal(d.d), contract: d.contract, lt: d.lt, d: d.d }, `${t.title[lang]} ${ri + 1}`); };
  const playRandomAny = () => { const t = THEME_DECKS.themes[Math.floor(Math.random() * THEME_DECKS.themes.length)]; playRandom(t); };
  if (theme) {
    const t = theme;
    return (
      <div className="flex flex-col gap-3">
        <button onClick={() => setTheme(null)} style={{ color: C.brass }} className="text-sm flex items-center gap-1 self-start"><ChevronLeft size={16} />{L.back}</button>
        <SectionTitle icon={Layers}>{t.title[lang]}</SectionTitle>
        <div style={{ background: C.feltDark, border: `1px solid ${C.brassDim}`, borderRadius: 12 }} className="p-3">
          <div className="flex items-center gap-2 mb-1">
            <Pill bg={t.role === "defend" ? C.red : C.brassDim} color={C.ivory}>{t.role === "defend" ? L.themeDefend : L.themeDeclare}</Pill>
          </div>
          <p style={{ color: C.ivory }} className="text-sm">{t.tip[lang]}</p>
        </div>
        <button onClick={() => playRandom(t)} style={{ background: C.brass, color: C.ink }} className="px-3 py-2 rounded text-sm font-bold flex items-center justify-center gap-2"><Shuffle size={15} />{L.themeRandom} · {t.deals.length}</button>
        <div className="flex flex-col gap-2">
          {t.deals.map((d, i) => {
            const c = d.contract;
            const label = `${c.level}${bidLabel(c.strain === "ST" ? "NT" : c.strain, lang)} · ${L[c.declarer] || c.declarer}`;
            return (
              <div key={i} style={{ background: C.feltLite, border: `1px solid ${C.brassDim}`, borderRadius: 10 }} className="p-3 flex items-center justify-between gap-2">
                <div>
                  <div style={{ color: C.ivory }} className="text-sm font-semibold">{L.themeDeal} {i + 1} · {label}</div>
                  <div style={{ color: C.soft }} className="text-xs">{L.themeDD}: {d.dd} {L.tricksWord}</div>
                </div>
                <button onClick={() => onPlay({ seed: 100 + i, hands: decodeThemeDeal(d.d), contract: d.contract, lt: d.lt, d: d.d }, `${t.title[lang]} ${i + 1}`)} style={{ background: C.brass, color: C.ink }} className="px-3 py-1.5 rounded text-sm font-bold flex items-center gap-1"><Play size={14} />{L.themePlay}</button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <SectionTitle icon={Layers}>{L.themesTitle}</SectionTitle>
      <p style={{ color: C.soft }} className="text-xs -mt-2">{L.themesIntro}</p>
      <button onClick={playRandomAny} style={{ background: C.brass, color: C.ink }} className="px-3 py-2 rounded text-sm font-bold flex items-center justify-center gap-2"><Shuffle size={15} />{L.themeRandomAny}</button>
      <div className="flex flex-col gap-2">
        {THEME_DECKS.themes.map((t) => (
          <button key={t.key} onClick={() => setTheme(t)} style={{ background: `linear-gradient(135deg, ${C.feltLite}, ${C.feltDark})`, border: `1px solid ${C.brassDim}`, borderRadius: 12 }} className="p-4 text-left flex items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span style={{ color: C.ivory }} className="font-semibold">{t.title[lang]}</span>
                <Pill bg={t.role === "defend" ? C.red : C.brassDim} color={C.ivory}>{t.role === "defend" ? L.themeDefend : L.themeDeclare}</Pill>
              </div>
              <div style={{ color: C.soft }} className="text-xs mt-1">{t.tip[lang]}</div>
            </div>
            <div className="flex flex-col items-center" style={{ color: C.brass }}>
              <span className="text-lg font-bold">{t.deals.length}</span>
              <span className="text-[10px] uppercase">{L.themeDeal}s</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------- Defensive signals practice ----------
function suitRankSym(s) { return 4 - SUITS.indexOf(s); } // ♠=4 ... ♣=1
function sampleDistinct(pool, n, rng) {
  const a = pool.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a.slice(0, n);
}
const HONORS_SET = new Set(["A", "K", "Q", "J", "T"]);
function makeSignal(seed) {
  const rng = mulberry32((seed * 2654435761) >>> 0);
  const pick = arr => arr[Math.floor(rng() * arr.length)];
  const suit = pick(SUITS);
  const kind = ["attitude", "count", "preference"][seed % 3];
  const sortDesc = ranks => ranks.slice().sort((a, b) => RVAL[b] - RVAL[a]);
  if (kind === "attitude") {
    const encourage = rng() > 0.5;
    let ranks;
    if (encourage) { const honor = pick(["K", "Q"]); ranks = [honor, ...sampleDistinct(["8", "7", "6", "5", "4", "3", "2"], 2, rng)]; }
    else { ranks = sampleDistinct(["9", "8", "6", "5", "4", "3", "2"], 3, rng); }
    ranks = sortDesc(ranks);
    const cards = ranks.map(r => ({ s: suit, r }));
    const spots = cards.filter(c => !HONORS_SET.has(c.r));
    const correct = encourage ? spots[0] : spots[spots.length - 1];
    return {
      kind, suit, cards, correct,
      prompt: { es: `Tu compañero ataca con el As de ${suit} (pide ACTITUD). ¿Qué carta juegas?`, en: `Partner leads the Ace of ${suit} (asking ATTITUDE). Which card do you play?` },
      explain: encourage
        ? { es: "Animas con tu spot más ALTO y guardas el honor: «sigue con el palo, tengo ayuda».", en: "Encourage with your HIGHEST spot, keeping the honour: \"continue the suit, I have help\"." }
        : { es: "Desanimas con tu spot más BAJO: no tienes ayuda, que tu compañero cambie.", en: "Discourage with your LOWEST spot: no help here, partner should switch." },
      tagEs: encourage ? "Ánimo" : "Desánimo", tagEn: encourage ? "Encourage" : "Discourage",
    };
  }
  if (kind === "count") {
    const len = pick([2, 3, 4]);
    const cards = sortDesc(sampleDistinct(["9", "8", "7", "6", "5", "4", "3", "2"], len, rng)).map(r => ({ s: suit, r }));
    const even = len % 2 === 0;
    const correct = even ? cards[0] : cards[cards.length - 1];
    return {
      kind, suit, cards, correct,
      prompt: { es: `El declarante ataca ${suit} desde el muerto. Das CUENTA con ${len} cartas. ¿Por cuál empiezas?`, en: `Declarer leads ${suit} from dummy. Give COUNT with ${len} cards. Which do you start with?` },
      explain: even
        ? { es: `Con número PAR (${len}) empiezas alto-bajo: la carta ALTA primero.`, en: `With an EVEN count (${len}) you go high-low: the HIGH card first.` }
        : { es: `Con número IMPAR (${len}) empiezas por la carta BAJA.`, en: `With an ODD count (${len}) you start with the LOW card.` },
      tagEs: even ? "Par" : "Impar", tagEn: even ? "Even" : "Odd",
    };
  }
  // preference (Lavinthal)
  const others = SUITS.filter(s => s !== suit);
  const hi = others.reduce((a, b) => suitRankSym(a) > suitRankSym(b) ? a : b);
  const lo = others.reduce((a, b) => suitRankSym(a) < suitRankSym(b) ? a : b);
  const wantHigh = rng() > 0.5;
  const cards = sortDesc(sampleDistinct(["9", "7", "5", "3", "2"], 2, rng)).map(r => ({ s: suit, r }));
  const correct = wantHigh ? cards[0] : cards[cards.length - 1];
  return {
    kind, suit, cards, correct,
    prompt: { es: `PREFERENCIA: con tu carta de ${suit} indicas a qué palo lateral volver (${hi} o ${lo}). Quieres que vuelva por ${wantHigh ? hi : lo}. ¿Qué carta juegas?`, en: `PREFERENCE: your ${suit} card tells partner which side suit to return (${hi} or ${lo}). You want ${wantHigh ? hi : lo}. Which card?` },
    explain: { es: `Carta ALTA pide el palo más alto (${hi}); carta BAJA, el más bajo (${lo}). Es la señal de preferencia (Lavinthal).`, en: `A HIGH card asks for the higher suit (${hi}); a LOW card, the lower (${lo}). This is suit-preference (Lavinthal).` },
    tagEs: wantHigh ? `Pide ${hi}` : `Pide ${lo}`, tagEn: wantHigh ? `Asks ${hi}` : `Asks ${lo}`,
  };
}

function SignalChip({ card, onClick, state }) {
  const red = SUIT_RED.has(card.s);
  const bg = state === "correct" ? "#1f3d2b" : state === "wrong" ? "#4a1f24" : C.ivory;
  const fg = state ? C.ivory : (red ? "#c0392b" : "#1a1a1a");
  const bd = state === "correct" ? C.win : state === "wrong" ? C.red : C.brassDim;
  return (
    <button onClick={onClick} disabled={!onClick} style={{ background: bg, color: fg, border: `2px solid ${bd}`, borderRadius: 8, minWidth: 44 }} className="px-2 py-2 font-bold text-lg flex items-center justify-center gap-0.5">
      <span>{card.r}</span><span>{card.s}</span>
    </button>
  );
}

function SignalsPractice({ lang }) {
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e9) >>> 0);
  const sc = useMemo(() => makeSignal(seed), [seed]);
  const [chosen, setChosen] = useState(null);
  const [count, setCount] = useState(0);
  const [right, setRight] = useState(0);
  const isCorrect = chosen && chosen.r === sc.correct.r && chosen.s === sc.correct.s;
  const choose = (c) => { if (chosen) return; setChosen(c); setCount(n => n + 1); if (c.r === sc.correct.r) setRight(n => n + 1); };
  const next = () => { setChosen(null); setSeed((seed * 1103515245 + 12345) >>> 0); };
  const kindLabel = { attitude: { es: "Actitud", en: "Attitude" }, count: { es: "Cuenta", en: "Count" }, preference: { es: "Preferencia", en: "Suit preference" } }[sc.kind][lang];
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <SectionTitle icon={Eye}>{lang === "es" ? "Práctica de señales" : "Signals practice"}</SectionTitle>
        <Pill bg={C.line2}>{right}/{count}</Pill>
      </div>
      <p style={{ color: C.soft }} className="text-xs -mt-2">{lang === "es" ? "Señales estándar: actitud (alto = ánimo), cuenta (par = alto-bajo), preferencia (alto = palo mayor)." : "Standard signals: attitude (high = encourage), count (even = high-low), preference (high = higher suit)."}</p>
      <div style={{ background: `linear-gradient(135deg, ${C.feltLite}, ${C.feltDark})`, border: `1px solid ${C.brassDim}`, borderRadius: 14 }} className="p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Pill bg={C.brassDim} color={C.ivory}>{kindLabel}</Pill>
        </div>
        <p style={{ color: C.ivory }} className="text-sm">{sc.prompt[lang]}</p>
        <div>
          <p style={{ color: C.soft }} className="text-xs mb-1">{lang === "es" ? "Tu mano en el palo:" : "Your holding in the suit:"}</p>
          <div className="flex gap-1.5 flex-wrap">
            {sc.cards.map((c, i) => {
              let state = null;
              if (chosen) { if (c.r === sc.correct.r) state = "correct"; else if (c.r === chosen.r) state = "wrong"; }
              return <SignalChip key={i} card={c} onClick={chosen ? null : () => choose(c)} state={state} />;
            })}
          </div>
        </div>
        {chosen && (
          <div style={{ background: isCorrect ? "rgba(31,61,43,0.5)" : "rgba(74,31,36,0.5)", border: `1px solid ${isCorrect ? C.win : C.red}`, borderRadius: 10 }} className="p-3">
            <p style={{ color: isCorrect ? C.win : C.red }} className="text-sm font-bold mb-1">{isCorrect ? (lang === "es" ? "¡Correcto!" : "Correct!") : (lang === "es" ? "No es la mejor" : "Not the best")} · {lang === "es" ? sc.tagEs : sc.tagEn}</p>
            <p style={{ color: C.ivory }} className="text-sm">{sc.explain[lang]}</p>
          </div>
        )}
        <div className="flex justify-end">
          <button onClick={next} style={{ background: C.brass, color: C.ink }} className="px-4 py-1.5 rounded text-sm font-semibold">{lang === "es" ? "Siguiente" : "Next"}</button>
        </div>
      </div>
    </div>
  );
}

function LevelDetail({ levelId, lang, user, onBack, marks, onOpenDeal, initialTab }) {
  const level = LEVELS.find(l => l.id === levelId);
  const [tab, setTab] = useState(initialTab || "lessons");
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
    { k: "test", label: L.levelTest, icon: Award },
    ...(levelId === 5 ? [{ k: "signals", label: lang === "es" ? "Señales" : "Signals", icon: Eye }] : []),
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
        {tab === "signals" && <SignalsPractice lang={lang} />}
        {tab === "test" && <LevelTest level={level} lang={lang} best={prog.testScore || 0} onDone={(frac) => marks.test(levelId, frac)} />}
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
    { k: "themes", label: L.themesNav, icon: Layers },
    { k: "review", label: L.reviewNav, icon: Brain, badge: dueCount(user && user.reviews) },
  ];
  return (
    <div style={{ background: C.feltDark, borderBottom: `1px solid ${C.line}` }} className="sticky top-0 z-10">
      <div className={`${UI.maxW} mx-auto px-3 pt-3 pb-2`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles size={18} style={{ color: C.brass }} />
            <span style={{ color: C.ivory }} className="font-serif text-lg">{L.app}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => onNav("stats")} style={{ color: view === "stats" ? C.ink : C.brass, background: view === "stats" ? C.brass : "transparent", border: `1px solid ${C.brassDim}`, borderRadius: 8 }} className="px-2 py-1 text-xs font-semibold flex items-center" title={L.statsTitle}><BarChart3 size={13} /></button>
            <button onClick={() => onNav("help")} style={{ color: view === "help" ? C.ink : C.brass, background: view === "help" ? C.brass : "transparent", border: `1px solid ${C.brassDim}`, borderRadius: 8 }} className="px-2 py-1 text-xs font-semibold flex items-center" title={L.helpTitle}><HelpCircle size={13} /></button>
            <button onClick={() => onNav("settings")} style={{ color: view === "settings" ? C.ink : C.brass, background: view === "settings" ? C.brass : "transparent", border: `1px solid ${C.brassDim}`, borderRadius: 8 }} className="px-2 py-1 text-xs font-semibold flex items-center" title={L.settingsTitle}><Settings size={13} /></button>
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
                {it.badge > 0 ? <span style={{ background: C.red, color: C.ivory, borderRadius: 999, minWidth: 16, height: 16 }} className="text-[10px] font-bold flex items-center justify-center px-1">{it.badge}</span> : null}
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
// ---------- Learning tips + Settings (theme picker) ----------
const TIPS = [
  { es: "Antes de jugar a la primera carta, cuenta ganadores (en ST) o perdedoras (en palo).", en: "Before playing to trick one, count winners (in NT) or losers (in a suit)." },
  { es: "Saca triunfos pronto… salvo que necesites fallar perdedoras en el muerto primero.", en: "Draw trumps early… unless you must ruff losers in dummy first." },
  { es: "En ST, retén el as del palo de ataque (holdup) para cortar la comunicación rival.", en: "In NT, hold up the ace of the attacked suit to cut the opponents' communication." },
  { es: "Cuenta la mano: forma primero, puntos después. La mayoría de impasses se deciden contando.", en: "Count the hand: shape first, points later. Most finesses are decided by counting." },
  { es: "Como defensor, da actitud (alto = ánimo) y cuenta (par = alto-bajo) con intención.", en: "As a defender, give attitude (high = encourage) and count (even = high-low) with intent." },
  { es: "Cima de secuencia para salir: de KQJ sale el Rey; de QJT, la Dama.", en: "Lead top of a sequence: from KQJ lead the King; from QJT, the Queen." },
  { es: "No subsalgas de un As contra contrato de palo: sale el As o cambia de palo.", en: "Don't underlead an Ace against a suit contract: cash it or switch suits." },
  { es: "Para el slam: muestra controles (cue-bids) antes de lanzar Blackwood.", en: "For slam: show controls (cue-bids) before launching Blackwood." },
  { es: "No pujes dos veces los mismos puntos: si ya describiste tu mano, no la repitas.", en: "Don't bid the same values twice: once you've described your hand, don't repeat it." },
  { es: "A Matchpoints importan las sobrebazas; a IMPs, cumplir el contrato.", en: "At Matchpoints overtricks matter; at IMPs, making the contract does." },
  { es: "Cuenta tus entradas antes de establecer un palo largo, o te quedarás sin acceso.", en: "Count your entries before establishing a long suit, or you'll be locked out." },
  { es: "Segunda mano baja, tercera mano alta… pero piensa antes de aplicar la regla.", en: "Second hand low, third hand high… but think before applying the rule." },
  { es: "Con fit de 9 cartas y dama ausente, suele ser mejor jugar a la caída que al impasse.", en: "With a 9-card fit missing the queen, playing for the drop often beats the finesse." },
  { es: "Escucha la subasta: las voces rivales localizan honores y guían tu plan.", en: "Listen to the auction: opponents' calls locate honours and guide your plan." },
  { es: "Planifica en 3 pasos: cuenta, plan, entradas. Piensa primero, juega después.", en: "Plan in 3 steps: count, plan, entries. Think first, play second." },
];
function TipBanner({ lang }) {
  const [i, setI] = useState(() => Math.floor(Math.random() * TIPS.length));
  const t = TIPS[i];
  return (
    <div style={{ background: C.feltLite, border: `1px solid ${C.brassDim}`, borderRadius: 12 }} className="p-3 mb-4 flex items-start gap-2">
      <Lightbulb size={18} style={{ color: C.brass, flexShrink: 0, marginTop: 1 }} />
      <p style={{ color: C.ivory }} className="text-sm flex-1">{t[lang]}</p>
      <button onClick={() => setI(x => (x + 1) % TIPS.length)} style={{ color: C.brass }} className="text-xs font-semibold flex-shrink-0">↻</button>
    </div>
  );
}
// ---------- Glossary, onboarding tour, help ----------
const GLOSSARY = [
  { t: { es: "PH (Puntos de honor)", en: "HCP (High-card points)" }, d: { es: "Valoración de la mano: A=4, K=3, Q=2, J=1.", en: "Hand valuation: A=4, K=3, Q=2, J=1." } },
  { t: { es: "Puntos de distribución", en: "Distribution points" }, d: { es: "Puntos extra por cortos: vacío=3, singleton=2, doubleton=1 (con ajuste).", en: "Extra points for shortness: void=3, singleton=2, doubleton=1 (with a fit)." } },
  { t: { es: "Apertura", en: "Opening bid" }, d: { es: "La primera puja no-paso de la subasta.", en: "The first non-pass call of the auction." } },
  { t: { es: "Respuesta", en: "Response" }, d: { es: "Puja del compañero del abridor.", en: "A bid by the opener's partner." } },
  { t: { es: "Rebid", en: "Rebid" }, d: { es: "Segunda puja del abridor, que describe fuerza y forma.", en: "Opener's second bid, refining strength and shape." } },
  { t: { es: "Intervención (overcall)", en: "Overcall" }, d: { es: "Pujar un palo tras la apertura rival.", en: "Bidding a suit after an opponent's opening." } },
  { t: { es: "Contra de apoyo (takeout)", en: "Takeout double" }, d: { es: "Contra que pide al compañero elegir palo, no penaliza.", en: "A double asking partner to pick a suit, not for penalties." } },
  { t: { es: "Contra de castigo", en: "Penalty double" }, d: { es: "Contra para aumentar la penalización de un contrato rival.", en: "A double to increase the penalty on the opponents' contract." } },
  { t: { es: "Barrage (preempt)", en: "Preempt" }, d: { es: "Apertura alta con palo largo y mano débil para estorbar.", en: "A high, weak, long-suit opening to obstruct opponents." } },
  { t: { es: "Sin Triunfo (ST/NT)", en: "No-Trump (NT)" }, d: { es: "Contrato sin palo de triunfo; gana la carta más alta del palo de salida.", en: "A contract with no trump suit; highest card of the led suit wins." } },
  { t: { es: "Mayores / Menores", en: "Majors / Minors" }, d: { es: "Mayores ♠♥ (valen más); menores ♦♣.", en: "Majors ♠♥ (score more); minors ♦♣." } },
  { t: { es: "Manga", en: "Game" }, d: { es: "3ST, 4♥/♠ o 5♦/♣: contratos que dan bonificación de manga.", en: "3NT, 4♥/♠ or 5♦/♣: contracts that earn the game bonus." } },
  { t: { es: "Slam", en: "Slam" }, d: { es: "Pequeño slam = 12 bazas (6X); gran slam = 13 (7X).", en: "Small slam = 12 tricks (6X); grand slam = 13 (7X)." } },
  { t: { es: "Parcial", en: "Part-score" }, d: { es: "Contrato por debajo de manga.", en: "A contract below game level." } },
  { t: { es: "Vulnerabilidad", en: "Vulnerability" }, d: { es: "Estado que aumenta primas y penalizaciones.", en: "A state that raises bonuses and penalties." } },
  { t: { es: "Baza", en: "Trick" }, d: { es: "Cuatro cartas, una por jugador; la gana la más alta (o triunfo).", en: "Four cards, one per player; won by the highest (or a trump)." } },
  { t: { es: "Triunfo", en: "Trump" }, d: { es: "Palo del contrato; supera a los demás palos.", en: "The contract's suit; beats other suits." } },
  { t: { es: "Impasse (finesse)", en: "Finesse" }, d: { es: "Jugada para ganar una baza con una carta que no es la más alta, apostando a la posición de un honor rival.", en: "A play to win a trick with a non-top card, betting on the location of a missing honor." } },
  { t: { es: "Fallar (ruff)", en: "Ruff" }, d: { es: "Jugar un triunfo sobre un palo del que vas corto.", en: "Playing a trump on a suit you're void in." } },
  { t: { es: "Descarte", en: "Discard / sluff" }, d: { es: "Tirar una carta de otro palo cuando no puedes asistir.", en: "Throwing a card of another suit when you can't follow." } },
  { t: { es: "Muerto", en: "Dummy" }, d: { es: "La mano del compañero del declarante, expuesta sobre la mesa.", en: "Declarer's partner's hand, laid face-up on the table." } },
  { t: { es: "Declarante", en: "Declarer" }, d: { es: "Quien juega el contrato (su bando ganó la subasta).", en: "The player who plays the contract for the winning side." } },
  { t: { es: "Defensor", en: "Defender" }, d: { es: "Cada rival del declarante.", en: "Either opponent of the declarer." } },
  { t: { es: "Salida", en: "Opening lead" }, d: { es: "Primera carta de la baza 1, la juega el defensor a la izquierda del declarante.", en: "The first card of trick 1, played by declarer's left-hand opponent." } },
  { t: { es: "Señal de actitud", en: "Attitude signal" }, d: { es: "Carta alta = me gusta el palo; baja = no.", en: "High card = I like the suit; low = I don't." } },
  { t: { es: "Señal de cuenta", en: "Count signal" }, d: { es: "Alta-baja = par; baja-alta = impar.", en: "High-low = even; low-high = odd." } },
  { t: { es: "Preferencia de palo", en: "Suit preference" }, d: { es: "Una carta alta/baja indica en qué otro palo quieres la vuelta.", en: "A high/low card shows which other suit you want returned." } },
  { t: { es: "Stayman", en: "Stayman" }, d: { es: "2♣ sobre 1ST preguntando por un mayor de 4 cartas.", en: "2♣ over 1NT asking for a 4-card major." } },
  { t: { es: "Transferencia Jacoby", en: "Jacoby transfer" }, d: { es: "2♦/2♥ sobre 1ST obligando al abridor a declarar el mayor de arriba.", en: "2♦/2♥ over 1NT forcing opener to bid the next major." } },
  { t: { es: "Blackwood", en: "Blackwood" }, d: { es: "4ST preguntando por ases (RKCB 1430 cuenta también el rey de triunfo).", en: "4NT asking for aces (RKCB 1430 also counts the trump king)." } },
  { t: { es: "Cue-bid (control)", en: "Cue bid (control)" }, d: { es: "Puja que muestra un control (as/rey o corto) camino al slam.", en: "A bid showing a control (ace/king or shortness) en route to slam." } },
  { t: { es: "Vacío / Singleton / Doubleton", en: "Void / Singleton / Doubleton" }, d: { es: "0, 1 o 2 cartas en un palo.", en: "0, 1 or 2 cards in a suit." } },
  { t: { es: "Holdup (aguantar)", en: "Holdup" }, d: { es: "Demorar el gane de un palo para cortar la comunicación rival.", en: "Delaying winning a suit to cut the opponents' communication." } },
  { t: { es: "Endplay (jugada de fin)", en: "Endplay" }, d: { es: "Forzar a un rival a ganar y luego jugar a tu favor.", en: "Forcing an opponent to win and then lead to your advantage." } },
  { t: { es: "Squeeze (presión)", en: "Squeeze" }, d: { es: "Forzar a un rival a descartar una carta valiosa.", en: "Forcing an opponent to discard a vital card." } },
  { t: { es: "Entrada", en: "Entry" }, d: { es: "Carta que permite pasar a una mano concreta.", en: "A card that lets you reach a particular hand." } },
  { t: { es: "Tempo", en: "Tempo" }, d: { es: "El control del ritmo: quién está obligado a jugar primero.", en: "Control of timing: who is forced to lead first." } },
  { t: { es: "Duck (ceder)", en: "Duck" }, d: { es: "Jugar bajo a propósito cediendo la baza.", en: "Deliberately playing low to concede a trick." } },
  { t: { es: "Desbloquear", en: "Unblock" }, d: { es: "Tirar un honor para no obstruir tu propio palo largo.", en: "Playing an honor to avoid blocking your own long suit." } },
  { t: { es: "Establecer un palo", en: "Establishing a suit" }, d: { es: "Sacar las cartas rivales hasta que el resto de tu palo gana.", en: "Removing opponents' cards until your remaining suit wins." } },
  { t: { es: "Stopper (parada)", en: "Stopper" }, d: { es: "Carta que detiene un palo rival en ST.", en: "A card that stops an opponents' suit in NT." } },
  { t: { es: "Fit (ajuste)", en: "Fit" }, d: { es: "8+ cartas combinadas en un palo entre los dos compañeros.", en: "8+ combined cards in a suit between partners." } },
  { t: { es: "Sacrificio", en: "Sacrifice" }, d: { es: "Pujar un contrato que caerá, pero menos costoso que dejar el rival.", en: "Bidding a contract you'll go down in, but cheaper than letting them play." } },
  { t: { es: "Bajada / Sobrebaza", en: "Undertrick / Overtrick" }, d: { es: "Baza de menos / de más respecto al contrato.", en: "A trick short / extra versus the contract." } },
  { t: { es: "Par", en: "Par" }, d: { es: "Resultado óptimo si ambos bandos juegan perfecto.", en: "The optimal result if both sides play perfectly." } },
  { t: { es: "Doble muerto", en: "Double-dummy" }, d: { es: "Análisis con las cuatro manos a la vista: el juego perfecto teórico.", en: "Analysis with all four hands visible: theoretically perfect play." } },
  { t: { es: "Regla del 11", en: "Rule of 11" }, d: { es: "Con salida de cuarta mejor: 11 menos el valor = cartas superiores fuera de esa mano.", en: "With a fourth-best lead: 11 minus the card = higher cards held elsewhere." } },
  { t: { es: "Cuarta mejor", en: "Fourth-best" }, d: { es: "Salir con la 4ª carta más alta de tu palo largo.", en: "Leading the 4th-highest card of your long suit." } },
  { t: { es: "Bayoneta (LTC)", en: "Losing Trick Count" }, d: { es: "Valoración con ajuste contando perdedoras en vez de puntos.", en: "A fit-based valuation counting losers instead of points." } },
  { t: { es: "Negative double", en: "Negative double" }, d: { es: "Contra del respondedor que muestra los palos no pujados.", en: "Responder's double showing the unbid suits." } },
  { t: { es: "Splinter", en: "Splinter" }, d: { es: "Salto a un corto que muestra ajuste y fuerza para slam.", en: "A jump in a short suit showing a fit and slam interest." } },
  { t: { es: "Jacoby 2ST", en: "Jacoby 2NT" }, d: { es: "Respuesta de 2ST con ajuste de mayor y fuerza de manga+.", en: "A 2NT response showing a major fit and game-plus values." } },
  { t: { es: "2-sobre-1 (2/1)", en: "Two-over-one" }, d: { es: "Sistema donde la respuesta de 2 en nivel fuerza a manga.", en: "A system where a 2-level response is game-forcing." } },
  { t: { es: "Michaels / 2ST inusual", en: "Michaels / Unusual NT" }, d: { es: "Cue-bid o 2ST que muestran dos palos a la vez.", en: "A cue-bid or 2NT showing two suits at once." } },
];

function Glossary({ lang }) {
  const L = T[lang];
  const [q, setQ] = useState("");
  const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const list = GLOSSARY.filter(g => { if (!q) return true; const k = norm(q); return norm(g.t[lang]).includes(k) || norm(g.d[lang]).includes(k) || norm(g.t[lang === "es" ? "en" : "es"]).includes(k); })
    .sort((a, b) => a.t[lang].localeCompare(b.t[lang]));
  return (
    <div className="flex flex-col gap-3">
      <SectionTitle icon={BookOpen}>{L.glossary}</SectionTitle>
      <input value={q} onChange={e => setQ(e.target.value)} placeholder={L.glossarySearch}
        style={{ background: C.feltDark, border: `1px solid ${C.line}`, color: C.ivory, borderRadius: 10 }} className="px-3 py-2 text-sm outline-none" />
      <p style={{ color: C.soft }} className="text-xs">{list.length} {L.glossaryTerms}</p>
      <div className="flex flex-col gap-2">
        {list.map((g, i) => (
          <div key={i} style={{ background: C.feltDark, border: `1px solid ${C.line}`, borderRadius: 10 }} className="p-3">
            <div style={{ color: C.brass }} className="text-sm font-bold">{g.t[lang]}</div>
            <div style={{ color: C.ivory }} className="text-sm mt-0.5">{g.d[lang]}</div>
          </div>
        ))}
        {list.length === 0 && <p style={{ color: C.soft }} className="text-sm text-center py-4">{L.glossaryNone}</p>}
      </div>
    </div>
  );
}

function TourOverlay({ lang, onClose }) {
  const L = T[lang];
  const steps = L.tourSteps;
  const [i, setI] = useState(0);
  const step = steps[i];
  const last = i === steps.length - 1;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 50 }} className="flex items-center justify-center p-4">
      <div style={{ background: C.feltDark, border: `1px solid ${C.brass}`, borderRadius: 16, maxWidth: 360 }} className="w-full p-5 flex flex-col gap-3">
        <div className="flex items-center gap-2"><Sparkles size={20} style={{ color: C.brass }} /><span style={{ color: C.ivory }} className="font-serif text-lg">{step.t}</span></div>
        <p style={{ color: C.soft }} className="text-sm leading-relaxed">{step.d}</p>
        <div className="flex items-center justify-center gap-1.5 my-1">
          {steps.map((_, n) => <span key={n} style={{ width: n === i ? 18 : 7, height: 7, borderRadius: 999, background: n === i ? C.brass : C.line }} />)}
        </div>
        <div className="flex items-center justify-between gap-2">
          <button onClick={onClose} style={{ color: C.soft }} className="text-sm px-2 py-2">{L.tourSkip}</button>
          <div className="flex gap-2">
            {i > 0 && <button onClick={() => setI(i - 1)} style={{ background: C.feltLite, color: C.ivory, border: `1px solid ${C.line}` }} className="px-3 py-2 rounded text-sm">{L.back}</button>}
            <button onClick={() => last ? onClose() : setI(i + 1)} style={{ background: C.brass, color: C.ink }} className="px-4 py-2 rounded text-sm font-bold flex items-center gap-1">{last ? L.tourStart : L.next}{!last && <ChevronRight size={16} />}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function HelpView({ lang, onTour }) {
  const L = T[lang];
  return (
    <div className="flex flex-col gap-4">
      <button onClick={onTour} style={{ background: `linear-gradient(135deg, ${C.brass}, ${C.brassDim})`, color: C.ink, borderRadius: 14 }} className="p-4 flex items-center gap-3 text-left">
        <Lightbulb size={22} />
        <div className="flex-1"><div className="text-sm font-bold">{L.tourReplay}</div><div className="text-[11px] opacity-70">{L.tourReplaySub}</div></div>
        <ChevronRight size={20} />
      </button>
      <Glossary lang={lang} />
    </div>
  );
}

// ---------- Stats view (inline SVG charts, dependency-free) ----------
function MiniLine({ data, color, max, unit }) {
  max = max || 100; const h = 64, w = 280;
  if (!data || data.length === 0) return null;
  const n = data.length, step = n > 1 ? w / (n - 1) : 0;
  const pt = (v, i) => `${n > 1 ? i * step : w / 2},${h - 6 - (Math.max(0, Math.min(max, v)) / max) * (h - 12)}`;
  const poly = data.map(pt).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: 64 }} preserveAspectRatio="none">
      {[0, 0.5, 1].map((g, i) => <line key={i} x1="0" x2={w} y1={6 + g * (h - 12)} y2={6 + g * (h - 12)} stroke={C.line} strokeWidth="0.5" />)}
      {n > 1 && <polyline points={poly} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />}
      {data.map((v, i) => { const [x, y] = pt(v, i).split(","); return <circle key={i} cx={x} cy={y} r={n > 1 ? 2.5 : 4} fill={color} />; })}
    </svg>
  );
}
function MiniBars({ data, color }) {
  const h = 64, w = 280; const max = Math.max(1, ...data.map(d => d.c));
  const n = data.length, bw = w / n;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: 64 }} preserveAspectRatio="none">
      {data.map((d, i) => { const bh = (d.c / max) * (h - 10); return <rect key={i} x={i * bw + 1} y={h - bh} width={bw - 2} height={bh} fill={d.c ? color : C.line} rx="1" />; })}
    </svg>
  );
}
function StatTile({ label, value, sub, color }) {
  return (
    <div style={{ background: C.feltDark, border: `1px solid ${C.line}`, borderRadius: 12 }} className="p-3 flex-1 min-w-[90px]">
      <div style={{ color: color || C.brass }} className="text-2xl font-bold">{value}</div>
      <div style={{ color: C.ivory }} className="text-xs font-semibold">{label}</div>
      {sub != null && <div style={{ color: C.soft }} className="text-[10px]">{sub}</div>}
    </div>
  );
}
function ChartCard({ title, hint, children }) {
  return (
    <div style={{ background: C.feltDark, border: `1px solid ${C.line}`, borderRadius: 12 }} className="p-3">
      <div className="flex items-center justify-between mb-1"><span style={{ color: C.ivory }} className="text-sm font-semibold">{title}</span>{hint && <span style={{ color: C.soft }} className="text-[10px]">{hint}</span>}</div>
      {children}
    </div>
  );
}
function StatsView({ lang, user }) {
  const L = T[lang];
  const s = computeStats(user);
  if (s.total === 0 && s.reviewN === 0 && s.testTrend.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <SectionTitle icon={BarChart3}>{L.statsTitle}</SectionTitle>
        <div style={{ background: C.feltDark, border: `1px solid ${C.line}`, borderRadius: 12 }} className="p-6 text-center">
          <BarChart3 size={32} style={{ color: C.brass }} className="mx-auto mb-2" />
          <p style={{ color: C.soft }} className="text-sm">{L.statsEmpty}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <SectionTitle icon={BarChart3}>{L.statsTitle}</SectionTitle>
      <div className="flex gap-2 flex-wrap">
        <StatTile label={L.statContracts} value={s.declareN ? s.declareMadePct + "%" : "—"} sub={`${s.declareN} ${L.statHands}`} color={C.win} />
        <StatTile label={L.statDefense} value={s.defendN ? s.defendSuccessPct + "%" : "—"} sub={`${s.defendN} ${L.statHands}`} color={C.brass} />
        <StatTile label={L.statLeads} value={s.leadN ? s.leadAccPct + "%" : "—"} sub={`${s.leadN} ${L.statLeadsN}`} color={C.red} />
      </div>
      {s.madeTrend.length >= 1 && (
        <ChartCard title={L.statContractsTrend} hint={L.statBuckets}><MiniLine data={s.madeTrend} color={C.win} /></ChartCard>
      )}
      {s.leadTrend.length >= 1 && (
        <ChartCard title={L.statLeadsTrend} hint={L.statBuckets}><MiniLine data={s.leadTrend} color={C.red} /></ChartCard>
      )}
      {s.testTrend.length >= 1 && (
        <ChartCard title={L.statTestTrend}><MiniLine data={s.testTrend} color={C.brass} /></ChartCard>
      )}
      <ChartCard title={L.statActivity} hint={L.stat14d}><MiniBars data={s.days} color={C.brass} /></ChartCard>
      <div className="flex gap-2 flex-wrap">
        <StatTile label={L.statTotalHands} value={s.total} color={C.ivory} />
        <StatTile label={L.statReviews} value={s.reviewN} color={C.ivory} />
      </div>
      <p style={{ color: C.soft }} className="text-[11px]">{L.statsHint}</p>
    </div>
  );
}

// ---------- Advanced technique lessons ----------
const TECHNIQUES = [
  {
    key: "finesse", name: { es: "Impasse (finesse)", en: "Finesse" },
    concept: { es: "Jugada para ganar una baza con una carta que no es la más alta, apostando a que un honor rival está en una posición concreta.", en: "A play to win a trick with a non-top card, betting that a missing honor sits in a particular position." },
    keys: [{ w: { es: "Muerto", en: "Dummy" }, c: "♠ A Q 4" }, { w: { es: "Tu mano", en: "You" }, c: "♠ 7 3 2" }],
    line: { es: ["Sal bajo desde tu mano hacia la A‑Q del muerto.", "Si el jugador de tu izquierda no cubre, juega la Q.", "La Q gana si el ♠K está a tu izquierda (50%)."], en: ["Lead low from your hand toward dummy's A‑Q.", "If left‑hand opponent plays low, insert the queen.", "The queen wins if the ♠K is on your left (50%)."] },
    point: { es: "Conduce hacia la tenaza, nunca al revés. Una baza extra gratis la mitad de las veces.", en: "Always lead toward the tenace, never away from it. A free extra trick half the time." },
  },
  {
    key: "holdup", name: { es: "Aguantar (holdup)", en: "Hold-up" },
    concept: { es: "En Sin Triunfo, demorar el gane de tu única parada para agotar las cartas del rival peligroso y cortar su comunicación.", en: "In No-Trump, delaying your only stopper to exhaust the danger hand and cut the defenders' communication." },
    keys: [{ w: { es: "Muerto", en: "Dummy" }, c: "♦ 6 4 2" }, { w: { es: "Tu mano", en: "You" }, c: "♦ A 7 3" }],
    line: { es: ["Te salen ♦ y solo tienes una parada (♦A).", "Cede la 1ª y la 2ª ronda; gana el ♦A en la tercera.", "Así el rival peligroso se queda sin ♦ para devolver."], en: ["They lead ♦ and you have one stopper (♦A).", "Duck the first and second round; win the ♦A on the third.", "Now the danger hand has no ♦ left to return."] },
    point: { es: "Aguanta cuando la finesse que necesitas perdería ante la mano peligrosa: le quitas el regreso.", en: "Hold up when the finesse you need would lose to the danger hand: you strip their re-entry." },
  },
  {
    key: "establish", name: { es: "Establecer un palo largo", en: "Establishing a long suit" },
    concept: { es: "Convertir las cartas pequeñas de un palo largo en ganadoras sacando primero las cartas rivales.", en: "Turning the small cards of a long suit into winners by first removing the opponents' cards." },
    keys: [{ w: { es: "Muerto", en: "Dummy" }, c: "♦ A K 5 4 3" }, { w: { es: "Tu mano", en: "You" }, c: "♦ 7 2" }],
    line: { es: ["Cuenta el palo: faltan 6 cartas, repartidas 3‑3 lo normal.", "Cobra ♦A y ♦K y cede una ronda.", "El 5‑4‑3 del muerto ya son ganadoras… si tienes una entrada para alcanzarlas."], en: ["Count the suit: 6 missing, usually splitting 3‑3.", "Cash ♦A and ♦K, then concede a round.", "Dummy's 5‑4‑3 are now winners… if you have an entry to reach them."] },
    point: { es: "Lo esencial son las entradas: de nada sirve un palo bueno sin cómo llegar a él.", en: "Entries are everything: a good suit is useless if you can't reach it." },
  },
  {
    key: "safety", name: { es: "Jugada de seguridad", en: "Safety play" },
    concept: { es: "Sacrificar una baza extra posible para asegurar el contrato frente a un mal reparto.", en: "Sacrificing a possible extra trick to secure the contract against a bad break." },
    keys: [{ w: { es: "Muerto", en: "Dummy" }, c: "♥ A K J 5 2" }, { w: { es: "Tu mano", en: "You" }, c: "♥ 7 4 3" }],
    line: { es: ["Necesitas no perder más de una baza en ♥ (falta la Q).", "Cobra primero el ♥A: si cae la Q seca a tu derecha, listo.", "Si no, vuelve a tu mano y haz la finesse del ♥J."], en: ["You can't lose more than one ♥ (the queen is missing).", "Cash the ♥A first: if a singleton Q drops on your right, done.", "Otherwise cross back and finesse the ♥J."] },
    point: { es: "Pregúntate qué reparto te hunde y juega para cubrirlo, aunque cueste una sobrebaza.", en: "Ask which break beats you and play to guard against it, even at the cost of an overtrick." },
  },
  {
    key: "endplay", name: { es: "Jugada de fin (endplay)", en: "Endplay / throw-in" },
    concept: { es: "Forzar a un rival a ganar una baza para que tenga que jugar a tu favor.", en: "Forcing an opponent to win a trick so they must lead to your advantage." },
    keys: [{ w: { es: "Tu tenaza", en: "Your tenace" }, c: "♣ A Q (mano) / ♣ 3 2 (muerto)" }, { w: { es: "Antes", en: "First" }, c: "elimina los otros palos" }],
    line: { es: ["Elimina los palos por los que el rival podría salir a salvo (strip).", "Cédele una baza forzada en otro palo (throw‑in).", "Obligado, debe abrir ♣ hacia tu A‑Q o darte fallo y descarte."], en: ["Eliminate the suits the opponent could safely exit in (strip).", "Concede a forced trick (throw‑in).", "Stuck, they must lead ♣ into your A‑Q or give a ruff‑and‑discard."] },
    point: { es: "Primero quita las salidas seguras; luego entrega la baza en el momento justo.", en: "Remove the safe exits first; then give up the trick at exactly the right moment." },
  },
  {
    key: "squeeze", name: { es: "Presión (squeeze)", en: "Squeeze" },
    concept: { es: "Forzar a un rival que guarda dos palos a soltar una carta vital al cobrar tus ganadoras.", en: "Forcing a defender who guards two suits to release a vital card as you cash winners." },
    keys: [{ w: { es: "Amenazas", en: "Threats" }, c: "♥ + ♦ que solo un rival cubre" }, { w: { es: "Cuenta", en: "Count" }, c: "pierde todas menos una" }],
    line: { es: ["Ajusta la cuenta: cédete todas las perdedoras menos una (rectifica).", "Cobra tus ganadoras hasta la última (la carta de presión).", "El rival no puede guardar ambos palos: suelta un guardián y tu amenaza gana."], en: ["Rectify the count: concede all losers but one.", "Cash your winners down to the last (the squeeze card).", "The defender can't keep both suits: a guard goes and your threat scores."] },
    point: { es: "Necesitas amenazas en dos palos que recaigan en el mismo rival y la cuenta ajustada.", en: "You need threats in two suits held by the same defender, and a tight count." },
  },
];

function TechniquesView({ lang }) {
  const L = T[lang];
  const [sel, setSel] = useState(null);
  if (sel != null) {
    const tq = TECHNIQUES[sel];
    return (
      <div className="flex flex-col gap-3">
        <button onClick={() => setSel(null)} style={{ color: C.brass }} className="text-sm flex items-center gap-1 self-start"><ChevronLeft size={16} />{L.back}</button>
        <SectionTitle icon={GraduationCap}>{tq.name[lang]}</SectionTitle>
        <div style={{ background: C.feltDark, border: `1px solid ${C.line}`, borderRadius: 12 }} className="p-3">
          <p style={{ color: C.ivory }} className="text-sm">{tq.concept[lang]}</p>
        </div>
        <div style={{ background: C.feltLite, border: `1px solid ${C.brassDim}`, borderRadius: 12 }} className="p-3">
          <div style={{ color: C.brass }} className="text-xs font-bold uppercase mb-2">{L.tqKeyCards}</div>
          {tq.keys.map((k, i) => (
            <div key={i} className="flex items-center justify-between text-sm mb-1">
              <span style={{ color: C.soft }}>{k.w[lang]}</span>
              <span style={{ color: C.ivory }} className="font-semibold tracking-wide">{k.c}</span>
            </div>
          ))}
        </div>
        <div style={{ background: C.feltDark, border: `1px solid ${C.line}`, borderRadius: 12 }} className="p-3">
          <div style={{ color: C.brass }} className="text-xs font-bold uppercase mb-2">{L.tqLine}</div>
          <ol className="flex flex-col gap-1.5">
            {tq.line[lang].map((s, i) => (
              <li key={i} className="flex gap-2 text-sm" style={{ color: C.ivory }}>
                <span style={{ background: C.brass, color: C.ink, width: 18, height: 18, borderRadius: 999 }} className="flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        </div>
        <div style={{ background: "rgba(63,143,94,0.15)", border: `1px solid ${C.win}`, borderRadius: 12 }} className="p-3">
          <div style={{ color: C.win }} className="text-xs font-bold uppercase mb-1">{L.tqPoint}</div>
          <p style={{ color: C.ivory }} className="text-sm">{tq.point[lang]}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <SectionTitle icon={GraduationCap}>{L.techniques}</SectionTitle>
      <p style={{ color: C.soft }} className="text-sm">{L.techniquesSub}</p>
      <div className="flex flex-col gap-2">
        {TECHNIQUES.map((tq, i) => (
          <button key={tq.key} onClick={() => setSel(i)} style={{ background: C.feltDark, border: `1px solid ${C.line}`, borderRadius: 12 }} className="p-3 text-left flex items-center justify-between">
            <div>
              <div style={{ color: C.ivory }} className="font-serif">{tq.name[lang]}</div>
              <div style={{ color: C.soft }} className="text-xs mt-0.5">{tq.concept[lang].slice(0, 64)}…</div>
            </div>
            <ChevronRight size={18} style={{ color: C.brass }} />
          </button>
        ))}
      </div>
    </div>
  );
}

function SettingsView({ lang, theme, onTheme }) {
  const L = T[lang];
  return (
    <div className="flex flex-col gap-3">
      <SectionTitle icon={Settings}>{L.settingsTitle}</SectionTitle>
      <p style={{ color: C.soft }} className="text-xs -mt-2">{L.themePick}</p>
      <div className="flex flex-col gap-2">
        {Object.keys(THEMES).map((k) => {
          const th = THEMES[k]; const active = k === theme;
          return (
            <button key={k} onClick={() => onTheme(k)} style={{ background: C.feltLite, border: `2px solid ${active ? C.brass : C.line}`, borderRadius: 12 }} className="p-3 flex items-center gap-3 text-left">
              <div className="flex gap-1 flex-shrink-0">
                {[th.C.feltDark, th.C.feltLite, th.C.brass, th.C.ivory].map((col, idx) => (
                  <span key={idx} style={{ background: col, width: 16, height: 28, borderRadius: 3, border: `1px solid ${C.line}` }} />
                ))}
              </div>
              <div className="flex-1">
                <div style={{ color: C.ivory }} className="text-sm font-semibold">{th.name[lang]}{th.ui.tips ? " ✦" : ""}</div>
                <div style={{ color: C.soft }} className="text-xs">{th.sub[lang]}</div>
              </div>
              {active && <Check size={18} style={{ color: C.brass }} />}
            </button>
          );
        })}
      </div>
      <p style={{ color: C.soft }} className="text-xs">{L.themeNote}</p>
    </div>
  );
}

// ---------- Mistakes review deck (spaced repetition) ----------
function ReviewView({ lang, reviews, onGrade }) {
  const L = T[lang];
  const [queue] = useState(() => (reviews || []).filter(c => (c.due || 0) <= Date.now()).sort((a, b) => (a.due || 0) - (b.due || 0)));
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [graded, setGraded] = useState(0);
  const total = (reviews || []).length;
  const canon = (a, b) => (SUITS.indexOf(a.s) * 13 + RANKS.indexOf(a.r)) - (SUITS.indexOf(b.s) * 13 + RANKS.indexOf(b.r));
  if (queue.length === 0 || idx >= queue.length) {
    const dueLater = (reviews || []).map(c => c.due || 0).filter(d => d > Date.now()).sort((a, b) => a - b)[0];
    const inHrs = dueLater ? Math.max(1, Math.round((dueLater - Date.now()) / 3600000)) : null;
    return (
      <div className="flex flex-col gap-3">
        <SectionTitle icon={Brain}>{L.reviewTitle}</SectionTitle>
        <div style={{ background: C.feltDark, border: `1px solid ${C.brassDim}`, borderRadius: 12 }} className="p-4 text-center flex flex-col gap-2">
          <Award size={26} style={{ color: C.brass }} className="mx-auto" />
          <p style={{ color: C.ivory }} className="font-semibold">{idx >= queue.length && queue.length > 0 ? L.reviewDone : L.reviewNonePending}</p>
          {graded > 0 && <p style={{ color: C.soft }} className="text-sm">{L.reviewGradedN.replace("{n}", graded)}</p>}
          <p style={{ color: C.soft }} className="text-sm">{total} {L.reviewTotal}{total === 0 ? " — " + L.reviewEmptyHint : ""}</p>
          {inHrs != null && <p style={{ color: C.soft }} className="text-xs">{L.reviewNextDue}: ~{inHrs} h</p>}
        </div>
      </div>
    );
  }
  const card = queue[idx];
  const revealed = selected != null;
  const grade = (g) => { onGrade(card.id, g); setSelected(null); setIdx(i => i + 1); setGraded(d => d + 1); };
  const contractLabel = `${card.contract.level}${bidLabel(card.contract.strain === "ST" ? "NT" : card.contract.strain, lang)}`;
  const HeaderBar = (
    <div className="flex items-center justify-between">
      <SectionTitle icon={Brain}>{L.reviewTitle}</SectionTitle>
      <span style={{ color: C.soft }} className="text-xs">{idx + 1}/{queue.length}</span>
    </div>
  );
  const gradeButtons = (
    <div className="flex gap-2 mt-1">
      <button onClick={() => grade(0)} style={{ background: C.red, color: C.ivory }} className="flex-1 px-2 py-2 rounded text-sm font-semibold">{L.reviewAgain}</button>
      <button onClick={() => grade(1)} style={{ background: C.brass, color: C.ink }} className="flex-1 px-2 py-2 rounded text-sm font-semibold">{L.reviewGood}</button>
      <button onClick={() => grade(2)} style={{ background: C.win, color: C.ivory }} className="flex-1 px-2 py-2 rounded text-sm font-semibold">{L.reviewEasy}</button>
    </div>
  );

  if (card.type === "play") {
    const pos = reconstructPlay(card);
    const mover = card.seat;
    const led = pos.trick.length ? pos.trick[0].card.s : null;
    const legalSet = new Set(legalCards(pos.hands[mover] || [], led).map(c => c.s + c.r));
    const myHand = (pos.hands[mover] || []).slice().sort(canon);
    const dummy = partnerOf(card.contract.declarer);
    const dummyHand = (pos.hands[dummy] || []).slice().sort(canon);
    const bestSet = new Set((card.bestCards || []).map(c => c.s + c.r));
    const correct = revealed && bestSet.has(selected.s + selected.r);
    return (
      <div className="flex flex-col gap-3">
        {HeaderBar}
        <div style={{ background: C.feltDark, border: `1px solid ${C.brassDim}`, borderRadius: 12 }} className="p-3 flex flex-col gap-1">
          <div className="flex items-center gap-2"><Pill bg={C.brassDim} color={C.ivory}>{L.reviewPlay}</Pill><span style={{ color: C.ivory }} className="text-sm font-semibold">{contractLabel} · {L[card.contract.declarer] || card.contract.declarer}</span></div>
          <p style={{ color: C.ivory }} className="text-sm">{L.reviewTrickN.replace("{n}", card.trickNo)} · {L.reviewYouPlay} <b>{L[mover] || mover}</b>. {L.reviewWhatPlay}</p>
        </div>
        {pos.trick.length > 0 && (
          <div style={{ background: C.feltLite, borderRadius: 10 }} className="p-2 flex items-center gap-3 flex-wrap">
            <span style={{ color: C.soft }} className="text-xs">{L.reviewTrick}:</span>
            {pos.trick.map((t, i) => <span key={i} className="text-sm font-semibold" style={{ color: SUIT_RED.has(t.card.s) ? "#ff8a80" : C.ivory }}>{L[t.seat] || t.seat}&nbsp;{t.card.r}{t.card.s}</span>)}
          </div>
        )}
        {dummyHand.length > 0 && (
          <div style={{ background: C.feltDark, borderRadius: 10, border: `1px solid ${C.line}` }} className="p-2">
            <div style={{ color: C.soft }} className="text-[10px] uppercase mb-1">{L.dummy} ({L[dummy] || dummy})</div>
            <div className="flex flex-col gap-1">
              {SUITS.map(s => { const cs = dummyHand.filter(c => c.s === s); if (!cs.length) return null; return <div key={s} className="flex items-center gap-1 flex-wrap"><span style={{ width: 16 }}><Suit s={s} size={13} /></span>{cs.map((c, i) => <span key={i} className="text-sm" style={{ color: SUIT_RED.has(c.s) ? "#ff8a80" : C.ivory }}>{c.r}</span>)}</div>; })}
            </div>
          </div>
        )}
        <div style={{ color: C.brass }} className="text-xs font-semibold">{L.reviewYourHand} ({L[mover] || mover})</div>
        <div className="flex flex-col gap-2">
          {SUITS.map(s => {
            const cs = myHand.filter(c => c.s === s); if (!cs.length) return null;
            return (
              <div key={s} className="flex items-center gap-1 flex-wrap">
                <span style={{ width: 20 }}><Suit s={s} size={16} /></span>
                {cs.map((c, i) => {
                  const legal = legalSet.has(c.s + c.r); const isBest = revealed && bestSet.has(c.s + c.r); const isSel = revealed && selected.s === c.s && selected.r === c.r;
                  return <PlayingCard key={i} card={c} small onClick={(!revealed && legal) ? () => setSelected(c) : undefined} dim={(!legal) || (revealed && !isBest && !isSel)} />;
                })}
              </div>
            );
          })}
        </div>
        {revealed && (
          <div style={{ background: correct ? "rgba(63,143,94,0.18)" : "rgba(74,31,36,0.4)", border: `1px solid ${correct ? C.win : C.red}`, borderRadius: 12 }} className="p-3 flex flex-col gap-2">
            <p className="text-sm" style={{ color: C.ivory }}>{L.reviewYouPlayed} <b style={{ color: SUIT_RED.has(selected.s) ? "#ff8a80" : C.ivory }}>{selected.r}{selected.s}</b>.</p>
            {correct ? <p className="text-sm font-semibold" style={{ color: C.win }}>{L.reviewCorrect}</p>
              : <p className="text-sm" style={{ color: C.soft }}>{L.reviewBest}: {card.bestCards.map((c, i) => <b key={i} style={{ color: SUIT_RED.has(c.s) ? "#ff8a80" : C.win }}>{c.r}{c.s}{i < card.bestCards.length - 1 ? " " : ""}</b>)}</p>}
            {gradeButtons}
          </div>
        )}
      </div>
    );
  }

  // lead card
  const hands = decodeThemeDeal(card.d);
  const leader = nextSeat(card.contract.declarer);
  const handCards = hands[leader].slice().sort(canon);
  const deal = { hands, contract: card.contract, lt: card.lt };
  const le = revealed ? leadEval(deal, selected) : null;
  const bestSet = revealed && le ? new Set(le.bestCards.map(c => c.s + c.r)) : new Set();
  const optimal = le ? le.lost <= 0 : false;
  return (
    <div className="flex flex-col gap-3">
      {HeaderBar}
      <div style={{ background: C.feltDark, border: `1px solid ${C.brassDim}`, borderRadius: 12 }} className="p-3 flex flex-col gap-1">
        <div className="flex items-center gap-2"><Pill bg={C.red} color={C.ivory}>{L.reviewLead}</Pill><span style={{ color: C.ivory }} className="text-sm font-semibold">{contractLabel} · {L[card.contract.declarer] || card.contract.declarer}</span></div>
        <p style={{ color: C.ivory }} className="text-sm">{L.reviewYouDefend} <b>{L[leader] || leader}</b>. {L.reviewPickLead}</p>
      </div>
      <div className="flex flex-col gap-2">
        {SUITS.map(s => {
          const suitCards = handCards.filter(c => c.s === s);
          if (!suitCards.length) return null;
          return (
            <div key={s} className="flex items-center gap-1 flex-wrap">
              <span style={{ width: 20 }}><Suit s={s} size={16} /></span>
              {suitCards.map((c, i) => (
                <PlayingCard key={i} card={c} small onClick={revealed ? undefined : () => setSelected(c)}
                  dim={revealed && !(selected.s === c.s && selected.r === c.r) && !bestSet.has(c.s + c.r)} />
              ))}
            </div>
          );
        })}
      </div>
      {revealed && (
        <div style={{ background: optimal ? "rgba(63,143,94,0.18)" : "rgba(74,31,36,0.4)", border: `1px solid ${optimal ? C.win : C.red}`, borderRadius: 12 }} className="p-3 flex flex-col gap-2">
          <p className="text-sm" style={{ color: C.ivory }}>{L.reviewYourLead} <b style={{ color: SUIT_RED.has(selected.s) ? "#ff8a80" : C.ivory }}>{selected.r}{selected.s}</b>: {L.declMakes} <b>{le.leadTricks}</b>.</p>
          {optimal ? <p className="text-sm font-semibold" style={{ color: C.win }}>{L.reviewOptimal}</p>
            : <p className="text-sm" style={{ color: C.soft }}>{L.reviewBest}: {le.bestCards.map((c, i) => <b key={i} style={{ color: SUIT_RED.has(c.s) ? "#ff8a80" : C.win }}>{c.r}{c.s}{i < le.bestCards.length - 1 ? " " : ""}</b>)} → {le.best} <span style={{ color: C.red }}>(−{le.lost})</span></p>}
          {gradeButtons}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [lang, setLang] = useState("es");
  const [theme, setTheme] = useState("classic");
  const [users, setUsers] = useState([]);
  const [currentId, setCurrentId] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState({ name: "dashboard", params: {} });
  const [pbnImported, setPbnImported] = useState([]);
  const [tourOpen, setTourOpen] = useState(false);
  // apply theme palette synchronously so all child renders read the right colors
  C = (THEMES[theme] || THEMES.classic).C;
  UI = (THEMES[theme] || THEMES.classic).ui;

  // load
  useEffect(() => {
    (async () => {
      const u = await store.get("bm_users");
      const c = await store.get("bm_current");
      const lg = await store.get("bm_lang");
      const th = await store.get("bm_theme");
      const pb = await store.get("bm_pbn");
      if (Array.isArray(u)) setUsers(u);
      if (c) setCurrentId(c);
      if (lg) setLang(lg);
      if (th && THEMES[th]) setTheme(th);
      if (Array.isArray(pb)) setPbnImported(pb);
      setLoaded(true);
    })();
  }, []);
  // persist
  useEffect(() => { if (loaded) store.set("bm_users", users); }, [users, loaded]);
  useEffect(() => { if (loaded) store.set("bm_current", currentId); }, [currentId, loaded]);
  useEffect(() => { if (loaded) store.set("bm_lang", lang); }, [lang, loaded]);
  useEffect(() => { if (loaded) store.set("bm_theme", theme); }, [theme, loaded]);
  useEffect(() => { if (loaded) store.set("bm_pbn", pbnImported); }, [pbnImported, loaded]);

  const user = users.find(u => u.id === currentId) || null;
  useEffect(() => { if (loaded && user && !user.seenTour) setTourOpen(true); }, [loaded, currentId, user && user.seenTour]);

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
    captureLead(d, contract, lt, userLead, leadTricks, best) {
      updateUser(u => {
        const reviews = (u.reviews || []).slice();
        const id = "lead:" + d;
        if (reviews.some(c => c.id === id)) return u; // already captured this deal's lead
        reviews.push({ id, type: "lead", d, contract, lt, userLead, leadTricks, best, created: Date.now(), ease: 2.5, interval: 0, reps: 0, lapses: 0, due: Date.now() });
        return { ...u, reviews };
      });
    },
    logEvent(ev) {
      updateUser(u => { const s = (u.stats || []).concat([{ ts: Date.now(), ...ev }]); return { ...u, stats: s.length > 800 ? s.slice(s.length - 800) : s }; });
    },
    seenTour() { updateUser(u => ({ ...u, seenTour: true })); },
    test(levelId, score) {
      updateUser(u => { const p = { ...u.progress }; const lv = { ...(p[levelId] || {}) }; lv.testScore = Math.max(lv.testScore || 0, score); p[levelId] = lv; const stats = (u.stats || []).concat([{ ts: Date.now(), kind: "test", levelId, score }]); return { ...u, progress: p, stats: stats.length > 800 ? stats.slice(stats.length - 800) : stats }; });
    },
    capturePlay(item) {
      updateUser(u => {
        const reviews = (u.reviews || []).slice();
        const id = "play:" + item.d + ":" + item.ply;
        if (reviews.some(c => c.id === id)) return u;
        reviews.push({ id, type: "play", ...item, created: Date.now(), ease: 2.5, interval: 0, reps: 0, lapses: 0, due: Date.now() });
        return { ...u, reviews };
      });
    },
    gradeReview(id, grade) {
      updateUser(u => { const reviews = (u.reviews || []).map(c => c.id === id ? sm2(c, grade) : c); const stats = (u.stats || []).concat([{ ts: Date.now(), kind: "review", grade }]); return { ...u, reviews, stats: stats.length > 800 ? stats.slice(stats.length - 800) : stats }; });
    },
    deleteReview(id) {
      updateUser(u => ({ ...u, reviews: (u.reviews || []).filter(c => c.id !== id) }));
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
    <div style={{ background: UI.page || `radial-gradient(circle at 50% 0%, ${C.felt}, ${C.feltDark} 80%)`, minHeight: "100vh", fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
      <style>{`html{font-size:${UI.rootPx || 16}px;}.font-serif{font-family:Georgia,'Times New Roman',serif;}`}</style>
      <Header lang={lang} user={user} view={navName}
        onNav={(k) => setView({ name: k, params: {} })}
        onSwitch={() => setCurrentId(null)}
        onToggleLang={() => setLang(l => l === "es" ? "en" : "es")} />

      <div className={`${UI.maxW} mx-auto px-3 py-4 pb-24`}>
        {UI.tips && view.name !== "play" && <TipBanner lang={lang} />}
        {view.name === "settings" && <SettingsView lang={lang} theme={theme} onTheme={setTheme} />}
        {view.name === "help" && <HelpView lang={lang} onTour={() => setTourOpen(true)} />}
        {view.name === "stats" && <StatsView lang={lang} user={user} />}
        {view.name === "techniques" && <TechniquesView lang={lang} />}
        {view.name === "dashboard" && <Dashboard lang={lang} user={user} onOpenLevel={(id, tab) => setView({ name: "level", params: { levelId: id, tab } })} onQuickPlay={quickPlay} onGoReview={() => setView({ name: "review", params: {} })} onTechniques={() => setView({ name: "techniques", params: {} })} />}
        {view.name === "levels" && <Dashboard lang={lang} user={user} onOpenLevel={(id, tab) => setView({ name: "level", params: { levelId: id, tab } })} onQuickPlay={quickPlay} onGoReview={() => setView({ name: "review", params: {} })} onTechniques={() => setView({ name: "techniques", params: {} })} />}
        {view.name === "level" && <LevelDetail levelId={view.params.levelId} lang={lang} user={user} marks={marks} initialTab={view.params.tab} onBack={() => setView({ name: "dashboard", params: {} })} onOpenDeal={openDeal} />}
        {view.name === "library" && <LibraryView lang={lang} user={user} onOpenDeal={openDeal} pbnImported={pbnImported} onImport={(entries) => setPbnImported(prev => [...entries, ...prev])} onClearImported={() => setPbnImported([])} />}
        {view.name === "bid" && <BidTrainer lang={lang} user={user} marks={marks} />}
        {view.name === "themes" && <ThemePractice lang={lang} onPlay={(deal, title) => setView({ name: "play", params: { deal, title, fromTheme: true } })} />}
        {view.name === "review" && <ReviewView lang={lang} reviews={user.reviews} onGrade={(id, g) => marks.gradeReview(id, g)} />}
        {view.name === "play" && view.params.deal && (
          <PlayPractice deal={view.params.deal} lang={lang} title={view.params.title} onCaptureLead={marks.captureLead} onCapturePlay={marks.capturePlay} onLog={marks.logEvent}
            onExit={() => setView(view.params.fromTheme ? { name: "themes", params: {} } : { name: view.params.levelId ? "level" : "dashboard", params: view.params.levelId ? { levelId: view.params.levelId } : {} })}
            onComplete={() => { if (view.params.dealId) marks.deal(view.params.kind, view.params.levelId, view.params.dealId); }} />
        )}
        {view.name === "play" && !view.params.deal && (
          <div className="flex flex-col items-center gap-3 py-10">
            <p style={{ color: C.soft }} className="text-sm">{T[lang].pickLevel}</p>
            <button onClick={quickPlay} style={{ background: C.brass, color: C.ink }} className="px-4 py-2 rounded font-bold flex items-center gap-2"><Shuffle size={16} />{T[lang].newDeal}</button>
          </div>
        )}
      </div>
      {tourOpen && <TourOverlay lang={lang} onClose={() => { setTourOpen(false); if (user && !user.seenTour) marks.seenTour(); }} />}
    </div>
  );
}
