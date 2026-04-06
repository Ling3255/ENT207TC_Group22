import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  evaluateApplicantForProgramme,
  evaluateApplicantAllProgrammes,
  saveEvaluation,
} from "@/lib/evaluation/engine";

// POST /api/eligibility/run
// Body: { applicantId, programmeId? }
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

    let targetIds: string[] = [];
    if (programmeId) {
      targetIds = [programmeId];
    } else if (programmeIds?.length > 0) {
      targetIds = programmeIds;
    } else {
      const all = await prisma.programme.findMany({
        where: { is_active: true },
        select: { id: true },
      });
      targetIds = all.map((p) => p.id);
    }

    const results = [];
    for (const pid of targetIds) {
      const result = await evaluateApplicantForProgramme(applicantId, pid);
      await saveEvaluation(result);
      results.push(result);
    }

    return NextResponse.json({ applicantId, evaluatedCount: results.length, results });
  } catch (error) {
    console.error("POST /api/eligibility/run error:", error);
    return NextResponse.json({ error: "Evaluation failed" }, { status: 500 });
  }
}
