"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  CheckCircle2,
  Circle,
  Database,
  FileText,
  Flame,
  FolderLock,
  Globe,
  Link2,
  Lock,
  MessageSquare,
  Minus,
  Search,
  Shield,
  Sparkles,
  CheckCheck,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SandboxMode = "document" | "kanban" | "search";
type ActiveDocId = "notulensi" | "sprint_kanban" | "private_eval";

interface DemoTask {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  linkedDoc: string;
}

const INITIAL_TASKS: DemoTask[] = [
  {
    id: "task-1",
    title: "Implementasi verifikasi magic bytes DOCX/PDF",
    status: "done",
    priority: "high",
    linkedDoc: "Notulensi Rapat Sprint",
  },
  {
    id: "task-2",
    title: "Sinkronisasi CRDT Yjs WebSocket < 200ms",
    status: "in_progress",
    priority: "urgent",
    linkedDoc: "Spesifikasi WebSocket",
  },
  {
    id: "task-3",
    title: "Kalkulasi fractional index kartu Kanban",
    status: "todo",
    priority: "medium",
    linkedDoc: "Notulensi Rapat Sprint",
  },
  {
    id: "task-4",
    title: "Audit isolasi data anti-IDOR Private Space",
    status: "todo",
    priority: "low",
    linkedDoc: "Checklist Keamanan",
  },
];

const SEARCH_DATABASE = [
  {
    id: "s-1",
    type: "document",
    title: "Notulensi Rapat Sprint & Arsitektur",
    snippet: "Keputusan arsitektur sinkronisasi WebSocket port 1234 dengan Yjs CRDT...",
    space: "teamspace",
  },
  {
    id: "s-2",
    type: "task",
    title: "Implementasi verifikasi magic bytes DOCX/PDF",
    snippet: "Validasi %%EOF di 1024 byte akhir dan struktur internal OpenXML...",
    space: "teamspace",
  },
  {
    id: "s-3",
    type: "task",
    title: "Sinkronisasi CRDT Yjs WebSocket < 200ms",
    snippet: "Room per documentName dengan in-flight write lock ke database...",
    space: "teamspace",
  },
  {
    id: "s-4",
    type: "document",
    title: "Draf Evaluasi Arsitektur Pribadi",
    snippet: "Catatan evaluasi pribadi tentang isolasi memory heap dan buffer...",
    space: "private",
  },
  {
    id: "s-5",
    type: "task",
    title: "Kalkulasi fractional index kartu Kanban",
    snippet: "Gunakan tipe DOUBLE dengan generatePosition untuk re-indexing berkala...",
    space: "teamspace",
  },
  {
    id: "s-6",
    type: "document",
    title: "Spesifikasi Auth & Session Secret",
    snippet: "Proteksi sesi AES-256-GCM dengan fail-fast saat produksi...",
    space: "teamspace",
  },
];

const PRIORITY_BADGES = {
  low: {
    label: "Low",
    icon: ArrowDown,
    containerClass: "bg-surface-container-high text-on-surface-variant",
  },
  medium: {
    label: "Medium",
    icon: Minus,
    containerClass: "bg-secondary-container text-on-secondary-container",
  },
  high: {
    label: "High",
    icon: ArrowUp,
    containerClass: "bg-tertiary-container text-on-tertiary-container",
  },
  urgent: {
    label: "Urgent",
    icon: Flame,
    containerClass: "bg-error-container text-on-error-container",
  },
};

export function LandingHeroSandbox() {
  const [activeMode, setActiveMode] = useState<SandboxMode>("document");
  const [selectedDocId, setSelectedDocId] = useState<ActiveDocId>("notulensi");
  const [activeCommentResolved, setActiveCommentResolved] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSearchIndex, setSelectedSearchIndex] = useState(0);
  const [tasks, setTasks] = useState<DemoTask[]>(INITIAL_TASKS);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    chk1: true,
    chk2: true,
    chk3: false,
    chk4: false,
  });

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Toggle checklist
  const toggleCheck = (key: string) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Hitung progres tugas checklist
  const completedChecklistCount = Object.values(checklist).filter(Boolean).length;
  const totalChecklistCount = Object.keys(checklist).length;
  const checklistPercentage = Math.round(
    (completedChecklistCount / totalChecklistCount) * 100
  );

  // Siklus status kartu kanban
  const advanceTaskStatus = (taskId: string) => {
    const cycleMap: Record<DemoTask["status"], DemoTask["status"]> = {
      todo: "in_progress",
      in_progress: "done",
      done: "todo",
    };
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: cycleMap[t.status] } : t))
    );
  };

  // Navigasi Dokumen Sidebar
  const handleSelectDoc = (docId: ActiveDocId) => {
    setSelectedDocId(docId);
    if (docId === "sprint_kanban") {
      setActiveMode("kanban");
    } else {
      setActiveMode("document");
    }
  };

  // Filter Kueri Pencarian
  const filteredSearchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return SEARCH_DATABASE;
    return SEARCH_DATABASE.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.snippet.toLowerCase().includes(q) ||
        (q === "private" && item.space === "private")
    );
  }, [searchQuery]);

  // Keyboard navigation untuk Cmd+K (ArrowUp, ArrowDown, Enter)
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (filteredSearchResults.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedSearchIndex((prev) => (prev + 1) % filteredSearchResults.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedSearchIndex((prev) =>
        prev <= 0 ? filteredSearchResults.length - 1 : prev - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      const chosen = filteredSearchResults[selectedSearchIndex];
      if (chosen) {
        if (chosen.type === "document") {
          if (chosen.space === "private") {
            handleSelectDoc("private_eval");
          } else {
            handleSelectDoc("notulensi");
          }
        } else {
          setActiveMode("kanban");
        }
      }
    }
  };

  // Reset selected search index saat query berubah
  useEffect(() => {
    setSelectedSearchIndex(0);
  }, [searchQuery]);

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col items-center gap-4">
      {/* M3 Segmented Button Pengalih Tampilan */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 px-1">
        <div
          role="tablist"
          aria-label="Pilih Mode Pratinjau Workspace"
          className="w-full sm:w-auto inline-flex p-1 rounded-full bg-surface-container border border-outline-variant/60 overflow-x-auto max-w-full"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeMode === "document"}
            onClick={() => {
              setActiveMode("document");
              if (selectedDocId === "sprint_kanban") setSelectedDocId("notulensi");
            }}
            className={cn(
              "min-h-[44px] px-4 sm:px-5 rounded-full text-label-large font-semibold flex items-center gap-2 transition-all motion-reduce:transition-none shrink-0 cursor-pointer",
              "focus-visible:ring-2 focus-visible:ring-outline outline-none",
              activeMode === "document"
                ? "bg-secondary-container text-on-secondary-container shadow-xs"
                : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            {activeMode === "document" ? (
              <Check className="w-4 h-4 text-primary" aria-hidden="true" />
            ) : (
              <FileText className="w-4 h-4 text-on-surface-variant" aria-hidden="true" />
            )}
            <span>1. Dokumen Kolaboratif</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeMode === "kanban"}
            onClick={() => {
              setActiveMode("kanban");
              setSelectedDocId("sprint_kanban");
            }}
            className={cn(
              "min-h-[44px] px-4 sm:px-5 rounded-full text-label-large font-semibold flex items-center gap-2 transition-all motion-reduce:transition-none shrink-0 cursor-pointer",
              "focus-visible:ring-2 focus-visible:ring-outline outline-none",
              activeMode === "kanban"
                ? "bg-secondary-container text-on-secondary-container shadow-xs"
                : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            {activeMode === "kanban" ? (
              <Check className="w-4 h-4 text-primary" aria-hidden="true" />
            ) : (
              <Database className="w-4 h-4 text-on-surface-variant" aria-hidden="true" />
            )}
            <span>2. Papan Kanban</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeMode === "search"}
            onClick={() => {
              setActiveMode("search");
              setTimeout(() => searchInputRef.current?.focus(), 50);
            }}
            className={cn(
              "min-h-[44px] px-4 sm:px-5 rounded-full text-label-large font-semibold flex items-center gap-2 transition-all motion-reduce:transition-none shrink-0 cursor-pointer",
              "focus-visible:ring-2 focus-visible:ring-outline outline-none",
              activeMode === "search"
                ? "bg-secondary-container text-on-secondary-container shadow-xs"
                : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            {activeMode === "search" ? (
              <Check className="w-4 h-4 text-primary" aria-hidden="true" />
            ) : (
              <Search className="w-4 h-4 text-on-surface-variant" aria-hidden="true" />
            )}
            <span>3. Pencarian Cmd+K</span>
          </button>
        </div>

        <div className="hidden lg:flex items-center gap-2 text-label-medium text-on-surface-variant">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span>Pratinjau interaktif, klik elemen di dalam untuk menguji</span>
        </div>
      </div>

      {/* Kontainer Utama Sandbox 3-Pane */}
      <div className="w-full rounded-[28px] bg-surface-container-low border border-outline-variant/60 shadow-xl overflow-hidden flex flex-col text-on-surface">
        {/* Mock Topbar Aplikasi */}
        <div className="h-14 px-4 sm:px-6 bg-surface-container border-b border-outline-variant/40 flex items-center justify-between gap-4 select-none">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span className="text-label-medium text-on-surface-variant truncate">
              Ruang Kerja Tim
            </span>
            <span className="text-on-surface-variant/40">/</span>
            <span className="text-label-large font-bold text-on-surface truncate">
              {activeMode === "search" && "Pencarian Cepat Workspace (Cmd+K)"}
              {activeMode !== "search" && selectedDocId === "notulensi" && "Notulensi Rapat Sprint & Arsitektur"}
              {activeMode !== "search" && selectedDocId === "sprint_kanban" && "Task Database: Sprint Tracker Q4"}
              {activeMode !== "search" && selectedDocId === "private_eval" && "Catatan Evaluasi Pribadi"}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Status Sync */}
            <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>Tersinkronisasi</span>
            </div>

            {/* Kolaborator Aktif */}
            <div className="flex -space-x-1.5">
              <div
                title="Raka (Admin)"
                className="w-7 h-7 rounded-full bg-primary text-on-primary text-[10px] font-bold flex items-center justify-center ring-2 ring-surface"
              >
                R
              </div>
              <div
                title="Nadia (Member)"
                className="w-7 h-7 rounded-full bg-tertiary text-on-tertiary text-[10px] font-bold flex items-center justify-center ring-2 ring-surface"
              >
                N
              </div>
            </div>
          </div>
        </div>

        {/* Workspace Body: 3-Pane di Desktop, Adaptif di Mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[460px]">
          {/* Pane 1: Interactive Navigation Tree (Desktop Only) */}
          <div className="hidden lg:flex lg:col-span-3 bg-surface-container border-r border-outline-variant/40 p-4 flex-col justify-between select-none text-left">
            <div className="flex flex-col gap-4">
              {/* Shared Teamspace Section */}
              <div className="flex flex-col gap-1">
                <span className="text-label-medium text-on-surface-variant px-2 font-semibold">
                  Shared Teamspace
                </span>

                <button
                  type="button"
                  onClick={() => handleSelectDoc("notulensi")}
                  className={cn(
                    "min-h-[40px] px-3 rounded-full text-label-large flex items-center gap-2.5 transition-colors motion-reduce:transition-none text-left cursor-pointer",
                    selectedDocId === "notulensi" && activeMode === "document"
                      ? "bg-secondary-container text-on-secondary-container font-semibold"
                      : "text-on-surface-variant hover:bg-surface-container-high"
                  )}
                >
                  <FileText className="w-4 h-4 text-primary shrink-0" />
                  <span className="truncate">Notulensi Rapat</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectDoc("sprint_kanban")}
                  className={cn(
                    "min-h-[40px] px-3 rounded-full text-label-large flex items-center gap-2.5 transition-colors motion-reduce:transition-none text-left cursor-pointer",
                    selectedDocId === "sprint_kanban" || activeMode === "kanban"
                      ? "bg-secondary-container text-on-secondary-container font-semibold"
                      : "text-on-surface-variant hover:bg-surface-container-high"
                  )}
                >
                  <Database className="w-4 h-4 text-primary shrink-0" />
                  <span className="truncate">Sprint Tracker Q4</span>
                </button>

                <div className="min-h-[40px] px-3 rounded-full text-label-large text-on-surface-variant flex items-center gap-2.5 opacity-60">
                  <FileText className="w-4 h-4 shrink-0" />
                  <span className="truncate">SOP &amp; Standar Kode</span>
                </div>
              </div>

              {/* Private Space Section (Interactive Toggle) */}
              <div className="flex flex-col gap-1 pt-3 border-t border-outline-variant/30">
                <div className="flex items-center justify-between px-2 text-label-medium text-on-surface-variant font-semibold">
                  <span>Private Space</span>
                  <Lock className="w-3.5 h-3.5 text-tertiary" />
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectDoc("private_eval")}
                  className={cn(
                    "min-h-[40px] px-3 rounded-full text-label-large flex items-center gap-2.5 transition-colors motion-reduce:transition-none text-left cursor-pointer",
                    selectedDocId === "private_eval" && activeMode === "document"
                      ? "bg-tertiary-container text-on-tertiary-container font-semibold"
                      : "text-on-surface-variant hover:bg-surface-container-high"
                  )}
                >
                  <FolderLock className="w-4 h-4 shrink-0 text-tertiary" />
                  <span className="truncate">Catatan Evaluasi Pribadi</span>
                </button>
              </div>
            </div>

            {/* Indikator Status Ruang */}
            <div className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant/30 text-[11px] text-on-surface-variant">
              {selectedDocId === "private_eval" ? (
                <div className="flex items-start gap-2">
                  <Lock className="w-3.5 h-3.5 text-tertiary shrink-0 mt-0.5" />
                  <span>Draf privat ini terisolasi dan hanya dapat diakses akun Anda (Anti-IDOR).</span>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <Globe className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <span>Dokumen ruang tim terbuka untuk seluruh anggota berizin.</span>
                </div>
              )}
            </div>
          </div>

          {/* Pane 2: Main Active Interactive Stage */}
          <div className="col-span-1 lg:col-span-6 bg-surface-container-lowest p-5 sm:p-7 flex flex-col gap-5 overflow-x-hidden border-b lg:border-b-0">
            {/* 1A. Mode Dokumen: Notulensi Rapat Tim */}
            {activeMode === "document" && selectedDocId === "notulensi" && (
              <div className="flex flex-col gap-5 text-left">
                {/* Header Dokumen dengan Progress Bar */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-label-medium text-primary">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Real-time CRDT Block Editor</span>
                    </div>
                    <span className="text-[11px] font-mono text-on-surface-variant">
                      {completedChecklistCount}/{totalChecklistCount} Selesai ({checklistPercentage}%)
                    </span>
                  </div>

                  <h3 className="font-[family-name:var(--font-jakarta)] text-title-large sm:text-headline-small font-bold text-on-surface">
                    Notulensi Rapat Sprint &amp; Arsitektur
                  </h3>

                  {/* Progress Bar M3 */}
                  <div className="w-full h-1.5 rounded-full bg-surface-container overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300 motion-reduce:transition-none"
                      style={{ width: `${checklistPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Simulasi Blok Teks dengan Live Cursor Nadia */}
                <div className="relative p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/40 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-label-medium text-on-surface-variant font-semibold">
                      Blok Catatan Arsitektur:
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-tertiary-container text-on-tertiary-container text-[11px] font-semibold">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{activeCommentResolved ? "0 Terbuka" : "1 Komentar"}</span>
                    </span>
                  </div>

                  <p className="text-sm text-on-surface leading-relaxed">
                    Sinkronisasi CRDT menggunakan Yjs melalui WebSocket port 1234.
                    Setiap dokumen memiliki ruang terisolasi sehingga konflik penimpaan teks tidak pernah terjadi.
                  </p>

                  {/* Visualisasi Live Cursor Nadia */}
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-tertiary text-on-tertiary text-[10px] font-bold w-fit shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary animate-ping" />
                    <span>Nadia sedang menyunting</span>
                  </div>
                </div>

                {/* Simulasi Checklist Interaktif */}
                <div className="flex flex-col gap-2">
                  <span className="text-label-large font-semibold text-on-surface">
                    Tugas Rilis yang Disepakati (Klik untuk mencentang):
                  </span>
                  {[
                    { key: "chk1", label: "Validasi magic bytes DOCX/PDF sisi server (anti-XSS)" },
                    { key: "chk2", label: "Transaksi kuota atomik 1 GB per ruang kerja" },
                    { key: "chk3", label: "Pencarian full-text Cmd+K terisolasi Private Space" },
                    { key: "chk4", label: "Tautkan notulensi ini ke kartu Kanban Sprint Tracker" },
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => toggleCheck(item.key)}
                      className={cn(
                        "w-full min-h-[44px] px-3.5 py-2 rounded-xl flex items-center gap-3 text-left transition-all motion-reduce:transition-none cursor-pointer",
                        "border border-outline-variant/40 hover:bg-surface-container",
                        checklist[item.key]
                          ? "bg-surface-container text-on-surface"
                          : "bg-surface-container-lowest text-on-surface-variant"
                      )}
                    >
                      {checklist[item.key] ? (
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-on-surface-variant shrink-0" />
                      )}
                      <span
                        className={cn(
                          "text-xs sm:text-sm font-medium",
                          checklist[item.key] && "line-through text-on-surface-variant"
                        )}
                      >
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 1B. Mode Dokumen: Private Space Evaluasi Pribadi */}
            {activeMode === "document" && selectedDocId === "private_eval" && (
              <div className="flex flex-col gap-5 text-left">
                {/* Header Private Space */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-label-medium text-tertiary">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Private Space — Anti-IDOR Terisolasi</span>
                  </div>
                  <h3 className="font-[family-name:var(--font-jakarta)] text-title-large sm:text-headline-small font-bold text-on-surface">
                    Catatan Evaluasi Pribadi
                  </h3>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-tertiary-container text-on-tertiary-container text-xs font-semibold w-fit">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Hanya terlihat oleh Anda (created_by terverifikasi)</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/40 space-y-3">
                  <p className="text-sm text-on-surface leading-relaxed">
                    Draf awal evaluasi arsitektur database. Halaman ini tidak akan muncul di kueri Cmd+K anggota lain
                    sampai Anda memindahkannya ke Shared Teamspace.
                  </p>
                  <div className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-xs font-mono text-on-surface-variant">
                    SELECT * FROM pages WHERE id = ? AND (space_type = &apos;teamspace&apos; OR created_by = current_user)
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-xs text-on-surface-variant">
                    Status: Draf Rahasia
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSelectDoc("notulensi")}
                    className="min-h-[40px] px-4 rounded-full bg-primary text-on-primary text-label-small font-bold hover:bg-primary/90 transition-colors cursor-pointer"
                  >
                    Beralih ke Teamspace
                  </button>
                </div>
              </div>
            )}

            {/* 2. Mode Papan Kanban Relasional */}
            {activeMode === "kanban" && (
              <div className="flex flex-col gap-4 text-left">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-label-medium text-primary">
                    <Database className="w-3.5 h-3.5" />
                    <span>Relational Task Database</span>
                  </div>
                  <h3 className="font-[family-name:var(--font-jakarta)] text-title-large font-bold text-on-surface">
                    Papan Kanban Sprint Q4
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    Klik kartu untuk memindahkan status tugas secara berurutan: Mulai dari To Do, In Progress, hingga Done.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(["todo", "in_progress", "done"] as const).map((colStatus) => {
                    const colLabels = {
                      todo: "To Do",
                      in_progress: "In Progress",
                      done: "Done",
                    };
                    const colTasks = tasks.filter((t) => t.status === colStatus);

                    return (
                      <div
                        key={colStatus}
                        className="p-3 rounded-2xl bg-surface-container-low flex flex-col gap-2.5 min-h-[240px]"
                      >
                        <div className="flex items-center justify-between px-1">
                          <span className="text-label-medium font-bold text-on-surface">
                            {colLabels[colStatus]}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-[10px] font-bold text-on-surface-variant font-mono">
                            {colTasks.length}
                          </span>
                        </div>

                        <div className="flex flex-col gap-2">
                          {colTasks.map((task) => {
                            const badge = PRIORITY_BADGES[task.priority];
                            const BadgeIcon = badge.icon;

                            return (
                              <button
                                key={task.id}
                                type="button"
                                onClick={() => advanceTaskStatus(task.id)}
                                className={cn(
                                  "w-full p-3 rounded-xl bg-card-surface border border-outline-variant/50 text-left flex flex-col gap-2.5 shadow-xs",
                                  "hover:border-primary transition-all motion-reduce:transition-none cursor-pointer active:scale-98"
                                )}
                              >
                                <span className="text-xs font-semibold text-on-surface line-clamp-2">
                                  {task.title}
                                </span>

                                <div className="flex items-center justify-between gap-1 text-[10px]">
                                  <span
                                    className={cn(
                                      "px-2 py-0.5 rounded-full font-semibold flex items-center gap-1",
                                      badge.containerClass
                                    )}
                                  >
                                    <BadgeIcon className="w-3 h-3" />
                                    <span>{badge.label}</span>
                                  </span>

                                  <span className="text-on-surface-variant truncate max-w-[80px]">
                                    {task.linkedDoc}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. Mode Pencarian Cmd+K Interaktif */}
            {activeMode === "search" && (
              <div className="flex flex-col gap-4 text-left">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-label-medium text-primary">
                    <Search className="w-3.5 h-3.5" />
                    <span>Quick Command &amp; Full-Text Search</span>
                  </div>
                  <h3 className="font-[family-name:var(--font-jakarta)] text-title-large font-bold text-on-surface">
                    Pencarian Instan Lintas Dokumen &amp; Tugas
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    Gunakan tombol panah &amp; Enter untuk memilih, atau klik kata kunci filter di bawah.
                  </p>
                </div>

                {/* Input Pencarian dengan Keyboard Listener */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    placeholder="Ketik judul, cuplikan dokumen, atau kartu tugas..."
                    className={cn(
                      "w-full h-12 pl-10 pr-20 rounded-xl bg-surface-container text-xs sm:text-sm text-on-surface",
                      "border border-outline focus:border-primary outline-none"
                    )}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-md bg-surface-container-highest text-[10px] font-mono text-on-surface-variant">
                    Cmd+K
                  </span>
                </div>

                {/* Chip Rekomendasi Kueri */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-on-surface-variant font-medium">
                    Filter cepat:
                  </span>
                  {["API", "Sprint", "Auth", "Private", "Semua"].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setSearchQuery(chip === "Semua" ? "" : chip)}
                      className={cn(
                        "px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer",
                        searchQuery.toLowerCase() === (chip === "Semua" ? "" : chip.toLowerCase())
                          ? "bg-secondary-container text-on-secondary-container font-semibold"
                          : "bg-surface-container text-on-surface hover:bg-surface-container-high"
                      )}
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                {/* Hasil Pencarian dengan Highlight Selected Index */}
                <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
                  {filteredSearchResults.length === 0 ? (
                    <div className="p-4 text-center text-xs text-on-surface-variant">
                      Tidak ditemukan hasil untuk &quot;{searchQuery}&quot;.
                    </div>
                  ) : (
                    filteredSearchResults.map((item, idx) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          if (item.type === "document") {
                            if (item.space === "private") {
                              handleSelectDoc("private_eval");
                            } else {
                              handleSelectDoc("notulensi");
                            }
                          } else {
                            setActiveMode("kanban");
                          }
                        }}
                        className={cn(
                          "p-3 rounded-xl border flex items-start justify-between gap-3 text-left transition-colors cursor-pointer",
                          idx === selectedSearchIndex
                            ? "bg-secondary-container/40 border-primary"
                            : "bg-surface-container border-outline-variant/40 hover:bg-surface-container-high"
                        )}
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          {item.type === "document" ? (
                            <FileText className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          ) : (
                            <Database className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                          )}
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-semibold text-on-surface truncate">
                              {item.title}
                            </span>
                            <span className="text-[11px] text-on-surface-variant line-clamp-1">
                              {item.snippet}
                            </span>
                          </div>
                        </div>

                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0",
                            item.space === "private"
                              ? "bg-tertiary-container text-on-tertiary-container flex items-center gap-1"
                              : "bg-surface-container-highest text-on-surface-variant"
                          )}
                        >
                          {item.space === "private" && <Lock className="w-2.5 h-2.5" />}
                          {item.space === "private" ? "Private" : "Teamspace"}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Pane 3: Right Supporting Drawer (Comments & Backlinks) */}
          <div className="col-span-1 lg:col-span-3 bg-surface-container-high border-t lg:border-t-0 lg:border-l border-outline-variant/40 p-4 sm:p-5 flex flex-col gap-4 text-left select-none">
            {/* Utas Komentar Terikat Blok */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-label-medium font-bold text-on-surface flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  <span>Komentar Inline</span>
                </span>
                <span
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full font-bold",
                    activeCommentResolved
                      ? "bg-surface-container-highest text-on-surface-variant"
                      : "bg-secondary-container text-on-secondary-container"
                  )}
                >
                  {activeCommentResolved ? "Terselesaikan" : "Terikat Blok"}
                </span>
              </div>

              <div
                className={cn(
                  "p-3.5 rounded-2xl bg-card-surface border border-outline-variant/40 flex flex-col gap-2 shadow-xs transition-opacity",
                  activeCommentResolved && "opacity-75"
                )}
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-on-surface">Raka Pratama</span>
                  <span className="text-[10px] text-on-surface-variant">Hari ini 10:14</span>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  <span className="inline-block px-1.5 py-0.2 rounded-full bg-secondary-container text-on-secondary-container font-semibold mr-1">
                    @Nadia
                  </span>
                  tolong pastikan validasi magic bytes DOCX/PDF sudah masuk ke transaksi kuota.
                </p>

                {/* Tombol Interaktif Tandai Selesai */}
                <div className="pt-2 border-t border-outline-variant/20 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveCommentResolved((prev) => !prev)}
                    className={cn(
                      "min-h-[32px] px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors",
                      activeCommentResolved
                        ? "bg-surface-container text-on-surface-variant hover:bg-surface-container-highest"
                        : "bg-primary-container text-on-primary-container hover:brightness-95"
                    )}
                  >
                    {activeCommentResolved ? (
                      <>
                        <RotateCcw className="w-3 h-3" />
                        <span>Buka Kembali</span>
                      </>
                    ) : (
                      <>
                        <CheckCheck className="w-3 h-3 text-primary" />
                        <span>Tandai Selesai</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Backlinks Otomatis */}
            <div className="flex flex-col gap-2.5 pt-3 border-t border-outline-variant/30">
              <div className="flex items-center justify-between">
                <span className="text-label-medium font-bold text-on-surface flex items-center gap-1.5">
                  <Link2 className="w-4 h-4 text-primary" />
                  <span>Tautan Balik (Backlinks)</span>
                </span>
                <span className="text-[10px] text-on-surface-variant font-medium">1 Relasi</span>
              </div>

              <div
                onClick={() => handleSelectDoc("sprint_kanban")}
                className="p-3 rounded-2xl bg-card-surface border border-outline-variant/40 flex items-center justify-between gap-2 shadow-xs cursor-pointer hover:border-primary transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Database className="w-3.5 h-3.5 text-secondary shrink-0" />
                  <span className="text-xs font-semibold text-on-surface truncate">
                    Sprint Tracker Q4
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-primary-container text-on-primary-container text-[10px] font-bold shrink-0">
                  TASK
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
