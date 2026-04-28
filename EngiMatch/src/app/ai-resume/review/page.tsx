"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";
import { parseResumeText } from "@/lib/resume-parser";
import type { ResumeSection, ResumeSectionType } from "@/lib/resume-parser";

const STEPS = [
  { id: "usecase", labelKey: "ai.step.usecase" },
  { id: "upload", labelKey: "ai.step.upload" },
  { id: "review", labelKey: "ai.step.review" },
  { id: "diagnose", labelKey: "ai.step.diagnose" },
  { id: "optimize", labelKey: "ai.step.optimize" },
  { id: "final", labelKey: "ai.step.final" },
];

const SECTION_TYPE_OPTIONS: Array<{ value: ResumeSectionType; labelKey: string }> = [
  { value: "education", labelKey: "section.education" },
  { value: "project", labelKey: "section.project" },
  { value: "internship", labelKey: "section.internship" },
  { value: "research", labelKey: "section.research" },
  { value: "competition", labelKey: "section.competition" },
  { value: "skill", labelKey: "section.skill" },
  { value: "award", labelKey: "section.award" },
  { value: "summary", labelKey: "section.summary" },
  { value: "personal_info", labelKey: "section.personal_info" },
  { value: "other", labelKey: "section.other" },
];

function typeMapper(aiType: string): ResumeSectionType {
  const t = aiType.toLowerCase();
  if (t.includes("education") || t.includes("教育") || t.includes("学历")) return "education";
  if (t.includes("project") || t.includes("项目")) return "project";
  if (t.includes("research") || t.includes("科研") || t.includes("研究")) return "research";
  if (t.includes("internship") || t.includes("实习") || t.includes("工作")) return "internship";
  if (t.includes("competition") || t.includes("竞赛") || t.includes("比赛")) return "competition";
  if (t.includes("skill") || t.includes("技能") || t.includes("证书")) return "skill";
  if (t.includes("award") || t.includes("获奖") || t.includes("荣誉") || t.includes("奖学金")) return "award";
  if (t.includes("summary") || t.includes("总结") || t.includes("个人陈述") || t.includes("自我评价")) return "summary";
  if (t.includes("personal") || t.includes("个人信息")) return "personal_info";
  return "other";
}

function AIRResumeReviewPageContent() {
  const { t, locale } = useLocale();
  const router = useRouter();
  const params = useSearchParams();
  const major = params.get("major") || "";
  const stage = params.get("stage") || "";

  const [sections, setSections] = useState<ResumeSection[]>([]);
  const [rawText, setRawText] = useState<string>("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiSplitting, setAiSplitting] = useState(false);
  const [aiSplitError, setAiSplitError] = useState<string>("");
  const [useAiSplit, setUseAiSplit] = useState(false);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("ai_resume_text");
      if (!stored) { router.replace("/ai-resume"); return; }
      const { rawText: text } = JSON.parse(stored);
      if (!text) { router.replace("/ai-resume"); return; }

      setRawText(text);

      // 先用本地解析
      const parsed = parseResumeText(text);
      setSections(parsed);

      // Generate suggestions
      generateSuggestions(parsed);
    } finally {
      setLoading(false);
    }
  }, [router, locale]);

  const generateSuggestions = (parsed: ResumeSection[]) => {
    const sectionTypes = new Set(parsed.map(s => s.type));
    const sug: string[] = [];
    if (!sectionTypes.has("education")) {
      sug.push(locale === "en" ? "Education section not detected, please add manually" : "未识别到教育背景，请手动添加");
    }
    if (!sectionTypes.has("project") && !sectionTypes.has("research")) {
      sug.push(locale === "en" ? "Project or research experience not detected, please confirm if included" : "未识别到项目或科研经历，请确认是否已包含");
    }
    if (!sectionTypes.has("skill")) {
      sug.push(locale === "en" ? "Skills section not detected, recommend adding programming languages and tools" : "未识别到技能部分，建议补充编程语言和工具");
    }
    setSuggestions(sug);
  };

  const handleAiSplit = async () => {
    if (!rawText || aiSplitting) return;

    setAiSplitting(true);
    setAiSplitError("");

    try {
      const res = await fetch("/api/ai-resume/split", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: rawText }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setAiSplitError(data.error || (locale === "en" ? "AI split failed" : "AI分割失败"));
        return;
      }

      if (data.sections && Array.isArray(data.sections) && data.sections.length > 0) {
        const newSections: ResumeSection[] = data.sections.map((s: any, i: number) => ({
          id: `section_ai_${i}`,
          type: typeMapper(s.type || s.category || "other"),
          title: s.title || s.name || (locale === "en" ? `Section ${i + 1}` : `段落 ${i + 1}`),
          content: s.content || s.text || "",
          order: i,
          confirmed: false,
        }));

        setSections(newSections);
        setUseAiSplit(true);
        generateSuggestions(newSections);
      } else {
        setAiSplitError(locale === "en" ? "AI did not return valid sections" : "AI未返回有效段落");
      }
    } catch (err) {
      setAiSplitError(err instanceof Error ? err.message : (locale === "en" ? "Network error" : "网络错误"));
    } finally {
      setAiSplitting(false);
    }
  };

  const handleReParse = () => {
    if (!rawText) return;
    const parsed = parseResumeText(rawText);
    setSections(parsed);
    setUseAiSplit(false);
    generateSuggestions(parsed);
  };

  const updateSection = (i: number, field: keyof ResumeSection, value: unknown) => {
    setSections(p => p.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
  };

  const addSection = () => {
    setSections(p => [...p, {
      id: `section_${Date.now()}`,
      type: "other" as ResumeSectionType,
      title: t("section.new"),
      content: "",
      order: p.length,
      confirmed: false,
    }]);
  };

  const removeSection = (i: number) => {
    setSections(p => p.filter((_, idx) => idx !== i));
  };

  const handleConfirm = () => {
    sessionStorage.setItem("ai_resume_sections", JSON.stringify(sections));
    router.push(`/ai-resume/diagnose?major=${major}&stage=${stage}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400 text-sm">{t("common.loading")}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-stone-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/ai-resume/upload" className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1">← {t("nav.backTo")}</Link>
          <div className="text-sm font-medium text-slate-700">{locale === "en" ? "Confirm Parsing Results" : "确认解析结果"}</div>
          <div className="w-20" />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-2">
          {STEPS.map((step, i) => {
            const done = ["usecase", "upload"].includes(step.id);
            const active = step.id === "review";
            return (
              <div key={step.id} className="flex items-center gap-1 flex-shrink-0">
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${done ? "bg-amber-100 text-amber-700" : active ? "bg-amber-600 text-white" : "bg-stone-100 text-stone-400"}`}>
                  {done ? "✓" : <span className="font-bold">{i + 1}</span>}
                  <span>{t(step.labelKey)}</span>
                </div>
                {i < STEPS.length - 1 && <div className="w-4 h-px bg-slate-200" />}
              </div>
            );
          })}
        </div>

        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900">{t("review.title")}</h1>
          <button onClick={addSection} className="text-xs text-amber-700 hover:underline">{t("review.add_section")}</button>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          {locale === "en"
            ? `The system has split your resume into ${sections.length} sections. Please confirm if the categorization is correct.`
            : `系统已将你的简历拆分为 ${sections.length} 个部分，请确认分类是否正确。`
          }
        </p>

        {/* Split method selector */}
        <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-slate-700">
                {locale === "en" ? "Splitting Method" : "分割方式"}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {useAiSplit
                  ? (locale === "en" ? "AI Smart Split" : "AI智能分割")
                  : (locale === "en" ? "Rule-based Split" : "规则分割")
                }
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleReParse}
                disabled={!rawText}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  !useAiSplit
                    ? "bg-amber-100 text-amber-800 border-amber-200"
                    : "bg-white text-stone-600 border-stone-200 hover:bg-stone-100"
                }`}
              >
                {locale === "en" ? "Rule-based" : "规则分割"}
              </button>
              <button
                onClick={handleAiSplit}
                disabled={aiSplitting || !rawText}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1 ${
                  useAiSplit
                    ? "bg-amber-600 text-white border-amber-600"
                    : "bg-white text-amber-700 border-amber-200 hover:bg-amber-50"
                }`}
              >
                {aiSplitting ? (
                  <>
                    <span className="animate-pulse">✦</span>
                    {locale === "en" ? "Splitting..." : "分割中..."}
                  </>
                ) : (
                  <>
                    <span>✦</span>
                    {locale === "en" ? "AI Smart Split" : "AI智能分割"}
                  </>
                )}
              </button>
            </div>
          </div>
          {aiSplitError && (
            <div className="mt-2 text-xs text-red-500">{aiSplitError}</div>
          )}
        </div>

        {suggestions.length > 0 && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="text-sm font-medium text-amber-700 mb-1">{t("review.hint")}</div>
            {suggestions.map((s, i) => (
              <div key={i} className="text-sm text-amber-600 mt-1">{s}</div>
            ))}
          </div>
        )}

        <div className="space-y-4">
          {sections.map((section, i) => (
            <div key={section.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">#{i + 1}</span>
                <select
                  value={section.type}
                  onChange={(e) => updateSection(i, "type", e.target.value as ResumeSectionType)}
                  className="text-sm font-medium text-stone-700 bg-white border border-stone-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-amber-400"
                >
                  {SECTION_TYPE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>
                  ))}
                </select>
                <input
                  value={section.title}
                  onChange={(e) => updateSection(i, "title", e.target.value)}
                  className="flex-1 text-sm text-slate-600 bg-transparent border-0 focus:outline-none"
                  placeholder={t("section.title_placeholder")}
                />
                <button onClick={() => removeSection(i)} className="text-slate-400 hover:text-red-500 text-sm px-1">×</button>
              </div>
              <textarea
                value={section.content}
                onChange={(e) => updateSection(i, "content", e.target.value)}
                rows={8}
                className="w-full px-4 py-3 text-sm font-mono text-slate-700 focus:outline-none resize-none"
                placeholder={t("section.content_placeholder")}
              />
            </div>
          ))}
        </div>

        {sections.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-sm">
            {locale === "en" ? "Could not parse content, please paste resume text and restart" : "未能解析出内容，请直接粘贴简历文本后重新开始"}
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <Link href="/ai-resume/upload" className="flex-1 py-4 text-center border border-slate-300 text-slate-600 rounded-xl font-semibold hover:bg-slate-50">← {t("nav.back")}</Link>
          <button
            onClick={handleConfirm}
            disabled={sections.length === 0}
            className="flex-[2] py-4 bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-700 disabled:opacity-50 transition-all"
          >
            {t("review.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AIRResumeReviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-400 text-sm" />}>
      <AIRResumeReviewPageContent />
    </Suspense>
  );
}
