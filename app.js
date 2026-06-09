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

let stream = null;
let capturedPhotos = [];
let finalBlob = null;
let finalObjectUrl = null;
let customFrameImage = null;

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
        width: { ideal: 1920 },
        height: { ideal: 1080 },
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
  const ratio = video.videoWidth / video.videoHeight || 16 / 9;
  canvas.width = 1400;
  canvas.height = Math.round(canvas.width / ratio);
  const ctx = canvas.getContext('2d');
  ctx.save();
  ctx.filter = getFilterValue();
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  ctx.restore();
  return canvas.toDataURL('image/jpeg', 0.92);
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

function drawTheme(ctx, theme, w, h, eventName, photoCount) {
  ctx.save();

  if (theme === 'classic') {
    const grd = ctx.createLinearGradient(0, 0, w, h);
    grd.addColorStop(0, '#f8fafc');
    grd.addColorStop(1, '#e0f2fe');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);
  }
  if (theme === 'cfd') {
    const grd = ctx.createLinearGradient(0, 0, w, h);
    grd.addColorStop(0, '#fff7ed');
    grd.addColorStop(1, '#fed7aa');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(251,146,60,.18)';
    for (let i = -w; i < w * 2; i += 72) {
      ctx.fillRect(i, h - 130, 42, 130);
    }
  }
  if (theme === 'capstone') {
    const grd = ctx.createLinearGradient(0, 0, w, h);
    grd.addColorStop(0, '#ecfeff');
    grd.addColorStop(1, '#dbeafe');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(14,165,233,.18)';
    ctx.lineWidth = 2;
    for (let x = 0; x < w; x += 46) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 46) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
  }
  if (theme === 'wisuda') {
    const grd = ctx.createLinearGradient(0, 0, w, h);
    grd.addColorStop(0, '#111827');
    grd.addColorStop(1, '#312e81');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(251,191,36,.25)';
    ctx.beginPath(); ctx.arc(w - 90, 90, 130, 0, Math.PI * 2); ctx.fill();
  }

  const dark = theme === 'wisuda';
  ctx.textAlign = 'center';
  ctx.fillStyle = dark ? '#ffffff' : '#0f172a';
  ctx.font = '900 48px Inter, Arial, sans-serif';
  ctx.fillText(eventName || 'LabShot Photobox', w / 2, photoCount === 1 ? 82 : 76);

  ctx.font = '700 22px Inter, Arial, sans-serif';
  ctx.fillStyle = dark ? 'rgba(255,255,255,.72)' : 'rgba(15,23,42,.58)';
  const date = new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(new Date());
  ctx.fillText(date, w / 2, photoCount === 1 ? 118 : 108);

  ctx.restore();
}

function drawFooter(ctx, theme, w, h) {
  const dark = theme === 'wisuda';
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = dark ? '#ffffff' : '#0f172a';
  ctx.font = '900 30px Inter, Arial, sans-serif';
  ctx.fillText('LABSHOT', w / 2, h - 68);
  ctx.font = '700 18px Inter, Arial, sans-serif';
  ctx.fillStyle = dark ? 'rgba(255,255,255,.70)' : 'rgba(15,23,42,.55)';
  ctx.fillText('Web Photobox • Prodi TI UMY', w / 2, h - 38);
  ctx.restore();
}

async function renderFinalImage() {
  const total = capturedPhotos.length;
  if (!total) return;

  const images = await Promise.all(capturedPhotos.map(loadImage));
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const theme = els.frameTheme.value;
  const eventName = els.eventName.value.trim();

  if (total === 1) {
    canvas.width = 1200;
    canvas.height = 1450;
    drawTheme(ctx, theme, canvas.width, canvas.height, eventName, total);
    drawImageCover(ctx, images[0], 90, 160, 1020, 1020, 46);
    drawFooter(ctx, theme, canvas.width, canvas.height);
  } else {
    canvas.width = 900;
    canvas.height = total === 3 ? 1580 : 1980;
    drawTheme(ctx, theme, canvas.width, canvas.height, eventName, total);
    const margin = 62;
    const top = 145;
    const gap = 32;
    const photoW = canvas.width - margin * 2;
    const photoH = total === 3 ? 380 : 372;
    images.forEach((img, idx) => {
      const y = top + idx * (photoH + gap);
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,.76)';
      roundedRect(ctx, margin - 12, y - 12, photoW + 24, photoH + 24, 34);
      ctx.fill();
      ctx.restore();
      drawImageCover(ctx, img, margin, y, photoW, photoH, 28);
    });
    drawFooter(ctx, theme, canvas.width, canvas.height);
  }

  if (customFrameImage) {
    ctx.drawImage(customFrameImage, 0, 0, canvas.width, canvas.height);
  }

  const dataUrl = canvas.toDataURL('image/png');
  els.finalPreview.src = dataUrl;
  els.finalPreview.classList.remove('hidden');
  els.emptyResult.classList.add('hidden');

  if (finalObjectUrl) URL.revokeObjectURL(finalObjectUrl);
  finalBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  finalObjectUrl = URL.createObjectURL(finalBlob);

  const safeEvent = (eventName || 'labshot').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
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
      correctLevel: QRCode.CorrectLevel.M
    });
    els.qrNote.textContent = 'QR demo dibuat dari link lokal browser. Untuk scan dari HP berbeda, gunakan backend/storage pada versi berikutnya.';
  } else {
    els.qrNote.textContent = 'Library QR belum termuat. Download tetap bisa dilakukan dari tombol Download.';
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
  els.qrNote.textContent = 'QR akan aktif setelah foto dibuat. Untuk download lintas perangkat, tambahkan backend/storage pada versi berikutnya.';
  els.shotCounter.textContent = `${capturedPhotos.length} foto`;
}

async function sharePhoto() {
  if (!finalBlob) return;
  const file = new File([finalBlob], els.downloadBtn.download || 'labshot.png', { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title: 'LabShot Photobox',
        text: 'Hasil foto dari LabShot',
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
[els.eventName, els.frameTheme, els.filterMode].forEach(el => {
  el.addEventListener('change', () => {
    if (capturedPhotos.length) renderFinalImage();
  });
});
