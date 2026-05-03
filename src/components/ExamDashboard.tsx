"use client";

import type {
  ExamAnalysisPayload,
  UploadedSourceMeta,
} from "@/types/analysis";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const SECTIONS = ["upload", "analysis", "dashboard", "study-plan"] as const;
type Section = (typeof SECTIONS)[number];

const CHART_COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#7c3aed", "#4f46e5"];
const PIE_COLORS = ["#6366f1", "#8b5cf6", "#22d3ee"];

function cn(...parts: (string | false | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-5 w-5 animate-spin", className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

function NavIcon({ name }: { name: Section }) {
  const common = "h-5 w-5";
  switch (name) {
    case "upload":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
      );
    case "analysis":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      );
    case "dashboard":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      );
    case "study-plan":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
  }
}

function EmptyDashboardIllustration() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="relative mb-6 h-40 w-40 rounded-3xl bg-gradient-to-br from-indigo-100 to-violet-100 p-6 shadow-inner dark:from-indigo-950/50 dark:to-violet-950/50">
        <svg viewBox="0 0 120 120" className="h-full w-full text-indigo-400/80 dark:text-violet-400/60">
          <rect x="24" y="28" width="72" height="88" rx="8" fill="currentColor" opacity="0.15" />
          <path d="M40 48h48M40 64h36M40 80h44" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          <circle cx="78" cy="42" r="18" fill="none" stroke="currentColor" strokeWidth="3" />
          <path d="M88 52l10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
        No insights yet
      </h3>
      <p className="mt-2 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
        Upload a paper or paste questions, then run AI analysis to unlock your
        dashboard.
      </p>
      <p className="mt-6 rounded-full bg-zinc-200/80 px-4 py-2 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
        Charts appear here after analysis
      </p>
    </motion.div>
  );
}

function JsonDrawer({ title, data }: { title: string; data: unknown }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      layout
      className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/60 shadow-lg backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/40"
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-medium text-zinc-700 transition hover:bg-zinc-50/80 dark:text-zinc-200 dark:hover:bg-zinc-800/50"
      >
        {title}
        <span className="text-zinc-400">{open ? "−" : "+"}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.pre
            key="json"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="max-h-72 overflow-auto border-t border-zinc-100 bg-zinc-950 px-5 py-4 text-xs text-emerald-100/90 dark:border-zinc-800"
          >
            {JSON.stringify(data, null, 2)}
          </motion.pre>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

const tooltipStyle = {
  backgroundColor: "rgba(15, 23, 42, 0.92)",
  border: "none",
  borderRadius: "12px",
  fontSize: "12px",
  padding: "8px 12px",
};

export default function ExamDashboard() {
  const [active, setActive] = useState<Section>("upload");
  const [paperId, setPaperId] = useState<string | null>(null);
  const [pasteText, setPasteText] = useState("");
  const [analysis, setAnalysis] = useState<ExamAnalysisPayload | null>(null);
  const [syllabusText, setSyllabusText] = useState("");
  const [planDays, setPlanDays] = useState(7);
  const [practiceTopic, setPracticeTopic] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [lastFileName, setLastFileName] = useState<string | null>(null);
  const [fileManifest, setFileManifest] = useState<UploadedSourceMeta[]>([]);
  const [justAnalyzed, setJustAnalyzed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevAnalysisRef = useRef<ExamAnalysisPayload | null>(null);

  const run = useCallback(async (label: string, fn: () => Promise<void>) => {
    setErr(null);
    setBusy(label);
    try {
      await fn();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(null);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (analysis && analysis !== prevAnalysisRef.current) {
      prevAnalysisRef.current = analysis;
      setJustAnalyzed(true);
      const t = setTimeout(() => setJustAnalyzed(false), 3200);
      return () => clearTimeout(t);
    }
  }, [analysis]);

  const uploadFiles = useCallback(
    (files: File[]) => {
      if (!files.length) return;
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const firstImage = files.find((f) => f.type.startsWith("image/"));
      setLastFileName(
        files.length === 1 ? files[0].name : `${files.length} files`
      );
      if (firstImage) {
        setPreviewUrl(URL.createObjectURL(firstImage));
      } else {
        setPreviewUrl(null);
      }
      void run("extract", async () => {
        const fd = new FormData();
        for (const f of files) fd.append("files", f);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error || "Upload failed");
        setPaperId(j.id);
        setPasteText(j.extractedText || "");
        setFileManifest(
          Array.isArray(j.files) ? (j.files as UploadedSourceMeta[]) : []
        );
        setAnalysis(null);
      });
    },
    [run, previewUrl]
  );

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (list?.length) uploadFiles(Array.from(list));
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const list = e.dataTransfer.files;
    if (list?.length) uploadFiles(Array.from(list));
  };

  const onPasteSave = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setLastFileName(null);
    void run("extract", async () => {
      const fd = new FormData();
      fd.append("text", pasteText);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Upload failed");
      setPaperId(j.id);
      setFileManifest(
        Array.isArray(j.files) ? (j.files as UploadedSourceMeta[]) : []
      );
      setAnalysis(null);
    });
  };

  const onAnalyze = () => {
    if (!paperId && !pasteText.trim()) {
      setErr("Upload a paper or paste text first.");
      return;
    }
    void run("analyze", async () => {
      const body: Record<string, string> = paperId
        ? { paperId }
        : { text: pasteText };
      if (syllabusText.trim()) body.syllabusText = syllabusText.trim();
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = (await res.json()) as ExamAnalysisPayload & {
        paperId?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(j.error || "Analyze failed");
      const { paperId: newPaperId, ...payload } = j;
      if (newPaperId) setPaperId(newPaperId);
      setAnalysis(payload as ExamAnalysisPayload);
      setActive("dashboard");
    });
  };

  const onSyllabus = () => {
    if (!paperId) {
      setErr("Save or analyze a paper first (paper id required).");
      return;
    }
    void run("analyze", async () => {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paperId,
          syllabusText: syllabusText.trim(),
        }),
      });
      const j = (await res.json()) as ExamAnalysisPayload & {
        paperId?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(j.error || "Syllabus update failed");
      const { paperId: pid, ...payload } = j;
      if (pid) setPaperId(pid);
      setAnalysis(payload as ExamAnalysisPayload);
      setActive("dashboard");
    });
  };

  const onPlan = () => {
    if (!paperId) {
      setErr("Need paper id from upload.");
      return;
    }
    void run("plan", async () => {
      const res = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paperId, days: planDays }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Plan failed");
      setAnalysis(j.analysis as ExamAnalysisPayload);
    });
  };

  const onPractice = () => {
    if (!paperId || !practiceTopic.trim()) {
      setErr("Need paper id and topic.");
      return;
    }
    void run("questions", async () => {
      const res = await fetch("/api/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paperId, topic: practiceTopic.trim() }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Questions failed");
      setAnalysis(j.analysis as ExamAnalysisPayload);
    });
  };

  const dash = analysis?.visualDashboard;
  const bars = dash?.topicFrequencyBars ?? [];
  const typeData = dash?.typeDistribution?.filter((d) => d.value > 0) ?? [];
  const diffData =
    dash?.difficultyDistribution?.filter((d) => d.value > 0) ?? [];
  const lineTrend = bars.map((d, i) => ({
    rank: i + 1,
    frequency: d.frequency,
    label: d.name,
  }));

  const highCount =
    analysis?.topicImportanceRanking?.filter((t) => t.importance === "High")
      .length ?? 0;

  const sectionVariants = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -12 },
  };

  return (
    <div className="flex min-h-screen bg-[#f4f4f5] text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-[260px] flex-col border-r border-zinc-800/80 bg-zinc-950 px-4 py-8 shadow-2xl">
        <div className="mb-10 px-2">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25">
              <span className="text-sm font-bold text-white">S</span>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Smart
              </p>
              <p className="bg-gradient-to-r from-indigo-300 to-violet-300 bg-clip-text text-lg font-bold tracking-tight text-transparent">
                Analyzer
              </p>
            </div>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {(
            [
              ["upload", "Upload"],
              ["analysis", "Analysis"],
              ["dashboard", "Dashboard"],
              ["study-plan", "Study Plan"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setActive(id)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition-all duration-200",
                active === id
                  ? "bg-white/10 text-white shadow-lg ring-1 ring-white/10"
                  : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
              )}
            >
              <span
                className={cn(
                  active === id ? "text-indigo-400" : "text-zinc-500"
                )}
              >
                <NavIcon name={id} />
              </span>
              {label}
              {active === id && (
                <motion.span
                  layoutId="nav-pill"
                  className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-400"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          ))}
        </nav>
        <p className="mt-auto px-2 text-[10px] leading-relaxed text-zinc-600">
          Powered by Groq · llama3-70b-8192
        </p>
      </aside>

      {/* Main */}
      <main className="relative ml-[260px] min-h-screen flex-1 overflow-x-hidden">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-32 top-0 h-96 w-96 rounded-full bg-indigo-400/10 blur-3xl dark:bg-indigo-500/15" />
          <div className="absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-violet-400/10 blur-3xl dark:bg-violet-500/10" />
        </div>

        <div className="relative z-10 px-8 py-10 lg:px-12 lg:py-12">
          <AnimatePresence mode="wait">
            {active === "upload" && (
              <motion.div
                key="upload"
                variants={sectionVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="mx-auto max-w-4xl space-y-10"
              >
                <header className="space-y-4">
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-600 dark:text-indigo-400"
                  >
                    Exam intelligence
                  </motion.p>
                  <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
                    <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:via-violet-400 dark:to-purple-400">
                      Analyze Past Papers Smarter
                    </span>
                  </h1>
                  <p className="max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
                    AI-powered insights to boost your exam performance
                  </p>
                </header>

                {/* Glass dropzone */}
                <motion.div
                  whileHover={{ scale: 1.005 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className={cn(
                    "group relative rounded-2xl p-[1px] transition-shadow duration-300",
                    dragOver
                      ? "shadow-[0_0_0_2px_rgba(99,102,241,0.6),0_25px_50px_-12px_rgba(99,102,241,0.35)]"
                      : "shadow-xl shadow-zinc-200/50 dark:shadow-black/40"
                  )}
                >
                  <div
                    className={cn(
                      "absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 opacity-60 blur-sm transition-opacity duration-300 group-hover:opacity-90",
                      dragOver && "opacity-100"
                    )}
                  />
                  <div
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) =>
                      e.key === "Enter" && fileInputRef.current?.click()
                    }
                    onDragEnter={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={onDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="relative cursor-pointer rounded-2xl border border-white/20 bg-white/70 px-8 py-12 backdrop-blur-xl transition-colors dark:border-white/10 dark:bg-zinc-900/70"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,application/pdf,image/png,image/jpeg,.png,.jpg,.jpeg,.txt,text/plain"
                      className="hidden"
                      onChange={onFileInput}
                    />
                    <div className="flex flex-col items-center text-center">
                      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg">
                        <NavIcon name="upload" />
                      </div>
                      <p className="text-base font-semibold text-zinc-800 dark:text-zinc-100">
                        Drop your paper here
                      </p>
                      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                        PDF, PNG, JPG, or TXT — multi-file supported
                      </p>
                    </div>
                    {(previewUrl || lastFileName) && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-8 flex flex-col items-center gap-3"
                      >
                        {previewUrl ? (
                          <img
                            src={previewUrl}
                            alt="Preview"
                            className="max-h-48 rounded-xl border border-zinc-200/80 object-contain shadow-md dark:border-zinc-700"
                          />
                        ) : (
                          <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-6 py-8 dark:border-zinc-700 dark:bg-zinc-800/50">
                            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                              {lastFileName}
                            </p>
                          </div>
                        )}
                        {busy === "extract" && (
                          <p className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400">
                            <Spinner /> Extracting text…
                          </p>
                        )}
                      </motion.div>
                    )}
                  </div>
                </motion.div>

                {fileManifest.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-zinc-200/80 bg-white/80 p-5 shadow-lg backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/50"
                  >
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Uploaded files ({fileManifest.length})
                    </p>
                    <ul className="flex max-h-48 flex-col gap-2 overflow-y-auto pr-1">
                      {fileManifest.map((f, i) => (
                        <li
                          key={`${f.name}-${i}`}
                          className="flex items-center justify-between gap-3 rounded-xl border border-zinc-100 bg-white/90 px-4 py-2.5 text-sm dark:border-zinc-800 dark:bg-zinc-900/80"
                        >
                          <span className="truncate font-medium text-zinc-800 dark:text-zinc-100">
                            {f.name}
                          </span>
                          <span className="shrink-0 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                            {f.kind}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}

                <div className="space-y-3">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Or paste text
                  </label>
                  <textarea
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    rows={5}
                    placeholder="Paste your exam questions here..."
                    className="w-full resize-none rounded-2xl border border-zinc-200/80 bg-white/90 px-5 py-4 text-sm text-zinc-900 shadow-lg shadow-zinc-200/40 outline-none ring-0 transition-all placeholder:text-zinc-400 focus:border-indigo-400/60 focus:shadow-xl focus:shadow-indigo-500/10 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-100 dark:shadow-black/20 dark:focus:border-indigo-500/50 dark:focus:ring-indigo-500/30"
                  />
                  <div className="flex flex-wrap items-center gap-3">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onPasteSave}
                      disabled={!!busy || !pasteText.trim()}
                      className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50/50 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-indigo-900 dark:hover:bg-indigo-950/30"
                    >
                      Save to server
                    </motion.button>
                    {paperId && (
                      <span className="text-xs text-zinc-500">
                        ID{" "}
                        <code className="rounded-md bg-zinc-200/80 px-1.5 py-0.5 dark:bg-zinc-800">
                          {paperId.slice(0, 8)}…
                        </code>
                      </span>
                    )}
                  </div>
                </div>

                <motion.button
                  type="button"
                  whileHover={{
                    scale: 1.02,
                    boxShadow: "0 20px 40px -12px rgba(99, 102, 241, 0.45)",
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onAnalyze}
                  disabled={!!busy || (!paperId && !pasteText.trim())}
                  className="relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 py-4 text-base font-semibold text-white shadow-xl shadow-indigo-500/25 transition disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {busy === "analyze" ? (
                    <>
                      <Spinner className="text-white" />
                      Analyzing papers…
                    </>
                  ) : (
                    "Run AI Analysis"
                  )}
                </motion.button>
              </motion.div>
            )}

            {active === "analysis" && (
              <motion.div
                key="analysis"
                variants={sectionVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="mx-auto max-w-3xl space-y-8"
              >
                <div>
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                    Analysis &amp; enrichment
                  </h2>
                  <p className="mt-1 text-zinc-600 dark:text-zinc-400">
                    Syllabus coverage, practice generation, and re-runs.
                  </p>
                </div>

                <motion.div
                  whileHover={{ y: -2 }}
                  className="rounded-2xl border border-zinc-200/80 bg-white/80 p-6 shadow-xl backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/60"
                >
                  <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                    Syllabus
                  </h3>
                  <textarea
                    value={syllabusText}
                    onChange={(e) => setSyllabusText(e.target.value)}
                    rows={5}
                    placeholder="Paste your official syllabus for coverage mapping…"
                    className="mt-3 w-full resize-none rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm shadow-inner outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-indigo-500"
                  />
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={onSyllabus}
                    disabled={!!busy || !paperId}
                    className="mt-4 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 disabled:opacity-40"
                  >
                    Update syllabus coverage
                  </motion.button>
                </motion.div>

                <motion.div
                  whileHover={{ y: -2 }}
                  className="rounded-2xl border border-zinc-200/80 bg-white/80 p-6 shadow-xl backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/60"
                >
                  <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                    Practice questions
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <input
                      value={practiceTopic}
                      onChange={(e) => setPracticeTopic(e.target.value)}
                      placeholder="Topic name"
                      className="min-w-[200px] flex-1 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-950"
                    />
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.98 }}
                      onClick={onPractice}
                      disabled={!!busy || !paperId}
                      className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg disabled:opacity-40"
                    >
                      Generate 3 questions
                    </motion.button>
                  </div>
                </motion.div>

                <motion.button
                  type="button"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={onAnalyze}
                  disabled={!!busy || (!paperId && !pasteText.trim())}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-indigo-200 bg-indigo-50/80 py-3.5 text-sm font-semibold text-indigo-800 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-200 disabled:opacity-40"
                >
                  {busy === "analyze" && <Spinner />}
                  Re-run AI analysis
                </motion.button>
              </motion.div>
            )}

            {active === "dashboard" && (
              <motion.div
                key="dashboard"
                variants={sectionVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="mx-auto max-w-6xl space-y-10"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                      Dashboard
                    </h2>
                    <p className="text-zinc-600 dark:text-zinc-400">
                      Live view of topics, difficulty, and patterns.
                    </p>
                  </div>
                </div>

                {!analysis ? (
                  <EmptyDashboardIllustration />
                ) : (
                  <>
                    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                      {[
                        {
                          title: "Topic frequency",
                          stat: bars.length ? `${bars.length} topics` : "—",
                          sub: "Weighted by appearances",
                          delay: 0,
                        },
                        {
                          title: "Importance",
                          stat: highCount ? `${highCount} high` : "—",
                          sub: "High / medium / low",
                          delay: 0.05,
                        },
                        {
                          title: "Patterns",
                          stat: analysis.questionPatternAnalysis.summary
                            ? `${analysis.questionPatternAnalysis.summary.mcq + analysis.questionPatternAnalysis.summary.theory + analysis.questionPatternAnalysis.summary.numerical} items`
                            : "—",
                          sub: "MCQ · Theory · Numerical",
                          delay: 0.1,
                        },
                        {
                          title: "Study plan",
                          stat: analysis.smartStudyPlan?.plan?.length
                            ? `${analysis.smartStudyPlan.plan.length} days`
                            : "Not set",
                          sub: "Generate in Study Plan",
                          delay: 0.15,
                        },
                      ].map((card) => (
                        <motion.div
                          key={card.title}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            delay: card.delay,
                            duration: 0.4,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                          whileHover={{
                            y: -6,
                            transition: { duration: 0.2 },
                          }}
                          className="rounded-2xl border border-zinc-200/80 bg-white/90 p-6 shadow-lg shadow-zinc-200/30 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/70 dark:shadow-black/30"
                        >
                          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                            {card.title}
                          </p>
                          <p className="mt-3 text-2xl font-bold text-zinc-900 dark:text-white">
                            {card.stat}
                          </p>
                          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                            {card.sub}
                          </p>
                        </motion.div>
                      ))}
                    </div>

                    <div className="grid gap-6 lg:grid-cols-3">
                      <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        whileHover={{ y: -4 }}
                        className="rounded-2xl border border-zinc-200/80 bg-white/90 p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900/70"
                      >
                        <h3 className="mb-4 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                          Topic frequency
                        </h3>
                        <div className="h-72 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={bars}>
                              <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#e4e4e7"
                                vertical={false}
                              />
                              <XAxis
                                dataKey="name"
                                tick={{ fontSize: 10, fill: "#71717a" }}
                                interval={0}
                                angle={-25}
                                textAnchor="end"
                                height={70}
                              />
                              <YAxis
                                tick={{ fontSize: 11, fill: "#71717a" }}
                                allowDecimals={false}
                              />
                              <Tooltip contentStyle={tooltipStyle} />
                              <Bar dataKey="frequency" radius={[6, 6, 0, 0]}>
                                {bars.map((_, i) => (
                                  <Cell
                                    key={i}
                                    fill={CHART_COLORS[i % CHART_COLORS.length]}
                                  />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        whileHover={{ y: -4 }}
                        className="rounded-2xl border border-zinc-200/80 bg-white/90 p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900/70"
                      >
                        <h3 className="mb-4 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                          Emphasis trend
                        </h3>
                        <div className="h-72 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={lineTrend}>
                              <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#e4e4e7"
                              />
                              <XAxis
                                dataKey="rank"
                                tick={{ fontSize: 11, fill: "#71717a" }}
                                label={{
                                  value: "Topic rank",
                                  position: "insideBottom",
                                  offset: -4,
                                  fill: "#71717a",
                                  fontSize: 11,
                                }}
                              />
                              <YAxis
                                tick={{ fontSize: 11, fill: "#71717a" }}
                                allowDecimals={false}
                              />
                              <Tooltip
                                contentStyle={tooltipStyle}
                                formatter={(v) => [String(v ?? ""), "Frequency"]}
                                labelFormatter={(rank) => `Rank ${rank}`}
                              />
                              <Line
                                type="monotone"
                                dataKey="frequency"
                                stroke="#6366f1"
                                strokeWidth={3}
                                dot={{
                                  r: 4,
                                  fill: "#8b5cf6",
                                  strokeWidth: 2,
                                  stroke: "#fff",
                                }}
                                activeDot={{ r: 6 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        whileHover={{ y: -4 }}
                        className="rounded-2xl border border-zinc-200/80 bg-white/90 p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900/70"
                      >
                        <h3 className="mb-4 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                          Question types
                        </h3>
                        <div className="h-72 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={typeData}
                                dataKey="value"
                                nameKey="label"
                                cx="50%"
                                cy="50%"
                                innerRadius={52}
                                outerRadius={88}
                                paddingAngle={3}
                              >
                                {typeData.map((_, i) => (
                                  <Cell
                                    key={i}
                                    fill={PIE_COLORS[i % PIE_COLORS.length]}
                                    stroke="transparent"
                                  />
                                ))}
                              </Pie>
                              <Tooltip contentStyle={tooltipStyle} />
                              <Legend
                                wrapperStyle={{ fontSize: 12 }}
                                formatter={(value) => (
                                  <span className="text-zinc-600 dark:text-zinc-300">
                                    {value}
                                  </span>
                                )}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        {diffData.length > 0 && (
                          <p className="mt-2 text-center text-xs text-zinc-500">
                            Difficulty split available in raw JSON
                          </p>
                        )}
                      </motion.div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <JsonDrawer
                        title="1. Topic frequency · JSON"
                        data={analysis.topicFrequencyTable}
                      />
                      <JsonDrawer
                        title="2. Topic ranking (High / Medium / Low) · JSON"
                        data={analysis.topicImportanceRanking}
                      />
                      <JsonDrawer
                        title="3. Question pattern analysis · JSON"
                        data={analysis.questionPatternAnalysis}
                      />
                      <JsonDrawer
                        title="4. Syllabus coverage · JSON"
                        data={analysis.syllabusCoverageReport}
                      />
                      <JsonDrawer
                        title="5. Study plan (day-wise) · JSON"
                        data={analysis.smartStudyPlan}
                      />
                      <JsonDrawer
                        title="6. Practice questions · JSON"
                        data={analysis.practiceQuestions}
                      />
                      <JsonDrawer
                        title="Chart data (derived) · JSON"
                        data={analysis.visualDashboard}
                      />
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {active === "study-plan" && (
              <motion.div
                key="study-plan"
                variants={sectionVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="mx-auto max-w-3xl space-y-8"
              >
                <div>
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                    Study plan
                  </h2>
                  <p className="text-zinc-600 dark:text-zinc-400">
                    Day-wise schedule from high-priority topics.
                  </p>
                </div>

                <motion.div
                  whileHover={{ y: -2 }}
                  className="flex flex-wrap items-end gap-4 rounded-2xl border border-zinc-200/80 bg-white/80 p-6 shadow-xl backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/60"
                >
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Days
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={planDays}
                      onChange={(e) => setPlanDays(Number(e.target.value))}
                      className="mt-2 block w-24 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-950"
                    />
                  </label>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onPlan}
                    disabled={!!busy || !paperId}
                    className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg disabled:opacity-40"
                  >
                    {busy === "plan" ? "Generating…" : "Generate plan"}
                  </motion.button>
                </motion.div>

                {analysis?.smartStudyPlan?.plan &&
                analysis.smartStudyPlan.plan.length > 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-4"
                  >
                    {analysis.smartStudyPlan.plan.map((day, i) => (
                      <motion.div
                        key={day.day}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06 }}
                        whileHover={{ y: -3 }}
                        className="rounded-2xl border border-zinc-200/80 bg-white/90 p-5 shadow-lg dark:border-zinc-800 dark:bg-zinc-900/70"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                            Day {day.day}
                          </span>
                          {day.revision && (
                            <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                              Revision
                            </span>
                          )}
                        </div>
                        <ul className="mt-3 list-inside list-disc text-sm text-zinc-600 dark:text-zinc-300">
                          {day.topics.map((t) => (
                            <li key={t}>{t}</li>
                          ))}
                        </ul>
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/80 px-6 py-12 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-400">
                    Run analysis first, then generate a plan. Requires a saved
                    paper id.
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {err && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto mt-8 max-w-2xl rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
            >
              {err}
            </motion.div>
          )}
        </div>

        {/* Full-screen loading */}
        <AnimatePresence>
          {(busy === "analyze" || busy === "extract") && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.92, opacity: 0 }}
                className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-zinc-900 px-10 py-8 shadow-2xl"
              >
                <Spinner className="h-8 w-8 text-indigo-400" />
                <p className="text-sm font-medium text-white">
                  {busy === "extract"
                    ? "Extracting text…"
                    : "Analyzing papers…"}
                </p>
                <p className="text-center text-xs text-zinc-400">
                  {busy === "extract"
                    ? "Parsing PDFs and running OCR on images"
                    : "Groq is extracting topics and classifying questions"}
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success toast */}
        <AnimatePresence>
          {justAnalyzed && (
            <motion.div
              initial={{ opacity: 0, y: 24, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: 16, x: "-50%" }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className="fixed bottom-8 left-1/2 z-50 flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-950/95 px-5 py-3 text-sm font-medium text-emerald-100 shadow-xl shadow-emerald-900/40 backdrop-blur-md"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white">
                ✓
              </span>
              Analysis ready — open Dashboard
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
