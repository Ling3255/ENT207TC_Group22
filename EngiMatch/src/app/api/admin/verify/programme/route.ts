import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  apiHandler,
  successResponse,
  errorResponse,
  requireRole,
  parseJsonBody,
  assertString,
} from "@/lib/api-utils";

// POST /api/admin/verify/programme
export const POST = apiHandler(async (request: NextRequest) => {
  await requireRole(request, ["SUPER_ADMIN", "STAFF"]);

  const body = await parseJsonBody<Record<string, unknown>>(request);
  const programmeId = assertString(body.programmeId, "programmeId");
  const humanVerified = body.human_verified === true;
  const corrections = body.corrections as Record<string, unknown> | undefined;

  const updateData: Record<string, unknown> = {
    human_verified: humanVerified,
  };

  if (corrections && typeof corrections === "object") {
    const {
      academic_requirements,
      language_requirements,
      documents,
      compliance,
      prerequisite_modules,
      ...flat
    } = corrections;

    if (flat.human_verified !== undefined)
      updateData.human_verified = flat.human_verified === true;
    if (flat.parser_version !== undefined)
      updateData.parser_version = String(flat.parser_version);
    if (flat.confidence_score !== undefined)
      updateData.confidence_score = parseInt(String(flat.confidence_score));

    const upsertTasks = [];
    if (academic_requirements && typeof academic_requirements === "object") {
      upsertTasks.push(
        prisma.programmeAcademicRequirement.upsert({
          where: { programme_id: programmeId },
          update: academic_requirements,
          create: { programme_id: programmeId, ...(academic_requirements as object) },
        })
      );
    }
    if (language_requirements && typeof language_requirements === "object") {
      upsertTasks.push(
        prisma.programmeLanguageRequirement.upsert({
          where: { programme_id: programmeId },
          update: language_requirements,
          create: { programme_id: programmeId, ...(language_requirements as object) },
        })
      );
    }
    if (documents && typeof documents === "object") {
      upsertTasks.push(
        prisma.programmeDocument.upsert({
          where: { programme_id: programmeId },
          update: documents,
          create: { programme_id: programmeId, ...(documents as object) },
        })
      );
    }
    if (compliance && typeof compliance === "object") {
      upsertTasks.push(
        prisma.programmeCompliance.upsert({
          where: { programme_id: programmeId },
          update: compliance,
          create: { programme_id: programmeId, ...(compliance as object) },
        })
      );
    }
    if (Array.isArray(prerequisite_modules)) {
      await prisma.prerequisiteModule.deleteMany({
        where: { programme_id: programmeId },
      });
      if (prerequisite_modules.length > 0) {
        upsertTasks.push(
          prisma.prerequisiteModule.createMany({
            data: prerequisite_modules.map(
              (m: { canonical_module_name: string; display_text: string; min_grade_rule?: string; required?: boolean }) => ({
                programme_id: programmeId,
                ...m,
              })
            ),
          })
        );
      }
    }
    if (upsertTasks.length > 0) await Promise.all(upsertTasks);
  }

  const programme = await prisma.programme.update({
    where: { id: programmeId },
    data: updateData,
    include: {
      university: true,
      academic_requirements: true,
      language_requirements: true,
      documents: true,
      compliance: true,
      prerequisite_modules: true,
    },
  });

  return successResponse({ programme });
});
