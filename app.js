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
};

const STORY_W = 1080;
const STORY_H = 1920;

const builtInFrames = {
  classic: 'assets/frames/classic-story.png',
  cfd: 'assets/frames/cfd-story.png',
  capstone: 'assets/frames/capstone-story.png',
  wisuda: 'assets/frames/wisuda-story.png',
};

const frameSlots = {
  // Area foto agar terasa benar-benar masuk ke dalam frame.
  // Foto dibuat sedikit lebih besar ke arah tepi agar sebagian tertutup frame overlay transparan.
  classic: { x: 162, y: 214, w: 756, h: 1100, radius: 38 },
  cfd: { x: 66, y: 172, w: 948, h: 1188, radius: 18 },
  capstone: { x: 78, y: 140, w: 924, h: 1400, radius: 14 },
  wisuda: { x: 68, y: 180, w: 944, h: 1240, radius: 20 },
};

let stream = null;
let capturedPhotos = [];
let finalBlob = null;
let finalObjectUrl = null;
let customFrameImage = null;
const frameImageCache = {};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function setBusy(isBusy) {
  els.startSessionBtn.disabled = isBusy || !stream;
  els.startCameraBtn.disabled = isBusy;
  els.retakeBtn.disabled = isBusy || capturedPhotos.length === 0;
}

async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1080 },
        height: { ideal: 1920 },
        facingMode: 'user'
      },
      audio: false
    });
    els.video.srcObject = stream;
    els.emptyCamera.classList.add('hidden');
    els.startSessionBtn.disabled = false;
    els.startCameraBtn.textContent = 'Kamera Aktif';
  } catch (err) {
    alert('Kamera tidak bisa diakses. Pastikan browser berjalan di HTTPS/localhost dan izin kamera diberikan.');
    console.error(err);
  }
}

function getFilterValue() {
  const mode = els.filterMode.value;
  if (mode === 'bw') return 'grayscale(1) contrast(1.08)';
  if (mode === 'warm') return 'sepia(.20) saturate(1.24) brightness(1.04)';
  if (mode === 'bright') return 'brightness(1.16) contrast(1.04)';
  if (mode === 'vintage') return 'sepia(.42) contrast(1.05) saturate(.82)';
  return 'none';
}

function capturePhoto() {
  const video = els.video;
  const canvas = els.shotCanvas;
  const ratio = video.videoWidth / video.videoHeight || 3 / 4;
  canvas.width = 1080;
  canvas.height = Math.round(canvas.width / ratio);
  const ctx = canvas.getContext('2d');
  ctx.save();
  ctx.filter = getFilterValue();
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  ctx.restore();
  return canvas.toDataURL('image/jpeg', 0.94);
}

async function runCountdown(seconds) {
  els.countdown.classList.remove('hidden');
  for (let i = seconds; i >= 1; i--) {
    els.countdown.textContent = i;
    await sleep(850);
  }
  els.countdown.textContent = '📸';
  await sleep(180);
  els.countdown.classList.add('hidden');
  els.flash.classList.remove('hidden');
  await sleep(250);
  els.flash.classList.add('hidden');
}

async function startSession() {
  if (!stream) return;
  setBusy(true);
  resetResult(false);
  capturedPhotos = [];
  const total = Number(els.layoutMode.value);
  const seconds = Number(els.countdownSeconds.value);

  for (let i = 0; i < total; i++) {
    await runCountdown(seconds);
    capturedPhotos.push(capturePhoto());
    els.shotCounter.textContent = `${capturedPhotos.length} foto`;
    if (i < total - 1) await sleep(700);
  }

  await renderFinalImage();
  setBusy(false);
}

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

function drawImageCover(ctx, img, x, y, w, h, radius = 32) {
  const iw = img.width;
  const ih = img.height;
  const scale = Math.max(w / iw, h / ih);
  const sw = w / scale;
  const sh = h / scale;
  const sx = (iw - sw) / 2;
  const sy = (ih - sh) / 2;

  ctx.save();
  roundedRect(ctx, x, y, w, h, radius);
  ctx.clip();
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  ctx.restore();
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
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
    classic: ['#ffffff', '#f8fafc'],
    cfd: ['#ffffff', '#fff7ed'],
    capstone: ['#eff6ff', '#ecfeff'],
    wisuda: ['#ffffff', '#f8fafc'],
  };
  const [c1, c2] = palettes[theme] || palettes.classic;
  const grd = ctx.createLinearGradient(0, 0, STORY_W, STORY_H);
  grd.addColorStop(0, c1);
  grd.addColorStop(1, c2);
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, STORY_W, STORY_H);
}

function addInsetShadow(ctx, x, y, w, h, radius = 24) {
  ctx.save();
  ctx.strokeStyle = 'rgba(0,0,0,.12)';
  ctx.lineWidth = 3;
  roundedRect(ctx, x + 1.5, y + 1.5, w - 3, h - 3, radius);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,.05)';
  roundedRect(ctx, x, y, w, h, radius);
  ctx.clip();
  const grd = ctx.createLinearGradient(x, y, x, y + h);
  grd.addColorStop(0, 'rgba(0,0,0,.09)');
  grd.addColorStop(0.08, 'rgba(0,0,0,0)');
  grd.addColorStop(0.92, 'rgba(0,0,0,0)');
  grd.addColorStop(1, 'rgba(0,0,0,.07)');
  ctx.fillStyle = grd;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

function drawPhotoBlock(ctx, img, x, y, w, h, radius = 24, mode = 'embedded') {
  drawImageCover(ctx, img, x, y, w, h, radius);
  if (mode === 'embedded') {
    addInsetShadow(ctx, x, y, w, h, radius);
  } else {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,.85)';
    ctx.lineWidth = 6;
    roundedRect(ctx, x + 3, y + 3, w - 6, h - 6, radius);
    ctx.stroke();
    ctx.restore();
  }
}

function drawPhotosIntoSlot(ctx, images, slot, mode = 'embedded') {
  const total = images.length;
  if (total === 1) {
    drawPhotoBlock(ctx, images[0], slot.x, slot.y, slot.w, slot.h, slot.radius, mode);
    return;
  }

  const gap = total === 3 ? 18 : 16;
  const innerPadX = total >= 3 ? 6 : 0;
  const innerPadY = total >= 3 ? 6 : 0;
  const photoW = slot.w - innerPadX * 2;
  const photoH = Math.floor((slot.h - innerPadY * 2 - gap * (total - 1)) / total);

  images.forEach((img, idx) => {
    const y = slot.y + innerPadY + idx * (photoH + gap);
    drawPhotoBlock(ctx, img, slot.x + innerPadX, y, photoW, photoH, Math.max(14, slot.radius - 6), mode);
  });
}

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

  fillBase(ctx, theme);

  const frameImage = await getActiveFrameImage();

  // Foto selalu digambar lebih dulu agar benar-benar berada di balik frame.
  // Frame bawaan kini sudah dibuat transparan pada area kosongnya.
  drawPhotosIntoSlot(ctx, images, slot, customFrameImage ? 'custom' : 'embedded');

  if (frameImage) {
    ctx.drawImage(frameImage, 0, 0, canvas.width, canvas.height);
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
  els.downloadBtn.download = `${safeEvent}-story-${Date.now()}.png`;
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
      correctLevel: QRCode.CorrectLevel.M
    });
    els.qrNote.textContent = 'Hasil download sudah memakai format Story IG 1080 × 1920, dan foto ditanam di balik frame. QR masih berupa link lokal browser.';
  } else {
    els.qrNote.textContent = 'Hasil download sudah memakai format Story IG 1080 × 1920. Library QR belum termuat.';
  }
}

function resetResult(clearPhotos = true) {
  if (clearPhotos) capturedPhotos = [];
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
  els.qrNote.textContent = 'QR akan aktif setelah foto dibuat. Hasil foto otomatis memakai format Story IG 1080 × 1920 dan menyatu dengan frame.';
  els.shotCounter.textContent = `${capturedPhotos.length} foto`;
}

async function sharePhoto() {
  if (!finalBlob) return;
  const file = new File([finalBlob], els.downloadBtn.download || 'labshot-story.png', { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title: 'LabShot Photobox',
        text: 'Hasil foto Story IG dari LabShot',
        files: [file]
      });
    } catch (err) {
      console.warn(err);
    }
  } else {
    alert('Browser ini belum mendukung fitur bagikan file. Gunakan tombol Download.');
  }
}

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

els.startCameraBtn.addEventListener('click', startCamera);
els.startSessionBtn.addEventListener('click', startSession);
els.retakeBtn.addEventListener('click', () => {
  resetResult(true);
  els.retakeBtn.disabled = true;
});
els.shareBtn.addEventListener('click', sharePhoto);
els.customFrame.addEventListener('change', handleCustomFrameUpload);
[els.eventName, els.frameTheme, els.filterMode, els.layoutMode].forEach(el => {
  el.addEventListener('change', () => {
    if (capturedPhotos.length) renderFinalImage();
  });
});

resetResult(true);
