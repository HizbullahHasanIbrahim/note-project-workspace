<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

# AGENTS.md — Engineering & Design Rules (`note-project-workspace`)

## 1. Sumber Kebenaran Proyek (Single Source of Truth)
Sebelum membuat atau mengubah file apa pun, wajib merujuk pada dua dokumen utama di root proyek:
- `PRD.md`: Spesifikasi fitur MVP (5 fitur wajib), alur pengguna, skema tabel MySQL, matriks RBAC, dan mitigasi *edge case*/keamanan.
- `SDD.md`: Token warna Material You (M3), skala tipografi, tata letak adaptif 3-pane, dan aturan interaksi komponen.

## 2. Tech Stack & Lingkungan Lokal
- **Framework:** Next.js (App Router) + TypeScript (`src/` directory, alias `@/*`).
- **Styling & UI:** Tailwind CSS v4 (`@import "tailwindcss";` + `@theme inline`), komponen dasar `shadcn/ui`, ikon `lucide-react`.
- **Editor & Real-Time:** `@blocknote/core`, `@blocknote/react`, `@blocknote/mantine`, `yjs`, `@hocuspocus/provider`, `@hocuspocus/server`.
- **Database:** MySQL/MariaDB lokal via XAMPP (`127.0.0.1:3306`, database `note_project_workspace`) menggunakan `drizzle-orm` + `mysql2` + `drizzle-kit`. Wajib gunakan host `127.0.0.1` (bukan `localhost`) agar koneksi menggunakan TCP dan tidak mencari socket Linux.
- **Interaksi:** `@dnd-kit/core` + `@dnd-kit/sortable` untuk Kanban & sidebar, `cmdk` untuk *Quick Command* (`Cmd+K`).
- **Larangan Library:** Dilarang menginstal atau menggunakan `gsap` maupun `lenis` di dalam rute `/workspace/*` karena mengganggu *auto-scroll* `@dnd-kit` dan posisi kursor BlockNote.

## 3. Aturan Ketat UI/UX Material You (M3)
- **Token Warna Semantik:** Dilarang keras menulis kode warna hex mentah (`#...`) di dalam komponen `.tsx`. Wajib gunakan kelas utilitas token M3 dari `src/app/globals.css` (`bg-surface`, `bg-surface-lowest`, `bg-surface-low`, `bg-surface-container`, `bg-surface-high`, `bg-primary`, `bg-secondary-container`, `text-on-surface`, dll.).
- **Tonal Elevation:** Gunakan perbedaan tingkat permukaan tonal (`surface-container-*`) alih-alih menumpuk `box-shadow` berat pada kartu.
- **Geometri Shape:**
  - `rounded-full` untuk indikator item aktif *sidebar*, tombol CTA utama, *status badges*, dan *Segmented Button*.
  - `rounded-[28px]` untuk dialog modal dan *Task Side-Peek*.
  - `rounded-2xl` untuk kolom Kanban dan kartu tugas.
  - `rounded-xl` untuk input formulir, blok kode, dan *dropdown*.
- **Tipografi:** Gunakan `Plus Jakarta Sans` (judul & label), `Inter` (teks paragraf & editor), dan `JetBrains Mono` (blok kode & shortcut). Jangan gunakan label `ALL-CAPS` di atas judul; gunakan *Sentence case*.
- **Aksesibilitas:** Target sentuh minimal `44×44px`, wajib menyediakan `aria-label` pada tombol ikon tunggal, fokus ring terlihat jelas (`focus-visible:ring-2 focus-visible:ring-outline`), dan hormati `prefers-reduced-motion`.

## 4. Aturan Keamanan, Database & Edge Cases (Wajib Diterapkan)
- **Primary Key:** Seluruh tabel menggunakan `CHAR(36)` (UUID v4) yang di-generate secara eksplisit.
- **Isolasi Ruang Kerja & Privasi (Anti-IDOR):** Setiap API, Server Action, kueri `Cmd+K`, dan koneksi WebSocket wajib memverifikasi keanggotaan `workspace_id` serta memastikan halaman dengan `space_type = 'private'` hanya dapat diakses oleh `created_by == current_user_id`.
- **RBAC 3 Peran:** Terapkan matriks `admin`, `member`, dan `viewer` dari `PRD.md` §3.4 di sisi server maupun UI (`viewer` bersifat *read-only*).
- **Race Condition Kuota 20 Anggota:** Penerimaan undangan wajib menggunakan transaksi database dengan row-level lock (`SELECT ... FOR UPDATE` pada baris `workspaces`).
- **Fractional Indexing:** Urutan kartu Kanban dan pohon halaman bersarang menggunakan kolom `DOUBLE` (`position_order`). Kedalaman *nested pages* dibatasi maksimal **5 tingkat**.
- **Komentar Orphaned:** Penghapusan blok pada editor tidak boleh menghapus baris di tabel `comments`; set `is_block_deleted = true`.
- **Komentar Kode:** Tambahkan komentar berbahasa Indonesia yang ringkas dan jelas pada logika kompleks (transaksi RBAC, sinkronisasi CRDT, dan kalkulasi *fractional index*).

## 5. Protokol Kerja Agent
- Kerjakan tugas secara bertahap per fase. Sebelum menulis kode pada setiap fase, tampilkan rencana file yang akan dibuat/diubah terlebih dahulu.
- Setelah menulis kode, jalankan verifikasi (`npx tsc --noEmit` atau `npx drizzle-kit push`) untuk memastikan tidak ada *type error* atau *schema error* sebelum melanjutkan ke langkah berikutnya.

<!-- END:nextjs-agent-rules -->
