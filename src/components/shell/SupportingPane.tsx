"use client";

import React, { useState } from "react";
import {
  MessageSquare,
  Link2,
  History,
  Send,
  CheckCircle2,
  User,
  Clock,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { useWorkspaceUIStore, SupportingTab } from "@/stores/useWorkspaceUIStore";
import { cn } from "@/lib/utils";

export function SupportingPane() {
  const {
    isSupportingPaneOpen,
    activeSupportingTab,
    setActiveSupportingTab,
  } = useWorkspaceUIStore();

  const [newComment, setNewComment] = useState("");

  if (!isSupportingPaneOpen) return null;

  return (
    <aside
      aria-label="Panel Pendukung (Supporting Pane)"
      className={cn(
        "w-[340px] shrink-0 h-full flex flex-col justify-between",
        "bg-surface-container-high border-l border-outline-variant/30 select-none",
        "transition-all duration-200"
      )}
    >
      {/* Tab Navigasi Segmented */}
      <div className="p-3 border-b border-outline-variant/30">
        <div className="grid grid-cols-3 p-1 rounded-full bg-surface-container gap-1">
          <button
            type="button"
            onClick={() => setActiveSupportingTab("comments")}
            className={cn(
              "min-h-[36px] rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-all",
              activeSupportingTab === "comments"
                ? "bg-secondary-container text-on-secondary-container shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Komentar</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSupportingTab("backlinks")}
            className={cn(
              "min-h-[36px] rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-all",
              activeSupportingTab === "backlinks"
                ? "bg-secondary-container text-on-secondary-container shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Tautan</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSupportingTab("history")}
            className={cn(
              "min-h-[36px] rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-all",
              activeSupportingTab === "history"
                ? "bg-secondary-container text-on-secondary-container shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            <History className="w-3.5 h-3.5" />
            <span>Riwayat</span>
          </button>
        </div>
      </div>

      {/* Konten Tab */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
        {activeSupportingTab === "comments" && (
          <div className="flex flex-col gap-3">
            <span className="text-label-medium text-on-surface-variant font-semibold px-1">
              Utas Komentar Aktif
            </span>

            {/* Contoh Komentar Terkait Blok */}
            <div className="p-3.5 rounded-2xl bg-card-surface border border-outline-variant/40 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary text-on-primary text-[10px] font-bold flex items-center justify-center">
                    R
                  </div>
                  <span className="text-xs font-semibold text-on-surface">
                    Raka Pratama
                  </span>
                </div>
                <span className="text-[10px] text-on-surface-variant">5m lalu</span>
              </div>

              {/* Tag referensi blok */}
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-tertiary-container text-on-tertiary-container text-[11px] font-medium w-fit">
                <span>Blok #4: Spesifikasi Target</span>
              </div>

              <p className="text-body-medium text-on-surface text-xs leading-relaxed">
                Tolong pastikan endpoint API auth sudah terverifikasi dengan Google OAuth sebelum sprint review minggu ini.
              </p>
            </div>

            {/* Contoh Orphaned Comment Sesuai PRD §8.1 */}
            <div className="p-3.5 rounded-2xl bg-card-surface border border-outline-variant/40 flex flex-col gap-2 opacity-85">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-tertiary text-on-tertiary text-[10px] font-bold flex items-center justify-center">
                    N
                  </div>
                  <span className="text-xs font-semibold text-on-surface">
                    Nadia Kusuma
                  </span>
                </div>
                <span className="text-[10px] text-on-surface-variant">1j lalu</span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-error-container text-on-error-container text-[11px] font-medium w-fit">
                <AlertCircle className="w-3 h-3" />
                <span>Blok referensi telah dihapus</span>
              </div>

              <p className="text-body-medium text-on-surface text-xs leading-relaxed">
                Catatan revisi format JSON sudah dipindahkan ke diagram arsitektur.
              </p>
            </div>
          </div>
        )}

        {activeSupportingTab === "backlinks" && (
          <div className="flex flex-col gap-3">
            <span className="text-label-medium text-on-surface-variant font-semibold px-1">
              Tugas Terkait (Relational Tasks)
            </span>

            <div className="p-3 rounded-2xl bg-card-surface border border-outline-variant/40 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-on-surface">Setup Yjs WebSocket</span>
                <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-medium">
                  In Progress
                </span>
              </div>
              <p className="text-xs text-on-surface-variant">
                Tenggat: 28 Nov 2026 • Penanggung Jawab: Nadia
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-card-surface border border-outline-variant/40 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-on-surface">Skema MySQL & Drizzle</span>
                <span className="px-2 py-0.5 rounded-full bg-primary-container text-on-primary-container text-[10px] font-medium">
                  Done
                </span>
              </div>
              <p className="text-xs text-on-surface-variant">
                Tenggat: 26 Nov 2026 • Penanggung Jawab: Raka
              </p>
            </div>
          </div>
        )}

        {activeSupportingTab === "history" && (
          <div className="flex flex-col gap-3">
            <span className="text-label-medium text-on-surface-variant font-semibold px-1">
              Riwayat Perubahan Dokumen
            </span>

            <div className="flex flex-col gap-2">
              <div className="p-3 rounded-xl bg-card-surface border border-outline-variant/40 flex items-center justify-between text-xs">
                <div className="flex flex-col">
                  <span className="font-semibold text-on-surface">Versi v1.2</span>
                  <span className="text-[11px] text-on-surface-variant">2 menit lalu oleh Nadia</span>
                </div>
                <span className="text-[11px] text-primary font-medium">Saat Ini</span>
              </div>

              <div className="p-3 rounded-xl bg-surface-container flex items-center justify-between text-xs opacity-80">
                <div className="flex flex-col">
                  <span className="font-medium text-on-surface">Versi v1.1</span>
                  <span className="text-[11px] text-on-surface-variant">1 jam lalu oleh Raka</span>
                </div>
                <button
                  type="button"
                  className="text-xs text-primary font-medium hover:underline"
                >
                  Pulihkan
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Balasan Komentar di Bawah */}
      {activeSupportingTab === "comments" && (
        <div className="p-3 border-t border-outline-variant/30 bg-surface-container">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newComment.trim()) return;
              setNewComment("");
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Tulis balasan atau gunakan @..."
              className={cn(
                "flex-1 h-11 px-3.5 rounded-xl bg-surface-container-highest",
                "text-on-surface placeholder:text-on-surface-variant text-xs",
                "border border-outline-variant focus:border-primary focus-visible:ring-1 focus-visible:ring-primary outline-none"
              )}
            />
            <button
              type="submit"
              aria-label="Kirim balasan komentar"
              className={cn(
                "min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center",
                "bg-primary text-on-primary hover:brightness-95 transition-all",
                "focus-visible:ring-2 focus-visible:ring-outline outline-none shrink-0"
              )}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </aside>
  );
}
