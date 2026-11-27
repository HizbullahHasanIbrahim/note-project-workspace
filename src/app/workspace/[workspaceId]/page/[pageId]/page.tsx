import React, { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { and, asc, eq, ne, or } from "drizzle-orm";
import { db } from "@/db";
import { pageRelations, pages, users, workspaceMembers } from "@/db/schema";
import { createCollabToken, getCurrentUser } from "@/lib/auth";
import { canEditTeamspace } from "@/lib/permissions";
import CollaborativeEditor from "@/components/editor/CollaborativeEditor";
import { PageTitleHeader } from "@/components/editor/PageTitleHeader";
import type { ActiveBacklinkItem } from "@/stores/useWorkspaceUIStore";

interface PageViewProps {
  params: Promise<{ workspaceId: string; pageId: string }>;
}

async function AsyncPageView({ params }: PageViewProps) {
  const { workspaceId, pageId } = await params;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect(`/login?redirect=/workspace/${workspaceId}/page/${pageId}`);
  }

  // 1. Ambil detail halaman
  const [page] = await db
    .select({
      id: pages.id,
      title: pages.title,
      icon: pages.icon,
      spaceType: pages.spaceType,
      pageType: pages.pageType,
      createdBy: pages.createdBy,
      createdAt: pages.createdAt,
      updatedAt: pages.updatedAt,
      isArchived: pages.isArchived,
      creatorName: users.fullName,
    })
    .from(pages)
    .innerJoin(users, eq(pages.createdBy, users.id))
    .where(and(eq(pages.id, pageId), eq(pages.workspaceId, workspaceId)))
    .limit(1);

  if (!page || page.isArchived) {
    notFound();
  }

  // 2. Data Guard Anti-IDOR: Halaman private hanya dapat dibuka oleh pembuatnya!
  if (page.spaceType === "private" && page.createdBy !== currentUser.id) {
    notFound();
  }

  // 3. Cek peran pengguna di workspace
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

  const isReadOnly = !canEditTeamspace(membership.role);

  // 4. Ambil daftar halaman yang dapat ditautkan melalui pemicu `[[`
  const accessiblePages = await db
    .select({
      id: pages.id,
      title: pages.title,
      icon: pages.icon,
      pageType: pages.pageType,
      spaceType: pages.spaceType,
      createdBy: pages.createdBy,
    })
    .from(pages)
    .where(
      and(
        eq(pages.workspaceId, workspaceId),
        eq(pages.isArchived, false),
        ne(pages.pageType, "task_item"),
        or(
          eq(pages.spaceType, "teamspace"),
          and(
            eq(pages.spaceType, "private"),
            eq(pages.createdBy, currentUser.id)
          )
        )
      )
    )
    .orderBy(asc(pages.positionOrder));

  // 5. Ambil daftar Backlinks (Incoming & Outgoing) dengan penyamaran halaman privat orang lain (PRD §5.2)
  const incomingRows = await db
    .select({
      relId: pageRelations.id,
      relationType: pageRelations.relationType,
      linkedPageId: pages.id,
      title: pages.title,
      icon: pages.icon,
      spaceType: pages.spaceType,
      createdBy: pages.createdBy,
      isArchived: pages.isArchived,
    })
    .from(pageRelations)
    .innerJoin(pages, eq(pageRelations.sourcePageId, pages.id))
    .where(
      and(
        eq(pageRelations.targetPageId, pageId),
        eq(pages.workspaceId, workspaceId),
        eq(pages.isArchived, false)
      )
    );

  const outgoingRows = await db
    .select({
      relId: pageRelations.id,
      relationType: pageRelations.relationType,
      linkedPageId: pages.id,
      title: pages.title,
      icon: pages.icon,
      spaceType: pages.spaceType,
      createdBy: pages.createdBy,
      isArchived: pages.isArchived,
    })
    .from(pageRelations)
    .innerJoin(pages, eq(pageRelations.targetPageId, pages.id))
    .where(
      and(
        eq(pageRelations.sourcePageId, pageId),
        eq(pages.workspaceId, workspaceId),
        eq(pages.isArchived, false)
      )
    );

  const mapBacklinkRow = (
    row: (typeof incomingRows)[number],
    direction: "incoming" | "outgoing"
  ): ActiveBacklinkItem => {
    const isPrivateMasked =
      row.spaceType === "private" && row.createdBy !== currentUser.id;
    return {
      id: `${direction}-${row.relId}`,
      relationType: row.relationType,
      direction,
      pageId: isPrivateMasked ? "" : row.linkedPageId,
      title: isPrivateMasked ? "[Halaman Privat]" : row.title,
      icon: isPrivateMasked ? null : row.icon,
      isPrivateMasked,
      spaceType: row.spaceType,
    };
  };

  const initialBacklinks: ActiveBacklinkItem[] = [
    ...incomingRows.map((r) => mapBacklinkRow(r, "incoming")),
    ...outgoingRows.map((r) => mapBacklinkRow(r, "outgoing")),
  ];

  // 6. Token otorisasi WebSocket jangka pendek untuk Hocuspocus
  const collabToken = createCollabToken({
    id: currentUser.id,
    email: currentUser.email,
    fullName: currentUser.fullName,
  });

  return (
    <div className="w-full max-w-[72ch] mx-auto py-10 px-6 sm:px-8 flex flex-col gap-6">
      <PageTitleHeader
        workspaceId={workspaceId}
        pageId={page.id}
        initialTitle={page.title}
        initialIcon={page.icon}
        spaceType={page.spaceType}
        creatorName={page.creatorName}
        updatedAtIso={page.updatedAt.toISOString()}
        isReadOnly={isReadOnly}
      />

      <CollaborativeEditor
        workspaceId={workspaceId}
        pageId={page.id}
        initialTitle={page.title}
        initialIcon={page.icon}
        collabToken={collabToken}
        currentUser={{
          id: currentUser.id,
          name: currentUser.fullName,
        }}
        isReadOnly={isReadOnly}
        linkablePages={accessiblePages.map((p) => ({
          id: p.id,
          title: p.title,
          icon: p.icon,
          pageType: p.pageType,
        }))}
        initialBacklinks={initialBacklinks}
      />
    </div>
  );
}

export default function PageView({ params }: PageViewProps) {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-[72ch] mx-auto py-10 px-8 text-sm text-on-surface-variant">
          Memuat halaman...
        </div>
      }
    >
      <AsyncPageView params={params} />
    </Suspense>
  );
}
