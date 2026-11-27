"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Link2,
  Lock,
  Plus,
  Trash2,
  Unlink,
  X,
} from "lucide-react";
import CollaborativeEditor from "@/components/editor/CollaborativeEditor";
import {
  PRIORITY_CONFIG,
  STATUS_CONFIG,
  TASK_PRIORITY_ORDER,
  TASK_STATUS_ORDER,
  TaskPriorityBadge,
  TaskStatusBadge,
  type TaskPriority,
  type TaskStatus,
} from "./task-badges";
import type {
  DatabaseMemberOption,
  DatabaseTaskItem,
  LinkableDatabasePageOption,
} from "./task-types";

interface TaskSidePeekModalProps {
  workspaceId: string;
  task: DatabaseTaskItem | null;
  members: DatabaseMemberOption[];
  linkablePages: LinkableDatabasePageOption[];
  collabToken: string;
  currentUser: { id: string; name: string };
  isReadOnly: boolean;
  onClose: () => void;
  onUpdateTask: (
    taskId: string,
    patch: {
      title?: string;
      status?: TaskStatus;
      priority?: TaskPriority;
      assigneeId?: string | null;
      dueDate?: string | null;
    }
  ) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onLinkNote: (taskId: string, targetPageId: string) => Promise<void>;
  onUnlinkNote: (taskId: string, targetPageId: string) => Promise<void>;
}

/**
 * Dialog Side-Peek Material You (SDD §5.1) di sisi kanan layar.
 * Memuat properti tugas, relasi halaman catatan (task_note_link), serta editor CRDT tersemat
 * yang terhubung langsung ke detail_page_id tugas tersebut.
 */
export function TaskSidePeekModal({
  workspaceId,
  task,
  members,
  linkablePages,
  collabToken,
  currentUser,
  isReadOnly,
  onClose,
  onUpdateTask,
  onDeleteTask,
  onLinkNote,
  onUnlinkNote,
}: TaskSidePeekModalProps) {
  const [titleDraft, setTitleDraft] = useState("");
  const [selectedLinkId, setSelectedLinkId] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isMutatingLink, setIsMutatingLink] = useState(false);

  useEffect(() => {
    if (task) {
      setTitleDraft(task.title);
      setConfirmingDelete(false);
      setSelectedLinkId("");
    }
  }, [task]);

  // Tutup dialog dengan tombol Escape
  useEffect(() => {
    if (!task) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [task, onClose]);

  const availableToLink = useMemo(() => {
    if (!task) return [];
    const alreadyLinked = new Set(task.linkedPages.map((lp) => lp.id));
    return linkablePages.filter(
      (p) => p.id !== task.detailPageId && !alreadyLinked.has(p.id)
    );
  }, [task, linkablePages]);

  if (!task) return null;

  const commitTitle = () => {
    const trimmed = titleDraft.trim();
    if (!trimmed || trimmed === task.title || isReadOnly) {
      setTitleDraft(task.title);
      return;
    }
    void onUpdateTask(task.id, { title: trimmed });
  };

  const handleAddLink = async () => {
    if (!selectedLinkId || isReadOnly || isMutatingLink) return;
    setIsMutatingLink(true);
    try {
      await onLinkNote(task.id, selectedLinkId);
      setSelectedLinkId("");
    } finally {
      setIsMutatingLink(false);
    }
  };

  const handleRemoveLink = async (targetPageId: string) => {
    if (isReadOnly || isMutatingLink) return;
    setIsMutatingLink(true);
    try {
      await onUnlinkNote(task.id, targetPageId);
    } finally {
      setIsMutatingLink(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-scrim/40 flex justify-end items-stretch"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-side-peek-title"
        className="w-full max-w-[640px] h-[calc(100dvh-24px)] m-3 rounded-[28px] bg-surface-container-high border border-outline-variant/60 shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header modal */}
        <div className="px-5 py-3.5 border-b border-outline-variant/50 flex items-center justify-between gap-3 bg-surface-container-high">
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-flex items-center rounded-full bg-secondary-container text-on-secondary-container px-3 py-1 text-xs font-medium">
              Detail tugas
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!isReadOnly && (
              <>
                {confirmingDelete ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => void onDeleteTask(task.id)}
                      className="min-h-[44px] px-3.5 rounded-full bg-error text-on-error text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-outline"
                    >
                      Konfirmasi hapus
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingDelete(false)}
                      className="min-h-[44px] px-3 rounded-full bg-surface-container text-on-surface text-xs font-medium hover:bg-surface-container-highest transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-outline"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(true)}
                    aria-label="Hapus tugas"
                    className="min-w-[44px] min-h-[44px] rounded-full inline-flex items-center justify-center text-on-surface-variant hover:bg-error-container hover:text-on-error-container transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-outline"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                )}
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup panel tugas"
              className="min-w-[44px] min-h-[44px] rounded-full inline-flex items-center justify-center text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-outline"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Konten scrollable */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 flex flex-col gap-6">
          {/* Judul tugas */}
          <div>
            {isReadOnly ? (
              <h2
                id="task-side-peek-title"
                className="text-2xl font-bold text-on-surface tracking-tight"
              >
                {task.title}
              </h2>
            ) : (
              <input
                id="task-side-peek-title"
                type="text"
                aria-label="Judul tugas"
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={commitTitle}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.currentTarget.blur();
                  }
                }}
                className="w-full text-2xl font-bold text-on-surface tracking-tight bg-transparent border border-transparent hover:border-outline-variant/60 focus:border-primary rounded-xl px-2 py-1.5 -mx-2 outline-none transition-colors"
              />
            )}
          </div>

          {/* Grid properti */}
          <div className="rounded-2xl bg-surface-container p-4 border border-outline-variant/50 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="peek-status"
                className="text-xs font-medium text-on-surface-variant"
              >
                Status
              </label>
              {isReadOnly ? (
                <div>
                  <TaskStatusBadge status={task.status} />
                </div>
              ) : (
                <select
                  id="peek-status"
                  value={task.status}
                  onChange={(e) =>
                    void onUpdateTask(task.id, {
                      status: e.target.value as TaskStatus,
                    })
                  }
                  className="min-h-[44px] rounded-xl bg-surface-container-lowest border border-outline-variant px-3 text-sm text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-outline"
                >
                  {TASK_STATUS_ORDER.map((status) => (
                    <option key={status} value={status}>
                      {STATUS_CONFIG[status].label}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="peek-priority"
                className="text-xs font-medium text-on-surface-variant"
              >
                Prioritas
              </label>
              {isReadOnly ? (
                <div>
                  <TaskPriorityBadge priority={task.priority} />
                </div>
              ) : (
                <select
                  id="peek-priority"
                  value={task.priority}
                  onChange={(e) =>
                    void onUpdateTask(task.id, {
                      priority: e.target.value as TaskPriority,
                    })
                  }
                  className="min-h-[44px] rounded-xl bg-surface-container-lowest border border-outline-variant px-3 text-sm text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-outline"
                >
                  {TASK_PRIORITY_ORDER.map((priority) => (
                    <option key={priority} value={priority}>
                      {PRIORITY_CONFIG[priority].label}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="peek-assignee"
                className="text-xs font-medium text-on-surface-variant"
              >
                Penanggung jawab
              </label>
              {isReadOnly ? (
                <span className="text-sm text-on-surface py-2">
                  {task.assigneeName ?? "Belum ditugaskan"}
                </span>
              ) : (
                <select
                  id="peek-assignee"
                  value={task.assigneeId ?? ""}
                  onChange={(e) =>
                    void onUpdateTask(task.id, {
                      assigneeId: e.target.value ? e.target.value : null,
                    })
                  }
                  className="min-h-[44px] rounded-xl bg-surface-container-lowest border border-outline-variant px-3 text-sm text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-outline"
                >
                  <option value="">Belum ditugaskan</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.fullName}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="peek-due-date"
                className="text-xs font-medium text-on-surface-variant"
              >
                Tenggat waktu
              </label>
              {isReadOnly ? (
                <span className="text-sm font-mono text-on-surface py-2">
                  {task.dueDate ?? "Belum ditentukan"}
                </span>
              ) : (
                <input
                  id="peek-due-date"
                  type="date"
                  value={task.dueDate ?? ""}
                  onChange={(e) =>
                    void onUpdateTask(task.id, {
                      dueDate: e.target.value ? e.target.value : null,
                    })
                  }
                  className="min-h-[44px] rounded-xl bg-surface-container-lowest border border-outline-variant px-3 text-sm font-mono text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-outline"
                />
              )}
            </div>
          </div>

          {/* Bagian Linked Pages (task_note_link) */}
          <div className="rounded-2xl bg-surface-container p-4 border border-outline-variant/50 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-primary" aria-hidden="true" />
                <h3 className="text-sm font-semibold text-on-surface">
                  Catatan & Dokumen Terkait
                </h3>
              </div>
              <span className="text-xs text-on-surface-variant">
                {task.linkedPages.length} tertaut
              </span>
            </div>

            {task.linkedPages.length === 0 ? (
              <p className="text-xs text-on-surface-variant">
                Belum ada Meeting Notes atau SOP yang ditautkan ke tugas ini.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {task.linkedPages.map((linked) => (
                  <li
                    key={linked.id}
                    className="flex items-center justify-between gap-2 rounded-xl bg-surface-container-lowest border border-outline-variant/50 px-3 py-2"
                  >
                    {linked.isMaskedPrivate ? (
                      <div className="flex items-center gap-2 text-xs text-on-surface-variant min-w-0">
                        <Lock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span className="truncate">[Halaman Privat]</span>
                      </div>
                    ) : (
                      <Link
                        href={`/workspace/${workspaceId}/page/${linked.id}`}
                        className="flex items-center gap-2 text-sm font-medium text-primary hover:underline min-w-0"
                      >
                        <FileText className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span className="truncate">
                          {linked.icon ? `${linked.icon} ` : ""}
                          {linked.title}
                        </span>
                      </Link>
                    )}

                    {!isReadOnly && (
                      <button
                        type="button"
                        disabled={isMutatingLink}
                        onClick={() => void handleRemoveLink(linked.id)}
                        aria-label={`Lepas tautan ${linked.title}`}
                        className="min-w-[44px] min-h-[44px] -my-2 -mr-2 rounded-full inline-flex items-center justify-center text-on-surface-variant hover:bg-error-container hover:text-on-error-container transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-outline disabled:opacity-50"
                      >
                        <Unlink className="w-4 h-4" aria-hidden="true" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {!isReadOnly && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <select
                  aria-label="Pilih halaman dokumen untuk ditautkan"
                  value={selectedLinkId}
                  onChange={(e) => setSelectedLinkId(e.target.value)}
                  className="flex-1 min-w-[200px] min-h-[44px] rounded-xl bg-surface-container-lowest border border-outline-variant px-3 text-sm text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-outline"
                >
                  <option value="">Pilih Meeting Notes / SOP...</option>
                  {availableToLink.map((page) => (
                    <option key={page.id} value={page.id}>
                      {page.icon ? `${page.icon} ` : ""}
                      {page.title}
                      {page.spaceType === "private" ? " (Privat)" : ""}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!selectedLinkId || isMutatingLink}
                  onClick={() => void handleAddLink()}
                  className="min-h-[44px] px-4 rounded-full bg-secondary-container text-on-secondary-container text-sm font-medium inline-flex items-center gap-1.5 hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-outline"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  <span>Tautkan halaman</span>
                </button>
              </div>
            )}
          </div>

          {/* Editor detail tugas tersemat */}
          <div className="rounded-2xl bg-surface-container-lowest border border-outline-variant/50 p-4 flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-on-surface">
              Deskripsi & Catatan Detail
            </h3>
            <CollaborativeEditor
              key={task.detailPageId}
              workspaceId={workspaceId}
              pageId={task.detailPageId}
              initialTitle={task.title}
              initialIcon={null}
              collabToken={collabToken}
              currentUser={currentUser}
              isReadOnly={isReadOnly}
              linkablePages={linkablePages.map((p) => ({
                id: p.id,
                title: p.title,
                icon: p.icon,
                pageType: p.pageType,
              }))}
              initialBacklinks={[]}
              syncShellContext={false}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
