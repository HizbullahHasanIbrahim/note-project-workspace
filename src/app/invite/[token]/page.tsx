import React, { Suspense } from "react";
import crypto from "crypto";
import Link from "next/link";
import { and, eq, gt, sql } from "drizzle-orm";
import { db } from "@/db";
import { workspaces, workspaceInvites, workspaceMembers } from "@/db/schema";
import { acceptInviteAction } from "./actions";
import { Users, Building2, AlertCircle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

async function AsyncInvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const now = new Date();

  // Ambil detail undangan dan workspace
  const [invite] = await db
    .select({
      inviteId: workspaceInvites.id,
      defaultRole: workspaceInvites.defaultRole,
      expiresAt: workspaceInvites.expiresAt,
      isRevoked: workspaceInvites.isRevoked,
      workspaceId: workspaces.id,
      workspaceName: workspaces.name,
      maxMembers: workspaces.maxMembers,
    })
    .from(workspaceInvites)
    .innerJoin(workspaces, eq(workspaceInvites.workspaceId, workspaces.id))
    .where(
      and(
        eq(workspaceInvites.tokenHash, tokenHash),
        eq(workspaceInvites.isRevoked, false),
        gt(workspaceInvites.expiresAt, now)
      )
    )
    .limit(1);

  if (!invite) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-surface px-4 py-12">
        <div className="w-full max-w-md p-8 rounded-[28px] bg-card-surface border border-outline-variant/40 shadow-sm flex flex-col items-center text-center gap-4">
          <div className="w-12 h-12 rounded-full bg-error-container text-on-error-container flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-error" />
          </div>
          <h1 className="font-[family-name:var(--font-jakarta)] text-title-large text-on-surface font-bold">
            Tautan Undangan Tidak Berlaku
          </h1>
          <p className="text-body-medium text-on-surface-variant text-sm">
            Tautan undangan ini telah kedaluwarsa, dicabut oleh Admin, atau tidak ditemukan.
          </p>
          <Link
            href="/login"
            className="min-h-[44px] px-6 rounded-full bg-primary text-on-primary text-label-large font-semibold flex items-center justify-center mt-2"
          >
            Kembali ke Halaman Masuk
          </Link>
        </div>
      </div>
    );
  }

  // Cek sisa kuota anggota saat ini
  const [countRows] = (await db.execute(
    sql`SELECT COUNT(*) as memberCount FROM workspace_members WHERE workspace_id = ${invite.workspaceId}`
  )) as unknown as [Array<{ memberCount: number }>];

  const currentMembers = Number(countRows[0]?.memberCount || 0);
  const isFull = currentMembers >= invite.maxMembers;

  async function handleAccept() {
    "use server";
    await acceptInviteAction(token);
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-surface px-4 py-12">
      <div className="w-full max-w-md flex flex-col gap-6">
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-12 h-12 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-lg shadow-sm">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <h1 className="font-[family-name:var(--font-jakarta)] text-headline-medium text-on-surface font-bold tracking-tight">
            Undangan Bergabung
          </h1>
          <p className="text-body-medium text-on-surface-variant text-sm">
            Anda diundang untuk berkolaborasi di ruang kerja berikut:
          </p>
        </div>

        <div className="p-8 rounded-[28px] bg-card-surface border border-outline-variant/40 shadow-sm flex flex-col gap-6">
          <div className="p-4 rounded-2xl bg-surface-container flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-base text-on-surface">
                {invite.workspaceName}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs font-semibold uppercase">
                {invite.defaultRole}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-on-surface-variant pt-2 border-t border-outline-variant/20">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4" /> Kuota Terpakai
              </span>
              <span className="font-semibold text-on-surface">
                {currentMembers} / {invite.maxMembers} Anggota
              </span>
            </div>
          </div>

          {isFull ? (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-error-container text-on-error-container text-xs flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-error" />
              <span>
                Ruang kerja ini telah mencapai batas kuota maksimal 20 anggota.
              </span>
            </div>
          ) : (
            <form action={handleAccept}>
              <button
                type="submit"
                className={cn(
                  "w-full min-h-[48px] px-6 rounded-full bg-primary text-on-primary",
                  "text-label-large font-semibold flex items-center justify-center gap-2",
                  "hover:brightness-95 transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-outline outline-none"
                )}
              >
                <span>Konfirmasi & Gabung ke Ruang Kerja</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function InvitePage({ params }: InvitePageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-surface text-on-surface text-sm">
          Memuat undangan...
        </div>
      }
    >
      <AsyncInvitePage params={params} />
    </Suspense>
  );
}
