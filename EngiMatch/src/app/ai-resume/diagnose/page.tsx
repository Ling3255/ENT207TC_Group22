"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";
import { runDiagnostics, getDimensionMeta } from "@/modules/ai/local/resume-diagnostics";
import type { DiagnosticIssue } from "@/modules/ai/local/resume-diagnostics";
import type { ResumeSection } from "@/modules/ai/local/resume-parser";
import { parseAIAnalysis, type AIAnalysis } from "@/modules/ai";

const STEPS = [
  { id: "usecase", labelKey: "ai.step.usecase" },
  { id: "upload", labelKey: "ai.step.upload" },
  { id: "review", labelKey: "ai.step.review" },
  { id: "diagnose", labelKey: "ai.step.diagnose" },
  { id: "optimize", labelKey: "ai.step.optimize" },
  { id: "final", labelKey: "ai.step.final" },
];

async function consumeSSE(
  res: Response,
  onToken: (accumulated: string) => void
): Promise<string> {
  if (!res.body) throw new Error("No response body");
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let accumulated = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const raw = line.slice(6).trim();
      if (raw === "[DONE]") return accumulated;
      try {
        const parsed = JSON.parse(raw);
        if (parsed.error) throw new Error(parsed.error);
        if (parsed.token) {
          accumulated += parsed.token;
          onToken(accumulated);
        }
      } catch (e) {
        const msg = (e as Error).message;
        if (msg !== "Unexpected end of JSON input") throw e;
      }
    }
  }
  return accumulated;
}

function AIRResumeDiagnosePageInner() {
  const { t, locale } = useLocale();
  const router = useRouter();
  const params = useSearchParams();
  const major = params.get("major") || "";
  const stage = params.get("stage") || "";

  const [issues, setIssues] = useState<DiagnosticIssue[]>([]);
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [aiRaw, setAiRaw] = useState<string>("");
  const [aiStreamText, setAiStreamText] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(true);
  const [aiError, setAiError] = useState("");
  const streamBoxRef = useRef<HTMLDivElement>(null);

  // Auto-scroll stream box
  useEffect(() => {
    if (streamBoxRef.current) {
      streamBoxRef.current.scrollTop = streamBoxRef.current.scrollHeight;
    }
  }, [aiStreamText]);

  function ScoreBadge({ score }: { score: number }) {
    const color =
      score >= 80
        ? "bg-green-100 text-green-700 border border-green-200"
        : score >= 60
        ? "bg-amber-100 text-amber-700 border border-amber-200"
        : "bg-red-100 text-red-700 border border-red-200";
    const label =
      locale === "en"
        ? score >= 80
          ? "Excellent"
          : score >= 60
          ? "Good"
          : score >= 40
          ? "Fair"
          : "Needs Work"
        : score >= 80
        ? "优秀"
        : score >= 60
        ? "良好"
        : score >= 40
        ? "一般"
        : "需改进";
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${color}`}
      >
        <span className="text-base leading-none">
          {score >= 80 ? "🌟" : score >= 60 ? "✅" : "⚠️"}
        </span>
        <span>
          {locale === "en"
            ? `${score}/100 · ${label}`
            : `${score}分 · ${label}`}
        </span>
      </div>
    );
  }

  useEffect(() => {
    async function analyze() {
      try {
        const storedSections = sessionStorage.getItem("ai_resume_sections");
        if (!storedSections) {
          router.replace("/ai-resume");
          return;
        }
        const sections: ResumeSection[] = JSON.parse(storedSections);
        const localResult = runDiagnostics(sections, major, locale);
        setIssues(localResult);

        setAiLoading(true);
        setAiStreamText("");

        const res = await fetch("/api/ai-resume/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sections,
            major,
            stage,
            action: "diagnose",
            locale,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          setAiError(
            err.error ||
              (locale === "en"
                ? "AI diagnostics temporarily unavailable"
                : "AI 诊断暂时不可用")
          );
          return;
        }

        const raw = await consumeSSE(res, (text) => setAiStreamText(text));

        if (raw) {
          setAiRaw(raw);
          setAiAnalysis(parseAIAnalysis(raw));
        } else {
          setAiError(
            locale === "en" ? "AI returned empty content." : "AI 返回内容为空。"
          );
        }
      } catch {
        setAiError(
          locale === "en"
            ? "AI diagnostics temporarily unavailable"
            : "AI 诊断暂时不可用"
        );
      } finally {
        setAiLoading(false);
        setAiStreamText("");
      }
    }
    analyze();
  }, [major, stage, router, locale]);

  if (issues.length === 0 && !aiAnalysis && !aiError && aiLoading && !aiStreamText) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
          <span className="text-sm text-slate-400">{t("common.loading")}</span>
        </div>
      </div>
    );
  }

  const highCount = issues.filter((i) => i.severity === "high").length;
  const medCount = issues.filter((i) => i.severity === "medium").length;
  const lowCount = issues.filter((i) => i.severity === "low").length;

  const severityLabels = {
    high: locale === "en" ? "High Priority" : "高优先级",
    medium: locale === "en" ? "Medium" : "中优先级",
    low: locale === "en" ? "Low" : "低优先级",
  };

  const severityColors = {
    high: {
      bg: "bg-red-50",
      border: "border-red-200",
      badge: "bg-red-100 text-red-600",
      icon: "🔴",
    },
    medium: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      badge: "bg-amber-100 text-amber-600",
      icon: "🟡",
    },
    low: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      badge: "bg-blue-100 text-blue-600",
      icon: "🔵",
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/ai-resume/review"
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
          >
            <span>←</span>
            <span>{t("nav.backTo")}</span>
          </Link>
          <div className="text-sm font-semibold text-slate-700">
            {locale === "en" ? "AI Diagnostic Report" : "AI 诊断报告"}
          </div>
          <div className="w-20" />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Steps */}
        <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {STEPS.map((step, i) => {
            const done = ["usecase", "upload", "review"].includes(step.id);
            const active = step.id === "diagnose";
            return (
              <div key={step.id} className="flex items-center gap-1 flex-shrink-0">
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                    done
                      ? "bg-green-100 text-green-700"
                      : active
                      ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {done ? (
                    <span>✓</span>
                  ) : (
                    <span className="font-bold">{i + 1}</span>
                  )}
                  <span>{t(step.labelKey)}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="w-4 h-px bg-slate-200 flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        {/* Hero */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-100 text-3xl mb-4">
            🔍
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            {locale === "en" ? "Diagnostic Report" : "诊断报告"}
          </h1>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            {locale === "en"
              ? "Four-dimension analysis: structure · content · fit · language quality"
              : "从结构、内容、申请适配度、英文表达四个维度深度分析"}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          {[
            {
              count: issues.length || 0,
              label: locale === "en" ? "Issues" : "问题总数",
              color: "text-slate-700",
              bg: "bg-slate-50",
            },
            {
              count: highCount,
              label: locale === "en" ? "High" : "高优先级",
              color: "text-red-600",
              bg: "bg-red-50",
            },
            {
              count: medCount,
              label: locale === "en" ? "Medium" : "中优先级",
              color: "text-amber-600",
              bg: "bg-amber-50",
            },
            {
              count: lowCount,
              label: locale === "en" ? "Low" : "低优先级",
              color: "text-blue-600",
              bg: "bg-blue-50",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`${stat.bg} rounded-2xl border border-slate-200/80 p-4 text-center`}
            >
              <div className={`text-2xl font-bold ${stat.color}`}>
                {stat.count}
              </div>
              <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Local Issues */}
        {issues.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center mb-6">
            <div className="text-4xl mb-3">✅</div>
            <div className="font-semibold text-slate-700 mb-1">
              {locale === "en"
                ? "Basic structure looks good"
                : "简历基础结构良好"}
            </div>
            <div className="text-sm text-slate-400">
              {locale === "en"
                ? "No obvious issues detected"
                : "未检测到明显问题"}
            </div>
          </div>
        ) : (
          <div className="space-y-2.5 mb-6">
            {issues.map((issue) => {
              const meta = getDimensionMeta(issue.dimension, locale);
              const isOpen = expandedIssue === issue.id;
              const colors = severityColors[issue.severity];

              return (
                <div
                  key={issue.id}
                  className={`rounded-2xl border ${colors.border} ${colors.bg} overflow-hidden`}
                >
                  <button
                    className="w-full px-4 py-3 flex items-start gap-3 text-left"
                    onClick={() =>
                      setExpandedIssue(isOpen ? null : issue.id)
                    }
                  >
                    <span className="text-base mt-0.5 flex-shrink-0">
                      {colors.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${colors.badge}`}
                        >
                          {severityLabels[issue.severity]}
                        </span>
                        <span className="text-xs text-slate-400">
                          {meta.icon} {meta.label}
                        </span>
                      </div>
                      <div className="font-medium text-slate-800 text-sm">
                        {issue.title}
                      </div>
                    </div>
                    <span className="text-slate-300 mt-0.5 flex-shrink-0 text-xs">
                      {isOpen ? "▲" : "▼"}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 border-t border-black/5">
                      <div className="grid grid-cols-1 gap-3 pt-3">
                        <div>
                          <div className="text-xs font-semibold text-slate-500 mb-1">
                            📋{" "}
                            {locale === "en"
                              ? "Issue Description"
                              : "问题描述"}
                          </div>
                          <div className="text-sm text-slate-700 leading-relaxed">
                            {issue.description}
                          </div>
                        </div>
                        <div className="bg-white/70 rounded-xl p-3 border border-indigo-100">
                          <div className="text-xs font-semibold text-indigo-500 mb-1">
                            💡{" "}
                            {locale === "en"
                              ? "Optimization Suggestion"
                              : "优化建议"}
                          </div>
                          <div className="text-sm text-slate-700 leading-relaxed">
                            {issue.suggestion}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* AI Deep Analysis */}
        {aiLoading ? (
          <div className="mt-2 bg-white rounded-2xl border border-indigo-200 overflow-hidden shadow-sm shadow-indigo-100/50">
            {/* Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
              </span>
              <span className="text-sm font-semibold text-indigo-700">
                {locale === "en"
                  ? "AI Deep Analysis · Generating..."
                  : "AI 深度分析 · 生成中..."}
              </span>
            </div>
            <div className="p-4">
              {aiStreamText ? (
                <div
                  ref={streamBoxRef}
                  className="text-sm text-slate-600 font-mono whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto"
                >
                  {aiStreamText}
                  <span className="inline-block w-0.5 h-4 bg-indigo-500 ml-0.5 align-text-bottom animate-[blink_1s_step-end_infinite]" />
                </div>
              ) : (
                <div className="flex items-center gap-3 py-3">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="w-2 h-2 bg-indigo-300 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 150}ms` }}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-indigo-400">
                    {locale === "en"
                      ? "Connecting to AI..."
                      : "正在连接 AI..."}
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : aiError ? (
          <div className="mt-2 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="text-xs text-slate-400">{aiError}</div>
          </div>
        ) : aiAnalysis ? (
          <div className="mt-2 bg-white rounded-2xl border border-indigo-200 overflow-hidden shadow-sm shadow-indigo-100/50">
            {/* Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-indigo-500">✦</span>
                <span className="text-sm font-semibold text-indigo-700">
                  {locale === "en"
                    ? "AI Deep Analysis Report"
                    : "AI 深度分析报告"}
                </span>
              </div>
              <ScoreBadge score={aiAnalysis.overall_score} />
            </div>

            <div className="p-4 space-y-3">
              {/* Summary */}
              <div className="bg-gradient-to-br from-indigo-50/60 to-purple-50/40 rounded-xl p-4 border border-indigo-100/60">
                <div className="text-xs font-semibold text-indigo-500 mb-2">
                  📝 {locale === "en" ? "Overall Assessment" : "总体评价"}
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {aiAnalysis.summary}
                </p>
              </div>

              {/* AI Issues */}
              {aiAnalysis.issues.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-500 px-1">
                    {locale === "en"
                      ? "AI-identified Issues"
                      : "AI 识别的问题"}
                  </div>
                  {aiAnalysis.issues.map((issue, idx) => {
                    const c =
                      severityColors[
                        issue.severity as keyof typeof severityColors
                      ] || severityColors.low;
                    return (
                      <div
                        key={idx}
                        className={`rounded-xl border ${c.border} ${c.bg} overflow-hidden`}
                      >
                        <div className="px-4 py-3 flex items-start gap-3">
                          <span className="text-base mt-0.5 flex-shrink-0">
                            {c.icon}
                          </span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${c.badge}`}
                              >
                                {severityLabels[
                                  issue.severity as keyof typeof severityLabels
                                ] || issue.severity}
                              </span>
                            </div>
                            <div className="font-semibold text-slate-800 text-sm">
                              {issue.title}
                            </div>
                          </div>
                        </div>
                        <div className="px-4 pb-4 border-t border-black/5 pt-2 space-y-2">
                          <div>
                            <div className="text-xs font-semibold text-slate-500 mb-1">
                              📋{" "}
                              {locale === "en"
                                ? "Issue Description"
                                : "问题描述"}
                            </div>
                            <div className="text-sm text-slate-700 leading-relaxed">
                              {issue.description}
                            </div>
                          </div>
                          <div className="bg-white/60 rounded-lg p-3 border border-indigo-100/60">
                            <div className="text-xs font-semibold text-indigo-500 mb-1">
                              💡{" "}
                              {locale === "en"
                                ? "Suggestion"
                                : "优化建议"}
                            </div>
                            <div className="text-sm text-slate-700 leading-relaxed">
                              {issue.suggestion}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Missing items */}
              {aiAnalysis.missing?.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="text-xs font-semibold text-amber-600 mb-2">
                    💡{" "}
                    {locale === "en" ? "Recommended Additions" : "建议补充"}
                  </div>
                  <ul className="space-y-1.5">
                    {aiAnalysis.missing.map((item, i) => (
                      <li
                        key={i}
                        className="text-sm text-amber-700 flex items-start gap-2"
                      >
                        <span className="text-amber-400 mt-0.5 flex-shrink-0">
                          •
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Raw fallback */}
              {!aiAnalysis && aiRaw && (
                <pre className="text-xs text-slate-500 whitespace-pre-wrap font-mono bg-slate-50 rounded-xl p-3 border border-slate-200">
                  {aiRaw}
                </pre>
              )}
            </div>
          </div>
        ) : aiRaw ? (
          <div className="mt-2 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="text-xs text-slate-400">
              {locale === "en"
                ? "Unable to parse AI response:"
                : "无法解析 AI 返回内容："}{" "}
              {aiRaw.slice(0, 120)}...
            </div>
          </div>
        ) : null}

        {/* Actions */}
        <div className="mt-8 flex gap-3">
          <Link
            href="/ai-resume/review"
            className="flex-1 py-4 text-center border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 transition-colors text-sm"
          >
            ← {locale === "en" ? "Modify Sections" : "修改解析"}
          </Link>
          <button
            onClick={() =>
              router.push(`/ai-resume/optimize?major=${major}&stage=${stage}`)
            }
            className="flex-[2] py-4 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors text-sm"
          >
            {locale === "en" ? "Start Optimization →" : "开始优化 →"}
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default function AIRResumeDiagnosePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AIRResumeDiagnosePageInner />
    </Suspense>
  );
}
