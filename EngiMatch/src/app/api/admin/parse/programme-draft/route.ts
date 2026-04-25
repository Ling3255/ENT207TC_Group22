import { NextRequest } from "next/server";
import { extractTextContent } from "@/lib/crawler/html-cleaner";
import {
  extractDates,
  extractEnglishLevel,
  extractFee,
  parseProgrammePage,
} from "@/lib/crawler/rule-parser";
import {
  apiHandler,
  parseJsonBody,
  requireRole,
  successResponse,
} from "@/lib/api-utils";

export const POST = apiHandler(async (request: NextRequest) => {
  await requireRole(request, ["SUPER_ADMIN", "STAFF"]);

  const body = await parseJsonBody<Record<string, unknown>>(request);
  const rawText = String(body.rawText ?? "");
  const sourcePageTitle = String(body.sourcePageTitle ?? "");
  const treatAsHtml = body.treatAsHtml !== false;

  const cleanedText = treatAsHtml ? extractTextContent(rawText) : rawText;
  const parsed = parseProgrammePage(cleanedText);
  const fee = extractFee(cleanedText);
  const dates = extractDates(cleanedText);
  const englishLevel = extractEnglishLevel(cleanedText);

  return successResponse({
    sourcePageTitle,
    cleanedText,
    parsed,
    draft: {
      source_page_title: sourcePageTitle || null,
      parser_version: "v0.2-draft",
      confidence_score: parsed.confidence_score,
      tuition_fee_overseas_gbp: fee.overseas ?? null,
      application_deadline_visa: dates.visa?.toISOString() ?? null,
      application_deadline_non_visa: dates.nonVisa?.toISOString() ?? null,
      academic_requirements: {
        min_degree_level: "bachelor",
        min_uk_classification: parsed.min_uk_classification,
        accepted_backgrounds: parsed.accepted_backgrounds,
        disallowed_backgrounds: [],
        prerequisite_module_logic: "ALL",
        work_experience_considered: false,
        interview_possible: false,
        cv_required: false,
        portfolio_required: false,
      },
      language_requirements: {
        english_requirement_level: englishLevel,
        ielts_overall: parsed.ielts_overall,
        ielts_lrw_min: parsed.ielts_lrw_min,
        toefl_total: parsed.toefl_total,
        pte_total: null,
        duolingo_total: null,
        validity_window_months: 24,
      },
      documents: {
        transcript_required: parsed.transcript_required,
        personal_statement_required: parsed.personal_statement_required,
        references_required_count: parsed.references_required_count,
        reference_type_academic_min: null,
        cv_resume_required: parsed.cv_resume_required,
        additional_documents: [],
      },
      compliance: {
        atas_possible: parsed.atas_possible,
        atas_rule_text: parsed.atas_rule_text,
        graduate_route_note: null,
        visa_deadline_note: null,
      },
      prerequisite_modules: parsed.prerequisite_modules.map((module) => ({
        canonical_module_name: module.canonical,
        display_text: module.display,
        min_grade_rule: null,
        required: module.required,
      })),
    },
  });
});
