import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  apiHandler,
  successResponse,
  errorResponse,
  requireRole,
  parseJsonBody,
} from "@/lib/api-utils";

// GET /api/programmes - Public read
export const GET = apiHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const universityId = searchParams.get("universityId");
  const degreeType = searchParams.get("degreeType");
  const search = searchParams.get("search");
  const isActive = searchParams.get("isActive");

  const where: Record<string, unknown> = {};
  if (universityId) where.university_id = universityId;
  if (degreeType) where.degree_type = degreeType;
  if (isActive !== null) where.is_active = isActive === "true";
  else where.is_active = true;
  if (search) {
    where.OR = [
      { programme_name: { contains: search, mode: "insensitive" } },
      { department: { contains: search, mode: "insensitive" } },
      { university: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const programmes = await prisma.programme.findMany({
    where,
    include: {
      university: true,
      academic_requirements: true,
      language_requirements: true,
      documents: true,
      compliance: true,
      prerequisite_modules: true,
      _count: { select: { evaluations: true } },
    },
    orderBy: [
      { university: { rank: "asc" } },
      { programme_name: "asc" },
    ],
  });

  return successResponse(programmes);
});

// POST /api/programmes - Admin/Staff only
export const POST = apiHandler(async (request: NextRequest) => {
  await requireRole(request, ["SUPER_ADMIN", "STAFF"]);

  const body = await parseJsonBody<Record<string, unknown>>(request);
  const {
    university_id,
    programme_name,
    slug,
    degree_type,
    official_url,
  } = body;

  if (!university_id || !programme_name || !slug || !degree_type || !official_url) {
    return errorResponse("Missing required fields: university_id, programme_name, slug, degree_type, official_url", 400);
  }

  const programme = await prisma.programme.create({
    data: {
      university_id: String(university_id),
      programme_name: String(programme_name),
      slug: String(slug),
      degree_type: String(degree_type),
      department: body.department ? String(body.department) : null,
      study_mode: body.study_mode ? String(body.study_mode) : null,
      duration_text: body.duration_text ? String(body.duration_text) : null,
      intake_term: body.intake_term ? String(body.intake_term) : null,
      application_system_type: body.application_system_type
        ? String(body.application_system_type)
        : null,
      application_open_date: body.application_open_date
        ? new Date(String(body.application_open_date))
        : undefined,
      application_deadline_visa: body.application_deadline_visa
        ? new Date(String(body.application_deadline_visa))
        : undefined,
      application_deadline_non_visa: body.application_deadline_non_visa
        ? new Date(String(body.application_deadline_non_visa))
        : undefined,
      tuition_fee_home_gbp: body.tuition_fee_home_gbp
        ? parseFloat(String(body.tuition_fee_home_gbp))
        : null,
      tuition_fee_overseas_gbp: body.tuition_fee_overseas_gbp
        ? parseFloat(String(body.tuition_fee_overseas_gbp))
        : null,
      official_url: String(official_url),
      source_last_checked_at: body.source_last_checked_at
        ? new Date(String(body.source_last_checked_at))
        : undefined,
      source_page_title: body.source_page_title
        ? String(body.source_page_title)
        : null,
      raw_requirement_text: body.raw_requirement_text
        ? String(body.raw_requirement_text)
        : null,
      parser_version: body.parser_version
        ? String(body.parser_version)
        : null,
      human_verified: body.human_verified === true,
      confidence_score: body.confidence_score
        ? parseInt(String(body.confidence_score))
        : null,
      academic_requirements: (body.academic_requirements as unknown)
        ? { create: body.academic_requirements as object }
        : undefined,
      language_requirements: (body.language_requirements as unknown)
        ? { create: body.language_requirements as object }
        : undefined,
      documents: (body.documents as unknown)
        ? { create: body.documents as object }
        : undefined,
      compliance: (body.compliance as unknown)
        ? { create: body.compliance as object }
        : undefined,
      prerequisite_modules: Array.isArray(body.prerequisite_modules)
        ? {
            create: (body.prerequisite_modules as Array<Record<string, unknown>>).map((m) => ({
              canonical_module_name: String(m.canonical_module_name),
              display_text: String(m.display_text),
              min_grade_rule: m.min_grade_rule ? String(m.min_grade_rule) : null,
              required: m.required === false ? false : true,
            })),
          }
        : undefined,
    },
    include: {
      university: true,
      academic_requirements: true,
      language_requirements: true,
      documents: true,
      compliance: true,
      prerequisite_modules: true,
    },
  });

  return successResponse(programme, 201);
});
