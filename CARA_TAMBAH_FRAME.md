# Cara Menambah Frame Baru ke LabShot

## Struktur folder di GitHub
```
assets/
  frames/
    manifest.json          ← daftar semua tema & frame
    one-piece/             ← slug tema
      op-2.webp
      op-3.webp
      ...
    pendadaran/
      pendadaran-1.webp
      ...
    skp/
      skp-1.webp
      ...
    ti-umy/
      ti-umy-1.webp
      ...
```

## Langkah menambah frame baru

### 1. Siapkan file frame
- Format: **WebP** (disarankan) atau PNG
- Ukuran: **540×960 px** (aplikasi akan scale ke 1080×1920)
- Area foto harus **transparan** (kotak hitam/putih akan otomatis di-detect)

### 2. Upload ke GitHub
Upload file ke folder tema yang sesuai:
- `assets/frames/one-piece/` untuk tema One Piece
- `assets/frames/pendadaran/` untuk tema Pendadaran
- `assets/frames/skp/` untuk tema SKP
- `assets/frames/ti-umy/` untuk tema TI UMY

### 3. Update manifest.json
Buka `assets/frames/manifest.json`, tambahkan entry di bagian tema yang sesuai:

```json
{
  "key": "op-32",
  "file": "op-32.webp",
  "label": "OP 32",
  "defaultCount": 1
}
```

**Penjelasan field:**
- `key`: ID unik frame (huruf kecil, tanda hubung)
- `file`: nama file persis di folder tema
- `label`: nama yang tampil di dropdown
- `defaultCount`: jumlah foto yang diambil (1, 2, atau 3)

### 4. Commit & Push
```bash
git add assets/frames/
git commit -m "Tambah frame OP 32"
git push
```

Selesai! Frame langsung muncul di aplikasi tanpa perlu ubah kode JS.

---

## Menambah tema baru

1. Buat folder baru: `assets/frames/nama-tema/`
2. Upload frame ke folder tersebut
3. Tambahkan tema di `manifest.json`:

```json
{
  "slug": "nama-tema",
  "label": "Nama Tema Lengkap",
  "frames": [
    {"key": "frame-1", "file": "frame-1.webp", "label": "Frame 1", "defaultCount": 1}
  ]
}
```

4. Commit & push
