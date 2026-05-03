"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "@/context/LocaleContext";
import { getAiResumeMajorLabel, normalizeAiResumeMajor } from "@/lib/ai-resume-majors";

const STEPS = [
  { id: "usecase", labelKey: "ai.step.usecase" },
  { id: "upload", labelKey: "ai.step.upload" },
  { id: "review", labelKey: "ai.step.review" },
  { id: "diagnose", labelKey: "ai.step.diagnose" },
  { id: "optimize", labelKey: "ai.step.optimize" },
  { id: "final", labelKey: "ai.step.final" },
];

const SECTION_ICONS: Record<string, string> = {
  education: "🎓",
  project: "💡",
  internship: "🏢",
  research: "🔬",
  competition: "🏆",
  skill: "🛠️",
  award: "🎖️",
  summary: "📝",
  other: "📄",
};

const SECTION_TYPE_LABELS: Record<string, { zh: string; en: string }> = {
  education: { zh: "教育背景", en: "Education" },
  project: { zh: "项目经历", en: "Projects" },
  internship: { zh: "实习经历", en: "Internship" },
  research: { zh: "科研经历", en: "Research" },
  competition: { zh: "竞赛经历", en: "Competitions" },
  skill: { zh: "技能与工具", en: "Skills" },
  award: { zh: "获奖情况", en: "Awards" },
  summary: { zh: "个人总结", en: "Summary" },
  other: { zh: "其他", en: "Other" },
};

interface FinalSection {
  id: string;
  type: string;
  title: string;
  content: string;
  order: number;
  optimized?: boolean;
}

interface ResumeProfile {
  major: string;
  stage: string;
  rawText: string;
  sections: FinalSection[];
  optimizedAt: string;
}

function AIRResumeFinalPageContent() {
  const { t, locale } = useLocale();
  const router = useRouter();
  const params = useSearchParams();
  const major = normalizeAiResumeMajor(params.get("major") || "");
  const stage = params.get("stage") || "";
  const majorLabel = getAiResumeMajorLabel(major, locale);

  const [sections, setSections] = useState<FinalSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [activeSection, setActiveSection] = useState(0);
  const [editingContent, setEditingContent] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("ai_resume_final");
      if (stored) {
        const parsed: FinalSection[] = JSON.parse(stored);
        setSections(parsed);
        const edits: Record<string, string> = {};
        for (const section of parsed) {
          edits[section.id] = section.content;
        }
        setEditingContent(edits);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleEdit = (id: string, content: string) => {
    setEditingContent((previous) => ({ ...previous, [id]: content }));
  };

  const buildFinalText = () =>
    [...sections]
      .sort((a, b) => a.order - b.order)
      .map((section) => `${section.title}\n${editingContent[section.id] ?? section.content}`)
      .join("\n\n");

  const handleSave = async () => {
    setSaving(true);
    setSaveError("");

    try {
      const profile: ResumeProfile = {
        major,
        stage,
        rawText: buildFinalText(),
        sections: sections.map((section) => ({
          ...section,
          content: editingContent[section.id] ?? section.content,
        })),
        optimizedAt: new Date().toISOString(),
      };

      const localName =
        locale === "en"
          ? `Resume Draft ${new Date().toLocaleDateString("en-US")}`
          : `简历草稿 ${new Date().toLocaleDateString("zh-CN")}`;

      const response = await fetch("/api/ai-resume/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: localName,
          major,
          stage: profile.stage,
          rawText: profile.rawText,
          sections: profile.sections,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Save failed");
      }

      const resData = await response.json();
      const savedId = resData.data?.id;

      const savedProfiles = JSON.parse(localStorage.getItem("ai_resume_profiles") || "[]");
      const newProfile = {
        ...profile,
        id: savedId || `resume_${Date.now()}`,
        name: localName,
      };
      savedProfiles.push(newProfile);
      localStorage.setItem("ai_resume_profiles", JSON.stringify(savedProfiles));
      localStorage.setItem("ai_resume_last", JSON.stringify(newProfile));

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : locale === "en"
            ? "Save failed, please try again."
            : "保存失败，请重试。"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    const text = buildFinalText();
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `EngiMatch_Resume_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const handleSyncToProfile = () => {
    sessionStorage.setItem("resume_sync_data", buildFinalText());
    router.push("/applicant?from_resume=1");
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-slate-400">{t("common.loading")}</div>;
  }

  const currentSection = sections[activeSection];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link href="/ai-resume/optimize" className="text-sm text-slate-500 hover:text-slate-800">
            ← {locale === "en" ? "Back to Optimization" : "返回优化页"}
          </Link>
          <div className="text-sm font-medium text-slate-700">{locale === "en" ? "Final Version" : "最终版本"}</div>
          <div className="w-20" />
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8 flex items-center gap-1 overflow-x-auto pb-2">
          {STEPS.map((step, i) => {
            const active = step.id === "final";
            const done = i < STEPS.length - 1;
            return (
              <div key={step.id} className="flex flex-shrink-0 items-center gap-1">
                <div
                  className={`flex items-center gap-1.5 rounded-full px-2 py-1 text-xs ${
                    done ? "bg-green-100 text-green-600" : active ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {done ? "✓" : <span className="font-bold">{i + 1}</span>}
                  <span>{t(step.labelKey)}</span>
                </div>
                {i < STEPS.length - 1 && <div className="h-px w-4 bg-slate-200" />}
              </div>
            );
          })}
        </div>

        <div className="mb-8 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-center text-white">
          <div className="mb-3 text-4xl">✓</div>
          <h1 className="mb-2 text-2xl font-bold">{locale === "en" ? "Optimization Complete" : "优化完成"}</h1>
          <p className="text-sm text-indigo-100">
            {locale === "en"
              ? `Your resume has been optimized for "UK Taught Master's · ${majorLabel}".`
              : `你的简历已针对“英国授课型硕士 · ${majorLabel}”完成优化。`}
          </p>
        </div>

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div className="font-semibold text-slate-800">
              {locale === "en" ? "Resume Preview (Editable)" : "简历预览（可继续编辑）"}
            </div>
            <div className="flex gap-2">
              {sections.map((section, index) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(index)}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-all ${
                    activeSection === index
                      ? "border-indigo-600 bg-indigo-600 text-white"
                      : "border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {SECTION_ICONS[section.type] || "📄"}{" "}
                  {(locale === "en" ? SECTION_TYPE_LABELS[section.type]?.en : SECTION_TYPE_LABELS[section.type]?.zh) ||
                    (locale === "en" ? "Other" : "其他")}
                </button>
              ))}
            </div>
          </div>

          {currentSection && (
            <div className="p-4">
              <div className="mb-2 text-xs font-medium text-slate-400">
                {SECTION_ICONS[currentSection.type] || "📄"} {currentSection.title}
                {currentSection.optimized && (
                  <span className="ml-2 text-indigo-400">({locale === "en" ? "Optimized" : "已优化"})</span>
                )}
              </div>
              <textarea
                value={editingContent[currentSection.id] ?? currentSection.content}
                onChange={(event) => handleEdit(currentSection.id, event.target.value)}
                className="h-48 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder={locale === "en" ? "Resume content..." : "简历内容..."}
              />
            </div>
          )}
        </div>

        <details className="mb-6 rounded-2xl border border-slate-200 bg-white">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50">
            📄 {locale === "en" ? "View Full Resume Text" : "查看完整简历文本"}
          </summary>
          <div className="px-4 pb-4">
            <pre className="whitespace-pre-wrap rounded-xl border border-slate-100 bg-slate-50 p-4 font-mono text-sm text-slate-700">
              {buildFinalText()}
            </pre>
          </div>
        </details>

        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="mb-1 text-sm font-medium text-amber-700">⚠️ {locale === "en" ? "Important Reminder" : "重要提醒"}</div>
          <div className="text-sm text-amber-600">
            {locale === "en"
              ? "This is an AI-optimized draft. Please review each section carefully and make sure everything accurately reflects your real experience before submission."
              : "这是一份 AI 优化后的草稿。提交前请逐段检查，确认内容真实准确地反映了你的经历。"}
          </div>
        </div>

        <div className="space-y-3">
          {saveError && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-center text-sm text-red-600">{saveError}</div>}

          <button
            onClick={handleSave}
            disabled={saving || saved}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-4 font-semibold text-white transition-all hover:bg-indigo-700 disabled:opacity-60"
          >
            {saved
              ? `✓ ${locale === "en" ? "Saved" : "已保存"}`
              : saving
                ? locale === "en"
                  ? "Saving..."
                  : "保存中..."
                : `💾 ${locale === "en" ? "Save Resume Draft" : "保存简历草稿"}`}
          </button>

          <button
            onClick={handleExport}
            className="w-full rounded-xl border-2 border-indigo-200 bg-white py-4 font-semibold text-indigo-600 transition-all hover:bg-indigo-50"
          >
            📥 {locale === "en" ? "Export as Text File" : "导出为文本文件"}
          </button>

          <button
            onClick={handleSyncToProfile}
            className="w-full rounded-xl border border-slate-300 bg-white py-4 font-semibold text-slate-600 transition-all hover:bg-slate-50"
          >
            📤 {locale === "en" ? "Sync to Application Profile" : "同步到申请档案"}
            <span className="mt-0.5 block text-xs font-normal text-slate-400">
              {locale === "en"
                ? "Sync project experience, skill tags, and related content into EngiMatch."
                : "把项目经历、技能标签等内容同步到 EngiMatch 申请系统。"}
            </span>
          </button>

          <div className="pt-2 text-center">
            <Link href="/home" className="text-sm text-slate-400 hover:text-slate-600">
              {t("nav.home")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AIRResumeFinalPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm text-slate-400" />}>
      <AIRResumeFinalPageContent />
    </Suspense>
  );
}
