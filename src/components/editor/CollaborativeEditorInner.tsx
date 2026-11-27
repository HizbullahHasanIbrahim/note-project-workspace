"use client";

import React, { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import * as Y from "yjs";
import { HocuspocusProvider, WebSocketStatus } from "@hocuspocus/provider";
import {
  SuggestionMenuController,
  useCreateBlockNote,
  type DefaultReactSuggestionItem,
} from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { withCollaboration } from "@blocknote/core/yjs";
import type { Block } from "@blocknote/core";
import "@blocknote/mantine/style.css";
import { FileText, Database } from "lucide-react";
import {
  COLLAB_FRAGMENT_NAME,
  getCursorAccentToken,
  type CursorAccentToken,
} from "@/lib/collab-constants";
import {
  useWorkspaceUIStore,
  type ActiveBacklinkItem,
} from "@/stores/useWorkspaceUIStore";
import {
  createSprintSubDatabaseAction,
  updatePageMetaAction,
} from "@/app/workspace/[workspaceId]/page-actions";
import {
  TemplatePickerCard,
  buildStarterTemplateBlocks,
  type StarterTemplateId,
} from "./TemplatePickerCard";

export interface LinkablePageSummary {
  id: string;
  title: string;
  icon: string | null;
  pageType: "document" | "database" | "task_item";
}

export interface CollaborativeEditorProps {
  workspaceId: string;
  pageId: string;
  initialTitle: string;
  initialIcon: string | null;
  collabToken: string;
  currentUser: {
    id: string;
    name: string;
  };
  isReadOnly: boolean;
  linkablePages: LinkablePageSummary[];
  initialBacklinks: ActiveBacklinkItem[];
}

function isDocumentEffectivelyEmpty(blocks: Block<any, any, any>[]): boolean {
  if (blocks.length === 0) return true;
  if (blocks.length > 1) return false;
  const first = blocks[0];
  if (first.type !== "paragraph") return false;
  if (Array.isArray(first.children) && first.children.length > 0) return false;
  if (!Array.isArray(first.content) || first.content.length === 0) return true;
  return first.content.every(
    (item: any) =>
      item?.type === "text" && (!item.text || item.text.trim().length === 0)
  );
}

/**
 * Merender Live Cursor Yjs menggunakan kelas M3 tanpa kode hex mentah (SDD.md §5.2)
 */
function renderMaterialCursor(user: { name: string; color: string }) {
  const accent =
    user.color === "tertiary" || user.color === "secondary"
      ? user.color
      : "primary";

  const wrapper = document.createElement("span");
  wrapper.className = "m3-collab-cursor";
  wrapper.setAttribute("data-accent", accent);
  wrapper.setAttribute("contenteditable", "false");

  const label = document.createElement("span");
  label.className = "m3-collab-cursor-label";
  label.textContent = user.name;
  wrapper.appendChild(label);

  return wrapper;
}

interface EditorSurfaceProps {
  workspaceId: string;
  pageId: string;
  initialTitle: string;
  ydoc: Y.Doc;
  provider: HocuspocusProvider;
  userName: string;
  userAccent: CursorAccentToken;
  isReadOnly: boolean;
  isDarkMode: boolean;
  linkablePages: LinkablePageSummary[];
}

function EditorSurface({
  workspaceId,
  pageId,
  initialTitle,
  ydoc,
  provider,
  userName,
  userAccent,
  isReadOnly,
  isDarkMode,
  linkablePages,
}: EditorSurfaceProps) {
  const router = useRouter();
  const [isEmptyDoc, setIsEmptyDoc] = useState(true);
  const [templateDismissed, setTemplateDismissed] = useState(false);
  const [isApplyingTemplate, startApplyingTemplate] = useTransition();

  const editor = useCreateBlockNote(
    withCollaboration({
      collaboration: {
        provider: provider as unknown as { awareness?: any },
        fragment: ydoc.getXmlFragment(COLLAB_FRAGMENT_NAME),
        user: {
          name: userName,
          color: userAccent,
        },
        renderCursor: renderMaterialCursor,
        showCursorLabels: "activity",
      },
      links: {
        // Sanitasi skema URL sesuai PRD §8.2 #4 + dukung tautan internal workspace
        isValidLink: (href: string) => {
          if (href.startsWith("/workspace/")) return true;
          return /^(https?:\/\/|mailto:)/i.test(href);
        },
      },
      domAttributes: {
        editor: {
          class: "min-h-[360px] focus:outline-none",
        },
      },
    }),
    [provider, ydoc, pageId]
  );

  // Periksa status kekosongan kanvas saat sinkronisasi selesai atau isi berubah
  useEffect(() => {
    const syncEmptyState = () => {
      setIsEmptyDoc(isDocumentEffectivelyEmpty(editor.document));
    };
    syncEmptyState();
    const unsub = editor.onChange(syncEmptyState);
    const onSyncedHandler = () => {
      syncEmptyState();
    };
    provider.on("synced", onSyncedHandler);
    return () => {
      unsub();
      provider.off("synced", onSyncedHandler);
    };
  }, [editor, provider]);

  // Item suggestion untuk pemicu tautan internal halaman `[[` (PRD §4.2 US-08)
  const getPageLinkItems = async (
    query: string
  ): Promise<DefaultReactSuggestionItem[]> => {
    const q = query.trim().toLowerCase();
    return linkablePages
      .filter((p) => p.id !== pageId && p.title.toLowerCase().includes(q))
      .slice(0, 8)
      .map((p) => ({
        title: p.title,
        subtext:
          p.pageType === "database"
            ? "Task Database"
            : "Tautkan halaman (Backlink)",
        icon: p.icon ? (
          <span className="text-sm">{p.icon}</span>
        ) : p.pageType === "database" ? (
          <Database className="w-4 h-4" />
        ) : (
          <FileText className="w-4 h-4" />
        ),
        onItemClick: () => {
          editor.insertInlineContent([
            {
              type: "link",
              href:
                p.pageType === "database"
                  ? `/workspace/${workspaceId}/database/${p.id}`
                  : `/workspace/${workspaceId}/page/${p.id}`,
              content: p.title,
            },
            " ",
          ]);
        },
      }));
  };

  const handleSelectTemplate = (templateId: StarterTemplateId) => {
    if (isReadOnly) return;
    startApplyingTemplate(async () => {
      let subDatabaseId: string | undefined;

      if (templateId === "sprint_tracker") {
        const res = await createSprintSubDatabaseAction({
          workspaceId,
          parentPageId: pageId,
        });
        if (res.databasePageId) {
          subDatabaseId = res.databasePageId;
        }
      }

      const template = buildStarterTemplateBlocks(templateId, {
        workspaceId,
        subDatabaseId,
      });

      editor.replaceBlocks(editor.document, template.blocks);
      setIsEmptyDoc(false);
      setTemplateDismissed(true);

      // Perbarui judul apabila halaman masih memakai judul default kosong
      if (
        initialTitle === "Halaman Baru" ||
        initialTitle === "Sub-halaman Baru" ||
        initialTitle === "Halaman Tanpa Judul" ||
        initialTitle === "Catatan Privat Baru"
      ) {
        await updatePageMetaAction({
          workspaceId,
          pageId,
          title: template.title,
          icon: template.icon,
        });
      }

      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {!isReadOnly && isEmptyDoc && !templateDismissed && (
        <TemplatePickerCard
          onSelectTemplate={handleSelectTemplate}
          onDismiss={() => setTemplateDismissed(true)}
          isApplying={isApplyingTemplate}
        />
      )}

      <BlockNoteView
        editor={editor}
        editable={!isReadOnly}
        theme={isDarkMode ? "dark" : "light"}
        data-m3-theme={isDarkMode ? "dark" : "light"}
      >
        <SuggestionMenuController
          triggerCharacter="[["
          getItems={getPageLinkItems}
        />
      </BlockNoteView>
    </div>
  );
}

export default function CollaborativeEditorInner({
  workspaceId,
  pageId,
  initialTitle,
  collabToken,
  currentUser,
  isReadOnly,
  linkablePages,
  initialBacklinks,
}: CollaborativeEditorProps) {
  const {
    isDarkMode,
    setCollabStatus,
    setLiveCollaborators,
    setActivePageTitle,
    setActiveBacklinks,
  } = useWorkspaceUIStore();

  const [sessionInstance, setSessionInstance] = useState<{
    ydoc: Y.Doc;
    provider: HocuspocusProvider;
  } | null>(null);

  const userAccent = useMemo(
    () => getCursorAccentToken(currentUser.id),
    [currentUser.id]
  );

  // Sinkronkan judul halaman aktif & daftar backlink ke Topbar/SupportingPane
  useEffect(() => {
    setActivePageTitle(initialTitle);
    setActiveBacklinks(initialBacklinks);
    return () => {
      setActivePageTitle(null);
      setActiveBacklinks([]);
    };
  }, [initialTitle, initialBacklinks, setActivePageTitle, setActiveBacklinks]);

  // Siklus hidup terisolasi Y.Doc + HocuspocusProvider dengan cleanup wajib (SDD.md §6.2)
  useEffect(() => {
    const wsUrl =
      process.env.NEXT_PUBLIC_COLLAB_WS_URL || "ws://localhost:1234";

    const ydoc = new Y.Doc();
    setCollabStatus("syncing");

    const provider = new HocuspocusProvider({
      url: wsUrl,
      name: pageId,
      document: ydoc,
      token: collabToken,
      onStatus: ({ status }) => {
        if (status === WebSocketStatus.Disconnected) {
          setCollabStatus("offline");
        } else if (status === WebSocketStatus.Connecting) {
          setCollabStatus("syncing");
        }
      },
      onSynced: ({ state }) => {
        setCollabStatus(state ? "saved" : "syncing");
      },
      onUnsyncedChanges: ({ number }) => {
        if (number > 0) {
          setCollabStatus("syncing");
        } else if (provider.isSynced) {
          setCollabStatus("saved");
        }
      },
      onAwarenessUpdate: ({ states }) => {
        const mapped = states
          .filter((s) => s.user && typeof s.user.name === "string")
          .map((s) => ({
            clientId: s.clientId,
            name: String(s.user.name),
            colorToken: (s.user.color === "tertiary" ||
            s.user.color === "secondary"
              ? s.user.color
              : "primary") as CursorAccentToken,
          }));
        setLiveCollaborators(mapped);
      },
    });

    setSessionInstance({ ydoc, provider });

    return () => {
      setLiveCollaborators([]);
      setCollabStatus("saved");
      provider.destroy();
      ydoc.destroy();
    };
  }, [pageId, collabToken, setCollabStatus, setLiveCollaborators]);

  if (!sessionInstance) {
    return (
      <div
        aria-busy="true"
        aria-label="Memuat kanvas editor kolaboratif"
        className="w-full min-h-[360px] rounded-2xl bg-surface-container animate-pulse p-6 flex flex-col gap-3"
      >
        <div className="h-6 w-2/3 rounded-lg bg-surface-container-high" />
        <div className="h-4 w-full rounded-lg bg-surface-container-high" />
        <div className="h-4 w-5/6 rounded-lg bg-surface-container-high" />
      </div>
    );
  }

  return (
    <EditorSurface
      key={pageId}
      workspaceId={workspaceId}
      pageId={pageId}
      initialTitle={initialTitle}
      ydoc={sessionInstance.ydoc}
      provider={sessionInstance.provider}
      userName={currentUser.name}
      userAccent={userAccent}
      isReadOnly={isReadOnly}
      isDarkMode={isDarkMode}
      linkablePages={linkablePages}
    />
  );
}
