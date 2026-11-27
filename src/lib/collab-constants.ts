/**
 * Konstanta bersama untuk sinkronisasi Yjs CRDT antara klien dan server Hocuspocus
 */
export const COLLAB_FRAGMENT_NAME = "document-store";

export const MAX_PAGE_NESTING_DEPTH = 5;

export type CursorAccentToken = "primary" | "tertiary" | "secondary";

const CURSOR_TOKENS: CursorAccentToken[] = ["primary", "tertiary", "secondary"];

/**
 * Menentukan token warna semantik M3 secara deterministik berdasarkan userId
 * tanpa menggunakan kode warna hex mentah di komponen UI.
 */
export function getCursorAccentToken(userId: string): CursorAccentToken {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  }
  return CURSOR_TOKENS[hash % CURSOR_TOKENS.length];
}
