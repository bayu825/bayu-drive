# 📋 CATATAN DEPLOYMENT - Cloud Kalisanen (9Drive)

> Dibuat: 2026-07-01 | Terakhir diupdate: 2026-07-01 (sesi ke-2)

---

## 🌐 Domain & Hosting

| Layanan | Platform | URL |
|---------|----------|-----|
| Frontend | Railway (`cozy-adaptation`) | https://cozy-adaptation-production-184f.up.railway.app |
| Backend | Railway (`bayu-drive`) | https://bayu-drive-production.up.railway.app |
| MySQL | Railway | (internal Railway DB) |
| Custom Domain | Domenesia → `kebunkalisanen.web.id` | https://drive.kebunkalisanen.web.id ✅ |

### Status DNS Custom Domain (per 2026-07-01 sesi ke-2)
- Domain registrar: **Domenesia**
- Subdomain yang dikonfigurasi: `drive.kebunkalisanen.web.id`
- DNS Records di Domenesia:
  - `drive` → CNAME → `4o2nae29.up.railway.app`
  - `_railway-verify.drive` → TXT → `railway-verify=78a5bed4ed4fbb7338222d2bb0c331c942383895f28a0aa3bfd46e83b6ad4ac8`
- **Status**: ✅ **Terverifikasi & aktif di Railway** (ceklist hijau)

---

## ☁️ Google Cloud

### Project Aktif
- **Nama**: Drive Kalisanen
- **Project ID / Number**: `377819649205`
- **Status OAuth Consent**: In Production, External ✅
- **Google Drive API**: Enabled ✅

### OAuth Client
- **Nama**: 9Drive Web Client
- **Client ID**: `377819649205-m26qhqcl2aik4bo69tfqm3mndob3o1og.apps.googleusercontent.com`
- **Client Secret**: *(tersimpan di Railway variable `GOOGLE_CLIENT_SECRET`)*
- **Authorized JavaScript Origins**: ✅
  - `https://drive.kebunkalisanen.web.id`
- **Authorized Redirect URIs**: ✅
  - `https://bayu-drive-production.up.railway.app/auth/google/callback`
  - `https://bayu-drive-production.up.railway.app/connected-accounts/google/callback`

---

## 🚂 Railway Environment Variables (bayu-drive / backend)

| Variable | Nilai / Keterangan |
|----------|--------------------|
| `DATABASE_URL` | MySQL Railway internal |
| `FRONTEND_URL` | `https://drive.kebunkalisanen.web.id` ✅ |
| `JWT_ACCESS_SECRET` | JWT secret |
| `TOKEN_ENCRYPTION_KEY` | Encryption key untuk Google tokens |
| `GOOGLE_CLIENT_ID` | `377819649205-m26qhqcl2aik4bo69tfqm3mndob3o1og.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | *(tersimpan di Railway)* |
| `GOOGLE_REDIRECT_URI` | `https://bayu-drive-production.up.railway.app/connected-accounts/google/callback` |

---

## 👤 Akun & Akses

| Email | Peran |
|-------|-------|
| `febnicobayu.42@gmail.com` | Developer / Admin (owner project Google Cloud & Railway) |
| `ptpnkebunkalisanen@gmail.com` | User Kalisanen (akun 9Drive biasa) |

### Hak Akses Khusus di Frontend
- Menu **API** di sidebar hanya muncul untuk `febnicobayu.42@gmail.com`
- Diimplementasi di: `frontend/src/layouts/DriveLayout.tsx` (kondisi `user?.email === 'febnicobayu.42@gmail.com'`)

---

## 🎨 Perubahan Branding (2026-07-01 sesi ke-2)

### Logo & Identitas Visual
| File | Perubahan |
|------|-----------|
| `frontend/src/assets/logo.jpeg` | ✅ Ditambahkan — logo Cloud Kalisanen asli |
| `frontend/public/logo.jpeg` | ✅ Ditambahkan — untuk apple-touch-icon (PWA) |
| `frontend/public/favicon.svg` | ✅ Dibuat ulang — lingkaran biru dengan cloud + panah upload (mengganti icon Vite) |
| `frontend/public/pwa-192x192.svg` | 🗑️ Dihapus (diganti logo.jpeg) |
| `frontend/public/pwa-512x512.svg` | 🗑️ Dihapus (diganti logo.jpeg) |
| `frontend/public/maskable-icon.svg` | 🗑️ Dihapus (diganti logo.jpeg) |

### Halaman yang Diubah
| Halaman / File | Perubahan |
|----------------|-----------|
| `frontend/index.html` | Judul tab browser: `9Drive Dashboard` → **`Cloud Kalisanen`**; favicon diperbarui |
| `frontend/vite.config.ts` | Nama PWA: `9Drive` → **`Cloud Kalisanen`**; icons diperbarui ke logo.jpeg; tambah `@types/node` & fix `__dirname` untuk ESM |
| `frontend/src/components/drive/BrandLogo.tsx` | SVG icon lama → **gambar logo Cloud Kalisanen** (di sidebar dashboard) |
| `frontend/src/pages/LoginPage.tsx` | Icon `HardDrive` biru → **gambar logo Cloud Kalisanen** |
| `frontend/src/pages/RegisterPage.tsx` | Icon `HardDrive` biru → **gambar logo Cloud Kalisanen** |

---

## ⚠️ Hal Penting / Known Issues

1. **`GOOGLE_REDIRECT_URI` masih domain Railway lama** — backend tidak punya custom domain sendiri, jadi URI ini tetap valid. Pastikan URI ini terdaftar di Google Cloud Console ✅.

2. **Saat ganti Google Client ID**, semua connected Google Drive account lama terputus dan perlu di-reconnect ulang.

3. **Google OAuth app belum diverifikasi Google** — limit 100 sensitive scope logins. Untuk skala lebih besar perlu submit verifikasi ke Google.

4. **`kalisanen.web.id`** tidak dimiliki di Domenesia — jangan coba konfigurasi subdomain domain ini.

5. **`kebunkalisanen.web.id`** adalah satu-satunya domain aktif di akun Domenesia `bayu adresian`.

---

## 📁 Struktur Penting

```
e:\9Drive\
├── backend/          # Express API (Railway: bayu-drive)
├── frontend/         # Vite React (Railway: cozy-adaptation)
│   ├── public/
│   │   ├── favicon.svg     # Favicon baru (lingkaran biru)
│   │   └── logo.jpeg       # Logo Cloud Kalisanen (PWA/touch icon)
│   └── src/assets/
│       └── logo.jpeg       # Logo Cloud Kalisanen (dipakai di komponen React)
├── docker-compose.yml
├── AGENTS.md         # Aturan dan konvensi project (WAJIB DIBACA)
└── NOTES.md          # File ini
```

---

## ✅ Checklist Status Deployment

- [x] Backend online di Railway
- [x] Frontend online di Railway
- [x] MySQL online di Railway
- [x] Google Drive API enabled
- [x] OAuth client production (In Production)
- [x] API menu disembunyikan untuk non-admin
- [x] DNS `drive.kebunkalisanen.web.id` terverifikasi di Railway ✅
- [x] `FRONTEND_URL` backend diupdate ke domain custom ✅
- [x] Authorized JavaScript Origins ditambahkan di Google Cloud ✅
- [x] Branding: logo, favicon, title diupdate ke Cloud Kalisanen ✅
- [x] Upload test berhasil end-to-end di domain production
- [ ] Google OAuth app submit verifikasi ke Google (opsional, untuk >100 users)

---

## 🛠️ Perbaikan UI & Fitur (2026-07-02)

1. **Folder Lock Security:** 
   - Penambahan fitur penguncian folder dengan password (enkripsi Argon2).
   - Menu aksi `Lock`, `Unlock`, dan `Reset Lock` (khusus admin `febnicobayu.42@gmail.com`).
   - Menyembunyikan akses file jika password folder belum dimasukkan (`x-folder-passwords` middleware).

2. **Perbaikan Tampilan "All Files":**
   - Daftar file (grid/table) disembunyikan di root directory (halaman awal) jika pengguna tidak membuka folder atau melakukan pencarian.
   - Penambahan fitur **Global Drag-and-Drop** di area utama workspace. Saat file ditarik ke layar, *overlay* upload akan muncul dan formulir upload langsung terbuka.

3. **Kompatibilitas Dokumen Office:**
   - Tombol **"View"** (preview bawaan browser) dinonaktifkan untuk dokumen Office (.doc, .xls, .ppt, dsb) untuk mencegah error *Preview not available*.
   - Tombol "Edit OnlyOffice" diganti nama menjadi **"Open/edit"** dan sekarang dimunculkan tidak hanya untuk format baru (`.xlsx`, `.docx`, `.pptx`) tetapi juga format klasik (`.xls`, `.doc`, `.ppt`, `.csv`).
   - Perbaikan `getPreviewKind` untuk membaca ekstensi file jika MIME type tidak dikenali atau berupa *octet-stream*.
