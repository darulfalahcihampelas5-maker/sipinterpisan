import React, { useState, useEffect } from "react";
import { PlusCircle, X, BookOpen, Users, Calendar, Sparkles, Check, FileText } from "lucide-react";

interface AddManualColumnModalProps {
  isOpen: boolean;
  onClose: () => void;
  chaptersList: any[];
  classesList: any[];
  onSave: (data: {
    materi: string;
    bab: string;
    kelas: string;
    publishDate: string;
    description?: string;
  }) => Promise<void>;
  isSaving: boolean;
}

export const AddManualColumnModal: React.FC<AddManualColumnModalProps> = ({
  isOpen,
  onClose,
  chaptersList,
  classesList,
  onSave,
  isSaving,
}) => {
  const [materi, setMateri] = useState("");
  const [bab, setBab] = useState("");
  const [kelas, setKelas] = useState("ALL");
  const [publishDate, setPublishDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setError("");
      setPublishDate(new Date().toISOString().split("T")[0]);
      if (chaptersList.length > 0 && !bab) {
        setBab(chaptersList[0].name || chaptersList[0].id || "");
      }
    }
  }, [isOpen, chaptersList]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materi.trim()) {
      setError("Judul / Nama Kolom Tugas wajib diisi.");
      return;
    }
    if (!bab) {
      setError("Pilih Bab terlebih dahulu.");
      return;
    }
    if (!kelas) {
      setError("Pilih Kelas Sasaran terlebih dahulu.");
      return;
    }

    try {
      await onSave({
        materi: materi.trim(),
        bab,
        kelas,
        publishDate,
        description: description.trim() || "Kolom Nilai Manual (Buku Nilai)",
      });
      // Reset form
      setMateri("");
      setDescription("");
      setError("");
    } catch (err: any) {
      setError(err?.message || "Gagal menyimpan kolom nilai.");
    }
  };

  const quickTitles = [
    "Tugas 1",
    "Tugas 2",
    "Tugas 3",
    "Praktik 1",
    "Ulangan Harian 1",
    "Tugas Portofolio",
    "Tugas Kelompok",
    "Projek Akhir",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between relative overflow-hidden">
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-[#85cc00]/20 border border-[#85cc00]/40 flex items-center justify-center text-[#85cc00]">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                Tambah Kolom Nilai Manual
              </h3>
              <p className="text-xs text-slate-300">
                Tambahkan kolom tugas baru ke tabel Rekap & otomatis tampil di Siswa
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Suggestions */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              Pilihan Cepat Judul Kolom
            </label>
            <div className="flex flex-wrap gap-1.5">
              {quickTitles.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setMateri(t)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all ${
                    materi === t
                      ? "bg-[#85cc00] border-[#85cc00] text-slate-950 font-bold shadow-sm"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Judul Tugas / Materi */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#649c00]" />
              Judul Kolom / Nama Tugas <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={materi}
              onChange={(e) => setMateri(e.target.value)}
              placeholder="Contoh: Tugas 1 - Algoritma Pemrograman"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#85cc00] focus:border-transparent font-medium"
              required
            />
          </div>

          {/* Bab Pembelajaran */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-[#649c00]" />
              Bab Pembelajaran <span className="text-rose-500">*</span>
            </label>
            {chaptersList.length > 0 ? (
              <select
                value={bab}
                onChange={(e) => setBab(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#85cc00] focus:border-transparent font-medium"
                required
              >
                <option value="" disabled>-- Pilih Bab --</option>
                {chaptersList.map((ch: any) => {
                  const rawName = ch.name || ch.id || "";
                  const cleanName = rawName.replace(/^Bab\s*\d+\s*[-:.]\s*/i, "").trim();
                  return (
                    <option key={ch.id || ch.name} value={cleanName}>
                      {cleanName}
                    </option>
                  );
                })}
              </select>
            ) : (
              <input
                type="text"
                value={bab}
                onChange={(e) => setBab(e.target.value)}
                placeholder="Contoh: Berpikir Komputasional"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#85cc00] focus:border-transparent font-medium"
                required
              />
            )}
          </div>

          {/* Target Kelas & Tanggal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#649c00]" />
                Kelas Sasaran <span className="text-rose-500">*</span>
              </label>
              <select
                value={kelas}
                onChange={(e) => setKelas(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#85cc00] focus:border-transparent font-medium"
              >
                <option value="ALL">Semua Kelas</option>
                {classesList.map((cls: any) => (
                  <option key={cls.id || cls.name} value={cls.name || cls.id}>
                    {cls.name || cls.id}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#649c00]" />
                Tanggal Penugasan <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={publishDate}
                onChange={(e) => setPublishDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#85cc00] focus:border-transparent font-medium"
                required
              />
            </div>
          </div>

          {/* Keterangan Tambahan (Opsional) */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Keterangan / Catatan (Opsional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Tugas Mandiri / Penilaian Lembar Kerja Siswa"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#85cc00] focus:border-transparent"
            />
          </div>

          {/* Info banner */}
          <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-100 flex items-start gap-2.5 text-xs text-blue-800">
            <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Setelah ditambahkan, kolom baru akan langsung aktif di tabel Rekap Nilai untuk diinput nilainya dan otomatis tersinkronisasi ke menu <strong>Tugas Siswa</strong> dan <strong>Nilai Siswa</strong>.
            </p>
          </div>

          {/* Footer Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-[#85cc00] hover:bg-[#78b800] text-slate-950 text-xs font-bold flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                  <span>Menyimpan Kolom...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Tambahkan Kolom Nilai</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
