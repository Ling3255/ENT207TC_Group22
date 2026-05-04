import { normalizeAiResumeMajor } from "../taxonomy/majors";
import type { Locale, Dimension, DiagnosticIssue } from "../types";

export type { DiagnosticIssue, Dimension };

export const DIMENSION_META: Record<Dimension, { label: string; icon: string; color: string }> = {
  structure: { label: "结构清晰度", icon: "🧱", color: "blue" },
  completeness: { label: "内容完整度", icon: "📦", color: "emerald" },
  target_fit: { label: "申请匹配度", icon: "🎯", color: "violet" },
  english_quality: { label: "英文表达质量", icon: "✍️", color: "amber" },
};

export function getDimensionMeta(dimension: Dimension, locale: Locale) {
  if (locale === "en") {
    const labels: Record<Dimension, string> = {
      structure: "Structure Clarity",
      completeness: "Content Completeness",
      target_fit: "Application Fit",
      english_quality: "English Writing Quality",
    };
    return { ...DIMENSION_META[dimension], label: labels[dimension] };
  }
  return DIMENSION_META[dimension];
}

const ISSUE_TEXT = {
  no_education: {
    zh: ["未找到教育背景区块", "简历中缺少明确的教育背景，这是英国硕士申请里最核心的信息之一。", "请补充学校、专业、时间、学位和 GPA/均分，并尽量放在简历前部。"],
    en: ["Education section not found", "Your resume does not contain a clear education section, which is one of the most important parts of a UK Master's application.", "Add your university, major, degree, dates, and GPA/average score near the top of the resume."],
  },
  education_too_low: {
    zh: ["教育背景位置偏后", "教育背景出现在简历较后的位置，不利于招生官快速判断你的学术基础。", "建议把教育背景移动到个人信息之后的前部区域。"],
    en: ["Education section is too far down", "Your education section appears too far down the page, which makes it harder for admissions officers to assess your academic background quickly.", "Move your education section closer to the top, ideally right after personal details."],
  },
  no_projects: {
    zh: ["缺少项目或科研经历", "工科与计算机方向的英国硕士通常非常看重项目、科研或实践经历。", "建议补充课程项目、科研经历、毕业设计或相关实习内容。"],
    en: ["Missing project or research experience", "UK engineering and computing programmes usually care a lot about projects, research, and practical experience.", "Add coursework projects, research, capstone work, or relevant internship experience."],
  },
  no_quantification: {
    zh: ["缺少量化成果", "简历里的描述缺少结果指标，会让你的贡献显得不够具体。", "补充效率提升、误差降低、完成周期、排名或规模等量化结果。"],
    en: ["Lack of quantified results", "Your resume descriptions do not show enough measurable outcomes.", "Add quantified outcomes such as efficiency gains, error reduction, delivery time, ranking, or scale."],
  },
  weak_technical_tools: {
    zh: ["技术工具体现不足", "简历没有充分展示你使用过的技术工具、编程语言或专业软件。", "明确写出 MATLAB、Python、CAD、仿真工具、实验平台或开发框架。"],
    en: ["Technical tooling is not clear enough", "The resume does not clearly show the tools, programming languages, or domain software you have used.", "Explicitly mention tools like MATLAB, Python, CAD software, simulation tools, lab platforms, or frameworks."],
  },
  weak_methodology: {
    zh: ["方法与过程描述不足", "目前的项目描述更像结果清单，缺少你是如何完成工作的过程说明。", "补充采用的方法、模型、算法、实验设计或仿真流程。"],
    en: ["Methodology description is too thin", "Your project descriptions look more like a result list than a clear explanation of how the work was done.", "Add methods, models, algorithms, experimental design, or simulation workflow details."],
  },
  weak_relevant_courses: {
    zh: ["相关课程基础不够突出", "当前简历没有明显体现与你目标方向相关的核心课程或学科基础。", "补充与目标方向直接相关的课程、实验课或核心理论基础。"],
    en: ["Relevant academic foundation is not obvious", "Your resume does not clearly show the core courses or subject foundation related to the target direction.", "Add relevant core courses, labs, or theoretical foundations that support your target direction."],
  },
  mixed_language: {
    zh: ["中英文混杂", "英文申请简历里混用中文和英文会显得不够专业。", "请统一使用英文版本，或者至少确保投递版本是完整英文。"],
    en: ["Mixed Chinese and English detected", "Mixing Chinese and English in the same English application resume looks unpolished.", "Use a fully English version for submission, or make sure the final submitted copy is entirely in English."],
  },
  weak_verbs: {
    zh: ["表达偏弱", "简历里存在比较空泛或较弱的表达方式，影响专业感。", "优先使用 Designed、Implemented、Developed、Analyzed 等更有行动力的动词。"],
    en: ["Weak phrasing detected", "Some descriptions sound vague or weak, which reduces the professional impact of the resume.", "Prefer stronger verbs such as Designed, Implemented, Developed, or Analyzed."],
  },
} as const;

function localizeIssue(id: keyof typeof ISSUE_TEXT, locale: Locale) {
  const [title, description, suggestion] = ISSUE_TEXT[id][locale];
  return { title, description, suggestion };
}

function hasEducation(sections: Array<{ type: string }>) {
  return sections.some((section) => section.type === "education");
}

function hasProjects(sections: Array<{ type: string }>) {
  return sections.some((section) => ["project", "research", "internship"].includes(section.type));
}

function hasQuantifiedResults(text: string) {
  return /\d+%|\d+\s*(times|students|teams|iterations)|improved|increased|reduced|achieved/i.test(text);
}

function hasTechnicalTools(text: string) {
  return /matlab|python|c\+\+|simulink|autocad|solidworks|ansys|labview|arduino|fpga|pytorch|tensorflow|docker|git|cad/i.test(text);
}

function hasMethodology(text: string) {
  return /using|implemented|developed|designed|analyzed|simulated|modeled|built|tested|optimized/i.test(text);
}

function hasChineseInEnglish(text: string) {
  return /[\u4e00-\u9fff]/.test(text) && /I |responsible for|participated|designed|developed|project/i.test(text);
}

function shouldCheckRelevantCourses(major: string) {
  return [
    "mechanical_engineering",
    "electrical_engineering",
    "electronic_engineering",
    "control_engineering",
    "civil_engineering",
    "chemical_engineering",
    "computer_engineering",
    "artificial_intelligence",
    "engineering_mathematics",
  ].includes(major);
}

function hasRelevantCourseSignals(text: string, major: string) {
  const checks: Record<string, RegExp> = {
    mechanical_engineering: /thermodynamics|fluid|mechanics|manufacturing|fea/i,
    electrical_engineering: /power|circuit|electrical|embedded|signals/i,
    electronic_engineering: /signal|fpga|embedded|circuit|digital/i,
    control_engineering: /control|pid|system|simulation|model/i,
    civil_engineering: /structure|geotechnical|transport|construction|survey/i,
    chemical_engineering: /reaction|thermodynamics|mass transfer|process|chemical/i,
    computer_engineering: /programming|architecture|embedded|algorithm|data structure/i,
    artificial_intelligence: /machine learning|deep learning|statistics|python|data/i,
    engineering_mathematics: /optimization|numerical|statistics|modeling|calculus/i,
  };
  return (checks[major] ?? /.^/).test(text);
}

export function runDiagnostics(
  sections: Array<{ id: string; type: string; title: string; content: string }>,
  major: string,
  locale: Locale = "zh"
): DiagnosticIssue[] {
  const normalizedMajor = normalizeAiResumeMajor(major);
  const issues: DiagnosticIssue[] = [];

  if (!hasEducation(sections)) {
    const issue = localizeIssue("no_education", locale);
    issues.push({ id: "no_education", dimension: "structure", severity: "high", ...issue });
  }

  const order = sections.map((section) => section.type);
  const educationIndex = order.indexOf("education");
  if (educationIndex > 2) {
    const issue = localizeIssue("education_too_low", locale);
    issues.push({ id: "education_too_low", dimension: "structure", severity: "medium", ...issue });
  }

  if (!hasProjects(sections)) {
    const issue = localizeIssue("no_projects", locale);
    issues.push({ id: "no_projects", dimension: "completeness", severity: "high", ...issue });
  }

  const allText = sections.map((section) => section.content).join("\n");

  if (!hasQuantifiedResults(allText)) {
    const issue = localizeIssue("no_quantification", locale);
    issues.push({ id: "no_quantification", dimension: "completeness", severity: "medium", ...issue });
  }

  if (!hasTechnicalTools(allText)) {
    const issue = localizeIssue("weak_technical_tools", locale);
    issues.push({ id: "weak_technical_tools", dimension: "target_fit", severity: "high", ...issue });
  }

  if (!hasMethodology(allText)) {
    const issue = localizeIssue("weak_methodology", locale);
    issues.push({ id: "weak_methodology", dimension: "target_fit", severity: "medium", ...issue });
  }

  if (shouldCheckRelevantCourses(normalizedMajor) && !hasRelevantCourseSignals(allText, normalizedMajor)) {
    const issue = localizeIssue("weak_relevant_courses", locale);
    issues.push({ id: "weak_relevant_courses", dimension: "target_fit", severity: "medium", ...issue });
  }

  if (hasChineseInEnglish(allText)) {
    const issue = localizeIssue("mixed_language", locale);
    issues.push({ id: "mixed_language", dimension: "english_quality", severity: "high", ...issue });
  }

  if (/\b(good at|some experience|nice|great|a lot of)\b/i.test(allText)) {
    const issue = localizeIssue("weak_verbs", locale);
    issues.push({ id: "weak_verbs", dimension: "english_quality", severity: "medium", ...issue });
  }

  return issues.sort((a, b) => {
    const severityOrder = { high: 0, medium: 1, low: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}
