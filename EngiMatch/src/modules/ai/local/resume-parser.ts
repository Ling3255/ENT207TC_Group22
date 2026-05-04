import type { ResumeSection, ResumeSectionType } from "../types";

export type { ResumeSection, ResumeSectionType };

export const SECTION_TYPE_LABELS: Record<ResumeSectionType, string> = {
  education: "教育背景",
  project: "项目经历",
  internship: "实习经历",
  research: "科研经历",
  competition: "竞赛经历",
  skill: "技能与工具",
  award: "获奖情况",
  summary: "个人总结",
  personal_info: "个人信息",
  other: "其他",
};

const HEADER_KEYWORDS: Record<ResumeSectionType, string[]> = {
  education: [
    "教育背景", "学历", "教育经历", "教育", "Education", "EDUCATION",
    "学校", "University", "College", "本科", "硕士", "博士", "高中",
  ],
  project: [
    "项目", "项目经历", "项目经验", "Projects", "Project", "PROJECT",
    "课程设计", "实训", "课程项目", "Academic Project", "毕业设计",
  ],
  research: [
    "科研", "科研经历", "研究", "研究经历", "实验室", "Research",
    "论文", "Publication", "Thesis", "毕设",
  ],
  internship: [
    "实习", "实习经历", "工作经验", "工作经历", "Internship", "工作",
    "Employment", "Professional Experience", "社会实践",
  ],
  competition: [
    "竞赛", "比赛", "Competition", "Contest", "赛事", "建模",
    "挑战杯", "电子设计大赛", "数学建模",
  ],
  skill: [
    "技能", "专业技能", "技能证书", "技术栈", "Tools", "Programming",
    "技能证书", "操作技能", "Computer Skills", "Skill", "软件",
    "语言", "Languages", "计算机",
  ],
  award: [
    "获奖", "荣誉", "Award", "Honor", "Scholarship", "奖学金",
    "荣誉称号", "比赛奖项", "Achievement",
  ],
  summary: [
    "个人总结", "自我评价", "Summary", "About", "Objective",
    "自我介绍", "求职意向", "个人陈述", "Profile",
  ],
  personal_info: [
    "个人信息", "基本信息", "Personal Info", "Contact", "联系方式",
    "个人信息", "基本信息",
  ],
  other: [],
};

function isHeaderLine(line: string, prevType: ResumeSectionType): { isHeader: boolean; type: ResumeSectionType; confidence: number } {
  const trimmed = line.trim();
  if (!trimmed) return { isHeader: false, type: prevType, confidence: 0 };

  if (/^[-=_*]{3,}$/.test(trimmed)) return { isHeader: false, type: prevType, confidence: 0 };

  if (/^\d{4}[年\-/.到至]\d{1,2}(月)?[\-/.到至]?\d{0,4}(至今|现在)?$/.test(trimmed)) {
    return { isHeader: false, type: prevType, confidence: 0 };
  }

  if (/^[•·\-\*]\s/.test(trimmed)) return { isHeader: false, type: prevType, confidence: 0 };

  const trimmedLower = trimmed.toLowerCase();

  for (const [type, keywords] of Object.entries(HEADER_KEYWORDS)) {
    for (const keyword of keywords) {
      if (
        trimmed === keyword ||
        trimmed.startsWith(keyword + "：") ||
        trimmed.startsWith(keyword + ":") ||
        trimmed === keyword + "s" ||
        trimmed === keyword.toUpperCase()
      ) {
        return { isHeader: true, type: type as ResumeSectionType, confidence: 1.0 };
      }
    }
  }

  for (const [type, keywords] of Object.entries(HEADER_KEYWORDS)) {
    for (const keyword of keywords) {
      if (trimmedLower.includes(keyword.toLowerCase())) {
        const lengthScore = Math.max(0, 1 - trimmed.length / 20);
        const confidence = 0.5 + lengthScore * 0.3;
        return { isHeader: true, type: type as ResumeSectionType, confidence };
      }
    }
  }

  if (/^[\u4e00-\u9fa5]{2,8}$/.test(trimmed) && trimmed.length <= 10) {
    for (const [type, keywords] of Object.entries(HEADER_KEYWORDS)) {
      for (const keyword of keywords) {
        if (trimmed.includes(keyword)) {
          return { isHeader: true, type: type as ResumeSectionType, confidence: 0.6 };
        }
      }
    }
  }

  if (/^[A-Z]{3,}$/.test(trimmed) && trimmed.length <= 15) {
    const type = detectSectionTypeByTitle(trimmed);
    if (type !== "other") return { isHeader: true, type, confidence: 0.8 };
  }

  return { isHeader: false, type: prevType, confidence: 0 };
}

function detectSectionTypeByTitle(title: string): ResumeSectionType {
  const lower = title.toLowerCase();
  for (const [type, keywords] of Object.entries(HEADER_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lower === keyword.toLowerCase() || lower.includes(keyword.toLowerCase())) {
        return type as ResumeSectionType;
      }
    }
  }
  return "other";
}

function splitIntoLines(text: string): string[] {
  return text.split(/\r?\n/).map(l => l.trim()).filter(l => l.trim().length > 0);
}

export function parseResumeText(text: string): ResumeSection[] {
  const lines = splitIntoLines(text);
  if (lines.length === 0) return [];

  const sections: ResumeSection[] = [];
  let currentSectionType: ResumeSectionType = "other";
  let currentSectionTitle = "";
  let currentSectionLines: string[] = [];
  let order = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const { isHeader, type, confidence } = isHeaderLine(line, currentSectionType);

    if (isHeader && confidence >= 0.5) {
      if (currentSectionLines.length > 0) {
        sections.push({
          id: `section_${order}`,
          type: currentSectionType,
          title: currentSectionTitle || SECTION_TYPE_LABELS[currentSectionType],
          content: currentSectionLines.join("\n"),
          order,
          confirmed: false,
        });
        order++;
      }

      currentSectionType = type;
      currentSectionTitle = line;
      currentSectionLines = [];
    } else {
      currentSectionLines.push(line);
    }
  }

  if (currentSectionLines.length > 0) {
    sections.push({
      id: `section_${order}`,
      type: currentSectionType,
      title: currentSectionTitle || SECTION_TYPE_LABELS[currentSectionType],
      content: currentSectionLines.join("\n"),
      order,
      confirmed: false,
    });
  }

  if (sections.length <= 2 && lines.length > 10) {
    const blocks = text.split(/\n\s*\n/).filter(b => b.trim().length > 30);
    if (blocks.length >= 3 && blocks.length > sections.length) {
      return blocks.map((block, i) => {
        const firstLine = block.split("\n")[0].trim();
        const detectedType = detectSectionTypeByTitle(firstLine);
        return {
          id: `section_${i}`,
          type: detectedType,
          title: firstLine.slice(0, 50) || SECTION_TYPE_LABELS[detectedType],
          content: block.trim(),
          order: i,
          confirmed: false,
        };
      });
    }
  }

  if (sections.length <= 2 && lines.length > 10) {
    const projectPatterns = [
      /^\d{4}[年\-/.到至]/,
      /^[A-Z][a-z]+\s+\d{4}/,
      /^\[[^\]]+\]/,
      /^【[^】]+】/,
    ];

    let projectStarts: number[] = [];
    for (let i = 0; i < lines.length; i++) {
      for (const pattern of projectPatterns) {
        if (pattern.test(lines[i])) {
          projectStarts.push(i);
          break;
        }
      }
    }

    if (projectStarts.length >= 2) {
      const breakpoints: number[] = [0];
      for (let i = 1; i < projectStarts.length; i++) {
        const prevStart = projectStarts[i - 1];
        const currStart = projectStarts[i];

        let breakPoint = prevStart;
        for (let j = prevStart; j < currStart; j++) {
          if (/^[-=_*]{3,}$/.test(lines[j]) || !lines[j].trim()) {
            breakPoint = j;
            break;
          }
          breakPoint = j;
        }

        if (breakPoint > (breakpoints[breakpoints.length - 1] || 0)) {
          breakpoints.push(breakPoint);
        }
      }
      breakpoints.push(lines.length);

      const newSections: ResumeSection[] = [];
      for (let i = 0; i < breakpoints.length - 1; i++) {
        const start = breakpoints[i];
        const end = breakpoints[i + 1];
        const blockLines = lines.slice(start, end);

        if (blockLines.length === 0) continue;

        const firstLine = blockLines[0];
        const detectedType = detectSectionTypeByTitle(firstLine);

        newSections.push({
          id: `section_${i}`,
          type: detectedType,
          title: firstLine.slice(0, 50) || SECTION_TYPE_LABELS[detectedType],
          content: blockLines.join("\n"),
          order: i,
          confirmed: false,
        });
      }

      if (newSections.length > sections.length) {
        return newSections;
      }
    }
  }

  return sections;
}

export function autoSuggestMissingSections(sections: ResumeSection[]): string[] {
  const types = new Set(sections.map(s => s.type));
  const suggestions: string[] = [];

  if (!types.has("education")) suggestions.push("未识别到教育背景，请手动添加");
  if (!types.has("project") && !types.has("research")) suggestions.push("未识别到项目或科研经历，请确认是否已包含");
  if (!types.has("skill")) suggestions.push("未识别到技能部分，建议补充编程语言和工具");

  return suggestions;
}
