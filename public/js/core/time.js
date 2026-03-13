//  HELPERS
// ═══════════════════════════════════════════════════
const ALL_TZ = Intl.supportedValuesOf ? Intl.supportedValuesOf('timeZone') : ['America/New_York','Europe/London','Asia/Tokyo'];

const pad = n => String(n).padStart(2,'0');
const pad3 = n => String(n).padStart(3,'0');

function escapeHTML(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeJsSingleQuoted(value) {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

function getWeek(d) {
  const date = new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));
  date.setUTCDate(date.getUTCDate()+4-(date.getUTCDay()||7));
  const y = new Date(Date.UTC(date.getUTCFullYear(),0,1));
  return Math.ceil((((date-y)/86400000)+1)/7);
}
function getDoy(d) {
  // Use integer math: count days from Jan 1 of that year
  const start = new Date(d.getFullYear(), 0, 1);
  return Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - start) / 86400000) + 1;
}
function isLeap(y) { return (y%4===0&&y%100!==0)||y%400===0; }
function daysInYear(y) { return isLeap(y)?366:365; }

function getOffset(tz) {
  const now = new Date();
  const local = new Date(now.toLocaleString('en-US',{timeZone:tz}));
  const utc   = new Date(now.toLocaleString('en-US',{timeZone:'UTC'}));
  const diff  = (local-utc)/60000;
  const h = Math.floor(Math.abs(diff)/60), m = Math.abs(diff)%60;
  return `UTC${diff>=0?'+':'-'}${pad(h)}:${pad(m)}`;
}

function formatInTz(tz, use24) {
  const now = new Date();
  return now.toLocaleTimeString('en-US',{
    timeZone:tz,
    hour:'2-digit', minute:'2-digit', second:'2-digit',
    hour12:!use24
  });
}

function copyVal(id, type) {
  const val = document.getElementById(id).textContent;
  navigator.clipboard?.writeText(val).then(() => {
    const btns = document.querySelectorAll('.copy-btn');
    btns.forEach(b => { if(b.getAttribute('onclick')?.includes(type)) { b.textContent='✓ Copied'; setTimeout(()=>b.textContent='Copy',1600); }});
    if(typeof gtag !== 'undefined') trackEvent('copy_timestamp', 'engagement', type);
  });
}

// ═══════════════════════════════════════════════════
