<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>¡Bingo de Cumpleaños!</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Baloo+2:wght@500;700;800&display=swap" rel="stylesheet">
<style>
  :root{
    --pink:#ff5fa2; --grape:#7b3ff2; --sun:#ffd23f; --mint:#26d7ae;
    --sky:#3fbdf2; --ink:#2a1a4a; --cream:#fff6fb;
  }
  *{box-sizing:border-box; margin:0; padding:0;}
  html,body{height:100%;}
  body{
    font-family:'Fredoka',sans-serif;
    color:var(--cream);
    background:
      radial-gradient(circle at 12% 18%, rgba(255,210,63,.35), transparent 38%),
      radial-gradient(circle at 88% 20%, rgba(38,215,174,.35), transparent 40%),
      radial-gradient(circle at 80% 90%, rgba(255,95,162,.4), transparent 45%),
      linear-gradient(135deg,#5b21b6,#7b3ff2 55%,#9d4edd);
    min-height:100%;
    overflow-x:hidden;
  }
  .wrap{max-width:1400px; margin:0 auto; padding:18px clamp(12px,3vw,32px) 40px;}
  header{display:flex; align-items:center; justify-content:center; gap:14px; padding:8px 0 4px;}
  header h1{
    font-family:'Baloo 2',sans-serif; font-weight:800;
    font-size:clamp(28px,5vw,58px); line-height:1;
    color:#fff; text-shadow:0 4px 0 rgba(123,63,242,.6), 0 8px 22px rgba(0,0,0,.35);
    letter-spacing:.5px; text-align:center;
  }
  .edit-title{font:inherit; color:#fff; background:transparent; border:none; text-align:center; outline:none; border-bottom:2px dashed rgba(255,255,255,.35); padding:0 6px;}
  .edit-title:focus{border-bottom-color:var(--sun);}

  .stage{display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1.25fr); gap:clamp(14px,2.5vw,30px); margin-top:14px;}
  @media (max-width:900px){ .stage{grid-template-columns:1fr;} }

  /* ---- Bola principal ---- */
  .ball-panel{
    background:rgba(255,255,255,.08); border:2px solid rgba(255,255,255,.2);
    border-radius:30px; padding:clamp(16px,3vw,30px); backdrop-filter:blur(6px);
    display:flex; flex-direction:column; align-items:center; gap:18px;
  }
  .ball{
    position:relative; width:clamp(180px,28vw,300px); height:clamp(180px,28vw,300px);
    border-radius:50%; display:flex; align-items:center; justify-content:center;
    background:radial-gradient(circle at 32% 28%, #fff, #ffe7a0 30%, var(--sun) 70%);
    box-shadow:inset -14px -16px 30px rgba(180,120,0,.45), 0 18px 40px rgba(0,0,0,.4);
    color:var(--ink);
  }
  .ball.empty{background:radial-gradient(circle at 32% 28%,#fff,#f0e6ff 40%,#d9c7ff); color:#9d8bd1;}
  .ball .num{font-family:'Baloo 2'; font-weight:800; font-size:clamp(72px,16vw,150px); line-height:1;}
  .ball .hint{font-size:clamp(15px,2.4vw,22px); font-weight:600;}
  .ball.pop{animation:pop .55s cubic-bezier(.2,1.4,.5,1);}
  @keyframes pop{0%{transform:scale(.2) rotate(-25deg); opacity:0;}60%{transform:scale(1.12) rotate(6deg);}100%{transform:scale(1) rotate(0);}}
  .count{font-size:clamp(15px,2.2vw,20px); font-weight:600; opacity:.92;}
  .count b{color:var(--sun); font-size:1.25em;}

  /* ---- Botones ---- */
  .controls{display:flex; flex-wrap:wrap; gap:12px; justify-content:center; width:100%;}
  button{font-family:'Fredoka'; cursor:pointer; border:none; border-radius:18px; font-weight:600;}
  .btn-main{
    font-size:clamp(22px,3.6vw,32px); font-weight:700; padding:18px 40px; color:#fff;
    background:linear-gradient(180deg,#ff7eb6,var(--pink)); box-shadow:0 7px 0 #c43d78, 0 12px 24px rgba(0,0,0,.3);
    transition:transform .08s, box-shadow .08s;
  }
  .btn-main:active{transform:translateY(5px); box-shadow:0 2px 0 #c43d78, 0 6px 14px rgba(0,0,0,.3);}
  .btn-main:disabled{filter:grayscale(.6) brightness(.8); cursor:default; box-shadow:0 7px 0 #888;}
  .btn-sec{font-size:clamp(14px,2vw,18px); padding:12px 20px; color:#fff; background:rgba(255,255,255,.16); border:2px solid rgba(255,255,255,.3);}
  .btn-sec.on{background:var(--mint); border-color:var(--mint); color:#053b30;}
  .speed{display:flex; align-items:center; gap:8px; font-size:15px; font-weight:600; color:#fff;}
  .speed input{accent-color:var(--sun);}

  /* ---- Últimas bolas ---- */
  .recent{display:flex; gap:10px; justify-content:center; flex-wrap:wrap; min-height:54px;}
  .recent .mini{
    width:clamp(40px,7vw,56px); height:clamp(40px,7vw,56px); border-radius:50%;
    background:radial-gradient(circle at 32% 28%,#fff,var(--sky)); color:#063b52;
    display:flex; align-items:center; justify-content:center; font-weight:700; font-size:clamp(17px,3vw,24px);
    box-shadow:0 4px 10px rgba(0,0,0,.3);
  }
  .recent .mini:first-child{transform:scale(1.18); background:radial-gradient(circle at 32% 28%,#fff,var(--sun)); color:var(--ink);}

  /* ---- Tablero 1-90 ---- */
  .board-panel{
    background:rgba(255,255,255,.08); border:2px solid rgba(255,255,255,.2);
    border-radius:30px; padding:clamp(14px,2.5vw,24px); backdrop-filter:blur(6px);
  }
  .board{display:grid; grid-template-columns:repeat(10,1fr); gap:clamp(5px,1vw,9px);}
  .cell{
    aspect-ratio:1; border-radius:12px; display:flex; align-items:center; justify-content:center;
    font-weight:600; font-size:clamp(14px,2.4vw,26px); color:#cdb9ff;
    background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.12); transition:.25s;
  }
  .cell.hit{
    color:var(--ink); font-weight:700; transform:scale(1.04);
    background:radial-gradient(circle at 35% 30%,#fff,var(--sun));
    box-shadow:0 4px 12px rgba(255,210,63,.6);
  }

  /* ---- Cartones ---- */
  .cards-bar{margin-top:22px; display:flex; flex-wrap:wrap; align-items:center; justify-content:center; gap:14px;}
  .cards-bar label{font-size:18px; font-weight:600; color:#fff;}
  .cards-bar input[type=number]{width:70px; font:inherit; font-size:20px; padding:8px; border-radius:10px; border:none; text-align:center;}

  /* zona de impresión, oculta en pantalla */
  #print-area{display:none;}
  @media print{
    body *{visibility:hidden;}
    #print-area, #print-area *{visibility:visible;}
    #print-area{display:block; position:absolute; inset:0; padding:0; background:#fff;}
  }
  .carton{
    border:3px solid #7b3ff2; border-radius:14px; padding:10px; margin:0 0 16px;
    background:#fff; color:#2a1a4a; page-break-inside:avoid; break-inside:avoid;
  }
  .carton h3{font-family:'Baloo 2'; color:#ff5fa2; font-size:20px; margin-bottom:6px; text-align:center;}
  .carton table{width:100%; border-collapse:collapse;}
  .carton td{border:2px solid #d9c7ff; height:54px; text-align:center; font-family:'Baloo 2'; font-weight:700; font-size:26px;}
  .carton td.blank{background:#f4eeff;}
  .print-grid{display:grid; grid-template-columns:1fr 1fr; gap:18px; padding:24px;}

  .hint-bar{text-align:center; margin-top:18px; font-size:15px; opacity:.85; color:#fff;}
  kbd{background:rgba(255,255,255,.2); border:1px solid rgba(255,255,255,.4); border-radius:6px; padding:1px 8px; font-family:inherit;}
  canvas#confetti{position:fixed; inset:0; pointer-events:none; z-index:50;}
</style>
</head>
<body>
<canvas id="confetti"></canvas>
<div class="wrap">
  <header>
    <span style="font-size:clamp(28px,5vw,52px)">🎉</span>
    <h1>BINGO de <input class="edit-title" id="partyName" value="Cumpleaños" size="11" spellcheck="false"></h1>
    <span style="font-size:clamp(28px,5vw,52px)">🎈</span>
  </header>

  <div class="stage">
    <section class="ball-panel">
      <div class="ball empty" id="ball"><span class="hint">¡Pulsa<br>para empezar!</span></div>
      <div class="count">Bolas sacadas: <b id="drawnCount">0</b> / 90</div>
      <div class="controls">
        <button class="btn-main" id="drawBtn">🎱 Sacar bola</button>
      </div>
      <div class="controls">
        <button class="btn-sec" id="autoBtn">▶ Automático</button>
        <span class="speed">Velocidad
          <input type="range" id="speed" min="1500" max="6000" step="500" value="3500">
        </span>
        <button class="btn-sec on" id="voiceBtn">🔊 Voz</button>
        <button class="btn-sec" id="resetBtn">↺ Reiniciar</button>
      </div>
      <div class="recent" id="recent"></div>
    </section>

    <section class="board-panel">
      <div class="board" id="board"></div>
    </section>
  </div>

  <div class="cards-bar">
    <label>¿Cuántos cartones imprimir?</label>
    <input type="number" id="numCards" value="12" min="1" max="40">
    <button class="btn-sec" id="cardsBtn">🖨️ Generar e imprimir cartones</button>
  </div>

  <div class="hint-bar">
    Con mando o teclado: <kbd>Espacio</kbd> o <kbd>Enter</kbd> = sacar bola · <kbd>A</kbd> = automático · <kbd>R</kbd> = reiniciar
  </div>
</div>

<div id="print-area"></div>

<script>
const N = 90;
let remaining = [], drawn = [], auto = false, autoTimer = null, voice = true;
const ballEl = document.getElementById('ball');
const boardEl = document.getElementById('board');
const recentEl = document.getElementById('recent');
const drawnCountEl = document.getElementById('drawnCount');
const drawBtn = document.getElementById('drawBtn');
const autoBtn = document.getElementById('autoBtn');
const voiceBtn = document.getElementById('voiceBtn');
const resetBtn = document.getElementById('resetBtn');
const speedEl = document.getElementById('speed');

function buildBoard(){
  boardEl.innerHTML='';
  for(let i=1;i<=N;i++){
    const c=document.createElement('div');
    c.className='cell'; c.id='cell-'+i; c.textContent=i;
    boardEl.appendChild(c);
  }
}
function reset(){
  stopAuto();
  remaining = Array.from({length:N},(_,i)=>i+1);
  drawn = [];
  buildBoard();
  drawnCountEl.textContent='0';
  recentEl.innerHTML='';
  ballEl.className='ball empty';
  ballEl.innerHTML='<span class="hint">¡Pulsa<br>para empezar!</span>';
  drawBtn.disabled=false;
}
function speak(n){
  if(!voice || !window.speechSynthesis) return;
  try{
    speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(String(n));
    u.lang='es-ES'; u.rate=.9; u.pitch=1.1;
    const v=speechSynthesis.getVoices().find(v=>v.lang.startsWith('es'));
    if(v) u.voice=v;
    speechSynthesis.speak(u);
  }catch(e){}
}
function draw(){
  if(remaining.length===0) return;
  const idx=Math.floor(Math.random()*remaining.length);
  const n=remaining.splice(idx,1)[0];
  drawn.unshift(n);
  // bola grande
  ballEl.className='ball pop';
  ballEl.innerHTML='<span class="num">'+n+'</span>';
  // tablero
  document.getElementById('cell-'+n).classList.add('hit');
  // contador
  drawnCountEl.textContent=String(drawn.length);
  // recientes (últimas 6)
  recentEl.innerHTML='';
  drawn.slice(0,6).forEach(x=>{
    const m=document.createElement('div'); m.className='mini'; m.textContent=x; recentEl.appendChild(m);
  });
  speak(n);
  if(remaining.length===0){ drawBtn.disabled=true; stopAuto(); celebrate(); }
}
function startAuto(){
  auto=true; autoBtn.classList.add('on'); autoBtn.textContent='⏸ Pausar';
  draw();
  autoTimer=setInterval(()=>{ if(remaining.length) draw(); }, +speedEl.value);
}
function stopAuto(){
  auto=false; clearInterval(autoTimer); autoTimer=null;
  autoBtn.classList.remove('on'); autoBtn.textContent='▶ Automático';
}
drawBtn.addEventListener('click', ()=>{ if(!auto) draw(); });
autoBtn.addEventListener('click', ()=> auto?stopAuto():startAuto());
resetBtn.addEventListener('click', reset);
voiceBtn.addEventListener('click', ()=>{
  voice=!voice; voiceBtn.classList.toggle('on',voice);
  voiceBtn.textContent = voice?'🔊 Voz':'🔇 Voz';
});
speedEl.addEventListener('change', ()=>{ if(auto){ stopAuto(); startAuto(); }});
document.addEventListener('keydown', e=>{
  if(e.target.tagName==='INPUT') return;
  if(e.code==='Space'||e.code==='Enter'){ e.preventDefault(); if(!auto) draw(); }
  else if(e.key.toLowerCase()==='a'){ auto?stopAuto():startAuto(); }
  else if(e.key.toLowerCase()==='r'){ reset(); }
});

/* ---------- Generador de cartones españoles (3x9, 15 números) ---------- */
function makeCarton(){
  // 1) números por columna: cada col 1..3, total 15
  let counts=Array(9).fill(1); let extra=6;
  while(extra>0){ const c=Math.floor(Math.random()*9); if(counts[c]<3){counts[c]++; extra--;} }
  // 2) asignar a filas: cada fila exactamente 5, una col no repite fila
  let grid;
  for(let tries=0; tries<400; tries++){
    grid=[[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0]];
    for(let col=0; col<9; col++){
      const rows=[0,1,2].sort(()=>Math.random()-.5).slice(0,counts[col]);
      rows.forEach(r=>grid[r][col]=1);
    }
    if(grid.every(row=>row.reduce((a,b)=>a+b,0)===5)) break;
    grid=null;
  }
  if(!grid) return makeCarton(); // reintento raro
  // 3) rellenar con números del rango de cada columna, ordenados por columna
  const ranges=[[1,9],[10,19],[20,29],[30,39],[40,49],[50,59],[60,69],[70,79],[80,90]];
  const out=[[],[],[]];
  for(let col=0; col<9; col++){
    const [lo,hi]=ranges[col];
    const pool=[]; for(let k=lo;k<=hi;k++) pool.push(k);
    pool.sort(()=>Math.random()-.5);
    const picked=pool.slice(0,counts[col]).sort((a,b)=>a-b);
    let p=0;
    for(let r=0;r<3;r++) out[r][col]= grid[r][col] ? picked[p++] : null;
  }
  return out;
}
function cartonHTML(card,i,name){
  let rows='';
  for(let r=0;r<3;r++){
    rows+='<tr>';
    for(let c=0;c<9;c++){
      const v=card[r][c];
      rows+= v? '<td>'+v+'</td>' : '<td class="blank"></td>';
    }
    rows+='</tr>';
  }
  return '<div class="carton"><h3>🎈 '+name+' · Cartón '+i+'</h3><table>'+rows+'</table></div>';
}
document.getElementById('cardsBtn').addEventListener('click', ()=>{
  const n=Math.max(1,Math.min(40, +document.getElementById('numCards').value||12));
  const name=document.getElementById('partyName').value.trim()||'Bingo';
  let html='<div class="print-grid">';
  for(let i=1;i<=n;i++) html+=cartonHTML(makeCarton(),i,name);
  html+='</div>';
  document.getElementById('print-area').innerHTML=html;
  setTimeout(()=>window.print(),150);
});

/* ---------- Confeti final ---------- */
const cv=document.getElementById('confetti'), cx=cv.getContext('2d');
function resize(){cv.width=innerWidth; cv.height=innerHeight;} resize(); addEventListener('resize',resize);
let parts=[];
function celebrate(){
  const cols=['#ff5fa2','#ffd23f','#26d7ae','#3fbdf2','#9d4edd','#fff'];
  for(let i=0;i<220;i++) parts.push({x:Math.random()*cv.width,y:-20-Math.random()*cv.height,vx:(Math.random()-.5)*3,vy:2+Math.random()*4,s:6+Math.random()*8,c:cols[i%cols.length],r:Math.random()*6.28,vr:(Math.random()-.5)*.3});
  if(!cf) loopConfetti();
}
let cf=false;
function loopConfetti(){
  cf=true; cx.clearRect(0,0,cv.width,cv.height);
  parts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.r+=p.vr;cx.save();cx.translate(p.x,p.y);cx.rotate(p.r);cx.fillStyle=p.c;cx.fillRect(-p.s/2,-p.s/2,p.s,p.s*.6);cx.restore();});
  parts=parts.filter(p=>p.y<cv.height+30);
  if(parts.length) requestAnimationFrame(loopConfetti); else {cf=false; cx.clearRect(0,0,cv.width,cv.height);}
}
if(window.speechSynthesis) speechSynthesis.getVoices();
reset();
</script>
</body>
</html>
