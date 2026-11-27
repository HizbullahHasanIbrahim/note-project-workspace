"use client";

import dynamic from "next/dynamic";
import type { CollaborativeEditorProps } from "./CollaborativeEditorInner";

// Muat BlockNote secara dinamis tanpa SSR untuk mencegah hydration mismatch (SDD.md §6.2)
const CollaborativeEditor = dynamic<CollaborativeEditorProps>(
  () => import("./CollaborativeEditorInner"),
  {
    ssr: false,
    loading: () => (
      <div
        aria-busy="true"
        aria-label="Memuat editor kolaboratif"
        className="w-full min-h-[360px] rounded-2xl bg-surface-container animate-pulse p-6 flex flex-col gap-3"
      >
        <div className="h-6 w-2/3 rounded-lg bg-surface-container-high" />
        <div className="h-4 w-full rounded-lg bg-surface-container-high" />
        <div className="h-4 w-5/6 rounded-lg bg-surface-container-high" />
      </div>
    ),
  }
);

export default CollaborativeEditor;
