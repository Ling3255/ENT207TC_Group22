import { getAiResumeMajorLabel } from "../taxonomy/majors";
import type { Locale } from "../types";

export function buildOptimizePrompt(
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

export function getOptimizeSystemPrompt(locale: Locale): string {
  return locale === "en"
    ? "You are a professional CV editor for UK engineering and computing taught Master's applications. Rewrite resume content in strong professional English. Make descriptions specific, action-oriented, technically grounded, and quantifiable where possible. Provide 2-3 distinct rewrite versions."
    : "你是一位专业的英国工程与计算机硕士申请简历编辑。请把简历内容改写得更专业、更具体、更有行动力，并尽可能突出技术方法与量化成果。请提供 2-3 个不同侧重点的版本。";
}
