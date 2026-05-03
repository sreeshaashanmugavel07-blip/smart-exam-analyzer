import { NextRequest, NextResponse } from "next/server";
import { groqJson } from "@/lib/groq";
import { practiceQuestionsPrompt } from "@/lib/prompts";
import { prisma } from "@/lib/prisma";
import type { ExamAnalysisPayload, PracticeQuestion } from "@/types/analysis";

export const runtime = "nodejs";
export const maxDuration = 60;

function normalizeQuestions(raw: unknown): PracticeQuestion[] {
  if (!raw || typeof raw !== "object") return [];
  const qs = (raw as { questions?: unknown }).questions;
  if (!Array.isArray(qs)) return [];
  return qs.map((q) => {
    if (!q || typeof q !== "object") return { prompt: "" };
    const o = q as Record<string, unknown>;
    return {
      prompt: String(o.prompt ?? ""),
      type: o.type as PracticeQuestion["type"],
      difficulty: o.difficulty as PracticeQuestion["difficulty"],
      answerOutline:
        o.answerOutline != null ? String(o.answerOutline) : undefined,
    };
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const paperId = body.paperId as string;
    const topic = body.topic as string;

    if (!paperId?.trim() || !topic?.trim()) {
      return NextResponse.json(
        { error: "paperId and topic required" },
        { status: 400 }
      );
    }

    const paper = await prisma.examPaper.findUnique({ where: { id: paperId } });
    if (!paper) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }

    const raw = await groqJson(
      practiceQuestionsPrompt(topic.trim()),
      "Practice questions. JSON only."
    );
    const newQs = normalizeQuestions(raw);

    const analysis =
      (paper.analysis as unknown as ExamAnalysisPayload | null) ?? null;
    const prev = analysis?.practiceQuestions ?? [];
    const combined = [...(Array.isArray(prev) ? prev : []), ...newQs];

    const bank =
      (paper.practiceBank as Record<string, PracticeQuestion[]> | null) ?? {};
    bank[topic.trim()] = newQs;

    const mergedAnalysis: ExamAnalysisPayload | null = analysis
      ? { ...analysis, practiceQuestions: combined }
      : {
          topicFrequencyTable: [],
          topicImportanceRanking: [],
          questionPatternAnalysis: {
            summary: {
              mcq: 0,
              theory: 0,
              numerical: 0,
              easy: 0,
              medium: 0,
              hard: 0,
            },
            items: [],
          },
          syllabusCoverageReport: {
            percentCovered: 0,
            coveredTopics: [],
            gapTopics: [],
          },
          smartStudyPlan: null,
          visualDashboard: {
            topicFrequencyBars: [],
            typeDistribution: [],
            difficultyDistribution: [],
          },
          practiceQuestions: combined,
        };

    await prisma.examPaper.update({
      where: { id: paperId },
      data: {
        practiceBank: bank as object,
        analysis: mergedAnalysis as object,
      },
    });

    return NextResponse.json({
      questions: newQs,
      practiceQuestions: combined,
      analysis: mergedAnalysis,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Question generation failed" },
      { status: 500 }
    );
  }
}
