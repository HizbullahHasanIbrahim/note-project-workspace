"use client";

import { CalendarDays, Check, Kanban, Table2 } from "lucide-react";

export type DatabaseViewMode = "kanban" | "table" | "calendar";

interface ViewSwitcherProps {
  value: DatabaseViewMode;
  onChange: (mode: DatabaseViewMode) => void;
}

const VIEW_OPTIONS: {
  id: DatabaseViewMode;
  label: string;
  Icon: typeof Kanban;
}[] = [
  { id: "table", label: "Table", Icon: Table2 },
  { id: "kanban", label: "Kanban", Icon: Kanban },
  { id: "calendar", label: "Calendar", Icon: CalendarDays },
];

/**
 * Material You Segmented Button untuk beralih antara tampilan Table, Kanban, dan Calendar.
 * Memenuhi target sentuh minimal 44x44px serta menampilkan ikon centang pada segmen aktif.
 */
export function ViewSwitcher({ value, onChange }: ViewSwitcherProps) {
  return (
    <div
      role="group"
      aria-label="Pilih tampilan database tugas"
      className="inline-flex items-center rounded-full border border-outline overflow-hidden bg-surface-container-low divide-x divide-outline"
    >
      {VIEW_OPTIONS.map(({ id, label, Icon }) => {
        const isActive = value === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            aria-pressed={isActive}
            className={`min-h-[44px] px-4 inline-flex items-center justify-center gap-2 text-sm font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-outline focus-visible:ring-inset ${
              isActive
                ? "bg-secondary-container text-on-secondary-container"
                : "bg-transparent text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
            }`}
          >
            {isActive ? (
              <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
            ) : (
              <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
            )}
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
