/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import { chatCompletion } from "@/modules/ai/client";
import {
  buildDiagnosePrompt,
  buildOptimizePrompt,
  getDiagnoseSystemPrompt,
  getOptimizeSystemPrompt,
} from "@/modules/ai";
import {
  apiHandler,
  assertArray,
  assertString,
  errorResponse,
  parseJsonBody,
  requireAuth,
  successResponse,
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

  const action = assertString(body.action, "action");
  const locale: Locale = body.locale === "en" ? "en" : "zh";

  if (action === "diagnose") {
    const major = typeof body.major === "string" ? body.major : "";
    const prompt = buildDiagnosePrompt(sections, major, locale);
    const systemPrompt = getDiagnoseSystemPrompt(locale);

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
    const major = typeof body.major === "string" ? body.major : "";
    const sectionType = assertString(body.sectionType, "sectionType");
    const original = assertString(body.original, "original");
    const instruction = typeof body.instruction === "string" ? body.instruction : undefined;

    const prompt = buildOptimizePrompt(sectionType, original, major, instruction, locale);
    const systemPrompt = getOptimizeSystemPrompt(locale);

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
