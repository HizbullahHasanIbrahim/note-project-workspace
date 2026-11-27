"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Clock, User } from "lucide-react";
import { updatePageMetaAction } from "@/app/workspace/[workspaceId]/page-actions";
import { useWorkspaceUIStore } from "@/stores/useWorkspaceUIStore";
import { cn } from "@/lib/utils";

interface PageTitleHeaderProps {
  workspaceId: string;
  pageId: string;
  initialTitle: string;
  initialIcon: string | null;
  spaceType: "teamspace" | "private";
  creatorName: string;
  updatedAtIso: string;
  isReadOnly: boolean;
}

export function PageTitleHeader({
  workspaceId,
  pageId,
  initialTitle,
  initialIcon,
  spaceType,
  creatorName,
  updatedAtIso,
  isReadOnly,
}: PageTitleHeaderProps) {
  const router = useRouter();
  const { setActivePageTitle } = useWorkspaceUIStore();
  const [title, setTitle] = useState(initialTitle);
  const [isSaving, startSaving] = useTransition();

  const handleSaveTitle = () => {
    const trimmed = title.trim() || "Halaman Tanpa Judul";
    setTitle(trimmed);
    setActivePageTitle(trimmed);
    if (trimmed === initialTitle) return;

    startSaving(async () => {
      await updatePageMetaAction({
        workspaceId,
        pageId,
        title: trimmed,
      });
      router.refresh();
    });
  };

  return (
    <header className="flex flex-col gap-3 pb-4 border-b border-outline-variant/25">
      <div className="text-4xl select-none">{initialIcon || "📄"}</div>

      {isReadOnly ? (
        <h1 className="font-[family-name:var(--font-jakarta)] text-display-small text-on-surface font-bold tracking-tight">
          {title}
        </h1>
      ) : (
        <input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setActivePageTitle(e.target.value);
          }}
          onBlur={handleSaveTitle}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.currentTarget.blur();
            }
          }}
          aria-label="Judul halaman dokumen"
          placeholder="Judul halaman..."
          className={cn(
            "w-full bg-transparent font-[family-name:var(--font-jakarta)] text-display-small",
            "text-on-surface placeholder:text-on-surface-variant font-bold tracking-tight",
            "outline-none focus-visible:ring-2 focus-visible:ring-outline rounded-lg -mx-1 px-1"
          )}
        />
      )}

      <div className="flex flex-wrap items-center gap-3 text-xs text-on-surface-variant font-medium">
        <span className="flex items-center gap-1">
          <User className="w-3.5 h-3.5" /> Dibuat oleh{" "}
          <strong className="text-on-surface">{creatorName}</strong>
        </span>
        <span>•</span>
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />{" "}
          {new Date(updatedAtIso).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
        <span>•</span>
        <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-semibold">
          {spaceType === "private" ? "Catatan Privat" : "Shared Teamspace"}
        </span>
        {isReadOnly && (
          <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-[11px] font-semibold">
            Read-Only
          </span>
        )}
        {isSaving && (
          <span className="text-[11px] text-primary">Menyimpan judul...</span>
        )}
      </div>
    </header>
  );
}
