// ═══════════════════════════════════════════════════
//  STOPWATCH
// ═══════════════════════════════════════════════════
let swStart = null, swElapsed = 0, swRunning = false, swInterval = null;
let swLaps = [], swLapStart = 0;

function swToggle() {
  swRunning = !swRunning;
  if (swRunning) {
    swStart = Date.now() - swElapsed;
    // Only reset lapStart when starting fresh (not resuming)
    if (swElapsed === 0) swLapStart = Date.now();
    swInterval = setInterval(swTick, 10);
    document.getElementById('sw-start-btn').textContent = 'Pause';
    document.getElementById('sw-start-btn').classList.remove('primary');
    document.getElementById('sw-start-btn').classList.add('danger');
    document.getElementById('sw-lap-btn').disabled = false;
  } else {
    clearInterval(swInterval);
    document.getElementById('sw-start-btn').textContent = 'Resume';
    document.getElementById('sw-start-btn').classList.remove('danger');
    document.getElementById('sw-start-btn').classList.add('primary');
  }
}

function swTick() {
  swElapsed = Date.now() - swStart;
  const t = swElapsed;
  const ms = Math.floor((t%1000)/10);
  const s  = Math.floor(t/1000)%60;
  const m  = Math.floor(t/60000)%60;
  const h  = Math.floor(t/3600000);
  document.getElementById('sw-h').textContent  = pad(h);
  document.getElementById('sw-m').textContent  = pad(m);
  document.getElementById('sw-s').textContent  = pad(s);
  document.getElementById('sw-ms').textContent = pad(ms);
}

function swLap() {
  const lapTime = Date.now() - swLapStart;
  swLapStart = Date.now();
  swLaps.unshift({ n: swLaps.length+1, total: swElapsed, lap: lapTime });
  renderLaps();
}

function renderLaps() {
  const t = document.getElementById('laps-table');
  t.style.display = 'block';
  if (!swLaps.length) { t.style.display='none'; return; }
  const lapTimes = swLaps.map(l=>l.lap);
  const best = Math.min(...lapTimes), worst = Math.max(...lapTimes);
  t.innerHTML = swLaps.map(l => {
    const cls = l.lap===best&&swLaps.length>1?'lap-best':l.lap===worst&&swLaps.length>1?'lap-worst':'';
    return `<div class="lap-row ${cls}">
      <span class="lap-num">LAP ${pad(l.n)}</span>
      <span class="lap-time">${fmtMs(l.lap)}</span>
      <span class="lap-delta">${fmtMs(l.total)}</span>
    </div>`;
  }).join('');
}

function fmtMs(ms) {
  const s = Math.floor(ms/1000)%60, m = Math.floor(ms/60000)%60, h = Math.floor(ms/3600000);
  const centis = Math.floor((ms%1000)/10);
  return `${pad(h)}:${pad(m)}:${pad(s)}.${pad(centis)}`;
}

function swReset() {
  clearInterval(swInterval);
  swRunning=false; swElapsed=0; swStart=null; swLaps=[];
  document.getElementById('sw-h').textContent='00';
  document.getElementById('sw-m').textContent='00';
  document.getElementById('sw-s').textContent='00';
  document.getElementById('sw-ms').textContent='00';
  document.getElementById('sw-start-btn').textContent='Start';
  document.getElementById('sw-start-btn').className='sw-btn primary';
  document.getElementById('sw-lap-btn').disabled=true;
  document.getElementById('laps-table').style.display='none';
  document.getElementById('laps-table').innerHTML='';
}

// ═══════════════════════════════════════════════════
//  TIMER
// ═══════════════════════════════════════════════════
let timerTotal = 0, timerRemaining = 0, timerInterval = null, timerRunning = false;
const CIRCUMFERENCE = 2 * Math.PI * 90; // r=90

function setTimer(h,m,s) {
  timerReset();
  document.getElementById('t-h').value = pad(h);
  document.getElementById('t-m').value = pad(m);
  document.getElementById('t-s').value = pad(s);
}

function timerToggle() {
  if (!timerRunning) {
    if (timerRemaining === 0) {
      const h = parseInt(document.getElementById('t-h').value)||0;
      const m = parseInt(document.getElementById('t-m').value)||0;
      const s = parseInt(document.getElementById('t-s').value)||0;
      timerTotal = (h*3600+m*60+s)*1000;
      timerRemaining = timerTotal;
      if (!timerTotal) return;
    }
    document.getElementById('timer-inputs').style.display = 'none';
    document.getElementById('timer-ring').classList.add('show');
    timerRunning = true;
    document.getElementById('timer-start-btn').textContent = 'Pause';
    timerInterval = setInterval(timerTick, 100);
  } else {
    timerRunning = false;
    clearInterval(timerInterval);
    document.getElementById('timer-start-btn').textContent = 'Resume';
  }
}

function timerTick() {
  timerRemaining -= 100;
  if (timerRemaining <= 0) {
    timerRemaining = 0;
    timerRunning = false;
    clearInterval(timerInterval);
    timerDone();
  }
  updateTimerDisplay();
}

function updateTimerDisplay() {
  const rem = Math.ceil(timerRemaining/1000);
  const h = Math.floor(rem/3600), m = Math.floor((rem%3600)/60), s = rem%60;
  const txt = h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  document.getElementById('timer-ring-text').textContent = txt;
  const pct = timerTotal > 0 ? timerRemaining/timerTotal : 0;
  const offset = CIRCUMFERENCE * (1-pct);
  document.getElementById('timer-ring-fill').style.strokeDashoffset = offset;
  document.getElementById('timer-ring-fill').style.strokeDasharray = CIRCUMFERENCE;
  if (rem <= 10) {
    document.getElementById('timer-ring-fill').style.stroke = 'var(--red)';
    document.getElementById('timer-ring-text').style.color = 'var(--red)';
  }
}

function timerDone() {
  document.getElementById('timer-ring-text').textContent = 'DONE';
  document.getElementById('timer-ring-fill').style.stroke = 'var(--green)';
  document.getElementById('timer-ring-text').style.color = 'var(--green)';
  document.getElementById('timer-start-btn').textContent = 'Start';
  // Browser notification
  if (Notification.permission === 'granted') {
    new Notification('⏱ Timer Done!', {body:'Your timer has finished.'});
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(p => {
      if (p==='granted') new Notification('⏱ Timer Done!',{body:'Your timer has finished.'});
    });
  }
}

function timerReset() {
  clearInterval(timerInterval);
  timerRunning = false; timerRemaining = 0; timerTotal = 0;
  document.getElementById('timer-inputs').style.display = 'flex';
  document.getElementById('timer-ring').classList.remove('show');
  document.getElementById('timer-start-btn').textContent = 'Start';
  document.getElementById('timer-ring-fill').style.stroke = 'var(--accent)';
  document.getElementById('timer-ring-text').style.color = 'var(--text)';
  document.getElementById('timer-ring-fill').style.strokeDashoffset = 0;
}

