export interface DiagnosticIssue {
  id: string;
  dimension: Dimension;
  severity: "high" | "medium" | "low";
  title: string;
  description: string;
  suggestion: string;
  sectionId?: string;
}

export type Dimension =
  | "structure"
  | "completeness"
  | "target_fit"
  | "english_quality";

export const DIMENSION_META: Record<Dimension, { label: string; icon: string; color: string }> = {
  structure: {
    label: "结构清晰度",
    icon: "📋",
    color: "blue",
  },
  completeness: {
    label: "内容完整度",
    icon: "📝",
    color: "emerald",
  },
  target_fit: {
    label: "申请适配度",
    icon: "🎯",
    color: "violet",
  },
  english_quality: {
    label: "英文表达质量",
    icon: "✏️",
    color: "amber",
  },
};

export function getDimensionMeta(dimension: Dimension, locale: Locale) {
  const meta = DIMENSION_META[dimension];
  if (locale === "en") {
    const labels: Record<Dimension, string> = {
      structure: "Structure Clarity",
      completeness: "Content Completeness",
      target_fit: "Application Fit",
      english_quality: "English Writing Quality",
    };
    return { ...meta, label: labels[dimension] };
  }
  return meta;
}

type Locale = "zh" | "en";

const ISSUE_TEXT: Record<string, { title: { zh: string; en: string }; desc: { zh: string; en: string }; sugg: { zh: string; en: string } }> = {
  no_education: {
    title: { zh: "未找到教育背景区块", en: "Education Section Not Found" },
    desc: {
      zh: "简历中缺少明确的教育背景部分。教育背景是英国硕士申请材料的核心要素，招生官通常第一时间查看。",
      en: "No clear education section found in your resume. Education background is a core element of UK Master's applications and admissions officers typically check it first.",
    },
    sugg: {
      zh: "请确保简历中包含学校、专业、学位、时间段、GPA/均分等关键信息，并放在简历最上方或仅次于姓名和联系方式的位置。",
      en: "Ensure your resume includes key information such as university, major, degree, time period, GPA/average score, and place it at the top (right after your name and contact information).",
    },
  },
  education_too_low: {
    title: { zh: "教育背景位置靠后", en: "Education Section Too Far Down" },
    desc: {
      zh: "教育背景被放在简历较后位置。对于英国授课型硕士申请，教育背景应当靠前，因为招生官希望快速看到你的院校背景和成绩。",
      en: "Your education section is placed too far down in the resume. For UK taught Master's applications, education should be near the top so admissions officers can quickly see your university background and grades.",
    },
    sugg: {
      zh: "将教育背景移至个人信息之后的第一位。",
      en: "Move education background to the first position after personal information.",
    },
  },
  no_projects: {
    title: { zh: "缺少项目或科研经历", en: "Missing Project or Research Experience" },
    desc: {
      zh: "英国工科硕士申请非常重视项目经历，尤其是与申请方向相关的项目经历。这是展示你应用知识能力的关键部分。",
      en: "UK engineering Master's programs highly value project experience, especially projects related to your target major. This is a key section to demonstrate your ability to apply knowledge.",
    },
    sugg: {
      zh: "请补充课程设计、实验室项目、毕业设计、课外项目等。至少包含 2-3 个有技术含量的项目。",
      en: "Add coursework projects, lab projects, graduation projects, or extracurricular projects. Include at least 2-3 technically substantial projects.",
    },
  },
  no_quantification: {
    title: { zh: "缺少成果量化表达", en: "Lack of Quantified Results" },
    desc: {
      zh: "简历中没有找到具体的数据或成果指标，如百分比提升、指标改善、获奖名次等。英国申请强调成果导向的表达。",
      en: "No specific data or outcome metrics found in your resume, such as percentage improvements, metric improvements, or award rankings. UK applications emphasize result-oriented descriptions.",
    },
    sugg: {
      zh: "在描述项目时使用具体的量化指标，如 'improved system efficiency by 15%'、'reduced testing time by 40%'、'ranked top 5 among 50 teams'。",
      en: "Use specific quantifiable metrics when describing projects, such as 'improved system efficiency by 15%', 'reduced testing time by 40%', 'ranked top 5 among 50 teams'.",
    },
  },
  weak_technical_tools: {
    title: { zh: "技能工具与工科方向关联较弱", en: "Weak Connection Between Skills and Engineering Major" },
    desc: {
      zh: "简历中没有识别到与工科硕士申请相关的常用技术工具和软件。工科项目尤其关注你是否具备 MATLAB、Python、C++、专业仿真工具等技能。",
      en: "No commonly used technical tools or software related to engineering Master's applications were detected. Engineering programs particularly focus on whether you have skills in MATLAB, Python, C++, professional simulation tools, etc.",
    },
    sugg: {
      zh: "确保技能部分列出了与你申请的工程方向相关的工具，如 MATLAB/Simulink（控制方向）、SolidWorks/AutoCAD（机械方向）、Python/PyTorch（AI方向）等。",
      en: "Ensure your skills section lists tools relevant to your engineering major, such as MATLAB/Simulink (for control), SolidWorks/AutoCAD (for mechanical), Python/PyTorch (for AI), etc.",
    },
  },
  weak_methodology: {
    title: { zh: "项目方法描述不足", en: "Insufficient Project Methodology Description" },
    desc: {
      zh: "简历中的项目描述较少涉及具体方法、工具或流程。英国工科申请希望看到你 '如何做的'，而不仅仅是 '做了什么'。",
      en: "Your project descriptions lack specific methods, tools, or processes. UK engineering admissions want to see HOW you did it, not just WHAT you did.",
    },
    sugg: {
      zh: "在每个项目描述中加入方法关键词，如 'using PID control'、'simulated in MATLAB/Simulink'、'designed with SolidWorks'、'implemented with deep learning approach'。",
      en: "Add methodology keywords to each project description, such as 'using PID control', 'simulated in MATLAB/Simulink', 'designed with SolidWorks', 'implemented with deep learning approach'.",
    },
  },
  weak_relevant_courses: {
    title: { zh: "未突出相关课程", en: "Relevant Courses Not Highlighted" },
    desc: {
      zh: "申请工科方向时，简历中应体现相关的核心课程基础，如控制理论、电路原理、流体力学、信号处理等。",
      en: "When applying for engineering majors, your resume should reflect relevant core course knowledge, such as control theory, circuit principles, fluid dynamics, signal processing, etc.",
    },
    sugg: {
      zh: "在教育背景或项目描述中明确提及与申请方向相关的核心课程，突出你的学科基础。",
      en: "Explicitly mention core courses related to your target major in education or project descriptions to highlight your subject foundation.",
    },
  },
  mixed_language: {
    title: { zh: "存在中英文混杂现象", en: "Mixed Chinese and English Detected" },
    desc: {
      zh: "简历中同时包含中文和英文表述，这在英文申请材料中是不规范的。英文简历应该全部使用英文。",
      en: "Both Chinese and English expressions were found in your resume, which is not standard for English application materials. English resumes should be entirely in English.",
    },
    sugg: {
      zh: "将简历中的中文内容翻译为英文，或切换到纯英文版本。使用动词短语描述职责，如 'Designed and implemented...' 而非 'Responsible for design'。",
      en: "Translate Chinese content in your resume to English, or switch to a pure English version. Use verb phrases for responsibilities, such as 'Designed and implemented...' instead of 'Responsible for design'.",
    },
  },
  weak_verbs: {
    title: { zh: "使用了弱动词或模糊描述", en: "Weak Verbs or Vague Descriptions Used" },
    desc: {
      zh: "简历中出现了 'responsible for'、'helped with'、'participated in' 等弱动词，这类描述在申请材料中力度不足。",
      en: "Weak verbs like 'responsible for', 'helped with', 'participated in' were found in your resume. Such descriptions lack impact in application materials.",
    },
    sugg: {
      zh: "使用强动词开头：Designed, Implemented, Developed, Analyzed, Optimized, Built, Configured。避免 'participated in' 而使用 'led'、'contributed to' 或更具体的描述。",
      en: "Start with strong verbs: Designed, Implemented, Developed, Analyzed, Optimized, Built, Configured. Avoid 'participated in' and use 'led', 'contributed to', or more specific descriptions instead.",
    },
  },
};

function getLocalizedIssueText(id: string, field: "title" | "desc" | "sugg", locale: Locale): string {
  const entry = ISSUE_TEXT[id];
  if (!entry) return id;
  return entry[field][locale] || entry[field].zh;
}

function hasEducation(sections: Array<{ type: string }>) {
  return sections.some(s => s.type === "education");
}
function hasProjects(sections: Array<{ type: string }>) {
  return sections.some(s => ["project", "research"].includes(s.type));
}
function hasSkills(sections: Array<{ type: string }>) {
  return sections.some(s => s.type === "skill");
}
function hasQuantifiedResults(text: string) {
  return /\d+%|\d+\s*(个|项|次)|improved|increased|achieved|reduced|\d+x|\d+\s*(times|students)/i.test(text);
}
function hasTechnicalTools(text: string) {
  return /matlab|python|c\+\+|simulink|autocad|solidworks|ansys|labview|arduino|fpga|keil|proteus|catia/i.test(text);
}
function hasMethodology(text: string) {
  return /using|implemented|developed|designed|analyzed|simulated|built|constructed|configured/i.test(text);
}
function hasChineseInEnglish(text: string) {
  return /[\u4e00-\u9fff]/.test(text) && /I am|I have|responsible for|in charge of|participated/i.test(text);
}

export function runDiagnostics(
  sections: Array<{ id: string; type: string; title: string; content: string }>,
  major: string,
  locale: Locale = "zh"
): DiagnosticIssue[] {
  const issues: DiagnosticIssue[] = [];

  if (!hasEducation(sections)) {
    issues.push({
      id: "no_education",
      dimension: "structure",
      severity: "high",
      title: getLocalizedIssueText("no_education", "title", locale),
      description: getLocalizedIssueText("no_education", "desc", locale),
      suggestion: getLocalizedIssueText("no_education", "sugg", locale),
    });
  }

  const sectionOrder = sections.map(s => s.type);
  const eduIdx = sectionOrder.indexOf("education");
  if (eduIdx > 2) {
    issues.push({
      id: "education_too_low",
      dimension: "structure",
      severity: "medium",
      title: getLocalizedIssueText("education_too_low", "title", locale),
      description: getLocalizedIssueText("education_too_low", "desc", locale),
      suggestion: getLocalizedIssueText("education_too_low", "sugg", locale),
    });
  }

  if (!hasProjects(sections)) {
    issues.push({
      id: "no_projects",
      dimension: "completeness",
      severity: "high",
      title: getLocalizedIssueText("no_projects", "title", locale),
      description: getLocalizedIssueText("no_projects", "desc", locale),
      suggestion: getLocalizedIssueText("no_projects", "sugg", locale),
    });
  }

  const allText = sections.map(s => s.content).join("\n");
  const hasQuantified = hasQuantifiedResults(allText);
  if (!hasQuantified) {
    issues.push({
      id: "no_quantification",
      dimension: "completeness",
      severity: "medium",
      title: getLocalizedIssueText("no_quantification", "title", locale),
      description: getLocalizedIssueText("no_quantification", "desc", locale),
      suggestion: getLocalizedIssueText("no_quantification", "sugg", locale),
    });
  }

  if (!hasTechnicalTools(allText)) {
    issues.push({
      id: "weak_technical_tools",
      dimension: "target_fit",
      severity: "high",
      title: getLocalizedIssueText("weak_technical_tools", "title", locale),
      description: getLocalizedIssueText("weak_technical_tools", "desc", locale),
      suggestion: getLocalizedIssueText("weak_technical_tools", "sugg", locale),
    });
  }

  if (!hasMethodology(allText)) {
    issues.push({
      id: "weak_methodology",
      dimension: "target_fit",
      severity: "medium",
      title: getLocalizedIssueText("weak_methodology", "title", locale),
      description: getLocalizedIssueText("weak_methodology", "desc", locale),
      suggestion: getLocalizedIssueText("weak_methodology", "sugg", locale),
    });
  }

  if (major === "control" || major === "electrical" || major === "mechanical") {
    const relevantCourses = /control theory|circuit|fluid|thermodynamics|signal|embedded|electromagnetic/i.test(allText);
    if (!relevantCourses) {
      issues.push({
        id: "weak_relevant_courses",
        dimension: "target_fit",
        severity: "medium",
        title: getLocalizedIssueText("weak_relevant_courses", "title", locale),
        description: getLocalizedIssueText("weak_relevant_courses", "desc", locale),
        suggestion: getLocalizedIssueText("weak_relevant_courses", "sugg", locale),
      });
    }
  }

  if (hasChineseInEnglish(allText)) {
    issues.push({
      id: "mixed_language",
      dimension: "english_quality",
      severity: "high",
      title: getLocalizedIssueText("mixed_language", "title", locale),
      description: getLocalizedIssueText("mixed_language", "desc", locale),
      suggestion: getLocalizedIssueText("mixed_language", "sugg", locale),
    });
  }

  const weakVerbs = /\b(is|are|was|were|have|has|had|be|been)\b.*\b(good|nice|great|bad|some|a lot)/i;
  if (weakVerbs.test(allText)) {
    issues.push({
      id: "weak_verbs",
      dimension: "english_quality",
      severity: "medium",
      title: getLocalizedIssueText("weak_verbs", "title", locale),
      description: getLocalizedIssueText("weak_verbs", "desc", locale),
      suggestion: getLocalizedIssueText("weak_verbs", "sugg", locale),
    });
  }

  return issues.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.severity] - order[b.severity];
  });
}
