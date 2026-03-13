// ═══════════════════════════════════════════════════
//  SIDEBAR + MOBILE NAV
// ═══════════════════════════════════════════════════

// Mobile nav active state
function mobSetActive(btn) {
  document.querySelectorAll('.mob-nav-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
}

// Sidebar nav active state
function sbSetActive(el) {
  document.querySelectorAll('.sb-nav-item').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');
}

// Keep mobile nav in sync when any view changes (header keys/sidebar/footer)
document.addEventListener('app:viewchange', e => {
  const name = e.detail?.name || 'clock';
  document.querySelectorAll('.mob-nav-btn[data-view]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === name);
  });
});

// Keep sidebar nav in sync when header nav is clicked
// Keep sidebar nav in sync via viewchange events
document.addEventListener('app:viewchange', e => {
  const name = e.detail?.name || 'clock';
  document.querySelectorAll('.sb-nav-item').forEach(item => {
    item.classList.toggle('active', item.textContent.trim().toLowerCase().startsWith(name.toLowerCase().slice(0,4)));
  });
});

// Sidebar world clocks — show top 4 from worldClocks list
function updateSidebarClocks() {
  const el = document.getElementById('sb-world-clocks');
  if (!el) return;
  const now = new Date();
  const items = worldClocks.slice(0, 5);
  if (!items.length) {
    el.innerHTML = '<div class="sb-fact" style="color:var(--muted);font-size:10px;">Add clocks in the Clock tab</div>';
    return;
  }
  el.innerHTML = items.map(item => {
    const tzDate = new Date(now.toLocaleString('en-US', { timeZone: item.tz }));
    const h = tzDate.getHours(), m = tzDate.getMinutes();
    const dh = is24h ? h : (h % 12 || 12);
    const ampm = is24h ? '' : (h >= 12 ? ' PM' : ' AM');
    const offMins = getTimezoneOffsetMins(item.tz, now);
    return `<div class="sb-clock-item" onclick="switchView('clock',null)" title="${item.tz}">
      <div class="sb-city">${item.city}</div>
      <div class="sb-time">${pad(dh)}:${pad(m)}${ampm}</div>
      <div class="sb-offset">${fmtOffset(offMins)}</div>
    </div>`;
  }).join('');
}

// Sidebar live stats — synced from main tick
function updateSidebarStats() {
  const now = new Date();
  const setSB = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

  setSB('sb-unix', Math.floor(now.getTime() / 1000).toLocaleString());
  setSB('sb-utc', now.toUTCString().split(' ').slice(4,5)[0] + ' UTC');
  const offMin = -now.getTimezoneOffset();
  const oh = Math.floor(Math.abs(offMin)/60), om = Math.abs(offMin)%60;
  setSB('sb-offset', `UTC${offMin>=0?'+':'-'}${pad(oh)}:${pad(om)}`);
  setSB('sb-weekday', `Wk ${getWeek(now)} · Day ${getDoy(now)}`);

  // Sun/Moon from main state
  const srEl = document.getElementById('sunrise-val');
  const ssEl = document.getElementById('sunset-val');
  const dlEl = document.getElementById('daylight-val');
  const mpEl = document.getElementById('moon-phase');
  if (srEl) setSB('sb-sunrise', srEl.textContent);
  if (ssEl) setSB('sb-sunset',  ssEl.textContent);
  if (dlEl) setSB('sb-daylight', dlEl.textContent);
  if (mpEl) setSB('sb-moon', mpEl.textContent);
}

// Sidebar tips — contextual based on current view
const SB_TIPS = {
  clock: [
    '💡 Click a world clock card to jump to the Converter',
    '💡 Press <kbd>L</kbd> to cycle through all themes',
    '💡 Copy your Unix timestamp for use in code',
    '💡 Sunrise times use GPS if you allow location',
  ],
  stopwatch: [
    '💡 Press Space to start / pause',
    '💡 Best lap shown in green, worst in red',
    '💡 Lap times persist until you Reset',
  ],
  timer: [
    '💡 Pomodoro = 25 min focused work + 5 min break',
    '💡 The ring fills as time runs out',
    '💡 Click the number to type a custom time',
  ],
  calendar: [
    '💡 Navigate with ‹ › buttons or arrow keys',
    '💡 Holidays are shown on the calendar grid',
    '💡 Week numbers follow ISO 8601 standard',
  ],
  converter: [
    '💡 Drag ⠿ handles to reorder zones',
    '💡 Green cells = business hours in that zone',
    '💡 Share Link encodes zones into a URL',
    '💡 Hit "Now" to jump back to live time',
  ],
  alarm: [
    '💡 Allow notifications for alarm sounds',
    '💡 Toggle alarms on/off without deleting',
    '💡 Label your alarms to remember what they\'re for',
  ],
};

let currentSbView = 'clock';
function updateSidebarTips(view) {
  currentSbView = view || currentSbView;
  const el = document.getElementById('sb-tips');
  if (!el) return;
  const tips = SB_TIPS[currentSbView] || SB_TIPS.clock;
  el.innerHTML = tips.map(t =>
    `<div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--muted);padding:5px 0;border-bottom:1px solid var(--dim);line-height:1.5;">${t}</div>`
  ).join('');
}

// Rotate "did you know" facts every 30s
const TIME_FACTS = [
  'The Unix epoch started at 00:00:00 UTC on 1 January 1970.',
  'There are 39 distinct UTC offsets in use around the world today.',
  'Nepal has the world\'s most unusual offset: UTC+05:45.',
  'The international date line roughly follows 180° longitude.',
  'Daylight saving time is observed in about 70 countries.',
  'Atomic clocks lose only 1 second every 300 million years.',
  'The longest day of the year is the summer solstice (~June 21).',
  'UTC replaced GMT as the world time standard in 1972.',
  'The second is defined as 9,192,631,770 caesium atom oscillations.',
  'China uses a single timezone (UTC+8) despite spanning 5 geographic zones.',
  'The ISS crosses 16 sunrises and sunsets every 24 hours.',
  'A leap second was last added to UTC on Dec 31, 2016.',
];
let factIdx = Math.floor(Math.random() * TIME_FACTS.length);
function rotateFact() {
  const el = document.getElementById('sb-fact-text');
  if (!el) return;
  el.textContent = TIME_FACTS[factIdx % TIME_FACTS.length];
  factIdx++;
}

document.addEventListener('app:viewchange', e => {
  updateSidebarTips(e.detail?.name || 'clock');
});

// Sidebar tick — every second
function sidebarTick() {
  updateSidebarClocks();
  updateSidebarStats();
}


window.mobSetActive = mobSetActive;
window.sbSetActive = sbSetActive;
window.initSidebarUI = function initSidebarUI(){
  updateSidebarTips('clock');
  rotateFact();
  setInterval(rotateFact, 30000);
  setInterval(sidebarTick, 1000);
  sidebarTick();
};
