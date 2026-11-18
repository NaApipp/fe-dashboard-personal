# Dokumentasi API - Personal Dashboard Backend (api-porto-v2)

Dokumentasi lengkap dan detail untuk seluruh endpoint API yang tersedia pada proyek **api-porto-v2**.

---

## 📌 Informasi Umum

- **Base URL (Local):** `http://localhost:3000` (atau port yang dikonfigurasi pada environment)
- **Base URL (Production):** `https://api.appsporto.my.id`
- **Format Data:** JSON (`Content-Type: application/json`)
- **Autentikasi:** Bearer Token (JWT) via header `Authorization`
- **Database:** MongoDB (Collections: `messages`, `task`, `schedules`)

---

## 🔑 Autentikasi (Bearer Token)

Semua endpoint yang dilindungi memerlukan header:

```
Authorization: Bearer <token>
```

Token didapatkan dari response endpoint login (`POST /api/auth/login`).

### Endpoint yang TIDAK memerlukan autentikasi (Public):
- `GET /` — Health check
- `POST /api/auth/login` — Login
- `POST /api/auth/logout` — Logout
- `POST /api/message` — Kirim pesan (form kontak)
- `POST /message` — Kirim pesan (form kontak, alias)

### Endpoint yang MEMERLUKAN autentikasi (Protected):
- `GET /api/auth/me` — Profil user
- `GET /api/message` — Ambil semua pesan
- `GET /message` — Ambil semua pesan (alias)
- Semua endpoint `/api/asignment/*`
- Semua endpoint `/api/schedule/*`

---

## 🔐 1. Authentication Endpoints (`/api/auth`)

### 1.1. User Login
- **Endpoint:** `POST /api/auth/login`
- **Deskripsi:** Melakukan autentikasi user dan menghasilkan JWT Bearer token.
- **Request Headers:**
  - `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "name": "n_apipppp",
    "password": "Testing1#"
  }
  ```
- **Ketentuan Validasi Body:**
  - `name`: String (Wajib)
  - `password`: String (Wajib)
- **Responses:**
  - **200 OK (Berhasil):**
    ```json
    {
      "success": true,
      "message": "Login berhasil",
      "user": {
        "id_user": 1,
        "name": "n_apipppp"
      },
      "token": "eyJhbGciOiJIUzI1NiIsIn..."
    }
    ```
    *Simpan `token` di client (localStorage/sessionStorage/state management) dan kirim di header `Authorization: Bearer <token>` untuk setiap request ke endpoint protected.*
  - **400 Bad Request (Field kosong):**
    ```json
    {
      "message": "Name dan password wajib diisi"
    }
    ```
  - **401 Unauthorized (Nama/Password Salah):**
    ```json
    {
      "message": "name atau password salah"
    }
    ```
  - **500 Internal Server Error:**
    ```json
    {
      "message": "Terjadi kesalahan server"
    }
    ```

---

### 1.2. User Logout
- **Endpoint:** `POST /api/auth/logout`
- **Deskripsi:** Menginformasikan client untuk menghapus token dari storage. Karena menggunakan Bearer Token, logout dilakukan di sisi client.
- **Responses:**
  - **200 OK (Berhasil):**
    ```json
    {
      "success": true,
      "message": "Logout berhasil. Silakan hapus token dari client."
    }
    ```
  - **500 Internal Server Error:**
    ```json
    {
      "message": "Terjadi kesalahan server saat logout"
    }
    ```

---

### 1.3. Get Current User Profile
- **Endpoint:** `GET /api/auth/me`
- **Deskripsi:** Mengambil data profil user yang sedang login berdasarkan JWT Bearer token.
- **Autentikasi:** Wajib. Header `Authorization: Bearer <token>` harus ada dan valid.
- **Request Headers:**
  - `Authorization: Bearer <token>`
- **Responses:**
  - **200 OK (Berhasil):**
    ```json
    {
      "user": {
        "id_user": 1,
        "name": "n_apipppp"
      }
    }
    ```
  - **401 Unauthorized (Token Tidak Ditemukan):**
    ```json
    {
      "message": "Token tidak ditemukan. Gunakan header: Authorization: Bearer <token>"
    }
    ```
  - **401 Unauthorized (Token Tidak Valid / Kadaluarsa):**
    ```json
    {
      "message": "Token tidak valid atau kadaluarsa"
    }
    ```

---

## 💬 2. Message Endpoints (`/api`)

### 2.1. Kirim Pesan Baru (Public)
- **Endpoint:** `POST /api/message`
- **Deskripsi:** Mengirimkan pesan baru dari form kontak, menyimpan ke koleksi `messages` MongoDB, serta mengirimkan notifikasi via email melalui layanan Resend.
- **Autentikasi:** Tidak diperlukan (Public)
- **Request Body:**
  ```json
  {
    "name": "John Doe",
    "email": "johndoe@example.com",
    "message": "Halo, saya tertarik bekerjasama!"
  }
  ```
- **Ketentuan Validasi Body:**
  - `name`: String (Wajib)
  - `email`: String (Wajib)
  - `message`: String (Wajib)
- **Responses:**
  - **201 Created (Berhasil):**
    ```json
    {
      "success": true,
      "message": "Pesan berhasil ditambahkan dan email berhasil diterima",
      "data": {
        "email": "johndoe@example.com",
        "name": "John Doe",
        "message": "Halo, saya tertarik bekerjasama!",
        "date": "02/10/2026 11:00:00"
      }
    }
    ```
  - **400 Bad Request:**
    ```json
    {
      "message": "Email, nama, dan pesan wajib diisi"
    }
    ```
  - **500 Internal Server Error:**
    ```json
    {
      "message": "Terjadi kesalahan server",
      "error": {}
    }
    ```

---

### 2.2. Ambil Semua Pesan (Protected)
- **Endpoint:** `GET /api/message`
- **Deskripsi:** Mengambil semua pesan yang telah masuk di MongoDB. Membutuhkan Bearer Token.
- **Autentikasi:** Wajib. Header `Authorization: Bearer <token>`
- **Request Headers:**
  - `Authorization: Bearer <token>`
- **Responses:**
  - **200 OK (Berhasil):**
    ```json
    {
      "success": true,
      "data": [
        {
          "_id": "65123456789abcdef0123456",
          "name": "John Doe",
          "email": "johndoe@example.com",
          "message": "Halo, saya tertarik bekerjasama!",
          "date": "02/10/2026 11:00:00"
        }
      ]
    }
    ```
  - **401 Unauthorized (Token Tidak Ditemukan):**
    ```json
    {
      "message": "Token tidak ditemukan. Gunakan header: Authorization: Bearer <token>"
    }
    ```
  - **401 Unauthorized (Token Tidak Valid):**
    ```json
    {
      "message": "Token tidak valid atau kadaluarsa"
    }
    ```
  - **500 Internal Server Error:**
    ```json
    {
      "message": "Terjadi kesalahan server",
      "error": {}
    }
    ```

---

## 📋 3. Assignment / Task Endpoints (`/api/asignment`) — Protected

*Koleksi MongoDB:* `task`

> **Semua endpoint dalam grup ini memerlukan header `Authorization: Bearer <token>`**

### Schema Data Assignment (Zod Validated)

| Field | Tipe Data | Aturan Validasi |
| :--- | :--- | :--- |
| `title` | String | Min. 5 karakter |
| `description` | String | Min. 10 karakter |
| `status` | Enum | `"pending" \| "in_progress" \| "completed"` |
| `priority` | Enum | `"high" \| "medium" \| "low"` |
| `deadline` | Tuple [string, string] | Array `["YYYY-MM-DD", "HH:MM"]` |
| `location` | String | Min. 5 karakter |
| `checklist` | Array of Object | Object: `{ "title_checklist": string, "isCompleted": boolean }` |
| `references` | Array of Object | Object: `{ "title_references": string, "url": URL valid }` |

---

### 3.1. Tambah Assignment Baru
- **Endpoint:** `POST /api/asignment`
- **Autentikasi:** `Authorization: Bearer <token>`
- **Validation:** Middleware Zod (`addAsignmentSchema`)
- **Request Body Example:**
  ```json
  {
    "title": "Mengerjakan Backend API Porto",
    "description": "Membuat dokumentasi dan fitur assignment dashboard personal",
    "status": "in_progress",
    "priority": "high",
    "deadline": ["2026-10-05", "23:59"],
    "location": "Jakarta Selatan",
    "checklist": [
      {
        "title_checklist": "Membuat schema Zod",
        "isCompleted": true
      }
    ],
    "references": [
      {
        "title_references": "Dokumentasi Express",
        "url": "https://expressjs.com"
      }
    ]
  }
  ```
- **Responses:**
  - **201 Created (Berhasil):**
    ```json
    {
      "success": true,
      "data": {
        "id_task": "TASK-X8A2B1",
        "title": "Mengerjakan Backend API Porto",
        "description": "Membuat dokumentasi dan fitur assignment dashboard personal",
        "status": "in_progress",
        "priority": "high",
        "deadline": ["2026-10-05", "23:59"],
        "location": "Jakarta Selatan",
        "checklist": [
          {
            "id_checklist": "CHK-X8A2B1",
            "title_checklist": "Membuat schema Zod",
            "isCompleted": true
          }
        ],
        "references": [
          {
            "title_references": "Dokumentasi Express",
            "url": "https://expressjs.com"
          }
        ],
        "createdAt": "02/10/2026 11:00:00",
        "updatedAt": "02/10/2026 11:00:00",
        "completedAt": null
      }
    }
    ```
  - **400 Bad Request (Gagal Validasi Zod):**
    ```json
    {
      "errors": [
        {
          "field": "body.title",
          "message": "Title must be at least 5 characters long"
        }
      ]
    }
    ```
  - **401 Unauthorized:**
    ```json
    {
      "message": "Token tidak ditemukan. Gunakan header: Authorization: Bearer <token>"
    }
    ```
  - **500 Internal Server Error:**
    ```json
    {
      "message": "Terjadi kesalahan server",
      "error": {}
    }
    ```

---

### 3.2. Ambil Semua Assignment
- **Endpoint:** `GET /api/asignment`
- **Autentikasi:** `Authorization: Bearer <token>`
- **Responses:**
  - **200 OK (Berhasil):**
    ```json
    {
      "success": true,
      "data": [
        {
          "_id": "65123456789abcdef0123456",
          "id_task": "TASK-X8A2B1",
          "title": "Mengerjakan Backend API Porto",
          "description": "Membuat dokumentasi dan fitur assignment dashboard personal",
          "status": "in_progress",
          "priority": "high",
          "deadline": ["2026-10-05", "23:59"],
          "location": "Jakarta Selatan",
          "checklist": ["..."],
          "references": ["..."],
          "createdAt": "02/10/2026 11:00:00",
          "updatedAt": "02/10/2026 11:00:00",
          "completedAt": null
        }
      ]
    }
    ```
  - **401 Unauthorized:**
    ```json
    {
      "message": "Token tidak ditemukan. Gunakan header: Authorization: Bearer <token>"
    }
    ```
  - **500 Internal Server Error:**
    ```json
    {
      "message": "Terjadi kesalahan server",
      "error": {}
    }
    ```

---

### 3.3. Ambil Assignment Berdasarkan ID (`id_task`)
- **Endpoint:** `GET /api/asignment/:id_task`
- **Autentikasi:** `Authorization: Bearer <token>`
- **Params:** `id_task` (contoh: `TASK-X8A2B1`)
- **Responses:**
  - **200 OK:**
    ```json
    {
      "success": true,
      "data": {
        "id_task": "TASK-X8A2B1",
        "title": "Mengerjakan Backend API Porto",
        "..."
      }
    }
    ```
  - **401 Unauthorized:**
    ```json
    {
      "message": "Token tidak ditemukan. Gunakan header: Authorization: Bearer <token>"
    }
    ```
  - **404 Not Found:**
    ```json
    {
      "success": false,
      "message": "Asignment tidak ditemukan"
    }
    ```
  - **500 Internal Server Error:**
    ```json
    {
      "message": "Terjadi kesalahan server",
      "error": {}
    }
    ```

---

### 3.4. Update Assignment (`id_task`)
- **Endpoint:** `PUT /api/asignment/:id_task`
- **Autentikasi:** `Authorization: Bearer <token>`
- **Validation:** Middleware Zod (`updateAsignmentSchema`)
- **Params:** `id_task` (contoh: `TASK-X8A2B1`)
- **Request Body:** Bidang yang diperbarui sesuai `updateAsignmentSchema`.
- **Responses:**
  - **200 OK:**
    ```json
    {
      "success": true,
      "data": {
        "acknowledged": true,
        "modifiedCount": 1,
        "upsertedId": null,
        "upsertedCount": 0,
        "matchedCount": 1
      }
    }
    ```
  - **401 Unauthorized:**
    ```json
    {
      "message": "Token tidak ditemukan. Gunakan header: Authorization: Bearer <token>"
    }
    ```
  - **404 Not Found:**
    ```json
    {
      "success": false,
      "message": "Asignment tidak ditemukan"
    }
    ```
  - **500 Internal Server Error:**
    ```json
    {
      "message": "Terjadi kesalahan server",
      "error": {}
    }
    ```

---

### 3.5. Hapus Assignment (`id_task`)
- **Endpoint:** `DELETE /api/asignment/:id_task`
- **Autentikasi:** `Authorization: Bearer <token>`
- **Params:** `id_task` (contoh: `TASK-X8A2B1`)
- **Responses:**
  - **200 OK:**
    ```json
    {
      "success": true,
      "data": {
        "acknowledged": true,
        "deletedCount": 1
      }
    }
    ```
  - **401 Unauthorized:**
    ```json
    {
      "message": "Token tidak ditemukan. Gunakan header: Authorization: Bearer <token>"
    }
    ```
  - **404 Not Found:**
    ```json
    {
      "success": false,
      "message": "Asignment tidak ditemukan"
    }
    ```
  - **500 Internal Server Error:**
    ```json
    {
      "message": "Terjadi kesalahan server",
      "error": {}
    }
    ```

---

## 📅 4. Schedule Endpoints (`/api/schedule`) — Protected

*Koleksi MongoDB:* `schedules`

> **Semua endpoint dalam grup ini memerlukan header `Authorization: Bearer <token>`**

### Schema Data Schedule (Zod Validated)

| Field | Tipe Data | Aturan Validasi |
| :--- | :--- | :--- |
| `title` | String | Min. 5 karakter |
| `description` | String | Min. 10 karakter |
| `date` | String | Wajib diisi |
| `start_time` | String | Wajib diisi |
| `location` | String | Min. 5 karakter |
| `priority` | Enum | `"high" \| "medium" \| "low"` |
| `isRecurring` | Boolean | Wajib diisi (`true` / `false`) |
| `recurrence` | Enum | `"daily" \| "weekly" \| "monthly" \| "none"` |

---

### 4.1. Tambah Jadwal (Schedule) Baru
- **Endpoint:** `POST /api/schedule`
- **Autentikasi:** `Authorization: Bearer <token>`
- **Validation:** Middleware Zod (`addScheduleSchema`)
- **Request Body Example:**
  ```json
  {
    "title": "Meeting Project Review",
    "description": "Membahas progres dashboard dan pengerjaan API",
    "date": "2026-10-10",
    "start_time": "14:00",
    "location": "Google Meet",
    "priority": "high",
    "isRecurring": false,
    "recurrence": "none"
  }
  ```
- **Responses:**
  - **201 Created (Berhasil):**
    ```json
    {
      "success": true,
      "data": {
        "id_schedule": "SCHEDULE-A9F3K2",
        "title": "Meeting Project Review",
        "description": "Membahas progres dashboard dan pengerjaan API",
        "date": "2026-10-10",
        "start_time": "14:00",
        "location": "Google Meet",
        "priority": "high",
        "isRecurring": false,
        "recurrence": "none",
        "createdAt": "02/10/2026 11:00:00",
        "updatedAt": "02/10/2026 11:00:00"
      }
    }
    ```
  - **400 Bad Request (Gagal Validasi Zod):**
    ```json
    {
      "errors": [
        {
          "field": "body.title",
          "message": "Title must be at least 5 characters long"
        }
      ]
    }
    ```
  - **401 Unauthorized:**
    ```json
    {
      "message": "Token tidak ditemukan. Gunakan header: Authorization: Bearer <token>"
    }
    ```
  - **500 Internal Server Error:**
    ```json
    {
      "message": "Terjadi kesalahan server",
      "error": {}
    }
    ```

---

### 4.2. Ambil Semua Jadwal (Schedule)
- **Endpoint:** `GET /api/schedule`
- **Autentikasi:** `Authorization: Bearer <token>`
- **Responses:**
  - **200 OK:**
    ```json
    {
      "success": true,
      "data": [
        {
          "_id": "65123456789abcdef0123456",
          "id_schedule": "SCHEDULE-A9F3K2",
          "title": "Meeting Project Review",
          "description": "Membahas progres dashboard dan pengerjaan API",
          "date": "2026-10-10",
          "start_time": "14:00",
          "location": "Google Meet",
          "priority": "high",
          "isRecurring": false,
          "recurrence": "none",
          "createdAt": "02/10/2026 11:00:00",
          "updatedAt": "02/10/2026 11:00:00"
        }
      ]
    }
    ```
  - **401 Unauthorized:**
    ```json
    {
      "message": "Token tidak ditemukan. Gunakan header: Authorization: Bearer <token>"
    }
    ```
  - **500 Internal Server Error:**
    ```json
    {
      "message": "Terjadi kesalahan server",
      "error": {}
    }
    ```

---

### 4.3. Hapus Jadwal (`id_schedule`)
- **Endpoint:** `DELETE /api/schedule/:id_schedule`
- **Autentikasi:** `Authorization: Bearer <token>`
- **Params:** `id_schedule` (contoh: `SCHEDULE-A9F3K2`)
- **Responses:**
  - **200 OK:**
    ```json
    {
      "success": true,
      "data": {
        "acknowledged": true,
        "deletedCount": 1
      }
    }
    ```
  - **401 Unauthorized:**
    ```json
    {
      "message": "Token tidak ditemukan. Gunakan header: Authorization: Bearer <token>"
    }
    ```
  - **404 Not Found:**
    ```json
    {
      "success": false,
      "message": "Schedule tidak ditemukan"
    }
    ```
  - **500 Internal Server Error:**
    ```json
    {
      "message": "Terjadi kesalahan server",
      "error": {}
    }
    ```

---

## 🛠️ 5. Health Check Endpoint

- **Endpoint:** `GET /`
- **Deskripsi:** Cek status ketersediaan server API.
- **Autentikasi:** Tidak diperlukan (Public)
- **Responses:**
  - **200 OK:**
    ```json
    {
      "message": "Server API Porto berhasil jalan!"
    }
    ```

---

## 🔒 6. Middleware & Autentikasi

### `authMiddleware` (Bearer Token)
Memverifikasi JWT token dari header `Authorization: Bearer <token>`. Jika valid, payload (`id_user`, `name`) di-inject ke `req.user`.

**Digunakan pada:**
- `GET /api/auth/me`
- `GET /api/message` dan `GET /message`
- Semua endpoint `/api/asignment/*`
- Semua endpoint `/api/schedule/*`

| Kondisi | Status | Pesan |
| :--- | :--- | :--- |
| Header `Authorization` tidak ada atau format salah | `401` | `"Token tidak ditemukan. Gunakan header: Authorization: Bearer <token>"` |
| Token tidak valid / kadaluarsa | `401` | `"Token tidak valid atau kadaluarsa"` |

### Contoh Penggunaan di Client

```javascript
// Setelah login, simpan token
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'n_apipppp', password: 'Testing1#' })
});
const { token } = await response.json();
localStorage.setItem('token', token);

// Gunakan token untuk request ke endpoint protected
const data = await fetch('/api/asignment', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});
```

---

## 🔄 7. Origin Check Middleware

Memeriksa header `Origin` pada request `POST`, `PUT`, `PATCH`, `DELETE` terhadap daftar origin yang diizinkan.

### Allowed Origins:
- `https://dashboard.appsporto.my.id`
- `https://appsporto.my.id`
- `http://localhost:3000`
- `http://localhost:5173`
- `http://localhost:5174`
- `http://127.0.0.1:3000`
- `http://127.0.0.1:5173`
- `http://127.0.0.1:5174`
- Semua origin `localhost` / `127.0.0.1` dengan port apapun (regex match)
