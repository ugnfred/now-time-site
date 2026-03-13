// ═══════════════════════════════════════════════════
//  TASK TIMERS
// ═══════════════════════════════════════════════════
let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
let taskAudioCtx = null;

function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks.map(t => ({
    name: t.name, totalSecs: t.totalSecs, remainSecs: t.remainSecs,
    running: false, done: t.done
  }))));
}

function setTaskTime(h, m, s) {
  document.getElementById('task-h').value = h;
  document.getElementById('task-m').value = m;
  document.getElementById('task-s').value = s;
}

function addTask() {
  const name = document.getElementById('task-name-input').value.trim() || 'Untitled Task';
  const h = parseInt(document.getElementById('task-h').value) || 0;
  const m = parseInt(document.getElementById('task-m').value) || 0;
  const s = parseInt(document.getElementById('task-s').value) || 0;
  const totalSecs = h * 3600 + m * 60 + s;
  if (totalSecs <= 0) return;
  tasks.push({ name, totalSecs, remainSecs: totalSecs, running: false, done: false });
  saveTasks();
  renderTasks();
  document.getElementById('task-name-input').value = '';
  // Request notification permission
  if (Notification.permission === 'default') Notification.requestPermission();
  trackEvent && trackEvent('add_task', 'tasks', name);
}

function toggleTask(idx) {
  const t = tasks[idx];
  if (t.done) return;
  t.running = !t.running;
  renderTasks();
}

function resetTask(idx) {
  const t = tasks[idx];
  t.running = false;
  t.remainSecs = t.totalSecs;
  t.done = false;
  saveTasks();
  renderTasks();
}

function removeTask(idx) {
  tasks.splice(idx, 1);
  saveTasks();
  renderTasks();
}

function fmtTaskTime(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}

function fmtTaskDuration(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s > 0 ? s+'s' : ''}`.trim();
  return `${s}s`;
}

function renderTasks() {
  const list = document.getElementById('tasks-list');
  const empty = document.getElementById('tasks-empty');
  if (!list) return;
  if (!tasks.length) {
    list.innerHTML = '';
    list.appendChild(empty || (() => {
      const d = document.createElement('div');
      d.className = 'tasks-empty';
      d.innerHTML = '<div style="font-size:40px;margin-bottom:12px;">✅</div><div style="font-family:\'DM Mono\',monospace;font-size:12px;color:var(--muted);letter-spacing:2px;">NO TASKS YET</div><div style="font-family:\'DM Sans\',sans-serif;font-size:13px;color:var(--muted);margin-top:6px;">Add a task above to get started</div>';
      return d;
    })());
    return;
  }
  list.innerHTML = tasks.map((t, i) => {
    const pct = t.totalSecs > 0 ? Math.max(0, (1 - t.remainSecs / t.totalSecs)) * 100 : 0;
    const urgent = !t.done && t.remainSecs <= 10 && t.remainSecs > 0;
    return `
    <div class="task-item ${t.running ? 'running' : ''} ${t.done ? 'done' : ''}">
      <div class="task-item-inner">
        <div class="task-item-info">
          <div class="task-item-name">${escapeHTML(t.name)}</div>
          <div class="task-item-meta">${t.done ? '✅ COMPLETED' : t.running ? '▶ RUNNING' : '⏸ PAUSED'} · ${fmtTaskDuration(t.totalSecs)}</div>
        </div>
        <div class="task-item-timer ${urgent ? 'urgent' : ''}" id="task-timer-${i}">${t.done ? '00:00' : fmtTaskTime(t.remainSecs)}</div>
        <div class="task-controls">
          ${!t.done ? `<button class="task-ctrl-btn start" onclick="toggleTask(${i})" title="${t.running ? 'Pause' : 'Start'}">${t.running ? '⏸' : '▶'}</button>` : ''}
          <button class="task-ctrl-btn" onclick="resetTask(${i})" title="Reset">↺</button>
          <button class="task-ctrl-btn remove" onclick="removeTask(${i})" title="Delete">✕</button>
        </div>
      </div>
      <div class="task-progress"><div class="task-progress-fill" style="width:${pct}%"></div></div>
    </div>`;
  }).join('');
}

function tickTasks() {
  let changed = false;
  tasks.forEach((t, i) => {
    if (!t.running || t.done) return;
    t.remainSecs = Math.max(0, t.remainSecs - 1);
    changed = true;
    // Update timer display without full re-render
    const el = document.getElementById(`task-timer-${i}`);
    if (el) {
      el.textContent = fmtTaskTime(t.remainSecs);
      if (t.remainSecs <= 10) el.classList.add('urgent');
    }
    if (t.remainSecs === 0) {
      t.running = false;
      t.done = true;
      fireTask(t);
      renderTasks();
    }
  });
  if (changed) saveTasks();
}

function fireTask(t) {
  // Show overlay
  document.getElementById('task-fired-name').textContent = t.name;
  document.getElementById('task-fired-overlay').classList.add('show');
  // Play sound
  playTaskSound();
  // Desktop notification
  if (Notification.permission === 'granted') {
    new Notification('✅ Task Complete!', {
      body: `"${t.name}" timer has ended!`,
      icon: '/icons/icon-192.png'
    });
  }
  trackEvent && trackEvent('task_complete', 'tasks', t.name);
}

function dismissTask() {
  document.getElementById('task-fired-overlay').classList.remove('show');
  stopTaskSound();
}

function playTaskSound() {
  try {
    taskAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6 — ascending chord
    notes.forEach((freq, i) => {
      const osc  = taskAudioCtx.createOscillator();
      const gain = taskAudioCtx.createGain();
      osc.connect(gain);
      gain.connect(taskAudioCtx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, taskAudioCtx.currentTime + i * 0.15);
      gain.gain.linearRampToValueAtTime(0.5, taskAudioCtx.currentTime + i * 0.15 + 0.05);
      gain.gain.linearRampToValueAtTime(0, taskAudioCtx.currentTime + i * 0.15 + 0.4);
      osc.start(taskAudioCtx.currentTime + i * 0.15);
      osc.stop(taskAudioCtx.currentTime + i * 0.15 + 0.5);
    });
    // Repeat once
    setTimeout(() => {
      if (!taskAudioCtx) return;
      notes.forEach((freq, i) => {
        const osc  = taskAudioCtx.createOscillator();
        const gain = taskAudioCtx.createGain();
        osc.connect(gain);
        gain.connect(taskAudioCtx.destination);
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, taskAudioCtx.currentTime + i * 0.15);
        gain.gain.linearRampToValueAtTime(0.5, taskAudioCtx.currentTime + i * 0.15 + 0.05);
        gain.gain.linearRampToValueAtTime(0, taskAudioCtx.currentTime + i * 0.15 + 0.4);
        osc.start(taskAudioCtx.currentTime + i * 0.15);
        osc.stop(taskAudioCtx.currentTime + i * 0.15 + 0.5);
      });
    }, 900);
  } catch(e) { console.warn('Audio error:', e); }
}

function stopTaskSound() {
  if (taskAudioCtx) {
    try { taskAudioCtx.close(); } catch(e) {}
    taskAudioCtx = null;
  }
}

// Hook tickTasks into main tick
const _origTick = window.tick;
(function() {
  const orig = window.tick;
  window.tick = function() {
    orig && orig();
    tickTasks();
  };
})();

renderTasks();

