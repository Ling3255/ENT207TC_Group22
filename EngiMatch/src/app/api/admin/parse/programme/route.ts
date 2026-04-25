import { NextRequest } from "next/server";
import { parseProgrammePage } from "@/lib/crawler/rule-parser";
import { extractTextContent } from "@/lib/crawler/html-cleaner";
import { prisma } from "@/lib/prisma";
import {
  apiHandler,
  successResponse,
  errorResponse,
  requireRole,
  parseJsonBody,
  assertString,
} from "@/lib/api-utils";

// POST /api/admin/parse/programme
export const POST = apiHandler(async (request: NextRequest) => {
  await requireRole(request, ["SUPER_ADMIN", "STAFF"]);

  const body = await parseJsonBody<Record<string, unknown>>(request);
  const programmeId = assertString(body.programmeId, "programmeId");
  const rawText = assertString(body.rawText, "rawText");
  const useHtmlCleaner = body.useHtmlCleaner !== false;

  const cleaned = useHtmlCleaner ? extractTextContent(rawText) : rawText;
  const parsed = parseProgrammePage(cleaned);

  const arData = {
    min_degree_level: "bachelor",
    min_uk_classification: parsed.min_uk_classification,
    accepted_backgrounds: parsed.accepted_backgrounds,
    prerequisite_module_logic: "ALL",
  };

  const lrData = {
    ielts_overall: parsed.ielts_overall,
    ielts_lrw_min: parsed.ielts_lrw_min,
    toefl_total: parsed.toefl_total,
  };

  const docData = {
    transcript_required: parsed.transcript_required,
    personal_statement_required: parsed.personal_statement_required,
    references_required_count: parsed.references_required_count,
    cv_resume_required: parsed.cv_resume_required,
  };

  const complianceData = {
    atas_possible: parsed.atas_possible,
    atas_rule_text: parsed.atas_rule_text,
  };

  await Promise.all([
    prisma.programmeAcademicRequirement.upsert({
      where: { programme_id: programmeId },
      update: arData,
      create: { programme_id: programmeId, ...arData },
    }),
    prisma.programmeLanguageRequirement.upsert({
      where: { programme_id: programmeId },
      update: lrData,
      create: { programme_id: programmeId, ...lrData },
    }),
    prisma.programmeDocument.upsert({
      where: { programme_id: programmeId },
      update: docData,
      create: { programme_id: programmeId, ...docData },
    }),
    prisma.programmeCompliance.upsert({
      where: { programme_id: programmeId },
      update: complianceData,
      create: { programme_id: programmeId, ...complianceData },
    }),
  ]);

  await prisma.prerequisiteModule.deleteMany({
    where: { programme_id: programmeId },
  });
  if (parsed.prerequisite_modules.length > 0) {
    await prisma.prerequisiteModule.createMany({
      data: parsed.prerequisite_modules.map((m) => ({
        programme_id: programmeId,
        canonical_module_name: m.canonical,
        display_text: m.display,
        required: m.required,
      })),
    });
  }

  await prisma.programme.update({
    where: { id: programmeId },
    data: {
      parser_version: "v0.1",
      confidence_score: parsed.confidence_score,
      human_verified: false,
    },
  });

  const programme = await prisma.programme.findUnique({
    where: { id: programmeId },
    include: {
      university: true,
      academic_requirements: true,
      language_requirements: true,
      documents: true,
      compliance: true,
      prerequisite_modules: true,
    },
  });

  return successResponse({ parsed, programme });
});
