import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  ApiError,
  requireAuth,
  apiHandler,
  successResponse,
  parseJsonBody,
  assertString,
} from "@/lib/api-utils";

function parseOptionalIntegerField(
  value: unknown,
  fieldName: string,
  options: { min: number; max: number }
) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;

  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    throw new ApiError(`${fieldName} must be an integer`, 400);
  }
  if (parsed < options.min || parsed > options.max) {
    throw new ApiError(
      `${fieldName} must be between ${options.min} and ${options.max}`,
      400
    );
  }

  return parsed;
}

// GET /api/auth/profile - Get current user profile
export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuth(request);
  return successResponse({
    id: user.id,
    email: user.email,
    name: user.name,
    timeline_graduation_year: user.timeline_graduation_year,
    timeline_study_year: user.timeline_study_year,
    role: user.role,
    status: user.status,
    created_at: user.created_at,
    last_login_at: user.last_login_at,
    applicant_id: user.applicant_id,
  });
});

// PATCH /api/auth/profile - Update current user profile
export const PATCH = apiHandler(async (request: NextRequest) => {
  const user = await requireAuth(request);
  const body = (await parseJsonBody(request)) as Record<string, unknown>;
  const data: Record<string, unknown> = {};

  if (body.name !== undefined) {
    data.name = assertString(body.name, "name", { maxLength: 100 });
  }

  const timelineGraduationYear = parseOptionalIntegerField(
    body.timelineGraduationYear,
    "timelineGraduationYear",
    { min: 2020, max: 2100 }
  );
  if (timelineGraduationYear !== undefined) {
    data.timeline_graduation_year = timelineGraduationYear;
  }

  const timelineStudyYear = parseOptionalIntegerField(
    body.timelineStudyYear,
    "timelineStudyYear",
    { min: 1, max: 5 }
  );
  if (timelineStudyYear !== undefined) {
    data.timeline_study_year = timelineStudyYear;
  }

  if (Object.keys(data).length === 0) {
    throw new ApiError("No profile fields to update", 400);
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data,
  });

  return successResponse({
    id: updated.id,
    email: updated.email,
    name: updated.name,
    timeline_graduation_year: updated.timeline_graduation_year,
    timeline_study_year: updated.timeline_study_year,
    role: updated.role,
    status: updated.status,
  });
});
