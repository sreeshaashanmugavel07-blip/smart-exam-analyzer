import { NextRequest, NextResponse } from "next/server";
import { mergeGroqAnalyzeResults } from "@/lib/analysis-builder";
import { groqJson } from "@/lib/groq";
import {
  classificationPrompt,
  importancePrompt,
  syllabusCoveragePrompt,
  topicExtractionPrompt,
} from "@/lib/prompts";
import { prisma } from "@/lib/prisma";
import { cleanExtractedText } from "@/lib/text-extract";
import type { ExamAnalysisPayload } from "@/types/analysis";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const paperId = body.paperId as string | undefined;
    const text = body.text as string | undefined;
    const syllabusText = body.syllabusText as string | undefined;

    let examText: string;
    let paper =
      paperId != null
        ? await prisma.examPaper.findUnique({ where: { id: paperId } })
        : null;

    if (paper) {
      examText = paper.extractedText;
    } else if (text?.trim()) {
      examText = cleanExtractedText(text);
      paper = await prisma.examPaper.create({
        data: { extractedText: examText },
      });
    } else {
      return NextResponse.json(
        { error: "Provide paperId or text" },
        { status: 400 }
      );
    }

    if (typeof syllabusText === "string" && syllabusText.trim()) {
      const trimmed = syllabusText.trim();
      await prisma.examPaper.update({
        where: { id: paper.id },
        data: { syllabusText: trimmed },
      });
    }

    const paperRow = await prisma.examPaper.findUnique({
      where: { id: paper.id },
    });
    const savedSyllabus = paperRow?.syllabusText?.trim() ?? "";

    const topicsResult = await groqJson(
      topicExtractionPrompt(examText),
      "Extract topics. JSON only."
    );

    const topicList = Array.isArray((topicsResult as { topics?: unknown }).topics)
      ? (
          (topicsResult as { topics: { name: string; frequency: number }[] })
            .topics
        ).map((t) => ({
          name: String(t.name),
          frequency: Number(t.frequency) || 0,
        }))
      : [];

    const [classifyResult, importanceResult] = await Promise.all([
      groqJson(
        classificationPrompt(examText),
        "Classify questions. JSON only."
      ),
      groqJson(
        importancePrompt(topicList),
        "Importance ranking. JSON only."
      ),
    ]);

    let syllabusResult: unknown | null = null;
    if (savedSyllabus) {
      const names = topicList.map((t) => t.name);
      syllabusResult = await groqJson(
        syllabusCoveragePrompt(savedSyllabus, names),
        "Syllabus coverage. JSON only."
      );
    }

    const prev =
      paperRow?.analysis && typeof paperRow.analysis === "object"
        ? (paperRow.analysis as unknown as ExamAnalysisPayload)
        : null;

    const payload = mergeGroqAnalyzeResults(
      topicsResult,
      classifyResult,
      importanceResult,
      syllabusResult,
      prev?.smartStudyPlan ?? null,
      prev?.practiceQuestions ?? null
    );

    await prisma.examPaper.update({
      where: { id: paper.id },
      data: { analysis: payload as object },
    });

    return NextResponse.json({ ...payload, paperId: paper.id });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Analyze failed" },
      { status: 500 }
    );
  }
}
