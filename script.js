## script.js
// ===== APP STATE =====
let affirmations = [];
let timerInterval = null;
let countdownInterval = null;
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
    case 'bell2': playSoftChime(ctx);   break;
    case 'bell3': playDeepGong(ctx);    break;
    case 'bell4': playDing(ctx);        break;
    default:      playClassicBell(ctx);
  }
}

function playClassicBell(ctx) {
  const frequencies = [523, 659, 784, 1047];
  frequencies.forEach((freq, i) => {
    setTimeout(() => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency
