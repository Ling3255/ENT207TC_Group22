/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import {
  apiHandler,
  successResponse,
  errorResponse,
  requireAuth,
  parseJsonBody,
  assertString,
} from "@/lib/api-utils";

interface ParsedSection {
  title: string;
  type: string;
  content: string;
}

function getAIConfig() {
  const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;
  const baseURL = process.env.OPENAI_BASE_URL || "https://api.deepseek.com";
  const model = process.env.OPENAI_MODEL || "deepseek-chat";
  return { apiKey, baseURL, model };
}

function parseAIResponse(raw: string): ParsedSection[] {
  let jsonText = raw
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/gi, "")
    .replace(/`{3,}\s*/gi, "")
    .trim();

  let jsonMatch = jsonText.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
  if (!jsonMatch) {
    console.error("[parseAIResponse] 未找到JSON结构");
    return [];
  }

  let jsonStr = jsonMatch[1];

  const sectionsMatch = jsonStr.match(/"sections"\s*:\s*\[([\s\S]*)\]/);
  if (!sectionsMatch) {
    const directArrayMatch = jsonStr.match(/^\[([\s\S]*)\]$/);
    if (directArrayMatch) {
      jsonStr = directArrayMatch[1];
    } else {
      console.error("[parseAIResponse] 未找到sections数组");
      return [];
    }
  } else {
    jsonStr = sectionsMatch[1];
  }

  const sections: ParsedSection[] = [];
  const objectRegex = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;
  const matches = jsonStr.match(objectRegex) || [];

  for (const objStr of matches) {
    try {
      const titleMatch = objStr.match(
        /"title"\s*:\s*"(.*?)"(?:\s*,|\s*\})/s
      );
      const typeMatch = objStr.match(
        /"type"\s*:\s*"(.*?)"(?:\s*,|\s*\})/
      );
      const contentMatch = objStr.match(
        /"content"\s*:\s*"(.*?)"(?:\s*,|\s*\})/s
      );

      if (titleMatch || typeMatch) {
        sections.push({
          title: titleMatch ? decodeJSONString(titleMatch[1]) : "未命名",
          type: typeMatch ? typeMatch[1] : "other",
          content: contentMatch ? decodeJSONString(contentMatch[1]) : "",
        });
      }
    } catch (e) {
      // skip invalid objects
    }
  }

  if (sections.length === 0) {
    console.error("[parseAIResponse] 未能提取到任何段落");
  } else {
    console.log("[parseAIResponse] 成功提取", sections.length, "个段落");
  }

  return sections;
}

function decodeJSONString(str: string): string {
  return str
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\r/g, "\r")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\");
}

export const POST = apiHandler(async (req: NextRequest) => {
  await requireAuth(req);

  const body = await parseJsonBody<Record<string, unknown>>(req);
  const text = assertString(body.text, "text");

  const { apiKey, baseURL, model } = getAIConfig();

  if (!apiKey) {
    return errorResponse("AI服务未配置（缺少 API Key）", 503);
  }

  const prompt = `你是一个专业的简历结构分析助手。请分析以下简历文本，将其分割成语义完整的段落。

**重要规则**：
1. 每个独立的项目/经历必须单独成为一个段落
2. 即使多个项目属于同一类型（如多个科研项目），也要分别分割
3. 段落类型只从以下选项中选择：
   - education（教育背景，整个学历阶段一个段落）
   - project（项目经历，每个独立项目单独一个段落）
   - research（科研经历，每个独立科研项目单独一个段落）
   - internship（实习经历，每个实习单独一个段落）
   - competition（竞赛经历，每个竞赛单独一个段落）
   - skill（技能工具）
   - award（获奖荣誉，每项奖励单独一个段落）
   - summary（个人总结）
   - personal_info（个人信息）
   - other（其他）

4. 每个段落包含：title（标题，用项目名称或类型命名）、type（类型）、content（完整内容）

示例输出格式：
{
  "sections": [
    {"title": "西交利物浦大学", "type": "education", "content": "..."},
    {"title": "低成本机械臂项目", "type": "research", "content": "..."},
    {"title": "冰箱膨胀阀噪声优化", "type": "research", "content": "..."},
    {"title": "ESG碳中和研究", "type": "research", "content": "..."}
  ]
}

简历文本：
${text.slice(0, 8000)}

请直接返回JSON，不要有任何其他文字解释。`;

  const response = await fetch(`${baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content:
            "你是一个专业的简历分析助手，擅长识别简历结构并将其分割成语义完整的段落。",
        },
        {
          role: "user",
          content: prompt,
        },
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
