import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Database,
  History,
  Lock,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react";
import { LandingShowcase } from "@/components/landing/LandingShowcase";

const PRODUCT_PILLARS = [
  {
    title: "Real-Time CRDT Block Editor",
    desc: "Susun spesifikasi, notulensi rapat, checklist, dan blok kode bersama rekan tim dengan live cursor tanpa konflik.",
    Icon: Sparkles,
  },
  {
    title: "Task Database Multi-View",
    desc: "Kelola tugas sprint lewat tampilan Kanban, Table, dan Calendar serta tautkan langsung ke dokumen Meeting Notes.",
    Icon: Database,
  },
  {
    title: "Isolasi Private Space & RBAC",
    desc: "Pisahkan draf pribadi dari Shared Teamspace dengan 3 peran Admin, Member, dan Viewer serta perlindungan anti-IDOR.",
    Icon: Lock,
  },
  {
    title: "Quick Command (Cmd+K)",
    desc: "Temukan judul halaman, isi blok dokumen, hingga kartu tugas lintas workspace dalam hitungan milidetik.",
    Icon: Search,
  },
  {
    title: "Lampiran Aman 10 MB & Kuota 1 GB",
    desc: "Validasi magic bytes ketat (anti-XSS SVG/HTML) dengan kunci transaksi kuota penyimpanan per workspace.",
    Icon: Upload,
  },
  {
    title: "Version History & Komentar Blok",
    desc: "Simpan dan pulihkan snapshot riwayat dokumen kapan saja, lengkap dengan utas komentar dan notifikasi @mention.",
    Icon: History,
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-surface text-on-surface">
      {/* Navbar Utama */}
      <header className="sticky top-0 z-20 h-16 px-4 sm:px-8 flex items-center justify-between border-b border-outline-variant/30 bg-surface/95 backdrop-blur">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-sm shrink-0">
            NW
          </div>
          <span className="font-[family-name:var(--font-jakarta)] text-base sm:text-lg font-bold text-on-surface tracking-tight truncate">
            Note &amp; Project Workspace
          </span>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/login"
            className="min-h-[44px] px-4 rounded-full border border-outline text-primary text-sm font-semibold inline-flex items-center justify-center hover:bg-primary/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-outline"
          >
            Masuk
          </Link>
          <Link
            href="/register"
            className="min-h-[44px] px-5 rounded-full bg-primary text-on-primary text-sm font-semibold inline-flex items-center gap-1.5 hover:brightness-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-outline"
          >
            <span>Mulai Gratis</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>
      </header>

      {/* Hero & Showcase Interaktif */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-12 sm:py-16 flex flex-col items-center gap-14">
        <section className="max-w-4xl flex flex-col items-center text-center gap-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-primary" aria-hidden="true" />
            <span>Gratis untuk Tim Kecil 2–20 Anggota · Material You M3</span>
          </div>

          <h1 className="font-[family-name:var(--font-jakarta)] text-3xl sm:text-5xl font-extrabold text-on-surface tracking-tight leading-tight">
            Satukan Dokumen Kolaboratif dan Eksekusi Sprint dalam Satu Ruang Kerja
          </h1>

          <p className="text-on-surface-variant max-w-2xl leading-relaxed text-base sm:text-lg">
            Hentikan informasi yang tercecer antara catatan rapat dan papan
            tugas. Tulis spesifikasi bersama secara real-time, tautkan ke kartu
            Kanban, dan temukan konteks proyek dalam sekejap lewat Cmd+K.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 w-full sm:w-auto">
            <Link
              href="/register"
              className="w-full sm:w-auto min-h-[48px] px-8 rounded-full bg-primary text-on-primary text-sm font-semibold inline-flex items-center justify-center gap-2 hover:brightness-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-outline"
            >
              <span>Buat Workspace Gratis</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>

            <Link
              href="/login"
              className="w-full sm:w-auto min-h-[48px] px-7 rounded-full bg-secondary-container text-on-secondary-container text-sm font-semibold inline-flex items-center justify-center hover:brightness-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-outline"
            >
              <span>Masuk ke Akun Tim</span>
            </Link>
          </div>
        </section>

        {/* Pratinjau Interaktif 3-Pane + Kanban */}
        <LandingShowcase />

        {/* Ringkasan Kapabilitas Tim Kecil */}
        <section
          aria-label="Ringkasan Fitur Utama Tim Kecil"
          className="w-full flex flex-col gap-6"
        >
          <div className="flex flex-col gap-1 text-center">
            <h2 className="font-[family-name:var(--font-jakarta)] text-2xl sm:text-3xl font-bold text-on-surface">
              Dirancang Khusus untuk Tim 2–20 Orang
            </h2>
            <p className="text-sm text-on-surface-variant">
              Ringan, aman terhadap kebocoran akses, dan responsif di desktop,
              tablet, maupun browser ponsel.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-left">
            {PRODUCT_PILLARS.map(({ title, desc, Icon }) => (
              <div
                key={title}
                className="p-5 rounded-2xl bg-surface-container border border-outline-variant/40 flex flex-col gap-2.5"
              >
                <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center">
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </div>
                <h3 className="font-semibold text-on-surface text-sm">
                  {title}
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-5 px-6 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-outline-variant/30 text-xs text-on-surface-variant max-w-6xl w-full mx-auto">
        <span>© 2026 Note &amp; Project Workspace · Material Design 3</span>
        <div className="flex items-center gap-4">
          <Link href="/login" className="hover:text-primary transition-colors">
            Masuk
          </Link>
          <Link
            href="/register"
            className="hover:text-primary transition-colors"
          >
            Daftar Workspace
          </Link>
        </div>
      </footer>
    </div>
  );
}
