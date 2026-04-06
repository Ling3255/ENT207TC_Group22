// Canonical taxonomy constants — used across engine, UI, and parser
// These are the single source of truth for normalisation

export const CANONICAL_MAJORS = [
  "mechanical_engineering",
  "aerospace_engineering",
  "electrical_engineering",
  "electronic_engineering",
  "mechatronics",
  "energy_engineering",
  "control_engineering",
  "robotics",
  "materials_engineering",
  "civil_engineering",
  "chemical_engineering",
  "computer_engineering",
] as const;

export const CANONICAL_MODULES = [
  "mathematics",
  "engineering_mathematics",
  "circuits",
  "applied_electricity",
  "control_theory",
  "signals_and_systems",
  "machine_learning_basic",
  "thermodynamics",
  "fluid_dynamics",
  "heat_transfer",
  "solid_mechanics",
  "structural_dynamics",
  "finite_element_analysis",
  "power_systems",
  "power_electronics",
  "embedded_systems",
  "programming",
  "data_structures",
  "optimisation",
] as const;

export const ENGLISH_LEVELS = ["standard", "good", "advanced"] as const;

export const ELIGIBILITY_BANDS = ["eligible", "borderline", "not_eligible"] as const;

// Background alias map — common Chinese/English names → canonical
export const MAJOR_ALIAS_MAP: Record<string, string> = {
  // mechanical
  "机械工程": "mechanical_engineering",
  "机械设计制造及其自动化": "mechanical_engineering",
  "机械设计制造": "mechanical_engineering",
  "机械电子工程": "mechanical_engineering",
  "Mechanical Engineering": "mechanical_engineering",
  "Mechanical": "mechanical_engineering",
  "机械": "mechanical_engineering",
  // aerospace
  "航空航天工程": "aerospace_engineering",
  "飞行器设计": "aerospace_engineering",
  "Aerospace Engineering": "aerospace_engineering",
  "航空航天": "aerospace_engineering",
  // electrical
  "电气工程": "electrical_engineering",
  "Electrical Engineering": "electrical_engineering",
  "Electrical": "electrical_engineering",
  "电气": "electrical_engineering",
  // electronic
  "电子信息工程": "electronic_engineering",
  "电子科学与技术": "electronic_engineering",
  "Electronic Engineering": "electronic_engineering",
  "电子": "electronic_engineering",
  // mechatronics
  "机电一体化": "mechatronics",
  "Mechatronics": "mechatronics",
  "机电": "mechatronics",
  // energy
  "能源与动力工程": "energy_engineering",
  "能源工程": "energy_engineering",
  "Energy Engineering": "energy_engineering",
  "能源": "energy_engineering",
  // control
  "自动化": "control_engineering",
  "控制科学与工程": "control_engineering",
  "Control Engineering": "control_engineering",
  "控制": "control_engineering",
  // robotics
  "机器人工程": "robotics",
  "Robotics": "robotics",
  "机器人": "robotics",
  // materials
  "材料科学与工程": "materials_engineering",
  "Materials Engineering": "materials_engineering",
  "材料": "materials_engineering",
  // civil
  "土木工程": "civil_engineering",
  "Civil Engineering": "civil_engineering",
  "土木": "civil_engineering",
  // chemical
  "化学工程与工艺": "chemical_engineering",
  "Chemical Engineering": "chemical_engineering",
  "化工": "chemical_engineering",
  // computer
  "计算机科学与技术": "computer_engineering",
  "Computer Engineering": "computer_engineering",
  "计算机": "computer_engineering",
};

// Module alias map — common names → canonical
export const MODULE_ALIAS_MAP: Record<string, string> = {
  // mathematics
  "高等数学": "mathematics",
  "微积分": "mathematics",
  " Calculus": "mathematics",
  "线性代数": "mathematics",
  "Linear Algebra": "mathematics",
  "微分方程": "mathematics",
  "Differential Equations": "mathematics",
  "Mathematics": "mathematics",
  "Maths": "mathematics",
  // engineering mathematics
  "工程数学": "engineering_mathematics",
  "Engineering Mathematics": "engineering_mathematics",
  // circuits
  "电路": "circuits",
  "电路分析": "circuits",
  "Circuit Analysis": "circuits",
  "Circuits": "circuits",
  // applied electricity
  "电工电子学": "applied_electricity",
  "电工学": "applied_electricity",
  "Applied Electricity": "applied_electricity",
  "电工基础": "applied_electricity",
  // control theory
  "控制理论": "control_theory",
  "自动控制原理": "control_theory",
  "Control Theory": "control_theory",
  "Control": "control_theory",
  // signals and systems
  "信号与系统": "signals_and_systems",
  "Signals and Systems": "signals_and_systems",
  "信号系统": "signals_and_systems",
  // thermodynamics
  "热力学": "thermodynamics",
  "Thermodynamics": "thermodynamics",
  "工程热力学": "thermodynamics",
  // fluid dynamics
  "流体力学": "fluid_dynamics",
  "Fluid Mechanics": "fluid_dynamics",
  "流体力学基础": "fluid_dynamics",
  // heat transfer
  "传热学": "heat_transfer",
  "Heat Transfer": "heat_transfer",
  "热传递": "heat_transfer",
  // solid mechanics
  "理论力学": "solid_mechanics",
  "材料力学": "solid_mechanics",
  "Solid Mechanics": "solid_mechanics",
  "Mechanics of Materials": "solid_mechanics",
  // structural dynamics
  "结构动力学": "structural_dynamics",
  "Structural Dynamics": "structural_dynamics",
  // finite element
  "有限元分析": "finite_element_analysis",
  "Finite Element Analysis": "finite_element_analysis",
  "FEA": "finite_element_analysis",
  // power systems
  "电力系统": "power_systems",
  "Power Systems": "power_systems",
  "电力系统分析": "power_systems",
  // power electronics
  "电力电子技术": "power_electronics",
  "Power Electronics": "power_electronics",
  "电力电子": "power_electronics",
  // embedded systems
  "嵌入式系统": "embedded_systems",
  "Embedded Systems": "embedded_systems",
  "嵌入式": "embedded_systems",
  // programming
  "C语言程序设计": "programming",
  "程序设计基础": "programming",
  "Programming": "programming",
  "C语言": "programming",
};

// UK classification reference
export const UK_CLASSIFICATION_MAP: Record<string, { minGpa4: number; description: string }> = {
  "first": { minGpa4: 3.7, description: "一等荣誉 (First Class)" },
  "2:1": { minGpa4: 3.3, description: "二等一荣誉 (Upper Second / 2:1)" },
  "2:2": { minGpa4: 3.0, description: "二等二荣誉 (Lower Second / 2:2)" },
  "third": { minGpa4: 2.7, description: "三等荣誉 (Third Class)" },
  "upper_second_2_1": { minGpa4: 3.3, description: "二等一荣誉 (Upper Second / 2:1)" },
  "lower_second_2_2": { minGpa4: 3.0, description: "二等二荣誉 (Lower Second / 2:2)" },
};

// Chinese GPA to 4.0 scale conversion (rough reference)
export const CHINESE_GPA_RANGES: Record<string, number> = {
  "90-100": 4.0,
  "85-89": 3.9,
  "82-84": 3.7,
  "78-81": 3.5,
  "75-77": 3.3,
  "72-74": 3.0,
  "68-71": 2.7,
  "64-67": 2.3,
  "60-63": 2.0,
};

// Language test validity in months
export const ENGLISH_VALIDITY_MONTHS = 24; // standard 2-year validity for UKVI

export function normaliseMajor(major: string): string {
  const trimmed = major.trim();
  return MAJOR_ALIAS_MAP[trimmed] ?? MAJOR_ALIAS_MAP[trimmed.toLowerCase()] ?? trimmed.toLowerCase().replace(/\s+/g, "_");
}

export function normaliseModule(moduleName: string): string {
  const trimmed = moduleName.trim();
  return MODULE_ALIAS_MAP[trimmed] ?? MODULE_ALIAS_MAP[trimmed.toLowerCase()] ?? trimmed.toLowerCase().replace(/\s+/g, "_");
}

export function toCanonical(text: string): string {
  return text.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
}
