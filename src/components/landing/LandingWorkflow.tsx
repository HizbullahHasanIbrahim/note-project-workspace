import {
  FileCode2,
  Users2,
  Link2,
  LayoutGrid,
  Lock,
  Columns3,
  Database,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const WORKFLOW_STEPS = [
  {
    number: "01",
    badge: "Inisiasi Draf",
    title: "Pilih dari 4 template awal teruji",
    subtitle: "Project Brief, Sprint Tracker, Meeting Notes, atau SOP & Wiki",
    description:
      "Mulai dokumen secara terstruktur dalam satu klik. Format blok heading, tabel objektif, dan checklist kesiapan langsung tersedia untuk menjaga standar tim.",
    templates: [
      { name: "Project Brief", icon: FileCode2 },
      { name: "Sprint Tracker", icon: LayoutGrid },
      { name: "Meeting Notes", icon: Users2 },
      { name: "SOP & Wiki", icon: Lock },
    ],
  },
  {
    number: "02",
    badge: "Kolaborasi CRDT",
    title: "Tulis dan diskusikan secara waktu nyata",
    subtitle: "Sinkronisasi CRDT Yjs dengan latensi di bawah 200 milidetik",
    description:
      "Tulis bersama rekan kerja tanpa risiko tumpang-tindih teks. Beri komentar spesifik pada blok kalimat terpilih yang tetap tersimpan aman meski blok dipindahkan.",
    channel: "#doc-sprint-14",
    editorSnippet: "Implementasi validasi header magic bytes file DOCX...",
  },
  {
    number: "03",
    badge: "Relasi Dua Arah",
    title: "Ubah keputusan menjadi tugas relasional",
    subtitle: "Konteks notulensi melekat langsung di dalam kartu tugas",
    description:
      "Butir keputusan rapat langsung terkonversi menjadi kartu tugas relasional. Panel Backlinks otomatis mencatat dokumen asal, sehingga alasan pengerjaan selalu jelas.",
    relationTitle: "Notulensi Rapat Sprint #14",
    activeLinks: "2 Tautan Aktif",
  },
  {
    number: "04",
    badge: "Multi-View Sinkron",
    title: "Pantau progres dari sudut pandang mana saja",
    subtitle: "Tampilan Table, Kanban, dan Calendar dari satu basis data",
    description:
      "Geser kartu di papan Kanban, atur tenggat di kalender, atau audit data di tabel terstruktur. Semua tampilan membaca basis data yang sama tanpa perlu input berulang.",
    views: ["Kanban", "Table", "Calendar"],
  },
];

export function LandingWorkflow() {
  return (
    <section
      id="alur-kerja"
      aria-labelledby="workflow-heading"
      className="w-full py-20 sm:py-28 border-t border-outline-variant/30"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Bagian: Editorial & Tenang */}
        <div className="max-w-3xl mb-14 sm:mb-20">
          <span className="text-label-medium font-semibold text-primary">
            Siklus Kerja Terpadu
          </span>
          <h2
            id="workflow-heading"
            className="mt-2 text-headline-medium sm:text-display-small font-bold text-on-surface tracking-tight"
          >
            Alur kerja terpadu dari ide hingga eksekusi
          </h2>
          <p className="mt-4 text-body-large text-on-surface-variant leading-relaxed max-w-2xl">
            Satu siklus kerja mulus tanpa menyalin catatan rapat ke aplikasi pelacak tugas terpisah.
            Dirancang khusus untuk tim gesit beranggotakan 2 hingga 20 orang.
          </p>
        </div>

        {/* 4 Langkah dengan Timeline Connection */}
        <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
          {WORKFLOW_STEPS.map((step, idx) => (
            <div
              key={step.number}
              className={cn(
                "rounded-[28px] bg-surface-container-low border border-outline-variant/50 p-6 sm:p-8 flex flex-col justify-between transition-all duration-200 motion-reduce:transition-none hover:bg-surface-container hover:border-outline-variant/70 shadow-xs relative",
                "text-left"
              )}
            >
              <div>
                <div className="flex items-center justify-between gap-4 mb-5">
                  <div className="flex items-center gap-3">
                    <span className="w-11 h-11 rounded-full bg-primary text-on-primary font-bold text-title-medium flex items-center justify-center shrink-0 shadow-xs">
                      {step.number}
                    </span>
                    <span className="text-label-small font-semibold px-3 py-1 rounded-full bg-surface-container-highest text-on-surface-variant">
                      {step.badge}
                    </span>
                  </div>

                  {/* Penanda Koneksi Langkah */}
                  {idx < WORKFLOW_STEPS.length - 1 && (
                    <div className="hidden lg:flex items-center gap-1 text-[11px] font-mono text-on-surface-variant/60">
                      <span>Langkah Berikutnya</span>
                      <ArrowRight className="w-3.5 h-3.5 text-primary" />
                    </div>
                  )}
                </div>

                <h3 className="text-title-large font-bold text-on-surface tracking-tight">
                  {step.title}
                </h3>
                <p className="mt-1 text-label-medium text-primary font-semibold">
                  {step.subtitle}
                </p>
                <p className="mt-3.5 text-body-medium text-on-surface-variant leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Micro-Visual Produk Nyata */}
              <div className="mt-6 pt-6 border-t border-outline-variant/30">
                {step.number === "01" && (
                  <div className="p-3.5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 space-y-2">
                    <div className="text-label-small font-bold text-on-surface-variant px-1">
                      Template Siap Pakai
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-label-small font-medium">
                      {step.templates?.map((t) => {
                        const Icon = t.icon;
                        return (
                          <div
                            key={t.name}
                            className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-center gap-2"
                          >
                            <Icon className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span className="truncate">{t.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {step.number === "02" && (
                  <div className="p-3.5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-label-small font-mono text-on-surface-variant">
                          {step.channel}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-semibold">
                        CRDT Live Sync
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 text-body-small text-on-surface flex items-start gap-2">
                      <div className="w-1 self-stretch rounded-full bg-primary shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-label-small font-bold text-primary">Raka</span>
                          <span className="text-[11px] text-on-surface-variant">sedang menyunting</span>
                        </div>
                        <div className="text-[12px] text-on-surface-variant mt-0.5 font-mono">
                          &quot;{step.editorSnippet}&quot;
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {step.number === "03" && (
                  <div className="p-3.5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 space-y-2">
                    <div className="text-label-small font-bold text-on-surface-variant px-1 flex items-center justify-between">
                      <span>Panel Backlinks Terkait</span>
                      <span className="text-[11px] font-mono text-primary font-semibold">
                        {step.activeLinks}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-center justify-between text-body-small">
                      <div className="flex items-center gap-2 min-w-0">
                        <Link2 className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="text-label-small text-on-surface font-semibold truncate">
                          {step.relationTitle}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-[11px] font-medium shrink-0">
                        Dokumen Asal
                      </span>
                    </div>
                  </div>
                )}

                {step.number === "04" && (
                  <div className="p-3.5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 space-y-2">
                    <div className="text-label-small font-bold text-on-surface-variant px-1">
                      Pilihan Sudut Pandang
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-label-small">
                      <div className="p-2 rounded-xl bg-secondary-container text-on-secondary-container font-semibold">
                        <Columns3 className="w-3.5 h-3.5 mx-auto mb-1 text-primary" />
                        <span>Kanban</span>
                      </div>
                      <div className="p-2 rounded-xl bg-surface-container-low border border-outline-variant/20 text-on-surface-variant">
                        <Database className="w-3.5 h-3.5 mx-auto mb-1 text-on-surface-variant" />
                        <span>Table</span>
                      </div>
                      <div className="p-2 rounded-xl bg-surface-container-low border border-outline-variant/20 text-on-surface-variant">
                        <Calendar className="w-3.5 h-3.5 mx-auto mb-1 text-on-surface-variant" />
                        <span>Calendar</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
