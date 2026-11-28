"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { workspaces, workspaceMembers, workspaceInvites, type users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

/**
 * Memverifikasi apakah pengguna aktif memiliki peran Admin di workspace ini
 */
async function requireWorkspaceAdmin(workspaceId: string) {
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

  if (!membership || membership.role !== "admin") {
    throw new Error("Hanya Admin yang memiliki hak akses untuk tindakan ini.");
  }

  return { user, membership };
}

/**
 * Server Action: Perbarui Nama Workspace
 */
export async function updateWorkspaceNameAction(workspaceId: string, formData: FormData) {
  await requireWorkspaceAdmin(workspaceId);
  const name = formData.get("name")?.toString().trim();

  if (!name || name.length < 2) {
    return { error: "Nama workspace minimal 2 karakter." };
  }

  await db
    .update(workspaces)
    .set({ name })
    .where(eq(workspaces.id, workspaceId));

  revalidatePath(`/workspace/${workspaceId}/settings`);
  return { success: true };
}

/**
 * Server Action: Ubah Peran Anggota (Admin, Member, Viewer)
 * Memastikan proteksi: Admin tunggal tidak dapat menurunkan peran sendiri (PRD §4.1 US-02)
 */
export async function updateMemberRoleAction(
  workspaceId: string,
  targetUserId: string,
  newRole: "admin" | "member" | "viewer"
) {
  const { user } = await requireWorkspaceAdmin(workspaceId);

  // Jika admin ingin menurunkan perannya sendiri, pastikan ada admin lain
  if (user.id === targetUserId && newRole !== "admin") {
    const [adminCountRow] = (await db.execute(
      sql`SELECT COUNT(*) as count FROM workspace_members WHERE workspace_id = ${workspaceId} AND role = 'admin'`
    )) as unknown as [Array<{ count: number }>];

    if (Number(adminCountRow[0]?.count || 0) <= 1) {
      return {
        error:
          "Admin tunggal tidak dapat menurunkan perannya sendiri sebelum menunjuk Admin pengganti.",
      };
    }
  }

  await db
    .update(workspaceMembers)
    .set({ role: newRole })
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, targetUserId)
      )
    );

  revalidatePath(`/workspace/${workspaceId}/settings`);
  return { success: true };
}

/**
 * Server Action: Hapus Anggota dari Workspace
 */
export async function removeMemberAction(workspaceId: string, targetUserId: string) {
  const { user } = await requireWorkspaceAdmin(workspaceId);

  if (user.id === targetUserId) {
    return { error: "Anda tidak dapat menghapus diri sendiri melalui menu ini." };
  }

  await db
    .delete(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, targetUserId)
      )
    );

  revalidatePath(`/workspace/${workspaceId}/settings`);
  return { success: true };
}

/**
 * Server Action: Buat Tautan Undangan Baru (Token SHA-256 Hash, berlaku 7 hari)
 */
export async function createInviteLinkAction(
  workspaceId: string,
  defaultRole: "member" | "viewer" = "member"
) {
  await requireWorkspaceAdmin(workspaceId);

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 hari

  await db.insert(workspaceInvites).values({
    id: crypto.randomUUID(),
    workspaceId,
    tokenHash,
    defaultRole: defaultRole === "viewer" ? "viewer" : "member",
    expiresAt,
    isRevoked: false,
  });

  revalidatePath(`/workspace/${workspaceId}/settings`);
  return { token: rawToken };
}

/**
 * Server Action: Cabut Tautan Undangan Aktif
 */
export async function revokeInviteAction(
  workspaceId: string,
  inviteId: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    await requireWorkspaceAdmin(workspaceId);

    await db
      .update(workspaceInvites)
      .set({ isRevoked: true })
      .where(
        and(
          eq(workspaceInvites.id, inviteId),
          eq(workspaceInvites.workspaceId, workspaceId)
        )
      );

    revalidatePath(`/workspace/${workspaceId}/settings`);
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || "Gagal mencabut tautan undangan." };
  }
}
