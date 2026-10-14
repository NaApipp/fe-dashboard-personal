z# Dashboard Pribadi — Frontend

Frontend dashboard pribadi dengan React 18, Vite, TypeScript, dan Tailwind CSS.

## Cara Menjalankan

```bash
# 1. Clone dan masuk ke direktori
cd fe-dashboard-react

# 2. Salin env dan sesuaikan
cp .env.example .env

# 3. Install dependencies
npm install

# 4. Jalankan dev server
npm run dev
```

Buka http://localhost:5173 di browser.

## Environment Variables

| Variabel            | Keterangan                                      | Default |
|---------------------|-------------------------------------------------|---------|
| `VITE_API_BASE_URL` | Base URL API backend                            | `https://api.appsporto.my.id` |
| `VITE_USE_MOCK`     | Gunakan data mock tanpa API asli (`true`/`false`) | `true` |

Salin `.env.example` ke `.env` dan sesuaikan nilainya.

## Mock Mode vs API Asli

### Mode Mock (default)
```env
VITE_USE_MOCK=true
VITE_API_BASE_URL=https://api.appsporto.my.id
```
- Login dengan: nama `admin`, password `admin123`
- Data dummy realistis tersedia untuk semua modul
- Tidak memerlukan koneksi ke backend

### Mode API Asli
```env
VITE_USE_MOCK=false
VITE_API_BASE_URL=https://api.appsporto.my.id
```
- Menggunakan API backend nyata
- Token disimpan di httpOnly cookie (tidak bisa dibaca JS)

## Struktur Folder

```
src/
├── lib/
│   ├── api/
│   │   ├── client.ts          # Axios instance + 401 interceptor
│   │   └── endpoints.ts       # Konstanta path endpoint
│   └── utils/
│       ├── cn.ts              # Tailwind class merger
│       └── date.ts            # Utilitas tanggal (date-fns, locale id)
├── features/
│   ├── auth/                  # Login, logout, session check
│   ├── messages/              # Pesan inbox
│   ├── assignments/           # Tugas kuliah
│   └── schedule/              # Jadwal pribadi
├── components/
│   ├── ui/                    # Primitif: Button, Modal, Toast, Skeleton, dll
│   └── layout/                # AppShell, Sidebar, ProtectedRoute
└── pages/                     # LoginPage, DashboardPage, dll
```

## Checklist Integrasi API Asli

- [ ] **CORS**: Backend harus mengizinkan origin frontend dengan `credentials: true`
- [ ] **Cookie Domain**: Cookie `token` harus di-set untuk domain yang benar (termasuk subdomain jika perlu)
- [ ] **SameSite/Secure**: Pastikan `SameSite=Lax` dan `Secure=true` di production (HTTPS)
- [ ] **Format Tanggal**: Deadline assignment dikirim sebagai `["YYYY-MM-DD", "HH:MM"]`
- [ ] **API Path**: Assignment endpoint backend menggunakan `/api/asignment` (satu 's') — sudah sesuai di `endpoints.ts`
- [ ] **Session Check**: `GET /api/auth/me` dipanggil saat app pertama dibuka untuk verifikasi sesi

## Asumsi

1. **Endpoint `DELETE /api/message/:id`**: Diasumsikan ada karena tidak terdokumentasi secara eksplisit
2. **Field `end_time`, `location`, `notes` pada Schedule**: Tidak ada di spec — diasumsikan sebagai field opsional yang diterima API
3. **Endpoint `PUT /api/asignment/:id`**: Diasumsikan ada untuk update assignment
4. **Read/Archive status pesan**: API tidak memiliki endpoint untuk ini, sehingga state disimpan di `localStorage` sisi client
5. **Pagination**: API tidak mendokumentasikan pagination — semua data dimuat sekaligus, filter/search dilakukan di client
6. **Endpoint `DELETE /api/message/:id`**: Diasumsikan ada
7. **Schedule tidak ada endpoint update**: Hanya Create dan Delete yang tersedia sesuai spec — edit agenda tidak diimplementasikan

## Scripts

```bash
npm run dev      # Dev server
npm run build    # Production build
npm run lint     # Linting dengan oxlint
npm run preview  # Preview production build
```
