/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import { chatCompletion } from "@/lib/ai-client";
import {
  apiHandler,
  successResponse,
  errorResponse,
  requireAuth,
  parseJsonBody,
  assertArray,
  assertString,
} from "@/lib/api-utils";

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
  const major = typeof body.major === "string" ? body.major : "";
  const stage = typeof body.stage === "string" ? body.stage : "";
  const action = assertString(body.action, "action");
  const locale: Locale = body.locale === "en" ? "en" : "zh";

  if (action === "diagnose") {
    const prompt = buildDiagnosePrompt(sections, major, locale);
    const systemPrompt =
      locale === "en"
        ? `You are a professional UK MSc admissions consultant specializing in engineering programmes (Mechanical, Electrical, Control, Energy, etc.). Analyze resumes for UK postgraduate applications and provide detailed, actionable feedback in English. Be critical but constructive. Focus on what UK admissions officers look for in engineering MSc candidates. Always respond in English with English titles, descriptions and suggestions.`
        : `你是一位专业的英国工程硕士申请顾问，专注于机械、电气、控制、能源等工程方向。分析简历并用中文提供详细、可操作的反馈。保持批判性但建设性的态度。重点关注英国招生官在工程硕士申请者中寻找的内容。`;

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
                  ? "AI response timeout (60s), please retry"
                  : "AI 响应超时（60秒），请重试或减少简历内容"
              )
            ),
          REQUEST_TIMEOUT_MS
        )
      ),
    ])) as string;
    const trimmed = (result || "").trim();
    if (!trimmed) throw new Error("AI 返回内容为空");
    return successResponse({ analysis: trimmed });
  }

  if (action === "optimize") {
    const sectionType = assertString(body.sectionType, "sectionType");
    const original = assertString(body.original, "original");
    const instruction =
      typeof body.instruction === "string" ? body.instruction : undefined;

    const prompt = buildOptimizePrompt(
      sectionType,
      original,
      major,
      instruction,
      locale
    );
    const systemPrompt =
      locale === "en"
        ? `You are a professional CV editor for UK engineering MSc applications. Rewrite resumes in English. Make descriptions specific, action-oriented, and quantifiable. Use strong engineering verbs (Designed, Implemented, Analyzed, Simulated, Optimized, Developed). Focus on demonstrating technical competence, methodology, and outcomes. Provide 2-3 distinct rewrite versions with different emphasis. Always respond in English.`
        : `你是一位专业的英国工程硕士申请简历编辑。重写简历内容为英文（或原语言）。使描述具体、动词导向、可量化。使用强动词（Designed, Implemented, Analyzed, Simulated, Optimized, Developed）。专注于展示技术能力、方法和成果。提供2-3个不同侧重点的改写版本。`;

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
                  ? "AI response timeout (60s), please retry"
                  : "AI 响应超时（60秒），请重试或减少简历内容"
              )
            ),
          REQUEST_TIMEOUT_MS
        )
      ),
    ])) as string;
    const trimmed = (result || "").trim();
    if (!trimmed) throw new Error("AI 返回内容为空");
    return successResponse({ optimized: trimmed });
  }

  return errorResponse("Unknown action", 400);
});

function buildDiagnosePrompt(
  sections: Array<{ type: string; title: string; content: string }>,
  major: string,
  locale: Locale
): string {
  const majorLabels: Record<string, { zh: string; en: string }> = {
    mechanical: { zh: "机械工程", en: "Mechanical Engineering" },
    electrical: { zh: "电气工程", en: "Electrical Engineering" },
    electronic: { zh: "电子信息", en: "Electronic Engineering" },
    control: { zh: "控制科学与工程", en: "Control Science and Engineering" },
    energy: { zh: "能源与动力", en: "Energy and Power" },
    materials: { zh: "材料工程", en: "Materials Engineering" },
    civil: { zh: "土木工程", en: "Civil Engineering" },
    computer: { zh: "计算机/AI", en: "Computer Science / AI" },
    automotive: { zh: "车辆工程", en: "Automotive Engineering" },
    aerospace: { zh: "航空航天", en: "Aerospace Engineering" },
    chemical: { zh: "化学工程", en: "Chemical Engineering" },
    other: { zh: "工科", en: "Engineering" },
  };
  const label = majorLabels[major]?.[locale] || major;

  const sectionsText = sections
    .map((s, i) => `[Section ${i + 1}] Type: ${s.type} / ${s.title}\n${s.content}`)
    .join("\n\n");

  if (locale === "en") {
    return `Please analyze the following resume for UK MSc application in ${label} major, from four dimensions:

Resume Content:
${sectionsText}

Please return the diagnostic result in JSON format:
{
  "issues": [
    {
      "dimension": "structure | completeness | target_fit | english_quality",
      "severity": "high | medium | low",
      "title": "Issue title in English",
      "description": "Detailed description of the issue in English",
      "suggestion": "Specific optimization suggestion in English",
      "sectionIndex": Related section number (omit if not applicable)
    }
  ],
  "overall_score": 0-100,
  "summary": "Overall review in English (1-2 sentences)",
  "missing": ["Suggestions for additional content in English"]
}`;
  } else {
    return `请分析以下简历，针对英国${label}授课型硕士申请，从四个维度进行诊断：

简历内容：
${sectionsText}

请以JSON格式返回诊断结果：
{
  "issues": [
    {
      "dimension": "structure | completeness | target_fit | english_quality",
      "severity": "high | medium | low",
      "title": "问题标题（中文）",
      "description": "详细描述问题（中文）",
      "suggestion": "具体优化建议（中文）",
      "sectionIndex": 关联的区块编号（没有则不填）
    }
  ],
  "overall_score": 0-100,
  "summary": "整体评价（中文，1-2句话）",
  "missing": ["建议补充的内容"]
}`;
  }
}

function buildOptimizePrompt(
  sectionType: string,
  original: string,
  major: string,
  instruction?: string,
  locale: Locale = "zh"
): string {
  const majorLabels: Record<string, { zh: string; en: string }> = {
    mechanical: { zh: "机械工程", en: "Mechanical Engineering" },
    electrical: { zh: "电气工程", en: "Electrical Engineering" },
    electronic: { zh: "电子信息", en: "Electronic Engineering" },
    control: { zh: "控制科学与工程", en: "Control Science and Engineering" },
    energy: { zh: "能源与动力", en: "Energy and Power" },
    materials: { zh: "材料工程", en: "Materials Engineering" },
    civil: { zh: "土木工程", en: "Civil Engineering" },
    computer: { zh: "计算机/AI", en: "Computer Science / AI" },
    automotive: { zh: "车辆工程", en: "Automotive Engineering" },
    aerospace: { zh: "航空航天", en: "Aerospace Engineering" },
    chemical: { zh: "化学工程", en: "Chemical Engineering" },
    other: { zh: "工科", en: "Engineering" },
  };
  const label = majorLabels[major]?.[locale] || major;

  if (locale === "en") {
    return `Please rewrite the following resume section for UK MSc application in ${label} major:

Section Type: ${sectionType}
Original Content:
${original}

${instruction ? `Special Requirements: ${instruction}` : ""}

Please provide 2-3 different versions of rewrite:
1. 【Conservative Polish】Maintain the original meaning, fix English expression, enhance professionalism
2. 【Engineering Focus】Emphasize engineering methods, technical tools, and relevance to your target major
3. 【Results-Oriented】Highlight specific outcomes, quantifiable metrics, and actual contributions

Each version should output the rewritten text directly without explanation. Separate different versions with ---.`;
  } else {
    return `请重写以下简历段落，用于申请英国${label}方向的MSc：

段落类型: ${sectionType}
原始内容：
${original}

${instruction ? `特别要求：${instruction}` : ""}

请提供2-3个不同版本的改写：
1. 【保守润色版】保持原意，修正英文表达，提升专业度
2. 【工科强化版】突出工程方法、技术工具、与申请方向的关联
3. 【成果导向版】强调具体成果、量化指标、实际贡献

每个版本直接输出改写后的文本，无需解释。用---分隔不同版本。`;
  }
}
