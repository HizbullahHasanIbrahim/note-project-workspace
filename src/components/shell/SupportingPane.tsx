"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Link2,
  History,
  Send,
  AlertCircle,
  Lock,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
import { useWorkspaceUIStore } from "@/stores/useWorkspaceUIStore";
import { cn } from "@/lib/utils";

interface SupportingPaneProps {
  workspaceId: string;
}

export function SupportingPane({ workspaceId }: SupportingPaneProps) {
  const {
    isSupportingPaneOpen,
    activeSupportingTab,
    setActiveSupportingTab,
    activeBacklinks,
  } = useWorkspaceUIStore();

  const [newComment, setNewComment] = useState("");

  if (!isSupportingPaneOpen) return null;

  const incomingBacklinks = activeBacklinks.filter(
    (b) => b.direction === "incoming"
  );
  const outgoingLinks = activeBacklinks.filter(
    (b) => b.direction === "outgoing"
  );

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
            <span>Backlinks</span>
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
                <span className="text-[10px] text-on-surface-variant">
                  5m lalu
                </span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-tertiary-container text-on-tertiary-container text-[11px] font-medium w-fit">
                <span>Blok Terikat</span>
              </div>

              <p className="text-body-medium text-on-surface text-xs leading-relaxed">
                Gunakan pemicu [[ untuk menautkan dokumen lain secara otomatis ke panel Backlinks.
              </p>
            </div>

            {/* Penanda Komentar Orphaned Sesuai PRD §8.1 */}
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
                <span className="text-[10px] text-on-surface-variant">
                  1j lalu
                </span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-error-container text-on-error-container text-[11px] font-medium w-fit">
                <AlertCircle className="w-3 h-3" />
                <span>Blok referensi telah dihapus</span>
              </div>

              <p className="text-body-medium text-on-surface text-xs leading-relaxed">
                Komentar lama tetap dipertahankan meski blok aslinya sudah dihapus.
              </p>
            </div>
          </div>
        )}

        {activeSupportingTab === "backlinks" && (
          <div className="flex flex-col gap-4">
            {/* Backlinks Masuk */}
            <div className="flex flex-col gap-2">
              <span className="text-label-medium text-on-surface-variant font-semibold px-1 flex items-center gap-1.5">
                <ArrowDownLeft className="w-3.5 h-3.5 text-primary" />
                Menautkan ke Halaman Ini ({incomingBacklinks.length})
              </span>

              {incomingBacklinks.length === 0 ? (
                <div className="p-3.5 rounded-2xl bg-surface-container text-xs text-on-surface-variant">
                  Belum ada halaman atau tugas lain yang menautkan halaman ini.
                </div>
              ) : (
                incomingBacklinks.map((item) =>
                  item.isPrivateMasked ? (
                    <div
                      key={item.id}
                      className="p-3 rounded-2xl bg-surface-container border border-outline-variant/40 flex items-center gap-2 text-xs text-on-surface-variant"
                    >
                      <Lock className="w-3.5 h-3.5 shrink-0" />
                      <span className="font-medium">[Halaman Privat]</span>
                    </div>
                  ) : (
                    <Link
                      key={item.id}
                      href={`/workspace/${workspaceId}/page/${item.pageId}`}
                      className="p-3 rounded-2xl bg-card-surface border border-outline-variant/40 hover:border-primary/50 transition-colors flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span>{item.icon || "📄"}</span>
                        <span className="font-semibold text-on-surface truncate">
                          {item.title}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-medium shrink-0">
                        {item.relationType === "task_note_link"
                          ? "Task"
                          : "Backlink"}
                      </span>
                    </Link>
                  )
                )
              )}
            </div>

            {/* Tautan Keluar */}
            <div className="flex flex-col gap-2">
              <span className="text-label-medium text-on-surface-variant font-semibold px-1 flex items-center gap-1.5">
                <ArrowUpRight className="w-3.5 h-3.5 text-secondary" />
                Tautan dari Halaman Ini ({outgoingLinks.length})
              </span>

              {outgoingLinks.length === 0 ? (
                <div className="p-3.5 rounded-2xl bg-surface-container text-xs text-on-surface-variant">
                  Ketik <code className="font-[family-name:var(--font-mono)]">[[</code> di editor untuk menautkan halaman terkait.
                </div>
              ) : (
                outgoingLinks.map((item) =>
                  item.isPrivateMasked ? (
                    <div
                      key={item.id}
                      className="p-3 rounded-2xl bg-surface-container border border-outline-variant/40 flex items-center gap-2 text-xs text-on-surface-variant"
                    >
                      <Lock className="w-3.5 h-3.5 shrink-0" />
                      <span className="font-medium">[Halaman Privat]</span>
                    </div>
                  ) : (
                    <Link
                      key={item.id}
                      href={`/workspace/${workspaceId}/page/${item.pageId}`}
                      className="p-3 rounded-2xl bg-card-surface border border-outline-variant/40 hover:border-primary/50 transition-colors flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span>{item.icon || "📄"}</span>
                        <span className="font-semibold text-on-surface truncate">
                          {item.title}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-primary-container text-on-primary-container text-[10px] font-medium shrink-0">
                        Terkait
                      </span>
                    </Link>
                  )
                )
              )}
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
                  <span className="font-semibold text-on-surface">
                    Snapshot CRDT Terbaru
                  </span>
                  <span className="text-[11px] text-on-surface-variant">
                    Tersimpan otomatis via Yjs
                  </span>
                </div>
                <span className="text-[11px] text-primary font-medium">
                  Aktif
                </span>
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
