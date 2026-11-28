"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, Moon, Sun, X } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "#alur-kerja", label: "Alur Kerja" },
  { href: "#fitur-utama", label: "Fitur Utama" },
  { href: "#perbandingan", label: "Perbandingan" },
  { href: "#spesifikasi-mvp", label: "Spesifikasi MVP" },
];

export function LandingNavbar() {
  const [isDark, setIsDark] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (typeof document !== "undefined") {
      const isDarkMode = document.documentElement.classList.contains("dark");
      setIsDark(isDarkMode);
    }
  }, []);

  const toggleTheme = () => {
    if (typeof document === "undefined") return;
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <header className="sticky top-0 z-40 h-20 px-4 sm:px-8 lg:px-12 flex items-center justify-between border-b border-outline-variant/40 bg-surface/90 backdrop-blur-md select-none transition-colors motion-reduce:transition-none">
      {/* Brand & Logo Geometris Kustom M3 */}
      <Link
        href="/"
        className="flex items-center gap-3 min-w-0 focus-visible:ring-2 focus-visible:ring-outline outline-none rounded-xl"
        aria-label="Note & Project Workspace Beranda"
      >
        <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-on-primary shadow-xs shrink-0">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5"
            aria-hidden="true"
          >
            <rect
              x="3"
              y="3"
              width="8"
              height="8"
              rx="2.5"
              className="fill-on-primary"
            />
            <rect
              x="13"
              y="3"
              width="8"
              height="8"
              rx="2.5"
              className="fill-on-primary/60"
            />
            <rect
              x="3"
              y="13"
              width="8"
              height="8"
              rx="2.5"
              className="fill-on-primary/60"
            />
            <rect
              x="13"
              y="13"
              width="8"
              height="8"
              rx="2.5"
              className="fill-on-primary"
            />
          </svg>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-[family-name:var(--font-jakarta)] text-title-medium font-bold text-on-surface tracking-tight truncate">
            Note &amp; Project
          </span>
          <span className="text-[11px] text-on-surface-variant font-medium -mt-1 hidden sm:inline">
            Workspace Tim 2–20 Orang
          </span>
        </div>
      </Link>

      {/* Navigasi Desktop */}
      <nav
        aria-label="Navigasi Halaman Utama"
        className="hidden md:flex items-center gap-1 text-label-large text-on-surface-variant"
      >
        {NAV_LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="min-h-[44px] px-4 rounded-full inline-flex items-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-outline outline-none"
          >
            {link.label}
          </a>
        ))}
      </nav>

      {/* Kontrol Aksi: Theme Switcher & Auth */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Pengalih Tema M3 */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={
            isDark
              ? "Alihkan ke Tema Terang Material You"
              : "Alihkan ke Tema Gelap Material You"
          }
          className="min-w-[44px] min-h-[44px] rounded-full border border-outline-variant bg-surface-container-low text-on-surface hover:bg-surface-container-high transition-all motion-reduce:transition-none flex items-center justify-center focus-visible:ring-2 focus-visible:ring-outline outline-none cursor-pointer"
        >
          {isDark ? (
            <Sun className="w-5 h-5 text-primary" aria-hidden="true" />
          ) : (
            <Moon className="w-5 h-5 text-primary" aria-hidden="true" />
          )}
        </button>

        {/* Tombol Masuk */}
        <Link
          href="/login"
          className={cn(
            "hidden sm:inline-flex min-h-[44px] px-5 rounded-full border border-outline text-primary text-label-large font-semibold items-center justify-center",
            "hover:bg-primary/8 transition-all motion-reduce:transition-none active:scale-95 focus-visible:ring-2 focus-visible:ring-outline outline-none"
          )}
        >
          Masuk
        </Link>

        {/* Tombol Buat Workspace */}
        <Link
          href="/register"
          className={cn(
            "min-h-[44px] px-5 sm:px-6 rounded-full bg-primary text-on-primary text-label-large font-semibold inline-flex items-center justify-center",
            "hover:bg-primary/90 transition-all motion-reduce:transition-none active:scale-95 focus-visible:ring-2 focus-visible:ring-outline outline-none shadow-xs"
          )}
        >
          Buat Workspace
        </Link>

        {/* Tombol Menu Mobile (< 768px) */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label={mobileMenuOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
          aria-expanded={mobileMenuOpen}
          className="md:hidden min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-outline outline-none cursor-pointer"
        >
          {mobileMenuOpen ? (
            <X className="w-5 h-5" aria-hidden="true" />
          ) : (
            <Menu className="w-5 h-5" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Menu Overlay Mobile */}
      {mobileMenuOpen && (
        <div className="absolute top-20 inset-x-0 bg-surface-container-low border-b border-outline-variant/40 shadow-xl p-6 flex flex-col gap-4 md:hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <nav aria-label="Menu Mobile" className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="min-h-[44px] px-4 rounded-xl flex items-center text-label-large font-semibold text-on-surface hover:bg-surface-container-high transition-colors motion-reduce:transition-none"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="pt-3 border-t border-outline-variant/30 flex flex-col gap-2">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="min-h-[44px] px-4 rounded-full border border-outline text-primary text-label-large font-semibold flex items-center justify-center hover:bg-primary/8 transition-colors motion-reduce:transition-none"
            >
              Masuk ke Akun
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
