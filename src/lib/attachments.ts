import path from "path";

export const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const DEFAULT_WORKSPACE_STORAGE_LIMIT_BYTES = 1024 * 1024 * 1024; // 1 GB

export const ALLOWED_ATTACHMENT_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export type AllowedAttachmentMime =
  (typeof ALLOWED_ATTACHMENT_MIME_TYPES)[number];

const ALLOWED_MIME_SET = new Set<string>(ALLOWED_ATTACHMENT_MIME_TYPES);

const DANGEROUS_EXTENSIONS = new Set([
  ".svg",
  ".svgz",
  ".html",
  ".htm",
  ".xhtml",
  ".xml",
  ".js",
  ".mjs",
  ".cjs",
  ".php",
  ".sh",
  ".bat",
  ".cmd",
  ".exe",
  ".dll",
]);

const DANGEROUS_MIME_PREFIXES = [
  "image/svg",
  "text/html",
  "application/xhtml",
  "application/javascript",
  "text/javascript",
  "text/xml",
  "application/xml",
];

const MIME_TO_EXTENSION: Record<AllowedAttachmentMime, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "application/pdf": ".pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    ".docx",
};

const STORAGE_ROOT = path.resolve(process.cwd(), "storage", "uploads");

function startsWithBytes(buffer: Buffer, signature: number[], offset = 0): boolean {
  if (buffer.length < offset + signature.length) return false;
  for (let i = 0; i < signature.length; i++) {
    if (buffer[offset + i] !== signature[i]) return false;
  }
  return true;
}

/**
 * Membersihkan nama berkas dari karakter path traversal agar aman disimpan dan disajikan.
 */
export function sanitizeAttachmentFilename(rawName: string): string {
  const base = path.basename(rawName || "lampiran")
    .replace(/[\x00-\x1f\x7f<>:"/\\|?*]/g, "_")
    .trim();
  const collapsed = base.replace(/\s+/g, " ");
  if (!collapsed || collapsed === "." || collapsed === "..") {
    return "lampiran";
  }
  return collapsed.slice(0, 200);
}

/**
 * Mendeteksi tipe MIME sesungguhnya berdasarkan magic bytes biner berkas di sisi server
 * (Anti-Stored XSS & Anti-MIME Spoofing sesuai PRD §8.2 #3).
 */
export function detectMimeFromMagicBytes(
  buffer: Buffer,
  sanitizedFileName: string
): AllowedAttachmentMime | null {
  if (buffer.length < 4) return null;

  // Tolak tegas konten HTML/SVG/XML terselubung di awal berkas
  const headText = buffer
    .subarray(0, Math.min(512, buffer.length))
    .toString("utf8")
    .trimStart()
    .toLowerCase();
  if (
    headText.startsWith("<svg") ||
    headText.startsWith("<!doctype html") ||
    headText.startsWith("<html") ||
    headText.startsWith("<script") ||
    (headText.startsWith("<?xml") && headText.includes("<svg"))
  ) {
    return null;
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (startsWithBytes(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return "image/png";
  }

  // JPEG: FF D8 FF
  if (startsWithBytes(buffer, [0xff, 0xd8, 0xff])) {
    return "image/jpeg";
  }

  // WEBP: "RIFF".... "WEBP"
  if (
    startsWithBytes(buffer, [0x52, 0x49, 0x46, 0x46], 0) &&
    startsWithBytes(buffer, [0x57, 0x45, 0x42, 0x50], 8)
  ) {
    return "image/webp";
  }

  // GIF: GIF87a / GIF89a
  if (
    startsWithBytes(buffer, [0x47, 0x49, 0x46, 0x38, 0x37, 0x61]) ||
    startsWithBytes(buffer, [0x47, 0x49, 0x46, 0x38, 0x39, 0x61])
  ) {
    return "image/gif";
  }

  // PDF: %PDF- dan validasi %%EOF di 1024 byte terakhir berkas
  if (startsWithBytes(buffer, [0x25, 0x50, 0x44, 0x46, 0x2d])) {
    const tailText = buffer
      .subarray(Math.max(0, buffer.length - 1024))
      .toString("latin1");
    if (tailText.includes("%%EOF")) {
      return "application/pdf";
    }
    return null;
  }

  // DOCX: Header PK ZIP (50 4B 03 04) + ekstensi .docx + verifikasi struktur internal OpenXML ([Content_Types].xml & word/)
  const ext = path.extname(sanitizedFileName).toLowerCase();
  if (startsWithBytes(buffer, [0x50, 0x4b, 0x03, 0x04]) && ext === ".docx") {
    const hasContentTypes = buffer.includes(Buffer.from("[Content_Types].xml"));
    const hasWordDir = buffer.includes(Buffer.from("word/"));
    if (hasContentTypes && hasWordDir) {
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    }
    return null;
  }

  return null;
}

export interface AttachmentValidationResult {
  valid: boolean;
  error?: string;
  statusCode?: number;
  sanitizedFileName?: string;
  detectedMime?: AllowedAttachmentMime;
  storageExtension?: string;
}

/**
 * Validasi menyeluruh ukuran (<= 10 MB), daftar larangan SVG/HTML, dan magic bytes file unggahan.
 */
export function validateAttachmentUpload(
  buffer: Buffer,
  originalFileName: string,
  declaredMimeType: string
): AttachmentValidationResult {
  if (!buffer || buffer.length === 0) {
    return {
      valid: false,
      statusCode: 400,
      error: "Berkas kosong tidak dapat diunggah.",
    };
  }

  if (buffer.length > MAX_ATTACHMENT_SIZE_BYTES) {
    return {
      valid: false,
      statusCode: 413,
      error: "Ukuran berkas melebihi batas maksimal 10 MB (10.485.760 bytes).",
    };
  }

  const sanitizedFileName = sanitizeAttachmentFilename(originalFileName);
  const ext = path.extname(sanitizedFileName).toLowerCase();
  const normalizedDeclaredMime = (declaredMimeType || "").trim().toLowerCase();

  if (DANGEROUS_EXTENSIONS.has(ext)) {
    return {
      valid: false,
      statusCode: 415,
      error: `Tipe ekstensi berkas (${ext}) ditolak demi keamanan (anti-XSS).`,
    };
  }

  if (
    normalizedDeclaredMime &&
    DANGEROUS_MIME_PREFIXES.some((prefix) =>
      normalizedDeclaredMime.startsWith(prefix)
    )
  ) {
    return {
      valid: false,
      statusCode: 415,
      error: "Tipe berkas SVG, HTML, dan skrip aktif tidak diizinkan.",
    };
  }

  if (
    normalizedDeclaredMime &&
    normalizedDeclaredMime !== "application/octet-stream" &&
    !ALLOWED_MIME_SET.has(normalizedDeclaredMime)
  ) {
    return {
      valid: false,
      statusCode: 415,
      error: `Tipe MIME '${normalizedDeclaredMime}' tidak termasuk dalam daftar yang diizinkan.`,
    };
  }

  const detectedMime = detectMimeFromMagicBytes(buffer, sanitizedFileName);
  if (!detectedMime) {
    return {
      valid: false,
      statusCode: 415,
      error:
        "Validasi magic bytes gagal. Hanya file PNG, JPEG, WEBP, GIF, PDF, dan DOCX asli yang diizinkan.",
    };
  }

  // Pastikan MIME yang diklaim klien tidak bertentangan dengan magic bytes asli
  if (
    normalizedDeclaredMime &&
    normalizedDeclaredMime !== "application/octet-stream" &&
    normalizedDeclaredMime !== detectedMime
  ) {
    return {
      valid: false,
      statusCode: 415,
      error: "Tipe konten berkas tidak cocok dengan tanda tangan biner (magic bytes).",
    };
  }

  return {
    valid: true,
    sanitizedFileName,
    detectedMime,
    storageExtension: MIME_TO_EXTENSION[detectedMime],
  };
}

/**
 * Menghasilkan path absolut yang terisolasi di dalam folder storage/uploads/[workspaceId]/
 * dengan proteksi path traversal.
 */
export function resolveAttachmentDiskPath(storageKey: string): string {
  const cleanRelative = storageKey.replace(/^\/+/, "");
  const resolved = path.resolve(STORAGE_ROOT, cleanRelative);
  if (!resolved.startsWith(STORAGE_ROOT + path.sep)) {
    throw new Error("Path penyimpanan lampiran tidak valid.");
  }
  return resolved;
}

export function buildStorageKey(
  workspaceId: string,
  attachmentId: string,
  storageExtension: string
): string {
  const safeWorkspaceId = workspaceId.replace(/[^a-zA-Z0-9_-]/g, "");
  const safeAttachmentId = attachmentId.replace(/[^a-zA-Z0-9_-]/g, "");
  const safeExt = storageExtension.startsWith(".")
    ? storageExtension
    : `.${storageExtension}`;
  return `${safeWorkspaceId}/${safeAttachmentId}${safeExt}`;
}

export function formatBytesCompact(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
