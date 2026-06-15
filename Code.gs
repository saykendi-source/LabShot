// ═══════════════════════════════════════════════════════════════
//  LabShot v37 – Code.gs  (SATU FILE UNTUK SEMUA ENDPOINT)
//
//  Endpoint:
//  GET  ?n=filename.jpg          → serve halaman foto hasil
//  GET  ?action=manifest         → JSONP daftar tema+template dari Drive
//  GET  ?action=image&id=FILE_ID → JSONP gambar template base64
//  POST (body JSON)              → upload foto hasil ke Drive
//
//  Setup:
//  1. Paste seluruh file ini ke Google Apps Script (satu project).
//  2. Isi PHOTO_FOLDER_ID  = folder ID tempat foto hasil disimpan.
//  3. Isi FRAMES_FOLDER_ID = folder ID induk folder-tema template.
//  4. Deploy → Web App:  Execute as: Me | Who has access: Anyone
//  5. Salin URL Web App ke APPS_SCRIPT_URL di app.js.
//     (TEMPLATE_API_URL bisa diisi URL yang sama.)
//
//  Struktur folder template di Google Drive:
//  FRAMES_FOLDER_ID/
//    ├── Yogyakarta City/          ← nama folder = nama tema
//    │     ├── yogyakarta-city.png
//    │     └── ...
//    ├── TI UMY Campus/
//    │     └── ti-umy-campus.png
//    └── (folder tema lainnya...)
//
//  Setiap PNG di dalam subfolder otomatis muncul sebagai template.
//  Tidak perlu edit kode saat menambah tema/template baru.
// ═══════════════════════════════════════════════════════════════

// ── ID Folder Google Drive ──────────────────────────────────
const PHOTO_FOLDER_ID  = "1HLXr6Y-mX1EqveyV-KPtAQp-5Pt0e6GJ";  // folder hasil foto
const FRAMES_FOLDER_ID = "GANTI_DENGAN_ID_FOLDER_FRAMES";        // folder induk template

// ── Cache manifest agar tidak bolak-balik baca Drive ───────
let _manifestCache     = null;
let _manifestCacheTime = 0;
const MANIFEST_TTL_MS  = 5 * 60 * 1000; // 5 menit

// ═══════════════════════════════════════════════════════════════
//  ROUTER UTAMA
// ═══════════════════════════════════════════════════════════════
function doGet(e) {
  const p = (e && e.parameter) ? e.parameter : {};
  const cb = p.callback || '';   // JSONP callback name

  // ── Template: manifest (daftar tema + file ID per template) ──
  if (p.action === 'manifest') {
    return jsonpOrJson_(cb, buildManifest_());
  }

  // ── Template: ambil gambar satu template sebagai base64 ──────
  if (p.action === 'image' && p.id) {
    return jsonpOrJson_(cb, serveImage_(p.id));
  }

  // ── Foto hasil: serve halaman foto pribadi ───────────────────
  if (p.n) {
    return renderPhotoPage_(p.n);
  }

  // ── Health check ─────────────────────────────────────────────
  return ContentService
    .createTextOutput("LabShot Drive aktif. Endpoint: ?action=manifest | ?action=image&id=ID | ?n=filename.jpg")
    .setMimeType(ContentService.MimeType.TEXT);
}

// ═══════════════════════════════════════════════════════════════
//  UPLOAD FOTO HASIL  (POST)
// ═══════════════════════════════════════════════════════════════
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse_({ ok: false, error: 'Data POST kosong.' });
    }
    const data = JSON.parse(e.postData.contents);
    if (!data.imageBase64) {
      return jsonResponse_({ ok: false, error: 'imageBase64 tidak ditemukan.' });
    }

    const folder   = DriveApp.getFolderById(PHOTO_FOLDER_ID);
    const fileName = data.fileName || makeFileName_();
    const clean64  = String(data.imageBase64).replace(/^data:image\/[a-z]+;base64,/, '');
    const bytes    = Utilities.base64Decode(clean64);
    const blob     = Utilities.newBlob(bytes, 'image/jpeg', fileName);

    // Hapus file lama dengan nama yang sama (jika ada retake)
    const old = folder.getFilesByName(fileName);
    while (old.hasNext()) old.next().setTrashed(true);

    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return jsonResponse_({ ok: true, fileId: file.getId(), fileName: file.getName() });
  } catch (err) {
    return jsonResponse_({ ok: false, error: err.message });
  }
}

// ═══════════════════════════════════════════════════════════════
//  MANIFEST TEMPLATE  (GET ?action=manifest)
//  Kembalikan semua subfolder sebagai tema dan file PNG di
//  dalamnya sebagai daftar template.
//  Format response:
//  { ok: true, themes: [{ label, value, frames: [{id, fileName, label}] }] }
// ═══════════════════════════════════════════════════════════════
function buildManifest_() {
  try {
    // Cache agar request berulang tidak membebani Drive API
    const now = Date.now();
    if (_manifestCache && (now - _manifestCacheTime) < MANIFEST_TTL_MS) {
      return _manifestCache;
    }

    const rootFolder = DriveApp.getFolderById(FRAMES_FOLDER_ID);
    const themes     = [];
    const subFolders = rootFolder.getFolders();

    while (subFolders.hasNext()) {
      const folder    = subFolders.next();
      const themeLabel = folder.getName();
      const frames    = [];

      const files = folder.getFilesByType(MimeType.PNG);
      while (files.hasNext()) {
        const file     = files.next();
        const fileName = file.getName();
        frames.push({
          id:       file.getId(),
          fileName: fileName,
          // Label dari nama file: hilangkan ekstensi, ganti tanda baca jadi spasi
          label: fileName
            .replace(/\.[^.]+$/, '')
            .replace(/[-_]+/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase()),
        });
      }

      // Urutkan alfabetis berdasarkan nama file
      frames.sort((a, b) => a.fileName.localeCompare(b.fileName));

      if (frames.length > 0) {
        themes.push({
          label: themeLabel,
          // value = slug dari nama folder untuk dijadikan key di JS
          value: slugify_(themeLabel),
          frames: frames,
        });
      }
    }

    // Urutkan tema alfabetis
    themes.sort((a, b) => a.label.localeCompare(b.label));

    const result = { ok: true, themes: themes };
    _manifestCache     = result;
    _manifestCacheTime = now;
    return result;

  } catch (err) {
    return { ok: false, error: 'Gagal membaca folder template: ' + err.message };
  }
}

// ═══════════════════════════════════════════════════════════════
//  SERVE GAMBAR TEMPLATE  (GET ?action=image&id=FILE_ID)
//  Kembalikan gambar sebagai base64 dataUrl agar bisa langsung
//  digunakan di canvas tanpa CORS issue.
//  Format response: { ok: true, dataUrl: "data:image/png;base64,..." }
// ═══════════════════════════════════════════════════════════════
function serveImage_(fileId) {
  try {
    const file     = DriveApp.getFileById(fileId);
    const blob     = file.getBlob();
    const mime     = blob.getContentType() || 'image/png';
    const base64   = Utilities.base64Encode(blob.getBytes());
    const dataUrl  = 'data:' + mime + ';base64,' + base64;
    return { ok: true, dataUrl: dataUrl, fileName: file.getName() };
  } catch (err) {
    return { ok: false, error: 'Gagal memuat gambar template: ' + err.message };
  }
}

// ═══════════════════════════════════════════════════════════════
//  HALAMAN FOTO HASIL  (GET ?n=filename.jpg)
// ═══════════════════════════════════════════════════════════════
function renderPhotoPage_(fileName) {
  const folder = DriveApp.getFolderById(PHOTO_FOLDER_ID);
  const files  = folder.getFilesByName(fileName);
  const found  = files.hasNext() ? files.next() : null;
  const html   = found ? successHtml_(found) : waitingHtml_(fileName);
  return HtmlService.createHtmlOutput(html)
    .setTitle('LabShot Photo')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function waitingHtml_(fileName) {
  const safe = escapeHtml_(fileName);
  return `<!doctype html><html><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="refresh" content="4">
<title>LabShot – Menunggu Foto</title>
<style>
*{box-sizing:border-box;margin:0}
body{font-family:Inter,system-ui,sans-serif;background:linear-gradient(135deg,#fffaf0,#ecfeff);
  color:#14342b;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px}
.card{max-width:460px;width:100%;background:#fff;border:1px solid #e5e7eb;border-radius:24px;
  padding:28px;box-shadow:0 20px 50px rgba(20,52,43,.12);text-align:center}
.spin{width:52px;height:52px;border:5px solid #d9f4ec;border-top-color:#2dd4bf;
  border-radius:50%;margin:0 auto 16px;animation:sp 1s linear infinite}
@keyframes sp{to{transform:rotate(360deg)}}
h1{margin:0 0 10px;font-size:26px;color:#0f4f3e}
p{line-height:1.6;color:#5b6470;margin:8px 0}
.name{background:#f8fafc;border:1px solid #e5e7eb;padding:6px 12px;
  border-radius:10px;font-size:12px;color:#334155;word-break:break-all;display:inline-block;margin-top:8px}
</style></head>
<body><div class="card">
<div class="spin"></div>
<h1>Foto sedang disiapkan</h1>
<p>Halaman ini akan memuat ulang otomatis setiap 4 detik sampai foto Anda tersedia.</p>
<span class="name">${safe}</span>
</div></body></html>`;
}

function successHtml_(file) {
  const fileName = escapeHtml_(file.getName());
  const mime     = file.getMimeType() || 'image/jpeg';
  const base64   = Utilities.base64Encode(file.getBlob().getBytes());
  const dataUrl  = 'data:' + mime + ';base64,' + base64;

  return `<!doctype html><html><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>LabShot Photo</title>
<style>
*{box-sizing:border-box;margin:0}
body{font-family:Inter,system-ui,sans-serif;background:linear-gradient(135deg,#fffaf0,#ecfeff);
  padding:18px;min-height:100vh}
.wrap{max-width:560px;margin:0 auto}
.card{background:#fff;border:1px solid #e5e7eb;border-radius:24px;
  padding:18px;box-shadow:0 20px 50px rgba(20,52,43,.12)}
h1{margin:0 0 6px;font-size:26px;color:#0f4f3e;text-align:center}
p{text-align:center;color:#5b6470;margin:0 0 14px;font-size:13px}
img{display:block;width:100%;border-radius:16px;background:#f8fafc}
.actions{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:14px}
a.btn{display:inline-block;padding:11px 20px;border-radius:999px;text-decoration:none;font-weight:700;font-size:14px}
a.primary{background:linear-gradient(135deg,#2dd4bf,#0d9488);color:#fff}
a.secondary{background:#f8fafc;color:#103b31;border:1px solid #d1d5db}
.hint{font-size:12px;text-align:center;margin-top:10px;color:#64748b;line-height:1.5}
.name{font-size:11px;text-align:center;margin-top:8px;color:#94a3b8}
</style></head>
<body><div class="wrap"><div class="card">
<h1>Foto Anda siap ✓</h1>
<p>Tekan tombol download atau tahan gambar → Simpan.</p>
<img src="${dataUrl}" alt="LabShot Photo" />
<div class="actions">
  <a class="btn primary" href="${dataUrl}" download="${fileName}">⬇ Download Foto</a>
  <a class="btn secondary" href="${dataUrl}" target="_blank">Buka Penuh</a>
</div>
<div class="hint">Jika tombol download tidak bekerja, tekan & tahan gambar lalu pilih Simpan.</div>
<div class="name">${fileName}</div>
</div></div></body></html>`;
}

// ═══════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════

// Kembalikan JSONP jika ada callback name, JSON biasa jika tidak ada
function jsonpOrJson_(callback, obj) {
  const json = JSON.stringify(obj);
  if (callback) {
    // JSONP: callback(data)
    return ContentService
      .createTextOutput(callback + '(' + json + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function makeFileName_() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `ls-${String(now.getFullYear()).slice(-2)}${pad(now.getMonth()+1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.jpg`;
}

function escapeHtml_(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function slugify_(text) {
  return String(text || '')
    .toLowerCase().normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'tema';
}
