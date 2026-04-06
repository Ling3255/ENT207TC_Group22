// Rule-based parser — pattern matching for UK engineering MSc requirements
// Uses regex and keyword detection to extract structured fields from raw text

import { toCanonical } from "@/lib/taxonomy";

// ─── UK Classification Detection ───────────────────────────────────

const UK_CLASS_PATTERNS: Array<{ pattern: RegExp; value: string }> = [
  { pattern: /\bfirst\s*class\b/i, value: "first" },
  { pattern: /\b2[:\s-]?1\b/i, value: "2:1" },
  { pattern: /\bupper\s*second\b/i, value: "2:1" },
  { pattern: /\b2[:\s-]?2\b/i, value: "2:2" },
  { pattern: /\blower\s*second\b/i, value: "2:2" },
  { pattern: /\bthird\s*class\b/i, value: "third" },
  { pattern: /\bhigher\s*pass\b/i, value: "third" },
];

export function extractUkClassification(text: string): string | null {
  for (const { pattern, value } of UK_CLASS_PATTERNS) {
    if (pattern.test(text)) return value;
  }
  return null;
}

// ─── IELTS / TOEFL Score Extraction ────────────────────────────────

const IELTS_PATTERN = /\b(?:IELTS|ielts|雅思)[^\d]*(\d+\.?\d*)\s*(?:\(|（)?(?:overall|总分)[\s)）]*/i;
const IELTS_BAND_PATTERN = /\b(?:IELTS|ielts)[^\d]*(\d+\.?\d*)\s*\(?[^)]*\b(listening|reading|writing|speaking)[\s:．:]*(\d+\.?\d*)/gi;
const TOEFL_PATTERN = /\b(?:TOEFL|toefl)[^\d]*(\d{2,3})\s*(?:\(|（)?(?:overall|总分)[\s)）]*/i;

export function extractIeltsScore(text: string): { overall: number | null; lrw_min: number | null } {
  const overallMatch = text.match(IELTS_PATTERN);
  const overall = overallMatch ? parseFloat(overallMatch[1]) : null;

  // Find minimum sub-score across all bands mentioned
  const bandMatches = [...text.matchAll(IELTS_BAND_PATTERN)];
  const bands = bandMatches.map((m) => parseFloat(m[2]));
  const lrw_min = bands.length > 0 ? Math.min(...bands) : null;

  return { overall, lrw_min };
}

export function extractToeflScore(text: string): number | null {
  const match = text.match(TOEFL_PATTERN);
  return match ? parseInt(match[1]) : null;
}

export function extractEnglishLevel(text: string): "standard" | "good" | "advanced" | null {
  const lower = text.toLowerCase();
  if (lower.includes("advanced")) return "advanced";
  if (lower.includes("good")) return "good";
  if (lower.includes("standard")) return "standard";
  return null;
}

// ─── Fee Extraction ───────────────────────────────────────────────────

const FEE_PATTERNS = [
  /(?:overseas|international|海外|国际)[^\d]*£?([\d,]+)\s*(?:£|GBP)?/i,
  /(?:tuition|tuition\s*fee|学费)[^\d]*£?([\d,]+)\s*(?:£|GBP)?/i,
  /£([\d,]+)\s*(?:per\s*year|pa|每年)?/i,
];

export function extractFee(text: string): { home?: number; overseas?: number } {
  const result: { home?: number; overseas?: number } = {};

  for (const { pattern, ...kind } of FEE_PATTERNS.map((p, i) => ({ pattern: p, kind: i }))) {
    const match = text.match(pattern);
    if (match) {
      const num = parseInt(match[1].replace(/,/g, ""));
      if (kind.kind === 0) result.overseas = num;
      else result.home = num;
    }
  }

  return result;
}

// ─── Deadline Extraction ─────────────────────────────────────────────

const DEADLINE_PATTERNS = [
  /(\d{1,2})\s*[\/\-.]?\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,]+(?:20)?(\d{4})/gi,
  /(?:deadline|申请截止|截止日期|截止)[^\d]*(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/gi,
  /(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/g,
];

export function extractDates(text: string): { visa?: Date; nonVisa?: Date } {
  const result: { visa?: Date; nonVisa?: Date } = {};
  const lines = text.split("\n").map((l) => l.trim());

  for (const line of lines) {
    if (line.toLowerCase().includes("visa") || line.toLowerCase().includes("需要签证")) {
      const match = line.match(DEADLINE_PATTERNS[0]) ?? line.match(DEADLINE_PATTERNS[1]);
      if (match) {
        try {
          result.visa = parseDate(match[0]);
        } catch {}
      }
    } else {
      const match = line.match(DEADLINE_PATTERNS[0]);
      if (match && !result.nonVisa) {
        try {
          result.nonVisa = parseDate(match[0]);
        } catch {}
      }
    }
  }

  return result;
}

const MONTH_MAP: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

function parseDate(raw: string): Date {
  const match = raw.match(/(\d{1,2})\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,]+(?:20)?(\d{4})/i);
  if (match) {
    const day = parseInt(match[1]);
    const month = MONTH_MAP[match[2].toLowerCase().slice(0, 3)];
    const year = parseInt(match[3]);
    return new Date(year, month, day);
  }
  const simple = raw.match(/(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/);
  if (simple) {
    return new Date(parseInt(simple[1]), parseInt(simple[2]) - 1, parseInt(simple[3]));
  }
  throw new Error(`Cannot parse date: ${raw}`);
}

// ─── ATAS Detection ─────────────────────────────────────────────────

const ATAS_PATTERNS = [
  /ATAS/i,
  /Academic\s*Technology\s*Approval\s*Scheme/i,
  /CAH3/i,
  /technology\s*approval/i,
];

export function detectAtas(text: string): { possible: boolean; ruleText: string | null } {
  for (const pattern of ATAS_PATTERNS) {
    if (pattern.test(text)) {
      // Extract surrounding context
      const idx = text.search(pattern);
      const start = Math.max(0, idx - 50);
      const end = Math.min(text.length, idx + 150);
      return { possible: true, ruleText: text.slice(start, end).trim() };
    }
  }
  return { possible: false, ruleText: null };
}

// ─── Prerequisite Module Detection ──────────────────────────────────

const MODULE_KW_MAP: Record<string, string> = {
  mathematics: "mathematics",
  calculus: "mathematics",
  "linear algebra": "mathematics",
  "differential equations": "mathematics",
  "engineering mathematics": "engineering_mathematics",
  "maths for": "engineering_mathematics",
  "applied electricity": "applied_electricity",
  "circuit": "circuits",
  electronics: "circuits",
  "control theory": "control_theory",
  "control systems": "control_theory",
  "signals and systems": "signals_and_systems",
  thermodynamics: "thermodynamics",
  "heat transfer": "heat_transfer",
  "fluid mechanics": "fluid_dynamics",
  "fluid dynamics": "fluid_dynamics",
  "solid mechanics": "solid_mechanics",
  "structural dynamics": "structural_dynamics",
  "finite element": "finite_element_analysis",
  "power systems": "power_systems",
  "power electronics": "power_electronics",
  "embedded systems": "embedded_systems",
  programming: "programming",
};

export function extractPrerequisiteModules(text: string): Array<{ canonical: string; display: string; required: boolean }> {
  const results: Array<{ canonical: string; display: string; required: boolean }> = [];
  const lower = text.toLowerCase();

  // Split into lines and look for module-like patterns
  const lines = text.split("\n").filter((l) => l.trim().length > 0);

  for (const line of lines) {
    const lineLower = line.toLowerCase();

    for (const [kw, canonical] of Object.entries(MODULE_KW_MAP)) {
      if (lineLower.includes(kw)) {
        const required = !lineLower.includes("preferred") && !lineLower.includes("desirable") && !lineLower.includes("advantage");
        const display = line.trim().replace(/^[•\-\*\d\.]+\s*/, "").slice(0, 120);
        if (!results.find((r) => r.canonical === canonical)) {
          results.push({ canonical, display, required });
        }
      }
    }
  }

  return results;
}

// ─── Document Requirements Detection ─────────────────────────────────

export function extractDocumentRequirements(text: string): {
  transcript_required: boolean;
  personal_statement_required: boolean;
  references_required_count: number | null;
  cv_resume_required: boolean;
} {
  const lower = text.toLowerCase();

  const transcript = /transcript|official\s*academic\s*record|成绩单|academic\s*record/i.test(lower);
  const ps = /personal\s*statement|statement\s*of\s*purpose|个人陈述/i.test(lower);
  const cv = /curriculum\s*vitae|cv|r[eé]sum[eé]|简历/i.test(lower);

  const refMatch = lower.match(/(?:two|2|一|二)[^\d]*reference/i) ?? lower.match(/\b\d+\b\s+reference/);
  const refCount = refMatch ? parseInt(refMatch[0].match(/\d+/)?.[0] ?? "0") : null;

  return {
    transcript_required: transcript,
    personal_statement_required: ps,
    references_required_count: refCount,
    cv_resume_required: cv,
  };
}

// ─── Accepted Backgrounds Detection ─────────────────────────────────

const BACKGROUND_KW: Record<string, string> = {
  "mechanical engineering": "mechanical_engineering",
  mechanical: "mechanical_engineering",
  "aerospace engineering": "aerospace_engineering",
  aerospace: "aerospace_engineering",
  "electrical engineering": "electrical_engineering",
  electrical: "electrical_engineering",
  "electronic engineering": "electronic_engineering",
  electronic: "electronic_engineering",
  mechatronics: "mechatronics",
  "energy engineering": "energy_engineering",
  "control engineering": "control_engineering",
  control: "control_engineering",
  robotics: "robotics",
  "materials engineering": "materials_engineering",
  materials: "materials_engineering",
  "civil engineering": "civil_engineering",
  civil: "civil_engineering",
  "chemical engineering": "chemical_engineering",
  chemical: "chemical_engineering",
  "computer engineering": "computer_engineering",
  computer: "computer_engineering",
};

export function extractAcceptedBackgrounds(text: string): string[] {
  const lower = text.toLowerCase();
  const found: string[] = [];

  for (const [kw, canonical] of Object.entries(BACKGROUND_KW)) {
    if (lower.includes(kw)) {
      if (!found.includes(canonical)) found.push(canonical);
    }
  }

  return found;
}

// ─── Master Parser ────────────────────────────────────────────────────

export interface ParsedProgrammeFields {
  min_uk_classification: string | null;
  accepted_backgrounds: string[];
  prerequisite_modules: Array<{ canonical: string; display: string; required: boolean }>;
  ielts_overall: number | null;
  ielts_lrw_min: number | null;
  toefl_total: number | null;
  transcript_required: boolean;
  personal_statement_required: boolean;
  references_required_count: number | null;
  cv_resume_required: boolean;
  atas_possible: boolean;
  atas_rule_text: string | null;
  confidence_score: number;
}

export function parseProgrammePage(text: string): ParsedProgrammeFields {
  const ielts = extractIeltsScore(text);
  const atas = detectAtas(text);
  const prereqs = extractPrerequisiteModules(text);
  const docs = extractDocumentRequirements(text);
  const backgrounds = extractAcceptedBackgrounds(text);

  // Compute confidence: how many fields were successfully extracted
  let fieldsFound = 0;
  if (extractUkClassification(text)) fieldsFound++;
  if (ielts.overall) fieldsFound++;
  if (extractToeflScore(text)) fieldsFound++;
  if (prereqs.length > 0) fieldsFound++;
  if (atas.possible) fieldsFound++;
  if (docs.transcript_required) fieldsFound++;
  if (backgrounds.length > 0) fieldsFound++;

  return {
    min_uk_classification: extractUkClassification(text),
    accepted_backgrounds: backgrounds,
    prerequisite_modules: prereqs,
    ielts_overall: ielts.overall,
    ielts_lrw_min: ielts.lrw_min,
    toefl_total: extractToeflScore(text),
    transcript_required: docs.transcript_required,
    personal_statement_required: docs.personal_statement_required,
    references_required_count: docs.references_required_count,
    cv_resume_required: docs.cv_resume_required,
    atas_possible: atas.possible,
    atas_rule_text: atas.ruleText,
    confidence_score: Math.round((fieldsFound / 7) * 100),
  };
}
