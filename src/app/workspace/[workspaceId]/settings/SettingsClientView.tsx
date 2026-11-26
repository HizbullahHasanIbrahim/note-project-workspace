"use client";

import React, { useState, useTransition } from "react";
import {
  Settings,
  Users,
  HardDrive,
  Copy,
  Check,
  Shield,
  UserCheck,
  UserX,
  AlertCircle,
  Plus,
} from "lucide-react";
import {
  updateWorkspaceNameAction,
  updateMemberRoleAction,
  removeMemberAction,
  createInviteLinkAction,
} from "./actions";
import { cn } from "@/lib/utils";

interface SettingsClientViewProps {
  workspace: {
    id: string;
    name: string;
    maxMembers: number;
    storageLimitBytes: number;
    storageUsedBytes: number;
  };
  members: Array<{
    id: string;
    userId: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
    role: "admin" | "member" | "viewer";
    joinedAt: Date;
  }>;
  currentUserRole: "admin" | "member" | "viewer";
  currentUserId: string;
}

export function SettingsClientView({
  workspace,
  members,
  currentUserRole,
  currentUserId,
}: SettingsClientViewProps) {
  const [activeTab, setActiveTab] = useState<"general" | "members" | "storage">("members");
  const [name, setName] = useState(workspace.name);
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const [generatedInviteUrl, setGeneratedInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isAdmin = currentUserRole === "admin";

  const handleUpdateName = (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("name", name);
      const res = await updateWorkspaceNameAction(workspace.id, formData);
      if (res?.error) {
        setActionError(res.error);
      }
    });
  };

  const handleCreateInvite = (role: "member" | "viewer") => {
    setActionError(null);
    startTransition(async () => {
      const res = await createInviteLinkAction(workspace.id, role);
      if (res?.token) {
        const fullUrl = `${window.location.origin}/invite/${res.token}`;
        setGeneratedInviteUrl(fullUrl);
      }
    });
  };

  const handleCopyInvite = () => {
    if (!generatedInviteUrl) return;
    navigator.clipboard.writeText(generatedInviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRoleChange = (targetUserId: string, newRole: "admin" | "member" | "viewer") => {
    setActionError(null);
    startTransition(async () => {
      const res = await updateMemberRoleAction(workspace.id, targetUserId, newRole);
      if (res?.error) {
        setActionError(res.error);
      }
    });
  };

  const handleRemoveMember = (targetUserId: string) => {
    if (!confirm("Apakah Anda yakin ingin mengeluarkan anggota ini?")) return;
    setActionError(null);
    startTransition(async () => {
      const res = await removeMemberAction(workspace.id, targetUserId);
      if (res?.error) {
        setActionError(res.error);
      }
    });
  };

  const storageUsedMB = (workspace.storageUsedBytes / (1024 * 1024)).toFixed(1);
  const storageLimitGB = (workspace.storageLimitBytes / (1024 * 1024 * 1024)).toFixed(0);
  const storagePercentage = Math.min(
    100,
    Math.round((workspace.storageUsedBytes / workspace.storageLimitBytes) * 100)
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Pesan Error */}
      {actionError && (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-error-container text-on-error-container text-xs flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-error" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Segmented Tabs Material You */}
      <div className="flex items-center gap-2 border-b border-outline-variant/30 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("members")}
          className={cn(
            "min-h-[40px] px-5 rounded-full text-label-large font-semibold flex items-center gap-2 transition-all",
            activeTab === "members"
              ? "bg-secondary-container text-on-secondary-container"
              : "text-on-surface-variant hover:bg-surface-container"
          )}
        >
          <Users className="w-4 h-4" />
          <span>Anggota ({members.length}/20)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("general")}
          className={cn(
            "min-h-[40px] px-5 rounded-full text-label-large font-semibold flex items-center gap-2 transition-all",
            activeTab === "general"
              ? "bg-secondary-container text-on-secondary-container"
              : "text-on-surface-variant hover:bg-surface-container"
          )}
        >
          <Settings className="w-4 h-4" />
          <span>Umum</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("storage")}
          className={cn(
            "min-h-[40px] px-5 rounded-full text-label-large font-semibold flex items-center gap-2 transition-all",
            activeTab === "storage"
              ? "bg-secondary-container text-on-secondary-container"
              : "text-on-surface-variant hover:bg-surface-container"
          )}
        >
          <HardDrive className="w-4 h-4" />
          <span>Penyimpanan</span>
        </button>
      </div>

      {/* TAB 1: MEMBERS */}
      {activeTab === "members" && (
        <div className="flex flex-col gap-6">
          {/* Header & Tombol Buat Undangan */}
          <div className="p-6 rounded-2xl bg-card-surface border border-outline-variant/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-on-surface text-base">
                Undang Rekan Tim Baru
              </span>
              <p className="text-xs text-on-surface-variant">
                Batas maksimal kapasitas ruang kerja ini adalah 20 anggota.
              </p>
            </div>

            {isAdmin ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isPending || members.length >= workspace.maxMembers}
                  onClick={() => handleCreateInvite("member")}
                  className={cn(
                    "min-h-[40px] px-4 rounded-full bg-primary text-on-primary text-label-medium font-semibold",
                    "flex items-center gap-1.5 hover:brightness-95 transition-all shadow-xs",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  <Plus className="w-4 h-4" />
                  <span>Buat Tautan Undangan</span>
                </button>
              </div>
            ) : (
              <span className="px-3 py-1 rounded-full bg-surface-container text-on-surface-variant text-xs">
                Hanya Admin yang dapat mengundang
              </span>
            )}
          </div>

          {/* Kotak Tautan Undangan yang Baru Dibuat */}
          {generatedInviteUrl && (
            <div className="p-4 rounded-2xl bg-surface-container border border-primary/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex flex-col gap-0.5 truncate">
                <span className="text-xs font-semibold text-primary">
                  Tautan Undangan Berhasil Dibuat (Berlaku 7 Hari):
                </span>
                <span className="text-xs font-mono text-on-surface truncate">
                  {generatedInviteUrl}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyInvite}
                className={cn(
                  "min-h-[36px] px-3.5 rounded-full text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all",
                  copied
                    ? "bg-primary text-on-primary"
                    : "bg-secondary-container text-on-secondary-container hover:brightness-95"
                )}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Tautan</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Daftar Anggota */}
          <div className="rounded-2xl border border-outline-variant/40 bg-card-surface overflow-hidden">
            <div className="p-4 border-b border-outline-variant/40 font-semibold text-xs text-on-surface-variant bg-surface-container">
              Daftar Anggota Aktif ({members.length} dari {workspace.maxMembers})
            </div>
            <div className="divide-y divide-outline-variant/30">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-secondary-container text-on-secondary-container font-bold text-sm flex items-center justify-center">
                      {member.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-on-surface">
                          {member.fullName}
                        </span>
                        {member.userId === currentUserId && (
                          <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-[10px] font-medium">
                            Anda
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-on-surface-variant">
                        {member.email}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Pemilihan Peran */}
                    {isAdmin ? (
                      <select
                        aria-label={`Ubah peran untuk ${member.fullName}`}
                        value={member.role}
                        disabled={isPending}
                        onChange={(e) =>
                          handleRoleChange(
                            member.userId,
                            e.target.value as "admin" | "member" | "viewer"
                          )
                        }
                        className={cn(
                          "h-9 px-3 rounded-xl bg-surface-container text-xs text-on-surface",
                          "border border-outline focus:border-primary outline-none"
                        )}
                      >
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                        <option value="viewer">Viewer (Read-Only)</option>
                      </select>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs font-semibold capitalize">
                        {member.role}
                      </span>
                    )}

                    {/* Tombol Hapus Anggota */}
                    {isAdmin && member.userId !== currentUserId && (
                      <button
                        type="button"
                        aria-label={`Keluarkan ${member.fullName}`}
                        onClick={() => handleRemoveMember(member.userId)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-error hover:bg-error-container transition-colors"
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GENERAL */}
      {activeTab === "general" && (
        <form
          onSubmit={handleUpdateName}
          className="p-6 rounded-2xl bg-card-surface border border-outline-variant/40 flex flex-col gap-4 max-w-lg"
        >
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="wsName"
              className="text-label-medium text-on-surface font-semibold"
            >
              Nama Ruang Kerja
            </label>
            <input
              id="wsName"
              type="text"
              required
              disabled={!isAdmin || isPending}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={cn(
                "w-full min-h-[44px] px-3.5 rounded-xl bg-surface-container",
                "text-on-surface placeholder:text-on-surface-variant text-sm",
                "border border-outline focus:border-2 focus:border-primary outline-none",
                "disabled:opacity-75 disabled:cursor-not-allowed"
              )}
            />
          </div>

          {isAdmin && (
            <button
              type="submit"
              disabled={isPending}
              className={cn(
                "min-h-[40px] px-5 rounded-full bg-primary text-on-primary text-label-medium font-semibold w-fit",
                "hover:brightness-95 transition-all shadow-xs"
              )}
            >
              <span>{isPending ? "Menyimpan..." : "Simpan Perubahan"}</span>
            </button>
          )}
        </form>
      )}

      {/* TAB 3: STORAGE */}
      {activeTab === "storage" && (
        <div className="p-6 rounded-2xl bg-card-surface border border-outline-variant/40 flex flex-col gap-5 max-w-lg">
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-base text-on-surface">
              Penggunaan Kuota Penyimpanan (Hard Guardrail)
            </span>
            <p className="text-xs text-on-surface-variant">
              Tiap workspace MVP memiliki batas penyimpanan 1 GB dan maksimal 10 MB per file.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-semibold text-on-surface">
              <span>{storageUsedMB} MB Terpakai</span>
              <span>{storageLimitGB} GB Total</span>
            </div>
            <div className="w-full h-3 rounded-full bg-surface-container-highest overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${Math.max(4, storagePercentage)}%` }}
              />
            </div>
            <span className="text-[11px] text-on-surface-variant">
              Sisa kuota: {((workspace.storageLimitBytes - workspace.storageUsedBytes) / (1024 * 1024)).toFixed(1)} MB
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
