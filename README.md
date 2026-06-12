# LabShot - Web Photobox

Aplikasi photobox berbasis web untuk layar LCD dan kamera/webcam di lab.  
Output: Story Instagram **1080 × 1920 px**, foto tertanam rapi di dalam bingkai.

## Fitur

- Akses kamera melalui browser (HTTPS / localhost)
- Pilih kamera jika ada lebih dari satu perangkat
- Toggle mirror & suara countdown (beep + shutter)
- Live filter preview di viewfinder
- Layout: Single / Strip 2 / Strip 3 / Strip 4 foto
- Frame bawaan: Classic · CFD Street · Capstone · Wisuda
- Filter: Normal · B&W · Warm · Bright · Vintage · Cool
- Upload frame PNG kustom
- Thumbnail strip foto yang sudah diambil
- Download PNG + tombol Bagikan (Web Share API)
- QR Code lokal browser

## Cara menjalankan

```bash
python -m http.server 8000
# buka http://localhost:8000
```

Atau upload ke GitHub Pages (Settings → Pages → branch main / root).

## Struktur folder

```
index.html
style.css
app.js
README.md
assets/
  frames/
    classic-story.png
    cfd-story.png
    capstone-story.png
    wisuda-story.png
```

## Perbaikan & peningkatan (v5)

- **Koordinat slot foto diperbaiki** berdasarkan analisis piksel aktual tiap frame PNG
- Foto kini benar-benar masuk ke dalam area hitam bingkai (bukan ditempel di atas)
- Ditambahkan layout Strip 2 Foto
- Ditambahkan filter Cool
- Toggle mirror & suara
- Live filter preview di viewfinder sebelum foto diambil
- Thumbnail strip foto yang baru diambil
- Pilihan kamera otomatis muncul jika ada lebih dari 1 kamera
- Countdown dengan animasi pop + beep audio
- Suara shutter saat foto diambil
- Tombol kamera berubah warna saat aktif
- UI lebih rapi & responsif

## Catatan

QR Code masih bersifat link lokal browser. Untuk QR publik yang bisa di-scan HP, perlu tambahan backend/storage (Firebase Storage, Supabase, dsb.).


## Perbaikan v7

- Menambahkan template scrapbook dari referensi ke folder `assets/frames/`.
- Menambahkan pilihan frame:
  - Auto Scrapbook
  - Birthday Collage
  - Birthday Camera
  - Memories Box
  - Memories Simple
- Mode Auto Scrapbook otomatis menyesuaikan:
  - 1 foto → Memories Simple
  - 2 foto → Memories Simple
  - 3 foto → Birthday Collage
  - 4 foto → Memories Box
- Foto tidak lagi dibuat seperti ditempel di atas frame.
- Foto dirender sebagai layer penuh di belakang template, lalu muncul melalui transparent window.
- Output tetap Story Instagram 1080 × 1920 px.


## Update v8 – Yogyakarta City Series

- Menambahkan template baru `Yogyakarta City Series` ke folder `assets/frames/`.
- Template ini diambil dari desain yang Anda kirim, lalu area foto diubah menjadi transparent window.
- Posisi foto disesuaikan agar natural:
  - 1 foto: area besar utama
  - 2 foto: area besar + area kecil bawah
  - 3 foto: area besar dibagi 2 strip + area kecil bawah
  - 4 foto: area besar dibagi 3 strip + area kecil bawah
- Template ini dijadikan pilihan default pada dropdown Frame.


## Update v9 – Yogyakarta Template Resize

- Template `Yogyakarta City Series` diperbarui mengikuti desain terbaru yang Anda lampirkan.
- Area foto kini fokus pada 1 window utama besar.
- Penempatan foto disesuaikan agar natural:
  - 1 foto: 1 foto penuh pada area utama
  - 2 foto: 2 strip vertikal dalam area utama
  - 3 foto: 3 strip vertikal dalam area utama
  - 4 foto: 4 strip vertikal dalam area utama


## Update v10 – Pengaturan Sesi Disederhanakan

- Menghapus field **Nama Event**.
- Menghapus field **Countdown** dari panel pengaturan (tetap memakai default 3 detik).
- Menghapus field **Upload Frame Kustom**.
- Dropdown **Frame** kini hanya menampilkan **Yogyakarta City Series**.
- Dropdown **Layout** disederhanakan menjadi:
  - `Single (Utama)`
  - `Strip 2`


## Update v11 – Tambahan 4 Template Frame

Pilihan frame kini bertambah menjadi:
- Yogyakarta City Series
- TI UMY Campus Series
- TI UMY Showcase
- UMY Campus Series
- UMY City Series

Semua template baru sudah ditambahkan ke folder `assets/frames/` dan disiapkan untuk 2 layout:
- `Single (Utama)`
- `Strip 2`


## Update v17 – Google Drive Gallery

Perubahan:
- Firebase Storage diganti dengan Google Drive Gallery.
- QR Code sekarang menuju folder Google Drive event:
  https://drive.google.com/drive/folders/1HLXr6Y-mX1EqveyV-KPtAQp-5Pt0e6GJ
- Foto di-upload ke Google Drive lewat Apps Script Web App:
  https://script.google.com/macros/s/AKfycbyo7rb9TPvHjp6NJNphJfgirDSpkkiAWo_srxlpi1qsPQWbAQGGAIzW3t3lLxt6tq4QLw/exec
- Upload berjalan di background agar antrean photobox tidak tertahan.
- File yang di-upload ke Drive dibuat ringan: 720 × 1280 JPG kualitas 0.62.
- Tombol Download di layar tetap memakai hasil lokal kualitas lebih tinggi.

Catatan:
- Pastikan folder Google Drive diatur `Anyone with the link → Viewer`.
- Pastikan Apps Script Web App sudah dideploy dengan:
  Execute as: Me
  Who has access: Anyone


## Update v18 – Camera Fix

Perubahan:
- Inisialisasi tombol kamera dibuat lebih aman dengan `DOMContentLoaded`.
- `startCamera()` sekarang menampilkan error lebih jelas jika izin kamera ditolak, kamera tidak ditemukan, atau halaman tidak HTTPS.
- Ditambahkan `await video.play()` setelah stream aktif.


## Update v19 – Logo TI UMY dan Tema Pastel

Perubahan:
- Logo di header diganti menggunakan logo TI UMY dari file lampiran.
- Tampilan utama diubah dari dark theme menjadi light pastel theme.
- Panel, tombol, form, kamera, dan kartu hasil dibuat lebih cerah.


## Update v20 – Tambahan 3 Template + Layout Strip 3

Perubahan:
- Menambahkan 3 template baru:
  - TI UMY Friendship
  - Daily Quote
  - IT Future
- Menambahkan pilihan layout baru: Strip 3.
- Opsi layout kini akan menyesuaikan dukungan masing-masing template.
- Jika template tidak mendukung jumlah foto tertentu, pilihan layout itu otomatis dinonaktifkan.
