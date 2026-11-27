"use client";

import React from "react";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Circle,
  Clock,
  Eye,
  Flame,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type TaskStatus = "todo" | "in_progress" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export const TASK_STATUS_ORDER: TaskStatus[] = [
  "todo",
  "in_progress",
  "review",
  "done",
];

export const TASK_PRIORITY_ORDER: TaskPriority[] = [
  "urgent",
  "high",
  "medium",
  "low",
];

export const STATUS_CONFIG: Record<
  TaskStatus,
  {
    label: string;
    containerClass: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  todo: {
    label: "To Do",
    containerClass: "bg-surface-container-highest text-on-surface-variant",
    icon: Circle,
  },
  in_progress: {
    label: "In Progress",
    containerClass: "bg-secondary-container text-on-secondary-container",
    icon: Clock,
  },
  review: {
    label: "Review",
    containerClass: "bg-tertiary-container text-on-tertiary-container",
    icon: Eye,
  },
  done: {
    label: "Done",
    containerClass: "bg-primary-container text-on-primary-container",
    icon: CheckCircle2,
  },
};

export const PRIORITY_CONFIG: Record<
  TaskPriority,
  {
    label: string;
    containerClass: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  low: {
    label: "Low",
    containerClass: "bg-surface-container-high text-on-surface-variant",
    icon: ArrowDown,
  },
  medium: {
    label: "Medium",
    containerClass: "bg-secondary-container text-on-secondary-container",
    icon: Minus,
  },
  high: {
    label: "High",
    containerClass: "bg-tertiary-container text-on-tertiary-container",
    icon: ArrowUp,
  },
  urgent: {
    label: "Urgent",
    containerClass: "bg-error-container text-on-error-container",
    icon: Flame,
  },
};

export function TaskStatusBadge({
  status,
  className,
}: {
  status: TaskStatus;
  className?: string;
}) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.todo;
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-label-medium font-medium whitespace-nowrap",
        cfg.containerClass,
        className
      )}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{cfg.label}</span>
    </span>
  );
}

export function TaskPriorityBadge({
  priority,
  className,
}: {
  priority: TaskPriority;
  className?: string;
}) {
  const cfg = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.medium;
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-label-medium font-medium whitespace-nowrap",
        cfg.containerClass,
        className
      )}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{cfg.label}</span>
    </span>
  );
}
