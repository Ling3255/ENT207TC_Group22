import type { ParsedSection } from "../types";

export function parseAIResponse(raw: string): ParsedSection[] {
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
        /"title"\s*:\s*"([\s\S]*?)"(?:\s*,|\s*\})/
      );
      const typeMatch = objStr.match(
        /"type"\s*:\s*"(.*?)"(?:\s*,|\s*\})/
      );
      const contentMatch = objStr.match(
        /"content"\s*:\s*"([\s\S]*?)"(?:\s*,|\s*\})/
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

export function decodeJSONString(str: string): string {
  return str
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\r/g, "\r")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\");
}
