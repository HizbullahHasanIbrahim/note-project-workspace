import type { TaskPriority, TaskStatus } from "./task-badges";
import type { WorkspaceRole } from "@/lib/permissions";

export interface LinkedPageSummary {
  id: string;
  title: string;
  icon: string | null;
  pageType: "document" | "database" | "task_item";
  isMaskedPrivate: boolean;
}

export interface TaskAttachmentItem {
  id: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  uploaderName: string;
  createdAtIso: string;
  url: string;
}

export interface DatabaseTaskItem {
  id: string;
  databasePageId: string;
  detailPageId: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string | null;
  assigneeName: string | null;
  assigneeEmail: string | null;
  dueDate: string | null; // Format ISO YYYY-MM-DD atau null
  positionOrder: number;
  linkedPages: LinkedPageSummary[];
  attachments: TaskAttachmentItem[];
}

export interface LinkableDatabasePageOption {
  id: string;
  title: string;
  icon: string | null;
  pageType: "document" | "database" | "task_item";
  spaceType: "teamspace" | "private";
}

export interface DatabaseMemberOption {
  id: string;
  fullName: string;
  email: string;
  role: WorkspaceRole;
}
