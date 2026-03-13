// ═══════════════════════════════════════════════════
//  VIEW SWITCHING
// ═══════════════════════════════════════════════════
function switchView(name, btn) {
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('view-'+name).classList.add('active');
  if(btn) btn.classList.add('active');
  // GA4: track tab switches
  if(typeof gtag !== 'undefined') trackEvent('tab_switch', 'navigation', name);
  document.dispatchEvent(new CustomEvent('app:viewchange', { detail: { name } }));
}


window.switchView = switchView;
