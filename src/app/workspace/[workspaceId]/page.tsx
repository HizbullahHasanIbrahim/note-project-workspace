import React, { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { pages, workspaceMembers } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

interface WorkspaceIndexPageProps {
  params: Promise<{ workspaceId: string }>;
}

async function AsyncWorkspaceIndexPage({
  params,
}: WorkspaceIndexPageProps) {
  await connection();
  const { workspaceId } = await params;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect(`/login?redirect=/workspace/${workspaceId}`);
  }

  // Verifikasi keanggotaan pengguna aktif di ruang kerja ini (Anti-IDOR)
  const [membership] = await db
    .select({ id: workspaceMembers.id })
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

  // Cari halaman pertama di Shared Teamspace
  const [firstPage] = await db
    .select({ id: pages.id })
    .from(pages)
    .where(
      and(
        eq(pages.workspaceId, workspaceId),
        eq(pages.spaceType, "teamspace"),
        eq(pages.isArchived, false)
      )
    )
    .orderBy(asc(pages.positionOrder))
    .limit(1);

  if (firstPage) {
    redirect(`/workspace/${workspaceId}/page/${firstPage.id}`);
  }

  return (
    <div className="w-full max-w-[840px] mx-auto py-16 px-8 flex flex-col items-center text-center gap-4">
      <div className="text-4xl">🚀</div>
      <h1 className="font-[family-name:var(--font-jakarta)] text-headline-medium text-on-surface font-bold">
        Ruang Kerja Kosong
      </h1>
      <p className="text-body-medium text-on-surface-variant text-sm max-w-md">
        Belum ada halaman di Shared Teamspace. Klik tombol <strong>+</strong> pada bilah navigasi kiri untuk membuat halaman pertama Anda.
      </p>
    </div>
  );
}

export default function WorkspaceIndexPage({
  params,
}: WorkspaceIndexPageProps) {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-[840px] mx-auto py-16 px-8 text-sm text-on-surface-variant">
          Menyiapkan ruang kerja...
        </div>
      }
    >
      <AsyncWorkspaceIndexPage params={params} />
    </Suspense>
  );
}
