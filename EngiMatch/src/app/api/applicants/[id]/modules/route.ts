import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { normaliseModule } from "@/lib/taxonomy";
import {
  apiHandler,
  successResponse,
  errorResponse,
  requireAuth,
  parseJsonBody,
  assertArray,
} from "@/lib/api-utils";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/applicants/[id]/modules - Authenticated
export const GET = apiHandler(async (request: NextRequest, { params }: RouteParams) => {
  await requireAuth(request);

  const { id } = await params;
  const modules = await prisma.applicantModule.findMany({
    where: { applicant_id: id },
    orderBy: { module_name_raw: "asc" },
  });
  return successResponse(modules);
});

// POST /api/applicants/[id]/modules - Authenticated
export const POST = apiHandler(async (request: NextRequest, { params }: RouteParams) => {
  await requireAuth(request);

  const { id } = await params;
  const body = await parseJsonBody<Record<string, unknown>>(request);
  const modules = assertArray<Record<string, unknown>>(body.modules, "modules");

  // Verify applicant exists
  const applicant = await prisma.applicant.findUnique({ where: { id } });
  if (!applicant) {
    return errorResponse("Applicant not found", 404);
  }

  const createdModuleIds: string[] = [];
  for (const m of modules) {
    const created = await prisma.applicantModule.create({
      data: {
        applicant_id: id,
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
      },
    });
    createdModuleIds.push(created.id);
  }

  return successResponse({ count: createdModuleIds.length }, 201);
});

// DELETE /api/applicants/[id]/modules - Authenticated (clear all)
export const DELETE = apiHandler(async (request: NextRequest, { params }: RouteParams) => {
  await requireAuth(request);

  const { id } = await params;
  await prisma.applicantModule.deleteMany({ where: { applicant_id: id } });
  return successResponse({ message: "All modules cleared" });
});
