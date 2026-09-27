// Veilo — shared interaction helpers

// ---- Modal open/close ----
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('is-open');
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('is-open');
}
document.addEventListener('click', (e) => {
  if (e.target.classList && e.target.classList.contains('overlay')) {
    e.target.classList.remove('is-open');
  }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.overlay.is-open').forEach((o) => o.classList.remove('is-open'));
  }
});

// ---- Generate a random-but-stable waveform (voice message bubbles) ----
function paintWaveforms() {
  document.querySelectorAll('.waveform[data-bars]').forEach((wf) => {
    if (wf.childElementCount) return;
    const count = parseInt(wf.dataset.bars, 10) || 24;
    for (let i = 0; i < count; i++) {
      const bar = document.createElement('span');
      const h = 6 + Math.round(Math.sin(i * 1.3) * 6 + Math.random() * 6 + 6);
      bar.style.height = Math.max(4, h) + 'px';
      wf.appendChild(bar);
    }
  });
}
document.addEventListener('DOMContentLoaded', paintWaveforms);

// ---- Voice message play (visual only) ----
function toggleVoicePlay(btn) {
  const svg = btn.querySelector('svg');
  const playing = btn.dataset.playing === '1';
  btn.dataset.playing = playing ? '0' : '1';
  svg.innerHTML = playing
    ? '<path d="M8 5v14l11-7z" fill="currentColor"/>'
    : '<rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor"/><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor"/>';
}

// ---- Mic hold-to-record demo (chat composer) ----
function setupMicDemo(fabId, statusId) {
  const fab = document.getElementById(fabId);
  const status = statusId ? document.getElementById(statusId) : null;
  if (!fab) return;
  let timer = null, seconds = 0;
  const start = () => {
    fab.classList.add('is-recording');
    seconds = 0;
    if (status) status.textContent = 'Recording… 0:00';
    timer = setInterval(() => {
      seconds++;
      if (status) status.textContent = `Recording… 0:${String(seconds).padStart(2, '0')}`;
    }, 1000);
  };
  const stop = () => {
    fab.classList.remove('is-recording');
    clearInterval(timer);
    if (status) status.textContent = seconds > 0 ? 'Voice message sent' : 'Tap and hold to record';
    setTimeout(() => { if (status && seconds > 0) status.textContent = 'Tap and hold to record'; }, 1800);
  };
  fab.addEventListener('mousedown', start);
  fab.addEventListener('touchstart', (e) => { e.preventDefault(); start(); }, { passive: false });
  ['mouseup', 'mouseleave', 'touchend'].forEach((ev) => fab.addEventListener(ev, stop));
}

// ---- Simple multi-step wizard (register / compatibility quiz) ----
function goToStep(stepEl, index) {
  const steps = stepEl.querySelectorAll('.wizard-step');
  const segs = stepEl.querySelectorAll('.stepper .seg');
  steps.forEach((s, i) => s.style.display = i === index ? 'block' : 'none');
  segs.forEach((s, i) => {
    s.classList.toggle('is-done', i < index);
    s.classList.toggle('is-active', i === index);
  });
  stepEl.dataset.step = index;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ---- Single/multi choice selection ----
function bindChoiceGroup(groupEl, { multi = false } = {}) {
  groupEl.querySelectorAll('.choice, .chip').forEach((el) => {
    el.addEventListener('click', () => {
      if (!multi) {
        groupEl.querySelectorAll('.choice, .chip').forEach((o) => o.classList.remove('is-selected'));
      }
      el.classList.toggle('is-selected');
    });
  });
}
