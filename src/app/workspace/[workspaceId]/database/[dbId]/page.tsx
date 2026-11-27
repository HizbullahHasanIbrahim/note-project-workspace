import React, { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { pages, tasks, workspaceMembers } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { Database, CheckCircle2, Clock, Circle, Flame } from "lucide-react";

interface DatabasePageProps {
  params: Promise<{ workspaceId: string; dbId: string }>;
}

async function AsyncDatabasePreview({ params }: DatabasePageProps) {
  const { workspaceId, dbId } = await params;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect(`/login?redirect=/workspace/${workspaceId}/database/${dbId}`);
  }

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

  const [dbPage] = await db
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

  if (!dbPage) {
    notFound();
  }

  if (dbPage.spaceType === "private" && dbPage.createdBy !== currentUser.id) {
    notFound();
  }

  const dbTasks = await db
    .select()
    .from(tasks)
    .where(eq(tasks.databasePageId, dbId))
    .orderBy(asc(tasks.positionOrder));

  return (
    <div className="w-full max-w-5xl mx-auto py-10 px-8 flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-secondary-container text-on-secondary-container flex items-center justify-center">
          <Database className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <h1 className="font-[family-name:var(--font-jakarta)] text-headline-medium text-on-surface font-bold">
            {dbPage.title}
          </h1>
          <p className="text-xs text-on-surface-variant">
            Task Database Relasional • {dbTasks.length} tugas terdaftar
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-outline-variant/40 bg-card-surface overflow-hidden">
        <div className="p-3.5 bg-surface-container border-b border-outline-variant/40 text-xs font-semibold text-on-surface-variant grid grid-cols-12 gap-2">
          <div className="col-span-6">Judul Tugas</div>
          <div className="col-span-3">Status</div>
          <div className="col-span-3">Prioritas</div>
        </div>
        <div className="divide-y divide-outline-variant/30">
          {dbTasks.map((task) => (
            <div
              key={task.id}
              className="p-3.5 text-xs grid grid-cols-12 gap-2 items-center"
            >
              <div className="col-span-6 font-medium text-on-surface">
                {task.title}
              </div>
              <div className="col-span-3">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-medium">
                  {task.status === "done" ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : task.status === "in_progress" ? (
                    <Clock className="w-3 h-3" />
                  ) : (
                    <Circle className="w-3 h-3" />
                  )}
                  <span>{task.status}</span>
                </span>
              </div>
              <div className="col-span-3">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-tertiary-container text-on-tertiary-container font-medium capitalize">
                  {task.priority === "urgent" && <Flame className="w-3 h-3" />}
                  <span>{task.priority}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DatabasePage({ params }: DatabasePageProps) {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-5xl mx-auto py-10 px-8 text-sm text-on-surface-variant">
          Memuat database tugas...
        </div>
      }
    >
      <AsyncDatabasePreview params={params} />
    </Suspense>
  );
}
