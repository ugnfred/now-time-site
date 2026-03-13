// ═══════════════════════════════════════════════════
//  THEME SYSTEM
// ═══════════════════════════════════════════════════
const THEMES = [
  { id:'dark',   name:'Midnight',  bg:'#0a0a0f', surface:'#111118', accent:'#c8f060', text:'#e8e8f0', border:'#1e1e2e' },
  { id:'light',  name:'Daylight',  bg:'#f8f9fa', surface:'#ffffff', accent:'#1a73e8', text:'#202124', border:'#dadce0' },
  { id:'sepia',  name:'Sepia',     bg:'#f5f0e8', surface:'#faf7f2', accent:'#b5591a', text:'#2c2416', border:'#d4c8b0' },
  { id:'slate',  name:'Slate',     bg:'#0d1117', surface:'#161b22', accent:'#58a6ff', text:'#e6edf3', border:'#30363d' },
  { id:'navy',   name:'Navy',      bg:'#0a0e1a', surface:'#0f1629', accent:'#7eb8f7', text:'#d4e0f7', border:'#1e2d50' },
  { id:'rose',   name:'Rose',      bg:'#1a0e10', surface:'#221318', accent:'#f9a8c8', text:'#f5e6ea', border:'#3d2030' },
  { id:'forest', name:'Forest',    bg:'#0a1208', surface:'#0f1a0e', accent:'#8fdc5e', text:'#e0f0dc', border:'#1e3020' },
  { id:'dusk',   name:'Dusk',      bg:'#0e0b18', surface:'#150f22', accent:'#b89ef8', text:'#e8e0f8', border:'#2e2050' },
  { id:'mono',   name:'Mono',      bg:'#111111', surface:'#1a1a1a', accent:'#ffffff', text:'#f0f0f0', border:'#333333' },
];

const ACCENT_PALETTE = [
  { color:'#c8f060', name:'Lime' },
  { color:'#60c8f0', name:'Sky' },
  { color:'#f060a8', name:'Pink' },
  { color:'#fbbf24', name:'Amber' },
  { color:'#a78bfa', name:'Violet' },
  { color:'#34d399', name:'Mint' },
  { color:'#f97316', name:'Orange' },
  { color:'#e879f9', name:'Fuchsia' },
  { color:'#1a73e8', name:'Blue' },
  { color:'#ffffff', name:'White' },
];

let currentTheme = localStorage.getItem('theme') || 'dark';
let customAccent = localStorage.getItem('customAccent') || '';

function applyTheme(id) {
  currentTheme = id;
  document.documentElement.setAttribute('data-theme', id);
  localStorage.setItem('theme', id);
  if (customAccent) {
    document.documentElement.style.setProperty('--accent', customAccent);
  }
  // Update active card
  document.querySelectorAll('.theme-card').forEach(c => {
    c.classList.toggle('active', c.dataset.theme === id);
  });
}

function applyAccent(color, save=true) {
  customAccent = color;
  document.documentElement.style.setProperty('--accent', color);
  if (save) localStorage.setItem('customAccent', color);
  document.querySelectorAll('.tp-swatch').forEach(s => {
    s.classList.toggle('active', s.dataset.color === color);
  });
}

function buildThemePanel() {
  // Theme cards
  const grid = document.getElementById('theme-cards');
  THEMES.forEach(t => {
    const card = document.createElement('div');
    card.className = 'theme-card' + (t.id===currentTheme?' active':'');
    card.dataset.theme = t.id;
    card.title = t.name;
    card.innerHTML = `
      <div class="tc-preview" style="background:${t.bg}">
        <div class="tc-header" style="background:${t.surface};border-bottom:1px solid ${t.border}">
          <div class="tc-dot" style="background:${t.accent}"></div>
          <div class="tc-dot" style="background:${t.border}"></div>
          <div class="tc-dot" style="background:${t.border}"></div>
        </div>
        <div class="tc-body">
          <div class="tc-time" style="color:${t.text}">${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2,'0')}</div>
        </div>
        <div class="tc-name" style="background:${t.surface};color:${t.accent};border-color:${t.border}">${t.name}</div>
      </div>`;
    card.onclick = () => applyTheme(t.id);
    grid.appendChild(card);
  });

  // Accent swatches
  const row = document.getElementById('accent-row');
  ACCENT_PALETTE.forEach(a => {
    const sw = document.createElement('div');
    sw.className = 'tp-swatch' + (a.color===customAccent?' active':'');
    sw.style.background = a.color;
    sw.dataset.color = a.color;
    sw.title = a.name;
    sw.onclick = () => applyAccent(a.color);
    row.appendChild(sw);
  });
}

function setFmt(use24) {
  is24h = use24;
  localStorage.setItem('is24h', is24h);
  document.getElementById('h24-btn').style.color = is24h ? 'var(--accent)' : '';
  document.getElementById('fmt-12').classList.toggle('primary', !use24);
  document.getElementById('fmt-24').classList.toggle('primary', use24);
  updateSun(); // re-render sunrise/sunset in correct format
}

function toggleThemePanel() {
  document.getElementById('theme-panel').classList.toggle('open');
  document.getElementById('theme-overlay').classList.toggle('open');
}
function closeThemePanel() {
  document.getElementById('theme-panel').classList.remove('open');
  document.getElementById('theme-overlay').classList.remove('open');
}

window.toggleThemePanel = toggleThemePanel;
window.closeThemePanel = closeThemePanel;
window.setFmt = setFmt;
window.applyTheme = applyTheme;
window.initThemeUI = function initThemeUI(){
  applyTheme(currentTheme);
  if (customAccent) applyAccent(customAccent, false);
  buildThemePanel();
  document.getElementById('fmt-12').classList.toggle('primary', !is24h);
  document.getElementById('fmt-24').classList.toggle('primary', is24h);
};
