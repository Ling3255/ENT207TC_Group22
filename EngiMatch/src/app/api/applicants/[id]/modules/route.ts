import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normaliseModule } from "@/lib/taxonomy";

type RouteParams = { params: Promise<{ id: string }> };

function parseDecimal(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  return parseFloat(String(v));
}

// GET /api/applicants/[id]/modules
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const modules = await prisma.applicantModule.findMany({
    where: { applicant_id: id },
    orderBy: { module_name_raw: "asc" },
  });
  return NextResponse.json(modules);
}

// POST /api/applicants/[id]/modules
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { modules } = body;

    if (!Array.isArray(modules) || modules.length === 0) {
      return NextResponse.json({ error: "modules array is required" }, { status: 400 });
    }

    // Verify applicant exists
    const applicant = await prisma.applicant.findUnique({ where: { id } });
    if (!applicant) {
      return NextResponse.json({ error: "Applicant not found" }, { status: 404 });
    }

    const createdModuleIds: string[] = [];
    for (const m of modules) {
      const created = await prisma.applicantModule.create({
        data: {
          applicant_id: id,
          module_name_raw: m.module_name_raw,
          canonical_module_name: m.canonical_module_name ?? normaliseModule(m.module_name_raw),
          grade_text: m.grade_text ?? null,
              grade_numeric: m.grade_numeric !== undefined && m.grade_numeric !== null ? String(m.grade_numeric) : null,
          credits: m.credits ? parseInt(m.credits) : null,
        },
      });
      createdModuleIds.push(created.id);
    }

    return NextResponse.json({ count: createdModuleIds.length }, { status: 201 });
  } catch (error) {
    console.error("POST /api/applicants/[id]/modules error:", error);
    return NextResponse.json({ error: "Failed to add modules" }, { status: 500 });
  }
}

// DELETE /api/applicants/[id]/modules — clear all
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  await prisma.applicantModule.deleteMany({ where: { applicant_id: id } });
  return NextResponse.json({ success: true });
}
