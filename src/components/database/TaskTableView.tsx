"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownUp,
  ArrowUpDown,
  FileText,
  FilterX,
  User as UserIcon,
} from "lucide-react";
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
import type { DatabaseMemberOption, DatabaseTaskItem } from "./task-types";

type SortField = "position" | "title" | "status" | "priority" | "dueDate";
type SortDirection = "asc" | "desc";

interface TaskTableViewProps {
  tasks: DatabaseTaskItem[];
  members: DatabaseMemberOption[];
  isReadOnly: boolean;
  onSelectTask: (taskId: string) => void;
  onUpdateTask: (
    taskId: string,
    patch: {
      status?: TaskStatus;
      priority?: TaskPriority;
      assigneeId?: string | null;
      dueDate?: string | null;
    }
  ) => Promise<void>;
}

const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const STATUS_WEIGHT: Record<TaskStatus, number> = {
  todo: 0,
  in_progress: 1,
  review: 2,
  done: 3,
};

/**
 * Tampilan tabel properti relasional lengkap dengan filter (Status, Prioritas, Assignee)
 * serta sorting kolom dan pengeditan sebaris untuk peran Admin/Member.
 */
export function TaskTableView({
  tasks,
  members,
  isReadOnly,
  onSelectTask,
  onUpdateTask,
}: TaskTableViewProps) {
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("position");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const hasActiveFilters =
    statusFilter !== "all" || priorityFilter !== "all" || assigneeFilter !== "all";

  const filteredAndSortedTasks = useMemo(() => {
    const filtered = tasks.filter((task) => {
      if (statusFilter !== "all" && task.status !== statusFilter) return false;
      if (priorityFilter !== "all" && task.priority !== priorityFilter) return false;
      if (assigneeFilter === "unassigned" && task.assigneeId !== null) return false;
      if (
        assigneeFilter !== "all" &&
        assigneeFilter !== "unassigned" &&
        task.assigneeId !== assigneeFilter
      ) {
        return false;
      }
      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "title":
          cmp = a.title.localeCompare(b.title, "id");
          break;
        case "status":
          cmp = STATUS_WEIGHT[a.status] - STATUS_WEIGHT[b.status];
          break;
        case "priority":
          cmp = PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
          break;
        case "dueDate": {
          const da = a.dueDate ?? "9999-12-31";
          const db = b.dueDate ?? "9999-12-31";
          cmp = da.localeCompare(db);
          break;
        }
        case "position":
        default:
          cmp = a.positionOrder - b.positionOrder;
          break;
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });

    return sorted;
  }, [tasks, statusFilter, priorityFilter, assigneeFilter, sortField, sortDirection]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const resetFilters = () => {
    setStatusFilter("all");
    setPriorityFilter("all");
    setAssigneeFilter("all");
  };

  return (
    <div className="rounded-2xl bg-surface-container border border-outline-variant/60 overflow-hidden">
      {/* Toolbar filter tabel */}
      <div className="bg-surface-container-low px-4 py-3 border-b border-outline-variant/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <label className="inline-flex items-center gap-2 text-xs font-medium text-on-surface-variant">
            <span>Status</span>
            <select
              aria-label="Filter berdasarkan status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TaskStatus | "all")}
              className="min-h-[44px] rounded-xl bg-surface-container-lowest border border-outline-variant px-3 text-sm text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-outline"
            >
              <option value="all">Semua status</option>
              {TASK_STATUS_ORDER.map((status) => (
                <option key={status} value={status}>
                  {STATUS_CONFIG[status].label}
                </option>
              ))}
            </select>
          </label>

          <label className="inline-flex items-center gap-2 text-xs font-medium text-on-surface-variant">
            <span>Prioritas</span>
            <select
              aria-label="Filter berdasarkan prioritas"
              value={priorityFilter}
              onChange={(e) =>
                setPriorityFilter(e.target.value as TaskPriority | "all")
              }
              className="min-h-[44px] rounded-xl bg-surface-container-lowest border border-outline-variant px-3 text-sm text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-outline"
            >
              <option value="all">Semua prioritas</option>
              {TASK_PRIORITY_ORDER.map((priority) => (
                <option key={priority} value={priority}>
                  {PRIORITY_CONFIG[priority].label}
                </option>
              ))}
            </select>
          </label>

          <label className="inline-flex items-center gap-2 text-xs font-medium text-on-surface-variant">
            <span>Penanggung jawab</span>
            <select
              aria-label="Filter berdasarkan penanggung jawab"
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="min-h-[44px] rounded-xl bg-surface-container-lowest border border-outline-variant px-3 text-sm text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-outline"
            >
              <option value="all">Semua anggota</option>
              <option value="unassigned">Belum ditugaskan</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.fullName}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="min-h-[44px] px-4 rounded-full inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:bg-primary/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-outline"
            >
              <FilterX className="w-4 h-4" aria-hidden="true" />
              <span>Reset filter</span>
            </button>
          )}
          <span className="text-xs font-medium text-on-surface-variant px-2">
            Menampilkan {filteredAndSortedTasks.length} dari {tasks.length} tugas
          </span>
        </div>
      </div>

      {/* Tabel responsif */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[820px]">
          <thead>
            <tr className="border-b border-outline-variant/60 bg-surface-container-low/70 text-xs font-medium text-on-surface-variant">
              <th className="py-3 px-4 w-[32%]">
                <button
                  type="button"
                  onClick={() => toggleSort("title")}
                  className="inline-flex items-center gap-1.5 min-h-[36px] text-on-surface-variant hover:text-on-surface cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-outline rounded-lg px-1 -ml-1"
                >
                  <span>Judul tugas</span>
                  {sortField === "title" ? (
                    <ArrowDownUp className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                  ) : (
                    <ArrowUpDown className="w-3.5 h-3.5 opacity-60" aria-hidden="true" />
                  )}
                </button>
              </th>
              <th className="py-3 px-3 w-[15%]">
                <button
                  type="button"
                  onClick={() => toggleSort("status")}
                  className="inline-flex items-center gap-1.5 min-h-[36px] text-on-surface-variant hover:text-on-surface cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-outline rounded-lg px-1 -ml-1"
                >
                  <span>Status</span>
                  {sortField === "status" ? (
                    <ArrowDownUp className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                  ) : (
                    <ArrowUpDown className="w-3.5 h-3.5 opacity-60" aria-hidden="true" />
                  )}
                </button>
              </th>
              <th className="py-3 px-3 w-[14%]">
                <button
                  type="button"
                  onClick={() => toggleSort("priority")}
                  className="inline-flex items-center gap-1.5 min-h-[36px] text-on-surface-variant hover:text-on-surface cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-outline rounded-lg px-1 -ml-1"
                >
                  <span>Prioritas</span>
                  {sortField === "priority" ? (
                    <ArrowDownUp className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                  ) : (
                    <ArrowUpDown className="w-3.5 h-3.5 opacity-60" aria-hidden="true" />
                  )}
                </button>
              </th>
              <th className="py-3 px-3 w-[16%]">Penanggung jawab</th>
              <th className="py-3 px-3 w-[13%]">
                <button
                  type="button"
                  onClick={() => toggleSort("dueDate")}
                  className="inline-flex items-center gap-1.5 min-h-[36px] text-on-surface-variant hover:text-on-surface cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-outline rounded-lg px-1 -ml-1"
                >
                  <span>Tenggat</span>
                  {sortField === "dueDate" ? (
                    <ArrowDownUp className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                  ) : (
                    <ArrowUpDown className="w-3.5 h-3.5 opacity-60" aria-hidden="true" />
                  )}
                </button>
              </th>
              <th className="py-3 px-4 w-[10%]">Catatan terkait</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-outline-variant/40 bg-card-surface">
            {filteredAndSortedTasks.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="py-12 px-4 text-center text-sm text-on-surface-variant"
                >
                  Tidak ada tugas yang sesuai dengan kriteria filter saat ini.
                </td>
              </tr>
            ) : (
              filteredAndSortedTasks.map((task) => (
                <tr
                  key={task.id}
                  className="hover:bg-surface-container-low/80 transition-colors"
                >
                  <td className="py-2.5 px-4">
                    <button
                      type="button"
                      onClick={() => onSelectTask(task.id)}
                      className="min-h-[44px] w-full text-left font-medium text-sm text-on-surface hover:text-primary transition-colors flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-outline rounded-xl px-2 -ml-2"
                    >
                      <span className="truncate">{task.title}</span>
                    </button>
                  </td>

                  <td className="py-2.5 px-3">
                    {isReadOnly ? (
                      <TaskStatusBadge status={task.status} />
                    ) : (
                      <select
                        aria-label={`Ubah status ${task.title}`}
                        value={task.status}
                        onChange={(e) =>
                          void onUpdateTask(task.id, {
                            status: e.target.value as TaskStatus,
                          })
                        }
                        className="min-h-[44px] rounded-xl bg-surface-container border border-outline-variant/70 px-2.5 text-xs font-medium text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-outline"
                      >
                        {TASK_STATUS_ORDER.map((status) => (
                          <option key={status} value={status}>
                            {STATUS_CONFIG[status].label}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>

                  <td className="py-2.5 px-3">
                    {isReadOnly ? (
                      <TaskPriorityBadge priority={task.priority} />
                    ) : (
                      <select
                        aria-label={`Ubah prioritas ${task.title}`}
                        value={task.priority}
                        onChange={(e) =>
                          void onUpdateTask(task.id, {
                            priority: e.target.value as TaskPriority,
                          })
                        }
                        className="min-h-[44px] rounded-xl bg-surface-container border border-outline-variant/70 px-2.5 text-xs font-medium text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-outline"
                      >
                        {TASK_PRIORITY_ORDER.map((priority) => (
                          <option key={priority} value={priority}>
                            {PRIORITY_CONFIG[priority].label}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>

                  <td className="py-2.5 px-3">
                    {isReadOnly ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant">
                        <UserIcon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span>{task.assigneeName ?? "Belum ditugaskan"}</span>
                      </span>
                    ) : (
                      <select
                        aria-label={`Ubah penanggung jawab ${task.title}`}
                        value={task.assigneeId ?? ""}
                        onChange={(e) =>
                          void onUpdateTask(task.id, {
                            assigneeId: e.target.value ? e.target.value : null,
                          })
                        }
                        className="min-h-[44px] max-w-[180px] rounded-xl bg-surface-container border border-outline-variant/70 px-2.5 text-xs text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-outline"
                      >
                        <option value="">Belum ditugaskan</option>
                        {members.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.fullName}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>

                  <td className="py-2.5 px-3">
                    {isReadOnly ? (
                      <span className="text-xs text-on-surface-variant font-mono">
                        {task.dueDate ?? "—"}
                      </span>
                    ) : (
                      <input
                        type="date"
                        aria-label={`Ubah tenggat ${task.title}`}
                        value={task.dueDate ?? ""}
                        onChange={(e) =>
                          void onUpdateTask(task.id, {
                            dueDate: e.target.value ? e.target.value : null,
                          })
                        }
                        className="min-h-[44px] rounded-xl bg-surface-container border border-outline-variant/70 px-2.5 text-xs font-mono text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-outline"
                      />
                    )}
                  </td>

                  <td className="py-2.5 px-4">
                    <button
                      type="button"
                      onClick={() => onSelectTask(task.id)}
                      className="min-h-[44px] px-3 rounded-full inline-flex items-center gap-1.5 bg-surface-container-high text-on-surface-variant hover:text-on-surface text-xs font-medium cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-outline"
                    >
                      <FileText className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>{task.linkedPages.length}</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
