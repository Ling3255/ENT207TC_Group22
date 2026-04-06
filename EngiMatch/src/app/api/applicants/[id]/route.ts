import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normaliseMajor, normaliseModule } from "@/lib/taxonomy";

type RouteParams = { params: Promise<{ id: string }> };

function parseDecimal(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  return parseFloat(String(v));
}

// GET /api/applicants/[id]
export async function GET(_request: NextRequest, { params }: RouteParams) {
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
  if (!applicant) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(applicant);
}

// PATCH /api/applicants/[id]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { modules, ...rest } = body;

    if (modules !== undefined) {
      await prisma.applicantModule.deleteMany({ where: { applicant_id: id } });
    }

    const canonicalMajor = rest.undergrad_major ? normaliseMajor(rest.undergrad_major) : undefined;

    const applicant = await prisma.applicant.update({
      where: { id },
      data: {
        ...rest,
        ...(rest.gpa_numeric !== undefined && { gpa_numeric: parseDecimal(rest.gpa_numeric) }),
        ...(rest.gpa_scale !== undefined && { gpa_scale: parseDecimal(rest.gpa_scale) }),
        ...(rest.graduation_year !== undefined && { graduation_year: parseInt(rest.graduation_year) }),
        ...(rest.ielts_overall !== undefined && { ielts_overall: parseDecimal(rest.ielts_overall) }),
        ...(rest.undergrad_major !== undefined && { undergrad_major_canonical: canonicalMajor }),
        ...(modules !== undefined && {
          modules: {
            create: modules.map((m: { module_name_raw: string; canonical_module_name?: string; grade_text?: string; grade_numeric?: number; credits?: number }) => ({
              module_name_raw: m.module_name_raw,
              canonical_module_name: m.canonical_module_name ?? normaliseModule(m.module_name_raw),
              grade_text: m.grade_text ?? null,
              grade_numeric: m.grade_numeric !== undefined && m.grade_numeric !== null ? String(m.grade_numeric) : null,
              credits: m.credits ?? null,
            })),
          },
        }),
      },
      include: { modules: true },
    });

    return NextResponse.json(applicant);
  } catch (error) {
    console.error("PATCH /api/applicants/[id] error:", error);
    return NextResponse.json({ error: "Failed to update applicant" }, { status: 500 });
  }
}

// DELETE /api/applicants/[id]
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    await prisma.applicant.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
