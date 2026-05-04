/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import { getAIConfig } from "@/modules/ai/client";
import {
  buildSplitPrompt,
  getSplitSystemPrompt,
  parseAIResponse,
} from "@/modules/ai";
import {
  apiHandler,
  successResponse,
  errorResponse,
  requireAuth,
  parseJsonBody,
  assertString,
} from "@/lib/api-utils";

export const POST = apiHandler(async (req: NextRequest) => {
  await requireAuth(req);

  const body = await parseJsonBody<Record<string, unknown>>(req);
  const text = assertString(body.text, "text");

  const { apiKey, baseURL, model } = getAIConfig();

  if (!apiKey) {
    return errorResponse("AI服务未配置（缺少 API Key）", 503);
  }

  const prompt = buildSplitPrompt(text);

  const response = await fetch(`${baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: getSplitSystemPrompt() },
        { role: "user", content: prompt },
      ],
      temperature: 0.1,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("AI API error:", response.status, errText);
    return errorResponse(`AI服务调用失败 (${response.status})`, 500);
  }

  const data = await response.json();
  const aiContent = data.choices?.[0]?.message?.content || "";

  if (!aiContent) {
    return errorResponse("AI未返回有效结果", 500);
  }

  const sections = parseAIResponse(aiContent);

  return successResponse({ sections, raw: aiContent });
});
