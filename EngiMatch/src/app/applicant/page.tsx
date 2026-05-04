"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";
import {
  AI_RESUME_MAJOR_OPTIONS,
  getAiResumeMajorLabel,
  normalizeAiResumeMajor,
} from "@/lib/ai-resume-majors";

// ─── Auto-fill parser ──────────────────────────────────────────────────────────

type FieldMap = {
  name?: string;
  email?: string;
  university?: string;
  major?: string;
  gpa?: string;
  gpa_scale?: string;
  ielts?: string;
  toefl?: string;
  year?: string;
  tracks?: string;
  modules?: Array<{ name: string; grade: string; credits?: string }>;
};

/**
 * Parse a single-line key:value format:
 *   姓名: 张三
 *   邮箱: zhang@example.com
 *   ...
 */
function parseKeyValue(text: string): Partial<FieldMap> {
  const result: Partial<FieldMap> = {};
  const lines = text.split("\n");

  for (const line of lines) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim().toLowerCase();
    const val = line.slice(idx + 1).trim();

    if (!val) continue;

    switch (key) {
      case "姓名": case "name": case "full_name": case "fullname": result.name = val; break;
      case "邮箱": case "email": case "mail": result.email = val; break;
      case "学校": case "本科院校": case "大学": case "university": case "undergrad_university": result.university = val; break;
      case "专业": case "major": case "undergrad_major": case "本科专业": result.major = val; break;
      case "gpa": case "绩点": case "成绩": result.gpa = val; break;
      case "gpa_scale": case "满分": case "满分制": result.gpa_scale = val; break;
      case "雅思": case "ielts": case "overall": result.ielts = val; break;
      case "托福": case "toefl": result.toefl = val; break;
      case "毕业年份": case "year": case "graduation_year": result.year = val; break;
      case "目标方向": case "tracks": case "track": case "方向": result.tracks = val; break;
    }
  }
  return result;
}

/**
 * Parse multi-line module block:
 *   课程名称1 | A | 3
 *   课程名称2 | 85 | 4
 */
function parseModuleBlock(text: string): Array<{ module_name_raw: string; grade_text: string; credits: string }> {
  const modules: Array<{ module_name_raw: string; grade_text: string; credits: string }> = [];
  const lines = text.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("//")) continue;

    // Split by | or \t, take up to 3 parts
    const parts = trimmed.split(/[|]+/).map((p) => p.trim()).filter(Boolean);
    if (parts.length === 0) continue;

    const module_name_raw = parts[0];
    const grade_text = parts[1] || "";
    const credits = parts[2] || "";

    // Only treat as module if it looks like a course name (not just key:value)
    if (!module_name_raw.includes(":")) {
      modules.push({ module_name_raw, grade_text, credits });
    }
  }
  return modules;
}

/** Detect which section a pasted text belongs to */
function detectSection(text: string): "personal" | "academic" | "modules" | "mixed" | "unknown" {
  const lower = text.toLowerCase();
  const hasAcademic = /gpa|绩点|雅思|ielts|托福|toefl|总分|满分|scale/i.test(text);
  const hasModules = /[|]/.test(text) && !/:/i.test(text.split("\n")[0]);

  const keyCount = (text.match(/[^\n]+:/g) || []).length;
  const lineCount = text.trim().split("\n").length;

  if (hasModules || (keyCount === 0 && lineCount > 2)) return "modules";
  if (hasAcademic) return "academic";
  if (keyCount > 2) return "personal";
  if (keyCount > 0) return "mixed";
  return "unknown";
}

function applyFields(fields: Partial<FieldMap>, form: FormData, modules: Module[], setForm: (fn: (prev: FormData) => FormData) => void, setModules: (fn: (prev: Module[]) => Module[]) => void) {
  if (fields.name) setForm((p) => ({ ...p, full_name: fields.name! }));
  if (fields.email) setForm((p) => ({ ...p, email: fields.email! }));
  if (fields.university) setForm((p) => ({ ...p, undergrad_university: fields.university! }));
  if (fields.major) setForm((p) => ({ ...p, undergrad_major: fields.major! }));
  if (fields.gpa) {
    setForm((p) => {
      let val = fields.gpa!;
      // Remove non-numeric except dot
      val = val.replace(/[^0-9.]/g, "");
      return { ...p, gpa_numeric: val };
    });
  }
  if (fields.gpa_scale) {
    setForm((p) => {
      let val = fields.gpa_scale!.replace(/[^0-9.]/g, "");
      return { ...p, gpa_scale: val };
    });
  }
  if (fields.ielts) {
    const match = fields.ielts!.match(/([0-9.]+)/);
    if (match) setForm((p) => ({ ...p, ielts_overall: match[1] }));
  }
  if (fields.toefl) {
    const match = fields.toefl!.match(/([0-9]+)/);
    if (match) setForm((p) => ({ ...p, toefl_total: match[1] }));
  }
  if (fields.year) setForm((p) => ({ ...p, graduation_year: fields.year!.replace(/\D/g, "") }));
  if (fields.tracks && modules.length === 0) {
    const rawTracks = fields.tracks
      .split(/[,，、;；]+/)
      .map((item) => item.trim())
      .filter(Boolean);
    const matched = AI_RESUME_MAJOR_OPTIONS.filter((option) =>
      rawTracks.some((rawTrack) => {
        const normalized = normalizeAiResumeMajor(rawTrack);
        return (
          normalized === option.value ||
          rawTrack.toLowerCase() === option.en.toLowerCase() ||
          rawTrack === option.zh
        );
      })
    ).map((option) => option.value);
    if (matched.length > 0) setForm((p) => ({ ...p, target_tracks: matched }));
  }
  if (fields.modules && fields.modules.length > 0) {
    setModules((prev) => [...prev, ...fields.modules!.map((m) => ({
      module_name_raw: m.name,
      grade_text: m.grade,
      credits: m.credits || "",
    }))]);
  }
}

// ─── Interfaces & Component ──────────────────────────────────────────────────

interface Module {
  module_name_raw: string;
  grade_text: string;
  credits: string;
}

interface FormData {
  full_name: string;
  email: string;
  nationality: string;
  undergrad_university: string;
  undergrad_major: string;
  gpa_numeric: string;
  gpa_scale: string;
  grading_scheme: string;
  graduation_year: string;
  ielts_overall: string;
  ielts_listening: string;
  ielts_reading: string;
  ielts_writing: string;
  ielts_speaking: string;
  toefl_total: string;
  target_tracks: string[];
}

const inputClass = "w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";
const labelClass = "block text-sm font-medium text-slate-700 mb-1";
const sectionClass = "bg-white rounded-xl border border-slate-200 p-5 mb-4";

function ApplicantPageInner() {
  const { t, locale } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("editId");
  const isEditMode = !!editId;
  const [checkingExistingProfile, setCheckingExistingProfile] = useState(!isEditMode);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [modules, setModules] = useState<Module[]>([]);
  const [newModule, setNewModule] = useState<Module>({ module_name_raw: "", grade_text: "", credits: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [loadingEdit, setLoadingEdit] = useState(isEditMode);
  const [hasDraft, setHasDraft] = useState(false);
  const [form, setForm] = useState<FormData>({
    full_name: "", email: "", nationality: locale === "en" ? "" : "中国",
    undergrad_university: "", undergrad_major: "",
    gpa_numeric: "", gpa_scale: "4.0", grading_scheme: "4.0",
    graduation_year: new Date().getFullYear().toString(),
    ielts_overall: "", ielts_listening: "", ielts_reading: "", ielts_writing: "", ielts_speaking: "",
    toefl_total: "",
    target_tracks: [],
  });

  useEffect(() => {
    if (isEditMode) {
      setCheckingExistingProfile(false);
      return;
    }

    let cancelled = false;

    fetch("/api/auth/session")
      .then((response) => response.json())
      .then((payload) => {
        if (cancelled) return;
        const applicantId = payload?.data?.user?.applicant_id;
        if (payload?.data?.authenticated && applicantId) {
          router.replace(`/applicant?editId=${applicantId}`);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) {
          setCheckingExistingProfile(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isEditMode, router]);

  // ─── Auto-save draft to localStorage ─────────────────────────────────────────
  const DRAFT_KEY = "applicant_draft";

  // Load draft on mount (only for new profile, not edit mode)
  useEffect(() => {
    if (isEditMode) return;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft.form) setForm((prev) => ({ ...prev, ...draft.form }));
        if (draft.modules) setModules(draft.modules);
        if (draft.step) setStep(draft.step);
        setHasDraft(true);
      }
    } catch {
      // ignore corrupt draft
    }
  }, [isEditMode]);

  // Auto-save draft whenever form/modules/step changes
  useEffect(() => {
    if (isEditMode) return;
    const timeout = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, modules, step }));
      } catch {
        // ignore storage errors
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [form, modules, step, isEditMode]);

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setHasDraft(false);
    setStep(1);
    setModules([]);
    setForm({
      full_name: "", email: "", nationality: locale === "en" ? "" : "中国",
      undergrad_university: "", undergrad_major: "",
      gpa_numeric: "", gpa_scale: "4.0", grading_scheme: "4.0",
      graduation_year: new Date().getFullYear().toString(),
      ielts_overall: "", ielts_listening: "", ielts_reading: "", ielts_writing: "", ielts_speaking: "",
      toefl_total: "",
      target_tracks: [],
    });
  };

  // Load existing data in edit mode
  useEffect(() => {
    if (!editId) return;
    fetch(`/api/applicants/${editId}`)
      .then((r) => r.json())
      .then((res) => {
        const data = res.data;
        if (!data) return;
        setForm({
          full_name: data.full_name || "",
          email: data.email || "",
          nationality: data.nationality || (locale === "en" ? "" : "中国"),
          undergrad_university: data.undergrad_university || "",
          undergrad_major: data.undergrad_major || "",
          gpa_numeric: data.gpa_numeric != null ? String(data.gpa_numeric) : "",
          gpa_scale: data.gpa_scale != null ? String(data.gpa_scale) : "4.0",
          grading_scheme: data.grading_scheme || "4.0",
          graduation_year: data.graduation_year != null ? String(data.graduation_year) : new Date().getFullYear().toString(),
          ielts_overall: data.ielts_overall != null ? String(data.ielts_overall) : "",
          ielts_listening: data.ielts_listening != null ? String(data.ielts_listening) : "",
          ielts_reading: data.ielts_reading != null ? String(data.ielts_reading) : "",
          ielts_writing: data.ielts_writing != null ? String(data.ielts_writing) : "",
          ielts_speaking: data.ielts_speaking != null ? String(data.ielts_speaking) : "",
          toefl_total: data.toefl_total != null ? String(data.toefl_total) : "",
          target_tracks: Array.isArray(data.target_tracks) ? data.target_tracks : [],
        });
        if (data.modules) {
          setModules(data.modules.map((m: any) => ({
            module_name_raw: m.module_name_raw || "",
            grade_text: m.grade_text || "",
            credits: m.credits != null ? String(m.credits) : "",
          })));
        }
      })
      .catch(() => setError(locale === "en" ? "Failed to load profile" : "加载档案失败"))
      .finally(() => setLoadingEdit(false));
  }, [editId, locale]);

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const toggleTrack = (track: string) =>
    setForm((prev) => ({
      ...prev,
      target_tracks: prev.target_tracks.includes(track)
        ? prev.target_tracks.filter((t) => t !== track)
        : [...prev.target_tracks, track],
    }));

  const addModule = () => {
    if (!newModule.module_name_raw.trim()) return;
    setModules((prev) => [...prev, { ...newModule }]);
    setNewModule({ module_name_raw: "", grade_text: "", credits: "" });
  };

  const removeModule = (i: number) => setModules((prev) => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    setError("");
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        gpa_numeric: form.gpa_numeric ? parseFloat(form.gpa_numeric) : null,
        gpa_scale: parseFloat(form.gpa_scale),
        graduation_year: form.graduation_year ? parseInt(form.graduation_year) : null,
        ielts_overall: form.ielts_overall ? parseFloat(form.ielts_overall) : null,
        ielts_listening: form.ielts_listening ? parseFloat(form.ielts_listening) : null,
        ielts_reading: form.ielts_reading ? parseFloat(form.ielts_reading) : null,
        ielts_writing: form.ielts_writing ? parseFloat(form.ielts_writing) : null,
        ielts_speaking: form.ielts_speaking ? parseFloat(form.ielts_speaking) : null,
        toefl_total: form.toefl_total ? parseInt(form.toefl_total) : null,
        target_tracks: form.target_tracks,
        modules: modules.map((m) => ({
          module_name_raw: m.module_name_raw,
          grade_text: m.grade_text || null,
          grade_numeric: m.grade_text ? parseFloat(m.grade_text.replace(/[^0-9.]/g, "")) || null : null,
          credits: m.credits ? parseInt(m.credits) : null,
        })),
      };

      let applicantId: string;

      if (isEditMode) {
        const res = await fetch(`/api/applicants/${editId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "更新失败");
        }
        applicantId = editId;
      } else {
        const res = await fetch("/api/applicants", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "创建失败");
        }
        const response = await res.json();
        applicantId = response.data?.id || response.id;
        if (!applicantId) {
          throw new Error("创建失败：未获取到申请者ID");
        }
      }

      // Evaluate all programmes
      const evalRes = await fetch("/api/eligibility/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicantId }),
      });
      if (!evalRes.ok) {
        const evalData = await evalRes.json();
        console.warn("评估运行失败:", evalData.error);
      }

      clearDraft();
      router.push(`/applicant/results?applicantId=${applicantId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "提交失败，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  const STEP_LABELS = [
    locale === "en" ? "Personal Info" : "个人信息",
    locale === "en" ? "Academic Scores" : "学术成绩",
    locale === "en" ? "Course List" : "课程列表",
  ];
  const canNext1 = form.full_name.trim() && form.email.trim() && form.undergrad_university.trim() && form.undergrad_major.trim();

  const [showExample1, setShowExample1] = useState(false);
  const [showExample2, setShowExample2] = useState(false);
  const [showExample3, setShowExample3] = useState(false);
  const [pasteError, setPasteError] = useState("");

  const formatTrackLabel = (track: string) => {
    const primary = getAiResumeMajorLabel(track, locale);
    const secondary = locale === "en" ? getAiResumeMajorLabel(track, "zh") : getAiResumeMajorLabel(track, "en");
    return `${primary} / ${secondary}`;
  };

  const handlePaste = (text: string, section: "personal" | "academic" | "modules") => {
    setPasteError("");
    try {
      if (section === "modules") {
        const parsed = parseModuleBlock(text);
        if (parsed.length > 0) {
          setModules((prev) => [...prev, ...parsed]);
          return;
        }
      }
      const fields = parseKeyValue(text);
      applyFields(fields, form, modules, setForm, setModules);
    } catch {
      setPasteError("粘贴文本格式无法识别，请参考示例格式");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-indigo-600 text-white py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Link href="/applicant/dashboard" className="text-sm text-indigo-200 hover:text-white mb-4 inline-block">← {t("nav.back")}</Link>
          <h1 className="text-3xl font-bold">{isEditMode ? (locale === "en" ? "Edit Profile" : "编辑申请档案") : t("applicant.title")}</h1>
          <p className="text-indigo-200 mt-1">{isEditMode ? (locale === "en" ? "Update your application information" : "更新您的申请信息") : t("applicant.subtitle")}</p>
        </div>
      </div>

      {(loadingEdit || checkingExistingProfile) && (
        <div className="max-w-2xl mx-auto px-4 pt-8 text-center">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-slate-500 text-sm">{locale === "en" ? "Loading profile..." : "正在加载档案..."}</p>
        </div>
      )}

      {!checkingExistingProfile && <div className="max-w-2xl mx-auto px-4 pt-6">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {([1, 2, 3] as const).map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${step >= s ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-500"}`}>
                {s}
              </div>
              <span className={`text-sm hidden sm:inline ${step >= s ? "text-indigo-600 font-medium" : "text-slate-400"}`}>{STEP_LABELS[s - 1]}</span>
              {s < 3 && <div className="w-8 h-px bg-slate-300 ml-1" />}
            </div>
          ))}
        </div>

        {!isEditMode && hasDraft && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
            <span className="text-amber-800 text-sm">
              💾 {locale === "en" ? "Draft auto-saved. Your data will be restored after refresh." : "已自动保存草稿，刷新页面后可恢复已填写的内容。"}
            </span>
            <button
              onClick={clearDraft}
              className="text-xs text-amber-700 hover:text-amber-900 underline ml-2"
            >
              {locale === "en" ? "Clear & Restart" : "清除并重填"}
            </button>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
        )}

        {/* Step 1: Personal */}
        {step === 1 && (
          <div className="space-y-4">
            <div className={sectionClass}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-slate-900">{locale === "en" ? "Personal Information" : "个人信息"}</h2>
                <button
                  onClick={() => setShowExample1(!showExample1)}
                  className="text-xs text-indigo-500 hover:text-indigo-700 underline"
                >
                  {showExample1 ? t("applicant.hide_example") : t("applicant.auto_fill")}
                </button>
              </div>
              {showExample1 && (
                <div className="mb-4 p-3 bg-slate-100 rounded-lg text-xs text-slate-600 font-mono space-y-1">
                  <p className="font-semibold text-slate-700 mb-2">{locale === "en" ? "Example format (copy and paste to any text field):" : "示例格式（复制以下内容粘贴到任意文本框）："}</p>
                  <pre className="whitespace-pre-wrap">{locale === "en"
                    ? `Name: Zhang San
Email: zhangsan@example.com
University: Tongji University
Major: Mechanical Engineering
Graduation Year: 2025
Target Direction: Mechanical, Aerospace`
                    : `姓名: 张三
邮箱: zhangsan@example.com
学校: 同济大学
专业: 机械工程
毕业年份: 2025
目标方向: 机械, 航空航天`}</pre>
                  <textarea
                    placeholder={locale === "en" ? "Paste in the above format..." : "在此粘贴上述格式的文本..."}
                    className="w-full mt-2 px-2 py-1.5 border border-indigo-300 rounded text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    rows={7}
                    onPaste={(e) => {
                      e.preventDefault();
                      const text = e.clipboardData.getData("text");
                      handlePaste(text, "personal");
                      setShowExample1(false);
                    }}
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={labelClass}>{t("applicant.name")}</label>
                  <input className={inputClass} value={form.full_name} onChange={set("full_name")} placeholder={t("applicant.name_placeholder")} />
                </div>
                <div>
                  <label className={labelClass}>{t("applicant.email")}</label>
                  <input className={inputClass} type="email" value={form.email} onChange={set("email")} placeholder={t("applicant.email_placeholder")} />
                </div>
                <div>
                  <label className={labelClass}>{t("applicant.nationality")}</label>
                  <input className={inputClass} value={form.nationality} onChange={set("nationality")} placeholder={t("applicant.nationality_placeholder")} />
                </div>
                <div className="col-span-2">
                  <label className={labelClass}>{t("applicant.university")}</label>
                  <input className={inputClass} value={form.undergrad_university} onChange={set("undergrad_university")} placeholder={t("applicant.university_placeholder")} />
                </div>
                <div>
                  <label className={labelClass}>{t("applicant.major")}</label>
                  <input className={inputClass} value={form.undergrad_major} onChange={set("undergrad_major")} placeholder={t("applicant.major_placeholder")} />
                </div>
                <div>
                  <label className={labelClass}>{t("applicant.graduation_year")}</label>
                  <input className={inputClass} type="number" value={form.graduation_year} onChange={set("graduation_year")} />
                </div>
              </div>
            </div>

            <div className={sectionClass}>
              <h2 className="font-semibold text-slate-900 mb-3">{t("applicant.target_direction")}</h2>
              <p className="text-xs text-slate-500 mb-3">{t("applicant.target_hint")}</p>
              <div className="flex flex-wrap gap-2">
                {AI_RESUME_MAJOR_OPTIONS.map((track) => (
                  <button
                    key={track.value}
                    onClick={() => toggleTrack(track.value)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      form.target_tracks.includes(track.value)
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-slate-600 border-slate-300 hover:border-indigo-400"
                    }`}
                  >
                    {formatTrackLabel(track.value)}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!canNext1}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {t("applicant.next_step")}
            </button>
          </div>
        )}

        {/* Step 2: Academic Scores */}
        {step === 2 && (
          <div className="space-y-4">
            <div className={sectionClass}>
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-semibold text-slate-900">{locale === "en" ? "GPA Score *" : "GPA 成绩 *"}</h2>
                <button
                  onClick={() => setShowExample2(!showExample2)}
                  className="text-xs text-indigo-500 hover:text-indigo-700 underline"
                >
                  {showExample2 ? t("applicant.hide_example") : t("applicant.auto_fill")}
                </button>
              </div>
              {showExample2 && (
                <div className="mb-4 p-3 bg-slate-100 rounded-lg text-xs text-slate-600 font-mono space-y-1">
                  <pre className="whitespace-pre-wrap">{`GPA: 3.5
Scale: 4.0
IELTS: 6.5
TOEFL: 92`}</pre>
                  <textarea
                    placeholder={locale === "en" ? "Paste in the above format..." : "在此粘贴上述格式的文本..."}
                    className="w-full mt-2 px-2 py-1.5 border border-indigo-300 rounded text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    rows={5}
                    onPaste={(e) => {
                      e.preventDefault();
                      const text = e.clipboardData.getData("text");
                      handlePaste(text, "academic");
                      setShowExample2(false);
                    }}
                  />
                </div>
              )}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>{t("applicant.gpa_value")}</label>
                  <input className={inputClass} type="number" step="0.01" value={form.gpa_numeric} onChange={set("gpa_numeric")} placeholder={t("applicant.gpa_value_placeholder")} />
                </div>
                <div>
                  <label className={labelClass}>{t("applicant.gpa_scale")}</label>
                  <input className={inputClass} type="number" value={form.gpa_scale} onChange={set("gpa_scale")} placeholder={t("applicant.gpa_scale_placeholder")} />
                </div>
                <div>
                  <label className={labelClass}>{t("applicant.grading_scheme")}</label>
                  <select className={inputClass} value={form.grading_scheme} onChange={set("grading_scheme")}>
                    <option value="4.0">{t("applicant.scheme_4")}</option>
                    <option value="5.0">{t("applicant.scheme_5")}</option>
                    <option value="percentage">{t("applicant.scheme_percentage")}</option>
                    <option value="other">{t("applicant.scheme_other")}</option>
                  </select>
                </div>
              </div>
            </div>

            <div className={sectionClass}>
              <h2 className="font-semibold text-slate-900 mb-1">{t("applicant.ielts")}</h2>
              <p className="text-xs text-slate-500 mb-4">{t("applicant.ielts_hint")}</p>
              <div className="grid grid-cols-5 gap-3">
                {(["ielts_overall", "ielts_reading", "ielts_listening", "ielts_writing", "ielts_speaking"] as const).map((field, i) => (
                  <div key={field}>
                    <label className={labelClass}>{i === 0 ? t("applicant.total") : [t("applicant.reading"), t("applicant.listening"), t("applicant.writing"), t("applicant.speaking")][i - 1]}</label>
                    <input className={inputClass} type="number" step="0.5" value={form[field]} onChange={set(field)} />
                  </div>
                ))}
              </div>
            </div>

            <div className={sectionClass}>
              <h2 className="font-semibold text-slate-900 mb-1">{t("applicant.toefl")}</h2>
              <p className="text-xs text-slate-500 mb-4">{t("applicant.toefl_hint")}</p>
              <div>
                <label className={labelClass}>{t("applicant.toefl_total")}</label>
                <input className={inputClass} type="number" value={form.toefl_total} onChange={set("toefl_total")} placeholder={t("applicant.toefl_placeholder")} />
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 py-3 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-100 transition-colors">{t("applicant.prev_step")}</button>
              <button
                onClick={() => setStep(3)}
                disabled={!form.gpa_numeric}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {t("applicant.next_modules")}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Modules */}
        {step === 3 && (
          <div className="space-y-4">
            <div className={sectionClass}>
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-semibold text-slate-900">{t("applicant.modules_title")}</h2>
                <button
                  onClick={() => setShowExample3(!showExample3)}
                  className="text-xs text-indigo-500 hover:text-indigo-700 underline"
                >
                  {showExample3 ? t("applicant.hide_example") : t("applicant.bulk_add")}
                </button>
              </div>
              <p className="text-xs text-slate-500 mb-4">{t("applicant.modules_hint")}</p>

              {modules.length > 0 && (
                <div className="mb-4 space-y-2">
                  {modules.map((m, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm bg-slate-50 rounded-lg px-3 py-2">
                      <span className="flex-1 font-medium text-slate-800">{m.module_name_raw}</span>
                      {m.grade_text && <span className="text-slate-500">{locale === "en" ? "Grade: " : "成绩: "}{m.grade_text}</span>}
                      {m.credits && <span className="text-slate-400">{m.credits}{locale === "en" ? " credits" : "学分"}</span>}
                      <button onClick={() => removeModule(i)} className="text-red-400 hover:text-red-600 ml-2 text-lg leading-none">×</button>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 mb-2">
                <input className={inputClass} placeholder={t("applicant.course_name")} value={newModule.module_name_raw} onChange={(e) => setNewModule((p) => ({ ...p, module_name_raw: e.target.value }))} />
                <input className={inputClass} placeholder={t("applicant.grade")} value={newModule.grade_text} onChange={(e) => setNewModule((p) => ({ ...p, grade_text: e.target.value }))} />
                <input className={inputClass} placeholder={t("applicant.credits")} value={newModule.credits} onChange={(e) => setNewModule((p) => ({ ...p, credits: e.target.value }))} />
              </div>
              <button onClick={addModule} className="w-full py-2 border-2 border-dashed border-slate-300 rounded-lg text-sm text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors">
                {t("applicant.add_course")}
              </button>

              {/* Bulk paste area */}
              {showExample3 && (
                <div className="mt-3 p-3 bg-slate-100 rounded-lg text-xs text-slate-600 font-mono">
                  <p className="mb-1 font-medium text-slate-700">{locale === "en"
                    ? "Bulk add courses (one per line, use | to separate name, grade, credits):"
                    : "批量添加课程（每行一门，用 | 分隔课程名、成绩、学分）："}</p>
                  <pre className="whitespace-pre-wrap mb-2">{locale === "en"
                    ? `Engineering Mechanics | A | 4
Thermodynamics | B+ | 3
Circuit Principles | 85 | 3
Mechanical Design | A- | 4
Materials Mechanics | 90 | 3`
                    : `工程力学 | A | 4
热力学与传热学 | B+ | 3
电路原理 | 85 | 3
机械设计基础 | A- | 4
材料力学 | 90 | 3`}</pre>
                  <textarea
                    placeholder={locale === "en" ? "Paste course list in the above format..." : "粘贴上述格式的课程列表..."}
                    className="w-full px-2 py-1.5 border border-indigo-300 rounded text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    rows={6}
                    onPaste={(e) => {
                      e.preventDefault();
                      const text = e.clipboardData.getData("text");
                      handlePaste(text, "modules");
                      setShowExample3(false);
                    }}
                  />
                </div>
              )}
            </div>
            {pasteError && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">{pasteError}</div>
            )}

            <div className={sectionClass}>
              <h3 className="font-semibold text-slate-900 mb-2">{t("applicant.confirm_title")}</h3>
              <div className="text-sm text-slate-600 space-y-1">
                <p><span className="font-medium">{form.full_name}</span> · {form.undergrad_university} · {form.undergrad_major}</p>
                <p>GPA: {form.gpa_numeric}/{form.gpa_scale} · {locale === "en" ? "Target: " : "目标方向: "} {form.target_tracks.join(", ") || (locale === "en" ? "All" : "全部")}</p>
                {form.ielts_overall && <p>IELTS: {form.ielts_overall}</p>}
                <p>{t("applicant.confirmed").replace("{count}", modules.length.toString())}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 py-3 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-100 transition-colors">{t("applicant.prev_step")}</button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-60 transition-colors"
              >
                {submitting ? t("applicant.submitting") : isEditMode ? (locale === "en" ? "Update & Evaluate" : "更新并评估") : t("applicant.submit")}
              </button>
            </div>
          </div>
        )}
      </div>}
    </div>
  );
}

export default function ApplicantPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ApplicantPageInner />
    </Suspense>
  );
}
