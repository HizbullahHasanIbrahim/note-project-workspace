import fs from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { attachments, pages, workspaceMembers, workspaces } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { resolveAttachmentDiskPath } from "@/lib/attachments";
import { canUploadAttachments } from "@/lib/permissions";

/**
 * Mengunduh atau menayangkan lampiran terproteksi dengan verifikasi keanggotaan,
 * isolasi Private Space, serta header X-Content-Type-Options: nosniff.
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ attachmentId: string }> }
) {
  try {
    const { attachmentId } = await context.params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: "Sesi tidak valid. Silakan masuk terlebih dahulu." },
        { status: 401 }
      );
    }

    const [record] = await db
      .select({
        id: attachments.id,
        workspaceId: attachments.workspaceId,
        fileName: attachments.fileName,
        mimeType: attachments.mimeType,
        storageKey: attachments.storageKey,
        fileSizeBytes: attachments.fileSizeBytes,
        pageSpaceType: pages.spaceType,
        pageCreatedBy: pages.createdBy,
        pageArchived: pages.isArchived,
      })
      .from(attachments)
      .innerJoin(pages, eq(attachments.pageId, pages.id))
      .where(eq(attachments.id, attachmentId))
      .limit(1);

    if (!record || record.pageArchived) {
      return NextResponse.json(
        { error: "Berkas lampiran tidak ditemukan." },
        { status: 404 }
      );
    }

    // Verifikasi keanggotaan workspace (Anti-IDOR)
    const [membership] = await db
      .select({ role: workspaceMembers.role })
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, record.workspaceId),
          eq(workspaceMembers.userId, currentUser.id)
        )
      )
      .limit(1);

    if (!membership) {
      return NextResponse.json(
        { error: "403 Forbidden: Anda bukan anggota workspace pemilik berkas ini." },
        { status: 403 }
      );
    }

    // Isolasi Private Space
    if (
      record.pageSpaceType === "private" &&
      record.pageCreatedBy !== currentUser.id
    ) {
      return NextResponse.json(
        {
          error:
            "403 Forbidden: Lampiran berada pada halaman Private Space milik pengguna lain.",
        },
        { status: 403 }
      );
    }

    const diskPath = resolveAttachmentDiskPath(record.storageKey);
    let fileBuffer: Buffer;
    try {
      fileBuffer = await fs.readFile(diskPath);
    } catch {
      return NextResponse.json(
        { error: "Berkas fisik tidak ditemukan di server." },
        { status: 404 }
      );
    }

    const isInlineRenderable =
      record.mimeType.startsWith("image/") ||
      record.mimeType === "application/pdf";
    const dispositionType = isInlineRenderable ? "inline" : "attachment";
    const encodedName = encodeURIComponent(record.fileName);

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        "Content-Type": record.mimeType,
        "Content-Length": String(fileBuffer.length),
        "Content-Disposition": `${dispositionType}; filename="${encodedName}"; filename*=UTF-8''${encodedName}`,
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "sandbox; default-src 'none'",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    console.error("Serve attachment error:", err);
    return NextResponse.json(
      { error: "Gagal mengambil berkas lampiran." },
      { status: 500 }
    );
  }
}

/**
 * Menghapus lampiran dan mengembalikan kuota penyimpanan workspace secara atomik (FOR UPDATE).
 */
export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ attachmentId: string }> }
) {
  try {
    const { attachmentId } = await context.params;
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Sesi tidak valid." },
        { status: 401 }
      );
    }

    const [record] = await db
      .select({
        id: attachments.id,
        workspaceId: attachments.workspaceId,
        storageKey: attachments.storageKey,
        fileSizeBytes: attachments.fileSizeBytes,
        pageSpaceType: pages.spaceType,
        pageCreatedBy: pages.createdBy,
      })
      .from(attachments)
      .innerJoin(pages, eq(attachments.pageId, pages.id))
      .where(eq(attachments.id, attachmentId))
      .limit(1);

    if (!record) {
      return NextResponse.json(
        { error: "Lampiran tidak ditemukan." },
        { status: 404 }
      );
    }

    const [membership] = await db
      .select({ role: workspaceMembers.role })
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, record.workspaceId),
          eq(workspaceMembers.userId, currentUser.id)
        )
      )
      .limit(1);

    if (!membership || !canUploadAttachments(membership.role)) {
      return NextResponse.json(
        { error: "403 Forbidden: Tidak memiliki izin menghapus lampiran." },
        { status: 403 }
      );
    }

    if (
      record.pageSpaceType === "private" &&
      record.pageCreatedBy !== currentUser.id
    ) {
      return NextResponse.json(
        { error: "403 Forbidden: Akses Private Space ditolak." },
        { status: 403 }
      );
    }

    await db.transaction(async (tx) => {
      const [lockRows] = (await tx.execute(
        sql`SELECT id, storage_used_bytes FROM workspaces WHERE id = ${record.workspaceId} FOR UPDATE`
      )) as unknown as [
        Array<{ id: string; storage_used_bytes: number | string }>
      ];

      const currentUsed = Number(lockRows[0]?.storage_used_bytes || 0);
      const nextUsed = Math.max(0, currentUsed - Number(record.fileSizeBytes));

      await tx.delete(attachments).where(eq(attachments.id, record.id));
      await tx
        .update(workspaces)
        .set({ storageUsedBytes: nextUsed })
        .where(eq(workspaces.id, record.workspaceId));
    });

    const diskPath = resolveAttachmentDiskPath(record.storageKey);
    await fs.unlink(diskPath).catch(() => undefined);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete attachment error:", err);
    return NextResponse.json(
      { error: "Gagal menghapus lampiran." },
      { status: 500 }
    );
  }
}
