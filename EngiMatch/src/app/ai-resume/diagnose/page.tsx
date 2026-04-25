"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";
import { runDiagnostics, DIMENSION_META, getDimensionMeta } from "@/lib/resume-diagnostics";
import type { DiagnosticIssue } from "@/lib/resume-diagnostics";
import type { ResumeSection } from "@/lib/resume-parser";

const STEPS = [
  { id: "usecase", labelKey: "ai.step.usecase" },
  { id: "upload", labelKey: "ai.step.upload" },
  { id: "review", labelKey: "ai.step.review" },
  { id: "diagnose", labelKey: "ai.step.diagnose" },
  { id: "optimize", labelKey: "ai.step.optimize" },
  { id: "final", labelKey: "ai.step.final" },
];

export default function AIRResumeDiagnosePage() {
  const { t, locale } = useLocale();
  const router = useRouter();
  const params = useSearchParams();
  const major = params.get("major") || "";
  const stage = params.get("stage") || "";

  const [issues, setIssues] = useState<DiagnosticIssue[]>([]);
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);

  interface AIAnalysis {
    issues: {
      dimension: string;
      severity: string;
      title: string;
      description: string;
      suggestion: string;
      sectionIndex?: number;
    }[];
    overall_score: number;
    summary: string;
    missing: string[];
  }

  function parseAIAnalysis(raw: string): AIAnalysis | null {
    try {
      const json = raw.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  function ScoreBadge({ score }: { score: number }) {
    const color = score >= 80 ? "bg-green-100 text-green-700" : score >= 60 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700";
    const label = locale === "en"
      ? (score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Fair" : "Needs Improvement")
      : (score >= 80 ? "优秀" : score >= 60 ? "良好" : score >= 40 ? "一般" : "需改进");
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${color}`}>
        <span>📊</span>
        <span>{locale === "en" ? `Overall Score ${score}/100` : `综合评分 ${score}/100`}</span>
        <span className="opacity-70">({label})</span>
      </div>
    );
  }

  function SeverityIcon({ severity }: { severity: string }) {
    const icons: Record<string, string> = { high: "🔴", medium: "🟡", low: "🔵" };
    return <span>{icons[severity] || "⚪"}</span>;
  }

  function MissingList({ items }: { items: string[] }) {
    if (!items?.length) return null;
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-4">
        <div className="text-xs font-semibold text-amber-600 mb-2">💡 {locale === "en" ? "Recommendations" : "建议补充"}</div>
        <ul className="space-y-1">
          {items.map((item, i) => (
            <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
              <span className="text-amber-400 mt-0.5">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [aiRaw, setAiRaw] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(true);
  const [aiError, setAiError] = useState("");

  useEffect(() => {
    async function analyze() {
      try {
        const storedSections = sessionStorage.getItem("ai_resume_sections");
        if (!storedSections) { router.replace("/ai-resume"); return; }
        const sections: ResumeSection[] = JSON.parse(storedSections);

        const localResult = runDiagnostics(sections, major, locale);
        setIssues(localResult);

        setAiLoading(true);
        const res = await fetch("/api/ai-resume/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sections, major, stage, action: "diagnose", locale }),
        });
        if (res.ok) {
          const data = await res.json();
          const raw = data.analysis || "";
          setAiRaw(raw);
          setAiAnalysis(parseAIAnalysis(raw));
        } else {
          const err = await res.json().catch(() => ({}));
          setAiError(err.error || (locale === "en" ? "AI diagnostics temporarily unavailable" : "AI 诊断暂时不可用"));
        }
      } catch {
        setAiError(locale === "en" ? "AI diagnostics temporarily unavailable" : "AI 诊断暂时不可用");
      } finally {
        setAiLoading(false);
      }
    }
    analyze();
  }, [major, stage, router, locale]);

  if (issues.length === 0 && !aiAnalysis && !aiError) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">
        {t("common.loading")}
      </div>
    );
  }

  const highCount = issues.filter(i => i.severity === "high").length;
  const medCount = issues.filter(i => i.severity === "medium").length;
  const lowCount = issues.filter(i => i.severity === "low").length;

  const severityLabels = {
    high: locale === "en" ? "High Priority" : "高优先级",
    medium: locale === "en" ? "Medium Priority" : "中优先级",
    low: locale === "en" ? "Low Priority" : "低优先级",
  };

  const statLabels = {
    issues: locale === "en" ? "Issues Found" : "发现问题",
    highPriority: locale === "en" ? "High Priority" : "高优先级",
    medPriority: locale === "en" ? "Medium Priority" : "中等优先级",
    lowPriority: locale === "en" ? "Low Priority" : "低优先级",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/ai-resume/review" className="text-sm text-slate-500 hover:text-slate-800">← {t("nav.backTo")}</Link>
          <div className="text-sm font-medium text-slate-700">{locale === "en" ? "AI Diagnostic Report" : "AI 诊断报告"}</div>
          <div className="w-20" />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-2">
          {STEPS.map((step, i) => {
            const done = ["usecase", "upload", "review"].includes(step.id);
            const active = step.id === "diagnose";
            return (
              <div key={step.id} className="flex items-center gap-1 flex-shrink-0">
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${done ? "bg-green-100 text-green-600" : active ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"}`}>
                  {done ? "✓" : <span className="font-bold">{i + 1}</span>}
                  <span>{t(step.labelKey)}</span>
                </div>
                {i < STEPS.length - 1 && <div className="w-4 h-px bg-slate-200" />}
              </div>
            );
          })}
        </div>

        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🔍</div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">{locale === "en" ? "Diagnosis Complete" : "诊断完成"}</h1>
          <p className="text-slate-500">{locale === "en"
            ? "Analyze your resume from four dimensions: structure, content, application fit, and English writing quality"
            : "从结构、内容、申请适配度、英文表达四个维度分析你的简历"}</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          {[
            { count: issues.length || "—", label: statLabels.issues, color: "text-slate-700" },
            { count: highCount || "—", label: statLabels.highPriority, color: "text-red-600" },
            { count: medCount || "—", label: statLabels.medPriority, color: "text-amber-600" },
            { count: lowCount || "—", label: statLabels.lowPriority, color: "text-blue-600" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.count}</div>
              <div className="text-xs text-slate-400 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Issue list */}
        {issues.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <div className="text-5xl mb-3">✅</div>
            <div className="font-semibold text-slate-700 mb-2">{locale === "en" ? "Resume basic structure is good" : "简历基础结构良好"}</div>
            <div className="text-sm text-slate-400">{locale === "en" ? "No obvious issues detected, recommend proceeding to optimization" : "未检测到明显问题，建议直接进入优化阶段"}</div>
          </div>
        ) : (
          <div className="space-y-3">
            {issues.map((issue) => {
              const meta = getDimensionMeta(issue.dimension, locale);
              const isOpen = expandedIssue === issue.id;
              const severityColors = {
                high: { bg: "bg-red-50", border: "border-red-200", badge: "bg-red-100 text-red-600", icon: "🔴" },
                medium: { bg: "bg-amber-50", border: "border-amber-200", badge: "bg-amber-100 text-amber-600", icon: "🟡" },
                low: { bg: "bg-blue-50", border: "border-blue-200", badge: "bg-blue-100 text-blue-600", icon: "🔵" },
              };
              const colors = severityColors[issue.severity];

              return (
                <div key={issue.id} className={`rounded-2xl border ${colors.border} ${colors.bg} overflow-hidden transition-all`}>
                  <button
                    className="w-full px-4 py-3 flex items-start gap-3 text-left"
                    onClick={() => setExpandedIssue(isOpen ? null : issue.id)}
                  >
                    <span className="text-lg mt-0.5 flex-shrink-0">{colors.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${colors.badge}`}>
                          {severityLabels[issue.severity]}
                        </span>
                        <span className="text-xs text-slate-400">{meta.icon} {meta.label}</span>
                      </div>
                      <div className="font-medium text-slate-800 text-sm">{issue.title}</div>
                    </div>
                    <span className="text-slate-400 mt-0.5 flex-shrink-0 text-sm">{isOpen ? "▲" : "▼"}</span>
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 border-t border-slate-200/50">
                      <div className="grid grid-cols-1 gap-3 pt-3">
                        <div>
                          <div className="text-xs font-medium text-slate-500 mb-1">📋 {locale === "en" ? "Issue Description" : "问题描述"}</div>
                          <div className="text-sm text-slate-700">{issue.description}</div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-indigo-500 mb-1">💡 {locale === "en" ? "Optimization Suggestion" : "优化建议"}</div>
                          <div className="text-sm text-slate-700 bg-white/60 rounded-lg p-3">{issue.suggestion}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* AI deeper analysis */}
        {aiLoading ? (
          <div className="mt-6 p-4 bg-indigo-50 border border-indigo-200 rounded-2xl text-center">
            <div className="text-2xl mb-2 animate-pulse">✦</div>
            <div className="text-sm text-indigo-600">{locale === "en" ? "AI Deep Analysis in Progress..." : "AI 深度分析中..."}</div>
            <div className="text-xs text-indigo-400 mt-1">{locale === "en" ? "Providing targeted evaluation based on your resume content" : "基于你的简历内容给出针对性评价"}</div>
          </div>
        ) : aiError ? (
          <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="text-xs text-slate-400">{aiError}</div>
          </div>
        ) : aiAnalysis ? (
          <div className="mt-6 bg-white rounded-2xl border border-indigo-200 overflow-hidden">
            <div className="px-4 py-3 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-indigo-600">✦</span>
                <span className="text-sm font-semibold text-indigo-700">{locale === "en" ? "AI Deep Analysis Report" : "AI 深度分析报告"}</span>
              </div>
              <ScoreBadge score={aiAnalysis.overall_score} />
            </div>

            <div className="p-4 space-y-4">
              {/* Summary */}
              <div className="bg-indigo-50/50 rounded-xl p-3">
                <div className="text-xs font-medium text-indigo-500 mb-1">📝 {locale === "en" ? "Overall Review" : "总评"}</div>
                <p className="text-sm text-slate-700">{aiAnalysis.summary}</p>
              </div>

              {/* AI Issues */}
              {aiAnalysis.issues.map((issue, idx) => {
                const severityColors: Record<string, { bg: string; border: string; badge: string; icon: string }> = {
                  high: { bg: "bg-red-50", border: "border-red-200", badge: "bg-red-100 text-red-600", icon: "🔴" },
                  medium: { bg: "bg-amber-50", border: "border-amber-200", badge: "bg-amber-100 text-amber-600", icon: "🟡" },
                  low: { bg: "bg-blue-50", border: "border-blue-200", badge: "bg-blue-100 text-blue-600", icon: "🔵" },
                };
                const c = severityColors[issue.severity] || severityColors.low;
                return (
                  <div key={idx} className={`rounded-xl border ${c.border} ${c.bg}`}>
                    <div className="px-4 py-3 flex items-start gap-3">
                      <span className="text-lg mt-0.5">{c.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${c.badge}`}>
                            {severityLabels[issue.severity as keyof typeof severityLabels] || issue.severity}
                          </span>
                        </div>
                        <div className="font-semibold text-slate-800 text-sm">{issue.title}</div>
                      </div>
                    </div>
                    <div className="px-4 pb-4 border-t border-slate-200/50 pt-2 space-y-2">
                      <div>
                        <div className="text-xs font-medium text-slate-500 mb-1">📋 {locale === "en" ? "Issue Description" : "问题描述"}</div>
                        <div className="text-sm text-slate-700">{issue.description}</div>
                      </div>
                      <div className="bg-white/60 rounded-lg p-2">
                        <div className="text-xs font-medium text-indigo-500 mb-1">💡 {locale === "en" ? "Optimization Suggestion" : "优化建议"}</div>
                        <div className="text-sm text-slate-700">{issue.suggestion}</div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Missing items */}
              <MissingList items={aiAnalysis.missing} />

              {/* Raw JSON fallback */}
              {aiAnalysis === null && aiRaw && (
                <pre className="text-xs text-slate-500 whitespace-pre-wrap font-mono">
                  {aiRaw}
                </pre>
              )}
            </div>
          </div>
        ) : aiRaw ? (
          <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="text-xs text-slate-400">{locale === "en" ? "Unable to parse AI response:" : "无法解析 AI 返回内容："} {aiRaw.slice(0, 100)}...</div>
          </div>
        ) : null}

        <div className="mt-8 flex gap-3">
          <Link href="/ai-resume/review" className="flex-1 py-4 text-center border border-slate-300 text-slate-600 rounded-xl font-semibold hover:bg-slate-50">← {locale === "en" ? "Modify Parsing" : "修改解析"}</Link>
          <button
            onClick={() => router.push(`/ai-resume/optimize?major=${major}&stage=${stage}`)}
            className="flex-[2] py-4 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all"
          >
            {locale === "en" ? "Start Optimization →" : "开始优化 →"}
          </button>
        </div>
      </div>
    </div>
  );
}