"use client";

import React, { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  AlertCircle,
  Bell,
  CheckSquare,
  ChevronDown,
  FileText,
  FolderLock,
  HardDrive,
  Menu,
  PanelLeftOpen,
  Plus,
  Search,
  Settings,
  Users,
  X,
} from "lucide-react";
import { useWorkspaceUIStore } from "@/stores/useWorkspaceUIStore";
import {
  canAccessPrivateSpace,
  canEditTeamspace,
  WorkspaceRole,
} from "@/lib/permissions";
import { createPageAction } from "@/app/workspace/[workspaceId]/page-actions";
import { formatBytesCompact } from "@/lib/attachments";
import { NestedPageTree, type NestedPageItem } from "./NestedPageTree";
import { cn } from "@/lib/utils";

export type NavDrawerPageItem = NestedPageItem;

interface NavDrawerProps {
  workspaceId: string;
  workspaceName: string;
  currentMemberCount: number;
  maxMembers: number;
  storageUsedBytes: number;
  storageLimitBytes: number;
  userRole: WorkspaceRole;
  currentUserId: string;
  teamspacePages: NestedPageItem[];
  privatePages: NestedPageItem[];
  unreadMentionsCount?: number;
}

export function NavDrawer({
  workspaceId,
  workspaceName,
  currentMemberCount,
  maxMembers,
  storageUsedBytes,
  storageLimitBytes,
  userRole,
  currentUserId,
  teamspacePages,
  privatePages,
  unreadMentionsCount = 0,
}: NavDrawerProps) {
  const {
    isSidebarOpen,
    isMobileDrawerOpen,
    setMobileDrawerOpen,
    isCmdKOpen,
    setIsCmdKOpen,
    isSupportingPaneOpen,
    setSupportingPaneOpen,
    activeSupportingTab,
    setActiveSupportingTab,
  } = useWorkspaceUIStore();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [treeError, setTreeError] = useState<string | null>(null);

  const canEdit = canEditTeamspace(userRole);
  const canPrivate = canAccessPrivateSpace(userRole);
  const isAdmin = userRole === "admin";

  const storagePct = Math.min(
    100,
    Math.round((storageUsedBytes / Math.max(1, storageLimitBytes)) * 100)
  );

  // Cari halaman Task Database pertama untuk tombol navigasi cepat Tasks di Mobile/Rail
  const firstDatabasePage =
    teamspacePages.find((p) => p.pageType === "database") ||
    privatePages.find((p) => p.pageType === "database") ||
    null;

  // Tutup modal drawer otomatis saat rute berpindah pada Mobile/Tablet
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [pathname, setMobileDrawerOpen]);

  // Tutup modal drawer dengan tombol Escape
  useEffect(() => {
    if (!isMobileDrawerOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMobileDrawerOpen, setMobileDrawerOpen]);

  const handleCreateRootPage = (spaceType: "teamspace" | "private") => {
    setTreeError(null);
    startTransition(async () => {
      const res = await createPageAction({
        workspaceId,
        parentPageId: null,
        spaceType,
        title:
          spaceType === "private" ? "Catatan Privat Baru" : "Halaman Baru",
        icon: spaceType === "private" ? "🔒" : "📄",
      });
      if (res.error) {
        setTreeError(res.error);
        return;
      }
      if (res.pageId) {
        setMobileDrawerOpen(false);
        router.push(`/workspace/${workspaceId}/page/${res.pageId}`);
        router.refresh();
      }
    });
  };

  const renderDrawerInner = (isOverlay: boolean) => (
    <div className="h-full flex flex-col justify-between">
      {/* Bagian Atas: Workspace Switcher, Tutup Overlay & Cmd+K */}
      <div className="flex flex-col gap-3 p-3">
        <div className="flex items-center gap-2">
          <Link
            href={`/workspace/${workspaceId}/settings`}
            aria-label="Pengaturan dan info ruang kerja"
            className={cn(
              "flex-1 min-w-0 min-h-[44px] px-3 py-2 rounded-xl flex items-center justify-between",
              "bg-surface-container hover:bg-surface-container-high transition-colors",
              "text-on-surface focus-visible:ring-2 focus-visible:ring-outline outline-none"
            )}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary font-semibold text-sm shrink-0">
                {workspaceName.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col items-start truncate text-left">
                <span className="font-[family-name:var(--font-jakarta)] text-sm font-semibold text-on-surface truncate">
                  {workspaceName}
                </span>
                <span className="text-[11px] text-on-surface-variant font-medium">
                  {currentMemberCount} dari {maxMembers} Anggota
                </span>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-on-surface-variant shrink-0" />
          </Link>

          {isOverlay && (
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(false)}
              aria-label="Tutup laci navigasi"
              className="min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-highest cursor-pointer focus-visible:ring-2 focus-visible:ring-outline outline-none"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Quick Command (Cmd+K) Stadium Pill */}
        <button
          type="button"
          onClick={() => {
            setMobileDrawerOpen(false);
            setIsCmdKOpen(true);
          }}
          aria-label="Cari dokumen atau tugas dengan pintasan Command K"
          className={cn(
            "w-full min-h-[44px] px-3.5 py-2 rounded-full flex items-center justify-between",
            "bg-surface-container-highest hover:brightness-95 transition-all",
            "text-on-surface-variant text-label-medium focus-visible:ring-2 focus-visible:ring-outline outline-none cursor-pointer"
          )}
        >
          <span className="flex items-center gap-2 truncate">
            <Search className="w-4 h-4 text-on-surface-variant" />
            <span className="text-xs">Pencarian cepat...</span>
          </span>
          <kbd className="font-[family-name:var(--font-mono)] text-[11px] px-1.5 py-0.5 rounded-md bg-surface-container text-on-surface-variant">
            ⌘K
          </kbd>
        </button>

        {treeError && (
          <div
            role="alert"
            className="p-2.5 rounded-xl bg-error-container text-on-error-container text-[11px] flex items-start gap-1.5"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-error" />
            <span className="flex-1">{treeError}</span>
          </div>
        )}
      </div>

      {/* Bagian Tengah: Pohon Navigasi Bersarang Shared & Private Space */}
      <div className="flex-1 overflow-y-auto px-3 py-1 flex flex-col gap-5">
        {/* Shared Teamspace */}
        <div>
          <div className="flex items-center justify-between px-2 py-1 mb-1">
            <span className="text-label-medium text-on-surface-variant font-semibold">
              Shared Teamspace
            </span>
            {canEdit && (
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleCreateRootPage("teamspace")}
                aria-label="Tambah halaman baru di Shared Teamspace"
                className={cn(
                  "min-w-[44px] min-h-[44px] -mr-2 rounded-full flex items-center justify-center",
                  "hover:bg-surface-container-highest text-on-surface-variant transition-colors cursor-pointer",
                  "focus-visible:ring-2 focus-visible:ring-outline outline-none"
                )}
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>

          <NestedPageTree
            workspaceId={workspaceId}
            spaceType="teamspace"
            pages={teamspacePages}
            currentUserId={currentUserId}
            canEdit={canEdit}
            isAdmin={isAdmin}
            onError={setTreeError}
          />
        </div>

        {/* Private Space (Terisolasi per pengguna aktif / Anti-IDOR) */}
        {canPrivate && (
          <div>
            <div className="flex items-center justify-between px-2 py-1 mb-1">
              <span className="text-label-medium text-on-surface-variant font-semibold flex items-center gap-1.5">
                <FolderLock className="w-3.5 h-3.5" />
                Private Space
              </span>
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleCreateRootPage("private")}
                aria-label="Tambah catatan pribadi baru"
                className={cn(
                  "min-w-[44px] min-h-[44px] -mr-2 rounded-full flex items-center justify-center",
                  "hover:bg-surface-container-highest text-on-surface-variant transition-colors cursor-pointer",
                  "focus-visible:ring-2 focus-visible:ring-outline outline-none"
                )}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <NestedPageTree
              workspaceId={workspaceId}
              spaceType="private"
              pages={privatePages}
              currentUserId={currentUserId}
              canEdit={canEdit}
              isAdmin={isAdmin}
              onError={setTreeError}
            />
          </div>
        )}
      </div>

      {/* Bagian Bawah: Kuota Workspace & Pengaturan */}
      <div className="p-3 border-t border-outline-variant/30 flex flex-col gap-2">
        <div className="p-3 rounded-xl bg-surface-container flex flex-col gap-2 text-xs">
          <div className="flex items-center justify-between text-on-surface-variant font-medium">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> Anggota
            </span>
            <span>
              {currentMemberCount} / {maxMembers}
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
            <div
              className="h-full bg-primary rounded-full"
              style={{
                width: `${Math.min(100, (currentMemberCount / maxMembers) * 100)}%`,
              }}
            />
          </div>

          <div className="flex items-center justify-between text-on-surface-variant font-medium pt-1">
            <span className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5" /> Kuota 1 GB
            </span>
            <span>
              {formatBytesCompact(storageUsedBytes)} /{" "}
              {formatBytesCompact(storageLimitBytes)}
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full",
                storagePct >= 90 ? "bg-error" : "bg-secondary"
              )}
              style={{ width: `${Math.max(4, storagePct)}%` }}
            />
          </div>
        </div>

        <Link
          href={`/workspace/${workspaceId}/settings`}
          className={cn(
            "min-h-[44px] px-3.5 py-2 rounded-xl flex items-center gap-2.5",
            "text-on-surface hover:bg-surface-container transition-colors",
            "text-label-large focus-visible:ring-2 focus-visible:ring-outline outline-none"
          )}
        >
          <Settings className="w-4 h-4 text-on-surface-variant" />
          <span>Pengaturan Ruang Kerja</span>
        </Link>
      </div>
    </div>
  );

  const isPagesActive =
    isMobileDrawerOpen || pathname.includes(`/workspace/${workspaceId}/page/`);
  const isTasksActive = pathname.includes(`/workspace/${workspaceId}/database/`);
  const isMentionsActive =
    isSupportingPaneOpen && activeSupportingTab === "comments";

  return (
    <>
      {/* 1. Desktop Navigation Drawer (>= 1024px) */}
      {isSidebarOpen && (
        <aside
          aria-label="Navigasi Utama Workspace"
          className={cn(
            "hidden lg:flex w-[272px] shrink-0 h-full flex-col",
            "bg-surface-container-low border-r border-outline-variant/30 select-none",
            "transition-all duration-200"
          )}
        >
          {renderDrawerInner(false)}
        </aside>
      )}

      {/* 2. Tablet M3 Navigation Rail (768px - 1023px sesuai SDD §4.3) */}
      <aside
        aria-label="Rel Navigasi Tablet"
        className="hidden md:flex lg:hidden w-20 shrink-0 h-full flex-col items-center justify-between py-3 bg-surface-container-low border-r border-outline-variant/30 select-none"
      >
        <div className="flex flex-col items-center gap-3 w-full">
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            aria-label="Buka drawer navigasi halaman"
            className="w-14 h-11 rounded-full flex items-center justify-center hover:bg-surface-container-high text-on-surface cursor-pointer focus-visible:ring-2 focus-visible:ring-outline outline-none"
          >
            <PanelLeftOpen className="w-5 h-5" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => setIsCmdKOpen(true)}
            aria-label="Pencarian cepat Cmd+K"
            className="w-14 h-11 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant hover:text-on-surface cursor-pointer focus-visible:ring-2 focus-visible:ring-outline outline-none"
          >
            <Search className="w-5 h-5" aria-hidden="true" />
          </button>

          {canEdit && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleCreateRootPage("teamspace")}
              aria-label="Buat halaman cepat di Teamspace"
              className="w-14 h-14 rounded-2xl bg-primary-container text-on-primary-container flex items-center justify-center hover:brightness-95 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-outline outline-none"
            >
              <Plus className="w-5 h-5" aria-hidden="true" />
            </button>
          )}

          <div className="w-full px-2 pt-2 flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Daftar halaman"
              className="flex flex-col items-center gap-1 cursor-pointer group"
            >
              <span
                className={cn(
                  "w-14 h-8 rounded-full flex items-center justify-center transition-colors",
                  isPagesActive
                    ? "bg-secondary-container text-on-secondary-container"
                    : "text-on-surface-variant group-hover:bg-surface-container-high"
                )}
              >
                <FileText className="w-4 h-4" aria-hidden="true" />
              </span>
              <span className="text-[11px] font-medium text-on-surface-variant">
                Halaman
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (firstDatabasePage) {
                  router.push(
                    `/workspace/${workspaceId}/database/${firstDatabasePage.id}`
                  );
                } else {
                  setMobileDrawerOpen(true);
                }
              }}
              aria-label="Buka database tugas"
              className="flex flex-col items-center gap-1 cursor-pointer group"
            >
              <span
                className={cn(
                  "w-14 h-8 rounded-full flex items-center justify-center transition-colors",
                  isTasksActive
                    ? "bg-secondary-container text-on-secondary-container"
                    : "text-on-surface-variant group-hover:bg-surface-container-high"
                )}
              >
                <CheckSquare className="w-4 h-4" aria-hidden="true" />
              </span>
              <span className="text-[11px] font-medium text-on-surface-variant">
                Tugas
              </span>
            </button>
          </div>
        </div>

        <Link
          href={`/workspace/${workspaceId}/settings`}
          aria-label="Pengaturan ruang kerja"
          className="w-12 h-12 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface focus-visible:ring-2 focus-visible:ring-outline outline-none"
        >
          <Settings className="w-5 h-5" aria-hidden="true" />
        </Link>
      </aside>

      {/* 3. Modal Navigation Drawer untuk Tablet & Mobile (< 1024px) */}
      {isMobileDrawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-scrim/40 flex lg:hidden"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setMobileDrawerOpen(false);
            }
          }}
        >
          <aside
            aria-label="Laci Navigasi Mobile"
            className="w-[288px] max-w-[85vw] h-full bg-surface-container-low border-r border-outline-variant/40 shadow-2xl select-none"
          >
            {renderDrawerInner(true)}
          </aside>
        </div>
      )}

      {/* 4. Mobile M3 Bottom Navigation Bar (< 768px sesuai SDD §4.3) */}
      <nav
        aria-label="Navigasi Bawah Mobile"
        className="fixed bottom-0 inset-x-0 z-30 h-20 pb-[env(safe-area-inset-bottom)] md:hidden bg-surface-container border-t border-outline-variant/40 grid grid-cols-4 items-center px-2 select-none"
      >
        <button
          type="button"
          onClick={() => setMobileDrawerOpen(true)}
          aria-label="Halaman dan Pohon Navigasi"
          className="min-h-[48px] flex flex-col items-center justify-center gap-1 cursor-pointer"
        >
          <span
            className={cn(
              "w-16 h-8 rounded-full flex items-center justify-center transition-colors",
              isPagesActive
                ? "bg-secondary-container text-on-secondary-container"
                : "text-on-surface-variant"
            )}
          >
            <Menu className="w-5 h-5" aria-hidden="true" />
          </span>
          <span className="text-[11px] font-medium text-on-surface">Pages</span>
        </button>

        <button
          type="button"
          onClick={() => setIsCmdKOpen(true)}
          aria-label="Pencarian cepat Cmd+K"
          className="min-h-[48px] flex flex-col items-center justify-center gap-1 cursor-pointer"
        >
          <span
            className={cn(
              "w-16 h-8 rounded-full flex items-center justify-center transition-colors",
              isCmdKOpen
                ? "bg-secondary-container text-on-secondary-container"
                : "text-on-surface-variant"
            )}
          >
            <Search className="w-5 h-5" aria-hidden="true" />
          </span>
          <span className="text-[11px] font-medium text-on-surface">
            Search
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (firstDatabasePage) {
              router.push(
                `/workspace/${workspaceId}/database/${firstDatabasePage.id}`
              );
            } else {
              setMobileDrawerOpen(true);
            }
          }}
          aria-label="Papan Tugas"
          className="min-h-[48px] flex flex-col items-center justify-center gap-1 cursor-pointer"
        >
          <span
            className={cn(
              "w-16 h-8 rounded-full flex items-center justify-center transition-colors",
              isTasksActive
                ? "bg-secondary-container text-on-secondary-container"
                : "text-on-surface-variant"
            )}
          >
            <CheckSquare className="w-5 h-5" aria-hidden="true" />
          </span>
          <span className="text-[11px] font-medium text-on-surface">Tasks</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveSupportingTab("comments");
            setSupportingPaneOpen(true);
          }}
          aria-label="Komentar dan Sebutan (@mention)"
          className="min-h-[48px] flex flex-col items-center justify-center gap-1 cursor-pointer relative"
        >
          <span
            className={cn(
              "w-16 h-8 rounded-full flex items-center justify-center transition-colors relative",
              isMentionsActive
                ? "bg-secondary-container text-on-secondary-container"
                : "text-on-surface-variant"
            )}
          >
            <Bell className="w-5 h-5" aria-hidden="true" />
            {unreadMentionsCount > 0 && (
              <span className="absolute -top-0.5 right-3 min-w-[16px] h-4 px-1 rounded-full bg-tertiary text-on-tertiary text-[10px] font-bold flex items-center justify-center">
                {unreadMentionsCount > 9 ? "9+" : unreadMentionsCount}
              </span>
            )}
          </span>
          <span className="text-[11px] font-medium text-on-surface">
            Mentions
          </span>
        </button>
      </nav>
    </>
  );
}
