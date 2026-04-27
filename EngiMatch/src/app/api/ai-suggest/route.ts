import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiHandler, successResponse, errorResponse, parseJsonBody, assertString } from "@/lib/api-utils";
import { getOpenAIClient } from "@/lib/ai-client";

// POST /api/ai-suggest
// Body: { applicantId }
export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuth(request);

  const body = await parseJsonBody<Record<string, unknown>>(request);
  const applicantId = assertString(body.applicantId, "applicantId");

  // Verify applicant belongs to current user
  const applicant = await prisma.applicant.findFirst({
    where: {
      id: applicantId,
      OR: [
        { email: user.email },
        ...(user.applicant_id ? [{ id: user.applicant_id }] : []),
      ],
    },
    include: { modules: true },
  });
  if (!applicant) {
    return errorResponse("Applicant not found or not authorized", 404);
  }

  // Get all active programmes with details
  const programmes = await prisma.programme.findMany({
    where: { is_active: true },
    include: {
      university: true,
      academic_requirements: true,
      language_requirements: true,
      prerequisite_modules: true,
    },
  });

  // Get existing evaluations
  const evaluations = await prisma.evaluation.findMany({
    where: { applicant_id: applicantId },
    include: { programme: { include: { university: true } } },
  });

  // Build prompt
  const modulesText = applicant.modules.map(m => `- ${m.module_name_raw} (${m.grade_text || "N/A"}, ${m.credits || "N/A"} credits)`).join("\n");

  const evalSummary = evaluations.map(e => {
    const band = e.eligibility_band === "eligible" ? "符合" : e.eligibility_band === "borderline" ? "边缘" : "不符合";
    return `- ${e.programme.university.name} - ${e.programme.programme_name}: ${band}`;
  }).join("\n");

  const programmesText = programmes.slice(0, 20).map(p => {
    const ar = p.academic_requirements;
    const lr = p.language_requirements;
    return `- ${p.university.name}: ${p.programme_name}\n  要求: ${ar?.min_uk_classification || "N/A"}, 雅思 ${lr?.ielts_overall || "N/A"}\n  先修: ${p.prerequisite_modules.map(m => m.display_text).join(", ") || "无"}`;
  }).join("\n");

  const prompt = `你是一位英国工程硕士申请顾问。请根据以下学生背景，给出3-5所最适合申请的英国大学及专业建议，并说明理由。

【学生背景】
- 姓名: ${applicant.full_name || "未填写"}
- 本科院校: ${applicant.undergrad_university || "未填写"}
- 本科专业: ${applicant.undergrad_major || "未填写"}
- GPA: ${applicant.gpa_numeric || "N/A"}/${applicant.gpa_scale}
- 雅思: ${applicant.ielts_overall || "未提交"}
- 托福: ${applicant.toefl_total || "未提交"}
- 目标方向: ${applicant.target_tracks.join(", ") || "未选择"}
- 课程列表:\n${modulesText || "未填写"}

【系统匹配结果】\n${evalSummary || "暂无匹配结果"}

【可选项目】\n${programmesText}

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

  // Call AI
  const ai = getOpenAIClient();
  try {
    const completion = await ai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "deepseek-chat",
      messages: [
        { role: "system", content: "你是一位资深的英国工程硕士留学申请顾问，熟悉英国各大院校的录取要求和申请策略。请给出专业、具体、可操作的建议。" },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const suggestion = completion.choices[0]?.message?.content || "AI 未能生成建议，请稍后重试。";

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
