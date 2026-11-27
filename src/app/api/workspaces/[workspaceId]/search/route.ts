import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, inArray, ne, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { pageBlocks, pages, tasks, workspaceMembers } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { canSearch } from "@/lib/permissions";

export interface SearchPageResult {
  id: string;
  title: string;
  icon: string | null;
  pageType: "document" | "database" | "task_item";
  spaceType: "teamspace" | "private";
  snippet: string | null;
  href: string;
}

export interface SearchTaskResult {
  id: string;
  databasePageId: string;
  detailPageId: string;
  title: string;
  status: "todo" | "in_progress" | "review" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  spaceType: "teamspace" | "private";
  snippet: string | null;
  href: string;
}

function escapeSqlLike(input: string): string {
  return input.replace(/[\\%_]/g, "\\$&");
}

function buildSnippet(content: string | null, query: string): string | null {
  if (!content) return null;
  const clean = content.replace(/\s+/g, " ").trim();
  if (!clean) return null;
  if (!query) return clean.slice(0, 90);
  const idx = clean.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return clean.slice(0, 90);
  const start = Math.max(0, idx - 28);
  const end = Math.min(clean.length, idx + query.length + 52);
  return `${start > 0 ? "…" : ""}${clean.slice(start, end)}${end < clean.length ? "…" : ""}`;
}

/**
 * Endpoint pencarian Quick Command (Cmd+K).
 * Menegakkan keanggotaan workspace dan isolasi ketat Private Space (PRD §8.2 #2)
 * di tingkat SQL agar halaman privat milik user lain tidak pernah bocor.
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

    if (!membership || !canSearch(membership.role)) {
      return NextResponse.json(
        { error: "403 Forbidden: Anda bukan anggota workspace ini." },
        { status: 403 }
      );
    }

    const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

    // Klausa Anti-IDOR wajib (PRD §8.2 #2):
    // Hanya Teamspace atau Private Space milik currentUser.id yang boleh diakses.
    const accessibleScope = and(
      eq(pages.workspaceId, workspaceId),
      eq(pages.isArchived, false),
      or(
        eq(pages.spaceType, "teamspace"),
        and(
          eq(pages.spaceType, "private"),
          eq(pages.createdBy, currentUser.id)
        )
      )
    );

    if (!query) {
      const [recentPages, recentTasks] = await Promise.all([
        db
          .select({
            id: pages.id,
            title: pages.title,
            icon: pages.icon,
            pageType: pages.pageType,
            spaceType: pages.spaceType,
          })
          .from(pages)
          .where(and(accessibleScope, ne(pages.pageType, "task_item")))
          .orderBy(desc(pages.updatedAt))
          .limit(8),
        db
          .select({
            id: tasks.id,
            databasePageId: tasks.databasePageId,
            detailPageId: tasks.detailPageId,
            title: tasks.title,
            status: tasks.status,
            priority: tasks.priority,
            spaceType: pages.spaceType,
          })
          .from(tasks)
          .innerJoin(pages, eq(tasks.detailPageId, pages.id))
          .where(accessibleScope)
          .orderBy(desc(tasks.updatedAt))
          .limit(6),
      ]);

      const pageResults: SearchPageResult[] = recentPages.map((p) => ({
        id: p.id,
        title: p.title,
        icon: p.icon,
        pageType: p.pageType,
        spaceType: p.spaceType,
        snippet: null,
        href:
          p.pageType === "database"
            ? `/workspace/${workspaceId}/database/${p.id}`
            : `/workspace/${workspaceId}/page/${p.id}`,
      }));

      const taskResults: SearchTaskResult[] = recentTasks.map((t) => ({
        id: t.id,
        databasePageId: t.databasePageId,
        detailPageId: t.detailPageId,
        title: t.title,
        status: t.status,
        priority: t.priority,
        spaceType: t.spaceType,
        snippet: null,
        href: `/workspace/${workspaceId}/database/${t.databasePageId}?task=${t.id}`,
      }));

      return NextResponse.json({ pages: pageResults, tasks: taskResults });
    }

    const pattern = `%${escapeSqlLike(query)}%`;

    const [titlePageRows, blockMatchRows, titleTaskRows] = await Promise.all([
      db
        .select({
          id: pages.id,
          title: pages.title,
          icon: pages.icon,
          pageType: pages.pageType,
          spaceType: pages.spaceType,
        })
        .from(pages)
        .where(
          and(
            accessibleScope,
            ne(pages.pageType, "task_item"),
            sql`LOWER(${pages.title}) LIKE LOWER(${pattern}) ESCAPE '\\\\'`
          )
        )
        .orderBy(desc(pages.updatedAt))
        .limit(10),

      db
        .select({
          pageId: pages.id,
          title: pages.title,
          icon: pages.icon,
          pageType: pages.pageType,
          spaceType: pages.spaceType,
          contentText: pageBlocks.contentText,
        })
        .from(pageBlocks)
        .innerJoin(pages, eq(pageBlocks.pageId, pages.id))
        .where(
          and(
            accessibleScope,
            sql`LOWER(${pageBlocks.contentText}) LIKE LOWER(${pattern}) ESCAPE '\\\\'`
          )
        )
        .orderBy(desc(pageBlocks.updatedAt))
        .limit(16),

      db
        .select({
          id: tasks.id,
          databasePageId: tasks.databasePageId,
          detailPageId: tasks.detailPageId,
          title: tasks.title,
          status: tasks.status,
          priority: tasks.priority,
          spaceType: pages.spaceType,
        })
        .from(tasks)
        .innerJoin(pages, eq(tasks.detailPageId, pages.id))
        .where(
          and(
            accessibleScope,
            sql`LOWER(${tasks.title}) LIKE LOWER(${pattern}) ESCAPE '\\\\'`
          )
        )
        .orderBy(desc(tasks.updatedAt))
        .limit(10),
    ]);

    const pageMap = new Map<string, SearchPageResult>();
    for (const p of titlePageRows) {
      pageMap.set(p.id, {
        id: p.id,
        title: p.title,
        icon: p.icon,
        pageType: p.pageType,
        spaceType: p.spaceType,
        snippet: null,
        href:
          p.pageType === "database"
            ? `/workspace/${workspaceId}/database/${p.id}`
            : `/workspace/${workspaceId}/page/${p.id}`,
      });
    }

    const taskDetailSnippetMap = new Map<string, string | null>();
    for (const row of blockMatchRows) {
      const snippet = buildSnippet(row.contentText, query);
      if (row.pageType === "task_item") {
        if (!taskDetailSnippetMap.has(row.pageId)) {
          taskDetailSnippetMap.set(row.pageId, snippet);
        }
        continue;
      }

      const existing = pageMap.get(row.pageId);
      if (existing) {
        if (!existing.snippet && snippet) {
          existing.snippet = snippet;
        }
      } else {
        pageMap.set(row.pageId, {
          id: row.pageId,
          title: row.title,
          icon: row.icon,
          pageType: row.pageType,
          spaceType: row.spaceType,
          snippet,
          href:
            row.pageType === "database"
              ? `/workspace/${workspaceId}/database/${row.pageId}`
              : `/workspace/${workspaceId}/page/${row.pageId}`,
        });
      }
    }

    const taskMap = new Map<string, SearchTaskResult>();
    for (const t of titleTaskRows) {
      taskMap.set(t.id, {
        id: t.id,
        databasePageId: t.databasePageId,
        detailPageId: t.detailPageId,
        title: t.title,
        status: t.status,
        priority: t.priority,
        spaceType: t.spaceType,
        snippet: taskDetailSnippetMap.get(t.detailPageId) ?? null,
        href: `/workspace/${workspaceId}/database/${t.databasePageId}?task=${t.id}`,
      });
    }

    // Tugas yang deskripsi bloknya cocok dengan kata kunci namun judulnya berbeda
    const unmatchedDetailIds = Array.from(taskDetailSnippetMap.keys()).filter(
      (detailId) => !Array.from(taskMap.values()).some((t) => t.detailPageId === detailId)
    );

    if (unmatchedDetailIds.length > 0) {
      const blockMatchedTasks = await db
        .select({
          id: tasks.id,
          databasePageId: tasks.databasePageId,
          detailPageId: tasks.detailPageId,
          title: tasks.title,
          status: tasks.status,
          priority: tasks.priority,
          spaceType: pages.spaceType,
        })
        .from(tasks)
        .innerJoin(pages, eq(tasks.detailPageId, pages.id))
        .where(
          and(
            accessibleScope,
            inArray(tasks.detailPageId, unmatchedDetailIds)
          )
        )
        .limit(8);

      for (const t of blockMatchedTasks) {
        taskMap.set(t.id, {
          id: t.id,
          databasePageId: t.databasePageId,
          detailPageId: t.detailPageId,
          title: t.title,
          status: t.status,
          priority: t.priority,
          spaceType: t.spaceType,
          snippet: taskDetailSnippetMap.get(t.detailPageId) ?? null,
          href: `/workspace/${workspaceId}/database/${t.databasePageId}?task=${t.id}`,
        });
      }
    }

    return NextResponse.json({
      pages: Array.from(pageMap.values()).slice(0, 12),
      tasks: Array.from(taskMap.values()).slice(0, 10),
    });
  } catch (err) {
    console.error("Search API error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mencari dokumen." },
      { status: 500 }
    );
  }
}
