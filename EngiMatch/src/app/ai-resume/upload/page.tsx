"use client";

import { Suspense, useState, useRef } from "react";
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

function AIRResumeUploadPageContent() {
  const { t, locale } = useLocale();
  const router = useRouter();
  const params = useSearchParams();
  const major = params.get("major") || "";
  const stage = params.get("stage") || "";
  const majorInfo = MAJOR_LABELS[major] || { zh: major, en: major };
  const majorLabel = locale === "en" ? majorInfo.en : majorInfo.zh;

  const [mode, setMode] = useState<"paste" | "upload">("paste");
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const canContinue = text.trim().length > 100;

  const handlePaste = () => {
    navigator.clipboard.readText().then((clip) => {
      setText(clip || "");
    }).catch(() => {});
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");

    const allowedExtensions = [".pdf", ".docx", ".doc", ".txt"];
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!allowedExtensions.includes(ext) && !["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/msword", "text/plain"].includes(file.type)) {
      setError(locale === "en" ? "Only PDF, Word (.doc/.docx) or plain text files supported" : "仅支持 PDF、Word (.doc/.docx) 或纯文本文件");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/ai-resume/extract", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok || data.error) {
        if (file.type === "text/plain" || file.name.endsWith(".txt")) {
          const reader = new FileReader();
          reader.onload = () => {
            const txt = reader.result as string;
            if (txt.trim().length > 10) {
              setText(txt);
              setUploading(false);
            } else {
              setError(locale === "en" ? "File content is empty or too short, please use paste mode" : "文件内容为空或过短，请使用粘贴模式");
              setUploading(false);
            }
          };
          reader.readAsText(file);
          return;
        }
        setError(data.error || (locale === "en" ? "File parsing failed, please use paste mode" : "文件解析失败，请改用粘贴模式"));
        setUploading(false);
        return;
      }

      if (!data.text || data.text.trim().length < 10) {
        setError(locale === "en" ? "Could not extract enough text from file, please use paste mode" : "未能从文件中提取到足够文字内容，请使用粘贴模式");
        setUploading(false);
        return;
      }

      const stored = JSON.stringify({ major, stage, rawText: data.text });
      sessionStorage.setItem("ai_resume_text", stored);
      router.push(`/ai-resume/review?major=${major}&stage=${stage}`);
    } catch (err) {
      if (file.type === "text/plain" || file.name.endsWith(".txt")) {
        const reader = new FileReader();
        reader.onload = () => {
          const txt = reader.result as string;
          if (txt.trim().length > 10) {
            setText(txt);
            setUploading(false);
          } else {
            setError(locale === "en" ? "File content is empty, please use paste mode" : "文件内容为空，请使用粘贴模式");
            setUploading(false);
          }
        };
        reader.readAsText(file);
        return;
      }
      setError(locale === "en" ? "File parsing error, please use paste mode" : "文件解析出错，请使用粘贴模式");
      setUploading(false);
    }
  };

  const handleContinue = () => {
    if (!canContinue) return;
    const stored = JSON.stringify({ major, stage, rawText: text });
    if (typeof window !== "undefined") {
      sessionStorage.setItem("ai_resume_text", stored);
    }
    router.push(`/ai-resume/review?major=${major}&stage=${stage}`);
  };

  const placeholderText = locale === "en"
    ? `Paste your resume content, for example:

Name
Email / Phone

Education
- BSc Mechanical Engineering, XX University, 2021–2025, GPA 3.5/4.0
- Relevant courses: Engineering Mechanics, Thermodynamics, Control Theory

Projects
- XX Project: Used MATLAB/Simulink for system modeling and simulation, completed controller design...

Skills
Python, MATLAB, AutoCAD, C++`
    : `粘贴你的简历内容，例如：

姓名 / Name
邮箱 / 电话

教育背景 Education
- BSc Mechanical Engineering, XX University, 2021–2025, GPA 3.5/4.0
- 相关课程：工程力学、热力学、控制理论

项目经历 Projects
- XX项目：使用 MATLAB/Simulink 进行系统建模与仿真，完成了控制器设计...

技能 Skills
Python, MATLAB, AutoCAD, C++`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/ai-resume" className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1">← {t("nav.backTo")}</Link>
          <div className="text-sm font-medium text-slate-700">{t("ai.title")}</div>
          <div className="w-24" />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Step indicator */}
        <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-2">
          {STEPS.map((step, i) => {
            const active = step.id === "upload";
            const done = ["usecase"].includes(step.id);
            return (
              <div key={step.id} className="flex items-center gap-1 flex-shrink-0">
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${done ? "bg-green-100 text-green-600" : active ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"}`}>
                  {done ? <span>✓</span> : <span className="font-bold">{i + 1}</span>}
                  <span>{t(step.labelKey)}</span>
                </div>
                {i < STEPS.length - 1 && <div className="w-4 h-px bg-slate-200" />}
              </div>
            );
          })}
        </div>

        {/* Context banner */}
        <div className="mb-6 p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-3">
          <div className="text-lg">🎯</div>
          <div>
            <div className="text-sm font-medium text-indigo-800">
              {locale === "en" ? "Direction: UK Taught Master's · " : "申请方向：英国授课型硕士 · "}{majorLabel}
            </div>
            <div className="text-xs text-indigo-500 mt-0.5">
              {locale === "en" ? "Resume will be evaluated and optimized for this direction" : "简历将针对此方向进行评估和优化"}
            </div>
          </div>
          <Link href="/ai-resume" className="ml-auto text-xs text-indigo-500 hover:underline">{locale === "en" ? "Edit →" : "修改 →"}</Link>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-2 mb-4">
          <button onClick={() => setMode("paste")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${mode === "paste" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"}`}>
            {t("upload.paste_mode")}
          </button>
          <button onClick={() => setMode("upload")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${mode === "upload" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"}`}>
            {t("upload.upload_mode")}
          </button>
        </div>

        {mode === "paste" ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-800">{t("upload.paste_content")}</div>
                <div className="text-xs text-slate-400 mt-0.5">{t("upload.paste_hint")}</div>
              </div>
              <button onClick={handlePaste} className="text-xs text-indigo-500 hover:underline">{t("upload.paste_clipboard")}</button>
            </div>
            <textarea
              className="w-full px-4 py-3 text-sm font-mono text-slate-700 focus:outline-none resize-none rounded-b-2xl"
              rows={20}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={placeholderText}
            />
            {text.trim().length > 0 && (
              <div className="px-4 py-2 border-t border-slate-100 text-xs text-slate-400">
                {t("upload.characters").replace("{count}", text.trim().length.toString())} {text.trim().length < 100 ? t("upload.too_short") : ""}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
            <input ref={fileRef} type="file" accept=".pdf,.docx,.doc,.txt" className="hidden" onChange={handleFileChange} />
            {uploading ? (
              <div className="py-8">
                <div className="text-4xl mb-3 animate-pulse">⏳</div>
                <div className="text-slate-600 text-sm">{t("upload.extracting")}</div>
              </div>
            ) : (
              <>
                <div className="text-5xl mb-4">📂</div>
                <div className="font-semibold text-slate-700 mb-1">{t("upload.upload_file")}</div>
                <div className="text-sm text-slate-400 mb-6">{t("upload.supported")}</div>
                <button onClick={() => fileRef.current?.click()}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors">
                  {t("upload.select_file")}
                </button>
                <div className="mt-4 text-xs text-slate-400">
                  {t("upload.note")}
                </div>
              </>
            )}
            {error && <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}
          </div>
        )}

        {error && mode === "paste" && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
        )}

        <div className="mt-6 flex gap-3">
          <Link href="/ai-resume" className="flex-1 py-4 text-center border border-slate-300 text-slate-600 rounded-xl font-semibold hover:bg-slate-50">
            ← {t("nav.back")}
          </Link>
          <button
            onClick={handleContinue}
            disabled={!canContinue}
            className="flex-[2] py-4 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {canContinue
              ? t("upload.continue")
              : (locale === "en"
                ? `Need ${100 - text.trim().length} more characters`
                : `还需 ${100 - text.trim().length} 字`)
            }
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AIRResumeUploadPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-400 text-sm" />}>
      <AIRResumeUploadPageContent />
    </Suspense>
  );
}
