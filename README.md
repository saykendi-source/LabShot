# LabShot - Web Photobox MVP

Versi awal aplikasi photobox berbasis web untuk layar LCD dan kamera/webcam di lab.

## Fitur

- Akses kamera melalui browser
- Countdown otomatis
- Layout Single Photo, Photo Strip 3 foto, dan Photo Strip 4 foto
- Frame bawaan: Classic, CFD Street, Capstone, Wisuda
- Filter sederhana: Normal, Black & White, Warm, Bright, Vintage
- Upload frame PNG opsional
- Preview hasil foto
- Download hasil dalam format PNG
- Tombol bagikan jika browser mendukung Web Share API
- QR demo untuk link lokal browser

## Cara menjalankan di komputer lokal

1. Ekstrak file ZIP.
2. Buka folder project.
3. Jalankan dengan server lokal, misalnya:

```bash
python -m http.server 8000
```

4. Buka browser:

```text
http://localhost:8000
```

Kamera dapat berjalan di `localhost` atau website HTTPS seperti GitHub Pages.

## Cara upload ke GitHub Pages

1. Buat repository baru, misalnya `labshot-photobox`.
2. Upload semua file: `index.html`, `style.css`, `app.js`, dan `README.md`.
3. Buka Settings → Pages.
4. Pilih branch `main`, folder `/root`.
5. Buka link GitHub Pages yang muncul.

## Catatan penting

Versi ini masih statis, sehingga hasil foto hanya tersimpan di browser pengguna. QR Code masih bersifat demo dari link lokal browser. Agar QR bisa discan HP dan langsung mengunduh foto, versi berikutnya perlu backend/storage, misalnya Firebase Storage, Supabase Storage, Google Drive API, atau server lokal Node.js.

## Rekomendasi versi berikutnya

- Backend Node.js untuk upload foto
- Storage foto per event
- Admin panel untuk ganti frame/event
- Gallery privat per sesi
- QR download publik
- Statistik jumlah foto per event


## Update terbaru
- Foto otomatis masuk ke dalam frame bawaan
- Output sudah mengikuti ukuran Story Instagram (1080 x 1920)
- Empat frame bawaan ada di folder `assets/frames/`


## Update v2
- Memperbaiki masalah hasil foto tidak muncul di dalam bingkai.
- Frame bawaan digambar sebagai latar, lalu foto dimasukkan ke area kosong frame.
- Output tetap Story Instagram 1080 x 1920.


## Update v3
- Frame bawaan sudah dibuat transparan pada area kosong.
- Foto sekarang dirender di belakang frame agar terlihat menyatu, bukan sekadar ditempel.
- Ditambahkan efek inset/shadow halus agar foto terasa masuk ke bingkai.
