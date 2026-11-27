"use client";

import { useMemo, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { TaskPriorityBadge, TaskStatusBadge } from "./task-badges";
import type { DatabaseTaskItem } from "./task-types";

interface TaskCalendarViewProps {
  tasks: DatabaseTaskItem[];
  onSelectTask: (taskId: string) => void;
}

const WEEKDAY_HEADERS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

const MONTH_NAMES_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

function formatDateKey(year: number, monthIndex: number, day: number): string {
  const m = String(monthIndex + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

/**
 * Tampilan kalender bulanan Material You yang memetakan kartu tugas berdasarkan due_date.
 * Tugas yang belum memiliki due_date tetap ditampilkan pada panel terpisah agar mudah dibuka.
 */
export function TaskCalendarView({ tasks, onSelectTask }: TaskCalendarViewProps) {
  const now = new Date();
  const [cursorYear, setCursorYear] = useState(now.getFullYear());
  const [cursorMonth, setCursorMonth] = useState(now.getMonth()); // 0..11

  const todayKey = formatDateKey(now.getFullYear(), now.getMonth(), now.getDate());

  const { tasksByDate, unscheduledTasks } = useMemo(() => {
    const map = new Map<string, DatabaseTaskItem[]>();
    const unscheduled: DatabaseTaskItem[] = [];

    for (const task of tasks) {
      if (!task.dueDate) {
        unscheduled.push(task);
        continue;
      }
      const key = task.dueDate.slice(0, 10);
      const bucket = map.get(key) ?? [];
      bucket.push(task);
      map.set(key, bucket);
    }

    return { tasksByDate: map, unscheduledTasks: unscheduled };
  }, [tasks]);

  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(cursorYear, cursorMonth, 1);
    const daysInMonth = new Date(cursorYear, cursorMonth + 1, 0).getDate();
    // Konversi Sunday=0..Saturday=6 menjadi Monday=0..Sunday=6
    const startOffset = (firstDayOfMonth.getDay() + 6) % 7;
    const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

    const cells: {
      dayNumber: number | null;
      dateKey: string | null;
    }[] = [];

    for (let i = 0; i < totalCells; i++) {
      const dayNumber = i - startOffset + 1;
      if (dayNumber < 1 || dayNumber > daysInMonth) {
        cells.push({ dayNumber: null, dateKey: null });
      } else {
        cells.push({
          dayNumber,
          dateKey: formatDateKey(cursorYear, cursorMonth, dayNumber),
        });
      }
    }

    return cells;
  }, [cursorYear, cursorMonth]);

  const goPrevMonth = () => {
    if (cursorMonth === 0) {
      setCursorYear((y) => y - 1);
      setCursorMonth(11);
    } else {
      setCursorMonth((m) => m - 1);
    }
  };

  const goNextMonth = () => {
    if (cursorMonth === 11) {
      setCursorYear((y) => y + 1);
      setCursorMonth(0);
    } else {
      setCursorMonth((m) => m + 1);
    }
  };

  const goToday = () => {
    const today = new Date();
    setCursorYear(today.getFullYear());
    setCursorMonth(today.getMonth());
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl bg-surface-container border border-outline-variant/60 overflow-hidden">
        {/* Header navigasi bulan */}
        <div className="bg-surface-container-low px-4 py-3 border-b border-outline-variant/60 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-primary" aria-hidden="true" />
            <h2 className="text-base font-semibold text-on-surface">
              {MONTH_NAMES_ID[cursorMonth]} {cursorYear}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goToday}
              className="min-h-[44px] px-4 rounded-full border border-outline-variant bg-surface-container-lowest text-sm font-medium text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-outline"
            >
              Hari ini
            </button>
            <button
              type="button"
              onClick={goPrevMonth}
              aria-label="Bulan sebelumnya"
              className="min-w-[44px] min-h-[44px] rounded-full inline-flex items-center justify-center bg-surface-container-lowest border border-outline-variant text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-outline"
            >
              <ChevronLeft className="w-5 h-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={goNextMonth}
              aria-label="Bulan berikutnya"
              className="min-w-[44px] min-h-[44px] rounded-full inline-flex items-center justify-center bg-surface-container-lowest border border-outline-variant text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-outline"
            >
              <ChevronRight className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Grid hari dalam seminggu */}
        <div className="grid grid-cols-7 border-b border-outline-variant/60 bg-surface-container-low/60">
          {WEEKDAY_HEADERS.map((dayName) => (
            <div
              key={dayName}
              className="py-2.5 px-3 text-xs font-medium text-on-surface-variant text-center border-r last:border-r-0 border-outline-variant/40"
            >
              {dayName}
            </div>
          ))}
        </div>

        {/* Grid tanggal */}
        <div className="grid grid-cols-7 auto-rows-[minmax(124px,auto)]">
          {calendarCells.map((cell, idx) => {
            const cellTasks = cell.dateKey ? tasksByDate.get(cell.dateKey) ?? [] : [];
            const isToday = cell.dateKey === todayKey;

            return (
              <div
                key={cell.dateKey ?? `empty-${idx}`}
                className={`p-2 border-b border-r border-outline-variant/40 flex flex-col gap-1.5 ${
                  cell.dayNumber === null
                    ? "bg-surface-container-low/40"
                    : isToday
                    ? "bg-primary/5"
                    : "bg-surface-container-lowest/40"
                }`}
              >
                {cell.dayNumber !== null && (
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-medium ${
                        isToday
                          ? "bg-primary text-on-primary"
                          : "text-on-surface-variant"
                      }`}
                    >
                      {cell.dayNumber}
                    </span>
                    {cellTasks.length > 0 && (
                      <span className="text-[11px] font-medium text-on-surface-variant">
                        {cellTasks.length}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  {cellTasks.map((task) => (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => onSelectTask(task.id)}
                      className="min-h-[36px] w-full text-left rounded-xl bg-card-surface hover:bg-surface-container-highest border border-outline-variant/50 px-2.5 py-1.5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-outline flex flex-col gap-1"
                    >
                      <span className="text-xs font-medium text-on-surface line-clamp-2 leading-snug">
                        {task.title}
                      </span>
                      <div className="flex items-center justify-between gap-1">
                        <TaskStatusBadge status={task.status} className="text-[10px] px-1.5 py-0.5" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Daftar tugas tanpa tenggat waktu */}
      {unscheduledTasks.length > 0 && (
        <div className="rounded-2xl bg-surface-container p-4 border border-outline-variant/60">
          <h3 className="text-sm font-semibold text-on-surface mb-3">
            Belum memiliki tenggat waktu ({unscheduledTasks.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {unscheduledTasks.map((task) => (
              <button
                key={task.id}
                type="button"
                onClick={() => onSelectTask(task.id)}
                className="min-h-[44px] rounded-2xl bg-card-surface hover:bg-surface-container-highest border border-outline-variant/50 p-3 text-left flex flex-col gap-2 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-outline"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-medium text-on-surface line-clamp-2">
                    {task.title}
                  </span>
                  {task.linkedPages.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs text-on-surface-variant shrink-0">
                      <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                      {task.linkedPages.length}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <TaskStatusBadge status={task.status} />
                  <TaskPriorityBadge priority={task.priority} />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
