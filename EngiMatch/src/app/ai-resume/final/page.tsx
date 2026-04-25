"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";

const STEPS = [
  { id: "usecase", labelKey: "ai.step.usecase" },
  { id: "upload", labelKey: "ai.step.upload" },
  { id: "review", labelKey: "ai.step.review" },
  { id: "diagnose", labelKey: "ai.step.diagnose" },
  { id: "optimize", labelKey: "ai.step.optimize" },
  { id: "final", labelKey: "ai.step.final" },
];

const MAJOR_LABELS: Record<string, { zh: string; en: string }> = {
  mechanical: { zh: "机械工程", en: "Mechanical" },
  electrical: { zh: "电气工程", en: "Electrical" },
  electronic: { zh: "电子信息", en: "Electronic" },
  control: { zh: "控制科学与工程", en: "Control" },
  energy: { zh: "能源与动力", en: "Energy" },
  materials: { zh: "材料工程", en: "Materials" },
  civil: { zh: "土木工程", en: "Civil" },
  computer: { zh: "计算机 / AI", en: "Computer / AI" },
  automotive: { zh: "车辆工程", en: "Automotive" },
  aerospace: { zh: "航空航天", en: "Aerospace" },
  chemical: { zh: "化学工程", en: "Chemical" },
  other: { zh: "其他工科方向", en: "Other" },
};

const SECTION_ICONS: Record<string, string> = {
  education: "🎓", project: "💻", internship: "🏢", research: "🔬",
  competition: "🏆", skill: "🛠️", award: "🎖️", summary: "📝", other: "📄",
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

export default function AIRResumeFinalPage() {
  const { t, locale } = useLocale();
  const router = useRouter();
  const params = useSearchParams();
  const major = params.get("major") || "";
  const majorInfo = MAJOR_LABELS[major] || { zh: major, en: major };
  const majorLabel = locale === "en" ? majorInfo.en : majorInfo.zh;

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
        for (const s of parsed) edits[s.id] = s.content;
        setEditingContent(edits);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleEdit = (id: string, content: string) => {
    setEditingContent(p => ({ ...p, [id]: content }));
  };

  const buildFinalText = () => {
    return sections
      .sort((a, b) => a.order - b.order)
      .map(s => {
        const content = editingContent[s.id] ?? s.content;
        return `${s.title}\n${content}`;
      })
      .join("\n\n");
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError("");
    try {
      const profile: ResumeProfile = {
        major,
        stage: params.get("stage") || "",
        rawText: buildFinalText(),
        sections: sections.map(s => ({ ...s, content: editingContent[s.id] ?? s.content })),
        optimizedAt: new Date().toISOString(),
      };

      const localName = locale === "en"
        ? `Resume Draft ${new Date().toLocaleDateString("en-US")}`
        : `简历草稿 ${new Date().toLocaleDateString("zh-CN")}`;

      // Persist to database via API
      const res = await fetch("/api/ai-resume/save", {
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

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Save failed");
      }

      const { id: savedId } = await res.json();

      // Also persist to localStorage for offline/quick access
      if (typeof window !== "undefined") {
        const savedProfiles = JSON.parse(localStorage.getItem("ai_resume_profiles") || "[]");
        const newProfile = {
          ...profile,
          id: savedId || `resume_${Date.now()}`,
          name: localName,
        };
        savedProfiles.push(newProfile);
        localStorage.setItem("ai_resume_profiles", JSON.stringify(savedProfiles));
        localStorage.setItem("ai_resume_last", JSON.stringify(newProfile));
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : (locale === "en" ? "Save failed, please try again" : "保存失败，请重试");
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    const text = buildFinalText();
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `EngiMatch_Resume_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSyncToProfile = () => {
    const finalText = buildFinalText();
    if (typeof window !== "undefined") {
      sessionStorage.setItem("resume_sync_data", finalText);
    }
    router.push(`/applicant?from_resume=1`);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">{t("common.loading")}</div>;
  }

  const currentSection = sections[activeSection];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/ai-resume/optimize" className="text-sm text-slate-500 hover:text-slate-800">← {locale === "en" ? "Back to Optimization" : "返回优化"}</Link>
          <div className="text-sm font-medium text-slate-700">{locale === "en" ? "Final Version" : "最终版本"}</div>
          <div className="w-20" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-2">
          {STEPS.map((step, i) => {
            const done = i < STEPS.length - 1;
            const active = step.id === "final";
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

        {/* Success banner */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-6 text-white mb-8 text-center">
          <div className="text-4xl mb-3">✨</div>
          <h1 className="text-2xl font-bold mb-2">{locale === "en" ? "Optimization Complete!" : "优化完成！"}</h1>
          <p className="text-indigo-200 text-sm">
            {locale === "en"
              ? `Your resume has been optimized for "UK Taught Master's · ${majorLabel}"`
              : `你的简历已针对「英国授课型硕士 · ${majorLabel}」方向优化`}
          </p>
        </div>

        {/* Editable preview */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-6">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <div className="font-semibold text-slate-800">{locale === "en" ? "Resume Preview (Editable)" : "简历预览（可继续编辑）"}</div>
            <div className="flex gap-2">
              {sections.map((s, i) => (
                <button key={s.id} onClick={() => setActiveSection(i)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                    activeSection === i
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "text-slate-500 border-slate-200 hover:bg-slate-50"
                  }`}>
                  {SECTION_ICONS[s.type]} {(locale === "en" ? SECTION_TYPE_LABELS[s.type]?.en : SECTION_TYPE_LABELS[s.type]?.zh) || (locale === "en" ? "Other" : "其他")}
                </button>
              ))}
            </div>
          </div>
          {currentSection && (
            <div className="p-4">
              <div className="text-xs text-slate-400 mb-2 font-medium">
                {SECTION_ICONS[currentSection.type]} {currentSection.title}
                {currentSection.optimized && <span className="ml-2 text-indigo-400">({locale === "en" ? "Optimized" : "已优化"})</span>}
              </div>
              <textarea
                value={editingContent[currentSection.id] ?? currentSection.content}
                onChange={(e) => handleEdit(currentSection.id, e.target.value)}
                className="w-full h-48 text-sm font-mono text-slate-700 bg-slate-50 rounded-xl p-3 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                placeholder={locale === "en" ? "Resume content..." : "简历内容..."}
              />
            </div>
          )}
        </div>

        {/* Full preview */}
        <details className="bg-white rounded-2xl border border-slate-200 mb-6">
          <summary className="px-4 py-3 text-sm font-medium text-slate-600 cursor-pointer hover:bg-slate-50">
            📄 {locale === "en" ? "View Full Resume Text" : "查看完整简历文本"}
          </summary>
          <div className="px-4 pb-4">
            <pre className="text-sm font-mono text-slate-700 whitespace-pre-wrap bg-slate-50 rounded-xl p-4 border border-slate-100">
              {buildFinalText()}
            </pre>
          </div>
        </details>

        {/* Reminder */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="text-sm font-medium text-amber-700 mb-1">📌 {locale === "en" ? "Important Reminder" : "重要提醒"}</div>
          <div className="text-sm text-amber-600">
            {locale === "en"
              ? "This is an AI-optimized resume draft. Please carefully review each section to ensure it accurately reflects your real experiences before submitting. AI suggestions are for reference only, and the final content is your decision."
              : "这是一份经过 AI 优化的简历草稿，请在提交前仔细检查每段内容是否准确反映了你的真实经历。AI 建议仅供参考，最终内容由你决定。"}
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-3">
          {saveError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600 text-center">
              {saveError}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving || saved}
            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
          >
            {saved ? "✓ " + (locale === "en" ? "Saved" : "已保存") : saving ? (locale === "en" ? "Saving..." : "保存中...") : "💾 " + (locale === "en" ? "Save Resume Draft" : "保存简历草稿")}
          </button>

          <button
            onClick={handleExport}
            className="w-full py-4 bg-white border-2 border-indigo-200 text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition-all"
          >
            📥 {locale === "en" ? "Export as Text File" : "导出为文本文件"}
          </button>

          <button
            onClick={handleSyncToProfile}
            className="w-full py-4 bg-white border border-slate-300 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 transition-all"
          >
            🔄 {locale === "en" ? "Sync to Application Profile" : "同步到申请档案"}
            <span className="block text-xs font-normal text-slate-400 mt-0.5">
              {locale === "en"
                ? "Sync project experiences, skill tags, etc. to the EngiMatch application system"
                : "将简历中的项目经历、技能标签等同步到 EngiMatch 申请系统"}
            </span>
          </button>

          <div className="text-center pt-2">
            <Link href="/home" className="text-sm text-slate-400 hover:text-slate-600">
              {t("nav.home")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}