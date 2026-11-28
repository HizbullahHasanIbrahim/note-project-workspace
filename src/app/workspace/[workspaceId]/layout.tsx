import React, { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { and, asc, desc, eq, ne, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  commentMentions,
  comments,
  pages,
  tasks,
  users,
  workspaceMembers,
  workspaces,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { NavDrawer, NavDrawerPageItem } from "@/components/shell/NavDrawer";
import { Topbar } from "@/components/shell/Topbar";
import { SupportingPane } from "@/components/shell/SupportingPane";
import { QuickCommandModal } from "@/components/shell/QuickCommandModal";
import type { UnreadMentionItem } from "@/components/shell/MentionsPopover";
import type { WorkspaceMemberSummary } from "@/stores/useWorkspaceUIStore";

interface WorkspaceLayoutProps {
  children: React.ReactNode;
  params: Promise<{ workspaceId: string }>;
}

async function AsyncWorkspaceShell({
  params,
  children,
}: {
  params: Promise<{ workspaceId: string }>;
  children: React.ReactNode;
}) {
  await connection();
  const { workspaceId } = await params;
  const currentUser = await getCurrentUser();

  // Pengguna belum login dialihkan ke halaman masuk
  if (!currentUser) {
    redirect(`/login?redirect=/workspace/${workspaceId}`);
  }

  // Penanganan khusus rute "/workspace/demo"
  if (workspaceId === "demo") {
    const [firstMembership] = await db
      .select()
      .from(workspaceMembers)
      .where(eq(workspaceMembers.userId, currentUser.id))
      .limit(1);

    if (firstMembership) {
      redirect(`/workspace/${firstMembership.workspaceId}`);
    } else {
      redirect("/onboarding");
    }
  }

  // 1. Verifikasi Keanggotaan Workspace (Anti-IDOR Protection)
  const [currentMembership] = await db
    .select()
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, currentUser.id)
      )
    )
    .limit(1);

  if (!currentMembership) {
    notFound();
  }

  // 2. Ambil Informasi Workspace
  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);

  if (!workspace) {
    notFound();
  }

  // 3. Ambil Halaman Shared Teamspace (kecuali task_item)
  const rawTeamspacePages = await db
    .select({
      id: pages.id,
      title: pages.title,
      icon: pages.icon,
      pageType: pages.pageType,
      spaceType: pages.spaceType,
      parentPageId: pages.parentPageId,
      createdBy: pages.createdBy,
      positionOrder: pages.positionOrder,
    })
    .from(pages)
    .where(
      and(
        eq(pages.workspaceId, workspaceId),
        eq(pages.spaceType, "teamspace"),
        ne(pages.pageType, "task_item"),
        eq(pages.isArchived, false)
      )
    )
    .orderBy(asc(pages.positionOrder));

  // 4. Ambil Halaman Private Space (Anti-IDOR: hanya created_by == current_user_id)
  const rawPrivatePages = await db
    .select({
      id: pages.id,
      title: pages.title,
      icon: pages.icon,
      pageType: pages.pageType,
      spaceType: pages.spaceType,
      parentPageId: pages.parentPageId,
      createdBy: pages.createdBy,
      positionOrder: pages.positionOrder,
    })
    .from(pages)
    .where(
      and(
        eq(pages.workspaceId, workspaceId),
        eq(pages.spaceType, "private"),
        eq(pages.createdBy, currentUser.id),
        ne(pages.pageType, "task_item"),
        eq(pages.isArchived, false)
      )
    )
    .orderBy(asc(pages.positionOrder));

  // 5. Hitung Jumlah Anggota Aktif & Ambil Daftar Anggota + Notifikasi @mention
  const [countRows] = (await db.execute(
    sql`SELECT COUNT(*) as memberCount FROM workspace_members WHERE workspace_id = ${workspaceId}`
  )) as unknown as [Array<{ memberCount: number }>];

  const currentMemberCount = Number(countRows[0]?.memberCount || 1);

  const rawMembers = await db
    .select({
      userId: users.id,
      fullName: users.fullName,
      email: users.email,
      role: workspaceMembers.role,
    })
    .from(workspaceMembers)
    .innerJoin(users, eq(workspaceMembers.userId, users.id))
    .where(eq(workspaceMembers.workspaceId, workspaceId))
    .orderBy(asc(users.fullName));

  const workspaceMemberList: WorkspaceMemberSummary[] = rawMembers;

  // Ambil daftar notifikasi @mention milik pengguna saat ini dengan isolasi Private Space
  const rawMentions = await db
    .select({
      id: commentMentions.id,
      commentId: comments.id,
      pageId: pages.id,
      pageTitle: pages.title,
      pageType: pages.pageType,
      databasePageId: tasks.databasePageId,
      authorName: users.fullName,
      content: comments.content,
      isRead: commentMentions.isRead,
      createdAt: commentMentions.createdAt,
    })
    .from(commentMentions)
    .innerJoin(comments, eq(commentMentions.commentId, comments.id))
    .innerJoin(pages, eq(comments.pageId, pages.id))
    .innerJoin(users, eq(comments.authorId, users.id))
    .leftJoin(tasks, eq(tasks.detailPageId, pages.id))
    .where(
      and(
        eq(commentMentions.mentionedUserId, currentUser.id),
        eq(pages.workspaceId, workspaceId),
        eq(pages.isArchived, false),
        or(
          eq(pages.spaceType, "teamspace"),
          and(
            eq(pages.spaceType, "private"),
            eq(pages.createdBy, currentUser.id)
          )
        )
      )
    )
    .orderBy(asc(commentMentions.isRead), desc(commentMentions.createdAt))
    .limit(20);

  const unreadMentions: UnreadMentionItem[] = rawMentions.map((m) => ({
    id: m.id,
    commentId: m.commentId,
    pageId: m.pageId,
    pageTitle: m.pageTitle,
    pageType: m.pageType,
    databasePageId: m.databasePageId,
    authorName: m.authorName,
    content: m.content,
    isRead: m.isRead,
    createdAt: m.createdAt.toISOString(),
  }));

  const teamspacePages: NavDrawerPageItem[] = rawTeamspacePages.map((p) => ({
    id: p.id,
    title: p.title,
    icon: p.icon,
    pageType: p.pageType,
    spaceType: p.spaceType,
    parentPageId: p.parentPageId,
    createdBy: p.createdBy,
    positionOrder: p.positionOrder,
  }));

  const privatePages: NavDrawerPageItem[] = rawPrivatePages.map((p) => ({
    id: p.id,
    title: p.title,
    icon: p.icon,
    pageType: p.pageType,
    spaceType: p.spaceType,
    parentPageId: p.parentPageId,
    createdBy: p.createdBy,
    positionOrder: p.positionOrder,
  }));

  return (
    <div className="h-screen w-screen flex flex-col bg-surface overflow-hidden">
      {/* Topbar Kanonik M3 dengan Data Keanggotaan & Status Kolaborasi Real-Time */}
      <Topbar
        workspaceId={workspaceId}
        userName={currentUser.fullName}
        userRole={currentMembership.role}
        pageTitle={teamspacePages[0]?.title || "Dokumen Utama"}
        mentions={unreadMentions}
      />

      {/* Kontainer Utama 3-Pane Adaptive Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Drawer dengan Pohon Halaman Bersarang (Maks 5 Tingkat) */}
        <NavDrawer
          workspaceId={workspaceId}
          workspaceName={workspace.name}
          currentMemberCount={currentMemberCount}
          maxMembers={workspace.maxMembers}
          storageUsedBytes={workspace.storageUsedBytes}
          storageLimitBytes={workspace.storageLimitBytes}
          userRole={currentMembership.role}
          currentUserId={currentUser.id}
          teamspacePages={teamspacePages}
          privatePages={privatePages}
          unreadMentionsCount={unreadMentions.filter((m) => !m.isRead).length}
        />

        {/* Kanvas Utama Dokumen */}
        <main
          aria-label="Area Kerja Utama"
          className="flex-1 min-w-0 bg-surface-container-lowest md:rounded-tl-2xl border-t md:border-l border-outline-variant/30 overflow-y-auto pb-24 md:pb-0"
        >
          {children}
        </main>

        {/* Right Supporting Pane */}
        <SupportingPane
          workspaceId={workspaceId}
          userRole={currentMembership.role}
          currentUserId={currentUser.id}
          members={workspaceMemberList}
        />
      </div>

      {/* Pencarian Cepat Cmd+K */}
      <QuickCommandModal
        workspaceId={workspaceId}
        userRole={currentMembership.role}
      />
    </div>
  );
}

export default function WorkspaceLayout({
  children,
  params,
}: WorkspaceLayoutProps) {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-screen flex items-center justify-center bg-surface text-on-surface font-medium text-sm">
          Memuat ruang kerja...
        </div>
      }
    >
      <AsyncWorkspaceShell params={params}>{children}</AsyncWorkspaceShell>
    </Suspense>
  );
}
