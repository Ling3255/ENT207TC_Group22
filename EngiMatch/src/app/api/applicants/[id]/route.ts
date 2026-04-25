import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { normaliseMajor, normaliseModule } from "@/lib/taxonomy";
import {
  apiHandler,
  successResponse,
  errorResponse,
  requireAuth,
  parseJsonBody,
} from "@/lib/api-utils";

type RouteParams = { params: Promise<{ id: string }> };

function parseDecimal(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  return parseFloat(String(v));
}

// GET /api/applicants/[id] - Authenticated
export const GET = apiHandler(async (request: NextRequest, { params }: RouteParams) => {
  const user = await requireAuth(request);

  const { id } = await params;
  const applicant = await prisma.applicant.findUnique({
    where: { id },
    include: {
      modules: { orderBy: { module_name_raw: "asc" } },
      evaluations: {
        include: {
          programme: { include: { university: true } },
        },
        orderBy: { created_at: "desc" },
      },
    },
  });
  if (!applicant) return errorResponse("Not found", 404);
  if (applicant.user_id !== user.id && applicant.email !== user.email) {
    return errorResponse("Forbidden", 403);
  }
  return successResponse(applicant);
});

// PATCH /api/applicants/[id] - Authenticated
export const PATCH = apiHandler(async (request: NextRequest, { params }: RouteParams) => {
  const user = await requireAuth(request);

  const { id } = await params;
  const existingApplicant = await prisma.applicant.findUnique({
    where: { id },
    select: { id: true, user_id: true, email: true },
  });
  if (!existingApplicant) return errorResponse("Not found", 404);
  if (
    existingApplicant.user_id !== user.id &&
    existingApplicant.email !== user.email
  ) {
    return errorResponse("Forbidden", 403);
  }

  const body = await parseJsonBody<Record<string, unknown>>(request);
  const { modules, ...rest } = body;

  if (modules !== undefined) {
    await prisma.applicantModule.deleteMany({ where: { applicant_id: id } });
  }

  const canonicalMajor =
    typeof rest.undergrad_major === "string"
      ? normaliseMajor(rest.undergrad_major)
      : undefined;

  const data: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(rest)) {
    if (value !== undefined) data[key] = value;
  }

  if (rest.gpa_numeric !== undefined) data.gpa_numeric = parseDecimal(rest.gpa_numeric);
  if (rest.gpa_scale !== undefined) data.gpa_scale = parseDecimal(rest.gpa_scale);
  if (rest.graduation_year !== undefined && rest.graduation_year !== null) {
    data.graduation_year = parseInt(String(rest.graduation_year));
  }
  if (rest.ielts_overall !== undefined) data.ielts_overall = parseDecimal(rest.ielts_overall);
  if (rest.undergrad_major !== undefined) data.undergrad_major_canonical = canonicalMajor;

  if (modules !== undefined && Array.isArray(modules)) {
    data.modules = {
      create: modules.map((m: Record<string, unknown>) => ({
        module_name_raw: String(m.module_name_raw),
        canonical_module_name:
          typeof m.canonical_module_name === "string"
            ? m.canonical_module_name
            : normaliseModule(String(m.module_name_raw)),
        grade_text: typeof m.grade_text === "string" ? m.grade_text : null,
        grade_numeric:
          m.grade_numeric !== undefined && m.grade_numeric !== null
            ? String(m.grade_numeric)
            : null,
        credits: m.credits !== undefined && m.credits !== null ? parseInt(String(m.credits)) : null,
      })),
    };
  }

  const applicant = await prisma.applicant.update({
    where: { id },
    data: {
      ...data,
      user_id: user.id,
      email: user.email,
    },
    include: { modules: true },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { applicant_id: applicant.id },
  });

  return successResponse(applicant);
});

// DELETE /api/applicants/[id] - Authenticated
export const DELETE = apiHandler(async (request: NextRequest, { params }: RouteParams) => {
  const user = await requireAuth(request);

  const { id } = await params;
  const existingApplicant = await prisma.applicant.findUnique({
    where: { id },
    select: { id: true, user_id: true, email: true },
  });
  if (!existingApplicant) return errorResponse("Not found", 404);
  if (
    existingApplicant.user_id !== user.id &&
    existingApplicant.email !== user.email
  ) {
    return errorResponse("Forbidden", 403);
  }

  await prisma.applicant.delete({ where: { id } });

  const latestApplicant = await prisma.applicant.findFirst({
    where: {
      OR: [{ user_id: user.id }, { email: user.email }],
    },
    orderBy: { updated_at: "desc" },
    select: { id: true },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { applicant_id: latestApplicant?.id ?? null },
  });

  return successResponse({ message: "Applicant deleted" });
});
