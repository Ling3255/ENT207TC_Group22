import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/eligibility/[applicantId]/results
export async function GET(request: NextRequest, { params }: { params: Promise<{ applicantId: string }> }) {
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

  return NextResponse.json(evaluations);
}
