// ═══════════════════════════════════════════════════
//  CALENDAR
// ═══════════════════════════════════════════════════
let calYear = new Date().getFullYear(), calMonth = new Date().getMonth();
const MON = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MSHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ── Calendar Events Store ──
let calEvents = JSON.parse(localStorage.getItem('calEvents') || '[]');
let calPopupDate = null;

const CAT_ICONS = {
  general:'📌', birthday:'🎂', meeting:'💼', gym:'💪',
  yoga:'🧘', class:'🎵', travel:'✈️', holiday:'🎉',
  reminder:'🔔', important:'⚠️'
};
const CAT_COLORS = {
  general:'', birthday:'cat-birthday', meeting:'cat-meeting', gym:'cat-gym',
  yoga:'cat-yoga', class:'cat-class', travel:'cat-travel', holiday:'cat-holiday',
  reminder:'cat-reminder', important:'cat-important'
};

function saveCalEvents() {
  localStorage.setItem('calEvents', JSON.stringify(calEvents));
}

// Returns events for a given date string YYYY-MM-DD (including repeats)
function getEventsForDate(dateStr) {
  const [yr, mo, dy] = dateStr.split('-').map(Number);
  const target = new Date(yr, mo-1, dy);
  return calEvents.filter(ev => {
    const evDate = new Date(ev.date);
    if (ev.date === dateStr) return true;
    if (ev.repeat === 'yearly'  && evDate.getMonth()===mo-1 && evDate.getDate()===dy && evDate.getFullYear()<=yr) return true;
    if (ev.repeat === 'monthly' && evDate.getDate()===dy && evDate <= target) return true;
    if (ev.repeat === 'weekly') {
      const diffDays = Math.round((target - evDate) / 86400000);
      return diffDays >= 0 && diffDays % 7 === 0;
    }
    // Multi-day block
    if (ev.endDate) {
      const end = new Date(ev.endDate);
      return target >= evDate && target <= end;
    }
    return false;
  });
}

function dateKey(yr, mo, dy) {
  return `${yr}-${String(mo+1).padStart(2,'0')}-${String(dy).padStart(2,'0')}`;
}

function renderCalendar() {
  document.getElementById('cal-month-title').textContent = MON[calMonth];
  document.getElementById('cal-year-title').textContent  = calYear;

  // Sync jump selects
  const jm = document.getElementById('cal-jump-month');
  const jy = document.getElementById('cal-jump-year');
  if (jm) jm.value = calMonth;
  if (jy) jy.value = calYear;

  const grid = document.getElementById('cal-grid');
  grid.innerHTML = '';
  ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(d => {
    const el = document.createElement('div');
    el.className = 'cal-day-name'; el.textContent = d;
    grid.appendChild(el);
  });

  const first = new Date(calYear,calMonth,1).getDay();
  const total = new Date(calYear,calMonth+1,0).getDate();
  const today = new Date();
  const holidays = getHolidays(calYear);

  // Prev month filler
  for (let i=0;i<first;i++) {
    const prevDay = new Date(calYear, calMonth, 0 - (first - 1 - i));
    const el = document.createElement('div');
    el.className = 'cal-day other-month';
    el.innerHTML = `<span class="cal-day-num">${prevDay.getDate()}</span>`;
    grid.appendChild(el);
  }

  // Current month days
  for (let d=1;d<=total;d++) {
    const el = document.createElement('div');
    const isToday = d===today.getDate()&&calMonth===today.getMonth()&&calYear===today.getFullYear();
    const dk = dateKey(calYear, calMonth, d);
    const dayEvs = getEventsForDate(dk);
    const hol = holidays.find(h=>h.date.getMonth()===calMonth&&h.date.getDate()===d);

    let cls = 'cal-day' + (isToday?' today':'');
    if (dayEvs.length > 0) cls += ' has-events';
    el.className = cls;

    let inner = `<span class="cal-day-num">${d}</span>`;
    if (hol) inner += `<span class="cal-day-event cat-holiday">${CAT_ICONS.holiday} ${escapeHTML(hol.name)}</span>`;

    const maxShow = hol ? 1 : 2;
    dayEvs.slice(0, maxShow).forEach(ev => {
      const catCls = CAT_COLORS[ev.category] || '';
      inner += `<span class="cal-day-event ${catCls}">${CAT_ICONS[ev.category]||'📌'} ${escapeHTML(ev.title)}</span>`;
    });
    if (dayEvs.length > maxShow) {
      inner += `<span class="cal-more-badge">+${dayEvs.length - maxShow} more</span>`;
    }

    el.innerHTML = inner;
    el.addEventListener('click', () => calOpenDayPopup(dk, el));
    grid.appendChild(el);
  }

  // Next month filler
  const remaining = 42 - first - total;
  for (let i=1;i<=remaining;i++) {
    const el = document.createElement('div');
    el.className = 'cal-day other-month';
    el.innerHTML = `<span class="cal-day-num">${i}</span>`;
    grid.appendChild(el);
  }

  // Side info
  const side = document.getElementById('cal-side');
  const diy = daysInYear(calYear);
  const wks = getWeek(new Date(calYear,calMonth,1));

  // Upcoming events in month
  const monthEvs = [];
  for (let d=1;d<=total;d++) {
    const dk = dateKey(calYear, calMonth, d);
    getEventsForDate(dk).forEach(ev => monthEvs.push({...ev, _day:d}));
  }

  side.innerHTML = `
    <div class="cal-info-card">
      <div class="cal-info-title">Month Info</div>
      <div class="cal-info-item"><span class="cal-info-key">Days in month</span><span class="cal-info-val">${total}</span></div>
      <div class="cal-info-item"><span class="cal-info-key">Starts on</span><span class="cal-info-val">${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date(calYear,calMonth,1).getDay()]}</span></div>
      <div class="cal-info-item"><span class="cal-info-key">Week numbers</span><span class="cal-info-val">${wks}–${wks+3}</span></div>
      <div class="cal-info-item"><span class="cal-info-key">Leap year</span><span class="cal-info-val">${isLeap(calYear)?'Yes ✓':'No'}</span></div>
    </div>
    <div class="cal-info-card">
      <div class="cal-info-title">Events This Month</div>
      ${monthEvs.length
        ? monthEvs.slice(0,6).map(ev => `
          <div class="cal-info-item" onclick="calOpenDayPopup('${dateKey(calYear,calMonth,ev._day)}',null)" style="cursor:pointer">
            <span class="cal-info-key" style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${CAT_ICONS[ev.category]||'📌'} ${escapeHTML(ev.title)}</span>
            <span class="cal-info-val">${MSHORT[calMonth]} ${ev._day}</span>
          </div>`).join('') + (monthEvs.length>6 ? `<div style="font-size:10px;color:var(--muted);padding:8px 0;font-family:'DM Mono',monospace;">+${monthEvs.length-6} more events</div>` : '')
        : '<div style="font-family:DM Mono,monospace;font-size:11px;color:var(--muted);padding:8px 0;">No events — click any day or use + Add Event</div>'
      }
    </div>
    <div class="cal-info-card">
      <div class="cal-info-title">Holidays This Month</div>
      ${holidays.filter(h=>h.date.getMonth()===calMonth).length
        ? holidays.filter(h=>h.date.getMonth()===calMonth).map(h=>`
          <div class="cal-info-item">
            <span class="cal-info-key">${escapeHTML(h.name)}</span>
            <span class="cal-info-val">${MSHORT[h.date.getMonth()]} ${h.date.getDate()}</span>
          </div>`).join('')
        : '<div style="font-family:DM Mono,monospace;font-size:11px;color:var(--muted);padding:8px 0;">None</div>'
      }
    </div>`;
}

// ── Navigation ──
function calNav(dir) {
  calMonth+=dir;
  if(calMonth>11){calMonth=0;calYear++;}
  if(calMonth<0){calMonth=11;calYear--;}
  renderCalendar();
}
function calJump(months) {
  calMonth += months;
  while(calMonth>11){calMonth-=12;calYear++;}
  while(calMonth<0){calMonth+=12;calYear--;}
  renderCalendar();
}
function calToday() {
  calYear=new Date().getFullYear();
  calMonth=new Date().getMonth();
  renderCalendar();
}
function calJumpTo() {
  const mo = parseInt(document.getElementById('cal-jump-month').value);
  const yr = parseInt(document.getElementById('cal-jump-year').value);
  if(yr>=1900&&yr<=2100){ calMonth=mo; calYear=yr; renderCalendar(); }
}

// ── Day Popup ──
function calOpenDayPopup(dateStr, triggerEl) {
  calPopupDate = dateStr;
  const [yr, mo, dy] = dateStr.split('-').map(Number);
  const popup = document.getElementById('cal-day-popup');
  const dateDisp = new Date(yr, mo-1, dy);
  document.getElementById('cal-day-popup-date').textContent =
    `${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dateDisp.getDay()]} ${MSHORT[mo-1]} ${dy}, ${yr}`;

  const evs = getEventsForDate(dateStr);
  const hols = getHolidays(yr).filter(h=>h.date.getMonth()===mo-1&&h.date.getDate()===dy);
  const list = document.getElementById('cal-day-popup-list');

  if (!evs.length && !hols.length) {
    list.innerHTML = `<div class="cal-popup-empty">No events — click + Add to create one</div>`;
  } else {
    list.innerHTML = [
      ...hols.map(h=>`<div class="cal-popup-event" style="border-left-color:#facc15;">
        <div class="cal-popup-event-info">
          <div class="cal-popup-event-title">🎉 ${escapeHTML(h.name)}</div>
          <div class="cal-popup-event-meta">Public Holiday</div>
        </div></div>`),
      ...evs.map(ev=>`<div class="cal-popup-event" style="border-left-color:${catColor(ev.category)};cursor:pointer" onclick="calEditEvent('${escapeJsSingleQuoted(ev.id)}')">
        <div class="cal-popup-event-info">
          <div class="cal-popup-event-title">${CAT_ICONS[ev.category]||'📌'} ${escapeHTML(ev.title)}</div>
          <div class="cal-popup-event-meta">${escapeHTML(ev.time||'All day')} ${ev.repeat&&ev.repeat!=='none'?'· 🔁 '+escapeHTML(ev.repeat):''} ${ev.reminder?'· 🔔':''}</div>
          ${ev.notes?`<div class="cal-popup-event-meta" style="margin-top:2px;opacity:0.7">${escapeHTML(ev.notes)}</div>`:''}
        </div>
        <button class="cal-popup-event-del" onclick="event.stopPropagation();calDeleteEventById('${escapeJsSingleQuoted(ev.id)}')">✕</button>
      </div>`)
    ].join('');
  }

  // Position popup near click
  popup.classList.add('open');
  if (triggerEl) {
    const rect = triggerEl.getBoundingClientRect();
    const pw = 320, ph = 420;
    let top = rect.bottom + 4;
    let left = rect.left;
    if (left + pw > window.innerWidth - 10) left = window.innerWidth - pw - 10;
    if (top + ph > window.innerHeight - 10) top = rect.top - ph - 4;
    popup.style.top = `${top}px`;
    popup.style.left = `${left}px`;
  } else {
    popup.style.top = '50%'; popup.style.left = '50%';
    popup.style.transform = 'translate(-50%,-50%)';
  }
}

function catColor(cat) {
  const m = {birthday:'#f472b6',meeting:'#60a5fa',gym:'#34d399',yoga:'#a78bfa',
    class:'#fb923c',travel:'#38bdf8',holiday:'#facc15',reminder:'#c084fc',important:'#f87171'};
  return m[cat]||'var(--accent2)';
}

function calCloseDayPopup() {
  const p = document.getElementById('cal-day-popup');
  p.classList.remove('open');
  p.style.transform = '';
}

// Close popup on outside click
document.addEventListener('click', e => {
  const popup = document.getElementById('cal-day-popup');
  if (!popup) return;
  if (!popup.contains(e.target) && !e.target.closest('.cal-day')) {
    calCloseDayPopup();
  }
});

// ── Add / Edit Modal ──
function calOpenAddEvent(preDate) {
  calCloseDayPopup();
  document.getElementById('cal-modal-title').textContent = 'Add Event';
  document.getElementById('cal-event-id').value = '';
  document.getElementById('cal-ev-title').value = '';
  document.getElementById('cal-ev-date').value = preDate || new Date().toLocaleDateString('en-CA');
  document.getElementById('cal-ev-time').value = '';
  document.getElementById('cal-ev-end').value = '';
  document.getElementById('cal-ev-cat').value = 'general';
  document.getElementById('cal-ev-reminder').value = '';
  document.getElementById('cal-ev-notes').value = '';
  document.getElementById('cal-ev-repeat').value = 'none';
  document.getElementById('cal-modal-delete-btn').style.display = 'none';
  document.getElementById('cal-modal-overlay').classList.add('open');
  setTimeout(()=>document.getElementById('cal-ev-title').focus(), 100);
}

function calEditEvent(id) {
  const ev = calEvents.find(e=>e.id===id);
  if (!ev) return;
  calCloseDayPopup();
  document.getElementById('cal-modal-title').textContent = 'Edit Event';
  document.getElementById('cal-event-id').value = ev.id;
  document.getElementById('cal-ev-title').value = ev.title;
  document.getElementById('cal-ev-date').value = ev.date;
  document.getElementById('cal-ev-time').value = ev.time||'';
  document.getElementById('cal-ev-end').value = ev.endDate||'';
  document.getElementById('cal-ev-cat').value = ev.category||'general';
  document.getElementById('cal-ev-reminder').value = ev.reminder||'';
  document.getElementById('cal-ev-notes').value = ev.notes||'';
  document.getElementById('cal-ev-repeat').value = ev.repeat||'none';
  document.getElementById('cal-modal-delete-btn').style.display = 'block';
  document.getElementById('cal-modal-overlay').classList.add('open');
}

function calSaveEvent() {
  const title = document.getElementById('cal-ev-title').value.trim();
  const date  = document.getElementById('cal-ev-date').value;
  if (!title || !date) {
    document.getElementById('cal-ev-title').style.borderColor = 'var(--red)';
    return;
  }
  document.getElementById('cal-ev-title').style.borderColor = '';
  const id = document.getElementById('cal-event-id').value;
  const ev = {
    id: id || `ev_${Date.now()}`,
    title,
    date,
    time:      document.getElementById('cal-ev-time').value,
    endDate:   document.getElementById('cal-ev-end').value,
    category:  document.getElementById('cal-ev-cat').value,
    reminder:  document.getElementById('cal-ev-reminder').value,
    notes:     document.getElementById('cal-ev-notes').value,
    repeat:    document.getElementById('cal-ev-repeat').value,
  };
  if (id) {
    const idx = calEvents.findIndex(e=>e.id===id);
    if (idx>=0) calEvents[idx]=ev;
  } else {
    calEvents.push(ev);
  }
  saveCalEvents();
  calCloseModalDirect();
  // Navigate to the event's month
  const [yr,mo] = date.split('-').map(Number);
  calYear=yr; calMonth=mo-1;
  renderCalendar();
  // Request notification permission
  if (ev.reminder !== '' && Notification.permission==='default') Notification.requestPermission();
  trackEvent && trackEvent('add_calendar_event', 'calendar', ev.category);
}

function calDeleteEvent() {
  const id = document.getElementById('cal-event-id').value;
  calDeleteEventById(id);
  calCloseModalDirect();
}

function calDeleteEventById(id) {
  calEvents = calEvents.filter(e=>e.id!==id);
  saveCalEvents();
  calCloseDayPopup();
  renderCalendar();
}

function calCloseModal(e) {
  if (e.target === document.getElementById('cal-modal-overlay')) calCloseModalDirect();
}
function calCloseModalDirect() {
  document.getElementById('cal-modal-overlay').classList.remove('open');
}

// ── Event Reminders ──
function checkCalEventReminders() {
  const now = new Date();
  const todayStr = now.toLocaleDateString('en-CA');
  const nowMins  = now.getHours()*60 + now.getMinutes();
  calEvents.forEach(ev => {
    if (!ev.time || ev.reminder==='') return;
    if (ev.date !== todayStr) return;
    const [eh,em] = ev.time.split(':').map(Number);
    const evMins = eh*60 + em;
    const reminderMins = parseInt(ev.reminder)||0;
    const triggerMins = evMins - reminderMins;
    // Fire within a 1-minute window
    if (nowMins === triggerMins && Notification.permission==='granted') {
      const msg = reminderMins===0 ? `"${ev.title}" is now!` : `"${ev.title}" in ${reminderMins} min`;
      new Notification(`${CAT_ICONS[ev.category]||'📌'} Event Reminder`, { body: msg });
    }
  });
}
setInterval(checkCalEventReminders, 60000);

