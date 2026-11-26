# Product Requirements Document (PRD): All-in-One Note & Project Management Workspace (MVP v1.0)

| Atribut Dokumen | Detail |
| :--- | :--- |
| **Versi Dokumen** | 1.0 (Final — Post-Critical Review) |
| **Status** | Siap Masuk Tahap Engineering & UI/UX Design |
| **Target Rilis MVP** | 6–8 Minggu (Lean & Fast Release) |
| **Target Segmen** | Tim Kecil & Startup (2–20 Anggota) |
| **Model Akses** | 100% Gratis / Open Access MVP (Tanpa Payment Gateway) |
| **Platform** | Web-First Responsive (Desktop & Mobile Browser) |

---

## 1. Ringkasan Eksekutif & Tujuan Produk

### 1.1 Latar Belakang & Masalah
Tim kecil dan startup (2–20 orang) sering mengalami fragmentasi informasi karena memisahkan dokumentasi kerja (Google Docs/Notion) dengan pelacakan tugas (Trello/Jira). Akibatnya, konteks keputusan dari *meeting notes* atau spesifikasi teknis terputus dari kartu tugas (*task*), memperlambat eksekusi sprint, dan menyulitkan pencarian informasi historis.

### 1.2 Visi & Positioning Produk
Membangun **All-in-One Collaborative Workspace** berbasis web yang menyatukan *real-time collaborative block editor* dan *relational task database* dalam satu ruang kerja ringan, cepat, dan bebas hambatan biaya pada tahap awal.

### 1.3 Indikator Keberhasilan (KPI MVP)
- **Adopsi Awal:** Mendapatkan 10–20 tim *early adopter* aktif dalam 30 hari pertama pasca-rilis.
- **Aktivasi Tim (14 Hari Pertama):** Minimal 60% tim yang mendaftar berhasil membuat minimal 5 halaman dokumen dan menyelesaikan minimal 1 siklus *task/sprint* (dari *To Do* hingga *Done*).
- **Performa Real-Time:** Latensi sinkronisasi antar-klien pada *block editor* dan *Kanban board* terjaga di angka `< 200 ms`.

### 1.4 Batasan Sistem (Hard Guardrails)
- Maksimal **20 anggota** per workspace.
- Maksimal ukuran unggahan **10 MB per file** dengan total kuota **1 GB** per workspace.
- Kedalaman hierarki halaman bersarang (*nested pages*) dibatasi maksimal **5 tingkat** untuk menjaga performa *rendering* pohon navigasi dan kueri rekursif.

---

## 2. Profil Pengguna Utama (User Personas)

### 2.1 Persona 1: Raka Pratama — Product & Operations Lead (Admin)
- **Profil:** 27 tahun, Co-Founder & Product Lead di startup beranggotakan 12 orang. Bekerja dominan di browser desktop dan sesekali memantau progres lewat browser mobile.
- **Kebutuhan Utama:** Menyusun Project Brief, SOP, dan membagi tugas sprint dalam satu platform yang terhubung langsung antara dokumen diskusi dan papan eksekusi.
- **Pain Points:** Konteks pekerjaan tercecer di banyak aplikasi; anggota tim sering mengeksekusi tugas tanpa memahami latar belakang keputusan rapat.

### 2.2 Persona 2: Nadia Kusuma — Software Engineer (Member)
- **Profil:** 24 tahun, Full-Stack Engineer. Terbiasa bekerja cepat dengan pintasan keyboard, sering membuat catatan draf pribadi sebelum dipublikasikan ke tim.
- **Kebutuhan Utama:** Mencari dokumen teknis dalam hitungan detik, menyunting notulensi rapat bersama tim secara *real-time* tanpa konflik, dan memperbarui status tugas tanpa birokrasi rumit.
- **Pain Points:** Kesulitan menemukan spesifikasi lama saat proyek membesar dan lambatnya sinkronisasi saat mengedit dokumen bersamaan.

---

## 3. Ruang Lingkup Fitur & Prioritas MVP

### 3.1 Kelompok 1: Wajib (Must-Have — Target Minggu 1–6)
1. **Autentikasi & Struktur Workspace Dasar:** Registrasi/login (Email/Password & Google OAuth), pemisahan *Shared Teamspace* dan *Private Space*, sistem undangan tautan/email (maks. 20 anggota), serta 3 peran (*Admin*, *Member*, *Viewer/Guest*).
2. **Real-Time Collaborative Block Editor & Nested Pages (CRDT):** Editor berbasis blok (teks, heading, checklist, code block, tabel sederhana) dengan *live cursor* (`< 200 ms`) dan hierarki halaman bersarang hingga 5 tingkat.
3. **Relational Task Database & Multi-View:** Database tugas dengan properti standar (*Assignee*, *Status*, *Priority*, *Due Date*), relasi dua arah antara kartu tugas dan halaman dokumen, serta tampilan *Table*, *Kanban*, dan *Calendar*.
4. **Kolaborasi Kontekstual (`@mention`, Inline Comments & Backlinks):** Utas komentar yang terikat pada blok spesifik, notifikasi `@mention` di dalam aplikasi, serta panel otomatis *Backlinks* antar-halaman.
5. **Quick Command (`Cmd+K`) & Team Starter Templates:** Pencarian *full-text* lintas halaman dan tugas via `Cmd+K` (`Ctrl+K`), dilengkapi 4 template bawaan (*Project Brief*, *Sprint Tracker*, *Meeting Notes*, *SOP/Wiki*).

### 3.2 Kelompok 2: Bagus Kalau Ada (Nice-to-Have — Target Minggu 7–8)
- **Basic Image & File Upload:** Unggah gambar (PNG/JPG/WEBP/GIF) dan dokumen (PDF/DOCX) hingga 10 MB/file dengan pelacakan kuota 1 GB per workspace.
- **Activity & Version History:** Log riwayat perubahan halaman dan pemulihan versi dasar.
- **Mobile Web Responsive Polish:** Penyempurnaan interaksi layar sentuh untuk membaca catatan dan mengubah status *task* di browser mobile.
- **Admin Quota Dashboard:** Indikator visual pemakaian anggota (dari 20) dan penyimpanan (dari 1 GB).

### 3.3 Kelompok 3: Nanti Dulu (Won't-Have — Out-of-Scope MVP)
- Fitur AI (AI Writing Assistant, Auto-Summary, AI Task Generator).
- Otomasi workflow & integrasi pihak ketiga (Slack, GitHub, Webhook, Recurring Tasks).
- Public API serta fitur Import/Export dokumen lanjutan (Markdown/CSV/PDF).
- Aplikasi native desktop/mobile (Electron/Tauri/React Native) dan mode *offline-first* jangka panjang.
- Sistem billing, payment gateway, dan pengaturan izin granular per halaman.

### 3.4 Matriks Hak Akses (RBAC Permission Matrix)

| Aksi / Kapabilitas | Admin | Member | Viewer / Guest |
| :--- | :---: | :---: | :---: |
| Mengelola pengaturan workspace & batas kuota | Ya | Tidak | Tidak |
| Mengundang, mengubah peran, & menghapus anggota | Ya | Tidak | Tidak |
| Membuat, mengedit, & mengarsipkan halaman di Shared Teamspace | Ya | Ya | Tidak (Read-Only) |
| Memiliki & mengelola Private Space pribadi | Ya | Ya | Tidak |
| Membuat, mengedit, & menggeser kartu pada Task Database | Ya | Ya | Tidak (Read-Only) |
| Menulis komentar inline & melakukan `@mention` | Ya | Ya | Tidak |
| Mengunggah lampiran file/gambar (hingga batas kuota) | Ya | Ya | Tidak |
| Menggunakan pencarian `Cmd+K` pada Shared Teamspace | Ya | Ya | Ya |

---

## 4. User Stories & Kriteria Penerimaan

### 4.1 Admin (Product & Operations Lead)
- **US-01 (Onboarding & Workspace):** Sebagai Admin, saya ingin mendaftar lewat Google OAuth atau email dan membuat *Shared Teamspace* (maks. 20 anggota), supaya tim bisa langsung berkolaborasi tanpa hambatan biaya.
  - *Kriteria Penerimaan:* Sistem otomatis membuat *Shared Teamspace* dan *Private Space* pribadi saat workspace terbentuk; anggota ke-21 ditolak dengan pesan batas kuota tercapai.
- **US-02 (Manajemen Peran):** Sebagai Admin, saya ingin menetapkan peran Admin, Member, atau Viewer/Guest, supaya pihak eksternal hanya bisa memantau progres tanpa mengubah isi dokumen.
  - *Kriteria Penerimaan:* Viewer tidak melihat kontrol edit/drag-and-drop di UI dan ditolak (`403 Forbidden`) jika mencoba memodifikasi data via API/WebSocket; Admin tunggal tidak dapat menurunkan perannya sendiri sebelum menunjuk Admin pengganti.
- **US-03 (Starter Templates):** Sebagai Admin, saya ingin membuat halaman dari template bawaan (*Project Brief*, *Sprint Tracker*, *Meeting Notes*, *SOP/Wiki*), supaya tim tidak memulai dari halaman kosong.
  - *Kriteria Penerimaan:* Memilih template langsung menyalin struktur blok/database standar ke halaman baru dalam waktu `< 1 detik`.
- **US-04 (Relational Task & Notes):** Sebagai Admin, saya ingin menautkan halaman *Meeting Notes* secara relasional ke kartu tugas (*Assignee*, *Status*, *Priority*, *Due Date*), supaya setiap tugas memiliki konteks keputusan yang jelas.
  - *Kriteria Penerimaan:* Tautan muncul di properti kartu tugas sekaligus tampil otomatis di panel *Backlinks* halaman *Meeting Notes* terkait.
- **US-05 (Multi-View Project):** Sebagai Admin, saya ingin melihat database tugas yang sama dalam tampilan *Table*, *Kanban*, dan *Calendar*, supaya saya dapat memantau alur sprint harian maupun jadwal tenggat waktu.
  - *Kriteria Penerimaan:* Perubahan status di Kanban langsung memperbarui baris di Table, dan perubahan *Due Date* langsung memindahkan posisi kartu di Calendar secara *real-time*.

### 4.2 Member (Software Engineer / Eksekutor)
- **US-06 (Private Space):** Sebagai Member, saya ingin memiliki *Private Space* yang terisolasi dari anggota lain, supaya saya bebas menulis draf catatan pribadi sebelum memindahkannya ke Teamspace.
  - *Kriteria Penerimaan:* Halaman di *Private Space* tidak muncul di sidebar maupun hasil pencarian `Cmd+K` anggota lain (termasuk Admin).
- **US-07 (Real-Time Block Editor):** Sebagai Member, saya ingin menyunting blok (teks, heading, checklist, code block, tabel) bersama rekan tim dengan *live cursor*, supaya notulensi dan spesifikasi tersusun tanpa konflik.
  - *Kriteria Penerimaan:* Ketikan dari dua pengguna atau lebih muncul di layar klien lain dalam `< 200 ms` tanpa saling menimpa teks.
- **US-08 (Nested Pages & Backlinks):** Sebagai Member, saya ingin menyusun halaman bersarang (*nested pages*) dan menautkan halaman terkait via *backlink*, supaya dokumentasi proyek terstruktur rapi.
  - *Kriteria Penerimaan:* Pengguna dapat membuat sub-halaman hingga 5 tingkat dan memanggil tautan halaman lain menggunakan pemicu `[[` atau `@`.
- **US-09 (Inline Comments & Mentions):** Sebagai Member, saya ingin mengomentari blok teks tertentu dan menyebut rekan tim (`@mention`), supaya diskusi revisi tepat sasaran.
  - *Kriteria Penerimaan:* Komentar terikat pada `block_id`; jika blok tersebut dihapus di kemudian hari, komentar tetap tampil di panel kanan dengan penanda *"Blok referensi telah dihapus"*.
- **US-10 (Quick Command Search):** Sebagai Member, saya ingin menekan `Cmd+K` (`Ctrl+K`) untuk mencari judul dan isi teks di seluruh halaman dan tugas, supaya saya menemukan informasi dalam hitungan detik.
  - *Kriteria Penerimaan:* Hasil pencarian *full-text* muncul dalam `< 300 ms` setelah pengguna berhenti mengetik dan hanya menampilkan halaman yang sesuai hak aksesnya.
- **US-11 (File & Image Attachment):** Sebagai Member, saya ingin mengunggah gambar atau dokumen PDF/DOCX (maks. 10 MB) ke halaman atau kartu tugas, supaya bukti visual tersimpan menyatu dengan konteks kerja.
  - *Kriteria Penerimaan:* Sistem memvalidasi tipe file dan sisa kuota 1 GB secara atomik sebelum menyimpan file.

---

## 5. Alur Pengguna (End-to-End User Flows)

### 5.1 Alur Aktivasi Tim & Penyelesaian Sprint
1. **Autentikasi:** Pengguna membuka `/` -> memilih `/login` atau `/register` (Email/Password atau Google OAuth).
2. **Onboarding:** Pengguna membuat Workspace baru -> sistem membentuk *Shared Teamspace* dan *Private Space* -> pengguna membagikan tautan undangan (`/invite/:token`) ke anggota tim.
3. **Inisiasi Dokumen:** Anggota membuka *Shared Teamspace* -> membuat halaman baru -> memilih Starter Template *Project Brief* atau *Meeting Notes*.
4. **Kolaborasi Real-Time:** Beberapa anggota masuk ke halaman yang sama -> menulis poin spesifikasi secara bersamaan dengan *live cursor* -> berdiskusi lewat komentar inline dan `@mention`.
5. **Pembuatan & Relasi Tugas:** Tim membuka atau membuat Task Database -> menambahkan kartu tugas, mengisi *Assignee*, *Priority*, *Due Date*, dan menautkan halaman *Meeting Notes* ke properti relasi tugas.
6. **Eksekusi Sprint:** Tim memantau dan menggeser kartu tugas di tampilan Kanban (`To Do` -> `In Progress` -> `Review` -> `Done`) hingga seluruh target sprint selesai.

### 5.2 Alur Harian & Perpindahan Ruang (Edge Case Flow)
1. **Pencarian Instan:** Pengguna menekan `Cmd+K` -> mengetik kata kunci -> memilih hasil halaman/tugas -> menelusuri relasi lewat panel *Backlinks*.
2. **Publikasi Draf Pribadi:** Member memindahkan halaman dari *Private Space* ke *Shared Teamspace* -> halaman langsung terbuka untuk seluruh anggota tim dan terindeks pada pencarian `Cmd+K` tim. *(Sebaliknya, jika halaman tim dipindahkan kembali ke Private Space oleh pembuatnya, tautan backlink di halaman tim lain otomatis berubah menjadi label `[Halaman Privat]` tanpa membocorkan judul/isi).*

---

## 6. Daftar Halaman & Struktur Antarmuka

| Rute / Halaman | Komponen & Struktur Konten Utama |
| :--- | :--- |
| `/` (Landing Page) | Hero section proposisi nilai, pratinjau interaktif block editor & Kanban, ringkasan fitur tim kecil, dan tombol CTA (*Mulai Gratis* / *Masuk*). |
| `/login` & `/register` | Form email/password, tombol satu klik Google OAuth, dan validasi kesalahan autentikasi. |
| `/invite/:token` | Validasi token undangan, info nama workspace & pengundang, serta tombol konfirmasi bergabung (dengan pengecekan sisa kuota 20 anggota). |
| `/onboarding` | Form nama & ikon workspace, pemilihan Starter Template pertama, dan *copy invite link*. |
| `/workspace/:id/*` (App Shell) | **Left Sidebar:** Pengalih workspace, tombol pencarian `Cmd+K`, pohon hierarki *Shared Teamspace* dan *Private Space* (maks. 5 tingkat), tombol `+ New Page`, dan menu Settings.<br>**Topbar:** Breadcrumb halaman, indikator avatar pengguna aktif (*live presence*), dan tombol buka/tutup panel kanan. |
| `/workspace/:id/page/:pageId` | **Header:** Ikon, judul halaman, info pembuat & waktu edit terakhir.<br>**Editor Canvas:** Template picker (jika kosong), slash menu (`/`), dan blok (paragraph, heading, checklist, code block, simple table, attachment).<br>**Right Drawer:** Tab *Comments* (utas komentar per blok), Tab *Backlinks & Linked Tasks*, dan Tab *Version History*. |
| `/workspace/:id/database/:dbId` | **View Switcher:** Tab *Table*, *Kanban Board* (drag-and-drop per status), dan *Calendar* (berdasarkan Due Date).<br>**Toolbar:** Filter (Assignee, Status, Priority), urutkan (Sort), dan tombol `+ New Task`. |
| `Task Side-Peek Modal` | Judul tugas, properti (Assignee, Status, Priority, Due Date), properti relasi *Linked Pages*, kanvas block editor deskripsi tugas, dan kolom komentar. |
| `Quick Command (Cmd+K)` | Overlay pencarian *full-text* instan yang dikelompokkan ke kategori *Pages* dan *Tasks*, serta aksi cepat (*Buat Halaman Baru*). |
| `/workspace/:id/settings` | **General:** Ubah nama/ikon workspace.<br>**Members:** Kelola daftar anggota (maks. 20), ubah peran (Admin/Member/Viewer), buat/cabut tautan undangan.<br>**Storage:** Visualisasi kuota terpakai dari batas 1 GB. |

---

## 7. Arsitektur Sinkronisasi & Rancangan Database (MySQL)

### 7.1 Arsitektur Dual-State (CRDT + Relational Projection)
- **Real-Time Source of Truth:** Penyuntingan teks dan struktur blok menggunakan **Yjs (CRDT)** melalui koneksi WebSocket yang menyimpan state biner terkompresi di kolom `pages.crdt_state`.
- **Asynchronous Search & Comment Projection:** Worker di backend menerapkan *debounce* (2 detik setelah aktivitas ketik berhenti) untuk memproyeksikan blok terbaru ke tabel `page_blocks`. Tabel ini melayani indeks `FULLTEXT` untuk `Cmd+K` dan menjaga integritas referensi `block_id` bagi komentar inline.
- **Task Item Unification:** Setiap item tugas (`tasks`) memiliki `detail_page_id` yang merujuk ke baris pada tabel `pages` dengan `page_type = 'task_item'`, sehingga kartu tugas otomatis mendukung *block editor*, komentar, dan *backlink*.

### 7.2 Skema Tabel MySQL

#### 1. `users`
| Kolom | Tipe Data | Constraint | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | `CHAR(36)` | `PRIMARY KEY` | UUID pengguna |
| `email` | `VARCHAR(255)` | `UNIQUE, NOT NULL` | Alamat email terdaftar |
| `password_hash` | `VARCHAR(255)` | `NULL` | Hash password (`NULL` jika Google OAuth) |
| `full_name` | `VARCHAR(120)` | `NOT NULL` | Nama tampilan pengguna |
| `avatar_url` | `TEXT` | `NULL` | URL foto profil |
| `auth_provider` | `ENUM('email', 'google')` | `NOT NULL` | Metode registrasi |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Waktu akun dibuat |

#### 2. `workspaces` & `workspace_invites`
| Tabel & Kolom | Tipe Data | Constraint | Keterangan |
| :--- | :--- | :--- | :--- |
| `workspaces.id` | `CHAR(36)` | `PRIMARY KEY` | UUID workspace |
| `workspaces.name` | `VARCHAR(120)` | `NOT NULL` | Nama workspace |
| `workspaces.owner_id` | `CHAR(36)` | `FOREIGN KEY -> users(id)` | Admin pemilik utama |
| `workspaces.max_members` | `INT` | `DEFAULT 20` | Batas keras anggota MVP |
| `workspaces.storage_limit_bytes` | `BIGINT` | `DEFAULT 1073741824` | Kuota penyimpanan 1 GB |
| `workspaces.storage_used_bytes` | `BIGINT` | `DEFAULT 0` | Total penyimpanan terpakai |
| `workspace_invites.id` | `CHAR(36)` | `PRIMARY KEY` | UUID undangan |
| `workspace_invites.workspace_id` | `CHAR(36)` | `FOREIGN KEY -> workspaces(id)` | Target workspace |
| `workspace_invites.token_hash` | `CHAR(64)` | `UNIQUE, NOT NULL` | SHA-256 hash dari token undangan |
| `workspace_invites.default_role` | `ENUM('member', 'viewer')` | `DEFAULT 'member'` | Peran saat bergabung |
| `workspace_invites.expires_at` | `TIMESTAMP` | `NOT NULL` | Masa berlaku tautan (7 hari) |
| `workspace_invites.is_revoked` | `BOOLEAN` | `DEFAULT FALSE` | Status pencabutan oleh Admin |

#### 3. `workspace_members`
| Kolom | Tipe Data | Constraint | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | `CHAR(36)` | `PRIMARY KEY` | UUID keanggotaan |
| `workspace_id` | `CHAR(36)` | `FOREIGN KEY -> workspaces(id)` | Referensi workspace |
| `user_id` | `CHAR(36)` | `FOREIGN KEY -> users(id)` | Referensi pengguna (`UNIQUE(workspace_id, user_id)`) |
| `role` | `ENUM('admin', 'member', 'viewer')` | `NOT NULL` | Peran RBAC |
| `joined_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Waktu bergabung |

#### 4. `pages`
| Kolom | Tipe Data | Constraint | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | `CHAR(36)` | `PRIMARY KEY` | UUID halaman |
| `workspace_id` | `CHAR(36)` | `FOREIGN KEY -> workspaces(id)` | Pemilik workspace |
| `parent_page_id` | `CHAR(36)` | `FOREIGN KEY -> pages(id), NULL` | Hierarki nested pages (maks. 5 tingkat) |
| `created_by` | `CHAR(36)` | `FOREIGN KEY -> users(id)` | Pembuat (penentu akses Private Space) |
| `space_type` | `ENUM('teamspace', 'private')` | `NOT NULL` | Pemisah ruang tim dan ruang pribadi |
| `page_type` | `ENUM('document', 'database', 'task_item')` | `NOT NULL` | Tipe entitas halaman |
| `title` | `VARCHAR(255)` | `NOT NULL` | Judul halaman (`FULLTEXT INDEX`) |
| `icon` | `VARCHAR(50)` | `NULL` | Emoji/ikon halaman |
| `crdt_state` | `LONGBLOB` | `NULL` | State biner Yjs CRDT |
| `position_order` | `DOUBLE` | `DEFAULT 1000.0` | Fractional index urutan di sidebar |
| `is_archived` | `BOOLEAN` | `DEFAULT FALSE` | Status soft-delete / arsip |
| `updated_at` | `TIMESTAMP` | `ON UPDATE CURRENT_TIMESTAMP` | Waktu pembaruan terakhir |

#### 5. `page_blocks`
| Kolom | Tipe Data | Constraint | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | `CHAR(36)` | `PRIMARY KEY` | UUID blok (sinkron dengan Yjs block ID) |
| `page_id` | `CHAR(36)` | `FOREIGN KEY -> pages(id)` | Halaman induk |
| `block_type` | `ENUM('paragraph', 'heading', 'checklist', 'code', 'table')` | `NOT NULL` | Jenis blok konten |
| `content_text` | `TEXT` | `FULLTEXT INDEX` | Teks terindeks untuk pencarian `Cmd+K` |
| `properties_json` | `JSON` | `NULL` | Metadata (status checklist, bahasa code block) |
| `position_order` | `DOUBLE` | `DEFAULT 1000.0` | Fractional index posisi blok |

#### 6. `tasks`
| Kolom | Tipe Data | Constraint | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | `CHAR(36)` | `PRIMARY KEY` | UUID tugas |
| `database_page_id` | `CHAR(36)` | `FOREIGN KEY -> pages(id)` | Halaman induk bertipe `database` |
| `detail_page_id` | `CHAR(36)` | `UNIQUE, FOREIGN KEY -> pages(id)` | Halaman detail bertipe `task_item` |
| `title` | `VARCHAR(255)` | `NOT NULL` | Judul kartu tugas |
| `status` | `ENUM('todo', 'in_progress', 'review', 'done')` | `DEFAULT 'todo'` | Status kolom Kanban |
| `priority` | `ENUM('low', 'medium', 'high', 'urgent')` | `DEFAULT 'medium'` | Prioritas tugas |
| `assignee_id` | `CHAR(36)` | `FOREIGN KEY -> users(id), NULL` | Penanggung jawab tugas |
| `due_date` | `DATE` | `NULL` | Tenggat waktu untuk tampilan Calendar |
| `position_order` | `DOUBLE` | `DEFAULT 1000.0` | Fractional index urutan kartu Kanban |

#### 7. `page_relations`
| Kolom | Tipe Data | Constraint | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | `CHAR(36)` | `PRIMARY KEY` | UUID relasi |
| `source_page_id` | `CHAR(36)` | `FOREIGN KEY -> pages(id)` | Halaman sumber yang menautkan |
| `target_page_id` | `CHAR(36)` | `FOREIGN KEY -> pages(id)` | Halaman tujuan (sumber daftar Backlinks) |
| `relation_type` | `ENUM('backlink', 'task_note_link')` | `NOT NULL` | Tautan teks atau relasi properti tugas |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Waktu penautan |

#### 8. `comments` & `comment_mentions`
| Tabel & Kolom | Tipe Data | Constraint | Keterangan |
| :--- | :--- | :--- | :--- |
| `comments.id` | `CHAR(36)` | `PRIMARY KEY` | UUID komentar |
| `comments.page_id` | `CHAR(36)` | `FOREIGN KEY -> pages(id)` | Halaman lokasi komentar |
| `comments.block_id` | `CHAR(36)` | `NULL` | Referensi lunak ke blok (tanpa `CASCADE DELETE` agar komentar *orphaned* tetap terbaca) |
| `comments.is_block_deleted` | `BOOLEAN` | `DEFAULT FALSE` | Penanda jika blok referensi sudah dihapus |
| `comments.author_id` | `CHAR(36)` | `FOREIGN KEY -> users(id)` | Penulis komentar |
| `comments.parent_comment_id` | `CHAR(36)` | `FOREIGN KEY -> comments(id), NULL` | Balasan utas (*thread*) |
| `comments.content` | `TEXT` | `NOT NULL` | Isi komentar |
| `comments.is_resolved` | `BOOLEAN` | `DEFAULT FALSE` | Status selesai diskusi |
| `comment_mentions.id` | `CHAR(36)` | `PRIMARY KEY` | UUID mention |
| `comment_mentions.comment_id` | `CHAR(36)` | `FOREIGN KEY -> comments(id)` | Komentar sumber |
| `comment_mentions.mentioned_user_id` | `CHAR(36)` | `FOREIGN KEY -> users(id)` | Pengguna yang disebut |
| `comment_mentions.is_read` | `BOOLEAN` | `DEFAULT FALSE` | Status baca notifikasi |

#### 9. `attachments`
| Kolom | Tipe Data | Constraint | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | `CHAR(36)` | `PRIMARY KEY` | UUID lampiran |
| `workspace_id` | `CHAR(36)` | `FOREIGN KEY -> workspaces(id)` | Referensi kuota 1 GB |
| `page_id` | `CHAR(36)` | `FOREIGN KEY -> pages(id)` | Halaman/tugas tempat lampiran berada |
| `uploaded_by` | `CHAR(36)` | `FOREIGN KEY -> users(id)` | Pengunggah |
| `file_name` | `VARCHAR(255)` | `NOT NULL` | Nama file ter-sanitasi |
| `mime_type` | `VARCHAR(100)` | `NOT NULL` | Tipe MIME terverifikasi |
| `storage_key` | `VARCHAR(255)` | `NOT NULL` | Path objek pada S3/R2 |
| `file_size_bytes` | `BIGINT` | `NOT NULL` | Ukuran file (maks. `10485760` / 10 MB) |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Waktu unggah |

---

## 8. Mitigasi Edge Case, Keamanan & Privasi

### 8.1 Penanganan Edge Case Teknis
1. **Race Condition Kuota 20 Anggota:** Saat dua pengguna mengakses `/invite/:token` bersamaan pada posisi 19/20 anggota, transaksi penerimaan undangan wajib mengunci baris workspace menggunakan `SELECT max_members FROM workspaces WHERE id = ? FOR UPDATE` sebelum menyisipkan baris ke `workspace_members`.
2. **Tabrakan Urutan Drag-and-Drop (Kanban & Sidebar):** Menggunakan algoritma *fractional indexing* (`DOUBLE`) pada `position_order` (misal menyisipkan di antara `1000.0` dan `2000.0` menghasilkan `1500.0`). Jika selisih antar-posisi `< 0.0001`, server menjalankan *re-indexing* latar belakang untuk halaman/kolom tersebut.
3. **Pencegahan Siklus Hierarki Halaman (Circular Reference):** API pemindahan halaman (`PATCH /pages/:id/move`) wajib menelusuri rantai `parent_page_id` ke atas untuk memastikan target induk baru bukan merupakan keturunan (*descendant*) dari halaman yang dipindahkan dan total kedalaman tidak melebihi 5 tingkat.
4. **Komentar pada Blok yang Dihapus:** Penghapusan blok di editor menandai `comments.is_block_deleted = TRUE` alih-alih menghapus utas diskusi, sehingga konteks percakapan tim tidak hilang secara diam-diam.

### 8.2 Kontrol Keamanan & Privasi Data
1. **Isolasi Ruang Kerja & WebSocket Auth (Anti-IDOR):** Setiap koneksi WebSocket (`ws://.../sync/:pageId`) dan permintaan HTTP wajib memverifikasi token sesi, keanggotaan pada `workspace_id`, serta memastikan apabila `space_type = 'private'`, maka `created_by == current_user_id`.
2. **Isolasi Pencarian `Cmd+K`:** Kueri `FULLTEXT` wajib menyertakan klausa filter akses eksplisit:
   ```sql
   WHERE p.workspace_id = :wsId
     AND p.is_archived = FALSE
     AND (
       p.space_type = 'teamspace'
       OR (p.space_type = 'private' AND p.created_by = :userId)
     )
   ```
3. **Keamanan Unggahan File (Anti-Stored XSS):** Hanya mengizinkan *whitelist* MIME (`image/png`, `image/jpeg`, `image/webp`, `image/gif`, `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`) dengan pemeriksaan *magic bytes* di sisi server. File `.svg` dan `.html` diblokir sepenuhnya, dan seluruh berkas disajikan dari domain CDN terpisah dengan header `X-Content-Type-Options: nosniff`.
4. **Sanitasi Tautan & Blok Kode:** Seluruh URL pada blok teks hanya mengizinkan skema `http://`, `https://`, dan `mailto:`. Konten blok kode di-render sebagai teks murni tanpa eksekusi HTML.
5. **Kebersihan Data Privasi (Data Lifecycle):** Saat Admin menghapus workspace, sistem menjalankan penghapusan berjenjang (*cascade delete*) pada seluruh rekaman database serta menghapus seluruh objek fisik pada object storage berdasarkan `attachments.storage_key`.

---

## 9. Rencana Eksekusi & Milestone Rilis (6–8 Minggu)

| Fase & Waktu | Fokus Deliverable Utama | Kriteria Selesai (Definition of Done) |
| :--- | :--- | :--- |
| **Minggu 1–2:**<br>Fondasi & Auth | Setup skema MySQL, sistem autentikasi (Email + Google OAuth), struktur Workspace (Teamspace + Private Space), RBAC 3 peran, dan sistem undangan. | Pengguna dapat mendaftar, membuat workspace, mengundang tim hingga batas 20 orang, dan isolasi akses RBAC teruji. |
| **Minggu 3–4:**<br>CRDT Block Editor | Implementasi block editor (5 tipe blok), sinkronisasi Yjs WebSocket (`< 200 ms`), *live cursor*, *nested pages* (maks. 5 tingkat), dan 4 Starter Templates. | Dua atau lebih pengguna dapat mengetik bersamaan di halaman yang sama tanpa konflik dengan latensi `< 200 ms`. |
| **Minggu 5–6:**<br>Task DB & Kolaborasi | Implementasi `tasks` + tampilan Table, Kanban, dan Calendar; relasi `page_relations` (Backlinks); komentar inline + `@mention`; serta pencarian `Cmd+K`. | Kartu tugas dapat dibuat, digeser lintas tampilan, ditautkan ke Meeting Notes, dan ditemukan via `Cmd+K`. |
| **Minggu 7–8:**<br>Polish, Security QA & Launch | Fitur Nice-to-Have (unggah lampiran 10 MB / kuota 1 GB, version history, mobile responsive), pengujian keamanan IDOR/XSS, dan onboarding 10–20 tim *early adopter*. | Zero critical security bug, kuota penyimpanan tervalidasi atomik, dan 10 tim awal mulai aktif menggunakan produk. |