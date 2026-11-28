import { Shield, HardDrive, Cpu, Gift, CheckCircle2, Lock, Terminal, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpecDetail {
  title: string;
  badge: string;
  icon: typeof Shield;
  description: string;
  specs: { label: string; value: string }[];
}

const SPEC_DETAILS: SpecDetail[] = [
  {
    title: "Kapasitas & Kontrol Akses RBAC",
    badge: "Keamanan Anggota",
    icon: Shield,
    description:
      "Perlindungan ketat terhadap manipulasi kuota dan isolasi data pribadi menggunakan transaksi terkunci di level database.",
    specs: [
      { label: "Batas Tim", value: "2–20 Anggota per Workspace" },
      { label: "Matriks Peran", value: "Admin, Member, Viewer" },
      { label: "Proteksi Kuota", value: "SELECT ... FOR UPDATE Transaksional" },
      { label: "Isolasi Privasi", value: "Anti-IDOR pada created_by" },
    ],
  },
  {
    title: "Penyimpanan & Validasi Magic Bytes",
    badge: "Integritas File",
    icon: HardDrive,
    description:
      "Pemeriksaan struktur byte biner asli file untuk mencegah penyamaran ekstensi dokumen dan eksploitasi skrip berbahaya.",
    specs: [
      { label: "Batas per File", value: "Maksimal 10 MB per Unggahan" },
      { label: "Batas Workspace", value: "Kuota Total 1 GB per Ruang Kerja" },
      { label: "Format Sah", value: "PDF, DOCX, XLSX, PNG, JPG, WEBP" },
      { label: "Validasi PDF", value: "Header biner & %%EOF 1024 byte akhir" },
    ],
  },
  {
    title: "Mesin Kolaborasi & WebSocket CRDT",
    badge: "Waktu Nyata",
    icon: Cpu,
    description:
      "Arsitektur terdistribusi CRDT Yjs yang berjalan di port WebSocket terdedikasi untuk koordinasi paralel tanpa konflik teks.",
    specs: [
      { label: "Port Collab", value: "WebSocket Port 1234 (Hocuspocus)" },
      { label: "Target Latensi", value: "< 200ms pada 20 Klien Paralel" },
      { label: "Snapshot State", value: "Otomatis saat Last-Client Disconnect" },
      { label: "Anti Split-Brain", value: "HTTP Internal Reload Handshake" },
    ],
  },
  {
    title: "Basis Data & Standar Desain M3",
    badge: "Infrastruktur",
    icon: Terminal,
    description:
      "Fondasi relasional ACID dengan skema Drizzle ORM serta kepatuhan total terhadap spesifikasi Material Design 3.",
    specs: [
      { label: "Engine Database", value: "MySQL 8.0+ / MariaDB via 127.0.0.1:3306" },
      { label: "Pengurutan Kartu", value: "Fractional Indexing Tipe DOUBLE" },
      { label: "Pohon Halaman", value: "Maksimal 5 Tingkat Bersarang" },
      { label: "Sistem Desain", value: "Material You M3 Tonal Surfaces" },
    ],
  },
];

export function LandingOpenSpecs() {
  return (
    <section
      id="spesifikasi-mvp"
      aria-labelledby="specs-heading"
      className="w-full py-20 sm:py-28 border-t border-outline-variant/30"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Bagian: Editorial & Spesifik */}
        <div className="max-w-3xl mb-12 sm:mb-16 text-left">
          <span className="text-label-medium font-semibold text-primary">
            Transparansi Teknis
          </span>
          <h2
            id="specs-heading"
            className="mt-2 text-headline-medium sm:text-display-small font-bold text-on-surface tracking-tight"
          >
            Spesifikasi sistem dan batasan arsitektur
          </h2>
          <p className="mt-4 text-body-large text-on-surface-variant leading-relaxed max-w-2xl">
            Parameter operasional dan batasan kapasitas yang diuji untuk memastikan performa terprediksi
            bagi tim kerja Anda.
          </p>
        </div>

        {/* Baris Metrik Utama (JetBrains Mono & M3 Tonal Surfaces) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="p-4 sm:p-5 rounded-2xl bg-surface-container border border-outline-variant/30">
            <span className="text-label-small text-on-surface-variant">Latensi CRDT</span>
            <div className="text-title-large sm:text-headline-small font-mono font-bold text-primary mt-1">
              &lt; 200ms
            </div>
            <span className="text-[11px] text-on-surface-variant mt-0.5 block">20 klien bersamaan</span>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-surface-container border border-outline-variant/30">
            <span className="text-label-small text-on-surface-variant">Batas Lampiran</span>
            <div className="text-title-large sm:text-headline-small font-mono font-bold text-primary mt-1">
              10 MB
            </div>
            <span className="text-[11px] text-on-surface-variant mt-0.5 block">Magic bytes checked</span>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-surface-container border border-outline-variant/30">
            <span className="text-label-small text-on-surface-variant">Kuota Workspace</span>
            <div className="text-title-large sm:text-headline-small font-mono font-bold text-primary mt-1">
              1 GB
            </div>
            <span className="text-[11px] text-on-surface-variant mt-0.5 block">Penyimpanan lokal</span>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-surface-container border border-outline-variant/30">
            <span className="text-label-small text-on-surface-variant">Kapasitas Tim</span>
            <div className="text-title-large sm:text-headline-small font-mono font-bold text-primary mt-1">
              20 Orang
            </div>
            <span className="text-[11px] text-on-surface-variant mt-0.5 block">RBAC terverifikasi</span>
          </div>
        </div>

        {/* Grid 4 Kartu Arsitektur Teknis */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {SPEC_DETAILS.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="rounded-[28px] bg-surface-container-low border border-outline-variant/40 p-6 sm:p-8 flex flex-col justify-between transition-all duration-200 motion-reduce:transition-none hover:bg-surface-container hover:border-outline-variant/70 shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <span className="w-10 h-10 rounded-xl bg-surface-container-highest text-on-surface-variant flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-primary" aria-hidden="true" />
                    </span>
                    <span className="px-3 py-1 rounded-full bg-surface-container-highest text-on-surface-variant text-label-small font-semibold">
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="text-title-large font-bold text-on-surface tracking-tight">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-body-medium text-on-surface-variant leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Spesifikasi Teknis Terstruktur */}
                <div className="mt-6 pt-5 border-t border-outline-variant/30 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {item.specs.map((spec, sIdx) => (
                    <div
                      key={sIdx}
                      className="p-3 rounded-xl bg-surface-container border border-outline-variant/20"
                    >
                      <div className="text-[11px] text-on-surface-variant font-medium">
                        {spec.label}
                      </div>
                      <div className="text-label-medium font-bold text-on-surface font-mono mt-0.5 truncate">
                        {spec.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
