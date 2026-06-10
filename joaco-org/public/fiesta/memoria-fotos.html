<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Memoria de Fotos · Cumpleaños</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Baloo+2:wght@500;700;800&display=swap" rel="stylesheet">
<style>
  :root{--pink:#ff5fa2;--grape:#7b3ff2;--sun:#ffd23f;--mint:#26d7ae;--sky:#3fbdf2;--ink:#2a1a4a;}
  *{box-sizing:border-box;margin:0;padding:0;}
  html,body{height:100%;}
  body{font-family:'Fredoka',sans-serif;color:#fff6fb;height:100vh;overflow:hidden;display:flex;flex-direction:column;
    padding:clamp(6px,1.4vh,16px) clamp(10px,2vw,26px);
    background:
      radial-gradient(circle at 15% 15%, rgba(38,215,174,.35), transparent 40%),
      radial-gradient(circle at 85% 18%, rgba(255,210,63,.32), transparent 42%),
      radial-gradient(circle at 82% 88%, rgba(255,95,162,.4), transparent 46%),
      linear-gradient(135deg,#0e7490,#7b3ff2 60%,#ff5fa2);}
  header{display:flex;align-items:center;justify-content:center;gap:10px;flex:none;}
  header h1{font-family:'Baloo 2';font-weight:800;font-size:clamp(20px,3.6vh,38px);color:#fff;
    text-shadow:0 4px 0 rgba(123,63,242,.6),0 8px 22px rgba(0,0,0,.35);}
  header .ico{font-size:clamp(20px,3.4vh,34px);}
  .toolbar{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;align-items:center;margin:6px 0;flex:none;}
  button{font-family:'Fredoka';cursor:pointer;border:none;border-radius:14px;font-weight:600;transition:transform .08s,filter .15s;}
  button:active{transform:translateY(2px);}
  .btn{font-size:clamp(12px,1.9vh,17px);padding:8px 14px;color:#fff;background:rgba(255,255,255,.16);border:2px solid rgba(255,255,255,.3);}
  .btn.primary{background:linear-gradient(180deg,#ff7eb6,var(--pink));border:none;box-shadow:0 4px 0 #c43d78;color:#fff;}
  .btn.gold{background:linear-gradient(180deg,#ffe17a,var(--sun));border:none;box-shadow:0 4px 0 #c79a14;color:#5b3d00;}
  .btn.on{background:var(--mint);border-color:var(--mint);color:#053b30;}
  .btn:disabled{filter:grayscale(.5) brightness(.85);cursor:default;}
  select{font-family:'Fredoka';font-size:clamp(12px,1.9vh,16px);padding:8px 11px;border-radius:12px;border:none;font-weight:600;color:var(--ink);}
  .photocount{font-size:12px;font-weight:600;opacity:.9;background:rgba(255,255,255,.12);padding:6px 11px;border-radius:11px;}
  .scorebar{display:flex;justify-content:center;gap:12px;flex-wrap:wrap;margin:2px 0 6px;flex:none;}
  .team{display:flex;align-items:center;gap:8px;padding:6px 14px;border-radius:14px;font-weight:700;font-size:clamp(13px,2vh,19px);background:rgba(255,255,255,.1);border:3px solid transparent;transition:.2s;}
  .team.active{transform:scale(1.05);box-shadow:0 5px 16px rgba(0,0,0,.3);}
  .team.rosa{border-color:var(--pink);} .team.rosa.active{background:rgba(255,95,162,.35);}
  .team.azul{border-color:var(--sky);} .team.azul.active{background:rgba(63,189,242,.35);}
  .team .pts{font-family:'Baloo 2';font-size:1.3em;color:var(--sun);}
  .solo-stats{font-size:clamp(13px,2vh,18px);font-weight:600;text-align:center;}
  .solo-stats b{color:var(--sun);font-family:'Baloo 2';}

  .grid{flex:1;min-height:0;display:grid;gap:clamp(5px,1.1vh,12px);width:100%;max-width:1200px;margin:0 auto;justify-self:center;}
  .card{position:relative;perspective:900px;cursor:pointer;outline:none;min-height:0;}
  .inner{position:relative;width:100%;height:100%;transition:transform .45s;transform-style:preserve-3d;border-radius:14px;}
  .card.flip .inner,.card.done .inner{transform:rotateY(180deg);}
  .face{position:absolute;inset:0;backface-visibility:hidden;border-radius:14px;display:flex;align-items:center;justify-content:center;overflow:hidden;box-shadow:0 5px 14px rgba(0,0,0,.35);}
  .back{background:radial-gradient(circle at 30% 25%,#fff5,transparent 60%), linear-gradient(135deg,var(--grape),var(--pink));font-size:clamp(22px,5vh,46px);}
  .front{transform:rotateY(180deg);background:#fff;font-size:clamp(26px,7vh,64px);}
  .front img{width:100%;height:100%;object-fit:cover;}
  .card.sel .inner{box-shadow:0 0 0 4px var(--sun),0 6px 18px rgba(0,0,0,.4);border-radius:14px;}
  .card.done{cursor:default;}
  .card.done .inner{box-shadow:0 0 0 4px var(--mint);}
  .hint-bar{flex:none;text-align:center;margin-top:6px;font-size:clamp(11px,1.6vh,14px);opacity:.85;}
  kbd{background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.4);border-radius:6px;padding:1px 7px;font-family:inherit;}
  .winner{position:fixed;inset:0;display:none;align-items:center;justify-content:center;flex-direction:column;background:rgba(20,8,40,.78);z-index:60;gap:16px;text-align:center;padding:20px;}
  .winner.show{display:flex;}
  .winner h2{font-family:'Baloo 2';font-size:clamp(30px,7vh,64px);color:var(--sun);text-shadow:0 4px 14px rgba(0,0,0,.5);}
  .winner p{font-size:clamp(17px,3vh,24px);}
  canvas#confetti{position:fixed;inset:0;pointer-events:none;z-index:55;}
  input[type=file]{display:none;}
  @media (max-width:760px){ body{height:auto;min-height:100vh;overflow:auto;} .grid{min-height:50vh;} }
</style>
</head>
<body>
<canvas id="confetti"></canvas>
<header><span class="ico">📸</span><h1>Memoria de Fotos</h1><span class="ico">💝</span></header>

<div class="toolbar">
  <label class="btn">📁 Cargar fotos<input type="file" id="fileInput" accept="image/*" multiple></label>
  <span class="photocount" id="photoCount">0 fotos</span>
  <select id="pairs">
    <option value="6">Fácil · 6 parejas</option>
    <option value="8" selected>Normal · 8 parejas</option>
    <option value="10">Difícil · 10 parejas</option>
    <option value="12">Experto · 12 parejas</option>
  </select>
  <button class="btn" id="teamsBtn">👯 Equipos</button>
  <button class="btn primary" id="newBtn">🔄 Nueva partida</button>
  <button class="btn gold" id="exportBtn" disabled>💾 Descargar con mis fotos</button>
</div>

<div class="scorebar" id="scorebar"></div>
<div class="grid" id="grid"></div>
<div class="hint-bar">Mando/teclado: <kbd>← ↑ → ↓</kbd> mover · <kbd>Enter</kbd> girar · Para Fire TV, carga las fotos en el ordenador y pulsa <b>Descargar con mis fotos</b>.</div>

<div class="winner" id="winner">
  <h2 id="winnerTitle">¡Bien hecho!</h2>
  <p id="winnerSub"></p>
  <button class="btn primary" id="winnerBtn">🎉 Jugar otra vez</button>
</div>

<script>
var EMBEDDED_PHOTOS = []; /*PHOTOS_PLACEHOLDER*/

const EMOJIS=['🎂','🎈','🦄','🌈','⭐','🍭','🎁','🐱','🦋','🌸','🍓','🐬','🌟','🎀','🍩','🐰','🎪','🍦'];
let photos=[], deck=[], first=null, lock=false, matched=0, sel=0, gridCols=4;
let teamsMode=false, scores=[0,0], turn=0;
const grid=document.getElementById('grid');
const scorebar=document.getElementById('scorebar');
const photoCountEl=document.getElementById('photoCount');
const exportBtn=document.getElementById('exportBtn');

function resizeImage(file){
  return new Promise(res=>{
    const r=new FileReader();
    r.onload=()=>{const img=new Image();
      img.onload=()=>{const max=440,s=Math.min(1,max/Math.max(img.width,img.height));
        const w=Math.round(img.width*s),h=Math.round(img.height*s);
        const c=document.createElement('canvas');c.width=w;c.height=h;
        c.getContext('2d').drawImage(img,0,0,w,h);res(c.toDataURL('image/jpeg',0.82));};
      img.onerror=()=>res(null);img.src=r.result;};
    r.readAsDataURL(file);});
}
document.getElementById('fileInput').addEventListener('change',async e=>{
  for(const f of [...e.target.files]){const d=await resizeImage(f); if(d) photos.push(d);}
  updatePhotoUI(); newGame();
});
function updatePhotoUI(){ photoCountEl.textContent=photos.length+' foto'+(photos.length===1?'':'s'); exportBtn.disabled=photos.length===0; }

function symbols(nPairs){
  const pics=photos.slice(0,nPairs).map(src=>({type:'img',val:src}));
  const need=nPairs-pics.length;
  const emos=EMOJIS.slice(0,need).map(em=>({type:'emoji',val:em}));
  return [...pics,...emos];
}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

function newGame(){
  const nPairs=+document.getElementById('pairs').value;
  const syms=symbols(nPairs);
  deck=shuffle([...syms,...syms].map((s,i)=>({...s,id:i})));
  matched=0;first=null;lock=false;sel=0;scores=[0,0];turn=0;
  render();renderScore();
  document.getElementById('winner').classList.remove('show');
}
function layoutGrid(){
  const W=grid.clientWidth, H=grid.clientHeight, N=deck.length;
  if(!N||W<=0||H<=0) return;
  let C=Math.round(Math.sqrt(N*W/H));
  C=Math.max(2,Math.min(N,C));
  let R=Math.ceil(N/C);
  // reequilibrar si la última fila queda muy vacía
  while(C>2 && (C*R - N) >= C){ C--; R=Math.ceil(N/C); }
  gridCols=C;
  grid.style.gridTemplateColumns='repeat('+C+',1fr)';
  grid.style.gridTemplateRows='repeat('+R+',1fr)';
}
function render(){
  grid.innerHTML='';
  deck.forEach((c,i)=>{
    const card=document.createElement('div');
    card.className='card';card.dataset.i=i;card.tabIndex=0;
    const front=c.type==='img'?'<div class="face front"><img src="'+c.val+'" alt=""></div>':'<div class="face front">'+c.val+'</div>';
    card.innerHTML='<div class="inner"><div class="face back">🎀</div>'+front+'</div>';
    card.addEventListener('click',()=>flip(i));
    grid.appendChild(card);
  });
  layoutGrid();
  updateSel();
}
function cardEl(i){return grid.children[i];}
function flip(i){
  if(lock)return;
  const c=deck[i],el=cardEl(i);
  if(el.classList.contains('done')||el.classList.contains('flip'))return;
  el.classList.add('flip');
  if(first===null){first=i;return;}
  if(first===i)return;
  lock=true;
  const a=deck[first],b=deck[i];
  if(a.val===b.val){
    setTimeout(()=>{cardEl(first).classList.add('done');el.classList.add('done');matched++;
      if(teamsMode){scores[turn]++;renderScore();}
      first=null;lock=false; if(matched===deck.length/2) win();},480);
  } else {
    setTimeout(()=>{cardEl(first).classList.remove('flip');el.classList.remove('flip');first=null;lock=false;
      if(teamsMode){turn=1-turn;renderScore();}},950);
  }
}
function renderScore(){
  if(teamsMode){
    scorebar.innerHTML='<div class="team rosa '+(turn===0?'active':'')+'">🌸 Rosas <span class="pts">'+scores[0]+'</span></div>'+
      '<div class="team azul '+(turn===1?'active':'')+'">💙 Azules <span class="pts">'+scores[1]+'</span></div>';
  } else {
    scorebar.innerHTML='<div class="solo-stats">Parejas encontradas: <b>'+matched+'</b> / '+(deck.length/2)+'</div>';
  }
}
function win(){
  celebrate();
  const w=document.getElementById('winner');
  if(teamsMode){
    let t,s;
    if(scores[0]>scores[1]){t='🌸 ¡Ganan las Rosas!';s=scores[0]+' a '+scores[1];}
    else if(scores[1]>scores[0]){t='💙 ¡Ganan las Azules!';s=scores[1]+' a '+scores[0];}
    else {t='🤝 ¡Empate!';s=scores[0]+' a '+scores[1];}
    document.getElementById('winnerTitle').textContent=t;document.getElementById('winnerSub').textContent=s;
  } else {
    document.getElementById('winnerTitle').textContent='🎉 ¡Completado!';document.getElementById('winnerSub').textContent='¡Todas las parejas encontradas!';
  }
  setTimeout(()=>w.classList.add('show'),700);
}
function updateSel(){ [...grid.children].forEach((el,i)=>el.classList.toggle('sel',i===sel)); }
document.addEventListener('keydown',e=>{
  const total=deck.length; if(!total)return;
  if(e.key==='ArrowRight'){sel=(sel+1)%total;updateSel();e.preventDefault();}
  else if(e.key==='ArrowLeft'){sel=(sel-1+total)%total;updateSel();e.preventDefault();}
  else if(e.key==='ArrowDown'){sel=(sel+gridCols)%total;updateSel();e.preventDefault();}
  else if(e.key==='ArrowUp'){sel=(sel-gridCols+total)%total;updateSel();e.preventDefault();}
  else if(e.key==='Enter'){flip(sel);e.preventDefault();}
});
document.getElementById('newBtn').addEventListener('click',newGame);
document.getElementById('pairs').addEventListener('change',newGame);
document.getElementById('winnerBtn').addEventListener('click',newGame);
document.getElementById('teamsBtn').addEventListener('click',e=>{teamsMode=!teamsMode;e.target.classList.toggle('on',teamsMode);e.target.textContent=teamsMode?'👯 Equipos: ON':'👯 Equipos';newGame();});

exportBtn.addEventListener('click',()=>{
  let html='<!DOCTYPE html>\n'+document.documentElement.outerHTML;
  const rep='var EMBEDDED_PHOTOS = '+JSON.stringify(photos)+'; /*PHOTOS_PLACEHOLDER*/';
  html=html.replace('var EMBEDDED_PHOTOS = []; /*PHOTOS_PLACEHOLDER*/',rep);
  const blob=new Blob([html],{type:'text/html'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='memoria-fotos-LISTO.html';a.click();URL.revokeObjectURL(a.href);
});

const cv=document.getElementById('confetti'),cx=cv.getContext('2d');
function rsz(){cv.width=innerWidth;cv.height=innerHeight;layoutGrid();}rsz();addEventListener('resize',rsz);
let parts=[],cf=false;
function celebrate(){const c=['#ff5fa2','#ffd23f','#26d7ae','#3fbdf2','#9d4edd','#fff'];
  for(let i=0;i<200;i++)parts.push({x:Math.random()*cv.width,y:-20-Math.random()*cv.height,vx:(Math.random()-.5)*3,vy:2+Math.random()*4,s:6+Math.random()*8,c:c[i%c.length],r:Math.random()*6.28,vr:(Math.random()-.5)*.3});
  if(!cf)loop();}
function loop(){cf=true;cx.clearRect(0,0,cv.width,cv.height);
  parts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.r+=p.vr;cx.save();cx.translate(p.x,p.y);cx.rotate(p.r);cx.fillStyle=p.c;cx.fillRect(-p.s/2,-p.s/2,p.s,p.s*.6);cx.restore();});
  parts=parts.filter(p=>p.y<cv.height+30);
  if(parts.length)requestAnimationFrame(loop);else{cf=false;cx.clearRect(0,0,cv.width,cv.height);}}

if(EMBEDDED_PHOTOS&&EMBEDDED_PHOTOS.length){photos=EMBEDDED_PHOTOS.slice();}
updatePhotoUI(); newGame();
</script>
</body>
</html>
