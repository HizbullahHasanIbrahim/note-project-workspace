"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Calendar, FileText, GripVertical, Plus, User as UserIcon } from "lucide-react";
import { generatePosition } from "@/lib/fractional-index";
import {
  STATUS_CONFIG,
  TASK_STATUS_ORDER,
  TaskPriorityBadge,
  TaskStatusBadge,
  type TaskStatus,
} from "./task-badges";
import type { DatabaseTaskItem } from "./task-types";

interface KanbanBoardProps {
  databasePageId: string;
  tasks: DatabaseTaskItem[];
  isReadOnly: boolean;
  onSelectTask: (taskId: string) => void;
  onQuickCreate?: (status: TaskStatus) => void;
  onMoveTask: (args: {
    taskId: string;
    targetStatus: TaskStatus;
    prevTaskId: string | null;
    nextTaskId: string | null;
    optimisticPosition: number;
  }) => Promise<void>;
}

type ColumnMap = Record<TaskStatus, DatabaseTaskItem[]>;

function buildColumns(items: DatabaseTaskItem[]): ColumnMap {
  const map: ColumnMap = {
    todo: [],
    in_progress: [],
    review: [],
    done: [],
  };

  const sorted = [...items].sort((a, b) => a.positionOrder - b.positionOrder);
  for (const item of sorted) {
    if (map[item.status]) {
      map[item.status].push(item);
    } else {
      map.todo.push(item);
    }
  }

  return map;
}

function findColumnOfTask(columns: ColumnMap, taskId: string): TaskStatus | null {
  for (const status of TASK_STATUS_ORDER) {
    if (columns[status].some((t) => t.id === taskId)) {
      return status;
    }
  }
  return null;
}

function getColumnFromOverId(
  columns: ColumnMap,
  overId: string
): TaskStatus | null {
  if (overId.startsWith("col:")) {
    const candidate = overId.slice(4) as TaskStatus;
    return TASK_STATUS_ORDER.includes(candidate) ? candidate : null;
  }
  return findColumnOfTask(columns, overId);
}

function TaskCardContent({
  task,
  isOverlay = false,
  isReadOnly,
}: {
  task: DatabaseTaskItem;
  isOverlay?: boolean;
  isReadOnly: boolean;
}) {
  return (
    <div className="flex flex-col gap-2.5 w-full">
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium text-on-surface leading-snug line-clamp-2 text-left">
          {task.title}
        </span>
        {!isReadOnly && (
          <GripVertical
            className={`w-4 h-4 shrink-0 text-on-surface-variant ${
              isOverlay ? "opacity-90" : "opacity-45 group-hover:opacity-90"
            }`}
            aria-hidden="true"
          />
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <TaskPriorityBadge priority={task.priority} />
        {task.dueDate && (
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-container-high px-2.5 py-0.5 text-[11px] font-mono text-on-surface-variant">
            <Calendar className="w-3 h-3 shrink-0" aria-hidden="true" />
            <span>{task.dueDate}</span>
          </span>
        )}
        {task.linkedPages.length > 0 && (
          <span
            className="inline-flex items-center gap-1 rounded-full bg-surface-container-high px-2.5 py-0.5 text-[11px] font-medium text-on-surface-variant"
            title={`${task.linkedPages.length} dokumen tertaut`}
          >
            <FileText className="w-3 h-3 shrink-0" aria-hidden="true" />
            <span>{task.linkedPages.length}</span>
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 pt-1 border-t border-outline-variant/30">
        <span className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant truncate">
          <UserIcon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">
            {task.assigneeName ?? "Belum ditugaskan"}
          </span>
        </span>
      </div>
    </div>
  );
}

function SortableKanbanCard({
  task,
  isReadOnly,
  onSelectTask,
}: {
  task: DatabaseTaskItem;
  isReadOnly: boolean;
  onSelectTask: (taskId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    disabled: isReadOnly,
    data: { type: "task", task },
  });

  const style: React.CSSProperties = {
    transform: transform
      ? `translate3d(${Math.round(transform.x)}px, ${Math.round(transform.y)}px, 0)`
      : undefined,
    transition,
  };

  if (isDragging) {
    // SDD §5.3: Slot kosong ditandai garis putus-putus border primary/50
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="rounded-2xl border-2 border-dashed border-primary/50 bg-primary/5 min-h-[108px] p-4"
        aria-hidden="true"
      >
        <div className="opacity-0 pointer-events-none">
          <TaskCardContent task={task} isReadOnly={isReadOnly} />
        </div>
      </div>
    );
  }

  return (
    <button
      ref={setNodeRef}
      style={style}
      type="button"
      onClick={() => onSelectTask(task.id)}
      {...(!isReadOnly ? attributes : {})}
      {...(!isReadOnly ? listeners : {})}
      className={`group min-h-[44px] w-full text-left rounded-2xl bg-card-surface p-4 border border-outline-variant/50 hover:border-outline-variant transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-outline ${
        isReadOnly
          ? "cursor-pointer"
          : "cursor-grab active:cursor-grabbing touch-manipulation"
      }`}
    >
      <TaskCardContent task={task} isReadOnly={isReadOnly} />
    </button>
  );
}

function KanbanColumn({
  status,
  tasks,
  isReadOnly,
  onSelectTask,
  onQuickCreate,
}: {
  status: TaskStatus;
  tasks: DatabaseTaskItem[];
  isReadOnly: boolean;
  onSelectTask: (taskId: string) => void;
  onQuickCreate?: (status: TaskStatus) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `col:${status}`,
    data: { type: "column", status },
  });

  const itemIds = useMemo(() => tasks.map((t) => t.id), [tasks]);
  const config = STATUS_CONFIG[status];

  return (
    <section
      aria-label={`Kolom ${config.label}`}
      className={`min-w-[272px] flex-1 rounded-2xl bg-surface-container p-3 flex flex-col gap-3 min-h-[360px] border transition-colors ${
        isOver
          ? "border-primary/60 bg-surface-container-high/80"
          : "border-outline-variant/40"
      }`}
    >
      {/* Header kolom */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <TaskStatusBadge status={status} />
          <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full bg-surface-container-high text-xs font-medium text-on-surface-variant">
            {tasks.length}
          </span>
        </div>

        {!isReadOnly && onQuickCreate && (
          <button
            type="button"
            onClick={() => onQuickCreate(status)}
            aria-label={`Tambah tugas di ${config.label}`}
            className="min-w-[44px] min-h-[44px] -my-2 -mr-1 rounded-full inline-flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-outline"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Daftar kartu sortable */}
      <div ref={setNodeRef} className="flex-1 flex flex-col gap-2.5 min-h-[240px]">
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <div className="flex-1 rounded-2xl border border-dashed border-outline-variant/60 flex items-center justify-center p-4 text-xs text-on-surface-variant text-center">
              {isReadOnly
                ? "Belum ada tugas pada status ini"
                : "Tarik kartu ke sini atau klik + untuk membuat tugas"}
            </div>
          ) : (
            tasks.map((task) => (
              <SortableKanbanCard
                key={task.id}
                task={task}
                isReadOnly={isReadOnly}
                onSelectTask={onSelectTask}
              />
            ))
          )}
        </SortableContext>
      </div>
    </section>
  );
}

/**
 * Papan Kanban 4 kolom Material You dengan @dnd-kit untuk drag-and-drop antar status
 * serta kalkulasi fractional index. Drag dinonaktifkan otomatis untuk peran Viewer.
 */
export function KanbanBoard({
  databasePageId,
  tasks,
  isReadOnly,
  onSelectTask,
  onQuickCreate,
  onMoveTask,
}: KanbanBoardProps) {
  const baseColumns = useMemo(() => buildColumns(tasks), [tasks]);
  const [dragColumns, setDragColumns] = useState<ColumnMap | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  const activeColumns = dragColumns ?? baseColumns;

  // Sensor pointer memerlukan gerakan >6px agar klik kartu tetap membuka Side-Peek
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 6 },
  });
  const keyboardSensor = useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  });
  const sensors = useSensors(
    ...(isReadOnly ? [] : [pointerSensor, keyboardSensor])
  );

  const activeTask = useMemo(() => {
    if (!activeTaskId) return null;
    for (const status of TASK_STATUS_ORDER) {
      const found = activeColumns[status].find((t) => t.id === activeTaskId);
      if (found) return found;
    }
    return null;
  }, [activeTaskId, activeColumns]);

  const handleDragStart = (event: DragStartEvent) => {
    if (isReadOnly) return;
    setActiveTaskId(String(event.active.id));
    setDragColumns(buildColumns(tasks));
  };

  const handleDragOver = (event: DragOverEvent) => {
    if (isReadOnly || !event.over) return;
    const activeId = String(event.active.id);
    const overId = String(event.over.id);

    setDragColumns((prev) => {
      if (!prev) return prev;
      const activeCol = findColumnOfTask(prev, activeId);
      const overCol = getColumnFromOverId(prev, overId);
      if (!activeCol || !overCol) return prev;

      if (activeCol === overCol) {
        if (overId.startsWith("col:") || activeId === overId) return prev;
        const items = prev[activeCol];
        const oldIndex = items.findIndex((t) => t.id === activeId);
        const newIndex = items.findIndex((t) => t.id === overId);
        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
          return prev;
        }
        return {
          ...prev,
          [activeCol]: arrayMove(items, oldIndex, newIndex),
        };
      }

      // Perpindahan lintas kolom
      const sourceItems = prev[activeCol];
      const destItems = prev[overCol];
      const movingTask = sourceItems.find((t) => t.id === activeId);
      if (!movingTask) return prev;

      const updatedSource = sourceItems.filter((t) => t.id !== activeId);
      const overIndex = overId.startsWith("col:")
        ? destItems.length
        : destItems.findIndex((t) => t.id === overId);
      const insertAt = overIndex >= 0 ? overIndex : destItems.length;

      const updatedDest = [...destItems];
      updatedDest.splice(insertAt, 0, { ...movingTask, status: overCol });

      return {
        ...prev,
        [activeCol]: updatedSource,
        [overCol]: updatedDest,
      };
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (isReadOnly) return;
    const finalColumns = dragColumns;
    const droppedId = String(event.active.id);
    const over = event.over;

    setActiveTaskId(null);
    setDragColumns(null);

    if (!over || !finalColumns) {
      return;
    }

    const targetStatus = findColumnOfTask(finalColumns, droppedId);
    if (!targetStatus) return;

    const destList = finalColumns[targetStatus];
    const targetIdx = destList.findIndex((t) => t.id === droppedId);
    if (targetIdx === -1) return;

    // Bandingkan dengan urutan awal untuk menghindari panggilan server bila posisi tetap sama
    const originalStatus = findColumnOfTask(baseColumns, droppedId);
    const originalIdx = originalStatus
      ? baseColumns[originalStatus].findIndex((t) => t.id === droppedId)
      : -1;
    if (originalStatus === targetStatus && originalIdx === targetIdx) {
      return;
    }

    const prevTask = targetIdx > 0 ? destList[targetIdx - 1] : null;
    const nextTask =
      targetIdx < destList.length - 1 ? destList[targetIdx + 1] : null;
    const optimisticPosition = generatePosition(
      prevTask ? prevTask.positionOrder : null,
      nextTask ? nextTask.positionOrder : null
    );

    void onMoveTask({
      taskId: droppedId,
      targetStatus,
      prevTaskId: prevTask?.id ?? null,
      nextTaskId: nextTask?.id ?? null,
      optimisticPosition,
    });
  };

  const handleDragCancel = () => {
    setActiveTaskId(null);
    setDragColumns(null);
  };

  return (
    <DndContext
      id={`kanban-dnd-${databasePageId}`}
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 items-stretch">
        {TASK_STATUS_ORDER.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={activeColumns[status]}
            isReadOnly={isReadOnly}
            onSelectTask={onSelectTask}
            onQuickCreate={onQuickCreate}
          />
        ))}
      </div>

      {/* Kartu terangkat mengikuti kursor sesuai SDD §5.3 */}
      <DragOverlay>
        {activeTask ? (
          <div className="rounded-2xl bg-surface-container-highest p-4 shadow-lg scale-[1.02] border border-primary/40 cursor-grabbing w-[280px]">
            <TaskCardContent
              task={activeTask}
              isOverlay
              isReadOnly={isReadOnly}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
