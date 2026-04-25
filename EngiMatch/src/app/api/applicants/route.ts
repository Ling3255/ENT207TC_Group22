import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { normaliseMajor, normaliseModule } from "@/lib/taxonomy";
import {
  apiHandler,
  successResponse,
  errorResponse,
  requireAuth,
  parseJsonBody,
  assertString,
} from "@/lib/api-utils";

function parseDecimal(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  return parseFloat(String(v));
}

// GET /api/applicants - Authenticated
export const GET = apiHandler(async (request: NextRequest) => {
  await requireAuth(request);

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "20")));

  const [applicants, total] = await Promise.all([
    prisma.applicant.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { created_at: "desc" },
      include: {
        modules: { take: 5 },
        _count: { select: { evaluations: true } },
      },
    }),
    prisma.applicant.count(),
  ]);

  return successResponse({ applicants, total, page, pageSize });
});

// POST /api/applicants - Create a new applicant for current user
export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuth(request);

  const body = await parseJsonBody<Record<string, unknown>>(request);

  // Use current user's email
  const email = user.email;

  // Validate field lengths
  const fullName = typeof body.full_name === "string" ? body.full_name : null;
  if (fullName && fullName.length > 200) {
    return errorResponse("Name too long", 400);
  }
  const university = typeof body.undergrad_university === "string" ? body.undergrad_university : null;
  if (university && university.length > 500) {
    return errorResponse("University name too long", 400);
  }
  const major = typeof body.undergrad_major === "string" ? body.undergrad_major : null;
  if (major && major.length > 500) {
    return errorResponse("Major name too long", 400);
  }

  const canonicalMajor = major ? normaliseMajor(major) : null;

  const modules = Array.isArray(body.modules)
    ? (body.modules as Array<Record<string, unknown>>).map((m) => ({
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
      }))
    : undefined;

  const applicant = await prisma.applicant.create({
    data: {
      full_name: fullName,
      nationality: typeof body.nationality === "string" ? body.nationality : null,
      email,
      user_id: user.id,
      undergrad_university: university,
      undergrad_major: major,
      undergrad_major_canonical: canonicalMajor,
      gpa_numeric: parseDecimal(body.gpa_numeric),
      gpa_scale: parseDecimal(body.gpa_scale) ?? 4.0,
      grading_scheme: typeof body.grading_scheme === "string" ? body.grading_scheme : null,
      graduation_year: body.graduation_year !== undefined && body.graduation_year !== null ? parseInt(String(body.graduation_year)) : null,
      ielts_overall: parseDecimal(body.ielts_overall),
      ielts_listening: parseDecimal(body.ielts_listening),
      ielts_reading: parseDecimal(body.ielts_reading),
      ielts_writing: parseDecimal(body.ielts_writing),
      ielts_speaking: parseDecimal(body.ielts_speaking),
      toefl_total: body.toefl_total !== undefined && body.toefl_total !== null ? parseInt(String(body.toefl_total)) : null,
      toefl_reading: body.toefl_reading !== undefined && body.toefl_reading !== null ? parseInt(String(body.toefl_reading)) : null,
      toefl_listening: body.toefl_listening !== undefined && body.toefl_listening !== null ? parseInt(String(body.toefl_listening)) : null,
      toefl_writing: body.toefl_writing !== undefined && body.toefl_writing !== null ? parseInt(String(body.toefl_writing)) : null,
      toefl_speaking: body.toefl_speaking !== undefined && body.toefl_speaking !== null ? parseInt(String(body.toefl_speaking)) : null,
      pte_total: body.pte_total !== undefined && body.pte_total !== null ? parseInt(String(body.pte_total)) : null,
      duolingo_total: body.duolingo_total !== undefined && body.duolingo_total !== null ? parseInt(String(body.duolingo_total)) : null,
      target_tracks: Array.isArray(body.target_tracks) ? body.target_tracks.map(String) : [],
      modules: modules ? { create: modules } : undefined,
    },
    include: { modules: true },
  });

  // Update user's active applicant to the new one
  await prisma.user.update({
    where: { id: user.id },
    data: { applicant_id: applicant.id },
  });

  return successResponse(applicant, 201);
});
