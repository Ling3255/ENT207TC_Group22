import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  apiHandler,
  successResponse,
  errorResponse,
  requireRole,
  parseJsonBody,
} from "@/lib/api-utils";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/programmes/[id] - Public read
export const GET = apiHandler(async (_request: NextRequest, { params }: RouteParams) => {
  const { id } = await params;
  const programme = await prisma.programme.findUnique({
    where: { id },
    include: {
      university: true,
      academic_requirements: true,
      language_requirements: true,
      documents: true,
      compliance: true,
      prerequisite_modules: true,
      evaluations: {
        include: { applicant: { select: { full_name: true, email: true } } },
        orderBy: { created_at: "desc" },
        take: 10,
      },
    },
  });
  if (!programme) return errorResponse("Not found", 404);
  return successResponse(programme);
});

// PATCH /api/programmes/[id] - Admin/Staff only
export const PATCH = apiHandler(async (request: NextRequest, { params }: RouteParams) => {
  await requireRole(request, ["SUPER_ADMIN", "STAFF"]);

  const { id } = await params;
  const body = await parseJsonBody<Record<string, unknown>>(request);

  // Handle nested updates
  if (body.academic_requirements !== undefined) {
    await prisma.programmeAcademicRequirement.deleteMany({ where: { programme_id: id } });
  }
  if (body.language_requirements !== undefined) {
    await prisma.programmeLanguageRequirement.deleteMany({ where: { programme_id: id } });
  }
  if (body.documents !== undefined) {
    await prisma.programmeDocument.deleteMany({ where: { programme_id: id } });
  }
  if (body.compliance !== undefined) {
    await prisma.programmeCompliance.deleteMany({ where: { programme_id: id } });
  }
  if (body.prerequisite_modules !== undefined) {
    await prisma.prerequisiteModule.deleteMany({ where: { programme_id: id } });
  }

  const data: Record<string, unknown> = {};
  if (body.university_id !== undefined) data.university_id = String(body.university_id);
  if (body.programme_name !== undefined) data.programme_name = String(body.programme_name);
  if (body.slug !== undefined) data.slug = String(body.slug);
  if (body.degree_type !== undefined) data.degree_type = String(body.degree_type);
  if (body.department !== undefined) data.department = body.department ? String(body.department) : null;
  if (body.study_mode !== undefined) data.study_mode = body.study_mode ? String(body.study_mode) : null;
  if (body.duration_text !== undefined) data.duration_text = body.duration_text ? String(body.duration_text) : null;
  if (body.intake_term !== undefined) data.intake_term = body.intake_term ? String(body.intake_term) : null;
  if (body.application_system_type !== undefined) data.application_system_type = body.application_system_type ? String(body.application_system_type) : null;
  if (body.application_open_date !== undefined) data.application_open_date = body.application_open_date ? new Date(String(body.application_open_date)) : null;
  if (body.application_deadline_visa !== undefined) data.application_deadline_visa = body.application_deadline_visa ? new Date(String(body.application_deadline_visa)) : null;
  if (body.application_deadline_non_visa !== undefined) data.application_deadline_non_visa = body.application_deadline_non_visa ? new Date(String(body.application_deadline_non_visa)) : null;
  if (body.tuition_fee_home_gbp !== undefined) data.tuition_fee_home_gbp = body.tuition_fee_home_gbp !== null ? parseFloat(String(body.tuition_fee_home_gbp)) : null;
  if (body.tuition_fee_overseas_gbp !== undefined) data.tuition_fee_overseas_gbp = body.tuition_fee_overseas_gbp !== null ? parseFloat(String(body.tuition_fee_overseas_gbp)) : null;
  if (body.official_url !== undefined) data.official_url = String(body.official_url);
  if (body.source_last_checked_at !== undefined) data.source_last_checked_at = body.source_last_checked_at ? new Date(String(body.source_last_checked_at)) : null;
  if (body.source_page_title !== undefined) data.source_page_title = body.source_page_title ? String(body.source_page_title) : null;
  if (body.raw_requirement_text !== undefined) data.raw_requirement_text = body.raw_requirement_text ? String(body.raw_requirement_text) : null;
  if (body.parser_version !== undefined) data.parser_version = body.parser_version ? String(body.parser_version) : null;
  if (body.human_verified !== undefined) data.human_verified = body.human_verified === true;
  if (body.confidence_score !== undefined) data.confidence_score = body.confidence_score !== null ? parseInt(String(body.confidence_score)) : null;
  if (body.is_active !== undefined) data.is_active = body.is_active === true;

  if (body.academic_requirements && typeof body.academic_requirements === "object") {
    data.academic_requirements = { create: body.academic_requirements };
  }
  if (body.language_requirements && typeof body.language_requirements === "object") {
    data.language_requirements = { create: body.language_requirements };
  }
  if (body.documents && typeof body.documents === "object") {
    data.documents = { create: body.documents };
  }
  if (body.compliance && typeof body.compliance === "object") {
    data.compliance = { create: body.compliance };
  }
  if (Array.isArray(body.prerequisite_modules) && body.prerequisite_modules.length > 0) {
    data.prerequisite_modules = {
      create: (body.prerequisite_modules as Array<Record<string, unknown>>).map((m) => ({
        canonical_module_name: String(m.canonical_module_name),
        display_text: String(m.display_text),
        min_grade_rule: m.min_grade_rule ? String(m.min_grade_rule) : null,
        required: m.required === false ? false : true,
      })),
    };
  }

  const programme = await prisma.programme.update({
    where: { id },
    data,
    include: {
      university: true,
      academic_requirements: true,
      language_requirements: true,
      documents: true,
      compliance: true,
      prerequisite_modules: true,
    },
  });

  return successResponse(programme);
});

// DELETE /api/programmes/[id] - Admin/Staff only (soft delete)
export const DELETE = apiHandler(async (request: NextRequest, { params }: RouteParams) => {
  await requireRole(request, ["SUPER_ADMIN", "STAFF"]);

  const { id } = await params;
  await prisma.programme.update({ where: { id }, data: { is_active: false } });
  return successResponse({ message: "Programme deactivated" });
});
