"use client";

import React, { useState, useActionState } from "react";
import {
  Rocket,
  Layout,
  FileText,
  BookOpen,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
  Building2,
} from "lucide-react";
import { createWorkspaceAction } from "./actions";
import { cn } from "@/lib/utils";

const TEMPLATES = [
  {
    id: "project_brief",
    title: "Project Brief",
    icon: Rocket,
    desc: "Spesifikasi target produk, sasaran tim, dan indikator keberhasilan.",
  },
  {
    id: "sprint_tracker",
    title: "Sprint Tracker",
    icon: Layout,
    desc: "Pelacakan alur eksekusi tugas dalam tampilan Table dan Kanban.",
  },
  {
    id: "meeting_notes",
    title: "Meeting Notes",
    icon: FileText,
    desc: "Notulensi rapat mingguan terstruktur lengkap dengan relasi tindakan.",
  },
  {
    id: "sop_wiki",
    title: "SOP / Wiki Tim",
    icon: BookOpen,
    desc: "Panduan proses standar dan dokumentasi teknis terpusat.",
  },
];

export default function OnboardingPage() {
  const [state, formAction, isPending] = useActionState(createWorkspaceAction, null);
  const [selectedTemplate, setSelectedTemplate] = useState("project_brief");

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-surface px-4 py-12">
      <div className="w-full max-w-2xl flex flex-col gap-8">
        {/* Header Onboarding */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-lg shadow-sm">
            NW
          </div>
          <h1 className="font-[family-name:var(--font-jakarta)] text-headline-medium text-on-surface font-bold tracking-tight">
            Inisialisasi Workspace Tim Anda
          </h1>
          <p className="text-body-medium text-on-surface-variant text-sm max-w-md">
            Satu langkah lagi untuk memulai ruang kerja kolaboratif Material You.
          </p>
        </div>

        {/* Kartu Form Onboarding */}
        <div className="p-8 rounded-[28px] bg-card-surface border border-outline-variant/40 shadow-sm flex flex-col gap-6">
          {state?.error && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-error-container text-on-error-container text-xs flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-error" />
              <span>{state.error}</span>
            </div>
          )}

          <form action={formAction} className="flex flex-col gap-6">
            <input type="hidden" name="template" value={selectedTemplate} />

            {/* Nama Ruang Kerja */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="name"
                className="text-label-medium text-on-surface font-semibold"
              >
                Nama Ruang Kerja (Workspace)
              </label>
              <div className="relative flex items-center">
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="Contoh: Acme Studio atau Tim Engineering"
                  className={cn(
                    "w-full min-h-[48px] pl-10 pr-4 rounded-xl bg-surface-container",
                    "text-on-surface placeholder:text-on-surface-variant text-sm",
                    "border border-outline focus:border-2 focus:border-primary outline-none",
                    "focus-visible:ring-2 focus-visible:ring-outline"
                  )}
                />
                <Building2 className="w-4 h-4 text-on-surface-variant absolute left-3.5 pointer-events-none" />
              </div>
            </div>

            {/* Starter Template Picker */}
            <div className="flex flex-col gap-2">
              <label className="text-label-medium text-on-surface font-semibold">
                Pilih Starter Template Awal
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TEMPLATES.map((tmpl) => {
                  const Icon = tmpl.icon;
                  const isSelected = selectedTemplate === tmpl.id;
                  return (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => setSelectedTemplate(tmpl.id)}
                      className={cn(
                        "p-4 rounded-2xl border text-left transition-all flex flex-col gap-2",
                        isSelected
                          ? "bg-secondary-container border-primary text-on-secondary-container shadow-xs"
                          : "bg-surface-container border-outline-variant/40 text-on-surface hover:bg-surface-container-high"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <Icon className={cn("w-5 h-5", isSelected ? "text-primary" : "text-on-surface-variant")} />
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm">{tmpl.title}</span>
                        <span className="text-xs text-on-surface-variant leading-relaxed">
                          {tmpl.desc}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tombol Buat Workspace */}
            <button
              type="submit"
              disabled={isPending}
              className={cn(
                "w-full min-h-[48px] px-6 rounded-full bg-primary text-on-primary",
                "text-label-large font-semibold flex items-center justify-center gap-2",
                "hover:brightness-95 transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-outline outline-none"
              )}
            >
              <span>{isPending ? "Membentuk Ruang Kerja..." : "Buka Ruang Kerja Saya"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
