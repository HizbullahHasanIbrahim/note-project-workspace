"use client";

import { useState } from "react";
import {
  Check,
  CheckCircle2,
  Circle,
  Clock,
  FileText,
  Kanban,
  Link2,
  MessageSquare,
  Moon,
  Search,
  Sparkles,
  Sun,
} from "lucide-react";

interface DemoTask {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "done";
  priorityLabel: string;
  linkedDoc: string;
}

const INITIAL_DEMO_TASKS: DemoTask[] = [
  {
    id: "t-1",
    title: "Finalisasi skema relasional MySQL",
    status: "done",
    priorityLabel: "High",
    linkedDoc: "Project Brief Q4",
  },
  {
    id: "t-2",
    title: "Sinkronisasi blok editor CRDT < 200ms",
    status: "in_progress",
    priorityLabel: "Urgent",
    linkedDoc: "Spec WebSocket",
  },
  {
    id: "t-3",
    title: "Audit magic bytes lampiran 10 MB",
    status: "todo",
    priorityLabel: "Medium",
    linkedDoc: "Checklist Rilis",
  },
];

/**
 * Pratinjau interaktif antarmuka 3-pane (Dokumen Real-Time + Kanban Sprint Board)
 * untuk Landing Page menggunakan 100% token warna semantik Material You.
 */
export function LandingShowcase() {
  const [activeTab, setActiveTab] = useState<"editor" | "kanban">("editor");
  const [isDarkPreview, setIsDarkPreview] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({
    spec: true,
    kanban: false,
    quota: false,
  });
  const [tasks, setTasks] = useState<DemoTask[]>(INITIAL_DEMO_TASKS);

  const toggleChecklist = (key: string) => {
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const cycleTaskStatus = (id: string) => {
    const nextMap: Record<DemoTask["status"], DemoTask["status"]> = {
      todo: "in_progress",
      in_progress: "done",
      done: "todo",
    };
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: nextMap[t.status] } : t))
    );
  };

  return (
    <section
      aria-label="Pratinjau Interaktif Ruang Kerja 3-Pane"
      className="w-full flex flex-col gap-4"
    >
      {/* Kontrol Pratinjau: Segmented Button M3 & Theme Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Pilih mode pratinjau"
          className="inline-flex rounded-full border border-outline bg-surface-container-low overflow-hidden divide-x divide-outline"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "editor"}
            onClick={() => setActiveTab("editor")}
            className={`min-h-[44px] px-4 inline-flex items-center gap-2 text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
              activeTab === "editor"
                ? "bg-secondary-container text-on-secondary-container"
                : "text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            {activeTab === "editor" ? (
              <Check className="w-4 h-4" aria-hidden="true" />
            ) : (
              <FileText className="w-4 h-4" aria-hidden="true" />
            )}
            <span>3-Pane Editor & Backlinks</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "kanban"}
            onClick={() => setActiveTab("kanban")}
            className={`min-h-[44px] px-4 inline-flex items-center gap-2 text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
              activeTab === "kanban"
                ? "bg-secondary-container text-on-secondary-container"
                : "text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            {activeTab === "kanban" ? (
              <Check className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Kanban className="w-4 h-4" aria-hidden="true" />
            )}
            <span>Kanban Task Database</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsDarkPreview((p) => !p)}
          className="min-h-[44px] px-4 rounded-full border border-outline-variant bg-surface-container-low text-xs font-medium text-on-surface inline-flex items-center gap-2 hover:bg-surface-container-high transition-colors cursor-pointer"
        >
          {isDarkPreview ? (
            <>
              <Sun className="w-4 h-4 text-primary" aria-hidden="true" />
              <span>Pratinjau Terang</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-primary" aria-hidden="true" />
              <span>Pratinjau Gelap M3</span>
            </>
          )}
        </button>
      </div>

      {/* Kontainer Pratinjau Shell */}
      <div
        className={
          isDarkPreview
            ? "dark rounded-[28px] bg-surface text-on-surface border border-outline-variant/60 overflow-hidden shadow-xl"
            : "rounded-[28px] bg-surface text-on-surface border border-outline-variant/60 overflow-hidden shadow-xl"
        }
      >
        {/* Mock Topbar */}
        <div className="h-12 px-4 bg-surface border-b border-outline-variant/40 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold text-on-surface-variant truncate">
              Teamspace / Sprint Q4
            </span>
            <span className="text-on-surface-variant">/</span>
            <span className="font-semibold text-on-surface truncate">
              {activeTab === "editor" ? "Project Brief" : "Sprint Tracker"}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container text-primary font-medium">
              <span className="w-2 h-2 rounded-full bg-primary" />
              Tersimpan
            </span>
            <div className="flex -space-x-1">
              <span className="w-6 h-6 rounded-full bg-primary text-on-primary text-[10px] font-bold flex items-center justify-center ring-2 ring-surface">
                R
              </span>
              <span className="w-6 h-6 rounded-full bg-tertiary text-on-tertiary text-[10px] font-bold flex items-center justify-center ring-2 ring-surface">
                N
              </span>
            </div>
          </div>
        </div>

        {activeTab === "editor" ? (
          <div className="grid grid-cols-1 md:grid-cols-12 min-h-[340px]">
            {/* Pane Kiri: NavDrawer */}
            <div className="hidden md:flex md:col-span-3 bg-surface-container-low border-r border-outline-variant/40 p-3 flex-col gap-3 text-xs">
              <div className="px-3 py-2 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Cari cepat...</span>
                </span>
                <span className="font-mono text-[10px]">⌘K</span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="px-2 text-[11px] font-semibold text-on-surface-variant">
                  Shared Teamspace
                </span>
                <div className="px-3 py-2 rounded-full bg-secondary-container text-on-secondary-container font-semibold">
                  📄 Project Brief
                </div>
                <div className="px-3 py-2 rounded-full text-on-surface-variant pl-6">
                  📊 Sprint Tracker
                </div>
                <div className="px-3 py-2 rounded-full text-on-surface-variant pl-6">
                  📝 Meeting Notes
                </div>
              </div>

              <div className="flex flex-col gap-1 pt-2 border-t border-outline-variant/30">
                <span className="px-2 text-[11px] font-semibold text-on-surface-variant">
                  Private Space
                </span>
                <div className="px-3 py-2 rounded-full text-on-surface-variant">
                  🔒 Draf Catatan Raka
                </div>
              </div>
            </div>

            {/* Pane Tengah: Editor Kolaboratif */}
            <div className="md:col-span-6 bg-surface-container-lowest p-5 sm:p-6 flex flex-col gap-4 text-left">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-on-surface">
                  🚀 Project Brief MVP
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-tertiary-container text-on-tertiary-container text-[11px] font-medium inline-flex items-center gap-1">
                  <Sparkles className="w-3 h-3" aria-hidden="true" />
                  Live CRDT
                </span>
              </div>

              <p className="text-sm text-on-surface leading-relaxed border-l-2 border-tertiary pl-3 bg-tertiary-container/25 py-2 rounded-r-xl">
                Keputusan sinkronisasi:{" "}
                <span className="px-1.5 py-0.5 rounded-full bg-primary text-on-primary text-[11px] font-medium">
                  Nadia sedang mengetik
                </span>{" "}
                tautkan catatan keputusan ke papan sprint tanpa berpindah
                aplikasi.
              </p>

              {/* Checklist Interaktif */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-on-surface-variant">
                  Coba klik daftar periksa langsung:
                </span>
                {[
                  { id: "spec", label: "Kunci transaksi kuota 20 anggota & 1 GB" },
                  { id: "kanban", label: "Hubungkan Meeting Notes ke kartu Kanban" },
                  { id: "quota", label: "Aktifkan Version History tiap 10 menit" },
                ].map((item) => {
                  const checked = Boolean(checkedItems[item.id]);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleChecklist(item.id)}
                      className="min-h-[40px] px-3 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container flex items-center gap-2.5 text-left text-xs text-on-surface transition-colors cursor-pointer"
                    >
                      {checked ? (
                        <CheckCircle2
                          className="w-4 h-4 text-primary shrink-0"
                          aria-hidden="true"
                        />
                      ) : (
                        <Circle
                          className="w-4 h-4 text-on-surface-variant shrink-0"
                          aria-hidden="true"
                        />
                      )}
                      <span className={checked ? "line-through opacity-65" : ""}>
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pane Kanan: Supporting Pane */}
            <div className="md:col-span-3 bg-surface-container-high border-t md:border-t-0 md:border-l border-outline-variant/40 p-3 flex flex-col gap-3 text-left text-xs">
              <div className="p-3 rounded-2xl bg-card-surface border border-outline-variant/40 flex flex-col gap-1.5">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
                  <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
                  Komentar Inline
                </span>
                <p className="text-on-surface leading-relaxed">
                  <span className="px-1.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-medium">
                    @Nadia Kusuma
                  </span>{" "}
                  tolong cek validasi magic bytes upload PNG/PDF.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-card-surface border border-outline-variant/40 flex flex-col gap-1.5">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-on-surface-variant">
                  <Link2 className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                  Backlinks Aktif
                </span>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-on-surface truncate">
                    Sprint Board Q4
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-medium">
                    Task
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Tab Pratinjau Kanban Interaktif */
          <div className="p-5 bg-surface-container-lowest min-h-[340px] flex flex-col gap-4 text-left">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-on-surface">
                  Sprint Tracker Interaktif
                </h3>
                <p className="text-xs text-on-surface-variant">
                  Klik kartu tugas di bawah untuk memindahkan statusnya lintas kolom.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(
                [
                  { id: "todo", label: "To Do", Icon: Circle },
                  { id: "in_progress", label: "In Progress", Icon: Clock },
                  { id: "done", label: "Done", Icon: CheckCircle2 },
                ] as const
              ).map(({ id, label, Icon }) => {
                const colTasks = tasks.filter((t) => t.status === id);
                return (
                  <div
                    key={id}
                    className="rounded-2xl bg-surface-container p-3 flex flex-col gap-2.5 min-h-[220px]"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-on-surface">
                      <span className="inline-flex items-center gap-1.5">
                        <Icon className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                        <span>{label}</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant">
                        {colTasks.length}
                      </span>
                    </div>

                    {colTasks.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => cycleTaskStatus(t.id)}
                        className="rounded-2xl bg-card-surface p-3 border border-outline-variant/50 hover:border-primary/60 text-left flex flex-col gap-2 transition-colors cursor-pointer"
                      >
                        <span className="text-xs font-semibold text-on-surface">
                          {t.title}
                        </span>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="px-2 py-0.5 rounded-full bg-tertiary-container text-on-tertiary-container font-medium">
                            {t.priorityLabel}
                          </span>
                          <span className="text-on-surface-variant truncate max-w-[130px]">
                            🔗 {t.linkedDoc}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
