"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CANONICAL_MAJORS, CANONICAL_MODULES } from "@/lib/taxonomy";

// ─── Auto-fill parser ──────────────────────────────────────────────────────────

type KeyValueMap = Record<string, string>;
type StrList = string[];

/** Parse key:value or key = value lines */
function parseKeyValue(text: string): KeyValueMap {
  const result: KeyValueMap = {};
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("//")) continue;
    const idx = trimmed.search(/[:=]/);
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim().toLowerCase().replace(/\s+/g, "_");
    const val = trimmed.slice(idx + 1).trim();
    if (val) result[key] = val;
  }
  return result;
}

/** Parse module lines: "Module Name | Display Text | Min Grade | Required" */
function parseModuleLines(text: string): Array<{ canonical_module_name: string; display_text: string; min_grade_rule: string; required: boolean }> {
  const modules: Array<{ canonical_module_name: string; display_text: string; min_grade_rule: string; required: boolean }> = [];
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("//")) continue;
    // skip lines that look like key:value
    if (/^[^\|]+:[^\|]+$/.test(trimmed)) continue;
    const parts = trimmed.split(/[|]+/).map((p) => p.trim());
    if (parts.length === 0 || !parts[0]) continue;

    const canonical = parts[0];
    const display_text = parts[1] || "";
    const min_grade_rule = parts[2] || "";
    const required = parts[3] ? !["0", "false", "no", "optional"].includes(parts[3].toLowerCase()) : true;

    // fuzzy-match canonical module name
    const matched = CANONICAL_MODULES.find((m) =>
      m.toLowerCase() === canonical.toLowerCase() ||
      m.toLowerCase().replace(/_/g, " ") === canonical.toLowerCase()
    );

    modules.push({
      canonical_module_name: matched || canonical,
      display_text,
      min_grade_rule,
      required,
    });
  }
  return modules;
}

// ─── Interfaces ───────────────────────────────────────────────────────────────
interface University {
  id: string;
  name: string;
  rank: number | null;
}

interface PreModule {
  canonical_module_name: string;
  display_text: string;
  min_grade_rule: string;
  required: boolean;
}

const inputClass = "w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";
const labelClass = "block text-sm font-medium text-slate-700 mb-1";
const sectionClass = "bg-white rounded-xl border border-slate-200 p-5 mb-4";

export default function NewProgrammePage() {
  const router = useRouter();
  const [universities, setUniversities] = useState<University[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"basic" | "academic" | "language" | "documents" | "compliance" | "prereqs" | "source">("basic");

  const [form, setForm] = useState({
    university_id: "", programme_name: "", slug: "", degree_type: "MSc",
    department: "", study_mode: "full-time", duration_text: "1 year",
    intake_term: "", application_system_type: "university_portal",
    application_deadline_visa: "", application_deadline_non_visa: "",
    tuition_fee_overseas_gbp: "", official_url: "",
  });

  const [academicReq, setAcademicReq] = useState({
    min_degree_level: "bachelor",
    min_uk_classification: "",
    accepted_backgrounds: [] as string[],
    disallowed_backgrounds: [] as string[],
    prerequisite_module_logic: "ALL",
    work_experience_considered: false,
    interview_possible: false,
    cv_required: false,
    portfolio_required: false,
  });

  const [langReq, setLangReq] = useState({
    english_requirement_level: "",
    ielts_overall: "",
    ielts_lrw_min: "",
    toefl_total: "",
    pte_total: "",
    duolingo_total: "",
    validity_window_months: "24",
  });

  const [docs, setDocs] = useState({
    transcript_required: true,
    personal_statement_required: true,
    references_required_count: "",
    reference_type_academic_min: "2",
    cv_resume_required: false,
    additional_documents: [] as string[],
  });

  const [compliance, setCompliance] = useState({
    atas_possible: false,
    atas_rule_text: "",
    graduate_route_note: "",
    visa_deadline_note: "",
  });

  const [prereqModules, setPrereqModules] = useState<PreModule[]>([]);
  const [rawRequirementText, setRawRequirementText] = useState("");
  const [showPasteBasic, setShowPasteBasic] = useState(false);
  const [showPasteAcademic, setShowPasteAcademic] = useState(false);
  const [showPasteLang, setShowPasteLang] = useState(false);
  const [showPastePrereq, setShowPastePrereq] = useState(false);
  const [pasteError, setPasteError] = useState("");

  useEffect(() => {
    fetch("/api/universities").then((r) => r.json()).then(setUniversities);
  }, []);

  const setField = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [field]: e.target.value }));

  const addPrereq = () => {
    setPrereqModules((p) => [...p, { canonical_module_name: "", display_text: "", min_grade_rule: "", required: true }]);
  };

  const updatePrereq = (i: number, field: keyof PreModule) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setPrereqModules((p) => p.map((m, idx) => idx === i ? { ...m, [field]: e.target.value } : m));
  };

  const removePrereq = (i: number) => setPrereqModules((p) => p.filter((_, idx) => idx !== i));

  const handlePaste = (text: string, target: "basic" | "academic" | "language" | "prereqs") => {
    setPasteError("");
    try {
      if (target === "prereqs") {
        const parsed = parseModuleLines(text);
        if (parsed.length > 0) {
          setPrereqModules((p) => [...p, ...parsed]);
          return;
        }
      }
      const fields = parseKeyValue(text);
      if (target === "basic") {
        if (fields.programme_name) setForm((p) => ({ ...p, programme_name: fields.programme_name }));
        if (fields.slug) setForm((p) => ({ ...p, slug: fields.slug }));
        if (fields.degree_type) setForm((p) => ({ ...p, degree_type: fields.degree_type }));
        if (fields.department) setForm((p) => ({ ...p, department: fields.department }));
        if (fields.duration_text || fields.duration) setForm((p) => ({ ...p, duration_text: fields.duration_text || fields.duration }));
        if (fields.intake_term || fields.intake) setForm((p) => ({ ...p, intake_term: fields.intake_term || fields.intake }));
        if (fields.application_system_type || fields.application_system) setForm((p) => ({ ...p, application_system_type: fields.application_system_type || fields.application_system }));
        if (fields.tuition_fee_overseas_gbp || fields.tuition_fee) setForm((p) => ({ ...p, tuition_fee_overseas_gbp: fields.tuition_fee_overseas_gbp || fields.tuition_fee }));
        if (fields.official_url || fields.url) setForm((p) => ({ ...p, official_url: fields.official_url || fields.url }));
        if (fields.application_deadline_visa || fields.visa_deadline) setForm((p) => ({ ...p, application_deadline_visa: fields.application_deadline_visa || fields.visa_deadline }));
        if (fields.application_deadline_non_visa || fields.non_visa_deadline) setForm((p) => ({ ...p, application_deadline_non_visa: fields.application_deadline_non_visa || fields.non_visa_deadline }));
      }
      if (target === "academic") {
        if (fields.min_degree_level || fields.degree_level) setAcademicReq((p) => ({ ...p, min_degree_level: fields.min_degree_level || fields.degree_level }));
        if (fields.min_uk_classification || fields.uk_classification) setAcademicReq((p) => ({ ...p, min_uk_classification: fields.min_uk_classification || fields.uk_classification }));
        if (fields.prerequisite_module_logic || fields.module_logic) setAcademicReq((p) => ({ ...p, prerequisite_module_logic: fields.prerequisite_module_logic || fields.module_logic }));
        if (fields.work_experience_considered !== undefined) setAcademicReq((p) => ({ ...p, work_experience_considered: ["1", "true", "yes"].includes(fields.work_experience_considered.toLowerCase()) }));
        if (fields.interview_possible !== undefined) setAcademicReq((p) => ({ ...p, interview_possible: ["1", "true", "yes"].includes(fields.interview_possible.toLowerCase()) }));
        if (fields.cv_required !== undefined) setAcademicReq((p) => ({ ...p, cv_required: ["1", "true", "yes"].includes(fields.cv_required.toLowerCase()) }));
        if (fields.portfolio_required !== undefined) setAcademicReq((p) => ({ ...p, portfolio_required: ["1", "true", "yes"].includes(fields.portfolio_required.toLowerCase()) }));
        if (fields.accepted_backgrounds) {
          const majors = fields.accepted_backgrounds.split(/[,;|]/).map((s) => s.trim()).filter(Boolean);
          const matched = CANONICAL_MAJORS.filter((m) => majors.some((j) => m.toLowerCase().includes(j.toLowerCase()) || j.toLowerCase().includes(m.toLowerCase().replace(/_/g, " "))));
          if (matched.length > 0) setAcademicReq((p) => ({ ...p, accepted_backgrounds: matched }));
        }
      }
      if (target === "language") {
        if (fields.english_requirement_level || fields.language_level) setLangReq((p) => ({ ...p, english_requirement_level: fields.english_requirement_level || fields.language_level }));
        if (fields.ielts_overall || fields.ielts) setLangReq((p) => ({ ...p, ielts_overall: fields.ielts_overall || fields.ielts }));
        if (fields.ielts_lrw_min || fields.ielts_min) setLangReq((p) => ({ ...p, ielts_lrw_min: fields.ielts_lrw_min || fields.ielts_min }));
        if (fields.toefl_total || fields.toefl) setLangReq((p) => ({ ...p, toefl_total: fields.toefl_total || fields.toefl }));
        if (fields.pte_total || fields.pte) setLangReq((p) => ({ ...p, pte_total: fields.pte_total || fields.pte }));
        if (fields.duolingo_total || fields.duolingo) setLangReq((p) => ({ ...p, duolingo_total: fields.duolingo_total || fields.duolingo }));
        if (fields.validity_window_months || fields.validity) setLangReq((p) => ({ ...p, validity_window_months: fields.validity_window_months || fields.validity }));
      }
    } catch {
      setPasteError("粘贴文本格式无法识别，请参考示例格式");
    }
  };

  const toggleMajor = (major: string) =>
    setAcademicReq((p) => ({
      ...p,
      accepted_backgrounds: p.accepted_backgrounds.includes(major)
        ? p.accepted_backgrounds.filter((m) => m !== major)
        : [...p.accepted_backgrounds, major],
    }));

  const handleSave = async () => {
    setError("");
    if (!form.university_id || !form.programme_name || !form.slug || !form.official_url) {
      setError("请填写大学、项目名称、Slug 和官方链接");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/programmes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          tuition_fee_overseas_gbp: form.tuition_fee_overseas_gbp ? parseFloat(form.tuition_fee_overseas_gbp) : null,
          application_deadline_visa: form.application_deadline_visa ? new Date(form.application_deadline_visa).toISOString() : null,
          application_deadline_non_visa: form.application_deadline_non_visa ? new Date(form.application_deadline_non_visa).toISOString() : null,
          academic_requirements: academicReq,
          language_requirements: {
            ...langReq,
            ielts_overall: langReq.ielts_overall ? parseFloat(langReq.ielts_overall) : null,
            ielts_lrw_min: langReq.ielts_lrw_min ? parseFloat(langReq.ielts_lrw_min) : null,
            toefl_total: langReq.toefl_total ? parseInt(langReq.toefl_total) : null,
            pte_total: langReq.pte_total ? parseInt(langReq.pte_total) : null,
            duolingo_total: langReq.duolingo_total ? parseInt(langReq.duolingo_total) : null,
            validity_window_months: langReq.validity_window_months ? parseInt(langReq.validity_window_months) : null,
          },
          documents: {
            ...docs,
            references_required_count: docs.references_required_count ? parseInt(docs.references_required_count) : null,
            reference_type_academic_min: docs.reference_type_academic_min ? parseInt(docs.reference_type_academic_min) : null,
          },
          compliance: compliance,
          prerequisite_modules: prereqModules.filter((m) => m.canonical_module_name && m.display_text),
          raw_requirement_text: rawRequirementText,
          parser_version: "v0.1",
          human_verified: false,
        }),
      });

      if (!res.ok) throw new Error((await res.json()).error || "创建失败");
      router.push("/admin/programmes");
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建失败");
    } finally {
      setSaving(false);
    }
  };

  const TABS = [
    { id: "basic", label: "基本信息" },
    { id: "academic", label: "学术要求" },
    { id: "language", label: "语言要求" },
    { id: "documents", label: "材料要求" },
    { id: "compliance", label: "合规/签证" },
    { id: "prereqs", label: "先修课程" },
    { id: "source", label: "原文文本" },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-slate-800 text-white py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <Link href="/admin/programmes" className="text-sm text-slate-400 hover:text-white mb-3 inline-block">← 返回项目列表</Link>
          <h1 className="text-2xl font-bold">添加新项目</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
        {pasteError && <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">{pasteError}</div>}

        <div className="flex gap-1 mb-6 bg-white rounded-xl border border-slate-200 p-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab.id ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Basic Tab */}
        {activeTab === "basic" && (
          <div className="space-y-4">
            <div className={sectionClass}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-slate-900">项目基本信息</h2>
                <button onClick={() => setShowPasteBasic(!showPasteBasic)} className="text-xs text-indigo-500 hover:text-indigo-700 underline">
                  {showPasteBasic ? "收起示例" : "粘贴自动填充"}
                </button>
              </div>
              {showPasteBasic && (
                <div className="mb-4 p-3 bg-slate-100 rounded-lg text-xs text-slate-600 font-mono space-y-1">
                  <pre className="whitespace-pre-wrap">{`项目名称: MSc Power Systems Engineering
Slug: power-systems-msc
学位类型: MSc
学系: Department of Electrical and Electronic Engineering
学制: 1 year
入学时间: 2026-09
申请系统: university_portal
海外学生学费: 28000
签证申请截止: 2026-06-01
官方链接: https://www.example.ac.uk/power-systems`}</pre>
                  <textarea
                    placeholder="粘贴上述格式的文本..."
                    className="w-full mt-2 px-2 py-1.5 border border-indigo-300 rounded text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    rows={11}
                    onPaste={(e) => {
                      e.preventDefault();
                      handlePaste(e.clipboardData.getData("text"), "basic");
                      setShowPasteBasic(false);
                    }}
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={labelClass}>所属大学 *</label>
                  <select className={inputClass} value={form.university_id} onChange={setField("university_id")}>
                    <option value="">选择大学...</option>
                    {universities.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}{u.rank ? ` (Rank ${u.rank})` : ""}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className={labelClass}>项目名称 *</label>
                  <input className={inputClass} value={form.programme_name} onChange={setField("programme_name")} placeholder="如：MSc Power Systems Engineering" />
                </div>
                <div>
                  <label className={labelClass}>Slug *</label>
                  <input className={inputClass} value={form.slug} onChange={setField("slug")} placeholder="如：power-systems-msc" />
                </div>
                <div>
                  <label className={labelClass}>学位类型</label>
                  <select className={inputClass} value={form.degree_type} onChange={setField("degree_type")}>
                    <option value="MSc">MSc</option>
                    <option value="MEng">MEng</option>
                    <option value="MRes">MRes</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className={labelClass}>学系</label>
                  <input className={inputClass} value={form.department} onChange={setField("department")} placeholder="如：Department of Electrical and Electronic Engineering" />
                </div>
                <div>
                  <label className={labelClass}>学制</label>
                  <input className={inputClass} value={form.duration_text} onChange={setField("duration_text")} placeholder="如：1 year" />
                </div>
                <div>
                  <label className={labelClass}>入学时间</label>
                  <input className={inputClass} value={form.intake_term} onChange={setField("intake_term")} placeholder="如：2026-09" />
                </div>
                <div>
                  <label className={labelClass}>申请系统</label>
                  <select className={inputClass} value={form.application_system_type} onChange={setField("application_system_type")}>
                    <option value="university_portal">大学官网申请系统</option>
                    <option value="ucas">UCAS</option>
                    <option value="other">其他</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>海外学生学费（GBP）</label>
                  <input className={inputClass} type="number" value={form.tuition_fee_overseas_gbp} onChange={setField("tuition_fee_overseas_gbp")} placeholder="如：28000" />
                </div>
                <div>
                  <label className={labelClass}>签证申请截止</label>
                  <input className={inputClass} type="date" value={form.application_deadline_visa} onChange={setField("application_deadline_visa")} />
                </div>
                <div>
                  <label className={labelClass}>非签证申请截止</label>
                  <input className={inputClass} type="date" value={form.application_deadline_non_visa} onChange={setField("application_deadline_non_visa")} />
                </div>
                <div className="col-span-2">
                  <label className={labelClass}>官方链接 *</label>
                  <input className={inputClass} type="url" value={form.official_url} onChange={setField("official_url")} placeholder="https://..." />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Academic Tab */}
        {activeTab === "academic" && (
          <div className="space-y-4">
            <div className={sectionClass}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-slate-900">学术要求</h2>
                <button onClick={() => setShowPasteAcademic(!showPasteAcademic)} className="text-xs text-indigo-500 hover:text-indigo-700 underline">
                  {showPasteAcademic ? "收起示例" : "粘贴自动填充"}
                </button>
              </div>
              {showPasteAcademic && (
                <div className="mb-4 p-3 bg-slate-100 rounded-lg text-xs text-slate-600 font-mono space-y-1">
                  <pre className="whitespace-pre-wrap">{`最低学历: bachelor
UK学位等级: 2:1
可接受本科专业: Mechanical Engineering, Electrical Engineering
工作经验考虑: false
面试可能: false
需要CV: false
需要作品集: false`}</pre>
                  <textarea
                    placeholder="粘贴上述格式的文本..."
                    className="w-full mt-2 px-2 py-1.5 border border-indigo-300 rounded text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    rows={9}
                    onPaste={(e) => {
                      e.preventDefault();
                      handlePaste(e.clipboardData.getData("text"), "academic");
                      setShowPasteAcademic(false);
                    }}
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className={labelClass}>最低学历</label>
                  <select className={inputClass} value={academicReq.min_degree_level} onChange={(e) => setAcademicReq((p) => ({ ...p, min_degree_level: e.target.value }))}>
                    <option value="bachelor">本科 (Bachelor)</option>
                    <option value="master">硕士 (Master)</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>UK 学位等级</label>
                  <select className={inputClass} value={academicReq.min_uk_classification} onChange={(e) => setAcademicReq((p) => ({ ...p, min_uk_classification: e.target.value }))}>
                    <option value="">未明确</option>
                    <option value="first">一等荣誉 (First Class)</option>
                    <option value="2:1">二等一 (2:1 / Upper Second)</option>
                    <option value="2:2">二等二 (2:2 / Lower Second)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClass}>可接受本科专业</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {CANONICAL_MAJORS.map((major) => (
                    <button key={major} onClick={() => toggleMajor(major)}
                      className={`px-2 py-1 rounded-full text-xs font-medium border transition-colors ${
                        academicReq.accepted_backgrounds.includes(major)
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-white text-slate-600 border-slate-300"
                      }`}>
                      {major.replace(/_/g, " ")}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                {[
                  { field: "work_experience_considered", label: "考虑工作经验" },
                  { field: "interview_possible", label: "可能有面试" },
                  { field: "cv_required", label: "需要 CV" },
                  { field: "portfolio_required", label: "需要作品集" },
                ].map(({ field, label }) => (
                  <label key={field} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input type="checkbox"
                      checked={academicReq[field as keyof typeof academicReq] as boolean}
                      onChange={(e) => setAcademicReq((p) => ({ ...p, [field]: e.target.checked }))}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Language Tab */}
        {activeTab === "language" && (
          <div className={sectionClass}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900">英语语言要求</h2>
              <button onClick={() => setShowPasteLang(!showPasteLang)} className="text-xs text-indigo-500 hover:text-indigo-700 underline">
                {showPasteLang ? "收起示例" : "粘贴自动填充"}
              </button>
            </div>
            {showPasteLang && (
              <div className="mb-4 p-3 bg-slate-100 rounded-lg text-xs text-slate-600 font-mono space-y-1">
                <pre className="whitespace-pre-wrap">{`英语等级: good
雅思总分: 6.5
雅思最低单项: 6.0
托福总分: 92
PTE总分: 62
Duolingo总分: 120
有效期月数: 24`}</pre>
                <textarea
                  placeholder="粘贴上述格式的文本..."
                  className="w-full mt-2 px-2 py-1.5 border border-indigo-300 rounded text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  rows={8}
                  onPaste={(e) => {
                    e.preventDefault();
                    handlePaste(e.clipboardData.getData("text"), "language");
                    setShowPasteLang(false);
                  }}
                />
              </div>
            )}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className={labelClass}>英语等级</label>
                <select className={inputClass} value={langReq.english_requirement_level} onChange={(e) => setLangReq((p) => ({ ...p, english_requirement_level: e.target.value }))}>
                  <option value="">未明确</option>
                  <option value="standard">Standard</option>
                  <option value="good">Good</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>雅思总分</label>
                <input className={inputClass} type="number" step="0.5" value={langReq.ielts_overall} onChange={(e) => setLangReq((p) => ({ ...p, ielts_overall: e.target.value }))} placeholder="如：6.5" />
              </div>
              <div>
                <label className={labelClass}>雅思最低���项</label>
                <input className={inputClass} type="number" step="0.5" value={langReq.ielts_lrw_min} onChange={(e) => setLangReq((p) => ({ ...p, ielts_lrw_min: e.target.value }))} placeholder="如：6.0" />
              </div>
              <div>
                <label className={labelClass}>托福总分</label>
                <input className={inputClass} type="number" value={langReq.toefl_total} onChange={(e) => setLangReq((p) => ({ ...p, toefl_total: e.target.value }))} placeholder="如：92" />
              </div>
              <div>
                <label className={labelClass}>PTE 总分</label>
                <input className={inputClass} type="number" value={langReq.pte_total} onChange={(e) => setLangReq((p) => ({ ...p, pte_total: e.target.value }))} />
              </div>
              <div>
                <label className={labelClass}>Duolingo 总分</label>
                <input className={inputClass} type="number" value={langReq.duolingo_total} onChange={(e) => setLangReq((p) => ({ ...p, duolingo_total: e.target.value }))} />
              </div>
            </div>
            <div className="text-xs text-slate-400">成绩有效期默认 24 个月。如有特殊要求，请在备注中说明。</div>
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === "documents" && (
          <div className={sectionClass}>
            <h2 className="font-semibold text-slate-900 mb-4">申请材料要求</h2>
            <div className="space-y-3">
              {[
                { field: "transcript_required", label: "成绩单 (Transcript)", desc: "官方英文成绩单" },
                { field: "personal_statement_required", label: "个人陈述 (Personal Statement)", desc: "通常 500-1000 词" },
                { field: "cv_resume_required", label: "简历 (CV / Resume)", desc: "部分项目要求" },
              ].map(({ field, label, desc }) => (
                <label key={field} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                  <div>
                    <div className="text-sm font-medium text-slate-800">{label}</div>
                    <div className="text-xs text-slate-400">{desc}</div>
                  </div>
                  <input type="checkbox"
                    checked={docs[field as keyof typeof docs] as boolean}
                    onChange={(e) => setDocs((p) => ({ ...p, [field]: e.target.checked }))}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600"
                  />
                </label>
              ))}
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <label className={labelClass}>推荐信数量</label>
                  <input className={inputClass} type="number" value={docs.references_required_count} onChange={(e) => setDocs((p) => ({ ...p, references_required_count: e.target.value }))} placeholder="如：2" />
                </div>
                <div>
                  <label className={labelClass}>学术推荐信最低</label>
                  <input className={inputClass} type="number" value={docs.reference_type_academic_min} onChange={(e) => setDocs((p) => ({ ...p, reference_type_academic_min: e.target.value }))} placeholder="如：2" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Compliance Tab */}
        {activeTab === "compliance" && (
          <div className={sectionClass}>
            <h2 className="font-semibold text-slate-900 mb-4">合规与签证</h2>
            <div className="space-y-4">
              <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                <input type="checkbox"
                  checked={compliance.atas_possible}
                  onChange={(e) => setCompliance((p) => ({ ...p, atas_possible: e.target.checked }))}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600"
                />
                <div>
                  <div className="text-sm font-medium text-slate-800">可能涉及 ATAS 认证</div>
                  <div className="text-xs text-slate-400">部分工程类项目需要 Academic Technology Approval Scheme</div>
                </div>
              </label>
              {compliance.atas_possible && (
                <textarea className={inputClass} rows={2} value={compliance.atas_rule_text} onChange={(e) => setCompliance((p) => ({ ...p, atas_rule_text: e.target.value }))} placeholder="ATAS 规则说明，如：Check CAH3 code in offer if applicable" />
              )}
              <div>
                <label className={labelClass}>Graduate Route 说明</label>
                <textarea className={inputClass} rows={2} value={compliance.graduate_route_note} onChange={(e) => setCompliance((p) => ({ ...p, graduate_route_note: e.target.value }))} placeholder="Graduate Route 毕业后可留英时长说明" />
              </div>
              <div>
                <label className={labelClass}>签证截止说明</label>
                <textarea className={inputClass} rows={2} value={compliance.visa_deadline_note} onChange={(e) => setCompliance((p) => ({ ...p, visa_deadline_note: e.target.value }))} placeholder="补充说明签证申请截止日期" />
              </div>
            </div>
          </div>
        )}

        {/* Prerequisites Tab */}
        {activeTab === "prereqs" && (
          <div className={sectionClass}>
            <div className="flex items-center justify-between mb-1">
              <div>
                <h2 className="font-semibold text-slate-900">先修课程要求</h2>
                <p className="text-xs text-slate-500 mt-0.5">系统会尝试将学生的本科课程与以下字段进行匹配。</p>
              </div>
              <button onClick={() => setShowPastePrereq(!showPastePrereq)} className="text-xs text-indigo-500 hover:text-indigo-700 underline">
                {showPastePrereq ? "收起示例" : "粘贴批量添加"}
              </button>
            </div>
            {showPastePrereq && (
              <div className="mb-4 p-3 bg-slate-100 rounded-lg text-xs text-slate-600 font-mono">
                <pre className="whitespace-pre-wrap mb-2">{`mathematics_i | Calculus and Linear Algebra | 60% | 1
physics_i | Fundamentals of Physics | 65% | 1
engineering_mechanics | Engineering Mechanics | 70% | 1
programming_fundamentals | Introduction to Programming | 60% | 0`}</pre>
                <textarea
                  placeholder="粘贴上述格式的先修课程列表（每行一门，用 | 分隔：标准名称 | 显示文本 | 最低成绩 | 是否必修）"
                  className="w-full px-2 py-1.5 border border-indigo-300 rounded text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  rows={5}
                  onPaste={(e) => {
                    e.preventDefault();
                    handlePaste(e.clipboardData.getData("text"), "prereqs");
                    setShowPastePrereq(false);
                  }}
                />
              </div>
            )}
            {prereqModules.map((m, i) => (
              <div key={i} className="border border-slate-200 rounded-lg p-3 mb-3 bg-slate-50">
                <div className="flex gap-2 mb-2">
                  <select className={`${inputClass} w-32`} value={m.canonical_module_name} onChange={updatePrereq(i, "canonical_module_name")}>
                    <option value="">选择标准模块...</option>
                    {CANONICAL_MODULES.map((mod) => (
                      <option key={mod} value={mod}>{mod.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                  <input className={`${inputClass} flex-1`} placeholder="显示文本（如：basic knowledge of applied electricity）" value={m.display_text} onChange={updatePrereq(i, "display_text")} />
                  <label className="flex items-center gap-1 text-xs text-slate-500">
                    <input type="checkbox" checked={m.required} onChange={(e) => setPrereqModules((p) => p.map((mod, idx) => idx === i ? { ...mod, required: e.target.checked } : mod))} />
                    必修
                  </label>
                  <button onClick={() => removePrereq(i)} className="text-red-400 hover:text-red-600 px-2 text-lg">×</button>
                </div>
                <input className={inputClass} placeholder="最低成绩要求（选填，如：70% / B）" value={m.min_grade_rule} onChange={updatePrereq(i, "min_grade_rule")} />
              </div>
            ))}
            <button onClick={addPrereq} className="w-full py-2 border-2 border-dashed border-slate-300 rounded-lg text-sm text-slate-500 hover:border-indigo-400 hover:text-indigo-600">
              + 添加先修课程
            </button>
          </div>
        )}

        {/* Source Text Tab */}
        {activeTab === "source" && (
          <div className={sectionClass}>
            <h2 className="font-semibold text-slate-900 mb-1">原始爬取文本</h2>
            <p className="text-xs text-slate-500 mb-4">粘贴从官网爬取的原始要求文本，用于后续解析验证和人工对照。</p>
            <textarea className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={18} value={rawRequirementText} onChange={(e) => setRawRequirementText(e.target.value)}
              placeholder="粘贴官网原始要求文本（英文）..." />
          </div>
        )}

        <div className="flex gap-3 mt-4">
          <button onClick={() => router.push("/admin/programmes")} className="flex-1 py-3 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-100">取消</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-60">
            {saving ? "创建中..." : "创建项目"}
          </button>
        </div>
      </div>
    </div>
  );
}