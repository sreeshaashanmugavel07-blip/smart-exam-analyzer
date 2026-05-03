import type {
  ClassifiedQuestion,
  ExamAnalysisPayload,
  QuestionPatternAnalysis,
  SyllabusCoverageReport,
  TopicFrequencyRow,
  TopicImportanceRow,
  VisualDashboard,
} from "@/types/analysis";

function summarizePatterns(items: ClassifiedQuestion[]): QuestionPatternAnalysis["summary"] {
  const s = {
    mcq: 0,
    theory: 0,
    numerical: 0,
    easy: 0,
    medium: 0,
    hard: 0,
  };
  for (const q of items) {
    if (q.type === "MCQ") s.mcq++;
    else if (q.type === "Theory") s.theory++;
    else if (q.type === "Numerical") s.numerical++;
    if (q.difficulty === "Easy") s.easy++;
    else if (q.difficulty === "Medium") s.medium++;
    else if (q.difficulty === "Hard") s.hard++;
  }
  return s;
}

export function buildVisualDashboard(
  topics: TopicFrequencyRow[],
  summary: QuestionPatternAnalysis["summary"]
): VisualDashboard {
  const sorted = [...topics].sort((a, b) => b.frequency - a.frequency).slice(0, 12);
  return {
    topicFrequencyBars: sorted,
    typeDistribution: [
      { label: "MCQ", value: summary.mcq },
      { label: "Theory", value: summary.theory },
      { label: "Numerical", value: summary.numerical },
    ],
    difficultyDistribution: [
      { label: "Easy", value: summary.easy },
      { label: "Medium", value: summary.medium },
      { label: "Hard", value: summary.hard },
    ],
  };
}

function normalizeTopics(raw: unknown): TopicFrequencyRow[] {
  if (!raw || typeof raw !== "object") return [];
  const topics = (raw as { topics?: unknown }).topics;
  if (!Array.isArray(topics)) return [];
  return topics
    .map((t) => {
      if (!t || typeof t !== "object") return null;
      const o = t as Record<string, unknown>;
      const name = String(o.name ?? "").trim();
      const frequency = Number(o.frequency ?? 0);
      if (!name) return null;
      return { name, frequency: Number.isFinite(frequency) ? frequency : 0 };
    })
    .filter(Boolean) as TopicFrequencyRow[];
}

function normalizeClassifications(raw: unknown): ClassifiedQuestion[] {
  if (!raw || typeof raw !== "object") return [];
  const items =
    (raw as { items?: unknown }).items ??
    (raw as { questions?: unknown }).questions;
  if (!Array.isArray(items)) return [];
  return items
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const o = row as Record<string, unknown>;
      const excerpt = String(o.excerpt ?? o.text ?? o.question ?? "").slice(0, 500);
      const type = String(o.type ?? "Theory") as ClassifiedQuestion["type"];
      const difficulty = String(o.difficulty ?? "Medium") as ClassifiedQuestion["difficulty"];
      const t =
        type === "MCQ" || type === "Theory" || type === "Numerical" ? type : "Theory";
      const d =
        difficulty === "Easy" || difficulty === "Medium" || difficulty === "Hard"
          ? difficulty
          : "Medium";
      if (!excerpt) return null;
      return { excerpt, type: t, difficulty: d };
    })
    .filter(Boolean) as ClassifiedQuestion[];
}

function normalizeImportance(raw: unknown, topics: TopicFrequencyRow[]): TopicImportanceRow[] {
  if (!raw || typeof raw !== "object") return [];
  const rankings =
    (raw as { rankings?: unknown }).rankings ??
    (raw as { topicImportanceRanking?: unknown }).topicImportanceRanking;
  if (!Array.isArray(rankings)) return [];
  const rows = rankings
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const o = row as Record<string, unknown>;
      const name = String(o.name ?? "").trim();
      const imp = String(o.importance ?? "Medium");
      const importance =
        imp === "High" || imp === "Medium" || imp === "Low" ? imp : "Medium";
      if (!name) return null;
      return {
        name,
        importance,
        rationale: o.rationale != null ? String(o.rationale) : undefined,
      };
    })
    .filter(Boolean) as TopicImportanceRow[];

  if (rows.length) return rows;
  return topics.map((t) => ({
    name: t.name,
    importance: t.frequency >= 3 ? "High" : t.frequency >= 2 ? "Medium" : "Low",
  }));
}

function normalizeSyllabusReport(raw: unknown): SyllabusCoverageReport {
  if (!raw || typeof raw !== "object") {
    return {
      percentCovered: 0,
      coveredTopics: [],
      gapTopics: [],
      notes: "Upload syllabus via /api/syllabus for a full coverage report.",
    };
  }
  const o = raw as Record<string, unknown>;
  return {
    percentCovered: Number(o.percentCovered ?? o.percent_covered ?? 0) || 0,
    coveredTopics: Array.isArray(o.coveredTopics)
      ? o.coveredTopics.map(String)
      : Array.isArray(o.covered_topics)
        ? o.covered_topics.map(String)
        : [],
    gapTopics: Array.isArray(o.gapTopics)
      ? o.gapTopics.map(String)
      : Array.isArray(o.gap_topics)
        ? o.gap_topics.map(String)
        : [],
    notes: o.notes != null ? String(o.notes) : undefined,
  };
}

export function mergeGroqAnalyzeResults(
  topicJson: unknown,
  classifyJson: unknown,
  importanceJson: unknown,
  syllabusJson: unknown | null,
  existingPlan: ExamAnalysisPayload["smartStudyPlan"],
  existingPractice: ExamAnalysisPayload["practiceQuestions"]
): ExamAnalysisPayload {
  const topicFrequencyTable = normalizeTopics(topicJson);
  const items = normalizeClassifications(classifyJson);
  const summary = summarizePatterns(items);
  const questionPatternAnalysis: QuestionPatternAnalysis = { summary, items };
  const topicImportanceRanking = normalizeImportance(importanceJson, topicFrequencyTable);
  const syllabusCoverageReport = syllabusJson
    ? normalizeSyllabusReport(syllabusJson)
    : {
        percentCovered: 0,
        coveredTopics: [],
        gapTopics: [],
        notes: "No syllabus on file. POST /api/syllabus with syllabusText to compute coverage.",
      };

  return {
    topicFrequencyTable,
    topicImportanceRanking,
    questionPatternAnalysis,
    syllabusCoverageReport,
    smartStudyPlan: existingPlan ?? null,
    visualDashboard: buildVisualDashboard(topicFrequencyTable, summary),
    practiceQuestions: existingPractice ?? null,
  };
}
