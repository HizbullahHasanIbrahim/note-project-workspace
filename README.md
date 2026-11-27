# Note & Project Workspace (`note-project-workspace`)

Ruang kerja kolaboratif *real-time* berbasis **Material You (M3)** yang menyatukan editor dokumen berbasis blok (**BlockNote + Yjs CRDT**) dan pelacakan tugas relasional (**Kanban, Table, Calendar**) dalam satu aplikasi ringan untuk tim kecil (2–20 anggota).

---

## Arsitektur Ringkas Proyek

1. **Next.js App Router (`src/app/` & `src/components/`):**
   - Antarmuka adaptif 3-pane (*NavDrawer*, *Main Canvas*, *Supporting Pane*) dengan responsivitas **Tablet Navigation Rail (`w-20`)** dan **Mobile Bottom Navigation Bar (`h-20`)** menggunakan token warna semantik Material You (`src/app/globals.css`).
   - *Server Actions* dan *Route Handlers* terproteksi RBAC 3 peran (`admin`, `member`, `viewer`) serta isolasi **Private Space** (*Anti-IDOR*).
   - Unggahan lampiran aman (batas **10 MB/file**, kuota **1 GB/workspace** terkunci dengan transaksi `SELECT ... FOR UPDATE`, validasi *magic bytes* pada buffer, serta penyajian dengan header `X-Content-Type-Options: nosniff`).
2. **Real-Time CRDT WebSocket Server (`server/collab.ts`):**
   - Menggunakan `@hocuspocus/server` + `yjs` pada port `1234` dengan otorisasi *handshake* token sesi & pengecekan peran *read-only* untuk `viewer`.
   - Menerapkan *debounce* 2 detik (`onStoreDocument`) untuk menyimpan state biner ke `pages.crdt_state` (`LONGBLOB`), memproyeksikan teks blok ke `page_blocks` (untuk `Cmd+K`), memperbarui `page_relations` (*backlinks*), menandai komentar *orphaned* (`is_block_deleted = true`), serta menyimpan snapshot ke `page_versions` (interval 10 menit dan saat klien terakhir *disconnect*).
3. **Database Relasional MySQL/MariaDB (`src/db/schema.ts`):**
   - 12 tabel yang dikelola dengan `drizzle-orm` + `mysql2` (`users`, `workspaces`, `workspace_invites`, `workspace_members`, `pages`, `page_blocks`, `tasks`, `page_relations`, `comments`, `comment_mentions`, `attachments`, `page_versions`).

---

## Variabel Lingkungan (`.env`)

Buat file `.env` di root proyek dengan konfigurasi berikut (gunakan `127.0.0.1` untuk MySQL/MariaDB lokal agar koneksi TCP berjalan stabil):

```env
# Koneksi MySQL / MariaDB lokal (XAMPP port 3306)
DATABASE_URL="mysql://root:@127.0.0.1:3306/note_project_workspace"

# Kunci HMAC-SHA256 untuk cookie sesi & token otorisasi WebSocket kolaboratif
SESSION_SECRET="ganti_dengan_kunci_rahasia_minimal_32_karakter"

# Port server WebSocket Hocuspocus (default: 1234, rentang valid: 1-65535)
COLLAB_PORT="1234"

# URL WebSocket yang diakses oleh klien BlockNote di browser
NEXT_PUBLIC_COLLAB_WS_URL="ws://localhost:1234"
```

---

## Panduan Menjalankan Secara Lokal

### 1. Prasyarat & Instalasi
- **Node.js 20+**
- **MySQL / MariaDB** (mis. via XAMPP) berjalan di `127.0.0.1:3306` dengan database kosong bernama `note_project_workspace`.

```bash
npm install
npx drizzle-kit push
```

### 2. Menjalankan Dua Server Secara Bersamaan
Aplikasi membutuhkan **server Web Next.js** dan **server WebSocket Hocuspocus** aktif bersama. Jalankan di dua terminal terpisah:

- **Terminal 1 — Aplikasi Web Next.js (`http://localhost:3000`):**
  ```bash
  npm run dev
  ```

- **Terminal 2 — Server Kolaborasi Real-Time Yjs/Hocuspocus (`ws://localhost:1234`):**
  ```bash
  npm run dev:collab
  ```

### 3. Verifikasi TypeScript & Build Produksi
```bash
npx tsc --noEmit
npm run build
```
