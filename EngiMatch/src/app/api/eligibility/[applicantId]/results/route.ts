import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  apiHandler,
  successResponse,
  requireAuth,
} from "@/lib/api-utils";

type RouteParams = { params: Promise<{ applicantId: string }> };

// GET /api/eligibility/[applicantId]/results
export const GET = apiHandler(async (request: NextRequest, { params }: RouteParams) => {
  await requireAuth(request);

  const { applicantId } = await params;
  const { searchParams } = new URL(request.url);
  const band = searchParams.get("band"); // "eligible" | "borderline" | "not_eligible"

  const where: Record<string, unknown> = { applicant_id: applicantId };
  if (band) where.eligibility_band = band;

  const evaluations = await prisma.evaluation.findMany({
    where,
    include: {
      programme: {
        include: {
          university: true,
          academic_requirements: true,
          language_requirements: true,
          compliance: true,
          prerequisite_modules: true,
        },
      },
    },
    orderBy: { created_at: "desc" },
  });

  return successResponse(evaluations);
});
