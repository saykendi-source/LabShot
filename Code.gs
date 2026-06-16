// ═══════════════════════════════════════════════════════════════
//  LabShot v38 – Code.gs
//
//  PENTING: Apps Script Web App WAJIB di-deploy dengan:
//    Execute as : Me
//    Who has access : Anyone
//
//  Semua GET response pakai ContentService → otomatis ada header
//  Access-Control-Allow-Origin: * sehingga fetch() dari browser bisa.
//
//  Endpoint GET:
//    ?action=manifest          → JSON daftar tema + frame
//    ?action=image&id=FILE_ID  → JSON { ok, dataUrl }
//    ?n=filename.jpg           → HTML halaman foto hasil
//    (kosong)                  → teks health-check
//
//  Endpoint POST:
//    body JSON { imageBase64, fileName } → simpan foto ke Drive
//
//  Struktur folder template di Google Drive:
//    FRAMES_FOLDER_ID/
//      ├── Nama Tema 1/          ← nama folder = nama tema
//      │     ├── frame-a.png
//      │     └── frame-b.png
//      └── Nama Tema 2/
//            └── frame-c.png
// ═══════════════════════════════════════════════════════════════

// ──────────────────────────────────────────────────────────────
//  WAJIB DIISI: ID folder Google Drive
// ──────────────────────────────────────────────────────────────
var PHOTO_FOLDER_ID  = "1HLXr6Y-mX1EqveyV-KPtAQp-5Pt0e6GJ";
var FRAMES_FOLDER_ID = "GANTI_DENGAN_ID_FOLDER_FRAMES_ANDA";

// Cache manifest di memory (reset setiap deploy / setiap jam)
var _cache     = null;
var _cacheTime = 0;
var CACHE_TTL  = 60 * 60 * 1000; // 1 jam

// ═══════════════════════════════════════════════════════════════
//  ROUTER
// ═══════════════════════════════════════════════════════════════
function doGet(e) {
  var p  = (e && e.parameter) ? e.parameter : {};
  var action = p.action || '';

  if (action === 'manifest') {
    return jsonOut_(buildManifest_());
  }

  if (action === 'image' && p.id) {
    return jsonOut_(serveImage_(p.id));
  }

  if (p.n) {
    return renderPhotoPage_(p.n);
  }

  return ContentService
    .createTextOutput('LabShot API aktif. GET ?action=manifest | ?action=image&id=ID | ?n=file.jpg')
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonOut_({ ok: false, error: 'Body POST kosong.' });
    }
    var body = JSON.parse(e.postData.contents);
    if (!body.imageBase64) {
      return jsonOut_({ ok: false, error: 'imageBase64 tidak ada.' });
    }

    var folder   = DriveApp.getFolderById(PHOTO_FOLDER_ID);
    var fileName = body.fileName || makeFileName_();
    var b64      = String(body.imageBase64).replace(/^data:image\/[a-z]+;base64,/, '');
    var bytes    = Utilities.base64Decode(b64);
    var blob     = Utilities.newBlob(bytes, 'image/jpeg', fileName);

    var old = folder.getFilesByName(fileName);
    while (old.hasNext()) { old.next().setTrashed(true); }

    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return jsonOut_({ ok: true, fileId: file.getId(), fileName: file.getName() });
  } catch (err) {
    return jsonOut_({ ok: false, error: err.message });
  }
}

// ═══════════════════════════════════════════════════════════════
//  MANIFEST: baca subfolder Drive → daftar tema + frame
// ═══════════════════════════════════════════════════════════════
function buildManifest_() {
  try {
    var now = Date.now();
    if (_cache && (now - _cacheTime) < CACHE_TTL) {
      return _cache;
    }

    var root    = DriveApp.getFolderById(FRAMES_FOLDER_ID);
    var folders = root.getFolders();
    var themes  = [];

    while (folders.hasNext()) {
      var folder     = folders.next();
      var themeLabel = folder.getName();
      var frames     = [];

      // Ambil semua PNG di subfolder ini
      var pngFiles = folder.getFilesByType(MimeType.PNG);
      while (pngFiles.hasNext()) {
        var f        = pngFiles.next();
        var fname    = f.getName();
        var labelRaw = fname.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
        // Title-case
        var label = labelRaw.replace(/\b\w/g, function(c) { return c.toUpperCase(); });
        frames.push({ id: f.getId(), fileName: fname, label: label });
      }

      frames.sort(function(a, b) { return a.fileName.localeCompare(b.fileName); });

      if (frames.length > 0) {
        themes.push({
          label : themeLabel,
          value : slugify_(themeLabel),
          frames: frames
        });
      }
    }

    themes.sort(function(a, b) { return a.label.localeCompare(b.label); });

    var result = { ok: true, themes: themes };
    _cache     = result;
    _cacheTime = now;
    return result;

  } catch (err) {
    return { ok: false, error: 'buildManifest gagal: ' + err.message };
  }
}

// ═══════════════════════════════════════════════════════════════
//  IMAGE: kembalikan file Drive sebagai base64 dataUrl
// ═══════════════════════════════════════════════════════════════
function serveImage_(fileId) {
  try {
    var file    = DriveApp.getFileById(fileId);
    var blob    = file.getBlob();
    var mime    = blob.getContentType() || 'image/png';
    var b64     = Utilities.base64Encode(blob.getBytes());
    var dataUrl = 'data:' + mime + ';base64,' + b64;
    return { ok: true, dataUrl: dataUrl, fileName: file.getName() };
  } catch (err) {
    return { ok: false, error: 'serveImage gagal: ' + err.message };
  }
}

// ═══════════════════════════════════════════════════════════════
//  FOTO HASIL: halaman HTML untuk scan QR
// ═══════════════════════════════════════════════════════════════
function renderPhotoPage_(fileName) {
  var folder = DriveApp.getFolderById(PHOTO_FOLDER_ID);
  var files  = folder.getFilesByName(fileName);
  var found  = files.hasNext() ? files.next() : null;
  var html   = found ? successHtml_(found) : waitingHtml_(fileName);
  return HtmlService.createHtmlOutput(html)
    .setTitle('LabShot Photo')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function waitingHtml_(fileName) {
  var safe = escapeHtml_(fileName);
  return '<!doctype html><html><head>'
    + '<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
    + '<meta http-equiv="refresh" content="4">'
    + '<title>LabShot \u2013 Menunggu Foto</title>'
    + '<style>'
    + '*{box-sizing:border-box;margin:0}'
    + 'body{font-family:Inter,system-ui,sans-serif;background:linear-gradient(135deg,#fffaf0,#ecfeff);'
    + 'color:#14342b;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px}'
    + '.card{max-width:440px;width:100%;background:#fff;border:1px solid #e5e7eb;border-radius:24px;'
    + 'padding:28px;box-shadow:0 20px 50px rgba(20,52,43,.12);text-align:center}'
    + '.spin{width:48px;height:48px;border:5px solid #d9f4ec;border-top-color:#2dd4bf;'
    + 'border-radius:50%;margin:0 auto 14px;animation:sp 1s linear infinite}'
    + '@keyframes sp{to{transform:rotate(360deg)}}'
    + 'h1{margin:0 0 8px;font-size:24px;color:#0f4f3e}'
    + 'p{line-height:1.6;color:#5b6470;margin:8px 0;font-size:14px}'
    + '.name{background:#f8fafc;border:1px solid #e5e7eb;padding:5px 10px;'
    + 'border-radius:8px;font-size:11px;color:#334155;word-break:break-all;display:inline-block;margin-top:6px}'
    + '</style></head>'
    + '<body><div class="card">'
    + '<div class="spin"></div>'
    + '<h1>Foto sedang disiapkan</h1>'
    + '<p>Halaman otomatis memuat ulang setiap 4 detik.</p>'
    + '<span class="name">' + safe + '</span>'
    + '</div></body></html>';
}

function successHtml_(file) {
  var fileName = escapeHtml_(file.getName());
  var mime     = file.getMimeType() || 'image/jpeg';
  var b64      = Utilities.base64Encode(file.getBlob().getBytes());
  var dataUrl  = 'data:' + mime + ';base64,' + b64;

  return '<!doctype html><html><head>'
    + '<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
    + '<title>LabShot Photo</title>'
    + '<style>'
    + '*{box-sizing:border-box;margin:0}'
    + 'body{font-family:Inter,system-ui,sans-serif;background:linear-gradient(135deg,#fffaf0,#ecfeff);padding:16px;min-height:100vh}'
    + '.wrap{max-width:520px;margin:0 auto}'
    + '.card{background:#fff;border:1px solid #e5e7eb;border-radius:22px;padding:16px;box-shadow:0 18px 48px rgba(20,52,43,.12)}'
    + 'h1{margin:0 0 5px;font-size:24px;color:#0f4f3e;text-align:center}'
    + 'p{text-align:center;color:#5b6470;margin:0 0 12px;font-size:13px}'
    + 'img{display:block;width:100%;border-radius:14px;background:#f8fafc}'
    + '.acts{display:flex;gap:9px;justify-content:center;flex-wrap:wrap;margin-top:12px}'
    + 'a.btn{display:inline-block;padding:10px 18px;border-radius:999px;text-decoration:none;font-weight:700;font-size:13px}'
    + 'a.p{background:linear-gradient(135deg,#2dd4bf,#0d9488);color:#fff}'
    + 'a.s{background:#f8fafc;color:#103b31;border:1px solid #d1d5db}'
    + '.hint{font-size:11px;text-align:center;margin-top:8px;color:#94a3b8;line-height:1.5}'
    + '</style></head>'
    + '<body><div class="wrap"><div class="card">'
    + '<h1>Foto Anda siap \u2713</h1>'
    + '<p>Tekan download atau tahan gambar \u2192 Simpan.</p>'
    + '<img src="' + dataUrl + '" alt="LabShot" />'
    + '<div class="acts">'
    + '<a class="btn p" href="' + dataUrl + '" download="' + fileName + '">\u2B07 Download</a>'
    + '<a class="btn s" href="' + dataUrl + '" target="_blank">Buka Penuh</a>'
    + '</div>'
    + '<div class="hint">Jika tombol tidak bekerja, tahan gambar lalu pilih Simpan.</div>'
    + '</div></div></body></html>';
}

// ═══════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════

// JSON output — ContentService otomatis menambah CORS header
// Access-Control-Allow-Origin: * saat type = JSON atau JAVASCRIPT
function jsonOut_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function makeFileName_() {
  var now = new Date();
  var pad = function(n) { return String(n).padStart(2, '0'); };
  return 'ls-' + String(now.getFullYear()).slice(-2)
    + pad(now.getMonth() + 1) + pad(now.getDate())
    + '-' + pad(now.getHours()) + pad(now.getMinutes()) + pad(now.getSeconds()) + '.jpg';
}

function escapeHtml_(s) {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function slugify_(text) {
  return String(text || '').toLowerCase().normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'tema';
}
