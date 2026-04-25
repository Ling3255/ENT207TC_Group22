// ══════════════════════════════════════════════════════════════════
// EngiMatch Eligibility Engine v0.1
// Evaluates applicant profiles against structured programme requirements
// ══════════════════════════════════════════════════════════════════

import { prisma } from "@/lib/prisma";
import {
  normaliseMajor,
  normaliseModule,
  UK_CLASSIFICATION_MAP,
} from "@/lib/taxonomy";

import type {
  Applicant,
  Programme,
  ProgrammeAcademicRequirement,
  ProgrammeLanguageRequirement,
  PrerequisiteModule,
} from "@prisma/client";

// ─── Types ──────────────────────────────────────────────────────────

export interface ApplicantModuleInput {
  module_name_raw: string;
  canonical_module_name?: string | null;
  grade_text?: string | null;
  grade_numeric?: number | string | null;
  credits?: number | null;
}

export interface EvaluationResult {
  applicantId: string;
  programmeId: string;
  eligibility_band: "eligible" | "borderline" | "not_eligible";
  academic_score: number;    // 0-100
  module_match_score: number; // 0-100
  language_score: number;    // 0-100
  compliance_flags: string[];
  missing_items: string[];
  explanation: EvaluationExplanation;
}

export interface EvaluationExplanation {
  degree_level: {
    status: "pass" | "fail" | "unknown";
    detail: string;
  };
  overall_grade: {
    status: "pass" | "close" | "fail" | "unknown";
    detail: string;
    gap?: number;
  };
  background: {
    status: "pass" | "partial" | "fail" | "unknown";
    detail: string;
    matched?: string;
  };
  prerequisite_modules: ModuleMatchResult[];
  language: LanguageResult;
  compliance: ComplianceResult;
  summary_zh: string;
}

export interface ModuleMatchResult {
  canonical_name: string;
  display_text: string;
  required: boolean;
  matched: boolean;
  matched_applicant_modules: string[];
  detail: string;
}

export interface LanguageResult {
  status: "pass" | "close" | "fail" | "not_provided";
  detail: string;
  gap?: number;
}

export interface ComplianceResult {
  flags: string[];
  detail: string;
}

// ─── Score constants ─────────────────────────────────────────────────

export interface EvaluationWeights {
  academic: {
    degreeLevel: number;
    overallGrade: number;
    backgroundMatch: number;
  };
  module: {
    allMet: number;
    partial: number;
    noneMet: number;
  };
  language: {
    pass: number;
    close: number;
    fail: number;
    notProvided: number;
  };
}

export const DEFAULT_WEIGHTS: EvaluationWeights = {
  academic: { degreeLevel: 20, overallGrade: 25, backgroundMatch: 20 },
  module: { allMet: 35, partial: 15, noneMet: 0 },
  language: { pass: 100, close: 50, fail: 0, notProvided: 0 },
};

// Keep backward-compatible constants
const SCORE_ACADEMIC = DEFAULT_WEIGHTS.academic;
const SCORE_MODULE = DEFAULT_WEIGHTS.module;
const SCORE_LANGUAGE = DEFAULT_WEIGHTS.language;

// ─── GPA Evaluation ───────────────────────────────────────────────────

function normaliseGpa(gpaNumeric: number | null, gpaScale: number): number {
  if (gpaNumeric === null || gpaScale === 0) return 0;
  return (Number(gpaNumeric) / Number(gpaScale)) * 4.0;
}

/**
 * Maps a UK classification string to minimum 4.0 GPA equivalent.
 * Returns null if classification is not in our reference table.
 */
function ukClassificationToMinGpa(classification: string | null): number | null {
  if (!classification) return null;
  const key = classification.toLowerCase().replace(/\s+/g, "_");
  return UK_CLASSIFICATION_MAP[key]?.minGpa4 ?? UK_CLASSIFICATION_MAP[key.replace(/["':]/g, "")]?.minGpa4 ?? null;
}

function evaluateOverallGrade(
  applicant: Pick<Applicant, "gpa_numeric" | "gpa_scale" | "grading_scheme">,
  minClassification: string | null
): { status: "pass" | "close" | "fail" | "unknown"; detail: string; gap?: number } {
  const minGpa4 = ukClassificationToMinGpa(minClassification);
  if (minGpa4 === null) {
    return { status: "unknown", detail: "该专业未明确规定最低UK学位等级要求。" };
  }

  const normGpa = normaliseGpa(Number(applicant.gpa_numeric), Number(applicant.gpa_scale) || 4.0);
  const gap = normGpa - minGpa4;

  if (gap >= 0) {
    return {
      status: "pass",
      detail: `你的GPA ${Number(applicant.gpa_numeric).toFixed(2)}/${Number(applicant.gpa_scale).toFixed(1)}（4.0制折算 ${normGpa.toFixed(2)}）满足最低要求（${minGpa4}）。`,
    };
  }

  const ukClassLabel = minClassification ? UK_CLASSIFICATION_MAP[minClassification.toLowerCase().replace(/\s+/g, "_")]?.description ?? minClassification : minClassification;

  if (gap >= -0.2) {
    return {
      status: "close",
      detail: `你的GPA ${Number(applicant.gpa_numeric).toFixed(2)}/${Number(applicant.gpa_scale).toFixed(1)}（4.0制折算 ${normGpa.toFixed(2)}）略低于 ${ukClassLabel} 等级要求，差距 ${(-gap).toFixed(2)}，属于边缘情况。建议补充相关经历或联系招生办确认。`,
      gap: -gap,
    };
  }

  return {
    status: "fail",
    detail: `你的GPA ${Number(applicant.gpa_numeric).toFixed(2)}/${Number(applicant.gpa_scale).toFixed(1)}（4.0制折算 ${normGpa.toFixed(2)}）未达到 ${ukClassLabel} 等级要求，差距 ${(-gap).toFixed(2)}。`,
    gap: -gap,
  };
}

// ─── Background Evaluation ───────────────────────────────────────────

function evaluateBackground(
  undergradMajor: string | null,
  acceptedBackgrounds: string[]
): { status: "pass" | "partial" | "fail" | "unknown"; detail: string; matched?: string } {
  if (!undergradMajor) {
    return { status: "unknown", detail: "未提供本科专业信息。" };
  }

  if (acceptedBackgrounds.length === 0) {
    return { status: "unknown", detail: "该专业未明确规定本科专业要求。" };
  }

  const canonicalMajor = normaliseMajor(undergradMajor);

  // Exact match
  if (acceptedBackgrounds.includes(canonicalMajor)) {
    return { status: "pass", detail: `你的专业「${undergradMajor}」在项目接受范围内。`, matched: canonicalMajor };
  }

  // Partial match (check if any accepted background contains the major keyword)
  const matched = acceptedBackgrounds.find((ab) => {
    const abLower = ab.toLowerCase();
    return abLower.includes(canonicalMajor) || canonicalMajor.includes(abLower.split("_")[0]);
  });

  if (matched) {
    return { status: "pass", detail: `你的专业「${undergradMajor}」与「${matched}」相近，在项目接受范围内。`, matched };
  }

  return {
    status: "fail",
    detail: `你的专业「${undergradMajor}」不在该项目的接受范围内（接受：${acceptedBackgrounds.join("、")}）。建议确认是否属于相关工程方向。`,
  };
}

// ─── Prerequisite Module Evaluation ────────────────────────────────────

function matchPrerequisiteModules(
  applicantModules: ApplicantModuleInput[],
  prerequisiteModules: PrerequisiteModule[],
  logic: "ALL" | "ANY" | null
): ModuleMatchResult[] {
  const results: ModuleMatchResult[] = [];

  for (const pre of prerequisiteModules) {
    const canonical = pre.canonical_module_name;
    const display = pre.display_text;

    // Find matching applicant modules
    const matchedApplicantModules = applicantModules
      .filter((am) => {
        if (am.canonical_module_name === canonical) return true;
        if (am.module_name_raw.toLowerCase().includes(canonical.replace(/_/g, " "))) return true;
        if (normaliseModule(am.module_name_raw) === canonical) return true;
        // Fuzzy match: check if canonical keywords appear in module name
        const canonParts = canonical.split("_");
        return canonParts.some((part) => am.module_name_raw.toLowerCase().includes(part));
      })
      .map((am) => am.module_name_raw);

    results.push({
      canonical_name: canonical,
      display_text: display,
      required: pre.required,
      matched: matchedApplicantModules.length > 0,
      matched_applicant_modules: matchedApplicantModules,
      detail: matchedApplicantModules.length > 0
        ? `匹配到：${matchedApplicantModules.join("、")}`
        : pre.required
          ? `缺少必修课程「${display}」（${canonical}）`
          : `未提供优先课程「${display}」（${canonical}）`,
    });
  }

  return results;
}

// ─── Language Evaluation ─────────────────────────────────────────────

function evaluateLanguage(
  applicant: Pick<Applicant, "ielts_overall" | "ielts_listening" | "ielts_reading" | "ielts_writing" | "ielts_speaking" | "toefl_total" | "toefl_reading" | "toefl_listening" | "toefl_writing" | "toefl_speaking" | "pte_total" | "duolingo_total">,
  req: ProgrammeLanguageRequirement | null
): LanguageResult {
  if (!req || (Number(req.ielts_overall ?? 0) === 0 && !req.toefl_total && !req.pte_total && !req.duolingo_total)) {
    return { status: "pass", detail: "该专业无英语成绩要求，或要求已由其他方式满足。" };
  }

  // Prefer IELTS if available
  if (applicant.ielts_overall !== null && Number(applicant.ielts_overall) > 0) {
    const appIelts = Number(applicant.ielts_overall);
    const reqIelts = Number(req.ielts_overall ?? 0);
    if (reqIelts === 0) {
      return { status: "pass", detail: "该专业无明确雅思要求。" };
    }

    const gap = reqIelts - appIelts;
    if (gap <= 0) {
      const subScoreIssues = checkSubScores(applicant, req);
      if (subScoreIssues) {
        return { status: "close", detail: `雅思总分满足要求（${appIelts}），但单项不达标：${subScoreIssues}` };
      }
      return { status: "pass", detail: `雅思总分 ${appIelts} 满足要求（最低 ${reqIelts}）。${checkSubScores(applicant, req) ?? ""}` };
    }
    if (gap <= 0.5) {
      return { status: "close", detail: `雅思总分 ${appIelts} 略低于要求（最低 ${reqIelts}），差 ${gap.toFixed(1)} 分，属于边缘情况。` };
    }
    return { status: "fail", detail: `雅思总分 ${appIelts} 未达到要求（最低 ${reqIelts}），差 ${gap.toFixed(1)} 分。建议提升英语成绩后再申请。` };
  }

  // Fallback to TOEFL
  if (applicant.toefl_total !== null && applicant.toefl_total > 0) {
    const appToefl = applicant.toefl_total;
    const reqToefl = req.toefl_total ?? 0;
    if (reqToefl === 0) {
      return { status: "pass", detail: "该专业无明确托福要求。" };
    }
    const gap = reqToefl - appToefl;
    if (gap <= 0) return { status: "pass", detail: `托福总分 ${appToefl} 满足要求（最低 ${reqToefl}）。` };
    if (gap <= 5) return { status: "close", detail: `托福总分 ${appToefl} 略低于要求（最低 ${reqToefl}），差 ${gap} 分。` };
    return { status: "fail", detail: `托福总分 ${appToefl} 未达到要求（最低 ${reqToefl}），差 ${gap} 分。` };
  }

  // PTE / Duolingo
  if (applicant.pte_total !== null && applicant.pte_total > 0 && req.pte_total) {
    const gap = req.pte_total - applicant.pte_total;
    if (gap <= 0) return { status: "pass", detail: `PTE总分 ${applicant.pte_total} 满足要求（最低 ${req.pte_total}）。` };
    return { status: "fail", detail: `PTE总分 ${applicant.pte_total} 未达到要求（最低 ${req.pte_total}）。` };
  }

  if (applicant.duolingo_total !== null && applicant.duolingo_total > 0 && req.duolingo_total) {
    const gap = req.duolingo_total - applicant.duolingo_total;
    if (gap <= 0) return { status: "pass", detail: `Duolingo总分 ${applicant.duolingo_total} 满足要求（最低 ${req.duolingo_total}）。` };
    return { status: "fail", detail: `Duolingo总分 ${applicant.duolingo_total} 未达到要求（最低 ${req.duolingo_total}）。` };
  }

  return {
    status: "not_provided",
    detail: `你尚未提交英语成绩。该专业要求：${buildLanguageRequirementText(req)}。`,
  };
}

function checkSubScores(
  applicant: Pick<Applicant, "ielts_listening" | "ielts_reading" | "ielts_writing" | "ielts_speaking">,
  req: ProgrammeLanguageRequirement
): string | null {
  const lrwMin = Number(req.ielts_lrw_min ?? 0);
  if (lrwMin === 0) return null;

  const subScores = [
    { name: "听力", value: applicant.ielts_listening, min: lrwMin },
    { name: "阅读", value: applicant.ielts_reading, min: lrwMin },
    { name: "写作", value: applicant.ielts_writing, min: lrwMin },
    { name: "口语", value: applicant.ielts_speaking, min: lrwMin },
  ];

  const failing = subScores.filter((s) => s.value !== null && Number(s.value) < s.min);
  if (failing.length > 0) {
    return failing.map((s) => `${s.name} ${s.value}<${s.min}`).join("、");
  }
  return null;
}

function buildLanguageRequirementText(req: ProgrammeLanguageRequirement): string {
  const parts: string[] = [];
  if (req.ielts_overall) parts.push(`雅思 ${req.ielts_overall}`);
  if (req.toefl_total) parts.push(`托福 ${req.toefl_total}`);
  if (req.pte_total) parts.push(`PTE ${req.pte_total}`);
  if (req.duolingo_total) parts.push(`Duolingo ${req.duolingo_total}`);
  return parts.join(" 或 ") || "未明确规定";
}

// ─── Compliance Evaluation ───────────────────────────────────────────

function evaluateCompliance(
  programme: Pick<Programme, "programme_name" | "department">,
  compliance: { atas_possible: boolean; atas_rule_text: string | null; graduate_route_note: string | null; visa_deadline_note: string | null } | null,
  visaDeadline: Date | null,
  nonVisaDeadline: Date | null
): ComplianceResult {
  const flags: string[] = [];
  const details: string[] = [];
  const now = new Date();

  if (compliance?.atas_possible) {
    flags.push("atas_possible");
    details.push(`该项目可能涉及 ATAS 认证（${compliance.atas_rule_text ?? "需持 offer 后确认 CAH3 code"}）。`);
  }

  if (visaDeadline && visaDeadline < now) {
    flags.push("visa_deadline_passed");
    details.push(`签证申请截止日期已过（${visaDeadline.toLocaleDateString("zh-CN")}）。`);
  }

  if (nonVisaDeadline && nonVisaDeadline < now) {
    flags.push("non_visa_deadline_passed");
    details.push(`非签证申请截止日期已过（${nonVisaDeadline.toLocaleDateString("zh-CN")}）。`);
  }

  if (compliance?.graduate_route_note) {
    details.push(`Graduate Route 说明：${compliance.graduate_route_note}`);
  }

  return {
    flags,
    detail: details.join("；") || "无特殊合规风险。",
  };
}

// ─── Band & Score Computation ───────────────────────────────────────

function computeBand(missingItems: string[], gradeStatus: string, languageStatus: string): "eligible" | "borderline" | "not_eligible" {
  // Hard fail: degree level not met, or grade clearly not met
  if (gradeStatus === "fail") return "not_eligible";

  const failCount = missingItems.filter((m) =>
    m.startsWith("degree_level") || m.startsWith("overall_grade") || m.startsWith("language_fail")
  ).length;

  if (failCount >= 2) return "not_eligible";

  const totalIssues = missingItems.length;

  if (totalIssues <= 1) return "eligible";
  if (totalIssues <= 3) return "borderline";
  return "not_eligible";
}

function computeScores(
  result: EvaluationResult,
  weights: EvaluationWeights = DEFAULT_WEIGHTS
): EvaluationResult {
  // academic_score: degree level + grade + background
  let academic = 0;
  if (result.explanation.degree_level.status !== "fail")
    academic += weights.academic.degreeLevel;
  if (result.explanation.overall_grade.status === "pass")
    academic += weights.academic.overallGrade;
  if (result.explanation.overall_grade.status === "close")
    academic += Math.round(weights.academic.overallGrade * 0.6);
  if (result.explanation.background.status !== "fail")
    academic += weights.academic.backgroundMatch;
  result.academic_score = academic;

  // module_match_score
  const preModules = result.explanation.prerequisite_modules.filter(
    (m) => m.required
  );
  const matchedRequired = preModules.filter((m) => m.matched).length;
  const totalRequired = preModules.length;
  const moduleScore =
    totalRequired === 0
      ? weights.module.allMet
      : matchedRequired === totalRequired
      ? weights.module.allMet
      : matchedRequired > 0
      ? weights.module.partial
      : weights.module.noneMet;
  result.module_match_score = moduleScore;

  // language_score
  switch (result.explanation.language.status) {
    case "pass":
      result.language_score = weights.language.pass;
      break;
    case "close":
      result.language_score = weights.language.close;
      break;
    case "fail":
      result.language_score = weights.language.fail;
      break;
    case "not_provided":
      result.language_score = weights.language.notProvided;
      break;
  }

  return result;
}

// ─── Main Evaluation Function ───────────────────────────────────────

export async function evaluateApplicantForProgramme(
  applicantId: string,
  programmeId: string
): Promise<EvaluationResult> {
  const applicant = await prisma.applicant.findUnique({
    where: { id: applicantId },
    include: { modules: true },
  });
  if (!applicant) throw new Error(`Applicant ${applicantId} not found`);

  const programme = await prisma.programme.findUnique({
    where: { id: programmeId },
    include: {
      academic_requirements: true,
      language_requirements: true,
      documents: true,
      compliance: true,
      prerequisite_modules: true,
    },
  });
  if (!programme) throw new Error(`Programme ${programmeId} not found`);

  const ar = programme.academic_requirements;
  const lr = programme.language_requirements;
  const compliance = programme.compliance;
  const prereqs = programme.prerequisite_modules;

  // 1. Degree level
  const degreeStatus = "pass"; // all programmes target bachelor's (we assume applicant is graduating)
  const degreeDetail = "本项目要求本科及以上学历，你在读本科，满足学历层级要求。";

  // 2. Overall grade
  const gradeEval = evaluateOverallGrade(applicant, ar?.min_uk_classification ?? null);

  // 3. Background
  const bgEval = evaluateBackground(
    applicant.undergrad_major,
    ar?.accepted_backgrounds ?? []
  );

  // 4. Prerequisite modules
  const applicantModulesForEngine: ApplicantModuleInput[] = applicant.modules.map((m) => ({
    module_name_raw: m.module_name_raw,
    canonical_module_name: m.canonical_module_name,
    grade_text: m.grade_text,
    grade_numeric: m.grade_numeric !== null ? Number(m.grade_numeric) : undefined,
    credits: m.credits ?? undefined,
  }));
  const moduleResults = matchPrerequisiteModules(
    applicantModulesForEngine,
    prereqs,
    (ar?.prerequisite_module_logic as "ALL" | "ANY" | null) ?? "ALL"
  );

  // 5. Language
  const langResult = evaluateLanguage(applicant, lr);

  // 6. Compliance
  const complianceResult = evaluateCompliance(
    programme,
    compliance,
    programme.application_deadline_visa ?? null,
    programme.application_deadline_non_visa ?? null
  );

  // Build missing items list
  const missingItems: string[] = [];
  if (gradeEval.status === "fail") missingItems.push("overall_grade_not_met");
  if (gradeEval.status === "close") missingItems.push("overall_grade_close");
  if (bgEval.status === "fail") missingItems.push("background_not_aligned");
  if (bgEval.status === "partial") missingItems.push("background_partial");
  moduleResults.forEach((m) => {
    if (m.required && !m.matched) missingItems.push(`missing_module:${m.canonical_name}`);
  });
  if (langResult.status === "fail") missingItems.push("language_fail");
  if (langResult.status === "close") missingItems.push("language_close");
  if (langResult.status === "not_provided") missingItems.push("language_not_provided");
  if (complianceResult.flags.includes("visa_deadline_passed")) missingItems.push("visa_deadline_passed");
  if (complianceResult.flags.includes("non_visa_deadline_passed")) missingItems.push("non_visa_deadline_passed");

  // Build summary in Chinese
  const band = computeBand(missingItems, gradeEval.status, langResult.status);
  const summaryZh = buildSummary(band, missingItems, langResult, moduleResults, complianceResult);

  let evaluationResult: EvaluationResult = {
    applicantId,
    programmeId,
    eligibility_band: band,
    academic_score: 0,
    module_match_score: 0,
    language_score: 0,
    compliance_flags: complianceResult.flags,
    missing_items: missingItems,
    explanation: {
      degree_level: { status: degreeStatus, detail: degreeDetail },
      overall_grade: { status: gradeEval.status, detail: gradeEval.detail, gap: gradeEval.gap },
      background: { status: bgEval.status, detail: bgEval.detail, matched: bgEval.matched },
      prerequisite_modules: moduleResults,
      language: langResult,
      compliance: complianceResult,
      summary_zh: summaryZh,
    },
  };

  return computeScores(evaluationResult);
}

function buildSummary(
  band: "eligible" | "borderline" | "not_eligible",
  missingItems: string[],
  langResult: LanguageResult,
  moduleResults: ModuleMatchResult[],
  complianceResult: ComplianceResult
): string {
  const lines: string[] = [];

  if (band === "eligible") {
    lines.push("✓ 满足该项目的硬性申请条件，可以提交申请。");
  } else if (band === "borderline") {
    lines.push("～ 该项目存在一至两项不足，建议在提交申请前确认以下内容。");
  } else {
    lines.push("✗ 该项目存在明确硬伤，建议优先申请其他更匹配的项目。");
  }

  const langIssue = missingItems.find((m) => m.startsWith("language"));
  if (langIssue) lines.push(`• 英语成绩未达标或未提交。${langResult.detail}`);

  const missingMods = moduleResults.filter((m) => m.required && !m.matched);
  if (missingMods.length > 0) {
    lines.push(`• 缺少必修先修课程：${missingMods.map((m) => `「${m.display_text}」`).join("、")}。`);
  }

  if (complianceResult.flags.includes("atas_possible")) {
    lines.push("• 该项目可能涉及 ATAS 认证，需在收到 offer 后确认 CAH3 code。");
  }

  if (complianceResult.flags.includes("visa_deadline_passed")) {
    lines.push("• 签证申请截止日期已过，请确认是否仍接受申请。");
  }

  return lines.join("\n");
}

// ─── Persist Evaluation ───────────────────────────────────────────────

export async function saveEvaluation(result: EvaluationResult): Promise<void> {
  await prisma.evaluation.upsert({
    where: {
      applicant_id_programme_id: {
        applicant_id: result.applicantId,
        programme_id: result.programmeId,
      },
    },
    create: {
      applicant_id: result.applicantId,
      programme_id: result.programmeId,
      academic_score: result.academic_score,
      module_match_score: result.module_match_score,
      language_score: result.language_score,
      eligibility_band: result.eligibility_band,
      compliance_flags: result.compliance_flags,
      missing_items: result.missing_items,
      explanation: result.explanation as object,
    },
    update: {
      academic_score: result.academic_score,
      module_match_score: result.module_match_score,
      language_score: result.language_score,
      eligibility_band: result.eligibility_band,
      compliance_flags: result.compliance_flags,
      missing_items: result.missing_items,
      explanation: result.explanation as object,
    },
  });
}

// ─── Evaluate all programmes ─────────────────────────────────────────

export async function evaluateApplicantAllProgrammes(
  applicantId: string
): Promise<EvaluationResult[]> {
  const programmes = await prisma.programme.findMany({
    where: { is_active: true },
    select: { id: true },
  });

  // Parallel evaluation for better performance
  const results = await Promise.all(
    programmes.map(async (prog) => {
      const result = await evaluateApplicantForProgramme(applicantId, prog.id);
      await saveEvaluation(result);
      return result;
    })
  );

  return results;
}
