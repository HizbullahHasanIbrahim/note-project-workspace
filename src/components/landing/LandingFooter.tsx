import Link from "next/link";
import { Sparkles, Shield, Cpu, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export function LandingFooter() {
  return (
    <footer className="w-full pt-12 pb-16 border-t border-outline-variant/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Banner CTA Penutup (M3 Big Rounded Card) */}
        <div className="rounded-[28px] bg-primary-container text-on-primary-container p-8 sm:p-14 mb-16 shadow-lg">
          <div className="max-w-3xl">
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-on-primary-container/10 text-on-primary-container text-label-medium font-semibold mb-5">
              <Sparkles className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
              <span>Mulai dalam 30 detik</span>
            </div>

            <h2 className="text-headline-medium sm:text-display-small font-bold text-on-primary-container tracking-tight">
              Mulai bangun ruang kerja tim Anda hari ini
            </h2>
            <p className="mt-4 text-body-large text-on-primary-container/85 leading-relaxed max-w-2xl">
              Gratis penuh untuk tim 2 hingga 20 anggota. Tanpa kartu kredit, tanpa masa percobaan terkunci,
              dan siap digunakan untuk menyatukan dokumentasi serta eksekusi tugas.
            </p>

            {/* Tombol Aksi */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/register"
                className={cn(
                  "min-h-[48px] px-8 rounded-full bg-primary text-on-primary font-bold text-label-large",
                  "hover:bg-primary/90 transition-all motion-reduce:transition-none flex items-center justify-center shadow-xs cursor-pointer",
                  "focus-visible:ring-2 focus-visible:ring-outline outline-none"
                )}
              >
                Buat Ruang Kerja Pertama
              </Link>
              <Link
                href="/login"
                className={cn(
                  "min-h-[48px] px-8 rounded-full border border-on-primary-container/40 text-on-primary-container font-bold text-label-large",
                  "hover:bg-on-primary-container/10 transition-all motion-reduce:transition-none flex items-center justify-center cursor-pointer",
                  "focus-visible:ring-2 focus-visible:ring-outline outline-none"
                )}
              >
                Masuk ke Akun
              </Link>
            </div>

            {/* Chips Kesiapan Sistem */}
            <div className="mt-8 pt-8 border-t border-on-primary-container/15 flex flex-wrap gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-on-primary-container/10 text-on-primary-container text-label-small font-semibold">
                <Cpu className="w-3 h-3 text-primary" aria-hidden="true" />
                <span>Kolaborasi CRDT &lt; 200ms</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-on-primary-container/10 text-on-primary-container text-label-small font-semibold">
                <Shield className="w-3 h-3 text-primary" aria-hidden="true" />
                <span>Isolasi Anti-IDOR</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-on-primary-container/10 text-on-primary-container text-label-small font-semibold">
                <Users className="w-3 h-3 text-primary" aria-hidden="true" />
                <span>Kapasitas 20 Anggota</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-on-primary-container/10 text-on-primary-container text-label-small font-semibold">
                <Sparkles className="w-3 h-3 text-primary" aria-hidden="true" />
                <span>100% Bebas Biaya MVP</span>
              </span>
            </div>
          </div>
        </div>

        {/* Baris Navigasi & Identitas Footer */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-12 border-b border-outline-variant/30">
          {/* Brand */}
          <div className="md:col-span-5">
            <Link
              href="/"
              className="flex items-center gap-2.5 focus-visible:ring-2 focus-visible:ring-outline rounded-lg outline-none w-fit"
            >
              <div className="w-9 h-9 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-xs">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="stroke-current"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="3" y="3" width="18" height="18" rx="4" />
                  <line x1="8" y1="8" x2="16" y2="8" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                  <line x1="8" y1="16" x2="12" y2="16" />
                </svg>
              </div>
              <span className="text-title-medium font-bold text-on-surface">
                Note &amp; Project Workspace
              </span>
            </Link>
            <p className="mt-3 text-body-medium text-on-surface-variant max-w-sm leading-relaxed">
              Ruang kerja kolaboratif terpadu untuk dokumen, papan tugas, dan koordinasi tim beranggotakan 2 hingga 20 orang.
            </p>
          </div>

          {/* Navigasi Tautan */}
          <div className="md:col-span-4">
            <div className="text-label-large font-bold text-on-surface mb-3">
              Navigasi Halaman
            </div>
            <ul className="space-y-2 text-body-medium text-on-surface-variant">
              <li>
                <a
                  href="#alur-kerja"
                  className="hover:text-primary transition-colors motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-outline rounded outline-none"
                >
                  Alur Kerja 4 Langkah
                </a>
              </li>
              <li>
                <a
                  href="#fitur-utama"
                  className="hover:text-primary transition-colors motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-outline rounded outline-none"
                >
                  5 Pilar Utama MVP
                </a>
              </li>
              <li>
                <a
                  href="#perbandingan"
                  className="hover:text-primary transition-colors motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-outline rounded outline-none"
                >
                  Perbandingan Sistem
                </a>
              </li>
              <li>
                <a
                  href="#spesifikasi-mvp"
                  className="hover:text-primary transition-colors motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-outline rounded outline-none"
                >
                  Spesifikasi &amp; Kapasitas
                </a>
              </li>
            </ul>
          </div>

          {/* Autentikasi */}
          <div className="md:col-span-3">
            <div className="text-label-large font-bold text-on-surface mb-3">
              Akses Pengguna
            </div>
            <ul className="space-y-2 text-body-medium text-on-surface-variant">
              <li>
                <Link
                  href="/login"
                  className="hover:text-primary transition-colors motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-outline rounded outline-none"
                >
                  Masuk ke Ruang Kerja
                </Link>
              </li>
              <li>
                <Link
                  href="/register"
                  className="hover:text-primary transition-colors motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-outline rounded outline-none"
                >
                  Daftar Akun Baru
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Hak Cipta & Status Sistem */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p className="text-body-small text-on-surface-variant">
            Hak Cipta 2026 Note &amp; Project Workspace. Sesuai panduan Material Design 3.
          </p>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container text-on-surface-variant text-label-small font-mono">
            <span className="w-2 h-2 rounded-full bg-primary" aria-hidden="true" />
            <span>Status Sistem: MVP v1.0 Siap Pakai</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
