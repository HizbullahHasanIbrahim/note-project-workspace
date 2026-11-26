"use server";

import crypto from "crypto";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, workspaceMembers } from "@/db/schema";
import {
  hashPassword,
  verifyPassword,
  setSessionCookie,
  clearSessionCookie,
} from "@/lib/auth";

export interface AuthActionResult {
  success?: boolean;
  error?: string;
}

/**
 * Server Action untuk pendaftaran pengguna baru (Email/Password)
 */
export async function registerAction(
  prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const fullName = formData.get("fullName")?.toString().trim();
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const password = formData.get("password")?.toString();

  if (!fullName || fullName.length < 2) {
    return { error: "Nama lengkap minimal 2 karakter." };
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Alamat email tidak valid." };
  }

  if (!password || password.length < 8) {
    return { error: "Kata sandi minimal 8 karakter." };
  }

  // Cek apakah email sudah terdaftar
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser) {
    return { error: "Alamat email sudah terdaftar. Silakan masuk." };
  }

  const userId = crypto.randomUUID();
  const passwordHash = await hashPassword(password);

  await db.insert(users).values({
    id: userId,
    email,
    passwordHash,
    fullName,
    authProvider: "email",
  });

  await setSessionCookie({
    userId,
    email,
    fullName,
  });

  redirect("/onboarding");
}

/**
 * Server Action untuk login pengguna terdaftar (Email/Password)
 */
export async function loginAction(
  prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const password = formData.get("password")?.toString();

  if (!email || !password) {
    return { error: "Email dan kata sandi wajib diisi." };
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user || !user.passwordHash) {
    return { error: "Email atau kata sandi tidak cocok." };
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return { error: "Email atau kata sandi tidak cocok." };
  }

  await setSessionCookie({
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
  });

  // Cari workspace pertama yang diikuti pengguna
  const [membership] = await db
    .select()
    .from(workspaceMembers)
    .where(eq(workspaceMembers.userId, user.id))
    .limit(1);

  if (membership) {
    redirect(`/workspace/${membership.workspaceId}`);
  } else {
    redirect("/onboarding");
  }
}

/**
 * Server Action untuk Google OAuth (Alur instan satu klik untuk lingkungan MVP)
 */
export async function googleAuthAction(emailParam?: string, nameParam?: string) {
  const email = emailParam || "user.google@example.com";
  const fullName = nameParam || "Google User";

  let [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    const userId = crypto.randomUUID();
    await db.insert(users).values({
      id: userId,
      email,
      fullName,
      authProvider: "google",
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`,
    });

    user = {
      id: userId,
      email,
      fullName,
      passwordHash: null,
      avatarUrl: null,
      authProvider: "google",
      createdAt: new Date(),
    };
  }

  await setSessionCookie({
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
  });

  const [membership] = await db
    .select()
    .from(workspaceMembers)
    .where(eq(workspaceMembers.userId, user.id))
    .limit(1);

  if (membership) {
    redirect(`/workspace/${membership.workspaceId}`);
  } else {
    redirect("/onboarding");
  }
}

/**
 * Server Action untuk keluar dari sesi (Logout)
 */
export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}
