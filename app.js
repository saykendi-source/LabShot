/* ═══════════════════════════════════════════════════════════
   LabShot v37 – app.js
   Perbaikan dari v32:
   - Hapus referensi ke elemen yang sudah tidak ada di HTML
     (eventName, layoutMode, countdownSeconds, customFrame)
   - Hapus customFrameImage + handleCustomFrameUpload (tidak dipakai)
   - Hapus duplikasi panggilan updateFrameAutoInfo() di initLabShot
   - Hapus syncLayoutOptions() yang hanya memanggil updateFrameAutoInfo
   - Tambah upload status indicator (animasi dot: uploading/done/error)
   - Tombol Finish di-disable sementara selama render final image
   - Pesan status lebih informatif dengan ikon
═══════════════════════════════════════════════════════════ */

/* ── Element references ─────────────────────────────────── */
const els = {
  video:              document.getElementById('cameraPreview'),
  emptyCamera:        document.getElementById('emptyCamera'),
  startCameraBtn:     document.getElementById('startCameraBtn'),
  startSessionBtn:    document.getElementById('startSessionBtn'),
  retakeBtn:          document.getElementById('retakeBtn'),
  countdown:          document.getElementById('countdown'),
  flash:              document.getElementById('flash'),
  shotCanvas:         document.getElementById('shotCanvas'),
  themeSelect:        document.getElementById('themeSelect'),
  frameTheme:         document.getElementById('frameTheme'),
  filterMode:         document.getElementById('filterMode'),
  finalPreview:       document.getElementById('finalPreview'),
  emptyResult:        document.getElementById('emptyResult'),
  downloadBtn:        document.getElementById('downloadBtn'),
  shareBtn:           document.getElementById('shareBtn'),
  shotCounter:        document.getElementById('shotCounter'),
  qrCode:             document.getElementById('qrCode'),
  qrCodeOuter:        document.getElementById('qrCodeOuter'),
  qrNote:             document.getElementById('qrNote'),
  photoGrid:          document.getElementById('photoGrid'),
  mirrorToggle:       document.getElementById('mirrorToggle'),
  soundToggle:        document.getElementById('soundToggle'),
  cameraSelect:       document.getElementById('cameraSelect'),
  cameraSelectWrap:   document.getElementById('cameraSelectWrap'),
  progressBar:        document.getElementById('progressBar'),
  statusText:         document.getElementById('statusText'),
  statusToast:        document.getElementById('statusToast'),
  statusToastText:    document.getElementById('statusToastText'),
  frameAutoCount:     document.getElementById('frameAutoCount'),
  frameAutoHint:      document.getElementById('frameAutoHint'),
  framePreviewTitle:  document.getElementById('framePreviewTitle'),
  framePreviewCount:  document.getElementById('framePreviewCount'),
  framePreviewNote:   document.getElementById('framePreviewNote'),
  framePreviewCanvas: document.getElementById('framePreviewCanvas'),
  reviewControls:     document.getElementById('reviewControls'),
  selectedPhotoLabel: document.getElementById('selectedPhotoLabel'),
  moveLeftBtn:        document.getElementById('moveLeftBtn'),
  moveRightBtn:       document.getElementById('moveRightBtn'),
  retakeSelectedBtn:  document.getElementById('retakeSelectedBtn'),
  finishBtn:          document.getElementById('finishBtn'),
  uploadStatus:       document.getElementById('uploadStatus'),
  stepProgressChip:   document.getElementById('stepProgressChip'),
  stepChipLabel:      document.getElementById('stepChipLabel'),
  stepChipTrack:      document.getElementById('stepChipTrack'),
};

/* ── Constants ──────────────────────────────────────────── */
const STORY_W = 1080;
const STORY_H = 1920;

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyo7rb9TPvHjp6NJNphJfgirDSpkkiAWo_srxlpi1qsPQWbAQGGAIzW3t3lLxt6tq4QLw/exec';

// API template Google Drive (Apps Script langkah 3)
const TEMPLATE_API_URL = 'https://script.google.com/macros/s/AKfycbwaTxWDPI63zCO3GwE0pmgHRErlPoZUuP-_6Oye1oAY9ANCv7KJ_T_LbeYF3wrVrZXc/exec';

const DRIVE_UPLOAD_W  = 720;
const DRIVE_UPLOAD_H  = 1280;

/* ── Frame configurations ───────────────────────────────── */
let FRAME_THEMES = {
  "default": "Default LabShot",
  "one-piece": "Anime Pirate / Wanted Poster",
  "pendadaran": "Selamat Lulus Pendadaran",
  "skp": "Seminar Kerja Praktek",
  "ti": "TI UMY / Campus & Newspaper"
};

let FRAME_CONFIGS = {
  yogyakartaCity: {
    label: 'Yogyakarta City Series',
    path: 'assets/frames/yogyakarta-city-series.png',
    defaultCount: 1,
    slotsByCount: {
      1: [{ x: 78,  y: 558,  w: 602, h: 905, radius: 10 }],
      2: [{ x: 78,  y: 558,  w: 602, h: 442, radius: 10 },
          { x: 78,  y: 1021, w: 602, h: 442, radius: 10 }],
      3: [{ x: 78,  y: 558,  w: 602, h: 289, radius: 10 },
          { x: 78,  y: 866,  w: 602, h: 289, radius: 10 },
          { x: 78,  y: 1174, w: 602, h: 289, radius: 10 }],
      4: [{ x: 78,  y: 558,  w: 602, h: 211, radius: 10 },
          { x: 78,  y: 790,  w: 602, h: 211, radius: 10 },
          { x: 78,  y: 1022, w: 602, h: 211, radius: 10 },
          { x: 78,  y: 1254, w: 602, h: 209, radius: 10 }],
    },
  },
  tiUmyCampus: {
    label: 'TI UMY Campus Series',
    path: 'assets/frames/ti-umy-campus.png',
    defaultCount: 1,
    slotsByCount: {
      1: [{ x: 56, y: 497, w: 967, h: 361, radius: 10 }],
      2: [{ x: 56, y: 497, w: 967, h: 172, radius: 10 },
          { x: 56, y: 686, w: 967, h: 172, radius: 10 }],
    },
  },
  tiUmyShowcase: {
    label: 'TI UMY Showcase',
    path: 'assets/frames/ti-umy-showcase.png',
    defaultCount: 1,
    slotsByCount: {
      1: [{ x: 474, y: 476, w: 531, h: 686, radius: 10 }],
      2: [{ x: 474, y: 476, w: 531, h: 333, radius: 10 },
          { x: 474, y: 829, w: 531, h: 333, radius: 10 }],
    },
  },
  umyCampusSeries: {
    label: 'UMY Campus Series',
    path: 'assets/frames/umy-campus-series.png',
    defaultCount: 1,
    slotsByCount: {
      1: [{ x: 44, y: 563, w: 991, h: 492, radius: 10 }],
      2: [{ x: 44, y: 563, w: 991, h: 238, radius: 10 },
          { x: 44, y: 817, w: 991, h: 238, radius: 10 }],
    },
  },
  umyCitySeries: {
    label: 'UMY City Series',
    path: 'assets/frames/umy-city-series.png',
    defaultCount: 1,
    slotsByCount: {
      1: [{ x: 41, y: 621, w: 668, h: 872, radius: 8 }],
      2: [{ x: 41, y: 621, w: 668, h: 425, radius: 8 },
          { x: 41, y: 1068, w: 668, h: 425, radius: 8 }],
    },
  },
  friendshipBonds: {
    label: 'TI UMY Friendship',
    path: 'assets/frames/friendship-bonds-v23.png',
    defaultCount: 3,
    slotsByCount: {
      1: [{ x: 46,  y: 771,  w: 642, h: 754, radius: 8 }],
      2: [{ x: 46,  y: 771,  w: 642, h: 754, radius: 8 },
          { x: 732, y: 1563, w: 304, h: 257, radius: 8 }],
      3: [{ x: 46,  y: 771,  w: 642, h: 754, radius: 8 },
          { x: 45,  y: 1564, w: 217, h: 256, radius: 8 },
          { x: 732, y: 1563, w: 304, h: 257, radius: 8 }],
    },
  },
  dailyQuote: {
    label: 'Daily Quote',
    path: 'assets/frames/daily-quote-v23.png',
    defaultCount: 2,
    slotsByCount: {
      1: [{ x: 348, y: 721, w: 394, h: 689, radius: 6 }],
      2: [{ x: 348, y: 721, w: 394, h: 689, radius: 6 },
          { x: 784, y: 1528, w: 211, h: 206, radius: 6 }],
    },
  },
  itFuture: {
    label: 'IT Future',
    path: 'assets/frames/it-future-v23.png',
    defaultCount: 3,
    slotsByCount: {
      1: [{ x: 42,  y: 699,  w: 606, h: 841, radius: 8 }],
      2: [{ x: 42,  y: 699,  w: 606, h: 841, radius: 8 },
          { x: 687, y: 1704, w: 352, h: 162, radius: 8 }],
      3: [{ x: 42,  y: 699,  w: 606, h: 841, radius: 8 },
          { x: 39,  y: 1579, w: 205, h: 287, radius: 8 },
          { x: 687, y: 1704, w: 352, h: 162, radius: 8 }],
    },
  },
};



/* ── Google Drive Template Mode ────────────────────────────
   Template baru disimpan di Google Drive dan dibaca via Apps Script.
   Aplikasi hanya memuat template yang dipilih, sehingga GitHub lebih ringan.
──────────────────────────────────────────────────────────── */
const SLOT_LIBRARY_CONFIGS = JSON.parse(JSON.stringify(FRAME_CONFIGS));
const LOCAL_FALLBACK_KEYS = [
  'yogyakartaCity', 'tiUmyCampus', 'tiUmyShowcase', 'umyCampusSeries',
  'umyCitySeries', 'friendshipBonds', 'dailyQuote', 'itFuture'
];
const LOCAL_FALLBACK_CONFIGS = Object.fromEntries(
  LOCAL_FALLBACK_KEYS.filter(k => FRAME_CONFIGS[k]).map(k => [k, FRAME_CONFIGS[k]])
);
const LOCAL_FALLBACK_THEMES = { default: 'Default LabShot' };
const DRIVE_TEMPLATE_CACHE = {};

// Mode default dibuat ringan. Template baru akan dimuat dari Google Drive.
FRAME_THEMES = { ...LOCAL_FALLBACK_THEMES };
FRAME_CONFIGS = { ...LOCAL_FALLBACK_CONFIGS };

function slugifyText(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'template';
}

function normalizeTemplateName(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[^a-z0-9]+/g, '');
}

function basenameFromPath(path) {
  return String(path || '').split('/').pop() || '';
}

function jsonpRequest(url, params = {}, timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    const cbName = `labshotJsonp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const qs = new URLSearchParams({ ...params, callback: cbName });
    const script = document.createElement('script');
    let done = false;
    const cleanup = () => {
      delete window[cbName];
      script.remove();
    };
    const timer = setTimeout(() => {
      if (done) return;
      done = true; cleanup();
      reject(new Error('Timeout mengambil data dari Google Drive.'));
    }, timeoutMs);

    window[cbName] = (data) => {
      if (done) return;
      done = true; clearTimeout(timer); cleanup(); resolve(data);
    };
    script.onerror = () => {
      if (done) return;
      done = true; clearTimeout(timer); cleanup();
      reject(new Error('Gagal memuat API template Google Drive.'));
    };
    script.src = `${url}?${qs.toString()}`;
    document.body.appendChild(script);
  });
}

function findSlotConfigForDriveFrame(frame) {
  const candidates = [
    normalizeTemplateName(frame?.fileName),
    normalizeTemplateName(frame?.label),
  ].filter(Boolean);

  for (const cfg of Object.values(SLOT_LIBRARY_CONFIGS)) {
    const cfgCandidates = [
      normalizeTemplateName(cfg.path ? basenameFromPath(cfg.path) : ''),
      normalizeTemplateName(cfg.label),
    ].filter(Boolean);

    if (candidates.some(c => cfgCandidates.includes(c))) {
      return cfg;
    }
  }
  return null;
}

function createGenericSlots(count = 1) {
  count = Math.max(1, Math.min(4, Number(count) || 1));
  if (count === 1) {
    return { 1: [{ x: 150, y: 430, w: 780, h: 1050, radius: 12 }] };
  }
  if (count === 2) {
    return { 2: [
      { x: 145, y: 390,  w: 790, h: 520, radius: 12 },
      { x: 145, y: 1015, w: 790, h: 520, radius: 12 },
    ] };
  }
  if (count === 3) {
    return { 3: [
      { x: 150, y: 340,  w: 780, h: 360, radius: 12 },
      { x: 150, y: 780,  w: 780, h: 360, radius: 12 },
      { x: 150, y: 1220, w: 780, h: 360, radius: 12 },
    ] };
  }
  return { 4: [
    { x: 150, y: 300,  w: 780, h: 300, radius: 12 },
    { x: 150, y: 675,  w: 780, h: 300, radius: 12 },
    { x: 150, y: 1050, w: 780, h: 300, radius: 12 },
    { x: 150, y: 1425, w: 780, h: 300, radius: 12 },
  ] };
}

function createDriveFrameKey(themeKey, frame, index) {
  const base = slugifyText(frame?.label || frame?.fileName || `template-${index + 1}`);
  const idPart = String(frame?.id || index).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
  return `drive_${slugifyText(themeKey)}_${base}_${idPart}`;
}

function buildDriveConfig(themeKey, frame, index) {
  const matched = findSlotConfigForDriveFrame(frame);
  const guessedCount = Number(frame?.defaultCount || matched?.defaultCount || 1) || 1;
  const slotsByCount = matched?.slotsByCount
    ? JSON.parse(JSON.stringify(matched.slotsByCount))
    : createGenericSlots(guessedCount);

  return {
    theme: themeKey,
    label: frame?.label || frame?.fileName || `Template ${index + 1}`,
    fileName: frame?.fileName || '',
    driveId: frame?.id,
    defaultCount: Number(matched?.defaultCount || frame?.defaultCount || guessedCount) || 1,
    slotsByCount,
    remote: true,
    _slotSource: matched ? 'library' : 'generic',
  };
}

async function loadDriveManifest() {
  const data = await jsonpRequest(TEMPLATE_API_URL, { action: 'manifest' }, 25000);
  if (!data?.ok || !Array.isArray(data.themes)) {
    throw new Error(data?.error || 'Manifest Google Drive tidak valid.');
  }
  return data.themes;
}

async function initDriveTemplates() {
  try {
    setStatus('⏳ Memuat daftar template dari Google Drive…', 'info');
    const themes = await loadDriveManifest();
    const nextThemes = {};
    const nextConfigs = {};

    themes.forEach((theme, themeIndex) => {
      const themeKey = slugifyText(theme.value || theme.label || `tema-${themeIndex + 1}`);
      nextThemes[themeKey] = theme.label || themeKey;
      (theme.frames || []).forEach((frame, frameIndex) => {
        if (!frame?.id) return;
        const key = createDriveFrameKey(themeKey, frame, frameIndex);
        nextConfigs[key] = buildDriveConfig(themeKey, frame, frameIndex);
      });
    });

    if (!Object.keys(nextConfigs).length) throw new Error('Belum ada template di manifest Google Drive.');

    FRAME_THEMES = nextThemes;
    FRAME_CONFIGS = nextConfigs;
    console.log(`LabShot: ${Object.keys(nextConfigs).length} template dimuat dari Google Drive.`);
    return true;
  } catch (err) {
    console.warn('Template Drive gagal dimuat, memakai frame lokal bawaan:', err);
    FRAME_THEMES = { ...LOCAL_FALLBACK_THEMES };
    FRAME_CONFIGS = { ...LOCAL_FALLBACK_CONFIGS };
    setStatus('⚠️ Template Drive belum terbaca. Mode fallback lokal aktif.', 'warning');
    return false;
  }
}

function getFrameSlotsToClear(frameKey) {
  const count = getAutoPhotoCount(frameKey);
  return getSlotsForFrame(frameKey, count);
}

function clearSlotArea(ctx, slot) {
  withSlotTransform(ctx, slot, (x, y, w, h) => {
    const pad = 1;
    ctx.clearRect(x - pad, y - pad, w + pad * 2, h + pad * 2);
  });
}

function detectSlotsFromCanvas(canvas, desiredCount = 1) {
  const sw = 216, sh = 384;
  const small = document.createElement('canvas');
  small.width = sw; small.height = sh;
  const sctx = small.getContext('2d', { willReadFrequently: true });
  sctx.drawImage(canvas, 0, 0, sw, sh);
  const { data } = sctx.getImageData(0, 0, sw, sh);
  const mask = new Uint8Array(sw * sh);

  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const i = (y * sw + x) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      const neutral = (max - min) <= 7;
      const dark = r < 42 && g < 42 && b < 42;
      const lightChecker = neutral && max > 175 && max < 255;
      const transparent = a < 32;
      if (transparent || dark || lightChecker) mask[y * sw + x] = 1;
    }
  }

  const seen = new Uint8Array(sw * sh);
  const comps = [];
  const qx = [], qy = [];
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const start = y * sw + x;
      if (!mask[start] || seen[start]) continue;
      let head = 0, area = 0, minX = x, maxX = x, minY = y, maxY = y;
      qx.length = 0; qy.length = 0; qx.push(x); qy.push(y); seen[start] = 1;
      while (head < qx.length) {
        const cx = qx[head], cy = qy[head++]; area++;
        if (cx < minX) minX = cx; if (cx > maxX) maxX = cx;
        if (cy < minY) minY = cy; if (cy > maxY) maxY = cy;
        const nb = [[cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1]];
        for (const [nx, ny] of nb) {
          if (nx < 0 || ny < 0 || nx >= sw || ny >= sh) continue;
          const ni = ny * sw + nx;
          if (!mask[ni] || seen[ni]) continue;
          seen[ni] = 1; qx.push(nx); qy.push(ny);
        }
      }
      const bw = maxX - minX + 1, bh = maxY - minY + 1;
      const rectArea = bw * bh;
      const fill = area / Math.max(1, rectArea);
      if (area > sw * sh * 0.025 && bw > sw * 0.18 && bh > sh * 0.10 && fill > 0.38) {
        comps.push({ area, minX, minY, maxX, maxY, bw, bh });
      }
    }
  }

  comps.sort((a, b) => b.area - a.area);
  const chosen = [];
  for (const c of comps) {
    const overlaps = chosen.some(o => !(c.maxX < o.minX || c.minX > o.maxX || c.maxY < o.minY || c.minY > o.maxY));
    if (!overlaps) chosen.push(c);
    if (chosen.length >= desiredCount) break;
  }
  if (!chosen.length) return [];

  chosen.sort((a, b) => a.minY - b.minY || a.minX - b.minX);
  return chosen.map(c => ({
    x: Math.round(c.minX / sw * STORY_W),
    y: Math.round(c.minY / sh * STORY_H),
    w: Math.round((c.maxX - c.minX + 1) / sw * STORY_W),
    h: Math.round((c.maxY - c.minY + 1) / sh * STORY_H),
    radius: 10,
  }));
}

async function loadDriveFrameImage(frameKey, config) {
  const cacheKey = config.driveId;
  if (DRIVE_TEMPLATE_CACHE[cacheKey]) return DRIVE_TEMPLATE_CACHE[cacheKey];

  const data = await jsonpRequest(TEMPLATE_API_URL, { action: 'image', id: config.driveId }, 40000);
  if (!data?.ok || !data.dataUrl) throw new Error(data?.error || 'Template Drive gagal dimuat.');

  const source = await loadImage(data.dataUrl);
  const canvas = document.createElement('canvas');
  canvas.width = STORY_W; canvas.height = STORY_H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.clearRect(0, 0, STORY_W, STORY_H);
  ctx.drawImage(source, 0, 0, STORY_W, STORY_H);

  const desired = getAutoPhotoCount(frameKey);
  if (config._slotSource !== 'library') {
    const detected = detectSlotsFromCanvas(canvas, desired);
    if (detected.length) {
      config.slotsByCount = { [detected.length]: detected };
      config.defaultCount = detected.length;
      config._slotSource = 'detected';
    }
  }

  getFrameSlotsToClear(frameKey).forEach(slot => clearSlotArea(ctx, slot));
  const img = await loadImage(canvas.toDataURL('image/png'));
  DRIVE_TEMPLATE_CACHE[cacheKey] = img;
  return img;
}

/* ── Frame helpers ──────────────────────────────────────── */
function populateThemeOptions() {
  if (!els.themeSelect) return;
  const current = els.themeSelect.value || 'all';
  els.themeSelect.innerHTML = '';
  const allOpt = document.createElement('option');
  allOpt.value = 'all';
  allOpt.textContent = 'Semua Tema';
  els.themeSelect.appendChild(allOpt);
  Object.entries(FRAME_THEMES).forEach(([key, label]) => {
    const hasFrame = Object.values(FRAME_CONFIGS).some(cfg => (cfg.theme || 'default') === key);
    if (!hasFrame && key !== 'default') return;
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = label;
    els.themeSelect.appendChild(opt);
  });
  els.themeSelect.value = [...els.themeSelect.options].some(o => o.value === current) ? current : 'all';
}
function populateFrameOptions(themeKey = null) {
  if (!els.frameTheme) return;
  const selectedTheme = themeKey || els.themeSelect?.value || 'all';
  const currentFrame  = els.frameTheme.value;
  const entries = Object.entries(FRAME_CONFIGS).filter(([, cfg]) => {
    const t = cfg.theme || 'default';
    return selectedTheme === 'all' || t === selectedTheme;
  });
  els.frameTheme.innerHTML = '';
  entries.forEach(([key, cfg]) => {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = cfg.label || key;
    els.frameTheme.appendChild(opt);
  });
  const keepCurrent = entries.some(([key]) => key === currentFrame);
  els.frameTheme.value = keepCurrent ? currentFrame : (entries[0]?.[0] || Object.keys(FRAME_CONFIGS)[0] || '');
}
function resolveFrameKey() {
  return els.frameTheme?.value || Object.keys(FRAME_CONFIGS)[0] || 'yogyakartaCity';
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

function updateFrameAutoInfo() {
  const frameKey = resolveFrameKey();
  const config   = FRAME_CONFIGS[frameKey] || FRAME_CONFIGS.yogyakartaCity;
  const total    = getAutoPhotoCount(frameKey);
  const label    = config?.label || 'Frame';

  if (els.frameAutoCount)  els.frameAutoCount.textContent  = `${total} foto otomatis`;
  if (els.frameAutoHint)   els.frameAutoHint.textContent   = `${label} akan mengambil ${total} foto secara otomatis.`;
  if (els.framePreviewTitle) els.framePreviewTitle.textContent = label;
  if (els.framePreviewCount) els.framePreviewCount.textContent = `${total} foto`;
  if (els.shotCounter && !capturedPhotos.length) els.shotCounter.textContent = `${total} foto`;
  refreshReviewControls();
  renderFramePreview();
}

/* ── State ──────────────────────────────────────────────── */
let stream              = null;
let capturedPhotos      = [];
let capturedPhotoImgs   = [];
let finalBlob           = null;
let finalObjectUrl      = null;
let currentShareUrl     = '';
let currentUploadFileName = '';
let mirrorMode          = true;
let soundEnabled        = true;
let sessionRunning      = false;
let previewTimer        = null;
let selectedPhotoIndex  = -1;
let retakeSlotIndex     = -1;
let reviewReady         = false;
const frameImageCache   = {};

/* ── Upload status helper ───────────────────────────────── */
function setUploadStatus(state, msg) {
  const el = els.uploadStatus;
  if (!el) return;
  el.className = `upload-status ${state}`;
  el.innerHTML = state
    ? `<span class="upload-dot"></span>${msg}`
    : msg || '';
}

/* ── Preview helpers ─────────────────────────────────────── */
function getLivePreviewSlotIndex(total) {
  if (retakeSlotIndex >= 0) return Math.min(retakeSlotIndex, Math.max(0, total - 1));
  return Math.min(capturedPhotoImgs.length, Math.max(0, total - 1));
}

function getMainCameraViewportSize() {
  const videoEl    = els.video;
  const cameraCard = document.querySelector('.camera-card');
  const viewportW  = Math.max(1, Math.round(videoEl?.clientWidth  || cameraCard?.clientWidth  || 1080));
  const viewportH  = Math.max(1, Math.round(videoEl?.clientHeight || cameraCard?.clientHeight || 1920));
  return { viewportW, viewportH };
}

function getVisibleVideoSourceRect(media, viewportW = null, viewportH = null) {
  const srcW = media.videoWidth   || media.naturalWidth  || media.width  || 1;
  const srcH = media.videoHeight  || media.naturalHeight || media.height || 1;
  const vw   = Math.max(1, viewportW || srcW);
  const vh   = Math.max(1, viewportH || srcH);
  const scale = Math.max(vw / srcW, vh / srcH);
  const visibleSW = vw / scale;
  const visibleSH = vh / scale;
  const sx = Math.max(0, (srcW - visibleSW) / 2);
  const sy = Math.max(0, (srcH - visibleSH) / 2);
  return { sx, sy, sw: visibleSW, sh: visibleSH, srcW, srcH, viewportW: vw, viewportH: vh };
}

function drawMediaFromMainView(ctx, media, x, y, w, h, r = 0, opts = {}) {
  const { viewportW, viewportH } = getMainCameraViewportSize();
  const visible = getVisibleVideoSourceRect(media, viewportW, viewportH);
  const scale = Math.max(w / visible.sw, h / visible.sh);
  const sw = w / scale;
  const sh = h / scale;
  const sx = visible.sx + Math.max(0, (visible.sw - sw) / 2);
  const sy = visible.sy + Math.max(0, (visible.sh - sh) / 2);

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  if (r > 0) { roundedRect(ctx, x, y, w, h, r); ctx.clip(); }
  ctx.filter = opts.filter || 'none';

  if (opts.mirror) {
    ctx.translate(x + w, y); ctx.scale(-1, 1);
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

    const g = ctx.createLinearGradient(x, y, x, y + h);
    if (state === 'active') {
      g.addColorStop(0, 'rgba(125,211,252,.34)');
      g.addColorStop(1, 'rgba(187,247,208,.24)');
    } else {
      g.addColorStop(0, 'rgba(255,255,255,.70)');
      g.addColorStop(1, 'rgba(236,254,255,.50)');
    }
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    ctx.restore();

    ctx.save();
    ctx.lineWidth   = state === 'active' ? 7 : 3.5;
    ctx.strokeStyle = state === 'active' ? '#0ea5e9' : 'rgba(0,0,0,.15)';
    ctx.setLineDash(state === 'active' ? [] : [14, 8]);
    roundedRect(ctx, x, y, w, h, slot.radius || 0);
    ctx.stroke();
    ctx.setLineDash([]);

    const bSize = Math.max(34, Math.min(56, w * 0.12));
    const bx = x + 16, by = y + 16;
    ctx.fillStyle = state === 'active' ? '#0f766e' : 'rgba(17,24,39,.72)';
    ctx.beginPath();
    ctx.arc(bx + bSize / 2, by + bSize / 2, bSize / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = `700 ${Math.max(16, bSize * 0.44)}px Inter, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(String(index + 1), bx + bSize / 2, by + bSize / 2 + 1);

    if (state === 'active') {
      const label = 'LIVE';
      const padX  = 11;
      ctx.font = '800 18px Inter, sans-serif';
      const textW = ctx.measureText(label).width;
      const lx = x + w - textW - padX * 2 - 16, ly = y + 16;
      ctx.fillStyle = 'rgba(15,79,62,.90)';
      roundedRect(ctx, lx, ly, textW + padX * 2, 30, 15);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(label, lx + (textW + padX * 2) / 2, ly + 15);
    }
    ctx.restore();
  });
}

/* ── Preview loop ───────────────────────────────────────── */
function stopPreviewLoop() {
  if (previewTimer) { clearInterval(previewTimer); previewTimer = null; }
}

function startPreviewLoop() {
  stopPreviewLoop();
  renderFramePreview();
  if (!stream) return;
  previewTimer = setInterval(renderFramePreview, 90);
}

let _renderPreviewInProgress = false;

async function renderFramePreview() {
  // Prevent stacking concurrent canvas renders during Drive fetch
  if (_renderPreviewInProgress) return;
  _renderPreviewInProgress = true;
  try {
    await _renderFramePreviewInner();
  } finally {
    _renderPreviewInProgress = false;
  }
}

async function _renderFramePreviewInner() {
  const canvas = els.framePreviewCanvas;
  if (!canvas) return;

  const PREVIEW_SCALE = 1.5;
  const targetW = Math.round(STORY_W * PREVIEW_SCALE);
  const targetH = Math.round(STORY_H * PREVIEW_SCALE);
  if (canvas.width !== targetW || canvas.height !== targetH) {
    canvas.width = targetW; canvas.height = targetH;
  }

  const frameKey = resolveFrameKey();
  const total    = getAutoPhotoCount(frameKey);
  const frame    = await getFrameImage(frameKey);
  const slots    = getSlotsForFrame(frameKey, total);
  const ctx      = canvas.getContext('2d');

  ctx.setTransform(PREVIEW_SCALE, 0, 0, PREVIEW_SCALE, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.clearRect(0, 0, STORY_W, STORY_H);
  fillBase(ctx, frameKey);

  // Soft background for transparent windows
  ctx.save();
  const bg = ctx.createLinearGradient(0, 0, 0, STORY_H);
  bg.addColorStop(0, '#fcfaf5'); bg.addColorStop(1, '#f5f7fb');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, STORY_W, STORY_H);
  ctx.restore();

  const liveIndex   = getLivePreviewSlotIndex(total);
  const canShowLive = !!stream && els.video && els.video.readyState >= 2;

  slots.forEach((slot, i) => {
    const saved            = capturedPhotoImgs[i];
    const isRetakingThis   = retakeSlotIndex === i;

    if (saved && !isRetakingThis) {
      withSlotTransform(ctx, slot, (x, y, w, h) => {
        drawImageCover(ctx, saved, x, y, w, h, slot.radius || 0);
        addDepth(ctx, x, y, w, h, slot.radius || 0);
      });
    } else if (canShowLive && i === liveIndex) {
      withSlotTransform(ctx, slot, (x, y, w, h) => {
        drawMediaFromMainView(ctx, els.video, x, y, w, h, slot.radius || 0, {
          mirror: mirrorMode,
          filter: getFilterValue(),
        });
        addDepth(ctx, x, y, w, h, slot.radius || 0);
      });
      drawPreviewSlotPlaceholder(ctx, slot, i, 'active');
    } else {
      drawPreviewSlotPlaceholder(ctx, slot, i, 'idle');
    }
  });

  if (frame) ctx.drawImage(frame, 0, 0, STORY_W, STORY_H);

  // Update hint text
  if (els.framePreviewNote) {
    const step = Math.min(capturedPhotoImgs.length + 1, total);
    if (stream && capturedPhotoImgs.length < total) {
      els.framePreviewNote.textContent = `Slot aktif: foto ${step} dari ${total}. Posisikan wajah pada kotak bertanda LIVE.`;
    } else if (!stream) {
      els.framePreviewNote.textContent = `Pilih frame, lalu aktifkan kamera. Preview akan tampil langsung di kotak foto.`;
    } else {
      els.framePreviewNote.textContent = `Semua slot terisi. Atur urutan / retake, lalu klik ✓ Finish & Buat QR.`;
    }
  }
} // end _renderFramePreviewInner

/* ── Audio ──────────────────────────────────────────────── */
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
  } catch (_) {}
}
function playShutter() {
  if (!soundEnabled) return;
  try {
    ensureAudio();
    const buf = audioCtx.createBuffer(1, Math.floor(audioCtx.sampleRate * 0.07), audioCtx.sampleRate);
    const d   = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (d.length * 0.25));
    const s = audioCtx.createBufferSource();
    s.buffer = buf;
    const g = audioCtx.createGain(); g.gain.value = 0.55;
    s.connect(g); g.connect(audioCtx.destination); s.start();
  } catch (_) {}
}

/* ── 3. Toast status system ──────────────────────────────── */
let _toastTimer = null;
const TOAST_FLAVOURS = {
  idle:    { icon: '💤', cls: 'idle' },
  info:    { icon: 'ℹ️',  cls: 'info' },
  active:  { icon: '📷', cls: 'active' },
  success: { icon: '✅', cls: 'success' },
  warning: { icon: '⚠️', cls: 'warning' },
  error:   { icon: '🚫', cls: 'error' },
};

function setStatus(msg, flavour = 'info', autoDismissMs = 0) {
  // Legacy hidden element (JS compat)
  if (els.statusText) els.statusText.textContent = msg;

  const toast  = els.statusToast;
  const textEl = els.statusToastText;
  if (!toast || !textEl) return;

  // Auto-detect flavour from emoji prefix (use local vars, never mutate TOAST_FLAVOURS)
  let resolvedFlavour = flavour;
  if (flavour === 'info') {
    if (msg.startsWith('✅') || msg.startsWith('🎉'))             resolvedFlavour = 'success';
    else if (msg.startsWith('⚠️') || msg.startsWith('❌'))        resolvedFlavour = 'error';
    else if (msg.startsWith('📷') || msg.startsWith('📸') || msg.startsWith('⏳')) resolvedFlavour = 'active';
    else if (msg.startsWith('🔀') || msg.startsWith('🖼'))        resolvedFlavour = 'warning';
  }
  const f = TOAST_FLAVOURS[resolvedFlavour] || TOAST_FLAVOURS.info;

  const iconEl = toast.querySelector('.toast-icon');
  if (iconEl) iconEl.textContent = f.icon;
  textEl.textContent = msg.replace(/^[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}][\uFE0F]?\s*/u, '');

  toast.className = `status-toast ${f.cls} show`;

  if (_toastTimer) clearTimeout(_toastTimer);
  if (autoDismissMs > 0) {
    _toastTimer = setTimeout(() => toast.className = `status-toast ${f.cls}`, autoDismissMs);
  }
}

/* ── 7. Step progress chip ───────────────────────────────── */
function updateStepChip(current, total) {
  const chip  = els.stepProgressChip;
  const label = els.stepChipLabel;
  const track = els.stepChipTrack;
  if (!chip || !label || !track) return;

  if (total <= 0) {
    chip.classList.remove('visible');
    return;
  }

  chip.classList.add('visible');
  label.textContent = `Langkah ${Math.min(current + 1, total)} dari ${total}`;

  track.innerHTML = '';
  for (let i = 0; i < total; i++) {
    const pip = document.createElement('span');
    pip.className = 'step-chip-pip' + (i < current ? ' done' : i === current ? ' active' : '');
    track.appendChild(pip);
  }
}

function hideStepChip() {
  if (els.stepProgressChip) els.stepProgressChip.classList.remove('visible');
}

/* ── Helpers ─────────────────────────────────────────────── */
const sleep = ms => new Promise(r => setTimeout(r, ms));

function setProgress(pct) {
  if (els.progressBar) els.progressBar.style.width = pct + '%';
}
function setBusy(busy) {
  sessionRunning = busy;
  if (els.startSessionBtn) els.startSessionBtn.disabled = busy || !stream;
  if (els.startCameraBtn)  els.startCameraBtn.disabled  = busy;
  if (els.retakeBtn)       els.retakeBtn.disabled        = busy || capturedPhotos.length === 0;
  if (els.cameraSelect)    els.cameraSelect.disabled     = busy;
  refreshReviewControls();
}

/* ── Camera ──────────────────────────────────────────────── */
async function enumerateCameras() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cams    = devices.filter(d => d.kind === 'videoinput');
    if (!els.cameraSelect || !els.cameraSelectWrap) return;
    if (cams.length <= 1) { els.cameraSelectWrap.classList.add('hidden'); return; }
    els.cameraSelectWrap.classList.remove('hidden');
    els.cameraSelect.innerHTML = '';
    cams.forEach((c, i) => {
      const o = document.createElement('option');
      o.value = c.deviceId;
      o.textContent = c.label || `Kamera ${i + 1}`;
      els.cameraSelect.appendChild(o);
    });
    const active = stream?.getVideoTracks()[0]?.getSettings()?.deviceId;
    if (active) els.cameraSelect.value = active;
  } catch (_) {}
}

async function startCamera(deviceId = null) {
  if (!navigator.mediaDevices?.getUserMedia) {
    const msg = 'Browser tidak mendukung akses kamera atau halaman belum HTTPS.';
    setStatus('⚠️ ' + msg, 'error'); alert(msg); return;
  }
  if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
  setStatus('Menghubungkan kamera…', 'info');

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
    setStatus('📷 Kamera aktif. Siap memotret!', 'active');
    applyVideoMirror(); applyLiveFilter();
    await enumerateCameras();
    startPreviewLoop();
  } catch (err) {
    console.error('Camera error:', err);
    const msg = err?.name === 'NotAllowedError'
      ? 'Izin kamera ditolak. Klik ikon kamera/gembok di address bar lalu izinkan kamera.'
      : err?.name === 'NotFoundError'
        ? 'Kamera tidak ditemukan. Pastikan webcam terpasang dan tidak dipakai aplikasi lain.'
        : 'Kamera tidak bisa diakses. Pastikan halaman dibuka via HTTPS/localhost dan izin kamera diberikan.';
    stopPreviewLoop(); renderFramePreview();
    setStatus('⚠️ ' + msg, 'error'); alert(msg);
  }
}

/* ── Filter ──────────────────────────────────────────────── */
const FILTERS = {
  none:    'none',
  bw:      'grayscale(1) contrast(1.08)',
  warm:    'sepia(.20) saturate(1.24) brightness(1.04)',
  bright:  'brightness(1.16) contrast(1.04)',
  vintage: 'sepia(.42) contrast(1.05) saturate(.82)',
  cool:    'hue-rotate(20deg) saturate(1.1) brightness(1.05)',
};
function getFilterValue() { return FILTERS[els.filterMode?.value] || 'none'; }
function applyLiveFilter()  { if (els.video) els.video.style.filter    = getFilterValue(); }
function applyVideoMirror() { if (els.video) els.video.style.transform = mirrorMode ? 'scaleX(-1)' : 'none'; }

/* ── Capture ─────────────────────────────────────────────── */
function capturePhoto() {
  const v = els.video, c = els.shotCanvas;
  const { viewportW, viewportH } = getMainCameraViewportSize();
  const visible = getVisibleVideoSourceRect(v, viewportW, viewportH);
  c.width  = Math.max(1, Math.round(visible.sw));
  c.height = Math.max(1, Math.round(visible.sh));
  const ctx = c.getContext('2d');
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.filter = getFilterValue();
  if (mirrorMode) { ctx.translate(c.width, 0); ctx.scale(-1, 1); }
  ctx.drawImage(v, visible.sx, visible.sy, visible.sw, visible.sh, 0, 0, c.width, c.height);
  ctx.restore();
  return c.toDataURL('image/jpeg', 0.96);
}

/* ── Countdown ───────────────────────────────────────────── */
async function runCountdown(seconds = 3) {
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

/* ── Session ─────────────────────────────────────────────── */
async function startSession() {
  if (!stream || sessionRunning) return;
  ensureAudio();
  setBusy(true);
  resetResult(false);
  capturedPhotos    = [];
  capturedPhotoImgs = [];
  selectedPhotoIndex = -1;
  retakeSlotIndex    = -1;
  reviewReady        = false;
  updatePhotoGrid([]);
  setUploadStatus('', '');

  const frameKey = resolveFrameKey();
  const total    = getAutoPhotoCount(frameKey);

  setProgress(0); renderFramePreview();
  updateStepChip(0, total);

  for (let i = 0; i < total; i++) {
    updateStepChip(i, total);
    setStatus(`📸 Foto ${i + 1} dari ${total} – bersiap…`, 'active');
    await runCountdown(3);

    const shot = capturePhoto();
    capturedPhotos.push(shot);
    capturedPhotoImgs.push(await loadImage(shot));

    selectedPhotoIndex = i;
    if (els.shotCounter) els.shotCounter.textContent = `${capturedPhotos.length}/${total} foto`;
    updatePhotoGrid(capturedPhotos);
    renderFramePreview();
    setProgress(Math.round(((i + 1) / total) * 70));
    if (i < total - 1) await sleep(450);
  }

  reviewReady        = true;
  selectedPhotoIndex = 0;
  updatePhotoGrid(capturedPhotos);
  renderFramePreview();
  setProgress(70);
  updateStepChip(total, total); // all done
  setStatus('✅ Foto selesai diambil. Atur urutan/retake jika perlu, lalu klik ✓ Finish & Buat QR.', 'success');
  setBusy(false);
  refreshReviewControls();
}

/* ── Thumbnail strip ─────────────────────────────────────── */
function updatePhotoGrid(photos) {
  if (!els.photoGrid) return;
  els.photoGrid.innerHTML = '';

  photos.forEach((src, i) => {
    const wrap = document.createElement('button');
    wrap.type      = 'button';
    wrap.className = `thumb-wrap${i === selectedPhotoIndex ? ' selected' : ''}`;
    wrap.setAttribute('aria-label', `Pilih foto ${i + 1}`);
    wrap.addEventListener('click', () => selectPhoto(i));

    const img   = document.createElement('img');
    img.src     = src; img.alt = `Foto ${i + 1}`; img.className = 'thumb-img';

    const badge = document.createElement('span');
    badge.className   = 'thumb-index';
    badge.textContent = i + 1;

    wrap.appendChild(img); wrap.appendChild(badge);
    els.photoGrid.appendChild(wrap);
  });

  els.photoGrid.classList.toggle('hidden', photos.length === 0);
  refreshReviewControls();
}

function selectPhoto(index) {
  selectedPhotoIndex = (index >= 0 && index < capturedPhotos.length) ? index : (capturedPhotos.length ? 0 : -1);
  updatePhotoGrid(capturedPhotos);
  renderFramePreview();
}

function refreshReviewControls() {
  const total    = getAutoPhotoCount(resolveFrameKey());
  const hasPhotos = capturedPhotos.length > 0;
  const complete  = capturedPhotos.length === total;
  const selected  = selectedPhotoIndex >= 0 && selectedPhotoIndex < capturedPhotos.length;

  els.reviewControls?.classList.toggle('hidden', !hasPhotos);

  if (els.selectedPhotoLabel) {
    els.selectedPhotoLabel.textContent = selected
      ? `Foto terpilih: ${selectedPhotoIndex + 1} dari ${capturedPhotos.length}`
      : 'Foto terpilih: -';
  }

  if (els.moveLeftBtn)       els.moveLeftBtn.disabled       = !selected || selectedPhotoIndex === 0 || sessionRunning;
  if (els.moveRightBtn)      els.moveRightBtn.disabled      = !selected || selectedPhotoIndex === capturedPhotos.length - 1 || sessionRunning;
  if (els.retakeSelectedBtn) els.retakeSelectedBtn.disabled = !selected || sessionRunning || !stream;
  if (els.finishBtn)         els.finishBtn.disabled         = !complete || sessionRunning;
}

function moveSelectedPhoto(direction) {
  if (selectedPhotoIndex < 0) return;
  const next = selectedPhotoIndex + direction;
  if (next < 0 || next >= capturedPhotos.length) return;
  [capturedPhotos[selectedPhotoIndex], capturedPhotos[next]]         = [capturedPhotos[next], capturedPhotos[selectedPhotoIndex]];
  [capturedPhotoImgs[selectedPhotoIndex], capturedPhotoImgs[next]]   = [capturedPhotoImgs[next], capturedPhotoImgs[selectedPhotoIndex]];
  selectedPhotoIndex = next;
  updatePhotoGrid(capturedPhotos); renderFramePreview();
  setStatus('🔀 Urutan foto diperbarui. Klik Finish jika sudah cocok.', 'warning');
}

async function retakeSelectedPhoto() {
  if (!stream || sessionRunning) return;
  if (selectedPhotoIndex < 0 || selectedPhotoIndex >= capturedPhotos.length) return;
  ensureAudio(); setBusy(true);
  retakeSlotIndex = selectedPhotoIndex;
  renderFramePreview();
  setStatus(`📸 Retake foto ${selectedPhotoIndex + 1} – bersiap…`, 'active');
  await runCountdown(3);
  const shot = capturePhoto();
  capturedPhotos[selectedPhotoIndex]    = shot;
  capturedPhotoImgs[selectedPhotoIndex] = await loadImage(shot);
  retakeSlotIndex = -1;
  updatePhotoGrid(capturedPhotos); renderFramePreview();
  setStatus(`✅ Foto ${selectedPhotoIndex + 1} sudah diganti. Klik Finish jika sudah cocok.`, 'success');
  setBusy(false);
}

async function finishPhotoSession() {
  const total = getAutoPhotoCount(resolveFrameKey());
  if (capturedPhotos.length !== total || sessionRunning) return;
  setBusy(true);
  reviewReady = false;
  refreshReviewControls();
  setStatus('⏳ Membuat hasil akhir dan QR…', 'active');
  setProgress(80);
  await renderFinalImage();
  setProgress(100);
  setStatus('🎉 Selesai! Download atau scan QR. Tombol Foto Baru untuk pengunjung berikutnya.', 'success');
  setBusy(false);
  refreshReviewControls();
}

/* ── Canvas helpers ──────────────────────────────────────── */
function roundedRect(ctx, x, y, w, h, r) {
  r = Math.min(r || 0, w / 2, h / 2);
  ctx.beginPath();
  if (r <= 0) { ctx.rect(x, y, w, h); }
  else {
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y,     x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x,     y + h, r);
    ctx.arcTo(x,     y + h, x,     y,     r);
    ctx.arcTo(x,     y,     x + w, y,     r);
  }
  ctx.closePath();
}

function withSlotTransform(ctx, slot, cb) {
  const angle = (slot.angle || 0) * Math.PI / 180;
  ctx.save();
  if (angle) {
    const cx = slot.x + slot.w / 2, cy = slot.y + slot.h / 2;
    ctx.translate(cx, cy); ctx.rotate(angle);
    cb(-slot.w / 2, -slot.h / 2, slot.w, slot.h);
  } else {
    cb(slot.x, slot.y, slot.w, slot.h);
  }
  ctx.restore();
}

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

function addDepth(ctx, x, y, w, h, r) {
  ctx.save();
  roundedRect(ctx, x, y, w, h, r); ctx.clip();
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0,    'rgba(0,0,0,.16)'); g.addColorStop(0.06, 'rgba(0,0,0,0)');
  g.addColorStop(0.94, 'rgba(0,0,0,0)');  g.addColorStop(1,    'rgba(0,0,0,.12)');
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(0,0,0,.10)'; ctx.lineWidth = 2;
  roundedRect(ctx, x + 1, y + 1, w - 2, h - 2, r); ctx.stroke();
  ctx.restore();
}

function splitBaseSlot(slot, count) {
  const { x, y, w, h, radius = 0 } = slot;
  if (count === 1) return [{ x, y, w, h, radius }];
  const gap = count <= 2 ? 18 : count === 3 ? 15 : 12;
  const pH  = Math.floor((h - gap * (count - 1)) / count);
  return Array.from({ length: count }, (_, i) => ({
    x, y: y + i * (pH + gap), w, h: pH, radius: Math.max(4, radius - 4),
  }));
}

function loadImage(src) {
  return new Promise((res, rej) => {
    const i = new Image(); i.crossOrigin = 'anonymous';
    i.onload = () => res(i); i.onerror = rej; i.src = src;
  });
}

// Concurrent-fetch guard: stores Promises so parallel calls share one fetch
const _frameFetchPromises = {};

async function getFrameImage(frameKey) {
  const config = FRAME_CONFIGS[frameKey];
  if (!config) return null;

  // Return cached image immediately
  if (frameImageCache[frameKey]) return frameImageCache[frameKey];

  // If a fetch is already in-flight for this key, wait for it
  if (_frameFetchPromises[frameKey]) return _frameFetchPromises[frameKey];

  const doFetch = async () => {
    try {
      let img;
      if (config.driveId) {
        img = await loadDriveFrameImage(frameKey, config);
      } else if (config.path) {
        img = await loadImage(config.path);
      } else {
        return null;
      }
      frameImageCache[frameKey] = img;
      return img;
    } catch (err) {
      console.warn(`getFrameImage(${frameKey}) failed:`, err);
      return null;
    } finally {
      delete _frameFetchPromises[frameKey];
    }
  };

  _frameFetchPromises[frameKey] = doFetch();
  return _frameFetchPromises[frameKey];
}

function fillBase(ctx, frameKey) {
  const g = ctx.createLinearGradient(0, 0, 0, STORY_H);
  if (['wisuda'].includes(frameKey)) {
    g.addColorStop(0, '#111111'); g.addColorStop(1, '#1c1c1c');
  } else {
    g.addColorStop(0, '#f8fafc'); g.addColorStop(1, '#ececec');
  }
  ctx.fillStyle = g; ctx.fillRect(0, 0, STORY_W, STORY_H);
}

function drawFullBleedPhotoBackground(ctx, img) {
  ctx.save();
  ctx.filter = 'blur(14px) brightness(.72) saturate(1.05)';
  drawImageCover(ctx, img, -24, -24, STORY_W + 48, STORY_H + 48, 0);
  ctx.restore();
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(0, 0, STORY_W, STORY_H);
  ctx.restore();
}

function drawPhotosBehindFrame(ctx, images, slots) {
  slots.forEach((slot, i) => {
    const img = images[i % images.length];
    withSlotTransform(ctx, slot, (x, y, w, h) => {
      drawImageCover(ctx, img, x, y, w, h, slot.radius || 0);
      addDepth(ctx, x, y, w, h, slot.radius || 0);
    });
  });
}

/* ── Render final image ──────────────────────────────────── */
async function renderFinalImage() {
  if (!capturedPhotos.length) return;

  const images   = await Promise.all(capturedPhotos.map(loadImage));
  const total    = images.length;
  const frameKey = resolveFrameKey();
  const frame    = await getFrameImage(frameKey);
  const slots    = getSlotsForFrame(frameKey, total);

  const canvas  = document.createElement('canvas');
  canvas.width  = STORY_W; canvas.height = STORY_H;
  const ctx     = canvas.getContext('2d');

  fillBase(ctx, frameKey);
  drawFullBleedPhotoBackground(ctx, images[0]);
  drawPhotosBehindFrame(ctx, images, slots);

  if (frame) ctx.drawImage(frame, 0, 0, STORY_W, STORY_H);

  const dataUrl = canvas.toDataURL('image/png');
  els.finalPreview.src = dataUrl;
  els.finalPreview.classList.remove('hidden');
  els.emptyResult.classList.add('hidden');

  if (finalObjectUrl) URL.revokeObjectURL(finalObjectUrl);
  finalBlob      = await new Promise(res => canvas.toBlob(res, 'image/png'));
  finalObjectUrl = URL.createObjectURL(finalBlob);

  els.downloadBtn.href     = finalObjectUrl;
  els.downloadBtn.download = `labshot-story-${Date.now()}.png`;
  els.downloadBtn.classList.remove('disabled');
  els.shareBtn.disabled    = false;
  els.retakeBtn.disabled   = false;

  currentUploadFileName = makeDriveFileName();
  currentShareUrl       = makePhotoPageUrl(currentUploadFileName);

  renderQRCode(currentShareUrl);
  setUploadStatus('uploading', 'Mengunggah ke Google Drive…');
  if (els.qrCodeOuter) els.qrCodeOuter.classList.add('uploading');

  const driveBlob = await createDriveUploadBlobFromCanvas(canvas);
  uploadPhotoToGoogleDrive(driveBlob, currentUploadFileName)
    .then(() => {
      setUploadStatus('done', 'Foto berhasil diunggah ✓');
      if (els.qrCodeOuter) els.qrCodeOuter.classList.remove('uploading');
      if (els.qrNote) {
        els.qrNote.innerHTML = `Scan QR untuk foto khusus sesi ini. Atau <a class="qr-note-link" href="${currentShareUrl}" target="_blank" rel="noopener">buka link foto</a>.`;
      }
    })
    .catch(err => {
      console.error('Drive upload error:', err);
      setUploadStatus('error', 'Upload gagal – gunakan tombol Download.');
      if (els.qrCodeOuter) els.qrCodeOuter.classList.remove('uploading');
      if (els.qrNote) els.qrNote.textContent = 'Upload gagal. Gunakan tombol Download di layar ini.';
    });
}

/* ── QR Code ─────────────────────────────────────────────── */
function renderQRCode(val) {
  if (!els.qrCode) return;
  els.qrCode.innerHTML = '';
  if (!window.QRCode) { if (els.qrNote) els.qrNote.textContent = 'Library QR belum termuat.'; return; }
  new QRCode(els.qrCode, {
    text: val, width: 176, height: 176,
    colorDark: '#111827', colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.M,
  });
  if (els.qrNote) {
    els.qrNote.innerHTML = `Scan QR untuk membuka foto sesi ini. Atau <a class="qr-note-link" href="${val}" target="_blank" rel="noopener">buka link foto</a>.`;
  }
}

/* ── Reset & share ───────────────────────────────────────── */
function resetResult(clearPhotos = true) {
  if (clearPhotos) {
    capturedPhotos    = []; capturedPhotoImgs  = [];
    selectedPhotoIndex = -1; retakeSlotIndex   = -1;
    reviewReady = false;
    updatePhotoGrid([]);
  }
  if (finalObjectUrl) URL.revokeObjectURL(finalObjectUrl);
  finalBlob = null; finalObjectUrl = null;

  els.finalPreview.removeAttribute('src');
  els.finalPreview.classList.add('hidden');
  els.emptyResult.classList.remove('hidden');
  els.downloadBtn.removeAttribute('href');
  els.downloadBtn.classList.add('disabled');
  if (els.shareBtn) els.shareBtn.disabled = true;
  if (els.qrCode)   els.qrCode.innerHTML  = '';
  if (els.qrCodeOuter) els.qrCodeOuter.classList.remove('uploading');
  if (els.qrNote)   els.qrNote.textContent = 'QR foto pribadi aktif setelah hasil dibuat.';
  setUploadStatus('', '');
  hideStepChip();

  if (capturedPhotos.length) {
    if (els.shotCounter) els.shotCounter.textContent = `${capturedPhotos.length} foto`;
  } else {
    updateFrameAutoInfo();
  }
  setProgress(0);
  setStatus(stream ? '📷 Kamera aktif. Siap memotret!' : 'Kamera belum aktif. Klik Aktifkan Kamera.', stream ? 'active' : 'idle');
  renderFramePreview();
}

function sharePhoto() {
  currentShareUrl = ''; currentUploadFileName = '';
  resetResult(true);
  if (stream) {
    startPreviewLoop();
    if (els.startSessionBtn) els.startSessionBtn.disabled = false;
    setStatus('👋 Siap untuk pengunjung berikutnya. Atur frame dan filter, lalu klik Mulai Foto.', 'info');
  } else {
    setStatus('Sesi baru disiapkan. Aktifkan kamera untuk memulai.', 'idle');
  }
}

/* ── Drive upload helpers ────────────────────────────────── */
function makeDriveFileName() {
  const now = new Date();
  const yy  = String(now.getFullYear()).slice(-2);
  const mm  = String(now.getMonth() + 1).padStart(2, '0');
  const dd  = String(now.getDate()).padStart(2, '0');
  const hh  = String(now.getHours()).padStart(2, '0');
  const mi  = String(now.getMinutes()).padStart(2, '0');
  const ss  = String(now.getSeconds()).padStart(2, '0');
  const rand = Math.random().toString(36).slice(2, 5);
  return `ls-${yy}${mm}${dd}-${hh}${mi}${ss}-${rand}.jpg`;
}

function makePhotoPageUrl(fileName) {
  return `${APPS_SCRIPT_URL}?n=${encodeURIComponent(fileName)}`;
}

async function createDriveUploadBlobFromCanvas(sourceCanvas) {
  const c = document.createElement('canvas');
  c.width = DRIVE_UPLOAD_W; c.height = DRIVE_UPLOAD_H;
  c.getContext('2d').drawImage(sourceCanvas, 0, 0, DRIVE_UPLOAD_W, DRIVE_UPLOAD_H);
  return await new Promise(resolve => c.toBlob(resolve, 'image/jpeg', 0.62));
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(String(reader.result || '').split(',')[1] || '');
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function uploadPhotoToGoogleDrive(blob, fileName) {
  const imageBase64 = await blobToBase64(blob);
  await fetch(APPS_SCRIPT_URL, {
    method: 'POST', mode: 'no-cors',
    body: JSON.stringify({ imageBase64, fileName }),
  });
}

/* ── Splash screen ───────────────────────────────────────── */
function openApp() {
  const splash   = document.getElementById('splashScreen');
  const appShell = document.getElementById('appShell');
  if (!splash || !appShell) return;

  splash.classList.add('splash-exit');
  splash.addEventListener('transitionend', () => {
    splash.style.display = 'none';
    splash.setAttribute('aria-hidden', 'true');
  }, { once: true });

  appShell.classList.remove('hidden');
  appShell.removeAttribute('aria-hidden');

  // Start preview setelah app shell terlihat
  setTimeout(() => {
    updateFrameAutoInfo();
    renderFramePreview();
  }, 100);
}

function showGuide() {
  const splash   = document.getElementById('splashScreen');
  const appShell = document.getElementById('appShell');
  if (!splash || !appShell) return;
  splash.style.display = '';
  splash.removeAttribute('aria-hidden');
  splash.classList.remove('splash-exit');
  appShell.classList.add('hidden');
}

/* ── Init ────────────────────────────────────────────────── */
async function initLabShot() {
  if (!els.startCameraBtn || !els.video) {
    console.error('Elemen utama kamera tidak ditemukan. Pastikan index.html dan app.js versi sama.');
    return;
  }

  // Splash screen wiring – pasang DULU sebelum fetch Drive agar splash langsung muncul
  document.getElementById('splashStartBtn')?.addEventListener('click', openApp);
  document.getElementById('showGuideBtn')?.addEventListener('click', showGuide);

  // Muat template Drive di background (tidak block render splash)
  initDriveTemplates().then(() => {
    populateThemeOptions();
    populateFrameOptions();
    updateFrameAutoInfo();
  }).catch(err => {
    console.warn('Drive init error:', err);
    populateThemeOptions();
    populateFrameOptions();
  });

  // Langsung populate dengan fallback lokal agar dropdown tidak kosong saat Drive loading
  populateThemeOptions();
  populateFrameOptions();

  els.startCameraBtn.addEventListener('click',  () => startCamera());
  els.startSessionBtn?.addEventListener('click', startSession);
  els.retakeBtn?.addEventListener('click', () => {
    resetResult(true);
    els.retakeBtn.disabled = true;
    startPreviewLoop();
  });
  els.moveLeftBtn?.addEventListener('click',      () => moveSelectedPhoto(-1));
  els.moveRightBtn?.addEventListener('click',     () => moveSelectedPhoto(1));
  els.retakeSelectedBtn?.addEventListener('click', retakeSelectedPhoto);
  els.finishBtn?.addEventListener('click',        finishPhotoSession);
  els.shareBtn?.addEventListener('click',         sharePhoto);

  els.mirrorToggle?.addEventListener('change', () => {
    mirrorMode = els.mirrorToggle.checked;
    applyVideoMirror(); renderFramePreview();
  });
  els.soundToggle?.addEventListener('change', () => { soundEnabled = els.soundToggle.checked; });
  els.cameraSelect?.addEventListener('change', () => startCamera(els.cameraSelect.value));

  els.themeSelect?.addEventListener('change', () => {
    populateFrameOptions(els.themeSelect.value);
    updateFrameAutoInfo();
    resetResult(true);
    setStatus('🗂 Tema diganti. Pilih template yang ingin digunakan.');
  });

  els.frameTheme?.addEventListener('change', () => {
    updateFrameAutoInfo();
    resetResult(true);
    setStatus(stream ? '🖼 Frame diganti. Preview sudah diperbarui.' : '🖼 Frame diganti. Aktifkan kamera untuk preview live.');
  });
  els.filterMode?.addEventListener('change', () => {
    applyLiveFilter(); renderFramePreview();
  });

  applyVideoMirror();
  resetResult(true);
  setStatus('Kamera belum aktif. Klik Aktifkan Kamera untuk memulai.', 'idle');
  console.log('LabShot v37 loaded. Google Drive template mode aktif.');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initLabShot().catch(console.error));
} else {
  initLabShot().catch(console.error);
}
