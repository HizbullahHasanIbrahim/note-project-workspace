import { Check, X, Split, ShieldCheck, Zap, Layers, DollarSign, BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComparisonRow {
  dimension: string;
  icon: typeof Split;
  fragmentedWay: {
    title: string;
    description: string;
  };
  unifiedWay: {
    title: string;
    description: string;
  };
}

const COMPARISON_DATA: ComparisonRow[] = [
  {
    dimension: "Konteks Keputusan Rapat",
    icon: BrainCircuit,
    fragmentedWay: {
      title: "Tercatat terpisah di dokumen & pelacak tugas",
      description:
        "Notulensi di Google Docs, kartu tugas di Trello/Jira. Anggota tim sering kehilangan alasan mengapa suatu tugas dibuat.",
    },
    unifiedWay: {
      title: "Tautkan notulensi langsung ke kartu tugas",
      description:
        "Tugas relasional terhubung langsung ke blok catatan rapat dengan panel Backlinks dua arah yang selalu terlacak.",
    },
  },
  {
    dimension: "Kecepatan Temu Informasi",
    icon: Zap,
    fragmentedWay: {
      title: "Mencari di 3 aplikasi berbeda",
      description:
        "Perlu membuka tab terpisah untuk docs, papan tugas, dan riwayat chat. Sering terjadi duplikasi pertanyaan di grup tim.",
    },
    unifiedWay: {
      title: "Pencarian Cmd+K instan di bawah 300ms",
      description:
        "Satu pintasan keyboard menelusuri judul halaman, isi blok teks, dan status tugas secara instan tanpa ganti konteks.",
    },
  },
  {
    dimension: "Batasan Privasi Draf",
    icon: ShieldCheck,
    fragmentedWay: {
      title: "Tautan dokumen terpisah rawan bocor",
      description:
        "Menulis draf di akun pribadi lalu membagikan tautan manual. Risiko salah hak akses atau tautan tertinggal di chat publik.",
    },
    unifiedWay: {
      title: "Private Space terisolasi dengan anti-IDOR",
      description:
        "Draf pribadi aman terlindungi di level database dan tidak terbaca oleh anggota lain sampai Anda siap mempublikasikannya.",
    },
  },
  {
    dimension: "Kolaborasi Waktu Nyata",
    icon: Layers,
    fragmentedWay: {
      title: "Tabrakan kursor & konflik penyimpanan",
      description:
        "Teks sering tertimpa jika dua orang mengedit di saat bersamaan tanpa sinkronisasi state yang transparan.",
    },
    unifiedWay: {
      title: "CRDT Yjs WebSocket latensi < 200ms",
      description:
        "Suntingan paralel bebas konflik dengan kursor warna-warni dan snapshot riwayat otomatis saat klien disconnect.",
    },
  },
  {
    dimension: "Biaya & Kompleksitas Operasional",
    icon: DollarSign,
    fragmentedWay: {
      title: "Langganan berlapis & orientasi rumit",
      description:
        "Biaya per-kursi bertambah untuk setiap aplikasi tambahan. Tim baru harus belajar antarmuka yang berbeda-beda.",
    },
    unifiedWay: {
      title: "Satu ruang kerja terpadu 100% siap pakai",
      description:
        "Satu bahasa desain Material You yang kohesif untuk dokumen dan manajemen tugas tanpa biaya langganan tambahan.",
    },
  },
];

export function LandingComparison() {
  return (
    <section
      id="perbandingan"
      aria-labelledby="comparison-heading"
      className="w-full py-20 sm:py-28 border-t border-outline-variant/30"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Bagian: Editorial & Tegas */}
        <div className="max-w-3xl mb-14 sm:mb-20 text-left">
          <span className="text-label-medium font-semibold text-primary">
            Perbandingan Sistem
          </span>
          <h2
            id="comparison-heading"
            className="mt-2 text-headline-medium sm:text-display-small font-bold text-on-surface tracking-tight"
          >
            Perbandingan cara kerja terpisah versus terpadu
          </h2>
          <p className="mt-4 text-body-large text-on-surface-variant leading-relaxed max-w-2xl">
            Menggabungkan dokumentasi dan manajemen tugas dalam satu basis data memangkas waktu pencarian
            dan menjaga riwayat keputusan tetap utuh.
          </p>
        </div>

        {/* Tabel Komparasi Desktop (>= 768px) */}
        <div className="hidden md:block rounded-[28px] bg-surface-container-low border border-outline-variant/50 overflow-hidden shadow-xs text-left">
          {/* Header Kolom Desktop */}
          <div className="grid grid-cols-12 bg-surface-container border-b border-outline-variant/40 p-5 lg:p-6 text-title-medium font-bold text-on-surface items-center gap-4">
            <div className="col-span-4 text-on-surface-variant text-label-large">
              Aspek Kolaborasi Tim
            </div>
            <div className="col-span-4 text-on-surface-variant flex items-center gap-2 text-label-large">
              <span className="w-6 h-6 rounded-full bg-error-container text-on-error-container flex items-center justify-center text-xs">
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </span>
              <span>Aplikasi Terpisah (Docs + Tracker)</span>
            </div>
            <div className="col-span-4 text-primary flex items-center gap-2 text-label-large">
              <span className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center text-xs">
                <Check className="w-3.5 h-3.5" aria-hidden="true" />
              </span>
              <span>Note &amp; Project Workspace</span>
            </div>
          </div>

          {/* Baris-Baris Komparasi */}
          <div className="divide-y divide-outline-variant/30">
            {COMPARISON_DATA.map((row, index) => {
              const Icon = row.icon;
              return (
                <div
                  key={index}
                  className="grid grid-cols-12 p-5 lg:p-6 gap-6 items-start hover:bg-surface-container/60 transition-colors motion-reduce:transition-none"
                >
                  {/* Kolom 1: Dimensi */}
                  <div className="col-span-4 flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-surface-container-highest text-on-surface-variant flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-primary" aria-hidden="true" />
                    </span>
                    <div className="text-title-medium font-bold text-on-surface">
                      {row.dimension}
                    </div>
                  </div>

                  {/* Kolom 2: Cara Terpisah (Legacy) */}
                  <div className="col-span-4 p-4 rounded-2xl bg-surface-container-lowest/60 border border-outline-variant/20">
                    <div className="flex items-center gap-2 text-label-medium font-bold text-on-surface-variant mb-1.5">
                      <X className="w-4 h-4 text-error shrink-0" aria-hidden="true" />
                      <span>{row.fragmentedWay.title}</span>
                    </div>
                    <p className="text-body-medium text-on-surface-variant leading-relaxed">
                      {row.fragmentedWay.description}
                    </p>
                  </div>

                  {/* Kolom 3: Cara Terpadu (Note & Project) */}
                  <div className="col-span-4 p-4 rounded-2xl bg-primary-container/35 border border-primary/30">
                    <div className="flex items-center gap-2 text-label-medium font-bold text-primary mb-1.5">
                      <Check className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                      <span>{row.unifiedWay.title}</span>
                    </div>
                    <p className="text-body-medium text-on-surface leading-relaxed">
                      {row.unifiedWay.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tata Letak Kartu Komparasi Mobile (< 768px / 375px) Bebas Horizontal Overflow */}
        <div className="md:hidden flex flex-col gap-4 text-left">
          {COMPARISON_DATA.map((row, index) => {
            const Icon = row.icon;
            return (
              <div
                key={index}
                className="rounded-2xl bg-surface-container-low border border-outline-variant/50 p-4 flex flex-col gap-3"
              >
                {/* Header Dimensi */}
                <div className="flex items-center gap-2.5 pb-2 border-b border-outline-variant/30">
                  <span className="w-8 h-8 rounded-lg bg-surface-container-highest text-on-surface-variant flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-primary" aria-hidden="true" />
                  </span>
                  <span className="text-title-medium font-bold text-on-surface">
                    {row.dimension}
                  </span>
                </div>

                {/* Cara Terpisah */}
                <div className="p-3.5 rounded-xl bg-surface-container-lowest/60 border border-outline-variant/20">
                  <div className="flex items-center gap-2 text-label-small font-bold text-on-surface-variant mb-1">
                    <X className="w-3.5 h-3.5 text-error shrink-0" />
                    <span>Alat Terpisah</span>
                  </div>
                  <div className="text-xs font-semibold text-on-surface mb-1">
                    {row.fragmentedWay.title}
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    {row.fragmentedWay.description}
                  </p>
                </div>

                {/* Cara Terpadu */}
                <div className="p-3.5 rounded-xl bg-primary-container/35 border border-primary/30">
                  <div className="flex items-center gap-2 text-label-small font-bold text-primary mb-1">
                    <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>Note &amp; Project Workspace</span>
                  </div>
                  <div className="text-xs font-semibold text-on-surface mb-1">
                    {row.unifiedWay.title}
                  </div>
                  <p className="text-xs text-on-surface leading-relaxed">
                    {row.unifiedWay.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
