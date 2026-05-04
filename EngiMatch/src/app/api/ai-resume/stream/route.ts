/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import { chatCompletionStream } from "@/modules/ai/client";
import {
  buildDiagnosePrompt,
  buildOptimizePrompt,
  getDiagnoseSystemPrompt,
  getOptimizeSystemPrompt,
} from "@/modules/ai";
import {
  ApiError,
  assertArray,
  assertString,
  parseJsonBody,
  requireAuth,
} from "@/lib/api-utils";
import OpenAI from "openai";

export const dynamic = "force-dynamic";

type Locale = "zh" | "en";
type ResumeAiSection = { type: string; title: string; content: string };

export const POST = async (req: NextRequest) => {
  const encoder = new TextEncoder();
  const sse = (data: unknown) =>
    encoder.encode(`data: ${JSON.stringify(data)}\n\n`);

  // --- Parse & validate everything before opening the stream ---
  let messages: OpenAI.Chat.ChatCompletionMessageParam[];
  let streamOptions: { temperature: number; maxTokens: number };

  try {
    await requireAuth(req);
    const body = await parseJsonBody<Record<string, unknown>>(req);

    const rawSections = assertArray<Record<string, unknown>>(
      body.sections,
      "sections"
    );
    const sections: ResumeAiSection[] = rawSections.map((s, i) => ({
      type: assertString(s.type, `sections[${i}].type`),
      title: typeof s.title === "string" ? s.title : "",
      content: assertString(s.content, `sections[${i}].content`),
    }));

    const action = assertString(body.action, "action");
    const locale: Locale = body.locale === "en" ? "en" : "zh";
    const major = typeof body.major === "string" ? body.major : "";

    if (action === "diagnose") {
      const prompt = buildDiagnosePrompt(sections, major, locale);
      const systemPrompt = getDiagnoseSystemPrompt(locale);
      messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ];
      streamOptions = { temperature: 0.3, maxTokens: 3000 };
    } else if (action === "optimize") {
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
      const systemPrompt = getOptimizeSystemPrompt(locale);
      messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ];
      streamOptions = { temperature: 0.4, maxTokens: 2000 };
    } else {
      return new Response(JSON.stringify({ error: "Unknown action" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (err) {
    if (err instanceof ApiError) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: err.statusCode,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // --- Stream the AI response ---
  const capturedMessages = messages;
  const capturedOptions = streamOptions;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const token of chatCompletionStream(
          capturedMessages,
          capturedOptions
        )) {
          controller.enqueue(sse({ token }));
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (err: any) {
        controller.enqueue(
          sse({ error: err?.message || "AI generation failed" })
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
};
