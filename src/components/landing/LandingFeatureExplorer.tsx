"use client";

import { useState } from "react";
import {
  FolderLock,
  FileText,
  LayoutGrid,
  MessageSquare,
  Search,
  CheckCircle2,
  Users,
  Lock,
  Database,
  Calendar,
  Columns3,
  Sparkles,
  Check,
  X,
  ShieldCheck,
  ChevronRight,
  Trash2,
  RotateCcw,
  Link2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FeaturePillar {
  id: string;
  number: string;
  title: string;
  shortDesc: string;
  icon: typeof FolderLock;
  badge: string;
  architecturePoints: { label: string; value: string }[];
  bulletPoints: string[];
}

const FEATURE_PILLARS: FeaturePillar[] = [
  {
    id: "space-isolation",
    number: "01",
    title: "Pemisahan Shared Teamspace & Private Space",
    shortDesc: "Isolasi draf pribadi aman sebelum siap dipublikasikan ke seluruh anggota tim.",
    icon: FolderLock,
    badge: "Keamanan & Anti-IDOR",
    architecturePoints: [
      { label: "Isolasi Ruang", value: "Verifikasi kepemilikan created_by di setiap Server Action" },
      { label: "Matriks RBAC", value: "3 Peran: Admin (penuh), Member (edit), Viewer (baca)" },
      { label: "Batas Anggota", value: "Maksimal 20 pengguna per ruang kerja" },
    ],
    bulletPoints: [
      "Halaman privat tidak pernah muncul di kueri Cmd+K anggota lain",
      "Perlindungan ketat terhadap manipulasi URL langsung (anti-IDOR)",
      "Pindah dari draf privat ke ruang kerja tim hanya dengan satu klik",
    ],
  },
  {
    id: "block-editor",
    number: "02",
    title: "Block Editor Real-Time & Halaman Bersarang",
    shortDesc: "Penyuntingan blok modern berbasis BlockNote dan CRDT Yjs berlatensi rendah.",
    icon: FileText,
    badge: "Kolaborasi CRDT",
    architecturePoints: [
      { label: "Mesin CRDT", value: "Yjs via WebSocket terpisah di port 1234" },
      { label: "Latensi Target", value: "Di bawah 200ms untuk 20 pengguna bersamaan" },
      { label: "Kedalaman Hirarki", value: "Maksimal 5 tingkat bersarang dengan fractional index" },
    ],
    bulletPoints: [
      "Dukungan blok teks, heading 1-3, checklist, blok kode, dan tabel",
      "Kursor live dengan nama dan warna pembeda tanpa tabrakan teks",
      "Snapshot riwayat versi otomatis saat klien terakhir memutuskan koneksi",
    ],
  },
  {
    id: "task-database",
    number: "03",
    title: "Relational Task Database Multi-View",
    shortDesc: "Satu basis data tugas yang dapat dilihat dalam format Table, Kanban, atau Calendar.",
    icon: LayoutGrid,
    badge: "Multi-View Data",
    architecturePoints: [
      { label: "Tampilan Tersedia", value: "Tabel terstruktur, Papan Kanban, dan Kalender" },
      { label: "Pengurutan Kartu", value: "Fractional indexing tipe DOUBLE tanpa re-ordering berat" },
      { label: "Tautan Relasional", value: "Relasi dua arah langsung ke halaman notulensi" },
    ],
    bulletPoints: [
      "Drag-and-drop kartu Kanban yang mulus tanpa mengganggu kursor editor",
      "Filter multi-kriteria berdasarkan status, prioritas, dan PIC",
      "Perubahan di satu tampilan langsung tersinkronisasi di tampilan lain",
    ],
  },
  {
    id: "block-comments",
    number: "04",
    title: "Komentar Inline Terikat Blok & Backlinks",
    shortDesc: "Diskusi tepat sasaran di kalimat yang relevan tanpa kehilangan konteks.",
    icon: MessageSquare,
    badge: "Konteks Diskusi",
    architecturePoints: [
      { label: "Integritas Blok", value: "Kolom is_block_deleted mencegah komentar terhapus" },
      { label: "Panel Backlinks", value: "Otomatis mencatat seluruh dokumen yang merujuk tugas" },
      { label: "Status Thread", value: "Mendukung resolved / open thread dengan cap waktu" },
    ],
    bulletPoints: [
      "Komentar terikat langsung ke ID blok spesifik, bukan sekadar koordinat piksel",
      "Jika blok dihapus, komentar tetap dapat diaudit dengan tanda penjelas",
      "Panel Backlinks memperjelas latar belakang keputusan rapat",
    ],
  },
  {
    id: "cmd-k-search",
    number: "05",
    title: "Quick Command Cmd+K Full-Text Search",
    shortDesc: "Temukan dokumen, tugas, dan blok konten instan tanpa mengangkat tangan dari keyboard.",
    icon: Search,
    badge: "Pencarian Instan",
    architecturePoints: [
      { label: "Kecepatan Respon", value: "Di bawah 300 milidetik untuk kueri teks penuh" },
      { label: "Cakupan Pencarian", value: "Judul halaman, isi blok teks, dan judul tugas" },
      { label: "Filter Pintar", value: "Pemisahan ruang Teamspace vs Private secara otomatis" },
    ],
    bulletPoints: [
      "Pintasan keyboard universal Cmd+K atau Ctrl+K di seluruh rute aplikasi",
      "Navigasi hasil pencarian penuh menggunakan tombol panah dan Enter",
      "Hasil pencarian menghormati hak akses privasi pengguna secara ketat",
    ],
  },
];

type RoleType = "admin" | "member" | "viewer";
type TaskViewType = "kanban" | "table" | "calendar";

export function LandingFeatureExplorer() {
  const [activeTab, setActiveTab] = useState<string>("space-isolation");
  const [selectedRole, setSelectedRole] = useState<RoleType>("member");
  const [taskView, setTaskView] = useState<TaskViewType>("kanban");
  const [isSimulatedBlockDeleted, setIsSimulatedBlockDeleted] = useState(false);
  const [simulatedSearchQuery, setSimulatedSearchQuery] = useState("magic bytes");

  const currentFeature =
    FEATURE_PILLARS.find((f) => f.id === activeTab) ?? FEATURE_PILLARS[0];
  const CurrentIcon = currentFeature.icon;

  return (
    <section
      id="fitur-utama"
      aria-labelledby="features-heading"
      className="w-full py-20 sm:py-28 border-t border-outline-variant/30"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Bagian: Editorial & Tenang */}
        <div className="max-w-3xl mb-14 sm:mb-20">
          <span className="text-label-medium font-semibold text-primary">
            Arsitektur &amp; Kemampuan
          </span>
          <h2
            id="features-heading"
            className="mt-2 text-headline-medium sm:text-display-small font-bold text-on-surface tracking-tight"
          >
            Bedah mendalam 5 pilar utama ruang kerja
          </h2>
          <p className="mt-4 text-body-large text-on-surface-variant leading-relaxed max-w-2xl">
            Setiap modul dibangun secara cermat untuk menyelesaikan friksi koordinasi tim
            tanpa kompromi performa atau keamanan data.
          </p>
        </div>

        {/* Tata Letak Interaktif List-Detail */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Kolom Kiri: Navigasi Pilar (5 Tombol) */}
          <div
            role="tablist"
            aria-label="Pilihan pilar fitur utama"
            className="lg:col-span-5 flex flex-col gap-3"
          >
            {FEATURE_PILLARS.map((feature) => {
              const Icon = feature.icon;
              const isActive = feature.id === activeTab;
              return (
                <button
                  key={feature.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`feature-panel-${feature.id}`}
                  id={`feature-tab-${feature.id}`}
                  onClick={() => setActiveTab(feature.id)}
                  className={cn(
                    "w-full text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 motion-reduce:transition-none cursor-pointer min-h-[56px] flex items-start gap-4",
                    "focus-visible:ring-2 focus-visible:ring-outline outline-none",
                    isActive
                      ? "bg-secondary-container text-on-secondary-container border-secondary-container shadow-xs"
                      : "bg-surface-container-low text-on-surface-variant border-outline-variant/40 hover:bg-surface-container hover:text-on-surface"
                  )}
                >
                  <span
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors motion-reduce:transition-none",
                      isActive
                        ? "bg-primary text-on-primary"
                        : "bg-surface-container-highest text-on-surface-variant"
                    )}
                  >
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-label-medium font-bold opacity-75">
                        Pilar {feature.number}
                      </span>
                      {isActive && (
                        <span className="w-2 h-2 rounded-full bg-primary" aria-hidden="true" />
                      )}
                    </div>
                    <div className="text-title-medium font-bold text-on-surface mt-0.5 truncate">
                      {feature.title}
                    </div>
                    <div className="text-body-medium text-on-surface-variant line-clamp-2 mt-1">
                      {feature.shortDesc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Kolom Kanan: Panel Detail & Skema Visual Interaktif M3 */}
          <div
            id={`feature-panel-${currentFeature.id}`}
            role="tabpanel"
            aria-labelledby={`feature-tab-${currentFeature.id}`}
            className="lg:col-span-7 rounded-[28px] bg-surface-container-low border border-outline-variant/40 p-6 sm:p-8 flex flex-col justify-between shadow-xs"
          >
            <div>
              {/* Header Panel Detail */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-6 border-b border-outline-variant/30">
                <div className="flex items-center gap-3">
                  <span className="w-12 h-12 rounded-2xl bg-primary text-on-primary flex items-center justify-center shadow-xs">
                    <CurrentIcon className="w-6 h-6" aria-hidden="true" />
                  </span>
                  <div>
                    <span className="text-label-medium font-bold text-primary">
                      Pilar {currentFeature.number}
                    </span>
                    <h3 className="text-title-large font-bold text-on-surface">
                      {currentFeature.title}
                    </h3>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full bg-surface-container-highest text-on-surface-variant text-label-medium font-semibold">
                  {currentFeature.badge}
                </span>
              </div>

              {/* Deskripsi & Poin Keunggulan */}
              <p className="text-body-large text-on-surface leading-relaxed mb-6">
                {currentFeature.shortDesc}
              </p>

              <div className="space-y-3 mb-8">
                {currentFeature.bulletPoints.map((point, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-body-medium text-on-surface-variant">
                    <CheckCircle2
                      className="w-4 h-4 text-primary shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <span>{point}</span>
                  </div>
                ))}
              </div>

              {/* Skema Visual Interaktif Berdasarkan Pilar Aktif */}
              <div className="rounded-2xl bg-surface-container-lowest border border-outline-variant/40 p-5 mb-8 text-left">
                {/* 1. Pilar 1: Simulasi Matriks Peran RBAC Interaktif */}
                {currentFeature.id === "space-isolation" && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-outline-variant/30">
                      <div>
                        <div className="text-label-medium font-bold text-on-surface flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-primary" />
                          <span>Simulasi Hak Akses RBAC 3 Peran</span>
                        </div>
                        <p className="text-[11px] text-on-surface-variant">
                          Klik peran untuk menguji izin server yang aktif:
                        </p>
                      </div>

                      {/* Segmented Control Peran */}
                      <div className="inline-flex p-1 rounded-full bg-surface-container border border-outline-variant/40 self-start sm:self-auto">
                        {(["admin", "member", "viewer"] as const).map((role) => (
                          <button
                            key={role}
                            type="button"
                            onClick={() => setSelectedRole(role)}
                            className={cn(
                              "px-3 py-1 rounded-full text-label-small font-semibold capitalize transition-all cursor-pointer",
                              selectedRole === role
                                ? "bg-primary text-on-primary shadow-xs"
                                : "text-on-surface-variant hover:text-on-surface"
                            )}
                          >
                            {role}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Matriks Hasil Simulasi Peran */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      <div className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-center justify-between">
                        <span>Sunting Dokumen Kolaboratif</span>
                        {selectedRole === "viewer" ? (
                          <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant font-semibold flex items-center gap-1">
                            <X className="w-3 h-3 text-error" /> Baca Saja
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-semibold flex items-center gap-1">
                            <Check className="w-3 h-3 text-primary" /> Diizinkan
                          </span>
                        )}
                      </div>

                      <div className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-center justify-between">
                        <span>Geser Status Kartu Kanban</span>
                        {selectedRole === "viewer" ? (
                          <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant font-semibold flex items-center gap-1">
                            <X className="w-3 h-3 text-error" /> Terkunci
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-semibold flex items-center gap-1">
                            <Check className="w-3 h-3 text-primary" /> Diizinkan
                          </span>
                        )}
                      </div>

                      <div className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-center justify-between">
                        <span>Undang &amp; Hapus Anggota</span>
                        {selectedRole === "admin" ? (
                          <span className="px-2 py-0.5 rounded-full bg-primary-container text-on-primary-container font-semibold flex items-center gap-1">
                            <Check className="w-3 h-3 text-primary" /> Hak Penuh
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant font-semibold flex items-center gap-1">
                            <X className="w-3 h-3 text-error" /> Khusus Admin
                          </span>
                        )}
                      </div>

                      <div className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-center justify-between">
                        <span>Akses Private Space Rekan</span>
                        <span className="px-2 py-0.5 rounded-full bg-tertiary-container text-on-tertiary-container font-semibold flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Anti-IDOR Blocked
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Pilar 2: Simulasi Pohon Bersarang 5 Tingkat & Fractional Index */}
                {currentFeature.id === "block-editor" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-label-medium font-bold text-on-surface pb-2 border-b border-outline-variant/30">
                      <span>Pohon Halaman Bersarang (Maksimal 5 Tingkat)</span>
                      <span className="text-[11px] font-mono text-primary">position_order: DOUBLE</span>
                    </div>

                    <div className="space-y-1.5 font-mono text-xs">
                      <div className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-center justify-between">
                        <span className="font-semibold text-on-surface">1. Arsitektur Inti (Level 1)</span>
                        <span className="text-[10px] text-on-surface-variant">order: 1000.0</span>
                      </div>
                      <div className="pl-4 border-l-2 border-primary/50 space-y-1.5">
                        <div className="p-2 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-center justify-between">
                          <span className="text-on-surface">1.1 Collab Server (Level 2)</span>
                          <span className="text-[10px] text-on-surface-variant">order: 1500.0</span>
                        </div>
                        <div className="pl-4 border-l-2 border-primary/50 space-y-1.5">
                          <div className="p-2 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-center justify-between">
                            <span className="text-on-surface">1.1.1 Yjs State CRDT (Level 3)</span>
                            <span className="text-[10px] text-on-surface-variant">order: 1750.0</span>
                          </div>
                          <div className="pl-4 border-l-2 border-primary/50">
                            <div className="p-2 rounded-xl bg-secondary-container/40 border border-primary/30 flex items-center justify-between">
                              <span className="text-on-surface font-semibold">1.1.1.1 Snapshot Buffer (Level 4)</span>
                              <span className="text-[10px] font-bold text-primary">Valid Cycle Check</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Pilar 3: Simulasi Multi-View Task Database */}
                {currentFeature.id === "task-database" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30">
                      <div className="text-label-medium font-bold text-on-surface">
                        Task Database: 1 Basis Data, 3 Tampilan
                      </div>

                      {/* View Switcher Pills */}
                      <div className="inline-flex p-1 rounded-full bg-surface-container border border-outline-variant/40">
                        <button
                          type="button"
                          onClick={() => setTaskView("kanban")}
                          className={cn(
                            "px-2.5 py-0.5 rounded-full text-label-small font-semibold transition-all cursor-pointer",
                            taskView === "kanban"
                              ? "bg-primary text-on-primary shadow-xs"
                              : "text-on-surface-variant hover:text-on-surface"
                          )}
                        >
                          Kanban
                        </button>
                        <button
                          type="button"
                          onClick={() => setTaskView("table")}
                          className={cn(
                            "px-2.5 py-0.5 rounded-full text-label-small font-semibold transition-all cursor-pointer",
                            taskView === "table"
                              ? "bg-primary text-on-primary shadow-xs"
                              : "text-on-surface-variant hover:text-on-surface"
                          )}
                        >
                          Table
                        </button>
                        <button
                          type="button"
                          onClick={() => setTaskView("calendar")}
                          className={cn(
                            "px-2.5 py-0.5 rounded-full text-label-small font-semibold transition-all cursor-pointer",
                            taskView === "calendar"
                              ? "bg-primary text-on-primary shadow-xs"
                              : "text-on-surface-variant hover:text-on-surface"
                          )}
                        >
                          Calendar
                        </button>
                      </div>
                    </div>

                    {taskView === "kanban" && (
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/30">
                          <span className="font-bold text-on-surface block mb-1">To Do</span>
                          <div className="p-2 rounded-lg bg-card-surface border border-outline-variant/30 text-left text-[11px] font-medium">
                            Kalkulasi fractional index
                          </div>
                        </div>
                        <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/30">
                          <span className="font-bold text-on-surface block mb-1">In Progress</span>
                          <div className="p-2 rounded-lg bg-card-surface border border-outline-variant/30 text-left text-[11px] font-medium">
                            CRDT WebSocket 1234
                          </div>
                        </div>
                        <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/30">
                          <span className="font-bold text-on-surface block mb-1">Done</span>
                          <div className="p-2 rounded-lg bg-card-surface border border-outline-variant/30 text-left text-[11px] font-medium">
                            Magic bytes validator
                          </div>
                        </div>
                      </div>
                    )}

                    {taskView === "table" && (
                      <div className="rounded-xl border border-outline-variant/30 overflow-hidden text-xs">
                        <div className="grid grid-cols-12 p-2 bg-surface-container font-bold text-on-surface-variant">
                          <div className="col-span-6">Judul Tugas</div>
                          <div className="col-span-3">Status</div>
                          <div className="col-span-3">Prioritas</div>
                        </div>
                        <div className="divide-y divide-outline-variant/20 bg-surface-container-low">
                          <div className="grid grid-cols-12 p-2 items-center">
                            <div className="col-span-6 truncate font-medium">Validasi magic bytes</div>
                            <div className="col-span-3"><span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-semibold">Done</span></div>
                            <div className="col-span-3"><span className="text-tertiary font-semibold text-[10px]">High</span></div>
                          </div>
                          <div className="grid grid-cols-12 p-2 items-center">
                            <div className="col-span-6 truncate font-medium">Sinkronisasi CRDT</div>
                            <div className="col-span-3"><span className="px-2 py-0.5 rounded-full bg-primary-container text-on-primary-container text-[10px] font-semibold">In Progress</span></div>
                            <div className="col-span-3"><span className="text-error font-semibold text-[10px]">Urgent</span></div>
                          </div>
                        </div>
                      </div>
                    )}

                    {taskView === "calendar" && (
                      <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-primary" />
                          <span>Tenggat Rilis Sprint Q4: <strong>30 November 2026</strong></span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold">
                          3 Tugas Terjadwal
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. Pilar 4: Simulasi Retensi Komentar Orphaned */}
                {currentFeature.id === "block-comments" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30">
                      <div>
                        <div className="text-label-medium font-bold text-on-surface">
                          Retensi Komentar Terikat Blok (Anti-Orphan)
                        </div>
                        <p className="text-[11px] text-on-surface-variant">
                          Uji ketahanan saat blok teks dihapus oleh kolaborator lain:
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsSimulatedBlockDeleted((prev) => !prev)}
                        className={cn(
                          "px-3 py-1 rounded-full text-label-small font-semibold flex items-center gap-1.5 transition-colors cursor-pointer",
                          isSimulatedBlockDeleted
                            ? "bg-surface-container text-on-surface-variant hover:bg-surface-container-highest"
                            : "bg-error-container text-on-error-container hover:brightness-95"
                        )}
                      >
                        {isSimulatedBlockDeleted ? (
                          <>
                            <RotateCcw className="w-3 h-3" />
                            <span>Kembalikan Blok</span>
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-3 h-3" />
                            <span>Simulasi Hapus Blok</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-label-small font-bold text-on-surface">Nadia Kusuma</span>
                        {isSimulatedBlockDeleted ? (
                          <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container text-[10px] font-bold">
                            is_block_deleted = true (Tersimpan)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-semibold">
                            Terikat ke Blok #b-3401
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-on-surface-variant">
                        "Pastikan pengecekan magic bytes mencakup validasi footer %%EOF sebelum menyimpan snapshot ke MySQL."
                      </p>

                      {isSimulatedBlockDeleted && (
                        <div className="p-2 rounded-lg bg-surface-container border border-outline-variant/20 text-[11px] text-on-surface-variant flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span>Komentar tidak hilang dari database; riwayat diskusi tetap utuh untuk audit.</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 5. Pilar 5: Simulasi Quick Command Cmd+K dengan Kecepatan Latensi */}
                {currentFeature.id === "cmd-k-search" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30">
                      <span className="text-label-medium font-bold text-on-surface">
                        Simulasi Pencarian Teks Penuh (Full-Text Search)
                      </span>
                      <span className="text-[11px] font-mono text-primary font-bold">Latensi: 24ms</span>
                    </div>

                    <div className="space-y-2">
                      <div className="px-3 py-2 rounded-xl bg-surface-container-high border border-outline-variant/40 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Search className="w-4 h-4 text-primary" />
                          <span className="font-mono text-xs text-on-surface">
                            {simulatedSearchQuery}
                          </span>
                        </div>
                        <span className="font-mono text-[11px] text-on-surface-variant">3 hasil ditemukan</span>
                      </div>

                      <div className="space-y-1.5">
                        <div className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-center justify-between text-xs">
                          <span className="truncate font-medium text-on-surface">
                            Implementasi verifikasi magic bytes DOCX/PDF
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant shrink-0">
                            Tugas
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-center justify-between text-xs">
                          <span className="truncate font-medium text-on-surface">
                            Notulensi Rapat: Validasi Magic Bytes
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container shrink-0">
                            Dokumen
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Spesifikasi Arsitektur Bawah */}
            <div className="pt-6 border-t border-outline-variant/30 text-left">
              <div className="text-label-medium font-bold text-on-surface-variant mb-3">
                Spesifikasi Teknis
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {currentFeature.architecturePoints.map((spec, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-surface-container border border-outline-variant/20"
                  >
                    <div className="text-label-small text-on-surface-variant">{spec.label}</div>
                    <div className="text-label-medium font-bold text-on-surface mt-0.5 leading-snug">
                      {spec.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
