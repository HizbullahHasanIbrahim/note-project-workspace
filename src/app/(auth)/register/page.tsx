"use client";

import React, { useActionState, useTransition } from "react";
import Link from "next/link";
import { ArrowRight, Lock, Mail, User, AlertCircle } from "lucide-react";
import { registerAction, googleAuthAction } from "../actions";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(registerAction, null);
  const [isGooglePending, startGoogleTransition] = useTransition();

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-surface px-4 py-12">
      <div className="w-full max-w-md flex flex-col gap-6">
        {/* Logo & Judul */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-lg shadow-sm">
            NW
          </div>
          <h1 className="font-[family-name:var(--font-jakarta)] text-headline-medium text-on-surface font-bold tracking-tight">
            Buat Akun Baru
          </h1>
          <p className="text-body-medium text-on-surface-variant text-sm">
            Mulai kolaborasi tim Anda tanpa hambatan biaya pada versi MVP.
          </p>
        </div>

        {/* Kartu Formulir Material You */}
        <div className="p-8 rounded-[28px] bg-card-surface border border-outline-variant/40 shadow-sm flex flex-col gap-5">
          {/* Pesan Error Global */}
          {state?.error && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-error-container text-on-error-container text-xs flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-error" />
              <span>{state.error}</span>
            </div>
          )}

          {/* Tombol Google OAuth */}
          <button
            type="button"
            disabled={isGooglePending}
            onClick={() => {
              startGoogleTransition(() => {
                googleAuthAction();
              });
            }}
            className={cn(
              "w-full min-h-[48px] px-5 rounded-full border border-outline",
              "bg-transparent hover:bg-surface-container text-on-surface text-label-large font-medium",
              "flex items-center justify-center gap-3 transition-colors",
              "focus-visible:ring-2 focus-visible:ring-outline outline-none"
            )}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{isGooglePending ? "Menghubungkan..." : "Daftar dengan Google"}</span>
          </button>

          {/* Garis Pemisah */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-[1px] bg-outline-variant/40" />
            <span className="text-[11px] text-on-surface-variant font-medium uppercase tracking-wider">
              Atau daftar dengan email
            </span>
            <div className="flex-1 h-[1px] bg-outline-variant/40" />
          </div>

          {/* Formulir Pendaftaran */}
          <form action={formAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="fullName"
                className="text-label-medium text-on-surface font-medium"
              >
                Nama Lengkap
              </label>
              <div className="relative flex items-center">
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  placeholder="Raka Pratama"
                  className={cn(
                    "w-full min-h-[48px] pl-10 pr-4 rounded-xl bg-surface-container",
                    "text-on-surface placeholder:text-on-surface-variant text-sm",
                    "border border-outline focus:border-2 focus:border-primary outline-none",
                    "focus-visible:ring-2 focus-visible:ring-outline"
                  )}
                />
                <User className="w-4 h-4 text-on-surface-variant absolute left-3.5 pointer-events-none" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className="text-label-medium text-on-surface font-medium"
              >
                Alamat Email
              </label>
              <div className="relative flex items-center">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="nama@perusahaan.com"
                  className={cn(
                    "w-full min-h-[48px] pl-10 pr-4 rounded-xl bg-surface-container",
                    "text-on-surface placeholder:text-on-surface-variant text-sm",
                    "border border-outline focus:border-2 focus:border-primary outline-none",
                    "focus-visible:ring-2 focus-visible:ring-outline"
                  )}
                />
                <Mail className="w-4 h-4 text-on-surface-variant absolute left-3.5 pointer-events-none" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="password"
                className="text-label-medium text-on-surface font-medium"
              >
                Kata Sandi (Min. 8 karakter)
              </label>
              <div className="relative flex items-center">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  placeholder="••••••••"
                  className={cn(
                    "w-full min-h-[48px] pl-10 pr-4 rounded-xl bg-surface-container",
                    "text-on-surface placeholder:text-on-surface-variant text-sm",
                    "border border-outline focus:border-2 focus:border-primary outline-none",
                    "focus-visible:ring-2 focus-visible:ring-outline"
                  )}
                />
                <Lock className="w-4 h-4 text-on-surface-variant absolute left-3.5 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className={cn(
                "w-full min-h-[48px] mt-2 px-6 rounded-full bg-primary text-on-primary",
                "text-label-large font-semibold flex items-center justify-center gap-2",
                "hover:brightness-95 transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-outline outline-none"
              )}
            >
              <span>{isPending ? "Mendaftarkan..." : "Daftar Akun"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Tautan ke Login */}
        <div className="text-center text-xs text-on-surface-variant">
          Sudah memiliki akun?{" "}
          <Link
            href="/login"
            className="text-primary font-semibold hover:underline"
          >
            Masuk sekarang
          </Link>
        </div>
      </div>
    </div>
  );
}
