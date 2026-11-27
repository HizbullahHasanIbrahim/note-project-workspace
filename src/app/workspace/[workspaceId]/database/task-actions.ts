"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { pageRelations, pages, tasks, workspaceMembers } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { canEditTasks } from "@/lib/permissions";
import {
  DEFAULT_POSITION_STEP,
  generatePosition,
  needsReindex,
  reindexPositions,
} from "@/lib/fractional-index";
import type { TaskPriority, TaskStatus } from "@/components/database/task-badges";

export interface TaskActionResult {
  success?: boolean;
  error?: string;
  taskId?: string;
  detailPageId?: string;
}

/**
 * Memverifikasi keanggotaan workspace, izin tulis RBAC (tolak viewer), serta isolasi Private Space
 */
async function requireTaskEditAccess(workspaceId: string, databasePageId: string) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Anda harus masuk terlebih dahulu.");
  }

  const [membership] = await db
    .select()
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, user.id)
      )
    )
    .limit(1);

  if (!membership || !canEditTasks(membership.role)) {
    throw new Error("403 Forbidden: Peran Viewer bersifat read-only dan tidak dapat memodifikasi tugas.");
  }

  const [databasePage] = await db
    .select()
    .from(pages)
    .where(
      and(
        eq(pages.id, databasePageId),
        eq(pages.workspaceId, workspaceId),
        eq(pages.pageType, "database"),
        eq(pages.isArchived, false)
      )
    )
    .limit(1);

  if (!databasePage) {
    throw new Error("Database tugas tidak ditemukan.");
  }

  if (databasePage.spaceType === "private" && databasePage.createdBy !== user.id) {
    throw new Error("403 Forbidden: Akses ditolak ke database privat milik pengguna lain.");
  }

  return { user, membership, databasePage };
}

/**
 * Server Action: Membuat tugas baru secara atomik (`pages` task_item + `tasks`)
 */
export async function createTaskAction(input: {
  workspaceId: string;
  databasePageId: string;
  title: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string | null;
  dueDate?: string | null;
}): Promise<TaskActionResult> {
  try {
    const { user, databasePage } = await requireTaskEditAccess(
      input.workspaceId,
      input.databasePageId
    );

    const trimmedTitle = input.title?.trim();
    if (!trimmedTitle) {
      return { error: "Judul tugas wajib diisi." };
    }

    const targetStatus: TaskStatus = input.status ?? "todo";
    const targetPriority: TaskPriority = input.priority ?? "medium";
    const targetAssigneeId = input.assigneeId || null;

    if (targetAssigneeId) {
      const [assigneeMember] = await db
        .select({ id: workspaceMembers.id })
        .from(workspaceMembers)
        .where(
          and(
            eq(workspaceMembers.workspaceId, input.workspaceId),
            eq(workspaceMembers.userId, targetAssigneeId)
          )
        )
        .limit(1);
      if (!assigneeMember) {
        return { error: "Penanggung jawab yang dipilih bukan anggota workspace ini." };
      }
    }

    const detailPageId = crypto.randomUUID();
    const taskId = crypto.randomUUID();
    const parsedDueDate =
      input.dueDate && /^\d{4}-\d{2}-\d{2}$/.test(input.dueDate)
        ? new Date(`${input.dueDate}T00:00:00Z`)
        : null;

    await db.transaction(async (tx) => {
      const existingInStatus = await tx
        .select({ positionOrder: tasks.positionOrder })
        .from(tasks)
        .where(
          and(
            eq(tasks.databasePageId, input.databasePageId),
            eq(tasks.status, targetStatus)
          )
        )
        .orderBy(asc(tasks.positionOrder));

      const lastPos =
        existingInStatus.length > 0
          ? existingInStatus[existingInStatus.length - 1].positionOrder
          : null;
      const positionOrder = generatePosition(lastPos, null);

      // 1. Buat entitas halaman detail bertipe `task_item` (mewarisi spaceType database induk)
      await tx.insert(pages).values({
        id: detailPageId,
        workspaceId: input.workspaceId,
        parentPageId: input.databasePageId,
        createdBy: user.id,
        spaceType: databasePage.spaceType,
        pageType: "task_item",
        title: trimmedTitle,
        icon: "✅",
        positionOrder,
        isArchived: false,
      });

      // 2. Buat baris relasional pada tabel `tasks`
      await tx.insert(tasks).values({
        id: taskId,
        databasePageId: input.databasePageId,
        detailPageId,
        title: trimmedTitle,
        status: targetStatus,
        priority: targetPriority,
        assigneeId: targetAssigneeId,
        dueDate: parsedDueDate,
        positionOrder,
      });
    });

    revalidatePath(`/workspace/${input.workspaceId}/database/${input.databasePageId}`);
    return { success: true, taskId, detailPageId };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Gagal membuat kartu tugas baru.",
    };
  }
}

/**
 * Server Action: Memperbarui properti tugas & urutan Kanban (fractional indexing DOUBLE)
 */
export async function updateTaskAction(input: {
  workspaceId: string;
  databasePageId: string;
  taskId: string;
  title?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string | null;
  dueDate?: string | null;
  prevTaskId?: string | null;
  nextTaskId?: string | null;
  reposition?: boolean;
}): Promise<TaskActionResult> {
  try {
    await requireTaskEditAccess(input.workspaceId, input.databasePageId);

    const [existingTask] = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.id, input.taskId),
          eq(tasks.databasePageId, input.databasePageId)
        )
      )
      .limit(1);

    if (!existingTask) {
      return { error: "Kartu tugas tidak ditemukan." };
    }

    if (input.assigneeId) {
      const [assigneeMember] = await db
        .select({ id: workspaceMembers.id })
        .from(workspaceMembers)
        .where(
          and(
            eq(workspaceMembers.workspaceId, input.workspaceId),
            eq(workspaceMembers.userId, input.assigneeId)
          )
        )
        .limit(1);
      if (!assigneeMember) {
        return { error: "Penanggung jawab bukan anggota workspace ini." };
      }
    }

    const nextStatus = input.status ?? existingTask.status;
    const nextTitle =
      typeof input.title === "string"
        ? input.title.trim() || existingTask.title
        : existingTask.title;

    await db.transaction(async (tx) => {
      let nextPosition = existingTask.positionOrder;
      let shouldRunReindex = false;

      // Kalkulasi ulang posisi kartu apabila dipindahkan di papan Kanban atau berubah kolom status
      const shouldReposition =
        Boolean(input.reposition) ||
        input.prevTaskId !== undefined ||
        input.nextTaskId !== undefined ||
        (input.status !== undefined && input.status !== existingTask.status);

      if (shouldReposition) {
        const columnTasks = await tx
          .select({ id: tasks.id, positionOrder: tasks.positionOrder })
          .from(tasks)
          .where(
            and(
              eq(tasks.databasePageId, input.databasePageId),
              eq(tasks.status, nextStatus)
            )
          )
          .orderBy(asc(tasks.positionOrder));

        const otherTasks = columnTasks.filter((t) => t.id !== input.taskId);
        const posMap = new Map(otherTasks.map((t) => [t.id, t.positionOrder]));

        let prevPos: number | null = null;
        let nextPos: number | null = null;

        if (input.prevTaskId !== undefined || input.nextTaskId !== undefined) {
          prevPos = input.prevTaskId ? (posMap.get(input.prevTaskId) ?? null) : null;
          nextPos = input.nextTaskId ? (posMap.get(input.nextTaskId) ?? null) : null;
        } else {
          // Berpindah kolom status tanpa posisi eksplisit -> tempatkan di akhir kolom baru
          prevPos =
            otherTasks.length > 0
              ? otherTasks[otherTasks.length - 1].positionOrder
              : null;
          nextPos = null;
        }

        nextPosition = generatePosition(prevPos, nextPos);
        if (prevPos !== null && nextPos !== null && needsReindex(prevPos, nextPos)) {
          shouldRunReindex = true;
        }
      }

      const updateValues: Partial<typeof tasks.$inferInsert> = {
        title: nextTitle,
        status: nextStatus,
        priority: input.priority ?? existingTask.priority,
        positionOrder: nextPosition,
      };

      if (input.assigneeId !== undefined) {
        updateValues.assigneeId = input.assigneeId || null;
      }

      if (input.dueDate !== undefined) {
        updateValues.dueDate =
          input.dueDate && /^\d{4}-\d{2}-\d{2}$/.test(input.dueDate)
            ? new Date(`${input.dueDate}T00:00:00Z`)
            : null;
      }

      await tx.update(tasks).set(updateValues).where(eq(tasks.id, input.taskId));

      // Sinkronkan judul ke entitas halaman `task_item` untuk konsistensi pencarian Cmd+K & Backlinks
      if (nextTitle !== existingTask.title) {
        await tx
          .update(pages)
          .set({ title: nextTitle })
          .where(eq(pages.id, existingTask.detailPageId));
      }

      // Re-indexing latar belakang kolom bila selisih fractional index < 0.0001
      if (shouldRunReindex) {
        const refreshedColumn = await tx
          .select({ id: tasks.id })
          .from(tasks)
          .where(
            and(
              eq(tasks.databasePageId, input.databasePageId),
              eq(tasks.status, nextStatus)
            )
          )
          .orderBy(asc(tasks.positionOrder));

        const cleanPositions = reindexPositions(
          refreshedColumn.length,
          DEFAULT_POSITION_STEP
        );
        for (let i = 0; i < refreshedColumn.length; i++) {
          await tx
            .update(tasks)
            .set({ positionOrder: cleanPositions[i] })
            .where(eq(tasks.id, refreshedColumn[i].id));
        }
      }
    });

    revalidatePath(`/workspace/${input.workspaceId}/database/${input.databasePageId}`);
    return { success: true, taskId: input.taskId };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Gagal memperbarui kartu tugas.",
    };
  }
}

/**
 * Server Action: Menghapus kartu tugas beserta halaman detail `task_item` terkait
 */
export async function deleteTaskAction(input: {
  workspaceId: string;
  databasePageId: string;
  taskId: string;
}): Promise<TaskActionResult> {
  try {
    await requireTaskEditAccess(input.workspaceId, input.databasePageId);

    const [existingTask] = await db
      .select({ id: tasks.id, detailPageId: tasks.detailPageId })
      .from(tasks)
      .where(
        and(
          eq(tasks.id, input.taskId),
          eq(tasks.databasePageId, input.databasePageId)
        )
      )
      .limit(1);

    if (!existingTask) {
      return { error: "Kartu tugas tidak ditemukan." };
    }

    // Menghapus halaman `detail_page_id` otomatis melakukan cascade delete pada baris `tasks`
    await db.delete(pages).where(eq(pages.id, existingTask.detailPageId));

    revalidatePath(`/workspace/${input.workspaceId}/database/${input.databasePageId}`);
    return { success: true };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Gagal menghapus kartu tugas.",
    };
  }
}

/**
 * Server Action: Menautkan halaman dokumen (Meeting Notes / SOP) ke kartu tugas via `page_relations`
 */
export async function linkTaskNoteAction(input: {
  workspaceId: string;
  databasePageId: string;
  taskId: string;
  targetPageId: string;
}): Promise<TaskActionResult> {
  try {
    const { user } = await requireTaskEditAccess(
      input.workspaceId,
      input.databasePageId
    );

    const [task] = await db
      .select({ id: tasks.id, detailPageId: tasks.detailPageId })
      .from(tasks)
      .where(
        and(
          eq(tasks.id, input.taskId),
          eq(tasks.databasePageId, input.databasePageId)
        )
      )
      .limit(1);

    if (!task) {
      return { error: "Kartu tugas tidak ditemukan." };
    }

    const [targetPage] = await db
      .select({
        id: pages.id,
        spaceType: pages.spaceType,
        createdBy: pages.createdBy,
        pageType: pages.pageType,
        isArchived: pages.isArchived,
      })
      .from(pages)
      .where(
        and(
          eq(pages.id, input.targetPageId),
          eq(pages.workspaceId, input.workspaceId),
          eq(pages.isArchived, false)
        )
      )
      .limit(1);

    if (!targetPage || targetPage.pageType === "task_item") {
      return { error: "Halaman dokumen tujuan tidak valid." };
    }

    if (targetPage.spaceType === "private" && targetPage.createdBy !== user.id) {
      return {
        error: "403 Forbidden: Tidak dapat menautkan halaman privat milik anggota lain.",
      };
    }

    // Hindari duplikasi relasi `task_note_link`
    const [existingLink] = await db
      .select({ id: pageRelations.id })
      .from(pageRelations)
      .where(
        and(
          eq(pageRelations.sourcePageId, task.detailPageId),
          eq(pageRelations.targetPageId, input.targetPageId),
          eq(pageRelations.relationType, "task_note_link")
        )
      )
      .limit(1);

    if (!existingLink) {
      await db.insert(pageRelations).values({
        id: crypto.randomUUID(),
        sourcePageId: task.detailPageId,
        targetPageId: input.targetPageId,
        relationType: "task_note_link",
      });
    }

    revalidatePath(`/workspace/${input.workspaceId}/database/${input.databasePageId}`);
    revalidatePath(`/workspace/${input.workspaceId}/page/${input.targetPageId}`);
    return { success: true };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Gagal menautkan dokumen ke tugas.",
    };
  }
}

/**
 * Server Action: Melepas tautan dokumen (`task_note_link`) dari kartu tugas
 */
export async function unlinkTaskNoteAction(input: {
  workspaceId: string;
  databasePageId: string;
  taskId: string;
  targetPageId: string;
}): Promise<TaskActionResult> {
  try {
    await requireTaskEditAccess(input.workspaceId, input.databasePageId);

    const [task] = await db
      .select({ id: tasks.id, detailPageId: tasks.detailPageId })
      .from(tasks)
      .where(
        and(
          eq(tasks.id, input.taskId),
          eq(tasks.databasePageId, input.databasePageId)
        )
      )
      .limit(1);

    if (!task) {
      return { error: "Kartu tugas tidak ditemukan." };
    }

    await db
      .delete(pageRelations)
      .where(
        and(
          eq(pageRelations.sourcePageId, task.detailPageId),
          eq(pageRelations.targetPageId, input.targetPageId),
          eq(pageRelations.relationType, "task_note_link")
        )
      );

    revalidatePath(`/workspace/${input.workspaceId}/database/${input.databasePageId}`);
    revalidatePath(`/workspace/${input.workspaceId}/page/${input.targetPageId}`);
    return { success: true };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Gagal melepas tautan dokumen.",
    };
  }
}
