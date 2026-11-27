"use client";

import React, { useTransition } from "react";
import {
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Sun,
  Moon,
  Share2,
  LogOut,
  ChevronRight,
  Eye,
  WifiOff,
} from "lucide-react";
import { useWorkspaceUIStore } from "@/stores/useWorkspaceUIStore";
import { WorkspaceRole } from "@/lib/permissions";
import { logoutAction } from "@/app/(auth)/actions";
import {
  MentionsPopover,
  type UnreadMentionItem,
} from "@/components/shell/MentionsPopover";
import { cn } from "@/lib/utils";

interface TopbarProps {
  workspaceId: string;
  userName: string;
  userRole: WorkspaceRole;
  pageTitle?: string;
  mentions?: UnreadMentionItem[];
}

export function Topbar({
  workspaceId,
  userName,
  userRole,
  pageTitle = "Dokumen Utama",
  mentions = [],
}: TopbarProps) {
  const {
    isSidebarOpen,
    toggleSidebar,
    isSupportingPaneOpen,
    toggleSupportingPane,
    isDarkMode,
    toggleTheme,
    collabStatus,
    liveCollaborators,
    activePageTitle,
  } = useWorkspaceUIStore();

  const [isLoggingOut, startLogout] = useTransition();

  const displayedTitle = activePageTitle ?? pageTitle;
  const displayedCollaborators =
    liveCollaborators.length > 0
      ? liveCollaborators
      : [{ clientId: 0, name: userName, colorToken: "primary" as const }];

  return (
    <header
      aria-label="Bilah Menu Atas (Topbar)"
      data-workspace-id={workspaceId}
      className={cn(
        "h-14 shrink-0 px-4 flex items-center justify-between",
        "bg-surface border-b border-outline-variant/30 select-none z-10"
      )}
    >
      {/* Sisi Kiri: Buka/Tutup Sidebar & Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={
            isSidebarOpen
              ? "Tutup bilah sisi navigasi"
              : "Buka bilah sisi navigasi"
          }
          className={cn(
            "min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center",
            "hover:bg-surface-container-high text-on-surface transition-colors",
            "focus-visible:ring-2 focus-visible:ring-outline outline-none"
          )}
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="w-5 h-5" />
          ) : (
            <PanelLeftOpen className="w-5 h-5" />
          )}
        </button>

        {/* Breadcrumbs */}
        <nav
          aria-label="Jejak Navigasi"
          className="flex items-center gap-1.5 text-label-medium text-on-surface-variant truncate"
        >
          <span className="truncate">Workspace</span>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          <span className="text-on-surface font-semibold truncate">
            {displayedTitle}
          </span>
        </nav>

        {/* Badge Read-Only khusus Peran Viewer (PRD §3.4 & §4.1 US-02) */}
        {userRole === "viewer" && (
          <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-xs font-semibold flex items-center gap-1 border border-outline-variant/40 shrink-0">
            <Eye className="w-3.5 h-3.5 text-primary" />
            <span>Read-Only</span>
          </span>
        )}
      </div>

      {/* Sisi Kanan: Status Sinkronisasi, Live Presence, Tema, & Pane Switcher */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Status Sinkronisasi Pill (SDD.md §4.1: Saved / Syncing... / Offline) */}
        <div
          role="status"
          aria-label="Status sinkronisasi real-time"
          className={cn(
            "min-h-[32px] px-3 py-1 rounded-full flex items-center gap-1.5 font-medium text-xs border transition-colors",
            collabStatus === "offline"
              ? "bg-error-container text-on-error-container border-error/30"
              : "bg-surface-container text-primary border-outline-variant/20"
          )}
        >
          {collabStatus === "offline" ? (
            <>
              <WifiOff className="w-3.5 h-3.5 text-error" />
              <span>Offline — Menyambung ulang</span>
            </>
          ) : collabStatus === "syncing" ? (
            <>
              <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
              <span>Menyinkronkan...</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span>Tersimpan</span>
            </>
          )}
        </div>

        {/* Live Presence Avatars */}
        <div
          aria-label="Kolaborator aktif di dokumen ini"
          className="flex items-center -space-x-1.5 pl-1"
        >
          {displayedCollaborators.slice(0, 4).map((collab) => (
            <div
              key={`${collab.clientId}-${collab.name}`}
              title={collab.name}
              className={cn(
                "w-7 h-7 rounded-full font-semibold text-xs flex items-center justify-center ring-2 ring-surface cursor-default",
                collab.colorToken === "tertiary"
                  ? "bg-tertiary text-on-tertiary"
                  : collab.colorToken === "secondary"
                    ? "bg-secondary text-on-secondary"
                    : "bg-primary text-on-primary"
              )}
            >
              {collab.name.charAt(0).toUpperCase()}
            </div>
          ))}
        </div>

        {/* Notifikasi Mention */}
        <MentionsPopover workspaceId={workspaceId} mentions={mentions} />

        {/* Switcher Mode Gelap / Terang */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={isDarkMode ? "Alihkan ke tema terang" : "Alihkan ke tema gelap"}
          className={cn(
            "min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center",
            "hover:bg-surface-container-high text-on-surface transition-colors",
            "focus-visible:ring-2 focus-visible:ring-outline outline-none"
          )}
        >
          {isDarkMode ? (
            <Sun className="w-5 h-5 text-primary" />
          ) : (
            <Moon className="w-5 h-5 text-on-surface" />
          )}
        </button>

        {/* Tombol Bagikan CTA (Hanya untuk Admin dan Member) */}
        {userRole !== "viewer" && (
          <button
            type="button"
            aria-label="Bagikan halaman ini ke anggota tim"
            className={cn(
              "min-h-[40px] px-4 rounded-full flex items-center gap-1.5",
              "bg-primary text-on-primary text-label-large font-semibold",
              "hover:brightness-95 transition-all focus-visible:ring-2 focus-visible:ring-outline outline-none"
            )}
          >
            <Share2 className="w-4 h-4" />
            <span>Bagikan</span>
          </button>
        )}

        {/* Buka/Tutup Supporting Pane */}
        <button
          type="button"
          onClick={toggleSupportingPane}
          aria-label={
            isSupportingPaneOpen
              ? "Tutup panel pendukung kanan"
              : "Buka panel pendukung kanan"
          }
          className={cn(
            "min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center",
            "hover:bg-surface-container-high text-on-surface transition-colors",
            "focus-visible:ring-2 focus-visible:ring-outline outline-none"
          )}
        >
          {isSupportingPaneOpen ? (
            <PanelRightClose className="w-5 h-5" />
          ) : (
            <PanelRightOpen className="w-5 h-5" />
          )}
        </button>

        {/* Tombol Logout */}
        <button
          type="button"
          disabled={isLoggingOut}
          onClick={() => startLogout(() => logoutAction())}
          title="Keluar dari akun"
          aria-label="Keluar dari akun"
          className={cn(
            "min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center",
            "hover:bg-error-container text-on-surface hover:text-error transition-colors",
            "focus-visible:ring-2 focus-visible:ring-outline outline-none"
          )}
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
