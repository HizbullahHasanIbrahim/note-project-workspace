import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, Layout, Database, Users } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-surface text-on-surface">
      {/* Top Navbar */}
      <header className="h-16 px-8 flex items-center justify-between border-b border-outline-variant/30">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-base">
            NW
          </div>
          <span className="font-[family-name:var(--font-jakarta)] text-lg font-bold text-on-surface tracking-tight">
            Note & Project Workspace
          </span>
        </div>

        <Link
          href="/workspace/demo"
          className="min-h-[44px] px-5 rounded-full bg-primary text-on-primary text-label-large font-semibold flex items-center gap-2 hover:brightness-95 transition-all focus-visible:ring-2 focus-visible:ring-outline outline-none"
        >
          <span>Buka Workspace Demo</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-4xl mx-auto px-6 py-20 flex flex-col items-center text-center gap-8 justify-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-semibold">
          <Sparkles className="w-4 h-4 text-primary" />
          <span>Material You (M3) • Real-Time Collaborative Workspace</span>
        </div>

        <h1 className="font-[family-name:var(--font-jakarta)] text-4xl sm:text-5xl font-extrabold text-on-surface tracking-tight leading-tight">
          Menyatukan Dokumen & Pelacakan Tugas dalam Satu Ruang Kerja Ringan
        </h1>

        <p className="text-body-large text-on-surface-variant max-w-2xl leading-relaxed text-base sm:text-lg">
          Dirancang khusus untuk tim kecil & startup (2–20 anggota). Hilangkan fragmentasi informasi antara catatan meeting dan papan eksekusi sprint dengan sistem tonal Material You yang tenang dan responsif.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
          <Link
            href="/workspace/demo"
            className="w-full sm:w-auto min-h-[48px] px-8 rounded-full bg-primary text-on-primary text-label-large font-semibold flex items-center justify-center gap-2 hover:brightness-95 transition-all shadow-md focus-visible:ring-2 focus-visible:ring-outline outline-none"
          >
            <span>Eksplorasi App Shell 3-Pane</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 3 Fitur Pilar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-12 text-left w-full">
          <div className="p-5 rounded-2xl bg-surface-container border border-outline-variant/30 flex flex-col gap-2">
            <Layout className="w-6 h-6 text-primary" />
            <h2 className="font-semibold text-on-surface text-sm">
              3-Pane Adaptive Shell
            </h2>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              NavDrawer, Main Canvas, dan Supporting Pane dengan kurva motion resmi M3.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-surface-container border border-outline-variant/30 flex flex-col gap-2">
            <Database className="w-6 h-6 text-primary" />
            <h2 className="font-semibold text-on-surface text-sm">
              Skema Relasional MySQL
            </h2>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              11 tabel Drizzle ORM dengan dukungan CRDT binary state dan fractional indexing.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-surface-container border border-outline-variant/30 flex flex-col gap-2">
            <Users className="w-6 h-6 text-primary" />
            <h2 className="font-semibold text-on-surface text-sm">
              Matriks RBAC 3 Peran
            </h2>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Isolasi Shared Teamspace, Private Space, dan mitigasi IDOR bawaan.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-14 px-8 flex items-center justify-center border-t border-outline-variant/30 text-xs text-on-surface-variant">
        <span>© 2026 Note & Project Workspace • Material Design 3 (M3)</span>
      </footer>
    </div>
  );
}
