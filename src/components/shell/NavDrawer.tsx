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
import { useFocusTrap } from "@/lib/use-focus-trap";
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
    sidebarWidth,
    setSidebarWidth,
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
  const [isResizing, setIsResizing] = useState(false);
  const mobileDrawerRef = useFocusTrap<HTMLElement>(isMobileDrawerOpen, {
    onEscape: () => setMobileDrawerOpen(false),
  });

  // Muat lebar sidebar tersimpan dari localStorage saat pertama kali dimuat
  useEffect(() => {
    try {
      const saved = localStorage.getItem("note_workspace_sidebar_width");
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 240 && parsed <= 520) {
          setSidebarWidth(parsed);
        }
      }
    } catch {
      // Abaikan jika localStorage tidak tersedia
    }
  }, [setSidebarWidth]);

  // Handler interaksi resize lebar sidebar
  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const newWidth = Math.min(520, Math.max(240, startWidth + delta));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      setIsResizing(false);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.removeProperty("cursor");
      document.body.style.removeProperty("user-select");

      const delta = upEvent.clientX - startX;
      const finalWidth = Math.min(520, Math.max(240, startWidth + delta));
      setSidebarWidth(finalWidth);
      try {
        localStorage.setItem("note_workspace_sidebar_width", String(finalWidth));
      } catch {
        // Abaikan jika quota error
      }
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const resetSidebarWidth = () => {
    setSidebarWidth(280);
    try {
      localStorage.setItem("note_workspace_sidebar_width", "280");
    } catch {
      // Abaikan
    }
  };

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
              "flex-1 min-w-0 min-h-[48px] px-3 py-2 rounded-xl flex items-center justify-between",
              "bg-surface-container hover:bg-surface-container-high transition-colors",
              "text-on-surface focus-visible:ring-2 focus-visible:ring-outline outline-none border border-outline-variant/30"
            )}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-sm shrink-0 shadow-xs">
                {workspaceName.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col items-start min-w-0 flex-1 text-left">
                <span
                  title={workspaceName}
                  className="font-[family-name:var(--font-jakarta)] text-sm font-bold text-on-surface break-words leading-snug w-full line-clamp-2"
                >
                  {workspaceName}
                </span>
                <span className="text-[11px] text-on-surface-variant font-medium mt-0.5">
                  {currentMemberCount} dari {maxMembers} Anggota
                </span>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-on-surface-variant shrink-0 ml-1" />
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
            "w-full min-h-[40px] px-3.5 py-2 rounded-xl flex items-center justify-between",
            "bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 transition-colors",
            "text-on-surface text-label-medium focus-visible:ring-2 focus-visible:ring-outline outline-none cursor-pointer"
          )}
        >
          <span className="flex items-center gap-2 min-w-0">
            <Search className="w-4 h-4 text-primary shrink-0" />
            <span className="text-xs font-medium text-on-surface">Pencarian cepat...</span>
          </span>
          <kbd className="font-[family-name:var(--font-mono)] text-[11px] font-semibold px-2 py-0.5 rounded-md bg-surface-container-highest text-on-surface border border-outline-variant/30 shrink-0">
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
          <div className="flex items-center justify-between px-2 py-1 mb-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs font-bold text-on-surface tracking-wide">
                Ruang Tim
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-semibold">
                Publik
              </span>
            </div>
            {canEdit && (
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleCreateRootPage("teamspace")}
                title="Tambah halaman baru di Ruang Tim"
                aria-label="Tambah halaman baru di Ruang Tim"
                className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                  "hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer",
                  "focus-visible:ring-2 focus-visible:ring-outline outline-none"
                )}
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>

          <NestedPageTree
            dndId={`dnd-tree-teamspace-${isOverlay ? "mobile" : "desktop"}`}
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
            <div className="flex items-center justify-between px-2 py-1 mb-1.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <FolderLock className="w-3.5 h-3.5 text-tertiary shrink-0" />
                <span className="text-xs font-bold text-on-surface tracking-wide">
                  Ruang Privat
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-tertiary-container text-on-tertiary-container font-semibold">
                  Hanya Anda
                </span>
              </div>
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleCreateRootPage("private")}
                title="Tambah catatan pribadi baru"
                aria-label="Tambah catatan pribadi baru"
                className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                  "hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer",
                  "focus-visible:ring-2 focus-visible:ring-outline outline-none"
                )}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <NestedPageTree
              dndId={`dnd-tree-private-${isOverlay ? "mobile" : "desktop"}`}
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
      <div className="p-3 border-t border-outline-variant/30 flex flex-col gap-2.5">
        <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/30 flex flex-col gap-2.5 text-xs">
          <div className="flex items-center justify-between font-medium">
            <span className="flex items-center gap-1.5 text-on-surface-variant">
              <Users className="w-3.5 h-3.5 text-primary" /> Anggota Tim
            </span>
            <span className="font-mono font-bold text-on-surface text-[11px]">
              {currentMemberCount} / {maxMembers}
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, (currentMemberCount / maxMembers) * 100)}%`,
              }}
            />
          </div>

          <div className="flex items-center justify-between font-medium pt-1">
            <span className="flex items-center gap-1.5 text-on-surface-variant">
              <HardDrive className="w-3.5 h-3.5 text-primary" /> Kuota Penyimpanan
            </span>
            <span className="font-mono font-bold text-on-surface text-[11px]">
              {formatBytesCompact(storageUsedBytes)} /{" "}
              {formatBytesCompact(storageLimitBytes)}
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300",
                storagePct >= 90 ? "bg-error" : "bg-primary"
              )}
              style={{ width: `${Math.max(4, storagePct)}%` }}
            />
          </div>
        </div>

        <Link
          href={`/workspace/${workspaceId}/settings`}
          className={cn(
            "min-h-[40px] px-3.5 py-2 rounded-xl flex items-center gap-2.5",
            "text-on-surface hover:bg-surface-container transition-colors",
            "text-label-large font-medium focus-visible:ring-2 focus-visible:ring-outline outline-none"
          )}
        >
          <Settings className="w-4 h-4 text-on-surface-variant shrink-0" />
          <span className="text-xs font-semibold text-on-surface truncate">Pengaturan Ruang Kerja</span>
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
      {/* 1. Desktop Navigation Drawer (>= 1024px) yang dapat di-resize */}
      {isSidebarOpen && (
        <aside
          aria-label="Navigasi Utama Workspace"
          style={{ width: `${sidebarWidth}px` }}
          className={cn(
            "hidden lg:flex shrink-0 h-full flex-col relative",
            "bg-surface-container-low border-r border-outline-variant/30 select-none",
            isResizing ? "transition-none select-none" : "transition-[width] duration-150 ease-out"
          )}
        >
          {renderDrawerInner(false)}

          {/* Pegangan Drag untuk Mengubah Ukuran Sidebar */}
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Ubah lebar bilah samping"
            aria-valuenow={sidebarWidth}
            aria-valuemin={240}
            aria-valuemax={520}
            tabIndex={0}
            onMouseDown={startResizing}
            onDoubleClick={resetSidebarWidth}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") {
                const next = Math.max(240, sidebarWidth - 16);
                setSidebarWidth(next);
                try {
                  localStorage.setItem("note_workspace_sidebar_width", String(next));
                } catch {
                  // ignore
                }
              } else if (e.key === "ArrowRight") {
                const next = Math.min(520, sidebarWidth + 16);
                setSidebarWidth(next);
                try {
                  localStorage.setItem("note_workspace_sidebar_width", String(next));
                } catch {
                  // ignore
                }
              } else if (e.key === "Enter" || e.key === " ") {
                resetSidebarWidth();
              }
            }}
            title="Tarik untuk mengubah lebar bilah samping (klik ganda untuk reset 280px)"
            className={cn(
              "absolute top-0 right-0 -mr-1.5 w-3 h-full cursor-col-resize z-20 group flex items-center justify-center outline-none",
              "hover:bg-transparent"
            )}
          >
            {/* Indikator Garis Tonal saat Hover / Drag */}
            <div
              className={cn(
                "w-0.5 h-full rounded-full transition-all duration-150",
                isResizing
                  ? "bg-primary w-1 opacity-100"
                  : "bg-transparent group-hover:bg-outline-variant group-hover:w-1 group-focus-visible:bg-primary group-focus-visible:w-1"
              )}
            />
          </div>
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
            ref={mobileDrawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Laci Navigasi Mobile"
            className="w-[300px] max-w-[85vw] h-full bg-surface-container-low border-r border-outline-variant/40 shadow-2xl select-none"
          >
            {renderDrawerInner(true)}
          </aside>
        </div>
      )}

      {/* 4. Mobile M3 Bottom Navigation Bar (< 768px sesuai SDD §4.3) */}
      <nav
        aria-label="Navigasi Bawah Mobile"
        className="fixed bottom-0 inset-x-0 z-30 min-h-20 pb-[env(safe-area-inset-bottom)] md:hidden bg-surface-container border-t border-outline-variant/40 grid grid-cols-4 items-center px-2 select-none"
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
