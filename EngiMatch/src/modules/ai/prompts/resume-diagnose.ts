import { getAiResumeMajorLabel } from "../taxonomy/majors";
import type { Locale } from "../types";

export function buildDiagnosePrompt(
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

export function getDiagnoseSystemPrompt(locale: Locale): string {
  return locale === "en"
    ? "You are a professional UK MSc admissions consultant specializing in engineering and computing programmes. Analyze resumes for UK postgraduate applications and provide detailed, actionable feedback in English. Be critical but constructive. Focus on what UK admissions officers look for in strong taught Master's candidates."
    : "你是一位专业的英国硕士申请顾问，专注于工程与计算机相关专业。请从英国授课型硕士招生官的视角，给出严格但建设性的简历分析，并提供具体可执行的改进建议。";
}
