import React, { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { and, desc, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { workspaces, workspaceMembers, workspaceInvites, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { SettingsClientView } from "./SettingsClientView";

interface SettingsPageProps {
  params: Promise<{ workspaceId: string }>;
}

async function AsyncSettingsPage({ params }: SettingsPageProps) {
  const { workspaceId } = await params;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  // Cek keanggotaan pengguna saat ini
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

  // Ambil detail workspace
  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);

  if (!workspace) {
    notFound();
  }

  // Ambil seluruh anggota workspace
  const membersList = await db
    .select({
      id: workspaceMembers.id,
      userId: users.id,
      fullName: users.fullName,
      email: users.email,
      avatarUrl: users.avatarUrl,
      role: workspaceMembers.role,
      joinedAt: workspaceMembers.joinedAt,
    })
    .from(workspaceMembers)
    .innerJoin(users, eq(workspaceMembers.userId, users.id))
    .where(eq(workspaceMembers.workspaceId, workspaceId));

  // Ambil seluruh tautan undangan aktif
  const now = new Date();
  const activeInvites = await db
    .select({
      id: workspaceInvites.id,
      defaultRole: workspaceInvites.defaultRole,
      expiresAt: workspaceInvites.expiresAt,
      createdAt: workspaceInvites.createdAt,
    })
    .from(workspaceInvites)
    .where(
      and(
        eq(workspaceInvites.workspaceId, workspaceId),
        eq(workspaceInvites.isRevoked, false),
        gt(workspaceInvites.expiresAt, now)
      )
    )
    .orderBy(desc(workspaceInvites.createdAt));

  return (
    <div className="w-full max-w-4xl mx-auto py-10 px-8 flex flex-col gap-8">
      {/* Header Pengaturan */}
      <div className="flex flex-col gap-2">
        <h1 className="font-[family-name:var(--font-jakarta)] text-display-small text-on-surface font-bold tracking-tight">
          Pengaturan Ruang Kerja
        </h1>
        <p className="text-body-medium text-on-surface-variant text-sm">
          Kelola nama workspace, matriks RBAC anggota tim (maks. 20), dan kuota penyimpanan (1 GB).
        </p>
      </div>

      {/* Komponen Klien Pengaturan (Tabs: General, Members, Storage) */}
      <SettingsClientView
        workspace={workspace}
        members={membersList}
        activeInvites={activeInvites}
        currentUserRole={currentMembership.role}
        currentUserId={currentUser.id}
      />
    </div>
  );
}

export default function SettingsPage({ params }: SettingsPageProps) {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-4xl mx-auto py-10 px-8 flex items-center justify-center text-sm text-on-surface-variant">
          Memuat pengaturan...
        </div>
      }
    >
      <AsyncSettingsPage params={params} />
    </Suspense>
  );
}
