import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normaliseMajor, normaliseModule } from "@/lib/taxonomy";

function parseDecimal(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  return parseFloat(String(v));
}

// GET /api/applicants
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "20");

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

  return NextResponse.json({ applicants, total, page, pageSize });
}

// POST /api/applicants
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      full_name, nationality, email,
      undergrad_university, undergrad_major,
      gpa_numeric, gpa_scale, grading_scheme, graduation_year,
      ielts_overall, ielts_listening, ielts_reading, ielts_writing, ielts_speaking,
      toefl_total, toefl_reading, toefl_listening, toefl_writing, toefl_speaking,
      pte_total, duolingo_total,
      target_tracks,
      modules,
    } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const existing = await prisma.applicant.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered", existingId: existing.id }, { status: 409 });
    }

    // Normalise major to canonical form
    const canonicalMajor = undergrad_major ? normaliseMajor(undergrad_major) : null;

    const applicant = await prisma.applicant.create({
      data: {
        full_name,
        nationality,
        email,
        undergrad_university,
        undergrad_major,
        undergrad_major_canonical: canonicalMajor,
        gpa_numeric: parseDecimal(gpa_numeric),
        gpa_scale: parseDecimal(gpa_scale) ?? 4.0,
        grading_scheme,
        graduation_year: graduation_year ? parseInt(graduation_year) : null,
        ielts_overall: parseDecimal(ielts_overall),
        ielts_listening: parseDecimal(ielts_listening),
        ielts_reading: parseDecimal(ielts_reading),
        ielts_writing: parseDecimal(ielts_writing),
        ielts_speaking: parseDecimal(ielts_speaking),
        toefl_total: toefl_total ? parseInt(toefl_total) : null,
        toefl_reading: toefl_reading ? parseInt(toefl_reading) : null,
        toefl_listening: toefl_listening ? parseInt(toefl_listening) : null,
        toefl_writing: toefl_writing ? parseInt(toefl_writing) : null,
        toefl_speaking: toefl_speaking ? parseInt(toefl_speaking) : null,
        pte_total: pte_total ? parseInt(pte_total) : null,
        duolingo_total: duolingo_total ? parseInt(duolingo_total) : null,
        target_tracks: target_tracks ?? [],
        modules: modules?.length > 0
          ? {
              create: modules.map((m: { module_name_raw: string; canonical_module_name?: string; grade_text?: string; grade_numeric?: number; credits?: number }) => ({
                module_name_raw: m.module_name_raw,
                canonical_module_name: m.canonical_module_name ?? normaliseModule(m.module_name_raw),
                grade_text: m.grade_text ?? null,
                grade_numeric: m.grade_numeric !== undefined && m.grade_numeric !== null ? String(m.grade_numeric) : null,
                credits: m.credits ?? null,
              })),
            }
          : undefined,
      },
      include: { modules: true },
    });

    return NextResponse.json(applicant, { status: 201 });
  } catch (error) {
    console.error("POST /api/applicants error:", error);
    return NextResponse.json({ error: "Failed to create applicant" }, { status: 500 });
  }
}
