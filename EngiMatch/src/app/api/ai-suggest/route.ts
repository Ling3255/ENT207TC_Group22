import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireAuth,
  apiHandler,
  successResponse,
  errorResponse,
  parseJsonBody,
  assertString,
} from "@/lib/api-utils";
import { getOpenAIClient } from "@/modules/ai/client";
import { buildSuggestPrompt, getSuggestSystemPrompt } from "@/modules/ai";

type ApplicantWithModules = NonNullable<
  Awaited<ReturnType<typeof findApplicantWithModules>>
>;

type EvaluationWithProgramme = Awaited<
  ReturnType<typeof findEvaluationsWithProgramme>
>[number];

type ProgrammeWithDetails = Awaited<
  ReturnType<typeof findProgrammesWithDetails>
>[number];

function findApplicantWithModules(applicantId: string, userEmail: string, userApplicantId?: string | null) {
  return prisma.applicant.findFirst({
    where: {
      id: applicantId,
      OR: [{ email: userEmail }, ...(userApplicantId ? [{ id: userApplicantId }] : [])],
    },
    include: { modules: true },
  });
}

function findProgrammesWithDetails() {
  return prisma.programme.findMany({
    where: { is_active: true },
    include: {
      university: true,
      academic_requirements: true,
      language_requirements: true,
      prerequisite_modules: true,
    },
  });
}

function findEvaluationsWithProgramme(applicantId: string) {
  return prisma.evaluation.findMany({
    where: { applicant_id: applicantId },
    include: { programme: { include: { university: true } } },
  });
}

// POST /api/ai-suggest
// Body: { applicantId }
export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuth(request);

  const body = await parseJsonBody<Record<string, unknown>>(request);
  const applicantId = assertString(body.applicantId, "applicantId");

  const applicant = await findApplicantWithModules(
    applicantId,
    user.email,
    user.applicant_id
  );

  if (!applicant) {
    return errorResponse("Applicant not found or not authorized", 404);
  }

  const programmes = await findProgrammesWithDetails();
  const evaluations = await findEvaluationsWithProgramme(applicantId);

  const typedApplicant = applicant as ApplicantWithModules;
  const typedProgrammes = programmes as ProgrammeWithDetails[];
  const typedEvaluations = evaluations as EvaluationWithProgramme[];

  const prompt = buildSuggestPrompt({
    applicant: {
      fullName: typedApplicant.full_name || "",
      undergradUniversity: typedApplicant.undergrad_university || "",
      undergradMajor: typedApplicant.undergrad_major || "",
      gpaNumeric: typedApplicant.gpa_numeric?.toString() ?? null,
      gpaScale: typedApplicant.gpa_scale?.toString() ?? null,
      ieltsOverall: typedApplicant.ielts_overall?.toString() ?? null,
      toeflTotal: typedApplicant.toefl_total?.toString() ?? null,
      targetTracks: typedApplicant.target_tracks,
    },
    modules: typedApplicant.modules.map((m) => ({
      moduleName: m.module_name_raw,
      grade: m.grade_text,
      credits: m.credits,
    })),
    evaluations: typedEvaluations.map((e) => ({
      universityName: e.programme.university.name,
      programmeName: e.programme.programme_name,
      band:
        e.eligibility_band === "eligible"
          ? "符合"
          : e.eligibility_band === "borderline"
            ? "边缘"
            : "不符合",
    })),
    programmes: typedProgrammes.map((p) => ({
      universityName: p.university.name,
      programmeName: p.programme_name,
      minClassification: p.academic_requirements?.min_uk_classification ?? null,
      ieltsOverall: p.language_requirements?.ielts_overall?.toString() ?? null,
      prerequisites: p.prerequisite_modules.map((m) => m.display_text),
    })),
  });

  const ai = getOpenAIClient();

  try {
    const completion = await ai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "deepseek-chat",
      messages: [
        { role: "system", content: getSuggestSystemPrompt() },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const suggestion =
      completion.choices[0]?.message?.content || "AI 未能生成建议，请稍后重试。";

    return successResponse({
      applicantId,
      suggestion,
      promptTokens: completion.usage?.prompt_tokens,
      completionTokens: completion.usage?.completion_tokens,
    });
  } catch (err) {
    console.error("AI suggest error:", err);
    return errorResponse("AI 服务暂时不可用，请稍后重试", 500);
  }
});
