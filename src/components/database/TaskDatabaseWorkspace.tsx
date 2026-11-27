"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Database, Eye, Lock, Plus, Users, X } from "lucide-react";
import {
  createTaskAction,
  deleteTaskAction,
  linkTaskNoteAction,
  unlinkTaskNoteAction,
  updateTaskAction,
} from "@/app/workspace/[workspaceId]/database/task-actions";
import { useWorkspaceUIStore } from "@/stores/useWorkspaceUIStore";
import { KanbanBoard } from "./KanbanBoard";
import { TaskCalendarView } from "./TaskCalendarView";
import { TaskSidePeekModal } from "./TaskSidePeekModal";
import { TaskTableView } from "./TaskTableView";
import { ViewSwitcher, type DatabaseViewMode } from "./ViewSwitcher";
import {
  PRIORITY_CONFIG,
  STATUS_CONFIG,
  TASK_PRIORITY_ORDER,
  TASK_STATUS_ORDER,
  type TaskPriority,
  type TaskStatus,
} from "./task-badges";
import type {
  DatabaseMemberOption,
  DatabaseTaskItem,
  LinkableDatabasePageOption,
  TaskAttachmentItem,
} from "./task-types";

interface TaskDatabaseWorkspaceProps {
  workspaceId: string;
  databasePageId: string;
  databaseTitle: string;
  databaseIcon: string | null;
  spaceType: "teamspace" | "private";
  initialTasks: DatabaseTaskItem[];
  members: DatabaseMemberOption[];
  linkablePages: LinkableDatabasePageOption[];
  collabToken: string;
  currentUser: { id: string; name: string };
  isReadOnly: boolean;
  initialViewMode?: DatabaseViewMode;
  initialSelectedTaskId?: string | null;
}

/**
 * Kontainer full-width untuk halaman Relational Task Database.
 * Mengorkestrasi ViewSwitcher (Table/Kanban/Calendar), pembuatan tugas atomik,
 * drag-and-drop optimis dengan rollback, serta TaskSidePeekModal.
 */
export function TaskDatabaseWorkspace({
  workspaceId,
  databasePageId,
  databaseTitle,
  databaseIcon,
  spaceType,
  initialTasks,
  members,
  linkablePages,
  collabToken,
  currentUser,
  isReadOnly,
  initialViewMode = "kanban",
  initialSelectedTaskId = null,
}: TaskDatabaseWorkspaceProps) {
  const router = useRouter();
  const { setActivePageTitle, setActivePageId, setActiveBacklinks, setActiveTaskId } =
    useWorkspaceUIStore();

  const [tasks, setTasks] = useState<DatabaseTaskItem[]>(initialTasks);
  const [viewMode, setViewMode] = useState<DatabaseViewMode>(initialViewMode);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(
    initialSelectedTaskId
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // State form tambah tugas baru
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newStatus, setNewStatus] = useState<TaskStatus>("todo");
  const [newPriority, setNewPriority] = useState<TaskPriority>("medium");
  const [newAssigneeId, setNewAssigneeId] = useState<string>("");
  const [newDueDate, setNewDueDate] = useState<string>("");
  const [isPendingCreate, startCreateTransition] = useTransition();

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  useEffect(() => {
    setActivePageId(databasePageId);
    setActivePageTitle(databaseTitle);
    setActiveBacklinks([]);
    return () => {
      setActivePageId(null);
      setActivePageTitle(null);
      setActiveBacklinks([]);
      setActiveTaskId(null);
    };
  }, [
    databasePageId,
    databaseTitle,
    setActivePageId,
    setActivePageTitle,
    setActiveBacklinks,
    setActiveTaskId,
  ]);

  const selectTask = (taskId: string | null) => {
    setSelectedTaskId(taskId);
    setActiveTaskId(taskId);
  };

  const selectedTask = useMemo(
    () => tasks.find((t) => t.id === selectedTaskId) ?? null,
    [tasks, selectedTaskId]
  );

  const openQuickCreate = (status: TaskStatus = "todo") => {
    if (isReadOnly) return;
    setNewStatus(status);
    setIsComposerOpen(true);
    setErrorMessage(null);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    const trimmed = newTitle.trim();
    if (!trimmed) {
      setErrorMessage("Judul tugas wajib diisi.");
      return;
    }

    startCreateTransition(async () => {
      setErrorMessage(null);
      const res = await createTaskAction({
        workspaceId,
        databasePageId,
        title: trimmed,
        status: newStatus,
        priority: newPriority,
        assigneeId: newAssigneeId || null,
        dueDate: newDueDate || null,
      });

      if (!res.success || !res.taskId || !res.detailPageId) {
        setErrorMessage(res.error ?? "Gagal menambahkan tugas baru.");
        return;
      }

      const assignee = members.find((m) => m.id === newAssigneeId) ?? null;
      const columnTasks = tasks.filter((t) => t.status === newStatus);
      const maxPos = columnTasks.reduce(
        (max, item) => Math.max(max, item.positionOrder),
        0
      );

      setTasks((prev) => [
        ...prev,
        {
          id: res.taskId!,
          databasePageId,
          detailPageId: res.detailPageId!,
          title: trimmed,
          status: newStatus,
          priority: newPriority,
          assigneeId: assignee?.id ?? null,
          assigneeName: assignee?.fullName ?? null,
          assigneeEmail: assignee?.email ?? null,
          dueDate: newDueDate || null,
          positionOrder: maxPos + 1000,
          linkedPages: [],
          attachments: [],
        },
      ]);

      setNewTitle("");
      setNewDueDate("");
      setNewAssigneeId("");
      setIsComposerOpen(false);
      router.refresh();
    });
  };

  const handleUpdateTask = async (
    taskId: string,
    patch: {
      title?: string;
      status?: TaskStatus;
      priority?: TaskPriority;
      assigneeId?: string | null;
      dueDate?: string | null;
    }
  ) => {
    if (isReadOnly) return;
    const previous = tasks;
    const assignee =
      patch.assigneeId !== undefined
        ? members.find((m) => m.id === patch.assigneeId) ?? null
        : undefined;

    setErrorMessage(null);
    setTasks((prev) =>
      prev.map((item) => {
        if (item.id !== taskId) return item;
        return {
          ...item,
          title: patch.title !== undefined ? patch.title : item.title,
          status: patch.status !== undefined ? patch.status : item.status,
          priority: patch.priority !== undefined ? patch.priority : item.priority,
          assigneeId:
            patch.assigneeId !== undefined ? patch.assigneeId : item.assigneeId,
          assigneeName:
            patch.assigneeId !== undefined
              ? assignee?.fullName ?? null
              : item.assigneeName,
          assigneeEmail:
            patch.assigneeId !== undefined
              ? assignee?.email ?? null
              : item.assigneeEmail,
          dueDate: patch.dueDate !== undefined ? patch.dueDate : item.dueDate,
        };
      })
    );

    const res = await updateTaskAction({
      workspaceId,
      databasePageId,
      taskId,
      ...patch,
    });

    if (!res.success) {
      setTasks(previous);
      setErrorMessage(res.error ?? "Gagal memperbarui properti tugas.");
      return;
    }
    router.refresh();
  };

  const handleMoveTask = async ({
    taskId,
    targetStatus,
    prevTaskId,
    nextTaskId,
    optimisticPosition,
  }: {
    taskId: string;
    targetStatus: TaskStatus;
    prevTaskId: string | null;
    nextTaskId: string | null;
    optimisticPosition: number;
  }) => {
    if (isReadOnly) return;
    const previous = tasks;
    setErrorMessage(null);

    // Pembaruan optimis agar kartu tidak berkedip kembali ke posisi lama
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, status: targetStatus, positionOrder: optimisticPosition }
          : t
      )
    );

    const res = await updateTaskAction({
      workspaceId,
      databasePageId,
      taskId,
      status: targetStatus,
      prevTaskId,
      nextTaskId,
      reposition: true,
    });

    if (!res.success) {
      setTasks(previous);
      setErrorMessage(res.error ?? "Gagal memperbarui urutan Kanban.");
      return;
    }

    router.refresh();
  };

  const handleDeleteTask = async (taskId: string) => {
    if (isReadOnly) return;
    const previous = tasks;
    setErrorMessage(null);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (selectedTaskId === taskId) {
      selectTask(null);
    }

    const res = await deleteTaskAction({
      workspaceId,
      databasePageId,
      taskId,
    });

    if (!res.success) {
      setTasks(previous);
      setErrorMessage(res.error ?? "Gagal menghapus tugas.");
      return;
    }
    router.refresh();
  };

  const handleLinkNote = async (taskId: string, targetPageId: string) => {
    if (isReadOnly) return;
    const targetOption = linkablePages.find((p) => p.id === targetPageId);
    if (!targetOption) return;

    const previous = tasks;
    setErrorMessage(null);
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task;
        if (task.linkedPages.some((lp) => lp.id === targetPageId)) return task;
        return {
          ...task,
          linkedPages: [
            ...task.linkedPages,
            {
              id: targetOption.id,
              title: targetOption.title,
              icon: targetOption.icon,
              pageType: targetOption.pageType,
              isMaskedPrivate: false,
            },
          ],
        };
      })
    );

    const res = await linkTaskNoteAction({
      workspaceId,
      databasePageId,
      taskId,
      targetPageId,
    });

    if (!res.success) {
      setTasks(previous);
      setErrorMessage(res.error ?? "Gagal menautkan halaman dokumen.");
      return;
    }
    router.refresh();
  };

  const handleUnlinkNote = async (taskId: string, targetPageId: string) => {
    if (isReadOnly) return;
    const previous = tasks;
    setErrorMessage(null);

    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              linkedPages: task.linkedPages.filter((lp) => lp.id !== targetPageId),
            }
          : task
      )
    );

    const res = await unlinkTaskNoteAction({
      workspaceId,
      databasePageId,
      taskId,
      targetPageId,
    });

    if (!res.success) {
      setTasks(previous);
      setErrorMessage(res.error ?? "Gagal melepas tautan dokumen.");
      return;
    }
    router.refresh();
  };

  return (
    <div className="w-full max-w-none px-5 sm:px-8 py-6 flex flex-col gap-6">
      {/* Header Database Tugas Full-Width */}
      <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-outline-variant/50">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-high px-3 py-1 text-xs font-medium text-on-surface-variant">
              {spaceType === "private" ? (
                <>
                  <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Private Space</span>
                </>
              ) : (
                <>
                  <Users className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Shared Teamspace</span>
                </>
              )}
            </span>

            {isReadOnly && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-container text-on-secondary-container px-3 py-1 text-xs font-medium">
                <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Mode Read-Only (Viewer)</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span
              className="w-10 h-10 rounded-2xl bg-primary-container text-on-primary-container inline-flex items-center justify-center shrink-0 text-lg"
              aria-hidden="true"
            >
              {databaseIcon || <Database className="w-5 h-5" />}
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
              {databaseTitle}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <ViewSwitcher value={viewMode} onChange={setViewMode} />

          {!isReadOnly && (
            <button
              type="button"
              onClick={() => openQuickCreate("todo")}
              className="min-h-[44px] px-5 rounded-full bg-primary text-on-primary text-sm font-semibold inline-flex items-center gap-2 hover:brightness-95 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-outline"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>Tugas baru</span>
            </button>
          )}
        </div>
      </header>

      {/* Notifikasi error server */}
      {errorMessage && (
        <div
          role="alert"
          className="rounded-2xl bg-error-container text-on-error-container px-4 py-3 flex items-center justify-between gap-3 text-sm"
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            aria-label="Tutup pesan galat"
            className="min-w-[44px] min-h-[44px] -my-2 -mr-2 rounded-full inline-flex items-center justify-center hover:bg-on-error-container/10 cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Composer tugas baru */}
      {isComposerOpen && !isReadOnly && (
        <form
          onSubmit={handleCreateTask}
          className="rounded-2xl bg-surface-container p-4 sm:p-5 border border-outline-variant/60 flex flex-col gap-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-on-surface">
              Buat tugas baru
            </h2>
            <button
              type="button"
              onClick={() => setIsComposerOpen(false)}
              aria-label="Tutup formulir tugas baru"
              className="min-w-[44px] min-h-[44px] -my-2 -mr-2 rounded-full inline-flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-4 flex flex-col gap-1.5">
              <label
                htmlFor="new-task-title"
                className="text-xs font-medium text-on-surface-variant"
              >
                Judul tugas
              </label>
              <input
                id="new-task-title"
                type="text"
                required
                autoFocus
                placeholder="Contoh: Desain token Material You..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="min-h-[44px] rounded-xl bg-surface-container-lowest border border-outline-variant px-3.5 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-outline"
              />
            </div>

            <div className="md:col-span-2 flex flex-col gap-1.5">
              <label
                htmlFor="new-task-status"
                className="text-xs font-medium text-on-surface-variant"
              >
                Status
              </label>
              <select
                id="new-task-status"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as TaskStatus)}
                className="min-h-[44px] rounded-xl bg-surface-container-lowest border border-outline-variant px-3 text-sm text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-outline"
              >
                {TASK_STATUS_ORDER.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_CONFIG[status].label}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 flex flex-col gap-1.5">
              <label
                htmlFor="new-task-priority"
                className="text-xs font-medium text-on-surface-variant"
              >
                Prioritas
              </label>
              <select
                id="new-task-priority"
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                className="min-h-[44px] rounded-xl bg-surface-container-lowest border border-outline-variant px-3 text-sm text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-outline"
              >
                {TASK_PRIORITY_ORDER.map((priority) => (
                  <option key={priority} value={priority}>
                    {PRIORITY_CONFIG[priority].label}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 flex flex-col gap-1.5">
              <label
                htmlFor="new-task-assignee"
                className="text-xs font-medium text-on-surface-variant"
              >
                Penanggung jawab
              </label>
              <select
                id="new-task-assignee"
                value={newAssigneeId}
                onChange={(e) => setNewAssigneeId(e.target.value)}
                className="min-h-[44px] rounded-xl bg-surface-container-lowest border border-outline-variant px-3 text-sm text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-outline"
              >
                <option value="">Belum ditugaskan</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 flex flex-col gap-1.5">
              <label
                htmlFor="new-task-due"
                className="text-xs font-medium text-on-surface-variant"
              >
                Tenggat
              </label>
              <input
                id="new-task-due"
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="min-h-[44px] rounded-xl bg-surface-container-lowest border border-outline-variant px-3 text-sm font-mono text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-outline"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsComposerOpen(false)}
              className="min-h-[44px] px-4 rounded-full text-sm font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPendingCreate}
              className="min-h-[44px] px-5 rounded-full bg-primary text-on-primary text-sm font-semibold hover:brightness-95 transition-all disabled:opacity-60 cursor-pointer"
            >
              {isPendingCreate ? "Menyimpan..." : "Simpan tugas"}
            </button>
          </div>
        </form>
      )}

      {/* Tampilan Database Terpilih */}
      {viewMode === "kanban" && (
        <KanbanBoard
          databasePageId={databasePageId}
          tasks={tasks}
          isReadOnly={isReadOnly}
          onSelectTask={(taskId) => selectTask(taskId)}
          onQuickCreate={isReadOnly ? undefined : openQuickCreate}
          onMoveTask={handleMoveTask}
        />
      )}

      {viewMode === "table" && (
        <TaskTableView
          tasks={tasks}
          members={members}
          isReadOnly={isReadOnly}
          onSelectTask={(taskId) => selectTask(taskId)}
          onUpdateTask={handleUpdateTask}
        />
      )}

      {viewMode === "calendar" && (
        <TaskCalendarView
          tasks={tasks}
          onSelectTask={(taskId) => selectTask(taskId)}
        />
      )}

      {/* Modal Side-Peek Detail Tugas */}
      <TaskSidePeekModal
        workspaceId={workspaceId}
        task={selectedTask}
        members={members}
        linkablePages={linkablePages}
        collabToken={collabToken}
        currentUser={currentUser}
        isReadOnly={isReadOnly}
        onClose={() => selectTask(null)}
        onUpdateTask={handleUpdateTask}
        onDeleteTask={handleDeleteTask}
        onLinkNote={handleLinkNote}
        onUnlinkNote={handleUnlinkNote}
        onAttachmentAdded={(taskId, attachment) => {
          setTasks((prev) =>
            prev.map((t) =>
              t.id === taskId
                ? { ...t, attachments: [attachment, ...t.attachments] }
                : t
            )
          );
          router.refresh();
        }}
        onAttachmentRemoved={(taskId, attachmentId) => {
          setTasks((prev) =>
            prev.map((t) =>
              t.id === taskId
                ? {
                    ...t,
                    attachments: t.attachments.filter(
                      (a) => a.id !== attachmentId
                    ),
                  }
                : t
            )
          );
          router.refresh();
        }}
      />
    </div>
  );
}
