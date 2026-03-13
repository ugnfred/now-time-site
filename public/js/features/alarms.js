// ═══════════════════════════════════════════════════
//  ALARMS
// ═══════════════════════════════════════════════════
function renderAlarms() {
  const list = document.getElementById('alarms-list');
  if (!alarms.length) {
    list.innerHTML = '<div style="padding:24px;text-align:center;font-family:\'DM Mono\',monospace;font-size:11px;color:var(--muted);letter-spacing:2px;">NO ALARMS SET</div>';
    return;
  }
  list.innerHTML = alarms.map((a,i) => `
    <div class="alarm-item">
      <div class="alarm-item-time">${a.time}</div>
      <div class="alarm-item-info">
        <div class="alarm-item-label">${a.label||'Alarm'}</div>
        <div class="alarm-item-countdown" id="alarm-cd-${i}">—</div>
      </div>
      <label class="alarm-toggle">
        <input type="checkbox" ${a.enabled?'checked':''} onchange="toggleAlarm(${i},this.checked)">
        <span class="alarm-slider"></span>
      </label>
      <button class="alarm-del-btn" onclick="deleteAlarm(${i})">✕</button>
    </div>`).join('');
}

function addAlarm() {
  const timeVal = document.getElementById('alarm-time-input').value;
  const label   = document.getElementById('alarm-label-input').value;
  if (!timeVal) return;
  alarms.push({time:timeVal,label,enabled:true});
  localStorage.setItem('alarms',JSON.stringify(alarms));
  renderAlarms();
  document.getElementById('alarm-label-input').value = '';
}

function toggleAlarm(i,v) {
  alarms[i].enabled = v;
  localStorage.setItem('alarms',JSON.stringify(alarms));
}

function deleteAlarm(i) {
  alarms.splice(i,1);
  localStorage.setItem('alarms',JSON.stringify(alarms));
  renderAlarms();
}

let firedAlarm = null;
let lastAlarmMinute = -1;

function checkAlarms(now) {
  const hm      = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const nowMins = now.getHours() * 60 + now.getMinutes();

  // Update countdowns every tick
  alarms.forEach((a, i) => {
    const el = document.getElementById(`alarm-cd-${i}`);
    if (!el) return;
    const [ah, am] = a.time.split(':').map(Number);
    const alarmMins = ah * 60 + am;
    let diff = alarmMins - nowMins;
    if (diff < 0) diff += 1440;
    const dh = Math.floor(diff / 60), dm = diff % 60;
    el.textContent = !a.enabled ? 'Disabled'
      : diff === 0 ? 'Ringing…'
      : `in ${dh > 0 ? dh + 'h ' : ''}${dm}min`;
  });

  // Fire alarm — use minute-level deduplication instead of seconds===0
  // so background tabs don't miss the trigger
  if (nowMins === lastAlarmMinute) return;
  lastAlarmMinute = nowMins;

  alarms.forEach(a => {
    if (a.enabled && a.time === hm && firedAlarm !== hm) {
      firedAlarm = hm;
      document.getElementById('alarm-fired-time').textContent  = a.time;
      document.getElementById('alarm-fired-label').textContent = a.label || 'Alarm';
      document.getElementById('alarm-fired-overlay').classList.add('show');
      playAlarmSound();
      if (Notification.permission === 'granted') {
        new Notification('⏰ Alarm!', { body: a.label || 'Your alarm is ringing!' });
      }
    }
  });
}

function dismissAlarm() {
  document.getElementById('alarm-fired-overlay').classList.remove('show');
  stopAlarmSound();
  setTimeout(() => firedAlarm=null, 60000);
}

// ═══════════════════════════════════════════════════
//  ALARM SOUND (Web Audio API)
// ═══════════════════════════════════════════════════
let alarmAudioCtx = null;
let alarmSoundNodes = [];

function playAlarmSound() {
  stopAlarmSound();
  try {
    alarmAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    function beepCycle() {
      if (!alarmAudioCtx) return;
      const freqs = [880, 1100, 880, 1100];
      freqs.forEach((freq, i) => {
        const osc  = alarmAudioCtx.createOscillator();
        const gain = alarmAudioCtx.createGain();
        osc.connect(gain);
        gain.connect(alarmAudioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, alarmAudioCtx.currentTime + i * 0.18);
        gain.gain.setValueAtTime(0, alarmAudioCtx.currentTime + i * 0.18);
        gain.gain.linearRampToValueAtTime(0.7, alarmAudioCtx.currentTime + i * 0.18 + 0.02);
        gain.gain.linearRampToValueAtTime(0, alarmAudioCtx.currentTime + i * 0.18 + 0.16);
        osc.start(alarmAudioCtx.currentTime + i * 0.18);
        osc.stop(alarmAudioCtx.currentTime + i * 0.18 + 0.18);
        alarmSoundNodes.push(osc);
      });
    }
    beepCycle();
    // Repeat every 1.2 seconds
    const iv = setInterval(() => { if (!alarmAudioCtx) { clearInterval(iv); return; } beepCycle(); }, 1200);
    alarmSoundNodes.push({ stop: () => clearInterval(iv) });
  } catch(e) { console.warn('Audio not supported:', e); }
}

function stopAlarmSound() {
  if (alarmAudioCtx) {
    try { alarmAudioCtx.close(); } catch(e) {}
    alarmAudioCtx = null;
  }
  alarmSoundNodes = [];
}

