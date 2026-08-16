// script.js
// ===== APP STATE =====
let affirmations = [];
let timerInterval = null;
let remainingSeconds = 0;
let volume = 0.7;
let selectedBell = 'bell1';
let isRunning = false;

// ===== AUDIO CONTEXT =====
let audioContext = null;
function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
}

// ===== BELL SOUNDS (Web Audio API) =====
function playBell(type) {
  const ctx = getAudioContext();
  switch (type) {
    case 'bell1': playClassicBell(ctx); break;
    case 'bell2': playSoftChime(ctx); break;
    case 'bell3': playDeepGong(ctx); break;
    case 'bell4': playDing(ctx); break;
    default: playClassicBell(ctx);
  }
}

function playTone(ctx, freq, duration = 0.25, options = {}) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = options.type || 'sine';
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime((options.peak || 1) * volume, ctx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration + 0.02);
}

function playClassicBell(ctx) {
  const freqs = [523, 659, 784, 1047];
  freqs.forEach((f, i) => setTimeout(() => playTone(ctx, f, 0.35, {type: 'sine', peak: 0.9}), i * 170));
}
function playSoftChime(ctx) {
  const freqs = [880, 1047, 1318];
  freqs.forEach((f, i) => setTimeout(() => playTone(ctx, f, 0.4, {type: 'triangle', peak: 0.7}), i * 200));
}
function playDeepGong(ctx) {
  playTone(ctx, 220, 1.2, {type: 'sine', peak: 0.9});
  setTimeout(() => playTone(ctx, 110, 1.0, {type: 'sine', peak: 0.7}), 300);
}
function playDing(ctx) {
  playTone(ctx, 1047, 0.2, {type: 'sine', peak: 1});
}

// ===== UI HELPERS =====
function formatHHMMSS(sec) {
  if (sec < 0) sec = 0;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
}

function updateCountdownDisplay() {
  const el = document.getElementById('countdownDisplay');
  el.textContent = `Next affirmation in: ${formatHHMMSS(remainingSeconds)}`;
}

// ===== TIMER CONTROLS =====
function startTimer() {
  if (isRunning) return;
  const hours = parseInt(document.getElementById('hours').value || '0', 10);
  const minutes = parseInt(document.getElementById('minutes').value || '0', 10);
  const seconds = parseInt(document.getElementById('seconds').value || '0', 10);
  remainingSeconds = Math.max(0, hours * 3600 + minutes * 60 + seconds);
  if (remainingSeconds === 0) {
    // if zero, default to 60 seconds
    remainingSeconds = 60;
  }
  isRunning = true;
  updateCountdownDisplay();
  timerInterval = setInterval(() => {
    remainingSeconds -= 1;
    updateCountdownDisplay();
    if (remainingSeconds <= 0) {
      triggerAffirmation();
      // restart timer for another cycle
      stopTimer();
      isRunning = false;
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  isRunning = false;
}

function resetTimer() {
  stopTimer();
  remainingSeconds = 0;
  updateCountdownDisplay();
}

function triggerAffirmation() {
  // pick random affirmation or first
  if (affirmations.length === 0) {
    showPopup('Take a deep breath.');
  } else {
    const idx = Math.floor(Math.random() * affirmations.length);
    showPopup(affirmations[idx]);
  }
  playBell(selectedBell);
}

// ===== VOLUME & BELL PREVIEW =====
function updateVolume(val) {
  volume = Number(val);
  document.getElementById('volumeLabel').textContent = `${Math.round(volume * 100)}%`;
}

function previewBell() {
  const sel = document.getElementById('bellSelect');
  selectedBell = sel.value;
  // resume audio context on user gesture
  try { getAudioContext().resume(); } catch (e) {}
  playBell(selectedBell);
}

// ===== AFFIRMATIONS MANAGEMENT =====
function saveAffirmations() {
  try { localStorage.setItem('affirmations', JSON.stringify(affirmations)); } catch (e) {}
}
function loadAffirmations() {
  try {
    const raw = localStorage.getItem('affirmations');
    if (raw) affirmations = JSON.parse(raw);
  } catch (e) { affirmations = []; }
}

function renderAffirmations() {
  const list = document.getElementById('affirmationList');
  list.innerHTML = '';
  if (affirmations.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'No affirmations yet. Add one above.';
    list.appendChild(empty);
    return;
  }
  affirmations.forEach((text, idx) => {
    const item = document.createElement('div');
    item.className = 'affirmation-item';
    const p = document.createElement('div');
    p.className = 'affirmation-item-text';
    p.textContent = text;
    const del = document.createElement('button');
    del.className = 'btn-delete';
    del.innerHTML = '✖';
    del.title = 'Delete affirmation';
    del.onclick = () => { deleteAffirmation(idx); };
    item.appendChild(p);
    item.appendChild(del);
    list.appendChild(item);
  });
}

function addAffirmation() {
  const ta = document.getElementById('newAffirmation');
  const text = (ta.value || '').trim();
  if (!text) return;
  affirmations.push(text);
  ta.value = '';
  saveAffirmations();
  renderAffirmations();
}

function deleteAffirmation(idx) {
  affirmations.splice(idx, 1);
  saveAffirmations();
  renderAffirmations();
}

// ===== POPUP =====
function showPopup(text) {
  const overlay = document.getElementById('popupOverlay');
  const popupText = document.getElementById('popupText');
  popupText.textContent = text;
  overlay.classList.add('active');
}
function closePopup() {
  const overlay = document.getElementById('popupOverlay');
  overlay.classList.remove('active');
}

// ===== BOOTSTRAP =====n(function init() {
  // wire up controls
  document.getElementById('startBtn').addEventListener('click', startTimer);
  document.getElementById('stopBtn').addEventListener('click', stopTimer);
  document.getElementById('volumeSlider').addEventListener('input', (e) => updateVolume(e.target.value));
  document.getElementById('bellSelect').addEventListener('change', (e) => { selectedBell = e.target.value; });
  document.getElementById('newAffirmation').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) addAffirmation();
  });

  loadAffirmations();
  renderAffirmations();
  updateVolume(document.getElementById('volumeSlider').value);
  updateCountdownDisplay();
})();
