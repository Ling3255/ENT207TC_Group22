"use client";

import { Suspense, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "@/context/LocaleContext";
import { getAiResumeMajorLabel, normalizeAiResumeMajor } from "@/modules/ai/taxonomy/majors";

const STEPS = [
  { id: "usecase", labelKey: "ai.step.usecase" },
  { id: "upload", labelKey: "ai.step.upload" },
  { id: "review", labelKey: "ai.step.review" },
  { id: "diagnose", labelKey: "ai.step.diagnose" },
  { id: "optimize", labelKey: "ai.step.optimize" },
  { id: "final", labelKey: "ai.step.final" },
];

function AIRResumeUploadPageInner() {
  const { t, locale } = useLocale();
  const router = useRouter();
  const params = useSearchParams();
  const major = normalizeAiResumeMajor(params.get("major") || "");
  const stage = params.get("stage") || "";
  const majorLabel = getAiResumeMajorLabel(major, locale);

  const [mode, setMode] = useState<"paste" | "upload">("paste");
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const canContinue = text.trim().length > 100;

  const handlePaste = () => {
    navigator.clipboard
      .readText()
      .then((clipboardText) => setText(clipboardText || ""))
      .catch(() => {});
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");

    const allowedExtensions = [".pdf", ".docx", ".doc", ".txt"];
    const extension = `.${file.name.split(".").pop()?.toLowerCase() ?? ""}`;
    const allowedMimeTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "text/plain",
    ];

    if (!allowedExtensions.includes(extension) && !allowedMimeTypes.includes(file.type)) {
      setError(
        locale === "en"
          ? "Only PDF, Word (.doc/.docx), or plain text files are supported."
          : "仅支持 PDF、Word（.doc/.docx）或纯文本文件。"
      );
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/ai-resume/extract", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok || data.error) {
        if (file.type === "text/plain" || file.name.endsWith(".txt")) {
          const reader = new FileReader();
          reader.onload = () => {
            const plainText = reader.result as string;
            if (plainText.trim().length > 10) {
              setText(plainText);
            } else {
              setError(locale === "en" ? "The file content is empty or too short." : "文件内容为空或过短。");
            }
            setUploading(false);
          };
          reader.readAsText(file);
          return;
        }

        setError(
          data.error ||
            (locale === "en" ? "File parsing failed. Please switch to paste mode." : "文件解析失败，请改用粘贴模式。")
        );
        setUploading(false);
        return;
      }

      if (!data.text || data.text.trim().length < 10) {
        setError(
          locale === "en"
            ? "Could not extract enough text from the file. Please switch to paste mode."
            : "未能从文件中提取足够文本，请改用粘贴模式。"
        );
        setUploading(false);
        return;
      }

      sessionStorage.setItem(
        "ai_resume_text",
        JSON.stringify({
          major,
          stage,
          rawText: data.text,
        })
      );
      router.push(`/ai-resume/review?major=${major}&stage=${stage}`);
    } catch {
      if (file.type === "text/plain" || file.name.endsWith(".txt")) {
        const reader = new FileReader();
        reader.onload = () => {
          const plainText = reader.result as string;
          if (plainText.trim().length > 10) {
            setText(plainText);
          } else {
            setError(locale === "en" ? "The file content is empty." : "文件内容为空。");
          }
          setUploading(false);
        };
        reader.readAsText(file);
        return;
      }

      setError(locale === "en" ? "File parsing error. Please switch to paste mode." : "文件解析出错，请改用粘贴模式。");
    } finally {
      setUploading(false);
    }
  };

  const handleContinue = () => {
    if (!canContinue) return;
    sessionStorage.setItem(
      "ai_resume_text",
      JSON.stringify({
        major,
        stage,
        rawText: text,
      })
    );
    router.push(`/ai-resume/review?major=${major}&stage=${stage}`);
  };

  const placeholderText =
    locale === "en"
      ? `Paste your resume content, for example:

Name
Email / Phone

Education
- BSc Mechanical Engineering, XX University, 2021-2025, GPA 3.5/4.0
- Relevant courses: Engineering Mechanics, Thermodynamics, Control Theory

Projects
- XX Project: Used MATLAB/Simulink for system modeling and simulation, completed controller design...

Skills
Python, MATLAB, AutoCAD, C++`
      : `请粘贴你的简历内容，例如：

姓名 / Name
邮箱 / 电话

教育背景 Education
- BSc Mechanical Engineering, XX University, 2021-2025, GPA 3.5/4.0
- 相关课程：工程力学、热力学、控制理论

项目经历 Projects
- XX项目：使用 MATLAB/Simulink 进行系统建模与仿真，完成控制器设计...

技能 Skills
Python, MATLAB, AutoCAD, C++`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link href="/ai-resume" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
            ← {t("nav.backTo")}
          </Link>
          <div className="text-sm font-medium text-slate-700">{t("ai.title")}</div>
          <div className="w-24" />
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-8 flex items-center gap-1 overflow-x-auto pb-2">
          {STEPS.map((step, i) => {
            const active = step.id === "upload";
            const done = step.id === "usecase";
            return (
              <div key={step.id} className="flex flex-shrink-0 items-center gap-1">
                <div
                  className={`flex items-center gap-1.5 rounded-full px-2 py-1 text-xs ${
                    done ? "bg-green-100 text-green-600" : active ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {done ? <span>✓</span> : <span className="font-bold">{i + 1}</span>}
                  <span>{t(step.labelKey)}</span>
                </div>
                {i < STEPS.length - 1 && <div className="h-px w-4 bg-slate-200" />}
              </div>
            );
          })}
        </div>

        <div className="mb-6 flex items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50 p-3">
          <div className="text-lg">🎓</div>
          <div>
            <div className="text-sm font-medium text-indigo-800">
              {locale === "en" ? "Direction: UK Taught Master's · " : "申请方向：英国授课型硕士 · "}
              {majorLabel}
            </div>
            <div className="mt-0.5 text-xs text-indigo-500">
              {locale === "en"
                ? "Your resume will be analyzed and optimized for this direction."
                : "系统会围绕这个专业方向分析并优化你的简历。"}
            </div>
          </div>
          <Link href="/ai-resume" className="ml-auto text-xs text-indigo-500 hover:underline">
            {locale === "en" ? "Edit →" : "修改 →"}
          </Link>
        </div>

        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setMode("paste")}
            className={`flex-1 rounded-xl border py-2.5 text-sm font-medium transition-all ${
              mode === "paste"
                ? "border-indigo-600 bg-indigo-600 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300"
            }`}
          >
            {t("upload.paste_mode")}
          </button>
          <button
            onClick={() => setMode("upload")}
            className={`flex-1 rounded-xl border py-2.5 text-sm font-medium transition-all ${
              mode === "upload"
                ? "border-indigo-600 bg-indigo-600 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300"
            }`}
          >
            {t("upload.upload_mode")}
          </button>
        </div>

        {mode === "paste" ? (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 p-4">
              <div>
                <div className="font-semibold text-slate-800">{t("upload.paste_content")}</div>
                <div className="mt-0.5 text-xs text-slate-400">{t("upload.paste_hint")}</div>
              </div>
              <button onClick={handlePaste} className="text-xs text-indigo-500 hover:underline">
                {t("upload.paste_clipboard")}
              </button>
            </div>
            <textarea
              className="w-full resize-none rounded-b-2xl px-4 py-3 font-mono text-sm text-slate-700 focus:outline-none"
              rows={20}
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={placeholderText}
            />
            {text.trim().length > 0 && (
              <div className="border-t border-slate-100 px-4 py-2 text-xs text-slate-400">
                {t("upload.characters").replace("{count}", text.trim().length.toString())}{" "}
                {text.trim().length < 100 ? t("upload.too_short") : ""}
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.docx,.doc,.txt"
              className="hidden"
              onChange={handleFileChange}
            />
            {uploading ? (
              <div className="py-8">
                <div className="mb-3 animate-pulse text-4xl">⏳</div>
                <div className="text-sm text-slate-600">{t("upload.extracting")}</div>
              </div>
            ) : (
              <>
                <div className="mb-4 text-5xl">📄</div>
                <div className="mb-1 font-semibold text-slate-700">{t("upload.upload_file")}</div>
                <div className="mb-6 text-sm text-slate-400">{t("upload.supported")}</div>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                >
                  {t("upload.select_file")}
                </button>
                <div className="mt-4 text-xs text-slate-400">{t("upload.note")}</div>
              </>
            )}
            {error && <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>}
          </div>
        )}

        {error && mode === "paste" && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}

        <div className="mt-6 flex gap-3">
          <Link href="/ai-resume" className="flex-1 rounded-xl border border-slate-300 py-4 text-center font-semibold text-slate-600 hover:bg-slate-50">
            ← {t("nav.back")}
          </Link>
          <button
            onClick={handleContinue}
            disabled={!canContinue}
            className="flex-[2] rounded-xl bg-indigo-600 py-4 font-semibold text-white transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {canContinue
              ? t("upload.continue")
              : locale === "en"
                ? `Need ${Math.max(0, 100 - text.trim().length)} more characters`
                : `还需要 ${Math.max(0, 100 - text.trim().length)} 个字符`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AIRResumeUploadPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AIRResumeUploadPageInner />
    </Suspense>
  );
}
