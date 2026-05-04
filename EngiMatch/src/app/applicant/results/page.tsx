"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";

interface EvaluationExplanation {
  degree_level: { status: string; detail: string };
  overall_grade: { status: string; detail: string; gap?: number };
  background: { status: string; detail: string };
  prerequisite_modules: Array<{
    canonical_name: string;
    display_text: string;
    required: boolean;
    matched: boolean;
    matched_applicant_modules: string[];
    detail: string;
  }>;
  language: { status: string; detail: string; gap?: number };
  compliance: { flags: string[]; detail: string };
  summary_zh: string;
}

interface Evaluation {
  id: string;
  eligibility_band: string;
  academic_score: number | null;
  module_match_score: number | null;
  language_score: number | null;
  compliance_flags: string[];
  missing_items: string[];
  explanation: EvaluationExplanation;
  created_at: string;
  programme: {
    id: string;
    programme_name: string;
    degree_type: string;
    duration_text: string | null;
    intake_term: string | null;
    official_url: string;
    application_deadline_visa: string | null;
    application_deadline_non_visa: string | null;
    university: { name: string; rank: number | null };
    academic_requirements: { min_uk_classification: string | null } | null;
    language_requirements: { ielts_overall: string | null; toefl_total: number | null } | null;
  };
}

const BAND_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  eligible:     { label: "符合条件",    color: "green",  icon: "✓" },
  borderline:   { label: "条件边缘",    color: "amber",  icon: "~" },
  not_eligible: { label: "暂不符合",    color: "red",    icon: "✗" },
};

function ScoreBar({ score, label }: { score: number | null; label: string }) {
  const val = score ?? 0;
  const color = val >= 70 ? "bg-green-500" : val >= 40 ? "bg-amber-500" : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-500 w-16">{label}</span>
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${val}%` }} />
      </div>
      <span className="text-xs font-medium text-slate-700 w-8">{val}</span>
    </div>
  );
}

function RiskTag({ flag, locale }: { flag: string; locale: string }) {
  const configs: Record<string, { label: string; color: string }> = {
    atas_possible:            { label: locale === "en" ? "ATAS" : "ATAS", color: "bg-orange-100 text-orange-700 border-orange-200" },
    visa_deadline_passed:     { label: locale === "en" ? "Visa Deadline Passed" : "签证截止已过", color: "bg-red-100 text-red-700 border-red-200" },
    non_visa_deadline_passed:  { label: locale === "en" ? "App Deadline Passed" : "申请截止已过", color: "bg-red-100 text-red-700 border-red-200" },
  };
  const cfg = configs[flag];
  if (!cfg) return null;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function ResultsContent() {
  const { t, locale } = useLocale();
  const isZh = locale === "zh";
  const params = useSearchParams();
  const applicantId = params.get("applicantId");
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [applicant, setApplicant] = useState<{
    full_name: string; undergrad_university: string;
    undergrad_major: string; gpa_numeric: number; gpa_scale: number;
  } | null>(null);
  const [rerunning, setRerunning] = useState(false);
  const [filter, setFilter] = useState<"ALL" | "eligible" | "borderline" | "not_eligible">("ALL");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [aiSuggestOpen, setAiSuggestOpen] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (!applicantId) return;
    loadData();
  }, [applicantId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [evalRes, appRes] = await Promise.all([
        fetch(`/api/eligibility/${applicantId}/results`),
        fetch(`/api/applicants/${applicantId}`),
      ]);
      if (evalRes.ok) {
        const evalData = await evalRes.json();
        const evalArray = evalData.data || evalData;
        setEvaluations(Array.isArray(evalArray) ? evalArray : []);
      }
      if (appRes.ok) {
        const appData = await appRes.json();
        setApplicant(appData.data || appData);
      }
    } finally {
      setLoading(false);
    }
  };

  const rerunEvaluation = async () => {
    if (!applicantId) return;
    setRerunning(true);
    try {
      const res = await fetch("/api/eligibility/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicantId }),
      });
      if (!res.ok) {
        const data = await res.json();
        console.warn("重新评估失败:", data.error);
      }
      await loadData();
    } finally {
      setRerunning(false);
    }
  };

  const fetchAiSuggestion = async () => {
    if (!applicantId) return;
    setAiLoading(true);
    setAiSuggestion("");
    try {
      const res = await fetch("/api/ai-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicantId }),
      });
      const data = await res.json();
      if (data.data?.suggestion) {
        setAiSuggestion(data.data.suggestion);
      } else {
        setAiSuggestion(isZh ? "AI 未能生成建议，请稍后重试。" : "AI could not generate a suggestion. Please try again later.");
      }
    } catch {
      setAiSuggestion(isZh ? "请求失败，请检查网络后重试。" : "Request failed. Please check your network and try again.");
    } finally {
      setAiLoading(false);
    }
  };

  const filtered = evaluations.filter((e) => filter === "ALL" || e.eligibility_band === filter);
  const stats = {
    total: evaluations.length,
    eligible: evaluations.filter((e) => e.eligibility_band === "eligible").length,
    borderline: evaluations.filter((e) => e.eligibility_band === "borderline").length,
    notEligible: evaluations.filter((e) => e.eligibility_band === "not_eligible").length,
  };

  const bandLabels = {
    eligible: locale === "en" ? "Eligible" : "符合条件",
    borderline: locale === "en" ? "Borderline" : "条件边缘",
    not_eligible: locale === "en" ? "Not Eligible" : "暂不符合",
  };

  if (!applicantId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">{t("results.no_applicant")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-[#8c6a3d] text-white py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/home" className="text-sm text-[#f2e3c7] hover:text-white mb-4 inline-block">← {t("nav.back")}</Link>
          <h1 className="text-3xl font-bold">{t("results.title")}</h1>
          {applicant && (
            <p className="text-[#f2e3c7] mt-1">
              {applicant.full_name} · {applicant.undergrad_university} · {applicant.undergrad_major} · GPA {Number(applicant.gpa_numeric).toFixed(2)}/{Number(applicant.gpa_scale)}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {!loading && evaluations.length > 0 && (
          <>
            <div className="grid grid-cols-4 gap-3 mb-6">
              <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                <div className="text-2xl font-bold text-slate-700">{stats.total}</div>
                <div className="text-xs text-slate-500">{t("results.total")}</div>
              </div>
              <div className="bg-[#f8f1e6] rounded-xl border border-[#e5d4bd] p-4 text-center">
                <div className="text-2xl font-bold text-indigo-700">{stats.eligible}</div>
                <div className="text-xs text-indigo-700">{t("results.eligible")}</div>
              </div>
              <div className="bg-[#f6eee3] rounded-xl border border-[#dcc6a8] p-4 text-center">
                <div className="text-2xl font-bold text-[#8b6338]">{stats.borderline}</div>
                <div className="text-xs text-[#8b6338]">{t("results.borderline")}</div>
              </div>
              <div className="bg-stone-100 rounded-xl border border-stone-300 p-4 text-center">
                <div className="text-2xl font-bold text-stone-700">{stats.notEligible}</div>
                <div className="text-xs text-stone-600">{t("results.not_eligible")}</div>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-2">
                {(["ALL", "eligible", "borderline", "not_eligible"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      filter === f ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {f === "ALL" ? t("results.filter.all") : f === "eligible" ? t("results.filter.eligible") : f === "borderline" ? t("results.filter.borderline") : t("results.filter.not_eligible")}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { setAiSuggestOpen(true); fetchAiSuggestion(); }}
                  className="text-sm bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-4 py-1.5 rounded-lg font-medium hover:from-indigo-700 hover:to-violet-700 transition-colors"
                >
                  ✨ {isZh ? "AI 申请建议" : "AI Suggestion"}
                </button>
                <button onClick={rerunEvaluation} disabled={rerunning}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium disabled:opacity-50">
                  {rerunning ? t("results.rerun") : t("results.rerun_btn")}
                </button>
              </div>
            </div>
          </>
        )}

        {loading && <div className="text-center py-16 text-slate-400">{t("results.loading")}</div>}
        {!loading && evaluations.length === 0 && (
          <div className="text-center py-16">
            <p className="text-slate-500 mb-4">{t("results.no_results")}</p>
            <Link href="/applicant" className="text-indigo-600 hover:underline">{t("results.go_create")}</Link>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map((ev) => {
              const prog = ev.programme;
              const isExpanded = expanded === ev.id;
              const bandCfg = BAND_CONFIG[ev.eligibility_band] ?? BAND_CONFIG.not_eligible;
              const bandLabel = bandLabels[ev.eligibility_band as keyof typeof bandLabels] || bandCfg.label;

              return (
                <div key={ev.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div
                    className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50"
                    onClick={() => setExpanded(isExpanded ? null : ev.id)}
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 bg-slate-100 text-slate-700">
                      {prog.university.rank || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 text-sm truncate">{prog.programme_name}</div>
                      <div className="text-xs text-slate-500">{prog.university.name} · {prog.duration_text ?? prog.degree_type} · {prog.degree_type}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        ev.eligibility_band === "eligible" ? "bg-green-100 text-green-700" :
                        ev.eligibility_band === "borderline" ? "bg-amber-100 text-amber-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {bandCfg.icon} {bandLabel}
                      </span>
                      {ev.compliance_flags.map((f) => <RiskTag key={f} flag={f} locale={locale} />)}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-slate-100 p-4 bg-slate-50">
                      {/* Three score bars */}
                      <div className="space-y-1 mb-4">
                        <ScoreBar score={ev.academic_score} label={locale === "en" ? "Academic" : "学术"} />
                        <ScoreBar score={ev.module_match_score} label={locale === "en" ? "Module Match" : "模块匹配"} />
                        <ScoreBar score={ev.language_score} label={locale === "en" ? "Language" : "语言"} />
                      </div>

                      {/* Detail sections */}
                      <div className="space-y-2 text-sm">
                        {/* GPA */}
                        <div className={`p-3 rounded-lg ${ev.explanation.overall_grade.status === "pass" ? "bg-green-50 border border-green-200" : ev.explanation.overall_grade.status === "close" ? "bg-amber-50 border border-amber-200" : "bg-red-50 border border-red-200"}`}>
                          <div className="text-xs font-semibold text-slate-500 mb-1">{t("results.gpa_title")}</div>
                          <div className="text-slate-700 leading-relaxed whitespace-pre-line">{ev.explanation.overall_grade.detail}</div>
                        </div>

                        {/* Language */}
                        <div className={`p-3 rounded-lg ${ev.explanation.language.status === "pass" ? "bg-green-50 border border-green-200" : ev.explanation.language.status === "close" ? "bg-amber-50 border border-amber-200" : ev.explanation.language.status === "not_provided" ? "bg-slate-50 border border-slate-200" : "bg-red-50 border border-red-200"}`}>
                          <div className="text-xs font-semibold text-slate-500 mb-1">{t("results.language_title")}</div>
                          <div className="text-slate-700 leading-relaxed whitespace-pre-line">{ev.explanation.language.detail}</div>
                        </div>

                        {/* Prerequisite modules */}
                        {ev.explanation.prerequisite_modules.length > 0 && (
                          <div className="p-3 rounded-lg bg-white border border-slate-200">
                            <div className="text-xs font-semibold text-slate-500 mb-2">{t("results.prerequisite_title")}</div>
                            <div className="space-y-1">
                              {ev.explanation.prerequisite_modules.map((m, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm">
                                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                                    m.matched ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                  }`}>{m.matched ? "✓" : "✗"}</span>
                                  <span className="text-slate-700">{m.display_text}</span>
                                  {m.matched_applicant_modules.length > 0 && (
                                    <span className="text-slate-400 text-xs">{locale === "en" ? "← Matched: " : "← 匹配 "}{m.matched_applicant_modules.join(", ")}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Compliance */}
                        {ev.explanation.compliance.detail && ev.explanation.compliance.detail !== (locale === "en" ? "No special compliance risks." : "无特殊合规风险。") && (
                          <div className="p-3 rounded-lg bg-orange-50 border border-orange-200">
                            <div className="text-xs font-semibold text-orange-500 mb-1">{t("results.compliance_title")}</div>
                            <div className="text-sm text-orange-700">{ev.explanation.compliance.detail}</div>
                          </div>
                        )}

                        {/* Summary */}
                        <div className="p-3 rounded-lg bg-[#f8f1e6] border border-[#e5d4bd]">
                          <div className="text-xs font-semibold text-indigo-700 mb-1">{t("results.summary_title")}</div>
                          <div className="text-sm text-stone-800 whitespace-pre-line leading-relaxed">{ev.explanation.summary_zh}</div>
                        </div>

                        {/* Official link */}
                        {prog.official_url && (
                          <div className="text-center">
                            <a href={prog.official_url} target="_blank" rel="noopener noreferrer"
                              className="text-xs text-indigo-600 hover:underline">
                              {t("results.view_official")}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* AI Suggestion Modal */}
        {aiSuggestOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={() => setAiSuggestOpen(false)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-800">
                  ✨ {isZh ? "AI 智能申请建议" : "AI Smart Application Suggestions"}
                </h3>
                <button onClick={() => setAiSuggestOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
              </div>
              <div className="p-6 overflow-y-auto">
                {aiLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                    <p className="text-slate-500 text-sm">{isZh ? "AI 正在分析您的申请档案和评估结果，请稍候..." : "AI is analyzing your profile and evaluation results..."}</p>
                  </div>
                ) : (
                  <div className="prose prose-slate max-w-none">
                    <div className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                      {aiSuggestion}
                    </div>
                  </div>
                )}
              </div>
              <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setAiSuggestOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
                >
                  {isZh ? "关闭" : "Close"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-400">{/* Loading */}</div>}>
      <ResultsContent />
    </Suspense>
  );
}
