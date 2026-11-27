"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  CheckSquare,
  Database,
  FilePlus2,
  FileText,
  Lock,
  Moon,
  PanelRight,
  Search,
  Sun,
  Users,
  X,
} from "lucide-react";
import { createPageAction } from "@/app/workspace/[workspaceId]/page-actions";
import type {
  SearchPageResult,
  SearchTaskResult,
} from "@/app/api/workspaces/[workspaceId]/search/route";
import { TaskPriorityBadge, TaskStatusBadge } from "@/components/database/task-badges";
import type { WorkspaceRole } from "@/lib/permissions";
import { useWorkspaceUIStore } from "@/stores/useWorkspaceUIStore";

interface QuickCommandModalProps {
  workspaceId: string;
  userRole: WorkspaceRole;
}

/**
 * Dialog Quick Command (Cmd+K / Ctrl+K) berbasis cmdk sesuai SDD §5.3.
 * Melakukan query ke endpoint pencarian yang terisolasi Private Space secara server-side.
 */
export function QuickCommandModal({
  workspaceId,
  userRole,
}: QuickCommandModalProps) {
  const router = useRouter();
  const {
    isCmdKOpen,
    setIsCmdKOpen,
    isDarkMode,
    toggleTheme,
    toggleSupportingPane,
  } = useWorkspaceUIStore();

  const [query, setQuery] = useState("");
  const [pagesResult, setPagesResult] = useState<SearchPageResult[]>([]);
  const [tasksResult, setTasksResult] = useState<SearchTaskResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingPage, startCreatingPage] = useTransition();

  // Pintasan keyboard global Cmd+K / Ctrl+K
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        setIsCmdKOpen(!useWorkspaceUIStore.getState().isCmdKOpen);
      } else if (
        event.key === "Escape" &&
        useWorkspaceUIStore.getState().isCmdKOpen
      ) {
        event.preventDefault();
        setIsCmdKOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setIsCmdKOpen]);

  // Reset input setiap kali modal ditutup
  useEffect(() => {
    if (!isCmdKOpen) {
      setQuery("");
    }
  }, [isCmdKOpen]);

  // Fetch debounced ke /api/workspaces/[workspaceId]/search
  useEffect(() => {
    if (!isCmdKOpen) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/workspaces/${workspaceId}/search?q=${encodeURIComponent(query)}`,
          { signal: controller.signal }
        );
        if (!res.ok) return;
        const data = (await res.json()) as {
          pages?: SearchPageResult[];
          tasks?: SearchTaskResult[];
        };
        setPagesResult(data.pages ?? []);
        setTasksResult(data.tasks ?? []);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Cmd+K search error:", err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, query ? 180 : 0);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [isCmdKOpen, query, workspaceId]);

  if (!isCmdKOpen) return null;

  const navigateTo = (href: string) => {
    setIsCmdKOpen(false);
    router.push(href);
  };

  const handleQuickCreateTeamspacePage = () => {
    if (userRole === "viewer" || isCreatingPage) return;
    startCreatingPage(async () => {
      const res = await createPageAction({
        workspaceId,
        spaceType: "teamspace",
        pageType: "document",
        title: "Halaman Baru",
      });
      if (res.pageId) {
        setIsCmdKOpen(false);
        router.push(`/workspace/${workspaceId}/page/${res.pageId}`);
        router.refresh();
      }
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-scrim/40 flex items-start justify-center pt-[10vh] px-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          setIsCmdKOpen(false);
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Pencarian Cepat Workspace (Cmd+K)"
        className="w-full max-w-[600px] rounded-[28px] bg-surface-container-high border border-outline-variant/60 shadow-2xl overflow-hidden"
      >
        <Command shouldFilter={false} className="w-full flex flex-col">
          {/* Input pencarian 56px */}
          <div className="h-14 px-5 border-b border-outline-variant/60 flex items-center gap-3">
            <Search
              className="w-5 h-5 text-on-surface-variant shrink-0"
              aria-hidden="true"
            />
            <Command.Input
              autoFocus
              value={query}
              onValueChange={setQuery}
              placeholder="Cari halaman, isi dokumen, tugas, atau aksi cepat..."
              className="flex-1 bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant outline-none"
            />
            <button
              type="button"
              onClick={() => setIsCmdKOpen(false)}
              aria-label="Tutup pencarian cepat"
              className="min-w-[44px] min-h-[44px] -mr-2 rounded-full inline-flex items-center justify-center text-on-surface-variant hover:bg-surface-container-highest transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-outline"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {/* Daftar hasil terkelompok */}
          <Command.List className="max-h-[420px] overflow-y-auto p-2 flex flex-col gap-1">
            {isLoading && (
              <div className="px-4 py-3 text-xs text-on-surface-variant">
                Mencari di seluruh workspace...
              </div>
            )}

            {!isLoading &&
              pagesResult.length === 0 &&
              tasksResult.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-on-surface-variant">
                  Tidak ada halaman atau tugas yang cocok dengan &ldquo;{query}
                  &rdquo;.
                </div>
              )}

            {pagesResult.length > 0 && (
              <Command.Group
                heading="Halaman & Catatan"
                className="px-1 py-1 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-on-surface-variant"
              >
                {pagesResult.map((item) => (
                  <Command.Item
                    key={`page-${item.id}`}
                    value={`page-${item.id}`}
                    onSelect={() => navigateTo(item.href)}
                    className="min-h-[48px] px-3 py-2 rounded-xl flex items-center justify-between gap-3 text-on-surface cursor-pointer transition-colors data-[selected=true]:bg-secondary-container data-[selected=true]:text-on-secondary-container"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="mt-0.5 shrink-0 text-on-surface-variant">
                        {item.icon ? (
                          <span className="text-base">{item.icon}</span>
                        ) : item.pageType === "database" ? (
                          <Database className="w-4 h-4" aria-hidden="true" />
                        ) : (
                          <FileText className="w-4 h-4" aria-hidden="true" />
                        )}
                      </span>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium truncate">
                          {item.title}
                        </span>
                        {item.snippet && (
                          <span className="text-xs opacity-80 truncate">
                            {item.snippet}
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-surface-container px-2.5 py-0.5 text-[11px] font-medium text-on-surface-variant">
                      {item.spaceType === "private" ? (
                        <>
                          <Lock className="w-3 h-3" aria-hidden="true" />
                          <span>Private</span>
                        </>
                      ) : (
                        <>
                          <Users className="w-3 h-3" aria-hidden="true" />
                          <span>Teamspace</span>
                        </>
                      )}
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {tasksResult.length > 0 && (
              <Command.Group
                heading="Tugas"
                className="px-1 py-1 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-on-surface-variant"
              >
                {tasksResult.map((task) => (
                  <Command.Item
                    key={`task-${task.id}`}
                    value={`task-${task.id}`}
                    onSelect={() => navigateTo(task.href)}
                    className="min-h-[48px] px-3 py-2 rounded-xl flex items-center justify-between gap-3 text-on-surface cursor-pointer transition-colors data-[selected=true]:bg-secondary-container data-[selected=true]:text-on-secondary-container"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <CheckSquare
                        className="w-4 h-4 mt-0.5 shrink-0 text-primary"
                        aria-hidden="true"
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium truncate">
                          {task.title}
                        </span>
                        {task.snippet && (
                          <span className="text-xs opacity-80 truncate">
                            {task.snippet}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <TaskStatusBadge status={task.status} />
                      <TaskPriorityBadge priority={task.priority} />
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            <Command.Separator className="my-1 h-px bg-outline-variant/50" />

            <Command.Group
              heading="Aksi cepat"
              className="px-1 py-1 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-on-surface-variant"
            >
              {userRole !== "viewer" && (
                <Command.Item
                  value="action-create-teamspace-page"
                  onSelect={handleQuickCreateTeamspacePage}
                  className="min-h-[48px] px-3 py-2 rounded-xl flex items-center gap-3 text-sm text-on-surface cursor-pointer transition-colors data-[selected=true]:bg-secondary-container data-[selected=true]:text-on-secondary-container"
                >
                  <FilePlus2 className="w-4 h-4 text-primary" aria-hidden="true" />
                  <span>
                    {isCreatingPage
                      ? "Membuat halaman baru..."
                      : "Buat halaman baru di Shared Teamspace"}
                  </span>
                </Command.Item>
              )}

              <Command.Item
                value="action-toggle-theme"
                onSelect={() => {
                  toggleTheme();
                  setIsCmdKOpen(false);
                }}
                className="min-h-[48px] px-3 py-2 rounded-xl flex items-center gap-3 text-sm text-on-surface cursor-pointer transition-colors data-[selected=true]:bg-secondary-container data-[selected=true]:text-on-secondary-container"
              >
                {isDarkMode ? (
                  <Sun className="w-4 h-4 text-primary" aria-hidden="true" />
                ) : (
                  <Moon className="w-4 h-4 text-primary" aria-hidden="true" />
                )}
                <span>
                  {isDarkMode ? "Alihkan ke tema terang" : "Alihkan ke tema gelap"}
                </span>
              </Command.Item>

              <Command.Item
                value="action-toggle-supporting-pane"
                onSelect={() => {
                  toggleSupportingPane();
                  setIsCmdKOpen(false);
                }}
                className="min-h-[48px] px-3 py-2 rounded-xl flex items-center gap-3 text-sm text-on-surface cursor-pointer transition-colors data-[selected=true]:bg-secondary-container data-[selected=true]:text-on-secondary-container"
              >
                <PanelRight className="w-4 h-4 text-primary" aria-hidden="true" />
                <span>Buka atau tutup panel komentar & backlinks</span>
              </Command.Item>
            </Command.Group>
          </Command.List>

          {/* Footer petunjuk pintasan */}
          <div className="px-5 py-2.5 border-t border-outline-variant/50 bg-surface-container flex items-center justify-between text-[11px] text-on-surface-variant">
            <span>Gunakan panah atas/bawah dan Enter untuk membuka</span>
            <span className="font-mono">Cmd/Ctrl + K</span>
          </div>
        </Command>
      </div>
    </div>
  );
}
