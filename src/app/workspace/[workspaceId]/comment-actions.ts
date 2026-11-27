"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  commentMentions,
  comments,
  pages,
  users,
  workspaceMembers,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { canComment } from "@/lib/permissions";
import type { ActiveCommentItem } from "@/stores/useWorkspaceUIStore";

export interface CommentActionResult {
  success?: boolean;
  error?: string;
  comment?: ActiveCommentItem;
}

export interface SimpleActionResult {
  success?: boolean;
  error?: string;
}

/**
 * Memverifikasi sesi login, keanggotaan workspace, izin komentar RBAC (tolak Viewer),
 * serta isolasi Private Space sebelum mutasi komentar dijalankan.
 */
async function requireCommentWriteAccess(workspaceId: string, pageId: string) {
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

  if (!membership || !canComment(membership.role)) {
    throw new Error(
      "403 Forbidden: Peran Viewer bersifat read-only dan tidak dapat menulis atau mengelola komentar."
    );
  }

  const [page] = await db
    .select({
      id: pages.id,
      spaceType: pages.spaceType,
      createdBy: pages.createdBy,
    })
    .from(pages)
    .where(
      and(
        eq(pages.id, pageId),
        eq(pages.workspaceId, workspaceId),
        eq(pages.isArchived, false)
      )
    )
    .limit(1);

  if (!page) {
    throw new Error("Halaman tidak ditemukan di workspace ini.");
  }

  if (page.spaceType === "private" && page.createdBy !== user.id) {
    throw new Error(
      "403 Forbidden: Halaman Private Space milik pengguna lain tidak dapat diakses."
    );
  }

  return { user, membership, page };
}

/**
 * Mem-parsing @mention nama lengkap atau email anggota workspace di dalam teks komentar.
 */
function findMatchedMemberIds(
  content: string,
  members: Array<{ userId: string; fullName: string; email: string }>,
  explicitMentionIds?: string[]
): string[] {
  const lowered = content.toLowerCase();
  const validMemberSet = new Set(members.map((m) => m.userId));
  const matched = new Set<string>();

  if (explicitMentionIds) {
    for (const id of explicitMentionIds) {
      if (validMemberSet.has(id)) {
        matched.add(id);
      }
    }
  }

  // Cek @NamaLengkap dan @email terlebih dahulu
  for (const member of members) {
    const fullHandle = `@${member.fullName.trim().toLowerCase()}`;
    const emailHandle = `@${member.email.trim().toLowerCase()}`;
    if (
      (member.fullName.trim() && lowered.includes(fullHandle)) ||
      (member.email.trim() && lowered.includes(emailHandle))
    ) {
      matched.add(member.userId);
    }
  }

  // Dukungan mention singkat berdasarkan nama depan jika unik di dalam workspace
  const firstNameCounts = new Map<string, number>();
  for (const member of members) {
    const first = member.fullName.trim().split(/\s+/)[0]?.toLowerCase();
    if (first && first.length >= 2) {
      firstNameCounts.set(first, (firstNameCounts.get(first) ?? 0) + 1);
    }
  }

  for (const member of members) {
    const first = member.fullName.trim().split(/\s+/)[0]?.toLowerCase();
    if (!first || firstNameCounts.get(first) !== 1) continue;
    const escaped = first.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(^|\\s)@${escaped}(?=$|\\s|[.,!?:;])`, "i");
    if (regex.test(content)) {
      matched.add(member.userId);
    }
  }

  return Array.from(matched);
}

/**
 * Server Action: Membuat komentar halaman atau inline terikat block_id beserta balasan utas
 * dan pencatatan @mention ke tabel comment_mentions.
 */
export async function createCommentAction(input: {
  workspaceId: string;
  pageId: string;
  blockId?: string | null;
  parentCommentId?: string | null;
  content: string;
  mentionedUserIds?: string[];
}): Promise<CommentActionResult> {
  try {
    const { user } = await requireCommentWriteAccess(
      input.workspaceId,
      input.pageId
    );

    const trimmed = input.content.trim();
    if (!trimmed) {
      return { error: "Isi komentar tidak boleh kosong." };
    }

    let resolvedBlockId: string | null = input.blockId?.trim() || null;
    let resolvedParentId: string | null = input.parentCommentId?.trim() || null;

    if (resolvedParentId) {
      const [parentRow] = await db
        .select({
          id: comments.id,
          blockId: comments.blockId,
        })
        .from(comments)
        .where(
          and(
            eq(comments.id, resolvedParentId),
            eq(comments.pageId, input.pageId)
          )
        )
        .limit(1);

      if (!parentRow) {
        return { error: "Utas komentar induk tidak ditemukan." };
      }

      if (!resolvedBlockId && parentRow.blockId) {
        resolvedBlockId = parentRow.blockId;
      }
    }

    const memberRows = await db
      .select({
        userId: users.id,
        fullName: users.fullName,
        email: users.email,
      })
      .from(workspaceMembers)
      .innerJoin(users, eq(workspaceMembers.userId, users.id))
      .where(eq(workspaceMembers.workspaceId, input.workspaceId));

    const mentionedIds = findMatchedMemberIds(
      trimmed,
      memberRows,
      input.mentionedUserIds
    );

    const commentId = crypto.randomUUID();
    const now = new Date();

    await db.transaction(async (tx) => {
      await tx.insert(comments).values({
        id: commentId,
        pageId: input.pageId,
        blockId: resolvedBlockId,
        isBlockDeleted: false,
        authorId: user.id,
        parentCommentId: resolvedParentId,
        content: trimmed,
        isResolved: false,
      });

      if (mentionedIds.length > 0) {
        await tx.insert(commentMentions).values(
          mentionedIds.map((mentionedUserId) => ({
            id: crypto.randomUUID(),
            commentId,
            mentionedUserId,
            // Sebutan oleh diri sendiri ditandai terbaca agar tidak memicu lencana notifikasi sendiri
            isRead: mentionedUserId === user.id,
          }))
        );
      }
    });

    revalidatePath(`/workspace/${input.workspaceId}`, "layout");
    revalidatePath(`/workspace/${input.workspaceId}/page/${input.pageId}`);

    return {
      success: true,
      comment: {
        id: commentId,
        pageId: input.pageId,
        blockId: resolvedBlockId,
        isBlockDeleted: false,
        authorId: user.id,
        authorName: user.fullName,
        parentCommentId: resolvedParentId,
        content: trimmed,
        isResolved: false,
        createdAtIso: now.toISOString(),
      },
    };
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : "Gagal menyimpan komentar baru.",
    };
  }
}

/**
 * Server Action: Menandai utas komentar selesai (resolved) atau membuka kembali.
 */
export async function resolveCommentAction(input: {
  workspaceId: string;
  pageId: string;
  commentId: string;
  isResolved: boolean;
}): Promise<SimpleActionResult> {
  try {
    await requireCommentWriteAccess(input.workspaceId, input.pageId);

    const [target] = await db
      .select({ id: comments.id })
      .from(comments)
      .where(
        and(eq(comments.id, input.commentId), eq(comments.pageId, input.pageId))
      )
      .limit(1);

    if (!target) {
      return { error: "Komentar tidak ditemukan pada halaman ini." };
    }

    await db
      .update(comments)
      .set({ isResolved: input.isResolved })
      .where(eq(comments.id, input.commentId));

    revalidatePath(`/workspace/${input.workspaceId}/page/${input.pageId}`);
    return { success: true };
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err.message
          : "Gagal memperbarui status penyelesaian komentar.",
    };
  }
}

/**
 * Server Action: Menandai notifikasi @mention milik pengguna saat ini sebagai sudah dibaca.
 */
export async function markMentionReadAction(input: {
  workspaceId: string;
  mentionId?: string;
  markAll?: boolean;
}): Promise<SimpleActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Anda harus masuk terlebih dahulu." };
    }

    const [membership] = await db
      .select({ id: workspaceMembers.id })
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, input.workspaceId),
          eq(workspaceMembers.userId, user.id)
        )
      )
      .limit(1);

    if (!membership) {
      return { error: "403 Forbidden: Anda bukan anggota workspace ini." };
    }

    if (input.markAll) {
      const userUnreadInWorkspace = await db
        .select({ mentionId: commentMentions.id })
        .from(commentMentions)
        .innerJoin(comments, eq(commentMentions.commentId, comments.id))
        .innerJoin(pages, eq(comments.pageId, pages.id))
        .where(
          and(
            eq(commentMentions.mentionedUserId, user.id),
            eq(commentMentions.isRead, false),
            eq(pages.workspaceId, input.workspaceId)
          )
        );

      for (const row of userUnreadInWorkspace) {
        await db
          .update(commentMentions)
          .set({ isRead: true })
          .where(eq(commentMentions.id, row.mentionId));
      }
    } else if (input.mentionId) {
      const [mentionRow] = await db
        .select({ mentionId: commentMentions.id })
        .from(commentMentions)
        .innerJoin(comments, eq(commentMentions.commentId, comments.id))
        .innerJoin(pages, eq(comments.pageId, pages.id))
        .where(
          and(
            eq(commentMentions.id, input.mentionId),
            eq(commentMentions.mentionedUserId, user.id),
            eq(pages.workspaceId, input.workspaceId)
          )
        )
        .limit(1);

      if (!mentionRow) {
        return { error: "Notifikasi mention tidak ditemukan." };
      }

      await db
        .update(commentMentions)
        .set({ isRead: true })
        .where(eq(commentMentions.id, mentionRow.mentionId));
    }

    revalidatePath(`/workspace/${input.workspaceId}`, "layout");
    return { success: true };
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err.message
          : "Gagal menandai notifikasi mention telah dibaca.",
    };
  }
}
