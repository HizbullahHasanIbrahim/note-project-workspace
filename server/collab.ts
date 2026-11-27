import fs from "fs";
import path from "path";
import crypto from "crypto";
import type * as Y from "yjs";
import type {
  onAuthenticatePayload,
  onChangePayload,
  onDisconnectPayload,
  onLoadDocumentPayload,
  onStoreDocumentPayload,
} from "@hocuspocus/server";
import type { BlockNoteEditor } from "@blocknote/core";
import { and, desc, eq, inArray, isNotNull } from "drizzle-orm";
import { db } from "../src/db";
import {
  comments,
  pageBlocks,
  pageRelations,
  pageVersions,
  pages,
  users,
  workspaceMembers,
} from "../src/db/schema";
import {
  extractSessionTokenFromCookieHeader,
  verifySessionToken,
} from "../src/lib/auth";
import { COLLAB_FRAGMENT_NAME } from "../src/lib/collab-constants";
import { DEFAULT_POSITION_STEP } from "../src/lib/fractional-index";

// Muat file .env saat dijalankan sebagai proses daemon terpisah
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath) && typeof process.loadEnvFile === "function") {
  process.loadEnvFile(envPath);
}

export interface CollabContext {
  user: {
    id: string;
    name: string;
    email: string;
  };
  role: "admin" | "member" | "viewer";
  pageId: string;
  workspaceId: string;
}

type ProjectedBlockType = "paragraph" | "heading" | "checklist" | "code" | "table";

// Singleton pemuat ESM untuk @blocknote/core, yjs, dan @hocuspocus/server
// agar tidak terjadi double-import Yjs (CJS vs ESM) saat dijalankan lewat tsx
let blockNoteRuntimePromise: Promise<{
  Y: typeof import("yjs");
  HocuspocusServer: typeof import("@hocuspocus/server").Server;
  editor: BlockNoteEditor;
  yDocToBlocks: typeof import("@blocknote/core/yjs").yDocToBlocks;
  blocksToYXmlFragment: typeof import("@blocknote/core/yjs").blocksToYXmlFragment;
}> | null = null;

export async function getBlockNoteRuntime() {
  if (!blockNoteRuntimePromise) {
    blockNoteRuntimePromise = Promise.all([
      import("yjs"),
      import("@hocuspocus/server"),
      import("@blocknote/core"),
      import("@blocknote/core/yjs"),
    ]).then(([yjsMod, hpServer, bnCore, bnYjs]) => ({
      Y: yjsMod,
      HocuspocusServer: hpServer.Server,
      editor: bnCore.BlockNoteEditor.create(),
      yDocToBlocks: bnYjs.yDocToBlocks,
      blocksToYXmlFragment: bnYjs.blocksToYXmlFragment,
    }));
  }
  return blockNoteRuntimePromise;
}

function parseDocumentPageId(documentName: string): string {
  if (documentName.startsWith("page:")) {
    return documentName.slice("page:".length);
  }
  return documentName;
}

/**
 * Menghasilkan ID blok yang aman untuk primary key CHAR(36) pada `page_blocks`
 * agar placeholder bawaan "initialBlockId" tidak bertabrakan antar-halaman.
 */
function normalizeBlockId(rawId: string, pageId: string): string {
  if (rawId && rawId !== "initialBlockId" && rawId.length <= 36) {
    return rawId;
  }
  const hex = crypto
    .createHash("md5")
    .update(`${pageId}:${rawId || "initial"}`)
    .digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

function mapBlockType(bnType: string): ProjectedBlockType {
  switch (bnType) {
    case "heading":
      return "heading";
    case "checkListItem":
      return "checklist";
    case "codeBlock":
      return "code";
    case "table":
      return "table";
    default:
      return "paragraph";
  }
}

const UUID_PAGE_LINK_REGEX = /\/workspace\/[^/]+\/page\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;
const WIKI_BRACKET_REGEX = /\[\[([^\]]+)\]\]/g;

function extractInlineTextAndLinks(
  inlineOrTableContent: unknown,
  validPageIdsByTitle: Map<string, string>,
  foundLinks: Set<string>
): string {
  if (!inlineOrTableContent) return "";

  if (typeof inlineOrTableContent === "string") {
    let match: RegExpExecArray | null;
    WIKI_BRACKET_REGEX.lastIndex = 0;
    while ((match = WIKI_BRACKET_REGEX.exec(inlineOrTableContent)) !== null) {
      const targetId = validPageIdsByTitle.get(match[1].trim().toLowerCase());
      if (targetId) foundLinks.add(targetId);
    }
    return inlineOrTableContent;
  }

  if (Array.isArray(inlineOrTableContent)) {
    return inlineOrTableContent
      .map((node) => {
        if (!node || typeof node !== "object") return "";
        const item = node as Record<string, unknown>;
        if (item.type === "text" && typeof item.text === "string") {
          return extractInlineTextAndLinks(item.text, validPageIdsByTitle, foundLinks);
        }
        if (item.type === "link") {
          if (typeof item.href === "string") {
            const hrefMatch = UUID_PAGE_LINK_REGEX.exec(item.href);
            if (hrefMatch?.[1]) {
              foundLinks.add(hrefMatch[1]);
            }
          }
          return extractInlineTextAndLinks(item.content, validPageIdsByTitle, foundLinks);
        }
        return extractInlineTextAndLinks(item.content, validPageIdsByTitle, foundLinks);
      })
      .join("");
  }

  if (typeof inlineOrTableContent === "object") {
    const tableObj = inlineOrTableContent as Record<string, unknown>;
    if (tableObj.type === "tableContent" && Array.isArray(tableObj.rows)) {
      return tableObj.rows
        .map((row) => {
          if (!row || typeof row !== "object") return "";
          const cells = (row as { cells?: unknown[] }).cells;
          if (!Array.isArray(cells)) return "";
          return cells
            .map((cell) => {
              if (Array.isArray(cell)) {
                return extractInlineTextAndLinks(cell, validPageIdsByTitle, foundLinks);
              }
              if (cell && typeof cell === "object") {
                return extractInlineTextAndLinks(
                  (cell as { content?: unknown }).content,
                  validPageIdsByTitle,
                  foundLinks
                );
              }
              return "";
            })
            .join(" | ");
        })
        .join("\n");
    }
  }

  return "";
}

/**
 * Memproyeksikan state Yjs terbaru ke tabel `page_blocks` (untuk pencarian Cmd+K FULLTEXT),
 * memperbarui `page_relations` (backlinks internal), dan menandai komentar orphaned.
 */
export async function syncProjectionsToDatabase(
  pageId: string,
  workspaceId: string,
  ydoc: Y.Doc
) {
  const { editor: headlessEditor, yDocToBlocks } = await getBlockNoteRuntime();
  let blocks: typeof headlessEditor.document = [];
  try {
    const fragment = ydoc.getXmlFragment(COLLAB_FRAGMENT_NAME);
    if (fragment.length === 0) {
      blocks = [];
    } else {
      blocks = yDocToBlocks(headlessEditor, ydoc, COLLAB_FRAGMENT_NAME);
    }
  } catch (err) {
    console.warn(`[Collab] Gagal mendekode blok Yjs untuk halaman ${pageId}:`, err);
    return;
  }

  await db.transaction(async (tx) => {
    // 1. Ambil daftar halaman valid pada workspace ini untuk validasi backlink anti-IDOR
    const workspacePages = await tx
      .select({ id: pages.id, title: pages.title })
      .from(pages)
      .where(and(eq(pages.workspaceId, workspaceId), eq(pages.isArchived, false)));

    const validPageIds = new Set(workspacePages.map((p) => p.id));
    const validPageIdsByTitle = new Map<string, string>();
    for (const p of workspacePages) {
      validPageIdsByTitle.set(p.title.trim().toLowerCase(), p.id);
    }

    const projectedRows: Array<{
      id: string;
      pageId: string;
      blockType: ProjectedBlockType;
      contentText: string;
      propertiesJson: Record<string, unknown>;
      positionOrder: number;
    }> = [];

    const activeBlockIds = new Set<string>();
    const detectedBacklinks = new Set<string>();
    let orderCounter = 1;

    const visitBlocks = (nodes: typeof blocks) => {
      for (const block of nodes) {
        const text = extractInlineTextAndLinks(
          block.content,
          validPageIdsByTitle,
          detectedBacklinks
        ).trim();

        const isEmptyInitialPlaceholder =
          block.id === "initialBlockId" &&
          text.length === 0 &&
          (!block.children || block.children.length === 0);

        if (!isEmptyInitialPlaceholder) {
          const normalizedId = normalizeBlockId(block.id, pageId);
          activeBlockIds.add(block.id);
          activeBlockIds.add(normalizedId);

          projectedRows.push({
            id: normalizedId,
            pageId,
            blockType: mapBlockType(block.type),
            contentText: text,
            propertiesJson: {
              ...(block.props ?? {}),
              originalType: block.type,
            },
            positionOrder: orderCounter * DEFAULT_POSITION_STEP,
          });
          orderCounter += 1;
        }

        if (Array.isArray(block.children) && block.children.length > 0) {
          visitBlocks(block.children as typeof blocks);
        }
      }
    };

    visitBlocks(blocks);

    // 2. Deteksi blok yang dihapus untuk menandai komentar orphaned (PRD §8.1 #4)
    const existingComments = await tx
      .select({
        id: comments.id,
        blockId: comments.blockId,
        isBlockDeleted: comments.isBlockDeleted,
      })
      .from(comments)
      .where(and(eq(comments.pageId, pageId), isNotNull(comments.blockId)));

    const orphanedCommentIds: string[] = [];
    const restoredCommentIds: string[] = [];

    for (const c of existingComments) {
      if (!c.blockId) continue;
      const blockStillExists = activeBlockIds.has(c.blockId);
      if (!blockStillExists && !c.isBlockDeleted) {
        orphanedCommentIds.push(c.id);
      } else if (blockStillExists && c.isBlockDeleted) {
        restoredCommentIds.push(c.id);
      }
    }

    if (orphanedCommentIds.length > 0) {
      await tx
        .update(comments)
        .set({ isBlockDeleted: true })
        .where(inArray(comments.id, orphanedCommentIds));
    }

    if (restoredCommentIds.length > 0) {
      await tx
        .update(comments)
        .set({ isBlockDeleted: false })
        .where(inArray(comments.id, restoredCommentIds));
    }

    // 3. Sinkronisasi baris di tabel `page_blocks`
    await tx.delete(pageBlocks).where(eq(pageBlocks.pageId, pageId));
    if (projectedRows.length > 0) {
      await tx.insert(pageBlocks).values(projectedRows);
    }

    // 4. Perbarui relasi backlink di tabel `page_relations`
    await tx
      .delete(pageRelations)
      .where(
        and(
          eq(pageRelations.sourcePageId, pageId),
          eq(pageRelations.relationType, "backlink")
        )
      );

    const backlinkRows = Array.from(detectedBacklinks)
      .filter((targetId) => targetId !== pageId && validPageIds.has(targetId))
      .map((targetId) => ({
        id: crypto.randomUUID(),
        sourcePageId: pageId,
        targetPageId: targetId,
        relationType: "backlink" as const,
      }));

    if (backlinkRows.length > 0) {
      await tx.insert(pageRelations).values(backlinkRows);
    }
  });
}

const VERSION_SNAPSHOT_INTERVAL_MS = 10 * 60 * 1000;

/**
 * Memvalidasi nomor port server WebSocket dari variabel COLLAB_PORT (default 1234).
 */
export function parseCollabPort(
  rawPort: string | undefined = process.env.COLLAB_PORT
): number {
  if (!rawPort || rawPort.trim() === "") {
    return 1234;
  }
  const trimmed = rawPort.trim();
  if (!/^\d+$/.test(trimmed)) {
    throw new Error(
      `[Collab] Nilai COLLAB_PORT="${rawPort}" tidak valid. Gunakan angka port 1–65535.`
    );
  }
  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error(
      `[Collab] Nilai COLLAB_PORT="${rawPort}" berada di luar rentang valid (1–65535).`
    );
  }
  return parsed;
}

export async function createCollabServer(portArg?: number) {
  const port = portArg !== undefined ? portArg : parseCollabPort();
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(
      `[Collab] Port server kolaborasi tidak valid: ${port}. Harus bernilai 1–65535.`
    );
  }

  const { Y, HocuspocusServer } = await getBlockNoteRuntime();

  // Pelacakan status perubahan per documentName untuk snapshot saat last-client disconnect
  const unsavedYjsDocs = new Set<string>();
  const dirtyVersionDocs = new Set<string>();
  const lastStoredHashByDoc = new Map<string, string>();
  const lastSnapshotHashByDoc = new Map<string, string>();
  const inFlightPersistByDoc = new Map<string, Promise<void>>();

  const persistDocumentState = async (
    documentName: string,
    document: Y.Doc,
    authorIdHint?: string,
    forceSnapshotOnDirty = false
  ) => {
    const previous = inFlightPersistByDoc.get(documentName);
    const task = (previous ? previous.catch(() => undefined) : Promise.resolve()).then(
      async () => {
        const pageId = parseDocumentPageId(documentName);

        const [page] = await db
          .select({
            id: pages.id,
            workspaceId: pages.workspaceId,
            title: pages.title,
            createdBy: pages.createdBy,
            isArchived: pages.isArchived,
          })
          .from(pages)
          .where(eq(pages.id, pageId))
          .limit(1);

        if (!page || page.isArchived) {
          unsavedYjsDocs.delete(documentName);
          dirtyVersionDocs.delete(documentName);
          return;
        }

        const crdtBuffer = Buffer.from(Y.encodeStateAsUpdate(document));
        const crdtHash = crypto
          .createHash("sha256")
          .update(crdtBuffer)
          .digest("hex");

        const hasUnstoredState =
          lastStoredHashByDoc.get(documentName) !== crdtHash;

        if (hasUnstoredState) {
          // 1. Simpan state biner Yjs ke kolom LONGBLOB `pages.crdt_state`
          await db
            .update(pages)
            .set({ crdtState: crdtBuffer })
            .where(eq(pages.id, page.id));

          // 2. Jalankan proyeksi blok ke `page_blocks`, `page_relations`, dan komentar orphaned
          await syncProjectionsToDatabase(page.id, page.workspaceId, document);
          lastStoredHashByDoc.set(documentName, crdtHash);
          // Tandai dirty flag setiap kali perubahan baru disimpan ke MySQL
          dirtyVersionDocs.add(documentName);
        }

        unsavedYjsDocs.delete(documentName);

        if (crdtBuffer.length === 0) {
          return;
        }

        const hasUnsnapshottedChanges =
          dirtyVersionDocs.has(documentName) &&
          lastSnapshotHashByDoc.get(documentName) !== crdtHash;

        if (!hasUnsnapshottedChanges) {
          dirtyVersionDocs.delete(documentName);
          return;
        }

        // 3. Simpan snapshot versi ke `page_versions` jika melewati jeda 10 menit
        // atau ketika klien terakhir keluar sementara dirty flag masih aktif.
        let shouldWriteSnapshot = forceSnapshotOnDirty;

        if (!shouldWriteSnapshot) {
          const [latestVersion] = await db
            .select({ createdAt: pageVersions.createdAt })
            .from(pageVersions)
            .where(eq(pageVersions.pageId, page.id))
            .orderBy(desc(pageVersions.createdAt))
            .limit(1);

          const elapsedMs = latestVersion
            ? Date.now() - latestVersion.createdAt.getTime()
            : Infinity;
          shouldWriteSnapshot = elapsedMs >= VERSION_SNAPSHOT_INTERVAL_MS;
        }

        if (shouldWriteSnapshot) {
          const snapshotAuthorId = authorIdHint || page.createdBy;
          await db.insert(pageVersions).values({
            id: crypto.randomUUID(),
            pageId: page.id,
            createdBy: snapshotAuthorId,
            titleSnapshot: page.title,
            crdtSnapshot: crdtBuffer,
          });
          lastSnapshotHashByDoc.set(documentName, crdtHash);
          dirtyVersionDocs.delete(documentName);
        }
      }
    );

    inFlightPersistByDoc.set(documentName, task);
    try {
      await task;
    } finally {
      if (inFlightPersistByDoc.get(documentName) === task) {
        inFlightPersistByDoc.delete(documentName);
      }
    }
  };

  return new HocuspocusServer<CollabContext>({
    name: "note-project-workspace-collab",
    port,
    // Kelola SIGINT/SIGTERM sendiri lewat graceful shutdown entrypoint
    stopOnSignals: false,
    // Debounce 2 detik setelah aktivitas ketik berhenti sesuai PRD §7.1
    debounce: 2000,
    maxDebounce: 10000,
    unloadImmediately: false,

    async onAuthenticate(data: onAuthenticatePayload<CollabContext>) {
      const { token, documentName, requestHeaders, connectionConfig } = data;
      const cookieHeader =
        typeof requestHeaders?.get === "function"
          ? requestHeaders.get("cookie")
          : (requestHeaders as unknown as Record<string, string | undefined>)?.cookie;

      const rawToken =
        token || extractSessionTokenFromCookieHeader(cookieHeader) || "";

      if (!rawToken) {
        throw new Error("Unauthorized: Token sesi kolaborasi tidak tersedia.");
      }

      const sessionPayload = verifySessionToken(rawToken);
      if (!sessionPayload) {
        throw new Error("Unauthorized: Token sesi tidak valid atau kedaluwarsa.");
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, sessionPayload.userId))
        .limit(1);

      if (!user) {
        throw new Error("Unauthorized: Pengguna tidak ditemukan.");
      }

      const pageId = parseDocumentPageId(documentName);
      const [page] = await db
        .select({
          id: pages.id,
          workspaceId: pages.workspaceId,
          spaceType: pages.spaceType,
          createdBy: pages.createdBy,
          isArchived: pages.isArchived,
        })
        .from(pages)
        .where(eq(pages.id, pageId))
        .limit(1);

      if (!page || page.isArchived) {
        throw new Error("Not Found: Halaman dokumen tidak ditemukan.");
      }

      // Verifikasi keanggotaan workspace (Anti-IDOR)
      const [membership] = await db
        .select()
        .from(workspaceMembers)
        .where(
          and(
            eq(workspaceMembers.workspaceId, page.workspaceId),
            eq(workspaceMembers.userId, user.id)
          )
        )
        .limit(1);

      if (!membership) {
        throw new Error("Forbidden: Anda bukan anggota ruang kerja ini.");
      }

      // Isolasi Private Space: hanya pembuat halaman yang diizinkan mengakses
      if (page.spaceType === "private" && page.createdBy !== user.id) {
        throw new Error(
          "Forbidden: Halaman Private Space hanya dapat diakses oleh pembuatnya."
        );
      }

      // Terapkan RBAC: Peran Viewer bersifat read-only pada level WebSocket
      if (membership.role === "viewer") {
        connectionConfig.readOnly = true;
      }

      return {
        user: {
          id: user.id,
          name: user.fullName,
          email: user.email,
        },
        role: membership.role,
        pageId: page.id,
        workspaceId: page.workspaceId,
      };
    },

    async onChange(data: onChangePayload<CollabContext>) {
      unsavedYjsDocs.add(data.documentName);
      dirtyVersionDocs.add(data.documentName);
    },

    async onLoadDocument(data: onLoadDocumentPayload<CollabContext>) {
      const pageId = data.context?.pageId || parseDocumentPageId(data.documentName);

      const [page] = await db
        .select({ crdtState: pages.crdtState })
        .from(pages)
        .where(eq(pages.id, pageId))
        .limit(1);

      if (page?.crdtState && page.crdtState.length > 0) {
        Y.applyUpdate(data.document, new Uint8Array(page.crdtState));
      }

      return data.document;
    },

    async onStoreDocument(data: onStoreDocumentPayload<CollabContext>) {
      await persistDocumentState(
        data.documentName,
        data.document,
        data.lastContext?.user?.id,
        false
      );
    },

    async onDisconnect(data: onDisconnectPayload<CollabContext>) {
      // Saat klien terakhir meninggalkan dokumen, simpan snapshot jika masih ada perubahan dirty
      if (
        data.document.getConnectionsCount() === 0 &&
        (dirtyVersionDocs.has(data.documentName) ||
          unsavedYjsDocs.has(data.documentName))
      ) {
        await persistDocumentState(
          data.documentName,
          data.document,
          data.context?.user?.id,
          true
        );
      }
    },

    async afterUnloadDocument(data) {
      unsavedYjsDocs.delete(data.documentName);
      dirtyVersionDocs.delete(data.documentName);
      lastStoredHashByDoc.delete(data.documentName);
      lastSnapshotHashByDoc.delete(data.documentName);
    },
  });
}

// Jalankan server secara otomatis jika dieksekusi langsung lewat `tsx watch server/collab.ts`
const entryBase = process.argv[1] ? path.basename(process.argv[1]) : "";
const isEntrypoint = entryBase === "collab.ts" || entryBase === "collab.js";

if (isEntrypoint) {
  (async () => {
    const port = parseCollabPort();
    const server = await createCollabServer(port);

    server.httpServer.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        console.error(
          `[Collab] Gagal menjalankan server: port ${port} sudah digunakan proses lain (EADDRINUSE). Hentikan proses tersebut atau ubah COLLAB_PORT di .env.`
        );
      } else {
        console.error(
          `[Collab] Kesalahan fatal HTTP/WebSocket server pada port ${port}:`,
          err
        );
      }
      process.exit(1);
    });

    let isShuttingDown = false;
    const shutdownGracefully = async (signal: string) => {
      if (isShuttingDown) return;
      isShuttingDown = true;
      console.log(
        `\n[Collab] Menerima sinyal ${signal}. Menyimpan seluruh dokumen Yjs yang tersisa ke MySQL...`
      );
      try {
        await server.destroy();
        await db.$client.end();
        console.log("[Collab] Graceful shutdown selesai tanpa kehilangan data.");
        process.exit(0);
      } catch (err) {
        console.error("[Collab] Terjadi kesalahan saat graceful shutdown:", err);
        process.exit(1);
      }
    };

    process.once("SIGINT", () => void shutdownGracefully("SIGINT"));
    process.once("SIGTERM", () => void shutdownGracefully("SIGTERM"));

    await server.listen();
  })().catch((err) => {
    console.error("[Collab] Gagal menjalankan server Hocuspocus:", err);
    process.exit(1);
  });
}
