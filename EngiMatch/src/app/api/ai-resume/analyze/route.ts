/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import { chatCompletion } from "@/lib/ai-client";
import {
  apiHandler,
  assertArray,
  assertString,
  errorResponse,
  parseJsonBody,
  requireAuth,
  successResponse,
} from "@/lib/api-utils";
import { getAiResumeMajorLabel, normalizeAiResumeMajor } from "@/lib/ai-resume-majors";

const REQUEST_TIMEOUT_MS = 60_000;

type Locale = "zh" | "en";

type ResumeAiSection = {
  type: string;
  title: string;
  content: string;
};

export const POST = apiHandler(async (req: NextRequest) => {
  await requireAuth(req);

  const body = await parseJsonBody<Record<string, unknown>>(req);
  const rawSections = assertArray<Record<string, unknown>>(body.sections, "sections");
  const sections: ResumeAiSection[] = rawSections.map((section, index) => ({
    type: assertString(section.type, `sections[${index}].type`),
    title: typeof section.title === "string" ? section.title : "",
    content: assertString(section.content, `sections[${index}].content`),
  }));

  const major = normalizeAiResumeMajor(typeof body.major === "string" ? body.major : "");
  const action = assertString(body.action, "action");
  const locale: Locale = body.locale === "en" ? "en" : "zh";

  if (action === "diagnose") {
    const prompt = buildDiagnosePrompt(sections, major, locale);
    const systemPrompt =
      locale === "en"
        ? "You are a professional UK MSc admissions consultant specializing in engineering and computing programmes. Analyze resumes for UK postgraduate applications and provide detailed, actionable feedback in English. Be critical but constructive. Focus on what UK admissions officers look for in strong taught Master's candidates."
        : "你是一位专业的英国硕士申请顾问，专注于工程与计算机相关专业。请从英国授课型硕士招生官的视角，给出严格但建设性的简历分析，并提供具体可执行的改进建议。";

    const result = (await Promise.race([
      chatCompletion(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        { temperature: 0.3, maxTokens: 3000 }
      ),
      new Promise<never>((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                locale === "en"
                  ? "AI response timeout (60s), please retry."
                  : "AI 响应超时（60 秒），请重试。"
              )
            ),
          REQUEST_TIMEOUT_MS
        )
      ),
    ])) as string;

    const trimmed = (result || "").trim();
    if (!trimmed) {
      throw new Error(locale === "en" ? "AI returned empty content." : "AI 返回内容为空。");
    }

    return successResponse({ analysis: trimmed });
  }

  if (action === "optimize") {
    const sectionType = assertString(body.sectionType, "sectionType");
    const original = assertString(body.original, "original");
    const instruction = typeof body.instruction === "string" ? body.instruction : undefined;

    const prompt = buildOptimizePrompt(sectionType, original, major, instruction, locale);
    const systemPrompt =
      locale === "en"
        ? "You are a professional CV editor for UK engineering and computing taught Master's applications. Rewrite resume content in strong professional English. Make descriptions specific, action-oriented, technically grounded, and quantifiable where possible. Provide 2-3 distinct rewrite versions."
        : "你是一位专业的英国工程与计算机硕士申请简历编辑。请把简历内容改写得更专业、更具体、更有行动力，并尽可能突出技术方法与量化成果。请提供 2-3 个不同侧重点的版本。";

    const result = (await Promise.race([
      chatCompletion(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        { temperature: 0.4, maxTokens: 2000 }
      ),
      new Promise<never>((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                locale === "en"
                  ? "AI response timeout (60s), please retry."
                  : "AI 响应超时（60 秒），请重试。"
              )
            ),
          REQUEST_TIMEOUT_MS
        )
      ),
    ])) as string;

    const trimmed = (result || "").trim();
    if (!trimmed) {
      throw new Error(locale === "en" ? "AI returned empty content." : "AI 返回内容为空。");
    }

    return successResponse({ optimized: trimmed });
  }

  return errorResponse("Unknown action", 400);
});

function buildDiagnosePrompt(
  sections: Array<{ type: string; title: string; content: string }>,
  major: string,
  locale: Locale
): string {
  const label = getAiResumeMajorLabel(major, locale);
  const sectionsText = sections
    .map((section, index) => `[Section ${index + 1}] Type: ${section.type} / ${section.title}\n${section.content}`)
    .join("\n\n");

  if (locale === "en") {
    return `Please analyze the following resume for a UK taught Master's application in ${label}.

Resume Content:
${sectionsText}

Return the diagnostic result in JSON format:
{
  "issues": [
    {
      "dimension": "structure | completeness | target_fit | english_quality",
      "severity": "high | medium | low",
      "title": "Issue title in English",
      "description": "Detailed description of the issue in English",
      "suggestion": "Specific optimization suggestion in English",
      "sectionIndex": 1
    }
  ],
  "overall_score": 0,
  "summary": "Overall review in English (1-2 sentences)",
  "missing": ["Suggestions for additional content in English"]
}`;
  }

  return `请分析下面这份简历，目标是申请英国授课型硕士，专业方向为${label}。

简历内容：
${sectionsText}

请严格按照 JSON 格式返回：
{
  "issues": [
    {
      "dimension": "structure | completeness | target_fit | english_quality",
      "severity": "high | medium | low",
      "title": "问题标题（中文）",
      "description": "详细问题说明（中文）",
      "suggestion": "具体优化建议（中文）",
      "sectionIndex": 1
    }
  ],
  "overall_score": 0,
  "summary": "整体评价（中文，1-2 句）",
  "missing": ["建议补充的内容（中文）"]
}`;
}

function buildOptimizePrompt(
  sectionType: string,
  original: string,
  major: string,
  instruction?: string,
  locale: Locale = "zh"
): string {
  const label = getAiResumeMajorLabel(major, locale);

  if (locale === "en") {
    return `Please rewrite the following resume section for a UK taught Master's application in ${label}.

Section Type: ${sectionType}
Original Content:
${original}

${instruction ? `Special Requirements: ${instruction}` : ""}

Please provide 2-3 rewritten versions. For each version, start with a title in brackets on its own line, like this:
【Conservative Polish】
(rewritten content here)
---
【Major-Focused Version】
(rewritten content here)
---
【Results-Oriented Version】
(rewritten content here)

Requirements:
- Each version title must be on its own line, wrapped in 【】 brackets
- Separate versions with --- on its own line
- Do not add any explanation or commentary outside the versions
- Only output the rewritten text`;
  }

  return `请重写下面这段简历内容，用于申请英国授课型硕士，专业方向为${label}。

段落类型：${sectionType}
原始内容：
${original}

${instruction ? `额外要求：${instruction}` : ""}

请提供 2-3 个不同版本。每个版本开头用【】标注版本名称，独占一行，格式如下：
【保守润色版】
（改写内容）
---
【专业强化版】
（改写内容）
---
【成果导向版】
（改写内容）

要求：
- 每个版本名称必须独占一行，用【】包裹
- 版本之间用 --- 分隔，独占一行
- 不要输出任何解释或评论
- 只输出改写后的文本`;
}
