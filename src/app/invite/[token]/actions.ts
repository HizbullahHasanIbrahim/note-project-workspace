"use server";

import crypto from "crypto";
import { redirect } from "next/navigation";
import { and, eq, gt, sql } from "drizzle-orm";
import { db } from "@/db";
import { workspaces, workspaceMembers, workspaceInvites } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export interface InviteActionResult {
  error?: string;
  success?: boolean;
}

/**
 * Server Action untuk memverifikasi dan menerima undangan workspace
 * Dilengkapi transaksi database & row-level locking (SELECT ... FOR UPDATE)
 * guna memitigasi race condition kuota maksimal 20 anggota (PRD §8.1 #1).
 */
export async function acceptInviteAction(token: string): Promise<InviteActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?redirect=/invite/${token}`);
  }

  if (!token) {
    return { error: "Token undangan tidak valid." };
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const now = new Date();

  let targetWorkspaceId = "";

  try {
    await db.transaction(async (tx) => {
      // 1. Cari undangan aktif
      const [invite] = await tx
        .select()
        .from(workspaceInvites)
        .where(
          and(
            eq(workspaceInvites.tokenHash, tokenHash),
            eq(workspaceInvites.isRevoked, false),
            gt(workspaceInvites.expiresAt, now)
          )
        )
        .limit(1);

      if (!invite) {
        throw new Error("Tautan undangan tidak valid atau sudah kedaluwarsa.");
      }

      targetWorkspaceId = invite.workspaceId;

      // 2. Kunci baris workspace dengan SELECT ... FOR UPDATE untuk mencegah race condition kuota 20 anggota
      const [workspaceRows] = await tx.execute(
        sql`SELECT id, name, max_members FROM workspaces WHERE id = ${invite.workspaceId} FOR UPDATE`
      ) as unknown as [Array<{ id: string; name: string; max_members: number }>];

      if (!workspaceRows || workspaceRows.length === 0) {
        throw new Error("Ruang kerja tidak ditemukan.");
      }

      const workspace = workspaceRows[0];

      // 3. Hitung jumlah anggota aktif saat ini
      const [countRows] = await tx.execute(
        sql`SELECT COUNT(*) as memberCount FROM workspace_members WHERE workspace_id = ${invite.workspaceId}`
      ) as unknown as [Array<{ memberCount: number }>];

      const currentMemberCount = Number(countRows[0]?.memberCount || 0);

      // Cek apakah pengguna sudah menjadi anggota
      const [existingMember] = await tx
        .select()
        .from(workspaceMembers)
        .where(
          and(
            eq(workspaceMembers.workspaceId, invite.workspaceId),
            eq(workspaceMembers.userId, user.id)
          )
        )
        .limit(1);

      if (existingMember) {
        // Sudah bergabung, tidak perlu menambah baris
        return;
      }

      // Validasi batas keras kuota 20 anggota
      if (currentMemberCount >= workspace.max_members) {
        throw new Error(
          `Batas kuota ${workspace.max_members} anggota pada ruang kerja ini telah tercapai.`
        );
      }

      // 4. Masukkan pengguna ke ruang kerja dengan peran default undangan
      await tx.insert(workspaceMembers).values({
        id: crypto.randomUUID(),
        workspaceId: invite.workspaceId,
        userId: user.id,
        role: invite.defaultRole,
      });
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memproses undangan.";
    return { error: message };
  }

  redirect(`/workspace/${targetWorkspaceId}`);
}
