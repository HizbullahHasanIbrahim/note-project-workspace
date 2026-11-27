"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, MessageSquare } from "lucide-react";
import { markMentionReadAction } from "@/app/workspace/[workspaceId]/comment-actions";
import { cn } from "@/lib/utils";

export interface UnreadMentionItem {
  id: string;
  commentId: string;
  pageId: string;
  pageTitle: string;
  pageType: "document" | "database" | "task_item";
  databasePageId: string | null;
  authorName: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

interface MentionsPopoverProps {
  workspaceId: string;
  mentions: UnreadMentionItem[];
}

/**
 * Tombol lonceng & popover notifikasi @mention di Topbar sesuai SDD §4.1.
 * Menampilkan penghitung notifikasi yang belum dibaca (is_read = false).
 */
export function MentionsPopover({
  workspaceId,
  mentions,
}: MentionsPopoverProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [localMentions, setLocalMentions] =
    useState<UnreadMentionItem[]>(mentions);
  const [isPending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalMentions(mentions);
  }, [mentions]);

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  const unreadCount = localMentions.filter((m) => !m.isRead).length;

  const handleMarkSingleRead = (mentionId: string) => {
    setLocalMentions((prev) =>
      prev.map((m) => (m.id === mentionId ? { ...m, isRead: true } : m))
    );
    setIsOpen(false);
    startTransition(async () => {
      await markMentionReadAction({ workspaceId, mentionId });
      router.refresh();
    });
  };

  const handleMarkAllRead = () => {
    if (unreadCount === 0 || isPending) return;
    setLocalMentions((prev) => prev.map((m) => ({ ...m, isRead: true })));
    startTransition(async () => {
      await markMentionReadAction({ workspaceId, markAll: true });
      router.refresh();
    });
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={
          unreadCount > 0
            ? `Lihat ${unreadCount} notifikasi sebutan (@mention) belum dibaca`
            : "Lihat notifikasi sebutan (@mention)"
        }
        className={cn(
          "min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center relative",
          "hover:bg-surface-container-high text-on-surface transition-colors",
          "focus-visible:ring-2 focus-visible:ring-outline outline-none cursor-pointer"
        )}
      >
        <Bell className="w-5 h-5" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-tertiary text-on-tertiary text-[10px] font-bold flex items-center justify-center ring-2 ring-surface">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Daftar notifikasi sebutan (@mention)"
          className="absolute right-0 top-12 w-80 sm:w-96 rounded-2xl bg-surface-container-high border border-outline-variant/60 shadow-2xl overflow-hidden z-50"
        >
          <div className="px-4 py-3 border-b border-outline-variant/50 flex items-center justify-between gap-2 bg-surface-container">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-on-surface">
                Notifikasi @mention
              </span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-tertiary-container text-on-tertiary-container px-2 py-0.5 text-[11px] font-medium">
                  {unreadCount} baru
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={isPending}
                className="min-h-[36px] px-2.5 rounded-full text-xs font-medium text-primary hover:bg-primary/10 inline-flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
              >
                <CheckCheck className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Tandai terbaca</span>
              </button>
            )}
          </div>

          <div className="max-h-[360px] overflow-y-auto divide-y divide-outline-variant/40">
            {localMentions.length === 0 ? (
              <div className="p-6 text-center text-xs text-on-surface-variant">
                Belum ada sebutan (@mention) baru di workspace ini.
              </div>
            ) : (
              localMentions.map((item) => {
                const href =
                  item.pageType === "task_item" && item.databasePageId
                    ? `/workspace/${workspaceId}/database/${item.databasePageId}?task=${item.pageId}`
                    : item.pageType === "database"
                    ? `/workspace/${workspaceId}/database/${item.pageId}`
                    : `/workspace/${workspaceId}/page/${item.pageId}`;

                return (
                  <Link
                    key={item.id}
                    href={href}
                    onClick={() => handleMarkSingleRead(item.id)}
                    className={cn(
                      "block px-4 py-3 hover:bg-surface-container-highest transition-colors",
                      !item.isRead ? "bg-primary/5" : "opacity-80"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-on-surface">
                        <MessageSquare
                          className="w-3.5 h-3.5 text-primary shrink-0"
                          aria-hidden="true"
                        />
                        <span>{item.authorName}</span>
                      </span>
                      {!item.isRead && (
                        <span
                          className="w-2 h-2 rounded-full bg-tertiary mt-1 shrink-0"
                          aria-label="Belum dibaca"
                        />
                      )}
                    </div>
                    <p className="text-xs text-on-surface-variant line-clamp-2 mb-1">
                      {item.content}
                    </p>
                    <span className="text-[11px] font-medium text-primary truncate block">
                      Di halaman: {item.pageTitle}
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
