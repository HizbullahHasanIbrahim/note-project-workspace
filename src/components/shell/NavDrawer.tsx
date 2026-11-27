"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FolderLock,
  Plus,
  Search,
  Settings,
  Users,
  HardDrive,
  ChevronDown,
  AlertCircle,
} from "lucide-react";
import { useWorkspaceUIStore } from "@/stores/useWorkspaceUIStore";
import {
  canEditTeamspace,
  canAccessPrivateSpace,
  WorkspaceRole,
} from "@/lib/permissions";
import { createPageAction } from "@/app/workspace/[workspaceId]/page-actions";
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
}: NavDrawerProps) {
  const { isSidebarOpen, setIsCmdKOpen } = useWorkspaceUIStore();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [treeError, setTreeError] = useState<string | null>(null);

  if (!isSidebarOpen) return null;

  const canEdit = canEditTeamspace(userRole);
  const canPrivate = canAccessPrivateSpace(userRole);
  const isAdmin = userRole === "admin";

  const storageUsedMB = (storageUsedBytes / (1024 * 1024)).toFixed(0);
  const storageLimitGB = (storageLimitBytes / (1024 * 1024 * 1024)).toFixed(0);
  const storagePct = Math.min(
    100,
    Math.round((storageUsedBytes / storageLimitBytes) * 100)
  );

  const handleCreateRootPage = (spaceType: "teamspace" | "private") => {
    setTreeError(null);
    startTransition(async () => {
      const res = await createPageAction({
        workspaceId,
        parentPageId: null,
        spaceType,
        title:
          spaceType === "private"
            ? "Catatan Privat Baru"
            : "Halaman Baru",
        icon: spaceType === "private" ? "🔒" : "📄",
      });
      if (res.error) {
        setTreeError(res.error);
        return;
      }
      if (res.pageId) {
        router.push(`/workspace/${workspaceId}/page/${res.pageId}`);
        router.refresh();
      }
    });
  };

  return (
    <aside
      aria-label="Navigasi Utama Workspace"
      className={cn(
        "w-[272px] shrink-0 h-full flex flex-col justify-between",
        "bg-surface-container-low border-r border-outline-variant/30 select-none",
        "transition-all duration-200"
      )}
    >
      {/* Bagian Atas: Workspace Switcher & Cmd+K */}
      <div className="flex flex-col gap-3 p-3">
        <Link
          href={`/workspace/${workspaceId}/settings`}
          aria-label="Pengaturan dan info ruang kerja"
          className={cn(
            "w-full min-h-[44px] px-3 py-2 rounded-xl flex items-center justify-between",
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

        {/* Quick Command (Cmd+K) Stadium Pill */}
        <button
          type="button"
          onClick={() => setIsCmdKOpen(true)}
          aria-label="Cari dokumen atau tugas dengan pintasan Command K"
          className={cn(
            "w-full min-h-[44px] px-3.5 py-2 rounded-full flex items-center justify-between",
            "bg-surface-container-highest hover:brightness-95 transition-all",
            "text-on-surface-variant text-label-medium focus-visible:ring-2 focus-visible:ring-outline outline-none"
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
                  "hover:bg-surface-container-highest text-on-surface-variant transition-colors",
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
                  "hover:bg-surface-container-highest text-on-surface-variant transition-colors",
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
              {storageUsedMB} MB / {storageLimitGB} GB
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
            <div
              className="h-full bg-secondary rounded-full"
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
    </aside>
  );
}
