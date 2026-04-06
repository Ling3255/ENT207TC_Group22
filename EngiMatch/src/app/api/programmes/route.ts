import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/programmes
export async function GET(request: NextRequest) {
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

  return NextResponse.json(programmes);
}

// POST /api/programmes
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      university_id,
      programme_name,
      slug,
      degree_type,
      department,
      study_mode,
      duration_text,
      intake_term,
      application_system_type,
      application_open_date,
      application_deadline_visa,
      application_deadline_non_visa,
      tuition_fee_home_gbp,
      tuition_fee_overseas_gbp,
      official_url,
      source_last_checked_at,
      source_page_title,
      raw_requirement_text,
      parser_version,
      human_verified,
      confidence_score,
      // Nested
      academic_requirements,
      language_requirements,
      documents,
      compliance,
      prerequisite_modules,
    } = body;

    if (!university_id || !programme_name || !slug || !degree_type || !official_url) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const programme = await prisma.programme.create({
      data: {
        university_id,
        programme_name,
        slug,
        degree_type,
        department,
        study_mode,
        duration_text,
        intake_term,
        application_system_type,
        application_open_date: application_open_date ? new Date(application_open_date) : undefined,
        application_deadline_visa: application_deadline_visa ? new Date(application_deadline_visa) : undefined,
        application_deadline_non_visa: application_deadline_non_visa ? new Date(application_deadline_non_visa) : undefined,
        tuition_fee_home_gbp: tuition_fee_home_gbp ? parseFloat(tuition_fee_home_gbp) : null,
        tuition_fee_overseas_gbp: tuition_fee_overseas_gbp ? parseFloat(tuition_fee_overseas_gbp) : null,
        official_url,
        source_last_checked_at: source_last_checked_at ? new Date(source_last_checked_at) : undefined,
        source_page_title,
        raw_requirement_text,
        parser_version,
        human_verified: human_verified ?? false,
        confidence_score: confidence_score ? parseInt(confidence_score) : null,
        academic_requirements: academic_requirements
          ? { create: academic_requirements }
          : undefined,
        language_requirements: language_requirements
          ? { create: language_requirements }
          : undefined,
        documents: documents
          ? { create: documents }
          : undefined,
        compliance: compliance
          ? { create: compliance }
          : undefined,
        prerequisite_modules: prerequisite_modules?.length > 0
          ? {
              create: prerequisite_modules.map((m: { canonical_module_name: string; display_text: string; min_grade_rule?: string; required?: boolean }) => ({
                canonical_module_name: m.canonical_module_name,
                display_text: m.display_text,
                min_grade_rule: m.min_grade_rule ?? null,
                required: m.required ?? true,
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

    return NextResponse.json(programme, { status: 201 });
  } catch (error) {
    console.error("POST /api/programmes error:", error);
    return NextResponse.json({ error: "Failed to create programme" }, { status: 500 });
  }
}
