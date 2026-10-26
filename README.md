# FileKecil

Toolkit gambar online untuk kompres, konversi format, dan resize gambar. Pemrosesan gambar dilakukan langsung di browser pengguna.

## Fitur
- Kompres gambar dengan pengaturan kualitas.
- Konversi JPG, PNG, WebP, ICO (ikon/favicon), dan PDF.
- Resize dimensi gambar dengan opsi mempertahankan rasio.
- Unduh hasil tanpa mengunggah file ke server.
- Halaman kebijakan privasi, metadata SEO, sitemap, robots.txt, dan favicon.

## Menjalankan lokal
Memerlukan Node.js 20 atau lebih baru.

```bash
npm install
npm run dev
```

Buka http://localhost:3000.

## Deploy ke Vercel
1. Impor repository GitHub ini di https://vercel.com/new.
2. Pilih framework preset Next.js.
3. Gunakan perintah build default `next build`.
4. Klik Deploy.

Setelah memiliki domain produksi sendiri, ubah `metadataBase`, URL sitemap, dan robots di `app/layout.jsx`, `app/sitemap.js`, dan `app/robots.js` agar sesuai domain tersebut.

## Catatan
- File diproses di browser; batas ukuran input saat ini 25 MB.
- Dukungan WebP bergantung pada browser dan Canvas API; ekspor PDF dan ICO dibuat di browser.
- Pengolahan GIF menggunakan frame yang ditampilkan browser dan menghasilkan gambar statis.
