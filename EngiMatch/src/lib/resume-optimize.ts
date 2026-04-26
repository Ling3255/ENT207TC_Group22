import { getAiResumeMajorLabel, normalizeAiResumeMajor } from "@/lib/ai-resume-majors";

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
  "Designed",
  "Implemented",
  "Developed",
  "Analyzed",
  "Optimized",
  "Built",
  "Configured",
  "Simulated",
  "Constructed",
  "Integrated",
  "Verified",
  "Evaluated",
  "Investigated",
];

const WEAK_PATTERNS: Array<{ pattern: RegExp; fix: string | ((match: string) => string) }> = [
  { pattern: /\bresponsible for\b/gi, fix: "Led" },
  { pattern: /\bhelped with\b/gi, fix: "Contributed to" },
  { pattern: /\bparticipated in\b/gi, fix: "Worked on" },
  { pattern: /\btook part in\b/gi, fix: "Worked on" },
  { pattern: /\bworked on\b/gi, fix: "Developed" },
  { pattern: /\bgood at\b/gi, fix: "Proficient in" },
  { pattern: /\bknow\b/gi, fix: "Experienced in" },
  { pattern: /\busing matlab\b/gi, fix: "using MATLAB/Simulink" },
];

const VARIANT_LABELS = {
  conservative: {
    zh: { label: "保守润色版", desc: "修正表达问题，保留原意，适合轻量修改" },
    en: { label: "Conservative Polish", desc: "Fix expression issues while preserving your original meaning" },
  },
  action_verb: {
    zh: { label: "动词强化版", desc: "用更有行动力的表达方式突出你的贡献" },
    en: { label: "Action Verb Version", desc: "Use stronger action verbs to highlight your contribution" },
  },
  major_specific: {
    zh: { label: "专业强化版", desc: "围绕目标方向补强技术关键词和专业表达" },
    en: { label: "Major-Focused Version", desc: "Add technical emphasis aligned with your target direction" },
  },
  format_only: {
    zh: { label: "格式优化版", desc: "整理格式并提升可读性" },
    en: { label: "Format Optimization", desc: "Clean up format and improve readability" },
  },
} as const;

const MAJOR_KEYWORDS: Record<string, string[]> = {
  mechanical_engineering: ["SolidWorks", "ANSYS", "AutoCAD", "CAD", "FEA", "CFD", "MATLAB", "mechanical design"],
  aerospace_engineering: ["aerodynamics", "CFD", "Abaqus", "flight dynamics", "airframe", "propulsion", "MATLAB"],
  automotive_engineering: ["vehicle dynamics", "CAN bus", "MATLAB/Simulink", "AVL", "battery systems", "powertrain"],
  electrical_engineering: ["MATLAB/Simulink", "power systems", "circuit analysis", "embedded systems", "power electronics", "PCB"],
  electronic_engineering: ["FPGA", "Verilog", "VHDL", "embedded C", "circuit design", "signal processing", "PCB"],
  control_engineering: ["PID", "control theory", "state-space", "MATLAB/Simulink", "system modeling", "Kalman filter", "PLC"],
  robotics: ["ROS", "motion planning", "SLAM", "control", "embedded systems", "computer vision", "MATLAB"],
  mechatronics: ["embedded systems", "sensors", "actuators", "PLC", "control", "mechanical design", "integration"],
  energy_engineering: ["thermodynamics", "heat transfer", "CFD", "energy systems", "HVAC", "renewables", "power generation"],
  materials_engineering: ["SEM", "XRD", "materials testing", "composites", "microstructure", "metallurgy"],
  civil_engineering: ["structural analysis", "BIM", "AutoCAD", "construction", "geotechnical", "transport", "SAP2000"],
  structural_engineering: ["finite element analysis", "structural dynamics", "STAAD", "SAP2000", "Eurocode", "load analysis"],
  environmental_engineering: ["sustainability", "water treatment", "LCA", "environmental modeling", "carbon analysis"],
  chemical_engineering: ["Aspen Plus", "process simulation", "mass transfer", "reactor design", "process optimization"],
  computer_engineering: ["Python", "C++", "embedded systems", "computer architecture", "machine learning", "Git"],
  artificial_intelligence: ["Python", "PyTorch", "TensorFlow", "deep learning", "computer vision", "NLP", "data pipeline"],
  software_engineering: ["Python", "Java", "TypeScript", "Git", "Docker", "backend", "testing", "system design"],
  engineering_mathematics: ["optimization", "numerical methods", "MATLAB", "statistics", "modeling", "simulation"],
  manufacturing_engineering: ["lean manufacturing", "CNC", "process planning", "quality control", "Six Sigma", "automation"],
  biomedical_engineering: ["medical imaging", "biosensors", "signal processing", "biomechanics", "healthcare devices"],
  industrial_engineering: ["operations research", "optimization", "process improvement", "supply chain", "data analysis"],
  engineering_management: ["project management", "stakeholder coordination", "budgeting", "delivery planning", "risk management"],
  general_engineering: [],
};

const MISSING_HINTS = {
  no_tools: {
    zh: "建议补充你实际使用的软件、编程语言或实验工具，这能明显提升工科简历的可信度。",
    en: "Consider adding the specific software, programming languages, or lab tools you used.",
  },
  no_results: {
    zh: "建议补充项目结果或量化指标，例如效率提升、误差降低、完成时间缩短等。",
    en: "Consider adding project outcomes or quantified metrics such as efficiency gains or error reduction.",
  },
  no_methodology: {
    zh: "建议说明你是如何完成这项工作的，例如采用了什么方法、模型、算法或仿真流程。",
    en: "Explain how the work was completed, such as the method, model, algorithm, or simulation workflow you used.",
  },
  no_language: {
    zh: "建议在技能或附加信息部分补充英语成绩或语言能力说明。",
    en: "Consider adding language proficiency information such as IELTS or other English test scores.",
  },
  no_core_tools: {
    zh: "建议补充与目标方向高度相关的核心工具或技术栈。",
    en: "Consider adding core tools or technical stacks that are highly relevant to your target direction.",
  },
} as const;

function applyTextFixes(text: string): string {
  let result = text.trim();
  for (const item of WEAK_PATTERNS) {
    result = result.replace(item.pattern, item.fix as any);
  }
  if (result.length > 0) {
    result = result[0].toUpperCase() + result.slice(1);
  }
  return result;
}

function makeActionVerbFirst(text: string): string {
  const lines = text.split("\n").filter((line) => line.trim());
  return lines
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return "";
      if (/^(i |we |responsible|helped|participated|worked)/i.test(trimmed)) {
        const remainder = trimmed.replace(/^(i |we |responsible for |helped with |participated in |worked on )/i, "");
        const preferredVerb = STRONG_VERBS.find((verb) => remainder.toLowerCase().startsWith(verb.toLowerCase()));
        return `- ${preferredVerb ?? "Implemented"} ${remainder}`;
      }
      return trimmed.startsWith("-") ? trimmed : `- ${trimmed}`;
    })
    .join("\n");
}

function addQuantificationEnhancement(text: string, locale: Locale): string {
  if (/\d+%|\d+\s*(times|students|teams|iterations)|improved|reduced|increased|achieved/i.test(text)) {
    return text;
  }

  const hint = locale === "en" ? "[Add a measurable outcome here]" : "[建议补充一个量化结果]";
  return text
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (trimmed.length > 20 && (trimmed.startsWith("-") || trimmed.startsWith("•"))) {
        return `${trimmed} ${hint}`;
      }
      return trimmed;
    })
    .join("\n");
}

function enhanceForMajor(text: string, major: string): string {
  const normalizedMajor = normalizeAiResumeMajor(major);
  const keywords = MAJOR_KEYWORDS[normalizedMajor] ?? [];
  if (keywords.length === 0) {
    return text.trim();
  }

  const lower = text.toLowerCase();
  const missingKeywords = keywords.filter((keyword) => !lower.includes(keyword.toLowerCase())).slice(0, 3);
  if (missingKeywords.length === 0) {
    return text.trim();
  }

  return `${text.trim()}\n- Relevant technical focus: ${missingKeywords.join(", ")}`;
}

function generateMissingHints(text: string, sectionType: string, major: string, locale: Locale): string[] {
  const normalizedMajor = normalizeAiResumeMajor(major);
  const lower = text.toLowerCase();
  const hints: string[] = [];

  if (["project", "research", "internship"].includes(sectionType)) {
    if (!/matlab|python|c\+\+|simulink|autocad|ansys|solidworks|fpga|excel|cad|labview|pytorch|tensorflow/i.test(lower)) {
      hints.push(MISSING_HINTS.no_tools[locale]);
    }
    if (!/result|outcome|improve|reduced|increased|achieved|completed|designed|developed|\d+%/i.test(lower)) {
      hints.push(MISSING_HINTS.no_results[locale]);
    }
    if (!/using|with|through|based on|model|simulation|analysis|algorithm|design/i.test(lower)) {
      hints.push(MISSING_HINTS.no_methodology[locale]);
    }
  }

  if (sectionType === "skill" && !/ielts|toefl|english|language/i.test(lower)) {
    hints.push(MISSING_HINTS.no_language[locale]);
  }

  const recommendedKeywords = MAJOR_KEYWORDS[normalizedMajor] ?? [];
  if (recommendedKeywords.length > 0 && !recommendedKeywords.some((keyword) => lower.includes(keyword.toLowerCase()))) {
    hints.push(MISSING_HINTS.no_core_tools[locale]);
  }

  return hints;
}

export function optimizeSection(
  original: string,
  sectionType: string,
  major: string,
  locale: Locale = "zh"
): OptimizationResult {
  const normalizedMajor = normalizeAiResumeMajor(major);
  const conservative = applyTextFixes(original);
  const actionVersion = makeActionVerbFirst(original);
  const majorEnhanced = enhanceForMajor(original, normalizedMajor);

  const variants: OptimizationVariant[] = [];

  if (conservative !== original.trim()) {
    const meta = VARIANT_LABELS.conservative[locale];
    variants.push({
      id: "conservative",
      label: meta.label,
      description: meta.desc,
      text: conservative,
    });
  }

  if (actionVersion !== original.trim() && actionVersion !== conservative) {
    const meta = VARIANT_LABELS.action_verb[locale];
    variants.push({
      id: "action_verb",
      label: meta.label,
      description: meta.desc,
      text: actionVersion,
    });
  }

  if (majorEnhanced !== original.trim()) {
    const meta = VARIANT_LABELS.major_specific[locale];
    variants.push({
      id: "major_specific",
      label:
        locale === "en"
          ? `${getAiResumeMajorLabel(normalizedMajor, locale)} Focus`
          : `${getAiResumeMajorLabel(normalizedMajor, locale)}强化版`,
      description: meta.desc,
      text: majorEnhanced,
    });
  }

  if (variants.length === 0) {
    const meta = VARIANT_LABELS.format_only[locale];
    variants.push({
      id: "format_only",
      label: meta.label,
      description: meta.desc,
      text: addQuantificationEnhancement(original.trim(), locale),
    });
  }

  return {
    original: original.trim(),
    variants,
    missingHints: generateMissingHints(original, sectionType, normalizedMajor, locale),
  };
}
