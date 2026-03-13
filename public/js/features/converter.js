// ═══════════════════════════════════════════════════
//  TIMEZONE CONVERTER  (multi-zone, drag, search, share)
// ═══════════════════════════════════════════════════

function getTimezoneOffsetMins(tz, date) {
  const utcStr    = date.toLocaleString('en-US', { timeZone: 'UTC' });
  const tzStr     = date.toLocaleString('en-US', { timeZone: tz });
  const utcParsed = new Date(utcStr);
  const tzParsed  = new Date(tzStr);
  return Math.round((tzParsed - utcParsed) / 60000);
}

function fmtOffset(mins) {
  const sign = mins >= 0 ? '+' : '-';
  const abs  = Math.abs(mins);
  return `UTC${sign}${pad(Math.floor(abs/60))}:${pad(abs%60)}`;
}

// ── State ────────────────────────────────────────────
const _localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

// Load from URL params first, then localStorage, then defaults
function convLoadZones() {
  const params = new URLSearchParams(window.location.hash.replace('#','?').replace('/?','?'));
  const urlZones = params.get('zones');
  if (urlZones) {
    const decoded = urlZones.split(',').map(z => z.replace(/\|/g,' ').replace(/ /g,'_'));
    const valid   = decoded.filter(z => ALL_TZ.includes(z));
    if (valid.length) return valid;
  }
  const saved = JSON.parse(localStorage.getItem('convZones') || 'null');
  if (saved && saved.length) return saved;
  return [_localTz, 'America/New_York', 'Europe/London', 'Asia/Tokyo'];
}

let convZones    = convLoadZones();
let convLiveMode = true;
let convDragIdx  = null;
let convSearchFocusIdx = -1;

// Ensure local is in the list
if (!convZones.includes(_localTz)) convZones.unshift(_localTz);

function saveConvZones() {
  localStorage.setItem('convZones', JSON.stringify(convZones));
}

// ── Time helpers ─────────────────────────────────────
function convGetUTCMs() {
  if (convLiveMode) return Date.now();
  const dateEl = document.getElementById('conv-master-date');
  const timeEl = document.getElementById('conv-master-time');
  const dv = dateEl?.value || new Date().toLocaleDateString('en-CA');
  const tv = timeEl?.value || '12:00';
  const [h, m]       = tv.split(':').map(Number);
  const [yr, mo, dy] = dv.split('-').map(Number);
  return new Date(yr, mo-1, dy, h, m, 0).getTime();
}

function convSetToNow() {
  convLiveMode = true;
  const now = new Date();
  const dateEl = document.getElementById('conv-master-date');
  const timeEl = document.getElementById('conv-master-time');
  if (dateEl) dateEl.value = now.toLocaleDateString('en-CA');
  if (timeEl) timeEl.value = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  convSyncSliderToTime();
  convRender();
}

function convUpdate() {
  convLiveMode = false;
  convRender();
}

// ── Search ───────────────────────────────────────────
function convSearchInput(q) {
  const resultsEl = document.getElementById('conv-zone-results');
  convSearchFocusIdx = -1;
  if (!q.trim()) { resultsEl.classList.remove('open'); return; }

  const matches = ALL_TZ
    .filter(tz => tz.toLowerCase().replace(/_/g,' ').includes(q.toLowerCase().trim()))
    .slice(0, 14);

  if (!matches.length) { resultsEl.classList.remove('open'); return; }

  const now = new Date();
  resultsEl.innerHTML = matches.map((tz, i) => {
    const alreadyAdded = convZones.includes(tz);
    const offsetMins   = getTimezoneOffsetMins(tz, now);
    const tzDate       = new Date(now.toLocaleString('en-US', { timeZone: tz }));
    const timeDisp     = tzDate.toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', hour12: !is24h
    });
    return `<div class="conv-zone-result-item${alreadyAdded ? ' already-added' : ''}"
      data-tz="${tz}" data-idx="${i}"
      onclick="convAddFromSearch('${tz}')">
      <span class="czri-name">${tz.replace(/_/g,' ')}</span>
      <span class="czri-meta">
        <span class="czri-offset">${fmtOffset(offsetMins)}</span>
        <span style="color:var(--muted);font-size:11px;">${timeDisp}</span>
        ${alreadyAdded ? '<span class="czri-added">added</span>' : ''}
      </span>
    </div>`;
  }).join('');
  resultsEl.classList.add('open');
}

function convSearchKey(e) {
  const resultsEl = document.getElementById('conv-zone-results');
  const items     = resultsEl.querySelectorAll('.conv-zone-result-item:not(.already-added)');
  if (!items.length) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    convSearchFocusIdx = Math.min(convSearchFocusIdx + 1, items.length - 1);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    convSearchFocusIdx = Math.max(convSearchFocusIdx - 1, 0);
  } else if (e.key === 'Enter' && convSearchFocusIdx >= 0) {
    e.preventDefault();
    const tz = items[convSearchFocusIdx].dataset.tz;
    if (tz) convAddFromSearch(tz);
    return;
  } else if (e.key === 'Escape') {
    resultsEl.classList.remove('open');
    return;
  }

  items.forEach((item, i) => item.classList.toggle('focused', i === convSearchFocusIdx));
  if (convSearchFocusIdx >= 0) items[convSearchFocusIdx].scrollIntoView({ block: 'nearest' });
}

function convAddFromSearch(tz) {
  if (!convZones.includes(tz)) {
    convZones.push(tz);
    saveConvZones();
    convRender();
  }
  const input = document.getElementById('conv-zone-search');
  const results = document.getElementById('conv-zone-results');
  if (input)   { input.value = ''; }
  if (results) { results.classList.remove('open'); }
  convSearchFocusIdx = -1;
}

// Close search on outside click
document.addEventListener('click', e => {
  if (!e.target.closest('.conv-add-bar')) {
    document.getElementById('conv-zone-results')?.classList.remove('open');
  }
});

// ── Remove / change zone ─────────────────────────────
function convRemoveZone(idx) {
  if (convZones.length <= 1) return;
  convZones.splice(idx, 1);
  saveConvZones();
  convRender();
}

function convChangeZone(idx, newTz) {
  convZones[idx] = newTz;
  saveConvZones();
  convRender();
}

// ── Share link ───────────────────────────────────────
function convShare() {
  const timeEl = document.getElementById('conv-master-time');
  const dateEl = document.getElementById('conv-master-date');
  const t = timeEl?.value || '';
  const d = dateEl?.value || '';
  const zonesParam = convZones.join(',');

  // Build a hash-based URL (no server needed)
  const base   = window.location.href.split('#')[0];
  const params = new URLSearchParams();
  params.set('zones', zonesParam);
  if (!convLiveMode && t) params.set('time', t);
  if (!convLiveMode && d) params.set('date', d);
  params.set('view', 'converter');
  const shareUrl = `${base}#${params.toString()}`;

  navigator.clipboard.writeText(shareUrl).then(() => {
    const toast = document.getElementById('conv-share-toast');
    if (toast) {
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2800);
    }
    if(typeof gtag !== 'undefined') trackEvent('share_link', 'engagement', convZones.join(','));
  }).catch(() => {
    // Fallback: show the URL in a prompt
    prompt('Copy this link:', shareUrl);
  });
}

// Handle shared URL on load
function convHandleUrlParams() {
  const params = new URLSearchParams(window.location.hash.slice(1));
  const view = params.get('view');
  if (view === 'converter') {
    // Switch to converter tab
    setTimeout(() => {
      const btn = document.querySelector('.nav-btn[onclick*="converter"]');
      if (btn) { switchView('converter'); btn.classList.add('active'); document.querySelectorAll('.nav-btn').forEach(b=>{ if(b!==btn) b.classList.remove('active'); }); }
    }, 100);
    const t = params.get('time'), d = params.get('date');
    if (t) {
      convLiveMode = false;
      const timeEl = document.getElementById('conv-master-time');
      const dateEl = document.getElementById('conv-master-date');
      if (timeEl) timeEl.value = t;
      if (dateEl && d) dateEl.value = d;
    }
  }
}

// ── Drag-and-drop reorder ────────────────────────────
let dragSrcIdx = null;

function convSetupDrag(card, idx) {
  const handle = card.querySelector('.czc-drag-handle');
  if (!handle) return;

  // Make only the card draggable when handle is grabbed
  handle.addEventListener('mousedown', () => { card.draggable = true; });
  handle.addEventListener('touchstart', () => { card.draggable = true; }, { passive: true });

  card.addEventListener('dragstart', e => {
    dragSrcIdx = idx;
    card.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', idx);
  });

  card.addEventListener('dragend', () => {
    card.draggable = false;
    card.classList.remove('dragging');
    document.querySelectorAll('.conv-zone-card').forEach(c => c.classList.remove('drag-over'));
    dragSrcIdx = null;
  });

  card.addEventListener('dragover', e => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    document.querySelectorAll('.conv-zone-card').forEach(c => c.classList.remove('drag-over'));
    card.classList.add('drag-over');
  });

  card.addEventListener('dragleave', () => {
    card.classList.remove('drag-over');
  });

  card.addEventListener('drop', e => {
    e.preventDefault();
    card.classList.remove('drag-over');
    const destIdx = idx;
    if (dragSrcIdx === null || dragSrcIdx === destIdx) return;

    // Reorder the array
    const moved = convZones.splice(dragSrcIdx, 1)[0];
    convZones.splice(destIdx, 0, moved);
    saveConvZones();
    convRender();
  });
}

// ── Render ───────────────────────────────────────────
const DAYS_SHORT   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function convRender() {
  const utcMs   = convGetUTCMs();
  const refDate = new Date(utcMs);
  const localTz = _localTz;
  const localDateStr = refDate.toLocaleDateString('en-CA', { timeZone: localTz });

  // ── Zone cards ──────────────────────────────────────
  const zonesEl = document.getElementById('conv-zones');
  if (!zonesEl) return;
  zonesEl.innerHTML = '';

  convZones.forEach((tz, idx) => {
    const isLocal    = tz === localTz;
    const offsetMins = getTimezoneOffsetMins(tz, refDate);
    const tzDate     = new Date(refDate.toLocaleString('en-US', { timeZone: tz }));
    const h = tzDate.getHours(), m = tzDate.getMinutes(), s = tzDate.getSeconds();
    const ampm = h >= 12 ? 'PM' : 'AM';
    const dh   = is24h ? h : (h % 12 || 12);
    const timeStr = `${pad(dh)}:${pad(m)}:${pad(s)}`;

    // Day diff vs local zone
    const tzDateStr = refDate.toLocaleDateString('en-CA', { timeZone: tz });
    const [ly,lmo,ld] = localDateStr.split('-').map(Number);
    const [ty,tmo,td] = tzDateStr.split('-').map(Number);
    const dayDiff = Math.round((Date.UTC(ty,tmo-1,td) - Date.UTC(ly,lmo-1,ld)) / 86400000);
    const dayBadgeClass = dayDiff === 0 ? 'same' : dayDiff > 0 ? 'plus1' : 'min1';
    const dayBadgeText  = dayDiff === 0 ? '' : dayDiff > 0 ? '+1 day' : '-1 day';
    const dateDisp = `${DAYS_SHORT[tzDate.getDay()]}, ${MONTHS_SHORT[tzDate.getMonth()]} ${tzDate.getDate()}`;

    const card = document.createElement('div');
    card.className = `conv-zone-card${isLocal ? ' is-local' : ''}`;
    card.dataset.idx = idx;
    card.innerHTML = `
      <div class="czc-left">
        <select class="czc-select" onchange="convChangeZone(${idx}, this.value)">
          ${ALL_TZ.map(t => `<option value="${t}"${t===tz?' selected':''}>${t.replace(/_/g,' ')}</option>`).join('')}
        </select>
        <div class="czc-tz-name">${tz.replace(/_/g,' ')}${isLocal ? ' · <span style="color:var(--accent);font-size:9px;letter-spacing:2px;">YOU</span>' : ''}</div>
        <div class="czc-offset-tag">${fmtOffset(offsetMins)}</div>
      </div>
      <div class="czc-mid">
        <div class="czc-time">${timeStr}</div>
        ${!is24h ? `<div class="czc-ampm">${ampm}</div>` : ''}
        ${dayBadgeText ? `<div class="czc-date-badge ${dayBadgeClass}">${dayBadgeText}</div>` : ''}
        <div class="czc-day-date">${dateDisp}</div>
      </div>
      <div class="czc-right">
        <span class="czc-drag-handle" title="Drag to reorder">⠿</span>
        ${!isLocal ? `<button class="czc-remove" onclick="convRemoveZone(${idx})" title="Remove zone">✕</button>` : ''}
      </div>`;

    convSetupDrag(card, idx);
    zonesEl.appendChild(card);
  });

  // ── UTC offset bar ──────────────────────────────────
  const barWrap = document.getElementById('conv-offset-bar');
  if (barWrap) {
    barWrap.innerHTML = '';
    const allOffsets = convZones.map(tz => getTimezoneOffsetMins(tz, refDate));
    const minOff = Math.min(...allOffsets) - 60;
    const maxOff = Math.max(...allOffsets) + 60;
    const range  = maxOff - minOff || 1;
    const colors = ['var(--accent)','var(--accent2)','var(--accent3)','var(--green)','var(--amber)'];

    convZones.forEach((tz, idx) => {
      const off      = allOffsets[idx];
      const pctStart = ((off - minOff) / range) * 100;
      const barW     = Math.max(6, 80 / convZones.length);
      const color    = colors[idx % colors.length];
      const utcPct   = ((-minOff) / range) * 100;

      const row = document.createElement('div');
      row.className = 'conv-offset-row';
      row.innerHTML = `
        <div class="conv-offset-city">${tz.split('/').pop().replace(/_/g,' ')}</div>
        <div class="conv-offset-track">
          <div class="conv-offset-fill" style="left:${pctStart.toFixed(1)}%;width:${barW.toFixed(1)}%;background:${color}">${fmtOffset(off)}</div>
          <div class="conv-offset-utc-line" style="left:${utcPct.toFixed(1)}%"></div>
        </div>
        <div class="conv-offset-val">${fmtOffset(off)}</div>`;
      barWrap.appendChild(row);
    });
  }

  // ── 24h overlap grid ────────────────────────────────
  const gridWrap = document.getElementById('conv-grid-wrap');
  if (gridWrap) {
    const refTzDate = new Date(refDate.toLocaleString('en-US', { timeZone: convZones[0] }));
    const selHour   = refTzDate.getHours();
    const colors    = ['var(--accent)','var(--accent2)','var(--accent3)','var(--green)','var(--amber)'];

    let html = '<table class="conv-grid-table"><thead><tr><th class="grid-city">Zone</th>';
    for (let h = 0; h < 24; h++) {
      const label = is24h ? pad(h) : (h===0?'12a':h<12?h+'a':h===12?'12p':(h-12)+'p');
      html += `<th>${label}</th>`;
    }
    html += '</tr></thead><tbody>';

    const baseOffMins = getTimezoneOffsetMins(convZones[0], refDate);

    convZones.forEach((tz, idx) => {
      const color      = colors[idx % colors.length];
      const offMins    = getTimezoneOffsetMins(tz, refDate);
      const diffMins   = offMins - baseOffMins;

      html += `<tr><td class="grid-city" style="border-left:3px solid ${color}">${tz.split('/').pop().replace(/_/g,' ')}</td>`;
      for (let h = 0; h < 24; h++) {
        const tzHour  = (((h * 60 + diffMins) % 1440) + 1440) % 1440 / 60 | 0;
        const isWork  = tzHour >= 9 && tzHour < 18;
        const isSleep = tzHour < 7 || tzHour >= 22;
        const isSel   = h === selHour;
        const cls     = isSel ? 'selected-hour' : isWork ? 'work-hour' : isSleep ? 'sleep-hour' : '';
        const label   = is24h ? pad(tzHour) : (tzHour===0?'12a':tzHour<12?tzHour+'a':tzHour===12?'12p':(tzHour-12)+'p');
        html += `<td class="${cls}">${label}</td>`;
      }
      html += '</tr>';
    });

    html += '</tbody></table>';
    gridWrap.innerHTML = html;
  }
}

function convLiveTick() {
  if (convLiveMode) {
    const now = new Date();
    const timeEl = document.getElementById('conv-master-time');
    const dateEl = document.getElementById('conv-master-date');
    if (timeEl) timeEl.value = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    if (dateEl && !dateEl.value) dateEl.value = now.toLocaleDateString('en-CA');
    convSyncSliderToTime();
    convRender();
  }
}

// Stubs for old function names referenced in init
function populateConvSelects() { convInit(); }
function convertTz() {}
function swapConv() {}

// ── SLIDER SYNC ──────────────────────────────────────
function convSliderMove(val) {
  val = parseInt(val);
  const h = Math.floor(val / 60);
  const m = val % 60;
  const timeStr = `${pad(h)}:${pad(m)}`;

  // Update time input
  const timeEl = document.getElementById('conv-master-time');
  if (timeEl) timeEl.value = timeStr;

  // Update big display
  const disp = document.getElementById('conv-slider-display');
  if (disp) {
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12  = h % 12 || 12;
    disp.textContent = is24h ? timeStr : `${pad(h12)}:${pad(m)} ${ampm}`;
  }

  // Update floating thumb label
  const label = document.getElementById('conv-slider-thumb-label');
  if (label) {
    const pct = (val / 1439) * 100;
    label.style.left = `${pct}%`;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12  = h % 12 || 12;
    label.textContent = is24h ? timeStr : `${pad(h12)}:${pad(m)} ${ampm}`;
  }

  // Update fill gradient
  const slider = document.getElementById('conv-time-slider');
  if (slider) {
    const pct = (val / 1439) * 100;
    slider.style.setProperty('--fill', `${pct}%`);
  }

  convLiveMode = false;
  convRender();
}

function convSliderSyncFromTime() {
  const timeEl = document.getElementById('conv-master-time');
  if (!timeEl || !timeEl.value) return;
  const [h, m] = timeEl.value.split(':').map(Number);
  const mins = h * 60 + m;
  const slider = document.getElementById('conv-time-slider');
  if (slider) slider.value = mins;
  convSliderMove(mins);
}

function convSyncSliderToTime() {
  const timeEl = document.getElementById('conv-master-time');
  if (!timeEl) return;
  const [h, m] = (timeEl.value || '12:00').split(':').map(Number);
  const mins = h * 60 + m;
  const slider = document.getElementById('conv-time-slider');
  if (slider) {
    slider.value = mins;
    const pct = (mins / 1439) * 100;
    slider.style.setProperty('--fill', `${pct}%`);
  }
  const label = document.getElementById('conv-slider-thumb-label');
  if (label) {
    const pct = (mins / 1439) * 100;
    label.style.left = `${pct}%`;
    label.textContent = timeEl.value;
  }
  const disp = document.getElementById('conv-slider-display');
  if (disp) disp.textContent = timeEl.value;
}

function convInit() {
  const now = new Date();
  const dateEl = document.getElementById('conv-master-date');
  const timeEl = document.getElementById('conv-master-time');
  if (dateEl) dateEl.value = now.toLocaleDateString('en-CA');
  if (timeEl) timeEl.value = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  convSyncSliderToTime();
  convHandleUrlParams();
  convRender();
  setInterval(convLiveTick, 1000);
}

