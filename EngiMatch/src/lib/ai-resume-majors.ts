export type Locale = "zh" | "en";

export interface AiResumeMajorOption {
  value: string;
  zh: string;
  en: string;
  icon: string;
}

export const AI_RESUME_MAJOR_OPTIONS: AiResumeMajorOption[] = [
  { value: "mechanical_engineering", zh: "机械工程", en: "Mechanical Engineering", icon: "⚙️" },
  { value: "aerospace_engineering", zh: "航空航天工程", en: "Aerospace Engineering", icon: "✈️" },
  { value: "automotive_engineering", zh: "车辆工程", en: "Automotive Engineering", icon: "🚗" },
  { value: "electrical_engineering", zh: "电气工程", en: "Electrical Engineering", icon: "🔌" },
  { value: "electronic_engineering", zh: "电子工程", en: "Electronic Engineering", icon: "📡" },
  { value: "control_engineering", zh: "控制科学与工程", en: "Control Engineering", icon: "🎛️" },
  { value: "robotics", zh: "机器人工程", en: "Robotics", icon: "🤖" },
  { value: "mechatronics", zh: "机电一体化", en: "Mechatronics", icon: "🛠️" },
  { value: "energy_engineering", zh: "能源与动力工程", en: "Energy Engineering", icon: "🔥" },
  { value: "materials_engineering", zh: "材料工程", en: "Materials Engineering", icon: "🧪" },
  { value: "civil_engineering", zh: "土木工程", en: "Civil Engineering", icon: "🏗️" },
  { value: "structural_engineering", zh: "结构工程", en: "Structural Engineering", icon: "🏢" },
  { value: "environmental_engineering", zh: "环境工程", en: "Environmental Engineering", icon: "🌿" },
  { value: "chemical_engineering", zh: "化学工程", en: "Chemical Engineering", icon: "⚗️" },
  { value: "computer_engineering", zh: "计算机工程", en: "Computer Engineering", icon: "💻" },
  { value: "artificial_intelligence", zh: "人工智能", en: "Artificial Intelligence", icon: "🧠" },
  { value: "software_engineering", zh: "软件工程", en: "Software Engineering", icon: "🧩" },
  { value: "engineering_mathematics", zh: "工程数学", en: "Engineering Mathematics", icon: "📐" },
  { value: "manufacturing_engineering", zh: "制造工程", en: "Manufacturing Engineering", icon: "🏭" },
  { value: "biomedical_engineering", zh: "生物医学工程", en: "Biomedical Engineering", icon: "🩺" },
  { value: "industrial_engineering", zh: "工业工程", en: "Industrial Engineering", icon: "📊" },
  { value: "engineering_management", zh: "工程管理", en: "Engineering Management", icon: "📁" },
  { value: "general_engineering", zh: "综合工程方向", en: "General Engineering", icon: "🧭" },
];

const AI_RESUME_MAJOR_ALIAS_MAP: Record<string, string> = {
  mechanical: "mechanical_engineering",
  electrical: "electrical_engineering",
  electronic: "electronic_engineering",
  control: "control_engineering",
  energy: "energy_engineering",
  materials: "materials_engineering",
  civil: "civil_engineering",
  computer: "computer_engineering",
  automotive: "automotive_engineering",
  aerospace: "aerospace_engineering",
  chemical: "chemical_engineering",
  other: "general_engineering",
  ai: "artificial_intelligence",
  artificial_intelligence: "artificial_intelligence",
  software: "software_engineering",
  software_engineering: "software_engineering",
  engineering_mathematics: "engineering_mathematics",
  structural: "structural_engineering",
  structural_engineering: "structural_engineering",
  environmental: "environmental_engineering",
  environmental_engineering: "environmental_engineering",
  manufacturing: "manufacturing_engineering",
  manufacturing_engineering: "manufacturing_engineering",
  biomedical: "biomedical_engineering",
  biomedical_engineering: "biomedical_engineering",
  industrial: "industrial_engineering",
  industrial_engineering: "industrial_engineering",
  engineering_management: "engineering_management",
  general_engineering: "general_engineering",
};

const AI_RESUME_MAJOR_LOOKUP = new Map(
  AI_RESUME_MAJOR_OPTIONS.map((option) => [option.value, option])
);

export function normalizeAiResumeMajor(major: string): string {
  const key = major.trim().toLowerCase();
  return AI_RESUME_MAJOR_ALIAS_MAP[key] ?? key;
}

export function getAiResumeMajorOption(major: string): AiResumeMajorOption | null {
  const normalized = normalizeAiResumeMajor(major);
  return AI_RESUME_MAJOR_LOOKUP.get(normalized) ?? null;
}

export function getAiResumeMajorLabel(major: string, locale: Locale): string {
  const option = getAiResumeMajorOption(major);
  if (option) {
    return locale === "en" ? option.en : option.zh;
  }
  const normalized = normalizeAiResumeMajor(major);
  return normalized || (locale === "en" ? "Engineering" : "工程方向");
}
