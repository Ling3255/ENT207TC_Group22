"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

const TRACK_OPTIONS = [
  "机械 / Mechanical",
  "航空航天 / Aerospace",
  "能源 / Energy",
  "电气 / Electrical",
  "电力 / Power",
  "控制 / Control",
  "机器人 / Robotics",
];

const inputClass = "w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";
const labelClass = "block text-sm font-medium text-slate-700 mb-1";
const sectionClass = "bg-white rounded-xl border border-slate-200 p-5 mb-4";

export default function ApplicantPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [modules, setModules] = useState<Module[]>([]);
  const [newModule, setNewModule] = useState<Module>({ module_name_raw: "", grade_text: "", credits: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<FormData>({
    full_name: "", email: "", nationality: "中国",
    undergrad_university: "", undergrad_major: "",
    gpa_numeric: "", gpa_scale: "4.0", grading_scheme: "4.0",
    graduation_year: new Date().getFullYear().toString(),
    ielts_overall: "", ielts_listening: "", ielts_reading: "", ielts_writing: "", ielts_speaking: "",
    toefl_total: "",
    target_tracks: [],
  });

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
      const res = await fetch("/api/applicants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "创建失败");
      }

      const applicant = await res.json();

      // Evaluate all programmes
      await fetch("/api/eligibility/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicantId: applicant.id }),
      });

      router.push(`/applicant/results?applicantId=${applicant.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "提交失败，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  const STEP_LABELS = ["个人信息", "学术成绩", "课程列表"];
  const canNext1 = form.full_name.trim() && form.email.trim() && form.undergrad_university.trim() && form.undergrad_major.trim();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-indigo-600 text-white py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Link href="/" className="text-sm text-indigo-200 hover:text-white mb-4 inline-block">← 返回首页</Link>
          <h1 className="text-3xl font-bold">创建申请档案</h1>
          <p className="text-indigo-200 mt-1">录入你的学术背景，获取英国工程硕士项目匹配结果</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-6">
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

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
        )}

        {/* Step 1: Personal */}
        {step === 1 && (
          <div className="space-y-4">
            <div className={sectionClass}>
              <h2 className="font-semibold text-slate-900 mb-4">个人信息</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={labelClass}>姓名 *</label>
                  <input className={inputClass} value={form.full_name} onChange={set("full_name")} placeholder="你的真实姓名" />
                </div>
                <div>
                  <label className={labelClass}>邮箱 *</label>
                  <input className={inputClass} type="email" value={form.email} onChange={set("email")} placeholder="用于查看结果" />
                </div>
                <div>
                  <label className={labelClass}>国籍</label>
                  <input className={inputClass} value={form.nationality} onChange={set("nationality")} placeholder="如：中国" />
                </div>
                <div className="col-span-2">
                  <label className={labelClass}>本科院校 *</label>
                  <input className={inputClass} value={form.undergrad_university} onChange={set("undergrad_university")} placeholder="如：同济大学" />
                </div>
                <div>
                  <label className={labelClass}>本科专业 *</label>
                  <input className={inputClass} value={form.undergrad_major} onChange={set("undergrad_major")} placeholder="如：机械工程" />
                </div>
                <div>
                  <label className={labelClass}>预计毕业年份</label>
                  <input className={inputClass} type="number" value={form.graduation_year} onChange={set("graduation_year")} />
                </div>
              </div>
            </div>

            <div className={sectionClass}>
              <h2 className="font-semibold text-slate-900 mb-3">目标申请方向</h2>
              <p className="text-xs text-slate-500 mb-3">可多选，帮助我们筛选最相关的项目</p>
              <div className="flex flex-wrap gap-2">
                {TRACK_OPTIONS.map((track) => (
                  <button
                    key={track}
                    onClick={() => toggleTrack(track)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      form.target_tracks.includes(track)
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-slate-600 border-slate-300 hover:border-indigo-400"
                    }`}
                  >
                    {track}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!canNext1}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              下一步：学术成绩 →
            </button>
          </div>
        )}

        {/* Step 2: Academic Scores */}
        {step === 2 && (
          <div className="space-y-4">
            <div className={sectionClass}>
              <h2 className="font-semibold text-slate-900 mb-4">GPA 成绩 *</h2>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>GPA 数值</label>
                  <input className={inputClass} type="number" step="0.01" value={form.gpa_numeric} onChange={set("gpa_numeric")} placeholder="如：3.5" />
                </div>
                <div>
                  <label className={labelClass}>满分制</label>
                  <input className={inputClass} type="number" value={form.gpa_scale} onChange={set("gpa_scale")} placeholder="如：4.0" />
                </div>
                <div>
                  <label className={labelClass}>成绩制度</label>
                  <select className={inputClass} value={form.grading_scheme} onChange={set("grading_scheme")}>
                    <option value="4.0">4.0制</option>
                    <option value="5.0">5.0制</option>
                    <option value="percentage">百分制</option>
                    <option value="other">其他</option>
                  </select>
                </div>
              </div>
            </div>

            <div className={sectionClass}>
              <h2 className="font-semibold text-slate-900 mb-1">雅思成绩 (IELTS)</h2>
              <p className="text-xs text-slate-500 mb-4">如有雅思成绩请填写，否则留空</p>
              <div className="grid grid-cols-5 gap-3">
                {(["ielts_overall", "ielts_reading", "ielts_listening", "ielts_writing", "ielts_speaking"] as const).map((field, i) => (
                  <div key={field}>
                    <label className={labelClass}>{i === 0 ? "总分" : ["阅读", "听力", "写作", "口语"][i - 1]}</label>
                    <input className={inputClass} type="number" step="0.5" value={form[field]} onChange={set(field)} />
                  </div>
                ))}
              </div>
            </div>

            <div className={sectionClass}>
              <h2 className="font-semibold text-slate-900 mb-1">托福成绩 (TOEFL)</h2>
              <p className="text-xs text-slate-500 mb-4">如无雅思，填写托福成绩</p>
              <div>
                <label className={labelClass}>总分</label>
                <input className={inputClass} type="number" value={form.toefl_total} onChange={set("toefl_total")} placeholder="如：92" />
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 py-3 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-100 transition-colors">← 上一步</button>
              <button
                onClick={() => setStep(3)}
                disabled={!form.gpa_numeric}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                下一步：课程列表 →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Modules */}
        {step === 3 && (
          <div className="space-y-4">
            <div className={sectionClass}>
              <h2 className="font-semibold text-slate-900 mb-1">本科课程列表</h2>
              <p className="text-xs text-slate-500 mb-4">添加你学过的主要课程（含必修课、专业课），系统将据此评估先修要求匹配度</p>

              {modules.length > 0 && (
                <div className="mb-4 space-y-2">
                  {modules.map((m, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm bg-slate-50 rounded-lg px-3 py-2">
                      <span className="flex-1 font-medium text-slate-800">{m.module_name_raw}</span>
                      {m.grade_text && <span className="text-slate-500">成绩: {m.grade_text}</span>}
                      {m.credits && <span className="text-slate-400">{m.credits}学分</span>}
                      <button onClick={() => removeModule(i)} className="text-red-400 hover:text-red-600 ml-2 text-lg leading-none">×</button>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 mb-2">
                <input className={inputClass} placeholder="课程名称 *" value={newModule.module_name_raw} onChange={(e) => setNewModule((p) => ({ ...p, module_name_raw: e.target.value }))} />
                <input className={inputClass} placeholder="成绩 (如 A / 85)" value={newModule.grade_text} onChange={(e) => setNewModule((p) => ({ ...p, grade_text: e.target.value }))} />
                <input className={inputClass} placeholder="学分 (选填)" value={newModule.credits} onChange={(e) => setNewModule((p) => ({ ...p, credits: e.target.value }))} />
              </div>
              <button onClick={addModule} className="w-full py-2 border-2 border-dashed border-slate-300 rounded-lg text-sm text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors">
                + 添加课程
              </button>
            </div>

            <div className={sectionClass}>
              <h3 className="font-semibold text-slate-900 mb-2">档案确认</h3>
              <div className="text-sm text-slate-600 space-y-1">
                <p><span className="font-medium">{form.full_name}</span> · {form.undergrad_university} · {form.undergrad_major}</p>
                <p>GPA: {form.gpa_numeric}/{form.gpa_scale} · 目标方向: {form.target_tracks.join("、") || "全部"}</p>
                {form.ielts_overall && <p>雅思: {form.ielts_overall}</p>}
                <p>已添加 {modules.length} 门课程</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 py-3 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-100 transition-colors">← 上一步</button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-60 transition-colors"
              >
                {submitting ? "提交评估中..." : "提交评估 →"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}