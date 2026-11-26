/**
 * Helper Fractional Indexing untuk pengurutan kartu Kanban dan pohon navigasi halaman
 * Menggunakan angka presisi ganda (DOUBLE).
 * Standar selisih interval awal: 1000.0
 * Ambang batas tabrakan (perlu re-index latar belakang): selisih < 0.0001
 */

export const DEFAULT_POSITION_STEP = 1000.0;
export const MIN_POSITION_GAP = 0.0001;

/**
 * Menghasilkan posisi baru di antara dua posisi yang ada,
 * atau di awal/akhir list.
 */
export function generatePosition(
  prevPosition?: number | null,
  nextPosition?: number | null
): number {
  const hasPrev = typeof prevPosition === "number" && !isNaN(prevPosition);
  const hasNext = typeof nextPosition === "number" && !isNaN(nextPosition);

  // Jika daftar masih kosong
  if (!hasPrev && !hasNext) {
    return DEFAULT_POSITION_STEP;
  }

  // Jika disisipkan di posisi paling awal (sebelum item pertama)
  if (!hasPrev && hasNext) {
    if (nextPosition! <= 1) {
      return nextPosition! / 2;
    }
    return Math.max(nextPosition! - DEFAULT_POSITION_STEP, nextPosition! / 2);
  }

  // Jika disisipkan di posisi paling akhir (setelah item terakhir)
  if (hasPrev && !hasNext) {
    return prevPosition! + DEFAULT_POSITION_STEP;
  }

  // Jika disisipkan di antara dua item
  const gap = nextPosition! - prevPosition!;
  if (gap <= 0) {
    // Edge case jika data corrupt (misal urutan terbalik), tetap buat titik tengah
    return prevPosition! + DEFAULT_POSITION_STEP / 2;
  }

  return prevPosition! + gap / 2;
}

/**
 * Memeriksa apakah selisih antar dua item sudah terlalu rapat sehingga
 * membutuhkan re-indexing urutan di database.
 */
export function needsReindex(prevPosition: number, nextPosition: number): boolean {
  return Math.abs(nextPosition - prevPosition) < MIN_POSITION_GAP;
}

/**
 * Menghasilkan array posisi baru terdistribusi merata dengan interval terstandarisasi.
 */
export function reindexPositions(count: number, step = DEFAULT_POSITION_STEP): number[] {
  const positions: number[] = [];
  for (let i = 1; i <= count; i++) {
    positions.push(i * step);
  }
  return positions;
}
