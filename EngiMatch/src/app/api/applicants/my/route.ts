import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiHandler, successResponse } from "@/lib/api-utils";

// GET /api/applicants/my - Get all applicants for current user
export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuth(request);

  const applicants = await prisma.applicant.findMany({
    where: {
      OR: [
        { user_id: user.id },
        { email: user.email },
        ...(user.applicant_id ? [{ id: user.applicant_id }] : []),
      ],
    },
    include: {
      modules: true,
      _count: { select: { evaluations: true } },
    },
    orderBy: { created_at: "desc" },
  });

  return successResponse(applicants);
});
