import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  attachments,
  pages,
  users,
  workspaceMembers,
  workspaces,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import {
  buildStorageKey,
  resolveAttachmentDiskPath,
  validateAttachmentUpload,
} from "@/lib/attachments";
import { canUploadAttachments } from "@/lib/permissions";

class QuotaExceededError extends Error {
  constructor() {
    super("Kuota penyimpanan workspace 1 GB tidak mencukupi.");
    this.name = "QuotaExceededError";
  }
}

/**
 * Mengambil daftar lampiran pada suatu halaman setelah verifikasi keanggotaan & Private Space.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await context.params;
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Sesi tidak valid. Silakan masuk terlebih dahulu." },
        { status: 401 }
      );
    }

    const [membership] = await db
      .select({ role: workspaceMembers.role })
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.userId, currentUser.id)
        )
      )
      .limit(1);

    if (!membership) {
      return NextResponse.json(
        { error: "403 Forbidden: Anda bukan anggota workspace ini." },
        { status: 403 }
      );
    }

    const pageId = request.nextUrl.searchParams.get("pageId")?.trim();
    if (!pageId) {
      return NextResponse.json(
        { error: "Parameter pageId wajib disertakan." },
        { status: 400 }
      );
    }

    const [page] = await db
      .select({
        id: pages.id,
        spaceType: pages.spaceType,
        createdBy: pages.createdBy,
        isArchived: pages.isArchived,
      })
      .from(pages)
      .where(and(eq(pages.id, pageId), eq(pages.workspaceId, workspaceId)))
      .limit(1);

    if (!page || page.isArchived) {
      return NextResponse.json(
        { error: "Halaman tidak ditemukan." },
        { status: 404 }
      );
    }

    if (page.spaceType === "private" && page.createdBy !== currentUser.id) {
      return NextResponse.json(
        { error: "403 Forbidden: Akses halaman Private Space ditolak." },
        { status: 403 }
      );
    }

    const rows = await db
      .select({
        id: attachments.id,
        fileName: attachments.fileName,
        mimeType: attachments.mimeType,
        fileSizeBytes: attachments.fileSizeBytes,
        createdAt: attachments.createdAt,
        uploaderName: users.fullName,
      })
      .from(attachments)
      .innerJoin(users, eq(attachments.uploadedBy, users.id))
      .where(
        and(
          eq(attachments.workspaceId, workspaceId),
          eq(attachments.pageId, pageId)
        )
      )
      .orderBy(desc(attachments.createdAt));

    return NextResponse.json({
      attachments: rows.map((r) => ({
        id: r.id,
        fileName: r.fileName,
        mimeType: r.mimeType,
        fileSizeBytes: r.fileSizeBytes,
        uploaderName: r.uploaderName,
        createdAtIso: r.createdAt.toISOString(),
        url: `/api/attachments/${r.id}`,
      })),
    });
  } catch (err) {
    console.error("List attachments error:", err);
    return NextResponse.json(
      { error: "Gagal mengambil daftar lampiran." },
      { status: 500 }
    );
  }
}

/**
 * Mengunggah lampiran file/gambar aman (maks 10 MB, validasi magic bytes, dan kuota atomik 1 GB FOR UPDATE).
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ workspaceId: string }> }
) {
  let writtenDiskPath: string | null = null;

  try {
    const { workspaceId } = await context.params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: "Anda harus masuk terlebih dahulu." },
        { status: 401 }
      );
    }

    // 1. Verifikasi keanggotaan workspace dan peran RBAC (Viewer ditolak)
    const [membership] = await db
      .select({ role: workspaceMembers.role })
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.userId, currentUser.id)
        )
      )
      .limit(1);

    if (!membership || !canUploadAttachments(membership.role)) {
      return NextResponse.json(
        {
          error:
            "403 Forbidden: Peran Viewer tidak memiliki izin mengunggah berkas.",
        },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const uploadedFile = formData.get("file");
    const pageIdRaw = formData.get("pageId");
    const pageId = typeof pageIdRaw === "string" ? pageIdRaw.trim() : "";

    if (!pageId) {
      return NextResponse.json(
        { error: "ID halaman tujuan (pageId) wajib disertakan." },
        { status: 400 }
      );
    }

    if (!(uploadedFile instanceof File)) {
      return NextResponse.json(
        { error: "Berkas unggahan tidak ditemukan pada form data." },
        { status: 400 }
      );
    }

    // 2. Verifikasi halaman tujuan & isolasi Private Space
    const [page] = await db
      .select({
        id: pages.id,
        spaceType: pages.spaceType,
        createdBy: pages.createdBy,
        isArchived: pages.isArchived,
      })
      .from(pages)
      .where(and(eq(pages.id, pageId), eq(pages.workspaceId, workspaceId)))
      .limit(1);

    if (!page || page.isArchived) {
      return NextResponse.json(
        { error: "Halaman tujuan tidak ditemukan di workspace ini." },
        { status: 404 }
      );
    }

    if (page.spaceType === "private" && page.createdBy !== currentUser.id) {
      return NextResponse.json(
        {
          error:
            "403 Forbidden: Anda tidak dapat mengunggah berkas ke Private Space pengguna lain.",
        },
        { status: 403 }
      );
    }

    // 3. Validasi ukuran (<= 10 MB), larangan .svg/.html, serta magic bytes pada buffer
    const arrayBuffer = await uploadedFile.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    const validation = validateAttachmentUpload(
      fileBuffer,
      uploadedFile.name,
      uploadedFile.type
    );

    if (
      !validation.valid ||
      !validation.detectedMime ||
      !validation.sanitizedFileName ||
      !validation.storageExtension
    ) {
      return NextResponse.json(
        { error: validation.error || "Berkas tidak valid." },
        { status: validation.statusCode || 400 }
      );
    }

    const attachmentId = crypto.randomUUID();
    const storageKey = buildStorageKey(
      workspaceId,
      attachmentId,
      validation.storageExtension
    );
    const diskPath = resolveAttachmentDiskPath(storageKey);

    // 4. Transaksi atomik MySQL dengan row-level lock FOR UPDATE pada kuota workspace
    const insertedRecord = await db.transaction(async (tx) => {
      const [lockRows] = (await tx.execute(
        sql`SELECT id, storage_used_bytes, storage_limit_bytes FROM workspaces WHERE id = ${workspaceId} FOR UPDATE`
      )) as unknown as [
        Array<{
          id: string;
          storage_used_bytes: number | string;
          storage_limit_bytes: number | string;
        }>
      ];

      const lockedWorkspace = lockRows[0];
      if (!lockedWorkspace) {
        throw new Error("Workspace tidak ditemukan.");
      }

      const currentUsed = Number(lockedWorkspace.storage_used_bytes || 0);
      const storageLimit = Number(
        lockedWorkspace.storage_limit_bytes || 1073741824
      );
      const nextUsed = currentUsed + fileBuffer.length;

      if (nextUsed > storageLimit) {
        throw new QuotaExceededError();
      }

      await fs.mkdir(path.dirname(diskPath), { recursive: true });
      await fs.writeFile(diskPath, fileBuffer);
      writtenDiskPath = diskPath;

      await tx.insert(attachments).values({
        id: attachmentId,
        workspaceId,
        pageId,
        uploadedBy: currentUser.id,
        fileName: validation.sanitizedFileName!,
        mimeType: validation.detectedMime!,
        storageKey,
        fileSizeBytes: fileBuffer.length,
      });

      await tx
        .update(workspaces)
        .set({ storageUsedBytes: nextUsed })
        .where(eq(workspaces.id, workspaceId));

      return {
        id: attachmentId,
        fileName: validation.sanitizedFileName!,
        mimeType: validation.detectedMime!,
        fileSizeBytes: fileBuffer.length,
        uploaderName: currentUser.fullName,
        createdAtIso: new Date().toISOString(),
        url: `/api/attachments/${attachmentId}`,
        storageUsedBytes: nextUsed,
        storageLimitBytes: storageLimit,
      };
    });

    return NextResponse.json(
      { attachment: insertedRecord },
      { status: 201 }
    );
  } catch (err) {
    if (writtenDiskPath) {
      await fs.unlink(writtenDiskPath).catch(() => undefined);
    }

    if (err instanceof QuotaExceededError) {
      return NextResponse.json({ error: err.message }, { status: 413 });
    }

    console.error("Attachment upload error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengunggah lampiran." },
      { status: 500 }
    );
  }
}
