import React, { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { and, asc, eq, inArray, ne, or } from "drizzle-orm";
import { Lock } from "lucide-react";
import { db } from "@/db";
import { pageRelations, pages, tasks, users, workspaceMembers } from "@/db/schema";
import { createCollabToken, getCurrentUser } from "@/lib/auth";
import { canEditTasks } from "@/lib/permissions";
import { TaskDatabaseWorkspace } from "@/components/database/TaskDatabaseWorkspace";
import type { DatabaseViewMode } from "@/components/database/ViewSwitcher";
import type {
  DatabaseMemberOption,
  DatabaseTaskItem,
  LinkableDatabasePageOption,
  LinkedPageSummary,
} from "@/components/database/task-types";

interface DatabasePageProps {
  params: Promise<{ workspaceId: string; dbId: string }>;
  searchParams?: Promise<{ task?: string; view?: string }>;
}

function formatDueDate(value: Date | string | null): string | null {
  if (!value) return null;
  if (typeof value === "string") {
    return value.slice(0, 10);
  }
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, "0");
  const d = String(value.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

async function AsyncDatabasePage({ params, searchParams }: DatabasePageProps) {
  const { workspaceId, dbId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect(`/login?redirect=/workspace/${workspaceId}/database/${dbId}`);
  }

  // 1. Verifikasi keanggotaan workspace
  const [membership] = await db
    .select()
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, currentUser.id)
      )
    )
    .limit(1);

  if (!membership) {
    notFound();
  }

  // 2. Ambil metadata halaman database tugas
  const [databasePage] = await db
    .select()
    .from(pages)
    .where(
      and(
        eq(pages.id, dbId),
        eq(pages.workspaceId, workspaceId),
        eq(pages.pageType, "database"),
        eq(pages.isArchived, false)
      )
    )
    .limit(1);

  if (!databasePage) {
    notFound();
  }

  // 3. Anti-IDOR: Isolasi Private Space
  if (
    databasePage.spaceType === "private" &&
    databasePage.createdBy !== currentUser.id
  ) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-[28px] bg-surface-container-high border border-outline-variant p-6 flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-error-container text-on-error-container flex items-center justify-center">
            <Lock className="w-6 h-6" aria-hidden="true" />
          </div>
          <h1 className="text-lg font-bold text-on-surface">
            Akses Private Space Ditolak
          </h1>
          <p className="text-sm text-on-surface-variant">
            Database tugas ini berada di Private Space milik pengguna lain dan
            tidak dapat dibuka.
          </p>
        </div>
      </div>
    );
  }

  // 4. Ambil seluruh kartu tugas beserta detail penanggung jawab
  const rawTasks = await db
    .select({
      id: tasks.id,
      databasePageId: tasks.databasePageId,
      detailPageId: tasks.detailPageId,
      title: tasks.title,
      status: tasks.status,
      priority: tasks.priority,
      assigneeId: tasks.assigneeId,
      dueDate: tasks.dueDate,
      positionOrder: tasks.positionOrder,
      assigneeName: users.fullName,
      assigneeEmail: users.email,
    })
    .from(tasks)
    .innerJoin(pages, eq(tasks.detailPageId, pages.id))
    .leftJoin(users, eq(tasks.assigneeId, users.id))
    .where(
      and(
        eq(tasks.databasePageId, dbId),
        eq(pages.workspaceId, workspaceId),
        eq(pages.isArchived, false)
      )
    )
    .orderBy(asc(tasks.positionOrder));

  // 5. Ambil relasi dokumen terkait (task_note_link) dengan masking anti-IDOR Private Space
  const detailPageIds = rawTasks.map((t) => t.detailPageId);
  const linkedMap = new Map<string, LinkedPageSummary[]>();

  if (detailPageIds.length > 0) {
    const relationRows = await db
      .select({
        relId: pageRelations.id,
        sourcePageId: pageRelations.sourcePageId,
        targetPageId: pages.id,
        targetTitle: pages.title,
        targetIcon: pages.icon,
        targetPageType: pages.pageType,
        targetSpaceType: pages.spaceType,
        targetCreatedBy: pages.createdBy,
      })
      .from(pageRelations)
      .innerJoin(pages, eq(pageRelations.targetPageId, pages.id))
      .where(
        and(
          inArray(pageRelations.sourcePageId, detailPageIds),
          eq(pageRelations.relationType, "task_note_link"),
          eq(pages.workspaceId, workspaceId),
          eq(pages.isArchived, false)
        )
      );

    for (const row of relationRows) {
      const isMaskedPrivate =
        row.targetSpaceType === "private" &&
        row.targetCreatedBy !== currentUser.id;
      const list = linkedMap.get(row.sourcePageId) ?? [];
      list.push({
        id: isMaskedPrivate ? `masked-${row.relId}` : row.targetPageId,
        title: isMaskedPrivate ? "[Halaman Privat]" : row.targetTitle,
        icon: isMaskedPrivate ? null : row.targetIcon,
        pageType: row.targetPageType,
        isMaskedPrivate,
      });
      linkedMap.set(row.sourcePageId, list);
    }
  }

  const initialTasks: DatabaseTaskItem[] = rawTasks.map((row) => ({
    id: row.id,
    databasePageId: row.databasePageId,
    detailPageId: row.detailPageId,
    title: row.title,
    status: row.status,
    priority: row.priority,
    assigneeId: row.assigneeId,
    assigneeName: row.assigneeName,
    assigneeEmail: row.assigneeEmail,
    dueDate: formatDueDate(row.dueDate),
    positionOrder: row.positionOrder,
    linkedPages: linkedMap.get(row.detailPageId) ?? [],
  }));

  // 6. Ambil daftar anggota workspace untuk dropdown penanggung jawab
  const rawMembers = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      email: users.email,
      role: workspaceMembers.role,
    })
    .from(workspaceMembers)
    .innerJoin(users, eq(workspaceMembers.userId, users.id))
    .where(eq(workspaceMembers.workspaceId, workspaceId))
    .orderBy(asc(users.fullName));

  const members: DatabaseMemberOption[] = rawMembers;

  // 7. Ambil halaman yang boleh ditautkan ke tugas (Teamspace + Private milik sendiri)
  const rawLinkablePages = await db
    .select({
      id: pages.id,
      title: pages.title,
      icon: pages.icon,
      pageType: pages.pageType,
      spaceType: pages.spaceType,
    })
    .from(pages)
    .where(
      and(
        eq(pages.workspaceId, workspaceId),
        eq(pages.isArchived, false),
        ne(pages.pageType, "task_item"),
        ne(pages.id, dbId),
        or(
          eq(pages.spaceType, "teamspace"),
          and(
            eq(pages.spaceType, "private"),
            eq(pages.createdBy, currentUser.id)
          )
        )
      )
    )
    .orderBy(asc(pages.title));

  const linkablePages: LinkableDatabasePageOption[] = rawLinkablePages;

  const collabToken = createCollabToken({
    id: currentUser.id,
    email: currentUser.email,
    fullName: currentUser.fullName,
  });

  const requestedView = resolvedSearchParams.view;
  const initialViewMode: DatabaseViewMode =
    requestedView === "table" ||
    requestedView === "calendar" ||
    requestedView === "kanban"
      ? requestedView
      : "kanban";

  const requestedTaskParam = resolvedSearchParams.task;
  const matchedTask = requestedTaskParam
    ? initialTasks.find(
        (t) =>
          t.id === requestedTaskParam || t.detailPageId === requestedTaskParam
      )
    : undefined;

  return (
    <TaskDatabaseWorkspace
      workspaceId={workspaceId}
      databasePageId={databasePage.id}
      databaseTitle={databasePage.title}
      databaseIcon={databasePage.icon}
      spaceType={databasePage.spaceType}
      initialTasks={initialTasks}
      members={members}
      linkablePages={linkablePages}
      collabToken={collabToken}
      currentUser={{
        id: currentUser.id,
        name: currentUser.fullName,
      }}
      isReadOnly={!canEditTasks(membership.role)}
      initialViewMode={initialViewMode}
      initialSelectedTaskId={matchedTask?.id ?? null}
    />
  );
}

export default function DatabasePage(props: DatabasePageProps) {
  return (
    <Suspense
      fallback={
        <div className="p-8 flex flex-col gap-4 animate-pulse">
          <div className="h-10 w-64 rounded-2xl bg-surface-container-high" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="h-72 rounded-2xl bg-surface-container" />
            <div className="h-72 rounded-2xl bg-surface-container" />
            <div className="h-72 rounded-2xl bg-surface-container" />
            <div className="h-72 rounded-2xl bg-surface-container" />
          </div>
        </div>
      }
    >
      <AsyncDatabasePage {...props} />
    </Suspense>
  );
}
