"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";
import { optimizeSection } from "@/lib/resume-optimize";
import type { OptimizationResult } from "@/lib/resume-optimize";
import type { ResumeSection } from "@/lib/resume-parser";
import { SECTION_TYPE_LABELS } from "@/lib/resume-parser";

// 类型定义
type StringRecord = { [key: string]: string };
type VariantArrayRecord = { [key: string]: Array<{ label: string; text: string }> };

const STEPS = [
  { id: "usecase", labelKey: "ai.step.usecase" },
  { id: "upload", labelKey: "ai.step.upload" },
  { id: "review", labelKey: "ai.step.review" },
  { id: "diagnose", labelKey: "ai.step.diagnose" },
  { id: "optimize", labelKey: "ai.step.optimize" },
  { id: "final", labelKey: "ai.step.final" },
];

const SECTION_ICONS: Record<string, string> = {
  education: "🎓", project: "💻", internship: "🏢", research: "🔬",
  competition: "🏆", skill: "🛠️", award: "🎖️", summary: "📝", other: "📄",
};

export default function AIRResumeOptimizePage() {
  const { t, locale } = useLocale();
  const router = useRouter();
  const params = useSearchParams();
  const major = params.get("major") || "";
  const stage = params.get("stage") || "";

  const [sections, setSections] = useState<ResumeSection[]>([]);
  const [optimized, setOptimized] = useState<Record<string, OptimizationResult>>({});
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<Record<string, string>>({});
  const [customEdits, setCustomEdits] = useState<Record<string, string>>({});
  const [supplementModal, setSupplementModal] = useState<{ sectionId: string; hints: string[] } | null>(null);
  const [supplementText, setSupplementText] = useState("");
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());

  const [optimizingSection, setOptimizingSection] = useState<string | null>(null);
  const [aiOptimizations, setAiOptimizations] = useState<StringRecord>({});
  const [aiOptimizeErrors, setAiOptimizeErrors] = useState<StringRecord>({});
  const [aiVariants, setAiVariants] = useState<VariantArrayRecord>({});
  const [selectedAiVariant, setSelectedAiVariant] = useState<StringRecord>({});

  useEffect(() => {
    async function load() {
      try {
        const stored = sessionStorage.getItem("ai_resume_sections");
        if (!stored) { router.replace("/ai-resume"); return; }
        const parsed: ResumeSection[] = JSON.parse(stored);
        setSections(parsed);

        const results: Record<string, OptimizationResult> = {};
        const variants: Record<string, string> = {};
        for (const s of parsed) {
          const result = optimizeSection(s.content, s.type, major, locale);
          results[s.id] = result;
          if (result.variants.length > 0) {
            variants[s.id] = result.variants[0].id;
          }
        }
        setOptimized(results);
        setSelectedVariant(variants);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [major, router]);

  const requestAiOptimize = async (section: ResumeSection) => {
    if (optimizingSection === section.id) return;
    setOptimizingSection(section.id);
    try {
      const res = await fetch("/api/ai-resume/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sections: [section],
          major,
          stage,
          action: "optimize",
          sectionIndex: sections.findIndex(s => s.id === section.id),
          sectionType: section.type,
          original: section.content,
          locale,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.optimized) {
          // 解析AI返回的多个版本
          const parts = data.optimized.split(/^---+$/m);
          const variants: Array<{ label: string; text: string }> = [];

          for (let i = 0; i < parts.length; i++) {
            const part = parts[i].trim();
            if (!part) continue;

            // 尝试匹配版本标题
            const titleMatch = part.match(/^(?:【|\[)([^\]】]+)(?::|】|\])/);
            if (titleMatch) {
              const label = titleMatch[1].trim();
              const text = part.replace(/^[^\n]*\n/, "").trim();
              variants.push({ label, text });
            } else {
              // 如果没有标题，使用序号
              const labels = locale === "en"
                ? ["Version 1", "Version 2", "Version 3"]
                : ["版本 1", "版本 2", "版本 3"];
              variants.push({ label: labels[i] || `Version ${i + 1}`, text: part });
            }
          }

          if (variants.length > 0) {
            setAiVariants(p => ({ ...p, [section.id]: variants }));
            setAiOptimizations(p => ({ ...p, [section.id]: variants[0].text }));
            setSelectedAiVariant(p => ({ ...p, [section.id]: variants[0].text }));
          } else {
            // 只有一个版本的情况
            setAiOptimizations(p => ({ ...p, [section.id]: data.optimized }));
          }
        } else {
          setAiOptimizeErrors(p => ({ ...p, [section.id]: locale === "en" ? "AI returned empty, please retry" : "AI 返回为空，请重试" }));
        }
      } else {
        const err = await res.json().catch(() => ({}));
        setAiOptimizeErrors(p => ({ ...p, [section.id]: err.error || (locale === "en" ? "Generation failed, please retry" : "生成失败，请重试") }));
      }
    } catch {
      setAiOptimizeErrors(p => ({ ...p, [section.id]: locale === "en" ? "Network error, please retry" : "网络错误，请重试" }));
    }
    setOptimizingSection(null);
  };

  const currentSection = sections[activeSection];
  const currentResult = currentSection ? optimized[currentSection.id] : null;
  const currentVariantId = currentSection ? selectedVariant[currentSection.id] : "";
  const currentVariant = currentResult?.variants.find(v => v.id === currentVariantId);
  const currentText = currentSection
    ? (customEdits[currentSection.id] ?? currentVariant?.text ?? currentSection.content)
    : "";

  const markDone = () => {
    if (!currentSection) return;
    setCompletedSections(p => new Set([...p, currentSection.id]));
    if (activeSection < sections.length - 1) {
      setActiveSection(i => i + 1);
    }
  };

  const handleSupplement = () => {
    if (!supplementModal || !supplementText.trim()) return;
    const sectionId = supplementModal.sectionId;
    setCustomEdits(p => ({
      ...p,
      [sectionId]: (p[sectionId] ?? sections.find(s => s.id === sectionId)?.content ?? "") + "\n\n" + supplementText.trim(),
    }));
    setSupplementModal(null);
    setSupplementText("");
  };

  const handleGenerateFinal = () => {
    const finalSections = sections.map(s => {
      // 优先级：customEdits > aiOptimizations > selectedVariant > 原内容
      let content = s.content;
      let optimized = false;

      if (customEdits[s.id]) {
        content = customEdits[s.id];
        optimized = true;
      } else if (aiOptimizations[s.id]) {
        content = aiOptimizations[s.id];
        optimized = true;
      } else if (selectedVariant[s.id]) {
        content = optimized[s.id]?.variants.find(v => v.id === selectedVariant[s.id])?.text ?? s.content;
        optimized = true;
      }

      return {
        ...s,
        content,
        optimized,
      };
    });
    sessionStorage.setItem("ai_resume_final", JSON.stringify(finalSections));
    router.push(`/ai-resume/final?major=${major}&stage=${stage}`);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">{t("common.loading")}</div>;
  }

  const progress = sections.length > 0 ? (completedSections.size / sections.length) * 100 : 0;

  const completedLabel = locale === "en"
    ? `Completed ${completedSections.size}/${sections.length} sections`
    : `已完成 ${completedSections.size}/${sections.length} 个段落`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/ai-resume/diagnose" className="text-sm text-slate-500 hover:text-slate-800">← {locale === "en" ? "Back to Diagnostic Report" : "返回诊断报告"}</Link>
          <div className="text-sm font-medium text-slate-700">{locale === "en" ? "Section Optimization" : "逐段优化"}</div>
          <div className="w-28" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-2">
          {STEPS.map((step, i) => {
            const done = ["usecase", "upload", "review", "diagnose"].includes(step.id);
            const active = step.id === "optimize";
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

        {/* Section tabs */}
        <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1">
          {sections.map((s, i) => {
            const done = completedSections.has(s.id);
            const isActive = activeSection === i;
            return (
              <button key={s.id} onClick={() => setActiveSection(i)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap border transition-all ${
                  isActive
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : done
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
                }`}
              >
                <span>{SECTION_ICONS[s.type] || "📄"}</span>
                <span>{SECTION_TYPE_LABELS[s.type] || (locale === "en" ? "Other" : "其他")}</span>
                {done && <span className="text-xs">✓</span>}
              </button>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>{completedLabel}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Optimization panel */}
        {currentSection && currentResult && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Left: original */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-700">{locale === "en" ? "Original" : "原文"}</div>
                  <div className="text-xs text-slate-400">{SECTION_TYPE_LABELS[currentSection.type]}</div>
                </div>
                <div className="flex items-center gap-2">
                  {currentResult.missingHints.length > 0 && (
                    <button
                      onClick={() => setSupplementModal({ sectionId: currentSection.id, hints: currentResult.missingHints })}
                      className="text-xs text-amber-500 hover:underline"
                    >
                      📝 {locale === "en" ? "Add Info" : "补充信息"}
                    </button>
                  )}
                </div>
              </div>
              <div className="flex-1 p-4">
                <textarea
                  value={customEdits[currentSection.id] ?? currentSection.content}
                  onChange={(e) => setCustomEdits(p => ({ ...p, [currentSection.id]: e.target.value }))}
                  className="w-full h-48 text-sm font-mono text-slate-600 focus:outline-none resize-none bg-slate-50 rounded-xl p-3 border border-slate-200"
                  placeholder={locale === "en" ? "Original content..." : "原文内容..."}
                />
                {customEdits[currentSection.id] && (
                  <button onClick={() => setCustomEdits(p => { const n = { ...p }; delete n[currentSection.id]; return n; })}
                    className="mt-2 text-xs text-slate-400 hover:text-slate-600">
                    {locale === "en" ? "Reset to original" : "重置为原文"}
                  </button>
                )}
              </div>
            </div>

            {/* Right: optimized */}
            <div className="bg-white rounded-2xl border border-indigo-200 shadow-sm flex flex-col">
              <div className="px-4 py-3 border-b border-indigo-100 flex items-center justify-between bg-indigo-50">
                <div className="text-sm font-semibold text-indigo-700">{locale === "en" ? "AI Optimization Suggestions" : "AI 优化建议"}</div>
                <button
                  onClick={() => requestAiOptimize(currentSection)}
                  disabled={optimizingSection === currentSection.id}
                  className="text-xs px-3 py-1 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {optimizingSection === currentSection.id ? (locale === "en" ? "Generating..." : "生成中...") : "✦ AI Rewrite"}
                </button>
              </div>

              {/* Variant selector */}
              {currentResult.variants.length > 0 && (
                <div className="px-4 pt-3 flex gap-2 flex-wrap border-b border-slate-100 pb-3">
                  {currentResult.variants.map(v => (
                    <button key={v.id} onClick={() => setSelectedVariant(p => ({ ...p, [currentSection.id]: v.id }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        selectedVariant[currentSection.id] === v.id
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
                      }`}>
                      {v.label}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex-1 p-4 overflow-auto">
                {aiVariants[currentSection.id] && aiVariants[currentSection.id].length > 0 ? (
                  <div>
                    <div className="text-xs text-indigo-500 mb-2 font-medium">✦ {locale === "en" ? "AI Rewritten Versions:" : "AI 改写版本："}</div>
                    {/* 版本选择按钮 */}
                    <div className="flex gap-2 flex-wrap mb-3">
                      {aiVariants[currentSection.id].map((v, idx) => (
                        <button key={idx} onClick={() => {
                          setAiOptimizations(p => ({ ...p, [currentSection.id]: v.text }));
                          setSelectedAiVariant(p => ({ ...p, [currentSection.id]: v.text }));
                        }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                            selectedAiVariant[currentSection.id] === v.text
                              ? "bg-indigo-600 text-white border-indigo-600"
                              : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
                          }`}>
                          {locale === "en" ? "Option" : "选项"} {idx + 1}
                        </button>
                      ))}
                    </div>
                    {/* 显示当前选中的版本 */}
                    <div className="text-sm font-mono text-slate-700 whitespace-pre-wrap h-48 overflow-auto bg-slate-50 rounded-xl p-3 border border-slate-200">
                      {aiOptimizations[currentSection.id]}
                    </div>
                    <button
                      onClick={() => {
                        const text = aiOptimizations[currentSection.id];
                        setCustomEdits(p => ({ ...p, [currentSection.id]: text }));
                      }}
                      className="mt-2 text-xs text-indigo-600 hover:underline"
                    >
                      {locale === "en" ? "Adopt this AI rewrite" : "采纳这段 AI 改写"}
                    </button>
                  </div>
                ) : aiOptimizations[currentSection.id] ? (
                  <div>
                    <div className="text-xs text-indigo-500 mb-2 font-medium">✦ {locale === "en" ? "AI Rewritten Version:" : "AI 重写版本："}</div>
                    <div className="text-sm font-mono text-slate-700 whitespace-pre-wrap h-48 overflow-auto">
                      {aiOptimizations[currentSection.id]}
                    </div>
                    <button
                      onClick={() => {
                        const text = aiOptimizations[currentSection.id];
                        setCustomEdits(p => ({ ...p, [currentSection.id]: text }));
                      }}
                      className="mt-2 text-xs text-indigo-600 hover:underline"
                    >
                      {locale === "en" ? "Adopt this AI rewrite" : "采纳这段 AI 改写"}
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="text-sm font-mono text-slate-700 whitespace-pre-wrap h-48 overflow-auto">
                      {currentVariant?.text || (locale === "en" ? "(Click \"AI Rewrite\" above for more precise optimization)" : "（点击右上角「AI 重写」获取更精准的优化版本）")}
                    </div>
                    {currentVariant && (
                      <div className="mt-2 text-xs text-indigo-400">{currentVariant.description}</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Missing hints reminder */}
        {currentResult && currentResult.missingHints.length > 0 && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="text-xs font-medium text-amber-600 mb-2">💡 {locale === "en" ? "System Hint" : "系统提示"}</div>
            {currentResult.missingHints.map((h, i) => (
              <div key={i} className="text-sm text-amber-700 mb-1">{h}</div>
            ))}
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3">
          <button onClick={() => setActiveSection(i => Math.max(0, i - 1))}
            disabled={activeSection === 0}
            className="px-4 py-3 border border-slate-300 text-slate-600 rounded-xl font-semibold disabled:opacity-40 hover:bg-slate-50">
            ← {locale === "en" ? "Previous" : "上一段"}
          </button>
          <div className="flex-1" />
          {activeSection < sections.length - 1 ? (
            <button onClick={markDone}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700">
              {locale === "en" ? "Done, Continue →" : "完成此段，继续 →"}
            </button>
          ) : (
            <button onClick={handleGenerateFinal}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700">
              {locale === "en" ? "Generate Final Version →" : "生成最终版本 →"}
            </button>
          )}
        </div>
      </div>

      {/* Supplement modal */}
      {supplementModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">{locale === "en" ? "Add Information" : "补充信息"}</h3>
              <button onClick={() => setSupplementModal(null)} className="text-slate-400 hover:text-slate-600 text-xl">×</button>
            </div>
            <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="text-xs font-medium text-amber-600 mb-2">💡 {locale === "en" ? "Please provide the following information" : "请补充以下信息"}</div>
              {supplementModal.hints.map((h, i) => (
                <div key={i} className="text-xs text-amber-700 mb-1">• {h}</div>
              ))}
            </div>
            <textarea
              value={supplementText}
              onChange={(e) => setSupplementText(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              placeholder={locale === "en"
                ? "Enter additional information here, e.g.:\nTools used: MATLAB/Simulink\nProject results: Reduced response time by 20%\nCourses: Control Theory, Circuit Principles..."
                : "在此输入你想补充的内容，如：\n使用的工具：MATLAB/Simulink\n项目成果：将响应时间缩短了 20%\n课程：控制理论、电路原理..."}
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setSupplementModal(null)} className="flex-1 py-2.5 border border-slate-300 text-slate-600 rounded-xl text-sm font-medium">{locale === "en" ? "Cancel" : "取消"}</button>
              <button onClick={handleSupplement} disabled={!supplementText.trim()}
                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                {locale === "en" ? "Add and Continue" : "补充并继续优化"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}