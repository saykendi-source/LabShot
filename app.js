/* ═══════════════════════════════════════════════════════════
   LabShot v33 – app.js
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
const DRIVE_UPLOAD_W  = 720;
const DRIVE_UPLOAD_H  = 1280;

/* ── Frame configurations ───────────────────────────────── */
const FRAME_THEMES = {
  "default": "Default LabShot",
  "one-piece": "Anime Pirate / Wanted Poster",
  "pendadaran": "Selamat Lulus Pendadaran",
  "skp": "Seminar Kerja Praktek",
  "ti": "TI UMY / Campus & Newspaper"
};

const FRAME_CONFIGS = {
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
  newOnePieceOp10001: {
    theme: 'one-piece',
    label: "Wanted Poster 10",
    path: "assets/frames/new/one-piece/op-10.png",
    defaultCount: 3,
    slotsByCount: {
      3: [{"x": 228, "y": 152, "w": 604, "h": 308, "radius": 10}, {"x": 784, "y": 1316, "w": 252, "h": 160, "radius": 10}, {"x": 80, "y": 1440, "w": 216, "h": 272, "radius": 10}],
    },
  },
  newOnePieceOp11002: {
    theme: 'one-piece',
    label: "Wanted Poster 11",
    path: "assets/frames/new/one-piece/op-11.png",
    defaultCount: 2,
    slotsByCount: {
      2: [{"x": 204, "y": 477, "w": 632, "h": 576, "radius": 10}, {"x": 269, "y": 1140, "w": 665, "h": 508, "radius": 10}],
    },
  },
  newOnePieceOp12003: {
    theme: 'one-piece',
    label: "Wanted Poster 12",
    path: "assets/frames/new/one-piece/op-12.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 156, "y": 552, "w": 776, "h": 812, "radius": 10}],
    },
  },
  newOnePieceOp13004: {
    theme: 'one-piece',
    label: "Wanted Poster 13",
    path: "assets/frames/new/one-piece/op-13.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 140, "y": 520, "w": 800, "h": 980, "radius": 10}],
    },
  },
  newOnePieceOp14005: {
    theme: 'one-piece',
    label: "Wanted Poster 14",
    path: "assets/frames/new/one-piece/op-14.png",
    defaultCount: 3,
    slotsByCount: {
      3: [{"x": 100, "y": 224, "w": 904, "h": 340, "radius": 10}, {"x": 224, "y": 548, "w": 648, "h": 660, "radius": 10}, {"x": 288, "y": 1564, "w": 539, "h": 276, "radius": 10}],
    },
  },
  newOnePieceOp15006: {
    theme: 'one-piece',
    label: "Wanted Poster 15",
    path: "assets/frames/new/one-piece/op-15.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 200, "y": 491, "w": 673, "h": 860, "radius": 10}],
    },
  },
  newOnePieceOp16007: {
    theme: 'one-piece',
    label: "Wanted Poster 16",
    path: "assets/frames/new/one-piece/op-16.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 184, "y": 472, "w": 732, "h": 704, "radius": 10}],
    },
  },
  newOnePieceOp17008: {
    theme: 'one-piece',
    label: "Wanted Poster 17",
    path: "assets/frames/new/one-piece/op-17.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 140, "y": 520, "w": 800, "h": 980, "radius": 10}],
    },
  },
  newOnePieceOp18009: {
    theme: 'one-piece',
    label: "Wanted Poster 18",
    path: "assets/frames/new/one-piece/op-18.png",
    defaultCount: 2,
    slotsByCount: {
      2: [{"x": 464, "y": 220, "w": 480, "h": 272, "radius": 10}, {"x": 208, "y": 540, "w": 684, "h": 833, "radius": 10}],
    },
  },
  newOnePieceOp19010: {
    theme: 'one-piece',
    label: "Wanted Poster 19",
    path: "assets/frames/new/one-piece/op-19.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 216, "y": 512, "w": 652, "h": 812, "radius": 10}],
    },
  },
  newOnePieceOp2011: {
    theme: 'one-piece',
    label: "Wanted Poster 02",
    path: "assets/frames/new/one-piece/op-2.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 220, "y": 72, "w": 716, "h": 361, "radius": 10}],
    },
  },
  newOnePieceOp20012: {
    theme: 'one-piece',
    label: "Wanted Poster 20",
    path: "assets/frames/new/one-piece/op-20.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 188, "y": 1208, "w": 732, "h": 620, "radius": 10}],
    },
  },
  newOnePieceOp21013: {
    theme: 'one-piece',
    label: "Wanted Poster 21",
    path: "assets/frames/new/one-piece/op-21.png",
    defaultCount: 2,
    slotsByCount: {
      2: [{"x": 108, "y": 132, "w": 888, "h": 284, "radius": 10}, {"x": 224, "y": 572, "w": 628, "h": 908, "radius": 10}],
    },
  },
  newOnePieceOp22014: {
    theme: 'one-piece',
    label: "Wanted Poster 22",
    path: "assets/frames/new/one-piece/op-22.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 184, "y": 396, "w": 720, "h": 880, "radius": 10}],
    },
  },
  newOnePieceOp23015: {
    theme: 'one-piece',
    label: "Wanted Poster 23",
    path: "assets/frames/new/one-piece/op-23.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 168, "y": 524, "w": 744, "h": 1044, "radius": 10}],
    },
  },
  newOnePieceOp24016: {
    theme: 'one-piece',
    label: "Wanted Poster 24",
    path: "assets/frames/new/one-piece/op-24.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 220, "y": 532, "w": 668, "h": 936, "radius": 10}],
    },
  },
  newOnePieceOp25017: {
    theme: 'one-piece',
    label: "Wanted Poster 25",
    path: "assets/frames/new/one-piece/op-25.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 36, "y": 243, "w": 984, "h": 1120, "radius": 10}],
    },
  },
  newOnePieceOp26018: {
    theme: 'one-piece',
    label: "Wanted Poster 26",
    path: "assets/frames/new/one-piece/op-26.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 140, "y": 416, "w": 805, "h": 868, "radius": 10}],
    },
  },
  newOnePieceOp27019: {
    theme: 'one-piece',
    label: "Wanted Poster 27",
    path: "assets/frames/new/one-piece/op-27.png",
    defaultCount: 2,
    slotsByCount: {
      2: [{"x": 148, "y": 168, "w": 884, "h": 348, "radius": 10}, {"x": 196, "y": 508, "w": 708, "h": 1120, "radius": 10}],
    },
  },
  newOnePieceOp28020: {
    theme: 'one-piece',
    label: "Wanted Poster 28",
    path: "assets/frames/new/one-piece/op-28.png",
    defaultCount: 2,
    slotsByCount: {
      2: [{"x": 80, "y": 80, "w": 920, "h": 288, "radius": 10}, {"x": 148, "y": 448, "w": 792, "h": 1176, "radius": 10}],
    },
  },
  newOnePieceOp29021: {
    theme: 'one-piece',
    label: "Wanted Poster 29",
    path: "assets/frames/new/one-piece/op-29.png",
    defaultCount: 2,
    slotsByCount: {
      2: [{"x": 140, "y": 52, "w": 876, "h": 312, "radius": 10}, {"x": 196, "y": 528, "w": 716, "h": 984, "radius": 10}],
    },
  },
  newOnePieceOp3022: {
    theme: 'one-piece',
    label: "Wanted Poster 03",
    path: "assets/frames/new/one-piece/op-3.png",
    defaultCount: 2,
    slotsByCount: {
      2: [{"x": 143, "y": 316, "w": 816, "h": 847, "radius": 10}, {"x": 460, "y": 1220, "w": 576, "h": 436, "radius": 10}],
    },
  },
  newOnePieceOp30023: {
    theme: 'one-piece',
    label: "Wanted Poster 30",
    path: "assets/frames/new/one-piece/op-30.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 172, "y": 540, "w": 744, "h": 1020, "radius": 10}],
    },
  },
  newOnePieceOp31024: {
    theme: 'one-piece',
    label: "Wanted Poster 31",
    path: "assets/frames/new/one-piece/op-31.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 204, "y": 464, "w": 676, "h": 836, "radius": 10}],
    },
  },
  newOnePieceOp4025: {
    theme: 'one-piece',
    label: "Wanted Poster 04",
    path: "assets/frames/new/one-piece/op-4.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 168, "y": 367, "w": 811, "h": 1321, "radius": 10}],
    },
  },
  newOnePieceOp5026: {
    theme: 'one-piece',
    label: "Wanted Poster 05",
    path: "assets/frames/new/one-piece/op-5.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 140, "y": 520, "w": 800, "h": 980, "radius": 10}],
    },
  },
  newOnePieceOp6027: {
    theme: 'one-piece',
    label: "Wanted Poster 06",
    path: "assets/frames/new/one-piece/op-6.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 140, "y": 520, "w": 800, "h": 980, "radius": 10}],
    },
  },
  newOnePieceOp7028: {
    theme: 'one-piece',
    label: "Wanted Poster 07",
    path: "assets/frames/new/one-piece/op-7.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 156, "y": 300, "w": 828, "h": 1424, "radius": 10}],
    },
  },
  newOnePieceOp8029: {
    theme: 'one-piece',
    label: "Wanted Poster 08",
    path: "assets/frames/new/one-piece/op-8.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 140, "y": 520, "w": 800, "h": 980, "radius": 10}],
    },
  },
  newOnePieceOp9030: {
    theme: 'one-piece',
    label: "Wanted Poster 09",
    path: "assets/frames/new/one-piece/op-9.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 224, "y": 1468, "w": 308, "h": 276, "radius": 10}],
    },
  },
  newOnePieceTiUmy29031: {
    theme: 'one-piece',
    label: "Wanted Poster 29",
    path: "assets/frames/new/one-piece/ti-umy-29.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 140, "y": 520, "w": 800, "h": 980, "radius": 10}],
    },
  },
  newOnePieceTiUmy30032: {
    theme: 'one-piece',
    label: "Wanted Poster 30",
    path: "assets/frames/new/one-piece/ti-umy-30.png",
    defaultCount: 3,
    slotsByCount: {
      3: [{"x": 612, "y": 144, "w": 420, "h": 172, "radius": 10}, {"x": 248, "y": 148, "w": 320, "h": 144, "radius": 10}, {"x": 48, "y": 348, "w": 1012, "h": 224, "radius": 10}],
    },
  },
  newOnePieceTiUmy31033: {
    theme: 'one-piece',
    label: "Wanted Poster 31",
    path: "assets/frames/new/one-piece/ti-umy-31.png",
    defaultCount: 2,
    slotsByCount: {
      2: [{"x": 36, "y": 300, "w": 200, "h": 229, "radius": 10}, {"x": 92, "y": 1592, "w": 316, "h": 220, "radius": 10}],
    },
  },
  newOnePieceTiUmy32034: {
    theme: 'one-piece',
    label: "Wanted Poster 32",
    path: "assets/frames/new/one-piece/ti-umy-32.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 24, "y": 256, "w": 1000, "h": 1612, "radius": 10}],
    },
  },
  newOnePieceTiUmy33035: {
    theme: 'one-piece',
    label: "Wanted Poster 33",
    path: "assets/frames/new/one-piece/ti-umy-33.png",
    defaultCount: 2,
    slotsByCount: {
      2: [{"x": 576, "y": 144, "w": 464, "h": 148, "radius": 10}, {"x": 180, "y": 396, "w": 576, "h": 251, "radius": 10}],
    },
  },
  newOnePieceTiUmy34036: {
    theme: 'one-piece',
    label: "Wanted Poster 34",
    path: "assets/frames/new/one-piece/ti-umy-34.png",
    defaultCount: 2,
    slotsByCount: {
      2: [{"x": 460, "y": 132, "w": 436, "h": 216, "radius": 10}, {"x": 224, "y": 483, "w": 636, "h": 892, "radius": 10}],
    },
  },
  newOnePieceTiUmy35037: {
    theme: 'one-piece',
    label: "Wanted Poster 35",
    path: "assets/frames/new/one-piece/ti-umy-35.png",
    defaultCount: 2,
    slotsByCount: {
      2: [{"x": 308, "y": 108, "w": 384, "h": 200, "radius": 10}, {"x": 304, "y": 1688, "w": 456, "h": 140, "radius": 10}],
    },
  },
  newOnePieceTiUmy36038: {
    theme: 'one-piece',
    label: "Wanted Poster 36",
    path: "assets/frames/new/one-piece/ti-umy-36.png",
    defaultCount: 2,
    slotsByCount: {
      2: [{"x": 464, "y": 76, "w": 388, "h": 124, "radius": 10}, {"x": 68, "y": 1136, "w": 555, "h": 500, "radius": 10}],
    },
  },
  newOnePieceTiUmy37039: {
    theme: 'one-piece',
    label: "Wanted Poster 37",
    path: "assets/frames/new/one-piece/ti-umy-37.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 72, "y": 372, "w": 428, "h": 144, "radius": 10}],
    },
  },
  newPendadaranPendadaran1040: {
    theme: 'pendadaran',
    label: "Pendadaran 01",
    path: "assets/frames/new/pendadaran/pendadaran-1.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 164, "y": 568, "w": 760, "h": 876, "radius": 10}],
    },
  },
  newPendadaranPendadaran10041: {
    theme: 'pendadaran',
    label: "Pendadaran 10",
    path: "assets/frames/new/pendadaran/pendadaran-10.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 164, "y": 500, "w": 756, "h": 971, "radius": 10}],
    },
  },
  newPendadaranPendadaran11042: {
    theme: 'pendadaran',
    label: "Pendadaran 11",
    path: "assets/frames/new/pendadaran/pendadaran-11.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 140, "y": 520, "w": 800, "h": 980, "radius": 10}],
    },
  },
  newPendadaranPendadaran12043: {
    theme: 'pendadaran',
    label: "Pendadaran 12",
    path: "assets/frames/new/pendadaran/pendadaran-12.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 188, "y": 624, "w": 740, "h": 912, "radius": 10}],
    },
  },
  newPendadaranPendadaran13044: {
    theme: 'pendadaran',
    label: "Pendadaran 13",
    path: "assets/frames/new/pendadaran/pendadaran-13.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 216, "y": 624, "w": 656, "h": 772, "radius": 10}],
    },
  },
  newPendadaranPendadaran14045: {
    theme: 'pendadaran',
    label: "Pendadaran 14",
    path: "assets/frames/new/pendadaran/pendadaran-14.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 140, "y": 520, "w": 800, "h": 980, "radius": 10}],
    },
  },
  newPendadaranPendadaran15046: {
    theme: 'pendadaran',
    label: "Pendadaran 15",
    path: "assets/frames/new/pendadaran/pendadaran-15.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 140, "y": 520, "w": 800, "h": 980, "radius": 10}],
    },
  },
  newPendadaranPendadaran16047: {
    theme: 'pendadaran',
    label: "Pendadaran 16",
    path: "assets/frames/new/pendadaran/pendadaran-16.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 264, "y": 624, "w": 600, "h": 784, "radius": 10}],
    },
  },
  newPendadaranPendadaran17048: {
    theme: 'pendadaran',
    label: "Pendadaran 17",
    path: "assets/frames/new/pendadaran/pendadaran-17.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 164, "y": 607, "w": 748, "h": 816, "radius": 10}],
    },
  },
  newPendadaranPendadaran18049: {
    theme: 'pendadaran',
    label: "Pendadaran 18",
    path: "assets/frames/new/pendadaran/pendadaran-18.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 36, "y": 1553, "w": 200, "h": 196, "radius": 10}],
    },
  },
  newPendadaranPendadaran19050: {
    theme: 'pendadaran',
    label: "Pendadaran 19",
    path: "assets/frames/new/pendadaran/pendadaran-19.png",
    defaultCount: 2,
    slotsByCount: {
      2: [{"x": 212, "y": 312, "w": 676, "h": 308, "radius": 10}, {"x": 212, "y": 672, "w": 656, "h": 908, "radius": 10}],
    },
  },
  newPendadaranPendadaran2051: {
    theme: 'pendadaran',
    label: "Pendadaran 02",
    path: "assets/frames/new/pendadaran/pendadaran-2.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 72, "y": 500, "w": 811, "h": 1128, "radius": 10}],
    },
  },
  newPendadaranPendadaran20052: {
    theme: 'pendadaran',
    label: "Pendadaran 20",
    path: "assets/frames/new/pendadaran/pendadaran-20.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 208, "y": 612, "w": 700, "h": 704, "radius": 10}],
    },
  },
  newPendadaranPendadaran21053: {
    theme: 'pendadaran',
    label: "Pendadaran 21",
    path: "assets/frames/new/pendadaran/pendadaran-21.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 500, "y": 1524, "w": 304, "h": 204, "radius": 10}],
    },
  },
  newPendadaranPendadaran22054: {
    theme: 'pendadaran',
    label: "Pendadaran 22",
    path: "assets/frames/new/pendadaran/pendadaran-22.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 140, "y": 520, "w": 800, "h": 980, "radius": 10}],
    },
  },
  newPendadaranPendadaran23055: {
    theme: 'pendadaran',
    label: "Pendadaran 23",
    path: "assets/frames/new/pendadaran/pendadaran-23.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 232, "y": 156, "w": 656, "h": 388, "radius": 10}],
    },
  },
  newPendadaranPendadaran24056: {
    theme: 'pendadaran',
    label: "Pendadaran 24",
    path: "assets/frames/new/pendadaran/pendadaran-24.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 140, "y": 520, "w": 800, "h": 980, "radius": 10}],
    },
  },
  newPendadaranPendadaran25057: {
    theme: 'pendadaran',
    label: "Pendadaran 25",
    path: "assets/frames/new/pendadaran/pendadaran-25.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 224, "y": 127, "w": 648, "h": 216, "radius": 10}],
    },
  },
  newPendadaranPendadaran26058: {
    theme: 'pendadaran',
    label: "Pendadaran 26",
    path: "assets/frames/new/pendadaran/pendadaran-26.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 140, "y": 520, "w": 800, "h": 980, "radius": 10}],
    },
  },
  newPendadaranPendadaran27059: {
    theme: 'pendadaran',
    label: "Pendadaran 27",
    path: "assets/frames/new/pendadaran/pendadaran-27.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 296, "y": 80, "w": 500, "h": 148, "radius": 10}],
    },
  },
  newPendadaranPendadaran28060: {
    theme: 'pendadaran',
    label: "Pendadaran 28",
    path: "assets/frames/new/pendadaran/pendadaran-28.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 388, "y": 788, "w": 304, "h": 280, "radius": 10}],
    },
  },
  newPendadaranPendadaran29061: {
    theme: 'pendadaran',
    label: "Pendadaran 29",
    path: "assets/frames/new/pendadaran/pendadaran-29.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 140, "y": 520, "w": 800, "h": 980, "radius": 10}],
    },
  },
  newPendadaranPendadaran3062: {
    theme: 'pendadaran',
    label: "Pendadaran 03",
    path: "assets/frames/new/pendadaran/pendadaran-3.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 140, "y": 520, "w": 800, "h": 980, "radius": 10}],
    },
  },
  newPendadaranPendadaran30063: {
    theme: 'pendadaran',
    label: "Pendadaran 30",
    path: "assets/frames/new/pendadaran/pendadaran-30.png",
    defaultCount: 2,
    slotsByCount: {
      2: [{"x": 300, "y": 92, "w": 528, "h": 208, "radius": 10}, {"x": 440, "y": 988, "w": 192, "h": 272, "radius": 10}],
    },
  },
  newPendadaranPendadaran4064: {
    theme: 'pendadaran',
    label: "Pendadaran 04",
    path: "assets/frames/new/pendadaran/pendadaran-4.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 143, "y": 588, "w": 868, "h": 1064, "radius": 10}],
    },
  },
  newPendadaranPendadaran5065: {
    theme: 'pendadaran',
    label: "Pendadaran 05",
    path: "assets/frames/new/pendadaran/pendadaran-5.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 269, "y": 1464, "w": 504, "h": 156, "radius": 10}],
    },
  },
  newPendadaranPendadaran6066: {
    theme: 'pendadaran',
    label: "Pendadaran 06",
    path: "assets/frames/new/pendadaran/pendadaran-6.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 188, "y": 748, "w": 704, "h": 884, "radius": 10}],
    },
  },
  newPendadaranPendadaran7067: {
    theme: 'pendadaran',
    label: "Pendadaran 07",
    path: "assets/frames/new/pendadaran/pendadaran-7.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 108, "y": 584, "w": 868, "h": 888, "radius": 10}],
    },
  },
  newPendadaranPendadaran8068: {
    theme: 'pendadaran',
    label: "Pendadaran 08",
    path: "assets/frames/new/pendadaran/pendadaran-8.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 224, "y": 668, "w": 632, "h": 748, "radius": 10}],
    },
  },
  newPendadaranPendadaran9069: {
    theme: 'pendadaran',
    label: "Pendadaran 09",
    path: "assets/frames/new/pendadaran/pendadaran-9.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 132, "y": 604, "w": 880, "h": 936, "radius": 10}],
    },
  },
  newSkpSkp1070: {
    theme: 'skp',
    label: "SKP 01",
    path: "assets/frames/new/skp/skp-1.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 156, "y": 483, "w": 844, "h": 1084, "radius": 10}],
    },
  },
  newSkpSkp10071: {
    theme: 'skp',
    label: "SKP 10",
    path: "assets/frames/new/skp/skp-10.png",
    defaultCount: 3,
    slotsByCount: {
      3: [{"x": 84, "y": 92, "w": 636, "h": 388, "radius": 10}, {"x": 100, "y": 396, "w": 811, "h": 237, "radius": 10}, {"x": 172, "y": 599, "w": 816, "h": 1268, "radius": 10}],
    },
  },
  newSkpSkp11072: {
    theme: 'skp',
    label: "SKP 11",
    path: "assets/frames/new/skp/skp-11.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 140, "y": 508, "w": 808, "h": 1144, "radius": 10}],
    },
  },
  newSkpSkp12073: {
    theme: 'skp',
    label: "SKP 12",
    path: "assets/frames/new/skp/skp-12.png",
    defaultCount: 2,
    slotsByCount: {
      2: [{"x": 632, "y": 104, "w": 420, "h": 164, "radius": 10}, {"x": 200, "y": 260, "w": 728, "h": 304, "radius": 10}],
    },
  },
  newSkpSkp13074: {
    theme: 'skp',
    label: "SKP 13",
    path: "assets/frames/new/skp/skp-13.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 140, "y": 520, "w": 800, "h": 980, "radius": 10}],
    },
  },
  newSkpSkp14075: {
    theme: 'skp',
    label: "SKP 14",
    path: "assets/frames/new/skp/skp-14.png",
    defaultCount: 2,
    slotsByCount: {
      2: [{"x": 164, "y": 208, "w": 748, "h": 268, "radius": 10}, {"x": 68, "y": 620, "w": 872, "h": 1056, "radius": 10}],
    },
  },
  newSkpSkp15076: {
    theme: 'skp',
    label: "SKP 15",
    path: "assets/frames/new/skp/skp-15.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 384, "y": 1443, "w": 404, "h": 296, "radius": 10}],
    },
  },
  newSkpSkp16077: {
    theme: 'skp',
    label: "SKP 16",
    path: "assets/frames/new/skp/skp-16.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 572, "y": 119, "w": 401, "h": 144, "radius": 10}],
    },
  },
  newSkpSkp17078: {
    theme: 'skp',
    label: "SKP 17",
    path: "assets/frames/new/skp/skp-17.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 180, "y": 184, "w": 608, "h": 284, "radius": 10}],
    },
  },
  newSkpSkp18079: {
    theme: 'skp',
    label: "SKP 18",
    path: "assets/frames/new/skp/skp-18.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 296, "y": 260, "w": 516, "h": 119, "radius": 10}],
    },
  },
  newSkpSkp19080: {
    theme: 'skp',
    label: "SKP 19",
    path: "assets/frames/new/skp/skp-19.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 44, "y": 616, "w": 956, "h": 1068, "radius": 10}],
    },
  },
  newSkpSkp2081: {
    theme: 'skp',
    label: "SKP 02",
    path: "assets/frames/new/skp/skp-2.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 275, "y": 568, "w": 768, "h": 1203, "radius": 10}],
    },
  },
  newSkpSkp20082: {
    theme: 'skp',
    label: "SKP 20",
    path: "assets/frames/new/skp/skp-20.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 140, "y": 520, "w": 800, "h": 980, "radius": 10}],
    },
  },
  newSkpSkp21083: {
    theme: 'skp',
    label: "SKP 21",
    path: "assets/frames/new/skp/skp-21.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 140, "y": 520, "w": 800, "h": 980, "radius": 10}],
    },
  },
  newSkpSkp22084: {
    theme: 'skp',
    label: "SKP 22",
    path: "assets/frames/new/skp/skp-22.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 208, "y": 1580, "w": 528, "h": 188, "radius": 10}],
    },
  },
  newSkpSkp23085: {
    theme: 'skp',
    label: "SKP 23",
    path: "assets/frames/new/skp/skp-23.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 140, "y": 520, "w": 800, "h": 980, "radius": 10}],
    },
  },
  newSkpSkp24086: {
    theme: 'skp',
    label: "SKP 24",
    path: "assets/frames/new/skp/skp-24.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 140, "y": 520, "w": 800, "h": 980, "radius": 10}],
    },
  },
  newSkpSkp25087: {
    theme: 'skp',
    label: "SKP 25",
    path: "assets/frames/new/skp/skp-25.png",
    defaultCount: 2,
    slotsByCount: {
      2: [{"x": 596, "y": 229, "w": 308, "h": 152, "radius": 10}, {"x": 200, "y": 237, "w": 360, "h": 176, "radius": 10}],
    },
  },
  newSkpSkp3088: {
    theme: 'skp',
    label: "SKP 03",
    path: "assets/frames/new/skp/skp-3.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 140, "y": 520, "w": 800, "h": 980, "radius": 10}],
    },
  },
  newSkpSkp4089: {
    theme: 'skp',
    label: "SKP 04",
    path: "assets/frames/new/skp/skp-4.png",
    defaultCount: 2,
    slotsByCount: {
      2: [{"x": 272, "y": 656, "w": 612, "h": 456, "radius": 10}, {"x": 272, "y": 1156, "w": 612, "h": 460, "radius": 10}],
    },
  },
  newSkpSkp5090: {
    theme: 'skp',
    label: "SKP 05",
    path: "assets/frames/new/skp/skp-5.png",
    defaultCount: 2,
    slotsByCount: {
      2: [{"x": 208, "y": 160, "w": 516, "h": 180, "radius": 10}, {"x": 40, "y": 444, "w": 888, "h": 620, "radius": 10}],
    },
  },
  newSkpSkp6091: {
    theme: 'skp',
    label: "SKP 06",
    path: "assets/frames/new/skp/skp-6.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 160, "y": 656, "w": 797, "h": 876, "radius": 10}],
    },
  },
  newSkpSkp7092: {
    theme: 'skp',
    label: "SKP 07",
    path: "assets/frames/new/skp/skp-7.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 200, "y": 652, "w": 676, "h": 952, "radius": 10}],
    },
  },
  newSkpSkp8093: {
    theme: 'skp',
    label: "SKP 08",
    path: "assets/frames/new/skp/skp-8.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 140, "y": 520, "w": 800, "h": 980, "radius": 10}],
    },
  },
  newSkpSkp9094: {
    theme: 'skp',
    label: "SKP 09",
    path: "assets/frames/new/skp/skp-9.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 176, "y": 680, "w": 744, "h": 864, "radius": 10}],
    },
  },
  newTiTiUmy1095: {
    theme: 'ti',
    label: "TI UMY 01",
    path: "assets/frames/new/ti/ti-umy-1.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 40, "y": 36, "w": 283, "h": 304, "radius": 10}],
    },
  },
  newTiTiUmy10096: {
    theme: 'ti',
    label: "TI UMY 10",
    path: "assets/frames/new/ti/ti-umy-10.png",
    defaultCount: 3,
    slotsByCount: {
      3: [{"x": 168, "y": 452, "w": 748, "h": 477, "radius": 10}, {"x": 168, "y": 984, "w": 764, "h": 472, "radius": 10}, {"x": 412, "y": 1524, "w": 256, "h": 272, "radius": 10}],
    },
  },
  newTiTiUmy11097: {
    theme: 'ti',
    label: "TI UMY 11",
    path: "assets/frames/new/ti/ti-umy-11.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 104, "y": 1324, "w": 716, "h": 364, "radius": 10}],
    },
  },
  newTiTiUmy12098: {
    theme: 'ti',
    label: "TI UMY 12",
    path: "assets/frames/new/ti/ti-umy-12.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 140, "y": 520, "w": 800, "h": 980, "radius": 10}],
    },
  },
  newTiTiUmy13099: {
    theme: 'ti',
    label: "TI UMY 13",
    path: "assets/frames/new/ti/ti-umy-13.png",
    defaultCount: 4,
    slotsByCount: {
      4: [{"x": 252, "y": 113, "w": 555, "h": 404, "radius": 10}, {"x": 76, "y": 564, "w": 560, "h": 420, "radius": 10}, {"x": 320, "y": 1096, "w": 340, "h": 448, "radius": 10}, {"x": 716, "y": 1189, "w": 300, "h": 288, "radius": 10}],
    },
  },
  newTiTiUmy14100: {
    theme: 'ti',
    label: "TI UMY 14",
    path: "assets/frames/new/ti/ti-umy-14.png",
    defaultCount: 4,
    slotsByCount: {
      4: [{"x": 261, "y": 88, "w": 368, "h": 180, "radius": 10}, {"x": 84, "y": 436, "w": 744, "h": 496, "radius": 10}, {"x": 76, "y": 949, "w": 716, "h": 448, "radius": 10}, {"x": 88, "y": 1468, "w": 256, "h": 276, "radius": 10}],
    },
  },
  newTiTiUmy15101: {
    theme: 'ti',
    label: "TI UMY 15",
    path: "assets/frames/new/ti/ti-umy-15.png",
    defaultCount: 2,
    slotsByCount: {
      2: [{"x": 196, "y": 24, "w": 716, "h": 353, "radius": 10}, {"x": 240, "y": 1360, "w": 600, "h": 380, "radius": 10}],
    },
  },
  newTiTiUmy16102: {
    theme: 'ti',
    label: "TI UMY 16",
    path: "assets/frames/new/ti/ti-umy-16.png",
    defaultCount: 3,
    slotsByCount: {
      3: [{"x": 256, "y": 428, "w": 592, "h": 796, "radius": 10}, {"x": 92, "y": 1276, "w": 444, "h": 376, "radius": 10}, {"x": 572, "y": 1276, "w": 412, "h": 376, "radius": 10}],
    },
  },
  newTiTiUmy17103: {
    theme: 'ti',
    label: "TI UMY 17",
    path: "assets/frames/new/ti/ti-umy-17.png",
    defaultCount: 3,
    slotsByCount: {
      3: [{"x": 344, "y": 76, "w": 344, "h": 248, "radius": 10}, {"x": 72, "y": 1240, "w": 612, "h": 424, "radius": 10}, {"x": 724, "y": 1240, "w": 283, "h": 424, "radius": 10}],
    },
  },
  newTiTiUmy18104: {
    theme: 'ti',
    label: "TI UMY 18",
    path: "assets/frames/new/ti/ti-umy-18.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 52, "y": 464, "w": 972, "h": 1124, "radius": 10}],
    },
  },
  newTiTiUmy19105: {
    theme: 'ti',
    label: "TI UMY 19",
    path: "assets/frames/new/ti/ti-umy-19.png",
    defaultCount: 2,
    slotsByCount: {
      2: [{"x": 208, "y": 604, "w": 704, "h": 472, "radius": 10}, {"x": 212, "y": 1144, "w": 644, "h": 440, "radius": 10}],
    },
  },
  newTiTiUmy2106: {
    theme: 'ti',
    label: "TI UMY 02",
    path: "assets/frames/new/ti/ti-umy-2.png",
    defaultCount: 2,
    slotsByCount: {
      2: [{"x": 252, "y": 584, "w": 792, "h": 892, "radius": 10}, {"x": 464, "y": 1480, "w": 348, "h": 336, "radius": 10}],
    },
  },
  newTiTiUmy20107: {
    theme: 'ti',
    label: "TI UMY 20",
    path: "assets/frames/new/ti/ti-umy-20.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 140, "y": 520, "w": 800, "h": 980, "radius": 10}],
    },
  },
  newTiTiUmy21108: {
    theme: 'ti',
    label: "TI UMY 21",
    path: "assets/frames/new/ti/ti-umy-21.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 129, "y": 736, "w": 824, "h": 432, "radius": 10}],
    },
  },
  newTiTiUmy22109: {
    theme: 'ti',
    label: "TI UMY 22",
    path: "assets/frames/new/ti/ti-umy-22.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 212, "y": 469, "w": 692, "h": 1028, "radius": 10}],
    },
  },
  newTiTiUmy23110: {
    theme: 'ti',
    label: "TI UMY 23",
    path: "assets/frames/new/ti/ti-umy-23.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 140, "y": 520, "w": 800, "h": 980, "radius": 10}],
    },
  },
  newTiTiUmy24111: {
    theme: 'ti',
    label: "TI UMY 24",
    path: "assets/frames/new/ti/ti-umy-24.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 140, "y": 520, "w": 800, "h": 980, "radius": 10}],
    },
  },
  newTiTiUmy25112: {
    theme: 'ti',
    label: "TI UMY 25",
    path: "assets/frames/new/ti/ti-umy-25.png",
    defaultCount: 2,
    slotsByCount: {
      2: [{"x": 240, "y": 692, "w": 640, "h": 500, "radius": 10}, {"x": 304, "y": 1216, "w": 592, "h": 436, "radius": 10}],
    },
  },
  newTiTiUmy26113: {
    theme: 'ti',
    label: "TI UMY 26",
    path: "assets/frames/new/ti/ti-umy-26.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 129, "y": 616, "w": 856, "h": 872, "radius": 10}],
    },
  },
  newTiTiUmy27114: {
    theme: 'ti',
    label: "TI UMY 27",
    path: "assets/frames/new/ti/ti-umy-27.png",
    defaultCount: 2,
    slotsByCount: {
      2: [{"x": 204, "y": 148, "w": 628, "h": 188, "radius": 10}, {"x": 196, "y": 588, "w": 692, "h": 1079, "radius": 10}],
    },
  },
  newTiTiUmy28115: {
    theme: 'ti',
    label: "TI UMY 28",
    path: "assets/frames/new/ti/ti-umy-28.png",
    defaultCount: 2,
    slotsByCount: {
      2: [{"x": 44, "y": 119, "w": 448, "h": 204, "radius": 10}, {"x": 536, "y": 119, "w": 508, "h": 172, "radius": 10}],
    },
  },
  newTiTiUmy3116: {
    theme: 'ti',
    label: "TI UMY 03",
    path: "assets/frames/new/ti/ti-umy-3.png",
    defaultCount: 2,
    slotsByCount: {
      2: [{"x": 252, "y": 296, "w": 700, "h": 524, "radius": 10}, {"x": 116, "y": 847, "w": 856, "h": 904, "radius": 10}],
    },
  },
  newTiTiUmy4117: {
    theme: 'ti',
    label: "TI UMY 04",
    path: "assets/frames/new/ti/ti-umy-4.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 140, "y": 520, "w": 800, "h": 980, "radius": 10}],
    },
  },
  newTiTiUmy5118: {
    theme: 'ti',
    label: "TI UMY 05",
    path: "assets/frames/new/ti/ti-umy-5.png",
    defaultCount: 4,
    slotsByCount: {
      4: [{"x": 576, "y": 332, "w": 404, "h": 620, "radius": 10}, {"x": 92, "y": 340, "w": 401, "h": 612, "radius": 10}, {"x": 112, "y": 1036, "w": 380, "h": 580, "radius": 10}, {"x": 576, "y": 1036, "w": 380, "h": 628, "radius": 10}],
    },
  },
  newTiTiUmy6119: {
    theme: 'ti',
    label: "TI UMY 06",
    path: "assets/frames/new/ti/ti-umy-6.png",
    defaultCount: 3,
    slotsByCount: {
      3: [{"x": 168, "y": 416, "w": 768, "h": 460, "radius": 10}, {"x": 168, "y": 932, "w": 768, "h": 452, "radius": 10}, {"x": 168, "y": 1440, "w": 316, "h": 328, "radius": 10}],
    },
  },
  newTiTiUmy7120: {
    theme: 'ti',
    label: "TI UMY 07",
    path: "assets/frames/new/ti/ti-umy-7.png",
    defaultCount: 2,
    slotsByCount: {
      2: [{"x": 792, "y": 888, "w": 236, "h": 544, "radius": 10}, {"x": 780, "y": 1636, "w": 264, "h": 220, "radius": 10}],
    },
  },
  newTiTiUmy8121: {
    theme: 'ti',
    label: "TI UMY 08",
    path: "assets/frames/new/ti/ti-umy-8.png",
    defaultCount: 2,
    slotsByCount: {
      2: [{"x": 44, "y": 68, "w": 811, "h": 216, "radius": 10}, {"x": 240, "y": 416, "w": 808, "h": 808, "radius": 10}],
    },
  },
  newTiTiUmy9122: {
    theme: 'ti',
    label: "TI UMY 09",
    path: "assets/frames/new/ti/ti-umy-9.png",
    defaultCount: 1,
    slotsByCount: {
      1: [{"x": 269, "y": 76, "w": 480, "h": 243, "radius": 10}],
    },
  },
};

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

async function renderFramePreview() {
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

  const frame = await getFrameImage(frameKey);
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
}

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

  const toast    = els.statusToast;
  const textEl   = els.statusToastText;
  const f        = TOAST_FLAVOURS[flavour] || TOAST_FLAVOURS.info;

  if (!toast || !textEl) return;

  // Detect flavour from emoji prefix if not provided
  if (flavour === 'info') {
    if (msg.startsWith('✅') || msg.startsWith('🎉')) flavour = 'success', f.cls = 'success', f.icon = '';
    else if (msg.startsWith('⚠️') || msg.startsWith('❌')) flavour = 'error', f.cls = 'error', f.icon = '';
    else if (msg.startsWith('📷') || msg.startsWith('📸') || msg.startsWith('⏳')) flavour = 'active', f.cls = 'active', f.icon = '';
    else if (msg.startsWith('🔀') || msg.startsWith('🖼')) flavour = 'warning', f.cls = 'warning', f.icon = '';
  }

  const icon = document.querySelector('#statusToast .toast-icon');
  if (icon) icon.textContent = f.icon;
  textEl.textContent = msg.replace(/^[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}][\uFE0F]?\s*/u, '');

  toast.className = `status-toast ${f.cls} show`;

  if (_toastTimer) clearTimeout(_toastTimer);
  if (autoDismissMs > 0) {
    _toastTimer = setTimeout(() => {
      toast.className = `status-toast ${f.cls}`;
    }, autoDismissMs);
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
    setStatus('⚠️ ' + msg); alert(msg);
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
  setStatus('🔀 Urutan foto diperbarui. Klik Finish jika sudah cocok.');
}

async function retakeSelectedPhoto() {
  if (!stream || sessionRunning) return;
  if (selectedPhotoIndex < 0 || selectedPhotoIndex >= capturedPhotos.length) return;
  ensureAudio(); setBusy(true);
  retakeSlotIndex = selectedPhotoIndex;
  renderFramePreview();
  setStatus(`📸 Retake foto ${selectedPhotoIndex + 1} – bersiap…`);
  await runCountdown(3);
  const shot = capturePhoto();
  capturedPhotos[selectedPhotoIndex]    = shot;
  capturedPhotoImgs[selectedPhotoIndex] = await loadImage(shot);
  retakeSlotIndex = -1;
  updatePhotoGrid(capturedPhotos); renderFramePreview();
  setStatus(`✅ Foto ${selectedPhotoIndex + 1} sudah diganti. Klik Finish jika sudah cocok.`);
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

async function getFrameImage(frameKey) {
  const config = FRAME_CONFIGS[frameKey];
  if (!config?.path) return null;
  if (!frameImageCache[frameKey]) frameImageCache[frameKey] = await loadImage(config.path);
  return frameImageCache[frameKey];
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
  const frameKey = resolveFrameKey(total);
  const slots    = getSlotsForFrame(frameKey, total);

  const canvas  = document.createElement('canvas');
  canvas.width  = STORY_W; canvas.height = STORY_H;
  const ctx     = canvas.getContext('2d');

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
function initLabShot() {
  if (!els.startCameraBtn || !els.video) {
    console.error('Elemen utama kamera tidak ditemukan. Pastikan index.html dan app.js versi sama.');
    return;
  }

  // Populate theme/template menu
  populateThemeOptions();
  populateFrameOptions();

  // Splash screen wiring
  document.getElementById('splashStartBtn')?.addEventListener('click', openApp);
  document.getElementById('showGuideBtn')?.addEventListener('click', showGuide);

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
  console.log('LabShot v35 loaded. Theme menu + new templates aktif.');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLabShot);
} else {
  initLabShot();
}
