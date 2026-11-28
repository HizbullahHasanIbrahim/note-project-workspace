"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { pageVersions, pages, workspaceMembers } from "@/db/schema";
import { getCollabInternalSecret, getCurrentUser } from "@/lib/auth";
import { canEditTeamspace } from "@/lib/permissions";
import type { ActiveVersionItem } from "@/stores/useWorkspaceUIStore";

export interface VersionActionResult {
  success?: boolean;
  error?: string;
  version?: ActiveVersionItem;
  restoredTitle?: string;
  restoredCrdtBase64?: string | null;
  reloadedInCollab?: boolean;
}

async function requireEditablePageAccess(workspaceId: string, pageId: string) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Anda harus masuk terlebih dahulu.");
  }

  const [membership] = await db
    .select({ role: workspaceMembers.role })
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, user.id)
      )
    )
    .limit(1);

  if (!membership || !canEditTeamspace(membership.role)) {
    throw new Error(
      "403 Forbidden: Peran Viewer tidak dapat menyimpan atau memulihkan riwayat versi."
    );
  }

  const [page] = await db
    .select({
      id: pages.id,
      title: pages.title,
      spaceType: pages.spaceType,
      createdBy: pages.createdBy,
      crdtState: pages.crdtState,
      isArchived: pages.isArchived,
    })
    .from(pages)
    .where(and(eq(pages.id, pageId), eq(pages.workspaceId, workspaceId)))
    .limit(1);

  if (!page || page.isArchived) {
    throw new Error("Halaman tidak ditemukan di workspace ini.");
  }

  if (page.spaceType === "private" && page.createdBy !== user.id) {
    throw new Error(
      "403 Forbidden: Anda tidak dapat mengakses riwayat versi Private Space pengguna lain."
    );
  }

  return { user, page };
}

/**
 * Server Action: Menyimpan snapshot riwayat versi halaman secara manual ke `page_versions`.
 */
export async function createPageVersionAction(input: {
  workspaceId: string;
  pageId: string;
  titleOverride?: string;
  crdtBase64?: string;
}): Promise<VersionActionResult> {
  try {
    const { user, page } = await requireEditablePageAccess(
      input.workspaceId,
      input.pageId
    );

    const snapshotBuffer = input.crdtBase64
      ? Buffer.from(input.crdtBase64, "base64")
      : page.crdtState
      ? Buffer.from(page.crdtState)
      : Buffer.alloc(0);

    const snapshotTitle =
      (input.titleOverride || "").trim() || page.title;
    const versionId = crypto.randomUUID();
    const now = new Date();

    await db.insert(pageVersions).values({
      id: versionId,
      pageId: page.id,
      createdBy: user.id,
      titleSnapshot: snapshotTitle,
      crdtSnapshot: snapshotBuffer,
    });

    revalidatePath(`/workspace/${input.workspaceId}/page/${input.pageId}`);

    return {
      success: true,
      version: {
        id: versionId,
        pageId: page.id,
        titleSnapshot: snapshotTitle,
        createdBy: user.id,
        authorName: user.fullName,
        createdAtIso: now.toISOString(),
        snapshotBytes: snapshotBuffer.length,
      },
    };
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err.message
          : "Gagal menyimpan snapshot versi halaman.",
    };
  }
}

/**
 * Server Action: Memulihkan judul dan state CRDT halaman dari titik versi terpilih di `page_versions`.
 */
export async function restorePageVersionAction(input: {
  workspaceId: string;
  pageId: string;
  versionId: string;
}): Promise<VersionActionResult> {
  try {
    await requireEditablePageAccess(input.workspaceId, input.pageId);

    const [targetVersion] = await db
      .select()
      .from(pageVersions)
      .where(
        and(
          eq(pageVersions.id, input.versionId),
          eq(pageVersions.pageId, input.pageId)
        )
      )
      .limit(1);

    if (!targetVersion) {
      return { error: "Snapshot versi yang dipilih tidak ditemukan." };
    }

    const restoredBuffer = targetVersion.crdtSnapshot
      ? Buffer.from(targetVersion.crdtSnapshot)
      : null;

    await db
      .update(pages)
      .set({
        title: targetVersion.titleSnapshot,
        crdtState: restoredBuffer,
      })
      .where(
        and(
          eq(pages.id, input.pageId),
          eq(pages.workspaceId, input.workspaceId)
        )
      );

    // Beritahu server Hocuspocus agar Y.Doc di memori ikut memuat ulang dan memproyeksikan page_blocks
    let reloadedInCollab = false;
    const collabPort = Number(process.env.COLLAB_PORT || 1234);
    const collabHttpBase =
      process.env.COLLAB_INTERNAL_URL || `http://127.0.0.1:${collabPort}`;

    try {
      const reloadRes = await fetch(
        `${collabHttpBase}/internal/reload-page/${encodeURIComponent(
          input.pageId
        )}`,
        {
          method: "POST",
          headers: {
            "x-internal-secret": getCollabInternalSecret(),
          },
          signal: AbortSignal.timeout(3000),
        }
      );
      if (reloadRes.ok) {
        const reloadJson = (await reloadRes.json().catch(() => ({}))) as {
          reloadedActive?: boolean;
        };
        reloadedInCollab = Boolean(reloadJson.reloadedActive);
      }
    } catch {
      // Abaikan jika server kolaborasi sedang tidak berjalan terpisah
    }

    revalidatePath(`/workspace/${input.workspaceId}`, "layout");
    revalidatePath(`/workspace/${input.workspaceId}/page/${input.pageId}`);

    return {
      success: true,
      restoredTitle: targetVersion.titleSnapshot,
      restoredCrdtBase64: restoredBuffer
        ? restoredBuffer.toString("base64")
        : null,
      reloadedInCollab,
    };
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err.message
          : "Gagal memulihkan versi halaman.",
    };
  }
}
