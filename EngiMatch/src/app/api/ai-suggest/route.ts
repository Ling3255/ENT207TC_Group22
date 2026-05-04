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
import { getOpenAIClient } from "@/lib/ai-client";

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

  const modulesText = typedApplicant.modules
    .map(
      (m: ApplicantWithModules["modules"][number]) =>
        `- ${m.module_name_raw} (${m.grade_text || "N/A"}, ${m.credits || "N/A"} credits)`
    )
    .join("\n");

  const evalSummary = typedEvaluations
    .map((e: EvaluationWithProgramme) => {
      const band =
        e.eligibility_band === "eligible"
          ? "符合"
          : e.eligibility_band === "borderline"
            ? "边缘"
            : "不符合";
      return `- ${e.programme.university.name} - ${e.programme.programme_name}: ${band}`;
    })
    .join("\n");

  const programmesText = typedProgrammes
    .slice(0, 20)
    .map((p: ProgrammeWithDetails) => {
      const ar = p.academic_requirements;
      const lr = p.language_requirements;
      const prerequisiteText = p.prerequisite_modules
        .map(
          (m: ProgrammeWithDetails["prerequisite_modules"][number]) => m.display_text
        )
        .join(", ");

      return `- ${p.university.name}: ${p.programme_name}
  要求: ${ar?.min_uk_classification || "N/A"}, 雅思 ${lr?.ielts_overall || "N/A"}
  先修: ${prerequisiteText || "无"}`;
    })
    .join("\n");

  const prompt = `你是一位英国工程硕士申请顾问。请根据以下学生背景，给出 3-5 所最适合申请的英国大学及专业建议，并说明理由。

【学生背景】
- 姓名: ${typedApplicant.full_name || "未填写"}
- 本科院校: ${typedApplicant.undergrad_university || "未填写"}
- 本科专业: ${typedApplicant.undergrad_major || "未填写"}
- GPA: ${typedApplicant.gpa_numeric || "N/A"}/${typedApplicant.gpa_scale}
- 雅思: ${typedApplicant.ielts_overall || "未提交"}
- 托福: ${typedApplicant.toefl_total || "未提交"}
- 目标方向: ${typedApplicant.target_tracks.join(", ") || "未选择"}
- 课程列表:
${modulesText || "未填写"}

【系统匹配结果】
${evalSummary || "暂无匹配结果"}

【可选项目】
${programmesText}

请按以下格式回答（使用中文）：

## 综合评估
简要分析学生的优势和不足。

## 推荐院校（按冲刺/主申/保底分类）

### 冲刺院校 (Reach)
1. **大学名称 - 项目名称**
   - 推荐理由
   - 申请建议

### 主申院校 (Match)
1. **大学名称 - 项目名称**
   - 推荐理由
   - 申请建议

### 保底院校 (Safety)
1. **大学名称 - 项目名称**
   - 推荐理由
   - 申请建议

## 提升建议
针对该学生背景，给出具体的提升建议（如语言成绩、课程补充、实习经历等）。`;

  const ai = getOpenAIClient();

  try {
    const completion = await ai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "deepseek-chat",
      messages: [
        {
          role: "system",
          content:
            "你是一位资深的英国工程硕士留学申请顾问，熟悉英国各大院校的录取要求和申请策略。请给出专业、具体、可操作的建议。",
        },
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
