"use server";

import crypto from "crypto";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { workspaces, workspaceMembers, pages } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export interface OnboardingActionResult {
  error?: string;
}

export async function createWorkspaceAction(
  prevState: OnboardingActionResult | null,
  formData: FormData
): Promise<OnboardingActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const name = formData.get("name")?.toString().trim();
  const template = formData.get("template")?.toString().trim() || "project_brief";

  if (!name || name.length < 2) {
    return { error: "Nama workspace minimal 2 karakter." };
  }

  const workspaceId = crypto.randomUUID();
  const welcomePageId = crypto.randomUUID();
  const privateDraftPageId = crypto.randomUUID();

  let welcomeTitle = "Project Brief & Spesifikasi";
  let welcomeIcon = "🚀";

  if (template === "sprint_tracker") {
    welcomeTitle = "Sprint Tracker & Eksekusi";
    welcomeIcon = "📊";
  } else if (template === "meeting_notes") {
    welcomeTitle = "Catatan Rapat Tim";
    welcomeIcon = "📝";
  } else if (template === "sop_wiki") {
    welcomeTitle = "SOP & Panduan Kerja Tim";
    welcomeIcon = "📚";
  }

  // Transaksi pembuatan workspace, role admin, dan halaman sambutan
  await db.transaction(async (tx) => {
    // 1. Buat Workspace
    await tx.insert(workspaces).values({
      id: workspaceId,
      name,
      ownerId: user.id,
      maxMembers: 20,
      storageLimitBytes: 1073741824, // 1 GB
      storageUsedBytes: 0,
    });

    // 2. Tambahkan pembuat sebagai Admin utama
    await tx.insert(workspaceMembers).values({
      id: crypto.randomUUID(),
      workspaceId,
      userId: user.id,
      role: "admin",
    });

    // 3. Buat halaman Starter Template di Shared Teamspace
    await tx.insert(pages).values({
      id: welcomePageId,
      workspaceId,
      createdBy: user.id,
      spaceType: "teamspace",
      pageType: "document",
      title: welcomeTitle,
      icon: welcomeIcon,
      positionOrder: 1000.0,
    });

    // 4. Buat draf awal di Private Space terisolasi
    await tx.insert(pages).values({
      id: privateDraftPageId,
      workspaceId,
      createdBy: user.id,
      spaceType: "private",
      pageType: "document",
      title: "Draf Pribadi Pertama Saya",
      icon: "🔒",
      positionOrder: 1000.0,
    });
  });

  redirect(`/workspace/${workspaceId}`);
}
