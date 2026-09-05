import React, { useState } from "react";
import {
  Network,
  Share2,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sparkles,
  Trophy,
  Info,
  ArrowRight,
  Server,
  Zap,
} from "lucide-react";
import { sound } from "./soundEffects";

interface GraphNode {
  id: string;
  name: string;
  role: string;
  x: number; // percentage
  y: number; // percentage
}

interface GraphEdge {
  from: string;
  to: string;
  latency: number; // in ms
}

interface GraphAbstractionSimulatorProps {
  onSuccessScore?: (score: number, stars: number) => void;
  isTeacherMode?: boolean;
}

const NODES: GraphNode[] = [
  { id: "A", name: "Server Cloud Pusat", role: "Titik Awal (Start)", x: 12, y: 50 },
  { id: "B", name: "Router Transit Utara", role: "Node B", x: 38, y: 20 },
  { id: "C", name: "Router Backbone Selatan", role: "Node C", x: 38, y: 80 },
  { id: "D", name: "Gateway Distribusi", role: "Node D", x: 65, y: 35 },
  { id: "E", name: "Edge Caching Regional", role: "Node E", x: 65, y: 75 },
  { id: "F", name: "Server Lab Sekolah", role: "Target Tujuan", x: 88, y: 50 },
];

const EDGES: GraphEdge[] = [
  { from: "A", to: "B", latency: 14 },
  { from: "A", to: "C", latency: 6 },
  { from: "B", to: "D", latency: 8 },
  { from: "B", to: "F", latency: 25 },
  { from: "C", to: "D", latency: 9 },
  { from: "C", to: "E", latency: 7 },
  { from: "D", to: "F", latency: 11 },
  { from: "E", to: "F", latency: 16 },
];

// Calculation:
// Paths from A to F:
// 1. A -> B -> F = 14 + 25 = 39ms
// 2. A -> B -> D -> F = 14 + 8 + 11 = 33ms
// 3. A -> C -> D -> F = 6 + 9 + 11 = 26ms (OPTIMAL!)
// 4. A -> C -> E -> F = 6 + 7 + 16 = 29ms
const OPTIMAL_PATH = ["A", "C", "D", "F"];
const OPTIMAL_LATENCY = 26;

export const GraphAbstractionSimulator: React.FC<GraphAbstractionSimulatorProps> = ({
  onSuccessScore,
}) => {
  const [selectedPath, setSelectedPath] = useState<string[]>(["A"]);
  const [evaluated, setEvaluated] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [stars, setStars] = useState<number>(0);
  const [message, setMessage] = useState<string>("");

  const currentLastNode = selectedPath[selectedPath.length - 1];

  // Find valid next adjacent nodes from current last node
  const getNextAvailableNodes = (nodeId: string): { to: string; latency: number }[] => {
    return EDGES.filter((e) => e.from === nodeId && !selectedPath.includes(e.to)).map((e) => ({
      to: e.to,
      latency: e.latency,
    }));
  };

  const handleSelectNode = (nodeId: string) => {
    if (evaluated) return;
    const available = getNextAvailableNodes(currentLastNode);
    if (!available.some((a) => a.to === nodeId)) return;

    sound.playStep();
    const newPath = [...selectedPath, nodeId];
    setSelectedPath(newPath);

    // If reached target 'F', automatically trigger evaluation
    if (nodeId === "F") {
      evaluatePath(newPath);
    }
  };

  const calculateTotalLatency = (path: string[]): number => {
    let total = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const from = path[i];
      const to = path[i + 1];
      const edge = EDGES.find((e) => e.from === from && e.to === to);
      if (edge) total += edge.latency;
    }
    return total;
  };

  const evaluatePath = (path: string[]) => {
    const totalLatency = calculateTotalLatency(path);
    setEvaluated(true);

    if (totalLatency === OPTIMAL_LATENCY) {
      sound.playSuccess();
      setScore(100);
      setStars(3);
      setMessage(
        "Sempurna! Kamu berhasil menemukan Rute Abstraksi Paling Optimal (Total Latensi 26 ms: A -> C -> D -> F). Algoritma routing internet bekerja persis dengan logika ini!"
      );
      if (onSuccessScore) onSuccessScore(100, 3);
    } else {
      sound.playCoin();
      const diff = totalLatency - OPTIMAL_LATENCY;
      const calcScore = Math.max(70, 100 - diff * 3);
      const starCount = calcScore >= 85 ? 2 : 1;
      setScore(calcScore);
      setStars(starCount);
      setMessage(
        `Rute berhasil terhubung (${totalLatency} ms), namun masih ada jalur alternatif yang lebih cepat (${OPTIMAL_LATENCY} ms). Coba eksplorasi simpul lainnya!`
      );
      if (onSuccessScore) onSuccessScore(calcScore, starCount);
    }
  };

  const handleReset = () => {
    sound.playClick();
    setSelectedPath(["A"]);
    setEvaluated(false);
    setMessage("");
  };

  const currentTotal = calculateTotalLatency(selectedPath);
  const availableNext = getNextAvailableNodes(currentLastNode);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col">
      {/* Banner */}
      <div className="p-5 bg-gradient-to-r from-sky-900 via-indigo-950 to-slate-900 text-white flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 shrink-0">
            <Network className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-sky-500/30 text-sky-300 px-2 py-0.5 rounded-full border border-sky-500/40">
                Pilar: Abstraksi & Graf
              </span>
              <span className="text-xs text-slate-300">Level 2 Menengah</span>
            </div>
            <h3 className="font-black text-lg text-white mt-0.5">
              Simulasi Abstraksi Rute Jaringan Komputer (Dijkstra Mini)
            </h3>
            <p className="text-xs text-slate-300">
              Pilihlah simpul jalur paket data dari Cloud Server (A) menuju Lab Sekolah (F) dengan latensi terkecil!
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-2 cursor-pointer transition-all active:scale-95"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset Jalur</span>
        </button>
      </div>

      {/* Main Interactive Graph Canvas */}
      <div className="p-6 bg-slate-950 flex flex-col items-center justify-center relative min-h-[420px]">
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(#38bdf8 1px, transparent 1px), radial-gradient(#38bdf8 1px, transparent 1px)",
            backgroundSize: "24px 24px",
            backgroundPosition: "0 0, 12px 12px",
          }}
        />

        {/* SVG lines for edges */}
        <svg className="w-full h-80 max-w-3xl overflow-visible relative z-0">
          {EDGES.map((edge) => {
            const fromNode = NODES.find((n) => n.id === edge.from)!;
            const toNode = NODES.find((n) => n.id === edge.to)!;

            const isEdgeInPath = selectedPath.some((nodeId, idx) => {
              if (idx < selectedPath.length - 1) {
                return (
                  (selectedPath[idx] === edge.from && selectedPath[idx + 1] === edge.to) ||
                  (selectedPath[idx] === edge.to && selectedPath[idx + 1] === edge.from)
                );
              }
              return false;
            });

            // calculate coordinates in % converted to viewBox 1000x400
            const x1 = fromNode.x * 10;
            const y1 = fromNode.y * 4;
            const x2 = toNode.x * 10;
            const y2 = toNode.y * 4;
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;

            return (
              <g key={`edge-${edge.from}-${edge.to}`}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={isEdgeInPath ? "#38bdf8" : "#334155"}
                  strokeWidth={isEdgeInPath ? 5 : 2}
                  strokeDasharray={isEdgeInPath ? "none" : "4 4"}
                  className="transition-all duration-300"
                />
                {/* Latency badge on line */}
                <rect
                  x={midX - 18}
                  y={midY - 12}
                  width="36"
                  height="22"
                  rx="6"
                  fill={isEdgeInPath ? "#0284c7" : "#1e293b"}
                  stroke={isEdgeInPath ? "#38bdf8" : "#475569"}
                  strokeWidth="1.5"
                />
                <text
                  x={midX}
                  y={midY + 3}
                  textAnchor="middle"
                  fill={isEdgeInPath ? "#ffffff" : "#94a3b8"}
                  fontSize="10"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {edge.latency}ms
                </text>
              </g>
            );
          })}
        </svg>

        {/* Nodes layer on top of SVG */}
        <div className="w-full max-w-3xl h-80 relative -mt-80 z-10 pointer-events-none">
          {NODES.map((node) => {
            const isSelected = selectedPath.includes(node.id);
            const isCurrent = currentLastNode === node.id;
            const isClickable = availableNext.some((a) => a.to === node.id);

            return (
              <div
                key={node.id}
                style={{
                  left: `${node.x}%`,
                  top: `${node.y}%`,
                  transform: "translate(-50%, -50%)",
                }}
                className="absolute pointer-events-auto flex flex-col items-center"
              >
                <button
                  type="button"
                  onClick={() => handleSelectNode(node.id)}
                  disabled={!isClickable || evaluated}
                  className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black transition-all duration-300 shadow-xl cursor-pointer ${
                    isCurrent
                      ? "bg-amber-400 text-slate-950 ring-4 ring-amber-300/50 scale-110 shadow-amber-400/40"
                      : isSelected
                      ? "bg-sky-500 text-white border-2 border-white shadow-sky-500/40"
                      : isClickable
                      ? "bg-slate-800 text-sky-400 border-2 border-sky-400/80 hover:bg-sky-950 hover:scale-105 animate-pulse"
                      : "bg-slate-900 text-slate-500 border border-slate-800 opacity-60 cursor-not-allowed"
                  }`}
                >
                  <span className="text-sm font-black">{node.id}</span>
                  {node.id === "A" && <Server className="w-3.5 h-3.5 mt-0.5 text-emerald-300" />}
                  {node.id === "F" && <Zap className="w-3.5 h-3.5 mt-0.5 text-amber-300" />}
                </button>

                <span className="mt-1.5 text-[10px] font-bold text-slate-300 bg-slate-900/90 px-2 py-0.5 rounded-md border border-slate-800 whitespace-nowrap shadow-sm">
                  {node.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Control & Latency Stats Bar */}
      <div className="p-5 bg-slate-50 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Rute Aktif:
            </span>
            <div className="flex items-center gap-1.5 font-black text-sm text-slate-800">
              {selectedPath.map((node, i) => (
                <React.Fragment key={node}>
                  <span className="w-6 h-6 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center text-xs">
                    {node}
                  </span>
                  {i < selectedPath.length - 1 && (
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Akumulasi Latensi:
            </span>
            <span className="text-lg font-black font-mono text-indigo-600">
              {currentTotal} ms
            </span>
          </div>
        </div>

        {/* Guidance / Status */}
        <div className="text-xs text-slate-600 flex items-center gap-2">
          {!evaluated ? (
            <span>
              Pilih simpul berkedip selanjutnya. Hubungkan hingga mencapai <b>Node F</b>!
            </span>
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-bold text-emerald-700">Skor: {score} / 100</span>
              <div className="flex items-center">
                {[1, 2, 3].map((s) => (
                  <Sparkles
                    key={s}
                    className={`w-4 h-4 ${s <= stars ? "text-amber-500 fill-amber-500" : "text-slate-300"}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Evaluation Feedback Alert */}
      {evaluated && (
        <div
          className={`p-4 border-t flex items-start gap-3 ${
            score === 100
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-amber-50 border-amber-200 text-amber-900"
          }`}
        >
          {score === 100 ? (
            <Trophy className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          )}
          <div className="text-xs">
            <p className="font-bold">{message}</p>
            <p className="mt-1 text-slate-600">
              <b>Mengapa ini Abstraksi?</b> Peta jaringan di atas mengabaikan panjang kabel serat optik bawah tanah dan jenis merek router fisik, hanya berfokus pada data esensial: hubungan simpul dan latensi waktu untuk menentukan rute optimal.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
