"use client";

import React, { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowDownLeft,
  AtSign,
  CheckCircle2,
  History,
  Link2,
  Lock,
  MessageSquare,
  Reply,
  RotateCcw,
  Save,
  Send,
  X,
} from "lucide-react";
import {
  createCommentAction,
  resolveCommentAction,
} from "@/app/workspace/[workspaceId]/comment-actions";
import {
  createPageVersionAction,
  restorePageVersionAction,
} from "@/app/workspace/[workspaceId]/version-actions";
import { formatBytesCompact } from "@/lib/attachments";
import { canComment, canEditTeamspace, type WorkspaceRole } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import {
  useWorkspaceUIStore,
  type ActiveCommentItem,
  type ActiveVersionItem,
  type WorkspaceMemberSummary,
} from "@/stores/useWorkspaceUIStore";

interface SupportingPaneProps {
  workspaceId: string;
  userRole: WorkspaceRole;
  currentUserId: string;
  members: WorkspaceMemberSummary[];
}

function formatShortTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

/**
 * Merender teks komentar dengan menyorot @mention anggota workspace menggunakan token semantik M3.
 */
function renderCommentContent(
  text: string,
  members: WorkspaceMemberSummary[]
): React.ReactNode {
  const handles = members
    .map((m) => `@${m.fullName.trim()}`)
    .filter((h) => h.length > 1)
    .sort((a, b) => b.length - a.length);

  if (handles.length === 0) return text;

  const escapedHandles = handles.map((h) =>
    h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  );
  const regex = new RegExp(`(${escapedHandles.join("|")})`, "gi");
  const parts = text.split(regex);

  return parts.map((part, idx) => {
    const isMention = handles.some(
      (h) => h.toLowerCase() === part.toLowerCase()
    );
    if (isMention) {
      return (
        <span
          key={idx}
          className="inline-block px-1.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-medium text-[11px]"
        >
          {part}
        </span>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

export function SupportingPane({
  workspaceId,
  userRole,
  members,
}: SupportingPaneProps) {
  const router = useRouter();
  const {
    isSupportingPaneOpen,
    setSupportingPaneOpen,
    activeSupportingTab,
    setActiveSupportingTab,
    activeBacklinks,
    activePageId,
    activeComments,
    setActiveComments,
    activeSelectedBlock,
    setActiveSelectedBlock,
    activeVersions,
    setActiveVersions,
    setActivePageTitle,
  } = useWorkspaceUIStore();

  const [newComment, setNewComment] = useState("");
  const [replyToComment, setReplyToComment] =
    useState<ActiveCommentItem | null>(null);
  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const [mentionedIds, setMentionedIds] = useState<string[]>([]);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [versionFeedback, setVersionFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isPendingComment, startCommentTransition] = useTransition();
  const [isPendingVersion, startVersionTransition] = useTransition();

  const userCanWriteComment = canComment(userRole);
  const userCanEditPage = canEditTeamspace(userRole);

  // Tutup Supporting Pane otomatis saat pertama dimuat di tablet/mobile agar kanvas penuh terbaca
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setSupportingPaneOpen(false);
    }
  }, [setSupportingPaneOpen]);

  useEffect(() => {
    setVersionFeedback(null);
  }, [activePageId]);

  // Kelompokkan komentar menjadi utas induk beserta balasan berurutan
  const commentThreads = useMemo(() => {
    const roots = activeComments.filter((c) => !c.parentCommentId);
    const repliesMap = new Map<string, ActiveCommentItem[]>();
    for (const c of activeComments) {
      if (!c.parentCommentId) continue;
      const list = repliesMap.get(c.parentCommentId) ?? [];
      list.push(c);
      repliesMap.set(c.parentCommentId, list);
    }
    return roots.map((root) => ({
      root,
      replies: repliesMap.get(root.id) ?? [],
    }));
  }, [activeComments]);

  if (!isSupportingPaneOpen) return null;

  const incomingBacklinks = activeBacklinks.filter(
    (b) => b.direction === "incoming"
  );
  const outgoingLinks = activeBacklinks.filter(
    (b) => b.direction === "outgoing"
  );

  const insertMention = (member: WorkspaceMemberSummary) => {
    const handle = `@${member.fullName}`;
    setNewComment((prev) => {
      const separator = prev.length > 0 && !prev.endsWith(" ") ? " " : "";
      return `${prev}${separator}${handle} `;
    });
    setMentionedIds((prev) =>
      prev.includes(member.userId) ? prev : [...prev, member.userId]
    );
    setShowMentionPicker(false);
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userCanWriteComment || !activePageId || isPendingComment) return;
    const trimmed = newComment.trim();
    if (!trimmed) return;

    setCommentError(null);
    startCommentTransition(async () => {
      const res = await createCommentAction({
        workspaceId,
        pageId: activePageId,
        blockId: replyToComment
          ? replyToComment.blockId
          : activeSelectedBlock?.id ?? null,
        parentCommentId: replyToComment?.id ?? null,
        content: trimmed,
        mentionedUserIds: mentionedIds,
      });

      if (!res.success || !res.comment) {
        setCommentError(res.error ?? "Gagal mengirim komentar.");
        return;
      }

      setActiveComments([...activeComments, res.comment]);
      setNewComment("");
      setReplyToComment(null);
      setMentionedIds([]);
      setShowMentionPicker(false);
      router.refresh();
    });
  };

  const handleToggleResolve = (comment: ActiveCommentItem) => {
    if (!userCanWriteComment || !activePageId) return;
    const nextResolved = !comment.isResolved;
    const prevComments = activeComments;
    setCommentError(null);

    setActiveComments(
      activeComments.map((c) =>
        c.id === comment.id ? { ...c, isResolved: nextResolved } : c
      )
    );

    startCommentTransition(async () => {
      const res = await resolveCommentAction({
        workspaceId,
        pageId: activePageId,
        commentId: comment.id,
        isResolved: nextResolved,
      });

      if (!res.success) {
        setActiveComments(prevComments);
        setCommentError(res.error ?? "Gagal mengubah status komentar.");
        return;
      }
      router.refresh();
    });
  };

  const resolveBacklinkHref = (item: (typeof activeBacklinks)[number]) => {
    if (item.pageType === "task_item" && item.databasePageId) {
      return `/workspace/${workspaceId}/database/${item.databasePageId}?task=${item.pageId}`;
    }
    if (item.pageType === "database") {
      return `/workspace/${workspaceId}/database/${item.pageId}`;
    }
    return `/workspace/${workspaceId}/page/${item.pageId}`;
  };

  const handleSaveVersionSnapshot = () => {
    if (!userCanEditPage || !activePageId || isPendingVersion) return;
    setVersionFeedback(null);
    startVersionTransition(async () => {
      const res = await createPageVersionAction({
        workspaceId,
        pageId: activePageId,
      });
      if (!res.success || !res.version) {
        setVersionFeedback({
          type: "error",
          text: res.error ?? "Gagal menyimpan snapshot versi halaman.",
        });
        return;
      }
      setActiveVersions([res.version, ...activeVersions]);
      setVersionFeedback({
        type: "success",
        text: "Snapshot versi berhasil disimpan.",
      });
      router.refresh();
    });
  };

  const handleRestoreVersion = (version: ActiveVersionItem) => {
    if (!userCanEditPage || !activePageId || isPendingVersion) return;
    setVersionFeedback(null);
    startVersionTransition(async () => {
      const res = await restorePageVersionAction({
        workspaceId,
        pageId: activePageId,
        versionId: version.id,
      });
      if (!res.success) {
        setVersionFeedback({
          type: "error",
          text: res.error ?? "Gagal memulihkan versi halaman.",
        });
        return;
      }

      if (res.restoredTitle) {
        setActivePageTitle(res.restoredTitle);
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("npw:restore-version", {
            detail: {
              pageId: activePageId,
              crdtBase64: res.restoredCrdtBase64 ?? null,
            },
          })
        );
      }

      setVersionFeedback({
        type: "success",
        text: `Versi "${version.titleSnapshot}" berhasil dipulihkan.`,
      });
      router.refresh();
    });
  };

  return (
    <div
      className="fixed inset-0 z-40 bg-scrim/40 flex justify-end lg:static lg:inset-auto lg:z-auto lg:bg-transparent lg:block"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          setSupportingPaneOpen(false);
        }
      }}
    >
      <aside
        aria-label="Panel Pendukung (Supporting Pane)"
        className={cn(
          "w-full max-w-[340px] lg:w-[340px] shrink-0 h-full flex flex-col justify-between",
          "bg-surface-container-high border-l border-outline-variant/30 select-none shadow-2xl lg:shadow-none",
          "transition-all duration-200"
        )}
      >
        {/* Tab Navigasi Segmented & Tombol Tutup Tablet/Mobile */}
        <div className="p-3 border-b border-outline-variant/30 flex items-center gap-2">
          <div className="flex-1 grid grid-cols-3 p-1 rounded-full bg-surface-container gap-1">
            <button
              type="button"
              onClick={() => setActiveSupportingTab("comments")}
              className={cn(
                "min-h-[36px] rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                activeSupportingTab === "comments"
                  ? "bg-secondary-container text-on-secondary-container shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Komentar</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSupportingTab("backlinks")}
              className={cn(
                "min-h-[36px] rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                activeSupportingTab === "backlinks"
                  ? "bg-secondary-container text-on-secondary-container shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              <Link2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Backlinks</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSupportingTab("history")}
              className={cn(
                "min-h-[36px] rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                activeSupportingTab === "history"
                  ? "bg-secondary-container text-on-secondary-container shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              <History className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Riwayat</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setSupportingPaneOpen(false)}
            aria-label="Tutup panel pendukung"
            className="lg:hidden min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-highest cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

      {/* Konten Tab */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 select-text">
        {activeSupportingTab === "comments" && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-label-medium text-on-surface-variant font-semibold">
                Utas Komentar ({commentThreads.length})
              </span>
            </div>

            {commentError && (
              <div
                role="alert"
                className="p-3 rounded-2xl bg-error-container text-on-error-container text-xs flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{commentError}</span>
              </div>
            )}

            {!activePageId ? (
              <div className="p-3.5 rounded-2xl bg-surface-container text-xs text-on-surface-variant">
                Buka sebuah halaman dokumen untuk melihat dan menambahkan utas
                komentar inline.
              </div>
            ) : commentThreads.length === 0 ? (
              <div className="p-3.5 rounded-2xl bg-surface-container text-xs text-on-surface-variant">
                Belum ada komentar di halaman ini. Klik sebuah blok paragraf di
                editor lalu tulis komentar atau gunakan @mention.
              </div>
            ) : (
              commentThreads.map(({ root, replies }) => (
                <div
                  key={root.id}
                  className={cn(
                    "p-3.5 rounded-2xl bg-card-surface border border-outline-variant/40 flex flex-col gap-2.5",
                    root.isResolved && "opacity-70"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-primary text-on-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                        {root.authorName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-semibold text-on-surface truncate">
                        {root.authorName}
                      </span>
                    </div>
                    <span className="text-[10px] text-on-surface-variant shrink-0">
                      {formatShortTime(root.createdAtIso)}
                    </span>
                  </div>

                  {/* Badge penanda blok terikat atau blok referensi telah dihapus (PRD §8.1) */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {root.blockId && root.isBlockDeleted && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-error-container text-on-error-container text-[11px] font-medium w-fit">
                        <AlertCircle className="w-3 h-3 shrink-0" aria-hidden="true" />
                        <span>Blok referensi telah dihapus</span>
                      </div>
                    )}
                    {root.blockId && !root.isBlockDeleted && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-tertiary-container text-on-tertiary-container text-[11px] font-medium w-fit">
                        <span>Blok Terikat</span>
                      </div>
                    )}
                    {root.isResolved && (
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-container text-on-primary-container text-[11px] font-medium">
                        <CheckCircle2 className="w-3 h-3 shrink-0" aria-hidden="true" />
                        <span>Selesai</span>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-on-surface leading-relaxed whitespace-pre-wrap break-words">
                    {renderCommentContent(root.content, members)}
                  </p>

                  {/* Balasan utas */}
                  {replies.length > 0 && (
                    <div className="flex flex-col gap-2 mt-1 pl-3 border-l-2 border-outline-variant/60">
                      {replies.map((reply) => (
                        <div key={reply.id} className="flex flex-col gap-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-semibold text-on-surface">
                              {reply.authorName}
                            </span>
                            <span className="text-[10px] text-on-surface-variant">
                              {formatShortTime(reply.createdAtIso)}
                            </span>
                          </div>
                          <p className="text-xs text-on-surface-variant leading-relaxed whitespace-pre-wrap break-words">
                            {renderCommentContent(reply.content, members)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {userCanWriteComment && (
                    <div className="flex items-center justify-between pt-1 border-t border-outline-variant/30">
                      <button
                        type="button"
                        onClick={() => setReplyToComment(root)}
                        className="min-h-[36px] px-2.5 rounded-full inline-flex items-center gap-1 text-[11px] font-medium text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors cursor-pointer"
                      >
                        <Reply className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Balas</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleResolve(root)}
                        className="min-h-[36px] px-2.5 rounded-full inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                      >
                        {root.isResolved ? (
                          <>
                            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Buka lagi</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Selesaikan</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeSupportingTab === "backlinks" && (
          <div className="flex flex-col gap-4">
            {/* Backlinks Masuk */}
            <div className="flex flex-col gap-2">
              <span className="text-label-medium text-on-surface-variant font-semibold px-1 flex items-center gap-1.5">
                <ArrowDownLeft className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
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
                      <Lock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span className="font-medium">[Halaman Privat]</span>
                    </div>
                  ) : (
                    <Link
                      key={item.id}
                      href={resolveBacklinkHref(item)}
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
              <span className="text-label-medium text-on-surface-variant font-semibold px-1">
                Tautan Keluar ({outgoingLinks.length})
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
                      <Lock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span className="font-medium">[Halaman Privat]</span>
                    </div>
                  ) : (
                    <Link
                      key={item.id}
                      href={resolveBacklinkHref(item)}
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
            <div className="flex items-center justify-between gap-2 px-1">
              <span className="text-label-medium text-on-surface-variant font-semibold">
                Riwayat Versi ({activeVersions.length})
              </span>
            </div>

            {activePageId && userCanEditPage && (
              <button
                type="button"
                disabled={isPendingVersion}
                onClick={handleSaveVersionSnapshot}
                className="min-h-[44px] w-full px-4 rounded-full bg-secondary-container text-on-secondary-container text-xs font-semibold flex items-center justify-center gap-2 hover:brightness-95 transition-all disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-outline"
              >
                <Save className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>
                  {isPendingVersion
                    ? "Menyimpan snapshot..."
                    : "Simpan Snapshot Versi"}
                </span>
              </button>
            )}

            {versionFeedback && (
              <div
                role="status"
                className={cn(
                  "p-3 rounded-2xl text-xs flex items-center gap-2",
                  versionFeedback.type === "error"
                    ? "bg-error-container text-on-error-container"
                    : "bg-primary-container text-on-primary-container"
                )}
              >
                {versionFeedback.type === "error" ? (
                  <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                )}
                <span>{versionFeedback.text}</span>
              </div>
            )}

            {!activePageId ? (
              <div className="p-3.5 rounded-2xl bg-surface-container text-xs text-on-surface-variant">
                Buka sebuah halaman dokumen untuk melihat dan memulihkan riwayat
                snapshot versi.
              </div>
            ) : activeVersions.length === 0 ? (
              <div className="p-3.5 rounded-2xl bg-surface-container text-xs text-on-surface-variant">
                Belum ada snapshot tersimpan. Snapshot dibuat otomatis tiap 10
                menit saat mengedit atau manual lewat tombol di atas.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {activeVersions.map((version) => (
                  <div
                    key={version.id}
                    className="p-3.5 rounded-2xl bg-card-surface border border-outline-variant/40 flex flex-col gap-2.5 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-on-surface truncate">
                          {version.titleSnapshot}
                        </span>
                        <span className="text-[11px] text-on-surface-variant truncate">
                          {version.authorName} ·{" "}
                          {formatShortTime(version.createdAtIso)}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant shrink-0">
                        {formatBytesCompact(version.snapshotBytes)}
                      </span>
                    </div>

                    {userCanEditPage && (
                      <button
                        type="button"
                        disabled={isPendingVersion}
                        onClick={() => handleRestoreVersion(version)}
                        className="min-h-[38px] px-3 rounded-full border border-outline text-primary font-medium text-[11px] inline-flex items-center justify-center gap-1.5 hover:bg-primary/10 transition-colors disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-outline"
                      >
                        <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Pulihkan Versi</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Komentar & Mention di Bawah */}
      {activeSupportingTab === "comments" && activePageId && (
        <div className="p-3 border-t border-outline-variant/30 bg-surface-container flex flex-col gap-2 relative">
          {!userCanWriteComment ? (
            <p className="text-xs text-on-surface-variant px-1 py-1">
              Mode Read-Only: Peran Viewer tidak dapat menambahkan komentar.
            </p>
          ) : (
            <>
              {/* Indikator target balasan / blok terpilih */}
              {replyToComment ? (
                <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-secondary-container/70 text-on-secondary-container text-[11px]">
                  <span className="truncate">
                    Membalas <strong>{replyToComment.authorName}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setReplyToComment(null)}
                    aria-label="Batalkan balasan utas"
                    className="p-0.5 rounded-full hover:bg-on-secondary-container/10 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              ) : (
                activeSelectedBlock && (
                  <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-tertiary-container/70 text-on-tertiary-container text-[11px]">
                    <span className="truncate">
                      Terikat blok:{" "}
                      <em>
                        &ldquo;
                        {activeSelectedBlock.preview ||
                          activeSelectedBlock.id.slice(0, 8)}
                        &rdquo;
                      </em>
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveSelectedBlock(null)}
                      aria-label="Lepas ikatan blok dan tulis komentar umum halaman"
                      className="p-0.5 rounded-full hover:bg-on-tertiary-container/10 cursor-pointer shrink-0"
                    >
                      <X className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                )
              )}

              {/* Picker @mention anggota */}
              {showMentionPicker && members.length > 0 && (
                <div
                  role="listbox"
                  aria-label="Pilih anggota untuk di-mention"
                  className="rounded-xl bg-surface-container-highest border border-outline-variant/60 shadow-lg max-h-40 overflow-y-auto p-1 flex flex-col gap-0.5"
                >
                  {members.map((member) => (
                    <button
                      key={member.userId}
                      type="button"
                      onClick={() => insertMention(member)}
                      className="min-h-[36px] px-2.5 py-1.5 rounded-lg text-left text-xs text-on-surface hover:bg-secondary-container hover:text-on-secondary-container flex items-center justify-between gap-2 cursor-pointer"
                    >
                      <span className="font-medium truncate">
                        {member.fullName}
                      </span>
                      <span className="text-[10px] text-on-surface-variant capitalize">
                        {member.role}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              <form
                onSubmit={handleSubmitComment}
                className="flex items-center gap-1.5"
              >
                <button
                  type="button"
                  onClick={() => setShowMentionPicker((prev) => !prev)}
                  aria-label="Sematkan sebutan anggota (@mention)"
                  className={cn(
                    "min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center shrink-0 transition-colors cursor-pointer",
                    showMentionPicker
                      ? "bg-secondary-container text-on-secondary-container"
                      : "hover:bg-surface-container-highest text-on-surface-variant"
                  )}
                >
                  <AtSign className="w-4 h-4" aria-hidden="true" />
                </button>

                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewComment(val);
                    if (val.endsWith("@")) {
                      setShowMentionPicker(true);
                    }
                  }}
                  placeholder={
                    replyToComment
                      ? "Tulis balasan komentar..."
                      : activeSelectedBlock
                      ? "Komentari blok ini (@mention)..."
                      : "Tulis komentar halaman (@mention)..."
                  }
                  className={cn(
                    "flex-1 min-w-0 h-11 px-3 rounded-xl bg-surface-container-highest",
                    "text-on-surface placeholder:text-on-surface-variant text-xs",
                    "border border-outline-variant focus:border-primary focus-visible:ring-1 focus-visible:ring-primary outline-none"
                  )}
                />

                <button
                  type="submit"
                  disabled={!newComment.trim() || isPendingComment}
                  aria-label="Kirim komentar"
                  className={cn(
                    "min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center shrink-0",
                    "bg-primary text-on-primary hover:brightness-95 transition-all disabled:opacity-50",
                    "focus-visible:ring-2 focus-visible:ring-outline outline-none cursor-pointer"
                  )}
                >
                  <Send className="w-4 h-4" aria-hidden="true" />
                </button>
              </form>
            </>
          )}
        </div>
      )}
      </aside>
    </div>
  );
}
