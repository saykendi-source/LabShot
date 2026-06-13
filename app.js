/* ─────────────────────────────────────────────
   LabShot v28 – app.js
   Perbaikan utama:
   - Preview frame mengikuti ukuran story IG secara proporsional.
   - Saat kamera aktif, preview live muncul langsung di slot foto.
   - Setelah semua foto diambil, user bisa menukar urutan, retake foto tertentu,
     lalu klik Finish untuk membuat hasil akhir dan QR.
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
  progressBar:       document.getElementById('progressBar'),
  statusText:        document.getElementById('statusText'),
  frameAutoCount:    document.getElementById('frameAutoCount'),
  frameAutoHint:     document.getElementById('frameAutoHint'),
  framePreviewTitle: document.getElementById('framePreviewTitle'),
  framePreviewCount: document.getElementById('framePreviewCount'),
  framePreviewNote:  document.getElementById('framePreviewNote'),
  framePreviewCanvas:document.getElementById('framePreviewCanvas'),
  reviewControls:  document.getElementById('reviewControls'),
  selectedPhotoLabel: document.getElementById('selectedPhotoLabel'),
  moveLeftBtn:     document.getElementById('moveLeftBtn'),
  moveRightBtn:    document.getElementById('moveRightBtn'),
  retakeSelectedBtn: document.getElementById('retakeSelectedBtn'),
  finishBtn:       document.getElementById('finishBtn'),
};

const STORY_W = 1080;
const STORY_H = 1920;

// Google Drive Gallery Upload
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyo7rb9TPvHjp6NJNphJfgirDSpkkiAWo_srxlpi1qsPQWbAQGGAIzW3t3lLxt6tq4QLw/exec";
const DRIVE_FOLDER_URL = "https://drive.google.com/drive/folders/1HLXr6Y-mX1EqveyV-KPtAQp-5Pt0e6GJ";
const DRIVE_UPLOAD_W = 720;
const DRIVE_UPLOAD_H = 1280;

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
    defaultCount: 1,
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

  tiUmyCampus: {
    label: 'TI UMY Campus Series',
    path: 'assets/frames/ti-umy-campus.png',
    defaultCount: 1,
    slotsByCount: {
      1: [
        { x: 56, y: 497, w: 967, h: 361, radius: 10 }
      ],
      2: [
        { x: 56, y: 497, w: 967, h: 172, radius: 10 },
        { x: 56, y: 686, w: 967, h: 172, radius: 10 }
      ]
    },
  },

  tiUmyShowcase: {
    label: 'TI UMY Showcase',
    path: 'assets/frames/ti-umy-showcase.png',
    defaultCount: 1,
    slotsByCount: {
      1: [
        { x: 474, y: 476, w: 531, h: 686, radius: 10 }
      ],
      2: [
        { x: 474, y: 476, w: 531, h: 333, radius: 10 },
        { x: 474, y: 829, w: 531, h: 333, radius: 10 }
      ]
    },
  },

  umyCampusSeries: {
    label: 'UMY Campus Series',
    path: 'assets/frames/umy-campus-series.png',
    defaultCount: 1,
    slotsByCount: {
      1: [
        { x: 44, y: 563, w: 991, h: 492, radius: 10 }
      ],
      2: [
        { x: 44, y: 563, w: 991, h: 238, radius: 10 },
        { x: 44, y: 817, w: 991, h: 238, radius: 10 }
      ]
    },
  },

  umyCitySeries: {
    label: 'UMY City Series',
    path: 'assets/frames/umy-city-series.png',
    defaultCount: 1,
    slotsByCount: {
      1: [
        { x: 41, y: 621, w: 668, h: 872, radius: 8 }
      ],
      2: [
        { x: 41, y: 621, w: 668, h: 425, radius: 8 },
        { x: 41, y: 1068, w: 668, h: 425, radius: 8 }
      ]
    },
  },



  friendshipBonds: {
    label: 'TI UMY Friendship',
    path: 'assets/frames/friendship-bonds-v23.png',
    defaultCount: 3,
    slotsByCount: {
      1: [
        { x: 46, y: 771, w: 642, h: 754, radius: 8 }
      ],
      2: [
        { x: 46, y: 771, w: 642, h: 754, radius: 8 },
        { x: 732, y: 1563, w: 304, h: 257, radius: 8 }
      ],
      3: [
        { x: 46, y: 771, w: 642, h: 754, radius: 8 },
        { x: 45, y: 1564, w: 217, h: 256, radius: 8 },
        { x: 732, y: 1563, w: 304, h: 257, radius: 8 }
      ]
    },
  },

  dailyQuote: {
    label: 'Daily Quote',
    path: 'assets/frames/daily-quote-v23.png',
    defaultCount: 2,
    slotsByCount: {
      1: [
        { x: 348, y: 721, w: 394, h: 689, radius: 6 }
      ],
      2: [
        { x: 348, y: 721, w: 394, h: 689, radius: 6 },
        { x: 784, y: 1528, w: 211, h: 206, radius: 6 }
      ]
    },
  },

  itFuture: {
    label: 'IT Future',
    path: 'assets/frames/it-future-v23.png',
    defaultCount: 3,
    slotsByCount: {
      1: [
        { x: 42, y: 699, w: 606, h: 841, radius: 8 }
      ],
      2: [
        { x: 42, y: 699, w: 606, h: 841, radius: 8 },
        { x: 687, y: 1704, w: 352, h: 162, radius: 8 }
      ],
      3: [
        { x: 42, y: 699, w: 606, h: 841, radius: 8 },
        { x: 39, y: 1579, w: 205, h: 287, radius: 8 },
        { x: 687, y: 1704, w: 352, h: 162, radius: 8 }
      ]
    },
  },
};

/* Frame otomatis mengikuti defaultCount masing-masing template. */
function resolveFrameKey(photoCount) {
  return els.frameTheme?.value || 'yogyakartaCity';
}


function getAutoPhotoCount(frameKey) {
  const config = FRAME_CONFIGS[frameKey];
  if (!config) return 1;
  if (Number.isFinite(config.defaultCount)) return config.defaultCount;
  if (config.slotsByCount) {
    const counts = Object.keys(config.slotsByCount).map(Number).sort((a, b) => a - b);
    return counts.includes(1) ? 1 : (counts[0] || 1);
  }
  return 1;
}

function updateFrameAutoInfo() {
  const frameKey = resolveFrameKey();
  const config = FRAME_CONFIGS[frameKey] || FRAME_CONFIGS.yogyakartaCity;
  const total = getAutoPhotoCount(frameKey);
  const label = config?.label || 'Frame';

  if (els.frameAutoCount) {
    els.frameAutoCount.textContent = `${total} foto otomatis`;
  }
  if (els.frameAutoHint) {
    els.frameAutoHint.textContent = `${label} akan mengambil ${total} foto secara otomatis.`;
  }
  if (els.framePreviewTitle) {
    els.framePreviewTitle.textContent = label;
  }
  if (els.framePreviewCount) {
    els.framePreviewCount.textContent = `${total} foto`;
  }
  if (els.shotCounter && !capturedPhotos.length) {
    els.shotCounter.textContent = `${total} foto`;
  }
  refreshReviewControls();
  renderFramePreview();
}

function getSupportedLayoutCounts(frameKey) {
  const config = FRAME_CONFIGS[frameKey];
  if (!config) return [1, 2, 3];
  if (config.slotsByCount) {
    return Object.keys(config.slotsByCount).map(Number).sort((a, b) => a - b);
  }
  return [1, 2, 3, 4];
}

function syncLayoutOptions() {
  updateFrameAutoInfo();
}

let stream            = null;
let capturedPhotos    = [];
let capturedPhotoImgs = [];
let finalBlob         = null;
let finalObjectUrl    = null;
let currentShareUrl   = '';
let currentUploadFileName = '';
let customFrameImage  = null;
let mirrorMode        = true;
let soundEnabled      = true;
let sessionRunning    = false;
let previewTimer      = null;
let selectedPhotoIndex = -1;
let retakeSlotIndex    = -1;
let reviewReady        = false;
const frameImageCache = {};


/* ── Preview helpers ──────────────────────────────────── */
function getLivePreviewSlotIndex(total) {
  if (retakeSlotIndex >= 0) return Math.min(retakeSlotIndex, Math.max(0, total - 1));
  return Math.min(capturedPhotoImgs.length, Math.max(0, total - 1));
}

function drawMediaCover(ctx, media, x, y, w, h, r = 0, opts = {}) {
  const srcW = media.videoWidth || media.naturalWidth || media.width || 1;
  const srcH = media.videoHeight || media.naturalHeight || media.height || 1;
  const scale = Math.max(w / srcW, h / srcH);
  const sw = w / scale;
  const sh = h / scale;
  const sx = Math.max(0, (srcW - sw) / 2);
  const sy = Math.max(0, (srcH - sh) / 2);
  const mirror = !!opts.mirror;
  const filter = opts.filter || 'none';

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  if (r > 0) { roundedRect(ctx, x, y, w, h, r); ctx.clip(); }
  ctx.filter = filter;

  if (mirror) {
    ctx.translate(x + w, y);
    ctx.scale(-1, 1);
    ctx.drawImage(media, sx, sy, sw, sh, 0, 0, w, h);
  } else {
    ctx.drawImage(media, sx, sy, sw, sh, x, y, w, h);
  }

  ctx.restore();
}

function drawPreviewSlotPlaceholder(ctx, slot, index, state = 'idle') {
  withSlotTransform(ctx, slot, (x, y, w, h) => {
    ctx.save();
    roundedRect(ctx, x, y, w, h, slot.radius || 0);
    ctx.clip();

    if (state === 'active') {
      const g = ctx.createLinearGradient(x, y, x, y + h);
      g.addColorStop(0, 'rgba(125,211,252,.34)');
      g.addColorStop(1, 'rgba(187,247,208,.24)');
      ctx.fillStyle = g;
    } else {
      ctx.fillStyle = 'rgba(255,255,255,.75)';
    }
    ctx.fillRect(x, y, w, h);
    ctx.restore();

    ctx.save();
    ctx.lineWidth = state === 'active' ? 8 : 4;
    ctx.strokeStyle = state === 'active' ? '#0ea5e9' : 'rgba(0,0,0,.18)';
    roundedRect(ctx, x, y, w, h, slot.radius || 0);
    ctx.stroke();

    const bubbleSize = Math.max(38, Math.min(60, w * 0.12));
    const bx = x + 18;
    const by = y + 18;
    ctx.fillStyle = state === 'active' ? '#0f766e' : 'rgba(17,24,39,.78)';
    ctx.beginPath();
    ctx.arc(bx + bubbleSize / 2, by + bubbleSize / 2, bubbleSize / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = `700 ${Math.max(18, bubbleSize * 0.45)}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(index + 1), bx + bubbleSize / 2, by + bubbleSize / 2 + 1);

    if (state === 'active') {
      const label = 'LIVE';
      const padX = 12;
      ctx.font = '800 20px Inter, sans-serif';
      const textW = ctx.measureText(label).width;
      const lx = x + w - textW - padX * 2 - 18;
      const ly = y + 18;
      ctx.fillStyle = 'rgba(15,79,62,.92)';
      roundedRect(ctx, lx, ly, textW + padX * 2, 34, 17);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, lx + (textW + padX * 2) / 2, ly + 18);
    }
    ctx.restore();
  });
}

function stopPreviewLoop() {
  if (previewTimer) {
    clearInterval(previewTimer);
    previewTimer = null;
  }
}

function startPreviewLoop() {
  stopPreviewLoop();
  renderFramePreview();
  if (!stream) return;
  previewTimer = setInterval(() => {
    renderFramePreview();
  }, 90);
}

async function renderFramePreview() {
  const canvas = els.framePreviewCanvas;
  if (!canvas) return;

  // Backing store dibuat lebih besar agar preview tetap tajam saat diperkecil di panel.
  const PREVIEW_SCALE = 1.5;
  const targetW = Math.round(STORY_W * PREVIEW_SCALE);
  const targetH = Math.round(STORY_H * PREVIEW_SCALE);

  if (canvas.width !== targetW || canvas.height !== targetH) {
    canvas.width = targetW;
    canvas.height = targetH;
  }

  const frameKey = resolveFrameKey();
  const total = getAutoPhotoCount(frameKey);
  const slots = getSlotsForFrame(frameKey, total);
  const ctx = canvas.getContext('2d');

  ctx.setTransform(PREVIEW_SCALE, 0, 0, PREVIEW_SCALE, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.clearRect(0, 0, STORY_W, STORY_H);
  fillBase(ctx, frameKey);

  // Background lembut agar frame transparan tetap nyaman dilihat.
  ctx.save();
  const g = ctx.createLinearGradient(0, 0, 0, STORY_H);
  g.addColorStop(0, '#fcfaf5');
  g.addColorStop(1, '#f5f7fb');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, STORY_W, STORY_H);
  ctx.restore();

  const liveIndex = getLivePreviewSlotIndex(total);
  const canShowLive = !!stream && els.video && els.video.readyState >= 2;

  slots.forEach((slot, i) => {
    const saved = capturedPhotoImgs[i];
    const isRetakingThisSlot = retakeSlotIndex === i;
    if (saved && !isRetakingThisSlot) {
      withSlotTransform(ctx, slot, (x, y, w, h) => {
        drawImageCover(ctx, saved, x, y, w, h, slot.radius || 0);
        addDepth(ctx, x, y, w, h, slot.radius || 0);
      });
    } else if (canShowLive && i === liveIndex) {
      withSlotTransform(ctx, slot, (x, y, w, h) => {
        drawMediaCover(ctx, els.video, x, y, w, h, slot.radius || 0, {
          mirror: mirrorMode,
          filter: getFilterValue()
        });
        addDepth(ctx, x, y, w, h, slot.radius || 0);
      });
      drawPreviewSlotPlaceholder(ctx, slot, i, 'active');
    } else {
      drawPreviewSlotPlaceholder(ctx, slot, i, 'idle');
    }
  });

  const frame = await getFrameImage(frameKey);
  if (frame) {
    ctx.drawImage(frame, 0, 0, STORY_W, STORY_H);
  }

  const currentStep = Math.min(capturedPhotoImgs.length + 1, total);
  if (els.framePreviewNote) {
    if (stream && capturedPhotoImgs.length < total) {
      els.framePreviewNote.textContent = `Slot aktif: foto ${currentStep} dari ${total}. Posisikan wajah pada kotak yang sedang bertanda LIVE.`;
    } else if (!stream) {
      els.framePreviewNote.textContent = `Pilih frame terlebih dahulu, lalu aktifkan kamera. Preview akan tampil langsung pada kotak foto ${total > 1 ? `(${total} take)` : ''}.`;
    } else {
      els.framePreviewNote.textContent = `Semua slot foto untuk frame ini sudah terisi. Klik Mulai Foto atau Ulangi untuk sesi baru.`;
    }
  }
}

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
  refreshReviewControls();
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
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    setStatus('Browser tidak mendukung akses kamera atau halaman belum HTTPS.');
    alert('Browser tidak mendukung akses kamera. Buka melalui HTTPS/GitHub Pages atau localhost.');
    return;
  }

  if (stream) {
    stream.getTracks().forEach(t => t.stop());
    stream = null;
  }

  setStatus('Menghubungkan kamera…');

  try {
    const constraints = {
      video: deviceId
        ? { deviceId: { exact: deviceId }, width: { ideal: 1920 }, height: { ideal: 1080 } }
        : { facingMode: 'user', width: { ideal: 1920 }, height: { ideal: 1080 } },
      audio: false,
    };

    stream = await navigator.mediaDevices.getUserMedia(constraints);

    els.video.srcObject = stream;
    await els.video.play();

    els.emptyCamera?.classList.add('hidden');
    if (els.startSessionBtn) els.startSessionBtn.disabled = false;
    if (els.startCameraBtn) {
      els.startCameraBtn.textContent = '✓ Kamera Aktif';
      els.startCameraBtn.classList.add('btn-active');
    }

    setStatus('Kamera aktif. Siap memotret!');
    applyVideoMirror();
    applyLiveFilter();
    await enumerateCameras();
    startPreviewLoop();

  } catch(err) {
    console.error('Camera error:', err);
    const msg = err?.name === 'NotAllowedError'
      ? 'Izin kamera ditolak. Klik ikon kamera/gembok di address bar lalu izinkan kamera.'
      : err?.name === 'NotFoundError'
        ? 'Kamera tidak ditemukan. Pastikan webcam terpasang dan tidak sedang dipakai aplikasi lain.'
        : 'Kamera tidak bisa diakses. Pastikan halaman dibuka via HTTPS/localhost dan izin kamera diberikan.';
    stopPreviewLoop();
    renderFramePreview();
    setStatus(msg);
    alert(msg);
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
  capturedPhotoImgs = [];
  selectedPhotoIndex = -1;
  retakeSlotIndex = -1;
  reviewReady = false;
  updatePhotoGrid([]);

  const frameKey = resolveFrameKey();
  const total = getAutoPhotoCount(frameKey);
  const seconds = Number(els.countdownSeconds?.value || 3);

  setProgress(0);
  renderFramePreview();

  for (let i = 0; i < total; i++) {
    setStatus(`Foto ${i + 1} dari ${total} – bersiap…`);
    await runCountdown(seconds);

    const shot = capturePhoto();
    capturedPhotos.push(shot);
    capturedPhotoImgs.push(await loadImage(shot));

    selectedPhotoIndex = i;
    els.shotCounter.textContent = `${capturedPhotos.length}/${total} foto`;
    updatePhotoGrid(capturedPhotos);
    renderFramePreview();
    setProgress(Math.round(((i + 1) / total) * 70));

    if (i < total - 1) await sleep(450);
  }

  reviewReady = true;
  selectedPhotoIndex = 0;
  updatePhotoGrid(capturedPhotos);
  renderFramePreview();
  setProgress(70);
  setStatus('Foto selesai diambil. Atur urutan/retake jika perlu, lalu klik Finish untuk membuat QR.');
  setBusy(false);
  refreshReviewControls();
}

/* ── Thumbnail strip ──────────────────────────────────── */
function updatePhotoGrid(photos) {
  if (!els.photoGrid) return;
  els.photoGrid.innerHTML = '';

  photos.forEach((src, i) => {
    const wrap = document.createElement('button');
    wrap.type = 'button';
    wrap.className = `thumb-wrap${i === selectedPhotoIndex ? ' selected' : ''}`;
    wrap.setAttribute('aria-label', `Pilih foto ${i + 1}`);
    wrap.addEventListener('click', () => selectPhoto(i));

    const img = document.createElement('img');
    img.src = src;
    img.alt = `Foto ${i + 1}`;
    img.className = 'thumb-img';

    const badge = document.createElement('span');
    badge.className = 'thumb-index';
    badge.textContent = i + 1;

    wrap.appendChild(img);
    wrap.appendChild(badge);
    els.photoGrid.appendChild(wrap);
  });

  els.photoGrid.classList.toggle('hidden', photos.length === 0);
  refreshReviewControls();
}


function selectPhoto(index) {
  if (index < 0 || index >= capturedPhotos.length) {
    selectedPhotoIndex = capturedPhotos.length ? 0 : -1;
  } else {
    selectedPhotoIndex = index;
  }
  updatePhotoGrid(capturedPhotos);
  renderFramePreview();
}

function refreshReviewControls() {
  const total = getAutoPhotoCount(resolveFrameKey());
  const hasPhotos = capturedPhotos.length > 0;
  const complete = capturedPhotos.length === total;
  const selected = selectedPhotoIndex >= 0 && selectedPhotoIndex < capturedPhotos.length;

  if (els.reviewControls) {
    els.reviewControls.classList.toggle('hidden', !hasPhotos);
  }

  if (els.selectedPhotoLabel) {
    els.selectedPhotoLabel.textContent = selected
      ? `Foto terpilih: ${selectedPhotoIndex + 1} dari ${capturedPhotos.length}`
      : 'Foto terpilih: -';
  }

  if (els.moveLeftBtn) {
    els.moveLeftBtn.disabled = !selected || selectedPhotoIndex === 0 || sessionRunning;
  }
  if (els.moveRightBtn) {
    els.moveRightBtn.disabled = !selected || selectedPhotoIndex === capturedPhotos.length - 1 || sessionRunning;
  }
  if (els.retakeSelectedBtn) {
    els.retakeSelectedBtn.disabled = !selected || sessionRunning || !stream;
  }
  if (els.finishBtn) {
    els.finishBtn.disabled = !complete || sessionRunning;
  }
}

function swapArrayItems(arr, a, b) {
  const tmp = arr[a];
  arr[a] = arr[b];
  arr[b] = tmp;
}

function moveSelectedPhoto(direction) {
  if (selectedPhotoIndex < 0) return;
  const next = selectedPhotoIndex + direction;
  if (next < 0 || next >= capturedPhotos.length) return;

  swapArrayItems(capturedPhotos, selectedPhotoIndex, next);
  swapArrayItems(capturedPhotoImgs, selectedPhotoIndex, next);
  selectedPhotoIndex = next;

  updatePhotoGrid(capturedPhotos);
  renderFramePreview();
  setStatus('Urutan foto diperbarui. Klik Finish jika sudah cocok.');
}

async function retakeSelectedPhoto() {
  if (!stream || sessionRunning) return;
  if (selectedPhotoIndex < 0 || selectedPhotoIndex >= capturedPhotos.length) return;

  ensureAudio();
  setBusy(true);
  retakeSlotIndex = selectedPhotoIndex;
  renderFramePreview();

  const seconds = Number(els.countdownSeconds?.value || 3);
  setStatus(`Retake foto ${selectedPhotoIndex + 1} – bersiap…`);
  await runCountdown(seconds);

  const shot = capturePhoto();
  capturedPhotos[selectedPhotoIndex] = shot;
  capturedPhotoImgs[selectedPhotoIndex] = await loadImage(shot);

  retakeSlotIndex = -1;
  updatePhotoGrid(capturedPhotos);
  renderFramePreview();

  setStatus(`Foto ${selectedPhotoIndex + 1} sudah diganti. Klik Finish jika sudah cocok.`);
  setBusy(false);
}

async function finishPhotoSession() {
  const total = getAutoPhotoCount(resolveFrameKey());
  if (capturedPhotos.length !== total || sessionRunning) return;

  setBusy(true);
  reviewReady = false;
  refreshReviewControls();
  setStatus('Membuat hasil akhir dan QR…');
  setProgress(80);

  await renderFinalImage();

  setProgress(100);
  setStatus('Selesai! QR dan tombol download sudah tersedia.');
  setBusy(false);
  refreshReviewControls();
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
  if (config.slotsByCount) {
    const counts = Object.keys(config.slotsByCount).map(Number).sort((a, b) => a - b);
    const fallback = counts.includes(1) ? 1 : counts[0];
    return config.slotsByCount[fallback] || [];
  }
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


async function createDriveUploadBlobFromCanvas(sourceCanvas) {
  const uploadCanvas = document.createElement('canvas');
  uploadCanvas.width = DRIVE_UPLOAD_W;
  uploadCanvas.height = DRIVE_UPLOAD_H;
  const uploadCtx = uploadCanvas.getContext('2d');
  uploadCtx.drawImage(sourceCanvas, 0, 0, DRIVE_UPLOAD_W, DRIVE_UPLOAD_H);
  return await new Promise(resolve => uploadCanvas.toBlob(resolve, 'image/jpeg', 0.62));
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      resolve(result.split(',')[1] || result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function makeDriveFileName() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mi = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  const rand = Math.random().toString(36).slice(2, 5);
  return `ls-${yy}${mm}${dd}-${hh}${mi}${ss}-${rand}.jpg`;
}

function makePhotoPageUrl(fileName) {
  return `${APPS_SCRIPT_URL}?n=${encodeURIComponent(fileName)}`;
}

async function uploadPhotoToGoogleDrive(blob, fileName) {
  const imageBase64 = await blobToBase64(blob);
  const payload = {
    imageBase64,
    fileName
  };

  await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    body: JSON.stringify(payload)
  });
}

/* ── Render final image ───────────────────────────────── */
async function renderFinalImage() {
  if (!capturedPhotos.length) return;

  const loadedImages = await Promise.all(capturedPhotos.map(loadImage));
  const images = loadedImages;
  const total = images.length;
  const frameKey = resolveFrameKey(total);
  const slots = getSlotsForFrame(frameKey, total);

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

  const safeEvent = ((els.eventName?.value || 'yogyakarta-city-series').trim() || 'yogyakarta-city-series')
    .toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');

  els.downloadBtn.href     = finalObjectUrl;
  els.downloadBtn.download = `${safeEvent}-story-${Date.now()}.png`;
  els.downloadBtn.classList.remove('disabled');
  els.shareBtn.disabled    = false;
  els.retakeBtn.disabled   = false;

  currentUploadFileName = makeDriveFileName();
  currentShareUrl = makePhotoPageUrl(currentUploadFileName);
  console.log('LabShot QR URL:', currentShareUrl);

  // QR sekarang unik untuk setiap sesi/foto, jadi pengunjung tidak melihat foto lain.
  renderQRCode(currentShareUrl);

  // Upload berjalan di background agar antrean photobox tidak tertahan.
  const driveUploadBlob = await createDriveUploadBlobFromCanvas(canvas);
  uploadPhotoToGoogleDrive(driveUploadBlob, currentUploadFileName)
    .then(() => {
      els.qrNote.innerHTML = `Foto sesi ini sudah dikirim. Scan QR untuk membuka hanya foto Anda. Jika sulit terbaca, klik <a class="qr-note-link" href="${currentShareUrl}" target="_blank" rel="noopener">buka link foto</a>.`;
    })
    .catch((error) => {
      console.error('Upload Google Drive gagal:', error);
      els.qrNote.textContent = 'Upload gagal. Gunakan tombol Download di layar ini.';
    });
}

function renderQRCode(val) {
  els.qrCode.innerHTML = '';
  if (!window.QRCode) { els.qrNote.textContent = 'Library QR belum termuat.'; return; }
  new QRCode(els.qrCode, {
    text: val,
    width: 220,
    height: 220,
    colorDark: '#111827',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.M
  });
  els.qrNote.innerHTML = `Scan QR untuk membuka foto khusus sesi ini. Jika sulit terbaca, klik <a class="qr-note-link" href="${val}" target="_blank" rel="noopener">buka link foto</a>.`;
}

/* ── Reset ────────────────────────────────────────────── */
function resetResult(clearPhotos = true) {
  if (clearPhotos) {
    capturedPhotos = [];
    capturedPhotoImgs = [];
    selectedPhotoIndex = -1;
    retakeSlotIndex = -1;
    reviewReady = false;
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
  els.qrNote.textContent = 'QR foto pribadi aktif setelah hasil dibuat.';
  if (capturedPhotos.length) {
    els.shotCounter.textContent = `${capturedPhotos.length} foto`;
  } else {
    updateFrameAutoInfo();
  }
  setProgress(0);
  setStatus(stream ? 'Kamera aktif. Siap memotret!' : 'Kamera belum aktif.');
  renderFramePreview();
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
    renderFramePreview();
    if (capturedPhotos.length) renderFinalImage();
    return;
  }
  const reader = new FileReader();
  reader.onload = async () => {
    customFrameImage = await loadImage(reader.result);
    renderFramePreview();
    if (capturedPhotos.length) renderFinalImage();
  };
  reader.readAsDataURL(file);
}

/* ── Event wiring ─────────────────────────────────────── */
function initLabShot() {
  if (!els.startCameraBtn || !els.video) {
    console.error('Elemen utama kamera tidak ditemukan. Pastikan index.html dan app.js berasal dari versi yang sama.');
    return;
  }

  els.startCameraBtn.addEventListener('click', () => startCamera());
  els.startSessionBtn?.addEventListener('click', startSession);
  els.retakeBtn?.addEventListener('click', () => {
    resetResult(true);
    els.retakeBtn.disabled = true;
    startPreviewLoop();
  });
  els.moveLeftBtn?.addEventListener('click', () => moveSelectedPhoto(-1));
  els.moveRightBtn?.addEventListener('click', () => moveSelectedPhoto(1));
  els.retakeSelectedBtn?.addEventListener('click', retakeSelectedPhoto);
  els.finishBtn?.addEventListener('click', finishPhotoSession);
  els.shareBtn?.addEventListener('click', sharePhoto);
  els.customFrame?.addEventListener('change', handleCustomFrameUpload);

  els.mirrorToggle?.addEventListener('change', () => {
    mirrorMode = els.mirrorToggle.checked;
    applyVideoMirror();
    renderFramePreview();
  });
  els.soundToggle?.addEventListener('change', () => { soundEnabled = els.soundToggle.checked; });
  els.cameraSelect?.addEventListener('change', () => startCamera(els.cameraSelect.value));

  [els.eventName, els.layoutMode].filter(Boolean).forEach(el =>
    el.addEventListener('change', () => { if (capturedPhotos.length) renderFinalImage(); })
  );

  els.frameTheme?.addEventListener('change', () => {
    updateFrameAutoInfo();
    resetResult(true);
    setStatus(stream ? 'Frame diganti. Preview sudah diperbarui.' : 'Frame diganti. Aktifkan kamera untuk preview live.');
  });

  els.filterMode?.addEventListener('change', () => {
    applyLiveFilter();
    renderFramePreview();
    if (capturedPhotos.length) {
      setStatus('Filter live diperbarui. Untuk hasil akhir, klik Finish lagi setelah cocok.');
    }
  });

  applyVideoMirror();
  updateFrameAutoInfo();
  resetResult(true);
  updateFrameAutoInfo();
  renderFramePreview();
  setStatus('Kamera belum aktif. Klik Aktifkan Kamera.');
  console.log('LabShot v31 loaded. Review foto sebelum Finish aktif.');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLabShot);
} else {
  initLabShot();
}
