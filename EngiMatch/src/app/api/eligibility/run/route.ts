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

type ProgrammeIdRow = Awaited<ReturnType<typeof findActiveProgrammeIds>>[number];

function findActiveProgrammeIds() {
  return prisma.programme.findMany({
    where: { is_active: true },
    select: { id: true },
  });
}

// POST /api/eligibility/run
// Body: { applicantId, programmeId? }
export const POST = apiHandler(async (request: NextRequest) => {
  await requireAuth(request);

  const body = await parseJsonBody<Record<string, unknown>>(request);
  const applicantId = assertString(body.applicantId, "applicantId");

  const applicant = await prisma.applicant.findUnique({ where: { id: applicantId } });
  if (!applicant) {
    return errorResponse("Applicant not found", 404);
  }

  let targetIds: string[] = [];
  if (typeof body.programmeId === "string") {
    targetIds = [body.programmeId];
  } else if (Array.isArray(body.programmeIds) && body.programmeIds.length > 0) {
    targetIds = body.programmeIds.map(String);
  } else {
    const all = await findActiveProgrammeIds();
    targetIds = all.map((p: ProgrammeIdRow) => p.id);
  }

  // Parallel evaluation for better performance
  const results = await Promise.all(
    targetIds.map(async (pid) => {
      const result = await evaluateApplicantForProgramme(applicantId, pid);
      await saveEvaluation(result);
      return result;
    })
  );

  return successResponse({ applicantId, evaluatedCount: results.length, results });
});
