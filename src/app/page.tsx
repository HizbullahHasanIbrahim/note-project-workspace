import Link from "next/link";
import { Sparkles, Users, Cpu, Shield, Gift, ArrowDown } from "lucide-react";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { LandingHeroSandbox } from "@/components/landing/LandingHeroSandbox";
import { LandingWorkflow } from "@/components/landing/LandingWorkflow";
import { LandingFeatureExplorer } from "@/components/landing/LandingFeatureExplorer";
import { LandingComparison } from "@/components/landing/LandingComparison";
import { LandingOpenSpecs } from "@/components/landing/LandingOpenSpecs";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { cn } from "@/lib/utils";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface selection:bg-primary-container selection:text-on-primary-container">
      {/* Navbar M3 */}
      <LandingNavbar />

      <main className="flex-1 flex flex-col">
        {/* Hero Section: Editorial & Above-the-Fold Calibrated for 1440x900 */}
        <section
          aria-labelledby="hero-heading"
          className="w-full pt-8 sm:pt-12 lg:pt-14 pb-12 sm:pb-16 overflow-hidden"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
            {/* Header Badge: Kontekstual & Tenang */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary-container text-on-secondary-container text-label-medium font-semibold mb-5 shadow-xs">
              <Sparkles className="w-4 h-4 text-primary" aria-hidden="true" />
              <span>Ruang kerja kolaboratif dokumen dan manajemen tugas</span>
            </div>

            {/* Judul Utama Hero dengan Text-Balance */}
            <h1
              id="hero-heading"
              className="text-display-small sm:text-5xl lg:text-[3.5rem] lg:leading-[4.125rem] font-bold text-on-surface tracking-tight max-w-4xl mx-auto text-balance"
            >
              Satu ruang kerja terpadu untuk dokumen, tugas, dan koordinasi tim
            </h1>

            {/* Paragraf Penjelas (Line length <= 65ch dengan text-pretty) */}
            <p className="mt-5 text-body-large sm:text-title-large text-on-surface-variant max-w-[65ch] mx-auto leading-relaxed text-pretty">
              Hilangkan friksi antara notulensi rapat dan papan tugas. Tulis draf privat dengan proteksi anti-IDOR,
              kolaborasi real-time dengan CRDT Yjs, dan pantau progres dalam satu sistem desain Material You yang tenang.
            </p>

            {/* Tombol Aksi Utama M3 Pill (Min Touch Target 48px) */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/register"
                className={cn(
                  "min-h-[48px] px-8 rounded-full bg-primary text-on-primary font-bold text-label-large",
                  "hover:bg-primary/90 transition-all motion-reduce:transition-none flex items-center justify-center shadow-xs cursor-pointer",
                  "focus-visible:ring-2 focus-visible:ring-outline outline-none active:scale-98"
                )}
              >
                Mulai Gratis untuk Tim
              </Link>
              <a
                href="#demo-sandbox"
                className={cn(
                  "min-h-[48px] px-8 rounded-full border border-outline text-on-surface font-semibold text-label-large",
                  "hover:bg-surface-container transition-all motion-reduce:transition-none flex items-center justify-center gap-2 cursor-pointer",
                  "focus-visible:ring-2 focus-visible:ring-outline outline-none active:scale-98"
                )}
              >
                <span>Jelajahi Demo Langsung</span>
                <ArrowDown className="w-4 h-4 text-on-surface-variant" aria-hidden="true" />
              </a>
            </div>

            {/* Live Workspace Sandbox (Terlihat Above-the-Fold pada Desktop 1440x900) */}
            <div id="demo-sandbox" className="w-full mt-10 sm:mt-12 scroll-mt-24">
              {/* Trust Bar Terintegrasi */}
              <div className="mb-3.5 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-label-small font-medium text-on-surface-variant">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container border border-outline-variant/40">
                  <Users className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                  <span>Kapasitas 2–20 anggota</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container border border-outline-variant/40">
                  <Cpu className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                  <span>CRDT WebSocket &lt; 200ms</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container border border-outline-variant/40">
                  <Shield className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                  <span>Isolasi Anti-IDOR</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container border border-outline-variant/40">
                  <Gift className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                  <span>100% Gratis Tanpa Kartu Kredit</span>
                </span>
              </div>

              <LandingHeroSandbox />
            </div>
          </div>
        </section>

        {/* 4-Langkah Alur Kerja Terpadu */}
        <LandingWorkflow />

        {/* 5 Pilar Utama MVP: List-Detail Explorer */}
        <LandingFeatureExplorer />

        {/* Perbandingan: Terpisah vs Terpadu */}
        <LandingComparison />

        {/* Spesifikasi Teknis & Batasan Arsitektur Transparan */}
        <LandingOpenSpecs />
      </main>

      {/* Banner CTA Penutup & Footer M3 */}
      <LandingFooter />
    </div>
  );
}
