"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { pages, tasks, workspaceMembers } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { canEditTeamspace } from "@/lib/permissions";
import {
  DEFAULT_POSITION_STEP,
  generatePosition,
  needsReindex,
  reindexPositions,
} from "@/lib/fractional-index";

import { MAX_PAGE_NESTING_DEPTH } from "@/lib/collab-constants";

export interface PageActionResponse {
  success?: boolean;
  error?: string;
  pageId?: string;
  databasePageId?: string;
}

/**
 * Verifikasi autentikasi dan hak akses tulis di workspace
 */
async function requireEditableMembership(workspaceId: string) {
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

  if (!membership || !canEditTeamspace(membership.role)) {
    throw new Error("Akses ditolak: Peran Anda bersifat read-only atau bukan anggota.");
  }

  return { user, membership };
}

/**
 * Mengambil peta hierarki ringan (hanya `id` dan `parentPageId`) tanpa memuat `crdt_state` LONGBLOB,
 * lalu menghitung kedalaman halaman dari akar (root = 1) serta memvalidasi anti-circular reference.
 */
async function computeNodeDepthAndCheckCycle(
  workspaceId: string,
  nodeId: string,
  forbiddenAncestorId?: string
): Promise<{ depth: number; hasCycleWithForbidden: boolean }> {
  const rows = await db
    .select({
      id: pages.id,
      parentPageId: pages.parentPageId,
    })
    .from(pages)
    .where(
      and(eq(pages.workspaceId, workspaceId), eq(pages.isArchived, false))
    );

  const pageMap = new Map(rows.map((r) => [r.id, r]));

  let depth = 0;
  let currentId: string | null = nodeId;
  const visited = new Set<string>();
  let hasCycleWithForbidden = false;

  while (currentId) {
    if (forbiddenAncestorId && currentId === forbiddenAncestorId) {
      hasCycleWithForbidden = true;
    }
    if (visited.has(currentId)) {
      break;
    }
    visited.add(currentId);
    const node = pageMap.get(currentId);
    if (!node) break;
    depth += 1;
    currentId = node.parentPageId;
  }

  return { depth, hasCycleWithForbidden };
}

/**
 * Menghitung tinggi maksimum subtree dari sebuah node halaman (daun = 1)
 */
function computeSubtreeHeight(
  rootId: string,
  childrenMap: Map<string, string[]>
): number {
  const visited = new Set<string>();

  const dfs = (id: string): number => {
    if (visited.has(id)) return 0;
    visited.add(id);
    const children = childrenMap.get(id) ?? [];
    if (children.length === 0) return 1;
    let maxChildHeight = 0;
    for (const childId of children) {
      maxChildHeight = Math.max(maxChildHeight, dfs(childId));
    }
    return 1 + maxChildHeight;
  };

  return dfs(rootId);
}

/**
 * Server Action: Membuat halaman baru atau sub-halaman bersarang (maks. 5 tingkat)
 */
export async function createPageAction(input: {
  workspaceId: string;
  parentPageId?: string | null;
  spaceType: "teamspace" | "private";
  pageType?: "document" | "database";
  title?: string;
  icon?: string;
}): Promise<PageActionResponse> {
  try {
    const { user } = await requireEditableMembership(input.workspaceId);
    const parentPageId = input.parentPageId ?? null;
    let effectiveSpaceType = input.spaceType;

    // Ambil seluruh halaman aktif untuk validasi kedalaman hierarki
    const allPages = await db
      .select({
        id: pages.id,
        parentPageId: pages.parentPageId,
        spaceType: pages.spaceType,
        createdBy: pages.createdBy,
        positionOrder: pages.positionOrder,
      })
      .from(pages)
      .where(
        and(eq(pages.workspaceId, input.workspaceId), eq(pages.isArchived, false))
      )
      .orderBy(asc(pages.positionOrder));

    const pageMap = new Map(allPages.map((p) => [p.id, p]));

    if (parentPageId) {
      const parent = pageMap.get(parentPageId);
      if (!parent) {
        return { error: "Halaman induk tidak ditemukan." };
      }
      if (parent.spaceType === "private" && parent.createdBy !== user.id) {
        return { error: "Anda tidak berhak membuat sub-halaman di ruang privat orang lain." };
      }
      effectiveSpaceType = parent.spaceType;

      const { depth } = await computeNodeDepthAndCheckCycle(
        input.workspaceId,
        parentPageId
      );
      if (depth >= MAX_PAGE_NESTING_DEPTH) {
        return {
          error: `Kedalaman hierarki halaman dibatasi maksimal ${MAX_PAGE_NESTING_DEPTH} tingkat.`,
        };
      }
    }

    const siblings = allPages.filter(
      (p) =>
        p.spaceType === effectiveSpaceType &&
        p.parentPageId === parentPageId &&
        (effectiveSpaceType === "teamspace" || p.createdBy === user.id)
    );

    const lastSiblingPos =
      siblings.length > 0 ? siblings[siblings.length - 1].positionOrder : null;

    const newPageId = crypto.randomUUID();
    const defaultTitle =
      input.title?.trim() ||
      (input.pageType === "database" ? "Task Database Baru" : "Halaman Tanpa Judul");

    await db.insert(pages).values({
      id: newPageId,
      workspaceId: input.workspaceId,
      parentPageId,
      createdBy: user.id,
      spaceType: effectiveSpaceType,
      pageType: input.pageType ?? "document",
      title: defaultTitle,
      icon: input.icon ?? (input.pageType === "database" ? "📊" : "📄"),
      positionOrder: generatePosition(lastSiblingPos, null),
      isArchived: false,
    });

    revalidatePath(`/workspace/${input.workspaceId}`);
    return { success: true, pageId: newPageId };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Gagal membuat halaman baru.",
    };
  }
}

/**
 * Server Action: Memperbarui judul atau ikon halaman
 */
export async function updatePageMetaAction(input: {
  workspaceId: string;
  pageId: string;
  title?: string;
  icon?: string;
}): Promise<PageActionResponse> {
  try {
    const { user } = await requireEditableMembership(input.workspaceId);

    const [existing] = await db
      .select({
        id: pages.id,
        spaceType: pages.spaceType,
        createdBy: pages.createdBy,
        isArchived: pages.isArchived,
      })
      .from(pages)
      .where(
        and(eq(pages.id, input.pageId), eq(pages.workspaceId, input.workspaceId))
      )
      .limit(1);

    if (!existing || existing.isArchived) {
      return { error: "Halaman tidak ditemukan." };
    }

    if (existing.spaceType === "private" && existing.createdBy !== user.id) {
      return { error: "Akses ditolak untuk halaman privat." };
    }

    const updates: Partial<{ title: string; icon: string | null }> = {};
    if (typeof input.title === "string") {
      updates.title = input.title.trim() || "Halaman Tanpa Judul";
    }
    if (typeof input.icon === "string") {
      updates.icon = input.icon;
    }

    await db
      .update(pages)
      .set(updates)
      .where(eq(pages.id, input.pageId));

    revalidatePath(`/workspace/${input.workspaceId}`);
    revalidatePath(`/workspace/${input.workspaceId}/page/${input.pageId}`);
    return { success: true };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Gagal memperbarui halaman.",
    };
  }
}

/**
 * Server Action: Memindahkan urutan atau parent halaman bersarang (Nested Pages)
 * Menegakkan anti-circular reference, batas maks 5 tingkat, dan fractional indexing (PRD §8.1).
 */
export async function movePageAction(input: {
  workspaceId: string;
  pageId: string;
  newParentId: string | null;
  prevSiblingId?: string | null;
  nextSiblingId?: string | null;
}): Promise<PageActionResponse> {
  try {
    const { user } = await requireEditableMembership(input.workspaceId);

    if (input.newParentId === input.pageId) {
      return {
        error: "Tidak dapat memindahkan halaman ke dalam dirinya sendiri.",
      };
    }

    const allPages = await db
      .select({
        id: pages.id,
        parentPageId: pages.parentPageId,
        spaceType: pages.spaceType,
        createdBy: pages.createdBy,
        positionOrder: pages.positionOrder,
      })
      .from(pages)
      .where(
        and(eq(pages.workspaceId, input.workspaceId), eq(pages.isArchived, false))
      )
      .orderBy(asc(pages.positionOrder));

    const pageMap = new Map(allPages.map((p) => [p.id, p]));
    const targetPage = pageMap.get(input.pageId);

    if (!targetPage) {
      return { error: "Halaman yang akan dipindahkan tidak ditemukan." };
    }

    if (targetPage.spaceType === "private" && targetPage.createdBy !== user.id) {
      return { error: "Anda tidak berhak memindahkan halaman privat pengguna lain." };
    }

    // Validasi anti-circular reference & batas kedalaman 5 tingkat
    let newParentDepth = 0;
    if (input.newParentId) {
      const parent = pageMap.get(input.newParentId);
      if (!parent) {
        return { error: "Halaman induk tujuan tidak ditemukan." };
      }
      if (parent.spaceType !== targetPage.spaceType) {
        return {
          error: "Gunakan aksi pindah ruang untuk memindahkan antar Teamspace dan Private Space.",
        };
      }
      if (parent.spaceType === "private" && parent.createdBy !== user.id) {
        return { error: "Akses ditolak ke ruang privat tujuan." };
      }

      const { depth, hasCycleWithForbidden } =
        await computeNodeDepthAndCheckCycle(
          input.workspaceId,
          input.newParentId,
          input.pageId
        );

      if (hasCycleWithForbidden) {
        return {
          error:
            "Tidak dapat memindahkan halaman ke dalam sub-halamannya sendiri (circular reference).",
        };
      }
      newParentDepth = depth;
    }

    const childrenMap = new Map<string, string[]>();
    for (const p of allPages) {
      if (!p.parentPageId) continue;
      const arr = childrenMap.get(p.parentPageId) ?? [];
      arr.push(p.id);
      childrenMap.set(p.parentPageId, arr);
    }

    const subtreeHeight = computeSubtreeHeight(input.pageId, childrenMap);
    if (newParentDepth + subtreeHeight > MAX_PAGE_NESTING_DEPTH) {
      return {
        error: `Pemindahan ditolak karena melebihi batas kedalaman maksimal ${MAX_PAGE_NESTING_DEPTH} tingkat.`,
      };
    }

    // Kalkulasi fractional index berdasarkan posisi tetangga baru
    const prevSibling = input.prevSiblingId ? pageMap.get(input.prevSiblingId) : null;
    const nextSibling = input.nextSiblingId ? pageMap.get(input.nextSiblingId) : null;

    const prevPos = prevSibling ? prevSibling.positionOrder : null;
    const nextPos = nextSibling ? nextSibling.positionOrder : null;
    const newPosition = generatePosition(prevPos, nextPos);

    await db.transaction(async (tx) => {
      await tx
        .update(pages)
        .set({
          parentPageId: input.newParentId,
          positionOrder: newPosition,
        })
        .where(eq(pages.id, input.pageId));

      // Jalankan re-indexing latar belakang apabila selisih antar posisi terlalu rapat (< 0.0001)
      if (prevPos !== null && nextPos !== null && needsReindex(prevPos, nextPos)) {
        const siblingCondition = input.newParentId
          ? eq(pages.parentPageId, input.newParentId)
          : isNull(pages.parentPageId);

        const siblings = await tx
          .select({ id: pages.id })
          .from(pages)
          .where(
            and(
              eq(pages.workspaceId, input.workspaceId),
              eq(pages.spaceType, targetPage.spaceType),
              eq(pages.isArchived, false),
              siblingCondition
            )
          )
          .orderBy(asc(pages.positionOrder));

        const cleanPositions = reindexPositions(siblings.length, DEFAULT_POSITION_STEP);
        for (let i = 0; i < siblings.length; i++) {
          await tx
            .update(pages)
            .set({ positionOrder: cleanPositions[i] })
            .where(eq(pages.id, siblings[i].id));
        }
      }
    });

    revalidatePath(`/workspace/${input.workspaceId}`);
    return { success: true };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Gagal memindahkan halaman.",
    };
  }
}

/**
 * Server Action: Memindahkan halaman antara Private Space dan Shared Teamspace (PRD §5.2)
 * Jika dipindahkan kembali ke Private Space, backlink di halaman tim otomatis tersamarkan sebagai [Halaman Privat].
 */
export async function switchPageSpaceAction(input: {
  workspaceId: string;
  pageId: string;
  targetSpaceType: "teamspace" | "private";
}): Promise<PageActionResponse> {
  try {
    const { user, membership } = await requireEditableMembership(input.workspaceId);

    const [page] = await db
      .select({
        id: pages.id,
        spaceType: pages.spaceType,
        createdBy: pages.createdBy,
        isArchived: pages.isArchived,
      })
      .from(pages)
      .where(
        and(eq(pages.id, input.pageId), eq(pages.workspaceId, input.workspaceId))
      )
      .limit(1);

    if (!page || page.isArchived) {
      return { error: "Halaman tidak ditemukan." };
    }

    if (page.spaceType === input.targetSpaceType) {
      return { success: true };
    }

    // Hanya pembuat halaman (atau admin ketika mempublikasikan ke teamspace) yang diizinkan memindahkan ruang
    if (input.targetSpaceType === "private" && page.createdBy !== user.id) {
      return {
        error:
          "Hanya pembuat asli halaman yang dapat memindahkannya ke Private Space pribadinya.",
      };
    }

    if (page.spaceType === "private" && page.createdBy !== user.id) {
      return { error: "Akses ditolak ke halaman Private Space pengguna lain." };
    }

    if (
      input.targetSpaceType === "teamspace" &&
      page.createdBy !== user.id &&
      membership.role !== "admin"
    ) {
      return { error: "Anda tidak memiliki izin mempublikasikan halaman ini." };
    }

    // Hitung posisi paling bawah di ruang tujuan
    const targetRootPages = await db
      .select({ positionOrder: pages.positionOrder })
      .from(pages)
      .where(
        and(
          eq(pages.workspaceId, input.workspaceId),
          eq(pages.spaceType, input.targetSpaceType),
          eq(pages.isArchived, false),
          isNull(pages.parentPageId),
          ...(input.targetSpaceType === "private"
            ? [eq(pages.createdBy, user.id)]
            : [])
        )
      )
      .orderBy(asc(pages.positionOrder));

    const lastPos =
      targetRootPages.length > 0
        ? targetRootPages[targetRootPages.length - 1].positionOrder
        : null;

    await db.transaction(async (tx) => {
      // Lepaskan parent agar tidak ada halaman teamspace berinduk di private space atau sebaliknya
      await tx
        .update(pages)
        .set({
          spaceType: input.targetSpaceType,
          parentPageId: null,
          positionOrder: generatePosition(lastPos, null),
        })
        .where(eq(pages.id, input.pageId));

      // Lepaskan sub-halaman ke root ruang lama agar sub-halaman milik anggota lain tidak ikut hilang
      await tx
        .update(pages)
        .set({ parentPageId: null })
        .where(
          and(
            eq(pages.workspaceId, input.workspaceId),
            eq(pages.parentPageId, input.pageId)
          )
        );
    });

    revalidatePath(`/workspace/${input.workspaceId}`);
    revalidatePath(`/workspace/${input.workspaceId}/page/${input.pageId}`);
    return { success: true };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Gagal memindahkan ruang halaman.",
    };
  }
}

/**
 * Server Action: Membuat sub-database Sprint Tracker + tugas awal saat memilih template Sprint Tracker
 */
export async function createSprintSubDatabaseAction(input: {
  workspaceId: string;
  parentPageId: string;
}): Promise<PageActionResponse> {
  try {
    const { user } = await requireEditableMembership(input.workspaceId);

    const allPages = await db
      .select({
        id: pages.id,
        parentPageId: pages.parentPageId,
        spaceType: pages.spaceType,
        createdBy: pages.createdBy,
        positionOrder: pages.positionOrder,
      })
      .from(pages)
      .where(
        and(eq(pages.workspaceId, input.workspaceId), eq(pages.isArchived, false))
      );

    const pageMap = new Map(allPages.map((p) => [p.id, p]));
    const parent = pageMap.get(input.parentPageId);

    if (!parent) {
      return { error: "Halaman induk tidak ditemukan." };
    }
    if (parent.spaceType === "private" && parent.createdBy !== user.id) {
      return { error: "Akses ditolak untuk halaman privat." };
    }

    const { depth } = await computeNodeDepthAndCheckCycle(
      input.workspaceId,
      input.parentPageId
    );
    // Jika halaman sudah berada di kedalaman maksimal 5, letakkan sub-database sejajar sebagai sibling
    const targetParentId =
      depth >= MAX_PAGE_NESTING_DEPTH ? parent.parentPageId : input.parentPageId;

    const databasePageId = crypto.randomUUID();
    const starterTasks: Array<{
      title: string;
      status: "todo" | "in_progress" | "review";
      priority: "high" | "medium";
      order: number;
    }> = [
      {
        title: "Finalisasi spesifikasi & arsitektur",
        status: "in_progress",
        priority: "high",
        order: 1000.0,
      },
      {
        title: "Implementasi modul inti & integrasi API",
        status: "todo",
        priority: "high",
        order: 2000.0,
      },
      {
        title: "QA & review antar-anggota tim",
        status: "todo",
        priority: "medium",
        order: 3000.0,
      },
    ];

    await db.transaction(async (tx) => {
      await tx.insert(pages).values({
        id: databasePageId,
        workspaceId: input.workspaceId,
        parentPageId: targetParentId,
        createdBy: user.id,
        spaceType: parent.spaceType,
        pageType: "database",
        title: "Sprint Tracker Board",
        icon: "📊",
        positionOrder: 1000.0,
        isArchived: false,
      });

      for (const item of starterTasks) {
        const detailPageId = crypto.randomUUID();
        await tx.insert(pages).values({
          id: detailPageId,
          workspaceId: input.workspaceId,
          parentPageId: databasePageId,
          createdBy: user.id,
          spaceType: parent.spaceType,
          pageType: "task_item",
          title: item.title,
          icon: "✅",
          positionOrder: item.order,
          isArchived: false,
        });

        await tx.insert(tasks).values({
          id: crypto.randomUUID(),
          databasePageId,
          detailPageId,
          title: item.title,
          status: item.status,
          priority: item.priority,
          assigneeId: user.id,
          positionOrder: item.order,
        });
      }
    });

    revalidatePath(`/workspace/${input.workspaceId}`);
    return { success: true, databasePageId };
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err.message
          : "Gagal membuat sub-database Sprint Tracker.",
    };
  }
}
