export interface OptimizationVariant {
  id: string;
  label: string;
  description: string;
  text: string;
}

export interface OptimizationResult {
  original: string;
  variants: OptimizationVariant[];
  missingHints: string[];
}

type Locale = "zh" | "en";

const STRONG_VERBS = [
  "Designed", "Implemented", "Developed", "Analyzed", "Optimized",
  "Built", "Configured", "Simulated", "Constructed", "Fabricated",
  "Integrated", "Verified", "Evaluated", "Investigated", "Architected",
];

const WEAK_PATTERNS: Array<{ pattern: RegExp; fix: string | ((m: string) => string) }> = [
  { pattern: /\bresponsible for\b/gi, fix: "Responsible for" },
  { pattern: /\bhelped with\b/gi, fix: "Contributed to" },
  { pattern: /\bparticipated in\b/gi, fix: "Actively contributed to" },
  { pattern: /\btook part in\b/gi, fix: "Engaged in" },
  { pattern: /\bworked on\b/gi, fix: "Conducted" },
  { pattern: /\bdoing\b/gi, fix: "Performed" },
  { pattern: /\busing matlab\b/gi, fix: "Using MATLAB/Simulink" },
  { pattern: /\bgood at\b/gi, fix: "Proficient in" },
  { pattern: /\bknow\b/gi, fix: "Skilled in" },
  { pattern: /\bvery\b/gi, fix: "" },
];

function applyTextFixes(text: string): string {
  let result = text.trim();
  for (const item of WEAK_PATTERNS) {
    const fix = item.fix;
    if (typeof fix === "function") {
      result = result.replace(item.pattern, fix);
    } else {
      result = result.replace(item.pattern, fix);
    }
  }
  if (result.length > 0) {
    result = result[0].toUpperCase() + result.slice(1);
  }
  return result;
}

function addQuantification(text: string): string {
  if (!/\d+%|\d+\s*(times|students|teams|iterations)|improved|increased|reduced|achieved|completed|developed|designed/i.test(text)) {
    return text;
  }
  return text;
}

function makeActionVerbFirst(text: string): string {
  const lines = text.split(/[.!?]/).filter(l => l.trim());
  return lines.map(line => {
    const trimmed = line.trim();
    if (!trimmed) return "";
    if (/^(i |we |responsible|helped|participated|taking part|working)/i.test(trimmed)) {
      const rest = trimmed.replace(/^(i |we |responsible for |helped with |participated in |took part in |working on )/i, "");
      const strongVerb = STRONG_VERBS.find(v => rest.toLowerCase().startsWith(v.toLowerCase()));
      if (strongVerb) {
        return `${strongVerb} — ${rest}`;
      }
      return `Implemented: ${rest}`;
    }
    return trimmed;
  }).join(". ");
}

function addSTARContext(text: string): string {
  const lines = text.split("\n").filter(l => l.trim());
  return lines.map(line => {
    const trimmed = line.trim();
    if (trimmed.length < 20) return trimmed;
    if (/^[-•]/.test(trimmed) && !/using|with|by|in |through |during /i.test(trimmed)) {
      return trimmed;
    }
    return trimmed;
  }).join("\n");
}

const VARIANT_LABELS: Record<string, { zh: { label: string; desc: string }; en: { label: string; desc: string } }> = {
  conservative: {
    zh: { label: "保守润色版", desc: "修正表达问题，保留原意，适合轻微修改" },
    en: { label: "Conservative Polish", desc: "Fix expression issues, preserve original meaning, suitable for minor edits" },
  },
  action_verb: {
    zh: { label: "动词强化版", desc: "使用强动词开头，突出主动性和技术能力" },
    en: { label: "Action Verb Version", desc: "Start with strong verbs, highlight initiative and technical ability" },
  },
  major_specific: {
    zh: { label: "强化版", desc: "针对专业方向优化，增加技术关键词" },
    en: { label: "Major-Specific Version", desc: "Optimize for your major, add technical keywords" },
  },
  format_only: {
    zh: { label: "格式优化版", desc: "整理格式，提升可读性" },
    en: { label: "Format Optimization", desc: "Organize format, improve readability" },
  },
};

export function optimizeSection(
  original: string,
  sectionType: string,
  major: string,
  locale: Locale = "zh"
): OptimizationResult {
  const conservative = applyTextFixes(original);
  const actionVersion = makeActionVerbFirst(original);
  const majorEnhanced = enhanceForMajor(original, major);
  const quantified = addQuantificationEnhancement(original, locale);

  const variants: OptimizationVariant[] = [];

  if (conservative !== original.trim()) {
    const v = VARIANT_LABELS.conservative[locale];
    variants.push({
      id: "conservative",
      label: v.label,
      description: v.desc,
      text: conservative,
    });
  }

  if (actionVersion !== original.trim() && actionVersion !== conservative) {
    const v = VARIANT_LABELS.action_verb[locale];
    variants.push({
      id: "action_verb",
      label: v.label,
      description: v.desc,
      text: actionVersion,
    });
  }

  if (majorEnhanced !== original.trim()) {
    variants.push({
      id: "major_specific",
      label: `${getMajorLabel(major, locale)}强化版`,
      description: `${locale === "en" ? "Optimize for" : "针对"}${getMajorLabel(major, locale)}${locale === "en" ? " major" : "方向优化"}`,
      text: majorEnhanced,
    });
  }

  if (variants.length === 0) {
    const lines = original.trim().split("\n").map(l => l.trim()).filter(Boolean);
    const v = VARIANT_LABELS.format_only[locale];
    variants.push({
      id: "format_only",
      label: v.label,
      description: v.desc,
      text: lines.map(l => l.startsWith("-") || l.startsWith("•") ? l : `• ${l}`).join("\n"),
    });
  }

  const missingHints = generateMissingHints(original, sectionType, major, locale);

  return { original: original.trim(), variants, missingHints };
}

function enhanceForMajor(text: string, major: string): string {
  const majorKeywords: Record<string, string[]> = {
    mechanical: ["SolidWorks", "ANSYS", "AutoCAD", "CATIA", "MATLAB", "FEA", "CFD", "mechanical design", "fabrication"],
    electrical: ["MATLAB/Simulink", "circuit analysis", "PCB design", "embedded systems", "Altium", "power electronics"],
    electronic: ["VHDL", "Verilog", "FPGA", "embedded C", "circuit design", "PCB"],
    control: ["MATLAB/Simulink", "PID", "control theory", "state-space", "LQR", "Kalman filter", "PLC"],
    energy: ["thermodynamics", "heat transfer", "CFD", "ANSYS Fluent", "energy systems", "HVAC"],
    materials: ["materials testing", "SEM", "XRD", "metallurgy", "composite materials"],
    civil: ["SAP2000", "STAAD.Pro", "AutoCAD Civil", "structural analysis", "BIM"],
    computer: ["Python", "PyTorch", "TensorFlow", "Docker", "Git", "ML algorithms"],
    automotive: ["MATLAB/Simulink", "vehicle dynamics", "CAN bus", "SIMPACK", "AVL Cruise"],
    aerospace: ["Abaqus", "FEA", "CFD", "aerodynamics", "MATLAB", "flight dynamics"],
    chemical: ["Aspen Plus", "process simulation", "CHEMCAD", "reactor design"],
    other: [],
  };

  const keywords = majorKeywords[major] || [];
  if (keywords.length === 0) return text;

  return text;
}

function addQuantificationEnhancement(text: string, locale: Locale): string {
  const hasNumbers = /\d+%|\d+\s*(times|students|iterations)/i.test(text);
  if (!hasNumbers) {
    const lines = text.split("\n");
    const hint = locale === "en" ? "[Suggest adding quantified results]" : "[建议补充量化结果]";
    return lines.map(line => {
      const trimmed = line.trim();
      if (/^[-•]/.test(trimmed) && trimmed.length > 20) {
        return `${trimmed} ${hint}`;
      }
      return trimmed;
    }).join("\n");
  }
  return text;
}

const MISSING_HINTS: Record<string, { zh: string; en: string }> = {
  no_tools: {
    zh: "你是否使用了特定的软件或工具？提及具体技术栈能显著提升简历质量。",
    en: "Did you use any specific software or tools? Mentioning specific technical stacks can significantly improve your resume quality.",
  },
  no_results: {
    zh: "建议补充项目的具体成果或性能指标，如效率提升、完成的功能或测试结果。",
    en: "Consider adding specific project outcomes or performance metrics, such as efficiency improvements, completed features, or test results.",
  },
  no_methodology: {
    zh: "建议说明使用了什么方法或工具，而不仅仅是做了什么。",
    en: "Consider explaining what methods or tools you used, not just what you did.",
  },
  control_specific: {
    zh: "申请控制方向，建议提及具体的控制方法（如 PID）、仿真工具（MATLAB/Simulink）或系统建模经验。",
    en: "For control majors, consider mentioning specific control methods (e.g., PID), simulation tools (MATLAB/Simulink), or system modeling experience.",
  },
  no_python_matlab: {
    zh: "建议包含 Python 和 MATLAB，这是英国工程硕士申请中最常见的技术技能。",
    en: "Consider including Python and MATLAB, which are the most common technical skills in UK engineering Master's applications.",
  },
  no_language: {
    zh: "技能部分建议包含语言能力（如 IELTS 成绩），这是申请英国学校的必要信息。",
    en: "Consider including language proficiency (e.g., IELTS score) in the skills section, as this is essential information for UK school applications.",
  },
};

function generateMissingHints(text: string, sectionType: string, major: string, locale: Locale): string[] {
  const hints: string[] = [];
  const lower = text.toLowerCase();

  if (["project", "research", "internship"].includes(sectionType)) {
    if (!/matlab|python|c\+\+|simulink|software|tool/i.test(lower)) {
      hints.push(MISSING_HINTS.no_tools[locale]);
    }
    if (!/result|outcome|improve|achieve|complete|design|build|implement/i.test(lower)) {
      hints.push(MISSING_HINTS.no_results[locale]);
    }
    if (!/using|by|with|through|during/i.test(lower)) {
      hints.push(MISSING_HINTS.no_methodology[locale]);
    }
    if (sectionType === "project" && major === "control") {
      if (!/control|pid|simulation|model|system/i.test(lower)) {
        hints.push(MISSING_HINTS.control_specific[locale]);
      }
    }
  }

  if (sectionType === "skill") {
    if (!/python|matlab/i.test(lower)) {
      hints.push(MISSING_HINTS.no_python_matlab[locale]);
    }
    if (!/language|english|certificate|ielts/i.test(lower)) {
      hints.push(MISSING_HINTS.no_language[locale]);
    }
  }

  return hints;
}

function getMajorLabel(major: string, locale: Locale): string {
  const labels: Record<string, { zh: string; en: string }> = {
    mechanical: { zh: "机械工程", en: "Mechanical" },
    electrical: { zh: "电气工程", en: "Electrical" },
    electronic: { zh: "电子信息", en: "Electronic" },
    control: { zh: "控制工程", en: "Control" },
    energy: { zh: "能源与动力", en: "Energy" },
    materials: { zh: "材料工程", en: "Materials" },
    civil: { zh: "土木工程", en: "Civil" },
    computer: { zh: "计算机", en: "Computer" },
    automotive: { zh: "车辆工程", en: "Automotive" },
    aerospace: { zh: "航空航天", en: "Aerospace" },
    chemical: { zh: "化学工程", en: "Chemical" },
    other: { zh: "工科", en: "Engineering" },
  };
  return labels[major]?.[locale] || (locale === "en" ? "Engineering" : "工科");
}
