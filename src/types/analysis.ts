/** Mirrors server upload manifest for client display */
export interface UploadedSourceMeta {
  name: string;
  mimeType: string;
  size: number;
  kind: "pdf" | "image" | "text";
}

export type ImportanceLevel = "High" | "Medium" | "Low";
export type QuestionType = "MCQ" | "Theory" | "Numerical";
export type Difficulty = "Easy" | "Medium" | "Hard";

export interface TopicFrequencyRow {
  name: string;
  frequency: number;
}

export interface TopicImportanceRow {
  name: string;
  importance: ImportanceLevel;
  rationale?: string;
}

export interface ClassifiedQuestion {
  excerpt: string;
  type: QuestionType;
  difficulty: Difficulty;
}

export interface QuestionPatternAnalysis {
  summary: {
    mcq: number;
    theory: number;
    numerical: number;
    easy: number;
    medium: number;
    hard: number;
  };
  items: ClassifiedQuestion[];
}

export interface SyllabusCoverageReport {
  percentCovered: number;
  coveredTopics: string[];
  gapTopics: string[];
  notes?: string;
}

export interface StudyPlanDay {
  day: number;
  topics: string[];
  revision: boolean;
}

export interface SmartStudyPlan {
  plan: StudyPlanDay[];
}

export interface PracticeQuestion {
  prompt: string;
  type?: QuestionType;
  difficulty?: Difficulty;
  answerOutline?: string;
}

export interface VisualDashboard {
  topicFrequencyBars: TopicFrequencyRow[];
  typeDistribution: { label: string; value: number }[];
  difficultyDistribution: { label: string; value: number }[];
}

/** Strict merged payload returned by /api/analyze and shown on dashboard */
export interface ExamAnalysisPayload {
  topicFrequencyTable: TopicFrequencyRow[];
  topicImportanceRanking: TopicImportanceRow[];
  questionPatternAnalysis: QuestionPatternAnalysis;
  syllabusCoverageReport: SyllabusCoverageReport;
  smartStudyPlan: SmartStudyPlan | null;
  visualDashboard: VisualDashboard;
  practiceQuestions: PracticeQuestion[] | null;
}
