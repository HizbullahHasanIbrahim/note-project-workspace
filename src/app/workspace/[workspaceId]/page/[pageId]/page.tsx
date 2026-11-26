import React, { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { pages, users, workspaceMembers } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { Clock, Sparkles, User } from "lucide-react";

interface PageViewProps {
  params: Promise<{ workspaceId: string; pageId: string }>;
}

async function AsyncPageView({ params }: PageViewProps) {
  const { workspaceId, pageId } = await params;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect(`/login?redirect=/workspace/${workspaceId}/page/${pageId}`);
  }

  // 1. Ambil detail halaman
  const [page] = await db
    .select({
      id: pages.id,
      title: pages.title,
      icon: pages.icon,
      spaceType: pages.spaceType,
      pageType: pages.pageType,
      createdBy: pages.createdBy,
      createdAt: pages.createdAt,
      updatedAt: pages.updatedAt,
      creatorName: users.fullName,
      creatorEmail: users.email,
    })
    .from(pages)
    .innerJoin(users, eq(pages.createdBy, users.id))
    .where(and(eq(pages.id, pageId), eq(pages.workspaceId, workspaceId)))
    .limit(1);

  if (!page) {
    notFound();
  }

  // 2. Data Guard Anti-IDOR: Halaman private hanya dapat dibuka oleh pembuatnya!
  if (page.spaceType === "private" && page.createdBy !== currentUser.id) {
    notFound();
  }

  // 3. Cek peran pengguna di workspace
  const [membership] = await db
    .select()
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, currentUser.id)
      )
    )
    .limit(1);

  const isReadOnly = membership?.role === "viewer";

  return (
    <div className="w-full max-w-[840px] mx-auto py-10 px-8 flex flex-col gap-8">
      {/* Header Halaman Dokumen */}
      <div className="flex flex-col gap-3">
        <div className="text-4xl">{page.icon || "📄"}</div>
        <h1 className="font-[family-name:var(--font-jakarta)] text-display-small text-on-surface font-bold tracking-tight">
          {page.title}
        </h1>
        <div className="flex items-center gap-3 text-xs text-on-surface-variant font-medium">
          <span className="flex items-center gap-1">
            <User className="w-3.5 h-3.5" /> Dibuat oleh{" "}
            <strong className="text-on-surface">{page.creatorName}</strong>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />{" "}
            {new Date(page.updatedAt).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
          <span>•</span>
          <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-semibold capitalize">
            {page.spaceType === "private" ? "Catatan Privat" : "Shared Teamspace"}
          </span>
          {isReadOnly && (
            <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-[11px] font-semibold">
              Read-Only
            </span>
          )}
        </div>
      </div>

      {/* Blok Callout Material You */}
      <div className="p-4 rounded-2xl bg-surface-container border-l-4 border-primary flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="flex flex-col gap-1 text-xs">
          <span className="font-semibold text-on-surface text-sm">
            Area Editor Kolaboratif
          </span>
          <p className="text-on-surface-variant leading-relaxed">
            Halaman ini terhubung ke sinkronisasi biner CRDT Yjs. Anda dapat mengetik, menambahkan checklist, dan menautkan kartu tugas secara relasional.
          </p>
        </div>
      </div>

      {/* Blok Paragraf */}
      <div className="flex flex-col gap-3">
        <h2 className="font-[family-name:var(--font-jakarta)] text-headline-small text-on-surface font-semibold">
          Spesifikasi Dokumen
        </h2>
        <p className="text-body-large text-on-surface leading-relaxed">
          Dokumen ini tersimpan secara relasional di tabel MySQL `pages` serta mendukung proyeksi teks terindeks ke tabel `page_blocks` untuk pencarian instan Cmd+K.
        </p>
      </div>
    </div>
  );
}

export default function PageView({ params }: PageViewProps) {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-[840px] mx-auto py-10 px-8 text-sm text-on-surface-variant">
          Memuat halaman...
        </div>
      }
    >
      <AsyncPageView params={params} />
    </Suspense>
  );
}
