import React, { useState, useEffect } from "react";
import {
  Gamepad2,
  BookOpen,
  HelpCircle,
  Trophy,
  Volume2,
  VolumeX,
  Sparkles,
  Bot,
  Network,
  Brain,
  CheckCircle2,
  Award,
  Layers,
  Printer,
  RotateCcw,
  GraduationCap,
  Users,
  Compass,
  Boxes,
} from "lucide-react";
import { SIMULATION_LEVELS, LevelConfig, LevelDifficulty } from "./simulationData";
import { GridRoverSimulator } from "./GridRoverSimulator";
import { GraphAbstractionSimulator } from "./GraphAbstractionSimulator";
import { SortingDecompositionSimulator } from "./SortingDecompositionSimulator";
import { QuizInteractive } from "./QuizInteractive";
import { ModuleViewer } from "./ModuleViewer";
import { sound } from "./soundEffects";
import { DailyLifeSimulatorEngine } from "./DailyLifeSimulatorEngine";
import { TeacherSimulationView } from "./TeacherSimulationView";

interface UserProgress {
  scores: Record<LevelDifficulty, { simScore: number; quizScore: number; stars: number; passed: boolean }>;
}

interface ComputationalThinkingSimulationProps {
  userRole: "student" | "teacher";
  currentUser?: {
    name?: string;
    nisn?: string;
    kelas?: string;
  };
  onBackToDashboard?: () => void;
}

export const ComputationalThinkingSimulation: React.FC<ComputationalThinkingSimulationProps> = ({
  userRole,
  currentUser,
  onBackToDashboard,
}) => {
  const [selectedLevelId, setSelectedLevelId] = useState<LevelDifficulty>("pemula");
  const [activeTab, setActiveTab] = useState<"daily_life" | "classic_sim" | "modul" | "kuis" | "raport" | "teacher_mgmt">("daily_life");
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Storage key based on NISN or default
  const storageKey = currentUser?.nisn
    ? `sipinter_sim_progress_${currentUser.nisn}`
    : "sipinter_sim_progress_default";

  const [progress, setProgress] = useState<UserProgress>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      scores: {
        pemula: { simScore: 0, quizScore: 0, stars: 0, passed: false },
        menengah: { simScore: 0, quizScore: 0, stars: 0, passed: false },
        lanjutan: { simScore: 0, quizScore: 0, stars: 0, passed: false },
      },
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(progress));
    } catch {}
  }, [progress, storageKey]);

  const currentLevel = SIMULATION_LEVELS.find((l) => l.id === selectedLevelId)!;

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sound.enabled = next;
    if (next) sound.playClick();
  };

  const handleSimulatorScore = (score: number, stars: number) => {
    setProgress((prev) => {
      const old = prev.scores[selectedLevelId];
      const newSimScore = Math.max(old.simScore, score);
      const newStars = Math.max(old.stars, stars);
      return {
        ...prev,
        scores: {
          ...prev.scores,
          [selectedLevelId]: {
            ...old,
            simScore: newSimScore,
            stars: newStars,
          },
        },
      };
    });
  };

  const handleQuizFinish = (quizScore: number, passed: boolean) => {
    setProgress((prev) => {
      const old = prev.scores[selectedLevelId];
      const newQuizScore = Math.max(old.quizScore, quizScore);
      return {
        ...prev,
        scores: {
          ...prev.scores,
          [selectedLevelId]: {
            ...old,
            quizScore: newQuizScore,
            passed: passed || old.passed,
          },
        },
      };
    });
  };

  const handlePrintRaport = () => {
    window.print();
  };

  // Overall statistics
  const totalStars = Object.values(progress.scores).reduce((acc, s) => acc + s.stars, 0);
  const totalLevelsPassed = Object.values(progress.scores).filter((s) => s.passed).length;
  const overallAverageScore = Math.round(
    Object.values(progress.scores).reduce((acc, s) => acc + (s.simScore + s.quizScore) / 2, 0) / 3
  );

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-800 relative overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Gamepad2 className="w-3.5 h-3.5" />
                <span>Simulasi Berpikir Komputasional</span>
              </span>
              <span className="text-xs font-bold text-slate-300 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                Informatika Kelas X SMA
              </span>
              {userRole === "teacher" && (
                <span className="text-xs font-bold text-amber-300 bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/30 flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Mode Guru / Instruktur</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Laboratorium Virtual & Game Berpikir Komputasional
            </h1>
            <p className="text-xs md:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Kuasai 4 Pilar Berpikir Komputasional (Dekomposisi, Pengenalan Pola, Abstraksi, dan Algoritma)
              melalui simulator robot interaktif, perutean graf, tebak biner, modul teori terstruktur, dan kuis adaptif.
            </p>
          </div>

          {/* Quick Stats & Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-slate-800/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-700 flex items-center gap-3">
              <div className="flex items-center gap-1 text-amber-400 font-black text-sm">
                <Sparkles className="w-4 h-4 fill-amber-400" />
                <span>{totalStars} / 9 Bintang</span>
              </div>
              <div className="h-4 w-px bg-slate-600" />
              <div className="text-emerald-400 font-black text-sm">
                <span>Rata-Rata: {overallAverageScore}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleSound}
              className="p-3 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-2xl border border-slate-700 transition-colors cursor-pointer"
              title={soundEnabled ? "Nonaktifkan Suara" : "Aktifkan Suara"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>
          </div>
        </div>

        {/* Level Selector Tabs */}
        <div className="relative z-10 mt-6 pt-6 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-3">
          {SIMULATION_LEVELS.map((lvl) => {
            const isSelected = selectedLevelId === lvl.id;
            const lvlProgress = progress.scores[lvl.id];
            const avgScore = Math.round((lvlProgress.simScore + lvlProgress.quizScore) / 2);

            return (
              <button
                key={lvl.id}
                type="button"
                onClick={() => {
                  sound.playClick();
                  setSelectedLevelId(lvl.id);
                }}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? "bg-slate-800 border-emerald-400/80 shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/30"
                    : "bg-slate-900/60 border-slate-800 hover:bg-slate-800/50 text-slate-400"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      lvl.id === "pemula"
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : lvl.id === "menengah"
                        ? "bg-sky-500/20 text-sky-300 border-sky-500/40"
                        : "bg-purple-500/20 text-purple-300 border-purple-500/40"
                    }`}
                  >
                    {lvl.difficultyBadge}
                  </span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3].map((s) => (
                      <Sparkles
                        key={s}
                        className={`w-3 h-3 ${
                          s <= lvlProgress.stars ? "text-amber-400 fill-amber-400" : "text-slate-600"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <h3 className={`font-black text-sm ${isSelected ? "text-white" : "text-slate-300"}`}>
                  {lvl.title}
                </h3>
                <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{lvl.subtitle}</p>

                <div className="mt-2.5 flex items-center justify-between text-[10px] font-bold text-slate-400">
                  <span>Sim: {lvlProgress.simScore}</span>
                  <span>Kuis: {lvlProgress.quizScore}</span>
                  <span className={lvlProgress.passed ? "text-emerald-400" : "text-slate-500"}>
                    {lvlProgress.passed ? "✓ Lulus" : "Belum Lulus"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setActiveTab("daily_life");
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "daily_life"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Boxes className="w-4 h-4 text-amber-300" />
            <span>40 Simulator Siswa (10/Pilar)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 font-black">
              40 Level
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setActiveTab("classic_sim");
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "classic_sim"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            <span>Lab Virtual Klasik (Rover/Graf)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setActiveTab("modul");
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "modul"
                ? "bg-sky-600 text-white shadow-md shadow-sky-600/20"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Modul Penjelasan Materi</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setActiveTab("kuis");
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "kuis"
                ? "bg-amber-600 text-white shadow-md shadow-amber-600/20"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Kuis Interaktif ({currentLevel.quizQuestions.length} Soal)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setActiveTab("raport");
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "raport"
                ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Raport & Sertifikat Nilai</span>
          </button>

          {userRole === "teacher" && (
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setActiveTab("teacher_mgmt");
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer border ${
                activeTab === "teacher_mgmt"
                  ? "bg-rose-600 text-white border-rose-700 shadow-md shadow-rose-600/20"
                  : "bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100"
              }`}
            >
              <Users className="w-4 h-4 text-rose-600" />
              <span>Menu Guru: Reset Siswa & Kunci Jawaban</span>
            </button>
          )}
        </div>

        {/* Current status pill */}
        <div className="hidden xl:flex items-center gap-2 px-3 text-xs text-slate-500">
          <span>Tingkat Aktif:</span>
          <b className="text-slate-800">{currentLevel.difficultyBadge}</b>
        </div>
      </div>

      {/* Main Tab Panels */}
      <div>
        {/* 0. Teacher Management View: Reset Siswa & Kunci Jawaban Lengkap 40 Kasus */}
        {activeTab === "teacher_mgmt" && userRole === "teacher" && (
          <TeacherSimulationView
            onSelectSimulatorToPlay={() => {
              setActiveTab("daily_life");
            }}
          />
        )}

        {/* 1. 40 Daily Life Simulators (10 Dekomposisi, 10 Pola, 10 Abstraksi, 10 Algoritma) */}
        {activeTab === "daily_life" && (
          <DailyLifeSimulatorEngine
            userRole={userRole}
            currentUser={currentUser}
          />
        )}

        {/* 2. Classical Virtual Lab Simulators (Rover, Graph, Sorting) */}
        {activeTab === "classic_sim" && (
          <div className="space-y-4">
            <div className="bg-slate-100 p-3 rounded-xl text-xs text-slate-600 flex items-center justify-between">
              <span>
                Sedang memainkan Lab Virtual: <strong>{currentLevel.title}</strong>
              </span>
              <span className="font-semibold text-slate-700">
                Pilih tingkat kesulitan di banner atas untuk berganti lab
              </span>
            </div>
            {currentLevel.simulatorType === "rover" && (
              <GridRoverSimulator
                onSuccessScore={handleSimulatorScore}
                isTeacherMode={userRole === "teacher"}
              />
            )}
            {currentLevel.simulatorType === "graph" && (
              <GraphAbstractionSimulator
                onSuccessScore={handleSimulatorScore}
                isTeacherMode={userRole === "teacher"}
              />
            )}
            {currentLevel.simulatorType === "sorting" && (
              <SortingDecompositionSimulator
                onSuccessScore={handleSimulatorScore}
                isTeacherMode={userRole === "teacher"}
              />
            )}
          </div>
        )}

        {activeTab === "modul" && (
          <ModuleViewer
            level={currentLevel}
            onStartSimulator={() => setActiveTab("daily_life")}
            onStartQuiz={() => setActiveTab("kuis")}
          />
        )}

        {activeTab === "kuis" && (
          <QuizInteractive
            key={`quiz-${selectedLevelId}`}
            questions={currentLevel.quizQuestions}
            levelTitle={currentLevel.title}
            passingScore={currentLevel.passingScore}
            onFinishQuiz={handleQuizFinish}
            onOpenModule={() => setActiveTab("modul")}
            isTeacherMode={userRole === "teacher"}
          />
        )}

        {activeTab === "raport" && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 md:p-8 space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-6">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  Laporan Evaluasi Pembelajaran
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1">
                  Raport & Sertifikat Capaian Berpikir Komputasional
                </h3>
                <p className="text-xs text-slate-500">
                  Akumulasi nilai simulator dan kuis materi Informatika Fase E (Kelas X SMA).
                </p>
              </div>

              <button
                type="button"
                onClick={handlePrintRaport}
                className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-800 transition-all cursor-pointer shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak / Simpan PDF</span>
              </button>
            </div>

            {/* Student Info Card */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 font-medium block">Nama Siswa:</span>
                <span className="font-bold text-slate-800 text-sm">
                  {currentUser?.name || "Siswa Kelas X SMA"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">NISN / Identitas:</span>
                <span className="font-bold text-slate-800 text-sm">
                  {currentUser?.nisn || "3201XXXXXXXX"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Kelas & Rombel:</span>
                <span className="font-bold text-slate-800 text-sm">
                  {currentUser?.kelas || "Kelas X (Fase E)"}
                </span>
              </div>
            </div>

            {/* Level Score Breakdown Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-4">Level Kesulitan</th>
                    <th className="p-4">Fokus Pilar BK</th>
                    <th className="p-4 text-center">Skor Simulator</th>
                    <th className="p-4 text-center">Skor Kuis</th>
                    <th className="p-4 text-center">Rata-Rata</th>
                    <th className="p-4 text-center">Bintang</th>
                    <th className="p-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {SIMULATION_LEVELS.map((lvl) => {
                    const st = progress.scores[lvl.id];
                    const avg = Math.round((st.simScore + st.quizScore) / 2);
                    return (
                      <tr key={lvl.id} className="hover:bg-slate-50/50">
                        <td className="p-4 font-bold text-slate-800">
                          {lvl.title}
                        </td>
                        <td className="p-4 text-slate-500">
                          {lvl.id === "pemula"
                            ? "Dekomposisi & Algoritma Dasar"
                            : lvl.id === "menengah"
                            ? "Abstraksi Graf & Perulangan"
                            : "Sorting & Binary Search"}
                        </td>
                        <td className="p-4 text-center font-bold text-emerald-700">
                          {st.simScore} / 100
                        </td>
                        <td className="p-4 text-center font-bold text-sky-700">
                          {st.quizScore} / 100
                        </td>
                        <td className="p-4 text-center font-black text-slate-900 text-sm">
                          {avg}
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-0.5">
                            {[1, 2, 3].map((s) => (
                              <Sparkles
                                key={s}
                                className={`w-3.5 h-3.5 ${
                                  s <= st.stars ? "text-amber-400 fill-amber-400" : "text-slate-200"
                                }`}
                              />
                            ))}
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                              st.passed
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {st.passed ? "LULUS" : "BELUM LULUS"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Printable Certificate Box if passed all or user wants to preview */}
            <div className="p-8 rounded-3xl bg-gradient-to-br from-amber-50/80 via-white to-indigo-50/60 border-2 border-amber-300 shadow-md flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center shadow-lg shadow-amber-400/30">
                <Award className="w-8 h-8" />
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-amber-800 block">
                  Piagam Penghargaan Eksplorasi
                </span>
                <h4 className="text-2xl font-black text-slate-900 mt-1">
                  Master Berpikir Komputasional Fase E
                </h4>
                <p className="text-xs text-slate-600 max-w-lg mt-1">
                  Diberikan atas keberhasilan menyelesaikan simulasi permainan logika, pemecahan masalah algoritma,
                  dan kuis penguasaan 4 pilar computational thinking.
                </p>
              </div>

              <div className="bg-white/80 backdrop-blur-sm px-6 py-3 rounded-2xl border border-amber-200 flex items-center gap-6 text-xs">
                <div>
                  <span className="text-slate-400 block">Skor Kumulatif</span>
                  <b className="text-lg text-emerald-700 font-mono">{overallAverageScore} / 100</b>
                </div>
                <div className="h-8 w-px bg-slate-200" />
                <div>
                  <span className="text-slate-400 block">Koleksi Bintang</span>
                  <b className="text-lg text-amber-500 font-mono">{totalStars} ★</b>
                </div>
                <div className="h-8 w-px bg-slate-200" />
                <div>
                  <span className="text-slate-400 block">Predikat Capaian</span>
                  <b className="text-sm text-indigo-700">
                    {overallAverageScore >= 85 ? "Sangat Memuaskan (A)" : overallAverageScore >= 75 ? "Baik (B)" : "Cukup"}
                  </b>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
