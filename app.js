const els = {
  video: document.getElementById('cameraPreview'),
  emptyCamera: document.getElementById('emptyCamera'),
  startCameraBtn: document.getElementById('startCameraBtn'),
  startSessionBtn: document.getElementById('startSessionBtn'),
  retakeBtn: document.getElementById('retakeBtn'),
  countdown: document.getElementById('countdown'),
  flash: document.getElementById('flash'),
  shotCanvas: document.getElementById('shotCanvas'),
  eventName: document.getElementById('eventName'),
  layoutMode: document.getElementById('layoutMode'),
  countdownSeconds: document.getElementById('countdownSeconds'),
  frameTheme: document.getElementById('frameTheme'),
  filterMode: document.getElementById('filterMode'),
  customFrame: document.getElementById('customFrame'),
  finalPreview: document.getElementById('finalPreview'),
  emptyResult: document.getElementById('emptyResult'),
  downloadBtn: document.getElementById('downloadBtn'),
  shareBtn: document.getElementById('shareBtn'),
  shotCounter: document.getElementById('shotCounter'),
  qrCode: document.getElementById('qrCode'),
  qrNote: document.getElementById('qrNote'),
  photoGrid: document.getElementById('photoGrid'),
  mirrorToggle: document.getElementById('mirrorToggle'),
  cameraSelect: document.getElementById('cameraSelect'),
  soundToggle: document.getElementById('soundToggle'),
};

const STORY_W = 1080;
const STORY_H = 1920;

const builtInFrames = {
  classic: 'assets/frames/classic-story.png',
  cfd: 'assets/frames/cfd-story.png',
  capstone: 'assets/frames/capstone-story.png',
  wisuda: 'assets/frames/wisuda-story.png',
};

// Slot coordinates derived from actual pixel analysis of each frame PNG.
// Each black rectangle = photo area. Values measured at 1080×1920 native resolution.
// For multi-photo layouts the slot is split vertically with gaps.
const frameSlots = {
  classic:  { x: 168,  y: 220,  w: 744,  h: 1088, radius: 28 },
  cfd:      { x: 27,   y: 97,   w: 1015, h: 1662, radius: 12 },
  capstone: { x: 25,   y: 49,   w: 1004, h: 1791, radius: 10 },
  wisuda:   { x: 74,   y: 240,  w: 932,  h: 1170, radius: 16 },
};

let stream = null;
let capturedPhotos = [];
let finalBlob = null;
let finalObjectUrl = null;
let customFrameImage = null;
let mirrorMode = true;
let soundEnabled = true;
const frameImageCache = {};
let availableCameras = [];

// ─── Audio ───────────────────────────────────────────────────────────────────
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function ensureAudio() {
  if (!audioCtx) audioCtx = new AudioCtx();
}

function playBeep(freq = 880, duration = 0.12, vol = 0.4) {
  if (!soundEnabled) return;
  try {
    ensureAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (_) {}
}

function playShutter() {
  if (!soundEnabled) return;
  try {
    ensureAudio();
    const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.06, audioCtx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.3));
    }
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    const gain = audioCtx.createGain();
    gain.gain.value = 0.6;
    src.connect(gain);
    gain.connect(audioCtx.destination);
    src.start();
  } catch (_) {}
}

// ─── Utilities ───────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function setBusy(isBusy) {
  els.startSessionBtn.disabled = isBusy || !stream;
  els.startCameraBtn.disabled = isBusy;
  els.retakeBtn.disabled = isBusy || capturedPhotos.length === 0;
  els.cameraSelect.disabled = isBusy;
}

// ─── Camera ──────────────────────────────────────────────────────────────────
async function enumerateCameras() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    availableCameras = devices.filter(d => d.kind === 'videoinput');
    els.cameraSelect.innerHTML = '';
    if (availableCameras.length <= 1) {
      els.cameraSelect.parentElement.classList.add('hidden');
      return;
    }
    els.cameraSelect.parentElement.classList.remove('hidden');
    availableCameras.forEach((cam, i) => {
      const opt = document.createElement('option');
      opt.value = cam.deviceId;
      opt.textContent = cam.label || `Kamera ${i + 1}`;
      els.cameraSelect.appendChild(opt);
    });
  } catch (_) {}
}

async function startCamera(deviceId = null) {
  if (stream) {
    stream.getTracks().forEach(t => t.stop());
    stream = null;
  }
  try {
    const constraints = {
      video: {
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        facingMode: deviceId ? undefined : 'user',
        ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
      },
      audio: false,
    };
    stream = await navigator.mediaDevices.getUserMedia(constraints);
    els.video.srcObject = stream;
    els.emptyCamera.classList.add('hidden');
    els.startSessionBtn.disabled = false;
    els.startCameraBtn.textContent = '✓ Kamera Aktif';
    els.startCameraBtn.classList.add('btn-active');
    await enumerateCameras();
    // sync camera select to active track
    const trackId = stream.getVideoTracks()[0]?.getSettings()?.deviceId;
    if (trackId) els.cameraSelect.value = trackId;
  } catch (err) {
    alert('Kamera tidak bisa diakses. Pastikan browser berjalan di HTTPS/localhost dan izin kamera diberikan.');
    console.error(err);
  }
}

function getFilterValue() {
  const mode = els.filterMode.value;
  if (mode === 'bw')      return 'grayscale(1) contrast(1.08)';
  if (mode === 'warm')    return 'sepia(.20) saturate(1.24) brightness(1.04)';
  if (mode === 'bright')  return 'brightness(1.16) contrast(1.04)';
  if (mode === 'vintage') return 'sepia(.42) contrast(1.05) saturate(.82)';
  if (mode === 'cool')    return 'hue-rotate(20deg) saturate(1.1) brightness(1.05)';
  return 'none';
}

function applyVideoMirror() {
  els.video.style.transform = mirrorMode ? 'scaleX(-1)' : 'none';
}

function capturePhoto() {
  const video = els.video;
  const canvas = els.shotCanvas;
  const vw = video.videoWidth || 1080;
  const vh = video.videoHeight || 1920;
  canvas.width = vw;
  canvas.height = vh;
  const ctx = canvas.getContext('2d');
  ctx.save();
  ctx.filter = getFilterValue();
  if (mirrorMode) {
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  ctx.restore();
  return canvas.toDataURL('image/jpeg', 0.95);
}

// ─── Countdown ───────────────────────────────────────────────────────────────
async function runCountdown(seconds) {
  els.countdown.classList.remove('hidden');
  for (let i = seconds; i >= 1; i--) {
    els.countdown.textContent = i;
    els.countdown.classList.remove('pop');
    void els.countdown.offsetWidth;
    els.countdown.classList.add('pop');
    if (i <= 3) playBeep(440 + (4 - i) * 110, 0.15);
    await sleep(900);
  }
  els.countdown.textContent = '📸';
  playShutter();
  await sleep(160);
  els.countdown.classList.add('hidden');
  els.flash.classList.remove('hidden');
  await sleep(220);
  els.flash.classList.add('hidden');
}

// ─── Session ─────────────────────────────────────────────────────────────────
async function startSession() {
  if (!stream) return;
  ensureAudio();
  setBusy(true);
  resetResult(false);
  capturedPhotos = [];
  updatePhotoGrid([]);
  const total = Number(els.layoutMode.value);
  const seconds = Number(els.countdownSeconds.value);

  for (let i = 0; i < total; i++) {
    await runCountdown(seconds);
    const dataUrl = capturePhoto();
    capturedPhotos.push(dataUrl);
    els.shotCounter.textContent = `${capturedPhotos.length}/${total} foto`;
    updatePhotoGrid(capturedPhotos);
    if (i < total - 1) await sleep(600);
  }

  await renderFinalImage();
  setBusy(false);
}

// ─── Thumbnail strip ─────────────────────────────────────────────────────────
function updatePhotoGrid(photos) {
  if (!els.photoGrid) return;
  els.photoGrid.innerHTML = '';
  photos.forEach((src, i) => {
    const img = document.createElement('img');
    img.src = src;
    img.alt = `Foto ${i + 1}`;
    img.className = 'thumb-img';
    els.photoGrid.appendChild(img);
  });
  els.photoGrid.classList.toggle('hidden', photos.length === 0);
}

// ─── Canvas helpers ──────────────────────────────────────────────────────────
function roundedRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawImageCover(ctx, img, x, y, w, h, radius = 0) {
  const iw = img.width;
  const ih = img.height;
  const scale = Math.max(w / iw, h / ih);
  const sw = w / scale;
  const sh = h / scale;
  const sx = (iw - sw) / 2;
  const sy = (ih - sh) / 2;

  ctx.save();
  if (radius > 0) {
    roundedRect(ctx, x, y, w, h, radius);
    ctx.clip();
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  ctx.restore();
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function getActiveFrameImage() {
  if (customFrameImage) return customFrameImage;
  const theme = els.frameTheme.value;
  if (!frameImageCache[theme]) {
    frameImageCache[theme] = await loadImage(builtInFrames[theme]);
  }
  return frameImageCache[theme];
}

function fillBase(ctx, theme) {
  const palettes = {
    classic:  ['#f8fafc', '#f1f5f9'],
    cfd:      ['#ffffff', '#fef9f0'],
    capstone: ['#eff6ff', '#e0f2fe'],
    wisuda:   ['#111111', '#1a1a1a'],
  };
  const [c1, c2] = palettes[theme] || palettes.classic;
  const grd = ctx.createLinearGradient(0, 0, 0, STORY_H);
  grd.addColorStop(0, c1);
  grd.addColorStop(1, c2);
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, STORY_W, STORY_H);
}

function addInsetShadow(ctx, x, y, w, h, radius = 0) {
  ctx.save();
  ctx.strokeStyle = 'rgba(0,0,0,.15)';
  ctx.lineWidth = 2.5;
  roundedRect(ctx, x + 1.25, y + 1.25, w - 2.5, h - 2.5, radius);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  roundedRect(ctx, x, y, w, h, radius);
  ctx.clip();
  const grd = ctx.createLinearGradient(x, y, x, y + h);
  grd.addColorStop(0, 'rgba(0,0,0,.10)');
  grd.addColorStop(0.06, 'rgba(0,0,0,0)');
  grd.addColorStop(0.94, 'rgba(0,0,0,0)');
  grd.addColorStop(1, 'rgba(0,0,0,.08)');
  ctx.fillStyle = grd;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

function drawPhotoBlock(ctx, img, x, y, w, h, radius = 0, mode = 'embedded') {
  drawImageCover(ctx, img, x, y, w, h, radius);
  if (mode === 'embedded') {
    addInsetShadow(ctx, x, y, w, h, radius);
  } else {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,.75)';
    ctx.lineWidth = 5;
    roundedRect(ctx, x + 2.5, y + 2.5, w - 5, h - 5, radius);
    ctx.stroke();
    ctx.restore();
  }
}

function drawPhotosIntoSlot(ctx, images, slot, mode = 'embedded') {
  const total = images.length;
  const r = slot.radius;

  if (total === 1) {
    drawPhotoBlock(ctx, images[0], slot.x, slot.y, slot.w, slot.h, r, mode);
    return;
  }

  const gap = 14;
  const photoH = Math.floor((slot.h - gap * (total - 1)) / total);

  images.forEach((img, idx) => {
    const py = slot.y + idx * (photoH + gap);
    drawPhotoBlock(ctx, img, slot.x, py, slot.w, photoH, Math.max(8, r - 4), mode);
  });
}

// ─── Render ──────────────────────────────────────────────────────────────────
async function renderFinalImage() {
  const total = capturedPhotos.length;
  if (!total) return;

  const images = await Promise.all(capturedPhotos.map(loadImage));
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const theme = els.frameTheme.value;
  const slot = frameSlots[theme] || frameSlots.classic;

  canvas.width = STORY_W;
  canvas.height = STORY_H;

  // 1. Background fill
  fillBase(ctx, theme);

  // 2. Photos drawn UNDER the frame
  const mode = customFrameImage ? 'custom' : 'embedded';
  drawPhotosIntoSlot(ctx, images, slot, mode);

  // 3. Frame overlay drawn ON TOP (must have transparent photo area)
  const frameImage = await getActiveFrameImage();
  if (frameImage) {
    ctx.drawImage(frameImage, 0, 0, STORY_W, STORY_H);
  }

  const dataUrl = canvas.toDataURL('image/png');
  els.finalPreview.src = dataUrl;
  els.finalPreview.classList.remove('hidden');
  els.emptyResult.classList.add('hidden');

  if (finalObjectUrl) URL.revokeObjectURL(finalObjectUrl);
  finalBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  finalObjectUrl = URL.createObjectURL(finalBlob);

  const safeEvent = (els.eventName.value.trim() || 'labshot-story')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  els.downloadBtn.href = finalObjectUrl;
  els.downloadBtn.download = `${safeEvent}-${Date.now()}.png`;
  els.downloadBtn.classList.remove('disabled');
  els.shareBtn.disabled = false;
  els.retakeBtn.disabled = false;

  renderQRCode(finalObjectUrl);
}

function renderQRCode(value) {
  els.qrCode.innerHTML = '';
  if (window.QRCode) {
    new QRCode(els.qrCode, {
      text: value,
      width: 102,
      height: 102,
      correctLevel: QRCode.CorrectLevel.M,
    });
    els.qrNote.textContent = 'Hasil sudah Story IG 1080×1920. QR masih link lokal browser.';
  } else {
    els.qrNote.textContent = 'Library QR belum termuat.';
  }
}

// ─── Reset ───────────────────────────────────────────────────────────────────
function resetResult(clearPhotos = true) {
  if (clearPhotos) {
    capturedPhotos = [];
    updatePhotoGrid([]);
  }
  if (finalObjectUrl) URL.revokeObjectURL(finalObjectUrl);
  finalBlob = null;
  finalObjectUrl = null;
  els.finalPreview.removeAttribute('src');
  els.finalPreview.classList.add('hidden');
  els.emptyResult.classList.remove('hidden');
  els.downloadBtn.removeAttribute('href');
  els.downloadBtn.classList.add('disabled');
  els.shareBtn.disabled = true;
  els.qrCode.innerHTML = '';
  els.qrNote.textContent = 'QR aktif setelah foto dibuat.';
  els.shotCounter.textContent = `${capturedPhotos.length} foto`;
}

// ─── Share ───────────────────────────────────────────────────────────────────
async function sharePhoto() {
  if (!finalBlob) return;
  const file = new File([finalBlob], els.downloadBtn.download || 'labshot-story.png', { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ title: 'LabShot Photobox', files: [file] });
    } catch (err) { console.warn(err); }
  } else {
    alert('Browser ini belum mendukung fitur bagikan file. Gunakan tombol Download.');
  }
}

// ─── Custom frame upload ─────────────────────────────────────────────────────
function handleCustomFrameUpload(event) {
  const file = event.target.files?.[0];
  if (!file) {
    customFrameImage = null;
    if (capturedPhotos.length) renderFinalImage();
    return;
  }
  const reader = new FileReader();
  reader.onload = async () => {
    customFrameImage = await loadImage(reader.result);
    if (capturedPhotos.length) renderFinalImage();
  };
  reader.readAsDataURL(file);
}

// ─── Live filter preview on video ────────────────────────────────────────────
function applyLiveFilter() {
  els.video.style.filter = getFilterValue();
}

// ─── Event listeners ─────────────────────────────────────────────────────────
els.startCameraBtn.addEventListener('click', () => startCamera());
els.startSessionBtn.addEventListener('click', startSession);
els.retakeBtn.addEventListener('click', () => {
  resetResult(true);
  els.retakeBtn.disabled = true;
});
els.shareBtn.addEventListener('click', sharePhoto);
els.customFrame.addEventListener('change', handleCustomFrameUpload);

els.mirrorToggle.addEventListener('change', () => {
  mirrorMode = els.mirrorToggle.checked;
  applyVideoMirror();
});
els.soundToggle.addEventListener('change', () => {
  soundEnabled = els.soundToggle.checked;
});
els.cameraSelect.addEventListener('change', () => {
  startCamera(els.cameraSelect.value);
});

[els.eventName, els.frameTheme, els.layoutMode].forEach(el => {
  el.addEventListener('change', () => {
    if (capturedPhotos.length) renderFinalImage();
  });
});

els.filterMode.addEventListener('change', () => {
  applyLiveFilter();
  if (capturedPhotos.length) renderFinalImage();
});

// Init
applyVideoMirror();
resetResult(true);
