import { NextRequest, NextResponse } from "next/server";
import { evaluateApplicantForProgramme, saveEvaluation } from "@/lib/evaluation/engine";
import { prisma } from "@/lib/prisma";

// POST /api/evaluate
// Body: { applicantId, programmeId } - evaluate single programme
// Body: { applicantId } - evaluate all active programmes
// Body: { applicantId, programmeIds[] } - evaluate selected programmes
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { applicantId, programmeId, programmeIds } = body;

    if (!applicantId) {
      return NextResponse.json({ error: "applicantId is required" }, { status: 400 });
    }

    const applicant = await prisma.applicant.findUnique({ where: { id: applicantId } });
    if (!applicant) {
      return NextResponse.json({ error: "Applicant not found" }, { status: 404 });
    }

    let targetProgrammeIds: string[] = [];
    if (programmeId) {
      targetProgrammeIds = [programmeId];
    } else if (programmeIds && programmeIds.length > 0) {
      targetProgrammeIds = programmeIds;
    } else {
      // Evaluate against all active programmes
      const allProgrammes = await prisma.programme.findMany({
        where: { is_active: true },
        select: { id: true },
      });
      targetProgrammeIds = allProgrammes.map((p) => p.id);
    }

    const results = [];
    for (const pid of targetProgrammeIds) {
      const result = await evaluateApplicantForProgramme(applicantId, pid);
      await saveEvaluation(result);
      results.push(result);
    }

    return NextResponse.json({
      applicantId,
      evaluatedCount: results.length,
      results,
    });
  } catch (error) {
    console.error("POST /api/evaluate error:", error);
    return NextResponse.json({ error: "Evaluation failed" }, { status: 500 });
  }
}

// GET /api/evaluate?applicantId=xxx - Get cached evaluations for applicant
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const applicantId = searchParams.get("applicantId");
  const status = searchParams.get("status"); // ELIGIBLE, BORDERLINE, NOT_ELIGIBLE

  if (!applicantId) {
    return NextResponse.json({ error: "applicantId is required" }, { status: 400 });
  }

  const where: Record<string, unknown> = { applicant_id: applicantId };
  if (status) where.status = status;

  const evaluations = await prisma.evaluation.findMany({
    where,
    include: {
      programme: { include: { university: true } },
    },
    orderBy: { created_at: "desc" },
  });

  return NextResponse.json(evaluations);
}
