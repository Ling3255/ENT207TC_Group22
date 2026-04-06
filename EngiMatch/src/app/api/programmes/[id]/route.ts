import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/programmes/[id]
export async function GET(_request: NextRequest, { params }: RouteParams) {
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
  if (!programme) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(programme);
}

// PATCH /api/programmes/[id]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    const body = await request.json();
    const {
      // flat fields
      university_id, programme_name, slug, degree_type, department,
      study_mode, duration_text, intake_term,
      application_system_type, application_open_date,
      application_deadline_visa, application_deadline_non_visa,
      tuition_fee_home_gbp, tuition_fee_overseas_gbp,
      official_url, source_last_checked_at, source_page_title,
      raw_requirement_text, parser_version, human_verified, confidence_score,
      is_active,
      // nested
      academic_requirements, language_requirements, documents,
      compliance, prerequisite_modules,
    } = body;

    // Handle nested updates
    if (academic_requirements !== undefined) {
      await prisma.programmeAcademicRequirement.deleteMany({ where: { programme_id: id } });
    }
    if (language_requirements !== undefined) {
      await prisma.programmeLanguageRequirement.deleteMany({ where: { programme_id: id } });
    }
    if (documents !== undefined) {
      await prisma.programmeDocument.deleteMany({ where: { programme_id: id } });
    }
    if (compliance !== undefined) {
      await prisma.programmeCompliance.deleteMany({ where: { programme_id: id } });
    }
    if (prerequisite_modules !== undefined) {
      await prisma.prerequisiteModule.deleteMany({ where: { programme_id: id } });
    }

    const programme = await prisma.programme.update({
      where: { id },
      data: {
        ...(university_id && { university_id }),
        ...(programme_name && { programme_name }),
        ...(slug && { slug }),
        ...(degree_type && { degree_type }),
        ...(department !== undefined && { department }),
        ...(study_mode !== undefined && { study_mode }),
        ...(duration_text !== undefined && { duration_text }),
        ...(intake_term !== undefined && { intake_term }),
        ...(application_system_type !== undefined && { application_system_type }),
        ...(application_open_date !== undefined && { application_open_date: application_open_date ? new Date(application_open_date) : null }),
        ...(application_deadline_visa !== undefined && { application_deadline_visa: application_deadline_visa ? new Date(application_deadline_visa) : null }),
        ...(application_deadline_non_visa !== undefined && { application_deadline_non_visa: application_deadline_non_visa ? new Date(application_deadline_non_visa) : null }),
        ...(tuition_fee_home_gbp !== undefined && { tuition_fee_home_gbp: tuition_fee_home_gbp !== null ? parseFloat(tuition_fee_home_gbp) : null }),
        ...(tuition_fee_overseas_gbp !== undefined && { tuition_fee_overseas_gbp: tuition_fee_overseas_gbp !== null ? parseFloat(tuition_fee_overseas_gbp) : null }),
        ...(official_url && { official_url }),
        ...(source_last_checked_at !== undefined && { source_last_checked_at: source_last_checked_at ? new Date(source_last_checked_at) : null }),
        ...(source_page_title !== undefined && { source_page_title }),
        ...(raw_requirement_text !== undefined && { raw_requirement_text }),
        ...(parser_version !== undefined && { parser_version }),
        ...(human_verified !== undefined && { human_verified }),
        ...(confidence_score !== undefined && { confidence_score: confidence_score !== null ? parseInt(confidence_score) : null }),
        ...(is_active !== undefined && { is_active }),
        ...(academic_requirements && { academic_requirements: { create: academic_requirements } }),
        ...(language_requirements && { language_requirements: { create: language_requirements } }),
        ...(documents && { documents: { create: documents } }),
        ...(compliance && { compliance: { create: compliance } }),
        ...(prerequisite_modules && prerequisite_modules.length > 0 && {
          prerequisite_modules: {
            create: prerequisite_modules.map((m: { canonical_module_name: string; display_text: string; min_grade_rule?: string; required?: boolean }) => ({
              canonical_module_name: m.canonical_module_name,
              display_text: m.display_text,
              min_grade_rule: m.min_grade_rule ?? null,
              required: m.required ?? true,
            })),
          },
        }),
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

    return NextResponse.json(programme);
  } catch (error) {
    console.error("PATCH /api/programmes/[id] error:", error);
    return NextResponse.json({ error: "Failed to update programme" }, { status: 500 });
  }
}

// DELETE /api/programmes/[id] — soft delete
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  await prisma.programme.update({ where: { id }, data: { is_active: false } });
  return NextResponse.json({ success: true });
}
