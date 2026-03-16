// ═══════════════════════════════════════════════════
//  THEME SYSTEM
// ═══════════════════════════════════════════════════
const THEMES = [
  { id:'dark',    name:'Midnight',  bg:'#0a0a0f', surface:'#111118', surface2:'#16161f', dim:'#0d0d14', border:'#1e1e2e', text:'#e8e8f0', muted:'#6b6b8a', accent:'#7c3aed', accent2:'#06b6d4', accent3:'#f43f5e', green:'#10b981', amber:'#f59e0b', red:'#f43f5e' },
  { id:'light',   name:'Daylight',  bg:'#f8f9fa', surface:'#ffffff', surface2:'#f0f2f5', dim:'#e8eaed', border:'#dadce0', text:'#202124', muted:'#80868b', accent:'#1a73e8', accent2:'#0f9d58', accent3:'#ea4335', green:'#0f9d58', amber:'#f9ab00', red:'#ea4335' },
  { id:'sepia',   name:'Sepia',     bg:'#f5f0e8', surface:'#faf7f2', surface2:'#f0ebe0', dim:'#e8e0d0', border:'#d4c8b0', text:'#2c2416', muted:'#8c7b5e', accent:'#b5591a', accent2:'#5b8c1a', accent3:'#c0392b', green:'#5b8c1a', amber:'#d4841a', red:'#c0392b' },
  { id:'slate',   name:'Slate',     bg:'#0d1117', surface:'#161b22', surface2:'#1c2128', dim:'#0d1117', border:'#30363d', text:'#e6edf3', muted:'#7d8590', accent:'#58a6ff', accent2:'#3fb950', accent3:'#f85149', green:'#3fb950', amber:'#d29922', red:'#f85149' },
  { id:'navy',    name:'Navy',      bg:'#0a0e1a', surface:'#0f1629', surface2:'#141e35', dim:'#080c14', border:'#1e2d50', text:'#d4e0f7', muted:'#5c7aaa', accent:'#7eb8f7', accent2:'#4ecdc4', accent3:'#ff6b9d', green:'#4ecdc4', amber:'#ffd93d', red:'#ff6b9d' },
  { id:'rose',    name:'Rose',      bg:'#1a0e10', surface:'#221318', surface2:'#2a181e', dim:'#140a0c', border:'#3d2030', text:'#f5e6ea', muted:'#9e6070', accent:'#f9a8c8', accent2:'#fb7185', accent3:'#fbbf24', green:'#86efac', amber:'#fbbf24', red:'#fb7185' },
  { id:'forest',  name:'Forest',    bg:'#0a1208', surface:'#0f1a0e', surface2:'#142014', dim:'#080e07', border:'#1e3020', text:'#e0f0dc', muted:'#6a9060', accent:'#8fdc5e', accent2:'#5ecdc8', accent3:'#dc8f5e', green:'#8fdc5e', amber:'#dccc5e', red:'#dc5e5e' },
  { id:'purple',  name:'Neon',      bg:'#0d0a1a', surface:'#130f22', surface2:'#18142a', dim:'#0a0814', border:'#2a2040', text:'#ede8ff', muted:'#7060a0', accent:'#c084fc', accent2:'#67e8f9', accent3:'#f0abfc', green:'#4ade80', amber:'#fbbf24', red:'#f87171' },
  { id:'mono',    name:'Mono',      bg:'#0a0a0a', surface:'#111111', surface2:'#181818', dim:'#0d0d0d', border:'#2a2a2a', text:'#e8e8e8', muted:'#606060', accent:'#ffffff', accent2:'#c0c0c0', accent3:'#808080', green:'#a0a0a0', amber:'#c0c0c0', red:'#808080' },
];

const ACCENTS = [
  { name:'Purple',  accent:'#7c3aed', accent2:'#06b6d4', accent3:'#f43f5e' },
  { name:'Cyan',    accent:'#06b6d4', accent2:'#7c3aed', accent3:'#f43f5e' },
  { name:'Green',   accent:'#10b981', accent2:'#06b6d4', accent3:'#f59e0b' },
  { name:'Orange',  accent:'#f97316', accent2:'#06b6d4', accent3:'#7c3aed' },
  { name:'Pink',    accent:'#ec4899', accent2:'#8b5cf6', accent3:'#06b6d4' },
  { name:'Gold',    accent:'#f59e0b', accent2:'#10b981', accent3:'#7c3aed' },
  { name:'Red',     accent:'#ef4444', accent2:'#f97316', accent3:'#06b6d4' },
  { name:'Lime',    accent:'#84cc16', accent2:'#06b6d4', accent3:'#f59e0b' },
];

let currentTheme = localStorage.getItem('theme') || 'purple';
let currentAccentOverride = JSON.parse(localStorage.getItem('accentOverride') || 'null');

function applyTheme(id) {
  const theme = THEMES.find(t => t.id === id) || THEMES[0];
  currentTheme = id;
  localStorage.setItem('theme', id);

  const root = document.documentElement;
  root.setAttribute('data-theme', id);

  const vars = {
    '--bg':       theme.bg,
    '--surface':  theme.surface,
    '--surface2': theme.surface2,
    '--dim':      theme.dim,
    '--border':   theme.border,
    '--text':     theme.text,
    '--muted':    theme.muted,
    '--green':    theme.green,
    '--amber':    theme.amber,
    '--red':      theme.red,
  };

  // Apply accent — use override if set, else theme default
  const acc = currentAccentOverride || { accent: theme.accent, accent2: theme.accent2, accent3: theme.accent3 };
  vars['--accent']  = acc.accent;
  vars['--accent2'] = acc.accent2;
  vars['--accent3'] = acc.accent3;

  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));

  // Update theme card UI
  document.querySelectorAll('.theme-card').forEach(c => {
    c.classList.toggle('active', c.dataset.id === id);
  });

  // Update format buttons
  const is24 = typeof is24h !== 'undefined' ? is24h : false;
  const f12 = document.getElementById('fmt-12');
  const f24 = document.getElementById('fmt-24');
  if (f12) f12.classList.toggle('active', !is24);
  if (f24) f24.classList.toggle('active', is24);
}

function setFmt(use24) {
  if (typeof is24h !== 'undefined') {
    is24h = use24;
    localStorage.setItem('is24h', use24);
    document.getElementById('h24-btn').style.color = use24 ? 'var(--accent)' : '';
    if (typeof updateSun === 'function') updateSun();
  }
  const f12 = document.getElementById('fmt-12');
  const f24 = document.getElementById('fmt-24');
  if (f12) f12.classList.toggle('active', !use24);
  if (f24) f24.classList.toggle('active', use24);
}

function toggleThemePanel() {
  document.getElementById('theme-panel').classList.toggle('open');
  document.getElementById('theme-overlay').classList.toggle('open');
}

function closeThemePanel() {
  document.getElementById('theme-panel').classList.remove('open');
  document.getElementById('theme-overlay').classList.remove('open');
}

function renderThemeCards() {
  const container = document.getElementById('theme-cards');
  if (!container) return;
  container.innerHTML = THEMES.map(t => `
    <div class="theme-card ${t.id === currentTheme ? 'active' : ''}" data-id="${t.id}" onclick="applyTheme('${t.id}')"
      style="--tc-bg:${t.bg};--tc-surface:${t.surface};--tc-accent:${t.accent};--tc-accent2:${t.accent2};">
      <div class="tc-preview">
        <div class="tc-bar" style="background:${t.accent}"></div>
        <div class="tc-bar" style="background:${t.accent2}"></div>
        <div class="tc-bar" style="background:${t.accent3}"></div>
      </div>
      <div class="tc-name">${t.name}</div>
    </div>`).join('');
}

function renderAccentRow() {
  const container = document.getElementById('accent-row');
  if (!container) return;
  container.innerHTML = ACCENTS.map((a, i) => `
    <div class="accent-dot" title="${a.name}"
      style="background:${a.accent};box-shadow:${currentAccentOverride?.accent===a.accent?'0 0 0 2px var(--bg),0 0 0 4px '+a.accent:'none'}"
      onclick="applyAccent(${i})"></div>`).join('');
}

function applyAccent(idx) {
  currentAccentOverride = ACCENTS[idx];
  localStorage.setItem('accentOverride', JSON.stringify(currentAccentOverride));
  applyTheme(currentTheme);
  renderAccentRow();
}

function initThemeUI() {
  renderThemeCards();
  renderAccentRow();
  applyTheme(currentTheme);
}

window.applyTheme      = applyTheme;
window.toggleThemePanel = toggleThemePanel;
window.closeThemePanel  = closeThemePanel;
window.setFmt           = setFmt;
window.initThemeUI      = initThemeUI;
window.THEMES           = THEMES;
window.currentTheme     = currentTheme;
