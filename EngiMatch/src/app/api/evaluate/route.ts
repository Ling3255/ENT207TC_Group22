import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  evaluateApplicantForProgramme,
  saveEvaluation,
} from "@/lib/evaluation/engine";
import {
  apiHandler,
  successResponse,
  errorResponse,
  requireAuth,
  parseJsonBody,
  assertString,
} from "@/lib/api-utils";

// POST /api/evaluate
// Body: { applicantId, programmeId } - evaluate single programme
// Body: { applicantId } - evaluate all active programmes
// Body: { applicantId, programmeIds[] } - evaluate selected programmes
export const POST = apiHandler(async (request: NextRequest) => {
  await requireAuth(request);

  const body = await parseJsonBody<Record<string, unknown>>(request);
  const applicantId = assertString(body.applicantId, "applicantId");

  const applicant = await prisma.applicant.findUnique({ where: { id: applicantId } });
  if (!applicant) {
    return errorResponse("Applicant not found", 404);
  }

  let targetProgrammeIds: string[] = [];
  if (typeof body.programmeId === "string") {
    targetProgrammeIds = [body.programmeId];
  } else if (Array.isArray(body.programmeIds) && body.programmeIds.length > 0) {
    targetProgrammeIds = body.programmeIds.map(String);
  } else {
    const allProgrammes = await prisma.programme.findMany({
      where: { is_active: true },
      select: { id: true },
    });
    targetProgrammeIds = allProgrammes.map((p: { id: string }) => p.id);
  }

  // Parallel evaluation for better performance
  const results = await Promise.all(
    targetProgrammeIds.map(async (pid) => {
      const result = await evaluateApplicantForProgramme(applicantId, pid);
      await saveEvaluation(result);
      return result;
    })
  );

  return successResponse({
    applicantId,
    evaluatedCount: results.length,
    results,
  });
});

// GET /api/evaluate?applicantId=xxx - Get cached evaluations for applicant
export const GET = apiHandler(async (request: NextRequest) => {
  await requireAuth(request);

  const { searchParams } = new URL(request.url);
  const applicantId = searchParams.get("applicantId");
  const status = searchParams.get("status"); // eligible, borderline, not_eligible

  if (!applicantId) {
    return errorResponse("applicantId is required", 400);
  }

  const where: Record<string, unknown> = { applicant_id: applicantId };
  if (status) where.eligibility_band = status;

  const evaluations = await prisma.evaluation.findMany({
    where,
    include: {
      programme: { include: { university: true } },
    },
    orderBy: { created_at: "desc" },
  });

  return successResponse(evaluations);
});
