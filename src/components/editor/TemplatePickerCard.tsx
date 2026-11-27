"use client";

import React from "react";
import type { PartialBlock } from "@blocknote/core";
import {
  Rocket,
  LayoutGrid,
  FileText,
  BookOpen,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type StarterTemplateId =
  | "project_brief"
  | "sprint_tracker"
  | "meeting_notes"
  | "sop_wiki";

interface TemplatePickerCardProps {
  onSelectTemplate: (templateId: StarterTemplateId) => void;
  onDismiss: () => void;
  isApplying?: boolean;
}

const TEMPLATE_ITEMS: Array<{
  id: StarterTemplateId;
  title: string;
  description: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: "project_brief",
    title: "Project Brief",
    description:
      "Latar belakang, tujuan terukur, lingkup MVP, serta tabel milestone rilis.",
    badge: "Dokumen",
    icon: Rocket,
  },
  {
    id: "sprint_tracker",
    title: "Sprint Tracker",
    description:
      "Ringkasan sprint aktif beserta pembuatan sub-database tugas Kanban otomatis.",
    badge: "Dokumen + Sub-DB",
    icon: LayoutGrid,
  },
  {
    id: "meeting_notes",
    title: "Meeting Notes",
    description:
      "Agenda rapat, peserta hadir, poin keputusan kunci, dan checklist tindak lanjut.",
    badge: "Dokumen",
    icon: FileText,
  },
  {
    id: "sop_wiki",
    title: "SOP / Wiki",
    description:
      "Prosedur operasional standar langkah demi langkah lengkap dengan blok kode.",
    badge: "Panduan",
    icon: BookOpen,
  },
];

/**
 * Menghasilkan blok awal terstruktur dengan ID unik untuk tiap Starter Template
 */
export function buildStarterTemplateBlocks(
  templateId: StarterTemplateId,
  options?: { workspaceId?: string; subDatabaseId?: string }
): { title: string; icon: string; blocks: PartialBlock[] } {
  const uid = () =>
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  switch (templateId) {
    case "project_brief":
      return {
        title: "Project Brief & Spesifikasi",
        icon: "🚀",
        blocks: [
          {
            id: uid(),
            type: "heading",
            props: { level: 2 },
            content: "1. Latar Belakang & Masalah",
          },
          {
            id: uid(),
            type: "paragraph",
            content:
              "Jelaskan konteks masalah pengguna dan mengapa inisiatif ini penting dikerjakan pada siklus sekarang.",
          },
          {
            id: uid(),
            type: "heading",
            props: { level: 2 },
            content: "2. Target Keberhasilan (KPI)",
          },
          {
            id: uid(),
            type: "checkListItem",
            props: { checked: false },
            content: "Validasi spesifikasi produk bersama tim engineering & desain",
          },
          {
            id: uid(),
            type: "checkListItem",
            props: { checked: false },
            content: "Rilis MVP ke pengguna awal tanpa regresi kritikal",
          },
          {
            id: uid(),
            type: "heading",
            props: { level: 2 },
            content: "3. Jadwal Milestone",
          },
          {
            id: uid(),
            type: "table",
            content: {
              type: "tableContent",
              rows: [
                { cells: ["Fase", "Target Selesai", "Penanggung Jawab"] },
                { cells: ["Perancangan & Desain", "Minggu 1", "Product Lead"] },
                { cells: ["Implementasi & QA", "Minggu 2–3", "Engineering"] },
              ],
            },
          },
        ],
      };

    case "sprint_tracker": {
      const dbHref =
        options?.workspaceId && options?.subDatabaseId
          ? `/workspace/${options.workspaceId}/database/${options.subDatabaseId}`
          : null;

      return {
        title: "Sprint Tracker & Eksekusi",
        icon: "📊",
        blocks: [
          {
            id: uid(),
            type: "heading",
            props: { level: 2 },
            content: "Sasaran Sprint Aktif",
          },
          {
            id: uid(),
            type: "paragraph",
            content: dbHref
              ? [
                  {
                    type: "text",
                    text: "Sub-database papan tugas telah dibuat otomatis: ",
                    styles: {},
                  },
                  {
                    type: "link",
                    href: dbHref,
                    content: "Buka Sprint Tracker Board",
                  },
                ]
              : "Kelola daftar kartu tugas sprint dan pantau progres tim dari To Do hingga Done.",
          },
          {
            id: uid(),
            type: "heading",
            props: { level: 2 },
            content: "Checklist Kesiapan Sprint",
          },
          {
            id: uid(),
            type: "checkListItem",
            props: { checked: true },
            content: "Tentukan prioritas kartu tugas pada Sprint Tracker Board",
          },
          {
            id: uid(),
            type: "checkListItem",
            props: { checked: false },
            content: "Tautkan catatan meeting terkait ke properti kartu tugas",
          },
        ],
      };
    }

    case "meeting_notes":
      return {
        title: "Catatan Rapat Mingguan",
        icon: "📝",
        blocks: [
          {
            id: uid(),
            type: "heading",
            props: { level: 2 },
            content: "Informasi Rapat",
          },
          {
            id: uid(),
            type: "paragraph",
            content: "Peserta: Raka Pratama, Nadia Kusuma • Agenda: Sinkronisasi Sprint",
          },
          {
            id: uid(),
            type: "heading",
            props: { level: 2 },
            content: "Poin Diskusi & Keputusan",
          },
          {
            id: uid(),
            type: "bulletListItem",
            content: "Keputusan 1: Gunakan arsitektur dual-state CRDT dan proyeksi SQL.",
          },
          {
            id: uid(),
            type: "bulletListItem",
            content: "Keputusan 2: Batasi kedalaman halaman maksimal 5 tingkat.",
          },
          {
            id: uid(),
            type: "heading",
            props: { level: 2 },
            content: "Tindak Lanjut (Action Items)",
          },
          {
            id: uid(),
            type: "checkListItem",
            props: { checked: false },
            content: "Buat kartu tugas tindak lanjut di Sprint Tracker",
          },
        ],
      };

    case "sop_wiki":
      return {
        title: "SOP & Panduan Kerja Tim",
        icon: "📚",
        blocks: [
          {
            id: uid(),
            type: "heading",
            props: { level: 2 },
            content: "Tujuan & Ruang Lingkup",
          },
          {
            id: uid(),
            type: "paragraph",
            content:
              "Panduan standar ini menjelaskan alur kerja tim untuk menjaga konsistensi kualitas dan keamanan.",
          },
          {
            id: uid(),
            type: "heading",
            props: { level: 2 },
            content: "Langkah Pelaksanaan",
          },
          {
            id: uid(),
            type: "numberedListItem",
            content: "Verifikasi kebutuhan dan batasan pada dokumen Project Brief.",
          },
          {
            id: uid(),
            type: "numberedListItem",
            content: "Jalankan pemeriksaan type-check sebelum melakukan merge.",
          },
          {
            id: uid(),
            type: "codeBlock",
            props: { language: "bash" },
            content: "npx tsc --noEmit && npm run build",
          },
        ],
      };
  }
}

export function TemplatePickerCard({
  onSelectTemplate,
  onDismiss,
  isApplying = false,
}: TemplatePickerCardProps) {
  return (
    <section
      aria-label="Pilihan Template Awal Dokumen"
      className="p-5 rounded-2xl bg-surface-container border border-outline-variant/40 flex flex-col gap-4 my-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <h2 className="font-[family-name:var(--font-jakarta)] text-title-medium text-on-surface font-semibold">
              Mulai cepat dengan Starter Template
            </h2>
            <p className="text-body-medium text-on-surface-variant text-xs">
              Halaman ini masih kosong. Pilih struktur standar tim atau ketik langsung di bawah.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          disabled={isApplying}
          aria-label="Tutup pilihan template"
          className={cn(
            "min-w-[44px] min-h-[44px] -mt-1 -mr-1 rounded-full flex items-center justify-center",
            "text-on-surface-variant hover:bg-surface-container-highest transition-colors",
            "focus-visible:ring-2 focus-visible:ring-outline outline-none"
          )}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {TEMPLATE_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              disabled={isApplying}
              onClick={() => onSelectTemplate(item.id)}
              className={cn(
                "p-4 rounded-2xl bg-card-surface border border-outline-variant/40 text-left",
                "hover:bg-surface-container-high hover:border-primary/50 transition-all",
                "flex flex-col gap-2 focus-visible:ring-2 focus-visible:ring-outline outline-none",
                "disabled:opacity-60 disabled:cursor-wait"
              )}
            >
              <div className="flex items-center justify-between gap-2 w-full">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-primary shrink-0" />
                  <span className="font-[family-name:var(--font-jakarta)] text-sm font-semibold text-on-surface">
                    {item.title}
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-medium">
                  {item.badge}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {item.description}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
