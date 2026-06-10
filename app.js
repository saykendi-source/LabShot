/* ─────────────────────────────────────────────
   LabShot v7 – app.js
   Perbaikan utama:
   - Foto dirender di layer belakang frame, bukan ditempel di atas.
   - Template scrapbook memakai transparent window.
   - Layout otomatis untuk 1, 2, 3, dan 4 foto.
───────────────────────────────────────────── */

const els = {
  video:           document.getElementById('cameraPreview'),
  emptyCamera:     document.getElementById('emptyCamera'),
  startCameraBtn:  document.getElementById('startCameraBtn'),
  startSessionBtn: document.getElementById('startSessionBtn'),
  retakeBtn:       document.getElementById('retakeBtn'),
  countdown:       document.getElementById('countdown'),
  flash:           document.getElementById('flash'),
  shotCanvas:      document.getElementById('shotCanvas'),
  eventName:       document.getElementById('eventName'),
  layoutMode:      document.getElementById('layoutMode'),
  countdownSeconds:document.getElementById('countdownSeconds'),
  frameTheme:      document.getElementById('frameTheme'),
  filterMode:      document.getElementById('filterMode'),
  customFrame:     document.getElementById('customFrame'),
  finalPreview:    document.getElementById('finalPreview'),
  emptyResult:     document.getElementById('emptyResult'),
  downloadBtn:     document.getElementById('downloadBtn'),
  shareBtn:        document.getElementById('shareBtn'),
  shotCounter:     document.getElementById('shotCounter'),
  qrCode:          document.getElementById('qrCode'),
  qrNote:          document.getElementById('qrNote'),
  photoGrid:       document.getElementById('photoGrid'),
  mirrorToggle:    document.getElementById('mirrorToggle'),
  soundToggle:     document.getElementById('soundToggle'),
  cameraSelect:    document.getElementById('cameraSelect'),
  cameraSelectWrap:document.getElementById('cameraSelectWrap'),
  progressBar:     document.getElementById('progressBar'),
  statusText:      document.getElementById('statusText'),
};

const STORY_W = 1080;
const STORY_H = 1920;

/*
  Semua frame harus berada di assets/frames.
  Window foto pada template scrapbook sudah dibuat transparan di file PNG-nya.
*/
const FRAME_CONFIGS = {
  classic: {
    label: 'Classic',
    path: 'assets/frames/classic-story.png',
    baseSlot: { x: 168, y: 220, w: 744, h: 1088, radius: 22 },
  },
  cfd: {
    label: 'CFD Street',
    path: 'assets/frames/cfd-story.png',
    baseSlot: { x: 72, y: 180, w: 936, h: 1170, radius: 10 },
  },
  capstone: {
    label: 'Capstone',
    path: 'assets/frames/capstone-story.png',
    baseSlot: { x: 84, y: 152, w: 912, h: 1388, radius: 8 },
  },
  wisuda: {
    label: 'Wisuda',
    path: 'assets/frames/wisuda-story.png',
    baseSlot: { x: 74, y: 240, w: 932, h: 1175, radius: 14 },
  },
  yogyakartaCity: {
    label: 'Yogyakarta City Series',
    path: 'assets/frames/yogyakarta-city-series.png',
    slotsByCount: {
      1: [
        { x: 78, y: 558, w: 602, h: 905, radius: 10 }
      ],
      2: [
        { x: 78, y: 558, w: 602, h: 442, radius: 10 },
        { x: 78, y: 1021, w: 602, h: 442, radius: 10 }
      ],
      3: [
        { x: 78, y: 558, w: 602, h: 289, radius: 10 },
        { x: 78, y: 866, w: 602, h: 289, radius: 10 },
        { x: 78, y: 1174, w: 602, h: 289, radius: 10 }
      ],
      4: [
        { x: 78, y: 558, w: 602, h: 211, radius: 10 },
        { x: 78, y: 790, w: 602, h: 211, radius: 10 },
        { x: 78, y: 1022, w: 602, h: 211, radius: 10 },
        { x: 78, y: 1254, w: 602, h: 209, radius: 10 }
      ],
    },
  },

  memoriesSimple: {
    label: 'Memories Simple',
    path: 'assets/frames/memories-simple.png',
    slotsByCount: {
      1: [{ x: 248, y: 1055, w: 770, h: 460, angle: 2 }],
      2: [
        { x: 74, y: 542, w: 525, h: 345 },
        { x: 248, y: 1055, w: 770, h: 460, angle: 2 },
      ],
      3: [
        { x: 74, y: 542, w: 250, h: 345 },
        { x: 338, y: 542, w: 260, h: 345 },
        { x: 248, y: 1055, w: 770, h: 460, angle: 2 },
      ],
      4: [
        { x: 74, y: 542, w: 250, h: 345 },
        { x: 338, y: 542, w: 260, h: 345 },
        { x: 248, y: 1055, w: 380, h: 460, angle: 2 },
        { x: 638, y: 1055, w: 380, h: 460, angle: 2 },
      ],
    },
  },
};

/*
  Mode Auto Scrapbook:
  - 1 foto  → Memories Simple
  - 2 foto  → Memories Simple
  - 3 foto  → Birthday Collage
  - 4 foto  → Memories Box
*/
function resolveFrameKey(photoCount) {
  const selected = els.frameTheme.value;
  if (selected !== 'scrapbookAuto') return selected;
  if (photoCount <= 2) return 'memoriesSimple';
  if (photoCount === 3) return 'birthdayCollage';
  return 'memoriesBox';
}

let stream          = null;
let capturedPhotos  = [];
let finalBlob       = null;
let finalObjectUrl  = null;
let customFrameImage= null;
let mirrorMode      = true;
let soundEnabled    = true;
let sessionRunning  = false;
const frameImageCache = {};

/* ── Audio ────────────────────────────────────────────── */
let audioCtx = null;
function ensureAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}
function playTone(freq, dur, vol = 0.4) {
  if (!soundEnabled) return;
  try {
    ensureAudio();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.connect(g); g.connect(audioCtx.destination);
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    o.start(); o.stop(audioCtx.currentTime + dur);
  } catch(_) {}
}
function playShutter() {
  if (!soundEnabled) return;
  try {
    ensureAudio();
    const buf = audioCtx.createBuffer(1, Math.floor(audioCtx.sampleRate * 0.07), audioCtx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) {
      d[i] = (Math.random()*2-1) * Math.exp(-i / (d.length * 0.25));
    }
    const s = audioCtx.createBufferSource();
    s.buffer = buf;
    const g = audioCtx.createGain(); g.gain.value = 0.55;
    s.connect(g); g.connect(audioCtx.destination); s.start();
  } catch(_) {}
}

/* ── Helpers ──────────────────────────────────────────── */
const sleep = ms => new Promise(r => setTimeout(r, ms));

function setStatus(msg) {
  if (els.statusText) els.statusText.textContent = msg;
}

function setProgress(pct) {
  if (els.progressBar) els.progressBar.style.width = pct + '%';
}

function setBusy(busy) {
  sessionRunning = busy;
  els.startSessionBtn.disabled = busy || !stream;
  els.startCameraBtn.disabled  = busy;
  els.retakeBtn.disabled       = busy || capturedPhotos.length === 0;
  if (els.cameraSelect) els.cameraSelect.disabled = busy;
}

/* ── Camera ───────────────────────────────────────────── */
async function enumerateCameras() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cams = devices.filter(d => d.kind === 'videoinput');
    if (!els.cameraSelect || !els.cameraSelectWrap) return;
    if (cams.length <= 1) { els.cameraSelectWrap.classList.add('hidden'); return; }
    els.cameraSelectWrap.classList.remove('hidden');
    els.cameraSelect.innerHTML = '';
    cams.forEach((c, i) => {
      const o = document.createElement('option');
      o.value = c.deviceId;
      o.textContent = c.label || `Kamera ${i+1}`;
      els.cameraSelect.appendChild(o);
    });
    const active = stream?.getVideoTracks()[0]?.getSettings()?.deviceId;
    if (active) els.cameraSelect.value = active;
  } catch(_) {}
}

async function startCamera(deviceId = null) {
  if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
  setStatus('Menghubungkan kamera…');
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width:  { ideal: 1920 },
        height: { ideal: 1080 },
        ...(deviceId ? { deviceId: { exact: deviceId } } : { facingMode: 'user' }),
      },
      audio: false,
    });
    els.video.srcObject = stream;
    els.emptyCamera.classList.add('hidden');
    els.startSessionBtn.disabled = false;
    els.startCameraBtn.textContent = '✓ Kamera Aktif';
    els.startCameraBtn.classList.add('btn-active');
    setStatus('Kamera aktif. Siap memotret!');
    applyVideoMirror();
    applyLiveFilter();
    await enumerateCameras();
  } catch(err) {
    setStatus('Gagal mengakses kamera.');
    alert('Kamera tidak bisa diakses. Pastikan browser berjalan di HTTPS/localhost dan izin kamera diberikan.');
    console.error(err);
  }
}

/* ── Filter ───────────────────────────────────────────── */
const FILTERS = {
  none:    'none',
  bw:      'grayscale(1) contrast(1.08)',
  warm:    'sepia(.20) saturate(1.24) brightness(1.04)',
  bright:  'brightness(1.16) contrast(1.04)',
  vintage: 'sepia(.42) contrast(1.05) saturate(.82)',
  cool:    'hue-rotate(20deg) saturate(1.1) brightness(1.05)',
};
function getFilterValue() { return FILTERS[els.filterMode.value] || 'none'; }
function applyLiveFilter() { els.video.style.filter = getFilterValue(); }
function applyVideoMirror() { els.video.style.transform = mirrorMode ? 'scaleX(-1)' : 'none'; }

/* ── Capture ──────────────────────────────────────────── */
function capturePhoto() {
  const v = els.video;
  const c = els.shotCanvas;
  c.width  = v.videoWidth  || 1080;
  c.height = v.videoHeight || 1080;
  const ctx = c.getContext('2d');
  ctx.save();
  ctx.filter = getFilterValue();
  if (mirrorMode) { ctx.translate(c.width, 0); ctx.scale(-1, 1); }
  ctx.drawImage(v, 0, 0, c.width, c.height);
  ctx.restore();
  return c.toDataURL('image/jpeg', 0.96);
}

/* ── Countdown ────────────────────────────────────────── */
async function runCountdown(seconds) {
  els.countdown.classList.remove('hidden');
  for (let i = seconds; i >= 1; i--) {
    els.countdown.textContent = i;
    els.countdown.classList.remove('pop');
    void els.countdown.offsetWidth;
    els.countdown.classList.add('pop');
    if (i <= 3) playTone(330 + i * 80, 0.18);
    await sleep(920);
  }
  els.countdown.textContent = '📸';
  playShutter();
  await sleep(120);
  els.countdown.classList.add('hidden');
  els.flash.classList.remove('hidden');
  await sleep(210);
  els.flash.classList.add('hidden');
}

/* ── Session ──────────────────────────────────────────── */
async function startSession() {
  if (!stream || sessionRunning) return;
  ensureAudio();
  setBusy(true);
  resetResult(false);
  capturedPhotos = [];
  updatePhotoGrid([]);

  const total   = Number(els.layoutMode.value);
  const seconds = Number(els.countdownSeconds.value);

  setProgress(0);
  for (let i = 0; i < total; i++) {
    setStatus(`Foto ${i+1} dari ${total} – bersiap…`);
    await runCountdown(seconds);
    capturedPhotos.push(capturePhoto());
    els.shotCounter.textContent = `${capturedPhotos.length}/${total} foto`;
    updatePhotoGrid(capturedPhotos);
    setProgress(Math.round(((i+1) / total) * 70));
    if (i < total-1) await sleep(500);
  }

  setStatus('Merender gambar final…');
  setProgress(80);
  await renderFinalImage();
  setProgress(100);
  setStatus('Selesai! Silakan download atau bagikan.');
  setBusy(false);
}

/* ── Thumbnail strip ──────────────────────────────────── */
function updatePhotoGrid(photos) {
  if (!els.photoGrid) return;
  els.photoGrid.innerHTML = '';
  photos.forEach((src, i) => {
    const img = document.createElement('img');
    img.src = src; img.alt = `Foto ${i+1}`; img.className = 'thumb-img';
    els.photoGrid.appendChild(img);
  });
  els.photoGrid.classList.toggle('hidden', photos.length === 0);
}

/* ── Canvas helpers ───────────────────────────────────── */
function roundedRect(ctx, x, y, w, h, r) {
  r = Math.min(r || 0, w/2, h/2);
  ctx.beginPath();
  if (r <= 0) {
    ctx.rect(x, y, w, h);
  } else {
    ctx.moveTo(x+r, y);
    ctx.arcTo(x+w, y,   x+w, y+h, r);
    ctx.arcTo(x+w, y+h, x,   y+h, r);
    ctx.arcTo(x,   y+h, x,   y,   r);
    ctx.arcTo(x,   y,   x+w, y,   r);
  }
  ctx.closePath();
}

function withSlotTransform(ctx, slot, cb) {
  const angle = (slot.angle || 0) * Math.PI / 180;
  const cx = slot.x + slot.w / 2;
  const cy = slot.y + slot.h / 2;
  ctx.save();
  if (angle) {
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    cb(-slot.w / 2, -slot.h / 2, slot.w, slot.h);
  } else {
    cb(slot.x, slot.y, slot.w, slot.h);
  }
  ctx.restore();
}

/* object-cover: fill the slot, crop from center */
function drawImageCover(ctx, img, x, y, w, h, r = 0) {
  const scale = Math.max(w / img.width, h / img.height);
  const sw = w / scale, sh = h / scale;
  const sx = (img.width  - sw) / 2;
  const sy = (img.height - sh) / 2;
  ctx.save();
  if (r > 0) { roundedRect(ctx, x, y, w, h, r); ctx.clip(); }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  ctx.restore();
}

function drawImageContain(ctx, img, x, y, w, h, r = 0) {
  const scale = Math.min(w / img.width, h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  const dx = x + (w - dw) / 2;
  const dy = y + (h - dh) / 2;

  ctx.save();
  if (r > 0) { roundedRect(ctx, x, y, w, h, r); ctx.clip(); }
  ctx.fillStyle = '#111';
  ctx.fillRect(x, y, w, h);
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

function loadImage(src) {
  return new Promise((res, rej) => {
    const i = new Image();
    i.crossOrigin = 'anonymous';
    i.onload  = () => res(i);
    i.onerror = rej;
    i.src = src;
  });
}

async function getFrameImage(frameKey) {
  if (customFrameImage) return customFrameImage;
  const config = FRAME_CONFIGS[frameKey];
  if (!config?.path) return null;
  if (!frameImageCache[frameKey]) frameImageCache[frameKey] = await loadImage(config.path);
  return frameImageCache[frameKey];
}

/* Full background, supaya hasil jepretan terasa berada di belakang template */
function drawFullBleedPhotoBackground(ctx, img) {
  ctx.save();
  ctx.filter = 'blur(14px) brightness(.72) saturate(1.05)';
  drawImageCover(ctx, img, -24, -24, STORY_W + 48, STORY_H + 48, 0);
  ctx.restore();

  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,.18)';
  ctx.fillRect(0, 0, STORY_W, STORY_H);
  ctx.restore();
}

/* Subtle inset shadow so photo looks inside the frame */
function addDepth(ctx, x, y, w, h, r) {
  ctx.save();
  roundedRect(ctx, x, y, w, h, r);
  ctx.clip();

  const g = ctx.createLinearGradient(x, y, x, y+h);
  g.addColorStop(0,    'rgba(0,0,0,.16)');
  g.addColorStop(0.06, 'rgba(0,0,0,0)');
  g.addColorStop(0.94, 'rgba(0,0,0,0)');
  g.addColorStop(1,    'rgba(0,0,0,.12)');
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);

  const gx = ctx.createLinearGradient(x, y, x+w, y);
  gx.addColorStop(0,    'rgba(0,0,0,.10)');
  gx.addColorStop(0.04, 'rgba(0,0,0,0)');
  gx.addColorStop(0.96, 'rgba(0,0,0,0)');
  gx.addColorStop(1,    'rgba(0,0,0,.08)');
  ctx.fillStyle = gx; ctx.fillRect(x, y, w, h);
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = 'rgba(0,0,0,.12)';
  ctx.lineWidth = 2;
  roundedRect(ctx, x+1, y+1, w-2, h-2, r);
  ctx.stroke();
  ctx.restore();
}

function splitBaseSlot(slot, count) {
  const { x, y, w, h, radius = 0 } = slot;
  if (count === 1) return [{ x, y, w, h, radius }];

  const gap = count <= 2 ? 18 : count === 3 ? 15 : 12;
  const pH = Math.floor((h - gap * (count - 1)) / count);
  return Array.from({ length: count }, (_, i) => ({
    x,
    y: y + i * (pH + gap),
    w,
    h: pH,
    radius: Math.max(4, radius - 4),
  }));
}

function getSlotsForFrame(frameKey, count) {
  const config = FRAME_CONFIGS[frameKey];
  if (!config) return [];
  if (config.slotsByCount?.[count]) return config.slotsByCount[count];
  if (config.baseSlot) return splitBaseSlot(config.baseSlot, count);
  return [];
}

/*
  Foto ditempatkan DI BELAKANG frame:
  - Untuk scrapbook: sesuai transparent window masing-masing template.
  - Untuk frame standar: split otomatis 1/2/3/4 di baseSlot.
*/
function drawPhotosBehindFrame(ctx, images, slots) {
  slots.forEach((slot, i) => {
    const img = images[i % images.length];
    const r = slot.radius || 0;

    withSlotTransform(ctx, slot, (x, y, w, h) => {
      // Cover agar ruang penuh terisi foto, bukan seperti gambar kecil ditempel.
      drawImageCover(ctx, img, x, y, w, h, r);
      addDepth(ctx, x, y, w, h, r);
    });
  });
}

/* Background fill behind photos */
function fillBase(ctx, frameKey) {
  const g = ctx.createLinearGradient(0, 0, 0, STORY_H);
  if (['wisuda'].includes(frameKey)) {
    g.addColorStop(0, '#111111');
    g.addColorStop(1, '#1c1c1c');
  } else {
    g.addColorStop(0, '#f8fafc');
    g.addColorStop(1, '#ececec');
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, STORY_W, STORY_H);
}

/* ── Render final image ───────────────────────────────── */
async function renderFinalImage() {
  if (!capturedPhotos.length) return;

  const images  = await Promise.all(capturedPhotos.map(loadImage));
  const total   = images.length;
  const frameKey = resolveFrameKey(total);
  const slots   = getSlotsForFrame(frameKey, total);

  const canvas  = document.createElement('canvas');
  canvas.width  = STORY_W;
  canvas.height = STORY_H;
  const ctx     = canvas.getContext('2d');

  /*
    1. Base
    2. Full-bleed foto pertama sebagai background bawah template
    3. Foto utama di slot transparan
    4. Frame overlay paling atas
  */
  fillBase(ctx, frameKey);
  drawFullBleedPhotoBackground(ctx, images[0]);
  drawPhotosBehindFrame(ctx, images, slots);

  const frame = await getFrameImage(frameKey);
  if (frame) ctx.drawImage(frame, 0, 0, STORY_W, STORY_H);

  const dataUrl = canvas.toDataURL('image/png');
  els.finalPreview.src = dataUrl;
  els.finalPreview.classList.remove('hidden');
  els.emptyResult.classList.add('hidden');

  if (finalObjectUrl) URL.revokeObjectURL(finalObjectUrl);
  finalBlob = await new Promise(res => canvas.toBlob(res, 'image/png'));
  finalObjectUrl = URL.createObjectURL(finalBlob);

  const safeEvent = (els.eventName.value.trim() || 'labshot')
    .toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');

  els.downloadBtn.href     = finalObjectUrl;
  els.downloadBtn.download = `${safeEvent}-story-${Date.now()}.png`;
  els.downloadBtn.classList.remove('disabled');
  els.shareBtn.disabled    = false;
  els.retakeBtn.disabled   = false;

  renderQRCode(finalObjectUrl);
}

function renderQRCode(val) {
  els.qrCode.innerHTML = '';
  if (!window.QRCode) { els.qrNote.textContent = 'Library QR belum termuat.'; return; }
  new QRCode(els.qrCode, { text: val, width: 102, height: 102, correctLevel: QRCode.CorrectLevel.M });
  els.qrNote.textContent = 'Output: Story IG 1080×1920. Foto dirender full di layer belakang template.';
}

/* ── Reset ────────────────────────────────────────────── */
function resetResult(clearPhotos = true) {
  if (clearPhotos) { capturedPhotos = []; updatePhotoGrid([]); }
  if (finalObjectUrl) URL.revokeObjectURL(finalObjectUrl);
  finalBlob = null; finalObjectUrl = null;
  els.finalPreview.removeAttribute('src');
  els.finalPreview.classList.add('hidden');
  els.emptyResult.classList.remove('hidden');
  els.downloadBtn.removeAttribute('href');
  els.downloadBtn.classList.add('disabled');
  els.shareBtn.disabled = true;
  els.qrCode.innerHTML  = '';
  els.qrNote.textContent = 'QR aktif setelah foto dibuat.';
  els.shotCounter.textContent = `${capturedPhotos.length} foto`;
  setProgress(0);
  setStatus(stream ? 'Kamera aktif. Siap memotret!' : 'Kamera belum aktif.');
}

/* ── Share ────────────────────────────────────────────── */
async function sharePhoto() {
  if (!finalBlob) return;
  const file = new File([finalBlob], els.downloadBtn.download || 'labshot.png', { type:'image/png' });
  if (navigator.canShare?.({ files:[file] })) {
    try { await navigator.share({ title:'LabShot Photobox', files:[file] }); }
    catch(e) { console.warn(e); }
  } else {
    alert('Browser ini belum mendukung fitur bagikan file. Gunakan tombol Download.');
  }
}

/* ── Custom frame upload ──────────────────────────────── */
function handleCustomFrameUpload(e) {
  const file = e.target.files?.[0];
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

/* ── Event wiring ─────────────────────────────────────── */
els.startCameraBtn .addEventListener('click',  () => startCamera());
els.startSessionBtn.addEventListener('click',  startSession);
els.retakeBtn      .addEventListener('click',  () => { resetResult(true); els.retakeBtn.disabled = true; });
els.shareBtn       .addEventListener('click',  sharePhoto);
els.customFrame    .addEventListener('change', handleCustomFrameUpload);

els.mirrorToggle.addEventListener('change', () => { mirrorMode = els.mirrorToggle.checked; applyVideoMirror(); });
els.soundToggle .addEventListener('change', () => { soundEnabled = els.soundToggle.checked; });
els.cameraSelect.addEventListener('change', () => startCamera(els.cameraSelect.value));

[els.eventName, els.frameTheme, els.layoutMode].forEach(el =>
  el.addEventListener('change', () => { if (capturedPhotos.length) renderFinalImage(); })
);
els.filterMode.addEventListener('change', () => {
  applyLiveFilter();
  if (capturedPhotos.length) renderFinalImage();
});

/* ── Init ─────────────────────────────────────────────── */
applyVideoMirror();
resetResult(true);
