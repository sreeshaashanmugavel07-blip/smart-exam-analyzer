import { NextRequest, NextResponse } from "next/server";
import { groqJson } from "@/lib/groq";
import { studyPlanPrompt } from "@/lib/prompts";
import { prisma } from "@/lib/prisma";
import type { ExamAnalysisPayload, SmartStudyPlan } from "@/types/analysis";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const paperId = body.paperId as string;
    const days = Number(body.days ?? 7);

    if (!paperId?.trim()) {
      return NextResponse.json({ error: "paperId required" }, { status: 400 });
    }

    const paper = await prisma.examPaper.findUnique({ where: { id: paperId } });
    if (!paper) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }

    const analysis = paper.analysis as unknown as ExamAnalysisPayload | null;
    if (!analysis?.topicImportanceRanking?.length) {
      return NextResponse.json(
        { error: "Run /api/analyze first for this paper" },
        { status: 400 }
      );
    }

    const high = analysis.topicImportanceRanking
      .filter((t) => t.importance === "High")
      .map((t) => t.name);

    const topicsForPlan = high.length ? high : analysis.topicFrequencyTable.map((t) => t.name);

    const plan = await groqJson<SmartStudyPlan>(
      studyPlanPrompt(topicsForPlan, Math.min(Math.max(days, 1), 30)),
      "Study plan. JSON only."
    );

    const merged: ExamAnalysisPayload = {
      ...analysis,
      smartStudyPlan: plan,
    };

    await prisma.examPaper.update({
      where: { id: paperId },
      data: {
        studyPlan: plan as object,
        analysis: merged as object,
      },
    });

    return NextResponse.json({ smartStudyPlan: plan, analysis: merged });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Plan generation failed" },
      { status: 500 }
    );
  }
}
