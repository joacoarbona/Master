<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Ruleta de Letras</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    min-height: 100vh;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 30px 20px;
    color: #fff;
  }

  h1 {
    font-size: 1.5rem;
    margin-bottom: 24px;
    opacity: 0.85;
    letter-spacing: 2px;
    text-transform: uppercase;
    font-weight: 300;
  }

  .letter-box {
    width: min(70vw, 280px);
    height: min(70vw, 280px);
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-radius: 30px;
    backdrop-filter: blur(10px);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
    margin-bottom: 28px;
    overflow: hidden;
  }

  #letter {
    font-size: min(36vw, 180px);
    font-weight: 800;
    line-height: 1;
    text-shadow: 0 0 40px currentColor;
    font-variant-numeric: tabular-nums;
  }

  .controls {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    justify-content: center;
  }

  button {
    padding: 14px 32px;
    font-size: 1rem;
    font-weight: 600;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    border: none;
    border-radius: 50px;
    cursor: pointer;
    transition: transform 0.15s ease, opacity 0.15s;
    color: #fff;
    min-width: 110px;
  }

  button:active:not(:disabled) { transform: scale(0.96); }
  button:disabled { opacity: 0.4; cursor: not-allowed; }

  #startBtn {
    background: linear-gradient(135deg, #00b894 0%, #00cec9 100%);
    box-shadow: 0 8px 20px rgba(0, 184, 148, 0.4);
  }
  #stopBtn {
    background: linear-gradient(135deg, #e84393 0%, #d63031 100%);
    box-shadow: 0 8px 20px rgba(214, 48, 49, 0.4);
  }
  #resetBtn {
    background: linear-gradient(135deg, #636e72 0%, #2d3436 100%);
    box-shadow: 0 8px 20px rgba(45, 52, 54, 0.4);
  }

  .status {
    margin-top: 20px;
    font-size: 0.85rem;
    opacity: 0.6;
    letter-spacing: 1px;
    text-align: center;
    height: 18px;
  }

  .history-section {
    margin-top: 32px;
    width: 100%;
    max-width: 500px;
  }

  .history-title {
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 2px;
    opacity: 0.5;
    margin-bottom: 12px;
    text-align: center;
  }

  .history {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
    min-height: 44px;
    padding: 12px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
  }

  .history-item {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    font-weight: 700;
    font-size: 1rem;
    text-shadow: 0 0 12px currentColor;
    animation: pop 0.3s ease;
  }

  @keyframes pop {
    from { transform: scale(0.4); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }

  .history-empty {
    opacity: 0.3;
    font-size: 0.85rem;
    font-style: italic;
    align-self: center;
  }
</style>
</head>
<body>

<h1>Ruleta de Letras</h1>

<div class="letter-box">
  <span id="letter" style="color: #00cec9;">A</span>
</div>

<div class="controls">
  <button id="startBtn">Start</button>
  <button id="stopBtn" disabled>Stop</button>
  <button id="resetBtn">Reset</button>
</div>

<div class="status" id="status">Pulsa Start para empezar</div>

<div class="history-section">
  <div class="history-title">Últimas paradas (máx. 15)</div>
  <div class="history" id="history">
    <span class="history-empty">— Aún no hay paradas —</span>
  </div>
</div>

<script>
  const ALPHABET = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ".split("");
  const COLORS = [
    "#ff6b6b", "#feca57", "#48dbfb", "#1dd1a1", "#5f27cd",
    "#ff9ff3", "#54a0ff", "#00d2d3", "#ee5253", "#10ac84",
    "#f368e0", "#ff9f43", "#0abde3", "#ffeaa7", "#a29bfe"
  ];

  const CYCLE_MS = 2000; // vuelta completa en 2 segundos exactos
  const MAX_HISTORY = 15;

  const letterEl = document.getElementById("letter");
  const startBtn = document.getElementById("startBtn");
  const stopBtn = document.getElementById("stopBtn");
  const resetBtn = document.getElementById("resetBtn");
  const statusEl = document.getElementById("status");
  const historyEl = document.getElementById("history");

  let currentIndex = 0;   // letra mostrada ahora
  let resumeIndex = 0;    // desde dónde reanudar al pulsar Start
  let rafId = null;
  let startTime = 0;
  let history = [];

  function render(index) {
    if (index === currentIndex && letterEl.textContent === ALPHABET[index]) return;
    currentIndex = index;
    letterEl.textContent = ALPHABET[index];
    letterEl.style.color = COLORS[index % COLORS.length];
  }

  function loop(now) {
    const elapsed = now - startTime;
    // posición basada en tiempo real => exactamente 2s por vuelta
    const offset = Math.floor((elapsed / CYCLE_MS) * ALPHABET.length);
    const index = (resumeIndex + offset) % ALPHABET.length;
    render(index);
    rafId = requestAnimationFrame(loop);
  }

  function start() {
    if (rafId !== null) return;
    startTime = performance.now();
    rafId = requestAnimationFrame(loop);
    startBtn.disabled = true;
    stopBtn.disabled = false;
    statusEl.textContent = "Girando...";
  }

  function stop() {
    if (rafId === null) return;
    cancelAnimationFrame(rafId);
    rafId = null;
    resumeIndex = currentIndex; // próxima vez se reanuda desde aquí
    startBtn.disabled = false;
    stopBtn.disabled = true;
    statusEl.textContent = `Parada en: ${ALPHABET[currentIndex]}`;
    addToHistory(currentIndex);
  }

  function reset() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    currentIndex = -1;
    resumeIndex = 0;
    history = [];
    render(0);
    renderHistory();
    startBtn.disabled = false;
    stopBtn.disabled = true;
    statusEl.textContent = "Reiniciado. Pulsa Start";
  }

  function addToHistory(index) {
    history.push(index);
    if (history.length > MAX_HISTORY) history.shift();
    renderHistory();
  }

  function renderHistory() {
    if (history.length === 0) {
      historyEl.innerHTML = '<span class="history-empty">— Aún no hay paradas —</span>';
      return;
    }
    historyEl.innerHTML = "";
    history.forEach(idx => {
      const span = document.createElement("span");
      span.className = "history-item";
      span.textContent = ALPHABET[idx];
      span.style.color = COLORS[idx % COLORS.length];
      historyEl.appendChild(span);
    });
  }

  startBtn.addEventListener("click", start);
  stopBtn.addEventListener("click", stop);
  resetBtn.addEventListener("click", reset);
</script>

</body>
</html>
