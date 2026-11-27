import React, { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { and, asc, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { workspaces, workspaceMembers, pages } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { NavDrawer, NavDrawerPageItem } from "@/components/shell/NavDrawer";
import { Topbar } from "@/components/shell/Topbar";
import { SupportingPane } from "@/components/shell/SupportingPane";

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

  // 5. Hitung Jumlah Anggota Aktif
  const [countRows] = (await db.execute(
    sql`SELECT COUNT(*) as memberCount FROM workspace_members WHERE workspace_id = ${workspaceId}`
  )) as unknown as [Array<{ memberCount: number }>];

  const currentMemberCount = Number(countRows[0]?.memberCount || 1);

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
        />

        {/* Kanvas Utama Dokumen */}
        <main
          aria-label="Area Kerja Utama"
          className="flex-1 min-w-0 bg-surface-container-lowest rounded-tl-2xl border-t border-l border-outline-variant/30 overflow-y-auto"
        >
          {children}
        </main>

        {/* Right Supporting Pane */}
        <SupportingPane workspaceId={workspaceId} />
      </div>
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
