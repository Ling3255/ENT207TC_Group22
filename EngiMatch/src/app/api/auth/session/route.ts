import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { apiHandler, successResponse } from "@/lib/api-utils";

// GET /api/auth/session - Get current session
export const GET = apiHandler(async (request: NextRequest) => {
  const token = request.cookies.get("engimatch_token")?.value;

  if (!token) {
    return successResponse({ authenticated: false, user: null });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return successResponse({ authenticated: false, user: null });
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });

  if (!user || user.status !== "APPROVED") {
    return successResponse({ authenticated: false, user: null });
  }

  return successResponse({
    authenticated: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      applicant_id: user.applicant_id,
      timeline_graduation_year: user.timeline_graduation_year,
      timeline_study_year: user.timeline_study_year,
    },
  });
});
