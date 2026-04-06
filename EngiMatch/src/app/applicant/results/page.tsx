"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";

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

const BAND_CONFIG = {
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

function RiskTag({ flag }: { flag: string }) {
  const configs: Record<string, { label: string; color: string }> = {
    atas_possible:            { label: "ATAS", color: "bg-orange-100 text-orange-700 border-orange-200" },
    visa_deadline_passed:     { label: "签证截止已过", color: "bg-red-100 text-red-700 border-red-200" },
    non_visa_deadline_passed:  { label: "申请截止已过", color: "bg-red-100 text-red-700 border-red-200" },
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
        setEvaluations(Array.isArray(evalData) ? evalData : []);
      }
      if (appRes.ok) setApplicant(await appRes.json());
    } finally {
      setLoading(false);
    }
  };

  const rerunEvaluation = async () => {
    if (!applicantId) return;
    setRerunning(true);
    await fetch("/api/eligibility/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicantId }),
    });
    await loadData();
    setRerunning(false);
  };

  const filtered = evaluations.filter((e) => filter === "ALL" || e.eligibility_band === filter);
  const stats = {
    total: evaluations.length,
    eligible: evaluations.filter((e) => e.eligibility_band === "eligible").length,
    borderline: evaluations.filter((e) => e.eligibility_band === "borderline").length,
    notEligible: evaluations.filter((e) => e.eligibility_band === "not_eligible").length,
  };

  if (!applicantId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">缺少申请者信息，请从申请入口重新进入。</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-indigo-600 text-white py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/" className="text-sm text-indigo-200 hover:text-white mb-4 inline-block">← 返回首页</Link>
          <h1 className="text-3xl font-bold">评估结果</h1>
          {applicant && (
            <p className="text-indigo-200 mt-1">
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
                <div className="text-xs text-slate-500">全部项目</div>
              </div>
              <div className="bg-green-50 rounded-xl border border-green-200 p-4 text-center">
                <div className="text-2xl font-bold text-green-700">{stats.eligible}</div>
                <div className="text-xs text-green-600">符合条件</div>
              </div>
              <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 text-center">
                <div className="text-2xl font-bold text-amber-700">{stats.borderline}</div>
                <div className="text-xs text-amber-600">条件边缘</div>
              </div>
              <div className="bg-red-50 rounded-xl border border-red-200 p-4 text-center">
                <div className="text-2xl font-bold text-red-700">{stats.notEligible}</div>
                <div className="text-xs text-red-600">暂不符合</div>
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
                    {f === "ALL" ? "全部" : f === "eligible" ? "符合条件" : f === "borderline" ? "边缘" : "不符"}
                  </button>
                ))}
              </div>
              <button onClick={rerunEvaluation} disabled={rerunning}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium disabled:opacity-50">
                {rerunning ? "重新评估中..." : "♻ 重新评估"}
              </button>
            </div>
          </>
        )}

        {loading && <div className="text-center py-16 text-slate-400">加载评估结果中...</div>}
        {!loading && evaluations.length === 0 && (
          <div className="text-center py-16">
            <p className="text-slate-500 mb-4">暂无评估结果</p>
            <Link href="/applicant" className="text-indigo-600 hover:underline">去创建申请档案 →</Link>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map((ev) => {
              const prog = ev.programme;
              const isExpanded = expanded === ev.id;
              const bandCfg = BAND_CONFIG[ev.eligibility_band as keyof typeof BAND_CONFIG] ?? BAND_CONFIG.not_eligible;

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
                        {bandCfg.icon} {bandCfg.label}
                      </span>
                      {ev.compliance_flags.map((f) => <RiskTag key={f} flag={f} />)}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-slate-100 p-4 bg-slate-50">
                      {/* Three score bars */}
                      <div className="space-y-1 mb-4">
                        <ScoreBar score={ev.academic_score} label="学术" />
                        <ScoreBar score={ev.module_match_score} label="模块匹配" />
                        <ScoreBar score={ev.language_score} label="语言" />
                      </div>

                      {/* Detail sections */}
                      <div className="space-y-2 text-sm">
                        {/* GPA */}
                        <div className={`p-3 rounded-lg ${ev.explanation.overall_grade.status === "pass" ? "bg-green-50 border border-green-200" : ev.explanation.overall_grade.status === "close" ? "bg-amber-50 border border-amber-200" : "bg-red-50 border border-red-200"}`}>
                          <div className="text-xs font-semibold text-slate-500 mb-1">GPA / 学位等级</div>
                          <div className="text-slate-700 leading-relaxed whitespace-pre-line">{ev.explanation.overall_grade.detail}</div>
                        </div>

                        {/* Language */}
                        <div className={`p-3 rounded-lg ${ev.explanation.language.status === "pass" ? "bg-green-50 border border-green-200" : ev.explanation.language.status === "close" ? "bg-amber-50 border border-amber-200" : ev.explanation.language.status === "not_provided" ? "bg-slate-50 border border-slate-200" : "bg-red-50 border border-red-200"}`}>
                          <div className="text-xs font-semibold text-slate-500 mb-1">英语成绩</div>
                          <div className="text-slate-700 leading-relaxed whitespace-pre-line">{ev.explanation.language.detail}</div>
                        </div>

                        {/* Prerequisite modules */}
                        {ev.explanation.prerequisite_modules.length > 0 && (
                          <div className="p-3 rounded-lg bg-white border border-slate-200">
                            <div className="text-xs font-semibold text-slate-500 mb-2">先修课程匹配</div>
                            <div className="space-y-1">
                              {ev.explanation.prerequisite_modules.map((m, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm">
                                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                                    m.matched ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                  }`}>{m.matched ? "✓" : "✗"}</span>
                                  <span className="text-slate-700">{m.display_text}</span>
                                  {m.matched_applicant_modules.length > 0 && (
                                    <span className="text-slate-400 text-xs">← 匹配 {m.matched_applicant_modules.join(", ")}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Compliance */}
                        {ev.explanation.compliance.detail && ev.explanation.compliance.detail !== "无特殊合规风险。" && (
                          <div className="p-3 rounded-lg bg-orange-50 border border-orange-200">
                            <div className="text-xs font-semibold text-orange-500 mb-1">合规 / 签证提示</div>
                            <div className="text-sm text-orange-700">{ev.explanation.compliance.detail}</div>
                          </div>
                        )}

                        {/* Summary */}
                        <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-200">
                          <div className="text-xs font-semibold text-indigo-500 mb-1">综合评估</div>
                          <div className="text-sm text-indigo-800 whitespace-pre-line leading-relaxed">{ev.explanation.summary_zh}</div>
                        </div>

                        {/* Official link */}
                        {prog.official_url && (
                          <div className="text-center">
                            <a href={prog.official_url} target="_blank" rel="noopener noreferrer"
                              className="text-xs text-indigo-600 hover:underline">
                              查看官方项目页面 →
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
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-400">加载中...</div>}>
      <ResultsContent />
    </Suspense>
  );
}