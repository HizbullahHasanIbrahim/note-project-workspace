# System Design Document (SDD): Material You UI & Frontend Architecture

| Atribut Dokumen | Detail |
| :--- | :--- |
| **Nama Proyek** | All-in-One Note & Project Management Workspace (`note-project-workspace`) |
| **Versi Dokumen** | 1.1 (Revised — Selaras dengan PRD v1.0) |
| **Arah Visual & Sistem Desain** | **Material You (Material Design 3 / M3)** — *Tactile Editorial Workspace* |
| **Tech Stack UI** | Next.js (App Router), TypeScript, Tailwind CSS v4, shadcn/ui, BlockNote, `@dnd-kit`, `cmdk`, TanStack Query, Zustand, Lucide Icons |
| **Target Perangkat** | Desktop-First Responsive (Desktop `≥1024px`, Tablet `768px–1023px`, Mobile `<768px`) |

---

## 1. Filosofi Desain & Prinsip Material You (M3)

Aplikasi produktivitas untuk tim kecil (2–20 orang) menuntut keseimbangan antara **ketenangan membaca/menulis dokumen panjang** dan **kejelasan hierarki visual saat mengelola proyek**. Implementasi **Material You** pada sistem ini berpegang pada 5 prinsip utama:

1. **Tonal Elevation Menggantikan Drop Shadow Berat:**
   Alih-alih menumpuk bayangan abu-abu (`box-shadow`) pada setiap kartu seperti templat SaaS konvensional, hierarki kedalaman dibentuk melalui **5 tingkat permukaan tonal** (*Surface Container Lowest* hingga *Surface Container Highest*) yang diberi sedikit rona (*chroma* 2–4%) dari warna *seed* utama.
2. **Dynamic Color Roles & Seed Personalization:**
   Seluruh antarmuka menggunakan token semantik M3 (`primary`, `secondary`, `tertiary`, `surface-container-*`, `outline-variant`). Warna *seed* default dirancang untuk fokus kerja jangka panjang (*Botanical Teal* + *Warm Amber*), dengan dukungan *Workspace Accent Tint* agar tiap tim dapat membedakan ruang kerjanya tanpa merusak rasio kontras WCAG AA (`≥ 4.5:1`).
3. **Geometri Ekspresif & Terstruktur (Shape Scale):**
   * **Full Stadium Pill (`rounded-full` / `9999px`):** Indikator halaman aktif di *sidebar*, *filter chips*, tombol aksi utama (FAB/CTA), *status badges*, dan bilah pencarian `Cmd+K`.
   * **Extra-Large (`rounded-[28px]`):** Dialog modal, *Task Side-Peek*, dan *Onboarding card*.
   * **Large (`rounded-2xl` / `16px`):** Kolom papan *Kanban*, kartu tugas, dan kontainer *callout*.
   * **Medium (`rounded-xl` / `12px`):** Blok kode, input formulir, dan *dropdown menu*.
4. **State Layers yang Konsisten:**
   Setiap elemen interaktif merespons interaksi pengguna melalui lapisan transparansi warna teks/aksen di atas permukaan (*State Layer*): **Hover (`8%`)**, **Focus-Visible (`12%`)**, **Pressed (`12%`)**, dan **Dragged (`16%`)**.
5. **Kejelasan Informasi Tanpa Dekorasi Berlebih:**
   * Tidak menggunakan label *ALL-CAPS* dengan *letter-spacing* lebar di atas judul; seluruh label memakai *Sentence case* (`label-large` / `label-medium`).
   * Tidak bergantung pada warna saja untuk membedakan status tugas—setiap status wajib memadukan **warna tonal container + ikon Lucide + label teks**.

---

## 2. Sistem Warna & Token Semantik (HCT Color System)

Warna diturunkan dari ruang warna perseptual **HCT (Hue, Chroma, Tone)** milik Material You:
* **Primary Seed (`#0F665E`):** *Deep Botanical Teal* — memberi kesan tenang, fokus, dan kontras tajam di atas permukaan netral.
* **Secondary Seed (`#4A6360`):** *Muted Mineral Slate* — menopang navigasi aktif, *filter chips*, dan tombol sekunder tanpa bersaing dengan CTA utama.
* **Tertiary Seed (`#8B5028`):** *Warm Terracotta Amber* — aksen kontras untuk penanda prioritas `Urgent/High`, sorotan `@mention`, dan *live cursor* kolaborator.

### 2.1 Tabel Token Warna (Light & Dark Mode)

| Token Semantik M3 | Light Mode (Hex) | Dark Mode (Hex) | Peran Penggunaan di Aplikasi |
| :--- | :--- | :--- | :--- |
| `--md-sys-color-primary` | `#0F665E` | `#80D5CB` | Tombol aksi utama (`+ New Page`, `Share`), indikator tab aktif, tautan *backlink*. |
| `--md-sys-color-on-primary` | `#FFFFFF` | `#003732` | Teks & ikon di atas tombol `primary`. |
| `--md-sys-color-primary-container` | `#A2F2E7` | `#005049` | *Floating Action Button* (FAB), sorotan blok teks yang dikomentari. |
| `--md-sys-color-on-primary-container` | `#00201D` | `#A2F2E7` | Teks & ikon di atas `primary-container`. |
| `--md-sys-color-secondary-container` | `#CCE8E3` | `#334B48` | Pil indikator menu aktif di *Left Sidebar*, *chip* filter aktif. |
| `--md-sys-color-on-secondary-container` | `#05201D` | `#CCE8E3` | Teks & ikon pada item *sidebar* yang sedang terpilih. |
| `--md-sys-color-tertiary` | `#8B5028` | `#FFB68D` | Penanda `@mention`, badge prioritas `Urgent`, indikator batas kuota mendekati penuh. |
| `--md-sys-color-tertiary-container` | `#FFDBCA` | `#6E3913` | Latar belakang *chip* `@mention` di dalam dokumen & komentar. |
| `--md-sys-color-on-tertiary-container` | `#321200` | `#FFDBCA` | Teks `@mention` di atas `tertiary-container`. |
| `--md-sys-color-surface` | `#F5FAF8` | `#0E1513` | Latar dasar *App Shell* dan *Topbar*. |
| `--md-sys-color-surface-container-lowest` | `#FFFFFF` | `#090F0E` | **Kanvas utama BlockNote Editor** (memberi kontras bersih untuk membaca & menulis). |
| `--md-sys-color-surface-container-low` | `#EFF5F2` | `#161D1B` | **Left Navigation Drawer** (*Shared Teamspace* & *Private Space*). |
| `--md-sys-color-surface-container` | `#E9EFEC` | `#1A2120` | Kolom **Kanban Board**, kartu ringkasan di *Settings*, dan *callout block*. |
| `--md-sys-color-surface-container-high` | `#E3E9E6` | `#252B2A` | **Right Supporting Drawer** (*Comments / Backlinks*), *Task Side-Peek Modal*, dan `Cmd+K`. |
| `--md-sys-color-surface-container-highest` | `#DDE4E1` | `#303635` | Kolom input pencarian, *hover state* baris tabel, dan *popover menu*. |
| `--md-sys-color-card-surface` | `#FFFFFF` | `#222927` | **Kartu Kanban & Kartu Template** — memastikan kartu tetap terangkat di atas kolom `surface-container` baik di Light maupun Dark Mode. |
| `--md-sys-color-on-surface` | `#171D1B` | `#DEE4E1` | Teks utama judul dan paragraf dokumen (Kontras `> 13:1`). |
| `--md-sys-color-on-surface-variant` | `#3F4947` | `#BEC9C6` | Metadata waktu edit, *breadcrumb*, label properti, dan ikon non-aktif (Kontras `> 7:1`). |
| `--md-sys-color-outline` | `#6F7977` | `#899390` | Garis tepi input aktif dan *focus ring* aksesibilitas keyboard. |
| `--md-sys-color-outline-variant` | `#BEC9C6` | `#3F4947` | Garis pemisah tipis (`1px`) antar-baris *Table View* dan pembatas panel. |
| `--md-sys-color-inverse-surface` | `#2B3230` | `#DEE4E1` | Latar belakang *Snackbar* (Toast). |
| `--md-sys-color-inverse-on-surface` | `#ECF2EF` | `#2B3230` | Teks di dalam *Snackbar* (Toast). |
| `--md-sys-color-error` | `#BA1A1A` | `#FFB4AB` | Validasi form gagal, peringatan batas 20 anggota / 10 MB file. |
| `--md-sys-color-error-container` | `#FFDAD6` | `#93000A` | Banner peringatan kuota penuh atau error sinkronisasi WebSocket. |

### 2.2 Warna Status & Prioritas Tugas (Semantik & Aksesibel)

| Kategori | Nilai | Container Token / Warna | On-Container Text | Ikon Lucide Wajib |
| :--- | :--- | :--- | :--- | :--- |
| **Status** | `To Do` | `surface-container-highest` | `on-surface-variant` | `Circle` |
| **Status** | `In Progress` | `secondary-container` | `on-secondary-container` | `Clock` |
| **Status** | `Review` | `tertiary-container` | `on-tertiary-container` | `Eye` |
| **Status** | `Done` | `primary-container` | `on-primary-container` | `CheckCircle2` |
| **Priority** | `Low` | `surface-container-high` | `on-surface-variant` | `ArrowDown` |
| **Priority** | `Medium` | `secondary-container` | `on-secondary-container` | `Minus` |
| **Priority** | `High` | `tertiary-container` | `on-tertiary-container` | `ArrowUp` |
| **Priority** | `Urgent` | `error-container` | `on-error-container` | `Flame` |

---

## 3. Tipografi & Skala Tipe (M3 Type Scale)

Menggunakan kombinasi tiga keluarga font Google Fonts yang dioptimalkan melalui `next/font/google`:
1. **Plus Jakarta Sans** (*Display, Headline & UI Labels*): Memberikan karakter geometris yang ramah namun tegas untuk judul halaman, navigasi, dan kartu proyek.
2. **Inter** (*Body & Long-Form Editor*): Keterbacaan tinggi pada ukuran kecil maupun paragraf panjang di dalam *BlockNote Editor*.
3. **JetBrains Mono** (*Code Blocks & Technical Metadata*): Digunakan khusus untuk blok kode (`code block`), pintasan keyboard (`Cmd+K`), dan indikator ukuran kuota.

| Skala M3 | Font Family | Ukuran (`rem` / `px`) | Line Height | Weight | Tracking | Penggunaan |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `display-small` | Plus Jakarta Sans | `2.25rem` (`36px`) | `2.75rem` (`44px`) | `700` | `-0.02em` | Judul utama halaman dokumen & database. |
| `headline-medium` | Plus Jakarta Sans | `1.75rem` (`28px`) | `2.25rem` (`36px`) | `600` | `-0.015em` | Heading 1 (`H1`) di dalam BlockNote & judul modal. |
| `headline-small` | Plus Jakarta Sans | `1.5rem` (`24px`) | `2rem` (`32px`) | `600` | `-0.01em` | Heading 2 (`H2`) di dalam dokumen. |
| `title-large` | Plus Jakarta Sans | `1.25rem` (`20px`) | `1.75rem` (`28px`) | `600` | `0em` | Heading 3 (`H3`) & judul *Task Side-Peek*. |
| `title-medium` | Plus Jakarta Sans | `1rem` (`16px`) | `1.5rem` (`24px`) | `600` | `0.01em` | Judul kartu Kanban, nama *Workspace*, judul *Drawer*. |
| `body-large` | Inter | `1rem` (`16px`) | `1.625rem` (`26px`) | `400` | `0em` | Paragraf utama di dalam *BlockNote Editor* (maks. `72ch`). |
| `body-medium` | Inter | `0.875rem` (`14px`) | `1.25rem` (`20px`) | `400` | `0.01em` | Isi komentar *inline*, deskripsi ringkas, dan baris tabel. |
| `label-large` | Plus Jakarta Sans | `0.875rem` (`14px`) | `1.25rem` (`20px`) | `600` | `0.01em` | Teks tombol, tab aktif, dan item navigasi *sidebar*. |
| `label-medium` | Plus Jakarta Sans | `0.75rem` (`12px`) | `1rem` (`16px`) | `500` | `0.02em` | *Status chips*, *breadcrumbs*, nama sub-halaman bersarang. |
| `code-body` | JetBrains Mono | `0.875rem` (`14px`) | `1.375rem` (`22px`) | `400` | `0em` | Konten *code block* dan *shortcut badge* (`⌘K`). |

---

## 4. Arsitektur Tata Letak (Canonical M3 Adaptive Layouts)

Aplikasi mengadopsi pola tata letak kanonik Material You **List-Detail with Supporting Pane** yang beradaptasi secara mulus pada tiga *breakpoint* utama tanpa pergeseran tata letak (`CLS < 0.1`).

### 4.1 Desktop Layout (`≥ 1024px`) — 3-Pane Workspace

```text
+---------------------------------------------------------------------------------------------------+
| TOPBAR (h: 56px, bg: surface)                                                                     |
| [Sidebar]  Teamspace / Sprint Q4 / Meeting Notes   [● Saved] [Live: R, N] [🔔2] [Share] [Drawer] |
+-----------------------+-----------------------------------------------+---------------------------+
| LEFT NAV DRAWER       | MAIN CANVAS                                   | SUPPORTING PANE (340px)   |
| (w: 272px,            | (bg: surface-container-lowest,                | (bg: surface-container-   |
|  bg: surface-         |  rounded-tl-2xl border-t border-l)            |  high, collapsible)       |
|  container-low)       |                                               |                           |
|                       |  +-----------------------------------------+  | [Comments] [Backlinks]    |
| [Workspace Switcher]  |  |  Icon + Page Title (display-small)      |  | [History]                 |
| [Search Cmd+K (pill)] |  |  Updated 2m ago by Nadia                 |  |                           |
|                       |  |                                         |  | +-----------------------+ |
| Shared Teamspace  [+] |  |  [ BlockNote Collaborative Canvas ]     |  | | Inline Comment Thread | |
|  (•) Project Brief    |  |  - Max width: 72ch (centered)           |  | | Bound to Block #4     | |
|   └─ Sprint Tracker   |  |  - Slash menu (/), checklists, tables   |  | | @Raka cek API spec    | |
|   └─ Meeting Notes    |  |  - Live cursor with user name pill      |  | +-----------------------+ |
|                       |  |                                         |  |                           |
| Private Space     [+] |  |                                         |  | Linked Tasks (Backlinks)  |
|  ( ) Catatan Pribadi  |  |                                         |  | • [In Progress] Auth API  |
|                       |  +-----------------------------------------+  |                           |
| [Settings & Quota]    |                                               |                           |
+-----------------------+-----------------------------------------------+---------------------------+
```

* **Sync Status Pill (`[● Saved]`):** Indikator status koneksi WebSocket di *Topbar* dengan 3 state: `Saved` (titik `primary`), `Syncing...` (animasi *pulse*), dan `Offline — Reconnecting` (pil `error-container`).
* **Mentions Inbox (`[🔔2]`):** Tombol ikon lonceng dengan *badge* jumlah `@mention` belum terbaca di *Topbar* yang membuka `MentionsPopover` agar setara dengan tab *Mentions* di versi Mobile.

### 4.2 Kanban & Multi-View Database Layout (Full-Width Canvas)

Saat pengguna membuka halaman bertipe database (`/workspace/:id/database/:dbId`), batas lebar `72ch` dilepas agar tampilan Table, Kanban, dan Calendar memanfaatkan lebar layar penuh:

```text
+---------------------------------------------------------------------------------------------------+
| Page Header: Sprint Tracker Q4                                                                    |
| View Switcher (M3 Segmented Button):  [ (✓) Table ]  [ Kanban ]  [ Calendar ]   |  [+ New Task]   |
| Filter Chips (Pill): [Assignee: Semua v]  [Priority: High v]  [Sort: Due Date v]                  |
+---------------------------------------------------------------------------------------------------+
| KANBAN BOARD (bg: surface, horizontal scroll)                                                     |
| +-----------------------+ +-----------------------+ +-----------------------+ +-----------------+ |
| | TO DO (3)             | | IN PROGRESS (2)       | | REVIEW (1)            | | DONE (4)        | |
| | bg: surface-container | | bg: surface-container | | bg: surface-container | | bg: surface-    | |
| | rounded-2xl p-3       | | rounded-2xl p-3       | | rounded-2xl p-3       | | container       | |
| |                       | |                       | |                       | |                 | |
| | +-------------------+ | | +-------------------+ | | +-------------------+ | | +-------------+ | |
| | | Card (card-surf)  | | | | Card (card-surf)  | | | | Card (card-surf)  | | | | Card        | | |
| | | Setup Yjs Socket  | | | | Integrasi R2      | | | | Skema MySQL       | | | | Auth Google | | |
| | | [High] [28 Nov]   | | | | [Urgent] [29 Nov] | | | | [Medium] [26 Nov] | | | | [Done]      | | |
| | | 🔗 Meeting Notes  | | | | 🔗 Spec Storage   | | | |                   | | | |             | | |
| | |              (N)  | | | |              (R)  | | | |              (N)  | | | |        (R)  | | |
| | +-------------------+ | | +-------------------+ | | +-------------------+ | | +-------------+ | |
| +-----------------------+ +-----------------------+ +-----------------------+ +-----------------+ |
+---------------------------------------------------------------------------------------------------+
```

### 4.3 Tablet (`768px–1023px`) & Mobile (`< 768px`) Adaptation

* **Tablet:** *Left Navigation Drawer* menyusut menjadi **M3 Navigation Rail** (`w: 80px`) yang menampilkan ikon ruang kerja, tombol pencarian `Cmd+K`, dan tombol buka drawer penuh. *Supporting Pane* berubah menjadi *Modal Side Sheet*.
* **Mobile (`< 768px`):**
  * *Left Sidebar* disembunyikan ke dalam *Modal Navigation Drawer* (dibuka lewat ikon menu di kiri atas).
  * Menampilkan **M3 Navigation Bar (Bottom Bar)** setinggi `80px` dengan 4 tujuan utama (*Pages*, *Search*, *Tasks*, *Mentions*) menggunakan indikator aktif berbentuk pil (`w-16 h-8 rounded-full bg-secondary-container`).
  * *Task Side-Peek Modal* tampil penuh layar (`100dvh`) dengan sudut atas `rounded-t-[28px]`.

---

## 5. Spesifikasi Komponen & Integrasi Library

### 5.1 Pemetaan Komponen shadcn/ui ke Standar Material You

| Komponen | Kustomisasi M3 (Tailwind Classes & Perilaku) |
| :--- | :--- |
| **Filled Button (Primary CTA)** | `h-10 px-6 rounded-full bg-primary text-on-primary text-label-large hover:bg-primary/92 focus-visible:ring-2 focus-visible:ring-outline` |
| **Filled Tonal Button** | `h-10 px-5 rounded-full bg-secondary-container text-on-secondary-container text-label-large hover:brightness-95` |
| **Outlined Button** | `h-10 px-5 rounded-full border border-outline text-primary text-label-large bg-transparent hover:bg-primary/8` |
| **Navigation Drawer Item** | `min-h-[44px] px-4 rounded-full flex items-center gap-3 text-label-large` — State aktif memakai `bg-secondary-container text-on-secondary-container font-semibold`. |
| **Segmented Button (View Switcher)** | Kontainer `inline-flex rounded-full border border-outline overflow-hidden`; segmen aktif mengisi `bg-secondary-container text-on-secondary-container` dengan ikon centang (`Check`) di kiri label. |
| **Filter & Status Chips** | `h-8 px-3 rounded-lg border border-outline-variant text-label-medium inline-flex items-center gap-1.5` (area sentuh diperluas hingga `44px` via `before:` pseudo-element di layar sentuh). |
| **Dialog / Task Side-Peek** | `rounded-[28px] bg-surface-container-high p-6 border border-outline-variant/40` — Side-Peek muncul dari kanan (`w-full max-w-[640px] h-[calc(100dvh-24px)] m-3 rounded-[28px]`). |
| **Text Input (M3 Outlined)** | `h-12 px-4 rounded-xl bg-transparent border border-outline text-on-surface focus:border-2 focus:border-primary` dengan label terlihat di atas atau *floating label*. |
| **Snackbar (Toast)** | `rounded-xl bg-inverse-surface text-inverse-on-surface px-4 py-3 shadow-md` muncul di pojok kiri bawah (`bottom-4 left-4`), bertahan 4 detik. |

### 5.2 Kustomisasi Tema BlockNote Editor (`BlockNoteView`)

Agar kanvas BlockNote menyatu dengan sistem tonal Material You tanpa terlihat seperti komponen tempelan, variabel CSS bawaan BlockNote di-override di `globals.css`:

```css
.bn-container[data-m3-theme] {
  --bn-colors-editor-text: var(--md-sys-color-on-surface);
  --bn-colors-editor-background: var(--md-sys-color-surface-container-lowest);
  --bn-colors-menu-text: var(--md-sys-color-on-surface);
  --bn-colors-menu-background: var(--md-sys-color-surface-container-high);
  --bn-colors-tooltip-text: var(--md-sys-color-on-secondary-container);
  --bn-colors-tooltip-background: var(--md-sys-color-secondary-container);
  --bn-colors-hovered-text: var(--md-sys-color-on-surface);
  --bn-colors-hovered-background: color-mix(in srgb, var(--md-sys-color-on-surface) 8%, transparent);
  --bn-colors-selected-text: var(--md-sys-color-on-primary);
  --bn-colors-selected-background: var(--md-sys-color-primary);
  --bn-colors-border: var(--md-sys-color-outline-variant);
  --bn-colors-side-menu: var(--md-sys-color-on-surface-variant);
  --bn-font-family: var(--font-inter), sans-serif;
  --bn-border-radius: 12px;
}
```

* **Live Cursor Collaborator:** Kursor Yjs memakai warna aksen berbeda per anggota aktif (rotasi antara `primary`, `tertiary`, dan turunan *teal/ochre*), dilengkapi pill nama kecil (`rounded-full px-2 py-0.5 text-[11px] font-medium`) di atas titik kursor.
* **Indikator Blok Terkomentari:** Blok yang memiliki utas komentar aktif mendapat garis vertikal kiri `3px solid var(--md-sys-color-tertiary)` dan latar `color-mix(in srgb, var(--md-sys-color-tertiary-container) 35%, transparent)`.

### 5.3 Interaksi Drag-and-Drop (`@dnd-kit`) & Quick Command (`cmdk`)

* **Kanban Card Drag State:** Saat kartu diseret (`isDragging`), kartu mempertahankan bentuk `rounded-2xl`, menggunakan permukaan `bg-surface-container-highest`, elevasi M3 Level 3 (`shadow-lg`), dan skala ringan `scale-[1.02]` (tanpa rotasi miring berlebihan agar teks tetap terbaca). Slot tujuan menampilkan *placeholder* garis putus-putus `border-2 border-dashed border-primary/50 rounded-2xl`.
* **Nested Sidebar Drag State:** Pemindahan sub-halaman menampilkan garis indikator horizontal `2px bg-primary` dengan titik bulat di ujung kiri; jika target melebihi kedalaman maksimal 5 tingkat, indikator berubah menjadi `bg-error` dan drop dibatalkan secara visual.
* **Quick Command (`Cmd+K`):** Modal `cmdk` memakai wadah `rounded-[28px] bg-surface-container-high max-w-[600px] overflow-hidden`, dengan input pencarian `h-14 px-5 border-b border-outline-variant` dan grup hasil (*Pages*, *Tasks*, *Quick Actions*) yang masing-masing itemnya memiliki tinggi minimal `48px` dan pil sorotan `rounded-xl bg-secondary-container`.

---

## 6. Arsitektur State Management & Lifecycle Real-Time

Untuk menjaga sinkronisasi antara dokumen CRDT, papan Kanban, dan pohon navigasi *sidebar* tanpa kebocoran memori:

1. **Pemisahan State (Server vs. UI vs. Real-Time):**
   * **TanStack Query (Server State):** Mengelola daftar halaman (`NestedPageTree`), data tugas (`KanbanBoard` / `TaskTableView`), daftar anggota, dan notifikasi `@mention`. Operasi mutasi seperti *drag-and-drop* kartu Kanban atau ubah judul halaman wajib memakai **Optimistic Updates** dengan *rollback* otomatis jika API gagal.
   * **Zustand (Client UI State):** Mengelola status buka/tutup *Left Sidebar*, *Supporting Pane* (tab aktif: *Comments / Backlinks / History*), modal `Cmd+K`, dan `activeTaskId` untuk *Task Side-Peek*.
   * **Yjs + HocuspocusProvider (Real-Time Document State):** Dikelola secara terisolasi per `pageId` di dalam komponen editor.
2. **Penanganan SSR & Cleanup WebSocket:**
   * `CollaborativeEditor.tsx` wajib dimuat secara dinamis via `next/dynamic(..., { ssr: false })` dengan *skeleton loader* setinggi kanvas agar tidak memicu *hydration mismatch* di Next.js App Router.
   * Setiap *mount* `HocuspocusProvider` (baik di halaman dokumen maupun di dalam `TaskSidePeekModal`) wajib memanggil `provider.destroy()` dan `ydoc.destroy()` di dalam fungsi *cleanup* `useEffect` agar koneksi WebSocket tidak menumpuk saat pengguna berpindah halaman/kartu tugas dengan cepat.

---

## 7. Motion & Micro-Interactions (M3 Physics)

Seluruh transisi mengikuti kurva akselerasi resmi Material Design 3 menggunakan utilitas CSS / Tailwind (tanpa memuat GSAP atau Lenis di dalam App Shell agar tidak mengganggu performa WebSocket dan `@dnd-kit`):

| Tipe Gerakan | Durasi | Kurva Easing M3 | Penerapan |
| :--- | :--- | :--- | :--- |
| **Emphasized Decelerate (Masuk)** | `250ms` | `cubic-bezier(0.05, 0.7, 0.1, 1.0)` | Membuka *Task Side-Peek*, modal `Cmd+K`, dan *Mobile Drawer*. |
| **Emphasized Accelerate (Keluar)** | `200ms` | `cubic-bezier(0.3, 0.0, 0.8, 0.15)` | Menutup modal, popover, dan *Snackbar* (keluar lebih cepat daripada masuk). |
| **Standard Easing** | `180ms` | `cubic-bezier(0.2, 0.0, 0.0, 1.0)` | Buka/tutup *Right Supporting Drawer*, perpindahan *Segmented Button* (Table/Kanban/Calendar). |
| **State Layer / Micro-Feedback** | `120ms` | `ease-out` | Perubahan warna hover (`8%`), focus ring, dan centang checklist. |

* **Aturan Aksesibilitas Gerak:** Wajib menyertakan aturan global `@media (prefers-reduced-motion: reduce)` yang memangkas seluruh durasi transisi menjadi `0.01ms` dan menonaktifkan animasi pergeseran panel.

---

## 8. Implementasi Token CSS (`src/app/globals.css`)

Salin konfigurasi token Material You berikut ke dalam `src/app/globals.css` sebagai *Single Source of Truth* untuk seluruh komponen aplikasi (Tailwind CSS v4):

```css
@import "tailwindcss";

:root {
  /* Primary — Deep Botanical Teal */
  --md-sys-color-primary: #0f665e;
  --md-sys-color-on-primary: #ffffff;
  --md-sys-color-primary-container: #a2f2e7;
  --md-sys-color-on-primary-container: #00201d;

  /* Secondary — Mineral Slate */
  --md-sys-color-secondary: #4a6360;
  --md-sys-color-on-secondary: #ffffff;
  --md-sys-color-secondary-container: #cce8e3;
  --md-sys-color-on-secondary-container: #05201d;

  /* Tertiary — Warm Terracotta Amber */
  --md-sys-color-tertiary: #8b5028;
  --md-sys-color-on-tertiary: #ffffff;
  --md-sys-color-tertiary-container: #ffdbca;
  --md-sys-color-on-tertiary-container: #321200;

  /* Error */
  --md-sys-color-error: #ba1a1a;
  --md-sys-color-on-error: #ffffff;
  --md-sys-color-error-container: #ffdad6;
  --md-sys-color-on-error-container: #410002;

  /* Tonal Surfaces (Light) */
  --md-sys-color-surface: #f5faf8;
  --md-sys-color-surface-container-lowest: #ffffff;
  --md-sys-color-surface-container-low: #eff5f2;
  --md-sys-color-surface-container: #e9efec;
  --md-sys-color-surface-container-high: #e3e9e6;
  --md-sys-color-surface-container-highest: #dde4e1;
  --md-sys-color-card-surface: #ffffff;

  /* Content & Outlines */
  --md-sys-color-on-surface: #171d1b;
  --md-sys-color-on-surface-variant: #3f4947;
  --md-sys-color-outline: #6f7977;
  --md-sys-color-outline-variant: #bec9c6;
  --md-sys-color-inverse-surface: #2b3230;
  --md-sys-color-inverse-on-surface: #ecf2ef;
}

.dark {
  /* Primary — Soft Mint Teal */
  --md-sys-color-primary: #80d5cb;
  --md-sys-color-on-primary: #003732;
  --md-sys-color-primary-container: #005049;
  --md-sys-color-on-primary-container: #a2f2e7;

  /* Secondary */
  --md-sys-color-secondary: #b0ccc8;
  --md-sys-color-on-secondary: #1b3532;
  --md-sys-color-secondary-container: #334b48;
  --md-sys-color-on-secondary-container: #cce8e3;

  /* Tertiary */
  --md-sys-color-tertiary: #ffb68d;
  --md-sys-color-on-tertiary: #522300;
  --md-sys-color-tertiary-container: #6e3913;
  --md-sys-color-on-tertiary-container: #ffdbca;

  /* Error */
  --md-sys-color-error: #ffb4ab;
  --md-sys-color-on-error: #690005;
  --md-sys-color-error-container: #93000a;
  --md-sys-color-on-error-container: #ffdad6;

  /* Tonal Surfaces (Dark) */
  --md-sys-color-surface: #0e1513;
  --md-sys-color-surface-container-lowest: #090f0e;
  --md-sys-color-surface-container-low: #161d1b;
  --md-sys-color-surface-container: #1a2120;
  --md-sys-color-surface-container-high: #252b2a;
  --md-sys-color-surface-container-highest: #303635;
  --md-sys-color-card-surface: #222927;

  /* Content & Outlines */
  --md-sys-color-on-surface: #dee4e1;
  --md-sys-color-on-surface-variant: #bec9c6;
  --md-sys-color-outline: #899390;
  --md-sys-color-outline-variant: #3f4947;
  --md-sys-color-inverse-surface: #dee4e1;
  --md-sys-color-inverse-on-surface: #2b3230;
}

@theme inline {
  /* Color Roles */
  --color-primary: var(--md-sys-color-primary);
  --color-on-primary: var(--md-sys-color-on-primary);
  --color-primary-container: var(--md-sys-color-primary-container);
  --color-on-primary-container: var(--md-sys-color-on-primary-container);
  --color-secondary: var(--md-sys-color-secondary);
  --color-on-secondary: var(--md-sys-color-on-secondary);
  --color-secondary-container: var(--md-sys-color-secondary-container);
  --color-on-secondary-container: var(--md-sys-color-on-secondary-container);
  --color-tertiary: var(--md-sys-color-tertiary);
  --color-on-tertiary: var(--md-sys-color-on-tertiary);
  --color-tertiary-container: var(--md-sys-color-tertiary-container);
  --color-on-tertiary-container: var(--md-sys-color-on-tertiary-container);
  --color-error: var(--md-sys-color-error);
  --color-on-error: var(--md-sys-color-on-error);
  --color-error-container: var(--md-sys-color-error-container);
  --color-on-error-container: var(--md-sys-color-on-error-container);

  /* Tonal Surfaces (Consistent M3 Naming) */
  --color-surface: var(--md-sys-color-surface);
  --color-surface-container-lowest: var(--md-sys-color-surface-container-lowest);
  --color-surface-container-low: var(--md-sys-color-surface-container-low);
  --color-surface-container: var(--md-sys-color-surface-container);
  --color-surface-container-high: var(--md-sys-color-surface-container-high);
  --color-surface-container-highest: var(--md-sys-color-surface-container-highest);
  --color-card-surface: var(--md-sys-color-card-surface);

  /* Content, Outlines & Inverse */
  --color-on-surface: var(--md-sys-color-on-surface);
  --color-on-surface-variant: var(--md-sys-color-on-surface-variant);
  --color-outline: var(--md-sys-color-outline);
  --color-outline-variant: var(--md-sys-color-outline-variant);
  --color-inverse-surface: var(--md-sys-color-inverse-surface);
  --color-inverse-on-surface: var(--md-sys-color-inverse-on-surface);
}

/* M3 Typography Utilities */
@utility text-display-small {
  font-family: var(--font-plus-jakarta), sans-serif;
  font-size: 2.25rem;
  line-height: 2.75rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

@utility text-label-large {
  font-family: var(--font-plus-jakarta), sans-serif;
  font-size: 0.875rem;
  line-height: 1.25rem;
  font-weight: 600;
  letter-spacing: 0.01em;
}

@utility text-label-medium {
  font-family: var(--font-plus-jakarta), sans-serif;
  font-size: 0.75rem;
  line-height: 1rem;
  font-weight: 500;
  letter-spacing: 0.02em;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## 9. Struktur Direktori Frontend (`src/`)

```text
src/
├── app/
│   ├── globals.css                     # Token warna M3, tema BlockNote, utilitas tipografi & reduced-motion
│   ├── layout.tsx                      # Konfigurasi Plus Jakarta Sans, Inter, JetBrains Mono + Providers
│   ├── page.tsx                        # Landing Page (Hero + Interactive M3 Workspace Preview)
│   ├── (auth)/
│   │   ├── login/page.tsx              # Login Email/Password & Google OAuth
│   │   ├── register/page.tsx           # Registrasi akun baru
│   │   └── invite/[token]/page.tsx     # Konfirmasi undangan workspace (cek kuota 20 anggota)
│   ├── onboarding/page.tsx             # Pembuatan workspace & pemilihan 4 Starter Templates
│   └── workspace/[workspaceId]/
│       ├── layout.tsx                  # M3 Adaptive App Shell (Sidebar + Topbar + Supporting Pane)
│       ├── page/[pageId]/page.tsx      # Halaman Dokumen (BlockNote CRDT + Right Drawer)
│       ├── database/[dbId]/page.tsx    # Halaman Task Database (Table / Kanban / Calendar)
│       └── settings/page.tsx           # Pengaturan General, RBAC Members, & Kuota 1 GB
├── components/
│   ├── ui/                             # Komponen shadcn/ui yang sudah disesuaikan ke bentuk M3
│   ├── shell/
│   │   ├── NavDrawer.tsx               # Left Sidebar / Tablet Rail / Mobile Bottom Bar
│   │   ├── NestedPageTree.tsx          # Pohon halaman bersarang (maks. 5 tingkat) + @dnd-kit
│   │   ├── Topbar.tsx                  # Breadcrumb, Sync Status Pill, Live Avatars, Mentions & Share
│   │   ├── MentionsPopover.tsx         # Inbox notifikasi @mention (Desktop Popover & Mobile Tab)
│   │   ├── SupportingPane.tsx          # Right Drawer (Inline Comments, Backlinks, History)
│   │   └── QuickCommandModal.tsx       # Pencarian instan Cmd+K (cmdk)
│   ├── editor/
│   │   ├── CollaborativeEditor.tsx     # Wrapper BlockNote (ssr: false) + Yjs + HocuspocusProvider cleanup
│   │   └── TemplatePickerCard.tsx      # Kartu pilihan Project Brief, Sprint, Meeting Notes, SOP
│   └── database/
│       ├── ViewSwitcher.tsx            # M3 Segmented Button (Table / Kanban / Calendar)
│       ├── KanbanBoard.tsx             # Papan Kanban drag-and-drop (@dnd-kit + optimistic update)
│       ├── TaskTableView.tsx           # Tampilan tabel properti relasional
│       ├── TaskCalendarView.tsx        # Tampilan kalender bulanan berdasarkan Due Date
│       └── TaskSidePeekModal.tsx       # Modal detail tugas + relasi Note + BlockNote deskripsi
├── stores/
│   └── useWorkspaceUIStore.ts          # Zustand store (Sidebar, Supporting Pane, Cmd+K, Side-Peek)
└── lib/
    ├── fractional-index.ts             # Kalkulasi position_order untuk Kanban & Sidebar
    └── permissions.ts                  # Helper matriks RBAC (Admin / Member / Viewer)
```

---

## 10. Daftar Periksa Kualitas UI/UX (Pre-Delivery QA Checklist)

Sebelum merilis setiap halaman atau komponen ke fase pengujian *early adopter*, pastikan seluruh butir berikut terpenuhi:

- [ ] **Kontras Warna WCAG AA:** Seluruh pasangan teks di atas *surface container* maupun *status badge* memenuhi rasio minimal `4.5:1` di Light Mode maupun Dark Mode.
- [ ] **Isolasi Token:** Tidak ada kode warna hex mentah (`#...`) di dalam komponen React; seluruh warna memanggil kelas utilitas token M3 (`bg-surface-container`, `bg-card-surface`, `text-on-surface`, dll.).
- [ ] **Target Sentuh & Jarak Interaktif:** Seluruh tombol ikon, checkbox, dan chevron pohon halaman memiliki area klik minimal `44×44px` dengan jarak antar-elemen minimal `8px`.
- [ ] **Aksesibilitas Keyboard & Screen Reader:** Tombol ikon tunggal memiliki `aria-label` deskriptif; seluruh alur utama dapat dinavigasi dengan `Tab`, `Enter`, `Escape`, dan `Cmd+K` dengan *focus ring* (`2px outline`) yang terlihat jelas.
- [ ] **Perilaku RBAC pada UI:** Pengguna dengan peran `viewer` tidak melihat tombol edit/hapus/drag-and-drop dan melihat lencana *Read-Only* yang jelas di *Topbar*.
- [ ] **Zero Layout Shift & Safe Areas:** Memuat halaman dokumen tidak menggeser lebar sidebar (`272px`), dan *Bottom Navigation Bar* pada perangkat mobile menghormati `env(safe-area-inset-bottom)`.
- [ ] **Cleanup WebSocket:** Berpindah halaman atau membuka-tutup *Task Side-Peek* berulang kali tidak meninggalkan koneksi WebSocket aktif yang menggantung di tab Network browser.